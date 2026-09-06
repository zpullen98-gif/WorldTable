import { describe, it, expect } from 'vitest';
import { parseMenuText } from './menu-parse';
import type { ParsedDish } from './menu-parse';

/**
 * The menu importer's parser, tested against the three shapes a real menu
 * arrives in: typed and tidy, printed with dot leaders and mixed currency, and
 * scraped off a photograph by an OCR pass that got most of it right.
 *
 * The fixtures are asserted whole rather than a row at a time. A menu parser
 * fails by drifting · a heading quietly becoming a dish, a description quietly
 * joining the row above · and a whole-menu assertion is the only kind that
 * notices, because it fails on the row that moved as well as the row that broke.
 */

/** The fields a row asserts on; `raw` is checked separately where it matters. */
type Row = Omit<ParsedDish, 'raw'>;

const rows = (text: string): Row[] =>
	parseMenuText(text).dishes.map(({ raw: _raw, ...rest }) => rest);

const one = (text: string): ParsedDish => {
	const { dishes } = parseMenuText(text);
	expect(dishes).toHaveLength(1);
	return dishes[0];
};

describe('a clean typed menu', () => {
	const MENU = `
STARTERS

Crispy squid, lemon and chilli mayonnaise    9.50
Soup of the day (v)    6
Bread and butter    4.50

MAINS

Roast chicken, bread sauce and greens    18
Whole plaice - brown shrimp butter    MP
Cauliflower shawarma (vg) (gf)    15.50

PUDDINGS

Sticky toffee pudding    8
Cheese, three British    12 / 16

All prices include VAT. Please inform us of any allergies.
`;

	it('reads every dish, under the right heading, with the price as printed', () => {
		expect(rows(MENU)).toEqual([
			{
				section: 'STARTERS',
				name: 'Crispy squid',
				description: 'lemon and chilli mayonnaise',
				price: '9.50',
				tags: [],
				confidence: 'low'
			},
			{
				section: 'STARTERS',
				name: 'Soup of the day',
				description: '',
				price: '6',
				tags: ['v'],
				confidence: 'high'
			},
			{
				section: 'STARTERS',
				name: 'Bread and butter',
				description: '',
				price: '4.50',
				tags: [],
				confidence: 'high'
			},
			{
				section: 'MAINS',
				name: 'Roast chicken',
				description: 'bread sauce and greens',
				price: '18',
				tags: [],
				confidence: 'low'
			},
			{
				section: 'MAINS',
				name: 'Whole plaice',
				description: 'brown shrimp butter',
				price: 'MP',
				tags: [],
				confidence: 'high'
			},
			{
				section: 'MAINS',
				name: 'Cauliflower shawarma',
				description: '',
				price: '15.50',
				tags: ['vg', 'gf'],
				confidence: 'high'
			},
			{
				section: 'PUDDINGS',
				name: 'Sticky toffee pudding',
				description: '',
				price: '8',
				tags: [],
				confidence: 'high'
			},
			{
				section: 'PUDDINGS',
				name: 'Cheese',
				description: 'three British',
				price: '12 / 16',
				tags: [],
				confidence: 'low'
			}
		]);
	});

	it('drops the footer notice rather than pricing it as a dish', () => {
		expect(parseMenuText(MENU).skipped).toEqual([
			'All prices include VAT. Please inform us of any allergies.'
		]);
	});

	it('keeps the source line on every row so the cook can see where it came from', () => {
		const squid = parseMenuText(MENU).dishes[0];
		expect(squid.raw).toBe('Crispy squid, lemon and chilli mayonnaise    9.50');
	});
});

describe('a printed menu with dot leaders and mixed currency', () => {
	const MENU = `~ To Begin ~
Olives .......... 4
Padrón peppers ......... £6.50
Jamón ibérico .... 14 GBP
Croquetas (v) ...... 7

~ From The Grill ~
Ribeye 300g ................ £34
Lamb chops ...... 26€
Chicken skewers ........ 12,50

Wines
Albariño          Glass 8 Bottle 30
Rioja Reserva 2019 ......... £42
`;

	it('reads through the leaders and keeps each currency exactly as printed', () => {
		expect(rows(MENU)).toEqual([
			{
				section: 'To Begin',
				name: 'Olives',
				description: '',
				price: '4',
				tags: [],
				confidence: 'high'
			},
			{
				section: 'To Begin',
				name: 'Padrón peppers',
				description: '',
				price: '£6.50',
				tags: [],
				confidence: 'high'
			},
			{
				section: 'To Begin',
				name: 'Jamón ibérico',
				description: '',
				price: '14 GBP',
				tags: [],
				confidence: 'high'
			},
			{
				section: 'To Begin',
				name: 'Croquetas',
				description: '',
				price: '7',
				tags: ['v'],
				confidence: 'high'
			},
			{
				section: 'From The Grill',
				name: 'Ribeye 300g',
				description: '',
				price: '£34',
				tags: [],
				confidence: 'high'
			},
			{
				section: 'From The Grill',
				name: 'Lamb chops',
				description: '',
				price: '26€',
				tags: [],
				confidence: 'high'
			},
			{
				section: 'From The Grill',
				name: 'Chicken skewers',
				description: '',
				price: '12,50',
				tags: [],
				confidence: 'high'
			},
			{
				section: 'Wines',
				name: 'Albariño',
				description: '',
				price: 'Glass 8 Bottle 30',
				tags: [],
				confidence: 'high'
			},
			{
				section: 'Wines',
				name: 'Rioja Reserva 2019',
				description: '',
				price: '£42',
				tags: [],
				confidence: 'high'
			}
		]);
	});

	it('skips nothing, because nothing on this menu was a notice', () => {
		expect(parseMenuText(MENU).skipped).toEqual([]);
	});
});

describe('a menu scraped off a photograph', () => {
	const MENU = `STARTERS
l
Crispy squid .. 9.5
   with lemon aioli
Salt cod croquettes    8
   smoked paprika, aioli
O

SIDES
Chips   4
Greens   4
Bread

Open Mon - Fri 12 - 3pm
Tel 020 7946 0958
www.example.com
2
`;

	it('gathers the run-on lines, keeps the sides, and throws away the specks', () => {
		expect(rows(MENU)).toEqual([
			{
				section: 'STARTERS',
				name: 'Crispy squid',
				description: 'with lemon aioli',
				price: '9.5',
				tags: [],
				confidence: 'high'
			},
			{
				section: 'STARTERS',
				name: 'Salt cod croquettes',
				description: 'smoked paprika, aioli',
				price: '8',
				tags: [],
				confidence: 'high'
			},
			{
				section: 'SIDES',
				name: 'Chips',
				description: '',
				price: '4',
				tags: [],
				confidence: 'high'
			},
			{
				section: 'SIDES',
				name: 'Greens',
				description: '',
				price: '4',
				tags: [],
				confidence: 'high'
			},
			// Bread has the shape of a heading and is a side, which is the one
			// genuinely undecidable line on a menu. It sits in the middle of a
			// priced list with no blank line above it, so it stays a dish, priced
			// nothing and flagged for the cook to price.
			{
				section: 'SIDES',
				name: 'Bread',
				description: '',
				price: '',
				tags: [],
				confidence: 'low'
			}
		]);
	});

	it('sends the opening hours, the phone number, the website and the page number to skipped', () => {
		expect(parseMenuText(MENU).skipped).toEqual([
			'l',
			'O',
			'Open Mon - Fri 12 - 3pm',
			'Tel 020 7946 0958',
			'www.example.com',
			'2'
		]);
	});

	it('keeps both source lines on a dish that ran on', () => {
		expect(parseMenuText(MENU).dishes[0].raw).toBe('Crispy squid .. 9.5\n   with lemon aioli');
	});
});

describe('section headings', () => {
	it('reads a shouted heading, and does not sell it', () => {
		const { dishes } = parseMenuText('STARTERS\nOlives 4');
		expect(dishes).toHaveLength(1);
		expect(dishes[0].section).toBe('STARTERS');
	});

	it('reads a decorated heading and strips the decoration', () => {
		for (const heading of ['~ Mains ~', '— Puddings —', '*** SIDES ***', '=== Sides ===']) {
			const { dishes } = parseMenuText(`${heading}\nOlives 4`);
			expect(dishes).toHaveLength(1);
			expect(dishes[0].section).toBe(heading.replace(/^[~—*=\s]+|[~—*=\s]+$/g, ''));
		}
	});

	it('reads a heading that ends in a colon', () => {
		expect(parseMenuText('Sides:\nChips 4').dishes[0].section).toBe('Sides');
	});

	it('reads a title-case heading that has a break above it and a priced dish below', () => {
		expect(parseMenuText('To Begin\nOlives 4').dishes[0].section).toBe('To Begin');
		expect(parseMenuText('From the Grill\n\nRibeye 34').dishes[0].section).toBe('From the Grill');
	});

	it('leaves the section empty when the menu never said', () => {
		expect(parseMenuText('Olives 4').dishes[0].section).toBe('');
	});

	it('returns the heading as printed rather than tidying its case', () => {
		expect(parseMenuText('BBQ AND SMOKE\nRibs 14').dishes[0].section).toBe('BBQ AND SMOKE');
	});
});

describe('finding the price', () => {
	it('takes a price off the end however it was separated from the name', () => {
		expect(one('Crispy squid 9.5').price).toBe('9.5');
		expect(one('Crispy squid ....... 9.5').price).toBe('9.5');
		expect(one('Crispy squid\t9.5').price).toBe('9.5');
		expect(one('Crispy squid __________ 9.5').price).toBe('9.5');
	});

	it('keeps the currency exactly where the menu put it, or left it out', () => {
		const cases = ['12', '12.5', '12.50', '£12', '$12', '12€', '14 GBP', '£ 12', '50p'];
		for (const price of cases) {
			expect(one(`Crispy squid ${price}`).price).toBe(price);
		}
	});

	it('keeps two sizes on one line whole, because that is what the menu is selling', () => {
		expect(one('Soup 6/9').price).toBe('6/9');
		expect(one('Soup 6 / 9').price).toBe('6 / 9');
		expect(one('House Albariño Glass 8 Bottle 30').price).toBe('Glass 8 Bottle 30');
		expect(one('House Albariño Glass 8 Bottle 30').name).toBe('House Albariño');
	});

	it('keeps market price as printed', () => {
		for (const price of ['MP', 'M/P', 'POA', 'market price']) {
			const dish = one(`Whole lobster ${price}`);
			expect(dish.price).toBe(price);
			expect(dish.name).toBe('Whole lobster');
		}
	});

	it('leaves a number that belongs to the name in the name', () => {
		expect(one('Pinot Noir 2019 £42').name).toBe('Pinot Noir 2019');
		expect(one('Half chicken 14')).toMatchObject({ name: 'Half chicken', price: '14' });
		expect(one('Pizza 12 inch')).toMatchObject({ name: 'Pizza 12 inch', price: '' });
	});

	it('never invents a price it could not find', () => {
		expect(one('Soup of the day')).toMatchObject({ price: '', confidence: 'low' });
	});

	it('does not repair an OCR digit, because that would be inventing the price', () => {
		// The scan read 9.5 as 9.S. A row with no price is a row the cook fixes; a
		// row priced 9.5 on this parser's guess is a row nobody checks.
		expect(one('Crispy squid 9.S')).toMatchObject({
			name: 'Crispy squid 9.S',
			price: '',
			confidence: 'low'
		});
	});
});

describe('names and descriptions', () => {
	it('splits on a dash, a colon or a pipe and trusts the result', () => {
		for (const line of [
			'Whole plaice - brown shrimp butter 24',
			'Whole plaice – brown shrimp butter 24',
			'Whole plaice: brown shrimp butter 24',
			'Whole plaice | brown shrimp butter 24'
		]) {
			expect(one(line)).toMatchObject({
				name: 'Whole plaice',
				description: 'brown shrimp butter',
				confidence: 'high'
			});
		}
	});

	it('splits on a comma but says the row is a guess', () => {
		expect(one('Crispy squid, lemon aioli 9.5')).toMatchObject({
			name: 'Crispy squid',
			description: 'lemon aioli',
			confidence: 'low'
		});
	});

	it('takes a description off the next line, indented or not', () => {
		expect(one('Roast chicken 16\n  bread sauce and greens').description).toBe(
			'bread sauce and greens'
		);
		expect(one('Roast chicken 16\nbread sauce and greens').description).toBe(
			'bread sauce and greens'
		);
	});

	it('takes two run-on lines and then stops', () => {
		const { dishes } = parseMenuText('Roast chicken 16\nbread sauce\nand greens\nand a fourth line');
		expect(dishes[0].description).toBe('bread sauce and greens');
		expect(dishes).toHaveLength(2);
		expect(dishes[1].name).toBe('and a fourth line');
	});

	it('keeps a word an OCR pass split in half with the dish it belongs to', () => {
		expect(one('Slow-roast pork bel 19\nly with apple sauce').description).toBe(
			'ly with apple sauce'
		);
	});

	it('never emits a row with no name', () => {
		expect(parseMenuText('9.50').dishes).toEqual([]);
		expect(parseMenuText('(v)').dishes).toEqual([]);
		expect(parseMenuText('9.50').skipped).toEqual(['9.50']);
	});

	it('takes a takeaway menu number off the front of the dish', () => {
		expect(one('12. Sweet and sour pork 8.20')).toMatchObject({
			name: 'Sweet and sour pork',
			price: '8.20'
		});
		expect(one('13) Kung po chicken 8.60').name).toBe('Kung po chicken');
		// The row this was found on. Before the number came off, ' - ' read as the
		// kitchen separating a name from a description and this came back as a
		// dish called '14', marked high confidence because nothing had been
		// guessed on that reading.
		expect(one('14 - Egg fried rice 3.90')).toMatchObject({
			name: 'Egg fried rice',
			description: '',
			price: '3.90',
			confidence: 'high'
		});
	});

	it('shows the cook the numbering it took off, in raw', () => {
		expect(one('12. Sweet and sour pork 8.20').raw).toBe('12. Sweet and sour pork 8.20');
	});

	it('leaves a number alone that is not a menu numbering', () => {
		// A hyphenated name, a menu that prints the price first, and a page number
		// on its own line: none of them is a dish index and none of them may lose
		// its front.
		expect(one('5-spice duck 18').name).toBe('5-spice duck');
		expect(one('12.50 Soup of the day').name).toBe('12.50 Soup of the day');
		expect(parseMenuText('12.').dishes).toEqual([]);
	});
});

describe('dietary marks the menu printed', () => {
	it('takes a bracketed mark out of the name and into tags', () => {
		expect(one('Falafel (v) 8.50')).toMatchObject({ name: 'Falafel', tags: ['v'] });
		expect(one('Falafel [GF] 8.50')).toMatchObject({ name: 'Falafel', tags: ['gf'] });
		expect(one('Dhal (vg, gf) 9')).toMatchObject({ name: 'Dhal', tags: ['vg', 'gf'] });
		expect(one('Dhal (vegan) 9').tags).toEqual(['vg']);
	});

	it('takes a bare mark off either side of the price', () => {
		expect(one('Falafel v 8.50')).toMatchObject({ name: 'Falafel', tags: ['v'] });
		expect(one('Falafel 8.50 v')).toMatchObject({ name: 'Falafel', tags: ['v'] });
		expect(one('Dhal ve 9').tags).toEqual(['vg']);
		expect(one('Pistachio cake n 7').tags).toEqual(['n']);
	});

	it('leaves a bracket alone when it is not a mark', () => {
		expect(one('Crispy squid (served cold) 9.5').name).toBe('Crispy squid (served cold)');
	});

	it('leaves a word alone that merely starts like a mark', () => {
		expect(one('Mixed veg 4')).toMatchObject({ name: 'Mixed veg', tags: [] });
	});

	it('strips a decorative symbol but invents no meaning for it', () => {
		// The legend explaining the diamond is printed somewhere this parser cannot
		// see. Guessing at it would be putting a dietary claim in the kitchen's mouth.
		expect(one('Ribeye ◆ 34')).toMatchObject({ name: 'Ribeye', tags: [] });
	});

	it('infers nothing from a dish name or a description', () => {
		expect(one('Peanut satay chicken, coconut and lime 14').tags).toEqual([]);
		expect(one('Vegan chocolate torte 8').tags).toEqual([]);
		expect(one('Gluten free brownie 6').tags).toEqual([]);
	});
});

describe('what a menu says that is not a dish', () => {
	const NOTICES = [
		'All prices include VAT',
		'A discretionary service charge of 12.5% is added to your bill',
		'Please inform us of any allergies or intolerances',
		'We cannot guarantee the absence of nuts',
		'020 7946 0958',
		'Tel 020 7946 0958',
		'12 Bridge Street, Hebden Bridge',
		'hello@example.com',
		'www.example.com',
		'https://example.com',
		'Follow us @worldtable',
		'Open Mon - Fri 12 - 3pm',
		'Served Saturday 12pm to 4pm',
		'Page 2',
		'2'
	];

	it('sends every one of them to skipped and none of them to the menu', () => {
		for (const notice of NOTICES) {
			const { dishes, skipped } = parseMenuText(notice);
			expect({ notice, dishes: dishes.length }).toEqual({ notice, dishes: 0 });
			expect(skipped).toEqual([notice]);
		}
	});

	it('still sells a dish whose name carries a day or a number', () => {
		expect(one('Sunday roast 18.50')).toMatchObject({ name: 'Sunday roast', price: '18.50' });
		expect(one('Bottomless Saturday brunch 35')).toMatchObject({ price: '35' });
	});
});

describe('confidence means something', () => {
	it('is high only for a row nothing had to be guessed about', () => {
		expect(one('Sticky toffee pudding 8').confidence).toBe('high');
	});

	it('is low when there is no price', () => {
		expect(one('Sticky toffee pudding').confidence).toBe('low');
	});

	it('is low when the name is long enough to be a whole sentence read as one', () => {
		const long = 'Slow roasted shoulder of Yorkshire lamb with anchovy and rosemary and beans 26';
		expect(one(long).confidence).toBe('low');
		expect(one(long).name.length).toBeGreaterThan(60);
	});

	it('is low when the name and description were split on a comma', () => {
		expect(one('Ham, egg and chips 12').confidence).toBe('low');
	});
});

describe('the parser is total', () => {
	it('takes anything at all without throwing', () => {
		const inputs = [
			'',
			'   ',
			'\n\n\n',
			'\r\n\r\n',
			'£',
			'((((',
			'---------',
			'0'.repeat(500),
			'a\tb\tc',
			'😀 9.50',
			'  Olives 4'
		];
		for (const input of inputs) {
			expect(() => parseMenuText(input)).not.toThrow();
		}
		expect(parseMenuText('')).toEqual({ dishes: [], skipped: [] });
		expect(parseMenuText(null as never)).toEqual({ dishes: [], skipped: [] });
		expect(parseMenuText(undefined as never)).toEqual({ dishes: [], skipped: [] });
	});

	it('reads a menu typed with non-breaking spaces', () => {
		expect(one('Olives   4')).toMatchObject({ name: 'Olives', price: '4' });
	});

	it('stops at the size guard and says so rather than reading half a menu in silence', () => {
		const huge = 'Crispy squid 9.50\n'.repeat(20000);
		const started = Date.now();
		const { dishes, skipped } = parseMenuText(huge);
		expect(Date.now() - started).toBeLessThan(5000);
		expect(dishes.length).toBeLessThanOrEqual(5000);
		expect(skipped[skipped.length - 1]).toMatch(/^Only the first 200,000 characters were read/);
	});
});

describe('a bracket is never split down the middle', () => {
	/**
	 * A menu that keys its allergens on the dish prints them in one bracket, and
	 * the comma inside it is not the kitchen separating a name from a garnish.
	 * Splitting there produced a dish called 'Sticky toffee pudding (N' with
	 * 'G, D)' for a description: two halves of a bracket in two fields, and
	 * neither of them a dish.
	 */
	it('keeps a bracketed allergen key on the name, and reads none of it', () => {
		const [dish] = parseMenuText('Sticky toffee pudding (N, G, D) 8').dishes;
		expect(dish.name).toBe('Sticky toffee pudding (N, G, D)');
		expect(dish.description).toBe('');
		expect(dish.price).toBe('8');
		// The letters are the menu's own legend. They are not dietary marks this
		// module knows, so they stay in the name for the cook to tidy, and they
		// never become tags and never become allergens.
		expect(dish.tags).toEqual([]);
	});

	it('still splits on punctuation that sits outside the bracket', () => {
		const [dish] = parseMenuText('Chicken tikka masala (G, D) - with pilau rice 13.50').dishes;
		expect(dish.name).toBe('Chicken tikka masala (G, D)');
		expect(dish.description).toBe('with pilau rice');
	});

	it('still splits an ordinary comma when no bracket is involved', () => {
		const [dish] = parseMenuText('Crispy squid, lemon aioli 9.5').dishes;
		expect(dish.name).toBe('Crispy squid');
		expect(dish.description).toBe('lemon aioli');
		expect(dish.confidence).toBe('low');
	});
});

describe('an imported dish carries no allergen information', () => {
	/**
	 * The rule the whole feature turns on. `MenuDish.allergens` and
	 * `MenuDish.allergensCheckedAt` are what separate "this dish carries none"
	 * from "nobody has looked yet", and a photograph of a menu cannot tell anybody
	 * which of those is true. So this parser has nowhere to put an allergen even
	 * if it wanted one, and that is asserted here rather than left to good
	 * intentions: adding the field is what would have to fail, not using it.
	 */
	it('has no allergen field to fill in, on any row', () => {
		const { dishes } = parseMenuText(
			'STARTERS\nPeanut satay skewers (gf) 9\nSesame prawn toast, soy dip 8\nMilk chocolate torte 7'
		);
		expect(dishes).toHaveLength(3);
		for (const dish of dishes) {
			expect(Object.keys(dish).sort()).toEqual([
				'confidence',
				'description',
				'name',
				'price',
				'raw',
				'section',
				'tags'
			]);
			expect('allergens' in dish).toBe(false);
			expect('allergensCheckedAt' in dish).toBe(false);
		}
	});

	it('reads a printed mark as a printed mark and nothing more', () => {
		// (gf) on the satay is what the kitchen wrote on the page. It is not a
		// screening of the dish, and the peanut in the name produces nothing.
		expect(one('Peanut satay skewers (gf) 9').tags).toEqual(['gf']);
	});
});
