import { describe, it, expect } from 'vitest';
import { familyRecipeProblem, screenFamilyRecipes } from './familyRecipe';
import { applyFilters } from './filter';
import { slugOrFallback, stableSuffix, slugify } from './slug';
import { EMPTY_FILTERS } from './types';
import type { Recipe, FilterState } from './types';
import index from './data/recipes.index.json';

/**
 * A .wtjson is a file somebody mails to a colleague, so it is a file somebody
 * can hand-edit. Two separate defects met on the family shelf, and both were
 * measured before either was touched.
 */

const good = {
	slug: 'nans-stew',
	name: "Nan's Stew",
	chapter: 'Family',
	chapterSlug: 'family',
	course: 'Main',
	difficulty: 'Easy',
	minutes: 60,
	diet: { vegetarian: false },
	costTier: 2,
	flavorTags: ['family'],
	season: [],
	region: { kind: 'world', group: 'The Family Chapter', subgroup: null },
	source: 'family',
	noteChars: 0
} as unknown as Recipe;

const without = (field: string) => {
	const bad = { ...good } as Record<string, unknown>;
	delete bad[field];
	return bad as unknown as Recipe;
};

const REAL = (index as unknown as Recipe[]).slice(0, 40);
const F = EMPTY_FILTERS as FilterState;

describe('a hand-edited family recipe cannot take the Library down', () => {
	/**
	 * The measurement that reframed this. The survey called it "silently absent
	 * from the Library", which is the MILD half: applyFilters maps across every
	 * recipe at once, so a record missing one of three fields does not hide, it
	 * throws, and the whole grid goes blank the moment a cook types into search.
	 *
	 * These three assertions are written against the UNSCREENED record on
	 * purpose. They are the proof the defect was real, and they fail if someone
	 * ever makes `matches` defensive and quietly removes the reason for the
	 * screen.
	 */
	it('proves the three fields that used to blank it', () => {
		expect(() => applyFilters([...REAL, without('flavorTags')], { ...F, q: 'stew' }, 6)).toThrow();
		expect(() =>
			applyFilters([...REAL, without('diet')], { ...F, vegetarian: true }, 6)
		).toThrow();
		expect(() => applyFilters([...REAL, without('season')], { ...F, season: true }, 6)).toThrow();
	});

	it('screens each of them out before the merge ever sees them', () => {
		for (const field of ['flavorTags', 'diet', 'season']) {
			const { kept, rejected } = screenFamilyRecipes([good, without(field)]);
			expect(kept).toEqual([good]);
			expect(rejected).toHaveLength(1);
		}
	});

	it('and the Library then renders, filter by filter', () => {
		for (const [field, f] of [
			['flavorTags', { q: 'stew' }],
			['diet', { vegetarian: true }],
			['season', { season: true }]
		] as Array<[string, Partial<FilterState>]>) {
			const { kept } = screenFamilyRecipes([without(field)]);
			expect(() => applyFilters([...REAL, ...kept], { ...F, ...f }, 6)).not.toThrow();
		}
	});

	it('keeps a whole recipe, and says what is wrong with a broken one', () => {
		expect(familyRecipeProblem(good)).toBeNull();
		// The reason names the dish and the field, because "1 recipe skipped"
		// tells a cook nothing they can act on.
		expect(familyRecipeProblem(without('flavorTags'))).toBe("Nan's Stew: no flavour tags");
		expect(familyRecipeProblem(without('name'))).toContain('One recipe');
	});

	it('refuses things that are not recipes at all', () => {
		for (const junk of [null, undefined, 42, 'a string', [], { slug: '' }]) {
			expect(familyRecipeProblem(junk)).not.toBeNull();
		}
		expect(screenFamilyRecipes(null).kept).toEqual([]);
		expect(screenFamilyRecipes('not an array').kept).toEqual([]);
	});

	/**
	 * Shape only, deliberately. An unknown course or a 0-minute dish is the
	 * author's business, and refusing those would reject recipes this very app
	 * wrote in an earlier version.
	 */
	it('does not judge values, only shapes', () => {
		expect(familyRecipeProblem({ ...good, course: 'Elevenses', minutes: 0 })).toBeNull();
	});
});

describe('a name written in a script slugify cannot transliterate', () => {
	/** The defect: every one of these produced the EMPTY STRING. */
	it('used to empty out, and now does not', () => {
		for (const n of ['中国菜', 'Питание', 'Ελληνικά', '한식', 'עברית']) {
			expect(slugify(n)).toBe('');
			expect(slugOrFallback(n, 'dish')).not.toBe('');
			expect(slugOrFallback(n, 'dish')).toMatch(/^dish-[a-z0-9]+$/);
		}
	});

	/**
	 * Deterministic, not a counter or a timestamp. A .wtjson travels between a
	 * phone and a laptop and the slug is the identity the merge deduplicates on,
	 * so two devices given the same name MUST produce the same slug or the same
	 * dish arrives twice. NFC first, because two keyboards can compose one
	 * character differently.
	 */
	it('is stable across devices and across composition', () => {
		expect(slugOrFallback('中国菜', 'chapter')).toBe(slugOrFallback('中国菜', 'chapter'));
		expect(stableSuffix('Ẹ̀bà'.normalize('NFC'))).toBe(stableSuffix('Ẹ̀bà'.normalize('NFD')));
	});

	/** Distinct names must not collapse: that was the chapter rail's whole bug. */
	it('keeps different names apart', () => {
		const slugs = ['中国菜', '한식', 'עברית', 'Питание'].map((n) => slugOrFallback(n, 'chapter'));
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	/** And it changes nothing for a name slugify could already handle. */
	it('leaves Latin names exactly as they were', () => {
		for (const n of ["Nan's Kitchen", 'Ragù', 'Crème Brûlée', 'Smørrebrød']) {
			expect(slugOrFallback(n, 'dish')).toBe(slugify(n));
		}
	});
});

describe('the import banner says what it will not import', () => {
	it('reports a skipped recipe even when nothing else changes', async () => {
		const { describeImport } = await import('./persistence/portable');
		const current = {
			menu: [], notes: {}, pantry: [], familyRecipes: [], menuDishes: [], dishCosts: {}
		} as never;
		const said = describeImport(
			{ familyRecipes: [without('flavorTags')] } as never,
			current
		);
		// "nothing new, this file matches what you already have" alone would be a
		// lie: nothing new lands AND something was thrown away.
		expect(said).toContain('1 family recipe skipped');
		expect(said).toContain('no flavour tags');
	});

	it('counts the good one and names the bad one together', async () => {
		const { describeImport } = await import('./persistence/portable');
		const current = {
			menu: [], notes: {}, pantry: [], familyRecipes: [], menuDishes: [], dishCosts: {}
		} as never;
		const said = describeImport(
			{ familyRecipes: [good, without('diet'), without('season')] } as never,
			current
		);
		expect(said).toContain('1 family recipe');
		expect(said).toContain('2 family recipes skipped');
		expect(said).toContain('and 1 more');
	});
});

/**
 * The screen must never reject a recipe this app wrote.
 *
 * That is the one way a validator turns into data loss: a cook exports the
 * shelf they have been keeping for a year, imports it on a new phone, and the
 * app refuses its own output. Checked against git rather than assumed - every
 * field REQUIRED here has been set by buildFamilyRecipe since cbb9b18, the
 * commit that created the Family Chapter, so no version ever wrote one without
 * them. This test is what keeps that true: add a field to the screen that the
 * builder does not set, and it goes red.
 */
describe('the screen accepts everything the app itself writes', () => {
	it('passes a freshly built family recipe', async () => {
		const { buildFamilyRecipe } = await import('./authoring');
		const built = buildFamilyRecipe(
			{
				name: 'Nan’s Stew', chapter: 'Family', course: 'Main', difficulty: 'Easy',
				minutes: 60, serves: 4, vegetarian: false, techniques: [],
				ingredients: 'beef\nonion', method: 'Brown the beef.\nSimmer.', tip: ''
			} as never,
			[],
			[]
		);
		expect(familyRecipeProblem(built)).toBeNull();
	});

	it('passes one whose name no slugifier can transliterate', async () => {
		const { buildFamilyRecipe } = await import('./authoring');
		const built = buildFamilyRecipe(
			{
				name: '中国菜', chapter: '한식', course: 'Main', difficulty: 'Easy',
				minutes: 30, vegetarian: false, techniques: [],
				ingredients: 'rice', method: 'Steam it.', tip: ''
			} as never,
			[],
			[]
		);
		// Before slugOrFallback both of these were the empty string, and the
		// screen would now reject the app's own recipe on the way back in.
		expect(built.slug).not.toBe('');
		expect(built.chapterSlug).not.toBe('');
		expect(familyRecipeProblem(built)).toBeNull();
	});
});
