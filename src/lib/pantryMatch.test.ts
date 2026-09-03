import { describe, it, expect } from 'vitest';
import { matchPantry, pantryCulprit, PANTRY_SHOWN_CAP } from './pantryMatch';

interface R {
	slug: string;
	course: string;
	diet: { vegetarian: boolean };
	minutes: number;
	items: string[];
}

const recipe = (slug: string, opts: Partial<R> = {}): R => ({
	slug,
	course: 'Main',
	diet: { vegetarian: false },
	minutes: 30,
	items: ['Onion'],
	...opts
});

const itemsOf = (r: R) => r.items;

/**
 * The sealed original kept the ranked-and-capped list separate from the true
 * count (`top = scored.slice(0, 60)`, `panResCt.textContent = scored.length`).
 * The port collapsed them and the counter inherited the cap.
 */
describe('matchPantry', () => {
	it('caps what it shows but not what it counts', () => {
		const pool = Array.from({ length: 70 }, (_, i) => recipe(`r${i}`));
		const { matched, shown } = matchPantry(pool, itemsOf, {
			selected: new Set(['Onion']),
			minMatches: 1,
			course: null,
			vegOnly: false
		});
		expect(matched.length).toBe(70);
		expect(shown.length).toBe(PANTRY_SHOWN_CAP);
	});

	it('requires the minimum number of ticked items on the dish, not just one', () => {
		const pool = [recipe('a', { items: ['Onion', 'Garlic'] }), recipe('b', { items: ['Onion'] })];
		const { matched } = matchPantry(pool, itemsOf, {
			selected: new Set(['Onion', 'Garlic']),
			minMatches: 2,
			course: null,
			vegOnly: false
		});
		expect(matched.map((m) => m.r.slug)).toEqual(['a']);
	});

	it('clamps the requirement to how much is actually ticked, so one tick can still match', () => {
		const pool = [recipe('a', { items: ['Onion'] })];
		const { matched } = matchPantry(pool, itemsOf, {
			selected: new Set(['Onion']),
			minMatches: 3,
			course: null,
			vegOnly: false
		});
		expect(matched.length).toBe(1);
	});

	it('filters by course and by vegetarian-only', () => {
		const pool = [
			recipe('dessert', { course: 'Dessert' }),
			recipe('meaty', { diet: { vegetarian: false } }),
			recipe('veg', { diet: { vegetarian: true } })
		];
		const opts = { selected: new Set(['Onion']), minMatches: 1, course: 'Main', vegOnly: true };
		expect(matchPantry(pool, itemsOf, opts).matched.map((m) => m.r.slug)).toEqual(['veg']);
	});

	it('is empty with nothing ticked, regardless of the pool', () => {
		const pool = [recipe('a')];
		const { matched, shown } = matchPantry(pool, itemsOf, {
			selected: new Set(),
			minMatches: 1,
			course: null,
			vegOnly: false
		});
		expect(matched).toEqual([]);
		expect(shown).toEqual([]);
	});
});

/**
 * Pantry Match's zero state used one sentence for both "ticked nothing" and
 * "ticked several, hit a wall" - and never named which control emptied the
 * list. pantryCulprit re-runs the match with each active control relaxed and
 * reports whichever relaxation restores the most, the way emptyState.ts does
 * for the recipe grid.
 */
describe('pantryCulprit', () => {
	it('names minMatches when lowering it is what restores matches', () => {
		const pool = [recipe('a', { items: ['Onion', 'Garlic'] }), recipe('b', { items: ['Onion'] })];
		const c = pantryCulprit(pool, itemsOf, {
			selected: new Set(['Onion', 'Garlic']),
			minMatches: 2,
			course: null,
			vegOnly: false
		});
		// Both dishes need only "Onion" once minMatches drops to 1.
		expect(c).toEqual({ key: 'minMatches', restored: 2 });
	});

	it('names the course filter when dropping it is what restores matches', () => {
		const pool = [recipe('a', { course: 'Dessert' })];
		const c = pantryCulprit(pool, itemsOf, {
			selected: new Set(['Onion']),
			minMatches: 1,
			course: 'Main',
			vegOnly: false
		});
		expect(c).toEqual({ key: 'course', restored: 1 });
	});

	it('names Vegetarian only when dropping it is what restores matches', () => {
		const pool = [recipe('a', { diet: { vegetarian: false } })];
		const c = pantryCulprit(pool, itemsOf, {
			selected: new Set(['Onion']),
			minMatches: 1,
			course: null,
			vegOnly: true
		});
		expect(c).toEqual({ key: 'vegOnly', restored: 1 });
	});

	it('picks whichever single relaxation restores more, not just the first one tried', () => {
		const pool = [
			recipe('needs-lower-min', { items: ['Onion'] }),
			...Array.from({ length: 4 }, (_, i) => recipe(`needs-no-course${i}`, { course: 'Dessert', items: ['Onion', 'Garlic'] }))
		];
		const c = pantryCulprit(pool, itemsOf, {
			selected: new Set(['Onion', 'Garlic']),
			minMatches: 2,
			course: 'Main',
			vegOnly: false
		});
		expect(c?.key).toBe('course');
		expect(c?.restored).toBe(4);
	});

	it('does not name a control whose relaxation would not change anything', () => {
		// need is already clamped to selected.size (1), so dropping minMatches
		// from 3 to 1 cannot restore anything on its own.
		const pool = [recipe('a', { course: 'Dessert', items: ['Onion', 'Garlic'] })];
		const c = pantryCulprit(pool, itemsOf, {
			selected: new Set(['Onion']),
			minMatches: 3,
			course: 'Main',
			vegOnly: false
		});
		expect(c).toEqual({ key: 'course', restored: 1 });
	});

	it('is null when no single relaxation would restore anything', () => {
		const pool = [recipe('a', { items: ['Garlic'] })];
		const c = pantryCulprit(pool, itemsOf, {
			selected: new Set(['Onion']),
			minMatches: 1,
			course: null,
			vegOnly: false
		});
		expect(c).toBeNull();
	});
});
