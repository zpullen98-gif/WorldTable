/**
 * A tab root (docs/consolidation-design.md 2.6). Prerendered as its heading
 * and its frame; everything it lists is read in the browser, in onMount, from
 * files already precached, so nothing new is fetched and nothing is inlined
 * into the page. Only the four levels' names are baked in, so the scope chip
 * paints with words before any file loads.
 */
import { loadLevels } from '$lib/data';

export const prerender = true;

export async function load() {
	const levels = await loadLevels();
	return { levelInfo: levels.levels.map((l) => ({ level: l.level, name: l.name })) };
}
