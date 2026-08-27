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
		// The slugs, in teaching order, not just the count. The home band has to
		// know WHICH dishes are the course: it was measuring progress by counting
		// the whole cooked log against 45, so cooking 45 dishes from anywhere in
		// the book reported the curriculum complete. 45 strings, baked in at
		// prerender time.
		curriculum: study.flatMap((s) => s.recipes),
		lexiconTotal: lexicon.length,
		techniqueTotal: techniques.length,
		recipeTotal: TOTALS.recipes
	};
}
