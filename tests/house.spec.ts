import { test, expect, type Page } from '@playwright/test';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto, HOUSE_INDEX_KEY, seedHouses } from './helpers';

/**
 * The house bar on /menu, through the real page: the prerendered no-house
 * line, a house minted and named, a dish that carries the house, a pack
 * imported by file with nothing leaving the device, "Open it now?", the
 * export named by packFilename, and a switch between two houses that swaps
 * the dish list and brings it back. Everything asserted by OUTCOME on the
 * screen, and by what the device holds where the screen cannot show it.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(HERE, '../src/lib/house/fixtures/house-min.json');
const fixture = () => JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, any>;

const NO_HOUSE_LINE = 'No house yet. Your dishes, drinks and wines belong to a house: import a pack, or start one.';

/** A second house beside the fixture: one dish of its own and nothing else, so a switch has somewhere to go. */
function secondHouse() {
	const f = fixture();
	const dish = { ...f.dishes[0], id: 'd-pie00001', house: 'h-second01', name: 'Harbour Pie', description: 'Smoked haddock, leek, a pastry lid' };
	return {
		...f,
		id: 'h-second01',
		name: 'The Second Room',
		dishes: [dish],
		wines: [],
		cocktails: [],
		tastings: [],
		lexicon: [],
		scenarios: [],
		mixUps: [],
		mustKnows: [],
		askAtLineup: [],
		disputes: [],
		removed: {},
		build: { card: f.createdAt ? Date.parse(f.createdAt) : Date.now() }
	};
}

const houseLine = (page: Page) => page.locator('.housebar h2');
const dishNames = (page: Page) => page.locator('.dishes .nm');

/** Every request the page made to her host, routed or not: the proof that an import sends nothing. */
function watchAnthropic(page: Page): string[] {
	const out: string[] = [];
	page.on('request', (req) => {
		if (new URL(req.url()).hostname === 'api.anthropic.com') out.push(req.url());
	});
	return out;
}

/** What the device holds: the index, and the Table's own record. */
async function onDevice(page: Page) {
	return page.evaluate(
		([key]) =>
			new Promise<{ index: any; dishes: any[] }>((resolve) => {
				const index = JSON.parse(localStorage.getItem(key) ?? 'null');
				const open = indexedDB.open('world-table');
				open.onsuccess = () => {
					const req = open.result.transaction('state', 'readonly').objectStore('state').get('house');
					req.onsuccess = () => resolve({ index, dishes: req.result?.dishes ?? [] });
					req.onerror = () => resolve({ index, dishes: [] });
				};
				open.onerror = () => resolve({ index, dishes: [] });
			}),
		[HOUSE_INDEX_KEY]
	);
}

/** One house record out of the House's own database. */
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

test('the page is prerendered with the no-house line, and a device with no house still reads it after hydration', async ({ page, request }) => {
	// The HTML on disk, before any script runs: the one line, and no house name.
	const html = await (await request.get('/menu')).text();
	expect(html).toContain(NO_HOUSE_LINE);
	expect(html).toContain('<h2 id="house-line"');
	await goto(page, '/menu');
	await expect(houseLine(page)).toHaveText(NO_HOUSE_LINE);
	// Nothing to switch between, nothing to export, nothing to rename; the two doors in stand open.
	await expect(page.getByRole('button', { name: 'Switch', exact: true })).toBeDisabled();
	await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeDisabled();
	await expect(page.getByRole('button', { name: 'New house' })).toBeEnabled();
	await expect(page.getByRole('button', { name: 'Import a pack' })).toBeEnabled();
});

test('New house names the line, and a dish added on the menu carries the house', async ({ page }) => {
	await goto(page, '/menu');
	await page.getByRole('button', { name: 'New house' }).click();
	await page.getByLabel('Name the new house').fill('The Lantern Room');
	await page.getByRole('button', { name: 'Start it' }).click();
	await expect(houseLine(page)).toHaveText(
		'The Lantern Room · 0 dishes here · 0 wines in the Codex · 0 drinks in the Ledger · next: the house card'
	);

	// A dish through the hand form. The Table saves its own row first, then
	// the House takes it and stamps the row with the house id.
	await page.getByRole('button', { name: 'Add a dish' }).click();
	await page.getByLabel('Dish name').fill('Lantern Roast Chicken');
	await page.getByRole('button', { name: 'Add to the menu' }).click();
	await expect(dishNames(page)).toHaveText(['Lantern Roast Chicken']);
	await expect(houseLine(page)).toContainText('The Lantern Room · 1 dish here');

	await expect.poll(async () => (await onDevice(page)).dishes.map((d) => d.house)).toHaveLength(1);
	const device = await onDevice(page);
	expect(device.index.current).toMatch(/^h-/);
	expect(device.dishes[0].house).toBe(device.index.current);
	// And the House's own record holds the dish, with the Table's allergen line nowhere on it.
	const rec = await houseRecord(page, device.index.current);
	expect(rec.dishes.map((d: any) => d.name)).toEqual(['Lantern Roast Chicken']);
	expect(JSON.stringify(rec)).not.toMatch(/allergen/i);
});

test('a pack imported by file sends nothing to Anthropic, offers "Open it now?", and Open shows its dishes', async ({ page }) => {
	const toHer = watchAnthropic(page);
	await page.route('**/api.anthropic.com/**', (route) => route.abort());
	await goto(page, '/menu');

	const dir = mkdtempSync(join(tmpdir(), 'house-'));
	const file = join(dir, 'house-the-lantern-room.oothouse.json');
	writeFileSync(file, JSON.stringify({ format: 'oot-house-pack', version: 1, exportedAt: new Date().toISOString(), app: { from: 'tools' }, house: fixture() }));

	// A device with a house already on it AND something in it, so the pack is
	// listed behind it and asks. (An empty hand house is the implicit "My
	// house" a person minted a moment ago, and a pack would take its place.)
	await page.getByRole('button', { name: 'New house' }).click();
	await page.getByLabel('Name the new house').fill('My house');
	await page.getByRole('button', { name: 'Start it' }).click();
	await expect(houseLine(page)).toContainText('My house ·');
	await page.getByRole('button', { name: 'Add a dish' }).click();
	await page.getByLabel('Dish name').fill('House Pie');
	await page.getByRole('button', { name: 'Add to the menu' }).click();
	await expect(houseLine(page)).toContainText('My house · 1 dish here');

	await page.getByRole('button', { name: 'Import a pack' }).click();
	await page.locator('.housebar input[type=file]').setInputFiles(file);
	await expect(page.locator('.housebar .said')).toHaveText('The Lantern Room added. Open it now?');
	// Not open yet: the line still names the first house, and the list is empty.
	await expect(houseLine(page)).toContainText('My house · 1 dish here');
	await expect(dishNames(page)).toHaveText(['House Pie']);

	await page.getByRole('button', { name: 'Open', exact: true }).click();
	await expect(houseLine(page)).toHaveText(
		'The Lantern Room · 2 dishes here · 1 wine in the Codex · 2 drinks in the Ledger · complete · menus read 2026-09-28'
	);
	await expect(dishNames(page)).toHaveText(['Lantern Roast Chicken', 'Beetroot and Apple Salad']);
	// The one thing a pack never carries, said once above the list.
	await expect(page.locator('.packline')).toHaveText('A pack never carries allergens; mark each at lineup.');
	// And every one of them reads as not marked, because nobody has looked.
	await expect(page.locator('.da.unchecked')).toHaveCount(2);
	expect(toHer, 'a pack import reaches no host').toEqual([]);
});

test('Export downloads the current house as a pack named by packFilename', async ({ page }) => {
	await seedHouses(page, [fixture()]);
	await goto(page, '/menu');
	await expect(houseLine(page)).toContainText('The Lantern Room ·');
	const downloading = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Export', exact: true }).click();
	const download = await downloading;
	expect(download.suggestedFilename()).toMatch(/^house-the-lantern-room-\d{4}-\d{2}-\d{2}\.oothouse\.json$/);
	const text = readFileSync((await download.path())!, 'utf8');
	const pack = JSON.parse(text);
	expect(pack.format).toBe('oot-house-pack');
	expect(pack.app.from).toBe('table');
	expect(pack.house.id).toBe('h-lantern0');
	expect(pack.house.dishes.map((d: any) => d.name)).toEqual(['Lantern Roast Chicken', 'Beetroot and Apple Salad']);
	expect(text).not.toMatch(/allergen/i);
});

test('Switch between two houses swaps the dish list and brings it back', async ({ page }) => {
	await seedHouses(page, [fixture(), secondHouse()], 'h-lantern0');
	await goto(page, '/menu');
	await expect(houseLine(page)).toContainText('The Lantern Room ·');
	await expect(dishNames(page)).toHaveText(['Lantern Roast Chicken', 'Beetroot and Apple Salad']);

	await page.getByRole('button', { name: 'Switch', exact: true }).click();
	const pick = page.getByLabel('Open another house on this device');
	await expect(pick).toHaveValue('h-lantern0');
	await pick.selectOption('h-second01');
	await expect(houseLine(page)).toContainText('The Second Room · 1 dish here · 0 wines in the Codex · 0 drinks in the Ledger · next: the menus');
	await expect(dishNames(page)).toHaveText(['Harbour Pie']);

	await page.getByRole('button', { name: 'Switch', exact: true }).click();
	await page.getByLabel('Open another house on this device').selectOption('h-lantern0');
	await expect(houseLine(page)).toContainText('The Lantern Room ·');
	await expect(dishNames(page)).toHaveText(['Lantern Roast Chicken', 'Beetroot and Apple Salad']);

	// The pointer on the device followed, and the Table's record holds only the open house's rows.
	const device = await onDevice(page);
	expect(device.index.current).toBe('h-lantern0');
	expect(device.dishes.map((d: any) => d.house)).toEqual(['h-lantern0', 'h-lantern0']);
});

test('every control on the bar is 44px tall and names itself', async ({ page }) => {
	await seedHouses(page, [fixture(), secondHouse()]);
	await page.setViewportSize({ width: 320, height: 800 });
	await goto(page, '/menu');
	await expect(houseLine(page)).toContainText('The Lantern Room ·');
	await page.getByRole('button', { name: 'Import a pack' }).click();
	const short = await page.evaluate(() => {
		const out: string[] = [];
		for (const el of Array.from(document.querySelectorAll<HTMLElement>('.housebar button, .housebar select, .housebar input:not([type=file]), .housebar .filebtn'))) {
			const h = el.getBoundingClientRect().height;
			if (h < 44) out.push(`${el.tagName.toLowerCase()}[${el.getAttribute('aria-label') ?? el.id ?? el.textContent?.trim()}]: ${Math.round(h)}px`);
		}
		return { short: out, scrollW: document.documentElement.scrollWidth };
	});
	expect(short.short).toEqual([]);
	expect(short.scrollW, 'the bar must not scroll sideways at 320').toBe(320);
});
