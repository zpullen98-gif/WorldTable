<script lang="ts">
	import { onMount } from 'svelte';
	import type { Step } from '$lib/types';
	import { acquireWakeLock } from '$lib/wakeLock';

	let {
		name,
		steps,
		onclose,
		onfinish
	}: {
		name: string;
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

	/* ---- timer ----------------------------------------------------------
	 * Seeded from the step's precomputed durationSec (parsed at build time from
	 * "simmer 20 min" phrasing — the original re-parsed it on every step render,
	 * L3407). Steps with no stated duration offer no timer, rather than the
	 * original's fabricated 4-minute default.
	 *
	 * A DEADLINE, never a decrementing counter. The old timer was
	 * `setInterval(() => remaining -= 1, 1000)` and read no clock at all, so the
	 * number on screen was the count of callbacks delivered — a backgrounded tab
	 * (iOS suspends JS outright, Chrome throttles hard) lost real minutes and the
	 * alarm never fired. A kitchen timer that under-reports is a burnt dish.
	 */
	let endsAt = $state<number | null>(null);
	let remaining = $state<number | null>(null);
	let running = $state(false);
	let elapsed = $state(false);
	let ticker: ReturnType<typeof setInterval> | undefined;

	function clearTicker() {
		if (ticker) clearInterval(ticker);
		ticker = undefined;
	}

	/** Recompute from the wall clock. Safe to call at any time, from anywhere. */
	function sync() {
		if (endsAt == null) return;
		const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
		remaining = left;
		if (left === 0) {
			clearTicker();
			running = false;
			endsAt = null;
			elapsed = true;
		}
	}

	function startTimer() {
		if (remaining == null || remaining <= 0) return;
		endsAt = Date.now() + remaining * 1000;
		running = true;
		elapsed = false;
		clearTicker();
		// 250ms so the visible second ticks over promptly; correctness comes from
		// the deadline, not the interval, so the rate is only about smoothness.
		ticker = setInterval(sync, 250);
	}

	function pauseTimer() {
		if (endsAt != null) remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
		clearTicker();
		running = false;
		endsAt = null;
	}

	function resetTimer() {
		clearTicker();
		running = false;
		endsAt = null;
		elapsed = false;
		remaining = step?.durationSec ?? null;
	}

	// Step change resets the clock to the new step's duration.
	$effect(() => {
		void i;
		resetTimer();
	});

	const clock = $derived.by(() => {
		if (remaining == null) return null;
		const m = Math.floor(remaining / 60);
		const s = remaining % 60;
		return `${m}:${String(s).padStart(2, '0')}`;
	});

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

		// Recompute the moment we are visible again, so a phone that slept shows
		// the truth — including an alarm that fired while it was away.
		const onVisible = () => {
			if (document.visibilityState === 'visible') sync();
		};
		document.addEventListener('visibilitychange', onVisible);

		return () => {
			destroyed = true;
			document.removeEventListener('visibilitychange', onVisible);
			clearTicker();
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
				<button class="chip" onclick={resetTimer}>Time! Reset</button>
			{:else if running}
				<button class="chip" onclick={pauseTimer}>Pause</button>
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
