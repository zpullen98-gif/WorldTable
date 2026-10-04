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
 * COMMIT IS OPTIMISTIC. A write is a function over the house in memory,
 * not a house computed in advance, because another tab's save can land
 * while this one awaits the database: its index write fires this tab's
 * storage listener, memory is reloaded from the device, and a house
 * computed before that reload would then be written over the other tab's
 * dish. So commit numbers every reload, applies the function to the house
 * in memory, saves, and when the number moved during the save applies the
 * function again over the reloaded house and saves once more, so both
 * tabs' writes are on the device and this tab's memory is what the device
 * holds. Bounded, so two tabs saving in a tight loop converge rather than
 * chase each other.
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
 * THE SHIPPED PACK AT BOOT. ensurePack is the one door every wing calls
 * with the text of the pack it ships: a house the device lacks is added
 * (current when the device has none, or its current house is an empty hand
 * house, or the caller asks); a newer edition refreshes the copy on the
 * device by the edition rule in house-pack.ts, so whatever a person kept,
 * edited or removed stands; the same or an older edition writes nothing.
 * A refresh never moves the current pointer.
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
	houseRows,
	isMark,
	optionalList
} from './house-schema';
import type { Began, House, HouseList, HouseStub, ItemKind, Mark } from './house-schema';
import { FORBIDDEN_KEY, markKind, normaliseHouse, normaliseMark } from './house-normalise';
import { lastTouch, listOfKind } from './house-merge';
import { codexWine, ledgerCocktail, syncIn, syncOut, tableDish } from './house-sync';
import type { SyncAdapter, SyncChange, SyncRow } from './house-sync';
import { currentId, deviceIds, listHouses, loadHouse, mintHouse, removeHouse, renameHouse, saveHouse, switchTo } from './house-store';
import type { HouseStorage, SaveResult } from './house-store';
import { buildPack, countItems, editionBuiltAt, importPack, packFilename, readPack, refreshEdition } from './house-pack';
import type { ImportChoice, ImportResult, PackFile, PackFrom, ReadPack, RefreshCounts } from './house-pack';

/* -------------------------------------------------------------------------
 * The shapes
 * ---------------------------------------------------------------------- */

/** The sentence every write ends on when the device has no current house. */
export const NO_HOUSE_SAID = 'There is no house on this device yet. Make one, or import a pack.';

/** The five parts' labels by kind, so a screen or a drill picks its labels from one table. */
export const HOUSE_PARTS = { dish: DISH_PARTS, wine: WINE_PARTS, cocktail: COCKTAIL_PARTS } as const;

/** What changed, for the listeners. 'storage' is another tab's write; 'ready' is the first read. */
export type ChangeWhat = 'ready' | 'storage' | 'switch' | 'mint' | 'rename' | 'remove' | 'put' | 'sync' | 'mark' | 'card' | 'field' | 'entry' | 'remove-item' | 'import';
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

/**
 * The House-only plain fields a screen may set on an item, by kind: the
 * service note (a person's words, never hers) on every kind, a dish's
 * signature flag, a wine's pours. Everything shared with the wing (the name,
 * the price, the spec, the grapes and the rest) comes through the wing's own
 * row and put, and a mark goes through setMark, so setItemField refuses them.
 */
export const ITEM_FIELDS = {
	dish: ['serviceNote', 'signature'],
	wine: ['serviceNote', 'pours'],
	cocktail: ['serviceNote']
} as const satisfies Record<ItemKind, readonly string[]>;
export interface ItemFields {
	serviceNote: string;
	signature: boolean;
	pours: string[];
}

/** What ensurePack may be asked: make the pack's house current when it is added, whatever the device holds. */
export interface EnsureOpts {
	makeCurrent?: boolean;
}

/**
 * What ensurePack comes back with: the house added (and whether it is now
 * current), refreshed by a newer edition (with the counts), already the
 * shipped edition or newer (nothing written), or refused with the sentence.
 */
export type EnsureResult =
	| { action: 'added'; id: string; current: boolean }
	| { action: 'refreshed'; id: string; counts: RefreshCounts }
	| { action: 'current'; id: string }
	| { action: 'refused'; said: string };

/** The lists putListItem writes: every list whose records have no wing row of their own. */
export const PUT_LISTS = ['tastings', 'lexicon', 'scenarios', 'mixUps', 'mustKnows', 'askAtLineup', 'disputes'] as const satisfies readonly HouseList[];
export type PutList = (typeof PUT_LISTS)[number];
export type ListEntry<L extends PutList> = House[L][number];

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
	/** The House-only plain fields of one item set, through the normaliser; false on an unknown key, a shared field, a missing item or an empty patch. */
	setItemField(kind: ItemKind, id: string, patch: Partial<ItemFields>): Promise<boolean>;
	/** One entry of a list added or replaced by id (minted with the list's prefix when absent), its unnamed marks kept; the saved entry, or null when refused. */
	putListItem<L extends PutList>(list: L, item: Partial<ListEntry<L>>): Promise<ListEntry<L> | null>;
	/** A tombstone written and the item dropped, so the wings' rows follow. */
	removeItem(target: ItemKind | HouseList, id: string): Promise<boolean>;
	/** Every item name of one kind on every house on the device, listed on the index or not, for an orphan sweep. */
	names(kind: ItemKind): Promise<string[]>;
	readPack(text: unknown): ReadPack;
	importPack(pack: unknown, choice: ImportChoice): Promise<ImportResult>;
	/**
	 * The one door a wing calls at boot with the shipped pack's text: the
	 * house added when the device lacks it, refreshed by the edition rule
	 * when the shipped edition is newer, else left alone. Never switches the
	 * current house on a refresh.
	 */
	ensurePack(text: unknown, opts?: EnsureOpts): Promise<EnsureResult>;
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
	/* Moved on every assignment of house from outside a commit (a reload, a
	   switch, a mint), so a commit in flight can tell the house moved under it. */
	let moved = 0;
	/** The commits in flight, in order: every commit waits for the one before
	    it to land before it reads the house, so two writes in one tab never
	    read one base and the later never buries the earlier. */
	let writing: Promise<unknown> = Promise.resolve();
	let readying: Promise<void> | null = null;
	const listeners: ChangeListener[] = [];
	/** How many times a commit re-applies its change over a house that moved during its save. */
	const COMMIT_TRIES = 4;

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
	const setHouse = (h: House | null): void => {
		house = h;
		moved += 1;
	};
	const reload = async (): Promise<void> => {
		const id = currentId(storage);
		setHouse(id ? await loadHouse(storage, id) : null);
	};
	/**
	 * The one write door. The change is a function over the house in memory
	 * that returns the next house (the same object when nothing changed) and
	 * whatever its caller needs back; unchanged means nothing is written.
	 * When memory moved during the save (another tab's write, reloaded), the
	 * function is applied again over the house as it now stands and saved
	 * once more, so the device ends with both tabs' work. A refused save
	 * leaves memory as it was and comes back with the reason.
	 *
	 * Commits are serialised: a commit that starts while another is saving
	 * waits for that save to land (ok or refused) and only then reads the
	 * house, so a Keep pressed beside a sync, or two Keeps in one tick, each
	 * build on the other's work. The `moved` loop below still covers a
	 * reload, a switch or a mint that lands during a save, which run outside
	 * this chain.
	 */
	const commit = <T>(change: (base: House) => { next: House; out: T }, what: ChangeWhat): Promise<{ saved: SaveResult | null; out: T }> => {
		const run = () => commitNow(change, what);
		const turn = writing.then(run, run);
		writing = turn.catch(() => undefined);
		return turn;
	};
	const commitNow = async <T>(change: (base: House) => { next: House; out: T }, what: ChangeWhat): Promise<{ saved: SaveResult | null; out: T }> => {
		let base = house as House;
		let step = change(base);
		for (let tries = 0; ; tries++) {
			/* Nothing to write on the first pass. On a later pass the change may
			   have nothing left to do over the reloaded house, and the base is
			   saved anyway: the device holds this tab's earlier write, and the
			   reloaded house is what both tabs should now see. */
			if (step.next === base && tries === 0) return { saved: null, out: step.out };
			const seen = moved;
			const saved = await saveHouse(storage, step.next, now());
			if (!saved.ok) return { saved, out: step.out };
			if (moved === seen || tries >= COMMIT_TRIES) {
				house = saved.house;
				fire(what);
				return { saved, out: step.out };
			}
			if (!house || house.id !== base.id) {
				/* The pointer moved to another house, or to none, while this one
				   was saved: the save landed on its own record and memory stays
				   with the house the device now points at. */
				fire(what);
				return { saved, out: step.out };
			}
			base = house;
			step = change(base);
		}
	};
	/** A change with nothing to hand back, for the marks, the card and a removal. */
	const commitHouse = async (change: (base: House) => House, what: ChangeWhat): Promise<boolean> => {
		const res = await commit((base) => ({ next: change(base), out: undefined }), what);
		return res.saved === null || res.saved.ok;
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
	const itemsOf = (h: House, list: HouseList): Listed[] => houseRows(h, list) as Listed[];

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
			setHouse(await loadHouse(storage, id));
			fire('switch');
			return house;
		},

		mintHouse: async (name, began = 'hand') => {
			await ready();
			const minted = await mintHouse(storage, name, began, now(), rand);
			if (!minted.ok) return null;
			if (minted.current) setHouse(minted.house);
			fire('mint');
			return minted.house;
		},

		rename: async (name, id) => {
			await ready();
			const target = id || currentId(storage);
			if (!target) return false;
			const ok = await renameHouse(storage, target, name, now());
			if (!ok) return false;
			if (house && house.id === target) setHouse(await loadHouse(storage, target));
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
			/* Through the wing's own door (the sync's rule 8): never paired by
			   name, and the row's block is the whole block. The one row asked
			   about comes back under its own id, under a fresh id when the key
			   sweep refused its own (the change carries the former id in from),
			   or gone when a tombstone was newer. */
			const { saved, out } = await commit((base) => {
				const res = syncIn<R>(kind, [row], base, adapter, { now: now(), knownHouses: known(), rand, oneRow: true });
				let one: R | null = res.rows.find((r) => r.id === row.id) || null;
				const renamed = res.changes.find((c) => c.what === 'renamed' && c.from === row.id);
				if (renamed) one = res.rows.find((r) => r.id === renamed.id) || null;
				return { next: res.house, out: one };
			}, 'put');
			if (saved && !saved.ok) return { ok: false, row: out, said: saved.said };
			return { ok: true, row: out };
		},

		sync: async <R extends SyncRow>(kind: ItemKind, rows: readonly R[]): Promise<SyncOut<R>> => {
			await ready();
			if (!house) return { ok: false, rows: rows.slice(), changes: [], said: NO_HOUSE_SAID };
			const adapter = adapterFor(kind) as unknown as SyncAdapter<R>;
			const { saved, out } = await commit((base) => {
				const res = syncIn<R>(kind, rows, base, adapter, { now: now(), knownHouses: known(), rand });
				return { next: res.house, out: res };
			}, 'sync');
			if (saved && !saved.ok) return { ok: false, rows: out.rows, changes: out.changes, said: saved.said };
			return { ok: true, rows: out.rows, changes: out.changes };
		},

		rows: <R extends SyncRow>(kind: ItemKind, prevRows: readonly R[] = []): R[] => {
			if (!house) return [];
			return syncOut<R>(kind, house, adapterFor(kind) as unknown as SyncAdapter<R>, prevRows);
		},

		setMark: async (target, id, field, mark) => {
			await ready();
			if (!house) return false;
			/* The shape first (a by and a finite stamp), then the normaliser's door for the value. */
			const m = mark === null ? null : isMark(mark) ? normaliseMark(mark, markKind(field)) : undefined;
			if (m === undefined) return false;
			if (target === 'house') {
				if ((MARK_FIELDS.house as readonly string[]).indexOf(field) < 0) return false;
				let kept = false;
				const done = await commitHouse((base) => {
					kept = false;
					const card = { ...base } as unknown as Record<string, unknown>;
					if (m === null) {
						if (!(field in card)) {
							kept = true;
							return base;
						}
						delete card[field];
					} else {
						if (!mayReplace(card[field], m)) {
							kept = true;
							return base;
						}
						card[field] = m;
					}
					return card as unknown as House;
				}, 'mark');
				return done && !kept;
			}
			const list = listFor(target);
			if (!list) return false;
			if ((MARK_FIELDS[list] as readonly string[]).indexOf(field) < 0) return false;
			if (!itemsOf(house, list).some((i) => i.id === id)) return false;
			let refused = false;
			const ok = await commitHouse((base) => {
				refused = false;
				const items = itemsOf(base, list);
				const at = items.findIndex((i) => i.id === id);
				if (at < 0) return base;
				const item: Listed = { ...items[at] };
				if (m === null) {
					if (!(field in item)) {
						refused = true;
						return base;
					}
					delete item[field];
				} else {
					if (!mayReplace(item[field], m)) {
						refused = true;
						return base;
					}
					item[field] = m;
				}
				const nextList = items.slice();
				nextList[at] = item;
				return { ...base, [list]: nextList } as House;
			}, 'mark');
			return ok && !refused;
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
			return commitHouse((base) => normaliseHouse({ ...base, ...patch }, { rand }).house, 'card');
		},

		setItemField: async (kind, id, patch) => {
			await ready();
			if (!house) return false;
			const list = listOfKind(kind);
			const allowed = (ITEM_FIELDS as Record<string, readonly string[] | undefined>)[kind];
			if (!list || !allowed) return false;
			if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return false;
			/* Every key named must be one of the kind's own: a shared field, a mark
			   or a key the client refuses is a refusal of the whole patch, not a
			   silent drop, so a screen learns its wiring is wrong. */
			const given = patch as Record<string, unknown>;
			const fields: Record<string, unknown> = {};
			for (const k of Object.keys(given)) {
				if (allowed.indexOf(k) < 0) return false;
				if (given[k] !== undefined) fields[k] = given[k];
			}
			if (!Object.keys(fields).length) return false;
			if (!itemsOf(house, list).some((i) => i.id === id)) return false;
			return commitHouse((base) => {
				const items = itemsOf(base, list);
				const at = items.findIndex((i) => i.id === id);
				if (at < 0) return base;
				/* A fresh stamp, newer than the item's own, so the merge carries
				   the note to another device; the wing's row keeps its own stamp
				   and its shared fields, since the sync never moves a House-only
				   field with a row. Then the normaliser's door, which caps the
				   note, reads the flag as a flag and the pours as a list. */
				const next: Listed = { ...items[at], ...fields, ts: Math.max(now(), items[at].ts + 1) };
				const nextList = items.slice();
				nextList[at] = next;
				return normaliseHouse({ ...base, [list]: nextList }, { rand }).house;
			}, 'field');
		},

		putListItem: async (list, item) => {
			await ready();
			if (!house) return null;
			if ((PUT_LISTS as readonly string[]).indexOf(list) < 0) return null;
			if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
			const given = item as Record<string, unknown>;
			const marks = MARK_FIELDS[list] as readonly string[];
			const { saved, out } = await commit((base) => {
				const items = itemsOf(base, list);
				const id = typeof given.id === 'string' ? given.id : '';
				const at = id ? items.findIndex((i) => i.id === id) : -1;
				const stored = at >= 0 ? items[at] : undefined;
				/* The stored entry under the patch: a plain field the patch names
				   is replaced, one it does not name is kept, and an undefined is
				   not a value. A mark the patch names takes the field only through
				   setMark's rules (the shape, the normaliser, hers never over a
				   kept one); otherwise the stored mark stays, and a discard is
				   setMark(list, id, field, null), never a null here. */
				const next: Listed = { ...(stored || {}), ts: 0 } as Listed;
				for (const k of Object.keys(given)) {
					if (given[k] === undefined || k === 'ts') continue;
					if (marks.indexOf(k) >= 0) {
						const m = isMark(given[k]) ? normaliseMark(given[k], markKind(k)) : undefined;
						if (m && mayReplace(next[k], m)) next[k] = m;
						continue;
					}
					next[k] = given[k];
				}
				if (!id) delete (next as Record<string, unknown>).id;
				/* Newer than what it replaces, and newer than a tombstone on the
				   same id, which is lifted: an entry put back by hand is wanted. */
				const tomb = id && typeof base.removed[id] === 'number' ? base.removed[id] : 0;
				next.ts = Math.max(now(), stored ? stored.ts + 1 : 0, tomb + 1);
				const nextList = items.slice();
				const index = at >= 0 ? at : nextList.length;
				nextList[index] = next;
				let removed = base.removed;
				if (tomb) {
					removed = { ...base.removed };
					delete removed[id];
				}
				/* The normaliser's door for every field, and the mint for an entry
				   with no id: the list keeps its order, so the entry comes back at
				   the same index with the id the normaliser claimed or minted. */
				const normalised = normaliseHouse({ ...base, [list]: nextList, removed }, { rand }).house;
				return { next: normalised, out: itemsOf(normalised, list)[index] };
			}, 'entry');
			if (saved && !saved.ok) return null;
			return (out as unknown as ListEntry<typeof list>) || null;
		},

		removeItem: async (target, id) => {
			await ready();
			if (!house) return false;
			const list = listFor(target);
			if (!list) return false;
			return commitHouse((base) => {
				const items = itemsOf(base, list);
				const item = items.find((i) => i.id === id);
				/* The tombstone must be newer than the item's last touch (a kept mark
				   re-stamps the mark, not the item), or the sync would read it as stale.
				   An id the client's key sweep would refuse gets no tombstone at all:
				   the item is dropped, the wing's own delete has taken the row, and
				   the record stays one the client sends and every device imports. */
				const stamp = item ? Math.max(now(), lastTouch(item, MARK_FIELDS[list]) + 1) : now();
				const removed = FORBIDDEN_KEY.test(id) ? base.removed : { ...base.removed, [id]: stamp };
				if (!item && removed === base.removed) return base;
				const rest = items.filter((i) => i.id !== id);
				const next = { ...base, [list]: rest, removed } as Record<string, unknown>;
				/* An optional list (the videos) emptied goes, the normaliser's rule. */
				if (!rest.length && optionalList(list)) delete next[list];
				return next as unknown as House;
			}, 'remove-item');
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

		ensurePack: async (text, ensureOpts = {}) => {
			await ready();
			const read = readPack(text, { rand });
			if (!read.ok) return { action: 'refused', said: read.said };
			const shipped = read.house;
			const id = shipped.id;
			const onDevice = new Set<string>(await deviceIds(storage));

			if (!onDevice.has(id)) {
				/* The current house before the add: none, or a hand house with
				   nothing in it, gives way to the pack, as does a caller's ask. */
				const before = currentId(storage);
				const was = before ? (house && house.id === before ? house : await loadHouse(storage, before)) : null;
				const giveWay = !before || !was || (was.began === 'hand' && countItems(was) === 0) || !!ensureOpts.makeCurrent;
				const result = await importPack(storage, text, { mode: 'new' }, now(), rand);
				if (!result.ok) return { action: 'refused', said: result.said };
				let current = result.current;
				if (!current && giveWay) {
					try {
						switchTo(storage, result.added);
						current = true;
					} catch {
						current = false;
					}
				}
				await reload();
				fire('import');
				return { action: 'added', id: result.added, current };
			}

			const stored = house && house.id === id ? house : await loadHouse(storage, id);
			if (!stored) return { action: 'refused', said: 'The house this pack refreshes could not be read from this device.' };
			if (!(editionBuiltAt(shipped) > editionBuiltAt(stored))) return { action: 'current', id };

			let counts: RefreshCounts = { added: 0, updated: 0, kept: 0, removed: 0 };
			if (house && house.id === id) {
				/* The current house: through the one write door, so a tab's own
				   writes in flight land beside the refresh, never under it. */
				const { saved, out } = await commit((base) => {
					if (!(editionBuiltAt(shipped) > editionBuiltAt(base))) return { next: base, out: null };
					const res = refreshEdition(base, shipped);
					return { next: res.house, out: res.counts };
				}, 'import');
				if (saved && !saved.ok) return { action: 'refused', said: saved.said };
				if (!out) return { action: 'current', id };
				counts = out;
			} else {
				/* Another house on the device: saved on its own record, the current
				   house and the pointer left exactly as they were. */
				const res = refreshEdition(stored, shipped);
				const saved = await saveHouse(storage, res.house, now());
				if (!saved.ok) return { action: 'refused', said: saved.said };
				counts = res.counts;
				fire('import');
			}
			return { action: 'refreshed', id, counts };
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
