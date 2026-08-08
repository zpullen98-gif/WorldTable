import { loadPantry } from '$lib/data';

export const prerender = true;

export async function load() {
	// The pantry keyword tables, so a saved family recipe matches in Pantry
	// Match the same way a guide recipe does.
	return { pantry: await loadPantry() };
}
