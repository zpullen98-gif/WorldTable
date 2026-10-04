<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { teachingFolioAlt, type TeachingFolio } from '$lib/teaching-folios';
	import PlateIllustration from './PlateIllustration.svelte';
	let { folio }: { folio: TeachingFolio } = $props();
	let expanded = $state(false);
	$effect(() => {
		if (page.url.hash === `#folio-${folio.id}`) expanded = true;
	});
</script>

<details class="teaching-folio" id="folio-{folio.id}" bind:open={expanded}>
	<summary><span class="folio-title">{folio.title}</span><span class="folio-count">Illustrated study · {folio.subjects.length} numbered views</span></summary>
	<div class="folio-body">
		<p class="folio-intro">{folio.intro}</p>
		<p class="folio-scope">{folio.scope}</p>
		<div class="folio-layout" class:landscape={folio.image.width > folio.image.height}>
			<div class="folio-art">
				<!-- Closed studies never request their image, even below the fold.
				     The readable key stays in the HTML and in the offline install. -->
				{#if expanded}
					<PlateIllustration src="{base}/{folio.image.src}" title={folio.title} alt={teachingFolioAlt(folio)} width={folio.image.width} height={folio.image.height} embedded guideLabel="Read the numbered key beside or below the image." />
				{/if}
			</div>
			<ol class="folio-key" aria-label="Numbered illustration key, read left to right from the top row">
				{#each folio.subjects as subject, index (subject.name)}
					<li><span class="folio-number" aria-hidden="true">{index + 1}</span><div><strong>{subject.name}</strong><p>{subject.description}</p></div></li>
				{/each}
			</ol>
		</div>
		<div class="folio-reading" role="group" aria-label="Continue learning about {folio.title}">
			{#each folio.links as link (link.href)}<a href="{base}{link.href}">{link.label}</a>{/each}
		</div>
	</div>
</details>

<style>
	.teaching-folio { margin: 14px 0; border: 1px solid var(--house-frame); border-radius: var(--radius); background: var(--card); scroll-margin-top: 18px; }
	summary { cursor: pointer; min-height: 44px; padding: 12px 16px; color: var(--ink); }
	summary:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: 3px; }
	.folio-title { font-family: var(--house-display); font-size: 21px; line-height: 1.35; }
	.folio-count { display: block; margin: 4px 0 0 18px; color: var(--muted); font-size: var(--t-small); }
	.folio-body { padding: 0 16px 16px; }
	.folio-intro { color: var(--ink); line-height: 1.55; margin: 8px 0; }
	.folio-scope { color: var(--ink-soft); font-size: var(--t-small); line-height: 1.6; margin: 8px 0 18px; }
	.folio-layout { display: grid; gap: 20px; min-width: 0; }
	.folio-art { min-width: 0; width: 100%; max-width: 470px; margin-inline: auto; }
	.landscape .folio-art { max-width: 780px; }
	.folio-key { list-style: none; padding: 0; margin: 0; display: grid; gap: 13px; align-content: start; }
	.folio-key li { display: flex; gap: 10px; min-width: 0; }
	.folio-number { flex: 0 0 28px; height: 28px; display: grid; place-items: center; border: 1px solid var(--house-frame); color: var(--turmeric-deep); font-variant-numeric: tabular-nums; }
	.folio-key strong { font-family: var(--house-display); font-size: 20px; font-weight: 600; }
	.folio-key p { margin: 4px 0 0; color: var(--ink-soft); line-height: 1.55; font-size: var(--t-small); }
	.folio-reading { display: flex; flex-wrap: wrap; gap: 6px 18px; padding-top: 16px; }
	.folio-reading a { display: inline-flex; align-items: center; min-height: 44px; color: var(--ink); font-size: var(--t-small); }
	@media (min-width: 900px) { .folio-layout:not(.landscape) { grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); }.landscape .folio-key { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	@media (max-width: 420px) { summary { padding-inline: 12px; }.folio-body { padding-inline: 12px; }.folio-title { font-size: 19px; } }
</style>
