import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { goto } from './helpers';

test.use({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });

const INDEX = JSON.parse(readFileSync(new URL('../src/lib/data/kitchen.index.json', import.meta.url), 'utf8')) as {
	meals: string[];
	dishes: Array<{ slug: string; level: number; title: string }>;
};
const first = INDEX.dishes[0];
// Production chunks have content hashes. Resolve this lazy import through the
// emitted manifest; also recognise the source URL when checking a dev server.
const manifestPath = new URL('../.svelte-kit/output/client/.vite/manifest.json', import.meta.url);
const manifest = existsSync(manifestPath)
	? JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, { file: string }>
	: {};
const emittedIndex = manifest['src/lib/data/kitchen.index.json']?.file;
const indexRequest = (url: URL) =>
	url.pathname.endsWith('/src/lib/data/kitchen.index.json') ||
	(!!emittedIndex && url.pathname.endsWith(`/${emittedIndex}`));

for (const entry of ['course', 'dish'] as const) {
	test(`Cook at home explains a failed index on ${entry} entry and recovers without losing the address`, async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', error => errors.push(error.message));
		let blocked = 0;
		await page.route(indexRequest, route => {
			blocked++;
			return route.abort('failed');
		});
		const path = entry === 'course'
			? '/kitchen'
			: `/kitchen?d=${first.slug}&level=${first.level}`;
		await goto(page, path);
		const unavailable = page.getByText(/The cooking course could not finish loading/);
		await expect(unavailable).toBeVisible();
		expect(blocked).toBeGreaterThan(0);
		await expect(page.getByText(/Fetching the dish…|Reading the course…/)).toHaveCount(0);
		await expect(page.getByRole('link', { name: 'Cook at home on the level page' })).toBeVisible();
		await page.getByRole('button', { name: 'Try again', exact: true }).click();
		await expect(unavailable).toBeVisible();

		// A failed module import can stay rejected until the document reloads.
		// The recovery screen therefore supplies a reliable explicit reload too.
		await page.unroute(indexRequest);
		await page.getByRole('button', { name: 'Reload cooking course', exact: true }).click();
		await page.waitForSelector('html[data-hydrated]');
		await expect(unavailable).toHaveCount(0);
		await expect(page).toHaveURL(new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
		if (entry === 'course') {
			await expect(page.locator('.kitchen nav.quiet a.door')).toHaveCount(
				INDEX.meals.length * new Set(INDEX.dishes.map(dish => dish.level)).size
			);
		} else {
			await expect(page.locator('article.dish h1')).toHaveText(first.title);
			await expect(page.getByRole('button', { name: 'Cook mode', exact: true })).toBeVisible();
		}
		expect(errors).toEqual([]);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
	});
}
