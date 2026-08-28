import { describe, it, expect } from 'vitest';
import {
	bandFor,
	techniquesTouched,
	coverageFor,
	isTournant,
	whoCanCover,
	type Station,
	type Attempt,
	coldTechniques
} from './stations';

/**
 * Station coverage.
 *
 * The assertions that matter are the ones about what this must NOT claim. A
 * board that says somebody can run sauce when they cannot is worse than a board
 * that says nothing at all, so the bands are coarse on purpose and nothing here
 * ever produces a pass mark.
 */

const stations: Station[] = [
	{ key: 'saucier', name: 'Saucier', remit: 'sauces and sautés', techniques: ['Hollandaise', 'Making a roux', 'Reducing a sauce', 'Deglazing & pan sauces'] },
	{ key: 'patissier', name: 'Pâtissier', remit: 'pastry', techniques: ['Choux pastry', 'Lamination'] }
];

const recipes = new Map<string, string[]>([
	['Hollandaise', ['eggs-benedict', 'asparagus-hollandaise']],
	['Making a roux', ['bechamel', 'gumbo']],
	['Reducing a sauce', ['red-wine-jus']],
	['Deglazing & pan sauces', ['steak-au-poivre']],
	['Choux pastry', ['profiteroles']],
	['Lamination', ['croissants']]
]);

const at = (slug: string, day: number, grade?: Attempt['grade']): Attempt =>
	grade ? { slug, at: day * 86_400_000, grade } : { slug, at: day * 86_400_000 };

describe('bands, not scores', () => {
	it.each([
		[0, 4, 'none'],
		[1, 4, 'started'],
		[2, 4, 'most'],
		[3, 4, 'most'],
		[4, 4, 'all'],
		[0, 0, 'none']
	])('%i of %i reads as %s', (touched, of, want) => {
		expect(bandFor(touched as number, of as number)).toBe(want);
	});

	/**
	 * Deliberately coarse. A percentage invites a threshold, a threshold invites
	 * a pass mark, and a pass mark is the certification this must never become.
	 */
	it('never produces a percentage or a verdict', () => {
		const bands = [bandFor(1, 4), bandFor(3, 4), bandFor(4, 4)];
		for (const b of bands) {
			expect(['none', 'started', 'most', 'all']).toContain(b);
		}
	});
});

describe('what a cooked log already knows', () => {
	it('touches a technique when any dish drilling it was cooked', () => {
		const touched = techniquesTouched([at('gumbo', 1)], recipes);
		expect([...touched.keys()]).toEqual(['Making a roux']);
	});

	it('carries the grade through', () => {
		const touched = techniquesTouched([at('eggs-benedict', 1, 'met')], recipes);
		expect(touched.get('Hollandaise')).toBe('met');
	});

	it('reads the MOST RECENT attempt on a dish, not the first', () => {
		const touched = techniquesTouched(
			[at('eggs-benedict', 1, 'missed'), at('eggs-benedict', 9, 'met')],
			recipes
		);
		expect(touched.get('Hollandaise')).toBe('met');
	});

	/**
	 * One clean plate is evidence. A miss on a DIFFERENT dish of the same
	 * technique does not erase it — otherwise a cook is punished for attempting
	 * the harder dish.
	 */
	it('takes the best dish across a technique, not the worst', () => {
		const touched = techniquesTouched(
			[at('eggs-benedict', 1, 'met'), at('asparagus-hollandaise', 2, 'missed')],
			recipes
		);
		expect(touched.get('Hollandaise')).toBe('met');
	});

	it('knows nothing about a technique whose dishes were never cooked', () => {
		expect(techniquesTouched([at('croissants', 1)], recipes).has('Choux pastry')).toBe(false);
	});
});

describe('coverage across the line', () => {
	it('counts touched against the station total and names the gaps', () => {
		const cov = coverageFor([at('gumbo', 1), at('red-wine-jus', 2)], stations, recipes);
		const saucier = cov.find((c) => c.key === 'saucier')!;
		expect(saucier.of).toBe(4);
		expect(saucier.touched).toBe(2);
		expect(saucier.band).toBe('most');
		expect(saucier.gaps.sort()).toEqual(['Deglazing & pan sauces', 'Hollandaise']);
	});

	it('reports met separately, and never lets it decide the band', () => {
		const cov = coverageFor([at('gumbo', 1, 'missed'), at('red-wine-jus', 2, 'missed')], stations, recipes);
		const saucier = cov.find((c) => c.key === 'saucier')!;
		expect(saucier.met).toBe(0);
		// Two of four touched is still "most of it" — the band is about ground
		// covered, and the chef judges the quality.
		expect(saucier.band).toBe('most');
	});

	it('an empty log covers nothing anywhere', () => {
		expect(coverageFor([], stations, recipes).every((c) => c.band === 'none')).toBe(true);
	});
});

describe('the tournant', () => {
	it('is somebody who covers every station, not somebody who scored well', () => {
		const all = coverageFor(
			[
				at('gumbo', 1), at('red-wine-jus', 1), at('steak-au-poivre', 1), at('eggs-benedict', 1),
				at('profiteroles', 1), at('croissants', 1)
			],
			stations,
			recipes
		);
		expect(isTournant(all)).toBe(true);
	});

	it('is not awarded for five stations out of six', () => {
		const most = coverageFor([at('gumbo', 1), at('profiteroles', 1), at('croissants', 1)], stations, recipes);
		expect(isTournant(most)).toBe(false);
	});

	it('is never awarded on an empty roster', () => {
		expect(isTournant([])).toBe(false);
	});
});

describe('who can cover tonight', () => {
	const person = (id: string, name: string, attempts: Attempt[]) => ({
		id,
		name,
		coverage: coverageFor(attempts, stations, recipes)
	});

	it('ranks by ground covered, then by plates that met a standard', () => {
		const people = [
			person('a', 'Ana', [at('gumbo', 1)]),
			person('b', 'Ben', [at('gumbo', 1), at('red-wine-jus', 1), at('steak-au-poivre', 1)]),
			person('c', 'Cal', [at('gumbo', 1, 'met')])
		];
		const order = whoCanCover('saucier', people).map((p) => p.name);
		expect(order).toEqual(['Ben', 'Cal', 'Ana']);
	});

	it('still lists somebody who has never touched the station', () => {
		// Answering "nobody can cover this" is the most useful answer the board
		// can give, and it can only give it by listing the zeroes.
		const people = [person('a', 'Ana', [at('croissants', 1)])];
		const row = whoCanCover('saucier', people)[0];
		expect(row.touched).toBe(0);
		expect(row.band).toBe('none');
	});
});

describe('which techniques have gone cold', () => {
	/**
	 * "Can they still do it" is what a chef means by coverage, and the board had
	 * no answer at all: a technique cooked once three years ago read identically
	 * to one cooked last night.
	 */
	const DAY = 86_400_000;
	const now = 1_800_000_000_000;
	const byTech = new Map<string, string[]>([
		['Braising', ['coq-au-vin', 'boeuf-bourguignon']],
		['Searing', ['steak-frites']],
		['Whipping', ['meringue']]
	]);
	const cooked = (slug: string, daysAgo: number) => ({
		slug,
		at: now - daysAgo * DAY,
		grade: 'met' as const
	});

	it('says nothing about a technique never cooked — that is a gap, not a decay', () => {
		const out = coldTechniques([cooked('coq-au-vin', 1)], ['Braising', 'Whipping'], byTech, now);
		expect(out, 'an untouched technique was reported as cold').toEqual([]);
	});

	/** One dish still in date keeps the technique warm: the last time you did it counts. */
	it('keeps a technique warm while any of its dishes is still in date', () => {
		const log = [cooked('coq-au-vin', 900), cooked('boeuf-bourguignon', 1)];
		expect(coldTechniques(log, ['Braising'], byTech, now)).toEqual([]);
	});

	it('calls it cold when every dish drilling it is past its re-cook', () => {
		// One cook, years ago: the first rung is 14 days.
		const log = [cooked('steak-frites', 900)];
		expect(coldTechniques(log, ['Searing'], byTech, now)).toEqual(['Searing']);
	});

	it('leaves a technique cooked last night alone', () => {
		expect(coldTechniques([cooked('steak-frites', 1)], ['Searing'], byTech, now)).toEqual([]);
	});

	it('is empty for a cook who has done nothing', () => {
		expect(coldTechniques([], ['Braising', 'Searing'], byTech, now)).toEqual([]);
	});
});
