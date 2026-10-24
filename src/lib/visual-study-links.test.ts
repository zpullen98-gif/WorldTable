import { describe, expect, it } from 'vitest';
import { foundationsEntries, foundationRef } from './foundations';
import { plateIndexes } from './plates';
import plateData from './data/plates.json';
import type { PlatesData } from './types';
import { foliosForStudyRef, plateForStudyRef, studiesForIds } from './visual-study-links';

const indexes = plateIndexes(plateData as unknown as PlatesData);

describe('reviewed image connections for the Fieldbook and Cuisine', () => {
	it('reaches all nineteen existing Fieldbook matches through the original identities', () => {
		const matches = foundationsEntries.filter(entry => {
			const ref = foundationRef(entry);
			return foliosForStudyRef(ref).length || plateForStudyRef(ref, indexes);
		}).map(entry => entry.term);
		for (const name of ['Boiled', 'Poached', 'Puréed', 'Seared', 'Simmered', 'Chives', 'Collard Greens', 'Hen of the Woods', 'Shiitake', 'Andouille', 'Guanciale', 'Pancetta', 'Tasso', 'Hanger Steak', 'Ribeye', 'Tenderloin', 'Crawfish', 'Oysters', 'Parmesan']) {
			expect(matches, name).toContain(name);
		}
	});
	it('never guesses an image from a word, a missing id or the wrong reference kind', () => {
		for (const ref of ['Oysters', 'u:Oysters', 'c:unrelated', 't:unrelated', 'c:chives', 't:fd_0034']) {
			expect(foliosForStudyRef(ref)).toEqual([]);
			expect(plateForStudyRef(ref, indexes)).toBeUndefined();
		}
		expect(plateForStudyRef('c:fd_0034', null)).toBeUndefined();
		expect(foliosForStudyRef('c:fd_0034').map(folio => folio.id)).toContain('poached-egg-standard');
	});
	it('preserves explicit Cuisine order while dropping duplicates and unavailable studies', () => {
		expect(studiesForIds(['simmer-standard', 'not-a-folio', 'poached-egg-standard', 'simmer-standard']).map(folio => folio.id)).toEqual(['simmer-standard', 'poached-egg-standard']);
		expect(studiesForIds()).toEqual([]);
	});
});
