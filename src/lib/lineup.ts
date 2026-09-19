/**
 * The Lineup's tally: what a ROOM missed, and nobody's name.
 *
 * Lineup is the Floor Deck's pre-shift mode. One term fills a screen, the staff
 * answer aloud, and whoever is running the lineup taps right or wrong. That is
 * evidence about the room and about nobody in it, so it is written HERE, to a
 * venue-level log on the house record, and never to the drill log of whichever
 * profile happens to be holding the tablet: scheduling one server's cards off
 * what six people shouted would be false for all seven.
 *
 * An entry is deliberately the shape of a drill-log entry, so the same picker
 * that builds a person's sitting (floor-deck.ts pickSession) builds a lineup
 * from this log with no adapter: the room's misses first, then what the room
 * is due, then what it has never been asked. There is no person field, and no
 * way to add one without changing this type, which is the point: a per-person
 * lineup record is a league table, and this product refuses to be able to
 * produce one for the same reason the waste log carries no name.
 *
 * It travels in the house export, because that export is the venue's only
 * backup. The 86 board stays local because it is tonight's state; this is
 * history.
 */

export interface LineupEntry {
	/** A Floor Deck card id. */
	slug: string;
	/** ms epoch. */
	at: number;
	grade: 'met' | 'missed';
}

/**
 * A pre-shift lineup asks five to twelve terms, so two thousand entries is the
 * better part of a year of daily lineups, and everything the picker reads (the
 * ladder, what is owed) is decided by a card's recent history anyway.
 */
export const LINEUP_CAP = 2000;

const key = (e: LineupEntry) => `${e.slug}|${e.at}`;

const valid = (e: unknown): e is LineupEntry =>
	Boolean(e) &&
	typeof (e as LineupEntry).slug === 'string' &&
	typeof (e as LineupEntry).at === 'number' &&
	((e as LineupEntry).grade === 'met' || (e as LineupEntry).grade === 'missed');

/** Whatever was on disk, as a clean log. Malformed rows are dropped, never minted. */
export function normaliseLineup(raw: unknown): LineupEntry[] {
	return Array.isArray(raw) ? raw.filter(valid).map((e) => ({ slug: e.slug, at: e.at, grade: e.grade })) : [];
}

/**
 * Two tablets' tallies, as one.
 *
 * A UNION on `slug|at`, never a sum and never keyed on the slug alone: an
 * import that kept one entry per card would erase the history the ladder is
 * walked from, and one that counted would double a tally every time a file
 * went round two tablets. Idempotent: merging a file twice changes nothing.
 *
 * The cap is applied AFTER the union and by a total order (newest first, then
 * slug), so which entries survive does not depend on which side was "mine":
 * the rule items.ts follows for price history.
 */
export function mergeLineup(mine: unknown, theirs: unknown): LineupEntry[] {
	const all = new Map<string, LineupEntry>();
	for (const e of [...normaliseLineup(mine), ...normaliseLineup(theirs)]) {
		if (!all.has(key(e))) all.set(key(e), e);
	}
	return [...all.values()]
		.sort((a, b) => b.at - a.at || a.slug.localeCompare(b.slug))
		.slice(0, LINEUP_CAP)
		.sort((a, b) => a.at - b.at || a.slug.localeCompare(b.slug));
}

/** Add one answer. Returns a new array; the store owns the write. */
export function addLineup(log: readonly LineupEntry[], entry: LineupEntry): LineupEntry[] {
	return mergeLineup(log, [entry]);
}

/** Take back exactly one answer: "Undo last" on the lineup screen. */
export function removeLineup(log: readonly LineupEntry[], slug: string, at: number): LineupEntry[] {
	return log.filter((e) => !(e.slug === slug && e.at === at));
}
