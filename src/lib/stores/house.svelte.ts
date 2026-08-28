/**
 * The house record — what belongs to the ROOM rather than to the person
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
 * "publish to the house" button. There is no auth on a shared tablet —
 * `isManagerDevice()` is a per-device toggle anybody who finds the setting can
 * flip — so a gate would be false authority, and a draft/published split makes
 * a fresh device show an empty editor over a live menu. A kitchen whiteboard is
 * not drafted. Edits are immediate and shared, and `lastEditedBy` is
 * ATTRIBUTION, not authority: it records who, never who was allowed.
 *
 * The reconciliation lives in persistence/house.ts as pure functions, for the
 * reason mergeSessions() does — a runes module is unreachable from a test.
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
	dishesUsingPrep,
	localDay,
	houseSnapshot,
	housePortable,
	type HousePortable,
	type HouseRecord,
	type EightySix,
	type Prep
} from '../persistence/house';
import type { MenuDish, DishCosting, SalesWeek } from '../persistence/state';
import type { CostLine, PricedItem } from '../costing';
import { recordPrice, pricedItems, itemNames, type Item } from '../items';

export type { HouseRecord, EightySix, Prep };

const store = browser ? createStore('world-table', 'state') : undefined;

class House {
	#r = $state<HouseRecord>(structuredClone(EMPTY_HOUSE));
	#ready = false;
	/**
	 * A record we must not overwrite — written by a newer build, or unreadable.
	 * Every write is a no-op while this is set. See readHouse().
	 */
	#blocked = $state(false);

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

	#persist() {
		// The guard that makes the refusal real. Without it every mutator below
		// would cheerfully write EMPTY_HOUSE over a record it could not read.
		if (!browser || !store || this.#blocked) return;
		this.#r.lastWrite = Date.now();
		const by = profiles.currentName();
		if (by) this.#r.lastEditedBy = by;
		void set(HOUSE_KEY, $state.snapshot(this.#r), store);
	}

	async hydrate() {
		if (!browser || !store || this.#ready) return;
		try {
			const { record, blocked } = readHouse(await get(HOUSE_KEY, store));
			this.#r = record;
			this.#blocked = blocked;
		} catch {
			// We could not read it, so we do not know what is there — and writing
			// over what you cannot read is how the record was lost before. Start
			// empty AND refuse to persist.
			this.#blocked = true;
		}
		if (this.#blocked) {
			this.#ready = true;
			return;
		}
		try {
			const next = absorbSession(this.#r, await loadSession());
			if (next !== this.#r) {
				this.#r = next;
				this.#persist();
			}
		} catch {
			/* nothing to absorb is not an error */
		}
		this.#ready = true;
	}

	/* ---- the menu -------------------------------------------------------- */

	addDish(d: MenuDish) {
		this.#r = { ...this.#r, dishes: [...this.#r.dishes, d], absorbed: [...this.#r.absorbed, d.id] };
		this.#persist();
	}

	updateDish(d: MenuDish) {
		this.#r = { ...this.#r, dishes: this.#r.dishes.map((e) => (e.id === d.id ? d : e)) };
		this.#persist();
	}

	removeDish(id: string) {
		this.#r = removeDishFrom(this.#r, id);
		this.#persist();
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
	 * `sold` is deliberately not accepted. It is derived — the newest week's
	 * count, or the untouched legacy figure — and a writable `sold` beside a
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
					ts: Date.now()
				}
			}
		};
		this.#persist();
	}

	/**
	 * File a week's covers.
	 *
	 * The week defaults from a DEFAULT PARAMETER, evaluated at the instant of the
	 * call — never from a module const, a $state seeded at init, or a $derived
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
	 * omitting the key — one blur on an empty box would otherwise destroy every
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
		this.#r = adoptImport(this.#r, dishes, costs, incoming);
		this.#persist();
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
	 * NAMED line — the book fills itself from work the venue was doing anyway,
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
