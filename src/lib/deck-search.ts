/**
 * The Floor Deck, as the Lexicon's search sees it.
 *
 * The owner's decision is that the deck is the home of a floor term and the
 * Lexicon links to it both ways, so a server who types "king trumpet" into the
 * Lexicon must not be told the kitchen has never heard of it. The Lexicon's
 * own entry is filed under "King Oyster Mushroom"; the deck card carries the
 * alias, and this is where that alias gets found.
 *
 * Its OWN haystack, and deliberately a thin one: term, aliases, section title.
 * Not the card's prose, and not the level's name, which a hit SHOWS but a
 * search never reads ("chef" is inside "Sous Chef" and "Chef de Partie"). The Lexicon's `haystack()` is untouched, so every
 * count a regression pins ("brisket" shows six entries, "porterhouse" one)
 * stays what it was, and a hit here is a row of links, never a `.lexcard`.
 * Prose is left out because a deck hit is a DOOR ("this word has a card"),
 * and a search for "garlic" opening forty doors is a wall, not a result.
 *
 * It reads the small index, never the deck: the Lexicon's load data is inlined
 * into a 1.4 MB prerendered page and the index is the part that can afford it.
 *
 * Folded with the same fold() the Lexicon folds its query with, so an accent
 * typed or untyped finds the same card.
 */

import { fold } from './search-config.mjs';
import type { DeckIndex } from './types';

export interface DeckHit {
	id: string;
	term: string;
	/** "Commis": shown on the row, and never searched. Level names are
	 *  brigade words, so "chef" would otherwise open every Chef card. */
	levelName: string;
	sectionTitle: string;
	/** The alias that matched, when the term itself did not. */
	via?: string;
}

/** Rows shown. A section name can match twenty cards; the landing lists them all. */
export const DECK_HITS_MAX = 8;
/** One letter matches half the deck and says nothing. */
export const DECK_NEEDLE_MIN = 2;

type Row = DeckIndex['cards'][number];
interface Folded {
	term: string;
	aliases: string[];
	section: string;
}

const folded = new WeakMap<Row, Folded>();
function foldedRow(row: Row, index: DeckIndex): Folded {
	let f = folded.get(row);
	if (!f) {
		f = {
			term: fold(row.term),
			aliases: (row.aliases ?? []).map((a) => fold(a)),
			section: fold(index.sections[row.section] ?? '')
		};
		folded.set(row, f);
	}
	return f;
}

/**
 * The cards a query finds, best first, and how many more there were.
 *
 * Rank: the term starts with it, the term holds it, an alias holds it, the
 * section's title holds it. Within a rank the deck's own order stands, which
 * is teaching order, so a section-name search reads the way the section does.
 */
export function deckHits(index: DeckIndex | null | undefined, query: string, max = DECK_HITS_MAX): { hits: DeckHit[]; more: number } {
	const needle = fold(query ?? '').trim();
	if (!index || needle.length < DECK_NEEDLE_MIN) return { hits: [], more: 0 };

	const ranked: Array<{ rank: number; at: number; hit: DeckHit }> = [];
	index.cards.forEach((row, at) => {
		const f = foldedRow(row, index);
		const sectionTitle = index.sections[row.section] ?? '';
		const base = { id: row.id, term: row.term, levelName: index.levels?.[String(row.level)] ?? '', sectionTitle };
		if (f.term.startsWith(needle)) ranked.push({ rank: 0, at, hit: base });
		else if (f.term.includes(needle)) ranked.push({ rank: 1, at, hit: base });
		else {
			const alias = f.aliases.findIndex((a) => a.includes(needle));
			if (alias >= 0) ranked.push({ rank: 2, at, hit: { ...base, via: row.aliases![alias] } });
			else if (f.section.includes(needle)) ranked.push({ rank: 3, at, hit: base });
		}
	});
	ranked.sort((a, b) => a.rank - b.rank || a.at - b.at);
	return { hits: ranked.slice(0, max).map((r) => r.hit), more: Math.max(0, ranked.length - max) };
}

const rowsById = new WeakMap<DeckIndex, Map<string, Row>>();

/**
 * The cards that name a Lexicon entry as their long read, in deck order.
 * Called once per Lexicon card, 779 times a paint, so the id map is built once
 * per index and kept.
 */
export function cardsForLexicon(index: DeckIndex | null | undefined, slug: string): Array<{ id: string; term: string }> {
	if (!index) return [];
	const ids = index.byLexicon[slug];
	if (!ids?.length) return [];
	let byId = rowsById.get(index);
	if (!byId) {
		byId = new Map(index.cards.map((c) => [c.id, c]));
		rowsById.set(index, byId);
	}
	const rows = byId;
	return ids.flatMap((id) => {
		const c = rows.get(id);
		return c ? [{ id: c.id, term: c.term }] : [];
	});
}
