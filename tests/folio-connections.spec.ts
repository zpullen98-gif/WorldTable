import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto, seedHouses } from './helpers';
import { TEACHING_FOLIOS } from '../src/lib/teaching-folios';

const HERE = dirname(fileURLToPath(import.meta.url));
const HOUSE = JSON.parse(readFileSync(join(HERE, '../static/shared/packs/brennans-new-orleans.v1.oothouse.json'), 'utf8')).house;

async function learningRecords(page: Page) {
	return page.evaluate(() => new Promise<string>(resolve => {
		const open = indexedDB.open('world-table');
		open.onsuccess = () => {
			const request = open.result.transaction('state', 'readonly').objectStore('state').getAll();
			request.onsuccess = () => {
				const records = request.result.map(record => ({ drillLog: record?.drillLog ?? [], cookedLog: record?.cookedLog ?? [] }));
				open.result.close();
				resolve(JSON.stringify({ records, studied: localStorage.getItem('oot-studied-v1'), drilled: localStorage.getItem('oot-house-drilled-v1') }));
			};
		};
	}));
}

test.use({ viewport: { width: 390, height: 844 } });

test('Library and the Brennan menu expose compact doors to the complete collection', async ({ page }) => {
	await seedHouses(page, [HOUSE]);
	await goto(page, '/library');
	const door = page.getByRole('link', { name: /Illustrated kitchen studies/ });
	await expect(door).toContainText(`${TEACHING_FOLIOS.length} companion studies`);
	await door.click();
	await expect(page).toHaveURL(/\/plates#companion-studies-h$/);
	await expect(page.locator('.companion-studies details.teaching-folio')).toHaveCount(TEACHING_FOLIOS.length);
	await expect(page.locator('.companion-studies img')).toHaveCount(0);
	await goto(page, '/menu');
	await expect(page.locator('#illustrated-kitchen-studies')).toHaveCount(0);
	await page.locator('nav.house-sections').getByRole('link', { name: 'Kitchen studies', exact: true }).click();
	await expect(page).toHaveURL(/\/menu\?view=learn$/);
	const collection = page.locator('details#illustrated-kitchen-studies');
	await expect(collection).toHaveJSProperty('open', false);
	await expect(collection.locator('img')).toHaveCount(0);
	await collection.locator(':scope > summary').click();
	await expect(collection.locator(':scope > summary')).toBeInViewport();
	await expect(collection.locator('details.teaching-folio')).toHaveCount(TEACHING_FOLIOS.length);
	await expect(collection.locator('details.teaching-folio[open]')).toHaveCount(0);
	await expect(collection.locator('img')).toHaveCount(0);
});

test('recipe, training kitchen and service lessons lead to the exact authored studies', async ({ page }) => {
	await goto(page, '/recipe/sauce-bearnaise');
	const sauces = page.locator('#folio-brennans-sauces');
	await expect(sauces).toBeAttached();
	await expect(sauces.locator('img')).toHaveCount(0);
	await sauces.locator(':scope > summary').click();
	await expect(sauces.locator('.folio-key')).toContainText('Béarnaise');
	await goto(page, '/kitchen?d=cilbir&level=1');
	await expect(page.locator('#folio-poached-egg-standard')).toBeAttached();
	await expect(page.locator('#folio-poached-egg-standard img')).toHaveCount(0);
	await goto(page, '/service/srv-charc-world');
	const larder = page.locator('a[href$="#folio-louisiana-larder"]').first();
	await expect(larder).toBeVisible();
	await larder.click();
	await expect(page.locator('#folio-louisiana-larder')).toHaveAttribute('open');
});

for (const [kind, route] of [
	['dish', '/flashcards?deck=item:d-1q0xk7jv&run=1'],
	['component', '/flashcards?deck=item-components:d-1q0xk7jv&run=1'],
	['tasting', '/flashcards?deck=tasting:t-ogscmuc7&run=1']
] as const) {
	test(`${kind} cards show studies only after reveal and preserve their run on Back`, async ({ page }) => {
		const house = structuredClone(HOUSE);
		house.components = house.components.filter((component: { id: string }) => component.id === 'c-3g6wf620');
		house.tastings = house.tastings.filter((tasting: { id: string }) => tasting.id === 't-ogscmuc7');
		house.tastings[0].courses = house.tastings[0].courses.filter((course: { n: number }) => course.n === 4);
		await seedHouses(page, [house]);
		await goto(page, route);
		// A cold run URL intentionally lands on the deck's Start screen.
		await page.getByRole('button', { name: 'Start', exact: true }).click();
		const frame = page.locator('.deckframe');
		await expect(frame).toHaveAttribute('data-flipped', 'no');
		await expect(frame.locator('.folio-links')).toHaveCount(0);
		const position = await frame.locator('.where').textContent();
		await frame.getByRole('button', { name: 'Flip', exact: true }).click();
		const before = await learningRecords(page);
		await frame.locator('a[href$="#folio-eggs-hussarde-components"]').click();
		await expect(page.locator('#folio-eggs-hussarde-components')).toHaveAttribute('open');
		await page.goBack();
		await expect(frame).toHaveAttribute('data-flipped', 'yes');
		await expect(frame.locator('.where')).toHaveText(position!);
		await expect(page.locator('.tally')).toHaveText('0 got it, 0 to see again.');
		expect(await learningRecords(page)).toBe(before);
	});
}

test('recall reveals one numbered view at a time without writing a grade', async ({ page }) => {
	await goto(page, '/plates#folio-poached-egg-standard');
	const folio = page.locator('#folio-poached-egg-standard');
	const before = await learningRecords(page);
	await folio.getByRole('button', { name: 'Practise recall' }).click();
	await expect(folio.locator('.folio-key')).toBeHidden();
	await expect(folio.locator('.recall-answer')).toHaveCount(0);
	await expect(folio.locator('.recall-prompt')).toContainText('Name view 1');
	await folio.getByRole('button', { name: 'Reveal this view' }).click();
	await expect(folio.locator('.recall-answer')).toContainText('Gentle poaching');
	await folio.getByRole('button', { name: 'Next view' }).click();
	await expect(folio.locator('.recall-answer')).toHaveCount(0);
	await expect(folio.locator('.recall-prompt')).toContainText('Name view 2');
	await folio.getByRole('button', { name: 'Reveal this view' }).click();
	await expect(folio.locator('.recall-answer')).toContainText('Disrupted white');
	await expect(folio.getByRole('button', { name: 'Next view' })).toHaveCount(0);
	await folio.getByRole('button', { name: 'Return to the full key' }).click();
	await expect(folio.locator('.folio-key')).toBeVisible();
	expect(await learningRecords(page)).toBe(before);
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test('missing artwork can be retried in place with its key and zoom intact', async ({ page }) => {
	const path = '**/standards/poached-egg-standard-v1.webp';
	await page.route(path, route => route.abort());
	await goto(page, '/technique/poaching-eggs#folio-poached-egg-standard');
	const folio = page.locator('#folio-poached-egg-standard');
	await expect(folio.locator('.image-unavailable')).toBeVisible();
	await expect(folio.locator('.folio-key > li')).toHaveCount(2);
	await page.unroute(path);
	await folio.getByRole('button', { name: 'Try again' }).click();
	await expect.poll(() => folio.locator('figure img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
	await expect(folio.locator('.image-unavailable')).toHaveCount(0);
	await folio.getByRole('button', { name: 'Enlarge illustration' }).click();
	await expect(page.getByRole('dialog')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(folio.getByRole('button', { name: 'Enlarge illustration' })).toBeFocused();
});
