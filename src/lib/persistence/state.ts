/**
 * The persisted session's shape — in its own module, imported by BOTH db.ts and
 * migrations.ts, precisely so those two never import each other.
 *
 * They used to: db needed migrate(), migrations needed EMPTY_SESSION. That
 * cycle only worked because each side happened to touch the other's exports
 * inside function bodies rather than at module-eval time; one hoisted constant
 * later and the app would throw at import time. Depending on evaluation-order
 * luck is not a foundation; a leaf module is.
 */
import type { Recipe } from '../types';
import type { CostLine } from '../costing';

export const CURRENT_VERSION = 1;

/**
 * A dish on the venue's own menu — The Kitchen's Menu. Deliberately NOT a
 * Recipe: recipes feed the pantry matcher, search and cook mode, and a menu
 * item is a different thing (a price, a section, an allergen line — no method,
 * no timings). Own sibling field, own shape.
 */
export interface MenuDish {
	/** 'd-' + base36, minted at first save, never recomputed. */
	id: string;
	name: string;
	/** Menu section — Starters, Mains… — and the quiz's distractor category. */
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
	 * A POINTER, NOT A METHOD. "A menu item is not a Recipe" still holds — this
	 * dish carries no steps, no ingredients-with-quantities and no technique
	 * tags of its own. But one slug lets the lamb rump that goes out sixty times
	 * a week reach cook mode, the standard it is judged against and the
	 * Repertoire, instead of being a name and a price the app can do nothing with.
	 */
	recipeSlug?: string;
	price: string;
	/** Last edit, ms epoch; the import-merge tiebreak. */
	ts: number;
}

export interface SessionState {
	schemaVersion: number;
	/** Recipe slugs — never array indices. See stores/session.svelte.ts. */
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
	 * The step count is IN the key on purpose. It is constant for the 970 frozen
	 * guide recipes, so it costs them nothing; a family recipe re-authored to a
	 * different length simply mints a new key and its old observations are never
	 * read again. No special case, no stale actuals against a step that moved.
	 */
	stepActuals: Record<string, number[]>;
	/**
	 * Every cook, not every dish — one entry per time the dish was made. The
	 * timestamps drive the re-cook schedule in lib/repertoire.ts; the grade is
	 * what the plate was against the dish's standard, absent on cooks recorded
	 * before standards existed and on the 925 dishes that have none.
	 */
	cookedLog: Array<{
		slug: string;
		at: number;
		grade?: 'met' | 'close' | 'missed';
		/** Frozen mark ids that were off — see CookEntry in repertoire.ts. */
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
	/**
	 * What this person does. Chosen once, changeable, and a DEFAULT rather than
	 * a wall; it reorders what the app suggests and never hides a surface.
	 *
	 * Kept in the SESSION, which profiles.key() namespaces per person, and
	 * deliberately not in prefs (raw localStorage, device-wide, read
	 * synchronously by app.html) and not in the profile's path map (write-once,
	 * no unmark — a person who changed role would carry both stamps forever).
	 */
	role?: 'chef' | 'student' | 'server';
	lastWrite: number;
}

/**
 * One week's covers for one dish.
 *
 * `weekStart` is a LOCAL Monday as 'YYYY-MM-DD', matching the convention this
 * record already uses for `HouseRecord.prepCounts.countedOn` and for the same
 * reason: two devices in one kitchen agree on the DATE even when their
 * timezones and DST offsets do not. Epoch ms of local midnight does not survive
 * a DST boundary or a tablet whose zone changes — it mints a SECOND key for one
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
	 * and the first ingredient edit would silently drop the history — then stamp
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
	 * blank — and what a build predating `sales` can still read out of the same
	 * record. Derived, never taken from a caller: a writable `sold` beside a
	 * writable `sales` is two sources of truth for one number.
	 */
	sold?: number;
	/** Last edit, ms epoch. The import-merge tiebreak for LINES. */
	ts: number;
}

/** One service being cooked. See SessionState.planRun. */
export interface PlanRun {
	/** The pinned menu it belongs to — a different menu does not inherit it. */
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
 * night's "40 minutes behind" — so the run expires rather than being resumed
 * into a lie.
 */
export const RUN_MAX_AGE_MS = 18 * 60 * 60 * 1000;

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
	role: undefined,
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
 * with valid `sales` and no `lines` array is kept with `lines: []` — the old
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
	// never a truthiness test — 0 covers is the number a chef types precisely so
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
 * `lines` still merge WHOLE on the newer `ts`. The original rationale —
 * "merging line-by-line across two sheets would invent a third sheet neither
 * venue priced" — stays true for lines and becomes FALSE for sales, because two
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
			// identical whichever direction the file travelled — order-independence
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
	// Lines travel with the newer stamp, and the merged ts is the max — a record
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
 * Reconcile an imported session over the live one, field by field.
 *
 * Lives here as a pure function rather than inside the store because the store
 * is a .svelte.ts runes module that a unit test cannot reach — and this is
 * exactly the code that most needed a test. It shipped reconciling four of the
 * six data fields: `cookedLog` and `shoppingChecks` fell through a bare
 * `...incoming` spread, and since buildExport writes the FULL state, a genuine
 * export always carries them present-and-empty. Importing a friend's menu
 * therefore erased your entire Path of Study progress and every shopping tick,
 * irrecoverably, with the confirmation banner reporting only what it gained.
 *
 * The rule: every field is named explicitly. Nothing is left to the spread.
 */
export function mergeSessions(
	current: SessionState,
	incoming: Partial<SessionState>
): SessionState {
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
		// slug|at — silently discarding the only part worth merging.
		const richness = (x?: { grade?: unknown; off?: unknown[]; fault?: unknown }) =>
			(x?.grade ? 4 : 0) + (x?.off?.length ? 2 : 0) + (x?.fault ? 1 : 0);
		if (!seen || richness(e) > richness(seen)) cooked.set(key, e);
	}

	const shoppingChecks: SessionState['shoppingChecks'] = { ...current.shoppingChecks };
	for (const [hash, lines] of Object.entries(incoming.shoppingChecks ?? {})) {
		shoppingChecks[hash] = [...new Set([...(shoppingChecks[hash] ?? []), ...lines])];
	}

	return {
		...current,
		...incoming,
		menu: [...new Set([...current.menu, ...(incoming.menu ?? [])])],
		notes: { ...current.notes, ...(incoming.notes ?? {}) },
		pantry: [...new Set([...current.pantry, ...(incoming.pantry ?? [])])],
		shoppingChecks,
		cookedLog: [...cooked.values()].sort((a, b) => a.at - b.at),
		// The same union as cookedLog above, for the same reason: keyed on
		// slug|at so repeats survive an import, never on slug alone — that was
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
		 * present-and-empty — exactly how cookedLog and shoppingChecks were once
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
		familyRecipes: [
			...current.familyRecipes,
			...(incoming.familyRecipes ?? []).filter(
				(r) => !current.familyRecipes.some((e) => e.slug === r.slug)
			)
		],
		// Union by dish id, the newer edit winning — same tiebreak the other
		// wings' menu stores use. Named explicitly, per the rule above.
		menuDishes: (() => {
			const dishes = new Map((current.menuDishes ?? []).map((d) => [d.id, d]));
			for (const d of incoming.menuDishes ?? []) {
				if (!d || !d.id) continue;
				const mine = dishes.get(d.id);
				if (!mine || (d.ts ?? 0) > (mine.ts ?? 0)) dishes.set(d.id, d);
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
		 * "every field is named explicitly, nothing is left to the spread" —
		 * shipped with two fields still falling through `...incoming`: every
		 * genuine .wtjson carries stepActuals (EMPTY_SESSION always has the key,
		 * and buildExport writes the full state), so importing a colleague's
		 * file replaced the cook's observed step timings wholesale — the numbers
		 * every back-timed plan is built from — and the banner counted nothing.
		 * Same failure that erased a Path of Study, two fields along.
		 *
		 * stepActuals unions per key and keeps recordStepActual's last-12 window;
		 * newest observations win the slice, matching the store. planRun stays
		 * LOCAL: a run is one device's live service clock, like the 86 board —
		 * importing a file exported mid-service must not install someone else's
		 * "40 minutes behind" over tonight's.
		 */
		stepActuals: (() => {
			const out: SessionState['stepActuals'] = { ...current.stepActuals };
			for (const [k, arr] of Object.entries(incoming.stepActuals ?? {})) {
				if (!Array.isArray(arr)) continue;
				const nums = arr.filter((n) => typeof n === 'number' && Number.isFinite(n) && n > 0);
				out[k] = [...(out[k] ?? []), ...nums].slice(-12);
			}
			return out;
		})(),
		planRun: current.planRun,
		// Named explicitly, per the rule above. A genuine export writes the FULL
		// state, so an incoming session always carries role present-and-empty —
		// exactly how cookedLog and shoppingChecks were once wiped. Yours wins
		// unless you have never set one.
		role: current.role ?? incoming.role,
		// After the spread, never before: a hand-edited file must not be able to
		// walk the schema marker backwards and re-trigger a migration.
		schemaVersion: current.schemaVersion
	};
}
