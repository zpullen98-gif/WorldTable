import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto, seedSession } from './helpers';

/**
 * Cook at home (src/lib/kitchen.ts) at a phone's 390 by 844: the level page's
 * section under Today's study, a dish page, cook mode with its coaching and
 * its words, marking a dish cooked so it counts and comes back, the units
 * remembered per device, Back on every new screen, and a level's dishes
 * cooking offline once opened.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const INDEX = JSON.parse(readFileSync(join(HERE, '../src/lib/data/kitchen.index.json'), 'utf8')) as {
	dishes: Array<{ slug: string; level: number; meal: string; n: number; title: string }>;
};
const LEVEL1 = JSON.parse(readFileSync(join(HERE, '../static/kitchen-data/level-1.json'), 'utf8')) as {
	dishes: Array<{ slug: string; title: string; mise: string[]; steps: Array<{ do: string; look: string }>; ingredients: Array<{ us: string; metric: string }> }>;
};
const row = (level: number, meal: string, n: number) => INDEX.dishes.find((d) => d.level === level && d.meal === meal && d.n === n)!;
const B1 = row(1, 'breakfast', 1);
const B2 = row(1, 'breakfast', 2);
const D1 = row(1, 'dessert', 1);
const FIRST = LEVEL1.dishes.find((d) => d.slug === B1.slug)!;

test.use({ viewport: { width: 390, height: 844 } });

const backBtn = (page: Page) => page.locator('.backline button.back');
const section = (page: Page) => page.locator('#kitchen');

test('the level page carries Cook at home right under Today’s study, four meals of 25', async ({ page }) => {
	await goto(page, '/level/1');
	const heads = await page.locator('h2.group').allTextContents();
	expect(heads.slice(0, 3)).toEqual(["Today's study", 'Cook at home', 'My restaurant']);
	await expect(section(page)).toBeVisible();

	const tabs = page.getByRole('tab');
	await expect(tabs).toHaveCount(4);
	await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
	await expect(tabs.nth(0)).toContainText('Breakfast');
	await expect(tabs.nth(0)).toContainText('0 of 25');
	for (let i = 0; i < 4; i++) {
		const box = await tabs.nth(i).boundingBox();
		expect(box!.height).toBeGreaterThanOrEqual(44);
	}

	const panel = page.getByRole('tabpanel');
	await expect(panel.locator('a[data-door="kitchen-next"] .door-line')).toHaveText(B1.title);
	await expect(panel.locator('ol.kdishes li')).toHaveCount(25);
	await expect(panel.locator('ol.kdishes li').first()).toContainText(B1.title);

	await page.getByRole('tab', { name: /Dessert/ }).click();
	await expect(page.getByRole('tab', { name: /Dessert/ })).toHaveAttribute('aria-selected', 'true');
	await expect(panel.locator('ol.kdishes li').first()).toContainText(D1.title);
	await expect(panel.locator('ol.kdishes li')).toHaveCount(25);

	// The keyboard moves along the tabs.
	await page.getByRole('tab', { name: /Dessert/ }).press('ArrowLeft');
	await expect(page.getByRole('tab', { name: /Dinner/ })).toHaveAttribute('aria-selected', 'true');

	// No horizontal scroll at phone width.
	const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
	expect(wide).toBe(false);
});

test('a dish page holds every part, with the units switch remembered per device', async ({ page }) => {
	await goto(page, `/kitchen?d=${B1.slug}&level=1`);
	await expect(page.locator('article.dish h1')).toHaveText(B1.title);
	await expect(page.locator('article.dish .eyebrow')).toHaveText(/^Commis · Breakfast · 1 of 25 · /);
	for (const name of ['Ingredients', 'Equipment', 'Mise en place', 'The timeline', 'Method', 'Why it works', 'Plating', 'To drink', 'Variations', 'Watch it done', 'Your record']) {
		await expect(page.locator('.sec', { hasText: name }).first(), name).toBeVisible();
	}
	// Metric is the app's default; US rewrites every quantity and survives a reload.
	await expect(page.locator('.ingredients .qty').first()).toHaveText(FIRST.ingredients[0].metric);
	await page.getByRole('group', { name: 'Units' }).getByRole('button', { name: 'US' }).click();
	await expect(page.locator('.ingredients .qty').first()).toHaveText(FIRST.ingredients[0].us);
	await page.reload();
	await page.waitForSelector('html[data-hydrated]');
	await expect(page.locator('.ingredients .qty').first()).toHaveText(FIRST.ingredients[0].us);

	// The mise en place ticks.
	const tick = page.locator('.mise input').first();
	await tick.check();
	await expect(tick).toBeChecked();

	// Every step carries what to look for; the mistake and fix wait behind a disclosure.
	await expect(page.locator('ol.steps li.step')).toHaveCount(FIRST.steps.length);
	const first = page.locator('ol.steps li.step').first();
	await expect(first.locator('.look')).toContainText(FIRST.steps[0].look);
	await expect(first.locator('details.wrong p').first()).toBeHidden();
	await first.locator('details.wrong summary').click();
	await expect(first.locator('details.wrong p').first()).toBeVisible();

	// One step at a time.
	await page.getByRole('button', { name: 'One at a time' }).click();
	await expect(page.locator('.onestep .stepof')).toHaveText(`Step 1 of ${FIRST.steps.length}`);
	await page.locator('.onestep').getByRole('button', { name: /Next step/ }).click();
	await expect(page.locator('.onestep .stepof')).toHaveText(`Step 2 of ${FIRST.steps.length}`);
	await expect(page.locator('.onestep .do')).toHaveText(FIRST.steps[1].do);

	// The film: always a YouTube search, opening outside the app.
	const search = page.locator('a[data-video="search"]');
	await expect(search).toHaveAttribute('href', /^https:\/\/www\.youtube\.com\/results\?search_query=/);
	await expect(search).toHaveAttribute('target', '_blank');

	const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
	expect(wide).toBe(false);
});

test('cook mode coaches each step, asks in words, and the cook counts and comes back', async ({ page }) => {
	await goto(page, '/level/1');
	await page.getByRole('tabpanel').locator('a[data-door="kitchen-next"]').click();
	await expect(page).toHaveURL(new RegExp(`/kitchen\\?d=${B1.slug}&level=1$`));
	await expect(page.locator('article.dish h1')).toHaveText(B1.title);

	await page.getByRole('button', { name: 'Cook mode', exact: true }).click();
	const dialog = page.locator('dialog.cook');
	await expect(dialog).toBeVisible();
	// It opens on the mise en place, ahead of step 1: real cooking sits there.
	await expect(dialog.locator('.eyebrow')).toHaveText(`${B1.title} · before step 1`);
	await expect(dialog.locator('.preplist li')).toHaveCount(FIRST.mise.length);
	await dialog.locator('.preplist input').first().check();
	await dialog.getByRole('button', { name: 'Start step 1 ▶' }).click();
	await expect(dialog.locator('.step')).toHaveText(FIRST.steps[0].do);
	// Back from step 1 returns to the mise, with the tick kept.
	await dialog.getByRole('button', { name: '◀ Mise' }).click();
	await expect(dialog.locator('.preplist input').first()).toBeChecked();
	await dialog.getByRole('button', { name: 'Start step 1 ▶' }).click();
	await expect(dialog.locator('.look')).toContainText(FIRST.steps[0].look);
	await dialog.getByRole('button', { name: `Go to step ${FIRST.steps.length}` }).click();
	await dialog.getByRole('button', { name: /Done, say how it came out/ }).click();
	await expect(dialog.locator('.passq')).toHaveText('How did it come out?');
	await dialog.getByRole('button', { name: 'Nailed it' }).click();
	await expect(dialog).toBeHidden();

	await expect(page.locator('.recline')).toContainText('Cooked once');
	await expect(page.locator('.recline')).toContainText('nailed it');
	await expect(page.locator('.stats li.done')).toBeVisible();

	// Back returns to the level page, where it counts.
	await backBtn(page).click();
	await expect(page).toHaveURL(/\/level\/1$/);
	await expect(page.getByRole('tab', { name: /Breakfast/ })).toContainText('1 of 25');
	await expect(page.getByRole('tabpanel').locator('a[data-door="kitchen-next"] .door-line')).toHaveText(B2.title);
	await expect(page.getByRole('tabpanel').locator('ol.kdishes li').first().locator('.met')).toHaveText('Cooked');
	// Words, never glyphs, and nothing under 15 px in the section (design 2.9).
	const small = await page.evaluate(() => {
		const out: string[] = [];
		for (const el of document.querySelectorAll<HTMLElement>('.mealtabs *, .mealpanel *')) {
			const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
			if (!own || el.offsetParent === null) continue;
			if (parseFloat(getComputedStyle(el).fontSize) < 15) out.push(el.textContent!.trim().slice(0, 30));
			if (/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\u2190-\u21FF\u25A0-\u25FF]/u.test(el.textContent ?? '')) out.push(`glyph: ${el.textContent!.trim().slice(0, 30)}`);
		}
		return out;
	});
	expect(small).toEqual([]);

	// It is in the cooked log under its namespace, so it comes back for a re-cook.
	await goto(page, '/repertoire');
	await expect(page.locator('a.name', { hasText: B1.title })).toBeVisible();
});

test('marking cooked from the page, by a word, and undoing the mis-tap', async ({ page }) => {
	await goto(page, `/kitchen?d=${B2.slug}&level=1`);
	await expect(page.locator('.recline')).toHaveText('Not cooked yet.');
	await page.locator('.rate button[data-grade="close"]').click();
	await expect(page.locator('.recline')).toContainText('Recorded: Nearly there.');
	await expect(page.locator('.recline')).toContainText('Cooked once');
	await page.getByRole('button', { name: 'Undo the last cook' }).click();
	await expect(page.locator('.recline')).toHaveText('Not cooked yet.');

	await page.locator('#k-notes').fill('Pan too hot on the first egg.');
	await page.waitForTimeout(700);
	await page.reload();
	await page.waitForSelector('html[data-hydrated]');
	await expect(page.locator('#k-notes')).toHaveValue('Pan too hot on the first egg.');
});

test('Back on every new screen: dish to dish to level page, and a cold dish to its level', async ({ page }) => {
	// A cold load of a dish at depth 0 goes to its own level page, named in the address.
	await goto(page, `/kitchen?d=${row(3, 'lunch', 4).slug}&level=3`);
	await expect(page.locator('article.dish h1')).toHaveText(row(3, 'lunch', 4).title);
	await expect(backBtn(page)).toHaveCount(1);
	await backBtn(page).click();
	await expect(page).toHaveURL(/\/level\/3$/);

	// Pushed: level page, a dish, the next dish, then Back twice by the button and the gesture.
	await goto(page, '/level/1');
	await page.getByRole('tabpanel').locator('ol.kdishes li a').first().click();
	await expect(page.locator('article.dish h1')).toHaveText(B1.title);
	await page.locator('.nextdish a.door').click();
	await expect(page.locator('article.dish h1')).toHaveText(B2.title);
	await backBtn(page).click();
	await expect(page.locator('article.dish h1')).toHaveText(B1.title);
	await page.goBack();
	await expect(page).toHaveURL(/\/level\/1$/);
	await expect(section(page)).toBeVisible();

	// The course overview has Back too.
	await goto(page, '/kitchen');
	await expect(page.locator('h1')).toHaveText('Cook at home');
	await expect(backBtn(page)).toHaveCount(1);
});

test('a dish past its re-cook date reads Due again, and a door names the most overdue', async ({ page }) => {
	const DAY = 86_400_000;
	const now = Date.now();
	const rows = INDEX.dishes.filter((d) => d.level === 3 && d.meal === 'breakfast').sort((a, b) => a.n - b.n);
	// Every breakfast at the level cooked; the fifth 40 days ago (about three
	// fortnights late), the ninth 20 days ago (under one and a half), the rest
	// yesterday. The Repertoire's order puts the fifth first.
	const at = (n: number) => (n === 5 ? now - 40 * DAY : n === 9 ? now - 20 * DAY : now - DAY);
	await seedSession(page, { cookedLog: rows.map((r) => ({ slug: `kitchen:${r.slug}`, at: at(r.n), grade: 'met' })) });
	await goto(page, '/level/3');
	await page.getByRole('tab', { name: /Breakfast/ }).click();
	const panel = page.getByRole('tabpanel');
	await expect(page.getByRole('tab', { name: /Breakfast/ })).toContainText('25 of 25');
	await expect(panel.locator('a[data-door="kitchen-next"]')).toHaveCount(0);
	const door = panel.locator('a[data-door="kitchen-recook"]');
	await expect(door.locator('.door-line')).toHaveText(rows[4].title);
	await expect(door.locator('.door-name')).toHaveText('Cook again · the most overdue of 2 due');
	await expect(door).toHaveClass(/lead/);
	const marks = panel.locator('ol.kdishes li .met');
	await expect(marks.nth(4)).toHaveText('Due again');
	await expect(marks.nth(8)).toHaveText('Due again');
	await expect(marks.nth(0)).toHaveText('Cooked');
	await expect(panel.locator('ol.kdishes li .met', { hasText: 'Due again' })).toHaveCount(2);
	await expect(panel).toContainText('The ones due again are marked in the list.');
	await door.click();
	await expect(page.locator('article.dish h1')).toHaveText(rows[4].title);
	await expect(page.locator('.recline')).toContainText('due a re-cook now');
});

test('cook mode runs a timer on a mise line that states a time', async ({ page }) => {
	const dish = LEVEL1.dishes.find((d) => d.mise.some((m) => /\d+\s*(?:minutes?|hours?)\b/.test(m)));
	test.skip(!dish, 'no level 1 mise line states a time');
	const r = INDEX.dishes.find((d) => d.slug === dish!.slug)!;
	await goto(page, `/kitchen?d=${r.slug}&level=1`);
	await page.getByRole('button', { name: 'Cook mode', exact: true }).click();
	const dialog = page.locator('dialog.cook');
	const timed = dialog.locator('.preplist li', { has: page.locator('.preptimer') }).first();
	await expect(timed).toBeVisible();
	await timed.getByRole('button', { name: /Start timer/ }).click();
	await expect(timed.getByRole('button', { name: 'Pause' })).toBeVisible();
	// The mise timer keeps running on the steps, listed among the other timers.
	await dialog.getByRole('button', { name: 'Start step 1 ▶' }).click();
	await expect(dialog.locator('.others li', { hasText: 'mise' })).toHaveCount(1);
});

/*
 * Offline is proved from the worker's cache, not with context.setOffline: in
 * this Chromium setOffline does not stop the service worker's own fetches, so
 * a level never opened still loaded under it and the old test passed whether
 * or not the oot-table-kitchen-v1 route existed. The route below aborts every
 * fetch of a level file, the worker's included (context.route sees service
 * worker traffic when serviceWorkers is 'allow'), so a dish draws only from
 * that cache, and a level never opened must say so.
 */
test('a level opened once cooks offline', async ({ page, context }) => {
	test.setTimeout(90_000);
	await goto(page, '/');
	await page.evaluate(async () => {
		await navigator.serviceWorker.ready;
		if (!navigator.serviceWorker.controller) {
			await new Promise<void>((resolve) => {
				navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
				if (navigator.serviceWorker.controller) resolve();
			});
		}
	});
	await goto(page, `/kitchen?d=${B1.slug}&level=1`);
	await expect(page.locator('article.dish h1')).toHaveText(B1.title);
	// The worker kept level 1's file, and only that level, under its own cache name.
	await expect
		.poll(
			async () =>
				page.evaluate(async () => {
					if (!(await caches.has('oot-table-kitchen-v1'))) return [];
					const keys = await (await caches.open('oot-table-kitchen-v1')).keys();
					return keys.map((r) => new URL(r.url).pathname.split('/').pop());
				}),
			{ timeout: 20_000 }
		)
		.toEqual(['level-1.json']);

	let aborted = 0;
	await context.route('**/kitchen-data/**', (route) => {
		aborted++;
		return route.abort('internetdisconnected');
	});
	// Another level 1 dish draws from the cache with every level fetch refused.
	await goto(page, `/kitchen?d=${D1.slug}&level=1`);
	await expect(page.locator('article.dish h1')).toHaveText(D1.title);
	expect(aborted).toBeGreaterThan(0);
	// A level never opened has nothing to draw from and says so.
	const L4 = row(4, 'dinner', 1);
	await goto(page, `/kitchen?d=${L4.slug}&level=4`);
	await expect(page.locator('.note', { hasText: 'not been opened on this device yet' })).toBeVisible();
	await expect(page.locator('article.dish')).toHaveCount(0);
	// The level page's lists come from the precached index.
	await goto(page, '/level/1');
	await expect(page.getByRole('tabpanel').locator('ol.kdishes li')).toHaveCount(25);
	await context.unroute('**/kitchen-data/**');
});
