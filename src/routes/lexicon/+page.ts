import { loadLexicon, loadDeckIndex } from '$lib/data';
export const prerender = true;
/* The Floor Deck's INDEX and never the deck. Whatever a universal load returns
   is inlined into this page's prerendered HTML, which is already 1.4 MB; the
   index is ids, terms and aliases, and it is what lets an "On the floor" link
   work before hydration like every other anchor on the page. */
export async function load() {
	const [lexicon, deckIndex] = await Promise.all([loadLexicon(), loadDeckIndex()]);
	return { lexicon, deckIndex };
}
