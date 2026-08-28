import { describe, it, expect } from 'vitest';
import {
	layOutTrial,
	layOutRun,
	slugFor,
	parseSlug,
	cleared,
	verdictFor,
	levelReached,
	nextLevel,
	type CalibrationEntry,
	type CalibrationLadder
} from './calibration';
import calibration from './data/calibration.json';
import { LADDERS, TRIALS, PASS_AT, CUPS } from '../../tools/derive/calibration.mjs';

/**
 * The calibration bench.
 *
 * Two cooks season the same dish differently, so the dish is a different dish
 * depending on who is on. "This is under-seasoned", said for six months to
 * somebody who genuinely cannot taste the difference at that concentration, is
 * a discrimination threshold and not an attitude problem — and nothing in this
 * app could tell the two apart. Servers had a scored, scheduled drill over 186
 * cards; cooks had nothing scored at all.
 */
const shipped = calibration as unknown as {
	cups: number;
	trials: number;
	passAt: number;
	ladders: CalibrationLadder[];
};

describe('the authored apparatus reached the shipped data', () => {
	it('ships every ladder that was authored', () => {
		expect(shipped.ladders.map((l) => l.taste)).toEqual(
			(LADDERS as CalibrationLadder[]).map((l) => l.taste)
		);
	});

	it('ships the run length and the bar unchanged', () => {
		expect(shipped.trials).toBe(TRIALS);
		expect(shipped.passAt).toBe(PASS_AT);
		expect(shipped.cups).toBe(CUPS);
	});

	/**
	 * A triangle test is a 1-in-3 guess, so a run of one logging "met" would be
	 * worth nothing — exactly the failure drill.ts's never-shorten-the-round
	 * rule exists to prevent.
	 */
	it('is never a single trial, and never passes at the guess rate', () => {
		expect(shipped.trials).toBeGreaterThanOrEqual(5);
		expect(shipped.passAt).toBeGreaterThan(shipped.trials / 2);
		// Odds of a clean sweep by luck.
		expect(Math.pow(1 / shipped.cups, shipped.trials)).toBeLessThan(0.002);
	});

	/** A later level that is easier than an earlier one makes the order a lie. */
	it('narrows at every step of every ladder', () => {
		for (const ladder of shipped.ladders) {
			const gaps = ladder.levels.map((l) => Math.abs(l.odd - l.base));
			for (let i = 1; i < gaps.length; i++) {
				expect(gaps[i], `${ladder.taste} level ${i + 1}`).toBeLessThan(gaps[i - 1]);
			}
		}
	});

	it('asks only for weights a kitchen scale can read', () => {
		for (const ladder of shipped.ladders) {
			for (const l of ladder.levels) {
				for (const v of [l.base, l.odd]) expect(Math.round(v * 4)).toBe(v * 4);
			}
		}
	});
});

describe('laying out a run', () => {
	it('puts the odd cup somewhere real, every time', () => {
		for (let i = 0; i < 200; i++) {
			const t = layOutTrial(3);
			expect(t.odd).toBeGreaterThanOrEqual(0);
			expect(t.odd).toBeLessThan(3);
		}
	});

	it('never lets a rand of exactly 1 fall off the end', () => {
		expect(layOutTrial(3, () => 1).odd).toBe(2);
	});

	/**
	 * Laid out UP FRONT, so the sequence cannot react to how the cook is doing.
	 * An instrument that adapts mid-run is a staircase and needs its own
	 * estimator.
	 */
	it('lays the whole run out at once', () => {
		expect(layOutRun(6, 3)).toHaveLength(6);
	});

	it('uses every cup position across a long run', () => {
		const seen = new Set(layOutRun(400, 3).map((t) => t.odd));
		expect([...seen].sort()).toEqual([0, 1, 2]);
	});
});

describe('what a run says', () => {
	it('clears only at the bar, never below it', () => {
		expect(cleared(5, 5)).toBe(true);
		expect(cleared(6, 5)).toBe(true);
		expect(cleared(4, 5)).toBe(false);
	});

	it('calls two of six what it is', () => {
		expect(verdictFor(2, 6, 5)).toMatch(/guessing/i);
	});

	it('never puts a number on a person', () => {
		for (const right of [0, 1, 2, 3, 4, 5, 6]) {
			expect(verdictFor(right, 6, 5)).not.toMatch(/\d/);
		}
	});
});

describe('the ladder a cook is on', () => {
	const log = (slugs: Array<[string, 'met' | 'close' | 'missed']>): CalibrationEntry[] =>
		slugs.map(([slug, grade], i) => ({ slug, at: 1000 + i, grade }));

	it('is read off the levels cleared, not stored as a counter', () => {
		expect(levelReached(log([['cal-salt-1', 'met'], ['cal-salt-2', 'met']]), 'salt')).toBe(2);
	});

	it('does not count a level that was attempted and missed', () => {
		expect(levelReached(log([['cal-salt-1', 'met'], ['cal-salt-2', 'missed']]), 'salt')).toBe(1);
	});

	it('keeps the ladders apart', () => {
		const l = log([['cal-salt-3', 'met'], ['cal-acid-1', 'met']]);
		expect(levelReached(l, 'salt')).toBe(3);
		expect(levelReached(l, 'acid')).toBe(1);
	});

	it('offers the level above the highest cleared', () => {
		const ladder = shipped.ladders.find((l) => l.taste === 'salt')!;
		expect(nextLevel(log([['cal-salt-2', 'met']]), ladder).level).toBe(3);
		expect(nextLevel([], ladder).level).toBe(1);
	});

	/** A palate that is not exercised drifts back, so the top stays re-walkable. */
	it('keeps the top level available once everything is cleared', () => {
		const ladder = shipped.ladders.find((l) => l.taste === 'salt')!;
		const all = log(ladder.levels.map((l) => [slugFor('salt', l.level), 'met'] as const) as never);
		expect(nextLevel(all, ladder).level).toBe(ladder.levels.length);
	});
});

describe('the slug', () => {
	it('round-trips', () => {
		expect(parseSlug(slugFor('salt', 3))).toEqual({ taste: 'salt', level: 3 });
	});

	it('refuses anything that is not one of ours', () => {
		expect(parseSlug('srv-room')).toBeNull();
		expect(parseSlug('cal-salt-x')).toBeNull();
	});
});
