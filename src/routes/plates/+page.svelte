<!-- Art loads on demand. The teaching guide and original archive remain available offline. -->
<script lang="ts">
	import { base } from '$app/paths';
	import { plateHref } from '$lib/plates';
	import TeachingFolio from '$lib/components/TeachingFolio.svelte';
	import { TEACHING_FOLIOS } from '$lib/teaching-folios';
	let { data } = $props();
	let failedImages = $state<Record<string, boolean>>({});
	function imageStatus(node: HTMLImageElement, slug: string) {
		if (node.complete && node.naturalWidth === 0) failedImages[slug] = true;
	}
	const byKind = $derived(data.kinds.map(k => ({ ...k, plates: data.plates.filter(p => p.kind === k.key) })).filter(k => k.plates.length));
</script>

<svelte:head><title>The Plates · The World Table</title></svelte:head>

<div class="shell view">
	<p class="eyebrow">The illustrated field library</p>
	<h1>The Plates</h1>
	<p class="lede">Look closely at the cuts, the fish case, the regional larder, the pantry and the board. Each plate pairs six illustrated subjects with a readable teaching guide and a quiet self-check.</p>
	<p class="note">{data.plates.length} plates · {data.plates.reduce((n, p) => n + p.subjects, 0)} illustrated subjects · read, never graded. All {data.plates.reduce((n, p) => n + p.count, 0)} entries from the original posters remain in their archives, with the recorded corrections.</p>
	{#each byKind as kind (kind.key)}
		<section class="kind">
			<h2>{kind.title}</h2>
			<p class="secnote">{kind.blurb}</p>
			<ul class="wall">
				{#each kind.plates as plate (plate.slug)}
					<li>
						<a href={plateHref(base, plate.slug)}>
							<span class="thumb" style:aspect-ratio="{plate.image.width} / {plate.image.height}">
								{#if failedImages[plate.slug]}
									<span class="thumb-fallback"><span aria-hidden="true">✦</span>Illustration unavailable<br />The guide is ready to read</span>
								{:else}
									<img use:imageStatus={plate.slug} src="{base}/{plate.image.thumb}" alt="" loading="lazy" decoding="async" width={plate.image.width} height={plate.image.height} onerror={() => failedImages[plate.slug] = true} />
								{/if}
							</span>
							<span class="ptitle">{plate.title}</span>
							<span class="pmeta">{[plate.levelName, plate.subjects + ' illustrated subjects'].filter(Boolean).join(' · ')}</span>
							<span class="plate-focus">{plate.intro}</span>
							<span class="read-plate">Explore the plate <span aria-hidden="true">→</span></span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
	<section class="kind companion-studies" aria-labelledby="companion-studies-h">
		<h2 id="companion-studies-h">At the stove</h2>
		<p class="secnote">Five practical companion studies for the Brennan’s menu and the wider kitchen. Open a folio to compare the artwork with its numbered key. These studies sit alongside the twenty reference plates and carry no quiz or grade.</p>
		{#each TEACHING_FOLIOS as folio (folio.id)}<TeachingFolio {folio} />{/each}
	</section>
</div>

<style>
	.view { padding-block: 26px 80px; max-width: 1180px; }
	.eyebrow { font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; color: var(--turmeric-deep); }
	h1 { font-family: var(--house-display); font-size: clamp(32px, 5vw, 52px); font-weight: 500; line-height: 1.25; margin: 8px 0 16px; }
	.lede { font-size: var(--t-lede); color: var(--ink-soft); max-width: var(--measure); line-height: 1.6; }
	.note { margin-top: 12px; font-size: var(--t-small); color: var(--muted); max-width: 78ch; line-height: 1.6; }
	.kind { margin-top: 36px; padding-top: 23px; border-top: 1px solid var(--house-frame); }
	.kind h2 { font-family: var(--house-display); font-weight: 500; font-size: 28px; margin-bottom: 8px; }
	.secnote { color: var(--ink-soft); max-width: var(--measure); font-size: var(--t-small); margin-bottom: 18px; }
	.wall { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(245px, 1fr)); gap: 22px; }
	.wall a { display: flex; flex-direction: column; height: 100%; text-decoration: none; color: var(--ink); border: var(--rule) solid var(--line); border-radius: var(--radius); background: var(--card); padding: 12px; min-height: 44px; }
	.wall a:hover { border-color: var(--turmeric-deep); }.wall a:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: 3px; }
	.thumb { display: grid; width: 100%; background: var(--paper-raised); border: 1px solid var(--house-frame); border-radius: var(--radius); overflow: hidden; }
	.thumb img { display: block; width: 100%; height: 100%; object-fit: contain; }
	.thumb-fallback { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 18px; text-align: center; font-size: var(--t-small); color: var(--ink-soft); }.thumb-fallback > span { color: var(--turmeric-deep); font-size: 28px; margin-bottom: 12px; }
	.ptitle { display: block; margin-top: 17px; font-family: var(--house-display); font-size: 21px; font-weight: 500; line-height: 1.4; }
	.pmeta { display: block; margin-top: 5px; font-size: var(--t-small); color: var(--muted); font-variant-numeric: tabular-nums; }
	.plate-focus { display: block; margin-top: 12px; font-size: 17px; line-height: 1.55; color: var(--ink-soft); }
	.read-plate { display: block; padding-top: 17px; margin-top: auto; font-family: var(--house-display); font-size: 12px; letter-spacing: .04em; color: var(--turmeric-deep); }
	@media (max-width: 560px) { .wall { grid-template-columns: minmax(0, 1fr); }.kind h2 { font-size: 25px; }.thumb { max-height: 450px; }.secnote { font-size: 16px; } }
</style>
