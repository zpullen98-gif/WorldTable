/**
 * Building a drill round.
 *
 * Pure, and outside any component, for the reason repertoire.ts and pass.ts
 * are: a runes module cannot be reached from a unit test, and the two bugs
 * below are precisely the kind that only a test catches.
 *
 * ## The defect this exists not to repeat
 *
 * The lexicon's quiz draws its distractors from the SAME array it draws its
 * target from:
 *
 *     const pool = shown.length >= 4 ? shown : data.lexicon;
 *     const sameCat = pool.filter(…);
 *     while (others.size < 4) { others.set(pick(…)) }
 *
 * It survives only because `pool` falls back to all 479 terms. Point the same
 * loop at a DUE QUEUE, which is what a scheduled drill asks from, and two
 * things break at once: a server with four due cheeses gets the same four
 * buttons every question, and a queue of three spins that `while` forever.
 *
 * So there are two arrays here and they are never the same one. POOL is what
 * gets asked. FIELD is where wrong answers come from, decided at build time in
 * tools/derive/drills.mjs and shipped per card.
 *
 * ## Termination
 *
 * `optionsFor` never loops waiting for luck. It shuffles a candidate list and
 * takes from it, so it returns in bounded time even when the field is smaller
 * than the round needs: it returns fewer options rather than hanging, and
 * `buildRound` drops a question it cannot field.
 */

export interface DrillCard {
	slug: string;
	term: string;
	category: string;
	moduleId: string;
	/** The definition with the term's own words redacted. */
	prompt: string;
	/** Where this card's wrong answers come from. Decided at build time. */
	field: 'category' | 'module' | 'all';
}

export interface DrillQuestion {
	target: DrillCard;
	options: DrillCard[];
}

/** Ten, always. See the verdict ladder — a short round inflates the verdict. */
export const ROUND_LENGTH = 10;

export const OPTIONS_PER_QUESTION = 4;

/** Injectable so tests are deterministic; Math.random in production. */
export type Rand = () => number;

/** Fisher–Yates on a copy. Never `sort(() => Math.random() - 0.5)`, which is
 *  biased and, in some engines, a comparator contract violation. */
export function shuffle<T>(items: readonly T[], rand: Rand): T[] {
	const a = [...items];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

/** The candidate wrong answers for a target, per its shipped field. */
export function fieldFor(target: DrillCard, all: readonly DrillCard[]): DrillCard[] {
	const not = (c: DrillCard) => c.slug !== target.slug;
	if (target.field === 'category') {
		return all.filter((c) => not(c) && c.category === target.category);
	}
	if (target.field === 'module') {
		return all.filter((c) => not(c) && c.moduleId === target.moduleId);
	}
	return all.filter(not);
}

/**
 * One question. Returns null when the deck cannot field enough options, which
 * a caller should skip rather than paper over — a question with two buttons is
 * not a question.
 */
export function optionsFor(
	target: DrillCard,
	all: readonly DrillCard[],
	rand: Rand
): DrillQuestion | null {
	const candidates = shuffle(fieldFor(target, all), rand);
	const options = [target, ...candidates.slice(0, OPTIONS_PER_QUESTION - 1)];
	if (options.length < OPTIONS_PER_QUESTION) return null;
	return { target, options: shuffle(options, rand) };
}

/**
 * A round.
 *
 * `due` is asked first — that is the point of scheduling it. The round is then
 * topped up from cards never drilled at all, and only then from the rest. It is
 * NEVER shortened to fit: a three-question round scoring 3/3 clears the top
 * rung of the verdict ladder below and logs a clean sweep that did not happen.
 */
export function buildRound(
	all: readonly DrillCard[],
	due: readonly string[],
	drilled: ReadonlySet<string>,
	rand: Rand,
	length: number = ROUND_LENGTH
): DrillQuestion[] {
	const bySlug = new Map(all.map((c) => [c.slug, c]));
	const seen = new Set<string>();
	/** @type {DrillCard[]} */
	const order: DrillCard[] = [];

	const take = (cards: DrillCard[]) => {
		for (const c of cards) {
			if (order.length >= length) return;
			if (seen.has(c.slug)) continue;
			seen.add(c.slug);
			order.push(c);
		}
	};

	take(due.map((s) => bySlug.get(s)).filter((c): c is DrillCard => Boolean(c)));
	take(shuffle(all.filter((c) => !drilled.has(c.slug)), rand));
	take(shuffle(all, rand));

	const questions: DrillQuestion[] = [];
	for (const target of order) {
		const q = optionsFor(target, all, rand);
		if (q) questions.push(q);
	}
	return questions;
}

/**
 * What a score is called.
 *
 * Four rungs, and the reason ROUND_LENGTH is fixed: these thresholds are
 * absolute counts, so a shorter round reaches the top rung on fewer right
 * answers. The menu drill already guards the same way with its
 * two-drillable-dish floor.
 */
export function verdictFor(right: number, of: number = ROUND_LENGTH): string {
	if (of !== ROUND_LENGTH) return `${right} of ${of}`;
	if (right >= 9) return 'Service standard';
	if (right >= 7) return 'Solid. You would not be caught out';
	if (right >= 5) return 'Halfway. Read the module again';
	return 'Not yet. This is what the track is for';
}

/**
 * A drill answer as the scheduler understands it.
 *
 * Right first time is `met`; right after revealing is `close`; wrong is
 * `missed`. The same three the plate is graded with, so repertoire() schedules
 * a term and a dish through one ladder rather than two.
 */
export function gradeFor(correct: boolean, revealed: boolean): 'met' | 'close' | 'missed' {
	if (!correct) return 'missed';
	return revealed ? 'close' : 'met';
}
