/**
 * The persisted session's shape: in its own module, imported by BOTH db.ts and
 * migrations.ts, precisely so those two never import each other.
 *
 * They used to: db needed migrate(), migrations needed EMPTY_SESSION. That
 * cycle only worked because each side happened to touch the other's exports
 * inside function bodies rather than at module-eval time; one hoisted constant
 * later and the app would throw at import time. Depending on evaluation-order
 * luck is not a foundation; a leaf module is.
 */
import type { Recipe } from '../types';
import { screenFamilyRecipes } from '../familyRecipe';
import { asArray, asRecord } from '../importShape';
import type { CostLine } from '../costing';

export const CURRENT_VERSION = 1;

/**
 * A dish on the venue's own menu, The Kitchen's Menu. Deliberately NOT a
 * Recipe: recipes feed the pantry matcher, search and cook mode, and a menu
 * item is a different thing (a price, a section, an allergen line; no method,
 * no timings). Own sibling field, own shape.
 */
export interface MenuDish {
	/** 'd-' + base36, minted at first save, never recomputed. */
	id: string;
	name: string;
	/** Menu section (Starters, Mains…) and the quiz's distractor category. */
	section: string;
	description: string;
	ingredients: string[];
	allergens: string[];
	/**
	 * Set only by an explicit "allergens checked" affirmation, never by Save;
	 * ms epoch, and re-stamped each time it is affirmed.
	 *
	 * Without it `allergens: []` is ambiguous in the one direction an allergen
	 * display must never be ambiguous: it means BOTH "this dish carries none"
	 * and "nobody has looked yet". Undefined on every dish written before this
	 * existed, which reads as not-checked, which is the safe default.
	 */
	allergensCheckedAt?: number;
	/**
	 * The guide or family recipe this dish is cooked from, if the kitchen has
	 * said so.
	 *
	 * A POINTER, NOT A METHOD. "A menu item is not a Recipe" still holds: this
	 * dish carries no steps, no ingredients-with-quantities and no technique
	 * tags of its own. But one slug lets the lamb rump that goes out sixty times
	 * a week reach cook mode, the standard it is judged against and the
	 * Repertoire, instead of being a name and a price the app can do nothing with.
	 */
	recipeSlug?: string;
	price: string;
	/** Last edit, ms epoch; the import-merge tiebreak. */
	ts: number;
	/**
	 * What the Maitre d' wrote about this dish, and what a person kept.
	 *
	 * Every mark carries `by`. "Kept" means `by === 'person'`: Keep and Edit
	 * both set it. A mark she wrote that nobody has kept is HERS, and an unkept
	 * mark reaches no drill, no guest menu and no deck. That line is drawn on
	 * the record and not in the screens, because a screen is the thing that
	 * forgets: one guest menu reading every mark would put her guess at a table
	 * in the house's voice.
	 *
	 * Inside the dish rather than a sibling like dishCosts, because a mark is
	 * about this dish and nothing else; but it is never merged WITH the dish.
	 * The dish wins whole on `ts`, and mergeMaitre then settles the marks on
	 * their own stamps and unions `kept`, so a colleague's later edit to a
	 * description cannot erase an answer somebody kept. Every site that
	 * rebuilds a dish field by field (saveDish in /menu) must carry this or the
	 * next edit drops it: the trap that once lost Prep.station.
	 *
	 * There is no allergen mark and there never will be: see the parser header
	 * in menu-parse.ts. She is not allowed a word about allergens in any field,
	 * and normaliseMaitre drops any key this shape does not name.
	 */
	maitre?: MaitreBlock;
}

/**
 * One thing the Maitre d', or a person, wrote on a record: the value, who it
 * is by, when, and which model wrote it when it was hers. The SAME shape in all
 * three apps, so a bottle's marks and a cocktail's marks read like a dish's.
 *
 * `ts` is the mark's OWN stamp, never the dish's: Keep re-stamps it, so a mark
 * a person confirmed on one tablet beats her older unconfirmed one on another.
 */
export interface MaitreMark<T = string> {
	value: T;
	by: 'maitre' | 'person';
	ts: number;
	model?: string;
}

/** One answer kept from Ask the Maitre d'. Keeping is a person's act, so it carries no `by`. */
export interface MaitreNote {
	q: string;
	a: string;
	ts: number;
	model?: string;
}

export interface MaitreBlock {
	/**
	 * The ingredients the menu NAMED, as she read them off the page. A record
	 * of the printed words, never a claim about what is in the dish.
	 */
	ingredientsNamed?: MaitreMark<string[]>;
	/** The Floor Deck's five: how to say it, the guest line, the why, what it sits with, where it comes from. */
	say?: MaitreMark;
	guest?: MaitreMark;
	why?: MaitreMark;
	pairs?: MaitreMark;
	origin?: MaitreMark;
	/** Answers a person kept from the chat. Unioned on `ts|q` by every merge, never replaced. */
	kept?: MaitreNote[];
}

/** The mark fields, in one list, so a loop cannot forget one and a stray key cannot join. */
export const MAITRE_FIELDS = ['ingredientsNamed', 'say', 'guest', 'why', 'pairs', 'origin'] as const;
export type MaitreField = (typeof MAITRE_FIELDS)[number];
/** What setMaitre accepts: marks only. `kept` has its own door, keepMaitreNote. */
export type MaitrePatch = Partial<Pick<MaitreBlock, MaitreField>>;

export interface SessionState {
	schemaVersion: number;
	/** Recipe slugs, never array indices. See stores/session.svelte.ts. */
	menu: string[];
	notes: Record<string, string>;
	pantry: string[];
	/** menuHash -> checked shopping-list line ids */
	shoppingChecks: Record<string, string[]>;
	/**
	 * The service currently being cooked, if any.
	 *
	 * `live` and `serviceTime` were component state, so walking to the walk-in
	 * and coming back lost the clock entirely, on the one screen a cook is
	 * standing in front of while something is on the heat.
	 *
	 * Ticks carry a TIMESTAMP rather than a boolean, which costs nothing and
	 * buys two things: the alert can say where the time actually went, and each
	 * consecutive pair is an observed duration.
	 */
	planRun?: PlanRun;
	/**
	 * Observed elapsed minutes per step, keyed `slug#index#stepCount`.
	 *
	 * The step count is IN the key on purpose. It is constant for the 1,844
	 * frozen guide recipes, so it costs them nothing; a family recipe
	 * re-authored to a different length simply mints a new key and its old
	 * observations are never read again. No special case, no stale actuals
	 * against a step that moved.
	 */
	stepActuals: Record<string, number[]>;
	/**
	 * Every cook, not every dish: one entry per time the dish was made. The
	 * timestamps drive the re-cook schedule in lib/repertoire.ts; the grade is
	 * what the plate was against the dish's standard, absent on cooks recorded
	 * before standards existed and on the 127 dishes that have none.
	 */
	cookedLog: Array<{
		slug: string;
		at: number;
		grade?: 'met' | 'close' | 'missed';
		/** Frozen mark ids that were off; see CookEntry in repertoire.ts. */
		off?: string[];
		/** The palate lever reached for, a slug into palate.json. */
		fault?: string;
	}>;
	/**
	 * Drill answers over lexicon terms. Deliberately the SAME shape as a cook,
	 * so repertoire() consumes it with no adapter and the ladder is shared code
	 * rather than copied code.
	 *
	 * A SIBLING of cookedLog, never merged into it: the mode bar's amber count
	 * is computed from cookedLog, and folding 186 terms in would report "dishes
	 * past their re-cook" in the chrome of every page while counting cheeses.
	 */
	drillLog: Array<{ slug: string; at: number; grade?: 'met' | 'close' | 'missed' }>;
	/**
	 * The calibration bench, and a THIRD sibling for the same documented
	 * reason drillLog is a sibling of cookedLog: the mode bar amber count is
	 * computed from cookedLog, and folding these in would report "dishes past
	 * their re-cook" in the chrome of every page while counting salt.
	 *
	 * One slug per level (cal-salt-3), so repertoire()s TERM_LADDER_DAYS
	 * reschedules each concentration on a real interval with no adapter, and
	 * the level a person has reached is read off which slugs they cleared.
	 */
	calibrationLog: Array<{ slug: string; at: number; grade?: 'met' | 'close' | 'missed' }>;
	familyRecipes: Recipe[];
	/**
	 * DEPRECATED as a live field: the menu moved to the device-wide house
	 * record (persistence/house.ts) because a venue buys ONE subscription for
	 * unlimited staff and this key is namespaced per person.
	 *
	 * Kept because it is still the TRANSPORT: the .wtjson format carries the
	 * menu inside the session object, every file written so far does, and a
	 * format bump would strand them. Written by an import, read by an export,
	 * absorbed once by the house record. No UI reads it.
	 */
	menuDishes: MenuDish[];
	/**
	 * Costing for the venue's own dishes, keyed by MenuDish id.
	 *
	 * A sibling field rather than a member of MenuDish, deliberately. Dishes
	 * merge by id with the newer `ts` winning, so folding costs into the dish
	 * would let a colleague's edit to a description silently replace an evening
	 * of costing work. These merge on their own terms.
	 */
	dishCosts: Record<string, DishCosting>;
	lastWrite: number;
}

/**
 * One week's covers for one dish.
 *
 * `weekStart` is a LOCAL Monday as 'YYYY-MM-DD', matching the convention this
 * record already uses for `HouseRecord.prepCounts.countedOn` and for the same
 * reason: two devices in one kitchen agree on the DATE even when their
 * timezones and DST offsets do not. Epoch ms of local midnight does not survive
 * a DST boundary or a tablet whose zone changes: it mints a SECOND key for one
 * trading week, and a union merge faithfully keeps both, so the week is counted
 * twice on the menu-engineering board.
 */
export interface SalesWeek {
	/** Local Monday, 'YYYY-MM-DD'. Minted only by weekStartOf(). */
	weekStart: string;
	/**
	 * Covers. 0 is a REAL figure (counted, sold none) and is never the same
	 * thing as no entry at all. Absence means unknown, and only absence does.
	 */
	count: number;
	/**
	 * When this count was typed. The per-week merge tiebreak, and the ONLY
	 * tiebreak for covers.
	 *
	 * Deliberately not DishCosting.ts: that is restamped by every write
	 * including an ingredient edit routed through writeLines, so resolving a
	 * covers disagreement against it lets the device that corrected a unit cost
	 * at 19:00 overwrite the device that typed the covers at 17:00.
	 */
	at: number;
	/**
	 * Display only: the count an import replaced here. Never summed, never
	 * ranked, never merged forward. It exists so a per-week overwrite is visible
	 * at the number itself rather than only in a banner nobody re-reads.
	 */
	prev?: number;
}

export interface DishCosting {
	lines: CostLine[];
	/**
	 * Covers by week. REQUIRED, not optional.
	 *
	 * Required is load-bearing: an optional field satisfies the store's costing
	 * literal structurally, so the compiler would name none of the call sites
	 * and the first ingredient edit would silently drop the history, then stamp
	 * a fresh newest `ts` on the emptied record, so the loss propagates on the
	 * next import instead of being repaired by it.
	 */
	sales: SalesWeek[];
	/**
	 * The single undated figure this was before covers had weeks, kept forever
	 * as a MIRROR of the newest week's count.
	 *
	 * Never deleted and never re-dated. It is what an existing venue's number
	 * still reads as on update day, nothing moves on disk, and no board goes
	 * blank, and what a build predating `sales` can still read out of the same
	 * record. Derived, never taken from a caller: a writable `sold` beside a
	 * writable `sales` is two sources of truth for one number.
	 */
	sold?: number;
	/** Last edit, ms epoch. The import-merge tiebreak for LINES. */
	ts: number;
}

/** One service being cooked. See SessionState.planRun. */
export interface PlanRun {
	/** The pinned menu it belongs to: a different menu does not inherit it. */
	menuHash: string;
	serviceTime: string;
	/** When the clock was started, so a run nobody closed expires on its own. */
	startedAt: number;
	/** Row key (`slug-n`) -> when it was ticked. */
	ticks: Record<string, number>;
}

/**
 * How long a forgotten run stays live.
 *
 * A cook who closes the tab mid-service and comes back in ten minutes wants the
 * clock back. One who opens the app the following afternoon does not want last
 * night's "40 minutes behind", so the run expires rather than being resumed
 * into a lie.
 */
export const RUN_MAX_AGE_MS = 18 * 60 * 60 * 1000;

/**
 * The run, but ONLY if it belongs to this menu and has not gone stale.
 *
 * Pure and outside the runes store, per the house rule, so the two refusals
 * are directly testable — SessionStore.runFor() is a two-line pass-through to
 * this. Both guards matter. A run inherited by a different menu would tick
 * rows that are not in it; a run resumed the following afternoon would open
 * on "40 minutes behind" for a service that finished last night.
 *
 * `now` is a parameter rather than `Date.now()` read inline, so the staleness
 * arm is testable without a fake timer.
 */
export function runFor(planRun: PlanRun | undefined, menuHash: string, now: number): PlanRun | null {
	if (!planRun || planRun.menuHash !== menuHash) return null;
	if (now - planRun.startedAt > RUN_MAX_AGE_MS) return null;
	return planRun;
}

export const EMPTY_SESSION: SessionState = {
	schemaVersion: CURRENT_VERSION,
	menu: [],
	notes: {},
	pantry: [],
	shoppingChecks: {},
	stepActuals: {},
	cookedLog: [],
	drillLog: [],
	calibrationLog: [],
	familyRecipes: [],
	menuDishes: [],
	dishCosts: {},
	lastWrite: 0
};

/** A local YYYY-MM-DD, so "today" means the kitchen's today and not UTC's. */
export function localDay(d: Date): string {
	const p = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}


/**
 * The local Monday a date falls in, as 'YYYY-MM-DD'.
 *
 * THE NOON ANCHOR IS NOT DECORATION. The version everyone writes is
 * `setHours(0, 0, 0, 0)`, and it lands on a local midnight that DOES NOT EXIST
 * on transition days in America/Havana, America/Santiago, America/Asuncion and
 * Africa/Cairo. The Date normalises forward to 01:00, `setDate` then preserves
 * that wall-clock hour, and a Sunday write and a Wednesday write in the same
 * week on the same device mint two different keys. No DST shift is twelve
 * hours, so local noon always exists and is never repeated.
 */
export function weekStartOf(d: Date = new Date()): string {
	const n = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
	// getDay() is 0 for Sunday; (day + 6) % 7 makes Monday 0.
	n.setDate(n.getDate() - ((n.getDay() + 6) % 7));
	return localDay(n);
}

/**
 * The last `n` week-starts, newest first, walked by CALENDAR days.
 *
 * Never by subtracting 7 * 86_400_000: across a DST boundary that misses a
 * stored key by exactly an hour, so a week that IS on disk renders blank, the
 * chef retypes it, and the record ends up holding two entries for one week.
 * pass.ts already rounds for the same reason.
 */
export function recentWeeks(n: number, from: Date = new Date()): string[] {
	const out: string[] = [];
	const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12, 0, 0, 0);
	for (let i = 0; i < n; i++) {
		out.push(weekStartOf(cursor));
		cursor.setDate(cursor.getDate() - 7);
	}
	return out;
}

const validWeek = (w: unknown): w is SalesWeek =>
	!!w &&
	typeof w === 'object' &&
	typeof (w as SalesWeek).weekStart === 'string' &&
	/^\d{4}-\d{2}-\d{2}$/.test((w as SalesWeek).weekStart) &&
	Number.isFinite((w as SalesWeek).count) &&
	Number.isFinite((w as SalesWeek).at);

/**
 * Bring a costing from any shape this app has ever written into the current one.
 *
 * NORMALISATION ON SHAPE, NOT ON VERSION, and that is the whole design. Bumping
 * `CURRENT_VERSION` would arm db.ts's corrupt-and-reset path for the first time
 * in this app's life; bumping `HOUSE_VERSION` would arm the record-blocking path.
 * This is pure and idempotent instead, so it is safe to run at every boundary a
 * costing enters, needs no stamp, and never writes on load.
 *
 * Returns null only for something carrying NO typed figure at all. A costing
 * with valid `sales` and no `lines` array is kept with `lines: []`; the old
 * guard (`!Array.isArray(lines)` -> discard) would silently throw away exactly
 * the record this change produces.
 */
export function normaliseCosting(raw: unknown): DishCosting | null {
	if (!raw || typeof raw !== 'object') return null;
	const c = raw as Partial<DishCosting>;
	const lines = Array.isArray(c.lines) ? c.lines : [];
	const sales = Array.isArray(c.sales) ? c.sales.filter(validWeek) : [];
	// Test the VALUE, never the key: structuredClone preserves a key whose value
	// is undefined, so `'sold' in c` is true for a field that was cleared. And
	// never a truthiness test: 0 covers is the number a chef types precisely so
	// the board calls a dish a dog.
	const sold = Number.isFinite(c.sold) ? (c.sold as number) : undefined;
	if (!lines.length && !sales.length && sold === undefined) return null;

	sales.sort((a, b) => (a.weekStart < b.weekStart ? 1 : a.weekStart > b.weekStart ? -1 : 0));
	return {
		lines,
		sales,
		// The mirror. Newest week if there is one, else whatever undated figure
		// this record already carried.
		...(sales.length ? { sold: sales[0].count } : sold !== undefined ? { sold } : {}),
		ts: Number.isFinite(c.ts) ? (c.ts as number) : 0
	};
}

/** An incoming stamp this far ahead of us is a broken clock, not the future. */
export const CLOCK_SKEW_MS = 24 * 60 * 60 * 1000;

/**
 * Merge two costings for one dish. ONE implementation, called from both the
 * house import and the session transport merge; they have already drifted once.
 *
 * `sales` UNIONS by weekStart. That single property is what makes this change
 * safe: a week present on one side only is always kept, so importing a file
 * carrying week 5 can no longer replace local weeks 1-4, which is exactly what
 * the old whole-record replace did.
 *
 * `lines` still merge WHOLE on the newer `ts`. The original rationale,
 * "merging line-by-line across two sheets would invent a third sheet neither
 * venue priced", stays true for lines and becomes FALSE for sales, because two
 * devices' week records are disjoint observations rather than competing sheets.
 */
export function mergeCostings(
	mineRaw: unknown,
	theirsRaw: unknown,
	now: number = Date.now()
): DishCosting | null {
	const mine = normaliseCosting(mineRaw);
	const theirs = normaliseCosting(theirsRaw);
	if (!mine) return theirs;
	if (!theirs) return mine;

	const byWeek = new Map<string, SalesWeek>();
	for (const w of mine.sales) byWeek.set(w.weekStart, w);
	for (const w of theirs.sales) {
		const ours = byWeek.get(w.weekStart);
		if (!ours) {
			byWeek.set(w.weekStart, w);
			continue;
		}
		if (ours.count === w.count) {
			// No disagreement. Keep the OLDER stamp deliberately, so the result is
			// identical whichever direction the file travelled: order-independence
			// is what makes re-importing your own export a no-op.
			byWeek.set(w.weekStart, ours.at <= w.at ? ours : w);
			continue;
		}
		// A stamp well ahead of this device is a dead RTC, not the future. Without
		// this one tablet with a wrong clock would own every week on every dish
		// after a single import, and beat every later correction.
		const theirsIsNewer = w.at <= now + CLOCK_SKEW_MS && w.at > ours.at;
		const winner = theirsIsNewer ? w : ours;
		const loser = theirsIsNewer ? ours : w;
		byWeek.set(w.weekStart, { ...winner, prev: loser.count });
	}

	const sales = [...byWeek.values()].sort((a, b) =>
		a.weekStart < b.weekStart ? 1 : a.weekStart > b.weekStart ? -1 : 0
	);
	// Lines travel with the newer stamp, and the merged ts is the max: a record
	// carrying the venue's newest lines under an older stamp stops propagating
	// them to any third device.
	const newer = theirs.ts > mine.ts ? theirs : mine;
	return {
		lines: newer.lines,
		sales,
		// An undated number from somebody else's file must never displace the
		// venue's own undated number.
		...(sales.length ? { sold: sales[0].count } : mine.sold !== undefined ? { sold: mine.sold } : {}),
		ts: Math.max(mine.ts, theirs.ts)
	};
}

/**
 * A stepActuals sample survives only if it is what recordStepActual
 * (session.svelte.ts) could have produced itself: rounded first, then
 * refused at or below zero. mergeSessions used to admit whatever arrived -
 * a fractional 0.4, a negative -3 - that the live store could never write.
 * Shared with describeImport so the banner can only ever describe a change
 * the merge will actually make.
 */
export function validStepActuals(raw: unknown): number[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.map((n) => (typeof n === 'number' ? Math.round(n) : NaN))
		.filter((n) => Number.isFinite(n) && n > 0);
}

/**
 * Two windows of one step's timings, capped at 12. `stepActuals` carries no
 * timestamp per sample (Record<string, number[]>, not Record<string,
 * {min,at}[]>), so this can never be the timestamp-keyed union cookedLog and
 * drillLog get - a genuine fix needs that field added, which is a schema
 * change this function does not make. What it fixes is the sharper failure:
 * concatenating and slicing the tail meant `incoming` always occupied the
 * cap, so a colleague's file exported months ago and carrying a full window
 * silently replaced every one of the cook's own observations for a shared
 * guide-recipe key. Drawing from the RECENT end of both arrays in turn means
 * a full incoming window now displaces at most half of a full local one,
 * never all of it.
 */
export function mergeStepWindow(current: number[], incoming: number[], cap = 12): number[] {
	const out: number[] = [];
	let ci = current.length - 1;
	let ii = incoming.length - 1;
	let takeIncoming = true;
	while (out.length < cap && (ci >= 0 || ii >= 0)) {
		if (takeIncoming && ii >= 0) out.push(incoming[ii--]);
		else if (!takeIncoming && ci >= 0) out.push(current[ci--]);
		else if (ii >= 0) out.push(incoming[ii--]);
		else out.push(current[ci--]);
		takeIncoming = !takeIncoming;
	}
	return out.reverse();
}

/* ---- the Maitre d's marks ------------------------------------------------
 *
 * Pure and in the leaf module, beside the shape, for the reason mergeCostings
 * is: mergeSessions needs the merge, and state.ts must not import house.ts
 * back. house.ts re-exports these so the store and the pages keep one import
 * site.
 */

type AnyMark = MaitreMark<string> | MaitreMark<string[]>;

const isString = (v: unknown): v is string => typeof v === 'string';
const isStringList = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);
const validBy = (b: unknown): b is MaitreMark['by'] => b === 'maitre' || b === 'person';
/**
 * A value with nothing honest in it. Her answer for "the menu does not say"
 * is the empty string or the empty list, and that answer is NOT a mark: filed,
 * it would be a blank line Keep could flip to the house's, and one a file
 * could carry in already kept, the empty kept mark confirmMaitre's comment
 * warns would reach the guest menu. A blank is refused at this one screen,
 * which every write and every merge passes, so a run with nothing to say
 * leaves the field as it found it. A value that is not blank is stored as
 * written: nothing here trims or tidies, that would be a spelling fix.
 * Clearing a field on purpose has its own door, discardMaitre.
 */
const isBlank = (v: string | string[]): boolean =>
	typeof v === 'string' ? !v.trim() : v.every((s) => !s.trim());

/**
 * One door for a write onto a block, so a loop over MAITRE_FIELDS stays typed
 * without a cast at every site. The value's shape is checked against the field
 * by validMark before anything reaches here.
 */
const setMark = <F extends MaitreField>(b: MaitreBlock, f: F, m: MaitreBlock[F]) => {
	b[f] = m;
};

/** A mark survives only if it is what the store could have written: a checked value with something in it, a known `by`, a finite stamp. */
function validMark(raw: unknown, list: boolean): AnyMark | undefined {
	if (!raw || typeof raw !== 'object') return undefined;
	const m = raw as Record<string, unknown>;
	const by = m.by;
	if (!validBy(by) || !Number.isFinite(m.ts)) return undefined;
	const ts = m.ts as number;
	const model = typeof m.model === 'string' ? { model: m.model } : {};
	// Two branches rather than one cast: the value is narrowed by the field it
	// is for, so a string can never land on ingredientsNamed, or a list on `why`.
	// Then the blank screen (isBlank): a checked value with nothing in it is
	// "the menu does not say", and that is no mark.
	if (list) return isStringList(m.value) && !isBlank(m.value) ? { value: m.value, by, ts, ...model } : undefined;
	return isString(m.value) && !isBlank(m.value) ? { value: m.value, by, ts, ...model } : undefined;
}

function validNote(raw: unknown): MaitreNote | undefined {
	if (!raw || typeof raw !== 'object') return undefined;
	const n = raw as Record<string, unknown>;
	if (!isString(n.q) || !isString(n.a) || !Number.isFinite(n.ts)) return undefined;
	return { q: n.q, a: n.a, ts: n.ts as number, ...(typeof n.model === 'string' ? { model: n.model } : {}) };
}

/**
 * Bring a block from any file into the shape, or nothing.
 *
 * Screened like every other list the merges take, and for one reason beyond
 * the usual hand-edited file: the block is a CLOSED set of fields. A key this
 * shape does not name, `allergens` above all, is dropped here rather than
 * carried, so no file and no model can smuggle an allergen mark onto a dish
 * through the one field she is allowed to write. Returns undefined when
 * nothing survives, so a caller never mints an empty block on a record that
 * had none.
 */
export function normaliseMaitre(raw: unknown): MaitreBlock | undefined {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
	const r = raw as Record<string, unknown>;
	const out: MaitreBlock = {};
	for (const f of MAITRE_FIELDS) {
		const m = validMark(r[f], f === 'ingredientsNamed');
		if (m) setMark(out, f, m);
	}
	const kept = asArray<unknown>(r.kept).map(validNote).filter((n): n is MaitreNote => !!n);
	if (kept.length) out.kept = kept.sort((a, b) => a.ts - b.ts);
	return Object.keys(out).length ? out : undefined;
}

/**
 * Which of two marks on one field stands.
 *
 * A kept mark (by a person) beats her unkept one whatever the stamps say, and
 * only then does the newer stamp win. The first rule is what keeps the merge
 * honest with setMaitre, which refuses to let her mark displace a kept one on
 * a single tablet: without it, the same re-run that is refused when the kept
 * mark is already here would win the moment it arrived by file instead. On a
 * tie mine stands, so re-importing your own export changes nothing.
 */
function pickMark(mine: AnyMark | undefined, theirs: AnyMark | undefined): AnyMark | undefined {
	if (!mine) return theirs;
	if (!theirs) return mine;
	const mineKept = mine.by === 'person';
	const theirsKept = theirs.by === 'person';
	if (mineKept !== theirsKept) return mineKept ? mine : theirs;
	return theirs.ts > mine.ts ? theirs : mine;
}

/**
 * Merge two blocks for one dish. ONE implementation, called from both
 * mergeSessions and adoptImport, because the dish merge they share has
 * already drifted once (the Array.isArray guard the house never got).
 *
 * The marks settle per field on their own stamps (pickMark), never as a set
 * with the dish: the dish wins whole on its `ts`, and if the marks rode with
 * it a colleague's later edit to a description would erase every line a
 * person kept. `kept` UNIONS on `ts|q`, because two devices' kept answers are
 * different answers, not competing versions of one. The trade, the same one
 * removeWaste makes: a discard does not travel, so a mark discarded here and
 * still held on another tablet comes back on the next import. An unkept one
 * comes back hers, reaching nothing, which is the harmless direction.
 *
 * THE RULE, for the ports to copy word for word (the plan's "winner's marks"
 * is read as this, and only this, because the literal reading is the one
 * that erases a kept `why` on a later description edit). Per field: a
 * person's mark beats hers whatever the stamps, then the newer ts, tie =
 * mine; kept unions on ts|q; a dish arriving without a block carries nothing
 * over. The Ledger backup merge and the Codex transfer merge follow this,
 * not the dish winner, so the same export settles the same way in all three.
 */
export function mergeMaitre(mineRaw: unknown, theirsRaw: unknown): MaitreBlock | undefined {
	const mine = normaliseMaitre(mineRaw);
	const theirs = normaliseMaitre(theirsRaw);
	if (!mine) return theirs;
	if (!theirs) return mine;
	const out: MaitreBlock = {};
	for (const f of MAITRE_FIELDS) {
		const m = pickMark(mine[f], theirs[f]);
		if (m) setMark(out, f, m);
	}
	const kept = new Map<string, MaitreNote>();
	for (const n of mine.kept ?? []) kept.set(`${n.ts}|${n.q}`, n);
	for (const n of theirs.kept ?? []) {
		const key = `${n.ts}|${n.q}`;
		if (!kept.has(key)) kept.set(key, n);
	}
	if (kept.size) out.kept = [...kept.values()].sort((a, b) => a.ts - b.ts);
	return out;
}

/**
 * The dish with this block, or with none. The key is REMOVED rather than set
 * to undefined: structuredClone keeps a key whose value is undefined, and
 * `'maitre' in d` would then be true for a dish that has no marks, the exact
 * ambiguity normaliseCosting's `sold` comment warns about. Same object back
 * when nothing changes, so a merge of two dishes without a block leaves an
 * old record untouched.
 */
export function withMaitre(dish: MenuDish, block: MaitreBlock | undefined): MenuDish {
	if (dish.maitre === block) return dish;
	const { maitre: _dropped, ...rest } = dish;
	return block ? { ...rest, maitre: block } : rest;
}

/**
 * Reconcile an imported session over the live one, field by field.
 *
 * Lives here as a pure function rather than inside the store because the store
 * is a .svelte.ts runes module that a unit test cannot reach, and this is
 * exactly the code that most needed a test. It shipped reconciling four of the
 * six data fields: `cookedLog` and `shoppingChecks` fell through a bare
 * `...incoming` spread, and since buildExport writes the FULL state, a genuine
 * export always carries them present-and-empty. Importing a friend's menu
 * therefore erased your entire Path of Study progress and every shopping tick,
 * irrecoverably, with the confirmation banner reporting only what it gained.
 *
 * The rule: every field is named explicitly. Nothing is left to the spread.
 */
/**
 * Keys a session no longer has, dropped wherever an old one can come back in:
 * a record saved by an older build (migrate) and an old export's `data`
 * (mergeSessions, whose spread of `incoming` would otherwise copy them).
 *
 * `role` ('chef' | 'student' | 'server') asked "what do you do?" on the home
 * page and reordered what the app suggested. The owner removed it on
 * 2026-09-19: every part of the app is for anyone.
 */
export const RETIRED_SESSION_KEYS = ['role'] as const;

export function withoutRetiredKeys<T extends object>(state: T): T {
	if (!RETIRED_SESSION_KEYS.some((k) => k in state)) return state;
	const out = { ...state } as Record<string, unknown>;
	for (const k of RETIRED_SESSION_KEYS) delete out[k];
	return out as T;
}

export function mergeSessions(
	current: SessionState,
	incoming: Partial<SessionState>
): SessionState {
	incoming = withoutRetiredKeys(incoming);
	// Union by slug AND time, because the log is a log.
	//
	// This used to key on slug alone and keep the earliest cook, which was
	// defensible while nothing read the timestamps: the log answered one
	// question ("has this been cooked?") and one entry answered it. It is not
	// defensible now. The re-cook schedule is built from how many times and how
	// recently a dish was made, so collapsing four cooks into the FIRST one told
	// the scheduler you last made the dish months before you did; importing a
	// session aged your whole repertoire.
	//
	// Keying on slug|at makes re-importing your own export idempotent, which is
	// what the old rule was really protecting, without discarding repeats.
	const cooked = new Map(current.cookedLog.map((e) => [`${e.slug}|${e.at}`, e]));
	for (const e of incoming.cookedLog ?? []) {
		if (!e || typeof e.slug !== 'string' || typeof e.at !== 'number') continue;
		const key = `${e.slug}|${e.at}`;
		const seen = cooked.get(key);
		// Same cook on both sides: keep whichever one was actually graded.
		// Prefer the RICHER entry, not merely the graded one.
		//
		// This used to be `!seen.grade && e.grade`, which was right when a grade
		// was all an entry could carry. Now an entry can also carry which marks
		// were off and which fault the cook named, and under the old test an
		// imported entry holding all three lost to a bare local grade on the same
		// slug|at: silently discarding the only part worth merging.
		const richness = (x?: { grade?: unknown; off?: unknown[]; fault?: unknown }) =>
			(x?.grade ? 4 : 0) + (x?.off?.length ? 2 : 0) + (x?.fault ? 1 : 0);
		if (!seen || richness(e) > richness(seen)) cooked.set(key, e);
	}

	/*
	 * Both levels guarded, not just the outer one. `Object.entries('ab')`
	 * treats a string as indexable and does not throw - it returns
	 * `[['0','a'],['1','b']]` - so a hand-typed `shoppingChecks: "ab"` used to
	 * survive the loop and silently write `{"0":["a"],"1":["b"]}`, because
	 * `[...'a']` (spreading a single CHARACTER) is a valid one-element array
	 * too. asRecord stops the outer scalar; Array.isArray stops a per-hash
	 * value that is a scalar with the outer shape otherwise correct.
	 */
	const shoppingChecks: SessionState['shoppingChecks'] = { ...current.shoppingChecks };
	for (const [hash, lines] of Object.entries(asRecord<unknown>(incoming.shoppingChecks))) {
		if (!Array.isArray(lines)) continue;
		shoppingChecks[hash] = [...new Set([...(shoppingChecks[hash] ?? []), ...lines])];
	}

	return {
		...current,
		...incoming,
		menu: [...new Set([...current.menu, ...asArray<string>(incoming.menu)])],
		// asRecord, not `?? {}`: a scalar `notes` (e.g. a hand-typed string)
		// is not null/undefined, so `?? {}` let it straight through, and
		// `{...'ab'}` treats a string as indexable the same way
		// `Object.entries` does - silently minting a junk note per character.
		notes: { ...current.notes, ...asRecord<string>(incoming.notes) },
		pantry: [...new Set([...current.pantry, ...asArray<string>(incoming.pantry)])],
		shoppingChecks,
		cookedLog: [...cooked.values()].sort((a, b) => a.at - b.at),
		// The same union as cookedLog above, for the same reason: keyed on
		// slug|at so repeats survive an import, never on slug alone: that was
		// the rule that collapsed every repeat and backdated the survivor.
		drillLog: (() => {
			const drilled = new Map(
				(current.drillLog ?? []).map((e) => [`${e.slug}|${e.at}`, e])
			);
			for (const e of incoming.drillLog ?? []) {
				if (!e || typeof e.slug !== 'string' || typeof e.at !== 'number') continue;
				const key = `${e.slug}|${e.at}`;
				const seen = drilled.get(key);
				if (!seen || (!seen.grade && e.grade)) drilled.set(key, e);
			}
			return [...drilled.values()].sort((a, b) => a.at - b.at);
		})(),
		/**
		 * Named explicitly, per the rule above. A genuine export writes the FULL
		 * state, so a session that predates the bench carries calibrationLog
		 * present-and-empty: exactly how cookedLog and shoppingChecks were once
		 * wiped by a bare spread.
		 *
		 * Unioned on slug|at like drillLog, because two devices' runs are
		 * different runs, not competing versions of one.
		 */
		calibrationLog: (() => {
			const done = new Map(
				(current.calibrationLog ?? []).map((e) => [`${e.slug}|${e.at}`, e])
			);
			for (const e of incoming.calibrationLog ?? []) {
				if (!e || typeof e.slug !== 'string' || typeof e.at !== 'number') continue;
				const key = `${e.slug}|${e.at}`;
				const seen = done.get(key);
				if (!seen || (!seen.grade && e.grade)) done.set(key, e);
			}
			return [...done.values()].sort((a, b) => a.at - b.at);
		})(),
		/*
		 * Screened, like every other list here.
		 *
		 * calibrationLog refuses an entry without a string slug and a numeric
		 * `at`; menuDishes refuses one without an id. This took whatever arrived
		 * and deduplicated on a `slug` it never checked existed. A record missing
		 * `flavorTags`, `diet` or `season` does not hide itself in the Library -
		 * applyFilters maps across every recipe at once, so it takes the whole
		 * grid down the moment the cook types into search or ticks Vegetarian,
		 * and it persists, so it does it again on every load. See familyRecipe.ts
		 * for the measurement.
		 */
		familyRecipes: [
			...current.familyRecipes,
			...screenFamilyRecipes(incoming.familyRecipes).kept.filter(
				(r) => !current.familyRecipes.some((e) => e.slug === r.slug)
			)
		],
		// Union by dish id, the newer edit winning, same tiebreak the other
		// wings' menu stores use. Named explicitly, per the rule above.
		menuDishes: (() => {
			const dishes = new Map((current.menuDishes ?? []).map((d) => [d.id, d]));
			for (const d of incoming.menuDishes ?? []) {
				if (!d || !d.id) continue;
				const mine = dishes.get(d.id);
				const winner = !mine || (d.ts ?? 0) > (mine.ts ?? 0) ? d : mine;
				// The Maitre d's marks, NAMED, and settled on their own stamps
				// rather than riding the winner: see mergeMaitre for why a
				// description edit must not erase a kept answer. The same line
				// stands in adoptImport, pinned by deep-pass.test.ts.
				dishes.set(d.id, withMaitre(winner, mergeMaitre(mine?.maitre, d.maitre)));
			}
			return [...dishes.values()];
		})(),
		// Per dish id, the newer costing winning whole. Merging line-by-line across
		// two sheets would invent a third sheet neither venue priced.
		// The transport copy of the same merge. ONE implementation, above in this
		// file, called from here and from adoptImport -- these two
		// have already drifted once, when the session grew an Array.isArray guard
		// the house never got.
		//
		// The old guard discarded any costing with no lines array, which would
		// silently throw away a covers-only record. mergeCostings guards on the
		// fields it merges instead.
		dishCosts: (() => {
			const out: Record<string, DishCosting> = { ...(current.dishCosts ?? {}) };
			for (const [id, costing] of Object.entries(incoming.dishCosts ?? {})) {
				const merged = mergeCostings(out[id], costing);
				if (merged) out[id] = merged;
			}
			return out;
		})(),
		/**
		 * stepActuals and planRun, named at last. This function's own rule,
		 * "every field is named explicitly, nothing is left to the spread":
		 * shipped with two fields still falling through `...incoming`: every
		 * genuine .wtjson carries stepActuals (EMPTY_SESSION always has the key,
		 * and buildExport writes the full state), so importing a colleague's
		 * file replaced the cook's observed step timings wholesale - the "usually
		 * N min elapsed here" hint on the plan row (menu/+page.svelte, the only
		 * reader of observedElapsed; it does not feed the plan's back-timed start
		 * times) - and the banner counted nothing. Same failure that erased a
		 * Path of Study, two fields along.
		 *
		 * "unions per key and keeps recordStepActual's last-12 window; newest
		 * observations win the slice" was never true and could not be:
		 * Record<string, number[]> carries no timestamp per sample, so nothing
		 * here can tell which side is actually newer. Concatenating and slicing
		 * the tail meant `incoming` always won the cap regardless - a colleague's
		 * file exported months ago and carrying a full window silently replaced
		 * every one of the cook's own observations. mergeStepWindow draws from
		 * the recent end of both arrays in turn instead, so a full incoming
		 * window can no longer wipe a full local one outright; see its own
		 * comment for why that is the honest fix rather than the real one.
		 * planRun stays LOCAL: a run is one device's live service clock, like
		 * the 86 board; importing a file exported mid-service must not install
		 * someone else's "40 minutes behind" over tonight's.
		 */
		stepActuals: (() => {
			const out: SessionState['stepActuals'] = { ...current.stepActuals };
			for (const [k, arr] of Object.entries(incoming.stepActuals ?? {})) {
				const nums = validStepActuals(arr);
				if (!nums.length) continue;
				out[k] = mergeStepWindow(out[k] ?? [], nums);
			}
			return out;
		})(),
		planRun: current.planRun,
		// After the spread, never before: a hand-edited file must not be able to
		// walk the schema marker backwards and re-trigger a migration.
		schemaVersion: current.schemaVersion,
		lastWrite: current.lastWrite
	};
}
