import { test, expect, type Page } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto, seedSession, HOUSE_INDEX_KEY } from './helpers';

/**
 * Cuisine (12 Oct 2026; a Brennan's screen since 17 Oct 2026), walked in a phone's
 * Chromium at 390 by 844, with a 375 case for the bar and the screens. The
 * shipped Brennan's pack is served on the context the way house.spec.ts
 * serves it (the suite's server withholds packs, and only a context route
 * sees a request the service worker makes), so a fresh device loads the
 * Brennan's house itself and At Brennan's can reach the house's own study
 * card; one walk withholds it to see the dish named in words instead.
 *
 * Every figure, id and answer here is read from the BUILT data in
 * src/lib/data/cuisine/ (index.json and the ch-<key>.json bodies) at the
 * time the spec runs, never typed. The set is complete (twelve chapters, 165
 * entries), so every chapter is a link; a chapter with nothing written would
 * draw as a "coming" row, and the unit tests keep that case.
 *
 * ChatGPT's Today's study and Your culinary terms are walked beside the tab
 * at both widths, so the bar is proven not to crowd them.
 *
 * A round's items ride in the page's history entry (App.PageState.cz), so
 * the spec reads the item it is shown from there and looks the right answer
 * up in the chapter file, as a cook would look it up in the book.
 *
 * Screens are written to CUISINE_SHOTS when it names a folder (with its
 * trailing slash), and to nowhere otherwise.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, '../src/lib/data/cuisine');
const PACK_TEXT = readFileSync(join(HERE, '../static/shared/packs/brennans-new-orleans.v1.oothouse.json'), 'utf8');
const PACK_ID = (JSON.parse(PACK_TEXT) as { house: { id: string } }).house.id;
const PACK_URL = '**/shared/packs/brennans-new-orleans.v1.oothouse.json';
const CHUNKS = join(HERE, '../build/_app/immutable/chunks');
const LEVELS = JSON.parse(readFileSync(join(HERE, '../src/lib/data/levels.json'), 'utf8')) as { levels: Array<{ level: number; name: string }> };
const NAMES = LEVELS.levels.map((l) => l.name);
const SHOTS = process.env.CUISINE_SHOTS ?? '';
const HUSSARDE = 'd-1q0xk7jv';
const DAY = 86_400_000;
/* The bar's five words since 17 Oct 2026: Cuisine lives under Brennan's (the
   second word, the pack's own spelling with its curly apostrophe), reached
   from the house's page by its lead door, and its address lights that word. */
const WORDS = ['Home', 'Brennan’s', 'Practise', 'Library', 'More'];
const BRENNANS = WORDS[1];

type Tuple = [string, string, number];
type Card = { id: string; front: string; back: string };
type Question = { id: string; q: string; answer: string; distractors: string[] };
type Entry = { id: string; slug: string; title: string; say: string; level: number; sections: Array<{ key: string }>; brennans: Array<{ dish: string; components: string[] }>; seeAlso: { terms?: string[] }; cards: Card[]; questions: Question[] };
type Steps = { id: string; entry?: string; title: string; steps: string[]; distractor?: string };
type Match = { id: string; title: string; left: string; right: string; pairs: Array<[string, string, string?]>; generated?: string };
type Chapter = { key: string; title: string; entries: Entry[]; steps: Steps[]; matches: Match[]; labels?: { terms?: Record<string, string> } };
type Node = { name?: string; entry?: string; dishes?: Array<{ dish: string }>; children?: Node[] };
type Index = {
	complete: boolean;
	chapters: Array<{ key: string; title: string; entries: number }>;
	entries: Array<{ id: string; slug: string; chapter: string; title: string; level: number }>;
	cards: Tuple[];
	matches: Array<{ id: string; chapter: string; generated?: string }>;
	tree: { careme: { four: string[] }; mothers: Node[] } | null;
	ladder: { rungs: Array<{ key: string; name: string }> } | null;
	dishes: Record<string, string>;
};

const INDEX = JSON.parse(readFileSync(join(DATA, 'index.json'), 'utf8')) as Index;
const CHAPTERS: Record<string, Chapter> = Object.fromEntries(
	readdirSync(DATA)
		.filter((f) => /^ch-.+\.json$/.test(f))
		.map((f) => {
			const c = JSON.parse(readFileSync(join(DATA, f), 'utf8')) as Chapter;
			return [c.key, c];
		})
);
const MOTHER = JSON.parse(readFileSync(join(DATA, 'ch-mother-sauces.json'), 'utf8')) as Chapter;
const HOLLANDAISE = MOTHER.entries.find((e) => e.slug === 'hollandaise')!;
const HOLLANDAISE_STEPS = MOTHER.steps.find((s) => s.entry === HOLLANDAISE.id)!;
const TREE_MATCH = INDEX.matches.find((m) => m.generated === 'tree') ?? INDEX.matches[0];
/** The first entry in index order that links the owner's sheet terms. */
const SHEETS_ENTRY = INDEX.entries.find((h) => (CHAPTERS[h.chapter].entries.find((e) => e.id === h.id)!.seeAlso.terms ?? []).length > 0)!;

/* Every question, steps set, match and card by id, across the chapters. */
const QUESTION = new Map(Object.values(CHAPTERS).flatMap((c) => c.entries.flatMap((e) => e.questions.map((q) => [q.id, q] as const))));
const STEPS = new Map(Object.values(CHAPTERS).flatMap((c) => c.steps.map((s) => [s.id, s] as const)));
const MATCH = new Map(Object.values(CHAPTERS).flatMap((c) => c.matches.map((m) => [m.id, m] as const)));
const CARD = new Map(Object.values(CHAPTERS).flatMap((c) => c.entries.flatMap((e) => e.cards.map((k) => [k.id, { card: k, entry: e }] as const))));

/** The round or run the current history entry holds (App.PageState.cz). */
type Cz = { s: 'run' | 'round'; refs?: string[]; i: number; items?: Array<{ id: string; opts?: string[]; pool?: string[] }>; done?: boolean };
async function czState(page: Page): Promise<Cz | null> {
	return page.evaluate(() => ((history.state?.['sveltekit:states'] as { cz?: unknown } | undefined)?.cz ?? null) as never);
}
type QQ = { qs: Array<{ kind: string; options: string[]; answer: string; label: string; entry?: string }>; i: number };
async function qqState(page: Page): Promise<QQ | null> {
	return page.evaluate(() => ((history.state?.['sveltekit:states'] as { qq?: unknown } | undefined)?.qq ?? null) as never);
}
type Fc = { refs?: string[] };
async function fcState(page: Page): Promise<Fc | null> {
	return page.evaluate(() => ((history.state?.['sveltekit:states'] as { fc?: unknown } | undefined)?.fc ?? null) as never);
}

const heading = (page: Page) => page.locator('main h1').first();
const backBtn = (page: Page) => page.locator('.backline button.back');
const cuisineMain = (page: Page) => page.locator('main .cuisine');
const pill = async (page: Page) => Number(((await page.locator('nav.modebar .modetab .pill').textContent()) ?? '0').replace(/\D+/g, ''));
/** The Flashcards root's Due today figure, as consolidation test 22 reads it. */
const figure = (s: string) => {
	const m = /^(\d+) (?:due and (\d+) new|new cards? to start|cards? due)/.exec(s);
	return m ? Number(m[1]) + Number(m[2] ?? 0) : 0;
};

async function shot(page: Page, name: string, full = false) {
	if (!SHOTS) return;
	/* A whole-page picture draws the sticky bar where the scroll left it, so
	   take it from the top, once the Back row has slid home from its stuck
	   place (a 0.12 s padding transition the first pictures caught halfway). */
	if (full) {
		await page.evaluate(() => window.scrollTo(0, 0));
		await expect(page.locator('.backline.is-stuck')).toHaveCount(0);
		await page.waitForTimeout(250);
	}
	await page.screenshot({ path: `${SHOTS}${name}.png`, fullPage: full });
}

/**
 * A session whose drill log holds these records; the rest is the suite's
 * usual seed, less its two menu dishes: a device with dishes of its own and
 * no house holds the shipped pack back for a press (stores/house.svelte.ts
 * #autoLoad), and these walks want the Brennan's house current.
 */
async function seedLog(page: Page, drillLog: Array<{ slug: string; at: number; grade: string }>) {
	await seedSession(page, { drillLog, menuDishes: [], dishCosts: {} });
}

/** The Brennan's house is on the device and current: the shipped pack has loaded itself. */
async function houseLoaded(page: Page) {
	await expect
		.poll(
			() =>
				page.evaluate((key) => {
					try {
						return (JSON.parse(localStorage.getItem(key) ?? 'null') as { current?: string } | null)?.current ?? null;
					} catch {
						return null;
					}
				}, HOUSE_INDEX_KEY),
			{ timeout: 15_000 }
		)
		.toBe(PACK_ID);
}

/** The built chunk that carries one chapter: its first card's id, in a chunk that is not the index (verify-build's own test). */
function chapterChunks(key: string): string[] {
	const id = CHAPTERS[key].entries[0].cards[0].id;
	return readdirSync(CHUNKS)
		.filter((f) => f.endsWith('.js'))
		.filter((f) => {
			const t = readFileSync(join(CHUNKS, f), 'utf8');
			return t.includes(id) && !/\bbyDish\\?"?:/.test(t);
		});
}

/** A door on a Cuisine screen by its own name, never by words in another door's line. */
const door = (page: Page, name: string) => cuisineMain(page).locator('a.door', { has: page.locator('.door-name', { hasText: new RegExp(`^${esc(name)}$`) }) });

/** Cuisine's root, with the index read and the chapter rows drawn. */
async function root(page: Page) {
	await goto(page, '/cuisine');
	await expect(heading(page)).toHaveText('Cuisine');
	await expect(page.locator('.chapters > li').first()).toBeVisible({ timeout: 15_000 });
}

/** A chapter's own drill chip, which opens its round by an in-app link (a cold load of a round falls to its parent). */
async function chapterRound(page: Page, chapter: string, chip: 'Order the steps' | 'Family matching' | 'Quiz this chapter') {
	await goto(page, `/cuisine?ch=${chapter}`);
	await expect(page.locator('.entries .door, .chips .chip').first()).toBeVisible({ timeout: 15_000 });
	await page.locator('.chips a.chip', { hasText: chip }).click();
	await expect.poll(async () => (await czState(page))?.items?.length ?? 0, { timeout: 15_000 }).toBeGreaterThan(0);
}

/** Put one steps set in its right order, tapping each stage by its words. */
async function placeInOrder(page: Page, set: Steps) {
	for (const step of set.steps) await page.getByRole('button', { name: `Place next: ${step}`, exact: true }).click();
	await expect(page.locator('.steps .sub').first()).toHaveText(`Your order, ${set.steps.length} of ${set.steps.length}`);
}

/** Pair every row of a match set with its own partner. */
async function pairAll(page: Page, set: Match) {
	const cols = page.locator('.match .col');
	for (const [l, r] of set.pairs) {
		await cols.nth(0).locator('button.item', { has: page.locator('.text', { hasText: new RegExp(`^${esc(l)}$`) }) }).click();
		await cols.nth(1).locator('button.item', { has: page.locator('.text', { hasText: new RegExp(`^${esc(r)}$`) }) }).click();
	}
}
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test.use({ viewport: { width: 390, height: 844 } });

test.beforeEach(async ({ page }) => {
	/* Each walk loads several screens and the house; thirty seconds was tight
	   once the suite ran four workers beside the axe runs. */
	test.setTimeout(60_000);
	await page.context().route(PACK_URL, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: PACK_TEXT }));
});

/* ------------------------------------------------------------------------ */

test("the bar holds five words in one row at 375 and 390, every tab 44 by 44, and Cuisine opens from the Brennan's page with its twelve chapters", async ({ page }) => {
	test.setTimeout(90_000);
	expect(INDEX.complete, 'the full set is built').toBe(true);
	expect(INDEX.chapters).toHaveLength(12);
	for (const width of [375, 390]) {
		await page.setViewportSize({ width, height: 844 });
		await goto(page, '/');
		// Measured with the due pill drawn, the widest the bar gets: a fresh device has new cards to start.
		await expect(page.locator('nav.modebar .modetab .pill')).toBeVisible({ timeout: 15_000 });
		const tabs = page.locator('nav.modebar .modetab');
		const words = (await tabs.allTextContents()).map((t) => t.replace(/\d+\s*due$/, '').trim());
		expect(words, `the words at ${width}`).toEqual(WORDS);
		const boxes = await tabs.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ top: Math.round(r.top), w: r.width, h: r.height, right: r.right })));
		expect(Math.max(...boxes.map((b) => b.top)) - Math.min(...boxes.map((b) => b.top)), `one row at ${width}`).toBeLessThan(8);
		for (const [i, b] of boxes.entries()) {
			expect(b.w, `${WORDS[i]} at least 44 wide at ${width}`).toBeGreaterThanOrEqual(44);
			expect(b.h, `${WORDS[i]} at least 44 tall at ${width}`).toBeGreaterThanOrEqual(44);
		}
		expect(Math.max(...boxes.map((b) => b.right)), `the bar inside the glass at ${width}`).toBeLessThanOrEqual(width);
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
		if (SHOTS) await page.locator('nav.modebar').screenshot({ path: `${SHOTS}${width}-bar.png` });

		// To Cuisine the way the bar leads there now: the Brennan's word, then
		// the house page's lead door under The cooking; Cuisine's address lights
		// the Brennan's word.
		await page.locator('nav.modebar .modetab', { hasText: BRENNANS }).click();
		await expect(page).toHaveURL(/\/menu$/);
		await expect(heading(page)).toHaveText(BRENNANS, { timeout: 15_000 });
		await page.locator('.house-groups a.door[data-door="cuisine"]').click();
		await expect(page).toHaveURL(/\/cuisine$/);
		await expect(heading(page)).toHaveText('Cuisine');
		await expect(page.locator('.modetab[aria-current="page"]')).toHaveText(BRENNANS);
		// Twelve chapter doors, every one a link to a written chapter, its title the index's own.
		await expect(page.locator('.chapters > li')).toHaveCount(12, { timeout: 15_000 });
		await expect(page.locator('.chapters a.door')).toHaveCount(12);
		await expect(page.locator('.chapters .door.coming')).toHaveCount(0);
		expect(INDEX.chapters.every((c) => c.entries > 0), 'every chapter written').toBe(true);
		await expect(page.locator('.chapters a.door .door-name')).toHaveText(INDEX.chapters.map((c) => c.title));
		for (const c of INDEX.chapters) await expect(page.locator(`.chapters a.door[data-chapter="${c.key}"]`)).toHaveAttribute('href', `/cuisine?ch=${c.key}`);
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
	}
	await page.setViewportSize({ width: 390, height: 844 });
});

test("Hollandaise reads whole, and At Brennan's reaches the Eggs Hussarde card with the Brennan's house on the device", async ({ page }) => {
	await root(page);
	await houseLoaded(page);
	await page.locator('.chapters a.door[data-chapter="mother-sauces"]').click();
	await expect(heading(page)).toHaveText(MOTHER.title);
	await page.locator(`.entries a.door[data-entry="${HOLLANDAISE.slug}"]`).click();
	await expect(page).toHaveURL(/\/cuisine\?ch=mother-sauces&e=hollandaise$/);
	await expect(heading(page)).toHaveText(HOLLANDAISE.title);
	const article = page.locator('article.czentry');
	await expect(article.locator('.say')).toContainText(HOLLANDAISE.say);
	// The level by name and the kind, with a space either side of the dot (Svelte once trimmed one).
	await expect(article.locator('.eyebrow')).toHaveText(new RegExp(`^${NAMES[HOLLANDAISE.level - 1]} · \\S`));
	await expect(article.locator('section.part[aria-labelledby^="sec-"]').first()).toBeVisible();
	for (const s of HOLLANDAISE.sections) await expect(article.locator(`#sec-${s.key}`)).toBeVisible();

	// At Brennan's: each dish the entry names; the Hussarde is a link once the house has loaded.
	expect(HOLLANDAISE.brennans.map((b) => b.dish)).toContain(HUSSARDE);
	const dish = article.locator(`.dishes a[href="/menu#${HUSSARDE}"]`);
	await expect(dish).toHaveText('Eggs Hussarde', { timeout: 15_000 });
	const box = (await dish.boundingBox())!;
	expect(box.height).toBeGreaterThanOrEqual(44);
	// The menu component's own explanation, kept by a person, behind a closed
	// fold whose words say what a tap does, as the house's folds do.
	const fold = article.locator('details.explain', { has: page.locator('summary', { hasText: /how the menu explains Hollandaise$/ }) });
	await expect(fold).toHaveCount(1);
	expect(await fold.evaluate((d) => (d as HTMLDetailsElement).open)).toBe(false);
	await expect(fold.locator('summary')).toHaveText('Show how the menu explains Hollandaise');
	expect((await fold.locator('summary').boundingBox())!.height).toBeGreaterThanOrEqual(44);
	await fold.locator('summary').click();
	await expect(fold.locator('summary')).toHaveText('Hide how the menu explains Hollandaise');
	await expect(fold.locator('p').first()).toBeVisible();
	await fold.locator('summary').click();
	await expect(fold.locator('summary')).toHaveText('Show how the menu explains Hollandaise');

	// A source's date sits on its own line, never a comma left at the start of one.
	for (const d of await article.locator('.sources .sdate').allTextContents()) expect(d.trim()).toMatch(/^[0-9A-Z]/);

	await dish.click();
	await expect(page).toHaveURL(new RegExp(`/menu#${HUSSARDE}$`));
	await expect(page.locator('article.card h2')).toHaveText('Eggs Hussarde', { timeout: 15_000 });
	await backBtn(page).click();
	await expect(heading(page)).toHaveText(HOLLANDAISE.title);
});

test("with no Brennan's house on the device, At Brennan's names the Hussarde in words, never a link", async ({ page }) => {
	// The page's own route wins over the context's: the pack is withheld, as the suite's server withholds it.
	await page.route(PACK_URL, (route) => route.fulfill({ status: 404, body: 'not found' }));
	const asked = page.waitForResponse((r) => r.url().includes('brennans-new-orleans.v1.oothouse.json'), { timeout: 15_000 });
	await goto(page, `/cuisine?ch=mother-sauces&e=${HOLLANDAISE.slug}`);
	await expect(heading(page)).toHaveText(HOLLANDAISE.title);
	await expect(page.locator('article.czentry .lede')).toBeVisible({ timeout: 15_000 });
	await asked;
	await page.waitForTimeout(500);
	const names = page.locator('article.czentry .dishes .dname');
	await expect(names.first()).toHaveText(INDEX.dishes[HUSSARDE]);
	await expect(page.locator('article.czentry .dishes a')).toHaveCount(0);
	await expect(page.locator('article.czentry details.explain')).toHaveCount(0);
});

test("From your sheets: an entry links the owner's own terms, each opening its page in Your culinary terms, and Back returns", async ({ page }) => {
	// Read from the built chapters, never typed: the first entry in index order that links sheet terms, and the first that links none.
	const body = (h: { id: string; chapter: string }) => CHAPTERS[h.chapter].entries.find((e) => e.id === h.id)!;
	const withTerms = INDEX.entries.find((h) => (body(h).seeAlso.terms ?? []).length > 0)!;
	const without = INDEX.entries.find((h) => !(body(h).seeAlso.terms ?? []).length)!;
	const terms = body(withTerms).seeAlso.terms!;
	const labels = CHAPTERS[withTerms.chapter].labels?.terms ?? {};
	expect(terms.every((id) => !!labels[id])).toBe(true);

	await goto(page, `/cuisine?ch=${without.chapter}&e=${without.slug}`);
	await expect(heading(page)).toHaveText(without.title);
	await expect(page.locator('article.czentry .lede')).toBeVisible({ timeout: 15_000 });
	await expect(page.locator('article.czentry section.sheets')).toHaveCount(0);

	await goto(page, `/cuisine?ch=${withTerms.chapter}&e=${withTerms.slug}`);
	await expect(heading(page)).toHaveText(withTerms.title);
	const block = page.locator('article.czentry section.sheets');
	await expect(block.locator('h2')).toHaveText('From your sheets', { timeout: 15_000 });
	const links = block.locator('ul.links a');
	await expect(links).toHaveText(terms.map((id) => labels[id]));
	for (const [i, id] of terms.entries()) {
		await expect(links.nth(i)).toHaveAttribute('href', `/foundations?term=${id}`);
		const box = (await links.nth(i).boundingBox())!;
		expect(box.height).toBeGreaterThanOrEqual(44);
		expect(box.width).toBeGreaterThanOrEqual(44);
	}
	await block.scrollIntoViewIfNeeded();
	await shot(page, '390-from-your-sheets');

	await links.first().click();
	await expect(page).toHaveURL(new RegExp(`/foundations\\?term=${terms[0]}$`));
	await expect(heading(page)).toHaveText(labels[terms[0]]);
	await backBtn(page).click();
	await expect(page).toHaveURL(new RegExp(`/cuisine\\?ch=${withTerms.chapter}&e=${withTerms.slug}$`));
	await expect(heading(page)).toHaveText(withTerms.title);
});

test('a Cuisine card flips and grades, Again sends it round once, and the learnt count moves', async ({ page }) => {
	await root(page);
	const flash = door(page, 'Flashcards');
	await expect(flash.locator('.door-line')).toContainText('0 learnt');
	await flash.click();
	const deck = `Cuisine at ${NAMES[0]}`;
	await expect(heading(page)).toHaveText(deck);
	const deckline = page.locator('.deckline');
	await expect(deckline).toHaveText(/^\d+ cards? · 0 learnt$/);
	const total = Number(/^(\d+)/.exec((await deckline.textContent()) ?? '')![1]);
	expect(total).toBe(INDEX.cards.filter((c) => c[2] === 1).length);

	await page.getByRole('button', { name: 'Start', exact: true }).click();
	const n = Math.min(total, 20);
	await expect(page.locator('.deckframe .where')).toHaveText(`Card 1 of ${n} · ${deck}`);
	const run = (await czState(page))!;
	const first = CARD.get(run.refs![0])!;
	await expect(page.locator('.czcard .term')).toHaveText(first.card.front);
	await expect(page.locator('.czcard .kkind')).toHaveText(first.entry.title);
	await shot(page, '390-card-front');
	await page.getByRole('button', { name: 'Flip', exact: true }).click();
	await expect(page.locator('.czcard .back')).toHaveText(first.card.back);
	await expect(page.locator('.czcard .read a')).toHaveText('Read about it');
	await shot(page, '390-card-back');
	await page.getByRole('button', { name: 'Got it', exact: true }).click();
	await expect(page.locator('.deckframe .where')).toHaveText(`Card 2 of ${n} · ${deck}`);
	await expect(page.locator('.tally')).toHaveText('1 got it, 0 to see again.');

	// Again: the card goes round once more, so the run is one longer.
	await page.getByRole('button', { name: 'Flip', exact: true }).click();
	await page.getByRole('button', { name: 'Again', exact: true }).click();
	await expect(page.locator('.deckframe .where')).toHaveText(`Card 3 of ${n + 1} · ${deck}`);
	const after = (await czState(page))!;
	expect(after.refs![after.refs!.length - 1]).toBe(run.refs![1]);

	await backBtn(page).click();
	await expect(heading(page)).toHaveText(deck);
	await expect(deckline).toHaveText(new RegExp(`^${total} cards? · 1 learnt$`));
	await backBtn(page).click();
	await expect(heading(page)).toHaveText('Cuisine');
	await expect(flash.locator('.door-line')).toContainText('1 learnt');
});

test('a quiz miss offers Read about it, and Back from the entry returns to the results', async ({ page }) => {
	await goto(page, `/cuisine?ch=mother-sauces&e=${HOLLANDAISE.slug}`);
	await expect(heading(page)).toHaveText(HOLLANDAISE.title);
	await page.locator('article.czentry a.chip', { hasText: 'Quiz this entry' }).click();
	await expect.poll(async () => (await czState(page))?.items?.length ?? 0, { timeout: 15_000 }).toBeGreaterThan(0);
	await expect(heading(page)).toHaveText('Quiz');
	const n = (await czState(page))!.items!.length;
	expect(n).toBe(Math.min(10, HOLLANDAISE.questions.length));
	for (let i = 0; i < n; i++) {
		const cz = (await czState(page))!;
		expect(cz.i).toBe(i);
		const q = QUESTION.get(cz.items![i].id)!;
		await expect(page.locator('.flash .stem')).toHaveText(q.q);
		await expect(page.locator('.flash .opt')).toHaveCount(4);
		const pick = i === 0 ? q.distractors[0] : q.answer;
		await page.locator('.flash .opt', { hasText: new RegExp(`^${esc(pick)}$`) }).click();
		await expect(page.locator('.flash .answer b')).toHaveText(i === 0 ? 'Not that one.' : 'Right.');
		await page.getByRole('button', { name: i + 1 >= n ? 'See what you missed' : 'Next question', exact: true }).click();
	}
	await expect(heading(page)).toHaveText('What you missed');
	const misses = page.locator('.misses .miss');
	await expect(misses).toHaveCount(1);
	await expect(misses.first().locator('.mlabel')).toHaveText(HOLLANDAISE.title);
	await expect(page.getByRole('button', { name: 'Study these cards', exact: true })).toBeVisible();
	await misses.first().locator('a.chip', { hasText: 'Read about it' }).click();
	await expect(heading(page)).toHaveText(HOLLANDAISE.title);
	await expect(page).toHaveURL(new RegExp(`e=${HOLLANDAISE.slug}$`));
	await backBtn(page).click();
	await expect(heading(page)).toHaveText('What you missed');
	await expect(misses).toHaveCount(1);
	await expect(page).toHaveURL(/kind=mc$/);
});

test('Order the steps: the hollandaise stages, read from the shipped chapter, placed in order grade right', async ({ page }) => {
	// Missed yesterday, so the round asks it first (askOrder), however many methods the chapter holds.
	await seedLog(page, [{ slug: `cuisine:${HOLLANDAISE_STEPS.id}`, at: Date.now() - DAY, grade: 'missed' }]);
	await chapterRound(page, 'mother-sauces', 'Order the steps');
	await expect(heading(page)).toHaveText('Order the steps');
	const cz = (await czState(page))!;
	expect(cz.items![0].id).toBe(HOLLANDAISE_STEPS.id);
	await expect(page.locator('.where')).toContainText(`Method 1 of ${cz.items!.length}`);
	await expect(page.locator('.where')).toContainText(HOLLANDAISE_STEPS.title);
	const pool = HOLLANDAISE_STEPS.steps.length + (HOLLANDAISE_STEPS.distractor ? 1 : 0);
	await expect(page.locator('.steps .pool button.stage')).toHaveCount(pool);
	if (HOLLANDAISE_STEPS.distractor) await expect(page.locator('.steps .hint').first()).toHaveText('One step does not belong: leave it out.');
	await expect(page.getByRole('button', { name: 'Check the order' })).toBeDisabled();

	// Tap to place, tap to take back.
	await page.getByRole('button', { name: `Place next: ${HOLLANDAISE_STEPS.steps[1]}`, exact: true }).click();
	// Each tap removes the button pressed, so focus goes on to the first stage still to place, never to the page's start.
	await expect(page.locator('.steps .pool button.stage').first()).toBeFocused();
	await page.getByRole('button', { name: `Take back from place 1: ${HOLLANDAISE_STEPS.steps[1]}`, exact: true }).click();
	await expect(page.locator('.steps .order')).toHaveCount(0);
	await expect(page.locator('.steps .pool button.stage').first()).toBeFocused();

	await placeInOrder(page, HOLLANDAISE_STEPS);
	await expect(page.getByRole('button', { name: 'Check the order' })).toBeFocused();
	await shot(page, '390-steps-placed', true);
	await page.getByRole('button', { name: 'Check the order' }).click();
	await expect(page.locator('.steps .answer b')).toHaveText('Right.');
	await expect(page.locator('button.nextq')).toBeFocused();
	await expect(page.locator('.steps .order li.right')).toHaveCount(HOLLANDAISE_STEPS.steps.length);
	await expect(page.locator('.steps .order li.wrong')).toHaveCount(0);

	// Any other method the chapter deals, put right from its own file too.
	for (let i = 1; i < cz.items!.length; i++) {
		await page.getByRole('button', { name: 'Next method', exact: true }).click();
		await placeInOrder(page, STEPS.get(cz.items![i].id)!);
		await page.getByRole('button', { name: 'Check the order' }).click();
		await expect(page.locator('.steps .answer b')).toHaveText('Right.');
	}
	await page.getByRole('button', { name: 'See what you missed', exact: true }).click();
	await expect(heading(page)).toHaveText('What you missed');
	await expect(page.locator('.nothing')).toHaveText('Nothing missed.');
});

test('Family matching: a pair undone by a tap, then every pair right, grades right', async ({ page }) => {
	const set = MATCH.get(TREE_MATCH.id)!;
	await seedLog(page, [{ slug: `cuisine:${set.id}`, at: Date.now() - DAY, grade: 'missed' }]);
	await chapterRound(page, TREE_MATCH.chapter, 'Family matching');
	await expect(heading(page)).toHaveText('Family matching');
	expect((await czState(page))!.items![0].id).toBe(set.id);
	await expect(page.locator('.where')).toContainText(set.title);
	const cols = page.locator('.match .col');
	await expect(cols.nth(0).locator('h2')).toHaveText(set.left);
	await expect(cols.nth(1).locator('h2')).toHaveText(set.right);
	await expect(cols.nth(0).locator('button.item')).toHaveCount(set.pairs.length);
	await expect(cols.nth(1).locator('button.item')).toHaveCount(set.pairs.length);

	// A wrong pair, then a tap on it again to undo it.
	const left0 = cols.nth(0).locator('button.item').first();
	await left0.click();
	await expect(left0).toHaveAttribute('aria-pressed', 'true');
	await cols.nth(1).locator('button.item', { has: page.locator('.text', { hasText: new RegExp(`^${esc(set.pairs[1][1])}$`) }) }).click();
	await expect(left0.locator('.with')).toHaveText(`Paired: ${set.pairs[1][1]}`);
	await left0.click();
	await expect(left0.locator('.with')).toHaveCount(0);

	await pairAll(page, set);
	await shot(page, '390-match-paired', true);
	await page.getByRole('button', { name: 'Check the pairs' }).click();
	await expect(page.locator('.match .answer b')).toHaveText('Right.');
	await expect(page.locator('button.nextq')).toBeFocused();
	await expect(page.locator('.match li.right')).toHaveCount(set.pairs.length);
	await expect(page.locator('.match li.wrong')).toHaveCount(0);
});

test('a round over every chapter loads the chapters of the sets it deals, never the rest', async ({ page }) => {
	// Every chapter holds a match set and a round deals five, so a round that read its whole scope would load all twelve.
	expect(new Set(INDEX.matches.map((m) => m.chapter)).size).toBeGreaterThan(5);
	const asked: string[] = [];
	page.on('request', (r) => asked.push(r.url()));
	await root(page);
	await door(page, 'Family matching').click();
	await expect.poll(async () => (await czState(page))?.items?.length ?? 0, { timeout: 15_000 }).toBeGreaterThan(0);
	await expect(heading(page)).toHaveText('Family matching');
	await expect(page.locator('.match .col').first()).toBeVisible();
	const dealt = [...new Set((await czState(page))!.items!.map((it) => INDEX.matches.find((m) => m.id === it.id)!.chapter))].sort();
	const loaded = INDEX.chapters.filter((c) => chapterChunks(c.key).some((f) => asked.some((u) => u.endsWith(`/${f}`)))).map((c) => c.key).sort();
	expect(loaded).toEqual(dealt);
});

test('a temperature whose words lead into it is read words first, so no line ends on "than" with nothing after', async ({ page }) => {
	// Read from the built chapters: the first temperature whose label ends on a word that leads into its figure.
	type Temp = { label: string; c: number; f: number };
	const found = INDEX.entries
		.map((h) => ({ h, t: (CHAPTERS[h.chapter].entries.find((e) => e.id === h.id) as unknown as { temps: Temp[] }).temps.find((x) => /\b(?:than|roughly|most|reads|typically)$/.test(x.label.trim())) }))
		.find((x) => !!x.t)!;
	expect(found, 'a label that leads into its figure').toBeTruthy();
	await goto(page, `/cuisine?ch=${found.h.chapter}&e=${found.h.slug}`);
	await expect(heading(page)).toHaveText(found.h.title);
	const line = page.locator('article.czentry ul.temps li', { hasText: found.t!.label });
	await expect(line).toHaveText(`${found.t!.label} ${found.t!.c}°C (${found.t!.f}°F)`, { timeout: 15_000 });
});

test.describe('a chapter that cannot be read', () => {
	// The worker would answer the chunk from its own cache, past any route: blocked, so the page's own request is the one that fails.
	test.use({ serviceWorkers: 'block' });

	test('is named alone: it says so, and an entry in another chapter opens without that note', async ({ page }) => {
		const next = INDEX.entries.find((h) => h.level === 1)!;
		const lostKey = [...INDEX.chapters].reverse().find((c) => c.key !== next.chapter)!.key;
		const lost = INDEX.entries.find((h) => h.chapter === lostKey)!;
		const [chunk] = chapterChunks(lostKey);
		await page.route(`**/${chunk}`, (r) => r.abort());

		await goto(page, `/cuisine?ch=${lostKey}&e=${lost.slug}`);
		await expect(cuisineMain(page).locator('.note', { hasText: 'This chapter could not be opened' })).toBeVisible({ timeout: 15_000 });

		// To Cuisine by Back twice (the entry's chapter, then Cuisine: in-app
		// moves, so the failure is still in the store), then the Next unread door.
		await backBtn(page).click();
		await expect(page).toHaveURL(new RegExp(`/cuisine\\?ch=${lostKey}$`));
		await backBtn(page).click();
		await expect(page).toHaveURL(/\/cuisine$/);
		await expect(door(page, next.title)).toBeVisible({ timeout: 15_000 });
		await page.evaluate(() => {
			const w = window as unknown as { lostSeen: boolean };
			w.lostSeen = false;
			new MutationObserver(() => {
				if (document.querySelector('main .cuisine')?.textContent?.includes('could not be opened')) w.lostSeen = true;
			}).observe(document.body, { subtree: true, childList: true, characterData: true });
		});
		await door(page, next.title).click();
		await expect(heading(page)).toHaveText(next.title);
		await expect(page.locator('article.czentry .lede')).toBeVisible({ timeout: 15_000 });
		expect(await page.evaluate(() => (window as unknown as { lostSeen: boolean }).lostSeen), 'the other chapter never drew the failure note').toBe(false);
	});
});

test('the family tree and the roux ladder draw in words, every node and rung', async ({ page }) => {
	expect(INDEX.tree, 'the build writes a tree').not.toBeNull();
	expect(INDEX.ladder, 'the build writes a ladder').not.toBeNull();
	const tree = INDEX.tree!;
	const ladder = INDEX.ladder!;
	const kids = (list: Node[] = []): number => list.reduce((n, c) => n + 1 + kids(c.children), 0);

	await root(page);
	await door(page, 'The family tree').click();
	await expect(heading(page)).toHaveText('The family tree');
	await expect(page.locator('.careme .four')).toHaveText(tree.careme.four.join(', '));
	await expect(page.locator('ol.mothers > li.mother')).toHaveCount(tree.mothers.length);
	await expect(page.locator('ol.mothers .kids > li')).toHaveCount(tree.mothers.reduce((n, m) => n + kids(m.children), 0));
	for (const h of await page.locator('ol.mothers > li.mother > h2').allTextContents()) expect(h.trim().length).toBeGreaterThan(0);
	// A node two Brennan's dishes take names them with a comma and a space between.
	const walk = (list: Node[] = []): Node[] => list.flatMap((c) => [c, ...walk(c.children)]);
	const two = walk(tree.mothers).find((c) => (c.dishes ?? []).length >= 2);
	if (two) {
		const names = two.dishes!.map((d) => INDEX.dishes[d.dish]);
		await expect(page.locator('ol.mothers .dishes', { hasText: names[0] }).first()).toContainText(`${names[0]}, ${names[1]}`);
	}
	await backBtn(page).click();
	await expect(heading(page)).toHaveText('Cuisine');

	await door(page, 'The roux ladder').click();
	await expect(heading(page)).toHaveText('The roux ladder');
	await expect(page.locator('ol.rungs > li.rung')).toHaveCount(ladder.rungs.length);
	expect((await page.locator('ol.rungs > li.rung > h2').allTextContents()).map((t) => t.trim())).toEqual(ladder.rungs.map((r) => r.name));
	for (const dt of ['Time', 'Look', 'Smell', 'Thickening']) await expect(page.locator('ol.rungs > li.rung').first().locator('dt', { hasText: dt })).toHaveCount(1);
	await backBtn(page).click();
	await expect(heading(page)).toHaveText('Cuisine');
});

test("a cold deep link to an entry walks Back up through its chapter, Cuisine and the Brennan's page to Home", async ({ page }) => {
	await goto(page, `/cuisine?ch=mother-sauces&e=${HOLLANDAISE.slug}`);
	await expect(heading(page)).toHaveText(HOLLANDAISE.title);
	await expect(page.locator('article.czentry')).toBeVisible({ timeout: 15_000 });
	await expect(page.locator('.modetab[aria-current="page"]')).toHaveText(BRENNANS);
	await backBtn(page).click();
	await expect(page).toHaveURL(/\/cuisine\?ch=mother-sauces$/);
	await expect(heading(page)).toHaveText(MOTHER.title);
	await backBtn(page).click();
	await expect(page).toHaveURL(/\/cuisine$/);
	await expect(heading(page)).toHaveText('Cuisine');
	// Cuisine is a Brennan's screen (17 Oct 2026): its parent is the house's page, a tab root.
	await backBtn(page).click();
	await expect(page).toHaveURL(/\/menu$/);
	await expect(heading(page)).toHaveText(BRENNANS, { timeout: 15_000 });
	await expect(page.locator('.modetab[aria-current="page"]')).toHaveText(BRENNANS);
	await backBtn(page).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.locator('a.level')).toHaveCount(4);
	await expect(backBtn(page)).toHaveCount(0);
	await expect(page.locator('.modetab[aria-current="page"]')).toHaveText('Home');
});

test('a Cuisine card due three days ago is counted in the Practise pill and dealt first by Due today', async ({ page }) => {
	// One Got it five days ago: the first rung of the term ladder is two days, so it fell due three days ago.
	const [cardId] = INDEX.cards[0];
	const card = CARD.get(cardId)!;
	await seedLog(page, [{ slug: `cuisine:${cardId}`, at: Date.now() - 5 * DAY, grade: 'met' }]);
	await goto(page, '/flashcards');
	const dueline = page.locator('.dueline');
	await expect(dueline).toBeVisible({ timeout: 15_000 });
	await expect(dueline).toHaveText(/^1 due and \d+ new|^1 card due/);
	const before = figure((await dueline.textContent()) ?? '');
	await expect.poll(() => pill(page)).toBe(before);
	await expect(page.locator('button.door[data-deck="cz:all"]')).toBeVisible();

	await page.getByRole('button', { name: "Start today's cards" }).click();
	await expect(page.locator('.deckframe .where')).toHaveText(`Card 1 of ${before} · Due today`);
	expect((await fcState(page))!.refs![0]).toBe(`z:${cardId}`);
	await expect(page.locator('.czcard .kkind')).toHaveText(`Cuisine · ${card.entry.title}`);
	await expect(page.locator('.czcard .term')).toHaveText(card.card.front);
	await page.getByRole('button', { name: 'Flip', exact: true }).click();
	await expect(page.locator('.czcard .back')).toHaveText(card.card.back);
	await page.getByRole('button', { name: 'Got it', exact: true }).click();
	await expect(page.locator('.deckframe .where')).toHaveText(new RegExp(`^Card 2 of `));
	// Graded, it climbs a rung and is no longer due: the pill drops by one.
	await expect.poll(() => pill(page)).toBe(before - 1);
});

test('the quick quiz asks two Cuisine questions, labelled Cuisine, whose misses open their entries', async ({ page }) => {
	// Started from the Practise root (17 Oct 2026): the link in its Quick quiz group, to /quizzes?quick=1.
	await goto(page, '/flashcards');
	await expect(heading(page)).toHaveText('Practise');
	await page.locator('section[aria-labelledby="fc-quick"]').getByRole('link', { name: 'Start the quick quiz' }).click();
	await expect(page.locator('.opt').first()).toBeVisible({ timeout: 15_000 });
	const qq = (await qqState(page))!;
	const cz = qq.qs.filter((q) => q.kind === 'cuisine');
	expect(cz.length, 'two Cuisine questions among the ten').toBe(2);
	const n = qq.qs.length;
	for (let i = 0; i < n; i++) {
		const q = (await qqState(page))!.qs[i];
		if (q.kind === 'cuisine') {
			await expect(page.locator('.where')).toHaveText(new RegExp(`^Question ${i + 1} of ${n} · Cuisine · `));
			if (SHOTS) await shot(page, '390-quickquiz-cuisine');
		}
		// The Cuisine questions wrong on purpose, the rest right.
		const pick = q.kind === 'cuisine' ? q.options.find((o) => o !== q.answer)! : q.answer;
		await page.getByRole('button', { name: pick, exact: true }).click();
		await page.getByRole('button', { name: i + 1 >= n ? 'See what you missed' : 'Next question', exact: true }).click();
	}
	await expect(heading(page)).toHaveText('What you missed');
	const misses = page.locator('.misses .miss', { has: page.locator('.mlabel', { hasText: /^Cuisine · / }) });
	await expect(misses).toHaveCount(2);
	const title = ((await misses.first().locator('.mlabel').textContent()) ?? '').replace(/^Cuisine · /, '');
	await misses.first().locator('a.chip', { hasText: 'Read about it' }).click();
	await expect(heading(page)).toHaveText(title);
	await expect(page.locator('.modetab[aria-current="page"]')).toHaveText(BRENNANS);
	await backBtn(page).click();
	await expect(heading(page)).toHaveText('What you missed');
});

test('offline after one visit, an entry in a chapter never opened reads whole', async ({ page, context }) => {
	test.setTimeout(90_000);
	// A chapter with entries, the last written (mother-sauces when it is the only one).
	const written = INDEX.chapters.filter((c) => c.entries > 0);
	const ch = [...written].reverse().find((c) => c.key !== 'mother-sauces') ?? written[0];
	const entry = INDEX.entries.find((e) => e.chapter === ch.key)!;
	const chunk = chapterChunks(ch.key);
	expect(chunk, `the built chunk of ${ch.key}`).toHaveLength(1);
	const asked: string[] = [];
	page.on('request', (r) => asked.push(r.url()));

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
			{ timeout: 60_000 }
		)
		.toBeGreaterThan(40);
	// The one visit: Cuisine's root, online. No chapter is opened, so the page
	// never asked for this chapter's chunk: only the worker's install fetched it.
	await root(page);
	expect(asked.filter((u) => u.endsWith(`/${chunk[0]}`)), `${ch.key} was not opened online`).toEqual([]);

	await context.setOffline(true);
	await goto(page, '/cuisine');
	await expect(page.locator('.chapters > li')).toHaveCount(INDEX.chapters.length, { timeout: 15_000 });
	await page.locator(`.chapters a.door[data-chapter="${ch.key}"]`).click();
	await expect(heading(page)).toHaveText(ch.title);
	await page.locator(`.entries a.door[data-entry="${entry.slug}"]`).click();
	await expect(heading(page)).toHaveText(entry.title);
	const body = CHAPTERS[ch.key].entries.find((e) => e.id === entry.id)!;
	await expect(page.locator('article.czentry .say')).toContainText(body.say);
	for (const s of body.sections) await expect(page.locator(`article.czentry #sec-${s.key}`)).toBeVisible();
	await expect(page.locator('.note', { hasText: 'could not be opened' })).toHaveCount(0);
	// Opened now, offline, from the worker's cache.
	expect(asked.filter((u) => u.endsWith(`/${chunk[0]}`)).length).toBeGreaterThan(0);
	await context.setOffline(false);
});

/** Every visible control on a screen under 44 px, and anything that scrolls the page sideways. */
async function measure(page: Page, within = 'main .cuisine') {
	return page.evaluate((sel) => {
		const main = document.querySelector(sel)!;
		const short = [...main.querySelectorAll<HTMLElement>('a, button, summary')]
			.filter((el) => el.offsetParent !== null && el.getClientRects().length > 0)
			.map((el) => {
				const r = el.getBoundingClientRect();
				return { t: (el.textContent ?? '').trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) };
			})
			.filter((x) => x.h < 44 || x.w < 44);
		const wide = [...main.querySelectorAll<HTMLElement>('*')]
			.filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 0.5)
			.map((el) => el.tagName + '.' + el.className);
		/* A heading more than one level below the one before it (h1 then h3). */
		const levels = [...main.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6')].map((h) => ({ n: Number(h.tagName[1]), t: (h.textContent ?? '').trim().slice(0, 40) }));
		const skips = levels.filter((h, i) => i > 0 && h.n > levels[i - 1].n + 1).map((h) => `h${h.n} ${h.t}`);
		return { short, wide, skips, scrollW: document.documentElement.scrollWidth };
	}, within);
}

test('every Cuisine screen at 375 and 390: no sideways scroll, every control 44 px, the screens drawn for a look', async ({ page }) => {
	test.setTimeout(120_000);
	await seedLog(page, [
		{ slug: `cuisine:${HOLLANDAISE_STEPS.id}`, at: Date.now() - DAY, grade: 'missed' },
		{ slug: `cuisine:${TREE_MATCH.id}`, at: Date.now() - DAY, grade: 'missed' }
	]);
	for (const width of [375, 390]) {
		await page.setViewportSize({ width, height: 844 });
		const check = async (name: string, full = false) => {
			const m = await measure(page);
			expect(m.scrollW, `${name} at ${width}: no sideways scroll`).toBeLessThanOrEqual(width);
			expect(m.wide, `${name} at ${width}: nothing past the glass`).toEqual([]);
			expect(m.short, `${name} at ${width}: every control at least 44 by 44`).toEqual([]);
			expect(m.skips, `${name} at ${width}: no heading skips a level`).toEqual([]);
			await shot(page, `${width}-${name}`, full);
		};

		await root(page);
		await check('root', true);

		await goto(page, `/cuisine?ch=mother-sauces`);
		await expect(page.locator('.entries .door').first()).toBeVisible({ timeout: 15_000 });
		await check('chapter', true);

		await page.locator(`.entries a.door[data-entry="${HOLLANDAISE.slug}"]`).click();
		await expect(page.locator(`article.czentry .dishes a[href="/menu#${HUSSARDE}"]`)).toBeVisible({ timeout: 15_000 });
		await check('entry', true);

		// An entry with From your sheets, the block in view for its picture.
		await goto(page, `/cuisine?ch=${SHEETS_ENTRY.chapter}&e=${SHEETS_ENTRY.slug}`);
		await expect(page.locator('article.czentry section.sheets')).toBeVisible({ timeout: 15_000 });
		await check('entry-sheets');
		await page.locator('article.czentry section.sheets').evaluate((el) => el.scrollIntoView({ block: 'center' }));
		await page.waitForTimeout(250);
		await shot(page, `${width}-from-your-sheets`);

		await goto(page, `/cuisine?ch=mother-sauces&e=${HOLLANDAISE.slug}`);
		await expect(page.locator('article.czentry')).toBeVisible({ timeout: 15_000 });
		await page.locator('article.czentry a.chip', { hasText: 'Flash this entry' }).click();
		await expect(page.locator('.deckframe .where')).toHaveText(/^Card 1 of /, { timeout: 15_000 });
		await check('card');
		await page.getByRole('button', { name: 'Flip', exact: true }).click();
		await check('card-back');

		await chapterRound(page, 'mother-sauces', 'Order the steps');
		const steps = STEPS.get((await czState(page))!.items![0].id)!;
		await page.getByRole('button', { name: `Place next: ${steps.steps[0]}`, exact: true }).click();
		await page.getByRole('button', { name: `Place next: ${steps.steps[1]}`, exact: true }).click();
		await check('steps', true);

		await chapterRound(page, TREE_MATCH.chapter, 'Family matching');
		const set = MATCH.get((await czState(page))!.items![0].id)!;
		const cols = page.locator('.match .col');
		await cols.nth(0).locator('button.item').first().click();
		await cols.nth(1).locator('button.item').first().click();
		await cols.nth(0).locator('button.item').nth(1).click();
		await check('match', true);
		expect(set.pairs.length).toBeGreaterThanOrEqual(4);

		// The two screens a stale address lands on, each with its way on as a 44 px target.
		await goto(page, '/cuisine?ch=no-such-chapter');
		await expect(heading(page)).toHaveText('No such chapter', { timeout: 15_000 });
		await check('no-chapter');
		await goto(page, '/cuisine?ch=mother-sauces&e=no-such-entry');
		await expect(heading(page)).toHaveText('Not written yet', { timeout: 15_000 });
		await expect(cuisineMain(page).locator('a.chip', { hasText: MOTHER.title })).toBeVisible();
		await check('no-entry');

		await goto(page, '/cuisine?view=tree');
		await expect(page.locator('.careme')).toBeVisible({ timeout: 15_000 });
		await check('tree', true);

		await goto(page, '/cuisine?view=ladder');
		await expect(page.locator('ol.rungs')).toBeVisible({ timeout: 15_000 });
		await check('ladder', true);
	}
	await page.setViewportSize({ width: 390, height: 844 });
});

test("ChatGPT's Today's study and Your culinary terms beside the Brennan's tab at 375 and 390: five doors 44 px, no sideways scroll", async ({ page }) => {
	test.setTimeout(90_000);
	const term = SHEETS_ENTRY && CHAPTERS[SHEETS_ENTRY.chapter].entries.find((e) => e.id === SHEETS_ENTRY.id)!.seeAlso.terms![0];
	for (const width of [375, 390]) {
		await page.setViewportSize({ width, height: 844 });
		/* `targets` false on ChatGPT's own page: Your culinary terms stays as
		   ChatGPT left it (its inline links are its design, not this tab's to
		   restyle), so the walk proves only what the bar could break there,
		   the glass's width. */
		const check = async (name: string, within: string, full = false, targets = true) => {
			const m = await measure(page, within);
			expect(m.scrollW, `${name} at ${width}: no sideways scroll`).toBeLessThanOrEqual(width);
			expect(m.wide, `${name} at ${width}: nothing past the glass`).toEqual([]);
			if (targets) expect(m.short, `${name} at ${width}: every control at least 44 by 44`).toEqual([]);
			await shot(page, `${width}-${name}`, full);
		};

		// Today's study on the level page: its five doors as ChatGPT left them, the bar's five words above.
		await goto(page, '/level/1');
		const today = page.locator('nav.quiet[aria-labelledby="today"] .door');
		await expect(today.locator('.door-name')).toHaveText(['Your culinary terms', 'Due today', 'Quick quiz', 'Next reading', 'Fall menu practice']);
		await expect(page.locator('[data-door="due"] .door-line')).not.toHaveText(/Reading/, { timeout: 15_000 });
		expect((await page.locator('nav.modebar .modetab').allTextContents()).map((t) => t.replace(/\d+\s*due$/, '').trim())).toEqual(WORDS);
		await check('todays-study', 'nav.quiet[aria-labelledby="today"]');

		// Your culinary terms, the index and one term's page.
		await goto(page, '/foundations');
		await expect(page.locator('main .foundations .term-door').first()).toBeVisible({ timeout: 15_000 });
		await check('your-culinary-terms', 'main .foundations', false, false);
		await goto(page, `/foundations?term=${term}`);
		await expect(page.locator('main .foundation-reading')).toBeVisible({ timeout: 15_000 });
		await check('your-culinary-terms-term', 'main .foundations', true, false);
	}
	await page.setViewportSize({ width: 390, height: 844 });
});
