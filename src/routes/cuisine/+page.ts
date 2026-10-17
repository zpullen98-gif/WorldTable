/**
 * Cuisine, under Brennan's: French and Creole cooking, read and drilled.
 *
 * ONE prerendered page for every screen (see +page.svelte for the
 * addresses): the chapters, the entries, the decks, the rounds and the two
 * views are all this file, so Cuisine adds one route to the build. The query
 * is read in the browser only (the first Convention: a prerendered page never
 * reads url.searchParams), and the only thing baked in is the four levels'
 * names, so the scope chip paints with words before Cuisine's own files load.
 */
import { loadLevels } from '$lib/data';

export const prerender = true;

export async function load() {
	const levels = await loadLevels();
	return { levelInfo: levels.levels.map((l) => ({ level: l.level, name: l.name })) };
}
