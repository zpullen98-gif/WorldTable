import { test, expect } from '@playwright/test';
import { goto, seedSession } from './helpers';

/**
 * A record from a newer edition is held, announced, and never written over.
 *
 * Before this: migrate() refused the record, loadSession caught the refusal,
 * snapshotted it under a corrupt.* key nothing read - TWICE per page load,
 * unbounded - and returned an empty session; one tap persisted that empty
 * over the real record. Latent while schemaVersion has only ever been 1, but
 * vite.config registers the service worker with `prompt`, never reloading a
 * cook out from under a service - so a stale shell after a future bump is the
 * shipped design, and this path was armed for it.
 *
 * Run alone: `npx playwright test tests/future-version.spec.ts`.
 */
const readStore = () =>
	new Promise<{ keys: string[]; session: Record<string, unknown> | undefined }>((resolve) => {
		const open = indexedDB.open('world-table');
		open.onsuccess = () => {
			const st = open.result.transaction('state', 'readonly').objectStore('state');
			const keys = st.getAllKeys();
			keys.onsuccess = () => {
				const get = st.get('session');
				get.onsuccess = () =>
					resolve({ keys: keys.result.map(String), session: get.result as Record<string, unknown> });
			};
		};
	});

test('a newer record is held: banner up, hidden, and untouched by a tap and a reload', async ({
	page
}) => {
	await seedSession(page, { schemaVersion: 2, pantry: ['Chicken'], futureField: 'x' });
	await goto(page, '/pantry');

	await expect(page.getByRole('alert')).toContainText(/older edition/);
	// Hidden, as the banner says: this build must not render what it cannot read.
	await expect(page.getByLabel('Chicken')).not.toBeChecked();

	// The killer path today: a tap, then the tab-hide flush.
	await page.getByLabel('Beef').check();
	await page.evaluate(() => {
		Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
		window.dispatchEvent(new Event('visibilitychange'));
	});
	await page.waitForTimeout(700);

	const after = await page.evaluate(readStore);
	expect(after.session?.schemaVersion, 'the newer record must still be on disk').toBe(2);
	expect(after.session?.pantry).toEqual(['Chicken']);
	expect(after.session?.futureField).toBe('x');
	expect(after.keys.filter((k) => k.startsWith('corrupt.') || k.startsWith('unreadable::'))).toEqual(
		[]
	);

	// Reload WITHOUT the seed re-running, so what we see is what the app left.
	await page.evaluate(() => localStorage.setItem('__wt_seed_off', '1'));
	await page.reload();
	await page.waitForSelector('html[data-hydrated]');
	await expect(page.getByRole('alert')).toContainText(/older edition/);
	const again = await page.evaluate(readStore);
	expect(again.session?.pantry).toEqual(['Chicken']);
	expect(again.keys).toEqual(after.keys);
});

test('a newer record that lands after load is refused at write time', async ({ page }) => {
	await seedSession(page, { schemaVersion: 1, pantry: [] });
	await goto(page, '/pantry');
	await expect(page.getByRole('alert')).toHaveCount(0);

	// A sibling tab on a newer build writes while this one sits open.
	await page.evaluate(
		() =>
			new Promise<void>((resolve) => {
				const open = indexedDB.open('world-table');
				open.onsuccess = () => {
					const st = open.result.transaction('state', 'readwrite').objectStore('state');
					const get = st.get('session');
					get.onsuccess = () => {
						const put = st.put({ ...get.result, schemaVersion: 2, pantry: ['Chicken'] }, 'session');
						put.onsuccess = () => resolve();
					};
				};
			})
	);
	await page.evaluate(() => localStorage.setItem('__wt_seed_off', '1'));

	await page.getByLabel('Beef').check();
	await page.waitForTimeout(500);
	const on = await page.evaluate(readStore);
	expect(on.session?.schemaVersion).toBe(2);
	expect(on.session?.pantry).toEqual(['Chicken']);
	// And the store noticed without a reload.
	await expect(page.getByRole('alert')).toContainText(/older edition/);
});

/** The control: the harness sees the app's own writes when nothing is held. */
test('a current record is written normally', async ({ page }) => {
	await seedSession(page, { schemaVersion: 1, pantry: [] });
	await goto(page, '/pantry');
	await page.evaluate(() => localStorage.setItem('__wt_seed_off', '1'));
	await page.getByLabel('Chicken').check();
	await page.waitForTimeout(500);
	const on = await page.evaluate(readStore);
	expect(on.session?.pantry).toEqual(['Chicken']);
});
