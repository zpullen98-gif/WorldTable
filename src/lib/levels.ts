/**
 * The four levels' engine: what each level holds, how much of it is met, which
 * level a reader is on, what Today deals, and the level test. Pure, with
 * injected time and randomness, and built ON the app's existing engines
 * rather than beside them: a dish is met by the cooked log, a term by the
 * drill log through the one ladder rule (repertoire.ts metSlugs), a deck card
 * by the deck's own test builder, a taste by the calibration bench.
 *
 * ## The figure
 *
 * A level card says a WORD and a FIGURE and never a score: `Untouched` when
 * nothing at the level is met, `Met` when every counted item is, otherwise
 * `N% met` with N clamped to 1..99, so a reader who has met one term of two
 * hundred sees 1% and not 0%, and one term short of everything sees 99% and
 * not 100%. The level's N is the MEAN of its counted subsections' shares,
 * subsections empty at that level excluded, so a large subsection (the
 * Lexicon) cannot hide a small one (the dishes). Food Safety is read and never
 * graded: it is listed, and it never counts.
 *
 * ## Which level you are on
 *
 * The lowest level not yet met, derived from the logs every time it is asked
 * and never stored, so there is no "current level" to fall out of step with
 * what was actually studied. Never null: once every level is met, it is IV.
 *
 * ## What each subsection counts as met
 *
 *   dishes      a course dish cooked, whatever the grade
 *   techniques  a cook graded `met` on a recipe of the technique when the
 *               technique carries a written standard; any cook of one of its
 *               recipes when it does not (there was no standard to miss)
 *   lexicon     a term graded met or close on its ladder (the quiz can grade
 *               `close` at best; a term met only by missing it is not met)
 *   deck        a card met the same way, through the deck's own modes
 *   palate      a fault named on a plate through cook mode; a taste whose
 *               ladder has been cleared to the rung the level names
 *   service     a module's terms, met the way Lexicon terms are
 *   safety      never counted
 */

import type { DeckLevel, DeckTraps, FloorDeck, LevelsData, SubsectionKey } from './types';
import {
	DAY_MS,
	TERM_LADDER_DAYS,
	cookedSlugs,
	dueList,
	metSlugs,
	repertoire,
	scopeToSlugs,
	type CookEntry,
	type Grade
} from './repertoire';
import { levelReached, type CalibrationEntry } from './calibration';
import { buildTest, dueCount, type TestQuestion } from './floor-deck';
import { gradeFor, optionsFor, orderRound, type DrillCard, type DrillQuestion, type Rand } from './drill';
import { gradeForQuiz, nextTarget, optionsForTerm, type LexQuestion, type LexTerm } from './lexicon-quiz';

export const LEVEL_KEYS: readonly DeckLevel[] = [1, 2, 3, 4];

/** The numerals are the shared thread across the three apps. */
export const NUMERAL: Record<DeckLevel, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

/** How many service and Lexicon questions a level test asks after the deck's. */
export const LEVEL_TEST = { service: 6, lexicon: 8 } as const;

/**
 * The rung of a calibration ladder a level asks a taste to be cleared to. The
 * ladders have five rungs and the app four levels; Chef asks the top.
 */
export const PALATE_RUNG: Record<DeckLevel, number> = { 1: 1, 2: 2, 3: 3, 4: 5 };

/** The two words and the figure. Exported so the level page prints the same. */
export const UNTOUCHED = 'Untouched';
export const MET = 'Met';
export const NEVER_GRADED = 'Read, never graded';

/**
 * The word and figure for a count. `share` may be given when the figure is a
 * mean rather than met/total (a level over its subsections).
 */
export function statOf(met: number, total: number, share: number = total ? met / total : 0): string {
	if (total <= 0 || met <= 0) return UNTOUCHED;
	if (met >= total) return MET;
	const pct = Math.min(99, Math.max(1, Math.round(share * 100)));
	return `${pct}% met`;
}

export interface Logs {
	cooked: readonly CookEntry[];
	drill: readonly CookEntry[];
	calibration: readonly CalibrationEntry[];
}

/** What the engine cannot read out of levels.json: which recipes a technique
 *  is exercised by. Built once by the store from techniques.json. */
export interface Joins {
	techniqueRecipes: ReadonlyMap<string, readonly string[]>;
}

export interface SubsectionProgress {
	key: SubsectionKey;
	title: string;
	counted: boolean;
	/** The slugs at this level (deck ids, module keys, `kind:key` for safety). */
	items: readonly string[];
	/** For service, the terms of the modules at this level; else `items`. */
	units: readonly string[];
	total: number;
	met: number;
	/** The units met, for the level page to mark rows. */
	metSet: ReadonlySet<string>;
	/** `Untouched`, `N% met`, `Met`, or `Read, never graded`. */
	label: string;
}

export interface LevelProgress {
	level: DeckLevel;
	numeral: string;
	name: string;
	blurb: string;
	subsections: SubsectionProgress[];
	met: number;
	total: number;
	/** The mean of the counted, non-empty subsections' shares. */
	share: number;
	label: string;
}

/** The slugs at one level of one subsection, as the data lists them. */
export function itemsAt(data: LevelsData, key: SubsectionKey, level: DeckLevel): readonly string[] {
	return data.items[key]?.[String(level)] ?? [];
}

/** The tastes at a level, as one slug per taste: `taste@rung`. */
function tasteUnits(data: LevelsData, level: DeckLevel): string[] {
	return data.tastes.map((t) => `${t}@${PALATE_RUNG[level]}`);
}

function techniqueMet(slug: string, cooked: readonly CookEntry[], data: LevelsData, joins: Joins): boolean {
	const recipes = joins.techniqueRecipes.get(slug);
	if (!recipes?.length) return false;
	const mine = new Set(recipes);
	const hasStandard = data.techniqueStandards.includes(slug);
	return cooked.some((e) => mine.has(e.slug) && (!hasStandard || e.grade === 'met'));
}

export function subsectionProgress(
	data: LevelsData,
	level: DeckLevel,
	key: SubsectionKey,
	logs: Logs,
	joins: Joins
): SubsectionProgress {
	const sub = data.subsections.find((s) => s.key === key);
	const title = sub?.title ?? key;
	const counted = sub?.counted ?? true;
	const items = itemsAt(data, key, level);
	let units: readonly string[] = items;
	const metSet = new Set<string>();

	if (!counted) {
		return { key, title, counted, items, units, total: items.length, met: 0, metSet, label: NEVER_GRADED };
	}

	switch (key) {
		case 'dishes': {
			const cooked = cookedSlugs([...logs.cooked]);
			for (const s of items) if (cooked.has(s)) metSet.add(s);
			break;
		}
		case 'techniques': {
			for (const s of items) if (techniqueMet(s, logs.cooked, data, joins)) metSet.add(s);
			break;
		}
		case 'lexicon':
		case 'deck': {
			const met = metSlugs(logs.drill);
			for (const s of items) if (met.has(s)) metSet.add(s);
			break;
		}
		case 'service': {
			units = items.flatMap((m) => data.moduleTerms[m] ?? []);
			const met = metSlugs(logs.drill);
			for (const s of units) if (met.has(s)) metSet.add(s);
			break;
		}
		case 'palate': {
			const named = new Set(logs.cooked.map((e) => e.fault).filter((f): f is string => Boolean(f)));
			for (const s of items) if (named.has(s)) metSet.add(s);
			const tastes = tasteUnits(data, level);
			for (const t of tastes) {
				const taste = t.slice(0, t.indexOf('@'));
				if (levelReached([...logs.calibration], taste) >= PALATE_RUNG[level]) metSet.add(t);
			}
			units = [...items, ...tastes];
			break;
		}
		case 'safety':
			break;
	}
	const total = units.length;
	const met = metSet.size;
	return { key, title, counted, items, units, total, met, metSet, label: statOf(met, total) };
}

export function levelProgress(data: LevelsData, level: DeckLevel, logs: Logs, joins: Joins): LevelProgress {
	const info = data.levels.find((l) => l.level === level);
	const subsections = data.subsections.map((s) => subsectionProgress(data, level, s.key, logs, joins));
	const counted = subsections.filter((s) => s.counted && s.total > 0);
	const met = counted.reduce((n, s) => n + s.met, 0);
	const total = counted.reduce((n, s) => n + s.total, 0);
	const share = counted.length ? counted.reduce((n, s) => n + s.met / s.total, 0) / counted.length : 0;
	const allMet = counted.length > 0 && counted.every((s) => s.met >= s.total);
	const label = allMet ? MET : statOf(met, total, share);
	return {
		level,
		numeral: NUMERAL[level],
		name: info?.name ?? `Level ${NUMERAL[level]}`,
		blurb: info?.blurb ?? '',
		subsections,
		met,
		total,
		share,
		label
	};
}

/** All four, in key order. */
export function allLevels(data: LevelsData, logs: Logs, joins: Joins): LevelProgress[] {
	return LEVEL_KEYS.map((l) => levelProgress(data, l, logs, joins));
}

/** The lowest level not yet met. Never null: IV once everything is. */
export function firstUnmetLevel(rows: readonly LevelProgress[]): DeckLevel {
	return rows.find((r) => r.label !== MET)?.level ?? 4;
}

/** `?level=N`, exact integers only: `?level=commis` is null. */
export function levelFromSearch(search: string): DeckLevel | null {
	const raw = new URLSearchParams(search).get('level');
	if (!raw) return null;
	const hit = LEVEL_KEYS.find((k) => String(k) === raw.trim());
	return hit ?? null;
}

/** Where a level's page is, without the base: the caller prefixes it. */
export function levelHref(level: DeckLevel): string {
	return `/level/${level}`;
}

// ── Today ───────────────────────────────────────────────────────────────────

export interface TodayLine {
	/** The one thing, as a sentence. `name` is the item's name, for a link. */
	line: string;
	name: string | null;
	href: string | null;
	/** "Today deals from Level N." and what is owed. */
	sub: string;
	level: DeckLevel;
}

export interface TodayNames {
	dish: (slug: string) => string;
}

/** Deck cards at a level the reader has not met or owes: what a sitting there
 *  would lead with, by the deck's own count plus what is unmet. Read off the
 *  levels file's copy of the deck index, so the home never loads the deck. */
function deckWaiting(data: LevelsData, level: DeckLevel, drill: readonly CookEntry[], now: number): number {
	const ids = itemsAt(data, 'deck', level);
	if (!ids.length) return 0;
	const met = metSlugs(scopeToSlugs(drill, new Set(ids)));
	const unmet = ids.filter((id) => !met.has(id)).length;
	return Math.max(unmet, dueCount({ cards: ids.map((id) => ({ id })) }, drill, now));
}

/**
 * One item, never a queue. In order: the coldest dish past its re-cook, then
 * the next uncooked course dish at the level, then the Floor Deck at the
 * level, then the Lexicon, then service; then the level is met and the next
 * begins; then everything is.
 */
export function todayFromLevel(
	data: LevelsData,
	rows: readonly LevelProgress[],
	logs: Logs,
	names: TodayNames,
	now: number,
	basePath: string = ''
): TodayLine {
	const level = firstUnmetLevel(rows);
	const row = rows.find((r) => r.level === level)!;
	const sub = (owed: number) =>
		`Today deals from Level ${NUMERAL[level]}.` + (owed > 0 ? ` ${owed === 1 ? 'One review is' : `${owed} reviews are`} owed across everything touched.` : '');

	const cookedRep = repertoire([...logs.cooked], now);
	const dueDishes = dueList(cookedRep, now);
	const termRep = repertoire([...logs.drill], now, TERM_LADDER_DAYS);
	const dueTerms = dueList(termRep, now);
	const owed = dueDishes.length + dueTerms.length;

	const coldest = dueDishes[0];
	if (coldest) {
		const days = Math.floor((now - coldest.last) / DAY_MS);
		const when = days <= 0 ? 'today' : days === 1 ? 'yesterday' : days < 21 ? `${days} days ago` : days < 60 ? `${Math.round(days / 7)} weeks ago` : `${Math.round(days / 30)} months ago`;
		return { line: `Cook ${names.dish(coldest.slug)} again. Last made ${when}.`, name: names.dish(coldest.slug), href: `${basePath}/recipe/${coldest.slug}`, sub: sub(owed), level };
	}

	const dishes = row.subsections.find((s) => s.key === 'dishes');
	const nextDish = dishes?.items.find((s) => !dishes.metSet.has(s));
	if (nextDish) {
		const name = names.dish(nextDish);
		// the first line after a level is met names the milestone once: the
		// level below is met and this one has not been touched yet
		const line =
			level > 1 && row.label === UNTOUCHED
				? `Level ${NUMERAL[(level - 1) as DeckLevel]} is met. Level ${NUMERAL[level]} begins with ${name}.`
				: `Cook ${name}, the next dish at Level ${NUMERAL[level]}.`;
		return { line, name, href: `${basePath}/recipe/${nextDish}`, sub: sub(owed), level };
	}

	const cards = deckWaiting(data, level, logs.drill, now);
	if (cards > 0) {
		return { line: `Flip the Floor Deck at Level ${NUMERAL[level]}: ${cards === 1 ? 'one card' : `${cards} cards`} to meet.`, name: null, href: `${basePath}/service/deck/study?level=${level}`, sub: sub(owed), level };
	}

	const lexicon = row.subsections.find((s) => s.key === 'lexicon');
	const termsLeft = lexicon ? lexicon.total - lexicon.met : 0;
	if (termsLeft > 0) {
		return { line: `Meet ${termsLeft === 1 ? 'one term' : `${termsLeft} terms`} of the Lexicon at Level ${NUMERAL[level]}.`, name: null, href: `${basePath}/lexicon?level=${level}&start=flash`, sub: sub(owed), level };
	}

	const service = row.subsections.find((s) => s.key === 'service');
	const serviceLeft = service ? service.total - service.met : 0;
	if (serviceLeft > 0) {
		return { line: `Meet ${serviceLeft === 1 ? 'one service term' : `${serviceLeft} service terms`} at Level ${NUMERAL[level]}.`, name: null, href: `${basePath}/service/drill?level=${level}`, sub: sub(owed), level };
	}

	if (row.label !== MET) {
		// something else at the level is unmet (a technique, a fault): the
		// level page lists it
		return { line: `Level ${NUMERAL[level]} has more to meet: open it.`, name: null, href: `${basePath}${levelHref(level)}`, sub: sub(owed), level };
	}

	// firstUnmetLevel only ever names a met level once every level is met
	return { line: 'Every level is met. Cook what has gone cold when it comes due.', name: null, href: null, sub: sub(owed), level };
}

// ── the level test ──────────────────────────────────────────────────────────

export type LevelQuestion =
	| { kind: 'deck'; q: TestQuestion }
	| { kind: 'service'; q: DrillQuestion }
	| { kind: 'lexicon'; q: LexQuestion };

export interface LevelTest {
	level: DeckLevel;
	questions: LevelQuestion[];
	counts: { deck: number; service: number; lexicon: number };
}

/**
 * One test across the level's subsections: the deck's own written test at the
 * level (with its traps), then six service questions ordered the way every
 * round is (owed first, then never asked), with wrong answers drawn from all
 * 186 cards, then eight Lexicon questions with the whole lexicon as field.
 * Every slug at most once; never padded when a subsection is short.
 */
export function buildLevelTest(
	data: LevelsData,
	level: DeckLevel,
	deck: FloorDeck,
	traps: DeckTraps,
	drills: readonly DrillCard[],
	lexicon: readonly LexTerm[],
	logs: Logs,
	now: number,
	rand: Rand
): LevelTest {
	const questions: LevelQuestion[] = [];

	for (const q of buildTest(deck, traps, logs.drill, now, rand, { level })) questions.push({ kind: 'deck', q });
	const deckCount = questions.length;

	const modules = new Set(itemsAt(data, 'service', level));
	const mine = drills.filter((c) => modules.has(c.moduleId));
	if (mine.length) {
		const own = scopeToSlugs(logs.drill, new Set(mine.map((c) => c.slug)));
		const due = dueList(repertoire(own, now, TERM_LADDER_DAYS), now).map((e) => e.slug);
		const drilled = new Set(own.map((e) => e.slug));
		for (const target of orderRound(mine, due, drilled, rand, LEVEL_TEST.service)) {
			const q = optionsFor(target, drills, rand);
			if (q) questions.push({ kind: 'service', q });
		}
	}
	const serviceCount = questions.length - deckCount;

	const terms = new Set(itemsAt(data, 'lexicon', level));
	const pool = lexicon.filter((e) => terms.has(e.slug));
	if (pool.length) {
		const own = scopeToSlugs(logs.drill, terms);
		const due = dueList(repertoire(own, now, TERM_LADDER_DAYS), now).map((e) => e.slug);
		const asked = new Set<string>();
		const n = Math.min(LEVEL_TEST.lexicon, pool.length);
		for (let i = 0; i < n; i++) {
			const target = nextTarget(pool, due, asked, rand);
			if (!target || asked.has(target.slug)) break;
			asked.add(target.slug);
			questions.push({ kind: 'lexicon', q: optionsForTerm(target, lexicon, rand) });
		}
	}
	const lexiconCount = questions.length - deckCount - serviceCount;

	return { level, questions, counts: { deck: deckCount, service: serviceCount, lexicon: lexiconCount } };
}

/**
 * What an answer is worth, by the rule of the engine that asked it: the deck
 * and the drill grade `met` or `missed`; the Lexicon quiz never grades `met`.
 */
export function gradeLevelAnswer(kind: LevelQuestion['kind'], correct: boolean): Grade {
	return kind === 'lexicon' ? gradeForQuiz(correct) : gradeFor(correct, false);
}
