/**
 * More (docs/consolidation-design.md 2.5 and 3.10). The Record row counts the
 * course's dishes cooked, so the course's slugs are baked in at prerender (45
 * strings), the way the home's old Record door had them: it must know WHICH
 * dishes are the course, never count the whole cooked log against them.
 */
import { loadStudy } from '$lib/data';

export const prerender = true;

export async function load() {
	const study = await loadStudy();
	return { curriculum: study.flatMap((s) => s.recipes) };
}
