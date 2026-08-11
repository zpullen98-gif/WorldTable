<script lang="ts">
	import { onMount } from 'svelte';
	import type { Step } from '$lib/types';
	import { acquireWakeLock } from '$lib/wakeLock';
	import { timers, formatClock } from '$lib/stores/timers.svelte';

	let {
		name,
		slug,
		steps,
		onclose,
		onfinish
	}: {
		name: string;
		slug: string;
		steps: Step[];
		onclose: () => void;
		onfinish?: () => void;
	} = $props();

	let i = $state(0);
	const step = $derived(steps[i]);
	const last = $derived(i === steps.length - 1);

	/**
	 * A real <dialog>, opened with showModal().
	 *
	 * The overlay used to be a z-index:80 div, which could never win: the layout
	 * gives `main` a stacking context, so the sticky nav at z-index:40 painted
	 * OVER cook mode. On a phone the ✕ sat under a mode tab, and tapping it
	 * navigated you out of the recipe mid-braise, losing the step and the timer.
	 * The top layer is not part of that contest, so showModal() fixes it at the
	 * root — and brings focus containment, focus return, and Escape with it.
	 */
	let dialog = $state<HTMLDialogElement | null>(null);

	/* ---- timers ---------------------------------------------------------
	 * Seeded from the step's precomputed durationSec (parsed at build time from
	 * "simmer 20 min" phrasing — the original re-parsed it on every step render,
	 * L3407). Steps with no stated duration offer no timer, rather than the
	 * original's fabricated 4-minute default.
	 *
	 * The clock itself lives in the shared store, not here, for one reason:
	 * closing cook mode does not take the pot off the heat. A timer started on
	 * step 3 keeps running while you read step 4, while you leave to check the
	 * Lexicon, and across a reload — and rings wherever you are.
	 */
	const stepTimer = $derived(timers.find(slug, i));
	const stepSeconds = $derived(step?.durationSec ?? null);
	const remaining = $derived(stepTimer ? timers.remaining(stepTimer) : stepSeconds);
	const running = $derived(Boolean(stepTimer?.endsAt));
	const elapsed = $derived(Boolean(stepTimer?.rang));

	const clock = $derived(remaining == null ? null : formatClock(remaining));

	/** Other pots on other burners — visible without leaving the step you are on. */
	const others = $derived(timers.active.filter((t) => t.id !== stepTimer?.id));

	function startTimer() {
		if (stepSeconds == null || stepSeconds <= 0) return;
		timers.start({
			label: `${name} · step ${i + 1}`,
			seconds: stepTimer?.paused ?? stepSeconds,
			recipeSlug: slug,
			stepIndex: i
		});
	}
	function pauseTimer() {
		if (stepTimer) timers.pause(stepTimer.id);
	}
	function resumeTimer() {
		if (stepTimer) timers.resume(stepTimer.id);
	}
	function resetTimer() {
		if (stepTimer) timers.dismiss(stepTimer.id);
	}

	function next() {
		if (!last) i += 1;
	}
	function prev() {
		if (i > 0) i -= 1;
	}
	function finish() {
		onfinish?.();
		close();
	}

	/**
	 * The single exit. Closes the top-layer dialog AND tells the parent to
	 * unmount us — driven explicitly rather than through the dialog's `close`
	 * event, which did not reach the prop and left a closed dialog mounted with
	 * focus stranded on the ✕.
	 */
	let closed = false;
	function close() {
		if (closed) return;
		closed = true;
		dialog?.close();
		onclose();
	}

	/* ---- wake lock ------------------------------------------------------ */
	let awake = $state(false);
	let releaseLock: (() => void) | null = null;

	onMount(() => {
		// Where focus came from, so it can go back there. A modal <dialog> does
		// this itself, but we unmount on close, so restore it deliberately —
		// otherwise focus lands on <body> and a keyboard user loses their place.
		const opener = document.activeElement as HTMLElement | null;
		dialog?.showModal();

		// The request is async; an exit inside that window used to leak the lock
		// AND strand wakeLock.ts's visibilitychange listener, which then
		// re-acquired a screen lock on every tab return for the rest of the
		// session. Nothing the user could see or stop.
		let destroyed = false;
		void acquireWakeLock().then((release) => {
			if (!release) return;
			if (destroyed) {
				release();
				return;
			}
			releaseLock = release;
			awake = true;
		});

		// No visibilitychange handling here any more: the timer store owns the
		// clock and resyncs itself, precisely so a running timer does not depend
		// on this component still being mounted.
		return () => {
			destroyed = true;
			releaseLock?.();
			releaseLock = null;
			awake = false;
			if (opener?.isConnected) opener.focus();
		};
	});

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowRight') next();
		else if (e.key === 'ArrowLeft') prev();
		// Escape is handled here as well as via the dialog's `cancel` event.
		// Belt and braces on purpose: `cancel` is the correct native path, but it
		// does not fire in every environment (it does not fire under automation
		// here at all), and "the way out of the modal" is not a thing to leave to
		// one mechanism.
		else if (e.key === 'Escape') close();
		else return;
		e.preventDefault();
	}
</script>

<dialog
	bind:this={dialog}
	class="cook"
	aria-label="Cook mode — {name}"
	data-print="hide"
	onkeydown={onKeydown}
	oncancel={(e) => {
		// Escape. Take it through our own exit so the parent unmounts us, rather
		// than letting the UA close the dialog and leave the component mounted.
		e.preventDefault();
		close();
	}}
>
	<button class="close" onclick={close} aria-label="Exit cook mode">✕</button>

	<!--
		One live region for the thing that changes, marked atomic so a screen
		reader announces "Step 2 of 4, sweat the soffritto…" as a unit. The clock
		used to be the only live region in here, which meant the ticking seconds
		were announced every few hundred milliseconds while the step text — the
		entire content of the dialog — changed silently.
	-->
	<div class="live" aria-live="polite" aria-atomic="true">
		<p class="eyebrow">{name} · step {i + 1} of {steps.length}</p>
		<p class="step" class:alarm={elapsed}>{step?.text}</p>
	</div>

	<div class="timerrow">
		{#if clock !== null}
			<span class="clock" class:alarm={elapsed}>{clock}</span>
			{#if elapsed}
				<button class="chip" onclick={resetTimer}>Time! Clear</button>
			{:else if running}
				<button class="chip" onclick={pauseTimer}>Pause</button>
			{:else if stepTimer?.paused != null}
				<button class="chip go" onclick={resumeTimer}>Resume</button>
			{:else}
				<button class="chip go" onclick={startTimer}>Start timer</button>
			{/if}
		{:else}
			<span class="notimer">No stated time on this step — trust your senses.</span>
		{/if}
	</div>

	{#if elapsed}
		<p class="alarmnote" role="alert">Time is up.</p>
	{/if}

	{#if others.length}
		<ul class="others" aria-label="Other timers running">
			{#each others as t (t.id)}
				<li class:rang={t.rang}>
					<span class="olabel">{t.label}</span>
					<span class="oclock">{t.rang ? 'Time' : formatClock(timers.remaining(t))}</span>
					<button class="ox" onclick={() => timers.dismiss(t.id)} aria-label="Clear {t.label}">
						✕
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="nav">
		<button class="chip" onclick={prev} disabled={i === 0}>◀ Back</button>
		{#if last}
			<button class="chip go" onclick={finish}>Done — mark cooked ✓</button>
		{:else}
			<button class="chip go" onclick={next}>Next step ▶</button>
		{/if}
	</div>

	<div class="dots">
		{#each steps as _, d (d)}
			<button
				class="dot"
				class:on={d === i}
				onclick={() => (i = d)}
				tabindex="-1"
				aria-label="Go to step {d + 1}"
			></button>
		{/each}
	</div>

	{#if awake}
		<p class="awake">☀ Screen staying awake while you cook</p>
	{/if}
</dialog>

<style>
	/*
	 * `display: flex` below would otherwise beat the UA's
	 * `dialog:not([open]) { display: none }`, leaving a CLOSED dialog painted
	 * over the page as a non-modal panel with no way out.
	 */
	.cook:not([open]) {
		display: none;
	}

	.cook {
		/* A modal <dialog> is centred by the UA; we want the whole viewport. */
		position: fixed;
		inset: 0;
		width: 100%;
		max-width: 100%;
		height: 100%;
		max-height: 100%;
		border: 0;
		margin: 0;
		background: var(--paper);
		color: var(--ink);
		display: flex;
		flex-direction: column;
		align-items: center;
		/*
		 * `safe center` and overflow are the landscape fix. A fixed, centred flex
		 * box cannot be scrolled by the document, so on a long step at 568x320 the
		 * Back/Next row was centred straight out of the viewport and unreachable —
		 * no forward, no back, and a ✕ that (before the dialog) navigated away.
		 */
		justify-content: safe center;
		overflow-y: auto;
		gap: 22px;
		padding: 60px 24px 40px;
		text-align: center;
	}
	.cook::backdrop {
		background: var(--paper);
	}

	.close {
		position: absolute;
		top: 16px;
		right: 16px;
		width: 44px;
		height: 44px;
		border: 1px solid var(--line);
		background: var(--card);
		border-radius: var(--radius);
		cursor: pointer;
		font-size: 16px;
		color: var(--muted);
	}
	.close:hover {
		color: var(--chili);
		border-color: var(--chili);
	}

	.live {
		display: flex;
		flex-direction: column;
		gap: 22px;
		align-items: center;
	}

	/* The point of cook mode: one step, set huge, readable from across a
	   kitchen with your hands in a bowl. */
	.step {
		font-family: var(--display);
		font-size: clamp(1.5rem, 3.4vw + 1rem, 2.6rem);
		line-height: 1.35;
		max-width: 26ch;
		text-wrap: balance;
	}
	.step.alarm {
		color: var(--turmeric-deep);
	}

	.timerrow {
		display: flex;
		gap: 14px;
		align-items: center;
		min-height: 48px;
	}
	.clock {
		font-family: var(--display);
		font-size: 2rem;
		font-variant-numeric: tabular-nums;
		color: var(--turmeric-deep);
	}
	.clock.alarm {
		animation: pulse 1s ease infinite;
	}
	@keyframes pulse {
		50% {
			opacity: 0.25;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.clock.alarm {
			animation: none;
			text-decoration: underline;
		}
	}
	.notimer {
		font-style: italic;
		color: var(--muted);
		font-size: var(--t-small);
	}
	.alarmnote {
		font-size: var(--t-small);
		color: var(--turmeric-deep);
	}

	/* The other pots. Quiet by design — the step you are on is the headline. */
	.others {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		justify-content: center;
		max-width: 620px;
	}
	.others li {
		display: flex;
		align-items: center;
		gap: 8px;
		border: 1px solid var(--line);
		border-left: 2px solid var(--turmeric);
		border-radius: var(--radius);
		padding: 4px 4px 4px 10px;
		font-size: var(--t-small);
		color: var(--muted);
	}
	.others li.rang {
		border-color: var(--chili);
		border-left-color: var(--chili);
		color: var(--chili);
	}
	.olabel {
		max-width: 20ch;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.oclock {
		font-variant-numeric: tabular-nums;
		color: var(--turmeric-deep);
	}
	.others li.rang .oclock {
		color: var(--chili);
	}
	.ox {
		border: 1px solid var(--line);
		background: none;
		color: inherit;
		border-radius: var(--radius);
		cursor: pointer;
		width: 28px;
		min-height: 28px;
		font: inherit;
	}
	.ox:hover {
		border-color: var(--turmeric);
	}

	.nav {
		display: flex;
		gap: 12px;
	}
	.chip {
		border: 1px solid var(--line);
		background: var(--card);
		color: var(--ink);
		padding: 12px 22px;
		border-radius: var(--radius);
		cursor: pointer;
		font-size: 16px;
	}
	.chip:hover:not(:disabled) {
		border-color: var(--turmeric);
	}
	.chip:disabled {
		opacity: 0.4;
		cursor: default;
	}
	.chip.go {
		background: var(--accent-solid);
		border-color: var(--accent-solid);
		color: var(--on-accent);
	}

	.dots {
		display: flex;
		gap: 2px;
		flex-wrap: wrap;
		justify-content: center;
		max-width: 400px;
	}
	/* 9px of ink, 24px of target — a wet fingertip is not 9px wide. */
	.dot {
		width: 24px;
		height: 24px;
		border: 0;
		background: none;
		cursor: pointer;
		padding: 0;
		display: grid;
		place-items: center;
	}
	.dot::before {
		content: '';
		width: 9px;
		height: 9px;
		border-radius: 50%;
		border: 1px solid var(--line-strong);
	}
	.dot.on::before {
		background: var(--turmeric);
		border-color: var(--turmeric);
	}

	.awake {
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
	}

	/*
	 * Landscape on a phone: 320-390px of height for a step, a clock, two
	 * buttons and the dots. Tighten everything and let the step shrink.
	 */
	@media (max-height: 460px) {
		.cook {
			gap: 10px;
			padding: 44px 16px 12px;
		}
		.live {
			gap: 8px;
		}
		.step {
			font-size: clamp(1.1rem, 2.2vw + 0.7rem, 1.5rem);
			line-height: 1.25;
			max-width: 40ch;
		}
		.timerrow {
			min-height: 0;
		}
		.clock {
			font-size: 1.4rem;
		}
		.chip {
			padding: 9px 16px;
		}
		.close {
			top: 8px;
			right: 8px;
		}
		.dots {
			display: none;
		}
	}
</style>
