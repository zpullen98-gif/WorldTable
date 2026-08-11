/**
 * Lazy search-index loader.
 *
 * The serialized MiniSearch index is a large machine artifact that nothing on
 * first paint needs, so it loads on the first keystroke. Until it arrives, the
 * grid falls back to the cheap substring scan over name/chapter/tags — the
 * input never goes dead, it just gets sharper a moment later.
 */
import { browser } from '$app/environment';
import type MiniSearch from 'minisearch';
import { miniOptions } from './search-config.mjs';

let instance: MiniSearch | null = null;
let loading: Promise<void> | null = null;

export function ensureSearch(): Promise<void> {
	if (instance || !browser) return Promise.resolve();
	loading ??= Promise.all([import('minisearch'), import('./data/search-index.json')]).then(
		([MS, idx]) => {
			// loadJS must receive the exact options the index was built with —
			// which is why they live in the shared search-config module.
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			instance = MS.default.loadJS(idx.default as any, miniOptions as any);
		}
	);
	return loading;
}

/**
 * Relevance-ordered positions into the recipes array, or null when the index
 * cannot answer this query — the caller's signal to fall back to the substring
 * scan. Null means "ask someone else"; [] means "asked, and there are none".
 *
 * The distinction is the whole point. processTerm drops single-character terms,
 * so the index answers "c" with an empty ARRAY — and `if (ids)` in the caller
 * is true for [], so the fallback was skipped and the grid rendered "Nothing on
 * the pass" over a 970-recipe corpus on the first keystroke of every search.
 * Checking `q.length > 1` here would not be equivalent: "a b" is two characters
 * and still tokenizes to nothing.
 */
export function searchIds(q: string): number[] | null {
	if (!instance) return null;

	// Ask the shared options whether any term survives tokenizing — never
	// reimplement the rule, or this drifts from the index the way loadJS can.
	const tokenize = miniOptions.tokenize ?? ((s: string) => s.split(/[\n\r\p{Z}\p{P}]+/u));
	const process = miniOptions.processTerm ?? ((t: string) => t);
	const answerable = tokenize(q, 'text').some((t: string) => Boolean(process(t, 'text')));
	if (!answerable) return null;

	return instance.search(q).map((r) => r.id as number);
}
