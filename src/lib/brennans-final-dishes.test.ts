import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { brennansFinalDishes, finalDishKey, finalDishFor, filterFinalDishes, houseDishIdForFinal, FINAL_DISH_HOUSE_TO_FALL, FINAL_DISH_CAPTION, type BrennanFinalDish } from './brennans-final-dishes';
import { BRENNANS_HOUSE_ID } from './teaching-folios';
import { fallMenu } from './fall-menu';
import { plateArtworkUrl } from './plate-artwork';
import { parentOf } from './nav';

const house = JSON.parse(readFileSync(resolve('static/shared/packs/brennans-new-orleans.v1.oothouse.json'), 'utf8')).house;

describe('Brennan final presentations', () => {
	it('covers all 70 canonical dishes and their eight legacy fall routes with 70 unique presentations', () => {
		const expected = [
			...house.dishes.filter((dish: { id: string }) => !FINAL_DISH_HOUSE_TO_FALL[dish.id]).map((dish: { id: string }) => `house:${dish.id}`),
			...fallMenu.items.filter(item => item.kind === 'dish').map(item => `fall:${item.id}`)
		].sort();
		expect(brennansFinalDishes.map(finalDishKey).sort()).toEqual(expected);
		expect(new Set(brennansFinalDishes.map(finalDishKey)).size).toBe(expected.length);
		expect(brennansFinalDishes).toHaveLength(70);
		expect(FINAL_DISH_CAPTION).toContain('AI-generated');
		expect(FINAL_DISH_CAPTION).toContain('chef-informed examples');
		expect(house.dishes).toHaveLength(70);
		expect(Object.keys(FINAL_DISH_HOUSE_TO_FALL)).toHaveLength(8);
		expect(new Set(Object.values(FINAL_DISH_HOUSE_TO_FALL)).size).toBe(8);
		for (const dish of house.dishes) expect(finalDishFor(house.id, dish.id), dish.name).toBeDefined();
		for (const [dishId, fallId] of Object.entries(FINAL_DISH_HOUSE_TO_FALL)) {
			expect(house.dishes.some((dish: { id: string }) => dish.id === dishId), dishId).toBe(true);
			expect(fallMenu.items.some(item => item.id === fallId && item.kind === 'dish'), fallId).toBe(true);
			expect(finalDishFor(house.id, dishId)).toBe(finalDishFor('', fallId, 'fall'));
		}
		for (const art of brennansFinalDishes) {
			expect(art.name).toBe(art.collection === 'house' ? house.dishes.find((dish: { id: string }) => dish.id === art.itemId)?.name : fallMenu.items.find(item => item.id === art.itemId)?.name);
			expect(art.category.length).toBeGreaterThan(0);
			expect(art.alt.length, art.name).toBeGreaterThan(50);
			expect(art.platingNote.length, art.name).toBeGreaterThan(25);
			expect(art.ingredientCues.length, art.name).toBeGreaterThan(0);
		}
	});

	it('resolves house art only for Brennan’s exact identity and keeps fall ids in their own namespace', () => {
		const art = brennansFinalDishes.find(art => art.collection === 'house')!;
		expect(finalDishFor(BRENNANS_HOUSE_ID, art.itemId)).toBe(art);
		expect(finalDishFor('another-restaurant', art.itemId)).toBeUndefined();
		expect(finalDishFor('', art.itemId)).toBeUndefined();
		expect(finalDishFor(BRENNANS_HOUSE_ID, 'unknown-dish')).toBeUndefined();
		expect(finalDishFor(BRENNANS_HOUSE_ID, art.itemId, 'fall')).toBeUndefined();
		const fall = brennansFinalDishes.find(art => art.collection === 'fall')!;
		expect(finalDishFor('', fall.itemId, 'fall')).toBe(fall);
		expect(finalDishFor(BRENNANS_HOUSE_ID, fall.itemId, 'house')).toBeUndefined();
		expect(houseDishIdForFinal(art)).toBe(art.itemId);
		const canonicalFall = houseDishIdForFinal(fall);
		expect(finalDishFor(BRENNANS_HOUSE_ID, canonicalFall)).toBe(fall);
		expect(finalDishFor('another-restaurant', canonicalFall)).toBeUndefined();
		expect(finalDishFor('', canonicalFall)).toBeUndefined();
		expect(finalDishFor(BRENNANS_HOUSE_ID, canonicalFall, 'fall')).toBeUndefined();
	});

	it('ships one unique bounded WebP pair per presentation, admitted to the loaded-art cache', () => {
		const paths = brennansFinalDishes.flatMap(art => [art.src, art.thumbnailSrc]);
		expect(new Set(paths).size).toBe(140);
		for (const art of brennansFinalDishes) {
			expect(art.width / art.height).toBe(1.5);
			expect(art.thumbnailWidth / art.thumbnailHeight).toBe(1.5);
			for (const path of [art.src, art.thumbnailSrc]) {
				expect(path).toMatch(/^house\/brennans\/final-plates\/[a-z0-9-]+-v[1-9]\d*(?:\.thumb)?\.webp$/);
				const file = resolve('static', path);
				expect(readFileSync(file).subarray(8, 12).toString()).toBe('WEBP');
				expect(statSync(file).size).toBeLessThan(path.includes('.thumb.') ? 90 * 1024 : 512 * 1024);
				expect(plateArtworkUrl(`/table/${path}`, '/table', 'https://example.test/table/menu')).toBe(`https://example.test/table/${path}`);
			}
		}
	});

	it('searches names and ingredient cues without changing order, folding accents and combining filters', () => {
		const make = (name: string, collection: 'house' | 'fall', category: string, ingredientCues: string[]) =>
			({ name, collection, category, ingredientCues } as BrennanFinalDish);
		const rows = [make('Château Espagnole', 'fall', 'Mains', ['Frascarelli pasta']), make('Eggs Hussarde', 'house', 'Breakfast', ['Hollandaise']), make('Fish', 'fall', 'Mains', ['Hollandaise'])];
		expect(filterFinalDishes(rows, 'CHATEAU pasta')).toEqual([rows[0]]);
		expect(filterFinalDishes(rows, 'hollandaise', 'fall', 'Mains')).toEqual([rows[2]]);
		expect(filterFinalDishes(rows, '', '', 'Breakfast')).toEqual([rows[1]]);
		expect(filterFinalDishes(rows, 'unlisted ingredient')).toEqual([]);
		expect(filterFinalDishes(rows)).toEqual(rows);
	});

	it('gives the gallery and a cold dish link sensible logical parents', () => {
		expect(parentOf({ path: '/menu', search: '?view=plates' })).toBe('/menu');
		expect(parentOf({ path: '/menu', search: '?view=plates', hash: '#d-1q0xk7jv' })).toBe('/menu?view=plates');
	});
});
