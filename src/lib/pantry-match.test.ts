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

describe('a keyword must not claim the longer word it merely prefixes', () => {
	/* The left boundary stops "sage" matching "sausage". It cannot stop a
	   keyword that starts a DIFFERENT ingredient, and 528 pantry claims across
	   the corpus were exactly that. Each case below is a real ingredient line. */

	it('does not read minced garlic as ground meat', () => {
		// 'mince' claimed "minced garlic" 181 times, so Ground meat was asserted
		// by 201 recipes of which about 85 had no meat in them at all.
		expect(hasWord('4 garlic cloves, minced', 'mince')).toBe(false);
		expect(hasWord('2 shallots, minced fine', 'mince')).toBe(false);
	});

	it('still reads the real thing as ground meat', () => {
		expect(hasWord('500g mince', 'mince')).toBe(true);
		expect(hasWord('500g minced beef', 'minced beef')).toBe(true);
		expect(hasWord('400g ground pork', 'ground pork')).toBe(true);
	});

	it('does not read cornstarch, cornmeal or a Cornish pasty as corn', () => {
		expect(hasWord('1 tbsp cornstarch slurry', 'corn')).toBe(false);
		expect(hasWord('200g cornmeal', 'corn')).toBe(false);
		expect(hasWord('cornish pasty', 'corn')).toBe(false);
		expect(hasWord('120ml corn syrup', 'corn')).toBe(false);
	});

	it('still reads real corn, including masa, as corn', () => {
		expect(hasWord('4 ears of corn', 'corn')).toBe(true);
		expect(hasWord('300g masa harina', 'masa')).toBe(true);
	});

	it('keeps the collisions the survey found, each a different ingredient', () => {
		expect(hasWord('250ml buttermilk', 'butter')).toBe(false);
		expect(hasWord('2 tsp masala', 'masa')).toBe(false);
		expect(hasWord('1 tbsp tamarind paste', 'tamari')).toBe(false);
		expect(hasWord('2 anchovy fillets', 'ancho')).toBe(false);
		expect(hasWord('1 stalk lemongrass', 'lemon')).toBe(false);
		expect(hasWord('100g rice flour', 'rice ')).toBe(false);
		expect(hasWord('200g cream cheese', 'cream ')).toBe(false);
		expect(hasWord('1 bunch parsley', 'bun')).toBe(false);
		expect(hasWord('1 large eggplant', 'egg')).toBe(false);
		expect(hasWord('50g breadcrumbs', 'bread')).toBe(false);
	});

	it('leaves the plain forms alone, which is what the stems are for', () => {
		expect(hasWord('115g butter, softened', 'butter')).toBe(true);
		expect(hasWord('2 tbsp tamari', 'tamari')).toBe(true);
		expect(hasWord('juice of 1 lemon', 'lemon')).toBe(true);
		expect(hasWord('300g rice ', 'rice ')).toBe(true);
		expect(hasWord('4 eggs', 'egg')).toBe(true);
		expect(hasWord('2 burger buns', 'bun')).toBe(true);
		expect(hasWord('anchovies, chopped', 'anchov')).toBe(true);
		expect(hasWord('500g cherries', 'cherr')).toBe(true);
	});

	it('does not invent a peak month from a collision', () => {
		// 79 recipes carried a season they had no produce for. hasWord is the one
		// helper behind both surfaces, so the season line is fixed by the same
		// table: cornstarch is not sweetcorn, and sweetcorn is what has a season.
		const season = { Corn: [7, 8, 9] };
		const shelf = [{ g: 'Produce', items: [{ l: 'Corn', k: ['corn', 'masa'], d: '' }] }];
		expect(deriveSeason('2 tbsp cornstarch, slaked', season, shelf)).toEqual([]);
		expect(deriveSeason('4 ears of corn', season, shelf)).toEqual([7, 8, 9]);
	});
});
