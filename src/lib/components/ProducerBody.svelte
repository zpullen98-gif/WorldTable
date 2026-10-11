<!--
  One producer's profile, in full: where and when it was founded, the line
  to say at the table, the facts as a list, the story in paragraphs, the
  notes for the floor and, when there is something to answer, Ask the bar for
  a producer At the bar (study.ts atTheBar: it reaches a drink and no dish),
  as the Ledger heads the same list, Ask the sommelier for one In the cellar
  (study.ts inTheCellar: it reaches a wine and no dish or drink), and Ask the
  kitchen for every other. Drawn inside the study card's Who makes it
  disclosure and in the Producers view, in the card's own art (the eyebrow
  for the small heads, the dotted rule, prose at the measure); `level` is the
  small heads' level, one below the name's (h5 under an h4 name, h6 under
  the cellar's h5). Kept words only: the row comes from study.ts producerRow,
  which reads a profile only when a person kept it.
-->
<script lang="ts">
	import { atTheBar, inTheCellar, say, type ProducerRow } from '$lib/study';

	let { row, level = 5 }: { row: ProducerRow; level?: 5 | 6 } = $props();
	const askHead = $derived(say(atTheBar(row) ? 'askBar' : inTheCellar(row) ? 'askSommelier' : 'askKitchen'));
	const head = $derived(`h${level}`);
</script>

<div class="pbody">
	{#if row.where || row.founded}
		<dl class="pfacts">
			{#if row.where}<dt>{say('producerWhere')}</dt><dd>{row.where}</dd>{/if}
			{#if row.founded}<dt>{say('producerFounded')}</dt><dd>{row.founded}</dd>{/if}
		</dl>
	{/if}
	{#if row.sayIt}<p class="psay"><span class="eyebrow-in">{say('say')}:</span> “{row.sayIt}”</p>{/if}
	{#if row.facts.length}
		<svelte:element this={head} class="phead">{say('producerFacts')}</svelte:element>
		<ul class="plist">
			{#each row.facts as f, i (i)}<li>{f}</li>{/each}
		</ul>
	{/if}
	{#if row.paragraphs.length}
		<svelte:element this={head} class="phead">{say('producerHistory')}</svelte:element>
		{#each row.paragraphs as para, i (i)}<p class="para">{para}</p>{/each}
	{/if}
	{#if row.notes.length}
		<svelte:element this={head} class="phead">{say('producerNotes')}</svelte:element>
		<ul class="plist">
			{#each row.notes as n, i (i)}<li>{n}</li>{/each}
		</ul>
	{/if}
	{#if row.askKitchen.length}
		<svelte:element this={head} class="phead">{askHead}</svelte:element>
		<ul class="plist pask">
			{#each row.askKitchen as q, i (i)}<li>{q}</li>{/each}
		</ul>
	{/if}
</div>

<style>
	.pbody { padding: 2px 0 10px; }
	.pfacts { display: grid; grid-template-columns: 7.5em 1fr; gap: 4px 12px; margin: 4px 0 8px; }
	.pfacts dt, .phead {
		font-family: var(--text); font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase; color: var(--muted); font-weight: 500;
	}
	.pfacts dt { padding-top: 3px; }
	.pfacts dd { margin: 0; line-height: 1.5; }
	.phead { margin: 12px 0 4px; }
	.psay { margin: 0 0 8px; line-height: 1.5; max-width: var(--measure); }
	.eyebrow-in { color: var(--muted); }
	.para { margin: 0 0 8px; line-height: 1.6; max-width: var(--measure); }
	.plist { margin: 0 0 8px; padding-left: 1.2em; max-width: var(--measure); }
	.plist li { line-height: 1.5; margin: 0 0 4px; }
	@media (max-width: 420px) {
		.pfacts { grid-template-columns: 1fr; }
	}
</style>
