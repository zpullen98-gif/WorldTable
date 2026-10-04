import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto } from './helpers';

/**
 * By the bottle (the wine deep dive, 4 October 2026): a dish whose kept
 * pairing carries bottle tiers shows them on its study card under "Pour with
 * it", one row per tier (value, the sweet spot, the celebration, a half
 * bottle) with the bin, the name, the vintage, the printed price, the why and
 * the line to say. The house is the shipped Brennan's pack with four bottles
 * and the Hussarde's tiers added in this file (every other dish's tiers taken
 * off), served through page.route the way study.spec.ts serves the pack, so the
 * block is proved whatever the edition's bottles are. A dish without tiers
 * shows no block. The last test reads the shipped pack as it is: the
 * Hussarde's own four tiers, the house Champagne among them printed with no
 * bin because the list prints none. The standalone build draws no link to another room (wing-links.ts);
 * the /codex/#wine= address a based build draws is proved in
 * src/lib/wing-links.test.ts.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const PACK = JSON.parse(readFileSync(join(HERE, '../static/shared/packs/brennans-new-orleans.v1.oothouse.json'), 'utf8'));
const SHOTS = process.env.STUDY_SHOTS ?? '/tmp/claude-0/-home-user-zpullen98-gif-github-io/09201eae-82ec-5cba-9316-4d6cf5955e5e/scratchpad/shots/';
const HUSSARDE = 'd-1q0xk7jv';

/** The pack with four bottles on the list and the Hussarde tiered over them. */
function bottledPack(): string {
	const p = JSON.parse(JSON.stringify(PACK));
	const h = p.house;
	const base = h.wines[0];
	const bottle = (id: string, producer: string, wine: string, vintage: string, price: string, bin: string, size: string) => ({
		...JSON.parse(JSON.stringify(base)),
		id, producer, wine, vintage, name: `${producer} ${wine} ${vintage}`, section: 'The bottle list', glass: '', bottle: price, price,
		prices: [{ meal: 'Bottle', printed: price }], list: 'bottle', bin, size
	});
	h.wines.push(
		bottle('w-tbvalue1', 'Domaine Testa', 'Bourgogne Blanc', '2022', '$85', '20101', '750ml'),
		bottle('w-tbclass1', 'Domaine Testa', 'Meursault', '2021', '$180', '20102', '750ml'),
		bottle('w-tbsplur1', 'Maison Testa', 'Brut Prestige', '2012', '$1,250', '20103', '1.5L'),
		bottle('w-tbhalf01', 'Domaine Testa', 'Chablis', '2023', '$55', '20104', '375ml')
	);
	for (const x of h.dishes as Array<{ pairing?: { value: { bottles?: unknown } } }>) if (x.pairing) delete x.pairing.value.bottles;
	const d = h.dishes.find((x: { id: string }) => x.id === HUSSARDE);
	const tier = (wineId: string, why: string, sayIt: string) => ({ wineId, why, sayIt });
	d.pairing.value.bottles = {
		value: tier('w-tbvalue1', 'Bright white Burgundy cuts the hollandaise.', 'For an easy bottle, a crisp white Burgundy.'),
		classic: tier('w-tbclass1', 'Meursault has the richness to meet the marchand de vin.', 'Our sweet spot: a Meursault, rich and nutty.'),
		splurge: tier('w-tbsplur1', 'A prestige Champagne magnum for a celebrating table.', 'For a celebration, a magnum of prestige Champagne.'),
		half: tier('w-tbhalf01', 'A half bottle of Chablis for two.', 'A half bottle of Chablis is just right for two.')
	};
	return JSON.stringify(p);
}

test.use({ viewport: { width: 390, height: 844 } });

async function serve(page: Page) {
	const body = bottledPack();
	await page.route('**/shared/packs/brennans-new-orleans.v1.oothouse.json', (route) => route.fulfill({ status: 200, contentType: 'application/json', body }));
}

test('the Hussarde card shows By the bottle: three tiers and a half, each with bin, name, vintage, price, why and line', async ({ page }) => {
	await serve(page);
	await goto(page, '/menu#' + HUSSARDE);
	const c = page.locator('article.card');
	await expect(c.locator('h2')).toHaveText('Eggs Hussarde', { timeout: 15_000 });
	await expect(c.locator('#pour-h')).toHaveText('Pour with it');
	await expect(c.locator('.bottlehead')).toHaveText('By the bottle');
	const rows = c.locator('dl.bottles > div');
	await expect(rows).toHaveCount(4);
	await expect(rows.locator('dt')).toHaveText(['Value, under $100', 'Sweet spot, $100 to $250', 'Celebration, over $250', 'Half-bottle']);
	await expect(rows.nth(0).locator('dd')).toContainText('Bin 20101');
	await expect(rows.nth(0).locator('dd')).toContainText('Domaine Testa Bourgogne Blanc 2022, $85');
	await expect(rows.nth(1).locator('dd')).toContainText('Domaine Testa Meursault 2021, $180');
	await expect(rows.nth(2).locator('dd')).toContainText('Maison Testa Brut Prestige 2012, $1,250, 1.5L');
	await expect(rows.nth(3).locator('dd')).toContainText('Bin 20104');
	await expect(rows.nth(3).locator('dd')).toContainText('Domaine Testa Chablis 2023, $55, 375ml');
	await expect(rows.nth(1).locator('.sub').first()).toHaveText('Why: Meursault has the richness to meet the marchand de vin.');
	await expect(rows.nth(1).locator('.sub').nth(1)).toHaveText('Say: “Our sweet spot: a Meursault, rich and nutty.”');
	// The glass pick still leads the block, and no room is linked from the standalone build.
	await expect(c.locator('.pairs').first()).toContainText('Brennan’s Essential by Piper-Heidsieck');
	expect(await c.locator('a[href*="/codex/"]').count()).toBe(0);
	// Nothing sideways at a phone's width.
	const w = await page.evaluate(() => document.scrollingElement!.scrollWidth);
	expect(w).toBeLessThanOrEqual(390);
	await c.locator('.bottlehead').scrollIntoViewIfNeeded();
	await page.screenshot({ path: SHOTS + 'wl-table-bottles.png' });
});

test('a dish with no tiers shows no By the bottle block', async ({ page }) => {
	await serve(page);
	await goto(page, '/menu#' + HUSSARDE);
	const c = page.locator('article.card');
	await expect(c.locator('h2')).toHaveText('Eggs Hussarde', { timeout: 15_000 });
	await c.getByRole('button', { name: /^Next/ }).first().click();
	await expect(c.locator('h2')).not.toHaveText('Eggs Hussarde');
	await expect(c.locator('.bottlehead')).toHaveCount(0);
	await expect(c.locator('dl.bottles')).toHaveCount(0);
});

test('the shipped Hussarde tiers: four rows from the pack, each named, priced and linked to nothing in the standalone build', async ({ page }) => {
	const h = PACK.house;
	const d = h.dishes.find((x: { id: string }) => x.id === HUSSARDE);
	const tiers = d.pairing.value.bottles;
	const order = ['value', 'classic', 'splurge', 'half'].filter((k) => tiers[k]);
	expect(order.length).toBe(4);
	const body = JSON.stringify(PACK);
	await page.route('**/shared/packs/brennans-new-orleans.v1.oothouse.json', (route) => route.fulfill({ status: 200, contentType: 'application/json', body }));
	await goto(page, '/menu#' + HUSSARDE);
	const c = page.locator('article.card');
	await expect(c.locator('h2')).toHaveText('Eggs Hussarde', { timeout: 15_000 });
	const rows = c.locator('dl.bottles > div');
	await expect(rows).toHaveCount(4);
	for (let i = 0; i < order.length; i++) {
		const t = tiers[order[i]];
		const w = h.wines.find((x: { id: string }) => x.id === t.wineId);
		const dd = rows.nth(i).locator('dd');
		if (w.bin) await expect(dd).toContainText('Bin ' + w.bin);
		else await expect(dd.locator('.bin')).toHaveCount(0);
		await expect(dd).toContainText(w.bottle);
		await expect(dd).toContainText(w.vintage);
		await expect(dd).toContainText('Why: ' + t.why);
	}
	expect(await c.locator('a[href*="/codex/"]').count()).toBe(0);
	const w = await page.evaluate(() => document.scrollingElement!.scrollWidth);
	expect(w).toBeLessThanOrEqual(390);
});
