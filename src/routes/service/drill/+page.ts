import { loadDrills, loadServiceTrack } from '$lib/data';

export const prerender = true;

export async function load() {
	const [drills, track] = await Promise.all([loadDrills(), loadServiceTrack()]);
	return { cards: drills.cards, modules: track.modules };
}
