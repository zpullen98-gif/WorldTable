<script lang="ts">
	import RecipeBrowser from '$lib/components/RecipeBrowser.svelte';
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.chapter.name} | The World Table</title>
</svelte:head>

<!--
	headingLevel="h1": +layout.svelte promotes the brandline to an h1 only on
	'/', so without this every one of the 171 chapter pages had zero
	first-level headings - the outline began at RecipeBrowser's own heading,
	an h2 reading "Chapters" (the rail's eyebrow) then another h2 for the
	chapter name. /recipes fixed this for itself with its own page h1
	("The Library") and left RecipeBrowser's shared heading at h2 for that
	page; chapter pages have no page h1 of their own; this IS it.
-->
<RecipeBrowser chapter={data.chapter} headingLevel="h1" />
