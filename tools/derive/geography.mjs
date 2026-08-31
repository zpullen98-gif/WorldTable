/**
 * geography.mjs: where every chapter sits on the map.
 *
 * The rail used to be flat. Fifty-two world cuisines shared one heading called
 * "World Cuisines", which was tolerable at ten chapters and unusable at fifty,
 * and the nine US super-regions sat at the same level as the entire rest of the
 * world, so New England outranked Asia. This gives the book two levels:
 * continent, then country, with the chapter as the leaf.
 *
 *   Asia > China > Sichuan
 *   Europe > Italy > Emilia-Romagna
 *   United States > The South > Cajun & Creole
 *
 * The United States is one entry at continent level rather than nine, which is
 * what the fifty states always should have been. Its second level keeps the
 * super-regions the original guide used, because they earn their place: fifty
 * states in one list is the same failure the world cuisines had.
 *
 * A country holding one chapter is normal and stays: Japan > Japanese reads
 * correctly and costs nothing, while collapsing it would make the one country
 * with five chapters look like an exception rather than the point.
 *
 * The Atlases have no country because they are not places. They stay flat.
 *
 * EVERY CHAPTER MUST APPEAR HERE. build-data fails if one does not, because the
 * alternative is a chapter that silently vanishes from the rail: it would still
 * be reachable by URL and by search, so nothing would look broken, and nobody
 * would notice for months.
 */

/** continent -> country -> chapter names */
export const ATLAS_OF_CHAPTERS = {
	Asia: {
		China: ['Chinese', 'Sichuan', 'Cantonese', 'Jiangnan', 'Northern Chinese'],
		India: [
			'Indian',
			'Punjabi & North Indian',
			'Tamil & the South',
			'Bengali',
			'Kerala & the Malabar Coast'
		],
		Japan: ['Japanese'],
		Korea: ['Korean'],
		Thailand: ['Thai'],
		Vietnam: ['Vietnamese'],
		Indonesia: ['Indonesian'],
		Malaysia: ['Malaysian'],
		'The Philippines': ['Filipino'],
		'Sri Lanka': ['Sri Lankan'],
		Myanmar: ['Burmese'],
		Iran: ['Persian'],
		Turkey: ['Turkish'],
		/* Levantine is Lebanon, Syria, Palestine and Jordan; the older "Middle
		   Eastern" chapter predates it and covers the wider region, so the two
		   sit together rather than pretending to be one country. */
		'The Levant & the Gulf': ['Levantine', 'Middle Eastern'],
		Georgia: ['Georgian'],
		'The Caucasus & Central Asia': ['Caucasus & Central Asian']
	},
	Europe: {
		Italy: ['Italian', 'Emilia-Romagna', 'Sicilian'],
		France: ['French'],
		Spain: ['Spanish'],
		Portugal: ['Portuguese'],
		Greece: ['Greek'],
		Germany: ['German'],
		Austria: ['Austrian'],
		Hungary: ['Hungarian'],
		Britain: ['British'],
		Ireland: ['Irish'],
		Scandinavia: ['Scandinavian'],
		'Russia & Ukraine': ['Russian & Ukrainian'],
		'Central & Eastern Europe': ['Eastern European']
	},
	Africa: {
		Morocco: ['Moroccan'],
		Ethiopia: ['Ethiopian'],
		'East Africa': ['East African'],
		'West Africa': ['West African']
	},
	'The Americas': {
		Mexico: ['Mexican', 'Oaxacan', 'Yucatecan'],
		Peru: ['Peruvian'],
		Brazil: ['Brazilian'],
		Argentina: ['Argentine'],
		'South America': ['South American'],
		'The Caribbean': ['Caribbean']
	},
	'United States': {
		'New England': [
			'Maine',
			'New Hampshire',
			'Vermont',
			'Massachusetts',
			'Rhode Island',
			'Connecticut'
		],
		'Mid-Atlantic': [
			'New York',
			'New Jersey',
			'Pennsylvania',
			'Delaware',
			'Maryland',
			'Virginia',
			'West Virginia'
		],
		'The South': [
			'North Carolina',
			'South Carolina',
			'Georgia',
			'Florida',
			'Alabama',
			'Mississippi',
			'Arkansas',
			'Kentucky',
			'Tennessee',
			'New Orleans',
			'Cajun & Creole'
		],
		'The Midwest': [
			'Ohio',
			'Indiana',
			'Illinois',
			'Michigan',
			'Wisconsin',
			'Minnesota',
			'Iowa',
			'Missouri'
		],
		'The Plains': ['Kansas', 'Nebraska', 'North Dakota', 'South Dakota', 'Oklahoma'],
		'The Southwest': ['Texas', 'New Mexico', 'Arizona', 'Nevada', 'Utah', 'Colorado'],
		'The Mountain West': ['Idaho', 'Montana', 'Wyoming'],
		'The Pacific': ['California', 'Oregon', 'Washington', 'Alaska', 'Pacific & Hawaiian'],
		'American Table': ['American']
	}
};

/** The order continents appear in the rail. Home first, then east to west. */
export const CONTINENT_ORDER = [
	'Europe',
	'Asia',
	'Africa',
	'The Americas',
	'United States',
	'The Atlases'
];

/* Reverse index, built once. */
const PLACE = new Map();
for (const [continent, countries] of Object.entries(ATLAS_OF_CHAPTERS)) {
	for (const [country, chapters] of Object.entries(countries)) {
		for (const name of chapters) PLACE.set(name, { continent, country });
	}
}

/**
 * Where a chapter sits, or null if the atlas has never heard of it.
 * The caller decides what to do about null; build-data fails the build.
 */
export function placeOf(name) {
	return PLACE.get(name) ?? null;
}

/** Every chapter name the atlas knows, for the gate. */
export function placedChapters() {
	return [...PLACE.keys()];
}
