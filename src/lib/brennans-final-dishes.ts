import data from './data/brennans-final-dishes.json';
import houseToFall from './data/brennans-final-dish-links.json';
import { BRENNANS_HOUSE_ID } from './teaching-folios';

export interface BrennanFinalDish {
	itemId: string;
	collection: 'house' | 'fall';
	name: string;
	category: string;
	src: string;
	thumbnailSrc: string;
	width: number;
	height: number;
	thumbnailWidth: number;
	thumbnailHeight: number;
	alt: string;
	platingNote: string;
	ingredientCues: string[];
}

export const FINAL_DISH_CAPTION = 'Illustrative final presentation • AI-generated. Ingredients follow the saved menu; plating and portions are chef-informed examples.';
export const brennansFinalDishes = data.items as BrennanFinalDish[];
/**
 * The sections whose dishes have no final presentation. The Thanksgiving Day
 * menu of 26 November 2026 was filed from the printed sheet alone: nothing
 * was plated for it and nothing invents a plate, so its sixteen dishes draw
 * their cards with no picture and stay out of the gallery. The last two are
 * the same dishes once the day is over and they are filed as past.
 */
export const UNPLATED_SECTIONS: readonly string[] = ['Thanksgiving Day', 'Thanksgiving Day sides', 'Past Thanksgiving Day 2026', 'Past Thanksgiving Day 2026 sides'];
export const isUnplated = (dish: { section?: string }) => UNPLATED_SECTIONS.includes((dish.section ?? '').trim());
export const finalDishKey = (art: Pick<BrennanFinalDish, 'collection' | 'itemId'>) => `${art.collection}:${art.itemId}`;
const byKey = new Map(brennansFinalDishes.map(art => [finalDishKey(art), art]));
/** Fall dishes now also live in the canonical House pack. Keep the original
 *  field-note ids and immutable image URLs while both lesson routes resolve. */
export const FINAL_DISH_HOUSE_TO_FALL: Readonly<Record<string, string>> = houseToFall;
const fallToHouse = new Map(Object.entries(FINAL_DISH_HOUSE_TO_FALL).map(([dishId, fallId]) => [fallId, dishId]));

export function houseDishIdForFinal(art: Pick<BrennanFinalDish, 'collection' | 'itemId'>): string {
	return art.collection === 'house' ? art.itemId : fallToHouse.get(art.itemId) ?? '';
}

/** House identity is essential: an imported restaurant can reuse a dish id. */
export function finalDishFor(houseId: string, itemId: string, collection: 'house' | 'fall' = 'house'): BrennanFinalDish | undefined {
	if (collection === 'house' && houseId !== BRENNANS_HOUSE_ID) return undefined;
	if (collection === 'house' && FINAL_DISH_HOUSE_TO_FALL[itemId]) {
		return byKey.get(`fall:${FINAL_DISH_HOUSE_TO_FALL[itemId]}`);
	}
	return byKey.get(`${collection}:${itemId}`);
}

const searchable = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function filterFinalDishes(
	items: readonly BrennanFinalDish[],
	query = '',
	collection = '',
	category = ''
): BrennanFinalDish[] {
	const words = searchable(query.trim()).split(/\s+/).filter(Boolean);
	return items.filter(art => (!collection || art.collection === collection) &&
		(!category || art.category === category) &&
		words.every(word => searchable([art.name, art.category, ...art.ingredientCues].join(' ')).includes(word)));
}
