import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { BRENNANS_HOUSE_ID, TEACHING_FOLIOS, TEACHING_FOLIO_GROUPS, foliosForCard, foliosForDish, foliosForLexicon, foliosForTechnique, teachingFolioAlt } from './teaching-folios';
import { plateArtworkUrl } from './plate-artwork';

const read = (path: string) => JSON.parse(readFileSync(join(__dirname, path), 'utf8'));
const house = read('../../static/shared/packs/brennans-new-orleans.v1.oothouse.json').house;
const dishes = new Set(house.dishes.map((dish: { id: string }) => dish.id));
const techniques = new Set(read('data/techniques.json').map((technique: { slug: string }) => technique.slug));
const recipes = new Set(read('data/recipes.index.json').map((recipe: { slug: string }) => recipe.slug));
const lexicon = new Set(read('data/lexicon.json').map((term: { slug: string }) => term.slug));

describe('kitchen companion teaching manifest', () => {
	it('keeps nine independently identified studies separate from the twenty reference plates', () => {
		expect(TEACHING_FOLIOS).toHaveLength(9);
		expect(new Set(TEACHING_FOLIOS.map(folio => folio.id)).size).toBe(9);
		expect(read('data/plates.json').plates).toHaveLength(20);
		expect(TEACHING_FOLIOS.map(folio => folio.subjects.length)).toEqual([6, 2, 6, 6, 6, 6, 2, 2, 6]);
	});
	it('puts every study in exactly one non-empty learning group', () => {
		const grouped = TEACHING_FOLIO_GROUPS.flatMap(group => {
			const studies = TEACHING_FOLIOS.filter(folio => folio.group === group.id);
			expect(studies.length, group.id).toBeGreaterThan(0);
			return studies.map(folio => folio.id);
		});
		expect(grouped.sort()).toEqual(TEACHING_FOLIOS.map(folio => folio.id).sort());
		expect(new Set(grouped).size).toBe(TEACHING_FOLIOS.length);
	});
	it('publishes complete versioned image pairs within the allowed offline roots', () => {
		for (const folio of TEACHING_FOLIOS) {
			const full = statSync(join(__dirname, '../../static', folio.image.src)).size;
			const thumb = statSync(join(__dirname, '../../static', folio.image.thumb)).size;
			expect(full, folio.id).toBeGreaterThan(1000);
			expect(thumb, folio.id).toBeGreaterThan(500);
			expect(thumb, folio.id).toBeLessThan(full);
			for (const path of [folio.image.src, folio.image.thumb]) {
				expect(plateArtworkUrl(`/table/${path}`, '/table', 'https://example.test/table/')).toBe(`https://example.test/table/${path}`);
			}
		}
	});
	it('has a readable key and image description for every numbered view', () => {
		for (const folio of TEACHING_FOLIOS) {
			expect(folio.scope.length).toBeGreaterThan(30);
			const alt = teachingFolioAlt(folio);
			for (const [index, subject] of folio.subjects.entries()) {
				expect(subject.description.length).toBeGreaterThan(30);
				expect(alt).toContain(`${index + 1}. ${subject.name}: ${subject.image}`);
			}
		}
	});
	it('resolves each lesson link and contextual dish or technique against current source data', () => {
		expect(BRENNANS_HOUSE_ID).toBe(house.id);
		for (const folio of TEACHING_FOLIOS) {
			for (const id of folio.dishes) expect(dishes.has(id), `${folio.id}: ${id}`).toBe(true);
			for (const slug of folio.techniques) expect(techniques.has(slug), `${folio.id}: ${slug}`).toBe(true);
			for (const link of folio.links) {
				const url = new URL(link.href, 'https://example.test');
				if (url.pathname.startsWith('/technique/')) expect(techniques.has(url.pathname.slice(11)), link.href).toBe(true);
				else if (url.pathname.startsWith('/recipe/')) expect(recipes.has(url.pathname.slice(8)), link.href).toBe(true);
				else if (url.pathname === '/lexicon') expect(lexicon.has(url.hash.slice(1)), link.href).toBe(true);
				else throw new Error(`Unreviewed folio link: ${link.href}`);
			}
		}
	});
	it('does not apply Brennan’s guidance to another house or a similarly named unrelated dish', () => {
		expect(foliosForDish('another-house', 'd-r3h9vj7a')).toEqual([]);
		expect(foliosForDish(BRENNANS_HOUSE_ID, 'another-dish')).toEqual([]);
		expect(foliosForDish(BRENNANS_HOUSE_ID, 'd-r3h9vj7a').map(folio => folio.id)).toEqual(['louisiana-larder', 'roux-colour-ladder']);
		expect(foliosForTechnique('poaching-eggs').map(folio => folio.id)).toEqual(['poached-egg-standard']);
		expect(foliosForTechnique('building-an-emulsion').map(folio => folio.id)).toEqual(['hollandaise-standard']);
		expect(foliosForTechnique('unrelated')).toEqual([]);
	});
	it('links only the intended existing Floor Deck cards and pantry terms', () => {
		const deck = read('data/floor-deck.json').cards as Array<{ id: string; term: string }>;
		const linked = deck.filter(card => foliosForCard(card.id).length).map(card => card.term).sort();
		expect(linked).toEqual(['Andouille', 'Beurre Blanc', 'Béarnaise', 'Hollandaise', 'Poached', 'Seared', 'Tasso'].sort());
		expect(foliosForCard('fd_0369')).toEqual([]); // French andouillette is not Cajun andouille.
		expect(foliosForLexicon('tasso-and-cajun-andouille').map(folio => folio.id)).toEqual(['louisiana-larder']);
		expect(foliosForLexicon('unrelated')).toEqual([]);
	});
	it('connects the new studies to the exact knife, searing, slicing and herb lessons', () => {
		expect(foliosForTechnique('knife-cuts-dice-julienne-bias').map(f => f.id)).toEqual(['knife-cuts']);
		expect(foliosForTechnique('searing-the-hard-crust').map(f => f.id)).toEqual(['searing-standard']);
		expect(foliosForTechnique('resting-meat-and-slicing-against-the-grain').map(f => f.id)).toEqual(['resting-slicing-standard']);
		expect(foliosForTechnique('resting-dough-the-pause-that-does-the-work')).toEqual([]);
		for (const slug of ['flat-leaf-parsley', 'chervil', 'chives', 'tarragon', 'thyme', 'rosemary']) {
			expect(foliosForLexicon(slug).map(f => f.id), slug).toEqual(['french-herbs']);
		}
		expect(foliosForCard('fd_0039').map(f => f.id)).toEqual(['searing-standard']);
	});
	it('uses current named ingredients and actual hanger steaks for house context', () => {
		const herbs = TEACHING_FOLIOS.find(folio => folio.id === 'french-herbs')!;
		for (const id of herbs.dishes) {
			const dish = house.dishes.find((dish: { id: string }) => dish.id === id);
			expect(dish.description, dish.name).toMatch(/fines herbes|parsley|béarnaise|Choron|Foyot/i);
		}
		const slicing = TEACHING_FOLIOS.find(folio => folio.id === 'resting-slicing-standard')!;
		for (const id of slicing.dishes) {
			const dish = house.dishes.find((dish: { id: string }) => dish.id === id);
			expect(dish.name).toMatch(/hanger steak/i);
		}
		expect(TEACHING_FOLIOS.find(folio => folio.id === 'searing-standard')!.dishes).toEqual([]);
		expect(TEACHING_FOLIOS.find(folio => folio.id === 'knife-cuts')!.dishes).toEqual([]);
	});
	it('keeps traceable primary reading sources alongside the new comparison keys', () => {
		for (const id of ['french-herbs', 'searing-standard', 'resting-slicing-standard', 'knife-cuts']) {
			const folio = TEACHING_FOLIOS.find(folio => folio.id === id)!;
			expect(folio.sources?.length, id).toBeGreaterThan(0);
			for (const source of folio.sources!) {
				expect(new URL(source.url).protocol).toBe('https:');
				expect(source.title.length).toBeGreaterThan(10);
			}
		}
	});
	it('distinguishes soft-boiled Eggs Owen and the two different hanger steak preparations', () => {
		const owen = house.dishes.find((dish: { id: string }) => dish.id === 'd-44jfmkdb');
		const dinnerSteak = house.dishes.find((dish: { id: string }) => dish.id === 'd-ono6zqmz');
		const breakfastSteak = house.dishes.find((dish: { id: string }) => dish.id === 'd-4jee8o34');
		expect(owen.name).toBe('Eggs Owen');
		expect(JSON.stringify(owen)).toMatch(/soft-boiled egg/i);
		expect(foliosForDish(BRENNANS_HOUSE_ID, owen.id).map(folio => folio.id)).not.toContain('poached-egg-standard');
		expect(dinnerSteak.name).toBe('Creole Hanger Steak');
		expect(JSON.stringify(dinnerSteak)).toMatch(/chili crisp and pepita persillade/i);
		expect(foliosForDish(BRENNANS_HOUSE_ID, dinnerSteak.id).map(folio => folio.id)).not.toContain('brennans-sauces');
		expect(breakfastSteak.name).toBe('Creole-Spiced Hanger Steak');
		expect(JSON.stringify(breakfastSteak)).toMatch(/béarnaise/i);
		expect(foliosForDish(BRENNANS_HOUSE_ID, breakfastSteak.id).map(folio => folio.id)).toContain('brennans-sauces');
	});
});
