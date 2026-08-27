import { describe, it, expect } from 'vitest';
import {
	repertoire,
	dueList,
	cookedSlugs,
	sinceLabel,
	LADDER_DAYS,
	DAY_MS,
	type CookEntry
} from './repertoire';

/**
 * The schedule.
 *
 * Two of these tests exist because of defects found in the shipped app rather
 * than imagined ones: `cookedLog.length` was being read as a dish count while
 * markCooked appends on every finish, and the log's timestamps were never read
 * at all. Both are named below.
 */

/** A fixed clock. Date.now() in a test is a test that fails on a slow machine. */
const NOW = 1_760_000_000_000;
const daysAgo = (n: number) => NOW - n * DAY_MS;

const cook = (slug: string, at: number, grade?: CookEntry['grade']): CookEntry =>
	grade ? { slug, at, grade } : { slug, at };

describe('folding the log into a repertoire', () => {
	it('collapses repeats into one dish and counts them', () => {
		const r = repertoire(
			[cook('carbonara', daysAgo(90)), cook('carbonara', daysAgo(40)), cook('carbonara', daysAgo(3))],
			NOW
		);
		expect(r).toHaveLength(1);
		expect(r[0].times).toBe(3);
		expect(r[0].first).toBe(daysAgo(90));
		expect(r[0].last).toBe(daysAgo(3));
		expect(r[0].daysSince).toBe(3);
	});

	it('reads the log in time order even when the log is not sorted', () => {
		// mergeSessions returns a sorted log, but a hand-edited import or a
		// future writer need not, and the ladder depends on order.
		const shuffled = [
			cook('mole', daysAgo(10), 'missed'),
			cook('mole', daysAgo(80), 'met'),
			cook('mole', daysAgo(45), 'met')
		];
		const [e] = repertoire(shuffled, NOW);
		expect(e.first).toBe(daysAgo(80));
		expect(e.last).toBe(daysAgo(10));
		expect(e.lastGrade).toBe('missed');
	});

	it('is stable — sorted by slug, not by when each dish was cooked', () => {
		const r = repertoire([cook('zabaglione', daysAgo(1)), cook('aioli', daysAgo(9))], NOW);
		expect(r.map((e) => e.slug)).toEqual(['aioli', 'zabaglione']);
	});

	it('skips malformed entries rather than minting a dish called undefined', () => {
		const junk = [
			cook('aioli', daysAgo(2)),
			{ slug: 'aioli' },
			{ at: daysAgo(2) },
			null
		] as unknown as CookEntry[];
		const r = repertoire(junk, NOW);
		expect(r.map((e) => e.slug)).toEqual(['aioli']);
		expect(r[0].times).toBe(1);
	});
});

describe('the ladder responds to the grade, not just the count', () => {
	it('advances a rung on a plate that met its standard', () => {
		const r = repertoire([cook('aioli', daysAgo(1), 'met'), cook('aioli', NOW, 'met')], NOW);
		expect(r[0].rung).toBe(2);
		expect(r[0].intervalDays).toBe(LADDER_DAYS[1]);
	});

	it('advances on an ungraded cook — no standard to check is our gap, not the cook’s failure', () => {
		const r = repertoire([cook('aioli', daysAgo(1)), cook('aioli', NOW)], NOW);
		expect(r[0].rung).toBe(2);
	});

	it('holds the rung when the plate was close', () => {
		const r = repertoire(
			[cook('aioli', daysAgo(2), 'met'), cook('aioli', daysAgo(1), 'met'), cook('aioli', NOW, 'close')],
			NOW
		);
		expect(r[0].rung).toBe(2);
	});

	it('drops a rung when the plate missed — the dish comes back sooner', () => {
		const clean = repertoire(
			[cook('mole', daysAgo(3), 'met'), cook('mole', daysAgo(2), 'met'), cook('mole', daysAgo(1), 'met')],
			NOW
		);
		const ruined = repertoire(
			[cook('mole', daysAgo(3), 'met'), cook('mole', daysAgo(2), 'met'), cook('mole', daysAgo(1), 'missed')],
			NOW
		);
		expect(clean[0].rung).toBe(3);
		expect(ruined[0].rung).toBe(1);
		expect(ruined[0].intervalDays).toBeLessThan(clean[0].intervalDays);
	});

	it('never drops below the first rung, however badly it goes', () => {
		const r = repertoire(
			[cook('mole', daysAgo(3), 'missed'), cook('mole', daysAgo(2), 'missed'), cook('mole', daysAgo(1), 'missed')],
			NOW
		);
		expect(r[0].rung).toBe(1);
		expect(r[0].intervalDays).toBe(LADDER_DAYS[0]);
	});

	it('clamps at the top rung — cooking it twenty times does not earn a decade', () => {
		const log = Array.from({ length: 20 }, (_, i) => cook('aioli', daysAgo(20 - i), 'met'));
		const r = repertoire(log, NOW);
		expect(r[0].rung).toBe(LADDER_DAYS.length);
		expect(r[0].intervalDays).toBe(LADDER_DAYS[LADDER_DAYS.length - 1]);
	});
});

describe('how cold a dish has gone', () => {
	const one = (days: number) => repertoire([cook('aioli', daysAgo(days), 'met')], NOW)[0];

	it('is fresh well inside its interval', () => {
		expect(one(3).state).toBe('fresh');
	});

	it('is holding as the interval runs out', () => {
		expect(one(11).state).toBe('holding');
	});

	it('is due past the interval', () => {
		expect(one(20).state).toBe('due');
		expect(one(20).dueAt).toBe(daysAgo(20) + LADDER_DAYS[0] * DAY_MS);
	});

	it('is cold past twice the interval', () => {
		expect(one(40).state).toBe('cold');
	});

	it('a dish cooked five times is still fresh at three months', () => {
		const log = Array.from({ length: 5 }, (_, i) => cook('aioli', daysAgo(200 - i), 'met'));
		// Last cook 196 days ago against a 365-day interval — comfortably inside.
		expect(repertoire(log, NOW)[0].state).toBe('fresh');
	});
});

describe('what to cook next', () => {
	it('ranks by how far past due as a share of the interval, not by raw days', () => {
		// Both three weeks late. The fortnightly dish is 1.5x its interval; the
		// annual one is barely past. Sorting on dueAt would invert this.
		const log = [
			cook('annual-dish', daysAgo(365 + 21), 'met'),
			cook('annual-dish', daysAgo(365 + 22), 'met'),
			cook('annual-dish', daysAgo(365 + 23), 'met'),
			cook('annual-dish', daysAgo(365 + 24), 'met'),
			cook('annual-dish', daysAgo(365 + 25), 'met'),
			cook('fortnightly-dish', daysAgo(14 + 21), 'met')
		];
		const due = dueList(repertoire(log, NOW), NOW);
		expect(due.map((e) => e.slug)).toEqual(['fortnightly-dish', 'annual-dish']);
	});

	it('leaves fresh and holding dishes out of the queue', () => {
		const due = dueList(
			repertoire([cook('aioli', daysAgo(3)), cook('mole', daysAgo(40))], NOW),
			NOW
		);
		expect(due.map((e) => e.slug)).toEqual(['mole']);
	});
});

describe('counting dishes rather than cooks', () => {
	it('dedupes by slug — the home band read one dish cooked twice as two dishes', () => {
		const log = [cook('carbonara', daysAgo(9)), cook('carbonara', daysAgo(2)), cook('aioli', daysAgo(1))];
		expect(log.length).toBe(3);
		expect(cookedSlugs(log).size).toBe(2);
	});
});

describe('sinceLabel', () => {
	it.each([
		[0, 'today'],
		[1, 'yesterday'],
		[9, '9 days ago'],
		[28, '4 weeks ago'],
		[90, '3 months ago'],
		[400, 'a year ago'],
		[800, '2 years ago']
	])('%i days reads as %s', (days, label) => {
		expect(sinceLabel(days as number)).toBe(label);
	});
});
