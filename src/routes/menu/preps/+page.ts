import { loadStations } from '$lib/data';

/**
 * Prerendered shell reading the house record client-side — /menu/costing's
 * pattern. The preps live in IndexedDB; the static build ships only the frame,
 * plus the guide's station names for the form's select.
 */
export const prerender = true;

export async function load() {
	const stations = await loadStations();
	return { stationNames: stations.stations.map((s) => s.name) };
}
