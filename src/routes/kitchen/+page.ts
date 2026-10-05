/**
 * Cook at home's one page: the course overview at /kitchen, and every one of
 * the 400 dishes at /kitchen?d=<slug>&level=<n>.
 *
 * ONE prerendered file, never 400: a dish page per slug would add four
 * hundred HTML pages to the build for content the client draws from a
 * fetched level file anyway. The query is read in the browser only (the
 * first Convention: a prerendered page never reads url.searchParams), and
 * the only thing baked in is the four levels' names, so a dish's eyebrow
 * paints with words before anything loads.
 */
import { loadLevels } from '$lib/data';

export const prerender = true;

export async function load() {
	const levels = await loadLevels();
	return { levelInfo: levels.levels.map((l) => ({ level: l.level, name: l.name })) };
}
