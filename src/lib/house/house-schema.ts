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

/**
 * Which list a wine is sold from: 'glass' is the menus' own wines (the
 * glasses and the bottles a menu prints), 'bottle' is a bottle from the
 * house's full bottle list that has a whole card for the floor. A wine
 * without the field is a glass wine, so every edition written before the
 * field existed reads as it always did.
 */
export const WINE_LISTS = ['glass', 'bottle'] as const;
export type WineList = (typeof WINE_LISTS)[number];

/**
 * The bottle tiers a dish's pairing may carry, in the order a server offers
 * them: value, the sweet spot (classic), the celebration (splurge), and a
 * half bottle where one fits.
 */
export const BOTTLE_TIERS = ['value', 'classic', 'splurge', 'half'] as const;
export type BottleTier = (typeof BOTTLE_TIERS)[number];

/**
 * The price band each priced tier holds, in dollars of the printed bottle
 * price: value under 100, classic from 100 to 250 (both ends in), splurge
 * over 250. The half bottle has no band; it is held to HALF_SIZE instead.
 */
export const BOTTLE_BANDS = { value: 100, classicTop: 250 } as const;

/** Whether a bottle price sits in a tier's band; the half bottle takes any price. */
export function inBottleBand(tier: BottleTier, price: number): boolean {
	if (!Number.isFinite(price) || price <= 0) return false;
	if (tier === 'value') return price < BOTTLE_BANDS.value;
	if (tier === 'classic') return price >= BOTTLE_BANDS.value && price <= BOTTLE_BANDS.classicTop;
	if (tier === 'splurge') return price > BOTTLE_BANDS.classicTop;
	return true;
}

/**
 * The first figure in a printed price, as dollars: '$1,250' is 1250 and
 * '$80 half-bottle' is 80. NaN when the price prints no figure.
 */
export function printedDollars(printed: string): number {
	const m = String(printed == null ? '' : printed).match(/\d[\d,]*(?:\.\d+)?/);
	return m ? Number(m[0].replace(/,/g, '')) : NaN;
}

/** A size folded for comparison: lower case, no spaces, so '375 ml' and '375ml' are one size. */
export function foldSize(size: string): string {
	return String(size == null ? '' : size).toLowerCase().replace(/\s+/g, '');
}

/** The list a wine is sold from, reading an absent field as 'glass'. */
export function wineListOf(wine: { list?: unknown }): WineList {
	return wine.list === 'bottle' ? 'bottle' : 'glass';
}

/** The size a half bottle carries, folded: lower case, no spaces. */
export const HALF_SIZE = '375ml';

/** The word cap on a tier's why and its line to say at the table. */
export const BOTTLE_WORDS = 25;

/**
 * The videos a house points a server to. A video is a link out and never a
 * player: a wing opens it in a new tab, plays nothing on its own and says a
 * video needs a connection. The link is held to one scheme and three hosts,
 * so a pack, a hand edit or a file cannot plant any other address on a card.
 * VIDEO_SCHEME is written once, here, and it is the one place the shipped
 * engine spells the secure scheme: tools/port-house.mjs and
 * tools/check-port-house.mjs allow exactly this one occurrence and still
 * refuse any other. The hosts are names a link is compared against; the
 * engine never fetches one.
 */
export const VIDEO_SCHEME = 'https';
export const VIDEO_HOSTS = ['youtube.com', 'youtu.be', 'vimeo.com'] as const;

/** The word cap on why a video helps, the bottle tiers' cap. */
export const VIDEO_WHY_WORDS = 25;

/** The longest link a video may carry. */
export const VIDEO_URL_MAX = 500;

/**
 * The components: the ingredients, techniques and stories an item is made
 * of, each one card shared by every item that uses it. COMPONENT_KINDS is
 * the whole set a component may be; COMPONENT_LABELS is how a screen heads
 * each group, in this order.
 */
export const COMPONENT_KINDS = ['ingredient', 'technique', 'story'] as const;
export type ComponentKind = (typeof COMPONENT_KINDS)[number];
export const COMPONENT_LABELS: Readonly<Record<ComponentKind, string>> = { ingredient: 'Ingredients', technique: 'Techniques', story: 'Stories' };

/**
 * The word caps on a component: the explanation, the card's front and its
 * back. The validator holds the caps; the floors (EXPLAIN_FLOOR, CARD_BACK_FLOOR)
 * are the pack builder's, since a person's own shorter note is no fault.
 */
export const COMPONENT_WORDS = { explain: 160, front: 14, back: 45 } as const;
export const COMPONENT_FLOORS = { explain: 80, back: 20 } as const;

/**
 * Where a comparison points: a World Table recipe or technique, a Ledger
 * cocktail, a Codex grape, producer, primer or house wine, or a classic
 * written out with no link at all.
 */
export const COMPARE_APPS = ['table', 'ledger', 'codex', 'classic'] as const;
export type CompareApp = (typeof COMPARE_APPS)[number];
/** At most this many comparisons on one item, an in-app one first. */
export const COMPARE_MAX = 2;
/** The word caps on a comparison: its label, what is the same and what differs. */
export const COMPARE_WORDS = { label: 8, same: 30, different: 30 } as const;

/**
 * The word caps on what a tasting prints beyond its courses' names: the
 * subtitle under its name, the pairing supplement, each line printed under a
 * course's dishes and the words over a course's pour. Wide, because each is
 * the menu's own words, and there so a paragraph pasted into a label is caught.
 */
export const TASTING_WORDS = { line: 40, supplement: 20, printed: 40, pourLabel: 4 } as const;

const VIDEO_URL = new RegExp('^' + VIDEO_SCHEME + ':\\/\\/([A-Za-z0-9.-]+)(?:[\\/?#][^\\s]*)?$');

/**
 * Whether a link may stand on a video: the secure scheme, no user name, no
 * port, no space, and a host that is one of VIDEO_HOSTS or a name under one
 * (www.youtube.com, m.youtube.com, player.vimeo.com). Anything else is not a
 * video link here, however it reads.
 */
export function videoUrlOk(url: unknown): boolean {
	if (typeof url !== 'string' || !url || url.length > VIDEO_URL_MAX) return false;
	const m = VIDEO_URL.exec(url);
	if (!m) return false;
	const host = m[1].toLowerCase();
	for (const h of VIDEO_HOSTS) if (host === h || host.slice(-(h.length + 1)) === '.' + h) return true;
	return false;
}

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

/** One bottle offered with a dish: a house wine from the bottle list, why it works, and the line to say at the table. */
export interface BottlePick {
	wineId: string;
	why: string;
	sayIt: string;
}

/**
 * The bottles offered with a dish, by tier. Every tier is optional; the
 * validator holds each to a house wine with list 'bottle', the tier's price
 * band (BOTTLE_BANDS) and, for the half, HALF_SIZE.
 */
export interface PairingBottles {
	value?: BottlePick;
	classic?: BottlePick;
	splurge?: BottlePick;
	half?: BottlePick;
}

/**
 * The pairing block on a dish, from the house's OWN list: every id here is a
 * house wine or a house cocktail, and the validator refuses one that is not.
 * `secondId` and `zeroProofId` may be empty when the list has no second pick
 * or no zero-proof drink. `bottles` is absent when the dish has no bottle
 * tiers, so an older edition reads unchanged.
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
	bottles?: PairingBottles;
}

/* -------------------------------------------------------------------------
 * The items
 * ---------------------------------------------------------------------- */

/** A component's flash card: the cue on the front and the answer a server gives. */
export interface ComponentCard {
	front: string;
	back: string;
}

/**
 * One comparison on an item: `app` says where it points and `ref` is the
 * target's key there (a Table recipe or technique slug, a Ledger cocktail
 * name, a Codex grape, producer, primer category or house wine id), empty
 * for a classic; `label` names it and `same` and `different` say what holds
 * and what changes.
 */
export interface CompareEntry {
	app: CompareApp;
	ref: string;
	label: string;
	same: string;
	different: string;
}


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
	/** One or two comparisons, an in-app match first (CompareEntry), a mark like every other line. */
	compare?: Mark<CompareEntry[]>;
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
	/** The list it is sold from; absent means 'glass'. Only 'bottle' is ever written. */
	list?: WineList;
	/** The bin on the bottle list, as printed, because servers call bottles by bin. Absent when none. */
	bin?: string;
	/** The bottle size as printed ('750ml', '375ml', '1.5L'). Absent when none. */
	size?: string;
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

/**
 * One course of a tasting, in the order the menu prints it. `label` is the
 * course's heading as printed ('Eye Opener Cocktail', 'Third Course'). The
 * last three keys are OPTIONAL and written only when they say something, so
 * a course from an edition that never had them reads unchanged: `choice` is
 * true when the menu prints 'choice of' over the course's dishes; `printed`
 * holds the lines the menu prints under the course's dish names (or, on a
 * course with no dish, under its pour), each exactly as printed; and
 * `pourLabel` is the words the menu prints over the pour ('Paired with',
 * 'Suggested Pairing'). A course with no dish and a pour is the pour itself,
 * the eye opener's way, and carries no label.
 */
export interface TastingCourse {
	n: number;
	label: string;
	dishIds: string[];
	/** A house wine or cocktail by id, or empty when the course prints no pour. */
	pourId: string;
	/** The pour as the menu prints it, or empty. */
	pourText: string;
	choice?: boolean;
	printed?: string[];
	pourLabel?: string;
}

/**
 * A tasting menu: its name and price as printed, the meal it is served at,
 * whether the price covers the drinks, the courses in printed order and a
 * note for the floor. `line` is the subtitle the menu prints under its name
 * and `supplement` the pairing supplement it prints (its words and its
 * price, as printed); both OPTIONAL, written only when not blank.
 */
export interface Tasting {
	id: string;
	name: string;
	price: string;
	meal: string;
	includesDrinks: boolean;
	courses: TastingCourse[];
	note: string;
	line?: string;
	supplement?: string;
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

/**
 * One ingredient, technique or story, written once and shared by every item
 * that uses it: how to say it, the explanation (what it is, how it is made
 * or done, where it comes from, why it matters here) and its flash card,
 * each a mark, with the items it belongs to and the lexicon terms it
 * explains. `kind` is carried as it came so the validator can name one
 * outside COMPONENT_KINDS.
 */
export interface HouseComponent {
	id: string;
	kind: ComponentKind;
	name: string;
	say?: Mark;
	explain?: Mark;
	card?: Mark<ComponentCard>;
	itemIds: string[];
	termIds: string[];
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

/**
 * A video that helps a server learn the house: a dish's technique, a drink's
 * history, the room itself, service. Plain fields, no marks: a video is a
 * pointer a person chose, checked against the address on `checkedOn`, and
 * the wings show it as it stands. `itemIds` are the dishes, wines and
 * cocktails it teaches and `termIds` the lexicon terms; `house` is true for
 * a video about the house itself (its story, its room, its signature), which
 * a wing lists first. Here `house` is a flag, not a house id: this list
 * carries no house id, and the merge and the edition refresh re-stamp only a
 * `house` that is a string. `mins` is the length in minutes, 0 when nobody
 * measured it (the key is not spelled out in full because the client sweep
 * refuses any key holding the letters of nut, and that word holds them);
 * `topic` is the heading a wing groups the list under.
 */
export interface HouseVideo {
	id: string;
	url: string;
	title: string;
	channel: string;
	mins: number;
	topic: string;
	why: string;
	itemIds: string[];
	termIds: string[];
	/** The components it teaches, by id; absent when it names none, so an older video reads unchanged. */
	componentIds?: string[];
	house: boolean;
	checkedOn: string;
	ts: number;
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
 * dress code, the date the menus were read, the sources), then the
 * twelve lists (the last two, the videos and the components, only when they hold one), then the tombstones (`removed`, id to stamp), the build stamps, how
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
	/** The videos: absent when the house holds none, so a house from before the list reads unchanged. */
	videos?: HouseVideo[];
	/** The components: absent when the house holds none, the videos' rule. */
	components?: HouseComponent[];
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
 * The twelve lists on a House, in the order the record carries them: the
 * eight a pack builds for Lizzy and the drills, the two working lists a
 * person keeps for lineup, then the videos and the components. Every list holds records with an
 * id, so the merge runs per list by id over all twelve. The videos and the
 * components are OPTIONAL_LISTS: written only when they hold something, so every loop over
 * this list reads a house's rows through houseRows, never house[list].
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
	'disputes',
	'videos',
	'components'
] as const;
export type HouseList = (typeof HOUSE_LISTS)[number];

/** The lists a House carries only when they hold something; absent reads as empty. */
export const OPTIONAL_LISTS = ['videos', 'components'] as const satisfies readonly HouseList[];

/** A house's rows on one list, or none when the list is absent (an optional list, or a record from an older edition). */
export function houseRows(house: House, list: HouseList): unknown[] {
	const v = (house as unknown as Record<string, unknown>)[list];
	return Array.isArray(v) ? v : [];
}

/** Whether a list is one a House carries only when it holds something. */
export function optionalList(list: string): boolean {
	return (OPTIONAL_LISTS as readonly string[]).indexOf(list) >= 0;
}

/** The mark fields per kind: everything Lizzy may write and a person may keep. Wines carry parts and lines too. */
export const DISH_MARKS = ['say', 'guest', 'why', 'pairs', 'origin', 'ingredientsNamed', 'parts', 'lines', 'pairing', 'compare'] as const satisfies readonly (keyof HouseDish)[];
export const WINE_MARKS = ['say', 'guest', 'why', 'pairs', 'origin', 'profile', 'goesWith', 'firstPickIds', 'serve', 'parts', 'lines', 'compare'] as const satisfies readonly (keyof HouseWine)[];
export const COCKTAIL_MARKS = ['say', 'guest', 'why', 'pairs', 'origin', 'ingredientsNamed', 'parts', 'lines', 'upsells', 'compare'] as const satisfies readonly (keyof HouseCocktail)[];

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
	disputes: [] as const,
	videos: [] as const,
	components: ['say', 'explain', 'card'] as const satisfies readonly (keyof HouseComponent)[]
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
	disputes: 'u-',
	videos: 'v-',
	components: 'c-'
} as const satisfies Record<HouseList | 'house', string>;

/* -------------------------------------------------------------------------
 * Every key of every interface, as data
 * ---------------------------------------------------------------------- */

type KeysOf<T> = readonly (keyof T)[];

/** ItemBase on its own, then spread into the three kinds, so a base key is listed once. */
const ITEM_BASE_KEYS = [
	'id', 'house', 'name', 'section', 'meals', 'price', 'prices',
	'say', 'guest', 'why', 'pairs', 'origin', 'kept', 'parts', 'lines', 'compare',
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
		'secondId', 'secondWhy', 'stepUp', 'serve', 'avoid', 'zeroProofId', 'zeroProofWhy', 'bottles'
	] as const satisfies KeysOf<Pairing>,
	PairingBottles: ['value', 'classic', 'splurge', 'half'] as const satisfies KeysOf<PairingBottles>,
	BottlePick: ['wineId', 'why', 'sayIt'] as const satisfies KeysOf<BottlePick>,
	MealPrice: ['meal', 'printed'] as const satisfies KeysOf<MealPrice>,
	ItemBase: ITEM_BASE_KEYS,
	HouseDish: [
		...ITEM_BASE_KEYS, 'kind', 'description', 'ingredients', 'marks', 'ingredientsNamed', 'pairing', 'signature'
	] as const satisfies KeysOf<HouseDish>,
	HouseWine: [
		...ITEM_BASE_KEYS, 'kind', 'producer', 'wine', 'vintage', 'region', 'grapes', 'style', 'glass', 'bottle', 'pours',
		'profile', 'goesWith', 'firstPickIds', 'serve', 'list', 'bin', 'size'
	] as const satisfies KeysOf<HouseWine>,
	HouseCocktail: [
		...ITEM_BASE_KEYS, 'kind', 'spec', 'method', 'glass', 'garnish', 'note', 'family', 'spirit', 'zeroProof',
		'upsells', 'ingredientsNamed'
	] as const satisfies KeysOf<HouseCocktail>,
	TastingCourse: ['n', 'label', 'dishIds', 'pourId', 'pourText', 'choice', 'printed', 'pourLabel'] as const satisfies KeysOf<TastingCourse>,
	Tasting: ['id', 'name', 'price', 'meal', 'includesDrinks', 'courses', 'note', 'line', 'supplement', 'ts'] as const satisfies KeysOf<Tasting>,
	LexiconTerm: ['id', 'term', 'say', 'toGuest', 'itemIds', 'ts'] as const satisfies KeysOf<LexiconTerm>,
	ComponentCard: ['front', 'back'] as const satisfies KeysOf<ComponentCard>,
	CompareEntry: ['app', 'ref', 'label', 'same', 'different'] as const satisfies KeysOf<CompareEntry>,
	HouseComponent: ['id', 'kind', 'name', 'say', 'explain', 'card', 'itemIds', 'termIds', 'ts'] as const satisfies KeysOf<HouseComponent>,
	Scenario: ['id', 'title', 'guest', 'you', 'principle', 'itemIds', 'ts'] as const satisfies KeysOf<Scenario>,
	MixUp: ['id', 'aId', 'bId', 'difference', 'ask', 'ts'] as const satisfies KeysOf<MixUp>,
	MustKnow: ['id', 'title', 'body', 'ts'] as const satisfies KeysOf<MustKnow>,
	AskAtLineup: ['id', 'question', 'askWhom', 'itemIds', 'blocksField', 'answer', 'answeredOn', 'ts'] as const satisfies KeysOf<AskAtLineup>,
	DisputeSide: ['text', 'source', 'date'] as const satisfies KeysOf<DisputeSide>,
	Dispute: ['id', 'itemId', 'field', 'a', 'b', 'resolution', 'ts'] as const satisfies KeysOf<Dispute>,
	HouseMeal: ['name', 'days', 'hours'] as const satisfies KeysOf<HouseMeal>,
	HouseSource: ['title', 'url', 'readOn'] as const satisfies KeysOf<HouseSource>,
	HouseVideo: ['id', 'url', 'title', 'channel', 'mins', 'topic', 'why', 'itemIds', 'termIds', 'componentIds', 'house', 'checkedOn', 'ts'] as const satisfies KeysOf<HouseVideo>,
	PackStamp: ['id', 'builtBy', 'builtAt', 'version'] as const satisfies KeysOf<PackStamp>,
	House: [
		'format', 'version', 'id', 'name', 'address', 'phone', 'site', 'meals', 'history', 'dressCode', 'menusReadOn', 'sources',
		'tastings', 'dishes', 'wines', 'cocktails', 'lexicon', 'scenarios', 'mixUps', 'mustKnows', 'askAtLineup', 'disputes', 'videos', 'components',
		'removed', 'build', 'began', 'createdAt', 'lastWrite', 'pack'
	] as const satisfies KeysOf<House>,
	HouseIndex: ['v', 'current', 'list'] as const satisfies KeysOf<HouseIndex>,
	HouseStub: ['id', 'name', 'ts', 'bytes', 'began'] as const satisfies KeysOf<HouseStub>
};

/**
 * The plain keys a record may leave out, by shape: written only when they
 * say something, so a record from an edition that never had them reads
 * unchanged. A test that holds a record to its whole key list takes these
 * out of the required half.
 */
export const OPTIONAL_KEYS = {
	Pairing: ['bottles'],
	HouseWine: ['list', 'bin', 'size'],
	HouseVideo: ['componentIds'],
	TastingCourse: ['choice', 'printed', 'pourLabel'],
	Tasting: ['line', 'supplement'],
	House: ['videos', 'components']
} as const;

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
	Assert<Complete<PairingBottles, typeof KEYS.PairingBottles>>,
	Assert<Complete<BottlePick, typeof KEYS.BottlePick>>,
	Assert<Complete<MealPrice, typeof KEYS.MealPrice>>,
	Assert<Complete<ItemBase, typeof KEYS.ItemBase>>,
	Assert<Complete<HouseDish, typeof KEYS.HouseDish>>,
	Assert<Complete<HouseWine, typeof KEYS.HouseWine>>,
	Assert<Complete<HouseCocktail, typeof KEYS.HouseCocktail>>,
	Assert<Complete<TastingCourse, typeof KEYS.TastingCourse>>,
	Assert<Complete<Tasting, typeof KEYS.Tasting>>,
	Assert<Complete<LexiconTerm, typeof KEYS.LexiconTerm>>,
	Assert<Complete<ComponentCard, typeof KEYS.ComponentCard>>,
	Assert<Complete<CompareEntry, typeof KEYS.CompareEntry>>,
	Assert<Complete<HouseComponent, typeof KEYS.HouseComponent>>,
	Assert<Complete<Scenario, typeof KEYS.Scenario>>,
	Assert<Complete<MixUp, typeof KEYS.MixUp>>,
	Assert<Complete<MustKnow, typeof KEYS.MustKnow>>,
	Assert<Complete<AskAtLineup, typeof KEYS.AskAtLineup>>,
	Assert<Complete<DisputeSide, typeof KEYS.DisputeSide>>,
	Assert<Complete<Dispute, typeof KEYS.Dispute>>,
	Assert<Complete<HouseMeal, typeof KEYS.HouseMeal>>,
	Assert<Complete<HouseSource, typeof KEYS.HouseSource>>,
	Assert<Complete<HouseVideo, typeof KEYS.HouseVideo>>,
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
/**
 * The videos for one item, for the Watch block on its card: those that name
 * the item first, then those that name a lexicon term reaching the item, each
 * once, in the house's order within each half. An absent list reads as none.
 */
export function videosFor(house: House, itemId: string): HouseVideo[] {
	const videos = house.videos || [];
	const direct: HouseVideo[] = [];
	const viaTerm: HouseVideo[] = [];
	const terms = new Set<string>();
	for (const t of house.lexicon || []) if (t.itemIds.indexOf(itemId) >= 0) terms.add(t.id);
	for (const v of videos) {
		if (v.itemIds.indexOf(itemId) >= 0) direct.push(v);
		else if (v.termIds.some((id) => terms.has(id))) viaTerm.push(v);
	}
	return direct.concat(viaTerm);
}

/** The heading a video with no topic is listed under. */
export const VIDEO_TOPIC_NONE = 'More to watch';

/**
 * Every video by topic, for the Videos entry in a study view: the videos
 * about the house itself first, so their topics lead, then the rest in the
 * house's order; a topic is a group in the order it is first met, and a
 * video with no topic sits under VIDEO_TOPIC_NONE.
 */
export function videoGroups(house: House): Array<{ topic: string; videos: HouseVideo[] }> {
	const videos = house.videos || [];
	const ordered = videos.filter((v) => v.house).concat(videos.filter((v) => !v.house));
	const groups: Array<{ topic: string; videos: HouseVideo[] }> = [];
	const at = new Map<string, number>();
	for (const v of ordered) {
		const topic = v.topic.trim() || VIDEO_TOPIC_NONE;
		let i = at.get(topic);
		if (i === undefined) {
			i = groups.length;
			at.set(topic, i);
			groups.push({ topic, videos: [] });
		}
		groups[i].videos.push(v);
	}
	return groups;
}

/** The small line under a video's title: its channel and its length, either left out when unknown ("Brennan's, 6 min"). */
export function videoMeta(v: { channel: string; mins: number }): string {
	const parts: string[] = [];
	if (v.channel && v.channel.trim()) parts.push(v.channel.trim());
	if (v.mins > 0) parts.push(Math.max(1, Math.round(v.mins)) + ' min');
	return parts.join(', ');
}

/**
 * The components of one item, in the house's order: every component whose
 * itemIds name it. An absent list reads as none.
 */
export function componentsFor(house: House, itemId: string): HouseComponent[] {
	return (house.components || []).filter((c) => c.itemIds.indexOf(itemId) >= 0);
}

/**
 * The components of one item grouped by kind, in COMPONENT_KINDS order
 * (Ingredients, Techniques, Stories), a kind with none left out.
 */
export function componentGroups(house: House, itemId: string): Array<{ kind: ComponentKind; label: string; components: HouseComponent[] }> {
	const mine = componentsFor(house, itemId);
	const out: Array<{ kind: ComponentKind; label: string; components: HouseComponent[] }> = [];
	for (const kind of COMPONENT_KINDS) {
		const components = mine.filter((c) => c.kind === kind);
		if (components.length) out.push({ kind, label: COMPONENT_LABELS[kind], components });
	}
	return out;
}

/** The videos that teach one component, in the house's order. */
export function componentVideos(house: House, componentId: string): HouseVideo[] {
	return (house.videos || []).filter((v) => Array.isArray(v.componentIds) && v.componentIds.indexOf(componentId) >= 0);
}

/**
 * A tasting's name the short way a card or a heading wants it: the printed
 * name with a closing "at" and the house's own name taken off, so
 * "Traditional Breakfast at Brennan's" at Brennan's reads "Traditional
 * Breakfast". Curly and straight apostrophes count as one. A name that does
 * not end in the house's name is returned as printed, trimmed.
 */
export function tastingShortName(name: string, houseName: string): string {
	const n = typeof name === 'string' ? name.trim() : '';
	const h = typeof houseName === 'string' ? houseName.trim() : '';
	if (!n || !h) return n;
	const flat = (s: string): string => s.replace(/[\u2018\u2019]/g, "'").toLowerCase();
	const tail = ' at ' + h;
	if (n.length > tail.length && flat(n).endsWith(flat(tail))) return n.slice(0, n.length - tail.length).trim();
	return n;
}

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
 * is a string when present, and a value that is a string, a list of strings,
 * a list of records (the comparisons) or an object (the parts, the lines, the
 * pairing, a component's card). The shape only: whether
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
	/* A list of strings (the ids, the names) or a list of records (the comparisons), never a mix. */
	if (Array.isArray(value)) return value.every((s) => typeof s === 'string') || value.every((s) => !!s && typeof s === 'object' && !Array.isArray(s));
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
