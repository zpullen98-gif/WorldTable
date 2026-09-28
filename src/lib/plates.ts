/**
 * Plate navigation joins and a self-check of the reviewed six-subject guide.
 * The original poster transcription remains an archive. It is never a quiz
 * source: some poster facts are known to be wrong. Randomness is injected
 * so the question order and answer positions can be checked deterministically.
 * The quiz records no grades and writes nothing to the learner's progress.
 */
import type { Plate, PlateItem, PlatesData } from './types';
import { shuffle, type Rand } from './drill';

export const PLATE_QUIZ_LENGTH = 6;
export const OPTION_COUNT = 4;

/** Where a plate's page is, without the base: the caller prefixes it. */
export function plateHref(base: string, slug: string): string {
	return `${base}/plates/${slug}`;
}

export interface PlateRef {
	slug: string;
	title: string;
}

export interface PlateIndexes {
	bySlug: ReadonlyMap<string, Plate>;
	/** Deck section key -> the plates that illustrate it, in wall order. */
	bySection: ReadonlyMap<string, PlateRef[]>;
	/** Lexicon category -> the plates that illustrate it, in wall order. */
	byCategory: ReadonlyMap<string, PlateRef[]>;
	/** Deck card id -> the first plate (in wall order) that shows the card's term. */
	byCard: ReadonlyMap<string, PlateRef>;
	/** Lexicon slug -> the first plate that shows the term. */
	byLexicon: ReadonlyMap<string, PlateRef>;
}

export function plateIndexes(data: PlatesData): PlateIndexes {
	const bySlug = new Map<string, Plate>();
	const bySection = new Map<string, PlateRef[]>();
	const byCategory = new Map<string, PlateRef[]>();
	const byCard = new Map<string, PlateRef>();
	const byLexicon = new Map<string, PlateRef>();
	for (const p of data.plates) {
		const ref = { slug: p.slug, title: p.title };
		bySlug.set(p.slug, p);
		for (const s of p.deckSections) (bySection.get(s) ?? bySection.set(s, []).get(s)!).push(ref);
		for (const c of p.lexiconCategories) (byCategory.get(c) ?? byCategory.set(c, []).get(c)!).push(ref);
		for (const g of p.groups) {
			for (const it of g.items) {
				if (it.links?.deck && !byCard.has(it.links.deck)) byCard.set(it.links.deck, ref);
				if (it.links?.lexicon && !byLexicon.has(it.links.lexicon)) byLexicon.set(it.links.lexicon, ref);
			}
		}
	}
	return { bySlug, bySection, byCategory, byCard, byLexicon };
}

/** The value of one fact on an item, or null. */
export function factOf(item: PlateItem, label: string): string | null {
	return item.facts.find((f) => f[0] === label)?.[1] ?? null;
}

/** "Salmon (Pacific)": the name with its sub, for a prompt. */
export function displayName(item: PlateItem): string {
	return item.sub ? `${item.name} (${item.sub})` : item.name;
}

export interface PlateQuestion {
	kind: 'item';
	prompt: string;
	options: string[];
	answer: string;
	/** The reviewed subject the question is about, for the result screen. */
	about: string;
}

/**
 * Identify each reviewed subject from its distinct description. Every option
 * comes from this guide, never from archival groups, facts or corrections.
 * Old cached data with no reviewed guide cannot fall back to the old quiz.
 */
export function plateQuiz(plate: Plate, rand: Rand, n: number = PLATE_QUIZ_LENGTH): PlateQuestion[] {
	const subjects = plate.teaching?.subjects;
	if (!subjects || subjects.length !== PLATE_QUIZ_LENGTH) return [];
	const names = subjects.map((s) => s.name);
	if (new Set(names).size !== subjects.length ||
		subjects.some((s) => !s.name?.trim() || !s.summary?.trim()) ||
		new Set(subjects.map((s) => s.summary)).size !== subjects.length) return [];
	const limit = Number.isFinite(n) ? Math.max(0, Math.min(PLATE_QUIZ_LENGTH, Math.floor(n))) : PLATE_QUIZ_LENGTH;
	return shuffle(subjects, rand).slice(0, limit).map((subject) => {
		const others = shuffle(names.filter((name) => name !== subject.name), rand).slice(0, OPTION_COUNT - 1);
		return {
			kind: 'item',
			prompt: 'Which subject matches this description? ' + subject.summary,
			options: shuffle([subject.name, ...others], rand),
			answer: subject.name,
			about: subject.name
		};
	});
}
