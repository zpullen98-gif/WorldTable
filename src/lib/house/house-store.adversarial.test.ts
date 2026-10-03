import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { HOUSE_INDEX_KEY } from './house-schema';
import type { House } from './house-schema';
import { MAP_HOUSE_PREFIX, currentId, idbStorage, listHouses, mapStorage, mintHouse, readIndex, removeHouse, saveHouse } from './house-store';
import type { HouseStorage } from './house-store';
import { buildPack, importPack, readPack } from './house-pack';
import { createHouseApi } from './house-api';

/**
 * ADVERSARIAL CASES for house-store.ts, house-pack.ts and house-api.ts.
 *
 * Every case in this file was written to FAIL against the modules as they
 * stand on 3 Oct 2026, one case per hole the review found, so that a fix
 * turns it green and nothing else does. Each describe names the hole and
 * the line it lives on. None of these change a module; the fix is the
 * owner's call. The cases that the review found clean (no write on load,
 * the cap refused whole, every IndexedDB read caught, readPack writing
 * nothing, onChange after setMark, the pack dropping an allergens key) are
 * already pinned by the three sibling test files and are not repeated.
 *
 * No dash is spelled in this file, and no real person is named.
 */

const here = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const fixture = JSON.parse(readFileSync(here('./fixtures/house-min.json'), 'utf8')) as House;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const T0 = 1790800000000;
const NOW = 1790900000000;
const FORBIDDEN_KEY = /allerg|contain|free|safe|suitab|vegan|nut/i;

function seeded(start = 7): () => number {
	let n = start;
	return () => {
		n = (n * 9301 + 49297) % 233280;
		return n / 233280;
	};
}

function keysDeep(v: unknown, out: string[] = []): string[] {
	if (Array.isArray(v)) v.forEach((x) => keysDeep(x, out));
	else if (v && typeof v === 'object') {
		for (const [k, x] of Object.entries(v)) {
			out.push(k);
			keysDeep(x, out);
		}
	}
	return out;
}

const packText = (house: House = fixture) => JSON.stringify(buildPack(house, 'tools', T0));

/* -------------------------------------------------------------------------
 * Hole 1: "on the device" means "on the index", and the index is not the
 * device. saveHouse writes a record with no index (house-store.ts:471,
 * pinned by "a save writes the record and never makes an index"), so a
 * device can hold a record its index does not list. importPack builds
 * onDevice from the index alone (house-pack.ts:231) and nothing in the
 * three modules ever calls storage.list(), so such a record is overwritten
 * by a pack of the same id with no merge choice offered.
 * ---------------------------------------------------------------------- */

describe('hole 1: importPack overwrites a record the index does not list', () => {
	it('a record saved with no index is written over by a pack of the same id, with no choice offered', async () => {
		const backing = new Map<string, string>();
		const storage = mapStorage(backing);
		const mine = { ...clone(fixture), dressCode: 'mine, typed by hand' };
		const saved = await saveHouse(storage, mine, T0);
		expect(saved.ok).toBe(true);
		expect(readIndex(storage)).toBeNull();
		expect(await storage.list()).toEqual([fixture.id]);

		const theirs = { ...clone(fixture), dressCode: 'theirs, from the pack' };
		const result = await importPack(storage, packText(theirs), { mode: 'new' }, NOW);
		expect(result.ok).toBe(true);
		/* The record under the pack's id must still be mine: the pack either
		   landed under a fresh id or was refused, never written over mine. */
		const under = JSON.parse(backing.get(MAP_HOUSE_PREFIX + fixture.id) || 'null') as House | null;
		expect(under && under.dressCode).toBe('mine, typed by hand');
	});

	it('the same when an index exists but lacks that record', async () => {
		const backing = new Map<string, string>();
		const storage = mapStorage(backing);
		await mintHouse(storage, 'A', 'hand', T0, seeded(1));
		const mine = { ...clone(fixture), dressCode: 'mine' };
		backing.set(MAP_HOUSE_PREFIX + mine.id, JSON.stringify(mine));
		expect(listHouses(storage).map((s) => s.id)).not.toContain(fixture.id);

		const result = await importPack(storage, packText({ ...clone(fixture), dressCode: 'theirs' }), { mode: 'new' }, NOW);
		expect(result.ok).toBe(true);
		const under = JSON.parse(backing.get(MAP_HOUSE_PREFIX + fixture.id) || 'null') as House | null;
		expect(under && under.dressCode).toBe('mine');
	});
});

/* -------------------------------------------------------------------------
 * Hole 2: names() spans the index, not the device (house-api.ts:390). A
 * record the index does not list is missed, so the orphan sweep the plan
 * describes ("every cocktail name on every house on the device") would
 * drop a card for a drink that is on the device.
 * ---------------------------------------------------------------------- */

describe('hole 2: names() misses a house the index does not list', () => {
	it('a record saved before the index was made is not walked', async () => {
		const backing = new Map<string, string>();
		const storage = mapStorage(backing);
		expect((await saveHouse(storage, clone(fixture), T0)).ok).toBe(true);
		const minted = await mintHouse(storage, 'A', 'hand', T0, seeded(1));
		if (!minted.ok) throw new Error('mint failed');
		expect(await storage.list()).toContain(fixture.id);

		const api = createHouseApi(storage, { now: () => NOW, rand: seeded() });
		await api.ready();
		expect(await api.names('cocktail')).toContain('The Lantern Collins');
	});
});

/* -------------------------------------------------------------------------
 * Hole 3: after the last house is removed the index reads
 * { v: 1, current: null, list: [] } (house-store.ts:544). packBecomesCurrent
 * sees an index with a list of length 0, not 1, and says false
 * (house-pack.ts:191 to 192); the import then writes current: null
 * (house-pack.ts:257). The device holds one house and no current house, and
 * every api write answers NO_HOUSE_SAID until the person opens it. mintHouse
 * handles the same state the other way (house-store.ts:502: a null current
 * is taken), so the two acts disagree.
 * ---------------------------------------------------------------------- */

describe('hole 3: a pack imported onto a device with an empty index is not current', () => {
	it('the only house on the device should be the current one', async () => {
		const storage = mapStorage();
		const minted = await mintHouse(storage, 'A', 'hand', T0, seeded(1));
		if (!minted.ok) throw new Error('mint failed');
		expect(await removeHouse(storage, minted.house.id, 'A')).toBe(true);
		expect(readIndex(storage)).toEqual({ v: 1, current: null, list: [] });

		const result = await importPack(storage, packText(), { mode: 'new' }, NOW);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(listHouses(storage).map((s) => s.id)).toEqual([fixture.id]);
		expect(result.current).toBe(true);
		expect(currentId(storage)).toBe(fixture.id);
	});
});

/* -------------------------------------------------------------------------
 * Hole 4: api.switchTo ignores a refused index write. The store's switchTo
 * drops writeIndex's boolean (house-store.ts:521) and the api then loads
 * the new house into memory and fires 'switch' regardless
 * (house-api.ts:250 to 253). current() now answers one house and
 * currentId() another: the screen shows a house the device does not point
 * at, and the next ready() in any tab comes back to the old one.
 * ---------------------------------------------------------------------- */

describe('hole 4: api.switchTo answers a current() the device does not hold', () => {
	it('current() and currentId() disagree after a refused index write', async () => {
		const backing = new Map<string, string>();
		const inner = mapStorage(backing);
		let refuse = false;
		const storage: HouseStorage = { ...inner, setIndex: (index) => (refuse ? false : inner.setIndex(index)) };
		const api = createHouseApi(storage, { now: () => NOW, rand: seeded() });
		await api.ready();
		const a = await api.mintHouse('A');
		const b = await api.mintHouse('B');
		if (!a || !b) throw new Error('mint failed');
		expect(api.currentId()).toBe(a.id);

		refuse = true;
		const switched = await api.switchTo(b.id);
		const inMemory = api.current();
		expect(inMemory && inMemory.id).toBe(api.currentId());
		/* Either the switch is refused (null, memory unchanged) or it lands; a
		   house in memory that the index does not point at is neither. */
		if (switched) expect(api.currentId()).toBe(b.id);
	});
});

/* -------------------------------------------------------------------------
 * Hole 5: removeHouse deletes the record before it writes the index
 * (house-store.ts:538 then 544). When the index write is refused the
 * function returns false, but the record is already gone and the stub is
 * still listed: an index pointing at a house the device does not hold,
 * which asIndex cannot detect. The api then reports "not removed" while
 * the house is unreadable.
 * ---------------------------------------------------------------------- */

describe('hole 5: removeHouse loses the record when the index write is refused', () => {
	it('a false from removeHouse must mean nothing was removed', async () => {
		const backing = new Map<string, string>();
		const inner = mapStorage(backing);
		const minted = await mintHouse(inner, 'A', 'hand', T0, seeded(1));
		if (!minted.ok) throw new Error('mint failed');
		const refusing: HouseStorage = { ...inner, setIndex: () => false };
		const removed = await removeHouse(refusing, minted.house.id, 'A');
		if (removed) return;
		expect(backing.has(MAP_HOUSE_PREFIX + minted.house.id)).toBe(true);
		expect(listHouses(inner).map((s) => s.id)).toEqual([minted.house.id]);
	});
});

/* -------------------------------------------------------------------------
 * Hole 6: idbStorage caches a refused open for the life of the page. open()
 * keeps the promise in `opening` (house-store.ts:281 to 287) and only a
 * thrown transaction calls reset(); a null from idbOpen (the browser's
 * onerror, house-store.ts:258) is returned to get, put, remove and list
 * without a reset (house-store.ts:319, 339, 353, 365). One refused open at
 * boot, a thing Safari and Firefox private windows do while storage is
 * being granted, and every later read is null and every put is 'refused'
 * until a reload, although the comment at line 264 promises the next call
 * opens afresh.
 * ---------------------------------------------------------------------- */

type Handler = ((ev: unknown) => void) | null;
interface FakeReq {
	result: unknown;
	error: unknown;
	onsuccess: Handler;
	onerror: Handler;
	onupgradeneeded: Handler;
}

/** A factory whose first open fails through onerror and whose later opens succeed with one working store. */
function flakyIndexedDB(failures: number) {
	const data = new Map<string, unknown>();
	const state = { opens: 0, failures, data };
	const later = (fn: () => void) => setTimeout(fn, 0);
	const request = (tx: { pending: number; done: () => void }, run: () => unknown): FakeReq => {
		const req: FakeReq = { result: undefined, error: null, onsuccess: null, onerror: null, onupgradeneeded: null };
		tx.pending++;
		later(() => {
			req.result = run();
			if (req.onsuccess) req.onsuccess({ target: req });
			tx.pending--;
			later(() => tx.done());
		});
		return req;
	};
	const db = {
		objectStoreNames: { contains: () => true },
		createObjectStore() {},
		close() {},
		onversionchange: null as Handler,
		transaction() {
			const tx = {
				pending: 0,
				oncomplete: null as Handler,
				onerror: null as Handler,
				onabort: null as Handler,
				error: null as unknown,
				done() {
					if (!tx.pending && tx.oncomplete) tx.oncomplete({ target: tx });
				},
				objectStore() {
					return {
						get: (key: string) => request(tx, () => data.get(key)),
						put: (value: unknown, key: string) =>
							request(tx, () => {
								data.set(key, JSON.parse(JSON.stringify(value)));
								return key;
							}),
						delete: (key: string) =>
							request(tx, () => {
								data.delete(key);
								return undefined;
							}),
						getAllKeys: () => request(tx, () => [...data.keys()])
					};
				}
			};
			return tx;
		}
	};
	const factory = {
		open(): FakeReq {
			state.opens++;
			const req: FakeReq = { result: undefined, error: null, onsuccess: null, onerror: null, onupgradeneeded: null };
			later(() => {
				if (state.failures > 0) {
					state.failures--;
					req.error = new Error('UnknownError');
					if (req.onerror) req.onerror({ target: req });
					return;
				}
				req.result = db;
				if (req.onsuccess) req.onsuccess({ target: req });
			});
			return req;
		}
	};
	return { factory: factory as unknown as IDBFactory, state };
}

function fakeLocal() {
	const map = new Map<string, string>();
	return {
		map,
		getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
		setItem: (k: string, v: string) => {
			map.set(k, v);
		}
	};
}

describe('hole 6: idbStorage never retries after one refused open', () => {
	it('a read that found no database should let the next put open afresh', async () => {
		const { factory, state } = flakyIndexedDB(1);
		const storage = idbStorage({ indexedDB: factory, localStorage: fakeLocal() });
		expect(await storage.get(fixture.id)).toBeNull();
		expect(state.opens).toBe(1);
		const put = await storage.put(fixture.id, clone(fixture));
		expect(state.opens).toBe(2);
		expect(put.ok).toBe(true);
		expect(await storage.get(fixture.id)).toEqual(fixture);
	});
});

/* -------------------------------------------------------------------------
 * Hole 7: a tombstone is a KEY in `removed` (house-schema.ts:410), and the
 * wings mint item ids from eight random base36 characters, so an id can
 * read 'd-nut...' or 'b-...safe' and match the client's FORBIDDEN_KEY. The
 * normaliser draws its own fresh ids again when they would match
 * (house-normalise.ts:312 to 316), but removeItem writes whatever id it is
 * handed straight into `removed` (house-api.ts:380) and syncIn does the same
 * with a row id (house-sync.ts:478 to 541). The record on the device then
 * carries a key the client refuses, buildPack carries it out, and readPack
 * on the next device reports 'forbidden', which the validator counts fatal
 * (house-validate.ts:64, 190). A person's removal of one dish can make
 * their whole pack unimportable and their house unsendable to the Maitre d'.
 * ---------------------------------------------------------------------- */

describe('hole 7: removeItem writes a tombstone key the client refuses', () => {
	it('an item id containing nut, free or safe becomes a forbidden key on the record and in the pack', async () => {
		const backing = new Map<string, string>();
		const storage = mapStorage(backing);
		const api = createHouseApi(storage, { now: () => NOW, rand: seeded() });
		await api.ready();
		const imported = await api.importPack(packText(), { mode: 'new' });
		expect(imported.ok).toBe(true);

		/* A row the Table minted; the id is the wing's, not the normaliser's. */
		const row = { id: 'd-nutloaf1', name: 'Nut Loaf', section: 'Mains', description: 'A loaf', ingredients: ['walnuts'], price: '16', ts: NOW };
		expect((await api.put('dish', row)).ok).toBe(true);
		expect(await api.removeItem('dish', 'd-nutloaf1')).toBe(true);

		for (const [, text] of backing) for (const k of keysDeep(JSON.parse(text))) expect(k).not.toMatch(FORBIDDEN_KEY);
		const built = api.buildPack();
		expect(built).not.toBeNull();
		if (!built) return;
		const read = readPack(built.text);
		expect(read.ok).toBe(true);
		if (!read.ok) return;
		expect(read.problems.filter((p) => p.code === 'forbidden')).toEqual([]);
		expect(read.fatalCount).toBe(0);
	});
});
