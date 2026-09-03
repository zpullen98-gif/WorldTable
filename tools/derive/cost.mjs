/**
 * Cost tier 1-4, ported from `costFor` (L3320), minus the `R.indexOf(r)` scan.
 *
 * ## The keywords need a leading word boundary
 *
 * Every pattern here was a bare substring, and the corpus is full of longer
 * words that contain them. Measured against all 1,844: 22 recipes were priced
 * by a collision, and several sat in the TOP tier, the one meant for lobster
 * and caviar and truffle.
 *
 *   uni    in sulguni     adjaruli khachapuri, tier 4 for a Georgian cheese
 *   uni    in meunière    sole meunière, tier 4 for a word in its own name
 *   cream  in screaming   "screaming fat", "screaming-hot steel", "a
 *                         screaming grill pan" - three dishes priced up
 *                         because the pan was hot
 *   veal   in reveal      "slice to reveal the stained-glass cross-section"
 *   duck   in geoduck     which is a clam
 *   lamb   in flambé      bananas Foster, priced as though it held lamb
 *
 * LEADING boundary only, and that is the whole point. The naive fix is `\b` at
 * both ends, and it is net-harmful here for exactly the reason it is in the
 * technique tagger: `crabs`, `prawns` and `scallops` are how a recipe actually
 * writes them, and anchoring the end would take scallop from 2 hits to 0.
 * `\bcream` still finds `creamy`; `\bbutter` still finds `buttermilk`. Nothing
 * legitimate is lost, because a leading boundary can only refuse a match that
 * had letters in front of it, and none of these is ever written with a prefix.
 *
 * (`uni\b` keeps the trailing boundary it always had, making the pair
 * `\buni\b`. That trailing boundary is also why "meunière" slipped through:
 * `è` is not a word character, so `uni\b` was satisfied by it.)
 *
 * ## The blob is the recipe, not the writing about it
 *
 * This was scored over name + chapter + ingredients + method + NOTE, and the
 * note is editorial prose about the dish, not a statement of what goes into it.
 * 35 recipes were priced by their own commentary: pizza margherita and
 * ratatouille to tier 2 because a note says "cream", fattoush and chicken
 * piccata because one says "wine".
 *
 * The method stays in, deliberately. "Deglaze with the wine" is a real
 * ingredient in a real instruction, and dropping the method would cost boeuf
 * bourguignon a tier it has earned. The line is between what the recipe ASKS
 * FOR and what the guide SAYS ABOUT it.
 *
 * Both changes together move 53 of 1,844 tiers, every one downward: 28 from
 * 2 to 1, 17 from 3 to 2, 5 from 4 to 2, 2 from 3 to 1 and one from 4 to 3.
 *
 * (Count these over the BUILT corpus, not over raw/R.json. R.json is the
 * archive's own ~970; recipes-supplement.mjs carries the rest to 1,844, and a
 * probe that reads only the raw file undercounts by a third. That is how the
 * first pass at this reported 39.)
 *
 * The survey estimated 94 from a name-plus-ingredients read. That cut also
 * drops the METHOD, which is why its number is larger and why it is the wrong
 * cut: boeuf bourguignon's wine is stated in an instruction, not an
 * ingredient line, and it is a real cost.
 */

/**
 * What a tier is priced from: the recipe, without the writing about it.
 *
 * Exported so the family shelf prices an author's own dish by the same rule the
 * corpus is priced by, rather than being stamped with a number.
 */
/** @param {{ n: string, c: string, i: string[], m: string[] }} r */
export function costBlob(r) {
	return `${r.n} ${r.c} ${r.i.join(' ')} ${r.m.join(' ')}`.toLowerCase();
}

/**
 * @param {{ i: string[] }} r
 * @param {string} blob
 * @returns {1 | 2 | 3 | 4}
 */
export function deriveCost(r, blob) {
	let s = 1;
	if (/\b(lobster|caviar|truffle|foie|wagyu|ibérico|saffron|uni\b|crab|jamón)/.test(blob)) s += 2;
	if (
		/\b(beef|lamb|duck|veal|shrimp|prawn|salmon|tuna|scallop|brisket|short rib|oxtail|prosciutto|pork belly)/.test(
			blob
		)
	)
		s += 1;
	if (/\b(cream|butter|parmigiano|gruyère|mascarpone|wine|brandy|cognac|sherry)/.test(blob))
		s += 0.5;
	if (r.i.length >= 9) s += 0.5;
	return /** @type {1 | 2 | 3 | 4} */ (Math.max(1, Math.min(4, Math.round(s))));
}
