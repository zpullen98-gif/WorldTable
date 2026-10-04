<!--
  An old address (the retired Levels tab's) that lands here and leaves at
  once, for the chosen level: the one last opened or chosen on this device,
  else the lowest not yet met (lib/levels.ts firstUnmetLevel, derived on every
  visit and never stored).

  Prerendered as its heading and one line, under a kilobyte; the line names
  the first level (named, never numbered), the one name the load bakes in.
  The forward waits for the record: a jump to Commis that then corrected
  itself to Sous Chef would be a jump nobody trusts.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { levels } from '$lib/stores/levels.svelte';
	import { levelHref } from '$lib/levels';
	import { nav } from '$lib/stores/nav.svelte';

	let { data } = $props();

	onMount(() => {
		void levels.load();
	});

	$effect(() => {
		if (!levels.ready) return;
		/* The chosen level (the last one opened or chosen), else the lowest
		   not yet met. A replace, so the depth Back reads does not move. */
		nav.navReplace();
		void goto(`${base}${levelHref(levels.chosen)}`, { replaceState: true });
	});
</script>

<svelte:head><title>Your level · The World Table</title></svelte:head>

<div class="shell view">
	<h1>Your level</h1>
	<p class="lede" aria-live="polite">Opening your level, the lowest not yet met…</p>
	<p class="note">If nothing opens, start at <a href="{base}/level/1">{data.first}</a>.</p>
</div>

<style>
	h1 {
		font-size: var(--t-h1);
		margin-bottom: 8px;
	}
	.lede {
		font-size: var(--t-lede);
		color: var(--ink-soft);
	}
	.note {
		margin-top: 10px;
		font-size: var(--t-small);
		color: var(--muted);
	}
	.note a {
		display: inline-block;
		padding-block: 10px;
	}
</style>
