/**
 * /level, the Levels tab's literal address.
 *
 * Prerendered so tools/verify-build.mjs can resolve the tab to a page file
 * (its MODES scanner maps '/level' to level.html). The page itself forwards
 * to the level the record says the reader is on: see +page.svelte.
 */
export const prerender = true;
