import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { HOUSE_INDEX_KEY, HOUSE_MAX_BYTES, emptyHouse } from './house-schema';
import type { House, HouseIndex, HouseStub } from './house-schema';
import {
	MAP_HOUSE_PREFIX,
	MY_HOUSE,
	asIndex,
	currentId,
	idbStorage,
	listHouses,
	loadHouse,
	mapStorage,
	measureHouse,
	mintHouse,
	putHouse,
	readIndex,
	removeHouse,
	renameHouse,
	saveHouse,
	storeSaid,
	switchTo,
	writeIndex
} from './house-store';
import type { HouseStorage, HouseWindow, StorePut } from './house-store';

/**
 * The store is the one place a House is written on a device, so what is
 * under test is the discipline around the writes: nothing on load, the cap
 * refused whole, the index made by a person's act alone, every read caught.
 * The Map adapter carries most of it, because the Node checks run over the
 * same adapter; the IndexedDB adapter is driven over a small fake of the
 * raw API so its request and transaction handling is exercised here and
 * not first in a browser.
 *
 * No dash is spelled in this file: the gate regex is built from escapes.
 */

const here = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const fixture = JSON.parse(readFileSync(here('./fixtures/house-min.json'), 'utf8')) as House;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const T0 = 1790800000000;

/** A fixed random source, so a run mints the same ids as the last. */
function seeded(start = 7): () => number {
	let n = start;
	return () => {
		n = (n * 9301 + 49297) % 233280;
		return n / 233280;
	};
}

const DASH = new RegExp(['\\u2014', '\\u2013', '&' + 'mdash;', '&#' + '8212;', '&#' + 'x2014;', ' ' + '-- '].join('|'));
const FORBIDDEN_KEY = /allerg|contain|free|safe|suitab|vegan|nut/i;

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

/* -------------------------------------------------------------------------
 * The files
 * ---------------------------------------------------------------------- */

describe('the three modules as files', () => {
	const files = ['house-store.ts', 'house-pack.ts', 'house-api.ts', 'house-store.test.ts', 'house-pack.test.ts', 'house-api.test.ts'];
	for (const f of files) {
		it(`${f} is dash-free, CR-free and ASCII`, () => {
			const text = readFileSync(here('./' + f), 'utf8');
			expect(DASH.test(text)).toBe(false);
			expect(text.includes('\r')).toBe(false);
			expect(/[^\x00-\x7f]/.test(text)).toBe(false);
		});
	}
});

/* -------------------------------------------------------------------------
 * The Map adapter
 * ---------------------------------------------------------------------- */

describe('the Map adapter', () => {
	it('puts a house, gets a copy of it, lists it and removes it', async () => {
		const backing = new Map<string, string>();
		const storage = mapStorage(backing);
		const house = clone(fixture);
		const put = await storage.put(house.id, house);
		expect(put.ok).toBe(true);
		expect(put.bytes).toBe(JSON.stringify(house).length);
		expect(backing.has(MAP_HOUSE_PREFIX + house.id)).toBe(true);
		const got = await storage.get(house.id);
		expect(got).toEqual(house);
		expect(got).not.toBe(house);
		expect(await storage.list()).toEqual([house.id]);
		await storage.remove(house.id);
		expect(await storage.get(house.id)).toBeNull();
		expect(await storage.list()).toEqual([]);
	});

	it('refuses a house over the cap whole, with the pack export as the way out', async () => {
		const backing = new Map<string, string>();
		const storage = mapStorage(backing);
		const house = clone(fixture);
		house.dishes[0].description = 'x'.repeat(HOUSE_MAX_BYTES);
		const put = await storage.put(house.id, house);
		expect(put.ok).toBe(false);
		if (put.ok) return;
		expect(put.reason).toBe('too-big');
		expect(put.bytes).toBeGreaterThan(HOUSE_MAX_BYTES);
		expect(put.said).toContain('pack');
		expect(put.said).toContain(house.name);
		expect(backing.size).toBe(0);
	});

	it('reads a damaged record, or one under another id, as nothing', async () => {
		const backing = new Map<string, string>();
		const storage = mapStorage(backing);
		backing.set(MAP_HOUSE_PREFIX + 'h-broken01', '{not json');
		backing.set(MAP_HOUSE_PREFIX + 'h-other001', JSON.stringify(fixture));
		expect(await storage.get('h-broken01')).toBeNull();
		expect(await storage.get('h-other001')).toBeNull();
		expect(await storage.get('h-missing1')).toBeNull();
		expect((await storage.list()).sort()).toEqual(['h-broken01', 'h-other001']);
	});

	it('keeps the index under HOUSE_INDEX_KEY and reads none or a damaged one as null', () => {
		const backing = new Map<string, string>();
		const storage = mapStorage(backing);
		expect(readIndex(storage)).toBeNull();
		expect(currentId(storage)).toBeNull();
		expect(listHouses(storage)).toEqual([]);
		backing.set(HOUSE_INDEX_KEY, 'nope');
		expect(readIndex(storage)).toBeNull();
		const stub: HouseStub = { id: 'h-lantern0', name: 'The Lantern Room', ts: T0, bytes: 12, began: 'pack' };
		const index: HouseIndex = { v: 1, current: 'h-lantern0', list: [stub] };
		expect(writeIndex(storage, index)).toBe(true);
		expect(JSON.parse(backing.get(HOUSE_INDEX_KEY) || '')).toEqual(index);
		expect(readIndex(storage)).toEqual(index);
		expect(currentId(storage)).toBe('h-lantern0');
		expect(listHouses(storage)).toEqual([stub]);
	});
});

describe('asIndex', () => {
	const stub = { id: 'h-a0000000', name: 'A', ts: 1, bytes: 2, began: 'hand' };

	it('takes version 1 with a list and nothing else', () => {
		expect(asIndex(null)).toBeNull();
		expect(asIndex([])).toBeNull();
		expect(asIndex({ v: 2, current: null, list: [] })).toBeNull();
		expect(asIndex({ v: 1, current: null })).toBeNull();
		expect(asIndex({ v: 1, current: null, list: [] })).toEqual({ v: 1, current: null, list: [] });
	});

	it('clears a pointer at a house not on the list, drops a stub with no id and a repeated id, and types the fields', () => {
		expect(asIndex({ v: 1, current: 'h-gone0000', list: [stub] })).toEqual({ v: 1, current: null, list: [stub] });
		expect(asIndex({ v: 1, current: 'h-a0000000', list: [stub, { name: 'no id' }, stub] })).toEqual({ v: 1, current: 'h-a0000000', list: [stub] });
		const loose = asIndex({ v: 1, current: 7, list: [{ id: 'h-b0000000', name: 4, ts: 'x', bytes: null, began: 'odd' }] });
		expect(loose).toEqual({ v: 1, current: null, list: [{ id: 'h-b0000000', name: '', ts: 0, bytes: 0, began: 'hand' }] });
	});
});

/* -------------------------------------------------------------------------
 * No write on load
 * ---------------------------------------------------------------------- */

describe('no write on load', () => {
	it('reading the index, listing, loading and the current pointer write nothing', async () => {
		const backing = new Map<string, string>();
		const storage = mapStorage(backing);
		readIndex(storage);
		currentId(storage);
		listHouses(storage);
		await loadHouse(storage, 'h-lantern0');
		expect(backing.size).toBe(0);
	});

	it('a save writes the record and never makes an index when there is none', async () => {
		const backing = new Map<string, string>();
		const storage = mapStorage(backing);
		const saved = await saveHouse(storage, clone(fixture), T0);
		expect(saved.ok).toBe(true);
		expect(backing.has(MAP_HOUSE_PREFIX + fixture.id)).toBe(true);
		expect(backing.has(HOUSE_INDEX_KEY)).toBe(false);
		expect(readIndex(storage)).toBeNull();
	});

	it('loadHouse, readIndex and writeIndex never throw over a storage that does', async () => {
		const throwing: HouseStorage = {
			getIndex: () => {
				throw new Error('no');
			},
			setIndex: () => {
				throw new Error('no');
			},
			get: () => Promise.reject(new Error('no')),
			put: () => Promise.reject(new Error('no')),
			remove: () => Promise.reject(new Error('no')),
			list: () => Promise.reject(new Error('no'))
		};
		expect(await loadHouse(throwing, 'h-lantern0')).toBeNull();
		expect(readIndex(throwing)).toBeNull();
		expect(currentId(throwing)).toBeNull();
		expect(listHouses(throwing)).toEqual([]);
		expect(writeIndex(throwing, { v: 1, current: null, list: [] })).toBe(false);
		const put = await putHouse(throwing, clone(fixture), T0);
		expect(put.ok).toBe(false);
		if (!put.ok) expect(put.reason).toBe('refused');
	});
});

/* -------------------------------------------------------------------------
 * A person's acts
 * ---------------------------------------------------------------------- */

describe('mintHouse', () => {
	it('makes the index and the first house becomes current; a later one is listed behind', async () => {
		const backing = new Map<string, string>();
		const storage = mapStorage(backing);
		const first = await mintHouse(storage, '', 'hand', T0, seeded());
		expect(first.ok).toBe(true);
		if (!first.ok) return;
		expect(first.current).toBe(true);
		expect(first.house.id).toMatch(/^h-[0-9a-z]{8}$/);
		expect(first.house.name).toBe(MY_HOUSE);
		expect(first.house.began).toBe('hand');
		expect(first.house.lastWrite).toBe(T0);
		expect(first.house).toEqual(await loadHouse(storage, first.house.id));
		const index = readIndex(storage);
		expect(index).toEqual({
			v: 1,
			current: first.house.id,
			list: [{ id: first.house.id, name: MY_HOUSE, ts: T0, bytes: measureHouse(first.house).bytes, began: 'hand' }]
		});

		const second = await mintHouse(storage, '  The Second Room ', 'desk', T0 + 1, seeded(11));
		expect(second.ok).toBe(true);
		if (!second.ok) return;
		expect(second.current).toBe(false);
		expect(second.house.name).toBe('The Second Room');
		expect(second.house.id).not.toBe(first.house.id);
		expect(currentId(storage)).toBe(first.house.id);
		expect(listHouses(storage).map((s) => s.id)).toEqual([first.house.id, second.house.id]);
	});

	it('skips an id already on the index', async () => {
		const storage = mapStorage();
		const a = await mintHouse(storage, 'A', 'hand', T0, seeded(3));
		const b = await mintHouse(storage, 'B', 'hand', T0, seeded(3));
		expect(a.ok && b.ok && a.house.id !== b.house.id).toBe(true);
	});

	it('takes the record back out when the index write is refused', async () => {
		const backing = new Map<string, string>();
		const inner = mapStorage(backing);
		const refusing: HouseStorage = { ...inner, setIndex: () => false };
		const minted = await mintHouse(refusing, 'A', 'hand', T0);
		expect(minted.ok).toBe(false);
		if (!minted.ok) expect(minted.reason).toBe('refused');
		expect(backing.size).toBe(0);
	});

	it('passes a refused put through with its reason', async () => {
		const inner = mapStorage();
		const refused: StorePut = { ok: false, reason: 'no-storage', bytes: 0, said: storeSaid('no-storage', 'A') };
		const refusing: HouseStorage = { ...inner, put: async () => refused };
		const minted = await mintHouse(refusing, 'A', 'hand', T0);
		expect(minted.ok).toBe(false);
		if (!minted.ok) expect(minted.reason).toBe('no-storage');
		expect(readIndex(refusing)).toBeNull();
	});
});

describe('saveHouse', () => {
	it('stamps lastWrite and brings the stub up to date', async () => {
		const storage = mapStorage();
		const minted = await mintHouse(storage, 'A', 'hand', T0);
		if (!minted.ok) throw new Error('mint failed');
		const next: House = { ...minted.house, name: 'A renamed', mustKnows: clone(fixture.mustKnows) };
		const saved = await saveHouse(storage, next, T0 + 5);
		expect(saved.ok).toBe(true);
		if (!saved.ok) return;
		expect(saved.house.lastWrite).toBe(T0 + 5);
		expect(next.lastWrite).toBe(T0);
		expect(await loadHouse(storage, next.id)).toEqual(saved.house);
		const stub = listHouses(storage)[0];
		expect(stub).toEqual({ id: next.id, name: 'A renamed', ts: T0 + 5, bytes: saved.bytes, began: 'hand' });
		expect(saved.bytes).toBe(measureHouse(saved.house).bytes);
	});

	it('adds a stub for a house the index lacks, when an index exists', async () => {
		const storage = mapStorage();
		await mintHouse(storage, 'A', 'hand', T0);
		const saved = await saveHouse(storage, clone(fixture), T0 + 1);
		expect(saved.ok).toBe(true);
		expect(listHouses(storage).map((s) => s.id)).toContain(fixture.id);
		expect(currentId(storage)).not.toBe(fixture.id);
	});

	it('changes nothing on the device when the put is refused', async () => {
		const backing = new Map<string, string>();
		const inner = mapStorage(backing);
		const minted = await mintHouse(inner, 'A', 'hand', T0);
		if (!minted.ok) throw new Error('mint failed');
		const before = new Map(backing);
		const refusing: HouseStorage = { ...inner, put: async () => ({ ok: false, reason: 'refused', bytes: 1, said: 'no' }) };
		const saved = await saveHouse(refusing, { ...minted.house, name: 'B' }, T0 + 1);
		expect(saved.ok).toBe(false);
		expect(backing).toEqual(before);
	});
});

describe('switchTo', () => {
	it('moves the pointer and returns the previous; an unknown id throws and moves nothing', async () => {
		const backing = new Map<string, string>();
		const storage = mapStorage(backing);
		const a = await mintHouse(storage, 'A', 'hand', T0, seeded(1));
		const b = await mintHouse(storage, 'B', 'hand', T0, seeded(2));
		if (!a.ok || !b.ok) throw new Error('mint failed');
		expect(switchTo(storage, b.house.id)).toBe(a.house.id);
		expect(currentId(storage)).toBe(b.house.id);
		const before = backing.get(HOUSE_INDEX_KEY);
		expect(() => switchTo(storage, 'h-nowhere0')).toThrow();
		expect(currentId(storage)).toBe(b.house.id);
		expect(switchTo(storage, b.house.id)).toBe(b.house.id);
		expect(backing.get(HOUSE_INDEX_KEY)).toBe(before);
	});

	it('throws over a device with no index', () => {
		expect(() => switchTo(mapStorage(), 'h-lantern0')).toThrow();
	});
});

describe('removeHouse', () => {
	it('refuses the wrong name and an unknown id, and removes on the typed name', async () => {
		const backing = new Map<string, string>();
		const storage = mapStorage(backing);
		const a = await mintHouse(storage, 'The Lantern Room', 'hand', T0, seeded(1));
		const b = await mintHouse(storage, 'B', 'hand', T0, seeded(2));
		if (!a.ok || !b.ok) throw new Error('mint failed');
		const before = new Map(backing);
		expect(await removeHouse(storage, a.house.id, 'The Lantern')).toBe(false);
		expect(await removeHouse(storage, a.house.id, 'the lantern room')).toBe(false);
		expect(await removeHouse(storage, 'h-nowhere0', 'The Lantern Room')).toBe(false);
		expect(backing).toEqual(before);

		expect(await removeHouse(storage, a.house.id, '  The Lantern Room ')).toBe(true);
		expect(await loadHouse(storage, a.house.id)).toBeNull();
		expect(listHouses(storage).map((s) => s.id)).toEqual([b.house.id]);
		expect(currentId(storage)).toBe(b.house.id);

		expect(await removeHouse(storage, b.house.id, 'B')).toBe(true);
		expect(readIndex(storage)).toEqual({ v: 1, current: null, list: [] });
		expect(await storage.list()).toEqual([]);
	});

	it('leaves the pointer alone when another house is removed', async () => {
		const storage = mapStorage();
		const a = await mintHouse(storage, 'A', 'hand', T0, seeded(1));
		const b = await mintHouse(storage, 'B', 'hand', T0, seeded(2));
		if (!a.ok || !b.ok) throw new Error('mint failed');
		expect(await removeHouse(storage, b.house.id, 'B')).toBe(true);
		expect(currentId(storage)).toBe(a.house.id);
	});
});

describe('renameHouse', () => {
	it('refuses a blank and an unknown id; renames the record and the stub; a same name writes nothing', async () => {
		const backing = new Map<string, string>();
		const storage = mapStorage(backing);
		const a = await mintHouse(storage, 'A', 'hand', T0);
		if (!a.ok) throw new Error('mint failed');
		expect(await renameHouse(storage, a.house.id, '   ', T0 + 1)).toBe(false);
		expect(await renameHouse(storage, 'h-nowhere0', 'B', T0 + 1)).toBe(false);
		expect(await renameHouse(storage, a.house.id, ' The Lamp Room ', T0 + 1)).toBe(true);
		const house = await loadHouse(storage, a.house.id);
		expect(house && house.name).toBe('The Lamp Room');
		expect(house && house.lastWrite).toBe(T0 + 1);
		expect(listHouses(storage)[0].name).toBe('The Lamp Room');
		const before = new Map(backing);
		expect(await renameHouse(storage, a.house.id, 'The Lamp Room', T0 + 2)).toBe(true);
		expect(backing).toEqual(before);
	});
});

/* -------------------------------------------------------------------------
 * The IndexedDB adapter, over a fake of the raw API
 * ---------------------------------------------------------------------- */

type Handler = ((ev: unknown) => void) | null;

interface FakeRequest {
	result: unknown;
	error: unknown;
	onsuccess: Handler;
	onerror: Handler;
	onupgradeneeded: Handler;
}

interface FakeTx {
	oncomplete: Handler;
	onerror: Handler;
	onabort: Handler;
	error: unknown;
	objectStore(name: string): FakeStore;
}

interface FakeStore {
	get(key: string): FakeRequest;
	put(value: unknown, key: string): FakeRequest;
	delete(key: string): FakeRequest;
	getAllKeys(): FakeRequest;
}

interface FakeDb {
	objectStoreNames: { contains(name: string): boolean };
	createObjectStore(name: string): void;
	transaction(name: string, mode: string): FakeTx;
	close(): void;
	onversionchange: Handler;
}

/**
 * Enough of IndexedDB for the adapter: open with an upgrade on the first
 * run, one store, get, put, delete and getAllKeys as requests that settle
 * on a later tick, a transaction that completes when its requests have and
 * aborts when one failed. `quota` makes every put fail the way a full disk
 * does; `refuseOpen` makes open throw.
 */
function fakeIndexedDB(opts: { quota?: boolean; refuseOpen?: boolean } = {}) {
	const data = new Map<string, unknown>();
	const stores = new Set<string>();
	const state = { opens: 0, closes: 0, quota: !!opts.quota, data };
	const later = (fn: () => void) => setTimeout(fn, 0);

	const makeTx = (name: string): FakeTx => {
		let pending = 0;
		let failed: unknown = null;
		let settled = false;
		const tx: FakeTx = {
			oncomplete: null,
			onerror: null,
			onabort: null,
			error: null,
			objectStore(storeName) {
				if (storeName !== name || !stores.has(storeName)) throw new Error('NotFoundError');
				const request = (run: () => unknown): FakeRequest => {
					const req: FakeRequest = { result: undefined, error: null, onsuccess: null, onerror: null, onupgradeneeded: null };
					pending++;
					later(() => {
						try {
							req.result = run();
							if (req.onsuccess) req.onsuccess({ target: req });
						} catch (e) {
							req.error = e;
							failed = e;
							if (req.onerror) req.onerror({ target: req });
						}
						pending--;
						later(() => {
							if (settled || pending) return;
							settled = true;
							if (failed) {
								tx.error = failed;
								if (tx.onabort) tx.onabort({ target: tx });
							} else if (tx.oncomplete) tx.oncomplete({ target: tx });
						});
					});
					return req;
				};
				return {
					get: (key) => request(() => data.get(key)),
					put: (value, key) =>
						request(() => {
							if (state.quota) {
								const err = new Error('quota');
								err.name = 'QuotaExceededError';
								throw err;
							}
							data.set(key, JSON.parse(JSON.stringify(value)));
							return key;
						}),
					delete: (key) =>
						request(() => {
							data.delete(key);
							return undefined;
						}),
					getAllKeys: () => request(() => [...data.keys()])
				};
			}
		};
		return tx;
	};

	const factory = {
		open(_name: string, _version: number): FakeRequest {
			if (opts.refuseOpen) throw new Error('SecurityError');
			state.opens++;
			const req: FakeRequest = { result: undefined, error: null, onsuccess: null, onerror: null, onupgradeneeded: null };
			const db: FakeDb = {
				objectStoreNames: { contains: (n) => stores.has(n) },
				createObjectStore: (n) => {
					stores.add(n);
				},
				transaction: (n) => makeTx(n),
				close: () => {
					state.closes++;
				},
				onversionchange: null
			};
			later(() => {
				req.result = db;
				if (state.opens === 1 && req.onupgradeneeded) req.onupgradeneeded({ target: req });
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

describe('the IndexedDB adapter', () => {
	it('with no IndexedDB: reads as nothing, a put says no-storage, and the index still works through localStorage', async () => {
		const local = fakeLocal();
		const storage = idbStorage({ localStorage: local });
		expect(await storage.get('h-lantern0')).toBeNull();
		expect(await storage.list()).toEqual([]);
		await storage.remove('h-lantern0');
		const put = await storage.put(fixture.id, clone(fixture));
		expect(put.ok).toBe(false);
		if (!put.ok) {
			expect(put.reason).toBe('no-storage');
			expect(put.said).toContain('pack');
		}
		const index: HouseIndex = { v: 1, current: null, list: [] };
		expect(storage.setIndex(index)).toBe(true);
		expect(local.map.get(HOUSE_INDEX_KEY)).toBe(JSON.stringify(index));
		expect(storage.getIndex()).toEqual(index);
	});

	it('with no localStorage, or one that throws, the index reads as nothing and a write says so', () => {
		expect(idbStorage({}).getIndex()).toBeNull();
		expect(idbStorage({}).setIndex({ v: 1, current: null, list: [] })).toBe(false);
		const win: HouseWindow = {
			get localStorage(): never {
				throw new Error('SecurityError');
			}
		};
		expect(idbStorage(win).getIndex()).toBeNull();
		expect(idbStorage(win).setIndex({ v: 1, current: null, list: [] })).toBe(false);
		const broken = idbStorage({
			localStorage: {
				getItem: () => {
					throw new Error('no');
				},
				setItem: () => {
					throw new Error('no');
				}
			}
		});
		expect(broken.getIndex()).toBeNull();
		expect(broken.setIndex({ v: 1, current: null, list: [] })).toBe(false);
	});

	it('over a fake database: put, get a copy, list, remove, one connection kept', async () => {
		const { factory, state } = fakeIndexedDB();
		const storage = idbStorage({ indexedDB: factory, localStorage: fakeLocal() });
		const house = clone(fixture);
		const put = await storage.put(house.id, house);
		expect(put).toEqual({ ok: true, bytes: JSON.stringify(house).length });
		expect(state.data.get(house.id)).toEqual(house);
		const got = await storage.get(house.id);
		expect(got).toEqual(house);
		expect(got).not.toBe(house);
		expect(await storage.get('h-nowhere0')).toBeNull();
		const other = { ...emptyHouse('h-second00', 'B', 'hand', T0) };
		expect((await storage.put(other.id, other)).ok).toBe(true);
		expect((await storage.list()).sort()).toEqual(['h-lantern0', 'h-second00']);
		await storage.remove(house.id);
		expect(await storage.list()).toEqual(['h-second00']);
		expect(await storage.get(house.id)).toBeNull();
		expect(state.opens).toBe(1);
	});

	it('refuses over the cap before touching the database, and says refused on a quota error', async () => {
		const { factory, state } = fakeIndexedDB({ quota: true });
		const storage = idbStorage({ indexedDB: factory, localStorage: fakeLocal() });
		const big = clone(fixture);
		big.dishes[0].description = 'x'.repeat(HOUSE_MAX_BYTES);
		const tooBig = await storage.put(big.id, big);
		expect(tooBig.ok).toBe(false);
		if (!tooBig.ok) expect(tooBig.reason).toBe('too-big');
		expect(state.opens).toBe(0);

		const put = await storage.put(fixture.id, clone(fixture));
		expect(put.ok).toBe(false);
		if (!put.ok) {
			expect(put.reason).toBe('refused');
			expect(put.said).toContain('pack');
		}
		expect(state.data.size).toBe(0);
		/* The connection is dropped after a failure and opened afresh for the next call. */
		state.quota = false;
		expect((await storage.put(fixture.id, clone(fixture))).ok).toBe(true);
		expect(state.opens).toBe(2);
	});

	it('reads as nothing and refuses a put when the database will not open', async () => {
		const { factory } = fakeIndexedDB({ refuseOpen: true });
		const storage = idbStorage({ indexedDB: factory, localStorage: fakeLocal() });
		expect(await storage.get(fixture.id)).toBeNull();
		expect(await storage.list()).toEqual([]);
		const put = await storage.put(fixture.id, clone(fixture));
		expect(put.ok).toBe(false);
		if (!put.ok) expect(put.reason).toBe('refused');
	});

	it('runs the whole engine over the fake the way it runs over the Map', async () => {
		const { factory } = fakeIndexedDB();
		const storage = idbStorage({ indexedDB: factory, localStorage: fakeLocal() });
		const minted = await mintHouse(storage, 'A', 'hand', T0, seeded());
		expect(minted.ok).toBe(true);
		if (!minted.ok) return;
		expect(currentId(storage)).toBe(minted.house.id);
		expect(await renameHouse(storage, minted.house.id, 'B', T0 + 1)).toBe(true);
		expect(listHouses(storage)[0].name).toBe('B');
		expect(await removeHouse(storage, minted.house.id, 'B')).toBe(true);
		expect(await storage.list()).toEqual([]);
	});
});

/* -------------------------------------------------------------------------
 * The keys a store writes
 * ---------------------------------------------------------------------- */

describe('what the store writes', () => {
	it('carries no key the client refuses, in the index or the records', async () => {
		const backing = new Map<string, string>();
		const storage = mapStorage(backing);
		await mintHouse(storage, 'A', 'hand', T0);
		await saveHouse(storage, clone(fixture), T0);
		for (const [key, text] of backing) {
			expect(FORBIDDEN_KEY.test(key.replace(/^oot-house\./, ''))).toBe(false);
			for (const k of keysDeep(JSON.parse(text))) expect(k).not.toMatch(FORBIDDEN_KEY);
		}
	});
});
