import { describe, it, expect } from 'vitest';
import {
	houseSnapshot,
	housePortable,
	adoptImport,
	EMPTY_HOUSE,
	type HouseRecord,
	type Prep
} from './persistence/house';
import { FORMAT, buildExport, parseImport, describeImport } from './persistence/portable';
import { mergeSessions, EMPTY_SESSION, type SessionState } from './persistence/state';
import { resolveLines, plateCost, type CostLine } from './costing';

/**
 * A prep crossing the transport.
 *
 * THE DEFECT THIS FILE EXISTS FOR. adoptImport() has taken a `preps` argument
 * and merged it by id since preps shipped, and nothing ever passed one —
 * houseSnapshot emitted `menuDishes` and `dishCosts`, and both call sites in
 * menu/+page.svelte called adopt() with two arguments. Every export a venue
 * ever wrote carried zero preps, so the feature whose entire purpose is
 * "cost the demi ONCE" could not leave the tablet it was typed on.
 *
 * Measured on the braise below: 8.625 a plate at the first site, 5.625 and
 * `complete: false` at the second, with the sauce simply absent from the
 * arithmetic and no way back but retyping every prep by hand.
 *
 * preps.test.ts carried a case named "survives an import that mentions no preps
 * at all". That was not an edge case: it was every import there had ever been.
 */

const demi: Prep = {
	id: 'p-demi',
	name: 'Demi-glace',
	batch: '1 x 20L pot',
	portions: 10,
	par: 20,
	handsOnSec: 3600,
	unattendedSec: 32400,
	lines: [
		{ id: 'a', item: 'Veal bones', unitCost: 20, unit: 'kg', usedQty: 1, yieldPct: 100 },
		{ id: 'b', item: 'Mirepoix', unitCost: 10, unit: 'kg', usedQty: 1, yieldPct: 100 }
	],
	ts: 1000
};

/** Beef cheek at 18/kg and 80% yield, 250g, plus one portion of demi at 3.00. */
const braise: CostLine[] = [
	{ id: 'l1', item: 'Beef cheek', unitCost: 18, unit: 'kg', usedQty: 0.25, yieldPct: 80 },
	{
		id: 'l2',
		item: 'Demi-glace',
		unitCost: 0,
		unit: 'portion',
		usedQty: 1,
		yieldPct: 100,
		prepId: 'p-demi'
	}
];

const PLATE = (18 / 0.8) * 0.25 + 3; // 8.625

const siteA = (): HouseRecord => ({
	...structuredClone(EMPTY_HOUSE),
	dishes: [
		{
			id: 'd1',
			name: 'Braised cheek',
			section: 'Mains',
			description: 'Cheek, demi, mash',
			ingredients: ['beef cheek', 'demi-glace'],
			allergens: [],
			price: '28',
			ts: 1000
		}
	],
	preps: [structuredClone(demi)],
	dishCosts: { d1: { lines: structuredClone(braise), sales: [], ts: 1000 } }
});

/** Export the way menu/+page.svelte does, then read it back the same way. */
function roundTrip(h: HouseRecord) {
	const file = buildExport(
		{ ...EMPTY_SESSION, ...houseSnapshot(h) } as SessionState,
		970,
		housePortable(h)
	);
	return parseImport(JSON.stringify(file));
}

const costOf = (h: HouseRecord) => {
	const { lines, complete } = resolveLines(h.dishCosts.d1.lines, h.preps);
	return { ...plateCost(lines), resolved: complete };
};

describe('a prep crosses the transport', () => {
	it('costs the braise at the site that typed it', () => {
		const c = costOf(siteA());
		expect(c.resolved).toBe(true);
		expect(c.complete).toBe(true);
		expect(c.total).toBeCloseTo(PLATE, 6);
	});

	it('carries the preps in the file', () => {
		expect(roundTrip(siteA()).house?.preps).toHaveLength(1);
	});

	/**
	 * The PLACEMENT is the point, not merely the presence. mergeSessions spreads
	 * `...incoming` ahead of its named fields, so a prep inside `data` would be
	 * written into the per-profile session record — the one line this app draws.
	 */
	it('keeps them out of the session block', () => {
		const parsed = roundTrip(siteA());
		expect('preps' in parsed.data).toBe(false);
		const merged = mergeSessions(structuredClone(EMPTY_SESSION), parsed.data);
		expect('preps' in merged).toBe(false);
	});

	it('costs the same braise at the second site', () => {
		const parsed = roundTrip(siteA());
		const siteB = adoptImport(
			structuredClone(EMPTY_HOUSE),
			parsed.data.menuDishes,
			parsed.data.dishCosts,
			parsed.house ?? {}
		);
		expect(siteB.preps).toHaveLength(1);
		const c = costOf(siteB);
		expect(c.resolved).toBe(true);
		expect(c.total).toBeCloseTo(PLATE, 6);
	});

	/**
	 * What the bug actually cost, kept as an executable record: the refusal
	 * worked, so nobody was shown a wrong total — they were shown no total, on
	 * every sauced dish, with the demi missing from the sum.
	 */
	it('is what the second site used to see', () => {
		const a = siteA();
		const siteB = adoptImport(structuredClone(EMPTY_HOUSE), a.dishes, a.dishCosts, {});
		const c = costOf(siteB);
		expect(siteB.preps).toHaveLength(0);
		expect(c.resolved).toBe(false);
		expect(c.total).toBeCloseTo(5.625, 6);
	});
});

describe('merging preps between two sites', () => {
	const recosted: Prep = {
		...structuredClone(demi),
		lines: [
			{ id: 'a', item: 'Veal bones', unitCost: 26, unit: 'kg', usedQty: 1, yieldPct: 100 },
			{ id: 'b', item: 'Mirepoix', unitCost: 10, unit: 'kg', usedQty: 1, yieldPct: 100 }
		],
		ts: 2000
	};

	it('takes the newer costing of the same prep', () => {
		const out = adoptImport(siteA(), [], {}, { preps: [recosted] });
		expect(out.preps).toHaveLength(1);
		expect(out.preps[0].ts).toBe(2000);
		// 26 + 10 over 10 portions = 3.60, so the plate moves by 0.60.
		expect(costOf(out).total).toBeCloseTo(PLATE + 0.6, 6);
	});

	it('refuses an older costing of the same prep', () => {
		const stale: Prep = { ...recosted, ts: 500 };
		const out = adoptImport(siteA(), [], {}, { preps: [stale] });
		expect(out.preps[0].ts).toBe(1000);
		expect(costOf(out).total).toBeCloseTo(PLATE, 6);
	});

	/**
	 * Every .wtjson written before this change has no house block at all, and
	 * one must never take a venue's preps away.
	 */
	it('leaves local preps alone when the file has no house block', () => {
		// Hand-built rather than made by buildExport, which cannot omit the block
		// any more — that requirement is the fix, so the old shape has to be
		// written out longhand to keep being tested against.
		const v3 = JSON.stringify({
			format: FORMAT,
			version: 3,
			exportedAt: '2026-01-01T00:00:00.000Z',
			app: { version: '2.0.0', recipeCount: 970 },
			data: { ...EMPTY_SESSION, ...houseSnapshot(siteA()) }
		});
		const parsed = parseImport(v3);
		expect(parsed.house).toBeUndefined();
		const out = adoptImport(
			siteA(),
			parsed.data.menuDishes,
			parsed.data.dishCosts,
			parsed.house ?? {}
		);
		expect(out.preps).toHaveLength(1);
		expect(costOf(out).total).toBeCloseTo(PLATE, 6);
	});

	it('re-importing your own export changes nothing', () => {
		const a = siteA();
		const parsed = roundTrip(a);
		const out = adoptImport(a, parsed.data.menuDishes, parsed.data.dishCosts, parsed.house ?? {});
		expect(out.preps).toHaveLength(1);
		expect(out.preps[0].ts).toBe(1000);
		expect(costOf(out).total).toBeCloseTo(PLATE, 6);
	});
});

describe('the banner says what the preps will do', () => {
	const current = () =>
		({
			...structuredClone(EMPTY_SESSION),
			...houseSnapshot(siteA()),
			...housePortable(siteA())
		}) as SessionState & { preps?: Prep[] };

	it('counts a prep the venue does not have', () => {
		const stock: Prep = { ...structuredClone(demi), id: 'p-stock', name: 'Chicken stock' };
		const out = describeImport({ preps: [stock] }, current());
		expect(out).toContain('1 prep');
		expect(out).not.toContain('re-costed');
	});

	/**
	 * The clause that matters. Re-costing one demi moves the plate cost of every
	 * dish that pours it, so a silent merge is the same failure as the banner
	 * that read "nothing new" over an evening of covers.
	 */
	it('says when a prep will be re-costed over the top of the live one', () => {
		const out = describeImport({ preps: [{ ...structuredClone(demi), ts: 9000 }] }, current());
		expect(out).toContain('1 prep re-costed');
	});

	it('stays quiet about a prep that is not newer', () => {
		const out = describeImport({ preps: [{ ...structuredClone(demi), ts: 10 }] }, current());
		expect(out).toBe('nothing new — this file matches what you already have');
	});

	it('pluralises', () => {
		const two = [
			{ ...structuredClone(demi), id: 'p-1' },
			{ ...structuredClone(demi), id: 'p-2' }
		];
		expect(describeImport({ preps: two }, current())).toContain('2 preps');
	});
});
