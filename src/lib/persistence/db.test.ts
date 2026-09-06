import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

/* ---- the shared layer's two localStorage keys, and the first-name claim ----
 *
 * Node has no localStorage and no window; both are stubbed per test and
 * removed after, so the tests above keep running against the bare KEY_BASE.
 */
const ls = new Map<string, string>();
const fakeStorage = {
	getItem: (k: string) => ls.get(k) ?? null,
	setItem: (k: string, v: string) => void ls.set(k, v),
	removeItem: (k: string) => void ls.delete(k),
	clear: () => ls.clear()
};

type Roster = Array<{ id: string; name: string; legacy?: boolean }>;
function installOOT(currentId: string | null, roster: Roster) {
	const cur = roster.find((p) => p.id === currentId) ?? null;
	(globalThis as unknown as { window: unknown }).window = {
		OOT: {
			profiles: {
				key: (base: string) => (!cur || cur.legacy ? base : `${base}::${cur.id}`),
				list: () => roster.slice(),
				current: () => cur
			}
		}
	};
}
function uninstallOOT() {
	delete (globalThis as unknown as { window?: unknown }).window;
}

describe('the summary The Pass reads, written on every save', () => {
	beforeEach(() => {
		mem.clear();
		ls.clear();
		(globalThis as unknown as { localStorage: unknown }).localStorage = fakeStorage;
	});
	afterEach(() => {
		delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
		uninstallOOT();
	});

	it('writes dishes, rounds and the local last day under the bare key, and sets the history flag', async () => {
		mem.set('session', v1());
		await loadSessionRecord();
		const t1 = new Date(2026, 8, 3, 21, 30).getTime(); // 3 Sep, local
		const t2 = new Date(2026, 8, 5, 6, 0).getTime(); // 5 Sep, local
		const ok = await saveSession(
			v1({
				cookedLog: [
					{ slug: 'cacio-e-pepe', at: t1 },
					{ slug: 'cacio-e-pepe', at: t2, grade: 'met' },
					{ slug: 'coq-au-vin', at: t1 }
				],
				drillLog: [
					{ slug: 'maillard', at: t1, grade: 'close' },
					{ slug: 'hanger', at: t1 }
				]
			})
		);
		expect(ok).toBe(true);
		expect(JSON.parse(ls.get('world-table-summary-v1')!)).toEqual({
			dishesCooked: 2, // distinct dishes, not three cooks
			roundsAnswered: 2,
			lastDay: '2026-09-05'
		});
		expect(ls.get('world-table-has-history-v1')).toBe('1');
	});

	it('files the summary under the key that was WRITTEN, not the roster current', async () => {
		mem.set('session::p-out', v1());
		await saveSession(v1({ cookedLog: [{ slug: 'a', at: 1 }] }), 'session::p-out');
		expect(ls.has('world-table-summary-v1::p-out')).toBe(true);
		expect(ls.has('world-table-summary-v1')).toBe(false);
	});

	it('writes nothing for a held record', async () => {
		mem.set('session', { ...v1(), schemaVersion: CURRENT_VERSION + 1 });
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await loadSessionRecord();
		expect(await saveSession(v1({ cookedLog: [{ slug: 'a', at: 1 }] }))).toBe(false);
		expect(ls.size).toBe(0);
		warn.mockRestore();
	});
});

describe('the first name typed on a Table-only device keeps the kitchen', () => {
	beforeEach(() => {
		mem.clear();
		ls.clear();
		(globalThis as unknown as { localStorage: unknown }).localStorage = fakeStorage;
	});
	afterEach(() => {
		delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
		uninstallOOT();
	});

	it('copies the bare record into a named profile once, sets the flag, leaves the bare record', async () => {
		mem.set('session', v1({ pantry: ['Chicken'], cookedLog: [{ slug: 'a', at: 5 }] }));
		installOOT('p1', [{ id: 'p1', name: 'Maria' }]);

		const read = await loadSessionRecord();
		expect(read.held).toBe(false);
		expect(read.state.pantry).toEqual(['Chicken']);
		expect(mem.get('session::p1')).toEqual(mem.get('session'));
		expect(ls.get('world-table-session-claimed-v1')).toBe('1');

		// The second name typed starts empty: the kitchen was claimed already.
		installOOT('p2', [
			{ id: 'p1', name: 'Maria' },
			{ id: 'p2', name: 'Devon' }
		]);
		const second = await loadSessionRecord();
		expect(second.state.pantry).toEqual([]);
		expect(mem.has('session::p2')).toBe(false);
	});

	it('does not claim when a legacy profile already owns the bare record', async () => {
		mem.set('session', v1({ pantry: ['Chicken'] }));
		installOOT('p2', [
			{ id: 'p1', name: 'The bar', legacy: true },
			{ id: 'p2', name: 'Devon' }
		]);
		const read = await loadSessionRecord();
		expect(read.state.pantry).toEqual([]);
		expect(mem.has('session::p2')).toBe(false);
		expect(ls.has('world-table-session-claimed-v1')).toBe(false);
	});

	it('does not claim a bare record this build cannot read, and does not spend the flag on it', async () => {
		mem.set('session', { ...v1({ pantry: ['Chicken'] }), schemaVersion: CURRENT_VERSION + 1 });
		installOOT('p1', [{ id: 'p1', name: 'Maria' }]);
		const read = await loadSessionRecord();
		expect(read.held).toBe(false); // the named record is simply empty
		expect(read.state.pantry).toEqual([]);
		expect(mem.has('session::p1')).toBe(false);
		expect(ls.has('world-table-session-claimed-v1')).toBe(false);
	});

	it('never touches the legacy or unnamed path', async () => {
		mem.set('session', v1({ pantry: ['Chicken'] }));
		installOOT(null, []);
		const read = await loadSessionRecord();
		expect(read.state.pantry).toEqual(['Chicken']);
		expect([...mem.keys()]).toEqual(['session']);
		expect(ls.has('world-table-session-claimed-v1')).toBe(false);
	});
});
