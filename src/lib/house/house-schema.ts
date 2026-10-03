/**
 * The House: one record for the restaurant a person works at, read and
 * drilled by all three craft wings. Every comment in this file ships inside
 * the ported static/shared/oot-house.js (tools/port-house.mjs transpiles with
 * comments kept, and its assertClean refuses any dash spelling, a carriage
 * return and a regex literal outside ASCII), so the comments here are
 * dash-free and every regex is ASCII, the discipline src/lib/desk follows.
 *
 * PURE AND PORTABLE. Plain TypeScript: no import from outside src/lib/house,
 * no DOM at module scope, no Svelte, no Node. Anything that touches storage
 * takes its adapter as an argument, so the Node checks run the whole engine
 * over a Map, the way desk-inbox.ts takes its Storage.
 *
 * NO ALLERGEN FIELD ON ANY SHAPE HERE, EVER. A menu cannot say what is in a
 * dish and neither can anyone reading one, so the field does not exist. The
 * Table's own allergens and allergensCheckedAt never enter a House or a pack;
 * `marks` is the (v) and the [GF] THE MENU PRINTED; `serviceNote` is a
 * person's own words, plain, never written by Lizzy and never handed to her.
 * KEYS below lists every property name of every interface as data, and
 * house-schema.test.ts walks the lot against the client's FORBIDDEN_KEY, so a
 * key the client would refuse at runtime fails the suite first.
 *
 * A PRICE IS A STRING AS PRINTED, never a number: '24', '9 / 38', 'MP', ''.
 * The printed form carries what a number throws away, and nobody here rounds
 * another house's menu.
 *
 * THE MARK IS THE WINGS' MARK, UNCHANGED: { value, by, ts, model? }, the shape
 * of state.ts MaitreMark, the Ledger's normalizeMaitre and the Codex's
 * v24SanitiseMark. Kept means `by === 'person'`: an unkept mark reaches no
 * drill, no guest line and no deck. The formula (five parts, three timed
 * lines, the pairing block) rides as marks of that one shape, so every
 * existing merge, keep and discard holds without a new case.
 */

/* -------------------------------------------------------------------------
 * The constants
 * ---------------------------------------------------------------------- */

export const HOUSE_FORMAT = 'oot-house';
export const HOUSE_SCHEMA_VERSION = 1;

/** The small synchronous index in localStorage: the list of houses and the current pointer. */
export const HOUSE_INDEX_KEY = 'oot-houses-v1';
/** IndexedDB, one record per house, keyed by the house id. */
export const HOUSE_DB = 'oot-house';
export const HOUSE_STORE = 'houses';

/**
 * The cap on one house, in bytes of its JSON text. Eight megabytes is more
 * than any menu a person will ever type; a refusal names the pack export as
 * the way out, and no cross-house total is watched.
 */
export const HOUSE_MAX_BYTES = 8 * 1024 * 1024;

/** The longest prose field and the longest list the normaliser lets through. */
export const PROSE_MAX = 4000;
export const LIST_MAX = 10000;

/**
 * The word caps on the three timed lines: ten, twenty and forty five seconds
 * of speech at a server's pace. Flagged, not cut: a line over its cap is
 * shown with its count and the person trims it.
 */
export const LINE_CAPS = { s10: 25, s20: 50, s45: 110 } as const;

/** The nine pairing principles a pairing block may name. */
export const PRINCIPLES = ['acid', 'fat', 'weight', 'sweet', 'heat', 'tannin', 'salt', 'bridge', 'method'] as const;
export type Principle = (typeof PRINCIPLES)[number];

/**
 * The five parts of the formula, one label set per kind, so Say it back is
 * one drill over every kind. The keys are the same five everywhere; only the
 * labels change.
 */
export const DISH_PARTS = {
	main: 'main ingredient',
	technique: 'technique',
	sauce: 'sauce and key flavours',
	sides: 'accompaniments',
	taste: 'how it tastes'
} as const;
export const COCKTAIL_PARTS = {
	main: 'the spirit',
	technique: 'the build',
	sauce: 'modifiers and key flavours',
	sides: 'glass and garnish',
	taste: 'how it tastes'
} as const;
export const WINE_PARTS = {
	main: 'grape and region',
	technique: 'how it is made',
	sauce: 'the profile',
	sides: 'what it goes with',
	taste: 'how it tastes'
} as const;

/** The eight steps of a build, in order; `House.build` stamps each as it completes. */
export const BUILD_STEPS = ['card', 'menus', 'filed', 'formula', 'pairings', 'wines', 'lexicon', 'scenarios'] as const;
export type BuildStep = (typeof BUILD_STEPS)[number];

/** How a house came to be: imported from a pack, read at the Menu Desk, or typed by hand. */
export type Began = 'pack' | 'desk' | 'hand';

/** The three kinds of item that carry the formula. */
export const ITEM_KINDS = ['dish', 'wine', 'cocktail'] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

/* -------------------------------------------------------------------------
 * The marks and the formula
 * ---------------------------------------------------------------------- */

/**
 * The three wings' mark, unchanged. `ts` is the mark's OWN stamp, never the
 * item's: Keep re-stamps it, so a mark a person confirmed on one tablet beats
 * her older unconfirmed one on another. A person's mark beats hers whatever
 * the stamps; that rule lives in house-merge.ts, copied word for word from
 * state.ts pickMark and never imported, so this engine stays portable.
 */
export interface Mark<T = string> {
	value: T;
	by: 'maitre' | 'person';
	ts: number;
	model?: string;
}

/** One answer kept from the chat. Keeping is a person's act, so it carries no `by`. */
export interface Note {
	q: string;
	a: string;
	ts: number;
	model?: string;
}

/** The five parts, as prose, one line each. */
export interface FormulaParts {
	main: string;
	technique: string;
	sauce: string;
	sides: string;
	taste: string;
}

/** The three timed lines, ten, twenty and forty five seconds, capped by LINE_CAPS in words. */
export interface Lines {
	s10: string;
	s20: string;
	s45: string;
}

/**
 * The pairing block on a dish, from the house's OWN list: every id here is a
 * house wine or a house cocktail, and the validator refuses one that is not.
 * `secondId` and `zeroProofId` may be empty when the list has no second pick
 * or no zero-proof drink.
 */
export interface Pairing {
	wineId: string;
	why: string;
	sayIt: string;
	whyThisWine: string;
	palate: string;
	principles: Principle[];
	secondId: string;
	secondWhy: string;
	stepUp: string;
	serve: string;
	avoid: string;
	zeroProofId: string;
	zeroProofWhy: string;
}

/* -------------------------------------------------------------------------
 * The items
 * ---------------------------------------------------------------------- */

/** One printed price, with the meal it was printed for. */
export interface MealPrice {
	meal: string;
	printed: string;
}

/**
 * What every item carries, whatever its kind. `house` is the id of the House
 * it belongs to, the one field each wing's projection row gains. The five
 * Floor Deck marks (say, guest, why, pairs, origin), the five parts and the
 * three lines ride on every kind.
 */
export interface ItemBase {
	id: string;
	house: string;
	name: string;
	section: string;
	meals: string[];
	/** The price as printed on the first menu that carried it. */
	price: string;
	prices: MealPrice[];
	say?: Mark;
	guest?: Mark;
	why?: Mark;
	pairs?: Mark;
	origin?: Mark;
	kept?: Note[];
	parts?: Mark<FormulaParts>;
	lines?: Mark<Lines>;
	/** A PERSON's words, plain, never written by Lizzy, never handed to her, House-only. */
	serviceNote: string;
	ts: number;
}

export interface HouseDish extends ItemBase {
	kind: 'dish';
	description: string;
	ingredients: string[];
	/** The dietary marks the menu PRINTED, lower case, and nothing inferred. */
	marks: string[];
	/** The ingredients the menu NAMED, as read off the page: a record of the printed words. */
	ingredientsNamed?: Mark<string[]>;
	pairing?: Mark<Pairing>;
	signature: boolean;
}

export interface HouseWine extends ItemBase {
	kind: 'wine';
	producer: string;
	wine: string;
	vintage: string;
	region: string;
	grapes: string[];
	style: string;
	/** The glass price and the bottle price, each as printed. */
	glass: string;
	bottle: string;
	pours: string[];
	profile?: Mark;
	goesWith?: Mark;
	/** The dishes this wine is the first pick for, by id. */
	firstPickIds?: Mark<string[]>;
	serve?: Mark;
}

export interface HouseCocktail extends ItemBase {
	kind: 'cocktail';
	/** The spec as the Ledger keeps it, one measure per line, as printed. Empty when the house keeps none. */
	spec: string[];
	method: string;
	glass: string;
	garnish: string;
	note: string;
	family: string;
	spirit: string;
	zeroProof: boolean;
	/** House cocktails worth offering after this one, by id. */
	upsells?: Mark<string[]>;
	ingredientsNamed?: Mark<string[]>;
}

export type HouseItem = HouseDish | HouseWine | HouseCocktail;

/* -------------------------------------------------------------------------
 * The rest of the house
 * ---------------------------------------------------------------------- */

export interface TastingCourse {
	n: number;
	label: string;
	dishIds: string[];
	/** A house wine or cocktail by id, or empty when the course prints no pour. */
	pourId: string;
	pourText: string;
}

export interface Tasting {
	id: string;
	name: string;
	price: string;
	meal: string;
	includesDrinks: boolean;
	courses: TastingCourse[];
	note: string;
	ts: number;
}

/** A word on the menu a guest may ask about: how to say it, and what to tell them. */
export interface LexiconTerm {
	id: string;
	term: string;
	say?: Mark;
	toGuest?: Mark;
	itemIds: string[];
	ts: number;
}

/** A guest conversation: what the guest says, what you say, and the principle behind it. */
export interface Scenario {
	id: string;
	title: string;
	guest: string;
	you?: Mark;
	principle?: Mark;
	itemIds: string[];
	ts: number;
}

/** Two items a server confuses, what tells them apart, and the question that settles it. */
export interface MixUp {
	id: string;
	aId: string;
	bId: string;
	difference?: Mark;
	ask?: Mark;
	ts: number;
}

export interface MustKnow {
	id: string;
	title: string;
	body?: Mark;
	ts: number;
}

/** Who a question at lineup is for. */
export type AskWhom = 'chef' | 'sommelier' | 'bar' | 'manager';

/**
 * A question for lineup, kept by the person building the house: what the
 * menu did not say and who can answer it. Never part of what Lizzy is handed.
 */
export interface AskAtLineup {
	id: string;
	question: string;
	askWhom: AskWhom;
	itemIds: string[];
	/** The field on the item the question holds up, when it holds one up. */
	blocksField?: string;
	answer?: string;
	answeredOn?: string;
	ts: number;
}

/** One side of a dispute: what a source said, which source, and when. */
export interface DisputeSide {
	text: string;
	source: string;
	date: string;
}

/**
 * Two sources that disagree about one field, written down for the person to
 * settle rather than settled by a guess. Never part of what Lizzy is handed.
 */
export interface Dispute {
	id: string;
	itemId?: string;
	field: string;
	a: DisputeSide;
	b: DisputeSide;
	resolution?: string;
	ts: number;
}

export interface HouseMeal {
	name: string;
	days: string;
	hours: string;
}

export interface HouseSource {
	title: string;
	url: string;
	readOn: string;
}

/** The stamp a pack leaves on the house it became. */
export interface PackStamp {
	id: string;
	builtBy: string;
	builtAt: string;
	version: number;
}

/**
 * The House. The card first (name, address, phone, site, meals, history,
 * dress code, the date the menus were read, the sources), then the ten
 * lists, then the tombstones (`removed`, id to stamp), the build stamps, how
 * it began and when. `createdAt` is an ISO date; `lastWrite` is a stamp.
 */
export interface House {
	format: typeof HOUSE_FORMAT;
	version: typeof HOUSE_SCHEMA_VERSION;
	id: string;
	name: string;
	address: string;
	phone: string;
	site: string;
	meals: HouseMeal[];
	history?: Mark;
	dressCode: string;
	menusReadOn: string;
	sources: HouseSource[];
	tastings: Tasting[];
	dishes: HouseDish[];
	wines: HouseWine[];
	cocktails: HouseCocktail[];
	lexicon: LexiconTerm[];
	scenarios: Scenario[];
	mixUps: MixUp[];
	mustKnows: MustKnow[];
	askAtLineup: AskAtLineup[];
	disputes: Dispute[];
	removed: Record<string, number>;
	build: Partial<Record<BuildStep, number>>;
	began: Began;
	createdAt: string;
	lastWrite: number;
	pack?: PackStamp;
}

/** The index in localStorage: small, synchronous, the list and the current pointer. */
export interface HouseIndex {
	v: 1;
	current: string | null;
	list: HouseStub[];
}

export interface HouseStub {
	id: string;
	name: string;
	ts: number;
	bytes: number;
	began: Began;
}

/* -------------------------------------------------------------------------
 * The lists, the marks and the ids, as data
 * ---------------------------------------------------------------------- */

/**
 * The ten lists on a House, in the order the record carries them: the eight a
 * pack builds for Lizzy and the drills, then the two working lists a person
 * keeps for lineup. Every list holds records with an id, so the merge runs
 * per list by id over all ten.
 */
export const HOUSE_LISTS = [
	'tastings',
	'dishes',
	'wines',
	'cocktails',
	'lexicon',
	'scenarios',
	'mixUps',
	'mustKnows',
	'askAtLineup',
	'disputes'
] as const;
export type HouseList = (typeof HOUSE_LISTS)[number];

/** The mark fields per kind: everything Lizzy may write and a person may keep. Wines carry parts and lines too. */
export const DISH_MARKS = ['say', 'guest', 'why', 'pairs', 'origin', 'ingredientsNamed', 'parts', 'lines', 'pairing'] as const satisfies readonly (keyof HouseDish)[];
export const WINE_MARKS = ['say', 'guest', 'why', 'pairs', 'origin', 'profile', 'goesWith', 'firstPickIds', 'serve', 'parts', 'lines'] as const satisfies readonly (keyof HouseWine)[];
export const COCKTAIL_MARKS = ['say', 'guest', 'why', 'pairs', 'origin', 'ingredientsNamed', 'parts', 'lines', 'upsells'] as const satisfies readonly (keyof HouseCocktail)[];

/**
 * The mark fields on every list and on the card, so a merge, a review screen
 * or a drill can loop over them without naming a field twice. A list with no
 * marks is listed empty on purpose, so a loop over HOUSE_LISTS never misses.
 */
export const MARK_FIELDS = {
	house: ['history'] as const satisfies readonly (keyof House)[],
	tastings: [] as const,
	dishes: DISH_MARKS,
	wines: WINE_MARKS,
	cocktails: COCKTAIL_MARKS,
	lexicon: ['say', 'toGuest'] as const satisfies readonly (keyof LexiconTerm)[],
	scenarios: ['you', 'principle'] as const satisfies readonly (keyof Scenario)[],
	mixUps: ['difference', 'ask'] as const satisfies readonly (keyof MixUp)[],
	mustKnows: ['body'] as const satisfies readonly (keyof MustKnow)[],
	askAtLineup: [] as const,
	disputes: [] as const
} satisfies Record<HouseList | 'house', readonly string[]>;

/**
 * The id prefix per list and for the house itself. Dishes, wines and
 * cocktails keep the wings' own mints, so a House item and its projection row
 * share one id and the Codex's ST.q keys and keyOwned hold. No id ever
 * carries '|' or ':', which the wings use inside their own keys.
 */
export const ID_PREFIXES = {
	house: 'h-',
	tastings: 't-',
	dishes: 'd-',
	wines: 'w-',
	cocktails: 'b-',
	lexicon: 'x-',
	scenarios: 's-',
	mixUps: 'm-',
	mustKnows: 'k-',
	askAtLineup: 'a-',
	disputes: 'u-'
} as const satisfies Record<HouseList | 'house', string>;

/* -------------------------------------------------------------------------
 * Every key of every interface, as data
 * ---------------------------------------------------------------------- */

type KeysOf<T> = readonly (keyof T)[];

/** ItemBase on its own, then spread into the three kinds, so a base key is listed once. */
const ITEM_BASE_KEYS = [
	'id', 'house', 'name', 'section', 'meals', 'price', 'prices',
	'say', 'guest', 'why', 'pairs', 'origin', 'kept', 'parts', 'lines',
	'serviceNote', 'ts'
] as const satisfies KeysOf<ItemBase>;

/**
 * Every property name of every interface above, listed by hand and checked
 * by the compiler both ways (a key an interface lacks fails `satisfies`; a
 * key a list forgot fails the Complete check at the foot of the file). The
 * test walks these against the client's FORBIDDEN_KEY, and a port check can
 * walk a record against them, so no key here is ever refused at runtime.
 */
export const KEYS = {
	Mark: ['value', 'by', 'ts', 'model'] as const satisfies KeysOf<Mark>,
	Note: ['q', 'a', 'ts', 'model'] as const satisfies KeysOf<Note>,
	FormulaParts: ['main', 'technique', 'sauce', 'sides', 'taste'] as const satisfies KeysOf<FormulaParts>,
	Lines: ['s10', 's20', 's45'] as const satisfies KeysOf<Lines>,
	Pairing: [
		'wineId', 'why', 'sayIt', 'whyThisWine', 'palate', 'principles',
		'secondId', 'secondWhy', 'stepUp', 'serve', 'avoid', 'zeroProofId', 'zeroProofWhy'
	] as const satisfies KeysOf<Pairing>,
	MealPrice: ['meal', 'printed'] as const satisfies KeysOf<MealPrice>,
	ItemBase: ITEM_BASE_KEYS,
	HouseDish: [
		...ITEM_BASE_KEYS, 'kind', 'description', 'ingredients', 'marks', 'ingredientsNamed', 'pairing', 'signature'
	] as const satisfies KeysOf<HouseDish>,
	HouseWine: [
		...ITEM_BASE_KEYS, 'kind', 'producer', 'wine', 'vintage', 'region', 'grapes', 'style', 'glass', 'bottle', 'pours',
		'profile', 'goesWith', 'firstPickIds', 'serve'
	] as const satisfies KeysOf<HouseWine>,
	HouseCocktail: [
		...ITEM_BASE_KEYS, 'kind', 'spec', 'method', 'glass', 'garnish', 'note', 'family', 'spirit', 'zeroProof',
		'upsells', 'ingredientsNamed'
	] as const satisfies KeysOf<HouseCocktail>,
	TastingCourse: ['n', 'label', 'dishIds', 'pourId', 'pourText'] as const satisfies KeysOf<TastingCourse>,
	Tasting: ['id', 'name', 'price', 'meal', 'includesDrinks', 'courses', 'note', 'ts'] as const satisfies KeysOf<Tasting>,
	LexiconTerm: ['id', 'term', 'say', 'toGuest', 'itemIds', 'ts'] as const satisfies KeysOf<LexiconTerm>,
	Scenario: ['id', 'title', 'guest', 'you', 'principle', 'itemIds', 'ts'] as const satisfies KeysOf<Scenario>,
	MixUp: ['id', 'aId', 'bId', 'difference', 'ask', 'ts'] as const satisfies KeysOf<MixUp>,
	MustKnow: ['id', 'title', 'body', 'ts'] as const satisfies KeysOf<MustKnow>,
	AskAtLineup: ['id', 'question', 'askWhom', 'itemIds', 'blocksField', 'answer', 'answeredOn', 'ts'] as const satisfies KeysOf<AskAtLineup>,
	DisputeSide: ['text', 'source', 'date'] as const satisfies KeysOf<DisputeSide>,
	Dispute: ['id', 'itemId', 'field', 'a', 'b', 'resolution', 'ts'] as const satisfies KeysOf<Dispute>,
	HouseMeal: ['name', 'days', 'hours'] as const satisfies KeysOf<HouseMeal>,
	HouseSource: ['title', 'url', 'readOn'] as const satisfies KeysOf<HouseSource>,
	PackStamp: ['id', 'builtBy', 'builtAt', 'version'] as const satisfies KeysOf<PackStamp>,
	House: [
		'format', 'version', 'id', 'name', 'address', 'phone', 'site', 'meals', 'history', 'dressCode', 'menusReadOn', 'sources',
		'tastings', 'dishes', 'wines', 'cocktails', 'lexicon', 'scenarios', 'mixUps', 'mustKnows', 'askAtLineup', 'disputes',
		'removed', 'build', 'began', 'createdAt', 'lastWrite', 'pack'
	] as const satisfies KeysOf<House>,
	HouseIndex: ['v', 'current', 'list'] as const satisfies KeysOf<HouseIndex>,
	HouseStub: ['id', 'name', 'ts', 'bytes', 'began'] as const satisfies KeysOf<HouseStub>
};

/* The other direction: a key the interface has and the list forgot is a type
   error here. Types only; nothing of this reaches the port. */
type Complete<T, K extends readonly PropertyKey[]> = [Exclude<keyof T, K[number]>] extends [never] ? true : false;
type Assert<T extends true> = T;
type KeysComplete = [
	Assert<Complete<Mark, typeof KEYS.Mark>>,
	Assert<Complete<Note, typeof KEYS.Note>>,
	Assert<Complete<FormulaParts, typeof KEYS.FormulaParts>>,
	Assert<Complete<Lines, typeof KEYS.Lines>>,
	Assert<Complete<Pairing, typeof KEYS.Pairing>>,
	Assert<Complete<MealPrice, typeof KEYS.MealPrice>>,
	Assert<Complete<ItemBase, typeof KEYS.ItemBase>>,
	Assert<Complete<HouseDish, typeof KEYS.HouseDish>>,
	Assert<Complete<HouseWine, typeof KEYS.HouseWine>>,
	Assert<Complete<HouseCocktail, typeof KEYS.HouseCocktail>>,
	Assert<Complete<TastingCourse, typeof KEYS.TastingCourse>>,
	Assert<Complete<Tasting, typeof KEYS.Tasting>>,
	Assert<Complete<LexiconTerm, typeof KEYS.LexiconTerm>>,
	Assert<Complete<Scenario, typeof KEYS.Scenario>>,
	Assert<Complete<MixUp, typeof KEYS.MixUp>>,
	Assert<Complete<MustKnow, typeof KEYS.MustKnow>>,
	Assert<Complete<AskAtLineup, typeof KEYS.AskAtLineup>>,
	Assert<Complete<DisputeSide, typeof KEYS.DisputeSide>>,
	Assert<Complete<Dispute, typeof KEYS.Dispute>>,
	Assert<Complete<HouseMeal, typeof KEYS.HouseMeal>>,
	Assert<Complete<HouseSource, typeof KEYS.HouseSource>>,
	Assert<Complete<PackStamp, typeof KEYS.PackStamp>>,
	Assert<Complete<House, typeof KEYS.House>>,
	Assert<Complete<HouseIndex, typeof KEYS.HouseIndex>>,
	Assert<Complete<HouseStub, typeof KEYS.HouseStub>>
];
export type { KeysComplete };

/* -------------------------------------------------------------------------
 * The small functions every module shares
 * ---------------------------------------------------------------------- */

/**
 * A fresh house with its card blank and every list empty. `now` is a stamp in
 * milliseconds; `createdAt` is minted from it as an ISO date, so a house made
 * in a test carries no clock reading of its own.
 */
export function emptyHouse(id: string, name: string, began: Began, now: number): House {
	return {
		format: HOUSE_FORMAT,
		version: HOUSE_SCHEMA_VERSION,
		id,
		name,
		address: '',
		phone: '',
		site: '',
		meals: [],
		dressCode: '',
		menusReadOn: '',
		sources: [],
		tastings: [],
		dishes: [],
		wines: [],
		cocktails: [],
		lexicon: [],
		scenarios: [],
		mixUps: [],
		mustKnows: [],
		askAtLineup: [],
		disputes: [],
		removed: {},
		build: {},
		began,
		createdAt: new Date(now).toISOString(),
		lastWrite: now
	};
}

/**
 * A new id: the prefix and eight base36 characters, drawn until one is not in
 * `taken`. The random source is an argument so a test can hand in a fixed
 * one; a draw outside [0, 1) counts as zero rather than spilling a ninth
 * character. A thousand collisions in a row means the source is broken, and
 * that is said rather than spun on.
 */
export function mintId(prefix: string, taken: ReadonlySet<string>, rand: () => number = Math.random): string {
	for (let tries = 0; tries < 1000; tries++) {
		let s = prefix;
		for (let i = 0; i < 8; i++) {
			const r = rand();
			const n = r >= 0 && r < 1 ? Math.floor(r * 36) : 0;
			s += n.toString(36);
		}
		if (!taken.has(s)) return s;
	}
	throw new Error('mintId: a thousand draws and every id was taken; the random source is broken');
}

/**
 * A value with the mark's shape: a known `by`, a finite stamp, a `model` that
 * is a string when present, and a value that is a string, a list of strings
 * or an object (the parts, the lines, the pairing). The shape only: whether
 * the value is blank, and whether it fits the field it sits on, is the
 * normaliser's question.
 */
export function isMark(v: unknown): v is Mark<unknown> {
	if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
	const m = v as Record<string, unknown>;
	if (m.by !== 'maitre' && m.by !== 'person') return false;
	if (typeof m.ts !== 'number' || !Number.isFinite(m.ts)) return false;
	if (m.model !== undefined && typeof m.model !== 'string') return false;
	const value = m.value;
	if (typeof value === 'string') return true;
	if (Array.isArray(value)) return value.every((s) => typeof s === 'string');
	return !!value && typeof value === 'object';
}

/** A value with a kept note's shape: a question, an answer, a finite stamp, a `model` that is a string when present. */
export function isNote(v: unknown): v is Note {
	if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
	const n = v as Record<string, unknown>;
	if (typeof n.q !== 'string' || typeof n.a !== 'string') return false;
	if (typeof n.ts !== 'number' || !Number.isFinite(n.ts)) return false;
	return n.model === undefined || typeof n.model === 'string';
}
