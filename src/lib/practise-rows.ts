/**
 * The quiz doors the Practise root and the Quizzes page both draw (17 Oct
 * 2026): one statement of their names, their lines and their addresses, so
 * the two pages never drift apart while /quizzes still stands as the rounds'
 * page under Practise.
 *
 * PURE, like quick-quiz.ts: every row is a plain name, line and href, built
 * from the base path and the few facts a page already holds (the chosen
 * level and its name, Show all, Cuisine's index). A page draws a row as an
 * `a.door` in a `nav.quiet`; nothing here reads a rune or a store.
 */
import { questionsInScope, type CzIndex, type CzLevel } from '$lib/cuisine';
import type { DeckLevel } from '$lib/types';

export interface PractiseRow {
	name: string;
	line: string;
	href: string;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The house's five rounds on /menu/quiz: the dishes, the drill, the pairings, Say it back and Guest at the table. */
export function houseQuizRows(base: string): PractiseRow[] {
	return [
		{ name: 'The dishes', line: 'Name the dish from its description, its ingredients or its price.', href: `${base}/menu/quiz` },
		{ name: 'Drill the menu', line: 'Mixed questions from every section, ten at a time.', href: `${base}/menu/quiz?mode=drill` },
		{ name: 'Pairings', line: 'Which wine, or which drink without alcohol, goes with each dish.', href: `${base}/menu/quiz?mode=pair` },
		{ name: 'Say it back', line: 'The ten, twenty and forty five second lines, out loud.', href: `${base}/menu/quiz?mode=say` },
		{ name: 'Guest at the table', line: 'A guest asks; you answer.', href: `${base}/menu/quiz?mode=guest` }
	];
}

/**
 * Cuisine's rounds, each a door into the Cuisine page (its address lights
 * Brennan's): the quiz at the level (every level under Show all, or when the
 * level holds none yet), Order the steps and Family matching over every
 * chapter, as the Cuisine root deals them. None until the index is read.
 */
export function cuisineQuizRows(
	base: string,
	index: Pick<CzIndex, 'entries' | 'questions' | 'steps' | 'matches'> | null,
	opts: { all: boolean; chosen: DeckLevel; levelName: string }
): PractiseRow[] {
	if (!index) return [];
	const enc = encodeURIComponent;
	const rows: PractiseRow[] = [];
	const atLevel = questionsInScope(index, { kind: 'level', level: opts.chosen as CzLevel }).length;
	const every = index.questions.length;
	if (every) {
		const scope = opts.all || !atLevel ? 'all' : `lv:${opts.chosen}`;
		const lead = opts.all ? 'Every level' : atLevel ? opts.levelName : `None at ${opts.levelName} yet, so every level`;
		rows.push({ name: 'The Cuisine quiz', line: `${lead}: ${plural(opts.all || !atLevel ? every : atLevel, 'question', 'questions')}, up to ten a round, four options each.`, href: `${base}/cuisine?quiz=${enc(scope)}&kind=mc` });
	}
	if (index.steps.length) rows.push({ name: 'Order the steps', line: `Put a method's stages in order: ${plural(index.steps.length, 'method', 'methods')}.`, href: `${base}/cuisine?quiz=all&kind=steps` });
	if (index.matches.length) rows.push({ name: 'Family matching', line: `Pair each item with its family: ${plural(index.matches.length, 'set', 'sets')}.`, href: `${base}/cuisine?quiz=all&kind=match` });
	return rows;
}

/** The level's four rounds; with no level named, each page opens at its own chosen level. */
export function levelQuizRows(base: string, n: DeckLevel | null): PractiseRow[] {
	const q = n ? `?level=${n}` : '';
	return [
		{ name: 'The written test', line: 'Which of these is the word? The Floor Deck, with its traps; it ends on what you missed.', href: `${base}/service/deck/test${q}` },
		{ name: 'Say it back: the Floor Deck', line: 'A guest describes it; you say the word before the choices appear.', href: `${base}/service/deck/say${q}` },
		{ name: 'The Lexicon quiz', line: 'Which term is this? Ten definitions, four terms each.', href: `${base}/lexicon${n ? `?level=${n}&start=quiz` : '?start=quiz'}` },
		{ name: 'The service drill', line: 'The service track’s terms, ten questions a round.', href: `${base}/service/drill${q}` }
	];
}

/** Hands on: the firing drill, the palate and the lineup. */
export function handsOnRows(base: string): PractiseRow[] {
	return [
		{ name: 'The firing drill', line: 'Which dish fires first? Your pinned menu, planned back from service.', href: `${base}/practise/firing` },
		{ name: 'Calibrate your palate', line: 'Taste, then say which fault and how far; the ladder climbs as you do.', href: `${base}/practise/calibrate` },
		{ name: 'The lineup', line: 'The Floor Deck read aloud to the whole room before service.', href: `${base}/service/deck/lineup` }
	];
}

/** The level's test, named by the level. */
export function levelTestRow(base: string, n: DeckLevel, name: string): PractiseRow {
	return {
		name: `The ${name} test`,
		line: `The Floor Deck, service and the Lexicon at ${name}, untimed; it ends on what you missed, with the right answers and no score.`,
		href: `${base}/level/${n}/test`
	};
}
