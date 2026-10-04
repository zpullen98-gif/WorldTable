import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto, seedSession } from './helpers';

/**
 * The four levels, as a reader meets them: the home's four cards and four
 * doors, a level's page, its test, and the two doors that closed.
 *
 * Everything the engine decides is unit-tested (src/lib/levels.test.ts). What
 * this proves is that the PAGES say it: that a new reader sees Untouched four
 * times and Commis as theirs, that a record moves the word and the figure and
 * the reader's level, that a level is named and never numbered anywhere a
 * reader meets it (the owner, 27 Sep 2026), that a level page lists its eight
 * subsections with a count and a door each, that the test sits to its end
 * and ends on what was missed with no number, and that the two retired hubs
 * are honestly gone.
 *
 * The answer keys come from the shipped data files, read the way the deck
 * spec reads them: a test sat "right" needs to know the right answers, and a
 * test sat "wrong" needs to avoid them.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const data = (name: string) => JSON.parse(readFileSync(join(HERE, '..', 'src', 'lib', 'data', name), 'utf8'));

const LEVELS = data('levels.json') as {
	levels: Array<{ level: number; name: string }>;
	items: Record<string, Record<string, string[]>>;
	moduleTerms: Record<string, string[]>;
	tastes: string[];
};
const DECK = data('floor-deck.json') as { cards: Array<{ id: string; term: string; gist: string }> };
const DRILLS = data('drills.json') as { cards: Array<{ slug: string; term: string; prompt: string }> };
const LEXICON = data('lexicon.json') as Array<{ slug: string; term: string; definition: string }>;
const TECHNIQUES = data('techniques.json') as Array<{ slug: string; recipes: string[] }>;

const DAY = 86_400_000;
const NAMES = LEVELS.levels.map((l) => l.name);

/** Everything at Commis met, the way the app itself would have written it. */
function level1Seed() {
	const now = Date.now();
	const items = LEVELS.items;
	const recipeOf = new Map(TECHNIQUES.map((t) => [t.slug, t.recipes[0]]));
	const cookedLog = [
		...items.dishes['1'].map((slug) => ({ slug, at: now - 2 * DAY })),
		...items.techniques['1'].map((slug) => ({ slug: recipeOf.get(slug), at: now - 2 * DAY, grade: 'met' })),
		{ slug: items.dishes['1'][0], at: now - DAY, fault: 'flat' },
		{ slug: items.dishes['1'][0], at: now - DAY, fault: 'salty' }
	];
	const serviceTerms = items.service['1'].flatMap((m) => LEVELS.moduleTerms[m]);
	// half a day ago: the term ladder's first rung is two days, and a record
	// met two days ago would have every term due, which is a different test
	const drillLog = [...items.lexicon['1'], ...items.deck['1'], ...serviceTerms].map((slug) => ({ slug, at: now - DAY / 2, grade: 'met' }));
	const calibrationLog = LEVELS.tastes.map((t) => ({ slug: `cal-${t}-1`, at: now - DAY, grade: 'met' }));
	return { cookedLog, drillLog, calibrationLog };
}

test('a new reader sees four Untouched cards, named and never numbered, and Commis as theirs', async ({ page }) => {
	await goto(page, '/');
	await page.locator('.level.on').waitFor();
	const cards = page.locator('section.levels .level');
	await expect(cards).toHaveCount(4);
	for (let i = 0; i < 4; i++) {
		/* the name is the label, to the eye and to a screen reader: no numeral,
		   painted or hidden */
		await expect(cards.nth(i).locator('.lv-num, .sr-only')).toHaveCount(0);
		await expect(cards.nth(i)).not.toHaveText(/\b(?:I|II|III|IV)\b/);
		await expect(cards.nth(i).locator('.lv-name')).toHaveText(NAMES[i]);
		await expect(cards.nth(i).locator('.lv-stat')).toHaveText('Untouched');
	}
	const on = page.locator('.level.on');
	await expect(on).toHaveAttribute('data-level', '1');
	await expect(on.locator('.lv-here')).toHaveText('Your level');
	await expect(on).toHaveAttribute('aria-current', 'step');

	// the home is the four cards and nothing else since the consolidation
	await expect(page.locator('nav.quiet .door')).toHaveCount(0);
});

test('a partial record shows a figure, never a score', async ({ page }) => {
	await seedSession(page);
	await goto(page, '/');
	await page.locator('.level.on').waitFor();
	await expect(page.locator('.level[data-level="1"] .lv-stat')).toHaveText(/^\d+% met$/);
	await expect(page.locator('.level.on')).toHaveAttribute('data-level', '1');
});

test('a full Commis record reads Met and moves the reader to Chef de Partie', async ({ page }) => {
	await seedSession(page, level1Seed());
	await goto(page, '/');
	await page.locator('.level.on').waitFor();
	await expect(page.locator('.level[data-level="1"] .lv-stat')).toHaveText('Met');
	await expect(page.locator('.level.on')).toHaveAttribute('data-level', '2');
	// and the old Levels address now forwards there (nothing chosen yet, so
	// the lowest not yet met)
	await goto(page, '/level');
	await expect(page).toHaveURL(/\/level\/2$/);
});

test('a level page opens on Today\'s study and My restaurant, and keeps its eight subsections closed below', async ({ page }) => {
	await goto(page, '/level/1');
	await expect(page.locator('h1')).toHaveText(NAMES[0]);
	await expect(page).toHaveTitle(`${NAMES[0]} · The World Table`);
	await expect(page.locator('.stat')).toHaveText(/Untouched/);
	// Today's study: three doors, each a name and a line
	const today = page.locator('nav.quiet[aria-labelledby="today"] .door');
	await expect(today.locator('.door-name')).toHaveText(['Due today', 'Quick quiz', 'Next reading']);
	await expect(page.getByRole('heading', { level: 2, name: 'My restaurant' })).toBeVisible();
	await expect(page.getByRole('heading', { level: 2, name: 'Search' })).toBeVisible();
	// What the level holds: a closed disclosure, every subsection inside it
	const holds = page.locator('details.holds');
	await expect(holds.locator('> summary')).toHaveText(`Show what ${NAMES[0]} holds`);
	await holds.locator('> summary').click();
	await expect(holds.locator('> summary')).toHaveText(`Hide what ${NAMES[0]} holds`);
	const subs = page.locator('ol.subsections .subsection');
	await expect(subs).toHaveCount(8);
	for (let i = 0; i < 8; i++) {
		await expect(subs.nth(i).locator('.line')).toHaveText(/\d+ at this level/);
		await expect(subs.nth(i).locator('h3 a')).toHaveAttribute('href', /.+/);
	}
	// the two read-only subsections: The Plates (fifth) and Food Safety (seventh)
	await expect(subs.nth(4).locator('.line')).toContainText('Read, never graded');
	await expect(subs.nth(6).locator('.line')).toContainText('Read, never graded');
	// every subsection's rows are named, not slugs: the first dish is a dish
	await subs.nth(0).locator('details summary').click();
	await expect(subs.nth(0).locator('details li a').first()).not.toHaveText(/-/);
	// the training doors and the test moved: Read to Library, decks to
	// Flashcards, quizzes and the test to Quizzes
	await expect(page.locator('a.train, a.leveltest')).toHaveCount(0);
});

/* ---- the level test ------------------------------------------------------- */

const termToCard = new Map(DECK.cards.map((c) => [c.term, c]));
const promptToTerm = new Map(DRILLS.cards.map((c) => [c.prompt, c.term]));
const opening = (s: string) => `${s.slice(0, 180)}${s.length > 180 ? '…' : ''}`;
const openingToTerm = new Map(LEXICON.map((e) => [opening(e.definition), e.term]));

/** Sit the whole test, right or wrong, from Begin to the result screen. */
async function sit(page: Page, right: boolean) {
	await page.getByRole('button', { name: 'Begin' }).click();
	for (let i = 0; i < 80; i++) {
		await page.locator('.where, .result').first().waitFor();
		if (await page.locator('.result').count()) return;
		const where = (await page.locator('.where').textContent()) ?? '';

		if (await page.locator('.match').count()) {
			const rows = page.locator('.match li');
			const n = await rows.count();
			const ids: string[] = [];
			for (let k = 0; k < n; k++) {
				const term = ((await rows.nth(k).locator('.term').textContent()) ?? '').trim();
				const card = termToCard.get(term);
				expect(card, `a deck card named ${term}`).toBeTruthy();
				ids.push(card!.id);
			}
			for (let k = 0; k < n; k++) {
				await rows.nth(k).locator('select').selectOption(right ? ids[k] : ids[(k + 1) % n]);
			}
			await page.getByRole('button', { name: 'Next' }).click();
		} else {
			const opts = page.locator('.opt');
			await opts.first().waitFor();
			let answer: string | undefined;
			if (await page.locator('.stem').count()) {
				const term = ((await page.locator('.stem').textContent()) ?? '').trim();
				answer = termToCard.get(term)?.gist;
			} else {
				const prompt = ((await page.locator('.prompt').textContent()) ?? '').trim();
				answer = promptToTerm.get(prompt) ?? openingToTerm.get(prompt.replace(/^“|”$/g, ''));
			}
			expect(answer, `an answer key for: ${where}`).toBeTruthy();
			const texts = (await opts.allTextContents()).map((t) => t.trim());
			const idx = right ? texts.indexOf(answer!) : texts.findIndex((t) => t !== answer);
			expect(idx, `the key must be among the options for: ${where}`).toBeGreaterThanOrEqual(0);
			await opts.nth(idx).click();
		}
		await page.waitForFunction((prev) => {
			const w = document.querySelector('.where');
			return !w || w.textContent !== prev;
		}, where);
	}
	throw new Error('the test did not end');
}

/** The drill log as the app left it on disk. */
async function drillLogOnDisk(page: Page): Promise<string[]> {
	return page.evaluate(
		() =>
			new Promise<string[]>((resolve) => {
				const open = indexedDB.open('world-table');
				open.onsuccess = () => {
					const req = open.result.transaction('state', 'readonly').objectStore('state').get('session');
					req.onsuccess = () => resolve(((req.result?.drillLog ?? []) as Array<{ slug: string }>).map((e) => e.slug));
					req.onerror = () => resolve([]);
				};
				open.onerror = () => resolve([]);
			})
	);
}

test('the Commis test, sat wrong, logs only Commis slugs and ends without a number', async ({ page }) => {
	test.setTimeout(180_000);
	await goto(page, '/level/1/test');
	await expect(page.locator('h1')).toHaveText(`The ${NAMES[0]} test`);
	await sit(page, false);

	const result = page.locator('.result');
	await expect(result.locator('> h2')).toHaveText('What you missed');
	// the page's own words carry no digit, no percentage and no score; the
	// cards and terms it shows carry their own prose (a temperature, a "U-10")
	// and are not the page's words
	for (const sel of ['.result > h2', '.result > .note', '.result .tools', '.result .chlabel']) {
		for (const text of await page.locator(sel).allTextContents()) {
			expect(text, `${sel} holds a digit`).not.toMatch(/\d/);
			expect(text, `${sel} holds a figure`).not.toMatch(/%|\bscore\b/i);
		}
	}
	await expect(page.locator('.where')).toHaveCount(0);

	const level1 = new Set([
		...LEVELS.items.deck['1'],
		...LEVELS.items.lexicon['1'],
		...LEVELS.items.service['1'].flatMap((m) => LEVELS.moduleTerms[m])
	]);
	const logged = await drillLogOnDisk(page);
	expect(logged.length).toBeGreaterThan(20);
	for (const slug of logged) expect(level1.has(slug), `${slug} is not a Commis slug`).toBe(true);
});

test('the Commis test, sat right, ends on Nothing missed', async ({ page }) => {
	test.setTimeout(180_000);
	await goto(page, '/level/1/test');
	await sit(page, true);
	await expect(page.locator('.result > h2')).toHaveText('Nothing missed.');
	await expect(page.locator('.result')).not.toContainText('%');
});

/* ---- what closed, and the phone ------------------------------------------ */

for (const route of ['/learn', '/practise']) {
	test(`${route} is honestly gone`, async ({ page }) => {
		await goto(page, route);
		await expect(page.locator('h1')).toHaveText('Nothing at this address');
	});
}

test('the home, a level and its test fit a phone with no sideways scroll', async ({ page }) => {
	test.setTimeout(120_000);
	for (const width of [320, 375]) {
		await page.setViewportSize({ width, height: 800 });
		for (const route of ['/', '/level/1', '/level/1/test']) {
			await goto(page, route);
			const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
			expect(scrollW, `${route} must not scroll sideways at ${width}`).toBe(width);
			// every card, door and training door clears the 44px floor
			const short = await page.locator('.level, .door, .train, .leveltest').evaluateAll((els) =>
				els.filter((e) => e.getBoundingClientRect().height < 44).map((e) => e.textContent?.trim().slice(0, 30))
			);
			expect(short, `${route} has a target under 44px at ${width}`).toEqual([]);
		}
	}
});
