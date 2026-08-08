<script lang="ts">
	import '../app.css';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { TOTALS } from '$lib/data';
	import { prefs } from '$lib/stores/prefs.svelte';

	let { children } = $props();

	const MODES = [
		{ href: '', label: 'Recipes' },
		{ href: '/lexicon', label: 'Chef’s Lexicon' },
		{ href: '/pantry', label: 'Pantry Match' },
		{ href: '/study', label: 'Path of Study' },
		{ href: '/menu', label: 'My Menu' }
	];

	const path = $derived(page.url.pathname.replace(base, '') || '/');

	function isActive(href: string) {
		if (href === '') return path === '/' || path.startsWith('/recipe') || path.startsWith('/chapter');
		return path.startsWith(href);
	}
</script>

<svelte:head>
	<title>The World Table — Interactive Culinary Field Guide</title>
	<meta
		name="description"
		content="An interactive culinary compendium — {TOTALS.recipes} recipes across {TOTALS.chapters} chapters, a 479-term chef’s lexicon, pantry matching and a ten-semester path of study."
	/>
</svelte:head>

<a class="skip" href="#main">Skip to content</a>

<header>
	<div class="shell head-inner">
		<div class="brand">
			<!-- The site name is the page's h1 only on the index. On a recipe or a
			     chapter the dish/chapter title is the document's real heading, and
			     two competing h1s make the outline meaningless to a screen reader. -->
			<svelte:element this={path === '/' ? 'h1' : 'p'} class="brandline">
				<a href={base || '/'}>The World <em>Table</em></a>
			</svelte:element>
			<p class="eyebrow">
				An interactive culinary compendium — every dish serves four unless noted
			</p>
		</div>
		<dl class="counts">
			<div><dt>Recipes</dt><dd>{TOTALS.recipes}</dd></div>
			<div><dt>Chapters</dt><dd>{TOTALS.chapters}</dd></div>
			<div><dt>Lexicon</dt><dd>479</dd></div>
		</dl>
	</div>
</header>

<nav class="modebar" data-print="hide" aria-label="Sections">
	<div class="shell modebar-inner">
		{#each MODES as m (m.href)}
			<a class="modetab" class:on={isActive(m.href)} href="{base}{m.href || '/'}">{m.label}</a>
		{/each}
		<button
			class="service"
			onclick={() => prefs.toggleService()}
			aria-label="Switch between day and night service"
		>
			{prefs.resolvedService === 'night' ? '☀ Day service' : '☾ Night service'}
		</button>
	</div>
</nav>

<main id="main" tabindex="-1">
	{@render children()}
</main>

<footer>
	<div class="shell">
		The World Table · {TOTALS.recipes} recipes · {TOTALS.chapters} chapters · Chef’s Lexicon: 479 terms
	</div>
</footer>

<style>
	header {
		border-bottom: 1px solid var(--line);
		padding: 28px 0 20px;
		position: relative;
		z-index: 1;
	}
	.head-inner {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 16px;
		justify-content: space-between;
	}
	.brandline {
		font-family: var(--display);
		font-weight: 700;
		font-size: var(--t-h1);
		letter-spacing: -0.01em;
		line-height: 1.1;
	}
	.brandline a {
		text-decoration: none;
	}
	.brandline em {
		font-style: italic;
		color: var(--turmeric-deep);
	}
	.brand p {
		margin-top: 6px;
		letter-spacing: 0.08em;
		color: var(--muted);
	}

	/* The original rendered three labels here with no numbers, against a CSS rule
	   styling an element that never existed. These are the real counts. */
	.counts {
		display: flex;
		gap: 22px;
		text-align: right;
	}
	.counts dt {
		font-size: var(--t-micro);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.counts dd {
		font-family: var(--display);
		font-size: 26px;
		color: var(--turmeric-deep);
		font-variant-numeric: oldstyle-nums;
		line-height: 1.1;
	}

	.modebar {
		position: sticky;
		top: 0;
		z-index: 40;
		background: var(--paper);
		border-bottom: 1px solid var(--line);
		box-shadow: 0 8px 20px -18px rgba(0, 0, 0, 0.9);
	}
	.modebar-inner {
		display: flex;
		gap: 4px;
		align-items: center;
		overflow-x: auto;
	}
	.modetab {
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-tab);
		text-transform: uppercase;
		color: var(--muted);
		padding: 13px 16px 11px;
		border-bottom: 2px solid transparent;
		text-decoration: none;
		white-space: nowrap;
	}
	.modetab:hover {
		color: var(--ink);
	}
	.modetab.on {
		color: var(--turmeric-deep);
		border-bottom-color: var(--turmeric);
	}

	.service {
		margin-left: auto;
		background: none;
		border: 1px solid transparent;
		cursor: pointer;
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-tab);
		text-transform: uppercase;
		color: var(--muted);
		padding: 7px 10px;
		border-radius: var(--radius);
		white-space: nowrap;
	}
	.service:hover {
		color: var(--turmeric-deep);
		border-color: var(--line);
	}

	main {
		position: relative;
		z-index: 1;
	}
	main:focus {
		outline: none;
	}

	footer {
		border-top: 1px solid var(--line);
		padding: 20px 0;
		text-align: center;
		font-size: var(--t-small);
		color: var(--muted);
		position: relative;
		z-index: 1;
	}
</style>
