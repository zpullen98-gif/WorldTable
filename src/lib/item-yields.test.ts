import { describe, it, expect } from 'vitest';
import {
	recordYield,
	measuredYieldPct,
	mergeItems,
	recordPrice,
	itemUsage,
	YIELD_CAP,
	type Item
} from './items';
import { costingCsv, csvFilename } from './costing-csv';
import type { CostLine } from './costing';

/**
 * Yield tests, stale lines, and the CSV — the item book growing the three
 * things the guide's own economics entry needs it to have.
 */

const T = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

describe('a yield test', () => {
	it('mints an item that has never been priced', () => {
		// The venue weighed the fish before it ever typed a price — still an
		// observation, still worth keeping.
		const out = recordYield({}, 'Whole plaice', 2.4, 1.1, T);
		expect(out['whole plaice'].history).toEqual([]);
		expect(measuredYieldPct(out['whole plaice'])).toBeCloseTo(45.83, 1);
	});

	it('joins an item the book already prices', () => {
		let out = recordPrice({}, 'Whole plaice', 12, 'kg', T);
		out = recordYield(out, 'Whole plaice', 2.0, 0.9, T + DAY);
		expect(out['whole plaice'].history).toHaveLength(1);
		expect(measuredYieldPct(out['whole plaice'])).toBe(45);
	});

	it('is never a default: an untested item reports null, not 100', () => {
		const priced = recordPrice({}, 'Salt', 1, 'kg', T);
		expect(measuredYieldPct(priced.salt)).toBeNull();
		expect(measuredYieldPct(undefined)).toBeNull();
	});

	/**
	 * usable > gross is refused: a line's yield divides a cost and the sheet
	 * caps at 100%. A thing that gains weight in cooking is a PREP with
	 * portions, not a line with a yield.
	 */
	it('refuses what cannot be true', () => {
		expect(recordYield({}, 'Rice', 1, 1.8, T)).toEqual({});
		expect(recordYield({}, 'Fish', 0, 0, T)).toEqual({});
		expect(recordYield({}, 'Fish', 2, -1, T)).toEqual({});
		expect(recordYield({}, '   ', 2, 1, T)).toEqual({});
	});

	it('keeps the newest measurement as the current one, capped', () => {
		let out: Record<string, Item> = {};
		for (let i = 0; i < YIELD_CAP + 4; i++) {
			out = recordYield(out, 'Plaice', 100, 40 + i, T + i * DAY);
		}
		expect(out.plaice.yields).toHaveLength(YIELD_CAP);
		expect(measuredYieldPct(out.plaice)).toBeCloseTo(40 + YIELD_CAP + 3, 9);
	});

	it('unions across two devices like prices do', () => {
		const mine = recordYield({}, 'Plaice', 100, 45, T);
		const theirs = recordYield({}, 'Plaice', 100, 48, T + DAY);
		const out = mergeItems(mine, theirs);
		expect(out.plaice.yields).toHaveLength(2);
		expect(measuredYieldPct(out.plaice)).toBe(48);
		expect(mergeItems(mine, theirs)).toEqual(mergeItems(theirs, mine));
	});

	it('travels even when the item carries no price at all', () => {
		const theirs = recordYield({}, 'Plaice', 100, 45, T);
		const out = mergeItems({}, theirs);
		expect(measuredYieldPct(out.plaice)).toBe(45);
	});
});

describe('the stale lines the reprice instruction needs', () => {
	const items = recordPrice({}, 'Butter', 9.5, 'kg', T + 90 * DAY);
	const l = (over: Partial<CostLine> = {}): CostLine => ({
		id: 'l',
		item: 'Butter',
		unitCost: 6.4,
		unit: 'kg',
		usedQty: 0.05,
		yieldPct: 100,
		...over
	});

	it('names the dish holding an unlinked line at an old price', () => {
		const u = itemUsage(items, [{ id: 'd1', lines: [l()], verdict: 'on' }], []);
		expect(u[0].staleDishIds).toEqual(['d1']);
	});

	/** A linked line follows the book by construction. It cannot be stale. */
	it('never counts a linked line, whatever number it stores', () => {
		const u = itemUsage(
			items,
			[{ id: 'd1', lines: [l({ itemSlug: 'butter', unitCost: 6.4 })], verdict: 'on' }],
			[]
		);
		expect(u[0].staleDishIds).toEqual([]);
		expect(u[0].dishIds).toEqual(['d1']);
	});

	it('does not call a line stale for matching the book', () => {
		const u = itemUsage(items, [{ id: 'd1', lines: [l({ unitCost: 9.5 })], verdict: 'on' }], []);
		expect(u[0].staleDishIds).toEqual([]);
	});

	it('carries the measured yield beside the price', () => {
		const withYield = recordYield(items, 'Butter', 1, 0.98, T);
		const u = itemUsage(withYield, [{ id: 'd1', lines: [l()], verdict: 'on' }], []);
		expect(u[0].yieldPct).toBe(98);
	});
});

describe('the costing CSV — one way, and qualified on every row', () => {
	const dishes = [
		{
			id: 'd1',
			name: 'Braised cheek, "the classic"',
			price: '28',
			sold: 40,
			lines: [{ id: 'l1', item: 'Beef cheek', unitCost: 18, unit: 'kg', usedQty: 0.25, yieldPct: 80 }]
		},
		{
			id: 'd2',
			name: 'Unpriced special',
			price: '',
			sold: null,
			lines: [{ id: 'l2', item: 'Mystery', unitCost: Number.NaN, unit: 'kg', usedQty: 1, yieldPct: 100 }]
		}
	];

	it('writes one qualified row per dish', () => {
		const csv = costingCsv(dishes, [], {}, { inclusive: true, ratePct: 20 }, '2026-08-24');
		const rows = csv.trim().split('\r\n');
		expect(rows).toHaveLength(3);
		expect(rows[0]).toContain('week starting');
		// The quoted name survives its own comma and quotes.
		expect(rows[1]).toContain('"Braised cheek, ""the classic"""');
		// 28 gross -> 23.33 net at 20%; plate 5.63; the basis is stamped on the row.
		expect(rows[1]).toContain('net of 20% tax');
		expect(rows[1]).toContain('23.33');
		expect(rows[1]).toContain('5.63');
		expect(rows[1]).toContain('2026-08-24');
	});

	it('says incomplete in words a spreadsheet will not mangle', () => {
		const csv = costingCsv(dishes, [], {}, undefined, '2026-08-24');
		const rows = csv.trim().split('\r\n');
		expect(rows[2]).toContain('no: lines missing');
		expect(rows[1]).toContain('as typed');
	});

	it('names the file by the day it was cut', () => {
		expect(csvFilename(new Date('2026-08-29T12:00:00Z'))).toBe('costing-2026-08-29.csv');
	});
});
