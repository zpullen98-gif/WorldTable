import { loadPantry, loadDetails } from '$lib/data';

export const prerender = true;

export async function load() {
	const [pantry, details] = await Promise.all([loadPantry(), loadDetails()]);
	// slug -> pantry labels, prebuilt at build time rather than lazily on the main
	// thread the first time someone opens this view (the original's
	// window.REC_PANT, L2778, which scanned 970 recipes × 177 items inline).
	const recipeItems: Record<string, string[]> = {};
	for (const [slug, d] of details) recipeItems[slug] = d.pantryItems;
	return { pantry, recipeItems };
}
