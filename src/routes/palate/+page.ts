import { loadPalate } from '$lib/data';

export const prerender = true;

/**
 * palate.json is 6KB and the whole page is it, so there is nothing to trim
 * here, unlike the technique index, which ships labels and counts precisely
 * because returning the full records would inline 4,000 slugs into a list.
 */
export async function load() {
	return { palate: await loadPalate() };
}
