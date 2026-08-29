import { loadDetails } from '$lib/data';
import type { Step } from '$lib/types';

/**
 * Prerendered shell; the drill itself builds from the session's pinned menu
 * client-side. Steps travel whole: the service split (handsOnSec) is what
 * buildPass reads, and a narrowed copy here would silently drop it, exactly
 * as the menu page's loader warns.
 */
export const prerender = true;

export async function load() {
	const details = await loadDetails();
	const steps: Record<string, Step[]> = {};
	for (const [slug, d] of details) steps[slug] = d.steps;
	return { steps };
}
