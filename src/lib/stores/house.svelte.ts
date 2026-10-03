/**
 * The house record: what belongs to the ROOM rather than to the person
 * holding the tablet.
 *
 * WHY THIS EXISTS. A venue buys one subscription for unlimited staff, and
 * `db.ts KEY()` namespaces every session to `session::<profileId>` so a shared
 * kitchen tablet does not pool everyone's cooked marks into one pile. That is
 * right for a cooked log and wrong for a menu. `menuDishes` and `dishCosts`
 * were fields of SessionState, so the manager typed the menu once and every
 * other person who tapped their own name got an empty one: /menu/quiz never
 * opened (it needs four dishes), /menu/costing was blank, and the Service tab
 * was empty for exactly the people the subscription was sold for.
 *
 * The precedent is already shipped and load-bearing: `wt.timers.v1` in
 * timers.svelte.ts carries no profile in its key, because a pot on the heat
 * belongs to the room. A menu, what is 86'd, and what a plate costs are facts
 * about the VENUE. A cooked mark is a fact about a PERSON. That is the whole
 * rule, and it is the line this file draws.
 *
 * IndexedDB and not localStorage, unlike timers: there is no first-paint
 * requirement here, and dishCosts grows without a bound worth guessing at.
 *
 * NO PUBLISH GATE, deliberately. An earlier design had a per-person draft and a
 * "publish to the house" button. There is no auth on a shared tablet:
 * `isManagerDevice()` is a per-device toggle anybody who finds the setting can
 * flip, so a gate would be false authority, and a draft/published split makes
 * a fresh device show an empty editor over a live menu. A kitchen whiteboard is
 * not drafted. Edits are immediate and shared, and `lastEditedBy` is
 * ATTRIBUTION, not authority: it records who, never who was allowed.
 *
 * The reconciliation lives in persistence/house.ts as pure functions, for the
 * reason mergeSessions() does: a runes module is unreachable from a test.
 */
import { browser } from '$app/environment';
import { get, set, createStore } from 'idb-keyval';
import { loadSession } from '../persistence/db';
import * as profiles from '../profiles';
import {
	HOUSE_KEY,
	HOUSE_VERSION,
	EMPTY_HOUSE,
	absorbSession,
	adoptImport,
	readHouse,
	normaliseCosting,
	weekStartOf,
	removeDish as removeDishFrom,
	removePrep as removePrepFrom,
	setMaitre as setMaitreOn,
	confirmMaitre as confirmMaitreOn,
	discardMaitre as discardMaitreOn,
	keepMaitreNote as keepMaitreNoteOn,
	dishesUsingPrep,
	localDay,
	houseSnapshot,
	housePortable,
	exportNudge,
	type HousePortable,
	type HouseRecord,
	type EightySix,
	type Prep
} from '../persistence/house';
import type { MenuDish, DishCosting, SalesWeek, MaitreField, MaitrePatch } from '../persistence/state';
import type { CostLine, PricedItem } from '../costing';
import { recordPrice, recordYield, pricedItems, itemNames, currentPrice, type Item } from '../items';
import { type WasteEntry } from '../waste';
import { addLineup, removeLineup, type LineupEntry } from '../lineup';
import {
	normaliseProducer,
	setDishProducers as setDishProducersOn,
	type Producer
} from '../producers';
import { resolveLines, plateCost, prepPortionCost } from '../costing';
import { createHouseApi, type HouseApi } from '../house/house-api';
import { idbStorage } from '../house/house-store';
import { HOUSE_INDEX_KEY, type House as HouseDoc, type HouseDish } from '../house/house-schema';
import { withHouse } from '../persistence/state';
import { putDish, rekeyDish, removeDishFromHouse, switchHouse, wakeHouse } from './house-wake';

export type { HouseRecord, EightySix, Prep };

const store = browser ? createStore('world-table', 'state') : undefined;

/*
 * THE HOUSE (src/lib/house): the restaurant the dishes belong to, one record
 * per house in its own IndexedDB database with a small index in localStorage
 * (HOUSE_INDEX_KEY), shared with the Codex and the Ledger on the one origin.
 * The dishes here are a PROJECTION of the current house's dishes
 * (house-sync.ts): the hydrate wake brings the two into step, and every
 * mutator below writes its own record first and the House second, through
 * house-wake.ts. The api is built once per window, lazily, behind typeof
 * window, so a prerendered page never touches storage in load; the Table
 * bundles the house modules directly and the port is for the two vanilla
 * wings. Allergens never travel: the adapter carries the row's own fields
 * whole and names none of them.
 */
let houseApi: HouseApi | undefined;
function apiFor(): HouseApi | undefined {
	if (typeof window === 'undefined') return undefined;
	if (!houseApi) houseApi = createHouseApi(idbStorage(window), { win: window, from: 'table' });
	return houseApi;
}

/** How long another tab's index write waits before this one re-syncs; a burst of saves is one wake. */
const RESYNC_MS = 300;

class House {
	#r = $state<HouseRecord>(structuredClone(EMPTY_HOUSE));
	/* $state, which it was not. A plain field was invisible for as long as
	   nothing RENDERED from `house.ready`: the write guards below read it
	   imperatively. The Floor Deck's Lineup was the first page to put it in a
	   template (`disabled={!house.ready}`), and on a cold load the button stayed
	   disabled for good, because a getter over a plain field never tells Svelte
	   it changed. Arriving from another page hid it: hydration had already
	   finished. */
	#ready = $state(false);
	/* Plain, and the pair of the line above: hydrate() is called from the layout
	   $effect, and a guard that read the $state would subscribe that effect to
	   it. See `#started` in session.svelte.ts, which learned this the hard way. */
	#started = false;
	/**
	 * A record we must not overwrite: written by a newer build, or unreadable.
	 * Every write is a no-op while this is set. See readHouse().
	 */
	#blocked = $state(false);
	/**
	 * What navigator.storage.persist() answered, or null until it has been
	 * asked. Asked once, on the first genuine write, because that is the first
	 * moment there is something on this device worth keeping. See #persist().
	 */
	#storagePersisted = $state<boolean | null>(null);
	#storageAsked = false;
	/**
	 * The House's last refusal in words, or empty. A refused House write (the
	 * cap, no database, a quota) leaves this record as saved and is printed by
	 * the page; it never throws into a mutator's caller.
	 */
	#houseRefusal = $state('');
	/**
	 * Every House write in one line, so a put cannot land in the middle of the
	 * hydrate wake and a re-sync cannot overlap a put: each waits for the one
	 * before it. Never rejects; every step catches its own.
	 */
	#houseQueue: Promise<void> = Promise.resolve();
	#resyncTimer: ReturnType<typeof setTimeout> | undefined;
	#listening = false;
	/** How many dishes the last pack import added, for the one line the page prints after it; this page's lifetime only. */
	#packAdded = $state(0);
	/**
	 * Moved on every change the House api reports (ready, a save, a switch,
	 * another tab's write), so a component that reads house.api.current()
	 * inside a $derived that also reads this re-derives when the house
	 * moves. The api's record is a plain object outside Svelte's reach; this
	 * counter is the one signal that stands in for it.
	 */
	#houseTick = $state(0);
	#watching = false;
	/** The re-keys the House asked for on this page (from, to), so a write queued by the old id finds the dish. */
	#rekeyed = new Map<string, string>();

	get ready() {
		return this.#ready;
	}
	/** True when there is a record here this build must not touch. */
	get blocked() {
		return this.#blocked;
	}
	get dishes(): MenuDish[] {
		return this.#r.dishes;
	}
	get lastEditedBy(): string | undefined {
		return this.#r.lastEditedBy;
	}
	/**
	 * true: the browser granted durable storage, and will not evict this
	 * record under pressure. false: it refused, or the API is absent, so the
	 * record is best-effort and the export is the only backup. null: not yet
	 * asked, because nothing has been written on this device.
	 */
	get storagePersisted(): boolean | null {
		return this.#storagePersisted;
	}
	/** How stale the last export is; see exportNudge() in persistence/house.ts. */
	get exportNudge(): { days: number | null } | null {
		return exportNudge(this.#r);
	}
	/** The House api for this window, or undefined on the server. The pages' doors (switch, new, import, export) go through it. */
	get api(): HouseApi | undefined {
		const api = apiFor();
		if (api && !this.#watching) {
			this.#watching = true;
			api.onChange(() => {
				this.#houseTick += 1;
			});
		}
		return api;
	}
	/** The signal a component reads beside house.api.current(): see #houseTick. */
	get houseTick(): number {
		return this.#houseTick;
	}
	/** The current House, re-derived with the tick; null on the server and before the api is ready. */
	get current(): HouseDoc | null {
		this.#houseTick;
		return this.api?.current() ?? null;
	}
	/** The House's own item for a dish on this menu, or undefined: where the parts, the lines, the pairing and the service note live. */
	houseDish(id: string): HouseDish | undefined {
		const h = this.current;
		if (!h) return undefined;
		const to = this.#rekeyed.get(id);
		return h.dishes.find((d) => d.id === id) ?? (to ? h.dishes.find((d) => d.id === to) : undefined);
	}
	/** The House's last refusal in words, for the page to print; empty when the last write landed. */
	get houseRefusal(): string {
		return this.#houseRefusal;
	}
	/** Dishes added by the last pack import on this page, or 0: the page says once that a pack never carries allergens. */
	get packAdded(): number {
		return this.#packAdded;
	}

	/**
	 * Ask the browser to keep this origin's storage.
	 *
	 * Without it the whole house record (menu, 86 board, costings, preps, the
	 * item book with its history, the waste log) is best-effort storage: Safari
	 * deletes it for a site not added to the home screen after seven days
	 * without a visit, and Chromium may evict it under pressure. One call, once
	 * per page lifetime, on the first genuine write; the answer is recorded so
	 * the pages can say which case they are in. Failure is recorded as `false`
	 * rather than thrown: a refused request changes what the page should say,
	 * never whether the write goes ahead.
	 */
	#requestPersistence() {
		if (this.#storageAsked) return;
		this.#storageAsked = true;
		try {
			const s = typeof navigator !== 'undefined' ? navigator.storage : undefined;
			if (!s || typeof s.persist !== 'function') {
				this.#storagePersisted = false;
				return;
			}
			s.persist().then(
				(ok) => {
					this.#storagePersisted = Boolean(ok);
				},
				() => {
					this.#storagePersisted = false;
				}
			);
		} catch {
			this.#storagePersisted = false;
		}
	}

	/**
	 * @param touch whether this write is a change to the record. Every mutator
	 * passes the default; markExported() passes false so an export stamps
	 * `lastExportAt` without moving `lastWrite`, which is the comparison the
	 * export nudge rests on.
	 */
	#persist(touch = true) {
		// The guard that makes the refusal real. Without it every mutator below
		// would cheerfully write EMPTY_HOUSE over a record it could not read.
		if (!browser || !store || this.#blocked) return;
		// And the hydration guard: a mutation that lands before hydrate() has
		// read the disk would otherwise persist EMPTY_HOUSE-plus-one-tap OVER
		// the venue's real record, the same wipe readHouse() exists to prevent,
		// arriving through timing instead of versioning. Skipping the write
		// loses at most that one pre-hydration tap; hydrate() then installs the
		// disk record. One tap lost beats a venue lost.
		if (!this.#ready) return;
		if (touch) {
			this.#r.lastWrite = Date.now();
			const by = profiles.currentName();
			if (by) this.#r.lastEditedBy = by;
			this.#requestPersistence();
		}
		/*
		 * Caught, not fire-and-forget: an unhandled rejection here (quota, a
		 * closed connection, a transaction abort) used to mean a menu edit or a
		 * costing sheet silently never reached disk. NOT routed into #blocked:
		 * that flag is set from a LOAD-time failure (readHouse), has its own
		 * distinct meaning and copy, and latches - line 94 above refuses every
		 * future write while it is set, so reusing it for a transient write
		 * failure would turn one recoverable miss into permanent silent loss
		 * for the rest of the session. A console.warn is the honest floor,
		 * matching the precedent db.ts already sets for a read failure.
		 */
		set(HOUSE_KEY, $state.snapshot(this.#r), store).catch((err) => {
			console.warn('[world-table] house write failed; the change was not saved', err);
		});
	}

	async hydrate() {
		if (!browser || !store || this.#started) return;
		this.#started = true;
		try {
			const { record, blocked } = readHouse(await get(HOUSE_KEY, store));
			this.#r = record;
			this.#blocked = blocked;
		} catch {
			// We could not read it, so we do not know what is there, and writing
			// over what you cannot read is how the record was lost before. Start
			// empty AND refuse to persist.
			this.#blocked = true;
		}
		/* Ready HERE, before the absorb below: the record has been read, so the
		   hydration guard in #persist() has nothing left to guard against, and
		   with ready still false that guard made the absorb's persist a no-op.
		   The absorbed dishes and their costings then lived in memory alone
		   until some later mutator wrote, which on a device with no house, or
		   one already in step, was the whole session. */
		this.#ready = true;
		if (this.#blocked) return;
		try {
			const next = absorbSession(this.#r, await loadSession());
			if (next !== this.#r) {
				this.#r = next;
				this.#persist();
			}
		} catch {
			/* nothing to absorb is not an error */
		}
		/* The House wake, after ready and never while blocked: the dishes
		   brought into step with the current house, written back and persisted
		   once when a change is reported. Then another tab's index write
		   re-runs it, debounced. */
		this.#listenForHouse();
		await this.#syncWithHouse();
	}

	/* ---- the House ------------------------------------------------------- */

	/**
	 * The wake over the current house: see house-wake.ts. Serialised with
	 * every other House write. It runs over a snapshot, and the result is
	 * taken only when no mutation landed meanwhile (lastWrite is the witness);
	 * when one did, the wake goes once more, behind the put that mutation
	 * queued, so the two converge instead of one writing over the other.
	 */
	#syncWithHouse(again = true): Promise<void> {
		const api = apiFor();
		if (!api || !browser || this.#blocked || !this.#ready) return Promise.resolve();
		const run = async () => {
			if (this.#blocked) return;
			const snap = $state.snapshot(this.#r) as HouseRecord;
			const { record, refusal } = await wakeHouse(api, snap);
			if (this.#blocked) return;
			if (record !== snap) {
				if (snap.lastWrite === this.#r.lastWrite) {
					this.#r = record;
					this.#persist();
				} else if (again) {
					void this.#syncWithHouse(false);
				}
			}
			this.#houseRefusal = refusal ?? '';
		};
		return this.#enqueueHouse(run);
	}

	/** One House write after the ones before it; a failure is a sentence on the page, never a throw. */
	#enqueueHouse(op: () => Promise<void>): Promise<void> {
		const next = this.#houseQueue.then(op).catch((err) => {
			this.#houseRefusal = 'The House could not be written: ' + (err instanceof Error ? err.message : String(err));
		});
		this.#houseQueue = next;
		return next;
	}

	/**
	 * Projection first, House second: called by every mutator AFTER its own
	 * persist. Guarded by blocked and by ready (a put before the wake would
	 * race it; the queue orders the two anyway). A re-keyed id (a name twin
	 * in the house, or an id the key sweep refuses) moves every id-keyed map
	 * and the dish; a house stamp the row gained is written on the dish.
	 */
	#putToHouse(dish: MenuDish) {
		const api = apiFor();
		if (!api || !browser || this.#blocked || !this.#ready) return;
		void this.#enqueueHouse(async () => {
			if (this.#blocked) return;
			const res = await putDish(api, $state.snapshot(dish) as MenuDish);
			if (this.#blocked) return;
			let next = this.#r;
			if (res.rekey) {
				const { from, to } = res.rekey;
				this.#rekeyed.set(from, to);
				next = rekeyDish(next, from, to);
				next = { ...next, dishes: next.dishes.map((d) => (d.id === from ? withHouse({ ...d, id: to }, res.house || d.house) : d)) };
			} else if (res.house) {
				next = { ...next, dishes: next.dishes.map((d) => (d.id === dish.id ? withHouse(d, res.house) : d)) };
			}
			if (next !== this.#r) {
				this.#r = next;
				this.#persist(false);
			}
			this.#houseRefusal = res.refusal ?? '';
		});
	}

	/**
	 * A House-only plain field on a dish (the service note, the signature
	 * flag), written AFTER the dish: it is queued behind the put the save
	 * made, so the item is in the House when the write lands, and a re-key
	 * the put asked for is followed. A value already on the item is not
	 * written again, so a save that left the note alone leaves the stamp
	 * alone too. Projection first, House second, like every mutator here.
	 */
	setDishField(id: string, patch: { serviceNote?: string; signature?: boolean }) {
		const api = apiFor();
		if (!api || !browser || this.#blocked || !this.#ready) return;
		void this.#enqueueHouse(async () => {
			if (this.#blocked) return;
			const item = this.houseDish(id);
			if (!item) return;
			const fields: { serviceNote?: string; signature?: boolean } = {};
			if (patch.serviceNote !== undefined && patch.serviceNote !== item.serviceNote) fields.serviceNote = patch.serviceNote;
			if (patch.signature !== undefined && patch.signature !== item.signature) fields.signature = patch.signature;
			if (!Object.keys(fields).length) return;
			const ok = await api.setItemField('dish', item.id, fields);
			if (!ok) this.#houseRefusal = 'The House did not take the note on this dish.';
		});
	}

	/** The tombstone, after the Table's own delete, so no device brings the dish back. */
	#removeFromHouse(id: string) {
		const api = apiFor();
		if (!api || !browser || this.#blocked || !this.#ready) return;
		void this.#enqueueHouse(async () => {
			if (this.#blocked) return;
			const res = await removeDishFromHouse(api, id);
			this.#houseRefusal = res.refusal ?? '';
		});
	}

	/**
	 * Another tab's write to the House index (a switch, a mint, a save that
	 * touched the stub) re-runs the wake, debounced so a burst is one sync.
	 * The api's own listener on the same event reloads the house first; the
	 * wake runs after the debounce and against the index's current pointer.
	 */
	#listenForHouse() {
		if (this.#listening || typeof window === 'undefined') return;
		this.#listening = true;
		try {
			window.addEventListener('storage', (ev: StorageEvent) => {
				if (ev.key !== null && ev.key !== HOUSE_INDEX_KEY) return;
				if (this.#blocked) return;
				if (this.#resyncTimer !== undefined) clearTimeout(this.#resyncTimer);
				this.#resyncTimer = setTimeout(() => {
					this.#resyncTimer = undefined;
					void this.#resyncWithHouse();
				}, RESYNC_MS);
			});
		} catch {
			/* a window with no events has no other tabs */
		}
	}

	/* ---- the doors the house bar calls ----------------------------------- */

	/** The wake, awaitable: after New house made the first house, or a pack became current, the dishes here join it. */
	syncHouse(): Promise<void> {
		return this.#syncWithHouse();
	}

	/**
	 * Another house opened: the rows synced out, the pointer moved, the
	 * projection replaced through the adapter, saved once. See switchHouse in
	 * house-wake.ts. False when the device refused or the id is not on it.
	 */
	switchHouse(id: string): Promise<boolean> {
		const api = apiFor();
		if (!api || !browser || this.#blocked || !this.#ready) return Promise.resolve(false);
		let ok = false;
		return this.#enqueueHouse(async () => {
			if (this.#blocked) return;
			const snap = $state.snapshot(this.#r) as HouseRecord;
			const res = await switchHouse(api, snap, id);
			if (this.#blocked) return;
			this.#houseRefusal = res.refusal ?? '';
			if (!res.ok) return;
			/* The switch ran over a snapshot, and only the dishes are its to
			   replace: the costings, the 86 board, the producers and the waste
			   log are the LIVE record's, so an edit to any of them on another
			   route during the await is not written over by the snapshot's
			   copy. The re-keys the outgoing sync asked for are applied to the
			   live record here, by id, for the same reason. A dish mutation that
			   landed meanwhile belongs to the house that was open and is queued
			   behind this one as a put, so the replaced projection stands and
			   the put files it into the house that is open now. One edit on a
			   closing house is the trade; a venue's menu written over is not. */
			let next = this.#r;
			for (const { from, to } of res.rekeys) next = rekeyDish(next, from, to);
			this.#r = { ...next, dishes: res.record.dishes };
			this.#persist();
			ok = true;
		}).then(() => ok);
	}

	/** A pack import added dishes: the page says once that a pack never carries allergens. */
	notePackImport(count: number) {
		this.#packAdded = Number.isFinite(count) && count > 0 ? Math.round(count) : 0;
	}

	/** The wake again, with the api's memory copy realigned to the index's pointer first. */
	async #resyncWithHouse() {
		const api = apiFor();
		if (!api || this.#blocked) return;
		await api.ready();
		const id = api.currentId();
		if (id && api.current()?.id !== id) await api.switchTo(id);
		await this.#syncWithHouse();
	}

	/* ---- the menu -------------------------------------------------------- */

	addDish(d: MenuDish) {
		this.#r = { ...this.#r, dishes: [...this.#r.dishes, d], absorbed: [...this.#r.absorbed, d.id] };
		this.#persist();
		this.#putToHouse(d);
	}

	updateDish(d: MenuDish) {
		this.#r = { ...this.#r, dishes: this.#r.dishes.map((e) => (e.id === d.id ? d : e)) };
		this.#persist();
		this.#putToHouse(d);
	}

	removeDish(id: string) {
		this.#r = removeDishFrom(this.#r, id);
		this.#persist();
		this.#removeFromHouse(id);
	}

	/* ---- the Maitre d's marks ----------------------------------------------
	 *
	 * Thin wrappers over persistence/house.ts, where the rules live and are
	 * tested. Each refuses while `blocked` BEFORE touching #r, the way adopt()
	 * does and for its reason: #persist() would refuse the write anyway, but a
	 * mark rendered on screen over the alert saying the record is untouchable
	 * would contradict it, and vanish on reload. A person is a person, so these
	 * are open to everyone, like the 86 board. */

	/** Her marks, or a person's edits (`by: 'person'`). Never displaces a kept mark. */
	setMaitre(id: string, patch: MaitrePatch) {
		if (this.#blocked) return;
		const next = setMaitreOn(this.#r, id, patch);
		if (next === this.#r) return;
		this.#r = next;
		this.#persist();
		this.#putDishById(id);
	}

	/** Keep: flips the mark to the house's and re-stamps it. */
	confirmMaitre(id: string, field: MaitreField) {
		if (this.#blocked) return;
		const next = confirmMaitreOn(this.#r, id, field, Date.now());
		if (next === this.#r) return;
		this.#r = next;
		this.#persist();
		this.#putDishById(id);
	}

	/** Discard one mark. The block goes with its key when it empties; kept notes stay. */
	discardMaitre(id: string, field: MaitreField) {
		if (this.#blocked) return;
		const next = discardMaitreOn(this.#r, id, field);
		if (next === this.#r) return;
		this.#r = next;
		this.#persist();
		this.#putDishById(id);
	}

	/** Keep an answer from the chat on the dish. Blank question or answer: nothing filed. */
	keepMaitreNote(id: string, q: string, a: string, model?: string) {
		if (this.#blocked) return;
		const next = keepMaitreNoteOn(this.#r, id, q, a, Date.now(), model);
		if (next === this.#r) return;
		this.#r = next;
		this.#persist();
		this.#putDishById(id);
	}

	/** The dish by id into the House, after a mark moved on it. */
	#putDishById(id: string) {
		const d = this.#r.dishes.find((e) => e.id === id);
		if (d) this.#putToHouse(d);
	}

	/* ---- 86 --------------------------------------------------------------
	 *
	 * Open to everyone, because the person who finds the last portion gone is
	 * whoever finds it, and a board that needs a manager to update is a board
	 * that is wrong by 20:15.
	 */

	is86(id: string): boolean {
		return id in this.#r.eightySix;
	}
	eightySixInfo(id: string): EightySix | undefined {
		return this.#r.eightySix[id];
	}
	get eightySixCount(): number {
		return Object.keys(this.#r.eightySix).length;
	}

	toggle86(id: string) {
		const next = { ...this.#r.eightySix };
		if (id in next) delete next[id];
		else next[id] = { at: Date.now(), by: profiles.currentName() ?? undefined };
		this.#r = { ...this.#r, eightySix: next };
		this.#persist();
	}

	/* ---- costing --------------------------------------------------------- */

	/** Always normalised, so every caller sees the current shape whatever is on disk. */
	costingFor(id: string): DishCosting {
		return normaliseCosting(this.#r.dishCosts[id]) ?? { lines: [], sales: [], ts: 0 };
	}

	/**
	 * A PATCH over the stored record, never a replacement.
	 *
	 * Belt and braces beside the required `sales` type: the type only protects
	 * the call sites that exist today, and the patch protects the next field
	 * anybody adds. The old whole-object write is how an ingredient edit would
	 * have dropped a venue's covers history.
	 *
	 * `sold` is deliberately not accepted. It is derived: the newest week's
	 * count, or the untouched legacy figure, and a writable `sold` beside a
	 * writable `sales` is two sources of truth for one number.
	 */
	setCosting(id: string, patch: { lines?: CostLine[]; sales?: SalesWeek[] }) {
		const cur = this.costingFor(id);
		const sales = patch.sales ?? cur.sales;
		this.#r = {
			...this.#r,
			dishCosts: {
				...this.#r.dishCosts,
				[id]: {
					...cur,
					...(patch.lines ? { lines: patch.lines } : {}),
					sales,
					...(sales.length ? { sold: sales[0].count } : cur.sold !== undefined ? { sold: cur.sold } : {}),
					/**
					 * Restamped ONLY by a lines write. `ts` is the merge tiebreak for
					 * LINES (mergeCostings takes them whole from the newer record), and
					 * covers already resolve per-week on SalesWeek.at, so a covers-only
					 * write restamping ts let a pass tablet holding last week's lines
					 * beat the office laptop's fresh re-costing in BOTH merge
					 * directions, just because somebody typed a covers number at 22:00.
					 * The hazard was closed one way (lines edits cannot beat covers,
					 * which is why SalesWeek.at exists) and open the other.
					 */
					ts: patch.lines ? Date.now() : cur.ts
				}
			}
		};
		this.#persist();
	}

	/**
	 * File a week's covers.
	 *
	 * The week defaults from a DEFAULT PARAMETER, evaluated at the instant of the
	 * call: never from a module const, a $state seeded at init, or a $derived
	 * with no tracked dependency. vite.config.ts ships `registerType: 'prompt'`
	 * with `skipWaiting: false` so a pass tablet stays open for days by design,
	 * and a captured week would file Thursday's covers under Monday of last week.
	 */
	setCovers(id: string, count: number, week: string = weekStartOf(new Date())) {
		if (!Number.isFinite(count) || count < 0) return;
		const cur = this.costingFor(id);
		const rest = cur.sales.filter((w) => w.weekStart !== week);
		const sales = [...rest, { weekStart: week, count: Math.round(count), at: Date.now() }].sort(
			(a, b) => (a.weekStart < b.weekStart ? 1 : a.weekStart > b.weekStart ? -1 : 0)
		);
		this.setCosting(id, { sales });
	}

	/**
	 * Clear one week. Filtering by weekStart, never `sales: []` and never by
	 * omitting the key: one blur on an empty box would otherwise destroy every
	 * week on the dish.
	 */
	clearCovers(id: string, week: string) {
		const cur = this.costingFor(id);
		this.setCosting(id, { sales: cur.sales.filter((w) => w.weekStart !== week) });
	}

	/* ---- import / export -------------------------------------------------- */

	adopt(
		dishes: MenuDish[] | undefined,
		costs: Record<string, DishCosting> | undefined,
		incoming: HousePortable
	) {
		// #persist() below already refuses to WRITE a blocked record, but this
		// assigned #r unconditionally regardless, so an import rendered the
		// adopted dishes and preps on screen under the alert saying they "stay
		// hidden" - and they vanished again on reload, since nothing was ever
		// saved. The on-screen state must not be able to contradict the alert
		// directly above it.
		if (this.#blocked) return;
		this.#r = adoptImport(this.#r, dishes, costs, incoming);
		this.#persist();
		/* And into the House, through the door the wake uses: a menu brought
		   in by file reached the House only at the next boot's wake, and a pass
		   tablet open for days never boots, so the Codex and the Ledger woke
		   into a house without it and a pack exported meanwhile left it out. */
		void this.#syncWithHouse();
	}

	/* ---- preps ------------------------------------------------------------
	 *
	 * The venue's sub-recipes. On the house record and not in the session for
	 * the same reason the menu is: what the demi costs is a fact about the
	 * venue, not about whoever is holding the tablet.
	 */

	get preps(): Prep[] {
		return this.#r.preps;
	}

	/* ---- the item book --------------------------------------------------- */

	get items(): Record<string, Item> {
		return this.#r.items;
	}

	/**
	 * The book flattened to just the current price of each thing, which is all
	 * resolveLines needs. Derived on read rather than stored: a second copy of a
	 * price is a second thing that can be stale.
	 */
	get pricedItems(): Record<string, PricedItem> {
		return pricedItems(this.#r.items);
	}

	/** Every name the venue has typed, for the datalist. */
	get itemNames(): string[] {
		return itemNames(this.#r.items);
	}

	item(slug: string): Item | undefined {
		return this.#r.items[slug];
	}

	/**
	 * File what this thing costs today.
	 *
	 * Called from the costing sheet whenever a price is committed against a
	 * NAMED line: the book fills itself from work the venue was doing anyway,
	 * which is the only reason it will ever have anything in it. recordPrice
	 * decides whether the observation is worth keeping; see its header for the
	 * three cases it declines.
	 */
	recordItemPrice(name: string, unitCost: number, unit: string) {
		const next = recordPrice(this.#r.items, name, unitCost, unit, Date.now());
		if (next === this.#r.items) return;
		this.#r = { ...this.#r, items: next };
		this.#persist();
	}

	/**
	 * File a yield test against an item. Pure rules live in recordYield,
	 * including the refusals, so this is a thin write, like recordItemPrice.
	 */
	recordItemYield(name: string, grossQty: number, usableQty: number) {
		const next = recordYield(this.#r.items, name, grossQty, usableQty, Date.now());
		if (next === this.#r.items) return;
		this.#r = { ...this.#r, items: next };
		this.#persist();
	}

	/* ---- the lineup tally --------------------------------------------------
	 * What the ROOM missed at pre-shift, and nobody's name: see lib/lineup.ts.
	 * The Floor Deck's Lineup mode writes here and NEVER to a person's drill
	 * log, because six people answering aloud on one tablet is not evidence
	 * about whoever is holding it. */

	get lineupLog(): LineupEntry[] {
		return this.#r.lineupLog;
	}

	/** One answer from the room. Returns the entry, so the screen can undo exactly it. */
	markLineup(slug: string, grade: 'met' | 'missed'): LineupEntry | null {
		if (!slug) return null;
		const entry: LineupEntry = { slug, at: Date.now(), grade };
		this.#r = { ...this.#r, lineupLog: addLineup(this.#r.lineupLog, entry) };
		this.#persist();
		return entry;
	}

	undoLineup(slug: string, at: number) {
		const next = removeLineup(this.#r.lineupLog, slug, at);
		if (next.length === this.#r.lineupLog.length) return;
		this.#r = { ...this.#r, lineupLog: next };
		this.#persist();
	}

	/* ---- the producers -----------------------------------------------------
	 * Who supplies the venue, and the dishes they are on: see lib/producers.ts,
	 * including why the dish link is stored here on the producer and never on
	 * the dish, whose form rebuilds it field by field. */

	get producers(): Producer[] {
		return this.#r.producers;
	}

	/**
	 * Add or replace by id, stamping `ts`. Run through normaliseProducer so the
	 * form and a file obey one rule: a producer with no name is refused here
	 * rather than saved as a blank line on the page.
	 */
	saveProducer(p: Producer): Producer | null {
		const clean = normaliseProducer({ ...p, ts: Date.now() });
		if (!clean) return null;
		const exists = this.#r.producers.some((x) => x.id === clean.id);
		this.#r = {
			...this.#r,
			producers: exists
				? this.#r.producers.map((x) => (x.id === clean.id ? clean : x))
				: [...this.#r.producers, clean]
		};
		this.#persist();
		return clean;
	}

	/** A real delete, like removeWaste, and with the same trade: see mergeProducers. */
	removeProducer(id: string) {
		const next = this.#r.producers.filter((p) => p.id !== id);
		if (next.length === this.#r.producers.length) return;
		this.#r = { ...this.#r, producers: next };
		this.#persist();
	}

	/** After this, exactly these producers carry the dish. Called by the dish form's save. */
	setDishProducers(dishId: string, ids: readonly string[]) {
		const next = setDishProducersOn(this.#r.producers, dishId, ids, Date.now());
		if (next === this.#r.producers) return;
		this.#r = { ...this.#r, producers: next };
		this.#persist();
	}

	/* ---- the waste log ----------------------------------------------------- */

	get waste(): WasteEntry[] {
		return this.#r.waste;
	}

	/**
	 * What one of a thing is worth RIGHT NOW, for snapshotting onto a waste entry.
	 *
	 * Null when it cannot be costed, and null is carried through to the entry
	 * rather than collapsed to zero: a bin nobody could price is not a bin that
	 * cost nothing, and the rollup reports the count separately for exactly that
	 * reason.
	 */
	unitValueOf(src: { dishId?: string; prepId?: string; itemSlug?: string }): number | null {
		if (src.dishId) {
			const costing = this.costingFor(src.dishId);
			const { lines } = resolveLines(costing.lines, this.#r.preps, this.pricedItems);
			const { total, complete } = plateCost(lines);
			// An incomplete plate is not a cheap plate. Valuing a half-costed dish
			// would understate every bin of it, in the direction that flatters.
			return complete && lines.length ? total : null;
		}
		if (src.prepId) {
			const prep = this.#r.preps.find((p) => p.id === src.prepId);
			if (!prep) return null;
			const { perPortion, complete } = prepPortionCost(prep, this.pricedItems);
			return complete ? perPortion : null;
		}
		if (src.itemSlug) {
			return currentPrice(this.#r.items[src.itemSlug])?.unitCost ?? null;
		}
		return null;
	}

	/**
	 * Log a bin.
	 *
	 * The value is snapshotted here and never recomputed; see waste.ts. There is
	 * no argument for who did it, and there is no field on the record to put one
	 * in even if a caller wanted to.
	 */
	logWaste(entry: {
		label: string;
		qty: number;
		reason: string;
		source?: { dishId?: string; prepId?: string; itemSlug?: string };
	}): WasteEntry | null {
		const label = entry.label.trim();
		if (!label || !Number.isFinite(entry.qty) || entry.qty <= 0 || !entry.reason) return null;
		const next: WasteEntry = {
			id: 'w-' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
			at: Date.now(),
			label,
			qty: entry.qty,
			reason: entry.reason,
			unitValue: entry.source ? this.unitValueOf(entry.source) : null,
			...(entry.source ? { source: entry.source } : {})
		};
		this.#r = { ...this.#r, waste: [next, ...this.#r.waste] };
		this.#persist();
		return next;
	}

	/**
	 * Remove one entry.
	 *
	 * Deliberately a real delete and not a tombstone: a mis-tapped bin is a typo,
	 * not history, and the log is only useful if people are willing to correct
	 * it. The merge unions by id, so a deletion does not travel: a second device
	 * that still holds the entry will bring it back on the next import. That is
	 * the honest trade for never losing a bin, and it is the same shape as the
	 * cooked log.
	 */
	removeWaste(id: string) {
		const next = this.#r.waste.filter((w) => w.id !== id);
		if (next.length === this.#r.waste.length) return;
		this.#r = { ...this.#r, waste: next };
		this.#persist();
	}

	/* ---- preps ------------------------------------------------------------ */

	prep(id: string): Prep | undefined {
		return this.#r.preps.find((p) => p.id === id);
	}

	savePrep(p: Prep) {
		const exists = this.#r.preps.some((x) => x.id === p.id);
		this.#r = {
			...this.#r,
			preps: exists ? this.#r.preps.map((x) => (x.id === p.id ? p : x)) : [...this.#r.preps, p]
		};
		this.#persist();
	}

	removePrep(id: string) {
		this.#r = removePrepFrom(this.#r, id);
		this.#persist();
	}

	/** Which menu dishes would lose their total if this prep went. */
	dishesUsing(id: string) {
		return dishesUsingPrep(this.#r, id);
	}

	/* ---- tax ---------------------------------------------------------------
	 *
	 * A venue fact, so both staff read one number. Default off: an inferred rate
	 * gives a plausible figure wrong by exactly the tax rate.
	 */

	get tax(): { inclusive: boolean; ratePct: number } {
		return this.#r.tax ?? { inclusive: false, ratePct: 0 };
	}

	setTax(inclusive: boolean, ratePct: number) {
		const rate = Number.isFinite(ratePct) && ratePct >= 0 ? ratePct : 0;
		this.#r = { ...this.#r, tax: { inclusive, ratePct: rate } };
		this.#persist();
	}

	/* ---- the walk-in count ------------------------------------------------
	 *
	 * A count is true for the day it was made and no longer. Stored with the
	 * day so the board can say "counted yesterday" instead of believing it.
	 */

	countFor(id: string): { onHand: number; countedOn: string } | undefined {
		return this.#r.prepCounts[id];
	}

	/** Remove a count outright: an emptied field, not a count of zero. */
	clearCount(id: string) {
		if (!(id in this.#r.prepCounts)) return;
		const prepCounts = { ...this.#r.prepCounts };
		delete prepCounts[id];
		this.#r = { ...this.#r, prepCounts };
		this.#persist();
	}

	setCount(id: string, onHand: number) {
		if (!Number.isFinite(onHand) || onHand < 0) return;
		this.#r = {
			...this.#r,
			prepCounts: {
				...this.#r.prepCounts,
				[id]: { onHand: Math.round(onHand), countedOn: localDay(new Date()) }
			}
		};
		this.#persist();
	}

	/**
	 * The export just happened: remember when, so the nudge can count from it.
	 * Called by the page that writes the .wtjson, after download(). Not a
	 * change to the record, so lastWrite and lastEditedBy stay where they are.
	 */
	markExported() {
		if (this.#blocked || !this.#ready) return;
		this.#r = { ...this.#r, lastExportAt: Date.now() };
		this.#persist(false);
	}

	snapshot() {
		return houseSnapshot($state.snapshot(this.#r) as HouseRecord);
	}

	/**
	 * The house-owned block that rides beside `data` rather than inside it.
	 * See housePortable() for why the preps are not in snapshot().
	 */
	portable() {
		return housePortable($state.snapshot(this.#r) as HouseRecord);
	}
}

export const house = new House();
