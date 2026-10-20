import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { goto } from './helpers';

const pack = readFileSync(new URL('../static/shared/packs/brennans-new-orleans.v1.oothouse.json', import.meta.url), 'utf8');
test.use({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => {
	await page.route('**/shared/packs/brennans-new-orleans.v1.oothouse.json', route => route.fulfill({ contentType: 'application/json', body: pack }));
});
const root = async (page: Page) => {
	await goto(page, '/flashcards');
	await expect(page.locator('[data-deck="menu"]')).toBeVisible();
};

test('a new learner can choose an explained level or go straight to today', async ({ page }) => {
	await goto(page, '/');
	await expect(page.locator('.lv-blurb')).toHaveCount(4);
	await expect(page.getByRole('link', { name: 'How to use the Table' })).toHaveAttribute('href', '/more#learning');
	await page.getByRole('link', { name: /Today's study/ }).click();
	await expect(page).toHaveURL(/\/level\/1#today$/);
	await expect(page.locator('#today')).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('finds a deck by name and preserves the search after Back', async ({ page }) => {
	await root(page);
	await page.getByLabel('Find a deck or round').fill('entrees');
	await expect(page.locator('.practice-group')).toHaveCount(1);
	await expect(page.locator('.practice-group .door')).toHaveCount(1);
	await page.locator('[data-deck="menu:Entrées"]').click();
	await expect(page.locator('main h1')).toHaveText('Entrées');
	await page.locator('button.back').click();
	await expect(page.getByLabel('Find a deck or round')).toHaveValue('entrees');
	await page.getByRole('button', { name: 'Clear search' }).click();
	await page.getByRole('navigation', { name: 'Practice sections' }).getByRole('button', { name: 'Your culinary terms', exact: true }).click();
	await expect(page.locator('#fc-foundations')).toBeFocused();
	await page.getByLabel('Find a deck or round').fill('no-such-training-collection');
	await expect(page.getByText('0 decks and rounds found.')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Clear search' })).toBeVisible();
});

test('large collections default to twenty cards and a lesson visit resumes the same answer', async ({ page }) => {
	await root(page);
	await page.locator('[data-deck="menu"]').click();
	await expect(page.getByRole('button', { name: 'Short session · 20 cards' })).toHaveAttribute('aria-pressed', 'true');
	await page.getByRole('button', { name: 'Start', exact: true }).click();
	await expect(page.locator('.deckframe .where')).toHaveText('Card 1 of 20 · The whole menu');
	await expect(page.getByRole('link', { name: 'Read this dish', exact: true })).toHaveCount(0);
	await page.getByRole('button', { name: 'Flip', exact: true }).click();
	const name = await page.locator('.backname').innerText();
	await page.getByRole('link', { name: 'Read this dish', exact: true }).click();
	await expect(page).toHaveURL(/\/menu#d-/, { timeout: 15_000 });
	await expect(page.locator('article.card #card-h')).toHaveText(name);
	await page.locator('button.back').click();
	await expect(page.locator('.backname')).toHaveText(name);
	await expect(page.locator('.deckframe')).toHaveAttribute('data-flipped', 'yes');
	await expect(page.locator('.deckframe .where')).toHaveText('Card 1 of 20 · The whole menu');
});

test('whole-deck choice remains available and component answers link to dish lessons', async ({ page }) => {
	await root(page);
	await page.locator('[data-deck="menu"]').click();
	await page.getByRole('button', { name: /^Whole deck/ }).click();
	await page.getByRole('button', { name: 'Start', exact: true }).click();
	await expect(page.locator('.deckframe .where')).toHaveText('Card 1 of 70 · The whole menu');
	await goto(page, '/flashcards?deck=item-components%3Ad-1q0xk7jv');
	await page.getByRole('button', { name: 'Start', exact: true }).click();
	await page.getByRole('button', { name: 'Flip', exact: true }).click();
	await expect(page.getByRole('navigation', { name: 'Read the lesson' }).getByRole('link').first()).toHaveAttribute('href', /\/menu#d-/);
});

test('a failed deck index gives a usable, honestly limited daily queue', async ({ page }) => {
	await page.route(url => /\/floor-deck\.index\./.test(url.pathname), route => route.abort('failed'));
	await root(page);
	await expect(page.getByText(/Some study material could not load: the Floor Deck/)).toBeVisible();
	await expect(page.getByRole('button', { name: 'Try loading study material again' })).toBeVisible();
	await expect(page.getByRole('button', { name: "Start today's cards" })).toBeVisible();
	await page.getByRole('button', { name: "Start today's cards" }).click();
	await expect(page.locator('.deckframe .where')).toHaveText('Card 1 of 10 · Due today');
});

for (const direct of [false, true]) test(`a failed quiz load ${direct ? 'from a direct study link' : 'from Start'} releases its controls and offers a retry`, async ({ page }) => {
	const isDeck = (url: URL) => url.pathname.endsWith('/floor-deck.json') || /\/floor-deck\.[^.]+\.js$/.test(url.pathname);
	await page.route(isDeck, route => route.abort('failed'));
	if (direct) {
		await root(page);
		await page.getByRole('link', { name: 'Start the quick quiz' }).click();
	} else {
		await goto(page, '/quizzes');
		await page.getByRole('button', { name: 'Start the quick quiz' }).click();
	}
	await expect(page.getByText(/The quiz could not open its study material/)).toBeVisible();
	await expect(page.getByRole('button', { name: 'Start the quick quiz' })).toBeEnabled();
	await page.unroute(isDeck);
	// Browsers retain a failed module request for the lifetime of a document.
	// A reload is the reliable recovery after a connection has returned.
	await page.getByRole('button', { name: 'Reload study material' }).click();
	await page.waitForSelector('html[data-hydrated]');
	if (direct) await page.getByRole('link', { name: 'Start the quick quiz' }).click();
	else await page.getByRole('button', { name: 'Start the quick quiz' }).click();
	await expect(page.locator('.quizzes .where')).toHaveText(/^Question 1 of /);
});
