/**
 * Search configuration, shared verbatim between the build-time indexer
 * (tools/build-data.mjs) and the runtime loader (src/lib/search.ts).
 *
 * It lives in one file because MiniSearch.loadJS requires the EXACT options the
 * index was serialized with: a drifted processTerm silently corrupts every
 * lookup rather than erroring. Plain .mjs so Node can import it directly
 * without a TS loader.
 */

import { transliterate } from '../../tools/slugify.mjs';

/**
 * Fold a term to what a plain keyboard can type: substitute the letters NFD
 * cannot take apart, then strip the combining marks it can.
 *
 * The second pass alone is what "ragu" matches "Ragù" needs, and for a long
 * time it was all this did. It is not enough. NFD leaves ı, æ, ø, ł and their
 * relatives standing, so the index held "cılbır" and "flæsk" and a cook typing
 * "Cilbir" or "Flaesk" got an EMPTY GRID: two dotless i's is a distance of two,
 * the fuzzy budget is round(0.2 × 6) = 1, and combineWith AND means one term
 * that finds no match empties the whole result. Seven dishes could not be found
 * by their own names typed the only way most keyboards can type them:
 * İmam Bayıldı, Kıymalı Pide, Çılbır, Fıstıklı Baklava, Kayseri Mantısı,
 * Stegt Flæsk med Persillesovs and Flæskesteg med Sprød Svær.
 *
 * Smørrebrød survived only by being long: ten characters buys a budget of two,
 * which is exactly what its two ø's cost. That was luck, not a rule.
 *
 * Both passes now, from the same table the slug generator uses. Typing the
 * accented form still works, because it folds to the same string.
 *
 * CHANGING THIS INVALIDATES search-index.json. MiniSearch.loadJS must be given
 * the exact options the index was serialized with, so `npm run build:data` has
 * to run after any edit here or every lookup silently corrupts.
 *
 * @param {string} s
 */
export const fold = (s) =>
	transliterate(s)
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();

/** @type {import('minisearch').Options} */
export const miniOptions = {
	idField: 'id',
	// `technique` joined the surface when the technique pages did: the tags are
	// what a recipe DOES, so "braise" should reach all 27 braises from the main
	// search box and not only from /technique.
	fields: ['name', 'chapter', 'ingredients', 'flavor', 'technique'],
	// Nothing stored: the id indexes straight into the recipes array.
	storeFields: [],
	processTerm: (/** @type {string} */ term) => {
		const t = fold(term);
		return t.length > 1 ? t : null;
	},
	searchOptions: {
		// prefix: "lemongr" already finds lemongrass while you type.
		prefix: true,
		// fuzzy 0.2 ≈ one edit per five letters: "brulee" reaches "brûlée",
		// but "ragu" cannot reach "asparagus", which is the point. The old
		// substring scan matched anything containing the letters.
		fuzzy: 0.2,
		combineWith: 'AND',
		boost: { name: 8, chapter: 4, technique: 3, ingredients: 2, flavor: 1 }
	}
};
