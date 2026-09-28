<script lang="ts">
	import { base } from '$app/paths';
	import { displayName } from '$lib/plates';
	import type { Plate } from '$lib/types';

	let { plate }: { plate: Plate } = $props();
	let expanded = $state(false);
	const edge = $derived([plate.tagline, ...plate.corners, plate.regionLine, plate.footer].filter((s): s is string => Boolean(s)));
	$effect(() => { void plate.slug; expanded = false; });
</script>

<details class="poster-archive" bind:open={expanded}>
	<summary>
		<span>Original poster archive</span>
		<small>{plate.count} original entries · {plate.corrections.length} recorded corrections</small>
	</summary>
	<div class="archive-body">
		<p class="archive-note">This is the earlier poster and its original transcription, preserved for reference. Some lettering was unclear. The historical correction notes are retained as recorded and can contain unresolved or conflicting claims; they are not a new verification of the poster. Use the six subject teaching guide above for the current lesson and self-check.</p>
		<a class="archive-image" href="{base}/plates/archive/{plate.slug}.webp" target="_blank" rel="noopener">View the original poster <span class="sr-only">in a new tab</span></a>
		{#if plate.corrections.length}
			<section class="archive-corrections" aria-labelledby="archive-corrections-h">
				<h3 id="archive-corrections-h">Recorded correction notes</h3>
				<ul>
					{#each plate.corrections as c (c.on + c.says)}
						<li><strong>{c.on}</strong> <span class="says">prints “{c.says}”.</span> {c.should}<span class="why">{c.why}</span></li>
					{/each}
				</ul>
			</section>
		{/if}
		<section class="archive-text" aria-labelledby="archive-text-h">
			<h3 id="archive-text-h">Original transcription</h3>
			<p class="archive-note">Names and facts below follow the earlier poster, including claims questioned in the historical notes.</p>
			{#each plate.groups as g, gi (gi)}
				{#if g.title}<h4>{g.title}</h4>{/if}
				{#if g.note}<p class="group-note">{g.note}</p>{/if}
				<ul class="items">
					{#each g.items as it (displayName(it))}
						<li>
							<strong class="name">{it.name}{#if it.sub}<span class="sub"> ({it.sub})</span>{/if}</strong>
							{#if it.printed}<span class="printed">printed “{it.printed}”</span>{/if}
							<dl>{#each it.facts.filter(f => f[1].trim()) as f (f[0])}<div><dt>{f[0]}</dt><dd>{f[1]}</dd></div>{/each}</dl>
							{#if it.links?.deck || it.links?.lexicon}
								<span class="links">
									{#if it.links.deck}<a href="{base}/service/deck/study?card={it.links.deck}">The card<span class="sr-only"> for {it.name}</span></a>{/if}
									{#if it.links.lexicon}<a href="{base}/lexicon#{it.links.lexicon}">The Lexicon<span class="sr-only"> entry for {it.name}</span></a>{/if}
								</span>
							{/if}
						</li>
					{/each}
				</ul>
			{/each}
		</section>
		{#if plate.panels.length}
			<section class="archive-panels" aria-labelledby="archive-panels-h">
				<h3 id="archive-panels-h">Original side panels</h3>
				{#each plate.panels as panel (panel.title)}
					<h4>{panel.title}</h4>
					<ul>{#each panel.lines as line, i (i)}<li>{line}</li>{/each}</ul>
				{/each}
			</section>
		{/if}
		{#if edge.length}<p class="edge">Printed around the edge: {edge.join(' · ')}</p>{/if}
	</div>
</details>

<style>
	.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
	.poster-archive { margin-top: 32px; border: 1px solid var(--line-strong); border-radius: 3px; background: var(--paper-raised); }
	summary { cursor: pointer; padding: 18px 20px; min-height: 44px; color: var(--ink); }
	summary > span { font-family: var(--house-display); font-size: 17px; }
	summary small { display: block; margin-top: 5px; margin-left: 18px; color: var(--muted); font-size: var(--t-small); }
	.archive-body { border-top: 1px solid var(--line); padding: 20px; }
	.archive-note { font-size: var(--t-small); color: var(--ink-soft); max-width: var(--measure); line-height: 1.65; }
	.archive-image { display: inline-flex; align-items: center; min-height: 44px; color: var(--ink); font-size: var(--t-small); margin: 6px 0 12px; }
	section { margin-top: 22px; }
	h3 { font-family: var(--house-display); font-weight: 500; font-size: 21px; margin: 0 0 10px; }
	h4 { font-family: var(--display); font-size: 20px; margin: 19px 0 5px; }
	.archive-corrections ul, .items { list-style: none; padding: 0; margin: 0; }
	.archive-corrections li { border-left: 2px solid var(--turmeric-deep); padding: 8px 14px; margin: 0 0 12px; line-height: 1.55; }
	.says, .why, .group-note, .printed { color: var(--muted); }
	.why { display: block; font-size: var(--t-small); margin-top: 5px; }
	.group-note { font-size: var(--t-small); }
	.items li { padding: 13px 0; border-bottom: 1px solid var(--line); }
	.name { font-family: var(--display); font-weight: 600; font-size: 20px; }
	.sub { color: var(--ink-soft); font-size: 17px; font-weight: 400; }
	.printed { font-size: var(--t-small); margin-left: 8px; }
	dl { margin: 5px 0; font-size: var(--t-small); color: var(--ink-soft); }
	dl > div { display: flex; flex-wrap: wrap; column-gap: 8px; }
	dt { font-weight: 600; } dd { margin: 0; }
	.links { display: flex; flex-wrap: wrap; gap: 0 18px; }
	.links a { display: inline-flex; align-items: center; min-height: 44px; font-size: var(--t-small); color: var(--ink); }
	.archive-panels ul { margin: 6px 0 16px; padding-left: 20px; color: var(--ink-soft); }
	.edge { margin-top: 20px; color: var(--muted); font-size: var(--t-small); font-style: italic; }
	@media (max-width: 520px) { summary { padding: 16px; }.archive-body { padding: 16px; }.archive-corrections li { padding-inline: 10px; } }
</style>
