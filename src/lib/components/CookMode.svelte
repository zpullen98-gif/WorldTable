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

	/* ---- timer ----------------------------------------------------------
	 * Seeded from the step's precomputed durationSec (parsed at build time from
	 * "simmer 20 min" phrasing — the original re-parsed it on every step render,
	 * L3407). Steps with no stated duration simply offer no timer, rather than
	 * the original's fabricated 4-minute default.
	 */
	let remaining = $state<number | null>(null);
	let running = $state(false);
	let elapsed = $state(false);
	let interval: ReturnType<typeof setInterval> | undefined;

	function stopTimer() {
		if (interval) clearInterval(interval);
		interval = undefined;
		running = false;
	}

	function resetTimer() {
		stopTimer();
		elapsed = false;
		remaining = step?.durationSec ?? null;
	}

	function startTimer() {
		if (remaining == null || remaining <= 0) return;
		running = true;
		interval = setInterval(() => {
			if (remaining != null && remaining > 1) {
				remaining -= 1;
			} else {
				remaining = 0;
				stopTimer();
				// No audio permission games — the flash plus the title is the alarm.
				elapsed = true;
			}
		}, 1000);
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
		onclose();
	}

	/* ---- wake lock ------------------------------------------------------ */
	let awake = $state(false);
	let releaseLock: (() => void) | null = null;

	onMount(() => {
		void acquireWakeLock().then((release) => {
			if (release) {
				releaseLock = release;
				awake = true;
			}
		});

		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'ArrowRight') next();
			else if (e.key === 'ArrowLeft') prev();
			else if (e.key === 'Escape') onclose();
			else return;
			e.preventDefault();
		};
		window.addEventListener('keydown', onKey);

		return () => {
			window.removeEventListener('keydown', onKey);
			stopTimer();
			releaseLock?.();
		};
	});
</script>

<div class="cook" role="dialog" aria-modal="true" aria-label="Cook mode — {name}">
	<button class="close" onclick={onclose} aria-label="Exit cook mode">✕</button>

	<p class="eyebrow">{name} · step {i + 1} of {steps.length}</p>

	<p class="step" class:alarm={elapsed}>{step?.text}</p>

	<div class="timerrow">
		{#if clock !== null}
			<span class="clock" class:alarm={elapsed} aria-live="polite">{clock}</span>
			{#if elapsed}
				<button class="chip" onclick={resetTimer}>Time! Reset</button>
			{:else if running}
				<button class="chip" onclick={stopTimer}>Pause</button>
			{:else}
				<button class="chip go" onclick={startTimer}>Start timer</button>
			{/if}
		{:else}
			<span class="notimer">No stated time on this step — trust your senses.</span>
		{/if}
	</div>

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
</div>

<style>
	.cook {
		position: fixed;
		inset: 0;
		z-index: 80;
		background: var(--paper);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 22px;
		padding: 60px 24px 40px;
		text-align: center;
	}

	.close {
		position: absolute;
		top: 16px;
		right: 16px;
		width: 40px;
		height: 40px;
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
	.notimer {
		font-style: italic;
		color: var(--muted);
		font-size: var(--t-small);
	}

	.nav {
		display: flex;
		gap: 12px;
	}
	.chip {
		border: 1px solid var(--line);
		background: var(--card);
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
		background: var(--turmeric);
		border-color: var(--turmeric);
		color: var(--paper);
	}

	.dots {
		display: flex;
		gap: 7px;
		flex-wrap: wrap;
		justify-content: center;
		max-width: 400px;
	}
	.dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		border: 1px solid var(--line-strong);
		background: none;
		cursor: pointer;
		padding: 0;
	}
	.dot.on {
		background: var(--turmeric);
		border-color: var(--turmeric);
	}

	.awake {
		position: absolute;
		bottom: 14px;
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
	}

	@media print {
		.cook {
			display: none;
		}
	}
</style>
