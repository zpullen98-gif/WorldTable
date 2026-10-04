import { test, expect } from '@playwright/test';
import { goto, seedSession } from './helpers';

/**
 * The four tabs, and the reason this file exists.
 *
 * The rest of the suite is structurally BLIND to a dead route. tools/serve.mjs
 * answers any unknown path with shell.html at status 200 — that is deliberate,
 * it is what makes the offline navigation fallback work — and the layout still
 * stamps data-hydrated on it. So `goto(page, '/does-not-exist')` RESOLVES, the
 * spec proceeds, and the failure surfaces later as a confusing locator timeout
 * rather than as "that page is missing".
 *
 * Only tools/verify-build.mjs can mechanically see a missing PAGE FILE. What it
 * cannot see is a page that exists and renders the wrong thing — a tab pointing
 * at a route whose component throws, or at SvelteKit's error page. So each tab
 * is asserted to render its own H1 here.
 *
 * Home, Flashcards, Quizzes, Library, then a quiet More: the one nav the
 * three apps share, in that order (the consolidation, 4 Oct 2026,
 * docs/consolidation-design.md 2.1).
 */
const TABS = [
	{ href: '/', label: 'Home', h1: /The World/i },
	{ href: '/flashcards', label: 'Flashcards', h1: /^Flashcards$/ },
	{ href: '/quizzes', label: 'Quizzes', h1: /^Quizzes$/ },
	{ href: '/library', label: 'Library', h1: /^Library$/ },
	{ href: '/more', label: 'More', h1: /^More$/ }
];

for (const tab of TABS) {
	test(`the ${tab.label} tab renders its own page`, async ({ page }) => {
		await goto(page, tab.href);

		// The error page is what a moved-route-on-a-stale-install looks like, and
		// it renders inside the same chrome. Name it explicitly.
		await expect(page.locator('h1')).not.toHaveText(/Nothing at this address/);
		await expect(page.locator('h1').first()).toHaveText(tab.h1);
	});
}

test('the bar shows the four tab words and then More, in the shared order', async ({ page }) => {
	await goto(page, '/');
	const tabs = page.locator('.modetab');
	await expect(tabs).toHaveCount(5);
	for (const [i, label] of ['Home', 'Flashcards', 'Quizzes', 'Library', 'More'].entries()) {
		await expect(tabs.nth(i)).toHaveText(new RegExp(`^${label}`));
	}
	await expect(tabs.nth(4)).toHaveClass(/quiet/);
});

/**
 * /level is an old address now (the retired Levels tab's): it forwards to the
 * chosen level, and a fresh device has chosen none, so to the lowest not yet
 * met.
 */
test('the old Levels address forwards to the lowest level not yet met', async ({ page }) => {
	await goto(page, '/level');
	await expect(page).toHaveURL(/\/level\/1$/);
	await expect(page.locator('h1')).toHaveText(/Commis/);
});

/**
 * Exactly ONE tab may be lit. The old isActive tested `startsWith`, so
 * '/recipes' matched the '/recipe' tab and a recipe page lit two at once.
 * The owners are the design's (3.2): the level test is Quizzes', the level's
 * reading Library's, everything reached from More lights More.
 */
test.describe('exactly one tab owns each route', () => {
	const ROUTES = [
		['/', 'Home'],
		['/level/1', 'Home'],
		['/menu', 'Home'],
		['/level/1/test', 'Quizzes'],
		['/level/1/read', 'Library'],
		['/flashcards', 'Flashcards'],
		['/service/deck', 'Flashcards'],
		['/quizzes', 'Quizzes'],
		['/service/deck/test', 'Quizzes'],
		['/service/deck/say', 'Quizzes'],
		['/service/deck/lineup', 'Quizzes'],
		['/service/drill', 'Quizzes'],
		['/practise/calibrate', 'Quizzes'],
		['/practise/firing', 'Quizzes'],
		['/menu/quiz', 'Quizzes'],
		['/library', 'Library'],
		['/study', 'Library'],
		['/plates', 'Library'],
		['/plates/beef-cuts', 'Library'],
		['/technique', 'Library'],
		['/palate', 'Library'],
		['/safety', 'Library'],
		['/service', 'Library'],
		['/recipes', 'Library'],
		['/recipe/cacio-e-pepe', 'Library'],
		['/chapter/italian', 'Library'],
		['/lexicon', 'Library'],
		['/pantry', 'Library'],
		['/family', 'Library'],
		['/more', 'More'],
		['/menu/costing', 'More'],
		['/menu/preps', 'More'],
		['/menu/producers', 'More'],
		['/menu/prep-board', 'More'],
		['/menu/waste', 'More'],
		['/menu/guest', 'More'],
		['/repertoire', 'More'],
		['/coverage', 'More']
	] as const;

	for (const [path, owner] of ROUTES) {
		test(`${path} lights ${owner} and nothing else`, async ({ page }) => {
			await goto(page, path);
			const on = page.locator('.modetab.on');
			await expect(on).toHaveCount(1);
			await expect(on).toHaveText(new RegExp(`^${owner}`));
		});
	}
});

/**
 * The Library's children, and the way back out.
 *
 * The layout's OWNS map gives the /recipes tab to /family, /pantry and
 * /lexicon, and /recipes linked to none of the three. Measured over the whole
 * built app, /family and /pantry had exactly ONE inbound link each - a tile on
 * the home page, under bands labelled Learn and Practise, which are not the tab
 * that lights when you land. Both were also dead ends: /family's only links are
 * into individual family recipes, which do not exist until the feature has been
 * used, and /pantry has none at all until enough ingredients are ticked.
 *
 * They are pages the Library tab already OWNS, not modes, and promoting a
 * shelf to a mode says the opposite.
 */
test('the Library links to the pages its tab claims', async ({ page }) => {
	await goto(page, '/recipes');
	const shelf = page.locator('nav.shelf');
	await expect(shelf).toBeVisible();
	for (const [href, label] of [
		['/family', 'The Family Chapter'],
		['/pantry', 'Pantry Match'],
		['/lexicon', "Chef's Lexicon"]
	] as const) {
		const link = shelf.locator(`a[href$="${href}"]`);
		await expect(link, `${href} must have a Library-side entrance`).toHaveCount(1);
		await expect(link).toContainText(label);
	}
});

for (const route of ['/family', '/pantry'] as const) {
	test(`${route} has a way back to the Library`, async ({ page }) => {
		await goto(page, route);
		// One way back, the layout's (the consolidation): no crumbs. At depth 0
		// its parent is the Library tab.
		await expect(page.locator('nav.crumbs')).toHaveCount(0);
		await page.locator('.backline button.back').click();
		await expect(page.locator('h1')).toHaveText('Library');
	});
}

/**
 * The coverage board, which nothing linked to at all.
 *
 * Measured over all 2179 built pages it once had ZERO inbound links, the only
 * route in the app with none. Since the consolidation it is More's (Record and
 * progress): More carries the door, More lights, and Back returns there.
 */
test('the coverage board can be reached from More and left', async ({ page }) => {
	await seedSession(page);
	await goto(page, '/more');
	const link = page.locator('main a[href$="/coverage"]');
	await expect(link, 'More must offer the coverage board').toHaveCount(1);

	await link.click();
	await expect(page.locator('h1')).toHaveText(/Coverage/i);
	await expect(page.locator('.people li').first()).toBeVisible();
	await expect(page.locator('.modetab.on')).toHaveText('More');

	await page.locator('.backline button.back').click();
	await expect(page.locator('h1')).toHaveText('More');
});

/**
 * The bar at phone widths, which is where it was broken.
 *
 * Measured before the fix at 375 CSS px: clientWidth 375 against scrollWidth
 * 644, and only THREE tabs visible at 320, 375, 390 and 414. Worse, on
 * /recipes the lit Library tab sat at x 425 to 508 with scrollLeft pinned at
 * 0 — the bar could not show a cook the tab they were standing on, and
 * nothing scrolled it there.
 *
 * The rest of the suite runs at the Playwright default of 1280 and is blind to
 * all of it, which is why it survived this long. Four tabs fit more easily
 * than five did; the floor is the same.
 */
test.describe('the mode bar fits on a phone', () => {
	/*
	 * One page load, resized in place, rather than a test per width.
	 *
	 * The bar is pure CSS — flex-wrap plus one media query — so a resize reflows
	 * it with no JS and no navigation, and four separate loads bought nothing.
	 *
	 * /level/1 is used because the bar is rendered by +layout.svelte and is
	 * identical on every route. The one case that needs a Library-lit page uses
	 * /family, a page that tab owns and which is nearly empty.
	 */
	test('the four tabs and More stay reachable from 320 to 600', async ({ page }) => {
		await goto(page, '/level/1');

		for (const width of [320, 375, 390, 414, 430, 600]) {
			await page.setViewportSize({ width, height: 800 });

			const box = await page.locator('.modebar-inner').evaluate((el) => {
				const inner = el.getBoundingClientRect();
				const within = (e: Element) => {
					const r = e.getBoundingClientRect();
					return (
						r.left >= inner.left - 1 && r.right <= inner.right + 1 && r.bottom <= inner.bottom + 1
					);
				};
				const kids = [...el.children];
				return {
					offscreen: kids.filter((k) => !within(k)).map((k) => k.textContent!.trim()),
					// A bar that overflows is a bar that hides a tab: nothing in the
					// app says it scrolls, and before this fix nothing scrolled it.
					overflows: el.scrollWidth > el.clientWidth + 1,
					// The floor for a one-handed target in a kitchen.
					undersized: kids
						.map((k) => ({ t: k.textContent!.trim(), r: k.getBoundingClientRect() }))
						.filter(({ r }) => r.width < 44 || r.height < 44)
						.map(({ t }) => t)
				};
			});

			expect(box.offscreen, `every tab must be inside the bar at ${width}px`).toEqual([]);
			expect(box.overflows, `the bar must not overflow at ${width}px`).toBe(false);
			expect(box.undersized, `every target must clear 44px at ${width}px`).toEqual([]);
		}
	});

	test('the tab you are standing on is on screen', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 800 });
		await goto(page, '/family');
		const on = page.locator('.modetab.on');
		await expect(on).toHaveCount(1);
		await expect(on).toHaveText(/^Library/);
		await expect(on).toBeInViewport({ ratio: 1 });
	});
});
