/**
 * Menu economics: the numbers a venue is actually bought for.
 *
 * Fourth time this pattern has appeared, and the starkest. The guide carries a
 * complete restaurant-finance curriculum: 43 entries under "Restaurant Finance
 * & Opening", plus "Menu Economics: Food Cost, Yield & Par" and "Costing Time"
 * under The Professional Kitchen, and FOURTEEN of those 43 link to no recipe
 * at all, because crosslinks.mjs scores a term against dish text and a term
 * like "COGS Control: Inventory, Variance & Theft" has no dish. The least
 * reachable content in the whole guide is the content the paying buyer needs
 * most.
 *
 * So, as with palate.mjs: nothing here is new writing. The targets and the
 * categories are the guide's, lifted into a shape the costing sheet can compute
 * against, and checked against the prose so the two cannot drift.
 *
 * ## Why the numbers are gated rather than typed into a component
 *
 * A food-cost target is a claim about the industry, and it is the claim the
 * whole sheet is scored against. If somebody edits the lexicon entry to say
 * 30–40% and the sheet keeps colouring 28% green, the app is quietly arguing
 * with its own textbook. The build fails instead.
 */

/** Every number below is read out of these. */
export const ANCHORS = {
	menu: 'menu-economics-food-cost-yield-and-par',
	prime: 'prime-cost-the-number-that-runs-the-building',
	cogs: 'cogs-control-inventory-variance-and-theft',
	pricing: 'menu-pricing-and-psychology'
};

/**
 * Bands the sheet scores against.
 *
 * `evidence` is the substring the entry must still contain. Kept as the literal
 * phrase rather than a reconstructed one: an en dash and a hyphen look
 * identical in a diff and would make this gate pass on the wrong text.
 */
export const BANDS = [
	{
		key: 'foodCost',
		label: 'Food cost',
		anchor: 'menu',
		lowPct: 25,
		highPct: 35,
		evidence: 'typically targeted 25–35%',
		note: 'Ingredient cost as a share of menu price.'
	},
	{
		key: 'primeCost',
		label: 'Prime cost',
		anchor: 'prime',
		lowPct: 55,
		highPct: 60,
		evidence: 'target 55–60% of sales for full service',
		note: 'COGS plus total labour: the number operators live by.'
	}
];

/**
 * Menu engineering's four quadrants, popularity against profit.
 *
 * Order is the guide's own, and it is not alphabetical: stars first because
 * that is what the sort is looking for.
 */
export const QUADRANTS = [
	{ key: 'star', label: 'Star', popular: true, profitable: true, advice: 'Protect it. Do not touch the recipe, the price, or its place on the page.' },
	{ key: 'plowhorse', label: 'Plowhorse', popular: true, profitable: false, advice: 'Sells well and earns little. Cut cost or nudge price: never both at once.' },
	{ key: 'puzzle', label: 'Puzzle', popular: false, profitable: true, advice: 'Earns well and nobody orders it. Rename, redescribe, or move it up the page.' },
	{ key: 'dog', label: 'Dog', popular: false, profitable: false, advice: 'Neither sells nor earns. Cut it, unless it is there for a reason you can name.' }
];

/** The evidence for the quadrant names, in the same entry as the food-cost band. */
export const QUADRANT_EVIDENCE = '(stars, plowhorses, puzzles, dogs)';

/**
 * The lesson this whole sheet exists to prevent, quoted because the guide says
 * it better than a tooltip would.
 */
export const YIELD_EVIDENCE = 'costing raw invoice prices is the classic rookie bankruptcy';

/**
 * Check the structure against the prose and emit what the app ships.
 *
 * @param {Array<{ slug: string, term: string, definition: string }>} lexicon
 */
export function buildEconomics(lexicon) {
	/** @type {string[]} */
	const problems = [];
	const bySlug = new Map(lexicon.map((e) => [e.slug, e]));

	/** @type {Record<string, { slug: string, term: string, definition: string }>} */
	const entries = {};
	for (const [key, slug] of Object.entries(ANCHORS)) {
		const entry = bySlug.get(slug);
		if (!entry) {
			problems.push(`economics: no lexicon entry "${slug}" (${key})`);
			continue;
		}
		entries[key] = { slug: entry.slug, term: entry.term, definition: entry.definition };
	}
	if (problems.length) return { economics: null, problems };

	for (const b of BANDS) {
		const text = entries[b.anchor].definition;
		if (!text.includes(b.evidence)) {
			problems.push(
				`economics: "${entries[b.anchor].term}" no longer states ${JSON.stringify(b.evidence)}; ` +
					`the ${b.label} band of ${b.lowPct}–${b.highPct}% is now unsupported`
			);
			continue;
		}
		if (b.lowPct >= b.highPct) problems.push(`economics: ${b.key} band is inverted`);

		// Read the numbers back OUT of the evidence and compare.
		//
		// Checking only that the phrase is present was not enough, and the hole
		// was live: lowPct could be edited from 25 to 30 while the entry still
		// said "25–35%", and the build passed. The sheet would then have scored
		// every dish against a band the guide does not state, which is the exact
		// failure this module exists to prevent.
		// Split on runs of non-digits: no escape sequences to get wrong, which
		// the first version of this line did get wrong.
		const ints = b.evidence.split(/[^0-9]+/).filter(Boolean).map(Number);
		if (ints.length < 2) {
			problems.push(`economics: ${b.key} evidence states no percentage range to check against`);
			continue;
		}
		const [low, high] = ints;
		if (low !== b.lowPct || high !== b.highPct) {
			problems.push(
				`economics: ${b.key} is set to ${b.lowPct}–${b.highPct}% but the guide says ${low}–${high}%`
			);
		}
	}

	if (!entries.menu.definition.includes(QUADRANT_EVIDENCE)) {
		problems.push(`economics: the menu-engineering quadrants are no longer named in the guide`);
	}
	for (const q of QUADRANTS) {
		// The guide writes them plural and lowercase inside the parenthetical.
		if (!QUADRANT_EVIDENCE.includes(q.key)) {
			problems.push(`economics: quadrant "${q.key}" is not one the guide names`);
		}
	}

	if (!entries.menu.definition.includes(YIELD_EVIDENCE)) {
		problems.push('economics: the yield warning has gone from the guide');
	}

	return {
		economics: {
			entries,
			bands: BANDS.map(({ key, label, lowPct, highPct, note }) => ({
				key,
				label,
				lowPct,
				highPct,
				note
			})),
			quadrants: QUADRANTS,
			yieldWarning: YIELD_EVIDENCE
		},
		problems
	};
}
