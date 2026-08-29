import { loadStudy, loadTechniques, loadLexicon } from '$lib/data';

export const prerender = true;

/** Counts only: the hub names what each destination holds, never ships it. */
export async function load() {
	const [study, techniques, lexicon] = await Promise.all([
		loadStudy(),
		loadTechniques(),
		loadLexicon()
	]);
	return {
		semesters: study.length,
		courseDishes: study.flatMap((s) => s.recipes).length,
		techniques: techniques.length,
		anchored: techniques.filter((t) => t.lexiconSlug).length,
		taught: new Set(study.flatMap((s) => s.skills.map((k) => k.slug))).size,
		lexicon: lexicon.length
	};
}
