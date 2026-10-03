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
