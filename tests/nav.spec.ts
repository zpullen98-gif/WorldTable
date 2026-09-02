import { test, expect } from '@playwright/test';
import { goto } from './helpers';

/**
 * The five tabs, and the reason this file exists.
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
 */
const TABS = [
	{ href: '/', label: 'Today', h1: /The World|Today/i },
	{ href: '/learn', label: 'Learn', h1: /^Learn$/ },
	{ href: '/practise', label: 'Practise', h1: /^Practise$/ },
	{ href: '/service', label: 'Service', h1: /^Service$/ },
	{ href: '/recipes', label: 'Library', h1: /^The Library$/ }
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

test('the bar shows exactly five tabs', async ({ page }) => {
	await goto(page, '/');
	await expect(page.locator('.modetab')).toHaveCount(5);
});

/**
 * Exactly ONE tab may be lit. The old isActive tested `startsWith`, so
 * '/recipes' matched the '/recipe' tab and a recipe page lit two at once.
 */
test.describe('exactly one tab owns each route', () => {
	const ROUTES = [
		['/', 'Today'],
		['/learn', 'Learn'],
		['/study', 'Learn'],
		['/technique', 'Learn'],
		['/palate', 'Learn'],
		['/safety', 'Learn'],
		['/practise', 'Practise'],
		['/repertoire', 'Practise'],
		['/menu/quiz', 'Practise'],
		['/practise/firing', 'Practise'],
		['/service', 'Service'],
		['/menu', 'Service'],
		['/menu/costing', 'Service'],
		// Added with the waste log, along with three siblings the list had never
		// caught up with. /service OWNS the '/menu' prefix, so every sheet under
		// it is Service — but nothing was asserting that for four of them.
		['/menu/preps', 'Service'],
		['/menu/prep-board', 'Service'],
		['/menu/waste', 'Service'],
		['/coverage', 'Service'],
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
 * A sixth mode tab was not an option: the bar needs 463 CSS px and already
 * clips Service and Library at every common iPhone width.
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
 * Measured over all 2179 built pages it had ZERO inbound links, the only route
 * in the app with none. Its one authored link sits behind `{#if manager}` on
 * /practise, and `manager` is false unless the shared Outside Of Time layer is
 * present AND this device has been opted in — a switch that lives in a
 * different wing. Meanwhile the layout's OWNS map lights the SERVICE tab on it,
 * so the tab that claimed the page was the one place that never linked to it,
 * and the page's own exit went to Practise instead.
 *
 * Ungated on the Service hub is safe: the page narrows the roster to your own
 * record before reading anything, and says so.
 */
test('the coverage board can be reached and left without being a manager', async ({ page }) => {
	await goto(page, '/service');
	const link = page.locator('a[href$="/coverage"]');
	await expect(link, 'Service must offer the coverage board').toHaveCount(1);

	await link.click();
	await expect(page.locator('h1')).toHaveText(/Coverage/i);
	// A plain device is told what it is seeing rather than shown an empty board.
	await expect(page.locator('.warn')).toContainText("not marked as a manager's device");

	// Way out, and it agrees with the tab that is lit.
	const back = page.locator('.back a');
	await expect(back).toHaveText('Back to Service');
	await back.click();
	await expect(page.locator('h1')).toHaveText('Service');
});
