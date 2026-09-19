import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { deckHits, cardsForLexicon, DECK_HITS_MAX } from './deck-search';
import type { DeckIndex } from './types';
import shipped from './data/floor-deck.index.json';

const index: DeckIndex = {
	sections: { mushrooms: 'Mushrooms & Truffles', cured: 'Cured & Preserved Meats' },
	levels: { '1': 'Commis', '2': 'Chef de Partie', '3': 'Sous Chef', '4': 'Chef' },
	cards: [
		{ id: 'fd_0001', term: 'King Oyster Mushroom', section: 'mushrooms', level: 2, aliases: ['King Trumpet', 'Eryngii'] },
		{ id: 'fd_0002', term: 'Oyster Mushroom', section: 'mushrooms', level: 1 },
		{ id: 'fd_0003', term: 'Jamón Ibérico', section: 'cured', level: 3, aliases: ['Pata Negra'] },
		{ id: 'fd_0004', term: "'Nduja", section: 'cured', level: 4 },
		{ id: 'fd_0005', term: 'Pâté', section: 'cured', level: 2 }
	],
	byLexicon: { 'king-oyster-mushroom': ['fd_0001'], 'oyster-mushrooms': ['fd_0002', 'fd_0001'], gone: ['fd_9999'] }
};

describe('deckHits', () => {
	it('finds a card by an alias and says which alias', () => {
		const { hits } = deckHits(index, 'king trumpet');
		expect(hits).toEqual([
			{ id: 'fd_0001', term: 'King Oyster Mushroom', levelName: 'Chef de Partie', sectionTitle: 'Mushrooms & Truffles', via: 'King Trumpet' }
		]);
	});

	it('does not claim an alias when the term itself matched', () => {
		const { hits } = deckHits(index, 'king');
		expect(hits[0].via).toBeUndefined();
	});

	it('ranks a term that starts with the query over one that merely holds it', () => {
		const { hits } = deckHits(index, 'oyster');
		expect(hits.map((h) => h.id)).toEqual(['fd_0002', 'fd_0001']);
	});

	it('finds an accented term typed without the accents, and with them', () => {
		expect(deckHits(index, 'jamon iberico').hits.map((h) => h.id)).toEqual(['fd_0003']);
		expect(deckHits(index, 'Jamón').hits.map((h) => h.id)).toEqual(['fd_0003']);
		expect(deckHits(index, 'pate').hits.map((h) => h.id)).toEqual(['fd_0005']);
	});

	it('finds a section by its title, in teaching order, after every term and alias', () => {
		const { hits } = deckHits(index, 'cured');
		expect(hits.map((h) => h.id)).toEqual(['fd_0003', 'fd_0004', 'fd_0005']);
	});

	/* The level's name is shown on the row and never searched: "chef" is in
	   three of the four names and would open nearly the whole deck. */
	it('never searches a level name', () => {
		expect(deckHits(index, 'chef').hits).toEqual([]);
		expect(deckHits(index, 'commis').hits).toEqual([]);
	});

	it('says nothing for one letter, an empty box, or no index', () => {
		expect(deckHits(index, 'k')).toEqual({ hits: [], more: 0 });
		expect(deckHits(index, '   ')).toEqual({ hits: [], more: 0 });
		expect(deckHits(null, 'king trumpet')).toEqual({ hits: [], more: 0 });
	});

	it('caps the rows and counts what it left out', () => {
		const many: DeckIndex = {
			sections: { cured: 'Cured & Preserved Meats' },
			levels: { '1': 'Commis' },
			cards: Array.from({ length: 20 }, (_, i) => ({ id: `fd_${String(i + 1).padStart(4, '0')}`, term: `Ham ${i}`, section: 'cured', level: 1 as const })),
			byLexicon: {}
		};
		const { hits, more } = deckHits(many, 'ham');
		expect(hits).toHaveLength(DECK_HITS_MAX);
		expect(more).toBe(20 - DECK_HITS_MAX);
	});

	it('never searches prose: the index it reads has none to search', () => {
		for (const row of (shipped as unknown as DeckIndex).cards) {
			expect(Object.keys(row).sort().filter((k) => !['aliases', 'id', 'level', 'section', 'term'].includes(k))).toEqual([]);
		}
	});
});

describe('cardsForLexicon', () => {
	it('lists the cards that point at an entry, in the order the index gives', () => {
		expect(cardsForLexicon(index, 'oyster-mushrooms')).toEqual([
			{ id: 'fd_0002', term: 'Oyster Mushroom' },
			{ id: 'fd_0001', term: 'King Oyster Mushroom' }
		]);
	});

	it('is empty for an entry no card names, for a dangling id, and for no index', () => {
		expect(cardsForLexicon(index, 'maillard')).toEqual([]);
		expect(cardsForLexicon(index, 'gone')).toEqual([]);
		expect(cardsForLexicon(undefined, 'oyster-mushrooms')).toEqual([]);
	});
});

describe('the shipped index', () => {
	const live = shipped as unknown as DeckIndex;

	it('names every section a card sits in, and every level', () => {
		for (const c of live.cards) expect(live.sections[c.section], `${c.id} sits in an unnamed section`).toBeTruthy();
		for (const c of live.cards) expect(live.levels[String(c.level)], `${c.id} sits at an unnamed level`).toBeTruthy();
	});

	it('every Lexicon link lands on a card that exists', () => {
		const ids = new Set(live.cards.map((c) => c.id));
		for (const [slug, list] of Object.entries(live.byLexicon)) {
			for (const id of list) expect(ids.has(id), `${slug} -> ${id}`).toBe(true);
		}
	});
});

describe('the Lexicon page keeps the deck out of its own search', () => {
	const page = readFileSync('src/routes/lexicon/+page.svelte', 'utf8');
	const load = readFileSync('src/routes/lexicon/+page.ts', 'utf8');

	it('loads the index and never the deck', () => {
		expect(load).toMatch(/loadDeckIndex\(/);
		expect(load).not.toMatch(/loadFloorDeck\(|loadDeckTraps\(/);
		expect(page).not.toMatch(/loadFloorDeck\(|loadDeckTraps\(/);
	});

	it('puts a deck link in its own paragraph, never among the dish crosslinks', () => {
		expect(page).toMatch(/class="deckref"/);
		// the crosslink paragraph closes before the deck paragraph opens
		const xrefs = page.indexOf('class="xrefs"');
		const deckref = page.indexOf('class="deckref"');
		expect(xrefs).toBeGreaterThan(-1);
		expect(page.indexOf('</p>', xrefs)).toBeLessThan(deckref);
	});
});
