import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { House } from './house/house-schema';
import { foliosForComponent, foliosForKitchen, foliosForRecipe, foliosForTastingCourse } from './folio-connections';
import { TEACHING_FOLIOS } from './teaching-folios';

const house: House = JSON.parse(readFileSync(join(__dirname, '../../static/shared/packs/brennans-new-orleans.v1.oothouse.json'), 'utf8')).house;
const ids = (folios: typeof TEACHING_FOLIOS) => folios.map(folio => folio.id);

describe('authored illustrated-study connections', () => {
	it('follows reciprocal recipe links and exact existing technique labels, deduplicated in catalogue order', () => {
		expect(ids(foliosForRecipe('sauce-bearnaise', []))).toContain('brennans-sauces');
		const actual = foliosForRecipe('hollandaise-and-the-two-ways-it-splits', ['Hollandaise', 'Hollandaise']);
		expect(ids(actual)).toContain('hollandaise-standard');
		expect(new Set(ids(actual)).size).toBe(actual.length);
		expect(foliosForRecipe('sauce-bearnaise-variation', ['A story about hollandaise'])).toEqual([]);
		expect(foliosForRecipe('sauce-bearnaise', ['Hollandaise'], 'family')).toEqual([]);
	});
	it('resolves training dishes only through their precise Library and technique references', () => {
		expect(ids(foliosForKitchen({ libraryRef: 'sauce-bearnaise', techniqueRefs: ['poaching-eggs'] }))).toEqual(['brennans-sauces', 'poached-egg-standard', 'simmer-standard']);
		expect(foliosForKitchen({ libraryRef: 'sauce-bearnaise-variation', techniqueRefs: ['poaching'] })).toEqual([]);
	});
	it('connects a component through its current linked dishes without repeated folios or cross-house leakage', () => {
		const component = house.components!.find(component => component.id === 'c-3g6wf620')!;
		const matches = foliosForComponent(house, component.id);
		expect(ids(matches)).toContain('eggs-hussarde-components');
		expect(new Set(ids(matches)).size).toBe(matches.length);
		expect(matches.every(folio => folio.dishes.some(id => component.itemIds.includes(id)))).toBe(true);
		expect(foliosForComponent({ ...house, id: 'another-house' }, component.id)).toEqual([]);
		expect(foliosForComponent({ ...house, dishes: [] }, component.id)).toEqual([]);
		expect(foliosForComponent(house, 'Hollandaise')).toEqual([]);
	});
	it('keeps course numbers, pours and dishes distinct, including nonconsecutive course numbers', () => {
		const menu = house.tastings.find(tasting => tasting.id === 't-ogscmuc7')!;
		const sparse = { ...house, tastings: [{ ...menu, courses: menu.courses.filter(course => course.n === 4) }] };
		expect(ids(foliosForTastingCourse(sparse, menu.id, 4))).toContain('eggs-hussarde-components');
		expect(foliosForTastingCourse(sparse, menu.id, 0)).toEqual([]);
		expect(foliosForTastingCourse(house, menu.id, 1)).toEqual([]); // A cocktail-only course.
		expect(foliosForTastingCourse(house, menu.id, undefined)).toEqual([]);
		expect(foliosForTastingCourse({ ...house, id: 'another-house' }, menu.id, 4)).toEqual([]);
	});
});
