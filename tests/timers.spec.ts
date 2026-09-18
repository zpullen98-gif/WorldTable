import { test, expect } from '@playwright/test';
import { goto } from './helpers';

/**
 * A timer that is not attached to a recipe STEP.
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
test('a cook can start a timer that is no step of the method', async ({ page }) => {
	await goto(page, '/recipe/cacio-e-pepe');

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
	await goto(page, '/recipe/cacio-e-pepe');
	await page.getByRole('button', { name: 'Start a timer' }).click();

	// ring() is Web Audio with a documented "audio is a courtesy, never a
	// dependency" catch, there is no OS notification, and no wake lock outside
	// cook mode. A long clock on a tablet locked at 9pm will not alert anybody,
	// and would still be believed.
	await expect(page.getByText(/Rings only while the app is open/)).toBeVisible();
});

test('a running timer can be renamed, because the bar is read at two metres', async ({ page }) => {
	await goto(page, '/recipe/cacio-e-pepe');
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
	await goto(page, '/recipe/cacio-e-pepe');

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
	await goto(page, '/recipe/cacio-e-pepe');
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
	// A real first-visit precache. offline.spec.ts budgets the same way. The
	// dish rather than the home page: a cold start either way, and only the
	// dish carries the launcher now.
	test.setTimeout(90_000);
	await goto(page, '/recipe/cacio-e-pepe');

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

/**
 * The timer belongs to the cooking process.
 *
 * "+ Timer" sat in the dock on every route, so the home page and the Lexicon
 * each carried a floating control for a thing neither of them does. The
 * owner's rule: the timer is offered where a method is on screen, and nowhere
 * else.
 *
 * The second half of this test is not a hedge against the first. A RUNNING
 * timer still follows the cook everywhere, because this bar is the only thing
 * in the app that rings — no OS notification, no wake lock outside cook mode —
 * so a timer that vanished when a cook stepped to the Lexicon to look up a
 * word would be a pot left on the heat with nothing watching it. Starting one
 * is what is scoped; keeping one is not.
 */
test('the timer is offered where cooking happens, and nowhere else', async ({ page }) => {
	const add = page.getByRole('button', { name: 'Start a timer' });
	const bar = page.getByRole('status', { name: 'Kitchen timers' });

	// Nothing running and no method on screen: no launcher, and no empty bar
	// left behind either.
	await goto(page, '/');
	await expect(add).toHaveCount(0);
	await expect(bar).toHaveCount(0);

	await goto(page, '/lexicon');
	await expect(add).toHaveCount(0);

	// /recipes is the trap, not a third example. '/recipes'.startsWith('/recipe')
	// is TRUE, which is why the layout's OWNS map exists at all, and it is the
	// index six of the specs above were moved OFF for not being a cooking
	// surface. If the trailing slash in '/recipe/' is ever dropped, this is the
	// assertion that says so.
	await goto(page, '/recipes');
	await expect(add).toHaveCount(0);

	await goto(page, '/recipe/cacio-e-pepe');
	await expect(add).toBeVisible();
	await add.click();
	await page.getByLabel('What this timer is for').fill('The rice');
	await page.getByRole('button', { name: '20 minutes', exact: true }).click();
	await expect(bar).toContainText('The rice');

	// Walk away from the dish: the pot is still watched, and still cannot be
	// joined by a second one from here.
	await goto(page, '/lexicon');
	await expect(bar).toContainText('The rice');
	await expect(add).toHaveCount(0);
});

/**
 * The same rule, reached the way a cook reaches it: by tapping.
 *
 * Every leg above uses `goto`, which is `page.goto` - a full document load that
 * throws the root layout away and recomputes everything from scratch. The
 * mechanism this change actually rests on is a DERIVED flag that has to flip
 * during SvelteKit's client-side navigation, and a full load cannot tell a
 * reactive `cooking` from a constant one: replace the `$derived` with a plain
 * const and every assertion above still passes. This is the one that fails.
 */
test('the launcher appears and disappears on a tapped navigation, not just a reload', async ({
	page
}) => {
	const add = page.getByRole('button', { name: 'Start a timer' });

	await goto(page, '/recipe/cacio-e-pepe');
	await expect(add).toBeVisible();

	// Client-side, through the app's own chrome.
	await page.getByRole('link', { name: 'Library', exact: true }).click();
	await expect(page).toHaveURL(/\/recipes/);
	await expect(add).toHaveCount(0);

	// And back, still without a reload.
	await page.locator('a.card').first().click();
	await expect(page).toHaveURL(/\/recipe\//);
	await expect(add).toBeVisible();
});

/**
 * Arriving at a dish must not put focus on the dock.
 *
 * `hasOpenedAdd` is the flag that hands focus back to "+ Timer" after Cancel or
 * a started timer, and it is deliberately not reactive. Gating the button on
 * `cooking` made it unbind and rebind on every crossing of the cooking
 * boundary, and the focus effect reads `addBtnEl`, so each rebind re-ran it:
 * once a cook had opened the panel even once, ARRIVING at the next dish moved
 * focus to the floating button at the bottom of the screen, and a screen
 * reader opened the dish by reading "Start a timer, button". The whole e2e
 * suite stayed green, because nothing in it asserted focus across a route
 * change.
 */
test('arriving at a dish leaves focus at the top of the page, not on the dock', async ({
	page
}) => {
	const add = page.getByRole('button', { name: 'Start a timer' });

	await goto(page, '/recipe/cacio-e-pepe');
	await add.click();
	// Cancel, which is the transition hasOpenedAdd exists for: focus is handed
	// back to "+ Timer" HERE, correctly, and must not persist past this page.
	await page.getByRole('button', { name: 'Cancel' }).click();
	await expect(add).toBeFocused();

	await page.getByRole('link', { name: 'Library', exact: true }).click();
	await page.locator('a.card').first().click();
	await expect(page).toHaveURL(/\/recipe\//);

	await expect(add).toBeVisible();
	await expect(add).not.toBeFocused();
});

/**
 * The open panel is the one state that can walk off a dish.
 *
 * The {#if cooking} gate only covers the CLOSED row: while `adding` is true
 * that branch is not rendered at all, and the add form's only gate is the
 * root {#if list.length || cooking}, which stays true for as long as a pot is
 * on. So a cook with a timer running can open "+ Timer", tap away to the
 * Library, and carry a live set of presets onto a page that offers no timers.
 * An $effect closes it; this is what says so.
 */
test('an open timer panel does not travel off the dish', async ({ page }) => {
	await goto(page, '/recipe/cacio-e-pepe');

	// A running timer, so the bar itself survives the journey and the panel is
	// the only thing under test.
	await page.getByRole('button', { name: 'Start a timer' }).click();
	await page.getByLabel('What this timer is for').fill('The braise');
	await page.getByRole('button', { name: '40 minutes', exact: true }).click();

	await page.getByRole('button', { name: 'Start a timer' }).click();
	await expect(page.getByLabel('What this timer is for')).toBeVisible();

	await page.getByRole('link', { name: 'Library', exact: true }).click();
	await expect(page.getByLabel('What this timer is for')).toHaveCount(0);
	// The pot is still watched; only the form went.
	await expect(page.getByRole('status', { name: 'Kitchen timers' })).toContainText('The braise');
});

/**
 * The other half of `cooking`.
 *
 * `/family/` is in the rule because a dish the kitchen wrote itself renders
 * through the same RecipeDetailView, with the same method and the same cook
 * mode, as one of the 1,844 in the book. Nothing else in the suite visits a
 * family dish at all, so deleting that half of the condition left every test
 * green.
 */
test('a dish the kitchen wrote itself is a cooking surface too', async ({ page }) => {
	await goto(page, '/family');
	await page.getByLabel('Dish name').fill('Probe Stew');
	await page.getByLabel(/Ingredients[:—-] one per line/).fill('2 onions\n500g beef');
	await page
		.getByLabel(/Method[:—-] one step per line/)
		.fill('Brown the beef.\nSimmer 90 min until tender.');
	await page.getByRole('button', { name: 'Add to the guide' }).click();
	await expect(page.locator('.msg')).toContainText('Probe Stew');

	await goto(page, '/family/probe-stew');
	await expect(page.locator('.head h1')).toHaveText('Probe Stew');
	await expect(page.getByRole('button', { name: 'Start a timer' })).toBeVisible();
});

/**
 * A URL that looks like a dish is not a dish.
 *
 * `cooking` asks the route, so an address under /recipe/ that resolves to
 * nothing still looked like a cooking surface: +error.svelte renders "Nothing
 * at this address", with no ingredients, no method and no cook mode, and the
 * dock painted a "+ Timer" over it. Twenty-two recipe URLs were renamed in one
 * commit on this branch, so a stale bookmark landing here is a real journey.
 */
test('an address under /recipe/ that resolves to nothing carries no timer', async ({ page }) => {
	await goto(page, '/recipe/no-such-dish-as-this');
	await expect(page.getByRole('heading', { name: 'Nothing at this address' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Start a timer' })).toHaveCount(0);
});
