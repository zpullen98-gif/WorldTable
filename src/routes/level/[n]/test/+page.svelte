<!--
  The Level N test: one sitting across the level's subsections, untimed, that
  ends on what you missed with the right answers and no score. The same shape
  in all three apps (the owner's decision, 2026-09-26).

  Composed from the app's existing engines (lib/levels.ts buildLevelTest):
  the Floor Deck's own written test at the level, with its traps, then six
  service questions with all 186 cards as the field, then eight Lexicon
  questions with the whole lexicon as the field. Every answer is written to
  the one drill log by the rule of the engine that asked it
  (gradeLevelAnswer), so the level's figure moves the way each subsection's
  own modes move it. Nothing is marked as you go; there is no clock.

  It loads the deck, the traps, the drill cards and the Lexicon in the
  browser, never in a load: a universal load's return is inlined into the
  prerendered HTML, and these four are precached chunks. This is the second
  route allowed to name loadDeckTraps (floor-deck-contract.test.ts); no card
  shows a trap here either, the traps are wrong options and nothing else.

  The result screen names no figure. The deck's cards it shows carry their
  own prose, which may hold a temperature; the page's OWN words never hold a
  digit, and the spec holds them to it. It calls markStudied() and does NOT
  dispatch oot:round-complete: the suite's log keeps a round with numbers and
  this one has none to give.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { loadDeckTraps, loadDrills, loadFloorDeck, loadLexicon } from '$lib/data';
	import { session } from '$lib/stores/session.svelte';
	import { levels } from '$lib/stores/levels.svelte';
	import { markStudied } from '$lib/oot-studied';
	import FloorCard from '$lib/components/FloorCard.svelte';
	import { NUMERAL, buildLevelTest, gradeLevelAnswer, type LevelQuestion, type LevelTest } from '$lib/levels';
	import { whyWrong, type TestOption } from '$lib/floor-deck';
	import type { DrillCard } from '$lib/drill';
	import type { DeckCard, DeckLevel, DeckTraps, FloorDeck, LexiconEntry } from '$lib/types';

	let { data } = $props();
	const n = $derived(data.level as DeckLevel);

	let deck = $state<FloorDeck | null>(null);
	let traps = $state<DeckTraps | null>(null);
	let drills = $state<DrillCard[] | null>(null);
	let lexicon = $state<LexiconEntry[] | null>(null);
	let failed = $state(false);

	onMount(async () => {
		try {
			const [d, t, dr, lx] = await Promise.all([loadFloorDeck(), loadDeckTraps(), loadDrills(), loadLexicon(), levels.load()]);
			deck = d;
			traps = t;
			drills = dr.cards;
			lexicon = lx;
		} catch {
			failed = true;
		}
	});

	const loaded = $derived(deck !== null && traps !== null && drills !== null && lexicon !== null && levels.ready);

	let test = $state<LevelTest | null>(null);
	let at = $state(0);
	/** For a match question: card id -> the gist id chosen for it. */
	let matched = $state<Record<string, string>>({});
	let done = $state(false);

	interface Miss {
		kind: LevelQuestion['kind'];
		card?: DeckCard;
		term: string;
		chose: string;
		because: string;
	}
	let misses = $state<Miss[]>([]);

	const q = $derived(test ? test.questions[at] : null);
	const names = $derived(new Map((deck?.cards ?? []).map((c) => [c.id, c.term])));
	const titles = $derived(new Map((deck?.sections ?? []).map((s) => [s.key, s.title])));
	const levelNames = $derived(new Map((deck?.levels ?? []).map((l) => [l.level, l.name])));

	function start() {
		if (!deck || !traps || !drills || !lexicon || !levels.data || !levels.ready) return;
		test = buildLevelTest(levels.data, n, deck, traps, drills, lexicon, levels.logs, Date.now(), Math.random);
		at = 0;
		matched = {};
		misses = [];
		done = false;
	}

	/* Recorded BEFORE anything advances, the rule every round in this app
	   follows: closing the page mid-test must not lose what was answered. */
	function record(kind: LevelQuestion['kind'], slug: string, correct: boolean) {
		session.markDrilled(slug, gradeLevelAnswer(kind, correct));
	}

	function pickDeck(option: TestOption) {
		if (!q || q.kind !== 'deck' || q.q.kind !== 'mc' || !deck) return;
		record('deck', q.q.card.id, option.correct);
		if (!option.correct) misses = [...misses, { kind: 'deck', card: q.q.card, term: q.q.card.term, chose: option.text, because: whyWrong(option, deck.cards) }];
		next();
	}

	const matchReady = $derived(
		q?.kind === 'deck' &&
			q.q.kind === 'match' &&
			q.q.cards.every((c) => matched[c.id]) &&
			new Set(q.q.cards.map((c) => matched[c.id])).size === q.q.cards.length
	);

	function submitMatch() {
		if (!q || q.kind !== 'deck' || q.q.kind !== 'match' || !deck || !matchReady) return;
		for (const card of q.q.cards) {
			const choseId = matched[card.id];
			const correct = choseId === card.id;
			record('deck', card.id, correct);
			if (!correct) {
				const chose = q.q.gists.find((g) => g.id === choseId)?.text ?? '';
				misses = [...misses, { kind: 'deck', card, term: card.term, chose, because: whyWrong({ from: 'kin', id: choseId }, deck.cards) }];
			}
		}
		next();
	}

	function pickService(slug: string) {
		if (!q || q.kind !== 'service') return;
		const target = q.q.target;
		const correct = slug === target.slug;
		record('service', target.slug, correct);
		if (!correct) {
			const chose = q.q.options.find((o) => o.slug === slug)?.term ?? '';
			misses = [...misses, { kind: 'service', term: target.term, chose, because: `That definition is ${target.term}, in the ${target.category}.` }];
		}
		next();
	}

	function pickLexicon(slug: string) {
		if (!q || q.kind !== 'lexicon') return;
		const target = q.q.target;
		const correct = slug === target.slug;
		record('lexicon', target.slug, correct);
		if (!correct) {
			const chose = q.q.options.find((o) => o.slug === slug)?.term ?? '';
			misses = [...misses, { kind: 'lexicon', term: target.term, chose, because: `That definition is ${target.term}, in ${target.category}.` }];
		}
		next();
	}

	function next() {
		if (!test) return;
		if (at + 1 >= test.questions.length) {
			done = true;
			markStudied();
			return;
		}
		at += 1;
		matched = {};
	}

	function again() {
		test = null;
		done = false;
	}

	const part = $derived(!q ? '' : q.kind === 'deck' ? 'the Floor Deck' : q.kind === 'service' ? 'Service' : 'the Lexicon');
	const deckMisses = $derived(misses.filter((m) => m.kind === 'deck'));
	const otherMisses = $derived(misses.filter((m) => m.kind !== 'deck'));
	/** The lexicon quiz's own stem: the definition's opening, never the whole essay. */
	const opening = (s: string) => `${s.slice(0, 180)}${s.length > 180 ? '…' : ''}`;
</script>

<svelte:head><title>The Level {NUMERAL[n]} test · The World Table</title></svelte:head>

<div class="shell view">
	<nav class="crumbs"><a href="{base}/">Home</a> · <a href="{base}/level/{n}">Level {NUMERAL[n]}</a></nav>
	<h1>The Level {NUMERAL[n]} test</h1>

	<article class="sheet">
		{#if failed}
			<p class="empty">The test did not load. Check the connection once; after that it works offline.</p>
		{:else if !loaded}
			<p class="empty" aria-live="polite">Opening the test…</p>
		{:else if !test}
			<p class="lede">
				Across every subsection of Level {NUMERAL[n]}, {data.info.name}: the Floor Deck's written
				test at this level, then the service track, then the Lexicon. Answered cold, with no clock
				and nothing marked as you go. It ends on what you missed, with the right answers, and no
				score.
			</p>
			<p class="tools">
				<button class="chip go" onclick={start}>Begin</button>
				<a class="chip" href="{base}/level/{n}">Back to Level {NUMERAL[n]}</a>
			</p>
		{:else if !test.questions.length}
			<p class="empty">This level cannot field a test yet.</p>
			<p class="tools"><a class="chip" href="{base}/level/{n}">Back to Level {NUMERAL[n]}</a></p>
		{:else if done}
			<div class="result" role="status">
				{#if misses.length}
					<h2>What you missed</h2>
					<p class="note">
						The right answer under each. Read them once, slowly: they lead your next sitting, and
						they stay owed until you get them right on another day.
					</p>
					{#each deckMisses as m (m.card?.id)}
						{#if m.card && deck}
							<FloorCard
								card={m.card}
								frame={deck.frame}
								levelName={levelNames.get(m.card.level) ?? ''}
								sectionTitle={titles.get(m.card.section) ?? ''}
								{names}
								flippable={false}
								heading="h3"
								open={{ why: true, facts: false, context: true }}
							>
								{#snippet before()}
									<p class="chose"><span class="chlabel">You chose</span> {m.chose}</p>
									<p class="because">{m.because}</p>
								{/snippet}
							</FloorCard>
						{/if}
					{/each}
					{#if otherMisses.length}
						<ul class="missed">
							{#each otherMisses as m (m.kind + m.term)}
								<li>
									<span class="term">{m.term}</span>
									<span class="chose"><span class="chlabel">You chose</span> {m.chose}</span>
									<span class="because">{m.because}</span>
								</li>
							{/each}
						</ul>
					{/if}
				{:else}
					<h2>Nothing missed.</h2>
					<p class="note">Every term in this test moves up its ladder and comes back later, further apart.</p>
				{/if}
				<p class="tools">
					<a class="chip go" href="{base}/level/{n}">Back to Level {NUMERAL[n]}</a>
					<button class="chip" onclick={again}>Sit it again</button>
					<a class="chip" href="{base}/">Home</a>
				</p>
			</div>
		{:else if q}
			<p class="where">Level {NUMERAL[n]} · {part} · question {at + 1} of {test.questions.length}</p>

			{#if q.kind === 'deck' && q.q.kind === 'mc'}
				{@const mc = q.q}
				<div class="ask">
					<h2 class="stem">{mc.card.term}</h2>
					{#if mc.card.say}<p class="say">{mc.card.say}</p>{/if}
					<p class="prompt">Which of these is it?</p>
					<div class="opts">
						{#each mc.options as o (o.text)}
							<button class="opt" onclick={() => pickDeck(o)}>{o.text}</button>
						{/each}
					</div>
				</div>
			{:else if q.kind === 'deck' && q.q.kind === 'match'}
				{@const match = q.q}
				<div class="ask">
					<h2 class="stem">Match each word to what it is</h2>
					<ul class="match">
						{#each match.cards as card (card.id)}
							<li>
								<label>
									<span class="term">{card.term}</span>
									<select bind:value={matched[card.id]}>
										<option value="">Choose…</option>
										{#each match.gists as g (g.id)}
											<option value={g.id}>{g.text}</option>
										{/each}
									</select>
								</label>
							</li>
						{/each}
					</ul>
					<p class="tools"><button class="chip go" onclick={submitMatch} disabled={!matchReady}>Next</button></p>
				</div>
			{:else if q.kind === 'service'}
				{@const s = q.q}
				<div class="ask">
					<p class="prompt">{s.target.prompt}</p>
					<div class="opts">
						{#each s.options as o (o.slug)}
							<button class="opt" onclick={() => pickService(o.slug)}>{o.term}</button>
						{/each}
					</div>
				</div>
			{:else if q.kind === 'lexicon'}
				{@const l = q.q}
				<div class="ask">
					<p class="eyebrow">{l.target.category}</p>
					<p class="prompt">“{opening(l.target.definition ?? '')}”</p>
					<div class="opts">
						{#each l.options as o (o.slug)}
							<button class="opt" onclick={() => pickLexicon(o.slug)}>{o.term}</button>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</article>
</div>

<style>
	h1 {
		font-size: var(--t-h1);
		margin-bottom: 12px;
	}
	.crumbs {
		font-size: var(--t-small);
		margin-bottom: 8px;
		color: var(--muted);
	}
	.crumbs a {
		display: inline-block;
		padding-block: 10px;
		color: var(--muted);
	}
	.sheet {
		max-width: var(--measure);
	}
	.lede {
		font-size: var(--t-lede);
		color: var(--ink-soft);
	}
	.empty,
	.note {
		color: var(--ink-soft);
		font-size: var(--t-small);
	}
	.tools {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 14px;
	}
	.tools a,
	.tools button {
		text-decoration: none;
		min-height: 44px;
		display: inline-flex;
		align-items: center;
	}
	.where {
		font-size: var(--t-small);
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.ask {
		margin-top: 12px;
	}
	.stem {
		font-family: var(--display);
		font-size: var(--t-h2);
		margin-bottom: 4px;
	}
	.say,
	.eyebrow {
		font-size: var(--t-small);
		color: var(--muted);
	}
	.prompt {
		margin-top: 8px;
		font-size: var(--t-body);
		line-height: 1.55;
	}
	.opts {
		display: grid;
		gap: 8px;
		margin-top: 14px;
	}
	.opt {
		font: inherit;
		text-align: left;
		min-height: 44px;
		padding: 10px 14px;
		border: var(--rule) solid var(--line);
		border-radius: var(--radius);
		background: var(--card);
		color: var(--ink);
		cursor: pointer;
		line-height: 1.4;
	}
	.opt:hover {
		border-color: var(--turmeric-deep);
	}
	.opt:focus-visible {
		outline: 2px solid var(--turmeric-deep);
		outline-offset: 2px;
	}
	.match {
		list-style: none;
		margin: 12px 0 0;
		padding: 0;
		display: grid;
		gap: 10px;
	}
	.match label {
		display: grid;
		gap: 4px;
	}
	.match .term {
		font-family: var(--display);
		font-size: var(--t-h4);
	}
	.match select {
		font: inherit;
		font-size: var(--t-small);
		min-height: 44px;
		padding: 6px 10px;
		border: var(--rule) solid var(--field-line);
		border-radius: var(--radius);
		background: var(--card);
		color: var(--ink);
		max-width: 100%;
	}
	.result h2 {
		font-family: var(--display);
		font-size: var(--t-h2);
		margin-bottom: 6px;
	}
	.missed {
		list-style: none;
		margin: 14px 0 0;
		padding: 0;
	}
	.missed li {
		display: grid;
		gap: 2px;
		padding: 10px 0;
		border-top: 1px solid var(--line);
	}
	.missed .term {
		font-family: var(--display);
		font-size: var(--t-h4);
	}
	.chose {
		font-size: var(--t-small);
		color: var(--ink-soft);
	}
	.chlabel {
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
		margin-right: 4px;
	}
	.because {
		font-size: var(--t-small);
		color: var(--ink);
	}
</style>
