<!--
  A list of the house's videos: the Watch block on a dish's card and each
  topic in the study view's Videos entry. A video is a link out and never a
  player: the title opens YouTube or Vimeo in a new tab (rel noopener), the
  page embeds nothing and plays nothing, and the line under the heading says
  a video needs a connection. The art is the card's: the display face for
  the title, the soft ink for the small line, the dotted rule between rows.
-->
<script lang="ts">
	import { say, type VideoRow } from '$lib/study';

	let {
		rows,
		showFor = false,
		onOpen
	}: {
		rows: readonly VideoRow[];
		/** Name the items each video teaches (the study view's list); a card leaves it out. */
		showFor?: boolean;
		/** Open a dish's card from the list; a drink or a wine is named in words. */
		onOpen?: (id: string) => void;
	} = $props();
</script>

<ul class="videos">
	{#each rows as r (r.video.id)}
		<li data-video={r.video.id}>
			<a class="vt" href={r.video.url} target="_blank" rel="noopener">{r.video.title}<span class="vh"> {say('newTab')}</span></a>
			{#if r.meta}<span class="meta">{r.meta}</span>{/if}
			{#if r.video.why}<span class="why">{r.video.why}</span>{/if}
			{#if showFor && r.items.length}
				<span class="for">
					For
					{#each r.items as it, i (it.id)}{#if i > 0}{', '}{/if}{#if onOpen && it.kind === 'dish'}<button class="linkish" onclick={() => onOpen(it.id)}>{it.name}</button>{:else}{it.name}{/if}{/each}
				</span>
			{/if}
		</li>
	{/each}
</ul>

<style>
	.videos { list-style: none; margin: 0; padding: 0; }
	.videos li { padding: 8px 0; border-bottom: 1px dotted var(--line); line-height: 1.5; }
	.vt {
		display: inline-flex; align-items: center; min-height: 44px;
		font-family: var(--display); font-size: 1.1rem; line-height: 1.3;
		color: var(--ink); text-underline-offset: 3px;
	}
	.vt:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: 2px; }
	.meta, .why, .for { display: block; margin-top: 2px; }
	.meta { color: var(--muted); font-size: 1rem; }
	.why { color: var(--ink-soft); max-width: var(--measure); }
	.for { color: var(--ink-soft); }
	.linkish {
		background: none; border: 0; padding: 0; min-height: 44px; font: inherit;
		color: var(--ink); text-decoration: underline; text-underline-offset: 3px; cursor: pointer;
	}
	.vh {
		position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
		overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
	}
</style>
