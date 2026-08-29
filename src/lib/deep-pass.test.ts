import { describe, it, expect } from 'vitest';
import { mergeSessions, EMPTY_SESSION, type SessionState } from './persistence/state';
import { adoptImport, EMPTY_HOUSE, type HouseRecord } from './persistence/house';
import { recordPrice, recordYield, measuredYieldPct, previousPrice, priceMovePct } from './items';
import { parsePrice } from './costing';

/**
 * Regression pins for the deep pass — each of these was a confirmed finding
 * from the six-lens review, verified against the code before it was fixed.
 */

const T = 1_700_000_000_000;

describe('finding: stepActuals and planRun fell through the merge spread', () => {
	const mine = (): SessionState => ({
		...structuredClone(EMPTY_SESSION),
		stepActuals: { 'coq-au-vin#2#5': [340, 355, 348] },
		planRun: { menuHash: 'h', serviceTime: '19:00', startedAt: T, ticks: {} }
	});

	/** The real export shape: EMPTY_SESSION always carries the keys present. */
	it('a full-state import cannot wipe observed step timings', () => {
		const out = mergeSessions(mine(), structuredClone(EMPTY_SESSION));
		expect(out.stepActuals['coq-au-vin#2#5']).toEqual([340, 355, 348]);
	});

	it('two devices’ observations union per key, newest kept in the window', () => {
		const theirs = {
			...structuredClone(EMPTY_SESSION),
			stepActuals: { 'coq-au-vin#2#5': [400], 'other#1#3': [90] }
		};
		const out = mergeSessions(mine(), theirs);
		expect(out.stepActuals['coq-au-vin#2#5']).toEqual([340, 355, 348, 400]);
		expect(out.stepActuals['other#1#3']).toEqual([90]);
	});

	it('the window stays at 12, matching the store', () => {
		const theirs = {
			...structuredClone(EMPTY_SESSION),
			stepActuals: { k: Array.from({ length: 20 }, (_, i) => 100 + i) }
		};
		const out = mergeSessions({ ...structuredClone(EMPTY_SESSION), stepActuals: { k: [1, 2] } }, theirs);
		expect(out.stepActuals.k).toHaveLength(12);
		expect(out.stepActuals.k.at(-1)).toBe(119);
	});

	/** A run is one device's live service clock, like the 86 board. */
	it('an import never installs someone else’s live service run', () => {
		const theirs = {
			...structuredClone(EMPTY_SESSION),
			planRun: { menuHash: 'x', serviceTime: '21:00', startedAt: T + 1, ticks: {} }
		};
		expect(mergeSessions(mine(), theirs).planRun?.serviceTime).toBe('19:00');
		expect(mergeSessions(structuredClone(EMPTY_SESSION), theirs).planRun).toBeUndefined();
	});
});

describe('finding: any reprice destroyed the yield tests', () => {
	it('a new price keeps the yields', () => {
		let book = recordYield({}, 'Plaice', 100, 45, T);
		book = recordPrice(book, 'Plaice', 12, 'kg', T + 1000_000);
		expect(measuredYieldPct(book.plaice)).toBe(45);
		expect(book.plaice.history).toHaveLength(1);
	});

	it('a same-price rename keeps the yields', () => {
		let book = recordPrice({}, 'plaice', 12, 'kg', T);
		book = recordYield(book, 'plaice', 100, 45, T + 1);
		book = recordPrice(book, 'Plaice', 12, 'kg', T + 2);
		expect(book.plaice.name).toBe('Plaice');
		expect(measuredYieldPct(book.plaice)).toBe(45);
	});
});

describe('finding: previous price compared across purchase units', () => {
	it('a unit change re-bases the series instead of reading as a tiny move', () => {
		let book = recordPrice({}, 'Butter', 190, 'case', T);
		book = recordPrice(book, 'Butter', 7.9, 'kg', T + 90 * 86_400_000);
		expect(previousPrice(book.butter)).toBeNull();
		expect(priceMovePct(book.butter)).toBeNull();
	});

	it('within one unit the movement still reads', () => {
		let book = recordPrice({}, 'Butter', 6.4, 'kg', T);
		book = recordPrice(book, 'Butter', 7.9, 'kg', T + 90 * 86_400_000);
		expect(previousPrice(book.butter)?.unitCost).toBe(6.4);
	});
});

describe('finding: the full European price form lost a thousandfold', () => {
	it('1.500,00 is fifteen hundred, not one and a half', () => {
		expect(parsePrice('1.500,00')).toBe(1500);
		expect(parsePrice('€2.350,50')).toBe(2350.5);
	});

	it('the forms that already worked still work', () => {
		expect(parsePrice('14,50')).toBe(14.5);
		expect(parsePrice('$14.50')).toBe(14.5);
		expect(parsePrice('14')).toBe(14);
	});

	/** Ambiguous without the comma tail; taking it as read beats guessing. */
	it('a bare 1.500 stays 1.5, documented', () => {
		expect(parsePrice('1.500')).toBe(1.5);
	});
});

describe('finding: the tax setting did not travel', () => {
	const withTax = (): HouseRecord => ({
		...structuredClone(EMPTY_HOUSE),
		tax: { inclusive: true, ratePct: 20 }
	});

	it('a fresh tablet adopts the venue’s tax regime from the file', () => {
		const out = adoptImport(structuredClone(EMPTY_HOUSE), [], {}, { tax: { inclusive: true, ratePct: 20 } });
		expect(out.tax).toEqual({ inclusive: true, ratePct: 20 });
	});

	/** An import must not silently flip the basis of every percentage. */
	it('a venue that has set its own regime keeps it', () => {
		const out = adoptImport(withTax(), [], {}, { tax: { inclusive: false, ratePct: 0 } });
		expect(out.tax).toEqual({ inclusive: true, ratePct: 20 });
	});

	it('a pre-tax file leaves the setting alone', () => {
		expect(adoptImport(withTax(), [], {}, {}).tax).toEqual({ inclusive: true, ratePct: 20 });
	});
});
