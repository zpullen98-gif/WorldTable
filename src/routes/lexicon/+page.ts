import { loadLexicon } from '$lib/data';
export const prerender = true;
export async function load() {
	return { lexicon: await loadLexicon() };
}
