import { error } from '@sveltejs/kit';
import {
	bySlug,
	recipes,
	loadDetail,
	loadPairings,
	loadSubstitutions,
	loadTechniqueStandards,
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

	const [detail, pairings, substitutions, techniqueStandards] = await Promise.all([
		loadDetail(params.slug),
		loadPairings(),
		loadSubstitutions(),
		loadTechniqueStandards()
	]);
	if (!detail) error(404, `No detail for “${params.slug}”`);

	return {
		summary,
		detail,
		// -1 marks "no sommelier ruling" — fall back to the universal donors.
		pairing: pairings[detail.pairingId] ?? DEFAULT_PAIRING,
		substitutions,
		/**
		 * Resolved here rather than in the component, the way `pairing` is: the
		 * view should not know that `judgedBy` is a set of slugs into another
		 * file. Empty for the 45 dishes with a standard of their own and the 287
		 * that have neither — the block is absent, never rendered empty.
		 */
		judged: (detail.judgedBy ?? [])
			.map((slug) => techniqueStandards.get(slug))
			.filter((x) => x !== undefined)
	};
}
