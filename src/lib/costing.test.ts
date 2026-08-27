import { describe, it, expect } from 'vitest';
import {
	trueUnitCost,
	lineCost,
	plateCost,
	parsePrice,
	dishEconomics,
	bandFor,
	engineerMenu,
	money,
	type CostLine,
	type Band
} from './costing';

const line = (over: Partial<CostLine> = {}): CostLine => ({
	id: 'l1',
	item: 'Salmon',
	unitCost: 12,
	unit: 'kg',
	usedQty: 0.2,
	yieldPct: 100,
	...over
});

const FOOD_COST: Band = {
	key: 'foodCost',
	label: 'Food cost',
	lowPct: 25,
	highPct: 35,
	note: ''
};

describe('yield, which is the whole point', () => {
	/** The guide's own worked example, to the digit. */
	it('turns $12/kg at 45% yield into $26.67/kg on the plate', () => {
		expect(trueUnitCost(12, 45)!).toBeCloseTo(26.666, 2);
	});

	it('leaves a 100% yield alone', () => {
		expect(trueUnitCost(12, 100)).toBe(12);
	});

	it('refuses a zero or negative yield rather than returning Infinity', () => {
		expect(trueUnitCost(12, 0)).toBeNull();
		expect(trueUnitCost(12, -5)).toBeNull();
	});

	it('costs a line through the yield, not around it', () => {
		// 0.2 kg of a $12/kg fish that trims to 45%: 0.2 x 26.67
		expect(lineCost(line({ yieldPct: 45 }))!).toBeCloseTo(5.333, 2);
		// The rookie version — invoice price x quantity — would say 2.40.
		expect(lineCost(line({ yieldPct: 45 }))!).not.toBeCloseTo(2.4, 2);
	});
});

describe('adding a plate up', () => {
	it('sums the lines', () => {
		const r = plateCost([line({ unitCost: 10, usedQty: 1 }), line({ id: 'l2', unitCost: 4, usedQty: 0.5 })]);
		expect(r.total).toBeCloseTo(12, 5);
		expect(r.complete).toBe(true);
	});

	/**
	 * A total that silently drops an uncostable line reads as authority and is
	 * simply wrong — and it is wrong in the direction that makes a dish look
	 * more profitable than it is, which is how it gets priced.
	 */
	it('says so when a line could not be costed, and does not quietly include it', () => {
		const r = plateCost([line({ unitCost: 10, usedQty: 1 }), line({ id: 'l2', yieldPct: 0 })]);
		expect(r.complete).toBe(false);
		expect(r.total).toBeCloseTo(10, 5);
	});

	it('an empty sheet costs nothing and is complete', () => {
		expect(plateCost([])).toEqual({ total: 0, complete: true });
	});
});

describe('the price a venue actually typed', () => {
	it.each([
		['14', 14],
		['14.50', 14.5],
		['£14.50', 14.5],
		['$14.50', 14.5],
		['€14.50', 14.5],
		['14,50', 14.5],
		['1,250.00', 1250],
		[18, 18]
	])('reads %s as %s', (raw, want) => {
		expect(parsePrice(raw as string | number)).toBe(want);
	});

	it.each([[''], ['market price'], ['—'], [null], [undefined]])(
		'returns null for %s rather than guessing',
		(raw) => {
			expect(parsePrice(raw as string | null)).toBeNull();
		}
	);
});

describe('what the plate earns', () => {
	it('gives food cost percent and contribution', () => {
		const e = dishEconomics([line({ unitCost: 10, usedQty: 0.5 })], '20.00');
		expect(e.plateCost).toBeCloseTo(5, 5);
		expect(e.foodCostPct).toBeCloseTo(25, 5);
		expect(e.contribution).toBeCloseTo(15, 5);
	});

	it('withholds the percentage rather than dividing by an absent price', () => {
		const e = dishEconomics([line()], 'market price');
		expect(e.price).toBeNull();
		expect(e.foodCostPct).toBeNull();
		expect(e.contribution).toBeNull();
	});

	it('withholds it for a free dish too', () => {
		expect(dishEconomics([line()], '0').foodCostPct).toBeNull();
	});
});

describe('scoring against the guide’s band', () => {
	it.each([
		[20, 'under'],
		[25, 'on'],
		[30, 'on'],
		[35, 'on'],
		[41, 'over']
	])('%i%% reads as %s', (pct, want) => {
		expect(bandFor(pct as number, FOOD_COST)).toBe(want);
	});

	it('is unknown without a percentage', () => {
		expect(bandFor(null, FOOD_COST)).toBe('unknown');
	});
});

describe('menu engineering', () => {
	const d = (id: string, contribution: number, sold: number) => ({ id, name: id, contribution, sold });

	it('sorts four dishes into the guide’s four quadrants', () => {
		// Mean contribution is 10. Fair share is 100 sold; the floor is 70.
		const out = engineerMenu([
			d('star', 15, 150),
			d('plowhorse', 5, 150),
			d('puzzle', 15, 10),
			d('dog', 5, 10)
		]);
		const by = Object.fromEntries(out.map((x) => [x.id, x.quadrant]));
		expect(by).toEqual({ star: 'star', plowhorse: 'plowhorse', puzzle: 'puzzle', dog: 'dog' });
	});

	/**
	 * A median would force half the menu to be unpopular however evenly it
	 * sells. The 70%-of-fair-share rule is the standard one and does not.
	 */
	it('does not condemn half an evenly-selling menu to being unpopular', () => {
		const out = engineerMenu([d('a', 10, 100), d('b', 10, 100), d('c', 10, 100)]);
		expect(out.every((x) => x.popular)).toBe(true);
	});

	/**
	 * The 0.7 factor, exercised. Fair share here is 93.3 and the floor is 65.3,
	 * so the dish selling 80 is BELOW its fair share and still popular. Without
	 * the factor this test passes by accident on an evenly-selling menu, which
	 * is how the first version of it was written and why it caught nothing.
	 */
	it('counts a dish just under fair share as popular', () => {
		const out = engineerMenu([d('a', 10, 100), d('b', 10, 100), d('c', 10, 80)]);
		expect(out.find((x) => x.id === 'c')!.popular).toBe(true);
	});

	it('still calls a genuine straggler unpopular', () => {
		const out = engineerMenu([d('a', 10, 100), d('b', 10, 100), d('c', 10, 5)]);
		expect(out.find((x) => x.id === 'c')!.popular).toBe(false);
	});

	it('leaves out dishes nobody priced or counted — the origin is not a dog', () => {
		const out = engineerMenu([
			{ id: 'priced', name: 'priced', contribution: 10, sold: 40 },
			{ id: 'noprice', name: 'noprice', contribution: null, sold: 40 },
			{ id: 'nosales', name: 'nosales', contribution: 10, sold: null },
			{ id: 'zero', name: 'zero', contribution: 10, sold: 0 }
		]);
		expect(out.map((x) => x.id)).toEqual(['priced']);
	});

	it('ranks by total contribution, not by margin per plate', () => {
		// The guide's lesson: dollars pay rent, percentages do not.
		const out = engineerMenu([d('high-margin-slow', 20, 10), d('low-margin-fast', 6, 200)]);
		expect(out[0].id).toBe('low-margin-fast');
	});

	it('returns nothing at all rather than a chart of one imaginary dish', () => {
		expect(engineerMenu([])).toEqual([]);
		expect(engineerMenu([{ id: 'a', name: 'a', contribution: null, sold: null }])).toEqual([]);
	});
});

describe('money', () => {
	it('never renders negative zero', () => {
		expect(money(-0.001)).toBe('0.00');
		expect(money(0)).toBe('0.00');
	});
	it('keeps two decimals', () => {
		expect(money(5)).toBe('5.00');
		expect(money(5.336)).toBe('5.34');
	});
});
