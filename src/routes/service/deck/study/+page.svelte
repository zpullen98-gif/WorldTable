<!--
  The Floor Deck's old flip-card address, kept for every link that names it
  (a card's "often confused with", the Lexicon's backlinks, a plate's "The
  card", the written test's misses) and for verify-build's scanner.

  ONE CARD STYLE (docs/consolidation-design.md 2.6 and 3.7): the cards are
  studied on the Flashcards tab's one card screen now, so this page forwards
  there with a replace and draws nothing of its own:

    ?card={id}          the card's section deck, opened on that card with its
                        answer showing, as the look-up did; nothing is
                        recorded until it is graded
    bare, ?level=, ?section=, ?focus=misses
                        the Floor Deck run, the same sitting pickSession deals

  The grades are the same: Got it records `close` (what Had it and Shaky both
  recorded), Again records `missed`, once per card per local day.

  The query is read in afterNavigate, never at render: this page is
  prerendered and `url.searchParams` does not exist then.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { afterNavigate, goto } from '$app/navigation';
	import { loadDeckIndex } from '$lib/data';
	import { nav } from '$lib/stores/nav.svelte';

	afterNavigate(async () => {
		const p = new URLSearchParams(location.search);
		const card = p.get('card');
		let to = '';
		if (card) {
			let section = '';
			try {
				section = (await loadDeckIndex()).cards.find((c) => c.id === card)?.section ?? '';
			} catch {
				/* the whole deck, opened on the card */
			}
			const deck = section ? `deck:${section}` : 'deck-all';
			to = `/flashcards?deck=${encodeURIComponent(deck)}&card=${encodeURIComponent(card)}&run=1`;
		} else {
			const keep = new URLSearchParams();
			for (const k of ['level', 'section', 'focus']) {
				const v = p.get(k);
				if (v) keep.set(k, v);
			}
			const rest = keep.toString();
			to = `/flashcards?deck=deck-all&run=1${rest ? '&' + rest : ''}`;
		}
		nav.navReplace();
		void goto(`${base}${to}`, { replaceState: true });
	});
</script>

<svelte:head><title>Flip cards · The World Table</title></svelte:head>

<div class="shell hub">
	<h1>Flip cards</h1>
	<p class="note" aria-live="polite">Opening the cards on the Flashcards tab…</p>
	<p class="note">If nothing opens, <a href="{base}/flashcards">open Flashcards</a>.</p>
</div>
