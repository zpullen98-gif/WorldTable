<script lang="ts">
	import { base } from '$app/paths';
	import { session } from '$lib/stores/session.svelte';
	import { recipes } from '$lib/data';
	import { buildPass } from '$lib/pass';
	import {
		firingQuestions,
		canDrill,
		gradeRun,
		QUESTIONS_PER_RUN,
		SECONDS_PER_QUESTION,
		type FiringQuestion
	} from '$lib/firing-drill';
	import Ornament from '$lib/components/Ornament.svelte';
	import { onMount } from 'svelte';

	/**
	 * The firing drill: repetition under load.
	 *
	 * Built from the cook's own pinned menu through the same buildPass the
	 * worksheet uses, so the order being drilled is the order tonight actually
	 * wants. No authored questions; the answer is arithmetic the pass did.
	 * The score goes to the cook's own drillLog, which no manager view reads.
	 */

	let { data } = $props();

	const bySlug = new Map(recipes.map((r) => [r.slug, r]));
	const famBySlug = $derived(new Map(session.familyRecipes.map((r) => [r.slug, r])));
	const pinned = $derived(
		session.menu.map((s) => bySlug.get(s) ?? famBySlug.get(s)).filter(Boolean)
	);
	const stepsOf = (slug: string) => data.steps[slug] ?? famBySlug.get(slug)?.steps ?? [];

	const plan = $derived.by(() =>
		buildPass(
			pinned.map((r) => ({
				slug: r!.slug,
				name: r!.name,
				course: (r as { course?: string }).course,
				steps: stepsOf(r!.slug)
			}))
		)
	);

	const ready = $derived(canDrill(plan));

	/* ---- the run ---------------------------------------------------------- */

	let run = $state<null | {
		questions: FiringQuestion[];
		at: number;
		correct: number;
		/** null while answering; the chosen index (or -1 for timeout) after. */
		picked: number | null;
		tightMisses: string[];
	}>(null);
	let secondsLeft = $state(SECONDS_PER_QUESTION);
	let done = $state<null | { correct: number; total: number; grade: string; tight: string[] }>(
		null
	);

	let timer: ReturnType<typeof setInterval> | undefined;
	onMount(() => () => clearInterval(timer));

	/** Focus target after answering: the options disable, and a keyboard user's
	 *  focus otherwise falls to the body with the drill still running. */
	let nextBtn = $state<HTMLButtonElement | null>(null);
	/** What assistive tech hears. The clock is deliberately NOT live: a region
	 *  announcing every second drowns the question it times. */
	let announce = $state('');

	function startClock() {
		clearInterval(timer);
		secondsLeft = SECONDS_PER_QUESTION;
		timer = setInterval(() => {
			secondsLeft -= 1;
			// The timeout is an answer: under load, not deciding is a decision.
			if (secondsLeft <= 0) pick(-1);
		}, 1000);
	}

	function start() {
		done = null;
		run = { questions: firingQuestions(plan), at: 0, correct: 0, picked: null, tightMisses: [] };
		startClock();
	}

	function pick(i: number) {
		if (!run || run.picked !== null) return;
		clearInterval(timer);
		run.picked = i;
		const q = run.questions[run.at];
		const winner = q.options[q.answer];
		announce =
			(i === q.answer ? 'Right. ' : i === -1 ? 'Time. ' : 'Wrong. ') +
			`${winner.dish} starts first, at T minus ${winner.startsAtMin} minutes.`;
		queueMicrotask(() => nextBtn?.focus());
		if (i === q.answer) run.correct += 1;
		else if (q.gapMin <= 5) {
			// Name the tight calls at the end: a miss by two minutes teaches
			// something a miss by an hour does not.
			run.tightMisses.push(
				`${q.options[q.answer].dish}: starts ${q.gapMin} min ahead. A tight call.`
			);
		}
	}

	function next() {
		if (!run) return;
		if (run.at + 1 >= run.questions.length) {
			const grade = gradeRun(run.correct, run.questions.length);
			done = {
				correct: run.correct,
				total: run.questions.length,
				grade,
				tight: run.tightMisses
			};
			// One slug for the whole drill, like the calibration bench's ladder
			// slugs: the drill log is the cook's own record, read by no one else.
			session.markDrilled('drill-firing-order', grade as 'met' | 'close' | 'missed');
			run = null;
			return;
		}
		run.at += 1;
		run.picked = null;
		startClock();
	}

	const q = $derived(run ? run.questions[run.at] : null);
</script>

<svelte:head><title>The Firing Drill | The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<h1>The Firing Drill</h1>
		<p class="lede">
			Your own menu, back-timed by The Pass, and {SECONDS_PER_QUESTION} seconds to say what fires
			first. Reading the plan cold is the skill; the clock is the load.
		</p>
		<nav class="tools" data-print="hide">
			<a class="chip" href="{base}/practise">← Practise</a>
			<a class="chip" href="{base}/menu">The worksheet</a>
		</nav>
	</header>

	<article class="sheet">
		<Ornament seed="firing" />

		{#if !ready}
			<p class="empty">
				Not enough on the menu to drill yet: pin dishes until the plan holds at least three
				hands-on steps at different times. The drill builds from your pinned menu, not from an
				invented one, because the order worth rehearsing is tonight's.
			</p>
			<p><a class="chip" href="{base}/recipes">Find dishes to pin</a></p>
		{:else if done}
			<div class="result" data-grade={done.grade}>
				<p class="score">
					{done.correct} of {done.total}: <b>{done.grade}</b>
				</p>
				{#if done.grade === 'met'}
					<p>You read the plan the way the pass wrote it. Come back when the menu changes.</p>
				{:else if done.grade === 'close'}
					<p>Forming. The misses below were the tight calls: those are the ones service punishes.</p>
				{:else}
					<p>
						Read tonight's plan slowly on the worksheet first, then come back to it at speed. The
						order is not opinion; it is arithmetic.
					</p>
				{/if}
				{#if done.tight.length}
					<ul class="tight">
						{#each done.tight as t (t)}<li>{t}</li>{/each}
					</ul>
				{/if}
			</div>
			<button class="primary" onclick={start}>Run it again</button>
		{:else if run && q}
			<div class="clockrow">
				<span class="qcount">{run.at + 1} of {run.questions.length}</span>
				<span class="clock mono" class:urgent={secondsLeft <= 5}>{secondsLeft}s</span>
			</div>
			<h2 class="ask">Which starts first?</h2>
			<div class="options">
				{#each q.options as o, i (i)}
					<button
						class="option"
						disabled={run.picked !== null}
						data-state={run.picked === null
							? 'open'
							: i === q.answer
								? 'right'
								: i === run.picked
									? 'wrong'
									: 'dim'}
						onclick={() => pick(i)}
					>
						<span class="odish">{o.dish}</span>
						<span class="otext">{o.text}</span>
						{#if run.picked !== null}
							<!-- The verdict in words beside the border: "first" on the answer,
							     the time on all three, so nothing rides on colour alone. -->
							<span class="owhen mono"
								>T−{o.startsAtMin} min{#if i === q.answer}
									· first{/if}</span
							>
						{/if}
					</button>
				{/each}
			</div>
			{#if run.picked !== null}
				<button class="primary" bind:this={nextBtn} onclick={next}>
					{run.at + 1 >= run.questions.length ? 'The verdict' : 'Next'}
				</button>
			{/if}
			<p class="srlive" aria-live="polite">{announce}</p>
		{:else}
			<p class="intro">
				{QUESTIONS_PER_RUN} questions from tonight's plan, {SECONDS_PER_QUESTION} seconds each. A
				timeout is a wrong answer; on the line, not deciding is a decision.
			</p>
			<button class="primary" onclick={start}>Start</button>
		{/if}
	</article>
</div>

<style>
	.empty,
	.intro {
		font-size: var(--t-small);
		color: var(--ink-soft);
		max-width: var(--measure);
		margin: 0 0 12px;
	}
	.clockrow {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 6px;
	}
	.qcount {
		font-size: var(--t-small);
		color: var(--ink-soft);
	}
	.clock {
		font-size: var(--t-lede);
		color: var(--ink);
	}
	/* Urgency is carried by the NUMBER falling, reinforced by weight, never by
	   colour alone. */
	.clock.urgent {
		font-weight: 700;
		color: var(--chili);
	}
	.ask {
		font-family: var(--display);
		font-size: var(--t-lede);
		margin: 0 0 10px;
		color: var(--ink);
	}
	.options {
		display: grid;
		gap: 8px;
		margin-bottom: 12px;
	}
	.option {
		text-align: left;
		padding: 10px 12px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--card);
		color: var(--ink);
		cursor: pointer;
		display: grid;
		gap: 2px;
	}
	.option:hover:not(:disabled),
	.option:focus-visible {
		border-color: var(--ink-soft);
	}
	.odish {
		font-family: var(--display);
		font-size: var(--t-small);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--ink-soft);
	}
	.otext {
		font-size: var(--t-small);
	}
	.owhen {
		font-size: var(--t-micro);
		color: var(--ink-soft);
	}
	/* The verdict is words (T−N min) AND a border; colour is the third voice. */
	.option[data-state='right'] {
		border-color: var(--turmeric-deep);
		border-width: 2px;
	}
	.option[data-state='wrong'] {
		border-color: var(--chili);
		border-width: 2px;
	}
	.option[data-state='dim'] {
		opacity: 0.75;
	}
	.result {
		margin-bottom: 12px;
	}
	.score {
		font-family: var(--display);
		font-size: var(--t-lede);
		color: var(--ink);
		margin: 0 0 6px;
	}
	.result p {
		font-size: var(--t-small);
		color: var(--ink-soft);
		max-width: var(--measure);
		margin: 0 0 8px;
	}
	.tight {
		list-style: none;
		margin: 0 0 8px;
		padding: 0;
		font-size: var(--t-small);
		color: var(--ink-soft);
	}
	.tight li {
		margin-bottom: 3px;
	}
	.primary {
		font: inherit;
		padding: 8px 16px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--paper-raised);
		color: var(--ink);
		cursor: pointer;
	}
	.primary:hover,
	.primary:focus-visible {
		border-color: var(--ink-soft);
	}
	.mono {
		font-variant-numeric: tabular-nums;
	}
	.srlive {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		margin: 0;
	}
</style>
