<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { chapters, chapterBySlug, recipes } from '$lib/data';
	import { applyFilters, matches, effectiveMonth } from '$lib/filter';
	import { ensureSearch, searchIds } from '$lib/search';
	import { filtersFromURL, filtersToSearch, EMPTY_FILTERS } from '$lib/urlState';
	import { prefs } from '$lib/stores/prefs.svelte';
	import { session } from '$lib/stores/session.svelte';
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
	const month = $derived(effectiveMonth(prefs.hemisphere));

	// The real index loads on the first keystroke; until it lands, the substring
	// fallback in matches() keeps the input alive.
	let searchReady = $state(false);
	$effect(() => {
		if (browser && filters.q.trim() && !searchReady) {
			void ensureSearch().then(() => (searchReady = true));
		}
	});

	/**
	 * Everything matching the filters EXCEPT the chapter, computed once. The
	 * grid narrows it by chapter; the rail counts group it by chapter. Deriving
	 * both from one list means they cannot disagree — with two separate
	 * applyFilters passes, a search path used by one and not the other would
	 * show a rail count that doesn't match the grid.
	 *
	 * With a query and a ready index: tokenized, relevance-ordered, and
	 * ingredient-aware — "lemongrass" finds Tom Yum by its ingredients, and
	 * "ragu" no longer matches asparagus by substring accident.
	 */
	// Family recipes sit alongside the guide's 970 in every list below. They are
	// not in the static search index, so under a query they are matched by the
	// substring predicate (name/chapter) and appended after the ranked results.
	const familyRecipes = $derived(session.familyRecipes);
	const allRecipes = $derived(
		familyRecipes.length ? [...recipes, ...familyRecipes] : recipes
	);

	const matchedAll = $derived.by(() => {
		const rest = { ...filters, chapter: null };
		const q = filters.q.trim();
		if (q && searchReady) {
			const ids = searchIds(q);
			if (ids) {
				const noQ = { ...rest, q: '' };
				const ranked = ids.map((i) => recipes[i]).filter((r) => r && matches(r, noQ, month));
				const fam = familyRecipes.filter((r) => matches(r, rest, month));
				return fam.length ? [...ranked, ...fam] : ranked;
			}
		}
		return applyFilters(allRecipes, rest, month);
	});

	const results = $derived(
		active ? matchedAll.filter((r) => r.chapterSlug === active) : matchedAll
	);

	const railCounts = $derived.by(() => {
		const m = new Map<string, number>();
		for (const r of matchedAll) m.set(r.chapterSlug, (m.get(r.chapterSlug) ?? 0) + 1);
		return m;
	});

	// Chapters that exist only in the family shelf get a rail entry of their
	// own, grouped under "The Family Chapter". A family chapter whose slug
	// collides with a guide chapter (someone filing under "Italian") is skipped
	// here — those recipes already count into the existing rail row.
	const railChapters = $derived.by(() => {
		if (!familyRecipes.length) return chapters;
		const synthesized = new Map<string, ChapterRef>();
		for (const r of familyRecipes) {
			if (chapterBySlug.has(r.chapterSlug)) continue;
			const existing = synthesized.get(r.chapterSlug);
			if (existing) existing.count++;
			else
				synthesized.set(r.chapterSlug, {
					name: r.chapter,
					slug: r.chapterSlug,
					kind: 'world',
					group: 'The Family Chapter',
					count: 1
				});
		}
		return synthesized.size ? [...synthesized.values(), ...chapters] : chapters;
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
	<CuisineRail chapters={railChapters} {active} counts={railCounts} />

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
