/**
 * The pass: getting several dishes to land at the same moment.
 *
 * The Service Timeline was a printout: pinned dishes, total minutes each,
 * sorted longest first, under the advice "start at the top and work down".
 * Sorting is not scheduling. That ordering is only right for a cook who
 * finishes one dish before starting the next, which is the one thing a pass
 * never is, and a single number per dish cannot say when the cook is free, so
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
	/**
	 * Which course this is, so it can fire when it is actually eaten. A dish
	 * with no course falls to 0: it lands with the first plate, which is what
	 * every dish did before firing existed.
	 */
	course?: string;
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
	/**
	 * When this dish LANDS, in minutes before the first plate leaves.
	 *
	 * 0 for the first course and NEGATIVE for later ones: a main firing 25
	 * minutes into service lands at -25. Negative reads oddly until you
	 * remember the whole module counts down: service is the origin, not the
	 * end of time.
	 */
	firesAtMin: number;
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
 * from one that merely includes it: marking every row "estimated" told a cook
 * nothing, because almost every step has some unnamed work in it.
 */
export const DEFAULT_HANDS_MIN = 4;

/**
 * When each course fires, in minutes AFTER the first plate leaves.
 *
 * AUTHORED, AND NOT FROM THE GUIDE. The guide states no stagger anywhere, and
 * this must never be presented as though it does. These are ordinary service
 * intervals, they are a default rather than a claim, and the UI shows the
 * number so a kitchen that plates differently can say so.
 *
 * WHY IT EXISTS. Every dish used to land at one instant, so the amuse and the
 * dessert were both planned for 19:00:00: the starter sat under a lamp for
 * twenty minutes and went out as a comp, and the plan reported clashes between
 * two dishes nobody would ever work at the same moment.
 *
 * EVERY COURSE MUST APPEAR. /menu's own COURSE_ORDER lists 8 of the 10 the
 * corpus uses; it omits Breakfast (59 recipes) and Sauce (22), so a map built
 * from that list would drop 81 recipes onto an undefined anchor. There is a
 * test that fails if a Course value is missing here.
 */
export const DEFAULT_COURSE_FIRING: Record<string, number> = {
	// With the first plate.
	Starter: 0,
	Salad: 0,
	Soup: 0,
	Bread: 0,
	Breakfast: 0,
	Drink: 0,
	// With the main.
	Main: 25,
	Side: 25,
	Sauce: 25,
	// After it.
	Dessert: 55
};

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
export function buildPass(
	dishes: PassDishInput[],
	firing: Record<string, number> = DEFAULT_COURSE_FIRING
): Pass {
	const planned: PassDish[] = [];
	const steps: PassStep[] = [];

	for (const d of dishes) {
		// Minutes after the first plate that this one is wanted. An unknown or
		// absent course fires with the first plate rather than at some invented
		// interval, under-claiming, which is the safe direction for a plan.
		const fireAfter = firing[d.course ?? ''] ?? 0;
		const elapsedMin = d.steps.reduce((n, s) => n + handsOf(s) + waitOf(s), 0);
		const handsOnMin = d.steps.reduce((n, s) => n + handsOf(s), 0);
		const longestWait = d.steps.reduce((n, s) => Math.max(n, waitOf(s)), 0);

		planned.push({
			slug: d.slug,
			name: d.name,
			// `-fireAfter` is negative ZERO for the first course, which survives into
			// stored state and breaks Object.is comparisons while printing as 0.
			firesAtMin: fireAfter === 0 ? 0 : -fireAfter,
			startsAtMin: elapsedMin - fireAfter,
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
				startsAtMin: elapsedMin - fireAfter - offset,
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
 * Steps with no hands-on time cannot collide: an unattended simmer is not a
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
 * How many pairs of hands the plan wants, minute by minute.
 *
 * WHY NOT REUSE findCollisions. Its merge step unions dish names across a
 * widened stretch, so `collision.dishes.length` is "dishes touched anywhere in
 * this busy period", not "dishes wanting hands at this instant". Dividing that
 * by a crew size would suppress real clashes on a four-cook morning and invent
 * them on a two-cook one, the exact failure that teaches a chef to ignore the
 * warnings that are real. So this is a separate sweep and findCollisions is
 * left exactly as it was.
 *
 * Demand is counted in DISHES, not steps: one dish wants one pair of hands, and
 * a dish cannot overlap itself because its steps run in sequence.
 */
export interface HandsWindow {
	/** Minutes before service this stretch begins (the larger number). */
	fromMin: number;
	/** Minutes before service it ends (the smaller number). */
	toMin: number;
	/** Pairs of hands wanted across the whole stretch. */
	demand: number;
	dishes: string[];
}

export function handsSweep(steps: PassStep[]): HandsWindow[] {
	const windows = steps
		.filter((s) => s.handsOnMin > 0)
		.map((s) => ({ from: s.startsAtMin, to: s.startsAtMin - s.handsOnMin, dish: s.dish }));
	if (!windows.length) return [];

	// Every boundary, descending, because the axis counts down.
	const points = [...new Set(windows.flatMap((w) => [w.from, w.to]))].sort((a, b) => b - a);

	const raw: HandsWindow[] = [];
	for (let i = 0; i < points.length - 1; i++) {
		const fromMin = points[i];
		const toMin = points[i + 1];
		if (fromMin <= toMin) continue;
		const active = windows.filter((w) => w.from >= fromMin && w.to <= toMin);
		const dishes = [...new Set(active.map((w) => w.dish))].sort();
		if (!dishes.length) continue;
		raw.push({ fromMin, toMin, demand: dishes.length, dishes });
	}

	// Fold neighbouring stretches that want the same hands for the same dishes,
	// so one busy period reports once rather than once per boundary crossed.
	const out: HandsWindow[] = [];
	for (const w of raw) {
		const last = out[out.length - 1];
		if (
			last &&
			last.toMin === w.fromMin &&
			last.demand === w.demand &&
			last.dishes.join('|') === w.dishes.join('|')
		) {
			last.toMin = w.toMin;
		} else {
			out.push({ ...w });
		}
	}
	return out;
}

/**
 * Where the plan wants more hands than the kitchen has tonight.
 *
 * A solo cook and a four-cook brigade get different answers, which is the whole
 * point: identical warnings for both is how a plan loses the room.
 */
export function clashesOver(steps: PassStep[], hands: number): HandsWindow[] {
	const crew = Math.max(1, Math.floor(hands));
	return handsSweep(steps).filter((w) => w.demand > crew);
}

/**
 * What a step ACTUALLY takes, from the ticks a cook left behind.
 *
 * ELAPSED, NEVER HANDS-ON. A tick pair measures wall clock between two taps: it
 * cannot tell a wait from the cook answering the phone, and calling it hands-on
 * would quietly corrupt the one number the whole plan is built from. Callers
 * must label it "elapsed here".
 *
 * Three rules, all of them about refusing to say something:
 *   - only steps with no unattended time are observable at all (the caller
 *     filters those out; a step with a wait measures the wait, not the work)
 *   - three observations minimum, because two is an anecdote
 *   - anything beyond 4x the estimate is discarded, because it is a cook who
 *     ticked, walked away, and ticked again after service
 *
 * The median rather than the mean, for the same reason: one long interval that
 * survives the filter should not drag the answer.
 */
export const ACTUALS_MIN_OBSERVATIONS = 3;
export const ACTUALS_OUTLIER_FACTOR = 4;

export function observedElapsed(samples: number[], estimateMin: number): number | null {
	const kept = samples.filter(
		(s) => Number.isFinite(s) && s > 0 && (estimateMin <= 0 || s <= estimateMin * ACTUALS_OUTLIER_FACTOR)
	);
	if (kept.length < ACTUALS_MIN_OBSERVATIONS) return null;
	const sorted = [...kept].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2
		? sorted[mid]
		: Math.round((sorted[mid - 1] + sorted[mid]) / 2);
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
