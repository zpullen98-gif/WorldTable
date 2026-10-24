<script lang="ts">
	import { base } from '$app/paths';
	import type { House } from '$lib/house/house-schema';
	import { dishComparisons } from '$lib/service-guides';
	import { foliosForDish } from '$lib/teaching-folios';
	import { finalDishFor, FINAL_DISH_CAPTION } from '$lib/brennans-final-dishes';
	import PlateIllustration from './PlateIllustration.svelte';

	let { current, itemId, onOpen, is86 = () => false }: {
		current: House;
		itemId: string;
		onOpen: (id: string) => void;
		is86?: (id: string) => boolean;
	} = $props();
	const comparisons = $derived(dishComparisons(current, itemId));
	let opened = $state<Record<string, boolean>>({});
</script>

{#if comparisons.length}
	<section class="dish-comparisons" aria-labelledby="dish-comparisons-h">
		<h3 id="dish-comparisons-h">Tell the dishes apart</h3>
		<p class="intro">Compare the menu’s words, then explain the difference to a guest.</p>
		{#each comparisons as comparison (comparison.id)}
			<details class="comparison" data-comparison={comparison.id} ontoggle={(event) => { opened[comparison.id] = event.currentTarget.open; }}>
				<summary><span>{comparison.sides[0].name} <span class="versus">&amp;</span> {comparison.sides[1].name}</span><span class="open-label">Compare</span></summary>
				<div class="comparison-body">
					<div class="comparison-grid">
						{#each comparison.sides as side, i (side.id)}
							{@const art = finalDishFor(current.id, side.id)}
							<section class="dish-panel" aria-labelledby="cmp-{comparison.id}-{side.id}" data-side={side.id}>
								<p class="eyebrow"><span class="letter" aria-hidden="true">{i === 0 ? 'A' : 'B'}</span> {side.meals.join(' · ')}{#if is86(side.id)}<strong> · 86 tonight</strong>{/if}</p>
								<h4 id="cmp-{comparison.id}-{side.id}">{side.name}</h4>
								{#if art && opened[comparison.id]}
									<div class="comparison-plate" data-comparison-plate={side.id}>
										<PlateIllustration src="{base}/{art.src}" title={art.name} alt={art.alt} width={art.width} height={art.height} embedded guideLabel="Compare the named components, then explain the difference." unavailableLabel="The menu components remain below. Reconnect to load this presentation." />
									</div>
								{/if}
								{#if side.description}<p class="menu-description">{side.description}</p>{/if}
								{#if side.ingredients.length}
									<p class="eyebrow component-label">Named components</p>
									<ul class="ingredients">{#each side.ingredients as ingredient, n (n)}<li>{ingredient}</li>{/each}</ul>
								{/if}
								<div class="doors">
									{#if side.id !== itemId}<button type="button" onclick={() => onOpen(side.id)}>Study {side.name}</button>{/if}
									{#each foliosForDish(current.id, side.id) as folio (folio.id)}<a href="{base}/plates#folio-{folio.id}">Illustrated study: {folio.title}</a>{/each}
								</div>
							</section>
						{/each}
					</div>
					{#if comparison.sides.some(side => finalDishFor(current.id, side.id))}<p class="boundary image-boundary">{FINAL_DISH_CAPTION}</p>{/if}
					{#if comparison.difference}<div class="contrast"><h4>What tells them apart</h4><p>{comparison.difference}</p></div>{/if}
					{#if comparison.ask}<div class="guest"><h4>A question for the guest</h4><p>{comparison.ask}</p></div>{/if}
					<details class="recall"><summary>Practise the distinction</summary><p>Look away and name one difference in the main ingredient, preparation or sauce. Explain it in one sentence, then check the menu words above.</p></details>
					<p class="boundary">These are menu components and study references. Confirm current presentation, availability and ingredient questions with the house.</p>
				</div>
			</details>
		{/each}
	</section>
{/if}

<style>
	.dish-comparisons { margin: 24px 0 12px; }
	h3 { margin: 0 0 5px; font-family: var(--display); font-size: var(--t-h3); }
	.intro { color: var(--ink-soft); margin: 0 0 12px; line-height: 1.5; }
	.comparison { border: 1px solid var(--line-strong); border-radius: var(--radius); margin: 10px 0; background: var(--house-panel); }
	summary { min-height: 44px; padding: 12px; cursor: pointer; box-sizing: border-box; }
	.comparison > summary { font-family: var(--display); font-size: 1.2rem; line-height: 1.35; }
	.open-label { display: inline-block; margin-left: 10px; font: 0.9rem var(--text); color: var(--turmeric-deep); }
	.versus { color: var(--turmeric-deep); padding: 0 3px; }
	.comparison[open] > summary { border-bottom: 1px solid var(--line); }
	.comparison-body { padding: 12px; }
	.comparison-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
	.dish-panel { min-width: 0; padding: 14px; background: var(--paper); border: 1px solid var(--line); border-top: 3px solid var(--turmeric); }
	.eyebrow { margin: 0 0 8px; color: var(--muted); font-size: var(--t-small); line-height: 1.5; }
	.letter { display: inline-grid; place-items: center; width: 24px; height: 24px; border: 1px solid var(--line-strong); border-radius: 50%; margin-right: 5px; color: var(--turmeric-deep); }
	h4 { font-family: var(--display); font-size: 1.25rem; line-height: 1.25; margin: 0 0 8px; overflow-wrap: anywhere; }
	.menu-description { margin: 0 0 14px; line-height: 1.5; }
	.component-label { font-weight: 600; }
	.ingredients { padding-left: 18px; margin: 0; line-height: 1.5; }
	.ingredients li { margin: 4px 0; }
	.doors { display: grid; gap: 8px; margin-top: 12px; }
	.doors a, .doors button { display: flex; align-items: center; min-height: 44px; padding: 7px 9px; box-sizing: border-box; border: 1px solid var(--line); border-radius: var(--radius); background: var(--card); color: var(--ink); text-align: left; font: inherit; line-height: 1.3; text-underline-offset: 3px; cursor: pointer; overflow-wrap: anywhere; }
	.doors a:hover, .doors button:hover { border-color: var(--turmeric); }
	.contrast, .guest { border-left: 2px solid var(--turmeric); margin-top: 14px; padding: 4px 12px; }
	.contrast p, .guest p { margin: 0; line-height: 1.55; }
	.recall { border-top: 1px solid var(--line); margin-top: 14px; }
	.recall summary { color: var(--turmeric-deep); padding-left: 0; }
	.recall p { margin: 0 0 10px; line-height: 1.5; }
	.boundary { color: var(--muted); font-size: var(--t-small); line-height: 1.5; margin: 14px 0 0; }
	summary:focus-visible, a:focus-visible, button:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: 3px; }
	@media (max-width: 600px) { .comparison-grid { grid-template-columns: 1fr; } .dish-panel { padding: 12px; } }
</style>
