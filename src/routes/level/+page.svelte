<!--
  The Levels tab lands here and leaves at once, for the level the record says
  the reader is on (the lowest not yet met: lib/levels.ts firstUnmetLevel,
  derived on every visit and never stored). A literal href in the bar, so the
  build verifier can resolve the tab to a page; a forward, so the tab means
  "the level you are on" rather than a list of four the home already is.

  Prerendered as its heading and one line, under a kilobyte. The forward
  waits for the record: a jump to Level I that then corrected itself to Level
  III would be a jump nobody trusts.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { levels } from '$lib/stores/levels.svelte';
	import { levelHref } from '$lib/levels';

	onMount(() => {
		void levels.load();
	});

	$effect(() => {
		if (!levels.ready) return;
		void goto(`${base}${levelHref(levels.current)}`, { replaceState: true });
	});
</script>

<svelte:head><title>Your level · The World Table</title></svelte:head>

<div class="shell view">
	<h1>Your level</h1>
	<p class="lede" aria-live="polite">Opening your level, the lowest not yet met…</p>
	<p class="note">If nothing opens, start at <a href="{base}/level/1">Level I</a>.</p>
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
