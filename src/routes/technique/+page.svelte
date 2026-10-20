<script lang="ts">
	import { base } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { TOTALS, loadLevels } from '$lib/data';
	import { levelFromSearch } from '$lib/levels';
	import type { DeckLevel } from '$lib/types';
	import { fold } from '$lib/filter';
	import { restoreScroll } from '$lib/stores/nav.svelte';
	import type { Snapshot } from './$types';

	let { data } = $props();

	/* `?level=2` narrows the index to the techniques placed at that level (the
	   four levels' door in). Seeded in afterNavigate, never in load: a
	   prerendered page may not read the query at load time, and the levels
	   file is a lazy island the index does not otherwise need. Null is every
	   technique, as the page has always been. */
	let level = $state<DeckLevel | null>(null);
	let levelName = $state('');
	let levelSlugs = $state<Set<string> | null>(null);
	let levelLoading = $state(false);
	let levelFailed = $state(false);
	let levelRequest = 0;
	let query = $state('');
	let kind = $state('all');

	async function openLevel(wanted: DeckLevel | null) {
		const request = ++levelRequest;
		level = wanted;
		levelName = '';
		levelLoading = !!wanted;
		levelFailed = false;
		levelSlugs = wanted ? new Set() : null;
		if (!wanted) return;
		try {
			const data = await loadLevels();
			if (request !== levelRequest) return;
			levelName = data.levels.find((l) => l.level === wanted)?.name ?? '';
			levelSlugs = new Set(data.items.techniques[String(wanted)] ?? []);
		} catch {
			if (request === levelRequest) levelFailed = true;
		} finally {
			if (request === levelRequest) levelLoading = false;
		}
	}
	afterNavigate(() => { void openLevel(levelFromSearch(page.url.search)); });
	const inLevel = (t: { slug: string }) => !levelSlugs || levelSlugs.has(t.slug);
	const matchesSearch = (t: { label: string; lexiconTerm: string | null }) =>
		fold(`${t.label} ${t.lexiconTerm ?? ''}`).includes(fold(query).trim());

	// Anchored techniques carry a Lexicon definition; the rest are the guide's
	// particulars: a shaping, a vessel, one dish's one move. Both are worth a
	// page, but they are not the same kind of thing and shouldn't be one list.
	const foundations = $derived(
		data.techniques.filter((t) => t.anchored && inLevel(t) && matchesSearch(t) && kind !== 'particulars').sort((a, b) => b.count - a.count)
	);
	const particulars = $derived(
		data.techniques.filter((t) => !t.anchored && inLevel(t) && matchesSearch(t) && kind !== 'foundations').sort((a, b) => b.count - a.count)
	);
	const available = $derived(data.techniques.filter(inLevel).length);
	const elsewhere = $derived(levelSlugs && !levelLoading && !levelFailed && query.trim()
		? data.techniques.filter((t) => !inLevel(t) && matchesSearch(t) && (kind === 'all' || (kind === 'foundations' ? t.anchored : !t.anchored)))
		: []);
	export const snapshot: Snapshot<{ y: number; query: string; kind: string }> = {
		capture: () => ({ y: typeof window === 'undefined' ? 0 : window.scrollY, query, kind }),
		restore: (value) => {
			query = value.query ?? '';
			kind = value.kind ?? 'all';
			restoreScroll(value.y ?? 0, () => !level || !!levelSlugs);
		}
	};

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
			<!-- the live region stands at once; its words wait for the level's name -->
			<p class="levelnote" aria-live="polite">
					{#if levelName}{levelName}: {available} of the
					skills. <a href="{base}/technique">Every technique</a>{/if}
			</p>
		{/if}
	</header>

	<div class="find-tools" data-print="hide">
		<label>Find a skill<input type="search" bind:value={query} placeholder="Try braising, knife or pastry" /></label>
		<label>Technique group<select bind:value={kind}><option value="all">Every group</option><option value="foundations">Foundations</option><option value="particulars">Dish-specific skills</option></select></label>
	</div>
	<p class="search-count" role="status">{foundations.length + particulars.length} of {available} techniques{#if query || kind !== 'all'} · <button class="clear" onclick={() => { query = ''; kind = 'all'; }}>Clear filters</button>{/if}</p>
	{#if levelLoading}<p class="secnote" role="status">Opening the techniques for this level…</p>{/if}
	{#if levelFailed}
		<div class="secnote" role="status">
			<p>The techniques for this level could not load. Your saved progress is unchanged.</p>
			<button class="chip" onclick={() => void openLevel(level)}>Try this level again</button>
			<button class="chip" onclick={() => window.location.reload()}>Reload study material</button>
			<a class="chip" href="{base}/technique">Browse every level</a>
		</div>
	{/if}
	{#if !foundations.length && !particulars.length && !levelLoading && !levelFailed}
		<p class="secnote">No techniques match these filters. Try a broader word or clear the filters.{#if level} <a href="{base}/technique">Browse every level</a>.{/if}</p>
	{/if}
	{#if foundations.length}
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
	{/if}

	{#if particulars.length}
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
	{/if}
	{#if elsewhere.length}
		<h2 class="sec">At other levels</h2>
		<p class="secnote">These skills also match your search. You can read any of them now.</p>
		<ul class="grid">{#each elsewhere as t (t.slug)}<li><a class="tile" href="{base}/technique/{t.slug}"><h3>{t.label}</h3><p class="meta">{count(t.count, 'dish', 'dishes')}</p></a></li>{/each}</ul>
	{/if}
</div>

<style>
	.find-tools { display: flex; flex-wrap: wrap; align-items: end; gap: 14px; }
	.find-tools label { display: grid; gap: 6px; flex: 1 1 220px; color: var(--ink-soft); font-size: 1rem; }
	.find-tools input, .find-tools select { width: 100%; min-width: 0; min-height: 44px; padding: 8px 12px; border: 1px solid var(--field-line); border-radius: var(--radius); background: var(--card); color: var(--ink); font: inherit; }
	.search-count { color: var(--ink-soft); margin-top: 10px; }
	.clear { min-height: 44px; border: 0; background: transparent; color: var(--turmeric-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
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
