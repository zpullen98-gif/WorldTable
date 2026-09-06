import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CHECKED, CHECKED_FLAGS, NOT_SCREENED, NOT_ALLERGENS } from './allergens';
import indexJson from './data/recipes.index.json';

import type { RecipeSummary } from './types';

/**
 * The allergen screen.
 *
 * The recipe page rendered a "Contains" heading only when at least one flag
 * was true, so 101 of 970 recipes showed nothing at all — hummus among them,
 * over an ingredient line reading '150g good tahini'. Absence read as
 * clearance. diet.mjs's own comment already stated the policy the display was
 * breaking: an empty list 'reads as no allergens rather than we do not know'.
 *
 * These assertions are what stop it drifting back.
 */
const recipes = indexJson as unknown as RecipeSummary[];

describe('the vocabulary is closed', () => {
	/**
	 * Every flag diet.mjs derives must be accounted for: displayed, declared
	 * unscreened, or explicitly not an allergen. Widening the derivation without
	 * widening the display fails here rather than silently under-reporting.
	 */
	it('every contains* flag is either checked or named as not an allergen', () => {
		const produced = new Set<string>();
		for (const r of recipes) {
			for (const k of Object.keys(r.diet)) if (k.startsWith('contains')) produced.add(k);
		}
		const accounted = new Set<string>([...CHECKED_FLAGS, ...NOT_ALLERGENS]);
		const orphans = [...produced].filter((k) => !accounted.has(k));
		expect(orphans, 'a derived allergen flag the display neither shows nor declares').toEqual([]);
	});

	it('the checked list and its flags are the same length', () => {
		expect(CHECKED.length).toBe(CHECKED_FLAGS.length);
	});

	/**
	 * Deliberately asserted non-empty. The day the vocabulary is genuinely
	 * closed to all 14, this test fails and forces the page copy to change
	 * rather than leaving a stale 'not screened' line on screen.
	 */
	it('something is still declared unscreened', () => {
		expect(NOT_SCREENED.length).toBeGreaterThan(0);
	});
});

describe('absence must never read as clearance', () => {
	it('real recipes exercise the empty path — this is not a fixture', () => {
		const empty = recipes.filter((r) => !CHECKED_FLAGS.some((f) => r.diet[f as keyof typeof r.diet]));
		expect(empty.length).toBeGreaterThan(50);
	});

	/**
	 * Hummus WAS the poster case for this file: 150g of tahini and an empty
	 * screen. The vocabulary closed and it now flags sesame — which this test
	 * pins, because hummus silently losing its sesame flag again is the single
	 * most on-the-nose regression this module could have.
	 */
	it('hummus flags sesame now, and that must never come back off', () => {
		const hummus = recipes.find((r) => r.slug === 'hummus');
		expect(hummus, 'the corpus no longer has hummus').toBeDefined();
		expect(hummus!.diet.containsSesame).toBe(true);
	});

	/**
	 * The empty path still needs a named resident so the always-render rule
	 * keeps a concrete face. Ratatouille carries none of the thirteen screened
	 * allergens — and the block must still render over it, saying what was not
	 * looked for, because sulphites remain unscreenable by ingredient text.
	 */
	it('ratatouille shows the empty path, and is never shown as allergen-free', () => {
		const dish = recipes.find((r) => r.slug === 'ratatouille');
		expect(dish, 'the corpus no longer has ratatouille; pick another empty-flag dish').toBeDefined();
		const found = CHECKED_FLAGS.filter((f) => dish?.diet[f as keyof typeof dish.diet]);
		expect(found).toEqual([]);
		expect(NOT_SCREENED).toContain('sulphites');
	});

	/**
	 * The scrub-hole regression pins. Nine recipes shipped containsNuts: false
	 * over lines reading "peanut butter" because the phrase was blanked to
	 * protect the DAIRY flag; five shipped containsEgg: false over "egg
	 * noodles". Raw-line matching fixed both — these keep it fixed.
	 */
	it('peanut butter is nuts and peanuts, whatever the dairy scrub thinks', () => {
		const kk = recipes.find((r) => r.slug === 'kare-kare');
		expect(kk).toBeDefined();
		expect(kk!.diet.containsNuts).toBe(true);
		expect(kk!.diet.containsPeanut).toBe(true);
	});

	it('egg noodles contain egg, whatever the vegetarian logic needs', () => {
		const noodles = recipes.filter((r) =>
			r.diet.containsEgg === false &&
			/egg noodle/i.test(JSON.stringify(r))
		);
		expect(noodles.map((r) => r.slug)).toEqual([]);
	});
});

/**
 * "Reviewed by hand" renders under the allergen screen whenever confidence
 * isn't 'derived'. It used to fire whenever a recipe carried ANY diet
 * override, so a ruling about `vegetarian`/`containsMeat` — neither of them a
 * screened allergen — printed "Reviewed by hand" over an allergen list no
 * human had looked at.
 */
describe('"Reviewed by hand" means a human ruled on a screened allergen', () => {
	it('a ruling that never touches a CHECKED_FLAGS key stays derived', () => {
		for (const slug of ['arizona-sonoran-enchiladas', 'new-mexico-red-chile-enchiladas']) {
			const r = recipes.find((x) => x.slug === slug);
			expect(r, `the corpus no longer has ${slug}`).toBeDefined();
			expect(r!.diet.confidence, `${slug} was ruled on vegetarian/meat, not an allergen`).toBe(
				'derived'
			);
		}
	});

	it('a ruling that pins a screened allergen stays reviewed', () => {
		for (const slug of ['pimento-cheese', 'kitsune-udon']) {
			const r = recipes.find((x) => x.slug === slug);
			expect(r, `the corpus no longer has ${slug}`).toBeDefined();
			expect(r!.diet.confidence, `${slug}'s override sets containsFish, a CHECKED_FLAGS key`).toBe(
				'reviewed'
			);
		}
	});
});

/**
 * The derived screen says what it is, on every page it appears on.
 *
 * 1,838 of 1,844 recipes carry a keyword-derived screen; six were read by a
 * person. A list headed "Found" over "Screened for" reads as a ruling either
 * way, so the derived ones carry one sentence saying nobody ruled. There is
 * no component renderer in the unit suite (runes modules are not reachable
 * from vitest, see CLAUDE.md), so this holds the SOURCE to its shape: the
 * sentence sits in the `{:else}` of the confidence branch, the reviewed line
 * in its `{#if}`, and neither can be dropped or swapped without failing here.
 */
describe('the derived screen says it was not reviewed', () => {
	const src = readFileSync('src/lib/components/RecipeDetailView.svelte', 'utf8');
	const SENTENCE =
		'Screened by keyword from the ingredient list, not reviewed by a person; check every label for what the list cannot show.';

	it('renders the sentence only on derived recipes, and "Reviewed by hand" only on the rest', () => {
		const at = src.indexOf("{#if r.diet.confidence !== 'derived'}");
		expect(at, 'the confidence branch is gone from the allergen block').toBeGreaterThan(-1);
		const block = src.slice(at, src.indexOf('{/if}', at));
		const [ifHalf, elseHalf] = block.split('{:else}');
		expect(elseHalf, 'the derived branch has no {:else}').toBeDefined();
		expect(ifHalf).toContain('Reviewed by hand');
		expect(ifHalf).not.toContain('Screened by keyword');
		// Whitespace-folded: the template wraps the sentence across lines.
		expect(elseHalf.replace(/\s+/g, ' ')).toContain(SENTENCE);
		expect(elseHalf).not.toContain('Reviewed by hand');
	});

	it('the sentence keeps the house voice: no em dash, no double hyphen', () => {
		expect(SENTENCE).not.toMatch(/—| -- /);
	});

	it('the corpus is overwhelmingly derived, so the sentence is the common case', () => {
		const derived = recipes.filter((r) => r.diet.confidence === 'derived').length;
		const reviewed = recipes.length - derived;
		expect(derived + reviewed).toBe(recipes.length);
		expect(derived, 'fewer than 99% derived: has the screen been re-reviewed?').toBeGreaterThan(
			recipes.length * 0.99
		);
		expect(reviewed, 'no reviewed recipe left: pimento-cheese and kitsune-udon were').toBeGreaterThan(0);
	});
});
