/**
 * The persisted session's shape — in its own module, imported by BOTH db.ts and
 * migrations.ts, precisely so those two never import each other.
 *
 * They used to: db needed migrate(), migrations needed EMPTY_SESSION. That
 * cycle only worked because each side happened to touch the other's exports
 * inside function bodies rather than at module-eval time — one hoisted constant
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
	 * Every cook, not every dish — one entry per time the dish was made. The
	 * timestamps drive the re-cook schedule in lib/repertoire.ts; the grade is
	 * what the plate was against the dish's standard, absent on cooks recorded
	 * before standards existed and on the 925 dishes that have none.
	 */
	cookedLog: Array<{ slug: string; at: number; grade?: 'met' | 'close' | 'missed' }>;
	familyRecipes: Recipe[];
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
	 * a wall — it reorders what the app suggests and never hides a surface.
	 *
	 * Kept in the SESSION, which profiles.key() namespaces per person, and
	 * deliberately not in prefs (raw localStorage, device-wide, read
	 * synchronously by app.html) and not in the profile's path map (write-once,
	 * no unmark — a person who changed role would carry both stamps forever).
	 */
	role?: 'chef' | 'student' | 'server';
	lastWrite: number;
}

export interface DishCosting {
	lines: CostLine[];
	/** Covers sold in the period — menu engineering's popularity axis. */
	sold?: number;
	/** Last edit, ms epoch. The import-merge tiebreak. */
	ts: number;
}

export const EMPTY_SESSION: SessionState = {
	schemaVersion: CURRENT_VERSION,
	menu: [],
	notes: {},
	pantry: [],
	shoppingChecks: {},
	cookedLog: [],
	familyRecipes: [],
	menuDishes: [],
	dishCosts: {},
	role: undefined,
	lastWrite: 0
};

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
	// the scheduler you last made the dish months before you did — importing a
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
		if (!seen || (!seen.grade && e.grade)) cooked.set(key, e);
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
		dishCosts: (() => {
			const out: Record<string, DishCosting> = { ...(current.dishCosts ?? {}) };
			for (const [id, costing] of Object.entries(incoming.dishCosts ?? {})) {
				if (!costing || !Array.isArray(costing.lines)) continue;
				const mine = out[id];
				if (!mine || (costing.ts ?? 0) > (mine.ts ?? 0)) out[id] = costing;
			}
			return out;
		})(),
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
