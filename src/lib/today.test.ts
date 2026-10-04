import { describe, it, expect } from 'vitest';
import { NEW_CAP, RUN_CAP, dueToday, todayLine, type TodayInput } from './today';
import type { CookEntry } from './repertoire';
import type { Verdict } from './study';
import type { DeckLevel } from './types';

/**
 * Due today (docs/consolidation-design.md 2.6, 3.6, 6.2, 7.2): fresh, mid
 * week, done, and the one count the pill, the row and the root share. The
 * store here is plain values; the slot's own reader is house-drilled.ts.
 */

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 4, 12);

function deck(n1: number, n2: number) {
	const cards: Array<{ id: string; level: DeckLevel }> = [];
	for (let i = 0; i < n1; i++) cards.push({ id: `fd_1${String(i).padStart(3, '0')}`, level: 1 });
	for (let i = 0; i < n2; i++) cards.push({ id: `fd_2${String(i).padStart(3, '0')}`, level: 2 });
	return { cards };
}

function input(over: Partial<TodayInput> = {}): TodayInput {
	return {
		now: NOW,
		level: 1,
		levelName: 'Commis',
		houseIds: ['d-a', 'd-b', 'd-c', 'd-d', 'd-e', 'd-f', 'd-g', 'd-h', 'd-i', 'd-j', 'd-k', 'd-l'],
		latest: new Map(),
		deck: deck(30, 30),
		drillLog: [],
		lexiconAt: ['braise', 'sear'],
		...over
	};
}

describe('dueToday', () => {
	it('on a fresh device deals new cards, the house first in menu order, ten at most', () => {
		const t = dueToday(input());
		expect(t.due).toBe(0);
		expect(t.fresh).toBe(NEW_CAP);
		expect(t.refs.slice(0, 3)).toEqual(['h:d-a', 'h:d-b', 'h:d-c']);
		expect(t.refs.every((r) => r.startsWith('h:'))).toBe(true);
		expect(t.line).toBe('10 new cards to start from the menu.');
	});

	it('with no house deals the level\'s unseen cards and never another level\'s', () => {
		const t = dueToday(input({ houseIds: [] }));
		expect(t.fresh).toBe(NEW_CAP);
		expect(t.refs.every((r) => r.startsWith('c:fd_1'))).toBe(true);
		expect(t.line).toBe('10 new cards to start at Commis.');
	});

	it('tops up a short house with the level', () => {
		const t = dueToday(input({ houseIds: ['d-a', 'd-b', 'd-c'] }));
		expect(t.refs.slice(0, 3)).toEqual(['h:d-a', 'h:d-b', 'h:d-c']);
		expect(t.refs[3]).toMatch(/^c:fd_1/);
		expect(t.fromMenu).toBe(3);
		expect(t.fromLevel).toBe(7);
		expect(t.line).toBe('10 new cards to start: 3 from the menu, 7 at Commis.');
	});

	it('mid week leads with what is due, then new up to the caps', () => {
		const latest = new Map<string, Verdict>([
			['d-a', 'again'],
			['d-b', 'got'],
			['d-c', 'again']
		]);
		const old = NOW - 30 * DAY;
		const drillLog: CookEntry[] = [
			{ slug: 'fd_1000', at: old, grade: 'missed' },
			{ slug: 'fd_1001', at: old, grade: 'close' },
			{ slug: 'braise', at: old, grade: 'close' }
		];
		const t = dueToday(input({ latest, drillLog }));
		expect(t.refs.slice(0, 2)).toEqual(['h:d-a', 'h:d-c']);
		expect(t.refs).toContain('c:fd_1000');
		expect(t.refs).toContain('t:braise');
		expect(t.due).toBeGreaterThanOrEqual(4);
		// the graded dish is not new again; the never-graded are, house first
		expect(t.refs).not.toContain('h:d-b');
		expect(t.refs[t.due]).toBe('h:d-d');
		expect(t.fresh).toBeLessThanOrEqual(NEW_CAP);
		expect(t.total).toBeLessThanOrEqual(RUN_CAP);
		expect(t.line).toMatch(/^\d+ due and \d+ new: \d+ from the menu, \d+ at Commis\.$/);
	});

	it('owed cards reach down a level, never up', () => {
		const drillLog: CookEntry[] = [
			{ slug: 'fd_1005', at: NOW - 2 * DAY, grade: 'missed' },
			{ slug: 'fd_2005', at: NOW - 2 * DAY, grade: 'missed' }
		];
		const atTwo = dueToday(input({ level: 2, levelName: 'Chef de Partie', houseIds: [], drillLog }));
		expect(atTwo.refs).toContain('c:fd_1005');
		expect(atTwo.refs).toContain('c:fd_2005');
		const atOne = dueToday(input({ houseIds: [], drillLog }));
		expect(atOne.refs).toContain('c:fd_1005');
		expect(atOne.refs).not.toContain('c:fd_2005');
	});

	it('is empty only when nothing is due and nothing is new', () => {
		const latest = new Map<string, Verdict>([['d-a', 'got']]);
		const drillLog: CookEntry[] = [{ slug: 'fd_1000', at: NOW - 1000, grade: 'met' }];
		const t = dueToday(input({ houseIds: ['d-a'], latest, deck: { cards: [{ id: 'fd_1000', level: 1 }] }, drillLog, lexiconAt: [] }));
		expect(t.total).toBe(0);
		expect(t.refs).toEqual([]);
		expect(t.line).toBe('Nothing due today and nothing new at Commis. Try the quick quiz.');
	});

	it('gives the pill, the row and the root one number, before and after a grade', () => {
		const before = dueToday(input());
		const after = dueToday(input({ latest: new Map([['d-a', 'got']]) }));
		for (const t of [before, after]) {
			expect(t.total).toBe(t.refs.length);
			expect(t.total).toBe(t.due + t.fresh);
			expect(t.total).toBe(t.fromMenu + t.fromLevel);
		}
		expect(after.refs).not.toContain('h:d-a');
	});
});

describe('todayLine', () => {
	it('says both numbers and where they come from, in words, with no numeral for a level', () => {
		expect(todayLine(3, 0, 3, 0, 'Sous Chef')).toBe('3 cards due from the menu.');
		expect(todayLine(1, 0, 0, 1, 'Sous Chef')).toBe('1 card due at Sous Chef.');
		expect(todayLine(4, 0, 1, 3, 'Sous Chef')).toBe('4 cards due: 1 from the menu, 3 at Sous Chef.');
		expect(todayLine(2, 5, 7, 0, 'Chef')).toBe('2 due and 5 new, all from the menu.');
		expect(todayLine(2, 5, 3, 4, 'Chef')).toBe('2 due and 5 new: 3 from the menu, 4 at Chef.');
		expect(todayLine(0, 1, 0, 1, 'Chef')).toBe('1 new card to start at Chef.');
		for (const s of [todayLine(0, 0, 0, 0, 'Chef'), todayLine(2, 5, 3, 4, 'Chef')]) expect(s).not.toMatch(/[\u2013\u2014]|--/);
	});
});
