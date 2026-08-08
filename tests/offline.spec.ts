import { test, expect } from '@playwright/test';
import { goto } from './helpers';

/**
 * The offline contract, in a real Chromium — the one check the embedded dev
 * browser could not perform, because it resolves serviceWorker.register()
 * without ever installing the worker.
 *
 * The claim being tested is the app's whole reason to exist as a PWA: a phone
 * on a kitchen counter with no signal still serves the entire guide.
 */

async function waitForServiceWorker(page: import('@playwright/test').Page) {
	await goto(page, '/');
	// Wait for the registration to activate AND control the page, then give the
	// precache a moment to fill (58+ entries, all local).
	await page.evaluate(async () => {
		const reg = await navigator.serviceWorker.ready;
		if (!navigator.serviceWorker.controller) {
			await new Promise<void>((resolve) => {
				navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
					once: true
				});
				// A fresh install may already control us by the time this runs.
				if (navigator.serviceWorker.controller) resolve();
			});
		}
		return reg.active?.state;
	});
	await expect
		.poll(
			async () =>
				page.evaluate(async () => {
					let n = 0;
					for (const name of await caches.keys()) {
						n += (await (await caches.open(name)).keys()).length;
					}
					return n;
				}),
			{ timeout: 40_000 }
		)
		.toBeGreaterThan(40);
}

test('the whole app works with the network gone', async ({ page, context }) => {
	// Install + 66-entry precache on a loaded static server takes what it takes.
	test.setTimeout(90_000);
	await waitForServiceWorker(page);

	await context.setOffline(true);

	// Cold navigation to a deep link that was never visited online: the
	// navigation fallback serves the shell, which hydrates from cached JSON.
	await goto(page, '/recipe/tom-yum-goong');
	await expect(page.locator('.head h1')).toHaveText('Tom Yum Goong');
	await expect(page.locator('.ingredients .item').first()).toBeVisible();

	// The pairing came from the lazy pairings chunk — precached.
	await expect(page.locator('.pairing dd').first()).not.toBeEmpty();

	// The lexicon works offline (its 479 terms are a precached chunk).
	await goto(page, '/lexicon');
	await expect(page.locator('.lexcard')).toHaveCount(479);

	// Search works offline (index is a precached chunk).
	await goto(page, '/');
	await page.getByLabel('Search recipes').fill('lemongrass');
	await expect(page.locator('.card')).toHaveCount(13);

	// State still persists offline — IndexedDB owes nothing to the network.
	await goto(page, '/recipe/cacio-e-pepe');
	await page.getByRole('button', { name: /Add to menu/ }).click();
	await page.waitForTimeout(700);
	await page.reload();
	await expect(page.getByRole('button', { name: /On the menu/ })).toBeVisible();

	await context.setOffline(false);
});

test('no request ever leaves the origin', async ({ page }) => {
	const external: string[] = [];
	page.on('request', (req) => {
		const url = new URL(req.url());
		if (url.origin !== 'http://localhost:4173') external.push(req.url());
	});

	await goto(page, '/');
	await page.getByLabel('Search recipes').fill('ragu');
	await goto(page, '/recipe/cacio-e-pepe');
	await goto(page, '/lexicon');
	await goto(page, '/study');

	// YouTube links exist as <a href> navigations the user may choose — but the
	// app itself must never fetch a third-party resource.
	expect(external).toEqual([]);
});
