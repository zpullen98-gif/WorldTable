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
