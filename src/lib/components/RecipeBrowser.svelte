<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { chapters, recipes } from '$lib/data';
	import { applyFilters, effectiveMonth } from '$lib/filter';
	import { filtersFromURL, filtersToSearch, EMPTY_FILTERS } from '$lib/urlState';
	import { prefs } from '$lib/stores/prefs.svelte';
	import type { ChapterRef } from '$lib/types';
	import RecipeCard from './RecipeCard.svelte';
	import CuisineRail from './CuisineRail.svelte';
	import Toolbar from './Toolbar.svelte';

	let { chapter = null }: { chapter?: ChapterRef | null } = $props();

	/**
	 * Filters start empty and are seeded from the URL on the client.
	 *
	 * They cannot be read during prerender: a prerendered page is one file on
	 * disk serving every query string, so SvelteKit throws on
	 * `url.searchParams` there — correctly, since baking one set of filters into
	 * the HTML would serve them to everyone. The prerendered page shows the
	 * unfiltered chapter; hydration applies whatever the link asked for.
	 *
	 * `chapter` is deliberately not captured into state either — it comes from
	 * the route, and the derived `active` below tracks it.
	 */
	let filters = $state({ ...EMPTY_FILTERS });

	// Once, on mount — not a reactive effect. The write-back effect below pushes
	// filters INTO the URL, so re-reading the URL reactively would have the two
	// chasing each other every keystroke.
	onMount(() => {
		filters = filtersFromURL(page.url);
	});

	const active = $derived(chapter?.slug ?? null);
	const effective = $derived({ ...filters, chapter: active });

	const month = $derived(effectiveMonth(prefs.hemisphere));
	const results = $derived(applyFilters(recipes, effective, month));

	// Live per-chapter counts so the rail reflects the active filters rather
	// than always showing the full corpus totals.
	const railCounts = $derived.by(() => {
		const m = new Map<string, number>();
		for (const r of applyFilters(recipes, { ...filters, chapter: null }, month)) {
			m.set(r.chapterSlug, (m.get(r.chapterSlug) ?? 0) + 1);
		}
		return m;
	});

	// Mirror filters into the URL. replaceState so typing doesn't fill history.
	$effect(() => {
		if (!browser) return;
		const search = filtersToSearch(filters);
		const current = page.url.search;
		if (search !== current) {
			goto(`${page.url.pathname}${search}`, {
				replaceState: true,
				keepFocus: true,
				noScroll: true
			});
		}
	});

	function lucky() {
		if (!results.length) return;
		const pick = results[Math.floor(Math.random() * results.length)];
		goto(`${base}/recipe/${pick.slug}`);
	}
</script>

<Toolbar bind:filters resultCount={results.length} onlucky={lucky} />

<div class="shell wrap">
	<CuisineRail {chapters} {active} counts={railCounts} />

	<div class="content">
		<div class="meta-row">
			<h2>{chapter?.name ?? 'All chapters'}</h2>
			{#if chapter}
				<p class="group">{chapter.group}</p>
			{/if}
		</div>

		{#if results.length}
			<div class="grid">
				{#each results as recipe (recipe.slug)}
					<RecipeCard {recipe} />
				{/each}
			</div>
		{:else}
			<p class="empty">Nothing on the pass. Loosen a filter or try another ingredient.</p>
		{/if}
	</div>
</div>

<style>
	.wrap {
		display: grid;
		grid-template-columns: 210px 1fr;
		gap: 28px;
		padding-top: 24px;
		padding-bottom: 80px;
	}
	@media (max-width: 820px) {
		.wrap {
			grid-template-columns: 1fr;
			gap: 12px;
		}
	}

	.meta-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 16px;
		margin-bottom: 14px;
		border-bottom: 1px solid var(--line);
		padding-bottom: 8px;
	}
	.meta-row h2 {
		font-size: var(--t-h2);
	}
	.group {
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: var(--gap);
	}

	.empty {
		padding: 60px 20px;
		text-align: center;
		color: var(--muted);
		font-style: italic;
	}
</style>
