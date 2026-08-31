/**
 * The stations, and which of the guide's techniques belong to each.
 *
 * A kitchen is staffed by station, and the only question a coverage board needs
 * to answer is "my saucier called in sick, who can cover?". That question is
 * unanswerable without this map.
 *
 * ## The stations are the guide's, not ours
 *
 * `the-brigade-de-cuisine` names them: SAUCIER, GARDE MANGER, PÂTISSIER,
 * POISSONNIER, RÔTISSEUR/GRILLARDIN, ENTREMETIER, plus TOURNANT, "the swing
 * cook who works every station", which is not a station but a description of
 * somebody who covers all six. Every station below is gated against that entry:
 * invent one the guide does not name and the build stops.
 *
 * ## The map is authored, and it is a claim about work rather than cuisine
 *
 * Three independent mappings were made: classically, as a modern flattened
 * kitchen actually runs, and by what you would teach together, and every
 * station's roster was then audited adversarially for techniques wrongly on it
 * and techniques missing from it. Where the three disagreed, the disagreement
 * is recorded rather than averaged away.
 *
 * A technique is placed by what the COOK IS DOING, never by where the dish comes
 * from: "Wok technique" is not a station, and what happens at the wok decides it.
 *
 * ## Gated in reverse, which is the half that matters
 *
 * A technique belonging to NO station is a hole in the board: a person could
 * have cooked it and be credited nowhere. The build fails on that, so a
 * technique added to the spine cannot quietly fall out of the coverage model.
 */

/**
 * Techniques the coverage board must NOT count, because the corpus does not
 * actually drill them.
 *
 * Both were found by auditing the map, not by reading the labels, and both
 * would have credited a cook with something they have never done, which is the
 * one failure a coverage board cannot survive.
 *
 *   The soufflé      : one recipe, milanesa-a-la-napolitana, a breaded fried
 *                      cutlet. The only appearance of the word is a NEGATIVE
 *                      SIMILE: "milanesa crust should be a jacket, not a
 *                      soufflé". Nothing in the guide drills a soufflé, sweet
 *                      or savoury, and a manager reading that box would believe
 *                      their pastry cook had been tested on the most
 *                      collapse-prone item in the repertoire.
 *   Pleating dumplings: WAS excluded here. Its only recipe was christmas-pudding,
 *                      where the pleat is the parchment-and-foil lid over a
 *                      steamed basin: the label described a dumpling and the
 *                      data described a pudding. The Dumpling Atlas of 31 Aug
 *                      2026 gave it ten recipes that genuinely pleat, so the
 *                      judgement was re-made and the exclusion lifted, which is
 *                      exactly what the gate below exists to force.
 *
 * `recipes` is gated exactly: if the corpus ever gains a real soufflé, the
 * build fails and forces this judgement to be made again rather than leaving a
 * genuine technique permanently uncounted.
 */
export const UNDRILLED = {
	'The soufflé': ['milanesa-a-la-napolitana']
};

/**
 * Techniques that belong to every station, and therefore to none.
 *
 * Cross-station literacy. Counting them toward one station tells a manager
 * nothing about who can cover whom, which is the only question this board
 * exists to answer, so they are reported separately.
 *
 *   Sweating aromatics  98 recipes, the second-largest technique in the file
 *                       against a median of 8. Everyone sweats an onion.
 *   Knife cuts          49 recipes across four semesters. Every station cuts.
 *   The overnight rest  17 recipes, and it is a scheduling doctrine rather than
 *                       a skill anyone stands at a station to perform.
 *
 * `min` is gated: a technique is foundational BECAUSE it is everywhere, so if
 * its reach collapses it is no longer foundational and belongs to a station.
 */
export const FOUNDATION = {
	'Sweating aromatics: soft, never browned': { min: 60 },
	'Knife cuts: dice, julienne, bias': { min: 30 },
	'The overnight rest: letting a dish marry': { min: 10 }
};

/** Keys are ours; `name` and `remit` must both be findable in the guide's entry. */
export const BRIGADE_ANCHOR = 'the-brigade-de-cuisine';

export const STATIONS = [
	{ key: 'saucier', name: 'SAUCIER', label: 'Saucier', evidence: 'SAUCIER (sauces/sautés' },
	{
		key: 'garde-manger',
		name: 'GARDE MANGER',
		label: 'Garde manger',
		evidence: 'GARDE MANGER (cold kitchen: salads, charcuterie, terrines)'
	},
	{ key: 'patissier', name: 'PÂTISSIER', label: 'Pâtissier', evidence: 'PÂTISSIER (pastry)' },
	{ key: 'poissonnier', name: 'POISSONNIER', label: 'Poissonnier', evidence: 'POISSONNIER (fish)' },
	{
		key: 'rotisseur',
		name: 'RÔTISSEUR/GRILLARDIN',
		label: 'Rôtisseur',
		evidence: 'RÔTISSEUR/GRILLARDIN (roasts and grill)'
	},
	{
		key: 'entremetier',
		name: 'ENTREMETIER',
		label: 'Entremetier',
		evidence: 'ENTREMETIER (vegetables, soups, eggs)'
	}
];

/** Not a station. Gated so the page can quote the guide on what it means. */
export const TOURNANT_EVIDENCE = 'TOURNANT (the swing cook who works every station';

/**
 * Technique -> station. Authored, and a claim about WORK rather than cuisine.
 *
 * Built from three independent mappings, classical, modern-flattened, and
 * teach-together, reconciled against a per-station adversarial audit. Where
 * the three disagreed the note records what decided it; where a real kitchen
 * genuinely splits a technique it carries two stations and says why.
 */
export const STATION_MAP = {
	"Arepas": ["entremetier"],  // Unanimous. Masa cake on flat metal; the griddle is a surface, not a station.
	"Asado fire": ["rotisseur"],  // Unanimous.
	"Béchamel: the mother sauce": ["saucier"],  // Unanimous.
	"Beurre blanc": ["saucier"],  // Unanimous; the sauce is built on the sauce stove even though it is sent to fish.
	"Biryani & dum": ["entremetier"],  // Unanimous. A sealed rice pot; the meat is a garnish inside it.
	"Blanching & shocking": ["entremetier", "garde-manger"],  // SPLIT per garde-manger audit: entremetier owns the pot, but 8 of 23 recipes are cold plates (salade-nicoise, gado-gado, pkhali-trio, maine-lobster-rol
	"Braising": ["saucier"],  // Contested. Entremetier audit struck it: the definition says 'the strained liquid IS the sauce; reduce and mount it', and only 3 of 27 recipes are veg
	"Brining & curing": ["garde-manger"],  // Contested. Training wanted a rotisseur half; the rotisseur audit disowned it: only 3 of 30 recipes are fire work. Single.
	"Brown butter": ["saucier"],  // Unanimous.
	"Building an emulsion": ["garde-manger", "saucier"],  // SPLIT per two audits: the definition names both families in one breath. Hot line (hollandaise, beurre-blanc, vongole) vs cold rail (caesar, green godd
	"Butchery basics": ["rotisseur"],  // Contested. Garde-manger audit struck it: the guide's brigade entry defines that station as 'cold kitchen: salads, charcuterie, terrines' and never men
	"Ceviche": ["garde-manger"],  // Contested. Poissonnier audit struck the fish half: no lexicon anchor, no semester, and the guide pointedly did NOT file it under Seafood Mastery. Zero
	"Charring over open flame": ["entremetier"],  // Contested. Rotisseur audit struck the grill half: 12 of 13 recipes are chiles, eggplant and tomatoes blistered for salsas and dips; only elote sits on
	"Chilling to firm: the fridge as binder": ["garde-manger", "patissier"],  // SPLIT, unanimous and confirmed by both audits: chilled farce (kofta, kottbullar, coddies) vs chilled confection (nanaimo bars, buckeyes, boston cream 
	"Choux pastry": ["patissier"],  // Unanimous.
	"Churning ice cream": ["patissier"],  // Unanimous.
	"Churros": ["patissier"],  // Unanimous. I declined the audit's rotisseur half: the frying definition here is boilerplate shared verbatim by five techniques, so it cannot discrimin
	"Confit": ["saucier"],  // Contested: all three lenses were wrong. Garde-manger audit struck it: no definition, and the three recipes (pollo-al-ajillo, torta-ahogada, mission-s
	"Congee": ["entremetier"],  // Unanimous. Soup and starch in one pot.
	"Creaming butter & sugar": ["patissier"],  // Unanimous.
	"Crêpes": ["patissier"],  // Contested. Filed by the guide under semester 6, Pastry Fundamentals; entremetier audit struck the savoury claim as resting on two of five recipes.
	"Curing gravlax": ["garde-manger"],  // Unanimous.
	"Dashi": ["entremetier"],
	"Ramen broth": ["saucier"],  // New. Carried nothing until the Stock & Fond Atlas added a tonkotsu; it is a stock held at a rolling boil to emulsify collagen and fat on purpose, which is saucier work and the deliberate exception to every other rule in that chapter.  // Contested. Saucier audit struck it: semester 2 'Stocks, Soups & the Simmer', and its seven recipes are soups, an egg dish, a rice bowl and three noodl
	"Deep frying": ["rotisseur"],  // Contested. The friturier sub-chain is imported (the guide's brigade entry names no fry cook) but the entremetier audit equally refuted the veg stati
	"Deglazing & pan sauces": ["saucier"],  // Unanimous.
	"Draining fried food: a rack, never paper": ["rotisseur"],  // Follows the fryer. Anchored to 'Fryer Setups & Oil Management'; oil husbandry has to sit with whoever owns the oil.
	"Dry-pan toasting: spices, seeds and nuts": ["saucier"],  // Unanimous. Declined the pastry audit's second station: it flagged its own weakness (4 of 17 recipes).
	"Egg wash & the baker’s shine": ["patissier"],  // Unanimous.
	"Empanada folding": ["patissier"],  // Contested. Two of three lenses said pastry; garde-manger audit struck its own claim: one recipe, no definition, and the same hands as pierogi and ple
	"Pleating dumplings": ["patissier"],  // New, and filed beside Empanada folding for the same reason: in this brigade mapping the shaping of a filled dough is pastry work, whatever cuisine it comes from. The Dumpling Atlas made it real.
	"Falafel": ["rotisseur"],  // Contested. Entremetier audit struck it: the query field is literally 'falafel frying technique' and the anchor is Deep & Shallow Frying. The chickpea 
	"Fermentation": ["garde-manger", "patissier"],  // SPLIT. The definition covers both kingdoms explicitly, lacto-ferments and koji against yeast and levain, and 10 of 18 recipes are leavened doughs. T
	"Filleting fish": ["poissonnier"],  // Contested. Poissonnier audit struck the garde-manger half as double-counting: the meat/poultry side of that same lexicon entry already has its own tec
	"Flambé": ["saucier"],  // Unanimous.
	"Folding: keeping the air in": ["patissier"],  // Unanimous.
	"Fresh pasta": ["patissier"],  // Contested, and the sharpest call on the board. Entremetier audit struck it: the anchor is 'Gluten & Hydration', the same baker's entry that anchors K
	"Gnocchi": ["entremetier"],  // New with the Pasta & Fresh Dough chapter. A potato dumpling is starch cookery before it is pasta, and the entremetier owns the potato.
	"Frying the paste until the oil splits": ["saucier"],  // Unanimous. Declined the entremetier audit's addition: this is a sauce base, and the guide's brigade entry gives sauces to the saucier by name.
	"Griddle & plancha work": ["rotisseur"],  // Contested. Entremetier audit disowned it: the definition sells the flat-top on 'smash burgers' entire physics', and the roster is cheesesteaks, reuben
	"Grilling over live coals": ["rotisseur"],  // Unanimous.
	"Hand-pulled noodles": ["patissier"],  // Contested. Same anchor as Fresh pasta, 'Gluten & Hydration', one recipe (lagman). Nothing in the entry is about broth or the boil; it is developing a
	"Handling phyllo": ["patissier"],  // Unanimous.
	"Hollandaise": ["saucier"],  // Unanimous.
	"Icing & frosting": ["patissier"],  // Unanimous.
	"Injera": ["patissier"],  // Unanimous. The anchor is fermentation but the work is a levain and a griddle bake.
	"Jerk": ["rotisseur"],  // Unanimous.
	"Jollof & party smoke": ["entremetier"],  // Unanimous. Rice, and the char rice forms.
	"Keeping the cooking liquid": ["entremetier", "saucier"],  // SPLIT per saucier audit: semester 3 is 'The Sauté Station & Pan Sauces' and vongole, garides-saganaki and konigsberger-klopse mount the liquid into a 
	"Khachapuri shaping": ["patissier"],  // Unanimous.
	"Kneading dough": ["patissier"],  // Unanimous.
	"Lamination": ["patissier"],  // Unanimous.
	"Letter-folding dough": ["patissier"],  // Unanimous.
	"Low & slow smoking": ["rotisseur"],  // Unanimous.
	"Making a roux": ["saucier"],  // Unanimous.
	"Marinating: acid, salt and time": ["rotisseur"],  // Contested three ways. Both the garde-manger and the saucier audits disowned it; what is left is the fire cook, and the roster agrees: carne asada, je
	"Mashing & puréeing": ["entremetier"],  // Unanimous.
	"Paella & socarrat": ["entremetier"],  // Unanimous.
	"Pie crust & blind baking": ["patissier"],  // Unanimous.
	"Pierogi": ["patissier"],  // Contested. Entremetier audit struck it: no definition, no anchor, and one of the three recipes is a sweet cherry dessert. The potato filling is veg wo
	"Pounding a curry paste": ["saucier"],  // Unanimous. Distinguished from The molcajete by what happens next: this paste gets fried in fat and becomes a hot sauce.
	"Proofing: the rise before the oven": ["patissier"],  // Unanimous.
	"Reducing a sauce": ["saucier"],  // Unanimous.
	"Rendering fat: and cooking in what runs out": ["saucier"],  // Unanimous.
	"Resting dough: the pause that does the work": ["patissier"],  // Unanimous.
	"Resting meat & slicing against the grain": ["rotisseur"],  // Unanimous.
	"Risotto method": ["entremetier"],  // Unanimous.
	"Roasting in a hot oven": ["rotisseur"],  // Unanimous.
	"Rubbing fat into flour": ["patissier"],  // Unanimous.
	"Salted water & the float test": ["entremetier", "poissonnier"],  // SPLIT per poissonnier audit, the fix that saves the fish station. It is the guide's only home for POACHING and court-bouillon, tagged semester 9 'Sea
	"Salting to draw the water out": ["entremetier", "garde-manger"],  // SPLIT per garde-manger audit: same 'Brining: Wet, Dry & Cures' anchor as the two cures everyone agrees are cold-kitchen, and tzatziki, raita, horiatik
	"Sautéing & the shallow fry": ["saucier"],  // Unanimous. Declined the entremetier audit's addition: the guide's own brigade entry reads 'SAUCIER (sauces/sautés)', and the guide's text outranks an 
	"Scoring": ["patissier"],  // Contested. Rotisseur audit struck the fire half: the query is literally 'scoring bread dough technique', the anchor is Proofing/Oven Spring, and one g
	"Searing: the hard crust": ["saucier"],  // Unanimous. The pan sear, then deglaze; grill searing lives under Grilling.
	"Shaping by hand": ["patissier"],  // Contested, and the one place two audits collided. Garde-manger's audit disowned it: of 43 recipes not one is a salad, terrine or charcuterie item, an
	"Shucking shellfish": ["poissonnier"],  // Contested. Both the poissonnier and garde-manger audits struck the cold half: all 8 recipes cook the shellfish, and the guide's only raw shellfish dis
	"Skimming: foam, fat and a clear broth": ["entremetier", "saucier"],  // SPLIT per saucier audit: the anchor is 'Consommé & Clarification', the soup cook's exam, but sauce-veloute and sauce-espagnole-and-demi-glace sit in
	"Soaking dried goods back to life": ["entremetier"],  // Unanimous. Declined the pastry audit's addition; it flagged that one as its own weakest.
	"Sourdough starter": ["patissier"],  // Unanimous.
	"Steaming: basket, leaf and lid": ["entremetier", "poissonnier"],  // SPLIT per two audits, and only one lens caught it. The definition names both halves, 'Cantonese fish, dim sum, couscous, tamales' plus EN PAPILLOTE,
	"Straining & passing through a sieve": ["patissier", "saucier"],  // SPLIT. The entremetier audit struck the veg claim (one line about potatoes) and named both real owners: chinois on demi-glace and gravy for the saucie
	"Sugar stages & caramel": ["patissier", "saucier"],  // SPLIT per two audits. Its ONLY semester tag is 4, 'The Braise', not Pastry Fundamentals, and five of sixteen recipes are savoury caramel bases (ca-kho
	"Sushi rice & rolling": ["garde-manger"],  // Contested. Unanimous across lenses; I declined the garde-manger audit's own offer of an entremetier half: three recipes, all cold assembly, and the s
	"Tadka: blooming spices in fat": ["saucier"],  // Unanimous. A finishing sauce poured at the pass.
	"Tandoor breads": ["patissier", "rotisseur"],  // SPLIT per two audits: three of four recipes are meat in the clay oven (tandoori chicken, tikka masala, nihari) and only garlic-naan is dough. The fire
	"Tempering a custard": ["patissier"],  // Contested. Saucier audit struck it: 18 of 21 recipes are pastry, half the definition is chocolate tempering, and the saucier's real share of this skil
	"The bare simmer: holding liquid below the boil": ["entremetier", "saucier"],  // SPLIT. The entremetier audit called its absence the worst hole on the board: it is the only technique in all 103 whose definition names the poaching 
	"The broiler: heat from above": ["rotisseur"],  // Unanimous.
	"The brûlée torch": ["patissier"],  // Unanimous.
	"The coat before the fry: dredge, crumb, batter": ["rotisseur", "saucier"],  // SPLIT, and the saucier half was a hole all three lenses missed. Semester 3 is 'The Sauté Station & Pan Sauces' and the list opens chicken-piccata, sol
	"The molcajete": ["garde-manger"],  // Contested. Saucier audit struck it: three recipes, all cold table salsas that never see a pan. Same mortar as 'Pounding a curry paste', different next
	"The pretzel bath": ["patissier"],  // Unanimous.
	"The seafood boil": ["poissonnier"],  // Unanimous.
	"The tagine": ["saucier"],  // Unanimous. An unusual pot; the technique is a ragoût.
	"The water bath": ["patissier"],  // Contested. Saucier audit struck it: its only semester tag is 6, Pastry Fundamentals, five of seven recipes are pastry, and its single sauce recipe is 
	"The wobble & the skewer: testing a bake": ["patissier"],  // Unanimous.
	"Tortillas on the comal": ["entremetier"],  // Unanimous.
	"Mole": ["saucier"],  // New with the Oaxacan chapter. Contested only on scale: a mole negro is a day of work and thirty ingredients, but the shape of it is a sauce built on toasted aromatics, fried in fat and then let down with stock, which is saucier work in any kitchen.
	"Trussing": ["rotisseur"],  // Contested. Garde-manger audit struck it: one recipe, pollo-a-la-brasa, a spit-roasted chicken, and the definition's stated purpose is even cooking, w
	"Whipping a meringue": ["patissier"],  // Unanimous.
	"Wok technique": ["saucier"],  // Contested. Judged by the work, not the wok: extreme-heat sauté in small batches with sauce poured down the hot wall. The wok cook is the saucier of th
	"Velveting": ["saucier"],  // New with the Cantonese chapter. It is the prep that makes wok technique possible, a starch and egg-white coat set in warm oil or water so the protein cannot wring itself out at 200C, and it belongs to whoever owns the wok.
	"Working with masa": ["entremetier"],  // Unanimous. Nixtamalised corn is a component of hot dishes made fresh daily by the cook serving them.
};

/**
 * @param {Array<{ slug: string, term: string, definition: string }>} lexicon
 * @param {Array<{ label: string, recipes: string[] }>} techniques
 */
export function buildStations(lexicon, techniques) {
	/** @type {string[]} */
	const problems = [];
	const entry = lexicon.find((e) => e.slug === BRIGADE_ANCHOR);
	if (!entry) {
		problems.push(`stations: no lexicon entry "${BRIGADE_ANCHOR}": the stations are its own`);
		return { stations: null, problems };
	}

	/* ---- every station is one the guide names ---------------------------- */
	for (const s of STATIONS) {
		if (!entry.definition.includes(s.evidence)) {
			problems.push(
				`stations: the brigade entry no longer describes ${s.name} as ${JSON.stringify(s.evidence)}; ` +
					'the station list is the guide\'s, not ours'
			);
		}
	}
	if (!entry.definition.includes(TOURNANT_EVIDENCE)) {
		problems.push('stations: the tournant has gone from the guide; the board cannot name one');
	}

	/* ---- the map covers the spine, forward and in reverse ---------------- */
	const known = new Set(STATIONS.map((s) => s.key));
	const labels = new Set(techniques.map((t) => t.label));

	for (const [label, keys] of Object.entries(STATION_MAP)) {
		if (!labels.has(label)) {
			problems.push(`stations: "${label}" is mapped but is not a technique in the spine`);
		}
		if (!keys.length) problems.push(`stations: "${label}" is mapped to no station`);
		for (const k of keys) {
			if (!known.has(k)) problems.push(`stations: "${label}" is mapped to unknown station "${k}"`);
		}
	}

	/* ---- the two exclusions, each gated on what made it one -------------- */
	const byLabel = new Map(techniques.map((t) => [t.label, t]));
	for (const [label, recipes] of Object.entries(UNDRILLED)) {
		const t = byLabel.get(label);
		if (!t) {
			problems.push(`stations: "${label}" is listed as undrilled but is not a technique`);
			continue;
		}
		const same =
			t.recipes.length === recipes.length && recipes.every((r) => t.recipes.includes(r));
		if (!same) {
			problems.push(
				`stations: "${label}" was excluded because its only recipe does not drill it, and its ` +
					`recipe list has changed (${t.recipes.join(', ')}): re-make the judgement rather than ` +
					'leaving a real technique uncounted'
			);
		}
	}
	for (const [label, { min }] of Object.entries(FOUNDATION)) {
		const t = byLabel.get(label);
		if (!t) {
			problems.push(`stations: "${label}" is listed as foundational but is not a technique`);
			continue;
		}
		if (t.recipes.length < min) {
			problems.push(
				`stations: "${label}" is treated as cross-station literacy because it is everywhere, and it ` +
					`is now down to ${t.recipes.length} recipes (floor ${min}); it may belong to a station now`
			);
		}
	}

	// The reverse check. A technique nobody accounts for is a hole in the board:
	// it can be cooked and credited to nothing.
	const accounted = new Set([
		...Object.keys(STATION_MAP),
		...Object.keys(UNDRILLED),
		...Object.keys(FOUNDATION)
	]);
	const orphans = techniques.filter((t) => !accounted.has(t.label)).map((t) => t.label);
	if (orphans.length) {
		problems.push(
			`stations: ${orphans.length} technique(s) are accounted for nowhere: ` +
				orphans.slice(0, 5).join(', ')
		);
	}

	/* ---- and no station is empty ----------------------------------------- */
	const stations = STATIONS.map((s) => ({
		key: s.key,
		name: s.label,
		techniques: Object.entries(STATION_MAP)
			.filter(([, keys]) => keys.includes(s.key))
			.map(([label]) => label)
			.sort()
	}));
	for (const s of stations) {
		if (!s.techniques.length) {
			problems.push(`stations: ${s.name} owns no technique: a station nobody can cover is not a station`);
		}
	}

	const recipeCount = new Map(techniques.map((t) => [t.label, t.recipes.length]));
	console.log(
		'  stations: ' +
			stations.map((s) => `${s.name} ${s.techniques.length}`).join(', ')
	);

	return {
		stations: {
			stations,
			// Dishes per station, so a page can say how much of the book a station
			// actually touches without loading the technique file.
			dishes: Object.fromEntries(
				stations.map((s) => [
					s.key,
					s.techniques.reduce((n, t) => n + (recipeCount.get(t) ?? 0), 0)
				])
			),
			tournant: TOURNANT_EVIDENCE,
			foundation: Object.keys(FOUNDATION),
			undrilled: Object.keys(UNDRILLED)
		},
		problems
	};
}
