import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto, seedHouses } from './helpers';

/**
 * The house's videos in Kitchen studies and the Watch block on a dish's card,
 * at a phone's 390 by 844, on the
 * fixture house src/lib/house/fixtures/house-min.json with two more videos
 * put on it here. A video is a link out and never a player: no iframe, no
 * video element, no request to a video host on load, every link a new tab
 * with rel noopener, and the words say a video needs a connection. The
 * popup's navigation is answered by a stub, so the suite never reaches the
 * network.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = JSON.parse(readFileSync(join(HERE, '../src/lib/house/fixtures/house-min.json'), 'utf8'));
const NOTE = 'Each video opens on YouTube or Vimeo in a new tab, and needs a connection.';

function house() {
	const h = JSON.parse(JSON.stringify(FIXTURE));
	const base = h.videos[0];
	h.videos.push(
		{ ...base, id: 'v-housestr', url: 'https://youtu.be/bbbbbbbbbbb', title: 'The Lantern Room, a History', channel: 'Harbour Television', mins: 12, topic: 'The house', why: 'The room and the people who built it, the story a first visit asks for.', itemIds: [], termIds: [], house: true },
		{ ...base, id: 'v-collins1', url: 'https://vimeo.com/123456', title: 'Building a Collins', channel: 'The Bar Book', mins: 0, topic: 'The bar', why: 'The build of a long drink, so the glass and the order make sense.', itemIds: ['b-collins1'], termIds: [], house: false }
	);
	return h;
}

const card = (page: Page) => page.locator('article.card');

async function openStudy(page: Page, hostHits: string[]) {
	page.on('request', (r) => {
		if (/youtube\.com|youtu\.be|vimeo\.com|ytimg\.com|vimeocdn\.com/.test(r.url())) hostHits.push(r.url());
	});
	await seedHouses(page, [house()]);
	await goto(page, '/menu');
	await expect(page.locator('.studyhead')).toBeVisible({ timeout: 15_000 });
}

async function openDishRow(page: Page, name: string) {
	const row = page.locator('.study .row', { has: page.locator('.nm', { hasText: name }) });
	const group = page.locator('details.menu-group').filter({ has: page.locator('.row .nm', { hasText: name }) });
	if (!(await group.evaluate((element: HTMLDetailsElement) => element.open))) {
		await group.locator(':scope > summary').click();
	}
	await row.click();
}

test.use({ viewport: { width: 390, height: 844 } });

test('Kitchen studies lists every video by topic, the house first, each a link out', async ({ page }) => {
	const hits: string[] = [];
	await openStudy(page, hits);
	// The menu remains compact; the learning resources have their own view.
	await expect(page.locator('details#study-videos')).toHaveCount(0);
	await expect(page.locator('.study details.menu-group[open]')).toHaveCount(0);
	await page.locator('nav.house-sections').getByRole('link', { name: 'Kitchen studies', exact: true }).click();
	await expect(page).toHaveURL(/\/menu\?view=learn$/);
	const entry = page.locator('details#study-videos');
	await expect(entry.locator(':scope > summary')).toContainText('Service videos');
	await expect(entry.locator(':scope > summary .count')).toHaveText('3 videos');
	await expect(entry).toHaveJSProperty('open', false);
	await expect(page.locator('.house-learning > details[open]')).toHaveCount(0);
	expect((await entry.locator(':scope > summary').boundingBox())!.height).toBeGreaterThanOrEqual(44);

	await entry.locator(':scope > summary').click();
	await expect(entry).toContainText(NOTE);
	await expect(entry.locator('.video-group h3')).toHaveText(['The house · 1', 'The kitchen · 1', 'The bar · 1']);
	const links = entry.locator('a.vt');
	await expect(links).toHaveCount(3);
	for (const a of await links.all()) {
		await expect(a).toHaveAttribute('target', '_blank');
		await expect(a).toHaveAttribute('rel', 'noopener');
		expect(await a.getAttribute('href')).toMatch(/^https:\/\/(www\.youtube\.com|youtu\.be|vimeo\.com)\//);
		expect((await a.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	}
	await expect(links.first()).toContainText('The Lantern Room, a History');
	await expect(entry.locator('li[data-video="v-housestr"] .meta')).toHaveText('Harbour Television, 12 min');
	await expect(entry.locator('li[data-video="v-collins1"] .meta')).toHaveText('The Bar Book');
	await expect(entry.locator('li[data-video="v-collins1"] .for')).toContainText('The Lantern Collins');

	// The dish a video teaches opens its card from the list.
	const opener = entry.locator('li[data-video="v-saltbak1"] .for button', { hasText: 'Lantern Roast Chicken' });
	await expect(opener).toHaveAttribute('data-focus', /^learning-video:v-saltbak1:/);
	await opener.click();
	await expect(card(page).locator('#card-h')).toHaveText('Lantern Roast Chicken');
	await page.locator('.backline button.back').click();
	await expect(page).toHaveURL(/\/menu\?view=learn$/);
	await expect(entry).toHaveJSProperty('open', true);
	await expect(opener).toBeFocused();

	expect(await page.locator('iframe, video').count()).toBe(0);
	expect(hits, 'no request to a video host until a person taps').toEqual([]);
});

test('a dish card carries a Watch block whose link opens a new tab, and nothing plays on the page', async ({ page, context }) => {
	const hits: string[] = [];
	await context.route(/^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\//, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>stub</title>' }));
	await openStudy(page, hits);
	await openDishRow(page, 'Lantern Roast Chicken');
	const watch = card(page).locator('section[aria-labelledby="watch-h"]');
	await expect(watch.locator('h3')).toHaveText('Watch');
	await expect(watch).toContainText(NOTE);
	const link = watch.locator('a.vt');
	await expect(link).toHaveCount(1);
	await expect(link).toHaveAttribute('href', 'https://www.youtube.com/watch?v=aaaaaaaaaaa');
	await expect(link).toHaveAttribute('rel', 'noopener');
	await expect(watch.locator('.meta')).toHaveText('The Lantern Kitchen, 6 min');
	expect(await page.locator('iframe, video').count()).toBe(0);
	expect(hits).toEqual([]);

	const [popup] = await Promise.all([page.waitForEvent('popup'), link.click()]);
	await popup.waitForLoadState();
	expect(popup.url()).toBe('https://www.youtube.com/watch?v=aaaaaaaaaaa');
	// The card is still here, where it was: the video opened beside it, not in its place.
	await expect(card(page).locator('#card-h')).toHaveText('Lantern Roast Chicken');
	await popup.close();

	// A dish can inherit a video through a shared technique as well as a direct link.
	// The layout's Back closes the card (the consolidation): one way back.
	await page.locator('.backline button.back').click();
	await openDishRow(page, 'Beetroot');
	await expect(card(page).locator('#card-h')).toContainText('Beetroot');
	// The beetroot is salt baked: the video names the term, and the term reaches the dish.
	await expect(card(page).locator('section[aria-labelledby="watch-h"] a.vt')).toHaveCount(1);
});

test('a house with no videos draws no Videos entry and no Watch block', async ({ page }) => {
	const h = house();
	delete h.videos;
	await seedHouses(page, [h]);
	await goto(page, '/menu');
	await expect(page.locator('.studyhead')).toBeVisible({ timeout: 15_000 });
	await page.locator('nav.house-sections').getByRole('link', { name: 'Kitchen studies', exact: true }).click();
	await expect(page).toHaveURL(/\/menu\?view=learn$/);
	await expect(page.locator('details#study-videos')).toHaveCount(0);
	await page.locator('nav.house-sections').getByRole('link', { name: 'Menu', exact: true }).click();
	await openDishRow(page, 'Lantern Roast Chicken');
	await expect(card(page).locator('#card-h')).toBeVisible();
	await expect(card(page).locator('section[aria-labelledby="watch-h"]')).toHaveCount(0);
});
