import { loadDetails } from '$lib/data';

export const prerender = true;

export async function load() {
	// slug -> the flavor sentence, which serves as each dish's menu description.
	// The original generated these with flavorFor at print time (L3577), same
	// prose, now precomputed.
	const details = await loadDetails();
	const flavor: Record<string, string> = {};
	for (const [slug, d] of details) flavor[slug] = d.flavor.sentence;
	return { flavor };
}
