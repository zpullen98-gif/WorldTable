<!--
  The producers: every kept producer profile of the house, inside the house's page at
  /menu?view=producers (the producer deep dive, 6 October 2026; no route of
  its own, so the precache does not grow). Four groups, Makers and farms (a
  maker, a farm, the house itself), Where it comes from (a fishery, an
  origin), At the bar (a producer that reaches a drink and no dish) and In
  the cellar (one that reaches a wine and no dish or drink), each profile in
  full with the items that use it. A dish is a chip that opens its study
  card through the page's own openCard, a shallow entry, so Back returns
  here where the reader was. A drink, after the chips, opens in the Ledger,
  and a wine In the cellar opens its card in the Codex (wing-links.ts
  roomHref), by the card's Compare with rule: a link on the shared origin
  while the room is installed here or the network is up, and words
  otherwise.

  The cellar is long (a producer per house on the bottle list), so it is
  drawn by region (study.ts cellarRegions), a small heading each, with its
  own index of regions in a closed disclosure at its head; and a jump list
  under the links names every group, the cellar with them. Both jump by
  buttons that scroll to the heading and focus it, never by a #hash, which
  this page reads as a card to open.

  The Producers deck and the producer questions these links open deal the
  producers behind the dishes only (study.ts tableProducerIds): the bar's
  and the cellar's belong to their own rooms, so the links say so, and are
  drawn only while a producer stands behind a dish.

  The art is the study view's: the display face for the heads, the eyebrow
  for the group heads, the dotted rule between profiles, 44px chips. KEPT
  ONLY, through study.ts producerRows.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import type { House } from '$lib/house/house-schema';
	import { behindADish, producerRows, say, studyRows, type ProducerRow, type StudyRow } from '$lib/study';
	import { ROOM_NAMES } from '$lib/wing-links';
	import ProducerBody from './ProducerBody.svelte';

	let {
		current,
		onOpen,
		linkable = { codex: false, ledger: false }
	}: {
		current: House;
		/** Open an item's card: its id, the rows it walks, and the selector that finds the chip again on Back. */
		onOpen: (id: string, list: readonly StudyRow[], from?: string) => void;
		/** Per room: the network is up or the room is installed here (wing-links.ts, rule 3). */
		linkable?: { codex: boolean; ledger: boolean };
	} = $props();

	const groups = $derived(producerRows(current, base));
	const dishRows = $derived(studyRows(current, 'dish'));
	const dealsHere = $derived(groups.some((g) => g.rows.some(behindADish)));
	const chipSel = (pid: string, iid: string) => `[data-chip="${pid}:${iid}"]`;

	/** Bring a heading to the top and put the focus on it, the address left as it is. */
	function jump(id: string) {
		const el = document.getElementById(id);
		if (!el) return;
		el.scrollIntoView({ block: 'start' });
		el.focus({ preventScroll: true });
	}
</script>

{#snippet profile(r: ProducerRow, cellar: boolean)}
	<li class="profile" data-producer={r.id}>
		<svelte:element this={cellar ? 'h5' : 'h4'} class="pname">{r.who}</svelte:element>
		<p class="psub">{r.typeLabel}{#if r.suppliesShown}{' · ' + r.suppliesShown}{/if}</p>
		<ProducerBody row={r} level={cellar ? 6 : 5} />
		{#if r.items.length}
			<svelte:element this={cellar ? 'h6' : 'h5'} class="onmenu">{say(cellar ? 'onTheList' : 'onTheMenu')}</svelte:element>
			<div class="chips">
				{#each r.chips as it (it.id)}
					<button type="button" class="chip" data-chip="{r.id}:{it.id}" onclick={() => onOpen(it.id, dishRows, chipSel(r.id, it.id))}>{it.name}</button>
				{/each}
				{#each r.drinks as d (d.id)}
					{#if linkable.ledger && d.href}
						<a class="chip drink" href={d.href} data-drink="{r.id}:{d.id}"><span>{d.name}<span class="room">, {say('inTheRoom', { room: ROOM_NAMES.ledger })}</span></span></a>
					{:else}
						<span class="drink words" data-drink="{r.id}:{d.id}">{d.name}</span>
					{/if}
				{/each}
				{#each r.wines as w (w.id)}
					{#if linkable.codex && w.href}
						<a class="chip wine" href={w.href} data-wine="{r.id}:{w.id}"><span>{w.name}<span class="room">, {say('inTheRoom', { room: ROOM_NAMES.codex })}</span></span></a>
					{:else}
						<span class="wine words" data-wine="{r.id}:{w.id}">{w.name}</span>
					{/if}
				{/each}
			</div>
		{/if}
	</li>
{/snippet}

<section class="producers" aria-labelledby="producers-h">
	<h2 class="viewhead" id="producers-h" tabindex="-1">{say('producers')}</h2>
	{#if !groups.length}
		<p class="soft">{say('producersNone')}</p>
	{:else}
		{#if dealsHere}
			<p class="links">
				<a class="chip go" href="{base}/flashcards?deck=producers">{say('flashAllProducers')}</a>
				<a class="chip" href="{base}/menu/quiz?mode=drill&subject=producer">{say('quizProducers')}</a>
			</p>
		{/if}
		{#if groups.length > 1}
			<nav class="jump" aria-label={say('producersJump')}>
				{#each groups as g (g.key)}
					<button type="button" class="chip jumpto" data-jump={g.key} onclick={() => jump(`pg-${g.key}`)}>{g.label}<span class="n">{g.rows.length}</span></button>
				{/each}
			</nav>
		{/if}
		{#each groups as g (g.key)}
			<h3 class="grouphead" id="pg-{g.key}" data-group={g.key} tabindex="-1">{g.label}</h3>
			{#if g.regions}
				{#if g.regions.length > 1}
					<details class="regions">
						<summary>{say('cellarRegions', { n: g.regions.length })}</summary>
						<div class="chips">
							{#each g.regions as rg (rg.key)}
								<button type="button" class="chip jumpto" data-jump-region={rg.key} onclick={() => jump(`pr-${rg.key}`)}>{rg.label}<span class="n">{rg.rows.length}</span></button>
							{/each}
						</div>
					</details>
				{/if}
				{#each g.regions as rg (rg.key)}
					<h4 class="regionhead" id="pr-{rg.key}" data-region={rg.key} tabindex="-1">{rg.label}</h4>
					<ul class="plist" aria-labelledby="pr-{rg.key}">
						{#each rg.rows as r (r.id)}{@render profile(r, true)}{/each}
					</ul>
				{/each}
			{:else}
				<ul class="plist" aria-labelledby="pg-{g.key}">
					{#each g.rows as r (r.id)}{@render profile(r, false)}{/each}
				</ul>
			{/if}
		{/each}
	{/if}
</section>

<style>
	.producers { margin: 4px 0 24px; }
	.viewhead { font-family: var(--display); font-size: var(--t-h3, 1.5rem); margin: 4px 0 8px; }
	.grouphead {
		font-family: var(--text); font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase; color: var(--muted); margin: 20px 0 2px; font-weight: 500;
	}
	.regionhead {
		font-family: var(--display); font-size: 1.3125rem; font-weight: 500;
		margin: 18px 0 0; padding-bottom: 4px; border-bottom: 1px solid var(--line);
	}
	.grouphead:focus-visible, .regionhead:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: 2px; }
	.plist { list-style: none; margin: 0; padding: 0; }
	.profile { border-bottom: 1px dotted var(--line); padding: 10px 0 12px; }
	.pname { font-family: var(--display); font-size: var(--t-h4, 1.25rem); margin: 0; }
	.psub { color: var(--ink-soft); margin: 2px 0 6px; }
	.onmenu {
		font-family: var(--text); font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase; color: var(--muted); margin: 8px 0 4px; font-weight: 500;
	}
	.soft { color: var(--ink-soft); }
	.links, .chips, .jump { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; }
	.links { margin-bottom: 4px; }
	.jump { margin: 8px 0 4px; }
	.regions { margin: 6px 0 2px; }
	.regions summary {
		min-height: 44px; display: flex; align-items: center; cursor: pointer; color: var(--ink);
	}
	.regions summary:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: 2px; }
	.regions .chips { padding: 2px 0 10px; }
	.chip {
		display: inline-flex; align-items: center; border: 1px solid var(--line); background: var(--paper); color: var(--ink);
		padding: 8px 14px; border-radius: var(--radius); font: inherit; font-size: 1rem; min-height: 44px; text-decoration: none;
		cursor: pointer; text-align: left; max-width: 100%;
	}
	.chip:hover { border-color: var(--turmeric); }
	.chip.go { border-color: var(--turmeric-deep); font-weight: 600; }
	.jumpto { gap: 8px; }
	.n { color: var(--muted); font-size: .9rem; font-variant-numeric: tabular-nums; }
	.room { color: var(--ink-soft); }
	.words { display: inline-flex; align-items: center; min-height: 44px; padding: 0 4px; color: var(--ink); }
</style>
