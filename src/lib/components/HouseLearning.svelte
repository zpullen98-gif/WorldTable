<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import type { House } from '$lib/house/house-schema';
	import { cuisine } from '$lib/stores/cuisine.svelte';
	import { foundationsCategories, foundationsEntries } from '$lib/foundations';
	import { BRENNANS_HOUSE_ID, TEACHING_FOLIOS } from '$lib/teaching-folios';
	import { say, studyRows, studyVideos, type StudyRow, type VideoRow } from '$lib/study';
	import TeachingFolioCollection from './TeachingFolioCollection.svelte';
	import VideoList from './VideoList.svelte';

	let {
		current,
		open = $bindable({}),
		onOpen
	}: {
		current: House;
		/** The page retains these disclosures when a dish card is opened. */
		open?: Record<string, boolean>;
		onOpen: (id: string, list: readonly StudyRow[], from?: string) => void;
	} = $props();

	const chapters = $derived((cuisine.index?.chapters ?? []).filter(chapter => chapter.file && chapter.entries > 0));
	const allRows = $derived(studyRows(current, 'dish'));
	const videoGroups = $derived(studyVideos(current));
	const videoCount = $derived(videoGroups.reduce((total, group) => total + group.rows.length, 0));

	onMount(() => { void cuisine.load(); });

	/* VideoList remains the shared renderer. Add stable return-focus markers
	   here so the page can reopen the same disclosure and find its dish button. */
	let videoOpener = '';
	function videoFocus(node: HTMLElement, rows: readonly VideoRow[]) {
		function mark(list: readonly VideoRow[]) {
			for (const row of list) {
				const video = node.querySelector(`[data-video="${CSS.escape(row.video.id)}"]`);
				const dishes = row.items.filter(item => item.kind === 'dish');
				video?.querySelectorAll<HTMLButtonElement>('.for button').forEach((button, index) => {
					const dish = dishes[index];
					if (dish) button.dataset.focus = `learning-video:${row.video.id}:${dish.id}`;
				});
			}
		}
		function remember(event: MouseEvent) {
			const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-focus]') : null;
			videoOpener = button && node.contains(button) ? button.dataset.focus ?? '' : '';
		}
		mark(rows);
		node.addEventListener('click', remember, true);
		return {
			update: mark,
			destroy() { node.removeEventListener('click', remember, true); }
		};
	}

	function openDish(id: string) {
		const from = videoOpener ? `[data-focus="${CSS.escape(videoOpener)}"]` : '#videos-h';
		videoOpener = '';
		onOpen(id, allRows, from);
	}
</script>

<div class="house-learning">
	<p class="intro">Choose an ingredient or dish, learn the method, then practise explaining it to a guest.</p>

	<details class="learning-group" bind:open={open.cooking}>
		<summary id="cooking-h"><h2 class="summary-line"><span class="title">Cooking lessons</span><span class="count">{cuisine.index ? `${chapters.length} chapters` : 'Cuisine'}</span></h2></summary>
		<div class="body">
			<nav class="quiet" aria-labelledby="cooking-h">
				<a class="door lead" href="{base}/cuisine" data-door="cuisine">
					<span class="door-name">Cuisine</span>
					<span class="door-line">French and Creole cooking in depth: today's cards, the drills, the two diagrams.</span>
				</a>
				{#each chapters as chapter (chapter.key)}
					<a class="door" href="{base}/cuisine?ch={encodeURIComponent(chapter.key)}" data-chapter={chapter.key}>
						<span class="door-name">{chapter.title}</span>
						<span class="door-line">{chapter.intro}</span>
						<span class="door-sub">{chapter.entries} {chapter.entries === 1 ? 'entry' : 'entries'} · {chapter.cards} {chapter.cards === 1 ? 'card' : 'cards'}</span>
					</a>
				{/each}
			</nav>
			{#if !cuisine.index}
				<p class="note" role="status">{cuisine.failed ? 'The chapters could not be read here; the door above still opens Cuisine.' : 'Opening Cuisine…'}</p>
			{/if}
		</div>
	</details>

	<details class="learning-group" bind:open={open.terms}>
		<summary id="terms-h"><h2 class="summary-line"><span class="title">Culinary terms</span><span class="count">{foundationsEntries.length} terms · {foundationsCategories.length} subjects</span></h2></summary>
		<div class="body">
			<nav class="quiet" aria-labelledby="terms-h">
				<a class="door lead" href="{base}/foundations" data-door="foundations">
					<span class="door-name">The Kitchen Fieldbook</span>
					<span class="door-line">Clear definitions, kitchen understanding and guest descriptions from your study sheets.</span>
				</a>
			</nav>
			<nav class="subjects" aria-label="The subjects">
				{#each foundationsCategories as category (category.id)}
					<a class="chip" href="{base}/foundations?category={encodeURIComponent(category.id)}">{category.title}</a>
				{/each}
				<a class="chip go" href="{base}/flashcards?deck=foundations%3Atoday">Practise today's terms</a>
			</nav>
		</div>
	</details>

	{#if current.id === BRENNANS_HOUSE_ID}
		<details class="learning-group" id="illustrated-kitchen-studies" bind:open={open.studies}>
			<summary id="studies-h"><h2 class="summary-line"><span class="title">Illustrated kitchen studies</span><span class="count">{TEACHING_FOLIOS.length} studies</span></h2></summary>
			<div class="body"><TeachingFolioCollection /></div>
		</details>
	{/if}

	{#if videoCount}
		<details class="learning-group" id="study-videos" bind:open={open.videos}>
			<summary id="videos-h"><h2 class="summary-line"><span class="title">Service videos</span><span class="count">{videoCount} {videoCount === 1 ? 'video' : 'videos'}</span></h2></summary>
			<div class="body">
				<p class="note">{say('videoNote')}</p>
				{#each videoGroups as group (group.topic)}
					<section class="video-group" aria-label={group.topic} use:videoFocus={group.rows}>
						<h3>{group.topic} · {group.rows.length}</h3>
						<VideoList rows={group.rows} showFor onOpen={openDish} />
					</section>
				{/each}
			</div>
		</details>
	{/if}
</div>

<style>
	.house-learning { margin-block: 10px 20px; min-width: 0; }
	.intro { margin: 0 0 12px; max-width: var(--measure); color: var(--ink-soft); line-height: 1.5; }
	.learning-group { margin-block: 8px; border: 1px solid var(--house-frame, var(--line-strong)); border-radius: var(--radius); background: var(--house-panel, var(--card)); }
	.learning-group > summary { min-height: 48px; padding: 11px 12px; box-sizing: border-box; cursor: pointer; color: var(--ink); }
	.learning-group > summary::marker { color: var(--turmeric-deep); }
	.learning-group > summary:focus-visible, .door:focus-visible, .chip:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: 2px; }
	.summary-line { display: inline-flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 2px 12px; width: calc(100% - 20px); vertical-align: top; margin: 0; font: inherit; color: inherit; }
	.title { font-family: var(--house-display, var(--display)); font-size: 1.25rem; line-height: 1.3; }
	.count { color: var(--ink-soft); font-size: 1rem; line-height: 1.4; }
	.body { padding: 0 14px 14px; min-width: 0; }
	.quiet { display: grid; gap: 0; }
	.door { display: flex; flex-direction: column; gap: 3px; min-height: 44px; box-sizing: border-box; padding: 12px 0; border-bottom: 1px solid var(--line); color: var(--ink); text-decoration: none; }
	.door:hover .door-name { text-decoration: underline; text-underline-offset: 3px; }
	.door-name { color: var(--turmeric-deep); font-family: var(--house-display, var(--display)); font-size: 1.2rem; line-height: 1.3; }
	.door-line { font-size: var(--t-body); line-height: 1.45; }
	.door-sub, .note { color: var(--ink-soft); font-size: 1rem; line-height: 1.45; }
	.note { margin: 8px 0; max-width: var(--measure); }
	.subjects { display: flex; flex-wrap: wrap; gap: 6px 8px; margin-top: 12px; }
	.chip { display: inline-flex; align-items: center; min-height: 44px; box-sizing: border-box; padding: 8px 12px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--card); color: var(--ink); font-size: 1rem; line-height: 1.35; text-decoration: none; }
	.chip:hover { border-color: var(--turmeric-deep); }
	.chip.go { border-color: var(--turmeric-deep); font-weight: 600; }
	.video-group { margin-top: 16px; }
	h3 { margin: 0 0 4px; font-family: var(--house-display, var(--display)); color: var(--turmeric-deep); font-size: 1.15rem; line-height: 1.4; font-weight: 500; }
</style>
