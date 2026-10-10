import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { FIRST_COLLECTION_TEACHING_FOLIOS } from '../src/lib/teaching-folios-first-collection';
import { goto } from './helpers';

test('the first cooking collection teaches fourteen views on their lessons, in both services and offline', async ({ page, context }) => {
	test.setTimeout(120_000);
	await page.setViewportSize({ width: 390, height: 844 });
	let views = 0;
	for (const [index, study] of FIRST_COLLECTION_TEACHING_FOLIOS.entries()) {
		await goto(page, `/technique/${study.techniques[0]}#folio-${study.id}`);
		const folio = page.locator(`#folio-${study.id}`);
		await expect(folio).toHaveAttribute('open');
		await expect(folio.locator('.folio-key > li')).toHaveCount(study.subjects.length);
		await expect(folio.locator('.folio-key strong')).toHaveText(study.subjects.map(subject => subject.name));
		views += study.subjects.length;
		await expect.poll(() => folio.locator('figure img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 1536)).toBe(true);
		await expect(folio.locator('figure img')).toHaveAttribute('alt', new RegExp(`1\\. ${study.subjects[0].name}:`));
		for (const service of ['day', 'night']) {
			if (await page.locator('html').getAttribute('data-service') !== service) {
				await page.locator('#oot-service-toolbar').getByRole('button', { name: `Switch to ${service} service` }).click();
			}
			await expect(page.locator('html')).toHaveAttribute('data-service', service);
			await expect(folio.locator('.folio-key')).toBeVisible();
			expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
			if (index === 0) expect((await new AxeBuilder({ page }).include(`#folio-${study.id}`).analyze()).violations).toEqual([]);
		}
		await folio.getByRole('button', { name: 'Practise recall' }).click();
		await expect(folio.locator('.folio-key')).toBeHidden();
		await expect(folio.locator('.recall-answer')).toHaveCount(0);
		await folio.getByRole('button', { name: 'Reveal this view' }).click();
		await expect(folio.locator('.recall-answer')).toContainText(study.subjects[0].description);
		await folio.getByRole('button', { name: 'Return to the full key' }).click();
		await page.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL === new URL('/sw.js', location.href).href, undefined, { timeout: 40_000 });
		// Wait for the asynchronous runtime-cache write, not only the image load.
		await expect.poll(() => page.evaluate(async path => !!await (await caches.open('plates-v1')).match(path), `/${study.image.src}`), { timeout: 40_000 }).toBe(true);
	}
	expect(views).toBe(14);
	await context.route('**/*.webp', route => route.abort());
	await context.setOffline(true);
	expect(await page.evaluate(() => navigator.onLine)).toBe(false);
	try {
		for (const study of FIRST_COLLECTION_TEACHING_FOLIOS) {
			await goto(page, `/technique/${study.techniques[0]}#folio-${study.id}`);
			const folio = page.locator(`#folio-${study.id}`);
			await expect(folio).toHaveAttribute('open');
			await expect.poll(() => folio.locator('figure img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 1536)).toBe(true);
			await expect(folio.locator('.folio-key > li')).toHaveCount(study.subjects.length);
		}
	} finally {
		await context.setOffline(false);
	}
});
