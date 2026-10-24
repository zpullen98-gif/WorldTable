import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { goto, seedHouses } from './helpers';

const HOUSE = JSON.parse(readFileSync('static/shared/packs/brennans-new-orleans.v1.oothouse.json', 'utf8')).house;
const SAUCES = JSON.parse(readFileSync('src/lib/data/cuisine/ch-mother-sauces.json', 'utf8'));
const ENTRY = SAUCES.entries.find((entry: { seeAlso: { folios?: string[] } }) => entry.seeAlso.folios?.includes('hollandaise-standard'));
test.use({ viewport: { width: 390, height: 844 } });

test('a Fieldbook reading opens its existing study in place and the drill keeps it behind reveal', async ({ page }) => {
	await goto(page, '/foundations?term=methods-poached');
	const folio = page.locator('.foundation-visuals #folio-poached-egg-standard');
	await expect(folio).toBeVisible();
	await expect(folio.locator('img')).toHaveCount(0);
	await folio.locator(':scope > summary').click();
	await expect(folio.locator('figure img')).toBeVisible();
	await page.getByRole('link', { name: 'Practise this term', exact: true }).click();
	await page.getByRole('button', { name: 'Start', exact: true }).click();
	await expect(page.locator('.deckframe .foundation-visuals')).toHaveCount(0);
	await page.getByRole('button', { name: 'Flip', exact: true }).click();
	await expect(page.locator('.deckframe .foundation-visuals')).toBeVisible();
	await expect(page.locator('.deckframe .foundation-visuals img')).toHaveCount(0);
	await expect(page.locator('.deckframe')).toHaveAttribute('data-flipped', 'yes');
	await expect(page.locator('.tally')).toHaveText('0 got it, 0 to see again.');
});

test('a specimen-only Fieldbook match leads directly to its reviewed ingredient guide', async ({ page }) => {
	await goto(page, '/foundations?term=cured-pancetta');
	const door = page.locator('.foundation-visuals .plate-door');
	await expect(door).toBeVisible();
	await door.click();
	await expect(page).toHaveURL(/\/plates\//);
	await page.goBack();
	await expect(page).toHaveURL(/term=cured-pancetta/);
});

for (const engine of ['cuisine', 'flashcards']) test(`${engine} cards reveal exact visual links and restore their answer after a study visit`, async ({ page }) => {
	await goto(page, engine === 'cuisine' ? `/cuisine?ch=mother-sauces&e=${ENTRY.slug}` : `/flashcards?deck=misses&run=1&z=${ENTRY.cards[0].id}`);
	if (engine === 'cuisine') {
		const folio = page.locator('#folio-hollandaise-standard');
		await expect(folio).toBeVisible();
		await expect(folio.locator('img')).toHaveCount(0);
		await page.getByRole('link', { name: 'Flash this entry', exact: true }).click();
	}
	const frame = page.locator('.deckframe');
	await expect(frame.locator('.folio-links')).toHaveCount(0);
	const position = await frame.locator('.where').textContent();
	await page.getByRole('button', { name: 'Flip', exact: true }).click();
	await frame.locator('a[href$="#folio-hollandaise-standard"]').click();
	await expect(page.locator('#folio-hollandaise-standard')).toHaveAttribute('open');
	await page.goBack();
	await expect(frame).toHaveAttribute('data-flipped', 'yes');
	await expect(frame.locator('.where')).toHaveText(position!);
	await expect(page.locator('.tally')).toHaveText('0 got it, 0 to see again.');
});

test('comparison artwork is lazy, distinct for each dish, and usable in both services', async ({ page }) => {
	await seedHouses(page, [HOUSE]);
	await goto(page, '/menu#d-1q0xk7jv');
	const pair = HOUSE.mixUps.find((item: { aId: string; bId: string }) => item.aId === 'd-1q0xk7jv' && item.bId === 'd-44jfmkdb');
	const comparison = page.locator(`[data-comparison="${pair.id}"]`);
	await expect(comparison.locator('img')).toHaveCount(0);
	await comparison.locator(':scope > summary').click();
	await expect(comparison.locator('.comparison-plate figure img')).toHaveCount(2);
	const sources = await comparison.locator('.comparison-plate figure img').evaluateAll(images => images.map(image => image.getAttribute('src')));
	expect(new Set(sources).size).toBe(2);
	await expect(comparison.locator('.image-boundary')).toContainText('AI-generated');
	for (const service of ['day', 'night']) {
		await page.evaluate(value => document.documentElement.setAttribute('data-service', value), service);
		for (const width of [390, 1024]) {
			await page.setViewportSize({ width, height: 844 });
			expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
		}
	}
	await comparison.locator('.comparison-plate').first().getByRole('button', { name: 'Enlarge illustration' }).click();
	await expect(page.getByRole('dialog')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(comparison.locator('.comparison-plate').first().getByRole('button', { name: 'Enlarge illustration' })).toBeFocused();
});
