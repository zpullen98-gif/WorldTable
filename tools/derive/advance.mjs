/**
 * Advance time: the wait a cook has to plan around, in days and weeks.
 *
 * "Under 40 min" filters on a recipe's `t`, which is ACTIVE minutes by
 * contract: a three week cure with twenty minutes of work is `t: 20`, and that
 * is the right number for what it measures. The filter's promise is not.
 * Guanciale, Preserved Lemons and Sauerkraut all passed "Under 40 min".
 *
 * ## Why this does not come from the service split
 *
 * tools/derive/service.mjs already measures a wait per step, and it cannot
 * answer this. Its DURATION parser reads minutes and hours only, and caps every
 * stated duration at 600 minutes, both deliberately: the Pass overlaps dishes
 * inside one service, and a three week ferment is not a block to schedule
 * around, it is a different question. Measured on this corpus, recipeService()
 * reports longestWaitMin 0 for Guanciale (3 to 5 weeks), Preserved Lemons (a
 * month), Sauerkraut (2 to 4 weeks) and Shio Koji (7 to 10 days).
 *
 * So this reads the method again, for the units service.mjs deliberately
 * ignores, and it is kept OUT of the step split so the Pass timeline and its
 * ADVANCE_MIN flag keep meaning exactly what they meant before.
 *
 * ## Waiting is not keeping
 *
 * The trap is that a method says "two weeks" for two unrelated reasons, and
 * only one of them is a wait:
 *
 *   "Ferment at 18 to 22C for 2 to 4 weeks"          Sauerkraut   a wait
 *   "Keeps two weeks refrigerated"                   Cranberry    shelf life
 *   "Eat from 30 minutes, gone by two weeks"         Red Onions   shelf life
 *   "Refrigerate up to 6 months"                     Shio Koji    shelf life
 *   "it is better after a week in the fridge"        Dulce        an opinion
 *
 * Quick Pickled Red Onions says so in the same breath: eat from 30 minutes.
 * A rule that reads every duration flags it as a two week dish, which is the
 * opposite of true. So the cue is the verb of KEEPING, never the fridge:
 * "refrigerate 7 days" is Guanciale's cure and "keeps two weeks refrigerated"
 * is not, and both name the same appliance.
 *
 * Shio Koji is the case that proves the split is worth having: it states a
 * genuine 7 to 10 day ferment AND a 6 month shelf life, and the longest number
 * in the method is the one that means nothing to a cook deciding what to make.
 */

import { ADVANCE_MIN } from './service.mjs';

/**
 * "Under 40 min": the original's threshold, kept. It lives here rather than in
 * types.ts, which re-exports it, so the build's report and the app's filter
 * cannot drift apart. Five typed counts have drifted in this repo already.
 */
export const QUICK_MINUTES = 40;

/**
 * A wait this long cannot be started and finished in one sitting, which is
 * exactly what service.mjs already means by it. Re-exported rather than
 * redefined: one number, one definition.
 */
export { ADVANCE_MIN };

/**
 * Spelled numbers the corpus actually uses.
 * @type {Record<string, number>}
 */
const WORD = {
	a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
	seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fourteen: 14, twenty: 20
};

/** @type {Record<string, number>} */
const UNIT_MIN = { hour: 60, hr: 60, day: 1440, week: 10080, month: 43200 };

const N = `(?:\\d+(?:\\.\\d+)?|${Object.keys(WORD).join('|')})`;
const DURATION = new RegExp(
	`\\b(${N})(?:\\s*(?:to|or|[-–—])\\s*(${N}))?\\s*(hours?|hrs?|days?|weeks?|months?)\\b|\\b(overnight)\\b`,
	'gi'
);

/** How long the finished thing lasts. Never the fridge, always the verb. */
const STORAGE =
	/\b(keeps?|keeping|will keep|lasts?|store[sd]?|storage|storing|gone by|best (?:within|before|in)|eat within|use within|good for|holds?|freezes? (?:for|well)|shelf life|refrigerates? well|leftovers?|up to)\b/i;

/** Edible now, nicer later. Not an instruction to wait. */
const QUALITY =
	/\b(improves?|better (?:after|in|the next)|at its best|peaks?|is bright for|tired by|mellows?|sharper)\b/i;

/** "toast only if they are a day old" is the age of a bought bagel, not a wait. */
const AGE = /^\s*old\b/i;

/** Overnight is the one unnamed duration worth reading: call it twelve hours. */
const OVERNIGHT_MIN = 720;

/**
 * @param {string} a low end of a range, or the only number
 * @param {string | undefined} b high end, when the method states one
 * @param {string} unit
 */
function minutesOf(a, b, unit) {
	/** @param {string | null | undefined} x */
	const num = (x) =>
		x == null ? null : /^\d/.test(x) ? Number(x) : (WORD[x.toLowerCase()] ?? null);
	// The top of a range is what a cook has to plan for: "3 to 5 weeks" is five.
	const n = num(b) ?? num(a);
	if (n == null) return 0;
	return n * (UNIT_MIN[unit.toLowerCase().replace(/s$/, '')] ?? 0);
}

/**
 * The longest wait a recipe's method actually asks a cook to sit through.
 *
 * @param {Array<{ text?: string } | string>} steps
 * @returns {{ advanceMin: number, advancePhrase: string }}
 */
export function advanceWait(steps) {
	let best = 0;
	let phrase = '';
	for (const raw of steps ?? []) {
		const text = typeof raw === 'string' ? raw : (raw?.text ?? '');
		for (const clause of String(text)
			.split(/[;.]/)
			.map((c) => c.trim())
			.filter(Boolean)) {
			if (STORAGE.test(clause) || QUALITY.test(clause)) continue;
			DURATION.lastIndex = 0;
			for (const m of clause.matchAll(DURATION)) {
				if (AGE.test(clause.slice(m.index + m[0].length))) continue;
				const mins = m[4] ? OVERNIGHT_MIN : minutesOf(m[1], m[2], m[3]);
				if (mins > best) {
					best = mins;
					phrase = m[0];
				}
			}
		}
	}
	return { advanceMin: best, advancePhrase: phrase };
}
