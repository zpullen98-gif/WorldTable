import { describe, it, expect } from 'vitest';
import { LINEUP_CAP, addLineup, mergeLineup, normaliseLineup, removeLineup, type LineupEntry } from './lineup';
import { pickSession } from './floor-deck';
import type { DeckCard, FloorDeck } from './types';

const e = (slug: string, at: number, grade: LineupEntry['grade'] = 'met'): LineupEntry => ({ slug, at, grade });

describe('the lineup tally', () => {
	it('carries no person, and has no field that could', () => {
		expect(Object.keys(e('fd_0001', 1)).sort()).toEqual(['at', 'grade', 'slug']);
		// a row that arrives with a name loses it on the way in
		const dirty = [{ slug: 'fd_0001', at: 1, grade: 'missed', by: 'Sam', profileId: 'p-1' }];
		expect(normaliseLineup(dirty)).toEqual([{ slug: 'fd_0001', at: 1, grade: 'missed' }]);
	});

	it('drops what is malformed rather than minting a card called undefined', () => {
		expect(normaliseLineup([null, 7, { slug: 'x' }, { slug: 'fd_0001', at: 1, grade: 'close' }, e('fd_0002', 2)])).toEqual([e('fd_0002', 2)]);
		expect(normaliseLineup(undefined)).toEqual([]);
		expect(normaliseLineup({ 0: e('a', 1) })).toEqual([]);
	});

	it('merges as a union on slug and time: never a sum, never one per card', () => {
		const mine = [e('fd_0001', 1, 'missed'), e('fd_0001', 5)];
		const theirs = [e('fd_0001', 5), e('fd_0001', 9, 'missed'), e('fd_0002', 3)];
		const merged = mergeLineup(mine, theirs);
		expect(merged).toEqual([e('fd_0001', 1, 'missed'), e('fd_0002', 3), e('fd_0001', 5), e('fd_0001', 9, 'missed')]);
	});

	it('is idempotent: a file that goes round two tablets twice changes nothing', () => {
		const a = [e('fd_0001', 1), e('fd_0002', 2, 'missed')];
		const once = mergeLineup(a, [e('fd_0003', 3)]);
		expect(mergeLineup(once, [e('fd_0003', 3)])).toEqual(once);
		expect(mergeLineup(once, once)).toEqual(once);
	});

	it('does not care which side was mine', () => {
		const a = [e('fd_0001', 1), e('fd_0002', 4)];
		const b = [e('fd_0003', 2, 'missed'), e('fd_0002', 4)];
		expect(mergeLineup(a, b)).toEqual(mergeLineup(b, a));
	});

	it('caps after the union, keeping the newest, whichever side they came from', () => {
		const old = Array.from({ length: LINEUP_CAP }, (_, i) => e('fd_0001', i + 1));
		const fresh = [e('fd_0002', LINEUP_CAP + 10, 'missed')];
		const merged = mergeLineup(old, fresh);
		expect(merged).toHaveLength(LINEUP_CAP);
		expect(merged[merged.length - 1]).toEqual(fresh[0]);
		expect(merged[0].at).toBe(2); // the single oldest entry is the one that went
		expect(mergeLineup(fresh, old)).toEqual(merged);
	});

	it('adds one answer and takes back exactly one', () => {
		const log = addLineup(addLineup([], e('fd_0001', 10, 'missed')), e('fd_0001', 20));
		expect(log).toHaveLength(2);
		expect(removeLineup(log, 'fd_0001', 20)).toEqual([e('fd_0001', 10, 'missed')]);
		expect(removeLineup(log, 'fd_0001', 99)).toEqual(log);
	});
});

describe('a lineup is picked from the room, by the same picker as a sitting', () => {
	const cards: DeckCard[] = Array.from({ length: 12 }, (_, i) => ({
		id: `fd_${String(i + 1).padStart(4, '0')}`,
		term: `Term ${i + 1}`,
		section: 'cuts',
		level: 1,
		gist: `gist ${i + 1}`,
		guest: 'g',
		why: 'w'
	}));
	const deck: FloorDeck = { version: 1, frame: { madeWith: '', confirm: '' }, sections: [{ key: 'cuts', title: 'Cuts', blurb: '', count: 12 }], levels: [{ level: 1, name: 'Commis', blurb: '', count: 12 }], cards };
	const day = (d: number) => new Date(2026, 8, d, 16, 0, 0).getTime();

	it('asks what the room missed first, then walks on to what it has never been asked', () => {
		const room = [e('fd_0007', day(1), 'missed'), e('fd_0001', day(1)), e('fd_0002', day(1))];
		const lineup = pickSession(deck, room, day(2), { length: 8, newQuota: 4 });
		expect(lineup).toHaveLength(8);
		expect(lineup[0].id).toBe('fd_0007');
		const neverAsked = lineup.filter((c) => !room.some((r) => r.slug === c.id));
		expect(neverAsked.length).toBeGreaterThanOrEqual(4);
	});
});
