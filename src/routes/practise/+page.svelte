<!--
  Practise — everything in the app that is measured.

  The distinction from Learn is not decorative. Learn is where you are told
  something; Practise is where the app finds out whether it stuck. Two of these
  are graded by you (the repertoire's ladder, and cook mode's check against the
  dish's standard) and one is scored by the app (the menu drill). Stage 5 adds
  the scored drill over the Lexicon; until it does, this hub says so rather than
  pretending the Lexicon's flashcards are an assessment.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { session } from '$lib/stores/session.svelte';
	import { repertoire, dueList } from '$lib/repertoire';

	let { data } = $props();
	const role = $derived(session.role);
	const dishes = $derived(session.menuDishes.length);
	const cooked = $derived(session.cookedDishes.size);

	const due = $derived.by(() => {
		const now = Date.now();
		return dueList(repertoire(session.cookedLog, now), now);
	});
</script>

<svelte:head><title>Practise — The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<h1>Practise</h1>
		<p class="lede">
			{#if due.length}
				{due.length} dish{due.length === 1 ? '' : 'es'} past their re-cook. Everything here is
				measured — by you against a standard, or by the app against your own menu.
			{:else}
				Everything here is measured, rather than read. Nothing is due right now.
			{/if}
		</p>
	</header>

	<ul class="tiles">
		<li>
			<a href="{base}/repertoire">
				<h2>The Repertoire</h2>
				<p>
					{#if cooked}
						{cooked} dish{cooked === 1 ? '' : 'es'} cooked, {due.length} past their re-cook. The ladder
						widens each time the plate is right and narrows when it is not.
					{:else}
						What you can cook, and what is slipping. Fills itself as you mark dishes cooked.
					{/if}
				</p>
			</a>
		</li>
		<li>
			<a href="{base}/menu/quiz">
				<h2>Drill the Menu</h2>
				<p>
					{#if dishes >= 4}
						{dishes} dishes from the house menu, drilled like the canon.
					{:else}
						Opens at four dishes on the house menu — {4 - dishes} to go.
					{/if}
				</p>
			</a>
		</li>
		<li>
			<a href="{base}/service/drill">
				<h2>Drill the service track</h2>
				<p>
					Ten scored questions over the 186 terms of the front-of-house track, scheduled so a term
					you miss comes back sooner. Works on a fresh install.
				</p>
			</a>
		</li>
		<li>
			<a href="{base}/lexicon">
				<h2>Lexicon flashcards</h2>
				<p>
					{data.lexicon} terms, with a quiz. Not scored and not scheduled yet — turn a card and judge
					yourself.
				</p>
			</a>
		</li>
		{#if role !== 'server'}
			<li>
				<a href="{base}/study">
					<h2>Cook against a standard</h2>
					<p>
						All {data.courseDishes} course dishes state what a correct plate looks like. Cook mode asks
						at the end, and the answer sets how soon the dish comes back.
					</p>
				</a>
			</li>
		{/if}
	</ul>
</div>

<style>
	.head {
		margin-bottom: 24px;
	}
	h1 {
		font-size: var(--t-h1);
		margin-bottom: 8px;
	}
	.lede {
		font-size: var(--t-lede);
		color: var(--ink-soft);
		max-width: var(--measure);
	}
	.tiles {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: var(--gap);
	}
	.tiles a {
		display: block;
		height: 100%;
		padding: 16px 18px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--card, transparent);
		color: var(--ink);
		text-decoration: none;
	}
	.tiles a:hover {
		border-color: var(--turmeric-deep);
	}
	.tiles h2 {
		font-family: var(--display);
		font-size: 19px;
		margin-bottom: 6px;
	}
	.tiles p {
		color: var(--ink-soft);
		font-size: var(--t-small);
		line-height: 1.5;
	}
</style>
