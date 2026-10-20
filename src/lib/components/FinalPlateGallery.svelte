<script lang="ts">
	import { base } from '$app/paths';
	import type { House } from '$lib/house/house-schema';
	import { BRENNANS_HOUSE_ID } from '$lib/teaching-folios';
	import { brennansFinalDishes, finalDishKey, filterFinalDishes, houseDishIdForFinal, FINAL_DISH_CAPTION } from '$lib/brennans-final-dishes';
	import FinalDishImage from './FinalDishImage.svelte';
	import { levels } from '$lib/stores/levels.svelte';

	let { current, onOpen }: { current?: House | null; onOpen: (id: string) => void } = $props();
	let query = $state('');
	let collection = $state('');
	let category = $state('');
	let expandedKey = $state('');
	const categories = $derived([...new Set(filterFinalDishes(brennansFinalDishes, '', collection).map(art => art.category))].sort());
	const rows = $derived(filterFinalDishes(brennansFinalDishes, query, collection, category));
	const currentDishIds = $derived(new Set(current?.id === BRENNANS_HOUSE_ID ? current.dishes.map(dish => dish.id) : []));

	function chooseCollection(value: string) {
		collection = value;
		category = '';
		expandedKey = '';
	}
	function clear() { query = ''; collection = ''; category = ''; expandedKey = ''; }
</script>

<section class="final-plates" aria-labelledby="final-plates-h">
	<header>
		<p class="eyebrow">Brennan's · The finished table</p>
		<h2 id="final-plates-h">Final Plates</h2>
		<p class="lede">Explore each dish as it might arrive at the table. Recognise the components, practise the description, then test your recall in Today's Study.</p>
		<p class="scope">{FINAL_DISH_CAPTION}</p>
		<nav class="chips" aria-label="Final plate study doors">
			<a class="chip go" href="{base}/level/{levels.chosen}">Today's Study</a>
			<a class="chip" href="{base}/flashcards">Practise</a>
			<a class="chip" href="{base}/menu?view=fall">Fall field notes</a>
		</nav>
	</header>
	<div class="filters">
		<label>Find a dish or ingredient<input type="search" bind:value={query} placeholder="Try Hussarde, crab or chocolate" /></label>
		<label>Menu collection<select aria-label="Menu collection" value={collection} onchange={event => chooseCollection(event.currentTarget.value)}><option value="">All collections</option><option value="house">Main collection</option><option value="fall">Fall 2026 dishes</option></select></label>
		<label>Menu section<select aria-label="Menu section" bind:value={category}><option value="">All sections</option>{#each categories as name}<option value={name}>{name}</option>{/each}</select></label>
	</div>
	<p class="results" role="status">{rows.length} of {brennansFinalDishes.length} final presentations{#if query || collection || category} · <button class="clear" onclick={clear}>Clear filters</button>{/if}</p>
	<div class="plate-grid">
		{#each rows as art (finalDishKey(art))}
			{@const key = finalDishKey(art)}
			{@const canonicalId = houseDishIdForFinal(art)}
			<article class="plate-tile" class:expanded={expandedKey === key} data-plate={key}>
				<button class="plate-preview" aria-expanded={expandedKey === key} aria-controls="final-view-{art.collection}-{art.itemId}" onclick={() => expandedKey = expandedKey === key ? '' : key}>
					<img src="{base}/{art.thumbnailSrc}" alt="" width={art.thumbnailWidth} height={art.thumbnailHeight} loading="lazy" decoding="async" />
					<span class="tile-copy">
						<span class="eyebrow">{art.collection === 'fall' ? 'Fall 2026' : 'Main collection'} · {art.category}</span>
						<span class="dish-name">{art.name}</span>
						<span class="view-label">{expandedKey === key ? 'Close presentation' : 'View final presentation'}</span>
					</span>
				</button>
				<div id="final-view-{art.collection}-{art.itemId}">
					{#if expandedKey === key}
						<div class="plate-expanded">
							<FinalDishImage itemId={art.itemId} collection={art.collection} houseId={BRENNANS_HOUSE_ID} />
							<nav class="chips" aria-label="Learn {art.name}">
								{#if currentDishIds.has(canonicalId)}
									<button class="chip go plate-lesson" data-plate-id={canonicalId} onclick={() => onOpen(canonicalId)}>Read this dish</button>
									<a class="chip" href="{base}/flashcards?deck=item:{encodeURIComponent(canonicalId)}">Drill this dish</a>
									{#if art.collection === 'fall'}<a class="chip" href="{base}/menu?view=fall&kind=dish&item={encodeURIComponent(art.itemId)}">Fall ingredient notes</a>{/if}
								{:else if art.collection === 'fall'}
									<a class="chip go" href="{base}/menu?view=fall&kind=dish&item={encodeURIComponent(art.itemId)}">Read this dish</a>
									<a class="chip" href="{base}/flashcards?deck=fall:item:{encodeURIComponent(art.itemId)}">Drill this dish</a>
								{:else}
									<p class="scope">This presentation belongs to the saved Brennan's collection. Its lesson is available when that restaurant is open on this device.</p>
								{/if}
							</nav>
						</div>
					{/if}
				</div>
			</article>
		{/each}
	</div>
	{#if !rows.length}<p class="scope">No dishes match those filters. Try another ingredient or clear the filters.</p>{/if}
</section>

<style>
	.final-plates { margin: 24px auto; max-width: 1040px; }
	header { padding-block: 12px 20px; border-bottom: 1px solid var(--line-strong); }
	h2 { font: 500 clamp(2.1rem, 5vw, 3.1rem)/1.15 var(--display); margin: 8px 0 16px; }
	.eyebrow { color: var(--turmeric-deep); font-size: .8rem; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; }
	.lede { font-size: 1.2rem; line-height: 1.6; max-width: 65ch; color: var(--ink-soft); }
	.scope { color: var(--ink-soft); line-height: 1.6; max-width: 75ch; font-size: 1rem; }
	.chips { display: flex; gap: 10px; flex-wrap: wrap; margin-block: 18px 0; }
	.filters { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 16px; margin-block: 24px 16px; }
	label { display: grid; gap: 8px; font-size: 1rem; color: var(--ink-soft); min-width: 0; }
	input, select { min-height: 48px; min-width: 0; width: 100%; border: 1px solid var(--field-line); background: var(--paper-raised); color: var(--ink); font: inherit; padding: 10px 12px; border-radius: 4px; box-sizing: border-box; }
	.results { color: var(--ink-soft); font-size: 1rem; }
	.clear { font: inherit; text-decoration: underline; text-underline-offset: 3px; background: transparent; color: var(--turmeric-deep); border: 0; min-height: 44px; cursor: pointer; }
	.plate-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; align-items: start; }
	.plate-tile { border: 1px solid var(--line-strong); border-radius: 26px 26px 4px 4px; overflow: hidden; background: var(--paper-raised); }
	.plate-tile.expanded { grid-column: 1 / -1; }
	.plate-preview { border: 0; padding: 0; width: 100%; background: transparent; color: var(--ink); text-align: left; cursor: pointer; display: block; }
	.plate-preview:hover .dish-name { color: var(--turmeric-deep); }
	.plate-preview:focus-visible { outline: 3px solid var(--turmeric-deep); outline-offset: -4px; }
	.plate-preview img { display: block; width: 100%; height: auto; aspect-ratio: 3 / 2; object-fit: contain; background: var(--paper); }
	.expanded .plate-preview img { display: none; }
	.tile-copy { display: grid; gap: 12px; padding: 20px; }
	.dish-name { font: 600 1.65rem/1.25 var(--display); }
	.view-label { color: var(--turmeric-deep); text-decoration: underline; text-underline-offset: 4px; font-size: 1rem; }
	.plate-expanded { padding: 0 20px 22px; }
	.plate-expanded :global(.final-dish) { margin-top: 0; border: 0; background: transparent; border-radius: 0; }
	.plate-expanded :global(.final-dish > h3) { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
	.plate-expanded :global(.plate-body) { padding: 0; }
	@media (max-width: 700px) { .filters { grid-template-columns: 1fr; } .plate-grid { grid-template-columns: 1fr; } .tile-copy, .plate-expanded { padding-inline: 16px; } }
</style>
