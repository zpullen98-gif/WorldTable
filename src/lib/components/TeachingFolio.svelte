<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { teachingFolioAlt, type TeachingFolio } from '$lib/teaching-folios';
	import { folioFocusStyle, validFolioFocus } from '$lib/folio-focus';
	import PlateIllustration from './PlateIllustration.svelte';
	let { folio }: { folio: TeachingFolio } = $props();
	let expanded = $state(false);
	let practising = $state(false);
	let recallIndex = $state(0);
	let answerShown = $state(false);
	let focusIndex = $state(-1);
	const focusViews = $derived(validFolioFocus(folio.focus, folio.subjects.length));
	const focus = $derived(focusViews[focusIndex]);
	const focusStyle = $derived(focus ? folioFocusStyle(focus, folio.image) : null);
	const recalled = $derived(folio.subjects[recallIndex]);
	const illustrationAlt = $derived(practising
		? answerShown
			? `${folio.title}. View ${recallIndex + 1}: ${recalled.name}. ${recalled.image}`
			: `${folio.title}. Illustrated recall for view ${recallIndex + 1} of ${folio.subjects.length}. The numbered key is hidden. Use Reveal this view to read its name and explanation.`
		: teachingFolioAlt(folio));
	function beginRecall() {
		practising = true;
		recallIndex = 0;
		answerShown = false;
		if (focusViews.length) focusIndex = 0;
	}
	function nextRecall() {
		recallIndex += 1;
		answerShown = false;
		if (focusViews.length) focusIndex = recallIndex;
	}
	function showView(index: number) {
		focusIndex = index;
		if (practising && index >= 0) {
			recallIndex = index;
			answerShown = false;
		}
	}
	$effect(() => {
		if (page.url.hash === `#folio-${folio.id}`) expanded = true;
	});
</script>

<details class="teaching-folio" id="folio-{folio.id}" bind:open={expanded}>
	<summary><span class="folio-title">{folio.title}</span><span class="folio-count">Illustrated study · {folio.subjects.length} numbered views</span></summary>
	<div class="folio-body">
		<p class="folio-intro">{folio.intro}</p>
		<p class="folio-scope">{folio.scope}</p>
		<div class="folio-recall" data-print="hide">
			{#if practising}
				<p>Ungraded recall · view {recallIndex + 1} of {folio.subjects.length}</p>
				<p class="recall-prompt">Name view {recallIndex + 1} and describe one detail that helps you recognise it. Say it aloud or think it through.</p>
				{#if answerShown}
					<div class="recall-answer" aria-live="polite"><strong>{recalled.name}</strong><p>{recalled.description}</p></div>
					{#if recallIndex + 1 < folio.subjects.length}<button class="chip" onclick={nextRecall}>Next view</button>{/if}
				{:else}
					<button class="chip" onclick={() => answerShown = true}>Reveal this view</button>
				{/if}
				<button class="chip" onclick={() => practising = false}>Return to the full key</button>
			{:else}
				<button class="chip" onclick={beginRecall}>Practise recall</button>
				<span>One numbered view at a time. No grade or change to your learning record.</span>
			{/if}
		</div>
		{#if focusViews.length}
			<div class="folio-focus-controls" role="group" aria-label="Choose an illustration view" data-print="hide">
				<button class="chip" aria-pressed={!focus} onclick={() => showView(-1)}>Whole illustration</button>
				{#each focusViews as _, index}
					<button class="chip" aria-pressed={focusIndex === index} onclick={() => showView(index)}>View {index + 1}</button>
				{/each}
			</div>
			<p class="focus-status" aria-live="polite" data-print="hide">{focus ? `Focused view ${focusIndex + 1} of ${focusViews.length}. Enlarge to explore the whole illustration.` : 'Whole illustration. Choose a view for a closer look.'}</p>
		{/if}
		<div class="folio-layout" class:landscape={folio.image.width > folio.image.height} class:recalling={practising}>
			<div class="folio-art" class:focused={!!focus} data-focus-view={focus ? focusIndex + 1 : 'whole'} style:--focus-aspect={focusStyle?.aspect} style:--focus-width={focusStyle?.width} style:--focus-height={focusStyle?.height} style:--focus-left={focusStyle?.left} style:--focus-top={focusStyle?.top}>
				<!-- Closed studies never request their image, even below the fold.
				     The readable key stays in the HTML and in the offline install. -->
				{#if expanded}
					<PlateIllustration src="{base}/{folio.image.src}" title={folio.title} alt={illustrationAlt} width={folio.image.width} height={folio.image.height} embedded guideLabel={focus ? `Close view ${focusIndex + 1}. Enlarge for the complete illustration.` : 'Read the numbered key beside or below the image.'} />
				{/if}
			</div>
			<ol class="folio-key" hidden={practising} aria-label="Numbered illustration key, read left to right from the top row">
				{#each folio.subjects as subject, index (subject.name)}
					<li><span class="folio-number" aria-hidden="true">{index + 1}</span><div><strong>{subject.name}</strong><p>{subject.description}</p></div></li>
				{/each}
			</ol>
		</div>
		{#if folio.learning && !practising}
			<div class="folio-learning">
				<dl>
					<div><dt>Observe</dt><dd>{folio.learning.observe}</dd></div>
					<div><dt>Explain</dt><dd>{folio.learning.explain}</dd></div>
					<div><dt>Apply</dt><dd>{folio.learning.apply}</dd></div>
				</dl>
				<details class="learning-question">
					<summary>Check your understanding</summary>
					<p>{folio.learning.question}</p>
					<details class="learning-answer"><summary>Reveal the explanation</summary><p>{folio.learning.answer}</p></details>
				</details>
			</div>
		{/if}
		<div class="folio-reading" role="group" aria-label="Continue learning about {folio.title}">
			{#each folio.links as link (link.href)}<a href="{base}{link.href}">{link.label}</a>{/each}
		</div>
		{#if folio.sources?.length}
			<details class="folio-sources">
				<summary>Sources and further reading</summary>
				<ul>{#each folio.sources as source (source.url)}<li><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<span class="source-window"> (opens in a new tab)</span></a></li>{/each}</ul>
			</details>
		{/if}
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
	.folio-recall { margin-bottom: 18px; padding: 12px; border: 1px solid var(--line); background: var(--paper-raised); font-size: var(--t-small); color: var(--ink-soft); }
	.folio-recall p { margin: 0 0 10px; line-height: 1.55; }
	.folio-recall .chip { min-height: 44px; margin: 2px 8px 2px 0; }
	.folio-recall > span { display: inline-block; margin-top: 5px; }
	.recall-prompt, .recall-answer strong { color: var(--ink); }
	.recall-answer { border-left: 2px solid var(--turmeric-deep); padding-left: 12px; margin-block: 12px; }
	.folio-key[hidden] { display: none; }
	@media print { .folio-key[hidden] { display: grid; } }
	.folio-layout { display: grid; gap: 20px; min-width: 0; }
	.folio-art { min-width: 0; width: 100%; max-width: 470px; margin-inline: auto; }
	.landscape .folio-art { max-width: 780px; }
	.folio-focus-controls { display: flex; flex-wrap: wrap; gap: 8px; }
	.folio-focus-controls .chip { min-width: 44px; min-height: 44px; }
	.folio-focus-controls .chip[aria-pressed='true'] { border-color: var(--turmeric-deep); color: var(--turmeric-deep); box-shadow: inset 0 0 0 1px var(--turmeric-deep); }
	.folio-focus-controls .chip:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: 3px; }
	.focus-status { margin: 8px 0 16px; color: var(--ink-soft); font-size: var(--t-small); line-height: 1.5; }
	/* Display a reviewed portion of the same source. The enlargement dialog
	   keeps the original image; recovery copy is never clipped. */
	.folio-art.focused :global(.illustration-box:not(.failed)) { position: relative; aspect-ratio: var(--focus-aspect); }
	.folio-art.focused :global(.illustration-box:not(.failed) > img) { position: absolute; width: var(--focus-width); height: var(--focus-height); max-width: none; left: var(--focus-left); top: var(--focus-top); object-fit: fill; }
	.folio-learning { margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--line); }
	.folio-learning dl { display: grid; gap: 12px; margin: 0; }
	.folio-learning dt { color: var(--turmeric-deep); font-family: var(--house-display); font-size: 1.15rem; font-weight: 600; }
	.folio-learning dd { color: var(--ink-soft); margin: 3px 0 0; line-height: 1.55; }
	.learning-question { margin-top: 14px; border-top: 1px solid var(--line); }
	.learning-question summary { padding-inline: 0; }
	.learning-question p { margin: 0 0 12px; line-height: 1.55; }
	.learning-answer { padding-left: 12px; border-left: 2px solid var(--turmeric-deep); }
	.learning-answer summary { color: var(--turmeric-deep); }
	@media print {
		.folio-art.focused :global(.illustration-box:not(.failed)) { aspect-ratio: var(--illustration-aspect); }
		.folio-art.focused :global(.illustration-box:not(.failed) > img) { position: static; width: 100%; height: 100%; object-fit: contain; }
	}
	.folio-key { list-style: none; padding: 0; margin: 0; display: grid; gap: 13px; align-content: start; }
	.folio-key li { display: flex; gap: 10px; min-width: 0; }
	.folio-number { flex: 0 0 28px; height: 28px; display: grid; place-items: center; border: 1px solid var(--house-frame); color: var(--turmeric-deep); font-variant-numeric: tabular-nums; }
	.folio-key strong { font-family: var(--house-display); font-size: 20px; font-weight: 600; }
	.folio-key p { margin: 4px 0 0; color: var(--ink-soft); line-height: 1.55; font-size: var(--t-small); }
	.folio-reading { display: flex; flex-wrap: wrap; gap: 6px 18px; padding-top: 16px; }
	.folio-reading a { display: inline-flex; align-items: center; min-height: 44px; color: var(--ink); font-size: var(--t-small); }
	.folio-sources { margin-top: 12px; border-top: 1px solid var(--line); font-size: var(--t-small); }
	.folio-sources summary { padding: 12px 0; }
	.folio-sources ul { margin: 0; padding-left: 20px; }
	.folio-sources a { display: inline-block; min-height: 44px; padding-block: 10px; color: var(--ink-soft); }
	.source-window { font-size: var(--t-micro); }
	@media (min-width: 900px) { .folio-layout:not(.landscape):not(.recalling) { grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); }.landscape .folio-key { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	@media (max-width: 420px) { summary { padding-inline: 12px; }.folio-body { padding-inline: 12px; }.folio-title { font-size: 19px; } }
</style>
