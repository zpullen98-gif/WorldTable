<script lang="ts">
	import { base } from '$app/paths';
	import type { ChapterRef } from '$lib/types';

	let {
		chapters,
		active = null,
		counts = null
	}: {
		chapters: ChapterRef[];
		active?: string | null;
		counts?: Map<string, number> | null;
	} = $props();

	/**
	 * Rail grouping, ported from `railGroups` (L1866) as a pure derivation.
	 * Order is deliberate: world cuisines, then the thematic Atlases, then the
	 * nine US super-regions in the original's geographic order.
	 */
	const US_ORDER = [
		'New England',
		'Mid-Atlantic',
		'The South',
		'The Midwest',
		'The Plains',
		'The Southwest',
		'The Mountain West',
		'The Pacific',
		'American Table'
	];

	const groups = $derived.by(() => {
		const byGroup = new Map<string, ChapterRef[]>();
		for (const c of chapters) {
			if (!byGroup.has(c.group)) byGroup.set(c.group, []);
			byGroup.get(c.group)!.push(c);
		}
		for (const list of byGroup.values()) list.sort((a, b) => a.name.localeCompare(b.name));

		const order = ['World Cuisines', 'The Atlases', ...US_ORDER];
		return order
			.filter((g) => byGroup.has(g))
			.map((g) => ({ group: g, chapters: byGroup.get(g)! }));
	});

	// A group opens when it holds the active chapter, so a deep link to
	// /chapter/vermont arrives with New England already expanded.
	let open = $state(new Set<string>(['World Cuisines']));

	$effect(() => {
		if (!active) return;
		const g = chapters.find((c) => c.slug === active)?.group;
		if (g && !open.has(g)) {
			open = new Set([...open, g]);
		}
	});

	function toggle(group: string) {
		const next = new Set(open);
		if (next.has(group)) next.delete(group);
		else next.add(group);
		open = next;
	}

	const shown = (slug: string, fallback: number) => counts?.get(slug) ?? fallback;
</script>

<nav class="rail" aria-label="Chapters">
	<h2 class="eyebrow">Chapters</h2>
	<ul>
		<li>
			<a class="all" class:on={!active} href={base || '/'}>All chapters</a>
		</li>
		{#each groups as g (g.group)}
			{@const isOpen = open.has(g.group)}
			<li class="rgrp" class:open={isOpen}>
				<button
					class="rghead"
					aria-expanded={isOpen}
					onclick={() => toggle(g.group)}
				>
					<span>{g.group}</span>
					<span class="caret" aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
				</button>
				{#if isOpen}
					<ul class="sub">
						{#each g.chapters as c (c.slug)}
							<li>
								<a
									href="{base}/chapter/{c.slug}"
									class:on={active === c.slug}
								>
									<span class="nm">{c.name}</span>
									<span class="ct">{shown(c.slug, c.count)}</span>
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</li>
		{/each}
	</ul>
</nav>

<style>
	.rail {
		position: relative;
	}
	.rail > ul {
		list-style: none;
		position: sticky;
		top: 74px;
		max-height: calc(100vh - 96px);
		overflow-y: auto;
		overscroll-behavior: contain;
		padding-right: 6px;
	}

	/* Fade cue that the list continues past the fold. */
	.rail::after {
		content: '';
		position: sticky;
		display: block;
		bottom: 0;
		height: 26px;
		margin-top: -26px;
		pointer-events: none;
		background: linear-gradient(transparent, var(--paper));
	}

	h2 {
		margin: 4px 0 10px;
	}

	ul {
		list-style: none;
	}

	a {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		align-items: baseline;
		padding: 6px 10px;
		text-decoration: none;
		border-left: 2px solid transparent;
		font-size: 14.5px;
		color: var(--ink);
	}
	a:hover {
		border-left-color: var(--line-strong);
	}
	a.on {
		border-left-color: var(--turmeric);
		color: var(--turmeric-deep);
		font-weight: 600;
	}
	.nm {
		min-width: 0;
	}
	.ct {
		font-size: 11px;
		color: var(--muted);
		font-variant-numeric: oldstyle-nums;
		flex: none;
	}

	.all {
		font-variant: small-caps;
		letter-spacing: 0.04em;
	}

	.rghead {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
		background: none;
		border: 0;
		border-bottom: 1px solid var(--line);
		cursor: pointer;
		font-family: var(--text);
		font-size: 10.5px;
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--turmeric-deep);
		padding: 9px 4px 7px;
		text-align: left;
	}
	.rghead:hover {
		color: var(--turmeric);
	}
	.caret {
		font-size: 9px;
		opacity: 0.75;
	}

	@media (max-width: 820px) {
		.rail > ul {
			position: static;
			max-height: none;
			overflow: visible;
			padding-right: 0;
		}
		.rail::after {
			display: none;
		}
	}
</style>
