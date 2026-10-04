import { test, expect } from '@playwright/test';
import { goto } from './helpers';

test('kitchen studies stay closed until wanted, then provide a numbered key and accessible zoom', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	const artRequests: string[] = [];
	page.on('request', request => {
		const path = new URL(request.url()).pathname;
		if (/\/(?:standards|house\/brennans)\/|\/plates\/louisiana-larder-v/.test(path)) artRequests.push(path);
	});
	await goto(page, '/plates');
	const collection = page.locator('.companion-studies');
	await expect(collection.locator('details.teaching-folio')).toHaveCount(5);
	await expect(collection.locator('img')).toHaveCount(0);
	expect(artRequests).toEqual([]);
	const egg = collection.locator('#folio-poached-egg-standard');
	await egg.locator('summary').click();
	await expect(egg.locator('.folio-key > li')).toHaveCount(2);
	const picture = egg.locator('figure img');
	await expect.poll(() => picture.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 1536)).toBe(true);
	await expect(picture).toHaveAttribute('alt', /1\. Gentle poaching:.*2\. Disrupted white/);
	const opener = egg.getByRole('button', { name: 'Enlarge illustration' });
	await opener.click();
	const dialog = page.getByRole('dialog', { name: 'A poached egg: the result and the faults', exact: true });
	await expect(dialog).toBeVisible();
	await page.keyboard.press('+');
	await expect(dialog.locator('.zoom-value')).toHaveText('150%');
	await page.keyboard.press('Escape');
	await expect(opener).toBeFocused();
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test('a linked technique opens the requested folio and its key survives a missing image', async ({ page }) => {
	await page.route('**/standards/poached-egg-standard-v1.webp', route => route.abort());
	await goto(page, '/technique/poaching-eggs#folio-poached-egg-standard');
	const folio = page.locator('#folio-poached-egg-standard');
	await expect(folio).toHaveAttribute('open');
	await expect(folio.locator('.image-unavailable')).toBeVisible();
	await expect(folio.locator('.folio-key > li')).toHaveCount(2);
	await expect(folio.getByRole('button', { name: 'Enlarge illustration' })).toBeDisabled();
	await expect(folio.locator('.folio-scope')).toContainText('not a rolling boil alone');
});

test('opened companions in all three artwork folders stay available offline', async ({ page, context }) => {
	test.setTimeout(90_000);
	await goto(page, '/plates');
	await page.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL === new URL('/sw.js', location.href).href, undefined, { timeout: 40_000 });
	const studies = [
		['brennans-sauces', '/house/brennans/brennans-sauces-v1.webp'],
		['poached-egg-standard', '/standards/poached-egg-standard-v1.webp'],
		['louisiana-larder', '/plates/louisiana-larder-v1.webp']
	];
	for (const [id, path] of studies) {
		const folio = page.locator(`#folio-${id}`);
		await folio.locator('summary').click();
		await expect.poll(() => folio.locator('figure img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
		await expect.poll(() => page.evaluate(async path => !!await (await caches.open('plates-v1')).match(path), path), { timeout: 40_000 }).toBe(true);
		await folio.locator('summary').click();
	}
	await context.setOffline(true);
	await page.reload();
	await page.waitForSelector('html[data-hydrated]');
	for (const [id] of studies) {
		const folio = page.locator(`#folio-${id}`);
		await folio.locator('summary').click();
		await expect.poll(() => folio.locator('figure img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
		await folio.locator('summary').click();
	}
	await context.setOffline(false);
});
