import { test, expect } from '@playwright/test';
import { goto } from './helpers';

/**
 * Cook mode on a phone, which is the only place it matters.
 *
 * The whole suite ran at 1280x720 and could not see any of this: the overlay
 * was a z-index:80 div losing to a z-index:40 nav (because `main` opens a
 * stacking context), so on a phone the ✕ sat under a mode tab and TAPPING IT
 * NAVIGATED YOU OUT OF THE RECIPE mid-braise. In landscape the centred flex
 * box pushed Back/Next off a 320px viewport with no way to scroll them back.
 *
 * The fix is a real <dialog> opened with showModal(): the top layer is not part
 * of the z-index contest at all.
 */

const open = async (page: import('@playwright/test').Page) => {
	await page.getByRole('button', { name: /Cook mode/ }).click();
	await expect(page.locator('dialog.cook')).toBeVisible();
};

/** Is the centre of this element actually the element? */
const hitsItself = (page: import('@playwright/test').Page, selector: string) =>
	page.evaluate((sel) => {
		const el = document.querySelector(sel);
		if (!el) return 'missing';
		const r = el.getBoundingClientRect();
		const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
		if (!top) return 'off-screen';
		return el.contains(top) || top === el ? 'itself' : `${top.tagName}.${top.className}`;
	}, selector);

test.describe('on a phone in landscape', () => {
	// iPhone 13 landscape. The audit measured the Next button at y 409..460
	// against a 390px viewport here — permanently unreachable.
	test.use({ viewport: { width: 664, height: 390 } });

	test('the exit is the exit, not a navigation tab underneath it', async ({ page }) => {
		await goto(page, '/recipe/picanha-na-brasa');
		// Enter from a scrolled position: the nav is sticky, so this was the
		// worst case — the ✕ landed squarely on a mode tab.
		await page.evaluate(() => window.scrollTo(0, 600));
		await open(page);

		await expect(page.locator('dialog.cook')).toHaveJSProperty('open', true);
		expect(await page.evaluate(() => document.querySelector('dialog.cook')?.matches(':modal'))).toBe(
			true
		);
		expect(await hitsItself(page, 'dialog.cook .close')).toBe('itself');
	});

	test('Back and Next stay on screen on the longest step in the corpus', async ({ page }) => {
		await goto(page, '/recipe/picanha-na-brasa');
		await open(page);

		// Walk every step with the Next button — the dots are hidden in landscape,
		// where the vertical budget is 320-390px and they are a luxury. Check the
		// nav stays reachable on ALL of them, not just the one that happens to be
		// longest today.
		for (;;) {
			for (const label of [/Back/, /Next step|Done/]) {
				const box = await page.getByRole('button', { name: label }).boundingBox();
				expect(box, `no box for ${label} on this step`).not.toBeNull();
				expect(box!.y + box!.height, `${label} is off the bottom`).toBeLessThanOrEqual(390);
			}
			const next = page.getByRole('button', { name: /Next step/ });
			if (!(await next.count())) break; // last step shows Done instead
			await next.click();
		}
	});
});

test.describe('modal semantics', () => {
	test('focus enters on open and returns to the trigger on close', async ({ page }) => {
		await goto(page, '/recipe/cacio-e-pepe');
		const trigger = page.getByRole('button', { name: /Cook mode/ });
		await trigger.focus();
		await trigger.click();

		await expect(page.locator('dialog.cook')).toBeVisible();
		expect(
			await page.evaluate(() => document.querySelector('dialog.cook')?.contains(document.activeElement))
		).toBe(true);

		await page.getByRole('button', { name: 'Exit cook mode' }).click();
		await expect(page.locator('dialog.cook')).toHaveCount(0);
		// Not <body> — a keyboard user must not lose their place.
		expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).toMatch(
			/Cook mode/
		);
	});

	test('a closed dialog does not linger on screen', async ({ page }) => {
		// `display: flex` on .cook would otherwise beat the UA's
		// `dialog:not([open]) { display: none }`.
		await goto(page, '/recipe/cacio-e-pepe');
		await open(page);
		await page.keyboard.press('Escape');
		await expect(page.locator('dialog.cook')).toHaveCount(0);
	});
});

test('the timer tracks wall time, not the number of callbacks it received', async ({ page }) => {
	await goto(page, '/recipe/coq-au-vin');
	await open(page);

	// Find a step that states a duration.
	const dots = await page.locator('dialog.cook .dot').count();
	for (let n = 0; n < dots; n++) {
		await page.locator('dialog.cook .dot').nth(n).click();
		if (await page.locator('dialog.cook .clock').count()) break;
	}
	await expect(page.locator('dialog.cook .clock')).toBeVisible();
	await page.getByRole('button', { name: 'Start timer' }).click();

	const toSec = (s: string) => {
		const [m, x] = s.split(':').map(Number);
		return m * 60 + x;
	};
	const before = toSec((await page.locator('dialog.cook .clock').textContent())!);

	// Block the main thread for six real seconds. The old timer was
	// setInterval(() => remaining -= 1, 1000) and read no clock at all, so it
	// lost almost the whole window — a kitchen timer that under-reports.
	const wall = await page.evaluate(() => {
		const t0 = Date.now();
		const until = Date.now() + 6000;
		while (Date.now() < until) {
			/* block */
		}
		return Date.now() - t0;
	});
	await page.waitForTimeout(600);

	const after = toSec((await page.locator('dialog.cook .clock').textContent())!);
	const dropped = before - after;
	const wallSeconds = Math.round(wall / 1000);
	expect(dropped).toBeGreaterThanOrEqual(wallSeconds - 1);
});
