<!--
  Learn: the taught path, for whichever kitchen you stand in.

  A hub rather than a surface. It holds nothing of its own; it is the answer to
  "there are ten tabs and I do not know which one is for me", which is the thing
  that made this app read as a browse surface no matter what the front door said.

  The ORDER inside is the point. For someone learning to cook, the course leads
  and technique is what the course is secretly made of. For someone who already
  runs a kitchen there is no syllabus to finish, so technique leads and the
  course is a route through it. Same destinations, different first line.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { session } from '$lib/stores/session.svelte';

	let { data } = $props();
	const role = $derived(session.role);
</script>

<svelte:head><title>Learn: The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<h1>Learn</h1>
		<p class="lede">
			{#if role === 'chef'}
				No syllabus to finish. {data.techniques} skills, {data.anchored} of them with the definition that
				explains why they work, and a course underneath if you want a route through them.
			{:else if role === 'server'}
				The kitchen's side of the menu. You do not need to cook it, but knowing how it is made is
				most of knowing how to sell it.
			{:else}
				{data.semesters} semesters, {data.courseDishes} dishes, in teaching order. Underneath them are
				{data.taught} of the guide's {data.techniques} skills: the course is those skills wearing dishes.
			{/if}
		</p>
	</header>

	<ul class="tiles">
		{#if role === 'chef'}
			<li>
				<a href="{base}/technique">
					<h2>Techniques</h2>
					<p>{data.techniques} skills, each with every dish in the book that drills it.</p>
				</a>
			</li>
			<li>
				<a href="{base}/study">
					<h2>The Path of Study</h2>
					<p>{data.semesters} semesters, {data.courseDishes} dishes. A route through the skills.</p>
				</a>
			</li>
		{:else}
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
						{data.techniques} skills, {data.taught} of them taught on the course. The rest are reachable
						by browsing.
					</p>
				</a>
			</li>
		{/if}
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
		<li>
			<a href="{base}/lexicon">
				<h2>Chef's Lexicon</h2>
				<p>{data.lexicon} terms: the words the rest of this app is written in.</p>
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
