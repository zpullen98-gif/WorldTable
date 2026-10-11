<script lang="ts">
	import { base } from '$app/paths';
	import type { TeachingFolio } from '$lib/teaching-folios';
	let { folios, label = 'Illustrated studies' }: { folios: readonly TeachingFolio[]; label?: string } = $props();
</script>

{#if folios.length}
	<div class="folio-links" role="group" aria-label={label}>
		<p>{label}</p>
		<ul>{#each folios as folio (folio.id)}<li><a href="{base}/plates#folio-{folio.id}">{folio.title}<span aria-hidden="true"> →</span></a></li>{/each}</ul>
	</div>
{/if}

<style>
	.folio-links { margin-top: 16px; border-top: 1px solid var(--line); padding-top: 10px; text-align: left; }
	p { margin: 0; font-size: var(--t-small); color: var(--muted); }
	ul { list-style: none; padding: 0; margin: 4px 0 0; }
	a { display: inline-flex; align-items: center; min-height: 44px; color: var(--ink); font-size: var(--t-small); line-height: 1.5; }
	a span { margin-left: 8px; color: var(--turmeric-deep); }
</style>
