import { loadLexicon } from '$lib/data';

export const prerender = true;

/**
 * The front-of-house atlases, counted here so the hub can say how much ground
 * there is before the track that orders it exists.
 */
const FOH = ['Cheese Atlas', 'Charcuterie Atlas', 'Cocktail & Bar', 'Wine & Beverage', 'The Grape Atlas'];

export async function load() {
	const lexicon = await loadLexicon();
	const atlases = FOH.map((category) => ({
		category,
		count: lexicon.filter((e) => e.category === category).length
	}));
	return { atlases, total: atlases.reduce((n, a) => n + a.count, 0) };
}
