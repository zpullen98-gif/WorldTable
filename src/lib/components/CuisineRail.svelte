<script lang="ts">
	import { untrack } from 'svelte';
	import { base } from '$app/paths';
	import type { ChapterRef } from '$lib/types';

	let {
		chapters,
		active = null,
		counts = null,
		search = ''
	}: {
		chapters: ChapterRef[];
		active?: string | null;
		counts?: Map<string, number> | null;
		/**
		 * The current filters as a query string, carried on every row. The counts
		 * below ALREADY reflect the active filters, so a row reading "Italian 10"
		 * under Vegetarian promises ten vegetarian Italian dishes - and delivered
		 * sixty-one, because the link dropped the query. (Chapter-to-chapter hops
		 * happened to keep it, purely because SvelteKit reuses the page node on a
		 * same-route hop and the component's state survived.)
		 */
		search?: string;
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
	// /chapter/vermont arrives with the GROUP already expanded - "United
	// States", not the "New England" subgroup this comment used to name.
	// Subgroups have no collapse control of their own; every one renders
	// under whichever group is open.
	let open = $state(new Set<string>(['Europe']));

	/*
	 * READS `open` untracked. It used to read it tracked, which means this
	 * effect was in its own dependency list: toggle() reassigning `open`
	 * re-ran this effect, which immediately re-added the active chapter's
	 * group before the next paint. The tap did nothing - not a visible
	 * bounce, since the re-add happens in the same flush, before paint, but
	 * `aria-expanded` never left "true" and the header stayed inert. Measured
	 * on all 171 chapter pages: the active chapter's own group can never be
	 * collapsed; every OTHER group collapses normally, which is what hid it.
	 *
	 * untrack() keeps the read from re-arming the effect, so it fires only
	 * when `active` (or `chapters`) actually changes - once per navigation,
	 * as intended - and a deliberate collapse of the active group sticks.
	 */
	$effect(() => {
		if (!active) return;
		const g = chapters.find((c) => c.slug === active)?.group;
		if (g && !untrack(() => open).has(g)) {
			open = new Set([...untrack(() => open), g]);
		}
	});

	function toggle(group: string) {
		const next = new Set(open);
		if (next.has(group)) next.delete(group);
		else next.add(group);
		open = next;
	}

	/* A row stays a link even at 0, on purpose: a row reading 0 has already
	   said what is there, and landing on it now reaches the empty state, which
	   names the filter and offers Drop and Clear. "Start again" is that control,
	   not a silent reset. See dishes() above for the count itself. */
</script>

<nav class="rail" aria-label="Chapters">
	<h2 class="eyebrow">Chapters</h2>
	<ul>
		<li>
			<a class="all" class:on={!active} href="{base}/recipes{search}">All chapters</a>
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
					<!-- Same reason as the leaf count's .sr below: this is the ONE
					     number a collapsed group shows, and a bare numeral in the
					     button's own name reads as "Europe 346" with no unit. -->
					<span class="sr">{g.total === 1 ? 'dish' : 'dishes'}</span>
					<span class="caret" aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
				</button>
				{#if isOpen}
					<ul class="sub">
						{#each g.countries as ctry (ctry.country ?? '_')}
							{#if ctry.country && ctry.chapters.length > 1}
								<!-- A country with more than one chapter is a real grouping a
								     screen reader cannot reconstruct from the chapter names
								     alone ("Alabama" says nothing about The South) - unlike the
								     single-chapter case below, where the label is the chapter's
								     own adjectival form ("Austria" / "Austrian") and hiding it
								     loses nothing. Nested and labelled, not just un-hidden: a
								     flat aria-hidden removal would still leave the chapters as
								     unrelated siblings with no group at all. -->
								{@const groupId = `cntry-${g.group}-${ctry.country}`}
								<li class="cntry-group">
									<span class="cntry" id={groupId}>{ctry.country}</span>
									<ul class="cntrygrp" aria-labelledby={groupId}>
										{#each ctry.chapters as c (c.slug)}
											{@const n = dishes(c)}
											<li>
												<a
													href="{base}/chapter/{c.slug}{search}"
													class:on={active === c.slug}
													class:nested={true}
													class:empty={n === 0}
												>
													<span class="nm">{c.name}</span>
													<span class="ct">{n}</span>
													<span class="sr">{n === 1 ? 'dish' : 'dishes'}</span>
												</a>
											</li>
										{/each}
									</ul>
								</li>
							{:else}
								{#if ctry.country}
									<li class="cntry" aria-hidden="true">{ctry.country}</li>
								{/if}
								{#each ctry.chapters as c (c.slug)}
									{@const n = dishes(c)}
									<li>
										<a
											href="{base}/chapter/{c.slug}{search}"
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
							{/if}
						{/each}
					</ul>
				{/if}
			</li>
		{/each}
	</ul>
</nav>

<style>
	/* The country line is a label, not a link: it names the second level
	   without adding another thing to click in a rail that is already deep.
	   `display: block` because this class sits on an <li> in the flat,
	   single-chapter case and a <span> labelling a nested <ul> in the
	   grouped case - the span needs it to take the same padded row shape
	   the li gets for free.
	   color, not opacity: 0.55 on --ink measured 3.66:1 in day service,
	   below the 4.5:1 AA floor for 11.5px text. --muted is a real token
	   already at AA in both services (4.55:1 day, 5.70:1 night), not a
	   diluted version of --ink that drifts with whatever it sits on. */
	.cntry {
		display: block;
		padding: 0.55rem 0 0.15rem 0.1rem;
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.cntry-group {
		list-style: none;
	}
	/* A nested <ul> inside .sub needs its own reset: the browser default
	   margin and list padding would indent a grouped country's chapters
	   differently from the flat single-chapter siblings beside them. */
	.cntrygrp {
		margin: 0;
		padding: 0;
	}
	.sub a.nested {
		padding-left: 0.85rem;
	}
	/* color, not opacity: 0.5 inherited --turmeric-deep from .rghead and
	   measured 3.15:1 night / 2.15:1 day, well under the 4.5:1 AA floor -
	   worse than the .empty row this file already had a comment about.
	   --muted matches the leaf count's own color, so a collapsed group's
	   total and an open group's per-chapter counts read as the same kind
	   of number. Explicit rather than inherited, so editing .rghead's
	   color (the group NAME) can never drag this along with it again. */
	.gct {
		margin-left: auto;
		padding-right: 0.5rem;
		font-size: 0.72rem;
		color: var(--muted);
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
	   somewhere with food in it. The count beside it already says 0, so this is
	   reinforcement and never the sole carrier of the fact - which is also why
	   it dims only .nm and leaves .ct alone: .ct's own color is already --muted,
	   sitting at the 4.5:1 AA floor in day service with a 0.05 margin, and any
	   opacity multiplier on top of that fails. A whole-link `opacity: 0.42` used
	   to dim both together, measuring 1.72:1 on the count in day service - the
	   one number this row exists to show. */
	.rail a.empty .nm {
		color: var(--muted);
	}
	.rail a.empty:hover .nm,
	.rail a.empty:focus-visible .nm {
		color: var(--ink);
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
