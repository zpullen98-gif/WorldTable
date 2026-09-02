import { describe, it, expect } from 'vitest';
import { filtersFromURL, filtersToSearch, isDefault, discreteSearch } from './urlState';
import { applyFilters } from './filter';
import { COURSES, recipes } from './data';

/**
 * What the URL is allowed to put into the filter state.
 *
 * A filtered view is a shareable link, so every value here arrives from
 * outside: a pasted URL, an old bookmark, someone's hand-edit. This module had
 * no tests at all, and one of its seven fields was a cast rather than a check:
 * `course: (p.get('course') as Course) || null`. Because filter.ts compares
 * with `r.course !== f.course`, any string that was not one of the ten
 * authored courses matched nothing, so `?course=main` showed an empty library
 * over a corpus of 1844 and kept doing it until the tab was closed.
 */

const from = (search: string, chapter: string | null = null) =>
	filtersFromURL(new URL(`https://x/recipes${search}`), chapter);

describe('course, which used to be a cast', () => {
	it('accepts the authored spelling', () => {
		expect(from('?course=Main').course).toBe('Main');
		expect(from('?course=Dessert').course).toBe('Dessert');
	});

	it('folds case rather than emptying the library', () => {
		// The whole bug: this kept 0 of 1844 in every chapter.
		expect(from('?course=main').course).toBe('Main');
		expect(from('?course=MAIN').course).toBe('Main');
		expect(from('?course=dEsSeRt').course).toBe('Dessert');
		expect(from('?course=%20soup%20').course).toBe('Soup');
	});

	it('refuses what is not a course at all, and shows everything instead', () => {
		for (const bad of ['Entree', 'Pudding', 'main course', '1', '../etc', '<script>']) {
			expect(from(`?course=${encodeURIComponent(bad)}`).course, bad).toBeNull();
		}
	});

	it('treats an absent or empty value as no filter', () => {
		expect(from('').course).toBeNull();
		expect(from('?course=').course).toBeNull();
		expect(from('?course=%20').course).toBeNull();
	});

	it('every authored course survives the round trip in either casing', () => {
		for (const c of COURSES) {
			expect(from(`?course=${encodeURIComponent(c)}`).course).toBe(c);
			expect(from(`?course=${encodeURIComponent(c.toLowerCase())}`).course).toBe(c);
		}
	});

	it('a bad link heals itself: what comes back out is the authored spelling', () => {
		// filtersToSearch writes the canonical value, so the next replaceState
		// leaves ?course=Main in the bar rather than the dead ?course=main.
		expect(filtersToSearch(from('?course=main'))).toBe('?course=Main');
		expect(filtersToSearch(from('?course=Entree'))).toBe('');
	});

	it('and the corpus agrees: no accepted course is ever empty', () => {
		for (const c of COURSES) {
			const f = from(`?course=${encodeURIComponent(c.toLowerCase())}`);
			expect(applyFilters(recipes, f).length, c).toBeGreaterThan(0);
		}
		// The value that started this returns the library, not nothing.
		expect(applyFilters(recipes, from('?course=Entree')).length).toBe(recipes.length);
	});
});

describe('the fields that were already checked', () => {
	it('difficulty takes 1, 2 and 3 and nothing else', () => {
		expect(from('?diff=1').difficulty).toBe(1);
		expect(from('?diff=3').difficulty).toBe(3);
		for (const bad of ['0', '4', '2.5', 'easy', '', '-1'])
			expect(from(`?diff=${bad}`).difficulty, bad).toBeNull();
	});

	it('the flags are on only for exactly "1"', () => {
		expect(from('?quick=1').quick).toBe(true);
		expect(from('?veg=1').vegetarian).toBe(true);
		expect(from('?season=1').season).toBe(true);
		for (const bad of ['true', 'yes', '0', ''])
			expect(from(`?quick=${bad}`).quick, bad).toBe(false);
	});

	it('q is free text and is carried through', () => {
		expect(from('?q=cacio%20e%20pepe').q).toBe('cacio e pepe');
		expect(from('').q).toBe('');
	});

	it('chapter comes from the route, never from the query', () => {
		expect(from('?chapter=italian').chapter).toBeNull();
		expect(from('', 'italian').chapter).toBe('italian');
	});
});

describe('the round trip', () => {
	it('a clean view has a clean URL', () => {
		expect(filtersToSearch(from(''))).toBe('');
		expect(isDefault(from(''))).toBe(true);
		expect(isDefault(from('?course=main'))).toBe(false);
	});

	it('survives being written and read again', () => {
		const f = from('?q=ragu&course=soup&diff=2&quick=1&veg=1&season=1');
		const again = from(filtersToSearch(f));
		expect(again).toEqual({ ...f, chapter: null });
	});

	it('a repeated parameter takes the first, and does not throw', () => {
		expect(from('?course=Main&course=Soup').course).toBe('Main');
		expect(from('?course=nonsense&course=Soup').course).toBeNull();
	});
});

describe('discreteSearch: a chip is a choice, a keystroke is not', () => {
	const from = (search: string) => filtersFromURL(new URL(`https://x/recipes${search}`));
	it('is equal for two states that differ only by typing', () => {
		expect(discreteSearch(from('?q=rag&veg=1'))).toBe(discreteSearch(from('?q=ragu&veg=1')));
	});
	it('differs when a chip differs', () => {
		expect(discreteSearch(from('?q=rag&veg=1'))).not.toBe(discreteSearch(from('?q=rag')));
	});
	it('is empty for the default view and for a query alone', () => {
		expect(discreteSearch(from(''))).toBe('');
		expect(discreteSearch(from('?q=rag'))).toBe('');
	});
});
