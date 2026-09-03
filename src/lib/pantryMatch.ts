/**
 * Pantry Match's scoring and its zero state, pulled out of the route so both
 * can be tested and so the empty state can name its actual culprit.
 *
 * ## The count
 *
 * The sealed original kept the ranked list and the true total as two
 * variables (`top = scored.slice(0, 60)`, `panResCt.textContent =
 * scored.length`) and printed the second one. The port collapsed them into
 * one `results` array, so the counter silently inherited the render cap: with
 * one staple ticked, the page reads "60 dishes" for a match that is really in
 * the hundreds. `matchPantry` returns both `matched` (the true count) and
 * `shown` (the capped list to render), so the route can print "60 of 738".
 *
 * ## The zero state
 *
 * `need = Math.min(minMatches, selected.size)` means the empty case is not an
 * edge case - at the default "3+ matches", three ticks with no course or
 * Vegetarian filter empty the list 91.8% of the time. A single fixed sentence
 * ("Select a few ingredients...") is correct for a cook who has ticked
 * nothing and wrong for one who has ticked several and hit a wall; it never
 * names which control emptied the list. `pantryCulprit` re-runs the match
 * with each active control relaxed in turn - the same shape as
 * src/lib/emptyState.ts uses for the recipe grid - and reports whichever
 * relaxation restores the most matches, so the route can say "Try 'Any
 * match'" or "Drop Vegetarian only" instead of guessing.
 */

export interface PantryPoolItem {
	course: string;
	diet: { vegetarian: boolean };
	minutes: number;
}

export interface PantryMatchOptions {
	selected: Set<string>;
	minMatches: number;
	course: string | null;
	vegOnly: boolean;
}

export interface PantryHit<T> {
	r: T;
	hits: string[];
	missing: string[];
}

export const PANTRY_SHOWN_CAP = 60;

/**
 * @param pool the candidate recipes
 * @param itemsOf a recipe's pantry-matchable ingredient lines
 */
export function matchPantry<T extends PantryPoolItem>(
	pool: T[],
	itemsOf: (r: T) => string[],
	opts: PantryMatchOptions
): { matched: PantryHit<T>[]; shown: PantryHit<T>[] } {
	if (!opts.selected.size) return { matched: [], shown: [] };
	const need = Math.min(opts.minMatches, opts.selected.size);
	const matched: PantryHit<T>[] = [];
	for (const r of pool) {
		if (opts.course && r.course !== opts.course) continue;
		if (opts.vegOnly && !r.diet.vegetarian) continue;
		const items = itemsOf(r);
		const hits = items.filter((l) => opts.selected.has(l));
		if (!hits.length || hits.length < need) continue;
		const missing = items.filter((l) => !opts.selected.has(l)).slice(0, 4);
		matched.push({ r, hits, missing });
	}
	matched.sort(
		(a, b) =>
			b.hits.length - a.hits.length || a.missing.length - b.missing.length || a.r.minutes - b.r.minutes
	);
	return { matched, shown: matched.slice(0, PANTRY_SHOWN_CAP) };
}

export type PantryDroppable = 'minMatches' | 'course' | 'vegOnly';

export interface PantryCulprit {
	key: PantryDroppable;
	restored: number;
}

/**
 * Which single relaxation restores the most matches, or null when nothing
 * ticked or filtered would help - only asked when `matched` is already zero.
 */
export function pantryCulprit<T extends PantryPoolItem>(
	pool: T[],
	itemsOf: (r: T) => string[],
	opts: PantryMatchOptions
): PantryCulprit | null {
	const tries: Array<{ key: PantryDroppable; opts: PantryMatchOptions }> = [];
	if (opts.minMatches > 1) tries.push({ key: 'minMatches', opts: { ...opts, minMatches: 1 } });
	if (opts.course) tries.push({ key: 'course', opts: { ...opts, course: null } });
	if (opts.vegOnly) tries.push({ key: 'vegOnly', opts: { ...opts, vegOnly: false } });

	let best: PantryCulprit | null = null;
	for (const t of tries) {
		const n = matchPantry(pool, itemsOf, t.opts).matched.length;
		if (n <= 0) continue;
		if (!best || n > best.restored) best = { key: t.key, restored: n };
	}
	return best;
}
