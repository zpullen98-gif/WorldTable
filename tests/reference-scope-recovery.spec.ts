import { test, expect } from '@playwright/test';
import { goto } from './helpers';

test.use({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });

test('a one-term Lexicon search makes a one-term quiz and keeps that round fixed', async ({ page }) => {
	await goto(page, '/lexicon?q=nixtamalization');
	await expect(page.locator('.lexcard')).toHaveCount(1);
	await expect(page.locator('.lexcard')).toContainText('Masa Harina');
	await page.getByRole('button', { name: 'Quiz me ▸ multiple choice' }).click();
	await expect(page.locator('.flash .eyebrow')).toContainText('question 1 of 1');
	await expect(page.locator('.opts .opt')).toHaveCount(4);
	// Changing the reading filter must not replace the quiz the learner started.
	await page.getByRole('searchbox', { name: 'Search the lexicon' }).fill('');
	await page.getByRole('button', { name: 'Masa Harina', exact: true }).click();
	await page.getByRole('button', { name: 'See result ↦' }).click();
	await expect(page.locator('.flash .term')).toHaveText('Final: 1 / 1');
	await page.getByRole('button', { name: 'Close', exact: true }).click();
	await page.getByRole('searchbox', { name: 'Search the lexicon' }).fill('no-such-culinary-word');
	await expect(page.locator('.lexcard')).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Quiz me ▸ multiple choice' })).toBeDisabled();
});

for (const route of ['lexicon', 'technique']) {
	test(`${route} explains a failed level scope and never substitutes every level`, async ({ page }) => {
		const isLevels = (url: URL) => url.pathname.endsWith('/levels.json') || /\/levels\.[^.]+\.js$/.test(url.pathname);
		await page.route(isLevels, interception => interception.abort('failed'));
		await goto(page, `/${route}?level=2`);
		await expect(page.getByText(/for this level could not load/)).toBeVisible();
		await expect(page.locator(route === 'lexicon' ? '.lexcard' : 'a.tile')).toHaveCount(0);
		if (route === 'lexicon') await expect(page.getByRole('button', { name: 'Quiz me ▸ multiple choice' })).toBeDisabled();
		await expect(page.getByRole('button', { name: 'Try this level again' })).toBeEnabled();
		await page.unroute(isLevels);
		await page.getByRole('button', { name: 'Reload study material' }).click();
		await page.waitForSelector('html[data-hydrated]');
		await expect(page.locator('.levelnote')).toContainText('Chef de Partie');
		await expect(page.locator(route === 'lexicon' ? '.lexcard' : 'a.tile').first()).toBeVisible();
	});
}
