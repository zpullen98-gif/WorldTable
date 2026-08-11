import { describe, it, expect } from 'vitest';
import MiniSearch from 'minisearch';
import { miniOptions } from './search-config.mjs';

/**
 * Semantics of the search index, pinned against the two failure modes it
 * replaced: the original's diacritic-blind `includes()` (L1913, which made
 * "ragu" miss Ragù entirely) and our interim substring fallback (which made
 * "ragu" MATCH aspaRAGUs and searched no ingredients at all).
 */
const docs = [
	{ id: 0, name: 'Ragù alla Bolognese', chapter: 'Italian', ingredients: 'ground beef pancetta milk', flavor: 'rich umami-deep', technique: 'Deglazing & pan sauces' },
	{ id: 1, name: 'Idaho Morel and Asparagus Saute', chapter: 'Idaho', ingredients: 'asparagus morels butter', flavor: 'earthy', technique: '' },
	{ id: 2, name: 'Salade Niçoise', chapter: 'French', ingredients: 'tuna olives anchovy egg', flavor: 'briny bright', technique: '' },
	{ id: 3, name: 'Tom Yum Goong', chapter: 'Thai', ingredients: 'lemongrass shrimp galangal lime', flavor: 'aromatic fiery', technique: '' },
	{ id: 4, name: 'Crème Brûlée', chapter: 'French', ingredients: 'cream egg yolks sugar vanilla', flavor: 'silky', technique: 'Tempering a custard Sugar stages & caramel' }
];

function build() {
	const mini = new MiniSearch(miniOptions);
	mini.addAll(docs);
	return mini;
}

const ids = (mini: MiniSearch, q: string) => mini.search(q).map((r) => r.id as number);

describe('search index semantics', () => {
	const mini = build();

	it('unaccented query finds the accented dish', () => {
		expect(ids(mini, 'ragu')).toContain(0);
		expect(ids(mini, 'nicoise')).toContain(2);
		expect(ids(mini, 'creme brulee')).toContain(4);
	});

	it('does NOT match by substring accident', () => {
		// "ragu" is inside "asparagus", and the substring scan matched it.
		expect(ids(mini, 'ragu')).not.toContain(1);
	});

	it('searches ingredients, not just names', () => {
		expect(ids(mini, 'lemongrass')).toContain(3);
		expect(ids(mini, 'anchovy')).toContain(2);
	});

	/**
	 * A query the index cannot answer must be distinguishable from a query it
	 * answered with nothing.
	 *
	 * processTerm drops single-character terms, so MiniSearch returns [] for
	 * "c" — and `if (ids)` is true for an empty array, so the grid's substring
	 * fallback was skipped and "Nothing on the pass" rendered over 970 recipes
	 * on the first keystroke of every search. Note "a b": two characters, still
	 * nothing survives tokenizing, which is why a length check is not the fix.
	 */
	it('an unanswerable query is empty, and the caller can tell', () => {
		expect(ids(mini, 'c')).toHaveLength(0);
		expect(ids(mini, 'a b')).toHaveLength(0);
		// And a real query is unaffected.
		expect(ids(mini, 'ragu').length).toBeGreaterThan(0);
	});

	/**
	 * The technique field, added with the technique pages. A dish that
	 * demonstrates a skill must be findable by that skill's name from the main
	 * search box — the word appears nowhere in its name or ingredients.
	 */
	it('searches technique tags', () => {
		expect(ids(mini, 'tempering')).toContain(4);
		expect(ids(mini, 'deglazing')).toContain(0);
		// And does not drag in dishes that merely sound similar.
		expect(ids(mini, 'deglazing')).not.toContain(3);
	});

	it('prefix-matches while typing', () => {
		expect(ids(mini, 'lemongr')).toContain(3);
	});

	it('multi-word queries are AND', () => {
		const r = ids(mini, 'cream vanilla');
		expect(r).toContain(4);
		expect(r).not.toContain(0);
	});

	it('name outranks an ingredient hit', () => {
		// "asparagus" in the NAME of doc 1 should rank above any ingredient echo.
		expect(ids(mini, 'asparagus')[0]).toBe(1);
	});

	it('round-trips through serialization with the shared options', () => {
		const revived = MiniSearch.loadJS(
			JSON.parse(JSON.stringify(mini)),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			miniOptions as any
		);
		expect(ids(revived as MiniSearch, 'ragu')).toEqual(ids(mini, 'ragu'));
		expect(ids(revived as MiniSearch, 'lemongrass')).toContain(3);
	});
});
