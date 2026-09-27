<!--
  One level, read first: a primer per subsection.

  The level page lists what is placed at the level and opens the training
  doors; it does not say what the forty-two techniques have in common,
  which to take first, or what the level above will ask of the same
  subject. This page does, in the voice the level page lacks: a short lede,
  a few paragraphs, the items the text names as links, one line on what is
  next, and a door back to the subsection's own training doors.

  Read, never graded: nothing on this page is recorded, and it says so in
  the lede. Headings are h1 then h2, one per primer; the table of contents
  is a nav, not a heading.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import type { DeckLevel } from '$lib/types';

	let { data } = $props();
	const n = $derived(data.level as DeckLevel);
	const prev = $derived(n > 1 ? ((n - 1) as DeckLevel) : null);
	const next = $derived(n < 4 ? ((n + 1) as DeckLevel) : null);
	/* the neighbours by name: a level is named, never numbered */
	const nameOf = (l: DeckLevel) => data.names[l] ?? '';
</script>

<svelte:head><title>Read first · {data.info.name} · The World Table</title></svelte:head>

<div class="shell view">
	<nav class="crumbs"><a href="{base}/">Home</a> · <a href="{base}/level/{n}">{data.info.name}</a></nav>
	<p class="eyebrow">Read first</p>
	<h1>{data.info.name}</h1>
	<p class="lede">
		What each part of this level asks and the order to take it, written for the cook standing at it. Read it before you drill: nothing
		here is graded or recorded.
	</p>

	{#if data.primers.length}
		<nav class="toc" aria-label="On this page">
			<ul>
				{#each data.primers as p (p.subsection)}
					<li><a href="#{p.subsection}">{p.title}</a></li>
				{/each}
			</ul>
		</nav>

		<ol class="primers">
			{#each data.primers as p (p.subsection)}
				<li class="primer" id={p.subsection}>
					<h2>{p.title}</h2>
					<p class="count">{p.count} at this level</p>
					<p class="plede">{p.lede}</p>
					{#each p.paragraphs as para, i (i)}
						<p class="para">{para}</p>
					{/each}
					<p class="cites">
						<span class="xlabel">Named here</span>
						{#each p.cites as c, i (c.slug)}{#if i}<span class="sep">·</span>{/if}<a href="{base}{c.href}">{c.name}</a>{/each}
					</p>
					<p class="next"><span class="xlabel">Next</span> {p.next}</p>
					<p class="doors"><a class="train" href="{base}/level/{n}#{p.subsection}">Train {p.title}</a></p>
				</li>
			{/each}
		</ol>
	{:else}
		<p class="empty">Nothing is written for this level yet. The level page lists what is placed here.</p>
	{/if}

	<nav class="neighbours" aria-label="Other levels">
		{#if prev}<a href="{base}/level/{prev}/read">Before: {nameOf(prev)}</a>{/if}
		<a href="{base}/level/{n}">The {data.info.name} page</a>
		{#if next}<a href="{base}/level/{next}/read">Next: {nameOf(next)}</a>{/if}
	</nav>
</div>

<style>
	.crumbs {
		font-size: var(--t-small);
		margin-bottom: 8px;
	}
	.crumbs a {
		display: inline-block;
		padding-block: 10px;
		color: var(--muted);
	}
	.eyebrow {
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--turmeric-deep);
	}
	h1 {
		font-size: var(--t-h1);
		margin: 4px 0 8px;
	}
	.lede {
		font-size: var(--t-lede);
		color: var(--ink-soft);
		max-width: var(--measure);
	}

	.toc {
		margin-top: 18px;
	}
	.toc ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 6px 8px;
	}
	.toc a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 0 14px;
		border: var(--rule) solid var(--line);
		border-radius: var(--radius);
		background: var(--card);
		font-size: var(--t-small);
		color: var(--ink);
		text-decoration: none;
	}
	.toc a:hover,
	.train:hover {
		border-color: var(--turmeric-deep);
	}
	.toc a:focus-visible,
	.train:focus-visible,
	.cites a:focus-visible {
		outline: 2px solid var(--turmeric-deep);
		outline-offset: 2px;
	}

	.primers {
		list-style: none;
		margin: 24px 0 0;
		padding: 0;
	}
	.primer {
		padding: 20px 0 8px;
		border-top: 1px solid var(--line);
		max-width: var(--measure);
	}
	.primer h2 {
		font-size: var(--t-h2);
		margin: 0;
	}
	.count {
		margin-top: 4px;
		font-size: var(--t-small);
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.plede {
		margin-top: 10px;
		font-size: var(--t-lede);
		color: var(--ink-soft);
	}
	.para {
		margin-top: 12px;
		line-height: 1.55;
	}
	.xlabel {
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--turmeric-deep);
		margin-right: 0.5em;
	}
	.cites {
		margin-top: 16px;
		font-size: var(--t-small);
		line-height: 2.2;
	}
	.cites a {
		display: inline-block;
		padding: 6px 2px;
		color: var(--ink);
	}
	.sep {
		color: var(--muted);
		margin: 0 0.4em;
	}
	.next {
		margin-top: 12px;
		color: var(--ink-soft);
	}
	.doors {
		margin-top: 14px;
	}
	.train {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 0 14px;
		border: var(--rule) solid var(--line);
		border-radius: var(--radius);
		background: var(--card);
		color: var(--ink);
		font-size: var(--t-small);
		text-decoration: none;
	}
	.empty {
		margin-top: 24px;
		color: var(--muted);
	}
	.neighbours {
		margin-top: 28px;
		padding-top: 16px;
		border-top: 1px solid var(--line);
		display: flex;
		flex-wrap: wrap;
		gap: 8px 18px;
		font-size: var(--t-small);
	}
	.neighbours a {
		display: inline-block;
		padding-block: 10px;
		color: var(--ink);
	}
</style>
