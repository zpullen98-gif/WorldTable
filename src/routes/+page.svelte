<!--
  The front door: the four levels and nothing else (lib/components/Home.svelte).

  The grid moved to /recipes long ago, the bands after it (2026-09-26), and the
  quiet row of doors under the cards went with the consolidation (4 Oct 2026):
  everything they opened is under a tab or on a level page now.

  The legacy-query redirect below is not decoration. Links to /?q=... exist in
  the wild (the regression suite shipped one), and a prerendered page may not
  read url.searchParams at load (see CLAUDE.md's first Convention), so this
  cannot be a redirect in +page.ts. It runs in onMount rather than an effect for
  the same reason RecipeBrowser seeds its filters there: a reactive read would
  chase the URL write-back.

  It forwards on the KEYS the Library reads, never on the presence of a query
  string. Sharers append their own parameters: /?fbclid= and /?utm_source= are
  added by Facebook and by campaign tooling, not by whoever posted the link, so
  a bare-root share used to land on the Library and the person who shared it
  could not see it happen.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import Home from '$lib/components/Home.svelte';
	import { hasFilterQuery } from '$lib/urlState';

	let { data } = $props();

	onMount(() => {
		/*
		 * Forward a legacy filter link, and NOTHING else.
		 *
		 * This tested only that a query string existed, so /?fbclid=... from a
		 * Facebook share and /?utm_source=... from any campaign link both sent a
		 * first-time visitor to the Library - after a flash of the home page they
		 * were actually sent to. Those parameters are appended by the sharer, not
		 * the link's author, so the person who posted the link could not see it
		 * happening. hasFilterQuery names the six keys /recipes reads.
		 */
		if (hasFilterQuery(page.url)) {
			void goto(`${base}/recipes${page.url.search}`, { replaceState: true });
		}
	});
</script>

<Home levelInfo={data.levelInfo} />
