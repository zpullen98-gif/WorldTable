import { error } from '@sveltejs/kit';
import { loadTechniques, loadTechniqueStandards } from '$lib/data';

export const prerender = true;

/** Every live technique gets a real HTML page on disk. */
export async function entries() {
	return (await loadTechniques()).map((t) => ({ slug: t.slug }));
}

export async function load({ params }) {
	const technique = (await loadTechniques()).find((t) => t.slug === params.slug);
	if (!technique) error(404, `No technique named “${params.slug}”`);

	/*
	 * 60 of the 110 techniques carry a standard, and until now it was reachable
	 * only from a recipe that had no standard of its own: the recipe page's
	 * "judged on the techniques it exercises" block links HERE, and here said
	 * nothing about how to tell the technique was going right. The Path of Study
	 * sends people to this page too. The prose ships in the page rather than
	 * being fetched, because a locked or offline reader still gets the lesson.
	 */
	const standard = (await loadTechniqueStandards()).get(params.slug) ?? null;

	// Only the slug list travels in the payload; the page resolves each one
	// against the eagerly-imported recipe index, which is already in memory.
	return { technique, standard };
}
