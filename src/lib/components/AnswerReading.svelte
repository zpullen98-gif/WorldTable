<script lang="ts">
	import { base } from '$app/paths';
	import type { AnswerReading } from '$lib/house-answer-reading';
	let { reading, open = $bindable(false) }: { reading: AnswerReading | null; open?: boolean } = $props();
</script>

{#if reading}
	<details class="answer-reading" bind:open>
		<summary>Learn why<span>Full explanation and related learning</span></summary>
		<div class="reading-content">
			<h2>{reading.title}</h2>
			{#if reading.sections.length}
				{#each reading.sections as section, i (i)}
					<section><h3>{section.title}</h3>{#each section.paragraphs as paragraph, j (j)}<p>{paragraph}</p>{/each}</section>
				{/each}
			{:else}<p>The answer is recorded, but this record has no fuller explanation yet. Ask the team for the context before expanding your tableside description.</p>{/if}
			{#if reading.links.length}
				<nav aria-label="Continue learning about this answer">{#each reading.links as link (link.href)}<a href="{base}{link.href}">{link.label}</a>{/each}</nav>
				<p class="return-note">Use Back to return to this answer. Opening a reading does not grade another question.</p>
			{/if}
		</div>
	</details>
{/if}

<style>
	.answer-reading { margin: 16px 0; border: 1px solid var(--house-frame, var(--line)); border-radius: var(--radius); background: var(--paper-raised, var(--card)); }
	summary { min-height: 48px; padding: 12px 16px; cursor: pointer; color: var(--ink); font-weight: 600; }
	summary span { display: block; margin-top: 4px; color: var(--ink-soft); font-size: var(--t-small); font-weight: 400; }
	summary:focus-visible, a:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: 3px; }
	.reading-content { padding: 0 16px 16px; overflow-wrap: anywhere; }
	h2 { font-family: var(--house-display, var(--display)); font-size: 24px; margin: 8px 0 16px; }
	section { margin: 16px 0; }
	h3 { font-size: 16px; margin: 0 0 8px; color: var(--ink); }
	p { line-height: 1.65; margin: 7px 0; color: var(--ink-soft); white-space: pre-wrap; }
	nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
	a { display: inline-flex; align-items: center; min-height: 44px; padding: 8px 12px; border: 1px solid var(--line); border-radius: var(--radius); color: var(--ink); }
	.return-note { font-size: var(--t-small); }
</style>
