<script lang="ts">
	import { base } from '$app/paths';
	import { afterNavigate, goto } from '$app/navigation';
	import { tick } from 'svelte';
	import { findItem, inMeal, itemCards, latestVerdicts, say, studyProgress, type ItemCard } from '$lib/study';
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
		dealSection,
		modeFromSearch,
		studyScopeFromSearch,
		type StudyAsk,
		poolSize,
		shuffleCards,
		shuffleWith,
		stillNeeded,
		type QuizMode
	} from '$lib/house-drill-round';
	import { drilledCount, drilledKey, markDrilled, readDrilled } from '$lib/house-drilled';
	import {
		LENGTH_CHIPS,
		SAY_KINDS,
		SAY_KIND_CHIPS,
		SAY_LENGTHS,
		SERVICE_EYEBROW,
		SPEECH_SENTENCE,
		VERDICT_WORDS,
		gradeGuest,
		gradeSaid,
		guestDeck,
		guestKey,
		lengthFor,
		pickNext,
		sayCounts,
		sayKey,
		saySections,
		serviceNoteOf,
		type GuestCard
	} from '$lib/house-say';
	import type { SaidGrade, SayLength, ScenarioGrade } from '$lib/house/house-drills';
	import { LINE_CAPS, type ItemKind } from '$lib/house/house-schema';
	import { wordCount } from '$lib/house/house-lines';

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
	 * generators' own gate. 'say' is Say it back and 'guest' is Guest at the
	 * table, both offline with no key: what is typed (or spoken, where the
	 * browser has a speech service) is graded on the device by gradeSaid and
	 * gradeScenario against the KEPT line or answer ($lib/house-say), and
	 * nothing is recorded until Record it is pressed. Allergens stay with the
	 * kitchen: a service note shows only as the person's own words under the
	 * fixed eyebrow.
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
		round =
			drillSec || drillMeal
				? dealSection(current, kinds, drillSec, length, Math.random, drillMeal)
				: dealRound(current, kinds, length, Math.random);
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

	/* ---- the item deck: one card per dish, from the study view ------------
	 *
	 * The default of 'cards' when the house has kept lines: the dish's name on
	 * the front, its ten second line, price, pairing and five parts on the
	 * back (study.ts itemCards, kept marks only). The whole front is the Flip
	 * button; Got it and Again are not drawn until the card is turned, so a
	 * stray tap never grades a card nobody read. An answer is recorded as
	 * 'card-item' in the house drill slot, the study view's progress reads it
	 * back, and nothing here touches a level. "Part by part" is the deck this
	 * page always had.
	 */
	type Scope = { kind: 'all' } | { kind: 'section'; section: string } | { kind: 'weak' } | { kind: 'item'; id: string } | { kind: 'parts' };
	type Entry = { item: ItemCard; part?: undefined } | { part: Flashcard; item?: undefined };
	let studyAsk = $state<StudyAsk>({ item: '', section: '', deck: '', scenario: '', meal: '' });
	let pendingAsk = $state(false);
	let fromStudy = $state(false);
	let drillSec = $state('');
	/* The study view's shift filter, carried in the query: it narrows every deck
	   and round dealt here, as it narrows the rows there ('' is all day). */
	let drillMeal = $state('');
	let scope = $state<Scope>({ kind: 'all' });
	let deckTick = $state(0);
	const allItems = $derived.by(() => {
		const h = current;
		if (!h) return [] as ItemCard[];
		return itemCards(h, 'dish', { all: true }).filter((c) => {
			const it = findItem(h, c.itemId);
			return !it || inMeal(it, drillMeal);
		});
	});
	const itemSections = $derived.by(() => {
		const order: string[] = [];
		const n = new Map<string, number>();
		for (const c of allItems) {
			if (!n.has(c.section)) order.push(c.section);
			n.set(c.section, (n.get(c.section) ?? 0) + 1);
		}
		return order.map((section) => ({ section, count: n.get(section) ?? 0 }));
	});
	const weakIds = $derived.by(() => {
		void deckTick;
		void keptHere;
		if (!current) return [] as string[];
		const latest = latestVerdicts(current.id, readDrilled());
		return studyProgress(allItems.map((c) => c.itemId), latest).againIds;
	});
	let deckOf = $state<Entry[]>([]);
	let dIdx = $state(0);
	let dFlipped = $state(false);
	let dGot = $state(0);
	let dAgain = $state(0);
	let dDone = $state(false);
	let dMissed = $state<string[]>([]);
	/* The back's five parts start closed on every card; the summary says which way it goes. */
	let partsOpen = $state(false);
	let deckEl: HTMLElement | undefined = $state();
	const scopeLabel = $derived(
		scope.kind === 'section' ? scope.section : scope.kind === 'weak' ? 'My weak ones' : scope.kind === 'item' ? (allItems.find((c) => c.itemId === (scope as { id: string }).id)?.name ?? '') : 'Whole menu'
	);

	function entriesFor(sc: Scope): Entry[] {
		if (!current) return [];
		if (sc.kind === 'item') {
			const card = allItems.find((c) => c.itemId === sc.id);
			const parts = buildFlashcards(current).filter((f) => f.itemId === sc.id);
			return [...(card ? [{ item: card }] : []), ...parts.map((part) => ({ part }))];
		}
		const pool =
			sc.kind === 'section'
				? allItems.filter((c) => c.section === sc.section)
				: sc.kind === 'weak'
					? allItems.filter((c) => weakIds.includes(c.itemId))
					: allItems;
		return shuffleWith(pool, Math.random).map((item) => ({ item }));
	}

	async function toDeck() {
		await tick();
		deckEl?.scrollIntoView({ block: 'start' });
	}

	function dealItems(sc: Scope, only?: string[]) {
		scope = sc;
		cards = [];
		cDone = false;
		if (sc.kind === 'parts') {
			deckOf = [];
			startCards();
			return;
		}
		let list = entriesFor(sc);
		if (only) list = list.filter((e) => e.item && only.includes(e.item.itemId));
		deckOf = list;
		dIdx = 0;
		dFlipped = false;
		dGot = 0;
		dAgain = 0;
		dDone = false;
		dMissed = [];
		if (list.length) void toDeck();
	}

	function flipItem() {
		partsOpen = false;
		dFlipped = true;
		void toDeck();
	}

	function judgeItem(got: boolean) {
		const e = deckOf[dIdx];
		if (!e || !dFlipped || !current) return;
		if (got) dGot++;
		else {
			dAgain++;
			if (e.item) dMissed = [...dMissed, e.item.itemId];
		}
		if (e.item) record(e.item.itemId, 'card-item', got);
		else record(e.part.itemId, 'card-' + e.part.kind, got);
		deckTick++;
		if (dIdx + 1 >= deckOf.length) {
			dDone = true;
			markStudied();
			return;
		}
		dIdx++;
		dFlipped = false;
		void toDeck();
	}

	/** The way out of a deck: back to the study view it came from, or to My Menu. */
	function closeDeck() {
		if (fromStudy && typeof history !== 'undefined' && history.length > 1) {
			history.back();
			return;
		}
		void goto(`${base}/menu`);
	}

	/* What the study view asked for, applied once the house is read. */
	$effect(() => {
		if (!pendingAsk || !current) return;
		pendingAsk = false;
		const a = studyAsk;
		if (mode === 'cards' && allItems.length) {
			if (a.deck === 'parts') dealItems({ kind: 'parts' });
			else if (a.item && allItems.some((c) => c.itemId === a.item)) dealItems({ kind: 'item', id: a.item });
			else if (a.deck === 'weak') dealItems({ kind: 'weak' });
			else if (a.section && allItems.some((c) => c.section === a.section)) dealItems({ kind: 'section', section: a.section });
			else dealItems({ kind: 'all' });
		} else if (mode === 'say' && a.item) {
			if (sayList.some((i) => i.id === a.item)) sayPick(a.item);
		} else if (mode === 'guest' && a.scenario) {
			const card = guestCards.find((c) => c.id === a.scenario);
			if (card) {
				gCard = card;
				guestReset();
			}
		}
	});

	function setMode(m: QuizMode) {
		mode = m;
		resetRound();
		cDone = false;
		cards = [];
		deckOf = [];
		dDone = false;
		recogniser?.stop();
		sayReset();
		gCard = null;
		guestReset();
	}

	/* ---- Say it back, offline -------------------------------------------- */

	let sayKinds = $state<ItemKind[]>(['dish']);
	const sections = $derived(current ? saySections(current, sayKinds) : []);
	const sayList = $derived(sections.flatMap((s) => s.items));
	const sayHave = $derived(current ? sayCounts(current) : { dish: 0, cocktail: 0, wine: 0 });
	let sayId = $state('');
	const sayItem = $derived(sayList.find((i) => i.id === sayId) ?? null);
	let sayLen = $state<SayLength>('s20');
	const lenNow = $derived(lengthFor(sayItem, sayLen));
	const capNow = $derived(LINE_CAPS[lenNow]);
	let sayText = $state('');
	const sayWords = $derived(wordCount(sayText));
	let sayGrade = $state<SaidGrade | null>(null);
	let sayRecorded = $state(false);
	const sayNote = $derived(current && sayGrade ? serviceNoteOf(current, sayGrade.itemId) : '');

	/* The item in hand stays while it is on the list; otherwise the first. */
	$effect(() => {
		if (sayList.length && !sayList.some((i) => i.id === sayId)) sayId = sayList[0].id;
	});

	function sayReset() {
		sayText = '';
		sayGrade = null;
		sayRecorded = false;
	}

	function toggleSayKind(k: ItemKind) {
		const now = sayKinds.includes(k) ? sayKinds.filter((x) => x !== k) : SAY_KINDS.filter((x) => x === k || sayKinds.includes(x));
		// Never nothing: unticking the last kind puts the dishes back.
		sayKinds = now.length ? now : ['dish'];
		sayReset();
	}

	function sayPick(id: string) {
		sayId = id;
		sayReset();
	}

	function sayNext() {
		const next = pickNext(sayList, sayId, Math.random);
		if (next) sayPick(next.id);
	}

	function sayCheck() {
		if (!current || !sayItem) return;
		sayGrade = gradeSaid(current, sayItem.id, lenNow, sayText);
		sayRecorded = false;
	}

	function sayRecord() {
		if (!current || !sayGrade || sayRecorded) return;
		markDrilled(sayKey(current.id, sayGrade.itemId, sayGrade.length), sayGrade.verdict);
		// One completed attempt is a day studied; nothing about a level moves.
		markStudied();
		sayRecorded = true;
		refreshKept();
	}

	/* ---- Guest at the table, offline ------------------------------------- */

	const guestCards = $derived(current ? guestDeck(current) : []);
	const guestScenarios = $derived(guestCards.filter((c) => c.kind === 'scenario').length);
	let gCard = $state<GuestCard | null>(null);
	let gText = $state('');
	const gWords = $derived(wordCount(gText));
	let gGrade = $state<ScenarioGrade | null>(null);
	let gRecorded = $state(false);

	function guestReset() {
		gText = '';
		gGrade = null;
		gRecorded = false;
	}

	function guestDeal() {
		const next = pickNext(guestCards, gCard?.id ?? '', Math.random);
		gCard = next;
		guestReset();
	}

	function guestCheck() {
		if (!current || !gCard) return;
		gGrade = gradeGuest(current, gCard, gText);
		gRecorded = false;
	}

	function guestRecord() {
		if (!current || !gCard || !gGrade || gRecorded) return;
		markDrilled(guestKey(current.id, gCard.id), gGrade.verdict);
		markStudied();
		gRecorded = true;
		refreshKept();
	}

	/* ---- the browser's speech service, only where it exists --------------- */

	type Recogniser = {
		lang: string;
		interimResults: boolean;
		continuous: boolean;
		onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
		onend: (() => void) | null;
		onerror: ((ev: { error?: string }) => void) | null;
		start(): void;
		stop(): void;
	};
	let speechOk = $state(false);
	let listening = $state<'' | 'say' | 'guest'>('');
	let speechSaid = $state('');
	let recogniser: Recogniser | null = null;

	function speechCtor(): (new () => Recogniser) | null {
		if (typeof window === 'undefined') return null;
		const w = window as unknown as { SpeechRecognition?: new () => Recogniser; webkitSpeechRecognition?: new () => Recogniser };
		return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
	}

	function speak(target: 'say' | 'guest') {
		if (listening) {
			recogniser?.stop();
			return;
		}
		const Ctor = speechCtor();
		if (!Ctor) return;
		speechSaid = '';
		try {
			const rec = new Ctor();
			rec.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-GB';
			rec.interimResults = false;
			rec.continuous = false;
			rec.onresult = (ev) => {
				let heard = '';
				for (let i = 0; i < ev.results.length; i++) heard += (heard ? ' ' : '') + (ev.results[i][0]?.transcript ?? '');
				heard = heard.trim();
				if (!heard) return;
				if (target === 'say') {
					sayText = sayText.trim() ? sayText.trim() + ' ' + heard : heard;
					sayGrade = null;
					sayRecorded = false;
				} else {
					gText = gText.trim() ? gText.trim() + ' ' + heard : heard;
					gGrade = null;
					gRecorded = false;
				}
			};
			rec.onerror = (ev) => {
				speechSaid = 'The speech service did not hear that' + (ev && ev.error ? ` (${ev.error})` : '') + '. Type it instead.';
			};
			rec.onend = () => {
				listening = '';
				recogniser = null;
			};
			recogniser = rec;
			listening = target;
			rec.start();
		} catch {
			listening = '';
			recogniser = null;
			speechSaid = 'The speech service would not start. Type it instead.';
		}
	}

	/* Seeded from the query in afterNavigate, never in load: a prerendered
	   page may not read the query at load time. Only the mode is read; the
	   round itself waits for a chip. */
	afterNavigate(() => {
		speechOk = !!speechCtor();
		setMode(modeFromSearch(page.url.search));
		studyAsk = studyScopeFromSearch(page.url.search);
		drillSec = mode === 'drill' ? studyAsk.section : '';
		drillMeal = studyAsk.meal;
		fromStudy = !!(page.state as App.PageState | undefined)?.fromStudy;
		pendingAsk = true;
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

		{#if mode !== 'dish'}
			{#if !current}
				<p class="empty">
					No house on this device yet. The house drills read what a house has kept: start one or
					import a pack on <a href="{base}/menu">My Menu</a>.
				</p>
			{:else if mode === 'drill'}
				<p class="count">
					{current.name} · {ready.length} of {DRILL_KINDS.length} kinds deal · {keptHere} {keptHere === 1 ? 'answer' : 'answers'} kept on this device
				</p>
				{#if drillSec}
					<p class="count" role="status">This round asks about {drillSec} only. <button class="chip" onclick={() => (drillSec = '')}>The whole menu</button></p>
				{/if}
				{#if drillMeal}
					<p class="count" role="status">This round asks about {drillMeal} only. <button class="chip" onclick={() => (drillMeal = '')}>{say('allDay')}</button></p>
				{/if}
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
			{:else if mode === 'say'}
				<p class="count">
					{current.name} · Say it back, on this device with no key · {keptHere} {keptHere === 1 ? 'answer' : 'answers'} kept on this device
				</p>
				<p class="kitchen">Allergens are the kitchen’s: confirm them at lineup, never from a drill.</p>
				<div class="kinds" role="group" aria-label="What to say back">
					{#each SAY_KINDS as k (k)}
						<button class="chip kind" class:on={sayKinds.includes(k)} aria-pressed={sayKinds.includes(k)} disabled={!sayHave[k]} onclick={() => toggleSayKind(k)}>
							{SAY_KIND_CHIPS[k]}, {sayHave[k]}{!sayHave[k] ? ', none kept' : sayKinds.includes(k) ? ', chosen' : ', off'}
						</button>
					{/each}
				</div>
				{#if !sayList.length}
					<p class="empty">Nothing here has a kept timed line yet. Keep a ten, twenty or forty five second line on My Menu and it can be said back here.</p>
				{:else}
					<div class="say flash">
						<div class="pickrow">
							<label class="fieldlabel" for="say-item">The item</label>
							<select id="say-item" class="chip pick" value={sayId} onchange={(e) => sayPick((e.currentTarget as HTMLSelectElement).value)}>
								{#each sections as sec (sec.section + sec.items[0].id)}
									<optgroup label={sec.section}>
										{#each sec.items as it (it.id)}<option value={it.id}>{it.name}</option>{/each}
									</optgroup>
								{/each}
							</select>
							<button class="chip" onclick={sayNext}>Next, at random ↦</button>
						</div>
						<div class="tools" role="group" aria-label="How long">
							{#each SAY_LENGTHS as l (l)}
								{@const has = !!sayItem && sayItem.lengths.includes(l)}
								<button class="chip len" class:on={lenNow === l} aria-pressed={lenNow === l} disabled={!has} onclick={() => { sayLen = l; sayGrade = null; sayRecorded = false; }}>
									{LENGTH_CHIPS[l]}{!has ? ', not kept' : lenNow === l ? ', chosen' : ', off'}
								</button>
							{/each}
						</div>
						<p class="eyebrow">{sayItem?.name ?? ''} · the {LENGTH_CHIPS[lenNow]} line, {capNow} words at most</p>
						<label class="fieldlabel" for="say-text">What you would say at the table</label>
						<textarea id="say-text" class="said" rows="5" bind:value={sayText} oninput={() => { sayGrade = null; sayRecorded = false; }}></textarea>
						<p class="wc" class:over={sayWords > capNow} aria-live="polite">
							{sayWords} of {capNow} words{sayWords > capNow ? `, ${sayWords - capNow} over the cap` : ', within the cap'}
						</p>
						{#if speechOk}
							<div class="speakrow">
								<button class="chip" aria-pressed={listening === 'say'} onclick={() => speak('say')}>{listening === 'say' ? 'Listening: press to stop' : 'Speak'}</button>
								<span class="small">{SPEECH_SENTENCE}</span>
							</div>
						{/if}
						{#if speechSaid}<p class="small" role="status">{speechSaid}</p>{/if}
						<div class="flashtools">
							<button class="chip go" disabled={!sayText.trim()} onclick={sayCheck}>Check</button>
						</div>
					</div>

					{#if sayGrade}
						<div class="flash graded say-grade" role="status">
							<p class="eyebrow">{sayGrade.name} · {LENGTH_CHIPS[sayGrade.length]}</p>
							<p class="term verdict" data-verdict={sayGrade.verdict}>{VERDICT_WORDS[sayGrade.verdict]}</p>
							<p class="def small">{sayGrade.words} of {sayGrade.cap} words · {sayGrade.nameSaid ? 'the name said' : 'the name not said'}</p>
							<ul class="parts">
								{#each sayGrade.parts as p (p.key)}
									<li data-hit={p.inLine ? (p.hit ? 'hit' : 'missed') : 'not in this line'}>
										<b>{p.inLine ? (p.hit ? 'Hit' : 'Missed') : 'Not in this line'}</b>: {p.label}
									</li>
								{/each}
							</ul>
							{#if sayGrade.notes.length}
								<ul class="notes">
									{#each sayGrade.notes as n (n)}<li>{n}</li>{/each}
								</ul>
							{/if}
							<div class="beside">
								<div>
									<p class="eyebrow">Your kept line</p>
									<p class="def kept">{sayGrade.keptLine}</p>
								</div>
								<div>
									<p class="eyebrow">What you said</p>
									<p class="def yours">{sayText}</p>
								</div>
							</div>
							{#if sayNote}
								<p class="eyebrow">{SERVICE_EYEBROW}</p>
								<p class="def small note">{sayNote}</p>
							{/if}
							<div class="flashtools">
								<button class="chip go" disabled={sayRecorded} onclick={sayRecord}>{sayRecorded ? 'Recorded' : 'Record it'}</button>
								<button class="chip" onclick={sayReset}>Try again</button>
								<button class="chip" onclick={sayNext}>Next, at random ↦</button>
							</div>
						</div>
					{/if}
				{/if}
			{:else if mode === 'guest'}
				<p class="count">
					{current.name} · Guest at the table, on this device with no key · {guestScenarios} {guestScenarios === 1 ? 'guest' : 'guests'} and {guestCards.length - guestScenarios} which is which · {keptHere} {keptHere === 1 ? 'answer' : 'answers'} kept on this device
				</p>
				<p class="kitchen">Allergens are the kitchen’s: when a guest asks, confirm with the kitchen at lineup, never from a drill.</p>
				{#if !guestCards.length}
					<p class="empty">No kept guest answers yet. Keep an answer on a scenario, or a difference on a mix-up, on My Menu and the guest can sit down here.</p>
				{:else if !gCard}
					<div class="tools">
						<button class="chip go" onclick={guestDeal}>Seat a guest ▸</button>
					</div>
				{:else}
					<div class="flash guest">
						<p class="eyebrow">{gCard.kind === 'mixUp' ? 'Which is which' : 'A guest'} · {gCard.title}</p>
						<p class="term">The guest says</p>
						<blockquote class="def guestsays">{gCard.guest}</blockquote>
						<label class="fieldlabel" for="guest-text">What you would say back</label>
						<textarea id="guest-text" class="said" rows="5" bind:value={gText} oninput={() => { gGrade = null; gRecorded = false; }}></textarea>
						<p class="wc" aria-live="polite">{gWords} {gWords === 1 ? 'word' : 'words'}</p>
						{#if speechOk}
							<div class="speakrow">
								<button class="chip" aria-pressed={listening === 'guest'} onclick={() => speak('guest')}>{listening === 'guest' ? 'Listening: press to stop' : 'Speak'}</button>
								<span class="small">{SPEECH_SENTENCE}</span>
							</div>
						{/if}
						{#if speechSaid}<p class="small" role="status">{speechSaid}</p>{/if}
						<div class="flashtools">
							<button class="chip go" disabled={!gText.trim()} onclick={guestCheck}>Check</button>
							<button class="chip" onclick={guestDeal}>Another guest ↦</button>
						</div>
					</div>

					{#if gGrade}
						<div class="flash graded guest-grade" role="status">
							<p class="eyebrow">{gGrade.title}</p>
							<p class="term verdict" data-verdict={gGrade.verdict}>{VERDICT_WORDS[gGrade.verdict]}</p>
							<ul class="parts">
								{#each gGrade.clauses as c (c.key)}
									<li data-hit={c.hit ? 'hit' : 'missed'}><b>{c.hit ? 'Hit' : 'Missed'}</b>: {c.label}</li>
								{/each}
							</ul>
							{#if gGrade.items.length}
								<p class="def small">
									{#each gGrade.items as it, i (it.id)}{i ? ' · ' : ''}{it.name}, {it.named ? 'named' : 'not named'}{/each}
								</p>
							{/if}
							{#if gGrade.notes.length}
								<ul class="notes">
									{#each gGrade.notes as n (n)}<li>{n}</li>{/each}
								</ul>
							{/if}
							<div class="beside">
								<div>
									<p class="eyebrow">Your kept answer</p>
									<p class="def kept">{gGrade.keptYou}</p>
								</div>
								<div>
									<p class="eyebrow">What you said</p>
									<p class="def yours">{gText}</p>
								</div>
							</div>
							{#if gGrade.principle}
								<p class="eyebrow">The principle</p>
								<p class="def principle">{gGrade.principle}</p>
							{/if}
							<div class="flashtools">
								<button class="chip go" disabled={gRecorded} onclick={guestRecord}>{gRecorded ? 'Recorded' : 'Record it'}</button>
								<button class="chip" onclick={guestReset}>Try again</button>
								<button class="chip" onclick={guestDeal}>Another guest ↦</button>
							</div>
						</div>
					{/if}
				{/if}
			{:else if mode === 'cards' && allItems.length && scope.kind !== 'parts'}
				<p class="count">
					{current.name}{drillMeal ? ' · ' + drillMeal : ''} · {allItems.length} dishes with kept lines · {keptHere} {keptHere === 1 ? 'answer' : 'answers'} kept on this device
				</p>
				<div class="scopes" role="group" aria-label="Which cards">
					<button class="chip" aria-pressed={scope.kind === 'all'} onclick={() => dealItems({ kind: 'all' })}>Whole menu ({allItems.length})</button>
					{#each itemSections as sec (sec.section)}
						<button class="chip" aria-pressed={scope.kind === 'section' && scope.section === sec.section} onclick={() => dealItems({ kind: 'section', section: sec.section })}>{sec.section} ({sec.count})</button>
					{/each}
					{#if weakIds.length}
						<button class="chip" aria-pressed={scope.kind === 'weak'} onclick={() => dealItems({ kind: 'weak' })}>{say('weak', { n: weakIds.length })}</button>
					{:else}
						<button class="chip" disabled>{say('weakNone')}</button>
					{/if}
					<button class="chip" aria-pressed={false} onclick={() => dealItems({ kind: 'parts' })}>Part by part</button>
				</div>
				{#if !deckOf.length}
					<div class="tools">
						<button class="chip go" onclick={() => dealItems(scope)}>Deal the cards</button>
					</div>
				{:else if dDone}
					<div class="flash" role="status" bind:this={deckEl}>
						<p class="eyebrow">{say('done')}</p>
						<p class="term">{say('count', { g: dGot, a: dAgain })}</p>
						<p class="def">{deckOf.length} {deckOf.length === 1 ? 'card' : 'cards'} turned: {scopeLabel}.</p>
						<div class="flashtools">
							{#if dMissed.length}
								<button class="chip go" onclick={() => dealItems(scope, dMissed.slice())}>{say('againDeck', { n: dMissed.length })}</button>
							{/if}
							<button class="chip" onclick={() => dealItems(scope)}>{say('shuffle')}</button>
							<button class="chip" onclick={closeDeck}>{say('close')}</button>
						</div>
					</div>
				{:else}
					{@const e = deckOf[dIdx]}
					<div class="itemdeck" bind:this={deckEl}>
						<p class="eyebrow">
							Card {dIdx + 1} of {deckOf.length} · {e.item ? e.item.section : e.part.kind === 'mixUp' ? 'mix-up' : e.part.kind} · {dFlipped ? 'shown' : 'hidden'}
						</p>
						{#if !dFlipped}
							<button class="face" onclick={flipItem}>
								<span class="facename">{e.item ? e.item.name : e.part.front}</span>
								<span class="facesay">{e.item ? say('front') : 'Say it out loud, then flip.'}</span>
								<span class="faceflip">{say('flip')}</span>
							</button>
						{:else}
							<div class="back" aria-live="polite">
								<p class="backname">{e.item ? e.item.name : e.part.front}</p>
								{#if e.item}
									{#if e.item.back.s10}
										<p class="eyebrow">{say('ten')}</p>
										<p class="backten">{e.item.back.s10}</p>
									{/if}
									{#if e.item.back.price}<p class="backline">{e.item.back.price}</p>{/if}
									{#each e.item.back.pairs as [label, text] (label)}
										<p class="backline"><b>{label}:</b> {text}</p>
									{/each}
									{#if e.item.back.parts.length}
										<details class="backparts" bind:open={partsOpen}>
											<summary>{partsOpen ? say('partsHide') : say('partsShow')}</summary>
											<dl>
												{#each e.item.back.parts as [label, text] (label)}<dt>{label}</dt><dd>{text}</dd>{/each}
											</dl>
										</details>
									{/if}
									{#if e.item.back.say}
										<p class="eyebrow">{say('say')}</p>
										<p class="backline">{e.item.back.say}</p>
									{/if}
								{:else}
									<p class="backten">{e.part.back}</p>
								{/if}
							</div>
							<div class="judge">
								<button class="chip again" onclick={() => judgeItem(false)}>{say('again')}</button>
								<button class="chip go got" onclick={() => judgeItem(true)}>{say('got')}</button>
							</div>
						{/if}
						<p class="runcount" aria-live="polite">{say('count', { g: dGot, a: dAgain })}</p>
						<div class="flashtools">
							<button class="chip" onclick={closeDeck}>{say('close')}</button>
						</div>
					</div>
				{/if}
			{:else if mode === 'cards'}
				<p class="count">
					{current.name} · {cardCount} cards from what is kept · {keptHere} {keptHere === 1 ? 'answer' : 'answers'} kept on this device
				</p>
				{#if allItems.length}
					<div class="tools">
						<button class="chip" onclick={() => dealItems({ kind: 'all' })}>Back to the dish cards</button>
					</div>
				{/if}
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
		border: 1px solid var(--line); background: var(--card); color: var(--ink); padding: 8px 14px;
		border-radius: var(--radius); cursor: pointer; font-size: 14px; min-height: 44px;
	}
	.chip:hover:not(:disabled) { border-color: var(--turmeric); }
	.chip.on { border-color: var(--turmeric); font-weight: 600; }
	/* The go chip keeps app.css's filled art; the scoped .chip above set only the
	   background, which left the global cream text on a cream button. */
	.chip.go { background: var(--accent-solid); border-color: var(--accent-solid); color: var(--on-accent); }
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

	/* The item deck: the whole front one button, the back cut for arm's
	   length, Got it and Again side by side once the card is turned. */
	.scopes { display: flex; gap: 8px; overflow-x: auto; overscroll-behavior-x: contain; padding-bottom: 4px; margin: 10px 0; }
	.scopes .chip { flex: none; white-space: nowrap; font-size: 1rem; }
	.chip[aria-pressed='true'] { background: var(--accent-solid); border-color: var(--accent-solid); color: var(--on-accent); }
	.itemdeck { scroll-margin-top: calc(var(--modebar-h, 0px) + 8px); margin-top: 6px; }
	.face {
		display: flex; flex-direction: column; justify-content: center; align-items: flex-start; gap: 10px;
		width: 100%; min-height: 240px; padding: 20px 22px; text-align: left; cursor: pointer;
		border: 1px solid var(--line); background: var(--card); color: var(--ink);
		border-radius: var(--radius); box-shadow: var(--shadow-card); font: inherit;
	}
	.face:hover { border-color: var(--turmeric); }
	.facename { font-family: var(--display); font-size: 1.75rem; line-height: 1.2; }
	.facesay { font-size: 1rem; color: var(--ink-soft); }
	.faceflip { margin-top: 6px; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
	.back {
		border: 1px solid var(--line); background: var(--card); border-radius: var(--radius);
		box-shadow: var(--shadow-card); padding: 16px 18px;
	}
	.backname { font-family: var(--display); font-size: 1.4rem; margin: 0 0 6px; }
	.backten { font-family: var(--display); font-size: 1.25rem; line-height: 1.4; margin: 0 0 8px; border-left: 2px solid var(--turmeric-deep); padding-left: 12px; }
	.backline { font-size: 1.125rem; line-height: 1.5; margin: 0 0 6px; }
	.backparts summary { min-height: 44px; display: flex; align-items: center; cursor: pointer; font-size: 1rem; }
	.backparts dl { display: grid; grid-template-columns: 8.5em 1fr; gap: 4px 12px; margin: 0 0 8px; }
	.backparts dt { font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; color: var(--muted); padding-top: 3px; }
	.backparts dd { margin: 0; font-size: 1.125rem; line-height: 1.5; }
	.judge { display: flex; gap: 8px; margin-top: 10px; }
	.judge .chip { flex: 1 1 50%; min-height: 56px; font-size: 1.1rem; }
	.runcount { font-size: 1rem; color: var(--ink-soft); margin: 8px 0 0; }

	/* Say it back and Guest at the table. Every state is a word on the page:
	   the verdict, each part's Hit or Missed, the word count against the cap. */
	.kitchen { font-size: var(--t-small); color: var(--ink-soft); max-width: var(--measure); margin: 4px 0 10px; }
	.pickrow, .speakrow { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 10px; }
	.fieldlabel { display: block; font-size: var(--t-small); color: var(--muted); margin: 8px 0 4px; width: 100%; }
	.pick { flex: 1 1 220px; max-width: 100%; }
	.said {
		width: 100%; min-height: 110px; padding: 10px 12px; border: 1px solid var(--line);
		border-radius: var(--radius); background: var(--paper, transparent); color: inherit;
		font: inherit; line-height: 1.5; box-sizing: border-box;
	}
	.wc { font-size: var(--t-small); color: var(--muted); margin: 4px 0 8px; }
	.wc.over { font-weight: 600; }
	.small { font-size: var(--t-small); color: var(--muted); }
	.verdict { margin-bottom: 4px; }
	.parts, .notes { margin: 8px 0; padding-left: 18px; max-width: var(--measure); }
	.parts li, .notes li { margin-bottom: 4px; }
	.parts li[data-hit='missed'] b { text-decoration: underline; }
	.notes { color: var(--ink-soft); font-size: var(--t-small); }
	.beside { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin: 10px 0; }
	.beside .def { white-space: pre-wrap; overflow-wrap: anywhere; }
	.guestsays { font-family: var(--display); font-size: 18px; font-style: italic; margin: 6px 0 10px; padding-left: 12px; border-left: 2px solid var(--line); }
</style>
