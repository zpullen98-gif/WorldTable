<!--
  The study view of My Menu: what the page shows when a house is current and
  Edit is off (docs/study-menus-design.md, 2.1 and 2.2). A short header, a
  sticky bar with the search and one row of section chips, then the dishes
  as compact rows, each one button that opens its card.

  The art is the Table's: parchment tokens, the display face for names, the
  eyebrow for section heads, the page's chip for every chip. Only layout and
  hierarchy are new. Every control is at least 44px tall, every state is a
  word (Signature, 86, Again, the chosen chip's aria-pressed and its count),
  and nothing here draws an allergen.

  The page owns the state (query, section, meal) so its snapshot can bring
  it back after the round trip to the flash cards; this component draws it
  and reports presses.

  THE TASTING MENUS come first, as their own block (TastingMenu.svelte):
  each menu a separate card, its courses in printed order. The dishes only
  a tasting serves (study.ts tastingOnlyIds) are left out of the rows and
  open from their course; a search still finds them. The Tasting menus chip
  shows the block alone, any other section chip hides it, and the meal
  filter keeps the menus served at that meal.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import type { Snippet } from 'svelte';
	import type { House } from '$lib/house/house-schema';
	import TeachingFolioCollection from './TeachingFolioCollection.svelte';
	import TastingMenu from './TastingMenu.svelte';
	import { BRENNANS_HOUSE_ID } from '$lib/teaching-folios';
	import {
		inMeal,
		mealsOf,
		readOnWords,
		say,
		searchElsewhere,
		searchRows,
		studyProgress,
		studyRows,
		studySections,
		findItem,
		studyVideos,
		tastingOnlyIds,
		tastingSection,
		tastingsShown,
		type StudyRow,
		type Verdict
	} from '$lib/study';
	import VideoList from './VideoList.svelte';
	import { roomHref, roomListHref, ROOM_NAMES } from '$lib/wing-links';

	let {
		current,
		latest,
		query = $bindable(''),
		section = $bindable(''),
		meal = $bindable(''),
		is86 = () => false,
		canLink = false,
		onOpen,
		onEdit,
		showEdit = true,
		onCards,
		footer
	}: {
		current: House;
		latest: ReadonlyMap<string, Verdict>;
		query?: string;
		section?: string;
		meal?: string;
		is86?: (id: string) => boolean;
		/** The network is up or the room is installed: cross-room links may be drawn (wing-links.ts, rule 3). */
		canLink?: boolean;
		/** Open a card: its id, the rows it walks, and, from a tasting, the selector that finds the button again. */
		onOpen: (id: string, list: readonly StudyRow[], from?: string) => void;
		onEdit: () => void;
		/** False when the page draws the switch on its own h1 line (the Table's /menu does). */
		showEdit?: boolean;
		/** Go to the flash cards or a drill: the query string for /menu/quiz. */
		onCards: (search: string) => void;
		footer?: Snippet;
	} = $props();

	const allRows = $derived(studyRows(current, 'dish'));
	const meals = $derived(
		mealsOf(current).filter((m) => current.dishes.some((d) => (d.meals ?? []).includes(m)))
	);
	const mealRows = $derived(
		allRows.filter((r) => {
			const it = findItem(current, r.id);
			return it ? inMeal(it, meal) : true;
		})
	);
	/* The tasting menus at this meal, and the dishes only a tasting serves, which open from their course. */
	const tastOnly = $derived(tastingOnlyIds(current));
	const tastKey = $derived(tastingSection(current));
	const menus = $derived(tastingsShown(current, meal));
	const onTastings = $derived(!!tastKey && section === tastKey);
	const listRows = $derived(mealRows.filter((r) => !tastOnly.has(r.id)));
	const found = $derived(searchRows(current, query.trim() ? mealRows : listRows, query));
	const chips = $derived(studySections(listRows));
	const shown = $derived(onTastings && !query.trim() ? [] : section ? found.filter((r) => r.section === section) : found);
	const showMenus = $derived(menus.length > 0 && !query.trim() && (!section || onTastings));
	const grouped = $derived(studySections(shown).map((s) => ({ ...s, rows: shown.filter((r) => r.section === s.section) })));
	const elsewhere = $derived(query.trim() ? searchElsewhere(current, 'dish', query) : []);
	const progress = $derived(studyProgress(mealRows.map((r) => r.id), latest));
	const againSet = $derived(new Set(progress.againIds));
	const readOn = $derived(readOnWords(current.menusReadOn));

	/* The live region's sentence, in words. */
	const status = $derived.by(() => {
		if (query.trim()) {
			return shown.length
				? say('searchHits', { n: shown.length, query: query.trim() })
				: say('searchNone', { query: query.trim() });
		}
		if (onTastings) return say('showing', { section: say('tastings'), n: menus.length, unit: menus.length === 1 ? 'menu' : 'menus' });
		if (section) return say('showing', { section, n: shown.length, unit: shown.length === 1 ? 'dish' : 'dishes' });
		return '';
	});

	/* A chosen meal that stops holding any dish (another house) goes back to all day. */
	$effect(() => {
		if (meal && !meals.includes(meal)) meal = '';
	});
	/* A chosen section the search or the meal has emptied stays chosen and says so. */

	function pick(s: string) {
		section = s;
	}

	function pickMeal(m: string) {
		meal = m;
		try {
			localStorage.setItem('oot-study-meal-v1', m);
		} catch {
			/* a convenience, never the truth */
		}
	}

	let chipRow: HTMLDivElement | undefined = $state();
	$effect(() => {
		void section;
		/* Sideways inside the row only: scrollIntoView would move the page too. */
		const row = chipRow;
		const el = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
		if (!row || !el) return;
		const left = el.offsetLeft - row.offsetLeft;
		if (left < row.scrollLeft || left + el.offsetWidth > row.scrollLeft + row.clientWidth) row.scrollLeft = Math.max(0, left - 16);
	});

	/* A chosen meal narrows every deck the header deals, not only the rows (1.1). */
	function cards(search: string) {
		onCards(meal ? search + '&meal=' + encodeURIComponent(meal) : search);
	}

	function sectionCards(s: string) {
		cards('mode=cards&section=' + encodeURIComponent(s));
	}

	const drinks = $derived(current.cocktails.length);
	const wines = $derived(current.wines.length);
	const ledgerList = $derived(canLink ? roomListHref('ledger', base) : '');
	const codexList = $derived(canLink ? roomListHref('codex', base) : '');
	const roomOf = (kind: string) => (kind === 'wine' ? 'codex' : 'ledger') as 'codex' | 'ledger';
	/* The Videos entry: every video the house names, by topic, the house's own first. A disclosure at
	   the foot of the list, so the first screen stays the menu's. */
	const videoGroups = $derived(studyVideos(current));
	const videoCount = $derived(videoGroups.reduce((n, g) => n + g.rows.length, 0));
	const openDish = (id: string) => onOpen(id, allRows);
</script>

<section class="study" aria-labelledby="study-h">
	<header class="studyhead">
		<div class="titlerow">
			<h2 id="study-h">{current.name}</h2>
			{#if showEdit}<button class="quiet studyedit" onclick={onEdit}>{say('editOff')}</button>{/if}
		</div>
		<!-- One line of facts with the progress on it: the first screen at 390 by
		     844 is for the menu, not for sentences about it. -->
		<p class="facts">
			{(readOn ? say('read', { date: readOn }) + ' · ' : '') + allRows.length + (allRows.length === 1 ? ' dish' : ' dishes') + ' · '}<span class="progress"
				>{progress.studied ? say('progress', { studied: progress.studied, total: progress.total, got: progress.got, again: progress.again }) : say('progressNone')}</span
			>
		</p>
		{#if meals.length > 1}
			<div class="meals" role="group" aria-label="Which meal">
				<button class="chip" aria-pressed={!meal} onclick={() => pickMeal('')}>{say('allDay')}</button>
				{#each meals as m (m)}
					<button class="chip" aria-pressed={meal === m} onclick={() => pickMeal(m)}>{m}</button>
				{/each}
			</div>
		{/if}
		<div class="actions">
			<button class="chip go" onclick={() => cards('mode=cards')}>{say('cards')}</button>
			{#if progress.againIds.length}
				<button class="chip" onclick={() => cards('mode=cards&deck=weak')}>{say('weak', { n: progress.againIds.length })}</button>
			{/if}
			<button class="chip" onclick={() => cards('mode=drill')}>Drill the menu</button>
		</div>
	</header>

	<div class="bar">
		<label class="find">
			<span class="vh">{say('findDish')}</span>
			<input type="search" bind:value={query} placeholder={say('findDish')} autocomplete="off" />
		</label>
		<div class="chiprow" bind:this={chipRow} role="group" aria-label="Sections">
			<button class="chip sec" aria-pressed={!section} onclick={() => pick('')}>{say('all', { n: mealRows.length })}</button>
			{#if menus.length && tastKey}
				<button class="chip sec" aria-pressed={onTastings} onclick={() => pick(tastKey)}>{say('tastings')} {menus.length}</button>
			{/if}
			{#each chips as c (c.section)}
				<button class="chip sec" aria-pressed={section === c.section} onclick={() => pick(c.section)}>{c.section} {c.count}</button>
			{/each}
		</div>
	</div>
	<p class="vh" aria-live="polite">{status}</p>

	{#if query.trim() && !shown.length}
		<p class="none">{say('searchNone', { query: query.trim() })}</p>
	{/if}

	{#if showMenus}
		<section class="tastings" aria-labelledby="sg-tastings">
			<div class="grouphead">
				<h3 class="eyebrow" id="sg-tastings">{say('tastings')} · {menus.length}</h3>
				<a class="chip small" href="{base}/flashcards?deck=tastings&run=1">{say('cards')}<span class="vh"> for {say('deckTastings')}</span></a>
			</div>
			{#each menus as m (m.id)}
				<TastingMenu {current} menu={m} {is86} onOpen={(id, list, from) => onOpen(id, list, from)} />
			{/each}
		</section>
	{/if}

	{#each grouped as g, gi (g.section)}
		<section class="group" aria-labelledby="sg-{gi}">
			<div class="grouphead">
				<h3 class="eyebrow" id="sg-{gi}">{g.section} · {g.count}</h3>
				<button class="chip small" onclick={() => sectionCards(g.section)}>{say('cards')}<span class="vh"> for {g.section}</span></button>
			</div>
			<ul class="rows">
				{#each g.rows as r (r.id)}
					<li>
						<button class="row" data-id={r.id} onclick={() => onOpen(r.id, shown)}>
							<span class="top">
								<span class="nm" class:off={is86(r.id)}>
									{#if r.signature}<span class="tag">Signature</span>{/if}
									{r.name}
									{#if is86(r.id)}<span class="tag strong">86</span>{/if}
									{#if againSet.has(r.id)}<span class="tag">Again</span>{/if}
								</span>
								{#if r.price}<span class="pr">{r.price}</span>{/if}
							</span>
							{#if r.line}<span class="line">{r.line}</span>{/if}
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/each}

	{#if elsewhere.length}
		<section class="elsewhere" aria-labelledby="sg-elsewhere">
			<h3 class="eyebrow" id="sg-elsewhere">{say('elsewhere')}</h3>
			<ul>
				{#each elsewhere as e (e.id)}
					{@const href = canLink ? roomHref(roomOf(e.kind), e.id, base, current) : ''}
					<li>
						{#if href}
							<a href={href}>{say('inRoom', { name: e.name, room: ROOM_NAMES[roomOf(e.kind)] })}</a>
						{:else}
							{say('inRoom', { name: e.name, room: ROOM_NAMES[roomOf(e.kind)] })}
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if current.id === BRENNANS_HOUSE_ID}
		<section class="teaching-library" aria-label="Illustrated kitchen studies">
			<h2>Illustrated kitchen studies</h2>
			<TeachingFolioCollection />
		</section>
	{/if}

	{#if videoCount}
		<details class="videos" id="study-videos">
			<summary>{say('videosCount', { n: videoCount })}</summary>
			<p class="vnote">{say('videoNote')}</p>
			{#each videoGroups as g, gi (g.topic)}
				<section class="vgroup" aria-labelledby="vg-{gi}">
					<h3 class="eyebrow" id="vg-{gi}">{g.topic} · {g.rows.length}</h3>
					<VideoList rows={g.rows} showFor onOpen={openDish} />
				</section>
			{/each}
		</details>
	{/if}

	{#if drinks || wines}
		<p class="also">
			Also in the house:
			{#if ledgerList}<a href={ledgerList}>{drinks} drinks in the Ledger</a>{:else}{drinks} drinks in the Ledger{/if},
			{#if codexList}<a href={codexList}>{wines} wines in the Codex</a>{:else}{wines} wines in the Codex{/if}
		</p>
	{/if}
	<!-- The quiet export line sits at the foot of the list, where it is read after the menu, not before it. -->
	{#if footer}<div class="foot">{@render footer()}</div>{/if}
</section>

<style>
	.study { margin: 4px 0 18px; }
	.studyhead { margin: 0; }
	.titlerow { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 6px; }
	.titlerow h2 { font-family: var(--display); font-size: var(--t-h3); line-height: 1.15; margin: 0; }
	.quiet {
		min-height: 44px; padding: 0 4px; background: none; border: 0; cursor: pointer;
		font: inherit; font-size: 1rem; color: var(--ink-soft); text-decoration: underline;
		text-underline-offset: 3px; flex: none;
	}
	.quiet:hover { color: var(--ink); }
	.facts { margin: 0 0 4px; font-size: 1rem; color: var(--ink-soft); line-height: 1.35; }
	.actions { display: flex; flex-wrap: wrap; gap: 8px; }
	/* One row that scrolls in itself, so the shift filter never pushes the menu down. */
	.meals { display: flex; min-width: 0; gap: 8px; overflow-x: auto; overscroll-behavior-x: contain; max-width: 100%; }
	.meals .chip { flex: none; }
	.actions { margin: 6px 0 0; }
	.chip {
		border: 1px solid var(--line); background: var(--card); color: var(--ink);
		padding: 8px 14px; border-radius: var(--radius); cursor: pointer;
		font: inherit; font-size: 1rem; min-height: 44px; white-space: nowrap;
	}
	.chip:hover:not(:disabled) { border-color: var(--turmeric); }
	.chip:disabled { opacity: 0.7; cursor: default; }
	.chip.go { border-color: var(--turmeric-deep); font-weight: 600; }
	.chip[aria-pressed='true'] { background: var(--accent-solid); border-color: var(--accent-solid); color: var(--on-accent); }
	.chip.small { padding: 6px 12px; }
	a.chip { display: inline-flex; align-items: center; text-decoration: none; box-sizing: border-box; }
	.tastings { margin: 6px 0 10px; }

	.bar {
		/* Under the layout's sticky Back row (--backrow-h), never over it. */
		position: sticky; top: calc(var(--modebar-h, 0px) + var(--backrow-h, 0px)); z-index: 29;
		background: var(--paper); border-bottom: 1px solid var(--line);
		padding: 6px 0; margin: 4px 0 0;
	}
	.find { display: block; }
	.find input {
		width: 100%; box-sizing: border-box; min-height: 44px; padding: 8px 12px;
		border: 1px solid var(--field-line); border-radius: var(--radius);
		background: var(--card); color: var(--ink); font: inherit; font-size: 1rem;
	}
	.chiprow {
		display: flex; gap: 8px; margin-top: 6px; overflow-x: auto;
		overscroll-behavior-x: contain; scroll-snap-type: x proximity; padding-bottom: 2px;
	}
	.chiprow .chip { flex: none; scroll-snap-align: start; }

	.none { color: var(--ink-soft); font-size: 1rem; margin: 12px 0; }
	.group { margin: 6px 0; }
	.grouphead {
		display: flex; align-items: center; justify-content: space-between; gap: 10px;
		border-bottom: 1px solid var(--line); padding-bottom: 2px;
	}
	.grouphead .eyebrow { margin: 0; color: var(--muted); font-weight: 500; }
	.rows { list-style: none; margin: 0; padding: 0; }
	.rows li { border-bottom: 1px dotted var(--line); }
	.row {
		display: block; width: 100%; min-height: 56px; text-align: left; cursor: pointer;
		background: none; border: 0; padding: 8px 0; font: inherit; color: var(--ink);
	}
	/* The shared appearance bar adds a row on phones. Recover spare space
	   between the study controls, including when the facts wrap to two lines;
	   keep every control at 44px and each dish row at least 56px. */
	@media screen and (max-width: 599px) {
		.study { margin-top: 0; }
		.titlerow { margin-top: 2px; }
		.facts { margin-bottom: 2px; }
		.actions { margin-top: 4px; }
		.bar { padding-block: 2px; margin-top: 2px; }
		.chiprow { margin-top: 4px; }
		.group { margin-block: 2px; }
		.grouphead { padding-bottom: 0; }
		.row { padding-block: 6px; }
	}
	.row:hover .nm { color: var(--turmeric-deep); }
	.row:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: 2px; }
	.top { display: flex; gap: 12px; align-items: baseline; }
	.nm { font-family: var(--display); font-size: 1.2rem; line-height: 1.25; flex: 1; min-width: 0; }
	.nm.off { text-decoration: line-through; }
	.pr { flex: none; font-variant-numeric: tabular-nums; color: var(--ink-soft); font-size: 1rem; }
	.tag {
		display: inline-block; font-family: var(--text); font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; color: var(--muted);
		margin: 0 6px 0 0; vertical-align: 2px;
	}
	.tag.strong { color: var(--ink); font-weight: 700; margin-left: 6px; }
	.line {
		display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical;
		overflow: hidden; margin-top: 2px; font-size: 1rem; line-height: 1.45; color: var(--ink-soft);
	}
	.elsewhere { margin: 16px 0 6px; }
	.elsewhere .eyebrow { color: var(--muted); }
	.elsewhere ul { list-style: none; margin: 4px 0 0; padding: 0; }
	.elsewhere li { min-height: 44px; display: flex; align-items: center; font-size: 1rem; border-bottom: 1px dotted var(--line); }
	.elsewhere a { color: var(--ink); }
	.teaching-library { margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--house-frame); }
	.teaching-library > h2 { font-family: var(--house-display); font-size: 27px; font-weight: 500; line-height: 1.3; color: var(--ink); margin: 0; }
	.videos { margin: 16px 0 4px; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
	.videos summary {
		min-height: 44px; display: flex; align-items: center; cursor: pointer;
		font-family: var(--display); font-size: 1.2rem;
	}
	.videos summary:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: 2px; }
	.vnote { margin: 0 0 6px; font-size: 1rem; color: var(--ink-soft); }
	.vgroup { margin: 8px 0 10px; }
	.vgroup .eyebrow { margin: 0; color: var(--muted); font-weight: 500; border-bottom: 1px solid var(--line); padding-bottom: 2px; }
	.also { margin: 16px 0 4px; font-size: 1rem; color: var(--ink-soft); }
	.also a { color: var(--ink); }
	.foot { margin: 12px 0 0; }
	.vh {
		position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
		overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
	}
</style>
