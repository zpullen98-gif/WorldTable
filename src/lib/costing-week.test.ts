import { describe, it, expect } from 'vitest';
import {
	weekStartOf,
	recentWeeks,
	normaliseCosting,
	mergeCostings,
	CLOCK_SKEW_MS,
	type DishCosting
} from './persistence/state';

/**
 * Covers by week, and the ways a history gets lost.
 *
 * `sold` was one integer with no date, and `setSold` overwrote it: typing this
 * week's covers DESTROYED last week's. Menu engineering ranked dishes against a
 * number with no date on it, and the guide's own stated cadence — "calculate it
 * WEEKLY… weekly prime cost turns a bleeding month into a bleeding week, caught
 * while schedules and orders can still change" — was impossible on the shape.
 */
describe('which week a date belongs to', () => {
	it('files every day of a week under its Monday', () => {
		// Mon 5 Jan 2026 through Sun 11 Jan.
		for (let d = 5; d <= 11; d++) {
			expect(weekStartOf(new Date(2026, 0, d, 9, 30))).toBe('2026-01-05');
		}
		expect(weekStartOf(new Date(2026, 0, 12, 9, 30))).toBe('2026-01-12');
	});

	it('treats Sunday as the END of its week, not the start', () => {
		expect(weekStartOf(new Date(2026, 0, 11, 23, 59))).toBe('2026-01-05');
	});

	/**
	 * THE NOON ANCHOR.
	 *
	 * `setHours(0,0,0,0)` — the version everyone writes — lands on a local
	 * midnight that DOES NOT EXIST on transition days in America/Havana,
	 * America/Santiago, America/Asuncion and Africa/Cairo. It normalises forward
	 * to 01:00, setDate carries that hour, and a Sunday write and a Wednesday
	 * write in one week on one device mint two different keys.
	 *
	 * This runs in the suite's own zone, so it cannot reproduce Havana. What it
	 * CAN pin is the property that made noon the fix: every hour of every day in
	 * a week resolves to the same Monday, including the hours a DST shift moves.
	 */
	it('gives one answer for every hour of a week', () => {
		const keys = new Set<string>();
		for (let d = 5; d <= 11; d++) {
			for (let h = 0; h < 24; h++) keys.add(weekStartOf(new Date(2026, 0, d, h)));
		}
		expect([...keys]).toEqual(['2026-01-05']);
	});

	it('is stable across the spring and autumn transitions', () => {
		// Late March and late October, the two weeks most zones shift in.
		for (const [m, d] of [[2, 29], [9, 25]] as const) {
			const week = new Set<string>();
			for (let i = 0; i < 7; i++) {
				const day = new Date(2026, m, d + i, 12);
				week.add(weekStartOf(day));
			}
			expect(week.size, 'a week split into two keys across a transition').toBeLessThanOrEqual(2);
		}
	});
});

describe('walking back through the weeks', () => {
	/**
	 * Never by subtracting 7 * 86_400_000. Across a DST boundary that misses a
	 * stored key by exactly an hour, so a week that IS on disk renders blank,
	 * the chef retypes it, and the record holds two entries for one week.
	 */
	it('walks calendar days, so every step lands on a Monday', () => {
		const weeks = recentWeeks(6, new Date(2026, 2, 25, 12));
		expect(weeks).toHaveLength(6);
		for (const w of weeks) expect(weekStartOf(new Date(`${w}T12:00:00`))).toBe(w);
	});

	it('is strictly descending and never repeats a week', () => {
		const weeks = recentWeeks(10, new Date(2026, 9, 28, 12));
		expect(new Set(weeks).size).toBe(10);
		expect([...weeks].sort().reverse()).toEqual(weeks);
	});
});

describe('normalising whatever is on disk', () => {
	it('reads a legacy record and mirrors its undated figure', () => {
		const out = normaliseCosting({ lines: [], sold: 120, ts: 5 });
		expect(out?.sales).toEqual([]);
		expect(out?.sold, 'an existing venue lost its number on update day').toBe(120);
	});

	it('keeps a covers-only record that has no lines array at all', () => {
		const out = normaliseCosting({ sales: [{ weekStart: '2026-01-05', count: 9, at: 1 }] });
		expect(out?.lines).toEqual([]);
		expect(out?.sold).toBe(9);
	});

	it('refuses only a record carrying no typed figure of any kind', () => {
		expect(normaliseCosting({})).toBeNull();
		expect(normaliseCosting({ lines: [], sales: [] })).toBeNull();
		expect(normaliseCosting(null)).toBeNull();
		expect(normaliseCosting('nope')).toBeNull();
	});

	/**
	 * 0 covers is a REAL figure — counted, sold none — and it is the number a
	 * chef types precisely so the board calls a dish a dog. A truthiness test
	 * eats it.
	 */
	it('keeps a deliberate zero', () => {
		expect(normaliseCosting({ lines: [], sold: 0, ts: 1 })?.sold).toBe(0);
		const w = normaliseCosting({ sales: [{ weekStart: '2026-01-05', count: 0, at: 1 }] });
		expect(w?.sales[0].count).toBe(0);
		expect(w?.sold).toBe(0);
	});

	it('discards a malformed week rather than storing an unusable key', () => {
		const out = normaliseCosting({
			sales: [
				{ weekStart: 'last tuesday', count: 5, at: 1 },
				{ weekStart: '2026-01-05', count: 5, at: 1 },
				{ weekStart: '2026-01-12', count: Number.NaN, at: 1 }
			]
		});
		expect(out?.sales.map((w) => w.weekStart)).toEqual(['2026-01-05']);
	});

	it('is idempotent, so it is safe at every boundary a costing enters', () => {
		const once = normaliseCosting({ lines: [], sold: 40, ts: 3 });
		expect(normaliseCosting(once)).toEqual(once);
	});
});

describe('merging two devices', () => {
	const at = (weekStart: string, count: number, when: number) => ({ weekStart, count, at: when });
	const rec = (sales: ReturnType<typeof at>[], ts = 1): DishCosting => ({ lines: [], sales, ts });

	/**
	 * THE PROPERTY THAT MAKES THIS SAFE. A week present on one side only is
	 * always kept, so an import can only ever ADD. The old rule replaced the
	 * whole record on a newer ts: a file carrying week 5 wiped weeks 1-4.
	 */
	it('never loses a week that only one side has', () => {
		const mine = rec([at('2026-01-05', 40, 100), at('2026-01-12', 50, 200)]);
		const theirs = rec([at('2026-01-19', 60, 900)], 900);
		const out = mergeCostings(mine, theirs);
		expect(out?.sales.map((w) => w.weekStart)).toEqual(['2026-01-19', '2026-01-12', '2026-01-05']);
	});

	it('is order-independent, so re-importing your own export is a no-op', () => {
		const a = rec([at('2026-01-05', 40, 100)]);
		const b = rec([at('2026-01-05', 40, 500)]);
		expect(mergeCostings(a, b)).toEqual(mergeCostings(b, a));
	});

	it('lets the newer count win and keeps the loser visible', () => {
		const out = mergeCostings(rec([at('2026-01-05', 40, 100)]), rec([at('2026-01-05', 44, 900)]));
		expect(out?.sales[0].count).toBe(44);
		expect(out?.sales[0].prev).toBe(40);
	});

	/**
	 * One tablet with a dead RTC would otherwise own every week on every dish
	 * after a single import, permanently, and beat every later correction from a
	 * device whose clock is right.
	 */
	it('treats a wildly future stamp as the oldest, not the newest', () => {
		const now = 1_000_000;
		const out = mergeCostings(
			rec([at('2026-01-05', 40, now - 10)]),
			rec([at('2026-01-05', 999, now + CLOCK_SKEW_MS + 60_000)]),
			now
		);
		expect(out?.sales[0].count, 'a broken clock took ownership of the week').toBe(40);
	});

	it('carries the newest lines under the newest stamp', () => {
		const mine: DishCosting = { lines: [], sales: [], sold: 1, ts: 100 };
		const theirs: DishCosting = {
			lines: [{ id: 'l', item: 'Salmon', unitCost: 12, unit: 'kg', usedQty: 0.2, yieldPct: 45 }],
			sales: [],
			sold: 2,
			ts: 900
		};
		const out = mergeCostings(mine, theirs);
		expect(out?.lines).toHaveLength(1);
		expect(out?.ts).toBe(900);
	});

	it('never lets a stranger undated figure displace the venue own', () => {
		const mine: DishCosting = { lines: [], sales: [], sold: 120, ts: 100 };
		const theirs: DishCosting = { lines: [], sales: [], sold: 7, ts: 900 };
		expect(mergeCostings(mine, theirs)?.sold).toBe(120);
	});

	it('survives one side being absent entirely', () => {
		const mine = rec([at('2026-01-05', 40, 1)]);
		expect(mergeCostings(mine, undefined)).toEqual(normaliseCosting(mine));
		expect(mergeCostings(undefined, mine)).toEqual(normaliseCosting(mine));
		expect(mergeCostings(undefined, undefined)).toBeNull();
	});
});
