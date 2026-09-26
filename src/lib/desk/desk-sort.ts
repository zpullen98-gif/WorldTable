/**
 * The sorter: which room a row is for. Dishes to the World Table, wines to
 * the Codex, cocktails to the Ledger, and `unsure` for the row it cannot
 * place, with `could` saying what it might be in score order.
 *
 * DISH IS WHAT REMAINS, NOT WHAT IS RECOGNISED. There is no food vocabulary
 * to match a dish against, because a menu can name a dish anything at all and
 * a list of food words would only ever be wrong on the interesting ones. A row
 * is a wine when the line reads like a wine list, a cocktail when it reads
 * like a spec, and a dish otherwise. That is also why the signals here are
 * weighted rather than counted: 'Grand Marnier & Cognac jus' at the end of a
 * quail's description names two bottles, and it is still a quail.
 *
 * NEVER A SILENT GUESS. The best kind wins only when it leads by two AND the
 * heading does not point elsewhere. 'Kiss the Crab' under a tasting heading
 * reads like a cocktail and sits under food, and the honest answer is
 * `unsure` with both in `could`, which the review table's Kind column settles
 * in one tap. A row that guessed wrong and said it was sure is the one shape
 * this desk must not produce, because a wrong cocktail lands in the Ledger's
 * spec drills and a wrong dish lands on the guest menu.
 *
 * A spirits or beer list is `unsure` with `could: []`: no wing keeps it, and
 * the review table shows it greyed rather than dropping it.
 */

import {
	drinkHits,
	isSpecList,
	readDescriptors,
	sectionKindOf,
	splitSpec,
	VINTAGE,
	WEAK_STYLE,
	foldKey,
	type SectionKind
} from './desk-vocab';
import type { DeskKind, DeskWingKind } from './desk-file';

/** What the reader hands the sorter: the row's text, and what it read around it. */
export interface SortInput {
	name: string;
	/** The section heading and, when two headings ran together, the one above it. */
	headings: string[];
	/** The lines under the name, and the name line's own description, as printed. */
	body: string[];
	/** True when a price carried a pour label ('5 oz', 'Glass') or a pour line sat under it. */
	pourLabelled: boolean;
	/** A vintage read from the name, a body line or its own line; '' when none. */
	vintage: string;
	/** A list index the line printed; '' when none. */
	bin: string;
}

export interface SortResult {
	kind: DeskKind;
	/** For an unsure row: what it could be, best first. Empty for a spirits or beer list. */
	could: DeskWingKind[];
	why: string[];
}

/** Past this many words a body is a description, not a spec, and its bottle words are ingredients. */
const SPEC_MAX_WORDS = 20;
/**
 * The words a description uses and a spec does not. A short body naming two
 * bottles counts them only when it is not prose: 'quail over choucroute with
 * a Grand Marnier & Cognac jus' is thirteen words and a dish, and 'Zacapa No.
 * 23 Solera, banana oleosacrum, dry vermouth, orange peel' is a spec.
 */
const PROSE = /\b(?:with|over|and|served|topped|finished|stuffed|on a|in a|of the)\b/i;
/** The lead one kind needs over the next before it wins outright. */
const LEAD = 2;
/** Below this a line signal is a stray word, not a reading. */
const STRONG = 2;

/** Spirit, brand and liqueur hits: the parts of a line that are bottles. */
function bottleHits(text: string): number {
	return drinkHits(text).filter((h) => h.term === 'spirit' || h.term === 'brand' || h.term === 'liqueur').length;
}

/**
 * The wine signals on a run of text: region, country, grape and strong style
 * hits, counted only inside a part that was read WHOLE. 'aged Sherry' at the
 * end of a soup's description is a region word in prose and scores nothing;
 * 'Champagne, France' is three parts of vocabulary and scores twice.
 */
function wineHitsOn(text: string): number {
	const d = readDescriptors(text);
	return d.coveredHits.filter(
		(h) => h.term === 'region' || h.term === 'country' || h.term === 'grape' || (h.term === 'style' && !WEAK_STYLE.has(foldKey(h.text)))
	).length;
}

/** True when the whole name is wine vocabulary: 'Chablis', 'Sancerre', 'Pinot Grigio', 'Rioja Reserva'. */
function nameIsWine(name: string): boolean {
	const d = readDescriptors(name);
	if (!d.covered || d.parts.length === 0) return false;
	const strong = d.region.length + d.country.length + d.grapes.length + d.style.filter((s) => !WEAK_STYLE.has(foldKey(s))).length;
	return strong > 0;
}

export function classify(input: SortInput): SortResult {
	const why: string[] = [];
	const section: SectionKind | null = sectionKindOf(input.headings);
	const bodyText = input.body.join(' ');
	const bodyWords = bodyText.split(/\s+/).filter(Boolean).length;

	/* Wine, from the line alone; the heading's three come after. */
	let wine = 0;
	if (input.vintage || VINTAGE.test(input.name) || VINTAGE.test(bodyText)) wine += 2;
	if (input.pourLabelled) wine += 2;
	if (input.bin) wine += 1;
	// The name and a SHORT body only: a dish description naming a region it
	// borrowed a technique from is prose, not a label.
	let hits = wineHitsOn(input.name);
	if (bodyWords <= SPEC_MAX_WORDS) hits += wineHitsOn(bodyText);
	wine += Math.min(2, hits);
	if (nameIsWine(input.name)) wine += 2;

	/* Cocktail, from the line alone. */
	let cocktail = 0;
	if (drinkHits(input.name).some((h) => h.term === 'classic')) cocktail += 3;
	const specLines = input.body.filter((line) => isSpecList(line));
	if (specLines.some((line) => splitSpec(line).some((p) => bottleHits(p) > 0))) cocktail += 2;
	if (input.body.some((line) => /[|•·]/.test(line))) cocktail += 1;
	if (drinkHits(bodyText).some((h) => h.term === 'method')) cocktail += 1;
	if (specLines.length > 0 || (bodyWords <= SPEC_MAX_WORDS && !PROSE.test(bodyText))) {
		cocktail += Math.min(2, bottleHits(bodyText));
	}

	/* The line's own reading, before the heading has its say. */
	const line = { wine, cocktail };
	if (section === 'wine') wine += 3;
	if (section === 'cocktail') cocktail += 3;

	/* Dish: the heading is its only signal, because what remains is a dish. */
	const dish = section === 'food' ? 3 : 0;

	const scores = { wine, cocktail, dish };
	const ranked = (['wine', 'cocktail', 'dish'] as const).slice().sort((a, b) => scores[b] - scores[a]);
	const strong = (['wine', 'cocktail'] as const).filter((k) => line[k] >= STRONG).sort((a, b) => scores[b] - scores[a]);

	if (strong.length === 0) {
		if (section === 'wine') {
			why.push('Read as a wine from the heading alone.');
			return { kind: 'wine', could: [], why };
		}
		if (section === 'cocktail') {
			why.push('Read as a cocktail from the heading alone.');
			return { kind: 'cocktail', could: [], why };
		}
		if (section === 'spirits') {
			why.push('The heading says spirits or beer, which no room here keeps.');
			return { kind: 'unsure', could: [], why };
		}
		return { kind: 'dish', could: [], why };
	}

	const best = strong[0];
	const rest = Math.max(...(['wine', 'cocktail', 'dish'] as const).filter((k) => k !== best).map((k) => scores[k]));
	const leads = scores[best] - rest >= LEAD;
	const agrees = section === null || section === best;
	if (leads && agrees) return { kind: best, could: [], why };

	// What it could be: every kind with a real signal, and the kind the heading
	// names. A stray word scoring one is not a candidate; 'could' is a short
	// list a person picks from, not a ranking of everything the line touched.
	const could = ranked.filter((k) => scores[k] >= STRONG || section === k);
	if (section === 'food' && !could.includes('dish')) could.push('dish');
	if (!agrees) {
		why.push(
			`Could be a ${could.join(' or a ')}: the heading points one way and the line reads another.`
		);
	} else {
		why.push(`Could be a ${could.join(' or a ')}: the line does not say clearly enough which.`);
	}
	return { kind: 'unsure', could, why };
}
