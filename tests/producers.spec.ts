import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto, seedHouses } from './helpers';

/**
 * Who makes it (the producer deep dive, 6 October 2026), at a phone's 390 by
 * 844, on the fixture house src/lib/house/fixtures/house-min.json with three
 * producer profiles put on it here: a maker behind the chicken's salt crust,
 * an origin behind the Verjus and Tonic's verjus and a vineyard behind the
 * Harbour White and nothing else. The card's "Who makes it" block above
 * "What it's made of", a profile opening in full; the Producers view inside
 * My Menu with its groups (the verjus, behind a drink and no dish, At the
 * bar; the vineyard, behind a wine and no dish or drink, In the cellar under
 * its region) and its jump list, a dish chip opening the card and Back
 * returning to the view, a drink and a cellar wine as words (this standalone
 * build is off the shared origin, so no Ledger or Codex link is drawn; the
 * addresses are proved in study-producers.test.ts); the Producers deck on
 * the Flashcards tab, dealing the producers behind a dish only, and an
 * item's producer deck from the card; and a producer question in the menu
 * drill, never about the bar's or the cellar's. Every producer and place
 * here is invented for the invented house.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = JSON.parse(readFileSync(join(HERE, '../src/lib/house/fixtures/house-min.json'), 'utf8'));

function house() {
	const h = JSON.parse(JSON.stringify(FIXTURE));
	const ts = h.components[0].explain.ts;
	const mark = (value: unknown) => ({ value, by: 'person', ts });
	h.components[0].producer = mark({
		type: 'maker',
		who: 'Quay Salt Works',
		where: 'Quay Lane, Harbourside',
		founded: '1896',
		history: 'The salt works began on the quay, raking salt from the pans below the lamp store.\n\nIt still packs the coarse salt for the crust by hand.',
		facts: ['The salt is raked by hand from the pans.', 'It is the oldest firm on the quay.'],
		notes: ['Say the name slowly; guests ask where the quay is.'],
		sayIt: 'The salt for the crust comes from the Quay Salt Works, at the end of the lane.',
		askKitchen: ['Which week does the salt arrive?']
	});
	h.components[1].producer = mark({
		type: 'origin',
		who: 'The Quay Lane vineyards',
		where: 'Quay Lane, Harbourside',
		founded: '',
		history: 'The verjus is pressed from the first green grapes of the vineyards above the lane.',
		facts: ['The grapes are picked green, weeks before the harvest.'],
		notes: [],
		sayIt: 'The verjus is pressed from green grapes on the hill above us.',
		askKitchen: ['Which week is the verjus pressed?']
	});
	/* In the cellar: the Harbour White's vineyard, behind the wine and no dish or drink. */
	h.components.push({
		id: 'c-harbwin1',
		kind: 'ingredient',
		name: 'Harbour White',
		producer: mark({
			type: 'maker',
			who: 'Quay Lane Vineyard',
			where: 'The terraces above Quay Lane',
			founded: '1931',
			history: 'The vineyard climbs in terraces from the lane to the lamp store.',
			facts: ['The white is picked by hand on the terraces.'],
			notes: [],
			sayIt: 'The Harbour White is grown on the terraces above the lane.',
			askKitchen: ['Which vintage is open tonight?']
		}),
		itemIds: ['w-lantern1'],
		termIds: [],
		ts
	});
	return h;
}

/** A second dish producer, on the salad, for the drill's floor of two producers behind a dish. */
function withOrchard(h: ReturnType<typeof house>) {
	const ts = h.components[0].explain.ts;
	h.components.push({
		id: 'c-orchard1',
		kind: 'ingredient',
		name: 'Apples',
		producer: {
			value: {
				type: 'farm',
				who: 'Orchard Farm',
				where: 'Orchard Row',
				founded: '',
				history: 'The orchard grows the apples for the salad.',
				facts: ['The apples are picked the week they are served.'],
				notes: [],
				sayIt: 'The apples come from Orchard Farm, up the row.',
				askKitchen: []
			},
			by: 'person',
			ts
		},
		itemIds: ['d-beetrt01'],
		termIds: [],
		ts
	});
	return h;
}

const card = (page: Page) => page.locator('article.card');

async function openChicken(page: Page) {
	await seedHouses(page, [house()]);
	await goto(page, '/menu');
	await expect(page.locator('.study .row').first()).toBeVisible({ timeout: 15_000 });
	await page.locator('.study .row', { has: page.locator('.nm', { hasText: 'Lantern Roast Chicken' }) }).click();
	await expect(card(page).locator('#card-h')).toHaveText('Lantern Roast Chicken');
}

test.use({ viewport: { width: 390, height: 844 } });

test('the card says who makes it, above what it is made of, each producer opening to its profile in full', async ({ page }) => {
	await openChicken(page);
	const block = card(page).locator('section[aria-labelledby="whomakes-h"]');
	await expect(block.locator('h3')).toHaveText('Who makes it');
	const madeOf = card(page).locator('section[aria-labelledby="madeof-h"]');
	expect((await block.boundingBox())!.y).toBeLessThan((await madeOf.boundingBox())!.y);
	const salt = block.locator('li[data-producer="c-saltcrs1"]');
	await expect(salt.locator('summary')).toContainText('Quay Salt Works');
	await expect(salt.locator('summary')).toContainText('Salt crust');
	await expect(salt.locator('details')).not.toHaveAttribute('open', '');
	expect((await salt.locator('summary').boundingBox())!.height).toBeGreaterThanOrEqual(44);
	await salt.locator('summary').click();
	await expect(salt.locator('.pfacts')).toContainText('Quay Lane, Harbourside');
	await expect(salt.locator('.pfacts')).toContainText('1896');
	await expect(salt.locator('.psay')).toContainText('at the end of the lane');
	await expect(salt.locator('.para')).toHaveCount(2);
	await expect(salt.locator('.phead')).toHaveText(['Facts', 'The story', 'Notes for the floor', 'Ask the kitchen']);
	await expect(salt.locator('.pask li')).toHaveText(['Which week does the salt arrive?']);
	const box = (await block.boundingBox())!;
	expect(box.x + box.width).toBeLessThanOrEqual(390);
	for (const a of await block.locator('.links a').all()) expect((await a.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	await expect(block.locator('a', { hasText: 'Flash these producers' })).toHaveAttribute('href', /\/flashcards\?deck=item-producers%3Ad-chicken1&run=1$/);
	await expect(block.locator('a', { hasText: 'All producers' })).toHaveAttribute('href', /\/menu\?view=producers$/);
	// A dish no producer reaches draws no block.
	await page.locator('.backline button.back').click();
	await page.locator('.study .row', { has: page.locator('.nm', { hasText: 'Beetroot' }) }).click();
	await expect(card(page).locator('#card-h')).toContainText('Beetroot');
	await expect(card(page).locator('section[aria-labelledby="whomakes-h"]')).toHaveCount(0);
});

test('the Producers view lists its groups in full, a dish chip opens its card, and Back returns to the view', async ({ page }) => {
	await openChicken(page);
	await card(page).locator('a', { hasText: 'All producers' }).click();
	await expect(page).toHaveURL(/\/menu\?view=producers$/);
	const view = page.locator('section[aria-labelledby="producers-h"]');
	await expect(view.locator('h2')).toHaveText('The producers');
	// The verjus reaches a drink and no dish, so it is At the bar whatever its type; the vineyard
	// reaches a wine and no dish or drink, so it is In the cellar, its name under its region's heading.
	await expect(view.locator('h3.grouphead')).toHaveText(['Makers and farms', 'At the bar', 'In the cellar']);
	await expect(view.locator('h4.pname')).toHaveText(['Quay Salt Works', 'The Quay Lane vineyards']);
	await expect(view.locator('h4.regionhead')).toHaveText(['Harbourside']);
	await expect(view.locator('h5.pname')).toHaveText(['Quay Lane Vineyard']);
	const salt = view.locator('li[data-producer="c-saltcrs1"]');
	await expect(salt.locator('.psub')).toHaveText('Maker · Salt crust');
	await expect(salt).toContainText('It is the oldest firm on the quay.');
	await expect(view.locator('li[data-producer="c-verjus01"] .psub')).toHaveText('Origin · Verjus');
	// The questions are the kitchen's for a producer behind a dish and the bar's At the bar, as the Ledger heads them.
	await expect(salt.locator('.phead').last()).toHaveText('Ask the kitchen');
	await expect(view.locator('li[data-producer="c-verjus01"] .phead').last()).toHaveText('Ask the bar');
	await expect(view.locator('li[data-producer="c-verjus01"] .pask li')).toHaveText(['Which week is the verjus pressed?']);
	// The study list is not drawn under the view.
	await expect(page.locator('.study .row')).toHaveCount(0);
	const chip = salt.locator('button.chip', { hasText: 'Lantern Roast Chicken' });
	expect((await chip.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	await chip.click();
	await expect(card(page).locator('#card-h')).toHaveText('Lantern Roast Chicken');
	await expect(page).toHaveURL(/\/menu\?view=producers#d-chicken1$/);
	await page.locator('.backline button.back').click();
	await expect(view.locator('h2')).toHaveText('The producers');
	await expect(page).toHaveURL(/\/menu\?view=producers$/);
	await expect(card(page)).toHaveCount(0);
	// Once more by the phone's own gesture.
	await chip.click();
	await expect(card(page).locator('#card-h')).toHaveText('Lantern Roast Chicken');
	await page.goBack();
	await expect(view.locator('h2')).toHaveText('The producers');
	// Back from the view leaves it for the card it was opened from.
	await page.locator('.backline button.back').click();
	await expect(card(page).locator('#card-h')).toHaveText('Lantern Roast Chicken');
});

test('a drink is the Ledger\'s: At the bar it is listed, and behind a dish too it follows the dish chips, as words off the shared origin', async ({ page }) => {
	const h = house();
	// The salt crust now reaches the Collins as well as the chicken: a dish and a drink.
	h.components[0].itemIds = ['b-collins1', 'd-chicken1'];
	await seedHouses(page, [h]);
	await goto(page, '/menu?view=producers');
	const view = page.locator('section[aria-labelledby="producers-h"]');
	await expect(view.locator('h2')).toHaveText('The producers', { timeout: 15_000 });
	await expect(view.locator('h3.grouphead')).toHaveText(['Makers and farms', 'At the bar', 'In the cellar']);
	const groupOf = (key: string) => view.locator(`ul[aria-labelledby="pg-${key}"]`);
	// Behind a dish and a drink: in its food group, the dish a chip, then the drink.
	const salt = groupOf('makers').locator('li[data-producer="c-saltcrs1"]');
	await expect(salt.locator('.chips > *')).toHaveText(['Lantern Roast Chicken', 'The Lantern Collins']);
	await expect(salt.locator('button.chip')).toHaveText(['Lantern Roast Chicken']);
	const collins = salt.locator('[data-drink="c-saltcrs1:b-collins1"]');
	await expect(collins).toHaveClass(/words/);
	expect(await collins.evaluate((el) => el.tagName)).toBe('SPAN');
	expect((await collins.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	// At the bar: the verjus, its drink in words, no chip that would open the Table's card.
	const verjus = groupOf('bar').locator('li[data-producer="c-verjus01"]');
	await expect(verjus.locator('.psub')).toHaveText('Origin · Verjus');
	await expect(verjus.locator('[data-drink="c-verjus01:b-verjus01"]')).toHaveText('Verjus and Tonic');
	await expect(verjus.locator('button.chip')).toHaveCount(0);
	// Off the shared origin no room is linked, by rule.
	await expect(view.locator('a[href*="/ledger/"]')).toHaveCount(0);
	const box = (await view.boundingBox())!;
	expect(box.x + box.width).toBeLessThanOrEqual(390);
});

test('the Producers deck deals the producers behind a dish under My restaurant, and the card\'s link deals the dish\'s own', async ({ page }) => {
	await openChicken(page);
	await card(page).locator('a', { hasText: 'Flash these producers' }).click();
	await expect(page).toHaveURL(/\/flashcards\?deck=item-producers/);
	const frame = page.locator('.rcard');
	await expect(frame.locator('.term')).toHaveText('Quay Salt Works: where, and since when?', { timeout: 15_000 });
	await expect(frame.locator('.kkind')).toHaveText('Producers');
	await page.getByRole('button', { name: 'Flip' }).click();
	await expect(frame.locator('.def.back')).toHaveText('Quay Lane, Harbourside. Founded 1896.');
	await page.getByRole('button', { name: 'Got it' }).click();
	await expect(frame.locator('.term')).toHaveText('Quay Salt Works: one thing to know');
	await page.getByRole('button', { name: 'Flip' }).click();
	await page.getByRole('button', { name: 'Got it' }).click();
	await expect(frame.locator('.term')).toHaveText('Quay Salt Works: which dishes?');
	await page.getByRole('button', { name: 'Flip' }).click();
	await expect(frame.locator('.def.back')).toHaveText('Lantern Roast Chicken.');
	await page.getByRole('button', { name: 'Again' }).click();
	await expect(page.locator('.summaryline')).toHaveText('2 got it, 1 to see again.');

	await goto(page, '/flashcards');
	const deck = page.locator('nav[aria-labelledby="fc-house"] [data-deck="producers"]');
	await expect(deck.locator('.door-name')).toHaveText('Producers');
	// The producers behind a dish only: the salt works' three cards. The verjus is the bar's and the
	// vineyard the cellar's, dealt in their own rooms.
	await expect(deck.locator('.door-line')).toHaveText('3 cards · 2 learnt');
	expect((await deck.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	await deck.click();
	await expect(page.locator('h1')).toHaveText('Producers');
	await page.getByRole('button', { name: 'Start' }).click();
	for (let i = 0; i < 3; i++) {
		await expect(page.locator('.rcard .term')).toHaveText(/^Quay Salt Works: /);
		await page.getByRole('button', { name: 'Flip' }).click();
		await expect(page.locator('.rcard .def.back')).not.toContainText(/Verjus|vineyard|Harbour White/i);
		await page.getByRole('button', { name: 'Got it' }).click();
	}
	await expect(page.locator('.summaryline')).toHaveText('3 got it.');
});

test('the menu drill asks about the producers behind a dish when the Producers view sends it there, never the bar\'s or the cellar\'s', async ({ page }) => {
	await seedHouses(page, [withOrchard(house())]);
	await goto(page, '/menu?view=producers');
	const view = page.locator('section[aria-labelledby="producers-h"]');
	await expect(view.locator('h2')).toHaveText('The producers', { timeout: 15_000 });
	await view.locator('a', { hasText: 'Quiz the producers behind the dishes' }).click();
	await expect(page).toHaveURL(/\/menu\/quiz\?mode=drill&subject=producer$/);
	const kinds = page.locator('.kinds');
	await expect(kinds.locator('button', { hasText: 'Which dish uses it' })).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 });
	await expect(kinds.locator('button', { hasText: 'Producer, not yet' })).toBeDisabled();
	await expect(kinds.locator('button[aria-pressed="true"]')).toHaveCount(1);
	await page.getByRole('button', { name: /^Deal/ }).click();
	const q = page.locator('.flash.drill');
	// Two producers stand behind a dish, so the round is two questions: the salt works and the orchard.
	const RIGHT: Record<string, [string, string]> = {
		'Quay Salt Works': ['Lantern Roast Chicken', 'at the end of the lane'],
		'Orchard Farm': ['Beetroot and Apple Salad', 'up the row']
	};
	const asked: string[] = [];
	for (let n = 1; n <= 2; n++) {
		await expect(q.locator('.eyebrow')).toContainText(`Which dish or drink uses this producer? · question ${n} of 2`);
		const stem = (await q.locator('.quizdef').textContent())!.trim();
		expect(Object.keys(RIGHT)).toContain(stem);
		asked.push(stem);
		await expect(q.locator('.opt')).toHaveCount(4);
		for (const o of await q.locator('.opt').allTextContents()) expect(o.trim()).not.toMatch(/Quay Lane Vineyard|The Quay Lane vineyards/);
		await q.locator('.opt', { hasText: RIGHT[stem][0] }).click();
		await expect(q.locator('.answer')).toContainText('Right.');
		await expect(q.locator('.answer')).toContainText(RIGHT[stem][1]);
		await q.getByRole('button', { name: n === 2 ? /^Finish/ : /^Next/ }).click();
	}
	expect(asked.sort()).toEqual(['Orchard Farm', 'Quay Salt Works']);
	await expect(page.locator('.flash[role="status"] .term')).toHaveText('2 right of 2');
});

test('In the cellar lists each vineyard under its region, its wines as words off the shared origin, and the jump lists reach it', async ({ page }) => {
	const h = house();
	// A second wine from another region, and its own vineyard, so the cellar draws two regions.
	h.wines.push({ ...JSON.parse(JSON.stringify(h.wines[0])), id: 'w-ridge001', name: 'Ridge Red 2021', producer: 'Ridge Row Vines', wine: 'Ridge Red', vintage: '2021', region: 'Upper Ridge, Ridge Country, Lanternland' });
	h.components.push({
		...JSON.parse(JSON.stringify(h.components[2])),
		id: 'c-ridgewn1',
		name: 'Ridge Red',
		itemIds: ['w-ridge001']
	});
	h.components[3].producer.value = { ...h.components[3].producer.value, who: 'Ridge Row Vines', where: 'Ridge Country', sayIt: 'The red is from the ridge.' };
	await seedHouses(page, [h]);
	await goto(page, '/menu?view=producers');
	const view = page.locator('section[aria-labelledby="producers-h"]');
	await expect(view.locator('h2')).toHaveText('The producers', { timeout: 15_000 });
	// The regions in the order of their headings, a vineyard under each.
	await expect(view.locator('h4.regionhead')).toHaveText(['Harbourside', 'Ridge Country, Lanternland']);
	const region = (key: string) => view.locator(`ul[aria-labelledby="pr-${key}"]`);
	const quay = region('harbourside').locator('li[data-producer="c-harbwin1"]');
	await expect(quay.locator('h5.pname')).toHaveText('Quay Lane Vineyard');
	await expect(quay.locator('.psub')).toHaveText('Maker · Harbour White');
	await expect(quay.locator('h6.onmenu')).toHaveText('On the wine list');
	// Its questions are the sommelier's.
	await expect(quay.locator('.phead').last()).toHaveText('Ask the sommelier');
	await expect(quay.locator('.pask li')).toHaveText(['Which vintage is open tonight?']);
	// The wine is words off the shared origin: no chip for the Table's card, no Codex link.
	const white = quay.locator('[data-wine="c-harbwin1:w-lantern1"]');
	await expect(white).toHaveText('Quay Lane Harbour White 2024');
	await expect(white).toHaveClass(/words/);
	expect(await white.evaluate((el) => el.tagName)).toBe('SPAN');
	expect((await white.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	await expect(quay.locator('button.chip')).toHaveCount(0);
	await expect(view.locator('a[href*="/codex/"]')).toHaveCount(0);
	await expect(region('ridge-country-lanternland').locator('h5.pname')).toHaveText(['Ridge Row Vines']);

	// The jump list names every group, the cellar with them, and a jump leaves the address alone.
	const jump = view.locator('nav.jump');
	await expect(jump.locator('button')).toHaveCount(3);
	await expect(jump.locator('button[data-jump="cellar"]')).toContainText('In the cellar');
	for (const b of await jump.locator('button').all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	await jump.locator('button[data-jump="cellar"]').click();
	await expect(view.locator('#pg-cellar')).toBeFocused();
	await expect(view.locator('#pg-cellar')).toBeInViewport();
	await expect(page).toHaveURL(/\/menu\?view=producers$/);
	// The cellar's own index of regions, closed until asked for.
	const index = view.locator('details.regions');
	await expect(index.locator('summary')).toHaveText('Jump to a region (2)');
	await expect(index).not.toHaveAttribute('open', '');
	await index.locator('summary').click();
	await index.locator('button[data-jump-region="ridge-country-lanternland"]').click();
	await expect(view.locator('#pr-ridge-country-lanternland')).toBeFocused();
	await expect(view.locator('#pr-ridge-country-lanternland')).toBeInViewport();
	await expect(page).toHaveURL(/\/menu\?view=producers$/);
	const box = (await view.boundingBox())!;
	expect(box.x + box.width).toBeLessThanOrEqual(390);
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
