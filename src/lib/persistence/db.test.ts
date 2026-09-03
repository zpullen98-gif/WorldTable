import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The write path honours the hold.
 *
 * idb-keyval is replaced by a Map, including `update` with the real contract:
 * the updater runs against the current value and a throw REJECTS without a
 * put. That contract is the whole reason saveSession goes through update()
 * rather than set() - the refusal is decided against what is on disk at write
 * time, not only at load time.
 */
const mem = new Map<string, unknown>();
vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('idb-keyval', () => ({
	createStore: () => ({}),
	// vi.fn() wrapping, not bare async functions, so a single test can override
	// one call with mockImplementationOnce/mockRejectedValueOnce without
	// touching the shared default behaviour every other test relies on.
	get: vi.fn(async (k: string) => mem.get(k)),
	set: vi.fn(async (k: string, v: unknown) => void mem.set(k, v)),
	del: vi.fn(async (k: string) => void mem.delete(k)),
	update: vi.fn(async (k: string, fn: (cur: unknown) => unknown) => {
		const next = fn(mem.get(k));
		mem.set(k, next);
	})
}));

import { get as idbGet } from 'idb-keyval';
import { loadSessionRecord, saveSession, loadAllSessions, heldReason } from './db';
import { EMPTY_SESSION, CURRENT_VERSION, type SessionState } from './state';

const v1 = (over: Partial<SessionState> = {}): SessionState => ({
	...structuredClone(EMPTY_SESSION),
	schemaVersion: CURRENT_VERSION,
	...over
});

describe('the session write path under a hold', () => {
	beforeEach(() => mem.clear());

	it('holds a newer record, snapshots nothing, and refuses to save over it', async () => {
		const future = {
			...v1({ pantry: ['Chicken'] }),
			schemaVersion: CURRENT_VERSION + 1,
			futureField: 'x'
		};
		mem.set('session', future);
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const read = await loadSessionRecord();
		expect(read.held).toBe(true);
		expect(read.state.pantry).toEqual([]);
		expect([...mem.keys()]).toEqual(['session']);
		expect(heldReason('session')).toBe('newer');

		const ok = await saveSession(v1({ pantry: ['Beef'] }));
		expect(ok).toBe(false);
		expect(mem.get('session')).toEqual(future);

		// Held once, warned once - not twice per load, and never a corrupt.* key.
		await loadSessionRecord();
		expect(warn).toHaveBeenCalledTimes(1);
		expect([...mem.keys()].some((k) => k.startsWith('corrupt.'))).toBe(false);
		warn.mockRestore();
	});

	it('refuses a record that landed AFTER a readable load', async () => {
		mem.set('session', v1({ pantry: ['Chicken'] }));
		expect((await loadSessionRecord()).held).toBe(false);
		// A sibling tab on a newer build writes while this one is open.
		const future = { ...v1({ pantry: ['Chicken'] }), schemaVersion: CURRENT_VERSION + 1 };
		mem.set('session', future);

		const ok = await saveSession(v1({ pantry: ['Beef'] }));
		expect(ok).toBe(false);
		expect(mem.get('session')).toEqual(future);
		expect(heldReason('session')).toBe('newer');
	});

	it('saves a current record and stamps lastWrite', async () => {
		mem.set('session', v1());
		await loadSessionRecord();
		const ok = await saveSession(v1({ pantry: ['Beef'] }));
		expect(ok).toBe(true);
		const on = mem.get('session') as SessionState;
		expect(on.pantry).toEqual(['Beef']);
		expect(typeof on.lastWrite).toBe('number');
	});

	it('reports a held roster member without writing anything', async () => {
		mem.set('session::a', v1({ pantry: ['Chicken'] }));
		mem.set('session::b', { ...v1(), schemaVersion: CURRENT_VERSION + 1 });
		const before = new Map(mem);
		const roster = await loadAllSessions([
			{ id: 'a', name: 'A' },
			{ id: 'b', name: 'B' }
		]);
		expect(roster.map((r) => [r.name, r.held])).toEqual([
			['A', false],
			['B', true]
		]);
		expect(mem).toEqual(before);
	});

	/**
	 * The defect: loadAllSessions used to read the whole roster with a single
	 * `getMany`, one readonly transaction over every key. getMany's own
	 * implementation is `Promise.all(keys.map(k => promisifyRequest(store.get(k))))`,
	 * so ONE key failing to deserialize rejected the whole batch, and the catch
	 * around it returned `[]` — the entire brigade, not just the one bad
	 * record, reported as having cooked nothing. That contradicted the
	 * function's own comment two lines above it: "One held record must not
	 * take the whole board down."
	 *
	 * Reading per key means a single rejection is contained exactly the way a
	 * malformed record already is, above.
	 */
	it('holds only the one roster member whose read failed, not the whole board', async () => {
		mem.set('session::a', v1({ pantry: ['Chicken'] }));
		mem.set('session::b', v1({ pantry: ['Beef'] }));
		mem.set('session::c', v1({ pantry: ['Duck'] }));
		vi.mocked(idbGet).mockImplementationOnce(async (k) => mem.get(k as string)); // a
		vi.mocked(idbGet).mockImplementationOnce(async () => {
			throw new Error('simulated transaction abort mid-read');
		}); // b
		vi.mocked(idbGet).mockImplementationOnce(async (k) => mem.get(k as string)); // c

		const roster = await loadAllSessions([
			{ id: 'a', name: 'A' },
			{ id: 'b', name: 'B' },
			{ id: 'c', name: 'C' }
		]);

		expect(roster.map((r) => [r.name, r.held])).toEqual([
			['A', false],
			['B', true],
			['C', false]
		]);
		// The healthy members' data must still be there, not collapsed with B's.
		expect(roster[0].session.pantry).toEqual(['Chicken']);
		expect(roster[2].session.pantry).toEqual(['Duck']);
	});
});
