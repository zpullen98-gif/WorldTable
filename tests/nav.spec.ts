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
		['/service', 'Service'],
		['/menu', 'Service'],
		['/menu/costing', 'Service'],
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
