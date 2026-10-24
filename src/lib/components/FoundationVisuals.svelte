<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { loadPlates } from '$lib/data';
	import { plateIndexes, type PlateIndexes } from '$lib/plates';
	import { foliosForStudyRef, plateForStudyRef } from '$lib/visual-study-links';
	import TeachingFolio from './TeachingFolio.svelte';
	let { studyRef }: { studyRef: string } = $props();
	let indexes = $state<PlateIndexes | null>(null);
	let failed = $state(false);
	let loading = $state(false);
	const folios = $derived(foliosForStudyRef(studyRef));
	const plate = $derived(plateForStudyRef(studyRef, indexes));
	async function load() {
		failed = false;
		loading = true;
		try { indexes = plateIndexes(await loadPlates()); }
		catch { failed = true; }
		finally { loading = false; }
	}
	onMount(() => { void load(); });
</script>

{#if folios.length || plate || failed}
	<section class="foundation-visuals" aria-label="Illustrated field notes">
		<h3>Look more closely</h3>
		{#key studyRef}
			{#each folios as folio (folio.id)}<TeachingFolio {folio} />{/each}
		{/key}
		{#if plate}<a class="plate-door" href="{base}/plates/{plate.slug}">See the ingredient study: {plate.title}</a>{/if}
		{#if failed}<p class="note">The ingredient-study links could not open. Your reading is still available.</p><button class="chip" disabled={loading} onclick={load}>{loading ? 'Opening studies…' : 'Try the study links again'}</button>{/if}
	</section>
{/if}

<style>
	.foundation-visuals { border-top: 1px solid var(--line); padding-top: 14px; min-width: 0; }
	h3 { margin: 0 0 6px; font-family: var(--house-display, var(--display)); color: var(--turmeric-deep); font-size: 1.2rem; }
	.plate-door { display: inline-flex; align-items: center; min-height: 44px; color: var(--ink); line-height: 1.5; text-underline-offset: 3px; }
	.note { color: var(--ink-soft); line-height: 1.5; }
</style>
