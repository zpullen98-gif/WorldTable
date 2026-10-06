<!--
  Who makes it: the producers behind a house item, on the study card above
  What it's made of (the producer deep dive, 6 October 2026), in the card's
  own art (the display face for the heads, the dotted rule, the 44px chips
  and summaries).

  Each of the item's components that carries a kept producer profile is a
  closed disclosure: who, with what it supplies beside it, opening to the
  profile in full (ProducerBody.svelte). Under the list, "Flash these
  producers" deals the item's producer deck on the Flashcards tab and "All
  producers" opens the Producers view inside My Menu.

  KEPT ONLY, through study.ts producersFor. Nothing here speaks of allergens:
  a question about one is the kitchen's, and the profile says so in its own
  Ask the kitchen list when there is one.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import type { House, HouseItem } from '$lib/house/house-schema';
	import { producersFor, say } from '$lib/study';
	import ProducerBody from './ProducerBody.svelte';

	let { current, item }: { current: House; item: HouseItem } = $props();

	const rows = $derived(producersFor(current, item.id));
</script>

{#if rows.length}
	<section class="block whomakes" aria-labelledby="whomakes-h">
		<h3 class="blockhead" id="whomakes-h">{say('whoMakes')}</h3>
		<ul class="prods">
			{#each rows as r (r.id)}
				<li data-producer={r.id}>
					<details class="prod">
						<summary><span class="pname">{r.who}</span>{#if r.suppliesShown}<span class="psub">{r.suppliesShown}</span>{/if}</summary>
						<ProducerBody row={r} />
					</details>
				</li>
			{/each}
		</ul>
		<div class="links">
			<a class="chip go" href="{base}/flashcards?deck={encodeURIComponent('item-producers:' + item.id)}&run=1">{say('flashProducers')}</a>
			<a class="chip" href="{base}/menu?view=producers">{say('allProducers')}</a>
		</div>
	</section>
{/if}

<style>
	.block { margin: 20px 0 4px; }
	.blockhead { font-family: var(--display); font-size: var(--t-h4, 1.25rem); margin: 0 0 6px; }
	.prods { list-style: none; margin: 0; padding: 0; }
	.prod { border-bottom: 1px dotted var(--line); }
	.prod summary {
		min-height: 44px; display: flex; flex-wrap: wrap; align-items: baseline; column-gap: 10px;
		padding: 10px 0; cursor: pointer; font-size: 1.05rem;
	}
	.prod summary:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: 2px; }
	.pname { font-family: var(--display); }
	.psub { flex-basis: 100%; color: var(--ink-soft); font-size: .95rem; font-style: italic; }
	.links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
	.chip {
		display: inline-flex; align-items: center; border: 1px solid var(--line); background: var(--paper); color: var(--ink);
		padding: 8px 14px; border-radius: var(--radius); font: inherit; font-size: 1rem; min-height: 44px; text-decoration: none;
	}
	.chip:hover { border-color: var(--turmeric); }
	.chip.go { border-color: var(--turmeric-deep); font-weight: 600; }
</style>
