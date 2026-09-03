import { describe, it, expect } from 'vitest';
import full from './data/recipes.full.json';
import techniques from './data/techniques.json';

/**
 * The tagger reads a keyword in its own sense, or not at all.
 *
 * deriveTechniques was a bare substring test. films.mjs has carried three
 * guards since the films pass - a negation cue governing the keyword's own
 * phrase, a keyword only ever buried inside a longer word, a keyword cut short
 * - and applied NONE of them to tags, so the exact collisions they were
 * written for kept shipping: nine of the eleven recipes tagged "Reducing a
 * sauce" by `nappe` were snapper, and nine recipes were tagged "Salted water &
 * the float test" for boiling in UNsalted water, the keyword being a substring
 * of its own negation.
 *
 * The guard is SCOPED to keywords that begin with a letter and not a stopword.
 * That scope is the whole reason it is safe: ported wholesale it removes 78
 * tags of which 44 are true, because many keywords are deliberately
 * punctuation-led or stopword-led stems (' mash ', '. roast ', 'the mole').
 * Scoped, it drops 23 and every one was hand-read wrong.
 *
 * These assert the shipped data, so they hold whether or not build:data has
 * been re-run.
 */
const recipes = full as unknown as Array<{ slug: string; techniques?: string[] }>;
const table = techniques as unknown as Array<{ label: string; recipes: string[] }>;
const tagsOf = (slug: string) => recipes.find((r) => r.slug === slug)?.techniques ?? [];
const labelRecipes = (label: string) => table.find((t) => t.label === label)?.recipes ?? [];

describe('a keyword buried inside another word is not a tag', () => {
	it('does not read `nappe` inside `snapper`', () => {
		for (const slug of [
			'blackened-redfish',
			'thieboudienne',
			'snapper-soup',
			'escovitch-fish',
			'pescado-a-la-veracruzana'
		]) {
			expect(tagsOf(slug), slug).not.toContain('Reducing a sauce');
		}
		// The two real ones survive: a velouté held at the nappe, and the custard
		// stirred to it.
		expect(labelRecipes('Reducing a sauce')).toContain('sauce-veloute');
	});

	it('does not read `salted water` inside `unsalted water`', () => {
		for (const slug of ['zaru-soba', 'nishin-soba', 'kizami-udon', 'soki-soba']) {
			expect(tagsOf(slug), slug).not.toContain('Salted water & the float test');
		}
	});

	it('does not read `nigiri` inside `onigiri`', () => {
		expect(tagsOf('onigiri')).not.toContain('Sushi rice & rolling');
	});

	/**
	 * The scope, asserted from the other side: these tags ride keywords that
	 * begin with punctuation or a stopword (' mash ', '. roast ', 'the mole'),
	 * which the guard must never test against the preceding character.
	 */
	it('keeps the tags that ride punctuation-led and stopword-led keywords', () => {
		expect(labelRecipes('Mashing & puréeing').length).toBeGreaterThan(20);
		expect(labelRecipes('Roasting in a hot oven').length).toBeGreaterThan(20);
		expect(labelRecipes('Mole')).toContain('mole-negro-oaxaqueno');
	});
});

describe('a sense a keyword cannot see is ruled by hand', () => {
	/**
	 * Five sealed keywords that name a dish rather than its technique. Sealed
	 * means the list cannot be narrowed, so these are overrides - and
	 * subtractive ones, so a later widening still reaches the recipe.
	 */
	it('does not teach a pheasant as choux pastry, or a lye-cured fish as a pretzel', () => {
		expect(tagsOf('faisan-aux-choux')).not.toContain('Choux pastry');
		expect(tagsOf('lutefisk')).not.toContain('The pretzel bath');
		expect(tagsOf('flammekueche-tarte-flambee')).not.toContain('Flambé');
		expect(tagsOf('sarson-da-saag')).not.toContain('Churning ice cream');
	});

	/** Kulfi's own sentence says it does not churn. An honest silence. */
	it('does not credit kulfi with churning it denies', () => {
		expect(tagsOf('kulfi')).not.toContain('Churning ice cream');
		expect(tagsOf('kulfi')).toEqual([]);
	});

	it('leaves the technique pages honest', () => {
		expect(labelRecipes('The pretzel bath').sort()).toEqual([
			'laugenbrezeln',
			'philadelphia-soft-pretzel'
		]);
		expect(labelRecipes('Churning ice cream')).not.toContain('kulfi');
	});
});

describe('the sealed half, widened from the corpus', () => {
	/** Each of these was a one- or two-recipe page. */
	it.each([
		['Falafel', 'taameya'],
		['Mole', 'mole-coloradito'],
		['Ramen broth', 'weeknight-shoyu-ramen'],
		['Rolling dolmas', 'pasuts-tolma'],
		['Curing gravlax', 'dill-and-aquavit-cured-salmon'],
		['Hand-pulled noodles', 'biang-biang-mian'],
		['The pretzel bath', 'philadelphia-soft-pretzel']
	])('%s reaches %s', (label, slug) => {
		expect(labelRecipes(label)).toContain(slug);
	});

	/**
	 * The widenings are deliberately held under TECHNIQUE_GATE_MIN_RECIPES: a
	 * label reaching twelve REQUIRES an authored standard, which is prose, not
	 * a keyword pass. Béchamel and Butchery basics have enough in the corpus to
	 * cross it and are filed rather than half-done.
	 */
	it('keeps every widened label under the standard threshold', () => {
		for (const label of [
			'Falafel',
			'Mole',
			'Ramen broth',
			'Rolling dolmas',
			'Curing gravlax',
			'Hand-pulled noodles',
			'The pretzel bath'
		]) {
			expect(labelRecipes(label).length, label).toBeLessThan(12);
		}
	});
});
