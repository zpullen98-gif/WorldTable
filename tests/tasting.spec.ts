import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto } from './helpers';

/**
 * The two Brennan's tasting menus at the top of My Menu, at a phone's 390 by
 * 844, from the shipped pack served through page.route as study.spec.ts
 * serves it: two separate cards, Traditional Breakfast at Brennan's and the
 * Dinner Tasting Menu, each in the exact order the house prints it (the
 * owner's paste of 5 October 2026), the choice of, both pairing labels, the
 * breakfast's drinks line and the dinner's supplement, the section chip and
 * the meal filter, a dish and a pour each opening its study card, Back
 * returning to the button that opened it, and the Tasting courses deck.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const PACK_TEXT = readFileSync(join(HERE, '../static/shared/packs/brennans-new-orleans.v1.oothouse.json'), 'utf8');
const PACK = JSON.parse(PACK_TEXT).house;
const SHOTS = process.env.STUDY_SHOTS ?? '/tmp/claude-0/-home-user-zpullen98-gif-github-io/09201eae-82ec-5cba-9316-4d6cf5955e5e/scratchpad/shots/';

const BREAKFAST = 'Traditional Breakfast at Brennan’s';
const DINNER = 'Dinner Tasting Menu';
const idOf = (name: string): string => [...PACK.dishes, ...PACK.wines, ...PACK.cocktails].find((i: { name: string }) => i.name === name).id;
const BREAKFAST_ID = PACK.tastings.find((t: { name: string }) => t.name === BREAKFAST).id;
const DINNER_ID = PACK.tastings.find((t: { name: string }) => t.name === DINNER).id;

test.use({ viewport: { width: 390, height: 844 } });

async function openStudy(page: Page) {
	await page.route('**/shared/packs/brennans-new-orleans.v1.oothouse.json', (route) =>
		route.fulfill({ status: 200, contentType: 'application/json', body: PACK_TEXT })
	);
	await goto(page, '/menu');
	await expect(page.locator('.study .tmenu').first()).toBeVisible({ timeout: 15_000 });
}

const menu = (page: Page, id: string) => page.locator(`.study .tmenu[data-tasting="${id}"]`);

/** A phone screenshot with the element's top just under the sticky search bar, so nothing is drawn over it. */
async function shotFrom(page: Page, selector: string, name: string) {
	await page.locator(selector).evaluate((el) => {
		el.scrollIntoView({ block: 'start' });
		const bar = document.querySelector('.study .bar');
		window.scrollBy(0, -((bar ? bar.getBoundingClientRect().bottom : 0) + 8));
	});
	await page.waitForTimeout(150);
	await page.screenshot({ path: SHOTS + name });
}
const card = (page: Page) => page.locator('article.card');

/**
 * The card opened from a tasting says that tasting first: its course and the
 * course's own pour sit right under the name, wholly on the first screen at
 * 390 by 844, and no 'Pour:' line (the dish's pour off the list) comes before
 * them in the card or on that screen.
 */
async function tastingFirst(page: Page, lines: string[]) {
	const c = card(page);
	await expect(c.locator('.tcourse .tcline')).toHaveText(lines);
	const box = (await c.locator('.tcourse').boundingBox())!;
	expect(box.y + box.height).toBeLessThanOrEqual(844);
	const before = await c.evaluate((el) => {
		const first = el.querySelector('.tcourse .tcline')!;
		const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
		const ahead: string[] = [];
		for (let n = walk.nextNode(); n; n = walk.nextNode()) {
			if (!/\bPour:/.test(n.textContent ?? '')) continue;
			if (first.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_PRECEDING) ahead.push((n.textContent ?? '').trim());
		}
		return ahead;
	});
	expect(before).toEqual([]);
	await expect(c.locator('.pourline')).toHaveCount(0);
}

test('two separate tasting menus at the top of My Menu, each in the exact printed order', async ({ page }) => {
	await openStudy(page);
	const menus = page.locator('.study .tmenu');
	await expect(menus).toHaveCount(2);
	await expect(menus.locator('h4')).toHaveText([BREAKFAST, DINNER]);
	await expect(menus.locator('.tprice')).toHaveText(['$80', '$80']);
	await expect(page.locator('#sg-tastings')).toHaveText('Tasting menus · 2');
	// The block comes before every section of the list.
	const blockY = (await page.locator('.study .tastings').boundingBox())!.y;
	expect(blockY).toBeLessThan((await page.locator('.study .row').first().boundingBox())!.y);

	const b = menu(page, BREAKFAST_ID);
	await expect(b.locator('.tline')).toHaveText('Celebrating 80 Years in 2026! Price includes tasting portions of each course and all drinks listed.');
	await expect(b.locator('.tterms')).toHaveText('Every drink listed is included in the price.');
	await expect(b.locator('.clabel')).toHaveText(['Eye Opener Cocktail', 'First Course', 'Second Course', 'Third Course', 'Fourth Course', 'Fifth Course']);
	await expect(b.locator('.titem .tname')).toHaveText([
		'Brandy Milk Punch',
		'Baked Apple',
		'Turtle Soup',
		'Seafood Gumbo',
		'Bloody Bull Cocktail',
		'Eggs Hussarde',
		'Charles Lafitte Brut Champagne FR NV [4oz]',
		'Petite Filet Mignon',
		'Domaine De Châteaumar ‘Cuvée Vincent’ Côtes Du Rhône FR 2023 [4oz]',
		'World Famous Bananas Foster',
		'Brennan’s Private Blend Congregation Coffee & Chicory'
	]);
	// The second course is a choice of, and only the second.
	await expect(b.locator('.choice')).toHaveCount(1);
	const second = b.locator('.course[data-n="3"]');
	await expect(second.locator('.choice')).toHaveText('choice of');
	await expect(second.locator('.titem.dish .tname')).toHaveText(['Turtle Soup', 'Seafood Gumbo']);
	// Paired with over every breakfast pour; the eye opener is the drink itself, with no label.
	await expect(b.locator('.plabel')).toHaveText(['Paired with', 'Paired with', 'Paired with', 'Paired with']);
	await expect(b.locator('.course[data-n="1"] .plabel')).toHaveCount(0);
	await expect(b.locator('.course[data-n="1"] .printed')).toHaveText('Brandy, Heavy Cream, Vanilla Bean, Nutmeg');
	await expect(b.locator('.course[data-n="4"] .printed')).toHaveText('Housemade English Muffin, Coffee-cured Canadian Bacon, Hollandaise, Poached Egg, Marchand De Vin Sauce');
	// The coffee course opens the house's chicory coffee.
	await expect(b.locator('.course[data-n="6"] .titem.pour')).toHaveAttribute('data-id', idOf('New Orleans-Style Coffee with Chicory'));

	const d = menu(page, DINNER_ID);
	await expect(d.locator('.tline')).toHaveText('Celebrating 80 Years in 2026! Add Wine Pairing Supplement [4oz pours] $120');
	await expect(d.locator('.tterms')).toHaveText('Add Wine Pairing Supplement, 4 Ounce Wine Pours $120.00');
	await expect(d.locator('.clabel')).toHaveText(['First Course', 'Second Course', 'Third Course', 'Fourth Course', 'Fifth Course']);
	await expect(d.locator('.titem.dish .tname')).toHaveText(['Grand Isle Jewel Oysters', 'Louisiana BBQ Lobster', 'Redfish Véronique', 'Roasted Rohan Duck Breast', 'The Snickers']);
	await expect(d.locator('.titem.pour .tname')).toHaveText([
		'Charles Lafitte Brut Champagne FR NV',
		'Fichet Château London Mâcon-Igé Burgundy FR Chardonnay 2024',
		'Louis Jadot 1er Cru Beaune, Burgundy FR Pinot Noir 2023',
		'Paul Hobbs Coombsville Napa Valley Cabernet Sauvignon 2021',
		'Domaine La Tour Vieille Reserva Banyuls FR NV'
	]);
	await expect(d.locator('.plabel')).toHaveText(['Suggested Pairing', 'Suggested Pairing', 'Suggested Pairing', 'Suggested Pairing', 'Suggested Pairing']);
	await expect(d.locator('.choice')).toHaveCount(0);
	await expect(page.locator('.study .tastings')).not.toContainText('ChampaPAgne');

	// Every control in the block at least 44px, nothing wider than the phone.
	const short = await page.evaluate(() =>
		[...document.querySelectorAll<HTMLElement>('.study .tastings button, .study .tastings a, .study .tastings summary')]
			.filter((el) => el.offsetParent !== null)
			.map((el) => ({ t: (el.textContent || '').trim().slice(0, 30), h: el.getBoundingClientRect().height }))
			.filter((x) => x.h < 44)
	);
	expect(short).toEqual([]);
	expect(await page.evaluate(() => document.scrollingElement!.scrollWidth)).toBeLessThanOrEqual(390);

	await page.evaluate(() => window.scrollTo(0, 0));
	await page.screenshot({ path: SHOTS + 'tm-first-screen.png' });
	await shotFrom(page, `.study .tmenu[data-tasting="${BREAKFAST_ID}"]`, 'tm-breakfast-1.png');
	await shotFrom(page, `.study .tmenu[data-tasting="${BREAKFAST_ID}"] .course[data-n="4"]`, 'tm-breakfast-2.png');
	await shotFrom(page, `.study .tmenu[data-tasting="${DINNER_ID}"]`, 'tm-dinner-1.png');
	await shotFrom(page, `.study .tmenu[data-tasting="${DINNER_ID}"] .course[data-n="3"]`, 'tm-dinner-2.png');
});

test('the Tasting menus chip shows the block alone, another section hides it, and the meal filter keeps each menu to its meal', async ({ page }) => {
	await openStudy(page);
	const chip = page.getByRole('button', { name: 'Tasting menus 2' });
	await chip.click();
	await expect(chip).toHaveAttribute('aria-pressed', 'true');
	await expect(page.locator('.study .tmenu')).toHaveCount(2);
	await expect(page.locator('.study .row')).toHaveCount(0);
	await expect(page.locator('.study [aria-live="polite"]')).toHaveText('Showing Tasting menus: 2 menus');

	await page.getByRole('button', { name: 'Entrées 14' }).click();
	await expect(page.locator('.study .tastings')).toHaveCount(0);
	await page.getByRole('button', { name: `All ${PACK.dishes.length}` }).click();

	await page.getByRole('button', { name: 'Breakfast & lunch', exact: true }).click();
	await expect(page.locator('.study .tmenu h4')).toHaveText([BREAKFAST]);
	await page.getByRole('button', { name: 'Dinner', exact: true }).click();
	await expect(page.locator('.study .tmenu h4')).toHaveText([DINNER]);
	await page.getByRole('button', { name: 'All day' }).click();
	await expect(page.locator('.study .tmenu h4')).toHaveText([BREAKFAST, DINNER]);

	// A dish only a tasting serves is not a loose row, but a search still finds it.
	await expect(page.locator('.study .row[data-id="' + idOf('Baked Apple') + '"]')).toHaveCount(0);
	await page.getByPlaceholder('Find a dish').fill('baked apple');
	await expect(page.locator('.study .row')).toHaveCount(1);
	await expect(page.locator('.study .tastings')).toHaveCount(0);
});

test('a dish and a pour open their study cards, walk the menu in printed order, and Back returns to the button', async ({ page }) => {
	await openStudy(page);
	const b = menu(page, BREAKFAST_ID);
	const hussarde = b.locator('.course[data-n="4"] .titem.dish');
	await hussarde.scrollIntoViewIfNeeded();
	await hussarde.click();
	const c = card(page);
	await expect(c.locator('h2')).toHaveText('Eggs Hussarde');
	await expect(c.locator('.backline .pos')).toHaveText(`6 of 11 in ${BREAKFAST}`);
	// The tasting first: the menu, the course as printed and its own pour, under the name; the
	// Piper-Heidsieck the list pours with the dish is further down, headed as the à la carte pour.
	await expect(c.locator('.tcourse .eyebrow')).toHaveText(`${BREAKFAST} · $80`);
	await tastingFirst(page, ['Third Course. Paired with Charles Lafitte Brut Champagne FR NV [4oz]']);
	await expect(c.locator('.tcourse')).toContainText('Every drink listed is included in the price.');
	await expect(c.locator('#pour-h')).toHaveText('Pour with it, à la carte');
	await page.locator('.studyslot').evaluate((el) => el.scrollIntoView({ block: 'start' }));
	await page.screenshot({ path: SHOTS + 'tm-dish-card.png' });
	await expect(c.locator('.tasting')).toContainText(`On the ${BREAKFAST}: Third Course. Paired with Charles Lafitte Brut Champagne FR NV [4oz]`);
	// Next is the next thing the menu serves: the Champagne poured with it.
	await c.locator('.backline').getByRole('button', { name: /^Next/ }).click();
	await expect(c.locator('h2')).toHaveText('Charles Lafitte Brut Champagne NV');
	await page.locator('.backline button.back').click();
	await expect(card(page)).toHaveCount(0);
	await expect(hussarde).toBeFocused();

	// A pour on the dinner menu opens its own card here: the wine, where the tastings pour it.
	const d = menu(page, DINNER_ID);
	const jadot = d.locator('.course[data-n="3"] .titem.pour');
	await jadot.scrollIntoViewIfNeeded();
	await jadot.click();
	await expect(c.locator('h2')).toHaveText('Louis Jadot Beaune 1er Cru 2023');
	await expect(c.locator('.backline .pos')).toHaveText(`6 of 10 in ${DINNER}`);
	await expect(c.locator('.tasting')).toHaveText(`Poured on the ${DINNER}: Third Course`);
	await expect(c.locator('#pourfacts-h')).toHaveText('The wine');
	await expect(c.getByRole('button', { name: /^Edit/ })).toHaveCount(0);
	// Poured only on the tastings: the pour is a sentence under the name, not a price tag beside it.
	await expect(c.locator('.price')).toHaveCount(0);
	await expect(c.locator('.pouredon')).toHaveText(/^Poured on the .+, 4 oz$/);
	expect(await page.evaluate(() => document.scrollingElement!.scrollWidth)).toBeLessThanOrEqual(390);
	await page.locator('.studyslot').evaluate((el) => el.scrollIntoView({ block: 'start' }));
	await page.screenshot({ path: SHOTS + 'tm-pour-card.png' });
	await page.goBack();
	await expect(card(page)).toHaveCount(0);
	await expect(jadot).toBeFocused();

	// The eye opener is a drink course: its button opens the Brandy Milk Punch.
	await b.locator('.course[data-n="1"] .titem.drink').click();
	await expect(c.locator('h2')).toHaveText('Brandy Milk Punch');
	await expect(c.locator('.tcourse .tcline')).toHaveText(['Eye Opener Cocktail']);
	await expect(c.locator('#pourfacts-h')).toHaveText('In the glass');
	await page.locator('.backline button.back').click();
	await expect(card(page)).toHaveCount(0);

	// A course that prints no pour says so, and the list's half-bottle is not on the first screen.
	await b.locator('.course[data-n="2"] .titem.dish').click();
	await expect(c.locator('h2')).toHaveText('Baked Apple');
	await tastingFirst(page, ['First Course. The menu prints no pairing for this course.']);
	await page.locator('.backline button.back').click();
	await expect(card(page)).toHaveCount(0);
	// The coffee, not the list's dessert wine, is the Foster's pour on the breakfast.
	const foster = b.locator('.course[data-n="6"] .titem.dish');
	await foster.scrollIntoViewIfNeeded();
	await foster.click();
	await expect(c.locator('h2')).toHaveText('World Famous Bananas Foster');
	await tastingFirst(page, ['Fifth Course. Paired with Brennan’s Private Blend Congregation Coffee & Chicory']);
	await page.locator('.backline button.back').click();
	await expect(card(page)).toHaveCount(0);
	// The dinner's oysters: the suggested pairing and the supplement, not the list's Champagne.
	const oysters = d.locator('.course[data-n="1"] .titem.dish');
	await oysters.scrollIntoViewIfNeeded();
	await oysters.click();
	await expect(c.locator('h2')).toHaveText('Grand Isle Jewel Oysters');
	await expect(c.locator('.tcourse .eyebrow')).toHaveText(`${DINNER} · $80`);
	await tastingFirst(page, ['First Course. Suggested Pairing: Charles Lafitte Brut Champagne FR NV']);
	await expect(c.locator('.tcourse')).toContainText('Add Wine Pairing Supplement, 4 Ounce Wine Pours $120.00');
	await page.locator('.backline button.back').click();
	await expect(card(page)).toHaveCount(0);

	// From the list, the same dish is the list's: its pour line first, no tasting block.
	await page.getByRole('button', { name: 'Entrées 14' }).click();
	await page.locator('.study .row', { has: page.locator('.nm', { hasText: 'Eggs Hussarde' }) }).click();
	await expect(c.locator('h2')).toHaveText('Eggs Hussarde');
	await expect(c.locator('.tcourse')).toHaveCount(0);
	await expect(c.locator('.pourline')).toContainText('Pour: Brennan’s Essential by Piper-Heidsieck Extra Brut NV');
	await expect(c.locator('#pour-h')).toHaveText('Pour with it');
});

test('the Tasting courses deck deals one card per course in printed order, under My restaurant', async ({ page }) => {
	await openStudy(page);
	await menu(page, DINNER_ID).getByRole('link', { name: /^Flash the courses/ }).click();
	await expect(page).toHaveURL(new RegExp(`/flashcards\\?deck=tasting%3A${DINNER_ID}&run=1$`));
	const deck = page.locator('.deckframe');
	const fronts = ['First Course', 'Second Course', 'Third Course', 'Fourth Course', 'Fifth Course'].map((l) => `Dinner Tasting Menu: ${l}`);
	for (let i = 0; i < fronts.length; i++) {
		await expect(deck.locator('.where')).toHaveText(`Card ${i + 1} of 5 · Dinner Tasting Menu: the courses`);
		await expect(deck.locator('.scard .term')).toHaveText(fronts[i]);
		await page.getByRole('button', { name: 'Flip' }).click();
		if (i === 2) await expect(deck.locator('.scard .back')).toHaveText('Redfish Véronique. Suggested Pairing: Louis Jadot 1er Cru Beaune, Burgundy FR Pinot Noir 2023');
		await page.getByRole('button', { name: 'Got it', exact: true }).click();
	}
	await expect(page.locator('main h1')).toHaveText('Deck done');
	const slot = await page.evaluate(() => JSON.parse(localStorage.getItem('oot-house-drilled-v1') || '[]'));
	expect(slot.map((e: { k: string }) => e.k)).toContain(`house:${PACK.id}:${DINNER_ID}:card-tasting-3`);

	// Back to My Menu, then the whole deck under My restaurant: eleven cards, breakfast first.
	await page.locator('.backline button.back').click();
	await expect(page).toHaveURL(/\/menu$/);
	await goto(page, '/flashcards');
	const door = page.locator('button.door[data-deck="tastings"]');
	await expect(door.locator('.door-name')).toHaveText('Tasting courses');
	await expect(door.locator('.door-line')).toHaveText(/^11 cards · 5 learnt$/);
	// Tasting courses sits next to the whole menu, and the dishes only the tastings serve have no
	// section door of their own: no 'Tasting menus' deck mixing the two menus out of course order.
	const names = await page.locator('nav[aria-labelledby="fc-house"] .door-name').allTextContents();
	expect(names.slice(0, 2)).toEqual(['The whole menu', 'Tasting courses']);
	expect(names).not.toContain('Tasting menus');
	await expect(page.locator('button.door[data-deck="menu:Tasting menus"]')).toHaveCount(0);
	await expect(page.locator('button.door[data-deck="menu:Entrées"]')).toHaveCount(1);
	await page.locator('#fc-house').evaluate((el) => el.scrollIntoView({ block: 'start' }));
	await page.screenshot({ path: SHOTS + 'tm-flashcards-doors.png' });
	await door.click();
	await page.getByRole('button', { name: 'Start' }).click();
	await expect(deck.locator('.where')).toHaveText('Card 1 of 11 · Tasting courses');
	await expect(deck.locator('.scard .term')).toHaveText('Traditional Breakfast: Eye Opener Cocktail');
	await page.getByRole('button', { name: 'Flip' }).click();
	await expect(deck.locator('.scard .back')).toHaveText('Brandy Milk Punch');
	await page.getByRole('button', { name: 'Got it', exact: true }).click();
	await expect(deck.locator('.scard .term')).toHaveText('Traditional Breakfast: First Course');
	await page.getByRole('button', { name: 'Flip' }).click();
	await page.getByRole('button', { name: 'Got it', exact: true }).click();
	await page.getByRole('button', { name: 'Flip' }).click();
	await expect(deck.locator('.scard .back')).toHaveText('Choice of Turtle Soup or Seafood Gumbo. Paired with Bloody Bull Cocktail');
});
