<script lang="ts">
	import { onMount } from 'svelte';

	/**
	 * A new build is offered, never imposed.
	 *
	 * `skipWaiting` is off and registerType is 'prompt' deliberately: this app is
	 * used at a stove with wet hands halfway through a braise. Reloading the page
	 * out from under someone to ship a CSS tweak is not a trade worth making.
	 */
	let needRefresh = $state(false);
	let offlineReady = $state(false);
	let update: ((reload?: boolean) => Promise<void>) | null = null;

	onMount(async () => {
		try {
			const { useRegisterSW } = await import('virtual:pwa-register/svelte');
			const r = useRegisterSW({
				onRegisteredSW(_url, reg) {
					// Check hourly while the tab is open, rather than only on load.
					if (reg) setInterval(() => void reg.update(), 60 * 60 * 1000);
				}
			});
			update = r.updateServiceWorker;
			r.needRefresh.subscribe((v) => (needRefresh = v));
			r.offlineReady.subscribe((v) => (offlineReady = v));
		} catch {
			// No service worker in this build (dev, or an unsupported browser).
		}
	});
</script>

{#if needRefresh}
	<div class="toast" role="status">
		<p><strong>A new edition is ready.</strong> Your notes and menu are kept.</p>
		<div class="acts">
			<button class="go" onclick={() => update?.(true)}>Reload</button>
			<button onclick={() => (needRefresh = false)}>Later</button>
		</div>
	</div>
{:else if offlineReady}
	<div class="toast" role="status">
		<p>Ready to cook offline — the whole guide is on this device now.</p>
		<div class="acts"><button onclick={() => (offlineReady = false)}>Good</button></div>
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		bottom: 18px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 90;
		max-width: min(460px, calc(100vw - 32px));
		display: flex;
		flex-wrap: wrap;
		gap: 10px 16px;
		align-items: center;
		justify-content: space-between;
		background: var(--card);
		border: 1px solid var(--turmeric);
		border-radius: var(--radius);
		box-shadow: var(--shadow-sheet);
		padding: 12px 16px;
		font-size: var(--t-small);
	}
	.acts {
		display: flex;
		gap: 8px;
	}
	button {
		border: 1px solid var(--line);
		background: none;
		border-radius: var(--radius);
		padding: 5px 12px;
		cursor: pointer;
		font-size: var(--t-small);
	}
	button:hover {
		border-color: var(--turmeric);
	}
	button.go {
		background: var(--accent-solid);
		border-color: var(--accent-solid);
		color: var(--on-accent);
	}
	@media print {
		.toast {
			display: none;
		}
	}
</style>
