import { describe, it, expect } from 'vitest';
import { STANDARDS, MIN_MARKS, MAX_MARKS } from '../../tools/derive/standards.mjs';
import full from './data/recipes.full.json';
import study from './data/study.json';

import type { RecipeDetail, StandardMark as Mark } from './types';

/**
 * The standard — what a correct plate looks like — and the one failure the build
 * gate cannot catch.
 *
 * `tools/build-data.mjs` already refuses a standard whose slug matches no
 * recipe, a duplicate, a missing fault, or a mark count outside the range. All
 * of that runs at BUILD time, against the authored module. What it cannot see is
 * the far likelier mistake: somebody edits standards.mjs, does not re-run
 * `npm run build:data`, and commits an authored file that disagrees with the
 * shipped JSON. The app reads only the JSON, so the edit silently does nothing.
 *
 * So these assertions read the SHIPPED data and compare it back to the source.
 */
const detail = full as unknown as RecipeDetail[];
const bySlug = new Map(detail.map((r) => [r.slug, r]));
const spine = [...new Set((study as Array<{ recipes: string[] }>).flatMap((s) => s.recipes))];

describe('the authored standards reached the shipped data', () => {
	it('every authored standard is in recipes.full.json', () => {
		const missing = STANDARDS.filter(
			(s: { slug: string }) => !bySlug.get(s.slug)?.standard
		).map((s: { slug: string }) => s.slug);
		expect(missing, 'standards.mjs was edited without re-running build:data').toEqual([]);
	});

	it('ships exactly the authored set — no stale entries the source no longer has', () => {
		const authored = new Set(STANDARDS.map((s: { slug: string }) => s.slug));
		const shipped = detail.filter((r) => r.standard).map((r) => r.slug);
		expect(shipped.filter((s) => !authored.has(s))).toEqual([]);
		expect(shipped.length).toBe(authored.size);
	});

	it('carries the marks and fault through unchanged', () => {
		for (const s of STANDARDS as Array<{ slug: string; marks: Mark[]; fault: string }>) {
			expect(bySlug.get(s.slug)?.standard?.marks).toEqual(s.marks);
			expect(bySlug.get(s.slug)?.standard?.fault).toBe(s.fault);
		}
	});
});

describe('a standard is a checklist, not a recipe', () => {
	it(`gives every dish ${MIN_MARKS}–${MAX_MARKS} marks`, () => {
		const bad = STANDARDS.filter(
			(s: { slug: string; marks: Mark[] }) =>
				s.marks.length < MIN_MARKS || s.marks.length > MAX_MARKS
		).map((s: { slug: string; marks: Mark[] }) => `${s.slug} (${s.marks.length})`);
		expect(bad).toEqual([]);
	});

	it('states a fault for every dish', () => {
		const bare = STANDARDS.filter((s: { slug: string; fault: string }) => !s.fault?.trim());
		expect(bare.map((s: { slug: string }) => s.slug)).toEqual([]);
	});

	/**
	 * A mark has to be checkable. These are the shapes that are provably not —
	 * an instruction tells the cook what to DO, when the whole point is to say
	 * what to LOOK FOR, and a mark that opens by naming an ingredient quantity is
	 * the method leaking back in.
	 */
	it('does not smuggle method in as outcome', () => {
		const instruction = /^(use|add|stir|heat|cook|season|place|remove|whisk|fold|pour|set) /i;
		const offenders: string[] = [];
		for (const s of STANDARDS as Array<{ slug: string; marks: Mark[] }>) {
			for (const m of s.marks)
				if (instruction.test(m.text.trim())) offenders.push(`${s.slug}: ${m.text}`);
		}
		expect(offenders).toEqual([]);
	});

	it('is never the flavour prose reworded', () => {
		// A mark repeating its own recipe's note verbatim adds nothing; the note
		// is already on the page directly beneath it.
		const echoes: string[] = [];
		for (const s of STANDARDS as Array<{ slug: string; marks: Mark[] }>) {
			const note = bySlug.get(s.slug)?.note ?? '';
			for (const m of s.marks) {
				const core = m.text.trim().replace(/[.;:—-].*$/, '').trim();
				if (core.length > 24 && note.includes(core)) echoes.push(`${s.slug}: ${core}`);
			}
		}
		expect(echoes).toEqual([]);
	});
});

describe('the Path of Study', () => {
	it('is the scope, and is fully covered', () => {
		const covered = new Set(STANDARDS.map((s: { slug: string }) => s.slug));
		expect(spine.filter((slug) => !covered.has(slug))).toEqual([]);
	});

	it('leaves the rest of the guide without a standard, not with an empty one', () => {
		// 925 dishes have none. The recipe page tests for the key, so an empty
		// array would render a heading over nothing.
		const empty = detail.filter((r) => r.standard && r.standard.marks.length === 0);
		expect(empty.map((r) => r.slug)).toEqual([]);
	});
});
