import { loadTechniques } from '$lib/data';

export const prerender = true;

/**
 * The index ships labels and counts only — never the recipe slug arrays.
 *
 * A prerendered load return is serialized into the page's HTML, so returning
 * the full technique records would inline every one of the ~4,000 slug strings
 * into a page that only draws a list of names.
 */
export async function load() {
	const all = await loadTechniques();
	const techniques = all.map((t) => ({
		slug: t.slug,
		label: t.label,
		lexiconTerm: t.lexiconTerm,
		anchored: Boolean(t.lexiconSlug),
		chapters: t.chapters,
		count: t.recipes.length
	}));

	return {
		techniques,
		tagged: new Set(all.flatMap((t) => t.recipes)).size
	};
}
