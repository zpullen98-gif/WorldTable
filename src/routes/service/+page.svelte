<!--
  Service, the front of house, given an order for the first time.

  176 terms across five atlases, and until now no route through any of them: the
  Path of Study reads 39 lexicon terms and NONE is front-of-house; the technique
  table anchors 47 and NONE is front-of-house; 56 of the 176 reach zero recipes,
  so cross-links cannot surface them either. A server's only surface was a flat
  479-term alphabetical list.

  The two GAPS below are stated on the page's own face, not buried. The guide
  has no steps-of-service curriculum and no allergen curriculum, and a track
  that quietly skipped them would read as though the ground were covered. Naming
  them is the honest version and it is also the useful one: it tells a manager
  exactly what their own induction still has to teach.

  Class names here are deliberately NOT .lexcard, .def, .flash, .semester or
  .semesters: those five are a published paywall contract keyed to the tier
  attribute with no route scope, and reusing one would blur this page for free
  visitors. src/lib/navigation.test.ts holds that line.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { session } from '$lib/stores/session.svelte';
	import { house } from '$lib/stores/house.svelte';
	import { CHECKED, CHECKED_FLAGS, NOT_SCREENED, list } from '$lib/allergens';
	import { recipes } from '$lib/data';

	/**
	 * COMPUTED, because the last version of this sentence hardcoded "101 of
	 * 970" and the vocabulary then widened to thirteen; the number was stale
	 * the moment the derivation moved, which is what hardcoded copy does.
	 */
	const emptyCount = recipes.filter(
		(r) => !CHECKED_FLAGS.some((f) => r.diet[f as keyof typeof r.diet])
	).length;

	let { data } = $props();
	const dishes = $derived(house.dishes.length);
	const track = $derived(data.track);
</script>

<svelte:head><title>Service: The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<h1>Service</h1>
		<p class="lede">
			{track.fohTotal} terms (cheese, charcuterie, the bar, wine and the grapes) in the order a
			floor learns them. Start at the room and the words the kitchen shouts; the Grape Atlas can
			wait for week three.
		</p>
	</header>

	<h2 class="sec">The house</h2>
	<ul class="tiles">
		<li>
			<a href="{base}/menu">
				<h3>The Kitchen's Menu</h3>
				<p>{dishes ? `${dishes} dishes entered` : 'The dishes the house actually serves'}.</p>
			</a>
		</li>
		<li>
			<a href="{base}/menu/guest">
				<h3>The Guest Menu</h3>
				<p>The printed card, each dish described the way it would be said at the table.</p>
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

	<h2 class="sec">Drill it</h2>
	<p class="secnote">
		Ten questions over the track's terms: the definition with its own term taken out. Unlike the
		menu drill it works on a fresh install, because it asks about the guide rather than about
		dishes somebody still has to type in.
	</p>
	<p class="drillcta"><a class="chip" href="{base}/service/drill">Start a round</a></p>

	<h2 class="sec">The track</h2>
	<p class="secnote">
		{track.modules.length} modules, {track.total} terms, each taught once and in this order.
	</p>
	<ol class="trackstep">
		{#each track.modules as m (m.key)}
			<li>
				<a href="{base}/service/{m.key}">
					<span class="stepn">{m.n}</span>
					<span class="stepmain">
						<span class="steptitle">{m.title}</span>
						<span class="stepout">{m.outcome}</span>
					</span>
					<span class="stepcount">{m.terms.length}</span>
				</a>
			</li>
		{/each}
	</ol>

	<!-- Stated here rather than discovered later. Both were measured across all
	     479 definitions before this track was written. -->
	<h2 class="sec">What this guide does not teach</h2>
	<div class="gaps">
		<p>
			<b>There is no steps-of-service curriculum.</b> Across all 479 definitions, "check-back" appears
			zero times, "sequence of service" zero, "refire" zero, "comped" zero. Greeting, timing, the
			check-back, firing a course, handling a send-back and closing a table are your room's to teach.
			This track gives you the vocabulary they are spoken in, not the sequence.
		</p>
		<p>
			<b>There is no allergen curriculum, and you must never answer an allergen question from this
			app.</b>
			The recipe screen checks {CHECKED.length}, {list(CHECKED)}, and explicitly does not screen
			{list(NOT_SCREENED)}. A dish showing nothing means <i>the text screen found nothing</i>, never
			<i>clear</i>: {emptyCount} of {recipes.length} recipes read exactly that, and no text screen
			sees a shared fryer or a dusted board. Take allergen questions to the kitchen, every time.
		</p>
	</div>

	{#if track.untaught.length}
		<h2 class="sec">Bottles the guide has no lesson for</h2>
		<p class="secnote">
			The cellar carries {track.cellar.length} bottles and {track.untaught.length} of them have no
			entry behind them, so the track does not pretend to teach them.
		</p>
		<p class="untaught">{track.untaught.join(' · ')}</p>
	{/if}
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
		margin: 32px 0 12px;
		font-weight: 500;
	}
	.secnote {
		color: var(--ink-soft);
		max-width: var(--measure);
		font-size: var(--t-small);
		margin-bottom: 14px;
	}
	.tiles {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: var(--gap);
	}
	.tiles a {
		display: block;
		height: 100%;
		padding: 15px 17px;
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
		font-size: 18px;
		margin-bottom: 5px;
	}
	.tiles p {
		color: var(--ink-soft);
		font-size: var(--t-small);
		line-height: 1.5;
	}

	.trackstep {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.trackstep a {
		display: flex;
		gap: 14px;
		align-items: baseline;
		padding: 12px 0;
		border-bottom: 1px solid var(--line);
		color: var(--ink);
		text-decoration: none;
	}
	.trackstep a:hover .steptitle {
		text-decoration: underline;
		text-decoration-color: var(--turmeric-deep);
		text-underline-offset: 3px;
	}
	.stepn {
		flex: none;
		width: 2em;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
		font-size: var(--t-small);
	}
	.stepmain {
		flex: 1;
		min-width: 0;
	}
	.steptitle {
		display: block;
		font-family: var(--display);
		font-size: 18px;
	}
	.stepout {
		display: block;
		margin-top: 3px;
		color: var(--ink-soft);
		font-size: var(--t-small);
		line-height: 1.5;
	}
	.stepcount {
		flex: none;
		color: var(--muted);
		font-size: var(--t-small);
		font-variant-numeric: tabular-nums;
	}

	.gaps {
		max-width: var(--measure);
	}
	.gaps p {
		padding: 12px 15px;
		margin-bottom: 10px;
		border-left: 2px solid var(--turmeric-deep);
		background: var(--paper-raised);
		font-size: var(--t-small);
		line-height: 1.6;
		color: var(--ink);
	}
	.drillcta {
		margin-bottom: 6px;
	}
	.drillcta a {
		text-decoration: none;
	}
	.untaught {
		color: var(--ink-soft);
		font-size: var(--t-small);
	}
</style>
