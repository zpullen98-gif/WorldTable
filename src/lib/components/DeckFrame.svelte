<!--
  The card screen's frame, the one card style (docs/consolidation-design.md
  2.6 and 3.7): the position line, the eyebrow that says which side is up,
  the face, and the controls in one row in one order. Flip first; Got it and
  Again only once the card is turned, never before (the rule every deck in
  the app already kept), so a stray tap never grades a card nobody read.

  The face is the page's: a house card's front and back, a Floor Deck card
  (FloorCard.svelte, the one place a deck card's answers render, under the
  .flash and .def contract), or a Lexicon term. The frame records nothing;
  the page grades through the engine each card came from.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		position,
		flipped,
		onFlip,
		onGrade,
		face
	}: {
		/** "Card 3 of 12 · The whole menu" */
		position: string;
		flipped: boolean;
		onFlip: () => void;
		onGrade: (got: boolean) => void;
		face: Snippet;
	} = $props();

	let pos: HTMLParagraphElement | undefined = $state();
	export function focus() {
		pos?.focus({ preventScroll: true });
	}
</script>

<div class="deckframe" data-flipped={flipped ? 'yes' : 'no'}>
	<p class="where" tabindex="-1" bind:this={pos} aria-live="polite">{position}</p>
	<p class="side">{flipped ? 'Answer' : 'Front'}</p>
	<div class="face">
		{@render face()}
	</div>
	<div class="controls" role="group" aria-label="This card">
		{#if !flipped}
			<button type="button" class="chip go flip" onclick={onFlip}>Flip</button>
		{:else}
			<button type="button" class="chip go got" onclick={() => onGrade(true)}>Got it</button>
			<button type="button" class="chip again" onclick={() => onGrade(false)}>Again</button>
		{/if}
	</div>
</div>

<style>
	.deckframe {
		max-width: 760px;
	}
	.where {
		font-size: 1rem;
		color: var(--ink-soft);
		margin: 4px 0 2px;
		font-variant-numeric: tabular-nums;
	}
	.where:focus {
		outline: none;
	}
	.side {
		font-family: var(--house-display, var(--display));
		font-size: 0.9375rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--turmeric-deep);
		margin: 0 0 4px;
	}
	.controls {
		display: flex;
		gap: 8px;
		margin-top: 14px;
	}
	.controls .chip {
		flex: 1 1 50%;
		min-height: 56px;
		font-size: 1.1rem;
	}
	.controls .flip {
		flex-basis: 100%;
	}
</style>
