<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import { goto, afterNavigate, beforeNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { chapters, chapterBySlug, recipes } from '$lib/data';
	import { applyFilters, matches, effectiveMonth } from '$lib/filter';
	import { ensureSearch, searchIds } from '$lib/search';
	import { filtersFromURL, filtersToSearch, discreteSearch, EMPTY_FILTERS } from '$lib/urlState';
	import { emptyState, type Droppable } from '$lib/emptyState';
	import { prefs } from '$lib/stores/prefs.svelte';
	import { session } from '$lib/stores/session.svelte';
	import type { ChapterRef, FilterState, RecipeSummary } from '$lib/types';
	import RecipeCard from './RecipeCard.svelte';
	import CuisineRail from './CuisineRail.svelte';
	import Toolbar from './Toolbar.svelte';

	/**
	 * h2 by default: /recipes renders this component under its OWN page h1
	 * ("The Library"), so the chapter/filter heading here is one level below
	 * it. The 171 chapter pages render this component as their entire page
	 * and have no h1 of their own - +layout.svelte promotes the brandline to
	 * an h1 only on '/' - so they pass headingLevel="h1" and this becomes the
	 * page's real first-level heading instead of a level the outline skips.
	 */
	let {
		chapter = null,
		headingLevel = 'h2'
	}: { chapter?: ChapterRef | null; headingLevel?: 'h1' | 'h2' } = $props();

	/**
	 * Filters start empty and are seeded from the URL on the client.
	 *
	 * They cannot be read during prerender: a prerendered page is one file on
	 * disk serving every query string, so SvelteKit throws on
	 * `url.searchParams` there: correctly, since baking one set of filters into
	 * the HTML would serve them to everyone. The prerendered page shows the
	 * unfiltered chapter; hydration applies whatever the link asked for.
	 *
	 * `chapter` is deliberately not captured into state either: it comes from
	 * the route, and the derived `active` below tracks it.
	 */
	let filters = $state({ ...EMPTY_FILTERS });
	let toolbar: Toolbar | undefined = $state();
	let headingEl: HTMLHeadingElement | undefined = $state();

	// Once, on mount, and again on popstate (see the history split below): not
	// a reactive effect. The write-back effect pushes filters INTO the URL, so
	// re-reading the URL reactively would have the two chasing each other every
	// keystroke.
	onMount(() => {
		filters = filtersFromURL(page.url);
		written = { ...filters };
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
	 * both from one list means they cannot disagree: with two separate
	 * applyFilters passes, a search path used by one and not the other would
	 * show a rail count that doesn't match the grid.
	 *
	 * With a query and a ready index: tokenized, relevance-ordered, and
	 * ingredient-aware: "lemongrass" finds Tom Yum by its ingredients, and
	 * "ragu" no longer matches asparagus by substring accident.
	 */
	// Family recipes sit alongside the whole guide corpus in every list below.
	// They are not in the static search index, so under a query they are
	// matched by the substring predicate (name/chapter) and appended after the
	// ranked results.
	const familyRecipes = $derived(session.familyRecipes);
	const allRecipes = $derived(
		familyRecipes.length ? [...recipes, ...familyRecipes] : recipes
	);

	/**
	 * One function for "everything under these filters", so the empty state's
	 * query pool can take the IDENTICAL index-or-substring path the grid took.
	 * That is what makes "Drop Vegetarian for 20 dishes" the number the grid
	 * shows after the click, not a substring approximation of it.
	 */
	function matchUnder(f: FilterState): RecipeSummary[] {
		const rest = { ...f, chapter: null };
		const q = f.q.trim();
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
	}

	const matchedAll = $derived(matchUnder({ ...filters, chapter: null }));

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
	// here: those recipes already count into the existing rail row.
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
					subgroup: null,
					count: 1
				});
		}
		return synthesized.size ? [...synthesized.values(), ...chapters] : chapters;
	});

	/**
	 * The empty state, computed only when the grid is empty.
	 *
	 * qPool is the scope narrowed by the query alone, by the same path the grid
	 * used, so the numbers the sentence carries are the ones the grid will show.
	 */
	const empty = $derived.by(() => {
		if (results.length) return null;
		const scopeAll = active ? allRecipes.filter((r) => r.chapterSlug === active) : allRecipes;
		const qPool = filters.q.trim()
			? matchUnder({ ...EMPTY_FILTERS, q: filters.q }).filter((r) => !active || r.chapterSlug === active)
			: scopeAll;
		return emptyState({
			scope: chapter?.name ?? 'the library',
			inChapter: !!active,
			all: scopeAll,
			qPool,
			filters,
			month,
			library: matchedAll.length
		});
	});

	/*
	 * Mirror filters into the URL, and decide what Back means.
	 *
	 * Every change used to replaceState, so Back never undid a filter: a cook
	 * who toggled three chips and pressed Back left the app. Now a keystroke
	 * replaces and a discrete choice - chip, select, clear - pushes. The two are
	 * told apart by comparing discreteSearch() against the state the URL LAST
	 * GOT (`written`), not against page.url: a hop to a bare same-route URL (the
	 * Library tab from a filtered /recipes) keeps re-appending the query with
	 * replaceState as it always did, rather than costing two entries.
	 *
	 * Back then needs the URL read back INTO filters, which the onMount seed does
	 * not cover. afterNavigate does it for popstate only, and `restoring` keeps
	 * the effect from writing the URL back out while the re-seed lands. Both are
	 * plain variables on purpose: reading a $state here (`navigating`, say)
	 * subscribes the effect to it and goto loops forever - measured, a hang.
	 */
	let written: FilterState = { ...EMPTY_FILTERS };
	let restoring = false;
	beforeNavigate((nav) => {
		if (nav.type === 'popstate') restoring = true;
	});
	afterNavigate((nav) => {
		if (nav.type !== 'popstate') return;
		filters = filtersFromURL(page.url);
		written = { ...filters };
		restoring = false;
	});
	$effect(() => {
		if (!browser) return;
		const search = filtersToSearch(filters);
		if (restoring) return;
		const current = page.url.search;
		if (search !== current) {
			const keystroke = discreteSearch(written) === discreteSearch(filters);
			written = { ...filters };
			goto(`${page.url.pathname}${search}`, {
				replaceState: keystroke,
				keepFocus: true,
				noScroll: true
			});
		}
	});

	/**
	 * Chef's pick. On a zero-result chapter it draws from the library under the
	 * same filters - a vegetarian who asked in the Seafood Atlas gets a
	 * vegetarian dish, not a seafood one - and is disabled only when the library
	 * is empty too. It used to return silently on zero, which is the exact view
	 * a cook reaches for it on. The original fell back to the WHOLE library
	 * ignoring every filter; this is stricter than what the port dropped.
	 */
	function lucky() {
		const pool = results.length ? results : matchedAll;
		if (!pool.length) return;
		const pick = pool[Math.floor(Math.random() * pool.length)];
		goto(`${base}/recipe/${pick.slug}`);
	}

	/**
	 * Clear every filter. Never navigates: the chapter comes from the route, so
	 * this cannot move a cook off the page they are on. Keyboard activation
	 * lands where '/' lands; a pointer tap lands on the grid heading, so a phone
	 * does not open a keyboard over the grid it just widened.
	 */
	function clearAll(e?: MouseEvent) {
		filters = { ...EMPTY_FILTERS };
		if (e && e.detail === 0) toolbar?.focusSearch();
		else headingEl?.focus();
	}

	/** Drop the one filter the empty state named, and hand focus to its control. */
	function dropOne(key: Droppable) {
		filters = { ...filters, [key]: EMPTY_FILTERS[key] };
		if (key === 'q') toolbar?.focusSearch();
		else toolbar?.focusControl(key);
	}
</script>

<Toolbar
	bind:this={toolbar}
	bind:filters
	resultCount={results.length}
	onlucky={lucky}
	onclear={clearAll}
	luckyDisabled={!results.length && !matchedAll.length}
	brief={empty?.brief ?? ''}
/>

<div class="shell wrap">
	<CuisineRail chapters={railChapters} {active} counts={railCounts} search={filtersToSearch(filters)} />

	<div class="content">
		<div class="meta-row">
			<!-- tabindex -1: the clear control sends a pointer tap here. -->
			<svelte:element this={headingLevel} bind:this={headingEl} tabindex="-1">{chapter?.name ?? 'All chapters'}</svelte:element>
			{#if chapter}
				<p class="group">{chapter.group}</p>
			{/if}
		</div>

		{#if results.length}
			<div class="grid">
				{#each results as recipe (recipe.slug)}
					<!-- One level below this heading, whichever level that is: h3 under
					     this component's own h2 on /recipes, h2 under its h1 on a
					     chapter page - never skipping past h2 the way a fixed h3 would
					     have on a page whose only other heading is now an h1. -->
					<RecipeCard {recipe} headingLevel={headingLevel === 'h1' ? 'h2' : 'h3'} />
				{/each}
			</div>
		{:else if empty}
			<!--
				Names the culprit, with the count it gives back. This was one fixed
				sentence for six filters - "Loosen a filter" - and measured over the
				corpus that is the wrong advice two thirds of the time: one filter
				emptied the chapter on its own, and dropping it is the whole answer.
			-->
			<div class="empty">
				<p>{empty.sentence}</p>
				<p class="actions">
					{#if empty.culprit}
						<button type="button" class="chip" onclick={() => dropOne(empty.culprit!.key)}
							>Drop {empty.culprit.label}</button
						>
					{/if}
					<button type="button" class="chip" onclick={(e) => clearAll(e)}>Clear filters</button>
					{#if active && empty.library > 0}
						<a class="chip" href="{base}/recipes{filtersToSearch(filters)}"
							>{empty.library} across the library</a
						>
					{/if}
				</p>
			</div>
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
		/*
		 * Dishes FIRST on a phone. Under 820px the rail is static, fully open
		 * for the active group, and rendered before the content - so on
		 * /chapter/italian at 375x667 a 2,012px rail sat between the toolbar and
		 * the first dish, 2.9 screens below the fold; a US chapter with two
		 * groups open put it 7 screens down. Every chapter page, every phone.
		 * Unconditional rather than only-when-empty, so the heading does not
		 * flip above and below the rail with the result count.
		 */
		.content {
			order: -1;
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
	/* :is(h1, h2), not a bare h2: chapter pages render this heading as the
	   page's own h1 (see the headingLevel prop above) and it must look
	   exactly like it did as an h2 - the level changed, not the design. */
	.meta-row :is(h1, h2) {
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
		padding: 40px 20px 60px;
		text-align: center;
		color: var(--muted);
	}
	.empty p:first-child {
		font-style: italic;
		max-width: var(--measure);
		margin: 0 auto 16px;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 10px;
	}
	.actions .chip {
		border: 1px solid var(--line);
		background: var(--card);
		color: var(--ink);
		padding: 8px 14px;
		border-radius: var(--radius);
		cursor: pointer;
		font-size: 14px;
		font-style: normal;
		text-decoration: none;
	}
	.actions .chip:hover {
		border-color: var(--turmeric);
	}
	.meta-row :is(h1, h2):focus {
		outline: none;
	}
</style>
