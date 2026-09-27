/**
 * One plate: its picture, its transcription, its corrections and its quiz.
 *
 * Every plate gets a real page on disk. The load returns THIS plate and
 * nothing more of the file (a universal load is inlined into the page's
 * HTML, and one plate is a few kilobytes where the file is the whole wall),
 * plus its neighbours on the wall and the level it is read at.
 */
import { error } from '@sveltejs/kit';
import { loadLevels, loadPlates } from '$lib/data';
import type { DeckLevel } from '$lib/types';

export const prerender = true;

export async function entries() {
	return (await loadPlates()).plates.map((p) => ({ slug: p.slug }));
}

export async function load({ params }) {
	const [data, levels] = await Promise.all([loadPlates(), loadLevels()]);
	const at = data.plates.findIndex((p) => p.slug === params.slug);
	if (at < 0) error(404, `No plate named “${params.slug}”`);
	const plate = data.plates[at];
	const prev = data.plates[at - 1] ?? null;
	const next = data.plates[at + 1] ?? null;

	let level: DeckLevel | null = null;
	for (const [l, slugs] of Object.entries(levels.items.plates ?? {})) {
		if (slugs.includes(plate.slug)) level = Number(l) as DeckLevel;
	}
	const levelName = level ? (levels.levels.find((x) => x.level === level)?.name ?? '') : '';

	return {
		plate,
		level,
		levelName,
		prev: prev ? { slug: prev.slug, title: prev.title } : null,
		next: next ? { slug: next.slug, title: next.title } : null
	};
}
