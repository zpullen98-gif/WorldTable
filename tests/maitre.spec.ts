import { test, expect, type Page, type Request } from '@playwright/test';
import { readFileSync } from 'node:fs';
import {
	CANNED_MENU,
	MAITRE_SLOT,
	MODELS_JSON,
	TEST_KEY,
	cannedFlatDesk,
	floorLinesFor,
	goto,
	seedHouse,
	seedMaitre,
	seedSession,
	sseAnswer
} from './helpers';

/**
 * The Maître d', through the real page and never through Anthropic.
 *
 * Every request the client makes goes to one host, and every one of them is
 * answered here by page.route with a canned stream: CI has no key, must never
 * need one, and must never be the thing that sends a menu anywhere. What this
 * suite proves is the road, not the model: that with no key nothing leaves the
 * device at all; that with one the request carries the four headers and puts
 * the menu AFTER the cached prefix, where it can never invalidate it; that her
 * answer lands on the same review table as the offline reader's, price-checked
 * against the page; that a field about allergens is refused whole; that the
 * network gone means a sentence and no request; that Forget takes the key and
 * nothing else; that no file this app writes carries the key; and that her
 * lines are hers until a person keeps one, and only then reach a guest.
 *
 * CORS is real here. A fulfilled route still goes through the browser's
 * cross-origin check, and the custom headers mean a preflight, so the handler
 * answers OPTIONS as well as the request behind it, and the answer says which
 * headers it exposes: without that the client reads no request-id, which is
 * fine, and without the allow-origin it reads nothing, which is not.
 */

const CORS = {
	'access-control-allow-origin': '*',
	'access-control-allow-headers': '*',
	'access-control-allow-methods': 'GET, POST, OPTIONS',
	'access-control-expose-headers': 'request-id, retry-after'
};

/** One request the page made to her host, as the route saw it. */
interface Seen {
	method: string;
	url: string;
	headers: Record<string, string>;
	body: Record<string, any> | null;
}

/** The items a floor request carried, by id and name, out of the user message the client builds. */
function itemsIn(body: Record<string, any>): Array<{ id: string; name: string }> {
	const text: string = body?.messages?.[0]?.content?.[0]?.text ?? '';
	const m = /<<<ITEMS\n([\s\S]*?)\nITEMS>>>/.exec(text);
	if (!m) return [];
	return (JSON.parse(m[1]) as Array<{ id: string; name: string }>).map(({ id, name }) => ({ id, name }));
}

/**
 * Answer her host. The read is told from the floor run by the schema the
 * request asks for, so one route serves both doors; `desk` replaces the
 * canned desk when a spec wants her to answer wrongly.
 */
async function routeAnthropic(page: Page, opts: { desk?: unknown } = {}): Promise<Seen[]> {
	const seen: Seen[] = [];
	await page.route('**/api.anthropic.com/**', async (route) => {
		const req = route.request();
		if (req.method() === 'OPTIONS') {
			await route.fulfill({ status: 204, headers: CORS });
			return;
		}
		const body = req.method() === 'POST' ? (req.postDataJSON() as Record<string, any>) : null;
		seen.push({ method: req.method(), url: req.url(), headers: req.headers(), body });
		const path = new URL(req.url()).pathname;
		if (path === '/v1/models') {
			await route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(MODELS_JSON) });
			return;
		}
		const wants = body?.output_config?.format?.schema?.properties ?? {};
		const answer = 'items' in wants && !('dishes' in wants) ? floorLinesFor(itemsIn(body!)) : (opts.desk ?? cannedFlatDesk());
		await route.fulfill({
			status: 200,
			headers: { ...CORS, 'content-type': 'text/event-stream', 'request-id': 'req_canned' },
			body: sseAnswer(JSON.stringify(answer))
		});
	});
	return seen;
}

/** Everything the page asked her host for, routed or not. */
function watchHost(page: Page): Request[] {
	const out: Request[] = [];
	page.on('request', (req) => {
		if (new URL(req.url()).hostname === 'api.anthropic.com') out.push(req);
	});
	return out;
}

const engineRow = (page: Page) => page.locator('.engines .engine').nth(1);
const readDoor = (page: Page) => engineRow(page).getByRole('button', { name: "Ask the Maître d' to read it" });
const settings = (page: Page) => page.locator('dialog#oot-maitre-settings[open]');

test('with no key every door is one chip, it opens her key screen, and nothing leaves the device', async ({ page }) => {
	const toHer = watchHost(page);
	const script: string[] = [];
	page.on('request', (req) => {
		if (req.url().includes('oot-maitre.js')) script.push(req.url());
	});
	// Belt and braces: a request that did reach her host would be refused
	// here rather than sent, and counted below.
	await page.route('**/api.anthropic.com/**', (route) => route.abort());

	await goto(page, '/menu');
	// The client is not in the bundle and a device with no key never fetches
	// it: the door has nothing to estimate and says so without her.
	expect(script, 'no key means the client is never fetched on load').toEqual([]);
	const chip = engineRow(page).getByRole('button', { name: /bring her in/ });
	await expect(chip).toBeVisible();
	await expect(engineRow(page).getByRole('button', { disabled: true })).toHaveCount(0);
	// A substring on purpose, here and after Forget: with no key, not one
	// button on the page names her, the chat chip or any door's.
	await expect(page.getByRole('button', { name: "Ask the Maître d'" })).toHaveCount(0);

	// The chip opens her key screen on the family line: the one press that
	// brings the client in, and still no request to her host.
	await chip.click();
	await expect(settings(page)).toBeVisible();
	await expect(settings(page)).toContainText("The Maître d' is not here yet. Bring her in with a key of your own");
	await expect(settings(page).locator('#oot-maitre-key')).toBeFocused();
	expect(script.length, 'the press fetched the client once').toBe(1);
	expect(toHer.map((r) => r.url())).toEqual([]);

	// Escape closes it, focus is back on the chip that opened her (which is
	// why the chip is never disabled while her screen is up: a disabled
	// opener cannot take focus back), and still nothing went anywhere.
	await page.keyboard.press('Escape');
	await expect(settings(page)).toHaveCount(0);
	await expect(chip).toBeEnabled();
	await expect(chip).toBeFocused();
	expect(toHer.map((r) => r.url())).toEqual([]);
});

test('with a key her read lands on the desk: four headers, the menu after the cached prefix, every price checked', async ({ page }) => {
	test.setTimeout(60_000);
	await seedMaitre(page, { key: TEST_KEY });
	const seen = await routeAnthropic(page);
	await goto(page, '/menu');

	// The button says what it sends before it is pressed, with the estimate
	// and the month's spend beside it, and waits for something to send.
	const door = readDoor(page);
	await expect(door).toBeVisible();
	await expect(door).toBeDisabled();
	await page.getByLabel('Paste your menu').fill(CANNED_MENU);
	await expect(door).toBeEnabled();
	const note = engineRow(page).locator('.enginenote');
	await expect(note).toContainText(/About .+ at Haiku 4\.5\./);
	await expect(note).toContainText('Sends the menu text to Anthropic.');
	await expect(note).toContainText('$0.00 of $5.00 used this month.');
	// Her other two doors are on the panel only now, each naming what it sends.
	await expect(page.getByText("Send a photo to the Maître d'")).toBeVisible();
	await expect(page.getByRole('button', { name: "Ask the Maître d' to read the page" })).toBeVisible();

	await door.click();
	await expect(page.locator('.counts')).toHaveText('Read 4 lines: 3 dishes for the kitchen, 1 wine for the cellar.');
	await expect(page.locator('.import .hint', { hasText: "Read by the Maître d'. Every row still shows the line it came from." })).toBeVisible();
	await expect(page.locator('[role="status"].sr')).toHaveText(/Read 4 lines/);

	// ---- the request, as her host saw it -------------------------------------
	const read = seen.find((r) => r.url.endsWith('/v1/messages'));
	expect(read, 'one POST to /v1/messages').toBeTruthy();
	expect(seen.filter((r) => r.url.endsWith('/v1/messages'))).toHaveLength(1);
	expect(read!.headers['x-api-key']).toBe(TEST_KEY);
	expect(read!.headers['anthropic-version']).toBe('2023-06-01');
	expect(read!.headers['anthropic-dangerous-direct-browser-access']).toBe('true');
	expect(read!.headers['content-type']).toContain('application/json');
	const body = read!.body!;
	expect(body.model).toBe('claude-haiku-4-5');
	expect(body.stream).toBe(true);
	expect('temperature' in body).toBe(false);
	// The prefix: her persona first, the desk rules with the breakpoint second,
	// and the menu in neither. It rides in the user message after the
	// breakpoint, so a different menu can never invalidate the cached prefix.
	expect(body.system).toHaveLength(2);
	expect(body.system[0].cache_control).toBeUndefined();
	expect(body.system[1].cache_control).toEqual({ type: 'ephemeral' });
	expect(JSON.stringify(body.system)).not.toContain('Crispy squid');
	expect(body.messages).toHaveLength(1);
	expect(body.messages[0].role).toBe('user');
	expect(body.messages[0].content[0].text).toContain(`<<<MENU\n${CANNED_MENU}\nMENU>>>`);
	expect(body.output_config.format.type).toBe('json_schema');
	expect(JSON.stringify(body.output_config.format.schema)).not.toMatch(/allerg/i);

	// ---- her rows on the same table the offline reader uses -------------------
	await expect(page.getByRole('textbox', { name: 'Dish name, row 1', exact: true })).toHaveValue('Crispy squid, lemon aioli');
	await expect(page.getByRole('textbox', { name: 'Price, row 1', exact: true })).toHaveValue('9.50');
	const rows = page.locator('.review tbody tr');
	// The offline reader read the same text beside her and split that line on
	// its comma: the row says so, in words, and her reading stands.
	await expect(rows.nth(0).locator('.flag', { hasText: 'Differs from the offline read: Crispy squid · 9.50' })).toBeVisible();
	await expect(page.getByRole('textbox', { name: 'Price, row 2', exact: true })).toHaveValue('6');
	// "4" is not printed on the page: blanked by the client's price check
	// before the app saw it, flagged on screen, never invented.
	await expect(page.getByRole('textbox', { name: 'Price, row 3', exact: true })).toHaveValue('');
	await expect(rows.nth(2).locator('.flag', { hasText: 'No price on this line' })).toBeVisible();
	await expect(rows.nth(2)).toHaveClass(/low/);
	await page.getByRole('button', { name: 'Show the 1 wine for the Codex' }).click();
	await expect(page.locator('.roomlist li', { hasText: 'House red' })).toContainText('7');

	// Adopted like any other read: every dish lands unchecked.
	await page.getByRole('button', { name: 'Add 3 dishes to the menu' }).click();
	await expect(page.locator('.done')).toContainText('3 dishes are on the menu.');
	await expect(page.locator('.da.unchecked')).toHaveCount(3);

	// The request is in her ledger, and the month's line moved.
	await page.getByRole('button', { name: "The Maître d'", exact: true }).click();
	await expect(settings(page).locator('[data-m="meter-line"]')).toContainText('of $5.00 · 1 request');
	await expect(settings(page).locator('table')).toContainText('Read a menu');
});

test('a field about allergens is refused whole: her line, and not one row', async ({ page }) => {
	test.setTimeout(60_000);
	await seedMaitre(page, { key: TEST_KEY });
	const desk = cannedFlatDesk() as Record<string, any>;
	desk.dishes[0].allergens = [];
	const seen = await routeAnthropic(page, { desk });
	await goto(page, '/menu');

	await page.getByLabel('Paste your menu').fill(CANNED_MENU);
	await readDoor(page).click();
	await expect(engineRow(page).locator('.warn[role="alert"]')).toContainText(
		'I was handed a field about allergens and the app refused it, as it should.'
	);
	await expect(page.locator('.review')).toHaveCount(0);
	await expect(page.locator('.counts')).toHaveCount(0);
	expect(seen.filter((r) => r.url.endsWith('/v1/messages'))).toHaveLength(1);
	// The box still has the menu: the offline reader is a press away.
	await expect(page.getByLabel('Paste your menu')).toHaveValue(CANNED_MENU);
});

test('with the network gone the door is a sentence, the offline reader still reads, and nothing is sent', async ({ page, context }) => {
	test.setTimeout(60_000);
	await seedMaitre(page, { key: TEST_KEY });
	await routeAnthropic(page);
	const toHer = watchHost(page);
	await goto(page, '/menu');
	await page.getByLabel('Paste your menu').fill(CANNED_MENU);
	await expect(readDoor(page)).toBeEnabled();

	await context.setOffline(true);
	// The browser's offline event turns the door into the sentence: no button
	// to press, because the client is not precached and a press could only
	// fail slower. The offline reader's sentence, not the funnel's.
	await expect(engineRow(page)).toContainText("The Maître d' is online only. Read it here for now.");
	await expect(readDoor(page)).toHaveCount(0);
	// The tools row's door to her settings says so too, in its own sentence.
	await page.getByRole('button', { name: "The Maître d'", exact: true }).click();
	await expect(page.locator('.msg[role="alert"]')).toHaveText("The Maître d' is online only. This device is offline.");
	await expect(settings(page)).toHaveCount(0);

	// The first engine needs nobody.
	await page.getByRole('button', { name: 'Read it here' }).click();
	await expect(page.locator('.counts')).toHaveText('Read 3 lines: 2 dishes for the kitchen, 1 wine for the cellar.');
	expect(toHer.map((r) => r.url())).toEqual([]);
	await context.setOffline(false);
});

test('Forget my key takes the key and nothing else, and every door falls back to the chip', async ({ page }) => {
	test.setTimeout(60_000);
	await seedMaitre(page, { key: TEST_KEY });
	const seen = await routeAnthropic(page);
	await goto(page, '/menu');
	// Exact: with a key and an empty house the desk is open and two of her
	// doors ("... to read it", "... to read the page") carry the same words.
	await expect(page.getByRole('button', { name: "Ask the Maître d'", exact: true })).toBeVisible();

	await page.getByRole('button', { name: "The Maître d'", exact: true }).click();
	const dialog = settings(page);
	await expect(dialog).toContainText('Her key, her models, her cap and her ledger, for this device.');
	// The saved key is never written back into the field: shown, it would be a key copied.
	await expect(dialog.locator('#oot-maitre-key')).toHaveValue('');
	await expect(dialog).toContainText('A key is saved on this device, not yet tested.');

	// Test with the field empty tests the saved key: GET /v1/models, no tokens.
	await dialog.getByRole('button', { name: 'Test the key' }).click();
	await expect(dialog.locator('[data-m="key-status"]')).toHaveText('Your key opens the door.');
	const tested = seen.find((r) => r.url.includes('/v1/models'));
	expect(tested?.method).toBe('GET');
	expect(tested?.headers['x-api-key']).toBe(TEST_KEY);
	await expect(dialog.locator('[data-m="meter-line"]')).toContainText('1 request');

	// Forget asks once, in words, then takes the key only.
	await dialog.getByRole('button', { name: 'Forget my key' }).click();
	await expect(dialog).toContainText('Every line she wrote and you kept stays. Only the key goes.');
	await dialog.getByRole('button', { name: 'Forget the key' }).click();
	await expect(dialog.locator('[data-m="forget-status"]')).toHaveText('The key is gone. Every line she wrote and you kept stays.');
	await expect(dialog).toContainText('No key on this device.');
	const slot = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), MAITRE_SLOT);
	expect(slot.key).toBe('');
	expect(slot.capUsd).toBe(5);
	expect(slot.ledger.entries.map((e: { task: string }) => e.task)).toEqual(['test']);
	expect(JSON.stringify(slot)).not.toContain(TEST_KEY);

	// Closed, focus is back on the chip that opened her, and every door on the
	// page has heard: the engine row is the chip again, the chat door is gone.
	await dialog.getByRole('button', { name: 'Close' }).click();
	await expect(settings(page)).toHaveCount(0);
	await expect(page.getByRole('button', { name: "The Maître d'", exact: true })).toBeFocused();
	await expect(engineRow(page).getByRole('button', { name: /bring her in/ })).toBeVisible();
	await expect(page.getByRole('button', { name: "Ask the Maître d'" })).toHaveCount(0);
});

test('no file this app writes carries the key: not the export, not the desk file', async ({ page }) => {
	test.setTimeout(60_000);
	await seedSession(page);
	await seedMaitre(page, { key: TEST_KEY });
	await page.route('**/api.anthropic.com/**', (route) => route.abort());
	await goto(page, '/menu');

	// The .wtjson, through the real button: the slot is outside every export
	// by construction (portable.ts never sees localStorage), and this is the
	// proof that stays true when somebody adds a field.
	const exporting = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Export session' }).click();
	const exported = readFileSync((await (await exporting).path())!, 'utf8');
	expect(exported).not.toContain(TEST_KEY);
	expect(exported).not.toContain(MAITRE_SLOT);
	expect(() => JSON.parse(exported)).not.toThrow();

	// The desk file, the other file the desk writes. The seeded session has
	// dishes on the menu, so the desk sits folded behind its chip until asked.
	await page.getByRole('button', { name: 'Bring a menu in ▸' }).click();
	await page.getByLabel('Paste your menu').fill(CANNED_MENU);
	await page.getByRole('button', { name: 'Read it here' }).click();
	await expect(page.locator('.counts')).toHaveText(/Read 3 lines/);
	const desking = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Download the desk file' }).click();
	const desk = readFileSync((await (await desking).path())!, 'utf8');
	expect(desk).not.toContain(TEST_KEY);
	expect(JSON.parse(desk).format).toBe('oot-menu-desk');
});

test('her guest lines are hers until kept, and only a kept line reaches the guest menu', async ({ page }) => {
	test.setTimeout(60_000);
	const now = Date.now();
	await seedHouse(page, {
		dishes: [
			{ id: 'd1', name: 'Braised cheek', section: 'Mains', description: 'Beef cheek, red wine, roots', ingredients: [], allergens: [], price: '28', ts: now },
			{ id: 'd2', name: 'Cacio e Pepe', section: 'Mains', description: '', ingredients: [], allergens: [], price: '16', ts: now }
		]
	});
	await seedMaitre(page, { key: TEST_KEY });
	const seen = await routeAnthropic(page);
	await goto(page, '/menu');
	// From here on, what is on disk is what the app wrote: the seed must not
	// put the unmarked dishes back on the next navigation. See seedHouse.
	await page.evaluate(() => localStorage.setItem('__wt_seed_off', '1'));

	// The bulk door sits at the top of The Kitchen's Menu while any dish has no lines.
	const door = page.locator('.linesdoor');
	await expect(door.locator('.enginenote')).toContainText(/2 dishes, about .+ at Opus 5\./);
	await expect(door.locator('.enginenote')).toContainText('Nothing is kept until you keep it.');
	await door.getByRole('button', { name: "Ask the Maître d' to write the guest lines" }).click();
	await expect(door.locator('[role="status"]')).toHaveText('Her lines are on 2 dishes, hers until you keep them.');

	// ---- the request: the writer model, effort low, the items whitelisted ----
	const run = seen.find((r) => r.url.endsWith('/v1/messages'));
	expect(run?.body?.model).toBe('claude-opus-5');
	expect(run?.body?.output_config?.effort).toBe('low');
	expect(run?.body?.system?.[1]?.cache_control).toEqual({ type: 'ephemeral' });
	const carried: string = run?.body?.messages?.[0]?.content?.[0]?.text ?? '';
	expect(carried).toContain('Braised cheek');
	expect(carried).not.toMatch(/allerg/i);
	expect(JSON.stringify(run?.body?.output_config?.format?.schema)).not.toMatch(/allerg/i);

	// ---- hers, in the list and on the card, the same marks ------------------
	const list = page.locator('.herlines');
	await expect(list.getByRole('heading', { name: 'Her lines, to look over' })).toBeVisible();
	const block = list.locator('.lines', { hasText: 'Braised cheek' });
	await expect(block.locator('.eyebrow')).toHaveText('Hers, not yet kept');
	await expect(block.locator('.row.hers')).toHaveCount(5);
	await expect(block.locator('.row .who').first()).toHaveText('Hers');
	await expect(block.getByRole('button', { name: 'Keep all five' })).toBeVisible();
	const guestRow = block.locator('.row', { hasText: 'The guest line' });
	await expect(guestRow.locator('.val')).toHaveText('Braised cheek is cooked slowly and comes to the table hot. Ask me about the rest of the menu.');

	// Keep one line. The word flips, the rule goes, the count on the bulk chip
	// follows, and the card below shows the same mark: one record, two views.
	await guestRow.getByRole('button', { name: 'Keep' }).click();
	await expect(guestRow.locator('.who')).toHaveText('Kept');
	await expect(guestRow).not.toHaveClass(/hers/);
	await expect(guestRow.getByRole('button', { name: 'Keep' })).toHaveCount(0);
	await expect(block.getByRole('button', { name: 'Keep all 4' })).toBeVisible();
	const card = page.locator('#dish-d1 .lines');
	await expect(card.locator('.row', { hasText: 'The guest line' }).locator('.who')).toHaveText('Kept');
	await expect(card.locator('.row', { hasText: 'The why' }).locator('.who')).toHaveText('Hers');
	await list.getByRole('button', { name: 'Done looking' }).click();
	await expect(list).toHaveCount(0);

	// The record on disk says who kept what. Polled, because the store's
	// write is an IndexedDB transaction that lands a beat after the click.
	await expect
		.poll(() =>
			page.evaluate(async () => {
				const db = await new Promise<IDBDatabase>((res, rej) => {
					const r = indexedDB.open('world-table');
					r.onsuccess = () => res(r.result);
					r.onerror = () => rej(r.error);
				});
				const house = await new Promise<any>((res, rej) => {
					const r = db.transaction('state').objectStore('state').get('house');
					r.onsuccess = () => res(r.result);
					r.onerror = () => rej(r.error);
				});
				db.close();
				const mark = (id: string, field: string) => house?.dishes?.find((d: any) => d.id === id)?.maitre?.[field];
				return {
					d1guest: mark('d1', 'guest')?.by ?? null,
					d1why: mark('d1', 'why')?.by ?? null,
					d2guest: mark('d2', 'guest')?.by ?? null,
					d1model: mark('d1', 'guest')?.model ?? null
				};
			})
		)
		.toEqual({ d1guest: 'person', d1why: 'maitre', d2guest: 'maitre', d1model: 'claude-opus-5' });

	// ---- the guest menu: the kept line and nothing she wrote unkept ----------
	await goto(page, '/menu/guest');
	await expect(page.locator('.guestline')).toHaveCount(1);
	await expect(page.locator('.guestline')).toHaveText('Braised cheek is cooked slowly and comes to the table hot. Ask me about the rest of the menu.');
	await expect(page.getByText('Cacio e Pepe is cooked slowly')).toHaveCount(0);
	await expect(page.getByText('that is the one thing worth knowing')).toHaveCount(0);
});
