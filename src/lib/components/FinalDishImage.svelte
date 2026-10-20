<script lang="ts">
	import { base } from '$app/paths';
	import { finalDishFor, FINAL_DISH_CAPTION } from '$lib/brennans-final-dishes';
	import PlateIllustration from './PlateIllustration.svelte';

	let { itemId, houseId = '', collection = 'house', compact = false }: {
		itemId: string; houseId?: string; collection?: 'house' | 'fall'; compact?: boolean;
	} = $props();
	let expanded = $state(false);
	const art = $derived(finalDishFor(houseId, itemId, collection));
</script>

{#snippet presentation()}
	{#if art}
		<p class="plate-caption">{FINAL_DISH_CAPTION}</p>
		<PlateIllustration src="{base}/{art.src}" title="{art.name} · Final presentation" alt={art.alt} width={art.width} height={art.height} embedded guideLabel="Study the finished dish, then name its components aloud." unavailableLabel="The ingredient cues remain available below. Reconnect to load the final presentation." />
		<div class="plate-reading">
			<h4>Read the plate</h4>
			<ul>{#each art.ingredientCues as cue}<li>{cue}</li>{/each}</ul>
			<p class="plate-note">{art.platingNote}</p>
		</div>
	{/if}
{/snippet}

{#if art}
	{#if compact}
		<details class="final-dish" data-final-dish={itemId} bind:open={expanded}>
			<summary>Study the final presentation</summary>
			<!-- The answer's disclosure requests no image until the learner opens it. -->
			{#if expanded}<div class="plate-body">{@render presentation()}</div>{/if}
		</details>
	{:else}
		<section class="final-dish" data-final-dish={itemId} aria-label="Final presentation of {art.name}">
			<h3>At the finished table</h3>
			<div class="plate-body">{@render presentation()}</div>
		</section>
	{/if}
{/if}

<style>
	.final-dish { margin: 24px 0; text-align: left; border: 1px solid var(--line-strong); border-radius: 24px 24px 4px 4px; background: var(--paper-raised); color: var(--ink); overflow: hidden; }
	h3, summary { margin: 0; padding: 16px 20px; font: 600 1.4rem/1.3 var(--display); }
	summary { min-height: 48px; cursor: pointer; align-content: center; }
	summary:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: -4px; }
	.plate-body { padding: 0 20px 20px; }
	.plate-caption, .plate-note { font: 400 1rem/1.6 var(--text); color: var(--ink-soft); }
	.plate-caption { margin: 0 0 16px; }
	.plate-reading { border-top: 1px solid var(--line); padding-top: 16px; margin-top: 20px; }
	h4 { font: 600 1.2rem/1.3 var(--display); margin: 0 0 10px; }
	ul { padding-left: 22px; margin: 0; }
	li { font-size: 1rem; font-weight: 400; line-height: 1.6; margin: 5px 0; }
	.plate-note { margin-bottom: 0; }
	@media (max-width: 600px) { h3, summary { padding-inline: 14px; } .plate-body { padding-inline: 14px; } }
</style>
