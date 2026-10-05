<!--
  Flashcards (docs/consolidation-design.md 2.6 and 3.7): one deck picker in
  front of the app's three card engines, one deck screen, one card screen.

    the root      Due today first and alone, then My restaurant (the whole
                  menu, Tasting courses, a deck per section but none for a
                  section only the tastings serve, My weak ones, Part by
                  part), What it's made of (Ingredients, Techniques,
                  Stories: one card per component), the level's Floor Deck
                  sections, Words (the Lexicon) and Reference cards (the
                  whole Floor Deck, Keeps slipping); a study card's Flash
                  these components opens item-components:{id}; a tasting
                  menu's Flash the courses opens tasting:{id}, its courses
                  in printed order
    a deck        ?deck={id}: its name, "{n} cards · {m} learnt", Narrow this
                  deck where the engine has a filter, and Start
    the run       ?deck={id}&run=1: the card screen (DeckFrame.svelte), then
                  the deck summary with Study the misses and Another deck

  ONE PRERENDERED PAGE. The deck screen and the run are shallow entries of
  it (stores/nav.svelte.ts pushShallow), so the phone's back gesture and the
  Back control step through them and no route is added for them. The whole
  run rides in its entry's page state (the cards, the place, the tally), so
  a pop back into it from another page draws it exactly as it was, and every
  card after the first replaces the entry: Back from card nine is the deck
  screen. A cold load or a reload of a run with no state falls to its parent
  with a replace (Due today: to this root; the misses deal again from the
  members in their address).

  Prerendered pages may not read the query at load: it is read in
  afterNavigate (the /lexicon pattern), and the decks are dealt once the
  files and the record are in.

  WHAT A GRADE WRITES, by the engine the card came from, nothing new:
    a house dish card   card-item in the house drill slot, as the study
                        view's flash cards always wrote (Part by part:
                        card-{kind}; a component's card: card-component
                        under the component's id; a tasting course's
                        card: card-tasting-{n} under the tasting's id)
    a Floor Deck card   Got it records `close` (FLIP_GRADES.had), Again
                        records `missed` and sends the card round once more,
                        once per card per local day (flipRecordable)
    a Lexicon term      nothing, as the Lexicon's own cards recorded nothing
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount, tick } from 'svelte';
	import { loadFloorDeck, loadLexicon, loadPlates } from '$lib/data';
	import { plateIndexes } from '$lib/plates';
	import { session } from '$lib/stores/session.svelte';
	import { house } from '$lib/stores/house.svelte';
	import { levels } from '$lib/stores/levels.svelte';
	import { today } from '$lib/stores/today.svelte';
	import { nav, restoreScroll } from '$lib/stores/nav.svelte';
	import { markStudied } from '$lib/oot-studied';
	import { drilledKey, markDrilled } from '$lib/house-drilled';
	import { itemCards, latestVerdicts, mealsOf, inMeal, findItem, say, tastingInMeal, tastingOnlyIds, type ItemCard } from '$lib/study';
	import { buildFlashcards, type Flashcard } from '$lib/house/house-drills';
	import { COMPONENT_KINDS, COMPONENT_LABELS, componentsFor, type ComponentKind } from '$lib/house/house-schema';
	import { shuffleWith } from '$lib/house-drill-round';
	import { FLIP_GRADES, deckLog, flipRecordable, liveSections, pickSession, scopeFromSearch, slipping } from '$lib/floor-deck';
	import { metSlugs } from '$lib/repertoire';
	import FloorCard, { type OpenLayers } from '$lib/components/FloorCard.svelte';
	import DeckFrame from '$lib/components/DeckFrame.svelte';
	import ScopeChip from '$lib/components/ScopeChip.svelte';
	import type { DeckCard, DeckLevel, FloorDeck, LexiconEntry } from '$lib/types';
	import type { Snapshot } from './$types';

	let { data } = $props();

	type Fc = NonNullable<App.PageState['fc']>;

	/* ---- the files and the record ---------------------------------------- */
	let deck = $state<FloorDeck | null>(null);
	let lexicon = $state<LexiconEntry[] | null>(null);
	let plateOf = $state<ReadonlyMap<string, { slug: string; title: string }>>(new Map());
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
		today.load();
		void levels.load();
		void loadFloorDeck().then(
			(d) => (deck = d),
			() => {
				/* the house decks stand without the Floor Deck */
			}
		);
		void loadPlates().then(
			(p) => (plateOf = plateIndexes(p).byCard),
			() => {
				/* a card stands without its plate door */
			}
		);
	});

	function needLexicon() {
		if (lexicon) return;
		void loadLexicon().then((l) => (lexicon = l));
	}

	const chosen = $derived<DeckLevel>(mounted ? levels.chosen : 1);
	const nameOf = (n: DeckLevel) => data.levelInfo.find((l) => l.level === n)?.name ?? '';
	const levelName = $derived(nameOf(chosen));
	const current = $derived(house.current);
	const verdicts = $derived(current ? latestVerdicts(current.id, today.drilled) : new Map());
	const met = $derived(metSlugs(session.drillLog));

	/* ---- where we are ---------------------------------------------------- */
	const fc = $derived<Fc | null>(((page.state ?? {}) as App.PageState).fc ?? null);
	const screen = $derived(!fc ? 'root' : !fc.run ? 'deck' : fc.done ? 'summary' : 'card');
	let all = $state(false);
	/** A run asked for by a link (Due today, Start, a card's door), dealt once the files are in. */
	let pending = $state<{ deck: string; run: boolean; card: string; meal: string; search: string } | null>(null);

	afterNavigate((n) => {
		const p = new URLSearchParams(location.search);
		all = p.get('all') === '1';
		pending = null;
		if (fc) return; // a pop: the entry's own state draws it
		const id = p.get('deck');
		if (!id) return;
		const run = p.get('run') === '1';
		const card = p.get('card') ?? '';
		/* A reload or a cold link of a run has no hand to show: its parent, at
		   once and without waiting for the files, so a quick Back press cannot
		   land on the screen it was about to fall to. On a reload whose entry
		   beneath is that parent, one step back rather than a replace, so the
		   next Back does not show the same screen twice. A tick first, so the
		   layout's afterNavigate (which runs after this one) has read the
		   depth. The misses deal again from their address; a card asked for by
		   name is drawn. */
		if (n.type === 'enter' && run && id !== 'misses' && !card) {
			void tick().then(() => {
				if (id === 'due') nav.fallTo(`${base}/flashcards`, {});
				else nav.fallTo(deckUrl(id), { fc: { deck: id, meal: p.get('meal') || undefined } });
			});
			return;
		}
		pending = { deck: id, run, card, meal: p.get('meal') ?? '', search: location.search };
	});

	/* ---- the decks ------------------------------------------------------- */
	const sections = $derived(deck ? liveSections(deck) : []);
	const sectionTitle = (key: string) => deck?.sections.find((s) => s.key === key)?.title ?? key;
	const houseCards = $derived(current ? itemCards(current, 'dish', { all: true }) : []);
	/* A deck per section, in the house's order. A section that holds only dishes a tasting serves (the
	   Brennan's 'Tasting menus': the filet, the baked apple, the lobster and the duck) gets no door: its
	   dishes are dealt in course order by Tasting courses and each menu's own deck, and a section deck
	   would mix the two menus again. They stay in The whole menu. */
	const tastOnly = $derived(current ? tastingOnlyIds(current) : new Set<string>());
	const houseSections = $derived.by(() => {
		const order: string[] = [];
		const count = new Map<string, number>();
		const listed = new Set<string>();
		for (const c of houseCards) {
			if (!count.has(c.section)) order.push(c.section);
			count.set(c.section, (count.get(c.section) ?? 0) + 1);
			if (!tastOnly.has(c.itemId)) listed.add(c.section);
		}
		return order.filter((s) => listed.has(s)).map((s) => ({ section: s, count: count.get(s) ?? 0 }));
	});
	const engineCards = $derived(current ? buildFlashcards(current) : []);
	/* Part by part is the items' own cards; a component's card (one per component, shared by every
	   item that uses it) is dealt by the component decks: components, components:{kind} and
	   item-components:{id}, each card a k: reference under the component's id. */
	const parts = $derived(engineCards.filter((c) => c.kind !== 'component' && c.kind !== 'tasting'));
	/* The tasting courses: one card per course, in the order the menu prints them, dealt in that order
	   (never shuffled: the order is what is learnt). Each is an s: reference, {tastingId}/{n}. */
	const tasteKey = (c: Flashcard) => `${c.itemId}/${c.course ?? 0}`;
	const tasteCards = $derived(engineCards.filter((c) => c.kind === 'tasting'));
	const tasteByKey = $derived(new Map(tasteCards.map((c) => [tasteKey(c), c])));
	const tasteGrade = (c: Flashcard) => 'card-tasting-' + (c.course ?? 0);
	const compCards = $derived(new Map(engineCards.filter((c) => c.kind === 'component').map((c) => [c.itemId, c])));
	const compKind = $derived(new Map((current?.components ?? []).map((c) => [c.id, c.kind])));
	const compRefs = (ids: string[]) => ids.filter((id) => compCards.has(id)).map((id) => `k:${id}`);
	const weakIds = $derived(houseCards.filter((c) => verdicts.get(c.itemId) === 'again').map((c) => c.itemId));
	const lexAt = (n: DeckLevel) => levels.data?.items.lexicon[String(n)] ?? [];
	/* The whole Lexicon is every term it holds (design 3.7), placed at a level
	   or not: the Lexicon's own card mode is gone, so a term left out here
	   could never be flipped. */
	const allLexicon = $derived((lexicon ?? []).map((e) => e.slug));
	$effect(() => {
		if (all) needLexicon();
	});
	const slipped = $derived(deck ? slipping(deck, session.drillLog, Date.now()) : []);
	const dueNow = $derived(today.at(chosen));

	/** A deck's name, for its heading, its row and the card screen's position line. */
	function deckName(id: string): string {
		if (id === 'due') return 'Due today';
		if (id === 'menu') return 'The whole menu';
		if (id === 'menu-weak') return 'My weak ones';
		if (id === 'menu-parts') return 'Part by part';
		if (id === 'misses') return 'The misses';
		if (id === 'deck-all') return 'The whole Floor Deck';
		if (id === 'deck-slipping') return 'Keeps slipping';
		if (id === 'lexicon') return `The Lexicon at ${levelName}`;
		if (id === 'lexicon-all') return 'The whole Lexicon';
		if (id.startsWith('menu:')) return id.slice(5);
		if (id.startsWith('item:')) return (current && findItem(current, id.slice(5))?.name) || 'One dish';
		if (id === 'tastings') return say('deckTastings');
		if (id.startsWith('tasting:')) return say('deckTasting', { name: current?.tastings.find((t) => t.id === id.slice(8))?.name ?? 'A tasting' });
		if (id === 'components') return 'Every component';
		if (id.startsWith('components:')) return COMPONENT_LABELS[id.slice(11) as ComponentKind] ?? 'Components';
		if (id.startsWith('item-components:')) return say('deckItem', { name: (current && findItem(current, id.slice(16))?.name) || 'One item' });
		if (id.startsWith('deck:')) return sectionTitle(id.slice(5));
		return 'A deck';
	}

	/** Every card a deck holds, before any dealing, as references. */
	function members(id: string, opts: { meal?: string; every?: boolean } = {}): string[] {
		const meal = opts.meal ?? '';
		const keepMeal = (c: ItemCard) => {
			if (!meal || !current) return true;
			const it = findItem(current, c.itemId);
			return !it || inMeal(it, meal);
		};
		if (id === 'due') return dueNow?.refs ?? [];
		if (id === 'menu') return houseCards.filter(keepMeal).map((c) => `h:${c.itemId}`);
		if (id === 'menu-weak') return houseCards.filter((c) => weakIds.includes(c.itemId)).map((c) => `h:${c.itemId}`);
		if (id.startsWith('menu:')) return houseCards.filter((c) => c.section === id.slice(5) && keepMeal(c)).map((c) => `h:${c.itemId}`);
		if (id.startsWith('item:')) {
			const itemId = id.slice(5);
			return [
				...houseCards.filter((c) => c.itemId === itemId).map((c) => `h:${c.itemId}`),
				...parts.map((p, i) => ({ p, i })).filter(({ p }) => p.itemId === itemId).map(({ i }) => `p:${i}`)
			];
		}
		if (id === 'menu-parts') return parts.map((_, i) => `p:${i}`);
		if (id === 'tastings' || id.startsWith('tasting:')) {
			const one = id.startsWith('tasting:') ? id.slice(8) : '';
			const served = new Set((current?.tastings ?? []).filter((t) => tastingInMeal(t, meal)).map((t) => t.id));
			return tasteCards.filter((c) => (one ? c.itemId === one : served.has(c.itemId))).map((c) => `s:${tasteKey(c)}`);
		}
		if (id === 'components') return compRefs([...compCards.keys()]);
		if (id.startsWith('components:')) return compRefs([...compCards.keys()].filter((c) => compKind.get(c) === id.slice(11)));
		/* The item's components in the order its card shows them: Ingredients, Techniques, Stories. */
		if (id.startsWith('item-components:')) {
			const mine = current ? componentsFor(current, id.slice(16)) : [];
			return compRefs(COMPONENT_KINDS.flatMap((k) => mine.filter((c) => c.kind === k).map((c) => c.id)));
		}
		if (id === 'deck-all') return deck ? deck.cards.map((c) => `c:${c.id}`) : [];
		if (id === 'deck-slipping') return slipped.map((c) => `c:${c.id}`);
		if (id.startsWith('deck:')) {
			const key = id.slice(5);
			return deck ? deck.cards.filter((c) => c.section === key && (all || opts.every || c.level === chosen)).map((c) => `c:${c.id}`) : [];
		}
		if (id === 'lexicon') return lexAt(chosen).map((s) => `t:${s}`);
		if (id === 'lexicon-all') return allLexicon.map((s) => `t:${s}`);
		return [];
	}

	/** How many of a deck's cards are learnt: graded got it last time, or met on the ladder. */
	function learnt(refs: readonly string[]): number {
		let n = 0;
		for (const r of refs) {
			const [k, id] = [r.slice(0, 1), r.slice(2)];
			if (k === 'h' && verdicts.get(id) === 'got') n++;
			else if ((k === 'c' || k === 't') && met.has(id)) n++;
			else if (k === 'p') {
				const card = parts[Number(id)];
				if (card && current && today.drilled.some((e) => e.k === drilledKey(current.id, card.itemId, 'card-' + card.kind) && e.v !== 'missed')) n++;
			} else if (k === 'k' && current && today.drilled.some((e) => e.k === drilledKey(current.id, id, 'card-component') && e.v !== 'missed')) n++;
			else if (k === 's') {
				const card = tasteByKey.get(id);
				if (card && current && today.drilled.some((e) => e.k === drilledKey(current.id, card.itemId, tasteGrade(card)) && e.v !== 'missed')) n++;
			}
		}
		return n;
	}

	/** A card asked for by name leads the run; one the deck no longer holds is said, never dealt. */
	let missingCard = $state('');
	function withCard(picked: string[], card: string | undefined): string[] {
		missingCard = '';
		if (!card) return picked;
		if (!deck?.cards.some((c) => c.id === card)) {
			missingCard = card;
			return picked;
		}
		return [`c:${card}`, ...picked.filter((r) => r !== `c:${card}`)];
	}

	/** The run: the cards in the order they are shown. */
	function deal(id: string, opts: { meal?: string; every?: boolean; card?: string; search?: string } = {}): string[] {
		const now = Date.now();
		if (id === 'due') return [...(dueNow?.refs ?? [])];
		if (id === 'misses') {
			const p = new URLSearchParams(opts.search ?? location.search);
			const list = (k: string) => (p.get(k) ?? '').split(',').map((s) => s.trim()).filter(Boolean);
			return [...list('h').map((x) => `h:${x}`), ...list('c').map((x) => `c:${x}`), ...list('t').map((x) => `t:${x}`), ...list('k').map((x) => `k:${x}`), ...list('s').map((x) => `s:${x}`)];
		}
		if (id.startsWith('deck:') && deck) {
			const key = id.slice(5);
			const lv = all || opts.every ? null : new Set([chosen]);
			let picked = pickSession(deck, session.drillLog, now, { scope: new Set([key]), levels: lv }).map((c) => `c:${c.id}`);
			return withCard(picked, opts.card);
		}
		if (id === 'deck-all' && deck) {
			const { scope, levels: lv } = scopeFromSearch(opts.search ?? '', deck);
			const focus = new URLSearchParams(opts.search ?? '').get('focus') === 'misses' ? 'misses' : null;
			const picked = pickSession(deck, session.drillLog, now, { scope, levels: lv, focus }).map((c) => `c:${c.id}`);
			return withCard(picked, opts.card);
		}
		if (id.startsWith('item:') || id.startsWith('item-components:') || id === 'tastings' || id.startsWith('tasting:')) return members(id, opts);
		return shuffleWith(members(id, opts), Math.random);
	}

	/* ---- the moves ------------------------------------------------------- */
	const deckUrl = (id: string) => `${base}/flashcards?deck=${encodeURIComponent(id)}`;

	function openDeck(id: string) {
		nav.pushShallow(deckUrl(id), { fc: { deck: id } });
	}

	function runState(id: string, refs: string[], extra: Partial<Fc> = {}): Fc {
		return { deck: id, run: true, refs, i: 0, flipped: false, got: 0, again: 0, missed: [], done: refs.length === 0, ...extra };
	}

	function startRun(id: string, opts: { meal?: string; every?: boolean } = {}) {
		const refs = deal(id, opts);
		if (refs.some((r) => r.startsWith('t:'))) needLexicon();
		nav.pushShallow(`${deckUrl(id)}&run=1`, { fc: runState(id, refs) });
		void focusFrame();
	}

	function startDue() {
		if (!dueNow || dueNow.total === 0) {
			void goto(`${base}/quizzes?quick=1`);
			return;
		}
		startRun('due');
	}

	let frame: DeckFrame | undefined = $state();
	let frameEl: HTMLElement | undefined = $state();
	/* The card comes to the top of the screen, under the bar and the Back row,
	   as the study view's flash cards always brought it: Flip, Got it and Again
	   then sit in the first screen at 390 by 844. */
	async function focusFrame() {
		await tick();
		if (frameEl) frameEl.scrollIntoView({ block: 'start' });
		else window.scrollTo(0, 0);
		frame?.focus();
	}

	function setFc(next: Fc) {
		nav.replaceShallow(location.href, { ...((page.state ?? {}) as App.PageState), fc: next });
	}

	function flip() {
		if (!fc || !fc.run) return;
		// The back's five parts start closed on every card; the summary says which way it goes.
		partsOpen = false;
		if (resolveRef(currentRef)?.kind === 'c') layers = { why: false, facts: false, context: false };
		setFc({ ...fc, flipped: true });
		void tick().then(() => frameEl?.scrollIntoView({ block: 'start' }));
	}

	function grade(got: boolean) {
		if (!fc || !fc.run || !fc.flipped) return;
		const refs = [...(fc.refs ?? [])];
		const ref = refs[fc.i ?? 0];
		const r = resolveRef(ref);
		const missed = [...(fc.missed ?? [])];
		if (r && current && r.kind === 'h') {
			markDrilled(drilledKey(current.id, r.card.itemId, 'card-item'), got ? 'met' : 'missed');
		} else if (r && current && (r.kind === 'p' || r.kind === 'k')) {
			markDrilled(drilledKey(current.id, r.card.itemId, 'card-' + r.card.kind), got ? 'met' : 'missed');
		} else if (r && current && r.kind === 's') {
			markDrilled(drilledKey(current.id, r.card.itemId, tasteGrade(r.card)), got ? 'met' : 'missed');
		} else if (r && r.kind === 'c' && deck) {
			if (flipRecordable(deckLog(session.drillLog, deck.cards), r.card.id, Date.now())) {
				session.markDrilled(r.card.id, got ? FLIP_GRADES.had : FLIP_GRADES.missed);
			}
			// Again sends a deck card round once more in this run, as the sitting did.
			if (!got && refs.indexOf(ref) === refs.lastIndexOf(ref)) refs.push(ref);
		}
		if (!got && !missed.includes(ref)) missed.push(ref);
		today.refresh();
		const i = (fc.i ?? 0) + 1;
		const done = i >= refs.length;
		if (done) markStudied();
		setFc({ ...fc, refs, i: done ? fc.i : i, flipped: false, got: (fc.got ?? 0) + (got ? 1 : 0), again: (fc.again ?? 0) + (got ? 0 : 1), missed, done });
		if (!done) void focusFrame();
	}

	function studyMisses() {
		if (!fc) return;
		const ids = (k: string) => (fc.missed ?? []).filter((r) => r.startsWith(k + ':')).map((r) => r.slice(2));
		const hs = ids('h');
		const cs = ids('c');
		const ts = ids('t');
		const ks = ids('k');
		const ss = ids('s');
		// Part by part's cards go back as their dish's card: one dish, one card to restudy.
		for (const p of ids('p')) {
			const card = parts[Number(p)];
			if (card && !hs.includes(card.itemId) && houseCards.some((c) => c.itemId === card.itemId)) hs.push(card.itemId);
		}
		const q = [hs.length ? `h=${hs.join(',')}` : '', cs.length ? `c=${cs.join(',')}` : '', ts.length ? `t=${ts.join(',')}` : '', ks.length ? `k=${ks.join(',')}` : '', ss.length ? `s=${ss.map(encodeURIComponent).join(',')}` : ''].filter(Boolean).join('&');
		const refs = [...hs.map((x) => `h:${x}`), ...cs.map((x) => `c:${x}`), ...ts.map((x) => `t:${x}`), ...ks.map((x) => `k:${x}`), ...ss.map((x) => `s:${x}`)];
		if (ts.length) needLexicon();
		nav.pushShallow(`${base}/flashcards?deck=misses&run=1&${q}`, { fc: runState('misses', refs) });
		void focusFrame();
	}

	function anotherDeck() {
		nav.pushShallow(`${base}/flashcards${all ? '?all=1' : ''}`, {});
		void tick().then(() => window.scrollTo(0, 0));
	}

	function setAll(v: boolean) {
		all = v;
		const url = `${base}/flashcards${v ? '?all=1' : ''}`;
		nav.replaceShallow(url, { ...((page.state ?? {}) as App.PageState) });
	}

	function setNarrow(patch: Partial<Fc>) {
		if (!fc) return;
		setFc({ ...fc, ...patch });
	}

	/* ---- the run asked for by the address, once the files are in ---------- */
	const canDeal = (id: string) => {
		if (!today.houseSettled) return false;
		if (id === 'due') return today.ready;
		if (id.startsWith('deck') || id === 'misses') return !!deck && session.ready;
		if (id === 'lexicon-all') {
			needLexicon();
			return !!lexicon;
		}
		if (id.startsWith('lexicon')) return !!levels.data;
		return true;
	};

	$effect(() => {
		const want = pending;
		if (!want || !canDeal(want.deck)) return;
		pending = null;
		const id = want.deck;
		const meal = want.meal || undefined;
		if (!want.run) {
			nav.replaceShallow(location.href, { fc: { deck: id, meal } });
			return;
		}
		const refs = deal(id, { card: want.card, search: want.search, meal });
		if (refs.some((r) => r.startsWith('t:'))) needLexicon();
		/* A card opened by name (a look-up from the Lexicon, a plate, a search)
		   shows its answer at once with every layer open, as the look-up did;
		   nothing is recorded until it is graded. */
		const lookup = !!want.card && !missingCard;
		if (lookup) layers = { why: true, facts: true, context: true };
		nav.replaceShallow(location.href, { fc: runState(id, refs, { flipped: lookup && refs.length > 0, meal }) });
		void focusFrame();
	});

	/* ---- one card ---------------------------------------------------------- */
	type Resolved =
		| { kind: 'h'; card: ItemCard }
		| { kind: 'p'; card: Flashcard }
		| { kind: 'k'; card: Flashcard }
		| { kind: 's'; card: Flashcard }
		| { kind: 'c'; card: DeckCard }
		| { kind: 't'; entry: LexiconEntry | null; slug: string };

	const deckById = $derived(new Map((deck?.cards ?? []).map((c) => [c.id, c])));
	const lexBySlug = $derived(new Map((lexicon ?? []).map((e) => [e.slug, e])));
	const houseById = $derived(new Map(houseCards.map((c) => [c.itemId, c])));

	function resolveRef(ref: string | undefined): Resolved | null {
		if (!ref) return null;
		const id = ref.slice(2);
		switch (ref[0]) {
			case 'h': {
				const card = houseById.get(id);
				return card ? { kind: 'h', card } : null;
			}
			case 'p': {
				const card = parts[Number(id)];
				return card ? { kind: 'p', card } : null;
			}
			case 'c': {
				const card = deckById.get(id);
				return card ? { kind: 'c', card } : null;
			}
			case 'k': {
				const card = compCards.get(id);
				return card ? { kind: 'k', card } : null;
			}
			case 's': {
				const card = tasteByKey.get(id);
				return card ? { kind: 's', card } : null;
			}
			case 't':
				return { kind: 't', entry: lexBySlug.get(id) ?? null, slug: id };
		}
		return null;
	}

	const runRefs = $derived(fc?.refs ?? []);
	const currentRef = $derived(runRefs[fc?.i ?? 0]);
	const shown = $derived(resolveRef(currentRef));
	let layers = $state<OpenLayers>({ why: false, facts: false, context: false });
	let partsOpen = $state(false);
	const titles = $derived(new Map((deck?.sections ?? []).map((s) => [s.key, s.title])));
	const levelNames = $derived(new Map((deck?.levels ?? []).map((l) => [l.level, l.name])));
	const termNames = $derived(new Map((deck?.cards ?? []).map((c) => [c.id, c.term])));
	$effect(() => {
		if (runRefs.some((r) => r.startsWith('t:'))) needLexicon();
	});

	function onkey(e: KeyboardEvent) {
		if (screen !== 'card' || e.metaKey || e.ctrlKey || e.altKey) return;
		const t = e.target as HTMLElement | null;
		if (t && ['BUTTON', 'A', 'SUMMARY', 'INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
		if ((e.key === ' ' || e.key === 'Enter') && !fc?.flipped) {
			e.preventDefault();
			flip();
		} else if (fc?.flipped && e.key === '1') grade(true);
		else if (fc?.flipped && e.key === '2') grade(false);
	}

	/* ---- the root's rows --------------------------------------------------- */
	type Row = { id: string; name: string; refs: string[] };
	const row = (id: string, name = deckName(id)): Row => ({ id, name, refs: members(id) });
	const restaurantRows = $derived.by<Row[]>(() => {
		if (!current || !houseCards.length) return [];
		const out = [row('menu')];
		/* The tasting courses next to the whole menu, ahead of the sections, so they are never taken for a section's dishes. */
		if (tasteCards.length) out.push(row('tastings'));
		for (const s of houseSections) out.push(row(`menu:${s.section}`));
		if (weakIds.length) out.push(row('menu-weak'));
		if (parts.length) out.push(row('menu-parts'));
		return out;
	});
	/* What the menu is made of: a deck per kind of component, each only when it holds a card. */
	const componentRows = $derived.by<Row[]>(() => (current ? COMPONENT_KINDS.map((k) => row(`components:${k}`)).filter((r) => r.refs.length) : []));
	const levelRows = $derived.by<Row[]>(() => sections.map((s) => row(`deck:${s.key}`, s.title)).filter((r) => r.refs.length));
	const wordRows = $derived.by<Row[]>(() => [all ? row('lexicon-all') : row('lexicon')].filter((r) => r.refs.length));
	const referenceRows = $derived.by<Row[]>(() => [row('deck-all'), ...(slipped.length ? [row('deck-slipping')] : [])].filter((r) => r.refs.length));
	const line = (r: Row) => `${r.refs.length} ${r.refs.length === 1 ? 'card' : 'cards'} · ${learnt(r.refs)} learnt`;

	/* ---- the deck screen --------------------------------------------------- */
	const deckRefs = $derived(fc && !fc.run ? members(fc.deck, { meal: fc.meal, every: fc.every }) : []);
	const meals = $derived(current ? mealsOf(current) : []);
	const canNarrow = $derived(!!fc && !fc.run && ((fc.deck === 'menu' || fc.deck.startsWith('menu:')) ? meals.length > 1 : fc.deck.startsWith('deck:') && !all));

	/* Back to the root lands where it was left, once the decks have drawn. */
	export const snapshot: Snapshot<{ y: number }> = {
		capture: () => ({ y: typeof window === 'undefined' ? 0 : window.scrollY }),
		restore: (v) => {
			if (!fc) restoreScroll(v.y ?? 0, () => today.ready && !!deck);
		}
	};
</script>

<svelte:window onkeydown={onkey} />
<svelte:head><title>{screen === 'root' ? 'Flashcards' : fc ? deckName(fc.deck) : 'Flashcards'} · The World Table</title></svelte:head>

<div class="shell hub flashcards" data-screen={screen}>
	{#if screen === 'root'}
		<h1 tabindex="-1">Flashcards</h1>
		<ScopeChip names={nameOf} {chosen} {all} onAll={setAll} onChoose={(n) => levels.choose(n)} />

		<section class="dueblock" aria-labelledby="due-h">
			<h2 class="group" id="due-h">Due today</h2>
			{#if !dueNow}
				<p class="note">Reading your record…</p>
			{:else if dueNow.total > 0}
				<p class="note dueline">{dueNow.line}</p>
				<button type="button" class="chip go start" onclick={startDue}>Start today's cards</button>
			{:else}
				<p class="note dueline">{dueNow.line}</p>
				<a class="chip" href="{base}/quizzes?quick=1">Start the quick quiz</a>
			{/if}
		</section>

		<h2 class="group" id="fc-house">My restaurant</h2>
		{#if !today.houseSettled}
			<p class="note">Opening the house…</p>
		{:else if !restaurantRows.length}
			<p class="note">No restaurant on this device yet. Set one up from a level page.</p>
		{:else}
			<nav class="quiet" aria-labelledby="fc-house">
				{#each restaurantRows as r (r.id)}
					<button type="button" class="door" data-deck={r.id} onclick={() => openDeck(r.id)}>
						<span class="door-name">{r.name}</span>
						<span class="door-line">{line(r)}</span>
					</button>
				{/each}
			</nav>
		{/if}

		{#if componentRows.length}
			<h2 class="group" id="fc-made">{say('madeOf')}</h2>
			<nav class="quiet" aria-labelledby="fc-made">
				{#each componentRows as r (r.id)}
					<button type="button" class="door" data-deck={r.id} onclick={() => openDeck(r.id)}>
						<span class="door-name">{r.name}</span>
						<span class="door-line">{line(r)}</span>
					</button>
				{/each}
			</nav>
		{/if}

		<h2 class="group" id="fc-level">{all ? 'Every level' : levelName}</h2>
		{#if !deck}
			<p class="note">Opening the Floor Deck…</p>
		{:else}
			<nav class="quiet" aria-labelledby="fc-level">
				{#each levelRows as r (r.id)}
					<button type="button" class="door" data-deck={r.id} onclick={() => openDeck(r.id)}>
						<span class="door-name">{r.name}</span>
						<span class="door-line">{line(r)}</span>
					</button>
				{/each}
			</nav>
		{/if}

		<h2 class="group" id="fc-words">Words</h2>
		<nav class="quiet" aria-labelledby="fc-words">
			{#each wordRows as r (r.id)}
				<button type="button" class="door" data-deck={r.id} onclick={() => openDeck(r.id)}>
					<span class="door-name">{r.name}</span>
					<span class="door-line">{line(r)}</span>
				</button>
			{/each}
		</nav>

		<h2 class="group" id="fc-ref">Reference cards</h2>
		<nav class="quiet" aria-labelledby="fc-ref">
			{#each referenceRows as r (r.id)}
				<button type="button" class="door" data-deck={r.id} onclick={() => openDeck(r.id)}>
					<span class="door-name">{r.name}</span>
					<span class="door-line">{line(r)}</span>
				</button>
			{/each}
		</nav>
	{:else if screen === 'deck' && fc}
		<h1 tabindex="-1">{deckName(fc.deck)}</h1>
		<p class="note deckline">{deckRefs.length} {deckRefs.length === 1 ? 'card' : 'cards'} · {learnt(deckRefs)} learnt</p>
		{#if canNarrow}
			<details class="fold narrow">
				<summary>Narrow this deck</summary>
				{#if fc.deck.startsWith('deck:')}
					<div class="chips" role="group" aria-label="Which levels">
						<button type="button" class="chip" aria-pressed={!fc.every} onclick={() => setNarrow({ every: false })}>At {levelName}{!fc.every ? ', chosen' : ', off'}</button>
						<button type="button" class="chip" aria-pressed={!!fc.every} onclick={() => setNarrow({ every: true })}>Every level{fc.every ? ', chosen' : ', off'}</button>
					</div>
				{:else}
					<div class="chips" role="group" aria-label="Which meal">
						<button type="button" class="chip" aria-pressed={!fc.meal} onclick={() => setNarrow({ meal: '' })}>{say('allDay')}{!fc.meal ? ', chosen' : ', off'}</button>
						{#each meals as m (m)}
							<button type="button" class="chip" aria-pressed={fc.meal === m} onclick={() => setNarrow({ meal: m })}>{m}{fc.meal === m ? ', chosen' : ', off'}</button>
						{/each}
					</div>
				{/if}
			</details>
		{/if}
		{#if deckRefs.length}
			<button type="button" class="chip go start" onclick={() => startRun(fc.deck, { meal: fc.meal, every: fc.every })}>Start</button>
		{:else if !today.houseSettled || (fc.deck.startsWith('deck') && !deck)}
			<p class="note">Opening the deck…</p>
		{:else}
			<p class="note">No cards in this deck yet.</p>
		{/if}
	{:else if screen === 'summary' && fc}
		<h1 tabindex="-1">Deck done</h1>
		<p class="note summaryline" role="status">
			{#if fc.again}{fc.got ?? 0} got it, {fc.again} to see again.{:else}{fc.got ?? 0} got it.{/if}
		</p>
		{#if !runRefs.length}<p class="note">No cards in this deck yet.</p>{/if}
		<div class="chips">
			{#if (fc.missed ?? []).length}
				<button type="button" class="chip go" onclick={studyMisses}>Study the misses</button>
			{/if}
			<button type="button" class="chip" onclick={anotherDeck}>Another deck</button>
		</div>
	{:else if screen === 'card' && fc}
		<h1 class="vh-h">{deckName(fc.deck)}</h1>
		{#if missingCard}<p class="note empty" role="status">There is no card with that id. It may have been retired from the deck.</p>{/if}
		{#if !shown && currentRef && ((currentRef.startsWith('c:') && !deck) || (currentRef.startsWith('h:') && !today.houseSettled))}
			<p class="note">Opening the deck…</p>
		{:else}
			<div class="framewrap" bind:this={frameEl}>
			<DeckFrame
				bind:this={frame}
				position="Card {(fc.i ?? 0) + 1} of {runRefs.length} · {deckName(fc.deck)}"
				flipped={!!fc.flipped}
				onFlip={flip}
				onGrade={grade}
			>
				{#snippet face()}
					{#if !shown}
						<div class="flash"><p class="def">This card is no longer in the deck. Grade it either way to move on.</p></div>
					{:else if shown.kind === 'h'}
						{@const c = shown.card}
						{#if !fc.flipped}
							<button type="button" class="hface" onclick={flip}>
								<span class="facename">{c.name}</span>
								<span class="facesay">{say('front')}</span>
							</button>
						{:else}
							<div class="hback" aria-live="polite">
								<p class="backname">{c.name}</p>
								{#if c.back.s10}
									<p class="backhead">{say('ten')}</p>
									<p class="backten">{c.back.s10}</p>
								{/if}
								{#if c.back.price}<p class="backline">{c.back.price}</p>{/if}
								{#each c.back.pairs as [label, text] (label)}
									<p class="backline"><b>{label}:</b> {text}</p>
								{/each}
								{#if c.back.parts.length}
									<details class="backparts" bind:open={partsOpen}>
										<summary>{partsOpen ? say('partsHide') : say('partsShow')}</summary>
										<dl>
											{#each c.back.parts as [label, text] (label)}<dt>{label}</dt><dd>{text}</dd>{/each}
										</dl>
									</details>
								{/if}
								{#if c.back.say}
									<p class="backhead">{say('say')}</p>
									<p class="backline">{c.back.say}</p>
								{/if}
							</div>
						{/if}
					{:else if shown.kind === 'k'}
						<div class="flash kcard">
							<p class="kkind">{COMPONENT_LABELS[compKind.get(shown.card.itemId) ?? 'ingredient']}</p>
							<p class="term">{shown.card.front}</p>
							{#if fc.flipped}
								<p class="def back">{shown.card.back}</p>
							{:else}
								<p class="def">Say it out loud, then flip.</p>
							{/if}
						</div>
					{:else if shown.kind === 's'}
						<div class="flash scard">
							<p class="kkind">{say('deckTastings')}</p>
							<p class="term">{shown.card.front}</p>
							{#if fc.flipped}
								<p class="def back">{shown.card.back}</p>
							{:else}
								<p class="def">Say the course aloud, then flip.</p>
							{/if}
						</div>
					{:else if shown.kind === 'p'}
						<div class="flash pcard">
							<p class="term">{shown.card.front}</p>
							{#if fc.flipped}
								<p class="def back">{shown.card.back}</p>
							{:else}
								<p class="def">Say it out loud, then flip.</p>
							{/if}
						</div>
					{:else if shown.kind === 'c'}
						{#key currentRef + ':' + (fc.i ?? 0)}
							<FloorCard
								card={shown.card}
								frame={deck!.frame}
								levelName={levelNames.get(shown.card.level) ?? ''}
								sectionTitle={titles.get(shown.card.section) ?? ''}
								names={termNames}
								plate={plateOf.get(shown.card.id) ?? null}
								revealed={!!fc.flipped}
								turnButton={false}
								bind:open={layers}
							/>
						{/key}
					{:else}
						<div class="flash tcard">
							{#if shown.entry}
								<p class="term">{shown.entry.term}</p>
								{#if fc.flipped}<p class="def">{shown.entry.definition}</p>{:else}<p class="def">Say what it means, then flip.</p>{/if}
							{:else}
								<p class="def">Opening the Lexicon…</p>
							{/if}
						</div>
					{/if}
				{/snippet}
			</DeckFrame>
			</div>
			<p class="note tally" aria-live="polite">{fc.got ?? 0} got it, {fc.again ?? 0} to see again.</p>
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
	.dueline {
		font-size: var(--t-body);
	}
	.deckline,
	.summaryline {
		font-size: var(--t-body);
	}
	.vh-h {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	.tally {
		margin-top: 10px;
	}
	.framewrap {
		scroll-margin-top: calc(var(--modebar-h, 0px) + var(--backrow-h, 46px) + 4px);
	}
	/* The house card: the whole front one button, the back cut for arm's length
	   (the study view's flash cards, moved here with their art). */
	.hface {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: flex-start;
		gap: 10px;
		width: 100%;
		min-height: 240px;
		padding: 20px 22px;
		text-align: left;
		cursor: pointer;
		border: 1px solid var(--line);
		background: var(--card);
		color: var(--ink);
		border-radius: var(--radius);
		box-shadow: var(--shadow-card);
		font: inherit;
	}
	.hface:hover {
		border-color: var(--turmeric);
	}
	.facename {
		font-family: var(--display);
		font-size: 1.75rem;
		line-height: 1.2;
	}
	.facesay {
		font-size: 1rem;
		color: var(--ink-soft);
	}
	.hback {
		border: 1px solid var(--line);
		background: var(--card);
		border-radius: var(--radius);
		box-shadow: var(--shadow-card);
		padding: 16px 18px;
	}
	.backname {
		font-family: var(--display);
		font-size: 1.4rem;
		margin: 0 0 6px;
	}
	.backhead {
		font-size: 0.9375rem;
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--ink-soft);
		margin: 8px 0 4px;
	}
	.backten {
		font-family: var(--display);
		font-size: 1.25rem;
		line-height: 1.4;
		margin: 0 0 8px;
		border-left: 2px solid var(--turmeric-deep);
		padding-left: 12px;
	}
	.backline {
		font-size: 1.125rem;
		line-height: 1.5;
		margin: 0 0 6px;
	}
	.backparts summary {
		min-height: 44px;
		display: flex;
		align-items: center;
		cursor: pointer;
		font-size: 1rem;
	}
	.backparts dl {
		display: grid;
		grid-template-columns: 8.5em 1fr;
		gap: 4px 12px;
		margin: 0 0 8px;
	}
	.backparts dt {
		font-size: 0.9375rem;
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--ink-soft);
		padding-top: 3px;
	}
	.backparts dd {
		margin: 0;
		font-size: 1.125rem;
		line-height: 1.5;
	}
	.flash {
		border: 1px solid var(--line);
		background: var(--card);
		border-radius: var(--radius);
		padding: 20px 22px;
		margin-top: 10px;
	}
	.flash .term {
		font-family: var(--display);
		font-size: 26px;
		margin-bottom: 6px;
	}
	.flash .def {
		max-width: var(--measure);
		margin-bottom: 6px;
		font-size: var(--t-body);
	}
	.flash .def.back {
		font-size: 18px;
	}
	.flash .kkind {
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
		margin: 0 0 4px;
	}
</style>
