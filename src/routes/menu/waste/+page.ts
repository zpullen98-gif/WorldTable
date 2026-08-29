import { loadWaste } from '$lib/data';

/**
 * Prerendered shell reading the house record client-side, the costing sheet's
 * pattern. The log itself lives in IndexedDB; the static build ships the frame
 * and the guide's reason codes, which are the only part of this page that is
 * the same for every venue.
 */
export const prerender = true;

export async function load() {
	return { waste: await loadWaste() };
}
