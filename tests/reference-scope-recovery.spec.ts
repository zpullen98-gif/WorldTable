import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { goto } from './helpers';

test.use({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });

const manifestPath = new URL('../.svelte-kit/output/client/.vite/manifest.json', import.meta.url);
const manifest = existsSync(manifestPath)
	? JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, { file: string }>
	: {};
const emittedIndex = manifest['src/lib/data/levels.json']?.file;
const levelsRequest = (url: URL) => url.pathname.endsWith('/src/lib/data/levels.json') ||
	(!!emittedIndex && url.pathname.endsWith(`/${emittedIndex}`));

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
		let blocked = 0;
		await page.route(levelsRequest, interception => {
			blocked++;
			return interception.abort('failed');
		});
		await goto(page, `/${route}?level=2`);
		await expect(page.getByText(/for this level could not load/)).toBeVisible();
		expect(blocked, 'the actual level data request was blocked').toBeGreaterThan(0);
		await expect(page.locator(route === 'lexicon' ? '.lexcard' : 'a.tile')).toHaveCount(0);
		if (route === 'lexicon') await expect(page.getByRole('button', { name: 'Quiz me ▸ multiple choice' })).toBeDisabled();
		await expect(page.getByRole('button', { name: 'Try this level again' })).toBeEnabled();
		await page.unroute(levelsRequest);
		await page.getByRole('button', { name: 'Reload study material' }).click();
		await page.waitForSelector('html[data-hydrated]');
		await expect(page.locator('.levelnote')).toContainText('Chef de Partie');
		await expect(page.locator(route === 'lexicon' ? '.lexcard' : 'a.tile').first()).toBeVisible();
	});
}
