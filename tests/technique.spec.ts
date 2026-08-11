import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto } from './helpers';
import type { Technique } from '../src/lib/types';

// Read rather than import: Playwright's ESM loader wants an import attribute
// for JSON, and parity.spec.ts already reads its fixtures this way.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const techniques: Technique[] = JSON.parse(
	readFileSync(join(ROOT, 'src', 'lib', 'data', 'techniques.json'), 'utf8')
);

/**
 * The technique spine.
 *
 * The guide derived a `techniques` array onto all 970 recipes and then rendered
 * it nowhere — the only consumer was a YouTube search link. Meanwhile the
 * Lexicon's 33 hand-written technique definitions reached 72 recipes total,
 * because crosslinks.mjs caps a term at three. These tests guard the join
 * between the two: the keyword table decides which recipes demonstrate a skill,
 * the Lexicon explains it, and every page is real HTML on disk.
 */

test('the index lists every live technique, split by whether it has a definition', async ({
	page
}) => {
	await goto(page, '/technique');
	await expect(page.locator('.tile')).toHaveCount(techniques.length);

	// Anchored entries advertise the Lexicon term that defines them.
	const anchored = techniques.filter((t) => t.lexiconSlug).length;
	await expect(page.locator('.tile .anchor')).toHaveCount(anchored);
});

test('a technique page carries its Lexicon definition and every tagged dish', async ({ page }) => {
	const braising = techniques.find((t) => t.slug === 'braising');
	expect(braising, 'Braising must survive as a technique').toBeTruthy();
	expect(braising!.lexiconSlug).toBe('braising-and-stewing');

	await goto(page, '/technique/braising');

	// The definition is the Lexicon's, not invented prose for this page.
	await expect(page.locator('.definition .body')).toContainText('Combination cooking');
	await expect(page.locator('.definition .more')).toHaveAttribute(
		'href',
		/\/lexicon#braising-and-stewing$/
	);

	// The complete set — this is the whole point. The Lexicon term itself links
	// to ONE recipe; the technique page must carry all of them.
	await expect(page.locator('.grid .card')).toHaveCount(braising!.recipes.length);
	expect(braising!.recipes.length).toBeGreaterThan(10);
});

test('a recipe links out to the skills it demonstrates, and the link resolves', async ({ page }) => {
	// Ragù braises; the chip must reach a page that lists it back.
	await goto(page, '/recipe/ragu-alla-bolognese');
	const chips = page.locator('.skills a');
	expect(await chips.count()).toBeGreaterThan(0);

	const href = await chips.first().getAttribute('href');
	await goto(page, href!.replace(/^.*\/technique\//, '/technique/'));
	await expect(page.locator('.grid .card')).not.toHaveCount(0);
});

test('technique pages are real files, so a cold deep link works with no JavaScript', async ({
	browser
}) => {
	const ctx = await browser.newContext({ javaScriptEnabled: false });
	const page = await ctx.newPage();
	await page.goto('/technique/braising');

	// No hydration wait: this asserts the prerendered HTML alone is complete.
	await expect(page.locator('h1')).toHaveText('Braising');
	await expect(page.locator('.grid .card').first()).toBeVisible();
	await ctx.close();
});

/**
 * The Path of Study join.
 *
 * The curriculum shipped a reading list but no account of its own technique
 * content, so the semester called "The Braise" could not say that it drills
 * searing harder than braising — which it does, because a braise IS
 * sear-then-simmer.
 */
test('a semester lists the skills its dishes drill, heaviest first', async ({ page }) => {
	await goto(page, '/study');

	const braise = page.locator('.semester').nth(3);
	await expect(braise.locator('h2')).toHaveText('The Braise');

	const skills = braise.locator('.skills a');
	expect(await skills.count()).toBeGreaterThan(5);

	// Derived weight, not authored order: searing outranks braising here.
	await expect(skills.first()).toContainText('Searing');
	await expect(skills.first()).toHaveAttribute('href', /\/technique\/searing-the-hard-crust$/);
});

test('a technique names the semesters that teach it', async ({ page }) => {
	await goto(page, '/technique/braising');
	await expect(page.locator('.taught')).toContainText('Semester 4 — The Braise');
	// The separator regressed once to "Braise,Semester" under Svelte whitespace
	// trimming; assert the space survives.
	await expect(page.locator('.taught')).not.toContainText(',Semester');
});

test('a dish can be marked cooked from the technique page, and it sticks', async ({ page }) => {
	await goto(page, '/technique/braising');
	await expect(page.locator('.progress')).toContainText('0 marked cooked');

	await page.locator('.mark').first().click();
	await expect(page.locator('.progress')).toContainText('1 marked cooked');

	// Structural actions write through immediately — no debounce to lose.
	await goto(page, '/technique/braising');
	await expect(page.locator('.progress')).toContainText('1 marked cooked');
	await expect(page.locator('.mark[aria-pressed="true"]')).toHaveCount(1);
});

test('no technique page ships empty', async () => {
	const empty = techniques.filter((t) => t.recipes.length === 0);
	expect(empty, `empty technique pages: ${empty.map((t) => t.label).join(', ')}`).toHaveLength(0);
});
