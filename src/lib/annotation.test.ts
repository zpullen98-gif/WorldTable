import { describe, it, expect } from 'vitest';
import { markDrift, faultHistogram, type CookEntry } from './repertoire';
import { mergeSessions, EMPTY_SESSION } from './persistence/state';

/**
 * Grading the MARK, not just the plate.
 *
 * Every cook was recorded as one of three words, so a commis could pull the
 * sear early for four months with every plate faithfully logged and nobody —
 * including him — able to name what was drifting. And the one moment the app
 * captured a real diagnosis, the palate fault picker, was component state that
 * died with the dialog.
 *
 * `off` holds FROZEN MARK IDS, never indices: an index silently repoints to a
 * different sentence the day somebody inserts a mark above it, and no gate can
 * see that happen. tools/derive/mark-ids.ledger.json is what keeps the promise.
 */
const cook = (over: Partial<CookEntry> = {}): CookEntry => ({
	slug: 'the-french-omelette',
	at: 1000,
	grade: 'close',
	...over
});

const M = {
	skin: 'the-french-omelette#skin',
	seasoned: 'the-french-omelette#seasoned',
	cigar: 'the-french-omelette#cigar-shaped'
};

describe('markDrift — what keeps going wrong on one dish', () => {
	it('counts a mark once per cook it was off in', () => {
		const log = [
			cook({ at: 1, off: [M.skin] }),
			cook({ at: 2, off: [M.skin, M.seasoned] }),
			cook({ at: 3, off: [M.skin] })
		];
		const d = markDrift(log, 'the-french-omelette');
		expect(d.worst[0]).toEqual({ id: M.skin, count: 3 });
		expect(d.worst[1]).toEqual({ id: M.seasoned, count: 1 });
	});

	it('ignores other dishes entirely', () => {
		const log = [cook({ at: 1, off: [M.skin] }), cook({ at: 2, slug: 'cacio-e-pepe', off: [M.skin] })];
		expect(markDrift(log, 'the-french-omelette').worst[0].count).toBe(1);
	});

	/**
	 * An ungraded entry is a cook that was recorded before the pass existed, or
	 * one the cook tapped through. It is not evidence that nothing was off.
	 */
	it('counts only graded cooks in the denominator', () => {
		const log = [cook({ at: 1, grade: undefined }), cook({ at: 2, off: [M.skin] })];
		const d = markDrift(log, 'the-french-omelette');
		expect(d.graded).toBe(1);
		expect(d.annotated).toBe(1);
	});

	/**
	 * The honest treatment of a graded plate with no annotation: it counts in
	 * the denominator and contributes nothing to any mark. It is a cook that
	 * happened, not a mark that was met.
	 */
	it('does not read a missing annotation as "nothing was off"', () => {
		const log = [cook({ at: 1 }), cook({ at: 2 }), cook({ at: 3, off: [M.skin] })];
		const d = markDrift(log, 'the-french-omelette');
		expect(d.graded).toBe(3);
		expect(d.annotated).toBe(1);
		expect(d.worst).toEqual([{ id: M.skin, count: 1 }]);
	});

	it('is empty and safe on a dish never cooked', () => {
		expect(markDrift([], 'nope')).toEqual({ graded: 0, annotated: 0, worst: [] });
	});

	it('breaks a tie deterministically rather than by log order', () => {
		const a = markDrift([cook({ at: 1, off: [M.skin] }), cook({ at: 2, off: [M.cigar] })], 'the-french-omelette');
		const b = markDrift([cook({ at: 1, off: [M.cigar] }), cook({ at: 2, off: [M.skin] })], 'the-french-omelette');
		expect(a.worst).toEqual(b.worst);
	});
});

describe('faultHistogram — which lever the cook reaches for', () => {
	it('counts across every dish, because a palate is not a dish', () => {
		const log = [
			cook({ at: 1, fault: 'flat' }),
			cook({ at: 2, slug: 'cacio-e-pepe', fault: 'flat' }),
			cook({ at: 3, slug: 'ratatouille', fault: 'sour' })
		];
		expect(faultHistogram(log)).toEqual([
			{ fault: 'flat', count: 2 },
			{ fault: 'sour', count: 1 }
		]);
	});

	it('ignores entries carrying no fault', () => {
		expect(faultHistogram([cook({ at: 1 }), cook({ at: 2, fault: 'salty' })])).toEqual([
			{ fault: 'salty', count: 1 }
		]);
	});
});

describe('the import merge keeps the richer cook', () => {
	const base = (log: CookEntry[]) => ({ ...structuredClone(EMPTY_SESSION), cookedLog: log });

	/**
	 * The bug this replaced. The tiebreak was `!seen.grade && e.grade`, which
	 * was right when a grade was all an entry could hold. An imported entry
	 * carrying the marks that were off AND the fault then lost to a bare local
	 * grade on the same slug|at — discarding the only part worth merging.
	 */
	it('prefers an annotated entry over a bare graded one at the same slug and time', () => {
		const local = base([cook({ at: 5 })]);
		const merged = mergeSessions(local, {
			cookedLog: [cook({ at: 5, off: [M.skin], fault: 'flat' })]
		});
		expect(merged.cookedLog).toHaveLength(1);
		expect(merged.cookedLog[0].off).toEqual([M.skin]);
		expect(merged.cookedLog[0].fault).toBe('flat');
	});

	it('still prefers a graded entry over an ungraded one', () => {
		const local = base([cook({ at: 5, grade: undefined })]);
		const merged = mergeSessions(local, { cookedLog: [cook({ at: 5, grade: 'missed' })] });
		expect(merged.cookedLog[0].grade).toBe('missed');
	});

	it('never lets a poorer imported entry overwrite a richer local one', () => {
		const local = base([cook({ at: 5, off: [M.skin], fault: 'flat' })]);
		const merged = mergeSessions(local, { cookedLog: [cook({ at: 5 })] });
		expect(merged.cookedLog[0].off).toEqual([M.skin]);
		expect(merged.cookedLog[0].fault).toBe('flat');
	});

	it('keeps both when the timestamps differ — they are two different cooks', () => {
		const local = base([cook({ at: 5 })]);
		const merged = mergeSessions(local, { cookedLog: [cook({ at: 6, off: [M.skin] })] });
		expect(merged.cookedLog).toHaveLength(2);
	});
});
