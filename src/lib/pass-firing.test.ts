import { describe, it, expect } from 'vitest';
import { buildPass, handsSweep, clashesOver, DEFAULT_COURSE_FIRING, type PassDishInput } from './pass';
import indexJson from './data/recipes.index.json';

import type { RecipeSummary } from './types';

/**
 * Course firing, and the hands actually in the room.
 *
 * The plan used to land every dish at one instant, so the amuse and the dessert
 * were both planned for 19:00:00 — the starter sat under a lamp for twenty
 * minutes and went out as a comp, and the plan reported clashes between two
 * dishes nobody would ever work at the same moment.
 */
const step = (hands: number, wait = 0) => ({
	text: `${hands} min`,
	handsOnSec: hands * 60,
	unattendedSec: wait * 60
});

const dish = (name: string, course: string, steps = [step(10)]): PassDishInput => ({
	slug: name.toLowerCase(),
	name,
	course,
	steps
});

describe('every course the corpus uses can be fired', () => {
	/**
	 * The gate that matters, and it reads the CORPUS rather than the type union.
	 *
	 * /menu's own COURSE_ORDER lists 8 of the 10 courses in use — it omits
	 * Breakfast (59 recipes) and Sauce (22) — so a firing map built from that
	 * list would drop 81 recipes onto an undefined anchor and silently fire them
	 * with the first plate.
	 */
	it('has an offset for every course in recipes.index.json', () => {
		const used = [...new Set((indexJson as unknown as RecipeSummary[]).map((r) => r.course))];
		const missing = used.filter((c) => !(c in DEFAULT_COURSE_FIRING));
		expect(missing, 'a course the corpus uses has no firing offset').toEqual([]);
		expect(used.length).toBeGreaterThanOrEqual(10);
	});

	it('never fires anything before the first plate', () => {
		const early = Object.entries(DEFAULT_COURSE_FIRING).filter(([, v]) => v < 0);
		expect(early).toEqual([]);
	});
});

describe('a dish lands when it is eaten', () => {
	it('fires a main after the starter rather than alongside it', () => {
		const p = buildPass([dish('Tartare', 'Starter'), dish('Rump', 'Main')]);
		const starter = p.dishes.find((d) => d.name === 'Tartare')!;
		const main = p.dishes.find((d) => d.name === 'Rump')!;
		expect(starter.firesAtMin).toBe(0);
		expect(main.firesAtMin).toBe(-25);
	});

	it('starts the later course later by exactly its offset', () => {
		const same = [step(10)];
		const p = buildPass([dish('Tartare', 'Starter', same), dish('Rump', 'Main', same)]);
		const starter = p.dishes.find((d) => d.name === 'Tartare')!;
		const main = p.dishes.find((d) => d.name === 'Rump')!;
		// Identical work, so the only difference is the anchor.
		expect(starter.elapsedMin).toBe(main.elapsedMin);
		expect(starter.startsAtMin - main.startsAtMin).toBe(25);
	});

	it('moves the dish steps with it', () => {
		const p = buildPass([dish('Rump', 'Main', [step(10), step(5)])]);
		const mine = p.steps.filter((s) => s.dish === 'Rump');
		// 15 min of work, firing 25 after service: first step starts at 15-25 = -10.
		expect(mine[0].startsAtMin).toBe(-10);
	});

	it('fires an unknown or absent course with the first plate', () => {
		const p = buildPass([
			dish('Mystery', 'Amuse-bouche'),
			{ slug: 'bare', name: 'Bare', steps: [step(10)] }
		]);
		expect(p.dishes.every((d) => d.firesAtMin === 0)).toBe(true);
	});

	it('honours a kitchen that plates on its own intervals', () => {
		const p = buildPass([dish('Rump', 'Main')], { Main: 90 });
		expect(p.dishes[0].firesAtMin).toBe(-90);
	});
});

describe('handsSweep — how many pairs of hands the plan wants', () => {
	it('reports one when nothing overlaps', () => {
		const p = buildPass([dish('A', 'Starter', [step(10)])]);
		expect(handsSweep(p.steps).every((w) => w.demand === 1)).toBe(true);
	});

	it('counts two dishes worked at the same moment', () => {
		const p = buildPass([dish('A', 'Starter', [step(30)]), dish('B', 'Starter', [step(30)])]);
		const busiest = Math.max(...handsSweep(p.steps).map((w) => w.demand));
		expect(busiest).toBe(2);
	});

	/**
	 * A dish wants ONE pair of hands however many steps it has, and its steps
	 * cannot overlap each other because they run in sequence.
	 */
	it('counts dishes, not steps', () => {
		const p = buildPass([dish('A', 'Starter', [step(10), step(10), step(10)])]);
		expect(Math.max(...handsSweep(p.steps).map((w) => w.demand))).toBe(1);
	});

	it('ignores unattended time — a simmer is not a demand on anybody', () => {
		const p = buildPass([
			dish('A', 'Starter', [step(5, 60)]),
			dish('B', 'Starter', [step(5, 60)])
		]);
		// Both wait 60 min; the hands-on windows are 5 min each and land together.
		const busiest = Math.max(...handsSweep(p.steps).map((w) => w.demand));
		expect(busiest).toBeLessThanOrEqual(2);
	});

	it('folds a busy period into one stretch rather than one per boundary', () => {
		const p = buildPass([dish('A', 'Starter', [step(30)]), dish('B', 'Starter', [step(30)])]);
		const two = handsSweep(p.steps).filter((w) => w.demand === 2);
		expect(two).toHaveLength(1);
	});
});

describe('clashesOver — the crew actually in the room', () => {
	const twoAtOnce = () =>
		buildPass([dish('A', 'Starter', [step(30)]), dish('B', 'Starter', [step(30)])]).steps;

	it('warns a solo cook', () => {
		expect(clashesOver(twoAtOnce(), 1).length).toBeGreaterThan(0);
	});

	/**
	 * The whole reason this exists. A four-cook brigade and a solo chef used to
	 * get identical warnings, and a chef warned about clashes that are not real
	 * learns to ignore the ones that are.
	 */
	it('says nothing to a brigade that can cover it', () => {
		expect(clashesOver(twoAtOnce(), 2)).toEqual([]);
		expect(clashesOver(twoAtOnce(), 4)).toEqual([]);
	});

	it('treats a nonsense crew size as one rather than dividing by zero', () => {
		expect(clashesOver(twoAtOnce(), 0).length).toBeGreaterThan(0);
		expect(clashesOver(twoAtOnce(), -3).length).toBeGreaterThan(0);
	});

	/**
	 * The stagger shrinks a clash rather than abolishing it, and the honest
	 * assertion is the one that says so: 30 minutes of work moved 25 minutes
	 * later still overlaps by 5. A test expecting zero here would be asserting
	 * that firing solves scheduling, which it does not.
	 */
	it('shrinks a clash the stagger pulls apart', () => {
		const long = [step(30)];
		const flat = { Starter: 0, Main: 0 };
		const together = buildPass([dish('A', 'Starter', long), dish('B', 'Main', long)], flat);
		const staggered = buildPass([dish('A', 'Starter', long), dish('B', 'Main', long)]);
		const span = (ws: ReturnType<typeof clashesOver>) =>
			ws.reduce((n, w) => n + (w.fromMin - w.toMin), 0);
		expect(span(clashesOver(together.steps, 1))).toBe(30);
		expect(span(clashesOver(staggered.steps, 1))).toBe(5);
	});

	it('abolishes the clash outright when the stagger clears the work', () => {
		const short = [step(10)];
		const staggered = buildPass([dish('A', 'Starter', short), dish('B', 'Main', short)]);
		expect(clashesOver(staggered.steps, 1)).toEqual([]);
	});
});
