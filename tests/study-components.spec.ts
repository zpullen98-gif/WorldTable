import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto, seedHouses } from './helpers';

/**
 * What a dish is made of and what to compare it with (the component deep
 * dive, 5 October 2026), at a phone's 390 by 844, on the fixture house
 * src/lib/house/fixtures/house-min.json with a story and a comparison put on
 * it here: the card's "What it's made of" block grouped Ingredients,
 * Techniques, Stories, a component opening to its say, explanation, card and
 * video; "Flash these components" dealing the dish's component deck on the
 * Flashcards tab; the Flashcards root's decks by kind; and "Compare with"
 * linking a Library recipe and a technique here and writing a classic out.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = JSON.parse(readFileSync(join(HERE, '../src/lib/house/fixtures/house-min.json'), 'utf8'));

function house() {
	const h = JSON.parse(JSON.stringify(FIXTURE));
	const ts = h.components[0].explain.ts;
	const mark = (value: unknown) => ({ value, by: 'person', ts });
	h.components.push({
		id: 'c-story001',
		kind: 'story',
		name: 'The lamp store',
		explain: mark('The room was the lamp store on the quay.\n\nThe hearth is the one the lamp makers warmed their hands at.'),
		card: mark({ front: 'What was the room before it was a restaurant?', back: 'The lamp store on the quay; the hearth is the lamp makers’ own.' }),
		itemIds: ['d-chicken1'],
		termIds: [],
		ts
	});
	h.dishes[0].compare = mark([
		{ app: 'table', ref: 'technique/hollandaise', label: 'The Library hollandaise', same: 'A warm emulsion held with care.', different: 'The chicken carries none; this is for the sauce lesson.' },
		{ app: 'classic', ref: '', label: 'Chicken in a clay pot', same: 'The bird cooks sealed, in its own steam.', different: 'A clay pot is used again; the salt crust is broken.' }
	]);
	return h;
}

const card = (page: Page) => page.locator('article.card');

async function openCard(page: Page) {
	await seedHouses(page, [house()]);
	await goto(page, '/menu');
	await expect(page.locator('.study .row').first()).toBeVisible({ timeout: 15_000 });
	await page.locator('.study .row', { has: page.locator('.nm', { hasText: 'Lantern Roast Chicken' }) }).click();
	await expect(card(page).locator('#card-h')).toHaveText('Lantern Roast Chicken');
}

test.use({ viewport: { width: 390, height: 844 } });

test("the card says what the dish is made of, grouped by kind, each component opening to its say, explanation, card and video", async ({ page }) => {
	await openCard(page);
	const block = card(page).locator('section[aria-labelledby="madeof-h"]');
	await expect(block.locator('h3')).toHaveText("What it's made of");
	await expect(block.locator('h4')).toHaveText(['Techniques', 'Stories']);
	const salt = block.locator('li[data-component="c-saltcrs1"]');
	await expect(salt.locator('summary')).toHaveText('Salt crust');
	await expect(salt.locator('details')).not.toHaveAttribute('open', '');
	expect((await salt.locator('summary').boundingBox())!.height).toBeGreaterThanOrEqual(44);
	await salt.locator('summary').click();
	await expect(salt).toContainText('Say it: SALT krust.');
	await expect(salt.locator('.para')).toHaveCount(2);
	await expect(salt.locator('.ccard')).toContainText('What does the salt crust do?');
	await expect(salt.locator('a.vt')).toHaveAttribute('href', 'https://www.youtube.com/watch?v=aaaaaaaaaaa');
	await expect(salt.locator('a.vt')).toHaveAttribute('target', '_blank');
	expect(await page.locator('iframe, video').count()).toBe(0);
	// Nothing in the block is wider than the phone.
	const box = (await block.boundingBox())!;
	expect(box.x + box.width).toBeLessThanOrEqual(390);
	// A dish with no components draws no block.
	await page.locator('.backline button.back').click();
	await page.locator('.study .row', { has: page.locator('.nm', { hasText: 'Beetroot' }) }).click();
	await expect(card(page).locator('#card-h')).toContainText('Beetroot');
	await expect(card(page).locator('section[aria-labelledby="madeof-h"]')).toHaveCount(0);
});

test('Compare with links a Library technique here and writes a classic out with what is the same and what differs', async ({ page }) => {
	await openCard(page);
	const block = card(page).locator('section[aria-labelledby="compare-h"]');
	await expect(block.locator('h3')).toHaveText('Compare with');
	const items = block.locator('li');
	await expect(items).toHaveCount(2);
	const link = items.nth(0).locator('a.clabel');
	await expect(link).toHaveText('The Library hollandaise');
	await expect(link).toHaveAttribute('href', /\/technique\/hollandaise$/);
	expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	await expect(items.nth(0)).toContainText('The same: A warm emulsion held with care.');
	await expect(items.nth(1).locator('a')).toHaveCount(0);
	await expect(items.nth(1)).toContainText('Chicken in a clay pot');
	await expect(items.nth(1)).toContainText('A classic, for comparison');
	await expect(items.nth(1)).toContainText('What differs: A clay pot is used again');
	await link.click();
	await expect(page).toHaveURL(/\/technique\/hollandaise$/);
});

test('Flash these components deals the dish\'s components, Ingredients then Techniques then Stories, and the root lists a deck per kind', async ({ page }) => {
	await openCard(page);
	await card(page).locator('a.flash', { hasText: 'Flash these components' }).click();
	await expect(page).toHaveURL(/\/flashcards\?deck=item-components/);
	const frame = page.locator('.kcard');
	await expect(frame.locator('.term')).toHaveText('What does the salt crust do?', { timeout: 15_000 });
	await expect(frame.locator('.kkind')).toHaveText('Techniques');
	await page.getByRole('button', { name: 'Flip' }).click();
	await expect(frame.locator('.def.back')).toContainText('own steam');
	await page.getByRole('button', { name: 'Got it' }).click();
	await expect(frame.locator('.term')).toHaveText('What was the room before it was a restaurant?');
	await page.getByRole('button', { name: 'Flip' }).click();
	await page.getByRole('button', { name: 'Again' }).click();
	await expect(page.locator('.summaryline')).toHaveText('1 got it, 1 to see again.');

	await goto(page, '/flashcards');
	const made = page.locator('nav[aria-labelledby="fc-made"]');
	await expect(made.locator('.door-name')).toHaveText(['Techniques', 'Stories']);
	await expect(made.locator('[data-deck="components:technique"] .door-line')).toHaveText('1 card · 1 learnt');
	await expect(made.locator('[data-deck="components:story"] .door-line')).toHaveText('1 card · 0 learnt');
	for (const b of await made.locator('button.door').all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	await made.locator('[data-deck="components:story"]').click();
	await expect(page.locator('h1')).toHaveText('Stories');
	await page.getByRole('button', { name: 'Start' }).click();
	await expect(page.locator('.kcard .term')).toHaveText('What was the room before it was a restaurant?');
});
