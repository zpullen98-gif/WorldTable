<!--
  The roux ladder, in words: an ordered list of rungs from white to the
  darkest, each with its minutes over moderate heat, what it looks like, what
  it smells of, how hard it still thickens, the entries that use it and the
  Brennan's dishes that take it. The illustrated folio of the same ladder is
  linked, never redrawn.
-->
<script lang="ts">
	import { minutesWords, type CzLadder } from '$lib/cuisine';
	import type { TeachingFolio } from '$lib/teaching-folios';
	import FolioLinks from '$lib/components/FolioLinks.svelte';

	let {
		ladder,
		folio,
		entryLink,
		dishLink
	}: {
		ladder: CzLadder;
		folio: TeachingFolio | null;
		entryLink: (slug: string) => { href: string | null; title: string };
		dishLink: (id: string) => { href: string | null; name: string };
	} = $props();
</script>

<ol class="rungs">
	{#each ladder.rungs as r (r.key)}
		<li class="rung">
			<h2>{r.name}</h2>
			<dl>
				<dt>Time</dt>
				<dd>{minutesWords(r.minutes)} over moderate heat</dd>
				<dt>Look</dt>
				<dd>{r.cue}</dd>
				<dt>Smell</dt>
				<dd>{r.smell}</dd>
				<dt>Thickening</dt>
				<dd>{r.thickening}</dd>
				{#if r.uses.length}
					<dt>Used in</dt>
					<dd>
						{#each r.uses as u, i (u)}
							{@const l = entryLink(u)}{#if i}<span class="sep">{', '}</span>{/if}{#if l.href}<a href={l.href}>{l.title}</a>{:else}{l.title}{/if}
						{/each}
					</dd>
				{/if}
				{#if r.dishes.length}
					<dt>At Brennan's</dt>
					<dd>
						{#each r.dishes as d, i (d.dish)}
							{@const dl = dishLink(d.dish)}{#if i}<span class="sep">{', '}</span>{/if}{#if dl.href}<a href={dl.href}>{dl.name}</a>{:else}{dl.name}{/if}
						{/each}
					</dd>
				{/if}
			</dl>
		</li>
	{/each}
</ol>

{#if folio}<FolioLinks folios={[folio]} label="The same ladder, illustrated" />{/if}

<style>
	.rungs {
		margin: 16px 0 0;
		padding: 0 0 0 1.6em;
		max-width: var(--measure);
	}
	.rung {
		border-top: 1px solid var(--house-frame, var(--line));
		padding: 14px 0 8px;
	}
	.rung::marker {
		font-family: var(--display);
		color: var(--turmeric-deep);
	}
	h2 {
		font-family: var(--house-reading, var(--display));
		font-size: var(--t-h3);
		font-weight: 500;
		color: var(--turmeric-deep);
		margin: 0 0 6px;
		line-height: 1.25;
	}
	dl {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 4px 12px;
		margin: 0;
		font-size: var(--t-body);
		line-height: 1.5;
	}
	dt {
		font-size: 0.9375rem;
		letter-spacing: 0.06em;
		color: var(--ink-soft);
		padding-top: 2px;
	}
	dd {
		margin: 0;
	}
	dd a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		color: var(--ink);
	}
	@media (max-width: 599px) {
		dl {
			grid-template-columns: 1fr;
			gap: 0;
		}
		dt {
			margin-top: 6px;
		}
	}
</style>
