<script module lang="ts">
	export interface LearningGuideState {
		panels: Record<string, boolean>;
		journeys: Record<string, boolean>;
	}
</script>

<script lang="ts">
	import { base } from '$app/paths';
	import { levels } from '$lib/stores/levels.svelte';
	import { onMount } from 'svelte';
	import { learningJourneys } from '$lib/learning-journeys';
	let { open = $bindable({ panels: {}, journeys: {} }) }: { open?: LearningGuideState } = $props();

	let mounted = $state(false);
	onMount(() => { mounted = true; void levels.load(); });
	const chosen = $derived(mounted ? levels.chosen : 1);
</script>

<section class="learning-guide" aria-labelledby="learning">
	<h2 class="group" id="learning" tabindex="-1">How to use the Table</h2>
	<p class="intro">A little recall, one clear explanation, then a practical application. You can choose any level and return whenever you need a refresher.</p>
	<ol class="routine">
		<li><b>Recall.</b> Open <a href="{base}/level/{chosen}#today">Today's study</a> and try a short round before looking at the answers.</li>
		<li><b>Understand.</b> Open the lesson behind a missed card. Name the ingredient, method and result in plain English.</li>
		<li><b>Apply.</b> Describe one dish aloud as if speaking to a guest, or cook a suitable recipe and check its result.</li>
	</ol>

	<details class="guide-panel" bind:open={open.panels.journeys}>
		<summary>Six kitchen-to-tableside study journeys</summary>
		<p class="intro">Choose one subject for a sitting. Follow the reading, connect it to the menu, then test what you can explain without looking.</p>
		<div class="journeys">
			{#each learningJourneys as journey (journey.id)}
				<details class="journey" bind:open={open.journeys[journey.id]}>
					<summary><span>{journey.title}</span><small>{journey.outcome}</small></summary>
					<ol>
						{#each journey.steps as step}
							<li><a href="{base}{step.href}">{step.label}</a><p>{step.why}</p></li>
						{/each}
					</ol>
					<p class="self-check"><b>Say it without looking:</b> {journey.selfCheck}</p>
				</details>
			{/each}
		</div>
	</details>

	<details class="guide-panel" bind:open={open.panels.tools}>
		<summary>Find the right tool</summary>
		<dl>
			<div><dt>Prepare for Brennan’s</dt><dd><a href="{base}/menu">Read the menu</a>, compare the <a href="{base}/menu?view=plates">illustrative final plates</a>, then rehearse ingredients and a tableside description. The images show chef-informed examples of plating.</dd></div>
			<div><dt>Understand an unfamiliar word</dt><dd>Use the <a href="{base}/foundations">Kitchen Fieldbook</a> for the terms from your training sheets, or the wider <a href="{base}/lexicon">Chef’s Lexicon</a>. <a href="{base}/cuisine">Cuisine</a> explains methods and French and Creole cooking in depth.</dd></div>
			<div><dt>Practise recall</dt><dd><a href="{base}/flashcards">Practise</a> gathers cards and quizzes. Search for a subject or jump to a group. Use Again when an explanation is still uncertain, then return to its lesson.</dd></div>
			<div><dt>Build kitchen skill</dt><dd>Find a <a href="{base}/technique">technique</a>, follow <a href="{base}/kitchen?level={chosen}">Cook at home</a>, or work through the <a href="{base}/study">Path of Study</a>. Check texture, aroma and doneness as well as time.</dd></div>
			<div><dt>Cook with what you have</dt><dd><a href="{base}/pantry">Pantry Match</a> finds recipes from the ingredients you tick. The <a href="{base}/recipes">recipe collection</a> also filters by course, difficulty, diet and season.</dd></div>
		</dl>
	</details>

	<details class="guide-panel" bind:open={open.panels.progress}>
		<summary>Understand progress, notes and offline use</summary>
		<ul class="explanations">
			<li><b>Your chosen level is a study focus.</b> It is not a restriction or a professional qualification. Use All levels where offered to explore beyond it.</li>
			<li><b>Reading, recall and cooking are different achievements.</b> Opening a lesson does not prove you have learnt it. Cards are self-checks; quizzes and practical records have their own progress rules, explained alongside the activity.</li>
			<li><b>Record cooking after doing it.</b> The <a href="{base}/repertoire">Repertoire</a> keeps your cooking history and suggests what to revisit. Use the recipe’s result checks to judge your work.</li>
			<li><b>Your record belongs to this browser.</b> Use <a href="{base}/menu#tools">Session and tools</a> to export a backup before changing devices. A website update preserves the saved record; clearing browser storage can remove it.</li>
			<li><b>Prepare before going offline.</b> Let the app finish its first download. Open the house menu, cooking lessons and images you need while connected, then check them in airplane mode. Images and Cook at home lessons are cached as used and may later be evicted by the browser; videos and external sources need a connection.</li>
		</ul>
	</details>
</section>

<style>
	.learning-guide { margin-bottom: 30px; }
	.intro { max-width: var(--measure); color: var(--ink-soft); line-height: 1.6; margin: 10px 0; }
	.routine { padding-left: 24px; max-width: var(--measure); line-height: 1.65; }
	.routine li { margin: 10px 0; padding-left: 4px; }
	.guide-panel { margin: 12px 0; padding: 0 16px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--card); }
	summary { padding: 14px 0; min-height: 48px; cursor: pointer; color: var(--ink); font-weight: 600; }
	summary:focus-visible { outline: 3px solid var(--turmeric-deep); outline-offset: 3px; }
	.guide-panel[open] { padding-bottom: 16px; }
	.journeys { display: grid; gap: 10px; margin-top: 16px; }
	.journey { border-top: 1px solid var(--line); }
	.journey summary span { font-family: var(--display); font-size: var(--t-h3, 1.25rem); }
	small { display: block; color: var(--ink-soft); font-weight: 400; font-size: var(--t-small); margin: 5px 0 0 18px; line-height: 1.5; }
	.journey ol { padding-left: 24px; }
	.journey li { margin: 14px 0; line-height: 1.5; }
	.journey li p { color: var(--ink-soft); margin-top: 4px; }
	.self-check { border-left: 2px solid var(--turmeric); padding: 10px 14px; margin: 12px 0; line-height: 1.6; }
	dl { display: grid; gap: 18px; line-height: 1.6; }
	dt { font-weight: 600; }
	dd { margin: 4px 0 0; color: var(--ink-soft); }
	.explanations { padding-left: 22px; line-height: 1.6; }
	.explanations li { margin: 12px 0; }
	@media (min-width: 800px) { dl { grid-template-columns: 1fr 1fr; gap: 20px 32px; } }
</style>
