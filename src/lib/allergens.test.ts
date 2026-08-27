import { describe, it, expect } from 'vitest';
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

	it('hummus is one of them, and so must never be shown as allergen-free', () => {
		const hummus = recipes.find((r) => r.slug === 'hummus');
		expect(hummus, 'the corpus no longer has hummus; pick another empty-flag dish').toBeDefined();
		const diet = hummus!.diet;
		const found = CHECKED_FLAGS.filter((f) => diet[f as keyof typeof diet]);
		// It contains tahini. The screen finds nothing, which is exactly why the
		// block must still render and say what it did not look for.
		expect(found).toEqual([]);
		expect(NOT_SCREENED).toContain('sesame');
	});
});
