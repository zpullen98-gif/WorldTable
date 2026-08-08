import { test, expect } from '@playwright/test';
import { goto } from './helpers';
import AxeBuilder from '@axe-core/playwright';

/**
 * axe-core over every view, in both services. Zero serious/critical violations
 * is the bar; moderate/minor are reported in the failure output when the bar
 * is missed, so the fix starts from a list rather than a hunt.
 */

const VIEWS = [
	{ path: '/', name: 'recipe grid' },
	{ path: '/recipe/cacio-e-pepe', name: 'recipe page' },
	{ path: '/lexicon', name: 'lexicon' },
	{ path: '/pantry', name: 'pantry match' },
	{ path: '/study', name: 'path of study' },
	{ path: '/family', name: 'family chapter' },
	{ path: '/menu', name: 'menu worksheet' }
];

for (const view of VIEWS) {
	test(`axe: ${view.name} has no serious violations`, async ({ page }) => {
		// axe walks every node — on the 970-card grid that is legitimately slow,
		// slower still with the whole suite hammering one static server.
		test.setTimeout(120_000);
		await goto(page, view.path);
		await page.waitForLoadState('networkidle');

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.analyze();

		const serious = results.violations.filter(
			(v) => v.impact === 'serious' || v.impact === 'critical'
		);
		expect(
			serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`)
		).toEqual([]);
	});
}

test('axe: day service holds the same bar', async ({ page }) => {
	// Day is the likelier contrast failure — light paper, gold accents.
	await page.emulateMedia({ colorScheme: 'light' });
	await goto(page, '/recipe/cacio-e-pepe');
	await page.waitForLoadState('networkidle');

	const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
	const serious = results.violations.filter(
		(v) => v.impact === 'serious' || v.impact === 'critical'
	);
	expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`)).toEqual([]);
});

test('cook mode is reachable and escapable by keyboard alone', async ({ page }) => {
	await goto(page, '/recipe/cacio-e-pepe');
	await page.getByRole('button', { name: /Cook mode/ }).click();
	await expect(page.locator('.cook')).toBeVisible();

	const results = await new AxeBuilder({ page })
		.include('.cook')
		.withTags(['wcag2a', 'wcag2aa'])
		.analyze();
	const serious = results.violations.filter(
		(v) => v.impact === 'serious' || v.impact === 'critical'
	);
	expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

	await page.keyboard.press('Escape');
	await expect(page.locator('.cook')).toHaveCount(0);
});
