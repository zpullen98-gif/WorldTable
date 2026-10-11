import { TEACHING_FOLIOS, BRENNANS_HOUSE_ID, type TeachingFolio } from './teaching-folios';
import { slugify } from './slug';
import type { House } from './house/house-schema';
import type { KitchenDish } from './kitchen';

/** Authored reciprocal links and the recipe's existing exact technique labels.
 * No title, ingredient or prose matching: an unrelated namesake earns no link. */
export function foliosForRecipe(slug: string, techniques: readonly string[], source: 'guide' | 'family' = 'guide'): TeachingFolio[] {
	if (source !== 'guide') return [];
	const refs = new Set(techniques.map(slugify));
	return TEACHING_FOLIOS.filter(folio =>
		folio.links.some(link => link.href === `/recipe/${slug}`) ||
		folio.techniques.some(ref => refs.has(ref))
	);
}

export function foliosForKitchen(dish: Pick<KitchenDish, 'libraryRef' | 'techniqueRefs'>): TeachingFolio[] {
	return TEACHING_FOLIOS.filter(folio =>
		(!!dish.libraryRef && folio.links.some(link => link.href === `/recipe/${dish.libraryRef}`)) ||
		folio.techniques.some(ref => dish.techniqueRefs.includes(ref))
	);
}

/** A related menu study, not a claim that every ingredient is pictured.
 * Resolve only current dish IDs, preserve catalogue order and deduplicate. */
function foliosForHouseItems(house: House, itemIds: readonly string[]): TeachingFolio[] {
	if (house.id !== BRENNANS_HOUSE_ID) return [];
	const dishes = new Set(house.dishes.filter(dish => itemIds.includes(dish.id)).map(dish => dish.id));
	return TEACHING_FOLIOS.filter(folio => folio.dishes.some(id => dishes.has(id)));
}

export function foliosForComponent(house: House, componentId: string): TeachingFolio[] {
	return foliosForHouseItems(house, house.components?.find(component => component.id === componentId)?.itemIds ?? []);
}

export function foliosForTastingCourse(house: House, tastingId: string, course: number | undefined): TeachingFolio[] {
	const row = house.tastings.find(tasting => tasting.id === tastingId)?.courses.find(row => row.n === course);
	return foliosForHouseItems(house, row?.dishIds ?? []);
}
