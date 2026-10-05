<!--
  One level (docs/consolidation-design.md 2.6 and 3.6): what to do today, the
  house, a search, and a closed summary of what the level holds.

    the Back control (the layout's), h1 the level's name (named, never
    numbered), the blurb, the word and figure with "Your level"
    Today's study     Due today, Quick quiz, Next reading: three doors, each
                      a name, a line computed from the engines, the row the
                      button. Due today and Quick quiz start at once.
    Cook at home      the training kitchen at this level (lib/kitchen.ts):
                      four tabs, Breakfast, Lunch, Dinner and Dessert, each
                      with its cooked of 25, the next dish to cook as the
                      lead door, then the 25 in order with cuisine, time,
                      difficulty and a cooked mark ("Due again" once a
                      cooked dish is past its re-cook date, and a Cook
                      again door to the most overdue, in the Repertoire's
                      order). The list comes from the
                      precached index; a dish opens /kitchen?d=, whose level
                      file is fetched on demand.
    My restaurant     the house line, the Menu Desk's waiting line, the count
                      line, three study doors, the sections as chips, then
                      the quiet links The Menu Desk and The house
    Search            one box over the house and the app, results inline
    What {Level} holds  a closed details: every subsection with N at this
                      level and its word and figure, each a link to its
                      Library shelf at the level

  The training doors that used to hang off each subsection have new homes:
  Read under Library, every deck under Flashcards, every quiz, test and hands
  on drill under Quizzes (the screen map, design 3.11).

  Opening a level chooses it (whatever you are looking at is what you are
  studying): the Flashcards, Quizzes and Library tabs filter to it, and Home
  marks it Your level.

  The counts are baked in (the load); the items and the figures wait for the
  record (the levels store), the same rule the home follows. Names for the
  Lexicon, the deck and the modules come from small precached files read in
  onMount, for the item lists and for the search.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { bySlug, loadDeckIndex, loadLexicon, loadPalate, loadPlates, loadServiceTrack } from '$lib/data';
	import { levels } from '$lib/stores/levels.svelte';
	import { house } from '$lib/stores/house.svelte';
	import { today } from '$lib/stores/today.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { MEAL_LABEL, PER_MEAL, dishHref, levelProgress, loadKitchenIndex, minutesLabel, cookKey, recooksDue, type KitchenIndex, type Meal } from '$lib/kitchen';
	import { restoreScroll } from '$lib/stores/nav.svelte';
	import { plateTitle } from '$lib/plates';
	import { NEVER_GRADED, MET, type SubsectionProgress } from '$lib/levels';
	import { latestVerdicts, searchElsewhere, searchRows, studyProgress, studyRows, studySections } from '$lib/study';
	import { roomHref } from '$lib/wing-links';
	import { deskShare, readDeskInbox } from '$lib/desk/desk-inbox';
	import { readInName, whenRead } from '$lib/desk/desk-share';
	import HouseBar from '$lib/components/HouseBar.svelte';
	import type { DeckLevel, SubsectionKey } from '$lib/types';
	import type { Snapshot } from './$types';

	let { data } = $props();
	const n = $derived(data.level as DeckLevel);
	const levelName = $derived(data.info.name);

	/** slug -> display name, for the subsections the eager index cannot name */
	let names = $state<Record<string, string>>({});
	/** what the search looks through besides the house */
	type Found = { name: string; href: string; what: string };
	let index = $state<Found[]>([]);
	let deskWaiting = $state<{ dishes: number; readIn: string; when: string } | null>(null);
	let mounted = $state(false);

	onMount(async () => {
		mounted = true;
		void loadKitchenIndex().then((ix) => (kitchenIndex = ix));
		try {
			const m = localStorage.getItem(MEAL_KEY);
			if (m && m in MEAL_LABEL) meal = m as Meal;
		} catch {
			/* a convenience: Breakfast when it cannot be read */
		}
		levels.choose(data.level as DeckLevel);
		void levels.load();
		today.load();
		/* The Menu Desk's waiting line, moved here from the home: the inbox is
		   localStorage, read in onMount and nowhere earlier. Its class, copy and
		   link are kept (tests/menu-desk.spec.ts reads them). */
		const inbox = readDeskInbox();
		if (inbox) {
			const share = deskShare(inbox, 'dish');
			if (share.length) deskWaiting = { dishes: share.length, readIn: readInName(inbox.source.readIn), when: whenRead(inbox.source.at) };
		}
		try {
			const [lexicon, deck, track, palate, plates] = await Promise.all([
				loadLexicon(),
				loadDeckIndex(),
				loadServiceTrack(),
				loadPalate(),
				loadPlates()
			]);
			const map: Record<string, string> = {};
			const found: Found[] = [];
			for (const e of lexicon) {
				map[e.slug] = e.term;
				found.push({ name: e.term, href: `${base}/lexicon#${e.slug}`, what: 'the Lexicon' });
			}
			for (const c of deck.cards) {
				map[c.id] = c.term;
				found.push({ name: c.term, href: `${base}/flashcards?deck=${encodeURIComponent('deck:' + c.section)}&card=${c.id}&run=1`, what: 'a Floor Deck card' });
			}
			for (const m of track.modules) {
				map[m.key] = m.title;
				found.push({ name: m.title, href: `${base}/service/${m.key}`, what: 'a service module' });
			}
			for (const f of palate.faults) map[f.slug] = f.label;
			for (const p of plates.plates) {
				map[p.slug] = plateTitle(p);
				found.push({ name: plateTitle(p), href: `${base}/plates/${p.slug}`, what: 'a plate' });
			}
			names = map;
			await levels.load();
			for (const [slug, label] of techniqueLabels()) found.push({ name: label, href: `${base}/technique/${slug}`, what: 'a technique' });
			index = found;
		} catch {
			/* the page still holds Today's study and the house; names fall back to slugs */
		}
	});

	function techniqueLabels(): Array<[string, string]> {
		const out: Array<[string, string]> = [];
		const all = levels.data?.items.techniques ?? {};
		for (const list of Object.values(all)) for (const slug of list) out.push([slug, levels.techniqueLabel(slug)]);
		return out;
	}

	const row = $derived(levels.progress.find((r) => r.level === n) ?? null);
	const chosenHere = $derived(mounted && levels.chosen === n);

	/* ---- Today's study ---- */
	const due = $derived(today.at(n));
	const dueHref = $derived(due && due.total === 0 ? `${base}/quizzes?quick=1` : `${base}/flashcards?deck=due&run=1`);
	const current = $derived(house.current);
	const rows = $derived(current ? studyRows(current, 'dish') : []);
	const quickLine = $derived(current && rows.length ? `Ten questions: five from the menu, five from ${levelName}.` : `Ten questions from ${levelName}.`);

	const SAFETY_ID: Record<string, string> = { clause: 'disciplines', fact: 'entries', numeric: 'numbers', gap: 'gaps' };
	const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

	/** The next thing to read: the first primed subsection not yet met, else the first unmet technique, else the Library. */
	const nextReading = $derived.by(() => {
		if (!row) return null;
		for (const s of data.subsections) {
			const p = row.subsections.find((x) => x.key === s.key);
			if (data.primed.includes(s.key) && p && p.label !== MET) {
				return { title: `${s.title} · ${levelName}`, href: `${base}/level/${n}/read#${s.key}` };
			}
		}
		const t = row.subsections.find((x) => x.key === 'techniques');
		const slug = t?.items.find((s) => !t.metSet.has(s));
		if (slug) return { title: `${levels.techniqueLabel(slug)} · ${levelName}`, href: `${base}/technique/${slug}` };
		return { title: `Everything at ${levelName} is read. The Library holds the rest.`, href: `${base}/library` };
	});

	/* ---- Cook at home ---- */
	/** The meal tab last chosen, per device: a convenience, never exported. */
	const MEAL_KEY = 'oot-kitchen-meal-v1';
	let kitchenIndex = $state<KitchenIndex | null>(null);
	let meal = $state<Meal>('breakfast');
	const kitchen = $derived(kitchenIndex ? levelProgress(kitchenIndex, n, session.cookedDishes) : []);
	const mealNow = $derived(kitchen.find((m) => m.meal === meal) ?? null);
	/* The meal's re-cooks, most overdue first, in the Repertoire's own order:
	   a cooked dish past due reads "Due again" in the list, and the first is
	   the re-cook door's. Date.now() inside the derivation, as the Repertoire
	   does: only a cook can move a dish between states while the page is open. */
	const recooks = $derived(mealNow ? recooksDue(mealNow.rows, session.cookedLog, Date.now()) : []);
	const dueAgain = $derived(new Set(recooks.map((r) => r.slug)));
	function chooseMeal(m: Meal, focus = false) {
		meal = m;
		try {
			localStorage.setItem(MEAL_KEY, m);
		} catch {
			/* the tab still changes */
		}
		if (focus) document.getElementById(`kt-${m}`)?.focus();
	}
	function onMealKey(e: KeyboardEvent) {
		const order = kitchen.map((k) => k.meal);
		const i = order.indexOf(meal);
		let to = -1;
		if (e.key === 'ArrowRight') to = (i + 1) % order.length;
		else if (e.key === 'ArrowLeft') to = (i - 1 + order.length) % order.length;
		else if (e.key === 'Home') to = 0;
		else if (e.key === 'End') to = order.length - 1;
		else return;
		e.preventDefault();
		chooseMeal(order[to], true);
	}

	/* ---- My restaurant ---- */
	const sections = $derived(studySections(rows));
	const progress = $derived(current ? studyProgress(rows.map((r) => r.id), latestVerdicts(current.id, today.drilled)) : null);
	const countLine = $derived.by(() => {
		if (!current || !progress) return '';
		const head = `${current.name}: ${rows.length} ${rows.length === 1 ? 'dish' : 'dishes'} in ${sections.length} ${sections.length === 1 ? 'section' : 'sections'}.`;
		if (!progress.studied) return `${head} Nothing studied yet.`;
		return progress.again ? `${head} ${progress.studied} studied, ${progress.again} to see again.` : `${head} ${progress.studied} studied.`;
	});

	/* ---- Search ---- */
	let q = $state('');
	const fromMenu = $derived(current && q.trim() ? searchRows(current, rows, q).slice(0, 8) : []);
	const elsewhere = $derived.by(() => {
		if (!current || !q.trim()) return [] as Found[];
		return searchElsewhere(current, 'dish', q)
			.map((x) => {
				const room = x.kind === 'wine' ? 'codex' : 'ledger';
				const href = roomHref(room, x.id, base, current);
				return href ? { name: x.name, href, what: x.kind === 'wine' ? 'on the wine list' : 'on the bar' } : null;
			})
			.filter((x): x is Found => !!x);
	});
	const inApp = $derived.by(() => {
		const t = q.trim().toLowerCase();
		if (t.length < 2) return [] as Found[];
		const starts: Found[] = [];
		const has: Found[] = [];
		for (const f of index) {
			const nm = f.name.toLowerCase();
			if (nm.startsWith(t)) starts.push(f);
			else if (nm.includes(t)) has.push(f);
			if (starts.length >= 8) break;
		}
		return [...starts, ...has].slice(0, 8);
	});

	/* ---- What the level holds ---- */
	let holdsOpen = $state(false);

	function nameOf(key: SubsectionKey, slug: string): string {
		switch (key) {
			case 'dishes':
				return bySlug.get(slug)?.name ?? slug;
			case 'techniques':
				return levels.techniqueLabel(slug);
			case 'safety':
				return levels.data?.safety[slug]?.label ?? slug;
			case 'palate': {
				const at = slug.indexOf('@');
				return at < 0 ? (names[slug] ?? cap(slug)) : `${cap(slug.slice(0, at))}, rung ${slug.slice(at + 1)}`;
			}
			default:
				return names[slug] ?? slug;
		}
	}

	function hrefOf(key: SubsectionKey, slug: string): string {
		switch (key) {
			case 'dishes':
				return `${base}/recipe/${slug}`;
			case 'techniques':
				return `${base}/technique/${slug}`;
			case 'lexicon':
				return `${base}/lexicon#${slug}`;
			case 'deck':
				return `${base}/flashcards?deck=${encodeURIComponent('deck:' + (slugSection(slug) || ''))}&card=${slug}&run=1`;
			case 'plates':
				return `${base}/plates/${slug}`;
			case 'palate':
				return slug.includes('@') ? `${base}/practise/calibrate` : `${base}/palate`;
			case 'safety':
				return `${base}/safety#${SAFETY_ID[levels.data?.safety[slug]?.kind ?? 'clause']}`;
			case 'service':
				return `${base}/service/${slug}`;
		}
	}

	/* The deck card's section, from the search index once it is in. */
	let sectionOf = $state<Record<string, string>>({});
	onMount(async () => {
		try {
			const deck = await loadDeckIndex();
			sectionOf = Object.fromEntries(deck.cards.map((c) => [c.id, c.section]));
		} catch {
			/* the link opens the whole deck at that card */
		}
	});
	const slugSection = (id: string) => sectionOf[id] ?? '';

	/** Each subsection's shelf in the Library, at this level. */
	const difficulty = $derived(n === 1 ? 1 : n === 2 ? 2 : 3);
	function shelfOf(key: SubsectionKey): string {
		switch (key) {
			case 'dishes':
				return `${base}/recipes?diff=${difficulty}`;
			case 'techniques':
				return `${base}/technique?level=${n}`;
			case 'lexicon':
				return `${base}/lexicon?level=${n}`;
			case 'deck':
				return `${base}/service/deck`;
			case 'plates':
				return `${base}/plates`;
			case 'palate':
				return `${base}/palate`;
			case 'safety':
				return `${base}/safety`;
			case 'service':
				return `${base}/service`;
		}
	}

	function rowsOf(p: SubsectionProgress): Array<{ slug: string; met: boolean; note?: string }> {
		if (p.key === 'palate') return p.units.map((u) => ({ slug: u, met: p.metSet.has(u) }));
		if (p.key === 'service') {
			return p.items.map((m) => {
				const terms = levels.data?.moduleTerms[m] ?? [];
				const met = terms.filter((t) => p.metSet.has(t)).length;
				return { slug: m, met: terms.length > 0 && met === terms.length, note: `${met} of ${terms.length} met` };
			});
		}
		return p.items.map((s) => ({ slug: s, met: p.metSet.has(s) }));
	}

	/* Back to this page lands where it was left, once the record has drawn it. */
	export const snapshot: Snapshot<{ y: number; q: string; open: boolean; meal?: Meal }> = {
		capture: () => ({ y: typeof window === 'undefined' ? 0 : window.scrollY, q, open: holdsOpen, meal }),
		restore: (v) => {
			q = v.q ?? '';
			holdsOpen = !!v.open;
			if (v.meal && v.meal in MEAL_LABEL) meal = v.meal;
			restoreScroll(v.y ?? 0, () => levels.ready && today.ready);
		}
	};
</script>

<svelte:head><title>{data.info.name} · The World Table</title></svelte:head>

<div class="shell hub levelpage">
	<h1 tabindex="-1">{data.info.name}</h1>
	<p class="lede">{data.info.blurb}</p>
	<!-- One expression for the word and the figure: Svelte trims the space at
	     a block's edge, which once printed "Untouched· Your level". -->
	<p class="stat" aria-live="polite">
		{row ? row.label : 'Reading your record…'}{chosenHere ? ' · ' : ''}{#if chosenHere}<span class="lv-here">Your level</span>{/if}
	</p>

	<h2 class="group" id="today">Today's study</h2>
	<nav class="quiet" aria-labelledby="today">
		<a class="door lead" href={dueHref} data-door="due">
			<span class="door-name">Due today</span>
			<span class="door-line">{due ? due.line : 'Reading your record…'}</span>
		</a>
		<a class="door" href="{base}/quizzes?quick=1" data-door="quick">
			<span class="door-name">Quick quiz</span>
			<span class="door-line">{quickLine}</span>
		</a>
		<a class="door" href={nextReading?.href ?? `${base}/level/${n}/read`} data-door="next">
			<span class="door-name">Next reading</span>
			<span class="door-line">{nextReading ? nextReading.title : 'Reading your record…'}</span>
		</a>
	</nav>

	<h2 class="group" id="kitchen">Cook at home</h2>
	<p class="note kitchenlede">Twenty five each of breakfast, lunch, dinner and dessert at {levelName}, to cook in your own kitchen, step by step.</p>
	{#if kitchen.length}
		<div class="mealtabs" role="tablist" aria-label="Cook at home: the meals" tabindex="-1" onkeydown={onMealKey}>
			{#each kitchen as k (k.meal)}
				<button
					type="button"
					role="tab"
					id="kt-{k.meal}"
					aria-selected={meal === k.meal}
					aria-controls="kp"
					tabindex={meal === k.meal ? 0 : -1}
					class:on={meal === k.meal}
					onclick={() => chooseMeal(k.meal)}
				>
					<span class="tname">{MEAL_LABEL[k.meal]}</span>
					<span class="tcount">{session.ready ? `${k.cooked} of ${k.total}` : `${k.total}`}</span>
				</button>
			{/each}
		</div>
		{#if mealNow}
			<div class="mealpanel" role="tabpanel" id="kp" aria-labelledby="kt-{mealNow.meal}">
				<p class="kprogress">
					{session.ready ? `${mealNow.cooked} of ${mealNow.total} ${MEAL_LABEL[mealNow.meal].toLowerCase()} dishes cooked at ${levelName}.` : 'Reading your record…'}
				</p>
				{#if mealNow.next}
					<nav class="quiet" aria-label="Cook next">
						<a class="door lead" href={dishHref(base, mealNow.next)} data-door="kitchen-next">
							<span class="door-name">Cook next · {MEAL_LABEL[mealNow.meal]} {mealNow.next.n} of {PER_MEAL}</span>
							<span class="door-line">{mealNow.next.title}</span>
							<span class="door-sub">{mealNow.next.cuisine} · {minutesLabel(mealNow.next.total)} · {mealNow.next.difficulty}</span>
						</a>
					</nav>
				{/if}
				{#if recooks.length}
					{@const r = recooks[0]}
					<nav class="quiet" aria-label="Cook again">
						<a class="door" class:lead={!mealNow.next} href={dishHref(base, r)} data-door="kitchen-recook">
							<span class="door-name">Cook again · {recooks.length === 1 ? 'due a re-cook' : `the most overdue of ${recooks.length} due`}</span>
							<span class="door-line">{r.title}</span>
							<span class="door-sub">{r.cuisine} · {minutesLabel(r.total)} · {r.difficulty}</span>
						</a>
					</nav>
				{/if}
				{#if !mealNow.next}
					<p class="note">
						Every {MEAL_LABEL[mealNow.meal].toLowerCase()} dish at {levelName} is cooked.
						{recooks.length ? 'The ones due again are marked in the list.' : 'None is due again yet; each comes back as it falls due.'}
					</p>
				{/if}
				<ol class="kdishes">
					{#each mealNow.rows as r (r.slug)}
						{@const done = session.cookedDishes.has(cookKey(r.slug))}
						<li>
							<a href={dishHref(base, r)}>
								<span class="kn" aria-hidden="true">{r.n}</span>
								<span class="kbody">
									<span class="kt">{r.title}</span>
									<span class="km">{r.cuisine} · {minutesLabel(r.total)} · {r.difficulty}</span>
								</span>
								{#if dueAgain.has(r.slug)}<span class="met due">Due again</span>{:else if done}<span class="met">Cooked</span>{/if}
							</a>
						</li>
					{/each}
				</ol>
				<p class="quietlinks"><a href="{base}/kitchen">The whole course, all four levels</a></p>
			</div>
		{/if}
	{:else}
		<p class="note">Reading the course…</p>
	{/if}

	<h2 class="group" id="restaurant">My restaurant</h2>
	<div class="house">
		<HouseBar />
	</div>
	{#if deskWaiting}
		<p class="deskline">
			<b
				>{deskWaiting.dishes}
				{deskWaiting.dishes === 1 ? 'dish' : 'dishes'} from the Menu Desk
				{deskWaiting.dishes === 1 ? 'is' : 'are'} waiting.</b
			>
			Read {deskWaiting.readIn}, {deskWaiting.when}.
			<a class="chip" href="{base}/menu#desk">Look them over</a>
		</p>
	{/if}
	{#if current && rows.length}
		<p class="note countline">{countLine}</p>
		<nav class="quiet" aria-labelledby="restaurant">
			<a class="door" href="{base}/menu" data-door="study">
				<span class="door-name">Study the whole menu</span>
				<span class="door-line">Every dish, its lines, its pairing and its parts, section by section.</span>
			</a>
			<a class="door" href="{base}/flashcards?deck=menu" data-door="menu-cards">
				<span class="door-name">Flashcards for the menu</span>
				<span class="door-line">One card per dish: the name on the front, the ten second line on the back.</span>
			</a>
			<a class="door" href="{base}/menu/quiz?mode=drill" data-door="menu-drill">
				<span class="door-name">Drill the menu</span>
				<span class="door-line">Mixed questions from every section, ten at a time.</span>
			</a>
		</nav>
		<nav class="chips sections" aria-label="The menu's sections">
			{#each sections as s (s.section)}
				<a class="chip" href="{base}/menu?section={encodeURIComponent(s.section)}">{s.section} {s.count}</a>
			{/each}
		</nav>
		<p class="quietlinks">
			<a href="{base}/menu#desk">The Menu Desk</a>
			<a href="{base}/menu#house">The house</a>
		</p>
	{:else}
		<p class="note">No restaurant on this device yet. Start one or import a pack with the house doors above, or read a menu in on the Menu Desk.</p>
		<p class="quietlinks">
			<a href="{base}/menu#desk">The Menu Desk</a>
		</p>
	{/if}

	<h2 class="group" id="search-h">Search</h2>
	<div class="search">
		<label class="searchlabel" for="lv-q">Search the menu and the app</label>
		<input id="lv-q" type="search" placeholder="A dish, a word, a technique" autocomplete="off" bind:value={q} />
		{#if q.trim()}
			<div class="results" aria-live="polite">
				{#if fromMenu.length || elsewhere.length}
					<h3 class="rhead">From the menu</h3>
					<ul class="found">
						{#each fromMenu as r (r.id)}<li><a href="{base}/menu#{r.id}">{r.name}</a> <span class="what">{r.section}</span></li>{/each}
						{#each elsewhere as f (f.href)}<li><a href={f.href}>{f.name}</a> <span class="what">{f.what}</span></li>{/each}
					</ul>
				{/if}
				{#if inApp.length}
					<h3 class="rhead">In the app</h3>
					<ul class="found">
						{#each inApp as f (f.href)}<li><a href={f.href}>{f.name}</a> <span class="what">{f.what}</span></li>{/each}
					</ul>
				{/if}
				{#if !fromMenu.length && !elsewhere.length && !inApp.length}
					<p class="note">Nothing found for "{q.trim()}".</p>
				{/if}
				<p class="quietlinks"><a href="{base}/recipes?q={encodeURIComponent(q.trim())}">Search all recipes for "{q.trim()}"</a></p>
			</div>
		{/if}
	</div>

	<details class="holds" bind:open={holdsOpen}>
		<summary>{holdsOpen ? 'Hide' : 'Show'} what {data.info.name} holds</summary>
		<ol class="subsections">
			{#each data.subsections as s (s.key)}
				{@const p = row?.subsections.find((x) => x.key === s.key) ?? null}
				{@const total = data.counts[s.key]}
				<li class="subsection" id={s.key}>
					<h3><a href={shelfOf(s.key)}>{s.title}</a></h3>
					<p class="line">
						{total} at this level
						{#if !s.counted}
							· {NEVER_GRADED}
						{:else if p}
							· {p.label}
						{/if}
						{#if s.key === 'plates' && total === 0}
							· every plate is read at the levels below; read them again for the menu
						{/if}
					</p>
					{#if p && p.items.length}
						<details class="items">
							<summary>{s.key === 'service' ? 'The modules' : s.key === 'palate' ? 'The faults and the tastes' : s.key === 'plates' ? 'The plates' : 'The items'}</summary>
							<ul>
								{#each rowsOf(p) as r (r.slug)}
									<li>
										<a href={hrefOf(s.key, r.slug)}>{nameOf(s.key, r.slug)}</a>
										{#if r.note}<span class="itemnote">{r.note}</span>{/if}
										{#if r.met}<span class="met">met</span>{/if}
									</li>
								{/each}
							</ul>
						</details>
					{/if}
				</li>
			{/each}
		</ol>
	</details>
</div>

<style>
	.stat {
		margin-top: 8px;
		font-size: 1rem;
		color: var(--ink-soft);
		font-variant-numeric: tabular-nums;
	}
	.lv-here {
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		font-size: 0.9375rem;
		color: var(--turmeric-deep);
	}
	/* ---- Cook at home ---- */
	.kitchenlede {
		margin-top: 0;
	}
	.mealtabs {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 6px;
		margin: 10px 0 0;
		max-width: 720px;
	}
	.mealtabs button {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		min-height: 56px;
		padding: 6px 4px;
		border: var(--rule, 1px) solid var(--house-frame, var(--line));
		border-radius: var(--radius);
		background: var(--card);
		color: var(--ink);
		font: inherit;
		cursor: pointer;
	}
	.mealtabs button.on {
		border-color: var(--turmeric-deep);
		box-shadow: inset 0 -3px 0 var(--turmeric-deep);
	}
	.mealtabs button:focus-visible {
		outline: 2px solid var(--turmeric-deep);
		outline-offset: 2px;
	}
	.tname {
		font-family: var(--house-display, var(--display));
		font-size: 1rem;
		color: var(--turmeric-deep);
	}
	.tcount {
		font-size: 0.9375rem;
		color: var(--ink-soft);
		font-variant-numeric: tabular-nums;
	}
	.mealpanel {
		max-width: 720px;
	}
	/* Nothing on the level page computes under 15 px (design 2.9), and
	   Breakfast in the display face does not fit a quarter of a phone at
	   that size: the four tabs go two by two there. */
	@media (max-width: 559px) {
		.mealtabs {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.mealtabs button {
			flex-direction: row;
			justify-content: space-between;
			min-height: 48px;
			padding: 6px 12px;
		}
	}
	.kprogress {
		margin: 12px 0 0;
		font-size: 1rem;
		color: var(--ink-soft);
	}
	.kdishes {
		list-style: none;
		margin: 14px 0 0;
		padding: 0;
		border-top: 1px solid var(--line);
	}
	.kdishes a {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 56px;
		padding: 8px 2px;
		border-bottom: 1px solid var(--line);
		color: var(--ink);
		text-decoration: none;
	}
	.kdishes a:hover .kt {
		text-decoration: underline;
		text-underline-offset: 4px;
	}
	.kn {
		flex: none;
		width: 2ch;
		text-align: right;
		font-family: var(--display);
		color: var(--turmeric-deep);
		font-variant-numeric: tabular-nums;
	}
	.kbody {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
		min-width: 0;
	}
	.kt {
		font-size: 1.0625rem;
		line-height: 1.35;
	}
	.km {
		font-size: 0.9375rem;
		color: var(--ink-soft);
	}
	.kdishes .met {
		flex: none;
		margin-left: 0;
	}
	.kdishes .met.due {
		color: var(--turmeric-deep);
	}
	.house :global(.housebar) {
		margin: 0;
	}
	.deskline {
		margin: 10px 0 0;
		font-size: 1rem;
		color: var(--ink-soft);
	}
	.deskline a {
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		margin-left: 4px;
	}
	.countline {
		margin-top: 12px;
	}
	.sections {
		margin-top: 14px;
	}
	.search {
		max-width: var(--measure);
	}
	.searchlabel {
		display: block;
		font-size: 1rem;
		color: var(--ink-soft);
		margin-bottom: 6px;
	}
	.search input {
		width: 100%;
		min-height: 48px;
		padding: 8px 12px;
		font: inherit;
		font-size: 1.0625rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--card);
		color: var(--ink);
		box-sizing: border-box;
	}
	.rhead {
		font-family: var(--display);
		font-size: 1.125rem;
		margin: 16px 0 4px;
	}
	.found {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.found li {
		font-size: 1.0625rem;
		line-height: 1.4;
	}
	.found a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		color: var(--ink);
	}
	.what {
		color: var(--ink-soft);
		font-size: 1rem;
		margin-left: 6px;
	}
	details.holds {
		margin-top: 30px;
		border-top: 1px solid var(--line);
		padding-top: 6px;
	}
	.subsections {
		list-style: none;
		margin: 6px 0 0;
		padding: 0;
	}
	.subsection {
		padding: 12px 0;
		border-top: 1px solid var(--line);
	}
	.subsection h3 {
		font-family: var(--display);
		font-size: var(--t-h4);
		margin: 0 0 2px;
	}
	.subsection h3 a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		color: var(--ink);
	}
	.line {
		font-size: 1rem;
		color: var(--ink-soft);
		font-variant-numeric: tabular-nums;
	}
	.items summary {
		cursor: pointer;
		min-height: 44px;
		display: flex;
		align-items: center;
		font-size: 1rem;
		color: var(--ink-soft);
	}
	.items ul {
		list-style: none;
		margin: 0;
		padding: 0 0 6px;
		columns: 2;
		column-gap: var(--gap);
	}
	.items li {
		break-inside: avoid;
		font-size: 1rem;
		line-height: 1.4;
	}
	.items li a {
		display: inline-block;
		padding-block: 10px;
		color: var(--ink);
	}
	.itemnote {
		color: var(--ink-soft);
		margin-left: 6px;
	}
	.met {
		margin-left: 6px;
		font-size: 0.9375rem;
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--leaf);
	}
	@media (max-width: 639px) {
		.items ul {
			columns: 1;
		}
	}
</style>
