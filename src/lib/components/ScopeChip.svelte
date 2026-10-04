<!--
  The level scope (docs/consolidation-design.md 2.4): one line at the top of
  the Flashcards, Quizzes and Library roots, in a group labelled Level.

    filtered     {Level} · show all levels
    showing all  All levels · show {Level} only

  The level's name is a button that opens the four names in place as the
  app's chips, the chosen one marked in words, Your level; choosing one sets
  the chosen level, closes the list and refilters. Escape, or the name again,
  closes it and never navigates. Show all is in-screen state: the page keeps
  it in its address with a replace, so Back to the root restores it.
-->
<script lang="ts">
	import { LEVEL_KEYS } from '$lib/levels';
	import type { DeckLevel } from '$lib/types';

	let {
		names,
		chosen,
		all,
		onAll,
		onChoose
	}: {
		/** level -> name */
		names: (n: DeckLevel) => string;
		chosen: DeckLevel;
		all: boolean;
		onAll: (all: boolean) => void;
		onChoose: (n: DeckLevel) => void;
	} = $props();

	let open = $state(false);
	let nameBtn: HTMLButtonElement | undefined = $state();

	function close() {
		open = false;
		nameBtn?.focus();
	}

	function onkey(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			e.preventDefault();
			e.stopPropagation();
			close();
		}
	}
</script>

<svelte:window onkeydown={onkey} />

<div class="scope" role="group" aria-label="Level">
	{#if all}
		<span>All levels</span>
		<span aria-hidden="true">·</span>
		<button type="button" class="linkish" onclick={() => onAll(false)}>show {names(chosen)} only</button>
	{:else}
		<button
			type="button"
			class="chip name"
			bind:this={nameBtn}
			aria-expanded={open}
			aria-label="{names(chosen)}, change level"
			onclick={() => (open = !open)}>{names(chosen)}</button
		>
		<span aria-hidden="true">·</span>
		<button type="button" class="linkish" onclick={() => onAll(true)}>show all levels</button>
	{/if}
</div>
{#if open && !all}
	<div class="scopelist" role="group" aria-label="Choose a level">
		{#each LEVEL_KEYS as n (n)}
			<button
				type="button"
				class="chip"
				aria-pressed={n === chosen}
				onclick={() => {
					onChoose(n);
					close();
				}}>{names(n)}{#if n === chosen}, Your level{/if}</button
			>
		{/each}
	</div>
{/if}
