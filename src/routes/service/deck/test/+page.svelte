<!--
  The written test: one section of the Floor Deck, answered cold.

  Ten multiple choice and one set of four to match, where the section is big
  enough (floor-deck.ts buildTest). The key of every question is a card's gist,
  which the build holds term-free, and the wrong answers come from the one
  function the build simulates for an option-length tell, so what was measured
  is what is asked. This is an OBJECTIVE mode: a right answer records `met` and
  may climb the ladder, a wrong one records `missed`.

  Nothing is marked right or wrong while the test is being taken. It is a test,
  and the explanation belongs at the end, with the card open beside it.

  AND IT ENDS ON NO NUMBER. The owner's decision: the result is the list of
  what was missed, each with what was chosen, one line on why that is wrong,
  and the card itself. Not a score, a fraction, a percentage, a verdict or a
  pass mark, and no event that would let another wing mint one: this page
  calls markStudied() and does NOT dispatch oot:round-complete, because the
  suite's log drops a round-complete with no numbers and keeps one that has
  them. tests/floor-deck.spec.ts holds the result screen to having no figure
  in it at all. "Question 3 of 11" during the test is a place, not a score.

  This is the ONLY route that may load the traps (floor-deck-contract.test.ts
  scans for the loader's name). A trap is a wrong answer; it is never shown as
  anything else, and on the result screen it appears only as "you chose".

  Every answer is written when it is given, before anything advances, so a
  test abandoned halfway loses nothing and Back simply works.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { loadFloorDeck, loadDeckTraps } from '$lib/data';
	import { session } from '$lib/stores/session.svelte';
	import { markStudied } from '$lib/oot-studied';
	import { gradeFor } from '$lib/drill';
	import FloorCard from '$lib/components/FloorCard.svelte';
	import {
		buildTest,
		liveSections,
		sectionsFromSearch,
		whyWrong,
		type TestOption,
		type TestQuestion
	} from '$lib/floor-deck';
	import type { DeckCard, DeckTraps, FloorDeck } from '$lib/types';

	let deck = $state<FloorDeck | null>(null);
	let traps = $state<DeckTraps>({});
	let failed = $state(false);
	let search = $state<string | null>(null);

	let sectionKey = $state('');
	let questions = $state<TestQuestion[] | null>(null);
	let at = $state(0);
	/** for the match question: card id -> the id of the gist chosen for it */
	let matched = $state<Record<string, string>>({});
	let misses = $state<Array<{ card: DeckCard; chose: string; because: string }>>([]);
	let done = $state(false);

	onMount(async () => {
		try {
			[deck, traps] = await Promise.all([loadFloorDeck(), loadDeckTraps()]);
		} catch {
			failed = true;
		}
	});

	afterNavigate(() => {
		search = location.search;
	});

	const sections = $derived(deck ? liveSections(deck) : []);
	const names = $derived(new Map((deck?.cards ?? []).map((c) => [c.id, c.term])));
	const q = $derived(questions ? (questions[at] ?? null) : null);
	const sectionTitle = $derived(sections.find((s) => s.key === sectionKey)?.title ?? '');

	/* the section in the URL is the first choice; otherwise the first section */
	$effect(() => {
		if (sectionKey || !sections.length || search === null) return;
		const wanted = sectionsFromSearch(search, sections.map((s) => s.key));
		sectionKey = wanted ? [...wanted][0] : sections[0].key;
	});

	function start() {
		if (!deck || !session.ready) return;
		questions = buildTest(deck, traps, session.drillLog, Date.now(), Math.random, sectionKey);
		at = 0;
		matched = {};
		misses = [];
		done = false;
	}

	function record(card: DeckCard, correct: boolean) {
		session.markDrilled(card.id, gradeFor(correct, false));
	}

	function pick(option: TestOption) {
		if (!q || q.kind !== 'mc' || !deck) return;
		record(q.card, option.correct);
		if (!option.correct) {
			misses = [...misses, { card: q.card, chose: option.text, because: whyWrong(option, deck.cards) }];
		}
		next();
	}

	const matchReady = $derived(
		q?.kind === 'match' &&
			q.cards.every((c) => matched[c.id]) &&
			new Set(q.cards.map((c) => matched[c.id])).size === q.cards.length
	);

	function submitMatch() {
		if (!q || q.kind !== 'match' || !deck || !matchReady) return;
		for (const card of q.cards) {
			const choseId = matched[card.id];
			const correct = choseId === card.id;
			record(card, correct);
			if (!correct) {
				const chose = q.gists.find((g) => g.id === choseId)?.text ?? '';
				misses = [...misses, { card, chose, because: whyWrong({ from: 'kin', id: choseId }, deck.cards) }];
			}
		}
		next();
	}

	function next() {
		if (!questions) return;
		if (at + 1 >= questions.length) {
			done = true;
			markStudied();
			return;
		}
		at += 1;
		matched = {};
	}

	function again() {
		questions = null;
		done = false;
	}
</script>

<svelte:head><title>The written test · The Floor Deck · The World Table</title></svelte:head>

<div class="shell view">
	<nav class="crumbs"><a href="{base}/service">Service</a> · <a href="{base}/service/deck">The Floor Deck</a></nav>
	<h1>The written test</h1>

	<article class="sheet">
		{#if failed}
			<p class="empty">The deck did not load. Check the connection once; after that it works offline.</p>
		{:else if !deck || search === null}
			<p class="empty" aria-live="polite">Opening the deck…</p>
		{:else if !sections.length}
			<p class="empty">The deck is being written. No section is ready to test yet.</p>
		{:else if !questions}
			<p class="lede">
				One section at a time, answered cold. Nothing is marked as you go. At the end you see what
				you missed and the cards to read, and those cards lead your next sitting.
			</p>
			<fieldset class="pick">
				<legend>Which section?</legend>
				{#each sections as s (s.key)}
					<label class:on={sectionKey === s.key}>
						<input type="radio" name="section" value={s.key} bind:group={sectionKey} />
						<span class="stitle">{s.title}</span>
						<span class="scount">{s.count} cards</span>
					</label>
				{/each}
			</fieldset>
			<p class="tools">
				<button class="chip go" onclick={start} disabled={!session.ready || !sectionKey}>Begin</button>
				<a class="chip" href="{base}/service/deck">The deck</a>
			</p>
		{:else if !questions.length}
			<p class="empty">That section cannot field a test yet.</p>
			<p class="tools"><button class="chip" onclick={again}>Choose another</button></p>
		{:else if done}
			<div class="result" role="status">
				{#if misses.length}
					<h2>What you missed</h2>
					<p class="note">
						Read each card once, slowly. These lead your next sitting, and they stay owed until you
						get them right on another day.
					</p>
					{#each misses as m (m.card.id)}
						<FloorCard
							card={m.card}
							frame={deck.frame}
							sectionTitle={sectionTitle}
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
					{/each}
				{:else}
					<h2>Nothing missed.</h2>
					<p class="note">
						Every term in this test moves up the ladder and comes back later, further apart.
					</p>
				{/if}
				<p class="tools">
					{#if misses.length}
						<a class="chip go" href="{base}/service/deck/study?focus=misses">Study these now</a>
					{/if}
					<button class="chip" onclick={again}>Another test</button>
					<a class="chip" href="{base}/service/deck">The deck</a>
				</p>
			</div>
		{:else if q}
			<p class="where">{sectionTitle} · question {at + 1} of {questions.length}</p>

			{#if q.kind === 'mc'}
				<div class="ask">
					<h2 class="stem">{q.card.term}</h2>
					{#if q.card.say}<p class="say">{q.card.say}</p>{/if}
					<p class="prompt">Which of these is it?</p>
					<div class="opts">
						{#each q.options as o (o.text)}
							<button class="opt" onclick={() => pick(o)}>{o.text}</button>
						{/each}
					</div>
				</div>
			{:else}
				<div class="ask">
					<h2 class="stem">Match each term to what it is</h2>
					<p class="prompt">Each description is used once.</p>
					<div class="match">
						{#each q.cards as c (c.id)}
							<label class="row">
								<span class="mterm">{c.term}</span>
								<select class="chip" bind:value={matched[c.id]} aria-label="What is {c.term}?">
									<option value="">Choose…</option>
									{#each q.gists as g (g.id)}
										<option value={g.id} disabled={Object.entries(matched).some(([k, v]) => v === g.id && k !== c.id)}>
											{g.text}
										</option>
									{/each}
								</select>
							</label>
						{/each}
					</div>
					<p class="tools">
						<button class="chip go" onclick={submitMatch} disabled={!matchReady}>That is my answer</button>
					</p>
				</div>
			{/if}
		{/if}
	</article>
</div>

<style>
	.view { padding-block: 26px 80px; max-width: 760px; }
	.crumbs { font-size: var(--t-micro); margin-bottom: 14px; color: var(--muted); }
	.crumbs a { color: var(--muted); text-decoration: none; }
	.crumbs a:hover { color: inherit; }
	h1 { font-size: var(--t-h2); margin-bottom: 6px; }
	.lede { color: var(--ink-soft); max-width: var(--measure); margin-bottom: 16px; }
	.note { color: var(--ink-soft); max-width: var(--measure); margin-bottom: 8px; }
	.empty { padding: 32px 0; color: var(--muted); font-style: italic; }
	.where { font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; color: var(--muted); }

	.pick { border: 0; padding: 0; margin: 0 0 6px; display: grid; gap: 8px; }
	.pick legend {
		font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase;
		color: var(--muted); margin-bottom: 8px; padding: 0;
	}
	.pick label {
		display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; min-height: 44px;
		padding: 8px 14px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--card, transparent); cursor: pointer;
	}
	.pick label:hover, .pick label.on { border-color: var(--turmeric-deep); }
	.pick input { width: 18px; height: 18px; accent-color: var(--turmeric-deep); }
	.stitle { font-family: var(--display); font-size: 18px; }
	.scount { font-size: var(--t-micro); color: var(--muted); }

	.ask { border: 1px solid var(--line); background: var(--card); border-radius: var(--radius); padding: 20px 22px; margin-top: 10px; }
	.stem { font-family: var(--display); font-size: 28px; line-height: 1.15; margin: 0 0 4px; text-wrap: balance; }
	.say { font-size: var(--t-small); color: var(--ink-soft); letter-spacing: 0.04em; }
	.prompt { color: var(--muted); font-size: var(--t-small); margin: 8px 0 0; }
	.opts { display: grid; gap: 8px; margin-top: 14px; }
	.opt {
		text-align: left; border: 1px solid var(--line); background: var(--paper, transparent); color: var(--ink);
		border-radius: var(--radius); padding: 12px 14px; min-height: 44px; cursor: pointer;
		font-family: var(--display); font-size: 17px; line-height: 1.35;
	}
	.opt:hover { border-color: var(--turmeric); }

	.match { display: grid; gap: 12px; margin-top: 14px; }
	.row { display: grid; gap: 6px; }
	.mterm { font-family: var(--display); font-size: 19px; }
	.row select { width: 100%; min-height: 44px; font-size: 15px; color: var(--ink); text-overflow: ellipsis; }

	.result h2 { font-family: var(--display); font-size: 24px; margin-bottom: 8px; }
	.chose { margin-top: 10px; max-width: var(--measure); }
	.chlabel {
		font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; color: var(--muted);
		margin-right: 6px;
	}
	.because {
		border-left: 2px solid var(--turmeric-deep); background: var(--paper-raised); padding: 8px 12px;
		margin: 6px 0 4px; max-width: var(--measure); font-size: var(--t-small); color: var(--ink-soft);
	}
	.tools { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
	.tools :global(.chip) { min-height: 44px; display: inline-flex; align-items: center; }
</style>
