import { loadServiceTrack } from '$lib/data';

export const prerender = true;

export async function load() {
	return { track: await loadServiceTrack() };
}
