import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import fixture from './house/fixtures/house-min.json';
import type { House, HouseDish, HouseItem, Note } from './house/house-schema';
import {
	ABOUT_Q,
	ASK_Q,
	SELL_Q,
	STUDY_WORDS,
	WATCH_Q,
	fold,
	inMeal,
	itemCards,
	latestVerdicts,
	linesShown,
	mealsOf,
	nameIn,
	notesFor,
	partsShown,
	priceLine,
	readOnWords,
	say,
	searchElsewhere,
	searchRows,
	shortLine,
	studyProgress,
	studyRows,
	studySections
} from './study';
import { DASH } from './house/house-lines';

const PACK: House = JSON.parse(readFileSync('static/shared/packs/brennans-new-orleans.v1.oothouse.json', 'utf8')).house;
const MIN = fixture as unknown as House;
const byName = (h: House, name: string): HouseItem =>
	[...h.dishes, ...h.wines, ...h.cocktails].find((i) => i.name === name) as HouseItem;

describe('the words', () => {
	it('carry no dash and nothing at or above U+2190', () => {
		for (const [k, v] of Object.entries(STUDY_WORDS)) {
			expect(v, k).not.toMatch(DASH);
			expect(v, k).not.toMatch(/[\u2013\u2014]/);
			expect([...v].every((c) => c.codePointAt(0)! < 0x2190), k).toBe(true);
		}
	});
	it('fills placeholders and leaves an unknown one as written', () => {
		expect(say('position', { i: 3, n: 14, section: 'Entrées' })).toBe('3 of 14 in Entrées');
		expect(say('weak', {})).toBe('My weak ones ({n})');
		expect(STUDY_WORDS.eyebrow).toBe('Your words. Allergens: confirm at lineup.');
		expect(STUDY_WORDS.fortyFive).toBe('Forty-five seconds');
	});
});

describe('fold and nameIn', () => {
	it('folds accents, the letters NFD keeps, curly quotes and the ampersand', () => {
		expect(fold('Mâcon-Igé')).toBe(' macon ige ');
		expect(fold('Véronique')).toBe(' veronique ');
		expect(fold('Brennan’s')).toBe(' brennan s ');
		expect(fold('Shrimp & Grits')).toBe(' shrimp and grits ');
		expect(fold('Smørrebrød')).toBe(' smorrebrod ');
		expect(fold('')).toBe(' ');
	});
	it('matches whole words and the plain plurals, and refuses three letters', () => {
		const hay = fold('Poached eggs, two oysters and a rum');
		expect(nameIn(hay, 'Oyster')).toBeGreaterThan(0);
		expect(nameIn(hay, 'Poached')).toBe(0);
		expect(nameIn(hay, 'rum')).toBe(-1);
		expect(nameIn(hay, 'Oyst')).toBe(-1);
	});
});

describe('the rows on the Brennan’s pack', () => {
	const rows = studyRows(PACK, 'dish');
	it('keeps the menu’s order and its sections, opening on the tasting menus', () => {
		expect(rows).toHaveLength(PACK.dishes.length);
		const secs = studySections(rows);
		expect(secs[0]).toEqual({ section: 'Tasting menus', count: 4 });
		expect(secs.slice(1, 7)).toEqual([
			{ section: 'Starters', count: 8 },
			{ section: 'Soups', count: 2 },
			{ section: 'Salads', count: 1 },
			{ section: 'Entrées', count: 14 },
			{ section: 'Sides', count: 12 },
			{ section: 'Desserts', count: 6 }
		]);
	});
	it('takes a leading copy of the name off the short line', () => {
		expect(rows.find((r) => r.name === 'Eggs Hussarde')!.line).toBe(
			'Poached eggs, coffee-cured Canadian bacon and our own English muffins, with hollandaise and marchand de vin.'
		);
		expect(shortLine(byName(PACK, 'Classic Sazerac'))).toBe('Sazerac rye, Peychaud’s bitters and a Herbsaint rinse. New Orleans’ own cocktail.');
	});
	it('takes a wine’s paraphrase of its own name off, and keeps a line that does not open on it', () => {
		expect(shortLine(byName(PACK, 'C.H. Berres ‘Old Vines’ Riesling 2022'))).toBe('Light, racy and off-dry, our glass for anything spicy.');
		const champagne = byName(PACK, 'Brennan’s Essential by Piper-Heidsieck Extra Brut NV');
		expect(shortLine(champagne)).toBe((champagne.lines!.value as { s10: string }).s10);
	});
	it('prints a price once when every meal prints it the same, and never the words by the glass', () => {
		expect(priceLine(byName(PACK, 'Classic Sazerac'), PACK)).toBe('$13');
		expect(priceLine(byName(PACK, 'Eggs Hussarde'), PACK)).toBe('$27');
		expect(priceLine(byName(PACK, 'C.H. Berres ‘Old Vines’ Riesling 2022'), PACK)).toBe('$14 glass');
		expect(priceLine(byName(PACK, 'Dr. Hermann ‘Erdener Prälat’ Riesling Auslese 2014 (375 ml)'), PACK)).toBe('$80 half-bottle');
		for (const w of PACK.wines) expect(priceLine(w, PACK)).not.toMatch(/by the glass/i);
		expect(priceLine(byName(PACK, 'Charles Lafitte Brut Champagne NV'), PACK)).toMatch(/^Poured on the .+, 4 oz$/);
	});
	it('prints each meal when the meals differ, and nothing for no price', () => {
		const d = { ...byName(PACK, 'Eggs Hussarde'), prices: [{ meal: 'Breakfast & lunch', printed: '$27' }, { meal: 'Dinner', printed: '$30' }] } as HouseItem;
		expect(priceLine(d, PACK)).toBe('Breakfast & lunch $27 · Dinner $30');
		expect(priceLine({ ...d, prices: [], price: '' } as HouseItem, PACK)).toBe('');
	});
	it('searches every word, and the other kinds for what is not a dish', () => {
		expect(searchRows(PACK, rows, 'huss').map((r) => r.name)).toEqual(['Eggs Hussarde']);
		expect(searchRows(PACK, rows, 'creole caesar').map((r) => r.name)).toEqual(['Creole Caesar']);
		const wines = studyRows(PACK, 'wine');
		const pinot = searchRows(PACK, wines, 'pinot').map((r) => r.name);
		expect(pinot.length).toBeGreaterThan(0);
		for (const n of pinot) expect(PACK.wines.find((w) => w.name === n)!.grapes.join(' ')).toMatch(/Pinot/);
		expect(searchElsewhere(PACK, 'dish', 'sazerac').map((x) => x.name)).toEqual(['Classic Sazerac', 'Thompson’s Dream', 'Origin Story']);
		expect(searchElsewhere(PACK, 'cocktail', 'hussarde').map((x) => x.name)).toEqual(['Eggs Hussarde']);
		expect(searchElsewhere(PACK, 'dish', '')).toEqual([]);
	});
	it('narrows to a meal and keeps an item nobody tagged', () => {
		const hussarde = byName(PACK, 'Eggs Hussarde');
		expect(mealsOf(PACK)).toContain('Breakfast & lunch');
		expect(inMeal(hussarde, 'Breakfast & lunch')).toBe(true);
		expect(inMeal(hussarde, 'Dinner')).toBe(false);
		expect(inMeal({ ...hussarde, meals: [] }, 'Dinner')).toBe(true);
		expect(inMeal(hussarde, '')).toBe(true);
	});
});

describe('notes, lines and parts', () => {
	const note = (q: string, a: string, ts: number): Note => ({ q, a, ts });
	it('picks the newest answer to each fixed question and keeps the older as earlier answers', () => {
		const d = {
			...byName(PACK, 'Eggs Hussarde'),
			kept: [note(SELL_Q, 'old sell', 1), note(SELL_Q, 'new sell', 3), note(ABOUT_Q, 'about', 2), note(WATCH_Q, 'watch', 2), note('Something else?', 'free', 5)]
		} as HouseItem;
		const n = notesFor(d);
		expect(n.about?.a).toBe('about');
		expect(n.coaching.map((c) => [c.q, c.note.a])).toEqual([
			[SELL_Q, 'new sell'],
			[WATCH_Q, 'watch']
		]);
		expect(n.coaching.some((c) => c.q === ASK_Q)).toBe(false);
		expect(n.earlier.map((x) => x.a)).toEqual(['old sell']);
		expect(n.more.map((x) => x.a)).toEqual(['free']);
	});
	it('hides a guest line that says what the twenty second line says', () => {
		const d = byName(PACK, 'Eggs Hussarde');
		expect(linesShown(d).guestShown).toBe(false);
		expect(linesShown({ ...d, guest: { value: 'Something new.', by: 'person', ts: 1 } } as HouseItem).guestShown).toBe(true);
	});
	it('drops a wine part its profile already holds', () => {
		const berres = byName(PACK, 'C.H. Berres ‘Old Vines’ Riesling 2022') as HouseItem & { profile: { value: string } };
		const parts = berres.parts!.value as unknown as Record<string, string>;
		const copied = { ...berres, parts: { ...berres.parts!, value: { ...parts, sauce: berres.profile.value.split(':')[0] } } } as HouseItem;
		expect(partsShown(copied).map(([l]) => l)).not.toContain('the profile');
		expect(partsShown(berres).map(([l]) => l)).toContain('the profile');
		expect(partsShown(byName(PACK, 'Eggs Hussarde'))).toHaveLength(5);
	});
});

describe('the cards and the progress', () => {
	it('deals kept marks only: a dish with her lines unkept deals no card', () => {
		const chicken = MIN.dishes.find((d) => d.id === 'd-chicken1') as HouseDish;
		const hers = { ...MIN, dishes: [{ ...chicken, lines: { ...chicken.lines!, by: 'maitre' as const }, parts: chicken.parts ? { ...chicken.parts, by: 'maitre' as const } : undefined }] } as House;
		expect(itemCards(hers, 'dish', { all: true })).toEqual([]);
		expect(itemCards(MIN, 'dish', { all: true }).map((c) => c.itemId)).toContain('d-chicken1');
	});
	it('scopes a deck to a section or to items, with the pairing on the back', () => {
		const entrees = itemCards(PACK, 'dish', { section: 'Entrées' });
		expect(entrees.length).toBeGreaterThan(0);
		for (const c of entrees) expect(c.section).toBe('Entrées');
		const [h] = itemCards(PACK, 'dish', { itemIds: ['d-1q0xk7jv'] });
		expect(h.back.say).toBe('Hussarde: hoo-SARD.');
		expect(h.back.price).toBe('$27');
		expect(h.back.pairs).toEqual([
			['First pick', 'Brennan’s Essential by Piper-Heidsieck Extra Brut NV, $28 glass'],
			['Without alcohol', 'Catalina Island']
		]);
	});
	it('counts the latest verdict per item and keeps the menu order for the weak ones', () => {
		const latest = latestVerdicts('h-1', [
			{ k: 'house:h-1:d-b:card-item', v: 'missed', at: 1 },
			{ k: 'house:h-1:d-a:card-item', v: 'missed', at: 2 },
			{ k: 'house:h-1:d-b:say-s10', v: 'met', at: 3 },
			{ k: 'house:h-2:d-c:card-item', v: 'missed', at: 4 },
			{ k: 'house:h-1:d-c:card-item', v: 'close', at: 5 }
		]);
		expect([...latest]).toEqual(
			expect.arrayContaining([
				['d-a', 'again'],
				['d-b', 'got'],
				['d-c', 'got']
			])
		);
		const p = studyProgress(['d-c', 'd-a', 'd-b', 'd-x'], latest);
		expect(p).toEqual({ total: 4, studied: 3, got: 2, again: 1, againIds: ['d-a'] });
	});
	it('says the menu’s date in British order', () => {
		expect(readOnWords('2026-09-26')).toBe('26 September 2026');
		expect(readOnWords('')).toBe('');
		expect(readOnWords('not a date')).toBe('not a date');
	});
});
