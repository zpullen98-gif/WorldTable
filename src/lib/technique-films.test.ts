import { describe, it, expect } from 'vitest';
import techniques from './data/techniques.json';
import type { Technique } from './types';

/**
 * The chosen technique films: the parts a network check cannot see.
 *
 * tools/check-films.mjs answers "does this id still play, and is it still the
 * film we described". It needs the network, so it is a release step and not a
 * gate. These are the things that can be checked offline on every commit, and
 * every one of them is a way the feature fails QUIETLY rather than loudly:
 *
 *   A malformed id renders a link that 404s only when clicked.
 *   An empty watchFor renders "Watch for:" followed by nothing.
 *   A film on a technique with no recipes is a page nobody can reach.
 *
 * The build itself already refuses a film pointing at a technique that does not
 * exist: see attachFilms in tools/derive/technique-films.mjs.
 */
const all = techniques as unknown as Technique[];
const withFilm = all.filter((t) => t.film);

describe('technique films', () => {
	it('are attached to a good share of the table', () => {
		/* A floor, not a target. It exists so that a refactor which silently
		   stops attaching films fails here rather than shipping 109 search
		   boxes and looking exactly like the day before the pass. */
		expect(withFilm.length).toBeGreaterThanOrEqual(80);
		expect(withFilm.length).toBeLessThanOrEqual(all.length);
	});

	it('carry an eleven character id that matches the url they link to', () => {
		for (const t of withFilm) {
			const f = t.film!;
			expect(f.id, t.slug).toMatch(/^[A-Za-z0-9_-]{11}$/);
			expect(f.url, t.slug).toBe(
				`https://www.youtube.com/watch?v=${f.id}` + (f.url.includes('&t=') ? f.url.slice(f.url.indexOf('&t=')) : '')
			);
			expect(f.url.startsWith('https://www.youtube.com/watch?v=' + f.id), t.slug).toBe(true);
		}
	});

	it('name the film and the channel, because "a canon film" tells a reader nothing', () => {
		for (const t of withFilm) {
			expect(t.film!.title.trim().length, t.slug).toBeGreaterThan(3);
			expect(t.film!.channel.trim().length, t.slug).toBeGreaterThan(1);
			/* Stray whitespace reaches the page: YouTube returns at least one
			   channel name with a trailing space. */
			expect(t.film!.title, t.slug).toBe(t.film!.title.trim());
			expect(t.film!.channel, t.slug).toBe(t.film!.channel.trim());
		}
	});

	it('say what to watch for, in a real sentence', () => {
		for (const t of withFilm) {
			const w = t.film!.watchFor;
			expect(w.trim().length, t.slug).toBeGreaterThan(40);
			/* A concatenation seam that lost its space glues two words together
			   and reads as a typo on the page. Caught once already. */
			expect(w, t.slug).not.toMatch(/[a-z]{16,}/);
		}
	});

	it('hold to the suite’s punctuation rule in our own prose', () => {
		/* The rule covers what WE wrote. It deliberately does not cover `title`
		   and `channel`, which are quotations: they are whatever YouTube returns,
		   and one of them really is "How to Knead Dough – Bake It Better with
		   Kye". Editing a dash out of somebody's video title would misrepresent
		   it, and would break the one contract this whole file rests on, that
		   the recorded title is the real one and can be checked against. */
		for (const t of withFilm) expect(t.film!.watchFor, t.slug).not.toMatch(/[–—]/);
	});

	it('are never pinned to a technique with no recipes to reach it', () => {
		for (const t of withFilm) expect(t.recipes.length, t.slug).toBeGreaterThan(0);
	});

	it('do not send two techniques to the same film without a reason', () => {
		/* deep-frying and draining-fried-food share the Epicurious frying 101 on
		   purpose: their watchFor lines point at different moments of it. Any
		   OTHER pair is a copied entry, which leaves one page describing a film
		   that is really about the other. */
		const allowed = new Set(['deep-frying|draining-fried-food-a-rack-never-paper']);
		const byId = new Map<string, string[]>();
		for (const t of withFilm) {
			byId.set(t.film!.id, [...(byId.get(t.film!.id) ?? []), t.slug]);
		}
		const shared = [...byId.values()]
			.filter((slugs) => slugs.length > 1)
			.map((slugs) => [...slugs].sort().join('|'))
			.filter((key) => !allowed.has(key));
		expect(shared).toEqual([]);
	});
});
