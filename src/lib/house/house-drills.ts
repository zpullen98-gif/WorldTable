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
 * SAID ALOUD, GRADED OFFLINE. gradeSaid and gradeScenario, at the foot of
 * this file, grade what a person said (typed, or heard by the browser's own
 * speech service) against what they KEPT, with no model and no network: the
 * same words in, the same grade out, on every wing and with no key.
 *
 * NO QUESTION ANSWERS ITSELF. The stem of a question never carries its
 * answer: a kept line that names the dish, a wine named for its grape, a
 * cocktail named for its glass are left out of that kind's pool rather than
 * asked. The test holds the rule over every kind and many seeds.
 */
import { COCKTAIL_PARTS, DISH_PARTS, KEYS, LINE_CAPS, WINE_PARTS, isMark } from './house-schema';
import type {
	FormulaParts,
	House,
	HouseItem,
	ItemKind,
	LexiconTerm,
	Lines,
	Mark,
	MixUp,
	Pairing,
	Scenario
} from './house-schema';
import { wordCount } from './house-lines';

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

/* -------------------------------------------------------------------------
 * Say it back and Guest at the table, graded offline
 * ---------------------------------------------------------------------- */

/**
 * WHAT THE GRADERS DO. A person says a line aloud (or types it) and the
 * grader holds it against what they KEPT: for Say it back, the item's kept
 * five parts, part by part, and the kept timed line's word cap; for Guest
 * at the table, the scenario's kept answer, clause by clause. No model, no
 * network, no key, no clock and no random source: the same words always
 * earn the same grade, in every wing.
 *
 * HOW A WORD MEETS A WORD. Both sides are folded the same way: lower case,
 * accents off (creme fraiche meets the printed spelling with its accents),
 * a curly apostrophe read as a straight one and a possessive dropped, a
 * hyphenated run read as its words, a short stop list and a few filler
 * words left out, and a light suffix strip so glazed meets glaze and leeks
 * meet leek. The strip is crude on purpose: it only has to treat both
 * sides alike, never to be good English.
 *
 * WHAT IS NEVER READ. Only kept marks (by === 'person'). Her unkept line
 * grades nothing and the grader returns null, the gate every drill keeps.
 * The service note is never read, and nothing here says anything about
 * allergens: a grade is about the words of the line, and the kitchen
 * answers the rest at lineup.
 */

/** The three timed lines by their length key. */
export type SayLength = keyof Lines;

/** A grade in a word, never a colour: met, close or missed. */
export type SaidVerdict = 'met' | 'close' | 'missed';

/** Coverage at or above this, within the cap, is met; at or above GRADE_CLOSE is close. */
export const GRADE_MET = 0.8;
export const GRADE_CLOSE = 0.5;

/**
 * One part of a kept answer, as graded: its key, its label, whether it was
 * hit, its terms and the ones said, and whether the kept line of this
 * length carries it (a part the line leaves out is shown, never demanded).
 */
export interface SaidPart {
	key: string;
	label: string;
	hit: boolean;
	terms: string[];
	matched: string[];
	inLine: boolean;
}

export interface SaidGrade {
	itemId: string;
	kind: ItemKind;
	name: string;
	length: SayLength;
	cap: number;
	words: number;
	over: number;
	keptLine: string;
	parts: SaidPart[];
	nameSaid: boolean;
	coverage: number;
	verdict: SaidVerdict;
	notes: string[];
}

/** A house item named in what was said, or one of the scenario's own items and whether it was named. */
export interface NamedItem {
	id: string;
	name: string;
	named: boolean;
}

export interface ScenarioGrade {
	scenarioId: string;
	title: string;
	guest: string;
	keptYou: string;
	principle: string;
	words: number;
	terms: string[];
	matched: string[];
	clauses: SaidPart[];
	items: NamedItem[];
	itemsNamed: string[];
	coverage: number;
	verdict: SaidVerdict;
	notes: string[];
}

/** An item that can be said back: it carries a kept lines mark with at least one line. */
export interface SayableItem {
	id: string;
	kind: ItemKind;
	name: string;
	section: string;
	lengths: SayLength[];
}

/** A scenario that can be played: it carries a kept answer. */
export interface RoleableScenario {
	id: string;
	title: string;
	guest: string;
}

/** The lengths as a trainer names their cap. */
export const CAP_NAMES: Readonly<Record<SayLength, string>> = {
	s10: 'ten second',
	s20: 'twenty second',
	s45: 'forty five second'
};

/**
 * The words that carry nothing a guest needs: the short stop list, the few
 * French, Italian and Spanish joining words a menu prints, and the filler a
 * line uses around its content. Folded and stripped like every other word.
 */
const GRADE_STOP = new Set(
	(
		'a an and or but nor the of in on at to for from by with without into onto over under than then so as is are was were be been being ' +
		'it its this that these those there here we our ours you your yours i me my he she they them their his her ' +
		'will would can could shall should may might must do does did have has had not no yes very just also too all any some ' +
		'one two more most less much many little lot bit up out off about which who whom what when where how why ' +
		'de la le les du des au aux et en di del della da y el los las ' +
		'served serve serving made make comes come course dish plate house thing things way like well each per ' +
		'main cook cooked cooking taste tastes tasting youd youll youre youve ive ill dont isnt wont cant'
	).split(/\s+/).filter(Boolean)
);

/** Folded: lower case, accents off, the curly apostrophe straight. */
function gradeFold(s: string): string {
	return plainText(s)
		.normalize('NFD')
		.replace(/[\u0300-\u036F]/g, '')
		.replace(/[\u2018\u2019\u02BC]/g, "'")
		.toLowerCase();
}

/** The light suffix strip: one ending off a word of five letters or more, then a final e, so both sides meet. */
function gradeStem(w: string): string {
	let t = w;
	if (t.length >= 5) {
		if (t.endsWith('ies')) t = t.slice(0, -3) + 'y';
		else if (t.endsWith('ing')) t = t.slice(0, -3);
		else if (t.endsWith('ed')) t = t.slice(0, -2);
		else if (t.endsWith('es')) t = t.slice(0, -2);
		else if (t.endsWith('ly')) t = t.slice(0, -2);
		else if (t.endsWith('s') && !t.endsWith('ss') && !t.endsWith('us')) t = t.slice(0, -1);
	}
	if (t.length >= 4 && t.endsWith('e')) t = t.slice(0, -1);
	return t;
}

/** Every word of a text, folded, a possessive dropped, a hyphenated run split. */
function gradeTokens(s: string): string[] {
	const found = gradeFold(s).match(/[a-z0-9']+/g) || [];
	const out: string[] = [];
	for (const raw of found) {
		const w = raw.replace(/'s$/, '').replace(/'/g, '');
		if (w) out.push(w);
	}
	return out;
}

/** The content words of a text as stems, each once, in order: stop words and words under three letters left out. */
function gradeTerms(s: string): string[] {
	const out: string[] = [];
	for (const w of gradeTokens(s)) {
		if (w.length < 3 && !/^[0-9]+$/.test(w)) continue;
		if (GRADE_STOP.has(w)) continue;
		const t = gradeStem(w);
		if (t && !GRADE_STOP.has(t) && out.indexOf(t) < 0) out.push(t);
	}
	return out;
}

/** Every word said, as a set of stems, stop words included (a name may carry one). */
function saidStems(said: string): Set<string> {
	const out = new Set<string>();
	for (const w of gradeTokens(said)) out.add(gradeStem(w));
	return out;
}

/** A share of the parts that carry terms, rounded to two places so a screen and a test read one number. */
function shareOf(hit: number, of: number): number {
	return of ? Math.round((hit / of) * 100) / 100 : 0;
}

/**
 * Whether a name was said: every content word of a name of one or two, and
 * at least two words and half of a longer one, so the roast chicken names
 * Lantern Roast Chicken and bananas foster names World Famous Bananas
 * Foster, while one shared word (shrimp, eggs) names nothing.
 */
function nameWasSaid(name: string, said: Set<string>): boolean {
	const terms = gradeTerms(name);
	if (!terms.length) return false;
	const hit = terms.filter((t) => said.has(t)).length;
	return hit >= (terms.length <= 2 ? terms.length : Math.max(2, Math.ceil(terms.length / 2)));
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** A whole number in words, the British way (one hundred and four), with no hyphen; digits beyond 9999. */
export function numberWords(n: number): string {
	const v = Math.floor(Math.abs(n));
	if (v < 20) return ONES[v];
	if (v < 100) return TENS[Math.floor(v / 10)] + (v % 10 ? ' ' + ONES[v % 10] : '');
	if (v < 1000) return ONES[Math.floor(v / 100)] + ' hundred' + (v % 100 ? ' and ' + numberWords(v % 100) : '');
	if (v < 10000) return numberWords(Math.floor(v / 1000)) + ' thousand' + (v % 1000 ? (v % 1000 < 100 ? ' and ' : ' ') + numberWords(v % 1000) : '');
	return String(v);
}

function capitalFirst(s: string): string {
	return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** A kept value as a trainer quotes it: its first clause, the closing stop off. */
function firstClause(s: string): string {
	const t = plainText(s).split(/[.;:!?](?:\s|$)/)[0];
	return plainText(t).replace(/[.,;:!?]+$/, '');
}

/** The note for a part that was missed, by its label: name the thing, or say how. */
function partNote(label: string, value: string): string {
	const l = label.replace(/^the /, '');
	const v = firstClause(value);
	return /^(how|what)\b/.test(l) ? capitalFirst('say ' + l) + ': ' + v : 'Name the ' + l + ': ' + v;
}

/**
 * A kept text as clauses: split at a stop, a semicolon, a colon or a comma,
 * each clause with content words a part of its own, graded hit when at
 * least a third of its words (and one at the least) were said.
 */
function clauseParts(text: string, said: Set<string>): SaidPart[] {
	const out: SaidPart[] = [];
	for (const raw of plainText(text).split(/[.;:!?,](?:\s|$)/)) {
		const clause = plainText(raw);
		const terms = gradeTerms(clause);
		if (!terms.length) continue;
		const matched = terms.filter((t) => said.has(t));
		const hit = matched.length >= Math.max(1, Math.ceil(terms.length / 3));
		out.push({ key: 'c' + (out.length + 1), label: clause, hit, terms, matched, inLine: true });
	}
	return out;
}

function verdictOf(coverage: number, over: number): SaidVerdict {
	if (coverage >= GRADE_MET && over <= 0) return 'met';
	if (coverage >= GRADE_CLOSE) return 'close';
	return 'missed';
}

function findItem(house: House, id: string): HouseItem | undefined {
	return itemsOf(house).find((i) => i.id === id);
}

/**
 * What a person said against an item's kept line of one length. The parts
 * are the item's KEPT five parts, each hit when any of its content words
 * was said, and a part counts toward the coverage only when the kept line
 * of this length carries it (a ten second line names three parts, not
 * five, and saying your own kept line back always meets); with no kept
 * parts, or none the line carries, the kept line's own clauses stand in. The
 * verdict is met at a coverage of 0.8 within the cap, close at 0.5 (or met
 * but over the cap), else missed. Null when the item is not on the house or
 * carries no kept line of that length: her unkept line never grades.
 */
export function gradeSaid(house: House, itemId: string, length: SayLength, said: string): SaidGrade | null {
	const item = findItem(house, plainText(itemId));
	if (!item || !(length in LINE_CAPS)) return null;
	const lines = keptValue<Lines>(item.lines);
	const keptLine = lines ? plainText(lines[length]) : '';
	if (!keptLine) return null;
	const text = plainText(said);
	const cap = LINE_CAPS[length];
	const words = wordCount(text);
	const over = Math.max(0, words - cap);
	const stems = saidStems(text);
	const name = nameOf(item);
	const labels = partLabels(item.kind);
	const keptParts = keptValue<FormulaParts>(item.parts);
	const lineStems = saidStems(keptLine);
	let parts: SaidPart[] = [];
	if (keptParts) {
		for (const key of KEYS.FormulaParts) {
			const value = plainText(keptParts[key]);
			const terms = gradeTerms(value);
			const matched = terms.filter((t) => stems.has(t));
			const inLine = terms.some((t) => lineStems.has(t));
			parts.push({ key, label: labels[key], hit: matched.length > 0, terms, matched, inLine });
		}
	}
	const fromParts = parts.some((p) => p.terms.length > 0 && p.inLine);
	if (!fromParts) parts = clauseParts(keptLine, stems);
	const graded = parts.filter((p) => p.terms.length > 0 && p.inLine);
	const coverage = shareOf(graded.filter((p) => p.hit).length, graded.length);
	const nameSaid = nameWasSaid(name, stems);
	const verdict = words ? verdictOf(coverage, over) : 'missed';
	const notes: string[] = [];
	if (!words) notes.push('Nothing was said yet. Say the line aloud, or type it, then grade it.');
	else {
		for (const p of graded) {
			if (p.hit) continue;
			if (fromParts && keptParts) notes.push(partNote(p.label, keptParts[p.key as keyof FormulaParts]));
			else notes.push('You left out: ' + firstClause(p.label));
		}
		if (over > 0) notes.push(capitalFirst(numberWords(over)) + (over === 1 ? ' word' : ' words') + ' over the ' + CAP_NAMES[length] + ' cap.');
		if (!nameSaid && name) notes.push('Say the name: ' + name + '.');
		if (verdict !== 'met' && over === 0 && words * 2 < cap) notes.push('There is room for more: the cap is ' + numberWords(cap) + ' words and you used ' + numberWords(words) + '.');
		if (verdict === 'met') notes.push(fromParts ? 'Every part is there, within the cap.' : 'Every clause is there, within the cap.');
	}
	return { itemId: item.id, kind: item.kind, name, length, cap, words, over, keptLine, parts, nameSaid, coverage, verdict, notes };
}

/**
 * What a person said to a scenario's guest against the KEPT answer, clause
 * by clause, with the house items the answer names and the ones said. The
 * same verdict rule with no cap. Null when the scenario is not on the house
 * or carries no kept answer.
 */
export function gradeScenario(house: House, scenarioId: string, said: string): ScenarioGrade | null {
	const sc: Scenario | undefined = house.scenarios.find((s) => s.id === plainText(scenarioId));
	if (!sc) return null;
	const keptYou = keptText(sc.you);
	if (!keptYou) return null;
	const text = plainText(said);
	const words = wordCount(text);
	const stems = saidStems(text);
	const terms = gradeTerms(keptYou);
	const matched = terms.filter((t) => stems.has(t));
	const clauses = clauseParts(keptYou, stems);
	const coverage = shareOf(clauses.filter((c) => c.hit).length, clauses.length);
	const youStems = saidStems(keptYou);
	const byId = itemById(house);
	const items: NamedItem[] = [];
	for (const id of Array.isArray(sc.itemIds) ? sc.itemIds : []) {
		const item = byId.get(plainText(id));
		const name = nameOf(item);
		if (item && name) items.push({ id: item.id, name, named: nameWasSaid(name, stems) });
	}
	const itemsNamed = distinctText(itemsOf(house).map(nameOf).filter((n) => n && nameWasSaid(n, stems)));
	const verdict = words ? verdictOf(coverage, 0) : 'missed';
	const principle = keptText(sc.principle);
	const notes: string[] = [];
	if (!words) notes.push('Nothing was said yet. Answer the guest aloud, or type it, then grade it.');
	else {
		for (const c of clauses) if (!c.hit) notes.push('You left out: ' + c.label);
		for (const it of items) if (!it.named && nameWasSaid(it.name, youStems)) notes.push('Name the ' + it.name + '.');
		if (verdict !== 'met' && principle) notes.push('The principle: ' + principle);
		if (verdict === 'met') notes.push('That answers the guest the way you kept it.');
	}
	return { scenarioId: sc.id, title: plainText(sc.title), guest: plainText(sc.guest), keptYou, principle, words, terms, matched, clauses, items, itemsNamed, coverage, verdict, notes };
}

/** The items that can be said back, of one kind or all, in the house's order: a kept lines mark with at least one line. */
export function sayable(house: House, kind?: ItemKind): SayableItem[] {
	const out: SayableItem[] = [];
	for (const item of itemsOf(house)) {
		if (kind && item.kind !== kind) continue;
		const name = nameOf(item);
		const lines = keptValue<Lines>(item.lines);
		if (!name || !lines) continue;
		const lengths = KEYS.Lines.filter((k) => plainText(lines[k])) as SayLength[];
		if (lengths.length) out.push({ id: item.id, kind: item.kind, name, section: plainText(item.section), lengths });
	}
	return out;
}

/** The scenarios that can be played: a kept answer to grade against. */
export function roleable(house: House): RoleableScenario[] {
	const out: RoleableScenario[] = [];
	for (const sc of house.scenarios) {
		if (keptText(sc.you)) out.push({ id: sc.id, title: plainText(sc.title), guest: plainText(sc.guest) });
	}
	return out;
}
