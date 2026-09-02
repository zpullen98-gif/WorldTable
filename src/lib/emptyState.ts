/**
 * The empty state, made to name its culprit.
 *
 * Pure, and outside the component, for the reason drill.ts and lexicon-quiz.ts
 * are: a runes module cannot be reached from a unit test, and a sentence that
 * carries numbers is exactly the kind of thing that drifts unnoticed.
 *
 * ## What was wrong
 *
 * The grid's zero state was one fixed sentence - "Nothing on the pass. Loosen a
 * filter or try another ingredient." - for six filters. It never said WHICH
 * filter had emptied the pass, and measured over the real corpus that is the
 * wrong shape of advice: in two thirds of the chapter-and-pair zeros exactly
 * one filter empties the chapter on its own, and in 56% of all zero cases
 * removing one filter restores results (median five, never fewer than one).
 * So "loosen a filter" is a guess handed to the cook; "Drop Vegetarian for 20
 * dishes" is the answer.
 *
 * ## How the numbers are computed
 *
 * One matches() pass per active filter with THAT filter set back to its
 * default - the culprit is the one whose removal restores the most. The
 * query is special: `qPool` is the scope already narrowed by the query, by the
 * same path the grid used (the search index when it has landed, the substring
 * fallback before), so every non-query pass runs over qPool with q blanked in
 * the predicate. That is what keeps "Drop Vegetarian for 20" equal to the
 * count the grid shows after the click, rather than a substring approximation
 * of it. The `library` figure is matchedAll.length - what the rail already
 * counts - so it costs nothing.
 *
 * The passes run only when the grid is empty: at most five over a chapter's
 * thirty dishes, six over 1,844 on /recipes.
 */
import type { FilterState, RecipeSummary } from './types';
import { EMPTY_FILTERS, DIFFICULTY_LABEL } from './types';
import { matches } from './filter';

export type Droppable = 'q' | 'course' | 'difficulty' | 'quick' | 'vegetarian' | 'season';

/**
 * Tie-break for the culprit: the filter a cook set most casually goes first -
 * a toggle before a select before typed text - because that is the one they
 * will least mind losing.
 */
export const DROP_ORDER: Droppable[] = ['quick', 'season', 'difficulty', 'course', 'vegetarian', 'q'];

/** Sentence order: what the dish IS before how it was found. */
const PHRASE_ORDER: Droppable[] = ['vegetarian', 'quick', 'season', 'difficulty', 'course', 'q'];

/** The chip's own text in Toolbar.svelte, so the sentence and the button agree. */
export const QUICK_LABEL = 'Under 40 min';

export interface EmptyInput {
	/** The chapter's name, or 'the library' on /recipes. */
	scope: string;
	/** False on /recipes: no "across the library" clause, no link. */
	inChapter: boolean;
	/** Every recipe in scope, family included. */
	all: RecipeSummary[];
	/** Recipes in scope that pass the query alone, by the path the grid used. */
	qPool: RecipeSummary[];
	filters: FilterState;
	month: number;
	/** matchedAll.length: the same filters over the whole library. */
	library: number;
}

export interface EmptyState {
	/** One per active filter, in sentence order. */
	phrases: string[];
	/** The filter whose removal restores the most, or null when none does. */
	culprit: { key: Droppable; label: string; restored: number } | null;
	library: number;
	/** The visible line. */
	sentence: string;
	/**
	 * For the live region: stable while typing. No numbers and no query text,
	 * so successive zero keystrokes do not re-announce.
	 */
	brief: string;
}

const KEYS: Droppable[] = ['q', 'course', 'difficulty', 'quick', 'vegetarian', 'season'];

function isActive(key: Droppable, f: FilterState): boolean {
	if (key === 'q') return f.q.trim().length > 0;
	return f[key] !== EMPTY_FILTERS[key];
}

/** How the filter reads inside "Nothing ... in Italian." */
export function phrase(key: Droppable, f: FilterState): string {
	switch (key) {
		case 'vegetarian':
			return 'vegetarian';
		case 'quick':
			return 'under 40 minutes';
		case 'season':
			return 'at its peak this month';
		case 'difficulty':
			return `marked ${DIFFICULTY_LABEL[f.difficulty ?? 1].toLowerCase()}`;
		case 'course':
			return `filed under ${f.course}`;
		case 'q':
			return `matching “${f.q.trim()}”`;
	}
}

/** The control's own name, for "Drop {label}". */
export function controlLabel(key: Droppable, f: FilterState): string {
	switch (key) {
		case 'vegetarian':
			return 'Vegetarian';
		case 'quick':
			return QUICK_LABEL;
		case 'season':
			return 'Peak this month';
		case 'difficulty':
			return DIFFICULTY_LABEL[f.difficulty ?? 1];
		case 'course':
			return f.course ?? '';
		case 'q':
			return 'the search';
	}
}

function joinPhrases(ps: string[]): string {
	if (ps.length <= 1) return ps.join('');
	return `${ps.slice(0, -1).join(', ')} and ${ps[ps.length - 1]}`;
}

const dishes = (n: number) => `${n} ${n === 1 ? 'dish' : 'dishes'}`;

export function emptyState(i: EmptyInput): EmptyState {
	const f = i.filters;
	const active = KEYS.filter((k) => isActive(k, f));

	const restoredBy = new Map<Droppable, number>();
	for (const key of active) {
		let n: number;
		if (key === 'q') {
			// Drop the query, keep everything else, over the whole scope.
			n = i.all.filter((r) => matches(r, { ...f, chapter: null, q: '' }, i.month)).length;
		} else {
			// Keep the query (already applied in qPool), drop this one filter.
			const without = { ...f, chapter: null, q: '', [key]: EMPTY_FILTERS[key] } as FilterState;
			n = i.qPool.filter((r) => matches(r, without, i.month)).length;
		}
		restoredBy.set(key, n);
	}

	let culprit: EmptyState['culprit'] = null;
	for (const key of active) {
		const n = restoredBy.get(key) ?? 0;
		if (n <= 0) continue;
		if (
			!culprit ||
			n > culprit.restored ||
			(n === culprit.restored && DROP_ORDER.indexOf(key) < DROP_ORDER.indexOf(culprit.key))
		) {
			culprit = { key, label: controlLabel(key, f), restored: n };
		}
	}

	const ordered = PHRASE_ORDER.filter((k) => active.includes(k));
	const phrases = ordered.map((k) => phrase(k, f));
	const briefPhrases = ordered.map((k) => (k === 'q' ? 'for that search' : phrase(k, f)));

	let sentence = 'Nothing on the pass.';
	if (phrases.length) sentence += ` Nothing ${joinPhrases(phrases)} in ${i.scope}.`;
	if (culprit) {
		sentence +=
			culprit.key === 'q'
				? ` Clear the search for ${dishes(culprit.restored)}`
				: ` Drop ${culprit.label} for ${dishes(culprit.restored)}`;
		if (i.inChapter)
			sentence += i.library > 0 ? `; ${i.library} across the library.` : '; none anywhere in the library.';
		else sentence += '.';
	} else if (i.inChapter && i.library > 0) {
		sentence += ` ${i.library} across the library.`;
	}

	const brief = phrases.length ? `Nothing ${joinPhrases(briefPhrases)} in ${i.scope}.` : 'Nothing on the pass.';

	return { phrases, culprit, library: i.library, sentence, brief };
}
