import { test, expect } from '@playwright/test';
import { PREP_TO_PASS_TEACHING_FOLIOS } from '../src/lib/teaching-folios-prep-to-pass';
import { goto } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('all six new studies remain in the Cook’s Eye and expose matching close views in both services', async ({ page }) => {
	test.setTimeout(90_000);
	await goto(page, '/plates#folio-group-cooks-eye');
	for (const study of PREP_TO_PASS_TEACHING_FOLIOS) {
		const folio = page.locator('#folio-' + study.id);
		await expect(folio.locator('img')).toHaveCount(0);
		await folio.locator(':scope > summary').click();
		await expect(folio.locator('.folio-key > li')).toHaveCount(study.subjects.length);
		await expect.poll(() => folio.locator('.illustration-box > img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
		for (const service of ['day', 'night']) {
			await page.evaluate(value => document.documentElement.setAttribute('data-service', value), service);
			await page.setViewportSize({ width: service === 'day' ? 390 : 320, height: 844 });
			for (let view = 1; view <= study.subjects.length; view++) {
				const button = folio.getByRole('button', { name: 'View ' + view, exact: true });
				await button.click();
				await expect(button).toHaveAttribute('aria-pressed', 'true');
				await expect(folio.locator('.folio-art')).toHaveAttribute('data-focus-view', String(view));
			}
			expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(service === 'day' ? 390 : 320);
		}
		await folio.getByRole('button', { name: 'Practise recall', exact: true }).click();
		await expect(folio.locator('.folio-key')).toBeHidden();
		await expect(folio.locator('.folio-learning')).toHaveCount(0);
		await expect(folio.locator('.recall-answer')).toHaveCount(0);
		await folio.getByRole('button', { name: 'Reveal this view', exact: true }).click();
		await expect(folio.locator('.recall-answer')).toContainText(study.subjects[0].name);
		await folio.getByRole('button', { name: 'Return to the full key', exact: true }).click();
		await folio.locator('.learning-question > summary').click();
		await expect(folio.locator('.learning-answer > p')).toBeHidden();
		await folio.locator('.learning-answer > summary').click();
		await expect(folio.locator('.learning-answer > p')).toHaveText(study.learning!.answer);
		await folio.locator(':scope > summary').click();
	}
});

test('the frying Fieldbook study stays behind card reveal and never grades visual recall', async ({ page }) => {
	await goto(page, '/foundations?term=methods-fried');
	const reading = page.locator('.foundation-visuals #folio-coating-frying');
	await expect(reading).toBeVisible();
	await expect(reading.locator('img')).toHaveCount(0);
	await page.getByRole('link', { name: 'Practise this term', exact: true }).click();
	await page.getByRole('button', { name: 'Start', exact: true }).click();
	await expect(page.locator('.deckframe .foundation-visuals')).toHaveCount(0);
	await page.getByRole('button', { name: 'Flip', exact: true }).click();
	const folio = page.locator('.deckframe #folio-coating-frying');
	await expect(folio).toBeVisible();
	await folio.locator(':scope > summary').click();
	await folio.getByRole('button', { name: 'Practise recall', exact: true }).click();
	await folio.getByRole('button', { name: 'Reveal this view', exact: true }).click();
	await folio.getByRole('button', { name: 'Next view', exact: true }).click();
	await expect(folio.locator('.recall-prompt')).toContainText('Name view 2');
	await expect(page.locator('.tally')).toHaveText('0 got it, 0 to see again.');
});

test('the choux lesson and its revealed card share the new study and restore the learning position', async ({ page }) => {
	await goto(page, '/cuisine?ch=pastry&e=choux');
	const folio = page.locator('#folio-choux-structure');
	await expect(folio).toBeVisible();
	await expect(folio.locator('img')).toHaveCount(0);
	await page.getByRole('link', { name: 'Flash this entry', exact: true }).click();
	const frame = page.locator('.deckframe');
	await expect(frame.locator('.folio-links')).toHaveCount(0);
	const position = await frame.locator('.where').textContent();
	await page.getByRole('button', { name: 'Flip', exact: true }).click();
	await frame.locator('a[href$="#folio-choux-structure"]').click();
	await expect(page.locator('#folio-choux-structure')).toHaveAttribute('open');
	await page.goBack();
	await expect(frame).toHaveAttribute('data-flipped', 'yes');
	await expect(frame.locator('.where')).toHaveText(position!);
	await expect(page.locator('.tally')).toHaveText('0 got it, 0 to see again.');
});

test('the new illustrations stay available offline after opening without installing the entire art library', async ({ page, context }) => {
	test.setTimeout(90_000);
	await goto(page, '/plates');
	await page.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL === new URL('/sw.js', location.href).href, undefined, { timeout: 40_000 });
	for (const study of PREP_TO_PASS_TEACHING_FOLIOS) {
		const folio = page.locator('#folio-' + study.id);
		await folio.locator(':scope > summary').click();
		await expect.poll(() => folio.locator('.illustration-box > img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
		await expect.poll(() => page.evaluate(async path => !!await (await caches.open('plates-v1')).match(path), '/' + study.image.src), { timeout: 40_000 }).toBe(true);
		await folio.locator(':scope > summary').click();
	}
	await context.route('**/*.webp', route => route.abort());
	await context.setOffline(true);
	await page.reload();
	await page.waitForSelector('html[data-hydrated]');
	for (const study of PREP_TO_PASS_TEACHING_FOLIOS) {
		const folio = page.locator('#folio-' + study.id);
		await folio.locator(':scope > summary').click();
		await expect.poll(() => folio.locator('.illustration-box > img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
		await expect(folio.locator('.folio-learning')).toBeVisible();
		await folio.locator(':scope > summary').click();
	}
	await context.setOffline(false);
});
