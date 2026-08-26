/**
 * The home page needs a handful of totals for its bands.
 *
 * study.json, lexicon.json and techniques.json are lazy islands so that the
 * recipe grid is not made to wait for a curriculum it may never show. Loading
 * them here keeps that: the load runs at prerender time, so the numbers are
 * baked into index.html and the client pays nothing for them.
 */
import { loadStudy, loadLexicon, loadTechniques, TOTALS } from '$lib/data';

export const prerender = true;

export async function load() {
	const [study, lexicon, techniques] = await Promise.all([
		loadStudy(),
		loadLexicon(),
		loadTechniques()
	]);

	return {
		curriculumTotal: study.reduce((n, s) => n + s.recipes.length, 0),
		lexiconTotal: lexicon.length,
		techniqueTotal: techniques.length,
		recipeTotal: TOTALS.recipes
	};
}
