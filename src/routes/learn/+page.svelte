<!--
  Learn: the taught path, the same for everyone.

  A hub rather than a surface. It holds nothing of its own; it is the answer to
  "there are ten tabs and I do not know which one is for me", which is the thing
  that made this app read as a browse surface no matter what the front door said.

  It used to reorder itself by role (the kitchen saw technique first, the floor
  saw the Floor Deck first). The owner removed the role question on
  2026-09-19: every path here is for anyone, so there is one order. The course
  leads because it is the route through the rest; techniques are what the
  course is made of; the Floor Deck and the Lexicon are the words; the Palate
  and Food Safety close it.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { TOTALS } from '$lib/data';

	let { data } = $props();
</script>

<svelte:head><title>Learn · The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<h1>Learn</h1>
		<p class="lede">
			{data.semesters} semesters, {data.courseDishes} dishes, in teaching order. Underneath them are
			{data.taught} of the guide's {data.techniques} skills, and around them the words: the Floor Deck
			for what to say at the table, the Lexicon for the long read.
		</p>
	</header>

	<ul class="tiles">
		<li>
			<a href="{base}/study">
				<h2>The Path of Study</h2>
				<p>
					{data.semesters} semesters, {data.courseDishes} dishes in teaching order. Every dish carries
					a standard you can check the plate against.
				</p>
			</a>
		</li>
		<li>
			<a href="{base}/technique">
				<h2>Techniques</h2>
				<p>
					{data.techniques} skills, {data.anchored} of them with the definition that explains why they
					work, and every dish in the book that drills each.
				</p>
			</a>
		</li>
		{#if TOTALS.deck}
			<li>
				<a href="{base}/service/deck">
					<h2>The Floor Deck</h2>
					<p>
						{TOTALS.deck} menu words, one card each: what to say at the table, why, what it is
						classically made with, and what it gets mistaken for.
					</p>
				</a>
			</li>
		{/if}
		<li>
			<a href="{base}/lexicon">
				<h2>Chef's Lexicon</h2>
				<p>{data.lexicon} terms: the words the rest of this app is written in.</p>
			</a>
		</li>
		<li>
			<a href="{base}/palate">
				<h2>The Palate</h2>
				<p>Taste it, name the loudest fault, pull the gentlest lever that answers it.</p>
			</a>
		</li>
		<li>
			<a href="{base}/safety">
				<h2>Food Safety</h2>
				<p>The guide's food-safety and inspections entries, and what it does not state.</p>
			</a>
		</li>
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
