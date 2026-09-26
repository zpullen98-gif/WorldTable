<!--
  The Service Track: the front of house, given an order.

  176 terms across five atlases, and until this track no route through any of
  them: the Path of Study reads 39 lexicon terms and NONE is front-of-house;
  the technique table anchors 47 and NONE is front-of-house; 56 of the 176
  reach zero recipes, so cross-links cannot surface them either. A server's
  only surface was a flat 479-term alphabetical list.

  This is the track's own page since the four levels (2026-09-26): the drill,
  the modules in teaching order, the two gaps and the untaught bottles. The
  house tiles it used to carry (the menu, the guest menu, the desk, the
  coverage board) live behind Mine now, and the Floor Deck is a subsection of
  every level with its own doors there; a Service hub that repeated both
  would be a second home.

  The two GAPS below are stated on the page's own face, not buried. The guide
  has no steps-of-service curriculum and no allergen curriculum, and a track
  that quietly skipped them would read as though the ground were covered.
  Naming them is the honest version and it is also the useful one: it tells a
  manager exactly what their own induction still has to teach.
-->
<script lang="ts">
	import { base } from '$app/paths';
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
	const track = $derived(data.track);
</script>

<svelte:head><title>The Service Track · The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<h1>The Service Track</h1>
		<p class="lede">
			{track.total} terms, {track.fohTotal} of them from the five atlases (cheese, charcuterie, the
			bar, wine and the grapes), in the order a floor learns them. Start at the room and the words
			the kitchen shouts; the Grape Atlas can wait for week three. Each module sits at one of the
			four levels, and a level's page opens the ones placed there.
		</p>
	</header>

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
