<script lang="ts">
	/**
	 * A printer's flower. The original used a bare ❦ and ❧ on the guest menu
	 * (L3583, L3591); here the mark varies per chapter so a page has its own
	 * small identity, chosen deterministically from a seed so it never changes
	 * between renders or between the prerendered HTML and the hydrated page.
	 */
	let { seed = '', size = 15 }: { seed?: string; size?: number } = $props();

	const MARKS = ['❦', '❧', '✻', '❈', '⁂', '✽', '❉', '✾'];

	const mark = $derived.by(() => {
		let h = 0;
		for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
		return MARKS[h % MARKS.length];
	});
</script>

<div class="orn" aria-hidden="true" style="font-size:{size}px">
	<span class="rule"></span>
	<span class="mark">{mark}</span>
	<span class="rule"></span>
</div>

<style>
	.orn {
		display: flex;
		align-items: center;
		gap: 12px;
		justify-content: center;
		color: var(--turmeric-deep);
		margin: 18px 0 10px;
	}
	.rule {
		height: 1px;
		width: min(90px, 18vw);
		background: linear-gradient(
			to var(--dir, right),
			transparent,
			var(--line-strong)
		);
	}
	.rule:last-child {
		--dir: left;
	}
	.mark {
		line-height: 1;
	}
</style>
