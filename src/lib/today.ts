/**
 * Due today: one function, one count (docs/consolidation-design.md, 2.6, 3.6
 * and 6.2).
 *
 * The level page's `Due today` row, the Flashcards root's Due today block and
 * the Flashcards tab's pill all read `dueToday`, so the three can never
 * disagree. It is PURE, like repertoire.ts and for the same reason: a runes
 * module cannot be reached from a unit test, and a schedule must be tested
 * rather than eyeballed.
 *
 * The run is the cards due, then NEW cards to make it up: on a fresh device
 * nothing has been graded, so nothing is "due", and a strict due-only deck
 * would greet the first morning with an empty screen. Up to RUN_CAP cards a
 * run, at most NEW_CAP of them new; new cards come from the house first, in
 * menu order, then from the level's Floor Deck cards in teaching order (the
 * order pickSession's new quota walks).
 *
 *   due    the house's Again cards (in menu order), the Floor Deck's owed
 *          cards at the level (owed reaches down, the deck's rule), then the
 *          level's Lexicon terms the ladder says are due
 *   new    the house's dishes never graded, then the level's unseen cards
 *
 * Each card is a reference string the card screen can draw: `h:{itemId}` a
 * house dish card, `c:{cardId}` a Floor Deck card, `t:{slug}` a Lexicon term.
 */
import { deckLog, owedIds } from './floor-deck';
import { dueList, repertoire, scopeToSlugs, TERM_LADDER_DAYS, type CookEntry } from './repertoire';
import type { Verdict } from './study';
import type { DeckLevel } from './types';

export const RUN_CAP = 20;
export const NEW_CAP = 10;

export interface TodayInput {
	now: number;
	level: DeckLevel;
	/** The level's name, for the line: named, never numbered. */
	levelName: string;
	/** The house's dish cards in menu order (ids), or empty with no house. */
	houseIds: readonly string[];
	/** The house's latest verdict per dish (study.ts latestVerdicts). */
	latest: ReadonlyMap<string, Verdict>;
	/** The Floor Deck, or its index: ids and levels in teaching order. */
	deck: { cards: ReadonlyArray<{ id: string; level: DeckLevel }> } | null;
	/** The person's drill log (the deck and the Lexicon both write it). */
	drillLog: readonly CookEntry[];
	/** The Lexicon slugs placed at the level. */
	lexiconAt: readonly string[];
}

export interface Today {
	/** The run, in the order it is dealt. */
	refs: string[];
	/** How many are due and how many new. */
	due: number;
	fresh: number;
	/** How many come from the menu and how many from the level. */
	fromMenu: number;
	fromLevel: number;
	/** refs.length: the one number the pill, the row and the root show. */
	total: number;
	/** The sentence the row and the root show. */
	line: string;
}

/** In menu order, the deck's teaching order, or the Lexicon's. */
function teaching(cards: ReadonlyArray<{ id: string; level: DeckLevel }>, level: DeckLevel): string[] {
	return cards.filter((c) => c.level === level).map((c) => c.id);
}

export function dueToday(input: TodayInput): Today {
	const { now, level, houseIds, latest, deck, drillLog, lexiconAt } = input;

	/* ---- due ---- */
	const houseDue = houseIds.filter((id) => latest.get(id) === 'again').map((id) => `h:${id}`);
	const deckDue = deck ? owedIds(deck, drillLog, now, new Set([level])).map((id) => `c:${id}`) : [];
	const lexDue = lexiconAt.length
		? dueList(repertoire(scopeToSlugs(drillLog as CookEntry[], new Set(lexiconAt)), now, TERM_LADDER_DAYS), now).map((e) => `t:${e.slug}`)
		: [];
	const due = [...houseDue, ...deckDue, ...lexDue].slice(0, RUN_CAP);

	/* ---- new ---- */
	const room = Math.min(NEW_CAP, RUN_CAP - due.length);
	const houseNew = houseIds.filter((id) => !latest.has(id)).map((id) => `h:${id}`);
	let deckNew: string[] = [];
	if (deck && room > houseNew.length) {
		const seen = new Set(deckLog(drillLog, deck.cards).map((e) => e.slug));
		deckNew = teaching(deck.cards, level)
			.filter((id) => !seen.has(id))
			.map((id) => `c:${id}`);
	}
	const fresh = [...houseNew, ...deckNew].slice(0, Math.max(0, room));

	const refs = [...due, ...fresh];
	const fromMenu = refs.filter((r) => r.startsWith('h:')).length;
	const fromLevel = refs.length - fromMenu;
	return {
		refs,
		due: due.length,
		fresh: fresh.length,
		fromMenu,
		fromLevel,
		total: refs.length,
		line: todayLine(due.length, fresh.length, fromMenu, fromLevel, input.levelName)
	};
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** The sentence, by design 6.2: both numbers, and where the cards come from. */
export function todayLine(d: number, k: number, a: number, b: number, levelName: string): string {
	if (!d && !k) return `Nothing due today and nothing new at ${levelName}. Try the quick quiz.`;
	const both = a > 0 && b > 0;
	const from = both ? `: ${a} from the menu, ${b} at ${levelName}.` : a > 0 ? ' from the menu.' : ` at ${levelName}.`;
	if (d && k) return `${d} due and ${k} new` + (both ? from : a > 0 ? ', all from the menu.' : `, all at ${levelName}.`);
	if (d) return `${d} ${plural(d, 'card', 'cards')} due` + from;
	return `${k} new ${plural(k, 'card', 'cards')} to start` + from;
}
