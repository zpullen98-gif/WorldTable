import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { goto, seedHouses } from './helpers';
import { dealRound, tableDrillHouse } from '../src/lib/house-drill-round';
import { DRILL_KINDS } from '../src/lib/house/house-drills';
import type { House } from '../src/lib/house/house-schema';
import { dishKinds } from '../src/lib/menu-quiz';

const raw = JSON.parse(readFileSync(new URL('../static/shared/packs/brennans-new-orleans.v1.oothouse.json', import.meta.url), 'utf8'));
const house = raw.house as House;
const drillQuestions = dealRound(tableDrillHouse(house), DRILL_KINDS, null, () => .37);
const menu = house.dishes.map(d => ({ id: d.id, name: d.name, description: d.description, section: d.section, ingredients: d.ingredients, price: d.price, allergens: [], ts: d.ts }));
const menuQuestions = menu.flatMap(d => dishKinds(d, menu));
const chapter = JSON.parse(readFileSync(new URL('../src/lib/data/cuisine/ch-brennans.json', import.meta.url), 'utf8')) as {
	steps: { id: string; steps: string[] }[];
	matches: { id: string; pairs: [string, string, string?][] }[];
};
test.use({ viewport: { width: 390, height: 844 } });
test.beforeEach(async ({ page }) => {
	await seedHouses(page, [raw.house], house.id);
	await page.route('**/shared/packs/brennans-new-orleans.v1.oothouse.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(raw) }));
});

async function openReading(page: Page) {
	const disclosure = page.locator('.answer-reading');
	await expect(disclosure).toHaveCount(1);
	const summary = disclosure.locator(':scope > summary');
	await summary.focus();
	await page.keyboard.press('Enter');
	await expect(disclosure).toHaveAttribute('open');
	await expect(disclosure.locator('.reading-content h2')).not.toHaveText('');
	expect((await disclosure.locator('.reading-content').innerText()).length).toBeGreaterThan(150);
	return disclosure;
}

for (const correct of [true, false]) test(`the dishes quiz has explicit ${correct ? 'correct' : 'incorrect'} feedback and restores its answer after reading`, async ({ page }) => {
	await goto(page, '/menu/quiz');
	await page.getByRole('button', { name: 'Quiz me', exact: false }).click();
	await expect(page.locator('.answer-reading')).toHaveCount(0);
	const prompt = await page.locator('.quizdef').innerText();
	const question = menuQuestions.find(q => q.prompt === prompt)!;
	expect(question).toBeTruthy();
	const options = page.locator('.opts .opt');
	const labels = await options.allTextContents();
	const answer = labels.find(label => correct ? label.trim() === question.target.name : label.trim() !== question.target.name)!;
	await page.getByRole('button', { name: answer.trim(), exact: true }).click();
	await expect(page.locator('.answer')).toContainText(correct ? 'Right.' : 'Not that one.');
	await expect(page.locator('.answer')).toContainText(question.target.name);
	const position = await page.locator('.flash > .eyebrow').textContent();
	const reading = await openReading(page);
	await reading.locator('a').first().click();
	await page.waitForURL(url => url.pathname.endsWith('/menu') && !!url.hash);
	await page.goBack();
	await expect(page.locator('.quizdef')).toHaveText(prompt);
	await expect(page.locator('.answer')).toContainText(question.target.name);
	await expect(page.locator('.flash > .eyebrow')).toHaveText(position!);
	await expect(page.locator('.answer-reading')).toHaveAttribute('open');
	await page.getByRole('button', { name: 'Next', exact: false }).click();
	await expect(page.locator('.answer-reading')).toHaveCount(0);
});

for (const mode of ['drill', 'pair']) test(`${mode} reveals full context and retains score and question on Back`, async ({ page }) => {
	await goto(page, '/menu/quiz?mode=' + mode);
	await page.getByRole('button', { name: mode === 'pair' ? 'Deal the pairings' : 'Deal ▸', exact: mode !== 'pair' }).click();
	await expect(page.locator('.answer-reading')).toHaveCount(0);
	const stem = await page.locator('.quizdef').innerText();
	const q = drillQuestions.find(question => question.stem === stem)!;
	expect(q).toBeTruthy();
	const wrong = (await page.locator('.opts .opt').allTextContents()).find(value => value.trim() !== q.answer)!;
	await page.getByRole('button', { name: wrong.trim(), exact: true }).click();
	await expect(page.locator('.answer')).toContainText('Not that one.');
	const score = await page.locator('.score').innerText();
	const reading = await openReading(page);
	if (await reading.locator('a').count()) {
		await reading.locator('a').first().click();
		await page.waitForURL(url => url.pathname.endsWith('/menu') && !!url.hash);
		await page.goBack();
		await expect(page.locator('.quizdef')).toHaveText(stem);
		await expect(page.locator('.score')).toHaveText(score);
		await expect(page.locator('.answer-reading')).toHaveAttribute('open');
	}
});

test('Say it back and Guest at the table explain the full record only after checking', async ({ page }) => {
	for (const mode of ['say', 'guest']) {
		await goto(page, '/menu/quiz?mode=' + mode);
		if (mode === 'guest') await page.getByRole('button', { name: 'Seat a guest', exact: false }).click();
		await expect(page.locator('.answer-reading')).toHaveCount(0);
		await page.locator('textarea').fill('I would like to learn the full explanation for this answer.');
		await page.getByRole('button', { name: 'Check', exact: true }).click();
		await openReading(page);
		await expect(page.getByRole('button', { name: 'Record it', exact: true })).toBeEnabled();
	}
});

test('house flashcards and fall cards expose fuller reading after Flip without grading', async ({ page }) => {
	for (const deck of ['menu', 'menu-parts', 'components', 'producers', 'tastings', 'fall:food']) {
		await goto(page, '/flashcards?deck=' + encodeURIComponent(deck));
		await page.getByRole('button', { name: 'Start', exact: true }).click();
		await expect(page.locator('.answer-reading')).toHaveCount(0);
		await page.getByRole('button', { name: 'Flip', exact: true }).click();
		await openReading(page);
		await expect(page.locator('.tally')).toHaveText('0 got it, 0 to see again.');
	}
});

test('the reading and controls fit a 320px phone in both services', async ({ page }) => {
	await goto(page, '/menu/quiz?mode=say');
	await page.locator('textarea').fill('Let us discuss this dish.');
	await page.getByRole('button', { name: 'Check', exact: true }).click();
	await openReading(page);
	await page.setViewportSize({ width: 320, height: 780 });
	for (const service of ['day', 'night']) {
		await page.evaluate(value => document.documentElement.setAttribute('data-service', value), service);
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
		const box = await page.locator('.answer-reading > summary').boundingBox();
		expect(box!.height).toBeGreaterThanOrEqual(44);
	}
});

for (const mode of ['Quiz this chapter', 'Order the steps', 'Family matching']) test(`Brennan's Cuisine ${mode} links the full lesson immediately and restores the answer`, async ({ page }) => {
	await goto(page, '/cuisine?ch=brennans');
	await page.locator('.chips a.chip', { hasText: mode }).click();
	await expect(page.locator('.cuisine .flash .stem')).toBeVisible();
	await expect(page.locator('.answer-lessons')).toHaveCount(0);
	const stem = await page.locator('.cuisine .flash .stem').textContent();
	const state = await page.evaluate(() => history.state?.['sveltekit:states']?.cz as { items: { id: string }[]; i: number });
	const id = state.items[state.i].id;
	if (mode === 'Quiz this chapter') {
		await page.locator('.cuisine .opts .opt').first().click();
	} else if (mode === 'Order the steps') {
		for (const step of chapter.steps.find(set => set.id === id)!.steps) await page.getByRole('button', { name: `Place next: ${step}`, exact: true }).click();
		await page.getByRole('button', { name: 'Check the order', exact: true }).click();
	} else {
		const cols = page.locator('.match .col');
		for (const [left, right] of chapter.matches.find(set => set.id === id)!.pairs) {
			await cols.nth(0).getByRole('button', { name: left, exact: true }).click();
			await cols.nth(1).getByRole('button', { name: right, exact: true }).click();
		}
		await page.getByRole('button', { name: 'Check the pairs', exact: true }).click();
	}
	const score = await page.locator('.cuisine .score').textContent();
	await page.locator('.answer-lessons a').first().click();
	await page.waitForURL(url => url.searchParams.has('e'));
	await expect(page.getByRole('article')).toBeVisible();
	await page.goBack();
	await expect(page.locator('.cuisine .flash .stem')).toHaveText(stem!);
	await expect(page.locator('.cuisine .score')).toHaveText(score!);
	await expect(page.locator('.answer-lessons a').first()).toBeVisible();
});

test('Today’s quick quiz opens full Brennan’s context and returns without regrading', async ({ page }) => {
	await goto(page, '/quizzes');
	await page.getByRole('button', { name: 'Start the quick quiz', exact: true }).click();
	await expect(page.locator('.quizzes .stem')).toBeVisible();
	let target: { kind: string; answer: string } | undefined;
	for (let i = 0; i < 10; i++) {
		const state = await page.evaluate(() => history.state?.['sveltekit:states']?.qq as { qs: { kind: string; answer: string }[]; i: number });
		target = state.qs[state.i];
		if (target.kind === 'house') break;
		await page.locator('.quizzes .opts .opt').first().click();
		await page.getByRole('button', { name: 'Next question', exact: true }).click();
	}
	expect(target?.kind).toBe('house');
	await expect(page.locator('.answer-reading')).toHaveCount(0);
	const stem = await page.locator('.quizzes .stem').textContent();
	await page.getByRole('button', { name: target!.answer, exact: true }).click();
	const score = await page.locator('.quizzes .score').textContent();
	const reading = await openReading(page);
	await reading.locator('a').first().click();
	await page.waitForURL(url => url.pathname.endsWith('/menu') && !!url.hash);
	await page.goBack();
	await expect(page.locator('.quizzes .stem')).toHaveText(stem!);
	await expect(page.locator('.quizzes .score')).toHaveText(score!);
	await expect(page.locator('.quizzes .answer')).toContainText(target!.answer);
});
