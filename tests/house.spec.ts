import { test, expect, type Page } from '@playwright/test';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto, HOUSE_INDEX_KEY, seedHouse, seedHouses } from './helpers';

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

/* -------------------------------------------------------------------------
 * Read and keep, no key: the House's own marks on a dish, the card, the
 * lists, the service note and the guest page. The fixture is seeded through
 * the House's own storage (seedHouses) with her marks on the chicken, by
 * 'maitre', so every Keep, Edit and Discard here is proved by OUTCOME on the
 * screen and on the record, and nothing reaches any host.
 * ---------------------------------------------------------------------- */

/** The fixture with the chicken's parts, lines and pairing hers (unkept), the history hers, and the verjus term's say hers. */
function herHouse() {
	const f = fixture();
	const hers = (m: Record<string, unknown>) => ({ ...m, by: 'maitre', model: 'test-model' });
	f.dishes = f.dishes.map((d: Record<string, any>) =>
		d.id === 'd-chicken1' ? { ...d, parts: hers(d.parts), lines: hers(d.lines), pairing: hers(d.pairing) } : d
	);
	f.history = hers(f.history);
	f.lexicon = f.lexicon.map((t: Record<string, any>) => (t.id === 'x-verjus01' ? { ...t, say: hers(t.say) } : t));
	return f;
}

const chicken = (page: Page) => page.locator('#dish-d-chicken1');
const houseRow = (page: Page, field: string) => chicken(page).locator(`.row.house[data-field="${field}"]`);
const chickenRecord = async (page: Page) => (await houseRecord(page, 'h-lantern0')).dishes.find((d: any) => d.id === 'd-chicken1');

test('the parts, the lines and the pairing are drawn Hers with the labels, the names and the words; Keep on a part flips it to Kept', async ({ page }) => {
	const toHer = watchAnthropic(page);
	await seedHouses(page, [herHouse()]);
	await goto(page, '/menu');
	await expect(dishNames(page)).toHaveText(['Lantern Roast Chicken', 'Beetroot and Apple Salad']);

	const parts = houseRow(page, 'parts');
	await expect(parts.locator('dt').first()).toContainText('The five parts');
	await expect(parts.locator('.who')).toHaveText('Hers');
	await expect(parts).toContainText('main ingredient');
	await expect(parts).toContainText('how it tastes');
	await expect(parts).toContainText('Half a corn fed chicken');

	const lines = houseRow(page, 'lines');
	await expect(lines.locator('.who')).toHaveText('Hers');
	await expect(lines).toContainText('Ten seconds');
	await expect(lines).toContainText('15 of 25 words');

	const pairing = houseRow(page, 'pairing');
	await expect(pairing.locator('.who')).toHaveText('Hers');
	// The wine id resolved to the house wine's name, the zero proof id to the drink's, the principles as words.
	await expect(pairing).toContainText('Quay Lane Harbour White 2024');
	await expect(pairing).toContainText('Verjus and Tonic');
	await expect(pairing).toContainText('acid, fat, bridge');
	await expect(pairing).not.toContainText('w-lantern1');

	// The lineup question that holds the service note up, in words beside the field.
	await expect(chicken(page).locator('.row[data-field="serviceNote"] .shift')).toHaveText('confirm on shift');

	await parts.getByRole('button', { name: 'Keep', exact: true }).click();
	await expect(parts.locator('.who')).toHaveText('Kept');
	await expect(parts.getByRole('button', { name: 'Keep', exact: true })).toHaveCount(0);
	await expect.poll(async () => (await chickenRecord(page)).parts.by).toBe('person');
	const rec = await chickenRecord(page);
	expect(rec.parts.value.main).toBe('Half a corn fed chicken');
	expect(rec.parts.model).toBe('test-model');
	expect(rec.parts.ts).toBeGreaterThan(1790672400000);
	expect(toHer).toEqual([]);
});

test('Edit then Save on a timed line shows the live count and writes the typed value as kept', async ({ page }) => {
	await seedHouses(page, [herHouse()]);
	await goto(page, '/menu');
	const lines = houseRow(page, 'lines');
	await lines.getByRole('button', { name: 'Edit', exact: true }).click();
	const ten = lines.getByLabel('Ten seconds, Lantern Roast Chicken');
	await expect(ten).toHaveValue(/^Half a chicken roasted/);
	await expect(lines.locator('[data-count="s10"]')).toHaveText('15 of 25 words');
	await ten.fill('Half a chicken off the embers.');
	await expect(lines.locator('[data-count="s10"]')).toHaveText('6 of 25 words');
	// Over the cap is a word beside the count, never a colour alone.
	await ten.fill(Array.from({ length: 26 }, (_, i) => `word${i}`).join(' '));
	await expect(lines.locator('[data-count="s10"]')).toHaveText('26 of 25 words, over its cap');
	await ten.fill('Half a chicken off the embers.');
	// Only one editor at a time: Edit on the parts closes the lines.
	await expect(lines.getByRole('button', { name: 'Save', exact: true })).toHaveCount(1);
	await lines.getByRole('button', { name: 'Save', exact: true }).click();
	await expect(lines.locator('.who')).toHaveText('Kept');
	await expect(lines).toContainText('Half a chicken off the embers.');
	await expect(lines).toContainText('6 of 25 words');
	await expect.poll(async () => (await chickenRecord(page)).lines.by).toBe('person');
	const rec = await chickenRecord(page);
	expect(rec.lines.value.s10).toBe('Half a chicken off the embers.');
	expect(rec.lines.value.s20).toMatch(/^Half a corn fed chicken, roasted/);
	expect(rec.lines.model).toBe('test-model');
});

test('Discard on the pairing removes it from the dish and the record; Keep all keeps everything unkept', async ({ page }) => {
	await seedHouses(page, [herHouse()]);
	await goto(page, '/menu');
	await expect(chicken(page).locator('.lines .eyebrow')).toHaveText('Hers, not yet kept');
	await houseRow(page, 'pairing').getByRole('button', { name: 'Discard', exact: true }).click();
	await expect(houseRow(page, 'pairing')).toHaveCount(0);
	await expect.poll(async () => (await chickenRecord(page)).pairing).toBeUndefined();

	await chicken(page).getByRole('button', { name: 'Keep all 2' }).click();
	await expect(houseRow(page, 'parts').locator('.who')).toHaveText('Kept');
	await expect(houseRow(page, 'lines').locator('.who')).toHaveText('Kept');
	await expect(chicken(page).locator('.lines .eyebrow')).toHaveText('What to say');
	await expect(chicken(page).getByRole('button', { name: /Keep all/ })).toHaveCount(0);
	await expect.poll(async () => {
		const d = await chickenRecord(page);
		return [d.parts?.by, d.lines?.by];
	}).toEqual(['person', 'person']);
});

test('the card is read and edited through setCard, and the history is kept through setMark', async ({ page }) => {
	await seedHouses(page, [herHouse()]);
	await goto(page, '/menu');
	const card = page.locator('.housecard');
	await expect(card).toContainText('14 Quay Lane, Harbourside');
	await expect(card).toContainText('01234 567890');
	await expect(card.locator('table.meals')).toContainText('Tuesday to Saturday');
	await expect(card).toContainText('Smart, jackets welcome');
	await expect(card).toContainText('2026-09-28');
	await expect(card).toContainText('The by the glass list on the bar');
	await expect(card.locator('.row .who')).toHaveText('Hers');

	await card.getByRole('button', { name: 'Edit the card' }).click();
	await card.getByLabel('Address', { exact: true }).fill('15 Quay Lane, Harbourside');
	await card.getByLabel('Dress code').fill('Come as you are');
	await card.getByRole('button', { name: 'Add a meal' }).click();
	await card.getByLabel('Meal 2, name').fill('Lunch');
	await card.getByLabel('Meal 2, days').fill('Saturday');
	await card.getByLabel('Meal 2, hours').fill('12 to 3');
	await card.getByRole('button', { name: 'Save the card' }).click();
	await expect(card).toContainText('15 Quay Lane, Harbourside');
	await expect(card).toContainText('Come as you are');
	await expect(card.locator('table.meals tbody tr')).toHaveCount(2);
	await expect(houseLine(page)).toContainText('The Lantern Room ·');
	await expect.poll(async () => (await houseRecord(page, 'h-lantern0')).address).toBe('15 Quay Lane, Harbourside');
	const rec = await houseRecord(page, 'h-lantern0');
	expect(rec.meals.map((m: any) => m.name)).toEqual(['Dinner', 'Lunch']);
	expect(rec.dressCode).toBe('Come as you are');

	await card.locator('.row').getByRole('button', { name: 'Keep', exact: true }).click();
	await expect(card.locator('.row .who')).toHaveText('Kept');
	await expect.poll(async () => (await houseRecord(page, 'h-lantern0')).history.by).toBe('person');
});

test('a term is added by hand, its say kept, and removed with a tombstone', async ({ page }) => {
	await seedHouses(page, [herHouse()]);
	await goto(page, '/menu');
	const lists = page.locator('.houselists');
	const verjus = lists.locator('.entry[data-id="x-verjus01"]');
	await expect(verjus).toContainText('Verjus');
	await expect(verjus.locator('.mrow[data-field="say"] .who')).toHaveText('Hers');
	await verjus.locator('.mrow[data-field="say"]').getByRole('button', { name: 'Keep', exact: true }).click();
	await expect(verjus.locator('.mrow[data-field="say"] .who')).toHaveText('Kept');

	await lists.getByRole('button', { name: 'Add a term' }).click();
	await lists.getByRole('textbox', { name: 'The term' }).fill('Embers');
	await lists.getByRole('textbox', { name: 'How to say it' }).fill('As it reads: embers.');
	await lists.getByRole('textbox', { name: 'To a guest' }).fill('The glowing coals the chicken roasts over.');
	await lists.getByRole('button', { name: 'Add the term' }).click();
	// Scoped to the lexicon: hasText is case-blind, and the guest conversation says "embers" too.
	const lexicon = lists.locator('[aria-labelledby="hl-lexicon"]');
	const added = lexicon.locator('.entry').filter({ hasText: 'Embers' });
	await expect(added).toHaveCount(1);
	await expect(added.locator('.mrow[data-field="say"] .who')).toHaveText('Kept');
	await expect(added).toContainText('The glowing coals the chicken roasts over.');
	await expect.poll(async () => (await houseRecord(page, 'h-lantern0')).lexicon.map((t: any) => t.term)).toEqual(['Verjus', 'Salt baked', 'Embers']);
	let rec = await houseRecord(page, 'h-lantern0');
	const embers = rec.lexicon.find((t: any) => t.term === 'Embers');
	expect(embers.id).toMatch(/^x-/);
	expect(embers.say.by).toBe('person');
	expect(rec.lexicon.find((t: any) => t.id === 'x-verjus01').say.by).toBe('person');

	await added.getByRole('button', { name: 'Remove Embers' }).click();
	await expect(lexicon.locator('.entry').filter({ hasText: 'Embers' })).toHaveCount(0);
	await expect.poll(async () => (await houseRecord(page, 'h-lantern0')).lexicon.length).toBe(2);
	rec = await houseRecord(page, 'h-lantern0');
	expect(typeof rec.removed[embers.id]).toBe('number');
	expect(JSON.stringify(rec)).not.toMatch(/allergen/i);
});

test('the service note is typed under the fixed eyebrow, saved after the dish, and read back', async ({ page }) => {
	await seedHouses(page, [herHouse()]);
	await goto(page, '/menu');
	await expect(chicken(page).locator('.row[data-field="serviceNote"]')).toContainText('Ask the chef which stock went into the gravy tonight.');
	await chicken(page).getByRole('button', { name: 'Edit', exact: true }).last().click();
	const form = page.locator('.dishform');
	await expect(form.locator('.noteeyebrow')).toHaveText('Your words. Allergens: confirm at lineup.');
	const note = form.getByLabel('Service note, your words');
	await expect(note).toHaveValue('Ask the chef which stock went into the gravy tonight. Confirm at lineup.');
	// The allergen boxes stay exactly as they were: fourteen, none ticked on a pack's dish.
	await expect(form.locator('.allergens input[type=checkbox]')).toHaveCount(14);
	await note.fill('The gravy is made at five; ask the chef if it was remade.');
	await form.getByRole('button', { name: 'Save the dish' }).click();
	await expect(chicken(page).locator('.row[data-field="serviceNote"] .servicenote')).toHaveText('The gravy is made at five; ask the chef if it was remade.');
	await expect(chicken(page).locator('.row[data-field="serviceNote"] dt')).toContainText('Your words. Allergens: confirm at lineup.');
	await expect.poll(async () => (await chickenRecord(page)).serviceNote).toBe('The gravy is made at five; ask the chef if it was remade.');
	// The Table's own row never took it: the note is the House's.
	const device = await onDevice(page);
	expect(JSON.stringify(device.dishes)).not.toContain('ask the chef if it was remade');
	// Read back into the form.
	await chicken(page).getByRole('button', { name: 'Edit', exact: true }).last().click();
	await expect(page.locator('.dishform').getByLabel('Service note, your words')).toHaveValue('The gravy is made at five; ask the chef if it was remade.');
});

test('the guest page prints a kept twenty second line under the guest line', async ({ page }) => {
	// The fixture as shipped: the chicken's lines are kept (by 'person').
	await seedHouses(page, [fixture()]);
	await goto(page, '/menu/guest');
	const chickenCard = page.locator('.gm .dish').filter({ hasText: 'Lantern Roast Chicken' });
	await expect(chickenCard).toBeVisible();
	await expect(chickenCard.locator('.guestline')).toContainText('Half a chicken roasted over the embers');
	await expect(chickenCard.locator('.s20')).toContainText('Half a corn fed chicken, roasted over the embers in the dining room');
	// The salad has no lines at all: nothing printed, nothing invented.
	await expect(page.locator('.gm .dish').filter({ hasText: 'Beetroot and Apple Salad' }).locator('.s20')).toHaveCount(0);
});

test('the guest page never prints an unkept twenty second line', async ({ page }) => {
	await seedHouses(page, [herHouse()]);
	await goto(page, '/menu/guest');
	const chickenCard = page.locator('.gm .dish').filter({ hasText: 'Lantern Roast Chicken' });
	await expect(chickenCard).toBeVisible();
	await expect(chickenCard.locator('.guestline')).toContainText('Half a chicken roasted over the embers');
	await expect(chickenCard.locator('.s20')).toHaveCount(0);
	expect(await page.content()).not.toContain('roasted over the embers in the dining room');
});

/* -------------------------------------------------------------------------
 * The verifier's cases. Each one is a hole found reading the diff, written
 * as the gate it should have had; none fixes anything.
 * ---------------------------------------------------------------------- */

/** Her marks on both records: the two Floor Deck rows (say, guest) on the row and the three House marks on the item. */
function herHouseBothRecords() {
	const f = herHouse();
	const hers = (m: Record<string, unknown>) => ({ ...m, by: 'maitre', model: 'test-model' });
	f.dishes = f.dishes.map((d: Record<string, any>) => (d.id === 'd-chicken1' ? { ...d, say: hers(d.say), guest: hers(d.guest) } : d));
	return f;
}

test('Keep all five over both records keeps all five on the House, none lost to a write in flight', async ({ page }) => {
	await seedHouses(page, [herHouseBothRecords()]);
	await goto(page, '/menu');
	await expect(chicken(page).locator('.lines .eyebrow')).toHaveText('Hers, not yet kept');
	await expect(chicken(page).locator('.lines .who').filter({ hasText: 'Hers' })).toHaveCount(5);
	/* The chip fires the store's queued put (the two Floor Deck marks ride on
	   the row) beside its own setMark on the House item, in one tick: two
	   commits over one base, and the later save lands whole. */
	await chicken(page).getByRole('button', { name: 'Keep all five' }).click();
	await expect(chicken(page).locator('.lines .eyebrow')).toHaveText('What to say');
	await expect.poll(async () => {
		const d = await chickenRecord(page);
		return [d.say?.by, d.guest?.by, d.parts?.by, d.lines?.by, d.pairing?.by];
	}, { timeout: 8000 }).toEqual(['person', 'person', 'person', 'person', 'person']);
});

test('the lists open one editor at a time: an answer being written closes when a mark is edited or a panel opens', async ({ page }) => {
	await seedHouses(page, [herHouse()]);
	await goto(page, '/menu');
	const lists = page.locator('.houselists');
	await lists.getByRole('button', { name: 'Answer it' }).click();
	await expect(lists.getByRole('button', { name: 'Save the answer' })).toHaveCount(1);
	const verjus = lists.locator('.entry[data-id="x-verjus01"]');
	await verjus.locator('.mrow[data-field="say"]').getByRole('button', { name: 'Edit', exact: true }).click();
	await expect(verjus.locator('.mrow[data-field="say"] textarea')).toHaveCount(1);
	await expect(lists.getByRole('button', { name: 'Save the answer' }), 'the mark editor opened beside the answer form').toHaveCount(0);

	await verjus.locator('.mrow[data-field="say"]').getByRole('button', { name: 'Cancel' }).click();
	await lists.getByRole('button', { name: 'Answer it' }).click();
	await lists.getByRole('button', { name: 'Add a term' }).click();
	await expect(lists.getByRole('textbox', { name: 'The term' })).toHaveCount(1);
	await expect(lists.getByRole('button', { name: 'Save the answer' }), 'the add panel opened beside the answer form').toHaveCount(0);
});

/* ---------------------------------------------------------------------------
 * The offline drills on /menu/quiz: the widened kept fixture seeded where the
 * store's api reads it, a question answered with the score and the
 * explanation on screen, a card flipped, a pairing answered, the answers in
 * their own slot and none of it in the session export.
 * ------------------------------------------------------------------------- */

const DRILL_FIXTURE = join(HERE, '../src/lib/house/fixtures/house-drill.json');
const drillFixture = () => JSON.parse(readFileSync(DRILL_FIXTURE, 'utf8')) as Record<string, any>;
const DRILLED_SLOT = 'oot-house-drilled-v1';
const drilledSlot = (page: Page) =>
	page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '[]') as Array<{ k: string; v: string; at: number }>, DRILLED_SLOT);

test('?mode=drill deals from the kept house: an answer shows the score and the explanation, and records to the slot', async ({ page }) => {
	await seedHouses(page, [drillFixture()]);
	await goto(page, '/menu/quiz?mode=drill');
	await expect(page.getByRole('button', { name: 'Drill the house' })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.locator('.count').first()).toContainText('The Lantern Room · 12 of 12 kinds deal');
	// Every kind deals over the fixture, so no still-needed line.
	await expect(page.locator('.needs')).toHaveCount(0);
	await page.getByRole('button', { name: 'Deal ▸' }).click();
	const card = page.locator('.flash.drill');
	await expect(card.locator('.eyebrow')).toContainText('question 1 of 10');
	await expect(card.locator('.score')).toHaveText('0 right of 0 answered');
	const opts = card.locator('.opt');
	await expect(opts).toHaveCount(4);
	await opts.first().click();
	await expect(card.locator('.answer')).toContainText('The answer:');
	await expect(card.locator('.answer')).toContainText(/^(Right\.|Not that one\.)/);
	await expect(card.locator('.score')).toHaveText(/^[01] right of 1 answered$/);
	// The right answer is marked whichever was picked.
	await expect(card.locator('.opt.right')).toHaveCount(1);
	const slot = await drilledSlot(page);
	expect(slot).toHaveLength(1);
	expect(slot[0].k).toMatch(/^house:h-lantern0:[^:]+:[A-Za-z]+$/);
	expect(['met', 'missed']).toContain(slot[0].v);
	await expect(page.locator('.count').first()).toContainText('1 answer kept on this device');
});

test('the kinds row narrows the round, the answer carries its explanation, and every chip is 44px tall', async ({ page }) => {
	await seedHouses(page, [drillFixture()]);
	await goto(page, '/menu/quiz?mode=drill');
	const kinds = page.locator('.kinds .chip');
	await expect(kinds).toHaveCount(12);
	for (const b of await page.locator('.chip, .opt').all()) {
		const box = await b.boundingBox();
		if (box) expect(box.height).toBeGreaterThanOrEqual(44);
	}
	// Unticking every kind but Sauce leaves a round of sauce questions alone,
	// and the explanation under the answer is the dish's kept five parts.
	for (const k of await kinds.all()) {
		const name = (await k.textContent())!.trim();
		if (name !== 'Sauce') await k.click();
	}
	await expect(page.getByRole('button', { name: 'Sauce', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByRole('button', { name: 'Grapes, off' })).toBeVisible();
	await page.getByRole('button', { name: 'Deal ▸' }).click();
	const card = page.locator('.flash.drill');
	await expect(card.locator('.eyebrow')).toContainText('question 1 of');
	const stem = (await card.locator('.eyebrow').textContent())!;
	expect(stem).toMatch(/sauce/i);
	await card.locator('.opt').first().click();
	await expect(card.locator('.answer .why')).not.toBeEmpty();
	await expect(card.locator('.score')).toHaveText(/^[01] right of 1 answered$/);
});

test('?mode=cards flips a card and Got it moves the count on', async ({ page }) => {
	await seedHouses(page, [drillFixture()]);
	await goto(page, '/menu/quiz?mode=cards');
	await expect(page.getByRole('button', { name: 'Flip cards' })).toHaveAttribute('aria-pressed', 'true');
	await page.getByRole('button', { name: 'Shuffle the cards ▸' }).click();
	const card = page.locator('.flash.card');
	await expect(card).toHaveAttribute('data-flipped', 'no');
	await expect(card.locator('.eyebrow')).toContainText(/^Card 1 of \d+ · .+ · hidden$/);
	await page.getByRole('button', { name: 'Flip ↦' }).click();
	await expect(card).toHaveAttribute('data-flipped', 'yes');
	await expect(card.locator('.def.back')).not.toBeEmpty();
	await page.getByRole('button', { name: 'Got it' }).click();
	await expect(card.locator('.eyebrow')).toContainText(/^Card 2 of \d+ · .+ · hidden$/);
	const slot = await drilledSlot(page);
	expect(slot).toHaveLength(1);
	expect(slot[0].v).toBe('met');
	expect(slot[0].k).toMatch(/^house:h-lantern0:[^:]+:card-[A-Za-z]+$/);
});

test('?mode=pair deals the pairings over house wines and drinks, and says it back in words', async ({ page }) => {
	const h = drillFixture();
	await seedHouses(page, [h]);
	await goto(page, '/menu/quiz?mode=pair');
	await page.getByRole('button', { name: 'Deal the pairings ▸' }).click();
	const card = page.locator('.flash.drill');
	const eyebrow = (await card.locator('.eyebrow').textContent())!;
	const options = (await card.locator('.opt').allTextContents()).map((s) => s.trim());
	expect(options).toHaveLength(4);
	if (/first pick/i.test(eyebrow)) {
		const wines = h.wines.map((w: any) => w.name);
		for (const o of options) expect(wines).toContain(o);
	} else {
		const drinks = h.cocktails.map((c: any) => c.name);
		for (const o of options) expect(drinks).toContain(o);
	}
	await card.locator('.opt').nth(2).click();
	await expect(card.locator('.answer')).toContainText('The answer:');
	await expect(card.locator('.score')).toHaveText(/^[01] right of 1 answered$/);
	expect(await drilledSlot(page)).toHaveLength(1);
});

test('a whole round marks the day studied, records every answer, and the session export carries none of it', async ({ page }) => {
	test.setTimeout(60_000);
	await seedHouses(page, [drillFixture()]);
	await goto(page, '/menu/quiz?mode=drill');
	await page.getByRole('button', { name: 'Deal ▸' }).click();
	const card = page.locator('.flash.drill');
	for (let i = 0; i < 10; i++) {
		await card.locator('.opt').first().click();
		if (i === 9) {
			// Standalone there is no shared layer; a stand-in for its profiles
			// counts the one markStudied a finished round makes, set only now so
			// nothing else on the page reads it.
			await page.evaluate(() => {
				const w = window as unknown as { OOT?: unknown; __studied: number };
				w.__studied = 0;
				w.OOT = { profiles: { markStudied: () => (w.__studied += 1), touch: () => {} } };
			});
		}
		await card.getByRole('button', { name: i === 9 ? 'Finish ↦' : 'Next ↦' }).click();
	}
	await expect(page.locator('.flash[role="status"] .eyebrow')).toHaveText('Round complete');
	await expect(page.locator('.flash[role="status"] .term')).toHaveText(/^\d+ right of 10$/);
	expect(await page.evaluate(() => (window as unknown as { __studied: number }).__studied)).toBe(1);
	const slot = await drilledSlot(page);
	expect(slot).toHaveLength(10);
	for (const e of slot) expect(e.k.startsWith('house:h-lantern0:')).toBe(true);

	// The .wtjson through the real button on /menu: the slot is not in it.
	await goto(page, '/menu');
	const exporting = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Export session' }).click();
	const exported = readFileSync((await (await exporting).path())!, 'utf8');
	expect(() => JSON.parse(exported)).not.toThrow();
	expect(exported).not.toContain(DRILLED_SLOT);
	expect(exported).not.toContain('house:h-lantern0:');
});

/* ---------------------------------------------------------------------------
 * Say it back and Guest at the table, offline with no key: a typed line graded
 * on the device against the kept line, nothing recorded until Record it, the
 * guest's answer graded against the kept answer, and no request to her host.
 * ------------------------------------------------------------------------- */

const keptLine = (h: Record<string, any>, name: string, len: 's10' | 's20' | 's45') =>
	h.dishes.find((d: any) => d.name === name).lines.value[len] as string;

test('?mode=say grades a typed line on the device and records only on Record it', async ({ page }) => {
	const toHer = watchAnthropic(page);
	const h = drillFixture();
	await seedHouses(page, [h]);
	await goto(page, '/menu/quiz?mode=say');
	await expect(page.getByRole('button', { name: /^Say it back/ })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.locator('.count').first()).toContainText('The Lantern Room · Say it back, on this device with no key');
	// The list holds kept lines only: her unkept Smoked Eel Toast is not on it.
	const options = (await page.locator('#say-item option').allTextContents()).map((t) => t.trim());
	expect(options).toContain('Lantern Roast Chicken');
	expect(options).not.toContain('Smoked Eel Toast');
	await page.locator('#say-item').selectOption({ label: 'Lantern Roast Chicken' });
	await page.getByRole('button', { name: /^20 seconds/ }).click();
	await expect(page.getByRole('button', { name: /^20 seconds/ })).toHaveAttribute('aria-pressed', 'true');

	const line = keptLine(h, 'Lantern Roast Chicken', 's20');
	await page.getByLabel('What you would say at the table').fill(line);
	await expect(page.locator('.wc')).toContainText(/of 50 words, within the cap/);
	await page.getByRole('button', { name: 'Check', exact: true }).click();
	const graded = page.locator('.say-grade');
	await expect(graded.locator('.verdict')).toHaveText('Met');
	await expect(graded.locator('.parts li').first()).toContainText(/^(Hit|Missed|Not in this line): /);
	await expect(graded.locator('.kept')).toHaveText(line);
	// Graded, and nothing recorded yet.
	expect(await drilledSlot(page)).toEqual([]);
	await graded.getByRole('button', { name: 'Record it' }).click();
	await expect(graded.getByRole('button', { name: 'Recorded' })).toBeDisabled();
	const slot = await drilledSlot(page);
	expect(slot).toHaveLength(1);
	expect(slot[0].k).toBe(`house:h-lantern0:${h.dishes.find((d: any) => d.name === 'Lantern Roast Chicken').id}:say-s20`);
	expect(slot[0].v).toBe('met');

	// Try again clears the box and the grade; a stray line grades missed, words and all.
	await graded.getByRole('button', { name: 'Try again' }).click();
	await expect(page.locator('.say-grade')).toHaveCount(0);
	await page.getByLabel('What you would say at the table').fill('It is lovely tonight.');
	await page.getByRole('button', { name: 'Check', exact: true }).click();
	await expect(page.locator('.say-grade .verdict')).toHaveText('Missed');
	await expect(page.locator('.say-grade .notes li').first()).not.toBeEmpty();
	expect(await drilledSlot(page)).toHaveLength(1);

	// The drinks and wines join when chosen.
	await page.getByRole('button', { name: /^Drinks, 1/ }).click();
	await expect(page.locator('#say-item option')).toContainText(['The Lantern Collins']);
	for (const b of await page.locator('.chip, textarea').all()) {
		const box = await b.boundingBox();
		if (box) expect(box.height).toBeGreaterThanOrEqual(44);
	}
	expect(toHer).toEqual([]);
});

test('Speak shows only where the browser has a speech service, with the sentence, and fills the box', async ({ page }) => {
	await seedHouses(page, [drillFixture()]);
	await page.addInitScript(() => {
		class FakeRecognition {
			lang = '';
			interimResults = false;
			continuous = false;
			onresult: ((ev: unknown) => void) | null = null;
			onend: (() => void) | null = null;
			onerror: ((ev: unknown) => void) | null = null;
			start() {
				setTimeout(() => {
					this.onresult?.({ results: [[{ transcript: 'half a chicken over the embers' }]] });
					this.onend?.();
				}, 50);
			}
			stop() {
				this.onend?.();
			}
		}
		Object.defineProperty(window, 'SpeechRecognition', { value: FakeRecognition, configurable: true });
	});
	await goto(page, '/menu/quiz?mode=say');
	await expect(page.locator('.speakrow')).toContainText("Your voice goes to your browser's speech service, not to Anthropic.");
	await page.getByRole('button', { name: 'Speak', exact: true }).click();
	await expect(page.getByLabel('What you would say at the table')).toHaveValue('half a chicken over the embers');

	const bare = await page.context().newPage();
	await bare.addInitScript(() => {
		Object.defineProperty(window, 'SpeechRecognition', { value: undefined, configurable: true });
		Object.defineProperty(window, 'webkitSpeechRecognition', { value: undefined, configurable: true });
	});
	await goto(bare, '/menu/quiz?mode=say');
	await expect(bare.locator('#say-text')).toBeVisible();
	await expect(bare.getByRole('button', { name: 'Speak', exact: true })).toHaveCount(0);
});

test('?mode=guest deals a kept guest, grades the answer, shows the kept answer and records only on Record it', async ({ page }) => {
	const toHer = watchAnthropic(page);
	const h = drillFixture();
	await seedHouses(page, [h]);
	await goto(page, '/menu/quiz?mode=guest');
	await expect(page.getByRole('button', { name: /^Guest at the table/ })).toHaveAttribute('aria-pressed', 'true');
	await page.getByRole('button', { name: 'Seat a guest ▸' }).click();
	const card = page.locator('.flash.guest');
	const eyebrow = (await card.locator('.eyebrow').textContent())!;
	const guestSays = (await card.locator('.guestsays').textContent())!.trim();
	// The answer the house kept for whichever card was dealt.
	const sc = h.scenarios.find((s: any) => s.guest === guestSays);
	const mix = h.mixUps.find((x: any) => x.ask?.value === guestSays);
	expect(/Which is which/.test(eyebrow)).toBe(!sc);
	const kept: string = sc ? sc.you.value : mix.difference.value;
	expect(kept).toBeTruthy();
	await page.getByLabel('What you would say back').fill(kept);
	await card.getByRole('button', { name: 'Check', exact: true }).click();
	const graded = page.locator('.guest-grade');
	await expect(graded.locator('.verdict')).toHaveText(/^(Met|Close)$/);
	await expect(graded.locator('.kept')).toHaveText(kept);
	expect(await drilledSlot(page)).toEqual([]);
	await graded.getByRole('button', { name: 'Record it' }).click();
	const slot = await drilledSlot(page);
	expect(slot).toHaveLength(1);
	expect(slot[0].k).toMatch(/^house:h-lantern0:[sm]-[^:]+:guest$/);
	expect(['met', 'close']).toContain(slot[0].v);
	expect(toHer).toEqual([]);
});

/* ---------------------------------------------------------------------------
 * The shipped pack loads itself: a fresh device opens /menu and Brennan's is
 * there, and a second boot of the same edition writes nothing.
 * ------------------------------------------------------------------------- */

const PACK_FILE = join(HERE, '../static/shared/packs/brennans-new-orleans.v1.oothouse.json');

async function servePack(page: Page): Promise<{ hits: number }> {
	const seen = { hits: 0 };
	const body = readFileSync(PACK_FILE, 'utf8');
	await page.route('**/shared/packs/brennans-new-orleans.v1.oothouse.json', (route) => {
		seen.hits += 1;
		return route.fulfill({ status: 200, contentType: 'application/json', body });
	});
	return seen;
}

test('a fresh device opens /menu and the Brennan’s pack loads itself; a second boot writes nothing', async ({ page }) => {
	test.setTimeout(60_000);
	const toHer = watchAnthropic(page);
	const pack = JSON.parse(readFileSync(PACK_FILE, 'utf8')).house;
	const seen = await servePack(page);
	await goto(page, '/menu');
	await expect(houseLine(page)).toContainText(`${pack.name} · ${pack.dishes.length} dishes here · ${pack.wines.length} wines in the Codex · ${pack.cocktails.length} drinks in the Ledger`);
	await expect(page.locator('.housebar .autoline')).toHaveText(
		`${pack.name} is loaded: ${pack.dishes.length} dishes, ${pack.cocktails.length} drinks, ${pack.wines.length} wines.`
	);
	await expect(dishNames(page)).toHaveCount(pack.dishes.length);
	await expect(dishNames(page).first()).toHaveText(pack.dishes[0].name);
	expect(seen.hits).toBe(1);
	await expect.poll(async () => (await onDevice(page)).dishes.length).toBe(pack.dishes.length);
	const first = await onDevice(page);
	expect(first.index.current).toBe(pack.id);
	const before = await houseRecord(page, pack.id);
	expect(before.pack.builtAt).toBe(pack.pack.builtAt);

	// The second boot: the same edition, fetched again, and nothing written.
	await page.reload();
	await page.waitForSelector('html[data-hydrated]');
	await expect.poll(() => seen.hits).toBe(2);
	await expect(houseLine(page)).toContainText(`${pack.name} · ${pack.dishes.length} dishes here`);
	await page.waitForTimeout(800);
	await expect(page.locator('.housebar .autoline')).toHaveCount(0);
	const after = await houseRecord(page, pack.id);
	expect(after.lastWrite).toBe(before.lastWrite);
	expect(JSON.stringify(after)).toBe(JSON.stringify(before));
	const second = await onDevice(page);
	expect(second.index).toEqual(first.index);
	expect(second.dishes.length).toBe(pack.dishes.length);

	// And Say it back reads the pack's kept lines straight away.
	await goto(page, '/menu/quiz?mode=say');
	await expect(page.locator('#say-item option')).toHaveCount(pack.dishes.filter((d: any) => d.lines?.by === 'person').length);
	expect(toHer).toEqual([]);
});

test('her own dishes and no house: the pack is held, nothing is written, and Load the pack is her act', async ({ page }) => {
	test.setTimeout(60_000);
	const pack = JSON.parse(readFileSync(PACK_FILE, 'utf8')).house;
	await seedHouse(page); // the Table's own record: Braised cheek, d1, no house
	const seen = await servePack(page);
	await goto(page, '/menu');
	await expect(page.locator('.housebar .autoline')).toHaveText(
		`${pack.name} is ready to load: ${pack.dishes.length} dishes, ${pack.cocktails.length} drinks, ${pack.wines.length} wines. Your own dishes stay as they are until you press Load the pack; loading files them under it.`
	);
	expect(seen.hits).toBe(1);
	await expect(houseLine(page)).toHaveText(NO_HOUSE_LINE);
	await expect(dishNames(page)).toHaveText(['Braised cheek']);
	await page.waitForTimeout(800);
	const held = await onDevice(page);
	expect(held.index, 'no house is written by the boot').toBeNull();
	expect(held.dishes.map((d: any) => [d.name, 'house' in d])).toEqual([['Braised cheek', false]]);
	const load = page.getByRole('button', { name: 'Load the pack' });
	expect((await load.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	await load.click();
	await expect(houseLine(page)).toContainText(`${pack.name} · `);
	await expect(page.locator('.housebar .autoline')).toHaveText(
		`${pack.name} is loaded: ${pack.dishes.length} dishes, ${pack.cocktails.length} drinks, ${pack.wines.length} wines.`
	);
	await expect(load).toHaveCount(0);
	await expect.poll(async () => (await onDevice(page)).index?.current ?? null).toBe(pack.id);
});

test('with the pack withheld the boot goes on quietly with no house and no error', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(String(e)));
	await page.route('**/shared/packs/**', (route) => route.fulfill({ status: 404, body: 'not found' }));
	await goto(page, '/menu');
	await expect(houseLine(page)).toHaveText(NO_HOUSE_LINE);
	await expect(page.locator('.housebar .autoline')).toHaveCount(0);
	expect(errors).toEqual([]);
});

test('the drill deals with the worker on and the network off: nothing it needs is fetched', async ({ page, context }) => {
	test.setTimeout(90_000);
	await seedHouses(page, [drillFixture()]);
	await goto(page, '/');
	await page.evaluate(async () => {
		await navigator.serviceWorker.ready;
		if (!navigator.serviceWorker.controller) {
			await new Promise<void>((resolve) => {
				navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
				if (navigator.serviceWorker.controller) resolve();
			});
		}
	});
	await expect
		.poll(
			async () =>
				page.evaluate(async () => {
					let n = 0;
					for (const name of await caches.keys()) n += (await (await caches.open(name)).keys()).length;
					return n;
				}),
			{ timeout: 40_000 }
		)
		.toBeGreaterThan(40);

	await context.setOffline(true);
	// A deep link never visited online: the shell answers, the House is on the device.
	await goto(page, '/menu/quiz?mode=drill');
	await page.getByRole('button', { name: 'Deal ▸' }).click();
	const card = page.locator('.flash.drill');
	await card.locator('.opt').first().click();
	await expect(card.locator('.answer')).toContainText('The answer:');
	await page.getByRole('button', { name: 'Flip cards' }).click();
	await page.getByRole('button', { name: 'Shuffle the cards ▸' }).click();
	await page.getByRole('button', { name: 'Flip ↦' }).click();
	await expect(page.locator('.flash.card')).toHaveAttribute('data-flipped', 'yes');

	// Say it back, offline: typed, checked and graded on the device.
	await page.getByRole('button', { name: /^Say it back/ }).click();
	await page.locator('#say-item').selectOption({ label: 'Lantern Roast Chicken' });
	await page.getByRole('button', { name: /^10 seconds/ }).click();
	await page.getByLabel('What you would say at the table').fill(keptLine(drillFixture(), 'Lantern Roast Chicken', 's10'));
	await page.getByRole('button', { name: 'Check', exact: true }).click();
	await expect(page.locator('.say-grade .verdict')).toHaveText('Met');
	// And Guest at the table deals and grades with the network off too.
	await page.getByRole('button', { name: /^Guest at the table/ }).click();
	await page.getByRole('button', { name: 'Seat a guest ▸' }).click();
	await page.getByLabel('What you would say back').fill('Let me check with the kitchen.');
	await page.locator('.flash.guest').getByRole('button', { name: 'Check', exact: true }).click();
	await expect(page.locator('.guest-grade .verdict')).toHaveText(/^(Met|Close|Missed)$/);
	await context.setOffline(false);
});

/* ---------------------------------------------------------------------------
 * Adversarial cases on the drills: each names the hole it proves.
 * ------------------------------------------------------------------------- */

test('adversarial: every state on the drill page is a word, the round length and the mode as well as the kinds', async ({ page }) => {
	await seedHouses(page, [drillFixture()]);
	await goto(page, '/menu/quiz?mode=drill');
	// The kinds row says ', off' beside a kind not chosen; the round length
	// and the mode chips say nothing, so which is chosen is a border alone.
	const ten = page.getByRole('button', { name: /A round of 10/ });
	const whole = page.getByRole('button', { name: /The whole pool/ });
	const tenText = (await ten.textContent())!.trim();
	const wholeText = (await whole.textContent())!.trim();
	expect(wholeText, 'the unchosen length carries no word for its state').toMatch(/off|not chosen/);
	await whole.click();
	expect((await ten.textContent())!.trim(), 'the chosen length reads the same as the unchosen').not.toBe(tenText);
	const dishes = page.getByRole('button', { name: /^The dishes/ });
	expect((await dishes.textContent())!.trim(), 'an unchosen mode carries no word for its state').toMatch(/off|not chosen/);
});

test('adversarial: an empty house and a device with no IndexedDB both open the drill without an error', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(String(e)));
	await seedHouses(page, [JSON.parse(readFileSync(FIXTURE, 'utf8'))]);
	await goto(page, '/menu/quiz?mode=drill');
	await expect(page.locator('.needs li').first()).toBeVisible();
	await expect(page.getByRole('button', { name: 'Nothing deals yet' })).toBeDisabled();
	await page.getByRole('button', { name: 'Pairings' }).click();
	await expect(page.getByRole('button', { name: 'Nothing deals yet' })).toBeDisabled();

	const bare = await page.context().newPage();
	bare.on('pageerror', (e) => errors.push(String(e)));
	await bare.addInitScript(() => {
		Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true });
	});
	await goto(bare, '/menu/quiz?mode=cards');
	await expect(bare.locator('.empty').first()).toContainText('No house on this device yet');
	expect(errors).toEqual([]);
});
