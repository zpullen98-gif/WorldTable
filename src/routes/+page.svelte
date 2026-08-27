<!--
  The home page is a course with a library under it, rather than a library
  alone. HomeBands carries the shared four-band shape; RecipeBrowser is
  untouched below, which matters because the 94 chapter pages render the very
  same component and must not change.
-->
<script lang="ts">
	import RecipeBrowser from '$lib/components/RecipeBrowser.svelte';
	import HomeBands from '$lib/components/HomeBands.svelte';

	let { data } = $props();
</script>

<HomeBands
	curriculum={data.curriculum}
	lexiconTotal={data.lexiconTotal}
	techniqueTotal={data.techniqueTotal}
	recipeTotal={data.recipeTotal}
/>

<RecipeBrowser />
