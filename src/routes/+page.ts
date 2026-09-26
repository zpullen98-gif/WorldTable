/**
 * The home page needs the course's dish slugs and the four levels' names.
 *
 * study.json and levels.json are lazy islands so that nothing on the landing
 * view waits for a curriculum it may never show. Loading them here keeps
 * that: the load runs at prerender time, so the slugs and the names are baked
 * into index.html and the client pays nothing for them. The word and figure
 * on each card come later, from the record, through the levels store.
 */
import { loadStudy, loadLevels } from '$lib/data';

export const prerender = true;

export async function load() {
	const [study, levels] = await Promise.all([loadStudy(), loadLevels()]);

	return {
		// The slugs, in teaching order, not just the count. The Record door has
		// to know WHICH dishes are the course: it was measuring progress by
		// counting the whole cooked log against 45, so cooking 45 dishes from
		// anywhere in the book reported the curriculum complete. 45 strings,
		// baked in at prerender time.
		curriculum: study.flatMap((s) => s.recipes),
		// The names and blurbs only: 4 small rows, so the cards paint before
		// the levels file arrives on the client.
		levelInfo: levels.levels
	};
}
