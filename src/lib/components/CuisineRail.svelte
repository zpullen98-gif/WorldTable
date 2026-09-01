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
	 * Two levels: continent, then country, with the chapter as the leaf.
	 *
	 * It was one level, and fifty-two world cuisines shared a single heading
	 * called "World Cuisines" while the nine US super-regions each had one of
	 * their own, so New England outranked Asia. Now the United States is one
	 * entry like any other continent and its super-regions are its second
	 * level, which is what fifty states always needed.
	 *
	 * The Atlases have no country, so they render flat: a country heading
	 * repeating "Dessert Atlas" under "Dessert Atlas" would be noise.
	 */
	const CONTINENT_ORDER = [
		'The Family Chapter',
		'Europe',
		'Asia',
		'Africa',
		'The Americas',
		'Oceania',
		'United States',
		'The Atlases'
	];

	// Within a continent, countries run alphabetically, except the US regions,
	// which run in the original guide's geographic order rather than by name.
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

	type Country = { country: string | null; chapters: ChapterRef[] };

	/**
	 * How many dishes a chapter is offering right now.
	 *
	 * This was `counts?.get(slug) ?? fallback`, and the coalesce could not tell
	 * "nobody counted" from "counted, and the answer is nothing": railCounts
	 * only carries a key for a chapter with at least one match, so a chapter the
	 * filter emptied fell through to chapters.json's UNFILTERED total. With no
	 * filter every chapter has a key and the fallback never fires, which is why
	 * it stayed invisible. Measured: unfiltered, 0 of 171 rows wrong; q="pad
	 * thai", 159 of 171 rows advertising 1696 dishes that are not there; a query
	 * matching nothing, all 171 offering the whole corpus. Median across
	 * thirteen real queries, 161 of 171.
	 *
	 * `counts` stays nullable because the rail can be rendered with no filtered
	 * view to count; when it IS given, an absent key is a real zero and says so.
	 */
	const dishes = (c: ChapterRef) => (counts ? (counts.get(c.slug) ?? 0) : c.count);

	const groups = $derived.by(() => {
		const byGroup = new Map<string, Map<string, ChapterRef[]>>();
		for (const c of chapters) {
			if (!byGroup.has(c.group)) byGroup.set(c.group, new Map());
			const key = c.subgroup ?? '';
			const inner = byGroup.get(c.group)!;
			if (!inner.has(key)) inner.set(key, []);
			inner.get(key)!.push(c);
		}

		const ordered = [
			...CONTINENT_ORDER.filter((g) => byGroup.has(g)),
			...[...byGroup.keys()].filter((g) => !CONTINENT_ORDER.includes(g)).sort()
		];

		return ordered.map((g) => {
			const inner = byGroup.get(g)!;
			let keys = [...inner.keys()];
			keys =
				g === 'United States'
					? [...US_ORDER.filter((k) => inner.has(k)), ...keys.filter((k) => !US_ORDER.includes(k))]
					: keys.sort((a, b) => a.localeCompare(b));
			const countries: Country[] = keys.map((k) => ({
				country: k === '' ? null : k,
				chapters: inner.get(k)!.sort((a, b) => a.name.localeCompare(b.name))
			}));
			/*
			 * The sum of the rows beneath it, which is not what this used to be:
			 * it counted CHAPTERS while every row under it counts dishes, so the
			 * same column read "Europe 31" over rows adding to 346. It also
			 * ignored the filter completely, and a group is COLLAPSED by
			 * default, so for most of the rail this was the only number on
			 * screen and the one least able to change.
			 */
			const total = countries.reduce(
				(n, c) => n + c.chapters.reduce((m, ch) => m + dishes(ch), 0),
				0
			);
			return { group: g, countries, total };
		});
	});

	// A group opens when it holds the active chapter, so a deep link to
	// /chapter/vermont arrives with New England already expanded.
	let open = $state(new Set<string>(['Europe']));

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

	/* A row stays a link even at 0, on purpose: a cook who has narrowed too far
	   may well want to jump to a chapter and start again, and a row reading 0
	   has already said what is there. See dishes() above for the count itself. */
</script>

<nav class="rail" aria-label="Chapters">
	<h2 class="eyebrow">Chapters</h2>
	<ul>
		<li>
			<a class="all" class:on={!active} href="{base}/recipes">All chapters</a>
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
					<span class="gct">{g.total}</span>
					<span class="caret" aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
				</button>
				{#if isOpen}
					<ul class="sub">
						{#each g.countries as ctry (ctry.country ?? '_')}
							{#if ctry.country}
								<li class="cntry" aria-hidden="true">{ctry.country}</li>
							{/if}
							{#each ctry.chapters as c (c.slug)}
								{@const n = dishes(c)}
								<li>
									<a
										href="{base}/chapter/{c.slug}"
										class:on={active === c.slug}
										class:nested={ctry.country !== null}
										class:empty={n === 0}
									>
										<span class="nm">{c.name}</span>
										<!-- The count is the row's whole claim, so it carries the
										     screen-reader wording rather than sitting as a bare
										     numeral next to a chapter name. -->
										<span class="ct">{n}</span>
										<span class="sr">{n === 1 ? 'dish' : 'dishes'}</span>
									</a>
								</li>
							{/each}
						{/each}
					</ul>
				{/if}
			</li>
		{/each}
	</ul>
</nav>

<style>
	/* The country line is a label, not a link: it names the second level
	   without adding another thing to click in a rail that is already deep. */
	.cntry {
		padding: 0.55rem 0 0.15rem 0.1rem;
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.55;
	}
	.sub a.nested {
		padding-left: 0.85rem;
	}
	.gct {
		margin-left: auto;
		padding-right: 0.5rem;
		font-size: 0.72rem;
		opacity: 0.5;
		font-variant-numeric: tabular-nums;
	}
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

	/* Same shape as the helper in menu/costing and menu/waste. */
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}

	/* A chapter the current filter empties. It stays a link, because jumping to
	   a chapter is a reasonable way to start again, but it should not look like
	   somewhere with food in it. Opacity only: the count beside it already says
	   0, so this is reinforcement and never the sole carrier of the fact. */
	.rail a.empty {
		opacity: 0.42;
	}
	.rail a.empty:hover,
	.rail a.empty:focus-visible {
		opacity: 1;
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
