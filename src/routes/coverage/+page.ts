import { loadStations, loadTechniques } from '$lib/data';

export const prerender = true;

export async function load() {
	const [stations, techniques] = await Promise.all([loadStations(), loadTechniques()]);
	return {
		stations,
		// technique label -> the dishes that drill it. The coverage computation
		// needs the complete list, which is exactly what the technique pages use.
		recipesByTechnique: Object.fromEntries(techniques.map((t) => [t.label, t.recipes]))
	};
}
