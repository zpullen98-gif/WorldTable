import { describe, expect, it } from 'vitest';
import { offersRoundLength, practiceMatches, shortPractice } from './practise-flow';

describe('manageable practice sessions', () => {
	const cards = Array.from({ length: 70 }, (_, i) => `h:d-${i}`);
	it('shortens a general collection without changing its order or source', () => {
		expect(shortPractice('menu', cards)).toEqual(cards.slice(0, 20));
		expect(cards).toHaveLength(70);
		expect(shortPractice('menu', cards, true)).toEqual(cards);
	});
	it('preserves due queues, misses and deliberate teaching sequences', () => {
		for (const id of ['due', 'misses', 'foundations:misses', 'foundations:today', 'fall:today', 'item:d-one', 'tastings', 'tasting:t-one', 'cz:all', 'deck:meats']) {
			expect(offersRoundLength(id)).toBe(false);
			expect(shortPractice(id, cards)).toEqual(cards);
		}
	});
	it('handles a short collection and broad component decks', () => {
		expect(shortPractice('components:ingredient', cards)).toHaveLength(20);
		expect(shortPractice('fall:food', cards.slice(0, 4))).toHaveLength(4);
	});
	it('finds a deck by accented name, group or unordered words', () => {
		expect(practiceMatches('entrees', 'Entrées', 'Brennan’s')).toBe(true);
		expect(practiceMatches('brennans soup', 'Soups', 'Brennan’s')).toBe(true);
		expect(practiceMatches('wine soup', 'Soups', 'Brennan’s')).toBe(false);
		expect(practiceMatches('   ', 'anything')).toBe(true);
	});
});
