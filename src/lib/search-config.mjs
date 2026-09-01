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
	spell(s)
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();

/**
 * The rest of what slugify does before it starts hyphenating, and for the same
 * reasons, applied BEFORE the text is split into terms.
 *
 * It has to run before the split, not after, which is why it cannot live in
 * fold(): MiniSearch tokenizes on punctuation, so by the time processTerm sees
 * a term the apostrophe has already become a word boundary. "Za'atar" was
 * indexed as "za" and "atar", and a cook typing "zaatar" - which is how it is
 * usually written in English - matched neither, so the grid came back empty.
 * That cost eight dishes: Oka i'a, Ta'ameya, Fa'ausi, Ka'ak al-Quds,
 * Man'oushe Za'atar, Labneh bi Zeit wa Za'atar, Fried Shrimp Po'boy and
 * Sfoglia all'Uovo.
 *
 * The ampersand is the same bargain read the other way. "&" is punctuation, so
 * "Beef & Broccoli" indexed "beef" and "broccoli" and nothing between them,
 * while a cook types the word: "Beef and Broccoli" carries a third term that
 * matched nothing, and combineWith AND turned that into no results at all.
 * Five dishes, plus Red Beans & Rice, which returned eighteen cards led by
 * Cuban Black Beans and Rice and never itself.
 *
 * slugify has deleted apostrophes and spelled out "&" since the beginning. All
 * this does is stop the search box from disagreeing with the URL bar.
 *
 * @param {string} s
 */
function spell(s) {
	return transliterate(s)
		.replace(/['’`´]/g, '')
		.replace(/&/g, ' and ');
}

/** @type {import('minisearch').Options} */
export const miniOptions = {
	idField: 'id',
	/*
	 * `technique` joined the surface when the technique pages did: the tags are
	 * what a recipe DOES, so "braise" should reach all 27 braises from the main
	 * search box and not only from /technique.
	 *
	 * `course` joined because the grid has TWO searches and they disagreed. The
	 * substring fallback in filter.ts builds its haystack from name, chapter,
	 * COURSE and flavour, and it is what the grid shows until this index
	 * finishes loading. So a cook typed "Dessert", saw 325 cards, and watched
	 * them drop to 33 with no keystroke, because the index had never been given
	 * the field. Measured across the ten authored courses: Starter 200 then 13,
	 * Main 685 then 63, Breakfast 83 then 17.
	 *
	 * Adding it costs 19 KB (1003 to 1022) and changed the top result for none
	 * of 500 name queries at any boost from 1 to 8. Every course word now
	 * returns every dish of that course, so the swap can only ever widen the
	 * grid, which is the direction it already moved for 609 of 900 real corpus
	 * words: this index searches ingredients and the fallback does not.
	 */
	fields: ['name', 'chapter', 'course', 'ingredients', 'flavor', 'technique'],
	// Nothing stored: the id indexes straight into the recipes array.
	storeFields: [],
	/*
	 * MiniSearch's own default, with spell() run first. The split pattern is
	 * copied from it deliberately rather than imported: loadJS has to be handed
	 * the same tokenizer the index was built with, and a tokenizer that changed
	 * under a minisearch upgrade would corrupt every lookup silently rather
	 * than failing. If that pattern ever drifts, search.test.ts is where it
	 * shows up.
	 */
	tokenize: (/** @type {string} */ text) =>
		spell(text)
			.split(/[\n\r\p{Z}\p{P}]+/u)
			.filter(Boolean),
	processTerm: (/** @type {string} */ term) => {
		const t = fold(term);
		/*
		 * "and" is dropped rather than indexed, even though spell() has just
		 * manufactured it out of every "&". Indexing it would put the term on
		 * 1542 of 1844 documents and then let combineWith AND demand it back:
		 * a cook typing "mac and cheese" would be asking for three terms where
		 * they meant two. Dropped, the query is ["mac","cheese"] and the dish
		 * is found whichever way its name spells the conjunction.
		 *
		 * spell() still has to do the substitution, because filter.ts's
		 * substring haystack is built with fold() and never tokenized, and it
		 * is the path the grid uses until the index finishes loading. Without
		 * it the ampersand dishes come back empty for the first moment and then
		 * populate, which is the flicker this whole change is about.
		 */
		return t.length > 1 && t !== 'and' ? t : null;
	},
	searchOptions: {
		// prefix: "lemongr" already finds lemongrass while you type.
		prefix: true,
		/*
		 * fuzzy 0.2 ≈ one edit per five letters: "brulee" reaches "brûlée", but
		 * "ragu" cannot reach "asparagus", which is the point. The old substring
		 * scan matched anything containing the letters.
		 *
		 * FLOORED AT SIX CHARACTERS, because one edit on a short word is not a
		 * typo, it is a different word. Adding `course` above gave the index ten
		 * very short, very populous terms, and fuzzy handed them to any five
		 * letter query: typing the real dish name "Maine Lobster Roll" flooded
		 * the grid with 693 cards at character five, 677 of them every Main in
		 * the book, because "maine" is one edit from "main". With the floor that
		 * is 11.
		 *
		 * Measured to cost nothing it was doing: all ten courses still return
		 * every dish of that course, and all sixteen dishes the folding rules
		 * exist for (cilbir, brulee, ragu, flaesk, smorrebrod, zaatar, manti,
		 * oka ia and the rest) rank exactly as they did. It also quiets the
		 * short-query noise generally: "tart" 64 to 34, "soup" 224 to 149.
		 *
		 * A term-level function, so it is the QUERY's word length that decides,
		 * not the indexed term's.
		 */
		fuzzy: (/** @type {string} */ term) => (term.length >= 6 ? 0.2 : false),
		combineWith: 'AND',
		/*
		 * course sits with flavour, at the bottom, and that is deliberate rather
		 * than modest. It is the least specific evidence in the index: ten values
		 * across 1844 documents, where a name is nearly unique. It is also a
		 * one-token field, so BM25's length normalisation already scores a course
		 * hit generously without any help from a boost.
		 *
		 * The number changes no result set at all — across 5165 query-and-boost
		 * pairs the returned recipes were identical at 0.5, 1, 2, 3, 4 and 8 —
		 * and only moves ranking, where raising it steadily displaces better
		 * evidence: top-1 flips against the pre-course index climb 16, 18, 19,
		 * 21, 21, 24 as the boost climbs. 1 is the floor of that curve.
		 */
		boost: { name: 8, chapter: 4, technique: 3, ingredients: 2, course: 1, flavor: 1 }
	}
};
