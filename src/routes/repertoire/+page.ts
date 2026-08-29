import { loadStudy } from '$lib/data';

export const prerender = true;

/**
 * The page is entirely user data, so the load returns almost nothing: just the
 * course's slugs in teaching order, so the page can say which of your dishes
 * are the curriculum and which one is next.
 *
 * Deliberately NOT recipes.full.json. The repertoire lists dishes by name and
 * links to them, and names live in the eagerly-shipped index: pulling the full
 * detail file in to read 45 `standard` keys would drag the whole 970-recipe
 * payload onto a page that draws a list.
 */
export async function load() {
	const study = await loadStudy();
	return { curriculum: study.flatMap((s) => s.recipes) };
}
