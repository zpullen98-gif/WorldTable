import { loadEconomics } from '$lib/data';

/**
 * Prerendered shell reading the session store client-side: /menu/quiz's
 * pattern. The dishes and their costings live in IndexedDB; the static build
 * ships the frame and the guide's own targets, which are the only part of this
 * page that is the same for every venue.
 */
export const prerender = true;

export async function load() {
	return { economics: await loadEconomics() };
}
