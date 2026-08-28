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
	await page.getByRole('button', { name: '20', exact: true }).click();

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
	await page.getByRole('button', { name: '10', exact: true }).click();

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
		await page.getByRole('button', { name: mins, exact: true }).click();
	}

	const bar = page.getByRole('status', { name: 'Kitchen timers' });
	// Both keep the name the cook gave them; the deadline is what separates them.
	await expect(bar.locator('button.label')).toHaveCount(2);
	await expect(bar.getByText(/till \d\d:\d\d/).first()).toBeVisible();
});
