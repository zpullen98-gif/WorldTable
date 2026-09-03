/**
 * The pass: how long a dish takes, and how much of that you are actually busy.
 *
 * The Service Timeline shipped as a printout: pinned dishes, total minutes,
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

/**
 * The parser is the original's, widened to find EVERY duration in a clause -
 * and then twice more, for two things it could not read at all.
 *
 * DECIMALS. The clause splitter below cut on a bare full stop, so "simmer
 * 1.5 h" became the clauses "simmer 1" and "5 h", and the step booked FIVE
 * HOURS. 33 recipes said it that way and every one of them shipped 300 minutes
 * of wait: curry-goat's "2-2.5 h", gulyas's "1.5 h", schweinshaxe's "2.5 h".
 * The number was not merely rounded, it was the digits after the point read as
 * a fresh duration. Both halves of the fix are required: the splitter must not
 * cut a decimal point, and DURATION must be able to read one.
 *
 * DAYS AND WEEKS AND OVERNIGHT. 140 steps across 125 recipes state a wait in
 * units this regex had never seen, and booked ZERO for it - "marinate
 * overnight", "cure 3 days", "hang a week". The service split therefore
 * understated their elapsed time by the whole wait, which is what the prep
 * board back-times from. (The "start it the day before" banner is safe: it
 * comes from advanceMin, a separate derivation in advance.mjs that has always
 * read these units. That is why this was quiet.)
 *
 * `overnight` carries no number, so it is its own pattern, valued at eight
 * hours - the reading a kitchen would give it, and the one the ceiling below
 * leaves intact.
 */
const DURATION =
	/(\d+(?:\.\d+)?)\s*(?:[–-]\s*(\d+(?:\.\d+)?))?\s*(min\b|minute|h\b|hour|day|week)/gi;

/** A wait with no number on it. Eight hours is what a kitchen means by it. */
const OVERNIGHT = /\bovernight\b/gi;
const OVERNIGHT_MIN = 8 * 60;

/*
 * A recurrence is not a block of time.
 *
 * "turning the parcel every 12 hours" states how OFTEN a short act repeats, not
 * how long anything takes. Read as a duration it charged twelve hours; read as
 * a recurrence it is four turns of about a minute. The precedent for refusing a
 * number outright is one file over: advance.mjs disqualifies clauses matching
 * STORAGE, QUALITY or AGE before scoring any duration at all.
 *
 * `every` only, never `each`: across 1,844 recipes `each` precedes a parsable
 * duration ZERO times, while it is distributive 59 times ("whisking each
 * addition", "soak each overnight").
 */
const RECURRENCE_BEFORE = /\bevery\s*$/i;
const RECURRENCE_AFTER = /^\s*[\u2013-]?\s*intervals?\b/i;

/** One turn, one baste, one fold. The act a recurrence repeats is short. */
export const RECURRENCE_ACTION_MIN = 1;

/*
 * One range written long is ONE duration.
 *
 * DURATION understands a dash range and keeps its top (`m[2] || m[1]`), but
 * "6 hours to 7 hours" matches TWICE and both were summed: 80 sites across 69
 * recipes, charging thirteen hours where seven were meant. COMPOUND carries the
 * same logic back over a compound low end, so "1 hour 30 minutes to 2 hours" is
 * two hours rather than three and a half.
 */
const SPELLED_RANGE = /^s?\s*to\s*$/i;
const COMPOUND = /^s?\s+$/i;

/** Verbs whose time the cook is free during. */
export const UNATTENDED =
	/\b(simmer|braise|bake|roast|proof|ferment|rest|chill|refrigerat|marinat|steep|rise|cure|soak|reduce|cool|infuse|brine|freeze|stand|smoke|steam|sous|dry)/gi;

/** Verbs that occupy a pair of hands for as long as they run. */
export const ACTIVE =
	/\b(sear|saut|fry|whisk|stir|knead|chop|dice|mince|slice|cut|mount|toss|flip|brown|deglaz|assembl|plate|fold|beat|blend|grate|shape|roll|wrap|pipe|garnish|season|strain|carve|arrange|dress|toast|temper|emulsif|scrape|skim|brush|coat|peel|trim|spread|layer|stuff|fill|form|press|pound|sift|cream|portion|ladle|spoon|sprinkle|squeeze|zest|crush|shuck|rub)/gi;

/**
 * Match positions for a global regex, reset each time: lastIndex is shared state.
 * @param {RegExp} re
 * @param {string} text
 * @returns {number[]}
 */
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
	/*
	 * Four hours or more is not a pair of hands, whatever verb sits nearest.
	 *
	 * ADVANCE_MIN is this module's OWN line for "cannot be fitted into a
	 * service: it starts the day before", and a block that cannot fit inside a
	 * service is not service work. Below the line the nearest-verb rule decides
	 * exactly as before, so nothing short moves: a dark roux whisked 30-45 min
	 * and taffy pulled 15-20 min stay hands-on. That is the whole reason to
	 * prefer a magnitude line to a vocabulary edit - adding `cook` to
	 * UNATTENDED would have flipped 192 durations with a median of five
	 * minutes, most of them correctly attended work.
	 *
	 * Above the line no verb in range is worth trusting, because the verbs that
	 * govern a long hold - hold, hang, leave, retard, drain - are in NEITHER
	 * list. `before(waits)` then returns Infinity, Infinity is never less than
	 * a finite number, and the nearest ACTIVE token wins by accident. On the
	 * flagship case the winner was `layer`, out of "two layers of film", and a
	 * 48-hour cure booked twenty hours of work.
	 *
	 * Measured: 45 stated durations of 240 min or more were booked hands-on,
	 * across 42 steps in 39 recipes. Every one is a cure, brine, prove, drain,
	 * hang, smoke, roast or long hold. No false positives.
	 */
	if (mins >= ADVANCE_MIN) return true;
	const waits = positions(UNATTENDED, clause);
	const hands = positions(ACTIVE, clause);
	/** @param {number[]} xs */
	const before = (xs) => {
		const prior = xs.filter((i) => i <= at);
		return prior.length ? at - prior[prior.length - 1] : Infinity;
	};
	/** @param {number[]} xs */
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

	/* (?!\d): a full stop with a digit after it is a decimal point, not the end
	   of a clause. Splitting on it is what turned "1.5 h" into five hours. */
	for (const clause of stripped.split(/[;.](?!\d)/).map((c) => c.trim()).filter(Boolean)) {
		DURATION.lastIndex = 0;
		const all = [...clause.matchAll(DURATION)];

		/*
		 * "marinate overnight" is a wait with no number on it. Counted here
		 * rather than in DURATION because it has no digits to capture, and only
		 * when the clause states no other duration.
		 *
		 * That last condition is measured, not cautious-by-default. 107 clauses
		 * say overnight alone and take the full eight hours. The 26 that pair it
		 * with a number are mostly shapes where ADDING would be plainly wrong: a
		 * range ("marinate 30 min to overnight", "4 h to overnight"), an
		 * alternative ("rise 90 min, or cold-ferment overnight"), or a
		 * restatement ("keep it at 40-45C overnight, 12 hours" - the overnight IS
		 * the twelve hours). A few are genuine sequences ("proof 20 min, then
		 * refrigerate overnight") and those are under-counted. Under-counting is
		 * the safe direction here: over-counting a wait is what item 18 spent its
		 * whole effort undoing.
		 *
		 * Unattended by definition: nobody stands over it.
		 */
		OVERNIGHT.lastIndex = 0;
		if (!all.length && OVERNIGHT.test(clause)) {
			waitMin += OVERNIGHT_MIN;
			if (positions(ACTIVE, clause).length || clause.split(/\s+/).length > 2) unnamedWork = true;
			continue;
		}

		if (!all.length) {
			// A clause with no time in it is work somebody still has to do. Two
			// words or fewer is a fragment, not an instruction.
			if (positions(ACTIVE, clause).length || clause.split(/\s+/).length > 2) unnamedWork = true;
			continue;
		}
		// One range written long is one duration: keep the top, drop the low end.
		/** @param {number} i */
		const gap = (i) => clause.slice(all[i - 1].index + all[i - 1][0].length, all[i].index);
		/** @type {Set<number>} */
		const low = new Set();
		for (let i = 1; i < all.length; i++) {
			if (!SPELLED_RANGE.test(gap(i))) continue;
			low.add(i - 1);
			for (let j = i - 1; j > 0 && COMPOUND.test(gap(j)); j--) low.add(j - 1);
		}
		const found = all.filter((_, i) => !low.has(i));

		// Raw minutes, BEFORE the ceiling: a recurrence needs the true span to
		// know how many visits it stands for. Capped, dill's 48 hours would
		// derive one turn instead of four.
		const raw = found.map((m) => {
			// parseFloat, not parseInt: "2.5 h" is two and a half hours, and the
			// top of a range is still the top ("2-2.5 h" is 150 minutes).
			const v = parseFloat(m[2] || m[1]);
			const unit = m[3].toLowerCase();
			const perUnit = unit.startsWith('h') ? 60 : unit.startsWith('d') ? 1440 : unit.startsWith('w') ? 10080 : 1;
			return Math.round(v * perUnit);
		});
		const recurs = found.map(
			(m) =>
				RECURRENCE_BEFORE.test(clause.slice(0, m.index)) ||
				RECURRENCE_AFTER.test(clause.slice(m.index + m[0].length))
		);
		/** The block a recurrence repeats inside, when the clause states one. */
		const span = Math.max(0, ...raw.filter((_, i) => !recurs[i]));
		let timed = 0;

		found.forEach((m, i) => {
			if (recurs[i]) {
				const reps = Math.min(12, Math.max(1, Math.round(span / raw[i]) || 1));
				handsMin += reps * RECURRENCE_ACTION_MIN;
				// Counted as stated work, or the 4-minute default double-charges it.
				statedActive++;
				return;
			}
			timed++;
			/*
			 * 600 comes from the original's stepDur, where a NON-GLOBAL match
			 * capped ONE undifferentiated elapsed number per step for a printed
			 * T+ axis. Here DURATION is global and the ceiling applies per
			 * MATCH, so a step can still compose past it. Kept as a damper on
			 * the parser, not as the original's contract - which is honoured
			 * where it belongs, in build-data.mjs's durationSec for the timer.
			 */
			const mins = Math.min(raw[i], 600);
			if (isUnattended(clause, m.index, mins)) waitMin += mins;
			else {
				handsMin += mins;
				statedActive++;
			}
		});

		// A clause whose ONLY number was a recurrence still holds work nobody
		// timed: "Mop lightly every 45 min" is not a step that costs nothing.
		if (!timed && (positions(ACTIVE, clause).length || clause.split(/\s+/).length > 2))
			unnamedWork = true;
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
