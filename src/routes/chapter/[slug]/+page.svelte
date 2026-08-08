<script lang="ts">
	import RecipeBrowser from '$lib/components/RecipeBrowser.svelte';
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.chapter.name} — The World Table</title>
</svelte:head>

<RecipeBrowser chapter={data.chapter} />
