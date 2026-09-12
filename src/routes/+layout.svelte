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
	import { bareHtmlPath } from '$lib/htmlPath';

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

	/**
	 * The address bar follows the router. hooks.ts already resolves the on-disk
	 * .html spelling of a page to the page (see $lib/htmlPath.ts), so this is
	 * cosmetic and runs once: a reader who arrived by a sitemap or a pasted
	 * link ends up on the URL the app itself would have produced, and a copied
	 * address from here on is the bare one. history.state is kept as is, so
	 * SvelteKit's own history bookkeeping is untouched.
	 */
	$effect(() => {
		const bare = bareHtmlPath(location.pathname);
		if (bare === location.pathname) return;
		history.replaceState(history.state, '', bare + location.search + location.hash);
	});

	/**
	 * The dock publishes its height, so the page can keep out from under it.
	 *
	 * The dock is position:fixed at bottom-centre and grows a row per running
	 * timer, and nothing reserved that room: at 375x812 with four timers it
	 * covered y 547 to 800, the last method steps of a recipe among them, and
	 * with no timers at all its 32px "+ Timer" button sat on the footer's
	 * Privacy link at every phone width, at the only scroll position where the
	 * footer is on screen. The footer below pads by --dock-h, which this keeps
	 * current, so the end of every page scrolls clear of the lane.
	 */
	let dockEl: HTMLDivElement | undefined = $state();
	$effect(() => {
		if (!dockEl || typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver((entries) => {
			const h = Math.ceil(entries[0].contentRect.height);
			document.documentElement.style.setProperty('--dock-h', `${h}px`);
		});
		ro.observe(dockEl);
		return () => ro.disconnect();
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
		{ href: '/recipes', label: 'Library' },
		/* The house's own menu, beside the Library rather than a tile inside a
		   home band: the Library is the 1,844 dishes somebody else wrote, this is
		   the handful this kitchen actually sends, and a cook holds the two as a
		   pair. */
		{ href: '/menu', label: 'Menu' }
	];

	/**
	 * Which tab owns which path. A SEPARATE const, deliberately: anything shaped
	 * like `href: '...'` inside the MODES literal is picked up by
	 * verify-build.mjs's scanner and resolved to a page file, so a nested list
	 * there would assert on files that can never exist.
	 *
	 * Order is longest-prefix-first where two tabs share a stem: /menu/quiz is
	 * Practise (it is assessed) while /menu itself is the Menu tab, so the quiz
	 * must be tested first or Menu would claim it.
	 */
	const OWNS: Array<[string, string[]]> = [
		['/practise', ['/practise', '/repertoire', '/menu/quiz']],
		['/menu', ['/menu']],
		// /coverage is Service: it is the question a chef asks at four o'clock,
		// beside the pass, not something they are being taught.
		['/service', ['/service', '/coverage']],
		['/learn', ['/learn', '/study', '/technique', '/palate', '/safety']],
		['/recipes', ['/recipes', '/recipe/', '/chapter/', '/family', '/lexicon', '/pantry']]
	];

	// bareHtmlPath: page.url keeps the .html spelling a reader may have arrived
	// by, and the tab that owns the path should not care which spelling it was.
	const path = $derived(bareHtmlPath(page.url.pathname.replace(base, '') || '/'));

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
	<!-- The base title, product-suffixed: every wing of Outside Of Time ends
	     its document title the same way, and each page below replaces it with
	     '<Page> · The World Table'. -->
	<title>The World Table · Outside Of Time</title>
	<!--
		The manifest is the PRODUCT'S, at the origin root, linked only when the
		build was told where it is (build:pages sets MANIFEST_HREF for the /table
		wing). This repo ships no manifest of its own any more: one product, one
		manifest, one install. An empty href renders no link rather than a 404
		on every page of a standalone build.
	-->
	{#if __MANIFEST_HREF__}
		<link rel="manifest" href={__MANIFEST_HREF__} />
	{/if}
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black" />
	<meta name="apple-mobile-web-app-title" content={__APP_NAME__} />
	<meta
		name="description"
		content="An interactive culinary compendium: {TOTALS.recipes} recipes across {TOTALS.chapters} chapters, a {TOTALS.lexicon}-term chef’s lexicon, pantry matching and a ten-semester path of study."
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
		<!--
			The three counts that used to sit here (1,844 recipes, 171 chapters,
			479 lexicon terms) are gone from the masthead by the owner's call: at
			the top of every one of 2,181 pages they read as a wall rather than a
			welcome, and the first thing a new cook met was the size of the thing
			they had not read. The numbers are not hidden, they are just not the
			greeting: the footer still carries all three, wired to the same
			emitted totals, which is where the L582 regression guard moved to.
		-->
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

<!--
	One bottom-centre lane, not two layers fighting over it.

	TimerBar and UpdatePrompt were each position:fixed at bottom-centre, the
	toast at z-index 90 over the bar's 70, so "Ready to cook offline" landed
	exactly on top of the running timers. Measured at 1280x720: the rename
	button's centre was (566, 645) and the toast covered y 644 to 702, with
	elementFromPoint returning the toast. Every control on the bar - rename,
	Pause, Resume, Dismiss, the row's remove button - was dead to the touch
	from the moment the service worker finished precaching until somebody
	dismissed a toast that gave no hint it was in the way. First visit only,
	which is worse: a cook meets it once, with a pot on, and has no reason to
	connect the two.

	Docking them makes overlap impossible by construction rather than by two
	components agreeing about offsets neither can see. The bar sits at the
	bottom of the lane and the toast stacks above it, so a toast arriving or
	leaving never moves the bar under a cook's thumb.
-->
<div class="dock" data-print="hide" bind:this={dockEl}>
	<UpdatePrompt />
	<TimerBar />
</div>

<footer>
	<div class="shell">
		The World Table · {TOTALS.recipes} recipes · {TOTALS.chapters} chapters · Chef’s Lexicon: {TOTALS.lexicon} terms
		<!--
			The product's Privacy and Terms pages live at the ORIGIN ROOT of Outside
			Of Time, above this wing's base, so the links are root-absolute on
			purpose and only rendered when there is a base to be above: the
			standalone build, served from its own root, has no such pages to link.

			rel="external" is load-bearing twice over. The prerender crawler skips
			an external link, and without that it fails the build on any href that
			does not begin with base (the same rule the manifest link needed an
			exception for in vite.config.ts). And the client router treats it as a
			full navigation rather than a route of this app, which /privacy.html is
			not.
		-->
		{#if base}
			<span class="legal">· <a href="/privacy.html" rel="external">Privacy</a> · <a href="/terms.html" rel="external">Terms</a></span>
		{/if}
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

	/* The .counts rules went with the markup. The original had the opposite bug,
	   three labels with no numbers against a rule for an element that never
	   existed, so if a masthead statistic is ever wanted again, add the markup
	   and the rule together rather than reviving one of them. */

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
	 * at every width it is a 44px disc (x 10 to 54, y 10 to 54) carrying the
	 * OOT monogram, opening into a pill only while hovered or focused. It
	 * therefore sits on top of the FIRST tab, which after the cut to five is
	 * "Today", on the view people land on, whenever this bar is docked.
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
	/* The chip is a 44px disc at x 10 to 54, y 10 to 54 at every width, and
	   the shell is 1200px wide with a 20px gutter, so the brand's x is
	   (width - 1200) / 2 + 20 and passes 54 at 1268px. Below that the
	   masthead's ink began at x 21, y 35 (it covered the T of The) and the
	   docked bar's first tab at x 20, so both keep the lane: the bar's padding
	   replaces the gutter, hence 60 rather than 40. */
	@media (max-width: 1267px) {
		.modebar-inner {
			padding-left: 60px;
		}
		.brandline {
			padding-left: 48px;
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

	.dock {
		position: fixed;
		left: 50%;
		transform: translateX(-50%);
		/* Above the safe-area inset, so it clears a phone's home indicator. */
		bottom: calc(12px + env(safe-area-inset-bottom, 0px));
		z-index: 70;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		max-width: calc(100vw - 24px);
		/* A lane, not a surface. The gap between the two, and any slack beside
		   the narrower of them, must not swallow taps meant for the page
		   underneath, so the dock itself takes no pointers and its children
		   take them back. */
		pointer-events: none;
	}
	.dock > :global(*) {
		pointer-events: auto;
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
		/* 20px of its own, then the dock: 12px off the bottom plus its measured
		   height (--dock-h, set above; 44px is the one-button lane if the
		   observer never ran) plus the safe area. Reserved on the LAST element
		   only, which is enough: it is the end of the document that must clear
		   the lane, and mid-document text can always be scrolled out from under it. */
		padding: 20px 0 calc(32px + var(--dock-h, 44px) + env(safe-area-inset-bottom, 0px));
		text-align: center;
		font-size: var(--t-small);
		color: var(--muted);
		position: relative;
		z-index: 1;
	}
	@media print {
		footer {
			padding-bottom: 20px;
		}
	}
</style>
