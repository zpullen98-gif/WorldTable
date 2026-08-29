import { describe, it, expect } from 'vitest';
import { buildFamilyRecipe, type FamilyDraft } from './authoring';

/**
 * A family recipe goes through the REAL allergen screen.
 *
 * buildFamilyRecipe used to hardcode every contains* flag to false with
 * confidence 'reviewed', and the detail view then rendered "None found among
 * the 14 screened — Reviewed by hand" over ingredients nobody had screened:
 * clearance language with a human endorsement stapled on, for a recipe that
 * could be peanut brittle. The same matcher the guide's 970 recipes go
 * through now runs on the author's own ingredient lines.
 */

const draft = (over: Partial<FamilyDraft> = {}): FamilyDraft => ({
	name: 'Grandma’s peanut brittle',
	chapter: 'Family',
	course: 'Dessert' as FamilyDraft['course'],
	difficulty: 1 as FamilyDraft['difficulty'],
	minutes: 40,
	vegetarian: true,
	ingredients: '200g peanut butter\n300g sugar\n50g butter\n1 egg white',
	method: 'Boil the sugar.\nStir in the rest.\nPour and set.',
	tip: '',
	techniques: [],
	...over
});

describe('the family screen is real', () => {
	const r = buildFamilyRecipe(draft(), [], []);

	it('peanut brittle flags peanuts, nuts, dairy and egg', () => {
		expect(r.diet.containsPeanut).toBe(true);
		expect(r.diet.containsNuts).toBe(true);
		expect(r.diet.containsDairy).toBe(true);
		expect(r.diet.containsEgg).toBe(true);
	});

	it('says derived, never reviewed — no human screened this text', () => {
		expect(r.diet.confidence).toBe('derived');
	});

	/** The author's own claim survives; it is a judgement, not a text fact. */
	it('keeps the author’s vegetarian call', () => {
		expect(r.diet.vegetarian).toBe(true);
		expect(buildFamilyRecipe(draft({ vegetarian: false }), [], []).diet.vegetarian).toBe(false);
	});

	it('a clean recipe still screens clean', () => {
		const plain = buildFamilyRecipe(
			draft({ name: 'Boiled potatoes', ingredients: '1kg potatoes\nsalt\nwater' }),
			[],
			[]
		);
		expect(plain.diet.containsNuts).toBe(false);
		expect(plain.diet.containsGluten).toBe(false);
		expect(plain.diet.containsDairy).toBe(false);
	});
});
