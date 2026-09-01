import { describe, it, expect } from 'vitest';
import MiniSearch from 'minisearch';
import { miniOptions, fold } from './search-config.mjs';
import { fold as filterFold } from './filter';
import index from './data/recipes.index.json';

/**
 * Typing a dish's name on a plain keyboard.
 *
 * Seven dishes returned an EMPTY GRID for their own names, because NFD folding
 * only separates a base letter from its combining marks and leaves ı, æ and ø
 * standing. The index held "cılbır"; a cook typing "Cilbir" was two edits away
 * against a fuzzy budget of round(0.2 × 6) = 1, and `combineWith: 'AND'` turns
 * one unmatched term into no results at all rather than into worse ones.
 *
 * Smørrebrød was never in the list, and that is the tell: at ten characters its
 * budget is two, which is exactly what its two ø's cost. The old rule worked
 * only for names long enough to buy their way out.
 */

const THE_SEVEN: [string, string][] = [
	['Imam Bayildi', 'İmam Bayıldı'],
	['Kiymali Pide', 'Kıymalı Pide'],
	['Cilbir', 'Çılbır'],
	['Fistikli Baklava', 'Fıstıklı Baklava'],
	['Kayseri Mantisi', 'Kayseri Mantısı'],
	['Stegt Flaesk med Persillesovs', 'Stegt Flæsk med Persillesovs'],
	['Flaeskesteg med Sprod Svaer', 'Flæskesteg med Sprød Svær']
];

describe('fold', () => {
	it('substitutes the letters NFD cannot take apart', () => {
		expect(fold('Çılbır')).toBe('cilbir');
		expect(fold('Flæsk')).toBe('flaesk');
		expect(fold('Smørrebrød')).toBe('smorrebrod');
		expect(fold('Gołąbki')).toBe('golabki');
		expect(fold('İmam Bayıldı')).toBe('imam bayildi');
	});

	it('still does what it always did to combining marks', () => {
		expect(fold('Ragù')).toBe('ragu');
		expect(fold('Crème Brûlée')).toBe('creme brulee');
		expect(fold('Salade Niçoise')).toBe('salade nicoise');
	});

	it('folds the typed form and the printed form to the same string', () => {
		// This is the whole fix: both spellings have to arrive at one term.
		for (const [typed, printed] of THE_SEVEN) expect(fold(typed)).toBe(fold(printed));
	});

	it('is one function, not two copies', () => {
		// filter.ts fed the substring scan the grid uses until the index loads.
		// A second copy of the rule changed the results mid-keystroke.
		expect(filterFold).toBe(fold);
	});
});

describe('the seven dishes, against the real index', () => {
	type Row = { name: string; chapter: string; flavorTags: string[] };
	const rows = index as unknown as Row[];

	/* Rebuilt here rather than loading the shipped artifact: this test is about
	   the fold, and building from the same options proves the index the build
	   writes would answer the same way. */
	const mini = new MiniSearch(miniOptions);
	mini.addAll(
		rows.map((r, id) => ({
			id,
			name: r.name,
			chapter: r.chapter,
			ingredients: '',
			flavor: (r.flavorTags ?? []).join(' '),
			technique: ''
		}))
	);
	const ids = (q: string) => mini.search(q).map((r) => r.id as number);

	it('each one is found by the name a keyboard can type, and ranked first', () => {
		for (const [typed, printed] of THE_SEVEN) {
			const want = rows.findIndex((r) => r.name === printed);
			expect(want, `${printed} must still be in the corpus`).toBeGreaterThan(-1);
			const got = ids(typed);
			expect(got.length, `"${typed}" returned an empty grid`).toBeGreaterThan(0);
			expect(got[0], `"${typed}" should find ${printed} first`).toBe(want);
		}
	});

	it('the accented spelling still works, so nobody lost anything', () => {
		for (const [, printed] of THE_SEVEN) {
			const want = rows.findIndex((r) => r.name === printed);
			expect(ids(printed)[0]).toBe(want);
		}
	});

	it('every dish in the corpus can find itself by its plain-keyboard name', () => {
		// The general form of the bug: 209 names change under a plain keyboard.
		let empty = 0;
		let missing = 0;
		for (let i = 0; i < rows.length; i++) {
			const typed = fold(rows[i].name);
			const got = ids(typed);
			if (!got.length) empty++;
			else if (!got.includes(i)) missing++;
		}
		expect(empty, 'dishes returning an empty grid for their own name').toBe(0);
		expect(missing, 'dishes absent from their own results').toBe(0);
	});
});

/**
 * The same defect wearing two other characters, found by a sweep of the search
 * path after the seven were fixed. Both were already settled law in the URL
 * bar: slugify has deleted apostrophes and spelled out "&" from the beginning.
 * Only the search box disagreed.
 */
describe('an apostrophe a cook does not type', () => {
	type Row = { name: string; chapter: string; flavorTags: string[] };
	const rows = index as unknown as Row[];
	const mini = new MiniSearch(miniOptions);
	mini.addAll(
		rows.map((r, id) => ({
			id,
			name: r.name,
			chapter: r.chapter,
			ingredients: '',
			flavor: (r.flavorTags ?? []).join(' '),
			technique: ''
		}))
	);
	const ids = (q: string) => mini.search(q).map((r) => r.id as number);

	it('finds the dish whether or not the apostrophe is typed', () => {
		// "zaatar" is how English usually writes it, and it found NOTHING.
		const named = (n: string) => rows.findIndex((r) => r.name === n);
		expect(ids('zaatar').length).toBeGreaterThan(0);
		expect(ids('Manoushe Zaatar')[0]).toBe(named("Man'oushe Za'atar"));
		expect(ids('Oka ia')[0]).toBe(named("Oka i'a"));
		expect(ids('Taameya')[0]).toBe(named("Ta'ameya"));
		expect(ids('Kaak al-Quds')[0]).toBe(named("Ka'ak al-Quds"));
	});

	it('all 27 apostrophe dishes survive having it dropped', () => {
		let empty = 0;
		for (let i = 0; i < rows.length; i++) {
			if (!/['’]/.test(rows[i].name)) continue;
			if (!ids(rows[i].name.replace(/['’]/g, '')).includes(i)) empty++;
		}
		expect(empty).toBe(0);
	});
});

describe('an ampersand a cook types as a word', () => {
	type Row = { name: string; chapter: string; flavorTags: string[] };
	const rows = index as unknown as Row[];
	const mini = new MiniSearch(miniOptions);
	mini.addAll(
		rows.map((r, id) => ({
			id,
			name: r.name,
			chapter: r.chapter,
			ingredients: '',
			flavor: (r.flavorTags ?? []).join(' '),
			technique: ''
		}))
	);
	const ids = (q: string) => mini.search(q).map((r) => r.id as number);
	const named = (n: string) => rows.findIndex((r) => r.name === n);

	it('finds the dish when "&" is written out', () => {
		expect(ids('Baked Mac and Cheese')[0]).toBe(named('Baked Mac & Cheese'));
		expect(ids('Beef and Broccoli')[0]).toBe(named('Beef & Broccoli'));
		expect(ids('Lamb and Apricot Tagine')[0]).toBe(named('Lamb & Apricot Tagine'));
	});

	it('ranks the dish itself first, not a namesake', () => {
		/* "red beans and rice" used to return 18 cards led by Cuban Black Beans
		   and Rice, with the dish it names absent from all of them. */
		expect(ids('red beans and rice')[0]).toBe(named('Red Beans & Rice'));
	});

	it('all 11 ampersand dishes survive it being spelled out', () => {
		let lost = 0;
		for (let i = 0; i < rows.length; i++) {
			if (!rows[i].name.includes('&')) continue;
			if (!ids(rows[i].name.replace(/&/g, 'and')).includes(i)) lost++;
		}
		expect(lost).toBe(0);
	});

	it('does not index the conjunction it just manufactured', () => {
		/* spell() turns every "&" into "and", so indexing the word would put it
		   on 1542 of 1844 documents and then let combineWith AND demand it
		   back. Dropped at processTerm instead: the substitution exists for the
		   substring haystack, which is never tokenized. */
		expect(miniOptions.processTerm?.('and', 'name')).toBeFalsy();
		expect(miniOptions.processTerm?.('And', 'name')).toBeFalsy();
		expect(ids('and')).toHaveLength(0);
		// A real term of the same length is untouched.
		expect(miniOptions.processTerm?.('egg', 'name')).toBe('egg');
	});

	it('leaves the ordinary corpus alone', () => {
		/* Counts are not asserted: this fixture indexes name/chapter/flavor
		   only, so they differ from the shipped index, which also carries
		   ingredients and techniques. The invariants are what must hold. */
		const named = (n: string) => rows.findIndex((r) => r.name === n);
		expect(ids('ragu')).toContain(named('Ragù alla Bolognese'));
		// And still must NOT reach asparagus, which the old substring scan did.
		expect(ids('ragu')).not.toContain(named('Idaho Morel and Asparagus Saute'));
		expect(ids('nicoise')).toContain(named('Salade Niçoise'));
		expect(ids('brulee')).toContain(named('Crème Brûlée'));
	});
});
