import { describe, it, expect } from 'vitest';
import {
	buildPass,
	findCollisions,
	clockFor,
	formatClockTime,
	daysEarlier,
	type PassDishInput
} from './pass';

/** Seconds, so the fixtures read in the minutes a cook thinks in. */
const min = (n: number) => n * 60;
const step = (text: string, hands: number, wait = 0) => ({
	text,
	handsOnSec: min(hands),
	unattendedSec: min(wait)
});

const braise: PassDishInput = {
	slug: 'braise',
	name: 'Braise',
	steps: [step('Sear and soffritto', 10), step('Deglaze, then simmer', 5, 60)]
};
const salad: PassDishInput = {
	slug: 'salad',
	name: 'Salad',
	steps: [step('Dress and toss', 8)]
};

describe('planning backwards from service', () => {
	it('starts each dish exactly its own elapsed time before service', () => {
		const p = buildPass([braise, salad]);
		// Braise: 10 hands + (5 hands + 60 wait) = 75.  Salad: 8.
		expect(p.dishes.map((d) => [d.name, d.startsAtMin])).toEqual([
			['Braise', 75],
			['Salad', 8]
		]);
	});

	it('lands everything together — the plan is anchored at its end', () => {
		const p = buildPass([braise, salad]);
		for (const d of p.dishes) {
			const last = p.steps.filter((s) => s.slug === d.slug).at(-1)!;
			const endsAt = last.startsAtMin - last.handsOnMin - last.unattendedMin;
			expect(endsAt, `${d.name} does not finish at service`).toBe(0);
		}
	});

	it('is as long as its longest dish, not the sum of them', () => {
		expect(buildPass([braise, salad]).lengthMin).toBe(75);
	});

	it('orders steps by when they must be STARTED, across dishes', () => {
		const p = buildPass([braise, salad]);
		expect(p.steps.map((s) => `${s.dish} ${s.n}`)).toEqual([
			'Braise 1',
			'Braise 2',
			'Salad 1'
		]);
		expect(p.steps.map((s) => s.startsAtMin)).toEqual([75, 65, 8]);
	});

	it('counts hands-on separately from elapsed — the whole point', () => {
		const p = buildPass([braise, salad]);
		const b = p.dishes.find((d) => d.name === 'Braise')!;
		expect(b.elapsedMin).toBe(75);
		expect(b.handsOnMin).toBe(15);
		// 23 minutes of work across a 75-minute plan.
		expect(p.handsOnMin).toBe(23);
	});

	it('flags a dish whose wait is too long to start inside a service', () => {
		const ferment: PassDishInput = {
			slug: 'dough',
			name: 'Dough',
			steps: [step('Mix', 5), step('Cold-ferment', 0, 600)]
		};
		const [d] = buildPass([ferment]).dishes;
		expect(d.advance).toBe(true);
		expect(buildPass([salad]).dishes[0].advance).toBe(false);
	});

	it('treats an unmeasured step as work, not as free time', () => {
		// Family recipes are authored in the browser and carry no split.
		const family: PassDishInput = {
			slug: 'nonna',
			name: "Nonna's Ragu",
			steps: [{ text: 'Cook it the way she did' }]
		};
		const [d] = buildPass([family]).dishes;
		expect(d.handsOnMin).toBe(4);
		expect(d.elapsedMin).toBe(4);
	});
});

describe('where two dishes want the same pair of hands', () => {
	it('finds the clash the old printout could only discover at the stove', () => {
		// Braise is busy 15→5 then 5→0; Salad is busy 8→0. Overlap is 8→0.
		const tight: PassDishInput = {
			slug: 'braise',
			name: 'Braise',
			steps: [step('Sear', 10), step('Finish', 5)]
		};
		const p = buildPass([tight, salad]);
		expect(p.collisions).toHaveLength(1);
		expect(p.collisions[0].dishes.sort()).toEqual(['Braise', 'Salad']);
		expect(p.collisions[0].atMin).toBe(8);
		expect(p.collisions[0].minutes).toBe(8);
	});

	it('merges one busy stretch into a single warning, not one per pair', () => {
		const a: PassDishInput = { slug: 'a', name: 'A', steps: [step('a', 30)] };
		const b: PassDishInput = { slug: 'b', name: 'B', steps: [step('b', 30)] };
		const c: PassDishInput = { slug: 'c', name: 'C', steps: [step('c', 30)] };
		const p = buildPass([a, b, c]);
		expect(p.collisions).toHaveLength(1);
		expect(p.collisions[0].dishes.sort()).toEqual(['A', 'B', 'C']);
	});

	it('an unattended simmer is not a demand on anybody', () => {
		// Both dishes run across the same half hour, but only one needs hands.
		const simmering: PassDishInput = {
			slug: 'stock',
			name: 'Stock',
			steps: [step('Set it going', 2, 30)]
		};
		const chopping: PassDishInput = {
			slug: 'mise',
			name: 'Mise',
			steps: [step('Chop everything', 20)]
		};
		expect(buildPass([simmering, chopping]).collisions).toEqual([]);
	});

	it('never reports a dish colliding with itself', () => {
		const long: PassDishInput = {
			slug: 'x',
			name: 'X',
			steps: [step('one', 20), step('two', 20), step('three', 20)]
		};
		expect(buildPass([long]).collisions).toEqual([]);
	});

	it('leaves dishes that never overlap alone', () => {
		const early: PassDishInput = { slug: 'e', name: 'E', steps: [step('e', 10, 100)] };
		const late: PassDishInput = { slug: 'l', name: 'L', steps: [step('l', 10)] };
		expect(buildPass([early, late]).collisions).toEqual([]);
	});

	it('takes an empty plan without inventing anything', () => {
		const p = buildPass([]);
		expect(p.steps).toEqual([]);
		expect(p.lengthMin).toBe(0);
		expect(findCollisions([])).toEqual([]);
	});
});

describe('putting the plan on a clock', () => {
	const service = new Date(2026, 7, 27, 20, 0); // 27 Aug 2026, 20:00

	it('counts backwards from service', () => {
		expect(formatClockTime(clockFor(service, 0))).toBe('20:00');
		expect(formatClockTime(clockFor(service, 75))).toBe('18:45');
		expect(formatClockTime(clockFor(service, 20 * 60))).toBe('00:00');
	});

	it('knows when a start falls on an earlier day', () => {
		expect(daysEarlier(service, clockFor(service, 60))).toBe(0);
		expect(daysEarlier(service, clockFor(service, 21 * 60))).toBe(1);
		expect(daysEarlier(service, clockFor(service, 45 * 60))).toBe(2);
	});

	/** A kitchen clock is 24-hour, and 09:05 must not render as 9:5. */
	it('pads both halves', () => {
		expect(formatClockTime(new Date(2026, 0, 1, 9, 5))).toBe('09:05');
	});
});
