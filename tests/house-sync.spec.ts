import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto, HOUSE_INDEX_KEY, seedHouse, seedHouses } from './helpers';

/**
 * The Table's sync with the House (stores/house-wake.ts through
 * stores/house.svelte.ts), through the real page and the real IndexedDB:
 * a device with no house writes nothing on load and nothing on a save (the
 * rows are an implicit house until a person's act mints one); a House on
 * the device with a dish and an empty Table record wakes with the dish on
 * the menu and persisted; a Table record the House has not seen is adopted
 * into the current house on wake, allergen line untouched; a dish removed
 * on the menu leaves a tombstone on the House and stays gone across a
 * reload; and another tab's write to the index reaches this one.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const fixture = () => JSON.parse(readFileSync(join(HERE, '../src/lib/house/fixtures/house-min.json'), 'utf8')) as Record<string, any>;

const dishNames = (page: Page) => page.locator('.dishes .nm');

/** What the device holds: the index, whether the House's database exists, and the Table's own record. */
async function onDevice(page: Page) {
	return page.evaluate(
		([key]) =>
			new Promise<{ index: any; houseDb: boolean; dishes: any[] }>((resolve) => {
				const index = JSON.parse(localStorage.getItem(key) ?? 'null');
				const done = (houseDb: boolean, dishes: any[]) => resolve({ index, houseDb, dishes });
				const dbs = indexedDB.databases ? indexedDB.databases() : Promise.resolve([] as Array<{ name?: string }>);
				void dbs.then((list) => {
					const houseDb = list.some((d) => d.name === 'oot-house');
					const open = indexedDB.open('world-table');
					open.onsuccess = () => {
						const db = open.result;
						if (!db.objectStoreNames.contains('state')) return done(houseDb, []);
						const req = db.transaction('state', 'readonly').objectStore('state').get('house');
						req.onsuccess = () => done(houseDb, req.result?.dishes ?? []);
						req.onerror = () => done(houseDb, []);
					};
					open.onerror = () => done(houseDb, []);
				});
			}),
		[HOUSE_INDEX_KEY]
	);
}

/** One house record out of the House's own database, or null. */
async function houseRecord(page: Page, id: string) {
	return page.evaluate(
		(hid) =>
			new Promise<any>((resolve) => {
				const open = indexedDB.open('oot-house', 1);
				open.onupgradeneeded = () => open.result.createObjectStore('houses');
				open.onsuccess = () => {
					const req = open.result.transaction('houses', 'readonly').objectStore('houses').get(hid);
					req.onsuccess = () => resolve(req.result ?? null);
					req.onerror = () => resolve(null);
				};
				open.onerror = () => resolve(null);
			}),
		id
	);
}

test('no house on the device: nothing is written on load, and a dish saved stays an implicit house', async ({ page }) => {
	await goto(page, '/menu');
	await page.getByRole('button', { name: 'Add a dish' }).click();
	await page.getByLabel('Dish name').fill('Harbour Pie');
	await page.getByRole('button', { name: 'Add to the menu' }).click();
	await expect(dishNames(page)).toHaveText(['Harbour Pie']);
	await expect.poll(async () => (await onDevice(page)).dishes.length).toBe(1);
	const device = await onDevice(page);
	expect(device.index).toBeNull();
	expect(device.houseDb, 'the House database is not made by a load or a save').toBe(false);
	expect('house' in device.dishes[0]).toBe(false);
});

test('a House with a dish and an empty Table record wakes with the dish on the menu, persisted', async ({ page }) => {
	await seedHouses(page, [fixture()]);
	await goto(page, '/menu');
	await expect(dishNames(page)).toHaveText(['Lantern Roast Chicken', 'Beetroot and Apple Salad']);
	await expect.poll(async () => (await onDevice(page)).dishes.length).toBe(2);
	const device = await onDevice(page);
	expect(device.dishes.map((d: any) => [d.id, d.house])).toEqual([
		['d-chicken1', 'h-lantern0'],
		['d-beetrt01', 'h-lantern0']
	]);
	// Nothing on the row says anything about allergens: that line is marked at lineup, by a person.
	for (const d of device.dishes) expect(d.allergens ?? []).toEqual([]);
	await expect(page.locator('.da.unchecked')).toHaveCount(2);
	// And a reload reads the same record, with no second copy.
	await page.evaluate(() => localStorage.setItem('__wt_seed_off', '1'));
	await goto(page, '/menu');
	await expect(dishNames(page)).toHaveText(['Lantern Roast Chicken', 'Beetroot and Apple Salad']);
});

test('a Table record the House has not seen is adopted into the current house on wake, allergen line kept', async ({ page }) => {
	await seedHouse(page); // the Table's own record: Braised cheek, d1, no house
	await seedHouses(page, [fixture()]);
	await goto(page, '/menu');
	await expect(dishNames(page)).toHaveText(['Braised cheek', 'Lantern Roast Chicken', 'Beetroot and Apple Salad']);
	await expect.poll(async () => (await onDevice(page)).dishes.find((d: any) => d.id === 'd1')?.house).toBe('h-lantern0');
	const rec = await houseRecord(page, 'h-lantern0');
	expect(rec.dishes.map((d: any) => d.name)).toEqual(['Lantern Roast Chicken', 'Beetroot and Apple Salad', 'Braised cheek']);
	expect(JSON.stringify(rec)).not.toMatch(/allergen/i);
	expect(JSON.stringify(rec)).not.toContain('recipeSlug');
});

test('a dish removed on the menu leaves a tombstone on the House and stays gone across a reload', async ({ page }) => {
	await seedHouses(page, [fixture()]);
	await goto(page, '/menu');
	await expect(dishNames(page)).toHaveText(['Lantern Roast Chicken', 'Beetroot and Apple Salad']);
	page.on('dialog', (d) => d.accept());
	await page.locator('.dishes li', { hasText: 'Beetroot and Apple Salad' }).getByRole('button', { name: 'Remove', exact: true }).click();
	await expect(dishNames(page)).toHaveText(['Lantern Roast Chicken']);
	await expect.poll(async () => (await houseRecord(page, 'h-lantern0'))?.removed?.['d-beetrt01']).toBeGreaterThan(0);
	const rec = await houseRecord(page, 'h-lantern0');
	expect(rec.dishes.map((d: any) => d.id)).toEqual(['d-chicken1']);
	await page.evaluate(() => localStorage.setItem('__wt_seed_off', '1'));
	await goto(page, '/menu');
	await expect(dishNames(page)).toHaveText(['Lantern Roast Chicken']);
});

test('another tab writing the index wakes this one', async ({ page, context }) => {
	await seedHouses(page, [fixture()]);
	await goto(page, '/menu');
	await expect(dishNames(page)).toHaveText(['Lantern Roast Chicken', 'Beetroot and Apple Salad']);
	await page.evaluate(() => localStorage.setItem('__wt_seed_off', '1'));

	const other = await context.newPage();
	await goto(other, '/menu');
	await expect(dishNames(other)).toHaveText(['Lantern Roast Chicken', 'Beetroot and Apple Salad']);
	await other.getByRole('button', { name: 'Add a dish' }).click();
	await other.getByLabel('Dish name').fill('Harbour Pie');
	await other.getByRole('button', { name: 'Add to the menu' }).click();
	await expect(dishNames(other)).toHaveText(['Lantern Roast Chicken', 'Beetroot and Apple Salad', 'Harbour Pie']);

	// The save touched the stub on the index; the first tab hears it and syncs the row in.
	await expect(dishNames(page)).toHaveText(['Lantern Roast Chicken', 'Beetroot and Apple Salad', 'Harbour Pie'], { timeout: 10_000 });
	await other.close();
});
