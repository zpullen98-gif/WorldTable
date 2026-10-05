/**
 * The two Brennan's tasting menus in the study view, read from the shipped
 * pack: each menu separate and in the exact order the house prints it (the
 * owner's paste of 5 October 2026, tools/house/brennans/pages/), the choice
 * of, the lines printed under each course, the words printed over each pour,
 * the breakfast's drinks-included line and the dinner's supplement, the meal
 * filter, the dishes only a tasting serves, the rows a card walks, where a
 * card says an item is served, and the Tasting courses flash cards.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import fixture from './house/fixtures/house-min.json';
import type { House } from './house/house-schema';
import { buildFlashcards } from './house/house-drills';
import { DASH } from './house/house-lines';
import {
	STUDY_WORDS,
	pourPhrase,
	studyRows,
	tastingOnlyIds,
	tastingHere,
	tastingPlaces,
	tastingRows,
	tastingSection,
	tastingsShown
} from './study';

const PACK: House = JSON.parse(readFileSync('static/shared/packs/brennans-new-orleans.v1.oothouse.json', 'utf8')).house;
const MIN = fixture as unknown as House;
const idOf = (name: string) => [...PACK.dishes, ...PACK.wines, ...PACK.cocktails].find((i) => i.name === name)!.id;

const BREAKFAST = 'Traditional Breakfast at Brennan’s';
const DINNER = 'Dinner Tasting Menu';

describe('the two tasting menus as printed', () => {
	const [breakfast, dinner] = tastingsShown(PACK);

	it('are two separate menus, breakfast then dinner, each with its price and its printed line', () => {
		expect(tastingsShown(PACK).map((t) => t.name)).toEqual([BREAKFAST, DINNER]);
		expect(breakfast.price).toBe('$80');
		expect(dinner.price).toBe('$80');
		expect(breakfast.line).toBe('Celebrating 80 Years in 2026! Price includes tasting portions of each course and all drinks listed.');
		expect(dinner.line).toBe('Celebrating 80 Years in 2026! Add Wine Pairing Supplement [4oz pours] $120');
		expect(breakfast.includesDrinks).toBe(true);
		expect(breakfast.supplement).toBe('');
		expect(dinner.includesDrinks).toBe(false);
		expect(dinner.supplement).toBe('Add Wine Pairing Supplement, 4 Ounce Wine Pours $120.00');
	});

	it('print the breakfast courses in their exact order: the eye opener, then five courses, the second a choice of', () => {
		expect(breakfast.courses.map((c) => c.label)).toEqual(['Eye Opener Cocktail', 'First Course', 'Second Course', 'Third Course', 'Fourth Course', 'Fifth Course']);
		expect(breakfast.courses.map((c) => c.dishes.map((d) => d.name))).toEqual([
			[],
			['Baked Apple'],
			['Turtle Soup', 'Seafood Gumbo'],
			['Eggs Hussarde'],
			['Petite Filet Mignon'],
			['World Famous Bananas Foster']
		]);
		expect(breakfast.courses.map((c) => c.choice)).toEqual([false, false, true, false, false, false]);
		/* The eye opener is the drink itself, with no words over it. */
		const eye = breakfast.courses[0];
		expect(eye.drinkCourse).toBe(true);
		expect(eye.pourLabel).toBe('');
		expect(eye.pour).toEqual({ text: 'Brandy Milk Punch', item: { id: idOf('Brandy Milk Punch'), name: 'Brandy Milk Punch', kind: 'cocktail' } });
		expect(eye.printed).toEqual(['Brandy, Heavy Cream, Vanilla Bean, Nutmeg']);
		/* The first course prints no pour; every course after it is Paired with. */
		expect(breakfast.courses[1].pour).toBeNull();
		expect(breakfast.courses.slice(2).map((c) => c.pourLabel)).toEqual(['Paired with', 'Paired with', 'Paired with', 'Paired with']);
		expect(breakfast.courses.slice(2).map((c) => c.pour!.text)).toEqual([
			'Bloody Bull Cocktail',
			'Charles Lafitte Brut Champagne FR NV [4oz]',
			'Domaine De Châteaumar ‘Cuvée Vincent’ Côtes Du Rhône FR 2023 [4oz]',
			'Brennan’s Private Blend Congregation Coffee & Chicory'
		]);
	});

	it('link the breakfast coffee course to the house chicory coffee, and every pour to a house item', () => {
		const coffee = breakfast.courses[5].pour!;
		expect(coffee.item).toEqual({ id: idOf('New Orleans-Style Coffee with Chicory'), name: 'New Orleans-Style Coffee with Chicory', kind: 'cocktail' });
		for (const t of [breakfast, dinner]) for (const c of t.courses) if (c.pour) expect(c.pour.item, `${t.name} ${c.label}`).not.toBeNull();
	});

	it('print the dinner courses in their exact order, each with its printed line and a Suggested Pairing', () => {
		expect(dinner.courses.map((c) => c.label)).toEqual(['First Course', 'Second Course', 'Third Course', 'Fourth Course', 'Fifth Course']);
		expect(dinner.courses.map((c) => c.dishes.map((d) => d.name))).toEqual([
			['Grand Isle Jewel Oysters'],
			['Louisiana BBQ Lobster'],
			['Redfish Véronique'],
			['Roasted Rohan Duck Breast'],
			['The Snickers']
		]);
		expect(dinner.courses.every((c) => c.pourLabel === 'Suggested Pairing' && !c.choice && !c.drinkCourse)).toBe(true);
		expect(dinner.courses.map((c) => c.pour!.item!.name)).toEqual([
			'Charles Lafitte Brut Champagne NV',
			'Fichet ‘Château London’ Mâcon-Igé 2024',
			'Louis Jadot Beaune 1er Cru 2023',
			'Paul Hobbs Coombsville Cabernet Sauvignon 2021',
			'Domaine La Tour Vieille Banyuls Reserva NV'
		]);
		expect(dinner.courses.map((c) => c.printed)).toEqual([
			['Served Raw, Preserved Fresno Chile Mignonette, Parsley'],
			['’nduja, White Bean Stew'],
			['Hibiscus-pickled Grapes, Braised Leeks, Fingerling Potatoes, Preserved Lemon Beurre Blanc'],
			['Cane Syrup-glazed Peaches, Candied Hazelnuts'],
			['Bavarian Milk Chocolate, Caramel Custard, Nougat Ice Cream, Roasted Peanuts']
		]);
	});

	it('write the printed slip correctly and carry no dash anywhere', () => {
		const text = JSON.stringify(tastingsShown(PACK));
		expect(text).not.toContain('ChampaPAgne');
		expect(text).toContain('Charles Lafitte Brut Champagne FR NV');
		expect(text).not.toMatch(DASH);
	});
});

describe('the meal filter, the section and the rows', () => {
	it('keeps the breakfast menu at breakfast and lunch, the dinner menu at dinner, both all day, neither at Bubbles', () => {
		expect(tastingsShown(PACK, 'Breakfast & lunch').map((t) => t.name)).toEqual([BREAKFAST]);
		expect(tastingsShown(PACK, 'Dinner').map((t) => t.name)).toEqual([DINNER]);
		expect(tastingsShown(PACK, '').map((t) => t.name)).toEqual([BREAKFAST, DINNER]);
		expect(tastingsShown(PACK, 'Bubbles at Brennan’s')).toEqual([]);
	});

	it('leaves the four dishes only a tasting serves to their course, under the house\'s own section name', () => {
		const only = tastingOnlyIds(PACK);
		expect(PACK.dishes.filter((d) => only.has(d.id)).map((d) => d.name).sort()).toEqual(['Baked Apple', 'Louisiana BBQ Lobster', 'Petite Filet Mignon', 'Roasted Rohan Duck Breast']);
		/* A dish a tasting serves that is also on the menu stays in the list. */
		expect(only.has(idOf('Eggs Hussarde'))).toBe(false);
		expect(tastingSection(PACK)).toBe('Tasting menus');
		expect(tastingSection({ ...PACK, tastings: [] })).toBe('');
	});

	it('walk a menu with Previous and Next in printed order, dishes and pours, every row filed under the menu', () => {
		const [breakfast, dinner] = tastingsShown(PACK);
		const rows = tastingRows(PACK, breakfast);
		expect(rows.map((r) => r.name)).toEqual([
			'Brandy Milk Punch', 'Baked Apple', 'Turtle Soup', 'Seafood Gumbo', 'Bloody Bull', 'Eggs Hussarde',
			'Charles Lafitte Brut Champagne NV', 'Petite Filet Mignon', 'Domaine de Châteaumar ‘Cuvée Vincent’ Côtes du Rhône 2023',
			'World Famous Bananas Foster', 'New Orleans-Style Coffee with Chicory'
		]);
		expect(new Set(rows.map((r) => r.section))).toEqual(new Set([BREAKFAST]));
		expect(rows.map((r) => r.kind)).toEqual(['cocktail', 'dish', 'dish', 'dish', 'cocktail', 'dish', 'wine', 'dish', 'wine', 'dish', 'cocktail']);
		expect(tastingRows(PACK, dinner)).toHaveLength(10);
		/* The list's own rows are unchanged: the dish's section, as before. */
		expect(studyRows(PACK, 'dish').find((r) => r.name === 'Eggs Hussarde')!.section).toBe('Entrées');
	});

	it('say on a card where the tastings serve an item, the course as printed and the pour under its words', () => {
		expect(tastingPlaces(PACK, idOf('Eggs Hussarde'))).toEqual([`On the ${BREAKFAST}: Third Course. Paired with Charles Lafitte Brut Champagne FR NV [4oz]`]);
		expect(tastingPlaces(PACK, idOf('Grand Isle Jewel Oysters'))).toEqual([`On the ${DINNER}: First Course. Suggested Pairing: Charles Lafitte Brut Champagne FR NV`]);
		expect(tastingPlaces(PACK, idOf('Baked Apple'))).toEqual([`On the ${BREAKFAST}: First Course`]);
		expect(tastingPlaces(PACK, idOf('Charles Lafitte Brut Champagne NV'))).toEqual([`Poured on the ${BREAKFAST}: Third Course`, `Poured on the ${DINNER}: First Course`]);
		expect(tastingPlaces(PACK, idOf('Brandy Milk Punch'))).toEqual([`Poured on the ${BREAKFAST}: Eye Opener Cocktail`]);
		expect(pourPhrase('Paired with', 'X')).toBe('Paired with X');
		expect(pourPhrase('Suggested Pairing', 'X')).toBe('Suggested Pairing: X');
		expect(pourPhrase('', 'X')).toBe('Paired with X');
	});

	it('give a card opened from a tasting that tasting\'s course and pour, never another menu\'s, and nothing for a list row', () => {
		const at = (section: string, name: string) => tastingHere(PACK, section, idOf(name));
		expect(at(BREAKFAST, 'Eggs Hussarde')).toEqual({
			id: PACK.tastings[0].id,
			name: BREAKFAST,
			price: '$80',
			lines: ['Third Course. Paired with Charles Lafitte Brut Champagne FR NV [4oz]'],
			terms: 'Every drink listed is included in the price.'
		});
		/* The first course prints no pour, and says so: the dish's list pour is not the tasting's. */
		expect(at(BREAKFAST, 'Baked Apple')!.lines).toEqual(['First Course. The menu prints no pairing for this course.']);
		expect(at(BREAKFAST, 'Turtle Soup')!.lines).toEqual(['Second Course, choice of Turtle Soup or Seafood Gumbo. Paired with Bloody Bull Cocktail']);
		expect(at(BREAKFAST, 'World Famous Bananas Foster')!.lines).toEqual(['Fifth Course. Paired with Brennan’s Private Blend Congregation Coffee & Chicory']);
		const oysters = at(DINNER, 'Grand Isle Jewel Oysters')!;
		expect(oysters.lines).toEqual(['First Course. Suggested Pairing: Charles Lafitte Brut Champagne FR NV']);
		expect(oysters.terms).toBe('Add Wine Pairing Supplement, 4 Ounce Wine Pours $120.00');
		/* A pour: the drink a course is, or the course and the dishes it is poured with, on this menu only. */
		expect(at(BREAKFAST, 'Brandy Milk Punch')!.lines).toEqual(['Eye Opener Cocktail']);
		expect(at(BREAKFAST, 'Bloody Bull')!.lines).toEqual(['Second Course, poured with Turtle Soup or Seafood Gumbo']);
		expect(at(BREAKFAST, 'Charles Lafitte Brut Champagne NV')!.lines).toEqual(['Third Course, poured with Eggs Hussarde']);
		expect(at(DINNER, 'Charles Lafitte Brut Champagne NV')!.lines).toEqual(['First Course, poured with Grand Isle Jewel Oysters']);
		/* A list row's section names no tasting; a tasting that does not name the item gives nothing. */
		expect(at('Entrées', 'Eggs Hussarde')).toBeNull();
		expect(at('Tasting menus', 'Baked Apple')).toBeNull();
		expect(at(DINNER, 'Eggs Hussarde')).toBeNull();
		expect(tastingHere(PACK, '', idOf('Eggs Hussarde'))).toBeNull();
	});

	it('read an older tasting with none of the printed fields: Paired with by default, nothing printed', () => {
		const [t] = tastingsShown(MIN);
		expect(t.line).toBe('');
		expect(t.supplement).toBe('');
		expect(t.courses.map((c) => [c.label, c.pourLabel, c.printed.length, c.choice])).toEqual([
			['To start', 'Paired with', 0, false],
			['The main', '', 0, false]
		]);
		expect(t.courses[0].pour).toEqual({ text: 'A glass of the Harbour White', item: { id: 'w-lantern1', name: 'Quay Lane Harbour White 2024', kind: 'wine' } });
	});
});

describe('the Tasting courses deck', () => {
	it('deals one card per course, breakfast then dinner, in printed order, fronts the short way', () => {
		const cards = buildFlashcards(PACK).filter((c) => c.kind === 'tasting');
		expect(cards.map((c) => c.front)).toEqual([
			'Traditional Breakfast: Eye Opener Cocktail',
			'Traditional Breakfast: First Course',
			'Traditional Breakfast: Second Course',
			'Traditional Breakfast: Third Course',
			'Traditional Breakfast: Fourth Course',
			'Traditional Breakfast: Fifth Course',
			'Dinner Tasting Menu: First Course',
			'Dinner Tasting Menu: Second Course',
			'Dinner Tasting Menu: Third Course',
			'Dinner Tasting Menu: Fourth Course',
			'Dinner Tasting Menu: Fifth Course'
		]);
		expect(cards.map((c) => c.course)).toEqual([1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5]);
		expect(cards[0].back).toBe('Brandy Milk Punch');
		expect(cards[1].back).toBe('Baked Apple');
		expect(cards[2].back).toBe('Choice of Turtle Soup or Seafood Gumbo. Paired with Bloody Bull Cocktail');
		expect(cards[3].back).toBe('Eggs Hussarde. Paired with Charles Lafitte Brut Champagne FR NV [4oz]');
		expect(cards[5].back).toBe('World Famous Bananas Foster. Paired with Brennan’s Private Blend Congregation Coffee & Chicory');
		expect(cards[8].back).toBe('Redfish Véronique. Suggested Pairing: Louis Jadot 1er Cru Beaune, Burgundy FR Pinot Noir 2023');
		for (const c of cards) {
			expect(c.front).not.toMatch(DASH);
			expect(c.back).not.toMatch(DASH);
		}
	});
});

describe('the words', () => {
	it('carry no dash, nothing at or above U+2190, and no American spelling', () => {
		const keys = ['tastings', 'choiceOf', 'pairedWith', 'drinksIn', 'flashCourses', 'tastingNotes', 'deckTastings', 'deckTasting', 'courseCount', 'onTasting', 'pouredOn', 'pouredWith', 'noPairing', 'pourCarte', 'inGlass', 'theWine', 'offerNext'] as const;
		for (const k of keys) {
			const w = STUDY_WORDS[k];
			expect(w, k).not.toMatch(DASH);
			expect([...w].every((ch) => ch.codePointAt(0)! < 0x2190), k).toBe(true);
			expect(w, k).not.toMatch(/\b\w+iz(e|ed|es|ing)\b|\bcolor|\bflavor|\bfavorite/i);
		}
	});
});
