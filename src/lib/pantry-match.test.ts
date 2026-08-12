import { describe, it, expect } from 'vitest';
import { hasWord, deriveSeason } from '../../tools/derive/season.mjs';

/**
 * Word-boundary matching for the shelf.
 *
 * Pantry Match answers "what can I cook from what is in the fridge", and a bare
 * substring test made it lie: 35 of Sage's 42 recipes came from SAUsage, so
 * Feijoada and Jambalaya were sage recipes. Corn came from pepperCORNs (Cacio e
 * Pepe), Peas from chickPEAS (Hummus), Milk from butterMILK.
 */
describe('hasWord', () => {
	it('will not match inside a longer word', () => {
		expect(hasWord('chicken and sausage jambalaya', 'sage')).toBe(false);
		expect(hasWord('2 tsp black peppercorns', 'corn')).toBe(false);
		expect(hasWord('300g dried chickpeas', 'peas')).toBe(false);
		expect(hasWord('500ml buttermilk', 'milk')).toBe(false);
	});

	it('still matches the real thing', () => {
		expect(hasWord('1 tbsp chopped sage', 'sage')).toBe(true);
		expect(hasWord('2 ears of corn', 'corn')).toBe(true);
		expect(hasWord('200g peas, podded', 'peas')).toBe(true);
		expect(hasWord('500ml whole milk', 'milk')).toBe(true);
	});

	/**
	 * The shelf is full of deliberate stems, so the boundary is LEFT-ONLY. A
	 * right boundary would break every one of these.
	 */
	it('matches stems, because the shelf is written in them', () => {
		expect(hasWord('500g sour cherries', 'cherr')).toBe(true);
		expect(hasWord('2 bay leaves', 'bay lea')).toBe(true);
		expect(hasWord('anchovies, rinsed', 'anchov')).toBe(true);
	});

	it('matches at the very start of the text', () => {
		expect(hasWord('sage butter', 'sage')).toBe(true);
	});
});

describe('deriveSeason', () => {
	const SEASON = { 'Stone fruit': [6, 7, 8], Asparagus: [4, 5] };
	const PANTRY = [
		{
			g: 'Produce',
			items: [{ l: 'Stone fruit', k: ['peach', 'apricot', 'plum', 'nectarine', 'cherr'], d: '' }]
		}
	];

	/**
	 * The label is a CATEGORY no recipe would ever write, so matching it
	 * literally found nothing and 29 dishes naming the fruit had no season.
	 * The original matched the shelf's keyword list instead.
	 */
	it('matches a category label through the pantry shelf keywords', () => {
		expect(deriveSeason('lamb and apricot tagine', SEASON, PANTRY)).toEqual([6, 7, 8]);
		expect(deriveSeason('500g sour cherries', SEASON, PANTRY)).toEqual([6, 7, 8]);
	});

	it('falls back to the label for produce that is not on the shelf', () => {
		expect(deriveSeason('500g asparagus, trimmed', SEASON, PANTRY)).toEqual([4, 5]);
	});

	it('gives a dish with no seasonal produce no season at all', () => {
		// Cacio e Pepe used to read as seasonal because "peppercorns" matched Corn.
		expect(deriveSeason('cacio e pepe: spaghetti, pecorino, black peppercorns', SEASON, PANTRY)).toEqual(
			[]
		);
	});
});
