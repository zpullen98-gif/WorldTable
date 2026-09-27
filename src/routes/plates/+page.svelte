<!--
  The wall: twenty reference plates in five rows, each a picture the reader
  opens on demand and a transcription that came with the app.

  The thumbnails load lazily and are never precached; a wall opened offline
  before any plate was seen shows the titles, the counts and the level each
  is read at, which is the index a reader needs to choose one. The full
  plate, once opened, is kept by the worker (vite.config.ts, plates-v1), so
  a plate read once reads again in a walk-in.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { plateHref } from '$lib/plates';

	let { data } = $props();

	const byKind = $derived(
		data.kinds
			.map((k) => ({ ...k, plates: data.plates.filter((p) => p.kind === k.key) }))
			.filter((k) => k.plates.length)
	);
</script>

<svelte:head><title>The Plates · The World Table</title></svelte:head>

<div class="shell view">
	<nav class="crumbs"><a href="{base}/">Home</a></nav>
	<h1>The Plates</h1>
	<p class="lede">
		Twenty reference plates to read before the deck and beside it: the cuts, the fish case, the
		larder of five regions, the pantry and the board. Each is a picture and its full text, so it
		reads, searches and quizzes with or without the picture. Where a plate gets a fact wrong, the
		correction is printed under it.
	</p>
	<p class="note">
		{data.plates.length} plates · read, never graded. A plate opens its picture when you open it,
		and keeps it for next time.
	</p>

	{#each byKind as k (k.key)}
		<section class="kind">
			<h2>{k.title}</h2>
			<p class="secnote">{k.blurb}</p>
			<ul class="wall">
				{#each k.plates as p (p.slug)}
					<li>
						<a href={plateHref(base, p.slug)}>
							<span class="thumb" style="aspect-ratio: {p.image.width} / {p.image.height}">
								<img src="{base}/{p.image.thumb}" alt="" loading="lazy" decoding="async" width={p.image.width} height={p.image.height} />
							</span>
							<span class="ptitle">{p.title}</span>
							<span class="pmeta">
								{[p.levelName, `${p.count} on the plate`, p.corrections ? `${p.corrections} correction${p.corrections === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · ')}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	.view { padding-block: 26px 80px; max-width: 980px; }
	.crumbs { font-size: var(--t-small); margin-bottom: 8px; }
	.crumbs a { display: inline-block; padding-block: 10px; color: var(--muted); }
	h1 { font-size: var(--t-h1); margin-bottom: 8px; }
	.lede { font-size: var(--t-lede); color: var(--ink-soft); max-width: var(--measure); }
	.note { margin-top: 8px; font-size: var(--t-small); color: var(--muted); }
	.kind { margin-top: 28px; padding-top: 14px; border-top: 1px solid var(--line); }
	.kind h2 { font-family: var(--display); font-size: var(--t-h3); margin-bottom: 4px; }
	.secnote { color: var(--ink-soft); max-width: var(--measure); font-size: var(--t-small); margin-bottom: 12px; }
	.wall {
		list-style: none; margin: 0; padding: 0;
		display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--gap);
	}
	.wall a {
		display: block; text-decoration: none; color: var(--ink);
		border: var(--rule) solid var(--line); border-radius: var(--radius); background: var(--card);
		padding: 10px; min-height: 44px;
	}
	.wall a:hover { border-color: var(--turmeric-deep); }
	.wall a:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: 2px; }
	.thumb { display: block; width: 100%; background: var(--paper-raised); border-radius: var(--radius); overflow: hidden; }
	.thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
	.ptitle { display: block; margin-top: 10px; font-family: var(--display); font-size: var(--t-h4); line-height: 1.2; }
	.pmeta { display: block; margin-top: 4px; font-size: var(--t-small); color: var(--muted); font-variant-numeric: tabular-nums; }
</style>
