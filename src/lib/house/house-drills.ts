/**
 * house-drills.ts: the offline drills over a House. Pure generators that
 * read KEPT marks only (by === 'person') and draw every random choice from
 * a source the caller hands in, never from Math.random, so a test deals the
 * same round twice and a screen seeds a round it can replay.
 *
 * Every comment in this file ships inside the ported static/shared/oot-house.js
 * (tools/port-house.mjs transpiles with comments kept, and its assertClean
 * refuses any dash spelling, a carriage return and a regex literal outside
 * ASCII), so the comments here are dash-free and every regex is ASCII.
 *
 * PURE AND PORTABLE: no import from outside src/lib/house, no DOM, no Node.
 * The port joins every house module inside one IIFE, so each top-level name
 * here is unique across the directory (the engine refuses a collision).
 *
 * WHAT A DRILL READS. A mark reaches a question only when a person kept it:
 * the kept lines, the kept parts, the kept pairing, a term's kept say and
 * toGuest, a mix-up's kept difference. A mark she wrote and nobody kept
 * produces nothing here, the same gate the guest menu and the deck keep.
 * The plain fields a drill reads (a name, a wine's grapes, a cocktail's
 * glass and spec) are the menu's own words, never hers.
 *
 * THE FLOOR. A multiple-choice question offers four options and every one
 * is a real item of this house, drawn from the whole list the answer sits
 * in, so a server never learns to discard a padded option without knowing
 * anything. A kind deals only when at least DRILL_FLOOR items are drillable
 * for it (carry the kept mark it reads) AND the house can supply four
 * distinct options; otherwise the generator returns null and the screen
 * says what is still needed, from drillableCounts.
 *
 * NO QUESTION ANSWERS ITSELF. The stem of a question never carries its
 * answer: a kept line that names the dish, a wine named for its grape, a
 * cocktail named for its glass are left out of that kind's pool rather than
 * asked. The test holds the rule over every kind and many seeds.
 */
import { COCKTAIL_PARTS, DISH_PARTS, KEYS, WINE_PARTS, isMark } from './house-schema';
import type {
	FormulaParts,
	House,
	HouseItem,
	ItemKind,
	LexiconTerm,
	Lines,
	Mark,
	MixUp,
	Pairing
} from './house-schema';

/** A random source: a draw in [0, 1). Always an argument, never Math.random. */
export type Rand = () => number;

/* -------------------------------------------------------------------------
 * The kinds, the floors and the labels
 * ---------------------------------------------------------------------- */

/** The twelve multiple-choice kinds, in the order a screen lists them. */
export const DRILL_KINDS = [
	'lineToDish',
	'sauceOf',
	'sidesOf',
	'firstPickFor',
	'zeroProofFor',
	'termToGuest',
	'sayIt',
	'mixUp',
	'wineGrapes',
	'wineGoesWith',
	'cocktailGlass',
	'cocktailSpec'
] as const;
export type DrillKind = (typeof DRILL_KINDS)[number];

/** Four options on every question, and four drillable items before a kind deals. */
export const OPTION_COUNT = 4;
export const DRILL_FLOOR = 4;

/** The floor per kind: how many items must carry the kept mark the kind reads before it deals. */
export const DRILL_FLOORS: Readonly<Record<DrillKind, number>> = {
	lineToDish: DRILL_FLOOR,
	sauceOf: DRILL_FLOOR,
	sidesOf: DRILL_FLOOR,
	firstPickFor: DRILL_FLOOR,
	zeroProofFor: DRILL_FLOOR,
	termToGuest: DRILL_FLOOR,
	sayIt: DRILL_FLOOR,
	mixUp: DRILL_FLOOR,
	wineGrapes: DRILL_FLOOR,
	wineGoesWith: DRILL_FLOOR,
	cocktailGlass: DRILL_FLOOR,
	cocktailSpec: DRILL_FLOOR
};

/** What a screen prints above the stem, per kind. */
export const DRILL_LABELS: Readonly<Record<DrillKind, string>> = {
	lineToDish: 'Which dish is this line about?',
	sauceOf: 'Whose sauce and key flavours are these?',
	sidesOf: 'Whose accompaniments are these?',
	firstPickFor: 'Which wine is the first pick with this dish?',
	zeroProofFor: 'Which drink without alcohol goes with this dish?',
	termToGuest: 'Which word on the menu does this explain?',
	sayIt: 'Which word is said this way?',
	mixUp: 'Which pair does this tell apart?',
	wineGrapes: 'Which grapes go into this wine?',
	wineGoesWith: 'Which wine goes with these?',
	cocktailGlass: 'Which glass does this drink take?',
	cocktailSpec: 'Whose spec is this?'
};

/** The three timed lines, as a flashcard names them. */
export const LINE_LABELS: Readonly<Record<keyof Lines, string>> = {
	s10: 'in ten seconds',
	s20: 'in twenty seconds',
	s45: 'in forty five seconds'
};

/**
 * One multiple-choice question: the stem (the kept text or the item's name,
 * whichever the kind shows), four distinct options shuffled by the caller's
 * source, the answer (one of the options, to the character) and the id of
 * the house record the question is about.
 */
export interface DrillQuestion {
	kind: DrillKind;
	stem: string;
	options: string[];
	answer: string;
	itemId: string;
}

/** The five flashcard kinds: parts, lines, terms, mix-ups, pairings. */
export const FLASHCARD_KINDS = ['part', 'line', 'term', 'mixUp', 'pairing'] as const;
export type FlashcardKind = (typeof FLASHCARD_KINDS)[number];

export interface Flashcard {
	kind: FlashcardKind;
	front: string;
	back: string;
	itemId: string;
}

/* -------------------------------------------------------------------------
 * The small helpers
 * ---------------------------------------------------------------------- */

function plainText(v: unknown): string {
	return typeof v === 'string' ? v.trim() : '';
}

/** Lower case, whitespace collapsed: how two option strings are told apart and how a stem is searched for its answer. */
function foldAnswer(s: string): string {
	return plainText(s).toLowerCase().replace(/\s+/g, ' ');
}

/** The value of a mark a person kept; nothing for her unkept mark, a missing one, or a value that is not a mark. */
function keptValue<T>(m: Mark<T> | undefined): T | undefined {
	if (!isMark(m) || m.by !== 'person') return undefined;
	return m.value as T;
}

function keptText(m: Mark | undefined): string {
	return plainText(keptValue<string>(m));
}

/** An index under n from one draw; a draw outside [0, 1) counts as zero rather than reaching past the list. */
function drawIndex(rand: Rand, n: number): number {
	const r = rand();
	const i = r >= 0 && r < 1 ? Math.floor(r * n) : 0;
	return i < n ? i : 0;
}

function drawOne<T>(list: readonly T[], rand: Rand): T {
	return list[drawIndex(rand, list.length)];
}

/** Fisher and Yates on a copy, every swap from the caller's source. */
function shuffleBy<T>(list: readonly T[], rand: Rand): T[] {
	const out = list.slice();
	for (let i = out.length - 1; i > 0; i--) {
		const j = drawIndex(rand, i + 1);
		const t = out[i];
		out[i] = out[j];
		out[j] = t;
	}
	return out;
}

/** The strings with a blank or a repeat (by fold) dropped, first spelling kept, order kept. */
function distinctText(list: readonly string[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const s of list) {
		const t = plainText(s);
		const f = foldAnswer(t);
		if (!f || seen.has(f)) continue;
		seen.add(f);
		out.push(t);
	}
	return out;
}

/** True when the stem, folded, carries the answer, folded: a question that would answer itself. */
function selfAnswering(stem: string, answer: string): boolean {
	return foldAnswer(stem).indexOf(foldAnswer(answer)) !== -1;
}

function nameOf(item: { name: string } | undefined): string {
	return item ? plainText(item.name) : '';
}

function itemsOf(house: House): HouseItem[] {
	return ([] as HouseItem[]).concat(house.dishes, house.wines, house.cocktails);
}

function itemById(house: House): Map<string, HouseItem> {
	const out = new Map<string, HouseItem>();
	for (const item of itemsOf(house)) out.set(item.id, item);
	return out;
}

/** The item an id names, when it is of the kind asked for and carries a name. */
function namedItem(byId: Map<string, HouseItem>, id: unknown, kind: ItemKind): HouseItem | undefined {
	const item = byId.get(plainText(id));
	return item && item.kind === kind && nameOf(item) ? item : undefined;
}

function partLabels(kind: ItemKind): Readonly<Record<keyof FormulaParts, string>> {
	return kind === 'wine' ? WINE_PARTS : kind === 'cocktail' ? COCKTAIL_PARTS : DISH_PARTS;
}

/** The grapes of a wine as one string, as a question shows them. */
function grapesText(grapes: readonly string[]): string {
	return Array.isArray(grapes) ? grapes.map(plainText).filter(Boolean).join(', ') : '';
}

/** The spec of a cocktail as one string, as a question shows it. */
function specText(spec: readonly string[]): string {
	return Array.isArray(spec) ? spec.map(plainText).filter(Boolean).join(', ') : '';
}

/** The two names of a mix-up as one label, or nothing when either side does not resolve to a named item. */
function pairLabel(m: MixUp, byId: Map<string, HouseItem>): string {
	const a = byId.get(plainText(m.aId));
	const b = byId.get(plainText(m.bId));
	return a && b && nameOf(a) && nameOf(b) ? nameOf(a) + ' or ' + nameOf(b) : '';
}

/* -------------------------------------------------------------------------
 * The pools and the fields, one spec per kind
 * ---------------------------------------------------------------------- */

/**
 * One drillable record: what the question is about, the stems it may show
 * (a kind with two lines to choose from offers both) and the one answer.
 * A stem that carries the answer is dropped before the candidate is made.
 */
interface Candidate {
	itemId: string;
	stems: string[];
	answer: string;
}

/**
 * A kind as its two readers: `pool` is every record the kind can ask about
 * (the drillable items, counted by drillableCounts and held to the floor),
 * `field` is every string the kind may offer as an option, drawn from the
 * whole list the answer sits in. Neither spends a draw.
 */
interface KindSpec {
	pool: (house: House) => Candidate[];
	field: (house: House) => string[];
}

function candidate(itemId: string, answer: string, stems: readonly string[]): Candidate | undefined {
	const a = plainText(answer);
	if (!a) return undefined;
	const kept: string[] = [];
	for (const s of stems) {
		const t = plainText(s);
		if (t && !selfAnswering(t, a)) kept.push(t);
	}
	return kept.length ? { itemId, stems: kept, answer: a } : undefined;
}

function poolOf(found: Array<Candidate | undefined>): Candidate[] {
	const out: Candidate[] = [];
	for (const c of found) if (c) out.push(c);
	return out;
}

/** Each dish with the kept part named, the part as the stem and the dish as the answer. */
function partPool(house: House, part: keyof FormulaParts): Candidate[] {
	return poolOf(
		house.dishes.map((d) => {
			const parts = keptValue<FormulaParts>(d.parts);
			return parts ? candidate(d.id, nameOf(d), [parts[part]]) : undefined;
		})
	);
}

/** Each dish with a kept pairing whose named pick resolves, the dish as the stem and the pick as the answer. */
function pairingPool(house: House, which: 'wineId' | 'zeroProofId', kind: ItemKind): Candidate[] {
	const byId = itemById(house);
	return poolOf(
		house.dishes.map((d) => {
			const p = keptValue<Pairing>(d.pairing);
			const pick = p ? namedItem(byId, p[which], kind) : undefined;
			return pick ? candidate(d.id, nameOf(pick), [nameOf(d)]) : undefined;
		})
	);
}

const dishNames = (house: House): string[] => house.dishes.map(nameOf);
const wineNames = (house: House): string[] => house.wines.map(nameOf);
const cocktailNames = (house: House): string[] => house.cocktails.map(nameOf);
const termNames = (house: House): string[] => house.lexicon.map((t: LexiconTerm) => plainText(t.term));

const SPECS: Readonly<Record<DrillKind, KindSpec>> = {
	lineToDish: {
		pool: (house) =>
			poolOf(
				house.dishes.map((d) => {
					const lines = keptValue<Lines>(d.lines);
					return lines ? candidate(d.id, nameOf(d), [lines.s10, lines.s20]) : undefined;
				})
			),
		field: dishNames
	},
	sauceOf: { pool: (house) => partPool(house, 'sauce'), field: dishNames },
	sidesOf: { pool: (house) => partPool(house, 'sides'), field: dishNames },
	firstPickFor: { pool: (house) => pairingPool(house, 'wineId', 'wine'), field: wineNames },
	zeroProofFor: { pool: (house) => pairingPool(house, 'zeroProofId', 'cocktail'), field: cocktailNames },
	termToGuest: {
		pool: (house) => poolOf(house.lexicon.map((t) => candidate(t.id, plainText(t.term), [keptText(t.toGuest)]))),
		field: termNames
	},
	sayIt: {
		/* A term or an item of any kind with a kept say; the options are every term and every item name. */
		pool: (house) =>
			poolOf(
				([] as Array<Candidate | undefined>).concat(
					house.lexicon.map((t) => candidate(t.id, plainText(t.term), [keptText(t.say)])),
					itemsOf(house).map((item) => candidate(item.id, nameOf(item), [keptText(item.say)]))
				)
			),
		field: (house) => termNames(house).concat(itemsOf(house).map(nameOf))
	},
	mixUp: {
		pool: (house) => {
			const byId = itemById(house);
			return poolOf(house.mixUps.map((m) => candidate(m.id, pairLabel(m, byId), [keptText(m.difference)])));
		},
		field: (house) => {
			const byId = itemById(house);
			return house.mixUps.map((m) => pairLabel(m, byId));
		}
	},
	wineGrapes: {
		pool: (house) => poolOf(house.wines.map((w) => candidate(w.id, grapesText(w.grapes), [nameOf(w)]))),
		field: (house) => house.wines.map((w) => grapesText(w.grapes))
	},
	wineGoesWith: {
		pool: (house) => poolOf(house.wines.map((w) => candidate(w.id, nameOf(w), [keptText(w.goesWith)]))),
		field: wineNames
	},
	cocktailGlass: {
		pool: (house) => poolOf(house.cocktails.map((b) => candidate(b.id, plainText(b.glass), [nameOf(b)]))),
		field: (house) => house.cocktails.map((b) => plainText(b.glass))
	},
	cocktailSpec: {
		pool: (house) => poolOf(house.cocktails.map((b) => candidate(b.id, nameOf(b), [specText(b.spec)]))),
		field: cocktailNames
	}
};

/* -------------------------------------------------------------------------
 * Dealing
 * ---------------------------------------------------------------------- */

/**
 * One question of a kind, or null when the house cannot supply it: fewer
 * drillable items than the kind's floor, or fewer than four distinct
 * options. The record is drawn, then its stem, then three distractors from
 * the field with the answer's own spelling and its folded twins left out,
 * then the four are shuffled; every draw is from `rand`.
 */
export function dealQuestion(house: House, kind: DrillKind, rand: Rand): DrillQuestion | null {
	const spec = SPECS[kind];
	const pool = spec.pool(house);
	if (pool.length < DRILL_FLOORS[kind]) return null;
	const field = distinctText(spec.field(house));
	if (field.length < OPTION_COUNT) return null;
	const c = drawOne(pool, rand);
	const stem = drawOne(c.stems, rand);
	const answerFold = foldAnswer(c.answer);
	const others = shuffleBy(
		field.filter((s) => foldAnswer(s) !== answerFold),
		rand
	).slice(0, OPTION_COUNT - 1);
	if (others.length < OPTION_COUNT - 1) return null;
	const options = shuffleBy([c.answer].concat(others), rand);
	return { kind, stem, options, answer: c.answer, itemId: c.itemId };
}

/** A kept ten or twenty second line: which dish? */
export function lineToDish(house: House, rand: Rand): DrillQuestion | null {
	return dealQuestion(house, 'lineToDish', rand);
}
/** The kept sauce and key flavours: which dish? */
export function sauceOf(house: House, rand: Rand): DrillQuestion | null {
	return dealQuestion(house, 'sauceOf', rand);
}
/** The kept accompaniments: which dish? */
export function sidesOf(house: House, rand: Rand): DrillQuestion | null {
	return dealQuestion(house, 'sidesOf', rand);
}
/** A dish with a kept pairing: which wine is the first pick? Options from the house's wines. */
export function firstPickFor(house: House, rand: Rand): DrillQuestion | null {
	return dealQuestion(house, 'firstPickFor', rand);
}
/** A dish with a kept pairing: which drink without alcohol? Options from the house's cocktails. */
export function zeroProofFor(house: House, rand: Rand): DrillQuestion | null {
	return dealQuestion(house, 'zeroProofFor', rand);
}
/** A term's kept toGuest: which term? */
export function termToGuest(house: House, rand: Rand): DrillQuestion | null {
	return dealQuestion(house, 'termToGuest', rand);
}
/** A term's or an item's kept say: which? */
export function sayIt(house: House, rand: Rand): DrillQuestion | null {
	return dealQuestion(house, 'sayIt', rand);
}
/** A mix-up's kept difference: which pair? */
export function mixUp(house: House, rand: Rand): DrillQuestion | null {
	return dealQuestion(house, 'mixUp', rand);
}
/** A wine by name: which grapes? */
export function wineGrapes(house: House, rand: Rand): DrillQuestion | null {
	return dealQuestion(house, 'wineGrapes', rand);
}
/** A wine's kept goesWith: which wine? */
export function wineGoesWith(house: House, rand: Rand): DrillQuestion | null {
	return dealQuestion(house, 'wineGoesWith', rand);
}
/** A cocktail by name: which glass? */
export function cocktailGlass(house: House, rand: Rand): DrillQuestion | null {
	return dealQuestion(house, 'cocktailGlass', rand);
}
/** A cocktail's spec, from its parts: which drink? */
export function cocktailSpec(house: House, rand: Rand): DrillQuestion | null {
	return dealQuestion(house, 'cocktailSpec', rand);
}

/* -------------------------------------------------------------------------
 * What the screens ask before a round
 * ---------------------------------------------------------------------- */

/** How many items are drillable per kind: the records that carry the kept mark the kind reads and do not answer themselves. */
export function drillableCounts(house: House): Record<DrillKind, number> {
	const out = {} as Record<DrillKind, number>;
	for (const kind of DRILL_KINDS) out[kind] = SPECS[kind].pool(house).length;
	return out;
}

/** The kinds that deal now: the floor met and four distinct options in the field. Spends no draw. */
export function readyKinds(house: House): DrillKind[] {
	const out: DrillKind[] = [];
	for (const kind of DRILL_KINDS) {
		const spec = SPECS[kind];
		if (spec.pool(house).length < DRILL_FLOORS[kind]) continue;
		if (distinctText(spec.field(house)).length < OPTION_COUNT) continue;
		out.push(kind);
	}
	return out;
}

/* -------------------------------------------------------------------------
 * Flashcards
 * ---------------------------------------------------------------------- */

function cardBack(name: string, why: string): string {
	const w = plainText(why);
	return w ? name + '. ' + w : name;
}

/**
 * The flashcard deck over the kept marks: one card per kept part, per kept
 * line, per kept say and toGuest on a term, per kept difference and ask on
 * a mix-up, and per resolved first pick and zero-proof pick in a kept
 * pairing. The order is the record's; the screen shuffles. A mark nobody
 * kept makes no card.
 */
export function buildFlashcards(house: House): Flashcard[] {
	const out: Flashcard[] = [];
	const byId = itemById(house);
	for (const item of itemsOf(house)) {
		const name = nameOf(item);
		if (!name) continue;
		const labels = partLabels(item.kind);
		const parts = keptValue<FormulaParts>(item.parts);
		if (parts) {
			for (const key of KEYS.FormulaParts) {
				const text = plainText(parts[key]);
				if (text) out.push({ kind: 'part', front: name + ': ' + labels[key], back: text, itemId: item.id });
			}
		}
		const lines = keptValue<Lines>(item.lines);
		if (lines) {
			for (const key of KEYS.Lines) {
				const text = plainText(lines[key]);
				if (text) out.push({ kind: 'line', front: name + ' ' + LINE_LABELS[key], back: text, itemId: item.id });
			}
		}
	}
	for (const t of house.lexicon) {
		const term = plainText(t.term);
		if (!term) continue;
		const say = keptText(t.say);
		if (say) out.push({ kind: 'term', front: term + ': how to say it', back: say, itemId: t.id });
		const toGuest = keptText(t.toGuest);
		if (toGuest) out.push({ kind: 'term', front: term + ': what to tell a guest', back: toGuest, itemId: t.id });
	}
	for (const m of house.mixUps) {
		const label = pairLabel(m, byId);
		if (!label) continue;
		const difference = keptText(m.difference);
		if (difference) out.push({ kind: 'mixUp', front: label, back: difference, itemId: m.id });
		const ask = keptText(m.ask);
		if (ask) out.push({ kind: 'mixUp', front: label + ': what do you ask?', back: ask, itemId: m.id });
	}
	for (const d of house.dishes) {
		const name = nameOf(d);
		const p = keptValue<Pairing>(d.pairing);
		if (!name || !p) continue;
		const wine = namedItem(byId, p.wineId, 'wine');
		if (wine) out.push({ kind: 'pairing', front: name + ': the first pick', back: cardBack(nameOf(wine), p.sayIt || p.why), itemId: d.id });
		const zero = namedItem(byId, p.zeroProofId, 'cocktail');
		if (zero) out.push({ kind: 'pairing', front: name + ': without alcohol', back: cardBack(nameOf(zero), p.zeroProofWhy), itemId: d.id });
	}
	return out;
}
