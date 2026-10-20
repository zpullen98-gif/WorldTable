import { test, expect } from '@playwright/test';
import { goto, seedSession, seedHouses } from './helpers';
import { readFileSync } from 'node:fs';

test.use({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });

test('Library finds a chapter and keeps the directory open when returning', async ({ page }) => {
	await goto(page, '/library');
	await expect(page.getByRole('link', { name: /learning guide/ })).toHaveAttribute('href', /\/more#learning$/);
	await expect(page.getByRole('link', { name: /Brennan’s Final Plates/ })).toHaveAttribute('href', /\/menu\?view=plates$/);
	await page.locator('details.chapters summary').click();
	await page.getByRole('searchbox', { name: 'Find a cuisine or chapter' }).fill('French');
	const chapters = page.locator('.chapterlist a');
	await expect(chapters.first()).toBeVisible();
	expect(await chapters.count()).toBeLessThan(10);
	await chapters.first().click();
	await expect(page).toHaveURL(/\/chapter\//);
	await page.goBack();
	await expect(page.getByRole('searchbox', { name: 'Find a cuisine or chapter' })).toHaveValue('French');
	await expect(page.locator('details.chapters')).toHaveAttribute('open', '');
	await page.getByRole('button', { name: 'Clear chapter search' }).click();
	expect(await chapters.count()).toBeGreaterThan(100);
});

test('Techniques search, group filter and return preserve a focused reading path', async ({ page }) => {
	await goto(page, '/technique');
	await page.getByRole('searchbox', { name: 'Find a skill' }).fill('brais');
	await page.getByRole('combobox', { name: 'Technique group' }).selectOption('foundations');
	const tile = page.locator('a.tile').first();
	await expect(tile).toContainText(/Brais/i);
	await tile.click();
	await expect(page).toHaveURL(/\/technique\/[^/?]+/);
	await page.goBack();
	await expect(page.getByRole('searchbox', { name: 'Find a skill' })).toHaveValue('brais');
	await expect(page.getByRole('combobox', { name: 'Technique group' })).toHaveValue('foundations');
	await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
	expect(await page.locator('a.tile').count()).toBeGreaterThan(100);
});

test('A chapter-directory deep link opens the search and can return to the full directory', async ({ page }) => {
	await goto(page, '/library#chapters');
	await expect(page.locator('details.chapters')).toHaveAttribute('open', '');
	await expect(page.locator('#chapters')).toBeFocused();
	await page.getByRole('searchbox', { name: 'Find a cuisine or chapter' }).fill('not-a-cuisine');
	await expect(page.locator('.chapterlist a')).toHaveCount(0);
	await page.getByRole('button', { name: 'Clear chapter search' }).click();
	expect(await page.locator('.chapterlist a').count()).toBeGreaterThan(100);
});

test('Lexicon search survives refresh and linked reading, with an accessible clear action', async ({ page }) => {
	await goto(page, '/lexicon');
	await page.getByRole('searchbox', { name: 'Search the lexicon' }).fill('braising');
	await page.getByRole('combobox', { name: 'Filter by category' }).selectOption('Techniques: Heat & Precision');
	await expect(page).toHaveURL(/q=braising/);
	await expect(page).toHaveURL(/category=/);
	const count = await page.locator('.lexcard').count();
	expect(count).toBeGreaterThan(0);
	await page.reload();
	await page.waitForSelector('html[data-hydrated]');
	await expect(page.getByRole('searchbox', { name: 'Search the lexicon' })).toHaveValue('braising');
	await expect(page.getByRole('combobox', { name: 'Filter by category' })).toHaveValue('Techniques: Heat & Precision');
	await expect(page.locator('.lexcard')).toHaveCount(count);
	const recipe = page.locator('.lexcard a[href*="/recipe/"]').first();
	await recipe.click();
	await expect(page).toHaveURL(/\/recipe\//);
	await page.goBack();
	await expect(page.getByRole('searchbox', { name: 'Search the lexicon' })).toHaveValue('braising');
	await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
	await expect(page.getByRole('searchbox', { name: 'Search the lexicon' })).toBeFocused();
	await expect(page).not.toHaveURL(/[?&]q=/);
	await expect(page).not.toHaveURL(/[?&]category=/);
});

test('Pantry recovers a zero-match selection without erasing ingredients', async ({ page }) => {
	await seedSession(page, { pantry: ['Chicken', 'Chocolate/Cocoa', 'Salmon'] });
	await goto(page, '/pantry');
	const recovery = page.getByRole('button', { name: /^Use any match/ });
	await expect(recovery).toBeVisible();
	await recovery.click();
	await expect(page.getByRole('combobox', { name: 'Minimum matches' })).toHaveValue('1');
	await expect(page.getByRole('combobox', { name: 'Minimum matches' })).toBeFocused();
	expect(await page.locator('.results li').count()).toBeGreaterThan(0);
	for (const label of ['Chicken', 'Chocolate/Cocoa', 'Salmon']) await expect(page.getByRole('checkbox', { name: label, exact: true })).toBeChecked();
	await page.getByRole('searchbox', { name: 'Filter ingredients' }).fill('zzzznoingredient');
	await expect(page.locator('.ingredient-empty')).toBeVisible();
	await page.getByRole('button', { name: 'Show all ingredients' }).click();
	await expect(page.getByRole('searchbox', { name: 'Filter ingredients' })).toHaveValue('');
	await page.getByRole('button', { name: 'See matching dishes' }).click();
	await expect(page.getByRole('heading', { name: 'Matching dishes' })).toBeFocused();
	await expect(page.locator('.shelf label').first()).toHaveCSS('min-height', '44px');
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('A level-specific Lexicon reader opens flashcards at that same level', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('oot-level-table-v1', '4'));
	await goto(page, '/lexicon?level=2');
	await expect(page.locator('.levelnote')).not.toBeEmpty();
	await page.getByRole('link', { name: 'Flashcards', exact: true }).click();
	await expect(page).toHaveURL(/\/flashcards\?deck=lexicon/);
	expect(await page.evaluate(() => localStorage.getItem('oot-level-table-v1'))).toBe('2');
});

test('Library keeps demonstrations available in a compact, remembered video shelf', async ({ page }) => {
	const house = JSON.parse(readFileSync(new URL('../src/lib/house/fixtures/house-min.json', import.meta.url), 'utf8'));
	await seedHouses(page, [house]);
	await goto(page, '/library');
	const shelf = page.locator('details.video-shelf');
	await expect(shelf.locator('summary')).toContainText(`Browse ${house.videos.length} videos by subject`);
	await expect(shelf).not.toHaveAttribute('open', '');
	await shelf.locator('summary').click();
	await expect(shelf.locator('a.vt')).toHaveCount(house.videos.length);
	await expect(shelf.locator('a.vt').first()).toBeVisible();
	await shelf.locator('.for button').first().click();
	await expect(page).toHaveURL(/\/menu#/);
	await page.goBack();
	await expect(shelf).toHaveAttribute('open', '');
	await expect(shelf.locator('a.vt').first()).toBeVisible();
});
