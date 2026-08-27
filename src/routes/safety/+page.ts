import { loadSanitation } from '$lib/data';

/**
 * Free reference content — no `<article class="sheet">` and no session read.
 * Modelled on src/routes/palate/+page.ts.
 */
export const prerender = true;

export async function load() {
	return { sanitation: await loadSanitation() };
}
