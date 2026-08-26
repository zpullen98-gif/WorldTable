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
	import { session } from '$lib/stores/session.svelte';

	interface Props {
		/** Total dishes across the ten semesters, from study.json. */
		curriculumTotal?: number;
		lexiconTotal?: number;
		techniqueTotal?: number;
		recipeTotal?: number;
	}
	let {
		curriculumTotal = 0,
		lexiconTotal = 0,
		techniqueTotal = 0,
		recipeTotal = 0
	}: Props = $props();

	const cooked = $derived(session.cookedLog.length);
	const menuCount = $derived(session.menuCount);
	const dishes = $derived(session.menuDishes.length);
	const pantry = $derived(session.pantry.length);

	/* The Table has no scheduler, so "today" cannot mean "cards due". It means
	   the next unfinished thing in the course, which is the honest equivalent
	   and is what a cook actually wants: one dish, not a queue. */
	const started = $derived(cooked > 0);
	const pct = $derived(curriculumTotal ? Math.round((cooked / curriculumTotal) * 100) : 0);
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
					{:else if cooked < curriculumTotal}
						<span class="oot-today-n">{cooked}</span> of
						<span class="oot-today-n">{curriculumTotal}</span> dishes cooked.
					{:else}
						The whole course is cooked. Now cook it again, faster.
					{/if}
				</div>
				<div class="oot-today-sub">
					{#if !started}
						Semester one is knife work and fire. Mark a dish cooked when you have
						actually made it, not when you have read it.
					{:else}
						Pick up where the teaching order left off.
					{/if}
				</div>
			</div>
			<a class="oot-chip oot-today-go" href="{base}/study">
				{started ? 'Back to the course' : 'Open the course'}
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
			{cooked} dish{cooked === 1 ? '' : 'es'} marked cooked · {menuCount} pinned · {dishes} on the
			house menu. Everything is kept in this browser; export it from My Menu.
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
	.oot-today-go {
		text-decoration: none;
		display: inline-block;
	}
</style>
