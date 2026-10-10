<!--
  One producer's profile, in full: where and when it was founded, the line
  to say at the table, the facts as a list, the story in paragraphs, the
  notes for the floor and, when there is something to answer, Ask the bar for
  a producer At the bar (study.ts atTheBar: it reaches a drink and no dish),
  as the Ledger heads the same list, and Ask the kitchen for every other.
  Drawn inside the study card's Who makes it disclosure and in the
  Producers view, in the card's own art (the eyebrow for the small heads,
  the dotted rule, prose at the measure). Kept words only: the row comes
  from study.ts producerRow, which reads a profile only when a person kept it.
-->
<script lang="ts">
	import { atTheBar, say, type ProducerRow } from '$lib/study';

	let { row }: { row: ProducerRow } = $props();
	const askHead = $derived(say(atTheBar(row) ? 'askBar' : 'askKitchen'));
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
		<h5 class="phead">{say('producerFacts')}</h5>
		<ul class="plist">
			{#each row.facts as f, i (i)}<li>{f}</li>{/each}
		</ul>
	{/if}
	{#if row.paragraphs.length}
		<h5 class="phead">{say('producerHistory')}</h5>
		{#each row.paragraphs as para, i (i)}<p class="para">{para}</p>{/each}
	{/if}
	{#if row.notes.length}
		<h5 class="phead">{say('producerNotes')}</h5>
		<ul class="plist">
			{#each row.notes as n, i (i)}<li>{n}</li>{/each}
		</ul>
	{/if}
	{#if row.askKitchen.length}
		<h5 class="phead">{askHead}</h5>
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
