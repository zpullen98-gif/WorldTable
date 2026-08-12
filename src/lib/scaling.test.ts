import { describe, it, expect } from 'vitest';
import { scaleLine, convertLine, fmtNum } from './scaling';

describe('fmtNum', () => {
	it('rounds to whole numbers when close', () => {
		expect(fmtNum(4)).toBe('4');
		expect(fmtNum(3.995)).toBe('4');
	});
	it('prefers vulgar fractions', () => {
		expect(fmtNum(0.5)).toBe('½');
		expect(fmtNum(0.25)).toBe('¼');
		expect(fmtNum(1.5)).toBe('1½');
	});
});

describe('scaleLine', () => {
	it('is identity at ×1', () => {
		const s = '400g spaghetti or tonnarelli';
		expect(scaleLine(s, 1)).toBe(s);
	});

	it('scales a simple quantity', () => {
		expect(scaleLine('220g flour', 2)).toBe('440g flour');
	});

	// The partial-number backtrack guard. Without it the regex matches "22"
	// inside "220", scales it to 44, and emits "4402g" — off by a factor of ten
	// in a way that looks plausible on the page.
	it('does not backtrack into a longer number', () => {
		expect(scaleLine('220g flour', 2)).not.toContain('4402');
	});

	// A fat ratio is a ratio, not a quantity — doubling the batch must not turn
	// 80/20 chuck into 160/20 chuck. Both halves are guarded: the numerator by
	// the `/\d` lookahead, the denominator by the preceding-slash check.
	it('leaves both halves of a ratio alone', () => {
		expect(scaleLine('80/20 chuck', 2)).toBe('80/20 chuck');
		expect(scaleLine('~80/20 fat and huge beefy flavor', 2)).toBe(
			'~80/20 fat and huge beefy flavor'
		);
	});

	it('leaves temperatures alone', () => {
		expect(scaleLine('bake at 180°C', 2)).toBe('bake at 180°C');
		expect(scaleLine('heat oil to 190C', 3)).toBe('heat oil to 190C');
	});

	it('leaves times alone', () => {
		expect(scaleLine('simmer 20 min', 2)).toBe('simmer 20 min');
		expect(scaleLine('rest 2 hours', 4)).toBe('rest 2 hours');
		expect(scaleLine('grill 15–20 minutes', 2)).toBe('grill 15–20 minutes');
	});

	it('scales mixed ascii fractions', () => {
		expect(scaleLine('1 1/2 tsp salt', 2)).toBe('3 tsp salt');
	});

	it('scales proper ascii fractions', () => {
		expect(scaleLine('1/2 tsp soda', 2)).toBe('1 tsp soda');
	});

	it('scales unicode fractions', () => {
		expect(scaleLine('½ tsp baking powder', 2)).toBe('1 tsp baking powder');
		expect(scaleLine('2 tsp salt', 0.5)).toBe('1 tsp salt');
	});

	it('halves into a fraction', () => {
		expect(scaleLine('1 onion', 0.5)).toBe('½ onion');
	});

	it('handles a real corpus line', () => {
		expect(scaleLine('120g Pecorino Romano, finely grated', 2)).toBe(
			'240g Pecorino Romano, finely grated'
		);
	});
});

describe('convertLine', () => {
	it('is identity in metric', () => {
		expect(convertLine('400g spaghetti', 'metric')).toBe('400g spaghetti');
	});

	it('converts kg to lb', () => {
		expect(convertLine('1kg potatoes', 'us')).toBe('2.2 lb potatoes');
	});

	it('converts grams above the noise floor', () => {
		expect(convertLine('400g flour', 'us')).toBe('14.1 oz flour');
	});

	it('leaves small gram amounts alone', () => {
		// 7g yeast is more useful as 7g than as 0.2 oz.
		expect(convertLine('7g yeast', 'us')).toBe('7g yeast');
	});

	// The original produced "356F" — it consumed the degree sign from "°C" and
	// never wrote one back.
	it('keeps the degree sign on converted temperatures', () => {
		expect(convertLine('bake at 180°C', 'us')).toBe('bake at 356°F');
	});

	it('converts millilitres and litres', () => {
		expect(convertLine('500ml stock', 'us')).toBe('16.9 fl oz stock');
		expect(convertLine('1.2L water', 'us')).toBe('1.3 qt water');
	});

	it('converts centimetres', () => {
		expect(convertLine('10cm piece kombu', 'us')).toBe('3.9 in piece kombu');
	});
});

/**
 * Things that are NOT quantities of the dish.
 *
 * Every case below was wrong in production, and every one of them prints a
 * confident number a cook might act on. In a guide, a wrong number is the worst
 * possible output: it looks like a measurement.
 */
describe('scaling leaves alone what does not scale', () => {
	it('does not resize the pan', () => {
		// "Butter a 23x33cm pan" was doubling to a 46x66cm pan. Both halves of
		// the pair must be immune, including the first, which carries no unit.
		expect(scaleLine('Butter a 23x33cm pan.', 2)).toBe('Butter a 23x33cm pan.');
		expect(scaleLine('Press into a lined 20x20cm pan', 2)).toBe('Press into a lined 20x20cm pan');
		expect(scaleLine('2 thick pork loin chops (2.5cm)', 2)).toBe('4 thick pork loin chops (2.5cm)');
		expect(scaleLine('Oil for frying (cast iron, 2cm deep)', 2)).toBe(
			'Oil for frying (cast iron, 2cm deep)'
		);
	});

	it('does not lengthen a ferment', () => {
		// Doubling a batch does not double the time it takes to sour.
		expect(scaleLine('refrigerate 3–5 days, turning daily', 2)).toBe(
			'refrigerate 3–5 days, turning daily'
		);
		// The range separator may be a word, not a dash.
		expect(scaleLine('marinated 3 TO 5 DAYS in advance', 2)).toBe('marinated 3 TO 5 DAYS in advance');
		expect(scaleLine('RESTED 2 days minimum', 2)).toBe('RESTED 2 days minimum');
		// ...while the quantity on the same line still scales.
		expect(scaleLine('1.5kg beef rump — marinated 3 TO 5 DAYS', 2)).toBe(
			'3kg beef rump — marinated 3 TO 5 DAYS'
		);
	});

	it('distinguishes "each" the per-unit size from "each" the distributive', () => {
		// Per-unit: the count scales, the size of one does not.
		expect(scaleLine('2 beef patties (200g each)', 2)).toBe('4 beef patties (200g each)');
		expect(scaleLine('2 live lobsters, 600g each', 2)).toBe('4 live lobsters, 600g each');
		// Distributive — "two tablespoons of each of these" — and must scale.
		// 34 of the corpus's 40 "each" lines are this kind, so a blanket rule
		// would do more damage than the bug.
		expect(scaleLine('2 tbsp each soy and mirin, 1 tsp sugar', 2)).toBe(
			'4 tbsp each soy and mirin, 2 tsp sugar'
		);
		expect(scaleLine('1 tsp each sugar, mirin, soy', 2)).toBe('2 tsp each sugar, mirin, soy');
	});

	it('does not resize a tin you cannot buy', () => {
		expect(scaleLine('1 can (395g) sweetened condensed milk', 2)).toBe(
			'2 can (395g) sweetened condensed milk'
		);
		expect(scaleLine('1 tin (400g) tomatoes', 2)).toBe('2 tin (400g) tomatoes');
	});

	/**
	 * The guard rails. Each of these scaled CORRECTLY before the fix, and the
	 * obvious implementations of it break them — a blanket "never scale inside
	 * parentheses" rule breaks all four.
	 */
	it('still scales breakdowns, alternatives and equivalences', () => {
		expect(scaleLine('500g bread flour (450g white + 50g whole wheat)', 2)).toBe(
			'1000g bread flour (900g white + 100g whole wheat)'
		);
		expect(scaleLine('2 cans fava beans (or 400g dried, soaked)', 2)).toBe(
			'4 cans fava beans (or 800g dried, soaked)'
		);
		expect(scaleLine('Juice of 6–8 limes (about 150ml)', 2)).toBe('Juice of 12–16 limes (about 300ml)');
		expect(scaleLine('600g large prawns (keep 4 heads for the oil)', 2)).toBe(
			'1200g large prawns (keep 8 heads for the oil)'
		);
	});
});

describe('conversion handles dimension pairs', () => {
	it('converts both halves, not just the one carrying the unit', () => {
		// "23x33cm" became "23x13 in" — a tin that does not exist.
		expect(convertLine('Butter a 23x33cm pan.', 'us')).toBe('Butter a 9.1x13 in pan.');
		expect(convertLine('a 20x20cm pan', 'us')).toBe('a 7.9x7.9 in pan');
		expect(convertLine('Roll the dough to a 40x50cm rectangle', 'us')).toBe(
			'Roll the dough to a 15.7x19.7 in rectangle'
		);
	});
});
