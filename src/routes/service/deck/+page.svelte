<!--
  The Floor Deck: the landing. Which sections to study, what is owed today, and
  the doors into the modes.

  The deck loads in the BROWSER, not in a `load` function. A universal load runs
  at prerender and inlines whatever it returns into the page's HTML; three
  hundred cards would put a third of a megabyte into every deck page for a
  reader who came for one section. The page prerenders as its heading and a
  line of copy, and the cards arrive from the precached chunk. Offline it is
  the same read, from the same cache.

  Progress is stated as FACTS (so many of a section seen, so many owed today)
  and never as a score. The written test ends on what was missed and no number,
  by the owner's decision, and the landing says nothing the test refuses to.

  THE LEVEL SWITCH. Four brigade levels and "All levels", nothing locked. It
  opens on the lowest level holding a card the reader has never met
  (firstUnmetLevel), derived from the record on every visit and never stored,
  so it waits for session.ready: a switch that painted on Commis and jumped to
  Sous Chef a moment later would be a switch nobody trusts. The sections below
  it are that level's subsections, counted AT the level. "Only what I missed",
  "keeps slipping" and the look-up stay deck-wide: a miss is owed whatever
  level it sits at. A sitting under a level scope reaches DOWN for what is
  owed, never up (floor-deck.ts pickSession), so the note counts what leads
  the next sitting with owedCount, the same rule, and says when some of the
  day's owed cards sit outside the choice. The study tiles wait for the switch
  too: a link painted before the default would open an unscoped sitting.

  Everything below the h1 sits in exactly ONE <article class="sheet">, as on
  /service/drill (it was the paywall's mask target; the Table is free in full since 2026-09-19).
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { loadFloorDeck } from '$lib/data';
	import { session } from '$lib/stores/session.svelte';
	import {
		cardsInScope,
		dueCount,
		firstUnmetLevel,
		levelProgress,
		liveLevels,
		liveSections,
		owedCount,
		scopeQuery,
		sectionProgress,
		slipping
	} from '$lib/floor-deck';
	import { deckHref } from '$lib/floor-deck-core.mjs';
	import type { DeckLevel, FloorDeck } from '$lib/types';

	let deck = $state<FloorDeck | null>(null);
	let failed = $state(false);
	/** Sections ticked for this visit. Empty means every section. */
	let picked = $state<string[]>([]);
	/** '1'..'4' or 'all'; '' until the record is read. Never stored. */
	let choice = $state('');
	let now = $state(0);

	onMount(async () => {
		now = Date.now();
		try {
			deck = await loadFloorDeck();
		} catch {
			failed = true;
		}
	});

	const sections = $derived(deck ? liveSections(deck) : []);
	const levels = $derived(deck ? liveLevels(deck) : []);

	/* The default, once: the first level with an unmet card, or all of them
	   when every card has been met. A choice the reader makes is never
	   overwritten, because this runs only while nothing is chosen. */
	$effect(() => {
		if (choice || !deck || !session.ready) return;
		const first = firstUnmetLevel(deck, session.drillLog);
		choice = first ? String(first) : 'all';
	});

	const level = $derived<DeckLevel | null>(
		choice && choice !== 'all' ? (levels.find((l) => String(l.level) === choice)?.level ?? null) : null
	);
	const levelName = $derived(levels.find((l) => l.level === level)?.name ?? '');
	const byLevel = $derived(deck && session.ready ? levelProgress(deck, session.drillLog) : []);
	const progress = $derived(deck && session.ready ? sectionProgress(deck, session.drillLog, level) : []);
	const allProgress = $derived(deck && session.ready ? sectionProgress(deck, session.drillLog) : []);
	const owed = $derived(deck && session.ready && now ? dueCount(deck, session.drillLog, now) : 0);
	const seenAny = $derived(allProgress.some((p) => p.seen > 0));
	const stubborn = $derived(deck && session.ready && now ? slipping(deck, session.drillLog, now) : []);
	/* A ticked section with nothing at this level drops out of the links, so a
	   level and a section that share no card never meet in a URL that opens an
	   empty sitting.
	   The tick itself is kept: switching back to a level that has the section
	   brings it back. */
	const live = $derived(picked.filter((k) => progress.find((p) => p.key === k)?.total));
	const query = $derived(scopeQuery(level, live));
	const testQuery = $derived(level ? `?level=${level}` : live.length ? `?section=${live[0]}` : '');
	/* What the next sitting in THIS choice would lead with, by pickSession's own
	   rule (it reaches down a level, never up). `owed` stays deck-wide: it is
	   what the day holds, and it gates the deck-wide misses tile. */
	const owedHere = $derived(
		deck && session.ready && now
			? owedCount(deck, session.drillLog, now, { scope: live.length ? new Set(live) : null, levels: level ? new Set([level]) : null })
			: 0
	);
	const inScope = $derived(
		deck ? cardsInScope(deck, live.length ? new Set(live) : null, level ? new Set([level]) : null).length : 0
	);
	const allSeen = $derived(byLevel.reduce((n, p) => n + p.seen, 0));

	function toggle(key: string) {
		picked = picked.includes(key) ? picked.filter((k) => k !== key) : [...picked, key];
	}
</script>

<svelte:head><title>The Floor Deck · The World Table</title></svelte:head>

<div class="shell view">
	<nav class="crumbs"><a href="{base}/service">Service</a></nav>
	<h1>The Floor Deck</h1>

	<article class="sheet">
		<p class="lede">
			The words on a menu, one card each: what to say at the table first, then why it is so, what
			it is classically made with, and what it gets mistaken for. Written for a first week on the
			floor.
		</p>

		{#if failed}
			<p class="empty">The deck did not load. Check the connection once; after that it works offline.</p>
		{:else if !deck}
			<p class="empty" aria-live="polite">Opening the deck…</p>
		{:else if !sections.length}
			<p class="empty">The deck is being written. No section is ready to study yet.</p>
		{:else}
			<p class="note" aria-live="polite">
				{#if !session.ready}
					Reading your record…
				{:else if owed && owedHere === owed}
					{owed} card{owed === 1 ? ' is' : 's are'} owed today: what you missed last time, then what has
					come due. They lead the next sitting.
				{:else if owedHere}
					{owed} cards are owed today. The {owedHere === 1 ? 'one' : owedHere} in this choice lead{owedHere === 1
						? 's'
						: ''} the next sitting; choose All levels with no section ticked to take every one.
				{:else if owed}
					{owed} card{owed === 1 ? ' is' : 's are'} owed today, outside this choice. Choose All levels with
					no section ticked to take {owed === 1 ? 'it' : 'them'} first.
				{:else if seenAny}
					Nothing is owed today. A sitting will carry on through the cards you have not met.
				{:else}
					Nothing studied yet. The first sitting starts with {levelName || levels[0]?.name || 'the first level'},
					at the top of the first section.
				{/if}
			</p>

			{#if choice}
				<h2 class="sec" id="levels-h">Level</h2>
				<p class="secnote">
					New cards come a level at a time, every section of one before the next. Nothing is locked:
					open any level, or all of them.
				</p>
				<div class="levels" role="radiogroup" aria-labelledby="levels-h">
					{#each byLevel as l (l.level)}
						<label class:on={choice === String(l.level)}>
							<input
								type="radio"
								name="level"
								value={String(l.level)}
								bind:group={choice}
								aria-label={l.name}
								aria-describedby="lv-{l.level}"
							/>
							<span class="stitle">{l.name}</span>
							<span class="sblurb" id="lv-{l.level}">
								{l.blurb}
								<span class="scount">{l.seen ? `${l.seen} of ${l.total} met` : `${l.total} card${l.total === 1 ? '' : 's'}`}</span>
							</span>
						</label>
					{/each}
					<label class:on={choice === 'all'}>
						<input
							type="radio"
							name="level"
							value="all"
							bind:group={choice}
							aria-label="All levels"
							aria-describedby="lv-all"
						/>
						<span class="stitle">All levels</span>
						<span class="sblurb" id="lv-all">
							The whole deck, still a level at a time.
							<span class="scount">{allSeen ? `${allSeen} of ${deck.cards.length} met` : `${deck.cards.length} cards`}</span>
						</span>
					</label>
				</div>

				<h2 class="sec">Sections</h2>
				<p class="secnote">
					{#if level}
						The counts are the {levelName} cards in each. Tick sections to study only those, or leave them
						all clear for the whole level.
					{:else}
						Tick sections to study only those, or leave them all clear to work through the deck in order.
					{/if}
				</p>
				<ul class="sections">
					{#each sections as s (s.key)}
						{@const p = progress.find((x) => x.key === s.key)}
						{@const none = !p?.total}
						<li>
							<label class:on={picked.includes(s.key) && !none} class:none>
								<input
									type="checkbox"
									checked={picked.includes(s.key) && !none}
									disabled={none}
									onchange={() => toggle(s.key)}
								/>
								<span class="stitle">{s.title}</span>
								<span class="sblurb">{s.blurb}</span>
								<span class="scount">
									{#if none}None at this level{:else if p && p.seen}{p.seen} of {p.total} met{:else}{p?.total ?? s.count} card{(p?.total ?? s.count) === 1 ? '' : 's'}{/if}
								</span>
							</label>
						</li>
					{/each}
				</ul>
			{/if}

			{#if choice}
			<h2 class="sec">Study</h2>
			<ul class="tiles">
				<li>
					<a href="{base}/service/deck/study{query}">
						<h3>Flip cards</h3>
						<p>
							A sitting of up to twenty from {inScope} card{inScope === 1 ? '' : 's'}. Say it to
							yourself, turn the card, and be honest about whether you had it.
						</p>
					</a>
				</li>
				{#if owed}
					<li>
						<a href="{base}/service/deck/study?focus=misses">
							<h3>Only what I missed</h3>
							<p>The cards still owed from a miss, most recent first, and nothing else.</p>
						</a>
					</li>
				{/if}
				<li>
					<a href="{base}/service/deck/test{testQuery}">
						<h3>The written test</h3>
						<p>
							A whole level or one section, answered cold. It ends on what you missed and the cards
							to read, never on a number.
						</p>
					</a>
				</li>
				<li>
					<a href="{base}/service/deck/say{query}">
						<h3>Say it back</h3>
						<p>
							The way a guest asks it: the description with the word taken out, or a line from a
							menu. You say it before you see any choices.
						</p>
					</a>
				</li>
				<li>
					<a href="{base}/service/deck/lineup{query}">
						<h3>Lineup</h3>
						<p>
							For pre-shift. One term fills the screen, the room answers aloud, you tap whether
							they had it. Nobody's name is kept.
						</p>
					</a>
				</li>
			</ul>
			{/if}

			{#if stubborn.length}
				<h2 class="sec">The terms that keep slipping</h2>
				<p class="secnote">Missed three times or more. Worth reading slowly, once, with the why open.</p>
				<p class="termlist">
					{#each stubborn as c (c.id)}<a href={deckHref(base, c)}>{c.term}</a>{/each}
				</p>
			{/if}

			<details class="index">
				<summary>Look up a card</summary>
				{#each sections as s (s.key)}
					<h3 class="ixhead">{s.title}</h3>
					<p class="termlist">
						{#each deck.cards.filter((c) => c.section === s.key) as c (c.id)}
							<a href={deckHref(base, c)}>{c.term}</a>
						{/each}
					</p>
				{/each}
			</details>
		{/if}
	</article>
</div>

<style>
	/* padding-BLOCK, deliberately: the shorthand zeroes padding-inline and
	   out-specifies the global .shell gutter. See /menu/quiz. */
	.view { padding-block: 26px 80px; max-width: 820px; }
	.crumbs { font-size: var(--t-micro); margin-bottom: 14px; }
	.crumbs a { color: var(--muted); text-decoration: none; }
	.crumbs a:hover { color: inherit; }
	h1 { font-size: var(--t-h1); margin-bottom: 8px; }
	.lede { font-size: var(--t-lede); color: var(--ink-soft); max-width: var(--measure); margin-bottom: 14px; }
	.note { color: var(--ink-soft); max-width: var(--measure); }
	.empty { padding: 32px 0; color: var(--muted); font-style: italic; }
	.sec {
		font-family: var(--text); font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase; color: var(--muted); border-bottom: 1px solid var(--line);
		padding-bottom: 5px; margin: 30px 0 12px; font-weight: 500;
	}
	.secnote { color: var(--ink-soft); max-width: var(--measure); font-size: var(--t-small); margin-bottom: 12px; }

	.sections, .levels { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
	.sections label, .levels label {
		display: grid; grid-template-columns: auto 1fr auto; gap: 2px 12px; align-items: baseline;
		min-height: 44px; padding: 10px 14px; border: 1px solid var(--line); border-radius: var(--radius);
		background: var(--card, transparent); cursor: pointer;
	}
	.sections label:hover, .sections label.on, .levels label:hover, .levels label.on { border-color: var(--turmeric-deep); }
	.sections input, .levels input { grid-row: 1 / span 2; align-self: center; width: 18px; height: 18px; accent-color: var(--turmeric-deep); }
	/* the count sits inside the blurb on a level, so it is read with it */
	.levels .scount { display: block; margin-top: 2px; }
	/* muted, not hidden: the list keeps its shape as the level changes */
	.sections label.none { cursor: default; color: var(--muted); }
	.sections label.none:hover { border-color: var(--line); }
	.stitle { font-family: var(--display); font-size: 18px; }
	.sblurb { grid-column: 2 / span 2; color: var(--ink-soft); font-size: var(--t-small); line-height: 1.5; }
	.scount { font-size: var(--t-micro); color: var(--muted); white-space: nowrap; }
	/* Pinned to the top-right cell. Left to auto-placement it fell into a third
	   row, in the checkbox's column, and widened that column by its own text, so
	   every row's title started at a different indent on a phone. */
	.sections .scount { grid-column: 3; grid-row: 1; justify-self: end; }

	.tiles { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--gap); }
	.tiles a {
		display: block; height: 100%; padding: 15px 17px; border: 1px solid var(--line);
		border-radius: var(--radius); background: var(--card, transparent); color: var(--ink); text-decoration: none;
	}
	.tiles a:hover { border-color: var(--turmeric-deep); }
	.tiles h3 { font-family: var(--display); font-size: 18px; margin-bottom: 5px; }
	.tiles p { color: var(--ink-soft); font-size: var(--t-small); line-height: 1.5; }

	.termlist { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: var(--t-small); }
	.termlist a { color: inherit; min-height: 28px; display: inline-flex; align-items: center; }
	.index { margin-top: 30px; border-top: 1px solid var(--line); }
	.index summary {
		cursor: pointer; min-height: 44px; display: flex; align-items: center;
		font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; color: var(--ink-soft);
	}
	.ixhead { font-family: var(--display); font-size: 16px; margin: 14px 0 6px; }
</style>
