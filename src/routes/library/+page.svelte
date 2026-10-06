<!--
  Library (docs/consolidation-design.md 2.6 and 3.9): reading only. Anything
  that tests you is under Quizzes, anything you flip under Flashcards; every
  shelf here is a page that reads.

  Each row opens a shelf, filtered to the chosen level by the query that
  shelf already reads (?diff= on the recipes, ?level= on the Lexicon and the
  techniques), with its count at the level where the data gives one. The
  chapters are a closed disclosure on this page itself, every chapter by
  name with its dish count, because on a phone the recipes' cuisine rail sits
  under the dishes and 171 chapters would otherwise have no door. Then the
  house's videos, each a link out that needs a connection, and last the door
  to the house's producers when it has any.

  Nothing new is fetched: the levels file and the house are already read,
  and the chapter index ships with the recipes' own eager index.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { chapters, recipes, TOTALS } from '$lib/data';
	import { house } from '$lib/stores/house.svelte';
	import { levels } from '$lib/stores/levels.svelte';
	import { today } from '$lib/stores/today.svelte';
	import { nav, restoreScroll } from '$lib/stores/nav.svelte';
	import { producersLine, say, studyVideos } from '$lib/study';
	import { LEVEL_KEYS } from '$lib/levels';
	import ScopeChip from '$lib/components/ScopeChip.svelte';
	import VideoList from '$lib/components/VideoList.svelte';
	import type { DeckLevel } from '$lib/types';
	import type { Snapshot } from './$types';

	let { data } = $props();

	let mounted = $state(false);
	let all = $state(false);
	let chaptersOpen = $state(false);
	/** chapter slug -> dish count, from the eager index, built once on mount */
	let dishesIn = $state<Record<string, number>>({});

	onMount(() => {
		mounted = true;
		today.load();
		void levels.load();
		const counts: Record<string, number> = {};
		for (const r of recipes) counts[r.chapterSlug] = (counts[r.chapterSlug] ?? 0) + 1;
		dishesIn = counts;
	});

	afterNavigate(() => {
		all = new URLSearchParams(location.search).get('all') === '1';
	});

	const chosen = $derived<DeckLevel>(mounted ? levels.chosen : 1);
	const nameOf = (n: DeckLevel) => data.levelInfo.find((l) => l.level === n)?.name ?? '';
	const levelName = $derived(nameOf(chosen));
	const difficulty = $derived(chosen === 1 ? 1 : chosen === 2 ? 2 : 3);
	const atLevel = (key: 'lexicon' | 'techniques' | 'plates') => levels.data?.items[key]?.[String(chosen)]?.length ?? null;
	const recipeCount = $derived(all ? TOTALS.recipes : recipes.filter((r) => r.difficulty === difficulty).length);
	const current = $derived(house.current);
	const videoGroups = $derived(current ? studyVideos(current) : []);
	const producersCount = $derived(current ? producersLine(current) : '');
	const listed = $derived(chapters.filter((c) => (dishesIn[c.slug] ?? 0) > 0));

	function setAll(v: boolean) {
		all = v;
		nav.replaceShallow(`${base}/library${v ? '?all=1' : ''}`, { ...((page.state ?? {}) as App.PageState) });
	}

	const count = (n: number | null, noun: string) => (n === null ? '' : `${n} ${noun}${all ? '' : ` at ${levelName}`}.`);

	export const snapshot: Snapshot<{ y: number; open: boolean }> = {
		capture: () => ({ y: typeof window === 'undefined' ? 0 : window.scrollY, open: chaptersOpen }),
		restore: (v) => {
			chaptersOpen = !!v.open;
			restoreScroll(v.y ?? 0, () => !!levels.data && today.houseSettled);
		}
	};
</script>

<svelte:head><title>Library · The World Table</title></svelte:head>

<div class="shell hub library">
	<h1 tabindex="-1">Library</h1>
	<ScopeChip names={nameOf} {chosen} {all} onAll={setAll} onChoose={(n) => levels.choose(n)} />
	<p class="note libline">{all ? 'Reading for every level. Nothing here is graded.' : `Reading for ${levelName}. Nothing here is graded.`}</p>

	<nav class="quiet shelves" aria-label="The shelves">
		<!-- The owner, 5 Oct 2026: the World Atlas of Recipes and the Lexicon are the first two shelves. -->
		<a class="door" href={all ? `${base}/recipes` : `${base}/recipes?diff=${difficulty}`}>
			<span class="door-name">The World Atlas of Recipes</span>
			<span class="door-line">{recipeCount} recipes from every region of the world{all ? `, in ${TOTALS.chapters} chapters.` : `, the difficulty ${levelName} cooks at.`}</span>
		</a>
		<a class="door" href={all ? `${base}/lexicon` : `${base}/lexicon?level=${chosen}`}>
			<span class="door-name">The Lexicon</span>
			<span class="door-line">{all ? `${TOTALS.lexicon} terms.` : count(atLevel('lexicon'), 'terms')}</span>
		</a>
		{#if all}
			{#each LEVEL_KEYS as n (n)}
				<a class="door" href="{base}/level/{n}/read"><span class="door-name">What {nameOf(n)} asks</span><span class="door-line">The readers for {nameOf(n)}, one per subject.</span></a>
			{/each}
		{:else}
			<a class="door" href="{base}/level/{chosen}/read"><span class="door-name">What {levelName} asks</span><span class="door-line">The readers for {levelName}, one per subject.</span></a>
		{/if}
		<details class="door chapters" bind:open={chaptersOpen}>
			<summary><span class="door-name">Chapters</span><span class="door-line">{chaptersOpen ? 'Hide the chapters' : 'Show the chapters'}</span></summary>
			<ul class="chapterlist">
				{#each listed as c (c.slug)}
					<li><a href="{base}/chapter/{c.slug}">{c.name}</a> <span class="n">{dishesIn[c.slug]} {dishesIn[c.slug] === 1 ? 'dish' : 'dishes'}</span></li>
				{/each}
			</ul>
		</details>
		<a class="door" href="{base}/study"><span class="door-name">The Path of Study</span><span class="door-line">Ten semesters, from the first omelette to the restaurateur's capstone.</span></a>
		<a class="door" href="{base}/family"><span class="door-name">The Family Chapter</span><span class="door-line">Your own recipes, kept on this device.</span></a>
		<a class="door" href={all ? `${base}/technique` : `${base}/technique?level=${chosen}`}>
			<span class="door-name">Techniques</span>
			<span class="door-line">{all ? 'Every technique, with the dishes that drill it.' : count(atLevel('techniques'), 'techniques')}</span>
		</a>
		<a class="door" href="{base}/pantry"><span class="door-name">The pantry</span><span class="door-line">What is in season, and what you can cook from what you have.</span></a>
		<a class="door" href="{base}/plates"><span class="door-name">The Plates</span><span class="door-line">{all ? 'Twenty illustrated folios, read and never graded.' : count(atLevel('plates'), 'plates') || 'Twenty illustrated folios, read and never graded.'}</span></a>
		<a class="door" href="{base}/service"><span class="door-name">Service</span><span class="door-line">The service track: the words of the floor, module by module.</span></a>
		<a class="door" href="{base}/palate"><span class="door-name">The repair table</span><span class="door-line">Too flat, too salty, too sweet: the levers, gentlest first.</span></a>
		<a class="door" href="{base}/safety"><span class="door-name">Food safety</span><span class="door-line">The numbers and the disciplines the guide states, and its gaps.</span></a>
	</nav>

	<h2 class="group" id="videos-h">Videos</h2>
	<p class="note">Each video opens in a new tab and needs a connection.</p>
	{#if !today.houseSettled}
		<p class="note">Opening the house…</p>
	{:else if !videoGroups.length}
		<p class="note">No videos for this restaurant yet.</p>
	{:else}
		{#each videoGroups as g, gi (g.topic)}
			<section class="vgroup" aria-labelledby="lv-{gi}">
				<h3 class="vtopic" id="lv-{gi}">{g.topic} · {g.rows.length}</h3>
				<VideoList rows={g.rows} showFor onOpen={(id) => goto(`${base}/menu#${id}`)} />
			</section>
		{/each}
	{/if}

	{#if producersCount}
		<!-- The house's producers, read and never graded: the Producers view inside My Menu. -->
		<nav class="quiet shelves" aria-label="The producers">
			<a class="door" href="{base}/menu?view=producers" data-door="producers">
				<span class="door-name">{say('producers')}</span>
				<span class="door-line">{producersCount}</span>
			</a>
		</nav>
	{/if}
</div>

<style>
	.libline {
		font-size: var(--t-body);
	}
	details.door {
		cursor: default;
	}
	details.door > summary {
		display: flex;
		flex-direction: column;
		gap: 6px;
		cursor: pointer;
		list-style: none;
		min-height: 44px;
	}
	details.door > summary::-webkit-details-marker {
		display: none;
	}
	.chapterlist {
		list-style: none;
		margin: 10px 0 0;
		padding: 0;
		columns: 2;
		column-gap: 18px;
	}
	.chapterlist li {
		break-inside: avoid;
		font-size: 1rem;
		line-height: 1.35;
	}
	.chapterlist a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		color: var(--ink);
	}
	.chapterlist .n {
		color: var(--ink-soft);
		margin-left: 4px;
	}
	.vtopic {
		font-family: var(--display);
		font-size: 1.125rem;
		margin: 16px 0 4px;
	}
	@media (max-width: 599px) {
		.chapterlist {
			columns: 1;
		}
	}
</style>
