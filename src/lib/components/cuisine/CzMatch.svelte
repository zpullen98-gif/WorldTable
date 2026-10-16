<!--
  Family matching: one set of pairs, the right column shuffled. Tap an item
  on the left, then its partner on the right, to pair them; tap a paired item
  on either side to undo its pair. Check grades every row and shows the right
  partner beside each one paired wrongly. Generated sets (small sauce to
  mother, roux colour to dish, Brennan's dish to sauce) and authored ones are
  drawn alike.
-->
<script lang="ts">
	import type { CzLink, CzMatchSet, MatchResult } from '$lib/cuisine';

	let {
		set,
		order,
		links,
		result,
		onPair,
		onUnpair,
		onCheck
	}: {
		set: CzMatchSet;
		/** The right column's order: indexes into the pairs. */
		order: number[];
		links: CzLink[];
		result: MatchResult | null;
		onPair: (left: number, right: number) => void;
		onUnpair: (side: 'left' | 'right', index: number) => void;
		onCheck: () => void;
	} = $props();

	/** The left item waiting for its partner. */
	let sel = $state<number | null>(null);
	$effect(() => {
		void set.id;
		sel = null;
	});

	const rightOf = $derived(new Map(links.map(([l, r]) => [l, r])));
	const leftOf = $derived(new Map(links.map(([l, r]) => [r, l])));
	const wrong = $derived(new Set(result?.wrong ?? []));
	const done = $derived(links.length === set.pairs.length);

	function tapLeft(l: number) {
		if (result) return;
		if (rightOf.has(l) && sel === null) {
			onUnpair('left', l);
			return;
		}
		sel = sel === l ? null : l;
	}

	function tapRight(r: number) {
		if (result) return;
		if (sel !== null) {
			onPair(sel, r);
			sel = null;
			return;
		}
		if (leftOf.has(r)) onUnpair('right', r);
	}
</script>

<div class="flash match">
	<p class="stem">{set.prompt}</p>
	{#if !result}
		<p class="hint" aria-live="polite">
			{#if sel !== null}Now tap its partner under {set.right}.{:else}Tap an item under {set.left}, then its partner under {set.right}. Tap a pair again to undo it.{/if}
		</p>
	{/if}
	<div class="cols">
		<div class="col">
			<h3 class="sub" id="left-{set.id}">{set.left}</h3>
			<ul aria-labelledby="left-{set.id}">
				{#each set.pairs as p, l (l)}
					{@const r = rightOf.get(l)}
					<li class:right={result && !wrong.has(l)} class:wrong={result && wrong.has(l)}>
						<button
							type="button"
							class="item"
							class:paired={r !== undefined}
							aria-pressed={sel === l}
							disabled={!!result}
							onclick={() => tapLeft(l)}
						>
							<span class="text">{p[0]}</span>
							{#if r !== undefined}<span class="with">With {set.pairs[r][1]}</span>{/if}
						</button>
						{#if result && wrong.has(l)}<p class="should">Its partner: {p[1]}</p>{/if}
					</li>
				{/each}
			</ul>
		</div>
		<div class="col">
			<h3 class="sub" id="right-{set.id}">{set.right}</h3>
			<ul aria-labelledby="right-{set.id}">
				{#each order as r (r)}
					<li>
						<button type="button" class="item" class:paired={leftOf.has(r)} disabled={!!result} onclick={() => tapRight(r)}>
							<span class="text">{set.pairs[r][1]}</span>
							{#if leftOf.has(r)}<span class="with">Paired</span>{/if}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	</div>
	{#if !result}
		<button type="button" class="chip go check" disabled={!done} onclick={onCheck}>Check the pairs</button>
	{:else}
		<p class="answer" role="status">
			<b>{result.right ? 'Right.' : 'Not quite.'}</b>
			{#if !result.right}{result.wrong.length} of {set.pairs.length} paired wrongly.{/if}
		</p>
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
	.hint {
		font-size: 1rem;
		color: var(--ink-soft);
		margin: 4px 0;
	}
	.cols {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	.col {
		min-width: 0;
	}
	.sub {
		font-family: var(--house-display, var(--display));
		font-size: 0.9375rem;
		font-weight: 500;
		letter-spacing: 0.06em;
		color: var(--turmeric-deep);
		margin: 14px 0 6px;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 6px;
	}
	.item {
		display: flex;
		flex-direction: column;
		gap: 2px;
		width: 100%;
		min-height: 48px;
		text-align: left;
		border: 1px solid var(--line);
		background: var(--paper, transparent);
		color: var(--ink);
		border-radius: var(--radius);
		padding: 10px 12px;
		cursor: pointer;
		font: inherit;
		font-size: 1.0625rem;
		line-height: 1.35;
		overflow-wrap: anywhere;
	}
	.item:hover:not(:disabled) {
		border-color: var(--turmeric);
	}
	.item[aria-pressed='true'] {
		border-color: var(--turmeric-deep);
		border-width: 2px;
	}
	.item.paired {
		border-style: dashed;
	}
	.item:disabled {
		cursor: default;
	}
	.with {
		font-size: 0.9375rem;
		color: var(--ink-soft);
	}
	li.right .item {
		border-color: var(--leaf);
		border-width: 2px;
		border-style: solid;
	}
	li.wrong .item {
		border-color: var(--chili);
		border-width: 2px;
		border-style: solid;
	}
	.should {
		font-size: 1rem;
		color: var(--ink-soft);
		margin: 4px 0 2px;
	}
	.check {
		margin-top: 14px;
		min-height: 48px;
	}
	.answer {
		font-size: var(--t-body);
		margin: 14px 0 4px;
	}
	@media (max-width: 599px) {
		.flash {
			padding: 16px 14px;
		}
		.cols {
			gap: 8px;
		}
		.item {
			padding: 10px;
			font-size: 1rem;
		}
	}
</style>
