/**
 * The study view's rules: what /menu shows when a house is current and the
 * person is learning it rather than editing it (docs/study-menus-design.md,
 * section 1.2). PURE: no DOM, no storage, no clock, no Svelte. Every function
 * takes what it needs, so the rules are tested under plain Node and the
 * components only draw.
 *
 * WHY HERE AND NOT IN src/lib/house. The design files these rules as
 * house-study.ts beside the engine and ports them to the two vanilla wings as
 * OOT.houseLib.study. The engine directory is another hand's to change, so
 * the Table's copy lives here with the same names and the same signatures;
 * when the engine module lands, this file becomes a re-export of it and the
 * components do not move.
 *
 * KEPT MARKS ONLY. Every mark read here is read through `kept()`, which
 * returns a value only when `by === 'person'`. A mark of hers that nobody
 * kept is never the house's word; the card says in one line that there is
 * something to look over behind Edit, and nothing more.
 *
 * NO ALLERGEN IS READ, INFERRED OR SHOWN HERE. The service note is a
 * person's own words and the card prints it verbatim under the fixed eyebrow.
 */
import { isMark, DISH_PARTS, COCKTAIL_PARTS, WINE_PARTS, KEYS, BOTTLE_TIERS, foldSize, wineListOf } from './house/house-schema';
import type {
	AskAtLineup,
	BottleTier,
	Dispute,
	FormulaParts,
	House,
	HouseCocktail,
	HouseDish,
	HouseItem,
	HouseWine,
	ItemKind,
	LexiconTerm,
	Lines,
	Mark,
	MixUp,
	Note,
	Pairing,
	Scenario,
	Tasting,
	TastingCourse
} from './house/house-schema';

/* -------------------------------------------------------------------------
 * The fixed questions and the words
 * ---------------------------------------------------------------------- */

export const ABOUT_Q = 'Tell me about it.';
export const SELL_Q = 'How do I sell it?';
export const ASK_Q = 'What do guests ask?';
export const WATCH_Q = 'What should I watch for?';
export const POUR_Q = 'How do I pour it?';
export const COACH_ORDER = [SELL_Q, ASK_Q, WATCH_Q, POUR_Q] as const;
export const FIXED_QS = [ABOUT_Q, ...COACH_ORDER] as const;

/**
 * Every string the study view prints, in one place (the design's section 9).
 * `{name}` placeholders are filled by `say()`. No dash of any kind and no
 * codepoint at or above U+2190 in any of them; the ellipsis and the middle
 * dot are below it. study.test.ts walks the lot.
 */
export const STUDY_WORDS = {
	back: 'Back to the menu',
	position: '{i} of {n} in {section}',
	found: '{i} of {n} found',
	findDish: 'Find a dish',
	all: 'All {n}',
	showing: 'Showing {section}: {n} {unit}',
	searchHits: '{n} found for {query}',
	searchNone: 'Nothing matches {query}.',
	clear: 'Clear the search',
	read: 'Menus read {date}',
	progress: '{studied} of {total} studied · {got} got it last time · {again} again',
	progressNone: 'nothing studied yet',
	cards: 'Flash cards',
	weak: 'My weak ones ({n})',
	weakNone: 'My weak ones: none yet',
	editOff: 'Edit the menu',
	editOn: 'Edit the menu: on',
	edit: 'Edit',
	ten: 'In ten seconds',
	twenty: 'Twenty seconds',
	twentyHide: 'Hide twenty seconds',
	fortyFive: 'Forty-five seconds',
	fortyFiveHide: 'Hide forty-five seconds',
	say: 'Say it',
	asPrinted: 'Prices as printed on {date}. Confirm before quoting.',
	allDay: 'All day',
	elsewhere: 'Elsewhere in the house',
	inRoom: '{name}, in the {room}',
	alsoHouse: 'Also in the house: {drinks} in the Ledger, {wines} in the Codex',
	nextOnly: 'Next',
	drillWhole: 'Drill the whole menu',
	tooSmall: '{section} is too small to drill alone.',
	deckHere: 'In the Floor Deck',
	linksWait: 'Finding links in this app…',
	libRecipe: "The Library's {name}: a recipe to cook, not the house's",
	libPour: 'What the Library would pour (not on our list)',
	about: 'About it',
	parts: 'The five parts',
	partsShow: 'Show the five parts',
	partsHide: 'Hide the five parts',
	pour: 'Pour with it',
	byBottle: 'By the bottle',
	tierValue: 'Value, under $100',
	tierClassic: 'Sweet spot, $100 to $250',
	tierSplurge: 'Celebration, over $250',
	tierHalf: 'Half-bottle',
	bin: 'Bin {bin}',
	pairMore: 'More on the pairing',
	floor: 'On the floor',
	confirm: 'To confirm at lineup',
	disagree: 'Two sources disagree',
	mixUp: 'Not to be confused with',
	more: 'More notes',
	earlier: 'Earlier answers',
	eyebrow: 'Your words. Allergens: confirm at lineup.',
	noteNone: 'No service note yet. Ask at lineup.',
	here: 'In this app',
	rooms: 'In the other rooms',
	offlineRoom: '(open the {room} once online and it stays with you offline)',
	cardsThis: 'Flash cards for this',
	sayBack: 'Say it back',
	drillSection: 'Drill this section',
	hers: 'Lizzy has written lines here that nobody has kept yet. Edit to look them over.',
	prev: 'Previous: {name}',
	next: 'Next: {name}',
	got: 'Got it',
	again: 'Again',
	count: 'Got it {g} · Again {a}',
	done: 'Deck complete',
	againDeck: 'Again: the {n} you marked',
	shuffle: 'Shuffle again',
	close: 'Close the deck',
	front: 'Say the ten second line aloud, then flip.',
	flip: 'Flip',
	opening: 'Opening the house…'
} as const;
export type StudyWordKey = keyof typeof STUDY_WORDS;

/** A word from STUDY_WORDS with its placeholders filled; an unfilled placeholder is left as written so a test sees it. */
export function say(key: StudyWordKey, vars: Record<string, string | number> = {}): string {
	return STUDY_WORDS[key].replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/* -------------------------------------------------------------------------
 * Small readers
 * ---------------------------------------------------------------------- */

/** The value of a mark a person kept, else undefined. The one gate. */
export function kept<T>(m: Mark<T> | undefined): T | undefined {
	if (!isMark(m) || m.by !== 'person') return undefined;
	return m.value as T;
}

function keptText(m: Mark | undefined): string {
	const v = kept<string>(m);
	return typeof v === 'string' ? v.trim() : '';
}

function plain(v: unknown): string {
	return typeof v === 'string' ? v.trim() : '';
}

/** Every item of the house, dishes then wines then cocktails, the order the record keeps. */
export function allItems(house: House): HouseItem[] {
	return ([] as HouseItem[]).concat(house.dishes ?? [], house.wines ?? [], house.cocktails ?? []);
}

export function itemsOfKind(house: House, kind: ItemKind): HouseItem[] {
	if (kind === 'dish') return house.dishes ?? [];
	if (kind === 'wine') return house.wines ?? [];
	return house.cocktails ?? [];
}

export function findItem(house: House, id: string): HouseItem | undefined {
	return allItems(house).find((it) => it.id === id);
}

/** True when any mark on the item is a person's. */
function anyKept(item: HouseItem): boolean {
	const rec = item as unknown as Record<string, unknown>;
	for (const v of Object.values(rec)) if (isMark(v) && v.by === 'person') return true;
	return false;
}

/** True when any mark on the item is hers and nobody kept it: the card's one line about Edit. */
export function hasUnkept(item: HouseItem): boolean {
	const rec = item as unknown as Record<string, unknown>;
	for (const v of Object.values(rec)) if (isMark(v) && v.by === 'maitre') return true;
	return false;
}

/* -------------------------------------------------------------------------
 * Folding and whole-word matching
 * ---------------------------------------------------------------------- */

/* The letters NFD does not split, as tools/slugify.mjs transliterates them. */
const TRANSLIT: Record<string, string> = {
	ø: 'o', Ø: 'o', æ: 'ae', Æ: 'ae', œ: 'oe', Œ: 'oe', ß: 'ss', ł: 'l', Ł: 'l',
	đ: 'd', Đ: 'd', ð: 'd', Ð: 'd', þ: 'th', Þ: 'th', ı: 'i', å: 'a', Å: 'a'
};
const TRANSLIT_RE = new RegExp('[' + Object.keys(TRANSLIT).join('') + ']', 'g');

/**
 * Fold for comparison: the untransliterable letters first, then NFD with the
 * combining marks removed, curly quotes straightened, lower case, `&` read as
 * "and", every run outside a to z and 0 to 9 one space, and one space at each
 * end so a whole-word test is a plain `includes`. Empty text folds to one space.
 */
export function fold(s: string): string {
	const t = String(s ?? '')
		.replace(TRANSLIT_RE, (c) => TRANSLIT[c] ?? c)
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[‘’‚‛]/g, "'")
		.replace(/[“”„‟]/g, '"')
		.toLowerCase()
		.replace(/&/g, ' and ')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
	return t ? ' ' + t + ' ' : ' ';
}

/**
 * Where a name first sits in a folded hay as a whole word, or -1: the name,
 * its -s plural or its -es plural (the Floor Deck's rule, nameInText). A
 * name under four characters never matches: "rum", "egg" and "ice" would
 * light up half the menu.
 */
export function nameIn(hay: string, name: string): number {
	const n = fold(name).trim();
	if (n.length < 4) return -1;
	let best = -1;
	for (const form of [n, n + 's', n + 'es']) {
		const i = hay.indexOf(' ' + form + ' ');
		if (i >= 0 && (best < 0 || i < best)) best = i;
	}
	return best;
}

/* -------------------------------------------------------------------------
 * Prices
 * ---------------------------------------------------------------------- */

/**
 * The one rule for a printed price. Each printed string exactly as the house
 * holds it; once when every meal prints the same string; else "meal printed"
 * joined by a middle dot. A wine's "By the glass" label is never printed,
 * because its printed string already names its measure. A wine with no price
 * and a pour on a tasting reads where it is poured. No price reads nothing.
 */
export function priceLine(item: HouseItem, house?: House): string {
	const prices = (item.prices ?? []).filter((p) => plain(p.printed));
	if (prices.length) {
		const strings = prices.map((p) => plain(p.printed));
		if (strings.every((s) => s === strings[0])) return strings[0];
		return prices
			.map((p) => {
				const meal = plain(p.meal);
				const label = item.kind === 'wine' && fold(meal) === ' by the glass ' ? '' : meal;
				return label ? label + ' ' + plain(p.printed) : plain(p.printed);
			})
			.join(' · ');
	}
	if (plain(item.price)) return plain(item.price);
	if (item.kind === 'wine' && house) {
		const on = tastingsFor(house, item.id).filter((t) => t.as === 'pour');
		if (on.length) {
			const names = [...new Set(on.map((t) => plain(t.tasting.name)).filter(Boolean))];
			const pour = (item as HouseWine).pours?.find((p) => plain(p)) ?? '';
			return 'Poured on the ' + names.join(' and the ') + (pour ? ', ' + plain(pour) : '');
		}
	}
	return '';
}

/* -------------------------------------------------------------------------
 * The rows
 * ---------------------------------------------------------------------- */

export interface StudyRow {
	id: string;
	kind: ItemKind;
	name: string;
	section: string;
	price: string;
	line: string;
	signature: boolean;
	hasKept: boolean;
}

function raise(s: string): string {
	const t = s.trim();
	return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

function firstSentence(s: string): string {
	const t = s.trim();
	const m = /^(.+?[.!?])(\s|$)/.exec(t);
	return m ? m[1] : t;
}

const WINE_FILLER = new Set(['the', 'a', 'an', 'our', 'from', 'by', 'in']);

/**
 * The short line under a row's name: the kept ten second line with a leading
 * copy of the name taken off; else the first sentence of the kept guest line;
 * else the menu's own words (a dish's description, a drink's spec, a wine's
 * style). Never cut here: the row clamps it to two lines in CSS.
 */
export function shortLine(item: HouseItem): string {
	const lines = kept<Lines>(item.lines);
	const s10 = plain(lines?.s10);
	if (s10) {
		const cut = s10.search(/[:,]/);
		if (cut > 0) {
			const head = fold(s10.slice(0, cut));
			const rest = s10.slice(cut + 1).trim();
			const name = fold(item.name);
			let drop = head === name || head === ' the' + name;
			if (!drop && item.kind === 'wine') {
				const w = item as HouseWine;
				const known = fold([w.name, w.producer, w.wine, w.region, ...(w.grapes ?? [])].join(' '));
				const words = head.trim().split(' ').filter(Boolean);
				drop = words.length > 0 && words.every((x) => WINE_FILLER.has(x) || known.includes(' ' + x + ' '));
			}
			if (drop && rest) return raise(rest);
		}
		return s10;
	}
	const guest = keptText(item.guest);
	if (guest) return firstSentence(guest);
	if (item.kind === 'dish') return plain((item as HouseDish).description);
	if (item.kind === 'cocktail') return ((item as HouseCocktail).spec ?? []).map(plain).filter(Boolean).join(', ');
	return plain((item as HouseWine).style);
}

/** One row per named item of the kind, in the house's own order. */
export function studyRows(house: House, kind: ItemKind): StudyRow[] {
	const out: StudyRow[] = [];
	for (const it of itemsOfKind(house, kind)) {
		const name = plain(it.name);
		if (!name) continue;
		out.push({
			id: it.id,
			kind,
			name,
			section: plain(it.section) || 'The menu',
			price: priceLine(it, house),
			line: shortLine(it),
			signature: it.kind === 'dish' ? !!(it as HouseDish).signature : false,
			hasKept: anyKept(it)
		});
	}
	return out;
}

/** The sections in order of first appearance, each with its count. */
export function studySections(rows: readonly StudyRow[]): Array<{ section: string; count: number }> {
	const order: string[] = [];
	const counts = new Map<string, number>();
	for (const r of rows) {
		if (!counts.has(r.section)) order.push(r.section);
		counts.set(r.section, (counts.get(r.section) ?? 0) + 1);
	}
	return order.map((section) => ({ section, count: counts.get(section) ?? 0 }));
}

/* -------------------------------------------------------------------------
 * Search
 * ---------------------------------------------------------------------- */

function searchHay(item: HouseItem): string {
	const lines = kept<Lines>(item.lines);
	const bits: string[] = [item.name, item.section, plain(lines?.s10)];
	if (item.kind === 'dish') {
		const d = item as HouseDish;
		bits.push(d.description, ...(d.ingredients ?? []));
	} else if (item.kind === 'cocktail') {
		const c = item as HouseCocktail;
		bits.push(...(c.spec ?? []), c.family, c.spirit);
	} else {
		const w = item as HouseWine;
		bits.push(w.producer, w.wine, w.vintage, w.region, ...(w.grapes ?? []), w.style);
	}
	return fold(bits.map(plain).join(' '));
}

function matches(item: HouseItem, query: string): boolean {
	const tokens = fold(query).trim().split(' ').filter(Boolean);
	if (!tokens.length) return true;
	const hay = searchHay(item);
	return tokens.every((t) => hay.includes(t));
}

/** The rows whose item holds every folded word of the query, in order. An empty query keeps every row. */
export function searchRows(house: House, rows: readonly StudyRow[], query: string): StudyRow[] {
	if (!fold(query).trim()) return rows.slice();
	const byId = new Map(allItems(house).map((it) => [it.id, it]));
	return rows.filter((r) => {
		const it = byId.get(r.id);
		return it ? matches(it, query) : false;
	});
}

/** The same match over the house's other two kinds: at most five, in the record's order. */
export function searchElsewhere(house: House, kind: ItemKind, query: string): Array<{ kind: ItemKind; id: string; name: string }> {
	if (!fold(query).trim()) return [];
	const out: Array<{ kind: ItemKind; id: string; name: string }> = [];
	for (const k of ['dish', 'wine', 'cocktail'] as const) {
		if (k === kind) continue;
		for (const it of itemsOfKind(house, k)) {
			if (out.length >= 5) return out;
			if (plain(it.name) && matches(it, query)) out.push({ kind: k, id: it.id, name: plain(it.name) });
		}
	}
	return out;
}

/* -------------------------------------------------------------------------
 * The shift filter
 * ---------------------------------------------------------------------- */

/** The house's meals by name, each once, in the card's order: the shift chips. */
export function mealsOf(house: House): string[] {
	const out: string[] = [];
	for (const m of house.meals ?? []) {
		const n = plain(m?.name);
		if (n && !out.includes(n)) out.push(n);
	}
	return out;
}

/** True when the item is served at that meal; an item nobody tagged is kept under every meal, and '' is all day. */
export function inMeal(item: HouseItem, meal: string): boolean {
	if (!meal) return true;
	const meals = (item.meals ?? []).map(plain).filter(Boolean);
	return !meals.length || meals.includes(meal);
}

/* -------------------------------------------------------------------------
 * Notes, lines, parts
 * ---------------------------------------------------------------------- */

export interface ItemNotes {
	about: Note | null;
	coaching: Array<{ q: string; note: Note }>;
	more: Note[];
	earlier: Note[];
}

/** The kept notes sorted under the fixed questions, the newest answer to each; the older ones are earlier answers. */
export function notesFor(item: HouseItem): ItemNotes {
	const notes = (item.kept ?? []).filter((n) => n && typeof n.q === 'string' && typeof n.a === 'string' && n.a.trim());
	const newestFirst = notes.slice().sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
	const fixed = new Set<string>(FIXED_QS);
	const newest = new Map<string, Note>();
	const earlier: Note[] = [];
	const more: Note[] = [];
	for (const n of newestFirst) {
		const q = n.q.trim();
		if (fixed.has(q)) {
			if (newest.has(q)) earlier.push(n);
			else newest.set(q, n);
		} else more.push(n);
	}
	const coaching: Array<{ q: string; note: Note }> = [];
	for (const q of COACH_ORDER) {
		const n = newest.get(q);
		if (n) coaching.push({ q, note: n });
	}
	return { about: newest.get(ABOUT_Q) ?? null, coaching, more, earlier };
}

/** The kept three lines, and whether the kept guest line says anything the twenty second line does not. */
export function linesShown(item: HouseItem): { s10: string; s20: string; s45: string; guest: string; guestShown: boolean } {
	const l = kept<Lines>(item.lines);
	const s20 = plain(l?.s20);
	const guest = keptText(item.guest);
	return { s10: plain(l?.s10), s20, s45: plain(l?.s45), guest, guestShown: !!guest && guest !== s20 };
}

export const PART_LABELS = { dish: DISH_PARTS, cocktail: COCKTAIL_PARTS, wine: WINE_PARTS } as const;

/**
 * The kept five parts with the kind's labels, empty ones left out. For a
 * wine, "the profile" goes when its fold is contained in the kept profile's,
 * and "what it goes with" when contained in the kept goes-with, because the
 * card prints those fields in their own blocks.
 */
export function partsShown(item: HouseItem): Array<[string, string]> {
	const parts = kept<FormulaParts>(item.parts);
	if (!parts) return [];
	const labels = PART_LABELS[item.kind];
	const out: Array<[string, string]> = [];
	for (const key of KEYS.FormulaParts) {
		const text = plain(parts[key]);
		if (!text) continue;
		if (item.kind === 'wine') {
			const w = item as HouseWine;
			if (key === 'sauce' && fold(keptText(w.profile)).includes(fold(text))) continue;
			if (key === 'sides' && fold(keptText(w.goesWith)).includes(fold(text))) continue;
		}
		out.push([labels[key], text]);
	}
	return out;
}

/* -------------------------------------------------------------------------
 * What the house says about the item elsewhere
 * ---------------------------------------------------------------------- */

export function tastingsFor(house: House, itemId: string): Array<{ tasting: Tasting; course: TastingCourse; as: 'dish' | 'pour' }> {
	const out: Array<{ tasting: Tasting; course: TastingCourse; as: 'dish' | 'pour' }> = [];
	for (const t of house.tastings ?? []) {
		for (const c of t.courses ?? []) {
			if ((c.dishIds ?? []).includes(itemId)) out.push({ tasting: t, course: c, as: 'dish' });
			if (c.pourId === itemId) out.push({ tasting: t, course: c, as: 'pour' });
		}
	}
	return out;
}

export function lineupFor(
	house: House,
	itemId: string
): {
	asks: AskAtLineup[];
	disputes: Dispute[];
	mixUps: MixUp[];
	terms: LexiconTerm[];
	scenarios: Scenario[];
	tastings: Array<{ tasting: Tasting; course: TastingCourse; as: 'dish' | 'pour' }>;
} {
	return {
		asks: (house.askAtLineup ?? []).filter((a) => (a.itemIds ?? []).includes(itemId)),
		disputes: (house.disputes ?? []).filter((d) => d.itemId === itemId),
		mixUps: (house.mixUps ?? []).filter((m) => m.aId === itemId || m.bId === itemId),
		terms: (house.lexicon ?? []).filter((t) => (t.itemIds ?? []).includes(itemId)),
		scenarios: (house.scenarios ?? []).filter((s) => (s.itemIds ?? []).includes(itemId)),
		tastings: tastingsFor(house, itemId)
	};
}

/* -------------------------------------------------------------------------
 * The flash cards
 * ---------------------------------------------------------------------- */

export type StudyScope = { all: true } | { section: string } | { itemIds: readonly string[] };

export interface CardBack {
	s10: string;
	price: string;
	parts: Array<[label: string, text: string]>;
	pairs: Array<[label: string, text: string]>;
	say: string;
}
export interface ItemCard {
	itemId: string;
	kind: ItemKind;
	name: string;
	section: string;
	back: CardBack;
}

function nameById(house: House, id: string): string {
	return id ? plain(findItem(house, id)?.name) : '';
}

/** What a card's back says to pour or offer next, by kind, from kept marks only. */
export function pairsFor(house: House, item: HouseItem): Array<[string, string]> {
	const out: Array<[string, string]> = [];
	if (item.kind === 'dish') {
		const p = kept<Pairing>((item as HouseDish).pairing);
		if (p) {
			const wine = findItem(house, p.wineId);
			if (wine) {
				const price = priceLine(wine, house);
				out.push(['First pick', plain(wine.name) + (price ? ', ' + price : '')]);
			}
			const zero = nameById(house, p.zeroProofId);
			if (zero) out.push(['Without alcohol', zero]);
		}
	} else if (item.kind === 'cocktail') {
		const ids = kept<string[]>((item as HouseCocktail).upsells) ?? [];
		const names = ids.map((id) => nameById(house, id)).filter(Boolean);
		if (names.length) out.push(['Offer next', names.join(', ')]);
	} else {
		const ids = kept<string[]>((item as HouseWine).firstPickIds) ?? [];
		const names = ids.map((id) => nameById(house, id)).filter(Boolean);
		if (names.length) out.push(['First picks', names.join(', ')]);
	}
	return out;
}

/* -------------------------------------------------------------------------
 * By the bottle: a dish's bottle tiers
 * ---------------------------------------------------------------------- */

/** The word over each tier, in the order a server offers them. */
export const TIER_WORDS: Readonly<Record<BottleTier, StudyWordKey>> = {
	value: 'tierValue',
	classic: 'tierClassic',
	splurge: 'tierSplurge',
	half: 'tierHalf'
};

/** One bottle offered with a dish, ready to draw: the tier, the wine and everything the row prints. */
export interface BottleRow {
	tier: BottleTier;
	label: string;
	wineId: string;
	bin: string;
	name: string;
	vintage: string;
	price: string;
	/** The size as printed, only when it is not the standard 750ml. */
	size: string;
	why: string;
	sayIt: string;
}

/**
 * The bottles offered with a dish, one row per tier in BOTTLE_TIERS order,
 * from the KEPT pairing only. A tier whose wine is not a house wine on the
 * bottle list is left out, so a row always opens a real card. The name is
 * the producer and the wine when both are there (the vintage is its own
 * field), else the house's name for it; the price is the printed bottle
 * price, else the item's price line.
 */
export function bottlesFor(house: House, dish: HouseItem): BottleRow[] {
	if (dish.kind !== 'dish') return [];
	const p = kept<Pairing>((dish as HouseDish).pairing);
	const tiers = p && p.bottles;
	if (!tiers) return [];
	const out: BottleRow[] = [];
	for (const tier of BOTTLE_TIERS) {
		const pick = tiers[tier];
		if (!pick) continue;
		const w = findItem(house, pick.wineId);
		if (!w || w.kind !== 'wine' || wineListOf(w) !== 'bottle') continue;
		const wine = w as HouseWine;
		const both = plain(wine.producer) && plain(wine.wine);
		const size = plain(wine.size);
		out.push({
			tier,
			label: say(TIER_WORDS[tier]),
			wineId: wine.id,
			bin: plain(wine.bin),
			/* The producer once: a wine named for its estate (Opus One, Château Latour Pauillac) is not doubled. */
			name: both ? (plain(wine.wine).toLowerCase().startsWith(plain(wine.producer).toLowerCase()) ? plain(wine.wine) : plain(wine.producer) + ' ' + plain(wine.wine)) : plain(wine.name),
			vintage: both ? plain(wine.vintage) : '',
			price: plain(wine.bottle) || priceLine(wine, house),
			size: size && foldSize(size) !== '750ml' ? size : '',
			why: plain(pick.why),
			sayIt: plain(pick.sayIt)
		});
	}
	return out;
}

/** True when the item is in the scope. */
export function inScope(item: { id: string; section: string }, scope: StudyScope): boolean {
	if ('all' in scope) return true;
	if ('section' in scope) return plain(item.section) === scope.section;
	return scope.itemIds.includes(item.id);
}

/** One card per item in scope that has a kept ten second line or kept parts, in the menu's order. */
export function itemCards(house: House, kind: ItemKind, scope: StudyScope): ItemCard[] {
	const out: ItemCard[] = [];
	for (const it of itemsOfKind(house, kind)) {
		const name = plain(it.name);
		if (!name || !inScope(it, scope)) continue;
		const s10 = linesShown(it).s10;
		const parts = partsShown(it);
		if (!s10 && !parts.length) continue;
		out.push({
			itemId: it.id,
			kind,
			name,
			section: plain(it.section) || 'The menu',
			back: { s10, price: priceLine(it, house), parts, pairs: pairsFor(house, it), say: keptText(it.say) }
		});
	}
	return out;
}

/* -------------------------------------------------------------------------
 * Progress
 * ---------------------------------------------------------------------- */

export type Verdict = 'got' | 'again';
export interface StudyProgress {
	total: number;
	studied: number;
	got: number;
	again: number;
	againIds: string[];
}

/** The header's progress over the items in the menu's order, from each item's latest verdict. */
export function studyProgress(itemIds: readonly string[], latest: ReadonlyMap<string, Verdict>): StudyProgress {
	let got = 0;
	let again = 0;
	const againIds: string[] = [];
	for (const id of itemIds) {
		const v = latest.get(id);
		if (v === 'got') got++;
		else if (v === 'again') {
			again++;
			againIds.push(id);
		}
	}
	return { total: itemIds.length, studied: got + again, got, again, againIds };
}

/**
 * The Table's own records read as verdicts: the newest entry in the house
 * drill slot for `house:<houseId>:<itemId>:` of any kind; met or close is
 * got, missed is again. The entries come in as the slot holds them (oldest
 * first), so the last one seen per item wins.
 */
export function latestVerdicts(houseId: string, entries: ReadonlyArray<{ k: string; v: string; at: number }>): Map<string, Verdict> {
	const head = 'house:' + houseId + ':';
	const best = new Map<string, { at: number; v: Verdict }>();
	for (const e of entries) {
		if (!e.k.startsWith(head)) continue;
		const itemId = e.k.slice(head.length).split(':')[0];
		if (!itemId) continue;
		const v: Verdict = e.v === 'missed' ? 'again' : 'got';
		const prev = best.get(itemId);
		if (!prev || e.at >= prev.at) best.set(itemId, { at: e.at, v });
	}
	return new Map([...best].map(([id, x]) => [id, x.v]));
}

/** The menu's date as the header prints it, or the ISO string when the locale call throws. */
export function readOnWords(iso: string): string {
	if (!iso) return '';
	try {
		const d = new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : ''));
		if (Number.isNaN(d.getTime())) return iso;
		return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
	} catch {
		return iso;
	}
}
