/**
 * The Service Track: the front of house, given an order.
 *
 * The largest measured gap in the guide. 176 terms across five atlases (Cheese
 * 46, Charcuterie 41, Cocktail & Bar 38, Wine & Beverage 34, The Grape Atlas 17
 * , and a server has no route through any of them. Fifty-six of those 176 reach
 * ZERO recipes (Cheese 22, Charcuterie 14, Grape 13, Wine 5, Cocktail 2), so
 * crosslinks cannot surface them either. The Path of Study reads 39 lexicon
 * terms and NONE is front-of-house; the technique table anchors 47 and NONE is
 * front-of-house. Today the only way to this material is scrolling a flat
 * 479-term list.
 *
 * So: 27 modules in a stated teaching order, referencing terms BY SLUG. No
 * definition is copied here. Inlining the 176 definitions costs 159,861 bytes
 * raw / 64,982 gzipped and duplicates lexicon.json, which is already a lazy
 * chunk; slug-and-category references cost 2,460 gzipped. The precache budget
 * has 0.68 MB of headroom against a 2.00 MB cap, and this is not where to spend
 * it.
 *
 * ## What is authored and what is checked
 *
 * The ORDER is authored: it is the whole contribution, and it is a claim about
 * teaching, not about data. Everything else is gated:
 *
 *   - every term slug must resolve, and none may appear twice
 *   - the five atlases must still exist and still hold exactly 176 terms
 *   - the track must still cover all 176; a term added to an atlas and not
 *     placed in a module fails the build, which is the check that keeps this
 *     from rotting the way the crosslink caps did
 *   - CELLAR_ANCHOR is hand-authored and gated on both sides, never
 *     string-matched: 'chianti' substring-matches `t-bone-and-porterhouse` and
 *     `ti-allowance-and-lease-negotiation`, and 'barbera' matches a Nebbiolo
 *     entry that is a different grape entirely
 *   - nothing here may name a recipe or carry an allergen verdict
 *
 * ## Two corrections made at authoring time
 *
 * The draft order taught `zero-proof-cocktails-and-the-sober-bar` and
 * `the-spritz-and-aperitivo-hour` at module 3, while the entries their prose
 * depends on (oleo saccharum, the dry shake, the citrus program) are taught at
 * module 27. Both moved to 27. And a `srv-pour` module carried no terms at all;
 * it was a drill, and drills are not content.
 */

/** The five atlases this track exists to order, and their measured sizes. */
export const FOH_CATEGORIES = {
	'Cheese Atlas': 46,
	'Charcuterie Atlas': 41,
	'Cocktail & Bar': 38,
	'Wine & Beverage': 34,
	'The Grape Atlas': 17
};

export const FOH_TOTAL = 176;

/**
 * Cellar bottle -> the lexicon term that teaches it.
 *
 * Hand-authored, exactly like technique-table.mjs's LEXICON_ANCHOR and for the
 * same reason: the near-misses are convincing. Five of the 22 cellar slugs are
 * already lexicon slugs and resolve by identity; these are the rest that have a
 * real home.
 *
 * The five deliberately absent are absent because the guide does not teach them:
 * `barbera` (the only Piedmont entry is Nebbiolo, a different grape),
 * `muscadet` (the one match is an entry about the fruit), `gewurztraminer`,
 * `sauternes`, and `rose`, for which the guide has one passing clause inside
 * grenache-garnacha and nothing else. Anchoring any of them would be inventing
 * a lesson.
 */
export const CELLAR_ANCHOR = {
	cabernet: 'cabernet-sauvignon-and-the-bordeaux-blend',
	syrah: 'syrah-shiraz',
	albarino: 'albarino-alvarinho',
	champagne: 'champagne-and-the-methode',
	sake: 'sake-fundamentals-the-polishing-ladder',
	port: 'port-madeira-and-the-fortified-sweets',
	chianti: 'sangiovese',
	chablis: 'chardonnay',
	lager: 'beer-styles-the-two-family-map',
	stout: 'beer-styles-the-two-family-map',
	saison: 'beer-styles-the-two-family-map',
	'fino-sherry': 'the-sherry-spectrum'
};

/** Bottles the guide carries no lesson for. Shipped so the page can say so. */
export const CELLAR_UNTAUGHT = ['barbera', 'muscadet', 'gewurztraminer', 'sauternes', 'rose'];

/**
 * The order. This is the authored part, and the only authored part.
 *
 * Twenty-seven modules over 186 term references, covering all 176
 * front-of-house terms exactly once. It opens on the room rather than on wine,
 * because a server on their first shift needs the words the kitchen shouts
 * before they need the Grape Atlas, and it ends on bar craft, which most
 * servers never need and every server-bartender does.
 *
 * `outcome` is what a person can do after the module, written as a claim that
 * could be checked. It is not a summary of the reading.
 */
export const SERVER_MODULES = [
	{
		key: "srv-room",
		title: "The Room's Vocabulary",
		outcome: "You can act on \"86 the halibut\", say \"behind\" without thinking, and name who is working the pass. The guide keeps MENU FORMAT and SERVICE SCHOOL as two separate axes (a room runs one of each, not one of seven) so you can state both for your room. It does not teach ticket anatomy: 'dupe' is glossed in four words inside a single definition, and there is no fire or all-day sequencing anywhere in the guide, so reading a ticket is something your room teaches you and this track does not pretend to.",
		termSlugs: [
			"service-styles-and-front-of-house-fluency",
			"line-slang-86-in-the-weeds-and-family-meal",
			"the-pass-and-expediting",
			"the-brigade-de-cuisine"
		]
	},
	{
		key: "srv-allergens",
		title: "What We Screened and What We Did Not",
		// Worded to survive the vocabulary: an earlier version enumerated "seven
		// derived, eight not, 101 of 970 empty" and all three went stale when the
		// screen widened to thirteen. The one stable fact is the refusal and its
		// reason.
		outcome: "You never answer an allergen question from the app. You can say what the recipe screen is (a text screen over the ingredient lines, which by design cannot see a shared fryer, a dusted board, or a supplier’s label), and you know that a dish showing nothing means the screen found nothing, never that the dish is clear. The screen itself names what it checked and what it did not, on every recipe.",
		termSlugs: [
			"food-safety-the-chef-owners-non-negotiables"
		]
	},
	{
		key: "srv-license",
		title: "Responsible Service and the Law",
		outcome: "You can run a cut-off: slow, water, food, then a clear kind no with a manager behind you. You check anyone who could plausibly be under 30, you know dram-shop liability makes the room civilly liable for a guest it overserved, and you can offer a genuinely good zero-proof or a spritz instead of a fourth negroni.",
		termSlugs: [
			"responsible-service-and-the-law"
		]
	},
	{
		key: "srv-bottle",
		title: "The Bottle at the Table",
		outcome: "You can present, open, and pour a bottle without ceremony, and you know the taste pour exists to check for FAULTS and not preference. You can identify corked (wet cardboard), oxidized (bruised apple), and reduced (struck match: wait, it may blow off), and you replace a corked bottle graciously without arguing. You serve whites at 7-13°C and reds at 15-18°C.",
		termSlugs: [
			"wine-faults-corked-oxidized-reduced-and-friends",
			"the-sommeliers-service-ritual-and-floor-fluency",
			"decanting-temperature-and-glassware"
		]
	},
	{
		key: "srv-structure",
		title: "How a Wine Is Described",
		outcome: "You can answer \"is it dry?\" and \"is it heavy?\" correctly, and you know off-dry is not sweet. You can say what tannin does to your mouth and what acid does, so that when a guest says \"something smooth\" you know which lever they mean.",
		termSlugs: [
			"acidity-the-backbone",
			"tannin",
			"body-alcohol-and-weight-matching",
			"dry-off-dry-and-residual-sugar",
			"oak-malolactic-and-lees",
			"terroir-and-old-world-vs-new-world",
			"vintage-nv-and-minerality"
		]
	},
	{
		key: "srv-pairing-laws",
		title: "The Two Games and the Switches",
		outcome: "For any pairing you can say in one sentence whether it is CONGRUENT (echo the dish) or CONTRAST (oppose it), and which switch is doing the work: salt loves acid and bubbles, fat wants cutting acid or matching richness, food acid demands equal wine acid, chile is inflamed by alcohol and tannin, sweet dishes need sweeter wine, bitter stacks with tannin, umami makes tannin harsh.",
		termSlugs: [
			"congruent-vs-contrast-the-master-key",
			"the-pairing-laws-salt-fat-acid-heat-sweet-bitter",
			"regional-pairing-and-the-hard-to-pair-list"
		]
	},
	{
		key: "srv-cellar-whites",
		title: "The Whites You Will Pour",
		outcome: "Three sentences on Chardonnay, Sauvignon Blanc and Riesling (what it is, what it tastes like, what dish it loves) and you know Riesling is the answer to chile heat and Chardonnay's oak level must match the butter level.",
		termSlugs: [
			"chardonnay-the-shape-shifter",
			"sauvignon-blanc-and-the-aromatic-whites",
			"riesling-the-sommeliers-secret-weapon"
		]
	},
	{
		key: "srv-cellar-reds",
		title: "The Reds You Will Pour",
		outcome: "Three sentences each on the Bordeaux blend, Pinot Noir, the Rhône school, the Tempranillo/Sangiovese/Nebbiolo food-wine trinity, and the New World crowd-pleasers; and you can steer a table off Cabernet when the plate is chile or delicate fish.",
		termSlugs: [
			"cabernet-sauvignon-and-the-bordeaux-blend",
			"pinot-noir-and-burgundy",
			"syrah-grenache-and-the-rhone-school",
			"tempranillo-sangiovese-and-nebbiolo-the-food-wine-trinity",
			"malbec-zinfandel-and-the-new-world-crowd-pleasers"
		]
	},
	{
		key: "srv-cellar-bubbles-fortified",
		title: "Bubbles, Sherry and the Fortified End",
		outcome: "You can sell Champagne as the universal rescue rather than a celebration tax, tell Prosecco from Cava from Pét-Nat, place a Fino against a Manzanilla, and pour the right end of the Port/Madeira shelf against a cheese board or a chocolate dessert.",
		termSlugs: [
			"champagne-and-the-methode",
			"prosecco-cava-pet-nat-and-the-sparkling-bench",
			"the-sherry-spectrum",
			"port-madeira-and-the-fortified-sweets"
		]
	},
	{
		key: "srv-grape-atlas",
		title: "The Grape Atlas (Deep Reference)",
		outcome: "For any varietal on the list you can name where it comes from, what it smells like and what it does at the table: the depth that separates a server who recites the by-the-glass list from one who sells off it.",
		termSlugs: [
			"riesling",
			"chardonnay",
			"sauvignon-blanc",
			"chenin-blanc",
			"gruner-veltliner",
			"albarino-alvarinho",
			"pinot-noir",
			"gamay-beaujolais",
			"sangiovese",
			"nebbiolo",
			"tempranillo",
			"cabernet-sauvignon",
			"merlot",
			"malbec",
			"syrah-shiraz",
			"grenache-garnacha",
			"zinfandel-primitivo"
		]
	},
	{
		key: "srv-other-drinks",
		title: "Everything That Is Not Wine",
		outcome: "You can pair beer by its two families, explain the sake polishing ladder and serve it at the right temperature, run a tea and coffee service that is not an afterthought, and build a genuine non-alcoholic pairing for a guest who is not drinking.",
		termSlugs: [
			"beer-styles-the-two-family-map",
			"beer-at-the-table-and-the-carbonation-advantage",
			"sake-fundamentals-the-polishing-ladder",
			"sake-service-and-pairing",
			"tea-service-and-pairing",
			"espresso-and-the-coffee-program",
			"the-non-alcoholic-pairing-program"
		]
	},
	{
		key: "srv-cheese-spine",
		title: "The Board: Formula and Families",
		outcome: "You can build or explain a board (3-5 cheeses spanning milk, texture and volume, 30-50g a head, always at room temperature an hour out) and place any cheese into fresh / bloomy / washed / semi-hard-to-hard / blue. You know why halloumi holds its shape and gruyère flows.",
		termSlugs: [
			"cheese-families",
			"building-the-cheese-board-and-cave-basics"
		]
	},
	{
		key: "srv-cheese-italy",
		title: "The Italian Board",
		outcome: "One sentence per cheese on the eleven Italian entries, and you can tell a guest why the crunch in aged Parmigiano is a feature, when Grana Padano is the right substitution and when it is not, and the difference between Gorgonzola dolce and piccante.",
		termSlugs: [
			"parmigiano-reggiano",
			"grana-padano",
			"pecorino-romano",
			"mozzarella-di-bufala-campana",
			"burrata",
			"ricotta",
			"mascarpone",
			"gorgonzola-dolce-and-piccante",
			"taleggio",
			"fontina-val-daosta",
			"provolone-dolce-and-piccante"
		]
	},
	{
		key: "srv-cheese-france",
		title: "The French Board",
		outcome: "Bloomy and washed rind on their home ground: you can warn a table that Époisses smells worse than it tastes, explain Morbier's ash line, and stop a guest cutting the nose off a wedge of Comté.",
		termSlugs: [
			"brie-de-meaux",
			"camembert-de-normandie",
			"roquefort",
			"comte",
			"epoisses",
			"reblochon",
			"morbier",
			"crottin-de-chavignol",
			"munster"
		]
	},
	{
		key: "srv-cheese-alpine-iberia",
		title: "Alpine and Iberian",
		outcome: "You can sell the melting cheeses on their physics (Gruyère, Fontina, Raclette) and place the sheep's-milk Iberians (Manchego, Idiazábal, Serra da Estrela) plus Cabrales as the blue that outguns Roquefort.",
		termSlugs: [
			"gruyere",
			"emmentaler",
			"raclette",
			"appenzeller",
			"manchego",
			"cabrales",
			"idiazabal",
			"serra-da-estrela"
		]
	},
	{
		key: "srv-cheese-isles-north",
		title: "Britain, the Low Countries and the Cold Edge",
		outcome: "You can explain what \"West Country Farmhouse\" protects, sell Stilton with honey, place aged Gouda's crystals with Parmigiano's, and handle the four that behave unlike any of them: feta, halloumi, brunost, sulguni.",
		termSlugs: [
			"west-country-farmhouse-cheddar",
			"stilton",
			"aged-gouda",
			"feta",
			"halloumi",
			"brunost-gjetost",
			"sulguni"
		]
	},
	{
		key: "srv-cheese-world",
		title: "The Levant, South Asia and the Americas",
		outcome: "You can serve and describe paneer, labneh, the Mexican trio and the American four without apology or condescension, including why American cheese is engineered the way it is.",
		termSlugs: [
			"paneer",
			"akkawi-and-nabulsi",
			"labneh",
			"queso-oaxaca-quesillo",
			"cotija",
			"queso-fresco",
			"monterey-jack-and-pepper-jack",
			"humboldt-fog",
			"american-cheese-defended",
			"cream-cheese-and-its-kin"
		]
	},
	{
		key: "srv-charc-craft",
		title: "The Charcuterie Board: Two Churches, One Slicer",
		outcome: "You can build a board (3-5 meats spanning silk, salame, spreadable and a wildcard, 60-90g a head), you slice whole-muscle translucent and salame in 2-3mm coins on a slight bias, everything at room temperature 20-30 minutes out and cut as close to service as possible, and you can tell a guest which of the two crafts they are eating.",
		termSlugs: [
			"whole-muscle-vs-fermented-salami-the-two-churches",
			"slicing-and-service-law",
			"building-the-charcuterie-board"
		]
	},
	{
		key: "srv-charc-italy",
		title: "The Italian Salumi",
		outcome: "One sentence per product across the eleven Italian entries: you can tell Parma from San Daniele, coppa from culatello, and steer a table toward 'Nduja or Finocchiona by what they said they liked.",
		termSlugs: [
			"prosciutto-di-parma-and-san-daniele",
			"culatello-di-zibello",
			"speck-alto-adige",
			"coppa-capocollo",
			"pancetta-tesa-and-arrotolata",
			"mortadella-bologna",
			"the-salame-family-milano-genoa-felino",
			"finocchiona",
			"nduja",
			"soppressata",
			"bresaola-della-valtellina"
		]
	},
	{
		key: "srv-charc-iberia",
		title: "The Spanish Cure",
		outcome: "You can explain the bellota grades and why Ibérico costs what it costs, separate Spanish chorizo from Mexican chorizo before a guest orders the wrong one, and place Lomo, Sobrasada, Fuet, Morcilla and Cecina.",
		termSlugs: [
			"jamon-serrano",
			"jamon-iberico-and-the-bellota-grades",
			"chorizo-spanish-vs-mexican",
			"lomo-embuchado",
			"sobrasada",
			"fuet-and-salchichon",
			"morcilla",
			"cecina-de-leon"
		]
	},
	{
		key: "srv-charc-france",
		title: "The French Charcuterie",
		outcome: "You can serve pâté, terrine and pâté en croûte at the right thickness with a hot wet knife, explain boudin noir to a hesitant table, and handle a foie gras order, including the ethics question, without improvising an answer.",
		termSlugs: [
			"jambon-de-bayonne-and-french-whole-muscle-hams",
			"saucisson-sec",
			"pate-and-terrine",
			"pate-en-croute",
			"boudin-noir-and-boudin-blanc",
			"foie-gras-torchon-mi-cuit-and-ethics-of-service",
			"duck-prosciutto-magret-seche"
		]
	},
	{
		key: "srv-charc-world",
		title: "Central Europe, America and the Wider Cure",
		outcome: "You can place Black Forest ham, Landjäger, Téliszalámi and the kielbasa family; explain American country ham's salt and Tasso's role; defend pepperoni honestly; and describe head cheese and lap cheong to a guest who has never met either.",
		termSlugs: [
			"schwarzwalder-schinken-black-forest-ham",
			"landjager",
			"teliszalami-hungarian-winter-salami",
			"kabanosy-and-the-kielbasa-family",
			"american-country-ham",
			"tasso-and-cajun-andouille",
			"pepperoni-honestly",
			"head-cheese-and-the-aspic-arts",
			"lap-cheong-and-the-chinese-cured-pantry",
			"pastirma-and-sujuk"
		]
	},
	{
		key: "srv-charc-producer",
		title: "How It Was Cured (Reference)",
		outcome: "You can answer a guest who asks about nitrites without repeating a myth, and you understand what the curing chamber is doing: enough to know when to hand the question to the chef rather than answer it.",
		termSlugs: [
			"pink-salt-nitrite-and-nitrate-the-science-straight",
			"casings-molds-and-the-curing-chamber"
		]
	},
	{
		key: "srv-bar-bottles",
		title: "What Is in the Bottle",
		outcome: "For any well or call order you can say what the spirit is made from, roughly what it tastes like, and what it substitutes for, across whiskey, Scotch/Irish/world whisky, gin, vodka, rum, tequila and mezcal, brandy, vermouth, amari, the liqueur shelf, bitters and absinthe.",
		termSlugs: [
			"bourbon-rye-and-american-whiskey",
			"scotch-irish-and-world-whisky",
			"gin-and-the-botanical-family",
			"vodka-honestly",
			"rum-light-aged-agricole-and-funk",
			"tequila-and-mezcal",
			"brandy-cognac-armagnac-calvados-and-pisco",
			"vermouth-and-the-fortified-aperitif-shelf",
			"amari-and-the-bitter-liqueurs",
			"the-liqueur-shelf-orange-maraschino-chartreuse-and-friends",
			"bitters-the-bars-spice-rack",
			"absinthe-and-the-rinse"
		]
	},
	{
		key: "srv-bar-templates",
		title: "The Cocktail Templates",
		outcome: "You can answer \"what's in it?\" for anything a guest orders by name, because you know the seven templates every classic collapses into: sour, old fashioned, the stirred aristocrats, highball/collins, equal-parts negroni, tiki, and the hot drinks.",
		termSlugs: [
			"the-sour-template",
			"the-old-fashioned-template",
			"martini-and-manhattan-the-stirred-aristocrats",
			"highballs-and-the-collins-family",
			"the-negroni-and-equal-parts-architecture",
			"tiki-and-the-rum-canon",
			"hot-drinks-toddy-irish-coffee-and-the-warm-service"
		]
	},
	{
		key: "srv-bar-craft",
		title: "Bar Craft (Server-Bartenders Only)",
		outcome: "You can build a drink to spec: shake what is cloudy and stir what is clear, jigger every pour, manage ice and dilution as an ingredient, double-strain, dry-shake an egg white, run the citrus and syrup programs, express a twist, and keep glassware chilled and mise within three steps.",
		termSlugs: [
			"shake-vs-stir-the-first-law",
			"ice-and-dilution-the-invisible-ingredient",
			"the-jigger-and-the-spec",
			"strainers-hawthorne-julep-and-the-double-strain",
			"egg-whites-and-the-dry-shake",
			"muddling-swizzling-and-built-drinks",
			"syrups-simple-rich-oleo-and-the-house-program",
			"the-citrus-program",
			"garnish-expression-twists-and-the-cherry-question",
			"glassware-and-the-chill-law",
			"rinses-floats-and-layering",
			"batching-and-pre-dilution",
			"bar-mise-and-the-three-step-reach",
			"building-the-home-and-starting-bar",
			"zero-proof-cocktails-and-the-sober-bar",
			"the-spritz-and-aperitivo-hour"
		]
	},
	{
		key: "srv-floor-economics",
		title: "Why the Shift Makes Money",
		outcome: "You understand what your recommendations do to the room's numbers: how the wine list is marked up and where the value bottles sit, what a by-the-glass pour really costs and how Coravin and corkage change it, the well/call/back-bar ladder, how covers and turns are counted, what the reservation book knows, and how the tip pool you are in actually works.",
		termSlugs: [
			"wine-list-engineering-and-the-markup-question",
			"by-the-glass-economics-coravin-and-corkage",
			"pour-cost-and-bar-economics",
			"the-well-the-call-and-the-back-bar",
			"revenue-management-covers-turns-and-dayparts",
			"reservations-no-shows-and-the-book",
			"tipping-models-pools-tip-credits-and-service-charges",
			"menu-pricing-and-psychology"
		]
	}
];

/**
 * Refuse a per-dish allergen verdict, structurally.
 *
 * The same shape as sanitation.mjs's assertNoRecipes, and for a sharper reason:
 * the recipe screen names what it checked and what it did not, and a
 * server track that said "contains" or "clear" about a dish would be read at a
 * table, out loud, to a guest. The guide has no allergen curriculum: measured
 * across all 479 definitions, exactly two mention allergens and only one states
 * a rule, so there is nothing here to build one out of.
 */
function assertNoVerdict(obj, recipeSlugs, problems) {
	const BANNED = new Set(['allergens', 'contains', 'clear', 'safe', 'screened', 'recipes']);
	/** @type {(node: unknown, path: string) => void} */
	const walk = (node, path) => {
		if (typeof node === 'string') {
			if (recipeSlugs.has(node)) {
				problems.push(`service-track: ${path} names the recipe "${node}": this track is about terms`);
			}
			return;
		}
		if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`));
		if (node && typeof node === 'object') {
			for (const [k, v] of Object.entries(node)) {
				if (BANNED.has(k)) {
					problems.push(
						`service-track: shipped object carries a "${k}" field at ${path}; ` +
							'this track must not deliver an allergen verdict'
					);
				}
				walk(v, path ? `${path}.${k}` : k);
			}
		}
	};
	walk(obj, '');
}

/**
 * @param {Array<{ slug: string, term: string, category: string, definition: string }>} lexicon
 * @param {Array<{ slug: string, name: string }>} cellar
 * @param {string[]} [recipeSlugList]
 */
export function buildServiceTrack(lexicon, cellar, recipeSlugList = []) {
	/** @type {string[]} */
	const problems = [];
	const bySlug = new Map(lexicon.map((e) => [e.slug, e]));

	/* ---- the atlases still exist, and are still this size ---------------- */
	for (const [category, expected] of Object.entries(FOH_CATEGORIES)) {
		const actual = lexicon.filter((e) => e.category === category).length;
		if (actual === 0) {
			problems.push(`service-track: the lexicon no longer has a "${category}" category`);
		} else if (actual !== expected) {
			problems.push(
				`service-track: "${category}" holds ${actual} terms, the track was built against ${expected}; ` +
					're-check the module that owns the difference before changing this number'
			);
		}
	}

	const fohSlugs = new Set(
		lexicon.filter((e) => e.category in FOH_CATEGORIES).map((e) => e.slug)
	);
	if (fohSlugs.size !== FOH_TOTAL) {
		problems.push(`service-track: the five atlases hold ${fohSlugs.size} terms, not ${FOH_TOTAL}`);
	}

	/* ---- every reference resolves, exactly once -------------------------- */
	const seen = new Map();
	for (const m of SERVER_MODULES) {
		for (const slug of m.termSlugs) {
			if (!bySlug.has(slug)) {
				problems.push(`service-track: ${m.key} references "${slug}", which is not a lexicon term`);
			}
			const first = seen.get(slug);
			if (first) problems.push(`service-track: "${slug}" is taught twice: ${first} and ${m.key}`);
			else seen.set(slug, m.key);
		}
		if (!m.termSlugs.length) {
			problems.push(`service-track: ${m.key} teaches nothing`);
		}
	}

	/* ---- and the reverse: no front-of-house term is left behind ---------- */
	const placed = new Set(seen.keys());
	const orphans = [...fohSlugs].filter((s) => !placed.has(s));
	if (orphans.length) {
		problems.push(
			`service-track: ${orphans.length} front-of-house term(s) belong to no module: ` +
				orphans.slice(0, 5).join(', ')
		);
	}

	/* ---- the cellar anchor, both sides ----------------------------------- */
	const cellarSlugs = new Set(cellar.map((b) => b.slug));
	for (const [bottle, term] of Object.entries(CELLAR_ANCHOR)) {
		if (!cellarSlugs.has(bottle)) {
			problems.push(`service-track: CELLAR_ANCHOR key "${bottle}" is not a bottle in the cellar`);
		}
		if (!bySlug.has(term)) {
			problems.push(`service-track: CELLAR_ANCHOR maps "${bottle}" to "${term}", which is not a term`);
		}
	}
	for (const bottle of CELLAR_UNTAUGHT) {
		if (!cellarSlugs.has(bottle)) {
			problems.push(`service-track: "${bottle}" is listed as untaught but is no longer in the cellar`);
		}
		if (bySlug.has(bottle) || CELLAR_ANCHOR[bottle]) {
			problems.push(
				`service-track: "${bottle}" is listed as untaught and now has a lesson: move it out of CELLAR_UNTAUGHT`
			);
		}
	}

	/* ---- what the track ships -------------------------------------------- */
	const modules = SERVER_MODULES.map((m, i) => ({
		key: m.key,
		n: i + 1,
		title: m.title,
		outcome: m.outcome,
		terms: m.termSlugs.map((slug) => {
			const e = bySlug.get(slug);
			return { slug, term: e ? e.term : slug, category: e ? e.category : '' };
		})
	}));

	const cellarMap = cellar.map((b) => {
		const term = bySlug.has(b.slug) ? b.slug : (CELLAR_ANCHOR[b.slug] ?? null);
		return { bottle: b.slug, name: b.name, term };
	});

	const serviceTrack = {
		modules,
		total: placed.size,
		fohTotal: fohSlugs.size,
		categories: FOH_CATEGORIES,
		cellar: cellarMap,
		untaught: CELLAR_UNTAUGHT
	};

	assertNoVerdict(serviceTrack, new Set(recipeSlugList), problems);

	return { serviceTrack, problems };
}
