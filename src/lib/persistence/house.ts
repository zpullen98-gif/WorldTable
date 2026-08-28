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
/*
 * These moved to state.ts, the LEAF module, and are re-exported here so the
 * store and the pages keep one import site.
 *
 * They had to move: mergeSessions needs mergeCostings, and state.ts's own
 * header explains why it must not import back — it is deliberately a leaf so
 * db.ts and migrations.ts never form a cycle, and that cycle once "only
 * worked because each side happened to touch the other's exports inside
 * function bodies rather than at module-eval time". A costing merge living
 * here would have rebuilt it.
 */
import { localDay, weekStartOf, recentWeeks, normaliseCosting, mergeCostings } from './state';
export { localDay, weekStartOf, recentWeeks, normaliseCosting, mergeCostings, CLOCK_SKEW_MS } from './state';
import type { CostLine } from '../costing';
import { mergeItems, type Item } from '../items';

export const HOUSE_KEY = 'house';
export const HOUSE_VERSION = 1;

/** Why a dish is off, and since when. `by` is a name, never a permission. */
export interface EightySix {
	at: number;
	by?: string;
}

/**
 * A prep — the thing a menu dish is built from and the sheet had no word for.
 *
 * WHY IT EXISTS. A braise's cost sheet carried a line reading "Demi-glace,
 * 6.00/L, 0.15 L, 100% yield". Nobody had ever costed the demi — bones,
 * mirepoix, wine, nine hours, a yield nearer 25% — and the same 6.00 guess was
 * retyped into every other dish that used it, differently in some of them. Every
 * sauced dish was understated in the direction that flatters, which is precisely
 * the error `plateCost`'s `complete` flag exists to refuse.
 *
 * It lives on the HOUSE record and not in SessionState, for the same reason the
 * menu and its costings do: what the demi costs is a fact about the venue, not
 * about whichever cook is holding the tablet.
 */
export interface Prep {
	/** 'p-' + base36, minted once at first save, never recomputed. */
	id: string;
	name: string;
	/** Free text, display only: "1 x 20L pot", "2 gastros". */
	batch: string;
	/** Plate-portions one batch makes. The divisor — it must be > 0 to cost. */
	portions: number;
	/** How many portions to keep on hand. What the prep board counts against. */
	par: number;
	shelfLifeDays?: number;
	/**
	 * SECONDS, not minutes, and not negotiable.
	 *
	 * `PassStepInput` is handsOnSec/unattendedSec and `handsOf()` divides by 60,
	 * so a prep stored in minutes back-times to SIXTY TIMES its real length —
	 * a two-hour stock would claim five days. Seconds here means the prep board
	 * can hand these straight to buildPass when it arrives.
	 */
	handsOnSec: number;
	unattendedSec: number;
	/** A station key from stations.json, when the kitchen works that way. */
	station?: string;
	lines: CostLine[];
	/** A guide or family recipe this prep is made from, if there is one. */
	recipeSlug?: string;
	ts: number;
}

export interface HouseRecord {
	schemaVersion: number;
	dishes: MenuDish[];
	/** The venue's sub-recipes. See Prep. */
	preps: Prep[];
	/**
	 * The item book, keyed by itemSlugOf(name). See items.ts.
	 *
	 * On the HOUSE record for the same reason the preps are: what the venue pays
	 * for butter is a fact about the venue, not about whichever cook is holding
	 * the tablet. A per-profile item book would give the head chef and the sous
	 * two different plate costs for one dish.
	 */
	items: Record<string, Item>;
	/**
	 * Whether the menu prices this venue types include tax, and at what rate.
	 *
	 * ON THE HOUSE RECORD, not in the session, and that is a real improvement
	 * rather than a filing decision: a tax regime is a fact about the VENUE, so
	 * putting it here means the head chef and the sous cannot see two different
	 * food cost percentages for the same dish. Per-profile, they could.
	 *
	 * Default off and never inferred — see netOfTax().
	 */
	tax?: { inclusive: boolean; ratePct: number };
	/**
	 * What was counted in the walk-in, by prep id.
	 *
	 * A count is only true for the day it was made — "12 portions of demi" from
	 * Tuesday tells you nothing on Thursday, and a board that treats it as
	 * current sends a commis to make nothing. `countedOn` is a plain YYYY-MM-DD
	 * so the board can say "counted yesterday" rather than quietly believing it.
	 */
	prepCounts: Record<string, { onHand: number; countedOn: string }>;
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
	preps: [],
	items: {},
	prepCounts: {},
	eightySix: {},
	dishCosts: {},
	absorbed: [],
	lastWrite: 0
};

/**
 * What to do with whatever was on disk under the `house` key.
 *
 * THIS EXISTS BECAUSE THE FIRST VERSION LOST DATA. hydrate() read the record
 * behind `if (schemaVersion <= HOUSE_VERSION)` and had no else, so a record
 * written by a NEWER build failed the test, `#r` stayed EMPTY_HOUSE, and the
 * next write — absorbSession's persist, or the first tap on the 86 board, which
 * is the most-tapped write in the app — put that empty record over the top of
 * it. A venue's menu, preps, costings, counts and 86 board, gone, on nothing
 * more than a rollback or a stale service worker.
 *
 * That is not hypothetical here. vite.config.ts:65 sets `registerType: 'prompt'`
 * with `skipWaiting: false` — "never reload the page out from under a cook" —
 * so a device serving an older bundle for a while is the SHIPPED DESIGN.
 *
 * db.ts's session path already had the right instinct and this did not follow
 * it: migrate() throws on a newer version and loadSession snapshots before
 * resetting, "never destroy data silently". For a newer record the stronger
 * answer is to write nothing at all — then downgrading and upgrading again is
 * lossless, which is exactly what migrate()'s own comment promises.
 *
 * `blocked` means: do not read it, and never, ever write over it.
 */
export function readHouse(raw: unknown): { record: HouseRecord; blocked: boolean } {
	const empty = structuredClone(EMPTY_HOUSE);
	if (!raw || typeof raw !== 'object') return { record: empty, blocked: false };
	const v = (raw as HouseRecord).schemaVersion;
	// A record with no version at all predates the field: readable, and the
	// spread below fills in whatever it lacks.
	if (typeof v === 'number' && v > HOUSE_VERSION) return { record: empty, blocked: true };
	return { record: { ...empty, ...(raw as HouseRecord) }, blocked: false };
}

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
		// Normalised on the way in. Unconditional and gated only on the unseen
		// dish id -- no ts comparison, because the house has no record for this
		// dish at all when this fires.
		const c = normaliseCosting(mine.dishCosts?.[d.id]);
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
 *
 * `incoming` IS THE WHOLE HOUSE BLOCK AND IS REQUIRED, both deliberately. It
 * used to be `preps?: Prep[]`, and that optional argument is the entire reason
 * preps could not travel for as long as they existed: the parameter was added,
 * the merge below was written and tested, and neither call site ever passed
 * one — silently, because an omitted optional argument compiles. Required means
 * the next collection added to HousePortable cannot repeat it; taking the block
 * rather than a bare array means adding one does not touch this signature at
 * all. Pass `{}` to mean "this file carried none", and say so on purpose.
 */
export function adoptImport(
	house: HouseRecord,
	dishes: MenuDish[] | undefined,
	costs: Record<string, DishCosting> | undefined,
	incoming: HousePortable
): HouseRecord {
	const byId = new Map(house.dishes.map((d) => [d.id, d]));
	for (const d of dishes ?? []) {
		if (!d?.id) continue;
		const mine = byId.get(d.id);
		if (!mine || (d.ts ?? 0) > (mine.ts ?? 0)) byId.set(d.id, d);
	}
	const nextDishes = [...byId.values()];

	// THE LIVE IMPORT PATH, and the one that lost the data. This was a bare
	// `nextCosts[id] = c` on a newer ts -- it would store null, a string, or a
	// record from an older build straight into the venue live costings, and it
	// replaced the WHOLE record, so a file carrying week 5 wiped weeks 1-4.
	const nextCosts = { ...house.dishCosts };
	for (const [id, c] of Object.entries(costs ?? {})) {
		const merged = mergeCostings(nextCosts[id], c);
		if (merged) nextCosts[id] = merged;
	}

	// Named explicitly rather than left to a spread, the way every other field
	// in a merge here is. cookedLog and shoppingChecks once fell through a bare
	// one and erased a Path of Study.
	const prepById = new Map(house.preps.map((p) => [p.id, p]));
	for (const p of incoming.preps ?? []) {
		if (!p?.id) continue;
		const mine = prepById.get(p.id);
		if (!mine || (p.ts ?? 0) > (mine.ts ?? 0)) prepById.set(p.id, p);
	}

	// UNION, never replace. mergeItems' own header has the argument: the losing
	// device's book holds every price change IT recorded, and newer-wins-whole
	// would destroy exactly the history the book exists to keep — silently, and
	// leaving something plausible behind. Same conclusion mergeCostings reached
	// about weeks of covers.
	const nextItems = mergeItems(house.items, incoming.items);

	return {
		...house,
		dishes: nextDishes,
		dishCosts: nextCosts,
		preps: [...prepById.values()],
		items: nextItems,
		absorbed: [...new Set([...house.absorbed, ...nextDishes.map((d) => d.id)])]
	};
}

/**
 * Removing a prep leaves the dishes that used it INCOMPLETE rather than
 * cheaper.
 *
 * resolveLines() reports a missing prep as uncostable, so the consuming dish
 * loses its total instead of silently dropping the sauce off the plate cost.
 * That is the whole point: a dish that quietly got cheaper is how a menu gets
 * priced wrong.
 */
export function removePrep(house: HouseRecord, id: string): HouseRecord {
	return { ...house, preps: house.preps.filter((p) => p.id !== id) };
}

/** Which menu dishes have a line pointing at this prep. */
export function dishesUsingPrep(house: HouseRecord, prepId: string): MenuDish[] {
	return house.dishes.filter((d) =>
		(house.dishCosts[d.id]?.lines ?? []).some((l) => l.prepId === prepId)
	);
}

/**
 * How many batches to make, given what is on hand.
 *
 * Par and the count are both in PORTIONS; portions-per-batch is what turns the
 * shortfall into a number of pots. Ceiling, because two thirds of a batch of
 * stock is a batch of stock.
 */
export function batchesNeeded(prep: Prep, onHand: number): number {
	const short = prep.par - (Number.isFinite(onHand) ? onHand : 0);
	if (short <= 0) return 0;
	if (!Number.isFinite(prep.portions) || prep.portions <= 0) return 0;
	return Math.ceil(short / prep.portions);
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

/**
 * The house-owned collections that ride OUTSIDE the session object.
 *
 * WHY THIS IS SEPARATE FROM houseSnapshot. The menu and its costings sit inside
 * the file's `data` block only because they have a session-side legacy
 * (`SessionState.menuDishes`) that absorbSession is still taking up; every
 * .wtjson ever written carries them there and moving them would strand the lot.
 * Preps never had that legacy, and mergeSessions() spreads `...incoming` before
 * its named fields — so a prep placed in `data` would be copied straight into
 * the per-profile `session::<profileId>` record and persisted there. A prep is
 * a fact about the VENUE. That is the one line this app does not cross.
 *
 * THIS EXISTED AS DEAD CODE UNTIL NOW. adoptImport() has taken a `preps`
 * argument and merged it by id since preps shipped, and nothing ever passed
 * one: houseSnapshot emitted two fields, and both live call sites in
 * menu/+page.svelte called adopt() with two arguments. So a venue that costed
 * its demi once — the whole point of preps — exported a file carrying none of
 * them, and at the second site every prep-backed line resolved to NaN. Measured
 * on the worked braise: 8.625 a plate at the first site, 5.625 and
 * `complete: false` at the second, with the sauce simply gone from the
 * arithmetic. `preps.test.ts` had a case named "survives an import that
 * mentions no preps at all", which was every import there had ever been.
 *
 * `eightySix` stays out of both, for the reason houseSnapshot already gives:
 * the board is true only for the room it is in, right now. A prep is a recipe.
 */
export interface HousePortable {
	preps?: Prep[];
	/**
	 * The item book. Absent from every file written before it existed, which is
	 * why it is optional HERE and required at every function that emits one.
	 */
	items?: Record<string, Item>;
}

export function housePortable(house: HouseRecord): HousePortable {
	return { preps: house.preps, items: house.items };
}
