import { error } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { chapterBySlug, chapters } from '$lib/data';
import type { ChapterRef } from '$lib/types';

export const prerender = true;

/** Every chapter gets a real HTML page on disk. */
export function entries() {
	return chapters.map((c) => ({ slug: c.slug }));
}

export async function load({ params }) {
	const chapter = chapterBySlug.get(params.slug);
	if (chapter) return { chapter };

	// A chapter that exists only because family recipes were filed under it
	// ("Family", "Nonna's Kitchen"). No prerendered page, synthesized from the
	// session, same pattern as the recipe route.
	if (browser) {
		const { session } = await import('$lib/stores/session.svelte');
		await session.hydrate();
		const fam = session.familyRecipes.filter((r) => r.chapterSlug === params.slug);
		if (fam.length) {
			const synthesized: ChapterRef = {
				name: fam[0].chapter,
				slug: params.slug,
				kind: 'world',
				group: 'The Family Chapter',
				subgroup: null,
				count: fam.length
			};
			return { chapter: synthesized };
		}
	}

	error(404, `No chapter named “${params.slug}”`);
}
