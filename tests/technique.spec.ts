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

test('a technique page states the standard it is judged by, where the Path of Study sends people', async ({
	page
}) => {
	// 60 of the 110 techniques carry one; braising is one of them.
	const standards: { slug: string; marks: { id: string; text: string }[]; fault: string }[] =
		JSON.parse(readFileSync(join(ROOT, 'src', 'lib', 'data', 'technique-standards.json'), 'utf8'));
	const braising = standards.find((s) => s.slug === 'braising');
	expect(braising, 'Braising must keep a technique standard').toBeTruthy();

	await goto(page, '/technique/braising');

	await expect(page.locator('.standard .sec')).toHaveText('How to tell it is going right');
	await expect(page.locator('.standard .marks li')).toHaveCount(braising!.marks.length);
	// The prose is the authored standard, not a paraphrase written for this page.
	await expect(page.locator('.standard .marks li').first()).toHaveText(braising!.marks[0].text);
	await expect(page.locator('.standard .fault')).toContainText(braising!.fault);

	// It sits above the dishes: the lesson before the places to practise it.
	const standardBox = await page.locator('.standard').boundingBox();
	const firstChapter = await page.locator('.grid').first().boundingBox();
	expect(standardBox!.y).toBeLessThan(firstChapter!.y);
});

test('a technique with no standard renders no empty block', async ({ page }) => {
	const standards: { slug: string }[] = JSON.parse(
		readFileSync(join(ROOT, 'src', 'lib', 'data', 'technique-standards.json'), 'utf8')
	);
	const slugs = new Set(standards.map((s) => s.slug));
	const without = techniques.find((t) => !slugs.has(t.slug));
	expect(without, 'half the techniques still have no standard').toBeTruthy();

	await goto(page, `/technique/${without!.slug}`);
	await expect(page.locator('.standard')).toHaveCount(0);
});

test('the round trip: a judged dish links here, and here now says the same thing', async ({
	page
}) => {
	/* The whole point of the change. Braised Collard Greens has no standard of
	   its own and is judged on braising, so its page shows braising's marks and
	   links to /technique/braising, which carried the link back and none of the
	   prose. Both ends must now read identically. */
	await goto(page, '/recipe/braised-collard-greens');
	const judged = page.locator('.standard.judged');
	await expect(judged).toHaveCount(1);

	const link = judged.locator('.judgedlabel a', { hasText: 'Braising' }).first();
	await expect(link).toHaveAttribute('href', /\/technique\/braising$/);
	const onRecipe = await judged
		.locator('.judgedblock', { has: page.locator('a[href$="/technique/braising"]') })
		.locator('.marks li')
		.allTextContents();
	expect(onRecipe.length).toBeGreaterThan(0);

	await link.click();
	await expect(page.locator('h1')).toHaveText('Braising');
	const onTechnique = await page.locator('.standard .marks li').allTextContents();
	expect(onTechnique).toEqual(onRecipe);
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
	// Either separator: the sweep that replaced em dashes with colons broke this
	// assertion, and the thing worth pinning is the semester, not the punctuation.
	await expect(page.locator('.taught')).toContainText(/Semester 4[:\u2014-] The Braise/);
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
