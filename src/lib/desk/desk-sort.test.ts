import { describe, it, expect } from 'vitest';
import { classify, type SortInput } from './desk-sort';

/**
 * The sorter's weighted signals and its one rule: the best kind wins only
 * when it leads by two and the heading does not point elsewhere, and
 * anything else is `unsure` with `could` in score order, never a silent
 * guess. Dish is what remains, not what is recognised, so there is no food
 * vocabulary to test here at all.
 */

const input = (over: Partial<SortInput>): SortInput => ({
	name: '',
	headings: [],
	body: [],
	pourLabelled: false,
	vintage: '',
	bin: '',
	...over
});

describe('section vocabulary', () => {
	it('reads the heading and the one above it as a run', () => {
		expect(classify(input({ name: 'Ployez-Jacquemart', headings: ['WINE BY GLASS', 'OUR WINE PROGRAM'] })).kind).toBe('wine');
		expect(classify(input({ name: 'Ployez-Jacquemart', headings: ['BY THE GLASS', 'OUR WINE PROGRAM'] })).kind).toBe('wine');
		expect(classify(input({ name: 'Holy Trinity', headings: ['FEATURED COCKTAILS'] })).kind).toBe('cocktail');
		expect(classify(input({ name: 'Shrimp & Tasso', headings: ['STARTERS'] })).kind).toBe('dish');
	});

	it('takes the longer phrase first, so dessert wines are wine and not pudding', () => {
		expect(classify(input({ name: 'Sauternes', headings: ['DESSERT WINES'] })).kind).toBe('wine');
		expect(classify(input({ name: 'Sticky toffee', headings: ['DESSERTS'] })).kind).toBe('dish');
	});

	it('reads a region or a country alone as a wine heading', () => {
		expect(classify(input({ name: 'Penfolds Grange', headings: ['AUSTRALIA'] })).kind).toBe('wine');
		expect(classify(input({ name: 'Krug', headings: ['CHAMPAGNE', 'THE CELLAR LIST'] })).kind).toBe('wine');
	});

	it('points nowhere on a heading that names two kinds, and reads the line instead', () => {
		expect(classify(input({ name: 'Olives', headings: ['WINE & COCKTAILS'] })).kind).toBe('dish');
		expect(classify(input({ name: 'Sancerre 2022', headings: ['WINE & COCKTAILS'] })).kind).toBe('wine');
	});

	it('sends a spirits or beer list to unsure with nothing in could, because no room keeps it', () => {
		for (const heading of ['SPIRITS', 'WHISKY', 'BEER', 'ON TAP', 'DRAUGHT', 'SOFT DRINKS']) {
			expect(classify(input({ name: 'Something', headings: [heading] }))).toMatchObject({ kind: 'unsure', could: [] });
		}
	});
});

describe('wine line signals', () => {
	it('reads a vintage, a pour label and a bin as wine without any heading', () => {
		expect(classify(input({ name: 'Pinot Noir 2019' })).kind).toBe('wine');
		expect(classify(input({ name: 'Ployez-Jacquemart', vintage: '2010', pourLabelled: true })).kind).toBe('wine');
		expect(classify(input({ name: 'Sancerre', bin: '101', body: ['Loire, France'] })).kind).toBe('wine');
	});

	it('reads a name that is nothing but wine vocabulary as wine', () => {
		expect(classify(input({ name: 'Chablis' })).kind).toBe('wine');
		expect(classify(input({ name: 'Rioja Reserva' })).kind).toBe('wine');
	});

	it('scores a region only inside a part read whole, so a soup that mentions sherry is a soup', () => {
		expect(
			classify(
				input({
					name: 'Turtle Soup au Sherry',
					headings: ['SOUPS & SALADS'],
					body: ['The authentic Louisiana favorite with veal fond, egg and crushed lemon, finished with a splash of aged Sherry']
				})
			).kind
		).toBe('dish');
		expect(classify(input({ name: 'Marseilles to Morocco', headings: ['STARTERS'] })).kind).toBe('dish');
		// Thirteen words, two bottles, and 'over' and 'with': prose, so a dish.
		expect(classify(input({ name: 'Café Pierre Painted Texas Quail', headings: ['THREE COURSE OFFERINGS'], body: ['Texas quail over braised choucroute with sticky Grand Marnier & Cognac jus'] })).kind).toBe('dish');
	});
});

describe('cocktail line signals', () => {
	it('reads a list with a spirit or liqueur part as a cocktail without any heading', () => {
		expect(classify(input({ name: 'Holy Trinity', body: ['trinity infused gin | benedictine | lime'] })).kind).toBe('cocktail');
		expect(classify(input({ name: 'Fuzzy Buffalo', body: ['bourbon, basil, peach, lemon'] })).kind).toBe('cocktail');
	});

	it('reads a classic by its name', () => {
		expect(classify(input({ name: 'Negroni' })).kind).toBe('cocktail');
		expect(classify(input({ name: 'Old Fashioned' })).kind).toBe('cocktail');
		expect(classify(input({ name: 'Gin & Tonic' })).kind).toBe('cocktail');
	});

	it('does not read a dish for its bottles when the description is prose', () => {
		// Two bottles in a long sentence are ingredients, not a spec.
		expect(
			classify(
				input({
					name: 'Bourbon Glazed Pork Belly',
					body: ['Slow roasted pork belly glazed with bourbon and maple, served over grits with a pickled apple salad and a cognac reduction']
				})
			).kind
		).toBe('dish');
	});

	it('counts a short body naming two bottles as a real signal', () => {
		const r = classify(input({ name: 'Kiss the Crab', body: ['Blue crab-brown butter washed Zacapa No. 23 Solera, banana oleosacrum, dry vermouth, orange peel'] }));
		expect(r.kind).toBe('cocktail');
	});
});

describe('the unsure rule', () => {
	it('makes Kiss the Crab unsure under a tasting heading, both kinds offered in score order', () => {
		const r = classify(
			input({
				name: 'Kiss the Crab',
				headings: ['Chef Meg’s Playground Tasting Menu'],
				body: ['Blue crab-brown butter washed Zacapa No. 23 Solera, banana oleosacrum, dry vermouth, orange peel']
			})
		);
		expect(r.kind).toBe('unsure');
		// The heading's three for dish outrank the two bottles' two for cocktail.
		expect(r.could).toEqual(['dish', 'cocktail']);
		expect(r.why[0]).toBe('Could be a dish or a cocktail: the heading points one way and the line reads another.');
	});

	it('makes a wine-shaped line under a cocktail heading unsure rather than guessing', () => {
		const r = classify(input({ name: 'Sancerre 2022', headings: ['COCKTAILS'], body: ['Loire, France'] }));
		expect(r.kind).toBe('unsure');
		expect(r.could).toContain('wine');
		expect(r.could).toContain('cocktail');
	});

	it('needs a lead of two before a kind wins with no heading to help', () => {
		// A vintage alone scores two: wine.
		expect(classify(input({ name: 'Something 2019' })).kind).toBe('wine');
		// A single stray bottle word scores one: not enough, so it is a dish.
		expect(classify(input({ name: 'Gin cured salmon' })).kind).toBe('dish');
		// A vintage and a descriptor line beside a short spec: neither leads by
		// two, so unsure with both offered.
		const r = classify(input({ name: 'Something 2019', body: ['Loire, France', 'gin, vermouth'] }));
		expect(r.kind).toBe('unsure');
		expect([...r.could].sort()).toEqual(['cocktail', 'wine']);
	});

	it('never puts a stray word in could', () => {
		// A spec with two bottles under a food heading is unsure between the two;
		// the 'Sherry' at its end sits in a part not read whole and scores nothing,
		// so wine is never offered on the strength of one stray word.
		const r = classify(input({ name: 'Kiss the Crab', headings: ['TASTING MENU'], body: ['rum, dry vermouth, a splash of Sherry'] }));
		expect(r.kind).toBe('unsure');
		expect(r.could).toEqual(['cocktail', 'dish']);
	});

	it('leans on the heading alone when the line says nothing, and says so', () => {
		const wine = classify(input({ name: 'Petit-Freylon', headings: ['WINE BY GLASS'] }));
		expect(wine).toMatchObject({ kind: 'wine', why: ['Read as a wine from the heading alone.'] });
		const cocktail = classify(input({ name: 'Fuzzy Buffalo', headings: ['COCKTAILS'] }));
		expect(cocktail).toMatchObject({ kind: 'cocktail', why: ['Read as a cocktail from the heading alone.'] });
	});

	it('writes its reasons in the house voice', () => {
		const reasons = [
			classify(input({ name: 'Kiss the Crab', headings: ['TASTING'], body: ['gin | vermouth'] })).why,
			classify(input({ name: 'Something', headings: ['BEER'] })).why,
			classify(input({ name: 'Something', headings: ['WINE'] })).why
		].flat();
		for (const reason of reasons) {
			expect(reason).not.toContain('\u2014');
			expect(reason).not.toContain([' ', '--', ' '].join(''));
			expect(reason.trim()).toMatch(/[.]$/);
		}
	});
});
