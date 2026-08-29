<!--
  The service drill, the first thing in this app that measures a server.

  Ten questions, always. The verdict ladder in lib/drill.ts is absolute counts,
  so a shortened round would clear its top rung on fewer right answers and log a
  clean sweep that never happened; the menu drill guards the same way with its
  two-drillable-dish floor. When the due queue is short the round is topped up
  from terms never drilled, never trimmed.

  Unlike /menu/quiz, this works the moment the app is installed: it drills the
  guide's own 186 shipped cards rather than dishes the venue has to type in.

  Everything below the h1 sits in exactly ONE <article class="sheet">. That is
  the paywall contract: oot-locks.js does querySelector('article.sheet'),
  SINGULAR, so a page with none is protected by a dismissible overlay alone and
  a page with two leaves the second reachable by keyboard and screen reader.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { session } from '$lib/stores/session.svelte';
	import { repertoire, dueList, TERM_LADDER_DAYS } from '$lib/repertoire';
	import {
		buildRound,
		verdictFor,
		gradeFor,
		ROUND_LENGTH,
		type DrillQuestion
	} from '$lib/drill';

	let { data } = $props();

	/** Terms past their re-cook, on the TERM ladder (2/6/14/35/90). */
	const due = $derived.by(() => {
		const now = Date.now();
		return dueList(repertoire(session.drillLog, now, TERM_LADDER_DAYS), now).map((e) => e.slug);
	});
	const everDrilled = $derived(new Set(session.drillLog.map((e) => e.slug)));

	let round = $state<DrillQuestion[] | null>(null);
	let at = $state(0);
	let picked = $state<string | null>(null);
	let right = $state(0);
	let done = $state(false);

	const q = $derived(round ? round[at] : null);

	function start() {
		round = buildRound(data.cards, due, everDrilled, Math.random);
		at = 0;
		picked = null;
		right = 0;
		done = false;
	}

	/**
	 * The answer is recorded HERE, before the explanation is shown and before
	 * anything advances, the rule cook mode's pass panel follows. Closing the
	 * page mid-round must not lose what was already answered.
	 */
	function answer(slug: string) {
		if (!q || picked) return;
		picked = slug;
		const correct = slug === q.target.slug;
		if (correct) right += 1;
		session.markDrilled(q.target.slug, gradeFor(correct, false));
	}

	function next() {
		if (!round) return;
		if (at + 1 >= round.length) {
			done = true;
			finish();
			return;
		}
		at += 1;
		picked = null;
	}

	/**
	 * One dispatch per finished round, matching the two existing sites the
	 * monorepo's oot-log.js already consumes. markStudied() is an existing
	 * profiles method: no shared-file edit.
	 */
	function finish() {
		if (!round) return;
		try {
			window.dispatchEvent(
				new CustomEvent('oot:round-complete', {
					detail: { kind: 'quiz', right, of: round.length }
				})
			);
			window.OOT?.profiles?.markStudied();
		} catch {
			/* standalone, or a hardened browser. The round still counted. */
		}
	}
</script>

<svelte:head><title>Drill the track: The World Table</title></svelte:head>

<div class="shell view">
	<nav class="crumbs"><a href="{base}/service">Service</a></nav>
	<h1>Drill the track</h1>

	<article class="sheet">
		{#if !round}
			<p class="lede">
				Ten questions over the {data.cards.length} terms of the service track. The definition
				appears with its own term taken out; you name it.
			</p>
			<p class="note">
				{#if due.length}
					{due.length} term{due.length === 1 ? ' is' : 's are'} due: they go first.
				{:else if everDrilled.size}
					Nothing due. The round will draw terms you have not answered yet.
				{:else}
					Nothing drilled yet, so this first round is a cold read. That is the point.
				{/if}
			</p>
			<button class="chip go" onclick={start}>Start a round</button>
		{:else if done}
			<p class="verdict">{verdictFor(right, round.length)}</p>
			<p class="score">{right} of {round.length}</p>
			<p class="note">
				Every answer is scheduled: a term you got right comes back later, one you missed comes back
				sooner. Nothing here is shared with anyone.
			</p>
			<div class="ends">
				<button class="chip go" onclick={start}>Another round</button>
				<a class="chip" href="{base}/service">Back to the track</a>
			</div>
		{:else if q}
			<p class="progress" aria-live="polite">Question {at + 1} of {round.length}</p>
			<p class="prompt">{q.target.prompt}</p>
			<ul class="opts">
				{#each q.options as o (o.slug)}
					<li>
						<button
							class="opt"
							class:right={picked && o.slug === q.target.slug}
							class:wrong={picked === o.slug && o.slug !== q.target.slug}
							disabled={Boolean(picked)}
							onclick={() => answer(o.slug)}
						>
							{o.term}
						</button>
					</li>
				{/each}
			</ul>
			{#if picked}
				<p class="after">
					{picked === q.target.slug ? 'Right.' : `No — ${q.target.term}.`}
					<a href="{base}/lexicon#{q.target.slug}">Read the entry</a>
				</p>
				<button class="chip go" onclick={next}>
					{at + 1 >= round.length ? 'Finish' : 'Next'}
				</button>
			{/if}
		{/if}
	</article>
</div>

<style>
	.crumbs {
		font-size: var(--t-small);
		margin-bottom: 10px;
	}
	.crumbs a {
		color: var(--ink-soft);
	}
	h1 {
		font-size: var(--t-h1);
		margin-bottom: 16px;
	}
	.lede {
		font-size: var(--t-lede);
		color: var(--ink-soft);
		max-width: var(--measure);
		margin-bottom: 12px;
	}
	.note {
		color: var(--ink-soft);
		font-size: var(--t-small);
		max-width: var(--measure);
		line-height: 1.55;
		margin-bottom: 16px;
	}
	.progress {
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
		margin-bottom: 10px;
	}
	.prompt {
		max-width: var(--measure);
		line-height: 1.65;
		margin-bottom: 18px;
		font-size: var(--t-body);
	}
	.opts {
		list-style: none;
		margin: 0 0 14px;
		padding: 0;
		display: grid;
		gap: 8px;
	}
	.opt {
		width: 100%;
		text-align: left;
		padding: 12px 14px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--card, transparent);
		color: var(--ink);
		font: inherit;
		cursor: pointer;
	}
	.opt:hover:enabled {
		border-color: var(--turmeric-deep);
	}
	/* Right and wrong carry a word in the line below as well as a border: the
	   verdict must not depend on colour alone. */
	.opt.right {
		border-color: var(--turmeric-deep);
		border-width: 2px;
	}
	.opt.wrong {
		border-style: dashed;
		color: var(--muted);
	}
	.after {
		margin-bottom: 14px;
		font-size: var(--t-small);
		color: var(--ink-soft);
	}
	.verdict {
		font-family: var(--display);
		font-size: 24px;
		margin-bottom: 6px;
	}
	.score {
		font-variant-numeric: tabular-nums;
		color: var(--muted);
		margin-bottom: 14px;
	}
	.ends {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}
	.ends a {
		text-decoration: none;
	}
</style>
