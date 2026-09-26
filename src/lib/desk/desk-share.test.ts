import { describe, it, expect } from 'vitest';
import {
	countsLine,
	deskCounts,
	figureIndex,
	handList,
	priceInRaw,
	readInName,
	roomName,
	sharedOrigin,
	siblingHref,
	whenRead
} from './desk-share';

/**
 * The desk's copy and its doors, pinned as plain functions so the review
 * table's sentences cannot drift from the plan's and the hand-off cannot
 * think a standalone build shares an origin with anyone.
 */

describe('the shared origin', () => {
	it('is the /table wing and nothing else', () => {
		expect(sharedOrigin('/table')).toBe(true);
		expect(sharedOrigin('')).toBe(false);
		expect(sharedOrigin('/WorldTable')).toBe(false);
	});

	it('links next door on the shared origin and to the live suite elsewhere', () => {
		expect(siblingHref('wine', '/table')).toBe('/codex/');
		expect(siblingHref('cocktail', '/table')).toBe('/ledger/');
		expect(siblingHref('wine', '')).toBe('https://zpullen98-gif.github.io/codex/');
		expect(siblingHref('cocktail', '')).toBe('https://zpullen98-gif.github.io/ledger/');
	});

	it('names the rooms and the apps the way the copy does', () => {
		expect(roomName('wine')).toBe('the Codex');
		expect(roomName('cocktail')).toBe('the Ledger');
		expect(readInName('table')).toBe('on the World Table');
		expect(readInName('codex')).toBe('in the Codex');
		expect(readInName('ledger')).toBe('in the Ledger');
	});
});

describe('when a read happened', () => {
	const now = new Date(2026, 8, 25, 16, 30);

	it('says today, yesterday, or the date, with the local time', () => {
		expect(whenRead(new Date(2026, 8, 25, 14, 2).toISOString(), now)).toBe('today at 14:02');
		expect(whenRead(new Date(2026, 8, 24, 9, 5).toISOString(), now)).toBe('yesterday at 09:05');
		expect(whenRead(new Date(2026, 8, 3, 20, 40).toISOString(), now)).toBe('on 3 September at 20:40');
	});

	it('says nothing for a stamp it cannot read', () => {
		expect(whenRead('not a date', now)).toBe('');
	});
});

describe('the counts line', () => {
	it("reads the plan's sentence when every room has something", () => {
		const items = [
			...Array.from({ length: 31 }, () => ({ kind: 'dish' as const })),
			...Array.from({ length: 9 }, () => ({ kind: 'wine' as const })),
			...Array.from({ length: 4 }, () => ({ kind: 'cocktail' as const })),
			{ kind: 'unsure' as const }
		];
		const unsorted = [
			{ raw: 'a', line: 1, reason: 'noise' },
			{ raw: 'b', line: 2, reason: 'noise' }
		];
		expect(countsLine(deskCounts(items, unsorted))).toBe(
			'Read 47 lines: 31 dishes for the kitchen, 9 wines for the cellar, 4 cocktails for the bar, 3 I could not place.'
		);
	});

	it('leaves out a room with nothing for it and keeps its singulars', () => {
		expect(countsLine(deskCounts([{ kind: 'dish' }]))).toBe('Read 1 line: 1 dish for the kitchen.');
		expect(countsLine(deskCounts([{ kind: 'wine' }, { kind: 'cocktail' }]))).toBe(
			'Read 2 lines: 1 wine for the cellar, 1 cocktail for the bar.'
		);
		expect(countsLine(deskCounts([]))).toBe('Read 0 lines.');
	});

	it('lists what goes to the other rooms', () => {
		expect(handList(9, 4)).toBe('9 wines and 4 cocktails');
		expect(handList(1, 0)).toBe('1 wine');
		expect(handList(0, 1)).toBe('1 cocktail');
		expect(handList(0, 0)).toBe('');
	});
});

describe('the price guard', () => {
	it('accepts a price that is in the lines, whitespace folded, and an empty price', () => {
		expect(priceInRaw('15.50', 'Shrimp & Tasso Henican\n15.50\nWild Louisiana white shrimp')).toBe(true);
		expect(priceInRaw('45.00 / 22.50', 'Ployez-Jacquemart\n45.00  /  22.50\n5 oz / 2.5 oz')).toBe(true);
		expect(priceInRaw('', 'Kiss the Crab')).toBe(true);
	});

	it('refuses a price the lines never printed', () => {
		expect(priceInRaw('15', 'Shrimp & Tasso Henican\n15.50')).toBe(true);
		expect(priceInRaw('16', 'Shrimp & Tasso Henican\n15.50')).toBe(false);
		expect(priceInRaw('9.50', 'Soup of the day 9.S')).toBe(false);
	});

	it("accepts a price whose every part is on the line as a figure of its own: the second door, for her wines", () => {
		const parts = [
			{ amount: '8', label: 'Glass' },
			{ amount: '30', label: 'Bottle' }
		];
		expect(priceInRaw('8 / 30', 'House red\nGlass 8 Bottle 30', parts)).toBe(true);
		// 30 is on the line; 8 is only inside 2018, which is not the same figure.
		expect(priceInRaw('8 / 30', 'Rioja 2018\nBottle 30', parts)).toBe(false);
		expect(priceInRaw('8 / 30', 'House red\nGlass 8', parts)).toBe(false);
		// No parts, no second door: the whole string or nothing.
		expect(priceInRaw('8 / 30', 'House red\nGlass 8 Bottle 30')).toBe(false);
		expect(priceInRaw('8 / 30', 'House red\nGlass 8 Bottle 30', [])).toBe(false);
	});

	it('figureIndex: a figure of its own, never a run of digits inside another', () => {
		expect(figureIndex('Glass 8 Bottle 30', '8')).toBe(6);
		expect(figureIndex('Rioja 2018 Glass 8', '8')).toBe(17);
		expect(figureIndex('Soup 9.50', '50')).toBe(-1);
		expect(figureIndex('Bread 12.50', '12')).toBe(-1);
		// A comma after a word binds nothing.
		expect(figureIndex('Bread,12', '12')).toBe(6);
		expect(figureIndex('Glass 8 Bottle 8', '8', 7)).toBe(15);
		expect(figureIndex('anything', '')).toBe(-1);
	});
});
