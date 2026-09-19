<!--
  Lineup: the Floor Deck at pre-shift. One term fills the screen, the staff
  answer aloud, and whoever is running the lineup taps whether the room had it.

  IT WRITES NOTHING ABOUT A PERSON. Six people answering aloud on one tablet is
  not evidence about whoever is holding it, so nothing here touches the session
  or its drill log. The room's answers go to a venue-level tally on the house
  record (lib/lineup.ts), which has no person field and cannot grow one, and
  which exists for one purpose: what the room missed leads the next lineup. A
  per-person lineup record would be a league table, and this product refuses to
  be able to produce one, for the same reason the waste log carries no name.

  So it also marks nobody as having studied and sends no round to the suite's
  log: tests/floor-deck.spec.ts holds the session's record to being byte for
  byte what it was before the lineup ran.

  THE STAGE IS IN THE PAGE, NOT A DIALOG. showModal() would make everything
  behind it inert, and the thing behind it is the dock: a lineup happens during
  prep, and a timer ringing under a modal that swallowed its Stop button is the
  failure this app already fixed once. The stage takes the viewport's height
  less the mode bar and the dock, and nothing on it is positioned over either.

  Read at arm's length: the term runs up to 7rem, the two buttons are 72px and
  carry a glyph and a word, never colour alone. Right advances at once; wrong
  shows the answer large and waits, because that is the teaching moment.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import { onMount, onDestroy, tick } from 'svelte';
	import { loadFloorDeck } from '$lib/data';
	import { house } from '$lib/stores/house.svelte';
	import { acquireWakeLock } from '$lib/wakeLock';
	import FloorCard from '$lib/components/FloorCard.svelte';
	import { LINEUP_LENGTHS, liveSections, pickSession, sectionsFromSearch } from '$lib/floor-deck';
	import type { LineupEntry } from '$lib/lineup';
	import type { DeckCard, FloorDeck } from '$lib/types';

	let deck = $state<FloorDeck | null>(null);
	let failed = $state(false);
	let search = $state<string | null>(null);

	let picked = $state<string[]>([]);
	let length = $state<number>(8);
	let queue = $state<DeckCard[] | null>(null);
	let at = $state(0);
	let shown = $state(false);
	let missed = $state<DeckCard[]>([]);
	let last = $state<{ entry: LineupEntry | null; index: number; wasMiss: boolean } | null>(null);
	let done = $state(false);
	let awake = $state(false);
	let release: (() => void) | null = null;
	let stage = $state<HTMLElement | null>(null);

	onMount(async () => {
		try {
			deck = await loadFloorDeck();
		} catch {
			failed = true;
		}
	});
	afterNavigate(() => {
		search = location.search;
	});
	onDestroy(() => release?.());

	const sections = $derived(deck ? liveSections(deck) : []);
	const names = $derived(new Map((deck?.cards ?? []).map((c) => [c.id, c.term])));
	const titles = $derived(new Map((deck?.sections ?? []).map((s) => [s.key, s.title])));
	const card = $derived(queue ? (queue[at] ?? null) : null);

	$effect(() => {
		if (picked.length || !sections.length || search === null) return;
		const wanted = sectionsFromSearch(search, sections.map((s) => s.key));
		if (wanted) picked = [...wanted];
	});

	function toggle(key: string) {
		picked = picked.includes(key) ? picked.filter((k) => k !== key) : [...picked, key];
	}

	async function start() {
		if (!deck) return;
		queue = pickSession(deck, house.lineupLog, Date.now(), {
			length,
			scope: picked.length ? new Set(picked) : null,
			// half the lineup is kept for terms the room has never been asked
			newQuota: Math.ceil(length / 2)
		});
		at = 0;
		shown = false;
		missed = [];
		last = null;
		done = false;
		release = await acquireWakeLock();
		awake = Boolean(release);
		await tick();
		stage?.scrollIntoView({ block: 'start' });
	}

	function finish() {
		done = true;
		release?.();
		release = null;
		awake = false;
	}

	function advance() {
		if (!queue) return;
		if (at + 1 >= queue.length) return finish();
		at += 1;
		shown = false;
	}

	function had() {
		if (!card || shown) return;
		last = { entry: house.markLineup(card.id, 'met'), index: at, wasMiss: false };
		advance();
	}

	function missedIt() {
		if (!card || shown) return;
		last = { entry: house.markLineup(card.id, 'missed'), index: at, wasMiss: true };
		missed = [...missed, card];
		shown = true; // the answer, large, and it waits for Next
	}

	/** Take back exactly the last answer, and go back to that term. */
	function undo() {
		if (!last || !queue) return;
		if (last.entry) house.undoLineup(last.entry.slug, last.entry.at);
		if (last.wasMiss) missed = missed.filter((c) => c.id !== queue![last!.index].id);
		at = last.index;
		shown = false;
		done = false;
		last = null;
	}

	function onkey(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey || !card || done) return;
		const t = e.target as HTMLElement | null;
		if (t && ['BUTTON', 'A', 'SUMMARY', 'INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
		const k = e.key.toLowerCase();
		if (shown) {
			if (k === 'enter' || k === ' ' || k === 'arrowright') {
				e.preventDefault();
				advance();
			}
			return;
		}
		if (k === '1' || k === 'y') had();
		else if (k === '2' || k === 'n') missedIt();
		else if (k === ' ') {
			e.preventDefault();
			shown = true;
		}
	}
</script>

<svelte:window onkeydown={onkey} />
<svelte:head><title>Lineup · The Floor Deck · The World Table</title></svelte:head>

<div class="shell view">
	<nav class="crumbs"><a href="{base}/service">Service</a> · <a href="{base}/service/deck">The Floor Deck</a></nav>
	<h1>Lineup</h1>

	<article class="sheet">
		{#if failed}
			<p class="empty">The deck did not load. Check the connection once; after that it works offline.</p>
		{:else if !deck || search === null}
			<p class="empty" aria-live="polite">Opening the deck…</p>
		{:else if !sections.length}
			<p class="empty">The deck is being written. No section is ready for a lineup yet.</p>
		{:else if !queue}
			<p class="lede">
				For pre-shift. One term fills the screen, the room answers aloud, and you tap whether they
				had it. What the room misses leads the next lineup.
			</p>
			<p class="note">
				Nothing here is recorded against a person, and nobody's name is kept. It is a tally for the
				room, on this device.
				{#if house.blocked}
					This device cannot save the venue's record right now, so this lineup will run and nothing
					from it will be kept.
				{/if}
			</p>

			<fieldset class="pick">
				<legend>Which sections? Leave them all clear for the whole deck.</legend>
				{#each sections as s (s.key)}
					<label class:on={picked.includes(s.key)}>
						<input type="checkbox" checked={picked.includes(s.key)} onchange={() => toggle(s.key)} />
						<span class="stitle">{s.title}</span>
						<span class="scount">{s.count} cards</span>
					</label>
				{/each}
			</fieldset>

			<fieldset class="pick lengths">
				<legend>How many terms?</legend>
				{#each LINEUP_LENGTHS as n (n)}
					<label class:on={length === n}>
						<input type="radio" name="length" value={n} bind:group={length} />
						<span class="stitle">{n}</span>
					</label>
				{/each}
			</fieldset>

			<p class="tools">
				<button class="chip go" onclick={start} disabled={!house.ready}>Start the lineup</button>
				<a class="chip" href="{base}/service/deck">The deck</a>
			</p>
		{:else if !queue.length}
			<p class="empty">That choice has no card to ask yet.</p>
			<p class="tools"><button class="chip" onclick={() => (queue = null)}>Choose again</button></p>
		{:else if done}
			<div class="result" role="status">
				{#if missed.length}
					<h2>What the room missed</h2>
					<p class="note">These lead the next lineup. Say each one once more before the doors open.</p>
					{#each missed as m (m.id)}
						<FloorCard
							card={m}
							frame={deck.frame}
							sectionTitle={titles.get(m.section) ?? ''}
							{names}
							flippable={false}
							heading="h3"
						/>
					{/each}
				{:else}
					<h2>Clean lineup.</h2>
					<p class="note">Nothing carried over.</p>
				{/if}
				<p class="tools">
					<button class="chip go" onclick={() => (queue = null)}>Another lineup</button>
					{#if last}<button class="chip" onclick={undo}>Undo last</button>{/if}
					<a class="chip" href="{base}/service/deck">The deck</a>
				</p>
			</div>
		{:else if card}
			<div class="stage" bind:this={stage}>
				<p class="where">
					{at + 1} of {queue.length}
					{#if awake}<span class="awake"> · screen staying awake</span>{/if}
				</p>

				{#key card.id}
					<FloorCard
						{card}
						frame={deck.frame}
						sectionTitle={titles.get(card.section) ?? ''}
						{names}
						size="stage"
						heading="h2"
						turnButton={false}
						revealed={shown}
					/>
				{/key}

				{#if shown}
					<p class="keyline">{card.gist}</p>
					<div class="calls">
						<button class="call next" onclick={advance}><span aria-hidden="true">→</span> Next</button>
					</div>
				{:else}
					<div class="calls" role="group" aria-label="Did the room have it?">
						<button class="call had" onclick={had}><span aria-hidden="true">✓</span> Had it</button>
						<button class="call miss" onclick={missedIt}><span aria-hidden="true">✗</span> Missed it</button>
					</div>
				{/if}

				<p class="tools">
					{#if !shown}<button class="chip" onclick={() => (shown = true)}>Show the answer</button>{/if}
					{#if last}<button class="chip" onclick={undo}>Undo last</button>{/if}
					<button class="chip" onclick={finish}>End the lineup</button>
				</p>
			</div>
		{/if}
	</article>
</div>

<style>
	.view { padding-block: 26px 80px; max-width: 900px; }
	.crumbs { font-size: var(--t-micro); margin-bottom: 14px; color: var(--muted); }
	.crumbs a { color: var(--muted); text-decoration: none; }
	.crumbs a:hover { color: inherit; }
	h1 { font-size: var(--t-h2); margin-bottom: 6px; }
	.lede { color: var(--ink-soft); max-width: var(--measure); margin-bottom: 10px; }
	.note { color: var(--ink-soft); max-width: var(--measure); margin-bottom: 14px; font-size: var(--t-small); }
	.empty { padding: 32px 0; color: var(--muted); font-style: italic; }

	.pick { border: 0; padding: 0; margin: 0 0 16px; display: grid; gap: 8px; }
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
	.lengths { grid-template-columns: repeat(3, minmax(0, 120px)); }
	.lengths legend { grid-column: 1 / -1; }
	.stitle { font-family: var(--display); font-size: 18px; }
	.scount { font-size: var(--t-micro); color: var(--muted); }

	/* In the page, never over it: the viewport less the mode bar and the dock,
	   so a ringing timer keeps its Stop button. */
	.stage {
		min-height: calc(100dvh - var(--modebar-h) - var(--dock-h, 44px) - env(safe-area-inset-bottom) - 24px);
		scroll-margin-top: var(--modebar-h);
		display: flex; flex-direction: column; justify-content: center;
	}
	.where { font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; color: var(--muted); }
	.awake { text-transform: none; letter-spacing: 0; }
	.keyline {
		font-size: clamp(1rem, 2.6vw, 1.5rem); color: var(--ink-soft); max-width: 60ch; margin-top: 14px;
		border-left: 2px solid var(--turmeric-deep); padding-left: 12px;
	}
	.calls { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 18px; }
	.call {
		min-height: 72px; border: 2px solid var(--line); border-radius: var(--radius); background: var(--card);
		color: var(--ink); font-family: var(--display); font-size: clamp(1.2rem, 3.4vw, 1.9rem); cursor: pointer;
		display: inline-flex; align-items: center; justify-content: center; gap: 12px;
	}
	.call:hover { border-color: var(--turmeric-deep); }
	.call.next { grid-column: 1 / -1; }
	.result h2 { font-family: var(--display); font-size: 26px; margin-bottom: 8px; }
	.tools { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
	.tools :global(.chip) { min-height: 44px; display: inline-flex; align-items: center; }
</style>
