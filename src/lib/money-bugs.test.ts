import { describe, it, expect } from 'vitest';
import { netOfTax, dishEconomics, parsePrice, type CostLine } from './costing';
import { describeImport } from './persistence/portable';
import { EMPTY_SESSION, type SessionState } from './persistence/state';

/**
 * Two money bugs that both failed in the flattering direction.
 *
 * A figure that is wrong in the direction that makes a venue look profitable is
 * the one nobody questions, which is exactly why `plateCost.complete` refuses to
 * report a total it could not finish. These two had no such refusal.
 */
const line = (cost: number): CostLine => ({
	id: 'l',
	item: 'shin',
	unitCost: cost,
	unit: 'kg',
	usedQty: 1,
	yieldPct: 100
});

describe('a menu price that includes tax', () => {
	/**
	 * The worked case. An 18.00 dish at 20% is 15.00 to the venue; costing
	 * against the 18 overstates contribution by 3.00 and understates food cost
	 * by five and a half points — on EVERY dish at once.
	 */
	it('is worth less to the venue than the guest paid', () => {
		expect(netOfTax(18, 20)).toBe(15);
	});

	it('changes both figures, in the direction that had been flattering', () => {
		const gross = dishEconomics([line(5)], 18);
		const net = dishEconomics([line(5)], netOfTax(18, 20));
		expect(gross.contribution).toBe(13);
		expect(net.contribution).toBe(10);
		expect(gross.foodCostPct!).toBeCloseTo(27.8, 1);
		expect(net.foodCostPct!).toBeCloseTo(33.3, 1);
	});

	it('leaves a tax-exclusive venue exactly where it was', () => {
		expect(netOfTax(18, 0)).toBe(18);
		expect(netOfTax(18, null)).toBe(18);
		expect(netOfTax(18, undefined)).toBe(18);
	});

	it('refuses a nonsense rate rather than inventing a number', () => {
		expect(netOfTax(18, Number.NaN)).toBe(18);
		expect(netOfTax(18, -5)).toBe(18);
	});

	it('passes a missing price straight through as unknown', () => {
		expect(netOfTax(null, 20)).toBeNull();
		expect(netOfTax(parsePrice('not a price'), 20)).toBeNull();
	});

	/** Every rate a venue might type, round-tripped. */
	it('is the exact inverse of adding the tax on', () => {
		for (const rate of [5, 7.5, 10, 19, 20, 21, 25]) {
			const gross = 42.5;
			expect(netOfTax(gross, rate)! * (1 + rate / 100)).toBeCloseTo(gross, 10);
		}
	});
});

describe('the import banner tells the truth about costings', () => {
	const live = (over: Partial<SessionState> = {}): SessionState => ({
		...structuredClone(EMPTY_SESSION),
		...over
	});

	/**
	 * THE BUG. It counted pins, notes, pantry, family recipes and dishes and
	 * stopped — so a file whose dishes are byte-identical and whose covers
	 * differ read "nothing new" immediately before rewriting them.
	 */
	it('no longer says "nothing new" over changed covers', () => {
		const current = live({
			dishCosts: {
				'd-1': { lines: [], sales: [{ weekStart: '2026-01-05', count: 40, at: 100 }], ts: 1 }
			}
		});
		const summary = describeImport(
			{
				dishCosts: {
					'd-1': { lines: [], sales: [{ weekStart: '2026-01-05', count: 55, at: 900 }], ts: 2 }
				}
			},
			current
		);
		expect(summary).not.toContain('nothing new');
		expect(summary).toContain('replaced');
	});

	it('counts a week the venue does not have as an addition', () => {
		const current = live({
			dishCosts: {
				'd-1': { lines: [], sales: [{ weekStart: '2026-01-05', count: 40, at: 100 }], ts: 1 }
			}
		});
		const summary = describeImport(
			{
				dishCosts: {
					'd-1': { lines: [], sales: [{ weekStart: '2026-01-12', count: 51, at: 900 }], ts: 2 }
				}
			},
			current
		);
		expect(summary).toContain('1 week of covers');
		expect(summary).not.toContain('replaced');
	});

	it('names a dish costed only on the other device', () => {
		const summary = describeImport(
			{ dishCosts: { 'd-9': { lines: [line(4)], sales: [], ts: 2 } } },
			live()
		);
		expect(summary).toContain('1 costed dish');
	});

	/**
	 * An older incoming count does not win the merge, so the banner must not
	 * promise a replacement that will not happen.
	 */
	it('does not threaten a replacement the merge will refuse', () => {
		const current = live({
			dishCosts: {
				'd-1': { lines: [], sales: [{ weekStart: '2026-01-05', count: 40, at: 900 }], ts: 1 }
			}
		});
		const summary = describeImport(
			{
				dishCosts: {
					'd-1': { lines: [], sales: [{ weekStart: '2026-01-05', count: 12, at: 100 }], ts: 2 }
				}
			},
			current
		);
		expect(summary).toContain('nothing new');
	});

	it('still says nothing new for a file that really matches', () => {
		const same = {
			dishCosts: {
				'd-1': { lines: [], sales: [{ weekStart: '2026-01-05', count: 40, at: 100 }], ts: 1 }
			}
		};
		expect(describeImport(same, live(same))).toContain('nothing new');
	});
});
