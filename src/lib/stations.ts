/**
 * Station coverage — who can hold which section of the line.
 *
 * The question a kitchen manager actually asks at four in the afternoon is not
 * "what did Devon score on cheese". It is "my saucier just called in sick, who
 * can cover?". Everything here exists to answer that one.
 *
 * ## Nothing new is tracked
 *
 * Coverage is computed from what the app already records. A person cooks a
 * dish; the dish drills techniques (techniques.json carries the complete recipe
 * list per technique); each technique belongs to a station. So a cooked log
 * already contains a station map — it has since the technique spine landed, and
 * nothing has ever read it that way.
 *
 * ## What this deliberately does NOT say
 *
 * It never says somebody IS a saucier, is qualified, is signed off, or is
 * certified. It reports how much of a station's work a person has actually
 * done, in counts, and leaves the judgement where it belongs — with the chef
 * who has watched them work. The bands are descriptive ("most of it") and never
 * a verdict ("competent"). That is the same line the safety feature drew and it
 * holds here for the same reason: an app that appears to certify somebody owns
 * the consequences of being wrong.
 */

// repertoire.ts does not import this module, so the direction is one-way and
// there is no cycle. The decay model lives there and is not duplicated here.
import { repertoire, type CookEntry } from './repertoire';

export type StationKey =
	| 'saucier'
	| 'garde-manger'
	| 'patissier'
	| 'poissonnier'
	| 'rotisseur'
	| 'entremetier';

export interface Station {
	key: StationKey;
	/** As the guide's own Brigade entry names it. */
	name: string;
	/** What the guide says the station covers. */
	remit: string;
	/** Technique labels belonging to it. */
	techniques: string[];
}

/** One cook or one drill answer — the shape both logs already use. */
export interface Attempt {
	slug: string;
	at: number;
	grade?: 'met' | 'close' | 'missed';
}

export type Band = 'none' | 'started' | 'most' | 'all';

export interface StationCoverage {
	key: StationKey;
	name: string;
	/** Techniques in the station. */
	of: number;
	/** Techniques the person has touched at least once. */
	touched: number;
	/**
	 * Techniques where the most recent attempt on a dish drilling it MET the
	 * dish's standard. Only 45 of 970 dishes carry one, so this is always a
	 * floor rather than a measure — it is reported, never used to gate a band.
	 */
	met: number;
	band: Band;
	/** Untouched technique labels, so the answer is actionable. */
	gaps: string[];
}

/**
 * Bands, not scores.
 *
 * Deliberately coarse. A percentage invites a threshold, a threshold invites a
 * pass mark, and a pass mark is the certification this must never become. Four
 * words a chef can read across a room is the right resolution.
 */
export function bandFor(touched: number, of: number): Band {
	if (of === 0 || touched === 0) return 'none';
	if (touched >= of) return 'all';
	return touched * 2 >= of ? 'most' : 'started';
}

export const BAND_LABEL: Record<Band, string> = {
	none: 'not started',
	started: 'some of it',
	most: 'most of it',
	all: 'all of it'
};

/**
 * Which techniques a person has touched, from what they have cooked.
 *
 * `recipesByTechnique` is techniques.json's own complete list — the same data
 * the technique pages render, so a technique is "touched" by exactly the dishes
 * the app already says demonstrate it.
 */
export function techniquesTouched(
	attempts: readonly Attempt[],
	recipesByTechnique: ReadonlyMap<string, readonly string[]>
): Map<string, 'met' | 'close' | 'missed' | 'ungraded'> {
	// Most recent attempt per dish — an old failure that was later put right
	// should not hold a technique down forever.
	const latest = new Map<string, Attempt>();
	for (const a of attempts) {
		const seen = latest.get(a.slug);
		if (!seen || a.at >= seen.at) latest.set(a.slug, a);
	}

	const out = new Map<string, 'met' | 'close' | 'missed' | 'ungraded'>();
	for (const [technique, recipes] of recipesByTechnique) {
		let best: 'met' | 'close' | 'missed' | 'ungraded' | null = null;
		for (const slug of recipes) {
			const a = latest.get(slug);
			if (!a) continue;
			const grade = a.grade ?? 'ungraded';
			// Best attempt across the technique's dishes: one clean plate is
			// evidence, and a miss on a different dish does not erase it.
			if (grade === 'met' || best === null) best = grade;
			else if (best === 'missed' && grade !== 'missed') best = grade;
		}
		if (best !== null) out.set(technique, best);
	}
	return out;
}

/** Coverage across every station, for one person. */
export function coverageFor(
	attempts: readonly Attempt[],
	stations: readonly Station[],
	recipesByTechnique: ReadonlyMap<string, readonly string[]>
): StationCoverage[] {
	const touchedMap = techniquesTouched(attempts, recipesByTechnique);
	return stations.map((s) => {
		const touched = s.techniques.filter((t) => touchedMap.has(t));
		const met = touched.filter((t) => touchedMap.get(t) === 'met');
		return {
			key: s.key,
			name: s.name,
			of: s.techniques.length,
			touched: touched.length,
			met: met.length,
			band: bandFor(touched.length, s.techniques.length),
			gaps: s.techniques.filter((t) => !touchedMap.has(t))
		};
	});
}

/**
 * The swing cook.
 *
 * The guide calls the tournant "the swing cook who works every station — often
 * the best pure cook in the building". It is the one label here worth earning,
 * and it is earned by covering all six rather than by scoring anything.
 */
export function isTournant(coverage: readonly StationCoverage[]): boolean {
	return coverage.length > 0 && coverage.every((c) => c.band === 'all');
}

/**
 * Who can cover a station tonight, best first.
 *
 * The whole point of the board. Sorted by how much of the station a person has
 * actually done, then by how much of it they have done to a stated standard.
 */
/**
 * Which of a person's touched techniques have GONE COLD.
 *
 * "Can they still do it" is what a chef actually means, and the board had no
 * answer: a technique cooked once three years ago read identically to one
 * cooked last night. The decay model already exists one module away — this
 * reuses repertoire()'s own dueAt rather than inventing a second clock.
 *
 * A technique is cold when EVERY dish the person has cooked that drills it is
 * past its re-cook date. One dish still in date keeps the technique warm, which
 * matches how a cook actually holds a skill: the last time you did it counts,
 * not the average of every time.
 *
 * It reports a COUNT of cold techniques and never a remaining count. "2 of 10
 * left" is bandFor's percentage with the division done in the reader's head,
 * and it walks straight into the threshold this board exists to refuse.
 */
export function coldTechniques(
	log: CookEntry[],
	techniques: readonly string[],
	recipesByTechnique: ReadonlyMap<string, readonly string[]>,
	now: number
): string[] {
	const due = new Map(repertoire(log, now).map((e) => [e.slug, e.dueAt]));
	const cold: string[] = [];
	for (const t of techniques) {
		const cooked = (recipesByTechnique.get(t) ?? []).filter((slug) => due.has(slug));
		// Never cooked at all is a GAP, not a cold technique. Different answer,
		// different remedy: one needs arranging, the other needs repeating.
		if (!cooked.length) continue;
		if (cooked.every((slug) => (due.get(slug) as number) <= now)) cold.push(t);
	}
	return cold;
}

export function whoCanCover(
	station: StationKey,
	people: ReadonlyArray<{ id: string; name: string; coverage: StationCoverage[] }>
): Array<{ id: string; name: string; touched: number; of: number; met: number; band: Band }> {
	return people
		.map((p) => {
			const c = p.coverage.find((x) => x.key === station);
			return c
				? { id: p.id, name: p.name, touched: c.touched, of: c.of, met: c.met, band: c.band }
				: null;
		})
		.filter((x): x is NonNullable<typeof x> => x !== null)
		.sort((a, b) => b.touched - a.touched || b.met - a.met || a.name.localeCompare(b.name));
}
