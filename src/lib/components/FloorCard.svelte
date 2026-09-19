<!--
  One Floor Deck card: the term on the front, four layers on the back.

  The back opens on THE GUEST LINE, what a server says at the table, and the
  other three layers (the why, service facts, context) sit one tap deeper as
  native <details>. A new hire can stop at the guest line; a captain can read
  to the bottom. The page owns which layers are open, so a reader who opens
  "the why" once keeps it open for the rest of the sitting.

  THE PAYWALL CONTRACT. The monorepo's oot-locks.js blurs `.flash .def` for a
  free visitor. So the root here is class="flash" and every piece of answer
  text sits in an element with class="def", both written as literal
  double-quoted class attributes, because src/lib/navigation.test.ts finds
  them by reading this file. Renaming either fails OPEN: every card's answer
  ships in clear to a visitor who has not paid. This component is registered
  in that test's CONTRACT, and the deck's routes render answers only through
  it, so the contract is kept in one file.

  THE CAUTION LINE is not in a .def and is never authored. The card's data
  carries ingredient nouns only; the sentence around them comes from the
  deck's one `frame`, so no card can phrase an allergen verdict because no
  card phrases this at all. It is styled as a caution: no tick, no cross, no
  green, no red. A server reads it as "go and ask", which is the only honest
  thing a training card can say about what is in tonight's dish.

  Motion is a CSS animation on purpose. A Svelte `transition:` runs through
  the Web Animations API and sails past the global reduced-motion rule in
  app.css, which stops CSS animations and transitions only.
-->
<script module lang="ts">
	export type OpenLayers = { why: boolean; facts: boolean; context: boolean };
</script>

<script lang="ts">
	import { base } from '$app/paths';
	import type { Snippet } from 'svelte';
	import type { DeckCard, FloorDeck } from '$lib/types';
	import { deckHref } from '$lib/floor-deck-core.mjs';

	let {
		card,
		frame,
		sectionTitle = '',
		names,
		revealed = $bindable(false),
		open = $bindable({ why: false, facts: false, context: false }),
		size = 'normal',
		flippable = true,
		heading = 'h2',
		before,
		onflip
	}: {
		card: DeckCard;
		frame: FloorDeck['frame'];
		sectionTitle?: string;
		/** id -> term, for the "often confused with" links */
		names?: ReadonlyMap<string, string>;
		revealed?: boolean;
		open?: OpenLayers;
		/** `stage` is Lineup: legible at arm's length */
		size?: 'normal' | 'stage';
		/** false: an answer shown as an answer (a test result), never a front */
		flippable?: boolean;
		heading?: 'h2' | 'h3';
		/** rendered between the term and the answer: "You chose ..." */
		before?: Snippet;
		onflip?: () => void;
	} = $props();

	const shown = $derived(revealed || !flippable);

	/** "beef, often garlic and red wine" */
	const madeWith = $derived.by(() => {
		const items = card.madeWith ?? [];
		if (items.length < 2) return items.join('');
		return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
	});

	const related = $derived(
		(card.confusedWith ?? [])
			.map((id) => ({ id, term: names?.get(id) }))
			.filter((x): x is { id: string; term: string } => Boolean(x.term))
	);
	const alsoSee = $derived(
		(card.seeAlso ?? [])
			.map((id) => ({ id, term: names?.get(id) }))
			.filter((x): x is { id: string; term: string } => Boolean(x.term))
	);

	function flip() {
		revealed = true;
		onflip?.();
	}
</script>

<div class="flash" class:stage={size === 'stage'} data-card={card.id}>
	{#if sectionTitle}<p class="eyebrow">{sectionTitle}</p>{/if}
	<svelte:element this={heading} class="term">{card.term}</svelte:element>
	{#if card.say}
		<p class="say"><span class="sr">Pronounced </span>{card.say}</p>
	{/if}
	{#if card.aliases?.length}
		<p class="aka">also {card.aliases.join(', ')}</p>
	{/if}

	{@render before?.()}

	{#if !shown}
		<button class="chip go turn" onclick={flip}>Show the card</button>
	{:else}
		<div class="back">
			<p class="layer">The guest line</p>
			<p class="def guest">{card.guest}</p>

			<details bind:open={open.why}>
				<summary>The why</summary>
				<p class="def">{card.why}</p>
			</details>

			{#if card.madeWith?.length || card.note}
				<details bind:open={open.facts}>
					<summary>Service facts</summary>
					{#if card.madeWith?.length}
						<p class="def">{frame.madeWith} {madeWith}.</p>
						<p class="caution">{frame.confirm}</p>
					{/if}
					{#if card.note}<p class="def">{card.note}</p>{/if}
				</details>
			{/if}

			<details bind:open={open.context}>
				<summary>Context</summary>
				<dl class="ctx">
					{#if card.origin}
						<dt>Where it comes from</dt>
						<dd class="def">{card.origin}</dd>
					{/if}
					{#if card.pairs}
						<dt>On the plate with</dt>
						<dd class="def">{card.pairs}</dd>
					{/if}
					{#if card.notThis}
						<dt>Not to be confused</dt>
						<dd class="def">{card.notThis}</dd>
					{/if}
				</dl>
				{#if related.length}
					<p class="links" role="group" aria-label="Often confused with {card.term}">
						<span class="linklabel">Often confused with</span>
						{#each related as r (r.id)}<a href={deckHref(base, r)}>{r.term}</a>{/each}
					</p>
				{/if}
				{#if alsoSee.length}
					<p class="links" role="group" aria-label="Related to {card.term}">
						<span class="linklabel">See also</span>
						{#each alsoSee as r (r.id)}<a href={deckHref(base, r)}>{r.term}</a>{/each}
					</p>
				{/if}
			</details>

			{#if card.lexiconSlug || card.recipe}
				<p class="links further">
					{#if card.lexiconSlug}<a href="{base}/lexicon#{card.lexiconSlug}">The long entry in the Lexicon</a>{/if}
					{#if card.recipe}<a href="{base}/recipe/{card.recipe}">See it made</a>{/if}
				</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.flash {
		border: 1px solid var(--line); background: var(--card); border-radius: var(--radius);
		padding: 20px 22px; margin-top: 10px;
	}
	.eyebrow {
		font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase; color: var(--muted); margin-bottom: 8px;
	}
	.term { font-family: var(--display); font-size: 30px; line-height: 1.15; margin: 0 0 4px; text-wrap: balance; }
	.say { font-size: var(--t-small); color: var(--ink-soft); letter-spacing: 0.04em; margin-bottom: 2px; }
	.aka { font-size: var(--t-small); color: var(--muted); font-style: italic; }
	.sr {
		position: absolute; width: 1px; height: 1px; overflow: hidden;
		clip-path: inset(50%); white-space: nowrap;
	}
	.turn { margin-top: 16px; min-height: 44px; }

	.back { margin-top: 14px; animation: rise 160ms ease-out; }
	@keyframes rise {
		from { opacity: 0; translate: 0 4px; }
		to { opacity: 1; translate: 0 0; }
	}
	.layer {
		font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase; color: var(--muted); margin-bottom: 4px;
	}
	.def { max-width: var(--measure); margin-bottom: 8px; }
	.guest { font-family: var(--display); font-size: 20px; line-height: 1.4; margin-bottom: 14px; }

	details { border-top: 1px solid var(--line); }
	summary {
		cursor: pointer; min-height: 44px; display: flex; align-items: center;
		font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase; color: var(--ink-soft); list-style: none;
	}
	summary::-webkit-details-marker { display: none; }
	summary::before { content: '▸'; display: inline-block; width: 1.2em; color: var(--muted); }
	details[open] > summary::before { content: '▾'; }
	summary:hover { color: var(--ink); }
	details > :last-child { margin-bottom: 12px; }

	/* A caution, not a verdict: the /service "gaps" idiom. No tick, no cross,
	   and no green or red anywhere near it. */
	.caution {
		border-left: 2px solid var(--turmeric-deep); background: var(--paper-raised);
		padding: 8px 12px; margin: 0 0 10px; max-width: var(--measure);
		font-size: var(--t-small); color: var(--ink-soft);
	}

	.ctx { margin: 0; }
	.ctx dt {
		font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase; color: var(--muted); margin-top: 6px;
	}
	.ctx dd { margin: 2px 0 8px; }

	.links { display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: baseline; font-size: var(--t-small); }
	.links a { color: inherit; min-height: 24px; }
	.linklabel { color: var(--muted); }
	.further { border-top: 1px solid var(--line); padding-top: 12px; margin-top: 2px; }

	/* Lineup: read from across a pass */
	.stage { padding: 28px 26px; }
	.stage .term { font-size: clamp(2.5rem, 11vw, 7rem); overflow-wrap: anywhere; }
	.stage .say { font-size: clamp(1rem, 3vw, 1.6rem); }
	.stage .guest { font-size: clamp(1.3rem, 3.6vw, 2.2rem); }
</style>
