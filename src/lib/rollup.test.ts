import { describe, it, expect } from 'vitest';
import { rollUpMenu, type RollupDish } from './costing';

/**
 * What the whole menu adds up to.
 *
 * The sheet ranked dishes and never summed them, so "our food cost is 31%" was
 * the arithmetic MEAN of the dish percentages — and the mean is not the number
 * a venue runs at.
 */
const d = (id: string, plateCost: number, price: number | null, sold: number | null): RollupDish => ({
	id,
	name: id,
	plateCost,
	price,
	sold
});

describe('weighted food cost', () => {
	/**
	 * The panel's own worked case: a plowhorse at 42% taking a third of covers
	 * and a puzzle at 22% selling four a week. The mean flatters; the weighted
	 * figure is what left the walk-in over what came through the till.
	 */
	it('is worse than the mean when the expensive dish is the popular one', () => {
		const menu = [d('plowhorse', 4.2, 10, 100), d('puzzle', 2.2, 10, 4)];
		const meanPct = (4.2 / 10 + 2.2 / 10) / 2 * 100; // 32%
		const out = rollUpMenu(menu);
		expect(meanPct).toBeCloseTo(32, 5);
		expect(out.weightedFoodCostPct!).toBeGreaterThan(meanPct);
		expect(out.weightedFoodCostPct!).toBeCloseTo(41.2, 1);
	});

	it('is the money out over the money in', () => {
		const out = rollUpMenu([d('a', 5, 20, 10), d('b', 3, 12, 5)]);
		// cost 50 + 15 = 65; revenue 200 + 60 = 260.
		expect(out.weightedFoodCostPct!).toBeCloseTo(25, 5);
		expect(out.totalContribution).toBeCloseTo(195, 5);
		expect(out.covers).toBe(15);
	});

	it('says nothing when nothing carries both a price and a count', () => {
		const out = rollUpMenu([d('a', 5, null, 10), d('b', 3, 12, null)]);
		expect(out.weightedFoodCostPct).toBeNull();
		expect(out.usable).toBe(0);
		expect(out.of).toBe(2);
	});

	/**
	 * A dish that sold none is not a zero to average in — it is no evidence at
	 * all, and counting it would drag a figure it had no part in.
	 */
	it('excludes a dish that sold none rather than treating it as a zero', () => {
		const out = rollUpMenu([d('a', 5, 20, 10), d('never', 9, 10, 0)]);
		expect(out.usable).toBe(1);
		expect(out.weightedFoodCostPct!).toBeCloseTo(25, 5);
	});

	it('reports how many dishes it could use, so the caller can say so', () => {
		const out = rollUpMenu([d('a', 5, 20, 10), d('b', 3, 12, null), d('c', 2, null, 4)]);
		expect(out.usable).toBe(1);
		expect(out.of).toBe(3);
	});
});

describe('menu mix and the Pareto line', () => {
	it('gives each dish its share of covers', () => {
		const out = rollUpMenu([d('a', 1, 10, 75), d('b', 1, 10, 25)]);
		expect(out.mixPct.get('a')).toBeCloseTo(75, 5);
		expect(out.mixPct.get('b')).toBeCloseTo(25, 5);
	});

	/** Reports the real count at the real share, never asserts 80/20. */
	it('finds the smallest set that is most of the covers', () => {
		const menu = [
			d('a', 1, 10, 50),
			d('b', 1, 10, 30),
			d('c', 1, 10, 10),
			d('d', 1, 10, 5),
			d('e', 1, 10, 5)
		];
		const out = rollUpMenu(menu);
		expect(out.pareto).toEqual({ dishes: 2, of: 5, pct: 80 });
	});

	it('has nothing to say about a one-dish menu', () => {
		expect(rollUpMenu([d('a', 1, 10, 5)]).pareto).toBeNull();
	});

	it('is empty and safe on an empty menu', () => {
		const out = rollUpMenu([]);
		expect(out).toMatchObject({ weightedFoodCostPct: null, covers: 0, usable: 0, of: 0 });
		expect(out.pareto).toBeNull();
	});
});
