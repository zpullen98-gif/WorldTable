<!--
  One Cuisine card's face inside DeckFrame (the one card style): the entry it
  belongs to as the eyebrow, the front, and once turned the back with a way to
  the entry. The frame draws the controls and the page grades.
-->
<script lang="ts">
	import { studiesForIds } from '$lib/visual-study-links';
	import FolioLinks from '$lib/components/FolioLinks.svelte';
	let {
		front,
		back,
		eyebrow,
		flipped,
		readHref = null,
		folioIds = []
	}: {
		/** Null while the card's chapter is still loading, or when the card has been retired. */
		front: string | null;
		back: string;
		eyebrow: string;
		flipped: boolean;
		readHref?: string | null;
		folioIds?: readonly string[];
	} = $props();
	const folios = $derived(studiesForIds(folioIds));
</script>

<div class="flash czcard">
	<p class="kkind">{eyebrow}</p>
	{#if front === null}
		<p class="def">This card is not in the chapter any more, or the chapter is still opening. Grade it either way to move on.</p>
	{:else}
		<p class="term">{front}</p>
		{#if flipped}
			<p class="def back" aria-live="polite">{back}</p>
			{#if readHref}<p class="read"><a href={readHref}>Read about it</a></p>{/if}
			<FolioLinks {folios} label="Explore the illustrated studies" />
		{:else}
			<p class="def">Say it out loud, then flip.</p>
		{/if}
	{/if}
</div>

<style>
	.flash {
		border: 1px solid var(--line);
		background: var(--card);
		border-radius: var(--radius);
		padding: 20px 22px;
		margin-top: 10px;
	}
	.kkind {
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
		margin: 0 0 4px;
	}
	.term {
		font-family: var(--display);
		font-size: 26px;
		line-height: 1.3;
		margin: 0 0 6px;
	}
	.def {
		max-width: var(--measure);
		margin: 0 0 6px;
		font-size: var(--t-body);
		line-height: 1.5;
	}
	.def.back {
		font-size: 18px;
	}
	.read {
		margin: 8px 0 0;
	}
	.read a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		font-size: 1rem;
		color: var(--ink);
	}
</style>
