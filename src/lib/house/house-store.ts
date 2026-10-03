/**
 * house-store.ts: where a House lives on a device, behind one small adapter.
 *
 * Every comment in this file ships inside the ported static/shared/oot-house.js
 * (tools/port-house.mjs transpiles with comments kept, and its assertClean
 * refuses any dash spelling, a carriage return and a regex literal outside
 * ASCII), so the comments here are dash-free and every regex is ASCII.
 *
 * PURE AND PORTABLE. No import from outside src/lib/house, no DOM at module
 * scope, no Svelte, no Node. Every function below takes its HouseStorage as
 * an argument, so the Node checks run the whole engine over a Map, the way
 * desk-inbox.ts takes its Storage.
 *
 * TWO SLOTS. The index (the list of houses and the current pointer) is small
 * and lives in localStorage under HOUSE_INDEX_KEY, read synchronously at
 * boot the way the Codex reads ST and the Ledger reads progress. The houses
 * themselves live in IndexedDB (database HOUSE_DB, store HOUSE_STORE, one
 * record per house keyed by its id), because a whole restaurant with its
 * lines and pairings outgrows a localStorage slot beside codexStats and the
 * Ledger's record on Safari's origin quota. Each wing's own projection is
 * still read synchronously at boot; the house arrives a moment later.
 *
 * NO WRITE ON LOAD, ANYWHERE. Reading the index, listing the houses and
 * loading one write nothing, and a device with rows and no index is an
 * IMPLICIT house that nothing here writes down until a person's act mints
 * it. The one function in this file that creates an index when none exists
 * is mintHouse; the pack import (house-pack.ts) is the other act of a person
 * that may. Every read is wrapped and never throws: a sandboxed frame, a
 * refused database or a damaged record reads as nothing.
 *
 * A PUT IS REFUSED WHOLE. The house is serialised and measured before a byte
 * is written, and a house over HOUSE_MAX_BYTES comes back { ok: false,
 * reason: 'too-big' }, with no IndexedDB { reason: 'no-storage' }, and on a
 * quota or any other failure { reason: 'refused' }; each said names the pack
 * export as the way out. The size is the JSON text's length, the measure
 * the desk inbox uses for its cap, and the stub on the index carries it.
 */
import { HOUSE_FORMAT, HOUSE_INDEX_KEY, HOUSE_DB, HOUSE_STORE, HOUSE_MAX_BYTES, ID_PREFIXES, emptyHouse, mintId } from './house-schema';
import type { Began, House, HouseIndex, HouseStub } from './house-schema';

/* -------------------------------------------------------------------------
 * The adapter
 * ---------------------------------------------------------------------- */

/** Why a put was refused: the house is over the cap, there is no database, or the database said no. */
export type StoreReason = 'too-big' | 'no-storage' | 'refused';

/** What a put comes back with: the size either way, and the reason in words when it was refused. */
export type StorePut = { ok: true; bytes: number } | { ok: false; reason: StoreReason; bytes: number; said: string };

/**
 * The six doors every function in this file uses. The index is synchronous
 * (localStorage, or a Map); the records are asynchronous (IndexedDB, or the
 * same Map). getIndex returns a validated index or null, never a throw;
 * setIndex says whether the write landed.
 */
export interface HouseStorage {
	getIndex(): HouseIndex | null;
	setIndex(index: HouseIndex): boolean;
	get(id: string): Promise<House | null>;
	put(id: string, house: House): Promise<StorePut>;
	remove(id: string): Promise<void>;
	list(): Promise<string[]>;
}

/** The name a house gets when a person mints one without naming it. */
export const MY_HOUSE = 'My house';

/* -------------------------------------------------------------------------
 * The shapes, checked on the way in
 * ---------------------------------------------------------------------- */

/** A stub with the five fields in their types, or nothing. */
function asStub(v: unknown): HouseStub | null {
	if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
	const s = v as Record<string, unknown>;
	if (typeof s.id !== 'string' || !s.id) return null;
	const began: Began = s.began === 'pack' || s.began === 'desk' ? s.began : 'hand';
	return {
		id: s.id,
		name: typeof s.name === 'string' ? s.name : '',
		ts: typeof s.ts === 'number' && Number.isFinite(s.ts) ? s.ts : 0,
		bytes: typeof s.bytes === 'number' && Number.isFinite(s.bytes) ? s.bytes : 0,
		began
	};
}

/**
 * Any value as an index, or null when it is not one: the version must be
 * 1, the list a list, and the current pointer a string on the list or null.
 * A stub that is not a stub is dropped; a pointer at a house not on the
 * list is cleared, so a damaged index can only read as fewer houses, never
 * as a house that is not there.
 */
export function asIndex(v: unknown): HouseIndex | null {
	if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
	const r = v as Record<string, unknown>;
	if (r.v !== 1 || !Array.isArray(r.list)) return null;
	const list: HouseStub[] = [];
	const seen = new Set<string>();
	for (const raw of r.list) {
		const stub = asStub(raw);
		if (stub && !seen.has(stub.id)) {
			seen.add(stub.id);
			list.push(stub);
		}
	}
	const current = typeof r.current === 'string' && seen.has(r.current) ? r.current : null;
	return { v: 1, current, list };
}

/** A stored value that is a House record under the id it was asked for. The shape only; the normaliser is the pack's door, not this one. */
function isHouseRecord(v: unknown, id: string): v is House {
	if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
	const h = v as Record<string, unknown>;
	return h.format === HOUSE_FORMAT && h.id === id;
}

/** The house as JSON text and its size, the measure every put and every stub uses. */
export function measureHouse(house: House): { json: string; bytes: number } {
	const json = JSON.stringify(house);
	return { json, bytes: json.length };
}

/** The sentence a refused put ends on, by reason. Every one names the pack export as the way out. */
export function storeSaid(reason: StoreReason, name: string): string {
	const who = name.trim() ? name.trim() : 'This house';
	if (reason === 'too-big') return who + ' is over the cap for one house. Export it as a pack to keep everything, then trim it or split it.';
	if (reason === 'no-storage') return 'This browser has no database to keep ' + who + ' in. Export it as a pack so nothing is lost.';
	return 'The browser refused to keep ' + who + '. Export it as a pack so nothing is lost, then clear some space.';
}

/* -------------------------------------------------------------------------
 * The Map adapter: tests, the Node checks, and a device with nothing else
 * ---------------------------------------------------------------------- */

/** The key a house record sits under in the Map, so one Map can also play localStorage for the wings in a check. */
export const MAP_HOUSE_PREFIX = 'oot-house.';

/**
 * A storage over one Map of strings. Everything is stored as JSON text and
 * parsed on the way out, so a record read is a copy, as it is from
 * IndexedDB, and a caller holding the object it put cannot change what is
 * stored. The index sits under HOUSE_INDEX_KEY and each house under
 * MAP_HOUSE_PREFIX and its id, so a Node check can seed one Map with a
 * wing's localStorage keys and this store at once. The put measures and
 * refuses over the cap exactly as the database adapter does, so the cap
 * rule is tested where the tests run.
 */
export function mapStorage(backing: Map<string, string> = new Map<string, string>()): HouseStorage {
	return {
		getIndex() {
			try {
				const text = backing.get(HOUSE_INDEX_KEY);
				return text === undefined ? null : asIndex(JSON.parse(text));
			} catch {
				return null;
			}
		},
		setIndex(index) {
			try {
				backing.set(HOUSE_INDEX_KEY, JSON.stringify(index));
				return true;
			} catch {
				return false;
			}
		},
		async get(id) {
			try {
				const text = backing.get(MAP_HOUSE_PREFIX + id);
				if (text === undefined) return null;
				const v: unknown = JSON.parse(text);
				return isHouseRecord(v, id) ? v : null;
			} catch {
				return null;
			}
		},
		async put(id, house) {
			let json = '';
			let bytes = 0;
			try {
				const m = measureHouse(house);
				json = m.json;
				bytes = m.bytes;
			} catch {
				return { ok: false, reason: 'refused', bytes: 0, said: storeSaid('refused', house.name) };
			}
			if (bytes > HOUSE_MAX_BYTES) return { ok: false, reason: 'too-big', bytes, said: storeSaid('too-big', house.name) };
			backing.set(MAP_HOUSE_PREFIX + id, json);
			return { ok: true, bytes };
		},
		async remove(id) {
			backing.delete(MAP_HOUSE_PREFIX + id);
		},
		async list() {
			const out: string[] = [];
			backing.forEach((_text, key) => {
				if (key.indexOf(MAP_HOUSE_PREFIX) === 0) out.push(key.slice(MAP_HOUSE_PREFIX.length));
			});
			return out;
		}
	};
}

/* -------------------------------------------------------------------------
 * The IndexedDB adapter: the browser
 * ---------------------------------------------------------------------- */

/** The two properties of a window this adapter reads. Either may be missing or may throw when touched; both cases read as absent. */
export interface HouseWindow {
	indexedDB?: IDBFactory | null;
	localStorage?: { getItem(key: string): string | null; setItem(key: string, value: string): void } | null;
}

/** One request as a promise: its result, or its error. */
function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error || new Error('the request failed'));
	});
}

/** One transaction as a promise: settled when it completes, failed when it errors or aborts, which is when a write is durable or not. */
function idbDone(tx: IDBTransaction): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error || new Error('the transaction failed'));
		tx.onabort = () => reject(tx.error || new Error('the transaction was aborted'));
	});
}

/**
 * The database opened at version 1 with the one store made, or null when
 * the browser refuses. A version change from another tab closes this
 * connection so that tab is never blocked by this one.
 */
function idbOpen(factory: IDBFactory, onClose: () => void): Promise<IDBDatabase | null> {
	return new Promise<IDBDatabase | null>((resolve) => {
		let req: IDBOpenDBRequest;
		try {
			req = factory.open(HOUSE_DB, 1);
		} catch {
			resolve(null);
			return;
		}
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(HOUSE_STORE)) db.createObjectStore(HOUSE_STORE);
		};
		req.onsuccess = () => {
			const db = req.result;
			db.onversionchange = () => {
				db.close();
				onClose();
			};
			resolve(db);
		};
		req.onerror = () => resolve(null);
	});
}

/**
 * The browser's storage: the index in localStorage, the houses in
 * IndexedDB through the raw API, no library. The database is opened once
 * and the connection kept; a failed transaction drops it so the next call
 * opens afresh, and so does an open the browser refused, because a private
 * window or a phone granting storage late refuses the first open and takes
 * the second, and one refusal at boot must not pin every later read to
 * nothing until a reload. Every read is caught and reads as nothing; every
 * write measures first and refuses whole with its reason.
 */
export function idbStorage(win: HouseWindow): HouseStorage {
	let opening: Promise<IDBDatabase | null> | null = null;
	const reset = () => {
		opening = null;
	};
	const factory = (): IDBFactory | null => {
		try {
			return win.indexedDB || null;
		} catch {
			return null;
		}
	};
	const open = (): Promise<IDBDatabase | null> => {
		if (!opening) {
			const f = factory();
			const raw: Promise<IDBDatabase | null> = f ? idbOpen(f, reset) : Promise.resolve(null);
			/* A refused open is never cached: the next call opens afresh. */
			const cached: Promise<IDBDatabase | null> = raw.then((db) => {
				if (!db && opening === cached) opening = null;
				return db;
			});
			opening = cached;
		}
		return opening;
	};
	const local = () => {
		try {
			return win.localStorage || null;
		} catch {
			return null;
		}
	};

	return {
		getIndex() {
			try {
				const ls = local();
				const text = ls ? ls.getItem(HOUSE_INDEX_KEY) : null;
				return text === null || text === undefined ? null : asIndex(JSON.parse(text));
			} catch {
				return null;
			}
		},
		setIndex(index) {
			try {
				const ls = local();
				if (!ls) return false;
				ls.setItem(HOUSE_INDEX_KEY, JSON.stringify(index));
				return true;
			} catch {
				return false;
			}
		},
		async get(id) {
			try {
				const db = await open();
				if (!db) return null;
				const tx = db.transaction(HOUSE_STORE, 'readonly');
				const v: unknown = await idbRequest(tx.objectStore(HOUSE_STORE).get(id));
				return isHouseRecord(v, id) ? v : null;
			} catch {
				reset();
				return null;
			}
		},
		async put(id, house) {
			let bytes = 0;
			try {
				bytes = measureHouse(house).bytes;
			} catch {
				return { ok: false, reason: 'refused', bytes: 0, said: storeSaid('refused', house.name) };
			}
			if (bytes > HOUSE_MAX_BYTES) return { ok: false, reason: 'too-big', bytes, said: storeSaid('too-big', house.name) };
			if (!factory()) return { ok: false, reason: 'no-storage', bytes, said: storeSaid('no-storage', house.name) };
			try {
				const db = await open();
				if (!db) return { ok: false, reason: 'refused', bytes, said: storeSaid('refused', house.name) };
				const tx = db.transaction(HOUSE_STORE, 'readwrite');
				const done = idbDone(tx);
				tx.objectStore(HOUSE_STORE).put(house, id);
				await done;
				return { ok: true, bytes };
			} catch {
				reset();
				return { ok: false, reason: 'refused', bytes, said: storeSaid('refused', house.name) };
			}
		},
		async remove(id) {
			try {
				const db = await open();
				if (!db) return;
				const tx = db.transaction(HOUSE_STORE, 'readwrite');
				const done = idbDone(tx);
				tx.objectStore(HOUSE_STORE).delete(id);
				await done;
			} catch {
				reset();
			}
		},
		async list() {
			try {
				const db = await open();
				if (!db) return [];
				const tx = db.transaction(HOUSE_STORE, 'readonly');
				const keys = await idbRequest(tx.objectStore(HOUSE_STORE).getAllKeys());
				return keys.filter((k): k is string => typeof k === 'string');
			} catch {
				reset();
				return [];
			}
		}
	};
}

/* -------------------------------------------------------------------------
 * The index
 * ---------------------------------------------------------------------- */

/** The index as the device holds it, or null when there is none. Writes nothing. */
export function readIndex(storage: HouseStorage): HouseIndex | null {
	try {
		return storage.getIndex();
	} catch {
		return null;
	}
}

/** The index written, or false when the device refused. */
export function writeIndex(storage: HouseStorage, index: HouseIndex): boolean {
	try {
		return storage.setIndex(index);
	} catch {
		return false;
	}
}

/** The current house's id, or null when the device has no index or no current house. */
export function currentId(storage: HouseStorage): string | null {
	const index = readIndex(storage);
	return index ? index.current : null;
}

/** The stubs on the index, in the index's order; empty when there is none. */
export function listHouses(storage: HouseStorage): HouseStub[] {
	const index = readIndex(storage);
	return index ? index.list.slice() : [];
}

/** The stub for one house, or undefined. */
function stubOf(index: HouseIndex, id: string): HouseStub | undefined {
	return index.list.find((s) => s.id === id);
}

/**
 * Every house id the device holds: the index's, in its order, and then any
 * record the index does not list, because a save never makes an index
 * (saveHouse below) and an index write can be refused after a record
 * landed, so the index is not the device. This is the one answer to "is
 * this id on the device" that a mint and an import may take, so neither
 * ever writes over a record the index forgot. A list the storage cannot
 * give reads as the index alone.
 */
export async function deviceIds(storage: HouseStorage): Promise<string[]> {
	const out = listHouses(storage).map((s) => s.id);
	const seen = new Set<string>(out);
	let stored: string[] = [];
	try {
		stored = await storage.list();
	} catch {
		stored = [];
	}
	for (const id of stored) {
		if (typeof id === 'string' && id && !seen.has(id)) {
			seen.add(id);
			out.push(id);
		}
	}
	return out;
}

/* -------------------------------------------------------------------------
 * The records
 * ---------------------------------------------------------------------- */

/** One house from the device, or null when it is not there or cannot be read. Writes nothing. */
export async function loadHouse(storage: HouseStorage, id: string): Promise<House | null> {
	try {
		return await storage.get(id);
	} catch {
		return null;
	}
}

/** What a save comes back with: the house as written (stamped), or the refusal with its size and reason. */
export type SaveResult = { ok: true; bytes: number; house: House } | { ok: false; reason: StoreReason; bytes: number; said: string };

/**
 * The record written with lastWrite stamped, and nothing else touched: the
 * index is the caller's business. The stamped copy comes back so the
 * caller keeps what the device holds.
 */
export async function putHouse(storage: HouseStorage, house: House, now: number): Promise<SaveResult> {
	const stamped: House = { ...house, lastWrite: now };
	let put: StorePut;
	try {
		put = await storage.put(stamped.id, stamped);
	} catch {
		put = { ok: false, reason: 'refused', bytes: 0, said: storeSaid('refused', house.name) };
	}
	return put.ok ? { ok: true, bytes: put.bytes, house: stamped } : put;
}

/**
 * The stub for this house brought up to date on an index that exists: its
 * name, its stamp, its size and how it began, added when the index lacks
 * it. An index that does not exist is NOT made here: that is mintHouse's
 * act alone, so a save can never be the write that turns an implicit
 * house into a real one behind a person's back.
 */
function touchStub(storage: HouseStorage, house: House, bytes: number, now: number): void {
	const index = readIndex(storage);
	if (!index) return;
	const stub: HouseStub = { id: house.id, name: house.name, ts: now, bytes, began: house.began };
	const at = index.list.findIndex((s) => s.id === house.id);
	const list = index.list.slice();
	if (at < 0) list.push(stub);
	else list[at] = stub;
	writeIndex(storage, { v: 1, current: index.current, list });
}

/**
 * A house saved: lastWrite stamped, the record written, and the stub's
 * name, stamp and size brought up to date on the index when there is one.
 * A refused write changes nothing on the device and says why.
 */
export async function saveHouse(storage: HouseStorage, house: House, now: number): Promise<SaveResult> {
	const saved = await putHouse(storage, house, now);
	if (saved.ok) touchStub(storage, saved.house, saved.bytes, now);
	return saved;
}

/* -------------------------------------------------------------------------
 * A person's acts
 * ---------------------------------------------------------------------- */

/** What minting comes back with: the house and whether it is now the current one, or the refusal. */
export type MintResult = { ok: true; house: House; current: boolean } | { ok: false; reason: StoreReason; said: string };

/**
 * A new, empty house under a fresh id, written and listed. This is the one
 * write in this file that makes an index when the device has none, because
 * it is a person's act: New house, the first save of an implicit house, the
 * first export. The first house on a device becomes current; a later one is
 * listed behind the current and the caller switches when it means to. A
 * refused index write takes the record back out, so the device never holds
 * a house its index does not know. The fresh id is drawn against every id
 * the device holds, listed or not, so a record the index forgot is never
 * written over.
 */
export async function mintHouse(storage: HouseStorage, name: string, began: Began, now: number, rand: () => number = Math.random): Promise<MintResult> {
	const taken = new Set<string>(await deviceIds(storage));
	const index = readIndex(storage);
	const id = mintId(ID_PREFIXES.house, taken, rand);
	const house = emptyHouse(id, name.trim() ? name.trim() : MY_HOUSE, began, now);
	const saved = await putHouse(storage, house, now);
	if (!saved.ok) return { ok: false, reason: saved.reason, said: saved.said };
	const stub: HouseStub = { id, name: house.name, ts: now, bytes: saved.bytes, began };
	const list = index ? [...index.list, stub] : [stub];
	const current = !index || index.current === null ? id : index.current;
	if (!writeIndex(storage, { v: 1, current, list })) {
		await storage.remove(id);
		return { ok: false, reason: 'refused', said: storeSaid('refused', house.name) };
	}
	return { ok: true, house: saved.house, current: current === id };
}

/**
 * The current pointer moved to a house on the index; the previous current
 * id comes back (null when there was none). An id not on the index is a
 * caller's error and is thrown, so a screen can never point at a house the
 * device does not hold; an index write the device refused is thrown too,
 * so a caller never takes a switch that did not land and shows a house the
 * device does not point at. The projections are the wings' to replace;
 * this moves the pointer and nothing else.
 */
export function switchTo(storage: HouseStorage, id: string): string | null {
	const index = readIndex(storage);
	if (!index || !stubOf(index, id)) throw new Error('switchTo: no house ' + id + ' on this device');
	const previous = index.current;
	if (previous !== id && !writeIndex(storage, { v: 1, current: id, list: index.list })) {
		throw new Error('switchTo: the device refused to write the index');
	}
	return previous;
}

/**
 * A house removed from the device, stub and record, only when the person
 * typed its name (the name as the index holds it, outer spaces aside). The
 * current pointer moves to the first house left, or to none. The index is
 * written first and the record deleted second: a refused index write then
 * changes nothing and false means nothing was removed, while a record the
 * delete could not reach is at worst an orphan the index no longer lists,
 * which deviceIds still sees and nothing writes over. SRS cards and the
 * wings' own rows are left where they are: removal of a house is not
 * removal of what a person learned.
 */
export async function removeHouse(storage: HouseStorage, id: string, typedName: string): Promise<boolean> {
	const index = readIndex(storage);
	const stub = index ? stubOf(index, id) : undefined;
	if (!index || !stub) return false;
	if (typedName.trim() !== stub.name.trim()) return false;
	const list = index.list.filter((s) => s.id !== id);
	const current = index.current === id ? (list.length ? list[0].id : null) : index.current;
	if (!writeIndex(storage, { v: 1, current, list })) return false;
	try {
		await storage.remove(id);
	} catch {
		/* the stub is gone and the record is an orphan; deviceIds still lists it */
	}
	return true;
}

/** The house renamed, record and stub; a blank name is refused and nothing is written. */
export async function renameHouse(storage: HouseStorage, id: string, name: string, now: number): Promise<boolean> {
	const clean = name.trim();
	if (!clean) return false;
	const house = await loadHouse(storage, id);
	if (!house) return false;
	if (house.name === clean) return true;
	const saved = await saveHouse(storage, { ...house, name: clean }, now);
	return saved.ok;
}
