import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { goto } from './helpers';

const PACK_TEXT = readFileSync('static/shared/packs/brennans-new-orleans.v1.oothouse.json', 'utf8');
const house = JSON.parse(PACK_TEXT).house;
const hussarde = house.dishes.find((dish: { name: string }) => dish.name === 'Eggs Hussarde');
const owen = house.dishes.find((dish: { name: string }) => dish.name === 'Eggs Owen');
const pair = house.mixUps.find((mix: { aId: string; bId: string }) => mix.aId === hussarde.id && mix.bId === owen.id);

test.use({ viewport: { width: 390, height: 844 } });
test.beforeEach(async ({ page }) => {
	await page.route('**/shared/packs/brennans-new-orleans.v1.oothouse.json', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: PACK_TEXT }));
});

test('course journeys keep exact order, choice and drink terms in both services without overflow', async ({ page }) => {
	await goto(page, '/menu');
	await expect(page.locator('.tmenu')).toHaveCount(house.tastings.length);
	for (const tasting of house.tastings) {
		const menu = page.locator(`[data-tasting="${tasting.id}"].tmenu`);
		await expect(menu.locator('.clabel')).toHaveText(tasting.courses.map((c: { label: string }) => c.label));
		await expect(menu.locator('.waypoint')).toHaveText(tasting.courses.map((_: unknown, i: number) => String(i + 1).padStart(2, '0')));
		await expect(menu.locator('.choice')).toHaveCount(tasting.courses.filter((c: { choice?: boolean }) => c.choice).length);
		if (tasting.includesDrinks) await expect(menu.locator('.tterms')).toContainText('Every drink listed is included');
		if (tasting.supplement) await expect(menu.locator('.supp')).toHaveText(tasting.supplement);
		await expect(menu.locator('.tfoot a')).toHaveAttribute('href', `/flashcards?deck=${encodeURIComponent('tasting:' + tasting.id)}&run=1`);
	}
	for (const service of ['day', 'night']) {
		await page.evaluate((value) => document.documentElement.setAttribute('data-service', value), service);
		for (const width of [320, 390, 1024]) {
			await page.setViewportSize({ width, height: 844 });
			expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
		}
		const results = await new AxeBuilder({ page }).include('.tastings').analyze();
		expect(results.violations).toEqual([]);
	}
});

test('a dish comparison teaches the exact current pair and opens the other card', async ({ page }) => {
	await goto(page, `/menu#${hussarde.id}`);
	await expect(page.locator('#card-h')).toHaveText(hussarde.name);
	const comparison = page.locator(`[data-comparison="${pair.id}"]`);
	await comparison.locator(':scope > summary').click();
	await expect(comparison.locator('.dish-panel h4')).toHaveText([hussarde.name, owen.name]);
	await expect(comparison.locator(`[data-side="${owen.id}"] .ingredients li`)).toHaveText(owen.ingredients);
	await expect(comparison.locator('.contrast p')).toHaveText(pair.difference.value);
	await expect(comparison.locator('.guest p')).toHaveText(pair.ask.value);
	await expect(comparison.locator('a[href="/plates#folio-eggs-hussarde-components"]')).toBeVisible();
	for (const service of ['day', 'night']) {
		await page.evaluate((value) => document.documentElement.setAttribute('data-service', value), service);
		for (const width of [320, 390, 1024]) {
			await page.setViewportSize({ width, height: 844 });
			expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
		}
		const results = await new AxeBuilder({ page }).include('.dish-comparisons').analyze();
		expect(results.violations).toEqual([]);
	}
	await comparison.getByRole('button', { name: `Study ${owen.name}`, exact: true }).click();
	await expect(page.locator('#card-h')).toHaveText(owen.name);
	await expect(page.locator(`[data-comparison="${pair.id}"]`)).not.toHaveAttribute('open');
});
