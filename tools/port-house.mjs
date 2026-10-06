#!/usr/bin/env node
/**
 * port-house.mjs: the House's ten TypeScript modules as ONE classic script,
 * static/shared/oot-house.js, for the two plain wings and the hub.
 *
 *   node tools/port-house.mjs            writes static/shared/oot-house.js
 *   node tools/port-house.mjs --dry-run  generates and asserts, writes nothing
 *
 * Then `node tools/check-port-house.mjs` proves the written file says what
 * the TypeScript says, and the site's check-mirror holds the copy under
 * shared/ to these bytes. Run both after any change under src/lib/house.
 *
 * WHAT THE PORT INSTALLS. One IIFE over the ten modules, in dependency
 * order, and a door out that puts two things on window.OOT:
 *
 *   OOT.house     the api from createHouseApi, over the browser's IndexedDB
 *                 (idbStorage) when the window offers one, else over a Map
 *                 (mapStorage) with OOT.house.volatile set true, so a wing
 *                 can say that nothing will survive the page.
 *   OOT.houseLib  every pure export a wing or a Node check may want to call
 *                 on its own: the normaliser, the validator, the merge, the
 *                 sync and its three adapters, the pack reader and builder,
 *                 the drills, mintId, the constants, mapStorage and
 *                 createHouseApi itself.
 *
 * The door reads the window's indexedDB behind a try, so a browser whose
 * storage throws when touched (private mode on some phones) falls to the Map
 * rather than failing at load. Nothing is read or written at load: the wing
 * calls OOT.house.ready() when its own boot is ready for the house, and the
 * api reads then, never earlier. A second load leaves the first install
 * standing. The pack the api builds is stamped from the path the script was
 * loaded on (ledger, codex, else table).
 *
 * The engine (the transpile, the strip, the collision rule, the clean gate)
 * is port-core.mjs's and is explained there; the Menu Desk port shares it,
 * so the two ports cannot drift from each other. Every comment in the ten
 * modules ships here, which is why none may carry a dash of any spelling.
 */
import path from 'node:path';
import { ROOT, unitsIn, portModules, assertClean, writePorts, runMain } from './port-core.mjs';

/* The engine's pieces check-port-house.mjs reads through this file. */
export { DASH, assertClean } from './port-core.mjs';

/**
 * The one place the shipped engine may spell the secure scheme: the video
 * allowlist's constant in house-schema.ts (VIDEO_SCHEME), which a link is
 * compared against and never fetched. Everything else stays the rule it
 * was: the file names no address, so outside that one declaration the
 * letters of the scheme appear nowhere, and the declaration appears exactly
 * once. check-port-house.mjs asks the same question through this function.
 */
export const SCHEME_ALLOWANCE = "VIDEO_SCHEME = 'https'";

/**
 * Why the text names an address, or '' when it does not.
 * @param {string} text
 * @returns {string}
 */
export function namesAddress(text) {
	const pieces = text.split(SCHEME_ALLOWANCE);
	if (pieces.length - 1 > 1) return 'oot-house.js declares the video scheme ' + (pieces.length - 1) + ' times; it may declare it once';
	if (pieces.join('').includes('http')) return 'oot-house.js names an address: it carries "http" outside the video scheme\'s one declaration, and a shipped file may name no host';
	return '';
}

const HOUSE = path.join(ROOT, 'src', 'lib', 'house');

/**
 * The ten, in dependency order: each may use only what sits above it.
 * house-drills imports the schema and the lines (wordCount, for the
 * graders' word caps) and could sit anywhere below them and above the api;
 * it sits beside the pack so the api, which imports nothing of the drills,
 * closes the list.
 */
export const MODULES = [
	'house-schema',
	'house-lines',
	'house-normalise',
	'house-validate',
	'house-merge',
	'house-sync',
	'house-store',
	'house-pack',
	'house-drills',
	'house-api'
];

/** Where the port goes, and the one name the door leaves on the window. */
export const TARGET = path.join(ROOT, 'static', 'shared', 'oot-house.js');
export const GLOBAL = 'OOT';

/**
 * What OOT.houseLib carries, grouped as the door spells it: a name on the
 * left is the key, a name on the right is the module's own export. Every
 * name on the right must be declared by some module, which portModules
 * checks through `expects` before a byte is written.
 */
export const LIB = {
	/* reading and checking a record */
	normaliseHouse: 'normaliseHouse',
	normaliseMark: 'normaliseMark',
	markKind: 'markKind',
	forbiddenKeys: 'forbiddenKeys',
	validateHouse: 'validateHouse',
	onPage: 'onPage',
	/* the lines */
	hasDash: 'hasDash',
	stripDashes: 'stripDashes',
	wordCount: 'wordCount',
	lineProblems: 'lineProblems',
	/* the labels and caps a screen reads at the top level, beside their place under constants */
	DISH_PARTS: 'DISH_PARTS',
	COCKTAIL_PARTS: 'COCKTAIL_PARTS',
	WINE_PARTS: 'WINE_PARTS',
	LINE_CAPS: 'LINE_CAPS',
	PRINCIPLES: 'PRINCIPLES',
	BUILD_STEPS: 'BUILD_STEPS',
	/* merging and syncing */
	mergeHouse: 'mergeHouse',
	mergeItem: 'mergeItem',
	mergeKept: 'mergeKept',
	pickMark: 'pickMark',
	sameJson: 'sameJson',
	lastTouch: 'lastTouch',
	listOfKind: 'listOfKind',
	syncIn: 'syncIn',
	syncOut: 'syncOut',
	adapterFrom: 'adapterFrom',
	adapterFor: 'adapterFor',
	listFor: 'listFor',
	foldHouseName: 'foldHouseName',
	foldBarName: 'foldBarName',
	wineDisplayName: 'wineDisplayName',
	/* the pack */
	readPack: 'readPack',
	buildPack: 'buildPack',
	importPack: 'importPack',
	packSlug: 'packSlug',
	packFilename: 'packFilename',
	mergeSaid: 'mergeSaid',
	countItems: 'countItems',
	restampHouse: 'restampHouse',
	/* a newer edition of a shipped pack, by the edition rule (api.ensurePack is the door) */
	refreshEdition: 'refreshEdition',
	editionStamp: 'editionStamp',
	editionItemStamp: 'editionItemStamp',
	editionBuiltAt: 'editionBuiltAt',
	/* the drills */
	dealQuestion: 'dealQuestion',
	drillableCounts: 'drillableCounts',
	readyKinds: 'readyKinds',
	buildFlashcards: 'buildFlashcards',
	/* Say it back and Guest at the table, graded offline: also under drills */
	gradeSaid: 'gradeSaid',
	gradeScenario: 'gradeScenario',
	sayable: 'sayable',
	roleable: 'roleable',
	numberWords: 'numberWords',
	/* the schema's helpers */
	mintId: 'mintId',
	emptyHouse: 'emptyHouse',
	isMark: 'isMark',
	isNote: 'isNote',
	/* the videos: the link rule, the rows an optional list holds, what a card and the study view list */
	videoUrlOk: 'videoUrlOk',
	videosFor: 'videosFor',
	videoGroups: 'videoGroups',
	videoMeta: 'videoMeta',
	houseRows: 'houseRows',
	optionalList: 'optionalList',
	/* the components: an item's, grouped by kind, and the videos that teach one */
	componentsFor: 'componentsFor',
	componentGroups: 'componentGroups',
	componentVideos: 'componentVideos',
	/* the tastings: a tasting's name the short way a card or a heading wants it */
	tastingShortName: 'tastingShortName',
	/* the bottle list and the tiers */
	wineListOf: 'wineListOf',
	printedDollars: 'printedDollars',
	inBottleBand: 'inBottleBand',
	foldSize: 'foldSize',
	/* the store and the api */
	mapStorage: 'mapStorage',
	idbStorage: 'idbStorage',
	asIndex: 'asIndex',
	measureHouse: 'measureHouse',
	storeSaid: 'storeSaid',
	readIndex: 'readIndex',
	listHouses: 'listHouses',
	loadHouse: 'loadHouse',
	createHouseApi: 'createHouseApi'
};

/** The three adapters under OOT.houseLib.adapters, by the kind of item each wing keeps and by their own names. */
export const ADAPTERS = { dish: 'tableDish', wine: 'codexWine', cocktail: 'ledgerCocktail', tableDish: 'tableDish', codexWine: 'codexWine', ledgerCocktail: 'ledgerCocktail' };

/** The fifteen generators under OOT.houseLib.drills, beside the four functions in LIB and the drill constants. */
export const DRILLS = ['lineToDish', 'sauceOf', 'sidesOf', 'firstPickFor', 'zeroProofFor', 'termToGuest', 'sayIt', 'mixUp', 'wineGrapes', 'wineGoesWith', 'cocktailGlass', 'cocktailSpec', 'producerOf', 'producerWhere', 'producerDish'];
/** The offline graders and their listings, under OOT.houseLib.drills and at the top level of OOT.houseLib (through LIB). */
export const GRADERS = ['gradeSaid', 'gradeScenario', 'sayable', 'roleable', 'numberWords'];
export const DRILL_CONSTANTS = ['DRILL_KINDS', 'DRILL_LABELS', 'DRILL_FLOORS', 'DRILL_FLOOR', 'PRODUCER_FLOOR', 'PRODUCER_KINDS', 'OPTION_COUNT', 'LINE_LABELS', 'FLASHCARD_KINDS', 'GRADE_MET', 'GRADE_CLOSE', 'CAP_NAMES'];

/** The constants under OOT.houseLib.constants: the schema's, the caps, the key regex and the validator's lists. */
export const CONSTANTS = [
	'HOUSE_FORMAT', 'HOUSE_SCHEMA_VERSION', 'HOUSE_INDEX_KEY', 'HOUSE_DB', 'HOUSE_STORE', 'HOUSE_MAX_BYTES',
	'PROSE_MAX', 'LIST_MAX', 'LINE_CAPS', 'PRINCIPLES', 'DISH_PARTS', 'COCKTAIL_PARTS', 'WINE_PARTS',
	'BUILD_STEPS', 'ITEM_KINDS', 'HOUSE_LISTS', 'DISH_MARKS', 'WINE_MARKS', 'COCKTAIL_MARKS', 'MARK_FIELDS',
	'ID_PREFIXES', 'KEYS', 'KEPT_CAP', 'MARK_KINDS', 'FORBIDDEN_KEY', 'DASH', 'DASH_SOURCE',
	'OPTIONAL_KEYS', 'WINE_LISTS', 'BOTTLE_TIERS', 'BOTTLE_BANDS', 'HALF_SIZE', 'BOTTLE_WORDS',
	'OPTIONAL_LISTS', 'VIDEO_SCHEME', 'VIDEO_HOSTS', 'VIDEO_WHY_WORDS', 'VIDEO_URL_MAX', 'VIDEO_TOPIC_NONE',
	'COMPONENT_KINDS', 'COMPONENT_LABELS', 'COMPONENT_WORDS', 'COMPONENT_FLOORS', 'COMPARE_APPS', 'COMPARE_MAX', 'COMPARE_WORDS', 'TASTING_WORDS',
	'PRODUCER_TYPES', 'PRODUCER_GROUPS', 'PRODUCER_WORDS', 'PRODUCER_MAX',
	'FATAL_CODES', 'NEVER_FATAL', 'ALLERGEN_TALK', 'ALLERGEN_WORD', 'QUOTE_WORDS',
	'PACK_FORMAT', 'PACK_VERSION', 'MY_HOUSE', 'MAP_HOUSE_PREFIX', 'NO_HOUSE_SAID', 'HOUSE_PARTS', 'CARD_KEYS', 'ITEM_FIELDS', 'PUT_LISTS'
];

/* -------------------------------------------------------------------------
 * The words around the modules
 * ---------------------------------------------------------------------- */

/**
 * The comment block at the top of the file. Written dash-free on purpose,
 * and without any address, since the shipped file may name no host.
 * @param {string} date the day of the run, as YYYY-MM-DD
 * @returns {string}
 */
export function header(date) {
	return [
		'/* Outside Of Time, shared/oot-house.js: the House engine as one classic script.',
		`   GENERATED by WorldTable/tools/port-house.mjs from src/lib/house on ${date}; never hand-edited;`,
		'   regenerate with node tools/port-house.mjs and mirror it byte for byte to the site.',
		'',
		'   WHAT THIS IS. The House: one record per venue (its card, its dishes, wines',
		'   and cocktails with her marks, its tastings, lexicon, scenarios, mix-ups,',
		'   must-knows, the questions for lineup, the videos and the components: the',
		'   ingredients, techniques and stories each item is made of, one card each,',
		'   and the producer behind a component when a profile was written),',
		'   kept in the browser and shared',
		'   by the three craft wings. The schema (house-schema.ts), the lines and',
		'   their caps (house-lines.ts), the normaliser (house-normalise.ts), the',
		'   validator (house-validate.ts), the merge (house-merge.ts), the sync with',
		"   each wing's own rows (house-sync.ts), the store (house-store.ts), the pack",
		'   (house-pack.ts), the drills (house-drills.ts) and the api (house-api.ts),',
		"   transpiled from the World Table's TypeScript and joined into one script",
		'   for a wing that has no bundler.',
		'',
		'   WHAT IT INSTALLS. window.OOT.house is the api over the browser\'s IndexedDB,',
		'   or over a Map with house.volatile true when the window offers none; nothing',
		'   is read or written at load, and a wing calls OOT.house.ready() when its own',
		'   boot is ready for the house. window.OOT.houseLib carries every pure',
		'   function and constant the modules export, so a wing and a Node check can',
		'   call the normaliser, the validator, the merge, the sync, the pack reader',
		'   and the drills on their own, the offline graders among them (gradeSaid',
		'   and gradeScenario, no model and no network). A wing hands the pack it',
		'   ships to OOT.house.ensurePack at boot: added when the device lacks it,',
		'   refreshed by a newer edition with every touch of a person kept.',
		'',
		'   THE RULES TRAVEL WITH THE CODE. No allergen field exists on any shape and',
		'   the normaliser drops any key the client would refuse, at every depth. A',
		'   price is a string as printed, never a number. A video is a link out to',
		'   YouTube or Vimeo on the secure scheme (VIDEO_HOSTS), checked and never',
		'   fetched: the engine plays nothing and names no other address. A mark',
		"   is { value, by, ts, model? } and kept means by is 'person': a person's mark beats hers whatever",
		'   the stamps, and an unkept mark reaches no drill. No prose carries a dash.',
		'   WorldTable/tools/check-port-house.mjs runs the fixture through this file',
		'   and through the TypeScript and exits 1 on any difference. A fix belongs',
		'   in the TypeScript, with its tests, and reaches this file by regeneration;',
		'   an edit made here is lost on the next run, which is the point.',
		'',
		'   WHY ONE FILE. The wings load classic scripts into one global scope. Ten',
		'   files would put several hundred private names into that scope beside',
		"   every other file's names, and the first collision would be a silent",
		'   overwrite. One IIFE keeps them all in; what comes out is OOT.house and',
		'   OOT.houseLib, and nothing else.',
		'',
		'   ON THE ESCAPES. Every character outside ASCII inside a regex literal is',
		"   written as a \\uXXXX escape by the generator, because the site's publish",
		'   gate counts em dashes across the tree and a dash inside a character',
		'   class, shipped once more, would spend the baseline.',
		'*/'
	].join('\n');
}

/**
 * The door out: the lib object, the storage chosen by what the window
 * offers, the api built once, both installed on window.OOT and the first
 * install left standing on a second load.
 * @returns {string[]}
 */
export function door() {
	const libLines = Object.entries(LIB).map(([key, name]) => `\t${key}: ${name},`);
	const adapterLines = Object.entries(ADAPTERS).map(([key, name]) => `\t\t${key}: ${name},`);
	const drillLines = [...DRILLS, ...GRADERS, ...DRILL_CONSTANTS].map((name) => `\t\t${name}: ${name},`);
	const constantLines = CONSTANTS.map((name) => `\t\t${name}: ${name},`);
	const trimComma = (/** @type {string[]} */ lines) => lines.map((l, i) => (i === lines.length - 1 ? l.replace(/,$/, '') : l));
	return [
		'/* The window, or whatever stands for it: a bare vm context has no window',
		'   and gets the install on its own global, which is what a Node check reads. */',
		"var ootHouseRoot = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});",
		'var ootHouseNamespace = ootHouseRoot.OOT = ootHouseRoot.OOT || {};',
		'var ootHouseLib = {',
		...libLines,
		'\tadapters: {',
		...trimComma(adapterLines),
		'\t},',
		'\tdrills: {',
		...trimComma(drillLines),
		'\t},',
		'\tconstants: {',
		...trimComma(constantLines),
		'\t}',
		'};',
		'/* The storage: IndexedDB when the window offers one (read behind a try, since',
		'   a browser in a private mode may throw on the touch), else a Map that lives',
		'   as long as the page, flagged so a wing can say so. */',
		'function ootHouseHasIndexedDb() {',
		'\ttry {',
		'\t\treturn !!ootHouseRoot.indexedDB;',
		'\t} catch (e) {',
		'\t\treturn false;',
		'\t}',
		'}',
		'/* The app the pack is stamped from: the path the script was loaded on. */',
		'function ootHouseFrom() {',
		'\tvar p = \'\';',
		'\ttry {',
		"\t\tp = ootHouseRoot.location && typeof ootHouseRoot.location.pathname === 'string' ? ootHouseRoot.location.pathname : '';",
		'\t} catch (e) {',
		'\t\tp = \'\';',
		'\t}',
		"\tif (p.indexOf('/ledger/') === 0) return 'ledger';",
		"\tif (p.indexOf('/codex/') === 0) return 'codex';",
		"\treturn 'table';",
		'}',
		'function ootHouseInstall() {',
		'\tvar volatile = !ootHouseHasIndexedDb();',
		'\tvar storage = volatile ? mapStorage() : idbStorage(ootHouseRoot);',
		"\tvar win = typeof ootHouseRoot.addEventListener === 'function' ? ootHouseRoot : null;",
		'\tvar api = createHouseApi(storage, { win: win, from: ootHouseFrom() });',
		'\tif (volatile) api.volatile = true;',
		'\treturn api;',
		'}',
		'if (!ootHouseNamespace.house) ootHouseNamespace.house = ootHouseInstall();',
		'if (!ootHouseNamespace.houseLib) ootHouseNamespace.houseLib = ootHouseLib;',
		'})();'
	];
}

/**
 * The whole file: the header, the IIFE with the helpers, the ten bodies and
 * the door out. Pure, so a test can generate in memory and compare.
 * @param {Date} [now] the clock, for the date in the header
 * @returns {string}
 */
export function generate(now = new Date()) {
	const date = now.toISOString().slice(0, 10);
	const expects = [...new Set([...Object.values(LIB), ...Object.values(ADAPTERS), ...DRILLS, ...GRADERS, ...DRILL_CONSTANTS, ...CONSTANTS])];
	const text = portModules({
		units: unitsIn(HOUSE, MODULES),
		header: header(date),
		opener: ['(function () {', "'use strict';"],
		expects,
		door: door()
	});
	assertClean(text, 'oot-house.js');
	const address = namesAddress(text);
	if (address) throw new Error(address);
	return text;
}

function main() {
	writePorts([{ app: 'house', file: TARGET, text: generate() }], process.argv.includes('--dry-run'));
	console.log('  now: node tools/check-port-house.mjs, then copy static/shared/oot-house.js to the site\'s shared/');
}

runMain('port-house', import.meta.url, main);
