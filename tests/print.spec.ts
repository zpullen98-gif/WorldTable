import { test, expect } from '@playwright/test';
import { goto } from './helpers';

/**
 * Print output, rendered to real PDFs by headless Chromium. The assertions are
 * structural — chrome hidden, content present, sane page count — because PDF
 * and paper diverge less than screen-emulation and paper do.
 */

test('a recipe prints as a clean sheet', async ({ page }) => {
	await goto(page, '/recipe/ragu-alla-bolognese');
	await page.emulateMedia({ media: 'print' });

	// Interactive chrome is gone: toolbar, mode tabs, pin/cook buttons, films.
	await expect(page.locator('.modebar')).toBeHidden();
	await expect(page.getByRole('button', { name: /Cook mode/ })).toBeHidden();
	await expect(page.locator('.films')).toBeHidden();
	await expect(page.locator('.notes')).toBeHidden();

	// The dish itself is intact.
	await expect(page.locator('h1')).toHaveText('Ragù alla Bolognese');
	await expect(page.locator('.ingredients .item').first()).toBeVisible();
	await expect(page.locator('.steps .step').first()).toBeVisible();
	await expect(page.locator('.recipe-note')).toBeVisible();

	const pdf = await page.pdf({ format: 'A4' });
	// One dish should never need more than 3 sides of A4. (%%EOF-adjacent page
	// counting: /Type /Page occurrences minus the /Pages tree node.)
	const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
	expect(pages).toBeGreaterThan(0);
	expect(pages).toBeLessThanOrEqual(3);
});

test('the guest menu prints ink-on-white with no app chrome', async ({ page }) => {
	// Seed a menu first — the guest card sets itself from the worksheet.
	await goto(page, '/recipe/cacio-e-pepe');
	await page.getByRole('button', { name: /Add to menu/ }).click();
	await goto(page, '/recipe/creme-brulee');
	await page.getByRole('button', { name: /Add to menu/ }).click();
	await page.waitForTimeout(600);

	await goto(page, '/menu/guest');
	await expect(page.locator('.gm .name')).toHaveText(['Cacio e Pepe', 'Crème Brûlée']);
	await expect(page.locator('.gm h2')).toHaveText(['Mains', 'Desserts']);

	await page.emulateMedia({ media: 'print' });
	await expect(page.locator('.tools')).toBeHidden();
	await expect(page.locator('.modebar')).toBeHidden();

	// The card is a physical object: white ground, dark ink, whatever the service.
	const bg = await page
		.locator('.gm')
		.evaluate((el) => getComputedStyle(el).backgroundColor);
	expect(bg).toBe('rgb(255, 255, 255)');

	const pdf = await page.pdf({ format: 'A5' });
	expect(pdf.byteLength).toBeGreaterThan(1000);
});
