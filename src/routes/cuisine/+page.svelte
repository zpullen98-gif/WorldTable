<!--
  Cuisine, the World Table's cooking page, under Brennan's since 17 Oct 2026
  (its own tab from 12 Oct, the owner's): French and
  Creole cooking, in depth and drillable, for the kitchen and the floor at
  Brennan's. One prerendered page; every screen is an address on it.

    /cuisine                      the root: the level, In Cuisine today, Next
                                  unread at {Level}, the chapter doors (a
                                  chapter with nothing written yet is a coming
                                  row, never a link), the drills, the family
                                  tree and the roux ladder
    ?ch=<key>                     a chapter: its entries and its drills
    ?ch=<key>&e=<slug>            an entry, read whole (CzEntry)
    ?deck=<id>                    a deck screen: all, lv:<n>, ch:<key>,
                                  e:<entryId>; its count and Start
    ?deck=<id>&run=1              the card screen (DeckFrame), then the summary
    ?deck=misses&z=<ids>&run=1    the cards a run or a round missed
    ?due=1                        In Cuisine today, as a run
    ?quiz=<scope>&kind=mc|steps|match   a round, then what you missed
    ?view=tree, ?view=ladder      the family tree, the roux ladder
    ?all=1                        the root, every level

  The chapters, the entries, the deck screens and the views are drawn from
  the address and carry no state: each is an ordinary link, so Back walks
  them through the history and a cold deep link walks up by lib/nav.ts
  parentOf (entry, chapter, Cuisine, Home). A run and a round ride in their
  entry's page state (PageState.cz), pushed with nav.pushShallow and changed
  with nav.replaceShallow, so a pop back to one draws it as it was. A run or
  a round asked for by a link is dealt once the files are in; a cold load or
  a reload of one has nothing to draw and falls to its parent (In Cuisine
  today and the misses deal again from their address). The query is read in
  afterNavigate, after a pop and after every shallow move, never at load.

  WHAT A GRADE WRITES (lib/cuisine.ts): session.markDrilled('cuisine:<id>'),
  a card `met` (Got it) or `missed` (Again, sent round once more), a round's
  item `close` or `missed`, each once per item per local day. Nothing else.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount, tick } from 'svelte';
	import { session } from '$lib/stores/session.svelte';
	import { house } from '$lib/stores/house.svelte';
	import { levels } from '$lib/stores/levels.svelte';
	import { nav, restoreScroll } from '$lib/stores/nav.svelte';
	import { cuisine } from '$lib/stores/cuisine.svelte';
	import { markStudied } from '$lib/oot-studied';
	import { BRENNANS_HOUSE_ID, TEACHING_FOLIOS } from '$lib/teaching-folios';
	import { deviceStorage, readRead, setRead } from '$lib/cuisine-read';
	import {
		CZ_RUN_CAP,
		ROUND_LENGTH,
		askOrder,
		cardGrade,
		cardsForMisses,
		cardsInScope,
		chapterCounts,
		chapterLine,
		cuisineToday,
		czSlug,
		dealCards,
		gradeMatch,
		gradeSteps,
		learntCount,
		matchOrder,
		matchesInScope,
		mcOptions,
		nextEntry,
		nextUnread,
		pairUp,
		parseScope,
		placeStep,
		questionsInScope,
		recordable,
		removeStep,
		requeue,
		roundGrade,
		scopeName,
		stepsInScope,
		stepsPool,
		todayLine,
		unpair,
		type CzKind,
		type CzLevel,
		type MatchResult,
		type StepsResult
	} from '$lib/cuisine';
	import DeckFrame from '$lib/components/DeckFrame.svelte';
	import ScopeChip from '$lib/components/ScopeChip.svelte';
	import CzEntry from '$lib/components/cuisine/CzEntry.svelte';
	import CzCardFace from '$lib/components/cuisine/CzCardFace.svelte';
	import CzMcRound from '$lib/components/cuisine/CzMcRound.svelte';
	import CzSteps from '$lib/components/cuisine/CzSteps.svelte';
	import CzMatch from '$lib/components/cuisine/CzMatch.svelte';
	import CzTree from '$lib/components/cuisine/CzTree.svelte';
	import CzLadder from '$lib/components/cuisine/CzLadder.svelte';
	import type { DeckLevel } from '$lib/types';
	import type { Snapshot } from './$types';

	let { data } = $props();

	type Cz = NonNullable<App.PageState['cz']>;
	type Item = NonNullable<Cz['items']>[number];

	/* The files and the record */
	let mounted = $state(false);
	let read = $state<Set<string>>(new Set());

	onMount(() => {
		mounted = true;
		void levels.load();
		void cuisine.load();
		read = readRead(deviceStorage());
		/* A pop between shallow entries runs no afterNavigate: the address is
		   read again at once (the router's own listener has already moved
		   page.state) and once more a tick later, after any navigation. */
		const onPop = () => {
			readAddr();
			setTimeout(readAddr, 0);
		};
		window.addEventListener('popstate', onPop);
		return () => window.removeEventListener('popstate', onPop);
	});

	const chosen = $derived<DeckLevel>(mounted ? levels.chosen : 1);
	const nameOf = (n: number) => data.levelInfo.find((l) => l.level === n)?.name ?? '';
	const levelName = $derived(nameOf(chosen));
	const index = $derived(cuisine.index);
	const log = $derived(session.drillLog);
	const current = $derived(house.current);

	/* The address */
	interface Addr {
		ch: string;
		e: string;
		deck: string;
		run: boolean;
		quiz: string;
		kind: CzKind;
		view: string;
		due: boolean;
		all: boolean;
		z: string[];
	}

	function parseAddr(search: string): Addr {
		const q = new URLSearchParams(search);
		const kind = q.get('kind');
		const get = (k: string) => (q.get(k) ?? '').trim();
		return {
			ch: get('ch'),
			e: get('e'),
			deck: get('deck'),
			run: q.get('run') === '1',
			quiz: get('quiz'),
			kind: kind === 'steps' || kind === 'match' ? kind : 'mc',
			view: get('view'),
			due: q.get('due') === '1',
			all: q.get('all') === '1',
			z: get('z')
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
		};
	}

	let addr = $state<Addr>(parseAddr(''));
	function readAddr() {
		addr = parseAddr(location.search);
	}

	const cz = $derived<Cz | null>(((page.state ?? {}) as App.PageState).cz ?? null);
	const screen = $derived.by(() => {
		if (cz?.s === 'run') return cz.done ? 'summary' : 'card';
		if (cz?.s === 'round') return cz.done ? 'results' : 'item';
		if (addr.due || (addr.deck && addr.run) || addr.quiz) return 'dealing';
		if (addr.deck) return 'deck';
		if (addr.view === 'tree') return 'tree';
		if (addr.view === 'ladder') return 'ladder';
		if (addr.ch && addr.e) return 'entry';
		if (addr.ch) return 'chapter';
		return 'root';
	});

	/** A run or a round asked for by a link, dealt once the files and the record are in. */
	let pending = $state<'run' | 'round' | null>(null);

	afterNavigate((n) => {
		readAddr();
		pending = null;
		if (cz) return; // a pop: the entry's own state draws it
		const a = addr;
		if (a.due || (a.deck === 'misses' && a.run)) {
			pending = 'run';
			return;
		}
		if ((a.deck && a.run) || a.quiz) {
			/* A cold load or a reload of a run or a round has nothing to draw:
			   its parent, at once, a tick after the layout has read the depth. */
			if (n.type === 'enter') {
				const to = a.quiz ? `${base}/cuisine` : `${base}/cuisine?deck=${encodeURIComponent(a.deck)}`;
				void tick().then(() => {
					nav.fallTo(to, {});
					readAddr();
				});
				return;
			}
			pending = a.quiz ? 'round' : 'run';
		}
	});

	$effect(() => {
		const want = pending;
		if (!want || !index || !session.ready || !mounted) return;
		if (want === 'run' && addr.due && !levels.ready) return;
		pending = null;
		void dealFromAddress(want);
	});

	async function dealFromAddress(want: 'run' | 'round') {
		const at = location.href;
		if (want === 'run') {
			const deck = addr.due ? 'today' : addr.deck;
			const refs = runRefs(deck, addr.z);
			await cuisine.ensure(cuisine.chaptersOfCards(refs));
			if (location.href !== at) return;
			nav.replaceShallow(location.href, { cz: runState(deck, refs) });
			void focusFrame();
			return;
		}
		const items = await roundItems(addr.quiz, addr.kind);
		if (location.href !== at) return;
		nav.replaceShallow(location.href, { cz: roundState(addr.quiz, addr.kind, items) });
		void focusTop();
	}

	/* Links */
	const enc = encodeURIComponent;
	const cuisineHref = (q = '') => `${base}/cuisine${q ? '?' + q : ''}`;
	const entryHref = (chapter: string, slug: string) => cuisineHref(`ch=${enc(chapter)}&e=${enc(slug)}`);

	function entryLink(slug: string): { href: string | null; title: string } {
		const h = cuisine.headBySlug(slug);
		return h ? { href: entryHref(h.chapter, h.slug), title: h.title } : { href: null, title: slug.replace(/-/g, ' ') };
	}

	function readLink(entryId: string | null | undefined): { href: string; word: string } | null {
		const h = entryId ? cuisine.head(entryId) : null;
		return h ? { href: entryHref(h.chapter, h.slug), word: 'Read about it' } : null;
	}

	/* The current house is Brennan's and holds the dish: its study card. Else the dish in words. */
	const isBrennans = $derived(!!current && current.id === BRENNANS_HOUSE_ID);
	function dishLink(id: string): { href: string | null; name: string } {
		const held = isBrennans ? current?.dishes.find((d) => d.id === id) : undefined;
		return { href: held ? `${base}/menu#${id}` : null, name: index?.dishes?.[id] ?? held?.name ?? "A Brennan's dish" };
	}

	/* The menu component's own explanation, only when a person kept it (the Maître d' rule). */
	function componentExplain(name: string): string | null {
		if (!isBrennans || !current) return null;
		const fold = (s: string) => s.trim().toLowerCase();
		const c = (current.components ?? []).find((x) => x.name === name) ?? (current.components ?? []).find((x) => fold(x.name) === fold(name));
		return c?.explain && c.explain.by === 'person' && c.explain.value ? c.explain.value : null;
	}

	/* The root */
	const todayRun = $derived(index && session.ready && mounted ? cuisineToday(index.cards, log, Date.now(), chosen as CzLevel) : null);
	const nextUp = $derived(index && mounted ? nextUnread(index.entries, read, chosen as CzLevel) : null);
	const atLevel = $derived(index ? index.entries.filter((h) => h.level === chosen).length : 0);
	const chapterRows = $derived(index ? index.chapters.map((c) => ({ head: c, counts: chapterCounts(index, c.key, read, log) })) : []);
	const drillScope = $derived(addr.all ? 'all' : `lv:${chosen}`);
	const drillScopeObj = $derived(parseScope(drillScope) ?? { kind: 'all' as const });
	const flashIds = $derived(index ? cardsInScope(index, drillScopeObj).map((c) => c[0]) : []);
	const quizCount = $derived(index ? questionsInScope(index, drillScopeObj).length : 0);
	const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

	function setAll(v: boolean) {
		nav.replaceShallow(cuisineHref(v ? 'all=1' : ''), { ...((page.state ?? {}) as App.PageState) });
		readAddr();
	}

	/* A chapter */
	const chHead = $derived(index?.chapters.find((c) => c.key === addr.ch) ?? null);
	const chEntries = $derived(index ? index.entries.filter((h) => h.chapter === addr.ch) : []);
	const chSteps = $derived(index ? index.steps.filter((s) => s.chapter === addr.ch) : []);
	const chMatches = $derived(index ? index.matches.filter((m) => m.chapter === addr.ch) : []);
	const chCounts = $derived(index && chHead ? chapterCounts(index, chHead.key, read, log) : null);

	/* An entry */
	const entryHead = $derived(index ? (index.entries.find((h) => h.slug === addr.e) ?? null) : null);
	const entryChapter = $derived(entryHead?.chapter ?? addr.ch);
	const entryBody = $derived(entryHead ? cuisine.entry(entryHead.id) : null);
	const entryLabels = $derived(cuisine.chapter(entryChapter)?.labels ?? {});
	const entryNext = $derived.by(() => {
		if (!index || !entryHead) return null;
		const n = nextEntry(index.entries, entryHead.id);
		return n ? { href: entryHref(n.chapter, n.slug), title: n.title } : null;
	});

	function markRead(id: string, v: boolean) {
		read = setRead(deviceStorage(), read, id, v);
	}

	/* The chapter an entry or a chapter screen draws, loaded when it is asked for. */
	$effect(() => {
		if (!index) return;
		if (screen === 'entry' || screen === 'chapter') void cuisine.ensure([entryChapter]);
	});

	/* Decks and runs */
	function deckName(id: string): string {
		if (id === 'today') return 'In Cuisine today';
		if (id === 'misses') return 'The misses';
		const s = parseScope(id);
		if (!s) return 'A deck';
		if (s.kind === 'all') return 'Every Cuisine card';
		if (s.kind === 'level') return `Cuisine at ${nameOf(s.level)}`;
		return scopeName(s, index, nameOf);
	}

	function deckMembers(id: string): string[] {
		if (!index) return [];
		const s = parseScope(id);
		return s ? cardsInScope(index, s).map((c) => c[0]) : [];
	}

	function runRefs(deck: string, z: readonly string[] = []): string[] {
		if (!index) return [];
		const now = Date.now();
		if (deck === 'today') return cuisineToday(index.cards, session.drillLog, now, chosen as CzLevel).refs;
		if (deck === 'misses') {
			const known = new Set(index.cards.map((c) => c[0]));
			return [...new Set(z)].filter((id) => known.has(id)).slice(0, CZ_RUN_CAP);
		}
		const s = parseScope(deck);
		return s ? dealCards(cardsInScope(index, s), session.drillLog, now).refs : [];
	}

	function runState(deck: string, refs: string[]): Cz {
		return { s: 'run', deck, refs, i: 0, flipped: false, got: 0, again: 0, missed: [], done: refs.length === 0 };
	}

	function setCz(next: Cz) {
		nav.replaceShallow(location.href, { ...((page.state ?? {}) as App.PageState), cz: next });
	}

	async function startRun(deck: string) {
		const refs = runRefs(deck);
		await cuisine.ensure(cuisine.chaptersOfCards(refs));
		nav.pushShallow(`${cuisineHref(`deck=${enc(deck)}`)}&run=1`, { cz: runState(deck, refs) });
		readAddr();
		void focusFrame();
	}

	async function startToday() {
		const refs = runRefs('today');
		await cuisine.ensure(cuisine.chaptersOfCards(refs));
		nav.pushShallow(cuisineHref('due=1'), { cz: runState('today', refs) });
		readAddr();
		void focusFrame();
	}

	async function studyCards(ids: string[]) {
		const refs = [...new Set(ids)].slice(0, CZ_RUN_CAP);
		if (!refs.length) return;
		await cuisine.ensure(cuisine.chaptersOfCards(refs));
		nav.pushShallow(`${cuisineHref(`deck=misses&z=${refs.join(',')}`)}&run=1`, { cz: runState('misses', refs) });
		readAddr();
		void focusFrame();
	}

	function flip() {
		if (!cz || cz.s !== 'run' || cz.done) return;
		setCz({ ...cz, flipped: true });
	}

	function grade(got: boolean) {
		if (!cz || cz.s !== 'run' || !cz.flipped || cz.done) return;
		const refs = cz.refs ?? [];
		const id = refs[cz.i];
		if (id && recordable(session.drillLog, id, Date.now())) session.markDrilled(czSlug(id), cardGrade(got));
		const nextRefs = id ? requeue(refs, id, got) : [...refs];
		const missed = [...(cz.missed ?? [])];
		if (!got && id && !missed.includes(id)) missed.push(id);
		const i = cz.i + 1;
		const done = i >= nextRefs.length;
		if (done) markStudied();
		setCz({ ...cz, refs: nextRefs, i: done ? cz.i : i, flipped: false, got: (cz.got ?? 0) + (got ? 1 : 0), again: (cz.again ?? 0) + (got ? 0 : 1), missed, done });
		if (!done) void focusFrame();
		else void focusTop();
	}

	/* The cards a run shows, loaded with their chapters (a pop back to a run after a reload). */
	$effect(() => {
		if (cz?.s === 'run' && cz.refs?.length && index) void cuisine.ensure(cuisine.chaptersOfCards(cz.refs));
	});

	const runCard = $derived(cz?.s === 'run' ? cuisine.cardById((cz.refs ?? [])[cz.i] ?? '') : null);

	/* Rounds */
	const KIND_TITLE: Record<CzKind, string> = { mc: 'Quiz', steps: 'Order the steps', match: 'Family matching' };
	const KIND_ITEM: Record<CzKind, string> = { mc: 'Question', steps: 'Method', match: 'Set' };

	/** The chapters a round's items live in, from the index alone. */
	function chaptersOfItems(kind: CzKind, ids: readonly string[]): string[] {
		if (!index) return [];
		const want = new Set(ids);
		const out = new Set<string>();
		if (kind === 'mc') {
			for (const [q, entry] of index.questions) if (want.has(q)) out.add(cuisine.head(entry)?.chapter ?? '');
		} else if (kind === 'steps') {
			for (const s of index.steps) if (want.has(s.id)) out.add(s.chapter);
		} else for (const m of index.matches) if (want.has(m.id)) out.add(m.chapter);
		out.delete('');
		return [...out];
	}

	function scopeItems(scopeStr: string, kind: CzKind): string[] {
		const scope = parseScope(scopeStr);
		if (!index || !scope) return [];
		if (kind === 'mc') return questionsInScope(index, scope).map((t) => t[0]);
		if (kind === 'steps') return stepsInScope(index, scope).map((s) => s.id);
		return matchesInScope(index, scope).map((m) => m.id);
	}

	async function roundItems(scopeStr: string, kind: CzKind): Promise<Item[]> {
		const rand = Math.random;
		/* Ordered and cut from the index alone, so a round loads the chapters
		   of the items it asks, never every chapter its scope reaches. */
		const ids = askOrder(scopeItems(scopeStr, kind), session.drillLog, rand).slice(0, ROUND_LENGTH[kind]);
		await cuisine.ensure(chaptersOfItems(kind, ids));
		if (kind === 'mc') return ids.filter((id) => cuisine.questionById(id)).map((id) => ({ id, opts: mcOptions(cuisine.questionById(id)!.question, rand) }));
		if (kind === 'steps') return ids.filter((id) => cuisine.stepsById(id)).map((id) => ({ id, pool: stepsPool(cuisine.stepsById(id)!.set, rand) }));
		return ids.filter((id) => cuisine.matchById(id)).map((id) => ({ id, order: matchOrder(cuisine.matchById(id)!.set.pairs.length, rand) }));
	}

	function roundState(quiz: string, kind: CzKind, items: Item[]): Cz {
		return { s: 'round', quiz, kind, items, i: 0, picked: null, placed: [], links: [], answers: [], done: items.length === 0 };
	}

	let dealing = $state(false);
	async function startRound(quiz: string, kind: CzKind) {
		dealing = true;
		const items = await roundItems(quiz, kind);
		dealing = false;
		nav.pushShallow(cuisineHref(`quiz=${enc(quiz)}&kind=${kind}`), { cz: roundState(quiz, kind, items) });
		readAddr();
		void focusTop();
	}

	$effect(() => {
		if (cz?.s === 'round' && cz.items?.length && index) void cuisine.ensure(chaptersOfItems(cz.kind ?? 'mc', cz.items.map((it) => it.id)));
	});

	const item = $derived(cz?.s === 'round' && !cz.done ? (cz.items ?? [])[cz.i] : undefined);
	const answered = $derived(!!cz && cz.s === 'round' && !!cz.answers?.[cz.i]);
	const mcItem = $derived(item && cz?.kind === 'mc' ? cuisine.questionById(item.id) : null);
	const stepsItem = $derived(item && cz?.kind === 'steps' ? cuisine.stepsById(item.id) : null);
	const matchItem = $derived(item && cz?.kind === 'match' ? cuisine.matchById(item.id) : null);
	const itemLabel = $derived.by(() => {
		if (mcItem) return mcItem.entry.title;
		if (stepsItem) return stepsItem.set.title;
		if (matchItem) return matchItem.set.title;
		return '';
	});
	const roundScopeName = $derived(cz?.quiz ? scopeName(parseScope(cz.quiz) ?? { kind: 'all' }, index, nameOf) : '');

	function answer(ok: boolean, extra: { said?: string; wrong?: number[] }, patch: Partial<Cz> = {}) {
		if (!cz || !item) return;
		if (recordable(session.drillLog, item.id, Date.now())) session.markDrilled(czSlug(item.id), roundGrade(ok));
		const answers = [...(cz.answers ?? [])];
		answers[cz.i] = { ok, ...extra };
		setCz({ ...cz, ...patch, answers });
	}

	function pick(o: string) {
		if (!cz || !mcItem || answered) return;
		answer(o === mcItem.question.answer, { said: o }, { picked: o });
	}

	function place(i: number) {
		if (!cz || !stepsItem || answered) return;
		setCz({ ...cz, placed: placeStep(cz.placed ?? [], i, stepsItem.set.steps.length) });
	}
	function unplace(pos: number) {
		if (!cz || answered) return;
		setCz({ ...cz, placed: removeStep(cz.placed ?? [], pos) });
	}
	function checkSteps() {
		if (!cz || !stepsItem || !item || answered) return;
		const r = gradeSteps(stepsItem.set, item.pool ?? [], cz.placed ?? []);
		answer(r.right, { wrong: r.wrong, said: (cz.placed ?? []).join(',') });
		void focusNext();
	}
	const stepsResult = $derived.by<StepsResult | null>(() => {
		if (!cz || !stepsItem || !item || !answered) return null;
		return gradeSteps(stepsItem.set, item.pool ?? [], cz.placed ?? []);
	});

	function pairIt(l: number, r: number) {
		if (!cz || answered) return;
		setCz({ ...cz, links: pairUp(cz.links ?? [], l, r) });
	}
	function unpairIt(side: 'left' | 'right', i: number) {
		if (!cz || answered) return;
		setCz({ ...cz, links: unpair(cz.links ?? [], side, i) });
	}
	function checkMatch() {
		if (!cz || !matchItem || answered) return;
		const r = gradeMatch(matchItem.set, cz.links ?? []);
		answer(r.right, { wrong: r.wrong });
		void focusNext();
	}
	const matchResult = $derived.by<MatchResult | null>(() => {
		if (!cz || !matchItem || !answered) return null;
		return gradeMatch(matchItem.set, cz.links ?? []);
	});

	function nextItem() {
		if (!cz || cz.s !== 'round' || !answered) return;
		if (cz.i + 1 >= (cz.items ?? []).length) {
			markStudied();
			setCz({ ...cz, done: true });
			void focusTop();
			return;
		}
		setCz({ ...cz, i: cz.i + 1, picked: null, placed: [], links: [] });
		void focusTop();
	}

	/* The results */
	type Miss = { key: string; label: string; prompt: string; answer: string[]; why: string; read: { href: string; word: string } | null; teaches: string | null; entries: string[] };
	const misses = $derived.by<Miss[]>(() => {
		if (!cz || cz.s !== 'round' || !cz.done) return [];
		const out: Miss[] = [];
		(cz.items ?? []).forEach((it, k) => {
			const a = cz.answers?.[k];
			if (!a || a.ok) return;
			if (cz.kind === 'mc') {
				const f = cuisine.questionById(it.id);
				if (f) out.push({ key: it.id, label: f.entry.title, prompt: f.question.q, answer: [f.question.answer], why: f.question.why, read: readLink(f.entry.id), teaches: f.question.teaches, entries: [] });
			} else if (cz.kind === 'steps') {
				const f = cuisine.stepsById(it.id);
				if (f) out.push({ key: it.id, label: f.set.title, prompt: f.set.prompt, answer: f.set.steps, why: f.set.why, read: readLink(f.set.entry), teaches: null, entries: f.set.entry ? [f.set.entry] : [] });
			} else {
				const f = cuisine.matchById(it.id);
				if (!f) return;
				const wrongRows = (a.wrong ?? []).map((l) => f.set.pairs[l]).filter((p) => !!p);
				const entries = [...new Set(wrongRows.map((p) => p[2]).filter((x): x is string => !!x))];
				const read =
					f.set.generated === 'tree'
						? { href: cuisineHref('view=tree'), word: 'Read the family tree' }
						: f.set.generated === 'ladder'
							? { href: cuisineHref('view=ladder'), word: 'Read the roux ladder' }
							: readLink(entries[0]);
				out.push({ key: it.id, label: f.set.title, prompt: f.set.prompt, answer: wrongRows.map((p) => `${p[0]}: ${p[1]}`), why: '', read, teaches: null, entries });
			}
		});
		return out;
	});
	const studyIds = $derived(cardsForMisses(misses, (e) => cuisine.cardsOf(e)));
	const rightCount = $derived(cz?.s === 'round' ? (cz.answers ?? []).filter((a) => a?.ok).length : 0);

	/* Focus and keys */
	let top: HTMLElement | undefined = $state();
	async function focusTop() {
		await tick();
		window.scrollTo(0, 0);
		top?.focus({ preventScroll: true });
	}
	/* A check puts the verdict where its own button was: focus goes on to the
	   next item's button, never back to the start of the page. */
	let nextBtn: HTMLButtonElement | undefined = $state();
	async function focusNext() {
		await tick();
		nextBtn?.focus();
	}
	let frame: DeckFrame | undefined = $state();
	let frameEl: HTMLElement | undefined = $state();
	async function focusFrame() {
		await tick();
		if (frameEl) frameEl.scrollIntoView({ block: 'start' });
		else window.scrollTo(0, 0);
		frame?.focus();
	}

	function onkey(e: KeyboardEvent) {
		if (screen !== 'card' || e.metaKey || e.ctrlKey || e.altKey) return;
		const t = e.target as HTMLElement | null;
		if (t && ['BUTTON', 'A', 'SUMMARY', 'INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
		if ((e.key === ' ' || e.key === 'Enter') && !cz?.flipped) {
			e.preventDefault();
			flip();
		} else if (cz?.flipped && e.key === '1') grade(true);
		else if (cz?.flipped && e.key === '2') grade(false);
	}

	/* Back to the root or a chapter lands where it was left, once Cuisine has drawn. */
	export const snapshot: Snapshot<{ y: number }> = {
		capture: () => ({ y: typeof window === 'undefined' ? 0 : window.scrollY }),
		restore: (v) => {
			if (!cz) restoreScroll(v.y ?? 0, () => !!cuisine.index);
		}
	};

	const title = $derived.by(() => {
		switch (screen) {
			case 'chapter':
				return chHead?.title ?? 'Cuisine';
			case 'entry':
				return entryHead?.title ?? 'Cuisine';
			case 'deck':
				return deckName(addr.deck);
			case 'card':
			case 'summary':
				return deckName(cz?.deck ?? '');
			case 'item':
			case 'results':
				return KIND_TITLE[cz?.kind ?? 'mc'];
			case 'tree':
				return 'The family tree';
			case 'ladder':
				return 'The roux ladder';
			default:
				return 'Cuisine';
		}
	});
	const rouxFolio = TEACHING_FOLIOS.find((f) => f.id === 'roux-colour-ladder') ?? null;
</script>

<svelte:window onkeydown={onkey} />
<svelte:head><title>{title} · The World Table</title></svelte:head>

<div class="shell hub cuisine" data-screen={screen}>
	{#if cuisine.failed && !index}
		<h1 tabindex="-1">Cuisine</h1>
		<p class="note">Cuisine could not be opened on this device. Open it once with a connection and it stays for offline use.</p>
	{:else if screen === 'root'}
		<h1 tabindex="-1" bind:this={top}>Cuisine</h1>
		<p class="lede">French and Creole cooking in depth: the stocks and the mother sauces, the roux and the trinity, the methods, the larder and the history behind every plate at Brennan's.</p>
		<ScopeChip names={nameOf} {chosen} all={addr.all} onAll={setAll} onChoose={(n) => levels.choose(n)} />

		<section class="todayblock" aria-labelledby="cz-today">
			<h2 class="group" id="cz-today">In Cuisine today</h2>
			{#if !todayRun}
				<p class="note">Reading your record…</p>
			{:else if todayRun.total > 0}
				<p class="note dueline">{todayLine(todayRun, levelName)}</p>
				<button type="button" class="chip go start" onclick={startToday}>Start today's Cuisine cards</button>
			{:else}
				<p class="note dueline">{todayLine(todayRun, levelName)}</p>
			{/if}
		</section>

		<h2 class="group" id="cz-next">Next unread at {levelName}</h2>
		{#if !index}
			<p class="note">Opening Cuisine…</p>
		{:else if nextUp}
			<nav class="quiet" aria-labelledby="cz-next">
				<a class="door lead" href={entryHref(nextUp.chapter, nextUp.slug)}>
					<span class="door-name">{nextUp.title}</span>
					<span class="door-line">{nextUp.summary}</span>
				</a>
			</nav>
		{:else if atLevel}
			<p class="note">Every {levelName} entry written so far is marked read.</p>
		{:else}
			<p class="note">No {levelName} entries are written yet.</p>
		{/if}

		<h2 class="group" id="cz-chapters">Chapters</h2>
		{#if !index}
			<p class="note">Opening Cuisine…</p>
		{:else}
			<ul class="doors chapters" aria-labelledby="cz-chapters">
				{#each chapterRows as r (r.head.key)}
					<li>
						{#if r.head.entries > 0}
							<a class="door" href={cuisineHref(`ch=${enc(r.head.key)}`)} data-chapter={r.head.key}>
								<span class="door-name">{r.head.title}</span>
								<span class="door-line">{r.head.intro}</span>
								<span class="door-sub">{chapterLine(r.counts)}</span>
							</a>
						{:else}
							<div class="door coming" data-chapter={r.head.key}>
								<span class="door-name">{r.head.title}</span>
								<span class="door-line">{r.head.intro}</span>
								<span class="door-sub">Coming: not written yet</span>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}

		<h2 class="group" id="cz-drills">Drills</h2>
		{#if index}
			<ul class="doors" aria-labelledby="cz-drills">
				<li>
					{#if flashIds.length}
						<a class="door" href={cuisineHref(`deck=${enc(drillScope)}`)}>
							<span class="door-name">Flashcards</span>
							<span class="door-line">{addr.all ? 'Every level' : levelName}: {plural(flashIds.length, 'card', 'cards')} · {learntCount(flashIds, log)} learnt</span>
						</a>
					{:else}
						<div class="door coming"><span class="door-name">Flashcards</span><span class="door-line">No cards at {addr.all ? 'any level' : levelName} yet.</span></div>
					{/if}
				</li>
				<li>
					{#if quizCount}
						<a class="door" href={cuisineHref(`quiz=${enc(drillScope)}&kind=mc`)}>
							<span class="door-name">Quiz</span>
							<span class="door-line">{addr.all ? 'Every level' : levelName}: {plural(quizCount, 'question', 'questions')}, up to ten a round, four options each.</span>
						</a>
					{:else}
						<div class="door coming"><span class="door-name">Quiz</span><span class="door-line">No questions at {addr.all ? 'any level' : levelName} yet.</span></div>
					{/if}
				</li>
				<li>
					{#if index.steps.length}
						<a class="door" href={cuisineHref('quiz=all&kind=steps')}>
							<span class="door-name">Order the steps</span>
							<span class="door-line">Put a method's stages in order: {plural(index.steps.length, 'method', 'methods')}.</span>
						</a>
					{:else}
						<div class="door coming"><span class="door-name">Order the steps</span><span class="door-line">Coming: no methods written yet.</span></div>
					{/if}
				</li>
				<li>
					{#if index.matches.length}
						<a class="door" href={cuisineHref('quiz=all&kind=match')}>
							<span class="door-name">Family matching</span>
							<span class="door-line">Pair each item with its family: {plural(index.matches.length, 'set', 'sets')}.</span>
						</a>
					{:else}
						<div class="door coming"><span class="door-name">Family matching</span><span class="door-line">Coming: no sets written yet.</span></div>
					{/if}
				</li>
			</ul>
		{/if}

		<h2 class="group" id="cz-views">The two diagrams, in words</h2>
		<ul class="doors" aria-labelledby="cz-views">
			<li>
				{#if index?.tree}
					<a class="door" href={cuisineHref('view=tree')}><span class="door-name">The family tree</span><span class="door-line">Carême's four, the five mothers, their liaisons and liquids, and every small sauce with what it adds.</span></a>
				{:else}
					<div class="door coming"><span class="door-name">The family tree</span><span class="door-line">Coming.</span></div>
				{/if}
			</li>
			<li>
				{#if index?.ladder}
					<a class="door" href={cuisineHref('view=ladder')}><span class="door-name">The roux ladder</span><span class="door-line">From white to the darkest brick: the minutes, the look, the smell and what each colour thickens.</span></a>
				{:else}
					<div class="door coming"><span class="door-name">The roux ladder</span><span class="door-line">Coming.</span></div>
				{/if}
			</li>
		</ul>
	{:else if screen === 'chapter'}
		{#if !index}
			<h1 tabindex="-1">Cuisine</h1>
			<p class="note">Opening Cuisine…</p>
		{:else if !chHead}
			<h1 tabindex="-1">No such chapter</h1>
			<p class="note">Cuisine has no chapter at this address.</p>
			<a class="chip" href={cuisineHref()}>Open Cuisine for the twelve</a>
		{:else}
			<p class="eyebrow">Cuisine</p>
			<h1 tabindex="-1">{chHead.title}</h1>
			<p class="lede">{chHead.intro}</p>
			{#if chCounts && chEntries.length}<p class="note">{chapterLine(chCounts)}</p>{/if}

			<h2 class="group" id="ch-entries">Entries</h2>
			{#if !chEntries.length}
				<p class="note">Coming: this chapter is not written yet.</p>
			{:else}
				<ul class="doors entries" aria-labelledby="ch-entries">
					{#each chEntries as h (h.id)}
						<li>
							<a class="door" class:lead={!read.has(h.id) && h.level === chosen} href={entryHref(h.chapter, h.slug)} data-entry={h.slug}>
								<span class="door-name">{h.title}</span>
								<span class="door-line">{h.summary}</span>
								<span class="door-sub">{nameOf(h.level)}{read.has(h.id) ? ' · Read' : ''}</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}

			{#if chEntries.length || chSteps.length || chMatches.length}
				<h2 class="group" id="ch-drills">Drill this chapter</h2>
				<div class="chips">
					{#if chHead.cards}<a class="chip go" href={cuisineHref(`deck=${enc('ch:' + chHead.key)}`)}>Flash this chapter</a>{/if}
					{#if chHead.questions}<a class="chip" href={cuisineHref(`quiz=${enc('ch:' + chHead.key)}&kind=mc`)}>Quiz this chapter</a>{/if}
					{#if chSteps.length}<a class="chip" href={cuisineHref(`quiz=${enc('ch:' + chHead.key)}&kind=steps`)}>Order the steps</a>{/if}
					{#if chMatches.length}<a class="chip" href={cuisineHref(`quiz=${enc('ch:' + chHead.key)}&kind=match`)}>Family matching</a>{/if}
				</div>
			{/if}
		{/if}
	{:else if screen === 'entry'}
		{#if !index || (entryHead && !entryBody && !cuisine.has(entryHead.chapter) && !cuisine.chapterFailed(entryHead.chapter))}
			<h1 tabindex="-1">{entryHead?.title ?? 'Cuisine'}</h1>
			<p class="note">Opening the entry…</p>
		{:else if entryHead && !entryBody && cuisine.chapterFailed(entryHead.chapter)}
			<h1 tabindex="-1">{entryHead.title}</h1>
			<p class="note">This chapter could not be opened on this device. Open it once with a connection and it stays for offline use.</p>
		{:else if !entryHead || !entryBody}
			<h1 tabindex="-1">Not written yet</h1>
			<p class="note">There is no Cuisine entry at this address yet. It may be coming.</p>
			{#if chHead}<a class="chip" href={cuisineHref(`ch=${enc(chHead.key)}`)}>{chHead.title}</a>{/if}
		{:else}
			{#key entryBody.id}
				<CzEntry
					entry={entryBody}
					labels={entryLabels}
					levelName={nameOf(entryBody.level)}
					{entryLink}
					{dishLink}
					{componentExplain}
					read={read.has(entryBody.id)}
					onRead={(v) => markRead(entryBody.id, v)}
					flashHref={`${cuisineHref(`deck=${enc('e:' + entryBody.id)}`)}&run=1`}
					quizHref={cuisineHref(`quiz=${enc('e:' + entryBody.id)}&kind=mc`)}
					next={entryNext}
				/>
			{/key}
		{/if}
	{:else if screen === 'deck'}
		{@const members = deckMembers(addr.deck)}
		<h1 tabindex="-1" bind:this={top}>{deckName(addr.deck)}</h1>
		{#if !index}
			<p class="note">Opening Cuisine…</p>
		{:else}
			<p class="note deckline">{plural(members.length, 'card', 'cards')} · {learntCount(members, log)} learnt</p>
			{#if members.length > CZ_RUN_CAP}<p class="note">Each run deals {CZ_RUN_CAP}: what is due first, then what is new.</p>{/if}
			{#if members.length}
				<button type="button" class="chip go start" onclick={() => startRun(addr.deck)}>Start</button>
			{:else}
				<p class="note">No cards in this deck yet.</p>
			{/if}
		{/if}
	{:else if screen === 'dealing'}
		<h1 tabindex="-1" bind:this={top}>{addr.quiz ? KIND_TITLE[addr.kind] : addr.due ? 'In Cuisine today' : deckName(addr.deck)}</h1>
		{#if pending || !index}
			<p class="note" role="status">Dealing…</p>
		{:else if addr.quiz}
			<button type="button" class="chip go start" disabled={dealing} onclick={() => startRound(addr.quiz, addr.kind)}>Start</button>
		{:else if addr.due}
			<button type="button" class="chip go start" onclick={startToday}>Start</button>
		{:else if addr.deck === 'misses'}
			<button type="button" class="chip go start" onclick={() => studyCards(addr.z)}>Start</button>
		{:else}
			<button type="button" class="chip go start" onclick={() => startRun(addr.deck)}>Start</button>
		{/if}
	{:else if screen === 'card' && cz}
		{@const refs = cz.refs ?? []}
		<h1 class="vh-h">{deckName(cz.deck ?? '')}</h1>
		<div class="framewrap" bind:this={frameEl}>
			<DeckFrame bind:this={frame} position="Card {cz.i + 1} of {refs.length} · {deckName(cz.deck ?? '')}" flipped={!!cz.flipped} onFlip={flip} onGrade={grade}>
				{#snippet face()}
					<CzCardFace
						front={runCard?.card.front ?? null}
						back={runCard?.card.back ?? ''}
						eyebrow={runCard?.entry.title ?? 'Cuisine'}
						folioIds={runCard?.entry.seeAlso.folios}
						flipped={!!cz.flipped}
						readHref={runCard ? entryHref(runCard.chapter, runCard.entry.slug) : null}
					/>
				{/snippet}
			</DeckFrame>
		</div>
		<p class="note tally" aria-live="polite">{cz.got ?? 0} got it, {cz.again ?? 0} to see again.</p>
	{:else if screen === 'summary' && cz}
		<h1 tabindex="-1" bind:this={top}>Deck done</h1>
		<p class="note summaryline" role="status">
			{#if !(cz.refs ?? []).length}No cards to deal in this deck today.{:else if cz.again}{cz.got ?? 0} got it, {cz.again} to see again.{:else}{cz.got ?? 0} got it.{/if}
		</p>
		<div class="chips">
			{#if (cz.missed ?? []).length}<button type="button" class="chip go" onclick={() => studyCards(cz.missed ?? [])}>Study the misses</button>{/if}
			<a class="chip" href={cuisineHref()}>Cuisine</a>
		</div>
	{:else if screen === 'item' && cz}
		{@const n = (cz.items ?? []).length}
		<h1 tabindex="-1" bind:this={top} class="qhead">{KIND_TITLE[cz.kind ?? 'mc']}</h1>
		<p class="note where">{KIND_ITEM[cz.kind ?? 'mc']} {cz.i + 1} of {n} · {roundScopeName}{itemLabel ? ` · ${itemLabel}` : ''}</p>
		{#if !item}
			<p class="note">Nothing to ask here yet.</p>
		{:else if cz.kind === 'mc'}
			{#if mcItem}
				<CzMcRound stem={mcItem.question.q} options={item.opts ?? []} answer={mcItem.question.answer} why={mcItem.question.why} picked={cz.picked ?? null} onPick={pick} />
			{:else}
				<p class="note">Opening the chapter…</p>
			{/if}
		{:else if cz.kind === 'steps'}
			{#if stepsItem}
				<CzSteps set={stepsItem.set} pool={item.pool ?? []} placed={cz.placed ?? []} result={stepsResult} onPlace={place} onRemove={unplace} onCheck={checkSteps} />
			{:else}
				<p class="note">Opening the chapter…</p>
			{/if}
		{:else if matchItem}
			<CzMatch set={matchItem.set} order={item.order ?? []} links={cz.links ?? []} result={matchResult} onPair={pairIt} onUnpair={unpairIt} onCheck={checkMatch} />
		{:else}
			<p class="note">Opening the chapter…</p>
		{/if}
		{#if answered}
			<button type="button" class="chip go nextq" onclick={nextItem} bind:this={nextBtn}>{cz.i + 1 >= n ? 'See what you missed' : `Next ${KIND_ITEM[cz.kind ?? 'mc'].toLowerCase()}`}</button>
		{/if}
		<p class="note score" aria-live="polite">{rightCount} right of {(cz.answers ?? []).filter(Boolean).length} answered</p>
	{:else if screen === 'results' && cz}
		{@const n = (cz.items ?? []).length}
		<h1 tabindex="-1" bind:this={top}>What you missed</h1>
		<p class="note">{KIND_TITLE[cz.kind ?? 'mc']}, {roundScopeName}: {rightCount} right of {n}.</p>
		{#if !n}
			<p class="note">Nothing could be dealt here yet.</p>
		{:else if !misses.length}
			<p class="note nothing">Nothing missed.</p>
		{:else}
			<ol class="misses">
				{#each misses as m (m.key)}
					<li class="miss">
						<p class="mlabel">{m.label}</p>
						<p class="mstem">{m.prompt}</p>
						{#if cz.kind === 'steps'}
							<p class="manswer">The order:</p>
							<ol class="morder">{#each m.answer as a, i (i)}<li>{a}</li>{/each}</ol>
						{:else if cz.kind === 'match'}
							<p class="manswer">The right pairs:</p>
							<ul class="morder">{#each m.answer as a, i (i)}<li>{a}</li>{/each}</ul>
						{:else}
							<p class="manswer">Answer: {m.answer[0]}</p>
						{/if}
						{#if m.why}<p class="mwhy">{m.why}</p>{/if}
						{#if m.read}<a class="chip" href={m.read.href}>{m.read.word}</a>{/if}
					</li>
				{/each}
			</ol>
		{/if}
		<div class="chips">
			{#if studyIds.length}<button type="button" class="chip go" onclick={() => studyCards(studyIds)}>Study these cards</button>{/if}
			<button type="button" class="chip" disabled={dealing} onclick={() => startRound(cz.quiz ?? 'all', cz.kind ?? 'mc')}>Deal another</button>
		</div>
	{:else if screen === 'tree'}
		<p class="eyebrow">Cuisine</p>
		<h1 tabindex="-1">The family tree</h1>
		<p class="lede">How the classical sauces descend: each mother is a liquid bound by a liaison, and each small sauce is a mother with something added.</p>
		{#if !index}
			<p class="note">Opening Cuisine…</p>
		{:else if !index.tree}
			<p class="note">Coming: the tree is not written yet.</p>
		{:else}
			<CzTree tree={index.tree} {entryLink} {dishLink} />
		{/if}
	{:else if screen === 'ladder'}
		<p class="eyebrow">Cuisine</p>
		<h1 tabindex="-1">The roux ladder</h1>
		<p class="lede">Flour cooked in fat, from pale to dark. The longer it cooks, the more it tastes and the less it thickens.</p>
		{#if !index}
			<p class="note">Opening Cuisine…</p>
		{:else if !index.ladder}
			<p class="note">Coming: the ladder is not written yet.</p>
		{:else}
			<CzLadder ladder={index.ladder} folio={rouxFolio} {entryLink} {dishLink} />
		{/if}
	{/if}
</div>

<style>
	.start {
		margin-top: 10px;
		min-height: 52px;
		padding-inline: 22px;
		font-size: 1.1rem;
	}
	.dueline,
	.deckline,
	.summaryline {
		font-size: var(--t-body);
	}
	.eyebrow {
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--turmeric-deep);
		margin: 0;
	}
	.doors {
		list-style: none;
		padding: 0;
	}
	.doors > li {
		display: flex;
		min-width: 0;
	}
	/* A chapter with nothing written yet: the door's frame and words, quiet,
	   and no target, so it never reads as a broken link. */
	.door.coming {
		cursor: default;
		border-style: dashed;
		background: transparent;
	}
	.door.coming:hover {
		border-color: var(--house-frame, var(--line));
		background: transparent;
	}
	.door.coming .door-name,
	.door.coming .door-line {
		color: var(--ink-soft);
	}
	.vh-h {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	.framewrap {
		scroll-margin-top: calc(var(--modebar-h, 0px) + var(--backrow-h, 46px) + 4px);
	}
	.tally,
	.score {
		margin-top: 10px;
	}
	.where {
		margin-top: 0;
	}
	.nextq {
		margin-top: 12px;
		min-height: 48px;
	}
	.misses {
		list-style: none;
		margin: 10px 0 0;
		padding: 0;
		max-width: var(--measure);
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
	.morder {
		margin: 0 0 6px;
		padding-left: 1.4em;
		font-size: var(--t-body);
		line-height: 1.5;
	}
	.mwhy {
		font-size: 1rem;
		color: var(--ink-soft);
		margin: 0 0 8px;
	}
</style>
