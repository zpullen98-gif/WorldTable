<!--
  The front door is a dashboard now, not a search result.

  The grid moved to /recipes. It was the whole of this page, and it is why the
  app read as a collection of world recipes rather than as training: you landed
  on 970 cards and were left to browse. HomeBands is what remains, and it is
  what grows.

  The legacy-query redirect below is not decoration. Links to /?q=... exist in
  the wild (the regression suite shipped one), and a prerendered page may not
  read url.searchParams at load (see CLAUDE.md's first Convention), so this
  cannot be a redirect in +page.ts. It runs in onMount rather than an effect for
  the same reason RecipeBrowser seeds its filters there: a reactive read would
  chase the URL write-back.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import HomeBands from '$lib/components/HomeBands.svelte';

	let { data } = $props();

	onMount(() => {
		const search = page.url.search;
		if (search && search.length > 1) {
			void goto(`${base}/recipes${search}`, { replaceState: true });
		}
	});
</script>

<HomeBands
	curriculum={data.curriculum}
	lexiconTotal={data.lexiconTotal}
	techniqueTotal={data.techniqueTotal}
	recipeTotal={data.recipeTotal}
/>
