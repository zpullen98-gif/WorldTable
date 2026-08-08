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
 * Relevance-ordered positions into the recipes array, or null while the index
 * is still on its way (caller falls back to the substring scan).
 */
export function searchIds(q: string): number[] | null {
	if (!instance) return null;
	return instance.search(q).map((r) => r.id as number);
}
