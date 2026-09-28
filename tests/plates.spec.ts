import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto } from './helpers';
import type { Plate } from '../src/lib/types';

/**
 * The Plates, as a reader meets them: the wall, one plate's page with its
 * picture, its corrections, its text and its quiz, the level page's door,
 * the deck landing's links and a card's door to the plate it is drawn on.
 *
 * What the engine decides is unit-tested (src/lib/plates.test.ts). What this
 * proves is that the PAGES say it, and that the quiz records nothing.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const PLATES = JSON.parse(readFileSync(join(HERE, '..', 'src', 'lib', 'data', 'plates.json'), 'utf8')) as { plates: Plate[] };
const LEVELS = JSON.parse(readFileSync(join(HERE, '..', 'src', 'lib', 'data', 'levels.json'), 'utf8')) as {
	levels: Array<{ level: number; name: string }>;
	items: Record<string, Record<string, string[]>>;
	counts: Record<string, Record<string, number>>;
};

const withCorrection = PLATES.plates.find((p) => p.corrections.length) ?? PLATES.plates[0];
const cardOnPlate = (() => {
	for (const p of PLATES.plates) for (const g of p.groups) for (const it of g.items) if (it.links?.deck) return { plate: p, id: it.links.deck };
	return null;
})();

test('the wall lists every plate in its five rows, with its level and its count', async ({ page }) => {
	await goto(page, '/plates');
	await expect(page.locator('h1')).toHaveText('The Plates');
	await expect(page.locator('ul.wall li')).toHaveCount(PLATES.plates.length);
	await expect(page.getByRole('heading', { level: 2 })).toHaveCount(5);
	const first = page.locator('ul.wall li').first();
	// a level is named, never numbered
	await expect(first.locator('.pmeta')).toHaveText(new RegExp(`^(?:${LEVELS.levels.map((l) => l.name).join('|')}) · `));
	await expect(first.locator('.pmeta')).not.toHaveText(/\bLevel\b/);
	await expect(first.locator('.pmeta')).toHaveText(/6 illustrated subjects/);
	await expect(page.locator('.note')).toContainText('463 entries');
	// the thumbnails are pictures: lazy, sized, decorative (the title is the text)
	await expect(first.locator('img')).toHaveAttribute('loading', 'lazy');
	await expect(first.locator('img')).toHaveAttribute('alt', '');
});

test('a plate teaches six subjects and preserves every original entry and correction in its archive', async ({ page, request }) => {
	const p = withCorrection;
	await goto(page, `/plates/${p.slug}`);
	await expect(page.locator('h1')).toHaveText(p.teaching.title);
	const img = page.locator('figure.plate img');
	await expect(img).toHaveAttribute('alt', /six illustrated subjects/);
	await expect(img).toHaveAttribute('src', new RegExp(`/plates/${p.slug}-v2\\.webp$`));
	await expect(page.locator('.subjects > li')).toHaveCount(6);
	await expect(page.locator('.illustration-key > li')).toHaveCount(6);
	await expect(page.locator('.subject h3')).toHaveText(p.teaching.subjects.map(subject => subject.name));
	await expect(page.locator('.sources li')).toHaveCount(p.teaching.sources.length);
	const archive = page.locator('details.poster-archive');
	await expect(archive).not.toHaveAttribute('open');
	await archive.locator('summary').click();
	if (p.corrections.length) {
		await expect(archive.locator('.archive-corrections li')).toHaveCount(p.corrections.length);
		await expect(archive.locator('.archive-corrections h3')).toHaveText('Recorded correction notes');
		await expect(archive.locator('.archive-note').first()).toContainText('unresolved or conflicting claims');
	}
	await expect(page.locator('.items li')).toHaveCount(p.count);
	const linked = p.groups.flatMap((g) => g.items).filter((it) => it.links?.deck).length;
	if (linked) await expect(page.locator('.items a', { hasText: 'The card' }).first()).toHaveAttribute('href', /service\/deck\/study\?card=fd_\d{4}$/);
	// the text is in the HTML before any script runs
	const html = await (await request.get(`/plates/${p.slug}`)).text();
	expect(html).toContain(p.groups[0].items[0].name);
	expect(html).toContain(p.teaching.subjects[0].summary);
});

test('the image viewer supports zoom keys, Escape and return focus without navigation', async ({ page }) => {
	await goto(page, `/plates/${PLATES.plates[0].slug}`);
	const opener = page.getByRole('button', { name: 'Enlarge illustration' });
	await opener.click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await page.keyboard.press('+');
	await expect(dialog.locator('.zoom-value')).toHaveText('150%');
	await page.keyboard.press('0');
	await expect(dialog.locator('.zoom-value')).toHaveText('100%');
	await page.keyboard.press('Escape');
	await expect(dialog).not.toBeVisible();
	await expect(opener).toBeFocused();
	expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});

test('the complete illustration and its key stay in view beside a desktop lesson', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 714 });
	await goto(page, '/plates/beef-cuts');
	await page.locator('.subject').nth(2).scrollIntoViewIfNeeded();
	const picture = page.locator('.illustration-box > img');
	await expect(picture).toHaveCSS('object-fit', 'contain');
	const layout = await picture.evaluate(image => {
		const img = image as HTMLImageElement;
		const rect = img.getBoundingClientRect();
		const box = img.parentElement!.getBoundingClientRect();
		const lastKey = document.querySelector('.illustration-key li:last-child')!.getBoundingClientRect();
		return {
			image: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom, height: rect.height },
			box: { top: box.top, left: box.left, right: box.right, bottom: box.bottom },
			keyBottom: lastKey.bottom,
			viewport: innerHeight,
			overflow: document.documentElement.scrollWidth > innerWidth
		};
	});
	// Contain only protects the entire artwork when the image element itself
	// fits the frame; intrinsic grid sizing previously pushed its final row out.
	expect(layout.image.height).toBeGreaterThan(200);
	expect(layout.image.top).toBeGreaterThanOrEqual(0);
	expect(layout.image.top).toBeCloseTo(layout.box.top, 0);
	expect(layout.image.left).toBeCloseTo(layout.box.left, 0);
	expect(layout.image.right).toBeCloseTo(layout.box.right, 0);
	expect(layout.image.bottom).toBeCloseTo(layout.box.bottom, 0);
	expect(layout.image.bottom).toBeLessThan(layout.keyBottom);
	expect(layout.keyBottom).toBeLessThanOrEqual(layout.viewport);
	expect(layout.overflow).toBe(false);
});

test('a missing illustration leaves the teaching guide usable and the phone page inside its gutters', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 800 });
	await page.route('**/plates/*-v2.webp', route => route.abort());
	await goto(page, '/plates/beef-cuts');
	await expect(page.locator('.image-unavailable')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Enlarge illustration' })).toBeDisabled();
	await expect(page.locator('.subjects > li')).toHaveCount(6);
	await expect(page.locator('.subject h3').first()).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test('moving to a neighbouring plate clears a running quiz and closes the archive', async ({ page }) => {
	await goto(page, `/plates/${PLATES.plates[0].slug}`);
	await page.getByRole('button', { name: 'Ask me about this plate' }).click();
	await page.locator('.opts .opt').first().click();
	await page.locator('.poster-archive summary').click();
	await page.locator('.neighbours a').filter({ hasText: /^Next:/ }).click();
	await expect(page.locator('h1')).toHaveText(PLATES.plates[1].teaching.title);
	await expect(page.locator('.quiz .flash')).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Ask me about this plate' })).toBeVisible();
	await expect(page.locator('.poster-archive')).not.toHaveAttribute('open');
});

test('a teaching subject keeps its exact same-plate study link outside the archive', async ({ page }) => {
	await goto(page, '/plates/beef-cuts');
	const hanger = page.locator('.subject').filter({ has: page.getByRole('heading', { name: 'Hanger Steak', exact: true }) });
	await expect(hanger.getByRole('link', { name: 'Practise in the deck: Hanger Steak' })).toHaveAttribute('href', /\/service\/deck\/study\?card=fd_0088$/);
	await expect(page.locator('.poster-archive')).not.toHaveAttribute('open');
	await goto(page, '/plates/pork-cuts');
	const tenderloin = page.locator('.subject').filter({ has: page.getByRole('heading', { name: 'Tenderloin', exact: true }) });
	await expect(tenderloin.locator('.subject-links')).toHaveCount(0);
});

test('the quiz asks from the plate, ends on how it went, and records nothing', async ({ page }) => {
	const p = PLATES.plates[0];
	await goto(page, `/plates/${p.slug}`);
	await page.getByRole('button', { name: 'Ask me about this plate' }).click();
	for (let i = 0; i < 12; i++) {
		if (await page.locator('.flash .term').count()) break;
		await page.locator('.opts .opt').first().waitFor();
		await page.locator('.opts .opt').first().click();
		await page.locator('.flashtools .chip.go').click();
	}
	await expect(page.locator('.flash .term')).toHaveText(/^\d+ of \d+$/);
	const log = await page.evaluate(
		() =>
			new Promise<number>((resolve) => {
				const open = indexedDB.open('world-table');
				open.onsuccess = () => {
					const get = open.result.transaction('state', 'readonly').objectStore('state').getAll();
					get.onsuccess = () => resolve((get.result as Array<{ drillLog?: unknown[] }>).reduce((n, v) => n + (v?.drillLog?.length ?? 0), 0));
					get.onerror = () => resolve(0);
				};
				open.onerror = () => resolve(0);
			})
	);
	expect(log).toBe(0);
});

test('a level page lists its plates, read and never graded, with a door to the first and to the wall', async ({ page }) => {
	await goto(page, '/level/1');
	const sub = page.locator('ol.subsections .subsection#plates');
	await expect(sub.locator('h2')).toHaveText('The Plates');
	await expect(sub.locator('.line')).toHaveText(new RegExp(`${LEVELS.counts['1'].plates} at this level`));
	await expect(sub.locator('.line')).toContainText('Read, never graded');
	await expect(sub.locator('a.train', { hasText: 'The wall' })).toHaveAttribute('href', /\/plates$/);
	await sub.locator('details summary').click();
	await expect(sub.locator('details li a').first()).toHaveAttribute('href', new RegExp(`/plates/${LEVELS.items.plates['1'][0]}$`));
	await expect(sub.locator('details li a').first()).not.toHaveText(/-/);
});

test('Chef says plainly that every plate is read at the levels below', async ({ page }) => {
	await goto(page, '/level/4');
	const sub = page.locator('ol.subsections .subsection#plates');
	await expect(sub.locator('.line')).toContainText('every plate is read at the levels below');
	await expect(sub.locator('a.train', { hasText: 'The wall' })).toBeVisible();
});

test('the deck landing and a card link to the plates that draw them', async ({ page }) => {
	await goto(page, '/service/deck');
	await page.locator('.plated li').first().waitFor();
	const sectionsWithPlates = new Set(PLATES.plates.flatMap((p) => p.deckSections));
	await expect(page.locator('.plated li')).toHaveCount(sectionsWithPlates.size);
	await expect(page.locator('.plated a').first()).toHaveAttribute('href', /\/plates\/[a-z-]+$/);

	test.skip(!cardOnPlate, 'no card on any plate');
	await goto(page, `/service/deck/study?card=${cardOnPlate!.id}`);
	await expect(page.locator('.further a', { hasText: 'On the plate' })).toHaveAttribute('href', new RegExp(`/plates/${cardOnPlate!.plate.slug}$`));
});
