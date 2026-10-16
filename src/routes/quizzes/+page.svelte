<!--
  Quizzes (docs/consolidation-design.md 2.6, 2.7 and 3.8): one list in front
  of the app's round builders, the quick quiz first and the level test last.

    the root        Quick quiz first and alone, then My restaurant (the house
                    rounds), the level's subject quizzes, Cuisine (rows that
                    open the sixth tab's rounds, /cuisine?quiz=<scope>&kind=
                    mc|steps|match, and so light the Cuisine tab), Hands on,
                    and last the level's test, each row naming what it asks
    ?quick=1        the quick quiz: ten in one round, the house and the
                    level in turn with two Cuisine questions among them,
                    then the results screen

  THE QUICK QUIZ builds from the engines already here and adds no new kind of
  question: the house's from dealRound over the kinds that deal (recorded as
  the house drill records, explained by explainAnswer); the level's from the
  Floor Deck cards at the level (owed first, then never asked, as mcFor asks
  them, with NO traps: only the written test and the level test may load
  them) and the level's Lexicon terms (optionsForTerm), graded by
  gradeLevelAnswer, so the level's figure moves the way each subsection's
  own rounds move it; and two of Cuisine's multiple choice questions (since
  12 Oct 2026: at the level first, then below it, then above, each band in
  askOrder's order), graded as the Cuisine tab grades them, `close` or
  `missed` under cuisine:<id> once per question per local day. With a house
  the round asks four, four and two; without one, eight and two; a side that
  cannot give its share is topped up by the others (lib/quick-quiz.ts).

  ONE ENTRY, THE ROUND. Starting pushes question one; every answer and every
  next question replaces it; the results replace the last question, so Back
  from the results is this root. The whole round rides in the entry's page
  state, results included, so a pop back to it (from Study this card, say)
  draws the same misses. A cold load or a reload with no round in its state
  falls back to this root with a replace.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount, tick } from 'svelte';
	import { loadFloorDeck, loadLexicon } from '$lib/data';
	import { session } from '$lib/stores/session.svelte';
	import { house } from '$lib/stores/house.svelte';
	import { levels } from '$lib/stores/levels.svelte';
	import { today } from '$lib/stores/today.svelte';
	import { nav, restoreScroll } from '$lib/stores/nav.svelte';
	import { markStudied } from '$lib/oot-studied';
	import { drilledKey, markDrilled } from '$lib/house-drilled';
	import { dealRound, explainAnswer, shuffleWith, tableDrillHouse } from '$lib/house-drill-round';
	import { DRILL_LABELS, readyKinds } from '$lib/house/house-drills';
	import { itemCards } from '$lib/study';
	import { deckLog, mcFor, owedIds } from '$lib/floor-deck';
	import { nextTarget, optionsForTerm } from '$lib/lexicon-quiz';
	import { gradeLevelAnswer, LEVEL_KEYS } from '$lib/levels';
	import { dueList, repertoire, scopeToSlugs, TERM_LADDER_DAYS } from '$lib/repertoire';
	import { cuisine } from '$lib/stores/cuisine.svelte';
	import { askOrder, czSlug, mcOptions, questionsInScope, recordable, roundGrade, type CzLevel } from '$lib/cuisine';
	import { QUICK_ROUND, quickLine as quickLineFor, quickOrder, quickSources, quickSplit, quickTargets } from '$lib/quick-quiz';
	import ScopeChip from '$lib/components/ScopeChip.svelte';
	import type { DeckLevel, FloorDeck, LexiconEntry } from '$lib/types';
	import type { Snapshot } from './$types';

	let { data } = $props();

	type Qq = NonNullable<App.PageState['qq']>;
	type Q = Qq['qs'][number];

	let deck = $state<FloorDeck | null>(null);
	let lexicon = $state<LexiconEntry[] | null>(null);
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
		today.load();
		void levels.load();
		void cuisine.load();
	});

	function needFiles(): Promise<void> {
		return Promise.all([
			deck ? deck : loadFloorDeck().then((d) => (deck = d)),
			lexicon ? lexicon : loadLexicon().then((l) => (lexicon = l))
		]).then(() => undefined);
	}

	const chosen = $derived<DeckLevel>(mounted ? levels.chosen : 1);
	const nameOf = (n: DeckLevel) => data.levelInfo.find((l) => l.level === n)?.name ?? '';
	const levelName = $derived(nameOf(chosen));
	const current = $derived(house.current);
	const hasHouse = $derived(!!current && readyKinds(current).length > 0);

	const qq = $derived<Qq | null>(((page.state ?? {}) as App.PageState).qq ?? null);
	const screen = $derived(!qq ? 'root' : qq.done ? 'results' : 'question');
	let all = $state(false);
	let pending = $state<{ cold: boolean } | null>(null);

	afterNavigate((n) => {
		const p = new URLSearchParams(location.search);
		all = p.get('all') === '1';
		pending = null;
		if (qq || p.get('quick') !== '1') return;
		/* A cold load or a reload of the round has nothing to draw: it falls to
		   Quizzes at once, without waiting for the files, so a quick Back press
		   cannot land on the screen it was about to fall to. A tick first, so
		   the layout's afterNavigate (which runs after this one) has read the
		   depth. */
		if (n.type === 'enter') {
			void tick().then(() => nav.fallTo(`${base}/quizzes`, {}));
			return;
		}
		pending = { cold: false };
	});

	/* ---- the quick quiz --------------------------------------------------- */
	const ROUND = QUICK_ROUND;

	function houseQuestions(n: number): Q[] {
		/* The producers behind a dish only (tableDrillHouse): the bar's and the cellar's are their rooms' to ask about. */
		const h = current ? tableDrillHouse(current) : null;
		if (!h || n <= 0) return [];
		const kinds = readyKinds(h);
		if (!kinds.length) return [];
		/* The Table's menu is its dishes: a house question about a wine or a
		   drink is the Codex's or the Ledger's to ask, and its card is there. */
		return dealRound(h, kinds, null, Math.random)
			.filter((q) => q.itemId.startsWith('d-'))
			.slice(0, n)
			.map((q) => ({
			kind: 'house' as const,
			ref: q.itemId,
			label: DRILL_LABELS[q.kind],
			stem: q.stem,
			options: q.options,
			answer: q.answer,
			why: explainAnswer(h, q),
			drill: q.kind
		}));
	}

	function levelQuestions(n: number, level: DeckLevel): Q[] {
		if (n <= 0) return [];
		const now = Date.now();
		const out: Q[] = [];
		const deckQs: Q[] = [];
		if (deck) {
			const owed = owedIds(deck, session.drillLog, now, new Set([level]));
			const seen = new Set(deckLog(session.drillLog, deck.cards).map((e) => e.slug));
			const atLevel = deck.cards.filter((c) => c.level === level);
			const byId = new Map(deck.cards.map((c) => [c.id, c]));
			const order = [
				...owed.map((id) => byId.get(id)).filter((c) => !!c),
				...atLevel.filter((c) => !seen.has(c.id)),
				...shuffleWith(atLevel.filter((c) => seen.has(c.id)), Math.random)
			];
			const used = new Set<string>();
			for (const c of order) {
				if (deckQs.length >= n || !c || used.has(c.id)) continue;
				used.add(c.id);
				const q = mcFor(c, deck.cards, undefined, Math.random);
				if (!q) continue;
				const title = deck.sections.find((s) => s.key === c.section)?.title ?? '';
				deckQs.push({
					kind: 'deck',
					ref: c.id,
					label: `The Floor Deck${title ? ' · ' + title : ''}`,
					stem: `Which of these is ${c.term}?`,
					options: q.options.map((o) => o.text),
					answer: c.gist,
					drill: c.section
				});
			}
		}
		const lexQs: Q[] = [];
		if (lexicon && levels.data) {
			const terms = new Set(levels.data.items.lexicon[String(level)] ?? []);
			const pool = lexicon.filter((e) => terms.has(e.slug));
			const due = dueList(repertoire(scopeToSlugs(session.drillLog, terms), now, TERM_LADDER_DAYS), now).map((e) => e.slug);
			const asked = new Set<string>();
			for (let i = 0; i < Math.min(n, pool.length); i++) {
				const t = nextTarget(pool, due, asked, Math.random);
				if (!t || asked.has(t.slug)) break;
				asked.add(t.slug);
				const q = optionsForTerm(t, lexicon, Math.random);
				const def = t.definition ?? '';
				lexQs.push({
					kind: 'lexicon',
					ref: t.slug,
					label: `The Lexicon · ${t.category}`,
					stem: `Which term is this? “${def.slice(0, 180)}${def.length > 180 ? '…' : ''}”`,
					options: q.options.map((o) => o.term),
					answer: t.term
				});
			}
		}
		// The deck and the Lexicon in turn, each topping up the other.
		while (out.length < n && (deckQs.length || lexQs.length)) {
			const a = out.length % 2 === 0 ? deckQs : lexQs;
			const b = a === deckQs ? lexQs : deckQs;
			out.push((a.length ? a : b).shift()!);
		}
		return out;
	}

	/**
	 * Cuisine's questions in the order the quick quiz asks them: those at the
	 * level first, then the levels below it (nearest first), then those above
	 * (a level guides, it never bars), each band missed last time first, then
	 * never asked, then the oldest asked (askOrder). From the index alone.
	 */
	function cuisineOrder(level: DeckLevel): string[] {
		const index = cuisine.index;
		if (!index) return [];
		const rank = (l: number) => (l === level ? 0 : l < level ? level - l : 4 + l - level);
		const bands = new Map<number, string[]>();
		for (const [id, , l] of questionsInScope(index, { kind: 'all' })) {
			const r = rank(l);
			bands.set(r, [...(bands.get(r) ?? []), id]);
		}
		return [...bands.keys()].sort((a, b) => a - b).flatMap((r) => askOrder(bands.get(r) ?? [], session.drillLog, Math.random));
	}

	/** Enough of Cuisine's questions to top a round up, with their chapters loaded. An unread index is none. */
	async function needCuisine(level: DeckLevel): Promise<string[]> {
		const index = await cuisine.load();
		if (!index) return [];
		const ids = cuisineOrder(level).slice(0, ROUND);
		const entryOf = new Map(index.questions.map(([q, e]) => [q, e]));
		await cuisine.ensure(ids.map((id) => cuisine.head(entryOf.get(id) ?? '')?.chapter ?? '').filter(Boolean));
		return ids;
	}

	function cuisineQuestions(ids: readonly string[]): Q[] {
		const out: Q[] = [];
		for (const id of ids) {
			const f = cuisine.questionById(id);
			if (!f) continue;
			out.push({
				kind: 'cuisine',
				ref: id,
				label: `Cuisine · ${f.entry.title}`,
				stem: f.question.q,
				options: mcOptions(f.question, Math.random),
				answer: f.question.answer,
				why: f.question.why,
				entry: f.entry.id,
				card: f.question.teaches
			});
		}
		return out;
	}

	/** The round: each side's share (lib/quick-quiz.ts), the house and the level in turn, Cuisine spread among them. */
	function buildQuick(level: DeckLevel, czIds: readonly string[]): Q[] {
		const h = houseQuestions(hasHouse ? ROUND : 0);
		const l = levelQuestions(ROUND, level);
		const z = cuisineQuestions(czIds);
		const n = quickSplit(quickTargets(hasHouse), { house: h.length, level: l.length, cuisine: z.length });
		return quickOrder(h.slice(0, n.house), l.slice(0, n.level), z.slice(0, n.cuisine));
	}

	/** Every file a round draws on, then Cuisine's questions for the level. */
	async function prepare(level: DeckLevel): Promise<string[]> {
		await needFiles();
		return needCuisine(level);
	}

	function freshRound(qs: Q[]): Qq {
		return { qs, i: 0, picked: null, right: 0, chosen: qs.map(() => null), done: qs.length === 0 };
	}

	let starting = $state(false);
	async function startQuick() {
		starting = true;
		const czIds = await prepare(chosen);
		starting = false;
		const qs = buildQuick(chosen, czIds);
		nav.pushShallow(`${base}/quizzes?quick=1`, { qq: freshRound(qs) });
		await focusTop();
	}

	$effect(() => {
		const want = pending;
		if (!want || !today.houseSettled || !session.ready || !levels.data) return;
		pending = null;
		void prepare(chosen).then((czIds) => {
			nav.replaceShallow(location.href, { qq: freshRound(buildQuick(chosen, czIds)) });
			void focusTop();
		});
	});

	let top: HTMLElement | undefined = $state();
	async function focusTop() {
		await tick();
		window.scrollTo(0, 0);
		top?.focus({ preventScroll: true });
	}

	function setQq(next: Qq) {
		nav.replaceShallow(location.href, { ...((page.state ?? {}) as App.PageState), qq: next });
	}

	function pick(o: string) {
		if (!qq || qq.picked !== null) return;
		const q = qq.qs[qq.i];
		if (!q) return;
		const ok = o === q.answer;
		if (q.kind === 'house' && current && q.drill) {
			markDrilled(drilledKey(current.id, q.ref, q.drill), ok ? 'met' : 'missed');
			today.refresh();
		} else if (q.kind === 'deck') {
			session.markDrilled(q.ref, gradeLevelAnswer('deck', ok));
		} else if (q.kind === 'lexicon') {
			session.markDrilled(q.ref, gradeLevelAnswer('lexicon', ok));
		} else if (q.kind === 'cuisine') {
			// The Cuisine tab's round grade, once per question per local day.
			if (recordable(session.drillLog, q.ref, Date.now())) session.markDrilled(czSlug(q.ref), roundGrade(ok));
		}
		const chosenList = [...qq.chosen];
		chosenList[qq.i] = o;
		setQq({ ...qq, picked: o, right: qq.right + (ok ? 1 : 0), chosen: chosenList });
	}

	function next() {
		if (!qq || qq.picked === null) return;
		if (qq.i + 1 >= qq.qs.length) {
			markStudied();
			setQq({ ...qq, done: true });
			void focusTop();
			return;
		}
		setQq({ ...qq, i: qq.i + 1, picked: null });
	}

	async function dealAnother() {
		const czIds = await prepare(chosen);
		nav.pushShallow(`${base}/quizzes?quick=1`, { qq: freshRound(buildQuick(chosen, czIds)) });
		await focusTop();
	}

	/* ---- the results ------------------------------------------------------ */
	const misses = $derived(qq && qq.done ? qq.qs.map((q, i) => ({ q, said: qq.chosen[i] })).filter((m) => m.said !== m.q.answer) : []);

	function studyHref(q: Q): { href: string; word: string } | null {
		if (q.kind === 'house') return { href: `${base}/menu#${q.ref}`, word: 'Study this card' };
		if (q.kind === 'deck') return { href: `${base}/flashcards?deck=${encodeURIComponent('deck:' + (q.drill ?? ''))}&card=${q.ref}&run=1`, word: 'Study this card' };
		if (q.kind === 'lexicon') return { href: `${base}/lexicon#${q.ref}`, word: 'Read about it' };
		if (q.kind === 'cuisine') {
			const h = q.entry ? cuisine.head(q.entry) : null;
			return h ? { href: `${base}/cuisine?ch=${encodeURIComponent(h.chapter)}&e=${encodeURIComponent(h.slug)}`, word: 'Read about it' } : null;
		}
		return null;
	}

	/** The dishes with a card on the one card screen (study.ts itemCards). */
	const carded = $derived(new Set(current ? itemCards(current, 'dish', { all: true }).map((c) => c.itemId) : []));
	const missesHref = $derived.by(() => {
		const h = misses.filter((m) => m.q.kind === 'house' && carded.has(m.q.ref)).map((m) => m.q.ref);
		const c = misses.filter((m) => m.q.kind === 'deck').map((m) => m.q.ref);
		const t = misses.filter((m) => m.q.kind === 'lexicon').map((m) => m.q.ref);
		/* A Cuisine question goes back as the card it teaches, dealt on the one card screen. */
		const z = misses.filter((m) => m.q.kind === 'cuisine' && !!m.q.card).map((m) => m.q.card as string);
		if (!h.length && !c.length && !t.length && !z.length) return '';
		const uniq = (xs: string[]) => [...new Set(xs)].join(',');
		const parts = [h.length ? `h=${uniq(h)}` : '', c.length ? `c=${uniq(c)}` : '', t.length ? `t=${uniq(t)}` : '', z.length ? `z=${uniq(z)}` : ''].filter(Boolean);
		return `${base}/flashcards?deck=misses&run=1&${parts.join('&')}`;
	});

	/* ---- the rows --------------------------------------------------------- */
	function setAll(v: boolean) {
		all = v;
		nav.replaceShallow(`${base}/quizzes${v ? '?all=1' : ''}`, { ...((page.state ?? {}) as App.PageState) });
	}

	const czIndex = $derived(cuisine.index);
	const quickLine = $derived(quickLineFor(hasHouse, (czIndex?.questions.length ?? 0) > 0, levelName));

	/* Cuisine's rounds, each a door into the Cuisine tab (its address lights it): the quiz at the
	   level (every level under Show all, or when the level holds none yet), Order the steps and
	   Family matching over every chapter, as the Cuisine root deals them. */
	const cuisineRows = $derived.by(() => {
		if (!czIndex) return [];
		const enc = encodeURIComponent;
		const rows: Array<{ name: string; line: string; href: string }> = [];
		const atLevel = questionsInScope(czIndex, { kind: 'level', level: chosen as CzLevel }).length;
		const every = czIndex.questions.length;
		const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
		if (every) {
			const scope = all || !atLevel ? 'all' : `lv:${chosen}`;
			const lead = all ? 'Every level' : atLevel ? levelName : `None at ${levelName} yet, so every level`;
			rows.push({ name: 'The Cuisine quiz', line: `${lead}: ${plural(all || !atLevel ? every : atLevel, 'question', 'questions')}, up to ten a round, four options each.`, href: `${base}/cuisine?quiz=${enc(scope)}&kind=mc` });
		}
		if (czIndex.steps.length) rows.push({ name: 'Order the steps', line: `Put a method's stages in order: ${plural(czIndex.steps.length, 'method', 'methods')}.`, href: `${base}/cuisine?quiz=all&kind=steps` });
		if (czIndex.matches.length) rows.push({ name: 'Family matching', line: `Pair each item with its family: ${plural(czIndex.matches.length, 'set', 'sets')}.`, href: `${base}/cuisine?quiz=all&kind=match` });
		return rows;
	});
	const levelRows = (n: DeckLevel | null) => {
		const q = n ? `?level=${n}` : '';
		return [
			{ name: 'The written test', line: 'Which of these is the word? The Floor Deck, with its traps; it ends on what you missed.', href: `${base}/service/deck/test${q}` },
			{ name: 'Say it back: the Floor Deck', line: 'A guest describes it; you say the word before the choices appear.', href: `${base}/service/deck/say${q}` },
			{ name: 'The Lexicon quiz', line: 'Which term is this? Ten definitions, four terms each.', href: `${base}/lexicon${n ? `?level=${n}&start=quiz` : '?start=quiz'}` },
			{ name: 'The service drill', line: 'The service track’s terms, ten questions a round.', href: `${base}/service/drill${q}` }
		];
	};

	export const snapshot: Snapshot<{ y: number }> = {
		capture: () => ({ y: typeof window === 'undefined' ? 0 : window.scrollY }),
		restore: (v) => {
			if (!qq) restoreScroll(v.y ?? 0, () => today.houseSettled && !!levels.data);
		}
	};
</script>

<svelte:head><title>{screen === 'root' ? 'Quizzes' : screen === 'results' ? 'What you missed' : 'Quick quiz'} · The World Table</title></svelte:head>

<div class="shell hub quizzes" data-screen={screen}>
	{#if screen === 'root'}
		<h1 tabindex="-1" bind:this={top}>Quizzes</h1>
		<ScopeChip names={nameOf} {chosen} {all} onAll={setAll} onChoose={(n) => levels.choose(n)} />

		<section aria-labelledby="qq-h">
			<h2 class="group" id="qq-h">Quick quiz</h2>
			<p class="note quickline">{quickLine}</p>
			<button type="button" class="chip go start" onclick={startQuick} disabled={starting}>{starting ? 'Dealing the round…' : 'Start the quick quiz'}</button>
		</section>

		<h2 class="group" id="qz-house">My restaurant</h2>
		{#if !today.houseSettled}
			<p class="note">Opening the house…</p>
		{:else if !current}
			<p class="note">No restaurant on this device yet. Set one up from a level page.</p>
		{:else}
			<nav class="quiet" aria-labelledby="qz-house">
				<a class="door" href="{base}/menu/quiz"><span class="door-name">The dishes</span><span class="door-line">Name the dish from its description, its ingredients or its price.</span></a>
				<a class="door" href="{base}/menu/quiz?mode=drill"><span class="door-name">Drill the menu</span><span class="door-line">Mixed questions from every section, ten at a time.</span></a>
				<a class="door" href="{base}/menu/quiz?mode=pair"><span class="door-name">Pairings</span><span class="door-line">Which wine, or which drink without alcohol, goes with each dish.</span></a>
				<a class="door" href="{base}/menu/quiz?mode=say"><span class="door-name">Say it back</span><span class="door-line">The ten, twenty and forty five second lines, out loud.</span></a>
				<a class="door" href="{base}/menu/quiz?mode=guest"><span class="door-name">Guest at the table</span><span class="door-line">A guest asks; you answer.</span></a>
			</nav>
		{/if}

		{#if all}
			{#each LEVEL_KEYS as n (n)}
				<h2 class="group" id="qz-level-{n}">{nameOf(n)}</h2>
				<nav class="quiet" aria-labelledby="qz-level-{n}">
					{#each levelRows(n) as r (r.href)}
						<a class="door" href={r.href}><span class="door-name">{r.name}</span><span class="door-line">{r.line}</span></a>
					{/each}
				</nav>
			{/each}
		{:else}
			<h2 class="group" id="qz-level">{levelName}</h2>
			<nav class="quiet" aria-labelledby="qz-level">
				{#each levelRows(chosen) as r (r.href)}
					<a class="door" href={r.href}><span class="door-name">{r.name}</span><span class="door-line">{r.line}</span></a>
				{/each}
			</nav>
		{/if}

		<h2 class="group" id="qz-cuisine">Cuisine</h2>
		{#if !czIndex && !cuisine.failed}
			<p class="note">Opening Cuisine…</p>
		{:else if !czIndex}
			<p class="note">Cuisine could not be opened on this device. Open it once with a connection and it stays for offline use.</p>
		{:else if !cuisineRows.length}
			<p class="note">No Cuisine questions are written yet.</p>
		{:else}
			<nav class="quiet" aria-labelledby="qz-cuisine">
				{#each cuisineRows as r (r.href)}
					<a class="door" href={r.href}><span class="door-name">{r.name}</span><span class="door-line">{r.line}</span></a>
				{/each}
			</nav>
		{/if}

		<h2 class="group" id="qz-hands">Hands on</h2>
		<nav class="quiet" aria-labelledby="qz-hands">
			<a class="door" href="{base}/practise/firing"><span class="door-name">The firing drill</span><span class="door-line">Which dish fires first? Your pinned menu, planned back from service.</span></a>
			<a class="door" href="{base}/practise/calibrate"><span class="door-name">Calibrate your palate</span><span class="door-line">Taste, then say which fault and how far; the ladder climbs as you do.</span></a>
			<a class="door" href="{base}/service/deck/lineup"><span class="door-name">The lineup</span><span class="door-line">The Floor Deck read aloud to the whole room before service.</span></a>
		</nav>

		<h2 class="group" id="qz-test">{all ? 'The level tests' : `The ${levelName} test`}</h2>
		<nav class="quiet" aria-labelledby="qz-test">
			{#each all ? LEVEL_KEYS : [chosen] as n (n)}
				<a class="door leveltest" href="{base}/level/{n}/test">
					<span class="door-name">The {nameOf(n)} test</span>
					<span class="door-line">The Floor Deck, service and the Lexicon at {nameOf(n)}, untimed; it ends on what you missed, with the right answers and no score.</span>
				</a>
			{/each}
		</nav>
	{:else if screen === 'question' && qq}
		{@const q = qq.qs[qq.i]}
		<h1 tabindex="-1" bind:this={top} class="qhead">Quick quiz</h1>
		<p class="note where">Question {qq.i + 1} of {qq.qs.length} · {q.label}</p>
		<div class="flash">
			<p class="stem">{q.stem}</p>
			<div class="opts">
				{#each q.options as o (o)}
					<button
						type="button"
						class="opt"
						class:right={qq.picked !== null && o === q.answer}
						class:wrong={qq.picked === o && o !== q.answer}
						disabled={qq.picked !== null && o !== qq.picked && o !== q.answer}
						onclick={() => pick(o)}
						>{o}{#if qq.picked !== null && o === q.answer}<span class="mark">, the answer</span>{:else if qq.picked === o}<span class="mark">, your answer</span>{/if}</button
					>
				{/each}
			</div>
			{#if qq.picked !== null}
				<p class="answer" role="status">
					<b>{qq.picked === q.answer ? 'Right.' : 'Not that one.'}</b>
					Answer: {q.answer}.{#if q.why}&nbsp;<span class="why">{q.why}</span>{/if}
				</p>
				<button type="button" class="chip go" onclick={next}>{qq.i + 1 >= qq.qs.length ? 'See what you missed' : 'Next question'}</button>
			{/if}
		</div>
		<p class="note score" aria-live="polite">{qq.right} right of {qq.i + (qq.picked !== null ? 1 : 0)} answered</p>
	{:else if screen === 'results' && qq}
		<h1 tabindex="-1" bind:this={top}>What you missed</h1>
		<p class="note">The quick quiz: {qq.qs.length === 10 ? 'ten' : qq.qs.length} questions from {quickSources(qq.qs.map((q) => q.kind), levelName)}. {qq.right} right of {qq.qs.length}.</p>
		{#if !qq.qs.length}
			<p class="note">Nothing could be dealt yet: the level's files did not load, and no house is on this device.</p>
		{:else if !misses.length}
			<p class="note nothing">Nothing missed.</p>
		{:else}
			<ol class="misses">
				{#each misses as m, i (i)}
					{@const go = studyHref(m.q)}
					<li class="miss">
						<p class="mlabel">{m.q.label}</p>
						<p class="mstem">{m.q.stem}</p>
						<p class="manswer">Answer: {m.q.answer}</p>
						{#if m.q.why}<p class="mwhy">{m.q.why}</p>{/if}
						{#if go}<a class="chip" href={go.href}>{go.word}</a>{/if}
					</li>
				{/each}
			</ol>
		{/if}
		<div class="chips">
			{#if missesHref}<a class="chip go" href={missesHref}>Study the misses</a>{/if}
			<button type="button" class="chip" onclick={dealAnother}>Deal another</button>
		</div>
	{/if}
</div>

<style>
	.start {
		margin-top: 10px;
		min-height: 52px;
		padding-inline: 22px;
		font-size: 1.1rem;
	}
	.quickline {
		font-size: var(--t-body);
	}
	.qhead:focus,
	h1:focus {
		outline: none;
	}
	.where {
		margin-top: 0;
	}
	.flash {
		border: 1px solid var(--line);
		background: var(--card);
		border-radius: var(--radius);
		padding: 18px 20px;
		margin-top: 10px;
		max-width: 760px;
	}
	.stem {
		font-family: var(--display);
		font-size: 1.25rem;
		line-height: 1.45;
		margin: 0 0 6px;
	}
	.opts {
		display: grid;
		gap: 8px;
		margin: 14px 0;
	}
	.opt {
		text-align: left;
		border: 1px solid var(--line);
		background: var(--paper, transparent);
		color: var(--ink);
		border-radius: var(--radius);
		padding: 10px 14px;
		cursor: pointer;
		font-family: var(--display);
		font-size: 1.0625rem;
		line-height: 1.4;
		min-height: 48px;
	}
	.opt:hover:not(:disabled) {
		border-color: var(--turmeric);
	}
	.opt.right {
		border-color: var(--leaf);
		border-width: 2px;
	}
	.opt.wrong {
		border-color: var(--chili);
		border-width: 2px;
	}
	.opt:disabled {
		opacity: 0.6;
		cursor: default;
	}
	.mark {
		font-family: var(--text);
		font-size: 1rem;
		color: var(--ink-soft);
	}
	.answer {
		font-size: var(--t-body);
		max-width: var(--measure);
		margin: 6px 0 12px;
	}
	.why {
		color: var(--ink-soft);
	}
	.score {
		margin-top: 10px;
	}
	.misses {
		list-style: none;
		margin: 10px 0 0;
		padding: 0;
	}
	.miss {
		padding: 12px 0;
		border-top: 1px solid var(--line);
	}
	.mlabel {
		font-size: 1rem;
		color: var(--ink-soft);
		margin: 0 0 2px;
	}
	.mstem {
		font-family: var(--display);
		font-size: 1.125rem;
		margin: 0 0 4px;
	}
	.manswer {
		font-size: var(--t-body);
		font-weight: 600;
		margin: 0 0 4px;
	}
	.mwhy {
		font-size: 1rem;
		color: var(--ink-soft);
		margin: 0 0 8px;
		max-width: var(--measure);
	}
</style>
