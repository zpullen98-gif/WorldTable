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
