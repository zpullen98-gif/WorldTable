import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto, seedHouses } from './helpers';

/**
 * Who makes it (the producer deep dive, 6 October 2026), at a phone's 390 by
 * 844, on the fixture house src/lib/house/fixtures/house-min.json with two
 * producer profiles put on it here: a maker behind the chicken's salt crust
 * and an origin behind the Verjus and Tonic's verjus. The card's "Who makes
 * it" block above "What it's made of", a profile opening in full; the
 * Producers view inside My Menu with its groups (the verjus, behind a drink
 * and no dish, At the bar), a dish chip opening the card and Back returning
 * to the view, a drink as words after the dish chips (this standalone build
 * is off the shared origin, so no Ledger link is drawn; the addresses are
 * proved in study-producers.test.ts); the Producers deck on the Flashcards
 * tab and an item's producer deck from the card; and a producer question in
 * the menu drill. Every producer here is invented for the invented house.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = JSON.parse(readFileSync(join(HERE, '../src/lib/house/fixtures/house-min.json'), 'utf8'));

function house() {
	const h = JSON.parse(JSON.stringify(FIXTURE));
	const ts = h.components[0].explain.ts;
	const mark = (value: unknown) => ({ value, by: 'person', ts });
	h.components[0].producer = mark({
		type: 'maker',
		who: 'Quay Salt Works',
		where: 'Quay Lane, Harbourside',
		founded: '1896',
		history: 'The salt works began on the quay, raking salt from the pans below the lamp store.\n\nIt still packs the coarse salt for the crust by hand.',
		facts: ['The salt is raked by hand from the pans.', 'It is the oldest firm on the quay.'],
		notes: ['Say the name slowly; guests ask where the quay is.'],
		sayIt: 'The salt for the crust comes from the Quay Salt Works, at the end of the lane.',
		askKitchen: ['Which week does the salt arrive?']
	});
	h.components[1].producer = mark({
		type: 'origin',
		who: 'The Quay Lane vineyards',
		where: 'Quay Lane, Harbourside',
		founded: '',
		history: 'The verjus is pressed from the first green grapes of the vineyards above the lane.',
		facts: ['The grapes are picked green, weeks before the harvest.'],
		notes: [],
		sayIt: 'The verjus is pressed from green grapes on the hill above us.',
		askKitchen: ['Which week is the verjus pressed?']
	});
	return h;
}

const card = (page: Page) => page.locator('article.card');

async function openChicken(page: Page) {
	await seedHouses(page, [house()]);
	await goto(page, '/menu');
	await expect(page.locator('.study .row').first()).toBeVisible({ timeout: 15_000 });
	await page.locator('.study .row', { has: page.locator('.nm', { hasText: 'Lantern Roast Chicken' }) }).click();
	await expect(card(page).locator('#card-h')).toHaveText('Lantern Roast Chicken');
}

test.use({ viewport: { width: 390, height: 844 } });

test('the card says who makes it, above what it is made of, each producer opening to its profile in full', async ({ page }) => {
	await openChicken(page);
	const block = card(page).locator('section[aria-labelledby="whomakes-h"]');
	await expect(block.locator('h3')).toHaveText('Who makes it');
	const madeOf = card(page).locator('section[aria-labelledby="madeof-h"]');
	expect((await block.boundingBox())!.y).toBeLessThan((await madeOf.boundingBox())!.y);
	const salt = block.locator('li[data-producer="c-saltcrs1"]');
	await expect(salt.locator('summary')).toContainText('Quay Salt Works');
	await expect(salt.locator('summary')).toContainText('Salt crust');
	await expect(salt.locator('details')).not.toHaveAttribute('open', '');
	expect((await salt.locator('summary').boundingBox())!.height).toBeGreaterThanOrEqual(44);
	await salt.locator('summary').click();
	await expect(salt.locator('.pfacts')).toContainText('Quay Lane, Harbourside');
	await expect(salt.locator('.pfacts')).toContainText('1896');
	await expect(salt.locator('.psay')).toContainText('at the end of the lane');
	await expect(salt.locator('.para')).toHaveCount(2);
	await expect(salt.locator('.phead')).toHaveText(['Facts', 'The story', 'Notes for the floor', 'Ask the kitchen']);
	await expect(salt.locator('.pask li')).toHaveText(['Which week does the salt arrive?']);
	const box = (await block.boundingBox())!;
	expect(box.x + box.width).toBeLessThanOrEqual(390);
	for (const a of await block.locator('.links a').all()) expect((await a.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	await expect(block.locator('a', { hasText: 'Flash these producers' })).toHaveAttribute('href', /\/flashcards\?deck=item-producers%3Ad-chicken1&run=1$/);
	await expect(block.locator('a', { hasText: 'All producers' })).toHaveAttribute('href', /\/menu\?view=producers$/);
	// A dish no producer reaches draws no block.
	await page.locator('.backline button.back').click();
	await page.locator('.study .row', { has: page.locator('.nm', { hasText: 'Beetroot' }) }).click();
	await expect(card(page).locator('#card-h')).toContainText('Beetroot');
	await expect(card(page).locator('section[aria-labelledby="whomakes-h"]')).toHaveCount(0);
});

test('the Producers view lists its groups in full, a dish chip opens its card, and Back returns to the view', async ({ page }) => {
	await openChicken(page);
	await card(page).locator('a', { hasText: 'All producers' }).click();
	await expect(page).toHaveURL(/\/menu\?view=producers$/);
	const view = page.locator('section[aria-labelledby="producers-h"]');
	await expect(view.locator('h2')).toHaveText('The producers');
	// The verjus reaches a drink and no dish, so it is At the bar whatever its type.
	await expect(view.locator('h3.grouphead')).toHaveText(['Makers and farms', 'At the bar']);
	await expect(view.locator('h4.pname')).toHaveText(['Quay Salt Works', 'The Quay Lane vineyards']);
	const salt = view.locator('li[data-producer="c-saltcrs1"]');
	await expect(salt.locator('.psub')).toHaveText('Maker · Salt crust');
	await expect(salt).toContainText('It is the oldest firm on the quay.');
	await expect(view.locator('li[data-producer="c-verjus01"] .psub')).toHaveText('Origin · Verjus');
	// The questions are the kitchen's for a producer behind a dish and the bar's At the bar, as the Ledger heads them.
	await expect(salt.locator('.phead').last()).toHaveText('Ask the kitchen');
	await expect(view.locator('li[data-producer="c-verjus01"] .phead').last()).toHaveText('Ask the bar');
	await expect(view.locator('li[data-producer="c-verjus01"] .pask li')).toHaveText(['Which week is the verjus pressed?']);
	// The study list is not drawn under the view.
	await expect(page.locator('.study .row')).toHaveCount(0);
	const chip = salt.locator('button.chip', { hasText: 'Lantern Roast Chicken' });
	expect((await chip.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	await chip.click();
	await expect(card(page).locator('#card-h')).toHaveText('Lantern Roast Chicken');
	await expect(page).toHaveURL(/\/menu\?view=producers#d-chicken1$/);
	await page.locator('.backline button.back').click();
	await expect(view.locator('h2')).toHaveText('The producers');
	await expect(page).toHaveURL(/\/menu\?view=producers$/);
	await expect(card(page)).toHaveCount(0);
	// Once more by the phone's own gesture.
	await chip.click();
	await expect(card(page).locator('#card-h')).toHaveText('Lantern Roast Chicken');
	await page.goBack();
	await expect(view.locator('h2')).toHaveText('The producers');
	// Back from the view leaves it for the card it was opened from.
	await page.locator('.backline button.back').click();
	await expect(card(page).locator('#card-h')).toHaveText('Lantern Roast Chicken');
});

test('a drink is the Ledger\'s: At the bar it is listed, and behind a dish too it follows the dish chips, as words off the shared origin', async ({ page }) => {
	const h = house();
	// The salt crust now reaches the Collins as well as the chicken: a dish and a drink.
	h.components[0].itemIds = ['b-collins1', 'd-chicken1'];
	await seedHouses(page, [h]);
	await goto(page, '/menu?view=producers');
	const view = page.locator('section[aria-labelledby="producers-h"]');
	await expect(view.locator('h2')).toHaveText('The producers', { timeout: 15_000 });
	await expect(view.locator('h3.grouphead')).toHaveText(['Makers and farms', 'At the bar']);
	const groupOf = (key: string) => view.locator(`ul[aria-labelledby="pg-${key}"]`);
	// Behind a dish and a drink: in its food group, the dish a chip, then the drink.
	const salt = groupOf('makers').locator('li[data-producer="c-saltcrs1"]');
	await expect(salt.locator('.chips > *')).toHaveText(['Lantern Roast Chicken', 'The Lantern Collins']);
	await expect(salt.locator('button.chip')).toHaveText(['Lantern Roast Chicken']);
	const collins = salt.locator('[data-drink="c-saltcrs1:b-collins1"]');
	await expect(collins).toHaveClass(/words/);
	expect(await collins.evaluate((el) => el.tagName)).toBe('SPAN');
	expect((await collins.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	// At the bar: the verjus, its drink in words, no chip that would open the Table's card.
	const verjus = groupOf('bar').locator('li[data-producer="c-verjus01"]');
	await expect(verjus.locator('.psub')).toHaveText('Origin · Verjus');
	await expect(verjus.locator('[data-drink="c-verjus01:b-verjus01"]')).toHaveText('Verjus and Tonic');
	await expect(verjus.locator('button.chip')).toHaveCount(0);
	// Off the shared origin no room is linked, by rule.
	await expect(view.locator('a[href*="/ledger/"]')).toHaveCount(0);
	const box = (await view.boundingBox())!;
	expect(box.x + box.width).toBeLessThanOrEqual(390);
});

test('the Producers deck deals every producer card under My restaurant, and the card\'s link deals the dish\'s own', async ({ page }) => {
	await openChicken(page);
	await card(page).locator('a', { hasText: 'Flash these producers' }).click();
	await expect(page).toHaveURL(/\/flashcards\?deck=item-producers/);
	const frame = page.locator('.rcard');
	await expect(frame.locator('.term')).toHaveText('Quay Salt Works: where, and since when?', { timeout: 15_000 });
	await expect(frame.locator('.kkind')).toHaveText('Producers');
	await page.getByRole('button', { name: 'Flip' }).click();
	await expect(frame.locator('.def.back')).toHaveText('Quay Lane, Harbourside. Founded 1896.');
	await page.getByRole('button', { name: 'Got it' }).click();
	await expect(frame.locator('.term')).toHaveText('Quay Salt Works: one thing to know');
	await page.getByRole('button', { name: 'Flip' }).click();
	await page.getByRole('button', { name: 'Got it' }).click();
	await expect(frame.locator('.term')).toHaveText('Quay Salt Works: which dishes?');
	await page.getByRole('button', { name: 'Flip' }).click();
	await expect(frame.locator('.def.back')).toHaveText('Lantern Roast Chicken.');
	await page.getByRole('button', { name: 'Again' }).click();
	await expect(page.locator('.summaryline')).toHaveText('2 got it, 1 to see again.');

	await goto(page, '/flashcards');
	const deck = page.locator('nav[aria-labelledby="fc-house"] [data-deck="producers"]');
	await expect(deck.locator('.door-name')).toHaveText('Producers');
	await expect(deck.locator('.door-line')).toHaveText('6 cards · 2 learnt');
	expect((await deck.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	await deck.click();
	await expect(page.locator('h1')).toHaveText('Producers');
	await page.getByRole('button', { name: 'Start' }).click();
	await expect(page.locator('.rcard .term')).toBeVisible();
	await expect(page.locator('.rcard .term')).toHaveText(/^(Quay Salt Works: |The Quay Lane vineyards: |Orchard Farm: |Verjus House: )/);
});

test('the menu drill asks a producer question when the Producers view sends it there', async ({ page }) => {
	await seedHouses(page, [house()]);
	await goto(page, '/menu?view=producers');
	const view = page.locator('section[aria-labelledby="producers-h"]');
	await expect(view.locator('h2')).toHaveText('The producers', { timeout: 15_000 });
	await view.locator('a', { hasText: 'Quiz the producers' }).click();
	await expect(page).toHaveURL(/\/menu\/quiz\?mode=drill&subject=producer$/);
	const kinds = page.locator('.kinds');
	await expect(kinds.locator('button', { hasText: 'Which dish uses it' })).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 });
	await expect(kinds.locator('button', { hasText: 'Producer, not yet' })).toBeDisabled();
	await expect(kinds.locator('button[aria-pressed="true"]')).toHaveCount(1);
	await page.getByRole('button', { name: /^Deal/ }).click();
	const q = page.locator('.flash.drill');
	await expect(q.locator('.eyebrow')).toContainText('Which dish or drink uses this producer?');
	const stem = (await q.locator('.quizdef').textContent())!.trim();
	expect(['Quay Salt Works', 'The Quay Lane vineyards']).toContain(stem);
	await expect(q.locator('.opt')).toHaveCount(4);
	const right = stem === 'Quay Salt Works' ? 'Lantern Roast Chicken' : 'Verjus and Tonic';
	await q.locator('.opt', { hasText: right }).click();
	await expect(q.locator('.answer')).toContainText('Right.');
	await expect(q.locator('.answer')).toContainText(stem === 'Quay Salt Works' ? 'at the end of the lane' : 'on the hill above us');
});
