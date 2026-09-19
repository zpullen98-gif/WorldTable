<!--
  The four bands, shared with the Codex and the Ledger.

  The World Table's home has always been the recipe grid itself: 970 cards, a
  filter bar and a chapter rail. That is a superb way to FIND a dish and a poor
  way to be TAUGHT, and it is the only one of the three wings that opened onto a
  search result rather than a course.

  These bands sit above the grid and leave it completely untouched, which also
  means the 171 chapter pages that render the same component are unaffected.

  Band names and structure classes come from shared/oot-home.css, so a cook who
  has used the Ledger already knows how to read this. Colour comes from the
  Table's own tokens through the --oot-* mapping, so it still looks like itself.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { bySlug, TOTALS } from '$lib/data';
	import { session } from '$lib/stores/session.svelte';
	import { house } from '$lib/stores/house.svelte';
	import { repertoire, dueList, sinceLabel } from '$lib/repertoire';
	import { onMount } from 'svelte';

	/* ---- the shared row ----------------------------------------------------
	 *
	 * This used to be the profile row (Add your name) and, on a manager's
	 * device, The Pass strip. The app keeps one record per device now, so the
	 * shared layer answers with the day count alone, or with nothing at all,
	 * and this host renders whatever it is given. The wiring is left whole
	 * because it is how the row comes back.
	 *
	 * What it was: the same two pieces of shared HTML, in the
	 * same order, that light/js/oot-light.js puts at the top of First Light's
	 * Today. Both are rendered by shared/oot-home.js and shared/oot-pass.js
	 * from the roster and bound ONCE on the band's container, which survives
	 * every rerender of the row inside it. Switching a name reloads the page
	 * (the shared layer's rule, see bindWho); adding one rerenders the row
	 * through the callback. The session itself follows the roster through
	 * profiles.onChange in +layout.svelte, not here.
	 *
	 * Standalone there is no window.OOT and the row is an empty string. Every
	 * call is guarded because a hardened browser can throw on the window
	 * access itself, and the home page must paint either way.
	 */
	let bandHost = $state<HTMLDivElement | null>(null);
	let whoHtml = $state('');

	function paintWho() {
		let html = '';
		try {
			const oot = typeof window !== 'undefined' ? window.OOT : undefined;
			if (oot?.pass?.strip) html += oot.pass.strip();
			if (oot?.home?.who) html += oot.home.who();
		} catch {
			html = '';
		}
		whoHtml = html;
	}

	onMount(() => {
		paintWho();
		try {
			const oot = window.OOT;
			if (!oot || !bandHost) return;
			if (oot.home?.bindWho) oot.home.bindWho(bandHost, paintWho);
			if (oot.pass?.bind) oot.pass.bind(bandHost, () => {});
		} catch {
			/* the row is decoration on the band, never a reason to fail it */
		}
	});

	interface Props {
		/** The course's dish slugs, in teaching order, from study.json. */
		curriculum?: string[];
		lexiconTotal?: number;
		techniqueTotal?: number;
		recipeTotal?: number;
	}
	let {
		curriculum = [],
		lexiconTotal = 0,
		techniqueTotal = 0,
		recipeTotal = 0
	}: Props = $props();

	const curriculumTotal = $derived(curriculum.length);

	/* Distinct dishes, not log entries.
	   This band shipped reading `cookedLog.length` against the course total, and
	   both halves of that were wrong: the log counts COOKS (markCooked appends on
	   every finish, so one dish cooked three times counted as three) and it
	   counts dishes from anywhere in the book, so 45 cooks of anything at all
	   reported the ten-semester curriculum complete. */
	const cookedDishes = $derived(session.cookedDishes);
	const courseDone = $derived(curriculum.filter((slug) => cookedDishes.has(slug)).length);
	const cooked = $derived(cookedDishes.size);

	const menuCount = $derived(session.menuCount);
	const dishes = $derived(house.dishes.length);
	const pantry = $derived(session.pantry.length);

	/* There IS a scheduler now (lib/repertoire.ts), so "today" can mean what it
	   means in the sibling wings: the thing most worth doing. A dish gone cold
	   outranks a new one: re-cooking what you are losing beats adding to a list
	   of things you cooked once. Failing that, the next dish in teaching order.
	   One dish either way, never a queue. */
	const due = $derived.by(() => {
		const now = Date.now();
		return dueList(repertoire(session.cookedLog, now), now);
	});
	const coldest = $derived(due[0]);
	const coldestName = $derived(coldest ? (bySlug.get(coldest.slug)?.name ?? coldest.slug) : '');

	const nextUp = $derived(curriculum.find((slug) => !cookedDishes.has(slug)));
	const nextUpName = $derived(nextUp ? (bySlug.get(nextUp)?.name ?? nextUp) : '');

	const started = $derived(cooked > 0);
	const pct = $derived(curriculumTotal ? Math.round((courseDone / curriculumTotal) * 100) : 0);

	/* ---- one Today, for everyone -------------------------------------------
	 *
	 * The home page used to open by asking "What do you do?" (the kitchen, a
	 * student, the floor) and showed each a different Today. It hid almost
	 * nothing, but it was the first thing a new person met and it framed the app
	 * as three apps. The owner removed it (2026-09-19): all of it is for anyone.
	 * So Today leads with the course's one next thing (a dish gone cold outranks
	 * the next new one) and then offers every other door that has something
	 * behind it: the house menu drill, the costs, the Floor Deck.
	 */
	const deckTotal = TOTALS.deck;

	/** Dishes whose most recent cook actually met the standard: evidence, not
	 *  attendance. The grade has been in cookedLog since the repertoire landed
	 *  and no screen has ever read it. */
	const metStandard = $derived.by(() => {
		const last = new Map<string, string | undefined>();
		for (const e of session.cookedLog) last.set(e.slug, e.grade);
		return curriculum.filter((slug) => last.get(slug) === 'met').length;
	});
</script>

<div class="oot-band-host" bind:this={bandHost}>
	<section class="oot-sec">
		<div class="oot-sec-head">
			<h2>Today</h2><span>One dish, cooked properly, beats ten read about</span>
		</div>
		{#if whoHtml}
			<!-- Shared-layer HTML from oot-pass.js and oot-home.js: the roster is
			     escaped there (esc), and standalone this string is empty. -->
			<div class="whorow">{@html whoHtml}</div>
		{/if}
		<div class="oot-today">
			<div class="oot-today-main">
				<div class="oot-today-line">
					{#if coldest}
						Cook <a class="oot-today-dish" href="{base}/recipe/{coldest.slug}">{coldestName}</a>
						again. Last made {sinceLabel(coldest.daysSince)}.
					{:else if !started}
						Start the course. <span class="oot-today-n">{curriculumTotal}</span> dishes
						across ten semesters, in teaching order.
					{:else if nextUp}
						Next in teaching order:
						<a class="oot-today-dish" href="{base}/recipe/{nextUp}">{nextUpName}</a>.
					{:else}
						Every dish on the course is cooked and none has gone cold.
					{/if}
				</div>
				<div class="oot-today-sub">
					{#if coldest}
						{due.length === 1
							? 'One dish is past its re-cook.'
							: `${due.length} dishes are past their re-cook.`}
						Check the plate against the standard this time.
					{:else if !started}
						Semester one is knife work and fire. Mark a dish cooked when you have
						actually made it, not when you have read it.
					{:else if nextUp}
						{courseDone} of {curriculumTotal} cooked, {metStandard} of them met their standard.
					{:else}
						All {curriculumTotal} cooked, {metStandard} met their standard. Cook the rest again
						until they do.
					{/if}
				</div>
			</div>
			<!--
			  Every other door that has something behind it, for anyone: these were
			  split across the old kitchen, floor and student Todays, and each person
			  saw only their third. The costing sheet had no other door from home.
			-->
			<div class="todaygo">
				<a class="oot-chip oot-today-go" href={coldest ? `${base}/repertoire` : `${base}/study`}>
					{#if coldest}What has gone cold{:else if !started}Open the course{:else}Back to the course{/if}
				</a>
				{#if dishes >= 4}
					<a class="oot-chip" href="{base}/menu/quiz">Drill the menu</a>
				{/if}
				{#if dishes}
					<a class="oot-chip" href="{base}/menu/costing">The costs</a>
				{/if}
				{#if deckTotal}
					<a class="oot-chip" href="{base}/service/deck">The Floor Deck</a>
				{/if}
			</div>
		</div>
	</section>

	<section class="oot-sec">
		<div class="oot-sec-head">
			<h2>Learn</h2><span>Read it first, then cook what you read</span>
		</div>
		<div class="oot-grid-links">
			<a href="{base}/study">Path of Study<small>Ten semesters, {curriculumTotal} dishes in teaching order</small></a>
			<a href="{base}/technique">Techniques<small>{techniqueTotal} skills, and the dishes that drill each</small></a>
			<a href="{base}/lexicon">Chef's Lexicon<small>{lexiconTotal} terms, with flashcards and a quiz</small></a>
			<a href="{base}/palate">The Palate<small>Taste it, name the fault, pull the gentlest lever</small></a>
			<a href="{base}/family">The Family Chapter<small>Add the dishes your kitchen actually cooks</small></a>
		</div>
	</section>

	<section class="oot-sec">
		<div class="oot-sec-head">
			<h2>Practise</h2><span>Until the menu comes without thinking</span>
		</div>
		<div class="oot-grid-links">
			<a href="{base}/menu/quiz">Drill the Menu<small
				>{dishes >= 4
					? `Your ${dishes} dishes from the house menu, drilled like the canon`
					: `Opens at four dishes on the house menu, ${4 - dishes} to go`}</small
			></a>
			<a href="{base}/lexicon">Lexicon Quiz<small>Ten questions on the words a cook is expected to know, scheduled so the ones you miss come back</small></a>
			<a href="{base}/repertoire">The Repertoire<small
				>{due.length
					? `${due.length} dish${due.length === 1 ? '' : 'es'} due a re-cook`
					: 'What you can cook, and what is slipping'}</small
			></a>
			<a href="{base}/pantry">Pantry Match<small
				>{pantry ? `${pantry} ingredients ticked` : 'What can you cook from what is in the walk-in'}</small
			></a>
			<!-- My Menu is a tab of its own now, beside Library. A tile here as
			     well would put the same destination in two places and make the
			     bar look like the shortcut rather than the home of it. -->
		</div>
	</section>

	<section class="oot-sec">
		<div class="oot-sec-head">
			<h2>Record</h2><span>What you have cooked, and where it lives</span>
		</div>
		<!-- The course has a fixed denominator, so it gets the meter; the line under
		     it counts everything else. -->
		<div class="oot-meter">
			<div class="oot-meter-top"><span>The course</span><b>{pct}%</b></div>
			<div class="oot-meter-track"><div class="oot-meter-fill" style="width:{pct}%"></div></div>
		</div>
		<div class="oot-today-sub" style="margin-top:8px">
			{courseDone} of {curriculumTotal} on the course · {cooked} dish{cooked === 1 ? '' : 'es'}
			cooked in all · {menuCount} pinned · {dishes} on the house menu.
			Everything is kept in this browser{house.storagePersisted === false
				? ', which has not promised to keep it'
				: ''}; export it from My Menu.
		</div>
		<div class="oot-today-sub" style="margin-top:6px">
			<a href="{base}/repertoire">The Repertoire</a>, every dish you have cooked, how long ago, and
			what is due.
		</div>
	</section>

	<!-- This band's body used to be the RecipeBrowser that followed it. With the
	     grid at /recipes it needs a way in, or the count below (`All
	     {recipeTotal} recipes`) names every dish with no route to any of them. -->
	<section class="oot-sec">
		<div class="oot-sec-head">
			<h2>The library</h2><span>When you want a dish rather than a lesson</span>
		</div>
		<div class="oot-grid-links">
			<a href="{base}/recipes"
				>All {recipeTotal} recipes<small>Every dish in the book, filterable by course, difficulty, diet and season</small></a
			>
		</div>
	</section>
</div>

<style>
	/* The row's own looks come from shared/oot-home.css (.oot-who, .oot-pass);
	   this only keeps it off the Today card below it. */
	.whorow {
		margin-bottom: 12px;
	}
	.oot-band-host {
		max-width: 1200px;
		margin: 0 auto;
		padding-inline: 20px;
	}
	/* Link tiles, sized like the sibling wings' mode tiles. */
	.oot-grid-links {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
		gap: var(--gap, 14px);
	}
	.oot-grid-links a {
		display: block;
		padding: 14px 15px;
		border: var(--rule, 1px) solid var(--line, currentColor);
		background: var(--card, transparent);
		color: var(--ink, currentColor);
		text-decoration: none;
		border-radius: var(--radius, 2px);
	}
	.oot-grid-links a:hover {
		border-color: var(--turmeric, currentColor);
	}
	.oot-grid-links small {
		display: block;
		margin-top: 5px;
		color: var(--muted, currentColor);
		font-size: var(--t-small, 0.8125rem);
		line-height: 1.4;
	}
	.oot-today-dish {
		color: inherit;
		text-decoration-color: var(--turmeric, currentColor);
		text-underline-offset: 3px;
	}
	.oot-today-go {
		text-decoration: none;
		display: inline-block;
	}
	/* The shared rule paints this count in --oot-accent, a mid-tone that reads
	   3.56:1 on day service. It was always in the student's Today; nobody saw
	   it because the role picker stood in front of it. --oot-accent-deep is the
	   shared layer's own "dark enough to read at label size" token. */
	.oot-today-n {
		color: var(--oot-accent-deep, currentColor);
	}
	.todaygo {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		align-items: center;
	}
</style>
