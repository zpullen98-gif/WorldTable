import { loadStudy, loadLexicon } from '$lib/data';

export const prerender = true;

export async function load() {
	const [study, lexicon] = await Promise.all([loadStudy(), loadLexicon()]);
	return {
		courseDishes: study.flatMap((s) => s.recipes).length,
		lexicon: lexicon.length
	};
}
