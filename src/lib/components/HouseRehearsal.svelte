<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { levels } from '$lib/stores/levels.svelte';
	import { cardsTarget } from '$lib/nav';
	import { producersLine } from '$lib/study';
	import type { House } from '$lib/house/house-schema';
	import { BRENNANS_HOUSE_ID } from '$lib/teaching-folios';
	let { current, again = 0 }: { current: House; again?: number } = $props();
	onMount(() => { void levels.load(); });
</script>

<section class="rehearsal" aria-labelledby="rehearsal-h">
	<h2 id="rehearsal-h">From knowing the dish to serving it</h2>
	<p class="intro">Work through one short round. Say your answer aloud, check it, then revisit anything you missed.</p>
	<a class="daily" href="{base}/level/{levels.chosen}#today"><b>Today's study</b><span>Your daily cards and review</span></a>
	<ol class="steps">
		<li><h3>Recall the ingredients</h3><p>Remember the dish, its components and the reason each belongs on the plate.</p><a href="{base}/flashcards?deck=menu">Menu flashcards</a>{#if again}<a href="{base}{cardsTarget('mode=cards&deck=weak')}">Revisit {again} dishes marked Again</a>{/if}</li>
		<li><h3>Describe it to a guest</h3><p>Practise a short, natural tableside description, then compare it with the house's kept wording.</p><a href="{base}/menu/quiz?mode=say">Say it back</a></li>
		<li><h3>Handle the conversation</h3><p>Rehearse a guest's question, make a useful recommendation and know when to confirm with the team.</p><a href="{base}/menu/quiz?mode=guest">Guest at the table</a></li>
	</ol>
	<details class="panel"><summary>Choose a focused round</summary><nav class="focused" aria-label="Focused service practice">
		<a href="{base}/menu/quiz?mode=drill">Drill the menu</a>
		<a href="{base}/menu/quiz">The dishes quiz</a>
		<a href="{base}/menu/quiz?mode=pair">Pairing practice</a>
		<a href="{base}/flashcards?deck=components">Ingredients and components</a>
		{#if current.tastings.length}<a href="{base}/flashcards?deck=tastings">Tasting menus</a>{/if}
		{#if producersLine(current)}<a href="{base}/flashcards?deck=producers">Know the producers</a>{/if}
		<a href="{base}/flashcards?deck=foundations%3Atoday">Today's culinary terms</a>
		{#if current.id === BRENNANS_HOUSE_ID}<a href="{base}/flashcards?deck=fall%3Atoday">Today's fall practice</a>{/if}
	</nav></details>
	<p class="next">Need the explanation first? <a href="{base}/menu">Return to a dish</a> or open <a href="{base}/menu?view=learn">Kitchen studies</a>.</p>
</section>

<style>
	h2 { font: 500 var(--t-h2)/1.2 var(--display); margin: 20px 0 10px; }
	.intro { max-width: 68ch; line-height: 1.55; color: var(--ink-soft); margin: 12px 0 18px; }
	.daily { display: flex; flex-wrap: wrap; gap: 6px 18px; align-items: center; min-height: 48px; padding: 14px 18px; border: 1px solid var(--line-strong); border-radius: var(--radius); background: var(--card); color: var(--ink); text-decoration: none; }
	.daily span { color: var(--ink-soft); }
	.steps { padding-left: 28px; margin: 18px 0; }
	.steps li { padding: 12px 0 20px 6px; border-bottom: 1px solid var(--line); }
	h3 { font: 600 var(--t-h3)/1.25 var(--display); margin: 0 0 6px; }
	.steps p { margin-bottom: 8px; color: var(--ink-soft); line-height: 1.55; }
	.steps a, .focused a, .next a { display: inline-flex; align-items: center; min-height: 44px; color: var(--turmeric-deep); text-underline-offset: 3px; margin-right: 12px; }
	.panel { padding: 0 16px; border: 1px solid var(--line); background: var(--card); border-radius: var(--radius); }
	summary { min-height: 48px; padding: 12px 0; cursor: pointer; font-weight: 600; }
	.focused { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; padding-bottom: 12px; }
	.next { line-height: 1.5; margin: 18px 0; }
	@media (max-width: 600px) { .focused { grid-template-columns: 1fr; } }
</style>
