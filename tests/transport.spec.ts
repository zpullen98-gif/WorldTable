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
	await page.locator('input[type=file]').setInputFiles(path!);

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
	await page.locator('input[type=file]').setInputFiles(path!);
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
