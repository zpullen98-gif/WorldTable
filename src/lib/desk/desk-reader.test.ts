import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { readMenu, reReadAs, priceParts, TRUNCATION_NOTICE } from './desk-reader';
import { deskSource, type DeskFile, type DeskItem, type DeskWine, type DeskCocktail, type DeskDish, type DeskUnsure } from './desk-file';

/**
 * The reader, pinned on the menus that broke the old parser: Commander's
 * Palace prints every price on its own line under the name, its tasting menu
 * has no prices at all, its notes arrive wrapped in tildes, and its wine list
 * stacks two prices, two pours, a vintage and a descriptor line under each
 * bottle. The fixtures are asserted WHOLE, row by row, because a reader fails
 * by drifting (a heading quietly becoming a dish, a price quietly attaching to
 * the wrong neighbour) and a whole-menu assertion is the only kind that
 * notices.
 *
 * Nothing here reads allergens, and the last block proves no row has a field
 * for one.
 */

const fixture = (name: string) =>
	readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

const NOW = new Date('2026-09-25T14:02:00.000Z');

/** A fixed random source, so ids are stable across runs and the file can be compared whole. */
function seeded(): () => number {
	let s = 12345;
	return () => {
		s = (s * 1103515245 + 12345) & 0x7fffffff;
		return s / 0x80000000;
	};
}

function read(text: string, venue?: string): DeskFile {
	return readMenu(text, deskSource('paste', 'table', text, { now: NOW }), { now: NOW, rand: seeded(), venue });
}

/** The columns a whole-menu assertion reads. */
const row = (i: DeskItem) => ({
	kind: i.kind,
	section: i.section,
	name: i.name,
	price: i.price.printed,
	confidence: i.confidence
});

const wineOf = (file: DeskFile, name: string): DeskWine => {
	const i = file.items.find((x) => x.name === name);
	if (!i || i.kind !== 'wine') throw new Error(`${name} is not a wine row: ${i?.kind}`);
	return i;
};
const cocktailOf = (file: DeskFile, name: string): DeskCocktail => {
	const i = file.items.find((x) => x.name === name);
	if (!i || i.kind !== 'cocktail') throw new Error(`${name} is not a cocktail row: ${i?.kind}`);
	return i;
};
const dishOf = (file: DeskFile, name: string): DeskDish => {
	const i = file.items.find((x) => x.name === name);
	if (!i || i.kind !== 'dish') throw new Error(`${name} is not a dish row: ${i?.kind}`);
	return i;
};
const unsureOf = (file: DeskFile, name: string): DeskUnsure => {
	const i = file.items.find((x) => x.name === name);
	if (!i || i.kind !== 'unsure') throw new Error(`${name} is not an unsure row: ${i?.kind}`);
	return i;
};

/** Every key at every depth, so an allergen field cannot hide inside a row. */
function keysDeep(v: unknown, out: string[] = []): string[] {
	if (Array.isArray(v)) v.forEach((x) => keysDeep(x, out));
	else if (v && typeof v === 'object') {
		for (const [k, x] of Object.entries(v)) {
			out.push(k);
			keysDeep(x, out);
		}
	}
	return out;
}

/* ------------------------------------------------------------------------- */

describe("Commander's Palace, the dinner menu", () => {
	const TASTING = 'Chef Meg’s Playground Tasting Menu';
	const file = read(fixture('commanders-dinner.txt'));

	it('reads every row, under the heading as printed, with the price as printed', () => {
		expect(file.items.map(row)).toEqual([
			{ kind: 'dish', section: TASTING, name: TASTING, price: '$90 per Person + Optional Wine Pairing ($40)', confidence: 'low' },
			{ kind: 'dish', section: TASTING, name: 'Mirliton & Summer Squash Velouté', price: '', confidence: 'low' },
			{ kind: 'dish', section: TASTING, name: 'Chesapeake Bay Scallop Crudo', price: '', confidence: 'low' },
			{ kind: 'unsure', section: TASTING, name: 'Kiss the Crab', price: '', confidence: 'low' },
			{ kind: 'dish', section: TASTING, name: 'Chargrilled Shrimp Pinchos', price: '', confidence: 'low' },
			{ kind: 'dish', section: TASTING, name: 'Blue Crab Stuffed Blue Crab', price: '', confidence: 'low' },
			{ kind: 'dish', section: TASTING, name: 'Lime in the Coconut', price: '', confidence: 'low' },
			{ kind: 'dish', section: 'STARTERS', name: 'Shrimp & Tasso Henican', price: '15.50', confidence: 'high' },
			{ kind: 'dish', section: 'STARTERS', name: 'Hickory Smoked Cauliflower', price: '14', confidence: 'high' },
			{ kind: 'dish', section: 'STARTERS', name: 'Marseilles to Morocco', price: '17', confidence: 'high' },
			{ kind: 'dish', section: 'SOUPS & SALADS', name: 'Turtle Soup au Sherry', price: '12', confidence: 'high' },
			{ kind: 'dish', section: 'SOUPS & SALADS', name: 'Soup du Jour', price: '11', confidence: 'high' },
			{ kind: 'dish', section: 'SOUPS & SALADS', name: 'Commander’s Creole Gumbo', price: '12', confidence: 'high' },
			{ kind: 'dish', section: 'SOUPS & SALADS', name: 'Soups 1-1-1', price: '13', confidence: 'high' },
			{ kind: 'dish', section: 'SOUPS & SALADS', name: 'Commander’s Crisp Romaine Salad', price: '12', confidence: 'high' },
			{ kind: 'dish', section: 'SOUPS & SALADS', name: 'Sweet & Spicy Summer Salad', price: '13', confidence: 'high' },
			{ kind: 'dish', section: 'ENTRÉES', name: 'Coca-Cola Glazed ‘Carnitas’ Pork Cheeks', price: '33', confidence: 'high' },
			{ kind: 'dish', section: 'ENTRÉES', name: 'Double Cut Duroc Pork Chop', price: '45', confidence: 'high' },
			{ kind: 'dish', section: 'ENTRÉES', name: 'Hand Pounded Sassafras Crusted Gulf Fish', price: '41', confidence: 'high' },
			{ kind: 'dish', section: 'ENTRÉES', name: 'Pecan Crusted Gulf Fish', price: '43', confidence: 'high' },
			{ kind: 'dish', section: 'ENTRÉES', name: 'Wild White Shrimp & Collard Greens', price: '35', confidence: 'high' },
			{ kind: 'dish', section: 'ENTRÉES', name: 'Chargrilled Black Angus Filet', price: '56', confidence: 'high' },
			{ kind: 'dish', section: 'SIDES', name: 'Garlic Wilted Spinach', price: '9', confidence: 'high' },
			{ kind: 'dish', section: 'SIDES', name: 'Tangy Bacon & Apple Cider Braised Cabbage', price: '9', confidence: 'high' },
			{ kind: 'dish', section: 'SIDES', name: 'Charred Chili Smoky Pork Boudin', price: '9', confidence: 'high' },
			{ kind: 'dish', section: 'SIDES', name: 'Sauté of Sweet Corn, Grilled Kale, Asparagus & Leeks', price: '10', confidence: 'high' },
			{ kind: 'dish', section: 'SIDES', name: 'Prosecco Poached Louisiana Jumbo Lump Crab', price: '19', confidence: 'high' },
			{ kind: 'dish', section: 'CHEF MEG"S THREE COURSE OFFERINGS', name: 'Café Pierre Painted Texas Quail', price: '54', confidence: 'high' },
			{ kind: 'dish', section: 'CHEF MEG"S THREE COURSE OFFERINGS', name: 'Collard Green Spanakopita', price: '48', confidence: 'high' },
			{ kind: 'dish', section: 'CHEF MEG"S THREE COURSE OFFERINGS', name: 'Wild White Shrimp & Collard Greens', price: '54', confidence: 'high' },
			{ kind: 'dish', section: 'DESSERTS', name: 'Creole Bread Pudding Soufflé', price: '11', confidence: 'high' },
			{ kind: 'dish', section: 'DESSERTS', name: 'Housemade Ice Cream', price: '10', confidence: 'high' },
			{ kind: 'dish', section: 'DESSERTS', name: 'Southern Style Pecan Pie à la Mode', price: '10', confidence: 'high' },
			{ kind: 'dish', section: 'DESSERTS', name: 'Creole Cream Cheese Cheesecake', price: '10', confidence: 'high' },
			{ kind: 'dish', section: 'DESSERTS', name: 'Piety & Desire Chocolate Dessert du Jour', price: '12', confidence: 'high' }
		]);
	});

	it('carries the price on every dish that had a number under it, and never a number on one that did not', () => {
		// The failure that started all this: a price alone on a line has no
		// letters, the old parser threw it away as junk, and every dish on this
		// page came back priceless.
		const priced = file.items.filter((i) => i.section !== TASTING);
		expect(priced.length).toBe(28);
		for (const i of priced) expect(i.price.printed).toMatch(/^\d+(?:\.\d+)?$/);
		for (const i of file.items.filter((i) => i.section === TASTING && i.name !== TASTING)) {
			expect(i.price).toEqual({ printed: '', parts: [] });
		}
	});

	it('names no row after a chunk of description', () => {
		// Every description on this menu begins with a capital letter and runs
		// past sixty characters, and each one stayed on its dish.
		for (const i of file.items) {
			expect(i.name.length).toBeLessThanOrEqual(60);
			expect(i.name).not.toMatch(/^(?:Chilled soup|Thinly sliced|Gulf shrimp|Wild Louisiana|Charred cold|Housemade harissa|Housemade Creole|The authentic|Varied cooking|Slow cooked|A demitasse|Hearts of|Citrus cured|Chargrilled 14|Curole|Prosecco poached|Cast iron|Creole spiced|Broken Arrow|Crispy baked|Vanilla|Seasonal)/);
		}
		expect(dishOf(file, 'Shrimp & Tasso Henican').description).toMatch(/^Wild Louisiana white shrimp stuffed with housemade tasso ham/);
		expect(dishOf(file, 'Marseilles to Morocco').description).toMatch(/basil crusted Bellegarde baguette$/);
	});

	it('reads the framed note over Kiss the Crab as its lead-in, and joins the star note to the soufflé above it', () => {
		// '~le Coup du Milieu~' sits directly over 'Kiss the Crab' with no blank
		// between them. It is not title case (its first word is not
		// capitalised), so it is a note and not a heading, and it is the page
		// labelling the mid-meal drink UNDER it: le coup du milieu is that
		// drink. It used to join the crudo above, which named the wrong course.
		const crudo = dishOf(file, 'Chesapeake Bay Scallop Crudo');
		expect(crudo.description).toMatch(/black sesame sunflower crunch$/);
		expect(crudo.raw).not.toContain('Coup du Milieu');
		expect(crudo.lines).toEqual([6, 7]);
		const crab = unsureOf(file, 'Kiss the Crab');
		expect(crab.raw).toBe(
			'~le Coup du Milieu~\nKiss the Crab\nBlue crab-brown butter washed Zacapa No. 23 Solera, banana oleosacrum, dry vermouth, orange peel'
		);
		expect(crab.lines).toEqual([9, 11]);
		expect(crab.why).toContain('The framed note above the name was read as a lead-in to its description.');
		// The lead-in opens the description, decoration off, joined with a
		// space the way the reader joins every line.
		expect((reReadAs(crab, 'dish') as DeskDish).description).toBe(
			'le Coup du Milieu Blue crab-brown butter washed Zacapa No. 23 Solera, banana oleosacrum, dry vermouth, orange peel'
		);
		// '* Must be ordered 20 minutes in advance' sits two blank lines under
		// the soufflé and directly over 'Housemade Ice Cream', and it is the
		// famous note on the famous pudding: a star-led footnote points back at
		// the item above it and is never a lead-in for the name under it.
		const souffle = dishOf(file, 'Creole Bread Pudding Soufflé');
		expect(souffle.description).toBe(
			'"The Queen of Creole Desserts" ~Finished tableside with warm whiskey cream * Must be ordered 20 minutes in advance'
		);
		expect(souffle.raw).toBe(
			'Creole Bread Pudding Soufflé\n11\n"The Queen of Creole Desserts" ~Finished tableside with warm whiskey cream\n* Must be ordered 20 minutes in advance'
		);
		expect(souffle.lines).toEqual([111, 116]);
		expect(souffle.why).toContain('A note under the item joined it.');
		const iceCream = dishOf(file, 'Housemade Ice Cream');
		expect(iceCream.description).toBe('A daily selection of old-fashioned ice cream served in a Pecan Florentine tuile');
		expect(iceCream.lines).toEqual([117, 119]);
	});

	it('leaves the tasting items priceless and low, and never invents a price for them', () => {
		for (const name of ['Mirliton & Summer Squash Velouté', 'Chesapeake Bay Scallop Crudo', 'Chargrilled Shrimp Pinchos', 'Blue Crab Stuffed Blue Crab', 'Lime in the Coconut']) {
			const dish = dishOf(file, name);
			expect(dish.price.printed).toBe('');
			expect(dish.confidence).toBe('low');
			expect(dish.why).toContain('No price on these lines.');
		}
	});

	it('makes the priced tasting heading both the section and one low row, named as printed', () => {
		const rows = file.items.filter((i) => i.name === TASTING);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			kind: 'dish',
			section: TASTING,
			confidence: 'low',
			price: {
				printed: '$90 per Person + Optional Wine Pairing ($40)',
				parts: [
					{ amount: '$90', label: 'per Person' },
					{ amount: '$40', label: 'Optional Wine Pairing' }
				]
			},
			lines: [0, 2]
		});
		expect(rows[0].why).toContain('The heading carries a price, so it is also listed as a row to review.');
		for (const i of file.items.slice(1, 7)) expect(i.section).toBe(TASTING);
	});

	it('returns the sections as printed, capitals and all', () => {
		expect([...new Set(file.items.map((i) => i.section))]).toEqual([
			TASTING,
			'STARTERS',
			'SOUPS & SALADS',
			'ENTRÉES',
			'SIDES',
			'CHEF MEG"S THREE COURSE OFFERINGS',
			'DESSERTS'
		]);
	});

	it('will not guess at Kiss the Crab: a drink under a food heading is unsure, both kinds offered', () => {
		const crab = unsureOf(file, 'Kiss the Crab');
		expect([...crab.could].sort()).toEqual(['cocktail', 'dish']);
		expect(crab.confidence).toBe('low');
		expect(crab.raw).toBe(
			'~le Coup du Milieu~\nKiss the Crab\nBlue crab-brown butter washed Zacapa No. 23 Solera, banana oleosacrum, dry vermouth, orange peel'
		);
		expect(crab.why.join(' ')).toMatch(/Could be a (?:dish or a cocktail|cocktail or a dish)/);
	});

	it('keeps the source lines and their positions on every row', () => {
		const shrimp = dishOf(file, 'Shrimp & Tasso Henican');
		expect(shrimp.raw).toBe(
			'Shrimp & Tasso Henican\n15.50\nWild Louisiana white shrimp stuffed with housemade tasso ham, pickled okra, sweet red onions, five pepper jelly and Crystal hot sauce beurre blanc'
		);
		expect(shrimp.lines).toEqual([23, 25]);
		expect(shrimp.why).toContain('Price read from the line under the name.');
		for (const i of file.items) {
			expect(i.lines[0]).toBeLessThanOrEqual(i.lines[1]);
			for (const p of i.price.parts) expect(i.price.printed).toContain(p.amount);
		}
	});

	it('sets aside the one line it could not place, and says why', () => {
		expect(file.unsorted).toEqual([
			{ raw: 'Price of Entrée includes Soup or Salad and Dessert', line: 97, reason: 'heading-note' }
		]);
	});

	it('strips the zero-width joiners the page carries without changing what it reads', () => {
		const text = fixture('commanders-dinner.txt');
		expect(text).toContain('\u200D');
		for (const i of file.items) expect(i.raw).not.toMatch(/[\u200B-\u200D\u2060\uFEFF]/);
		expect(read(text.replace(/\u200D/g, '')).items.map(row)).toEqual(file.items.map(row));
	});

	it('repairs nothing: the page\'s eaten spaces and odd spellings stay', () => {
		expect(dishOf(file, 'Coca-Cola Glazed ‘Carnitas’ Pork Cheeks').description).toContain('glazeover');
		expect(dishOf(file, 'Hand Pounded Sassafras Crusted Gulf Fish').description).toContain('withlemon');
		expect(dishOf(file, 'Hand Pounded Sassafras Crusted Gulf Fish').description).toContain('Curole');
	});

	it('names no ingredient from a sentence: ingredientsNamed is only ever a printed list', () => {
		for (const i of file.items) if (i.kind === 'dish') expect(i.ingredientsNamed).toEqual([]);
	});
});

describe("Commander's Palace, the drinks", () => {
	const file = read(fixture('commanders-drinks.txt'));

	it('sorts four cocktails to the bar and six wines to the cellar', () => {
		expect(file.items.map(row)).toEqual([
			{ kind: 'cocktail', section: 'FEATURED COCKTAILS', name: 'Holy Trinity', price: '15', confidence: 'high' },
			{ kind: 'cocktail', section: 'FEATURED COCKTAILS', name: 'Fuzzy Buffalo', price: '12', confidence: 'high' },
			{ kind: 'cocktail', section: 'FEATURED COCKTAILS', name: 'Tequila Mockingbird #2', price: '14', confidence: 'high' },
			{ kind: 'cocktail', section: 'FEATURED COCKTAILS', name: 'Gold Rush', price: '17', confidence: 'high' },
			{ kind: 'wine', section: 'WINE BY GLASS', name: 'Ployez-Jacquemart', price: '45.00 / 22.50', confidence: 'high' },
			{ kind: 'wine', section: 'WINE BY GLASS', name: 'Petit-Freylon', price: '16.00 / 8.00', confidence: 'low' },
			{ kind: 'wine', section: 'WINE BY GLASS', name: "Commander's Palace", price: '10.50 / 5.25', confidence: 'high' },
			{ kind: 'wine', section: 'WINE BY GLASS', name: 'Studio by Miraval', price: '11.50 / 5.75', confidence: 'high' },
			{ kind: 'wine', section: 'WINE BY GLASS', name: 'Mouton Noir', price: '15.00 / 7.50', confidence: 'low' },
			{ kind: 'wine', section: 'WINE BY GLASS', name: 'Royal Tokaji', price: '23.00 / 11.50', confidence: 'low' }
		]);
		expect(file.unsorted).toEqual([]);
	});

	it('reads Holy Trinity as a cocktail with its spec as printed and gin as the base', () => {
		expect(cocktailOf(file, 'Holy Trinity')).toMatchObject({
			kind: 'cocktail',
			spec: ['trinity infused gin', 'benedictine', 'lime'],
			baseSpirit: 'gin',
			description: '',
			price: { printed: '15', parts: [{ amount: '15', label: '' }] },
			marks: [],
			raw: 'Holy Trinity\n15\ntrinity infused gin | benedictine | lime',
			lines: [1, 3]
		});
		expect(cocktailOf(file, 'Tequila Mockingbird #2').spec).toEqual(['reposado tequila', 'limoncello', 'lemon', 'bitters']);
		expect(cocktailOf(file, 'Tequila Mockingbird #2').baseSpirit).toBe('tequila');
		expect(cocktailOf(file, 'Fuzzy Buffalo').baseSpirit).toBe('bourbon');
	});

	it('puts no measure on a spec part the menu did not print', () => {
		for (const i of file.items) if (i.kind === 'cocktail') for (const p of i.spec) expect(p).not.toMatch(/\d\s?(?:oz|ml|cl)\b/i);
	});

	it('reads Ployez-Jacquemart as a wine with two pours and no bottle', () => {
		expect(wineOf(file, 'Ployez-Jacquemart')).toMatchObject({
			kind: 'wine',
			vintage: '2010',
			style: 'Extra-Brut',
			region: 'Champagne',
			country: 'France',
			grapes: [],
			pours: [
				{ price: '45.00', size: '5 oz' },
				{ price: '22.50', size: '2.5 oz' }
			],
			bottle: '',
			bin: '',
			descriptors: 'Extra-Brut, Champagne, France',
			price: {
				printed: '45.00 / 22.50',
				parts: [
					{ amount: '45.00', label: '' },
					{ amount: '22.50', label: '' }
				]
			},
			raw: 'Ployez-Jacquemart\n45.00 / 22.50\n5 oz / 2.5 oz\n2010\nExtra-Brut, Champagne, France',
			lines: [19, 23]
		});
		const why = wineOf(file, 'Ployez-Jacquemart').why.join(' ');
		expect(why).toContain('Vintage read from its own line.');
		expect(why).toMatch(/2 pours read from the sizes printed under the price/);
	});

	it('leaves the producer empty when the name line had no vocabulary hit, and says the Codex may fill it', () => {
		const wine = wineOf(file, 'Ployez-Jacquemart');
		expect(wine.producer).toBe('');
		expect(wine.wine).toBe('Ployez-Jacquemart');
		expect(wine.why).toContain('No producer read from the name line; the Codex may fill it from its corpus.');
	});

	it('reads the sorter\'s section from both headings of a run', () => {
		// 'OUR WINE PROGRAM' then 'WINE BY GLASS' with nothing between them.
		for (const i of file.items.slice(4)) expect(i.section).toBe('WINE BY GLASS');
	});

	it('keeps an unread descriptor as printed and marks the row low', () => {
		const petit = wineOf(file, 'Petit-Freylon');
		expect(petit.grapes).toEqual(['Sauvignon Blanc']);
		expect(petit.region).toBe('Bordeaux');
		expect(petit.descriptors).toBe('Sauvignon Blanc | Cuvée Marguerite, Bordeaux, France');
		expect(petit.confidence).toBe('low');
		expect(petit.why).toContain('Not read, kept as printed: "Cuvée Marguerite".');
		expect(wineOf(file, 'Mouton Noir')).toMatchObject({ grapes: ['Pinot Noir'], region: 'Willamette Valley, Oregon', vintage: '2019', confidence: 'low' });
		// 'Red Label' carries a style word and is the wine's name: no half reading.
		expect(wineOf(file, 'Royal Tokaji')).toMatchObject({ style: '', country: 'Hungary', vintage: '2016', confidence: 'low' });
		expect(wineOf(file, "Commander's Palace")).toMatchObject({ grapes: ['Chardonnay'], vintage: '2020', confidence: 'high' });
		expect(wineOf(file, 'Studio by Miraval')).toMatchObject({ region: 'Méditerranée', country: 'France', style: 'Rosé', confidence: 'high' });
	});
});

describe('the Codex cellar list, off a PDF', () => {
	const file = read(fixture('codex-pdf-list.txt'));

	it('reads eight bins as wines, priced by the bottle, under the region headings', () => {
		expect(file.items.map((i) => ({ ...row(i), bin: (i as DeskWine).bin }))).toEqual([
			{ kind: 'wine', section: 'CHAMPAGNE', name: 'Ployez-Jacquemart Extra Brut', price: '1250', confidence: 'high', bin: '101' },
			{ kind: 'wine', section: 'CHAMPAGNE', name: 'Krug Grande Cuvée 171ème Édition', price: '4200', confidence: 'high', bin: '102' },
			{ kind: 'wine', section: 'BURGUNDY WHITE', name: 'Domaine Leflaive Puligny-Montrachet 1er Cru Les Pucelles 2019', price: '3800', confidence: 'low', bin: '201' },
			{ kind: 'wine', section: 'BURGUNDY WHITE', name: 'Leflaive Bourgogne Blanc 2021', price: '1100', confidence: 'high', bin: '202' },
			{ kind: 'wine', section: 'BORDEAUX', name: 'Ch. Margaux 2015', price: '9500', confidence: 'high', bin: '301' },
			{ kind: 'wine', section: 'BORDEAUX', name: 'Ch. Lynch-Bages 2016', price: '2900', confidence: 'high', bin: '302' },
			{ kind: 'wine', section: 'AUSTRALIA', name: 'Penfolds Bin 389 Shiraz 2018', price: '1600', confidence: 'high', bin: '401' },
			{ kind: 'wine', section: 'AUSTRALIA', name: 'Penfolds Grange 2017', price: '9800', confidence: 'high', bin: '402' }
		]);
		expect(file.unsorted).toEqual([]);
		for (const i of file.items) expect((i as DeskWine).bottle).toBe(i.price.printed);
	});

	it('reads a four-figure price as a price and a four-figure year as a vintage', () => {
		expect(wineOf(file, 'Ch. Margaux 2015')).toMatchObject({ vintage: '2015', bottle: '9500', pours: [] });
		expect(wineOf(file, 'Ployez-Jacquemart Extra Brut')).toMatchObject({ vintage: 'NV', bottle: '1250' });
		expect(wineOf(file, 'Krug Grande Cuvée 171ème Édition').vintage).toBe('NV');
	});

	it('splits producer from wine at the first vocabulary hit, estate words staying with the producer', () => {
		expect(wineOf(file, 'Domaine Leflaive Puligny-Montrachet 1er Cru Les Pucelles 2019')).toMatchObject({
			producer: 'Domaine Leflaive',
			wine: 'Puligny-Montrachet 1er Cru Les Pucelles',
			vintage: '2019',
			grapes: ['Chardonnay'],
			region: 'Burgundy',
			country: 'France'
		});
		expect(wineOf(file, 'Leflaive Bourgogne Blanc 2021')).toMatchObject({ producer: 'Leflaive', wine: 'Bourgogne Blanc' });
		expect(wineOf(file, 'Penfolds Bin 389 Shiraz 2018')).toMatchObject({
			producer: 'Penfolds',
			wine: 'Bin 389 Shiraz',
			grapes: ['Cabernet Sauvignon', 'Shiraz'],
			region: 'South Australia'
		});
		// The hit IS the estate's name: the whole line is the producer.
		expect(wineOf(file, 'Ch. Margaux 2015')).toMatchObject({ producer: 'Ch. Margaux', wine: '', region: 'Margaux, Bordeaux' });
		expect(wineOf(file, 'Ch. Lynch-Bages 2016')).toMatchObject({ producer: 'Ch. Lynch-Bages', wine: '' });
		// No hit and no estate word: the whole line is the wine, the producer empty.
		expect(wineOf(file, 'Penfolds Grange 2017')).toMatchObject({ producer: '', wine: 'Penfolds Grange' });
		expect(wineOf(file, 'Krug Grande Cuvée 171ème Édition')).toMatchObject({ producer: 'Krug', wine: 'Grande Cuvée 171ème Édition' });
	});

	it('keeps Bin 389 whole in the name: a named number is never a price', () => {
		expect(wineOf(file, 'Penfolds Bin 389 Shiraz 2018').name).toBe('Penfolds Bin 389 Shiraz 2018');
		expect(wineOf(file, 'Penfolds Bin 389 Shiraz 2018').price.printed).toBe('1600');
	});

	it('marks a name past sixty characters low and says why', () => {
		const long = wineOf(file, 'Domaine Leflaive Puligny-Montrachet 1er Cru Les Pucelles 2019');
		expect(long.why).toContain('The name is long enough to be a whole sentence read as one.');
	});
});

describe('the desk file every read produces', () => {
	const file = read(fixture('commanders-dinner.txt'), 'Commander’s Palace');

	it('is a desk file with the source, the venue and stable ids', () => {
		expect(file).toMatchObject({
			format: 'oot-menu-desk',
			version: 1,
			createdAt: NOW.toISOString(),
			venue: 'Commander’s Palace',
			source: { kind: 'paste', readIn: 'table', reader: 'desk-reader/1', at: NOW.toISOString() }
		});
		expect(file.source.hash).toMatch(/^[0-9a-f]{8}$/);
		const ids = file.items.map((i) => i.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const id of ids) expect(id).toMatch(/^k-[0-9a-z]{8}$/);
		expect(read(fixture('commanders-dinner.txt')).items.map((i) => i.id)).toEqual(ids);
	});

	it('has no allergen field on any row, at any depth, and never will', () => {
		const keys = keysDeep(file);
		for (const k of keys) expect(k.toLowerCase()).not.toMatch(/allerg/);
		for (const i of file.items) {
			expect('allergens' in i).toBe(false);
			expect('allergensCheckedAt' in i).toBe(false);
		}
	});

	it('leaves the venue out when nobody said', () => {
		expect('venue' in read('Olives 4')).toBe(false);
	});
});

/* ------------------------------------------------------------------------- */

const one = (text: string): DeskItem => {
	const file = read(text);
	expect(file.items).toHaveLength(1);
	return file.items[0];
};

describe('price lines and pour lines, tested before the junk rule', () => {
	it('reads a price alone on a line as the price of the name above it', () => {
		for (const price of ['12', '15.50', '£14', '$9', '45.00 / 22.50', '6/9', 'Glass 8 Bottle 30', 'MP', 'market price']) {
			expect(one(`Soup of the day\n${price}`)).toMatchObject({ name: 'Soup of the day', price: { printed: price } });
		}
	});

	it('reads the per-person form with its bracketed second figure', () => {
		expect(priceParts('$90 per Person + Optional Wine Pairing ($40)')).toEqual([
			{ amount: '$90', label: 'per Person' },
			{ amount: '$40', label: 'Optional Wine Pairing' }
		]);
		expect(priceParts('Glass 8 Bottle 30')).toEqual([
			{ amount: '8', label: 'Glass' },
			{ amount: '30', label: 'Bottle' }
		]);
		expect(priceParts('6/9')).toEqual([
			{ amount: '6', label: '' },
			{ amount: '9', label: '' }
		]);
		expect(priceParts('£ 12')).toEqual([{ amount: '£ 12', label: '' }]);
		expect(priceParts('14 GBP')).toEqual([{ amount: '14 GBP', label: '' }]);
		expect(priceParts('MP')).toEqual([{ amount: 'MP', label: '' }]);
		expect(priceParts('')).toEqual([]);
	});

	it('sends a price with no name above it to unsorted as an orphan, never into a row', () => {
		const file = read('9.50');
		expect(file.items).toEqual([]);
		expect(file.unsorted).toEqual([{ raw: '9.50', line: 0, reason: 'orphan-price' }]);
		// A bare 2 at the foot of a photographed menu is an orphan price now, not
		// a page number: it stays visible in the unplaced list.
		expect(read('Chips 4\n\n2').unsorted).toEqual([{ raw: '2', line: 2, reason: 'orphan-price' }]);
		expect(read('Page 2').unsorted).toEqual([{ raw: 'Page 2', line: 0, reason: 'noise' }]);
	});

	it('attaches a price that begins a block to the first name under it', () => {
		expect(one('12\nSoup of the day')).toMatchObject({ name: 'Soup of the day', price: { printed: '12' }, raw: '12\nSoup of the day', lines: [0, 1] });
	});

	it('reads two price lines under one name together, inventing nothing', () => {
		expect(one('Albariño\nGlass 8\nBottle 30')).toMatchObject({ price: { printed: 'Glass 8 Bottle 30' } });
	});

	it('reads a pour line under a price line and pairs the sizes in order', () => {
		const wine = one('WINES BY THE GLASS\nSancerre\n14 / 48\n175ml / 750ml\n2022');
		expect(wine.kind).toBe('wine');
		expect((wine as DeskWine).pours).toEqual([
			{ price: '14', size: '175ml' },
			{ price: '48', size: '750ml' }
		]);
	});

	it('is not fooled by a telephone number that looks like three prices', () => {
		expect(read('020 7946 0958').items).toEqual([]);
		expect(read('020 7946 0958').unsorted[0].reason).toBe('noise');
	});
});

describe('the layout vote, and the gap rule', () => {
	it('keeps a brand number in the name in a stacked block, and reads it as a price in an inline one', () => {
		expect(one('French 75\n14')).toMatchObject({ name: 'French 75', price: { printed: '14' } });
		expect(one('Rum Runner 151\n13')).toMatchObject({ name: 'Rum Runner 151', price: { printed: '13' } });
		expect(one('Half chicken 14')).toMatchObject({ name: 'Half chicken', price: { printed: '14' } });
		// The same name with a gap before the number is priced in either layout.
		expect(one('Half chicken    14\nwith chips')).toMatchObject({ name: 'Half chicken', price: { printed: '14' } });
	});

	it('protects the named numbers in either layout', () => {
		expect(one('French 75 12')).toMatchObject({ name: 'French 75', price: { printed: '12' } });
		expect(one('Penfolds Bin 389 1600')).toMatchObject({ name: 'Penfolds Bin 389', price: { printed: '1600' } });
		expect(one('Zacapa No. 23 14')).toMatchObject({ name: 'Zacapa No. 23', price: { printed: '14' } });
	});

	it('reads the list index off the front of a cellar line into bin, and only after a gap', () => {
		expect(one('CELLAR\n101  Ployez-Jacquemart\n1250')).toMatchObject({ kind: 'wine', name: 'Ployez-Jacquemart', bin: '101' });
		expect(one('CELLAR\n101\tPloyez-Jacquemart\n1250')).toMatchObject({ kind: 'wine', name: 'Ployez-Jacquemart', bin: '101' });
		expect(one('12 Oysters 18')).toMatchObject({ name: '12 Oysters', price: { printed: '18' } });
	});

	it('leaves a price at the start of a single line in the name', () => {
		expect(one('12.50 Soup of the day')).toMatchObject({ name: '12.50 Soup of the day', price: { printed: '' } });
	});
});

describe('headings, notes and the caps decision', () => {
	it('reads capitals with section vocabulary as a heading, whatever follows', () => {
		expect(read('STARTERS\nShrimp & Tasso\n15').items[0]).toMatchObject({ section: 'STARTERS', name: 'Shrimp & Tasso' });
		expect(read('SIDES\nChips 4').items[0].section).toBe('SIDES');
	});

	it('reads capitals followed by a price line or a description as a dish name', () => {
		expect(one('CRISPY SQUID\n9.50')).toMatchObject({ name: 'CRISPY SQUID', price: { printed: '9.50' }, section: '' });
		expect(one('KISS THE CRAB\nblue crab washed rum with dry vermouth and orange peel')).toMatchObject({ name: 'KISS THE CRAB', section: '' });
		expect(read('STARTERS\nCRISPY SQUID\n9.50\nSALT COD\n8').items.map(row)).toEqual([
			{ kind: 'dish', section: 'STARTERS', name: 'CRISPY SQUID', price: '9.50', confidence: 'high' },
			{ kind: 'dish', section: 'STARTERS', name: 'SALT COD', price: '8', confidence: 'high' }
		]);
	});

	it('reads capitals followed by a blank, more capitals, a name or the end as a heading', () => {
		expect(read('CHAMPAGNE\nPloyez-Jacquemart\n1250').items[0].section).toBe('CHAMPAGNE');
		expect(read('OUR WINE PROGRAM\nWINE BY GLASS\nSancerre\n14').items[0].section).toBe('WINE BY GLASS');
		expect(read('BBQ AND SMOKE\n\nRibs 14').items[0].section).toBe('BBQ AND SMOKE');
		expect(read('THE END').items).toEqual([]);
	});

	it('reads a framed line as a heading only when its core is title case or capitals', () => {
		expect(read('~ Mains ~\nRibs 14').items[0].section).toBe('Mains');
		expect(read('*** SIDES ***\nChips 4').items[0].section).toBe('SIDES');
		// '~le Coup du Milieu~' starts with a small word, so it is a note, and
		// it never becomes a row of its own or a section.
		const file = read('Scallop Crudo\nthinly sliced scallops\n\n~le Coup du Milieu~\nKiss the Crab\nrum, vermouth');
		expect(file.items.map((i) => i.name)).toEqual(['Scallop Crudo', 'Kiss the Crab']);
		expect(file.items.map((i) => i.section)).toEqual(['', '']);
		expect(file.unsorted).toEqual([]);
	});

	it('reads a framed note directly over a name line as the lead-in of that row, and one before a blank line as a note on the row above', () => {
		// Over the name, no blank between: the note labels the item under it,
		// leads its description with the frame off, and its raw and lines
		// cover the note line. The row above is untouched.
		const below = read('STARTERS\nScallop Crudo\n12\nthinly sliced scallops\n\n~le Coup du Milieu~\nCrab Toast\n14\nblue crab on brioche');
		expect(below.items.map((i) => i.name)).toEqual(['Scallop Crudo', 'Crab Toast']);
		expect(below.items[0]).toMatchObject({ description: 'thinly sliced scallops', raw: 'Scallop Crudo\n12\nthinly sliced scallops', lines: [1, 3] });
		expect(below.items[1]).toMatchObject({
			kind: 'dish',
			description: 'le Coup du Milieu blue crab on brioche',
			price: { printed: '14' },
			raw: '~le Coup du Milieu~\nCrab Toast\n14\nblue crab on brioche',
			lines: [5, 8],
			confidence: 'high'
		});
		expect(below.items[1].why).toContain('The framed note above the name was read as a lead-in to its description.');
		expect(below.items[0].why).not.toContain('A note under the item joined it.');
		expect(below.unsorted).toEqual([]);

		// Before a blank line: the note is a footnote on the row above, as
		// before, and the row under the blank starts clean.
		const above = read('STARTERS\nScallop Crudo\n12\nthinly sliced scallops\n~le Coup du Milieu~\n\nCrab Toast\n14\nblue crab on brioche');
		expect(above.items[0]).toMatchObject({
			description: 'thinly sliced scallops le Coup du Milieu',
			raw: 'Scallop Crudo\n12\nthinly sliced scallops\n~le Coup du Milieu~',
			lines: [1, 4]
		});
		expect(above.items[0].why).toContain('A note under the item joined it.');
		expect(above.items[1]).toMatchObject({ name: 'Crab Toast', description: 'blue crab on brioche', raw: 'Crab Toast\n14\nblue crab on brioche', lines: [6, 8] });
		// A heading, a price line or the block's end under the note does the same.
		const heading = read('Scallop Crudo\nthinly sliced scallops\n~le Coup du Milieu~\nDESSERTS\nSoufflé\n11');
		expect(heading.items.map((i) => [i.name, (i as DeskDish).description, i.raw])).toEqual([
			['Scallop Crudo', 'thinly sliced scallops le Coup du Milieu', 'Scallop Crudo\nthinly sliced scallops\n~le Coup du Milieu~'],
			['Soufflé', '', 'Soufflé\n11']
		]);
		expect(heading.items[1].section).toBe('DESSERTS');
		const priceLine = read('Scallop Crudo\n~le Coup du Milieu~\n12\nKiss the Crab\n14');
		expect(priceLine.items.map((i) => [i.name, (i as DeskDish).description, i.price.printed])).toEqual([
			['Scallop Crudo', 'le Coup du Milieu', '12'],
			['Kiss the Crab', '', '14']
		]);
		const end = read('Scallop Crudo\nthinly sliced scallops\n~le Coup du Milieu~');
		expect(end.items.map((i) => [i.name, (i as DeskDish).description])).toEqual([['Scallop Crudo', 'thinly sliced scallops le Coup du Milieu']]);
		// Only the FRAMED shape leads: a star-led footnote directly over the
		// next name stays on the item above it.
		const star = read('DESSERTS\nSoufflé\n11\n* Must be ordered 20 minutes in advance\nIce Cream\n10');
		expect(star.items.map((i) => [i.name, (i as DeskDish).description])).toEqual([
			['Soufflé', '* Must be ordered 20 minutes in advance'],
			['Ice Cream', '']
		]);
		// And only the TILDE frame: a second star closing the line is a shape
		// FRAMED accepts, and read as framed the footnote led the ice cream.
		// The star still points back at the soufflé whatever closes the line.
		const starClosed = read('DESSERTS\nSoufflé\n11\n* Must be ordered in advance *\nIce Cream\n10');
		expect(starClosed.items.map((i) => [i.name, (i as DeskDish).description, i.raw])).toEqual([
			['Soufflé', '* Must be ordered in advance *', 'Soufflé\n11\n* Must be ordered in advance *'],
			['Ice Cream', '', 'Ice Cream\n10']
		]);
		expect(starClosed.items[0].why).toContain('A note under the item joined it.');
		expect(starClosed.items[1].why).not.toContain('The framed note above the name was read as a lead-in to its description.');

		// A title-case heading under a held note keeps its break above: the
		// held note line is read past the way a consumed price line is, so
		// 'Mains' is still the section and the note settles on the row above.
		// Counted as a line above it, 'Mains' was demoted to a dish that took
		// the note as its description, and every row under it lost its section.
		const overHeading = read('Scallop Crudo 9\nthinly sliced scallops\n\n~le Coup du Milieu~\nMains\nRibs 14\nChips 4');
		expect(overHeading.items.map((i) => [i.section, i.name])).toEqual([
			['', 'Scallop Crudo'],
			['Mains', 'Ribs'],
			['Mains', 'Chips']
		]);
		expect(overHeading.items[0]).toMatchObject({
			description: 'thinly sliced scallops le Coup du Milieu',
			raw: 'Scallop Crudo 9\nthinly sliced scallops\n~le Coup du Milieu~',
			lines: [0, 3]
		});
		expect(overHeading.items[0].why).toContain('A note under the item joined it.');
		expect(overHeading.unsorted).toEqual([]);

		// Two framed notes stacked over one name both lead it, in page order and
		// joined with a single space; the row above is untouched, and the
		// re-read reads the same lines back to the same lead-in. The crab is a
		// cocktail on the first reading, so 'rum, vermouth' is its spec and not
		// its description; read again as a dish the same line is description.
		const stacked = read('Scallop Crudo\n12\nthinly sliced scallops\n\n~le Coup du Milieu~\n~served chilled~\nKiss the Crab\n14\nrum, vermouth');
		expect(stacked.items[0]).toMatchObject({ name: 'Scallop Crudo', description: 'thinly sliced scallops', raw: 'Scallop Crudo\n12\nthinly sliced scallops', lines: [0, 2] });
		expect(stacked.items[1]).toMatchObject({
			kind: 'cocktail',
			name: 'Kiss the Crab',
			description: 'le Coup du Milieu served chilled',
			price: { printed: '14' },
			raw: '~le Coup du Milieu~\n~served chilled~\nKiss the Crab\n14\nrum, vermouth',
			lines: [4, 8]
		});
		expect(stacked.items[1].why).toContain('The framed note above the name was read as a lead-in to its description.');
		expect(stacked.unsorted).toEqual([]);
		expect((reReadAs(stacked.items[1], 'dish') as DeskDish).description).toBe('le Coup du Milieu served chilled rum, vermouth');
		// With nothing above them, both still lead the name and nothing is set aside.
		const stackedAlone = read('~le Coup du Milieu~\n~served chilled~\nKiss the Crab\n14\nrum, vermouth');
		expect(stackedAlone.items.map((i) => [i.kind, i.name, (i as DeskCocktail).description, i.lines])).toEqual([
			['cocktail', 'Kiss the Crab', 'le Coup du Milieu served chilled', [0, 4]]
		]);
		expect(stackedAlone.unsorted).toEqual([]);
		// Stacked before a blank line, both are footnotes on the row above, in page order.
		const stackedAbove = read('Scallop Crudo\n12\nthinly sliced scallops\n~le Coup du Milieu~\n~served chilled~\n\nKiss the Crab\n14');
		expect(stackedAbove.items[0]).toMatchObject({
			description: 'thinly sliced scallops le Coup du Milieu served chilled',
			raw: 'Scallop Crudo\n12\nthinly sliced scallops\n~le Coup du Milieu~\n~served chilled~',
			lines: [0, 4]
		});
		expect(stackedAbove.items[1]).toMatchObject({ name: 'Kiss the Crab', raw: 'Kiss the Crab\n14', lines: [6, 7] });
		expect(stackedAbove.unsorted).toEqual([]);
	});

	it('joins a starred note to the item above with the star kept, and sets aside one with nothing above', () => {
		const file = read('DESSERTS\nSoufflé\n11\n\n* Must be ordered 20 minutes in advance');
		expect((file.items[0] as DeskDish).description).toBe('* Must be ordered 20 minutes in advance');
		expect(file.items[0].raw).toBe('Soufflé\n11\n* Must be ordered 20 minutes in advance');
		const alone = read('DESSERTS\n* Must be ordered 20 minutes in advance\nSoufflé\n11');
		expect(alone.unsorted).toEqual([{ raw: '* Must be ordered 20 minutes in advance', line: 1, reason: 'heading-note' }]);
		expect(alone.items.map((i) => i.name)).toEqual(['Soufflé']);
	});

	it('makes a priced offering heading both the section and a low row, in title case or capitals', () => {
		for (const heading of ['Chef’s Tasting Menu', 'THREE COURSE OFFERING']) {
			const file = read(`${heading}\n\n$90 per Person\nAmuse Bouche\nsomething small`);
			expect(file.items.map(row)).toEqual([
				{ kind: 'dish', section: heading, name: heading, price: '$90 per Person', confidence: 'low' },
				{ kind: 'dish', section: heading, name: 'Amuse Bouche', price: '', confidence: 'low' }
			]);
		}
	});

	it('reads a title-case line with a break above and a priced item below as a heading, as before', () => {
		expect(read('To Begin\nOlives 4').items[0].section).toBe('To Begin');
		expect(read('Wines\n\nAlbariño Glass 8 Bottle 30').items[0].section).toBe('Wines');
		// And a title-case line over a price line is a name, which is the new pin.
		expect(one('Soup of the day\n9.50')).toMatchObject({ name: 'Soup of the day', price: { printed: '9.50' }, confidence: 'high' });
	});

	it('sets aside a sentence sitting under a heading before any row, where a person can still make a row of it', () => {
		const file = read('THREE COURSE OFFERINGS\nPrice of Entrée includes Soup or Salad and Dessert\nQuail\n54');
		expect(file.unsorted).toEqual([{ raw: 'Price of Entrée includes Soup or Salad and Dessert', line: 1, reason: 'heading-note' }]);
		expect(file.items.map((i) => i.name)).toEqual(['Quail']);
	});
});

describe('continuations', () => {
	it('joins every description line until the next item, with no cap', () => {
		const file = read('Roast chicken 16\nbread sauce\nand greens\nand a fourth line\nApple pie 6');
		expect(file.items.map((i) => (i as DeskDish).description)).toEqual(['bread sauce and greens and a fourth line', '']);
	});

	it('joins a description that runs to several lines under a stacked price', () => {
		const dish = one('Pork Chop\n45\nChargrilled 14 oz. Creole spiced pork chop\ntasso brined for 48 hours\nwith jeweled wild rice') as DeskDish;
		expect(dish.description).toBe('Chargrilled 14 oz. Creole spiced pork chop tasso brined for 48 hours with jeweled wild rice');
		expect(dish.price.printed).toBe('45');
	});

	it('keeps a vocabulary-only line under a priced bottle as its descriptor, and starts a new row on the next name', () => {
		const file = read('WINE\nCommander’s Palace\n10.50 / 5.25\n2020\nChardonnay\nStudio by Miraval\n11.50 / 5.75\n2021\nRosé, France');
		expect(file.items.map((i) => i.name)).toEqual(['Commander’s Palace', 'Studio by Miraval']);
		expect((file.items[0] as DeskWine).grapes).toEqual(['Chardonnay']);
	});

	it('starts a new row on a capitalised line that a price line follows, whatever the line above it was', () => {
		const file = read('SIDES\nBoudin\n9\nSauté of Sweet Corn, Grilled Kale, Asparagus & Leeks\n10');
		expect(file.items.map(row)).toEqual([
			{ kind: 'dish', section: 'SIDES', name: 'Boudin', price: '9', confidence: 'high' },
			{ kind: 'dish', section: 'SIDES', name: 'Sauté of Sweet Corn, Grilled Kale, Asparagus & Leeks', price: '10', confidence: 'high' }
		]);
	});

	it('does not split a stacked name on a comma, because the description has its own line', () => {
		expect(one('Ham, egg and chips\n12')).toMatchObject({ name: 'Ham, egg and chips', confidence: 'high' });
		expect(one('Ham, egg and chips 12')).toMatchObject({ name: 'Ham', confidence: 'low' });
	});
});

describe('wine fields', () => {
	it('reads the vintage in every form', () => {
		expect((one('WINE\nSancerre 2022\n14') as DeskWine).vintage).toBe('2022');
		expect((one('WINE\nSancerre\n14\nN.V.') as DeskWine).vintage).toBe('NV');
		expect((one('WINE\nSancerre\n14\nLoire, France 2021') as DeskWine).vintage).toBe('2021');
		const short = one("WINE\nSancerre '19\n14") as DeskWine;
		expect(short.vintage).toBe('2019');
		expect(short.why).toContain("The vintage was printed as '19 and is read as 2019.");
		// The two-digit form pivots on the clock (NOW is 2026): a year this
		// century has not reached is last century's, never an invented 2085.
		const past = one("WINE LIST\nCh. Latour '85\n120") as DeskWine;
		expect(past.vintage).toBe('1985');
		expect(past.why).toContain("The vintage was printed as '85 and is read as 1985, because this century has not reached '85 yet.");
		expect((one("WINE\nSancerre '95\n14") as DeskWine).vintage).toBe('1995');
		expect((one("WINE\nSancerre '26\n14") as DeskWine).vintage).toBe('2026');
		expect((one('WINE\nSancerre\n14') as DeskWine).vintage).toBe('');
	});

	it('reads pours against the bottle from the labels, or from the sizes, or from the smaller of two', () => {
		expect(one('WINE\nAlbariño Glass 8 Bottle 30')).toMatchObject({ pours: [{ price: '8', size: 'Glass' }], bottle: '30' });
		const two = one('WINE\nAlbariño\n30 / 8') as DeskWine;
		expect(two).toMatchObject({ pours: [{ price: '8', size: '' }], bottle: '30' });
		expect(two.why).toContain('Two prices with no labels: the smaller is read as the glass and the larger as the bottle.');
		expect(one('BY THE GLASS\nAlbariño\n8')).toMatchObject({ pours: [{ price: '8', size: '' }], bottle: '' });
		expect(one('CELLAR\nAlbariño\n30')).toMatchObject({ pours: [], bottle: '30' });
	});

	it('records region, country, grape and style as printed, from parts read whole', () => {
		expect(one('WINE\nSomething\n14\nPinot Noir, Willamette Valley, Oregon')).toMatchObject({
			grapes: ['Pinot Noir'],
			region: 'Willamette Valley, Oregon',
			country: ''
		});
		expect(one('WINE\nSomething\n14\nExtra-Brut, Champagne, France')).toMatchObject({ style: 'Extra-Brut', region: 'Champagne', country: 'France' });
	});
});

describe('cocktail fields', () => {
	it('splits a spec on pipes, bullets, commas, slashes and spaced dashes, with fractions kept whole', () => {
		const spec = (line: string) => (one(`COCKTAILS\nSour\n12\n${line}`) as DeskCocktail).spec;
		expect(spec('3/4 oz lime | 2 oz gin | 1/2 oz simple syrup')).toEqual(['3/4 oz lime', '2 oz gin', '1/2 oz simple syrup']);
		expect(spec('gin • lemon • sugar')).toEqual(['gin', 'lemon', 'sugar']);
		expect(spec('gin, lemon, sugar')).toEqual(['gin', 'lemon', 'sugar']);
		expect(spec('gin - lemon - sugar')).toEqual(['gin', 'lemon', 'sugar']);
		expect(spec('gin / lemon / sugar')).toEqual(['gin', 'lemon', 'sugar']);
		for (const p of spec('3/4 oz lime | 2 oz gin')) expect(p).not.toBe('4 oz');
	});

	it('keeps prose as a description rather than cutting it into parts', () => {
		const c = one('COCKTAILS\nHouse Sour\n12\nOur house take on a classic, shaken hard and served long.') as DeskCocktail;
		expect(c.spec).toEqual([]);
		expect(c.description).toBe('Our house take on a classic, shaken hard and served long.');
		expect(c.confidence).toBe('low');
	});

	it('names the base spirit only from a printed spirit word, and not at all when there are two', () => {
		expect((one('COCKTAILS\nNegroni\n12\ngin | campari | sweet vermouth') as DeskCocktail).baseSpirit).toBe('gin');
		expect((one('COCKTAILS\nBoulevardier\n12\nZacapa | campari | vermouth') as DeskCocktail).baseSpirit).toBe('');
		const two = one('COCKTAILS\nLong Island\n12\nvodka | gin | rum | cola') as DeskCocktail;
		expect(two.baseSpirit).toBe('');
		expect(two.why).toContain('Two spirit words on the spec, so no base spirit is named.');
	});
});

describe('dishes', () => {
	it('names ingredients only from a printed list, never from a sentence', () => {
		expect((one('Burrata\n12\nheritage tomato | basil | aged balsamic') as DeskDish).ingredientsNamed).toEqual(['heritage tomato', 'basil', 'aged balsamic']);
		expect((one('Burrata\n12\nCreamy burrata with heritage tomatoes and a basil dressing') as DeskDish).ingredientsNamed).toEqual([]);
	});

	it('takes the printed marks and reads nothing into them', () => {
		expect(one('Dhal (vg, gf)\n9')).toMatchObject({ marks: ['vg', 'gf'], name: 'Dhal' });
		expect(one('Peanut satay chicken\n14\nwith coconut and lime').marks).toEqual([]);
	});
});

describe('the review pass: what a second reading fixed', () => {
	it('reads a name-plus-tail-price row as a row even when every word of it is price vocabulary', () => {
		// 'Tasting Menu 65' is a row. Read as a price line it was glued into one
		// invented price under the heading, which came back as a sure dish.
		expect(read("CHEF'S TABLE\nTasting Menu 65\nWine Pairing 40\nCheese Course 12").items.map(row)).toEqual([
			{ kind: 'dish', section: "CHEF'S TABLE", name: 'Tasting Menu', price: '65', confidence: 'high' },
			{ kind: 'dish', section: "CHEF'S TABLE", name: 'Wine Pairing', price: '40', confidence: 'high' },
			{ kind: 'dish', section: "CHEF'S TABLE", name: 'Cheese Course', price: '12', confidence: 'high' }
		]);
		expect(read("CHEF'S TABLE\n\nTasting Menu 65\nWine Pairing 40").unsorted).toEqual([]);
		// The same words still follow a leading price: a course price line is one.
		expect(one('Set lunch\n2 courses 22')).toMatchObject({ name: 'Set lunch', price: { printed: '2 courses 22' } });
		expect(one('Sharing boards\nfrom 12')).toMatchObject({ name: 'Sharing boards', price: { printed: 'from 12' } });
	});

	it('keeps a wrapped description on its dish: a line opening or closing on a small word never starts a row', () => {
		const dish = one(
			'MAINS\nBeef Wellington\n32\nFillet of beef wrapped in pastry\nwith a red wine jus and\nseasonal vegetables from the garden\nServed with a side of\nhand cut chips'
		) as DeskDish;
		expect(dish.description).toBe(
			'Fillet of beef wrapped in pastry with a red wine jus and seasonal vegetables from the garden Served with a side of hand cut chips'
		);
		const two = read('MAINS\nBeef Wellington\n32\nFillet of beef wrapped in pastry\nwith a red wine jus and\nseasonal vegetables\n\nSea Bass\n24');
		expect(two.items.map((i) => i.name)).toEqual(['Beef Wellington', 'Sea Bass']);
	});

	it('reads capitals over a description over a price as a dish name, whatever section word it carries', () => {
		const stacked = read('STARTERS\nTOMATO SOUP\nRoasted vine tomatoes with basil oil\n7\n\nCRAB SALAD\nFresh white crab with avocado\n12');
		expect(stacked.items.map(row)).toEqual([
			{ kind: 'dish', section: 'STARTERS', name: 'TOMATO SOUP', price: '7', confidence: 'high' },
			{ kind: 'dish', section: 'STARTERS', name: 'CRAB SALAD', price: '12', confidence: 'high' }
		]);
		expect((stacked.items[0] as DeskDish).description).toBe('Roasted vine tomatoes with basil oil');
		const inline = read('STARTERS\nTOMATO SOUP\nRoasted vine tomatoes with basil oil 7\nCRAB SALAD\nFresh white crab with avocado 12');
		expect(inline.items.map(row)).toEqual([
			{ kind: 'dish', section: 'STARTERS', name: 'TOMATO SOUP', price: '7', confidence: 'high' },
			{ kind: 'dish', section: 'STARTERS', name: 'CRAB SALAD', price: '12', confidence: 'high' }
		]);
		expect((inline.items[1] as DeskDish).description).toBe('Fresh white crab with avocado');
		expect(inline.items[1].raw).toBe('CRAB SALAD\nFresh white crab with avocado 12');
		expect(inline.items[1].why).toContain('Price read from the end of the description line under the name.');
		// A line that is nothing but section words is a heading over a described item.
		expect(read('SPECIALS\nFresh white crab with avocado 12').items.map(row)).toEqual([
			{ kind: 'dish', section: 'SPECIALS', name: 'Fresh white crab with avocado', price: '12', confidence: 'high' }
		]);
		// And so is one carrying a section word over a list rather than a run of names.
		expect(read("TODAY'S SPECIALS\nPan fried sea bass with samphire 18\nRoast chicken 16").items.map((i) => i.section)).toEqual([
			"TODAY'S SPECIALS",
			"TODAY'S SPECIALS"
		]);
	});

	it('marks a sentence that became a row low, and says it may be a description', () => {
		const dish = one('SIDES\nRoasted carrots with honey, thyme, salt and toasted almonds\n6');
		expect(dish).toMatchObject({ section: 'SIDES', price: { printed: '6' }, confidence: 'low' });
		expect(dish.why).toContain('The name reads as a sentence, so it may be a description whose dish name was not read.');
	});

	it('reads a block that prints each price above its name, every price to the name below it', () => {
		const expected = [
			{ kind: 'dish', section: 'STARTERS', name: 'Soup of the day', price: '12', confidence: 'high' },
			{ kind: 'dish', section: 'STARTERS', name: 'Prawn cocktail', price: '14', confidence: 'high' },
			{ kind: 'dish', section: 'STARTERS', name: 'Garlic mushrooms', price: '16', confidence: 'high' }
		];
		const file = read('STARTERS\n\n12\nSoup of the day\n14\nPrawn cocktail\n16\nGarlic mushrooms');
		expect(file.items.map(row)).toEqual(expected);
		expect(file.unsorted).toEqual([]);
		for (const i of file.items) expect(i.why).toContain('Price read from the line above the name.');
		// Without the blank the heading is still the heading, not a dish priced 12.
		expect(read('STARTERS\n12\nSoup of the day\n14\nPrawn cocktail\n16\nGarlic mushrooms').items.map(row)).toEqual(expected);
		expect(read('12\nSoup of the day\n14\nPrawn cocktail').items.map((i) => [i.name, i.price.printed])).toEqual([
			['Soup of the day', '12'],
			['Prawn cocktail', '14']
		]);
		// A description between a name and the next price stays on its name, and
		// a capitals name under a price is the name, not a heading.
		const described = read('12\nSoup of the day\nwith crusty bread\n14\nPRAWN COCKTAIL');
		expect(described.items.map((i) => [i.name, i.price.printed])).toEqual([
			['Soup of the day', '12'],
			['PRAWN COCKTAIL', '14']
		]);
		expect((described.items[0] as DeskDish).description).toBe('with crusty bread');
	});

	it('does not read a title-case dish over its price and description as a priced heading', () => {
		expect(read('SHARING\n\nFeast Platter\n45\nChicken, lamb, rice, salads\n\nMezze Platter\n30\nHummus, falafel, pitta').items.map(row)).toEqual([
			{ kind: 'dish', section: 'SHARING', name: 'Feast Platter', price: '45', confidence: 'high' },
			{ kind: 'dish', section: 'SHARING', name: 'Mezze Platter', price: '30', confidence: 'high' }
		]);
		expect(read('BRUNCH\n\nBrunch Burger\n14\nbeef patty, fried egg, hash brown\n\nEggs Benedict\n12\nhollandaise, muffin').items.map(row)).toEqual([
			{ kind: 'dish', section: 'BRUNCH', name: 'Brunch Burger', price: '14', confidence: 'high' },
			{ kind: 'dish', section: 'BRUNCH', name: 'Eggs Benedict', price: '12', confidence: 'high' }
		]);
	});

	it('reads two price lines under a priced heading together, and the courses under it as its items', () => {
		const file = read('SET LUNCH\n2 courses 22\n3 courses 25\nSoup of the day\nRoast chicken\nSticky toffee pudding');
		expect(file.items.map(row)).toEqual([
			{ kind: 'dish', section: 'SET LUNCH', name: 'SET LUNCH', price: '2 courses 22 3 courses 25', confidence: 'low' },
			{ kind: 'dish', section: 'SET LUNCH', name: 'Soup of the day', price: '', confidence: 'low' },
			{ kind: 'dish', section: 'SET LUNCH', name: 'Roast chicken', price: '', confidence: 'low' }
		]);
		expect(file.items[0].why).toContain('Two price lines under the name, read together.');
		expect(file.unsorted).toEqual([]);
		// The pudding, in sentence case under a bare name, joins the chicken as the
		// half-capitalised rule has always read such a line; nothing on the page is lost.
		expect(file.items[2].raw).toBe('Roast chicken\nSticky toffee pudding');
	});

	it('votes priceFirst for a block whose lines open on their prices, and reads the price from the start', () => {
		const file = read('STARTERS\n12.50 Soup of the day\n14 Prawn cocktail\n9 Garlic bread');
		expect(file.items.map(row)).toEqual([
			{ kind: 'dish', section: 'STARTERS', name: 'Soup of the day', price: '12.50', confidence: 'high' },
			{ kind: 'dish', section: 'STARTERS', name: 'Prawn cocktail', price: '14', confidence: 'high' },
			{ kind: 'dish', section: 'STARTERS', name: 'Garlic bread', price: '9', confidence: 'high' }
		]);
		for (const i of file.items) expect(i.why).toContain('Price read from the start of the line.');
		expect(read('STARTERS\n12.50 Soup of the day\n9.00 Olives\n14.00 Bread').items.map((i) => [i.name, i.price.printed])).toEqual([
			['Soup of the day', '12.50'],
			['Olives', '9.00'],
			['Bread', '14.00']
		]);
		// A single line never votes, and a block of bare leading numbers with no
		// sure price among them is a cellar numbering its bins, not pricing them.
		expect(one('12.50 Soup of the day')).toMatchObject({ name: '12.50 Soup of the day', price: { printed: '' } });
		expect(read('CELLAR\n101 Ployez-Jacquemart\n102 Krug').items.map((i) => [i.name, i.price.printed])).toEqual([
			['101 Ployez-Jacquemart', ''],
			['102 Krug', '']
		]);
		// A price-first row reads back with its price, and so does a capitals name
		// over the description that carried it.
		expect(reReadAs(file.items[0], 'dish')).toMatchObject({ name: 'Soup of the day', price: { printed: '12.50' } });
		const capsInline = read('TOMATO SOUP\nRoasted vine tomatoes with basil oil 7\nCRAB SALAD\nFresh white crab with avocado 12').items[0];
		expect(reReadAs(capsInline, 'dish')).toMatchObject({ name: 'TOMATO SOUP', price: { printed: '7' } });
	});

	it("keeps a heading's printed marks in the section, and gives its priced row none", () => {
		expect(one('PUDDINGS (V)\nTart 6')).toMatchObject({ section: 'PUDDINGS (V)', name: 'Tart', marks: [] });
		const file = read('TASTING MENU (V)\n\n$45 per Person\nAmuse Bouche');
		expect(file.items[0]).toMatchObject({ section: 'TASTING MENU (V)', name: 'TASTING MENU (V)', marks: [], confidence: 'low' });
		expect(file.items[1]).toMatchObject({ section: 'TASTING MENU (V)', name: 'Amuse Bouche' });
	});
});

describe('reReadAs, a person choosing the kind', () => {
	const file = read(fixture('commanders-dinner.txt'));
	const crab = unsureOf(file, 'Kiss the Crab');

	it('reads an unsure row as a cocktail from its own lines, keeping the id and the source', () => {
		const c = reReadAs(crab, 'cocktail');
		expect(c).toMatchObject({ kind: 'cocktail', id: crab.id, raw: crab.raw, lines: crab.lines, section: crab.section, name: 'Kiss the Crab' });
		// The row's lines open on the framed note the first reading took as the
		// lead-in, and the re-read reads it the same way: the name stays the
		// name line, and the note still leads the description.
		expect((c as DeskCocktail).description).toBe(
			'le Coup du Milieu Blue crab-brown butter washed Zacapa No. 23 Solera, banana oleosacrum, dry vermouth, orange peel'
		);
		expect(c.why).toContain('The framed note above the name was read as a lead-in to its description.');
		expect(c.why).toContain("Read again as a cocktail at a person's request.");
		expect(c.confidence).toBe('low');
	});

	it('reads the same row as a dish, and reads a priced wine back with its pours', () => {
		const d = reReadAs(crab, 'dish') as DeskDish;
		expect(d.kind).toBe('dish');
		expect(d.description).toMatch(/^le Coup du Milieu Blue crab-brown butter/);
		const drinks = read(fixture('commanders-drinks.txt'));
		const w = reReadAs(cocktailOf(drinks, 'Holy Trinity'), 'wine') as DeskWine;
		expect(w).toMatchObject({ kind: 'wine', name: 'Holy Trinity', price: { printed: '15' }, descriptors: 'trinity infused gin | benedictine | lime' });
		const back = reReadAs(wineOf(drinks, 'Ployez-Jacquemart'), 'wine') as DeskWine;
		expect(back.pours).toEqual(wineOf(drinks, 'Ployez-Jacquemart').pours);
		expect(back.vintage).toBe('2010');
	});

	it('can take a row back out of its room, offering what the sorter would have said', () => {
		const u = reReadAs(dishOf(file, 'Shrimp & Tasso Henican'), 'unsure') as DeskUnsure;
		expect(u.kind).toBe('unsure');
		expect(u.could).toEqual(['dish']);
	});

	it('has no allergen field on a re-read row either', () => {
		for (const kind of ['dish', 'wine', 'cocktail', 'unsure'] as const) {
			const keys = keysDeep(reReadAs(crab, kind));
			for (const k of keys) expect(k.toLowerCase()).not.toMatch(/allerg/);
		}
	});
});

describe('the reader is total', () => {
	it('takes anything at all without throwing', () => {
		for (const input of ['', '   ', '\n\n\n', '\r\n\r\n', '£', '((((', '---------', '0'.repeat(500), 'a\tb\tc', '😀 9.50', '  Olives 4', '~', '*', '|||', '2010', 'NV', '5 oz']) {
			expect(() => read(input)).not.toThrow();
		}
		expect(read('').items).toEqual([]);
		const source = deskSource('paste', 'table', '', { now: NOW });
		expect(readMenu(null as never, source).items).toEqual([]);
		expect(readMenu(undefined as never, source).unsorted).toEqual([]);
	});

	it('stops at the size guard and says so in the notice rather than reading half a menu in silence', () => {
		const huge = 'Crispy squid 9.50\n'.repeat(20000);
		const started = Date.now();
		const file = read(huge);
		expect(Date.now() - started).toBeLessThan(5000);
		expect(file.items.length).toBeLessThanOrEqual(5000);
		expect(file.notice).toBe(TRUNCATION_NOTICE);
		expect('notice' in read('Olives 4')).toBe(false);
	});

	it('reads a stacked menu of five thousand lines in time', () => {
		const stacked = 'Shrimp & Tasso Henican\n15.50\nWild shrimp stuffed with tasso ham, pickled okra and pepper jelly\n\n'.repeat(1200);
		const started = Date.now();
		const file = read(stacked);
		expect(Date.now() - started).toBeLessThan(5000);
		expect(file.items.length).toBeGreaterThan(1000);
	});
});
