import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { goto, seedHouse } from './helpers';

/**
 * The .wtjson round trip, through the REAL page wiring.
 *
 * This suite existed nowhere until now, and the gap was not theoretical: the
 * preps shipped with a merge that was written, tested, and never called —
 * `adoptImport` took a `preps` argument and both call sites passed two — so
 * every export a venue ever wrote carried zero preps, and 460 green unit tests
 * said nothing about it, because the defect lived in the CALL SITES. The unit
 * suite covers the merge; only a test that clicks Export and feeds the file
 * back through the input covers the wiring.
 *
 * Everything asserted here travels in the `house` block beside `data`:
 * preps, the item book, the waste log. Each is checked by OUTCOME (the second
 * site can compute the number that needs the data) rather than by presence.
 */

test('a venue survives its own export: preps, prices and waste all round-trip', async ({
	page
}) => {
	await seedHouse(page);
	await goto(page, '/menu');

	// ---- export, through the real button and a real file --------------------
	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Export session' }).click();
	const download = await downloadPromise;
	const path = await download.path();
	expect(path).toBeTruthy();

	const file = JSON.parse(readFileSync(path!, 'utf8'));
	// The placement IS the contract: house collections beside data, never in it.
	expect(Object.keys(file)).toContain('house');
	expect(file.house.preps).toHaveLength(1);
	expect(Object.keys(file.house.items)).toEqual(['butter']);
	expect(file.house.waste).toHaveLength(1);
	expect('preps' in file.data).toBe(false);
	expect('waste' in file.data).toBe(false);

	// ---- wipe the venue: this browser context becomes "site B" --------------
	await page.evaluate(async () => {
		// Stop the seed re-running on the next navigation — see seedHouse.
		localStorage.setItem('__wt_seed_off', '1');
		const db = await new Promise<IDBDatabase>((res, rej) => {
			const r = indexedDB.open('world-table');
			r.onsuccess = () => res(r.result);
			r.onerror = () => rej(r.error);
		});
		await new Promise((res, rej) => {
			const tx = db.transaction('state', 'readwrite');
			tx.objectStore('state').clear();
			tx.oncomplete = res;
			tx.onerror = () => rej(tx.error);
		});
		db.close();
	});
	await goto(page, '/menu');
	await expect(page.getByText('Nothing entered yet', { exact: false })).toBeVisible();

	// ---- import, through the real input --------------------------------------
	await page.getByRole('button', { name: 'Import session…' }).click();
	// Scoped to the tools row on purpose. The Menu tab now carries a second file
	// input, the menu importer's photo picker, which is open by default on an
	// empty menu, so a bare input[type=file] is ambiguous here and matched both.
	await page.locator('.tools input[type=file]').setInputFiles(path!);

	// The banner names what landed, in the merge's own units.
	const banner = page.locator('text=/Imported[:\u2014-]/');
	await expect(banner).toBeVisible();
	await expect(banner).toContainText('1 menu dish');
	await expect(banner).toContainText('1 prep');
	await expect(banner).toContainText('1 item');
	await expect(banner).toContainText('1 waste entry');

	// ---- the outcome that needs every collection to have travelled ----------
	// 18/0.8*0.25 + 30/10 + 9.50*0.05 = 9.10 — and only if BOTH the prep and
	// the item book crossed and the book was followed: the butter line stores a
	// stale 6.40, so a plate at 8.95 means linked lines went back to reading
	// their stored price, and an incomplete plate means the book never arrived.
	await goto(page, '/menu/costing');
	await expect(page.getByText('9.10 cost', { exact: false })).toBeVisible();
	// The item book row, with history: only renderable if ITEMS crossed.
	await expect(page.getByText('from 6.40', { exact: false })).toBeVisible();
	// The waste rollup: only non-empty if the LOG crossed.
	await goto(page, '/menu/waste');
	await expect(page.getByText('Over-prepped', { exact: false }).first()).toBeVisible();
});

test('importing a file the venue already has reports nothing new, and changes nothing', async ({
	page
}) => {
	await seedHouse(page);
	await goto(page, '/menu');

	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Export session' }).click();
	const path = await (await downloadPromise).path();

	// Same venue, same file, straight back in — the no-op that proves the merge
	// is order-independent end to end, not only in the unit suite.
	await page.getByRole('button', { name: 'Import session…' }).click();
	// Scoped to the tools row on purpose. The Menu tab now carries a second file
	// input, the menu importer's photo picker, which is open by default on an
	// empty menu, so a bare input[type=file] is ambiguous here and matched both.
	await page.locator('.tools input[type=file]').setInputFiles(path!);
	await expect(page.locator('text=/nothing new/')).toBeVisible();

	await goto(page, '/menu/costing');
	await expect(page.getByText('9.10 cost', { exact: false })).toBeVisible();
});

/**
 * A partial plate cost must not wear a verdict.
 *
 * costing.ts returns a total with uncostable lines LEFT OUT and flags it
 * `complete: false`. Only the expanded body read that flag, so a COLLAPSED row
 * published "8.1%" inside a green "under" band for a dish whose real food cost
 * was at least 15% - a colour asserting a business judgement on a number the
 * code already knew was a floor, and the number a kitchen prices a menu on.
 */
test('a plate that cannot be fully costed says so before it is opened', async ({ page }) => {
	const now = Date.now();
	await seedHouse(page, {
		dishes: [
			{ id: 'dx', name: 'Ratatouille', section: 'Mains', description: '', ingredients: [], allergens: [], price: '7.00', ts: now }
		],
		preps: [],
		dishCosts: {
			dx: {
				lines: [
					{ id: 'a', item: 'Aubergine', unitCost: 2.0, unit: 'kg', usedQty: 0.285, yieldPct: 100 },
					// yieldPct 0 -> this line cannot be costed and is dropped from the total.
					{ id: 'b', item: 'Courgette', unitCost: 2.4, unit: 'kg', usedQty: 0.2, yieldPct: 0 }
				],
				sales: [],
				ts: now
			}
		}
	});
	await goto(page, '/menu/costing');

	const head = page.locator('button.dishhead', { hasText: 'Ratatouille' });
	await expect(head).toHaveAttribute('aria-expanded', 'false');

	// Collapsed, before any click: both figures admit they are floors, and the
	// percentage carries no verdict colour.
	await expect(head.locator('.pct')).toHaveAttribute('data-verdict', 'unknown');
	await expect(head.locator('.pct')).toContainText('at least');
	await expect(head.locator('.cost').first()).toContainText('at least');
	// "left" is contribution, which is meaningless on a partial cost.
	await expect(head.locator('.cost', { hasText: 'left' })).toHaveCount(0);

	// The existing explanation is still there once opened.
	await head.click();
	await expect(page.locator('.incomplete')).toContainText('cannot be costed');
});

/**
 * The producers, through the real form, the real dish link and the real file.
 *
 * A producer carries its own dish links (lib/producers.ts says why they live
 * there and not on the dish), so this is the one collection whose round trip
 * has to bring back a RELATIONSHIP as well as a record: the dish card's
 * "From ..." line only renders if the producer crossed AND its link to a dish
 * that also crossed survived the merge. Checked by that outcome, and by the
 * story, which only renders if the whole producer came back.
 */
test('a producer, its story and its link to a dish survive the export', async ({ page }) => {
	await seedHouse(page);
	await goto(page, '/menu/producers');
	// The seed has done its job: from here on, what is on disk is what the app
	// wrote, and a navigation must not put the seed back over it. See seedHouse.
	await page.evaluate(() => localStorage.setItem('__wt_seed_off', '1'));

	// ---- add a producer through the real form, tied to the seeded dish -------
	await page.getByRole('button', { name: 'Add a producer' }).click();
	// Wrapping labels: a control's own value joins its accessible name, so the
	// select (which always has one) is found by role and a leading match.
	await page.getByRole('textbox', { name: /^Name/ }).fill('Sweet Grass Dairy');
	await page.getByRole('textbox', { name: /^Where/ }).fill('Thomasville, Georgia');
	await page.getByRole('combobox', { name: /^Kind/ }).selectOption('creamery');
	await page.getByLabel('What they supply').fill('the Green Hill');
	await page.getByLabel('The story').fill('A family herd on grass, milked twice a day.');
	await page.getByRole('checkbox', { name: 'Braised cheek' }).check();
	await page.getByRole('button', { name: 'Add the producer' }).click();
	await expect(page.getByRole('heading', { name: 'Sweet Grass Dairy' })).toBeVisible();

	// In-app navigation on purpose: no unload between the write and the export.
	await page.getByRole('link', { name: '◂ My Menu' }).click();
	const credit = page.getByText('From Sweet Grass Dairy, Thomasville, Georgia');
	await expect(credit).toBeVisible();

	// ---- the other door to the same link: the dish form ----------------------
	// Opening it pre-ticks the dish's producer; unticking and saving takes the
	// credit off, ticking and saving puts it back. saveDish writes the link by
	// the dish's id, so a wrong id or a dropped call fails here.
	const dishRow = page.locator('#dish-d1');
	const pick = page
		.getByRole('group', { name: 'Producers' })
		.getByRole('checkbox', { name: 'Sweet Grass Dairy' });
	await dishRow.getByRole('button', { name: 'Edit', exact: true }).click();
	await expect(pick).toBeChecked();
	await pick.uncheck();
	await page.getByRole('button', { name: 'Save the dish' }).click();
	await expect(credit).toHaveCount(0);
	await dishRow.getByRole('button', { name: 'Edit', exact: true }).click();
	await expect(pick).not.toBeChecked();
	await pick.check();
	await page.getByRole('button', { name: 'Save the dish' }).click();
	await expect(credit).toBeVisible();

	// ---- export, through the real button and a real file --------------------
	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Export session' }).click();
	const path = await (await downloadPromise).path();
	expect(path).toBeTruthy();

	const file = JSON.parse(readFileSync(path!, 'utf8'));
	// The placement IS the contract: beside data, never in it. A producer in
	// `data` would be copied into the per-profile session record on import.
	expect(file.house.producers).toHaveLength(1);
	expect(file.house.producers[0].dishIds).toEqual(['d1']);
	expect('producers' in file.data).toBe(false);

	// ---- wipe the venue: this browser context becomes "site B" --------------
	await page.evaluate(async () => {
		const db = await new Promise<IDBDatabase>((res, rej) => {
			const r = indexedDB.open('world-table');
			r.onsuccess = () => res(r.result);
			r.onerror = () => rej(r.error);
		});
		await new Promise((res, rej) => {
			const tx = db.transaction('state', 'readwrite');
			tx.objectStore('state').clear();
			tx.oncomplete = res;
			tx.onerror = () => rej(tx.error);
		});
		db.close();
	});
	await goto(page, '/menu');
	await expect(page.getByText('Nothing entered yet', { exact: false })).toBeVisible();
	await expect(credit).toHaveCount(0);

	// ---- import, through the real input --------------------------------------
	await page.getByRole('button', { name: 'Import session…' }).click();
	await page.locator('.tools input[type=file]').setInputFiles(path!);
	const banner = page.locator('text=/Imported[:\u2014-]/');
	await expect(banner).toBeVisible();
	await expect(banner).toContainText('1 producer');

	// ---- the outcomes: the link, then the producer and its story -------------
	await expect(credit).toBeVisible();
	await goto(page, '/menu/producers');
	await expect(page.getByRole('heading', { name: 'Sweet Grass Dairy' })).toBeVisible();
	await expect(page.getByText('A family herd on grass, milked twice a day.')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Braised cheek' })).toBeVisible();
});
