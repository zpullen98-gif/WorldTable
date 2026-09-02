import { test, expect } from '@playwright/test';
import { goto } from './helpers';

/**
 * The phone layout, which nothing pinned.
 *
 * The survey called this "a twenty-minute layout bundle: phone gutters, chapter
 * headings, 320px reflow", and all three turned out to be real and none of
 * them was covered by a single assertion - no screenshot tests exist and no
 * spec measured a gutter, so six routes shipped with their text touching the
 * glass (`.view { padding: 26px 0 80px }` zeroed the inline padding and beat
 * .shell's 20px), the recipes toolbar ran glass-to-glass on 172 pages, the
 * family form scrolled sideways at 320 (fr tracks floor at an input's ~163px
 * intrinsic width), and /safety overflowed on a nowrap attribution.
 *
 * One page load, resized in place - four extra specs in parallel once starved
 * /recipes hydration and failed seven bystanders (see nav.spec.ts).
 */
const GUTTER_ROUTES = ['/family', '/lexicon', '/menu', '/menu/quiz', '/pantry', '/study', '/safety'];

test('every route fits a 320px phone with its gutters on', async ({ page }) => {
	test.setTimeout(120_000);
	await page.setViewportSize({ width: 320, height: 800 });
	for (const route of GUTTER_ROUTES) {
		await goto(page, route);
		const m = await page.evaluate(() => {
			const de = document.documentElement;
			const h1 = document.querySelector('.shell h1, h1');
			return {
				scrollW: de.scrollWidth,
				h1Left: h1 ? Math.round(h1.getBoundingClientRect().left) : null
			};
		});
		expect(m.scrollW, `${route} must not scroll sideways`).toBe(320);
		expect(m.h1Left, `${route} h1 must sit on the 20px gutter, not the glass`).toBe(20);
	}
});

test('the recipes toolbar sits inside the shell, not on the glass', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 800 });
	await goto(page, '/chapter/french');
	const left = await page
		.locator('.search input')
		.evaluate((el) => Math.round(el.getBoundingClientRect().left));
	expect(left).toBe(20);
});

/**
 * The anchor contract: a cross-page lexicon link lands ON its heading, below
 * the sticky bar. Global smooth scroll used to strand this jump thousands of
 * pixels short (the lexicon is ~150,000px tall on a phone), and before
 * scroll-padding existed a completed jump put the heading fully under the
 * two-row mode bar.
 */
test('a cross-page lexicon anchor lands on its term, visible below the bar', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 800 });
	await goto(page, '/lexicon');
	await page.evaluate(() => {
		location.hash = '#nutmeg-and-mace';
	});
	await page.waitForTimeout(400);
	const m = await page.evaluate(() => {
		const card = document.getElementById('nutmeg-and-mace');
		const bar = document.querySelector('.modebar');
		const cr = card?.getBoundingClientRect();
		const br = bar?.getBoundingClientRect();
		return {
			cardTop: cr ? Math.round(cr.top) : null,
			barBottom: br ? Math.round(br.bottom) : null,
			inViewport: cr ? cr.top >= 0 && cr.top < window.innerHeight : false
		};
	});
	expect(m.inViewport, 'the card must be in the viewport, not stranded mid-page').toBe(true);
	expect(m.cardTop, 'the card must clear the sticky bar').toBeGreaterThanOrEqual(m.barBottom ?? 0);
});

/**
 * Dishes come before the rail on a phone.
 *
 * Under 820px the rail is static and fully open for the active group, and it
 * rendered BEFORE the content column: on /chapter/italian at 375x667 a 2,012px
 * rail sat between the toolbar and the first dish, 2.9 screens below the fold;
 * a US chapter with two groups open put it seven screens down. Every chapter
 * page, every phone, and the empty state item 26 exists to deliver would have
 * been buried under the same rail.
 */
test('on a phone the first dish comes before the chapter rail', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 667 });
	await goto(page, '/chapter/italian');
	const m = await page.evaluate(() => {
		const card = document.querySelector('.card')!.getBoundingClientRect();
		const rail = document.querySelector('.rail')!.getBoundingClientRect();
		return { cardTop: Math.round(card.top), railTop: Math.round(rail.top), fold: window.innerHeight };
	});
	expect(m.cardTop, 'the first dish must sit above the rail').toBeLessThan(m.railTop);
	expect(m.cardTop, 'and within the first two screens').toBeLessThan(m.fold * 2);
});
