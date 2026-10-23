import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { goto, seedHouses } from './helpers';
import type { BrennanFinalDish } from '../src/lib/brennans-final-dishes';

const HOUSE = JSON.parse(readFileSync('static/shared/packs/brennans-new-orleans.v1.oothouse.json', 'utf8')).house;
// Read the expected assets independently of the browser implementation. Native
// Node ESM does not load the app's bundler-only JSON imports without attributes.
const brennansFinalDishes = JSON.parse(readFileSync(new URL('../src/lib/data/brennans-final-dishes.json', import.meta.url), 'utf8')).items as BrennanFinalDish[];
const houseToFall = JSON.parse(readFileSync(new URL('../src/lib/data/brennans-final-dish-links.json', import.meta.url), 'utf8')) as Record<string, string>;
const egg = brennansFinalDishes.find(art => art.itemId === 'd-1q0xk7jv')!;
const fall = brennansFinalDishes.find(art => art.collection === 'fall')!;
const fallHouseId = Object.entries(houseToFall).find(([, fieldNoteId]) => fieldNoteId === fall.itemId)![0];
test.use({ viewport: { width: 390, height: 844 } });

test('the gallery filters all dishes, requests full art only on demand and returns from a lesson without losing place', async ({ page }) => {
	await seedHouses(page, [HOUSE]);
	const fullRequests: string[] = [];
	page.on('request', request => {
		if (/\/final-plates\/.+-v\d+\.webp$/.test(request.url())) fullRequests.push(request.url());
	});
	await goto(page, '/menu?view=plates');
	await expect(page.locator('.plate-tile')).toHaveCount(70);
	expect(fullRequests).toEqual([]);
	await page.getByLabel('Menu collection', { exact: true }).selectOption('fall');
	await expect(page.locator('.plate-tile')).toHaveCount(8);
	await page.getByLabel('Menu collection', { exact: true }).selectOption('');
	await page.getByLabel('Find a dish or ingredient').fill('Hussarde');
	await expect(page.locator('.plate-tile')).toHaveCount(1);
	await page.locator('.plate-preview').click();
	const image = page.locator('.final-dish figure > .illustration-box img');
	await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
	await expect(page.locator('.plate-caption')).toContainText('chef-informed examples');
	await page.getByRole('button', { name: 'Enlarge illustration', exact: true }).click();
	await expect(page.getByRole('dialog')).toBeVisible();
	await page.keyboard.press('+');
	await expect(page.locator('.zoom-value')).toHaveText('150%');
	await page.keyboard.press('Escape');
	await expect(page.getByRole('button', { name: 'Enlarge illustration', exact: true })).toBeFocused();
	await page.getByRole('button', { name: 'Read this dish', exact: true }).click();
	await expect(page.locator('.studyslot .card #card-h')).toHaveText(egg.name);
	await expect(page.locator('.studyslot .final-dish')).toBeVisible();
	await page.goBack();
	await expect(page.getByLabel('Find a dish or ingredient')).toHaveValue('Hussarde');
	await expect(page.locator('.plate-tile')).toHaveCount(1);
	await expect(page.getByRole('button', { name: 'Read this dish', exact: true })).toBeFocused();
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

for (const [name, deck, itemId] of [
	['house', 'item:d-1q0xk7jv', egg.itemId],
	['canonical fall', `item:${fallHouseId}`, fallHouseId],
	['fall', `fall:item:${fall.itemId}`, fall.itemId]
]) {
	test(`${name} flashcards reveal the final plate only after the answer and an explicit open`, async ({ page }) => {
		await seedHouses(page, [HOUSE]);
		const requests: string[] = [];
		page.on('request', request => { if (request.url().includes('/final-plates/')) requests.push(request.url()); });
		await goto(page, `/flashcards?deck=${encodeURIComponent(deck)}&run=1`);
		await page.getByRole('button', { name: 'Start', exact: true }).click();
		const frame = page.locator('.deckframe');
		await expect(frame).toHaveAttribute('data-flipped', 'no');
		await expect(frame.locator('.final-dish')).toHaveCount(0);
		expect(requests).toEqual([]);
		await frame.getByRole('button', { name: 'Flip', exact: true }).click();
		const plate = frame.locator(`[data-final-dish="${itemId}"]`);
		await expect(plate).toBeVisible();
		await expect(plate.locator('img')).toHaveCount(0);
		expect(requests).toEqual([]);
		await plate.locator('summary').click();
		await expect.poll(() => plate.locator('figure > .illustration-box img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
		await expect(plate.locator('.plate-reading')).toContainText('Read the plate');
	});
}

test('fall gallery cards open their canonical menu lessons while preserving the ingredient-notes route', async ({ page }) => {
	await seedHouses(page, [HOUSE]);
	await goto(page, '/menu?view=plates');
	const tile = page.locator(`[data-plate="fall:${fall.itemId}"]`);
	await tile.locator('.plate-preview').click();
	const canonicalId = fallHouseId;
	await expect(tile.getByRole('link', { name: 'Fall ingredient notes', exact: true })).toHaveAttribute('href', `/menu?view=fall&kind=dish&item=${fall.itemId}`);
	await expect(tile.getByRole('link', { name: 'Drill this dish', exact: true })).toHaveAttribute('href', `/flashcards?deck=item:${canonicalId}`);
	await tile.getByRole('button', { name: 'Read this dish', exact: true }).click();
	await expect(page.locator('.studyslot #card-h')).toHaveText(HOUSE.dishes.find((dish: { id: string }) => dish.id === canonicalId).name);
	const plate = page.locator(`.studyslot [data-final-dish="${canonicalId}"]`);
	await expect(plate.locator('.illustration-box img')).toHaveAttribute('src', `/${fall.src}`);
	await expect(page.locator('.studyslot .fallnotes .fall-art')).toBeVisible();
	await page.goBack();
	await expect(tile.getByRole('button', { name: 'Read this dish', exact: true })).toBeFocused();
});

test('a missing final plate keeps its ingredient reading, and fall ingredient studies remain separate', async ({ page }) => {
	await page.route(`**/${fall.src}`, route => route.abort());
	await goto(page, `/menu?view=fall&kind=dish&item=${fall.itemId}`);
	await expect(page.locator('.final-dish .image-unavailable')).toBeVisible();
	await expect(page.locator('.final-dish .plate-reading')).toBeVisible();
	await expect(page.locator('.fall-art')).toBeVisible();
	await expect(page.locator('.fall-art img')).toHaveCount(0);
	await page.locator('.fall-art > summary').click();
	await expect(page.locator('.fall-art .art-cues')).toBeVisible();
});

test('a final image opened after worker claim can be read offline without any bulk fetch', async ({ page, context }) => {
	test.setTimeout(90_000);
	await goto(page, `/menu?view=fall&kind=dish&item=${fall.itemId}`);
	await page.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, { timeout: 40_000 });
	const path = '/' + fall.src;
	await expect.poll(() => page.evaluate(async path => !!await (await caches.open('plates-v1')).match(path), path), { timeout: 40_000 }).toBe(true);
	await context.route('**/*', route => route.abort());
	await context.setOffline(true);
	await page.reload();
	await page.waitForSelector('html[data-hydrated]');
	const image = page.locator('.final-dish figure > .illustration-box img');
	await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
	expect(await page.evaluate(() => fetch('/uncached-final-plate-offline-control.txt').then(() => false, () => true))).toBe(true);
	await context.setOffline(false);
});
