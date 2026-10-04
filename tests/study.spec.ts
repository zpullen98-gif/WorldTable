import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto } from './helpers';

/**
 * The study view of My Menu (docs/study-menus-design.md, 2.2 and 7.1), at a
 * phone's 390 by 844, with the shipped Brennan's pack served through
 * page.route the way house.spec.ts serves it: the suite's server withholds
 * packs, so the auto-load is the subject here and nowhere it is not asked for.
 *
 * The suite runs the standalone build (base ''), where no link to another
 * room is drawn by rule; the address shapes a based build draws are proved
 * in src/lib/wing-links.test.ts.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const PACK_FILE = join(HERE, '../static/shared/packs/brennans-new-orleans.v1.oothouse.json');
const PACK_TEXT = readFileSync(PACK_FILE, 'utf8');
const PACK = JSON.parse(PACK_TEXT).house;
const SHOTS = process.env.STUDY_SHOTS ?? '/tmp/claude-0/-home-user-zpullen98-gif-github-io/09201eae-82ec-5cba-9316-4d6cf5955e5e/scratchpad/shots/';
const HUSSARDE = 'd-1q0xk7jv';
const EYEBROW = 'Your words. Allergens: confirm at lineup.';
const CLOSING = 'Allergens: read the service note and confirm at lineup.';

test.use({ viewport: { width: 390, height: 844 } });

async function servePack(page: Page) {
	await page.route('**/shared/packs/brennans-new-orleans.v1.oothouse.json', (route) =>
		route.fulfill({ status: 200, contentType: 'application/json', body: PACK_TEXT })
	);
}

async function openStudy(page: Page, path = '/menu') {
	await servePack(page);
	await goto(page, path);
	await expect(page.locator('.study .row').first()).toBeVisible({ timeout: 15_000 });
}

const rows = (page: Page) => page.locator('.study .row');
const row = (page: Page, name: string) => page.locator('.study .row', { has: page.locator('.nm', { hasText: name }) });
const card = (page: Page) => page.locator('article.card');

test('the study view is what /menu opens on, short, with the first rows on the first screen', async ({ page }) => {
	await openStudy(page);
	await expect(page.locator('#study-h')).toHaveText(PACK.name);
	await expect(rows(page)).toHaveCount(PACK.dishes.length);
	await expect(page.getByText('Nothing pinned yet')).not.toBeVisible();

	// The first screen: the header, the section chips and the first row.
	const chip = page.getByRole('button', { name: `All ${PACK.dishes.length}` });
	await expect(chip).toHaveAttribute('aria-pressed', 'true');
	expect((await chip.boundingBox())!.y + 44).toBeLessThanOrEqual(844);
	// Arm's length: at least two whole dishes on the first screen, not one cut off.
	const second = (await rows(page).nth(1).boundingBox())!;
	expect(second.y + second.height, 'the second row ends inside the first 844px').toBeLessThanOrEqual(844);
	await expect(page.getByRole('button', { name: 'Tasting menus 4' })).toBeVisible();

	const m = await page.evaluate(() => ({ h: document.scrollingElement!.scrollHeight, w: document.scrollingElement!.scrollWidth }));
	expect(m.h, 'the page with the house loaded, no card open (235,732 before)').toBeLessThan(9000);
	expect(m.w).toBeLessThanOrEqual(390);

	// Every control in the study view at least 44px, every row at least 56px.
	const short = await page.evaluate(() =>
		[...document.querySelectorAll<HTMLElement>('.study button, .study input, .study summary, .houselists.study summary')]
			.filter((el) => el.offsetParent !== null)
			.map((el) => ({ t: (el.textContent || el.getAttribute('placeholder') || '').trim().slice(0, 30), h: el.getBoundingClientRect().height }))
			.filter((x) => x.h < 44)
	);
	expect(short).toEqual([]);
	const rowHeights = await rows(page).evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
	expect(Math.min(...rowHeights)).toBeGreaterThanOrEqual(56);

	// No allergen is ticked or stated anywhere on the study view.
	expect(await page.locator('input[type=checkbox]:checked').count()).toBe(0);
	await expect(page.locator('section.study[aria-labelledby="study-h"]')).not.toContainText('Allergens');

	await page.screenshot({ path: SHOTS + 'new-t1.png' });
});

test('the bar sticks, a section chip narrows the rows and says so, and the search finds a dish', async ({ page }) => {
	await openStudy(page);
	await page.evaluate(() => window.scrollTo(0, 3000));
	const box = await page.locator('.study .bar').boundingBox();
	expect(box!.y).toBeGreaterThanOrEqual(0);
	expect(box!.y).toBeLessThan(120);

	await page.getByRole('button', { name: 'Desserts 6' }).click();
	await expect(rows(page)).toHaveCount(6);
	await expect(page.locator('.study [aria-live="polite"]')).toHaveText('Showing Desserts: 6 dishes');

	await page.getByRole('button', { name: `All ${PACK.dishes.length}` }).click();
	await page.getByPlaceholder('Find a dish').fill('huss');
	await expect(rows(page)).toHaveCount(1);
	await expect(rows(page).first()).toContainText('Eggs Hussarde');
});

test('the shift filter drops a breakfast dish at dinner, and a drink searched for is found elsewhere in the house', async ({ page }) => {
	await openStudy(page);
	await page.getByRole('button', { name: 'Dinner', exact: true }).click();
	await expect(row(page, 'Eggs Hussarde')).toHaveCount(0);
	await page.getByPlaceholder('Find a dish').fill('huss');
	await expect(rows(page)).toHaveCount(0);
	await expect(page.locator('.study .none')).toHaveText('Nothing matches huss.');

	await page.getByPlaceholder('Find a dish').fill('sazerac');
	const elsewhere = page.locator('.study .elsewhere');
	await expect(elsewhere.locator('h3')).toHaveText('Elsewhere in the house');
	await expect(elsewhere).toContainText('Classic Sazerac, in the Ledger');
	// Standalone: plain words, never a link to a room on another origin.
	expect(await page.locator('a[href*="/ledger/"], a[href*="/codex/"]').count()).toBe(0);
	await page.getByRole('button', { name: 'All day' }).click();
});

test('the Eggs Hussarde card: the first screen answers the table, the rest teaches, and links into the app', async ({ page }) => {
	await openStudy(page);
	await page.getByRole('button', { name: 'Entrées 14' }).click();
	await row(page, 'Eggs Hussarde').click();
	const c = card(page);
	await expect(c.locator('h2')).toHaveText('Eggs Hussarde');
	await expect(c.locator('h2')).toBeFocused();
	await expect(page.locator('.study .bar')).toHaveCount(0);
	await expect(c.locator('.backline')).toContainText('1 of 14 in Entrées');
	await expect(c.locator('.backline').getByRole('button', { name: /^Next/ })).toBeVisible();
	await expect(c.locator('.price')).toHaveText('$27');
	await expect(c).toContainText('Prices as printed on 26 September 2026. Confirm before quoting.');
	await expect(c.locator('.sayit')).toHaveText('Hussarde: hoo-SARD.');
	await expect(c.locator('.ten')).toHaveText(PACK.dishes.find((d: any) => d.id === HUSSARDE).lines.value.s10);

	// The one line a server needs next, on the card's first 844px.
	const pour = c.locator('.pourline');
	await expect(pour).toHaveText(/^Pour: Brennan’s Essential by Piper-Heidsieck Extra Brut NV, \$28 glass\.\s+Without alcohol: Catalina Island\.$/);
	const top = (await c.boundingBox())!.y;
	const pb = (await pour.boundingBox())!;
	expect(pb.y + pb.height - top).toBeLessThanOrEqual(844);

	// The longer lines behind two toggles that say their state in words.
	const twenty = c.getByRole('button', { name: 'Twenty seconds' });
	await expect(twenty).toHaveAttribute('aria-expanded', 'false');
	await twenty.click();
	await expect(c.getByRole('button', { name: 'Hide twenty seconds' })).toHaveAttribute('aria-expanded', 'true');
	await expect(c.locator('#l20')).not.toBeEmpty();
	await expect(c.getByRole('button', { name: 'Forty-five seconds' })).toHaveAttribute('aria-expanded', 'false');

	// The parts, the pairing, the notes, the service note.
	await expect(c.locator('dl.parts dt')).toHaveCount(5);
	await expect(c.locator('#pour-h')).toHaveText('Pour with it');
	await expect(c.locator('.pairs').first()).toContainText('Brennan’s Essential by Piper-Heidsieck');
	await expect(c.locator('#floor-h')).toHaveText('On the floor');
	await expect(c.locator('.note .eyebrow')).toHaveText(EYEBROW);
	await expect(c.locator('.note .para')).toContainText('hoo-SARD');

	// In this app: the deck's own cards, never Bacon (coffee-cured Canadian bacon is loin, not belly).
	const deck = c.locator('.here').locator('h4', { hasText: 'In the Floor Deck' }).locator('xpath=following-sibling::ul[1]');
	await expect(deck.locator('.term')).toHaveText(['Cured', 'Hollandaise', 'Poached']);
	await expect(deck.locator('a').first()).toHaveAttribute('href', /\/service\/deck\/study\?card=fd_\d{4}$/);
	await expect(c.locator('.here')).not.toContainText('Bacon');

	// Allergens: nothing ticked, and the word only in the fixed eyebrow or the coaching's fixed close.
	expect(await page.locator('input[type=checkbox]:checked').count()).toBe(0);
	const said = await c.evaluate((el) => {
		const out: string[] = [];
		const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
		for (let n = walk.nextNode(); n; n = walk.nextNode()) if (/Allergens:/.test(n.textContent ?? '')) out.push((n.textContent ?? '').trim());
		return out;
	});
	for (const t of said) expect([EYEBROW, CLOSING].some((ok) => t.includes(ok))).toBe(true);
	expect(await c.locator('text=/No allergens/').count()).toBe(0);

	// No room on another origin is linked from the standalone build: the wine is named in words.
	expect(await c.locator('a[href*="/codex/"], a[href*="/ledger/"]').count()).toBe(0);

	await page.evaluate(() => window.scrollTo(0, 0));
	await c.scrollIntoViewIfNeeded();
	await page.locator('.studyslot').evaluate((el) => el.scrollIntoView({ block: 'start' }));
	await page.screenshot({ path: SHOTS + 'new-t2.png' });

	// Back: the list, with the focus on the row that opened the card.
	await c.getByRole('button', { name: 'Back to the menu' }).click();
	await expect(card(page)).toHaveCount(0);
	await expect(row(page, 'Eggs Hussarde')).toBeFocused();
	await expect(page.getByRole('button', { name: 'Entrées 14' })).toHaveAttribute('aria-pressed', 'true');
});

test('Bananas Foster links the Library recipe, labelled as the Library\'s', async ({ page }) => {
	await openStudy(page);
	await page.getByPlaceholder('Find a dish').fill('bananas');
	await row(page, 'World Famous Bananas Foster').click();
	const lib = card(page).locator('.here a', { hasText: "The Library's Bananas Foster: a recipe to cook, not the house's" });
	await expect(lib).toHaveAttribute('href', '/recipe/bananas-foster');
	await expect(card(page).locator('.here').locator('h4', { hasText: 'At the table' })).toBeVisible();
});

test('a cold /menu#d-... opens that card, and the back gesture closes a card opened from the list', async ({ page }) => {
	await servePack(page);
	await goto(page, '/menu#' + HUSSARDE);
	await expect(card(page).locator('h2')).toHaveText('Eggs Hussarde', { timeout: 15_000 });
	await card(page).getByRole('button', { name: 'Back to the menu' }).click();
	await expect(card(page)).toHaveCount(0);

	await page.getByRole('button', { name: 'Entrées 14' }).click();
	await row(page, 'Redfish Véronique').scrollIntoViewIfNeeded();
	const y = await page.evaluate(() => window.scrollY);
	expect(y).toBeGreaterThan(600);
	await row(page, 'Redfish Véronique').click();
	await expect(card(page).locator('h2')).toHaveText('Redfish Véronique');
	await page.goBack();
	await expect(card(page)).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Entrées 14' })).toHaveAttribute('aria-pressed', 'true');
	await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(y - 60);
	await expect(row(page, 'Redfish Véronique')).toBeFocused();
});

test('Edit the menu shows today’s editing page, and a card’s Edit opens that dish’s form', async ({ page }) => {
	await openStudy(page);
	await page.getByRole('button', { name: 'Edit the menu', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Edit the menu: on' })).toBeVisible();
	await expect(page.locator('.dishes li').first()).toBeVisible();
	await expect(page.locator('.dishtools').first().getByRole('button', { name: '86 it' })).toBeVisible();
	await expect(page.locator('.dishtools').first().getByRole('button', { name: 'Edit' })).toBeVisible();
	await expect(page.locator('.dishtools').first().getByRole('button', { name: 'Remove' })).toBeVisible();
	await page.getByRole('button', { name: 'Edit the menu: on' }).click();
	await expect(rows(page).first()).toBeVisible();

	await row(page, 'Eggs Hussarde').click();
	await card(page).getByRole('button', { name: /^Edit/ }).click();
	await expect(page.getByLabel('Dish name')).toHaveValue('Eggs Hussarde');
	await expect(page.getByRole('button', { name: 'Edit the menu: on' })).toBeVisible();
});

test('flash cards for a section deal only that section, turn before they grade, and come back to the section', async ({ page }) => {
	await openStudy(page);
	await page.getByRole('button', { name: 'Entrées 14' }).click();
	await page.locator('.study .grouphead').getByRole('button', { name: /^Flash cards/ }).click();
	await expect(page).toHaveURL(/\/menu\/quiz\?mode=cards&section=Entr/);
	const deck = page.locator('.itemdeck');
	await expect(deck.locator('.eyebrow').first()).toHaveText(/^Card 1 of 14 · Entrées · hidden$/);
	const entrees = new Set(PACK.dishes.filter((d: any) => d.section === 'Entrées').map((d: any) => d.name));

	// Got it and Again are not there until the card is turned; then both are on screen.
	await expect(page.getByRole('button', { name: 'Got it', exact: true })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Again', exact: true })).toHaveCount(0);
	const face = deck.locator('button.face');
	expect((await face.boundingBox())!.height).toBeGreaterThanOrEqual(240);
	expect(entrees.has((await deck.locator('.facename').textContent())!.trim())).toBe(true);
	await face.click();
	for (const name of ['Again', 'Got it']) {
		const b = (await page.getByRole('button', { name, exact: true }).boundingBox())!;
		expect(b.y + b.height).toBeLessThanOrEqual(844);
		expect(b.height).toBeGreaterThanOrEqual(56);
	}
	const first = (await deck.locator('.backname').textContent())!.trim();
	expect(entrees.has(first)).toBe(true);
	await page.getByRole('button', { name: 'Again', exact: true }).click();

	// Every card of the deck is an entrée.
	for (let i = 2; i <= 14; i++) {
		await expect(deck.locator('.eyebrow').first()).toHaveText(new RegExp(`^Card ${i} of 14 · Entrées · hidden$`));
		expect(entrees.has((await deck.locator('.facename').textContent())!.trim())).toBe(true);
		await deck.locator('button.face').click();
		await page.getByRole('button', { name: 'Got it', exact: true }).click();
	}
	await expect(page.locator('.flash[role="status"] .eyebrow')).toHaveText('Deck complete');
	await expect(page.locator('.flash[role="status"] .term')).toHaveText('Got it 13 · Again 1');

	// The answer is the house drill slot's, as a card-item.
	const slot = await page.evaluate(() => JSON.parse(localStorage.getItem('oot-house-drilled-v1') || '[]'));
	const firstId = PACK.dishes.find((d: any) => d.name === first).id;
	expect(slot.find((e: any) => e.v === 'missed').k).toBe(`house:${PACK.id}:${firstId}:card-item`);

	// Close the deck: back to the study view on Entrées, with the progress read back.
	await page.getByRole('button', { name: 'Close the deck' }).click();
	await expect(page).toHaveURL(/\/menu$/);
	await expect(page.getByRole('button', { name: 'Entrées 14' })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.locator('.study .progress')).toContainText('14 of 62 studied');
	await expect(page.locator('.study .progress')).toContainText('1 again');
	await page.getByRole('button', { name: 'My weak ones (1)' }).click();
	await expect(page.locator('.itemdeck .eyebrow').first()).toHaveText(/^Card 1 of 1 · Entrées · hidden$/);
	await expect(page.locator('.itemdeck .facename')).toHaveText(first);
});

test('offline with the worker installed, the study view, a card and its links all still work', async ({ page, context }) => {
	test.setTimeout(120_000);
	await servePack(page);
	await goto(page, '/');
	await page.evaluate(async () => {
		await navigator.serviceWorker.ready;
		if (!navigator.serviceWorker.controller) {
			await new Promise<void>((resolve) => {
				navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
				if (navigator.serviceWorker.controller) resolve();
			});
		}
	}).catch(() => {});
	// The pack is on the device once the home has loaded it.
	await goto(page, '/menu');
	await expect(rows(page).first()).toBeVisible({ timeout: 15_000 });
	await expect
		.poll(
			async () =>
				page.evaluate(async () => {
					let n = 0;
					for (const name of await caches.keys()) n += (await (await caches.open(name)).keys()).length;
					return n;
				}),
			{ timeout: 60_000 }
		)
		.toBeGreaterThan(40);

	await context.setOffline(true);
	await page.reload();
	await page.waitForSelector('html[data-hydrated]');
	await expect(rows(page)).toHaveCount(PACK.dishes.length, { timeout: 15_000 });
	await row(page, 'Eggs Hussarde').click();
	await expect(card(page).locator('h2')).toHaveText('Eggs Hussarde');
	await expect(card(page).locator('.here .term').first()).toBeVisible({ timeout: 20_000 });
	await expect(card(page).locator('.here')).not.toContainText('could not be read');
	await context.setOffline(false);
});

/* ---- the verifier's cases: each one a hole found on 3 October 2026 ---- */

test('verifier: Got it on a turned flash card is readable, its text not the colour of its own background', async ({ page }) => {
	await openStudy(page);
	await page.locator('.study .studyhead').getByRole('button', { name: 'Flash cards' }).click();
	await page.locator('.itemdeck button.face').click();
	const got = page.getByRole('button', { name: 'Got it', exact: true });
	await expect(got).toBeVisible();
	const c = await got.evaluate((el) => {
		const cs = getComputedStyle(el);
		return { color: cs.color, bg: cs.backgroundColor };
	});
	expect(c.color, 'Got it is drawn cream on cream: the global .chip.go colour survives the scoped .chip background').not.toBe(c.bg);
});

test('verifier: the shift filter narrows the decks the header deals, not only the rows', async ({ page }) => {
	await openStudy(page);
	await page.getByRole('button', { name: 'Dinner', exact: true }).click();
	const n = await rows(page).count();
	expect(n).toBeLessThan(PACK.dishes.length);
	await page.locator('.study .studyhead').getByRole('button', { name: 'Flash cards' }).click();
	await expect(page.locator('.itemdeck .eyebrow').first()).toHaveText(new RegExp(`^Card 1 of ${n} · `));
});

test('verifier: the five parts on a flash card’s back say they open, and read at arm’s length', async ({ page }) => {
	await openStudy(page);
	await page.locator('.study .studyhead').getByRole('button', { name: 'Flash cards' }).click();
	await page.locator('.itemdeck button.face').click();
	const summary = page.locator('.backparts summary');
	await expect(summary).toHaveText('Show the five parts');
	await summary.click();
	await expect(summary).toHaveText('Hide the five parts');
	const size = await page.locator('.backparts dd').first().evaluate((el) => getComputedStyle(el).fontSize);
	expect(size).toBe('18px');
	await page.screenshot({ path: SHOTS + 'new-t3-flash-back.png', fullPage: false });
	// The next card starts closed again.
	await page.getByRole('button', { name: 'Got it', exact: true }).click();
	await page.locator('.itemdeck button.face').click();
	await expect(page.locator('.backparts summary')).toHaveText('Show the five parts');
});
