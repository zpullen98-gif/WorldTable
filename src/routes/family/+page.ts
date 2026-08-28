import { loadPantry, loadTechniqueStandards } from '$lib/data';

export const prerender = true;

export async function load() {
	// The pantry keyword tables, so a saved family recipe matches in Pantry
	// Match the same way a guide recipe does.
	// The 26 technique standards, so the form can offer only the techniques a
	// tick would actually be JUDGED against. Bounding the picker to those is what
	// makes the grade mean something.
	const [pantry, standards] = await Promise.all([loadPantry(), loadTechniqueStandards()]);
	return { pantry, standards: [...standards.values()] };
}
