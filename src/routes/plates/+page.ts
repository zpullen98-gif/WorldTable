/**
 * The wall: every plate, by kind, in wall order.
 *
 * What travels in the page is the index only: slug, title, kind, the item
 * count, the thumbnail's box and how many corrections the plate carries. The
 * transcriptions themselves are each plate's own page. The level each plate
 * is read at comes from the levels file, small and already precached.
 */
import { loadLevels, loadPlates } from '$lib/data';
import type { DeckLevel } from '$lib/types';

export const prerender = true;

export async function load() {
	const [data, levels] = await Promise.all([loadPlates(), loadLevels()]);
	const levelOf = new Map<string, DeckLevel>();
	for (const [l, slugs] of Object.entries(levels.items.plates ?? {})) {
		for (const s of slugs) levelOf.set(s, Number(l) as DeckLevel);
	}
	const levelName = new Map(levels.levels.map((l) => [l.level, l.name]));
	return {
		kinds: data.kinds,
		plates: data.plates.map((p) => {
			const level = levelOf.get(p.slug) ?? null;
			return {
				slug: p.slug,
				title: p.title,
				kind: p.kind,
				count: p.count,
				image: { thumb: p.image.thumb, width: p.image.width, height: p.image.height },
				corrections: p.corrections.length,
				level,
				levelName: level ? (levelName.get(level) ?? '') : ''
			};
		})
	};
}
