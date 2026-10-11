import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { House } from './house/house-schema';
import { dishComparisons } from './service-guides';

const house: House = JSON.parse(readFileSync('static/shared/packs/brennans-new-orleans.v1.oothouse.json', 'utf8')).house;
const hussarde = house.dishes.find((dish) => dish.name === 'Eggs Hussarde')!;
const owen = house.dishes.find((dish) => dish.name === 'Eggs Owen')!;
const pair = house.mixUps.find((mix) => mix.aId === hussarde.id && mix.bId === owen.id)!;

describe('menu comparison guides', () => {
	it('resolves the exact pair and displays literal current menu components, not generated plating', () => {
		const comparison = dishComparisons(house, hussarde.id).find((row) => row.id === pair.id)!;
		expect(comparison.sides.map((side) => side.id)).toEqual([hussarde.id, owen.id]);
		expect(comparison.sides[0].description).toBe(hussarde.description);
		expect(comparison.sides[1].ingredients).toEqual(owen.ingredients);
		expect(comparison.difference).toBe(pair.difference!.value);
		expect(comparison.ask).toBe(pair.ask!.value);
	});

	it('puts the current dish first from either direction without rewriting the source contrast', () => {
		const comparison = dishComparisons(house, owen.id).find((row) => row.id === pair.id)!;
		expect(comparison.sides.map((side) => side.id)).toEqual([owen.id, hussarde.id]);
		expect(comparison.difference).toBe(pair.difference!.value);
	});

	it('follows edits to the current house and never leaks an unkept mark', () => {
		const edited = structuredClone(house);
		const changed = edited.dishes.find((dish) => dish.id === owen.id)!;
		changed.name = 'Updated menu name';
		changed.description = 'Current menu description';
		changed.ingredients = ['Current named component'];
		const mix = edited.mixUps.find((row) => row.id === pair.id)!;
		mix.difference = { value: 'Unconfirmed answer', by: 'maitre', ts: 1 };
		mix.ask = { value: 'Unconfirmed question', by: 'maitre', ts: 1 };
		const comparison = dishComparisons(edited, hussarde.id).find((row) => row.id === pair.id)!;
		expect(comparison.sides[1]).toMatchObject({ name: changed.name, description: changed.description, ingredients: changed.ingredients });
		expect(comparison.difference).toBe('');
		expect(comparison.ask).toBe('');
	});

	it('does not invent pairs or substitute unresolved dishes and leaves other item kinds alone', () => {
		const edited = structuredClone(house);
		edited.dishes = edited.dishes.filter((dish) => dish.id !== owen.id);
		expect(dishComparisons(edited, hussarde.id).find((row) => row.id === pair.id)).toBeUndefined();
		expect(dishComparisons(house, 'missing')).toEqual([]);
		expect(dishComparisons(house, house.wines[0].id)).toEqual([]);
		for (const row of dishComparisons(house, hussarde.id)) {
			const source = house.mixUps.find((mix) => mix.id === row.id)!;
			expect(new Set(row.sides.map((side) => side.id))).toEqual(new Set([source.aId, source.bId]));
		}
	});

	it('owns its displayed arrays and does not change house data', () => {
		const before = JSON.stringify(house);
		const comparison = dishComparisons(house, hussarde.id)[0];
		comparison.sides[0].ingredients.push('test');
		comparison.sides[0].meals.push('test');
		expect(JSON.stringify(house)).toBe(before);
	});
});
