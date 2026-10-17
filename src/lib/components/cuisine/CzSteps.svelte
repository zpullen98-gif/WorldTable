<!--
  Order the steps: the stages of one method, shuffled, to be put in order.
  Tap a stage to place it at the end of your order; tap a placed stage to take
  it back. When a stage does not belong, the prompt says so and it must be
  left out. Check grades it exact: right only when every stage is in its
  place, and the places that are wrong are named, with the order beside it.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import type { CzStepsSet, StepsResult } from '$lib/cuisine';

	let {
		set,
		pool,
		placed,
		result,
		onPlace,
		onRemove,
		onCheck
	}: {
		set: CzStepsSet;
		/** The stages as dealt, the stray one among them. */
		pool: string[];
		/** Pool indexes, in the order placed. */
		placed: number[];
		/** The grade once checked, else null. */
		result: StepsResult | null;
		onPlace: (poolIndex: number) => void;
		onRemove: (position: number) => void;
		onCheck: () => void;
	} = $props();

	const need = $derived(set.steps.length);
	const left = $derived(pool.map((text, i) => ({ text, i })).filter((x) => !placed.includes(x.i)));
	const wrongAt = $derived(new Set(result?.wrong ?? []));

	/* Placing or taking back a stage removes the button that was pressed, so
	   focus goes on to the first stage still to place, or to Check once every
	   place is filled, never back to the start of the page. */
	let poolEl: HTMLUListElement | undefined = $state();
	let checkEl: HTMLButtonElement | undefined = $state();
	async function moved() {
		await tick();
		(poolEl?.querySelector<HTMLButtonElement>('button:not(:disabled)') ?? checkEl)?.focus();
	}

	/** "positions 2 and 5", counted from 1 as a cook counts. */
	function places(list: readonly number[]): string {
		const n = list.map((i) => String(i + 1));
		if (n.length === 1) return `place ${n[0]}`;
		return `places ${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`;
	}
</script>

<div class="flash steps">
	<p class="stem">{set.prompt}</p>
	{#if set.distractor}<p class="hint">One step does not belong: leave it out.</p>{/if}

	<h2 class="sub" id="order-{set.id}">Your order, {placed.length} of {need}</h2>
	{#if placed.length}
		<ol class="order" aria-labelledby="order-{set.id}">
			{#each placed as p, pos (p)}
				<li class:wrong={result && wrongAt.has(pos)} class:right={result && !wrongAt.has(pos)}>
					<button type="button" class="stage" disabled={!!result} onclick={() => { onRemove(pos); void moved(); }} aria-label="Take back from place {pos + 1}: {pool[p]}">
						<span class="num" aria-hidden="true">{pos + 1}.</span>
						<span class="text">{pool[p]}</span>
					</button>
					{#if result && wrongAt.has(pos)}<p class="should">Here: {set.steps[pos] ?? 'nothing'}</p>{/if}
				</li>
			{/each}
		</ol>
	{:else}
		<p class="hint">Tap the first stage below.</p>
	{/if}

	{#if !result}
		<h2 class="sub" id="pool-{set.id}">The stages</h2>
		{#if left.length}
			<ul class="pool" aria-labelledby="pool-{set.id}" bind:this={poolEl}>
				{#each left as s (s.i)}
					<li>
						<button type="button" class="stage" disabled={placed.length >= need} onclick={() => { onPlace(s.i); void moved(); }} aria-label="Place next: {s.text}">
							<span class="text">{s.text}</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
		<button type="button" class="chip go check" disabled={placed.length < need} onclick={onCheck} bind:this={checkEl}>Check the order</button>
	{:else}
		<p class="answer" role="status">
			<b>{result.right ? 'Right.' : 'Not quite.'}</b>
			{#if !result.right && result.wrong.length}{result.wrong.length === 1 ? 'The wrong stage is in' : 'The wrong stages are in'} {places(result.wrong)}.{/if}
			{#if result.intruder}The stage that does not belong was placed.{/if}
		</p>
		<h2 class="sub">The order</h2>
		<ol class="key">
			{#each set.steps as s, i (i)}<li>{s}</li>{/each}
		</ol>
		{#if set.distractor}<p class="note">Not a stage: {set.distractor}</p>{/if}
		<p class="why">{set.why}</p>
	{/if}
</div>

<style>
	.flash {
		border: 1px solid var(--line);
		background: var(--card);
		border-radius: var(--radius);
		padding: 18px 20px;
		margin-top: 10px;
		max-width: 760px;
	}
	.stem {
		font-family: var(--display);
		font-size: 1.25rem;
		line-height: 1.45;
		margin: 0 0 6px;
	}
	.hint,
	.note {
		font-size: 1rem;
		color: var(--ink-soft);
		margin: 4px 0;
	}
	.sub {
		font-family: var(--house-display, var(--display));
		font-size: 0.9375rem;
		font-weight: 500;
		letter-spacing: 0.06em;
		color: var(--turmeric-deep);
		margin: 16px 0 6px;
	}
	.order,
	.pool {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 6px;
	}
	.stage {
		display: flex;
		gap: 8px;
		align-items: baseline;
		width: 100%;
		min-height: 48px;
		text-align: left;
		border: 1px solid var(--line);
		background: var(--paper, transparent);
		color: var(--ink);
		border-radius: var(--radius);
		padding: 10px 14px;
		cursor: pointer;
		font: inherit;
		font-size: 1.0625rem;
		line-height: 1.4;
	}
	.stage:hover:not(:disabled) {
		border-color: var(--turmeric);
	}
	.stage:disabled {
		cursor: default;
	}
	.pool .stage:disabled {
		opacity: 0.6;
	}
	.num {
		font-variant-numeric: tabular-nums;
		color: var(--turmeric-deep);
	}
	.order li.right .stage {
		border-color: var(--leaf);
		border-width: 2px;
	}
	.order li.wrong .stage {
		border-color: var(--chili);
		border-width: 2px;
	}
	.should {
		font-size: 1rem;
		color: var(--ink-soft);
		margin: 4px 0 2px 14px;
	}
	.check {
		margin-top: 14px;
		min-height: 48px;
	}
	.answer {
		font-size: var(--t-body);
		max-width: var(--measure);
		margin: 14px 0 4px;
	}
	.key {
		margin: 0;
		padding-left: 1.4em;
		font-size: var(--t-body);
		line-height: 1.5;
		max-width: var(--measure);
	}
	.why {
		font-size: 1rem;
		color: var(--ink-soft);
		max-width: var(--measure);
		margin: 8px 0 0;
	}
</style>
