import { test, expect, type Locator, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto, seedHouses } from './helpers';

/**
 * Brennan's as its own tab (the owner's choice of 17 Oct 2026), walked in a
 * phone's Chromium at 390 by 844, with a 375 case for the bar. The shipped
 * Brennan's pack is served through page.route the way consolidation.spec.ts
 * serves it (the suite's server withholds packs), so a fresh device loads
 * the house itself and the word in the bar is the house's name.
 *
 * What is proved here, and nowhere else:
 *   - the word lights on the house's page, on Cuisine and on the Kitchen
 *     Fieldbook, and the page's h1 is the pack's name;
 *   - the bar's five words fit one row at 390 and 375, every tab 44 px, the
 *     boxes written out (BRENNANS_SHOTS names a folder) so the layout's CSS
 *     comment can carry measured figures, never estimates;
 *   - the four house sections are distinct, addressable views;
 *   - The cooking holds the lead door and the twelve chapter doors with the
 *     index's own hrefs; Your culinary terms the Fieldbook door and the nine
 *     subject chips;
 *   - the Fall 2026 section leads the chips with its eight current rows;
 *   - a dish named as the training sheet names it draws the sheet's field
 *     notes on its card; the Hussarde card draws Go deeper by chapter;
 *   - the Back chains: card to page to Home; entry to chapter to Cuisine to
 *     the house to Home; a Fieldbook term to its list to the house to Home;
 *     the lit word from a card returns to the bare root;
 *   - the Practise root's groups in order, and the quick quiz started there
 *     comes Back to Practise; the level page's one door, named by the house.
 *
 * Every figure, id and name is read from the built data at the time the spec
 * runs (the pack, Cuisine's index, the Fieldbook, the fall sheet), never
 * typed. The word is PACK.name, with the curly apostrophe the pack prints.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const PACK_TEXT = readFileSync(join(HERE, '../static/shared/packs/brennans-new-orleans.v1.oothouse.json'), 'utf8');
const PACK = JSON.parse(PACK_TEXT).house as {
	id: string;
	name: string;
	dishes: Array<{ id: string; name: string; section: string; meals?: string[]; lines: { value: { s10: string; s20: string; s45: string } } }>;
	meals?: Array<{ name: string }>;
};
const PACK_URL = '**/shared/packs/brennans-new-orleans.v1.oothouse.json';
const INDEX = JSON.parse(readFileSync(join(HERE, '../src/lib/data/cuisine/index.json'), 'utf8')) as {
	chapters: Array<{ key: string; title: string; file?: string; entries: number; cards: number }>;
	entries: Array<{ id: string; slug: string; chapter: string; title: string }>;
	byDish: Record<string, string[]>;
};
const FOUNDATIONS = JSON.parse(readFileSync(join(HERE, '../src/lib/data/culinary-foundations.json'), 'utf8')) as {
	categories: Array<{ id: string; title: string }>;
	entries: Array<{ id: string; term: string; category: string }>;
};
const FALL = JSON.parse(readFileSync(join(HERE, '../src/lib/data/fall-menu-2026.json'), 'utf8')) as {
	items: Array<{ id: string; kind: string; name: string; photoFile: string; listedIngredients: string[]; sheetDietaryNotes?: string[] }>;
};
const FIXTURE = JSON.parse(readFileSync(join(HERE, '../src/lib/house/fixtures/house-min.json'), 'utf8'));
const LEVELS = JSON.parse(readFileSync(join(HERE, '../src/lib/data/levels.json'), 'utf8')) as { levels: Array<{ level: number; name: string }> };
const NAMES = LEVELS.levels.map((l) => l.name);
const HUSSARDE = 'd-1q0xk7jv';
const HOLLANDAISE = INDEX.entries.find((e) => e.chapter === 'mother-sauces' && e.slug === 'hollandaise')!;
const FALL_SECTION = 'Fall 2026';
const FALL_IN_PACK = PACK.dishes.filter((d) => d.section === FALL_SECTION);
const WORDS = ['Home', PACK.name, 'Practise', 'Library', 'More'];
const SHOTS = process.env.BRENNANS_SHOTS ?? '';

test.use({ viewport: { width: 390, height: 844 } });

test.beforeEach(async ({ page }) => {
	await page.route(PACK_URL, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: PACK_TEXT }));
});

const heading = (page: Page) => page.locator('main h1').first();
const backBtn = (page: Page) => page.locator('.backline button.back');
const lit = (page: Page) => page.locator('nav.modebar .modetab[aria-current="page"]');
const houseSections = (page: Page) => page.locator('nav.house-sections');
const groups = (page: Page) => page.locator('.house-learning');
const card = (page: Page) => page.locator('article.card');
const histLen = (page: Page) => page.evaluate(() => history.length);

/** A tab tapped the way a thumb taps it (consolidation.spec.ts): no scroll of Playwright's own first. */
async function tab(page: Page, name: string) {
	await page.locator('nav.modebar .modetab', { hasText: name }).dispatchEvent('click');
}

/** The house's page, with the house read and its four learning views available. */
async function openHouse(page: Page) {
	await goto(page, '/menu');
	await expect(heading(page)).toHaveText(PACK.name, { timeout: 15_000 });
	await expect(houseSections(page)).toBeVisible({ timeout: 15_000 });
}

/** Reveal a destination through its real disclosure controls, outermost first. */
async function reveal(target: Locator) {
	const ancestors = target.locator('xpath=ancestor::details');
	for (const disclosure of await ancestors.all()) {
		if (!(await disclosure.evaluate((el: HTMLDetailsElement) => el.open))) {
			await disclosure.locator(':scope > summary').click();
		}
	}
}

async function shot(page: Page, name: string) {
	if (!SHOTS) return;
	mkdirSync(SHOTS, { recursive: true });
	await page.screenshot({ path: `${SHOTS}${name}.png` });
}

/** The pack's text for a dish, as the card draws its lines. */
const dish = (id: string) => PACK.dishes.find((d) => d.id === id)!;

/* ------------------------------------------------------------------------ */

test("the word lights on the house's page, on Cuisine and on the Fieldbook, and the page is named by the house on every view", async ({ page }) => {
	await openHouse(page);
	await expect(page).toHaveTitle(`${PACK.name} · The World Table`);
	await expect(page.locator('nav.modebar .modetab.on')).toHaveCount(1);
	await expect(lit(page)).toHaveText(PACK.name);
	await expect(page.locator('nav.modebar .modetab').nth(1)).toHaveText(new RegExp(`^${PACK.name}`));
	// The menu's collections remain children of Menu; every view keeps the house's name.
	const collections = page.locator('nav.chips.collections');
	await expect(collections).toHaveAttribute('aria-label', `${PACK.name} collections`);
	await expect(collections.locator('a.chip')).toHaveText(['The menu', 'Fall field notes', 'Final Plates']);
	await collections.locator('a.chip', { hasText: 'Fall field notes' }).click();
	await expect(page).toHaveURL(/\/menu\?view=fall$/);
	await expect(heading(page)).toHaveText(PACK.name);
	await expect(lit(page)).toHaveText(PACK.name);
	await expect(page.locator('nav.jumps')).toHaveCount(0);
	for (const path of ['/menu?view=learn', '/menu?view=rehearse', '/menu?view=reference', '/cuisine', `/cuisine?ch=mother-sauces&e=${HOLLANDAISE.slug}`, '/foundations', `/foundations?category=${FOUNDATIONS.categories[0].id}`, '/menu?view=producers']) {
		await goto(page, path);
		await expect(page.locator('nav.modebar .modetab.on'), path).toHaveCount(1);
		await expect(lit(page), path).toHaveText(PACK.name);
	}
});

test('the bar at 390 and 375: five words in one row, every tab 44 by 44, inside the glass, the lit word on the house', async ({ page }) => {
	test.setTimeout(90_000);
	const measured: Record<string, unknown> = {};
	for (const width of [390, 375]) {
		await page.setViewportSize({ width, height: 844 });
		await openHouse(page);
		// With the due pill drawn, the widest the bar gets: a fresh device has new cards to start.
		await expect(page.locator('nav.modebar .modetab .pill')).toBeVisible({ timeout: 15_000 });
		const tabs = page.locator('nav.modebar .modetab');
		const words = (await tabs.allTextContents()).map((t) => t.replace(/\d+\s*due$/, '').trim());
		expect(words, `the words at ${width}`).toEqual(WORDS);
		const boxes = await tabs.evaluateAll((els) =>
			els.map((e) => {
				const r = e.getBoundingClientRect();
				return { top: Math.round(r.top), w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, left: Math.round(r.left * 10) / 10, right: Math.round(r.right * 10) / 10 };
			})
		);
		expect(Math.max(...boxes.map((b) => b.top)) - Math.min(...boxes.map((b) => b.top)), `one row at ${width}`).toBeLessThan(8);
		for (const [i, b] of boxes.entries()) {
			expect(b.w, `${WORDS[i]} at least 44 wide at ${width}`).toBeGreaterThanOrEqual(44);
			expect(b.h, `${WORDS[i]} at least 44 tall at ${width}`).toBeGreaterThanOrEqual(44);
		}
		expect(Math.max(...boxes.map((b) => b.right)), `the bar inside the glass at ${width}`).toBeLessThanOrEqual(width);
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
		await expect(lit(page)).toHaveText(PACK.name);
		const inner = await page.locator('.modebar-inner').evaluate((el) => ({ clientWidth: el.clientWidth, scrollWidth: el.scrollWidth }));
		expect(inner.scrollWidth, `no overflow at ${width}`).toBeLessThanOrEqual(inner.clientWidth + 1);
		const pill = await page.locator('nav.modebar .modetab .pill').evaluate((el) => {
			const r = el.getBoundingClientRect();
			return { w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, right: Math.round(r.right * 10) / 10 };
		});
		measured[width] = { words: WORDS, boxes, row: Math.round((boxes[boxes.length - 1].right - boxes[0].left) * 10) / 10, spare: Math.round((width - boxes[boxes.length - 1].right) * 10) / 10, inner, pill };
		if (SHOTS) {
			mkdirSync(SHOTS, { recursive: true });
			await page.locator('nav.modebar').screenshot({ path: `${SHOTS}bar-${width}.png` });
			await shot(page, `brennans-page-${width}`);
		}
	}
	if (SHOTS) writeFileSync(`${SHOTS}bar-measured.json`, JSON.stringify(measured, null, 2));
	await page.setViewportSize({ width: 390, height: 844 });
});

test('the four house sections are clear links, with one active destination and a return to Menu', async ({ page }) => {
	await openHouse(page);
	const nav = houseSections(page);
	const destinations = [
		['Menu', '/menu'],
		['Kitchen studies', '/menu?view=learn'],
		['Service rehearsal', '/menu?view=rehearse'],
		['House reference', '/menu?view=reference']
	] as const;
	await expect(nav.locator('a')).toHaveText(destinations.map(([name]) => name));
	await expect(page.locator('nav.jumps')).toHaveCount(0);
	for (const [name, href] of destinations) {
		const link = nav.getByRole('link', { name, exact: true });
		await expect(link).toHaveAttribute('href', href);
		expect((await link.boundingBox())!.height, `${name} is a thumb-sized control`).toBeGreaterThanOrEqual(44);
	}
	for (const [name, href] of destinations.slice(1)) {
		await nav.getByRole('link', { name, exact: true }).click();
		await expect(page).toHaveURL(url => `${url.pathname}${url.search}` === href);
		await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
		await expect(nav.locator('[aria-current="page"]')).toHaveText(name);
		await expect(lit(page)).toHaveText(PACK.name);
		await backBtn(page).click();
		await expect(page).toHaveURL(/\/menu$/);
		await expect(nav.locator('[aria-current="page"]')).toHaveText('Menu');
	}
});

test('Kitchen studies preserves the twelve Cuisine chapters and nine Fieldbook subjects behind clear disclosures', async ({ page }) => {
	await openHouse(page);
	await houseSections(page).getByRole('link', { name: 'Kitchen studies', exact: true }).click();
	const g = groups(page);
	await reveal(g.locator('a.door[data-door="cuisine"]'));
	await reveal(g.locator('a.door[data-door="foundations"]'));
	await expect(g.locator('#cooking-h .title')).toHaveText('Cooking lessons');
	const lead = g.locator('a.door[data-door="cuisine"]');
	await expect(lead.locator('.door-name')).toHaveText('Cuisine');
	await expect(lead).toHaveAttribute('href', '/cuisine');
	const chapters = g.locator('a.door[data-chapter]');
	await expect(chapters).toHaveCount(12, { timeout: 15_000 });
	await expect(chapters.locator('.door-name')).toHaveText(INDEX.chapters.map((c) => c.title));
	for (const c of INDEX.chapters) {
		const door = g.locator(`a.door[data-chapter="${c.key}"]`);
		await expect(door).toHaveAttribute('href', `/cuisine?ch=${c.key}`);
		await expect(door.locator('.door-sub')).toHaveText(`${c.entries} ${c.entries === 1 ? 'entry' : 'entries'} · ${c.cards} ${c.cards === 1 ? 'card' : 'cards'}`);
	}
	await expect(g.locator('p.note[role="status"]')).toHaveCount(0);

	await expect(g.locator('#terms-h .title')).toHaveText('Culinary terms');
	const fieldbook = g.locator('a.door[data-door="foundations"]');
	await expect(fieldbook.locator('.door-name')).toHaveText('The Kitchen Fieldbook');
	await expect(fieldbook).toHaveAttribute('href', '/foundations');
	await expect(g.locator('#terms-h .count')).toHaveText(`${FOUNDATIONS.entries.length} terms · ${FOUNDATIONS.categories.length} subjects`);
	const subjects = g.locator('nav.subjects');
	await expect(subjects.locator('a.chip[href^="/foundations?category="]')).toHaveCount(9);
	await expect(subjects.locator('a.chip[href^="/foundations?category="]')).toHaveText(FOUNDATIONS.categories.map((c) => c.title));
	await expect(subjects.locator('a.chip.go')).toHaveAttribute('href', '/flashcards?deck=foundations%3Atoday');
	for (const el of await g.locator('a.door, a.chip').all()) {
		const b = (await el.boundingBox())!;
		expect(b.height, 'every door and chip at least 44 px').toBeGreaterThanOrEqual(44);
		expect(b.x + b.width).toBeLessThanOrEqual(390);
	}
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
	await g.locator('#cooking-h').evaluate((el) => el.scrollIntoView({ block: 'start' }));
	await shot(page, 'brennans-cooking');

	// A chapter door opens its chapter under the lit word, and Back returns to the page (a push).
	await g.locator('a.door[data-chapter="mother-sauces"]').click();
	await expect(page).toHaveURL(/\/cuisine\?ch=mother-sauces$/);
	await expect(heading(page)).toHaveText(INDEX.chapters.find((c) => c.key === 'mother-sauces')!.title);
	await expect(lit(page)).toHaveText(PACK.name);
	await backBtn(page).click();
	await expect(page).toHaveURL(/\/menu\?view=learn$/);
	await expect(heading(page)).toHaveText(PACK.name);
	// A subject chip opens the Fieldbook filtered, under the lit word, and Back returns to the page.
	await reveal(g.locator('a.door[data-door="foundations"]'));
	const subject = FOUNDATIONS.categories[0];
	await g.locator(`nav.subjects a.chip[href="/foundations?category=${subject.id}"]`).click();
	await expect(page).toHaveURL(new RegExp(`/foundations\\?category=${subject.id}$`));
	await expect(heading(page)).toHaveText('The Kitchen Fieldbook');
	await expect(lit(page)).toHaveText(PACK.name);
	await backBtn(page).click();
	await expect(page).toHaveURL(/\/menu\?view=learn$/);
	await expect(heading(page)).toHaveText(PACK.name);
});

test('the Fall 2026 section leads the chips, reveals all eight dishes, and respects the meal filter', async ({ page }) => {
	await openHouse(page);
	const chips = page.locator('.study .bar button.chip.sec');
	const fallChip = chips.filter({ hasText: /^Fall 2026 \d+$/ });
	expect(FALL_IN_PACK.length, 'the sheet names eight dishes').toBe(8);
	await expect(chips.nth(2)).toHaveText(`Fall 2026 ${FALL_IN_PACK.length}`);
	await fallChip.click();
	const group = page.locator('.study details[data-section="Fall 2026"]');
	await expect(group).toHaveJSProperty('open', true);
	await expect(group.locator('.row')).toHaveCount(FALL_IN_PACK.length);
	await expect(group.locator('.row .nm')).toHaveText(FALL_IN_PACK.map((d) => d.name));
	await expect(fallChip).toHaveAttribute('aria-pressed', 'true');
	await expect(page).toHaveURL(/\/menu$/);
	// A meal the fall dishes do not serve removes that section from the chips.
	const offMeal = (PACK.meals ?? []).map((m) => m.name).find((m) => !FALL_IN_PACK.some((d) => (d.meals ?? []).includes(m)))!;
	expect(offMeal, 'a meal of the house the fall dishes are not served at').toBeTruthy();
	const meals = page.locator('.study .meals');
	await meals.getByRole('button', { name: offMeal, exact: true }).click();
	await expect(fallChip).toHaveCount(0);
	await meals.getByRole('button', { name: 'All day', exact: true }).click();
	await expect(fallChip).toHaveCount(1);
	await fallChip.click();
	await expect(group).toHaveJSProperty('open', true);
	await expect(group.locator('.row')).toHaveCount(FALL_IN_PACK.length);
});

test("a Fall 2026 dish of the Brennan's house draws the sheet's field notes on its card: the ingredients, the compact image and the two quiet links; a dish off the sheet, and the sheet's name on another house, draw none", async ({ page }) => {
	// The join is by the sheet's name, for the Brennan's house alone (the sheet is its training
	// sheet): proved on the pack's own Steak Tartare with Rye, then refused on a dish off the sheet
	// and on a seeded house whose dish takes the sheet's name verbatim.
	const item = FALL.items.find((i) => i.id === 'steak-tartare-rye')!;
	expect(FALL_IN_PACK.some((d) => d.name === item.name), "the pack carries the sheet's dish by name").toBe(true);
	await openHouse(page);
	await page.getByRole('button', { name: `${FALL_SECTION} ${FALL_IN_PACK.length}`, exact: true }).click();
	await page.locator('.study .row', { has: page.locator('.nm', { hasText: item.name }) }).click();
	const c = card(page);
	await expect(c.locator('#card-h')).toHaveText(item.name);
	const notes = c.locator('section.fallnotes[aria-labelledby="fall-h"]');
	await expect(notes.locator('#fall-h')).toHaveText('Fall 2026 field notes');
	await expect(notes.locator('p.soft').first()).toHaveText(`From the Fall 2026 training sheet, ${item.photoFile}: the sheet's words, never the kitchen's spec.`);
	// The compact image disclosure: closed, no picture requested until it opens.
	const art = notes.locator('details.fall-art');
	await expect(art.locator('summary')).toHaveText('Explore the teaching image');
	await expect(art).not.toHaveAttribute('open', '');
	await expect(notes.locator('img')).toHaveCount(0);
	expect((await art.locator('summary').boundingBox())!.height).toBeGreaterThanOrEqual(44);
	await art.locator('summary').click();
	await expect(art.locator('.art-cues li').first()).toBeVisible();
	// The four closed coaches, the sheet's ingredients under the first.
	const coaches = notes.locator('details.coach');
	await expect(coaches.locator('summary')).toHaveText(['On the training sheet', 'Explore the ingredients', 'Origins and traditions', 'Confirm at lineup']);
	for (const d of await coaches.all()) await expect(d).not.toHaveAttribute('open', '');
	await coaches.nth(0).locator('summary').click();
	await expect(coaches.nth(0).locator('li')).toHaveText(item.listedIngredients);
	await coaches.nth(3).locator('summary').click();
	await expect(coaches.nth(3).locator('p.para').last()).toHaveText('Allergens: read the service note and confirm at lineup.');
	// The sheet's dietary notes are never drawn as a list: no row or line of the block is one of
	// its words alone (the sheet's own prose may name an egg), and "Allergens:" stands only in the
	// fixed pointer sentence, the card's rule.
	const leaves = await notes.evaluate((el) =>
		[...el.querySelectorAll<HTMLElement>('li, p, dt, dd, span, b, strong')].filter((e) => e.children.length === 0).map((e) => (e.textContent ?? '').trim())
	);
	for (const note of item.sheetDietaryNotes ?? []) expect(leaves, `the dietary note ${note} is not drawn`).not.toContain(note);
	const said = await notes.evaluate((el) => {
		const out: string[] = [];
		const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
		for (let n = walk.nextNode(); n; n = walk.nextNode()) if (/Allergens:/.test(n.textContent ?? '')) out.push((n.textContent ?? '').trim());
		return out;
	});
	expect(said).toEqual(['Allergens: read the service note and confirm at lineup.']);
	// The two quiet links: the field notes page and the item's drill.
	await expect(notes.locator('a[href="/menu?view=fall&kind=dish&item=steak-tartare-rye"]')).toHaveText('The field notes in full');
	await expect(notes.locator('a[href="/flashcards?deck=fall%3Aitem%3Asteak-tartare-rye"]')).toHaveText('Drill this item');
	for (const a of await notes.locator('a:visible, summary:visible').all()) expect((await a.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	expect((await notes.boundingBox())!.x + (await notes.boundingBox())!.width).toBeLessThanOrEqual(390);
	await notes.locator('#fall-h').evaluate((el) => el.scrollIntoView({ block: 'start' }));
	await shot(page, 'fall-card-notes');
	await page.evaluate(() => window.scrollTo(0, 0));
	await c.locator('#card-h').evaluate((el) => el.scrollIntoView({ block: 'start' }));
	await shot(page, 'fall-card-top');
	// A dish off the sheet draws no field notes.
	await backBtn(page).click();
	await page.getByRole('button', { name: 'Entrées 14', exact: true }).click();
	await page.locator('.study .row', { has: page.locator('.nm', { hasText: 'Eggs Hussarde' }) }).click();
	await expect(card(page).locator('#card-h')).toContainText('Eggs Hussarde');
	await expect(card(page).locator('#fall-h')).toHaveCount(0);
	// The sheet's name on another house draws none: the notes are Brennan's. The pack is withheld
	// so the seeded house stays current.
	await page.unroute(PACK_URL);
	const h = JSON.parse(JSON.stringify(FIXTURE));
	h.dishes[0].name = item.name;
	await seedHouses(page, [h]);
	await goto(page, '/menu');
	await expect(page.locator('.study input[type="search"]')).toBeVisible({ timeout: 15_000 });
	await page.locator('.study input[type="search"]').fill(item.name);
	await page.locator('.study .row', { has: page.locator('.nm', { hasText: item.name }) }).click();
	await expect(card(page).locator('#card-h')).toHaveText(item.name);
	await expect(card(page).locator('#fall-h')).toHaveCount(0);
});

test('the Eggs Hussarde card opens on its three lines and draws Go deeper by chapter, the hollandaise entry a link into Cuisine and back', async ({ page }) => {
	await openHouse(page);
	await page.getByRole('button', { name: 'Entrées 14' }).click();
	await page.locator('.study .row', { has: page.locator('.nm', { hasText: 'Eggs Hussarde' }) }).click();
	const c = card(page);
	await expect(c.locator('h2').first()).toHaveText('Eggs Hussarde');
	const lines = dish(HUSSARDE).lines;
	await expect(c.locator('#l10')).toHaveText(lines.value.s10);
	await expect(c.locator('#l20')).toHaveText(lines.value.s20);
	await expect(c.locator('#l45')).toHaveText(lines.value.s45);
	await shot(page, 'hussarde-top');

	const deeper = c.locator('section[aria-labelledby="deeper-h"]');
	await expect(deeper.locator('#deeper-h')).toHaveText('Go deeper', { timeout: 15_000 });
	await expect(deeper.locator('p').first()).toHaveText('The cooking behind this plate, read in Cuisine.');
	const ids = new Set(INDEX.byDish[HUSSARDE]);
	expect(ids.size).toBeGreaterThan(0);
	const want = INDEX.chapters
		.map((ch) => ({ ch, entries: INDEX.entries.filter((e) => e.chapter === ch.key && ids.has(e.id)) }))
		.filter((g) => g.entries.length);
	await expect(deeper.locator('h4.eyebrow')).toHaveText(want.map((g) => g.ch.title));
	await expect(deeper.locator('ul.plain a')).toHaveCount(want.reduce((n, g) => n + g.entries.length, 0));
	for (const g of want) for (const e of g.entries) await expect(deeper.locator(`a[href="/cuisine?ch=${g.ch.key}&e=${e.slug}"]`)).toHaveText(e.title);
	const link = deeper.locator(`a[href="/cuisine?ch=mother-sauces&e=${HOLLANDAISE.slug}"]`);
	await expect(link).toHaveCount(1);
	expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	await link.click();
	await expect(page).toHaveURL(new RegExp(`/cuisine\\?ch=mother-sauces&e=${HOLLANDAISE.slug}$`));
	await expect(heading(page)).toHaveText(HOLLANDAISE.title);
	await expect(lit(page)).toHaveText(PACK.name);
	await backBtn(page).click();
	await expect(card(page).locator('h2').first()).toHaveText('Eggs Hussarde');
});

test('Back chains: a card to the page to Home; an entry to its chapter, Cuisine, the house and Home; a term to its list, the house and Home', async ({ page }) => {
	test.setTimeout(60_000);
	// A card, cold: Back closes it to the page; the page's Back is Home.
	await page.goto('about:blank');
	await goto(page, `/menu#${HUSSARDE}`);
	await expect(card(page).locator('h2').first()).toHaveText('Eggs Hussarde', { timeout: 15_000 });
	await expect(lit(page)).toHaveText(PACK.name);
	await backBtn(page).click();
	await expect(card(page)).toHaveCount(0);
	await expect(heading(page)).toHaveText(PACK.name);
	await expect(page).toHaveURL(/\/menu$/);
	await backBtn(page).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.locator('a.level')).toHaveCount(4);
	await expect(backBtn(page)).toHaveCount(0);

	// An entry, cold: its chapter, then Cuisine, then the house's page, then Home.
	await page.goto('about:blank');
	await goto(page, `/cuisine?ch=mother-sauces&e=${HOLLANDAISE.slug}`);
	await expect(heading(page)).toHaveText(HOLLANDAISE.title);
	await backBtn(page).click();
	await expect(page).toHaveURL(/\/cuisine\?ch=mother-sauces$/);
	await backBtn(page).click();
	await expect(page).toHaveURL(/\/cuisine$/);
	await expect(heading(page)).toHaveText('Cuisine');
	await backBtn(page).click();
	await expect(page).toHaveURL(/\/menu$/);
	await expect(heading(page)).toHaveText(PACK.name, { timeout: 15_000 });
	await backBtn(page).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.locator('a.level')).toHaveCount(4);

	// A Fieldbook term, cold: its list, then the house's page, then Home.
	const term = FOUNDATIONS.entries[0];
	await page.goto('about:blank');
	await goto(page, `/foundations?term=${term.id}`);
	await expect(heading(page)).toHaveText(term.term);
	await expect(lit(page)).toHaveText(PACK.name);
	await backBtn(page).click();
	await expect(page).toHaveURL(/\/foundations$/);
	await expect(heading(page)).toHaveText('The Kitchen Fieldbook');
	await backBtn(page).click();
	await expect(page).toHaveURL(/\/menu$/);
	await expect(heading(page)).toHaveText(PACK.name, { timeout: 15_000 });
	await backBtn(page).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.locator('a.level')).toHaveCount(4);
});

test("the lit word from a card, a section's list or the editing page returns to the bare root, and on the root it only scrolls", async ({ page }) => {
	await page.goto('about:blank');
	await goto(page, `/menu#${HUSSARDE}`);
	await expect(card(page).locator('h2').first()).toHaveText('Eggs Hussarde', { timeout: 15_000 });
	await tab(page, PACK.name);
	await expect(page).toHaveURL(/\/menu$/);
	await expect(card(page)).toHaveCount(0);
	await expect(heading(page)).toHaveText(PACK.name);
	await expect(page.locator('.study details.menu-group').first().locator(':scope > summary')).toBeVisible();
	// The browser's Back returns to the cold entry and the card opens again with its address (the
	// page stays mounted through a navigation within its own route, so the one-time cold open is not
	// what brings it back); the Back button closes it to the list, and the next press is Home.
	await page.goBack();
	await expect(page).toHaveURL(new RegExp(`/menu#${HUSSARDE}$`));
	await expect(card(page).locator('h2').first()).toHaveText('Eggs Hussarde');
	await backBtn(page).click();
	await expect(card(page)).toHaveCount(0);
	await expect(page).toHaveURL(/\/menu$/);
	await expect(page.locator('.study details.menu-group').first().locator(':scope > summary')).toBeVisible();
	await backBtn(page).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.locator('a.level')).toHaveCount(4);

	await goto(page, '/menu?section=Starters');
	await expect(page.getByRole('button', { name: /^Starters \d+$/ })).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 });
	await tab(page, PACK.name);
	await expect(page).toHaveURL(/\/menu$/);
	await expect(heading(page)).toHaveText(PACK.name);

	await page.getByRole('button', { name: 'Edit the menu', exact: true }).click();
	await expect(page.locator('.dishes li').first()).toBeVisible();
	await tab(page, PACK.name);
	await expect(page).toHaveURL(/\/menu$/);
	await expect(page.locator('.study details.menu-group').first().locator(':scope > summary')).toBeVisible();

	// On the bare root the lit word scrolls to the top and adds nothing.
	await page.evaluate(() => window.scrollTo(0, 900));
	await page.waitForTimeout(150);
	const len = await histLen(page);
	await tab(page, PACK.name);
	await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
	expect(await histLen(page)).toBe(len);
	await expect(page).toHaveURL(/\/menu$/);
});

test("the Practise root: Due today, the quick quiz, the house's decks and drills, then the other groups in order, and the quick quiz comes Back to Practise", async ({ page }) => {
	await goto(page, '/flashcards');
	await expect(heading(page)).toHaveText('Practise');
	await expect(page).toHaveTitle('Practise · The World Table');
	await expect(lit(page)).toHaveText(/^Practise/);
	await expect(page.locator('#fc-house')).toHaveText(PACK.name, { timeout: 15_000 });
	await expect(page.locator('button.door[data-deck="cz:all"]')).toBeVisible({ timeout: 15_000 });
	await expect(page.locator('h2.group')).toHaveText([
		'Due today',
		'Quick quiz',
		PACK.name,
		'Fall 2026',
		"What it's made of",
		'Your culinary terms',
		'Cuisine',
		NAMES[0],
		'Hands on',
		`The ${NAMES[0]} test`,
		'Reference cards'
	]);
	await expect(page.locator('#fc-words')).toHaveCount(0);
	// The house's group: its decks first, then its five rounds as doors.
	const house = page.locator('nav[aria-labelledby="fc-house"]');
	const names = await house.locator('.door-name').allTextContents();
	expect(names.slice(0, 2)).toEqual(['The whole menu', 'Tasting courses']);
	expect(names.slice(-5)).toEqual(['The dishes', 'Drill the menu', 'Pairings', 'Say it back', 'Guest at the table']);
	for (const [name, href] of [
		['The dishes', '/menu/quiz'],
		['Drill the menu', '/menu/quiz?mode=drill'],
		['Pairings', '/menu/quiz?mode=pair'],
		['Say it back', '/menu/quiz?mode=say'],
		['Guest at the table', '/menu/quiz?mode=guest']
	] as const) {
		await expect(house.locator('a.door', { has: page.locator('.door-name', { hasText: new RegExp(`^${name}$`) }) })).toHaveAttribute('href', href);
	}
	await expect(page.locator('nav[aria-labelledby="fc-cuisine"] a.door .door-name')).toHaveText(['The Cuisine quiz', 'Order the steps', 'Family matching']);
	await expect(page.locator('nav[aria-labelledby="fc-level"] a.door .door-name')).toHaveText(['The written test', 'Say it back: the Floor Deck', 'The Lexicon quiz', 'The service drill']);
	await expect(page.locator('nav[aria-labelledby="fc-level"] button.door[data-deck="lexicon"]')).toHaveCount(1);
	await expect(page.locator('nav[aria-labelledby="fc-hands"] a.door .door-name')).toHaveText(['The firing drill', 'Calibrate your palate', 'The lineup']);
	await expect(page.locator('nav[aria-labelledby="fc-test"] a.door.leveltest')).toHaveAttribute('href', '/level/1/test');
	const short = await page.evaluate(() =>
		[...document.querySelectorAll<HTMLElement>('main .door, main .chip')]
			.filter((el) => el.offsetParent !== null)
			.map((el) => ({ t: el.textContent!.trim().slice(0, 30), h: el.getBoundingClientRect().height }))
			.filter((x) => x.h < 44)
	);
	expect(short).toEqual([]);
	await shot(page, 'practise-root');

	// The quick quiz, from its own group: the round runs on /quizzes, and Back is Practise.
	const quick = page.locator('section[aria-labelledby="fc-quick"]');
	await expect(quick.locator('#fc-quick')).toHaveText('Quick quiz');
	await expect(quick.locator('p.quickline')).not.toBeEmpty();
	const len = await histLen(page);
	await quick.getByRole('link', { name: 'Start the quick quiz' }).click();
	await expect(page).toHaveURL(/\/quizzes\?quick=1$/);
	await expect(heading(page)).toHaveText('Quick quiz');
	await expect(page.locator('.where')).toHaveText(/^Question 1 of /);
	await expect(lit(page)).toHaveText(/^Practise/);
	expect(await histLen(page)).toBe(len + 1);
	await backBtn(page).click();
	await expect(page).toHaveURL(/\/flashcards$/);
	await expect(heading(page)).toHaveText('Practise');
});

test("the level page carries one door named by the house into its page, and Back from the page returns to the level", async ({ page }) => {
	await goto(page, '/level/1');
	await expect(heading(page)).toHaveText(NAMES[0]);
	await expect(page.locator('.countline')).toContainText(PACK.name, { timeout: 15_000 });
	const door = page.locator('nav.quiet[aria-labelledby="restaurant"] a.door[data-door="house"]');
	await expect(door).toHaveCount(1);
	await expect(door.locator('.door-name')).toHaveText(PACK.name);
	await expect(door).toHaveAttribute('href', '/menu');
	await expect(door.locator('.door-line')).toHaveText("The menu and its lines, the fall menu, the cooking, your terms, the producers, the house's lists and the drills.");
	await expect(page.locator('[data-door="study"], [data-door="menu-cards"], [data-door="menu-drill"], [data-door="fall-menu"], [data-door="producers"]')).toHaveCount(0);
	// The count line names the fall menu only once the pack holds the section.
	if (FALL_IN_PACK.length) await expect(page.locator('.countline')).toContainText('Fall 2026: eight dishes and nine cocktails.');
	else await expect(page.locator('.countline')).not.toContainText('Fall 2026');
	await door.click();
	await expect(page).toHaveURL(/\/menu$/);
	await expect(heading(page)).toHaveText(PACK.name);
	await expect(lit(page)).toHaveText(PACK.name);
	await backBtn(page).click();
	await expect(heading(page)).toHaveText(NAMES[0]);
	await expect(page).toHaveURL(/\/level\/1$/);
});
