<!--
  Say it back: the direction a guest's question actually arrives in.

  A flip card starts from the word. A table starts from the thing: "what's the
  one that's like bacon but not smoked?", or a finger on a menu line. So this
  round runs the other way. Most questions show a card's why with its own term
  taken out (redacted at BUILD time, tools/derive/floor-deck.mjs, and held to
  the redactor's leak gates) and ask for the term. Up to three in a round show
  a dish line and ask what a word in it means, using the house's own menu from
  My Menu where it names a deck term, and the card's authored line where it
  does not, so the mode works on the day a venue has typed in nothing.

  Two steps, on purpose: the prompt alone first, with "I've said it" before the
  choices appear. Four options in view turn recall into recognition, and
  recognition is the easier skill and not the one the floor needs.

  It is OBJECTIVE, so it records met or missed and may climb the ladder, and it
  is the one deck mode that dispatches oot:round-complete, because it is a
  ten-question round like the service drill and the suite's log is built for
  exactly that. The SCREEN still ends the way the owner asked the written test
  to end: on what was missed, with the cards, and no number.

  Each answer is written when it is given. It never loads the traps.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { loadFloorDeck } from '$lib/data';
	import { session } from '$lib/stores/session.svelte';
	import { house } from '$lib/stores/house.svelte';
	import { markStudied } from '$lib/oot-studied';
	import { gradeFor } from '$lib/drill';
	import FloorCard from '$lib/components/FloorCard.svelte';
	import { liveSections, sayRound, sectionsFromSearch, type SayQuestion } from '$lib/floor-deck';
	import type { DeckCard, FloorDeck } from '$lib/types';

	let deck = $state<FloorDeck | null>(null);
	let failed = $state(false);
	let search = $state<string | null>(null);

	let round = $state<SayQuestion[] | null>(null);
	let at = $state(0);
	let said = $state(false);
	let picked = $state<string | null>(null);
	let right = $state(0);
	let misses = $state<DeckCard[]>([]);
	let done = $state(false);

	onMount(async () => {
		try {
			deck = await loadFloorDeck();
		} catch {
			failed = true;
		}
	});
	afterNavigate(() => {
		search = location.search;
	});

	const names = $derived(new Map((deck?.cards ?? []).map((c) => [c.id, c.term])));
	const titles = $derived(new Map((deck?.sections ?? []).map((s) => [s.key, s.title])));
	const q = $derived(round ? (round[at] ?? null) : null);
	const ready = $derived(Boolean(deck) && session.ready && search !== null);

	/** the house's own words: dish names, descriptions and ingredient lines */
	const houseLines = $derived(
		house.dishes.flatMap((d) => [d.name, d.description, ...(d.ingredients ?? [])]).filter((s) => s && s.length >= 8)
	);

	function start() {
		if (!deck || search === null) return;
		const scope = sectionsFromSearch(search, liveSections(deck).map((s) => s.key));
		round = sayRound(deck, session.drillLog, Date.now(), Math.random, { scope, houseLines });
		at = 0;
		said = false;
		picked = null;
		right = 0;
		misses = [];
		done = false;
	}

	function answer(text: string) {
		if (!q || picked) return;
		picked = text;
		const correct = q.options.find((o) => o.text === text)?.correct === true;
		if (correct) right += 1;
		else misses = [...misses, q.card];
		session.markDrilled(q.card.id, gradeFor(correct, false));
	}

	function next() {
		if (!round) return;
		if (at + 1 >= round.length) {
			done = true;
			finish();
			return;
		}
		at += 1;
		said = false;
		picked = null;
	}

	function finish() {
		if (!round) return;
		try {
			window.dispatchEvent(
				new CustomEvent('oot:round-complete', { detail: { kind: 'quiz', right, of: round.length } })
			);
		} catch {
			/* standalone, or a hardened browser. The round still counted. */
		}
		markStudied();
	}
</script>

<svelte:head><title>Say it back · The Floor Deck · The World Table</title></svelte:head>

<div class="shell view">
	<nav class="crumbs"><a href="{base}/service">Service</a> · <a href="{base}/service/deck">The Floor Deck</a></nav>
	<h1>Say it back</h1>

	<article class="sheet">
		{#if failed}
			<p class="empty">The deck did not load. Check the connection once; after that it works offline.</p>
		{:else if !deck || search === null}
			<p class="empty" aria-live="polite">Opening the deck…</p>
		{:else if !round}
			<p class="lede">
				The way a guest asks it. You get the description with the word taken out, or a line from a
				menu, and you say the answer before you see any choices. What is owed from a miss comes
				first.
			</p>
			<p class="tools">
				<button class="chip go" onclick={start} disabled={!ready}>Begin</button>
				<a class="chip" href="{base}/service/deck">The deck</a>
			</p>
		{:else if !round.length}
			<p class="empty">There are not enough cards in that choice to field a round yet.</p>
			<p class="tools"><a class="chip" href="{base}/service/deck">The deck</a></p>
		{:else if done}
			<div class="result" role="status">
				{#if misses.length}
					<h2>What you missed</h2>
					<p class="note">These lead your next sitting, and stay owed until you have them on another day.</p>
					{#each misses as m (m.id)}
						<FloorCard
							card={m}
							frame={deck.frame}
							sectionTitle={titles.get(m.section) ?? ''}
							{names}
							flippable={false}
							heading="h3"
							open={{ why: true, facts: false, context: true }}
						/>
					{/each}
				{:else}
					<h2>Nothing missed.</h2>
					<p class="note">Every term in this round moves up the ladder and comes back later, further apart.</p>
				{/if}
				<p class="tools">
					{#if misses.length}
						<a class="chip go" href="{base}/service/deck/study?focus=misses">Study these now</a>
					{/if}
					<button class="chip" onclick={start}>Another round</button>
					<a class="chip" href="{base}/service/deck">The deck</a>
				</p>
			</div>
		{:else if q}
			<p class="where">Question {at + 1} of {round.length}</p>
			<div class="ask">
				{#if q.kind === 'line'}
					<p class="eyebrow">On a menu</p>
					<p class="dish">{q.stem}</p>
					<p class="prompt">What is <b>{q.card.term}</b>?</p>
				{:else}
					<p class="eyebrow">What is this?</p>
					<p class="stem">{q.stem}</p>
				{/if}

				{#if !said}
					<p class="tools">
						<button class="chip go" onclick={() => (said = true)}>I've said it. Show the choices</button>
					</p>
				{:else}
					<div class="opts" role="group" aria-label="Choices">
						{#each q.options as o (o.text)}
							<button
								class="opt"
								class:right={picked !== null && o.correct}
								class:wrong={picked === o.text && !o.correct}
								disabled={picked !== null}
								onclick={() => answer(o.text)}
							>
								{o.text}
								{#if picked !== null && o.correct}<span class="mark"> ✓ this one</span>{/if}
								{#if picked === o.text && !o.correct}<span class="mark"> ✗ not this</span>{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			{#if picked !== null}
				<FloorCard
					card={q.card}
					frame={deck.frame}
					sectionTitle={titles.get(q.card.section) ?? ''}
					{names}
					flippable={false}
					heading="h2"
				/>
				<p class="tools"><button class="chip go" onclick={next}>Next</button></p>
			{/if}
		{/if}
	</article>
</div>

<style>
	.view { padding-block: 26px 80px; max-width: 760px; }
	.crumbs { font-size: var(--t-micro); margin-bottom: 14px; color: var(--muted); }
	.crumbs a { color: var(--muted); text-decoration: none; }
	.crumbs a:hover { color: inherit; }
	h1 { font-size: var(--t-h2); margin-bottom: 6px; }
	.lede { color: var(--ink-soft); max-width: var(--measure); margin-bottom: 16px; }
	.note { color: var(--ink-soft); max-width: var(--measure); margin-bottom: 8px; }
	.empty { padding: 32px 0; color: var(--muted); font-style: italic; }
	.where, .eyebrow {
		font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; color: var(--muted);
	}
	.eyebrow { margin-bottom: 8px; }
	.ask { border: 1px solid var(--line); background: var(--card); border-radius: var(--radius); padding: 20px 22px; margin-top: 10px; }
	.stem { font-family: var(--display); font-size: 20px; line-height: 1.45; max-width: var(--measure); font-style: italic; }
	.dish { font-family: var(--display); font-size: 22px; line-height: 1.35; }
	.prompt { color: var(--ink-soft); margin-top: 8px; }
	.opts { display: grid; gap: 8px; margin-top: 14px; }
	.opt {
		text-align: left; border: 1px solid var(--line); background: var(--paper, transparent); color: var(--ink);
		border-radius: var(--radius); padding: 12px 14px; min-height: 44px; cursor: pointer;
		font-family: var(--display); font-size: 17px; line-height: 1.35;
	}
	.opt:hover:not(:disabled) { border-color: var(--turmeric); }
	/* never colour alone: the word and the glyph carry it, the border agrees */
	.opt.right { border-color: var(--leaf); }
	.opt.wrong { border-color: var(--chili); }
	.opt:disabled { cursor: default; }
	.opt:disabled:not(.right):not(.wrong) { opacity: 0.55; }
	.mark { font-family: var(--text); font-size: var(--t-small); color: var(--ink-soft); }
	.result h2 { font-family: var(--display); font-size: 24px; margin-bottom: 8px; }
	.tools { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
	.tools :global(.chip) { min-height: 44px; display: inline-flex; align-items: center; }
</style>
