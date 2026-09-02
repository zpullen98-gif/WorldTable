<script lang="ts">
	import type { Course, Difficulty, FilterState } from '$lib/types';
	import { COURSES } from '$lib/data';

	let {
		filters = $bindable(),
		resultCount,
		onlucky
	}: {
		filters: FilterState;
		resultCount: number;
		onlucky?: () => void;
	} = $props();

	let searchEl: HTMLInputElement | undefined = $state();

	export function focusSearch() {
		searchEl?.focus();
		searchEl?.select();
	}
</script>

<div class="toolbar" data-print="hide">
	<!-- shell, like head-inner and modebar-inner in the layout: without it the
     search input ran glass-to-glass on /recipes and all 171 chapter pages at
     every width, and pinned to the far left of wide desktop windows. -->
<div class="shell tool-inner">
		<div class="search">
			<svg viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true">
				<circle cx="11" cy="11" r="7" /><path d="M21 21l-4.5-4.5" />
			</svg>
			<input
				bind:this={searchEl}
				bind:value={filters.q}
				type="search"
				placeholder="Search a dish or an ingredient: try “lemongrass”"
				aria-label="Search recipes"
			/>
		</div>

		<select bind:value={filters.course} class="chip" aria-label="Filter by course">
			<option value={null}>All courses</option>
			{#each COURSES as c (c)}
				<option value={c as Course}>{c}</option>
			{/each}
		</select>

		<select bind:value={filters.difficulty} class="chip" aria-label="Filter by difficulty">
			<option value={null}>Any difficulty</option>
			<option value={1 as Difficulty}>Easy</option>
			<option value={2 as Difficulty}>Intermediate</option>
			<option value={3 as Difficulty}>Advanced</option>
		</select>

		<button
			class="chip"
			class:on={filters.quick}
			aria-pressed={filters.quick}
			onclick={() => (filters.quick = !filters.quick)}>Under 40 min</button
		>
		<button
			class="chip"
			class:on={filters.vegetarian}
			aria-pressed={filters.vegetarian}
			onclick={() => (filters.vegetarian = !filters.vegetarian)}>Vegetarian</button
		>
		<button
			class="chip"
			class:on={filters.season}
			aria-pressed={filters.season}
			onclick={() => (filters.season = !filters.season)}>Peak this month</button
		>

		<button class="chip lucky" onclick={onlucky}>Chef’s pick ↗</button>

		<!-- Singular when there is one. This is an aria-live region, so the count
		     is also read aloud on every keystroke that changes it, and "1 dishes"
		     is worse heard than seen. -->
		<span class="count" aria-live="polite"
			>{resultCount} {resultCount === 1 ? 'dish' : 'dishes'}</span
		>
	</div>
</div>

<style>
	.toolbar {
		position: sticky;
		top: 0;
		z-index: 30;
		background: var(--paper);
		border-bottom: 1px solid var(--line);
		padding: 12px 0;
	}
	.tool-inner {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: center;
	}

	.search {
		flex: 1 1 260px;
		position: relative;
	}
	.search input {
		width: 100%;
		padding: 10px 14px 10px 38px;
		border: 1px solid var(--line);
		background: var(--card);
		border-radius: var(--radius);
		color: var(--ink);
	}
	.search svg {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		width: 16px;
		height: 16px;
		stroke: var(--muted);
	}

	.chip {
		border: 1px solid var(--line);
		background: var(--card);
		padding: 8px 14px;
		border-radius: var(--radius);
		cursor: pointer;
		font-size: 14px;
	}
	.chip:hover {
		border-color: var(--turmeric);
	}
	.chip.on {
		background: var(--ink);
		color: var(--card);
		border-color: var(--ink);
	}
	.chip.lucky {
		border-color: var(--turmeric-deep);
		color: var(--turmeric-deep);
		font-weight: 600;
	}

	select.chip {
		appearance: none;
		padding-right: 28px;
		background-image: linear-gradient(45deg, transparent 50%, currentColor 50%),
			linear-gradient(135deg, currentColor 50%, transparent 50%);
		background-position:
			right 14px center,
			right 9px center;
		background-size:
			5px 5px,
			5px 5px;
		background-repeat: no-repeat;
	}

	.count {
		margin-left: auto;
		font-size: var(--t-small);
		color: var(--muted);
		font-variant-numeric: oldstyle-nums;
	}

	@media (max-width: 720px) {
		.toolbar {
			position: static;
		}
	}
</style>
