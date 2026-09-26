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
 * Home, Levels, Library, Mine: the one nav the three apps share, in that order
 * (the owner's decision, 2026-09-26). The Levels tab is a literal href that
 * forwards to the level the record says you are on.
 */
const TABS = [
	{ href: '/', label: 'Home', h1: /The World/i },
	{ href: '/level', label: 'Levels', h1: /Commis|Your level/ },
	{ href: '/recipes', label: 'Library', h1: /^The Library$/ },
	{ href: '/menu', label: 'Mine', h1: /^My Menu$/ }
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

test('the bar shows exactly four tabs, in the shared order', async ({ page }) => {
	await goto(page, '/');
	const tabs = page.locator('.modetab');
	await expect(tabs).toHaveCount(4);
	for (const [i, label] of ['Home', 'Levels', 'Library', 'Mine'].entries()) {
		await expect(tabs.nth(i)).toHaveText(new RegExp(`^${label}`));
	}
});

/**
 * The Levels tab means "the level you are on": a fresh record lands on Level I,
 * a record that has met Level I lands on Level II. Never a list of four (the
 * home is that) and never a stored choice.
 */
test('the Levels tab forwards to the lowest level not yet met', async ({ page }) => {
	await goto(page, '/level');
	await expect(page).toHaveURL(/\/level\/1$/);
	await expect(page.locator('h1')).toHaveText(/Commis/);
});

/**
 * Exactly ONE tab may be lit. The old isActive tested `startsWith`, so
 * '/recipes' matched the '/recipe' tab and a recipe page lit two at once.
 */
test.describe('exactly one tab owns each route', () => {
	const ROUTES = [
		['/', 'Home'],
		['/level/1', 'Levels'],
		['/level/1/test', 'Levels'],
		['/study', 'Levels'],
		['/technique', 'Levels'],
		['/palate', 'Levels'],
		['/safety', 'Levels'],
		['/service', 'Levels'],
		['/service/deck', 'Levels'],
		['/service/deck/study', 'Levels'],
		['/service/deck/test', 'Levels'],
		['/service/deck/say', 'Levels'],
		['/service/deck/lineup', 'Levels'],
		['/service/drill', 'Levels'],
		['/practise/calibrate', 'Levels'],
		// the firing drill reads the house's own pass plan: Mine's, from My Menu
		['/practise/firing', 'Mine'],
		['/menu', 'Mine'],
		['/menu/costing', 'Mine'],
		// Every sheet under /menu belongs to Mine, which is the point of the
		// tab: the house's own menu, its costs, its preps, its waste, its drill,
		// and the two boards that read the record, in one place.
		['/menu/quiz', 'Mine'],
		['/menu/preps', 'Mine'],
		['/menu/producers', 'Mine'],
		['/menu/prep-board', 'Mine'],
		['/menu/waste', 'Mine'],
		['/menu/guest', 'Mine'],
		['/repertoire', 'Mine'],
		['/coverage', 'Mine'],
		['/recipes', 'Library'],
		['/recipe/cacio-e-pepe', 'Library'],
		['/chapter/italian', 'Library'],
		['/lexicon', 'Library'],
		['/pantry', 'Library'],
		['/family', 'Library']
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

for (const [route, title] of [
	['/family', 'The Family Chapter'],
	['/pantry', 'Pantry Match']
] as const) {
	test(`${route} has a way back to the Library`, async ({ page }) => {
		await goto(page, route);
		const crumb = page.locator('nav.crumbs');
		await expect(crumb).toBeVisible();
		await expect(crumb.locator('a')).toHaveAttribute('href', /\/recipes$/);
		await expect(crumb).toContainText(title);
		// And it goes where it says.
		await crumb.locator('a').click();
		await expect(page.locator('h1')).toHaveText('The Library');
	});
}

/**
 * The coverage board, which nothing linked to at all.
 *
 * Measured over all 2179 built pages it once had ZERO inbound links, the only
 * route in the app with none. The Service hub carried the entrance for a
 * while; since the four levels the board is Mine's (it reads this device's
 * record) and My Menu carries the door, so the way in, the way out and the
 * lit tab all agree.
 */
test('the coverage board can be reached from My Menu and left', async ({ page }) => {
	await seedSession(page);
	await goto(page, '/menu');
	const link = page.locator('a[href$="/coverage"]');
	await expect(link, 'My Menu must offer the coverage board').toHaveCount(1);

	await link.click();
	await expect(page.locator('h1')).toHaveText(/Coverage/i);
	// One record per device, so no line about whose device this is and no
	// apology: just the board. The station list is what proves it rendered.
	await expect(page.locator('.people li').first()).toBeVisible();

	// Way out, and it agrees with the tab that is lit.
	const back = page.locator('.back a');
	await expect(back).toHaveText('Back to My Menu');
	await back.click();
	await expect(page.locator('h1')).toHaveText('My Menu');
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
	test('all four tabs and the toggle stay reachable from 320 to 600', async ({ page }) => {
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
