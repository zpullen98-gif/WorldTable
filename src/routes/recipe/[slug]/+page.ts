import { error } from '@sveltejs/kit';
import { bySlug, recipes, loadDetail, loadPairings, loadSubstitutions } from '$lib/data';

export const prerender = true;

/**
 * All 970 recipes get a real page on disk, so a link to /recipe/cacio-e-pepe
 * renders with JavaScript disabled and survives being pasted anywhere.
 *
 * Set WT_FULL_PRERENDER=0 to build only the shell during UI iteration — the
 * full run is ~1,500 pages and takes a minute.
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

	return { summary, detail, pairing: pairings[detail.pairingId], substitutions };
}
