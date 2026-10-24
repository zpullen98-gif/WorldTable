<script lang="ts">
	import { base } from '$app/paths';
	import type { resolveFoundation } from '$lib/foundations';
	import FoundationVisuals from './FoundationVisuals.svelte';
	let { reading }: { reading: ReturnType<typeof resolveFoundation> } = $props();
</script>

<div class="foundation-reading">
	<section><h3>In plain English</h3><p>{reading.definition}</p></section>
	{#if reading.guest}<section class="guest"><h3>At the table</h3><p>{reading.guest}</p></section>{/if}
	{#if reading.kitchen}<section><h3>In the kitchen</h3><p>{reading.kitchen}</p></section>{/if}
	{#if reading.compare}<section><h3>Tell them apart</h3><p>{reading.compare}</p></section>{/if}
	{#if reading.correction}<section class="clarification"><h3>A useful clarification</h3><p>{reading.correction}</p></section>{/if}
	<FoundationVisuals studyRef={reading.ref} />
	{#if reading.ref.startsWith('t:')}<p><a href="{base}/lexicon#{reading.ref.slice(2)}">Explore the full Lexicon entry</a></p>
	{:else if reading.ref.startsWith('c:')}<p><a href="{base}/flashcards?deck=deck-all&amp;card={reading.ref.slice(2)}&amp;run=1">Explore the original Floor Deck card</a></p>{/if}
	{#if reading.sources?.length}
		<details class="sources"><summary>Sources &amp; further reading</summary><ul>
			{#each reading.sources as source}<li><a href={source.url.startsWith('/') ? `${base}${source.url}` : source.url} target={source.url.startsWith('/') ? undefined : '_blank'} rel={source.url.startsWith('/') ? undefined : 'noopener noreferrer'}>{source.title}</a></li>{/each}
		</ul></details>
	{/if}
</div>

<style>
	.foundation-reading { display: grid; gap: 18px; overflow-wrap: anywhere; }
	section h3 { color: var(--turmeric-deep); font-family: var(--house-display, var(--display)); font-size: .86rem; letter-spacing: .04em; margin-bottom: 6px; }
	section p { max-width: 70ch; color: var(--ink-soft); line-height: 1.65; }
	.guest { padding: 16px 18px; border-left: 2px solid var(--turmeric-deep); background: color-mix(in srgb, var(--turmeric) 8%, var(--card)); }
	.guest p { color: var(--ink); font-size: 1.15rem; }
	.clarification { padding-top: 14px; border-top: 1px solid var(--line); }
	.sources { border-top: 1px solid var(--line); padding-top: 12px; }
	.sources summary { cursor: pointer; min-height: 44px; color: var(--ink-soft); }
	.sources ul { padding-left: 22px; display: grid; gap: 10px; }
	.sources a { text-underline-offset: 3px; }
</style>
