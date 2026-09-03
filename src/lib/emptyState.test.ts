import { describe, it, expect } from 'vitest';
import { emptyState, DROP_ORDER } from './emptyState';
import { matches, effectiveMonth } from './filter';
import { EMPTY_FILTERS, type Course, type Difficulty, type FilterState, type RecipeSummary } from './types';
import index from './data/recipes.index.json';
import chaptersJson from './data/chapters.json';

/**
 * The empty state, held to the corpus.
 *
 * Every number in a sentence here is derived from the same predicate the grid
 * uses, over the shipped recipes, so a corpus change moves the expectation and
 * the sentence together. The one thing pinned by hand is the SHAPE of the
 * sentence and which filter it blames.
 */
const R = index as unknown as RecipeSummary[];
const CH = chaptersJson as unknown as Array<{ name: string; slug: string }>;
const month = effectiveMonth('N');
const f = (over: Partial<FilterState>): FilterState => ({ ...EMPTY_FILTERS, ...over });
const inChapter = (slug: string) => R.filter((r) => r.chapterSlug === slug);
const count = (pool: RecipeSummary[], ff: FilterState) =>
	pool.filter((r) => matches(r, { ...ff, chapter: null }, month)).length;

describe('the culprit', () => {
	/**
	 * The sweep the design rests on: for every chapter and every single filter
	 * that empties it, the sentence must blame THAT filter and offer the whole
	 * chapter back.
	 */
	it('is the one filter that emptied the chapter, in every single-filter zero', () => {
		const singles: FilterState[] = [
			f({ vegetarian: true }),
			f({ quick: true }),
			f({ season: true }),
			...([1, 2, 3] as Difficulty[]).map((d) => f({ difficulty: d })),
			...[...new Set(R.map((r) => r.course))].map((c) => f({ course: c as Course }))
		];
		let zeros = 0;
		for (const ch of CH) {
			const all = inChapter(ch.slug);
			if (!all.length) continue;
			for (const ff of singles) {
				if (count(all, ff) > 0) continue;
				zeros++;
				const e = emptyState({
					scope: ch.name,
					inChapter: true,
					all,
					qPool: all,
					filters: ff,
					month,
					library: count(R, ff)
				});
				const active = (Object.keys(ff) as Array<keyof FilterState>).find(
					(k) => k !== 'chapter' && ff[k] !== EMPTY_FILTERS[k]
				);
				expect(e.culprit?.key, `${ch.name} / ${String(active)}`).toBe(active);
				expect(e.culprit?.restored, `${ch.name} / ${String(active)}`).toBe(all.length);
			}
		}
		expect(zeros).toBeGreaterThan(100);
	});

	it('names the filter, the count it gives back, and the library, in the house voice', () => {
		const ch = CH.find((c) => c.slug === 'seafood-atlas');
		expect(ch).toBeTruthy();
		const all = inChapter('seafood-atlas');
		const ff = f({ vegetarian: true });
		expect(count(all, ff), 'precondition: the atlas has no vegetarian dish').toBe(0);
		const lib = count(R, ff);
		const e = emptyState({ scope: ch!.name, inChapter: true, all, qPool: all, filters: ff, month, library: lib });
		expect(e.sentence).toBe(
			`Nothing on the pass. Nothing vegetarian in ${ch!.name}. Drop Vegetarian for ${all.length} dishes; ${lib} across the library.`
		);
		expect(e.brief).toBe(`Nothing vegetarian in ${ch!.name}.`);
	});

	it('breaks a tie toward the filter set most casually', () => {
		// Two filters that each empty a five-dish scope on their own.
		const pool = Array.from({ length: 5 }, (_, i) => ({
			...R[0],
			slug: `t${i}`,
			minutes: 120,
			diet: { ...R[0].diet, vegetarian: false }
		})) as RecipeSummary[];
		const ff = f({ quick: true, vegetarian: true });
		const e = emptyState({ scope: 'Test', inChapter: true, all: pool, qPool: pool, filters: ff, month, library: 0 });
		// Dropping either alone still leaves the other, so nothing is restored by
		// one removal and there is no culprit to name...
		expect(e.culprit).toBeNull();
		// ...and the sentence lists both, in sentence order, with no bogus offer.
		expect(e.sentence).toBe('Nothing on the pass. Nothing vegetarian and under 40 minutes in Test.');
		expect(DROP_ORDER[0]).toBe('quick');
	});

	it('offers to clear the search when the query is what emptied the scope', () => {
		const all = inChapter('italian');
		const ff = f({ q: 'zzzqqq' });
		const e = emptyState({ scope: 'Italian', inChapter: true, all, qPool: [], filters: ff, month, library: 0 });
		expect(e.culprit?.key).toBe('q');
		expect(e.sentence).toBe(
			`Nothing on the pass. Nothing matching “zzzqqq” in Italian. Clear the search for ${all.length} dishes; none anywhere in the library.`
		);
		// The live region must not re-announce on every keystroke of a dead query.
		const e2 = emptyState({ ...{ scope: 'Italian', inChapter: true, all, qPool: [], month, library: 0 }, filters: f({ q: 'zzzqq' }) });
		expect(e2.brief).toBe(e.brief);
		expect(e.brief).toBe('Nothing for that search in Italian.');
	});

	it('speaks in the singular for one dish', () => {
		/*
		 * Used to pull `R.find((r) => r.diet.vegetarian)` - whatever the corpus's
		 * FIRST vegetarian dish happens to be, in build order - and guard the
		 * only assertion behind `if (e.culprit)`. 307 of the corpus's 882
		 * vegetarian dishes are neither quick nor difficulty 3, so for most of
		 * them BOTH filters fail the dish at once, culprit is null (no single
		 * drop restores it), and the guarded assertion never runs while the test
		 * still reports green. One filter now, on a hand-built dish stated to
		 * fail exactly that one, the way the tie-break test above already does.
		 */
		const one = [{ ...R[0], slug: 'singular', minutes: 200, chapterSlug: 'x' }] as RecipeSummary[];
		const e = emptyState({ scope: 'X', inChapter: true, all: one, qPool: one, filters: f({ quick: true }), month, library: 0 });
		expect(e.culprit, 'the one filter that emptied a one-dish pool must be found').not.toBeNull();
		expect(e.sentence).toMatch(/for 1 dish;/);
	});

	it('drops the library clause on the library itself', () => {
		const ff = f({ course: 'Salad' as Course, difficulty: 3 });
		expect(count(R, ff), 'precondition: no advanced salad in the corpus').toBe(0);
		const e = emptyState({ scope: 'the library', inChapter: false, all: R, qPool: R, filters: ff, month, library: 0 });
		expect(e.sentence).not.toMatch(/across the library/);
		expect(e.sentence).toMatch(/^Nothing on the pass\. Nothing marked advanced and filed under Salad in the library\. Drop /);
	});
});
