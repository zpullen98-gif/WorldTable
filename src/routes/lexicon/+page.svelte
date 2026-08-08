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

	/* ---- quiz ----
	 * Ported from qzAsk (L3082): ten questions a round, distractors drawn from
	 * the SAME category when it has enough terms — telling hanger from flank is
	 * the actual skill; telling hanger from crème anglaise is a giveaway.
	 */
	type Entry = (typeof data.lexicon)[number];
	interface Question {
		target: Entry;
		options: Entry[];
	}

	const QUIZ_LENGTH = 10;
	let quiz = $state<Question | null>(null);
	let picked = $state<Entry | null>(null);
	let qNum = $state(0);
	let right = $state(0);
	let verdict = $state('');

	const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

	function ask() {
		// The round draws from the current filter, like the original — quiz what
		// you're studying. Under 4 visible terms, widen to the whole lexicon.
		const pool = shown.length >= 4 ? shown : data.lexicon;
		const target = pick(pool);
		const sameCat = pool.filter((e) => e.category === target.category && e.slug !== target.slug);
		const others = new Map<string, Entry>([[target.slug, target]]);
		while (others.size < 4) {
			const cand = pick(sameCat.length >= 3 ? sameCat : pool);
			others.set(cand.slug, cand);
		}
		quiz = { target, options: [...others.values()].sort(() => Math.random() - 0.5) };
		picked = null;
	}

	function startQuiz() {
		deck = [];
		qNum = 0;
		right = 0;
		verdict = '';
		ask();
	}

	function answer(o: Entry) {
		if (picked) return; // already answered
		picked = o;
		if (o.slug === quiz!.target.slug) right++;
		qNum++;
	}

	function nextQuestion() {
		if (qNum >= QUIZ_LENGTH) {
			// The original's verdict ladder, verbatim.
			verdict =
				right >= 9
					? 'Chef-level. The pass is yours.'
					: right >= 7
						? 'Solid line cook — a few more services and it’s muscle memory.'
						: right >= 5
							? 'Stage complete — hit the flashcards on what you missed.'
							: 'Back to prep, chef — filter the category and study before the next round.';
			quiz = null;
			return;
		}
		ask();
	}
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
		<button class="chip" onclick={startQuiz}>Quiz me ▸ multiple choice</button>
		<span class="count">{shown.length} of {data.lexicon.length} terms</span>
	</div>

	{#if verdict}
		<div class="flash" role="status">
			<p class="eyebrow">Round complete</p>
			<p class="term">Final: {right} / {QUIZ_LENGTH}</p>
			<p class="def">{verdict}</p>
			<div class="flashtools">
				<button class="chip" onclick={startQuiz}>New round ↦</button>
				<button class="chip" onclick={() => (verdict = '')}>Close</button>
			</div>
		</div>
	{:else if quiz}
		<div class="flash">
			<p class="eyebrow">{quiz.target.category} · question {Math.min(qNum + (picked ? 0 : 1), QUIZ_LENGTH)} of {QUIZ_LENGTH}</p>
			<p class="def quizdef">
				“{quiz.target.definition.slice(0, 180)}{quiz.target.definition.length > 180 ? '…' : ''}”
			</p>
			<div class="opts">
				{#each quiz.options as o (o.slug)}
					<button
						class="opt"
						class:right={picked && o.slug === quiz.target.slug}
						class:wrong={picked?.slug === o.slug && o.slug !== quiz.target.slug}
						disabled={!!picked && o.slug !== picked.slug && o.slug !== quiz.target.slug}
						onclick={() => answer(o)}
					>
						{o.term}
					</button>
				{/each}
			</div>
			<div class="flashtools">
				{#if picked}
					<button class="chip" onclick={nextQuestion}>
						{qNum >= QUIZ_LENGTH ? 'See result ↦' : 'Next question ↦'}
					</button>
				{/if}
				<button class="chip" onclick={() => (quiz = null)}>Close</button>
				<span class="count">Score: {right} / {qNum}</span>
			</div>
		</div>
	{/if}

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

	.quizdef { font-style: italic; }
	.opts { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; max-width: 640px; margin: 0 auto 14px; }
	.opt {
		border: 1px solid var(--line); background: var(--paper); padding: 10px 14px;
		border-radius: var(--radius); cursor: pointer; font-family: var(--display); font-size: 16px;
	}
	.opt:hover:not(:disabled) { border-color: var(--turmeric); }
	.opt:disabled { opacity: 0.45; cursor: default; }
	.opt.right { border-color: var(--leaf); color: var(--leaf); font-weight: 600; }
	.opt.wrong { border-color: var(--chili); color: var(--chili); }

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
