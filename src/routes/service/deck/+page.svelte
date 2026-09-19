<!--
  The Floor Deck: the landing. Which sections to study, what is owed today, and
  the doors into the modes.

  The deck loads in the BROWSER, not in a `load` function. A universal load runs
  at prerender and inlines whatever it returns into the page's HTML; three
  hundred cards would put a third of a megabyte into every deck page for a
  reader who came for one section. The page prerenders as its heading and a
  line of copy, and the cards arrive from the precached chunk. Offline it is
  the same read, from the same cache.

  Progress is stated as FACTS (so many of a section seen, so many owed today)
  and never as a score. The written test ends on what was missed and no number,
  by the owner's decision, and the landing says nothing the test refuses to.

  Everything below the h1 sits in exactly ONE <article class="sheet">: the
  paywall contract, see /service/drill.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { loadFloorDeck } from '$lib/data';
	import { session } from '$lib/stores/session.svelte';
	import { dueCount, liveSections, sectionProgress, slipping } from '$lib/floor-deck';
	import { deckHref } from '$lib/floor-deck-core.mjs';
	import type { FloorDeck } from '$lib/types';

	let deck = $state<FloorDeck | null>(null);
	let failed = $state(false);
	/** Sections ticked for this visit. Empty means every section. */
	let picked = $state<string[]>([]);
	let now = $state(0);

	onMount(async () => {
		now = Date.now();
		try {
			deck = await loadFloorDeck();
		} catch {
			failed = true;
		}
	});

	const sections = $derived(deck ? liveSections(deck) : []);
	const progress = $derived(deck && session.ready ? sectionProgress(deck, session.drillLog) : []);
	const owed = $derived(deck && session.ready && now ? dueCount(deck, session.drillLog, now) : 0);
	const seenAny = $derived(progress.some((p) => p.seen > 0));
	const stubborn = $derived(deck && session.ready && now ? slipping(deck, session.drillLog, now) : []);
	const query = $derived(picked.length ? `?section=${picked.join(',')}` : '');
	const inScope = $derived(
		deck ? (picked.length ? deck.cards.filter((c) => picked.includes(c.section)).length : deck.cards.length) : 0
	);

	function toggle(key: string) {
		picked = picked.includes(key) ? picked.filter((k) => k !== key) : [...picked, key];
	}
</script>

<svelte:head><title>The Floor Deck · The World Table</title></svelte:head>

<div class="shell view">
	<nav class="crumbs"><a href="{base}/service">Service</a></nav>
	<h1>The Floor Deck</h1>

	<article class="sheet">
		<p class="lede">
			The words on a menu, one card each: what to say at the table first, then why it is so, what
			it is classically made with, and what it gets mistaken for. Written for a first week on the
			floor.
		</p>

		{#if failed}
			<p class="empty">The deck did not load. Check the connection once; after that it works offline.</p>
		{:else if !deck}
			<p class="empty" aria-live="polite">Opening the deck…</p>
		{:else if !sections.length}
			<p class="empty">The deck is being written. No section is ready to study yet.</p>
		{:else}
			<p class="note" aria-live="polite">
				{#if !session.ready}
					Reading your record…
				{:else if owed}
					{owed} card{owed === 1 ? ' is' : 's are'} owed today: what you missed last time, then what has
					come due. They lead the next sitting.
				{:else if seenAny}
					Nothing is owed today. A sitting will carry on through the cards you have not met.
				{:else}
					Nothing studied yet. The first sitting starts at the top of the first section.
				{/if}
			</p>

			<h2 class="sec">Sections</h2>
			<p class="secnote">
				Tick sections to study only those, or leave them all clear to work through the deck in order.
			</p>
			<ul class="sections">
				{#each sections as s (s.key)}
					{@const p = progress.find((x) => x.key === s.key)}
					<li>
						<label class:on={picked.includes(s.key)}>
							<input type="checkbox" checked={picked.includes(s.key)} onchange={() => toggle(s.key)} />
							<span class="stitle">{s.title}</span>
							<span class="sblurb">{s.blurb}</span>
							<span class="scount">
								{#if p && p.seen}{p.seen} of {p.total} met{:else}{s.count} cards{/if}
							</span>
						</label>
					</li>
				{/each}
			</ul>

			<h2 class="sec">Study</h2>
			<ul class="tiles">
				<li>
					<a href="{base}/service/deck/study{query}">
						<h3>Flip cards</h3>
						<p>
							A sitting of up to twenty from {inScope} card{inScope === 1 ? '' : 's'}. Say it to
							yourself, turn the card, and be honest about whether you had it.
						</p>
					</a>
				</li>
				{#if owed}
					<li>
						<a href="{base}/service/deck/study?focus=misses">
							<h3>Only what I missed</h3>
							<p>The cards still owed from a miss, most recent first, and nothing else.</p>
						</a>
					</li>
				{/if}
				<li>
					<a href="{base}/service/deck/test{picked.length ? `?section=${picked[0]}` : ''}">
						<h3>The written test</h3>
						<p>
							One section, answered cold. It ends on what you missed and the cards to read, never
							on a number.
						</p>
					</a>
				</li>
				<li>
					<a href="{base}/service/deck/say{query}">
						<h3>Say it back</h3>
						<p>
							The way a guest asks it: the description with the word taken out, or a line from a
							menu. You say it before you see any choices.
						</p>
					</a>
				</li>
				<li>
					<a href="{base}/service/deck/lineup{query}">
						<h3>Lineup</h3>
						<p>
							For pre-shift. One term fills the screen, the room answers aloud, you tap whether
							they had it. Nobody's name is kept.
						</p>
					</a>
				</li>
			</ul>

			{#if stubborn.length}
				<h2 class="sec">The terms that keep slipping</h2>
				<p class="secnote">Missed three times or more. Worth reading slowly, once, with the why open.</p>
				<p class="termlist">
					{#each stubborn as c (c.id)}<a href={deckHref(base, c)}>{c.term}</a>{/each}
				</p>
			{/if}

			<details class="index">
				<summary>Look up a card</summary>
				{#each sections as s (s.key)}
					<h3 class="ixhead">{s.title}</h3>
					<p class="termlist">
						{#each deck.cards.filter((c) => c.section === s.key) as c (c.id)}
							<a href={deckHref(base, c)}>{c.term}</a>
						{/each}
					</p>
				{/each}
			</details>
		{/if}
	</article>
</div>

<style>
	/* padding-BLOCK, deliberately: the shorthand zeroes padding-inline and
	   out-specifies the global .shell gutter. See /menu/quiz. */
	.view { padding-block: 26px 80px; max-width: 820px; }
	.crumbs { font-size: var(--t-micro); margin-bottom: 14px; }
	.crumbs a { color: var(--muted); text-decoration: none; }
	.crumbs a:hover { color: inherit; }
	h1 { font-size: var(--t-h1); margin-bottom: 8px; }
	.lede { font-size: var(--t-lede); color: var(--ink-soft); max-width: var(--measure); margin-bottom: 14px; }
	.note { color: var(--ink-soft); max-width: var(--measure); }
	.empty { padding: 32px 0; color: var(--muted); font-style: italic; }
	.sec {
		font-family: var(--text); font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase; color: var(--muted); border-bottom: 1px solid var(--line);
		padding-bottom: 5px; margin: 30px 0 12px; font-weight: 500;
	}
	.secnote { color: var(--ink-soft); max-width: var(--measure); font-size: var(--t-small); margin-bottom: 12px; }

	.sections { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
	.sections label {
		display: grid; grid-template-columns: auto 1fr auto; gap: 2px 12px; align-items: baseline;
		min-height: 44px; padding: 10px 14px; border: 1px solid var(--line); border-radius: var(--radius);
		background: var(--card, transparent); cursor: pointer;
	}
	.sections label:hover, .sections label.on { border-color: var(--turmeric-deep); }
	.sections input { grid-row: 1 / span 2; align-self: center; width: 18px; height: 18px; accent-color: var(--turmeric-deep); }
	.stitle { font-family: var(--display); font-size: 18px; }
	.sblurb { grid-column: 2 / span 2; color: var(--ink-soft); font-size: var(--t-small); line-height: 1.5; }
	.scount { font-size: var(--t-micro); color: var(--muted); white-space: nowrap; }

	.tiles { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--gap); }
	.tiles a {
		display: block; height: 100%; padding: 15px 17px; border: 1px solid var(--line);
		border-radius: var(--radius); background: var(--card, transparent); color: var(--ink); text-decoration: none;
	}
	.tiles a:hover { border-color: var(--turmeric-deep); }
	.tiles h3 { font-family: var(--display); font-size: 18px; margin-bottom: 5px; }
	.tiles p { color: var(--ink-soft); font-size: var(--t-small); line-height: 1.5; }

	.termlist { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: var(--t-small); }
	.termlist a { color: inherit; min-height: 28px; display: inline-flex; align-items: center; }
	.index { margin-top: 30px; border-top: 1px solid var(--line); }
	.index summary {
		cursor: pointer; min-height: 44px; display: flex; align-items: center;
		font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; color: var(--ink-soft);
	}
	.ixhead { font-family: var(--display); font-size: 16px; margin: 14px 0 6px; }
</style>
