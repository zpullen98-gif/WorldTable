<script lang="ts">
	import { base } from '$app/paths';
	import { session } from '$lib/stores/session.svelte';
	import {
		layOutRun,
		slugFor,
		nextLevel,
		levelReached,
		cleared,
		verdictFor,
		type CalibrationLadder
	} from '$lib/calibration';
	import Ornament from '$lib/components/Ornament.svelte';

	/**
	 * The calibration bench.
	 *
	 * Every cook-side measure in this product is the cook grading themselves.
	 * This is the one thing a cook standing alone genuinely cannot do: hold the
	 * answer, and it is the only reason this is a feature rather than advice.
	 *
	 * The guide's own protocol entry asks for exactly this: taste COMPARATIVELY,
	 * and taste single ingredients at their extremes, "to calibrate the
	 * instruments". The concentrations are ours; see the apparatus note below.
	 */
	let { data } = $props();
	const cal = $derived(data.calibration);

	let ladder = $state<CalibrationLadder | null>(null);
	let run = $state<Array<{ odd: number }>>([]);
	let at = $state(0);
	let answers = $state<number[]>([]);
	let done = $state(false);

	const level = $derived(ladder ? nextLevel(session.calibrationLog, ladder) : null);
	const right = $derived(answers.filter((a, i) => a === run[i]?.odd).length);

	function begin(l: CalibrationLadder) {
		ladder = l;
		// The whole run is laid out AT ONCE, so the sequence cannot react to how
		// the cook is doing. An instrument that adapts mid-run is a staircase.
		run = layOutRun(cal.trials, cal.cups);
		at = 0;
		answers = [];
		done = false;
	}

	/** What assistive tech hears per trial: the visual state swap was silent. */
	let announce = $state('');

	function answer(cup: number) {
		if (done || !ladder) return;
		answers = [...answers, cup];
		announce =
			answers.length >= run.length
				? 'Run finished: the verdict is on screen.'
				: `Trial ${answers.length} recorded. Trial ${answers.length + 1} of ${run.length}.`;
		if (answers.length >= run.length) {
			// ONE entry per RUN, never per trial: a single triangle trial is a
			// 1-in-3 guess and logging it as "met" would be worth nothing.
			const got = answers.filter((a, i) => a === run[i].odd).length;
			session.markCalibrated(
				slugFor(ladder.taste, level!.level),
				cleared(got, cal.passAt) ? 'met' : got <= Math.ceil(run.length / 3) ? 'missed' : 'close'
			);
			done = true;
		} else {
			at = answers.length;
		}
	}

	const cups = $derived(Array.from({ length: cal.cups }, (_, i) => i));
	const letter = (i: number) => String.fromCharCode(65 + i);
</script>

<svelte:head><title>Calibrate: The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<h1>Calibrate</h1>
		<p class="lede">
			Three cups. Two are the same, one is not, and the app knows which: the one thing you cannot
			do for yourself standing at a bench alone.
		</p>
		<nav class="tools" data-print="hide">
			<a class="chip" href="{base}/practise">← Practise</a>
			<a class="chip" href="{base}/palate">The palate</a>
		</nav>
	</header>

	<article class="sheet">
		<Ornament seed="calibrate" />

		{#if !ladder}
			<p class="intro">
				The most repeated conversation in a kitchen is “this is under-seasoned”, said for six
				months to somebody who cannot yet taste the difference at that concentration. That is a
				threshold, not an attitude, and no amount of telling fixes it.
			</p>

			<ul class="ladders">
				{#each cal.ladders as l (l.taste)}
					{@const reached = levelReached(session.calibrationLog, l.taste)}
					<li>
						<button class="pick" onclick={() => begin(l)}>
							<span class="nm">{l.label}</span>
							<span class="sub">{l.substance} into {l.per}</span>
							<span class="rung">
								{#if reached}Level {reached} cleared{:else}Not started{/if}
							</span>
						</button>
					</li>
				{/each}
			</ul>

			<!--
				The disclosure sanitation.mjs gives its 4-60°C conflict: say whose
				number it is, where the number is. These are apparatus, two cups
				chosen to be discriminable: not a statement of correct seasoning and
				not a house spec.
			-->
			<h2 class="sec">About the numbers</h2>
			<p class="note">
				These concentrations are <b>ours</b>, chosen so that two cups are tellable apart at a
				stated difficulty. The guide states 5–8% for a wet brine and 2–3% for lacto-fermentation
				and says nothing at all about seasoning, so nothing here is the guide's figure, a
				statement of correct seasoning, or a house spec. An eye chart's letters are chosen to be
				legible at a distance; the chart is not an opinion about what you should be reading.
			</p>
			<p class="note">
				And the honest limit: <b>this measures your palate only if you build the cups truthfully.</b>
				Weigh them, mix them fully, and have somebody else pour if you can.
			</p>
		{:else if !done}
			{@const lv = level!}
			<p class="eyebrow">{ladder.label} · level {lv.level} · trial {at + 1} of {run.length}</p>

			<div class="build">
				<h2 class="sec">Build</h2>
				<p>
					<b>Jug one</b>
					{lv.base}{ladder.unit} of {ladder.substance} into {ladder.per}.
					<b>Jug two</b>
					{lv.odd}{ladder.unit} into the same.
				</p>
				<p class="note">{ladder.note}</p>
				<p class="note">
					Pour three cups (two from one jug, one from the other) and shuffle them so you do not
					know which is which. Then tap the odd one.
				</p>
			</div>

			<div class="cups">
				{#each cups as c (c)}
					<button class="cup" onclick={() => answer(c)}>{letter(c)}</button>
				{/each}
			</div>
			<p class="note">
				No feedback until the run ends: being told after each cup would let you learn the cups
				rather than the taste.
			</p>
		{:else}
			{@const lv = level!}
			<p class="eyebrow">{ladder.label} · level {lv.level}</p>
			<p class="verdict">{verdictFor(right, run.length, cal.passAt)}</p>
			<ol class="review">
				{#each run as t, i (i)}
					<li class:hit={answers[i] === t.odd}>
						Trial {i + 1}: the odd cup was <b>{letter(t.odd)}</b>{answers[i] === t.odd
							? ''
							: `: you said ${letter(answers[i])}`}
					</li>
				{/each}
			</ol>
			<div class="acts">
				<button class="chip go" onclick={() => begin(ladder!)}>Run it again</button>
				<button class="chip" onclick={() => (ladder = null)}>Another ladder</button>
			</div>
		{/if}
	</article>
	<p class="srlive" aria-live="polite">{announce}</p>
</div>

<style>
	.srlive {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		margin: 0;
	}
	.head {
		padding: 26px 0 10px;
	}
	.lede {
		max-width: var(--measure);
		color: var(--ink-soft);
	}
	.tools,
	.acts {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		margin-top: 12px;
	}
	.intro,
	.note {
		max-width: var(--measure);
		color: var(--ink-soft);
		line-height: 1.6;
	}
	.note {
		font-size: var(--t-small, 0.8125rem);
		margin: 8px 0 0;
	}
	.ladders {
		list-style: none;
		margin: 16px 0;
		padding: 0;
		display: grid;
		gap: 8px;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
	}
	.pick {
		display: flex;
		flex-direction: column;
		gap: 2px;
		width: 100%;
		min-height: 64px;
		padding: 12px 14px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: none;
		font: inherit;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}
	.pick:hover {
		border-color: var(--turmeric);
	}
	.nm {
		font-weight: 600;
	}
	.sub,
	.rung {
		color: var(--ink-soft);
		font-size: var(--t-small, 0.8125rem);
	}
	.rung {
		color: var(--turmeric-deep);
	}
	.build {
		margin: 10px 0 18px;
	}
	.cups {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		margin: 10px 0;
	}
	/* Large on purpose: tapped with wet hands, at a bench, looking at cups. */
	.cup {
		flex: 1 1 90px;
		min-height: 72px;
		font-family: var(--display);
		font-size: 1.8rem;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius);
		background: none;
		color: inherit;
		cursor: pointer;
	}
	.cup:hover {
		border-color: var(--turmeric);
	}
	.verdict {
		font-family: var(--display);
		font-size: var(--t-h3, 1.5rem);
		margin: 6px 0 12px;
	}
	.review {
		margin: 0;
		padding-left: 1.2em;
		color: var(--ink-soft);
		line-height: 1.7;
	}
	.review li.hit {
		color: var(--ink);
	}
</style>
