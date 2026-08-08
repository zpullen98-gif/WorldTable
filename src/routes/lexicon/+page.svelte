<script lang="ts">
	import { base } from '$app/paths';
	import { bySlug } from '$lib/data';
	import { fold } from '$lib/filter';

	let { data } = $props();

	let q = $state('');
	let category = $state<string | null>(null);

	const categories = $derived([...new Set(data.lexicon.map((e) => e.category))].sort());

	/**
	 * The L2506 bug, structurally impossible here.
	 *
	 * The original bound `lexQ.addEventListener('input', renderLex)` to the FIRST
	 * definition of renderLex; the enhanced version at L2839 — the one that draws
	 * the recipe cross-links — only ever ran on the initial paint. So the moment
	 * you typed a character, every cross-link vanished.
	 *
	 * `$derived` recomputes from state. There is no function reference held by a
	 * listener, so there is nothing that can go stale. Do not "fix" this again.
	 */
	const shown = $derived.by(() => {
		const needle = fold(q).trim();
		return data.lexicon.filter((e) => {
			if (category && e.category !== category) return false;
			if (!needle) return true;
			return fold(`${e.term} ${e.category} ${e.definition}`).includes(needle);
		});
	});

	/* ---- flashcards ----
	 * The deck snapshots the ENTRIES, not indices into `shown`. `shown` is a
	 * live derivation over the search box — with indices, shuffling and then
	 * typing a character makes every index dangle or point at the wrong term.
	 * A snapshot also matches how study decks behave physically: narrowing the
	 * search mid-drill shouldn't reshuffle the cards in your hand.
	 */
	let deck = $state<typeof data.lexicon>([]);
	let pos = $state(0);
	let revealed = $state(false);

	function shuffle() {
		const cards = [...shown];
		for (let i = cards.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[cards[i], cards[j]] = [cards[j], cards[i]];
		}
		deck = cards;
		pos = 0;
		revealed = false;
	}
	const card = $derived(deck.length ? deck[pos % deck.length] : null);
</script>

<svelte:head><title>The Chef’s Lexicon — The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<h1>The Chef’s Lexicon</h1>
		<p class="lede">
			A working culinary dictionary for the climb from cook to chef to restaurateur — cuts and how
			to treat them, the fish counter decoded, every technique from a proper sear to sous vide,
			pastry science, and the language of the professional kitchen.
		</p>
	</header>

	<div class="tools" data-print="hide">
		<div class="search">
			<input
				bind:value={q}
				type="search"
				placeholder="Search a term — try “hanger”, “maillard”, or “86”"
				aria-label="Search the lexicon"
			/>
		</div>
		<select bind:value={category} class="chip" aria-label="Filter by category">
			<option value={null}>All categories</option>
			{#each categories as c (c)}<option value={c}>{c}</option>{/each}
		</select>
		<button class="chip" onclick={shuffle}>Study mode ▸ flashcards</button>
		<span class="count">{shown.length} of {data.lexicon.length} terms</span>
	</div>

	{#if card}
		<div class="flash">
			<p class="eyebrow">{card.category}</p>
			<p class="term">{card.term}</p>
			{#if revealed}<p class="def">{card.definition}</p>{/if}
			<div class="flashtools">
				<button class="chip" onclick={() => (revealed = !revealed)}>
					{revealed ? 'Hide' : 'Reveal'}
				</button>
				<button class="chip" onclick={() => { pos++; revealed = false; }}>Next card ↦</button>
				<button class="chip" onclick={shuffle}>Reshuffle</button>
				<button class="chip" onclick={() => (deck = [])}>Close</button>
				<span class="count">{(pos % deck.length) + 1} / {deck.length}</span>
			</div>
		</div>
	{/if}

	<div class="lexgrid">
		{#each shown as e (e.slug)}
			<article class="lexcard" id={e.slug}>
				<p class="eyebrow">{e.category}</p>
				<h2>{e.term}</h2>
				<p class="def">{e.definition}</p>
				{#if e.recipes.length}
					<p class="xrefs">
						{#each e.recipes as slug (slug)}
							{@const r = bySlug.get(slug)}
							{#if r}<a href="{base}/recipe/{slug}">↦ {r.name}</a>{/if}
						{/each}
					</p>
				{/if}
			</article>
		{/each}
	</div>

	{#if !shown.length}
		<p class="empty">No terms match. Widen the search — the kitchen is large.</p>
	{/if}
</div>

<style>
	.view { padding: 26px 0 80px; }
	.head h1 { font-size: var(--t-h2); margin-bottom: 8px; }
	.tools { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin: 20px 0 24px; }
	.search { flex: 1 1 260px; }
	.search input {
		width: 100%; padding: 10px 14px; border: 1px solid var(--line);
		background: var(--card); border-radius: var(--radius);
	}
	.chip {
		border: 1px solid var(--line); background: var(--card); padding: 8px 14px;
		border-radius: var(--radius); cursor: pointer; font-size: 14px;
	}
	.chip:hover { border-color: var(--turmeric); }
	select.chip { appearance: none; max-width: 260px; }
	.count { font-size: var(--t-small); color: var(--muted); font-variant-numeric: oldstyle-nums; margin-left: auto; }

	.flash {
		border: 1px solid var(--turmeric); background: var(--card);
		padding: 24px; margin-bottom: 26px; text-align: center; border-radius: var(--radius);
	}
	.flash .term { font-family: var(--display); font-size: var(--t-h2); margin: 6px 0 10px; }
	.flash .def { max-width: 62ch; margin: 0 auto 14px; color: var(--ink-soft); }
	.flashtools { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; align-items: center; }
	.flashtools .count { margin-left: 0; }

	.lexgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--gap); }
	.lexcard {
		background: var(--card); border: 1px solid var(--line); border-radius: var(--radius);
		padding: 16px 18px; content-visibility: auto; contain-intrinsic-size: auto 220px;
	}
	.lexcard h2 { font-size: var(--t-h4); margin: 4px 0 8px; }
	.lexcard .def { font-size: 14.5px; color: var(--ink-soft); max-width: 62ch; }
	.xrefs { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px; }
	.xrefs a {
		font-size: var(--t-small); color: var(--turmeric-deep); text-decoration: none;
		border: 1px solid var(--line); border-radius: var(--radius); padding: 2px 8px;
	}
	.xrefs a:hover { border-color: var(--turmeric); }
	.empty { padding: 60px 20px; text-align: center; color: var(--muted); font-style: italic; }
</style>
