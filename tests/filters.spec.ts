import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto } from './helpers';

/**
 * The filter toolbar, which nothing pinned.
 *
 * Six filters and no way to clear them; an empty state that never said which
 * filter had emptied the pass; a "Chef's pick" that silently did nothing on
 * exactly the zero-result view a cook reaches for it on; rail rows promising a
 * filtered count ("Italian 10") and delivering the unfiltered chapter, because
 * the rail's links carried no query; and replaceState on every change, so Back
 * never undid a filter. One page load per test, resized in place where it
 * matters - parallel loads of /recipes starve hydration (see nav.spec.ts).
 */
const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX = JSON.parse(
	readFileSync(join(__dirname, '..', 'src', 'lib', 'data', 'recipes.index.json'), 'utf8')
) as Array<{ slug: string; diet: { vegetarian: boolean } }>;

const count = (page: import('@playwright/test').Page) =>
	page.locator('.count [aria-live]').innerText().then((t) => parseInt(t, 10));

test('a clear control appears with the first filter and costs no row on a phone', async ({
	page
}) => {
	await goto(page, '/chapter/seafood-atlas');
	await expect(page.locator('.clear')).toHaveCount(0);

	await page.getByRole('button', { name: 'Vegetarian', exact: true }).click();
	await expect(page.locator('.count [aria-live]')).toHaveText(/^0 dishes/);
	await expect(page.locator('.clear')).toBeVisible();

	// 320px: the control shares the count's line and the page stays inside the glass.
	await page.setViewportSize({ width: 320, height: 800 });
	const geo = await page.evaluate(() => {
		const live = document.querySelector('.count [aria-live]')!.getBoundingClientRect();
		const clear = document.querySelector('.clear')!.getBoundingClientRect();
		// Centres, not tops: the control's 44px hit box (padding plus negative
		// margin) starts 12px above the text line it shares with the count.
		const mid = (r: DOMRect) => r.top + r.height / 2;
		return { sameLine: Math.abs(mid(live) - mid(clear)) < 3, scrollW: document.documentElement.scrollWidth };
	});
	expect(geo.scrollW).toBe(320);
	expect(geo.sameLine).toBe(true);

	// Keyboard activation lands where '/' lands: the search box.
	await page.locator('.clear').focus();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/chapter\/seafood-atlas$/);
	await expect(page.getByRole('button', { name: 'Vegetarian', exact: true })).toHaveAttribute(
		'aria-pressed',
		'false'
	);
	expect(await page.locator('.card').count()).toBeGreaterThan(0);
	await expect(page.locator('input[aria-label="Search recipes"]')).toBeFocused();

	// A tap lands on the grid heading, so a phone does not open a keyboard.
	await page.getByRole('button', { name: 'Vegetarian', exact: true }).click();
	await page.locator('.clear').click();
	await expect(page.locator('.meta-row h2')).toBeFocused();
});

test('the empty state names the culprit and offers the way out', async ({ page }) => {
	await goto(page, '/chapter/seafood-atlas?veg=1');
	await expect(page.locator('.empty p').first()).toHaveText(
		/^Nothing on the pass\. Nothing vegetarian in Seafood Atlas\. Drop Vegetarian for \d+ dishes; \d+ across the library\.$/
	);
	await page.getByRole('button', { name: 'Drop Vegetarian' }).click();
	expect(await page.locator('.card').count()).toBeGreaterThan(0);
	await expect(page).toHaveURL(/\/chapter\/seafood-atlas$/);
	await expect(page.getByRole('button', { name: 'Vegetarian', exact: true })).toBeFocused();

	// Two filters, neither alone the culprit: no Drop, but Clear and the library.
	await goto(page, '/chapter/seafood-atlas?course=Dessert&veg=1');
	await expect(page.getByRole('button', { name: /^Drop / })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible();
	const link = page.locator('.empty a', { hasText: /across the library/ });
	await expect(link).toHaveAttribute('href', /\/recipes\?course=Dessert&veg=1$/);
	const promised = parseInt((await link.innerText()).match(/\d+/)![0], 10);
	await link.click();
	await expect(page).toHaveURL(/\/recipes\?course=Dessert&veg=1$/);
	expect(await count(page)).toBe(promised);
});

test("Chef's pick draws from the library when the chapter is empty, and disables when nothing is", async ({
	page
}) => {
	await goto(page, '/chapter/seafood-atlas?veg=1');
	const lucky = page.locator('button.lucky');
	await expect(lucky).toBeEnabled();
	await lucky.click();
	await expect(page).toHaveURL(/\/recipe\/[a-z0-9-]+$/);
	const slug = page.url().split('/recipe/')[1];
	// Every other filter is kept: a vegetarian asked, a vegetarian dish came.
	expect(INDEX.find((r) => r.slug === slug)?.diet.vegetarian, slug).toBe(true);
	await page.goBack();
	await expect(page).toHaveURL(/\/chapter\/seafood-atlas\?veg=1$/);
	await expect(page.getByRole('button', { name: 'Vegetarian', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);

	await goto(page, '/recipes?course=Salad&diff=3');
	await expect(page.locator('.count [aria-live]')).toHaveText(/^0 dishes/);
	await expect(page.locator('button.lucky')).toBeDisabled();
});

test('filters follow the cook across the rail, so a row delivers the count it promised', async ({
	page
}) => {
	await goto(page, '/recipes?veg=1');
	const europe = page.locator('.rghead', { hasText: 'Europe' });
	const italian = page.locator('.rail li a').filter({ has: page.locator('.nm', { hasText: /^Italian$/ }) });
	if (!(await italian.isVisible())) await europe.click();
	const promised = parseInt(await italian.locator('.ct').innerText(), 10);
	expect(promised).toBeGreaterThan(0);

	await italian.click();
	await expect(page).toHaveURL(/\/chapter\/italian\?veg=1$/);
	await expect(page.locator('.card')).toHaveCount(promised);
	await expect(page.getByRole('button', { name: 'Vegetarian', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);

	await page.locator('.rail a.all').click();
	await expect(page).toHaveURL(/\/recipes\?veg=1$/);
});

test('Back undoes a chip, and typing never fills history', async ({ page }) => {
	test.setTimeout(120_000);
	await goto(page, '/recipes');
	const whole = await count(page);

	// In-page clicks, so the harness does not scroll the sticky toolbar around.
	await page.getByRole('button', { name: 'Under 40 min' }).evaluate((b) => (b as HTMLButtonElement).click());
	await expect(page).toHaveURL(/\?quick=1$/);
	const quick = await count(page);
	await page.getByRole('button', { name: 'Vegetarian', exact: true }).evaluate((b) => (b as HTMLButtonElement).click());
	await expect(page).toHaveURL(/\?quick=1&veg=1$/);
	expect(await count(page)).toBeLessThan(quick);

	await page.goBack();
	await expect(page).toHaveURL(/\?quick=1$/);
	await expect(page.getByRole('button', { name: 'Vegetarian', exact: true })).toHaveAttribute('aria-pressed', 'false');
	expect(await count(page)).toBe(quick);

	await page.goBack();
	await expect(page).toHaveURL(/\/recipes$/);
	expect(await count(page)).toBe(whole);

	// Keystrokes replace, they do not push.
	const before = await page.evaluate(() => history.length);
	await page.locator('input[aria-label="Search recipes"]').pressSequentially('rag');
	await expect(page).toHaveURL(/\?q=rag$/);
	expect(await page.evaluate(() => history.length)).toBe(before);
});
