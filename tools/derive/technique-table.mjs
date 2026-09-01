/**
 * technique-table.mjs: the supplemental technique table, and the Lexicon anchors.
 *
 * ## Why a supplement instead of editing the table
 *
 * `raw/TECH.json` is lifted from the archived original and is deep round-trip
 * gated by verify:data; editing it would break the proof that the extraction is
 * lossless. So the original's 75 entries stay untouched and improvements are
 * *appended* here, where they read as a reviewable diff of intent rather than as
 * a mutation of the ground truth.
 *
 * ## What the original's table is, and what it is not
 *
 * It is a good table of DISHES: Khachapuri shaping, Arepas, Pierogi, Injera.
 * It is nearly silent on the FOUNDATIONS every recipe actually demonstrates:
 * searing, roasting, steaming, blanching, sweating, pickling, proofing. That is
 * why it tagged only 401 of 970 recipes, why 569 carried no technique at all,
 * and why Rhode Island had not one tagged recipe in the entire chapter.
 *
 * ## The Lexicon already wrote the definitions
 *
 * The guide carries 45 hand-written technique definitions: 33 under
 * "Techniques: Heat & Precision" and "Techniques: Knife & Prep", 12 more under
 * "Baking & Pastry Science". They are excellent, and until now they reached
 * almost nothing: crosslinks.mjs caps a term at 3 recipes (inherited from the
 * original's `hits.length < 3`), so "Braising & Stewing" linked to ONE recipe
 * while 35 recipes braise. All 33 technique terms together reached 72 of 970.
 *
 * The cap is right for a definition card's inline "see also" list. It is wrong
 * as the only mapping. So LEXICON_ANCHOR below marries the two systems: the
 * keyword table decides WHICH recipes demonstrate a technique, and the Lexicon
 * supplies the prose that explains it. A technique page is that pairing.
 *
 * An anchor is a human ruling. It is here, in source, and not inferred by string
 * similarity, because "Tempering a custard" and "Tempering chocolate" are one
 * word apart and anchor to different halves of the same Lexicon entry, and no
 * matcher gets that right by accident.
 */

/**
 * Supplemental entries, same shape as raw/TECH.json:
 *   k: lowercase substring keywords, matched against the method-anchored blob
 *   l: the user-facing label (sentence case, no trailing period)
 *   q: a YouTube search for studying the technique on film
 *
 * Filled by the widening pass; see tools/report-techniques.mjs for the ledger.
 */
export const SUPPLEMENT = [
	/* The extracted table matches 'pleat the', 'pleating' and 'pleated', which
	   between them caught one recipe: a christmas pudding, where the pleat is
	   the parchment lid on a steamed basin. A cook shaping a jiaozi writes
	   "pleat one side only" or "16 to 18 pleats". This entry is what lets the
	   Dumpling Atlas be seen, and the extracted half stays untouched. */
	{
		/* Bare 'pleats' is gone. It caught the parchment, not the dumpling: a
		   Basque cheesecake "lined with two rough sheets of parchment, pleats,
		   wrinkles and all", a galette folded "in loose pleats", a papillote
		   "crimped in small overlapping pleats" — and Zhong Shui Jiao, which IS
		   a dumpling and says "a plain half moon with NO pleats". All four were
		   graded on dumpling sealing, so the cheesecake page ended with five
		   marks about filling escaping into cloudy water.

		   The replacements name the hand doing it. 'pleats around' keeps Xiao
		   Long Bao, whose line is "gather 16 to 18 pleats around the rim". */
		k: ['pleat one', 'pleat all', 'pleat three', 'pleat 8', 'pleat 6',
			'gather the rim', 'pleats around', 'pleat the wrapper'],
		l: 'Pleating dumplings',
		q: 'dumpling pleating technique jiaozi fold'
	},
	/* The extracted table has a 'Tempering chocolate' entry and it has never
	   fired once, because its keys are 'temper the chocolate' and 'tempered
	   chocolate' and the corpus's only tempering recipe is called "Tempered
	   DARK Chocolate by Seeding". One word in the middle, and a whole technique
	   sat unreachable while its recipe was graded on steaming instead.

	   Both keys hit that recipe and nothing else in 1710. 'couverture' is safe
	   to add on its own terms: a recipe that names it is working with real
	   tempering chocolate. */
	{
		k: ['tempered dark chocolate', 'couverture'],
		l: 'Tempering chocolate',
		q: 'chocolate tempering seeding method couverture'
	},
	// ── dry heat ─────────────────────────────────────────────────────────────
	{
		k: ['sear', 'brown the meat', 'brown the meats', 'brown meat', 'brown the beef', 'brown lamb', 'brown the chicken', 'brown the pork', 'brown all sides', 'brown all over', 'browned hard', 'brown hard', 'until crusted', 'in batches, browning'],
		l: 'Searing: the hard crust',
		q: 'searing technique crust dry pan'
	},
	{
		k: ['roast at ', 'and roast ', '. roast ', 'roasted until', 'roast slowly', 'roast the ', 'roasting juices'],
		l: 'Roasting in a hot oven',
		q: 'roasting technique oven temperature'
	},
	{
		k: ['grill over', 'grill the', 'grill hot', 'grill directly', 'grill skewers', 'the grill', 'grill pan', 'grill grate', 'chargrilled', 'charcoal bed', 'hot coals', 'medium coals', 'over coals', 'the coals', 'embers', 'parrilla', 'over the fire', 'braai'],
		l: 'Grilling over live coals',
		q: 'grilling over charcoal two zone technique'
	},
	{
		k: ['char the ', 'char corn', 'char tomatillos', 'dry-char', 'until blackened', 'blackened all over', 'blistered black', 'over the open flame', 'directly over flame', 'directly on flame', 'char onion', 'char poblanos', 'charred whole', 'charred over', 'charred and blend'],
		l: 'Charring over open flame',
		q: 'charring vegetables chilies over flame technique'
	},
	{ k: ['broil'], l: 'The broiler: heat from above', q: 'broiler technique top down heat' },
	{ k: ['griddle', 'plancha'], l: 'Griddle & plancha work', q: 'griddle plancha flat top technique' },
	{
		k: ['dry-toast', 'toast spices', 'toast chilies', 'toast the dried chile', 'toast the nuts', 'toast the hazelnuts', 'toast the walnuts', 'toast the sesame', 'toast peanuts', 'toast the pepper', 'toasted and ground', 'in a dry pan until', 'toasted ground rice', 'lightly toasted'],
		l: 'Dry-pan toasting: spices, seeds and nuts',
		q: 'toasting spices dry pan technique'
	},

	// ── fat ──────────────────────────────────────────────────────────────────
	{
		k: ['sweat the', 'sweat onion', 'sweat vegetables', 'sweated', 'sweat leeks', 'sweat shallots', 'sweat until', 'without color', 'soften onion', 'soften the onion', 'soften peppers', 'soften vegetables'],
		l: 'Sweating aromatics: soft, never browned',
		q: 'sweating aromatics technique without colour'
	},
	{
		k: ['saut', 'shallow-fry', 'shallow fry', 'pan-fry', 'pan-fried', 'fry in butter', 'in a little butter', 'in a little oil'],
		l: 'Sautéing & the shallow fry',
		q: 'sauteing shallow frying technique'
	},
	{
		k: ['render the ', 'render bacon', 'render lardons', 'render pancetta', 'rendered fat', 'the fat renders', 'rendered crisp', 'until it renders', 'has rendered', 'in the bacon fat', 'in the drippings', 'in the rendered'],
		l: 'Rendering fat: and cooking in what runs out',
		q: 'rendering fat bacon lardons technique'
	},
	{
		k: ['dredge', 'dredging', 'double-breaded', 'dust in flour', 'coat in flour', 'press the crumb', 'in the batter', 'for breading', 'beer batter'],
		l: 'The coat before the fry: dredge, crumb, batter',
		q: 'breading dredging standard breading procedure'
	},
	{
		k: ['drain on a rack', 'never paper', 'drain upright'],
		l: 'Draining fried food: a rack, never paper',
		q: 'draining fried food rack technique crisp'
	},
	{
		k: ['fry the paste', 'fry the salsa', 'fry the purée', 'fried paste', 'fry the rempah', 'sofrito', 'the oil rises', 'the fat rises', 'until it darkens'],
		l: 'Frying the paste until the oil splits',
		q: 'frying curry paste sofrito until oil separates'
	},

	// ── water, steam and stock ───────────────────────────────────────────────
	{
		k: ['steam ', 'steamer', 'steam-', 'steam.', 'steam,', 'and steamed'],
		l: 'Steaming: basket, leaf and lid',
		q: 'steaming technique basket en papillote'
	},
	{
		k: ['poach', 'never boil', 'bare simmer', 'barely simmer', 'at a whisper', 'lazy bubbles'],
		l: 'The bare simmer: holding liquid below the boil',
		q: 'poaching simmering temperature technique'
	},
	{
		k: ['salted water', 'they float', 'rolling boil', 'boil hard', 'hard boil'],
		l: 'Salted water & the float test',
		q: 'boiling in salted water float test technique'
	},
	{
		k: ['blanch', 'into ice water', 'into iced water', ' ice bath', 'shock ', 'shocked'],
		l: 'Blanching & shocking',
		q: 'blanch and shock technique ice bath'
	},
	{
		k: ['strain the', 'strain into', 'strain through', 'strain and', 'strained', 'through a sieve', 'cheesecloth', 'fine-mesh'],
		l: 'Straining & passing through a sieve',
		q: 'straining chinois sieve technique'
	},
	{
		k: ['skim the', 'skimming', 'skim,', 'skimmed'],
		l: 'Skimming: foam, fat and a clear broth',
		q: 'skimming stock foam technique clear broth'
	},
	{
		k: ['keep the broth', 'keep the stock', 'the liquor', 'keep every drop', 'pot likker', 'the poaching liquid', 'poaching liquor', 'return the broth'],
		l: 'Keeping the cooking liquid',
		q: 'save the cooking liquid broth technique'
	},
	{
		k: ['soaked overnight', 'rehydrat', 'soaked pliable', 'soaked in warm water', 'soak in hot water', 'soak the dried'],
		l: 'Soaking dried goods back to life',
		q: 'rehydrating dried chilies mushrooms technique'
	},

	// ── time, salt and cold ──────────────────────────────────────────────────
	{ k: ['marinate', 'marinade'], l: 'Marinating: acid, salt and time', q: 'marinating technique acid salt time' },
	{
		k: ['squeezed dry', 'grated and squeezed', 'squeeze in a towel', 'drain in a colander', 'squeezed bone-dry', 'squeeze the salted', 'salt the tomatoes', 'salt the slices', 'salt the grated cucumber', 'salt the cabbage', 'salt eggplant', 'salted cabbage'],
		l: 'Salting to draw the water out',
		q: 'salting vegetables to draw out water technique'
	},
	{
		k: ['chill until firm', 'chill on a tray', 'chill firm', 'chill to firm', 'chill for slicing', 'chill before slicing', 'for thin slicing', 'chill 30 min', 'chill 20 min'],
		l: 'Chilling to firm: the fridge as binder',
		q: 'chilling dough firm before slicing technique'
	},
	{
		k: ['rest overnight', 'overnight in the fridge', 'flavors marry', 'rest a day', 'better the next day', 'better after a night', 'flavors meld', 'flavors to meld'],
		l: 'The overnight rest: letting a dish marry',
		q: 'why stews taste better the next day'
	},
	// Macerating was measured and cut: "macerat" plus six phrasings reached 5
	// recipes in the whole corpus. A real skill, but not one this guide teaches
	// often enough to earn a page.

	// ── knife, hand and finish ───────────────────────────────────────────────
	{
		k: ['fine dice', 'small dice', 'diced fine', 'diced small', 'cm dice', 'julienne', 'matchstick', 'batons', 'half-moon', 'sliced paper-thin', 'slice paper-thin', 'shaved thin', 'on the bias', 'into coins'],
		l: 'Knife cuts: dice, julienne, bias',
		q: 'classical knife cuts brunoise julienne technique'
	},
	{
		k: [' mash ', 'mashing', 'mash.', 'mash,', 'food mill', 'the purée', 'pureed', 'puree to', 'press through', 'blend silky'],
		l: 'Mashing & puréeing',
		q: 'mashing pureeing food mill technique'
	},
	{
		k: ['against the grain', 'across the grain', 'rest the meat', 'rest, slice', 'then slice', 'shingle'],
		l: 'Resting meat & slicing against the grain',
		q: 'resting meat slicing against the grain technique'
	},
	{
		k: ['wet hands', 'roll into balls', 'shape into', 'form into', 'pat into', 'flatten into', 'roll into'],
		l: 'Shaping by hand',
		q: 'shaping by hand meatballs koftas technique'
	},

	// ── bakery and pastry ────────────────────────────────────────────────────
	{
		k: [' proof ', 'until doubled', 'rise 1', 'rise 90 min', 'rise 45 min', 'rise 40 min', 'rise 30 min', 'rise, covered', 'rise in a warm place', 'until puffy', 'until it crowns'],
		l: 'Proofing: the rise before the oven',
		q: 'proofing dough oven spring technique'
	},
	{
		k: ['rest the dough', 'rest the batter', 'dough; rest', 'dough, rest', 'dough. rest', 'dough and rest', 'dough. chill', 'dough and chill', 'batter. rest', 'autolyse'],
		l: 'Resting dough: the pause that does the work',
		q: 'resting dough autolyse gluten relax technique'
	},
	{
		k: ['cream the butter', 'cream butter and', 'cream butter,', 'alternate the dry', 'alternate dry'],
		l: 'Creaming butter & sugar',
		q: 'creaming butter sugar cake structure technique'
	},
	{
		k: ['fold in the flour', 'fold in flour', 'fold flour', 'fold in the dry', 'fold in dry', 'fold in the sifted', 'fold in gently', 'fold in whipped', 'fold in the whipped', 'until just combined'],
		l: 'Folding: keeping the air in',
		q: 'folding batter technique keep air'
	},
	{
		k: ['rub the flour', 'rub butter into', 'rub the crumb', 'rub the topping', 'are pea-sized', 'until pea-sized', 'cut in the cold butter', 'cut the cold', 'cut in the lard', 'butter into the flour', 'visible butter', 'grated frozen butter', 'to coarse crumbs', 'to fine crumbs', 'coarse pebbles'],
		l: 'Rubbing fat into flour',
		q: 'rubbing in method pastry pea sized butter'
	},
	{
		k: ['brush with egg', 'yolk wash', 'brush with melted butter', 'brush the hot loaf', 'egg wash;', 'egg wash twice', 'egg wash, coarse', 'egg wash, pearl'],
		l: 'Egg wash & the baker’s shine',
		q: 'egg wash bakery shine technique'
	},
	{
		k: ['wobble', 'jiggle', 'barely trembles', 'faint tremble', 'with a tremble', 'still sways', 'skewer comes', 'the tester', 'hollow-sounding', 'hollow knock', 'sound hollow', 'spring back', 'until springy'],
		l: 'The wobble & the skewer: testing a bake',
		q: 'how to tell when a bake is done technique'
	},
	{
		k: ['for the icing', 'for the frosting', 'cheese frosting', 'white frosting', 'buttercream', 'icing over', 'icing should', 'pipe rosettes'],
		l: 'Icing & frosting',
		q: 'frosting buttercream finishing a cake technique'
	}
];

/**
 * Technique label -> the Lexicon term slug that defines it.
 *
 * Only where the Lexicon genuinely explains that skill. A dish-specific label
 * with no matching definition (Pierogi, Mole, Khachapuri shaping) is left
 * unanchored on purpose: its page shows the recipes and no borrowed prose.
 * Several labels share an anchor, which is correct: Jerk, Asado fire and
 * Low & slow smoking are three fires and one doctrine.
 */
export const LEXICON_ANCHOR = {
	// ── the classical spine ──────────────────────────────────────────────────
	Braising: 'braising-and-stewing',
	'Deep frying': 'deep-and-shallow-frying',
	Fermentation: 'fermentation-and-pickling',
	'Brining & curing': 'brining-wet-dry-and-cures',
	'Curing gravlax': 'brining-wet-dry-and-cures',
	'Making a roux': 'roux-slurry-and-liaison',
	'Béchamel: the mother sauce': 'roux-slurry-and-liaison',
	'Reducing a sauce': 'reduction-nappe-and-mounting',
	'Beurre blanc': 'reduction-nappe-and-mounting',
	'Building an emulsion': 'emulsions',
	Hollandaise: 'emulsions',
	'Deglazing & pan sauces': 'deglaze-and-fond',
	'Caramelizing onions': 'sweat-vs-saute-vs-sear',
	'The seafood boil': 'poach-simmer-boil',
	'Poaching eggs': 'poach-simmer-boil',

	// ── fire ─────────────────────────────────────────────────────────────────
	'Low & slow smoking': 'grilling-vs-barbecue-vs-smoking',
	Jerk: 'grilling-vs-barbecue-vs-smoking',
	'Asado fire': 'grilling-vs-barbecue-vs-smoking',
	'Wok technique': 'wok-hei-and-stir-fry-discipline',
	Flambé: 'the-kitchen-torch',
	'The brûlée torch': 'the-kitchen-torch',

	// ── stock and broth ──────────────────────────────────────────────────────
	Dashi: 'stocks-blanc-brun-broth-and-demi',
	'Ramen broth': 'stocks-blanc-brun-broth-and-demi',

	// ── dough ────────────────────────────────────────────────────────────────
	'Kneading dough': 'gluten-and-hydration',
	'Fresh pasta': 'gluten-and-hydration',
	'Hand-pulled noodles': 'gluten-and-hydration',
	Lamination: 'lamination',
	'Letter-folding dough': 'lamination',
	'Sourdough starter': 'fermentation-in-bread-yeast-levain-preferments',
	Scoring: 'proofing-oven-spring-and-the-crumb',
	'Pie crust & blind baking': 'blind-baking-and-pie-doctrine',

	// ── pastry ───────────────────────────────────────────────────────────────
	'Whipping a meringue': 'meringues-french-swiss-italian',
	'The soufflé': 'creaming-foaming-and-cake-structure',
	'Tempering a custard': 'tempering-eggs-and-chocolate',
	'Tempering chocolate': 'tempering-eggs-and-chocolate',
	'Sugar stages & caramel': 'caramel-stages-and-sugar-work',
	'Churning ice cream': 'frozen-dessert-machines-churners-and-pacojet',

	// ── knife and butchery ───────────────────────────────────────────────────
	'Butchery basics': 'butchery-verbs-frenching-butterflying-tying',
	Trussing: 'butchery-verbs-frenching-butterflying-tying',
	'Filleting fish': 'boning-fillet-and-the-butchery-blades',

	// ── vessels and tools ────────────────────────────────────────────────────
	'The tagine': 'clay-and-earthenware-tagine-donabe-cazuela',
	'Tortillas on the comal': 'comal-plancha-and-griddles',
	Arepas: 'comal-plancha-and-griddles',
	'The molcajete': 'mortar-and-pestle-molcajete-suribachi-granite',
	'Pounding a curry paste': 'mortar-and-pestle-molcajete-suribachi-granite',

	// ── the rest ─────────────────────────────────────────────────────────────
	Velveting: 'velveting-and-marinades',
	'Tadka: blooming spices in fat': 'infusion-steeping-flavor-into-fat-cream-and-syrup',
	Falafel: 'deep-and-shallow-frying',
	Churros: 'deep-and-shallow-frying',
	Injera: 'fermentation-and-pickling',

	// ── the supplement ───────────────────────────────────────────────────────
	'Searing: the hard crust': 'searing-and-pan-technique',
	'Roasting in a hot oven': 'roasting-baking-and-carryover',
	'Grilling over live coals': 'grilling-vs-barbecue-vs-smoking',
	'Charring over open flame': 'the-maillard-reaction',
	'The broiler: heat from above': 'salamander-broiler-and-top-down-fire',
	'Griddle & plancha work': 'comal-plancha-and-griddles',
	'Dry-pan toasting: spices, seeds and nuts': 'toasting-nuts-seeds-grains-and-coconut',
	'Sweating aromatics: soft, never browned': 'sweat-vs-saute-vs-sear',
	'Sautéing & the shallow fry': 'sweat-vs-saute-vs-sear',
	'The coat before the fry: dredge, crumb, batter': 'deep-and-shallow-frying',
	'Draining fried food: a rack, never paper': 'fryer-setups-and-oil-management',
	'Steaming: basket, leaf and lid': 'steaming-and-en-papillote',
	'The bare simmer: holding liquid below the boil': 'poach-simmer-boil',
	'Salted water & the float test': 'poach-simmer-boil',
	'Blanching & shocking': 'blanch-and-shock',
	'Straining & passing through a sieve': 'sieves-chinois-tamis-and-food-mill',
	'Skimming: foam, fat and a clear broth': 'consomme-and-clarification',
	'Keeping the cooking liquid': 'stocks-blanc-brun-broth-and-demi',
	'Marinating: acid, salt and time': 'velveting-and-marinades',
	'Salting to draw the water out': 'brining-wet-dry-and-cures',
	'The overnight rest: letting a dish marry': 'the-second-day-reheating-as-technique',
	'Knife cuts: dice, julienne, bias': 'knife-cuts-the-classical-ladder',
	'Mashing & puréeing': 'blenders-immersion-high-speed-and-food-processor',
	'Resting meat & slicing against the grain': 'resting-carryover-and-the-thermometer',
	'Proofing: the rise before the oven': 'proofing-oven-spring-and-the-crumb',
	'Resting dough: the pause that does the work': 'gluten-and-hydration',
	'Creaming butter & sugar': 'creaming-foaming-and-cake-structure',
	'Folding: keeping the air in': 'creaming-foaming-and-cake-structure',
	'Rubbing fat into flour': 'blind-baking-and-pie-doctrine',
	'Egg wash & the baker’s shine': 'baste-arroser-and-glaze',
	'The wobble & the skewer: testing a bake': 'doneness-by-touch-sight-and-sound'
};

/**
 * The table the tagger actually runs: the original's entries first, in their
 * original order, then the supplement.
 *
 * Order matters to deriveFilms, which slices the first one or two hits into
 * film links: keeping the original entries first means a recipe that already
 * had film links keeps exactly the ones it had.
 */
import { TAGGING_PASS } from './tagging-pass.mjs';

export function fullTechTable(TECH) {
	/* Merged by label, not concatenated. A SUPPLEMENT entry that repeats an
	   extracted label is WIDENING it: raw/TECH.json is proved against the sealed
	   original, so a keyword list that turned out too narrow has to be extended
	   from this side. Two entries for one technique would otherwise collide on
	   the slug, which the build rightly refuses. */
	const byLabel = new Map();
	for (const t of [...TECH, ...SUPPLEMENT, ...TAGGING_PASS]) {
		const prev = byLabel.get(t.l);
		if (prev) prev.k = [...new Set([...prev.k, ...t.k])];
		else byLabel.set(t.l, { ...t, k: [...t.k] });
	}
	return [...byLabel.values()];
}
