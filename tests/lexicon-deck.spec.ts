import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { goto } from './helpers';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The Lexicon and the Floor Deck, linked both ways, in a real browser.
 *
 * The owner's decision: the deck is the home of a floor term, and the Lexicon
 * finds it. What a browser proves that the unit suite cannot is that the links
 * render where the paywall and the regression counts do not look (never a
 * .lexcard, never inside .xrefs), and that a word the Lexicon files under
 * another name still lands a reader on a card.
 *
 * Driven by the shipped data rather than named terms, because the deck is
 * being written a section at a time: whatever has shipped is what is tested.
 */

const here = dirname(fileURLToPath(import.meta.url));
const read = (f: string) => JSON.parse(readFileSync(join(here, '../src/lib/data', f), 'utf8'));
const INDEX = read('floor-deck.index.json') as {
	sections: Record<string, string>;
	cards: Array<{ id: string; term: string; section: string; aliases?: string[] }>;
	byLexicon: Record<string, string[]>;
};
const LEXICON = read('lexicon.json') as Array<Record<string, unknown> & { term: string; slug: string }>;

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const lexHay = LEXICON.map((e) =>
	fold([e.term, e.category, e.definition, e.choose, e.store, e.prep, ((e.methods as string[]) ?? []).join(' ')].join(' '))
);

/** An alias the Lexicon's own search cannot find, and the card that carries it. */
const ORPHAN = (() => {
	for (const c of INDEX.cards) {
		for (const a of c.aliases ?? []) {
			// the term must not hold the alias either, or the hit is not "via" it
			if (fold(c.term).includes(fold(a))) continue;
			if (!lexHay.some((h) => h.includes(fold(a)))) return { card: c, alias: a };
		}
	}
	return null;
})();

const LINKED = Object.entries(INDEX.byLexicon)
	.map(([slug, ids]) => ({ slug, card: INDEX.cards.find((c) => c.id === ids[0])! }))
	.find((x) => x.card && LEXICON.some((e) => e.slug === x.slug));

test.skip(!INDEX.cards.length, 'no card has shipped yet');

test('a word the Lexicon files under another name still lands on the floor card', async ({ page }) => {
	test.skip(!ORPHAN, 'no shipped alias is missing from the Lexicon');
	const { card, alias } = ORPHAN!;
	await goto(page, '/lexicon');
	await page.getByLabel('Search the lexicon').fill(alias.toLowerCase());

	const hit = page.locator('.deckhits a', { hasText: card.term });
	await expect(hit).toBeVisible();
	await expect(hit).toContainText(`also called ${alias}`);
	await expect(hit).toContainText(INDEX.sections[card.section]);
	await expect(page.locator('.lexcard')).toHaveCount(0);
	// the empty state does not tell a reader the kitchen has never heard of it
	await expect(page.locator('.empty')).toContainText('The Floor Deck does');

	// never paywall furniture, and never a card the regression counts would see
	expect(await page.locator('.deckhits .lexcard, .deckhits .def, .deckhits .flash').count()).toBe(0);

	await hit.click();
	await expect(page).toHaveURL(new RegExp(`/service/deck/study\\?card=${card.id}$`));
	await expect(page.locator('.flash .term').first()).toHaveText(card.term);
});

test('an entry a card calls its long read links to the card, outside the dish crosslinks', async ({ page }) => {
	test.skip(!LINKED, 'no shipped card names a Lexicon entry');
	const { slug, card } = LINKED!;
	await goto(page, '/lexicon');
	const entry = page.locator(`.lexcard#${slug}`);
	const link = entry.locator('.deckref a', { hasText: card.term });
	await expect(link).toHaveAttribute('href', new RegExp(`/service/deck/study\\?card=${card.id}$`));
	await expect(entry.locator('.deckref')).toContainText('On the floor');
	// a deck link is not a dish that demonstrates the term. By href, not by
	// text: "Chicken and Andouille Gumbo" is a dish and says Andouille.
	expect(await entry.locator('.xrefs a[href*="/service/deck"]').count()).toBe(0);
	expect(await entry.locator('.xrefs .deckref').count()).toBe(0);

	// and the card links back
	await link.click();
	await expect(page.locator('.flash .term').first()).toHaveText(card.term);
	const back = page.getByRole('link', { name: 'The long entry in the Lexicon' });
	await expect(back).toHaveAttribute('href', new RegExp(`/lexicon#${slug}$`));
});

test('an empty box shows no deck rows, and one letter is not a search', async ({ page }) => {
	await goto(page, '/lexicon');
	await expect(page.locator('.deckhits')).toHaveCount(0);
	await page.getByLabel('Search the lexicon').fill(INDEX.cards[0].term.slice(0, 1));
	await expect(page.locator('.deckhits')).toHaveCount(0);
	await page.getByLabel('Search the lexicon').fill(INDEX.cards[0].term);
	await expect(page.locator('.deckhits a').first()).toBeVisible();
});

for (const scheme of ['light', 'dark'] as const) {
	test(`axe: the Lexicon with deck rows showing has no serious violations in ${scheme}`, async ({ page }) => {
		await page.emulateMedia({ colorScheme: scheme });
		await goto(page, '/lexicon');
		await page.getByLabel('Search the lexicon').fill(INDEX.cards[0].term);
		await expect(page.locator('.deckhits a').first()).toBeVisible();
		const results = await new AxeBuilder({ page }).include('.deckhits').options({ resultTypes: ['violations'] }).analyze();
		const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
		expect(serious.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
	});
}
