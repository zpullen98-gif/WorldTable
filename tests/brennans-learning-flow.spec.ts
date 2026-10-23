import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { House } from '../src/lib/house/house-schema';
import { TEACHING_FOLIOS } from '../src/lib/teaching-folios';
import { goto } from './helpers';

/** The compact Brennan's learning flow, using the actual shipped house. */
const HERE = dirname(fileURLToPath(import.meta.url));
const PACK_TEXT = readFileSync(join(HERE, '../static/shared/packs/brennans-new-orleans.v1.oothouse.json'), 'utf8');
const HOUSE = JSON.parse(PACK_TEXT).house as House;
const HUSSARDE = HOUSE.dishes.find(dish => dish.id === 'd-1q0xk7jv')!;
const VIEWS = [
	['Menu', '/menu'],
	['Kitchen studies', '/menu?view=learn'],
	['Service rehearsal', '/menu?view=rehearse'],
	['House reference', '/menu?view=reference']
] as const;

test.use({ viewport: { width: 390, height: 844 } });
test.beforeEach(async ({ page }) => {
	await page.route('**/shared/packs/brennans-new-orleans.v1.oothouse.json', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: PACK_TEXT })
	);
});

const nav = (page: Page) => page.locator('nav.house-sections');
const back = (page: Page) => page.locator('.backline button.back');
const section = (page: Page, name: string) => page.locator(`.study details.menu-group[data-section=${JSON.stringify(name)}]`);

async function openHouse(page: Page, path = '/menu') {
	await goto(page, path);
	await expect(page.locator('main h1').first()).toHaveText(HOUSE.name, { timeout: 15_000 });
	await expect(nav(page)).toBeVisible();
}

async function service(page: Page, value: 'day' | 'night') {
	if (await page.locator('html').getAttribute('data-service') !== value) {
		await page.locator('#oot-service-toolbar').getByRole('button', { name: `Switch to ${value} service` }).click();
	}
	await expect(page.locator('html')).toHaveAttribute('data-service', value);
}

test('Menu starts with closed groups while every current dish and tasting course remains available', async ({ page }) => {
	await openHouse(page);
	await expect(nav(page).locator('a')).toHaveText(VIEWS.map(([name]) => name));
	await expect(page.locator('nav.jumps, .house-learning, .houselists, #illustrated-kitchen-studies, #study-videos')).toHaveCount(0);
	await expect(page.locator('main a[data-chapter], main a[data-door="foundations"]')).toHaveCount(0);
	await expect(page.locator('.study .row:visible, .study .course:visible')).toHaveCount(0);
	const groups = page.locator('.study details.menu-group');
	expect(await groups.count()).toBeGreaterThan(2);
	for (const group of await groups.all()) await expect(group).toHaveJSProperty('open', false);
	const before = await page.evaluate(() => history.length);
	// Keyboard activation is the same native disclosure used by touch and mouse.
	await groups.first().locator(':scope > summary').focus();
	await page.keyboard.press('Space');
	await expect(groups.first()).toHaveJSProperty('open', true);
	await page.keyboard.press('Space');
	await expect(groups.first()).toHaveJSProperty('open', false);
	expect(await page.evaluate(() => history.length)).toBe(before);
	await expect(page).toHaveURL(/\/menu$/);

	for (const group of await groups.all()) await group.locator(':scope > summary').click();
	const dishIds = new Set(HOUSE.dishes.map(dish => dish.id));
	const rendered = await page.locator('.study .row:visible, .study button.titem:visible').evaluateAll(elements =>
		elements.map(element => element.getAttribute('data-id')!)
	);
	expect([...new Set(rendered.filter(id => dishIds.has(id)))].sort()).toEqual([...dishIds].sort());
	const rows = await page.locator('.study .row').evaluateAll(elements => elements.map(element => element.getAttribute('data-id')));
	expect(new Set(rows).size, 'ordinary dish rows are not duplicated across groups').toBe(rows.length);
	for (const tasting of HOUSE.tastings) {
		const menu = page.locator(`.tmenu[data-tasting="${tasting.id}"]`);
		await expect(menu).toBeVisible();
		await expect(menu.locator('.clabel')).toHaveText(tasting.courses.map(course => course.label));
		await expect(menu.getByRole('link', { name: /Flash the courses/ })).toHaveAttribute('href', `/flashcards?deck=${encodeURIComponent(`tasting:${tasting.id}`)}&run=1`);
	}
});

test('a manually expanded dish group retains its state and exact opener after card Back', async ({ page }) => {
	await openHouse(page);
	const entrees = section(page, HUSSARDE.section);
	const fall = section(page, 'Fall 2026');
	await expect(entrees).toHaveJSProperty('open', false);
	await entrees.locator(':scope > summary').click();
	await expect(entrees).toHaveJSProperty('open', true);
	const opener = entrees.locator(`button.row[data-id="${HUSSARDE.id}"]`);
	await opener.scrollIntoViewIfNeeded();
	const y = await page.evaluate(() => scrollY);
	await opener.click();
	await expect(page.locator('article.card #card-h')).toHaveText(HUSSARDE.name);
	await back(page).click();
	await expect(entrees).toHaveJSProperty('open', true);
	await expect(fall).toHaveJSProperty('open', false);
	await expect(opener).toBeFocused();
	await expect(opener).toBeInViewport();
	// Native scroll restoration can round a fractional layout position by a
	// pixel; preserve the place and exact focused row, not subpixel rounding.
	await expect.poll(() => page.evaluate(previous => Math.abs(scrollY - previous), y)).toBeLessThanOrEqual(2);
	// A deliberate close stays closed: the filter effect must not reopen it.
	await entrees.locator(':scope > summary').click();
	await expect(entrees).toHaveJSProperty('open', false);
});

test('a tasting course returns to its exact button inside the same open tasting', async ({ page }) => {
	await openHouse(page);
	const tasting = HOUSE.tastings.find(menu => menu.courses.some(course => course.dishIds.includes(HUSSARDE.id)))!;
	const course = tasting.courses.find(course => course.dishIds.includes(HUSSARDE.id))!;
	const group = page.locator(`details[data-tasting-group="${tasting.id}"]`);
	await group.locator(':scope > summary').click();
	const opener = group.locator(`[data-key="${tasting.id}:${course.n}:${HUSSARDE.id}"]`);
	await opener.click();
	await expect(page.locator('article.card #card-h')).toHaveText(HUSSARDE.name);
	await expect(page.locator('article.card .tcourse')).toContainText(tasting.name);
	await back(page).click();
	await expect(group).toHaveJSProperty('open', true);
	await expect(opener).toBeFocused();
	await expect(opener).toBeInViewport();
	for (const other of HOUSE.tastings.filter(menu => menu.id !== tasting.id)) {
		await expect(page.locator(`details[data-tasting-group="${other.id}"]`)).toHaveJSProperty('open', false);
	}
});

test('section selection and search reveal results, and practice Back restores meal, search and expansion', async ({ page }) => {
	await openHouse(page);
	await page.locator('.study .meals').getByRole('button', { name: 'Dinner', exact: true }).click();
	await page.locator('.study .bar').getByRole('button', { name: /^Fall 2026 \d+$/ }).click();
	const fall = section(page, 'Fall 2026');
	await expect(fall).toHaveJSProperty('open', true);
	await fall.locator(':scope > summary').click();
	await expect(fall).toHaveJSProperty('open', false);
	const query = page.locator('.study input[type="search"]');
	await query.fill('Steak Tartare');
	await expect(fall).toHaveJSProperty('open', true);
	await expect(fall.locator('.row:visible')).toHaveCount(1);
	await expect(fall.locator('.row .nm')).toContainText('Steak Tartare');
	const progress = await page.locator('.studyhead .progress').textContent();
	await page.locator('.studyhead').getByRole('button', { name: 'Practise this section', exact: true }).click();
	await expect(page).toHaveURL(url => url.pathname === '/flashcards' && url.searchParams.get('meal') === 'Dinner');
	await back(page).click();
	await expect(page).toHaveURL(/\/menu$/);
	await expect(query).toHaveValue('Steak Tartare');
	await expect(page.locator('.study .meals').getByRole('button', { name: 'Dinner', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.locator('.study .bar').getByRole('button', { name: /^Fall 2026 \d+$/ })).toHaveAttribute('aria-pressed', 'true');
	await expect(fall).toHaveJSProperty('open', true);
	await expect(fall.locator('.row:visible')).toHaveCount(1);
	await expect(page.locator('.studyhead .progress')).toHaveText(progress!);
});

test('the tasting section practices its course deck with the selected meal', async ({ page }) => {
	await openHouse(page);
	await page.locator('.study .meals').getByRole('button', { name: 'Dinner', exact: true }).click();
	await page.locator('.study .bar').getByRole('button', { name: /^Tasting menus \d+$/ }).click();
	const head = page.locator('.studyhead');
	const practice = head.getByRole('link', { name: 'Practise this section', exact: true });
	await expect(practice).toHaveAttribute('href', '/flashcards?deck=tastings&run=1&meal=Dinner');
	await expect(head.getByRole('button', { name: 'Drill this section', exact: true })).toHaveCount(0);
	await expect(page.locator('.study .row')).toHaveCount(0);
	for (const menu of HOUSE.tastings.filter(tasting => tasting.meal === 'Dinner')) {
		await expect(page.locator(`details[data-tasting-group="${menu.id}"]`)).toHaveJSProperty('open', true);
	}
	await practice.click();
	await expect(page).toHaveURL(url => url.pathname === '/flashcards' && url.searchParams.get('deck') === 'tastings' && url.searchParams.get('meal') === 'Dinner');
	await expect(page.locator('.deckframe .where')).toHaveText(/^Card 1 of \d+/);
	await back(page).click();
	await expect(page).toHaveURL(/\/menu$/);
	await expect(page.locator('.study .meals').getByRole('button', { name: 'Dinner', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.locator('.study .bar').getByRole('button', { name: /^Tasting menus \d+$/ })).toHaveAttribute('aria-pressed', 'true');
});

test('cold learning views and dish links return to their own view before Menu', async ({ page }) => {
	test.setTimeout(60_000);
	for (const [name, path] of VIEWS.slice(1)) {
		await page.goto('about:blank');
		await openHouse(page, path);
		await expect(nav(page).locator('[aria-current="page"]')).toHaveText(name);
		await back(page).click();
		await expect(page).toHaveURL(/\/menu$/);
		await page.goto('about:blank');
		await goto(page, `${path}#${HUSSARDE.id}`);
		await expect(page.locator('article.card #card-h')).toHaveText(HUSSARDE.name, { timeout: 15_000 });
		await back(page).click();
		await expect(page).toHaveURL(url => `${url.pathname}${url.search}` === path && !url.hash);
		await expect(page.locator('article.card')).toHaveCount(0);
		await expect(nav(page).locator('[aria-current="page"]')).toHaveText(name);
		await back(page).click();
		await expect(page).toHaveURL(/\/menu$/);
	}
	await page.goto('about:blank');
	await openHouse(page, '/menu?view=producers');
	await back(page).click();
	await expect(page).toHaveURL(/\/menu\?view=reference$/);
	await back(page).click();
	await expect(page).toHaveURL(/\/menu$/);
});

for (const anchor of ['illustrated-kitchen-studies', 'study-videos']) {
	test(`the saved #${anchor} address opens its expanded Kitchen studies group`, async ({ page }) => {
		await page.goto('about:blank');
		await goto(page, `/menu#${anchor}`);
		await expect(page).toHaveURL(url => url.pathname === '/menu' && url.searchParams.get('view') === 'learn' && url.hash === `#${anchor}`);
		await expect(nav(page).locator('[aria-current="page"]')).toHaveText('Kitchen studies');
		const group = page.locator(`details#${anchor}`);
		await expect(group).toHaveJSProperty('open', true);
		await expect(group.locator(':scope > summary')).toBeInViewport();
		await expect(group.locator(':scope > summary')).toBeFocused();
		if (anchor === 'illustrated-kitchen-studies') {
			await expect(group.locator('details.teaching-folio')).toHaveCount(TEACHING_FOLIOS.length);
			await expect(group.locator('figure img')).toHaveCount(0);
		} else {
			await expect(group.locator('a.vt').first()).toBeVisible();
		}
		// Replacing the legacy address must not create a Back/redirect loop.
		await back(page).click();
		await expect(page).toHaveURL(/\/menu$/);
		await expect(nav(page).locator('[aria-current="page"]')).toHaveText('Menu');
	});
}

test('the kitchen collections are disclosed on demand without requesting all full-size artworks', async ({ page }) => {
	await openHouse(page, '/menu?view=learn');
	await expect(page.locator('.study .row, .houselists')).toHaveCount(0);
	const artwork = page.locator('#illustrated-kitchen-studies');
	await expect(artwork).toBeAttached();
	const container = artwork;
	await expect(container).toHaveJSProperty('open', false);
	await container.locator(':scope > summary').click();
	await expect(artwork.locator('details.teaching-folio')).toHaveCount(TEACHING_FOLIOS.length);
	await expect(artwork.locator('figure img')).toHaveCount(0);
	const folio = artwork.locator('details.teaching-folio').first();
	await folio.locator(':scope > summary').click();
	await expect(folio.locator('.folio-key')).toBeVisible();
	await expect.poll(() => folio.locator('figure img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
	await expect(artwork.locator('figure img')).toHaveCount(1);
	const videos = page.locator('details#study-videos');
	await expect(videos).toHaveJSProperty('open', false);
	await videos.locator(':scope > summary').click();
	const watch = videos.locator('a.vt').first();
	await expect(watch).toBeVisible();
	await expect(watch).toHaveAttribute('target', '_blank');
	await expect(watch).toHaveAttribute('rel', /noopener/);
	await expect(videos.locator('iframe, video')).toHaveCount(0);
});

test('expanded Kitchen studies preserves the heading hierarchy in both service modes', async ({ page }) => {
	await openHouse(page, '/menu?view=learn');
	for (const group of await page.locator('.house-learning > details.learning-group').all()) {
		await group.locator(':scope > summary').click();
	}
	await expect(page.locator('#folio-group-ingredients')).toBeVisible();
	await expect(page.locator('.house-learning summary h2')).toHaveCount(4);
	for (const mode of ['day', 'night'] as const) {
		await service(page, mode);
		expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
	}
});

test('House reference keeps the house wording and producer door, and rehearsal opens the existing practice routes', async ({ page }) => {
	await openHouse(page, '/menu?view=reference');
	await expect(page.locator('.study .row, .house-learning, .rehearsal')).toHaveCount(0);
	const lists = page.locator('.houselists');
	await expect(lists).toBeVisible();
	const mustKnows = HOUSE.mustKnows.filter(item => item.body?.by === 'person' && item.body.value.trim());
	expect(mustKnows.length).toBeGreaterThan(0);
	const must = lists.locator('details').filter({ has: page.locator('summary', { hasText: /^Must-knows/ }) });
	await expect(must).toHaveJSProperty('open', false);
	await must.locator(':scope > summary').click();
	await expect(must.locator('.entry .title')).toHaveText(mustKnows.map(item => item.title));
	await expect(must.locator('.entry .val')).toHaveText(mustKnows.map(item => item.body!.value.trim()));
	await expect(lists.locator('input, textarea, button')).toHaveCount(0);
	await page.locator('.house-reference').getByRole('link', { name: /^Producers/ }).click();
	await expect(page).toHaveURL(/\/menu\?view=producers$/);
	await expect(nav(page).locator('[aria-current="page"]')).toHaveText('House reference');
	await back(page).click();
	await expect(page).toHaveURL(/\/menu\?view=reference$/);
	await nav(page).getByRole('link', { name: 'Service rehearsal', exact: true }).click();
	const rehearsal = page.locator('.rehearsal');
	await expect(rehearsal).toBeVisible();
	for (const [label, href] of [
		['Menu flashcards', '/flashcards?deck=menu'],
		['Say it back', '/menu/quiz?mode=say'],
		['Guest at the table', '/menu/quiz?mode=guest']
	] as const) await expect(rehearsal.getByRole('link', { name: label, exact: true })).toHaveAttribute('href', href);
	await rehearsal.getByText('Choose a focused round', { exact: true }).click();
	for (const href of [
		'/menu/quiz?mode=drill', '/menu/quiz', '/menu/quiz?mode=pair', '/flashcards?deck=components', '/flashcards?deck=tastings',
		'/flashcards?deck=producers', '/flashcards?deck=foundations%3Atoday', '/flashcards?deck=fall%3Atoday'
	]) await expect(rehearsal.locator(`a[href="${href}"]`)).toBeVisible();
	await rehearsal.getByRole('link', { name: 'Say it back', exact: true }).click();
	await expect(page).toHaveURL(/\/menu\/quiz\?mode=say$/);
	await back(page).click();
	await expect(page).toHaveURL(/\/menu\?view=rehearse$/);
});

for (const width of [320, 390]) {
	for (const mode of ['day', 'night'] as const) {
		test(`all four learning views fit ${width}px in ${mode} service with usable disclosure controls`, async ({ page }) => {
			test.setTimeout(60_000);
			await page.setViewportSize({ width, height: 844 });
			await openHouse(page);
			await service(page, mode);
			for (const [name, path] of VIEWS) {
				await nav(page).getByRole('link', { name, exact: true }).click();
				await expect(page).toHaveURL(url => `${url.pathname}${url.search}` === path);
				await expect(page.locator('html')).toHaveAttribute('data-service', mode);
				await expect(nav(page).locator('[aria-current="page"]')).toHaveText(name);
				expect(await page.evaluate(() => document.documentElement.scrollWidth), `${name}: no horizontal page overflow`).toBeLessThanOrEqual(width);
				for (const control of await page.locator('nav.house-sections a, main details.menu-group > summary, main .house-learning details.learning-group > summary, main .houselists details > summary').all()) {
					if (!(await control.isVisible())) continue;
					const box = (await control.boundingBox())!;
					expect(box.height, `${name}: thumb-sized control`).toBeGreaterThanOrEqual(44);
					expect(box.x).toBeGreaterThanOrEqual(0);
					expect(box.x + box.width).toBeLessThanOrEqual(width + 0.5);
				}
			}
			await nav(page).getByRole('link', { name: 'Menu', exact: true }).click();
			expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
		});
	}
}
