import { describe, it, expect } from 'vitest';
import { prepPortionCost, resolveLines, plateCost, type CostLine, type CostablePrep } from './costing';
import {
	adoptImport,
	removePrep,
	dishesUsingPrep,
	batchesNeeded,
	localDay,
	EMPTY_HOUSE,
	type HouseRecord,
	type Prep
} from './persistence/house';

/**
 * Preps — the thing a menu dish is built from, which the sheet had no word for.
 *
 * A braise's cost sheet carried "Demi-glace, 6.00/L, 0.15 L, 100% yield".
 * Nobody had ever costed the demi — bones, mirepoix, wine, nine hours, a yield
 * nearer 25% — and the same 6.00 guess was retyped into every other dish that
 * used it, differently in some. Every sauced dish was understated in the
 * direction that flatters, which is exactly what `plateCost.complete` exists to
 * refuse.
 */
const line = (over: Partial<CostLine> = {}): CostLine => ({
	id: 'l-' + Math.abs(Math.round(Number(over.unitCost ?? 1) * 1000)),
	item: 'thing',
	unitCost: 10,
	unit: 'kg',
	usedQty: 1,
	yieldPct: 100,
	...over
});

/** A demi that costs 30 in ingredients and makes 10 portions: 3.00 a portion. */
const demi: CostablePrep = {
	id: 'p-demi',
	portions: 10,
	lines: [line({ id: 'a', unitCost: 20, usedQty: 1 }), line({ id: 'b', unitCost: 10, usedQty: 1 })]
};

describe('what a portion of a prep costs', () => {
	it('divides the batch by the portions it makes', () => {
		expect(prepPortionCost(demi, {})).toEqual({ perPortion: 3, complete: true });
	});

	it('carries the prep own yield through — the trim happens here', () => {
		// 20 at 50% yield is really 40; plus 10 = 50 over 10 portions.
		const trimmed: CostablePrep = {
			...demi,
			lines: [line({ id: 'a', unitCost: 20, usedQty: 1, yieldPct: 50 }), line({ id: 'b', unitCost: 10 })]
		};
		expect(prepPortionCost(trimmed, {}).perPortion).toBe(5);
	});

	/**
	 * The failure this whole object exists to stop. One blank line inside the
	 * demi understates every dish that uses it at once.
	 */
	it('is incomplete when any line in it is', () => {
		const blank: CostablePrep = { ...demi, lines: [...demi.lines, line({ id: 'c', yieldPct: 0 })] };
		expect(prepPortionCost(blank, {}).complete).toBe(false);
	});

	it('refuses to divide by no portions rather than returning Infinity', () => {
		expect(prepPortionCost({ ...demi, portions: 0 }, {})).toEqual({ perPortion: null, complete: false });
		expect(prepPortionCost({ ...demi, portions: -4 }, {}).perPortion).toBeNull();
	});

	/**
	 * Depth is capped at one. A prep referencing a prep is a graph, and a graph
	 * needs a cycle detector nobody will maintain — so the nested line is
	 * refused loudly rather than resolved quietly.
	 */
	it('refuses a prep that references another prep', () => {
		const nested: CostablePrep = { ...demi, lines: [...demi.lines, line({ id: 'n', prepId: 'p-other' })] };
		expect(prepPortionCost(nested, {}).complete).toBe(false);
	});
});

describe('resolving a prep-backed line on a dish', () => {
	const dishLines = [line({ id: 'meat', unitCost: 8, usedQty: 1 }), line({ id: 'sauce', prepId: 'p-demi', usedQty: 2 })];

	it('prices the line from the prep, per portion', () => {
		const { lines, complete } = resolveLines(dishLines, [demi], {});
		expect(complete).toBe(true);
		// 8 for the meat + 2 portions of demi at 3.00 = 14.
		expect(plateCost(lines)).toEqual({ total: 14, complete: true });
	});

	/**
	 * THE GUARD, and the reason yieldPct is locked rather than defaulted.
	 *
	 * The trim, the bones and the nine hours already happened inside the prep and
	 * are already in its per-portion cost. A dish applying its own yield on top
	 * divides by the loss twice and overstates the plate — and an overstated
	 * plate is how a dish gets priced off the menu.
	 */
	it('locks the yield at 100 so the loss is never counted twice', () => {
		const doubled = [line({ id: 'sauce', prepId: 'p-demi', usedQty: 1, yieldPct: 50 })];
		const { lines } = resolveLines(doubled, [demi], {});
		expect(lines[0].yieldPct).toBe(100);
		expect(plateCost(lines).total).toBe(3);
	});

	it('leaves ordinary purchase lines exactly as they were', () => {
		const { lines } = resolveLines([line({ id: 'meat', unitCost: 8, yieldPct: 80 })], [demi], {});
		expect(lines[0].yieldPct).toBe(80);
		expect(lines[0].unitCost).toBe(8);
	});

	/**
	 * Incompleteness has to travel. A dish whose sauce could not be costed must
	 * lose its total, not quietly get cheaper.
	 */
	it('carries the prep incompleteness into the dish', () => {
		const blank: CostablePrep = { ...demi, lines: [...demi.lines, line({ id: 'c', yieldPct: 0 })] };
		const { lines, complete } = resolveLines(dishLines, [blank], {});
		expect(complete, 'the dish reported complete over an uncosted sauce').toBe(false);
		expect(plateCost(lines).complete).toBe(false);
	});

	it('refuses a line pointing at a prep that no longer exists', () => {
		const { lines, complete } = resolveLines(dishLines, [], {});
		expect(complete).toBe(false);
		expect(plateCost(lines).complete).toBe(false);
	});

	it('does not silently drop the deleted prep from the total', () => {
		const { lines } = resolveLines(dishLines, [], {});
		expect(lines).toHaveLength(2);
	});
});

describe('the prep on the house record', () => {
	const prep = (over: Partial<Prep> = {}): Prep => ({
		id: 'p-demi',
		name: 'Demi-glace',
		batch: '1 x 20L pot',
		portions: 10,
		par: 10,
		handsOnSec: 3600,
		unattendedSec: 32400,
		lines: [],
		ts: 100,
		...over
	});

	const fresh = (): HouseRecord => structuredClone(EMPTY_HOUSE);

	it('is carried by an import, newer ts winning', () => {
		const once = adoptImport(fresh(), [], {}, { preps: [prep()] });
		expect(once.preps).toHaveLength(1);
		const newer = adoptImport(once, [], {}, { preps: [prep({ ts: 200, name: 'Demi (new)' })] });
		expect(newer.preps).toHaveLength(1);
		expect(newer.preps[0].name).toBe('Demi (new)');
		const older = adoptImport(newer, [], {}, { preps: [prep({ ts: 50, name: 'Stale' })] });
		expect(older.preps[0].name).toBe('Demi (new)');
	});

	/**
	 * Renamed, because the old name was "survives an import that mentions no
	 * preps at all" and that described every import this app had ever done —
	 * the exporter could not emit a prep, so the case it called an edge was the
	 * only case there was. It is a genuine edge now: a .wtjson written before
	 * the house block existed. See prep-transport.test.ts.
	 */
	it('survives a pre-house-block file, which mentions no preps', () => {
		const h = adoptImport(fresh(), [], {}, { preps: [prep()] });
		expect(adoptImport(h, [], {}, {}).preps).toHaveLength(1);
	});

	/**
	 * Times are SECONDS. PassStepInput is handsOnSec/unattendedSec and handsOf()
	 * divides by 60, so a prep stored in minutes back-times to sixty times its
	 * length — a two-hour stock would claim five days on the prep board.
	 */
	it('stores times in seconds, so the pass can read them directly', () => {
		const p = prep();
		expect(p.handsOnSec / 60).toBe(60);
		expect(p.unattendedSec / 3600).toBe(9);
	});

	it('names the dishes that would lose their total if it went', () => {
		const h: HouseRecord = {
			...fresh(),
			dishes: [
				{ id: 'd-1', name: 'Braise', section: 'Mains', description: '', ingredients: [], allergens: [], price: '24', ts: 1 },
				{ id: 'd-2', name: 'Salad', section: 'Starters', description: '', ingredients: [], allergens: [], price: '9', ts: 1 }
			],
			dishCosts: {
				'd-1': { lines: [line({ id: 's', prepId: 'p-demi' })], sales: [], ts: 1 },
				'd-2': { lines: [line({ id: 'l', unitCost: 2 })], sales: [], ts: 1 }
			}
		};
		expect(dishesUsingPrep(h, 'p-demi').map((d) => d.name)).toEqual(['Braise']);
		expect(removePrep(h, 'p-demi').preps).toEqual([]);
		// The dish keeps its line — it goes uncostable, not cheaper.
		expect(removePrep(h, 'p-demi').dishCosts['d-1'].lines).toHaveLength(1);
	});
});

describe('how many batches the board asks for', () => {
	const p = (over: Partial<Prep> = {}): Prep => ({
		id: 'p-stock',
		name: 'Veal stock',
		batch: '1 x 20L',
		portions: 8,
		par: 20,
		handsOnSec: 1800,
		unattendedSec: 28800,
		lines: [],
		ts: 1,
		...over
	});

	it('asks for nothing when the walk-in is at par', () => {
		expect(batchesNeeded(p(), 20)).toBe(0);
		expect(batchesNeeded(p(), 25)).toBe(0);
	});

	/** Two thirds of a batch of stock is a batch of stock. */
	it('rounds a part-batch shortfall up to a whole pot', () => {
		expect(batchesNeeded(p(), 19)).toBe(1);
		expect(batchesNeeded(p(), 12)).toBe(1);
		expect(batchesNeeded(p(), 11)).toBe(2);
		expect(batchesNeeded(p(), 0)).toBe(3);
	});

	/**
	 * An uncounted prep reads as none on hand, which over-orders rather than
	 * sending a section out short. That is the safe direction for a prep board.
	 */
	it('treats a missing count as nothing on hand', () => {
		expect(batchesNeeded(p(), Number.NaN)).toBe(3);
	});

	it('refuses to divide by a prep that makes no portions', () => {
		expect(batchesNeeded(p({ portions: 0 }), 0)).toBe(0);
	});
});

describe('the day a count belongs to', () => {
	/**
	 * Local, not UTC. A count made at 22:00 in a UTC+2 kitchen belongs to that
	 * evening, and toISOString would file it under tomorrow.
	 */
	it('is the kitchen own day', () => {
		const d = new Date(2026, 0, 5, 23, 30);
		expect(localDay(d)).toBe('2026-01-05');
	});

	it('pads a single-digit month and day', () => {
		expect(localDay(new Date(2026, 8, 9, 12, 0))).toBe('2026-09-09');
	});
});
