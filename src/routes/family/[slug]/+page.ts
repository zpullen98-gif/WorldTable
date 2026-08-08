import { error } from '@sveltejs/kit';
import { loadSubstitutions, DEFAULT_PAIRING } from '$lib/data';

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
		substitutions: await loadSubstitutions()
	};
}
