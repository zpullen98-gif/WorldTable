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
	serves: null,
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

/**
 * The yield, which nobody was ever asked for.
 *
 * This is the same defect as the allergen screen above, one field along, and it
 * shipped in the same object literal: `serves: 4` was stamped onto a recipe the
 * COOK typed, from a form with no such control. On the guide side the identical
 * constant went out on all 1,844 recipes — neither source states a yield, so
 * there was nothing it could have been checked against.
 *
 * These two assertions are the only coverage this field has ever had.
 */
describe('the yield is asked for, not assumed', () => {
	it('omits serves entirely when the cook did not say', () => {
		expect('serves' in buildFamilyRecipe(draft(), [], [])).toBe(false);
	});

	it('keeps the number when the cook did say', () => {
		expect(buildFamilyRecipe(draft({ serves: 8 }), [], []).serves).toBe(8);
	});

	/** Blank must stay valid: absent means nobody said, not "invalid draft". */
	it('rounds a typed number and refuses a nonsense one', () => {
		expect(buildFamilyRecipe(draft({ serves: 6.4 }), [], []).serves).toBe(6);
		expect('serves' in buildFamilyRecipe(draft({ serves: 0 }), [], [])).toBe(false);
	});
});
