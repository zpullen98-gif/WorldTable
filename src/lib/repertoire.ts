/**
 * The Repertoire — what you can actually cook, and what has gone cold.
 *
 * The guide could always tell you how to make a dish. Since the standards
 * landed it can tell you whether the plate was right. What it could not do is
 * the third thing, the one that separates a cook from someone who has read a
 * lot: come back to a dish before it slips.
 *
 * `cookedLog` has stored a timestamp on every cook since the first build and
 * NOTHING has ever read it. `hasCooked()` collapses the whole history to a
 * boolean, the study page renders a tick, and the home band counts entries.
 * A dish cooked once eight months ago and a dish cooked four times this month
 * are the same dish to every reader in the app. That is an attendance sheet.
 *
 * This module is the schedule. It is pure, and it lives outside the store for
 * the same reason mergeSessions() does: a runes module is unreachable from a
 * unit test, and scheduling is exactly the code that must be tested rather
 * than eyeballed.
 *
 * ## Why the interval responds to the grade
 *
 * A queue that only counts days is still outcome-detached — it would nag you
 * about a dish you nailed and let one you ruined sit for months. The ladder
 * therefore moves on evidence: a plate that met its standard earns a longer
 * interval, one that missed drops back down. That is Leitner, in a kitchen's
 * units. The unit of practice here is a service or a weekend, not a
 * flashcard's ninety seconds, so the rungs are weeks and months.
 */

/** What the plate was, measured against the dish's standard. */
export type Grade = 'met' | 'close' | 'missed';

/**
 * One cook. The shape `cookedLog` has always had, plus an optional grade.
 *
 * Optional deliberately: every entry written before this feature has no grade,
 * and a session that predates it must keep working untouched. An ungraded cook
 * ADVANCES the ladder (see `rungFor`) — the absence of a standard to check
 * against is the guide's gap, not the cook's failure.
 */
export interface CookEntry {
	slug: string;
	at: number;
	grade?: Grade;
	/**
	 * Which marks were off, as frozen mark ids — never indices, never the text.
	 * See StandardMark in types.ts for why, and mark-ids.ledger.json for the
	 * gate that keeps the promise.
	 *
	 * Optional, so every entry written before this existed stays valid: a cook
	 * who graded a plate `close` in January simply has no annotation, which is
	 * true, rather than an empty one, which would read as "nothing was off".
	 */
	off?: string[];
	/** The palate lever the cook reached for — a slug into palate.json. */
	fault?: string;
}

/**
 * Which marks keep going wrong on one dish.
 *
 * Three words of grade told a cook their plate was off and nothing about WHAT,
 * so a commis could pull the sear early for four months with every plate
 * faithfully recorded and no way for anyone — including him — to name the
 * drift. This is the read side of that.
 *
 * Counts entries, not sessions: a mark missed twice in one week and twice in
 * March are the same evidence of a habit. Graded entries with no annotation are
 * counted in the denominator and contribute nothing to the numerator, which is
 * the honest treatment: they are cooks that happened, not marks that were met.
 */
export function markDrift(
	log: CookEntry[],
	slug: string
): { graded: number; annotated: number; worst: Array<{ id: string; count: number }> } {
	const mine = log.filter((e) => e.slug === slug && e.grade);
	const counts = new Map<string, number>();
	let annotated = 0;
	for (const e of mine) {
		if (!e.off?.length) continue;
		annotated++;
		for (const id of e.off) counts.set(id, (counts.get(id) ?? 0) + 1);
	}
	const worst = [...counts.entries()]
		.map(([id, count]) => ({ id, count }))
		.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
	return { graded: mine.length, annotated, worst };
}

/**
 * Which palate levers a cook reaches for, across everything they have cooked.
 *
 * "You have reached for acid six times this month and salt never" is a sentence
 * about a palate, not a dish, so this deliberately ignores slug.
 */
export function faultHistogram(log: CookEntry[]): Array<{ fault: string; count: number }> {
	const counts = new Map<string, number>();
	for (const e of log) if (e.fault) counts.set(e.fault, (counts.get(e.fault) ?? 0) + 1);
	return [...counts.entries()]
		.map(([fault, count]) => ({ fault, count }))
		.sort((a, b) => b.count - a.count || a.fault.localeCompare(b.fault));
}

/**
 * How long a dish holds, by rung. Five rungs, roughly doubling.
 *
 * These are kitchen intervals, not flashcard ones. Two weeks is about how long
 * a dish you have made exactly once survives without a second pass; a year is
 * the honest refresh rate for something you have cooked five times and can do
 * from memory. Nothing here is tuned to a forgetting curve measured on word
 * pairs, because a braise is not a word pair.
 */
export const LADDER_DAYS = [14, 35, 90, 180, 365] as const;

/**
 * The ladder for a TERM rather than a dish.
 *
 * Tighter at the bottom and the same shape at the top. You can re-answer a
 * question about Comté tomorrow; you cannot re-cook a coq au vin tomorrow, and
 * the 14-day first rung exists because of that. Two days, then six, gets a
 * server through a module in a working week.
 */
export const TERM_LADDER_DAYS = [2, 6, 14, 35, 90] as const;

export const DAY_MS = 86_400_000;

export type RepertoireState = 'fresh' | 'holding' | 'due' | 'cold';

export interface RepertoireEntry {
	slug: string;
	/** How many times this dish has been cooked. */
	times: number;
	/** First and most recent cook, ms epoch. */
	first: number;
	last: number;
	/** The grade on the most recent cook, when it carried one. */
	lastGrade?: Grade;
	/** 1-based position on LADDER_DAYS, earned by the grade history. */
	rung: number;
	intervalDays: number;
	/** last + interval. Past this, the dish is due. */
	dueAt: number;
	daysSince: number;
	state: RepertoireState;
}

/**
 * Walk one dish's cooks in order and settle where it sits on the ladder.
 *
 * Chronological, not "count the entries": the order is the whole point. Three
 * clean plates then a ruined one leaves you lower than three clean plates, and
 * the schedule has to say so.
 */
function rungFor(entries: CookEntry[], ladder: readonly number[]): number {
	let rung = 0;
	for (const e of entries) {
		if (e.grade === 'missed') rung = Math.max(1, rung - 1);
		else if (e.grade === 'close') rung = Math.max(1, rung);
		else rung += 1;
		rung = Math.min(rung, ladder.length);
	}
	return Math.max(1, rung);
}

function stateFor(elapsedMs: number, intervalMs: number): RepertoireState {
	const ratio = elapsedMs / intervalMs;
	if (ratio < 0.6) return 'fresh';
	if (ratio < 1) return 'holding';
	if (ratio < 2) return 'due';
	return 'cold';
}

/**
 * Fold the cooked log into one record per dish.
 *
 * Sorted by slug so the output is stable: a Map iterated in insertion order
 * would reorder the whole repertoire whenever a cook happened, which makes
 * both the UI and the tests jump around for no reason.
 */
export function repertoire(
	log: CookEntry[],
	now: number,
	/**
	 * Optional so the three existing call sites are untouched. A drill over
	 * lexicon terms passes TERM_LADDER_DAYS; everything about the walk — missed
	 * drops, close holds, ungraded climbs, floor 1, cap at ladder length — is
	 * identical, which is the whole reason the scheduler is shared rather than
	 * copied.
	 */
	ladder: readonly number[] = LADDER_DAYS
): RepertoireEntry[] {
	const bySlug = new Map<string, CookEntry[]>();
	for (const e of log) {
		if (!e || typeof e.slug !== 'string' || typeof e.at !== 'number') continue;
		const list = bySlug.get(e.slug);
		if (list) list.push(e);
		else bySlug.set(e.slug, [e]);
	}

	const out: RepertoireEntry[] = [];
	for (const [slug, entries] of bySlug) {
		entries.sort((a, b) => a.at - b.at);
		const first = entries[0].at;
		const last = entries[entries.length - 1].at;
		const rung = rungFor(entries, ladder);
		const intervalDays = ladder[rung - 1];
		const elapsed = Math.max(0, now - last);
		out.push({
			slug,
			times: entries.length,
			first,
			last,
			lastGrade: entries[entries.length - 1].grade,
			rung,
			intervalDays,
			dueAt: last + intervalDays * DAY_MS,
			daysSince: Math.floor(elapsed / DAY_MS),
			state: stateFor(elapsed, intervalDays * DAY_MS)
		});
	}
	out.sort((a, b) => a.slug.localeCompare(b.slug));
	return out;
}

/**
 * The dishes wanting a re-cook, most decayed first.
 *
 * Ordered by how far past due they are as a PROPORTION of their own interval,
 * not by raw days. A fortnightly dish three weeks late is more urgent than an
 * annual one three weeks late, and sorting on `dueAt` alone would say the
 * opposite every time.
 */
export function dueList(entries: RepertoireEntry[], now: number): RepertoireEntry[] {
	return entries
		.filter((e) => e.state === 'due' || e.state === 'cold')
		.sort((a, b) => {
			const overdue = (e: RepertoireEntry) => (now - e.last) / (e.intervalDays * DAY_MS);
			return overdue(b) - overdue(a);
		});
}

/**
 * Unique dishes cooked, the count every reader in the app actually wanted.
 *
 * `cookedLog.length` counts COOKS, and markCooked appends on every finish, so
 * the home band read "3 of 45 dishes cooked" after one dish was cooked three
 * times. Progress is a set, never a log length.
 */
export function cookedSlugs(log: CookEntry[]): Set<string> {
	return new Set(log.map((e) => e.slug));
}

/** Human phrasing for how long it has been, used in three places. */
export function sinceLabel(days: number): string {
	if (days <= 0) return 'today';
	if (days === 1) return 'yesterday';
	if (days < 21) return `${days} days ago`;
	if (days < 60) return `${Math.round(days / 7)} weeks ago`;
	if (days < 365) return `${Math.round(days / 30)} months ago`;
	const years = days / 365;
	return years < 1.5 ? 'a year ago' : `${Math.round(years)} years ago`;
}
