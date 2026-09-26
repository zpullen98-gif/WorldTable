<!--
  The home: four level cards and one quiet row of four doors. Nothing else.

  The World Table's home was a long scroll of bands (Today, Learn, Practise,
  Record, the library) with fifteen doors, and it looked nothing like the
  Codex's or the Ledger's. The owner's decision (2026-09-26): one cohesive
  home in all three apps, four levels as the spine, each level the same
  subsections at that level's difficulty, training from there. This is the
  contract the three share, identical markup and words; only the CSS is the
  Table's own.

    <section class="levels">   four <a class="level"> cards, I to IV, each with
                               its name and its word and figure (Untouched,
                               N% met, Met); the current one carries `on`,
                               aria-current and the words "Your level"
    <nav class="quiet">        Today, Library, Record, Mine · My Menu

  No heading below the masthead's h1: the cards and the doors are links, and
  the regression suite holds the page to no h2 and no h3.

  The word and the figure paint only once the levels file and the record are
  both in (levels.ready): four cards saying Untouched to a ten-year cook for
  a second on every open would be the wrong thing to say first. The names
  and blurbs arrive baked in from the page's load, so the cards themselves
  never wait.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { bySlug, TOTALS } from '$lib/data';
	import { session } from '$lib/stores/session.svelte';
	import { house } from '$lib/stores/house.svelte';
	import { levels } from '$lib/stores/levels.svelte';
	import { LEVEL_KEYS, NUMERAL, todayFromLevel, type TodayLine } from '$lib/levels';
	import { deskShare, readDeskInbox } from '$lib/desk/desk-inbox';
	import { readInName, whenRead } from '$lib/desk/desk-share';
	import type { DeckLevel, LevelInfo } from '$lib/types';

	interface Props {
		/** The course's dish slugs, in teaching order, from study.json. */
		curriculum?: string[];
		/** The four levels' names and blurbs, baked at prerender so the cards
		 *  paint before any file loads. */
		levelInfo?: LevelInfo[];
	}
	let { curriculum = [], levelInfo = [] }: Props = $props();

	/* ---- the Menu Desk's share ---------------------------------------------
	 * Read in onMount and nowhere earlier: the inbox is localStorage, there is
	 * none in the prerender pass, and a draft another room left is only worth
	 * one line on Today when there is one. The door is the desk's own anchor
	 * on My Menu. The line keeps its class, copy and link: tests/menu-desk.spec.ts
	 * reads it. */
	let deskWaiting = $state<{ dishes: number; readIn: string; when: string } | null>(null);
	let now = $state(0);

	onMount(() => {
		now = Date.now();
		void levels.load();
		const inbox = readDeskInbox();
		if (inbox) {
			const share = deskShare(inbox, 'dish');
			if (share.length) {
				deskWaiting = {
					dishes: share.length,
					readIn: readInName(inbox.source.readIn),
					when: whenRead(inbox.source.at)
				};
			}
		}
	});

	const rows = $derived(levels.progress);
	const ready = $derived(levels.ready && rows.length === LEVEL_KEYS.length);
	const current = $derived(levels.current);

	const nameOf = (n: DeckLevel) =>
		levelInfo.find((l) => l.level === n)?.name ?? levels.data?.levels.find((l) => l.level === n)?.name ?? '';

	/* One item, never a queue: lib/levels.ts todayFromLevel decides it from the
	   lowest unmet level and everything touched. */
	const today = $derived.by<TodayLine | null>(() => {
		if (!ready || !levels.data || !now) return null;
		return todayFromLevel(levels.data, rows, levels.logs, { dish: (slug) => bySlug.get(slug)?.name ?? slug }, now, base);
	});

	/* Distinct dishes, not log entries: the log counts COOKS. */
	const cookedDishes = $derived(session.cookedDishes);
	const courseDone = $derived(curriculum.filter((slug) => cookedDishes.has(slug)).length);
	const cooked = $derived(cookedDishes.size);
	const pct = $derived(curriculum.length ? Math.round((courseDone / curriculum.length) * 100) : 0);
	const dishes = $derived(house.dishes.length);
</script>

<div class="home">
	<section class="levels" aria-label="Levels">
		{#each LEVEL_KEYS as n (n)}
			{@const row = rows.find((r) => r.level === n)}
			{@const on = ready && current === n}
			<a
				class="level"
				class:on
				href="{base}/level/{n}"
				data-level={n}
				aria-current={on ? 'step' : undefined}
			>
				<!-- no numeral on the card (the owner, 26 Sep 2026); the words stay
				     for a screen reader, because the Today door, the level page and
				     its test all name the level as "Level I" -->
				<span class="sr-only">Level {NUMERAL[n]}</span>
				<span class="lv-name">{nameOf(n)}</span>
				<span class="lv-stat">{ready && row ? row.label : ''}</span>
				{#if on}<span class="lv-here">Your level</span>{/if}
			</a>
		{/each}
	</section>

	<nav class="quiet" aria-label="Doors">
		<a class="door" href={today?.href ?? `${base}/level/${current}`}>
			<span class="door-name">Today</span>
			<span class="door-line">{today ? today.line : 'Reading your record…'}</span>
			<span class="door-sub">{today ? today.sub : ''}</span>
		</a>
		{#if deskWaiting}
			<!-- One line, only while another room's read is waiting for this one. -->
			<p class="deskline">
				<b
					>{deskWaiting.dishes}
					{deskWaiting.dishes === 1 ? 'dish' : 'dishes'} from the Menu Desk
					{deskWaiting.dishes === 1 ? 'is' : 'are'} waiting.</b
				>
				Read {deskWaiting.readIn}, {deskWaiting.when}.
				<a class="chip" href="{base}/menu#desk">Look them over</a>
			</p>
		{/if}
		<a class="door" href="{base}/recipes">
			<span class="door-name">Library</span>
			<span class="door-line">{TOTALS.recipes} recipes in {TOTALS.chapters} chapters, and the Lexicon.</span>
		</a>
		<a class="door" href="{base}/repertoire">
			<span class="door-name">Record</span>
			<span class="meter" aria-hidden="true"><span class="meter-fill" style="width:{pct}%"></span></span>
			<span class="door-line">{courseDone} of {curriculum.length} cooked, {cooked} dish{cooked === 1 ? '' : 'es'} in all.</span>
		</a>
		<a class="door" href="{base}/menu">
			<span class="door-name">Mine · My Menu</span>
			<span class="door-line">{dishes} dish{dishes === 1 ? '' : 'es'} on the house menu.</span>
		</a>
	</nav>
</div>

<style>
	.home {
		max-width: 1200px;
		margin: 0 auto;
		padding-inline: 20px;
	}

	/* ---- the four cards ---------------------------------------------------- */
	.levels {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: var(--gap);
		margin-top: 6px;
	}
	.level {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-height: 44px;
		padding: 16px 16px 14px;
		border: var(--rule) solid var(--line);
		border-radius: var(--radius);
		background: var(--card);
		color: var(--ink);
		text-decoration: none;
		box-shadow: var(--shadow-card);
	}
	.level:hover {
		border-color: var(--turmeric-deep);
	}
	.level:focus-visible {
		outline: 2px solid var(--turmeric-deep);
		outline-offset: 2px;
	}
	/* The current card: a second border AND the words "Your level", never the
	   colour alone. */
	.level.on {
		border-color: var(--turmeric-deep);
		box-shadow: inset 0 0 0 1px var(--turmeric-deep), var(--shadow-card);
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
	.lv-name {
		font-family: var(--display);
		font-size: var(--t-h4);
		line-height: 1.2;
	}
	.lv-stat {
		min-height: 1.3em;
		font-size: var(--t-small);
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.lv-here {
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--turmeric-deep);
	}

	/* ---- the quiet row ----------------------------------------------------- */
	.quiet {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: var(--gap);
		margin-top: var(--gap);
	}
	.door {
		display: flex;
		flex-direction: column;
		gap: 5px;
		min-height: 44px;
		padding: 14px 16px;
		border: var(--rule) solid var(--line);
		border-radius: var(--radius);
		background: var(--card);
		color: var(--ink);
		text-decoration: none;
	}
	.door:hover {
		border-color: var(--turmeric-deep);
	}
	.door:focus-visible {
		outline: 2px solid var(--turmeric-deep);
		outline-offset: 2px;
	}
	.door-name {
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
	}
	.door-line {
		font-size: var(--t-body);
		line-height: 1.45;
	}
	.door-sub {
		font-size: var(--t-small);
		color: var(--ink-soft);
		line-height: 1.4;
		min-height: 1.3em;
	}
	.meter {
		display: block;
		height: 4px;
		background: var(--line);
		border-radius: 2px;
		overflow: hidden;
	}
	.meter-fill {
		display: block;
		height: 100%;
		background: var(--turmeric-deep);
	}
	/* The desk's line spans the row and keeps its chip sized for a thumb. */
	.deskline {
		grid-column: 1 / -1;
		margin: 0;
		font-size: var(--t-small);
		color: var(--ink-soft);
	}
	.deskline a {
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		margin-left: 4px;
	}
</style>
