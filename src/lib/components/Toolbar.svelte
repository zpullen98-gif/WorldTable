<script lang="ts">
	import type { Course, Difficulty, FilterState } from '$lib/types';
	import { COURSES } from '$lib/data';
	import { isDefault } from '$lib/urlState';
	import type { Droppable } from '$lib/emptyState';

	let {
		filters = $bindable(),
		resultCount,
		onlucky,
		onclear,
		luckyDisabled = false,
		brief = ''
	}: {
		filters: FilterState;
		resultCount: number;
		onlucky?: () => void;
		/** Clear every filter. Receives the click so the caller can tell key from tap. */
		onclear?: (e: MouseEvent) => void;
		/** True only when the whole library is empty under these filters. */
		luckyDisabled?: boolean;
		/** The zero state, stable while typing, for the live region. */
		brief?: string;
	} = $props();

	let searchEl: HTMLInputElement | undefined = $state();
	let courseEl: HTMLSelectElement | undefined = $state();
	let diffEl: HTMLSelectElement | undefined = $state();
	let quickEl: HTMLButtonElement | undefined = $state();
	let vegEl: HTMLButtonElement | undefined = $state();
	let seasonEl: HTMLButtonElement | undefined = $state();

	/*
	 * Shown only while a chip or select is set - NOT for the query alone. The
	 * control costs no toolbar row at 320, 375, 390, 414, 720 or 1280 (the count
	 * sits alone on its row with room to spare), and 30px in two narrow reflow
	 * bands, 336-369 and 1060-1094. Gating it on chips keeps that shift off the
	 * typing path, where a static toolbar jumping under an open keyboard is the
	 * worst place for it; Escape and the browser's own cancel already clear the
	 * query on its own.
	 */
	const showClear = $derived(!isDefault({ ...filters, q: '' }));

	export function focusSearch() {
		searchEl?.focus();
		searchEl?.select();
	}

	/**
	 * Hand focus to the control a Drop button just cleared. The button unmounts
	 * with the empty state, so focus must be placed on purpose or it falls to
	 * BODY - measured.
	 */
	export function focusControl(key: Droppable) {
		const el =
			key === 'q'
				? searchEl
				: key === 'course'
					? courseEl
					: key === 'difficulty'
						? diffEl
						: key === 'quick'
							? quickEl
							: key === 'vegetarian'
								? vegEl
								: seasonEl;
		el?.focus();
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

		<select bind:this={courseEl} bind:value={filters.course} class="chip" aria-label="Filter by course">
			<option value={null}>All courses</option>
			{#each COURSES as c (c)}
				<option value={c as Course}>{c}</option>
			{/each}
		</select>

		<select bind:this={diffEl} bind:value={filters.difficulty} class="chip" aria-label="Filter by difficulty">
			<option value={null}>Any difficulty</option>
			<option value={1 as Difficulty}>Easy</option>
			<option value={2 as Difficulty}>Intermediate</option>
			<option value={3 as Difficulty}>Advanced</option>
		</select>

		<button
			bind:this={quickEl}
			class="chip"
			class:on={filters.quick}
			aria-pressed={filters.quick}
			onclick={() => (filters.quick = !filters.quick)}>Under 40 min</button
		>
		<button
			bind:this={vegEl}
			class="chip"
			class:on={filters.vegetarian}
			aria-pressed={filters.vegetarian}
			onclick={() => (filters.vegetarian = !filters.vegetarian)}>Vegetarian</button
		>
		<button
			bind:this={seasonEl}
			class="chip"
			class:on={filters.season}
			aria-pressed={filters.season}
			onclick={() => (filters.season = !filters.season)}>Peak this month</button
		>

		<!-- Disabled ONLY when the whole library is empty under these filters:
		     on a zero-result chapter it draws from the library instead. It used to
		     return silently on zero, which is the exact view a cook reaches for it. -->
		<button class="chip lucky" onclick={onlucky} disabled={luckyDisabled}>Chef’s pick ↗</button>

		<!--
			Singular when there is one. The INNER span is the live region, so the
			count is read aloud on every keystroke that changes it, and "1 dishes"
			is worse heard than seen. The zero-state brief rides inside it,
			visually hidden, so a screen reader hears "0 dishes. Nothing vegetarian
			in Seafood Atlas." exactly once when the count reaches zero - the live
			span only mutates on distinct text (measured: three announcements for
			ten keystrokes). The Clear control sits OUTSIDE the live span, so it is
			never announced as a count change.
		-->
		<span class="count">
			<span aria-live="polite"
				>{resultCount} {resultCount === 1 ? 'dish' : 'dishes'}{#if resultCount === 0 && brief}<span
						class="sr">. {brief}</span
					>{/if}</span
			>{#if showClear}<span aria-hidden="true"> · </span><button
					type="button"
					class="clear"
					onclick={(e) => onclear?.(e)}>Clear</button
				>{/if}
		</span>
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
	/*
	 * A text control, not a chip: a chip-styled Clear costs a toolbar row at
	 * 320. A bare button is 24px tall and would add 4px everywhere; the
	 * negative margin gives it a 44px hit box that costs the row nothing. Ink
	 * rather than the muted count colour, which sits 0.05 above AA.
	 */
	.clear {
		border: 0;
		padding: 12px 8px;
		margin: -12px -8px;
		background: none;
		color: var(--ink);
		text-decoration: underline;
		text-underline-offset: 2px;
		font-size: inherit;
		cursor: pointer;
	}
	.chip:disabled {
		cursor: default;
		opacity: 0.5;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}

	@media (max-width: 720px) {
		.toolbar {
			position: static;
		}
	}
</style>
