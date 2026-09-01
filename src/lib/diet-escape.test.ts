import { describe, it, expect } from 'vitest';
import indexJson from './data/recipes.index.json';
import fullJson from './data/recipes.full.json';

import type { RecipeSummary, RecipeDetail } from './types';

/**
 * The escape rule, and the two things it must never do.
 *
 * `lineIsEscaped()` in tools/derive/diet.mjs drops an ingredient line that
 * offers a real alternative, so that a dish with an optional fish filling can
 * still read as vegetarian. That is correct, and vegetarian status still uses
 * it. But `containsFish` and `containsShellfish` read from the ESCAPED set
 * until this was measured, and the escape silenced allergens through both of
 * its routes:
 *
 *   Weeknight paella — "Chicken thighs, chorizo optional (heresy but
 *   delicious), shrimp". OPTIONAL_MARKER exists to excuse the chorizo. It threw
 *   away the whole line, and the shrimp with it.
 *
 *   Escabecheng Isda — "1 whole tilapia, snapper or pompano (~800g), scored,
 *   salted, and fried WHOLE in hot oil". The `or` rule found no keyword in
 *   "pompano", matched `oil` in VEG_ALTERNATIVE, and escaped a whole fish. It
 *   shipped containsFish:false AND a Vegan badge.
 *
 * dairy and egg were moved to the all-lines reading for exactly this reason
 * when panna cotta shipped vegan:true over "500ml cream". These are the
 * assertions that stop fish and shellfish going back.
 */
const recipes = indexJson as unknown as RecipeSummary[];
const bySlug = new Map(recipes.map((r) => [r.slug, r]));
const details = fullJson as unknown as RecipeDetail[];

const FISH_WITNESS =
	/\b(anchov(?:y|ies)|salmon|tuna|cod|haddock|halibut|snapper|tilapia|sardines?|mackerel|katsuobushi|bonito|dashi|fish sauce|nam pla|worcestershire)\b/i;
/* oyster mushroom and king oyster are fungi, and the scallop shape cut from
   a king oyster stem is still a mushroom. The lookahead keeps a real oyster
   failing this test while letting the vegetable-led chapter say what it is. */
const SHELLFISH_WITNESS =
	/\b(shrimps?|prawns?|crabs?|lobsters?|scallops?(?! cut from| from a king)|oysters?(?! mushrooms?)|clams?|mussels?|squid|calamari|octopus|langoustines?)\b/i;
/* Ingredient lines that name a shellfish only to say the dish has none. */
const SHELLFISH_EXEMPT = /\b(king oyster|oyster mushrooms?)\b/i;
/* Dashi made without bonito. The Kyoto and Okinawa chapters write
   "kombu dashi, kombu only" precisely so the dish can be vegetarian, and
   the diet table already excepts it; without the same exception here the
   test demands a fish allergen on a broth made of kelp. */
const FISH_EXEMPT = /\b(kombu dashi|shiitake dashi|shojin dashi|vegetarian dashi|vegan dashi)\b/i;

describe('an escape never silences an allergen', () => {
	/**
	 * The headline cases, named. A count-based assertion would pass again the
	 * moment somebody re-broke it on different recipes.
	 */
	it('flags the shrimp in a paella whose line says "chorizo optional"', () => {
		expect(bySlug.get('weeknight-paella')?.diet.containsShellfish).toBe(true);
	});

	it('flags the fish in a whole fried snapper, and refuses to call it vegan', () => {
		const d = bySlug.get('escabecheng-isda')?.diet;
		expect(d?.containsFish, 'a whole tilapia escaped through the `or` rule').toBe(true);
		expect(d?.vegan, 'a Vegan badge over a whole fried fish').toBe(false);
	});

	it('flags the katsuobushi in miso soup even though it offers a vegan route', () => {
		expect(bySlug.get('miso-soup')?.diet.containsFish).toBe(true);
	});

	/**
	 * The sweep the named cases are examples of.
	 *
	 * Read the INGREDIENTS, never the name. The first draft of this test swept
	 * recipe names and failed on "Cape Cod Cranberry Relish" — cod inside a
	 * place name, in a bowl holding cranberries, sugar and an orange. Names carry
	 * geography; the build carries the food.
	 */
	it('flags every recipe whose own build names a fish or shellfish', () => {
		const missed: string[] = [];
		for (const r of details) {
			const text = r.ingredients
				.map((i) => (typeof i === 'string' ? i : ((i as { text?: string }).text ?? '')))
				.join(' | ');
			const diet = bySlug.get(r.slug)?.diet;
			if (!diet) continue;
			if (FISH_WITNESS.test(text) && !FISH_EXEMPT.test(text) && !diet.containsFish)
				missed.push(`${r.slug} (fish)`);
			if (SHELLFISH_WITNESS.test(text) && !SHELLFISH_EXEMPT.test(text) && !diet.containsShellfish)
				missed.push(`${r.slug} (shellfish)`);
		}
		expect(missed).toEqual([]);
	});
});

describe('the two policies stay separate', () => {
	/**
	 * The proof that moving the allergen flags did NOT move vegetarian status.
	 * Onigiri's fillings line names tuna and salmon and is legitimately escaped,
	 * so it is vegetarian-strict AND carries a fish allergen. If these two ever
	 * agree on this recipe, one of the policies has swallowed the other.
	 */
	it('a dish can be vegetarian-strict and still carry a fish allergen', () => {
		const d = bySlug.get('onigiri')?.diet;
		expect(d?.containsFish, 'the allergen reads every line').toBe(true);
		expect(d?.vegetarianStrict, 'vegetarian status still reads binding lines only').toBe(true);
	});

	it('keeps a real population on each side, so neither assertion is vacuous', () => {
		const both = recipes.filter((r) => r.diet.vegetarianStrict && r.diet.containsFish);
		expect(both.length).toBeGreaterThan(5);
	});
});

describe('vegan is an assertion, not an omission', () => {
	/**
	 * `vegetarianOption` means BY DEFINITION that an animal product is named
	 * somewhere in the text and merely escaped. 16 recipes shipped it alongside
	 * `vegan: true`, and RecipeDetailView paints the badge straight off `vegan`.
	 */
	it('never claims vegan and vegetarian-option at once', () => {
		const contradictory = recipes
			.filter((r) => r.diet.vegan && r.diet.vegetarianOption)
			.map((r) => r.slug);
		expect(contradictory).toEqual([]);
	});

	it('never claims vegan over any animal flag', () => {
		const lying = recipes
			.filter(
				(r) =>
					r.diet.vegan &&
					(r.diet.containsMeat ||
						r.diet.containsFish ||
						r.diet.containsShellfish ||
						r.diet.containsDairy ||
						r.diet.containsEgg)
			)
			.map((r) => r.slug);
		expect(lying).toEqual([]);
	});

	it('still calls something vegan, or the rule has eaten the feature', () => {
		expect(recipes.filter((r) => r.diet.vegan).length).toBeGreaterThan(50);
	});
});

/**
 * The corpus side of `veganOption`. The unit cases live in diet.test.ts; these
 * assert what the built data actually carries, which is the thing the page
 * paints.
 */
describe('vegan option is the weaker claim, and stays weaker', () => {
	it('carries the six recipes the vegan gate took the badge from', () => {
		// Four are Ethiopian fasting cooking, which states the route in words.
		for (const slug of [
			'misir-wat',
			'gomen-wat',
			'kik-alicha',
			'atkilt-wat',
			'orange-and-cinnamon-salad',
			'bagels'
		]) {
			const d = bySlug.get(slug)?.diet;
			expect(d, slug).toBeTruthy();
			expect(d?.vegan, `${slug} is not vegan as written`).toBe(false);
			expect(d?.veganOption, `${slug} states a vegan route`).toBe(true);
		}
	});

	it('never fires alongside vegan or vegetarianOption', () => {
		expect(recipes.filter((r) => r.diet.veganOption && r.diet.vegan).map((r) => r.slug)).toEqual([]);
		expect(
			recipes.filter((r) => r.diet.veganOption && r.diet.vegetarianOption).map((r) => r.slug)
		).toEqual([]);
	});

	it('always has something to be an option around', () => {
		// Otherwise it is plain `vegan` and should have said so.
		const empty = recipes
			.filter(
				(r) =>
					r.diet.veganOption &&
					!r.diet.containsDairy &&
					!r.diet.containsEgg &&
					!r.diet.containsHoney
			)
			.map((r) => r.slug);
		expect(empty).toEqual([]);
	});

	it('did not move the vegan population it was carved out beside', () => {
		expect(recipes.filter((r) => r.diet.vegan).length).toBeGreaterThan(50);
		expect(recipes.filter((r) => r.diet.veganOption).length).toBeGreaterThan(5);
	});
});
