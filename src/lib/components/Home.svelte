<!--
  The home: the four level cards and nothing else (docs/consolidation-design.md
  2.6 and 3.5).

  The quiet row of doors that sat under the cards went with the consolidation
  (4 Oct 2026): Today is a level page's Today's study now, the Library is its
  own tab, the Record is under More, and My Menu is My restaurant on every
  level page, with the Menu Desk's waiting line beside it.

    <section class="levels">   four <a class="level"> cards, Commis to Chef, each
                               with its name and its word and figure (Untouched,
                               N% met, Met); the chosen one carries `on`,
                               aria-current and the words "Your level"

  The chosen level is the one last opened or chosen on this device
  (stores/levels.svelte.ts `chosen`, the slot `oot-level-table-v1`), falling
  back to the lowest not yet met, as the card said before.

  No heading below the masthead's h1: the cards are links, and the regression
  suite holds the page to no h2 and no h3.

  The word and the figure paint only once the levels file and the record are
  both in (levels.ready): four cards saying Untouched to a ten-year cook for
  a second on every open would be the wrong thing to say first. The names
  arrive baked in from the page's load, so the cards themselves never wait.

  Named, never numbered (the owner, 27 Sep 2026): a card's name is its
  label, to the eye and to a screen reader alike.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { levels } from '$lib/stores/levels.svelte';
	import { LEVEL_KEYS } from '$lib/levels';
	import type { DeckLevel, LevelInfo } from '$lib/types';

	interface Props {
		/** The four levels' names and blurbs, baked at prerender so the cards
		 *  paint before any file loads. */
		levelInfo?: LevelInfo[];
	}
	let { levelInfo = [] }: Props = $props();

	let mounted = $state(false);
	onMount(() => {
		mounted = true;
		void levels.load();
	});

	const rows = $derived(levels.progress);
	const ready = $derived(levels.ready && rows.length === LEVEL_KEYS.length);
	const chosen = $derived(mounted ? levels.chosen : levels.current);

	const nameOf = (n: DeckLevel) =>
		levelInfo.find((l) => l.level === n)?.name ?? levels.data?.levels.find((l) => l.level === n)?.name ?? '';
</script>

<div class="home">
	<section class="levels" aria-label="Levels">
		{#each LEVEL_KEYS as n (n)}
			{@const row = rows.find((r) => r.level === n)}
			{@const on = ready && chosen === n}
			<a
				class="level"
				class:on
				href="{base}/level/{n}"
				data-level={n}
				aria-current={on ? 'step' : undefined}
				onclick={() => levels.choose(n)}
			>
				<span class="lv-name">{nameOf(n)}</span>
				<span class="lv-stat">{ready && row ? row.label : ''}</span>
				{#if on}<span class="lv-here">Your level</span>{/if}
			</a>
		{/each}
	</section>
</div>

<style>
	.home {
		max-width: 1200px;
		margin: 0 auto;
		padding-inline: 20px;
	}

	/* ---- the four cards ---------------------------------------------------- */
	.levels {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: var(--gap);
		margin-top: 6px;
	}
	.level {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-height: 44px;
		padding: 16px 16px 14px;
		border: var(--rule) solid var(--line);
		border-radius: var(--radius);
		background: var(--card);
		color: var(--ink);
		text-decoration: none;
		box-shadow: var(--shadow-card);
	}
	.level:hover {
		border-color: var(--turmeric-deep);
	}
	.level:focus-visible {
		outline: 2px solid var(--turmeric-deep);
		outline-offset: 2px;
	}
	/* The current card: a second border AND the words "Your level", never the
	   colour alone. */
	.level.on {
		border-color: var(--turmeric-deep);
		box-shadow: inset 0 0 0 1px var(--turmeric-deep), var(--shadow-card);
	}
	.lv-name {
		font-family: var(--display);
		font-size: var(--t-h4);
		line-height: 1.2;
	}
	.lv-stat {
		min-height: 1.3em;
		font-size: var(--t-small);
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.lv-here {
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--turmeric-deep);
	}

    @media screen {
        .home { padding-top: 28px; padding-bottom: 30px; }
        .levels { gap: 18px; }
        .level { min-height: 154px; padding: 24px 22px; gap: 10px; border-color: var(--house-frame); background: var(--house-panel); box-shadow: var(--house-inset), var(--shadow-card); border-radius: 2px; }
        .level::after { content: ''; position: absolute; right: 12px; bottom: 12px; width: 16px; height: 16px; border-right: 1px solid var(--turmeric-deep); border-bottom: 1px solid var(--turmeric-deep); opacity: .7; pointer-events: none; }
        .level.on { border-color: var(--turmeric-deep); box-shadow: var(--house-inset), 0 8px 26px #0001; }
        .lv-name { font-family: var(--house-display); font-size: 1rem; line-height: 1.45; color: var(--turmeric-deep); }
        .lv-stat { font-size: 1.1rem; color: var(--ink-soft); }
        .lv-here { font-size: .68rem; letter-spacing: .1em; }
        .level:hover { border-color: var(--turmeric-deep); background: color-mix(in srgb, var(--turmeric) 10%, var(--card)); }
    }
    @media screen and (max-width: 599px) {
        .home { padding-top: 22px; }
        .levels { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .level { min-height: 150px; padding: 20px 15px; }
        .lv-name { font-size: .86rem; }
    }
</style>
