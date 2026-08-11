/**
 * Search configuration, shared verbatim between the build-time indexer
 * (tools/build-data.mjs) and the runtime loader (src/lib/search.ts).
 *
 * It lives in one file because MiniSearch.loadJS requires the EXACT options the
 * index was serialized with — a drifted processTerm silently corrupts every
 * lookup rather than erroring. Plain .mjs so Node can import it directly
 * without a TS loader.
 */

/** NFD-fold: strip combining marks so "ragu" matches "Ragù". Same folding as
 *  the slug generator and the filter fallback — one rule everywhere.
 *  @param {string} s */
export const fold = (s) =>
	s
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
	// Nothing stored — the id indexes straight into the recipes array.
	storeFields: [],
	processTerm: (/** @type {string} */ term) => {
		const t = fold(term);
		return t.length > 1 ? t : null;
	},
	searchOptions: {
		// prefix: "lemongr" already finds lemongrass while you type.
		prefix: true,
		// fuzzy 0.2 ≈ one edit per five letters: "brulee" reaches "brûlée",
		// but "ragu" cannot reach "asparagus" — which is the point. The old
		// substring scan matched anything containing the letters.
		fuzzy: 0.2,
		combineWith: 'AND',
		boost: { name: 8, chapter: 4, technique: 3, ingredients: 2, flavor: 1 }
	}
};
