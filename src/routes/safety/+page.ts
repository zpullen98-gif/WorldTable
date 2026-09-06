import { loadSanitation } from '$lib/data';
import type { Sanitation } from '$lib/types';

/**
 * Free reference content: no `<article class="sheet">` and no session read.
 * Modelled on src/routes/palate/+page.ts.
 */
export const prerender = true;

/**
 * The authored code block, tools/derive/sanitation.mjs CODE: the FDA Food
 * Code and UK FSA figures beside the guide's, with source and date. Typed
 * here at the route until src/lib/types.ts carries it on Sanitation itself.
 */
export interface CodeFigures {
	/** ISO date the figures were read on. */
	asOf: string;
	sources: Record<'fda' | 'fsa', { name: string; note: string }>;
	rows: Array<{ key: string; label: string; fda: string | null; fsa: string | null }>;
}

export async function load() {
	return { sanitation: (await loadSanitation()) as Sanitation & { code: CodeFigures } };
}
