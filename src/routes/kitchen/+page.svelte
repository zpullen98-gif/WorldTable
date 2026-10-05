<!--
  Cook at home (src/lib/kitchen.ts): a training dish laid out for the stove,
  or, with no dish named, the course overview.

    /kitchen?d=<slug>&level=<n>   one dish: what it is and what it teaches;
                                  serves, time and difficulty; the tools row
                                  (US or metric, remembered per device;
                                  cook mode); equipment; ingredients; the mise
                                  en place as a checklist; the timeline; the
                                  method one step at a time or all of it,
                                  each step with what to look for and, behind
                                  a disclosure, the usual mistake and its fix;
                                  why it works; plating; the pairing (and its
                                  Brennan's link where the house holds it);
                                  variations; safety; the film; the Library
                                  recipe and the techniques it practises; the
                                  cook's own record (rate it in words, notes,
                                  the re-cook line); the next dish
    /kitchen                      the four levels, each meal's cooked of 25

  One prerendered page for all 400 (see +page.ts). The dish comes from its
  level's file, fetched on demand and kept by the worker; the index that
  names every dish is a precached chunk. The query is read after each
  navigation, never in load, and a link from one dish to the next is an
  ordinary push, so Back walks back through the dishes and then to the level
  page (lib/nav.ts parentOf).

  A cook is recorded in the session's cookedLog under kitchen:<slug>, so it
  counts as cooking everywhere and comes back on the repertoire's ladder; the
  word a cook picks is the grade that moves it.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { bySlug, recipeHref, loadTechniques } from '$lib/data';
	import { session } from '$lib/stores/session.svelte';
	import { prefs } from '$lib/stores/prefs.svelte';
	import { house } from '$lib/stores/house.svelte';
	import { restoreScroll } from '$lib/stores/nav.svelte';
	import { repertoire } from '$lib/repertoire';
	import { roomHref, wingInstalled } from '$lib/wing-links';
	import { sharedOrigin } from '$lib/desk/desk-share';
	import CookMode from '$lib/components/CookMode.svelte';
	import {
		MEAL_LABEL,
		PER_MEAL,
		RATINGS,
		brennansParts,
		cookKey,
		courseProgress,
		dishHref,
		foldName,
		levelProgress,
		loadKitchenIndex,
		loadKitchenLevel,
		minutesLabel,
		nextInMeal,
		recookLine,
		stepSeconds,
		videoSearchUrl,
		type KitchenDish,
		type KitchenIndex
	} from '$lib/kitchen';
	import type { Grade } from '$lib/repertoire';
	import type { Snapshot } from './$types';

	let { data } = $props();
	const levelName = (n: number) => data.levelInfo.find((l) => l.level === n)?.name ?? '';

	/* ---- what the address asks for ---- */
	let slug = $state('');
	let askedLevel = $state(0);
	let mounted = $state(false);

	let index = $state<KitchenIndex | null>(null);
	let dish = $state<KitchenDish | null>(null);
	let failed = $state('');
	let loading = $state(false);

	/** The technique labels, for the links to the techniques a dish practises. */
	let techLabels = $state<Record<string, string>>({});

	let roomsOpen = $state({ codex: false, ledger: false });

	function readAddress() {
		const q = new URLSearchParams(location.search);
		slug = (q.get('d') ?? '').trim();
		const lv = q.get('level') ?? '';
		askedLevel = /^[1-4]$/.test(lv) ? Number(lv) : 0;
	}

	async function open() {
		failed = '';
		if (!slug) {
			dish = null;
			return;
		}
		const ix = index ?? (await loadKitchenIndex());
		index = ix;
		const row = ix.dishes.find((d) => d.slug === slug);
		if (!row) {
			dish = null;
			failed = 'missing';
			return;
		}
		if (dish?.slug === slug) return;
		loading = true;
		try {
			const file = await loadKitchenLevel(row.level, base);
			const found = file.dishes.find((d) => d.slug === slug) ?? null;
			if (slug !== row.slug) return; /* the address moved on while this loaded */
			dish = found;
			if (!found) failed = 'missing';
			resetDishState();
		} catch {
			dish = null;
			failed = 'offline';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		mounted = true;
		void loadKitchenIndex().then((ix) => (index = ix));
		void loadTechniques()
			.then((all) => (techLabels = Object.fromEntries(all.map((t) => [t.slug, t.label]))))
			.catch(() => {
				/* the links fall back to the slug's words */
			});
		if (sharedOrigin(base)) {
			const up = typeof navigator === 'undefined' || navigator.onLine !== false;
			if (up) roomsOpen = { codex: true, ledger: true };
			else
				void Promise.all([wingInstalled('codex'), wingInstalled('ledger')]).then(([codex, ledger]) => {
					roomsOpen = { codex, ledger };
				});
		}
	});

	afterNavigate(() => {
		const before = slug;
		readAddress();
		if (slug !== before || !dish) void open();
	});

	/* ---- the dish's own state ---- */
	let oneAtATime = $state(false);
	let stepAt = $state(0);
	let miseDone = $state<boolean[]>([]);
	let cooking = $state(false);

	/** A step a snapshot asked for, applied once the dish it belongs to has drawn. */
	let pendingStep: number | null = null;
	function resetDishState() {
		stepAt = dish && pendingStep !== null ? Math.min(pendingStep, dish.steps.length - 1) : 0;
		pendingStep = null;
		miseDone = dish ? dish.mise.map(() => false) : [];
	}

	const key = $derived(dish ? cookKey(dish.slug) : '');
	const row = $derived(index && slug ? (index.dishes.find((d) => d.slug === slug) ?? null) : null);
	const lv = $derived(dish?.level ?? row?.level ?? askedLevel);
	const metric = $derived(prefs.units === 'metric');
	const entry = $derived.by(() => {
		if (!key) return undefined;
		return repertoire(session.cookedLog.filter((e) => e.slug === key), Date.now()).find((e) => e.slug === key);
	});
	const record = $derived(recookLine(entry, Date.now()));
	const next = $derived(index && dish ? nextInMeal(index, dish.slug) : null);

	const titleOf = (s: string) => index?.dishes.find((d) => d.slug === s) ?? null;
	const library = $derived(dish?.libraryRef ? (bySlug.get(dish.libraryRef) ?? null) : null);

	/* The Brennan's link: drawn as a link only when the house on this device
	   holds the item by its exact name (a dish on the menu, a cocktail on the
	   bar, a wine on the list), in words otherwise. */
	const brennans = $derived.by(() => {
		const parts = dish ? brennansParts(dish.pairing.brennans) : null;
		if (!parts) return null;
		const h = house.current;
		const want = foldName(parts.name);
		let href = '';
		let where = '';
		if (h) {
			const d = h.dishes.find((x) => foldName(x.name) === want);
			const c = h.cocktails.find((x) => foldName(x.name) === want);
			const w = h.wines.find((x) => foldName(x.name) === want);
			if (d) {
				href = `${base}/menu#${d.id}`;
				where = 'on the menu';
			} else if (c && roomsOpen.ledger) {
				href = roomHref('ledger', c.id, base, h);
				where = 'in the Ledger';
			} else if (w && roomsOpen.codex) {
				href = roomHref('codex', w.id, base, h);
				where = 'in the Codex';
			}
		}
		return { ...parts, href, where };
	});

	/* ---- marking it cooked ---- */
	let lastWord = $state('');
	function rate(g: Grade) {
		if (!key) return;
		session.markCooked(key, g);
		lastWord = RATINGS.find((r) => r.grade === g)?.word ?? '';
	}
	function undoLast() {
		if (key && session.hasCooked(key)) {
			session.toggleCooked(key);
			lastWord = '';
		}
	}

	/* ---- the overview ---- */
	const course = $derived(index ? courseProgress(index, session.cookedDishes) : []);
	const perLevel = $derived(index ? [1, 2, 3, 4].map((n) => ({ level: n, meals: levelProgress(index!, n, session.cookedDishes) })) : []);

	/* Back to a dish lands where it was left, on the same step. */
	export const snapshot: Snapshot<{ y: number; one: boolean; at: number }> = {
		capture: () => ({ y: typeof window === 'undefined' ? 0 : window.scrollY, one: oneAtATime, at: stepAt }),
		restore: (v) => {
			oneAtATime = !!v.one;
			const at = Math.max(0, Number(v.at) || 0);
			if (dish && dish.slug === slug) stepAt = Math.min(at, dish.steps.length - 1);
			else pendingStep = at;
			restoreScroll(v.y ?? 0, () => !slug || !!dish || !!failed);
		}
	};
</script>

<svelte:head>
	<title>{dish ? `${dish.title} · Cook at home` : 'Cook at home'} · The World Table</title>
</svelte:head>

{#if !mounted || (slug && !dish && !failed)}
	<div class="shell hub kitchen">
		<h1 tabindex="-1">Cook at home</h1>
		<p class="note" aria-live="polite">{slug ? 'Fetching the dish…' : 'Reading the course…'}</p>
	</div>
{:else if failed}
	<div class="shell hub kitchen">
		<h1 tabindex="-1">Cook at home</h1>
		{#if failed === 'offline'}
			<p class="note">
				This level's dishes have not been opened on this device yet, and there is no signal to fetch them. Open
				the level once with a signal and every one of its dishes cooks offline after.
			</p>
			<p class="quietlinks"><button type="button" onclick={() => void open()}>Try again</button></p>
		{:else}
			<p class="note">No dish by that name in the course. It may have been renamed.</p>
		{/if}
		<p class="quietlinks"><a href="{base}/level/{askedLevel || 1}#kitchen">Cook at home on the level page</a></p>
	</div>
{:else if dish}
	<article class="shell kitchen dish">
		<header class="head">
			<p class="eyebrow">{levelName(dish.level)} · {MEAL_LABEL[dish.meal]} · {dish.n} of {PER_MEAL} · {dish.cuisine}</p>
			<h1 tabindex="-1">{dish.title}</h1>
			<ul class="stats">
				<li>Serves {dish.serves}</li>
				<li>{minutesLabel(dish.time.active)} hands on</li>
				<li>{minutesLabel(dish.time.total)} in all</li>
				<li>{dish.difficulty}</li>
				{#if entry}<li class="done">Cooked</li>{/if}
			</ul>
			<p class="summary">{dish.summary}</p>
			<div class="skillrow">
				<p class="label">What it teaches</p>
				<ul class="skills">
					{#each dish.skills as s (s)}<li>{s}</li>{/each}
				</ul>
			</div>
			{#if dish.buildsOn.length}
				<div class="skillrow">
					<p class="label">Builds on</p>
					<ul class="builds">
						{#each dish.buildsOn as b (b)}
							{@const r = titleOf(b)}
							{#if r}<li><a href={dishHref(base, r)}>{r.title}</a></li>{/if}
						{/each}
					</ul>
				</div>
			{/if}
		</header>

		<div class="tools" data-print="hide">
			<div class="group" role="group" aria-label="Units">
				<button class:on={!metric} aria-pressed={!metric} onclick={() => prefs.setUnits('us')}>US</button>
				<button class:on={metric} aria-pressed={metric} onclick={() => prefs.setUnits('metric')}>Metric</button>
			</div>
			<button class="chip go" onclick={() => (cooking = true)}>Cook mode</button>
		</div>

		<div class="cols">
			<section aria-labelledby="k-ing">
				<h2 class="sec" id="k-ing">Ingredients</h2>
				<ul class="ingredients">
					{#each dish.ingredients as g, i (i)}
						<li>
							<span class="qty">{metric ? g.metric : g.us}</span>
							<span class="item">{g.item}</span>
							{#if g.note}<span class="inote">{g.note}</span>{/if}
						</li>
					{/each}
				</ul>
				<h2 class="sec">Equipment</h2>
				<ul class="plain">
					{#each dish.equipment as e (e)}<li>{e}</li>{/each}
				</ul>
				<h2 class="sec" id="k-mise">Mise en place</h2>
				<p class="hint">Everything ready before the heat goes on. Tick as you go.</p>
				<ul class="mise" aria-labelledby="k-mise">
					{#each dish.mise as m, i (i)}
						<li>
							<label class:ticked={miseDone[i]}>
								<input type="checkbox" bind:checked={miseDone[i]} />
								<span>{m}</span>
							</label>
						</li>
					{/each}
				</ul>
				<h2 class="sec">The timeline</h2>
				<ol class="timeline">
					{#each dish.timeline as t, i (i)}
						<li><span class="at">{t.at}</span> <span>{t.do}</span></li>
					{/each}
				</ol>
			</section>

			<section aria-labelledby="k-method">
				<div class="methodhead">
					<h2 class="sec" id="k-method">Method</h2>
					<div class="group" role="group" aria-label="How to show the method" data-print="hide">
						<button class:on={!oneAtATime} aria-pressed={!oneAtATime} onclick={() => (oneAtATime = false)}>All steps</button>
						<button class:on={oneAtATime} aria-pressed={oneAtATime} onclick={() => (oneAtATime = true)}>One at a time</button>
					</div>
				</div>
				{#if oneAtATime}
					{@const s = dish.steps[stepAt]}
					<div class="onestep" aria-live="polite">
						<p class="stepof">Step {stepAt + 1} of {dish.steps.length}</p>
						<p class="do">{s.do}</p>
						<p class="look"><b>Look for</b> {s.look}</p>
						<details class="wrong">
							<summary>If it goes wrong</summary>
							<p><b>The usual mistake</b> {s.mistake}</p>
							<p><b>The fix</b> {s.fix}</p>
						</details>
						<div class="stepnav">
							<button class="chip" disabled={stepAt === 0} onclick={() => (stepAt -= 1)}>Previous step</button>
							<button class="chip go" disabled={stepAt === dish.steps.length - 1} onclick={() => (stepAt += 1)}>Next step</button>
						</div>
					</div>
				{:else}
					<ol class="steps">
						{#each dish.steps as s (s.n)}
							<li class="step">
								<p class="do">{s.do}</p>
								<p class="look"><b>Look for</b> {s.look}</p>
								<details class="wrong">
									<summary>If it goes wrong</summary>
									<p><b>The usual mistake</b> {s.mistake}</p>
									<p><b>The fix</b> {s.fix}</p>
								</details>
							</li>
						{/each}
					</ol>
				{/if}

				<h2 class="sec">Why it works</h2>
				<p class="prose">{dish.science}</p>
				<h2 class="sec">Plating</h2>
				<p class="prose">{dish.plating}</p>
				{#if dish.safety.length}
					<h2 class="sec">Food safety</h2>
					<ul class="plain safety">
						{#each dish.safety as x (x)}<li>{x}</li>{/each}
					</ul>
				{/if}
			</section>
		</div>

		<section class="pairing" aria-labelledby="k-pair">
			<h2 class="sec" id="k-pair">To drink</h2>
			<p class="prose">{dish.pairing.drink}</p>
			{#if brennans}
				<p class="prose brennans">
					<span class="label">At Brennan's</span>
					{#if brennans.href}
						<a href={brennans.href}>{brennans.name}</a> <span class="where">{brennans.where}</span>{brennans.why ? `: ${brennans.why}` : ''}
					{:else}
						<b>{brennans.name}</b>{brennans.why ? `: ${brennans.why}` : ''}
					{/if}
				</p>
			{/if}
		</section>

		<section aria-labelledby="k-var">
			<h2 class="sec" id="k-var">Variations</h2>
			<ul class="plain">
				{#each dish.variations as v (v)}<li>{v}</li>{/each}
			</ul>
		</section>

		<section class="films" data-print="hide" aria-labelledby="k-film">
			<h2 class="sec" id="k-film">Watch it done</h2>
			{#if dish.video.verified}
				<a class="vrow" href={dish.video.verified.url} target="_blank" rel="noopener">
					<span class="vlbl">{dish.video.verified.title}</span>
					<span class="vsub">{dish.video.verified.channel} · on YouTube, opens outside the app</span>
				</a>
			{/if}
			<a class="vrow" href={videoSearchUrl(dish.video.search)} target="_blank" rel="noopener" data-video="search">
				<span class="vlbl">Search YouTube: {dish.video.search}</span>
				<span class="vsub">Every film of it, opens outside the app</span>
			</a>
		</section>

		{#if library || dish.techniqueRefs.length}
			<section aria-labelledby="k-further">
				<h2 class="sec" id="k-further">Further in the app</h2>
				<ul class="further">
					{#if library}
						<li><a href="{base}{recipeHref(library)}">{library.name}</a> <span class="where">the Library recipe it is based on</span></li>
					{/if}
					{#each dish.techniqueRefs as t (t)}
						<li><a href="{base}/technique/{t}">{techLabels[t] ?? t.replace(/-/g, ' ')}</a> <span class="where">a technique it practises</span></li>
					{/each}
				</ul>
			</section>
		{/if}

		<section class="record" data-print="hide" aria-labelledby="k-rec">
			<h2 class="sec" id="k-rec">Your record</h2>
			<p class="recline" aria-live="polite">{lastWord ? `Recorded: ${lastWord}. ` : ''}{record}</p>
			<p class="hint">Cooked it? Say how it came out. The word sets how soon it comes back for a re-cook.</p>
			<div class="rate" role="group" aria-label="How it came out">
				{#each RATINGS as r (r.grade)}
					<button class="chip" data-grade={r.grade} onclick={() => rate(r.grade)}>
						<span class="word">{r.word}</span>
						<span class="wline">{r.line}</span>
					</button>
				{/each}
			</div>
			{#if entry}
				<p class="quietlinks"><button type="button" onclick={undoLast}>Undo the last cook</button></p>
			{/if}
			<label class="sec notelabel" for="k-notes">Your notes</label>
			<textarea
				id="k-notes"
				rows="4"
				placeholder="What you changed, what to do differently next time"
				value={session.note(key)}
				oninput={(e) => session.setNote(key, (e.currentTarget as HTMLTextAreaElement).value)}
			></textarea>
		</section>

		<nav class="nextdish" aria-label="Along the course" data-print="hide">
			{#if next}
				<a class="door" href={dishHref(base, next)}>
					<span class="door-name">Next {MEAL_LABEL[dish.meal].toLowerCase()} · {next.n} of {PER_MEAL}</span>
					<span class="door-line">{next.title}</span>
					<span class="door-sub">{next.cuisine} · {minutesLabel(next.total)} · {next.difficulty}</span>
				</a>
			{/if}
			<p class="quietlinks"><a href="{base}/level/{dish.level}#kitchen">Every {levelName(dish.level)} dish</a></p>
		</nav>
	</article>

	{#if cooking}
		<CookMode
			name={dish.title}
			slug={key}
			steps={dish.steps.map((s) => ({ text: s.do, durationSec: stepSeconds(s.do) }))}
			guides={dish.steps.map((s) => ({ look: s.look, mistake: s.mistake, fix: s.fix }))}
			ratings={RATINGS}
			prep={dish.mise.map((m) => ({ text: m, durationSec: stepSeconds(m) }))}
			bind:prepDone={miseDone}
			onclose={() => (cooking = false)}
			onfinish={(g) => {
				session.markCooked(key, g);
				lastWord = g ? (RATINGS.find((r) => r.grade === g)?.word ?? '') : '';
			}}
			onannotate={(fault) => session.annotateLastCook(key, { fault })}
		/>
	{/if}
{:else}
	<div class="shell hub kitchen">
		<h1 tabindex="-1">Cook at home</h1>
		<p class="lede">
			Four hundred dishes to cook in your own kitchen: twenty five each of breakfast, lunch, dinner and dessert at
			every level, each one step by step with what to look for, the usual mistake and how to fix it.
		</p>
		{#each perLevel as l (l.level)}
			{@const c = course.find((x) => x.level === l.level)}
			<h2 class="group">{levelName(l.level)}</h2>
			<p class="note">{c?.cooked ?? 0} of {c?.total ?? 0} cooked.</p>
			<nav class="quiet" aria-label="{levelName(l.level)}: the four meals">
				{#each l.meals as m (m.meal)}
					<a class="door" href={m.next ? dishHref(base, m.next) : `${base}/level/${l.level}#kitchen`}>
						<span class="door-name">{MEAL_LABEL[m.meal]} · {m.cooked} of {m.total} cooked</span>
						<span class="door-line">{m.next ? `Next: ${m.next.title}` : 'Every one cooked. Re-cook them as they come due.'}</span>
					</a>
				{/each}
			</nav>
		{/each}
	</div>
{/if}

<style>
	.kitchen h1:focus {
		outline: none;
	}
	.dish {
		padding-block: 10px 60px;
		max-width: 1100px;
	}
	.eyebrow {
		font-size: 0.9375rem;
		letter-spacing: var(--tracking-eyebrow);
		color: var(--turmeric-deep);
		margin: 0;
	}
	.head h1 {
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 700;
		margin: 6px 0 12px;
	}
	.stats {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		list-style: none;
		margin: 0 0 14px;
		padding: 0;
	}
	.stats li {
		border: 1px solid var(--line);
		padding: 4px 10px;
		border-radius: var(--radius);
		font-size: 0.9375rem;
		color: var(--ink-soft);
	}
	.stats li.done {
		color: var(--leaf);
		border-color: var(--leaf);
	}
	.summary {
		font-size: var(--t-lede);
		line-height: 1.55;
		max-width: var(--measure);
		color: var(--ink);
		border-top: 1px solid var(--line);
		padding-top: 14px;
		margin: 0 0 12px;
	}
	.skillrow {
		margin: 8px 0;
	}
	.label {
		display: block;
		font-size: 0.875rem;
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--turmeric-deep);
		margin: 0 0 6px;
	}
	.skills,
	.builds {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.skills li {
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 4px 10px;
		font-size: 0.9375rem;
		color: var(--ink-soft);
	}
	.builds a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 0 12px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		color: var(--ink);
		text-decoration: none;
		font-size: 0.9375rem;
	}
	.builds a:hover {
		border-color: var(--turmeric);
	}

	.tools {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin: 18px 0 26px;
	}
	.group {
		display: flex;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		overflow: hidden;
	}
	.group button {
		background: var(--card);
		color: var(--ink);
		border: 0;
		border-right: 1px solid var(--field-line);
		padding: 7px 14px;
		cursor: pointer;
		font: inherit;
		font-size: 0.9375rem;
		min-height: 44px;
		min-width: 48px;
	}
	.group button:last-child {
		border-right: 0;
	}
	.group button.on {
		background: var(--ink);
		color: var(--card);
	}
	.chip {
		font-size: 1rem;
		min-height: 44px;
		color: var(--ink);
	}
	.chip.go {
		color: var(--on-accent);
	}

	.cols {
		display: grid;
		grid-template-columns: 1fr 1.4fr;
		gap: 34px;
	}
	@media (max-width: 760px) {
		.cols {
			grid-template-columns: 1fr;
			gap: 10px;
		}
	}
	.sec {
		display: block;
		font-family: var(--text);
		font-size: 0.875rem;
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--ink-soft);
		border-bottom: 1px solid var(--line);
		padding-bottom: 6px;
		margin: 26px 0 12px;
		font-weight: 500;
	}
	section > .sec:first-child,
	.methodhead .sec {
		margin-top: 0;
	}
	.cols section:first-child > .sec:first-child {
		margin-top: 0;
	}
	@media (max-width: 760px) {
		.cols section + section > .methodhead {
			margin-top: 26px;
		}
	}
	.hint {
		font-size: 0.9375rem;
		color: var(--ink-soft);
		margin: -4px 0 8px;
		font-style: italic;
	}
	.prose {
		font-size: var(--t-body);
		line-height: 1.65;
		max-width: var(--measure);
		margin: 0 0 10px;
	}

	.ingredients,
	.plain,
	.mise,
	.further {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.ingredients li {
		padding: 8px 0;
		border-bottom: 1px solid var(--line);
		line-height: 1.45;
	}
	.qty {
		font-weight: 600;
		color: var(--turmeric-deep);
		margin-right: 6px;
		font-variant-numeric: tabular-nums;
	}
	.inote {
		display: block;
		font-size: 0.9375rem;
		color: var(--ink-soft);
		margin-top: 2px;
	}
	.plain li {
		padding: 6px 0 6px 14px;
		position: relative;
		line-height: 1.5;
	}
	.plain li::before {
		content: '·';
		position: absolute;
		left: 2px;
		color: var(--turmeric-deep);
		font-weight: 700;
	}
	.mise label {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		min-height: 44px;
		padding: 8px 0;
		cursor: pointer;
		line-height: 1.5;
		border-bottom: 1px solid var(--line);
	}
	.mise input {
		width: 22px;
		height: 22px;
		margin-top: 1px;
		flex: none;
		accent-color: var(--turmeric-deep);
	}
	.mise label.ticked span {
		color: var(--ink-soft);
		text-decoration: line-through;
		text-decoration-color: var(--line-strong);
	}
	.timeline {
		list-style: none;
		margin: 0;
		padding: 0;
		border-left: 2px solid var(--line);
	}
	.timeline li {
		padding: 6px 0 10px 14px;
		line-height: 1.5;
	}
	.at {
		display: block;
		font-size: 0.875rem;
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--turmeric-deep);
	}

	.methodhead {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-end;
		gap: 10px;
		border-bottom: 1px solid var(--line);
		padding-bottom: 8px;
		margin-bottom: 14px;
	}
	.methodhead .sec {
		border: 0;
		padding: 0;
		margin: 0;
	}
	.steps {
		margin: 0;
		padding-left: 1.6em;
	}
	.step {
		padding: 4px 0 14px;
		margin-bottom: 8px;
		border-bottom: 1px solid var(--line);
	}
	.step::marker {
		font-family: var(--display);
		color: var(--turmeric-deep);
		font-weight: 700;
	}
	.do {
		font-size: 1.0625rem;
		line-height: 1.6;
		margin: 0 0 8px;
	}
	.wrong summary::after {
		content: '▸';
		color: var(--turmeric-deep);
		text-decoration: none;
	}
	.wrong[open] summary::after {
		content: '▾';
	}
	.look,
	.wrong p {
		font-size: 1rem;
		line-height: 1.55;
		color: var(--ink-soft);
		margin: 0 0 4px;
	}
	.look b,
	.wrong b {
		color: var(--turmeric-deep);
		font-weight: 600;
		margin-right: 4px;
	}
	.wrong summary {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		cursor: pointer;
		color: var(--ink);
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-color: var(--line-strong);
		font-size: 1rem;
	}
	.onestep {
		border: var(--rule, 1px) solid var(--house-frame, var(--line));
		background: var(--house-panel, var(--card));
		border-radius: var(--radius);
		padding: 18px;
	}
	.stepof {
		font-size: 0.875rem;
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--turmeric-deep);
		margin: 0 0 8px;
	}
	.onestep .do {
		font-size: 1.1875rem;
	}
	.stepnav {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 12px;
	}

	.pairing,
	.films,
	.record,
	.nextdish {
		max-width: var(--measure);
	}
	.brennans .label {
		display: block;
	}
	.brennans a,
	.further a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		color: var(--ink);
		text-underline-offset: 4px;
	}
	.where {
		color: var(--ink-soft);
		font-size: 0.9375rem;
	}
	.vrow {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-height: 44px;
		padding: 10px 0;
		border-bottom: 1px solid var(--line);
		color: var(--ink);
		text-decoration: none;
	}
	.vrow:hover .vlbl {
		text-decoration: underline;
		text-underline-offset: 4px;
	}
	.vlbl {
		font-size: 1.0625rem;
	}
	.vsub {
		font-size: 0.9375rem;
		color: var(--ink-soft);
	}

	.recline {
		font-size: 1.0625rem;
		line-height: 1.5;
		margin: 0 0 8px;
	}
	.rate {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 8px;
		margin: 8px 0;
	}
	.rate .chip {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		text-align: left;
		padding: 10px 14px;
		border: 1px solid var(--house-frame, var(--line-strong));
		background: var(--card);
		border-radius: var(--radius);
		cursor: pointer;
		font: inherit;
	}
	.rate .chip:hover {
		border-color: var(--turmeric-deep);
	}
	.rate .word {
		font-family: var(--house-display, var(--display));
		font-size: 1.0625rem;
		color: var(--turmeric-deep);
	}
	.rate .wline {
		font-size: 0.9375rem;
		color: var(--ink-soft);
		line-height: 1.4;
	}
	.notelabel {
		margin-top: 20px;
	}
	textarea {
		width: 100%;
		box-sizing: border-box;
		background: var(--card);
		color: var(--ink);
		border: 1px solid var(--field-line);
		border-radius: var(--radius);
		padding: 10px 12px;
		resize: vertical;
		font: inherit;
		font-size: 1rem;
		line-height: 1.55;
	}
	.quietlinks {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 18px;
		margin: 10px 0 0;
	}
	.quietlinks a,
	.quietlinks button {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		font: inherit;
		font-size: 1rem;
		color: var(--ink-soft);
		background: none;
		border: 0;
		padding: 0;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-color: var(--line-strong);
	}
	.nextdish {
		margin-top: 30px;
	}
	.nextdish .door {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-height: 44px;
		padding: 16px 18px;
		border: var(--rule, 1px) solid var(--house-frame, var(--line));
		border-radius: var(--radius);
		background: var(--house-panel, var(--card));
		color: var(--ink);
		text-decoration: none;
	}
	.nextdish .door:hover {
		border-color: var(--turmeric-deep);
	}
	.door-name {
		font-family: var(--house-display, var(--text));
		font-size: 0.9375rem;
		letter-spacing: 0.06em;
		color: var(--turmeric-deep);
	}
	.door-line {
		font-size: var(--t-body);
		line-height: 1.45;
	}
	.door-sub {
		font-size: 1rem;
		color: var(--ink-soft);
	}
	@media print {
		.wrong {
			display: block;
		}
	}
</style>
