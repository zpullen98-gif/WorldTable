/**
 * The home page needs the four levels' names.
 *
 * levels.json is a lazy island so that nothing on the landing view waits for
 * it. Loading it here keeps that: the load runs at prerender time, so the
 * names are baked into index.html and the client pays nothing for them. The
 * word and figure on each card come later, from the record, through the
 * levels store. (The course's dish slugs the Record door counted went with
 * the door: More's Record row reads them now, in its own load.)
 */
import { loadLevels } from '$lib/data';

export const prerender = true;

export async function load() {
	const levels = await loadLevels();
	return {
		// The names and blurbs only: 4 small rows, so the cards paint before
		// the levels file arrives on the client.
		levelInfo: levels.levels
	};
}
