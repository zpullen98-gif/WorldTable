import { loadDetails, loadCellar } from '$lib/data';

export const prerender = true;

export async function load() {
	const [details, cellar] = await Promise.all([loadDetails(), loadCellar()]);
	const ingredients: Record<string, string[]> = {};
	const steps: Record<string, { text: string; durationSec: number | null }[]> = {};
	for (const [slug, d] of details) {
		ingredients[slug] = d.ingredients
			.filter((e) => e.kind === 'item')
			.map((e) => (e as { kind: 'item'; text: string }).text);
		steps[slug] = d.steps;
	}
	return { ingredients, steps, cellar };
}
