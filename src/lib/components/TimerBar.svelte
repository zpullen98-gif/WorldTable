<script lang="ts">
	import { timers, formatClock } from '$lib/stores/timers.svelte';

	/**
	 * What is still on the heat, everywhere in the app.
	 *
	 * Cook mode owns the timer for the step you are looking at; this owns every
	 * timer once you have walked away from it, which is the whole point, since
	 * closing cook mode does not take the pot off the stove.
	 *
	 * It renders nothing at all when nothing is running, so it costs a mounted
	 * component and no pixels the rest of the time.
	 */
	const list = $derived(timers.active);

	/**
	 * A timer that is not attached to a recipe.
	 *
	 * The rice. The refire on table 12. The Barolo that needs forty minutes in
	 * the decanter. None of those are recipe steps, and `timers.start` had
	 * exactly ONE call site in the whole app, cook mode's, so every cook on
	 * the line used their phone, which is the thing this was meant to replace,
	 * and the bar honestly showed two of the five pots actually running.
	 *
	 * No store change was needed for this: `start()` already takes
	 * { label, seconds } with recipeSlug and stepIndex optional.
	 *
	 * COUNTDOWN ONLY, and that is not a simplification. `get active()` filters on
	 * `endsAt != null || rang`, so a count-up timer would never appear in this
	 * bar at all, and `#tick` stops the ticker when nothing carries an endsAt, so
	 * a lone one would freeze on its first tick.
	 */
	const PRESETS = [3, 5, 10, 20, 40];
	let adding = $state(false);
	let label = $state('');
	let minutes = $state('');
	let editing = $state<string | null>(null);

	function open() {
		adding = true;
		label = '';
		minutes = '';
	}

	function begin(mins: number) {
		const m = Number(mins);
		if (!Number.isFinite(m) || m <= 0) return;
		// A blank label is better than a fabricated one: the cook knows what the
		// pot is, and "Timer" at least does not claim to be something else.
		timers.start({ label: label.trim().slice(0, 24) || 'Timer', seconds: Math.round(m * 60) });
		adding = false;
	}

	/**
	 * When this one goes off.
	 *
	 * Two pots called "T12" is a real situation and renaming them for the cook
	 * would be worse. The deadline disambiguates them AND says which fires
	 * first, which the start time does not.
	 */
	const goesOffAt = (t: { endsAt: number | null; paused: number | null }) => {
		if (t.endsAt == null) return '';
		const d = new Date(t.endsAt);
		return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
	};
</script>

<!-- App chrome: a printed recipe should not carry a countdown across it. -->
<div class="bar" role="status" aria-label="Kitchen timers" data-print="hide">
	{#if list.length}
		{#each list as t (t.id)}
			{@const left = timers.remaining(t)}
			<div class="timer" class:rang={t.rang}>
				{#if editing === t.id}
					<input
						class="lab"
						value={t.label}
						maxlength="24"
						aria-label="Rename this timer"
						onblur={(e) => {
							timers.rename(t.id, e.currentTarget.value);
							editing = null;
						}}
						onkeydown={(e) => {
							if (e.key === 'Enter') e.currentTarget.blur();
							if (e.key === 'Escape') editing = null;
						}}
					/>
				{:else}
					<button class="label" onclick={() => (editing = t.id)} title="Rename">
						{t.label}
						{#if goesOffAt(t)}<span class="at">till {goesOffAt(t)}</span>{/if}
					</button>
				{/if}
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
	{/if}

	{#if adding}
		<div class="timer add">
			<input
				class="lab"
				placeholder="The rice"
				maxlength="24"
				bind:value={label}
				aria-label="What this timer is for"
			/>
			<div class="presets" role="group" aria-label="Timer length">
				{#each PRESETS as m (m)}
					<button class="act" onclick={() => begin(m)} aria-label="{m} minutes">{m}</button>
				{/each}
				<input
					class="mins"
					type="number"
					min="1"
					max="720"
					placeholder="min"
					bind:value={minutes}
					aria-label="Minutes"
					onkeydown={(e) => {
						if (e.key === 'Enter') begin(Number(minutes));
					}}
				/>
				<button class="act" onclick={() => begin(Number(minutes))} disabled={!Number(minutes)}>
					Start
				</button>
			</div>
			<!--
				Said on the timer's own face, because it will otherwise be believed.
				ring() is Web Audio with a documented "audio is a courtesy, never a
				dependency" catch, there is no OS notification, and there is no wake
				lock outside cook mode. A long clock on a tablet locked at 9pm will
				not alert anybody.
			-->
			<p class="warn">Rings only while the app is open on this device.</p>
			<button class="x" onclick={() => (adding = false)} aria-label="Cancel">✕</button>
		</div>
	{:else}
		<button class="addbtn" onclick={open} aria-label="Start a timer">
			+ Timer
		</button>
	{/if}
</div>

<style>
	/* 32px targets kept: this is tapped one-handed beside a pan. */
	.addbtn {
		align-self: flex-end;
		background: var(--card);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius);
		box-shadow: var(--shadow-lift);
		color: var(--ink-soft);
		cursor: pointer;
		font: inherit;
		font-size: var(--t-small, 0.8125rem);
		min-height: 32px;
		padding: 4px 12px;
	}
	.addbtn:hover {
		border-color: var(--turmeric);
		color: var(--ink);
	}
	.add {
		flex-wrap: wrap;
	}
	.lab {
		background: none;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		color: inherit;
		font: inherit;
		min-height: 32px;
		padding: 4px 8px;
		width: 14ch;
	}
	.presets {
		display: flex;
		gap: 4px;
		align-items: center;
		flex-wrap: wrap;
	}
	.mins {
		background: none;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		color: inherit;
		font: inherit;
		min-height: 32px;
		padding: 4px 6px;
		width: 6ch;
	}
	.warn {
		flex-basis: 100%;
		margin: 0;
		color: var(--ink-soft);
		font-size: var(--t-micro, 0.6875rem);
	}
	.at {
		color: var(--muted);
		margin-left: 6px;
	}
	button.label {
		background: none;
		border: 0;
		color: inherit;
		cursor: pointer;
		font: inherit;
		padding: 0;
		text-align: left;
	}
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
