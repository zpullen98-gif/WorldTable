import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
	HOUSE_DRILLED_CAP,
	HOUSE_DRILLED_KEY,
	clearDrilled,
	drilledCount,
	drilledKey,
	markDrilled,
	readDrilled,
	type SlotStorage
} from './house-drilled';

/**
 * The house drill slot: the shape of an entry, the key rule, the cap with
 * the newest kept, a slot that refuses, and the one structural claim that
 * matters most: nothing that exports a session or a pack reads this slot.
 */

/** A Map as the Storage, the way desk-inbox.test.ts does it. */
function mapStorage(): SlotStorage & { map: Map<string, string> } {
	const map = new Map<string, string>();
	return {
		map,
		getItem: (k) => map.get(k) ?? null,
		setItem: (k, v) => void map.set(k, v),
		removeItem: (k) => void map.delete(k)
	};
}

describe('the key', () => {
	it('is house, item and kind, colon separated and trimmed', () => {
		expect(drilledKey(' h-lantern0', 'd-chicken1 ', 'lineToDish')).toBe('house:h-lantern0:d-chicken1:lineToDish');
	});
});

describe('markDrilled', () => {
	it('writes { k, v, at } under the slot and reads it back oldest first', () => {
		const s = mapStorage();
		expect(markDrilled('house:h1:d1:lineToDish', 'met', s, 100)).toEqual({ ok: true, count: 1 });
		expect(markDrilled('house:h1:d2:sauceOf', 'missed', s, 200)).toEqual({ ok: true, count: 2 });
		expect(readDrilled(s)).toEqual([
			{ k: 'house:h1:d1:lineToDish', v: 'met', at: 100 },
			{ k: 'house:h1:d2:sauceOf', v: 'missed', at: 200 }
		]);
		expect(JSON.parse(s.map.get(HOUSE_DRILLED_KEY)!)).toHaveLength(2);
		expect(Object.keys(readDrilled(s)[0]).sort()).toEqual(['at', 'k', 'v']);
	});

	it('refuses a key that is not a house drill key, and a verdict that is not one, in words', () => {
		const s = mapStorage();
		expect(markDrilled('d1:lineToDish', 'met', s).ok).toBe(false);
		expect(markDrilled('house:h1:d1', 'met', s).ok).toBe(false);
		expect(markDrilled('house:h1:d1:lineToDish', 'maybe' as never, s).reason).toBe('not a verdict');
		expect(readDrilled(s)).toEqual([]);
	});

	it('takes close, the graders\' middle word, as a verdict', () => {
		const s = mapStorage();
		expect(markDrilled('house:h1:d1:say-s20', 'close', s, 300)).toEqual({ ok: true, count: 1 });
		expect(readDrilled(s)).toEqual([{ k: 'house:h1:d1:say-s20', v: 'close', at: 300 }]);
	});

	it('caps at HOUSE_DRILLED_CAP with the newest kept', () => {
		const s = mapStorage();
		expect(HOUSE_DRILLED_CAP).toBe(2000);
		for (let i = 0; i < HOUSE_DRILLED_CAP + 25; i++) markDrilled('house:h1:d' + i + ':sayIt', 'met', s, i);
		const list = readDrilled(s);
		expect(list).toHaveLength(HOUSE_DRILLED_CAP);
		expect(list[0].at).toBe(25);
		expect(list[list.length - 1].at).toBe(HOUSE_DRILLED_CAP + 24);
	});

	it('trims a slot that arrived over the cap on the next write', () => {
		const s = mapStorage();
		const big = Array.from({ length: HOUSE_DRILLED_CAP + 500 }, (_, i) => ({ k: 'house:h1:d' + i + ':sayIt', v: 'met', at: i }));
		s.setItem(HOUSE_DRILLED_KEY, JSON.stringify(big));
		expect(markDrilled('house:h1:dnew:sayIt', 'missed', s, 9999).count).toBe(HOUSE_DRILLED_CAP);
		const list = readDrilled(s);
		expect(list[list.length - 1]).toEqual({ k: 'house:h1:dnew:sayIt', v: 'missed', at: 9999 });
		expect(list[0].at).toBe(501);
	});

	it('drops a malformed row and reads an unreadable slot as empty', () => {
		const s = mapStorage();
		s.setItem(HOUSE_DRILLED_KEY, JSON.stringify([{ k: 'house:h1:d1:sayIt', v: 'met', at: 1 }, { k: 'nope', v: 'met', at: 2 }, 'junk', { k: 'house:h1:d2:sayIt', v: 'maybe', at: 3 }]));
		expect(readDrilled(s)).toEqual([{ k: 'house:h1:d1:sayIt', v: 'met', at: 1 }]);
		s.setItem(HOUSE_DRILLED_KEY, '{not json');
		expect(readDrilled(s)).toEqual([]);
		expect(readDrilled(undefined)).toEqual([]);
	});

	it('reports a refused write without throwing', () => {
		const s = mapStorage();
		s.setItem = () => {
			throw new Error('quota');
		};
		expect(markDrilled('house:h1:d1:sayIt', 'met', s)).toEqual({ ok: false, reason: 'the slot refused the write', count: 0 });
		expect(markDrilled('house:h1:d1:sayIt', 'met', undefined).ok).toBe(false);
	});
});

describe('drilledCount and clearDrilled', () => {
	it('count one house only, and clear the slot whole', () => {
		const s = mapStorage();
		markDrilled('house:h1:d1:sayIt', 'met', s);
		markDrilled('house:h1:d2:sayIt', 'met', s);
		markDrilled('house:h2:d1:sayIt', 'met', s);
		expect(drilledCount('h1', s)).toBe(2);
		expect(drilledCount('h2', s)).toBe(1);
		expect(drilledCount('h3', s)).toBe(0);
		expect(clearDrilled(s)).toBe(true);
		expect(readDrilled(s)).toEqual([]);
		expect(clearDrilled(undefined)).toBe(false);
	});
});

describe('the slot is exported with nothing', () => {
	it('is named by no export, pack, state or profile module, and no mode writes a level', () => {
		for (const file of ['src/lib/persistence/portable.ts', 'src/lib/persistence/state.ts', 'src/lib/house/house-pack.ts', 'src/lib/house/house-api.ts', 'src/lib/repertoire.ts']) {
			const src = readFileSync(file, 'utf8');
			expect(src, file + ' must not read the drill slot').not.toContain(HOUSE_DRILLED_KEY);
			expect(src, file + ' must not import house-drilled').not.toMatch(/house-drilled/);
		}
		// And the slot module itself reaches no level, no session and no rank.
		// The code, with its comments stripped: the header says in words what it is not.
		const self = readFileSync('src/lib/house-drilled.ts', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
		expect(self).not.toMatch(/^import /m);
		expect(self).not.toMatch(/drillLog|cookedLog|metSlugs|firstUnmetLevel/);
	});
});
