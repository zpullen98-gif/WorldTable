<script lang="ts">
	import { base } from '$app/paths';
	import { fallMenu, fallItemById, fallSourceById } from '$lib/fall-menu';
	let { itemId = '', kind = 'dish' }: { itemId?: string; kind?: string } = $props();
	let query = $state('');
	const item = $derived(fallItemById.get(itemId));
	const rows = $derived(fallMenu.items.filter((i) => (kind === 'all' || i.kind === kind) && `${i.name} ${i.listedIngredients.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())));
	const href = (id = '', scope = kind) => `${base}/menu?view=fall&kind=${scope}${id ? `&item=${encodeURIComponent(id)}` : ''}`;
	const cards = (id: string) => `${base}/flashcards?deck=${encodeURIComponent(id)}`;
</script>

{#snippet sources(ids: string[])}
	{#if ids.length}<span class="citations">{#each ids as id}{@const s = fallSourceById.get(id)}{#if s}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>{/if}{/each}</span>{/if}
{/snippet}

<section class="fall-folio" aria-label="Brennan's fall menu training">
	{#if item}
		<p class="eyebrow">Fall 2026 · {item.menuSection}</p>
		<h2>{item.name}</h2>
		{#if item.pronunciation}<p class="provenance">Say it: {item.pronunciation} <span>(approximate speaking guide)</span></p>{/if}
		<p class="lede">{item.shortDescription}</p>
		{#if item.price}<p class="provenance">${item.price} on the uploaded Fall 2026 sheet. Confirm the current price at service.</p>{/if}
		<nav class="chips" aria-label="Practise this item"><a class="chip go" href={cards(`fall:item:${item.id}`)}>Drill this item</a><a class="chip" href={cards('fall:tableside')}>Practise tableside lines</a></nav>
		<section class="tableside"><p class="eyebrow">At the table</p><blockquote>{item.tableside}</blockquote><p class="provenance">Suggested wording from the listed ingredients. Rehearse it in your own voice.</p></section>
		<h3>On the training sheet</h3>
		<ul class="ingredients">{#each item.listedIngredients as ingredient}<li>{ingredient}</li>{/each}</ul>
		<p class="provenance">Transcribed from your uploaded sheet, {item.photoFile}. Quantities, preparation and plating are only included when supplied.</p>
		<h3>Explore the ingredients</h3>
		<p class="provenance">Background knowledge explains the ingredient; it does not add ingredients to the house recipe.</p>
		{#each item.ingredientNotes as note}<details class="ingredient"><summary>{note.name}</summary><p>{note.explanation}</p>{#if note.houseBoundary}<p class="boundary">{note.houseBoundary}</p>{/if}{@render sources(note.sourceIds)}</details>{/each}
		<h3>Origins and traditions</h3>
		{#each item.originNotes as note}<div class="origin"><p>{note.text}</p>{@render sources(note.sourceIds)}</div>{/each}
		<section class="checks"><h3>Confirm at lineup</h3><p>Use the current kitchen or bar specification for dietary requests and changes.</p>{#if item.sheetDietaryNotes.length}<p><b>Sheet wording:</b> {item.sheetDietaryNotes.join(' · ')}.</p><p class="provenance">The sheet mixes allergens and other dietary flags. This is not a complete allergen declaration.</p>{/if}<ul>{#each item.serviceChecks as check}<li>{check}</li>{/each}</ul></section>
		<details class="ingredient"><summary>Sources and further reading</summary><p>Your uploaded training sheet establishes the house ingredients. These links support the background explanations.</p>{@render sources(item.sourceIds)}</details>
	{:else if itemId}
		<h2>That item is not in this collection</h2><p>Choose the Fall food and cocktails tab to browse the current collection.</p>
	{:else}
		<div class="folio-head"><p class="eyebrow">Brennan's · Autumn field notes</p><h2>Fall food &amp; cocktails</h2><p class="lede">From the kitchen's traditions to the guest's first impression. Learn the ingredients, trace their origins, then tell the story at the table.</p></div>
		<nav class="chips" aria-label="Fall study"><a class="chip go" href={cards('fall:today')}>Today's fall practice</a><a class="chip" href={cards(kind === 'dish' ? 'fall:food' : kind === 'cocktail' ? 'fall:cocktail' : 'fall')}>Flashcards</a><a class="chip" href={cards('fall:tableside')}>Tableside practice</a></nav>
		<p class="provenance">Eight dishes · nine cocktails · Fall 2026 training sheets. Learn → say it aloud → flip → revisit what slips.</p>
		<nav class="chips filters" aria-label="Fall collection"><a class="chip" aria-current={kind === 'dish' ? 'page' : undefined} href={href('', 'dish')}>Food</a><a class="chip" aria-current={kind === 'cocktail' ? 'page' : undefined} href={href('', 'cocktail')}>Cocktails</a><a class="chip" aria-current={kind === 'all' ? 'page' : undefined} href={href('', 'all')}>All items</a></nav>
		<label class="search">Find an item or ingredient<input type="search" bind:value={query} placeholder="Try brown butter, quince or rye" /></label>
		<p class="provenance" role="status">{rows.length} {rows.length === 1 ? 'item' : 'items'}</p>
		<div class="folio-grid">{#each rows as row}<a class="folio-row" href={href(row.id)}><span class="eyebrow">{row.menuSection}</span><h3>{row.name}</h3><p>{row.shortDescription}</p><span class="read">Explore &amp; practise</span></a>{/each}</div>
		{#if !rows.length}<p>No items match. Try another ingredient or choose All items.</p>{/if}
		<details class="ingredient"><summary>How to use these field notes</summary><p>Read the printed ingredients first. Practise the suggested tableside description without looking. Open the ingredient and origin notes for the deeper story, then answer the flashcards aloud. Today's fall practice gives you ten cards, beginning with missed answers, then unseen material.</p><p>These notes are a dated study collection. They do not change your restaurant's saved menu. Check availability, exact builds and dietary requests with the kitchen or bar.</p></details>
	{/if}
</section>

<style>
	.fall-folio { max-width: 960px; margin: 20px auto; color: var(--ink); }
	.folio-head { border-block: 1px solid var(--line-strong); padding: 24px 0; margin-bottom: 20px; }
	h2 { font: 500 clamp(2rem, 4vw, 3rem)/1.12 var(--display); margin: 8px 0 18px; }
	h3 { font: 600 1.5rem/1.2 var(--display); margin: 28px 0 12px; }
	.eyebrow { color: var(--turmeric); font-size: .8rem; letter-spacing: .12em; text-transform: uppercase; }
	.lede { color: var(--ink-soft); font-size: 1.2rem; line-height: 1.55; max-width: 68ch; }
	p, li { line-height: 1.6; }
	.provenance, .boundary { color: var(--muted); font-size: 1rem; }
	.chips { display: flex; flex-wrap: wrap; gap: 9px; margin: 18px 0; }
	.chip[aria-current] { border-color: var(--turmeric); background: var(--paper-raised); }
	.tableside { border: 1px solid var(--line-strong); background: var(--paper-raised); border-radius: 22px 22px 4px 4px; padding: 22px; margin-block: 28px; }
	blockquote { font: 500 1.5rem/1.55 var(--display); margin: 12px 0; }
	.ingredients { columns: 2; column-gap: 32px; padding-left: 22px; }
	.ingredients li { break-inside: avoid; padding: 4px; }
	.ingredient { border-block-end: 1px solid var(--line); padding: 12px 0; }
	summary { cursor: pointer; min-height: 44px; align-content: center; font-size: 1.15rem; }
	.citations { display: flex; flex-wrap: wrap; gap: 10px 20px; margin-block: 10px; font-size: .95rem; overflow-wrap: anywhere; }
	.citations a { color: var(--turmeric-deep); text-decoration: underline; text-underline-offset: 3px; }
	.checks { border-left: 3px solid var(--turmeric); padding: 4px 20px 14px; margin: 30px 0; background: var(--paper-raised); }
	.checks h3 { margin-top: 14px; }
	.search { display: grid; gap: 8px; margin-block: 20px; }
	input { width: 100%; min-height: 48px; box-sizing: border-box; background: var(--paper-raised); color: var(--ink); border: 1px solid var(--field-line); padding: 10px 14px; border-radius: 4px; font: inherit; }
	.folio-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 18px; margin-block: 18px 30px; }
	.folio-row { color: var(--ink); text-decoration: none; background: var(--paper-raised); border: 1px solid var(--line-strong); border-radius: 24px 24px 4px 4px; padding: 24px; }
	.folio-row h3 { margin: 12px 0; }.folio-row p { color: var(--ink-soft); }.read { color: var(--turmeric); text-decoration: underline; }
	.folio-row:hover { border-color: var(--turmeric); box-shadow: var(--shadow-lift); }
	@media (max-width: 600px) { .folio-grid { grid-template-columns: 1fr; }.ingredients { columns: 1; }.tableside,.folio-row { padding: 18px; } }
</style>
