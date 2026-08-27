<!--
  The library, at its own address.

  This was the home page. The World Table opened onto 970 cards, which is a
  superb way to FIND a dish and the reason the app read as a collection rather
  than as training. The grid is unchanged and un-demoted — it is still the best
  thing in the app for what it is for — it simply is not the front door.

  RecipeBrowser is deliberately rendered untouched: the 94 chapter pages render
  the very same component, and any change to its internals lands on all 95
  pages at once.
-->
<script lang="ts">
	import RecipeBrowser from '$lib/components/RecipeBrowser.svelte';
	import { TOTALS } from '$lib/data';
</script>

<svelte:head><title>All Recipes — The World Table</title></svelte:head>

<!--
	The page's own h1. The layout renders the site name as an h1 ONLY on '/', so
	without this the library had no first-level heading at all — it inherited one
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
</style>
