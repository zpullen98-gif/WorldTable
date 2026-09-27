/**
 * The Plates: what the pages read off the transcriptions, and the self-check
 * quiz a plate page offers. Pure, with injected randomness, for the reason
 * drill.ts and lexicon-quiz.ts are: the wrong shuffle and the guessable
 * option slot are exactly the defects only a test catches.
 *
 * ## What a plate is to the app
 *
 * A picture the reader opens on demand, and a transcription that installs
 * with the app (tools/derive/plates.mjs). The level pages list the plates
 * placed at the level, read and never graded; the deck landing and the
 * Lexicon link to the plates that illustrate a section or a category; a
 * deck card links to the plate it appears on. Every one of those joins is
 * computed here from the shipped file, never hand-mapped.
 *
 * ## The quiz records nothing
 *
 * A plate is a reference, not a test: the questions are drawn from what the
 * plate prints, options and all, so a right answer proves the plate was read
 * and nothing more. Nothing is written to any ladder. The page says so.
 */
import type { Plate, PlateItem, PlatesData } from './types';
import { shuffle, type Rand } from './drill';

export const PLATE_QUIZ_LENGTH = 8;
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

/** How a question asks for a fact, by its label. The plate is the authority:
 *  every prompt says "on the plate", because that is what is being checked. */
const PROMPTS: Record<string, (name: string) => string> = {
	Cook: (n) => `${n}: how does the plate say to cook it?`,
	Cuts: (n) => `${n}: which cuts does the plate show for it?`,
	Flavor: (n) => `${n}: its flavor profile on the plate?`,
	'Best prep': (n) => `${n}: the plate's best preparation for it?`,
	Season: (n) => `${n}: when does the plate put it in season?`,
	Where: (n) => `${n}: where does the plate say it comes from?`,
	Use: (n) => `${n}: what does the plate say it is used for?`,
	Latin: (n) => `${n}: its Latin name on the plate?`,
	'Best uses': (n) => `${n}: its best uses on the plate?`,
	Country: (n) => `${n}: which country does the plate give?`,
	Style: (n) => `${n}: how does the plate describe it?`,
	Character: (n) => `${n}: how does the plate describe it?`
};

export interface PlateQuestion {
	kind: 'fact' | 'item' | 'group';
	prompt: string;
	options: string[];
	answer: string;
	/** The item the question is about, for the result screen. */
	about: string;
}

interface Row {
	item: PlateItem;
	group: string;
}

/**
 * Up to `n` questions from one plate, every item asked at most once, drawn
 * from three shapes in turn: a fact of an item (the options are that fact on
 * other items), an item from a fact (the options are other items), and, on a
 * cut chart, the part of the animal a cut comes from. A shape that the plate
 * cannot field (fewer than four distinct values) is skipped. The answer's
 * slot is a Fisher-Yates position, never the first.
 */
export function plateQuiz(plate: Plate, rand: Rand, n: number = PLATE_QUIZ_LENGTH): PlateQuestion[] {
	const rows: Row[] = plate.groups.flatMap((g) => g.items.map((item) => ({ item, group: g.title })));
	const labels = [...new Set(rows.flatMap((r) => r.item.facts.map((f) => f[0])))];
	const groups = [...new Set(rows.map((r) => r.group).filter(Boolean))];

	/** the rows able to field a fact question on `label`: four distinct values on the plate */
	const fieldable = new Map<string, Row[]>();
	for (const label of labels) {
		const withIt = rows.filter((r) => factOf(r.item, label));
		const distinct = new Set(withIt.map((r) => factOf(r.item, label)));
		if (distinct.size >= OPTION_COUNT) fieldable.set(label, withIt);
	}
	const groupable = groups.length >= OPTION_COUNT;

	const out: PlateQuestion[] = [];
	const asked = new Set<string>();
	const order = shuffle(rows, rand);
	const shapes: Array<PlateQuestion['kind']> = ['fact', 'item', 'group'];
	let turn = 0;

	for (const row of order) {
		if (out.length >= n) break;
		const name = displayName(row.item);
		if (asked.has(name)) continue;
		let q: PlateQuestion | null = null;
		/* try each shape from this turn's, so the mix stays even when one is unfieldable */
		for (let k = 0; k < shapes.length && !q; k++) {
			const shape = shapes[(turn + k) % shapes.length];
			if (shape === 'group' && groupable && row.group) {
				const others = shuffle(groups.filter((g) => g !== row.group), rand).slice(0, OPTION_COUNT - 1);
				q = { kind: 'group', prompt: `${name}: which part of the animal is it from?`, options: shuffle([row.group, ...others], rand), answer: row.group, about: name };
			} else if (shape === 'fact' || shape === 'item') {
				const usable = shuffle([...fieldable.keys()].filter((l) => factOf(row.item, l)), rand);
				const label = usable[0];
				if (!label) continue;
				const value = factOf(row.item, label)!;
				if (shape === 'fact') {
					const others = shuffle([...new Set(fieldable.get(label)!.map((r) => factOf(r.item, label)!).filter((v) => v !== value))], rand).slice(0, OPTION_COUNT - 1);
					q = { kind: 'fact', prompt: (PROMPTS[label] ?? ((x) => `${x}: ${label.toLowerCase()} on the plate?`))(name), options: shuffle([value, ...others], rand), answer: value, about: name };
				} else {
					const others = shuffle(fieldable.get(label)!.filter((r) => factOf(r.item, label) !== value).map((r) => displayName(r.item)), rand).slice(0, OPTION_COUNT - 1);
					if (others.length < OPTION_COUNT - 1) continue;
					q = { kind: 'item', prompt: `Which one does the plate give ${label.toLowerCase()} “${value}”?`, options: shuffle([name, ...others], rand), answer: name, about: name };
				}
			}
		}
		if (!q) continue;
		out.push(q);
		asked.add(name);
		turn++;
	}
	return out;
}
