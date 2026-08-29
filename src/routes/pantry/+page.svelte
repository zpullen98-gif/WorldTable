<script lang="ts">
	import { base } from '$app/paths';
	import { recipes, formatTime, recipeHref } from '$lib/data';
	import { fold, effectiveMonth } from '$lib/filter';
	import { prefs } from '$lib/stores/prefs.svelte';
	import { session } from '$lib/stores/session.svelte';
	import type { Recipe } from '$lib/types';

	let { data } = $props();

	let q = $state('');
	let minMatches = $state(3);
	let course = $state<string | null>(null);
	let vegOnly = $state(false);

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

	const results = $derived.by(() => {
		if (!selected.size) return [];
		const need = Math.min(minMatches, selected.size);
		const scored = [];
		// Family recipes match too: their pantryItems were derived with the same
		// keyword tables when they were saved (see authoring.ts).
		const pool = session.familyRecipes.length
			? [...recipes, ...session.familyRecipes]
			: recipes;
		for (const r of pool) {
			if (course && r.course !== course) continue;
			if (vegOnly && !r.diet.vegetarian) continue;
			const items = data.recipeItems[r.slug] ?? (r as Recipe).pantryItems ?? [];
			const hits = items.filter((l) => selected.has(l));
			if (!hits.length || hits.length < need) continue;
			const missing = items.filter((l) => !selected.has(l)).slice(0, 4);
			scored.push({ r, hits, missing });
		}
		scored.sort(
			(a, b) =>
				b.hits.length - a.hits.length ||
				a.missing.length - b.missing.length ||
				a.r.minutes - b.r.minutes
		);
		return scored.slice(0, 60);
	});

	const MONTHS = [
		'', 'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];
</script>

<svelte:head><title>Pantry Match | The World Table</title></svelte:head>

<div class="shell view">
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
					bind:value={q}
					type="search"
					placeholder="Find an ingredient…"
					aria-label="Filter ingredients"
				/>
				<button class="chip" onclick={() => session.clearPantry()}>Clear</button>
			</div>
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
		</aside>

		<div>
			<div class="restools">
				<select bind:value={minMatches} class="chip" aria-label="Minimum matches">
					<option value={1}>Any match</option>
					<option value={2}>2+ matches</option>
					<option value={3}>3+ matches</option>
					<option value={4}>4+ matches</option>
				</select>
				<select bind:value={course} class="chip" aria-label="Course">
					<option value={null}>All courses</option>
					{#each [...new Set(recipes.map((r) => r.course))].sort() as c (c)}
						<option value={c}>{c}</option>
					{/each}
				</select>
				<label class="chip inline">
					<input type="checkbox" bind:checked={vegOnly} /> Vegetarian only
				</label>
				<span class="count">{selected.size} selected · {results.length} dishes</span>
			</div>

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
			{:else}
				<p class="empty">
					Select a few ingredients from the shelf; proteins and produce steer the match hardest.
					The more you tick, the smarter the ranking.
				</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.view {
		padding: 26px 0 80px;
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
		border: 1px solid var(--line);
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
		padding: 0;
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
		padding: 2px 0;
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
