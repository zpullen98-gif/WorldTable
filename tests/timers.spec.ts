import { test, expect } from '@playwright/test';
import { goto } from './helpers';

/**
 * A timer that is not attached to a recipe.
 *
 * The rice. The refire on table 12. The Barolo that needs forty minutes in the
 * decanter. None of those are recipe steps, and `timers.start` had exactly ONE
 * call site in the whole app — cook mode's — so every cook on the line used
 * their phone, which is the thing this app was meant to replace. The bar
 * honestly showed two of the five pots actually running.
 *
 * Driven end to end rather than unit tested: the store is a runes module a
 * vitest test cannot reach, which is the same reason mergeSessions and
 * repertoire.ts are pure functions living outside their stores.
 */
test('a cook can start a timer from anywhere, without a recipe', async ({ page }) => {
	await goto(page, '/recipes');

	// The affordance has to exist when NOTHING is running — which is exactly
	// when a cook needs it, and exactly when the bar used to render nothing.
	const add = page.getByRole('button', { name: 'Start a timer' });
	await expect(add).toBeVisible();
	await add.click();

	await page.getByLabel('What this timer is for').fill('The rice');
	await page.getByRole('button', { name: '20 minutes', exact: true }).click();

	const bar = page.getByRole('status', { name: 'Kitchen timers' });
	await expect(bar).toContainText('The rice');
	// Counting DOWN from 20 minutes, not up.
	await expect(bar).toContainText(/19:5\d|20:00/);
});

test('the timer says on its own face that it cannot alarm while closed', async ({ page }) => {
	await goto(page, '/recipes');
	await page.getByRole('button', { name: 'Start a timer' }).click();

	// ring() is Web Audio with a documented "audio is a courtesy, never a
	// dependency" catch, there is no OS notification, and no wake lock outside
	// cook mode. A long clock on a tablet locked at 9pm will not alert anybody,
	// and would still be believed.
	await expect(page.getByText(/Rings only while the app is open/)).toBeVisible();
});

test('a running timer can be renamed, because the bar is read at two metres', async ({ page }) => {
	await goto(page, '/recipes');
	await page.getByRole('button', { name: 'Start a timer' }).click();
	await page.getByLabel('What this timer is for').fill('T12');
	await page.getByRole('button', { name: '10 minutes', exact: true }).click();

	const bar = page.getByRole('status', { name: 'Kitchen timers' });
	// The label button specifically: the row's ✕ is aria-labelled "Remove the T12
	// timer", so a name-based locator matches both. That labelling is correct —
	// the test was loose.
	await bar.locator('button.label').click();
	const field = page.getByLabel('Rename this timer');
	await field.fill('Table 12 refire');
	await field.press('Enter');

	await expect(bar).toContainText('Table 12 refire');
});

test('two timers are told apart by when they go off, not by renaming them for you', async ({
	page
}) => {
	await goto(page, '/recipes');

	for (const mins of ['5', '20']) {
		await page.getByRole('button', { name: 'Start a timer' }).click();
		await page.getByLabel('What this timer is for').fill('T12');
		await page.getByRole('button', { name: `${mins} minutes`, exact: true }).click();
	}

	const bar = page.getByRole('status', { name: 'Kitchen timers' });
	// Both keep the name the cook gave them; the deadline is what separates them.
	await expect(bar.locator('button.label')).toHaveCount(2);
	await expect(bar.getByText(/till \d\d:\d\d/).first()).toBeVisible();
});

/**
 * The preset buttons (3, 5, 10, 20, 40) were named by their bare digit alone,
 * with no unit and nothing connecting them to what they set: a screen reader
 * hit "20, button" with no way to tell minutes from anything else.
 */
test('the timer-length presets are a labelled group naming the unit', async ({ page }) => {
	await goto(page, '/recipes');
	await page.getByRole('button', { name: 'Start a timer' }).click();

	const group = page.locator('[role="group"][aria-label="Timer length"]');
	await expect(group).toHaveCount(1);
	for (const m of [3, 5, 10, 20, 40]) {
		await expect(group.getByRole('button', { name: `${m} minutes`, exact: true })).toHaveCount(1);
	}
});

/**
 * The bar keeps its controls when the offline toast arrives.
 *
 * TimerBar and UpdatePrompt were each position:fixed at bottom-centre, the
 * toast at z-index 90 over the bar's 70, so the "Ready to cook offline" toast
 * covered the running timers outright: at 1280x720 the rename button's centre
 * was (566, 645) and the toast covered y 644 to 702. Rename, Pause, Resume,
 * Dismiss and the row's remove button were all dead to the touch, on first
 * visit, with a pot on.
 *
 * It read as flake rather than as a bug because the toast lands about three
 * seconds after hydration, which is exactly when these tests are clicking:
 * the two specs that touch the bar LATE (the rename below, and the second
 * "Start a timer" of the two-timer spec) failed on a loaded machine and passed
 * on a quiet one, a different one each run, while the three that only assert
 * text or click the bar immediately after goto never failed at all. The fix is
 * a shared dock in +layout.svelte, so the two cannot overlap by construction;
 * this is the guard, and it uses the REAL service-worker toast because a
 * stand-in element would stack correctly even if the toast went back to being
 * fixed on its own.
 */
test('the offline toast stacks above the timer bar, never over it', async ({ page }) => {
	// A real first-visit precache. offline.spec.ts budgets the same way.
	test.setTimeout(90_000);
	await goto(page, '/');

	await page.getByRole('button', { name: 'Start a timer' }).click();
	await page.getByLabel('What this timer is for').fill('T12');
	await page.getByRole('button', { name: '10 minutes', exact: true }).click();

	const bar = page.getByRole('status', { name: 'Kitchen timers' });
	const label = bar.locator('button.label');
	await expect(label).toBeVisible();

	const toast = page.locator('.toast');
	await expect(toast).toBeVisible({ timeout: 60_000 });

	// Stated as geometry as well as behaviour, so a regression says WHY rather
	// than only reporting a click that timed out.
	const boxes = await page.evaluate(() => {
		const r = (s: string) => document.querySelector(s)?.getBoundingClientRect();
		const a = r('button.label');
		const b = r('.toast');
		if (!a || !b) return null;
		const hit = document.elementFromPoint(a.left + a.width / 2, a.top + a.height / 2);
		return {
			overlaps: a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom,
			topmostAtLabelCentre: hit?.closest('button.label') !== null
		};
	});
	expect(boxes).not.toBeNull();
	expect(boxes!.overlaps).toBe(false);
	expect(boxes!.topmostAtLabelCentre).toBe(true);

	// And the control actually works with the toast on screen. A short timeout
	// on purpose: occluded, this fails in five seconds saying the toast
	// intercepts pointer events, instead of hanging for the full thirty.
	await label.click({ timeout: 5_000 });
	await expect(page.getByLabel('Rename this timer')).toBeFocused();
});
