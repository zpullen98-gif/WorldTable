<!--
  The producers: every kept producer profile of the house, inside My Menu at
  /menu?view=producers (the producer deep dive, 6 October 2026; no route of
  its own, so the precache does not grow). Three groups, Makers and farms (a
  maker, a farm, the house itself), Where it comes from (a fishery, an
  origin) and At the bar (a producer that reaches a drink and no dish), each
  profile in full with the items that use it. A dish or wine is a chip that
  opens its study card through the page's own openCard, a shallow entry, so
  Back returns here where the reader was. A drink, after the chips, opens in
  the Ledger (wing-links.ts roomHref), by the card's Compare with rule: a
  link on the shared origin while the Ledger is installed here or the
  network is up, and words otherwise.

  The art is the study view's: the display face for the heads, the eyebrow
  for the group heads, the dotted rule between profiles, 44px chips. KEPT
  ONLY, through study.ts producerRows.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import type { House } from '$lib/house/house-schema';
	import { producerRows, say, studyRows, type StudyRow } from '$lib/study';
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
	const chipSel = (pid: string, iid: string) => `[data-chip="${pid}:${iid}"]`;
</script>

<section class="producers" aria-labelledby="producers-h">
	<h2 class="viewhead" id="producers-h" tabindex="-1">{say('producers')}</h2>
	{#if !groups.length}
		<p class="soft">{say('producersNone')}</p>
	{:else}
		<p class="links">
			<a class="chip go" href="{base}/flashcards?deck=producers">{say('flashAllProducers')}</a>
			<a class="chip" href="{base}/menu/quiz?mode=drill&subject=producer">{say('quizProducers')}</a>
		</p>
		{#each groups as g (g.key)}
			<h3 class="grouphead" id="pg-{g.key}" data-group={g.key}>{g.label}</h3>
			<ul class="plist" aria-labelledby="pg-{g.key}">
				{#each g.rows as r (r.id)}
					<li class="profile" data-producer={r.id}>
						<h4 class="pname">{r.who}</h4>
						<p class="psub">{r.typeLabel}{#if r.suppliesShown}{' · ' + r.suppliesShown}{/if}</p>
						<ProducerBody row={r} />
						{#if r.items.length}
							<h5 class="onmenu">{say('onTheMenu')}</h5>
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
							</div>
						{/if}
					</li>
				{/each}
			</ul>
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
	.plist { list-style: none; margin: 0; padding: 0; }
	.profile { border-bottom: 1px dotted var(--line); padding: 10px 0 12px; }
	.pname { font-family: var(--display); font-size: var(--t-h4, 1.25rem); margin: 0; }
	.psub { color: var(--ink-soft); margin: 2px 0 6px; }
	.onmenu {
		font-family: var(--text); font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase; color: var(--muted); margin: 8px 0 4px; font-weight: 500;
	}
	.soft { color: var(--ink-soft); }
	.links, .chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; }
	.links { margin-bottom: 4px; }
	.chip {
		display: inline-flex; align-items: center; border: 1px solid var(--line); background: var(--paper); color: var(--ink);
		padding: 8px 14px; border-radius: var(--radius); font: inherit; font-size: 1rem; min-height: 44px; text-decoration: none;
		cursor: pointer; text-align: left;
	}
	.chip:hover { border-color: var(--turmeric); }
	.chip.go { border-color: var(--turmeric-deep); font-weight: 600; }
	.room { color: var(--ink-soft); }
	.words { display: inline-flex; align-items: center; min-height: 44px; padding: 0 4px; color: var(--ink); }
</style>
