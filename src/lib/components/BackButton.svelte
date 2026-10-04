<!--
  The one way back (docs/consolidation-design.md 2.2 and 3.3): the word
  `Back` and nothing else, the first thing in the content on every screen but
  Home, in the study card's backline pattern with the app's own chip.

  Press: one entry back when this app pushed the current one (history.back(),
  so the phone's gesture and the button agree), otherwise up to the screen's
  logical parent with a replace (lib/nav.ts parentOf), so a cold deep link
  walks up one screen per press and the history never gains a loop.

  STICKY, because the screens a server scrolls furthest are the ones a Back
  three thousand pixels up would not serve. The row sticks just under the
  modebar on the paper token, one row tall. Once it sticks, one
  IntersectionObserver on a sentinel above it (no scroll handler) sets
  `is-stuck`, which moves the button to x 64, clear of the Outside Of Time
  badge's 44 px disc at x 10 to 54.

  At depth 0, arrived from another room on the same origin, one quiet line
  says what the phone's gesture will do instead; it goes at the first push.
-->
<script lang="ts">
	import { nav } from '$lib/stores/nav.svelte';
	import { levels } from '$lib/stores/levels.svelte';

	let sentinel: HTMLDivElement | undefined = $state();
	let row: HTMLDivElement | undefined = $state();
	let stuck = $state(false);

	/* The row's height, published as --backrow-h, so every other sticky thing
	   under the bar (the study view's search bar, the Lexicon's group heads,
	   the recipe toolbar) sticks below it and an anchor lands clear of it.
	   0 on Home, where there is no row. */
	$effect(() => {
		if (!row || typeof ResizeObserver === 'undefined') return;
		const el = row;
		const root = document.documentElement;
		const measure = () => root.style.setProperty('--backrow-h', `${Math.ceil(el.getBoundingClientRect().height)}px`);
		const ro = new ResizeObserver(measure);
		measure();
		ro.observe(el);
		return () => {
			ro.disconnect();
			root.style.setProperty('--backrow-h', '0px');
		};
	});

	$effect(() => {
		if (!sentinel || typeof IntersectionObserver === 'undefined') return;
		const el = sentinel;
		const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--modebar-h')) || 0;
		const io = new IntersectionObserver(
			([e]) => {
				stuck = !e.isIntersecting && e.boundingClientRect.top < bar + 1;
			},
			{ rootMargin: `-${Math.ceil(bar) + 1}px 0px 0px 0px`, threshold: 0 }
		);
		io.observe(el);
		return () => io.disconnect();
	});
</script>

<div class="backsentinel" bind:this={sentinel} aria-hidden="true"></div>
<div class="backline" class:is-stuck={stuck} data-print="hide" bind:this={row}>
	<div class="shell backrow">
		<button type="button" class="chip back" onclick={() => nav.back(levels.chosen)}>Back</button>
		{#if nav.from && nav.depth === 0}
			<span class="from">Opened from {nav.from}. Your phone's back gesture returns there.</span>
		{/if}
	</div>
</div>

<style>
	.backsentinel {
		height: 1px;
		margin-bottom: -1px;
	}
	.backline {
		position: sticky;
		top: var(--modebar-h, 0px);
		z-index: 30;
		background: var(--paper);
	}
	.backrow {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px 12px;
		min-height: 46px;
		padding-block: 1px;
		transition: padding-left 0.12s ease;
	}
	.back {
		min-height: 44px;
		min-width: 64px;
		font-size: 1rem;
		color: var(--ink);
	}
	/* Stuck under the bar, the badge's lane is beside it: move clear of x 54. */
	.is-stuck .backrow {
		padding-left: 64px;
		border-bottom: 1px solid var(--line);
	}
	.from {
		font-size: 1rem;
		color: var(--ink-soft);
		line-height: 1.4;
	}
	@media print {
		.backline {
			display: none;
		}
	}
</style>
