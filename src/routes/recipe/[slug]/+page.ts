import { error } from '@sveltejs/kit';
import {
	bySlug,
	recipes,
	loadDetail,
	loadPairings,
	loadSubstitutions,
	DEFAULT_PAIRING
} from '$lib/data';

export const prerender = true;

/**
 * All 970 recipes get a real page on disk, so a link to /recipe/cacio-e-pepe
 * renders with JavaScript disabled and survives being pasted anywhere.
 *
 * Family recipes are NOT this route's problem. They live at /family/[slug],
 * a client-only route, because their data is in IndexedDB — this route's
 * server-side 404 would fire before a browser-only fallback ever ran.
 *
 * Set WT_FULL_PRERENDER=0 (npm run build:quick) to build only a handful during
 * UI iteration — the full run is ~1,500 pages and takes a minute.
 */
export function entries() {
	if (process.env.WT_FULL_PRERENDER === '0') {
		return recipes.slice(0, 12).map((r) => ({ slug: r.slug }));
	}
	return recipes.map((r) => ({ slug: r.slug }));
}

export async function load({ params }) {
	const summary = bySlug.get(params.slug);
	if (!summary) error(404, `No recipe named “${params.slug}”`);

	const [detail, pairings, substitutions] = await Promise.all([
		loadDetail(params.slug),
		loadPairings(),
		loadSubstitutions()
	]);
	if (!detail) error(404, `No detail for “${params.slug}”`);

	return {
		summary,
		detail,
		// -1 marks "no sommelier ruling" — fall back to the universal donors.
		pairing: pairings[detail.pairingId] ?? DEFAULT_PAIRING,
		substitutions
	};
}
