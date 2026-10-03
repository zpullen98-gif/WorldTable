<script lang="ts">
	import { base } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { session } from '$lib/stores/session.svelte';
	import { house } from '$lib/stores/house.svelte';
	import { markStudied } from '$lib/oot-studied';
	import {
		QUIZ_LENGTH,
		DISH_QUIZ_MIN,
		askFrom,
		buildDeck,
		drillableDishes,
		quizSubjects,
		type Choice,
		type DeckCard,
		type Question
	} from '$lib/menu-quiz';
	import { kindLabel } from '$lib/producers';
	import {
		DRILL_KINDS,
		DRILL_LABELS,
		buildFlashcards,
		drillableCounts,
		readyKinds,
		type DrillKind,
		type DrillQuestion,
		type Flashcard
	} from '$lib/house/house-drills';
	import {
		KIND_CHIPS,
		MODE_LABELS,
		PAIR_KINDS,
		QUIZ_MODES,
		ROUND_LENGTH,
		dealRound,
		explainAnswer,
		modeFromSearch,
		poolSize,
		shuffleCards,
		stillNeeded,
		type QuizMode
	} from '$lib/house-drill-round';
	import { drilledCount, drilledKey, markDrilled } from '$lib/house-drilled';

	/* Drills over The Kitchen's Menu: the dishes entered on /menu. The quiz
	 * engine is the lexicon page's, ported: ten a round, distractors from the
	 * same menu section when it has enough dishes, the same verdict ladder, the
	 * same oot:round-complete contract.
	 *
	 * Everything below the H1 sits inside <article class="sheet"> deliberately:
	 * inside Outside Of Time this route is a PAID study surface, and the
	 * monorepo's lock masks `article.sheet` children on locked routes. An
	 * overlay alone is not a gate. Standalone, the class is inert.
	 *
	 * The question engine lives in lib/menu-quiz.ts, pure and under test, with
	 * the randomness passed in; that file also says how the house's producers
	 * join the drill once there are four of them.
	 *
	 * THE HOUSE DRILLS share this route (a new route is not affordable under
	 * the precache cap): a mode row seeded from ?mode= in afterNavigate, never
	 * in load, because one prerendered file serves every query string. 'drill'
	 * deals from house.api.current() through the TypeScript generators in
	 * $lib/house/house-drills (never the port, which is the two vanilla wings'),
	 * over every kind readyKinds allows, narrowed by the kinds row; 'cards' is
	 * buildFlashcards as flip cards; 'pair' is the pairing drill over
	 * firstPickFor and zeroProofFor. All three read KEPT marks only, by the
	 * generators' own gate. 'say' needs the Maitre d' and opens nothing here.
	 *
	 * WHAT A HOUSE DRILL WRITES: markDrilled() into its own localStorage slot
	 * (lib/house-drilled.ts, never exported, capped) and markStudied() once per
	 * completed round. Nothing here touches a level, a rank or the drillLog.
	 */

	let quiz = $state<Question | null>(null);
	let picked = $state<Choice | null>(null);
	let qNum = $state(0);
	let right = $state(0);
	let verdict = $state('');

	/* flashcards */
	let deck = $state<DeckCard[] | null>(null);
	let deckIdx = $state(0);
	let revealed = $state(false);

	const dishes = $derived(house.dishes);
	const enough = $derived(dishes.length >= DISH_QUIZ_MIN);

	/* The page's gates count DISHES only, exactly as before the producers
	   arrived; the producers join the pool the questions are drawn from. */
	const drillable = $derived(drillableDishes(dishes));
	const subjects = $derived(quizSubjects(dishes, house.producers));

	/* One drillable dish would mean ten questions with one possible answer:
	 * a guaranteed 'Chef-level' verdict that teaches nothing and logs a fake
	 * clean round. Two is the floor, and the round never asks the same subject
	 * twice in a row while an alternative exists. */
	let lastSubjectId = '';

	function ask() {
		const next = askFrom(subjects, lastSubjectId, Math.random);
		if (!next) return;
		lastSubjectId = next.subjectId;
		quiz = next.question;
		picked = null;
	}

	function startQuiz() {
		if (!enough || drillable.length < 2) return;
		deck = null;
		qNum = 0;
		right = 0;
		verdict = '';
		lastSubjectId = '';
		ask();
	}

	function answer(o: Choice) {
		if (picked) return;
		picked = o;
		if (o.id === quiz!.target.id) right++;
		qNum++;
	}

	function nextQuestion() {
		if (qNum >= QUIZ_LENGTH) {
			// The house verdict ladder, verbatim from the lexicon.
			verdict =
				right >= 9
					? 'Chef-level. The pass is yours.'
					: right >= 7
						? 'Solid line cook: a few more services and it’s muscle memory.'
						: right >= 5
							? 'Stage complete: hit the flashcards on what you missed.'
							: 'Back to prep, chef; read the menu again before the next round.';
			// Contract with the OOT monorepo's shared/oot-log.js (hookTable).
			if (typeof window !== 'undefined')
				window.dispatchEvent(
					new CustomEvent('oot:round-complete', {
						detail: { kind: 'quiz', right, of: QUIZ_LENGTH }
					})
				);
			// A finished round is a day studied, product-wide (lib/oot-studied.ts).
			markStudied();
			quiz = null;
			return;
		}
		ask();
	}

	function startDeck() {
		quiz = null;
		verdict = '';
		deck = buildDeck(dishes, house.producers, Math.random);
		deckIdx = 0;
		revealed = false;
	}

	/* ---- the house drills ------------------------------------------------ */

	let mode = $state<QuizMode>('dish');
	/* The House, re-derived with the store's tick: null before the api is
	   ready and on a device with no house. */
	const current = $derived(house.current);
	const ready = $derived<DrillKind[]>(current ? readyKinds(current) : []);
	const counts = $derived(current ? drillableCounts(current) : null);
	const needs = $derived.by(() => {
		if (!current || !counts) return [] as string[];
		return DRILL_KINDS.map((k) => stillNeeded(current, k, counts)).filter(Boolean);
	});
	const pairNeeds = $derived(needs.filter((n) => n.startsWith('First pick') || n.startsWith('Without alcohol')));
	const pairReady = $derived(PAIR_KINDS.some((k) => ready.includes(k)));
	const cardCount = $derived(current ? buildFlashcards(current).length : 0);
	/* The kinds row: empty means every kind that deals; a chosen kind that
	   stops dealing (the house changed under us) drops out on its own. */
	let chosen = $state<DrillKind[]>([]);
	const active = $derived<DrillKind[]>(chosen.length ? chosen.filter((k) => ready.includes(k)) : ready);
	let whole = $state(false);
	const wholeSize = $derived(current ? poolSize(current, active) : 0);

	/* One round state for 'drill' and 'pair': the questions, the index, the
	   pick, the score and whether the round is over. */
	let round = $state<DrillQuestion[]>([]);
	let rIdx = $state(0);
	let rPicked = $state<string | null>(null);
	let rRight = $state(0);
	let rDone = $state(false);
	let rSaid = $state('');
	const rQ = $derived<DrillQuestion | null>(round[rIdx] ?? null);
	const rExplained = $derived(current && rQ && rPicked !== null ? explainAnswer(current, rQ) : '');
	const answered = $derived(rDone ? round.length : rIdx + (rPicked !== null ? 1 : 0));

	/* The flip cards. */
	let cards = $state<Flashcard[]>([]);
	let cIdx = $state(0);
	let cFlipped = $state(false);
	let cGot = $state(0);
	let cAgain = $state(0);
	let cDone = $state(false);

	/** How many answers this device holds for the current house: refreshed after every write. */
	let keptHere = $state(0);
	function refreshKept() {
		keptHere = current ? drilledCount(current.id) : 0;
	}
	$effect(() => {
		void current;
		refreshKept();
	});

	function toggleKind(k: DrillKind) {
		if (!ready.includes(k)) return;
		const now = active.includes(k) ? active.filter((x) => x !== k) : active.concat(k);
		// Never nothing: unticking the last one puts every ready kind back.
		chosen = now.length ? now : [];
	}

	function resetRound() {
		round = [];
		rIdx = 0;
		rPicked = null;
		rRight = 0;
		rDone = false;
		rSaid = '';
	}

	function startRound(kinds: readonly DrillKind[], length: number | null) {
		if (!current) return;
		resetRound();
		round = dealRound(current, kinds, length, Math.random);
		rSaid = round.length ? '' : 'Nothing to deal yet.';
	}

	function record(itemId: string, kind: string, ok: boolean) {
		if (!current) return;
		markDrilled(drilledKey(current.id, itemId, kind), ok ? 'met' : 'missed');
		refreshKept();
	}

	function pickOption(o: string) {
		if (rPicked !== null || !rQ) return;
		rPicked = o;
		const ok = o === rQ.answer;
		if (ok) rRight++;
		record(rQ.itemId, rQ.kind, ok);
	}

	function nextRound() {
		if (rIdx + 1 >= round.length) {
			rDone = true;
			// A finished round is a day studied; nothing about a level moves.
			markStudied();
			return;
		}
		rIdx++;
		rPicked = null;
	}

	function dealAgain() {
		if (mode === 'pair') startRound(PAIR_KINDS, ROUND_LENGTH);
		else startRound(active, whole ? null : ROUND_LENGTH);
	}

	function startCards() {
		if (!current) return;
		cards = shuffleCards(buildFlashcards(current), Math.random);
		cIdx = 0;
		cFlipped = false;
		cGot = 0;
		cAgain = 0;
		cDone = false;
	}

	function judgeCard(got: boolean) {
		const c = cards[cIdx];
		if (!c || !cFlipped) return;
		if (got) cGot++;
		else cAgain++;
		record(c.itemId, 'card-' + c.kind, got);
		if (cIdx + 1 >= cards.length) {
			cDone = true;
			markStudied();
			return;
		}
		cIdx++;
		cFlipped = false;
	}

	function setMode(m: QuizMode) {
		mode = m;
		resetRound();
		cDone = false;
		cards = [];
	}

	/* Seeded from the query in afterNavigate, never in load: a prerendered
	   page may not read the query at load time. Only the mode is read; the
	   round itself waits for a chip. */
	afterNavigate(() => {
		setMode(modeFromSearch(page.url.search));
	});
</script>

<svelte:head><title>Drill the Menu · The World Table</title></svelte:head>

<div class="shell view">
	<article class="sheet">
		<h1>Drill the Menu</h1>
		<p class="crumbs"><a href="{base}/menu">◂ My Menu</a></p>

		<p class="lede">
			The Kitchen’s Menu, drilled the way the lexicon is: descriptions, ingredients, prices and
			allergens, asked the way a guest asks.
		</p>

		<nav class="modes" aria-label="What to drill">
			{#each QUIZ_MODES as m (m)}
				<button class="chip mode" class:on={mode === m} aria-pressed={mode === m} onclick={() => setMode(m)}>
					{MODE_LABELS[m]}{mode === m ? ', chosen' : ', off'}
				</button>
			{/each}
		</nav>

		{#if mode === 'say'}
			<p class="empty" role="status">
				Say it back needs the Maître d’ and is not on this page yet. Nothing opens here; the
				other modes work offline.
			</p>
		{:else if mode !== 'dish'}
			{#if !current}
				<p class="empty">
					No house on this device yet. The house drills read what a house has kept: start one or
					import a pack on <a href="{base}/menu">My Menu</a>.
				</p>
			{:else if mode === 'drill'}
				<p class="count">
					{current.name} · {ready.length} of {DRILL_KINDS.length} kinds deal · {keptHere} {keptHere === 1 ? 'answer' : 'answers'} kept on this device
				</p>
				{#if !round.length}
					<div class="kinds" role="group" aria-label="Which kinds to ask">
						{#each DRILL_KINDS as k (k)}
							{#if ready.includes(k)}
								<button class="chip kind" class:on={active.includes(k)} aria-pressed={active.includes(k)} onclick={() => toggleKind(k)}>
									{KIND_CHIPS[k]}{active.includes(k) ? '' : ', off'}
								</button>
							{:else}
								<button class="chip kind" disabled>{KIND_CHIPS[k]}, not yet</button>
							{/if}
						{/each}
					</div>
					{#if needs.length}
						<ul class="needs">
							{#each needs as line (line)}<li>{line}</li>{/each}
						</ul>
					{/if}
					<div class="tools">
						<button class="chip" class:on={!whole} aria-pressed={!whole} onclick={() => (whole = false)}>A round of {ROUND_LENGTH}{whole ? ', off' : ', chosen'}</button>
						<button class="chip" class:on={whole} aria-pressed={whole} onclick={() => (whole = true)}>The whole pool, {wholeSize}{whole ? ', chosen' : ', off'}</button>
						<button class="chip go" disabled={!active.length} onclick={() => startRound(active, whole ? null : ROUND_LENGTH)}>
							{active.length ? 'Deal ▸' : 'Nothing deals yet'}
						</button>
					</div>
					{#if rSaid}<p class="count" role="status">{rSaid}</p>{/if}
				{/if}
			{:else if mode === 'pair'}
				<p class="count">
					{current.name} · pairings · {keptHere} {keptHere === 1 ? 'answer' : 'answers'} kept on this device
				</p>
				{#if !round.length}
					{#if pairNeeds.length}
						<ul class="needs">
							{#each pairNeeds as line (line)}<li>{line}</li>{/each}
						</ul>
					{/if}
					<div class="tools">
						<button class="chip go" disabled={!pairReady} onclick={() => startRound(PAIR_KINDS, ROUND_LENGTH)}>
							{pairReady ? 'Deal the pairings ▸' : 'Nothing deals yet'}
						</button>
					</div>
					{#if rSaid}<p class="count" role="status">{rSaid}</p>{/if}
				{/if}
			{:else if mode === 'cards'}
				<p class="count">
					{current.name} · {cardCount} cards from what is kept · {keptHere} {keptHere === 1 ? 'answer' : 'answers'} kept on this device
				</p>
				{#if !cards.length}
					<div class="tools">
						<button class="chip go" disabled={!cardCount} onclick={startCards}>
							{cardCount ? 'Shuffle the cards ▸' : 'No cards yet: keep a part, a line or a term first'}
						</button>
					</div>
				{:else if cDone}
					<div class="flash" role="status">
						<p class="eyebrow">Deck complete</p>
						<p class="term">Got it {cGot} · Again {cAgain}</p>
						<p class="def">{cards.length} cards turned. Shuffle again to go round the deck once more.</p>
						<div class="flashtools">
							<button class="chip" onclick={startCards}>Shuffle again ↦</button>
							<button class="chip" onclick={() => (cards = [])}>Close the deck</button>
						</div>
					</div>
				{:else}
					{@const c = cards[cIdx]}
					<div class="flash card" data-flipped={cFlipped ? 'yes' : 'no'}>
						<p class="eyebrow">Card {cIdx + 1} of {cards.length} · {c.kind === 'mixUp' ? 'mix-up' : c.kind} · {cFlipped ? 'shown' : 'hidden'}</p>
						<p class="term">{c.front}</p>
						{#if cFlipped}
							<p class="def back">{c.back}</p>
						{:else}
							<p class="def">Say it out loud, then flip.</p>
						{/if}
						<div class="flashtools">
							{#if cFlipped}
								<button class="chip go" onclick={() => judgeCard(true)}>Got it</button>
								<button class="chip" onclick={() => judgeCard(false)}>Again</button>
							{:else}
								<button class="chip go" onclick={() => (cFlipped = true)}>Flip ↦</button>
							{/if}
							<button class="chip" onclick={() => (cards = [])}>Close the deck</button>
						</div>
					</div>
				{/if}
			{/if}

			{#if current && (mode === 'drill' || mode === 'pair') && round.length}
				{#if rDone}
					<div class="flash" role="status">
						<p class="eyebrow">Round complete</p>
						<p class="term">{rRight} right of {round.length}</p>
						<p class="def">
							{rRight === round.length ? 'Every one. Deal again tomorrow and see if it holds.' : 'Deal again for a fresh mix.'}
						</p>
						<div class="flashtools">
							<button class="chip go" onclick={dealAgain}>Deal again ↦</button>
							<button class="chip" onclick={resetRound}>Close</button>
						</div>
					</div>
				{:else if rQ}
					<div class="flash drill">
						<p class="eyebrow">
							{DRILL_LABELS[rQ.kind]} · question {rIdx + 1} of {round.length}
						</p>
						<p class="score" aria-live="polite">{rRight} right of {answered} answered</p>
						<p class="def quizdef">{rQ.stem}</p>
						<div class="opts">
							{#each rQ.options as o (o)}
								<button
									class="opt"
									class:right={rPicked !== null && o === rQ.answer}
									class:wrong={rPicked === o && o !== rQ.answer}
									disabled={rPicked !== null && o !== rPicked && o !== rQ.answer}
									onclick={() => pickOption(o)}
								>
									{o}
								</button>
							{/each}
						</div>
						{#if rPicked !== null}
							<p class="answer" role="status">
								<b>{rPicked === rQ.answer ? 'Right.' : 'Not that one.'}</b>
								The answer: {rQ.answer}.{#if rExplained}&nbsp;<span class="why">{rExplained}</span>{/if}
							</p>
						{/if}
						<div class="flashtools">
							{#if rPicked !== null}
								<button class="chip go" onclick={nextRound}>{rIdx + 1 >= round.length ? 'Finish ↦' : 'Next ↦'}</button>
							{/if}
							<button class="chip" onclick={resetRound}>Quit the round</button>
						</div>
					</div>
				{/if}
			{/if}
		{:else if !enough}
			<p class="empty">
				The drill opens at four dishes. {dishes.length
					? `${dishes.length} on the menu so far: add ${4 - dishes.length} more on `
					: 'Enter the menu on '}<a href="{base}/menu">My Menu</a>.
			</p>
		{:else if drillable.length < 2 && !deck}
			<p class="empty">
				The quiz needs at least two dishes it can ask about: a dish counts once it has a
				description, two or more ingredient lines, or a price no other dish on the menu shares.
				Fill them in on <a href="{base}/menu">My Menu</a>. The flashcards work meanwhile.
			</p>
			<div class="tools">
				<button class="chip" onclick={startDeck}>Study mode ▸ flashcards</button>
			</div>
		{:else}
			{#if !quiz && !verdict && !deck}
				<div class="tools">
					<button class="chip" onclick={startQuiz}>Quiz me ▸ multiple choice</button>
					<button class="chip" onclick={startDeck}>Study mode ▸ flashcards</button>
					<span class="count">{dishes.length} dishes · {drillable.length} drillable</span>
				</div>
			{/if}

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
					<p class="eyebrow">
						{quiz.kindLabel} · question {Math.min(qNum + (picked ? 0 : 1), QUIZ_LENGTH)} of {QUIZ_LENGTH}
					</p>
					<p class="def quizdef">{quiz.prompt}</p>
					<div class="opts">
						{#each quiz.options as o (o.id)}
							<button
								class="opt"
								class:right={picked && o.id === quiz.target.id}
								class:wrong={picked?.id === o.id && o.id !== quiz.target.id}
								disabled={!!picked && o.id !== picked.id && o.id !== quiz.target.id}
								onclick={() => answer(o)}
							>
								{o.name}
							</button>
						{/each}
					</div>
					<div class="flashtools">
						{#if picked}
							<button class="chip" onclick={nextQuestion}>
								{qNum >= QUIZ_LENGTH ? 'See the verdict ↦' : 'Next ↦'}
							</button>
						{/if}
						<button class="chip" onclick={() => ((quiz = null), (qNum = 0))}>Quit the round</button>
					</div>
				</div>
			{:else if deck}
				{@const card = deck[deckIdx]}
				<div class="flash">
					{#if card.kind === 'producer'}
						{@const p = card.producer}
						<!-- "Tell me about {producer}": the story is the answer, in the same
						     .flash .def a dish card uses. -->
						<p class="eyebrow">Card {deckIdx + 1} of {deck.length} · Tell me about</p>
						<p class="term">{p.name}</p>
						{#if revealed}
							<p class="def">{p.story}</p>
							<p class="def small">
								{kindLabel(p.kind)}{#if p.place}, {p.place}{/if}.{#if p.supplies}&nbsp;Supplies
									{p.supplies}.{/if}
							</p>
						{:else}
							<p class="def">Tell the table about them: where they are, what they supply, and the story. Then flip.</p>
						{/if}
					{:else}
					{@const d = card.dish}
					<p class="eyebrow">Card {deckIdx + 1} of {deck.length} · {d.section}</p>
					<p class="term">{d.name}</p>
					{#if revealed}
						{#if d.description}<p class="def">{d.description}</p>{/if}
						{#if d.ingredients.length}<p class="def small">{d.ingredients.join(' · ')}</p>{/if}
						<!-- Three states, never silence, the twin of the fix on /menu and
						     on the recipe page. A server rehearsing off this card must not
						     learn a blank as "none". -->
						<p class="def small">
							{#if !d.allergensCheckedAt}
								<b>Allergens not marked</b>: ask the kitchen before you answer this at a table.
							{:else if d.allergens.length}
								Allergens: {d.allergens.join(', ')}.
							{:else}
								No allergens marked on this dish.
							{/if}
							{#if d.price}&nbsp;{d.price}.{/if}
						</p>
					{:else}
						<p class="def">Say the description, the build and the allergens, then flip.</p>
					{/if}
					{/if}
					<div class="flashtools">
						{#if revealed}
							<button
								class="chip"
								onclick={() => {
									if (deckIdx + 1 >= deck!.length) deck = null;
									else {
										deckIdx++;
										revealed = false;
									}
								}}
							>
								{deckIdx + 1 >= deck.length ? 'Done ↦' : 'Next card ↦'}
							</button>
						{:else}
							<button class="chip" onclick={() => (revealed = true)}>Flip ↦</button>
						{/if}
						<button class="chip" onclick={() => (deck = null)}>Close the deck</button>
					</div>
				</div>
			{/if}
		{/if}
	</article>
</div>

<style>
	/*
	 * padding-BLOCK, deliberately. The shorthand `padding: 26px 0 80px` zeroed
	 * padding-inline, and this scoped rule out-specifies the global
	 * `.shell {{ padding-inline: 20px }}` - so this page shipped with its text
	 * touching the glass on phones. Six routes had the same line; measured at
	 * 320 and 375, h1 and lede sat at x=0 while every healthy route sat at 20.
	 */
	.view { padding-block: 26px 80px; max-width: 760px; }
	.sheet h1 { font-size: var(--t-h2); margin-bottom: 6px; }
	.crumbs { font-size: var(--t-micro); margin-bottom: 14px; }
	.crumbs a { color: var(--muted); text-decoration: none; }
	.crumbs a:hover { color: inherit; }
	.lede { color: var(--ink-soft); max-width: var(--measure); margin-bottom: 18px; }
	.tools, .modes, .kinds { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 14px 0; }
	/* Every control on the page is at least 44px tall: a thumb on a phone in a
	   dark corridor between courses. */
	.chip {
		border: 1px solid var(--line); background: var(--card); padding: 8px 14px;
		border-radius: var(--radius); cursor: pointer; font-size: 14px; min-height: 44px;
	}
	.chip:hover:not(:disabled) { border-color: var(--turmeric); }
	.chip.on { border-color: var(--turmeric); font-weight: 600; }
	.chip.go { border-color: var(--leaf); }
	.chip:disabled { opacity: 0.6; cursor: default; }
	.count { font-size: var(--t-micro); color: var(--muted); }
	.empty { padding: 40px 12px; color: var(--muted); font-style: italic; }
	.empty a { color: inherit; }
	.needs { margin: 8px 0 14px; padding-left: 18px; font-size: var(--t-small); color: var(--muted); }
	.needs li { margin-bottom: 2px; }

	.flash {
		border: 1px solid var(--line); background: var(--card); border-radius: var(--radius);
		padding: 20px 22px; margin-top: 10px;
	}
	.eyebrow {
		font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase; color: var(--muted); margin-bottom: 8px;
	}
	.term { font-family: var(--display); font-size: 26px; margin-bottom: 6px; }
	.def { max-width: var(--measure); margin-bottom: 6px; }
	.def.small { font-size: var(--t-small); color: var(--muted); }
	.def.back { font-size: 18px; }
	.quizdef { font-style: italic; }
	.score { font-size: var(--t-small); color: var(--muted); margin-bottom: 6px; }
	.answer { max-width: var(--measure); margin: 6px 0; }
	.answer .why { color: var(--ink-soft); }
	.opts { display: grid; gap: 8px; margin: 14px 0; }
	.opt {
		text-align: left; border: 1px solid var(--line); background: var(--paper, transparent);
		border-radius: var(--radius); padding: 10px 14px; cursor: pointer;
		font-family: var(--display); font-size: 17px; min-height: 44px;
	}
	.opt:hover:not(:disabled) { border-color: var(--turmeric); }
	.opt.right { border-color: var(--leaf); }
	.opt.wrong { border-color: var(--chili); }
	.opt:disabled { opacity: 0.55; cursor: default; }
	.flashtools { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
</style>
