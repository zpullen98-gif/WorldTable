/**
 * Dietary flags, derived from ingredient keywords.
 *
 * The original had exactly one dietary fact: a hand-authored `v` boolean. That
 * is 970 rows of ground truth nobody had to create, so the build asserts our
 * derived `vegetarian` against it and fails on any unexplained disagreement.
 * Every disagreement is either a hole in these tables or a mistake in the source
 * data, and both are worth seeing.
 *
 * Matching is done on the NARROW blob (name + ingredients), not the full text.
 * Method steps and the "from the pass" note are prose: a note explaining that a
 * dish is "usually served with lamb" must not make the dish contain lamb.
 *
 * Word-boundary matching throughout: a substring test makes "butter" match
 * "butterfly the chicken", "ham" match "hamburger bun", and "crab" match
 * "crabapple".
 */

const MEAT = [
	'beef', 'veal', 'lamb', 'mutton', 'goat', 'pork', 'ham', 'bacon', 'pancetta',
	'prosciutto', 'guanciale', 'lard', 'asiento', 'chorizo', 'chouriço', 'chourico',
	'salami', 'sausage', 'chicken', 'turkey', 'duck', 'goose', 'quail',
	'poussin', 'rabbit', 'venison', 'pheasant', 'partridge', 'squab',
	'bison', 'elk', 'moose', 'brisket', 'oxtail', 'steak', 'ribeye', 'sirloin',
	'chuck', 'short rib', 'pork belly', 'andouille', 'pepperoni',
	'mortadella', 'capicola', 'bratwurst', 'kielbasa', 'linguica', 'spam',
	'pastrami', 'corned beef', 'meat', 'meatball', 'mince', 'carnitas',
	'carne asada', 'carne', 'barbacoa', 'al pastor', 'hot dog', 'frankfurter',
	'ground beef', 'ground pork', 'ground lamb', 'schmaltz', 'suet', 'tallow',
	'foie gras', 'liver', 'sweetbread', 'tripe', 'marrow', 'giblet',
	'bone broth', 'beef stock', 'chicken stock', 'chicken broth', 'beef broth',
	'merguez', 'boerewors', 'jamón', 'jamon', 'iberico', 'ibérico', 'wagyu',
	'gelatin', 'gelatine', 'scrapple', 'goetta', 'livermush', 'knockwurst',
	'pork roll', 'burnt ends', 'jerky', 'backstrap', 'tri-tip', 'flank',
	'prime rib', 'pot roast', 'lardo', 'coppa', 'nduja', 'bresaola',
	'pulled pork', 'rib tip', 'pig', 'hock', 'trotter', 'chitterling',
	'bologna', 'braunschweiger', 'head cheese', 'sopressata', 'guanciale',
	// French and Basque words for meat the list already held in English.
	// 'lard' is here but word-boundary matching cannot reach inside 'lardons',
	// which is how a tarte flambee and a salade lyonnaise both read as meatless.
	// A stewing hen is a chicken. 'gallina' and 'hen' are how half the
	// Americas write it, and neither reached the table.
	'hen', 'stewing hen', 'gallina', 'cockerel', 'capon',
	'lardon', 'lardons', 'poitrine', 'magret', 'confit de canard', 'gesier',
	'gizzard', 'txuleta', 'chuleta', 'rib chop', 'presa', 'secreto', 'pluma',
	'boudin', 'saucisson', 'andouillette', 'jambon', 'graisse de canard',
	'duck fat', 'goose fat', 'ventreche'
];

const PORK = [
	'pork', 'ham', 'bacon', 'pancetta', 'prosciutto', 'guanciale', 'lard', 'asiento',
	'chorizo', 'salami', 'pepperoni', 'mortadella', 'capicola', 'bratwurst',
	'kielbasa', 'linguica', 'spam', 'andouille', 'pork belly', 'scrapple',
	'goetta', 'livermush', 'knockwurst', 'pork roll', 'jamón', 'jamon',
	'iberico', 'ibérico', 'lardo', 'speck', 'coppa', 'nduja'
];

const FISH = [
	'fish', 'anchovy', 'anchovies', 'salmon', 'tuna', 'cod', 'haddock', 'halibut',
	'snapper', 'branzino', 'sole', 'sea bass', 'tilapia', 'barramundi', 'trout',
	'mackerel', 'sardine', 'herring', 'bonito', 'katsuobushi',
	'bacalao', 'bacalhau', 'salt cod', 'fish sauce', 'nam pla', 'worcestershire',
	'bottarga', 'roe', 'caviar', 'tobiko', 'ikura', 'uni', 'eel', 'unagi',
	'dashi', 'niboshi', 'surimi', 'lox', 'gravlax', 'kipper', 'whitebait',
	'monkfish', 'swordfish', 'grouper', 'catfish', 'pollock', 'mahi',
	// Names that `\bfish\b` cannot reach from inside, and that carry no other
	// listed token: a recipe whose only fish word is one of these would ship
	// unflagged. All four are in the corpus today and all four are currently
	// caught by a second word in the same recipe, which is luck, not cover.
	'pompano', 'mullet', 'sablefish', 'stockfish',
	// Freshwater and regional names the US-state chapters lean on heavily.
	'walleye', 'whitefish', 'rockfish', 'striped bass', 'perch', 'pike',
	'bluefish', 'redfish', 'flounder', 'fluke', 'porgy', 'shad', 'smelt',
	// 'arctic char', never bare 'char'; that flagged char siu pork and
	// char kway teow as containing fish.
	'lake trout', 'arctic char', 'lake char', 'sturgeon', 'tilefish', 'wahoo', 'opah', 'escolar',
	'skate', 'ray', 'bass', 'crappie', 'bluegill', 'menhaden',
	// Japanese fish names. Sawara is Spanish mackerel and hamo is pike conger:
	// the table knew mackerel and eel, and neither word appears in either dish.
	// Only the unambiguous ones. 'saba' is mackerel in Japan and a banana in
	// the Philippines and Indonesia, and it flagged halo-halo and pisang
	// goreng as containing fish. 'aji' is a Peruvian chilli, 'buri' a
	// Philippine palm, 'tai' and 'ayu' are too short to be safe. All four
	// fish are already reachable by their English names, so the cost of
	// leaving them out is a synonym; the cost of keeping them was a dessert
	// labelled with an allergen it does not have.
	'sawara', 'hamo', 'hamachi', 'iwashi', 'kamasu', 'nodoguro', 'shirasu',
	'hotaru ika', 'kinmedai', 'shishamo',
	// Freshwater and northern European names. Swedish ansjovis is spice
	// cured SPRAT rather than anchovy, and the table knew neither word, so a
	// dish built on a tin of them declared no fish at all.
	'carp', 'ansjovis', 'sprat', 'sprats', 'brisling', 'saltfish', 'salt fish',
	'bacalhau', 'zander', 'tench', 'bream', 'burbot', 'vendace',
	// South African, West African and Australasian names. Every one of these
	// arrived with a chapter and none was in the table: a reader avoiding fish
	// would have been told a snoek braai contains none.
	'snoek', 'panla', 'koobi', 'kapenta', 'yellowtail kingfish', 'hoki',
	'kahawai', 'terakihi', 'tarakihi', 'kingklip', 'galjoen', 'maasbanker'
];

const SHELLFISH = [
	'shrimp', 'prawn', 'crab', 'lobster', 'crawfish', 'crayfish',
	'scallop', 'oyster', 'clam', 'mussel',
	'squid', 'calamari', 'octopus', 'cuttlefish', 'vongole',
	'shrimp paste', 'belacan', 'oyster sauce', 'langoustine', 'krill', 'polvo',
	// New England / Pacific Northwest shellfish the state chapters name directly.
	'geoduck', 'whelk', 'scungilli', 'conch', 'abalone', 'periwinkle',
	'quahog', 'littleneck', 'cherrystone', 'razor clam', 'cockle',
	'barnacle', 'sea urchin', 'crawdad', 'spot prawn', 'dungeness',
	// Maori, Pacific and Australian names for shellfish the table already knew
	// under other words: paua is abalone, kina is sea urchin, a Moreton Bay bug
	// is a slipper lobster, yeet is a fermented sea snail. Without these an
	// allergen line reads empty, which a reader takes to mean safe.
	'paua', 'p\u0101ua', 'kina', 'moreton bay bug', 'bay bug', 'balmain bug',
	'yeet', 'toheroa', 'pipi', 'tuatua', 'marron', 'yabby', 'moreton bay bugs'
];

const DAIRY = [
	'milk', 'cream', 'butter', 'buttermilk', 'yogurt', 'yoghurt', 'cheese',
	'parmesan', 'parmigiano', 'pecorino', 'mozzarella', 'ricotta', 'mascarpone',
	'gruyère', 'gruyere', 'cheddar', 'feta', 'halloumi', 'paneer', 'cotija',
	'crema', 'crème fraîche', 'creme fraiche', 'ghee', 'condensed milk',
	'evaporated milk', 'sour cream', 'clotted cream', 'queso', 'brie',
	'camembert', 'gorgonzola', 'stilton', 'manchego', 'provolone', 'burrata',
	'quark', 'skyr', 'kefir', 'custard', 'ice cream', 'double cream',
	/* Cheeses and cultured fats the table did not name, mostly outside western
	   Europe. A whole 400g farmhouse munster and 150g of Roquefort both cleared
	   dairy. 'niter kibbeh' is the spiced clarified butter under most of the
	   Ethiopian chapter and accounts for nine; 'samna' is its Egyptian
	   equivalent, 'smetana' Russian soured cream, 'kashk' Persian dried whey,
	   'ayib' Ethiopian curd cheese. Seven of these also wore a Vegan badge. */
	'roquefort', 'monterey jack', 'quesillo', 'munster', 'smetana',
	'caciocavallo', 'primosale', 'kashk', 'niter kibbeh', 'samna', 'ayib'
];

const EGG = ['egg', 'eggs', 'egg yolk', 'egg yolks', 'egg white', 'egg whites', 'mayonnaise', 'mayo', 'aioli', 'meringue', 'custard'];

const GLUTEN = [
	'flour', 'bread', 'breadcrumbs', 'panko', 'pasta', 'spaghetti', 'noodle',
	'noodles', 'tagliatelle', 'linguine', 'penne', 'rigatoni', 'orzo', 'couscous',
	'semolina', 'farro', 'barley', 'bulgur', 'seitan', 'soy sauce', 'wheat',
	// Bare 'soy' as an ingredient means soy sauce, which is wheat-brewed. The
	// corpus writes "4 tbsp soy" far more often than "soy sauce": 27 recipes
	// shipped containsGluten:false over an ingredient line naming it, and an
	// empty allergen list renders no "Contains" block at all, which reads as
	// "no allergens" rather than "we don't know". Whole soybeans are excepted.
	'soy', 'hoisin', 'kecap manis', 'gochujang', 'teriyaki', 'miso',
	'tortilla', 'pita', 'baguette', 'brioche', 'phyllo', 'filo', 'puff pastry',
	'pastry', 'cracker', 'crackers', 'beer', 'udon', 'ramen', 'somen', 'lasagne',
	'lasagna', 'gnocchi', 'dumpling wrappers', 'wonton', 'pierogi', 'roux',
	'malt', 'rye', 'sourdough', 'croissant', 'biscuit', 'cake flour',
	/* Named breads and shapes the table never learned. Each one was the ONLY
	   wheat word in its recipe, so the page rendered no Contains block at all
	   and the screen line read as clearance. 'farina' is Italian 00 flour and
	   accounts for seven on its own, all Emilia-Romagna pasta; 'savoiardi' is
	   the 24 sponge fingers under a tiramisu that listed dairy, egg and alcohol
	   and not the biscuit. 'digestive biscuit' is deliberately not bare
	   'digestive', which matches Feijoada's "the orange is digestive strategy". */
	'semola', 'grano duro', 'farina', 'macaroni', 'matzo', 'graham', 'bagel',
	'pretzel', 'hoagie', 'bolillo', 'birote', 'mantou', 'savoiardi',
	'kaiser roll', 'digestive biscuit'
];

const NUTS = [
	'almond', 'almonds', 'hazelnut', 'hazelnuts', 'walnut', 'walnuts', 'pecan',
	'pecans', 'pistachio', 'pistachios', 'cashew', 'cashews', 'macadamia',
	'pine nut', 'pine nuts', 'brazil nut', 'chestnut', 'chestnuts', 'praline',
	'marzipan', 'frangipane', 'nutella', 'peanut', 'peanuts', 'peanut butter'
];

const ALCOHOL = [
	'wine', 'red wine', 'white wine', 'beer', 'ale', 'stout', 'lager', 'brandy',
	'cognac', 'rum', 'whisky', 'whiskey', 'bourbon', 'vodka', 'gin', 'tequila',
	'mezcal', 'sherry', 'port', 'marsala', 'vermouth', 'sake', 'mirin',
	'liqueur', 'kirsch', 'amaretto', 'grand marnier', 'cointreau', 'champagne',
	'prosecco', 'cachaça', 'cachaca', 'pisco', 'shaoxing', 'soju', 'calvados',
	'bitters', 'campari', 'aperol', 'absinthe', 'schnapps', 'grappa',
	/* The table had 'wine' but no grape, no region and no regional spirit, so a
	   dish poached in 750ml of Beaujolais with creme de cassis printed nothing.
	   'awamori' is the Okinawan spirit in five dishes; 'vino seco' the Cuban
	   cooking wine in four.

	   'hard cider', never bare 'cider': about forty recipes use cider VINEGAR,
	   which is not alcohol, and the boundary matcher cannot tell them apart. */
	'burgundy', 'pinot noir', 'riesling', 'sylvaner', 'gamay', 'beaujolais',
	'txakoli', 'oloroso', 'amontillado', 'awamori', 'vino seco', 'ouzo',
	'pastis', 'armagnac', 'crème de cassis', 'guinness', 'hard cider'
];

/**
 * The rest of the statutory fourteen, screened at last.
 *
 * Same construction as FISH and SHELLFISH: names as the corpus writes them,
 * word-boundary matched. The direction of error is chosen deliberately:
 * "carries celery" costs ten seconds when wrong, so mirepoix flags celery and
 * mustard greens flag mustard, because the statutory categories are broad and
 * a guest who reacts does not care which part of the plant it was.
 *
 * SULPHITES ARE DELIBERATELY ABSENT and stay on the not-screened list: the
 * declaration threshold is a CONCENTRATION (10mg/kg), not an ingredient name,
 * and no ingredient line says how much metabisulphite the winemaker used. A
 * lexical rule would be the confident wrong answer: the exact shape the
 * hazard-rule survey measured and refused.
 */
const SESAME = [
	'sesame', 'tahini', 'benne', "za'atar", 'za\u2019atar', 'zaatar', 'gomashio',
	'halva', 'hummus', 'furikake'
];

const SOY = [
	'soy', 'soya', 'soybean', 'tofu', 'miso', 'tempeh', 'edamame', 'doenjang',
	'gochujang', 'hoisin', 'tamari', 'natto', 'kecap manis', 'teriyaki', 'yuba',
	'douchi', 'ssamjang'
];

/** A refinement of NUTS, because the statutory list separates them. */
const PEANUT = ['peanut', 'peanuts', 'groundnut', 'satay'];

const CELERY = ['celery', 'celeriac'];

const MUSTARD = ['mustard', 'dijon'];

/** A refinement of SHELLFISH: the molluscs alone, crustaceans excluded. */
const MOLLUSC = [
	'squid', 'calamari', 'octopus', 'cuttlefish', 'clam', 'mussel', 'oyster',
	'scallop', 'snail', 'escargot', 'abalone', 'whelk', 'conch', 'periwinkle',
	'geoduck', 'quahog', 'littleneck', 'cherrystone', 'razor clam', 'cockle',
	'scungilli', 'vongole', 'polvo', 'oyster sauce'
];

/**
 * Zero hits in this corpus today, and screened anyway: the claim "screened
 * for lupin, none found" is sound because lupin flour is always NAMED (there
 * is no dish that smuggles it the way dashi smuggles fish), which is what
 * separates this from the five hazard rules that were measured and refused.
 */
const LUPIN = ['lupin', 'lupini'];

/**
 * Honey is NOT an allergen, and is not on the screened list for that reason.
 * It is here because it is the one animal product the vegan expression could
 * not see: the word appeared nowhere in this file, so the gate written to catch
 * a false Vegan badge could not fire on it, and six recipes wore the badge over
 * their own ingredient line.
 *
 * Bare 'honey' only. 'honeycomb' was proposed and is refused: every occurrence
 * in this corpus is honeycomb TRIPE, a morel's honeycomb, or Idli batter, and
 * the right-hand word boundary already stops 'honey' reaching any of them.
 */
const HONEY = ['honey', 'bee pollen', 'royal jelly'];

/**
 * Vegetarian-safe exceptions. These strings contain a flagged keyword as a
 * substring but do not carry the animal product: without them "coconut milk"
 * reads as dairy, "vegetable stock" as meat stock, and "buttermilk substitute:
 * soy milk" as both.
 */
const EXCEPTIONS = [
	// dairy-shaped, not dairy
	'coconut milk', 'coconut cream', 'almond milk', 'soy milk', 'oat milk',
	'rice milk', 'cashew cream', 'peanut butter', 'almond butter', 'cocoa butter',
	// soy-shaped, not soy sauce: the bean itself carries no wheat
	'soybean', 'soybeans', 'soy bean', 'edamame', 'soy lecithin',
	'shea butter', 'apple butter', 'nut butter', 'tahini butter', 'butter lettuce',
	'butter bean', 'butter beans', 'buttercup', 'butternut', 'butterfly',
	'buttermilk substitute', 'cream of tartar', 'creamed corn', 'ice cream machine',
	'ice cream maker', 'cream soda',
	// meat-shaped, not meat
	'vegetable stock', 'vegetable broth', 'mushroom stock', 'chicken of the woods',
	'hamburger bun', 'hamburger buns', 'chickpea', 'chickpeas', 'beefsteak tomato',
	'beefsteak tomatoes', 'meaty mushroom', 'meat-free', 'meatless',
	// A marrow is a squash, and Hungarian tokfozelek is built on one. Bone
	// marrow is not, and the offal list catches that through 'bone', so only
	// the vegetable forms are masked here.
	'marrow squash', 'vegetable marrow', 'marrowfat pea', 'marrowfat peas',
	// Lamb's lettuce is mache, a salad leaf. So is lamb's ear.
	"lamb's lettuce", 'lambs lettuce', "lamb's ear", 'lambs ear',
	// Coconut meat is the flesh of a coconut. The MEAT list carries a bare
	// 'meat' for mince and meatballs, and it caught a watermelon drink.
	'coconut meat', 'coconut flesh', 'nut meat', 'meat of the coconut',
	// fish-shaped, not fish
	'fish-shaped', 'crabapple', 'crab apple', 'vegan fish sauce',
	// Shellfish-shaped, not shellfish. King oyster is a mushroom, and the
	// vegetable-led cooking that cuts its stem into rounds calls the result a
	// scallop because that is what it looks like on the plate.
	'king oyster', 'king oyster mushroom', 'king oyster mushrooms',
	'oyster mushroom', 'oyster mushrooms', 'mushroom scallop', 'mushroom scallops',
	'vegan scallop', 'vegan scallops', 'oyster sauce substitute',
	'king oyster scallop', 'king oyster scallops', 'oyster scallops',
	// Dashi is on the fish list because almost every dashi is bonito. These two
	// are the exceptions that define themselves by leaving it out.
	'kombu dashi', 'shojin dashi', 'shiitake dashi', 'vegetarian dashi',
	'vegan dashi', 'mushroom xo',
	// Place names. "Cape Cod Cranberry Relish" is a vegetarian dish that was
	// reading as fish purely because Cape Cod is named after the cod.
	'cape cod', 'cod cranberry', 'codfish ball',
	// "goat cheese" is not goat. Neither is head cheese, but that one IS meat,
	// so it stays out of this list.
	'goat cheese', 'goats cheese', "goat's cheese", 'goat curd',
	// Same shape, found when the corpus gained a Mexican cajeta and a Filipino
	// bibingka: the milk of an animal and the egg of a bird are not its meat,
	// and both recipes are vegetarian. The build caught them, which is what the
	// vegetarian gate is for.
	"goat's milk", 'goats milk', 'goat milk', 'duck egg', 'duck eggs',
	// egg-shaped, not egg
	'eggplant', 'eggplants', 'egg noodles'
];

const escape = (/** @type {string} */ s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Word-boundary matcher, tolerant of accents and of a trailing plural.
 *
 * The plural allowance is not cosmetic: without it "crab" fails to match
 * "24 live blue crabs" and "hot dog" fails to match "4 hot dogs", which is
 * exactly how Steamed Blue Crabs and the Seattle Dog were being reported as
 * vegetarian.
 */
/** @param {string[]} words */
function makeMatcher(words) {
	const alts = words
		.slice()
		.sort((/** @type {string} */ a, /** @type {string} */ b) => b.length - a.length)
		.map(escape)
		.join('|');
	return new RegExp(`(?<![\\p{L}])(?:${alts})(?:e?s)?(?![\\p{L}])`, 'iu');
}

const RE = {
	meat: makeMatcher(MEAT),
	pork: makeMatcher(PORK),
	fish: makeMatcher(FISH),
	shellfish: makeMatcher(SHELLFISH),
	dairy: makeMatcher(DAIRY),
	egg: makeMatcher(EGG),
	gluten: makeMatcher(GLUTEN),
	nuts: makeMatcher(NUTS),
	alcohol: makeMatcher(ALCOHOL),
	sesame: makeMatcher(SESAME),
	soy: makeMatcher(SOY),
	peanut: makeMatcher(PEANUT),
	celery: makeMatcher(CELERY),
	mustard: makeMatcher(MUSTARD),
	mollusc: makeMatcher(MOLLUSC),
	lupin: makeMatcher(LUPIN),
	honey: makeMatcher(HONEY)
};

const EXCEPTION_RE = makeMatcher(EXCEPTIONS);

/**
 * A denial is not a declaration.
 *
 * The corpus states four of these emphatically, because in each case the
 * absence IS the recipe, and the word-boundary matcher read every one of them
 * as the ingredient being present:
 *
 *   "there is NO flour, and there never was"   Tarta de Santiago, shipped
 *                                              containsGluten. It is a
 *                                              flourless almond cake, and the
 *                                              flag denied a coeliac the one
 *                                              dessert in the chapter they
 *                                              could safely eat.
 *   "A mountain of parsley; NO CHEESE"         Linguine alle Vongole, dairy.
 *   "NO honey in Turkish baklava"              Fistikli Baklava, honey.
 *   "No cream, no garlic, no onion"            Carbonara, which contains
 *                                              pecorino anyway, so the flag
 *                                              was right for the wrong reason.
 *
 * Deliberately narrow: only these words, and only directly after a denial. A
 * general rule would reach "no more than 2 tbsp butter", where the butter is
 * real. Anything it does not cover keeps the old behaviour, which errs towards
 * declaring, and that is the right direction to err in.
 */
const NEGATED =
	/\b(?:no|without|never any)\s+(?:cream|cheese|milk|butter|flour|honey|eggs?|wine|nuts?)\b/giu;

/** Blank out known-safe phrases before testing, so their substrings can't fire. */
/** @param {string} text */
function scrub(text) {
	return text.replace(NEGATED, ' ').replace(new RegExp(EXCEPTION_RE.source, 'giu'), ' ');
}

/**
 * Ingredient lines that only *offer* an animal product.
 *
 * The corpus consistently writes vegetarian-capable dishes as "1.2L hot chicken
 * or veg stock", "120g suet or cold grated butter", "20g katsuobushi (or skip
 * for vegan)", "Smoked salmon to serve". The authored `v` flag counts all of
 * these as vegetarian, and it is right to: the dish has a stated meatless path.
 *
 * So an animal keyword is only binding when its own line offers no way out.
 * This is checked per line rather than over the whole blob, because "or butter"
 * appearing in line 7 says nothing about the pork in line 2.
 */
/** Things a vegetarian alternative is actually made of. Trailing `s?` matters:
 *  without it "2 eggs per person, fried; or shredded chicken" has no recognised
 *  meatless side. */
const VEG_ALTERNATIVE =
	/\b(?:veg|vegan|vegetable|vegetarian|shortening|butter|oil|kombu|shiitake|mushroom|agar|tofu|olive|paprika|cream|stiffener|egg|dhal|dal|lentil|chickpea|bean|potato|paneer|cheese|asparagus|spinach|cabbage|rice|noodle|salad|fruit|nut)s?\b/i;

/**
 * The same idea for the VEGAN question, and a separate list rather than a flag
 * on the one above, because the two lists disagree about five words.
 *
 * VEG_ALTERNATIVE names butter, cream, cheese, paneer and egg, which are
 * perfectly good vegetarian alternatives and are exactly what a vegan is
 * avoiding. Left shared, a dairy line licenses its OWN escape and the panna
 * cotta bug returns one level down: "200ml kefir or sour milk, 1 egg" escapes
 * on the word `egg` in its second segment, and Varenyky z Vyshneyu (cherry
 * dumplings built on kefir, egg and smetana) reads as vegan by the binding
 * reading. Measured: that construction alone put Varenyky, Iowa Snickers
 * Salad ("whipped cream or whipped topping"), Michigan Dried Cherry Salad
 * ("blue cheese or goat cheese") and Arkansas Fried Pies ("cold butter or
 * shortening, 120ml cold buttermilk") into the claim.
 *
 * The sweeteners are the other half of the difference. "Powdered sugar or
 * honey" and "barley malt syrup (or honey)" are two of the six recipes this
 * flag exists for, and neither has any recognised alternative without them.
 *
 * They are NOT added to VEG_ALTERNATIVE, and that was measured before it was
 * decided: across all 1710 recipes, sugar|syrup|maple|agave in the shared list
 * moves exactly one dish, and moves it the wrong way. Tapsilog's first line is
 * "400g beef sirloin, sliced thin; marinade: soy, calamansi or lemon, garlic,
 * sugar, pepper", whose second segment carries no meat and would now match
 * `sugar`, escaping the beef along with the line and flipping a Filipino
 * cured-beef breakfast to vegetarianStrict. One regression, no gain: the six
 * recipes that want the sweeteners all want them for the vegan reading, where
 * `veganOption` refuses on `vegetarianOption` anyway and no meat word can be
 * excused by them.
 */
const VEGAN_ALTERNATIVE =
	/\b(?:veg|vegan|vegetable|vegetarian|shortening|oil|kombu|shiitake|mushroom|agar|tofu|olive|paprika|stiffener|dhal|dal|lentil|chickpea|bean|potato|asparagus|spinach|cabbage|rice|noodle|salad|fruit|nut|sugar|syrup|maple|agave)s?\b/i;

const OPTIONAL_MARKER =
	/^\s*(?:optional|fillings?|to serve|for serving|garnish|serve with|toppings?)\b|\boptional\b|\bto serve\b|\bfor serving\b/i;

/**
 * @param {string} line
 * @param {'vegetarian'|'vegan'} [mode] `'vegan'` narrows on both sides: see the
 *   two blocks below that branch on it.
 */
function lineIsEscaped(line, mode = 'vegetarian') {
	const vegan = mode === 'vegan';

	/*
	 * The optional/accompaniment heuristics below are deliberately NOT run for
	 * the vegan reading, which asks only one question: does the recipe itself
	 * name the route? An "or" clause and a parenthetical saying "vegan" do. A
	 * line merely mentioning service does not, and this is the paella failure
	 * that the fish and shellfish block below found, in a second costume, and
	 * measured on the same corpus:
	 *
	 *   Roosterkoek   "30 g butter, softened, plus more to serve"
	 *   Paratha       "Ghee: for the dough, the layers, the pan, and philosophically"
	 *   Mercimek Corbasi  "Finish: butter bloomed with pul biber, dried mint, lemon wedges"
	 *
	 * All three are bound butter or ghee, the first with a weight on it, and
	 * all three are discarded whole: the first by `\bto serve\b` firing mid-line
	 * and the other two by the no-quantity-three-commas rule. Honouring these
	 * two branches admits eleven dishes and three of them are lies, which is the
	 * wrong ratio for something painted on the page.
	 */
	if (!vegan) {
		// "Smoked salmon to serve", "Fillings: umeboshi, tuna-mayo, salmon flakes":
		// genuinely additive, the dish stands without them.
		if (OPTIONAL_MARKER.test(line)) return true;

		// Accompaniment lists: a run of foods with no quantity anywhere, e.g.
		// "Grilled meats, roast chicken, fries, eggs: they all apply" or
		// "Satay, gado-gado, noodles, grilled chicken, raw vegetables, your spoon".
		// A line that names three or more things and measures none of them is
		// telling you what to serve the sauce WITH, not what goes in it.
		if (!/\d/.test(line) && line.split(/[,;]/).length >= 3) return true;
	}

	// "chicken or veg stock" offers a real meatless path; "100g bacon or spam"
	// does not. So split on `or` and require some alternative that is BOTH free
	// of animal keywords AND explicitly vegetarian-flavoured. Testing the whole
	// line instead lets a stray "oil" anywhere in it excuse the bacon, and
	// requiring only "animal-free" lets "1 small chicken or 6 thighs" through
	// because "thighs" isn't a keyword.
	//
	// Note the asymmetry: animal keywords are tested against the SCRUBBED
	// segment, but the vegetarian marker against the raw one. Scrubbing removes
	// whole phrases like "vegetable broth" from the exceptions list, which would
	// otherwise delete the very word ("vegetable") that proves the alternative
	// is meatless: that is what made "250ml hot beef or vegetable broth" read
	// as binding beef.
	const segments = line.split(/\bor\b/i);
	if (segments.length > 1) {
		const escapes = segments.some((/** @type {string} */ seg) => {
			const lowered = seg.toLowerCase();
			const scrubbed = scrub(lowered);
			if (RE.meat.test(scrubbed) || RE.fish.test(scrubbed) || RE.shellfish.test(scrubbed))
				return false;
			// Dairy and honey scrubbed, egg raw: the same split the flags
			// themselves use, so "coconut milk" is still a way out and "egg
			// noodles" is still egg.
			if (vegan && (RE.dairy.test(scrubbed) || RE.egg.test(lowered) || RE.honey.test(scrubbed)))
				return false;
			return (vegan ? VEGAN_ALTERNATIVE : VEG_ALTERNATIVE).test(lowered);
		});
		if (escapes) return true;
	}

	// "2 tbsp dashi (kombu dashi keeps it vegetarian)": a parenthetical that
	// names a vegetarian route is a stated alternative, same as an "or". The
	// vegan reading wants the word `vegan` specifically: a parenthetical
	// promising a vegetarian route says nothing about the dairy on its line,
	// and "(oil keeps it vegan, Ethiopia fasts expertly)" is the corpus doing
	// this correctly and unmistakably.
	const parentheticals = line.match(/\(([^)]*)\)/g) ?? [];
	const claim = vegan ? /\bvegan\b/i : /\bveg(?:an|etarians?)?\b/i;
	if (parentheticals.some((/** @type {string} */ p) => claim.test(p))) return true;

	return false;
}

/**
 * @param {{ n: string, i: string[], v?: number|boolean }} r
 * @param {string} [_fullBlob]
 */
export function deriveDiet(r, _fullBlob) {
	// Ingredients + name only. Method prose and the "from the pass" note are
	// commentary: a note saying a dish is "usually served with lamb" must not
	// put lamb in the dish.
	const lines = [r.n, ...r.i];

	// Binding lines decide vegetarian status; every line still contributes to the
	// literal "does this text mention X" flags, so an allergen is never hidden
	// just because it was offered as an option.
	const binding = lines.filter((l) => !lineIsEscaped(l)).map((l) => scrub(l.toLowerCase()));
	const all = lines.map((l) => scrub(l.toLowerCase()));
	/**
	 * UNSCRUBBED, for the allergens whose exceptions contain them.
	 *
	 * The scrub exists so "coconut milk" is not dairy and "vegetable stock" is
	 * not meat, but it blanks the WHOLE phrase, and several exception phrases
	 * carry a different allergen inside them. Measured: NINE recipes shipped
	 * `containsNuts: false` over an ingredient line reading "peanut butter"
	 * (Kare-Kare, Virginia Peanut Soup, the Peanut Satay master among them),
	 * and five shipped `containsEgg: false` over "egg noodles": the phrase was
	 * excepted so egg noodles would not read as egg for VEGETARIAN purposes,
	 * which is a different question from whether they contain egg. Same failure
	 * as panna cotta shipping vegan over "500ml cream", one layer down.
	 *
	 * The word-boundary matcher keeps raw matching safe: \begg\b cannot reach
	 * inside "eggplant", and no bare nut word appears in "butternut".
	 */
	const raw = lines.map((l) => l.toLowerCase());

	const anyBinding = (/** @type {RegExp} */ re) => binding.some((l) => re.test(l));
	const anyLine = (/** @type {RegExp} */ re) => all.some((l) => re.test(l));
	const anyRaw = (/** @type {RegExp} */ re) => raw.some((l) => re.test(l));

	const containsMeat = anyBinding(RE.meat);

	/**
	 * Fish and shellfish are ALLERGENS, so they follow the allergen policy:
	 * every line, escaped or not, for exactly the reason dairy and egg do
	 * below. They read from `binding` until this was measured, and the comment
	 * above this block already claimed otherwise: "an allergen is never hidden
	 * just because it was offered as an option." For these two it was not true,
	 * and it failed through BOTH escape routes:
	 *
	 *   Weeknight paella: "Chicken thighs, chorizo optional (heresy but
	 *   delicious), shrimp". OPTIONAL_MARKER was written to excuse the chorizo.
	 *   It discards the whole line, and the SHRIMP went with it.
	 *
	 *   Escabecheng Isda: "1 whole tilapia, snapper or pompano (~800g),
	 *   scored, salted, and fried WHOLE in hot oil". The `or` rule split the
	 *   line, found "pompano" in no keyword list, matched `oil` in
	 *   VEG_ALTERNATIVE from "fried WHOLE in hot oil", and escaped a whole fish.
	 *   It shipped `containsFish: false` and a Vegan badge.
	 *
	 * The binding reading is kept for VEGETARIAN status, which is a different
	 * question and one the escape answers correctly: a dish whose fish is
	 * genuinely an optional filling does stand up without it. What the escape
	 * must never do is silence the allergen.
	 */
	const bindingFish = anyBinding(RE.fish);
	const bindingShellfish = anyBinding(RE.shellfish);
	const containsFish = anyLine(RE.fish);
	const containsShellfish = anyLine(RE.shellfish);
	/**
	 * Dairy and egg are ALLERGENS, so they follow the allergen policy stated at
	 * the bottom of this function, reported from all lines, not the vegetarian
	 * `binding` policy.
	 *
	 * They used to read from `binding`, and the escape rule that produces it
	 * only disqualifies a segment carrying meat/fish/shellfish. VEG_ALTERNATIVE
	 * contains butter|cream|cheese|egg, so a dairy line licensed its OWN escape:
	 * panna cotta shipped `vegan: true, containsDairy: false` above an
	 * ingredient list reading "500ml cream + 150ml milk", and rendered no
	 * "Contains" block at all. 32 of 124 vegan-flagged recipes named dairy or
	 * egg in their own ingredients.
	 */
	const containsDairy = anyLine(RE.dairy);
	// Raw, not scrubbed; see the `raw` comment above. Dairy stays scrubbed
	// because its exceptions ("coconut milk") are the point; egg's exception
	// ("egg noodles") was hiding the allergen it names.
	const containsEgg = anyRaw(RE.egg);
	/* Every line, like the allergens: a honey glaze brushed on at the end is
	   still honey, and the vegan claim has to answer for it. */
	const containsHoney = anyLine(RE.honey);

	/**
	 * Derived, literal, safety-first: no animal product in any binding position.
	 *
	 * This is NOT the flag the vegetarian filter uses. The authored `v` field is
	 * a human judgement about the dish as presented, and the corpus applies it
	 * inconsistently to substitution constructions: Mapo Tofu ("ground pork (or
	 * shiitake for veg)") is authored non-vegetarian while Miso Soup
	 * ("katsuobushi (or skip for vegan)") is authored vegetarian. Both readings
	 * are defensible; neither is derivable from the text. So the build trusts the
	 * human for `vegetarian` and uses this strict flag to catch the two things
	 * that ARE unambiguous errors: an animal product with no stated alternative
	 * in a dish marked vegetarian, and no animal product at all in a dish marked
	 * otherwise. See the gates in build-data.mjs.
	 */
	const vegetarianStrict = !containsMeat && !bindingFish && !bindingShellfish;

	/**
	 * True when animal products appear only in optional or "or" positions:
	 * hoisted to a local because `vegan` below has to be able to refuse on it.
	 */
	const vegetarianOption =
		vegetarianStrict && (anyLine(RE.meat) || containsFish || containsShellfish);

	/**
	 * The same reading, one product group further in.
	 *
	 * `vegetarianOption` exists because "this dish is vegetarian by the binding
	 * reading, and an animal product is named somewhere and only escaped" is a
	 * useful thing to be able to say. Nothing said it for the vegan question,
	 * and the commit that made `vegan` refuse on dairy, egg and honey from EVERY
	 * line therefore took the badge off six recipes that state a vegan route in
	 * their own words and left nothing at all in its place:
	 *
	 *   Misir Wat    "3 tbsp niter kibbeh or oil (oil keeps it vegan, Ethiopia fasts expertly)"
	 *   Gomen Wat    "3 tbsp niter kibbeh or oil"
	 *   Kik Alicha   "80 g niter kibbeh, or 80 ml sunflower oil on fasting days"
	 *   Atkilt Wat   "60 g niter kibbeh, or 60 ml sunflower oil on fasting days"
	 *   Orange & Cinnamon Salad   "Powdered sugar or honey"
	 *   Bagels       "1 tbsp barley malt syrup (or honey) in the dough"
	 *
	 * Ethiopian fasting cooking is one of the world's major vegan traditions and
	 * four of those lines are it saying so. Dropping the badge was right; showing
	 * nothing was a loss, and the doctrine that justified it ("the data already
	 * says so in its own field") was only true of meat and fish.
	 *
	 * `!vegetarianOption` is deliberate and mirrors `vegan` itself. A dish whose
	 * MEAT is escaped is a vegetarian option, its vegan-ness is two stated
	 * routes deep, and the field that says so already exists. This flag stacks
	 * on a clean vegetarian reading, never on another option.
	 */
	const veganBinding = lines.filter((l) => !lineIsEscaped(l, 'vegan'));
	const veganStrict =
		vegetarianStrict &&
		!veganBinding.some((l) => RE.dairy.test(scrub(l.toLowerCase()))) &&
		!veganBinding.some((l) => RE.egg.test(l.toLowerCase())) &&
		!veganBinding.some((l) => RE.honey.test(scrub(l.toLowerCase())));
	const veganOption =
		veganStrict && !vegetarianOption && (containsDairy || containsEgg || containsHoney);

	// The authored flag, when we have it. deriveDiet is also called on
	// user-added family recipes, which carry the same `v` field.
	const vegetarian = typeof r.v === 'number' || typeof r.v === 'boolean'
		? Boolean(r.v)
		: vegetarianStrict;

	return {
		vegetarian,
		vegetarianStrict,
		/**
		 * `!vegetarianOption` is the load-bearing clause, and without it the two
		 * flags contradicted each other on 16 recipes: `vegetarianOption` means
		 * BY DEFINITION that an animal product is named somewhere in the text,
		 * and `vegan` is an affirmative claim that none is. Escabecheng Isda,
		 * Banh Xeo and Mapo Tofu all shipped both, and RecipeDetailView paints
		 * the badge straight off `vegan`.
		 *
		 * A dish with a stated meatless route is a vegan OPTION and the data
		 * already says so in its own field. It is not vegan, and a guest reading
		 * a badge is not reading the ingredient list.
		 */
		/**
		 * Honey joins the refusal list on the same grounds as dairy and egg: the
		 * badge is an assertion read by someone who is not going to read the
		 * ingredients underneath it.
		 *
		 * Deliberately strict about the two lines that offer a way out, "powdered
		 * sugar or honey" and "barley malt syrup (or honey)". This file's own
		 * doctrine, three comments up, is that a dish with a stated alternative
		 * is an OPTION and not the thing itself, and being wrong in this
		 * direction costs a vegan a dish they could have eaten, while the other
		 * direction costs them the thing they were avoiding.
		 */
		vegan:
			vegetarianStrict && !vegetarianOption && !containsDairy && !containsEgg && !containsHoney,
		vegetarianOption,
		/**
		 * Disjoint from `vegan` by construction, and the build gate says so out
		 * loud: `vegan` requires that nothing is named anywhere, `veganOption`
		 * requires that something is.
		 */
		veganOption,
		containsMeat,
		containsPork: anyBinding(RE.pork),
		containsFish,
		containsShellfish,
		containsDairy,
		containsEgg,
		// Allergens are reported from ALL lines, escaped or not. Someone with a
		// nut allergy needs to know the garnish exists.
		containsGluten: anyLine(RE.gluten),
		containsNuts: anyRaw(RE.nuts),
		containsAlcohol: anyLine(RE.alcohol),
		containsSesame: anyRaw(RE.sesame),
		containsSoy: anyRaw(RE.soy),
		containsPeanut: anyRaw(RE.peanut),
		containsCelery: anyRaw(RE.celery),
		containsMustard: anyRaw(RE.mustard),
		containsMollusc: anyRaw(RE.mollusc),
		containsLupin: anyRaw(RE.lupin),
		containsHoney,
		confidence: 'derived'
	};
}
