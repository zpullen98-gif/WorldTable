import { describe, it, expect } from 'vitest';
import { QUICK_ROUND, countWord, quickLine, quickOrder, quickSources, quickSplit, quickTargets } from './quick-quiz';

/**
 * The quick quiz's mix since Cuisine (12 Oct 2026): four from the menu, four
 * from the level and two from Cuisine, eight and two without a house, each
 * side topping up the others.
 */

describe('quickTargets', () => {
	it('asks four, four and two with a house, and eight and two without', () => {
		expect(quickTargets(true)).toEqual({ house: 4, level: 4, cuisine: 2 });
		expect(quickTargets(false)).toEqual({ house: 0, level: 8, cuisine: 2 });
	});
});

describe('quickSplit', () => {
	const plenty = { house: 10, level: 10, cuisine: 10 };

	it('gives each side its share when every side has enough', () => {
		expect(quickSplit(quickTargets(true), plenty)).toEqual({ house: 4, level: 4, cuisine: 2 });
		expect(quickSplit(quickTargets(false), plenty)).toEqual({ house: 0, level: 8, cuisine: 2 });
	});

	it('with no Cuisine to ask, deals five and five, the round before Cuisine', () => {
		expect(quickSplit(quickTargets(true), { house: 10, level: 10, cuisine: 0 })).toEqual({ house: 5, level: 5, cuisine: 0 });
		expect(quickSplit(quickTargets(false), { house: 0, level: 10, cuisine: 0 })).toEqual({ house: 0, level: 10, cuisine: 0 });
	});

	it('tops a short side up from the others, and a short round stays short only when nothing is left', () => {
		expect(quickSplit(quickTargets(true), { house: 10, level: 2, cuisine: 10 })).toEqual({ house: 5, level: 2, cuisine: 3 });
		expect(quickSplit(quickTargets(true), { house: 1, level: 10, cuisine: 1 })).toEqual({ house: 1, level: 8, cuisine: 1 });
		expect(quickSplit(quickTargets(false), { house: 0, level: 3, cuisine: 10 })).toEqual({ house: 0, level: 3, cuisine: 7 });
		expect(quickSplit(quickTargets(true), { house: 1, level: 2, cuisine: 1 })).toEqual({ house: 1, level: 2, cuisine: 1 });
		expect(quickSplit(quickTargets(true), { house: 0, level: 0, cuisine: 0 })).toEqual({ house: 0, level: 0, cuisine: 0 });
	});

	it('never deals more than a side has, nor more than a round', () => {
		for (const hasHouse of [true, false]) {
			for (const h of [0, 1, 4, 10]) {
				for (const l of [0, 3, 8, 10]) {
					for (const z of [0, 1, 2, 10]) {
						const avail = { house: hasHouse ? h : 0, level: l, cuisine: z };
						const s = quickSplit(quickTargets(hasHouse), avail);
						expect(s.house).toBeLessThanOrEqual(avail.house);
						expect(s.level).toBeLessThanOrEqual(avail.level);
						expect(s.cuisine).toBeLessThanOrEqual(avail.cuisine);
						expect(s.house + s.level + s.cuisine).toBe(Math.min(QUICK_ROUND, avail.house + avail.level + avail.cuisine));
					}
				}
			}
		}
	});
});

describe('quickOrder', () => {
	it('alternates the house and the level and spreads Cuisine, its last question last', () => {
		expect(quickOrder(['h1', 'h2', 'h3', 'h4'], ['l1', 'l2', 'l3', 'l4'], ['z1', 'z2'])).toEqual(['h1', 'l1', 'h2', 'l2', 'z1', 'h3', 'l3', 'h4', 'l4', 'z2']);
		expect(quickOrder([], ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8'], ['z1', 'z2'])).toEqual(['l1', 'l2', 'l3', 'l4', 'z1', 'l5', 'l6', 'l7', 'l8', 'z2']);
	});

	it('keeps every list whole and in its own order', () => {
		const out = quickOrder(['h1', 'h2', 'h3', 'h4', 'h5'], ['l1', 'l2'], ['z1', 'z2', 'z3']);
		expect(out).toHaveLength(10);
		expect(out.filter((x) => x.startsWith('h'))).toEqual(['h1', 'h2', 'h3', 'h4', 'h5']);
		expect(out.filter((x) => x.startsWith('l'))).toEqual(['l1', 'l2']);
		expect(out.filter((x) => x.startsWith('z'))).toEqual(['z1', 'z2', 'z3']);
		expect(out[9]).toBe('z3');
		expect(quickOrder(['h1'], ['l1'], [])).toEqual(['h1', 'l1']);
		expect(quickOrder([], [], ['z1', 'z2'])).toEqual(['z1', 'z2']);
	});
});

describe('the words', () => {
	it('names the sources a round drew on', () => {
		expect(quickSources(['house', 'deck', 'cuisine'], 'Commis')).toBe('the menu, Commis and Cuisine');
		expect(quickSources(['lexicon', 'cuisine'], 'Chef')).toBe('Chef and Cuisine');
		expect(quickSources(['house', 'deck'], 'Chef')).toBe('the menu and Chef');
		expect(quickSources(['deck'], 'Sous Chef')).toBe('Sous Chef');
		expect(quickSources([], 'Sous Chef')).toBe('Sous Chef');
	});

	it('says the line in words, the level named and never numbered', () => {
		expect(quickLine(true, true, 'Commis')).toBe('Ten questions: four from the menu, four from Commis and two from Cuisine.');
		expect(quickLine(false, true, 'Chef de Partie')).toBe('Ten questions: eight from Chef de Partie and two from Cuisine.');
		expect(quickLine(true, false, 'Commis')).toBe('Ten questions: five from the menu, five from Commis.');
		expect(quickLine(false, false, 'Chef')).toBe('Ten questions from Chef.');
		expect(countWord(10)).toBe('ten');
		expect(countWord(12)).toBe('12');
		for (const s of [quickLine(true, true, 'Chef'), quickLine(false, true, 'Chef')]) expect(s).not.toMatch(/[\u2013\u2014]|--|\d/);
	});
});
