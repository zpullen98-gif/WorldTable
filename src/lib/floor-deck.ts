/**
 * The Floor Deck's study engine: which cards a session holds, what a written
 * test asks, what say-it-back asks. Pure, with injected time and randomness,
 * and built ON the scheduler the rest of the app uses (repertoire.ts, drill.ts)
 * rather than beside it: a deck card is a slug in the one shared drill log,
 * read through scopeToSlugs like every other surface's.
 *
 * ## What each mode is allowed to write
 *
 * The house doctrine is that only an objective question that cannot leak its
 * own answer may promote a term up the ladder.
 *
 *   FLIP CARDS are self-judged, so they never promote. "Had it" and "Shaky"
 *   both record `close`, which holds the rung and refreshes the clock; "Didn't
 *   have it" records `missed`. One recorded judgment per card per local day:
 *   the first stands, so re-flipping a card to feel better changes nothing.
 *
 *   THE WRITTEN TEST and SAY-IT-BACK are objective: the test's key is a gist
 *   the build holds term-free, and the say-it-back prompt is redacted at build.
 *   They record `met` or `missed`.
 *
 *   LINEUP writes nothing here at all. A room answering aloud on one tablet is
 *   not evidence about whoever is holding it; the venue keeps its own tally.
 *
 * And across all of them the scheduler holds a card to one climb per local
 * day (repertoire.ts RepertoireOptions), so one evening spent in three modes
 * is one evening.
 */

import type { DeckCard, DeckSection, DeckTrap, DeckTraps, FloorDeck } from './types';
import {
	DAY_MS,
	TERM_LADDER_DAYS,
	dayKey,
	repertoire,
	scopeToSlugs,
	type CookEntry,
	type Grade,
	type RepertoireEntry
} from './repertoire';
import { orderRound, shuffle, type Rand } from './drill';
import { foldText, promptOf, wrongAnswersFor } from './floor-deck-core.mjs';

/** A sitting. Long enough to cover ground, short enough to finish on a break. */
export const SESSION_LENGTH = 20;

/**
 * While any card in scope is unseen, this many slots in a session are kept for
 * NEW cards whatever is due.
 *
 * Without it a flip-only reader stalls. Flips record `close`, which holds a
 * card on the first rung (two days), so once about forty cards have been seen
 * the due queue fills every session on its own and the second section is never
 * reached. The quota is what makes "section by section until every card has
 * been seen once" actually finish.
 */
export const NEW_QUOTA = 12;

export const TEST_MC = 10;
export const MATCH_SIZE = 4;
export const SAY_LENGTH = 10;
/** Of a say-it-back round, at most this many ask about a word on a dish line. */
export const SAY_DISH_LINES_MAX = 3;
export const LINEUP_LENGTHS = [5, 8, 12] as const;

/** What the three flip buttons record. Never `met`: see the header. */
export const FLIP_GRADES = { had: 'close', shaky: 'close', missed: 'missed' } as const satisfies Record<string, Grade>;
export type FlipJudgment = keyof typeof FLIP_GRADES;

const DECK_LADDER = { oneClimbPerDay: true } as const;

/** The sections a reader can actually study: the ones with a written card. */
export function liveSections(deck: FloorDeck): DeckSection[] {
	return deck.sections.filter((s) => s.count > 0);
}

/**
 * `?section=cuts,fish`, validated. Unknown keys are dropped and an empty or
 * wholly unknown value means every section, the doctrine urlState.ts follows
 * for the recipe filters: a stale or mistyped link still opens the page.
 */
export function sectionsFromSearch(search: string, known: readonly string[]): Set<string> | null {
	const raw = new URLSearchParams(search).get('section');
	if (!raw) return null;
	const wanted = new Set(raw.toLowerCase().split(',').map((s) => s.trim()).filter((s) => known.includes(s)));
	return wanted.size ? wanted : null;
}

/** The cards in scope, in deck order: teaching order, then authored order. */
export function cardsInScope(deck: FloorDeck, scope: ReadonlySet<string> | null): DeckCard[] {
	return scope ? deck.cards.filter((c) => scope.has(c.section)) : deck.cards;
}

/** This surface's own entries out of the shared log. Never scope by prefix:
 *  a card later retired would make a tile promise a term nobody then asks. */
export function deckLog(log: readonly CookEntry[], cards: readonly DeckCard[]): CookEntry[] {
	return scopeToSlugs(log, new Set(cards.map((c) => c.id)));
}

export function deckRepertoire(ownLog: CookEntry[], now: number): RepertoireEntry[] {
	return repertoire(ownLog, now, TERM_LADDER_DAYS, DECK_LADDER);
}

/**
 * The misses still owed, most recent first.
 *
 * A miss is owed until the card is answered without missing on a LATER local
 * day. Same-day answers never clear it, and that is the whole meaning of "the
 * misses come back first next session": getting it right at the end of the
 * sitting you missed it in is reading the answer back. It also means the
 * result screen's "study these now" door cannot cancel tomorrow's review.
 */
export function outstandingMisses(ownLog: readonly CookEntry[]): string[] {
	const lastMiss = new Map<string, number>();
	for (const e of ownLog) {
		if (e.grade === 'missed' && e.at > (lastMiss.get(e.slug) ?? -Infinity)) lastMiss.set(e.slug, e.at);
	}
	const cleared = new Set<string>();
	for (const e of ownLog) {
		const missedAt = lastMiss.get(e.slug);
		if (missedAt === undefined || e.grade === 'missed') continue;
		if (e.at > missedAt && dayKey(e.at) > dayKey(missedAt)) cleared.add(e.slug);
	}
	return [...lastMiss.entries()]
		.filter(([slug]) => !cleared.has(slug))
		.sort((a, b) => b[1] - a[1])
		.map(([slug]) => slug);
}

/** Due and cold cards, most overdue first as a share of their own interval,
 *  the card that keeps slipping ahead of the one that has not. */
function dueIds(rep: readonly RepertoireEntry[], now: number): string[] {
	const overdue = (e: RepertoireEntry) => (now - e.last) / (e.intervalDays * DAY_MS);
	return rep
		.filter((e) => e.state === 'due' || e.state === 'cold')
		.sort((a, b) => overdue(b) - overdue(a) || b.lapses - a.lapses || a.slug.localeCompare(b.slug))
		.map((e) => e.slug);
}

export interface SessionOptions {
	length?: number;
	scope?: ReadonlySet<string> | null;
	/** `misses`: only what is owed from an earlier miss. */
	focus?: 'misses' | null;
	newQuota?: number;
}

/**
 * One sitting's cards, in the order they are shown.
 *
 * What is OWED leads: outstanding misses, then what the ladder says is due.
 * While unseen cards remain in scope the session also walks the deck forward,
 * section by section in teaching order and in authored order within a section,
 * spilling into the next section when one runs out. Once every card has been
 * seen it is spaced repetition alone, topped up with whatever comes due soonest.
 * A session is never padded with repeats: a small scope gives a short sitting.
 *
 * The same function picks a Lineup, handed the VENUE's log instead of a
 * person's: the room's misses first, then what the room is due, then what it
 * has never been asked.
 */
export function pickSession(
	deck: FloorDeck,
	log: readonly CookEntry[],
	now: number,
	opts: SessionOptions = {}
): DeckCard[] {
	const length = opts.length ?? SESSION_LENGTH;
	const cards = cardsInScope(deck, opts.scope ?? null);
	const byId = new Map(cards.map((c) => [c.id, c]));
	const own = deckLog(log, cards);

	const misses = outstandingMisses(own).filter((id) => byId.has(id));
	if (opts.focus === 'misses') return misses.slice(0, length).map((id) => byId.get(id)!);

	const rep = deckRepertoire(own, now);
	const owed = new Set(misses);
	const lead = [...misses, ...dueIds(rep, now).filter((id) => !owed.has(id))];

	const seen = new Set(own.map((e) => e.slug));
	const unseen = cards.filter((c) => !seen.has(c.id));

	let ids: string[];
	if (unseen.length) {
		const quota = opts.newQuota ?? NEW_QUOTA;
		let fresh = Math.min(unseen.length, length, Math.max(quota, length - lead.length));
		const owedSlots = Math.min(lead.length, length - fresh);
		fresh = Math.min(unseen.length, length - owedSlots);
		ids = [...lead.slice(0, owedSlots), ...unseen.slice(0, fresh).map((c) => c.id)];
	} else {
		const taken = new Set(lead);
		const soonest = [...rep]
			.filter((e) => !taken.has(e.slug))
			.sort((a, b) => a.dueAt - b.dueAt || a.slug.localeCompare(b.slug))
			.map((e) => e.slug);
		ids = [...lead, ...soonest].slice(0, length);
	}
	return ids.map((id) => byId.get(id)!).filter(Boolean);
}

/**
 * May a flip be written for this card now? One recorded judgment per card per
 * local day, from ANY mode: the log is rewritten whole on every write, so flip
 * volume is the one place it could grow without anything having been learned.
 */
export function flipRecordable(ownLog: readonly CookEntry[], id: string, now: number): boolean {
	const today = dayKey(now);
	return !ownLog.some((e) => e.slug === id && dayKey(e.at) === today);
}

// ── progress, as facts and never as a score ─────────────────────────────────

export interface SectionProgress {
	key: string;
	title: string;
	seen: number;
	total: number;
}

export function sectionProgress(deck: FloorDeck, log: readonly CookEntry[]): SectionProgress[] {
	const seen = new Set(deckLog(log, deck.cards).map((e) => e.slug));
	return liveSections(deck).map((s) => {
		const mine = deck.cards.filter((c) => c.section === s.key);
		return { key: s.key, title: s.title, seen: mine.filter((c) => seen.has(c.id)).length, total: mine.length };
	});
}

/** The terms that keep slipping: missed three times or more, ever. */
export function slipping(deck: FloorDeck, log: readonly CookEntry[], now: number): DeckCard[] {
	const byId = new Map(deck.cards.map((c) => [c.id, c]));
	return deckRepertoire(deckLog(log, deck.cards), now)
		.filter((e) => e.lapses >= 3)
		.sort((a, b) => b.lapses - a.lapses || a.slug.localeCompare(b.slug))
		.map((e) => byId.get(e.slug)!)
		.filter(Boolean);
}

export function dueCount(deck: FloorDeck, log: readonly CookEntry[], now: number): number {
	const own = deckLog(log, deck.cards);
	const owed = new Set(outstandingMisses(own));
	for (const id of dueIds(deckRepertoire(own, now), now)) owed.add(id);
	return owed.size;
}

// ── the written test ────────────────────────────────────────────────────────

export interface TestOption {
	text: string;
	correct: boolean;
	/** Where a wrong answer came from, for the result screen's one line of why. */
	from: 'key' | 'trap' | 'kin';
	/** The donor card, when `from` is `kin`. */
	id?: string;
	/** The trap's own reason, when `from` is `trap`. */
	why?: string;
}

export interface McQuestion {
	kind: 'mc';
	card: DeckCard;
	options: TestOption[];
}

export interface MatchQuestion {
	kind: 'match';
	cards: DeckCard[];
	/** The same cards' gists, shuffled. `id` is the card each belongs to. */
	gists: Array<{ id: string; text: string }>;
}

export type TestQuestion = McQuestion | MatchQuestion;

/**
 * "Which of these is {term}?" with the card's gist as the key.
 *
 * The wrong answers come from the shared wrongAnswersFor, the function the
 * build simulates to measure the option-length tell, so what was measured is
 * what is asked. `null` when three cannot be fielded; the caller skips it.
 */
export function mcFor(card: DeckCard, cards: readonly DeckCard[], traps: readonly DeckTrap[] | undefined, rand: Rand): McQuestion | null {
	const wrong = wrongAnswersFor(card, cards, traps, rand);
	if (!wrong) return null;
	const options: TestOption[] = [
		{ text: card.gist, correct: true, from: 'key' },
		...wrong.map((w) => ({ text: w.text, correct: false, from: w.from, id: w.id, why: w.why }))
	];
	return { kind: 'mc', card, options: shuffle(options, rand) };
}

export function matchSetFor(cards: readonly DeckCard[], rand: Rand): MatchQuestion | null {
	if (cards.length !== MATCH_SIZE) return null;
	if (new Set(cards.map((c) => foldText(c.gist))).size !== MATCH_SIZE) return null;
	return {
		kind: 'match',
		cards: [...cards],
		gists: shuffle(cards.map((c) => ({ id: c.id, text: c.gist })), rand)
	};
}

/**
 * One section's test: what is owed first, then what has never been asked, then
 * the rest, the order every round in this app takes (drill.ts orderRound).
 *
 * Ten multiple choice and one set of four to match, when the section is big
 * enough. A section of 8 to 13 gives up multiple-choice questions to keep the
 * match set; under 8 it is all multiple choice. Accepted and stated: the last
 * pair of a match set falls out by elimination.
 */
export function buildTest(
	deck: FloorDeck,
	traps: DeckTraps,
	log: readonly CookEntry[],
	now: number,
	rand: Rand,
	sectionKey: string
): TestQuestion[] {
	const mine = deck.cards.filter((c) => c.section === sectionKey);
	if (!mine.length) return [];
	const own = deckLog(log, mine);
	const misses = outstandingMisses(own);
	const owed = new Set(misses);
	const lead = [...misses, ...dueIds(deckRepertoire(own, now), now).filter((id) => !owed.has(id))];
	const seen = new Set(own.map((e) => e.slug));

	const n = mine.length;
	const withMatch = n >= MATCH_SIZE * 2;
	const mcCount = withMatch ? Math.min(TEST_MC, n - MATCH_SIZE) : Math.min(TEST_MC + MATCH_SIZE, n);
	const ordered = orderRound(
		mine.map((card) => ({ slug: card.id, card })),
		lead,
		seen,
		rand,
		mcCount + (withMatch ? MATCH_SIZE : 0)
	).map((x) => x.card);

	const questions: TestQuestion[] = [];
	for (const card of ordered.slice(0, mcCount)) {
		// kin are drawn from the WHOLE deck, not the section: pool is not field
		const q = mcFor(card, deck.cards, traps[card.id], rand);
		if (q) questions.push(q);
	}
	if (withMatch) {
		const set = matchSetFor(ordered.slice(mcCount, mcCount + MATCH_SIZE), rand);
		if (set) questions.push(set);
	}
	return questions;
}

/** One answered card out of a test, as the result screen needs it. */
export interface TestMiss {
	card: DeckCard;
	/** What was chosen: an option's text, or the gist it was matched to. */
	chose: string;
	/** Why that is wrong, in one line. */
	because: string;
}

/**
 * The one line under a miss. A trap carries its own reason. A kin answer is a
 * true statement about something else, so the honest line names what it is.
 */
export function whyWrong(option: { from: 'trap' | 'kin' | 'key'; id?: string; why?: string }, cards: readonly DeckCard[]): string {
	if (option.from === 'trap' && option.why) return option.why;
	const donor = option.id ? cards.find((c) => c.id === option.id) : undefined;
	return donor ? `That is ${donor.term}.` : 'That describes something else.';
}

// ── say-it-back ─────────────────────────────────────────────────────────────

/**
 * Deck terms that appear, as words, in a piece of menu text. Accent-folded and
 * word-bounded, against the term and its aliases; longest names first, so
 * "Short Rib" claims its words before "Rib" could.
 */
export function termsInText(text: string, cards: readonly DeckCard[]): DeckCard[] {
	const hay = ` ${foldText(text)} `;
	const named = cards
		.flatMap((card) => [card.term, ...(card.aliases ?? [])].map((name) => ({ card, name: foldText(name) })))
		.filter((x) => x.name.length >= 3)
		.sort((a, b) => b.name.length - a.name.length);
	const out: DeckCard[] = [];
	let rest = hay;
	for (const { card, name } of named) {
		if (!rest.includes(` ${name} `)) continue;
		rest = rest.split(` ${name} `).join('  ');
		if (!out.includes(card)) out.push(card);
	}
	return out;
}

export interface SayQuestion {
	/** `prompt`: a redacted definition asks for the term. `line`: a dish line asks what a word in it means. */
	kind: 'prompt' | 'line';
	card: DeckCard;
	/** The redacted why, or the dish line. */
	stem: string;
	/** `prompt`: four terms. `line`: four gists. Exactly one is correct. */
	options: Array<{ text: string; correct: boolean; id?: string }>;
}

/** Four terms: what it is confused with first, then its section, then the deck. */
function termOptionsFor(card: DeckCard, cards: readonly DeckCard[], rand: Rand) {
	const byId = new Map(cards.map((c) => [c.id, c]));
	const others = cards.filter((c) => c.id !== card.id);
	const sources = [
		(card.confusedWith ?? []).map((id) => byId.get(id)).filter((c): c is DeckCard => Boolean(c)),
		others.filter((c) => c.section === card.section),
		others
	];
	const picked: DeckCard[] = [];
	const taken = new Set([foldText(card.term)]);
	for (const source of sources) {
		for (const c of shuffle(source, rand)) {
			if (picked.length >= 3) break;
			const key = foldText(c.term);
			if (taken.has(key)) continue;
			taken.add(key);
			picked.push(c);
		}
	}
	if (picked.length < 3) return null;
	return shuffle(
		[{ text: card.term, correct: true, id: card.id }, ...picked.map((c) => ({ text: c.term, correct: false, id: c.id }))],
		rand
	);
}

/**
 * A say-it-back round: owed first, then never asked, then the rest.
 *
 * Up to three of the ten ask about a word on a dish line. The house's own menu
 * is used where it names a deck term (`houseLines`: dish names, descriptions
 * and ingredient lines from My Menu), and the card's authored `line` where it
 * does not, so the mode works on the day a venue has entered nothing.
 */
export function sayRound(
	deck: FloorDeck,
	log: readonly CookEntry[],
	now: number,
	rand: Rand,
	opts: { scope?: ReadonlySet<string> | null; houseLines?: readonly string[]; length?: number } = {}
): SayQuestion[] {
	const cards = cardsInScope(deck, opts.scope ?? null);
	if (!cards.length) return [];
	const own = deckLog(log, cards);
	const misses = outstandingMisses(own);
	const owed = new Set(misses);
	const lead = [...misses, ...dueIds(deckRepertoire(own, now), now).filter((id) => !owed.has(id))];
	const seen = new Set(own.map((e) => e.slug));
	const ordered = orderRound(
		cards.map((card) => ({ slug: card.id, card })),
		lead,
		seen,
		rand,
		opts.length ?? SAY_LENGTH
	).map((x) => x.card);

	const onTheMenu = new Map<string, string>();
	for (const line of opts.houseLines ?? []) {
		for (const c of termsInText(line, ordered)) if (!onTheMenu.has(c.id)) onTheMenu.set(c.id, line);
	}

	const questions: SayQuestion[] = [];
	let lines = 0;
	for (const card of ordered) {
		const dish = onTheMenu.get(card.id) ?? card.line;
		if (dish && lines < SAY_DISH_LINES_MAX) {
			const mc = mcFor(card, deck.cards, undefined, rand);
			if (mc) {
				lines++;
				questions.push({ kind: 'line', card, stem: dish, options: mc.options.map((o) => ({ text: o.text, correct: o.correct, id: o.id })) });
				continue;
			}
		}
		const options = termOptionsFor(card, deck.cards, rand);
		if (options) questions.push({ kind: 'prompt', card, stem: promptOf(card), options });
	}
	return questions;
}
