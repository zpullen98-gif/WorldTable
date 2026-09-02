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
	// re-read on a profile switch the way the session does: the menu does not
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
	 * idempotent: it returns at once when the key has not moved. Standalone,
	 * profiles.onChange is a no-op returning a no-op, so this wires
	 * unconditionally and costs nothing.
	 */
	$effect(() => profiles.onChange(() => void session.rehydrate()));

	// Effects run only in the browser, after mount, which makes this a precise
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
		// /coverage is Service: it is the question a chef asks at four o'clock,
		// beside the menu and the pass, not something they are being taught.
		['/service', ['/service', '/menu', '/coverage']],
		['/learn', ['/learn', '/study', '/technique', '/palate', '/safety']],
		['/recipes', ['/recipes', '/recipe/', '/chapter/', '/family', '/lexicon', '/pantry']]
	];

	const path = $derived(page.url.pathname.replace(base, '') || '/');

	/* The one number worth carrying in the chrome: how many dishes are past
	   their re-cook. Same treatment as the menu's count: a pill, not a badge
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
	 * `/` focuses whichever search box the current view offers: the recipe
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
	<title>The World Table: Interactive Culinary Field Guide</title>
	<link rel="manifest" href={__MANIFEST_HREF__} />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-title" content={__APP_NAME__} />
	<meta
		name="description"
		content="An interactive culinary compendium: {TOTALS.recipes} recipes across {TOTALS.chapters} chapters, a 479-term chef’s lexicon, pantry matching and a ten-semester path of study."
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
			<!--
				The original's own subtitle (reference/world-table-v1.html) reads
				"An interactive culinary compendium - recipes, lexicon & study - every
				dish serves four unless noted". The last clause is dropped rather than
				softened: nothing could ever BE noted, because no recipe states a yield
				and no override sets one, so "unless noted" pointed at a mechanism that
				does not exist. This is the original's line restored, not a departure
				from it. Do not hedge it back to "most dishes serve four" - that is the
				same claim in a softer voice, on 2,176 prerendered pages.
			-->
			<p class="eyebrow">An interactive culinary compendium: recipes, lexicon and study</p>
		</div>
		<dl class="counts">
			<div><dt>Recipes</dt><dd>{TOTALS.recipes}</dd></div>
			<div><dt>Chapters</dt><dd>{TOTALS.chapters}</dd></div>
			<div><dt>Lexicon</dt><dd>{TOTALS.lexicon}</dd></div>
		</dl>
	</div>
</header>

<nav class="modebar" data-print="hide" aria-label="Sections">
	<div class="shell modebar-inner">
		{#each MODES as m (m.href)}
			{@const here = isActive(m.href)}
			<!--
				aria-current, which the bar has never had: the lit tab was marked by a
				colour and a 2px underline and nothing else, so a screen reader was
				told five links and not which one you were standing on.
			-->
			<a
				class="modetab"
				class:on={here}
				aria-current={here ? 'page' : undefined}
				href="{base}{m.href || '/'}"
			>
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
			<span class="svcglyph" aria-hidden="true"
				>{prefs.resolvedService === 'night' ? '☀' : '☾'}</span
			><span class="svcword">{prefs.resolvedService === 'night' ? 'Day service' : 'Night service'}</span>
		</button>
	</div>
</nav>

<!--
	The hold, announced. The house record shows its banner only on /menu, its
	one consumer page; the session is read on every route, so this lives in the
	layout. Copy keeps the house register - cause, guarantee, consequence, one
	action - but does NOT promise that a reload fixes it: after a rollback there
	is no newer worker waiting.
-->
{#if session.held}
	<div class="shell">
		<p class="held" role="alert">
			{#if session.heldReason === 'unreadable'}
				<b>The record on this device could not be read.</b>
			{:else}
				<b>This device is running an older edition of The World Table than the one that saved your record.</b>
			{/if}
			Nothing has been lost and nothing will be overwritten, but your menu, notes, pantry and cooked
			log stay hidden, and anything you record now will not be kept, until this device is running
			the edition that saved it. If an update is offered, take it; otherwise open the newer
			edition.
		</p>
	</div>
{/if}

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
		/*
		 * Wrap at EVERY width, not just on phones.
		 *
		 * Keying this to the phone breakpoint left a cliff at exactly 600px: the
		 * media query switched off, the toggle's full 114px label and the 16px
		 * tab padding came back together, and the bar went straight back to
		 * overflowing with tabs hidden and no way to know it. Unconditional wrap
		 * has no cliff anywhere — the row breaks only when the content genuinely
		 * does not fit, and above about 640px it never does, so nothing about the
		 * desktop bar changes.
		 *
		 * overflow-x is left at its default rather than `auto`: there is nothing
		 * to scroll to now, and a scroll container that can never scroll is still
		 * a tab stop and still a place focus can be lost.
		 */
		flex-wrap: wrap;
	}
	/*
	 * Room for the shared layer's return chip.
	 *
	 * Inside Outside Of Time, oot-bar.js pins a chip at position:fixed, top 10px,
	 * left 10px, z-index 45 (over this bar, which is sticky at z-index 40), and
	 * under 600px it collapses to a round icon roughly 40px across. It therefore
	 * sits on top of the FIRST tab, which after the cut to five is "Today", on
	 * the view people land on.
	 *
	 * Applied unconditionally because there is no reliable marker to key it to:
	 * data-oot-tier is REMOVED for paid visitors, so it cannot stand in for
	 * "inside the monorepo". Standalone this costs a small indent on a bar that
	 * already scrolls horizontally, which is the cheaper of the two mistakes.
	 */
	/*
	 * On a phone the bar WRAPS rather than scrolls.
	 *
	 * Measured at 375 CSS px: five tabs need 449 px, plus 44 for the chip indent
	 * and 20 of gaps, in a 375 px box. Only THREE tabs were visible at 320, 375,
	 * 390 and 414 — Service was clipped as well as Library, and at /recipes the
	 * lit Library tab sat at x 425 to 508 with scrollLeft pinned at 0, so the bar
	 * could not even show a cook the tab they were standing on.
	 *
	 * Three fixes were measured and rejected before this one:
	 *
	 *   Pulling button.service out buys 130 px of scrollWidth and exactly ZERO
	 *   extra visible tabs, because it already sits AFTER Library and was never
	 *   what covered it.
	 *
	 *   Scrolling the active tab into view trades one hidden tab for another: on
	 *   /recipes it reveals Library by pushing Today, the home of the app and the
	 *   most-tapped thing on the bar, off the other end.
	 *
	 *   Tightening padding and tracking alone cannot seat five tabs at 320 px
	 *   without taking the targets under the 44 px floor.
	 *
	 * Wrapping is the only shape that shows all five at every width with the
	 * labels and the vocabulary untouched. It costs one extra row of sticky bar
	 * below about 640px and nothing above it. The wrap itself is unconditional
	 * and lives on .modebar-inner; what is phone-only is the chip indent below,
	 * the tighter tab padding and the toggle collapsing to its glyph.
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
		/* 15/13 with a 16px line box measures 46px tall. It was 13/11, which
		   measured 43.04px on every tab in the bar — under the 44px touch floor,
		   though only just, and only because the 1.55 body line-height resolves
		   to 17.05px here and the 2px transparent border-bottom counts. A
		   separate defect from the overflow, found while measuring it, and this
		   is the primary navigation of an app used one-handed in a kitchen. */
		padding: 15px 16px 13px;
		line-height: 16px;
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
		/* It sits in the primary nav beside 46px tabs and measured 33px tall at
		   every width above the phone breakpoint, so the floor is not phone-only. */
		min-height: 44px;
	}
	.svcword {
		margin-left: 0.45em;
	}
	/*
	 * On a phone the toggle keeps its glyph and drops its words, which is what
	 * lets the wrapped bar settle at exactly two rows instead of three: with the
	 * full 112px label it took a row of its own at 320 and 375, the two commonest
	 * widths, and a 147px sticky bar is its own defect.
	 *
	 * The words are the only thing removed. The accessible name is the
	 * aria-label, not the text, so nothing is lost to a screen reader and
	 * tests/regressions.spec.ts still finds it by /day and night service/.
	 *
	 * Deleting the control outright was the other candidate and is survivable —
	 * the app follows prefers-color-scheme when nothing is stored — but it is the
	 * ONLY service control in the app, so on a phone it would mean the OS decided
	 * day or night and a cook could never say otherwise.
	 */
	@media (max-width: 599px) {
		.svcword {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
		.service {
			min-width: 44px;
			font-size: 15px;
		}
		/*
		 * 16 to 10 horizontally. This buys a whole extra tab on the first row and
		 * still leaves the narrowest target 61px wide, well over the floor.
		 *
		 * It has to live HERE, below the base .modetab rule, not up beside the
		 * flex-wrap. The base rule sets `padding` as a shorthand; a media query
		 * adds no specificity, so an override written above it loses on source
		 * order and silently does nothing. It did exactly that in the first cut
		 * of this change: the tabs measured 74/73/114/104/84 at 320px, the
		 * untouched widths, and the bar came out three rows tall.
		 */
		.modetab {
			padding-left: 10px;
			padding-right: 10px;
		}
	}
	.service:hover {
		color: var(--turmeric-deep);
		border-color: var(--line);
	}

	/* The house record's .blocked, in the layout. */
	.held {
		border: 1px solid var(--chili);
		border-left-width: 3px;
		border-radius: var(--radius);
		padding: 12px 14px;
		margin: 16px 0 0;
		line-height: 1.55;
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
