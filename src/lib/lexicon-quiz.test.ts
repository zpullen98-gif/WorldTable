import { describe, it, expect } from 'vitest';
import { nextTarget, optionsForTerm, gradeForQuiz, QUIZ_LENGTH } from './lexicon-quiz';
import type { LexTerm } from './lexicon-quiz';
import lexicon from './data/lexicon.json';

/** A deterministic RNG. Math.random in a test is a test that fails on Tuesdays. */
function seeded(seed: number) {
	let s = seed;
	return () => {
		s = (s * 1103515245 + 12345) % 2147483648;
		return s / 2147483648;
	};
}

const TERMS = lexicon as unknown as LexTerm[];
const term = (n: number, category = 'A'): LexTerm => ({
	slug: `t${n}`,
	term: `Term ${n}`,
	category,
	definition: `Definition ${n}`
});

describe('optionsForTerm', () => {
	/**
	 * The defect this file exists for. The old line was
	 * `[...others.values()].sort(() => Math.random() - 0.5)` over a Map built
	 * target-first, so the pre-sort order was always [target, d1, d2, d3]. That
	 * is not a shuffle: measured over 200,000 runs the target landed in slot 1
	 * 36.0% of the time and slot 4 31.2% — 67.2% in the two ends against a fair
	 * 50%. In a study tool the answer was partly guessable from where it sat.
	 */
	it('does not leak the answer through its position', () => {
		const rand = seeded(7);
		const field = Array.from({ length: 40 }, (_, i) => term(i));
		const at = [0, 0, 0, 0];
		const N = 4000;
		for (let i = 0; i < N; i++) {
			const q = optionsForTerm(field[i % field.length], field, rand);
			at[q.options.findIndex((o) => o.slug === q.target.slug)]++;
		}
		for (const [i, count] of at.entries()) {
			const pct = (100 * count) / N;
			expect(pct, `slot ${i + 1} at ${pct.toFixed(1)}% of ${N}`).toBeGreaterThan(22);
			expect(pct, `slot ${i + 1} at ${pct.toFixed(1)}% of ${N}`).toBeLessThan(28);
		}
	});

	/**
	 * POOL and FIELD are never the same array (drill.ts:22, written about this
	 * page's old code). Distractors come from the whole lexicon, so a narrow
	 * filter cannot hand back the same four buttons every question.
	 */
	it('draws distractors from the field, not from a narrow pool', () => {
		const rand = seeded(11);
		const field = [
			...Array.from({ length: 20 }, (_, i) => term(i, 'Cheese')),
			...Array.from({ length: 20 }, (_, i) => term(100 + i, 'Wine'))
		];
		const q = optionsForTerm(field[0], field, rand);
		expect(q.options).toHaveLength(4);
		// Same category is the actual skill: hanger from flank, not from crème anglaise.
		expect(q.options.every((o) => o.category === 'Cheese')).toBe(true);
	});

	/** Real data, the drills.test.ts idiom: every shipped term must be askable. */
	it('fields four distinct options for all 479 shipped terms', () => {
		const rand = seeded(3);
		expect(TERMS.length).toBeGreaterThan(400);
		for (const t of TERMS) {
			const q = optionsForTerm(t, TERMS, rand);
			expect(q.options, t.term).toHaveLength(4);
			expect(new Set(q.options.map((o) => o.slug)).size, t.term).toBe(4);
			expect(q.options.some((o) => o.slug === t.slug), t.term).toBe(true);
		}
	});

	/**
	 * The old code could not do this. `while (others.size < 4)` was guarded only
	 * by `shown.length >= 4`, an undocumented load-bearing floor; a category
	 * with three terms would have spun forever. Shuffle-and-take returns fewer
	 * options rather than hanging.
	 */
	it('returns without hanging when the field is smaller than a question', () => {
		const rand = seeded(5);
		const tiny = [term(1), term(2)];
		const q = optionsForTerm(tiny[0], tiny, rand);
		expect(q.options.length).toBeLessThanOrEqual(2);
		expect(q.options.some((o) => o.slug === 't1')).toBe(true);
	});
});

describe('nextTarget', () => {
	it('asks a due term first when one is in the pool', () => {
		const rand = seeded(2);
		const pool = [term(1), term(2), term(3), term(4)];
		expect(nextTarget(pool, ['t3'], new Set(), rand)?.slug).toBe('t3');
	});

	it('skips a due term that is not in the current filter', () => {
		const rand = seeded(2);
		const pool = [term(1), term(2)];
		expect(nextTarget(pool, ['t99'], new Set(), rand)?.slug).toMatch(/^t[12]$/);
	});

	it('does not repeat while an unasked term remains', () => {
		const rand = seeded(9);
		const pool = [term(1), term(2), term(3)];
		const asked = new Set(['t1', 't2']);
		expect(nextTarget(pool, [], asked, rand)?.slug).toBe('t3');
	});

	/**
	 * A five-term category cannot field ten distinct questions, so a repeat is
	 * correct behaviour once the pool is exhausted — the page's record-once set
	 * is what keeps the repeat from becoming a second piece of evidence.
	 */
	it('repeats only once the pool is exhausted', () => {
		const rand = seeded(4);
		const pool = [term(1), term(2)];
		const asked = new Set(['t1', 't2']);
		expect(nextTarget(pool, [], asked, rand)?.slug).toMatch(/^t[12]$/);
	});

	it('returns null on an empty pool rather than throwing', () => {
		expect(nextTarget([], [], new Set(), seeded(1))).toBeNull();
	});
});

describe('gradeForQuiz', () => {
	/**
	 * Never 'met'. The quiz shows `definition.slice(0, 180)` raw, and 307 of the
	 * 479 shipped definitions (64.1%) contain a significant word of their own
	 * term inside those first 180 characters, so a right answer here is the case
	 * gradeFor() documents as `close`: right, with part of the answer visible.
	 */
	it('is close when right and missed when wrong', () => {
		expect(gradeForQuiz(true)).toBe('close');
		expect(gradeForQuiz(false)).toBe('missed');
	});
});

describe('the round', () => {
	it('is ten questions, because the verdict thresholds are absolute counts', () => {
		expect(QUIZ_LENGTH).toBe(10);
	});
});
