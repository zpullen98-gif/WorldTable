<script lang="ts">
	import '../app.css';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { TOTALS } from '$lib/data';
	import { prefs } from '$lib/stores/prefs.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { house } from '$lib/stores/house.svelte';
	import * as profiles from '$lib/profiles';
	import { repertoire, dueList } from '$lib/repertoire';
	import UpdatePrompt from '$lib/components/UpdatePrompt.svelte';
	import TimerBar from '$lib/components/TimerBar.svelte';

	let { children } = $props();

	// One hydrate for the whole app. Views read `session.ready` and show their
	// own skeleton rather than flashing an empty menu.
	//
	// The house record is device-wide and NOT profile-namespaced, so it does not
	// re-read on a profile switch the way the session does — the menu does not
	// change because somebody else tapped their name. See stores/house.svelte.ts.
	$effect(() => {
		void session.hydrate();
		void house.hydrate();
	});

	/**
	 * Follow the person, not just the device.
	 *
	 * A shared kitchen tablet has a roster (shared/oot-profiles.js). Nothing in
	 * this wing listened to it, so switching name mid-session left the previous
	 * person's cooked log, menu and notes in memory: invisible while the app
	 * showed no name, and wrong the moment Today greets somebody.
	 *
	 * onChange fires IMMEDIATELY on registration, which is why rehydrate() is
	 * idempotent — it returns at once when the key has not moved. Standalone,
	 * profiles.onChange is a no-op returning a no-op, so this wires
	 * unconditionally and costs nothing.
	 */
	$effect(() => profiles.onChange(() => void session.rehydrate()));

	// Effects run only in the browser, after mount — which makes this a precise
	// "hydration finished" marker. The e2e suite waits on it before typing:
	// prerendered pages LOOK interactive long before Svelte's listeners attach,
	// and a keystroke into that gap lands on a dead input.
	$effect(() => {
		document.documentElement.dataset.hydrated = 'true';
	});

	/* Ordered the way the home bands are, and labelled short enough that the bar
	   does not wrap on a phone in a prep kitchen: seven long names became seven
	   words. Nothing was removed, because every one of these is a destination a
	   cook reaches for mid-service. */
	const MODES = [
		{ href: '', label: 'Today' },
		{ href: '/learn', label: 'Learn' },
		{ href: '/practise', label: 'Practise' },
		{ href: '/service', label: 'Service' },
		{ href: '/recipes', label: 'Library' }
	];

	/**
	 * Which tab owns which path. A SEPARATE const, deliberately: anything shaped
	 * like `href: '...'` inside the MODES literal is picked up by
	 * verify-build.mjs's scanner and resolved to a page file, so a nested list
	 * there would assert on files that can never exist.
	 *
	 * Order is longest-prefix-first where two tabs share a stem: /menu/quiz is
	 * Practise (it is assessed) while /menu itself is Service, so the quiz must
	 * be tested first or Service would claim it.
	 */
	const OWNS: Array<[string, string[]]> = [
		['/practise', ['/practise', '/repertoire', '/menu/quiz']],
		['/service', ['/service', '/menu']],
		['/learn', ['/learn', '/study', '/technique', '/palate', '/safety']],
		['/recipes', ['/recipes', '/recipe/', '/chapter/', '/family', '/lexicon', '/pantry']]
	];

	const path = $derived(page.url.pathname.replace(base, '') || '/');

	/* The one number worth carrying in the chrome: how many dishes are past
	   their re-cook. Same treatment as the menu's count — a pill, not a badge
	   that nags, and absent entirely at zero. */
	const dueCount = $derived.by(() => {
		const now = Date.now();
		return dueList(repertoire(session.cookedLog, now), now).length;
	});

	/**
	 * The one tab that owns the current path.
	 *
	 * Resolved once rather than asked per tab, because "does this tab match"
	 * answered independently is how two tabs light at the same time. The old
	 * version tested `path.startsWith(href)`, which is quietly wrong the moment
	 * two routes share a stem: '/recipes'.startsWith('/recipe') is TRUE.
	 */
	const owner = $derived.by(() => {
		if (path === '/') return '';
		for (const [tab, prefixes] of OWNS) {
			for (const prefix of prefixes) {
				const stem = prefix.endsWith('/') ? prefix : prefix + '/';
				if (path === prefix || path.startsWith(stem)) return tab;
			}
		}
		return null;
	});

	function isActive(href: string) {
		return owner === href;
	}

	/**
	 * `/` focuses whichever search box the current view offers — the recipe
	 * grid's, the lexicon's, the pantry's. One handler here rather than one per
	 * view: they'd fight over the key, and this is exactly the shape of
	 * scattered-listener code the rewrite exists to avoid.
	 */
	function onKeydown(e: KeyboardEvent) {
		if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
		const t = e.target as HTMLElement;
		if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
			return;
		const box = document.querySelector<HTMLInputElement>('input[type="search"]');
		if (box) {
			e.preventDefault();
			box.focus();
			box.select();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
	<title>The World Table — Interactive Culinary Field Guide</title>
	<link rel="manifest" href="{base}/manifest.webmanifest" />
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
			<a class="modetab" class:on={isActive(m.href)} href="{base}{m.href || '/'}">
				{m.label}{#if m.href === '/service' && session.menuCount}<span class="pill"
						>{session.menuCount}</span
					>{:else if m.href === '/practise' && dueCount}<span class="pill">{dueCount}</span>{/if}
			</a>
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

<TimerBar />
<UpdatePrompt />

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
	/*
	 * Room for the shared layer's return chip.
	 *
	 * Inside Outside Of Time, oot-bar.js pins a chip at position:fixed, top 10px,
	 * left 10px, z-index 45 — over this bar, which is sticky at z-index 40 — and
	 * under 600px it collapses to a round icon roughly 40px across. It therefore
	 * sits on top of the FIRST tab, which after the cut to five is "Today", on
	 * the view people land on.
	 *
	 * Applied unconditionally because there is no reliable marker to key it to:
	 * data-oot-tier is REMOVED for paid visitors, so it cannot stand in for
	 * "inside the monorepo". Standalone this costs a small indent on a bar that
	 * already scrolls horizontally, which is the cheaper of the two mistakes.
	 */
	@media (max-width: 599px) {
		.modebar-inner {
			padding-left: 44px;
		}
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
	.pill {
		display: inline-block;
		margin-left: 5px;
		background: var(--turmeric);
		color: var(--paper);
		border-radius: 999px;
		padding: 0 6px;
		font-size: 10px;
		font-variant-numeric: lining-nums;
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
