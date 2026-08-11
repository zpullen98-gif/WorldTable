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

export const CURRENT_VERSION = 1;

export interface SessionState {
	schemaVersion: number;
	/** Recipe slugs — never array indices. See stores/session.svelte.ts. */
	menu: string[];
	notes: Record<string, string>;
	pantry: string[];
	/** menuHash -> checked shopping-list line ids */
	shoppingChecks: Record<string, string[]>;
	cookedLog: Array<{ slug: string; at: number }>;
	familyRecipes: Recipe[];
	lastWrite: number;
}

export const EMPTY_SESSION: SessionState = {
	schemaVersion: CURRENT_VERSION,
	menu: [],
	notes: {},
	pantry: [],
	shoppingChecks: {},
	cookedLog: [],
	familyRecipes: [],
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
	const cooked = new Map(current.cookedLog.map((e) => [e.slug, e]));
	for (const e of incoming.cookedLog ?? []) {
		// Union by slug, keeping the earliest time a dish was ever cooked.
		const seen = cooked.get(e.slug);
		if (!seen || e.at < seen.at) cooked.set(e.slug, e);
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
		// After the spread, never before: a hand-edited file must not be able to
		// walk the schema marker backwards and re-trigger a migration.
		schemaVersion: current.schemaVersion
	};
}
