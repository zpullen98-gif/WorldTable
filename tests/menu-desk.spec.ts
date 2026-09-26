import { test, expect, type Page } from '@playwright/test';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cannedDeskFile, goto, seedDesk } from './helpers';

/**
 * The Menu Desk, through the real page: the offline reader on a real paste,
 * the Kind column, the rooms below the table, the hand-off, the desk file in
 * and out, the inbox share on Today and on the desk, and the "never twice"
 * state. Everything asserted by OUTCOME on the screen a cook sees.
 *
 * Two things this suite proves about the doctrine rather than the screen: no
 * dish added here is ever allergen-marked, and no desk file this app writes
 * carries a price that is not in the lines it came from.
 *
 * The static server is a standalone build (base ''), which is not the
 * suite's shared origin, so the hand-off to the other rooms is the download
 * here and the inbox is exercised on its READ side, seeded the way the Codex
 * would have written it.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => readFileSync(join(HERE, '../src/lib/desk/fixtures', name), 'utf8');

const DESK_KEY = 'oot-menu-desk-v1';

/** Every key at every depth, so an allergen field cannot hide inside a row. */
function keysDeep(v: unknown, out: string[] = []): string[] {
	if (Array.isArray(v)) v.forEach((x) => keysDeep(x, out));
	else if (v && typeof v === 'object') {
		for (const [k, x] of Object.entries(v)) {
			out.push(k);
			keysDeep(x, out);
		}
	}
	return out;
}

async function paste(page: Page, text: string) {
	await page.getByLabel('Paste your menu').fill(text);
	await page.getByRole('button', { name: 'Read it here' }).click();
}

test("Commander's dinner menu reads into the desk on a phone, sorted, with the unsure row asking", async ({ page }) => {
	test.setTimeout(60_000);
	await page.setViewportSize({ width: 320, height: 800 });
	await goto(page, '/menu');
	await paste(page, fixture('commanders-dinner.txt'));

	// The counts line is the plan's sentence, and the live region carries it.
	const counts = page.locator('.counts');
	await expect(counts).toHaveText('Read 36 lines: 34 dishes for the kitchen, 2 I could not place.');
	await expect(page.locator('[role="status"].sr')).toHaveText(/Read 36 lines/);

	// Cards, not a sideways table: nothing scrolls at 320 and every cell names itself.
	const m = await page.evaluate(() => {
		const td = document.querySelector('.review td[data-label="Kind"]');
		return {
			scrollW: document.documentElement.scrollWidth,
			label: td ? getComputedStyle(td, '::before').content : null
		};
	});
	expect(m.scrollW, 'the desk must not scroll sideways at 320').toBe(320);
	expect(m.label).toBe('"Kind"');

	// The table's own scroller has nothing to scroll either: under 640px it
	// stops being a scroller at all, and a wrapper that still overflowed would
	// be a review a thumb has to drag across. And every control on the desk
	// is 44px tall, the typed fields and the selects included. The tick is
	// measured as its label: that is the tap target, and the native checkbox
	// inside it is the glyph the OS draws at its own size, not the target.
	const sizes = await page.evaluate(() => {
		const wrap = document.querySelector('.tablewrap')!;
		const short: string[] = [];
		for (const el of Array.from(document.querySelectorAll<HTMLElement>('.review input:not([type=checkbox]), .review .tickbox, .review select, .review button, .saverow .chip, .sendrow .chip'))) {
			const h = el.getBoundingClientRect().height;
			if (h < 44) short.push(`${el.tagName.toLowerCase()}[${el.getAttribute('aria-label') ?? el.textContent?.trim()}]: ${Math.round(h)}px`);
		}
		return { wrapScroll: wrap.scrollWidth, wrapClient: wrap.clientWidth, short };
	});
	expect(sizes.wrapScroll, 'the review table must fit its wrapper at 320').toBeLessThanOrEqual(sizes.wrapClient);
	expect(sizes.short, 'every typed control and chip on the desk is 44px tall').toEqual([]);

	// Kind comes before Section in the focus order: tick, then Kind. Every
	// row locator in this suite is exact: Playwright's role-name match is a
	// substring, and on a 35-row table 'Tick row 1' is also rows 10 to 19.
	await page.getByRole('checkbox', { name: 'Tick row 1', exact: true }).focus();
	await page.keyboard.press('Tab');
	await expect(page.getByRole('combobox', { name: 'Kind, row 1', exact: true })).toBeFocused();
	const kindBox = await page.getByRole('combobox', { name: 'Kind, row 1', exact: true }).boundingBox();
	expect(kindBox?.height ?? 0).toBeGreaterThanOrEqual(44);

	// Kiss the Crab is a drink under a food heading, the fourth row on the
	// desk: the desk will not guess, the row says so in words, and its Kind
	// select is the one lit. (Rows are found by their labelled inputs, not by
	// a value attribute: bind:value sets the property and never the attribute.)
	await expect(page.getByRole('textbox', { name: 'Dish name, row 4', exact: true })).toHaveValue('Kiss the Crab');
	const crab = page.locator('.review tbody tr').nth(3);
	await expect(crab.locator('.flag', { hasText: 'Not sure what this is' })).toBeVisible();
	const crabKind = page.getByRole('combobox', { name: 'Kind, row 4', exact: true });
	await expect(crabKind).toHaveClass(/ask/);
	await expect(crabKind).toHaveValue('unsure');

	// One tap settles it, and the row goes to the Ledger's list below; the
	// dish that followed it moves up into the fourth row.
	await crabKind.selectOption('cocktail');
	await expect(counts).toHaveText('Read 36 lines: 34 dishes for the kitchen, 1 cocktail for the bar, 1 I could not place.');
	await expect(page.getByRole('textbox', { name: 'Dish name, row 4', exact: true })).toHaveValue('Chargrilled Shrimp Pinchos');
	await page.getByRole('button', { name: 'Show the 1 cocktail for the Ledger' }).click();
	await expect(page.locator('.roomlist li', { hasText: 'Kiss the Crab' })).toBeVisible();

	// The one line the reader set aside can be made a row from its own text,
	// and it joins the end of the table.
	await page.getByRole('button', { name: 'Show the 1 line I could not place' }).click();
	await page.getByRole('button', { name: 'Make it a dish' }).click();
	await expect(counts).toHaveText('Read 36 lines: 35 dishes for the kitchen, 1 cocktail for the bar.');
	await expect(page.getByRole('textbox', { name: 'Dish name, row 35', exact: true })).toHaveValue(
		'Price of Entrée includes Soup or Salad and Dessert'
	);

	// Adopt. The dishes land unchecked, every one, and the done paragraph says so.
	await page.getByRole('button', { name: 'Add 35 dishes to the menu' }).click();
	const done = page.locator('.done');
	await expect(done).toContainText('35 dishes are on the menu.');
	await expect(done).toContainText('Allergens are not marked on any of them.');
	// Off the shared origin the cocktail rides on the desk file, and the download is beside the sentence.
	await expect(done).toContainText('1 cocktail is on the desk file.');
	await expect(done.getByRole('button', { name: 'Download the desk file' })).toBeVisible();
	await expect(page.locator('.da.unchecked')).toHaveCount(35);
	await expect(page.locator('.da', { hasText: 'No allergens marked' })).toHaveCount(0);
	// Thirty-five rows in the kitchen's list, and the desk folded away behind them.
	await expect(page.locator('.dishes li')).toHaveCount(35);
	await expect(page.locator('.review')).toHaveCount(0);
});

test('the whole page pasted at once is sorted into all three rooms in one read', async ({ page }) => {
	test.setTimeout(60_000);
	await goto(page, '/menu');
	// Both fixtures as one paste: the dinner menu and the drinks list the way
	// the venue's page prints them, one after the other. The reader keeps the
	// tasting menu's cocktail as the one row it will not guess at, and the
	// heading vote does not let the wine list bleed into the desserts above it.
	await paste(page, `${fixture('commanders-dinner.txt')}\n${fixture('commanders-drinks.txt')}`);
	await expect(page.locator('.counts')).toHaveText(
		'Read 46 lines: 34 dishes for the kitchen, 6 wines for the cellar, 4 cocktails for the bar, 2 I could not place.'
	);
	await expect(page.locator('.review tbody tr')).toHaveCount(35);
	await expect(page.locator('.review .flag', { hasText: 'Not sure what this is' })).toHaveCount(1);

	// Each room below the table has its share, read-only, with a Kind select on every row.
	await page.getByRole('button', { name: 'Show the 6 wines for the Codex' }).click();
	await expect(page.locator('.roomlist li')).toHaveCount(6);
	await expect(page.locator('.roomlist li', { hasText: 'Royal Tokaji' })).toContainText('2016 · Red Label | Tokaj, Hungary');
	await page.getByRole('button', { name: 'Show the 4 cocktails for the Ledger' }).click();
	await expect(page.locator('.roomlist li')).toHaveCount(4);
	await expect(page.locator('.roomlist li', { hasText: 'Holy Trinity' })).toContainText('trinity infused gin | benedictine | lime');
	await expect(page.locator('.roomlist li').first().getByRole('combobox')).toHaveValue('cocktail');

	// The primary button adds the kitchen's share; the download is beside it whatever the origin.
	await expect(page.getByRole('button', { name: 'Add 34 dishes to the menu' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Download the desk file' })).toBeVisible();
});

test('the desk keeps its gutters at 375 with rows on it', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 800 });
	await goto(page, '/menu');
	await paste(page, 'STARTERS\nCrispy squid, lemon aioli 9.50\nSoup of the day 6');
	await expect(page.locator('.review tbody tr')).toHaveCount(2);
	const m = await page.evaluate(() => {
		const wrap = document.querySelector('.tablewrap')!;
		const h1 = document.querySelector('.shell h1, h1');
		return {
			scrollW: document.documentElement.scrollWidth,
			h1Left: h1 ? Math.round(h1.getBoundingClientRect().left) : null,
			wrapScroll: wrap.scrollWidth,
			wrapClient: wrap.clientWidth
		};
	});
	expect(m.scrollW, 'the desk must not scroll sideways at 375').toBe(375);
	expect(m.h1Left, 'the h1 must sit on the 20px gutter, not the glass').toBe(20);
	expect(m.wrapScroll).toBeLessThanOrEqual(m.wrapClient);
});

test('a drinks list has nothing for the kitchen, and the desk says so and hands the rest on', async ({ page }) => {
	await goto(page, '/menu');
	await paste(page, fixture('commanders-drinks.txt'));
	await expect(page.locator('.counts')).toHaveText('Read 10 lines: 6 wines for the cellar, 4 cocktails for the bar.');
	await expect(page.locator('.review')).toHaveCount(0);

	await page.getByRole('button', { name: 'Show the 6 wines for the Codex' }).click();
	const wine = page.locator('.roomlist li', { hasText: 'Ployez-Jacquemart' });
	await expect(wine).toContainText('45.00 / 22.50');
	await expect(wine).toContainText('2010 · Extra-Brut, Champagne, France');

	// Nothing to add here, so the primary button is the hand-off.
	await expect(page.getByRole('button', { name: 'Hand 6 wines and 4 cocktails on' })).toBeVisible();

	// The desk file it writes: its own format, no allergen key anywhere, and
	// every price a substring of the lines it came from.
	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Download the desk file' }).click();
	const path = await (await downloadPromise).path();
	const file = JSON.parse(readFileSync(path!, 'utf8'));
	expect(file.format).toBe('oot-menu-desk');
	expect(file.version).toBe(1);
	expect(file.items).toHaveLength(10);
	expect(keysDeep(file).filter((k) => /allerg/i.test(k))).toEqual([]);
	const fold = (s: string) => s.replace(/\s+/g, ' ').trim();
	for (const item of file.items) {
		if (item.price.printed) expect(fold(item.raw)).toContain(fold(item.price.printed));
		for (const p of item.price.parts) expect(item.price.printed).toContain(p.amount);
	}
});

test('a share another room left opens the desk, puts one line on Today, and is never offered twice', async ({ page }) => {
	await seedDesk(page, cannedDeskFile());

	// Home: one line, with the door to the desk's own anchor.
	await goto(page, '/');
	const line = page.locator('.deskline');
	await expect(line).toContainText('2 dishes from the Menu Desk are waiting.');
	await expect(line).toContainText('Read in the Codex, today at');
	await expect(line.getByRole('link', { name: 'Look them over' })).toHaveAttribute('href', /\/menu#desk$/);

	// The desk opens itself on a menu that already has dishes, because a share is waiting.
	await goto(page, '/menu');
	await expect(page.locator('.fromdesk')).toContainText('From the Menu Desk: 2 dishes waiting.');
	await expect(page.getByRole('textbox', { name: 'Dish name, row 1', exact: true })).toHaveValue('Turtle Soup au Sherry');
	await expect(page.getByRole('textbox', { name: 'Dish name, row 2', exact: true })).toHaveValue('Soup du Jour');
	// The wine is not this room's, and the Codex has not had it yet: it waits below.
	await expect(page.getByRole('button', { name: 'Show the 1 wine for the Codex' })).toBeVisible();

	// From here on, what is on disk is what the app wrote.
	await page.evaluate(() => localStorage.setItem('__wt_seed_off', '1'));
	await page.getByRole('button', { name: 'Add 2 dishes to the menu' }).click();
	await expect(page.locator('.done')).toContainText('2 dishes are on the menu.');

	// This room's share is marked taken; the wine's room has not looked, so the
	// slot stays, and the wine is still in it for the Codex to find. (Off the
	// shared origin the wine was never written here by THIS room, only marked;
	// the seed put it there the way the Codex would have.)
	const slot = await page.evaluate((key) => {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as { taken?: Record<string, string>; items: Array<{ kind: string; name: string }> }) : null;
	}, DESK_KEY);
	expect(slot?.taken?.dish).toBeTruthy();
	expect(slot?.taken?.wine).toBeUndefined();
	expect(slot?.items.filter((i) => i.kind === 'wine').map((i) => i.name)).toEqual(['Ployez-Jacquemart']);

	// Never re-offered: Today has no line and the desk stays folded.
	await goto(page, '/');
	await expect(line).toHaveCount(0);
	await goto(page, '/menu');
	await expect(page.locator('.fromdesk')).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Bring a menu in ▸' })).toBeVisible();
});

test('pasting a menu that is already on the desk says so instead of reading it twice', async ({ page }) => {
	const text = 'Turtle Soup au Sherry\n12\nSoup du Jour\n11';
	await seedDesk(page, cannedDeskFile({}, text));
	await goto(page, '/menu');
	await paste(page, text);

	const said = page.locator('.warn', { hasText: 'This menu was read' });
	await expect(said).toContainText('This menu was read in the Codex today at');
	await expect(said).toContainText('2 dishes are already waiting here.');
	await expect(said.getByRole('button', { name: 'Look them over' })).toBeVisible();

	// Reading it anyway is a fresh read of the box, not the share.
	await said.getByRole('button', { name: 'Read it again anyway' }).click();
	await expect(said).toHaveCount(0);
	await expect(page.locator('.counts')).toHaveText('Read 2 lines: 2 dishes for the kitchen.');
	await expect(page.locator('.fromdesk')).toHaveCount(0);
});

test('a desk file comes in through either picker as a draft, and saves nothing by itself', async ({ page }) => {
	const dir = mkdtempSync(join(tmpdir(), 'menu-desk-'));
	const path = join(dir, 'menu-desk-2026-09-25.json');
	writeFileSync(path, JSON.stringify(cannedDeskFile()));

	await goto(page, '/menu');
	// The session picker sniffs the format and hands the file to the desk,
	// never to the merge: the banner says draft, the menu stays empty.
	await page.getByRole('button', { name: 'Import session…' }).click();
	await page.locator('.tools input[type=file]').setInputFiles(path);
	await expect(page.locator('.msg')).toContainText('A desk file: 3 rows are on the Menu Desk below to look over.');
	await expect(page.getByRole('textbox', { name: 'Dish name, row 1', exact: true })).toHaveValue('Turtle Soup au Sherry');
	await expect(page.getByText('Nothing entered yet', { exact: false })).toBeVisible();

	// The desk's own picker, the same way in.
	await page.getByRole('button', { name: 'Start again' }).click();
	await expect(page.locator('.review')).toHaveCount(0);
	await page.locator('.deskfile input[type=file]').setInputFiles(path);
	await expect(page.getByRole('textbox', { name: 'Dish name, row 2', exact: true })).toHaveValue('Soup du Jour');
	await expect(page.getByText('Nothing entered yet', { exact: false })).toBeVisible();

	// Something that is not a desk file is refused in words, not merged.
	writeFileSync(path, JSON.stringify({ format: 'oot-menu-desk', version: 99, items: [] }));
	await page.locator('.deskfile input[type=file]').setInputFiles(path);
	await expect(page.locator('.deskfile .warn')).toContainText('not a desk file this app can read');
});

test('the bulk send moves the ticked rows to the cellar, the bar, or out', async ({ page }) => {
	await goto(page, '/menu');
	await paste(page, 'STARTERS\nCrispy squid, lemon aioli 9.50\nSoup of the day 6\nHouse red 7');
	await expect(page.locator('.counts')).toHaveText('Read 3 lines: 3 dishes for the kitchen.');

	await page.getByRole('checkbox', { name: 'Tick row 3', exact: true }).check();
	await page.getByRole('group', { name: 'Send the ticked rows to' }).getByRole('button', { name: 'The cellar' }).click();
	await expect(page.locator('.counts')).toHaveText('Read 3 lines: 2 dishes for the kitchen, 1 wine for the cellar.');

	await page.getByRole('checkbox', { name: 'Tick row 2', exact: true }).check();
	await page.getByRole('group', { name: 'Send the ticked rows to' }).getByRole('button', { name: 'Leave out' }).click();
	await expect(page.locator('.counts')).toHaveText('Read 3 lines: 1 dish for the kitchen, 1 wine for the cellar.');
	await expect(page.locator('.review tr.dropped')).toHaveCount(1);
	// Out is a mark, not a deletion: the row is still there to bring back.
	await page.locator('.review tr.dropped').getByLabel(/^Kind, row/).selectOption('dish');
	await expect(page.locator('.counts')).toHaveText('Read 3 lines: 2 dishes for the kitchen, 1 wine for the cellar.');
	await expect(page.getByRole('button', { name: 'Add 2 dishes to the menu' })).toBeVisible();
});

test('the desk has its own anchor on My Menu, and the engine row names both engines in order', async ({ page }) => {
	// The Service hub's tile to the desk went with the hub (the four levels,
	// 2026-09-26): the desk is Mine's, and the home's Mine door and the Today
	// line's "Look them over" both land on its own anchor, #desk.
	await goto(page, '/');
	await expect(page.locator('nav.quiet .door').nth(3)).toHaveAttribute('href', /\/menu$/);

	await goto(page, '/menu');
	await expect(page.locator('#desk')).toHaveCount(1);
	const engines = page.locator('.engines .engine');
	await expect(engines.nth(0)).toContainText('Read it here');
	await expect(engines.nth(0)).toContainText('On this device. Free, instant, works offline.');
	// Without her, the slot is her one chip: the line that opens the key
	// screen, and never a disabled button.
	await expect(engines.nth(1)).toContainText("The Maître d' is not here yet: bring her in ▸");
	await expect(engines.nth(1).getByRole('button', { name: /bring her in/ })).toHaveCount(1);
	await expect(engines.nth(1).getByRole('button', { disabled: true })).toHaveCount(0);
});
