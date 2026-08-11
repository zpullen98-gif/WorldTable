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
