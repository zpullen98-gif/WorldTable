import { loadDetails, loadCellar } from '$lib/data';
import type { Step } from '$lib/types';

export const prerender = true;

export async function load() {
	const [details, cellar] = await Promise.all([loadDetails(), loadCellar()]);
	const ingredients: Record<string, string[]> = {};
	// The whole Step, not a narrowed copy, the service split (handsOnSec,
	// unattendedSec) is what The Pass is built from, and a hand-written subtype
	// here would silently drop it.
	const steps: Record<string, Step[]> = {};
	for (const [slug, d] of details) {
		ingredients[slug] = d.ingredients
			.filter((e) => e.kind === 'item')
			.map((e) => (e as { kind: 'item'; text: string }).text);
		steps[slug] = d.steps;
	}
	return { ingredients, steps, cellar };
}
