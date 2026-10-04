<script lang="ts">
	import { TEACHING_FOLIOS, TEACHING_FOLIO_GROUPS } from '$lib/teaching-folios';
	import TeachingFolio from './TeachingFolio.svelte';
</script>

{#each TEACHING_FOLIO_GROUPS as group (group.id)}
	<section class="folio-group" aria-labelledby="folio-group-{group.id}">
		<h3 id="folio-group-{group.id}">{group.title}</h3>
		<p>{group.intro}</p>
		{#each TEACHING_FOLIOS.filter(folio => folio.group === group.id) as folio (folio.id)}<TeachingFolio {folio} />{/each}
	</section>
{/each}

<style>
	.folio-group { margin-top: 26px; }
	h3 { margin: 0 0 6px; font-family: var(--house-display); font-weight: 500; font-size: 23px; line-height: 1.35; color: var(--ink); }
	p { margin: 0 0 12px; color: var(--ink-soft); font-size: var(--t-small); line-height: 1.5; max-width: var(--measure); }
</style>
