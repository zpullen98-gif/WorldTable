import type { House, HouseDish } from './house/house-schema';
import { findItem, kept } from './study';

export interface DishComparisonSide {
	id: string;
	name: string;
	meals: string[];
	description: string;
	ingredients: string[];
}

export interface DishComparison {
	id: string;
	sides: [DishComparisonSide, DishComparisonSide];
	difference: string;
	ask: string;
}

const side = (dish: HouseDish): DishComparisonSide => ({
	id: dish.id,
	name: dish.name,
	meals: [...(dish.meals ?? [])],
	description: dish.description.trim(),
	// The menu's literal ingredient list, not an inferred recipe or an allergen verdict.
	ingredients: [...(dish.ingredients ?? [])]
});

/** Exact house mix-up pairs only; the current dish comes first without rewriting the kept comparison. */
export function dishComparisons(house: House, itemId: string): DishComparison[] {
	const current = findItem(house, itemId);
	if (!current || current.kind !== 'dish') return [];
	return (house.mixUps ?? []).flatMap((mix) => {
		if (mix.aId !== itemId && mix.bId !== itemId) return [];
		const other = findItem(house, mix.aId === itemId ? mix.bId : mix.aId);
		if (!other || other.kind !== 'dish' || other.id === itemId) return [];
		return [{
			id: mix.id,
			sides: [side(current), side(other)] as [DishComparisonSide, DishComparisonSide],
			difference: (kept<string>(mix.difference) ?? '').trim(),
			ask: (kept<string>(mix.ask) ?? '').trim()
		}];
	});
}
