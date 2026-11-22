/**
 * The fixed price menu in the Table (the Thanksgiving Day tab, 22 November
 * 2026) and the pairing sheet's words for a tasting's pour, through study.ts.
 *
 * The readers are proved on a small house grafted onto the fixture, so they
 * hold whatever the shipped pack carries: before the edition is cut (no such
 * menu), while it is served, and after the day, when the menu retires and its
 * dishes are filed as past. The last two blocks read the real pack and run
 * only while it holds the record they are about; OOT_TG_PACK names another
 * pack file to read in its place (a scratch build of the staged edition).
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import fixture from './house/fixtures/house-min.json';
import type { House, HouseDish, Tasting } from './house/house-schema';
import { DASH } from './house/house-lines';
import { parentOf } from './nav';
import {
	HOLIDAY_MEAL,
	SHEET_Q,
	STUDY_WORDS,
	fixedPriceMenu,
	isFixedPrice,
	say,
	sheetHere,
	sheetWords,
	studyRows,
	tastingOnlyIds,
	tastingPlaces,
	tastingSection,
	tastingsShown
} from './study';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SHIPPED = join(ROOT, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json');
const OTHER = process.env.OOT_TG_PACK ?? '';
const PACK: House = JSON.parse(readFileSync(OTHER && existsSync(OTHER) ? OTHER : SHIPPED, 'utf8')).house;
const MIN = fixture as unknown as House;

/** The fixture house with a fixed price menu for the holiday grafted on: two courses, a side, one dish the other menu serves too. */
function grafted(): House {
	const h: House = structuredClone(MIN);
	const model = h.dishes.find((d) => d.id === 'd-beetrt01')!;
	const dish = (id: string, name: string, section: string, price = ''): HouseDish => ({
		...structuredClone(model),
		id,
		name,
		section,
		meals: [HOLIDAY_MEAL],
		price,
		prices: price ? [{ meal: HOLIDAY_MEAL, printed: price }] : []
	});
	h.meals.push({ name: HOLIDAY_MEAL, days: 'One Thursday', hours: 'Ask at lineup' });
	h.dishes.find((d) => d.id === 'd-chicken1')!.meals.push(HOLIDAY_MEAL);
	h.dishes.push(
		dish('d-fixchow1', 'Harbour Chowder', HOLIDAY_MEAL),
		dish('d-fixtart1', 'Apple Tart', HOLIDAY_MEAL),
		dish('d-fixpudd1', 'Rice Pudding', HOLIDAY_MEAL),
		dish('d-fixside1', 'Buttered Greens', HOLIDAY_MEAL + ' sides', '6'),
		dish('d-fixgone1', 'Last Year’s Pie', 'Past ' + HOLIDAY_MEAL + ' 2025')
	);
	const menu: Tasting = {
		id: 't-fixed001',
		name: 'The Holiday Table',
		price: '60',
		meal: HOLIDAY_MEAL,
		includesDrinks: false,
		line: '2 Courses 60: choice of main and dessert',
		note: 'One day only. Allergy questions go to the kitchen.',
		courses: [
			{
				n: 1,
				label: 'Mains',
				choice: true,
				dishIds: ['d-chicken1', 'd-missing0', 'd-fixchow1'],
				printed: ['Ember Chicken: Leeks, Gravy', 'Nobody’s Dish: Nothing', 'Harbour Chowder: Clams, Cream'],
				pourId: '',
				pourText: ''
			},
			{
				n: 2,
				label: 'Desserts',
				choice: true,
				dishIds: ['d-fixtart1', 'd-fixgone1', 'd-fixpudd1'],
				printed: ['Apple Tart: Cream', 'Last Year’s Pie: Gone', 'Rice Pudding: Nutmeg [ add 2 ]'],
				pourId: '',
				pourText: ''
			}
		],
		ts: 1
	};
	h.tastings.push(menu);
	return h;
}

describe('a fixed price menu is known by its shape', () => {
	const h = grafted();
	const menu = h.tastings[1];

	it('every course a choice of two or more dishes, no course with a pour', () => {
		expect(isFixedPrice(menu)).toBe(true);
		expect(isFixedPrice(MIN.tastings[0])).toBe(false);
		expect(isFixedPrice({ courses: [] })).toBe(false);
		const poured = structuredClone(menu);
		poured.courses[1].pourId = 'w-lantern1';
		expect(isFixedPrice(poured)).toBe(false);
		const worded = structuredClone(menu);
		worded.courses[0].pourText = 'A glass of something';
		expect(isFixedPrice(worded)).toBe(false);
		const set = structuredClone(menu);
		set.courses[0].choice = false;
		expect(isFixedPrice(set)).toBe(false);
		const single = structuredClone(menu);
		single.courses[1].dishIds = ['d-fixtart1'];
		expect(isFixedPrice(single)).toBe(false);
	});

	it('is never one of the tasting menus: the block, its chip and its section read as before', () => {
		expect(tastingsShown(h).map((t) => t.name)).toEqual(tastingsShown(MIN).map((t) => t.name));
		expect(tastingsShown(h, HOLIDAY_MEAL)).toEqual([]);
		expect(tastingSection(h)).toBe(tastingSection(MIN));
		const only: House = { ...h, tastings: [menu] };
		expect(tastingsShown(only)).toEqual([]);
		expect(tastingSection(only)).toBe('');
	});

	it('leaves its course dishes rows of their own sections: the meal is one of the house’s own', () => {
		const hidden = tastingOnlyIds(h);
		for (const id of ['d-fixchow1', 'd-fixtart1', 'd-fixpudd1', 'd-fixside1', 'd-chicken1']) expect(hidden.has(id), id).toBe(false);
		expect(studyRows(h, 'dish').filter((r) => r.section === HOLIDAY_MEAL).map((r) => r.name)).toEqual(['Harbour Chowder', 'Apple Tart', 'Rice Pudding']);
	});
});

describe('the fixed price menu as its tab draws it', () => {
	const h = grafted();
	const menu = fixedPriceMenu(h, HOLIDAY_MEAL)!;

	it('is nothing on a house with no such menu, at another meal, and when the record is a tasting', () => {
		expect(fixedPriceMenu(MIN, HOLIDAY_MEAL)).toBeNull();
		expect(fixedPriceMenu(h, 'Dinner')).toBeNull();
		expect(fixedPriceMenu(h, '')).toBeNull();
		const poured = structuredClone(h);
		poured.tastings[1].courses[0].pourId = 'w-lantern1';
		expect(fixedPriceMenu(poured, HOLIDAY_MEAL)).toBeNull();
	});

	it('says the record’s own heading, price line, note, and when the meal is served', () => {
		expect([menu.id, menu.name, menu.price, menu.meal]).toEqual(['t-fixed001', 'The Holiday Table', '60', HOLIDAY_MEAL]);
		expect(menu.line).toBe('2 Courses 60: choice of main and dessert');
		expect(menu.note).toBe('One day only. Allergy questions go to the kitchen.');
		expect([menu.days, menu.hours]).toEqual(['One Thursday', 'Ask at lineup']);
	});

	it('draws the courses in printed order, each dish under the house’s name with the sheet’s own line', () => {
		expect(menu.courses.map((c) => [c.n, c.label])).toEqual([[1, 'Mains'], [2, 'Desserts']]);
		expect(menu.courses.map((c) => c.dishes.map((d) => [d.row.name, d.printed]))).toEqual([
			[['Lantern Roast Chicken', 'Ember Chicken: Leeks, Gravy'], ['Harbour Chowder', 'Harbour Chowder: Clams, Cream']],
			[['Apple Tart', 'Apple Tart: Cream'], ['Rice Pudding', 'Rice Pudding: Nutmeg [ add 2 ]']]
		]);
	});

	it('keeps each line with its dish when the house lacks one, and leaves a past dish out', () => {
		const names = menu.rows.map((r) => r.name);
		expect(names).not.toContain('Last Year’s Pie');
		expect(menu.courses[0].dishes[1].printed.startsWith('Harbour Chowder')).toBe(true);
		expect(menu.courses[1].dishes[1].printed.startsWith('Rice Pudding')).toBe(true);
	});

	it('gives a dish its kept first pick and none to a dish with no kept pairing', () => {
		const [chicken, chowder] = menu.courses[0].dishes;
		expect(chicken.pairs.length).toBeGreaterThan(0);
		expect(chicken.pairs[0][0]).toBe('First pick');
		expect(chicken.pairs[0][1]).toContain('Quay Lane Harbour White 2024');
		expect(chowder.pairs).toEqual([]);
	});

	it('draws the sides with their printed prices, after the courses and as no course', () => {
		expect(menu.sides.map((r) => [r.name, r.price])).toEqual([['Buttered Greens', '6']]);
		expect(menu.courses.flatMap((c) => c.dishes.map((d) => d.row.id))).not.toContain('d-fixside1');
	});

	it('walks a card through the menu in printed order, every row filed under its course', () => {
		expect(menu.rows.map((r) => [r.name, r.section])).toEqual([
			['Lantern Roast Chicken', 'Mains'],
			['Harbour Chowder', 'Mains'],
			['Apple Tart', 'Desserts'],
			['Rice Pudding', 'Desserts'],
			['Buttered Greens', STUDY_WORDS.fixedSides]
		]);
		expect(new Set(menu.rows.map((r) => r.id)).size).toBe(menu.rows.length);
	});

	it('counts the dishes the meal serves, the deck its door deals: the past one is not one', () => {
		expect(menu.served).toBe(5);
		expect(say('fixedFlash', { n: menu.served })).toBe('Flash the 5 dishes');
	});

	it('says on a card where the dish sits, by the meal and the one price, never as a tasting', () => {
		expect(tastingPlaces(h, 'd-fixchow1')).toEqual([`On the ${HOLIDAY_MEAL} menu, two courses for 60: Mains`]);
		expect(tastingPlaces(h, 'd-chicken1')).toEqual(['On the The Harbour Supper: The main', `On the ${HOLIDAY_MEAL} menu, two courses for 60: Mains`]);
		expect(tastingPlaces(h, 'd-fixside1')).toEqual([]);
	});

	it('goes back from a card to the tab, and from the tab to the Brennan’s page', () => {
		expect(parentOf({ path: '/menu', search: '?view=thanksgiving', hash: '#d-fixchow1' })).toBe('/menu?view=thanksgiving');
		expect(parentOf({ path: '/menu', search: '?view=thanksgiving' })).toBe('/menu');
	});

	it('writes its own words without a dash', () => {
		for (const key of ['onFixedPrice', 'fixedSides', 'fixedSidesNote', 'fixedIntro', 'fixedFlash', 'fixedQuiz', 'fixedSheet', 'fixedNote', 'sheetSays', 'sheetSaysOf'] as const) {
			expect(STUDY_WORDS[key].match(DASH), key).toBeNull();
		}
	});
});

describe('the pairing sheet’s words for a tasting’s pour', () => {
	const SUPPER = 'The Harbour Supper';
	const h = grafted();
	h.wines[0].kept = [
		...(h.wines[0].kept ?? []),
		{ q: SHEET_Q, a: `The pairing sheet of 1 May prints this for the first course of the ${SUPPER}: “Old words.”`, ts: 5 },
		{ q: SHEET_Q, a: `The pairing sheet of 9 May prints this for the first course of the ${SUPPER}: “Bright & saline, with a lush texture.”`, ts: 9 },
		{ q: SHEET_Q, a: 'The pairing sheet of 9 May prints this for the second course of the Other Supper: “Not this menu.”', ts: 12 }
	];

	it('files them under the builder’s own question', async () => {
		const engine = await import(/* @vite-ignore */ pathToFileURL(join(ROOT, 'tools', 'house', 'engine.mjs')).href);
		expect(SHEET_Q).toBe(engine.SHEET_Q);
	});

	it('reads the quoted words of the newest note that names the tasting, word for word', () => {
		expect(sheetWords(h, 'w-lantern1', SUPPER)).toBe('Bright & saline, with a lush texture.');
		expect(sheetWords(h, 'w-lantern1', 'Other Supper')).toBe('Not this menu.');
		expect(sheetWords(h, 'w-lantern1', 'A Third Supper')).toBe('');
		expect(sheetWords(h, 'w-lantern1', '')).toBe('');
		expect(sheetWords(h, 'w-nobody00', SUPPER)).toBe('');
		expect(sheetWords(MIN, 'w-lantern1', SUPPER)).toBe('');
	});

	it('shows them on a card opened from the tasting: the pour’s own, and a dish’s course pour by its printed name', () => {
		expect(sheetHere(h, SUPPER, 'w-lantern1')).toEqual([{ pour: '', words: 'Bright & saline, with a lush texture.' }]);
		expect(sheetHere(h, SUPPER, 'd-beetrt01')).toEqual([{ pour: 'A glass of the Harbour White', words: 'Bright & saline, with a lush texture.' }]);
		expect(sheetHere(h, SUPPER, 'd-chicken1')).toEqual([]);
		expect(sheetHere(h, 'Starters', 'd-beetrt01')).toEqual([]);
		expect(sheetHere(MIN, SUPPER, 'w-lantern1')).toEqual([]);
	});
});

/* ---- the real pack, while it holds the records ---------------------------- */

const real = fixedPriceMenu(PACK, HOLIDAY_MEAL);

describe.runIf(real)('the Thanksgiving Day menu of the pack, as the sheet of 22 November 2026 prints it', () => {
	const menu = real!;

	it('is three courses for one price, a choice in each, and four sides for the table', () => {
		expect(menu.price).toBe('$80');
		expect(menu.line).toContain('$80');
		expect(menu.courses.map((c) => [c.label, c.dishes.length])).toEqual([['Appetizers', 6], ['Entrées', 6], ['Desserts', 3]]);
		expect(menu.sides.map((r) => r.price)).toEqual(['$10', '$7', '$7', '$7']);
		expect(menu.rows).toHaveLength(19);
		expect(menu.served).toBe(19);
		expect(menu.days).toContain('26 November 2026');
	});

	it('prints a line for every course dish, the Foster’s with its tableside price, and pours with every one', () => {
		for (const c of menu.courses) {
			for (const d of c.dishes) {
				expect(d.printed.length, d.row.name).toBeGreaterThan(d.row.name.length);
				expect(d.pairs[0]?.[0], d.row.name).toBe('First pick');
			}
		}
		expect(menu.courses[2].dishes[0].printed).toContain('[ add $5 ]');
	});

	it('stays out of the tasting menus, and every one of its dishes is a row of the Menu list', () => {
		expect(tastingsShown(PACK).map((t) => t.name)).not.toContain(menu.name);
		expect(tastingsShown(PACK)).toHaveLength(2);
		const rows = new Set(studyRows(PACK, 'dish').map((r) => r.id));
		const hidden = tastingOnlyIds(PACK);
		for (const r of menu.rows) expect(rows.has(r.id) && !hidden.has(r.id), r.name).toBe(true);
	});

	it('is said on a course dish’s card by the meal and the price', () => {
		const first = menu.courses[1].dishes[0].row;
		expect(tastingPlaces(PACK, first.id)).toEqual(['On the Thanksgiving Day menu, three courses for $80: Entrées']);
	});
});

const dinner = tastingsShown(PACK).find((t) => t.courses.some((c) => c.pour?.item && sheetWords(PACK, c.pour.item.id, t.name)));
const sheeted = !!dinner;

describe.runIf(sheeted)('the dinner tasting’s pours with the pairing sheet’s words', () => {
	it('has the sheet’s line for every course’s pour, a whole sentence each', () => {
		for (const c of dinner!.courses) {
			expect(c.pour?.item, c.label).toBeTruthy();
			const words = sheetWords(PACK, c.pour!.item!.id, dinner!.name);
			expect(words, c.label).toMatch(/^[A-Z].+\.$/);
			expect(sheetHere(PACK, dinner!.name, c.dishes[0].id)).toEqual([{ pour: c.pour!.text, words }]);
		}
	});
});
