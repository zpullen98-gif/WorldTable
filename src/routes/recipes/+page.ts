/**
 * The grid needs no props — RecipeBrowser reads the eagerly-shipped index
 * itself and seeds its filters from the URL in onMount (never reactively; the
 * URL write-back effect would chase it).
 */
export const prerender = true;
