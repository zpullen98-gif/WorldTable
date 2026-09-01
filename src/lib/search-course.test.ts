import { describe, it, expect } from 'vitest';
import MiniSearch from 'minisearch';
import { miniOptions, fold } from './search-config.mjs';
import indexJson from './data/search-index.json';
import recipesJson from './data/recipes.index.json';
import type { RecipeSummary } from './types';

/**
 * The two searches have to agree about what a course word means.
 *
 * The grid answers the search box twice. Until the index finishes loading it
 * is filter.ts's substring scan over a haystack of name, chapter, COURSE and
 * flavour; after that it is this index. The index had never been given the
 * course field, so the answer changed under the cook with no keystroke:
 *
 *     Dessert   325 cards, then 33
 *     Starter   200 cards, then 13
 *     Main      685 cards, then 63
 *     Breakfast  83 cards, then 17
 *
 * Never empty, always wrong, and always in the direction of losing dishes the
 * cook had just been shown. This asserts against the SHIPPED artifact rather
 * than a fixture, because the defect was that the shipped one was built from a
 * different list of fields than the one the app searches with.
 */

const recipes = recipesJson as unknown as RecipeSummary[];
const mini = MiniSearch.loadJS(indexJson as never, miniOptions as never);
const ids = (q: string) => mini.search(q).map((r) => r.id as number);

const COURSES = [...new Set(recipes.map((r) => r.course))].sort();

/** filter.ts's haystack, verbatim: what the grid shows before the index lands. */
const hay = recipes.map((r) => fold(`${r.name} ${r.chapter} ${r.course} ${r.flavorTags.join(' ')}`));
const substring = (q: string) => {
	const terms = fold(q).trim().split(/\s+/).filter(Boolean);
	const out: number[] = [];
	for (let i = 0; i < recipes.length; i++) if (terms.every((t) => hay[i].includes(t))) out.push(i);
	return out;
};

describe('course words survive the swap', () => {
	it('the corpus still uses exactly ten courses', () => {
		expect(COURSES).toEqual([
			'Bread',
			'Breakfast',
			'Dessert',
			'Drink',
			'Main',
			'Salad',
			'Sauce',
			'Side',
			'Soup',
			'Starter'
		]);
	});

	it('the index is BUILT with course among its fields', () => {
		// The whole defect in one line: the field list the artifact was built
		// from has to be the field list the app searches with.
		expect(miniOptions.fields).toContain('course');
	});

	it('the SHIPPED index was serialized from exactly these fields', () => {
		/*
		 * The drift guard, and it is not hypothetical: while this fix was being
		 * made, `MiniSearch.loadJS` was handed the new six-field config against
		 * the five-field committed artifact and accepted it without a word. The
		 * config header already warns that a drifted `processTerm` "silently
		 * corrupts every lookup rather than erroring"; the field list is the
		 * same hazard and had no guard at all.
		 *
		 * A build gate cannot catch this, because build-data.mjs serializes FROM
		 * miniOptions and so always agrees with itself. The failure is editing
		 * search-config.mjs and not re-running `npm run build:data`, which only
		 * a test against the committed file can see. Same reason
		 * standards.test.ts compares the authored modules to the shipped JSON.
		 */
		const shipped = indexJson as unknown as { fieldIds: Record<string, number> };
		expect(Object.keys(shipped.fieldIds)).toEqual(miniOptions.fields);
	});

	it('searching a course word finds every dish of that course', () => {
		for (const c of COURSES) {
			const want = recipes.map((r, i) => (r.course === c ? i : -1)).filter((i) => i >= 0);
			const got = new Set(ids(c));
			const missing = want.filter((i) => !got.has(i));
			expect(missing.length, `${c}: ${missing.length} of ${want.length} unreachable`).toBe(0);
		}
	});

	it('the grid never SHRINKS when the index replaces the fallback', () => {
		// The index searches ingredients and techniques as well, so it may widen
		// the result. It must never narrow it for a course word: that is the
		// cards-vanishing-under-you failure.
		for (const c of COURSES) {
			const before = substring(c).length;
			const after = ids(c).length;
			expect(after, `${c}: ${before} cards became ${after}`).toBeGreaterThanOrEqual(before);
		}
	});

	it('lower case works too, since nobody capitalises a search box', () => {
		for (const c of COURSES) expect(ids(c.toLowerCase()).length).toBe(ids(c).length);
	});

	it('a course word opens with dishes of that course, where no name competes', () => {
		/* Course is boosted to 1, the bottom of the scale, so it wins only when
		   nothing better matches. These three have no dish NAMED after them. */
		for (const c of ['Dessert', 'Sauce', 'Soup']) {
			const top = ids(c).slice(0, 3);
			expect(top.length).toBeGreaterThan(0);
			for (const i of top) expect(recipes[i].course, `${c} top result`).toBe(c);
		}
	});

	it('but a dish NAMED after a course still outranks the course itself', () => {
		/*
		 * Deliberate, and the reason course sits at boost 1. "Starter" opens with
		 * Rye Sourdough Starter, which is a Bread, because a name match is the
		 * most specific evidence in the index and a course label the least: ten
		 * values across 1844 recipes. Raising the boost to make the course win
		 * here would displace better evidence everywhere else — measured, top-1
		 * flips climb 16, 18, 19, 21, 21, 24 as the boost goes 0.5 to 8.
		 *
		 * The recall guarantee above is what matters and is unaffected: all 199
		 * Starters are still in the result, just not all at the top.
		 */
		const starter = ids('Starter');
		expect(recipes[starter[0]].name).toBe('Rye Sourdough Starter');
		expect(recipes[starter[0]].course).not.toBe('Starter');
		expect(starter.filter((i) => recipes[i].course === 'Starter').length).toBeGreaterThan(190);
	});

	it('fuzzy is floored, so a five-letter query cannot reach a course word', () => {
		/*
		 * Adding `course` gave the index ten very short, very populous terms, and
		 * fuzzy 0.2 handed them to any five-letter query: typing the real dish
		 * name "Maine Lobster Roll" flooded the grid with 693 cards at character
		 * five, 677 of them every Main in the book, because "maine" is one edit
		 * from "main". The floor is six characters, on the QUERY's word.
		 */
		expect(ids('Maine').length).toBeLessThan(30);
		expect(ids('Maine').filter((i) => recipes[i].course === 'Main').length).toBeLessThan(20);
		// The exact word still reaches the whole course: this is a floor, not a ban.
		expect(ids('Main').filter((i) => recipes[i].course === 'Main').length).toBe(
			recipes.filter((r) => r.course === 'Main').length
		);
		// And six letters and up keep their fuzz, which is what the folding needs.
		expect(ids('brulee').length).toBeGreaterThan(0);
		expect(ids('cilbir').length).toBeGreaterThan(0);
	});
});
