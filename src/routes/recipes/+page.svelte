<!--
  The library, at its own address.

  This was the home page. The World Table opened onto 970 cards, which is a
  superb way to FIND a dish and the reason the app read as a collection rather
  than as training. The grid is unchanged and un-demoted; it is still the best
  thing in the app for what it is for; it simply is not the front door.

  RecipeBrowser is deliberately rendered untouched: the 94 chapter pages render
  the very same component, and any change to its internals lands on all 95
  pages at once.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import RecipeBrowser from '$lib/components/RecipeBrowser.svelte';
	import { TOTALS } from '$lib/data';
	import { session } from '$lib/stores/session.svelte';

	/* Live, like the home bands' counts: a shelf that says how much is on it is
	   worth reading twice, and an empty Family Chapter should say so rather than
	   pretend. */
	const family = $derived(session.familyRecipes.length);
	const pantry = $derived(session.pantry.length);
</script>

<svelte:head><title>All Recipes · The World Table</title></svelte:head>

<!--
	The page's own h1. The layout renders the site name as an h1 ONLY on '/', so
	without this the library had no first-level heading at all; it inherited one
	from the home page it used to be. RecipeBrowser's own heading is an h2 that
	names the current chapter or filter, which is the level below this and stays
	where it is: the 94 chapter pages render the same component.
-->
<div class="shell libhead">
	<h1>The Library</h1>
	<p class="lede">
		All {TOTALS.recipes} dishes across {TOTALS.chapters} chapters, filterable by course,
		difficulty, diet and season.
	</p>

	<!--
		The rest of the Library, which the Library had no way of reaching.

		The layout's OWNS map gives the /recipes tab to /family, /pantry and
		/lexicon, and this page linked to none of the three. /family and /pantry
		each had exactly ONE inbound link in the whole app, both tiles on the home
		page, and both filed there under bands (Learn, Practise) that are not the
		tab that lights when you arrive. /lexicon is well linked but never once
		from a Library surface.

		A row here rather than a sixth mode tab: the bar already needs 463 px and
		clips Service and Library at every common iPhone width, so it cannot take
		another. Rather than the rail either, which is labelled Chapters and where
		these are not chapters; and rather than a new hub, which would demote the
		grid this page exists to be. The tiles match the home bands' shape because
		that is where a cook has seen them before.
	-->
	<nav class="shelf" aria-label="Elsewhere in the Library">
		<a href="{base}/family">
			The Family Chapter<small
				>{family
					? `${family} of your own dishes, in the grid with the rest`
					: 'Add the dishes your kitchen actually cooks'}</small
			>
		</a>
		<a href="{base}/pantry">
			Pantry Match<small
				>{pantry
					? `${pantry} ingredients ticked`
					: 'Cook from what is in the walk-in tonight'}</small
			>
		</a>
		<a href="{base}/lexicon">
			Chef's Lexicon<small>{TOTALS.lexicon} terms, with flashcards and a quiz</small>
		</a>
	</nav>
</div>

<RecipeBrowser />

<style>
	.libhead {
		padding-top: 22px;
	}
	.libhead h1 {
		font-size: var(--t-h1);
		margin-bottom: 6px;
	}
	.lede {
		font-size: var(--t-lede);
		color: var(--ink-soft);
		max-width: var(--measure);
	}

	/* The home bands' tile shape, rebuilt rather than imported: Svelte scopes
	   styles per component, so .oot-grid-links cannot travel. auto-fit means
	   three across on a desk and one per row on a phone with no breakpoint. */
	.shelf {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
		gap: var(--gap, 14px);
		margin-top: 16px;
	}
	.shelf a {
		display: block;
		padding: 14px 15px;
		border: var(--rule, 1px) solid var(--line);
		background: var(--card);
		color: var(--ink);
		text-decoration: none;
		border-radius: var(--radius);
	}
	.shelf a:hover,
	.shelf a:focus-visible {
		border-color: var(--turmeric);
	}
	.shelf small {
		display: block;
		margin-top: 5px;
		color: var(--muted);
		font-size: var(--t-small);
		line-height: 1.4;
	}
</style>
