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
</script>

<svelte:head><title>All Recipes — The World Table</title></svelte:head>

<RecipeBrowser />
