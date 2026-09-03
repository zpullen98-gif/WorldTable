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
	import { bySlug } from '$lib/data';
	import { session } from '$lib/stores/session.svelte';
	import { house } from '$lib/stores/house.svelte';
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

	/* ---- role ------------------------------------------------------------
	 *
	 * A default, never a wall. No tab is hidden and no surface is locked by it;
	 * it changes which sentence Today opens with and what is offered first.
	 *
	 * The three are kept apart deliberately. A chef's work has NO end state, so
	 * giving them a course percentage is the exact lie the old band told: it
	 * reported the ten-semester course complete after 45 cooks of anything. The
	 * student is the only role with fixed denominators (45 dishes, 48 taught
	 * skills), so the student is the only role that gets a percentage.
	 */
	const role = $derived(session.role);

	/** Dishes whose most recent cook actually met the standard: evidence, not
	 *  attendance. The grade has been in cookedLog since the repertoire landed
	 *  and no screen has ever read it. */
	const metStandard = $derived.by(() => {
		const last = new Map<string, string | undefined>();
		for (const e of session.cookedLog) last.set(e.slug, e.grade);
		return curriculum.filter((slug) => last.get(slug) === 'met').length;
	});
</script>

<div class="oot-band-host">
	<section class="oot-sec">
		<div class="oot-sec-head">
			<h2>Today</h2><span>One dish, cooked properly, beats ten read about</span>
		</div>
		{#if !role}
			<!-- The induction seed. The World Table has never asked who is using it,
			     and the three audiences want different first sentences: a server is
			     not served by "semester one is knife work and fire". -->
			<div class="oot-today">
				<div class="oot-today-main">
					<div class="oot-today-line">What do you do?</div>
					<div class="oot-today-sub">
						This only changes what the app puts first. Nothing is hidden either way, and you can
						change it whenever you like.
					</div>
					<div class="rolepick">
						<button class="oot-chip" onclick={() => session.setRole('chef')}>
							I run a kitchen<small>The pass, the costs, what has gone cold</small>
						</button>
						<button class="oot-chip" onclick={() => session.setRole('student')}>
							I'm learning to cook<small>The ten-semester course, in teaching order</small>
						</button>
						<button class="oot-chip" onclick={() => session.setRole('server')}>
							I work the floor<small>The menu, the words, what's in the dish</small>
						</button>
					</div>
				</div>
			</div>
		{:else if role === 'server'}
			<div class="oot-today">
				<div class="oot-today-main">
					<div class="oot-today-line">
						{#if dishes >= 4}
							<span class="oot-today-n">{dishes}</span> dishes on the house menu. Learn to say them.
						{:else if dishes}
							<span class="oot-today-n">{dishes}</span> dishes entered so far: the drill opens at four.
						{:else}
							The house menu is not in yet.
						{/if}
					</div>
					<div class="oot-today-sub">
						{#if dishes >= 4}
							Name, section, allergen line, and what is poured with it. You are not expected to know
							how it is cooked.
						{:else}
							Until it is, the Chef's Lexicon is the ground: cheese, charcuterie, wine and the bar.
						{/if}
					</div>
				</div>
				<a class="oot-chip oot-today-go" href={dishes >= 4 ? `${base}/menu/quiz` : `${base}/lexicon`}>
					{dishes >= 4 ? 'Drill the menu' : "Open the Lexicon"}
				</a>
			</div>
		{:else if role === 'chef'}
			<div class="oot-today">
				<div class="oot-today-main">
					<div class="oot-today-line">
						{#if coldest}
							Cook <a class="oot-today-dish" href="{base}/recipe/{coldest.slug}">{coldestName}</a>
							again. Last made {sinceLabel(coldest.daysSince)}.
						{:else if !menuCount}
							Nothing pinned, nothing due. The Pass plans a service once dishes are on the menu.
						{:else}
							Nothing has gone cold. {menuCount} dishes pinned for service.
						{/if}
					</div>
					<div class="oot-today-sub">
						{#if coldest}
							{due.length === 1 ? 'One dish is' : `${due.length} dishes are`} past their re-cook. Check
							the plate against the standard this time.
						{:else}
							{cooked} dish{cooked === 1 ? '' : 'es'} in the repertoire{dishes
								? `, ${dishes} on the house menu`
								: ''}.
						{/if}
					</div>
				</div>
				<div class="chefgo">
					<a class="oot-chip oot-today-go" href={coldest ? `${base}/repertoire` : `${base}/menu`}>
						{coldest ? 'What has gone cold' : 'The Pass'}
					</a>
					<!--
					  The role button promises "the pass, the COSTS, what has gone cold" and
					  routed only to two of the three. The costing sheet had a single inbound
					  link in the whole app, buried mid-page on /menu.
					-->
					{#if dishes}
						<a class="oot-chip" href="{base}/menu/costing">The costs</a>
					{/if}
				</div>
			</div>
		{:else}
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
						{courseDone} of {curriculumTotal} cooked, {metStandard} of them met their standard.
					{:else}
						All {curriculumTotal} cooked, {metStandard} met their standard. Cook the rest again
						until they do.
					{/if}
				</div>
			</div>
			<a class="oot-chip oot-today-go" href={coldest ? `${base}/repertoire` : `${base}/study`}>
				{#if !started}Open the course{:else if coldest}What has gone cold{:else}Back to the course{/if}
			</a>
		</div>
		{/if}

		{#if role}
			<!-- Changing your mind must never be a hunt. It is a default, not an
			     identity, and hiding the switch would make it feel like one. -->
			<p class="rolenote">
				Shown for <b>{role === 'chef' ? 'the kitchen' : role === 'server' ? 'the floor' : 'a student'}</b>.
				<button class="linkish" onclick={() => session.setRole(undefined)}>Change</button>
			</p>
		{/if}
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
					? `Your ${dishes} dishes, drilled like the canon`
					: `Opens at four dishes on My Menu, ${4 - dishes} to go`}</small
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
			<a href="{base}/menu">My Menu<small
				>{dishes ? `${dishes} dishes entered` : 'Enter the menu the house actually serves'}</small
			></a>
		</div>
	</section>

	<section class="oot-sec">
		<div class="oot-sec-head">
			<h2>Record</h2><span>What you have cooked, and where it lives</span>
		</div>
		<!-- A percentage needs a DENOMINATOR that means something.
		     The student has one (45 dishes, fixed and finishable) so the student
		     gets the meter. A chef's work has no end state, and giving them a
		     course percentage is exactly the lie this band used to tell: it
		     reported the ten-semester course complete after 45 cooks of anything.
		     A server is not on the course at all. Both get counts instead. -->
		{#if role === 'student' || !role}
			<div class="oot-meter">
				<div class="oot-meter-top"><span>The course</span><b>{pct}%</b></div>
				<div class="oot-meter-track"><div class="oot-meter-fill" style="width:{pct}%"></div></div>
			</div>
		{:else if role === 'chef'}
			<div class="oot-meter-top">
				<span>Gone cold</span><b>{due.length} of {cooked}</b>
			</div>
		{:else}
			<div class="oot-meter-top">
				<span>The house menu</span><b>{dishes} dish{dishes === 1 ? '' : 'es'}</b>
			</div>
		{/if}
		<div class="oot-today-sub" style="margin-top:8px">
			{#if role === 'server'}
				{dishes} on the house menu · {menuCount} pinned.
			{:else}
				{courseDone} of {curriculumTotal} on the course · {cooked} dish{cooked === 1 ? '' : 'es'}
				cooked in all · {menuCount} pinned · {dishes} on the house menu.
			{/if}
			Everything is kept in this browser; export it from My Menu.
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
	.rolepick {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 12px;
	}
	.rolepick button {
		text-align: left;
		cursor: pointer;
		font: inherit;
	}
	/* A token, not opacity. Dimming already-dim text is how the shared
	   oot-home.css ended up at 2.32:1 against day service, and it is the one
	   defect this file already renders. Not adding another. */
	.rolepick small {
		display: block;
		margin-top: 3px;
		font-size: var(--t-small, 0.8125rem);
		color: var(--ink-soft, currentColor);
	}
	.rolenote {
		margin-top: 12px;
		font-size: var(--t-small, 0.8125rem);
		color: var(--muted, currentColor);
	}
	.linkish {
		background: none;
		border: 0;
		padding: 0;
		font: inherit;
		color: var(--turmeric-deep, currentColor);
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
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
	.chefgo {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		align-items: center;
	}
</style>
