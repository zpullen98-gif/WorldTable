<script lang="ts">
	import { timers, formatClock } from '$lib/stores/timers.svelte';

	/**
	 * What is still on the heat, everywhere in the app.
	 *
	 * Cook mode owns the timer for the step you are looking at; this owns every
	 * timer once you have walked away from it — which is the whole point, since
	 * closing cook mode does not take the pot off the stove.
	 *
	 * It renders nothing at all when nothing is running, so it costs a mounted
	 * component and no pixels the rest of the time.
	 */
	const list = $derived(timers.active);
</script>

{#if list.length}
	<!-- App chrome: a printed recipe should not carry a countdown across it. -->
	<div class="bar" role="status" aria-label="Kitchen timers" data-print="hide">
		{#each list as t (t.id)}
			{@const left = timers.remaining(t)}
			<div class="timer" class:rang={t.rang}>
				<span class="label">{t.label}</span>
				<span class="clock">{t.rang ? 'Time' : formatClock(left)}</span>

				{#if t.rang}
					<button class="act" onclick={() => timers.dismiss(t.id)}>Dismiss</button>
				{:else if t.paused != null}
					<button class="act" onclick={() => timers.resume(t.id)}>Resume</button>
				{:else}
					<button class="act" onclick={() => timers.pause(t.id)}>Pause</button>
				{/if}
				<button
					class="x"
					onclick={() => timers.dismiss(t.id)}
					aria-label="Remove the {t.label} timer"
				>
					✕
				</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	.bar {
		position: fixed;
		left: 50%;
		transform: translateX(-50%);
		/* Above the safe-area inset, so it clears a phone's home indicator. */
		bottom: calc(12px + env(safe-area-inset-bottom, 0px));
		z-index: 70;
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-width: min(520px, calc(100vw - 24px));
		width: max-content;
	}

	.timer {
		display: flex;
		align-items: center;
		gap: 10px;
		background: var(--card);
		border: 1px solid var(--line-strong);
		border-left: 3px solid var(--turmeric);
		border-radius: var(--radius);
		box-shadow: var(--shadow-lift);
		padding: 8px 10px 8px 12px;
		font-size: var(--t-small);
	}
	.timer.rang {
		border-left-color: var(--chili);
		border-color: var(--chili);
	}

	.label {
		max-width: 22ch;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--ink-soft);
	}
	.clock {
		font-family: var(--display);
		font-size: 1.15rem;
		font-variant-numeric: tabular-nums;
		color: var(--turmeric-deep);
		min-width: 3.5ch;
		text-align: right;
	}
	.timer.rang .clock {
		color: var(--chili);
	}

	.act,
	.x {
		border: 1px solid var(--line);
		background: none;
		color: var(--ink-soft);
		border-radius: var(--radius);
		cursor: pointer;
		font: inherit;
		/* Kitchen-thumb targets, not 9px dots. */
		min-height: 32px;
		padding: 0 10px;
	}
	.x {
		width: 32px;
		padding: 0;
	}
	.act:hover,
	.x:hover {
		border-color: var(--turmeric);
		color: var(--ink);
	}
</style>
