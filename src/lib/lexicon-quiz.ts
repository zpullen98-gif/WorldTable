/**
 * The Lexicon quiz, made to remember.
 *
 * Pure, and outside the component, for the reason drill.ts and repertoire.ts
 * are: a runes module cannot be reached from a unit test, and every defect
 * below is exactly the kind only a test catches.
 *
 * ## What was wrong, measured
 *
 * The quiz forgot everything. It asked ten questions, printed a verdict ported
 * from the original, dispatched one aggregate `oot:round-complete` to the
 * monorepo's log, and set `quiz = null`. Meanwhile the service drill has
 * scheduled its terms all along, through repertoire()/dueList() and the same
 * session.drillLog — and ALL 186 of its cards are lexicon terms. The other 293
 * lexicon terms had no memory anywhere in the app.
 *
 * Two more defects sat in the code it replaces:
 *
 *   `[...others.values()].sort(() => Math.random() - 0.5)` is the comparator
 *   drill.ts:58 bans. The Map is always built target-first, so the pre-sort
 *   order is [target, d1, d2, d3] and V8's sort is not a shuffle: over 200,000
 *   runs the target lands in slot 1 36.0% of the time and slot 4 31.2%, 67.2%
 *   in the two ends against a fair 50%. The answer was partly guessable from
 *   where it sat, which is worse in a study tool than anywhere else.
 *
 *   `ask()` held no reference to the previous target, so a filtered round asked
 *   the same term repeatedly. Harmless while nothing was recorded; not harmless
 *   once every answer writes to a ladder.
 *
 * ## Why a quiz answer is worth `close`, never `met`
 *
 * The drill asks from a build-time REDACTED prompt: the definition with its own
 * term's words taken out. The quiz shows `definition.slice(0, 180)` raw, and
 * measured over the shipped lexicon, 307 of 479 definitions (64.1%) contain a
 * significant word of their own term inside those first 180 characters. So a
 * right answer here is the case gradeFor() already documents as `close`: right,
 * with part of the answer visible.
 *
 * On the ladder (repertoire.ts rungFor) `close` HOLDS. A quiz answer can put a
 * never-answered term on rung 1 and can refresh a term's clock, but it can
 * never promote one. Only the redacted drill climbs a term to the 6/14/35/90
 * day rungs. The weaker evidence gets the weaker effect, and the asymmetry is
 * deliberate: service/drill keeps grading `met`.
 *
 * The accepted cost, stated rather than hidden: a term resting on rung 4 that
 * is answered here has its 35-day clock restarted without earning it. That is
 * generous and bounded. Recording only when a term is already due would be
 * tighter and is too clever to explain on the page.
 *
 * ## POOL and FIELD are never the same array
 *
 * drill.ts:22 wrote that rule about THIS file's old code. It is applied here:
 * POOL is what gets asked (the cook's current filter, so the quiz still asks
 * what they are studying); FIELD is where wrong answers come from, and it is
 * always the whole 479-term lexicon. That is what makes a round safe at any
 * filter width and lets the old `while (others.size < 4)` rejection loop go.
 * Every one of the 19 lexicon categories holds at least 5 terms, so four
 * distinct options are always fieldable from a target's own category.
 */
import { shuffle, type Rand } from './drill';

/** Structural, so it matches a lexicon.json entry without importing the data. */
export interface LexTerm {
	slug: string;
	term: string;
	category: string;
	definition?: string;
}

export interface LexQuestion<T extends LexTerm = LexTerm> {
	target: T;
	options: T[];
}

/** Ten, and fixed: the verdict ladder's thresholds are absolute counts. */
export const QUIZ_LENGTH = 10;

/** How many buttons a question offers, target included. */
export const OPTION_COUNT = 4;

/**
 * The next term to ask: due first, then never-asked, then anything.
 *
 * `asked` is the round's own set, so a filtered pool narrower than the round is
 * length is walked without repeating while an alternative exists. It returns a
 * repeat only when the pool is genuinely exhausted, and null only when empty —
 * it never loops waiting for luck.
 */
export function nextTarget<T extends LexTerm>(
	pool: readonly T[],
	dueSlugs: readonly string[],
	asked: ReadonlySet<string>,
	rand: Rand
): T | null {
	if (!pool.length) return null;
	const inPool = new Map<string, T>(pool.map((e) => [e.slug, e]));

	for (const slug of dueSlugs) {
		const hit = inPool.get(slug);
		if (hit && !asked.has(slug)) return hit;
	}
	const unasked = pool.filter((e) => !asked.has(e.slug));
	if (unasked.length) return shuffle(unasked, rand)[0];
	return shuffle([...pool], rand)[0];
}

/**
 * A question. Shuffle and take, never a rejection loop.
 *
 * `field` is the whole lexicon, NOT the pool: telling hanger from flank is the
 * skill, telling hanger from crème anglaise is a giveaway, and drawing wrong
 * answers from a four-term filter would hand the cook the same four buttons
 * every question.
 */
export function optionsForTerm<T extends LexTerm>(
	target: T,
	field: readonly T[],
	rand: Rand
): LexQuestion<T> {
	const sameCat = field.filter((e) => e.category === target.category && e.slug !== target.slug);
	const others = field.filter((e) => e.slug !== target.slug);
	const from = sameCat.length >= OPTION_COUNT - 1 ? sameCat : others;
	const picked = shuffle(from, rand).slice(0, OPTION_COUNT - 1);
	return { target, options: shuffle([target, ...picked], rand) };
}

/**
 * What a quiz answer is worth. Never 'met' — see the header.
 */
export function gradeForQuiz(correct: boolean): 'close' | 'missed' {
	return correct ? 'close' : 'missed';
}
