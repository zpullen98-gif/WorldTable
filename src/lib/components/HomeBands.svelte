<!--
  The four bands, shared with the Codex and the Ledger.

  The World Table's home has always been the recipe grid itself: 970 cards, a
  filter bar and a chapter rail. That is a superb way to FIND a dish and a poor
  way to be TAUGHT, and it is the only one of the three wings that opened onto a
  search result rather than a course.

  These bands sit above the grid and leave it completely untouched, which also
  means the 94 chapter pages that render the same component are unaffected.

  Band names and structure classes come from shared/oot-home.css, so a cook who
  has used the Ledger already knows how to read this. Colour comes from the
  Table's own tokens through the --oot-* mapping, so it still looks like itself.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { bySlug } from '$lib/data';
	import { session } from '$lib/stores/session.svelte';
	import { repertoire, dueList, sinceLabel } from '$lib/repertoire';

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
	const dishes = $derived(session.menuDishes.length);
	const pantry = $derived(session.pantry.length);

	/* There IS a scheduler now (lib/repertoire.ts), so "today" can mean what it
	   means in the sibling wings: the thing most worth doing. A dish gone cold
	   outranks a new one — re-cooking what you are losing beats adding to a list
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
</script>

<div class="oot-band-host">
	<section class="oot-sec">
		<div class="oot-sec-head">
			<h3>Today</h3><span>One dish, cooked properly, beats ten read about</span>
		</div>
		<div class="oot-today">
			<div class="oot-today-main">
				<div class="oot-today-line">
					{#if !started}
						Start the course. <span class="oot-today-n">{curriculumTotal}</span> dishes
						across ten semesters, in teaching order.
					{:else if coldest}
						Cook <a class="oot-today-dish" href="{base}/recipe/{coldest.slug}">{coldestName}</a>
						again. Last made {sinceLabel(coldest.daysSince)}.
					{:else if nextUp}
						Next in teaching order:
						<a class="oot-today-dish" href="{base}/recipe/{nextUp}">{nextUpName}</a>.
					{:else}
						Every dish on the course is cooked and none has gone cold.
					{/if}
				</div>
				<div class="oot-today-sub">
					{#if !started}
						Semester one is knife work and fire. Mark a dish cooked when you have
						actually made it, not when you have read it.
					{:else if coldest}
						{due.length === 1
							? 'One dish is past its re-cook.'
							: `${due.length} dishes are past their re-cook.`}
						Check the plate against the standard this time.
					{:else if nextUp}
						{courseDone} of {curriculumTotal} cooked, and nothing is going cold.
					{:else}
						Cook it again faster, or take the repertoire out to the rest of the book.
					{/if}
				</div>
			</div>
			<a class="oot-chip oot-today-go" href={coldest ? `${base}/repertoire` : `${base}/study`}>
				{#if !started}Open the course{:else if coldest}What has gone cold{:else}Back to the course{/if}
			</a>
		</div>
	</section>

	<section class="oot-sec">
		<div class="oot-sec-head">
			<h3>Learn</h3><span>Read it first, then cook what you read</span>
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
			<h3>Practise</h3><span>Until the menu comes without thinking</span>
		</div>
		<div class="oot-grid-links">
			<a href="{base}/menu/quiz">Drill the Menu<small
				>{dishes >= 4
					? `Your ${dishes} dishes, drilled like the canon`
					: `Opens at four dishes on My Menu — ${4 - dishes} to go`}</small
			></a>
			<a href="{base}/lexicon">Lexicon Quiz<small>Ten questions on the words a cook is expected to know</small></a>
			<a href="{base}/repertoire">The Repertoire<small
				>{due.length
					? `${due.length} dish${due.length === 1 ? '' : 'es'} due a re-cook`
					: 'What you can cook, and what is slipping'}</small
			></a>
			<a href="{base}/pantry">Pantry Match<small
				>{pantry ? `${pantry} ingredients ticked` : 'What can you cook from what is in the walk-in'}</small
			></a>
			<a href="{base}/menu">My Menu<small
				>{dishes ? `${dishes} dishes entered` : 'Enter the menu the house actually serves'}</small
			></a>
		</div>
	</section>

	<section class="oot-sec">
		<div class="oot-sec-head">
			<h3>Record</h3><span>What you have cooked, and where it lives</span>
		</div>
		<div class="oot-meter">
			<div class="oot-meter-top"><span>The course</span><b>{pct}%</b></div>
			<div class="oot-meter-track"><div class="oot-meter-fill" style="width:{pct}%"></div></div>
		</div>
		<div class="oot-today-sub" style="margin-top:8px">
			{courseDone} of {curriculumTotal} on the course · {cooked} dish{cooked === 1 ? '' : 'es'} cooked
			in all · {menuCount} pinned · {dishes} on the house menu. Everything is kept in this browser;
			export it from My Menu.
		</div>
		<div class="oot-today-sub" style="margin-top:6px">
			<a href="{base}/repertoire">The Repertoire</a> — every dish you have cooked, how long ago, and
			what is due.
		</div>
	</section>

	<section class="oot-sec">
		<div class="oot-sec-head">
			<h3>All {recipeTotal} recipes</h3><span>Every dish in the book, filterable</span>
		</div>
	</section>
</div>

<style>
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
</style>
