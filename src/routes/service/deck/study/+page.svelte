<!--
  Flip cards: a sitting of the Floor Deck.

  The reader says the answer to themselves, turns the card, and judges
  themselves with one of three buttons. Because it is SELF-judged it never
  promotes a card up the ladder: "Had it" and "Shaky" both record `close`
  (the rung holds, the clock restarts), "Didn't have it" records `missed`.
  Only the written test and say-it-back, which are objective, can promote.

  One judgment is written per card per local day, the first one standing
  (floor-deck.ts flipRecordable). "Shaky" and "Didn't have it" send the card to
  the back of THIS sitting for another look, and that second look is not
  written again: seeing it twice in ten minutes is one evening's evidence.

  The judgment is recorded the moment the button is pressed, before anything
  advances, the rule the service drill follows: closing the page mid-sitting
  loses nothing, and Back just works.

  `?card=<id>` is a LOOK-UP: one card, shown open, recording nothing. It is
  where the Lexicon's backlinks and a card's own "often confused with" links
  land. `?focus=misses` is the result screen's "study these now" door.
  `?level=` and `?section=` narrow the sitting and intersect (scopeFromSearch);
  under a level, what is owed from the levels below still leads it.

  The URL is read in afterNavigate, never at render: this page is prerendered
  and `url.searchParams` does not exist then. onMount alone would miss a
  same-route navigation (one look-up link to another).
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { loadFloorDeck } from '$lib/data';
	import { session } from '$lib/stores/session.svelte';
	import { markStudied } from '$lib/oot-studied';
	import FloorCard, { type OpenLayers } from '$lib/components/FloorCard.svelte';
	import {
		FLIP_GRADES,
		deckLog,
		flipRecordable,
		pickSession,
		scopeFromSearch,
		type FlipJudgment
	} from '$lib/floor-deck';
	import type { DeckCard, FloorDeck } from '$lib/types';

	let deck = $state<FloorDeck | null>(null);
	let failed = $state(false);
	let search = $state<string | null>(null);

	let queue = $state<DeckCard[]>([]);
	let at = $state(0);
	let revealed = $state(false);
	let open = $state<OpenLayers>({ why: false, facts: false, context: false });
	/** what this sitting judged, for the closing screen. Never persisted. */
	let judged = $state<Record<string, FlipJudgment>>({});
	/** ids already sent round again, so a card returns at most once */
	let returned = $state<string[]>([]);
	let finished = $state(false);
	let started = $state(false);
	let announce = $state('');

	onMount(async () => {
		try {
			deck = await loadFloorDeck();
		} catch {
			failed = true;
		}
	});

	afterNavigate(() => {
		search = location.search;
		started = false;
	});

	const params = $derived(new URLSearchParams(search ?? ''));
	const lookupId = $derived(params.get('card'));
	const focus = $derived(params.get('focus') === 'misses' ? ('misses' as const) : null);
	const names = $derived(new Map((deck?.cards ?? []).map((c) => [c.id, c.term])));
	const titles = $derived(new Map((deck?.sections ?? []).map((s) => [s.key, s.title])));
	const levelNames = $derived(new Map((deck?.levels ?? []).map((l) => [l.level, l.name])));
	const lookup = $derived(lookupId && deck ? (deck.cards.find((c) => c.id === lookupId) ?? null) : null);
	const card = $derived(queue[at] ?? null);

	/* Build the sitting ONCE per arrival, when the deck, the record and the URL
	   are all in. Not a $derived: the log changes with every judgment, and a
	   derived queue would reshuffle itself under the reader mid-sitting. */
	$effect(() => {
		if (started || !deck || !session.ready || search === null || lookupId) return;
		const { scope, levels } = scopeFromSearch(search, deck);
		queue = pickSession(deck, session.drillLog, Date.now(), { scope, levels, focus });
		at = 0;
		revealed = false;
		judged = {};
		returned = [];
		finished = false;
		started = true;
	});

	function judge(j: FlipJudgment) {
		if (!card || !deck || !revealed) return;
		const now = Date.now();
		if (flipRecordable(deckLog(session.drillLog, deck.cards), card.id, now)) {
			session.markDrilled(card.id, FLIP_GRADES[j]);
		}
		if (!(card.id in judged)) judged = { ...judged, [card.id]: j };
		if (j !== 'had' && !returned.includes(card.id)) {
			returned = [...returned, card.id];
			queue = [...queue, card];
		}
		advance();
	}

	function advance() {
		if (at + 1 >= queue.length) {
			finished = true;
			markStudied();
			announce = 'The sitting is finished.';
			return;
		}
		at += 1;
		revealed = false;
		announce = `Card ${at + 1} of ${queue.length}.`;
	}

	/** An unjudged card is not lost: it goes to the back, once. */
	function skip() {
		if (!card) return;
		if (!returned.includes(card.id) && !(card.id in judged)) {
			returned = [...returned, card.id];
			queue = [...queue, card];
		}
		advance();
	}

	function back() {
		if (at === 0) return;
		at -= 1;
		revealed = true; // a look back is a review; nothing is judged twice
	}

	function onkey(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey || lookupId || finished || !card) return;
		const t = e.target as HTMLElement | null;
		if (t && ['BUTTON', 'A', 'SUMMARY', 'INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
		if ((e.key === ' ' || e.key === 'Enter') && !revealed) {
			e.preventDefault();
			revealed = true;
			announce = 'The card is turned.';
		} else if (e.key === 'ArrowRight') skip();
		else if (e.key === 'ArrowLeft') back();
		else if (revealed && e.key === '1') judge('had');
		else if (revealed && e.key === '2') judge('shaky');
		else if (revealed && e.key === '3') judge('missed');
	}

	const again = $derived(
		Object.entries(judged)
			.filter(([, j]) => j === 'missed')
			.map(([id]) => ({ id, term: names.get(id) ?? id }))
	);
	const alreadyJudged = $derived(card ? card.id in judged : false);
</script>

<svelte:window onkeydown={onkey} />
<svelte:head><title>Flip cards · The Floor Deck · The World Table</title></svelte:head>

<div class="shell view">
	<nav class="crumbs"><a href="{base}/service">Service</a> · <a href="{base}/service/deck">The Floor Deck</a></nav>
	<h1>{lookupId ? 'A card' : focus ? 'What you missed' : 'Flip cards'}</h1>

	<article class="sheet">
		<p class="sr" aria-live="polite">{announce}</p>

		{#if failed}
			<p class="empty">The deck did not load. Check the connection once; after that it works offline.</p>
		{:else if !deck || search === null}
			<p class="empty" aria-live="polite">Opening the deck…</p>
		{:else if lookupId}
			{#if lookup}
				<FloorCard
					card={lookup}
					frame={deck.frame}
					levelName={levelNames.get(lookup.level) ?? ''}
					sectionTitle={titles.get(lookup.section) ?? ''}
					{names}
					flippable={false}
					open={{ why: true, facts: true, context: true }}
				/>
				<p class="note">Looking a card up records nothing.</p>
				<p class="tools"><a class="chip" href="{base}/service/deck">The deck</a></p>
			{:else}
				<p class="empty">There is no card with that id. It may have been retired from the deck.</p>
				<p class="tools"><a class="chip" href="{base}/service/deck">The deck</a></p>
			{/if}
		{:else if !session.ready || !started}
			<p class="empty" aria-live="polite">Reading your record…</p>
		{:else if !queue.length}
			<p class="empty">
				{focus ? 'Nothing is owed from a miss. That is a good day.' : 'Nothing in that choice yet.'}
			</p>
			<p class="tools"><a class="chip" href="{base}/service/deck">The deck</a></p>
		{:else if finished}
			<div class="done" role="status">
				<h2>That is the sitting.</h2>
				{#if again.length}
					<p class="note">These are owed, and they lead the next sitting:</p>
					<p class="termlist">
						{#each again as a (a.id)}<a href="{base}/service/deck/study?card={a.id}">{a.term}</a>{/each}
					</p>
				{:else}
					<p class="note">Nothing owed from this one. The cards come back as the days pass.</p>
				{/if}
				<p class="tools">
					<a class="chip go" href="{base}/service/deck">The deck</a>
				</p>
			</div>
		{:else if card}
			<p class="where">Card {at + 1} of {queue.length}</p>
			{#key `${card.id}:${at}`}
				<FloorCard
					{card}
					frame={deck.frame}
					levelName={levelNames.get(card.level) ?? ''}
					sectionTitle={titles.get(card.section) ?? ''}
					{names}
					bind:revealed
					bind:open
				/>
			{/key}

			{#if revealed}
				<div class="judge" role="group" aria-label="Did you have it?">
					{#if alreadyJudged}
						<button class="chip go" onclick={advance}>Next</button>
					{:else}
						<button class="chip" onclick={() => judge('had')}><kbd>1</kbd> Had it</button>
						<button class="chip" onclick={() => judge('shaky')}><kbd>2</kbd> Shaky</button>
						<button class="chip" onclick={() => judge('missed')}><kbd>3</kbd> Didn't have it</button>
					{/if}
				</div>
			{:else}
				<p class="hint">Say it to yourself first. Then turn the card.</p>
			{/if}

			<div class="tools">
				<button class="chip quiet" onclick={back} disabled={at === 0}>◂ Back</button>
				<button class="chip quiet" onclick={skip}>Later ▸</button>
			</div>
		{/if}
	</article>
</div>

<style>
	.view { padding-block: 26px 80px; max-width: 760px; }
	.crumbs { font-size: var(--t-micro); margin-bottom: 14px; color: var(--muted); }
	.crumbs a { color: var(--muted); text-decoration: none; }
	.crumbs a:hover { color: inherit; }
	h1 { font-size: var(--t-h2); margin-bottom: 6px; }
	.where { font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; color: var(--muted); }
	.empty { padding: 32px 0; color: var(--muted); font-style: italic; }
	.note { color: var(--ink-soft); max-width: var(--measure); margin-top: 12px; }
	.hint { color: var(--muted); font-size: var(--t-small); margin-top: 12px; font-style: italic; }
	.judge { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
	.tools { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
	/* The global .chip (app.css) is the look, including .go. This page only
	   makes every one of them a 44px target, and adds the quiet pair. A local
	   `.chip { ... }` block would out-rank the global `.chip.go` on a tie and
	   is how ten pages ended up with four different active styles. */
	.judge :global(.chip), .tools :global(.chip) {
		min-height: 44px; display: inline-flex; align-items: center; gap: 8px; color: var(--ink);
	}
	.judge :global(.chip.go), .tools :global(.chip.go) { color: var(--on-accent); }
	.tools :global(.chip.quiet) { background: transparent; color: var(--ink-soft); }
	kbd {
		font-family: var(--text); font-size: 11px; border: 1px solid var(--line); border-radius: 2px;
		padding: 0 5px; color: var(--muted);
	}
	.done h2 { font-family: var(--display); font-size: 24px; margin-bottom: 8px; }
	.termlist { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: var(--t-small); margin-top: 6px; }
	.termlist a { color: inherit; min-height: 28px; display: inline-flex; align-items: center; }
	.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style>
