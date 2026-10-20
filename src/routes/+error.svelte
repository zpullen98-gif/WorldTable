<!--
  The page that catches a moved route on a stale install.

  vite.config.ts sets the service worker to `registerType: 'prompt'` with
  skipWaiting off, and UpdatePrompt.svelte explains why: an update that seizes
  the page mid-braise, with wet hands, is worse than an update that waits. The
  consequence is that an already-installed client keeps booting the OLD bundle
  until somebody accepts the prompt, and that bundle's route manifest does not
  contain routes added after it was cached.

  Both static hosts answer an unknown path with the precached shell at 200
  (tools/serve.mjs, and GitHub Pages via 404.html), so a deep link to a new
  route does not 404: it resolves, hydrates, and lands here. Without this file
  that is SvelteKit's default error page wearing the World Table's chrome,
  which tells a cook nothing and looks like the app is broken.

  So: name the situation, and offer the one action that fixes it.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	let updating = $state(false);
	let checked = $state(false);

	onMount(() => {
		// Ask the worker to look for a new version. This does not seize the page;
		// it makes UpdatePrompt's banner appear, which is the user's choice to take.
		void navigator.serviceWorker
			?.getRegistration()
			.then((reg) => {
				if (!reg) return;
				updating = true;
				return reg.update();
			})
			.catch(() => {
				/* offline, or no worker. The links below still work. */
			}).finally(() => { updating = false; checked = true; });
	});
</script>

<svelte:head><title>Not here · The World Table</title></svelte:head>

<div class="shell view">
	<h1>{page.status === 404 ? 'Nothing at this address' : 'Something went wrong'}</h1>

	{#if page.status === 404}
		<p class="lede">
			This address could not be opened. Use Home to choose your study level, or find the material
			in the Library. An older installed edition may not yet know about a newly added page.
		</p>
		{#if updating}
			<p class="note">
				Checking for a newer version. If one is found, the banner at the top of the screen will
				offer it: the app never updates itself out from under you mid-service.
			</p>
		{/if}
		{#if checked}<p class="note">If an update banner appears, choose Reload when you are ready. Your saved notes and progress stay on this device.</p>{/if}
	{:else}
		<p class="lede">This page could not finish loading. Check your connection and try again, or return to the Library.</p>
	{/if}

	<nav class="ways" aria-label="Find your way back">
		<button class="chip" onclick={() => window.location.reload()}>Try this page again</button>
		<a class="chip" href={base || '/'}>Home</a>
		<a class="chip" href="{base}/library">Library</a>
		<a class="chip" href="{base}/flashcards">Practise</a>
	</nav>
</div>

<style>
	h1 {
		font-size: var(--t-h1);
		margin-bottom: 10px;
	}
	.lede {
		font-size: var(--t-lede);
		color: var(--ink-soft);
		max-width: var(--measure);
	}
	.note {
		margin-top: 12px;
		font-size: var(--t-small);
		color: var(--muted);
		max-width: var(--measure);
		line-height: 1.55;
	}
	.ways {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 22px;
	}
	.ways a {
		text-decoration: none;
	}
</style>
