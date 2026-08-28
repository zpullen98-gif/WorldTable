/**
 * The house record's reconciliation, as pure functions.
 *
 * Lives here rather than inside stores/house.svelte.ts for exactly the reason
 * mergeSessions() does: a runes module is unreachable from a unit test, and
 * this is the code that most needs one. The store is a thin wrapper that reads,
 * calls these, and writes.
 *
 * WHAT THE RECORD IS. The venue's facts — the menu, what is 86'd, and what a
 * plate costs — kept under a flat `house` key that profiles.key() never
 * namespaces. See stores/house.svelte.ts for why that line is drawn where it is.
 */
import type { MenuDish, DishCosting } from './state';

export const HOUSE_KEY = 'house';
export const HOUSE_VERSION = 1;

/** Why a dish is off, and since when. `by` is a name, never a permission. */
export interface EightySix {
	at: number;
	by?: string;
}

export interface HouseRecord {
	schemaVersion: number;
	dishes: MenuDish[];
	eightySix: Record<string, EightySix>;
	dishCosts: Record<string, DishCosting>;
	/**
	 * Dish ids already taken up from a per-profile session, so absorption
	 * happens ONCE per dish. Without it, a dish deleted from the house record is
	 * resurrected on the next load by the stale copy still sitting in whichever
	 * session originally held it — and a dish that will not stay deleted is
	 * worse than one that was never absorbed.
	 */
	absorbed: string[];
	lastWrite: number;
	lastEditedBy?: string;
}

export const EMPTY_HOUSE: HouseRecord = {
	schemaVersion: HOUSE_VERSION,
	dishes: [],
	eightySix: {},
	dishCosts: {},
	absorbed: [],
	lastWrite: 0
};

/**
 * Take up whatever a per-profile session is still holding — once per dish id.
 *
 * This is the migration off `SessionState.menuDishes`, and it is deliberately
 * incremental rather than a one-shot sweep of the roster. A sweep needs the
 * profile list at exactly the moment the app starts and still misses anyone
 * created later; absorbing on each person's own first load reaches everybody
 * and needs nothing but the record already open in front of it.
 */
export function absorbSession(
	house: HouseRecord,
	mine: { menuDishes?: MenuDish[]; dishCosts?: Record<string, DishCosting> } | undefined
): HouseRecord {
	if (!mine?.menuDishes?.length) return house;
	const seen = new Set([...house.absorbed, ...house.dishes.map((d) => d.id)]);
	let dishes = house.dishes;
	let costs = house.dishCosts;
	let absorbed = house.absorbed;
	for (const d of mine.menuDishes) {
		if (!d?.id || seen.has(d.id)) continue;
		dishes = [...dishes, d];
		absorbed = [...absorbed, d.id];
		const c = mine.dishCosts?.[d.id];
		if (c) costs = { ...costs, [d.id]: c };
		seen.add(d.id);
	}
	if (dishes === house.dishes) return house;
	return { ...house, dishes, dishCosts: costs, absorbed };
}

/**
 * Merge an imported menu in, newer `ts` winning per dish id.
 *
 * Unlike absorbSession this ignores `absorbed`: an import is somebody choosing
 * to bring a menu in, and refusing a dish because a copy of it was deleted here
 * months ago would be obeying the wrong memory.
 */
export function adoptImport(
	house: HouseRecord,
	dishes: MenuDish[] | undefined,
	costs: Record<string, DishCosting> | undefined
): HouseRecord {
	const byId = new Map(house.dishes.map((d) => [d.id, d]));
	for (const d of dishes ?? []) {
		if (!d?.id) continue;
		const mine = byId.get(d.id);
		if (!mine || (d.ts ?? 0) > (mine.ts ?? 0)) byId.set(d.id, d);
	}
	const nextDishes = [...byId.values()];

	const nextCosts = { ...house.dishCosts };
	for (const [id, c] of Object.entries(costs ?? {})) {
		const mine = nextCosts[id];
		if (!mine || (c?.ts ?? 0) > (mine.ts ?? 0)) nextCosts[id] = c;
	}

	return {
		...house,
		dishes: nextDishes,
		dishCosts: nextCosts,
		absorbed: [...new Set([...house.absorbed, ...nextDishes.map((d) => d.id)])]
	};
}

/** Removing a dish takes its costing and its 86 with it. */
export function removeDish(house: HouseRecord, id: string): HouseRecord {
	const dishCosts = { ...house.dishCosts };
	delete dishCosts[id];
	const eightySix = { ...house.eightySix };
	delete eightySix[id];
	return { ...house, dishes: house.dishes.filter((d) => d.id !== id), dishCosts, eightySix };
}

/**
 * What an export carries.
 *
 * `eightySix` is deliberately absent. A .wtjson is a file somebody mails to a
 * second site or opens next week, and importing yesterday's export must never
 * take a dish off tonight's menu that came back on this morning. The 86 board
 * is true only for the room it is in, right now.
 */
export function houseSnapshot(house: HouseRecord): {
	menuDishes: MenuDish[];
	dishCosts: Record<string, DishCosting>;
} {
	return { menuDishes: house.dishes, dishCosts: house.dishCosts };
}
