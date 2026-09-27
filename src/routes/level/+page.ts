/**
 * /level, the Levels tab's literal address.
 *
 * Prerendered so tools/verify-build.mjs can resolve the tab to a page file
 * (its MODES scanner maps '/level' to level.html). The page itself forwards
 * to the level the record says the reader is on: see +page.svelte. The one
 * thing baked in is the first level's name, for the line under the heading.
 */
import { loadLevels } from '$lib/data';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async () => {
	const levels = await loadLevels();
	return { first: levels.levels.find((l) => l.level === 1)?.name ?? '' };
};
