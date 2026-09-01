/**
 * The grid filter predicate.
 *
 * Ported from the original `matches()` (L1906) and its later wrapper (L3311),
 * with the `R.indexOf(r)` lookups removed. Those ran inside a predicate that was
 * itself applied across all 970 recipes, so a single keystroke cost ~970 linear
 * scans of a 970-element array. Everything the predicate needs now lives on the
 * record.
 *
 * Pure and synchronous: no closures over module state, so it is trivially
 * testable and cannot go stale the way the original's rebound listeners did.
 */
import type { FilterState, RecipeSummary } from './types';
import { QUICK_MINUTES, ADVANCE_MIN } from './types';

/** NFD-fold so an unaccented query matches an accented dish. */
export function fold(s: string): string {
	return s
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();
}

/** Haystack for the cheap substring pass. Built once per recipe, memoised. */
const haystacks = new WeakMap<RecipeSummary, string>();
function haystack(r: RecipeSummary): string {
	let h = haystacks.get(r);
	if (h === undefined) {
		h = fold(`${r.name} ${r.chapter} ${r.course} ${r.flavorTags.join(' ')}`);
		haystacks.set(r, h);
	}
	return h;
}

export function matches(r: RecipeSummary, f: FilterState, month?: number): boolean {
	if (f.chapter && r.chapterSlug !== f.chapter) return false;
	if (f.course && r.course !== f.course) return false;
	if (f.difficulty && r.difficulty !== f.difficulty) return false;
	/*
	 * "Under 40 min" is a promise about when you eat, and `minutes` is ACTIVE
	 * minutes by contract: a three week cure with twenty minutes of work is 20.
	 * Both halves are needed, or the filter answers with Guanciale (30 active
	 * minutes, five weeks hanging), Preserved Lemons and Sauerkraut. 109 dishes
	 * passed on the active number alone. See tools/derive/advance.mjs.
	 */
	if (f.quick && r.minutes > QUICK_MINUTES) return false;
	if (f.quick && (r.advanceMin ?? 0) >= ADVANCE_MIN) return false;
	if (f.vegetarian && !r.diet.vegetarian) return false;

	if (f.season && month) {
		// A dish naming no seasonal produce is always available, not never.
		if (r.season.length && !r.season.includes(month)) return false;
	}

	if (f.q) {
		const q = fold(f.q).trim();
		if (q) {
			const hay = haystack(r);
			// Every whitespace-separated term must appear (AND), matching the
			// original's behaviour.
			for (const term of q.split(/\s+/)) {
				if (!hay.includes(term)) return false;
			}
		}
	}

	return true;
}

export function applyFilters(
	all: RecipeSummary[],
	f: FilterState,
	month?: number
): RecipeSummary[] {
	return all.filter((r) => matches(r, f, month));
}

/** Northern-canonical month, shifted six months for southern users. */
export function effectiveMonth(hemisphere: 'N' | 'S', now = new Date()): number {
	const m = now.getMonth() + 1;
	return hemisphere === 'S' ? ((m + 5) % 12) + 1 : m;
}
