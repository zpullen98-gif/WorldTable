import { describe, it, expect } from 'vitest';
import {
	buildRound,
	optionsFor,
	fieldFor,
	shuffle,
	verdictFor,
	gradeFor,
	ROUND_LENGTH,
	type DrillCard
} from './drill';

/** A deterministic RNG. Math.random in a test is a test that fails on Tuesdays. */
function seeded(seed: number) {
	let s = seed;
	return () => {
		s = (s * 1103515245 + 12345) % 2147483648;
		return s / 2147483648;
	};
}

const card = (n: number, over: Partial<DrillCard> = {}): DrillCard => ({
	slug: `t-${n}`,
	term: `Term ${n}`,
	category: 'Cheese Atlas',
	moduleId: 'm-1',
	prompt: `A definition with the answer taken out, number ${n}.`,
	field: 'category',
	...over
});

const deck = (n: number, over: Partial<DrillCard> = {}) =>
	Array.from({ length: n }, (_, i) => card(i + 1, over));

describe('the pool and the field are different arrays', () => {
	/**
	 * The defect this module exists not to repeat. The lexicon's quiz filters
	 * its distractors out of the same array it picks its target from; point
	 * that at a due queue and every question shows the same four buttons.
	 */
	it('draws options from the whole category, not from the due queue', () => {
		const all = deck(46);
		const due = ['t-1', 't-2'];
		const round = buildRound(all, due, new Set(), seeded(7));

		const first = round[0].options.map((o) => o.slug).sort();
		const second = round[1].options.map((o) => o.slug).sort();
		expect(first).not.toEqual(second);
		expect(round[0].options).toHaveLength(4);
	});

	it('asks the due terms first', () => {
		const all = deck(46);
		const round = buildRound(all, ['t-40', 't-41'], new Set(), seeded(3));
		expect(round.slice(0, 2).map((q) => q.target.slug)).toEqual(['t-40', 't-41']);
	});

	/**
	 * The hang. A `while (chosen.size < 4)` over a field of two never exits.
	 * This must terminate — the assertion is that the test finishes at all.
	 */
	it('terminates when the field is smaller than a question needs', () => {
		const all = deck(2);
		const round = buildRound(all, ['t-1', 't-2'], new Set(), seeded(11));
		// Two cards cannot field four options, so no question can be asked.
		expect(round).toEqual([]);
	});

	it('fields exactly four options when it can', () => {
		const all = deck(5);
		const q = optionsFor(all[0], all, seeded(5));
		expect(q).not.toBeNull();
		expect(new Set(q!.options.map((o) => o.slug)).size).toBe(4);
	});

	it('always includes the right answer among the options', () => {
		const all = deck(20);
		for (const q of buildRound(all, [], new Set(), seeded(99))) {
			expect(q.options.map((o) => o.slug)).toContain(q.target.slug);
		}
	});
});

describe('where wrong answers come from', () => {
	it('same category when the card says so', () => {
		const all = [...deck(6), ...deck(6, { category: 'Other' }).map((c, i) => ({ ...c, slug: `o-${i}` }))];
		const f = fieldFor(all[0], all);
		expect(f.every((c) => c.category === 'Cheese Atlas')).toBe(true);
	});

	it('the whole deck when the card was widened at build time', () => {
		const all = [
			card(1, { category: 'Lonely', field: 'all' }),
			...deck(6).map((c, i) => ({ ...c, slug: `x-${i}` }))
		];
		const f = fieldFor(all[0], all);
		expect(f.length).toBe(all.length - 1);
	});

	it('never offers the target as its own distractor', () => {
		const all = deck(10);
		expect(fieldFor(all[3], all).some((c) => c.slug === all[3].slug)).toBe(false);
	});
});

describe('the round is never shortened', () => {
	it('reaches ten questions from a two-term due queue by topping up', () => {
		const all = deck(46);
		const round = buildRound(all, ['t-1', 't-2'], new Set(), seeded(21));
		expect(round).toHaveLength(ROUND_LENGTH);
	});

	it('never repeats a target inside a round', () => {
		const all = deck(46);
		const round = buildRound(all, ['t-1'], new Set(), seeded(33));
		const targets = round.map((q) => q.target.slug);
		expect(new Set(targets).size).toBe(targets.length);
	});

	it('prefers never-drilled terms over ones already answered', () => {
		const all = deck(20);
		// Everything but the last five has been drilled before.
		const drilled = new Set(all.slice(0, 15).map((c) => c.slug));
		const round = buildRound(all, [], drilled, seeded(4));
		const fresh = round.filter((q) => !drilled.has(q.target.slug));
		expect(fresh.length).toBe(5);
	});
});

describe('the verdict ladder', () => {
	/**
	 * The reason ROUND_LENGTH is fixed. These are absolute counts, so a
	 * three-question round scoring 3/3 would clear the top rung and log a clean
	 * sweep that never happened.
	 */
	it.each([
		[10, 'Service standard'],
		[9, 'Service standard'],
		[8, 'Solid — you would not be caught out'],
		[7, 'Solid — you would not be caught out'],
		[5, 'Halfway. Read the module again'],
		[4, 'Not yet. This is what the track is for'],
		[0, 'Not yet. This is what the track is for']
	])('%i of ten reads as %s', (right, want) => {
		expect(verdictFor(right as number)).toBe(want);
	});

	it('refuses to rank a round that was not ten questions', () => {
		expect(verdictFor(3, 3)).toBe('3 of 3');
	});
});

describe('grading feeds the same ladder a plate does', () => {
	it.each([
		[true, false, 'met'],
		[true, true, 'close'],
		[false, false, 'missed'],
		[false, true, 'missed']
	])('correct=%s revealed=%s -> %s', (correct, revealed, want) => {
		expect(gradeFor(correct as boolean, revealed as boolean)).toBe(want);
	});
});

describe('shuffle', () => {
	it('does not mutate its input', () => {
		const src = deck(5);
		const copy = [...src];
		shuffle(src, seeded(1));
		expect(src).toEqual(copy);
	});

	it('keeps every element', () => {
		const src = deck(20);
		expect(shuffle(src, seeded(2)).map((c) => c.slug).sort()).toEqual(src.map((c) => c.slug).sort());
	});
});
