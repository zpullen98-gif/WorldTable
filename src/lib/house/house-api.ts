/**
 * house-api.ts: the one object every wing talks to, installed by the port as
 * window.OOT.house and used by the Table through createHouseApi directly.
 *
 * Every comment in this file ships inside the ported static/shared/oot-house.js
 * (tools/port-house.mjs transpiles with comments kept, and its assertClean
 * refuses any dash spelling, a carriage return and a regex literal outside
 * ASCII), so the comments here are dash-free and every regex is ASCII.
 *
 * PURE AND PORTABLE. No import from outside src/lib/house, no DOM at module
 * scope, no Svelte, no Node. The storage, the clock, the random source and
 * the window (for the storage event alone) are arguments, so the tests and
 * the Node checks build the whole api over a Map and a fake window. The
 * port joins this module with the other house modules in one IIFE, so no
 * top-level name here repeats one declared in any of them, and no import is
 * aliased (the port cuts the import lines and keeps the names).
 *
 * WHAT IT HOLDS. The current house, in memory after ready(), and nothing
 * else: the index is read fresh off the device on every call because it is
 * small and synchronous and another tab may have moved it. ready() reads
 * and never writes. Every write goes through one door (commit), which
 * saves the house, keeps the memory copy equal to what the device holds and
 * tells every listener; a refused save leaves the memory copy as it was,
 * so what a screen shows is always what the device has.
 *
 * EVERY METHOD GUARDS AGAINST NO CURRENT HOUSE. With no house, a read
 * returns its empty answer and a write returns false or { ok: false } with
 * the sentence NO_HOUSE_SAID, and nothing is written. The wings' rows are
 * then an implicit house, left alone until a person's act (mintHouse, an
 * import) makes one.
 *
 * KEPT MEANS by === 'person'. setMark never lets her mark displace a kept
 * one on this device, the rule setMaitre keeps in the Table; a person's
 * Keep, Edit and Discard are theirs. Every mark goes through the
 * normaliser's door (normaliseMark), so a key the client refuses cannot
 * ride in on a value, and removeItem writes a tombstone newer than the
 * item's last touch so the sync honours it on every wing. A tombstone is a
 * KEY in `removed`, so an id the client's sweep would refuse gets none: the
 * sync re-keys such a row before it enters (its rule 7), and an item that
 * still carries one is dropped without a tombstone rather than written as
 * a key that would make the record unsendable and the pack unimportable.
 *
 * ON THE DEVICE means deviceIds (house-store.ts), the index's houses and
 * any record the index does not list, wherever this file walks the device.
 */
import {
	BUILD_STEPS,
	COCKTAIL_PARTS,
	DISH_PARTS,
	HOUSE_INDEX_KEY,
	HOUSE_LISTS,
	HOUSE_MAX_BYTES,
	LINE_CAPS,
	MARK_FIELDS,
	PRINCIPLES,
	WINE_PARTS,
	isMark
} from './house-schema';
import type { Began, House, HouseList, HouseStub, ItemKind, Mark } from './house-schema';
import { FORBIDDEN_KEY, markKind, normaliseHouse, normaliseMark } from './house-normalise';
import { lastTouch, listOfKind } from './house-merge';
import { codexWine, ledgerCocktail, syncIn, syncOut, tableDish } from './house-sync';
import type { SyncAdapter, SyncChange, SyncRow } from './house-sync';
import { currentId, deviceIds, listHouses, loadHouse, mintHouse, removeHouse, renameHouse, saveHouse, switchTo } from './house-store';
import type { HouseStorage, SaveResult } from './house-store';
import { buildPack, importPack, packFilename, readPack } from './house-pack';
import type { ImportChoice, ImportResult, PackFile, PackFrom, ReadPack } from './house-pack';

/* -------------------------------------------------------------------------
 * The shapes
 * ---------------------------------------------------------------------- */

/** The sentence every write ends on when the device has no current house. */
export const NO_HOUSE_SAID = 'There is no house on this device yet. Make one, or import a pack.';

/** The five parts' labels by kind, so a screen or a drill picks its labels from one table. */
export const HOUSE_PARTS = { dish: DISH_PARTS, wine: WINE_PARTS, cocktail: COCKTAIL_PARTS } as const;

/** What changed, for the listeners. 'storage' is another tab's write; 'ready' is the first read. */
export type ChangeWhat = 'ready' | 'storage' | 'switch' | 'mint' | 'rename' | 'remove' | 'put' | 'sync' | 'mark' | 'card' | 'remove-item' | 'import';
export type ChangeListener = (house: House | null, what: ChangeWhat) => void;

/** The one thing a window must offer: the storage event, so another tab's write reaches this one. */
export interface HouseEventWindow {
	addEventListener(type: string, listener: (ev: unknown) => void): void;
}

export interface HouseApiOpts {
	/** The window whose storage event to listen on; none in a test or a Node check. */
	win?: HouseEventWindow | null;
	now?: () => number;
	rand?: () => number;
	/** The app this api serves, for the pack it builds. */
	from?: PackFrom;
}

/** What put comes back with: the row as the house now holds it (a new id when a name twin was re-keyed, null when a tombstone removed it or another house's row holds the id). */
export interface PutRow<R extends SyncRow = SyncRow> {
	ok: boolean;
	row: R | null;
	said?: string;
}

/** What sync comes back with: the rows the wing should now hold, and what happened per id. */
export interface SyncOut<R extends SyncRow = SyncRow> {
	ok: boolean;
	rows: R[];
	changes: SyncChange[];
	said?: string;
}

/** A list by its kind of item, by its name on the House, or the card itself. */
export type MarkTarget = ItemKind | HouseList | 'house';

/** The card's plain fields a screen may set; history is a mark and goes through setMark('house', ...). */
export const CARD_KEYS = ['name', 'address', 'phone', 'site', 'meals', 'dressCode', 'menusReadOn', 'sources'] as const;
export type HouseCard = Pick<House, (typeof CARD_KEYS)[number]>;

export interface HouseApi {
	/** The current house read into memory and the storage listener attached. Reads, never writes. Safe to call twice. */
	ready(): Promise<void>;
	current(): House | null;
	currentId(): string | null;
	list(): HouseStub[];
	/** The pointer moved and the house loaded; null, with memory left alone, when the id is not on the device or the device refused the pointer. The projections are the wing's to replace, through rows(). */
	switchTo(id: string): Promise<House | null>;
	/** A new empty house, current when the device had none; null when the device refused. */
	mintHouse(name: string, began?: Began): Promise<House | null>;
	rename(name: string, id?: string): Promise<boolean>;
	/** The house removed, only when the typed name matches. */
	remove(id: string, typedName: string): Promise<boolean>;
	/** One projection row, synced in after the wing's own save; the house saved when it changed. */
	put<R extends SyncRow>(kind: ItemKind, row: R): Promise<PutRow<R>>;
	/** A wing's whole list synced in; the house saved when it changed; the rows to write back. */
	sync<R extends SyncRow>(kind: ItemKind, rows: readonly R[]): Promise<SyncOut<R>>;
	/** The current house's items of one kind as rows, over the previous rows, for a switch. */
	rows<R extends SyncRow>(kind: ItemKind, prevRows?: readonly R[]): R[];
	/** A mark set (null discards it) on an item of a list, or on the card with target 'house'. */
	setMark(target: MarkTarget, id: string, field: string, mark: unknown): Promise<boolean>;
	setCard(fields: Partial<HouseCard>): Promise<boolean>;
	/** A tombstone written and the item dropped, so the wings' rows follow. */
	removeItem(target: ItemKind | HouseList, id: string): Promise<boolean>;
	/** Every item name of one kind on every house on the device, listed on the index or not, for an orphan sweep. */
	names(kind: ItemKind): Promise<string[]>;
	readPack(text: unknown): ReadPack;
	importPack(pack: unknown, choice: ImportChoice): Promise<ImportResult>;
	/** The current house as a pack, with its file name and text; null with no house. */
	buildPack(from?: PackFrom): { pack: PackFile; filename: string; text: string } | null;
	/** A listener for every save, a switch, and another tab's write; returns the function that removes it. */
	onChange(fn: ChangeListener): () => void;
	HOUSE_INDEX_KEY: typeof HOUSE_INDEX_KEY;
	HOUSE_MAX_BYTES: typeof HOUSE_MAX_BYTES;
	LINE_CAPS: typeof LINE_CAPS;
	DISH_PARTS: typeof DISH_PARTS;
	WINE_PARTS: typeof WINE_PARTS;
	COCKTAIL_PARTS: typeof COCKTAIL_PARTS;
	PARTS: typeof HOUSE_PARTS;
	PRINCIPLES: typeof PRINCIPLES;
	BUILD_STEPS: typeof BUILD_STEPS;
}

/* -------------------------------------------------------------------------
 * The small lookups
 * ---------------------------------------------------------------------- */

/** The wing's adapter for a kind: the Table's dishes, the Codex's wines, the Ledger's cocktails. */
export function adapterFor(kind: ItemKind): SyncAdapter<SyncRow> {
	if (kind === 'dish') return tableDish;
	if (kind === 'wine') return codexWine;
	return ledgerCocktail;
}

/** The list a target names: by kind of item, or by the list's own name. */
export function listFor(target: string): HouseList | undefined {
	const byKind = listOfKind(target);
	if (byKind) return byKind;
	return (HOUSE_LISTS as readonly string[]).indexOf(target) >= 0 ? (target as HouseList) : undefined;
}

/** Whether a mark may take a field's place: her mark never displaces a kept one. */
function mayReplace(current: unknown, next: Mark<unknown>): boolean {
	return !(isMark(current) && current.by === 'person' && next.by === 'maitre');
}

type Listed = { id: string; ts: number } & Record<string, unknown>;

/* -------------------------------------------------------------------------
 * The api
 * ---------------------------------------------------------------------- */

/**
 * The api over one storage. The Table calls this with its own IndexedDB
 * storage and window; the port calls it once at load for the two plain
 * wings and installs the result; a check calls it over a Map.
 */
export function createHouseApi(storage: HouseStorage, opts: HouseApiOpts = {}): HouseApi {
	const now = opts.now || (() => Date.now());
	const rand = opts.rand || Math.random;
	let house: House | null = null;
	let readying: Promise<void> | null = null;
	const listeners: ChangeListener[] = [];

	const fire = (what: ChangeWhat): void => {
		for (const fn of listeners.slice()) {
			try {
				fn(house, what);
			} catch {
				/* a listener's error is its own */
			}
		}
	};
	const known = (): string[] => listHouses(storage).map((s) => s.id);
	const reload = async (): Promise<void> => {
		const id = currentId(storage);
		house = id ? await loadHouse(storage, id) : null;
	};
	/** The one write door: the house saved, the memory copy made equal to the device's, the listeners told. */
	const commit = async (next: House, what: ChangeWhat): Promise<SaveResult> => {
		const saved = await saveHouse(storage, next, now());
		if (saved.ok) {
			house = saved.house;
			fire(what);
		}
		return saved;
	};
	const onStorage = (ev: unknown): void => {
		const key = ev && typeof ev === 'object' ? (ev as { key?: unknown }).key : undefined;
		if (key !== null && key !== undefined && key !== HOUSE_INDEX_KEY) return;
		void reload().then(() => fire('storage'));
	};
	const ready = (): Promise<void> => {
		if (!readying) {
			readying = reload().then(() => {
				if (opts.win) {
					try {
						opts.win.addEventListener('storage', onStorage);
					} catch {
						/* a window with no events is a window with no other tabs */
					}
				}
				fire('ready');
			});
		}
		return readying;
	};
	const itemsOf = (h: House, list: HouseList): Listed[] => h[list] as unknown as Listed[];

	return {
		ready,
		current: () => house,
		currentId: () => currentId(storage),
		list: () => listHouses(storage),

		switchTo: async (id) => {
			await ready();
			if (!listHouses(storage).some((s) => s.id === id)) return null;
			if (currentId(storage) !== id) {
				/* A refused pointer write is thrown by the store; the memory copy
				   stays with the house the device still points at. */
				try {
					switchTo(storage, id);
				} catch {
					return null;
				}
			}
			house = await loadHouse(storage, id);
			fire('switch');
			return house;
		},

		mintHouse: async (name, began = 'hand') => {
			await ready();
			const minted = await mintHouse(storage, name, began, now(), rand);
			if (!minted.ok) return null;
			if (minted.current) house = minted.house;
			fire('mint');
			return minted.house;
		},

		rename: async (name, id) => {
			await ready();
			const target = id || currentId(storage);
			if (!target) return false;
			const ok = await renameHouse(storage, target, name, now());
			if (!ok) return false;
			if (house && house.id === target) house = await loadHouse(storage, target);
			fire('rename');
			return true;
		},

		remove: async (id, typedName) => {
			await ready();
			const ok = await removeHouse(storage, id, typedName);
			if (!ok) return false;
			await reload();
			fire('remove');
			return true;
		},

		put: async <R extends SyncRow>(kind: ItemKind, row: R): Promise<PutRow<R>> => {
			await ready();
			if (!house) return { ok: false, row: null, said: NO_HOUSE_SAID };
			const adapter = adapterFor(kind) as unknown as SyncAdapter<R>;
			const res = syncIn<R>(kind, [row], house, adapter, { now: now(), knownHouses: known(), rand });
			/* The one row asked about: under its own id, under the item's id when a
			   name twin or a refused id was re-keyed (the change carries the former
			   id in from), or gone when a tombstone was newer. The rows the sync
			   would add for the house's other items are not this call's. */
			let out: R | null = res.rows.find((r) => r.id === row.id) || null;
			const renamed = res.changes.find((c) => c.what === 'renamed');
			if (renamed) out = res.rows.find((r) => r.id === renamed.id) || null;
			if (res.house !== house) {
				const saved = await commit(res.house, 'put');
				if (!saved.ok) return { ok: false, row: out, said: saved.said };
			}
			return { ok: true, row: out };
		},

		sync: async <R extends SyncRow>(kind: ItemKind, rows: readonly R[]): Promise<SyncOut<R>> => {
			await ready();
			if (!house) return { ok: false, rows: rows.slice(), changes: [], said: NO_HOUSE_SAID };
			const adapter = adapterFor(kind) as unknown as SyncAdapter<R>;
			const res = syncIn<R>(kind, rows, house, adapter, { now: now(), knownHouses: known(), rand });
			if (res.house !== house) {
				const saved = await commit(res.house, 'sync');
				if (!saved.ok) return { ok: false, rows: res.rows, changes: res.changes, said: saved.said };
			}
			return { ok: true, rows: res.rows, changes: res.changes };
		},

		rows: <R extends SyncRow>(kind: ItemKind, prevRows: readonly R[] = []): R[] => {
			if (!house) return [];
			return syncOut<R>(kind, house, adapterFor(kind) as unknown as SyncAdapter<R>, prevRows);
		},

		setMark: async (target, id, field, mark) => {
			await ready();
			if (!house) return false;
			if (target === 'house') {
				if ((MARK_FIELDS.house as readonly string[]).indexOf(field) < 0) return false;
				const card = { ...house } as unknown as Record<string, unknown>;
				if (mark === null) {
					if (!(field in card)) return false;
					delete card[field];
				} else {
					const m = isMark(mark) ? normaliseMark(mark, markKind(field)) : undefined;
					if (!m || !mayReplace(card[field], m)) return false;
					card[field] = m;
				}
				return (await commit(card as unknown as House, 'mark')).ok;
			}
			const list = listFor(target);
			if (!list) return false;
			if ((MARK_FIELDS[list] as readonly string[]).indexOf(field) < 0) return false;
			const items = itemsOf(house, list);
			const at = items.findIndex((i) => i.id === id);
			if (at < 0) return false;
			const item: Listed = { ...items[at] };
			if (mark === null) {
				if (!(field in item)) return false;
				delete item[field];
			} else {
				/* The shape first (a by and a finite stamp), then the normaliser's door for the value. */
				const m = isMark(mark) ? normaliseMark(mark, markKind(field)) : undefined;
				if (!m || !mayReplace(item[field], m)) return false;
				item[field] = m;
			}
			const nextList = items.slice();
			nextList[at] = item;
			return (await commit({ ...house, [list]: nextList } as House, 'mark')).ok;
		},

		setCard: async (fields) => {
			await ready();
			if (!house) return false;
			const patch: Record<string, unknown> = {};
			const given = fields as Record<string, unknown>;
			for (const k of CARD_KEYS) if (k in given && given[k] !== undefined) patch[k] = given[k];
			if (!Object.keys(patch).length) return false;
			if ('name' in patch && !String(patch.name).trim()) return false;
			/* Through the normaliser's door, so the card's strings are capped and no stray key rides in. */
			const { house: next } = normaliseHouse({ ...house, ...patch }, { rand });
			return (await commit(next, 'card')).ok;
		},

		removeItem: async (target, id) => {
			await ready();
			if (!house) return false;
			const list = listFor(target);
			if (!list) return false;
			const items = itemsOf(house, list);
			const item = items.find((i) => i.id === id);
			/* The tombstone must be newer than the item's last touch (a kept mark
			   re-stamps the mark, not the item), or the sync would read it as stale.
			   An id the client's key sweep would refuse gets no tombstone at all:
			   the item is dropped, the wing's own delete has taken the row, and
			   the record stays one the client sends and every device imports. */
			const stamp = item ? Math.max(now(), lastTouch(item, MARK_FIELDS[list]) + 1) : now();
			const removed = FORBIDDEN_KEY.test(id) ? house.removed : { ...house.removed, [id]: stamp };
			if (!item && removed === house.removed) return true;
			const next = { ...house, [list]: items.filter((i) => i.id !== id), removed } as House;
			return (await commit(next, 'remove-item')).ok;
		},

		names: async (kind) => {
			await ready();
			const list = listOfKind(kind);
			if (!list) return [];
			const out: string[] = [];
			const seen = new Set<string>();
			for (const id of await deviceIds(storage)) {
				const h = house && house.id === id ? house : await loadHouse(storage, id);
				if (!h) continue;
				for (const item of itemsOf(h, list)) {
					const name = typeof item.name === 'string' ? item.name.trim() : '';
					if (name && !seen.has(name)) {
						seen.add(name);
						out.push(name);
					}
				}
			}
			return out;
		},

		readPack: (text) => readPack(text, { rand }),

		importPack: async (pack, choice) => {
			await ready();
			const result = await importPack(storage, pack, choice, now(), rand);
			if (result.ok) {
				await reload();
				fire('import');
			}
			return result;
		},

		buildPack: (from) => {
			if (!house) return null;
			const at = now();
			const pack = buildPack(house, from || opts.from || 'table', at);
			return { pack, filename: packFilename(house, at), text: JSON.stringify(pack, null, '\t') };
		},

		onChange: (fn) => {
			listeners.push(fn);
			return () => {
				const i = listeners.indexOf(fn);
				if (i >= 0) listeners.splice(i, 1);
			};
		},

		HOUSE_INDEX_KEY,
		HOUSE_MAX_BYTES,
		LINE_CAPS,
		DISH_PARTS,
		WINE_PARTS,
		COCKTAIL_PARTS,
		PARTS: HOUSE_PARTS,
		PRINCIPLES,
		BUILD_STEPS
	};
}
