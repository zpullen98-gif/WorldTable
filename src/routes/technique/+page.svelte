<script lang="ts">
	import { base } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { TOTALS, loadLevels } from '$lib/data';
	import { NUMERAL, levelFromSearch } from '$lib/levels';
	import type { DeckLevel } from '$lib/types';

	let { data } = $props();

	/* `?level=2` narrows the index to the techniques placed at that level (the
	   four levels' door in). Seeded in afterNavigate, never in load: a
	   prerendered page may not read the query at load time, and the levels
	   file is a lazy island the index does not otherwise need. Null is every
	   technique, as the page has always been. */
	let level = $state<DeckLevel | null>(null);
	let levelName = $state('');
	let levelSlugs = $state<Set<string> | null>(null);

	afterNavigate(async () => {
		const wanted = levelFromSearch(page.url.search);
		level = wanted;
		if (!wanted) {
			levelSlugs = null;
			return;
		}
		const levels = await loadLevels();
		levelName = levels.levels.find((l) => l.level === wanted)?.name ?? '';
		levelSlugs = new Set(levels.items.techniques[String(wanted)] ?? []);
	});
	const inLevel = (t: { slug: string }) => !levelSlugs || levelSlugs.has(t.slug);

	// Anchored techniques carry a Lexicon definition; the rest are the guide's
	// particulars: a shaping, a vessel, one dish's one move. Both are worth a
	// page, but they are not the same kind of thing and shouldn't be one list.
	const foundations = $derived(
		data.techniques.filter((t) => t.anchored && inLevel(t)).sort((a, b) => b.count - a.count)
	);
	const particulars = $derived(
		data.techniques.filter((t) => !t.anchored && inLevel(t)).sort((a, b) => b.count - a.count)
	);

	/** "1 dish", "3 dishes": the index printed "1 dishes · 1 chapters" on four tiles. */
	const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
</script>

<svelte:head><title>The Techniques · The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<h1>The Techniques</h1>
		<p class="lede">
			The guide read sideways. Every dish here is filed by cuisine and by course, but a cook does
			not level up a cuisine at a time; they level up a skill at a time. These are the skills,
			each with every recipe in the guide that demonstrates it.
		</p>
		<p class="progress">
			{data.techniques.length} skills · {data.tagged} of {TOTALS.recipes} dishes carry at least one
		</p>
		{#if level}
			<p class="levelnote" aria-live="polite">
				Level {NUMERAL[level]}{levelName ? `, ${levelName}` : ''}: {foundations.length + particulars.length} of the
				skills. <a href="{base}/technique">Every technique</a> · <a href="{base}/level/{level}">Back to Level {NUMERAL[level]}</a>
			</p>
		{/if}
	</header>

	<h2 class="sec">The foundations</h2>
	<p class="secnote">
		The moves the whole guide is built on. Each one carries its Lexicon definition, the
		<i>why</i> underneath the what.
	</p>
	<ul class="grid">
		{#each foundations as t (t.slug)}
			<li>
				<a class="tile" href="{base}/technique/{t.slug}">
					<h3>{t.label}</h3>
					<p class="meta">{count(t.count, 'dish', 'dishes')} · {count(t.chapters, 'chapter', 'chapters')}</p>
					{#if t.lexiconTerm}<p class="anchor">{t.lexiconTerm}</p>{/if}
				</a>
			</li>
		{/each}
	</ul>

	<h2 class="sec">The particulars</h2>
	<p class="secnote">
		One shaping, one vessel, one kitchen's answer to one problem. Narrower, and often the reason a
		dish is worth cooking at all.
	</p>
	<ul class="grid">
		{#each particulars as t (t.slug)}
			<li>
				<a class="tile" href="{base}/technique/{t.slug}">
					<h3>{t.label}</h3>
					<p class="meta">{count(t.count, 'dish', 'dishes')} · {count(t.chapters, 'chapter', 'chapters')}</p>
				</a>
			</li>
		{/each}
	</ul>
</div>

<style>
	.head {
		margin-bottom: 26px;
	}
	h1 {
		font-size: var(--t-h1);
		margin-bottom: 8px;
	}
	.lede {
		font-size: var(--t-lede);
		color: var(--ink-soft);
		max-width: var(--measure);
	}
	.levelnote {
		margin-top: 8px;
		font-size: var(--t-small);
		color: var(--ink-soft);
	}
	.levelnote a {
		color: inherit;
		text-decoration-color: var(--turmeric-deep);
		text-underline-offset: 3px;
		/* a 44px row for the thumb, without pushing the line apart */
		display: inline-block;
		padding-block: 10px;
	}
	.progress {
		margin-top: 10px;
		font-size: var(--t-small);
		color: var(--muted);
		font-variant-numeric: oldstyle-nums;
	}

	.sec {
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
		border-bottom: 1px solid var(--line);
		padding-bottom: 5px;
		margin: 30px 0 8px;
		font-weight: 500;
	}
	.secnote {
		color: var(--ink-soft);
		max-width: var(--measure);
		font-size: var(--t-small);
		margin-bottom: 14px;
	}

	.grid {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: var(--gap);
	}
	.tile {
		display: block;
		height: 100%;
		text-decoration: none;
		color: inherit;
		background: var(--card);
		border: 1px solid var(--line);
		border-left: 3px solid var(--turmeric);
		border-radius: var(--radius);
		padding: 12px 14px;
	}
	.tile:hover {
		border-color: var(--line-strong);
		border-left-color: var(--turmeric-deep);
		box-shadow: var(--shadow-lift);
	}
	.tile h3 {
		font-size: var(--t-h4);
		margin: 0 0 4px;
		line-height: 1.15;
	}
	.meta {
		font-size: var(--t-micro);
		color: var(--muted);
		font-variant-numeric: oldstyle-nums;
	}
	.anchor {
		margin-top: 6px;
		font-size: var(--t-micro);
		/* --turmeric-deep, not --turmeric: the day token is darkened to clear
		   AA on tinted paper, which plain --turmeric does not (3.6:1). */
		color: var(--turmeric-deep);
		font-style: italic;
	}
</style>
