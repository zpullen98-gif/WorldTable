import { describe, it, expect } from 'vitest';
import {
	observedElapsed,
	ACTUALS_MIN_OBSERVATIONS,
	ACTUALS_OUTLIER_FACTOR
} from './pass';
import { mergeSessions, EMPTY_SESSION, RUN_MAX_AGE_MS } from './persistence/state';

/**
 * What a step actually takes, from the ticks a cook left behind.
 *
 * Every rule here is a refusal, because the failure mode of an observed number
 * is that it looks measured. A tick pair is wall clock between two taps: it
 * cannot tell a wait from the cook answering the phone, which is why the copy
 * says "elapsed here" and never "hands-on here".
 */
describe('observedElapsed refuses to say more than it knows', () => {
	it(`says nothing below ${ACTUALS_MIN_OBSERVATIONS} observations`, () => {
		expect(observedElapsed([], 10)).toBeNull();
		expect(observedElapsed([9], 10)).toBeNull();
		expect(observedElapsed([9, 11], 10)).toBeNull();
		expect(observedElapsed([9, 11, 10], 10)).not.toBeNull();
	});

	it('answers with the median, so one long interval cannot drag it', () => {
		expect(observedElapsed([8, 9, 10, 11, 12], 10)).toBe(10);
		// 39 is inside the 4x cutoff, so it is KEPT and the even-length median
		// averages the middle pair: (10 + 11) / 2 = 11. One long-but-plausible
		// interval nudges the answer; it does not run away with it.
		expect(observedElapsed([9, 10, 11, 39], 10)).toBe(11);
		// 41 is outside it, discarded, and the median of what is left is 10.
		expect(observedElapsed([9, 10, 11, 41], 10)).toBe(10);
	});

	/**
	 * The cook who ticked, walked away, and ticked again after service. Beyond
	 * four times the estimate it is not a slow step, it is a forgotten tab.
	 */
	it(`discards anything past ${ACTUALS_OUTLIER_FACTOR}x the estimate`, () => {
		expect(observedElapsed([10, 10, 10, 400], 10)).toBe(10);
		// Three real observations plus two abandonments still answers.
		expect(observedElapsed([12, 12, 12, 900, 1200], 10)).toBe(12);
	});

	it('falls silent when the outliers were the only evidence', () => {
		expect(observedElapsed([500, 600, 700], 10)).toBeNull();
	});

	it('ignores a zero or negative interval rather than averaging it in', () => {
		expect(observedElapsed([0, -5, 10, 10, 10], 10)).toBe(10);
	});

	/**
	 * A step the derivation never timed has an estimate of 0. There is nothing
	 * to measure it against, so nothing is discarded — but the observations are
	 * still worth reporting once there are enough.
	 */
	it('still answers for a step with no estimate to compare against', () => {
		expect(observedElapsed([5, 7, 9], 0)).toBe(7);
	});
});

describe('the run belongs to one menu and one evening', () => {
	const withRun = (over: Partial<{ menuHash: string; startedAt: number }> = {}) => ({
		...structuredClone(EMPTY_SESSION),
		planRun: {
			menuHash: 'a|b',
			serviceTime: '19:00',
			startedAt: Date.now(),
			ticks: { 'a-1': Date.now() },
			...over
		}
	});

	/**
	 * These two guards are why the run carries a menu hash and a start time at
	 * all. A run inherited by a different menu ticks rows that are not in it; a
	 * run resumed the next afternoon opens on "40 minutes behind" for a service
	 * that finished last night.
	 */
	it('has a hash to refuse a different menu with', () => {
		const s = withRun();
		expect(s.planRun.menuHash).toBe('a|b');
	});

	it('expires, and the window is long enough to survive a walk to the walk-in', () => {
		expect(RUN_MAX_AGE_MS).toBeGreaterThan(60 * 60 * 1000);
		expect(RUN_MAX_AGE_MS).toBeLessThan(48 * 60 * 60 * 1000);
	});

	it('survives an import untouched — a plan in progress is not a document', () => {
		const local = withRun();
		const merged = mergeSessions(local, { menu: ['a', 'b'] });
		expect(merged.planRun?.ticks).toEqual(local.planRun.ticks);
	});
});

describe('the actuals key', () => {
	/**
	 * The step count is IN the key. It never changes for the 970 frozen guide
	 * recipes, so it costs them nothing; a family recipe re-authored to a
	 * different length mints a new key and its old observations are never read
	 * again, which is the discard the panel asked for without a special case.
	 */
	const key = (slug: string, n: number, steps: number) => `${slug}#${n}#${steps}`;

	it('is stable while the dish is', () => {
		expect(key('coq-au-vin', 3, 8)).toBe(key('coq-au-vin', 3, 8));
	});

	it('changes when a family recipe is re-authored to a different length', () => {
		expect(key('fam-nonna', 3, 8)).not.toBe(key('fam-nonna', 3, 9));
	});
});
