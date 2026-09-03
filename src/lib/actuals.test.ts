import { describe, it, expect } from 'vitest';
import {
	observedElapsed,
	ACTUALS_MIN_OBSERVATIONS,
	ACTUALS_OUTLIER_FACTOR
} from './pass';
import { mergeSessions, EMPTY_SESSION, RUN_MAX_AGE_MS, runFor } from './persistence/state';
import { actualKey } from './pass';

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
	 * These used to assert a fixture literal against itself and bound the
	 * exported constant against nothing: neither called `runFor` at all, so
	 * both refusals it names — wrong menu, gone stale — were unexercised by any
	 * test in the repo. `runFor` is pure (persistence/state.ts), so both are
	 * asserted directly now, including the staleness arm, which needs `now` as
	 * a parameter rather than a live clock to be testable at all.
	 */
	it('refuses a run that belongs to a different menu', () => {
		const run = withRun().planRun;
		expect(runFor(run, 'a|b', run.startedAt)).toBe(run);
		expect(runFor(run, 'x|y', run.startedAt)).toBeNull();
	});

	it('expires, and the window is long enough to survive a walk to the walk-in', () => {
		expect(RUN_MAX_AGE_MS).toBeGreaterThan(60 * 60 * 1000);
		expect(RUN_MAX_AGE_MS).toBeLessThan(48 * 60 * 60 * 1000);
		const run = withRun().planRun;
		// One millisecond either side of the window is the actual boundary.
		expect(runFor(run, 'a|b', run.startedAt + RUN_MAX_AGE_MS - 1)).toBe(run);
		expect(runFor(run, 'a|b', run.startedAt + RUN_MAX_AGE_MS + 1)).toBeNull();
	});

	it('has no run to refuse when none was ever started', () => {
		expect(runFor(undefined, 'a|b', Date.now())).toBeNull();
	});

	it('survives an import untouched — a plan in progress is not a document', () => {
		const local = withRun();
		const merged = mergeSessions(local, { menu: ['a', 'b'] });
		expect(merged.planRun?.ticks).toEqual(local.planRun.ticks);
	});
});

describe('the actuals key', () => {
	/**
	 * This used to re-implement the key locally with a lambda that asserted
	 * only properties of a JavaScript template literal, and never imported the
	 * production `actualKey` — which lives (now) in pass.ts, not in the .svelte
	 * page it used to be a closure inside of. Dropping the step count from the
	 * real key left this file green.
	 */
	it('is stable while the dish is', () => {
		expect(actualKey('coq-au-vin', 3, 8)).toBe(actualKey('coq-au-vin', 3, 8));
	});

	it('changes when a family recipe is re-authored to a different length', () => {
		expect(actualKey('fam-nonna', 3, 8)).not.toBe(actualKey('fam-nonna', 3, 9));
	});
});
