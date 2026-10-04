import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto } from './helpers';

/**
 * The primers, as a reader meets them: a level's reader with one primer per
 * subsection that has one, its cites as links that resolve, the "Read first"
 * doors on the level page, and the door back from a primer to its training
 * doors.
 *
 * What the gate decides is unit-tested (src/lib/primers.test.ts). What this
 * proves is that the PAGES say it, and that nothing is recorded by reading.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, '..', 'src', 'lib', 'data', 'primers.json');
const PRIMERS = (existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : { primers: [] }) as {
	primers: Array<{ level: number; subsection: string; lede: string; paragraphs: string[]; cites: Array<{ slug: string; name: string; href: string }>; next: string }>;
};
const LEVELS = JSON.parse(readFileSync(join(HERE, '..', 'src', 'lib', 'data', 'levels.json'), 'utf8')) as {
	levels: Array<{ level: number; name: string }>;
	subsections: Array<{ key: string; title: string }>;
	counts: Record<string, Record<string, number>>;
};
const at = (n: number) => PRIMERS.primers.filter((p) => p.level === n);
const first = PRIMERS.primers[0] ?? null;

test('a level reader carries one primer per subsection that has one, in the level page order, its text in the HTML', async ({ page }) => {
	test.skip(!first, 'no primer is written yet');
	const n = first!.level;
	const mine = at(n);
	await goto(page, `/level/${n}/read`);
	await expect(page.locator('h1')).toHaveText(LEVELS.levels.find((l) => l.level === n)!.name);
	// a level is named, never numbered: not in the crumbs, the neighbours or a primer's prose
	await expect(page.locator('body')).not.toContainText(/\bLevels? (?:I|II|III|IV)\b/);
	await expect(page.locator('.view > .eyebrow')).toHaveText('Read first');
	await expect(page.locator('ol.primers .primer')).toHaveCount(mine.length);
	const order = LEVELS.subsections.map((s) => s.key).filter((k) => mine.some((p) => p.subsection === k));
	const ids = await page.locator('ol.primers .primer').evaluateAll((els) => els.map((e) => e.id));
	expect(ids).toEqual(order);
	await expect(page.locator('.toc a')).toHaveCount(mine.length);
	const html = await page.content();
	expect(html).toContain(first!.paragraphs[0].slice(0, 60));
	for (const p of mine) {
		const sec = page.locator(`ol.primers .primer#${p.subsection}`);
		await expect(sec.locator('h2')).toHaveText(LEVELS.subsections.find((s) => s.key === p.subsection)!.title);
		await expect(sec.locator('.count')).toHaveText(`${LEVELS.counts[String(n)][p.subsection]} at this level`);
		await expect(sec.locator('.para')).toHaveCount(p.paragraphs.length);
		await expect(sec.locator('.cites a')).toHaveCount(p.cites.length);
		await expect(sec.locator('.doors a.train')).toHaveAttribute('href', new RegExp(`/level/${n}#${p.subsection}$`));
	}
});

test('a cite is a link to the item the level page would open', async ({ page }) => {
	test.skip(!first, 'no primer is written yet');
	await goto(page, `/level/${first!.level}/read`);
	const sec = page.locator(`ol.primers .primer#${first!.subsection}`);
	const c = first!.cites[0];
	const a = sec.locator('.cites a').first();
	await expect(a).toHaveText(c.name);
	await expect(a).toHaveAttribute('href', new RegExp(`${c.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
	await a.click();
	await expect(page).not.toHaveURL(/\/read/);
	await expect(page.locator('h1')).toBeVisible();
});

test('the level page\'s Next reading opens the first primed subsection not yet met, and the Library lists the readers', async ({ page }) => {
	test.skip(!first, 'no primer is written yet');
	const n = first!.level;
	// The primers' doors moved with the consolidation: Next reading on the level
	// page (the first primed subsection, in the level page's order, not yet met)
	// and What {Level} asks on the Library.
	const firstKey = LEVELS.subsections.map((s) => s.key).find((k) => at(n).some((p) => p.subsection === k));
	await goto(page, `/level/${n}`);
	await expect(page.locator('[data-door="next"]')).toHaveAttribute('href', new RegExp(`/level/${n}/read#${firstKey}$`));
	await goto(page, '/library');
	await expect(page.locator('a.door', { hasText: /What .+ asks/ }).first()).toHaveAttribute('href', /\/level\/\d\/read$/);
});

test('reading records nothing', async ({ page }) => {
	test.skip(!first, 'no primer is written yet');
	await goto(page, `/level/${first!.level}/read`);
	await page.locator('ol.primers .primer').first().waitFor();
	const log = await page.evaluate(
		() =>
			new Promise<number>((resolve) => {
				const open = indexedDB.open('world-table');
				open.onsuccess = () => {
					try {
						const get = open.result.transaction('state', 'readonly').objectStore('state').getAll();
						get.onsuccess = () => resolve((get.result as Array<Record<string, unknown[]>>).reduce((n, v) => n + Object.values(v ?? {}).reduce((m, x) => m + (Array.isArray(x) ? x.length : 0), 0), 0));
						get.onerror = () => resolve(0);
					} catch {
						resolve(0);
					}
				};
				open.onerror = () => resolve(0);
			})
	);
	expect(log).toBe(0);
});

test('a level with nothing written says so and still links its level page', async ({ page }) => {
	const empty = [1, 2, 3, 4].find((n) => at(n).length === 0);
	test.skip(!empty, 'every level has a reader');
	await goto(page, `/level/${empty}/read`);
	await expect(page.locator('.empty')).toContainText('Nothing is written for this level yet');
	await expect(page.locator('.neighbours a', { hasText: 'page' })).toHaveAttribute('href', new RegExp(`/level/${empty}$`));
});
