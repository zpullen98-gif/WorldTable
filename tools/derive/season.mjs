/**
 * Peak months for a recipe, northern-hemisphere canonical.
 *
 * The original computed this lazily at runtime by scanning all 970 recipe texts
 * for every seasonal produce name the moment you ticked "Peak this month"
 * (`computeSeasonIdx`, L3304), and never invalidated the cache when a family
 * recipe was added (L3469), so new dishes could never appear under the filter.
 * Storing the months per recipe makes the filter an array intersection and the
 * staleness bug structurally impossible.
 *
 * A recipe's season is the union of the peak months of the seasonal produce it
 * names. A dish naming no seasonal produce returns [] and is treated as
 * always-available rather than never-available.
 *
 * ## Matching the shelf, not the label
 *
 * The port matched the SEASON key as a literal string. That works for "Asparagus"
 * and fails for every label that is a CATEGORY rather than a word a recipe would
 * ever use: "Stone fruit" appears in no recipe on earth, so 31 dishes naming
 * peaches, apricots, plums and cherries had no season at all: a peach cobbler
 * read as available in December.
 *
 * The original matched against the pantry shelf's keyword lists (PAN_INDEX,
 * reference:3303), which is where "peach/apricot/plum/nectarine/cherr" lives.
 * So: use the shelf's keywords where the label is a shelf item, and fall back to
 * the label text where it is not.
 *
 * @param {string} blob
 * @param {Record<string, number[]>} SEASON
 * @param {Array<{items: Array<{l: string, k: string[]}>}>} [PANTRY]
 */
export function deriveSeason(blob, SEASON, PANTRY) {
	const months = new Set();

	for (const [produce, peak] of Object.entries(SEASON)) {
		if (matchesProduce(blob, produce, PANTRY)) {
			for (const m of peak) months.add(m);
		}
	}
	return [...months].sort((a, b) => a - b);
}

/**
 * Built once per build, not once per recipe: 970 x 45 lookups otherwise.
 * @type {Map<string, string[]> | null}
 */
let shelfIndex = null;
/**
 * @param {string} produce
 * @param {Array<{items: Array<{l: string, k: string[]}>}>} [PANTRY]
 */
function shelfKeywords(produce, PANTRY) {
	if (!PANTRY) return null;
	if (!shelfIndex) {
		shelfIndex = new Map();
		for (const g of PANTRY) {
			for (const it of g.items) shelfIndex.set(it.l.toLowerCase(), it.k);
		}
	}
	return shelfIndex.get(produce.toLowerCase()) ?? null;
}

/**
 * @param {string} blob
 * @param {string} produce
 * @param {Array<{items: Array<{l: string, k: string[]}>}>} [PANTRY]
 */
function matchesProduce(blob, produce, PANTRY) {
	const keywords = shelfKeywords(produce, PANTRY);
	if (keywords?.length) return keywords.some((k) => hasWord(blob, k.toLowerCase()));

	// Not on the shelf: compound keys like "Squash/Pumpkin" match on either half.
	return produce
		.split('/')
		.map((s) => s.trim().toLowerCase())
		.some((n) => hasWord(blob, n));
}

/**
 * Words a keyword must NOT be allowed to claim, because they are a different
 * ingredient rather than an inflection of the same one.
 *
 * The left-boundary rule below is deliberate and stays: the shelf is written as
 * stems, so "cherr" catches cherry and cherries and "anchov" catches anchovy
 * and anchovies. Adding a right boundary was measured and removes 1125 pantry
 * claims, most of them plurals the stems exist to catch. This table is the
 * narrow alternative: name the collisions instead of changing the rule.
 *
 * Measured over the corpus, worst first. The two that mattered most:
 *
 *   'mince' claimed "minced garlic", 181 times, so Ground meat was asserted by
 *   201 recipes of which about 85 have no meat in them at all. Tick mince,
 *   onion and garlic, the most ordinary thing a cook ticks, and the top results
 *   were Farofa de Dende, Pebre Chileno and Shiro Wat, each announcing "Using
 *   Ground meat", while the actual mince dishes were pushed below them. The
 *   real thing is still caught: 'minced beef' and 'minced pork' are their own
 *   keywords on the same item.
 *
 *   'corn' claimed cornstarch, cornflour, cornmeal and Cornish, so 156 corn
 *   free dishes reported "Using Corn", printed as literal text under a Butter
 *   Chicken. Masa still counts as corn, which is how the arepas, tamales and
 *   tortillas keep the tag they should have.
 *
 * The same helper drives the seasonal "peak this month" line, so every entry
 * here fixes both surfaces at once.
 */
/** @type {Record<string, string[]>} */
const NOT_THIS_WORD = {
	mince: ['minced'],
	butter: ['buttermilk', 'buttercream', 'butternut', 'butterhead', 'butterfly'],
	corn: ['cornstarch', 'cornflour', 'cornmeal', 'cornbread', 'cornflake', 'cornichon',
		'cornish', 'corned', 'corn syrup'],
	masa: ['masala'],
	tamari: ['tamarind'],
	bread: ['breadcrumb', 'breadfruit'],
	ancho: ['anchovy', 'anchovies', 'anchoa'],
	lemon: ['lemongrass'],
	'rice ': ['rice flour', 'rice vinegar', 'rice noodle', 'rice vermicelli', 'rice paper',
		'rice wine'],
	'cream ': ['cream cheese'],
	grape: ['grapeseed'],
	grapes: ['grapeseed'],
	bun: ['bunch'],
	egg: ['eggplant'],
	raisin: ['raising'],
	cod: ['coddle', 'coddie']
};

/**
 * Left-boundary match: the keyword must start a word, but need not finish one.
 *
 * The shelf is full of deliberate stems: "cherr" is written to catch cherry and
 * cherries, so a right boundary would break it. A LEFT boundary is what stops
 * "sage" matching "sausage" and "corn" matching "peppercorns".
 *
 * What it cannot stop on its own is a keyword that PREFIXES a different
 * ingredient, which is what NOT_THIS_WORD above is for.
 *
 * @param {string} text
 * @param {string} keyword
 */
export function hasWord(text, keyword) {
	const banned = NOT_THIS_WORD[keyword];
	let from = 0;
	for (;;) {
		const at = text.indexOf(keyword, from);
		if (at === -1) return false;
		const before = at === 0 ? '' : text[at - 1];
		if (!/[a-z0-9]/i.test(before)) {
			if (!banned?.some((/** @type {string} */ w) => text.startsWith(w, at))) return true;
		}
		from = at + 1;
	}
}
