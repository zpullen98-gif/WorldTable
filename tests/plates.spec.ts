import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto } from './helpers';

/**
 * The Plates, as a reader meets them: the wall, one plate's page with its
 * picture, its corrections, its text and its quiz, the level page's door,
 * the deck landing's links and a card's door to the plate it is drawn on.
 *
 * What the engine decides is unit-tested (src/lib/plates.test.ts). What this
 * proves is that the PAGES say it, and that the quiz records nothing.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const PLATES = JSON.parse(readFileSync(join(HERE, '..', 'src', 'lib', 'data', 'plates.json'), 'utf8')) as {
	plates: Array<{ slug: string; title: string; count: number; corrections: unknown[]; deckSections: string[]; groups: Array<{ items: Array<{ name: string; links?: { deck?: string } }> }> }>;
};
const LEVELS = JSON.parse(readFileSync(join(HERE, '..', 'src', 'lib', 'data', 'levels.json'), 'utf8')) as {
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
	await expect(first.locator('.pmeta')).toHaveText(/Level [IV]+/);
	await expect(first.locator('.pmeta')).toHaveText(/\d+ on the plate/);
	// the thumbnails are pictures: lazy, sized, decorative (the title is the text)
	await expect(first.locator('img')).toHaveAttribute('loading', 'lazy');
	await expect(first.locator('img')).toHaveAttribute('alt', '');
});

test('a plate page shows its picture, names what it gets wrong, transcribes it whole and links its cards', async ({ page }) => {
	const p = withCorrection;
	await goto(page, `/plates/${p.slug}`);
	await expect(page.locator('h1')).toHaveText(p.title);
	const img = page.locator('figure.plate img');
	await expect(img).toHaveAttribute('alt', new RegExp(p.title));
	await expect(img).toHaveAttribute('src', new RegExp(`/plates/${p.slug}\\.webp$`));
	await expect(page.locator('figcaption a')).toHaveAttribute('target', '_blank');
	if (p.corrections.length) {
		await expect(page.locator('.corrections li')).toHaveCount(p.corrections.length);
		await expect(page.locator('.corrections h2')).toHaveText('What the plate gets wrong');
	}
	await expect(page.locator('.items li')).toHaveCount(p.count);
	const linked = p.groups.flatMap((g) => g.items).filter((it) => it.links?.deck).length;
	if (linked) await expect(page.locator('.items a', { hasText: 'The card' }).first()).toHaveAttribute('href', /service\/deck\/study\?card=fd_\d{4}$/);
	// the text is in the HTML before any script runs
	const html = await page.content();
	expect(html).toContain(p.groups[0].items[0].name);
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

test('Level IV says plainly that every plate is read by Level III', async ({ page }) => {
	await goto(page, '/level/4');
	const sub = page.locator('ol.subsections .subsection#plates');
	await expect(sub.locator('.line')).toContainText('every plate is read by Level III');
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
