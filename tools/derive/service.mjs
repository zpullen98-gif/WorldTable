/**
 * The pass: how long a dish takes, and how much of that you are actually busy.
 *
 * The Service Timeline shipped as a printout — pinned dishes, total minutes,
 * sorted longest first, with the advice "start at the top and work down". That
 * advice is only correct for a cook who never overlaps two dishes, which is the
 * opposite of what a pass is. It also had nothing to overlap WITH, because one
 * number per dish cannot say when the cook is free.
 *
 * ELAPSED TIME IS NOT WORK. A coq au vin is 78 minutes elapsed and about 18
 * minutes of hands. A cacio e pepe is 17 minutes elapsed and 16 of them are
 * hands. Those two dishes are the same size on the old timeline and could not
 * be less alike to plan around: one can be walked away from for an hour, the
 * other owns you from the moment it starts. Splitting elapsed time into
 * hands-on and unattended is the measurement the whole feature rests on, and
 * nothing in the guide had it.
 *
 * ## How a duration is classified
 *
 * A step is not atomic: the median recipe has four of them, and each is a
 * compound instruction that usually mixes both kinds of time:
 *
 *   "Deglaze with wine, add stock and herbs; return chicken, simmer 45–60 min."
 *
 * So the unit here is the CLAUSE, not the step. Each stated duration is
 * classified by the verb that governs it, and the governing verb is the nearest
 * one BEFORE the duration: which is how these methods are written, and what
 * makes the difference on lines like:
 *
 *   "Bake 220°C 15 min or fry until blistered"   -> bake governs: unattended
 *   "Grill or broil hot, 3–4 min per side"       -> nothing governs, 4 < 20: hands
 *
 * Nearest-following is the tiebreak, and a bare duration with no verb either
 * side falls back to length: twenty minutes or more is a wait, because a cook
 * does not stand over a pan for twenty minutes doing something the method never
 * named.
 *
 * ## Why unstated work still costs time
 *
 * Only 34.5% of steps state a duration at all, and the unstated ones are
 * overwhelmingly the hands-on work: "Peel the membrane and coat both racks in
 * the rub", "divide into 8 balls", "cut between the bones". Scoring only stated
 * durations gave Kansas City barbecue ribs 475 minutes elapsed and ZERO minutes
 * of work: every stated number in it is a wait. So a step also earns the
 * original's four-minute default when it holds active work no duration was
 * attached to. That default is a guess and is labelled as one; the alternative
 * was a schedule that thinks ribs cook themselves.
 *
 * Parentheticals are stripped before parsing. "(or 2 h at room temp)" is an
 * ALTERNATIVE to the stated time, and summing it made a 24-hour ferment into a
 * 26-hour one.
 */

/** The original's default for a step with no stated time (L3407). A guess. */
export const DEFAULT_ACTIVE_MIN = 4;

/** With no verb either side, this long or more reads as a wait. */
export const LONG_WAIT_MIN = 20;

/** A block this long cannot be fitted into a service: it starts the day before. */
export const ADVANCE_MIN = 240;

/** The parser is the original's, widened to find EVERY duration in a clause. */
const DURATION = /(\d+)\s*(?:[–-]\s*(\d+))?\s*(min\b|minute|h\b|hour)/gi;

/** Verbs whose time the cook is free during. */
export const UNATTENDED =
	/\b(simmer|braise|bake|roast|proof|ferment|rest|chill|refrigerat|marinat|steep|rise|cure|soak|reduce|cool|infuse|brine|freeze|stand|smoke|steam|sous|dry)/gi;

/** Verbs that occupy a pair of hands for as long as they run. */
export const ACTIVE =
	/\b(sear|saut|fry|whisk|stir|knead|chop|dice|mince|slice|cut|mount|toss|flip|brown|deglaz|assembl|plate|fold|beat|blend|grate|shape|roll|wrap|pipe|garnish|season|strain|carve|arrange|dress|toast|temper|emulsif|scrape|skim|brush|coat|peel|trim|spread|layer|stuff|fill|form|press|pound|sift|cream|portion|ladle|spoon|sprinkle|squeeze|zest|crush|shuck|rub)/gi;

/** Match positions for a global regex, reset each time: lastIndex is shared state. */
function positions(re, text) {
	re.lastIndex = 0;
	return [...text.matchAll(re)].map((m) => m.index);
}

/**
 * Is this duration a wait?
 *
 * @param {string} clause
 * @param {number} at index of the duration within the clause
 * @param {number} mins
 */
export function isUnattended(clause, at, mins) {
	const waits = positions(UNATTENDED, clause);
	const hands = positions(ACTIVE, clause);
	const before = (xs) => {
		const prior = xs.filter((i) => i <= at);
		return prior.length ? at - prior[prior.length - 1] : Infinity;
	};
	const after = (xs) => {
		const later = xs.filter((i) => i > at);
		return later.length ? later[0] - at : Infinity;
	};

	const wb = before(waits);
	const hb = before(hands);
	if (wb !== hb) return wb < hb;

	const wa = after(waits);
	const ha = after(hands);
	if (wa !== ha) return wa < ha;

	return mins >= LONG_WAIT_MIN;
}

/**
 * Split one step into hands-on and unattended seconds.
 *
 * @param {string} text
 * @returns {{ handsOnSec: number, unattendedSec: number, estimated: boolean }}
 */
export function stepService(text) {
	const stripped = String(text).replace(/\([^)]*\)/g, ' ');
	let waitMin = 0;
	let handsMin = 0;
	let statedActive = 0;
	let unnamedWork = false;

	for (const clause of stripped.split(/[;.]/).map((c) => c.trim()).filter(Boolean)) {
		DURATION.lastIndex = 0;
		const found = [...clause.matchAll(DURATION)];
		if (!found.length) {
			// A clause with no time in it is work somebody still has to do. Two
			// words or fewer is a fragment, not an instruction.
			if (positions(ACTIVE, clause).length || clause.split(/\s+/).length > 2) unnamedWork = true;
			continue;
		}
		for (const m of found) {
			let mins = parseInt(m[2] || m[1], 10);
			if (m[3].toLowerCase().startsWith('h')) mins *= 60;
			mins = Math.min(mins, 600); // the original's ceiling, kept
			if (isUnattended(clause, m.index, mins)) waitMin += mins;
			else {
				handsMin += mins;
				statedActive++;
			}
		}
	}

	// Active verbs outnumbering the durations attached to them means work nobody
	// timed. One default per step, not one per verb.
	const estimated = unnamedWork || positions(ACTIVE, stripped).length > statedActive;
	if (estimated) handsMin += DEFAULT_ACTIVE_MIN;

	return { handsOnSec: handsMin * 60, unattendedSec: waitMin * 60, estimated };
}

/**
 * Totals for a whole recipe, from steps already carrying their split.
 *
 * @param {Array<{ handsOnSec?: number, unattendedSec?: number }>} steps
 */
export function recipeService(steps) {
	let handsOnSec = 0;
	let elapsedSec = 0;
	let longestWaitSec = 0;
	for (const s of steps) {
		const hands = s.handsOnSec ?? 0;
		const wait = s.unattendedSec ?? 0;
		handsOnSec += hands;
		elapsedSec += hands + wait;
		if (wait > longestWaitSec) longestWaitSec = wait;
	}
	return {
		elapsedMin: Math.round(elapsedSec / 60),
		handsOnMin: Math.round(handsOnSec / 60),
		longestWaitMin: Math.round(longestWaitSec / 60),
		/** True when one wait alone is too long to fit inside a service. */
		advance: longestWaitSec / 60 >= ADVANCE_MIN
	};
}
