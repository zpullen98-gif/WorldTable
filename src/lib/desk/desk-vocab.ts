/**
 * The Menu Desk's vocabulary: every regex family and word list the reader
 * (desk-reader.ts) and the sorter (desk-sort.ts) consult, in one file, so that
 * a rule about what a price looks like is written once and the three apps that
 * carry this module as a port cannot drift on it the way their three copies of
 * menu-parse.ts did.
 *
 * WHAT THIS FILE IS NOT. It is not knowledge about any dish, wine or drink.
 * A word list here says "Champagne is a region a wine list prints", never
 * "this bottle is from Champagne": the reader only records a vocabulary hit
 * when the list PRINTED the word, and an unrecognised word stays verbatim in
 * the row for a person to read. No list here names an allergen, and none may:
 * there is no allergen field anywhere on the desk for one to feed.
 *
 * ON THE ONE-LINE DIVERGENCE. The three copies of the old parser differed in
 * exactly one line: the Codex allowed four and five figure prices because a
 * cellar list prints 1250 for a bottle, and the other two capped a bare price
 * at three digits to keep "Pinot Noir 2019" a name. PRICED_BARE below is the
 * Codex form for all three, with the thing the cap was protecting named
 * directly: a four-digit number reading 19xx or 20xx is a vintage, not a price.
 *
 * The em dash is written as an escape inside regex bodies only, never as the
 * character, because the monorepo's publish gate counts the character across
 * the built tree and this module is shipped three times.
 */

import { foldName } from './desk-text';

/* -------------------------------------------------------------------------
 * Prices
 * ---------------------------------------------------------------------- */

export const CURRENCY_SYMBOL = '[\\u00A3\\u0024\\u20AC\\u00A5\\u20B9\\u20A9\\u0E3F\\u20BD\\u20BA\\u20AA]';
export const CURRENCY_CODE = '(?:GBP|USD|EUR|AUD|NZD|CAD|CHF|SEK|NOK|DKK|ZAR|JPY|INR|PLN|kr|p)';

/**
 * A price with its currency attached on either side: '£12', '12€', '50p'. With a
 * currency present the digits are unambiguous, so up to five of them are allowed.
 */
export const PRICED_WITH_CURRENCY = new RegExp(
	'^(?:' +
		CURRENCY_SYMBOL +
		'\\s?\\d{1,5}(?:[.,]\\d{1,2})?|\\d{1,5}(?:[.,]\\d{1,2})?\\s?(?:' +
		CURRENCY_SYMBOL +
		'|' +
		CURRENCY_CODE +
		'))$',
	'i'
);

/**
 * A bare number with no currency anywhere, the Codex form: one to three digits,
 * a decimal price of any length, a thousands-separated price, or a four or five
 * figure whole number that does not read 19xx or 20xx. That last clause is the
 * whole vintage rule: 'Pinot Noir 2019' keeps its year and a cellar list's
 * '1250' is the bottle price it says it is.
 */
export const PRICED_BARE = /^(?:\d{1,3}|\d{1,5}[.,]\d{1,2}|\d{1,3}[.,]\d{3}|(?!(?:19|20)\d{2}$)\d{4,5})$/;

/** Market price in the forms menus actually print, kept exactly as printed. */
export const MARKET_PRICE = /^(?:m\.?p\.?|m\/p|mkt|p\.?o\.?a\.?)$/i;

/**
 * Words that sit next to a price without being one: sizes, measures and the
 * per-head qualifiers. They may join a price tail but never start one on their
 * own, which is what leaves 'Half chicken 14' a dish called Half chicken.
 */
export const SIZE_WORD =
	/^(?:glass|gls|bottle|btl|carafe|pitcher|jug|half|full|small|large|sm|lg|reg|regular|pint|schooner|single|double|cup|pot|scoop|slice|each|ea|pp|supp|supplement|\d{1,4}(?:\.\d+)?\s?(?:ml|cl|oz))$/i;

/** Punctuation that joins two prices together rather than separating a price from a name. */
export const CONNECTOR = /^(?:[/|,&+]|[-–\u2014]+)$/;

/** A currency standing alone as its own token: the '£' of '£ 12', the 'GBP' of '14 GBP'. */
export const LONE_CURRENCY = new RegExp('^(?:' + CURRENCY_SYMBOL + '|' + CURRENCY_CODE + ')$', 'i');
/** A currency anywhere on the line: what tells '£20 7946 0958' from a telephone number before the price-line test runs. */
export const ANY_CURRENCY = new RegExp(CURRENCY_SYMBOL + '|' + CURRENCY_CODE, 'i');

/**
 * The words a price line is allowed to carry beside its figures. Commander's
 * prints '$90 per Person + Optional Wine Pairing ($40)' on a line of its own,
 * and every word of it is here; 'Bottle of house wine 20' is not a price line,
 * because 'of' and 'house' are not, and it stays a dish with a tail price.
 *
 * None of these may START a price line: the first token has to be a price, a
 * currency or a size word. 'Tasting Menu 65', 'Wine Pairing 40' and 'Cheese
 * Course 12' are rows with a tail price, and read as price lines they made
 * the heading above them a dish with an invented composite price and lost
 * every row.
 */
export const PRICE_WORDS = new Set([
	'per', 'person', 'persons', 'people', 'head', 'pp', 'guest', 'each', 'ea',
	'pairing', 'pairings', 'optional', 'wine', 'wines', 'supplement', 'supp', 'add', 'plus', 'extra',
	'glass', 'gls', 'bottle', 'btl', 'carafe', 'pitcher', 'jug', 'half', 'full', 'small', 'large', 'sm', 'lg',
	'regular', 'reg', 'pint', 'schooner', 'single', 'double', 'cup', 'pot', 'scoop', 'slice',
	'oz', 'ml', 'cl', 'l', 'ltr', 'litre', 'liter',
	'for', 'two', 'three', 'four', 'with', 'without', 'or', 'and', 'the', 'a', 'an', 'of',
	'tasting', 'menu', 'course', 'courses', 'price', 'market', 'from', 'to', 'min', 'minimum'
]);

/** How many tokens a price line may run to before it is prose that mentions a price. */
export const PRICE_LINE_MAX_TOKENS = 12;

/**
 * A pour size: '5 oz', '2.5oz', '125ml', '17.5cl'. POUR_LINE is a line of
 * nothing but sizes and connectors, the line Commander's prints under
 * '45.00 / 22.50' to say which price is which.
 */
export const POUR_SIZE = /\d+(?:[.,]\d+)?\s?(?:oz|ml|cl)\b/gi;
export const POUR_LINE = /^\s*\d+(?:[.,]\d+)?\s?(?:oz|ml|cl)\s*(?:[/|,&+]\s*\d+(?:[.,]\d+)?\s?(?:oz|ml|cl)\s*)*$/i;

/* -------------------------------------------------------------------------
 * Vintages and numbers that belong to a name
 * ---------------------------------------------------------------------- */

/**
 * A vintage in any form a list prints it: a year, or NV, MV, N.V. for a
 * non-vintage bottle. VINTAGE_LINE is the whole-line form (Commander's prints
 * '2010' on its own line under the pours), tested before the junk rule because
 * 'NV' is two letters and the junk rule throws two-letter lines away as specks.
 */
export const VINTAGE_LINE = /^\s*(?:(?:19|20)\d{2}|NV|MV|N\.V\.)\s*$/i;
export const VINTAGE = /(?:^|[\s(\[,])((?:19|20)\d{2}|NV|MV|N\.V\.)(?=$|[\s)\],.;])/i;
/**
 * The two-digit form, "'19", accepted only once a row is known to be wine:
 * on a food menu an apostrophe and two digits is a size or a typo.
 */
export const VINTAGE_SHORT = /(?:^|\s)['’](\d{2})(?=$|[\s)\],.;])/;

/**
 * Numbers that are part of a name and never a price, in either layout. The
 * word before the number is what protects it ('Bin 389', 'No. 23', 'Cuvée
 * 1738'), and a short closed list of brand numbers that stand alone: French
 * 75, Bacardi 151, Tequila 1800, Don Julio 1942, Licor 43. Tested against the
 * end of a name so the tail walk stops before eating them.
 */
export const NAMED_NUMBERS =
	/(?:\b(?:bin|no\.?|number|nr\.?|cuv[ée]e|solera|lot|batch|reserve|reserva|riserva|edition|édition|blend|barrel|cask|pot|vat|cru|selection|sélection|série|series)\s*\d{1,4}|#\s?\d{1,4}|\bfrench\s+75|\b(?:bacardi|rum runner|runner)\s+151|\b151\s+proof|\btequila\s+1800|\b1800\s+(?:silver|blanco|reposado|añejo|anejo)|\bdon julio\s+1942|\blicor\s+43|\bcuarenta y tres|\bpisco\s+100)$/i;

/**
 * The index a cellar list prints in front of every bin: a number followed by a
 * GAP (two spaces or a tab) and then the name. The gap is the whole test,
 * because '12 Bridge Street' and '2 courses 25' have a single space, and it is
 * read on the raw line before whitespace is folded.
 */
export const LIST_INDEX = /^\s*(\d{1,4})(?:[ ]{2,}|\t)(?=\S)/;

/**
 * The index number a takeaway menu prints in front of every dish: '12. Sweet and
 * sour pork', '13) Kung po chicken', '14 - Egg fried rice'. A letter has to
 * follow, which keeps a bare '12.' a page number, a price on its own line a
 * price, and '12.50 Soup' on a price-first menu whole. The dash form insists on
 * spaces round the dash so '5-spice duck' keeps its front.
 */
export const ITEM_NUMBER = /^\d{1,3}(?:\s*[.)]\s*|\s+[-–\u2014]\s+)(?=[^\s\d])/;

/* -------------------------------------------------------------------------
 * Marks, noise, schedules
 * ---------------------------------------------------------------------- */

/**
 * The dietary marks a menu prints, and the only spellings accepted. Deliberately
 * short: these are MARKS, so '(v)' and '(vegan)' are in and '(contains nuts)' is
 * not, because that is prose about contents and this desk does not read
 * contents. Anything not on the list leaves its bracket alone and stays in the
 * name, where a person can see it and decide for themselves.
 */
export const MARKS: Record<string, string> = {
	v: 'v',
	veg: 'v',
	vegetarian: 'v',
	vg: 'vg',
	ve: 'vg',
	vgn: 'vg',
	vegan: 'vg',
	gf: 'gf',
	glutenfree: 'gf',
	df: 'df',
	dairyfree: 'df',
	n: 'n'
};

/**
 * The short marks, and the only ones allowed to be taken off the end of a line
 * without brackets around them. Written-out words are excluded on purpose: 'Mixed
 * veg 4' would otherwise come back as a dish called Mixed, tagged vegetarian.
 */
export const BARE_MARK = /^(?:v|vg|ve|gf|df|n)$/i;

/**
 * Lines where the menu is talking about itself rather than selling anything.
 * Kept as separate named patterns so it stays obvious what each one is for, and
 * so a wrong one can be removed without unpicking a wall of alternation.
 *
 * The allergy notice earns its place twice over. It is not a dish, and it is
 * also the line on a menu most likely to be mistaken for allergen data by
 * something reading in a hurry, so it is named and dropped rather than left to
 * fall through into a row.
 *
 * The page-number rule is 'Page N' and nothing looser. It used to take any
 * bare number of up to three digits, which is also what a price on its own
 * line looks like, and that is how every price on Commander's menu was thrown
 * away as a page number. A bare '2' is now an orphan price, visible on screen.
 */
export const NOISE: RegExp[] = [
	/\bhttps?:\/\//i,
	/\bwww\.[a-z]/i,
	/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
	/\bfollow us\b|\binstagram\b|\bfacebook\b|\btwitter\b|\btiktok\b|(?:^|\s)@[a-z0-9_.]{3,}/i,
	/\b(vat|service charge|gratuity|discretionary|cover charge)\b/i,
	/\bprices?\s+(are|include|includes|including|inclusive|subject|shown)\b/i,
	/\ballerg(y|ies|en|ens|ic)\b|\bintoleranc/i,
	/\b(please|kindly)\s+(inform|note|tell|ask|advise|speak|let|make)\b/i,
	/\b(tel|telephone|phone|call us|reservations?|bookings?)\b.*\d{3}/i,
	/\bwe (cannot|can not|do not|don't) guarantee\b/i,
	/^[\s~*_.\-–\u2014]*page\s*\d{1,3}[\s~*_.\-–\u2014]*$/i,
	/\b[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}\b/,
	/\b\d+[a-z]?\s+[\w'-]+\s+(street|road|avenue|lane|drive|square|place|terrace|gardens|gdns)\b/i
];

/** Days of the week in the abbreviations menus actually use. */
export const DAY_WORD =
	/\b(mon|tue|tues|wed|weds|thu|thur|thurs|fri|sat|sun)(?:day|s|nesday|rsday|urday|esday)?\b/i;

/**
 * A clock time, or a range of them. Only ever consulted about a line that turned
 * out to have no price, because '18.50' reads as a time and as a price and the
 * price is the reading that matters: 'Sunday roast 18.50' is a dish and 'Sunday
 * 12 to 4' is opening hours.
 */
export const CLOCK = /\d\s*(?:am|pm)\b|\d{1,2}[:.]\d{2}\b|\d\s*(?:[-–\u2014]|to|till|until)\s*\d/i;

/* -------------------------------------------------------------------------
 * Headings, decoration, the shape of a name
 * ---------------------------------------------------------------------- */

/**
 * Small words a heading or a name may leave lower case without ceasing to be
 * title case. The French, Italian and Spanish articles are here because a menu
 * prints 'Turtle Soup au Sherry', 'Sauté of Sweet Corn' and 'Pollo con Mole'
 * and every one of them is a name.
 */
export const SMALL_WORDS = new Set([
	'a', 'an', 'the', 'of', 'and', 'to', 'for', 'from', 'on', 'in', 'with', 'by', 'at', '&', 'or',
	'de', 'du', 'des', 'la', 'le', 'les', 'del', 'della', 'dello', 'delle', 'dei', 'degli', 'di', 'da', 'al', 'alla', 'au', 'aux',
	'et', 'y', 'e', 'con', 'en', 'el', 'los', 'las', 'il', 'lo', 'gli', 'un', 'una', 'une', 'und', 'mit', 'im', 'am', 'zum', 'zur', 'à', 'a la', 'sur', 'aus', 'vom'
]);

/**
 * The characters a menu decorates a line with, at the front and at the back.
 * A full stop is decoration at the front only: at the back it is the
 * sentence's own, and 'shaken hard and served long.' keeps it because a line
 * is stored as printed. Leaders ('....') became gaps before this runs.
 */
export const DECORATION_LEAD = /^[\s~*=+_.·•<>«»\-–\u2014#†‡]+/;
export const DECORATION_TAIL = /[\s~*=+_·•<>«»\-–\u2014#:†‡]+$/;
/**
 * The decoration that marks a NOTE rather than a bullet: a tilde or a star at
 * the front of a line. A dash or a bullet at the front is a list marker and
 * the line behind it is read as it stands.
 */
export const NOTE_LEAD = /^\s*[~*†‡]/;
/** Decoration at BOTH ends is a framed line: '~ Mains ~', '*** SIDES ***'. */
export const FRAMED = /^[~*=+_·•<>«»#\-–\u2014].*[~*=+_·•»>#\-–\u2014]$/;

/**
 * The words that make a heading a priced offering rather than a plain section:
 * a tasting menu, a set menu, a course price. A heading with one of these
 * followed by a price line is both the section AND a row to review, because
 * the price is the menu's and dropping it would be losing what the page said.
 */
export const OFFERING_WORDS = /\b(?:offering|offerings|menu|menus|tasting|dégustation|degustation|course|courses|prix fixe|set|omakase|experience|feast|banquet|brunch|lunch|dinner|supper)\b/i;

/** The name-shape limits: past these a line is a sentence read as one. */
export const NAME_MAX_CHARS = 60;
export const NAME_MAX_WORDS = 8;
/** A terminal stop ends a sentence, and a name has none. */
export const TERMINAL_STOP = /[.!?]$/;

/* -------------------------------------------------------------------------
 * Wine
 * ---------------------------------------------------------------------- */

/**
 * Words that begin a producer's name and stay with it when the name is split
 * from the wine: 'Domaine Leflaive Puligny-Montrachet' is Domaine Leflaive and
 * Puligny-Montrachet, not Domaine and Leflaive Puligny-Montrachet.
 */
export const ESTATE_WORDS = new Set([
	'domaine', 'domaines', 'dom', 'dom.', 'château', 'chateau', 'ch', 'ch.', 'chât', 'chât.', 'clos', 'maison', 'mas', 'cave', 'caves',
	'weingut', 'weinhaus', 'schloss', 'tenuta', 'tenute', 'azienda', 'agricola', 'fattoria', 'podere', 'poderi', 'castello', 'cantina', 'cantine',
	'bodega', 'bodegas', 'viña', 'vina', 'viñedos', 'vinedos', 'finca', 'quinta', 'casa', 'herdade', 'adega',
	'estate', 'estates', 'vineyard', 'vineyards', 'winery', 'cellars', 'family', 'famille', 'familia', 'famiglia', 'fratelli', 'f.lli', 'frères', 'freres', 'hermanos', 'hnos', 'hnos.'
]);

/**
 * Countries a wine list prints. Matched as whole words, folded for accent and
 * case, and recorded AS PRINTED.
 */
export const DESK_COUNTRIES: string[] = [
	'France', 'Italy', 'Italia', 'Spain', 'España', 'Portugal', 'Germany', 'Deutschland', 'Austria', 'Österreich', 'Switzerland',
	'Hungary', 'Greece', 'Georgia', 'Croatia', 'Slovenia', 'Slovakia', 'Czech Republic', 'Czechia', 'Romania', 'Bulgaria', 'Moldova', 'Serbia', 'North Macedonia',
	'England', 'United Kingdom', 'UK', 'Wales', 'Scotland',
	'USA', 'United States', 'US', 'U.S.A.', 'America', 'Canada', 'Mexico',
	'Chile', 'Argentina', 'Uruguay', 'Brazil', 'Peru',
	'Australia', 'New Zealand', 'South Africa',
	'Lebanon', 'Israel', 'Turkey', 'Morocco', 'Tunisia', 'Cyprus', 'Luxembourg', 'Armenia', 'Japan', 'China', 'India'
];

/**
 * About two hundred regions and appellations, the ones a wine list in an
 * English-speaking room prints. Not exhaustive on purpose: an unread part of a
 * descriptor stays verbatim in the row and marks it low, which is honest, and
 * the list can grow without any other line changing.
 */
export const DESK_REGIONS: string[] = [
	// France
	'Champagne', 'Bordeaux', 'Burgundy', 'Bourgogne', 'Chablis', 'Côte de Beaune', 'Côte de Nuits', 'Côte d\'Or', 'Côte Chalonnaise', 'Meursault', 'Puligny-Montrachet', 'Chassagne-Montrachet',
	'Pouilly-Fuissé', 'Mâcon', 'Mâcon-Villages', 'Mâconnais', 'Saint-Véran', 'Beaujolais', 'Beaujolais-Villages', 'Morgon', 'Fleurie', 'Moulin-à-Vent', 'Brouilly', 'Gevrey-Chambertin', 'Chambolle-Musigny', 'Vosne-Romanée', 'Nuits-Saint-Georges', 'Pommard', 'Volnay', 'Corton', 'Rully', 'Mercurey', 'Givry', 'Marsannay', 'Santenay', 'Saint-Aubin', 'Aloxe-Corton', 'Savigny-lès-Beaune', 'Beaune',
	'Rhône', 'Rhone', 'Côtes du Rhône', 'Cotes du Rhone', 'Châteauneuf-du-Pape', 'Hermitage', 'Crozes-Hermitage', 'Côte-Rôtie', 'Cote-Rotie', 'Saint-Joseph', 'Cornas', 'Condrieu', 'Gigondas', 'Vacqueyras', 'Tavel', 'Lirac', 'Rasteau', 'Cairanne', 'Ventoux', 'Luberon', 'Costières de Nîmes',
	'Loire', 'Sancerre', 'Pouilly-Fumé', 'Pouilly-Fume', 'Vouvray', 'Chinon', 'Muscadet', 'Savennières', 'Anjou', 'Saumur', 'Saumur-Champigny', 'Bourgueil', 'Touraine', 'Menetou-Salon', 'Quincy', 'Reuilly', 'Montlouis', 'Cheverny', 'Coteaux du Layon', 'Quarts de Chaume',
	'Alsace', 'Provence', 'Bandol', 'Côtes de Provence', 'Cassis', 'Bellet', 'Languedoc', 'Roussillon', 'Minervois', 'Corbières', 'Pic Saint-Loup', 'Faugères', 'Saint-Chinian', 'Fitou', 'Limoux', 'Collioure', 'Banyuls', 'Maury', 'Rivesaltes', 'Pays d\'Oc', 'Méditerranée', 'Mediterranee', 'Vin de France',
	'Cahors', 'Madiran', 'Jurançon', 'Bergerac', 'Monbazillac', 'Gaillac', 'Fronton', 'Irouléguy', 'Jura', 'Arbois', 'Savoie', 'Bugey', 'Corsica', 'Corse',
	'Médoc', 'Medoc', 'Haut-Médoc', 'Haut-Medoc', 'Margaux', 'Pauillac', 'Saint-Julien', 'Saint-Estèphe', 'Saint-Estephe', 'Listrac', 'Moulis', 'Pessac-Léognan', 'Pessac-Leognan', 'Graves', 'Sauternes', 'Barsac', 'Saint-Émilion', 'Saint-Emilion', 'St-Émilion', 'St-Emilion', 'Pomerol', 'Lalande-de-Pomerol', 'Fronsac', 'Entre-Deux-Mers', 'Côtes de Bourg', 'Côtes de Castillon', 'Castillon',
	// Italy
	'Piedmont', 'Piemonte', 'Barolo', 'Barbaresco', 'Langhe', 'Roero', 'Gavi', 'Asti', 'Alba', 'Dogliani', 'Monferrato', 'Gattinara', 'Ghemme', 'Alto Adige', 'Südtirol', 'Sudtirol', 'Trentino', 'Friuli', 'Friuli-Venezia Giulia', 'Collio', 'Colli Orientali', 'Veneto', 'Valpolicella', 'Amarone', 'Amarone della Valpolicella', 'Soave', 'Prosecco', 'Valdobbiadene', 'Conegliano', 'Lugana', 'Bardolino', 'Franciacorta', 'Lombardy', 'Lombardia', 'Oltrepò Pavese', 'Valtellina',
	'Tuscany', 'Toscana', 'Chianti', 'Chianti Classico', 'Brunello di Montalcino', 'Montalcino', 'Rosso di Montalcino', 'Montepulciano', 'Vino Nobile di Montepulciano', 'Bolgheri', 'Maremma', 'Carmignano', 'Morellino di Scansano', 'Umbria', 'Orvieto', 'Montefalco', 'Marche', 'Verdicchio dei Castelli di Jesi', 'Abruzzo', 'Montepulciano d\'Abruzzo', 'Lazio', 'Campania', 'Taurasi', 'Fiano di Avellino', 'Greco di Tufo', 'Puglia', 'Salento', 'Primitivo di Manduria', 'Basilicata', 'Aglianico del Vulture', 'Calabria', 'Cirò', 'Sicily', 'Sicilia', 'Etna', 'Sardinia', 'Sardegna', 'Emilia-Romagna', 'Emilia', 'Lambrusco', 'Liguria', 'Cinque Terre', 'Valle d\'Aosta', 'Aosta',
	// Spain and Portugal
	'Rioja', 'Rioja Alta', 'Rioja Alavesa', 'Ribera del Duero', 'Priorat', 'Priorato', 'Montsant', 'Penedès', 'Penedes', 'Cava', 'Rías Baixas', 'Rias Baixas', 'Galicia', 'Ribeira Sacra', 'Ribeiro', 'Valdeorras', 'Bierzo', 'Toro', 'Rueda', 'Jerez', 'Sherry', 'Sanlúcar', 'Navarra', 'Jumilla', 'Yecla', 'Valencia', 'La Mancha', 'Somontano', 'Txakoli', 'Getariako Txakolina', 'Canary Islands', 'Tenerife', 'Alicante', 'Calatayud', 'Campo de Borja', 'Cariñena', 'Montilla-Moriles', 'Málaga', 'Malaga', 'Castilla y León', 'Castilla', 'Catalonia', 'Catalunya', 'Terra Alta', 'Costers del Segre', 'Empordà',
	'Douro', 'Porto', 'Port', 'Vinho Verde', 'Dão', 'Dao', 'Bairrada', 'Alentejo', 'Lisboa', 'Tejo', 'Setúbal', 'Madeira', 'Colares', 'Bucelas', 'Beira',
	// Germany and Austria
	'Mosel', 'Rheingau', 'Rheinhessen', 'Pfalz', 'Nahe', 'Franken', 'Baden', 'Württemberg', 'Ahr', 'Mittelrhein', 'Saar', 'Ruwer', 'Sachsen', 'Saale-Unstrut',
	'Wachau', 'Kamptal', 'Kremstal', 'Wagram', 'Traisental', 'Burgenland', 'Steiermark', 'Styria', 'Südsteiermark', 'Neusiedlersee', 'Weinviertel', 'Carnuntum', 'Thermenregion', 'Wien', 'Vienna',
	// The rest of Europe and beyond
	'Tokaj', 'Tokaji', 'Eger', 'Villány', 'Somló', 'Balaton', 'Santorini', 'Nemea', 'Naoussa', 'Naousa', 'Macedonia', 'Peloponnese', 'Crete', 'Moravia', 'Primorska', 'Istria', 'Dalmatia', 'Slavonia', 'Kakheti', 'Bekaa Valley', 'Bekaa', 'Galilee', 'Golan Heights', 'Yamanashi', 'Ningxia', 'Sussex', 'Kent', 'Hampshire', 'Essex', 'Cornwall',
	// The Americas
	'California', 'Napa', 'Napa Valley', 'Sonoma', 'Sonoma Coast', 'Sonoma County', 'Russian River Valley', 'Russian River', 'Alexander Valley', 'Dry Creek Valley', 'Dry Creek', 'Carneros', 'Los Carneros', 'Stags Leap', 'Stags Leap District', 'Rutherford', 'Oakville', 'St. Helena', 'Howell Mountain', 'Spring Mountain', 'Mount Veeder', 'Anderson Valley', 'Mendocino', 'Lake County', 'Santa Barbara', 'Santa Barbara County', 'Santa Rita Hills', 'Sta. Rita Hills', 'Santa Ynez', 'Santa Ynez Valley', 'Santa Maria Valley', 'Paso Robles', 'Central Coast', 'Monterey', 'Santa Lucia Highlands', 'Santa Cruz Mountains', 'Lodi', 'Sierra Foothills', 'Amador', 'Livermore', 'Edna Valley', 'Arroyo Grande',
	'Oregon', 'Willamette Valley', 'Willamette', 'Dundee Hills', 'Eola-Amity Hills', 'Yamhill-Carlton', 'Ribbon Ridge', 'Chehalem Mountains', 'Washington', 'Columbia Valley', 'Walla Walla', 'Walla Walla Valley', 'Yakima Valley', 'Red Mountain', 'Horse Heaven Hills', 'New York', 'Finger Lakes', 'Long Island', 'North Fork', 'Hudson Valley', 'Virginia', 'Texas', 'Texas Hill Country', 'Michigan', 'Colorado', 'Idaho', 'Arizona',
	'Okanagan', 'Okanagan Valley', 'Niagara', 'Niagara Peninsula', 'Prince Edward County', 'Nova Scotia', 'Ontario', 'British Columbia', 'Baja California', 'Valle de Guadalupe',
	'Maipo', 'Maipo Valley', 'Colchagua', 'Colchagua Valley', 'Casablanca', 'Casablanca Valley', 'Aconcagua', 'Leyda', 'Limarí', 'Limari', 'Elqui', 'Maule', 'Itata', 'Bío Bío', 'Bio Bio', 'Rapel', 'Cachapoal', 'Central Valley', 'Curicó',
	'Mendoza', 'Uco Valley', 'Valle de Uco', 'Luján de Cuyo', 'Lujan de Cuyo', 'Maipú', 'Maipu', 'Salta', 'Cafayate', 'Patagonia', 'Río Negro', 'Rio Negro', 'San Juan', 'Neuquén', 'Canelones', 'Maldonado',
	// Australia, New Zealand, South Africa
	'South Australia', 'Barossa', 'Barossa Valley', 'Eden Valley', 'Clare Valley', 'McLaren Vale', 'Adelaide Hills', 'Coonawarra', 'Langhorne Creek', 'Padthaway', 'Riverland', 'Limestone Coast', 'Hunter Valley', 'Hunter', 'Mudgee', 'Orange', 'Canberra', 'Canberra District', 'Riverina', 'New South Wales', 'Victoria', 'Yarra Valley', 'Mornington Peninsula', 'Heathcote', 'Rutherglen', 'Geelong', 'Grampians', 'Pyrenees', 'King Valley', 'Beechworth', 'Macedon Ranges', 'Western Australia', 'Margaret River', 'Great Southern', 'Frankland River', 'Swan Valley', 'Tasmania', 'Tamar Valley', 'Coal River',
	'Marlborough', 'Central Otago', 'Hawke\'s Bay', 'Hawkes Bay', 'Martinborough', 'Wairarapa', 'Nelson', 'Waipara', 'North Canterbury', 'Canterbury', 'Gisborne', 'Auckland', 'Waiheke', 'Waiheke Island', 'Bannockburn', 'Gimblett Gravels',
	'Stellenbosch', 'Swartland', 'Franschhoek', 'Paarl', 'Constantia', 'Walker Bay', 'Hemel-en-Aarde', 'Elgin', 'Western Cape', 'Coastal Region', 'Robertson', 'Wellington', 'Durbanville', 'Elim', 'Cederberg', 'Tulbagh', 'Breedekloof', 'Cape Town'
];

/**
 * Grapes, with the synonyms a list prints for them. Each row is one grape;
 * the first spelling is the canonical one and the rest are what the same grape
 * is called on a different label. A hit is recorded as PRINTED, never as the
 * canonical spelling: a list that says Shiraz said Shiraz.
 */
export const DESK_GRAPES: string[][] = [
	['Cabernet Sauvignon', 'Cabernet', 'Cab Sauv', 'Cab'], ['Merlot'], ['Cabernet Franc', 'Cab Franc', 'Breton', 'Bouchet'], ['Petit Verdot'], ['Malbec', 'Cot', 'Côt', 'Auxerrois'], ['Carménère', 'Carmenere'],
	['Pinot Noir', 'Pinot Nero', 'Spätburgunder', 'Spatburgunder', 'Blauburgunder'], ['Pinot Gris', 'Pinot Grigio', 'Grauburgunder', 'Ruländer', 'Rulander'], ['Pinot Blanc', 'Pinot Bianco', 'Weissburgunder', 'Weißburgunder'], ['Pinot Meunier', 'Meunier'],
	['Chardonnay', 'Morillon'], ['Sauvignon Blanc', 'Sauvignon', 'Fumé Blanc', 'Fume Blanc'], ['Sauvignon Gris'], ['Riesling', 'Rhine Riesling', 'Johannisberg Riesling'], ['Gewürztraminer', 'Gewurztraminer', 'Traminer'], ['Chenin Blanc', 'Chenin', 'Steen'],
	['Viognier'], ['Marsanne'], ['Roussanne'], ['Grenache Blanc', 'Garnacha Blanca'], ['Grenache', 'Garnacha', 'Cannonau', 'Grenache Noir', 'Garnacha Tinta'], ['Grenache Gris'],
	['Syrah', 'Shiraz'], ['Mourvèdre', 'Mourvedre', 'Monastrell', 'Mataro'], ['Carignan', 'Cariñena', 'Carinena', 'Mazuelo', 'Carignane'], ['Cinsault', 'Cinsaut'], ['Counoise'],
	['Tempranillo', 'Tinto Fino', 'Tinta del País', 'Tinta del Pais', 'Tinta Roriz', 'Aragonez', 'Cencibel', 'Ull de Llebre'], ['Graciano'], ['Mencía', 'Mencia'], ['Bobal'], ['Monastrell'],
	['Albariño', 'Albarino', 'Alvarinho'], ['Verdejo'], ['Godello'], ['Treixadura'], ['Loureiro'], ['Palomino', 'Palomino Fino'], ['Pedro Ximénez', 'Pedro Ximenez', 'PX'], ['Moscatel'], ['Muscat', 'Moscato', 'Muscat Blanc', 'Muscat Blanc à Petits Grains', 'Muscat of Alexandria', 'Moscatel de Alejandría', 'Zibibbo'], ['Malvasia', 'Malvazija', 'Malmsey'], ['Airén', 'Airen'], ['Xarel-lo', 'Xarello'], ['Macabeo', 'Viura', 'Macabeu'], ['Parellada'],
	['Nebbiolo', 'Spanna', 'Chiavennasca'], ['Barbera'], ['Dolcetto'], ['Sangiovese', 'Brunello', 'Prugnolo Gentile', 'Morellino'], ['Montepulciano'], ['Aglianico'], ['Nero d\'Avola', 'Nero dAvola'], ['Nerello Mascalese'], ['Frappato'], ['Primitivo', 'Zinfandel', 'Zin'], ['Negroamaro'], ['Corvina', 'Corvina Veronese'], ['Rondinella'], ['Molinara'], ['Lagrein'], ['Schiava', 'Vernatsch'], ['Teroldego'], ['Refosco'], ['Sagrantino'], ['Cesanese'], ['Gaglioppo'],
	['Friulano', 'Tocai', 'Tocai Friulano'], ['Ribolla Gialla', 'Ribolla'], ['Garganega'], ['Trebbiano', 'Ugni Blanc', 'Trebbiano Toscano'], ['Verdicchio'], ['Vermentino', 'Rolle', 'Pigato', 'Favorita'], ['Fiano'], ['Greco', 'Greco di Tufo'], ['Falanghina'], ['Pecorino'], ['Arneis'], ['Cortese'], ['Glera'], ['Catarratto'], ['Grillo'], ['Inzolia', 'Insolia'], ['Carricante'], ['Vernaccia'], ['Pignoletto', 'Grechetto'], ['Timorasso'], ['Erbaluce'], ['Passerina'],
	['Grüner Veltliner', 'Gruner Veltliner', 'Grüner', 'Gruner', 'Veltliner'], ['Blaufränkisch', 'Blaufrankisch', 'Lemberger', 'Kékfrankos', 'Kekfrankos'], ['Zweigelt'], ['St. Laurent', 'Sankt Laurent', 'Saint Laurent'], ['Welschriesling'], ['Roter Veltliner'], ['Rotgipfler'], ['Zierfandler'],
	['Silvaner', 'Sylvaner'], ['Müller-Thurgau', 'Muller-Thurgau', 'Rivaner'], ['Scheurebe'], ['Kerner'], ['Dornfelder'], ['Portugieser', 'Blauer Portugieser'], ['Trollinger'], ['Elbling'],
	['Furmint'], ['Hárslevelű', 'Harslevelu'], ['Kadarka'], ['Juhfark'], ['Assyrtiko'], ['Xinomavro'], ['Agiorgitiko'], ['Moschofilero'], ['Malagousia', 'Malagouzia'], ['Roditis'], ['Savatiano'], ['Saperavi'], ['Rkatsiteli'], ['Mtsvane'], ['Plavac Mali'], ['Pošip', 'Posip'], ['Žilavka', 'Zilavka'], ['Fetească', 'Feteasca', 'Fetească Neagră', 'Feteasca Neagra', 'Fetească Albă'], ['Mavrud'],
	['Tannat'], ['Bonarda'], ['Torrontés', 'Torrontes'], ['Pinotage'], ['Colombard', 'French Colombard'], ['Sémillon', 'Semillon'], ['Muscadelle'], ['Gamay', 'Gamay Noir'], ['Aligoté', 'Aligote'], ['Melon de Bourgogne', 'Melon'], ['Petit Manseng'], ['Gros Manseng'], ['Savagnin'], ['Trousseau', 'Bastardo'], ['Poulsard', 'Ploussard'], ['Jacquère', 'Jacquere'], ['Altesse', 'Roussette'], ['Mondeuse'], ['Picpoul', 'Piquepoul', 'Picpoul de Pinet'], ['Bourboulenc'], ['Clairette'], ['Chasselas', 'Fendant', 'Gutedel'], ['Romorantin'], ['Fer Servadou', 'Braucol'], ['Tibouren'], ['Négrette', 'Negrette'],
	['Touriga Nacional', 'Touriga'], ['Touriga Franca'], ['Tinta Barroca'], ['Tinto Cão', 'Tinto Cao'], ['Baga'], ['Alfrocheiro'], ['Trincadeira'], ['Castelão', 'Castelao'], ['Arinto'], ['Encruzado'], ['Fernão Pires', 'Fernao Pires', 'Maria Gomes'], ['Antão Vaz', 'Antao Vaz'], ['Verdelho'], ['Sercial'], ['Bual', 'Boal'], ['Tinta Negra'],
	['Petite Sirah', 'Durif'], ['Norton'], ['Concord'], ['Vidal', 'Vidal Blanc'], ['Seyval Blanc'], ['Marquette'], ['Chambourcin'], ['Baco Noir'], ['Koshu'], ['Mission', 'País', 'Pais', 'Listán Prieto', 'Criolla'], ['Listán Negro', 'Listan Negro'], ['Listán Blanco', 'Listan Blanco'], ['Marselan'], ['Alicante Bouschet'], ['Ruby Cabernet'], ['Charbono'], ['Gouais'],
	['Grolleau'], ['Pineau d\'Aunis'], ['Menu Pineau'], ['Orange Muscat'], ['Muscat Ottonel'], ['Bacchus'], ['Ortega'], ['Huxelrebe'], ['Reichensteiner'], ['Seyval'], ['Solaris'], ['Rondo'], ['Regent']
];

/**
 * The words on a label that describe how a wine was made or what kind it is.
 * Recorded as printed, and 'Extra-Brut' is read through the hyphen because the
 * lookup folds both sides to 'extra brut'.
 */
export const WINE_STYLE: string[] = [
	'Brut', 'Extra Brut', 'Brut Nature', 'Zero Dosage', 'Dosage Zéro', 'Brut Zéro', 'Extra Dry', 'Extra Sec', 'Sec', 'Demi-Sec', 'Demi Sec', 'Doux', 'Dry', 'Off-Dry', 'Off Dry', 'Medium', 'Medium Dry', 'Medium Sweet', 'Sweet', 'Dessert', 'Dessert Wine', 'Late Harvest', 'Vendange Tardive', 'Vendanges Tardives', 'Sélection de Grains Nobles', 'Botrytis',
	'Sparkling', 'Still', 'Rosé', 'Rose', 'Rosado', 'Rosato', 'Red', 'White', 'Orange', 'Amber', 'Skin Contact', 'Skin-Contact', 'Natural', 'Organic', 'Biodynamic', 'Unfiltered', 'Unoaked', 'Oaked', 'Barrel Aged', 'Barrel-Aged', 'Fortified', 'Vin Doux Naturel', 'Pét-Nat', 'Pet-Nat', 'Pet Nat', 'Pétillant Naturel', 'Petillant Naturel', 'Crémant', 'Cremant', 'Frizzante', 'Spumante', 'Metodo Classico', 'Méthode Traditionnelle', 'Methode Traditionnelle', 'Traditional Method', 'Charmat',
	'Blanc de Blancs', 'Blanc de Noirs', 'Rosé de Saignée', 'Grand Cru', 'Premier Cru', '1er Cru', 'Grand Cru Classé', 'Cru Classé', 'Cru Bourgeois', 'Village', 'Villages', 'Vieilles Vignes', 'Old Vine', 'Old Vines', 'Single Vineyard', 'Estate', 'Réserve', 'Reserve', 'Reserva', 'Gran Reserva', 'Riserva', 'Crianza', 'Joven', 'Roble', 'Superiore', 'Classico', 'Secco', 'Amabile', 'Abboccato', 'Passito', 'Ripasso', 'Appassimento', 'Recioto',
	'Kabinett', 'Spätlese', 'Spatlese', 'Auslese', 'Beerenauslese', 'Trockenbeerenauslese', 'Eiswein', 'Icewine', 'Ice Wine', 'Trocken', 'Halbtrocken', 'Feinherb', 'Grosses Gewächs', 'Grosses Gewachs', 'GG', 'Erste Lage', 'Grosse Lage', 'Smaragd', 'Federspiel', 'Steinfeder',
	'Fino', 'Manzanilla', 'Amontillado', 'Oloroso', 'Palo Cortado', 'Cream', 'Tawny', 'Ruby', 'Vintage Port', 'LBV', 'Late Bottled Vintage', 'Colheita', 'Aszú', 'Aszu', 'Puttonyos', 'Szamorodni', 'Eszencia', 'Sur Lie', 'Vin Jaune', 'Ouillé', 'Magnum', 'Half Bottle', 'Half'
];

/**
 * Words that begin the WINE'S name rather than the producer's, so the split on
 * the name line lands between them: 'Penfolds Bin 389 Shiraz' is Penfolds and
 * Bin 389 Shiraz, 'Krug Grande Cuvée' is Krug and Grande Cuvée.
 */
export const WINE_WORDS: string[] = [
	'Bin', 'No.', 'No', 'Cuvée', 'Cuvee', 'Grande Cuvée', 'Grande Cuvee', 'Cuvée Prestige', 'Prestige', 'Lot', 'Solera', 'Selection', 'Sélection', 'Special Selection', 'Collection', 'Signature', 'Series', 'Série', 'Edition', 'Édition', 'Limited Edition', 'Blend', 'Red Blend', 'White Blend', 'Field Blend', 'Proprietary Red', 'Meritage', 'Super Tuscan', 'Sparkling Wine', 'Table Wine', 'Vino', 'Vin', 'Wine'
];

/**
 * Words that carry no meaning of their own inside a descriptor and never make
 * a part unread: the classification initials and the joining words.
 */
export const DESCRIPTOR_FILLER = new Set([
	'igp', 'igt', 'aoc', 'aop', 'ac', 'doc', 'docg', 'do', 'dop', 'ava', 'vqa', 'gi', 'pdo', 'pgi', 'vdp', 'qba', 'qmp', 'dac',
	'de', 'di', 'da', 'del', 'della', 'delle', 'dei', 'du', 'des', 'la', 'le', 'les', 'el', 'los', 'las', 'the', 'of', 'and', '&', 'e', 'y', 'et', 'en', 'in', 'from', 'wine', 'vino', 'vin', 'vinho', 'wein', 'valley', 'hills', 'coast', 'county', 'region', 'district'
]);

/* -------------------------------------------------------------------------
 * Cocktails
 * ---------------------------------------------------------------------- */

/**
 * The spirit WORDS a menu prints, the only source `baseSpirit` may have. A
 * brand is not a spirit word: 'Zacapa' counts as a cocktail signal for the
 * sorter, but the Ledger's own lexicon is what turns a brand into a base, and
 * the desk never derives a spirit from a drink's name.
 */
export const DESK_SPIRITS: string[] = [
	'gin', 'vodka', 'rum', 'rhum', 'rhum agricole', 'cachaça', 'cachaca', 'tequila', 'mezcal', 'mescal', 'raicilla', 'sotol', 'bacanora',
	'whisky', 'whiskey', 'bourbon', 'rye', 'scotch', 'brandy', 'cognac', 'armagnac', 'calvados', 'pisco', 'grappa', 'marc', 'eau de vie', 'eau-de-vie',
	'absinthe', 'aquavit', 'akvavit', 'genever', 'jenever', 'ouzo', 'raki', 'rakia', 'arak', 'baijiu', 'soju', 'shochu', 'moonshine', 'poitín', 'poitin', 'singani', 'aguardiente', 'slivovitz', 'pálinka', 'palinka', 'applejack', 'apple brandy', 'fruit brandy', 'kirsch', 'schnapps', 'korn'
];

/** Brands and bottles a cocktail list names in place of the spirit word. */
export const SPIRIT_BRANDS: string[] = [
	'zacapa', 'hendrick\'s', 'hendricks', 'tanqueray', 'bombay', 'bombay sapphire', 'beefeater', 'plymouth', 'sipsmith', 'monkey 47', 'roku', 'aviation', 'botanist', 'nolet\'s', 'gordon\'s', 'fords', 'ketel one', 'ketel', 'grey goose', 'belvedere', 'tito\'s', 'titos', 'absolut', 'stolichnaya', 'stoli', 'chopin', 'reyka', 'haku',
	'patrón', 'patron', 'don julio', 'casamigos', 'herradura', 'espolòn', 'espolon', 'jose cuervo', 'cuervo', 'fortaleza', 'ocho', 'olmeca', 'altos', 'cazadores', 'milagro', 'siete leguas', 'del maguey', 'montelobos', 'ilegal', 'vida', 'bozal',
	'maker\'s mark', 'makers mark', 'woodford', 'woodford reserve', 'buffalo trace', 'bulleit', 'jack daniel\'s', 'jack daniels', 'jim beam', 'wild turkey', 'knob creek', 'four roses', 'rittenhouse', 'old forester', 'elijah craig', 'evan williams', 'michter\'s', 'michters', 'sazerac rye', 'high west', 'angel\'s envy', 'jameson', 'bushmills', 'redbreast', 'teeling', 'tullamore', 'glenlivet', 'glenfiddich', 'macallan', 'laphroaig', 'lagavulin', 'ardbeg', 'talisker', 'highland park', 'monkey shoulder', 'johnnie walker', 'chivas', 'dewar\'s', 'dewars', 'famous grouse', 'suntory', 'toki', 'nikka', 'yamazaki', 'hibiki', 'hakushu',
	'bacardi', 'havana club', 'mount gay', 'appleton', 'plantation', 'planteray', 'diplomático', 'diplomatico', 'flor de caña', 'flor de cana', 'el dorado', 'smith & cross', 'wray & nephew', 'wray and nephew', 'goslings', 'gosling\'s', 'myers\'s', 'myers', 'kraken', 'captain morgan', 'sailor jerry', 'malibu', 'clément', 'clement', 'rhum jm', 'la favorite', 'neisson', 'don q', 'ron zacapa', 'brugal', 'barceló', 'barcelo', 'santa teresa', 'abuelo',
	'hennessy', 'rémy martin', 'remy martin', 'martell', 'courvoisier', 'pierre ferrand', 'hine', 'delamain', 'boulard', 'christian drouin', 'metaxa', 'torres', 'st-rémy', 'st remy', 'pernod', 'ricard', 'la fée', 'st. george', 'st george'
];

/**
 * Liqueurs, amari, vermouths, fortified wines and bitters: everything that
 * goes into a glass and is neither a spirit nor a mixer. A part of a spec that
 * names one of these makes the list a spec.
 */
export const LIQUEURS: string[] = [
	'benedictine', 'bénédictine', 'b&b', 'chartreuse', 'green chartreuse', 'yellow chartreuse', 'cointreau', 'triple sec', 'curaçao', 'curacao', 'blue curaçao', 'orange curaçao', 'dry curaçao', 'grand marnier', 'campari', 'aperol', 'select', 'amaro', 'amaro nonino', 'nonino', 'fernet', 'fernet-branca', 'fernet branca', 'branca menta', 'cynar', 'montenegro', 'averna', 'ramazzotti', 'braulio', 'lucano', 'meletti', 'sfumato', 'amaro ciociaro', 'suze', 'salers', 'gentiane', 'lillet', 'lillet blanc', 'lillet rosé', 'dubonnet', 'cap corse', 'byrrh', 'bonal', 'cocchi', 'cocchi americano', 'cocchi torino', 'carpano', 'carpano antica', 'antica formula', 'punt e mes', 'dolin', 'noilly prat', 'martini rosso', 'martini bianco', 'martini extra dry', 'cinzano', 'mancino', 'vermouth', 'sweet vermouth', 'dry vermouth', 'red vermouth', 'white vermouth', 'blanc vermouth', 'bianco vermouth', 'rosso vermouth', 'vermut', 'quinquina', 'americano',
	'sherry', 'fino', 'manzanilla', 'amontillado', 'oloroso', 'palo cortado', 'pedro ximénez', 'pedro ximenez', 'px', 'port', 'ruby port', 'tawny port', 'white port', 'madeira', 'marsala', 'sake', 'umeshu', 'mirin',
	'limoncello', 'amaretto', 'disaronno', 'frangelico', 'kahlúa', 'kahlua', 'tia maria', 'mr black', 'baileys', 'irish cream', 'drambuie', 'galliano', 'sambuca', 'strega', 'maraschino', 'luxardo', 'cherry heering', 'heering', 'chambord', 'crème de cassis', 'creme de cassis', 'cassis', 'crème de mûre', 'creme de mure', 'crème de cacao', 'creme de cacao', 'crème de menthe', 'creme de menthe', 'crème de violette', 'creme de violette', 'crème de pêche', 'creme de peche', 'crème de framboise', 'crème de banane', 'crème de noyaux', 'midori', 'st-germain', 'st germain', 'st. germain', 'elderflower liqueur', 'italicus', 'falernum', 'velvet falernum', 'allspice dram', 'pimento dram', 'ancho reyes', 'licor 43', 'cuarenta y tres', 'kümmel', 'kummel', 'jägermeister', 'jagermeister', 'becherovka', 'unicum', 'zwack', 'pastis', 'anisette', 'pimm\'s', 'pimms', 'southern comfort', 'bols', 'giffard', 'marie brizard', 'de kuyper', 'tempus fugit', 'apricot liqueur', 'apricot brandy', 'peach liqueur', 'peach schnapps', 'coffee liqueur', 'chocolate liqueur', 'banana liqueur', 'melon liqueur', 'ginger liqueur', 'domaine de canton', 'liqueur', 'liquor', 'aperitivo', 'aperitif', 'apéritif', 'digestif', 'amaretto di saronno',
	'bitters', 'angostura', 'peychaud\'s', 'peychauds', 'orange bitters', 'aromatic bitters', 'chocolate bitters', 'celery bitters', 'mole bitters', 'grapefruit bitters', 'tiki bitters', 'fee brothers', 'regans', 'regan\'s', 'absinthe rinse', 'absinthe wash'
];

/**
 * Mixers, juices, syrups, herbs and garnishes: the parts of a spec that are
 * not bottles. They make a list list-shaped but say nothing about which kind
 * of drink it is, because a salad prints lemon and basil too.
 */
export const MIXERS: string[] = [
	'lime', 'lemon', 'orange', 'grapefruit', 'pineapple', 'cranberry', 'apple', 'peach', 'passion fruit', 'passionfruit', 'mango', 'coconut', 'yuzu', 'calamansi', 'pomegranate', 'watermelon', 'raspberry', 'strawberry', 'blackberry', 'blueberry', 'cherry', 'banana', 'pear', 'plum', 'fig', 'guava', 'lychee', 'kiwi', 'melon', 'tamarind', 'hibiscus', 'elderflower', 'rose', 'lavender', 'vanilla', 'cinnamon', 'cardamom', 'clove', 'nutmeg', 'ginger', 'chai', 'chocolate', 'cacao', 'caramel', 'butterscotch', 'honey', 'agave', 'maple', 'demerara', 'sugar', 'simple syrup', 'syrup', 'gomme', 'orgeat', 'grenadine', 'cordial', 'shrub', 'oleo saccharum', 'oleosacrum', 'oleo-saccharum',
	'tonic', 'soda', 'club soda', 'soda water', 'sparkling water', 'ginger beer', 'ginger ale', 'cola', 'coke', 'lemonade', 'sprite', 'prosecco', 'champagne', 'cava', 'sparkling wine', 'sparkling', 'bubbles', 'wine', 'red wine', 'white wine', 'rosé', 'beer', 'lager', 'stout', 'cider', 'kombucha',
	'egg white', 'egg', 'aquafaba', 'cream', 'coconut cream', 'milk', 'oat milk', 'condensed milk', 'coffee', 'espresso', 'cold brew', 'tea', 'earl grey', 'matcha', 'green tea',
	'mint', 'basil', 'rosemary', 'thyme', 'sage', 'dill', 'cucumber', 'celery', 'chilli', 'chili', 'jalapeño', 'jalapeno', 'habanero', 'salt', 'saline', 'pepper', 'black pepper', 'tabasco', 'worcestershire', 'tomato', 'tomato juice', 'clamato', 'juice', 'water', 'ice',
	'olive', 'olives', 'twist', 'peel', 'zest', 'wedge', 'wheel', 'slice', 'rim', 'rimmed', 'foam', 'float', 'garnish', 'dehydrated', 'candied', 'smoked', 'infused', 'fat-washed', 'fat washed', 'washed', 'clarified', 'spiced', 'burnt', 'charred', 'toasted', 'brown butter', 'brown-butter'
];

/** The words a list uses to say how a drink is made or served. */
export const METHOD_WORDS: string[] = [
	'shaken', 'stirred', 'built', 'blended', 'frozen', 'served up', 'straight up', 'on the rocks', 'over ice', 'served long', 'served tall', 'topped', 'top with', 'garnish', 'garnished', 'rinse', 'rinsed', 'muddled', 'swizzled', 'flamed', 'smoked', 'nitro', 'draught cocktail', 'batched', 'coupe', 'rocks glass', 'highball glass', 'nick & nora', 'nick and nora', 'martini glass', 'collins glass', 'julep cup', 'tiki mug', 'copper mug', 'flute'
];

/**
 * The classics, by name. A drink called one of these is a cocktail whatever
 * the heading says, and a menu that prints 'Old Fashioned' has told you what
 * it is.
 */
export const COCKTAIL_NAMES: string[] = [
	'martini', 'negroni', 'old fashioned', 'manhattan', 'daiquiri', 'mojito', 'margarita', 'spritz', 'aperol spritz', 'julep', 'mint julep', 'punch', 'smash', 'swizzle', 'flip', 'toddy', 'hot toddy', 'sling', 'cobbler', 'sour', 'whiskey sour', 'whisky sour', 'pisco sour', 'amaretto sour', 'fizz', 'gin fizz', 'ramos gin fizz', 'collins', 'tom collins', 'mule', 'moscow mule', 'sazerac', 'boulevardier', 'paloma', 'caipirinha', 'caipiroska', 'espresso martini', 'bellini', 'mimosa', 'bloody mary', 'cosmopolitan', 'cosmo', 'gimlet', 'sidecar', 'white lady', 'corpse reviver', 'last word', 'aviation', 'paper plane', 'penicillin', 'jungle bird', 'mai tai', 'zombie', 'painkiller', 'hurricane', 'vieux carré', 'vieux carre', 'french 75', 'bee\'s knees', 'bees knees', 'clover club', 'southside', 'bramble', 'dark and stormy', 'dark \'n\' stormy', 'piña colada', 'pina colada', 'tommy\'s margarita', 'mezcal margarita', 'gold rush', 'brown derby', 'blood and sand', 'rob roy', 'rusty nail', 'godfather', 'black russian', 'white russian', 'long island', 'long island iced tea', 'sex on the beach', 'tequila sunrise', 'sangria', 'michelada', 'americano', 'sbagliato', 'negroni sbagliato', 'garibaldi', 'hugo', 'kir', 'kir royale', 'french martini', 'porn star martini', 'pornstar martini', 'lychee martini', 'dirty martini', 'vesper', 'gibson', 'martinez', 'hanky panky', 'bijou', 'old pal', 'toronto', 'brooklyn', 'red hook', 'greenpoint', 'bensonhurst', 'naked and famous', 'division bell', 'oaxaca old fashioned', 'trinidad sour', 'penicillin', 'ward eight', 'jack rose', 'pegu club', 'singapore sling', 'planter\'s punch', 'planters punch', 'rum runner', 'bahama mama', 'blue hawaiian', 'grasshopper', 'brandy alexander', 'stinger', 'b-52', 'irish coffee', 'hot buttered rum', 'mulled wine', 'eggnog', 'shandy', 'radler', 'boilermaker', 'pickleback', 'highball', 'japanese highball', 'whisky highball', 'gin and tonic', 'gin & tonic', 'g&t', 'g & t', 'vodka soda', 'rum and coke', 'cuba libre', 'mocktail', 'shot', 'shooter'
];

/**
 * Where one part of a spec ends and the next begins: a pipe, a bullet, a
 * middle dot, a comma, a slash, a plus, or a dash with spaces round it. The
 * slash is a separator ONLY between words; a fraction like '3/4 oz' is masked
 * before the split (maskFractions) so it stays one part, and there is no
 * lookbehind here because old Safari has none.
 */
export const SPEC_SEP = /\s*(?:[|•·,+]|\/|\s[-–\u2014]\s)\s*/;
/** Past this many characters a "part" is a sentence, not an ingredient. */
export const SPEC_PART_MAX = 34;

/** The slash of a fraction, stood in for by the fraction slash so SPEC_SEP cannot see it. */
const FRACTION_SLASH = /(\d)\s*\/\s*(?=\d)/g;
const FRACTION_MASK = '\u2044';
const MASKED = /\u2044/g;

export function maskFractions(text: string): string {
	return text.replace(FRACTION_SLASH, '$1' + FRACTION_MASK);
}

export function unmaskFractions(text: string): string {
	return text.replace(MASKED, '/');
}

/* -------------------------------------------------------------------------
 * Section vocabulary
 * ---------------------------------------------------------------------- */

export type SectionKind = 'wine' | 'cocktail' | 'spirits' | 'food';

/**
 * What a heading says about everything under it. Phrases, folded, matched as
 * whole words on the folded heading; the longer phrase is tried first so that
 * 'Dessert Wines' is a wine heading and not a pudding. 'Drinks' on its own is
 * deliberately absent: it points at nothing in particular.
 */
export const SECTION_VOCAB: Record<SectionKind, string[]> = {
	wine: [
		'dessert wine', 'dessert wines', 'sweet wine', 'sweet wines', 'sparkling wine', 'sparkling wines', 'house wine', 'house wines', 'wine by the glass', 'wines by the glass', 'by the glass', 'by glass', 'wine by glass', 'wine list', 'wine program', 'wine programme', 'cellar list', 'reserve list', 'half bottles', 'magnums', 'large formats',
		'wine', 'wines', 'vino', 'vini', 'vin', 'vins', 'cellar', 'sommelier', 'sparkling', 'champagne', 'champagnes', 'prosecco', 'cava', 'bubbles', 'rosé', 'rose', 'rosés', 'reds', 'whites', 'red wine', 'white wine', 'red wines', 'white wines', 'orange wine', 'orange wines', 'fortified', 'sherry', 'sherries', 'port', 'ports', 'madeira', 'burgundy', 'bordeaux', 'rhône', 'rhone', 'loire', 'tuscany', 'piedmont', 'rioja', 'sake', 'bottles', 'bottle list'
	],
	cocktail: [
		'signature cocktails', 'house cocktails', 'classic cocktails', 'featured cocktails', 'seasonal cocktails', 'craft cocktails', 'mixed drinks', 'signature drinks', 'zero proof', 'zero-proof', 'no and low', 'no & low', 'low abv', 'non-alcoholic cocktails',
		'cocktail', 'cocktails', 'libations', 'mixology', 'aperitivo', 'aperitivi', 'aperitifs', 'apéritifs', 'digestifs', 'martinis', 'sours', 'highballs', 'spritzes', 'spritz', 'mules', 'margaritas', 'negronis', 'tiki', 'punches', 'punch', 'mocktails', 'shots', 'shooters', 'long drinks', 'coupes'
	],
	spirits: [
		'spirits', 'spirit', 'spirit list', 'whisky', 'whiskies', 'whiskey', 'whiskeys', 'bourbon', 'bourbons', 'scotch', 'single malt', 'single malts', 'malts', 'rye', 'gin', 'gins', 'vodka', 'vodkas', 'rum', 'rums', 'tequila', 'tequilas', 'mezcal', 'mezcals', 'agave', 'brandy', 'brandies', 'cognac', 'cognacs', 'armagnac', 'calvados', 'grappa', 'grappas', 'liqueurs', 'amari', 'amaro', 'eaux de vie',
		'beer', 'beers', 'draft', 'draught', 'on tap', 'tap', 'taps', 'bottled beer', 'bottles and cans', 'cans', 'cider', 'ciders', 'lager', 'lagers', 'ale', 'ales', 'ipa', 'ipas', 'stout', 'stouts', 'craft beer', 'craft beers', 'soft drinks', 'sodas', 'juices', 'coffee', 'coffees', 'tea', 'teas', 'hot drinks', 'non-alcoholic', 'non alcoholic', 'minerals', 'water', 'waters'
	],
	food: [
		'tasting menu', 'set menu', 'prix fixe', 'chef\'s menu', 'chefs menu', 'three course', 'two course', 'small plates',
		'today\'s specials', 'todays specials', 'chef\'s specials', 'chefs specials', 'house specials', 'seasonal specials', 'weekly specials', 'lunch specials', 'dinner specials', 'sharing plates', 'large plates', 'main courses', 'main course', 'side dishes', 'side orders', 'raw bar', 'from the grill', 'from the sea', 'from the garden', 'from the land', 'to begin', 'to start', 'to finish', 'to share', 'for the table', 'bar snacks', 'kids menu', 'children\'s menu', 'sunday roast', 'sunday lunch', 'cheese board', 'cheese course', 'dessert', 'desserts',
		'starters', 'starter', 'appetizers', 'appetisers', 'appetizer', 'antipasti', 'antipasto', 'primi', 'secondi', 'contorni', 'dolci', 'mains', 'entrées', 'entrees', 'entrée', 'entree', 'puddings', 'pudding', 'sides', 'soups', 'salads', 'soup', 'salad', 'sharing', 'snacks', 'nibbles', 'pasta', 'risotto', 'pizza', 'pizzas', 'sandwiches', 'burgers', 'tacos', 'sushi', 'sashimi', 'nigiri', 'rolls', 'dim sum', 'curries', 'grill', 'grills', 'steaks', 'roasts', 'seafood', 'fish', 'shellfish', 'oysters', 'meat', 'meats', 'poultry', 'vegetables', 'vegetarian', 'vegan', 'plant based', 'plant-based', 'cheese', 'cheeses', 'brunch', 'breakfast', 'lunch', 'dinner', 'supper', 'tasting', 'menu', 'course', 'courses', 'offerings', 'specials', 'daily specials', 'plates', 'bowls', 'kitchen', 'food', 'à la carte', 'a la carte', 'omakase', 'degustation', 'dégustation', 'feast', 'banquet', 'platters', 'boards', 'bites', 'tapas', 'mezze', 'meze', 'thali'
	]
};

/* -------------------------------------------------------------------------
 * Lookups
 * ---------------------------------------------------------------------- */

/** foldName, under the name the rest of this file uses for a lookup key. */
export const foldKey = foldName;

/** Whole-phrase test on a folded string: `phrase` folded appears as whole words in `folded`. */
export function hasPhrase(folded: string, phrase: string): boolean {
	const key = foldKey(phrase);
	if (!key) return false;
	const at = (' ' + folded + ' ').indexOf(' ' + key + ' ');
	return at >= 0;
}

/**
 * The kind a run of headings points at. Both the section heading and the one
 * above it are read ('OUR WINE PROGRAM' then 'WINE BY GLASS'); each kind's
 * phrases are tried longest first and a matched phrase is struck out before
 * the next kind looks, so 'DESSERT WINES' is wine and not also food. Two
 * different kinds on the same run is a heading that points nowhere, and null
 * is the honest answer to that as well as to a heading with no vocabulary.
 */
export function sectionKindOf(headings: string[]): SectionKind | null {
	const found = new Set<SectionKind>();
	for (const heading of headings) for (const kind of strikeSectionVocab(heading).found) found.add(kind);
	if (found.size !== 1) return null;
	return [...found][0];
}

/**
 * True when a heading is NOTHING but section vocabulary: 'SIDES', 'SOUPS &
 * SALADS', 'FROM THE GRILL', 'BURGUNDY WHITE'. Such a line is a heading
 * whatever sits under it. 'TOMATO SOUP' and 'CRAB SALAD' carry a section word
 * and are not this: a word is left over once the vocabulary is struck, and
 * what follows the line decides whether it named a dish or a section.
 */
export function isSectionOnly(heading: string): boolean {
	const { found, rest } = strikeSectionVocab(heading);
	return found.size > 0 && rest === '';
}

/**
 * One heading with its vocabulary struck out: the kinds the phrases named and
 * whatever words were left. A heading that is nothing but a region, a country
 * or a grape ('CHAMPAGNE', 'AUSTRALIA', 'BURGUNDY WHITE') is a wine list's
 * heading whatever the section words say, and counts as struck whole; a weak
 * style alone ('RED') is not enough.
 */
function strikeSectionVocab(heading: string): { found: Set<SectionKind>; rest: string } {
	const found = new Set<SectionKind>();
	let folded = foldKey(heading);
	if (!folded) return { found, rest: '' };
	const d = readDescriptors(heading);
	const wineWhole = d.covered && d.region.length + d.country.length + d.grapes.length > 0;
	if (wineWhole) found.add('wine');
	for (const kind of ['wine', 'cocktail', 'spirits', 'food'] as const) {
		const phrases = [...SECTION_VOCAB[kind]].sort((a, b) => b.length - a.length);
		for (const phrase of phrases) {
			if (!hasPhrase(folded, phrase)) continue;
			found.add(kind);
			folded = (' ' + folded + ' ').split(' ' + foldKey(phrase) + ' ').join(' ').trim().replace(/\s+/g, ' ');
		}
	}
	// 'OUR WINE PROGRAM' and 'THE CELLAR LIST' are section words dressed up:
	// the article and the possessive say nothing about what is under them.
	const rest = wineWhole ? '' : folded.split(' ').filter((w) => w && !HEADING_FILLER.has(w)).join(' ');
	return { found, rest };
}

/** Words a heading wraps its vocabulary in without changing what it names. */
const HEADING_FILLER = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'our', 'your']);

export type WineTerm = 'region' | 'country' | 'grape' | 'style' | 'word';

const WINE_LOOKUP = new Map<string, WineTerm>();
/** The longest phrase in the lookup, in folded words, so the matcher knows how far to look. */
let WINE_PHRASE_MAX = 1;
function learn(term: WineTerm, phrase: string): void {
	const key = foldKey(phrase);
	if (!key) return;
	// First writer wins: a word that is both a grape and a region ('Montepulciano',
	// 'Lambrusco') is read as whatever list named it first, and the grape list
	// is loaded first because on a descriptor line the grape is the likelier reading.
	if (!WINE_LOOKUP.has(key)) WINE_LOOKUP.set(key, term);
	WINE_PHRASE_MAX = Math.max(WINE_PHRASE_MAX, key.split(' ').length);
}
for (const row of DESK_GRAPES) for (const g of row) learn('grape', g);
for (const r of DESK_REGIONS) learn('region', r);
for (const c of DESK_COUNTRIES) learn('country', c);
for (const s of WINE_STYLE) learn('style', s);
for (const w of WINE_WORDS) learn('word', w);

/** What a folded phrase is, when the wine vocabulary knows it. */
export function wineTermOf(key: string): WineTerm | undefined {
	return WINE_LOOKUP.get(key);
}

export interface WineHit {
	term: WineTerm;
	/** As printed. */
	text: string;
	/** Token index in the line the hit started at. */
	at: number;
	/** Tokens covered. */
	span: number;
}

/**
 * Every vocabulary phrase in a run of tokens, longest match first at each
 * position, each reported as printed. Tokens are folded one by one so that
 * 'Extra-Brut' (one token) and 'Extra Brut' (two) both reach 'extra brut'.
 */
export function wineHits(tokens: string[]): WineHit[] {
	const folded = tokens.map(foldKey);
	const hits: WineHit[] = [];
	let i = 0;
	while (i < tokens.length) {
		let taken = 0;
		for (let n = Math.min(WINE_PHRASE_MAX, tokens.length - i); n >= 1; n--) {
			const key = folded.slice(i, i + n).filter(Boolean).join(' ');
			const term = key ? WINE_LOOKUP.get(key) : undefined;
			if (term) {
				hits.push({ term, text: tokens.slice(i, i + n).join(' '), at: i, span: n });
				taken = n;
				break;
			}
		}
		i += taken || 1;
	}
	return hits;
}

/* The drinks lexicon, folded once. */
const SPIRIT_SET = new Set(DESK_SPIRITS.map(foldKey));
const BRAND_SET = new Set(SPIRIT_BRANDS.map(foldKey));
const LIQUEUR_SET = new Set(LIQUEURS.map(foldKey));
const MIXER_SET = new Set(MIXERS.map(foldKey));
const METHOD_SET = new Set(METHOD_WORDS.map(foldKey));
const NAME_SET = new Set(COCKTAIL_NAMES.map(foldKey));
const DRINK_PHRASE_MAX = 4;

export type DrinkTerm = 'spirit' | 'brand' | 'liqueur' | 'mixer' | 'method' | 'classic';

export interface DrinkHit {
	term: DrinkTerm;
	/** The lexicon's own spelling, folded. */
	key: string;
	/** As printed. */
	text: string;
}

/**
 * Every drinks-lexicon phrase in a piece of text, longest match first at each
 * position. Used by the sorter for its cocktail signals and by the reader for
 * `baseSpirit`, which takes spirit hits only.
 */
export function drinkHits(text: string): DrinkHit[] {
	const tokens = text.split(/\s+/).filter(Boolean);
	const folded = tokens.map(foldKey);
	const hits: DrinkHit[] = [];
	let i = 0;
	while (i < tokens.length) {
		let taken = 0;
		for (let n = Math.min(DRINK_PHRASE_MAX, tokens.length - i); n >= 1; n--) {
			const key = folded.slice(i, i + n).filter(Boolean).join(' ');
			if (!key) continue;
			const term: DrinkTerm | null = SPIRIT_SET.has(key)
				? 'spirit'
				: BRAND_SET.has(key)
					? 'brand'
					: LIQUEUR_SET.has(key)
						? 'liqueur'
						: NAME_SET.has(key)
							? 'classic'
							: METHOD_SET.has(key)
								? 'method'
								: MIXER_SET.has(key)
									? 'mixer'
									: null;
			if (term) {
				hits.push({ term, key, text: tokens.slice(i, i + n).join(' ') });
				taken = n;
				break;
			}
		}
		i += taken || 1;
	}
	return hits;
}

/**
 * The parts of a spec line, as printed, with fractions kept whole: '3/4 oz
 * lime' is one part and never '4 oz'. A trailing full stop is the sentence's
 * and comes off; nothing else moves.
 */
export function splitSpec(text: string): string[] {
	return maskFractions(text)
		.split(SPEC_SEP)
		.map((p) => unmaskFractions(p).trim().replace(/\.$/, ''))
		.filter(Boolean);
}

/**
 * Is this a printed LIST of parts, or prose? Two or more parts, each short,
 * no full stop in the middle of a sentence, and at least one part the drinks
 * lexicon recognises as a bottle or a mixer. The last clause is what stops
 * 'Our house take on a classic, shaken hard and served long' becoming four
 * bogus ingredients.
 */
export function isSpecList(text: string): boolean {
	const t = text.trim();
	if (!t || /[.!?]\s+\S/.test(t)) return false;
	const parts = splitSpecMasked(t);
	if (parts.length < 2) return false;
	if (parts.some((p) => p.length > SPEC_PART_MAX)) return false;
	return parts.some((p) => drinkHits(p).some((h) => h.term !== 'method' && h.term !== 'classic'));
}

/** splitSpec on text whose fractions are masked first, the way isSpecList needs it. */
function splitSpecMasked(text: string): string[] {
	return maskFractions(text)
		.split(SPEC_SEP)
		.map((p) => unmaskFractions(p).trim())
		.filter(Boolean);
}

/**
 * A printed list of ingredients under a DISH, by the same shape test without
 * the drinks lexicon: 'Burrata | heritage tomato | basil' is a list, and
 * 'Chilled soup of young coconut, Louisiana blue crab roe and local mirliton'
 * is a sentence with commas in it. Two or more parts, every part short, no
 * sentence punctuation, and no part that reads as a clause.
 */
export function isIngredientList(text: string): boolean {
	const t = text.trim();
	if (!t || /[.!?]\s+\S/.test(t)) return false;
	const parts = splitSpecMasked(t);
	if (parts.length < 2) return false;
	if (parts.some((p) => p.length > SPEC_PART_MAX || p.split(/\s+/).length > 4)) return false;
	return !parts.some((p) => /\b(?:with|and|served|over|topped|finished|in a|on a)\b/i.test(p));
}

/**
 * Style words that are also ordinary English. They still READ a descriptor
 * part ('Dry' in 'Dry, Sussex, England' is covered), but they never count as
 * a wine signal for the sorter, because 'Sweet & Spicy Summer Salad' and
 * 'Creole Cream Cheese Cheesecake' print them too.
 */
export const WEAK_STYLE = new Set(
	['dry', 'sweet', 'red', 'white', 'orange', 'amber', 'cream', 'still', 'medium', 'half', 'estate', 'village', 'villages', 'natural', 'organic', 'reserve', 'sec', 'dessert', 'magnum', 'smoked', 'ruby'].map(foldKey)
);

/** Where one descriptor part ends and the next begins: a comma, a pipe, a bullet, a slash between words, a spaced dash. */
const DESCRIPTOR_SEP = /\s*(?:[|•·,;]|\s\/\s|\s[-–\u2014]\s)\s*/;

export interface Descriptors {
	/** The parts as printed. */
	parts: string[];
	region: string[];
	country: string[];
	grapes: string[];
	style: string[];
	/** The parts the vocabulary could not read whole, as printed. */
	unread: string[];
	/** True when every part was read: the row can be high on this line. */
	covered: boolean;
	/**
	 * The hits that sat inside a part read WHOLE. 'aged Sherry' in a soup's
	 * description names a region, and it is a soup; a hit only counts as a
	 * wine signal when the part around it is nothing but wine vocabulary.
	 */
	coveredHits: WineHit[];
	/** The vintage, when a part carried one. */
	vintage: string;
}

/**
 * Reads a descriptor line ('Extra-Brut, Champagne, France') part by part
 * against the wine vocabulary. A part is READ when every token in it is a
 * vocabulary phrase, a filler word, a vintage or a bin-style number; a part
 * with any other token is unread and kept as printed, so 'Cuvée Marguerite'
 * and 'Other People's Pinot' reach the review row exactly as the list wrote
 * them and mark it low. Hits are recorded as printed, never as the canonical
 * spelling.
 */
export function readDescriptors(text: string): Descriptors {
	const out: Descriptors = { parts: [], region: [], country: [], grapes: [], style: [], unread: [], covered: true, coveredHits: [], vintage: '' };
	const parts = text.split(DESCRIPTOR_SEP).map((p) => p.trim()).filter(Boolean);
	out.parts = parts;
	for (const part of parts) {
		const tokens = part.split(/\s+/).filter(Boolean);
		const hits = wineHits(tokens);
		const taken = new Array<boolean>(tokens.length).fill(false);
		for (const h of hits) {
			for (let i = h.at; i < h.at + h.span; i++) taken[i] = true;
		}
		let read = true;
		for (let i = 0; i < tokens.length; i++) {
			if (taken[i]) continue;
			const key = foldKey(tokens[i]);
			if (!key || DESCRIPTOR_FILLER.has(key)) continue;
			const vintage = VINTAGE.exec(' ' + tokens[i]);
			if (vintage) {
				if (!out.vintage) out.vintage = vintage[1];
				continue;
			}
			read = false;
		}
		// Fields come from parts read WHOLE. 'Red Label' carries a style word and
		// is a wine's name; recording 'Red' from it would be half a reading
		// presented as a fact, and the part is kept as printed instead.
		if (read) {
			out.coveredHits.push(...hits);
			for (const h of hits) {
				if (h.term === 'region') out.region.push(h.text);
				else if (h.term === 'country') out.country.push(h.text);
				else if (h.term === 'grape') out.grapes.push(h.text);
				else if (h.term === 'style') out.style.push(h.text);
			}
		} else {
			out.unread.push(part);
			out.covered = false;
		}
	}
	return out;
}

/**
 * True when a line is nothing but wine vocabulary, the shape of a descriptor
 * ('Champagne, France', 'Chardonnay') and not of a name. The reader uses it to
 * keep such a line on the bottle above rather than starting a new row when a
 * price follows it, which is how a cellar list lays its bins out.
 */
export function isDescriptorLine(text: string): boolean {
	const d = readDescriptors(text);
	return d.parts.length > 0 && d.covered && (d.region.length + d.country.length + d.grapes.length + d.style.length) > 0;
}
