<!--
  What a house item is made of, and what to compare it with: two blocks on
  the study card (the component deep dive, 5 October 2026), drawn in the
  card's own art (the display face for the heads, the dotted rule, the 44px
  chips and summaries).

  WHAT IT'S MADE OF. The item's components grouped Ingredients, Techniques,
  Stories, each a closed disclosure that opens to how to say it, the
  explanation in paragraphs, the flash card's question and answer and the
  videos that teach it (links out, never a player). "Flash these
  components" opens the item's component deck on the Flashcards tab.

  COMPARE WITH. One or two comparisons: a Table recipe or technique opens
  here, a Ledger cocktail or a Codex door opens in that room on the shared
  origin when the room is installed or the network is up, and a classic is
  words, with what is the same and what differs.

  KEPT ONLY, through study.ts componentBlocks and compareRows.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import type { House, HouseItem } from '$lib/house/house-schema';
	import { componentBlocks, compareRows, say } from '$lib/study';
	import { ROOM_NAMES } from '$lib/wing-links';
	import VideoList from './VideoList.svelte';

	let {
		current,
		item,
		linkable = { codex: false, ledger: false }
	}: {
		current: House;
		item: HouseItem;
		/** Per room: the network is up or the room is installed here (wing-links.ts, rule 3). */
		linkable?: { codex: boolean; ledger: boolean };
	} = $props();

	const blocks = $derived(componentBlocks(current, item.id));
	const cards = $derived(blocks.reduce((n, b) => n + b.rows.filter((r) => r.card).length, 0));
	const compares = $derived(compareRows(current, item, base));
	/** A cross-room link only where the room can be reached; a link inside the Table always. */
	const hrefOf = (c: (typeof compares)[number]) => (c.room ? (linkable[c.room as 'codex' | 'ledger'] ? c.href : '') : c.href);
	const paraKey = (i: number) => i;
</script>

{#if blocks.length}
	<section class="block madeof" aria-labelledby="madeof-h">
		<h3 class="blockhead" id="madeof-h">{say('madeOf')}</h3>
		{#each blocks as g (g.kind)}
			<h4 class="kindhead" data-kind={g.kind}>{g.label}</h4>
			<ul class="comps">
				{#each g.rows as c (c.id)}
					<li data-component={c.id}>
						<details class="comp">
							<summary><span class="cname">{c.name}</span></summary>
							<div class="cbody">
								{#if c.say}<p class="csay"><span class="eyebrow-in">{say('say')}:</span> {c.say}</p>{/if}
								{#each c.paragraphs as para, i (paraKey(i))}<p class="para">{para}</p>{/each}
								{#if c.card}
									<dl class="ccard">
										<dt>{say('cardFront')}</dt>
										<dd>{c.card.front}</dd>
										<dt>{say('cardBack')}</dt>
										<dd>{c.card.back}</dd>
									</dl>
								{/if}
								{#if c.videos.length}
									<p class="soft small">{say('videoNote')}</p>
									<VideoList rows={c.videos} />
								{/if}
							</div>
						</details>
					</li>
				{/each}
			</ul>
		{/each}
		{#if cards}
			<a class="chip go flash" href="{base}/flashcards?deck={encodeURIComponent('item-components:' + item.id)}&run=1">{say('flashThese')}</a>
		{/if}
	</section>
{/if}

{#if compares.length}
	<section class="block compare" aria-labelledby="compare-h">
		<h3 class="blockhead" id="compare-h">{say('compareWith')}</h3>
		<ul class="plain cmp">
			{#each compares as c, i (i)}
				<li data-app={c.app}>
					{#if hrefOf(c)}
						<a class="clabel" href={hrefOf(c)}>{c.label}</a>{#if c.room}<span class="soft">, {say('inTheRoom', { room: ROOM_NAMES[c.room] })}</span>{/if}
					{:else}
						<b class="clabel">{c.label}</b>{#if c.app === 'classic'}<span class="soft"> {say('classic')}</span>{/if}
					{/if}
					{#if c.same}<span class="sub"><b>{say('same')}:</b> {c.same}</span>{/if}
					{#if c.different}<span class="sub"><b>{say('different')}:</b> {c.different}</span>{/if}
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.block { margin: 20px 0 4px; }
	.blockhead { font-family: var(--display); font-size: var(--t-h4, 1.25rem); margin: 0 0 6px; }
	.kindhead {
		font-family: var(--text); font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase; color: var(--muted); margin: 12px 0 2px; font-weight: 500;
	}
	.comps { list-style: none; margin: 0; padding: 0; }
	.comp { border-bottom: 1px dotted var(--line); }
	.comp summary { min-height: 44px; display: flex; align-items: center; cursor: pointer; font-size: 1.05rem; }
	.comp summary:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: 2px; }
	.cname { font-family: var(--display); }
	.cbody { padding: 2px 0 10px; }
	.csay { margin: 0 0 8px; }
	.eyebrow-in { color: var(--muted); }
	.para { margin: 0 0 8px; line-height: 1.6; max-width: var(--measure); }
	.ccard { display: grid; grid-template-columns: 7.5em 1fr; gap: 4px 12px; margin: 4px 0 8px; }
	.ccard dt { font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; color: var(--muted); padding-top: 3px; }
	.ccard dd { margin: 0; line-height: 1.5; }
	.soft { color: var(--ink-soft); }
	.small { font-size: 1rem; margin: 2px 0 0; }
	.chip {
		display: inline-flex; align-items: center; border: 1px solid var(--line); background: var(--paper); color: var(--ink);
		padding: 8px 14px; border-radius: var(--radius); font: inherit; font-size: 1rem; min-height: 44px; text-decoration: none;
	}
	.chip:hover { border-color: var(--turmeric); }
	.chip.go { border-color: var(--turmeric-deep); font-weight: 600; }
	.flash { margin-top: 10px; }
	.plain { list-style: none; margin: 0; padding: 0; }
	.plain li { padding: 6px 0; border-bottom: 1px dotted var(--line); line-height: 1.5; min-height: 44px; }
	.clabel { font-weight: 600; }
	a.clabel { display: inline-flex; align-items: center; min-height: 44px; color: var(--ink); text-underline-offset: 3px; }
	.sub { display: block; margin-top: 3px; color: var(--ink-soft); line-height: 1.5; }
	@media (max-width: 420px) {
		.ccard { grid-template-columns: 1fr; }
	}
</style>
