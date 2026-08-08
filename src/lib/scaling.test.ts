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
