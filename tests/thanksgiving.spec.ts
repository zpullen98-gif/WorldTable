import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { House, HouseDish, Tasting } from '../src/lib/house/house-schema';
import { fixedPriceMenu, HOLIDAY_MEAL, isFixedPrice, SHEET_Q, sheetWords, tastingPlaces, tastingsShown } from '../src/lib/study';
import { goto } from './helpers';

/**
 * The Thanksgiving Day tab of the Brennan's page (22 November 2026): a fixed
 * price menu drawn from the pack in a workspace of its own, and the pairing
 * sheet's words under a tasting's pours.
 *
 * WHICH HOUSE. The tab is data: it stands only while the pack holds a fixed
 * price menu whose meal is Thanksgiving Day. So the spec reads the shipped
 * pack when it holds that menu (the edition that serves it), and otherwise
 * grafts a small stand-in menu onto the shipped house, in memory, so the tab
 * stays proved before the edition is cut and after the day, when the menu
 * retires. OOT_TG_PACK names another pack file to serve in its place (a
 * scratch build of the staged edition). Every expectation is computed from
 * the house served, through the same readers the page uses; nothing here
 * names a dish. OOT_TG_SHOTS names a folder to save the 390 px screenshots in.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const SHIPPED = join(HERE, '../static/shared/packs/brennans-new-orleans.v1.oothouse.json');
const OTHER = process.env.OOT_TG_PACK ?? '';
const SHOTS = process.env.OOT_TG_SHOTS ?? '';
const PACK = JSON.parse(readFileSync(OTHER && existsSync(OTHER) ? OTHER : SHIPPED, 'utf8')) as { house: House };

/** The house with a stand-in fixed price menu for the day: three courses of its own served dishes and clones, two sides, one sheet line. */
function grafted(base: House): House {
	const h: House = structuredClone(base);
	const served = h.dishes.filter(d => !d.section.startsWith('Past ') && d.pairing?.by === 'person' && d.price);
	const model = served[0];
	const side = h.dishes.find(d => d.section === 'Sides')!;
	const clone = (from: HouseDish, n: number, name: string, section: string, price = ''): HouseDish => ({
		...structuredClone(from),
		id: `d-tgfix${String(n).padStart(3, '0')}`,
		name,
		section,
		meals: [HOLIDAY_MEAL],
		price,
		prices: price ? [{ meal: HOLIDAY_MEAL, printed: price }] : []
	});
	const joined = served.slice(1, 4);
	for (const d of joined) d.meals = [...d.meals, HOLIDAY_MEAL];
	const added = [
		clone(model, 1, 'Stand-in Starter', HOLIDAY_MEAL),
		clone(model, 2, 'Stand-in Roast', HOLIDAY_MEAL),
		clone(model, 3, 'Stand-in Tart', HOLIDAY_MEAL),
		clone(side, 4, 'Stand-in Greens', `${HOLIDAY_MEAL} sides`, '$7'),
		clone(side, 5, 'Stand-in Dressing', `${HOLIDAY_MEAL} sides`, '$10')
	];
	h.dishes.push(...added);
	if (!h.meals.some(m => m.name === HOLIDAY_MEAL)) h.meals.push({ name: HOLIDAY_MEAL, days: 'One Thursday', hours: 'Confirm at lineup' });
	const course = (n: number, label: string, dishes: HouseDish[]) => ({
		n,
		label,
		choice: true,
		dishIds: dishes.map(d => d.id),
		printed: dishes.map((d, i) => (i ? `${d.name}: The Sheet’s Words ${n}` : `Classic ${d.name}: The Sheet’s Words [ add $5 ]`)),
		pourId: '',
		pourText: ''
	});
	const menu: Tasting = {
		id: 't-tgfix001',
		name: 'A Stand-in Holiday Menu',
		price: '$80',
		meal: HOLIDAY_MEAL,
		includesDrinks: false,
		line: '3 Courses $80: choice of appetizer, entrée and dessert',
		note: 'A stand-in menu for the test. Allergy questions go to the kitchen.',
		courses: [course(1, 'Appetizers', [joined[0], added[0]]), course(2, 'Entrées', [added[1], joined[1]]), course(3, 'Desserts', [joined[2], added[2]])],
		ts: Date.parse(h.pack?.builtAt ?? '2026-11-15T00:00:00Z')
	};
	h.tastings.push(menu);
	const poured = tastingsShown(h).flatMap(t => t.courses.filter(c => c.pour?.item?.kind === 'wine').map(c => ({ t, c })))[0];
	if (poured && !sheetWords(h, poured.c.pour!.item!.id, poured.t.name)) {
		const wine = h.wines.find(w => w.id === poured.c.pour!.item!.id)!;
		wine.kept = [...(wine.kept ?? []), { q: SHEET_Q, a: `A stand-in sheet prints this for the first course of the ${poured.t.name}: “Stand-in words & nothing more.”`, ts: menu.ts }];
	}
	return h;
}

/* Read the art list as the plates spec does: native Node ESM does not load the app's bundler-only JSON imports. */
const ART = JSON.parse(readFileSync(join(HERE, '../src/lib/data/brennans-final-dishes.json'), 'utf8')).items as Array<{ collection: string; itemId: string }>;
const ART_LINKS = JSON.parse(readFileSync(join(HERE, '../src/lib/data/brennans-final-dish-links.json'), 'utf8')) as Record<string, string>;
/** True when the dish has a final presentation to draw (brennans-final-dishes.ts finalDishFor, for this house). */
const plated = (id: string) => !!ART_LINKS[id] || ART.some(art => art.collection === 'house' && art.itemId === id);

const HOUSE: House = fixedPriceMenu(PACK.house, HOLIDAY_MEAL) ? PACK.house : grafted(PACK.house);
const WITHOUT: House = { ...structuredClone(PACK.house), tastings: PACK.house.tastings.filter(t => !(isFixedPrice(t) && t.meal === HOLIDAY_MEAL)) };
const MENU = fixedPriceMenu(HOUSE, HOLIDAY_MEAL)!;
const DISHES = MENU.courses.flatMap(c => c.dishes.map(d => ({ ...d, course: c.label })));
const TAB = '/menu?view=thanksgiving';

test.use({ viewport: { width: 390, height: 844 } });

async function serve(page: Page, house: House) {
	const body = JSON.stringify({ ...PACK, house });
	await page.route('**/shared/packs/brennans-new-orleans.v1.oothouse.json', route => route.fulfill({ status: 200, contentType: 'application/json', body }));
}

const nav = (page: Page) => page.locator('nav.house-sections');
const tab = (page: Page) => page.locator('.fixedmenu');
const row = (page: Page, id: string) => tab(page).locator(`button.fprow[data-id="${id}"]`);
const back = (page: Page) => page.locator('button.back');

async function open(page: Page, path: string, house = HOUSE) {
	await serve(page, house);
	await goto(page, path);
	await expect(page.locator('main h1').first()).toHaveText(house.name, { timeout: 15_000 });
	await expect(nav(page)).toBeVisible();
}

async function service(page: Page, value: 'day' | 'night') {
	if ((await page.locator('html').getAttribute('data-service')) !== value) {
		await page.locator('#oot-service-toolbar').getByRole('button', { name: `Switch to ${value} service` }).click();
	}
	await expect(page.locator('html')).toHaveAttribute('data-service', value);
}

const noOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const sheetPart = (name: string, printed: string) => printed.slice(printed.indexOf(':') + 1).trim() || name;

test('the tab stands fifth under Brennan’s and draws the menu as the pack holds it', async ({ page }) => {
	expect(MENU.courses.length).toBeGreaterThan(1);
	await open(page, '/menu');
	const links = nav(page).locator('a');
	await expect(links).toHaveText(['Menu', 'Kitchen studies', 'Service rehearsal', 'House reference', MENU.meal]);
	const door = links.last();
	await expect(door).toHaveAttribute('href', TAB);
	/* At a phone's width the five doors sit three over two, so the fifth costs no third row: it
	   shares the second row with House reference, each about half the bar. */
	const [navBox, doorBox, fourthBox] = [await nav(page).boundingBox(), await door.boundingBox(), await links.nth(3).boundingBox()];
	expect(Math.abs(doorBox!.y - fourthBox!.y)).toBeLessThan(2);
	expect(doorBox!.width).toBeGreaterThan(navBox!.width / 2 - 8);
	expect(doorBox!.height).toBeGreaterThanOrEqual(44);
	await door.click();
	await expect(page).toHaveURL(url => url.pathname === '/menu' && url.searchParams.get('view') === 'thanksgiving');
	await expect(links.last()).toHaveAttribute('aria-current', 'page');
	await expect(page.locator('nav.collections, .study, .tmenu, .house-learning, .houselists')).toHaveCount(0);

	await expect(tab(page).locator('h2')).toHaveText(MENU.name);
	await expect(tab(page).locator('.fpline')).toHaveText(MENU.line);
	await expect(tab(page).locator('.fphead .eyebrow')).toContainText(MENU.meal);
	if (MENU.days) await expect(tab(page).locator('.fphead .eyebrow')).toContainText(MENU.days);
	if (MENU.hours) await expect(tab(page).locator('.fphours')).toHaveText(MENU.hours);

	const courses = tab(page).locator('.fpcourse:not(.sides)');
	await expect(courses.locator('h3')).toHaveText(MENU.courses.map(c => c.label));
	for (const [i, c] of MENU.courses.entries()) {
		const section = courses.nth(i);
		await expect(section.locator('.choice')).toHaveText(`choice of ${c.dishes.length}`);
		await expect(section.locator('.fprow .nm')).toHaveText(c.dishes.map(d => d.row.name));
		for (const d of c.dishes) {
			const button = row(page, d.row.id);
			if (d.printed) await expect(button.locator('.printed')).toContainText(sheetPart(d.row.name, d.printed));
			await expect(button.locator('.pair')).toHaveCount(d.pairs.length);
			for (const [label, text] of d.pairs) await expect(button).toContainText(`${label} ${text}`);
			/* The menu's one price covers a course dish: no other menu's price is drawn beside it. */
			await expect(button.locator('.pr')).toHaveCount(0);
		}
	}
	const sides = tab(page).locator('.fpcourse.sides');
	await expect(sides).toHaveCount(MENU.sides.length ? 1 : 0);
	if (MENU.sides.length) {
		await expect(sides.locator('h3')).toHaveText('Sides for the table');
		await expect(sides.locator('.fprow .nm')).toHaveText(MENU.sides.map(r => r.name));
		await expect(sides.locator('.fprow .pr')).toHaveText(MENU.sides.map(r => r.price));
		await expect(sides.locator('.pair')).toHaveCount(0);
	}
	if (MENU.note) await expect(tab(page).locator('.fpnote p')).toHaveText(MENU.note);
	await expect(tab(page).locator('img, picture, .final-dish')).toHaveCount(0);
	for (const button of await tab(page).locator('button, a.chip').all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);

	for (const mode of ['day', 'night'] as const) {
		await service(page, mode);
		expect(await noOverflow(page)).toBe(true);
		expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
		if (SHOTS) {
			mkdirSync(SHOTS, { recursive: true });
			await page.screenshot({ path: join(SHOTS, `thanksgiving-tab-390-${mode}.png`), fullPage: true });
			/* The phone's own screens: the head of the tab, then the foot (the sides and the note). */
			await nav(page).scrollIntoViewIfNeeded();
			await page.screenshot({ path: join(SHOTS, `thanksgiving-tab-390-${mode}-first-screen.png`) });
			await tab(page).locator('.fprow').last().scrollIntoViewIfNeeded();
			await page.screenshot({ path: join(SHOTS, `thanksgiving-tab-390-${mode}-sides.png`) });
			await page.evaluate(() => scrollTo(0, 0));
		}
	}
});

test('every row opens its card and Back returns to the tab with the focus on that row', async ({ page }) => {
	await open(page, TAB);
	await expect(tab(page)).toBeVisible();
	for (const r of MENU.rows) {
		const opener = row(page, r.id);
		await opener.scrollIntoViewIfNeeded();
		await opener.click();
		await expect(page.locator('article.card #card-h')).toHaveText(r.name);
		await expect(page).toHaveURL(url => url.searchParams.get('view') === 'thanksgiving' && url.hash === `#${r.id}`);
		await expect(nav(page)).toHaveCount(0);
		const inCourse = MENU.rows.filter(x => x.section === r.section);
		await expect(page.locator('article.card .pos')).toHaveText(`${inCourse.findIndex(x => x.id === r.id) + 1} of ${inCourse.length} in ${r.section}`);
		await back(page).click();
		await expect(tab(page)).toBeVisible();
		await expect(page).toHaveURL(url => url.searchParams.get('view') === 'thanksgiving' && url.hash === '');
		await expect(opener).toBeFocused();
		await expect(opener).toBeInViewport();
	}
	/* Next walks the sheet's order, and Back from the stepped card still returns to the row that opened it. */
	const [first, second] = MENU.rows;
	await row(page, first.id).click();
	await page.locator('article.card .nextbtn').click();
	await expect(page.locator('article.card #card-h')).toHaveText(second.name);
	await back(page).click();
	await expect(row(page, first.id)).toBeFocused();
	/* The tab's own Back is the Brennan's page. */
	await back(page).click();
	await expect(page).toHaveURL(url => url.pathname === '/menu' && !url.search);
});

test('a course dish’s card says the menu and its price, and draws well with no plate picture', async ({ page }) => {
	const unplated = DISHES.find(d => !plated(d.row.id)) ?? DISHES[0];
	const side = MENU.sides.find(r => !plated(r.id));
	await open(page, TAB);
	await row(page, unplated.row.id).click();
	const card = page.locator('article.card');
	await expect(card.locator('#card-h')).toHaveText(unplated.row.name);
	for (const line of tastingPlaces(HOUSE, unplated.row.id)) await expect(card.locator('p.tasting').filter({ hasText: line })).toHaveCount(1);
	expect(tastingPlaces(HOUSE, unplated.row.id).at(-1)).toBe(`On the ${MENU.meal} menu, three courses for ${MENU.price}: ${unplated.course}`);
	/* Opened from the tab, never as a tasting course: no tasting block over the dish's own pour. */
	await expect(card.locator('.tcourse')).toHaveCount(0);
	const art = plated(unplated.row.id);
	await expect(card.locator('.final-dish')).toHaveCount(art ? 1 : 0);
	if (!art) {
		await expect(card.locator('.plate-caption, .plate-body, .plate-reading')).toHaveCount(0);
		expect(await card.locator('img').evaluateAll(images => images.filter(image => !(image as HTMLImageElement).complete || !(image as HTMLImageElement).naturalWidth).length)).toBe(0);
	}
	/* The head: the section, the name, and no price tag for a dish the menu's one price covers. */
	if (!unplated.row.price) await expect(card.locator('.namerow .price')).toHaveCount(0);
	for (const mode of ['day', 'night'] as const) {
		await service(page, mode);
		expect(await noOverflow(page)).toBe(true);
		expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
		if (SHOTS) {
			await page.screenshot({ path: join(SHOTS, `thanksgiving-card-390-${mode}.png`), fullPage: true });
			await card.locator('#card-h').scrollIntoViewIfNeeded();
			await page.screenshot({ path: join(SHOTS, `thanksgiving-card-390-${mode}-first-screen.png`) });
		}
	}
	if (side) {
		await back(page).click();
		await row(page, side.id).click();
		await expect(card.locator('#card-h')).toHaveText(side.name);
		await expect(card.locator('.namerow .price')).toHaveText(side.price);
		await expect(card.locator('.final-dish, p.tasting')).toHaveCount(0);
		if (SHOTS) await page.screenshot({ path: join(SHOTS, 'thanksgiving-side-card-390-night.png'), fullPage: true });
	}
});

test('the deck, the drill and the course cards deal the Thanksgiving dishes alone', async ({ page }) => {
	await open(page, TAB);
	/* The edition's own count: fifteen course dishes and four sides. */
	if (HOUSE === PACK.house) expect(MENU.served).toBe(19);
	await tab(page).getByRole('button', { name: `Flash the ${MENU.served} dishes`, exact: true }).click();
	await expect(page).toHaveURL(url => url.pathname === '/flashcards' && url.searchParams.get('deck') === 'menu' && url.searchParams.get('meal') === HOLIDAY_MEAL);
	await expect(page.locator('.deckframe .where')).toHaveText(`Card 1 of ${Math.min(MENU.served, 20)} · The whole menu`, { timeout: 15_000 });
	const names = new Set(HOUSE.dishes.filter(d => d.meals.includes(HOLIDAY_MEAL)).map(d => d.name));
	await page.getByRole('button', { name: 'Flip', exact: true }).click();
	expect(names.has(await page.locator('.backname').innerText())).toBe(true);
	await page.goBack();
	await expect(tab(page)).toBeVisible();

	await tab(page).getByRole('button', { name: 'Quiz these dishes', exact: true }).click();
	await expect(page).toHaveURL(url => url.pathname === '/menu/quiz' && url.searchParams.get('mode') === 'drill' && url.searchParams.get('meal') === HOLIDAY_MEAL);
	/* The drill says its own scope: the day's dishes and no other. */
	await expect(page.locator('main p.count[role="status"]')).toContainText(`This round asks about ${HOLIDAY_MEAL} only.`, { timeout: 15_000 });
	await page.goBack();
	await expect(tab(page)).toBeVisible();

	const courses = tab(page).getByRole('link', { name: /Flash the courses/ });
	await expect(courses).toHaveAttribute('href', `/flashcards?deck=${encodeURIComponent(`tasting:${MENU.id}`)}&run=1`);
	await courses.click();
	await expect(page.locator('.deckframe .where')).toContainText(`Card 1 of ${MENU.courses.length} ·`, { timeout: 15_000 });
});

test('the fixed price menu is no tasting menu: the Menu list and the Tasting courses deck leave it to its tab', async ({ page }) => {
	const tastings = tastingsShown(HOUSE);
	expect(tastings.map(t => t.id)).not.toContain(MENU.id);
	await open(page, '/menu');
	await expect(page.locator('.study .chiprow').getByRole('button', { name: `Tasting menus ${tastings.length}`, exact: true })).toBeVisible();
	await expect(page.locator(`details[data-tasting-group="${MENU.id}"]`)).toHaveCount(0);
	await expect(page.locator('details[data-tasting-group]')).toHaveCount(tastings.length);
	/* At the day's meal the list is the day's dishes, as rows of their sections, and no tasting. */
	await page.locator('.study .meals').getByRole('button', { name: HOLIDAY_MEAL, exact: true }).click();
	await expect(page.locator('.study .chiprow').getByRole('button', { name: `All ${MENU.served}`, exact: true })).toBeVisible();
	await expect(page.locator('.study .chiprow').getByRole('button', { name: /^Tasting menus/ })).toHaveCount(0);
	await page.evaluate(() => localStorage.removeItem('oot-study-meal-v1'));

	/* The Tasting courses deck holds the tastings' courses and none of the fixed price menu's. */
	await goto(page, '/flashcards?deck=tastings');
	const cards = tastings.reduce((n, t) => n + t.courses.length, 0);
	await expect(page.locator('main h1')).toHaveText('Tasting courses', { timeout: 15_000 });
	await expect(page.locator('main')).toContainText(`${cards} cards ·`);
});

test('no tab and no door on a house that holds no such menu', async ({ page }) => {
	expect(fixedPriceMenu(WITHOUT, HOLIDAY_MEAL)).toBeNull();
	await open(page, '/menu', WITHOUT);
	await expect(nav(page).locator('a')).toHaveText(['Menu', 'Kitchen studies', 'Service rehearsal', 'House reference']);
	await expect(nav(page).getByRole('link', { name: HOLIDAY_MEAL })).toHaveCount(0);
	expect(await nav(page).evaluate(element => element.classList.contains('five'))).toBe(false);
	/* An address saved while the menu was served draws the Menu, never an empty tab. */
	await goto(page, TAB);
	await expect(page.locator('main h1').first()).toHaveText(WITHOUT.name, { timeout: 15_000 });
	await expect(page.locator('.study')).toBeVisible();
	await expect(tab(page)).toHaveCount(0);
	await expect(nav(page).getByRole('link', { name: 'Menu', exact: true })).toHaveAttribute('aria-current', 'page');
	await expect(nav(page).locator('a')).toHaveCount(4);
});

test('a tasting’s pours carry the pairing sheet’s words, on the menu and on the card opened from it', async ({ page }) => {
	const lines = tastingsShown(HOUSE).flatMap(t =>
		t.courses
			.filter(c => c.pour?.item?.kind === 'wine' && sheetWords(HOUSE, c.pour.item.id, t.name))
			.map(c => ({ t, c, wine: c.pour!.item!, words: sheetWords(HOUSE, c.pour!.item!.id, t.name) }))
	);
	expect(lines.length).toBeGreaterThan(0);
	await open(page, '/menu');
	const { t } = lines[0];
	await page.locator(`details[data-tasting-group="${t.id}"] > summary`).click();
	const menu = page.locator(`.tmenu[data-tasting="${t.id}"]`);
	const mine = lines.filter(l => l.t.id === t.id);
	await expect(menu.locator('.sheet')).toHaveCount(mine.length);
	for (const l of mine) {
		const line = menu.locator(`.course[data-n="${l.c.n}"] .sheet`);
		await expect(line.locator('.sheetlabel')).toHaveText('The pairing sheet says');
		await expect(line.locator('q')).toHaveText(l.words);
	}
	for (const mode of ['day', 'night'] as const) {
		await service(page, mode);
		expect(await noOverflow(page)).toBe(true);
		if (SHOTS) await menu.screenshot({ path: join(SHOTS, `tasting-pours-390-${mode}.png`) });
	}
	/* The pour's card, opened from its course, says the sheet's words open, under the course. */
	const { c, wine, words } = mine[0];
	await menu.locator(`[data-key="${t.id}:${c.n}:${wine.id}"]`).click();
	const card = page.locator('article.card');
	await expect(card.locator('#card-h')).toHaveText(wine.name);
	await expect(card.locator('.tcourse .tcsheet q')).toHaveText(words);
	await back(page).click();
	/* The course's dish says them too, with the pour named as the menu prints it. */
	await menu.locator(`[data-key="${t.id}:${c.n}:${c.dishes[0].id}"]`).click();
	await expect(card.locator('#card-h')).toHaveText(c.dishes[0].name);
	await expect(card.locator('.tcourse .tcsheet')).toContainText(`The pairing sheet on ${c.pour!.text}`);
	await expect(card.locator('.tcourse .tcsheet q')).toHaveText(words);
	if (SHOTS) await page.screenshot({ path: join(SHOTS, 'tasting-dish-card-390-night.png') });
});
