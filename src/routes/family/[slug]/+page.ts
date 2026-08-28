import { error } from '@sveltejs/kit';
import { loadSubstitutions, loadTechniqueStandards, DEFAULT_PAIRING } from '$lib/data';

/**
 * Family recipe pages are client-only, by necessity and by design.
 *
 * Their data lives in this device's IndexedDB — there is nothing to prerender
 * and no server to render it. With ssr off, the dev server and the static
 * fallback both hand the route straight to the browser, where the session is.
 * This is exactly the case the service worker's navigateFallback exists for.
 */
export const prerender = false;
export const ssr = false;

export async function load({ params }) {
	const { session } = await import('$lib/stores/session.svelte');
	await session.hydrate();

	const recipe = session.familyRecipes.find((r) => r.slug === params.slug);
	if (!recipe) {
		error(404, `No family recipe named “${params.slug}” on this device`);
	}

	return {
		// A family recipe carries the full Recipe shape: summary and detail are
		// the same object.
		summary: recipe,
		detail: recipe,
		pairing: DEFAULT_PAIRING,
		substitutions: await loadSubstitutions(),
		/**
		 * Resolved exactly as /recipe/[slug]/+page.ts does it, so a house dish
		 * renders "How to tell it is going right" and cook mode has a written
		 * standard to grade it against. Without this the ladder in repertoire.ts
		 * climbed on pure attendance for every dish a venue actually cooks.
		 */
		judged: await (async () => {
			const standards = await loadTechniqueStandards();
			return (recipe.judgedBy ?? [])
				.map((slug: string) => standards.get(slug))
				.filter((x): x is NonNullable<typeof x> => x !== undefined);
		})()
	};
}
