import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto } from './helpers';

/**
 * The consolidation (docs/consolidation-design.md, section 7): four tabs and a
 * quiet More, Back on every screen, at a phone's 390 by 844 with the shipped
 * Brennan's pack on the device (served through page.route, as study.spec.ts
 * serves it: the suite's server withholds packs). Since 17 Oct 2026 the
 * Table's words are Home, Brennan's, Practise, Library and More: the house's
 * page is the Brennan's tab (its h1 the house's name, PACK.name, with the
 * curly apostrophe the pack prints), and every deck and every round, the
 * quick quiz first, is under Practise (/flashcards; the rounds still run on
 * /quizzes and /menu/quiz, whose parent is Practise).
 *
 * "Back" is the Back control; "gesture" is page.goBack(). "Scroll kept" is
 * scrollY within 4 px of the value before leaving. The numbers in the test
 * names are the design's (7.1).
 *
 * The suite runs the standalone build (base ''), where no link into another
 * room is drawn, so test 25 (arriving from the Codex) runs on the site's
 * copies; its rule is unit-tested in src/lib/nav.test.ts (cameFrom).
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const PACK_TEXT = readFileSync(join(HERE, '../static/shared/packs/brennans-new-orleans.v1.oothouse.json'), 'utf8');
const PACK = JSON.parse(PACK_TEXT).house as { name: string; dishes: Array<{ id: string; name: string; section: string }> };
const LEVELS = JSON.parse(readFileSync(join(HERE, '../src/lib/data/levels.json'), 'utf8')) as { levels: Array<{ level: number; name: string }> };
const NAMES = LEVELS.levels.map((l) => l.name);
const DECK = JSON.parse(readFileSync(join(HERE, '../src/lib/data/floor-deck.json'), 'utf8')) as {
	cards: Array<{ id: string; term: string; section: string; level: number }>;
	sections: Array<{ key: string; title: string; count: number }>;
};
const HUSSARDE = 'd-1q0xk7jv';
const SHOTS = process.env.CONS_SHOTS ?? '';

/** The shallow states the two hubs keep in their entries (src/app.d.ts App.PageState). */
type Q = { kind: 'house' | 'deck' | 'lexicon' | 'cuisine'; ref: string; options: string[]; answer: string; card?: string };
type Hub = { qq?: { qs: Q[]; i: number; chosen: Array<string | null> }; fc?: { refs?: string[] } };

test.use({ viewport: { width: 390, height: 844 } });

async function servePack(page: Page) {
	await page.route('**/shared/packs/brennans-new-orleans.v1.oothouse.json', (route) =>
		route.fulfill({ status: 200, contentType: 'application/json', body: PACK_TEXT })
	);
}

test.beforeEach(async ({ page }) => {
	await servePack(page);
});

const backBtn = (page: Page) => page.locator('.backline button.back');
const heading = (page: Page) => page.locator('main h1').first();
const histLen = (page: Page) => page.evaluate(() => history.length);
const scrollY = (page: Page) => page.evaluate(() => Math.round(window.scrollY));

async function back(page: Page, how: 'button' | 'gesture' = 'button') {
	if (how === 'button') await backBtn(page).click();
	else await page.goBack();
}

/**
 * A tab, tapped the way a thumb taps it. Playwright's own click scrolls a
 * target into view first, and on the sticky bar that measured as a jump to
 * the top of the page before the tap, which no phone does; a dispatched
 * click is the tap without the jump, so "scroll kept" measures the app.
 */
async function tab(page: Page, name: string) {
	await page.locator('nav.modebar .modetab', { hasText: name }).dispatchEvent('click');
}

/**
 * The quick quiz's start on the Practise root: the link in its own group
 * (Due today draws a link of the same name when nothing is due, so the
 * group names which one), to /quizzes?quick=1, a push whose Back is Practise.
 */
const quickStart = (page: Page) => page.locator('section[aria-labelledby="fc-quick"]').getByRole('link', { name: 'Start the quick quiz' });

async function scrollTo(page: Page, y: number) {
	await page.evaluate((v) => window.scrollTo(0, v), y);
	await page.waitForTimeout(150);
	return scrollY(page);
}

async function expectScroll(page: Page, y: number) {
	await expect.poll(() => scrollY(page), { timeout: 5000 }).toBeGreaterThanOrEqual(y - 4);
	await expect.poll(() => scrollY(page), { timeout: 5000 }).toBeLessThanOrEqual(y + 4);
}

/** Home, with the house read and the levels painted. */
async function home(page: Page) {
	await goto(page, '/');
	await expect(page.locator('a.level[aria-current="step"]')).toBeVisible({ timeout: 15_000 });
}

/** The level page of the nth card, with Today's study counted. */
async function openLevel(page: Page, nth: number) {
	await page.locator('a.level').nth(nth).click();
	await expect(heading(page)).toHaveText(NAMES[nth]);
	await expect(page.locator('[data-door="due"] .door-line')).not.toHaveText(/Reading/, { timeout: 15_000 });
}

/** Open a menu disclosure through its summary, without adding a route or losing the full menu. */
async function openMenuSection(page: Page, name = PACK.dishes.find(dish => dish.id === HUSSARDE)!.section) {
	const group = page.locator(`.study details.menu-group[data-section=${JSON.stringify(name)}]`);
	await expect(group.locator(':scope > summary')).toBeVisible({ timeout: 15_000 });
	if (!(await group.evaluate((element: HTMLDetailsElement) => element.open))) {
		await group.locator(':scope > summary').click();
	}
	await expect(group.locator('.row').first()).toBeVisible();
	return group;
}

/** The Library's video shelf is intentionally closed until the reader asks for it. */
async function openLibraryVideos(page: Page) {
	const shelf = page.locator('details.video-shelf');
	await expect(shelf.locator(':scope > summary')).toBeVisible({ timeout: 15_000 });
	if (!(await shelf.evaluate((element: HTMLDetailsElement) => element.open))) {
		await shelf.locator(':scope > summary').click();
	}
	await expect(shelf.locator('.vgroup').first()).toBeVisible();
}

/** The quick quiz's round as its entry holds it. */
async function round(page: Page) {
	return page.evaluate(() => (history.state?.['sveltekit:states'] as Hub | undefined)?.qq ?? null);
}

/** Answer every question: the first one wrong on purpose, the rest right. */
async function answerAll(page: Page, wrong = 1) {
	await expect(page.locator('.opt').first()).toBeVisible({ timeout: 15_000 });
	const first = await round(page);
	expect(first, 'the round rides in its entry').not.toBeNull();
	const n = first!.qs.length;
	for (let i = 0; i < n; i++) {
		const qq = await round(page);
		const q = qq!.qs[qq!.i];
		const pick = i < wrong ? q.options.find((o) => o !== q.answer)! : q.answer;
		await page.getByRole('button', { name: pick, exact: true }).click();
		await page.getByRole('button', { name: i + 1 >= n ? 'See what you missed' : 'Next question' }).click();
	}
	await expect(heading(page)).toHaveText('What you missed');
	return n;
}

async function shot(page: Page, name: string) {
	if (SHOTS) await page.screenshot({ path: `${SHOTS}cons-table-${name}.png` });
}

/* ------------------------------------------------------------------------ */

test('1. the flashcard chain steps back one screen at a time, by the button and by the gesture', async ({ page }) => {
	for (const how of ['button', 'gesture'] as const) {
		await home(page);
		await openLevel(page, 0);
		const levelY = await scrollTo(page, 300);
		await tab(page, 'Practise');
		await expect(heading(page)).toHaveText('Practise');
		await expect(page.locator('button.door', { hasText: 'The whole menu' })).toBeVisible({ timeout: 15_000 });
		// The whole menu is the first deck door, right under Due today and the
		// quick quiz; the house's other decks follow it.
		await expect(page.locator('button.door').first()).toHaveText(/The whole menu/);
		await expect(page.locator('button.door').nth(8)).toBeVisible();
		// Scrolled so The whole menu stands 400 px down the glass and the tap
		// needs no scroll of Playwright's own: measured from the door itself,
		// so wherever the root's groups put it the click scrolls nothing, and
		// the page keeps the scroll the test measured, not one of Playwright's.
		const whole = page.locator('button.door', { hasText: 'The whole menu' });
		const wholeY = await whole.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
		const pickerY = await scrollTo(page, Math.max(0, Math.round(wholeY) - 400));
		await whole.click();
		await expect(heading(page)).toHaveText('The whole menu');
		await page.getByRole('button', { name: 'Start', exact: true }).click();
		await expect(page.locator('.deckframe .where')).toHaveText(/^Card 1 of \d+ · The whole menu$/);
		await page.getByRole('button', { name: 'Flip', exact: true }).click();
		await page.getByRole('button', { name: 'Got it', exact: true }).click();
		await expect(page.locator('.deckframe .where')).toHaveText(/^Card 2 of /);

		await back(page, how);
		await expect(heading(page)).toHaveText('The whole menu');
		await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
		await back(page, how);
		await expect(heading(page)).toHaveText('Practise');
		await expectScroll(page, pickerY);
		await expect(page.locator('.scope')).toContainText('show all levels');
		await back(page, how);
		await expect(heading(page)).toHaveText(NAMES[0]);
		await expectScroll(page, levelY);
		await back(page, how);
		await expect(page.locator('a.level')).toHaveCount(4);
		await expect(backBtn(page)).toHaveCount(0);
	}
});

test('2. the study chain: the list comes back where it was, with the focus on the row that opened the card', async ({ page }) => {
	await home(page);
	await openLevel(page, 0);
	await page.locator('[data-door="house"]').click();
	const group = await openMenuSection(page);
	const opener = group.locator('.row').nth(3);
	// Place an actual row from the open disclosure below the sticky bars.
	// A closed tasting can still report layout geometry; it is not an opener.
	const top = await opener.evaluate(element => element.getBoundingClientRect().top + window.scrollY);
	const y = await scrollTo(page, Math.max(0, Math.round(top) - 450));
	expect(y).toBeGreaterThan(0);
	await opener.click();
	await expect(page.locator('article.card #card-h')).toBeVisible();
	await page.locator('article.card .backline').getByRole('button', { name: /^Next/ }).click();
	await page.locator('article.card .backline').getByRole('button', { name: /^Next/ }).click();

	await back(page);
	await expect(group).toHaveJSProperty('open', true);
	await expect(opener).toBeVisible();
	await expectScroll(page, y);
	await expect(opener).toBeFocused();
	await back(page);
	await expect(heading(page)).toHaveText(NAMES[0]);
	await back(page);
	await expect(page.locator('a.level')).toHaveCount(4);
});

test('3. the quiz chain: the results survive a trip to a card, and Back from them is Practise', async ({ page }) => {
	for (const from of ['quizzes', 'level'] as const) {
		await home(page);
		if (from === 'quizzes') {
			await tab(page, 'Practise');
			await expect(heading(page)).toHaveText('Practise');
			await quickStart(page).click();
		} else {
			await openLevel(page, 1);
			await page.locator('[data-door="quick"]').click();
		}
		// Question one at once: no picker between the tap and the round.
		await expect(heading(page)).toHaveText('Quick quiz');
		await expect(page.locator('.where')).toHaveText(/^Question 1 of /);
		const before = await histLen(page);
		await answerAll(page);
		expect(await histLen(page), 'ten questions and the results are one entry').toBe(before);
		const misses = await page.locator('.miss').allTextContents();
		expect(misses.length).toBeGreaterThan(0);
		const study = page.locator('.miss a', { hasText: /Study this card|Read about it/ }).first();
		await expect(study).toBeVisible();
		await study.click();
		await expect(page).not.toHaveURL(/\/quizzes/);
		await expect(heading(page)).not.toHaveText('What you missed');
		await back(page);
		await expect(heading(page)).toHaveText('What you missed');
		expect(await page.locator('.miss').allTextContents()).toEqual(misses);
		await back(page, 'gesture');
		await expect(heading(page)).toHaveText(from === 'quizzes' ? 'Practise' : NAMES[1]);
		await back(page);
		await expect(page.locator('a.level')).toHaveCount(4);
	}
});

test('3b. Study the misses deals exactly the missed items that have cards, of every engine in the round', async ({ page }) => {
	await home(page);
	await tab(page, 'Practise');
	await quickStart(page).click();
	await answerAll(page, 3);
	const qq = (await round(page))!;
	const missed = qq.qs.filter((q, i) => qq.chosen[i] !== q.answer);
	/* A missed Cuisine question goes back as the card it teaches (since 12 Oct 2026). */
	const want = missed.map((q) => (q.kind === 'house' ? `h:${q.ref}` : q.kind === 'deck' ? `c:${q.ref}` : q.kind === 'cuisine' ? `z:${q.card}` : `t:${q.ref}`));
	await page.getByRole('link', { name: 'Study the misses' }).click();
	await expect(page.locator('.deckframe .where')).toHaveText(new RegExp(`^Card 1 of ${new Set(want).size} · The misses$`));
	const fc = await page.evaluate(() => (history.state?.['sveltekit:states'] as Hub | undefined)?.fc ?? null);
	expect(new Set(fc!.refs)).toEqual(new Set(want));
	await back(page);
	await expect(heading(page)).toHaveText('What you missed');
});

test('4. the More chain', async ({ page }) => {
	await home(page);
	await tab(page, 'More');
	await expect(heading(page)).toHaveText('More');
	await expect(page.locator('.modetab.on')).toHaveText('More');
	await page.locator('a.door', { hasText: 'Cost this menu' }).click();
	await expect(heading(page)).toHaveText('The Costing Sheet');
	await expect(page.locator('.modetab.on')).toHaveText('More');
	await back(page);
	await expect(heading(page)).toHaveText('More');
	await back(page);
	await expect(page.locator('a.level')).toHaveCount(4);
});

test('5. the Library chain keeps its scroll', async ({ page }) => {
	await home(page);
	await tab(page, 'Library');
	await expect(heading(page)).toHaveText('Library');
	await expect(page.locator('details.video-shelf > summary')).toBeVisible({ timeout: 15_000 });
	const shelf = page.locator('a.door', { hasText: 'The Plates' });
	await shelf.scrollIntoViewIfNeeded();
	const y = await scrollY(page);
	expect(y).toBeGreaterThan(300);
	await shelf.click();
	await expect(heading(page)).toHaveText(/Plates/);
	await page.locator('main a[href*="/plates/"]').first().click();
	await expect(page).toHaveURL(/\/plates\/[a-z0-9-]+$/);
	await back(page);
	await expect(page).toHaveURL(/\/plates$/);
	await back(page);
	await expect(heading(page)).toHaveText('Library');
	await expectScroll(page, y);
	await back(page);
	await expect(page.locator('a.level')).toHaveCount(4);
});

test('6. a cold deep link walks up to Home, replacing as it goes', async ({ page }) => {
	// /recipes is the heaviest page in the app (every card in one grid), and under
	// four workers it is the one the suite's known Library timeouts sit on.
	test.setTimeout(150_000);
	await goto(page, '/recipe/cacio-e-pepe');
	const len = await histLen(page);
	await back(page);
	await expect(page).toHaveURL(/\/recipes$/);
	// The grid is the heaviest page in the app: let it draw before the next press.
	await expect(heading(page)).toHaveText('All recipes');
	await expect(page.locator('.card').first()).toBeVisible({ timeout: 60_000 });
	await back(page);
	await expect(heading(page)).toHaveText('Library');
	await back(page);
	await expect(page.locator('a.level')).toHaveCount(4);
	expect(await histLen(page), 'every press was a replace').toBe(len);
});

test('7. the depth survives a reload', async ({ page }) => {
	await home(page);
	await tab(page, 'Practise');
	await page.locator('button.door', { hasText: 'The whole menu' }).click();
	await expect(heading(page)).toHaveText('The whole menu');
	await page.reload();
	await page.waitForSelector('html[data-hydrated]');
	await expect(heading(page)).toHaveText('The whole menu', { timeout: 15_000 });
	await back(page);
	await expect(heading(page)).toHaveText('Practise');
	await back(page);
	await expect(page.locator('a.level')).toHaveCount(4);
});

test('7b. a reload during a run or the quick quiz falls to its parent, and the next Back is a new screen', async ({ page }) => {
	// A deck's run: reload, the deck screen, then Practise in one press.
	await home(page);
	await tab(page, 'Practise');
	await page.locator('button.door', { hasText: 'Desserts' }).click();
	await expect(heading(page)).toHaveText('Desserts');
	await page.getByRole('button', { name: 'Start', exact: true }).click();
	await expect(page.locator('.deckframe .where')).toHaveText(/^Card 1 of \d+ · Desserts$/);
	await page.reload();
	await page.waitForSelector('html[data-hydrated]');
	await expect(page).not.toHaveURL(/run=1/);
	await expect(heading(page)).toHaveText('Desserts', { timeout: 15_000 });
	await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
	await back(page);
	await expect(heading(page)).toHaveText('Practise');
	await back(page);
	await expect(page.locator('a.level')).toHaveCount(4);

	// Today's cards: reload, Practise, then Home in one press.
	await tab(page, 'Practise');
	await page.getByRole('button', { name: "Start today's cards" }).click();
	await expect(page.locator('.deckframe .where')).toHaveText(/^Card 1 of \d+ · Due today$/);
	await page.reload();
	await page.waitForSelector('html[data-hydrated]');
	await expect(page).not.toHaveURL(/run=1/);
	await expect(page.getByRole('button', { name: "Start today's cards" })).toBeVisible({ timeout: 15_000 });
	await expect(heading(page)).toHaveText('Practise');
	await back(page);
	await expect(page.locator('a.level')).toHaveCount(4);

	// The quick quiz: reload, Practise, then Home in one press.
	await tab(page, 'Practise');
	await quickStart(page).click();
	await expect(page.locator('.where')).toHaveText(/^Question 1 of /);
	await page.reload();
	await page.waitForSelector('html[data-hydrated]');
	await expect(page).not.toHaveURL(/quick=1/);
	await expect(quickStart(page)).toBeVisible({ timeout: 15_000 });
	await expect(heading(page)).toHaveText('Practise');
	await back(page);
	await expect(page.locator('a.level')).toHaveCount(4);
});

test('7c. the lit tab on its root scrolls to the top and adds nothing, so Back never leaves the app', async ({ page }) => {
	await page.goto('about:blank');
	await goto(page, '/flashcards');
	await expect(page.locator('button.door').first()).toBeVisible({ timeout: 15_000 });
	const len = await histLen(page);
	await scrollTo(page, 600);
	await tab(page, 'Practise');
	await expect.poll(() => scrollY(page)).toBe(0);
	expect(await histLen(page)).toBe(len);
	await back(page);
	await expect(page.locator('a.level')).toHaveCount(4);
	await expect(page).not.toHaveURL('about:blank');
	// Home tapped on Home: nothing added either.
	const atHome = await histLen(page);
	await tab(page, 'Home');
	await tab(page, 'Home');
	await page.waitForTimeout(300);
	expect(await histLen(page)).toBe(atHome);
	// Library, cold, the same.
	await page.goto('about:blank');
	await goto(page, '/library');
	await tab(page, 'Library');
	await page.waitForTimeout(300);
	await back(page);
	await expect(page.locator('a.level')).toHaveCount(4);
});

test('7d. a fresh arrival at the address recorded last starts at the bottom of the app', async ({ page }) => {
	await home(page);
	await openLevel(page, 1);
	await page.goto('about:blank');
	await goto(page, '/level/2');
	await expect(heading(page)).toHaveText(NAMES[1]);
	await back(page);
	await expect(page.locator('a.level')).toHaveCount(4);
	await expect(page).not.toHaveURL('about:blank');
});

test('7e. the Lexicon quiz lights Practise and More\'s drawers light More, and Back goes to the tab that opened them', async ({ page }) => {
	await page.goto('about:blank');
	await goto(page, '/lexicon?start=quiz');
	await expect(page.locator('.modetab.on')).toHaveText(/^Practise/);
	await expect(page.locator('.quizdef')).toBeVisible({ timeout: 15_000 });
	await back(page);
	await expect(heading(page)).toHaveText('Practise');
	for (const name of ['Plan a menu from the Library', 'Back up, restore and print', "The Maître d'"]) {
		await home(page);
		await tab(page, 'More');
		await page.locator('a.door', { hasText: name }).click();
		await expect(page).toHaveURL(/\/menu/);
		await page.waitForTimeout(500);
		await expect(page.locator('.modetab.on'), name).toHaveText('More');
		// The drawer it opened is on the screen, not below the first one.
		if (!name.startsWith('The Ma')) await expect(page.locator('details.drawer[open]').first(), name).toBeInViewport();
		await page.keyboard.press('Escape');
		await back(page);
		await expect(heading(page), name).toHaveText('More');
	}
	// Cold, the drawer's Back is More too, after the hash has gone.
	await page.goto('about:blank');
	await goto(page, '/menu#plan');
	await expect(page.locator('.modetab.on')).toHaveText('More');
	await page.waitForTimeout(800);
	await back(page);
	await expect(heading(page)).toHaveText('More');
});

test('7f. the whole Lexicon deck holds every term', async ({ page }) => {
	const n = (JSON.parse(readFileSync(join(HERE, '../src/lib/data/lexicon.json'), 'utf8')) as unknown[]).length;
	await home(page);
	await tab(page, 'Practise');
	await page.getByRole('button', { name: 'show all levels' }).click();
	await expect(page.locator('button.door', { hasText: 'The whole Lexicon' }).locator('.door-line')).toHaveText(new RegExp(`^${n} cards · `), { timeout: 15_000 });
});

const OLD: Array<{ path: string; lands: RegExp | string; parent: RegExp | string; card?: boolean }> = [
	{ path: '/level', lands: NAMES[0], parent: 'home' },
	{ path: '/level/2', lands: NAMES[1], parent: 'home' },
	// The house's page is the Brennan's tab's root (17 Oct 2026): its h1 is the
	// house's name and its parent Home, whatever the level chosen; a card over
	// it closes to the page, and a section's list or the desk's anchor walk to Home.
	{ path: '/menu', lands: PACK.name, parent: 'home' },
	{ path: `/menu#${HUSSARDE}`, lands: PACK.name, parent: PACK.name },
	{ path: '/menu#desk', lands: PACK.name, parent: 'home' },
	{ path: '/menu?section=Starters', lands: PACK.name, parent: 'home' },
	{ path: '/menu/quiz?mode=cards', lands: 'card', parent: 'The whole menu', card: true },
	{ path: `/service/deck/study?card=${DECK.cards[0].id}`, lands: 'card', parent: DECK.sections.find((s) => s.key === DECK.cards[0].section)!.title, card: true },
	{ path: '/service/deck', lands: /Floor Deck/, parent: 'Practise' },
	{ path: '/lexicon?level=1&start=flash', lands: 'card', parent: `The Lexicon at ${NAMES[0]}`, card: true },
	{ path: '/repertoire', lands: /Repertoire/, parent: 'More' },
	{ path: '/practise/firing', lands: /firing/i, parent: 'Practise' }
];

test('8. old addresses land, each with a Back whose first press is its parent', async ({ page }) => {
	test.setTimeout(150_000);
	for (const o of OLD) {
		// A cold load each time: from /menu, a goto to /menu#desk would be a
		// same-document hash change, not an old address arriving.
		await page.goto('about:blank');
		await goto(page, o.path);
		if (o.card) await expect(page.locator('.deckframe .where'), o.path).toBeVisible({ timeout: 15_000 });
		else await expect(heading(page), o.path).toHaveText(o.lands, { timeout: 15_000 });
		if (o.path.includes('section=')) await expect(page.getByRole('button', { name: /^Starters \d+$/ })).toHaveAttribute('aria-pressed', 'true');
		if (o.path.includes('#d-')) await expect(page.locator('article.card #card-h')).toBeVisible({ timeout: 15_000 });
		await expect(backBtn(page), o.path).toHaveCount(1);
		await back(page);
		if (o.parent === 'home') await expect(page.locator('a.level'), o.path).toHaveCount(4);
		else if (o.parent === PACK.name) {
			await expect(page.locator('article.card'), o.path).toHaveCount(0);
			await expect(heading(page)).toHaveText(PACK.name);
		} else await expect(heading(page), o.path).toHaveText(o.parent);
	}
});

/* The Table's bar is five words since 17 Oct 2026: Home, Brennan's (the
   house's page, with Cuisine and the Fieldbook inside it), Practise (every
   deck and round) and Library, then the quiet More (the Ledger and the Codex
   keep four). The word is the pack's own spelling, with its curly apostrophe. */
test('9. four tab words and a quiet More, one row at 390 and 375, every target 44 px, the lit one marked', async ({ page }) => {
	/* Ten page loads (five screens at two widths): more than the default
	   thirty seconds allows once the suite runs four workers. */
	test.setTimeout(90_000);
	for (const [path, lit] of [
		['/menu', PACK.name],
		['/flashcards', 'Practise'],
		['/library', 'Library'],
		['/more', 'More'],
		['/', 'Home']
	] as const) {
		for (const width of [390, 375]) {
			await page.setViewportSize({ width, height: 844 });
			await goto(page, path);
			const tabs = page.locator('nav.modebar .modetab');
			const words = (await tabs.allTextContents()).map((t) => t.replace(/\d+\s*due$/, '').trim());
			expect(words).toEqual(['Home', PACK.name, 'Practise', 'Library', 'More']);
			const boxes = await tabs.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ y: Math.round(r.top), w: r.width, h: r.height, right: r.right })));
			expect(Math.max(...boxes.map((b) => b.y)) - Math.min(...boxes.map((b) => b.y)), `one row at ${width} on ${path}`).toBeLessThan(8);
			for (const b of boxes) expect(b.w >= 44 && b.h >= 44, 'every tab at least 44 by 44').toBe(true);
			expect(Math.max(...boxes.map((b) => b.right))).toBeLessThanOrEqual(width);
			await expect(page.locator('.modetab[aria-current="page"]')).toHaveText(new RegExp(`^${lit}`));
		}
		// More is drawn quiet: its style differs from an unlit tab's, and it is lit only on a More screen.
		const styles = await page.locator('nav.modebar .modetab').evaluateAll((els) =>
			els.map((e) => {
				const c = getComputedStyle(e);
				return { cur: e.getAttribute('aria-current'), border: c.borderTopWidth + c.borderTopStyle + c.borderLeftWidth };
			})
		);
		const more = styles[4];
		const unlit = styles.slice(0, 4).find((s) => !s.cur)!;
		expect(more.border).not.toBe(unlit.border);
		expect(more.cur === 'page').toBe(lit === 'More');
	}
	await page.setViewportSize({ width: 390, height: 844 });
});

/** Every screen in the map, with the first slug of each dynamic route (design 7.1, test 10). */
const SCREENS = [
	'/flashcards', '/quizzes', '/library', '/more', '/level/1', '/level/1/read', '/level/1/test', '/menu',
	'/menu?view=learn', '/menu?view=rehearse', '/menu?view=reference',
	'/menu/costing', '/menu/guest', '/menu/prep-board', '/menu/preps', '/menu/producers', '/menu/quiz', '/menu/waste',
	'/repertoire', '/coverage', '/practise/firing', '/practise/calibrate',
	'/service', '/service/knife-work', '/service/deck', '/service/deck/test', '/service/deck/say', '/service/deck/lineup', '/service/drill',
	'/recipes', '/recipe/cacio-e-pepe', '/chapter/italian', '/family', '/lexicon', '/pantry', '/technique', '/technique/braising',
	'/plates', '/palate', '/safety', '/study',
	'/cuisine', '/cuisine?ch=mother-sauces', '/cuisine?ch=mother-sauces&e=hollandaise', '/cuisine?deck=all', '/cuisine?view=tree', '/cuisine?view=ladder'
];

test('10. one Back on every screen but Home, clear of the badge at rest and when scrolled', async ({ page }) => {
	test.setTimeout(240_000);
	const badge = { x1: 10, y1: 10, x2: 54, y2: 54 };
	const hits = (r: { x: number; y: number; width: number; height: number }) =>
		r.x < badge.x2 && r.x + r.width > badge.x1 && r.y < badge.y2 && r.y + r.height > badge.y1;
	for (const path of SCREENS) {
		await goto(page, path);
		const btn = page.getByRole('button', { name: 'Back', exact: true });
		await expect(btn, path).toHaveCount(1);
		let r = (await btn.boundingBox())!;
		expect(r.width >= 44 && r.height >= 44, `${path}: Back is 44 by 44`).toBe(true);
		expect(hits(r), `${path}: Back clear of the badge at scroll 0`).toBe(false);
		/* Scrolled on the page as drawn, not as it was while its data was still
		   coming: under four busy workers a page measured short (12 Oct 2026:
		   /menu/costing before the house had loaded) left the scroll a few
		   pixels short of where the row sticks and moves clear of the badge,
		   and the content that arrived after never moved it. So the scroll is
		   made again until the page has settled, and the assertions below hold
		   the settled page to the same rule. */
		await expect
			.poll(
				async () => {
					await page.evaluate(() => window.scrollTo(0, Math.min(2000, document.documentElement.scrollHeight)));
					await page.waitForTimeout(200);
					return hits((await btn.boundingBox())!);
				},
				{ message: `${path}: Back clear of the badge once scrolled`, timeout: 10_000 }
			)
			.toBe(false);
		r = (await btn.boundingBox())!;
		expect(r.y >= 0 && r.y + r.height <= 844, `${path}: Back still in view when scrolled`).toBe(true);
		expect(hits(r), `${path}: Back clear of the badge when scrolled`).toBe(false);
		// and nothing else stuck under the bar sits over it
		const top = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.textContent?.trim() ?? '', { x: r.x + r.width / 2, y: r.y + r.height / 2 });
		expect(top, `${path}: Back is the thing under a thumb when scrolled`).toBe('Back');
		const backTo = await page.evaluate(() =>
			[...document.querySelectorAll('main *')].filter((e) => e.children.length === 0 && /^\s*Back to\b/.test(e.textContent ?? '') && (e as HTMLElement).offsetParent !== null).map((e) => e.textContent)
		);
		expect(backTo, `${path}: no text begins "Back to"`).toEqual([]);
	}
	await goto(page, '/');
	await expect(page.getByRole('button', { name: 'Back', exact: true })).toHaveCount(0);
});

test('11. the scope chip: show all is in the address and survives Back; choosing a level moves Home', async ({ page }) => {
	await home(page);
	await tab(page, 'Practise');
	const scope = page.locator('.scope');
	await expect(scope).toContainText(`${NAMES[0]}`);
	await expect(scope).toContainText('show all levels');
	await page.getByRole('button', { name: 'show all levels' }).click();
	await expect(page).toHaveURL(/\/flashcards\?all=1$/);
	await expect(page.locator('#fc-level')).toHaveText('Every level');
	await page.locator('button.door', { hasText: 'The whole Lexicon' }).click();
	await expect(heading(page)).toHaveText('The whole Lexicon');
	await back(page);
	await expect(page.locator('#fc-level')).toHaveText('Every level');
	await page.getByRole('button', { name: `show ${NAMES[0]} only` }).click();
	await page.getByRole('button', { name: `${NAMES[0]}, change level` }).click();
	await page.getByRole('button', { name: NAMES[2], exact: true }).click();
	await expect(page.locator('#fc-level')).toHaveText(NAMES[2]);
	await tab(page, 'Home');
	await expect(page.locator('a.level.on .lv-name')).toHaveText(NAMES[2]);
	await expect(page.locator('a.level.on')).toHaveAttribute('aria-current', 'step');
});

test('12. Home keeps four level cards with a direct daily-study door and guide', async ({ page }) => {
	await home(page);
	const focusable = await page.locator('main .home').evaluate((el) =>
		[...el.querySelectorAll('a, button, input, select, textarea, [tabindex]')].map((e) => e.className)
	);
	expect(focusable).toHaveLength(6);
	await expect(page.locator('main .home a.level')).toHaveCount(4);
	await expect(page.locator('main .home a.level')).toHaveText(NAMES);
	await expect(page.getByRole('link', { name: /Today's study/ })).toHaveAttribute('href', /\/level\/1#today$/);
	await expect(page.getByRole('link', { name: 'How to use the Table' })).toHaveAttribute('href', '/more#learning');
	await expect(page.locator('main h2, main h3')).toHaveCount(0);
});

test('13. words, never glyphs, and nothing smaller than 15 px or cut with an ellipsis on the new screens', async ({ page }) => {
	/* Six screens with a settling pause each, Cuisine's among them since 12 Oct
	   2026: about 15 seconds alone, past the default thirty once the suite runs
	   four workers beside the axe runs. */
	test.setTimeout(90_000);
	for (const path of ['/level/1', '/flashcards', '/quizzes', '/library', '/cuisine', '/more']) {
		await goto(page, path);
		await page.waitForTimeout(1500);
		const bad = await page.evaluate(() => {
			const out: string[] = [];
			const scope = document.querySelector('main .hub');
			if (!scope) return ['no .hub'];
			for (const el of scope.querySelectorAll<HTMLElement>('*')) {
				if (el.closest('.house, details:not([open]), .vh, .vh-h')) continue;
				const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
				if (!own || el.offsetParent === null) continue;
				const cs = getComputedStyle(el);
				if (parseFloat(cs.fontSize) < 15) out.push(`${el.tagName}.${el.className} ${cs.fontSize}: ${el.textContent!.trim().slice(0, 30)}`);
				if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth) out.push(`clipped: ${el.textContent!.trim().slice(0, 30)}`);
				if (/[\u{1F300}-\u{1FAFF}☀-➿←-⇿■-◿]/u.test(el.textContent ?? '')) out.push(`glyph: ${el.textContent!.trim().slice(0, 30)}`);
			}
			return out;
		});
		expect(bad, path).toEqual([]);
	}
	// Every pressed state has its word.
	await goto(page, '/flashcards');
	await page.getByRole('button', { name: `${NAMES[0]}, change level` }).click();
	await expect(page.locator('.scopelist [aria-pressed="true"]')).toContainText('Your level');
});

test('14. offline: the flashcard and quiz chains still run', async ({ page, context }) => {
	test.setTimeout(120_000);
	await home(page);
	await page.evaluate(async () => {
		await navigator.serviceWorker.ready;
		if (!navigator.serviceWorker.controller) {
			await new Promise<void>((resolve) => {
				navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
				if (navigator.serviceWorker.controller) resolve();
			});
		}
	});
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
	await goto(page, '/');
	await openLevel(page, 0);
	await tab(page, 'Practise');
	await page.locator('button.door', { hasText: 'The whole menu' }).click();
	await page.getByRole('button', { name: 'Start', exact: true }).click();
	await page.getByRole('button', { name: 'Flip', exact: true }).click();
	await page.getByRole('button', { name: 'Got it', exact: true }).click();
	await back(page);
	await back(page);
	await expect(heading(page)).toHaveText('Practise');
	await tab(page, 'Practise');
	await quickStart(page).click();
	await answerAll(page);
	await back(page);
	await expect(heading(page)).toHaveText('Practise');
	await context.setOffline(false);
});

test('15. Escape closes the level list and the address stays', async ({ page }) => {
	await goto(page, '/quizzes');
	const url = page.url();
	await page.getByRole('button', { name: `${NAMES[0]}, change level` }).click();
	await expect(page.locator('.scopelist')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.locator('.scopelist')).toHaveCount(0);
	expect(page.url()).toBe(url);
});

test("16. Brennan's: the level door leads to its menu, cards, bottle tiers and the Library's video shelf", async ({ page }) => {
	await home(page);
	await openLevel(page, 0);
	await expect(page.locator('.countline')).toContainText(PACK.name, { timeout: 15_000 });
	// One lead door, named by the house, into its own page (17 Oct 2026).
	const door = page.locator('[data-door="house"]');
	await expect(door.locator('.door-name')).toHaveText(PACK.name);
	await expect(page.locator('[data-door="menu-cards"], [data-door="study"], [data-door="fall-menu"]')).toHaveCount(0);
	await door.click();
	await expect(heading(page)).toHaveText(PACK.name);
	await expect(page.locator('nav.house-sections')).toBeVisible({ timeout: 15_000 });
	// Its cards: the menu's own practice action, one tap on the house's page.
	await page.locator('.study .studyhead').getByRole('button', { name: 'Menu flashcards', exact: true }).click();
	await expect(page.locator('.deckframe .where')).toHaveText(/^Card 1 of \d+ · The whole menu$/);
	await back(page);
	await expect(heading(page)).toHaveText(PACK.name);
	await page.getByRole('button', { name: /^Entrées \d+$/ }).click();
	await page.locator('.study .row', { has: page.locator('.nm', { hasText: 'Eggs Hussarde' }) }).click();
	await expect(page.locator('article.card dl.bottles > div').first()).toBeVisible();
	await back(page);
	await expect(page.locator('article.card')).toHaveCount(0);
	await back(page);
	await expect(heading(page)).toHaveText(NAMES[0]);
	await tab(page, 'Library');
	await openLibraryVideos(page);
	await expect(page.locator('.vgroup li').first()).toBeVisible({ timeout: 15_000 });
});

test("17. the owner's morning, end to end", async ({ page }) => {
	await home(page);
	await shot(page, 'home');
	await openLevel(page, 1);
	await shot(page, 'level');
	const y = await scrollY(page);
	await page.locator('[data-door="due"]').click();
	await expect(page.locator('.deckframe .where')).toHaveText(/^Card 1 of \d+ · Due today$/);
	await page.getByRole('button', { name: 'Flip', exact: true }).click();
	await page.getByRole('button', { name: 'Again', exact: true }).click();
	await back(page);
	await expect(heading(page)).toHaveText(NAMES[1]);
	await expectScroll(page, y);
	await page.locator('[data-door="quick"]').click();
	await answerAll(page);
	const misses = await page.locator('.miss').allTextContents();
	await page.locator('.miss a', { hasText: /Study this card|Read about it/ }).first().click();
	await expect(page).not.toHaveURL(/\/quizzes/);
	await expect(heading(page)).not.toHaveText('What you missed');
	await back(page);
	await expect(heading(page)).toHaveText('What you missed');
	expect(await page.locator('.miss').allTextContents()).toEqual(misses);
	await back(page);
	await expect(heading(page)).toHaveText(NAMES[1]);
	await page.locator('[data-door="house"]').click();
	await openMenuSection(page);
	await page.locator('.study .row', { has: page.locator('.nm', { hasText: 'Eggs Hussarde' }) }).click();
	const card = page.locator('article.card');
	await expect(card.locator('dl.bottles > div').first()).toBeVisible();
	/* The card's own Watch block: the component disclosures hold video lists too, closed until opened. */
	await expect(card.locator('section[aria-labelledby="watch-h"] .videos li').first()).toBeVisible();
	/* Go deeper (17 Oct 2026): the dish's entries in Cuisine, once the index chunk is in. */
	await expect(card.locator('#deeper-h')).toHaveText('Go deeper', { timeout: 15_000 });
	await expect(card.locator('section[aria-labelledby="deeper-h"] a[href="/cuisine?ch=mother-sauces&e=hollandaise"]')).toHaveCount(1);
	await back(page);
	await expect(heading(page)).toHaveText(PACK.name);
	await expect(page.locator('#study-h')).toHaveText('The menu');
	await back(page);
	await expect(heading(page)).toHaveText(NAMES[1]);
	await back(page);
	await expect(page.locator('a.level')).toHaveCount(4);
	await expect(backBtn(page)).toHaveCount(0);
});

test('18. changes within a screen add no history; a round is one entry', async ({ page }) => {
	await home(page);
	await tab(page, 'Practise');
	await expect(page.locator('button.door').first()).toBeVisible({ timeout: 15_000 });
	let len = await histLen(page);
	await page.getByRole('button', { name: 'show all levels' }).click();
	await page.getByRole('button', { name: /^show .* only$/ }).click();
	expect(await histLen(page), 'show all and back').toBe(len);
	await page.locator('button.door', { hasText: 'The whole menu' }).click();
	len = await histLen(page);
	await page.locator('details.narrow summary').click();
	await page.locator('details.narrow summary').click();
	expect(await histLen(page), 'a disclosure').toBe(len);
	await page.getByRole('button', { name: 'Start', exact: true }).click();
	len = await histLen(page);
	for (let i = 0; i < 3; i++) {
		await page.getByRole('button', { name: 'Flip', exact: true }).click();
		await page.getByRole('button', { name: 'Got it', exact: true }).click();
	}
	expect(await histLen(page), 'flip and the next card').toBe(len);
	await tab(page, 'Library');
	await expect(heading(page)).toHaveText('Library');
	len = await histLen(page);
	await page.locator('details.chapters summary').click();
	expect(await histLen(page), 'the chapters disclosure').toBe(len);
	await goto(page, '/level/1');
	len = await histLen(page);
	await page.locator('#lv-q').fill('roux');
	expect(await histLen(page), 'typing in the search').toBe(len);
});

test('20. a study card is one entry and one Back closes it', async ({ page }) => {
	await goto(page, '/menu');
	const group = await openMenuSection(page);
	const len = await histLen(page);
	await group.locator('.row').first().click();
	await expect(page.locator('article.card')).toBeVisible();
	expect(await histLen(page)).toBe(len + 1);
	await back(page);
	await expect(page.locator('article.card')).toHaveCount(0);
	await expect(group).toHaveJSProperty('open', true);
	await expect(group.locator('.row').first()).toBeVisible();
});

test("21. Today's study's first row is on the first screen of every level page", async ({ page }) => {
	for (const n of [1, 2, 3, 4]) {
		await goto(page, `/level/${n}`);
		const r = (await page.locator('[data-door="due"]').boundingBox())!;
		expect(r.y + r.height, `level ${n}`).toBeLessThanOrEqual(844);
	}
});

test('22. one count: the pill, the level row and the Practise root agree, before and after a grade', async ({ page }) => {
	await home(page);
	await openLevel(page, 0);
	const read = async () => {
		const pill = Number(((await page.locator('.modetab .pill').textContent()) ?? '0').replace(/\D+/g, ''));
		return pill;
	};
	const figure = (s: string) => {
		const m = /^(\d+) (?:due and (\d+) new|new cards? to start|cards? due)/.exec(s);
		return m ? Number(m[1]) + Number(m[2] ?? 0) : 0;
	};
	const row1 = figure((await page.locator('[data-door="due"] .door-line').textContent()) ?? '');
	expect(row1).toBeGreaterThan(0);
	expect(await read()).toBe(row1);
	await tab(page, 'Practise');
	await expect(page.locator('.dueline')).toBeVisible({ timeout: 15_000 });
	expect(figure((await page.locator('.dueline').textContent()) ?? '')).toBe(row1);
	await page.getByRole('button', { name: "Start today's cards" }).click();
	await page.getByRole('button', { name: 'Flip', exact: true }).click();
	await page.getByRole('button', { name: 'Got it', exact: true }).click();
	await back(page);
	await expect(page.locator('.dueline')).toBeVisible();
	const root2 = figure((await page.locator('.dueline').textContent()) ?? '');
	expect(await read()).toBe(root2);
	await back(page);
	await expect(heading(page)).toHaveText(NAMES[0]);
	expect(figure((await page.locator('[data-door="due"] .door-line').textContent()) ?? '')).toBe(root2);
});

test('23. the first morning is not empty: Due today deals new cards, the house first', async ({ page }) => {
	await home(page);
	await openLevel(page, 0);
	await expect(page.locator('[data-door="due"] .door-line')).toHaveText(/new/);
	await page.locator('[data-door="due"]').click();
	await expect(page.locator('.deckframe .where')).toHaveText(/ · Due today$/);
	const fc = await page.evaluate(() => (history.state?.['sveltekit:states'] as Hub | undefined)?.fc ?? null);
	expect(fc!.refs!.length).toBeGreaterThan(0);
	expect(fc!.refs![0]).toMatch(/^h:d-/);
	const first = PACK.dishes.find((d) => d.id === fc!.refs![0].slice(2))!;
	await expect(page.locator('.deckframe .facename')).toHaveText(first.name);
});

test('24. one card style: the old card addresses land on the one card screen, and nothing else draws Got it', async ({ page }) => {
	test.setTimeout(120_000);
	for (const o of OLD.filter((x) => x.card)) {
		await page.goto('about:blank');
		await goto(page, o.path);
		await expect(page.locator('.deckframe'), o.path).toBeVisible({ timeout: 15_000 });
		await back(page);
		await expect(heading(page), o.path).toHaveText(o.parent);
	}
	for (const path of ['/menu/quiz', '/menu/quiz?mode=drill', '/menu/quiz?mode=pair', '/lexicon', '/service/deck', '/level/1/test']) {
		await goto(page, path);
		await page.waitForTimeout(600);
		await expect(page.getByRole('button', { name: 'Got it', exact: true }), path).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Again', exact: true }), path).toHaveCount(0);
		// No second quiz picker inside Practise: /menu/quiz has no mode chips.
		await expect(page.getByRole('button', { name: /^(The dishes|Drill the (house|menu)|Flip cards|Pairings|Say it back|Guest at the table), (chosen|off)$/ }), path).toHaveCount(0);
	}
	// The study view's card buttons open the Practise decks.
	await goto(page, `/menu#${HUSSARDE}`);
	await page.locator('article.card').getByRole('button', { name: /Flash cards for this/ }).click();
	await expect(page).toHaveURL(/\/flashcards\?deck=item%3Ad-1q0xk7jv&run=1$/);
	await expect(page.locator('.deckframe .facename')).toHaveText('Eggs Hussarde');
	await back(page);
	await expect(page.locator('article.card #card-h')).toHaveText('Eggs Hussarde');
});

test('screens for the owner, at 390 by 844', async ({ page }) => {
	test.skip(!SHOTS, 'CONS_SHOTS names the folder');
	await home(page);
	await openLevel(page, 0);
	await tab(page, 'Practise');
	await expect(page.locator('button.door').first()).toBeVisible({ timeout: 15_000 });
	await shot(page, 'flashcards');
	await page.locator('button.door', { hasText: 'The whole menu' }).click();
	await shot(page, 'deck');
	await page.getByRole('button', { name: 'Start', exact: true }).click();
	await page.getByRole('button', { name: 'Flip', exact: true }).click();
	await shot(page, 'card');
	await tab(page, 'Practise');
	await shot(page, 'quizzes');
	await quickStart(page).click();
	await answerAll(page, 2);
	await shot(page, 'results');
	await tab(page, 'Library');
	await expect(page.locator('details.video-shelf > summary')).toBeVisible({ timeout: 15_000 });
	await shot(page, 'library');
	await tab(page, 'More');
	await shot(page, 'more');
	// The five-step chain, each step and each Back.
	await home(page);
	await openLevel(page, 1);
	await page.locator('[data-door="house"]').click();
	await openMenuSection(page);
	await page.locator('.study .row', { has: page.locator('.nm', { hasText: 'Eggs Hussarde' }) }).click();
	await page.locator('article.card').getByRole('button', { name: /Flash cards for this/ }).click();
	await page.getByRole('button', { name: 'Flip', exact: true }).click();
	await shot(page, 'chain-5-card');
	await back(page);
	await shot(page, 'chain-4-dish');
	await back(page);
	await shot(page, 'chain-3-list');
	await back(page);
	await shot(page, 'chain-2-level');
	await back(page);
	await shot(page, 'chain-1-home');
});

test('the Library opens on the World Atlas of Recipes, then the Lexicon (the owner, 5 Oct 2026)', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await goto(page, '/library');
	const names = page.locator('nav.shelves > .door .door-name, nav.shelves > details.door .door-name');
	await expect(names.nth(0)).toHaveText('The World Atlas of Recipes');
	await expect(names.nth(1)).toHaveText('The Lexicon');
});
