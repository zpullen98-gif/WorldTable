<!--
  One multiple choice question of a Cuisine round: the question, its four
  options, and once one is picked which was right and why. The quick quiz's
  question, in Cuisine's words; the page records the grade and moves on.
-->
<script lang="ts">
	let {
		stem,
		options,
		answer,
		why,
		picked,
		onPick
	}: {
		stem: string;
		options: string[];
		answer: string;
		why: string;
		picked: string | null;
		onPick: (option: string) => void;
	} = $props();
</script>

<div class="flash">
	<p class="stem">{stem}</p>
	<div class="opts" role="group" aria-label="The options">
		{#each options as o (o)}
			<button
				type="button"
				class="opt"
				class:right={picked !== null && o === answer}
				class:wrong={picked === o && o !== answer}
				disabled={picked !== null && o !== picked && o !== answer}
				onclick={() => onPick(o)}
				>{o}{#if picked !== null && o === answer}<span class="mark">, the answer</span>{:else if picked === o}<span class="mark">, your answer</span>{/if}</button
			>
		{/each}
	</div>
	{#if picked !== null}
		<p class="answer" role="status">
			<b>{picked === answer ? 'Right.' : 'Not that one.'}</b>
			Answer: {answer}. <span class="why">{why}</span>
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
	.opts {
		display: grid;
		gap: 8px;
		margin: 14px 0;
	}
	.opt {
		text-align: left;
		border: 1px solid var(--line);
		background: var(--paper, transparent);
		color: var(--ink);
		border-radius: var(--radius);
		padding: 10px 14px;
		cursor: pointer;
		font-family: var(--display);
		font-size: 1.0625rem;
		line-height: 1.4;
		min-height: 48px;
	}
	.opt:hover:not(:disabled) {
		border-color: var(--turmeric);
	}
	.opt.right {
		border-color: var(--leaf);
		border-width: 2px;
	}
	.opt.wrong {
		border-color: var(--chili);
		border-width: 2px;
	}
	.opt:disabled {
		opacity: 0.6;
		cursor: default;
	}
	.mark {
		font-family: var(--text);
		font-size: 1rem;
		color: var(--ink-soft);
	}
	.answer {
		font-size: var(--t-body);
		max-width: var(--measure);
		margin: 6px 0 4px;
	}
	.why {
		color: var(--ink-soft);
	}
</style>
