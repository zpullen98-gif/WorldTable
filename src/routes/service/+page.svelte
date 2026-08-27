<!--
  Service — the front of house, and the house's own menu.

  Deliberately a hub with a stated gap rather than a hub pretending to be full.
  The front-of-house TRACK — an ordered route through the 176 cheese,
  charcuterie, cocktail, wine and grape terms — is the next stage of work. Until
  it lands, this page says how much ground there is and sends people at the
  atlases directly, because 176 terms reachable only by scrolling a flat
  479-term list is the actual problem and naming it beats hiding it.

  The /menu routes keep their existing paths on purpose. Tab membership is a
  navigation concern; the URL is a paywall contract — oot-locks.js lists
  '/menu' and '/menu/guest' as free by exact match, and moving the guest menu to
  /service/guest would flip it to paid through the default-false boundary.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { session } from '$lib/stores/session.svelte';

	let { data } = $props();
	const dishes = $derived(session.menuDishes.length);
</script>

<svelte:head><title>Service — The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<h1>Service</h1>
		<p class="lede">
			What the floor has to know: the dishes the house actually serves, what is in them, and what
			is poured alongside.
		</p>
	</header>

	<h2 class="sec">The house</h2>
	<ul class="tiles">
		<li>
			<a href="{base}/menu">
				<h3>The Kitchen's Menu</h3>
				<p>
					{dishes ? `${dishes} dishes entered` : 'Enter the dishes the house actually serves'} — with
					section, allergen line and price.
				</p>
			</a>
		</li>
		<li>
			<a href="{base}/menu/guest">
				<h3>The Guest Menu</h3>
				<p>The printed card, with each dish described the way it would be said at the table.</p>
			</a>
		</li>
		<li>
			<a href="{base}/menu/costing">
				<h3>The Costing Sheet</h3>
				<p>What a plate costs once the bin is paid for, and which dishes carry the menu.</p>
			</a>
		</li>
		{#if dishes >= 4}
			<li>
				<a href="{base}/menu/quiz">
					<h3>Drill the Menu</h3>
					<p>{dishes} dishes, drilled until they come without thinking.</p>
				</a>
			</li>
		{/if}
	</ul>

	<h2 class="sec">The ground underneath</h2>
	<p class="secnote">
		{data.total} terms across five atlases, and no route through them yet. They are the floor's own
		curriculum and they currently sit inside a {data.total > 0 ? 'flat' : ''} alphabetical list with
		everything else — an ordered track over them is the next piece of work.
	</p>
	<ul class="atlases">
		{#each data.atlases as a (a.category)}
			<li>
				<a href="{base}/lexicon">{a.category}</a>
				<span>{a.count} terms</span>
			</li>
		{/each}
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
	.sec {
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
		border-bottom: 1px solid var(--line);
		padding-bottom: 5px;
		margin: 30px 0 12px;
		font-weight: 500;
	}
	.secnote {
		color: var(--ink-soft);
		max-width: var(--measure);
		font-size: var(--t-small);
		line-height: 1.55;
		margin-bottom: 14px;
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
	.tiles h3 {
		font-family: var(--display);
		font-size: 19px;
		margin-bottom: 6px;
	}
	.tiles p {
		color: var(--ink-soft);
		font-size: var(--t-small);
		line-height: 1.5;
	}
	.atlases {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.atlases li {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 9px 0;
		border-bottom: 1px dotted var(--line);
	}
	.atlases a {
		color: var(--ink);
	}
	.atlases span {
		color: var(--muted);
		font-size: var(--t-small);
		font-variant-numeric: oldstyle-nums;
	}
</style>
