<!--
  One module of the service track.

  The definitions are the guide's own, rendered whole. Nothing is summarised:
  this material has never had a route to it, and the fix for that is a route,
  not a paraphrase.

  Class names are .svcterm and .svcdef, deliberately NOT .lexcard or .def. Those
  two are a published paywall contract in the monorepo's oot-locks.js, keyed to
  the tier attribute with NO route scope — reusing one here would blur this page
  for free visitors on a route that was never meant to be gated that way.
  src/lib/navigation.test.ts asserts they stay where they are.
-->
<script lang="ts">
	import { base } from '$app/paths';

	let { data } = $props();
	const m = $derived(data.module);
</script>

<svelte:head><title>{m.title} — Service — The World Table</title></svelte:head>

<div class="shell view">
	<nav class="crumbs">
		<a href="{base}/service">Service</a>
		<span aria-hidden="true">›</span>
		<span>Module {m.n} of {data.count}</span>
	</nav>

	<header class="head">
		<h1>{m.title}</h1>
		<p class="outcome"><b>After this you can</b> {m.outcome}</p>
	</header>

	<ol class="svcterms">
		{#each data.terms as t (t.slug)}
			<li>
				<h2 class="svcterm">
					{t.term}
					<a class="src" href="{base}/lexicon#{t.slug}">{t.category}</a>
				</h2>
				<p class="svcdef">{t.definition}</p>
			</li>
		{/each}
	</ol>

	<nav class="steps">
		{#if data.prev}
			<a class="chip" href="{base}/service/{data.prev.key}">◀ {data.prev.title}</a>
		{:else}
			<span></span>
		{/if}
		{#if data.next}
			<a class="chip" href="{base}/service/{data.next.key}">{data.next.title} ▶</a>
		{:else}
			<a class="chip" href="{base}/service">Back to the track</a>
		{/if}
	</nav>
</div>

<style>
	.crumbs {
		font-size: var(--t-small);
		color: var(--muted);
		margin-bottom: 12px;
	}
	.crumbs a {
		color: var(--ink-soft);
	}
	.crumbs span {
		margin-left: 6px;
	}
	.head {
		margin-bottom: 22px;
	}
	h1 {
		font-size: var(--t-h1);
		margin-bottom: 10px;
	}
	.outcome {
		padding: 12px 15px;
		border-left: 2px solid var(--turmeric-deep);
		background: var(--paper-raised);
		max-width: var(--measure);
		font-size: var(--t-small);
		line-height: 1.6;
		color: var(--ink);
	}
	.svcterms {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.svcterms li {
		padding: 16px 0;
		border-bottom: 1px solid var(--line);
	}
	.svcterm {
		font-family: var(--display);
		font-size: 20px;
		margin-bottom: 6px;
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: baseline;
	}
	.src {
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
	}
	.svcdef {
		max-width: var(--measure);
		color: var(--ink-soft);
		line-height: 1.65;
		font-size: var(--t-small);
	}
	.steps {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		margin-top: 26px;
		flex-wrap: wrap;
	}
	.steps a {
		text-decoration: none;
	}
</style>
