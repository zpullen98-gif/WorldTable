import { describe, it, expect } from 'vitest';
import { deriveCost, costBlob } from '../../tools/derive/cost.mjs';
import full from './data/recipes.full.json';
import index from './data/recipes.index.json';

const r = (i: string[], m: string[] = [], n = 'A Dish', c = 'A Chapter') => ({ n, c, i, m });

describe('a cost tier is not set by a word inside another word', () => {
	/**
	 * Every pattern was a bare substring. These are the collisions that were
	 * actually pricing dishes in this corpus, each one hand-read off the recipe
	 * it broke.
	 */
	it('refuses the mid-word matches that were pricing real dishes', () => {
		// uni in sulguni, and uni in the dish's own name. Both booked TIER 4,
		// the lobster-and-caviar tier.
		expect(deriveCost(r(['mozzarella', 'feta', 'sulguni', 'egg']), costBlob(r(['mozzarella', 'feta', 'sulguni', 'egg'])))).toBe(1);
		const sole = r(['sole fillets', 'flour', 'butter', 'lemon'], ['Dredge and fry à la meunière.'], 'Sole Meunière');
		expect(deriveCost(sole, costBlob(sole))).toBeLessThan(4);

		// cream in screaming: three dishes priced up because the pan was hot.
		const hot = r(['corn', 'lime'], ['Char the corn over a screaming grill pan.']);
		expect(deriveCost(hot, costBlob(hot))).toBe(1);

		// veal in reveal, duck in geoduck, lamb in flambé.
		const rev = r(['beef flank', 'egg'], ['Slice thick rounds to reveal the cross-section.']);
		expect(deriveCost(rev, costBlob(rev))).toBe(2); // the beef is real, the veal was not
		const geo = r(['geoduck', 'lime'], ['Slice the geoduck paper thin.']);
		expect(deriveCost(geo, costBlob(geo))).toBe(1);
		const fl = r(['bananas', 'sugar', 'rum'], ['Warm the rum and flambé at the table.']);
		expect(deriveCost(fl, costBlob(fl))).toBe(1);
	});

	/**
	 * The naive fix is `\b` at BOTH ends and it is net-harmful, exactly as it is
	 * in the technique tagger: these are how a recipe actually writes them.
	 */
	it('still finds the plurals and the inflections a recipe uses', () => {
		for (const [word, tier] of [
			['scallops', 2],
			['prawns', 2],
			['crabs', 3],
			['creamy sauce', 1],
			['buttermilk', 1]
		] as Array<[string, number]>) {
			const d = r([word]);
			expect(deriveCost(d, costBlob(d)), word).toBeGreaterThanOrEqual(tier === 1 ? 1 : tier);
		}
		// Specifically: the leading boundary does not cost these their match.
		expect(deriveCost(r(['scallops']), costBlob(r(['scallops'])))).toBe(2);
		expect(deriveCost(r(['crabs']), costBlob(r(['crabs'])))).toBe(3);
	});
});

describe('a tier is priced from the recipe, not the writing about it', () => {
	/**
	 * The blob carried the NOTE, which is editorial prose. A dish is not made
	 * expensive by a sentence about it.
	 */
	it('ignores a note, and keeps the method', () => {
		const d = r(['flour', 'tomato', 'mozzarella'], ['Bake at 250C.']);
		// costBlob simply does not include a note; this is the contract.
		expect(costBlob(d)).not.toContain('cream');
		expect(deriveCost(d, costBlob(d))).toBe(1);

		// The method stays in: "deglaze with the wine" is a real ingredient in a
		// real instruction, and boeuf bourguignon has earned that tier.
		const bb = r(['beef', 'lardons', 'onions'], ['Deglaze with the wine and simmer.']);
		expect(costBlob(bb)).toContain('wine');
		expect(deriveCost(bb, costBlob(bb))).toBe(3);
	});

	/** The corpus, after both changes: no tier is higher than the recipe earns. */
	it('leaves the two dishes that were in the caviar tier by collision', () => {
		const byslug = new Map(
			(index as unknown as Array<{ slug: string; costTier: number }>).map((x) => [x.slug, x])
		);
		expect(byslug.get('sole-meuniere')?.costTier).toBeLessThan(4);
		expect(byslug.get('adjaruli-khachapuri')?.costTier).toBeLessThan(4);
		// And a dish that really is top tier keeps it.
		const top = (index as unknown as Array<{ costTier: number }>).filter((x) => x.costTier === 4);
		expect(top.length).toBeGreaterThan(0);
	});

	/** Every tier in the shipped index is still in range. */
	it('never emits a tier outside 1 to 4', () => {
		for (const x of index as unknown as Array<{ slug: string; costTier: number }>) {
			expect([1, 2, 3, 4], x.slug).toContain(x.costTier);
		}
		expect((full as unknown as unknown[]).length).toBe(
			(index as unknown as unknown[]).length
		);
	});
});

describe('a family recipe is priced, not stamped', () => {
	/**
	 * `costTier: 2` was a bare literal on a recipe the COOK typed, from a form
	 * that never asks, and it printed as a confident `$$` on the page. Same shape
	 * as the `serves: 4` and the allergen wall fixed before it.
	 */
	it('runs the author’s own lines through the corpus rule', async () => {
		const { buildFamilyRecipe } = await import('./authoring');
		const draft = (name: string, ingredients: string) =>
			({
				name, chapter: 'Family', course: 'Main', difficulty: 'Easy', minutes: 40,
				vegetarian: false, techniques: [], ingredients, method: 'Cook it.', tip: ''
			}) as never;

		const cheap = buildFamilyRecipe(draft('Nan’s Beans', 'beans\nonion\nsalt'), [], []);
		const dear = buildFamilyRecipe(draft('Nan’s Lobster', 'lobster\nbutter\nlemon'), [], []);

		expect(cheap.costTier).toBe(1);
		expect(dear.costTier).toBe(4);
		// The point of the item: they are no longer the same number.
		expect(cheap.costTier).not.toBe(dear.costTier);
	});

	it('never leaves the tier absent, which would render an empty bordered pill', async () => {
		const { buildFamilyRecipe } = await import('./authoring');
		const built = buildFamilyRecipe(
			{
				name: 'Plain Rice', chapter: 'Family', course: 'Main', difficulty: 'Easy',
				minutes: 20, vegetarian: true, techniques: [], ingredients: 'rice', method: 'Steam.', tip: ''
			} as never,
			[],
			[]
		);
		// '$'.repeat(undefined) is '' and .stats li has a border, so an absent
		// value would paint an empty box. It is always a number.
		expect(typeof built.costTier).toBe('number');
		expect('$'.repeat(built.costTier).length).toBeGreaterThan(0);
	});
});
