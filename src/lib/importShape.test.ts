import { describe, it, expect } from 'vitest';
import { asArray, asRecord } from './importShape';
import { mergeSessions, EMPTY_SESSION } from './persistence/state';
import { describeImport } from './persistence/portable';
import type { SessionState } from './persistence/state';
import type { HousePortable } from './persistence/house';

/**
 * A .wtjson is a file somebody hand-edits. `?? []` and `?? {}` only cover
 * null/undefined, and a wrong-typed but PRESENT value used to reach either a
 * raw TypeError in the import banner, or worse, a silent corruption: a
 * scalar `notes` or `shoppingChecks` does not throw at all, because both
 * `Object.keys` and object spread treat a string as indexable.
 */
describe('asArray / asRecord', () => {
	it('passes a real array or record through unchanged', () => {
		expect(asArray(['a', 'b'])).toEqual(['a', 'b']);
		expect(asRecord({ a: 1 })).toEqual({ a: 1 });
	});

	it('turns every wrong shape into the safe empty value, not a throw', () => {
		for (const bad of ['a string', 42, true, null, undefined, { not: 'an array' }]) {
			expect(asArray(bad)).toEqual([]);
		}
		// The specific case that used to corrupt rather than throw: a string is
		// indexable, so a naive `typeof v === 'object'` check alone is not
		// enough — but plain `typeof` already IS enough, and this proves it.
		for (const bad of ['ab', ['an', 'array'], 42, true, null, undefined]) {
			expect(asRecord(bad)).toEqual({});
		}
	});
});

describe('a hand-edited .wtjson cannot crash or silently corrupt the import', () => {
	const current = { ...structuredClone(EMPTY_SESSION), notes: { a: 'existing' } } as SessionState &
		HousePortable;

	it('describeImport no longer throws on a scalar menu, pantry, menuDishes or waste', () => {
		for (const field of ['menu', 'pantry', 'menuDishes', 'waste']) {
			expect(() => describeImport({ [field]: 'oops' } as never, current)).not.toThrow();
		}
	});

	it('a scalar notes cannot mint junk notes into the banner count', () => {
		// Before the fix: Object.keys('chicken-tagine') has 14 entries, and the
		// banner would have said "14 new notes".
		const said = describeImport({ notes: 'chicken-tagine' } as never, current);
		expect(said).not.toMatch(/\d+ new notes?/);
	});

	it('mergeSessions does not write junk notes for a scalar notes field', () => {
		const merged = mergeSessions(current, { notes: 'hi' } as never);
		expect(merged.notes).toEqual({ a: 'existing' });
		expect(merged.notes['0']).toBeUndefined();
	});

	it('mergeSessions does not write junk shoppingChecks for a scalar field', () => {
		const merged = mergeSessions(current, { shoppingChecks: 'ab' } as never);
		expect(merged.shoppingChecks).toEqual({});
	});

	it('mergeSessions ignores a shoppingChecks value that is a scalar, not an array', () => {
		const merged = mergeSessions(current, { shoppingChecks: { h1: 3 } } as never);
		expect(merged.shoppingChecks).toEqual({});
	});

	it('still merges a genuine shoppingChecks import correctly', () => {
		const merged = mergeSessions(current, { shoppingChecks: { h1: ['Produce:0'] } } as never);
		expect(merged.shoppingChecks.h1).toEqual(['Produce:0']);
	});
});

describe('the covers-replacement banner matches what mergeCostings actually does', () => {
	const withCosting = (dishCosts: Record<string, unknown>) =>
		({ ...structuredClone(EMPTY_SESSION), dishCosts }) as SessionState & HousePortable;

	/**
	 * This used to say "1 week of covers replaced" for any incoming stamp
	 * later than the local one, with no clock-skew check — but mergeCostings
	 * refuses to let a stamp more than 24h ahead of now win. The banner named
	 * a replacement that would not occur.
	 */
	it('does not claim a week was replaced when the incoming clock is more than 24h fast', () => {
		const now = Date.now();
		const current = withCosting({
			'd-1': { lines: [], sales: [{ weekStart: '2026-08-24', count: 40, at: now - 1000 }] }
		});
		const brokenClock = now + 25 * 60 * 60 * 1000; // 25h ahead: a dead RTC
		const said = describeImport(
			{
				dishCosts: {
					'd-1': { lines: [], sales: [{ weekStart: '2026-08-24', count: 99, at: brokenClock }] }
				}
			} as never,
			current
		);
		expect(said).not.toMatch(/week.*replaced/);
	});

	/** The genuine case, one millisecond inside the window, must still count. */
	it('still claims the replacement when the incoming clock is within the skew window', () => {
		const now = Date.now();
		const current = withCosting({
			'd-1': { lines: [], sales: [{ weekStart: '2026-08-24', count: 40, at: now - 1000 }] }
		});
		const said = describeImport(
			{
				dishCosts: {
					'd-1': { lines: [], sales: [{ weekStart: '2026-08-24', count: 99, at: now }] }
				}
			} as never,
			current
		);
		expect(said).toMatch(/1 week.*replaced/);
	});

	/**
	 * This used to count ANY incoming week toward "N weeks of covers" with no
	 * validation, so a hand-edited week with a non-finite `at` was announced
	 * and then discarded entirely by normaliseCosting inside the real merge.
	 */
	it('does not count a week that normaliseCosting will discard as invalid', () => {
		const current = withCosting({});
		const said = describeImport(
			{
				dishCosts: {
					'd-1': { lines: [], sales: [{ weekStart: '2026-08-24', count: 99, at: Number.NaN }] }
				}
			} as never,
			current
		);
		expect(said).toBe('nothing new, this file matches what you already have');
	});
});
