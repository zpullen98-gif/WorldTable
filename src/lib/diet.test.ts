import { describe, it, expect } from 'vitest';
import { deriveDiet } from '../../tools/derive/diet.mjs';

/**
 * Allergen derivation, which shipped for eleven phases with no test at all.
 *
 * An allergen error has a dangerous direction: under-reporting. When the flags
 * come out empty the recipe page renders no "Contains" block whatsoever, which
 * a coeliac reads as "no allergens" rather than "we did not check". Every case
 * below is a real corpus line that was WRONG in production.
 */
const recipe = (name: string, ingredients: string[]) => ({ n: name, i: ingredients, v: 0 });

describe('gluten', () => {
	it('reads bare "soy" as soy sauce, which is wheat-brewed', () => {
		// The corpus writes "4 tbsp soy" far more often than "soy sauce".
		expect(deriveDiet(recipe('Gyoza', ['1 tbsp soy, 1 tsp sesame oil'])).containsGluten).toBe(true);
		expect(deriveDiet(recipe('Oyakodon', ['2 tbsp each soy and mirin'])).containsGluten).toBe(true);
	});

	it('does not read the bean itself as gluten', () => {
		expect(deriveDiet(recipe('Edamame', ['200g edamame, salted'])).containsGluten).toBe(false);
		expect(deriveDiet(recipe('Tofu', ['soybeans, water, nigari'])).containsGluten).toBe(false);
		expect(deriveDiet(recipe('Latte', ['250ml soy milk'])).containsGluten).toBe(false);
	});

	it('still catches the obvious wheat carriers', () => {
		expect(deriveDiet(recipe('Pasta', ['400g spaghetti'])).containsGluten).toBe(true);
		expect(deriveDiet(recipe('Bibimbap', ['2 tbsp gochujang'])).containsGluten).toBe(true);
	});
});

describe('dairy and egg are allergens, not vegetarian judgements', () => {
	it('reports dairy that sits in an "or" clause with a vegetarian alternative', () => {
		// The escape rule only disqualifies segments carrying meat/fish/shellfish,
		// so a dairy line used to license its own escape and vanish.
		const d = deriveDiet(
			recipe('Panna Cotta', [
				'500ml cream + 150ml milk',
				'1 vanilla bean, split and scraped (or 1 tsp paste)'
			])
		);
		expect(d.containsDairy).toBe(true);
		expect(d.vegan).toBe(false);
	});

	it('reports an optional garnish — the allergen exists whether or not you add it', () => {
		const d = deriveDiet(recipe('Soup', ['1L stock', 'Sour cream to serve (optional)']));
		expect(d.containsDairy).toBe(true);
	});

	it('leaves a genuinely plant-based dish vegan', () => {
		const d = deriveDiet(recipe('Dal', ['200g red lentils', '1 tbsp coconut oil', 'Cumin, turmeric']));
		expect(d.vegan).toBe(true);
		expect(d.containsDairy).toBe(false);
	});
});

describe('substring collisions', () => {
	it('does not read "char siu" or "char kway teow" as fish', () => {
		expect(deriveDiet(recipe('Char Siu Pork', ['1kg pork shoulder'])).containsFish).toBe(false);
		expect(deriveDiet(recipe('Char Kway Teow', ['200g flat rice noodles'])).containsFish).toBe(false);
	});

	it('still reads arctic char as fish', () => {
		expect(deriveDiet(recipe('Roast Char', ['2 arctic char fillets'])).containsFish).toBe(true);
	});
});

describe('the vocabulary widening: words the tables never learned', () => {
	/* Every ingredient line below is copied from a corpus recipe that shipped
	   the flag as false. The screen line on the recipe page is an affirmative
	   claim, "Screened for: gluten, dairy, ...", so a hole in the table reads to
	   the reader as clearance rather than as silence. */

	it('reads Italian and named breads as gluten', () => {
		const g = (n: string, i: string[]) => deriveDiet(recipe(n, i)).containsGluten;
		expect(g('Tortellini in Brodo', ['300 g farina 00'])).toBe(true);
		expect(g('Semola e Acqua', ['500 g semola rimacinata di grano duro'])).toBe(true);
		expect(g('Tiramisu', ['~24 savoiardi'])).toBe(true);
		expect(g('Philly Cheesesteak', ['4 Amoroso-style hoagie rolls'])).toBe(true);
		expect(g('Torta Ahogada', ['4 birote rolls'])).toBe(true);
		expect(g('Sonoran Hot Dog', ['4 bolillo or bakery-style buns'])).toBe(true);
		expect(g('Baltimore Pit Beef', ['Kaiser rolls'])).toBe(true);
		expect(g('Matzo Ball Soup', ['120g matzo meal'])).toBe(true);
	});

	it('reads cultured fats and regional cheeses as dairy', () => {
		const d = (n: string, i: string[]) => deriveDiet(recipe(n, i)).containsDairy;
		expect(d('Misir Wat', ['3 tbsp niter kibbeh'])).toBe(true);
		expect(d('Mahshi Kromb', ['60 g samna'])).toBe(true);
		expect(d('Ash-e Reshteh', ['200 g kashk'])).toBe(true);
		expect(d('Shchi', ['Smetana and black bread'])).toBe(true);
		expect(d('Cobb Salad', ['150g Roquefort, crumbled'])).toBe(true);
		expect(d('Munster au Cumin', ['1 whole farmhouse munster, about 400 g'])).toBe(true);
		expect(d('Chechebsa', ['80 g ayib, to serve'])).toBe(true);
	});

	it('reads grapes, regions and regional spirits as alcohol', () => {
		const a = (n: string, i: string[]) => deriveDiet(recipe(n, i)).containsAlcohol;
		expect(a('Poires à la Beaujolaise', ['750 ml Beaujolais, a young Gamay'])).toBe(true);
		expect(a('Boeuf Bourguignon', ['1 bottle Burgundy or pinot noir'])).toBe(true);
		expect(a('Coq au Riesling', ['500 ml dry Riesling'])).toBe(true);
		expect(a('Rafutē', ['400ml awamori'])).toBe(true);
		expect(a('Moros y Cristianos', ['60ml vino seco'])).toBe(true);
		expect(a('Beef and Guinness Stew', ['500ml Guinness'])).toBe(true);
	});

	it('does not read cider vinegar as alcohol, which is why the key is "hard cider"', () => {
		expect(deriveDiet(recipe('Slaw', ['2 tbsp cider vinegar'])).containsAlcohol).toBe(false);
		expect(deriveDiet(recipe('Braise', ['500ml hard cider'])).containsAlcohol).toBe(true);
	});

	it('refuses the vegan badge over honey, and keeps honey off the allergen screen', () => {
		const d = deriveDiet(recipe('Kansas Wheat Bread', ['500g flour', '2 tbsp honey']));
		expect(d.containsHoney).toBe(true);
		expect(d.vegan).toBe(false);
	});

	it('does not read honeycomb tripe, or a honeycombed batter, as honey', () => {
		// Both are real corpus lines. The right-hand word boundary is what stops
		// them, and it is the reason 'honeycomb' is NOT a key.
		expect(deriveDiet(recipe('Trippa', ['1 kg honeycomb tripe'])).containsHoney).toBe(false);
		expect(deriveDiet(recipe('Idli', ['batter honeycombed against the bowl'])).containsHoney).toBe(
			false
		);
	});
});

describe('a denial is not a declaration', () => {
	it('does not flag the ingredient a recipe insists it has none of', () => {
		// Tarta de Santiago is a flourless almond cake and shipped containsGluten,
		// which denied a coeliac the one dessert in the chapter they could eat.
		const t = deriveDiet(
			recipe('Tarta de Santiago', ['250g ground almonds; there is NO flour, and there never was'])
		);
		expect(t.containsGluten).toBe(false);

		expect(
			deriveDiet(recipe('Vongole', ['A mountain of parsley; NO CHEESE'])).containsDairy
		).toBe(false);
		expect(
			deriveDiet(recipe('Baklava', ['200g sugar, lemon: NO honey in Turkish baklava'])).containsHoney
		).toBe(false);
	});

	it('still declares an ingredient that is merely rationed', () => {
		// "no more than" is not a denial, and the butter is real.
		expect(
			deriveDiet(recipe('Sauce', ['no more than 2 tbsp butter'])).containsDairy
		).toBe(true);
	});
});
