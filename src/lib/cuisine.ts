/**
 * Cuisine, the World Table's sixth tab: the engines.
 *
 * PURE, like repertoire.ts and today.ts and for the same reason: a runes
 * module cannot be reached from a unit test, and a schedule or a grade must be
 * tested rather than eyeballed. The data is built by tools/derive/cuisine.mjs
 * (src/lib/data/cuisine/index.json and ch-<key>.json); the store that loads it
 * is stores/cuisine.svelte.ts; the page is routes/cuisine.
 *
 * ## The record
 *
 * Every grade goes to the session's drillLog under the namespaced slug
 * `cuisine:<id>` (the Cook at home precedent, `kitchen:<slug>`), so no
 * SessionState field is added and mergeSessions needs nothing. A card, a
 * question, a steps set and a match each carry their own id, so the four never
 * share a slug. Every reader scopes the log to the ids it knows before folding
 * it (repertoire.ts scopeToSlugs), never by the prefix: a card later retired
 * must not make a count promise a card nobody then deals.
 *
 * ## Cards
 *
 * On the term ladder (TERM_LADDER_DAYS, 2, 6, 14, 35 and 90 days) with one
 * climb a local day. Got it records `met`, Again records `missed` and sends the
 * card round once more in the run; only the first grade of a local day is
 * written (the Floor Deck's flipRecordable rule), so an evening of flipping
 * cannot climb a card three rungs. A run deals what is due (most overdue
 * first, as a share of its own interval), then the cards never seen in
 * teaching order (level, then the chapters' order, then each entry's own
 * order), then the rest, soonest due first.
 *
 * ## Rounds
 *
 * Multiple choice (four shuffled options), Order the steps and Family
 * matching. A right answer records `close`, a wrong one `missed` (the
 * lexicon quiz's rule: a quiz answer holds a rung, it never climbs one), once
 * per item per local day. Items are asked missed last time first, then never
 * asked, then the oldest asked.
 */
import { shuffle, type Rand } from './drill';
import { dayKey, DAY_MS, metSlugs, repertoire, scopeToSlugs, TERM_LADDER_DAYS, type CookEntry, type Grade, type RepertoireEntry } from './repertoire';

/* The shapes the build writes */

/** The four brigade levels by their frozen keys; named in levels.json, never numbered on screen. */
export type CzLevel = 1 | 2 | 3 | 4;

export interface CzChapterHead {
	key: string;
	title: string;
	intro: string;
	/** ch-<key>.json, or null while the chapter holds nothing yet. */
	file: string | null;
	entries: number;
	cards: number;
	questions: number;
	steps: number;
	matches: number;
}

export interface CzHead {
	id: string;
	slug: string;
	chapter: string;
	title: string;
	say: string;
	level: CzLevel;
	kind: string;
	summary: string;
}

/** A card or a question: [its id, its entry's id, the entry's level]. */
export type CzTuple = [id: string, entry: string, level: CzLevel];

export interface CzStepsHead {
	id: string;
	chapter: string;
	entry: string | null;
	title: string;
}

export interface CzMatchHead {
	id: string;
	chapter: string;
	title: string;
	pairs: number;
	generated?: 'tree' | 'ladder' | 'brennans';
}

export interface CzDishLink {
	dish: string;
	components: string[];
}

export interface CzTreeNode {
	name?: string;
	say?: string;
	/** A Cuisine entry's slug. */
	entry?: string;
	adds?: string;
	liaison?: string;
	liquid?: string;
	dishes?: CzDishLink[];
	children?: CzTreeNode[];
}

export interface CzTree {
	careme: { four: string[]; note: string };
	mothers: CzTreeNode[];
}

export interface CzRung {
	key: string;
	name: string;
	minutes: number | [number, number];
	cue: string;
	smell: string;
	thickening: string;
	/** Cuisine entry slugs. */
	uses: string[];
	dishes: CzDishLink[];
}

export interface CzLadder {
	rungs: CzRung[];
}

export interface CzIndex {
	version: number;
	complete: boolean;
	draft: boolean;
	levels: Record<string, string>;
	chapters: CzChapterHead[];
	entries: CzHead[];
	cards: CzTuple[];
	questions: CzTuple[];
	steps: CzStepsHead[];
	matches: CzMatchHead[];
	tree: CzTree | null;
	ladder: CzLadder | null;
	byTechnique: Record<string, string[]>;
	byDish: Record<string, string[]>;
	/** Every dish id Cuisine links, with its name from the pack. */
	dishes?: Record<string, string>;
	pending?: string[];
}

export interface CzCard {
	id: string;
	front: string;
	back: string;
}

export interface CzQuestion {
	id: string;
	q: string;
	answer: string;
	distractors: string[];
	why: string;
	/** The id of the card it teaches. */
	teaches: string;
}

export interface CzSource {
	title: string;
	url: string;
	asOf?: string;
	year?: number;
	evidence?: string;
}

export interface CzBrennans {
	dish: string;
	components: string[];
	how: string;
}

/** The contract's SEE_ALSO_KEYS, in its order; `terms` is the owner's own sheet terms (From your sheets). */
export const SEE_KEYS = ['entries', 'techniques', 'lexicon', 'recipes', 'kitchen', 'plates', 'folios', 'deck', 'components', 'terms'] as const;
export type CzSeeKey = (typeof SEE_KEYS)[number];

export interface CzEntry {
	id: string;
	slug: string;
	title: string;
	say: string;
	level: CzLevel;
	kind: string;
	summary: string;
	guest: string;
	sections: Array<{ key: string; paras: string[] }>;
	ratios: Array<{ label: string; value: string }>;
	temps: Array<{ label: string; c: number; f: number }>;
	faults: Array<{ fault: string; cause: string; fix: string }>;
	brennans: CzBrennans[];
	seeAlso: Partial<Record<CzSeeKey, string[]>>;
	quote?: { text: string; source: string; year?: number };
	sources: CzSource[];
	cards: CzCard[];
	questions: CzQuestion[];
}

export interface CzStepsSet {
	id: string;
	entry: string | null;
	title: string;
	prompt: string;
	steps: string[];
	distractor?: string;
	why: string;
}

/** [left, right] or [left, right, the id of the entry it teaches]. */
export type CzPair = [string, string] | [string, string, string];

export interface CzMatchSet {
	id: string;
	title: string;
	prompt: string;
	left: string;
	right: string;
	pairs: CzPair[];
	generated?: 'tree' | 'ladder' | 'brennans';
}

/** What each cross reference is called, written by the build per chapter. */
export interface CzLabels {
	techniques?: Record<string, string>;
	lexicon?: Record<string, string>;
	recipes?: Record<string, string>;
	plates?: Record<string, string>;
	/** slug: [title, level] */
	kitchen?: Record<string, [string, number]>;
	/** id: [term, section] */
	deck?: Record<string, [string, string]>;
	/** A sheet term's entry id in culinary-foundations.json: its term, as Your culinary terms prints it. */
	terms?: Record<string, string>;
}

/** One row of From your sheets: a link to the owner's own term. */
export interface CzSheetLink {
	id: string;
	href: string;
	label: string;
}

/**
 * From your sheets: the owner's own sheet terms an entry teaches or rests on,
 * in the entry's order, each a link to its page in Your culinary terms,
 * `{base}/foundations?term=<id>`, the address that page opens a term by. The
 * label is the term as the sheet names it, written by the build. A term the
 * build could not name is left out, never drawn as a link to a page that
 * would not find it; no terms, no rows, and the entry draws no block.
 */
export function sheetLinks(ids: readonly string[] | undefined, labels: CzLabels | undefined, base: string): CzSheetLink[] {
	const out: CzSheetLink[] = [];
	for (const id of ids ?? []) {
		const label = labels?.terms?.[id];
		if (label && !out.some((r) => r.id === id)) out.push({ id, href: `${base}/foundations?term=${encodeURIComponent(id)}`, label });
	}
	return out;
}

export interface CzChapter {
	version: number;
	key: string;
	title: string;
	intro: string;
	entries: CzEntry[];
	steps: CzStepsSet[];
	matches: CzMatchSet[];
	labels?: CzLabels;
}

/* The record */

export const CZ_PREFIX = 'cuisine:';

/** The drillLog slug of a Cuisine card, question, steps set or match. */
export function czSlug(id: string): string {
	return CZ_PREFIX + id;
}

/** The log scoped to these Cuisine ids, never by the prefix (see the header). */
export function czLog(log: readonly CookEntry[], ids: Iterable<string>): CookEntry[] {
	const slugs = new Set<string>();
	for (const id of ids) slugs.add(czSlug(id));
	return scopeToSlugs(log, slugs);
}

/**
 * May a grade be written for this id now? Once per item per local day, from
 * any screen: the Floor Deck's flipRecordable, for Cuisine's slugs.
 */
export function recordable(log: readonly CookEntry[], id: string, now: number): boolean {
	const slug = czSlug(id);
	const today = dayKey(now);
	return !log.some((e) => e.slug === slug && dayKey(e.at) === today);
}

/** A card's grade: Got it is `met`, Again `missed`. */
export function cardGrade(got: boolean): Grade {
	return got ? 'met' : 'missed';
}

/** A round's grade: a right answer `close`, a wrong one `missed`. Never `met`. */
export function roundGrade(right: boolean): Grade {
	return right ? 'close' : 'missed';
}

/* Cards */

/** A run's length, and how many of it may be new: today.ts's RUN_CAP and NEW_CAP. */
export const CZ_RUN_CAP = 20;
export const CZ_NEW_CAP = 10;

/**
 * The cards in teaching order: by level, and within a level in the index's
 * own order (the chapters' order, each entry's, each card's). A stable sort,
 * so the index order is kept inside a level.
 */
export function teachingOrder(cards: readonly CzTuple[]): CzTuple[] {
	return cards
		.map((c, i) => ({ c, i }))
		.sort((a, b) => a.c[2] - b.c[2] || a.i - b.i)
		.map((x) => x.c);
}

/** One record per card the log holds, on the term ladder, one climb a day. */
export function cardRepertoire(log: readonly CookEntry[], ids: Iterable<string>, now: number): RepertoireEntry[] {
	return repertoire(czLog(log, ids), now, TERM_LADDER_DAYS, { oneClimbPerDay: true });
}

const idOf = (slug: string) => slug.slice(CZ_PREFIX.length);

/** Due and cold cards, most overdue first as a share of their own interval, the one that keeps slipping ahead. */
export function dueIds(rep: readonly RepertoireEntry[], now: number): string[] {
	const overdue = (e: RepertoireEntry) => (now - e.last) / (e.intervalDays * DAY_MS);
	return rep
		.filter((e) => e.state === 'due' || e.state === 'cold')
		.sort((a, b) => overdue(b) - overdue(a) || b.lapses - a.lapses || a.slug.localeCompare(b.slug))
		.map((e) => idOf(e.slug));
}

export interface CardDeal {
	/** Due, most overdue first. */
	due: string[];
	/** Never seen, in teaching order. */
	fresh: string[];
	/** Seen and not due, soonest due first. */
	rest: string[];
	/** The run: due, then fresh, then the rest, cut to the length asked. */
	refs: string[];
}

/**
 * A deck's run. `length` cuts the run (CZ_RUN_CAP when not given; 0 for the
 * whole deck); `newCap` limits how many never-seen cards it holds.
 */
export function dealCards(cards: readonly CzTuple[], log: readonly CookEntry[], now: number, opts: { length?: number; newCap?: number } = {}): CardDeal {
	const ordered = teachingOrder(cards).map((c) => c[0]);
	const rep = cardRepertoire(log, ordered, now);
	const due = dueIds(rep, now);
	const seen = new Set(rep.map((e) => idOf(e.slug)));
	const isDue = new Set(due);
	const fresh = ordered.filter((id) => !seen.has(id));
	const rest = [...rep]
		.filter((e) => !isDue.has(idOf(e.slug)))
		.sort((a, b) => a.dueAt - b.dueAt || a.slug.localeCompare(b.slug))
		.map((e) => idOf(e.slug));
	const length = opts.length === undefined ? CZ_RUN_CAP : opts.length;
	const freshTaken = opts.newCap === undefined ? fresh : fresh.slice(0, opts.newCap);
	const all = [...due, ...freshTaken, ...rest];
	return { due, fresh, rest, refs: length > 0 ? all.slice(0, length) : all };
}

export interface CzToday {
	/** The run, in the order it is dealt. */
	refs: string[];
	due: number;
	fresh: number;
	total: number;
}

/**
 * In Cuisine today, at a level: the cards due at or below it (what is owed
 * reaches down, the Floor Deck's rule, never up), then up to CZ_NEW_CAP never
 * seen at the level itself, CZ_RUN_CAP in all. Nothing seen and not due.
 */
export function cuisineToday(cards: readonly CzTuple[], log: readonly CookEntry[], now: number, level: CzLevel): CzToday {
	const owedFrom = cards.filter((c) => c[2] <= level);
	const at = cards.filter((c) => c[2] === level);
	const rep = cardRepertoire(log, owedFrom.map((c) => c[0]), now);
	const seen = new Set(rep.map((e) => idOf(e.slug)));
	const due = dueIds(rep, now).slice(0, CZ_RUN_CAP);
	const room = Math.min(CZ_NEW_CAP, CZ_RUN_CAP - due.length);
	const fresh = teachingOrder(at)
		.map((c) => c[0])
		.filter((id) => !seen.has(id))
		.slice(0, Math.max(0, room));
	const refs = [...due, ...fresh];
	return { refs, due: due.length, fresh: fresh.length, total: refs.length };
}

/** The line under "In Cuisine today", the level named. */
export function todayLine(t: CzToday, levelName: string): string {
	if (!t.total) return `Nothing due at ${levelName} today, and nothing new left to start.`;
	const part = (n: number, word: string) => `${n} ${word}`;
	if (!t.due) return `${part(t.fresh, t.fresh === 1 ? 'new card' : 'new cards')} at ${levelName}.`;
	if (!t.fresh) return `${part(t.due, t.due === 1 ? 'card due' : 'cards due')} at ${levelName}.`;
	return `${part(t.due, 'due')} and ${part(t.fresh, 'new')} at ${levelName}.`;
}

/**
 * After a grade: Again sends a card round once more in this run, as the Floor
 * Deck's sitting did; a card already sent round is not sent again.
 */
export function requeue(refs: readonly string[], ref: string, got: boolean): string[] {
	const out = [...refs];
	if (!got && out.indexOf(ref) === out.lastIndexOf(ref)) out.push(ref);
	return out;
}

/** How many of these cards are learnt: met on the ladder (repertoire.ts metSlugs, one rule). */
export function learntCount(ids: Iterable<string>, log: readonly CookEntry[]): number {
	const list = [...ids];
	const met = metSlugs(czLog(log, list));
	let n = 0;
	for (const id of list) if (met.has(czSlug(id))) n++;
	return n;
}

/* Scopes: which cards, questions and sets a deck or a round draws on */

/**
 * A deck's id or a round's scope, as the address carries it:
 *   all          every one
 *   lv:<n>       at a level
 *   ch:<key>     a chapter, every level
 *   e:<entryId>  one entry
 */
export type CzScope = { kind: 'all' } | { kind: 'level'; level: CzLevel } | { kind: 'chapter'; key: string } | { kind: 'entry'; id: string };

export function parseScope(s: string | null | undefined): CzScope | null {
	if (!s) return null;
	if (s === 'all') return { kind: 'all' };
	const m = /^(lv|ch|e):(.+)$/.exec(s);
	if (!m) return null;
	if (m[1] === 'lv') return /^[1-4]$/.test(m[2]) ? { kind: 'level', level: Number(m[2]) as CzLevel } : null;
	if (m[1] === 'ch') return { kind: 'chapter', key: m[2] };
	return { kind: 'entry', id: m[2] };
}

export function scopeString(scope: CzScope): string {
	switch (scope.kind) {
		case 'all':
			return 'all';
		case 'level':
			return `lv:${scope.level}`;
		case 'chapter':
			return `ch:${scope.key}`;
		case 'entry':
			return `e:${scope.id}`;
	}
}

/** What a scope is called on screen, the level named. */
export function scopeName(scope: CzScope, index: Pick<CzIndex, 'chapters' | 'entries'> | null, levelName: (n: CzLevel) => string): string {
	switch (scope.kind) {
		case 'all':
			return 'Every level';
		case 'level':
			return levelName(scope.level);
		case 'chapter':
			return index?.chapters.find((c) => c.key === scope.key)?.title ?? 'A chapter';
		case 'entry':
			return index?.entries.find((h) => h.id === scope.id)?.title ?? 'One entry';
	}
}

function tupleIn(scope: CzScope, chapterOf: ReadonlyMap<string, string>) {
	return (t: CzTuple) => {
		switch (scope.kind) {
			case 'all':
				return true;
			case 'level':
				return t[2] === scope.level;
			case 'chapter':
				return chapterOf.get(t[1]) === scope.key;
			case 'entry':
				return t[1] === scope.id;
		}
	};
}

const chapterMap = (index: Pick<CzIndex, 'entries'>) => new Map(index.entries.map((h) => [h.id, h.chapter]));

/** The cards a scope holds, in the index's order. */
export function cardsInScope(index: Pick<CzIndex, 'entries' | 'cards'>, scope: CzScope): CzTuple[] {
	return index.cards.filter(tupleIn(scope, chapterMap(index)));
}

/** The questions a scope holds, in the index's order. */
export function questionsInScope(index: Pick<CzIndex, 'entries' | 'questions'>, scope: CzScope): CzTuple[] {
	return index.questions.filter(tupleIn(scope, chapterMap(index)));
}

/**
 * The steps sets a scope holds. A set belongs to its entry, so a level scope
 * takes the sets whose entry is at the level (a set whose entry is not
 * written yet is in every and in its chapter only).
 */
export function stepsInScope(index: Pick<CzIndex, 'entries' | 'steps'>, scope: CzScope): CzStepsHead[] {
	const level = new Map(index.entries.map((h) => [h.id, h.level]));
	return index.steps.filter((s) => {
		switch (scope.kind) {
			case 'all':
				return true;
			case 'level':
				return !!s.entry && level.get(s.entry) === scope.level;
			case 'chapter':
				return s.chapter === scope.key;
			case 'entry':
				return s.entry === scope.id;
		}
	});
}

/**
 * The match sets a scope holds. A match carries no level and no single
 * entry, so a level scope takes them all and an entry scope its chapter's.
 */
export function matchesInScope(index: Pick<CzIndex, 'entries' | 'matches'>, scope: CzScope): CzMatchHead[] {
	if (scope.kind === 'chapter') return index.matches.filter((m) => m.chapter === scope.key);
	if (scope.kind === 'entry') {
		const ch = index.entries.find((h) => h.id === scope.id)?.chapter;
		return index.matches.filter((m) => m.chapter === ch);
	}
	return [...index.matches];
}

/** The chapters whose bodies a scope needs. */
export function chaptersForScope(index: Pick<CzIndex, 'chapters' | 'entries'>, scope: CzScope): string[] {
	if (scope.kind === 'chapter') return [scope.key];
	if (scope.kind === 'entry') {
		const ch = index.entries.find((h) => h.id === scope.id)?.chapter;
		return ch ? [ch] : [];
	}
	return index.chapters.filter((c) => c.file).map((c) => c.key);
}

/* The order a round asks in */

export type CzKind = 'mc' | 'steps' | 'match';

/** How many items a round asks, by kind. */
export const ROUND_LENGTH: Record<CzKind, number> = { mc: 10, steps: 5, match: 5 };

/**
 * The order to ask in: what was missed last time first (the longest ago
 * first), then what was never asked (shuffled, so a wide scope does not ask
 * one entry's questions in a row), then the rest, the oldest asked first.
 */
export function askOrder(ids: readonly string[], log: readonly CookEntry[], rand: Rand): string[] {
	const last = new Map<string, CookEntry>();
	for (const e of czLog(log, ids)) {
		const id = idOf(e.slug);
		const was = last.get(id);
		if (!was || e.at >= was.at) last.set(id, e);
	}
	const at = (id: string) => last.get(id)?.at ?? 0;
	const missed = ids.filter((id) => last.get(id)?.grade === 'missed').sort((a, b) => at(a) - at(b));
	const never = shuffle(
		ids.filter((id) => !last.has(id)),
		rand
	);
	const rest = ids.filter((id) => last.has(id) && last.get(id)?.grade !== 'missed').sort((a, b) => at(a) - at(b));
	return [...new Set([...missed, ...never, ...rest])];
}

/** A question's four options, shuffled: the answer and its three distractors. */
export function mcOptions(q: Pick<CzQuestion, 'answer' | 'distractors'>, rand: Rand): string[] {
	return shuffle([q.answer, ...q.distractors], rand);
}

/* Order the steps */

/**
 * The stages to place, shuffled, with the one that does not belong among
 * them. Never dealt already in order: a shuffle that lands on the answer has
 * its first two swapped.
 */
export function stepsPool(set: Pick<CzStepsSet, 'steps' | 'distractor'>, rand: Rand): string[] {
	const pool = shuffle(set.distractor ? [...set.steps, set.distractor] : [...set.steps], rand);
	const inOrder = set.steps.every((s, i) => pool[i] === s) && (!set.distractor || pool[pool.length - 1] === set.distractor);
	if (inOrder && pool.length > 1) [pool[0], pool[1]] = [pool[1], pool[0]];
	return pool;
}

/** Tap a stage in the pool: it goes to the end of the order (once, and never past the number of stages). */
export function placeStep(placed: readonly number[], poolIndex: number, need: number): number[] {
	if (placed.includes(poolIndex) || placed.length >= need) return [...placed];
	return [...placed, poolIndex];
}

/** Tap a placed stage: it goes back to the pool and the stages after it move up. */
export function removeStep(placed: readonly number[], position: number): number[] {
	return placed.filter((_, i) => i !== position);
}

export interface StepsResult {
	right: boolean;
	/** The positions (from 0) that hold the wrong stage. */
	wrong: number[];
	/** True when the stage that does not belong was placed. */
	intruder: boolean;
}

/** Graded exact: right only when every stage is in its place and the stray one is left out. */
export function gradeSteps(set: Pick<CzStepsSet, 'steps' | 'distractor'>, pool: readonly string[], placed: readonly number[]): StepsResult {
	const said = placed.map((i) => pool[i]);
	const wrong: number[] = [];
	for (let i = 0; i < set.steps.length; i++) if (said[i] !== set.steps[i]) wrong.push(i);
	const intruder = !!set.distractor && said.includes(set.distractor);
	return { right: wrong.length === 0 && !intruder && said.length === set.steps.length, wrong, intruder };
}

/* Family matching */

/** The right column's order: the pairs' indexes shuffled, never left as dealt. */
export function matchOrder(n: number, rand: Rand): number[] {
	const order = shuffle(
		Array.from({ length: n }, (_, i) => i),
		rand
	);
	if (n > 1 && order.every((v, i) => v === i)) [order[0], order[1]] = [order[1], order[0]];
	return order;
}

/** A pairing: [left index, right index], both indexes into the set's pairs. */
export type CzLink = [number, number];

/** Tap left then right: the two are paired, and any pair either was in is undone. */
export function pairUp(links: readonly CzLink[], left: number, right: number): CzLink[] {
	return [...links.filter(([l, r]) => l !== left && r !== right), [left, right]];
}

/** Tap a paired item (either side): its pair is undone. */
export function unpair(links: readonly CzLink[], side: 'left' | 'right', index: number): CzLink[] {
	return links.filter(([l, r]) => (side === 'left' ? l !== index : r !== index));
}

export interface MatchResult {
	right: boolean;
	/** The left indexes paired wrongly, or not at all. */
	wrong: number[];
}

/** Right when every left item is paired with its own right item (or one that reads the same). */
export function gradeMatch(set: Pick<CzMatchSet, 'pairs'>, links: readonly CzLink[]): MatchResult {
	const wrong: number[] = [];
	set.pairs.forEach((p, l) => {
		const link = links.find((x) => x[0] === l);
		if (!link || (link[1] !== l && set.pairs[link[1]]?.[1] !== p[1])) wrong.push(l);
	});
	return { right: wrong.length === 0, wrong };
}

/* Reading */

/** The first entry at a level not yet read, in the index's order, or null. */
export function nextUnread(entries: readonly CzHead[], read: ReadonlySet<string>, level: CzLevel): CzHead | null {
	return entries.find((h) => h.level === level && !read.has(h.id)) ?? null;
}

/** The entry after this one in the index's order (chapter by chapter), or null at the end. */
export function nextEntry(entries: readonly CzHead[], id: string): CzHead | null {
	const i = entries.findIndex((h) => h.id === id);
	return i >= 0 && i + 1 < entries.length ? entries[i + 1] : null;
}

export interface ChapterCounts {
	entries: number;
	read: number;
	cards: number;
	learnt: number;
}

/** A chapter door's figures: its entries, how many read, its cards and how many learnt. */
export function chapterCounts(index: Pick<CzIndex, 'entries' | 'cards'>, key: string, read: ReadonlySet<string>, log: readonly CookEntry[]): ChapterCounts {
	const heads = index.entries.filter((h) => h.chapter === key);
	const ids = new Set(heads.map((h) => h.id));
	const cards = index.cards.filter((c) => ids.has(c[1])).map((c) => c[0]);
	return { entries: heads.length, read: heads.filter((h) => read.has(h.id)).length, cards: cards.length, learnt: learntCount(cards, log) };
}

/** "12 entries · 3 read · 40 cards learnt" */
export function chapterLine(c: ChapterCounts): string {
	return `${c.entries} ${c.entries === 1 ? 'entry' : 'entries'} · ${c.read} read · ${c.learnt} ${c.learnt === 1 ? 'card' : 'cards'} learnt`;
}

/** Minutes on the ladder as words: "3 to 5 minutes", "40 minutes". */
export function minutesWords(m: number | readonly [number, number]): string {
	if (typeof m === 'number') return `${m} ${m === 1 ? 'minute' : 'minutes'}`;
	return m[0] === m[1] ? `${m[0]} minutes` : `${m[0]} to ${m[1]} minutes`;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** A source's date as a reader says it: "26 September 2026". */
export function dateWords(iso: string): string {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
	if (!m) return iso;
	const month = MONTHS[Number(m[2]) - 1];
	return month ? `${Number(m[3])} ${month} ${m[1]}` : iso;
}

/** A section's heading, by its key. */
export const SECTION_TITLES: Record<string, string> = {
	what: 'What it is',
	how: 'How it is done',
	ratio: 'Ratios and temperatures',
	family: 'The family',
	faults: 'Faults and fixes',
	brennans: "At Brennan's",
	history: 'History',
	service: 'In service',
	buying: 'Buying and keeping',
	safety: 'Safety'
};

/** The kinds as a reader says them. */
export const KIND_WORDS: Record<string, string> = {
	sauce: 'Sauce',
	stock: 'Stock',
	emulsion: 'Emulsion',
	method: 'Method',
	dish: 'Dish',
	ingredient: 'Ingredient',
	person: 'Person',
	place: 'Place',
	history: 'History',
	term: 'Term',
	pastry: 'Pastry',
	safety: 'Safety'
};

/**
 * The cards a round's misses point at, for "Study these cards": a question's
 * own card, every card of a missed steps set's entry, every card of the
 * entries a wrongly matched pair names. Unique, in the order met, cut to a run.
 */
export function cardsForMisses(
	misses: ReadonlyArray<{ teaches?: string | null; entries?: readonly string[] }>,
	cardsOfEntry: (entryId: string) => readonly string[]
): string[] {
	const out: string[] = [];
	const add = (id: string) => {
		if (!out.includes(id)) out.push(id);
	};
	for (const m of misses) {
		if (m.teaches) add(m.teaches);
		for (const e of m.entries ?? []) for (const id of cardsOfEntry(e)) add(id);
	}
	return out.slice(0, CZ_RUN_CAP);
}
