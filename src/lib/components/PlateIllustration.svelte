<script lang="ts">
	import { onDestroy } from 'svelte';

	let { src, title, width, height }: { src: string; title: string; width: number; height: number } = $props();
	let failed = $state(false);
	let zoom = $state(1);
	let dialog: HTMLDialogElement;
	let opener: HTMLButtonElement;
	let canvas: HTMLDivElement;
	let fitWidth = $state(1);
	let priorOverflow = '';
	let ownsScrollLock = false;
	function imageStatus(node: HTMLImageElement) {
		// A cached failure can arrive before the prerendered page hydrates.
		if (node.complete && node.naturalWidth === 0) failed = true;
	}

	function unlock() {
		if (!ownsScrollLock) return;
		document.body.style.overflow = priorOverflow;
		ownsScrollLock = false;
	}
	function open() {
		zoom = 1;
		priorOverflow = document.body.style.overflow;
		ownsScrollLock = true;
		document.body.style.overflow = 'hidden';
		dialog.showModal();
		fit();
	}
	function fit() {
		if (dialog?.open && canvas) fitWidth = Math.min(canvas.clientWidth, canvas.clientHeight * width / height);
	}
	function closed() {
		unlock();
		if (opener?.isConnected) opener.focus();
	}
	function keydown(event: KeyboardEvent) {
		if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom = Math.min(3, zoom + .5); }
		if (event.key === '-') { event.preventDefault(); zoom = Math.max(1, zoom - .5); }
		if (event.key === '0') { event.preventDefault(); zoom = 1; }
	}
	$effect(() => {
		void src;
		failed = false;
		zoom = 1;
		if (dialog?.open) dialog.close();
	});
	onDestroy(unlock);
</script>

<svelte:window onresize={fit} />

<figure class="plate teaching-illustration">
	<div class="illustration-box" style:--illustration-aspect="{width} / {height}">
		{#if failed}
			<div class="image-unavailable" role="status">
				<span class="folio-mark" aria-hidden="true">✦</span>
				<strong>The illustration is not available</strong>
				<p>The numbered guide below is complete without the picture. Reconnect to load the artwork.</p>
			</div>
		{:else}
			<img use:imageStatus {src} alt="{title}: six illustrated subjects, numbered 1 to 6. Read their names and teaching notes in the numbered guide." {width} {height} decoding="async" onerror={() => failed = true} />
		{/if}
	</div>
	<figcaption data-print="hide">
		<button class="chip enlarge" bind:this={opener} onclick={open} disabled={failed}>Enlarge illustration</button>
		<span>Follow numbers 1 to 6 in the guide.</span>
	</figcaption>
</figure>

<dialog class="plate-viewer" bind:this={dialog} onclose={closed} onkeydown={keydown} aria-labelledby="viewer-title" aria-describedby="viewer-help" data-print="hide">
	<div class="viewer-head">
		<h2 id="viewer-title">{title}</h2>
		<button class="chip close-viewer" onclick={() => dialog.close()}>Close illustration</button>
	</div>
	<div class="viewer-tools">
		<button class="chip" aria-label="Zoom out" disabled={zoom <= 1} onclick={() => zoom = Math.max(1, zoom - .5)}>−</button>
		<button class="chip" onclick={() => zoom = 1}>Fit</button>
		<button class="chip" aria-label="Zoom in" disabled={zoom >= 3} onclick={() => zoom = Math.min(3, zoom + .5)}>+</button>
		<span class="zoom-value" aria-live="polite">{Math.round(zoom * 100)}%</span>
		<a href={src} target="_blank" rel="noopener">Open image file<span class="sr-only"> in a new tab</span></a>
	</div>
	<p id="viewer-help">Use + and − to zoom, 0 to fit, and Escape to close. Scroll to explore a magnified image.</p>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex: the magnified image needs a keyboard-focusable scroll region. -->
	<div class="viewer-canvas" bind:this={canvas} tabindex="0" role="region" aria-label="Scrollable illustration">
		<img {src} alt="{title}, six numbered subjects" {width} {height} style:width="{fitWidth * zoom}px" decoding="async" />
	</div>
</dialog>

<style>
	.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
	.teaching-illustration { margin: 0; min-width: 0; }
	.illustration-box { display: grid; width: 100%; aspect-ratio: var(--illustration-aspect); overflow: hidden; border: 1px solid var(--house-frame); border-radius: 3px; background: var(--paper-raised); }
	.illustration-box > img { display: block; width: 100%; height: 100%; object-fit: contain; }
	.image-unavailable { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px; color: var(--ink-soft); }
	.image-unavailable p { max-width: 32ch; margin-top: 10px; font-size: var(--t-small); }
	.folio-mark { color: var(--turmeric-deep); font-size: 30px; margin-bottom: 12px; }
	figcaption { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; margin-top: 12px; font-size: var(--t-small); color: var(--muted); }
	.enlarge { min-height: 44px; }
	.plate-viewer { width: min(1120px, calc(100vw - 32px)); max-width: none; max-height: calc(100dvh - 32px); margin: auto; padding: 18px; border: 1px solid var(--house-frame); border-radius: 3px; background: var(--paper); color: var(--ink); box-shadow: var(--shadow-sheet); }
	.plate-viewer::backdrop { background: #030b08df; }
	.viewer-head { display: flex; justify-content: space-between; align-items: center; gap: 14px; }
	.viewer-head h2 { margin: 0; font-family: var(--house-display); font-size: 22px; line-height: 1.35; }
	.viewer-head .chip { flex-shrink: 0; }
	.viewer-tools { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 15px; }
	.viewer-tools button { min-width: 44px; min-height: 44px; }
	.viewer-tools a { margin-left: auto; min-height: 44px; display: inline-flex; align-items: center; color: var(--ink); font-size: var(--t-small); }
	.zoom-value { font-variant-numeric: tabular-nums; min-width: 4ch; color: var(--muted); font-size: var(--t-small); }
	#viewer-help { margin: 6px 0 14px; font-size: var(--t-small); color: var(--muted); }
	.viewer-canvas { height: min(72dvh, 820px); overflow: auto; background: var(--paper-raised); border: 1px solid var(--line); touch-action: pan-x pan-y pinch-zoom; }
	.viewer-canvas img { display: block; max-width: none; height: auto; margin: 0 auto; }
	@media screen and (min-width: 850px) {
		.teaching-illustration { display: grid; grid-template-rows: minmax(0, 1fr) auto; min-height: 0; }
		.illustration-box { position: relative; height: 100%; min-height: 0; aspect-ratio: auto; place-items: center; border: 0; background: transparent; }
		.illustration-box > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; border: 0; }
		.image-unavailable { width: 100%; height: 100%; overflow: auto; border: 1px solid var(--house-frame); border-radius: 3px; background: var(--paper-raised); }
		figcaption { justify-content: center; }
		figcaption > span { display: none; }
	}
	@media (max-width: 520px) {
		.plate-viewer { width: calc(100vw - 16px); max-height: calc(100dvh - 16px); padding: 12px; }
		.viewer-head { align-items: flex-start; }.viewer-head h2 { font-size: 18px; }
		.viewer-head .chip { max-width: 112px; white-space: normal; }
		.viewer-canvas { height: 62dvh; }
	}
</style>
