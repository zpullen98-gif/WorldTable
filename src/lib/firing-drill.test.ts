import { describe, it, expect } from 'vitest';
import { buildPass } from './pass';
import {
	firingQuestions,
	canDrill,
	gradeRun,
	QUESTIONS_PER_RUN,
	SECONDS_PER_QUESTION
} from './firing-drill';

/**
 * The firing drill. Questions are generated, never authored, and the correct
 * answer is arithmetic the pass already did — so what these tests defend is
 * that the generator cannot produce an indefensible question.
 */

const min = (n: number) => n * 60;

/** Three dishes whose steps spread across distinct start times. */
const MENU = [
	{
		slug: 'braise',
		name: 'The braise',
		steps: [
			{ text: 'Sear the meat hard', handsOnSec: min(10) },
			{ text: 'Into the oven', handsOnSec: min(2), unattendedSec: min(120) },
			{ text: 'Reduce and mount the sauce', handsOnSec: min(8) }
		]
	},
	{
		slug: 'salad',
		name: 'The salad',
		steps: [
			{ text: 'Wash and dry the leaves', handsOnSec: min(6) },
			{ text: 'Build the dressing', handsOnSec: min(4) }
		]
	},
	{
		slug: 'tart',
		name: 'The tart',
		steps: [
			{ text: 'Blind bake the shell', handsOnSec: min(5), unattendedSec: min(25) },
			{ text: 'Whisk and fill', handsOnSec: min(7) },
			{ text: 'Bake until it barely trembles', handsOnSec: min(1), unattendedSec: min(30) }
		]
	}
];

const pass = buildPass(MENU);

/** A deterministic "random": walks a fixed tape so runs are reproducible. */
const tape = (...vals: number[]) => {
	let i = 0;
	return () => vals[i++ % vals.length];
};

describe('what a question is allowed to be', () => {
	const qs = firingQuestions(pass, 40, tape(0.13, 0.71, 0.42, 0.9, 0.05, 0.33, 0.6));

	it('generates the asked-for count from a real pass', () => {
		expect(qs).toHaveLength(40);
	});

	it('never offers two steps that start at the same minute', () => {
		for (const q of qs) {
			const starts = q.options.map((o) => o.startsAtMin);
			expect(new Set(starts).size).toBe(3);
		}
	});

	it('always keys the answer to the step that starts first', () => {
		for (const q of qs) {
			const first = Math.max(...q.options.map((o) => o.startsAtMin));
			expect(q.options[q.answer].startsAtMin).toBe(first);
		}
	});

	it('never uses a zero-hands step — a simmer is not a decision', () => {
		const attended = new Set(
			pass.steps.filter((s) => s.handsOnMin > 0).map((s) => `${s.dish}|${s.text}`)
		);
		for (const q of qs)
			for (const o of q.options) expect(attended.has(`${o.dish}|${o.text}`)).toBe(true);
	});

	it('reports the gap so tight calls can be named afterwards', () => {
		for (const q of qs) expect(q.gapMin).toBeGreaterThan(0);
	});
});

describe('when the drill refuses to run', () => {
	it('needs three distinct hands-on start times, and says so', () => {
		const tiny = buildPass([
			{ slug: 'x', name: 'X', steps: [{ text: 'only step', handsOnSec: min(5) }] }
		]);
		expect(canDrill(tiny)).toBe(false);
		expect(firingQuestions(tiny, 8, tape(0.5))).toEqual([]);
		expect(canDrill(pass)).toBe(true);
	});
});

describe('the grade speaks the app grammar', () => {
	it('met at 80%, close at 60%, missed below', () => {
		expect(gradeRun(8, 8)).toBe('met');
		expect(gradeRun(7, 8)).toBe('met'); // 87.5
		expect(gradeRun(5, 8)).toBe('close'); // 62.5
		expect(gradeRun(4, 8)).toBe('missed');
		expect(gradeRun(0, 0)).toBe('missed');
	});

	it('the constants exist where the page reads them', () => {
		expect(QUESTIONS_PER_RUN).toBeGreaterThan(0);
		expect(SECONDS_PER_QUESTION).toBeGreaterThan(0);
	});
});
