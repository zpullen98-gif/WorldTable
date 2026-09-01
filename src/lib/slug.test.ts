import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { slugify, qualifiedSlugs } from './slug';

/**
 * The slug is the URL primary key, and it is also the join key for the notes
 * overlay, the menu, saved annotations and the mark-id ledger. A change here is
 * a change to every persisted reference, so the rule is pinned rather than
 * trusted.
 *
 * The bug these cases exist for: NFD only ever splits a base letter from its
 * combining marks, so a letter that is its OWN codepoint survives the strip and
 * then meets `[^a-z0-9]`. Twenty two recipes wore the hole it punched, and the
 * failure was invisible in code review because the broken slugs are all valid
 * ASCII: `mant`, `c-lb-r`, `sm-rrebr-d` look like slugs, they just are not the
 * dish's name.
 */
describe('slugify', () => {
	it('folds accents that NFD can take apart', () => {
		expect(slugify('Ragù')).toBe('ragu');
		expect(slugify('Crème Brûlée')).toBe('creme-brulee');
		expect(slugify('Salade Niçoise')).toBe('salade-nicoise');
		expect(slugify('Bún Thịt Nướng')).toBe('bun-thit-nuong');
	});

	/**
	 * One case per letter the corpus actually contains, named for the recipe
	 * that carries it. These are the URLs that used to have holes in them.
	 */
	it.each([
		['Smørrebrød', 'smorrebrod'],
		['Æbleskiver', 'aebleskiver'],
		['Rúgbrauð', 'rugbraud'],
		['Mantı', 'manti'],
		['Çılbır', 'cilbir'],
		['Fıstıklı Baklava', 'fistikli-baklava'],
		['İmam Bayıldı', 'imam-bayildi'],
		['Półgęsek', 'polgesek'],
		['Gołąbki w Sosie Pomidorowym', 'golabki-w-sosie-pomidorowym'],
		['Flæskesteg med Sprød Svær', 'flaeskesteg-med-sprod-svaer']
	])('transliterates the letters NFD cannot: %s', (name, expected) => {
		expect(slugify(name)).toBe(expected);
	});

	/**
	 * Not in the corpus today, but in the table, and the table is the rule. The
	 * one-to-many entries are the ones worth pinning: a future ß must not
	 * quietly become "s".
	 */
	it('spells out the ligatures and the sharp s', () => {
		expect(slugify('Straße')).toBe('strasse');
		expect(slugify('Œufs en Meurette')).toBe('oeufs-en-meurette');
		expect(slugify('Þingvellir')).toBe('thingvellir');
		expect(slugify('Đà Nẵng')).toBe('da-nang');
		expect(slugify('Ångström')).toBe('angstrom');
	});

	it('keeps the rest of the pipeline', () => {
		expect(slugify("chef's knife")).toBe('chefs-knife');
		expect(slugify('Salt & Pepper')).toBe('salt-and-pepper');
		expect(slugify('  --Trim--  ')).toBe('trim');
	});

	/**
	 * Transliteration can INVENT a collision: two names differing only by ø
	 * versus o now fold together where they did not before. The corpus has none
	 * today (1844 recipes, 1844 distinct slugs), but the mechanism is real, so
	 * assert that qualifiedSlugs still catches it rather than assuming.
	 */
	it('lets qualifiedSlugs resolve a collision transliteration creates', () => {
		const items = [
			{ n: 'Rødgrød', c: 'Danish' },
			{ n: 'Rodgrod', c: 'Test Kitchen' }
		];
		expect(slugify(items[0].n)).toBe(slugify(items[1].n));

		const slugs = qualifiedSlugs(
			items,
			(r: { n: string }) => r.n,
			(r: { c: string }) => r.c
		);
		// Nobody keeps the bare slug: the result depends on the SET, not the order.
		expect(slugs).toEqual(['rodgrod-danish', 'rodgrod-test-kitchen']);
	});
});

/**
 * The overlay is keyed by slug, and build-data gates on every key resolving.
 * That gate is the thing that would have caught a half-finished rename, so this
 * asserts the join from the other side: no key may carry the old hyphen scar.
 */
describe('the notes overlay is keyed by live slugs', () => {
	it('no key still carries a hole where a letter used to be', () => {
		const notes = JSON.parse(readFileSync('src/lib/data/notes.json', 'utf8'));
		const index = JSON.parse(readFileSync('src/lib/data/recipes.index.json', 'utf8'));
		const live = new Set(index.map((r: { slug: string }) => r.slug));

		const orphaned = Object.keys(notes).filter((k) => !live.has(k));
		expect(orphaned, 'notes.json keys matching no recipe slug').toEqual([]);
	});
});
