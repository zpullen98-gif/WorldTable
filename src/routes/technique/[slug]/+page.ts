import { error } from '@sveltejs/kit';
import { loadTechniques } from '$lib/data';

export const prerender = true;

/** Every live technique gets a real HTML page on disk. */
export async function entries() {
	return (await loadTechniques()).map((t) => ({ slug: t.slug }));
}

export async function load({ params }) {
	const technique = (await loadTechniques()).find((t) => t.slug === params.slug);
	if (!technique) error(404, `No technique named “${params.slug}”`);

	// Only the slug list travels in the payload; the page resolves each one
	// against the eagerly-imported recipe index, which is already in memory.
	return { technique };
}
