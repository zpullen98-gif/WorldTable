<script lang="ts">
	import { base } from '$app/paths';
	import { recipes, formatTime, recipeHref } from '$lib/data';
	import { fold, effectiveMonth } from '$lib/filter';
	import { prefs } from '$lib/stores/prefs.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { matchPantry, pantryCulprit } from '$lib/pantryMatch';
	import type { Recipe } from '$lib/types';
	import { restoreScroll } from '$lib/stores/nav.svelte';
	import type { PantryDroppable } from '$lib/pantryMatch';
	import type { Snapshot } from './$types';

	let { data } = $props();

	let q = $state('');
	let minMatches = $state(3);
	let course = $state<string | null>(null);
	let vegOnly = $state(false);
	let ingredientSearch: HTMLInputElement | undefined = $state();
	let minimumControl: HTMLSelectElement | undefined = $state();
	let courseControl: HTMLSelectElement | undefined = $state();
	let vegetarianControl: HTMLInputElement | undefined = $state();
	let resultsHeading: HTMLHeadingElement | undefined = $state();

	const month = $derived(effectiveMonth(prefs.hemisphere));

	/**
	 * The L2806 bug, structurally impossible here.
	 *
	 * The original bound `panQ.addEventListener('input', buildShelf)` to the
	 * FIRST buildShelf. The v3 replacement at L3272 added the seasonal markers,
	 * the ingredient blurb and the hemisphere toggle, so typing a single
	 * character into the ingredient filter reverted the shelf to the old version
	 * and destroyed the toggle outright.
	 *
	 * A derivation recomputes from state. There is no function reference held by
	 * a listener, so there is nothing that can go stale. Do not "fix" this again.
	 */
	const shelf = $derived.by(() => {
		const needle = fold(q).trim();
		return data.pantry
			.map((g) => ({
				group: g.group,
				items: g.items.filter((it) => !needle || fold(it.label).includes(needle))
			}))
			.filter((g) => g.items.length);
	});

	const selected = $derived(new Set(session.pantry));

	// Family recipes match too: their pantryItems were derived with the same
	// keyword tables when they were saved (see authoring.ts).
	const pool = $derived(
		(session.familyRecipes.length ? [...recipes, ...session.familyRecipes] : recipes) as Recipe[]
	);
	const itemsOf = (r: Recipe) => data.recipeItems[r.slug] ?? r.pantryItems ?? [];

	const matchOpts = $derived({ selected, minMatches, course, vegOnly });
	const match = $derived(matchPantry(pool, itemsOf, matchOpts));
	const results = $derived(match.shown);
	// Only worth computing once the list is actually empty: it re-runs the
	// match up to three times more, once per relaxed control.
	const culprit = $derived(
		selected.size && !match.matched.length ? pantryCulprit(pool, itemsOf, matchOpts) : null
	);

	const MONTHS = [
		'', 'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];
	function relax(key: PantryDroppable) {
		if (key === 'minMatches') { minMatches = 1; minimumControl?.focus(); }
		else if (key === 'course') { course = null; courseControl?.focus(); }
		else { vegOnly = false; vegetarianControl?.focus(); }
	}
	function showResults() {
		resultsHeading?.scrollIntoView({ block: 'start' });
		resultsHeading?.focus({ preventScroll: true });
	}
	export const snapshot: Snapshot<{ y: number; q: string; minimum: number; course: string | null; vegetarian: boolean }> = {
		capture: () => ({ y: typeof window === 'undefined' ? 0 : window.scrollY, q, minimum: minMatches, course, vegetarian: vegOnly }),
		restore: (value) => {
			q = value.q ?? '';
			minMatches = value.minimum ?? 3;
			course = value.course ?? null;
			vegOnly = !!value.vegetarian;
			restoreScroll(value.y ?? 0, () => session.ready);
		}
	};
</script>

<svelte:head><title>Pantry Match · The World Table</title></svelte:head>

<div class="shell view">
	<!-- A way out. Until a cook ticks enough ingredients to produce a match this
	     page has no links at all, so on arrival it was a cul-de-sac reachable
	     from exactly one tile on the home page. -->
	<header class="head">
		<h1>Pantry Match</h1>
		<p class="lede">
			Tick what’s in your kitchen and the guide reads all {recipes.length} recipes, ranking the
			dishes you’re closest to cooking tonight.
		</p>
	</header>

	<div class="cols">
		<aside class="shelf">
			<div class="shelftools">
				<input
					bind:this={ingredientSearch}
					bind:value={q}
					type="search"
					placeholder="Find an ingredient…"
					aria-label="Filter ingredients"
				/>
				<button class="chip" disabled={!selected.size} onclick={() => session.clearPantry()}>Clear pantry</button>
			</div>
			<p class="selection" role="status">{selected.size} ingredients selected. <button class="linkish" onclick={showResults}>See matching dishes</button></p>
			{#if q}<button class="linkish" onclick={() => { q = ''; ingredientSearch?.focus(); }}>Show all ingredients</button>{/if}
			<p class="hemi">
				<button
					class="linkish"
					onclick={() => prefs.setHemisphere(prefs.hemisphere === 'N' ? 'S' : 'N')}
				>
					{prefs.hemisphere === 'N' ? 'Northern' : 'Southern'} hemisphere
				</button>
				· ● marks what’s at its peak in {MONTHS[month]}
			</p>

			{#each shelf as g (g.group)}
				<section>
					<h2 class="eyebrow">{g.group}</h2>
					<ul>
						{#each g.items as it (it.slug)}
							<li>
								<label title={it.blurb}>
									<input
										type="checkbox"
										checked={selected.has(it.label)}
										onchange={() => session.togglePantry(it.label)}
									/>
									<span>{it.label}</span>
									{#if it.season.includes(month)}
										<span class="peak" title="At its peak this month">●</span>
									{/if}
								</label>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
			{#if !shelf.length}<p class="ingredient-empty">No ingredient matches “{q.trim()}”. Try a simpler name or show all ingredients.</p>{/if}
		</aside>

		<div>
			<h2 class="matches-heading" tabindex="-1" bind:this={resultsHeading}>Matching dishes</h2>
			<div class="restools">
				<select bind:this={minimumControl} bind:value={minMatches} class="chip" aria-label="Minimum matches">
					<option value={1}>Any match</option>
					<option value={2}>2+ matches</option>
					<option value={3}>3+ matches</option>
					<option value={4}>4+ matches</option>
				</select>
				<select bind:this={courseControl} bind:value={course} class="chip" aria-label="Course">
					<option value={null}>All courses</option>
					{#each [...new Set(recipes.map((r) => r.course))].sort() as c (c)}
						<option value={c}>{c}</option>
					{/each}
				</select>
				<label class="chip inline">
					<input bind:this={vegetarianControl} type="checkbox" bind:checked={vegOnly} /> Vegetarian only
				</label>
				<span class="count" role="status">
					{selected.size} selected ·
					{#if match.matched.length > results.length}
						{results.length} of {match.matched.length} dishes
					{:else}
						{results.length} dishes
					{/if}
				</span>
			</div>
			<p class="match-note">Matches are a starting point. Open a recipe to check its full ingredient list and method.</p>

			{#if results.length}
				<ul class="results">
					{#each results as m (m.r.slug)}
						<li>
							<a href="{base}{recipeHref(m.r)}">
								<span class="nm">{m.r.name}</span>
								<span class="meta">{m.r.chapter} · {formatTime(m.r.minutes)}</span>
							</a>
							<p class="have">Using {m.hits.join(', ')}</p>
							{#if m.missing.length}
								<p class="need">Still needs {m.missing.join(', ')}</p>
							{/if}
						</li>
					{/each}
				</ul>
			{:else if !selected.size}
				<p class="empty">
					Select a few ingredients from the shelf; proteins and produce steer the match hardest.
					The more you tick, the smarter the ranking.
				</p>
			{:else if culprit}
				<p class="empty">
					Nothing matches what’s ticked with
					{#if culprit.key === 'minMatches'}“{minMatches}+ matches” required
					{:else if culprit.key === 'course'}“{course}” selected
					{:else}Vegetarian only on
					{/if}.
					{#if culprit.key === 'minMatches'}
						<button class="chip" onclick={() => relax('minMatches')}>Use any match · {culprit.restored} {culprit.restored === 1 ? 'dish' : 'dishes'}</button>
					{:else if culprit.key === 'course'}
						<button class="chip" onclick={() => relax('course')}>Show all courses · {culprit.restored} {culprit.restored === 1 ? 'dish' : 'dishes'}</button>
					{:else}
						<button class="chip" onclick={() => relax('vegOnly')}>Remove vegetarian filter · {culprit.restored} {culprit.restored === 1 ? 'dish' : 'dishes'}</button>
					{/if}
				</p>
			{:else}
				<p class="empty">
					No dish in the guide matches what’s ticked. Try a different ingredient.
				</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.matches-heading { font-size: var(--t-h3); margin-bottom: 12px; scroll-margin-top: 140px; }
	.matches-heading:focus { outline: none; }
	.selection, .ingredient-empty, .match-note { font-size: var(--t-small); color: var(--ink-soft); margin: 8px 0 12px; }
	/* Same as the crumb rows on /technique/[slug] and /service/[topic]. */

	.view {
		/* padding-BLOCK: the old shorthand zeroed the inline padding and beat
		   .shell's 20px gutter - text on the glass at phone widths. */
		padding-block: 26px 80px;
	}
	.head h1 {
		font-size: var(--t-h2);
		margin-bottom: 8px;
	}
	.cols {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 28px;
		margin-top: 22px;
	}
	@media (max-width: 820px) {
		.cols {
			grid-template-columns: 1fr;
		}
	}

	.shelf {
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 14px;
		max-height: 78vh;
		overflow-y: auto;
	}
	.shelftools {
		display: flex;
		gap: 8px;
		margin-bottom: 8px;
	}
	.shelftools input {
		flex: 1;
		min-width: 0;
		padding: 8px 10px;
		border: 1px solid var(--field-line);
		background: var(--card);
		border-radius: var(--radius);
	}
	.hemi {
		font-size: var(--t-micro);
		color: var(--muted);
		margin-bottom: 12px;
	}
	.linkish {
		background: none;
		border: 0;
		border-bottom: 1px dotted var(--turmeric);
		color: var(--turmeric-deep);
		cursor: pointer;
		padding: 8px 0;
		min-height: 44px;
		font-size: inherit;
	}
	.shelf section {
		margin-bottom: 14px;
	}
	.shelf h2 {
		margin-bottom: 5px;
	}
	.shelf ul {
		list-style: none;
	}
	.shelf label {
		display: flex;
		gap: 7px;
		align-items: center;
		padding: 7px 0;
		min-height: 44px;
		cursor: pointer;
		font-size: 14px;
	}
	.shelf input {
		accent-color: var(--leaf);
	}
	.peak {
		color: var(--leaf);
		font-size: 9px;
	}

	.restools {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
		margin-bottom: 16px;
	}
	.chip {
		border: 1px solid var(--line);
		background: var(--card);
		padding: 8px 12px;
		border-radius: var(--radius);
		cursor: pointer;
		font-size: 14px;
	}
	select.chip {
		appearance: none;
		/* A form control wearing the chip's coat: its edge is the field edge (3:1). */
		border-color: var(--field-line);
	}
	.chip.inline {
		display: flex;
		gap: 6px;
		align-items: center;
	}
	.count {
		margin-left: auto;
		font-size: var(--t-small);
		color: var(--muted);
		font-variant-numeric: oldstyle-nums;
	}

	.results {
		list-style: none;
		display: grid;
		gap: 10px;
	}
	.results li {
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 11px 14px;
		background: var(--card);
	}
	.results a {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		align-items: baseline;
		flex-wrap: wrap;
		min-height: 44px;
		text-decoration: none;
	}
	.results .nm {
		font-family: var(--display);
		font-size: 17px;
	}
	.results .meta {
		font-size: var(--t-micro);
		color: var(--muted);
		white-space: nowrap;
	}
	.have {
		font-size: var(--t-small);
		color: var(--leaf);
		margin-top: 3px;
	}
	.need {
		font-size: var(--t-small);
		color: var(--muted);
		font-style: italic;
	}
	.empty {
		padding: 60px 20px;
		text-align: center;
		color: var(--muted);
		font-style: italic;
	}
</style>
