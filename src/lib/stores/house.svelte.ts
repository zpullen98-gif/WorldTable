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
	removeDish as removeDishFrom,
	houseSnapshot,
	type HouseRecord,
	type EightySix
} from '../persistence/house';
import type { MenuDish, DishCosting } from '../persistence/state';

export type { HouseRecord, EightySix };

const store = browser ? createStore('world-table', 'state') : undefined;

class House {
	#r = $state<HouseRecord>(structuredClone(EMPTY_HOUSE));
	#ready = false;

	get ready() {
		return this.#ready;
	}
	get dishes(): MenuDish[] {
		return this.#r.dishes;
	}
	get lastEditedBy(): string | undefined {
		return this.#r.lastEditedBy;
	}

	#persist() {
		if (!browser || !store) return;
		this.#r.lastWrite = Date.now();
		const by = profiles.currentName();
		if (by) this.#r.lastEditedBy = by;
		void set(HOUSE_KEY, $state.snapshot(this.#r), store);
	}

	async hydrate() {
		if (!browser || !store || this.#ready) return;
		try {
			const raw = (await get(HOUSE_KEY, store)) as HouseRecord | undefined;
			if (raw && typeof raw.schemaVersion === 'number' && raw.schemaVersion <= HOUSE_VERSION) {
				this.#r = { ...structuredClone(EMPTY_HOUSE), ...raw };
			}
		} catch {
			/* an unreadable house record starts empty rather than taking the app down */
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

	costingFor(id: string): DishCosting {
		return this.#r.dishCosts[id] ?? { lines: [], ts: 0 };
	}

	setCosting(id: string, costing: Omit<DishCosting, 'ts'>) {
		this.#r = {
			...this.#r,
			dishCosts: { ...this.#r.dishCosts, [id]: { ...costing, ts: Date.now() } }
		};
		this.#persist();
	}

	/* ---- import / export -------------------------------------------------- */

	adopt(dishes: MenuDish[] | undefined, costs: Record<string, DishCosting> | undefined) {
		this.#r = adoptImport(this.#r, dishes, costs);
		this.#persist();
	}

	snapshot() {
		return houseSnapshot($state.snapshot(this.#r) as HouseRecord);
	}
}

export const house = new House();
