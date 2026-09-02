import { describe, it, expect } from 'vitest';
import {
	repertoire,
	dueList,
	cookedSlugs,
	scopeToSlugs,
	sinceLabel,
	LADDER_DAYS,
	TERM_LADDER_DAYS,
	DAY_MS,
	type CookEntry
} from './repertoire';
import drills from './data/drills.json';

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

/**
 * What a Lexicon quiz answer is worth, which is the specification for item 17.
 *
 * The quiz and the service drill now write to ONE log over the same terms - all
 * 186 drill cards are lexicon terms - so the two surfaces had to be given
 * different weights or the easier one would have driven the ladder. The drill
 * asks from a redacted prompt and grades `met`. The quiz shows the definition
 * raw (307 of 479 name their own term in the first 180 characters) and grades
 * `close`, which HOLDS the rung instead of advancing it.
 *
 * These four tests are the contract. If they go red, the meaning of every
 * shipped drill ladder has quietly changed.
 */
describe('a quiz answer on the term ladder', () => {
	const day = (n: number) => Date.now() - n * DAY_MS;

	it('never promotes: six correct quiz answers leave a term on the bottom rung', () => {
		const log: CookEntry[] = Array.from({ length: 6 }, (_, i) => ({
			slug: 'brunoise',
			at: day(60 - i * 10),
			grade: 'close' as const
		}));
		const [entry] = repertoire(log, Date.now(), TERM_LADDER_DAYS);
		expect(entry.intervalDays).toBe(TERM_LADDER_DAYS[0]);
	});

	it('does not block the drill: met, close, met still climbs', () => {
		const log: CookEntry[] = [
			{ slug: 'brunoise', at: day(30), grade: 'met' },
			{ slug: 'brunoise', at: day(20), grade: 'close' },
			{ slug: 'brunoise', at: day(10), grade: 'met' }
		];
		// rungFor starts at 0, so this is met -> 1, close holds 1, met -> 2, and
		// rung 2 is the ladder's SECOND interval. The point is that the close in
		// the middle cost the cook nothing.
		const [entry] = repertoire(log, Date.now(), TERM_LADDER_DAYS);
		expect(entry.intervalDays).toBe(TERM_LADDER_DAYS[1]);

		const withoutClose = repertoire(
			log.filter((e) => e.grade !== 'close'),
			Date.now(),
			TERM_LADDER_DAYS
		);
		expect(entry.intervalDays).toBe(withoutClose[0].intervalDays);
	});

	it('puts a never-answered term on the bottom rung and makes it due', () => {
		const log: CookEntry[] = [{ slug: 'brunoise', at: day(5), grade: 'close' }];
		const [entry] = repertoire(log, Date.now(), TERM_LADDER_DAYS);
		expect(entry.intervalDays).toBe(2);
		expect(dueList([entry], Date.now())).toHaveLength(1);
	});

	it('demotes by one on a miss and floors at the bottom', () => {
		const climb: CookEntry[] = [
			{ slug: 'brunoise', at: day(40), grade: 'met' },
			{ slug: 'brunoise', at: day(30), grade: 'met' }
		];
		const [before] = repertoire(climb, Date.now(), TERM_LADDER_DAYS);
		const [after] = repertoire(
			[...climb, { slug: 'brunoise', at: day(20), grade: 'missed' }],
			Date.now(),
			TERM_LADDER_DAYS
		);
		expect(after.intervalDays).toBeLessThan(before.intervalDays);

		const allMissed: CookEntry[] = Array.from({ length: 5 }, (_, i) => ({
			slug: 'brunoise',
			at: day(50 - i * 10),
			grade: 'missed' as const
		}));
		expect(repertoire(allMissed, Date.now(), TERM_LADDER_DAYS)[0].intervalDays).toBe(
			TERM_LADDER_DAYS[0]
		);
	});
});

/**
 * The partition.
 *
 * drillLog is one un-namespaced pool with three writers, and it was ALREADY
 * miscounting before the quiz joined: practise/firing writes the synthetic
 * slug `drill-firing-order`, which is neither a card nor a lexicon term, and
 * the service drill folded the whole log into the "N terms are due" line while
 * buildRound silently dropped it from the round. The page promised a term it
 * then did not ask.
 */
describe('scopeToSlugs', () => {
	const CARDS = new Set((drills as { cards: Array<{ slug: string }> }).cards.map((c) => c.slug));

	it('keeps the sentinel out of the service drill, against the real card set', () => {
		const real = [...CARDS][0];
		const log: CookEntry[] = [
			{ slug: 'drill-firing-order', at: Date.now() - DAY_MS * 30, grade: 'missed' },
			{ slug: real, at: Date.now() - DAY_MS * 30, grade: 'missed' }
		];
		const due = dueList(
			repertoire(scopeToSlugs(log, CARDS), Date.now(), TERM_LADDER_DAYS),
			Date.now()
		).map((e) => e.slug);
		expect(due).toEqual([real]);
	});

	it('preserves repeats and drops foreign slugs', () => {
		const log: CookEntry[] = [
			{ slug: 'a', at: 1, grade: 'met' },
			{ slug: 'b', at: 2, grade: 'met' },
			{ slug: 'a', at: 3, grade: 'missed' }
		];
		expect(scopeToSlugs(log, new Set(['a']))).toHaveLength(2);
		expect(scopeToSlugs(log, new Set())).toEqual([]);
	});
});
