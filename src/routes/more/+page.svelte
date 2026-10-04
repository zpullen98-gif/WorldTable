<!--
  More (docs/consolidation-design.md 2.5 and 3.10): a screen, not an overlay,
  so every item is one tap, Back from an item returns here, Back from here
  returns to where you were, and a screen reader and the phone's gesture meet
  no dialog to trap them. The groups, in order: Record and progress, Tools,
  Backup and data, The Maître d', Settings, About, each drawn as the app's
  quiet doors.

  The service toggle lives here now (Settings): the same prefs.toggleService()
  and the same words, Day service and Night service, naming the room it
  switches to. The house (switch, add, rename, export a restaurant) is on
  every level page under My restaurant, its one place; this screen keeps the
  whole device's backup only.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { TOTALS } from '$lib/data';
	import { prefs } from '$lib/stores/prefs.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { repertoire, dueList } from '$lib/repertoire';
	import { restoreScroll } from '$lib/stores/nav.svelte';
	import type { Snapshot } from './$types';

	let { data } = $props();

	let mounted = $state(false);
	onMount(() => (mounted = true));

	/* Distinct dishes, never log entries: the log counts COOKS. */
	const cooked = $derived(session.cookedDishes);
	const courseDone = $derived(data.curriculum.filter((slug) => cooked.has(slug)).length);
	const recook = $derived.by(() => {
		const now = Date.now();
		return dueList(repertoire(session.cookedLog, now), now).length;
	});
	const night = $derived(mounted && prefs.resolvedService === 'night');

	export const snapshot: Snapshot<{ y: number }> = {
		capture: () => ({ y: typeof window === 'undefined' ? 0 : window.scrollY }),
		restore: (v) => restoreScroll(v.y ?? 0, () => session.ready)
	};
</script>

<svelte:head><title>More · The World Table</title></svelte:head>

<div class="shell hub more">
	<h1 tabindex="-1">More</h1>

	<h2 class="group" id="m-record">Record and progress</h2>
	<nav class="quiet" aria-labelledby="m-record">
		<a class="door" href="{base}/repertoire">
			<span class="door-name">The record</span>
			<span class="door-line"
				>{courseDone} of {data.curriculum.length} cooked, {cooked.size} {cooked.size === 1 ? 'dish' : 'dishes'} in all.{#if recook}
					{recook} past their re-cook.{/if}</span
			>
		</a>
		<a class="door" href="{base}/coverage">
			<span class="door-name">The coverage board</span>
			<span class="door-line">Which stations you have done the work of, on this device.</span>
		</a>
	</nav>

	<h2 class="group" id="m-tools">Tools</h2>
	<nav class="quiet" aria-labelledby="m-tools">
		<a class="door" href="{base}/menu/costing"><span class="door-name">Cost this menu</span><span class="door-line">What each plate costs once the bin is paid for, and what it earns.</span></a>
		<a class="door" href="{base}/menu/preps"><span class="door-name">Preps</span><span class="door-line">What the menu is built from, costed once.</span></a>
		<a class="door" href="{base}/menu/prep-board"><span class="door-name">The prep board</span><span class="door-line">Count the walk-in, and the day back-times itself.</span></a>
		<a class="door" href="{base}/menu/waste"><span class="door-name">The waste log</span><span class="door-line">What went in the bin, and why. Venue-wide, never by person.</span></a>
		<a class="door" href="{base}/menu/producers"><span class="door-name">Producers</span><span class="door-line">The house's suppliers and the story a server can tell.</span></a>
		<a class="door" href="{base}/menu/guest"><span class="door-name">The guest menu</span><span class="door-line">The menu as a guest reads it, ready to print.</span></a>
		<a class="door" href="{base}/menu#plan"><span class="door-name">Plan a menu from the Library</span><span class="door-line">Pin recipes, balance the courses, build the shopping list.</span></a>
	</nav>

	<h2 class="group" id="m-backup">Backup and data</h2>
	<nav class="quiet" aria-labelledby="m-backup">
		<a class="door" href="{base}/menu#tools"><span class="door-name">Back up, restore and print</span><span class="door-line">Your menu, notes and pantry, to a file and back.</span></a>
	</nav>

	<h2 class="group" id="m-maitre">The Maître d'</h2>
	<nav class="quiet" aria-labelledby="m-maitre">
		<a class="door" href="{base}/menu#maitre"><span class="door-name">The Maître d'</span><span class="door-line">Optional, with a key of your own: she reads a menu with you.</span></a>
	</nav>

	<h2 class="group" id="m-settings">Settings</h2>
	<nav class="quiet" aria-labelledby="m-settings">
		<button
			type="button"
			class="door service"
			aria-label="{night ? 'Day service' : 'Night service'}: switch between day and night service"
			onclick={() => prefs.toggleService()}
		>
			<span class="door-name">{night ? 'Day service' : 'Night service'}</span>
			<span class="door-line">Switch the colours across Outside Of Time on this browser.</span>
		</button>
	</nav>

	<h2 class="group" id="m-about">About</h2>
	<p class="note about">
		The World Table · {TOTALS.recipes} recipes · {TOTALS.chapters} chapters · Chef’s Lexicon: {TOTALS.lexicon} terms
	</p>
	{#if base}
		<p class="quietlinks">
			<a href="/privacy.html" rel="external">Privacy</a>
			<a href="/terms.html" rel="external">Terms</a>
		</p>
	{/if}
</div>
