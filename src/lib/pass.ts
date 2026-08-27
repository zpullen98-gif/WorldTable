/**
 * The pass — getting several dishes to land at the same moment.
 *
 * The Service Timeline was a printout: pinned dishes, total minutes each,
 * sorted longest first, under the advice "start at the top and work down".
 * Sorting is not scheduling. That ordering is only right for a cook who
 * finishes one dish before starting the next, which is the one thing a pass
 * never is, and a single number per dish cannot say when the cook is free — so
 * there was nothing to overlap with even in principle.
 *
 * This plans backwards from service instead. Everything lands together, which
 * is the actual requirement, and because every step now carries its work split
 * (tools/derive/service.mjs) the plan can say the thing that matters: when you
 * are holding a pan, and when you are free to start something else.
 *
 * Pure, and outside any component, for the reason mergeSessions() and
 * repertoire.ts are: a runes module cannot be reached from a unit test, and a
 * scheduler that is wrong is worse than no scheduler at all.
 */

export interface PassStepInput {
	text: string;
	handsOnSec?: number;
	unattendedSec?: number;
	estimated?: boolean;
}

export interface PassDishInput {
	slug: string;
	name: string;
	steps: PassStepInput[];
}

export interface PassStep {
	slug: string;
	dish: string;
	/** 1-based step number within its own dish. */
	n: number;
	text: string;
	/** Minutes before service that this step begins. Counts DOWN. */
	startsAtMin: number;
	handsOnMin: number;
	unattendedMin: number;
	estimated: boolean;
}

export interface PassDish {
	slug: string;
	name: string;
	/** Minutes before service this dish must begin. */
	startsAtMin: number;
	elapsedMin: number;
	handsOnMin: number;
	/** Carries a single wait too long to fit inside a service. */
	advance: boolean;
}

export interface Collision {
	atMin: number;
	/** Dish names wanting hands at the same moment. */
	dishes: string[];
	minutes: number;
}

export interface Pass {
	dishes: PassDish[];
	/** Every step from every dish, in the order they must be started. */
	steps: PassStep[];
	/** How long before service the whole plan begins. */
	lengthMin: number;
	handsOnMin: number;
	collisions: Collision[];
}

/**
 * The guide's default for work nobody timed (tools/derive/service.mjs keeps the
 * same number). Exported so the UI can tell a figure that is ENTIRELY a guess
 * from one that merely includes it — marking every row "estimated" told a cook
 * nothing, because almost every step has some unnamed work in it.
 */
export const DEFAULT_HANDS_MIN = 4;

/** A step nobody measured is a step you are working through. */
const handsOf = (s: PassStepInput) =>
	Math.round((s.handsOnSec ?? (s.unattendedSec ? 0 : DEFAULT_HANDS_MIN * 60)) / 60);
const waitOf = (s: PassStepInput) => Math.round((s.unattendedSec ?? 0) / 60);

/** Longest wait in a dish, which is what decides whether it can start today. */
const ADVANCE_MIN = 240;

/**
 * Build the plan.
 *
 * Times are minutes BEFORE service throughout — the plan is anchored at its
 * end, not its beginning, because that is the only fixed point a kitchen has.
 * Converting to clock times is the caller's job and belongs in one place.
 */
export function buildPass(dishes: PassDishInput[]): Pass {
	const planned: PassDish[] = [];
	const steps: PassStep[] = [];

	for (const d of dishes) {
		const elapsedMin = d.steps.reduce((n, s) => n + handsOf(s) + waitOf(s), 0);
		const handsOnMin = d.steps.reduce((n, s) => n + handsOf(s), 0);
		const longestWait = d.steps.reduce((n, s) => Math.max(n, waitOf(s)), 0);

		planned.push({
			slug: d.slug,
			name: d.name,
			startsAtMin: elapsedMin,
			elapsedMin,
			handsOnMin,
			advance: longestWait >= ADVANCE_MIN
		});

		// Walk the dish forward from its own start, then express each step as
		// time-before-service so every dish shares one axis.
		let offset = 0;
		d.steps.forEach((s, i) => {
			const hands = handsOf(s);
			const wait = waitOf(s);
			steps.push({
				slug: d.slug,
				dish: d.name,
				n: i + 1,
				text: s.text,
				startsAtMin: elapsedMin - offset,
				handsOnMin: hands,
				unattendedMin: wait,
				estimated: Boolean(s.estimated)
			});
			offset += hands + wait;
		});
	}

	// Earliest first: the largest "minutes before service" is the first thing to
	// start. Ties broken by dish name so the order never wobbles between builds.
	steps.sort((a, b) => b.startsAtMin - a.startsAtMin || a.dish.localeCompare(b.dish));
	planned.sort((a, b) => b.startsAtMin - a.startsAtMin || a.name.localeCompare(b.name));

	return {
		dishes: planned,
		steps,
		lengthMin: planned.reduce((n, d) => Math.max(n, d.startsAtMin), 0),
		handsOnMin: planned.reduce((n, d) => n + d.handsOnMin, 0),
		collisions: findCollisions(steps)
	};
}

/**
 * Where two dishes want the same pair of hands.
 *
 * This is the whole reason the plan is worth more than the printout. A cook
 * reading "start at the top and work down" discovers the clash at the moment it
 * happens; a plan that back-times can say it in advance.
 *
 * Steps with no hands-on time cannot collide — an unattended simmer is not a
 * demand on anybody. Overlaps are merged so one busy stretch reports once
 * rather than once per pair.
 */
export function findCollisions(steps: PassStep[]): Collision[] {
	const windows = steps
		.filter((s) => s.handsOnMin > 0)
		// Times count DOWN, so a window runs from startsAtMin to startsAtMin - hands.
		.map((s) => ({ from: s.startsAtMin, to: s.startsAtMin - s.handsOnMin, dish: s.dish }))
		.sort((a, b) => b.from - a.from);

	const out: Collision[] = [];
	for (let i = 0; i < windows.length; i++) {
		for (let j = i + 1; j < windows.length; j++) {
			const a = windows[i];
			const b = windows[j];
			if (a.dish === b.dish) continue;
			// b starts at or after a ends (remember: counting down).
			if (b.from <= a.to) break;
			const from = Math.min(a.from, b.from);
			const to = Math.max(a.to, b.to);
			const minutes = from - to;
			if (minutes <= 0) continue;

			const merged = out.find((c) => c.atMin >= to && c.atMin - c.minutes <= from);
			if (merged) {
				const end = Math.min(merged.atMin - merged.minutes, to);
				merged.atMin = Math.max(merged.atMin, from);
				merged.minutes = merged.atMin - end;
				for (const d of [a.dish, b.dish]) if (!merged.dishes.includes(d)) merged.dishes.push(d);
			} else {
				out.push({ atMin: from, dishes: [a.dish, b.dish], minutes });
			}
		}
	}
	return out.sort((x, y) => y.atMin - x.atMin);
}

/**
 * Clock time for a point on the plan, given when service is.
 * One place, because "minutes before service" appears on every row.
 */
export function clockFor(serviceAt: Date, minutesBefore: number): Date {
	return new Date(serviceAt.getTime() - minutesBefore * 60_000);
}

/** 24-hour, zero-padded. A kitchen clock is not am/pm. */
export function formatClockTime(d: Date): string {
	return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * "the day before", when a start time falls on an earlier date than service.
 * Returns 0 for same-day, 1 for the day before, and so on.
 */
export function daysEarlier(serviceAt: Date, startAt: Date): number {
	const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
	return Math.round((midnight(serviceAt) - midnight(startAt)) / 86_400_000);
}
