import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { BRENNANS_HOUSE_ID, TEACHING_FOLIOS, TEACHING_FOLIO_GROUPS, foliosForCard, foliosForDish, foliosForLexicon, foliosForTechnique, teachingFolioAlt } from './teaching-folios';
import { plateArtworkUrl } from './plate-artwork';
import { COOKS_EYE_TEACHING_FOLIOS } from './teaching-folios-cooks-eye';
import { validFolioFocus } from './folio-focus';

const read = (path: string) => JSON.parse(readFileSync(join(__dirname, path), 'utf8'));
const house = read('../../static/shared/packs/brennans-new-orleans.v1.oothouse.json').house;
const dishes = new Set(house.dishes.map((dish: { id: string }) => dish.id));
const techniques = new Set(read('data/techniques.json').map((technique: { slug: string }) => technique.slug));
const recipes = new Set(read('data/recipes.index.json').map((recipe: { slug: string }) => recipe.slug));
const lexicon = new Set(read('data/lexicon.json').map((term: { slug: string }) => term.slug));
const cuisineEntries = new Set(read('data/cuisine/index.json').entries.map((entry: { chapter: string; slug: string }) => `${entry.chapter}:${entry.slug}`));

describe('kitchen companion teaching manifest', () => {
	it('keeps twenty-four independently identified studies and ninety-two views separate from the twenty reference plates', () => {
		expect(TEACHING_FOLIOS).toHaveLength(24);
		expect(new Set(TEACHING_FOLIOS.map(folio => folio.id)).size).toBe(24);
		expect(read('data/plates.json').plates).toHaveLength(20);
		expect(TEACHING_FOLIOS.map(folio => folio.subjects.length)).toEqual([6, 2, 6, 6, 6, 6, 2, 2, 6, 5, 2, 2, 6, 3, 3, 3, 2, 3, 3, 3, 3, 3, 3, 6]);
		expect(TEACHING_FOLIOS.reduce((count, folio) => count + folio.subjects.length, 0)).toBe(92);
	});
	it('puts every study in exactly one non-empty learning group', () => {
		expect(TEACHING_FOLIO_GROUPS).toHaveLength(4);
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
				else if (url.pathname === '/cuisine') expect(cuisineEntries.has(`${url.searchParams.get('ch')}:${url.searchParams.get('e')}`), link.href).toBe(true);
				else throw new Error(`Unreviewed folio link: ${link.href}`);
			}
		}
	});
	it('does not apply Brennan’s guidance to another house or a similarly named unrelated dish', () => {
		expect(foliosForDish('another-house', 'd-r3h9vj7a')).toEqual([]);
		expect(foliosForDish(BRENNANS_HOUSE_ID, 'another-dish')).toEqual([]);
		expect(foliosForDish(BRENNANS_HOUSE_ID, 'd-r3h9vj7a').map(folio => folio.id)).toEqual(['louisiana-larder', 'roux-colour-ladder']);
		expect(foliosForTechnique('poaching-eggs').map(folio => folio.id)).toEqual(['poached-egg-standard', 'simmer-standard']);
		expect(foliosForTechnique('building-an-emulsion').map(folio => folio.id)).toEqual(['hollandaise-standard']);
		expect(foliosForTechnique('unrelated')).toEqual([]);
	});
	it('links only the intended existing Floor Deck cards and pantry terms', () => {
		const deck = read('data/floor-deck.json').cards as Array<{ id: string; term: string }>;
		const linked = deck.filter(card => foliosForCard(card.id).length).map(card => card.term).sort();
		expect(linked).toEqual(['Andouille', 'Beurre Blanc', 'Béarnaise', 'Hollandaise', 'Poached', 'Seared', 'Tasso', 'Tenderloin', 'Chateaubriand', 'En Papillote', 'Crawfish', 'Oysters', 'Shrimp', 'Blue Crab', 'Boiled', 'Puréed', 'Simmered', 'Braised', 'Confit', 'Rendered', 'Brown Butter', 'Agnolotti', 'Meringue', 'Puff Pastry', 'Custard'].sort());
		expect(foliosForCard('fd_0369')).toEqual([]); // French andouillette is not Cajun andouille.
		expect(foliosForLexicon('tasso-and-cajun-andouille').map(folio => folio.id)).toEqual(['louisiana-larder']);
		expect(foliosForLexicon('unrelated')).toEqual([]);
	});
	it('gives the six Cook’s Eye studies a complete, bounded focus window and learning path for every view', () => {
		expect(COOKS_EYE_TEACHING_FOLIOS.map(folio => folio.id)).toEqual(['brown-butter-study', 'custard-structures', 'meringue-peaks', 'puff-pastry-layers', 'braise-confit-render', 'agnolotti-shaping']);
		expect(COOKS_EYE_TEACHING_FOLIOS.reduce((count, folio) => count + folio.subjects.length, 0)).toBe(21);
		for (const folio of COOKS_EYE_TEACHING_FOLIOS) {
			expect(TEACHING_FOLIOS.filter(item => item.id === folio.id), folio.id).toEqual([folio]);
			expect(folio.group).toBe('cooks-eye');
			expect(validFolioFocus(folio.focus, folio.subjects.length), folio.id).toHaveLength(folio.subjects.length);
			expect(new Set(folio.focus!.map(focus => JSON.stringify(focus))).size, folio.id).toBe(folio.subjects.length);
			for (const field of ['observe', 'explain', 'apply', 'question', 'answer'] as const) expect(folio.learning?.[field].length, `${folio.id}: ${field}`).toBeGreaterThan(30);
			expect(folio.sources?.length, folio.id).toBeGreaterThan(0);
			for (const source of folio.sources!) {
				expect(new URL(source.url).protocol).toBe('https:');
				expect(source.title.length).toBeGreaterThan(10);
			}
		}
	});
	it('keeps each new deck connection exact and its Brennan’s application separate from a production formula', () => {
		const connections = {
			fd_0026: 'braise-confit-render', fd_0029: 'braise-confit-render', fd_0047: 'braise-confit-render',
			fd_0161: 'brown-butter-study', fd_0172: 'agnolotti-shaping', fd_0240: 'meringue-peaks',
			fd_0244: 'puff-pastry-layers', fd_0250: 'custard-structures'
		};
		for (const [card, folio] of Object.entries(connections)) expect(foliosForCard(card).map(item => item.id), card).toEqual([folio]);
		const pastry = COOKS_EYE_TEACHING_FOLIOS.find(folio => folio.id === 'agnolotti-shaping')!;
		expect(pastry.dishes).toEqual(['d-u34mwyw8']);
		expect(house.dishes.find((dish: { id: string }) => dish.id === pastry.dishes[0]).name).toBe('Agnolotti del Plin');
		expect(pastry.scope).toMatch(/not.*Brennan|general|house-approved/i);
		const custard = COOKS_EYE_TEACHING_FOLIOS.find(folio => folio.id === 'custard-structures')!;
		expect(custard.scope).toContain('different formulas, not successive stages');
		expect(custard.scope).toContain('does not specify Brennan’s recipe');
		expect(COOKS_EYE_TEACHING_FOLIOS.find(folio => folio.id === 'meringue-peaks')!.scope).toContain('do not identify French, Swiss or Italian');
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
		for (const id of ['french-herbs', 'searing-standard', 'resting-slicing-standard', 'knife-cuts', 'eggs-hussarde-components', 'chateaubriand-study', 'gulf-fish-papillote', 'brennans-seafood']) {
			const folio = TEACHING_FOLIOS.find(folio => folio.id === id)!;
			expect(folio.sources?.length, id).toBeGreaterThan(0);
			for (const source of folio.sources!) {
				expect(new URL(source.url).protocol).toBe('https:');
				expect(source.title.length).toBeGreaterThan(10);
			}
		}
	});
	it('joins each new dish study to its exact menu identity and its named components', () => {
		const studies = [
			{ id: 'eggs-hussarde-components', dish: 'd-1q0xk7jv', name: 'Eggs Hussarde', terms: ['English muffins', 'coffee-cured Canadian bacon', 'hollandaise', 'poached eggs', 'marchand de vin'] },
			{ id: 'chateaubriand-study', dish: 'd-5wcuejdy', name: 'Roasted Chateaubriand', terms: ['tenderloin', 'summer squash', 'Foyot'] },
			{ id: 'gulf-fish-papillote', dish: 'd-szzugxzi', name: 'Gulf Fish en Papillote', terms: ['Banana leaf', 'crab', 'sorghum', 'Marcona almonds', 'Castelvetrano olives', 'tomato'] }
		];
		for (const study of studies) {
			const folio = TEACHING_FOLIOS.find(folio => folio.id === study.id)!;
			expect(folio.dishes).toEqual([study.dish]);
			const dish = house.dishes.find((dish: { id: string }) => dish.id === study.dish);
			expect(dish.name).toBe(study.name);
			for (const term of study.terms) expect(dish.description.toLowerCase(), `${study.id}: ${term}`).toContain(term.toLowerCase());
			expect(foliosForDish(BRENNANS_HOUSE_ID, study.dish)).toContain(folio);
			expect(foliosForDish('another-house', study.dish)).not.toContain(folio);
		}
		expect(foliosForDish(BRENNANS_HOUSE_ID, 'd-44jfmkdb').map(folio => folio.id)).not.toContain('eggs-hussarde-components');
	});
	it('keeps seafood forms separate from similarly named poultry, mushrooms and unrelated crab species', () => {
		const folio = TEACHING_FOLIOS.find(folio => folio.id === 'brennans-seafood')!;
		expect(folio.subjects.map(subject => subject.name)).toEqual(['Red drum, or redfish', 'Eastern oyster', 'Crab fingers', 'Lump crab meat', 'Crawfish', 'Shrimp']);
		for (const id of folio.dishes) {
			const dish = house.dishes.find((dish: { id: string }) => dish.id === id);
			expect(`${dish.name} ${dish.description}`, id).toMatch(/oyster|crab|redfish|crawfish|shrimp/i);
		}
		for (const id of ['fd_0307', 'fd_0145', 'fd_0375', 'fd_0376']) expect(foliosForCard(id).map(folio => folio.id), id).not.toContain(folio.id);
		expect(folio.dishes).not.toContain('d-1bvercoh'); // A daily Gulf-fish selection does not assert red drum.
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
