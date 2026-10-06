/**
 * The house drill round, as /menu/quiz runs it: pure helpers over the
 * generators in $lib/house/house-drills, so the page holds state and the
 * rules sit here under test. Nothing here deals a question of its own: the
 * one dealer is dealQuestion, and this file calls it, picks which kind to
 * call it for, keeps a round from repeating itself, and says in words what
 * a kind still needs before it can deal.
 *
 * KEPT MARKS ONLY, again. The explanation under an answer reads a mark
 * only when by === 'person' (keptText below), the same gate the generators
 * keep; the plain fields it reads (a description, a wine's region, a
 * cocktail's method) are the menu's own words.
 *
 * NOTHING HERE RECORDS. The page records through house-drilled.ts and marks
 * the day studied through oot-studied.ts; this module returns strings and
 * lists and touches no storage, no level and no session.
 */
import {
	DRILL_FLOORS,
	DRILL_KINDS,
	OPTION_COUNT,
	dealQuestion,
	drillableCounts,
	readyKinds,
	type DrillKind,
	type DrillQuestion,
	type Flashcard,
	type Rand
} from './house/house-drills';
import { isMark } from './house/house-schema';
import { inMeal } from './study';
import type { FormulaParts, House, HouseItem, Mark, Pairing, ProducerProfile } from './house/house-schema';

/** The modes of /menu/quiz, as ?mode= names them; 'dish' is the menu quiz the page always had and the default. */
export const QUIZ_MODES = ['dish', 'drill', 'cards', 'pair', 'say', 'guest'] as const;
export type QuizMode = (typeof QUIZ_MODES)[number];

export const MODE_LABELS: Readonly<Record<QuizMode, string>> = {
	dish: 'The dishes',
	drill: 'Drill the house',
	cards: 'Flip cards',
	pair: 'Pairings',
	say: 'Say it back',
	guest: 'Guest at the table'
};

/** The mode a query names, or the default when it names none or one the page does not have. */
export function modeFromSearch(search: string): QuizMode {
	const m = new URLSearchParams(search).get('mode');
	return (QUIZ_MODES as readonly string[]).includes(m ?? '') ? (m as QuizMode) : 'dish';
}

/** A round is ten, or the whole pool when the person asks for it. */
export const ROUND_LENGTH = 10;

/** The producer subject: the three kinds that ask about the producers, dealt alone when ?subject=producer asks for them. */
export { PRODUCER_KINDS } from './house/house-drills';

/** The pairing drill's two kinds: a dish to its first pick among the house wines, and a dish to its drink without alcohol. */
export const PAIR_KINDS: readonly DrillKind[] = ['firstPickFor', 'zeroProofFor'];

/** What a question of the kind is about, in a few words, for the kinds row. */
export const KIND_CHIPS: Readonly<Record<DrillKind, string>> = {
	lineToDish: 'Line to dish',
	sauceOf: 'Sauce',
	sidesOf: 'Sides',
	firstPickFor: 'First pick',
	zeroProofFor: 'Without alcohol',
	termToGuest: 'Term to guest',
	sayIt: 'How to say it',
	mixUp: 'Mix-ups',
	wineGrapes: 'Grapes',
	wineGoesWith: 'Wine goes with',
	cocktailGlass: 'Glass',
	cocktailSpec: 'Spec',
	producerOf: 'Producer',
	producerWhere: 'Where from',
	producerDish: 'Which dish uses it'
};

/** What each kind counts and what it offers, for the still-needed line. */
const KIND_NEEDS: Readonly<Record<DrillKind, { unit: string; field: string }>> = {
	lineToDish: { unit: 'dishes with a kept ten or twenty second line', field: 'four dish names' },
	sauceOf: { unit: 'dishes with their sauce kept in the five parts', field: 'four dish names' },
	sidesOf: { unit: 'dishes with their sides kept in the five parts', field: 'four dish names' },
	firstPickFor: { unit: 'dishes with a kept pairing naming a house wine', field: 'four wines on the list' },
	zeroProofFor: { unit: 'dishes with a kept pairing naming a house drink without alcohol', field: 'four drinks on the bar' },
	termToGuest: { unit: 'terms with a kept line for a guest', field: 'four terms in the lexicon' },
	sayIt: { unit: 'terms or items with a kept way to say them', field: 'four names on the house' },
	mixUp: { unit: 'mix-ups with a kept difference', field: 'four mix-ups' },
	wineGrapes: { unit: 'wines with their grapes named', field: 'four different grape lists' },
	wineGoesWith: { unit: 'wines with a kept goes-with', field: 'four wines on the list' },
	cocktailGlass: { unit: 'drinks with a glass named', field: 'four different glasses' },
	cocktailSpec: { unit: 'drinks with a spec', field: 'four drinks on the bar' },
	producerOf: { unit: 'items with a kept producer', field: 'four producers' },
	producerWhere: { unit: 'producers with a kept where', field: 'four different places' },
	producerDish: { unit: 'producers on a dish or a drink', field: 'four names on the house' }
};

/**
 * Why a kind cannot deal, in words, from drillableCounts: how many carry the
 * kept mark it reads against its floor, and the four distinct options it
 * must be able to offer. Empty for a kind that deals.
 */
export function stillNeeded(house: House, kind: DrillKind, counts: Record<DrillKind, number> = drillableCounts(house)): string {
	if (readyKinds(house).includes(kind)) return '';
	const need = KIND_NEEDS[kind];
	const have = counts[kind];
	const floor = DRILL_FLOORS[kind];
	if (have < floor) return `${KIND_CHIPS[kind]} needs ${floor} ${need.unit}; ${have} so far.`;
	return `${KIND_CHIPS[kind]} needs ${need.field} to choose from; the house has fewer than ${OPTION_COUNT}.`;
}

/** Fisher and Yates on a copy, every swap from the caller's source. */
export function shuffleWith<T>(list: readonly T[], rand: Rand): T[] {
	const out = list.slice();
	for (let i = out.length - 1; i > 0; i--) {
		const r = rand();
		const j = Math.floor((r >= 0 && r < 1 ? r : 0) * (i + 1));
		const t = out[i];
		out[i] = out[j];
		out[j] = t;
	}
	return out;
}

/** How many questions the whole pool holds over the chosen kinds: the drillable count of each. */
export function poolSize(house: House, kinds: readonly DrillKind[]): number {
	const counts = drillableCounts(house);
	let n = 0;
	for (const k of kinds) n += counts[k];
	return n;
}

/**
 * A source that makes dealQuestion's first draw land on record `index` of a
 * pool of `size`, then hands every later draw (the stem, the distractors,
 * the order of the four) to the caller's source. dealQuestion draws the
 * record first, by floor(draw times pool length), and the middle of the
 * index's slot is the draw that picks it; so the one dealer still deals
 * every question, and the round only says which record it wants.
 */
function pickRecord(index: number, size: number, rand: Rand): Rand {
	let first = true;
	return () => {
		if (!first) return rand();
		first = false;
		return (index + 0.5) / size;
	};
}

/**
 * A round over the chosen kinds: `length` questions, or the whole pool when
 * length is null. Each ready kind's records are shuffled once by the
 * caller's source and dealt in that order, so no record comes twice for its
 * kind and the whole pool deals every record exactly once; the kinds take
 * turns (their order shuffled once), and a kind leaves the turns as soon as
 * its records are all dealt or it refuses to deal. Every question is dealt
 * by dealQuestion; a round over kinds that all refuse is empty.
 */
export function dealRound(house: House, kinds: readonly DrillKind[], length: number | null, rand: Rand): DrillQuestion[] {
	const ready = readyKinds(house);
	const counts = drillableCounts(house);
	const order = shuffleWith(
		kinds.filter((k, i) => ready.includes(k) && kinds.indexOf(k) === i),
		rand
	);
	const queues = new Map<DrillKind, number[]>();
	for (const k of order) {
		const idx: number[] = [];
		for (let i = 0; i < counts[k]; i++) idx.push(i);
		queues.set(k, shuffleWith(idx, rand));
	}
	const cycle = order.slice();
	const target = length === null ? poolSize(house, cycle) : Math.max(0, length);
	const out: DrillQuestion[] = [];
	const seen = new Set<string>();
	let turn = 0;
	while (out.length < target && cycle.length) {
		const kind = cycle[turn];
		const queue = queues.get(kind)!;
		const index = queue.shift();
		const q = index === undefined ? null : dealQuestion(house, kind, pickRecord(index, counts[kind], rand));
		// A spent kind leaves the turns and the next one slides into its place; otherwise the turn moves on.
		if (!q || !queue.length) cycle.splice(turn, 1);
		else turn++;
		if (turn >= cycle.length) turn = 0;
		if (!q) continue;
		const key = q.kind + '|' + q.itemId;
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(q);
	}
	return out;
}

/* -------------------------------------------------------------------------
 * The explanation under an answer
 * ---------------------------------------------------------------------- */

function plain(v: unknown): string {
	return typeof v === 'string' ? v.trim() : '';
}

function keptValue<T>(m: Mark<T> | undefined): T | undefined {
	if (!isMark(m) || m.by !== 'person') return undefined;
	return m.value as T;
}

function keptText(m: Mark | undefined): string {
	return plain(keptValue<string>(m));
}

function joined(parts: readonly string[]): string {
	return parts.map(plain).filter(Boolean).join(' ');
}

/** The kept profile of the producer named `who` on the item, for the line under a Producer answer. */
function producerNamed(house: House, who: string, itemId: string): ProducerProfile | undefined {
	for (const c of house.components || []) {
		if (c.itemIds.indexOf(itemId) < 0) continue;
		const p = keptValue<ProducerProfile>(c.producer);
		if (p && plain(p.who) === who) return p;
	}
	return undefined;
}

function findItem(house: House, id: string): HouseItem | undefined {
	return ([] as HouseItem[]).concat(house.dishes, house.wines, house.cocktails).find((it) => it.id === id);
}

/**
 * A sentence or two beside the right answer, from the record the question
 * is about: a kept mark where the kind has one (never hers unkept), else the
 * menu's own plain field. Empty when the record says nothing more, and the
 * page prints the answer alone.
 */
export function explainAnswer(house: House, q: DrillQuestion): string {
	const item = findItem(house, q.itemId);
	switch (q.kind) {
		case 'lineToDish':
		case 'sauceOf':
		case 'sidesOf': {
			if (!item) return '';
			const parts = keptValue<FormulaParts>(item.parts);
			if (parts) return joined([parts.main ? parts.main + '.' : '', parts.technique ? parts.technique + '.' : '', parts.taste ? parts.taste + '.' : '']);
			return item.kind === 'dish' ? plain(item.description) : '';
		}
		case 'firstPickFor': {
			const p = item && item.kind === 'dish' ? keptValue<Pairing>(item.pairing) : undefined;
			return p ? joined([plain(p.sayIt), plain(p.why)]) : '';
		}
		case 'zeroProofFor': {
			const p = item && item.kind === 'dish' ? keptValue<Pairing>(item.pairing) : undefined;
			return p ? plain(p.zeroProofWhy) : '';
		}
		case 'termToGuest': {
			const t = house.lexicon.find((x) => x.id === q.itemId);
			const say = t ? keptText(t.say) : '';
			return say ? 'Said: ' + say : '';
		}
		case 'sayIt': {
			const t = house.lexicon.find((x) => x.id === q.itemId);
			if (t) return keptText(t.toGuest);
			if (!item) return '';
			return keptText(item.guest) || (item.kind === 'dish' ? plain(item.description) : '');
		}
		case 'mixUp': {
			const m = house.mixUps.find((x) => x.id === q.itemId);
			const ask = m ? keptText(m.ask) : '';
			return ask ? 'Ask: ' + ask : '';
		}
		case 'wineGrapes':
		case 'wineGoesWith': {
			if (!item || item.kind !== 'wine') return '';
			const profile = keptText(item.profile);
			return joined([profile, plain(item.region) ? plain(item.region) + '.' : '', plain(item.style) ? plain(item.style) + '.' : '']);
		}
		case 'producerOf': {
			const p = producerNamed(house, q.answer, q.itemId);
			return p ? joined([plain(p.sayIt), plain(p.where) ? 'From ' + plain(p.where) + '.' : '']) : '';
		}
		case 'producerWhere':
		case 'producerDish': {
			const c = (house.components || []).find((x) => x.id === q.itemId);
			const p = c ? keptValue<ProducerProfile>(c.producer) : undefined;
			return p ? joined([plain(p.sayIt), plain(p.founded) ? 'Founded ' + plain(p.founded) + '.' : '']) : '';
		}
		case 'cocktailGlass':
		case 'cocktailSpec': {
			if (!item || item.kind !== 'cocktail') return '';
			return joined([plain(item.method) ? plain(item.method) + '.' : '', plain(item.garnish) ? 'Garnish: ' + plain(item.garnish) + '.' : '']);
		}
	}
	return '';
}

/** The flashcard deck shuffled by the caller's source; the engine hands it in record order. */
export function shuffleCards(cards: readonly Flashcard[], rand: Rand): Flashcard[] {
	return shuffleWith(cards, rand);
}

/** Every kind, for a page that lists the row before the house is in. */
export const ALL_KINDS: readonly DrillKind[] = DRILL_KINDS;

/* -------------------------------------------------------------------------
 * The study view's doors into this page
 * ---------------------------------------------------------------------- */

/**
 * What the study view asked /menu/quiz for, read from the query: one item,
 * one section, a named deck (`weak`, or `parts` for the part by part cards),
 * a scenario for Guest at the table and the meal the study view's shift
 * filter had chosen ('' is all day), which narrows every deck it deals.
 * Anything else in the query is ignored. Seeded in afterNavigate like the
 * mode, never in load.
 */
export interface StudyAsk {
	item: string;
	section: string;
	deck: '' | 'weak' | 'parts';
	scenario: string;
	meal: string;
}

export function studyScopeFromSearch(search: string): StudyAsk {
	const q = new URLSearchParams(search);
	const clean = (v: string | null) => (v ?? '').trim().slice(0, 200);
	const deck = clean(q.get('deck'));
	return {
		item: clean(q.get('item')),
		section: clean(q.get('section')),
		deck: deck === 'weak' || deck === 'parts' ? deck : '',
		scenario: clean(q.get('scenario')),
		meal: clean(q.get('meal'))
	};
}

function sectionOf(house: House, id: string): string {
	return (findItem(house, id)?.section ?? '').trim();
}

/**
 * A round over one section, one meal or both: the whole house's pool dealt,
 * then only the questions about an item in the section ('' is every
 * section) and served at the meal ('' is all day; an item nobody tagged is
 * kept, as the study view keeps it) kept, cut to the length. The
 * distractors still come from the whole house, so a small section never
 * deals four options that are all its own dishes.
 */
export function dealSection(
	house: House,
	kinds: readonly DrillKind[],
	section: string,
	length: number | null,
	rand: Rand,
	meal = ''
): DrillQuestion[] {
	const all = dealRound(house, kinds, null, rand).filter((q) => {
		if (section && sectionOf(house, q.itemId) !== section) return false;
		const item = findItem(house, q.itemId);
		return !item || inMeal(item, meal);
	});
	return length === null ? all : all.slice(0, Math.max(0, length));
}
