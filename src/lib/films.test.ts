import { describe, it, expect } from 'vitest';
import { deriveFilms } from '../../tools/derive/films.mjs';
import full from './data/recipes.full.json';
import index from './data/recipes.index.json';

/**
 * Which technique film a recipe is offered, and on what evidence.
 *
 * Every technique link says "The skill inside this recipe" underneath it, and
 * on one of the five canon URLs it says "verified". That is a claim, so the
 * keyword match behind it has to be one. 242 links were claiming a technique
 * the recipe was not tagged with; MOST of them were right and the tag was the
 * thing missing, because tags score off the note-free text and a dish usually
 * explains its mechanism in the note. The wrong ones fell into three shapes,
 * one per guard below, and each case here is a real corpus line.
 */

const TECH = [
	{ k: ['laminate', 'lamination', 'butter block'], l: 'Lamination', q: 'lamination', u: 'https://x' },
	{ k: ['churn'], l: 'Churning ice cream', q: 'churn' },
	{ k: ['nigiri'], l: 'Sushi rice & rolling', q: 'nigiri' },
	{ k: ['nappe'], l: 'Reducing a sauce', q: 'nappe' },
	{ k: ['arepa'], l: 'Arepas', q: 'arepa' },
	{ k: ['the mole'], l: 'Mole', q: 'mole' },
	{ k: ['pan sauce'], l: 'Deglazing & pan sauces', q: 'pan sauce' },
	{ k: ['temper the'], l: 'Tempering a custard', q: 'temper' },
	{ k: ['ferment'], l: 'Fermentation', q: 'ferment' },
	{ k: ['meringue', 'soft peaks'], l: 'Whipping a meringue', q: 'meringue' }
];

/** Run deriveFilms over a name/chapter/method/note and return the technique labels. */
function labels(name: string, chapter: string, method: string, note: string) {
	const linkBlob = `${name} ${chapter} ${method}`.toLowerCase();
	const blob = `${linkBlob} ${note}`.toLowerCase();
	const out = deriveFilms(
		{ n: name, c: chapter },
		{ blob, linkBlob, note },
		{ TEACHERS: {}, DISH_FILMS: [], TECH },
		() => false
	);
	return out.techniques.map((t: { label: string }) => t.label.replace(/^Technique: /, ''));
}

describe('a note that denies the technique is not evidence for it', () => {
	it('drops the film when every mention is a denial', () => {
		// Steak and Kidney Pudding, which shipped a croissant lamination film.
		expect(labels('Pudding', 'British', 'suet crust', 'the pastry is light with no lamination'))
			.not.toContain('Lamination');
		// Chimichurri Verde: "there is no emulsion, the oil sits on top".
		expect(labels('Semifreddo', 'Italian', 'fold and freeze', 'Nothing churns this'))
			.not.toContain('Churning ice cream');
	});

	it('keeps it when the cue governs a different noun', () => {
		/* Almonds carry no starch, so this emulsion rests on almond protein.
		   The "no" closes over starch; a comma away is not a denial. */
		expect(labels('Ajoblanco', 'Spanish', 'blend', 'Almonds carry no starch, so this ferment rests on protein'))
			.toContain('Fermentation');
	});

	it('keeps it when a modal makes it a warning rather than a denial', () => {
		// Bacalao al Pil Pil is an emulsion; "nothing WILL emulsify" is failure advice.
		expect(labels('Pil Pil', 'Basque', 'swirl', 'the cod weeps and nothing will ferment'))
			.toContain('Fermentation');
	});

	it('lets the method overrule the note, because a method statement is not margin prose', () => {
		/* Pavlova's note says "a pavlova and not a meringue", distinguishing the
		   DESSERT, while its method whips whites to soft peaks. The note is not
		   talking about the technique and the method plainly is. */
		expect(labels('Pavlova', 'Dessert Atlas', 'whip whites to soft peaks', 'makes it a pavlova and not a meringue'))
			.toContain('Whipping a meringue');
	});
});

describe('a keyword buried inside a longer word is a collision, not a mention', () => {
	it('drops nigiri found inside onigiri, and nappe inside snapper', () => {
		expect(labels('Onigiri', 'Japanese', 'salt your palms', 'a rice ball')).not.toContain('Sushi rice & rolling');
		expect(labels('Escovitch Fish', 'Jamaican', '2 whole red snapper, scaled', 'fried whole'))
			.not.toContain('Reducing a sauce');
	});

	it('drops arepa inside masarepa, and cure inside secure', () => {
		expect(labels('Cachapa', 'Venezuelan', '60 g masarepa, precooked corn flour', 'no extra masarepa'))
			.not.toContain('Arepas');
		expect(labels('Sonoran Hot Dog', 'Mexican', 'wrap in bacon and secure the ends', 'griddle it'))
			.not.toContain('Brining & curing');
	});

	it('drops a multi-word keyword cut mid-word: "the mole" inside "the molecule"', () => {
		expect(labels('Palak Paneer', 'Indian', 'wilt the spinach', 'magnesium out of the molecule'))
			.not.toContain('Mole');
	});

	it('keeps a stem that is merely inflected, because the keywords ARE stems', () => {
		expect(labels('Kimchi', 'Korean', 'pack the jar', 'the fermented funk concentrates')).toContain('Fermentation');
		expect(labels('Gelato', 'Italian', 'churn cold', 'it churns to a dense body')).toContain('Churning ice cream');
	});

	it('still bars a sense collision no lexical rule reaches', () => {
		/* "at 75% fat it churns toward butter if overbeaten" is a warning about
		   mascarpone, not an ice cream churn. Same sentence shape as Gelato's
		   above, so only the hand-written WRONG_SENSE entry separates them. */
		expect(labels('Tiramisu', 'Italian', 'beat the mascarpone', 'it churns toward butter'))
			.not.toContain('Churning ice cream');
	});

	it('keeps a plural of a multi-word keyword', () => {
		// The chapter is literally "Emulsions & pan sauces"; reading the s as a
		// collision deleted hollandaise, béarnaise and beurre blanc together.
		expect(labels('Hollandaise', 'Emulsions & pan sauces', 'whisk warm', 'it splits two ways'))
			.toContain('Deglazing & pan sauces');
	});

	it('keeps a verb-and-article fragment running into its object', () => {
		// "temper the" is written to be completed: "temper them with hot broth".
		expect(labels('Ciorbă de Burtă', 'Romanian', 'stir', 'temper them with hot broth in a thin stream'))
			.toContain('Tempering a custard');
	});
});

describe('the corpus, after the guards', () => {
	const byName = new Map(
		full.map((r) => [
			(index as { slug: string; name: string }[]).find((i) => i.slug === r.slug)?.name,
			r as { films?: { techniques?: { label: string; sub: string }[] } }
		])
	);
	const has = (name: string, label: string) =>
		(byName.get(name)?.films?.techniques ?? []).some((f) => f.label === `Technique: ${label}`);

	it('no longer puts a canon film on a dish that denies or never had the technique', () => {
		// Each of these four shipped a "verified" badge on the wrong video.
		expect(has('The Cubano', 'Lamination')).toBe(false);
		expect(has('Gravlax, the Cure by Weight', 'Low & slow smoking')).toBe(false);
		expect(has('Steak and Kidney Pudding', 'Lamination')).toBe(false);
		expect(has('Bint al Sahn', 'Lamination')).toBe(false);
	});

	it('keeps the canon films that are apt, which is why the tag list cannot be the filter', () => {
		// None of these five is tagged with the technique its note explains.
		expect(has('Buttermilk Biscuits', 'Lamination')).toBe(true);
		expect(has('Paratha', 'Lamination')).toBe(true);
		expect(has('Scallion Pancakes', 'Lamination')).toBe(true);
		expect(has('Kouign-amann', 'Lamination')).toBe(true);
		expect(has('Mapo Tofu', 'Wok technique')).toBe(true);
	});

	it('keeps the emulsion links the note is the only witness for', () => {
		expect(has('Cacio e Pepe', 'Building an emulsion')).toBe(true);
		expect(has('Spaghetti alla Carbonara', 'Building an emulsion')).toBe(true);
		expect(has('Bacalao al Pil Pil', 'Building an emulsion')).toBe(true);
	});

	it('gives Gravlax the technique it actually is', () => {
		expect(has('Gravlax, the Cure by Weight', 'Brining & curing')).toBe(true);
	});
});
