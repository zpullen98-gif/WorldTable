import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { goto, seedSession } from './helpers';

test.use({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
const manifestPath = new URL('../.svelte-kit/output/client/.vite/manifest.json', import.meta.url);
const manifest = existsSync(manifestPath)
	? JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, { file: string }>
	: {};
const searchChunk = manifest['src/lib/data/search-index.json']?.file;

test('the learning guide offers six applied journeys and remembers the chosen level', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('oot-level-table-v1', '2'));
	await goto(page, '/more#learning');
	await expect(page.getByRole('heading', { name: 'How to use the Table' })).toBeVisible();
	await expect(page.locator('.learning-guide').getByRole('link', { name: "Today's study", exact: true })).toHaveAttribute('href', '/level/2#today');
	await page.getByText('Six kitchen-to-tableside study journeys', { exact: true }).click();
	await expect(page.locator('.journey')).toHaveCount(6);
	await page.locator('.journey summary').first().click();
	await expect(page.locator('.journey').first().getByRole('link')).toHaveCount(4);
	await page.getByRole('link', { name: 'Identify: capers', exact: true }).click();
	await expect(page).toHaveURL(/term=vegetables-capers/);
	await expect(page.locator('main')).toContainText(/caperberries/i);
	await page.goBack();
	await expect(page.locator('#learning')).toBeAttached();
	await expect(page.locator('.guide-panel').first()).toHaveAttribute('open', '');
	await expect(page.locator('.journey').first()).toHaveAttribute('open', '');
});

test('recipe section shortcuts move focus and keep personal notes through reload', async ({ page }) => {
	await seedSession(page);
	await goto(page, '/recipe/coq-au-vin');
	await expect(page.getByRole('button', { name: /On the menu/ })).toBeVisible();
	await page.getByRole('navigation', { name: 'In this recipe' }).getByRole('link', { name: 'Method', exact: true }).click();
	await expect(page.locator('#recipe-method')).toBeFocused();
	await page.getByRole('navigation', { name: 'In this recipe' }).getByRole('link', { name: 'Your notes', exact: true }).click();
	await page.getByLabel('Family notes').fill('Compare the sauce before and after reducing.');
	await expect(page.getByRole('link', { name: 'Brennan’s → Session and tools', exact: true })).toHaveAttribute('href', '/menu#tools');
	// The test seed must not overwrite what the real app saved on reload.
	await page.evaluate(() => localStorage.setItem('__wt_seed_off', '1'));
	await expect.poll(() => page.evaluate(() => new Promise<string>((resolve, reject) => {
		const open = indexedDB.open('world-table');
		open.onerror = () => reject(open.error);
		open.onsuccess = () => {
			const db = open.result;
			const query = db.transaction('state').objectStore('state').get('session');
			query.onsuccess = () => { resolve(query.result?.notes?.['coq-au-vin'] ?? ''); db.close(); };
			query.onerror = () => { reject(query.error); db.close(); };
		};
	})), { timeout: 15000 }).toBe('Compare the sauce before and after reducing.');
	await page.reload();
	// A reload serves the prerendered, empty textarea before the app hydrates.
	// Wait for both hydration and the saved session, as on the initial visit.
	await page.waitForSelector('html[data-hydrated]', { timeout: 15_000 });
	await expect(page.getByRole('button', { name: /On the menu/ })).toBeVisible();
	await expect(page.getByLabel('Family notes')).toHaveValue('Compare the sauce before and after reducing.');
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('recipe search explains an unavailable ingredient index and can retry', async ({ page }) => {
	const index = (url: URL) => url.pathname.endsWith('/src/lib/data/search-index.json') ||
		(!!searchChunk && url.pathname.endsWith(`/${searchChunk}`));
	await page.route(index, route => route.abort('failed'));
	await goto(page, '/recipes?q=omelette');
	await expect(page.getByRole('heading', { level: 1, name: 'All recipes' })).toBeVisible();
	await expect(page.getByText(/Ingredient search could not load/)).toBeVisible();
	await expect(page.getByRole('link', { name: /The French Omelette/ }).first()).toBeVisible();
	await page.unroute(index);
	await page.getByRole('button', { name: 'Retry ingredient search' }).click();
	// Chromium can retain a failed module import until the document reloads.
	await page.getByRole('button', { name: 'Reload this search' }).click();
	await expect(page.getByText(/Ingredient search could not load/)).toHaveCount(0);
	await expect(page.getByRole('link', { name: /The French Omelette/ }).first()).toBeVisible();
});

test('a missing address gives correctly labelled recovery routes', async ({ page }) => {
	await goto(page, '/this-page-does-not-exist');
	await expect(page.getByRole('heading', { name: 'Nothing at this address' })).toBeVisible();
	const recovery = page.getByRole('navigation', { name: 'Find your way back' });
	await expect(recovery.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute('href', '/');
	await recovery.getByRole('link', { name: 'Library', exact: true }).click();
	await expect(page).toHaveURL(/\/library$/);
	await expect(page.getByRole('heading', { name: 'Library', exact: true })).toBeVisible();
});
