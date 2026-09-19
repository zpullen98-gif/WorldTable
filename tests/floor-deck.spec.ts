import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { goto } from './helpers';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The Floor Deck, in a real browser.
 *
 * The unit suite proves the engine's rules on fixtures. What only a browser can
 * prove is that the PAGE keeps them: that a judgment reaches the record once
 * and survives a reload, that looking a card up writes nothing, that the answer
 * sits where the monorepo's paywall looks for it, and that the deck opens in a
 * walk-in with no signal, which is the whole reason the precache cap moved.
 */

const here = dirname(fileURLToPath(import.meta.url));
const DECK = JSON.parse(readFileSync(join(here, '../src/lib/data/floor-deck.json'), 'utf8')) as {
	cards: Array<{ id: string; term: string; section: string; guest: string; gist: string }>;
	sections: Array<{ key: string; title: string; count: number }>;
};
const FIRST = DECK.cards[0];

/** Every drillLog entry on disk, whichever record holds it. */
async function drillLog(page: Page) {
	return page.evaluate(
		() =>
			new Promise<Array<{ slug: string; grade?: string; at: number }>>((resolve) => {
				const open = indexedDB.open('world-table');
				open.onsuccess = () => {
					const get = open.result.transaction('state', 'readonly').objectStore('state').getAll();
					get.onsuccess = () => {
						const row = (get.result as Array<{ drillLog?: unknown[] }>).find((v) => v?.drillLog);
						resolve((row?.drillLog ?? []) as Array<{ slug: string; grade?: string; at: number }>);
					};
				};
			})
	);
}

test.skip(!DECK.cards.length, 'no card has shipped yet');

test('the landing lists what is written, and nothing that is not', async ({ page }) => {
	await goto(page, '/service/deck');
	const written = DECK.sections.filter((s) => s.count > 0);
	await expect(page.locator('.sections li')).toHaveCount(written.length);
	await expect(page.locator('.sections .stitle').first()).toHaveText(written[0].title);
	// one sheet: the paywall contract
	await expect(page.locator('article.sheet')).toHaveCount(1);
	await expect(page.getByRole('link', { name: /Flip cards/ })).toBeVisible();
});

test('a judgment is written once per card per day, and survives a reload', async ({ page }) => {
	await goto(page, '/service/deck/study');
	await expect(page.locator('.flash .term')).toHaveText(FIRST.term);

	// nothing is written by turning a card
	await page.getByRole('button', { name: 'Show the card' }).click();
	await expect(page.locator('.flash .def').first()).toHaveText(FIRST.guest);
	expect(await drillLog(page)).toHaveLength(0);

	// "Didn't have it" records a miss and sends the card round again
	const before = await page.locator('.where').textContent();
	await page.getByRole('button', { name: /Didn't have it/ }).click();
	await expect(page.locator('.flash .term')).not.toHaveText(FIRST.term);
	const total = (s: string | null) => Number(/of (\d+)/.exec(s ?? '')?.[1]);
	expect(total(await page.locator('.where').textContent())).toBe(total(before) + 1);

	await page.waitForTimeout(700);
	let log = await drillLog(page);
	expect(log.map((e) => `${e.slug}:${e.grade}`)).toEqual([`${FIRST.id}:missed`]);

	// walk to the end, where the missed card comes round a second time
	for (let guard = 0; guard < 60; guard++) {
		const term = await page.locator('.flash .term').textContent();
		if (term === FIRST.term) break;
		await page.getByRole('button', { name: /Later/ }).click();
	}
	await expect(page.locator('.flash .term')).toHaveText(FIRST.term);
	await page.getByRole('button', { name: 'Show the card' }).click();
	// already judged this sitting: the page offers Next, not a second verdict
	await expect(page.getByRole('button', { name: /Had it/ })).toHaveCount(0);

	await page.waitForTimeout(700);
	await page.reload();
	await page.waitForSelector('html[data-hydrated]');
	log = await drillLog(page);
	expect(log.filter((e) => e.slug === FIRST.id), 'one card, one day, one entry').toHaveLength(1);
	// self-judged, so it never promotes
	expect(log.every((e) => e.grade === 'close' || e.grade === 'missed')).toBe(true);
});

test('what was missed leads the next visit, and is all "only what I missed" shows', async ({ page }) => {
	await goto(page, '/service/deck/study');
	await page.getByRole('button', { name: 'Show the card' }).click();
	await page.getByRole('button', { name: /Didn't have it/ }).click();
	await page.waitForTimeout(700);

	await goto(page, '/service/deck');
	await expect(page.locator('.note')).toContainText('owed today');
	await page.getByRole('link', { name: /Only what I missed/ }).click();
	await expect(page.locator('h1')).toHaveText('What you missed');
	await expect(page.locator('.flash .term')).toHaveText(FIRST.term);
	await expect(page.locator('.where')).toHaveText(/Card 1 of 1/);
});

test('looking a card up opens every layer and records nothing', async ({ page }) => {
	const linked = DECK.cards.find((c) => c.id !== FIRST.id) ?? FIRST;
	await goto(page, `/service/deck/study?card=${linked.id}`);
	await expect(page.locator('.flash .term')).toHaveText(linked.term);
	await expect(page.locator('.flash .def').first()).toHaveText(linked.guest);
	for (const d of await page.locator('.flash details').all()) await expect(d).toHaveAttribute('open', '');
	await expect(page.locator('.judge')).toHaveCount(0);
	await page.waitForTimeout(700);
	expect(await drillLog(page)).toHaveLength(0);

	// an id that is not a card says so rather than showing a blank sheet
	await goto(page, '/service/deck/study?card=fd_9999');
	await expect(page.locator('.empty')).toContainText('no card with that id');
});

test('every answer sits where the paywall looks, and the caution never does', async ({ page }) => {
	await goto(page, `/service/deck/study?card=${FIRST.id}`);
	await expect(page.locator('.flash .def').first()).toBeVisible();
	const shape = await page.evaluate(() => {
		const flash = document.querySelector('.flash');
		const caution = document.querySelector('.flash .caution');
		return {
			guestInDef: Boolean(document.querySelector('.flash .def.guest')),
			// every paragraph of answer text is a .def; the fixed caution line is not
			loose: [...(flash?.querySelectorAll('.back p, .back dd') ?? [])]
				.filter((el) => !el.classList.contains('def') && !el.classList.contains('layer') && !el.classList.contains('caution') && !el.classList.contains('links'))
				.map((el) => el.textContent?.slice(0, 40)),
			cautionIsDef: caution ? caution.classList.contains('def') : null,
			caution: caution?.textContent ?? null
		};
	});
	expect(shape.guestInDef).toBe(true);
	expect(shape.loose, 'answer text outside .def ships in clear to a free visitor').toEqual([]);
	if (shape.caution !== null) {
		expect(shape.cautionIsDef).toBe(false);
		expect(shape.caution).toBe('Recipes vary. Confirm with the kitchen.');
	}
	// and no card, anywhere on the page, phrases a verdict
	const text = (await page.locator('.flash').textContent()) ?? '';
	expect(text).not.toMatch(/\b(contains?|free from|safe for|allergen|vegan|vegetarian)\b/i);
});

test('the keyboard turns a card and judges it', async ({ page }) => {
	await goto(page, '/service/deck/study');
	await expect(page.locator('.flash .term')).toHaveText(FIRST.term);
	await page.locator('body').press('Space');
	await expect(page.locator('.flash .def').first()).toBeVisible();
	await page.locator('body').press('1');
	await expect(page.locator('.flash .term')).not.toHaveText(FIRST.term);
	await page.waitForTimeout(700);
	expect((await drillLog(page)).map((e) => `${e.slug}:${e.grade}`)).toEqual([`${FIRST.id}:close`]);
});

test('reduced motion means no motion: the turn does not animate', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await goto(page, '/service/deck/study');
	await page.getByRole('button', { name: 'Show the card' }).click();
	await expect(page.locator('.flash .back')).toBeVisible();
	const running = await page.evaluate(() => document.querySelector('.flash .back')?.getAnimations().length ?? -1);
	expect(running, 'a Svelte transition would run through WAAPI and ignore the reduced-motion rule').toBe(0);
});

for (const scheme of ['light', 'dark'] as const) {
	test(`axe: an open card has no serious violations in ${scheme}`, async ({ page }) => {
		await page.emulateMedia({ colorScheme: scheme });
		await goto(page, `/service/deck/study?card=${FIRST.id}`);
		await expect(page.locator('.flash .def').first()).toBeVisible();
		const results = await new AxeBuilder({ page }).options({ resultTypes: ['violations'] }).analyze();
		const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
		expect(serious.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
	});
}

test('the deck opens cold with the network gone', async ({ page, context }) => {
	test.setTimeout(90_000);
	await goto(page, '/');
	await page.evaluate(async () => {
		await navigator.serviceWorker.ready;
		if (!navigator.serviceWorker.controller) {
			await new Promise<void>((resolve) => {
				navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
				if (navigator.serviceWorker.controller) resolve();
			});
		}
	});
	await expect
		.poll(
			async () =>
				page.evaluate(async () => {
					let n = 0;
					for (const name of await caches.keys()) n += (await (await caches.open(name)).keys()).length;
					return n;
				}),
			{ timeout: 40_000 }
		)
		.toBeGreaterThan(40);

	await context.setOffline(true);
	// never visited online: the shell fallback, then the deck from the precache
	await goto(page, '/service/deck/study');
	await expect(page.locator('.flash .term')).toHaveText(FIRST.term);
	await page.getByRole('button', { name: 'Show the card' }).click();
	await expect(page.locator('.flash .def').first()).toHaveText(FIRST.guest);
	await context.setOffline(false);
});

/**
 * The written test. The spec knows every card's key, so it can sit the test
 * perfectly and sit it badly, and hold the result screen to the owner's rule
 * both ways: what was missed, and no number.
 */
const SCORE = /\b\d+\s*(?:\/|of|out of)\s*\d+\b|\d+\s*%|\bscore|\bpass(?:ed)?\b|\bfail(?:ed)?\b|\bcorrect\b/i;

async function sitTheTest(page: Page, answer: 'right' | 'wrong') {
	await goto(page, '/service/deck/test');
	await page.getByRole('button', { name: 'Begin' }).click();
	for (let guard = 0; guard < 30; guard++) {
		if (await page.locator('.result').count()) return;
		if (await page.locator('.match').count()) {
			const rows = page.locator('.match .row');
			const n = await rows.count();
			const terms: string[] = [];
			for (let i = 0; i < n; i++) terms.push((await rows.nth(i).locator('.mterm').textContent()) ?? '');
			const gists = terms.map((t) => DECK.cards.find((c) => c.term === t)!.gist);
			// wrong: every term gets its neighbour's description
			const chosen = answer === 'right' ? gists : gists.map((_, i) => gists[(i + 1) % n]);
			for (let i = 0; i < n; i++) await rows.nth(i).locator('select').selectOption({ label: chosen[i] });
			await page.getByRole('button', { name: 'That is my answer' }).click();
			continue;
		}
		const term = (await page.locator('.ask .stem').textContent()) ?? '';
		const key = DECK.cards.find((c) => c.term === term)!.gist;
		const opts = page.locator('.opts .opt');
		const texts = await opts.allTextContents();
		const i = answer === 'right' ? texts.findIndex((t) => t.trim() === key) : texts.findIndex((t) => t.trim() !== key);
		// while a question is up, nothing on the page says right or wrong
		await expect(page.locator('.opt.right, .opt.wrong')).toHaveCount(0);
		await opts.nth(i).click();
	}
	throw new Error('the test never reached its result');
}

test('a clean written test says so, in words, and every answer climbed', async ({ page }) => {
	await sitTheTest(page, 'right');
	await expect(page.locator('.result h2')).toHaveText('Nothing missed.');
	await expect(page.getByRole('link', { name: 'Study these now' })).toHaveCount(0);
	expect((await page.locator('.result').textContent()) ?? '').not.toMatch(SCORE);
	await page.waitForTimeout(700);
	const log = await drillLog(page);
	expect(log.length).toBeGreaterThan(5);
	// objective, so it may promote: every entry is met
	expect(new Set(log.map((e) => e.grade))).toEqual(new Set(['met']));
	expect(new Set(log.map((e) => e.slug)).size, 'no card asked twice').toBe(log.length);
});

test('a bad written test ends on what was missed, each with the card, and no number anywhere', async ({ page }) => {
	await sitTheTest(page, 'wrong');
	await expect(page.locator('.result h2').first()).toHaveText('What you missed');
	await page.waitForTimeout(700);
	const log = await drillLog(page);
	expect(new Set(log.map((e) => e.grade))).toEqual(new Set(['missed']));
	// one open card per miss, the answer inside the paywall's selector
	await expect(page.locator('.result .flash')).toHaveCount(log.length);
	await expect(page.locator('.result .flash .def.guest')).toHaveCount(log.length);
	await expect(page.locator('.result .chose')).toHaveCount(log.length);
	await expect(page.locator('.result .because').first()).not.toBeEmpty();
	// the result's OWN words carry no figure; the cards inside it may say "16 oz"
	const own = await page.evaluate(() => {
		const r = document.querySelector('.result')!.cloneNode(true) as HTMLElement;
		r.querySelectorAll('.flash').forEach((el) => el.remove());
		return r.textContent ?? '';
	});
	expect(own).not.toMatch(SCORE);
	expect(own).not.toMatch(/\d/);
	// and the misses are what "study these now" opens
	await page.getByRole('link', { name: 'Study these now' }).click();
	await expect(page.locator('h1')).toHaveText('What you missed');
	await expect(page.locator('.where')).toContainText(`of ${Math.min(20, log.length)}`);
});

/** The house record's lineup tally, and the session's drill log, straight off disk. */
async function records(page: Page) {
	return page.evaluate(
		() =>
			new Promise<{ drill: string[]; lineup: string[]; studiedKeys: string[] }>((resolve) => {
				const open = indexedDB.open('world-table');
				open.onsuccess = () => {
					const store = open.result.transaction('state', 'readonly').objectStore('state');
					const all = store.getAll();
					all.onsuccess = () => {
						const rows = all.result as Array<{ drillLog?: Array<{ slug: string; grade?: string }>; lineupLog?: Array<{ slug: string; grade: string }> }>;
						const drill = rows.flatMap((r) => r?.drillLog ?? []).map((e) => e.slug + ':' + e.grade);
						const lineup = rows.flatMap((r) => r?.lineupLog ?? []).map((e) => e.slug + ':' + e.grade);
						resolve({ drill, lineup, studiedKeys: Object.keys(localStorage).filter((k) => /stud|streak/i.test(k)) });
					};
				};
			})
	);
}

test('say it back asks before it shows, hides the term it asks for, and ends on the misses', async ({ page }) => {
	await goto(page, '/service/deck/say');
	await page.getByRole('button', { name: 'Begin' }).click();

	let prompts = 0;
	let lines = 0;
	for (let guard = 0; guard < 14; guard++) {
		if (await page.locator('.result').count()) break;
		// recall before recognition: no choice is on the page until it has been said
		await expect(page.locator('.opt')).toHaveCount(0);
		const isPrompt = (await page.locator('.ask .eyebrow').textContent()) === 'What is this?';
		const stem = ((await page.locator('.ask .stem, .ask .dish').first().textContent()) ?? '').toLowerCase();
		await page.getByRole('button', { name: /I've said it/ }).click();
		await expect(page.locator('.opt')).toHaveCount(4);

		// whichever option is first: right about a quarter of the time, which is
		// enough wrong answers in ten to end the round on a list of misses
		await page.locator('.opt').nth(0).click();
		// the page now says which one it was, in a word and a glyph, not colour alone
		const right = ((await page.locator('.opt.right').textContent()) ?? '').replace('✓ this one', '').trim();
		await expect(page.locator('.opt.right .mark')).toHaveText(/this one/);
		if (isPrompt) {
			prompts++;
			// the redacted prompt never holds the term it is asking for
			expect(stem.includes(right.toLowerCase()), 'the prompt for ' + right + ' names it').toBe(false);
			expect(DECK.cards.some((c) => c.term === right)).toBe(true);
		} else {
			lines++;
			expect(DECK.cards.some((c) => c.gist === right)).toBe(true);
		}
		await expect(page.locator('.flash .def.guest')).toBeVisible();
		await page.getByRole('button', { name: 'Next' }).click();
	}
	expect(lines, 'at most three of a round ask about a dish line').toBeLessThanOrEqual(3);
	expect(prompts).toBeGreaterThanOrEqual(7);

	await expect(page.locator('.result h2').first()).toBeVisible();
	const own = await page.evaluate(() => {
		const r = document.querySelector('.result')!.cloneNode(true) as HTMLElement;
		r.querySelectorAll('.flash').forEach((el) => el.remove());
		return r.textContent ?? '';
	});
	expect(own).not.toMatch(SCORE);
	expect(own).not.toMatch(/\d/);
	await page.waitForTimeout(700);
	const { drill } = await records(page);
	expect(drill).toHaveLength(10);
	// objective: met or missed, never the self-judged close
	expect(drill.every((e) => e.endsWith(':met') || e.endsWith(':missed'))).toBe(true);
});

test('a lineup keeps a tally for the room and writes nothing about the person holding the tablet', async ({ page }) => {
	// a person's own record first, so "unchanged" means something
	await goto(page, '/service/deck/study');
	await page.getByRole('button', { name: 'Show the card' }).click();
	await page.getByRole('button', { name: /Had it/ }).click();
	await page.waitForTimeout(700);
	const before = await records(page);
	expect(before.drill).toHaveLength(1);

	await goto(page, '/service/deck/lineup');
	await page.getByRole('button', { name: 'Start the lineup' }).click();
	await expect(page.locator('.stage .term')).toBeVisible();

	// legible at arm's length, two real targets, and never over the dock
	const shape = await page.evaluate(() => {
		const px = (el: Element | null) => (el ? parseFloat(getComputedStyle(el).fontSize) : 0);
		const calls = [...document.querySelectorAll('.call')].map((c) => c.getBoundingClientRect());
		const dock = document.querySelector('.dock')?.getBoundingClientRect();
		return {
			term: px(document.querySelector('.stage .term')),
			heights: calls.map((c) => Math.round(c.height)),
			overDock: Boolean(dock && dock.height > 0 && calls.some((c) => c.bottom > dock.top && c.top < dock.bottom)),
			ownTurnButton: document.querySelectorAll('.stage .turn').length,
			dialogs: document.querySelectorAll('dialog[open]').length
		};
	});
	expect(shape.term).toBeGreaterThanOrEqual(40);
	expect(shape.heights.every((h) => h >= 72)).toBe(true);
	expect(shape.overDock).toBe(false);
	expect(shape.ownTurnButton).toBe(0);
	expect(shape.dialogs, 'a modal would make the timer dock inert').toBe(0);

	// the room misses the first, has the second
	const first = (await page.locator('.stage .term').textContent()) ?? '';
	await page.getByRole('button', { name: /Missed it/ }).click();
	await expect(page.locator('.stage .def.guest')).toBeVisible();
	await page.getByRole('button', { name: /Next/ }).click();
	await page.getByRole('button', { name: /Had it/ }).click();
	await page.waitForTimeout(700);

	let now = await records(page);
	const firstId = DECK.cards.find((c) => c.term === first)!.id;
	expect(now.lineup.slice(0, 2)[0]).toBe(firstId + ':missed');
	expect(now.lineup).toHaveLength(2);
	expect(now.drill, 'a room answering aloud is not evidence about whoever holds the tablet').toEqual(before.drill);

	// undo takes back exactly the last answer
	await page.getByRole('button', { name: 'Undo last' }).click();
	await page.waitForTimeout(700);
	now = await records(page);
	expect(now.lineup).toEqual([firstId + ':missed']);

	// and what the room missed leads the next lineup
	await page.getByRole('button', { name: 'End the lineup' }).click();
	await expect(page.locator('.result h2')).toHaveText('What the room missed');
	await page.getByRole('button', { name: 'Another lineup' }).click();
	await page.getByRole('button', { name: 'Start the lineup' }).click();
	await expect(page.locator('.stage .term')).toHaveText(first);
});
