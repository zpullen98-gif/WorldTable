<script lang="ts">
	import { base } from '$app/paths';
	import { fallArtworkById } from '$lib/fall-menu-art';
	import PlateIllustration from './PlateIllustration.svelte';
	let { itemId, compact = false }: { itemId: string; compact?: boolean } = $props();
	let expanded = $state(false);
	const art = $derived(fallArtworkById.get(itemId));
</script>

{#snippet study(showImage: boolean)}
	{#if art}
		<p class="art-caption">{art.caption}</p>
		{#if showImage}
			<PlateIllustration src="{base}/{art.src}" title={art.title} alt={art.alt} width={art.width} height={art.height} embedded guideLabel="Explore the ingredient cues below." unavailableLabel="The ingredient notes below remain available. Reconnect to load the artwork." />
		{/if}
		<ul class="art-cues" aria-label="Ingredient cues">
			{#each art.cues as cue}<li><strong>{cue.label}</strong><p>{cue.text}</p></li>{/each}
		</ul>
		<p class="art-context">{art.context}</p>
	{/if}
{/snippet}

{#if art}
	{#if compact}
		<details class="fall-art" bind:open={expanded}>
			<summary>Explore the teaching image</summary>
			<!-- A revealed answer still requests no full image until its disclosure opens. -->
			{#if expanded}<div class="art-body">{@render study(true)}</div>{/if}
		</details>
	{:else}
		<section class="fall-art" aria-label="Teaching image for {art.title}">
			<h3>At the explorer's table</h3>
			<div class="art-body">{@render study(true)}</div>
		</section>
	{/if}
{/if}

<style>
	.fall-art { margin: 24px 0; border: 1px solid var(--line-strong); border-radius: 22px 22px 4px 4px; background: var(--paper-raised); overflow: hidden; color: var(--ink); text-align: left; }
	h3, summary { margin: 0; padding: 16px 20px; font: 600 1.35rem/1.3 var(--display); }
	summary { cursor: pointer; min-height: 44px; align-content: center; }
	summary:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: -4px; }
	.art-body { padding: 0 20px 20px; }
	.art-caption, .art-context { font-size: 1rem; color: var(--ink-soft); line-height: 1.6; margin: 0 0 16px; }
	.art-context { border-top: 1px solid var(--line); padding-top: 14px; margin: 18px 0 0; }
	.art-cues { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin: 20px 0 0; }
	.art-cues strong { font: 600 1.2rem/1.3 var(--display); color: var(--ink); }
	.art-cues p { font-size: 1rem; font-weight: 400; line-height: 1.6; color: var(--ink-soft); margin: 5px 0 0; }
	@media (max-width: 600px) { .art-cues { grid-template-columns: 1fr; } .art-body { padding: 0 14px 16px; } h3, summary { padding-inline: 14px; } }
</style>
