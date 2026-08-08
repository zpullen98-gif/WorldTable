import { error } from '@sveltejs/kit';
import { chapterBySlug, chapters } from '$lib/data';

export const prerender = true;

/** All 94 chapters get a real HTML page on disk. */
export function entries() {
	return chapters.map((c) => ({ slug: c.slug }));
}

export function load({ params }) {
	const chapter = chapterBySlug.get(params.slug);
	if (!chapter) error(404, `No chapter named “${params.slug}”`);
	return { chapter };
}
