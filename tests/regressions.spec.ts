import { test, expect } from '@playwright/test';
import { goto } from './helpers';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/* Read rather than import: Playwright's loader wants an import attribute for
   JSON, and parity.spec.ts already reads its fixtures this way. */
const TOTALS = JSON.parse(
	readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/lib/data/totals.json'), 'utf8')
) as { recipes: number; chapters: number; lexicon: number; techniques: number };

/**
 * The named regression suite.
 *
 * Each test carries the line number of the defect in the ORIGINAL
 * (reference/world-table-v1.html) that it guards against, so nobody
 * "simplifies" a fix without tripping the alarm that explains why it existed.
 */

test('L582 — header shows the real counts, not three bare labels', async ({ page }) => {
	await goto(page, '/');
	const counts = page.locator('.counts dd');
	// Read from the same emitted totals the masthead reads, so this asserts that
	// the header is WIRED to the data rather than asserting what the corpus
	// happened to be the day somebody typed it. It was ['970','94','479'] for
	// months after the corpus reached 1710, which is how the suite went red
	// without anybody choosing that.
	await expect(counts).toHaveText([
		String(TOTALS.recipes),
		String(TOTALS.chapters),
		String(TOTALS.lexicon)
	]);
});

test('L2506 — typing in the Lexicon search keeps recipe cross-links', async ({ page }) => {
	await goto(page, '/lexicon');
	await expect(page.locator('.lexcard').first()).toBeVisible();

	const before = await page.locator('.xrefs a').count();
	expect(before).toBeGreaterThan(0);

	// The original bound the un-enhanced renderLex to this input: one keystroke
	// stripped every cross-link on the page.
	await page.getByLabel('Search the lexicon').fill('brisket');
	await expect(page.locator('.lexcard')).toHaveCount(6);
	expect(await page.locator('.xrefs a').count()).toBeGreaterThan(0);
});

test('L2806 — typing in the Pantry filter keeps the hemisphere toggle', async ({ page }) => {
	await goto(page, '/pantry');
	await expect(page.locator('.linkish')).toBeVisible();

	// The original bound the pre-v3 buildShelf here: one keystroke reverted the
	// shelf and destroyed the toggle outright.
	await page.getByLabel('Filter ingredients').fill('to');
	await expect(page.locator('.linkish')).toBeVisible();

	// And it still works while filtered.
	await page.locator('.linkish').click();
	await expect(page.locator('.linkish')).toContainText('Southern');
});

test('L1913 — unaccented searches find their accented dishes', async ({ page }) => {
	await goto(page, '/recipes');
	const search = page.getByLabel('Search recipes');

	await search.fill('ragu');
	await expect(page.locator('.card h3', { hasText: 'Ragù alla Bolognese' })).toBeVisible();
	// The substring-scan bug in OUR first pass: "ragu" matching aspaRAGUs.
	await expect(
		page.locator('.card h3', { hasText: 'Idaho Morel and Asparagus Saute' })
	).toHaveCount(0);

	await search.fill('nicoise');
	await expect(page.locator('.card h3', { hasText: 'Salade Niçoise' })).toBeVisible();

	await search.fill('creme brulee');
	await expect(page.locator('.card h3', { hasText: 'Crème Brûlée' })).toBeVisible();
});

test('ingredient search finds dishes by what goes in them', async ({ page }) => {
	await goto(page, '/recipes');
	await page.getByLabel('Search recipes').fill('lemongrass');
	/* The claim here is NOT "the corpus contains N lemongrass dishes", which
	   changes whenever a recipe is added and which is what made this test go
	   red. It is that the search reads INGREDIENTS: the substring fallback over
	   name and chapter found exactly one dish, and the index finds the rest.

	   So: many results, and specifically a dish whose own name never says
	   lemongrass. Beef Rendang can only be found here by what is in the pot.

	   The ORDER matters. The search index is a lazy import, so for a moment the
	   grid holds only the substring fallback's single hit. toHaveCount and
	   toBeVisible retry until they pass; a bare `await locator.count()` reads
	   once and would catch that moment, which is exactly what it did. Wait on a
	   retrying assertion first, then count. */
	await expect(page.locator('.card h3', { hasText: 'Beef Rendang' })).toBeVisible();
	await expect(page.locator('.card h3', { hasText: 'Tom Yum Goong' })).toBeVisible();
	expect(await page.locator('.card').count()).toBeGreaterThan(5);
});

test('persistence — pin, note, service and units survive a reload', async ({ page }) => {
	await goto(page, '/recipe/cacio-e-pepe');

	await page.getByRole('button', { name: /Add to menu/ }).click();
	await page.getByLabel('Family notes').fill('Toast the pepper dry.');
	await page.getByRole('button', { name: 'US' }).click();
	await page.getByRole('button', { name: /day and night service/ }).click();

	// Outlive the 400ms debounce, then start a genuinely fresh document.
	await page.waitForTimeout(700);
	await page.reload();

	await expect(page.getByRole('button', { name: /On the menu/ })).toBeVisible();
	await expect(page.getByLabel('Family notes')).toHaveValue('Toast the pepper dry.');
	await expect(page.getByRole('button', { name: 'US' })).toHaveClass(/on/);
});

test('L3488 — a family recipe is visibly distinct and fully integrated', async ({ page }) => {
	// The original wrote fam:1 onto family recipes and never read it anywhere.
	await goto(page, '/family');
	// getByLabel, not getByPlaceholder: the accessible names come from the
	// wrapping <label> text ("Ingredients — one per line"); the placeholders
	// hold example content.
	await page.getByLabel('Dish name').fill('Test Family Stew');
	await page.getByLabel(/Ingredients[:\u2014-] one per line/).fill('2 onions\n500g beef');
	await page
		.getByLabel(/Method[:\u2014-] one step per line/)
		.fill('Brown the beef.\nSimmer 90 min until tender.');
	await page.getByRole('button', { name: 'Add to the guide' }).click();
	await expect(page.locator('.msg')).toContainText('Test Family Stew');

	// In the grid, badged, linking into the client-only /family/ space.
	await goto(page, '/recipes?q=test family stew');
	const card = page.locator('.card', { hasText: 'Test Family Stew' });
	await expect(card).toBeVisible();
	await expect(card.locator('.badge.fam')).toHaveText('Family');
	expect(await card.getAttribute('href')).toContain('/family/test-family-stew');

	// Its page renders from IndexedDB, durations parsed.
	await card.click();
	await expect(page.locator('.head h1')).toHaveText('Test Family Stew');
	await expect(page.locator('.dur')).toHaveText(['90 min']);
});

test('L3600 — the sommelier pours for a dish, cook mode steps through it', async ({ page }) => {
	await goto(page, '/recipe/cacio-e-pepe');

	// Pairing panel present with all four pours.
	await expect(page.locator('.pairing dt')).toHaveText([
		'The Pour',
		'Also Right',
		'From the Taps',
		'Zero-Proof'
	]);

	// Cook mode: step 1 of Cacio e Pepe states "1 min" — the timer must offer
	// exactly 1:00, and moving to step 2 (no stated time) must offer none.
	await page.getByRole('button', { name: /Cook mode/ }).click();
	await expect(page.locator('.cook .eyebrow')).toContainText('step 1 of 4');
	await expect(page.locator('.cook .clock')).toHaveText('1:00');

	await page.keyboard.press('ArrowRight');
	await expect(page.locator('.cook .eyebrow')).toContainText('step 2 of 4');
	await expect(page.locator('.cook .clock')).toHaveCount(0);
	await expect(page.locator('.notimer')).toBeVisible();

	await page.keyboard.press('Escape');
	await expect(page.locator('.cook')).toHaveCount(0);
});

test('deep link renders the dish before JavaScript runs', async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const page = await context.newPage();
	// Plain goto: with JavaScript disabled there is no hydration to wait for —
	// that is the point of the test.
	await page.goto('/recipe/moussaka');
	await expect(page.locator('h1')).toHaveText('Moussaka');
	await expect(page.locator('.ingredients .item').first()).toBeVisible();
	await context.close();
});

test('the slash key focuses the search box', async ({ page }) => {
	await goto(page, '/recipes');
	await page.locator('body').press('/');
	await expect(page.getByLabel('Search recipes')).toBeFocused();
});
