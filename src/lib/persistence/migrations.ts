/**
 * Schema migrations. Append-only: never edit a migration that has shipped, or
 * you change the meaning of data already sitting on someone's disk.
 */
import { CURRENT_VERSION, EMPTY_SESSION, type SessionState } from './state';

type Migration = (state: Record<string, unknown>) => Record<string, unknown>;

/** Index N upgrades version N -> N+1. */
const MIGRATIONS: Migration[] = [
	// 0 -> 1: the shape written by the very first build. Nothing to change yet;
	// the entry exists so version 0 blobs are recognised rather than rejected.
	(s) => ({ ...s, schemaVersion: 1 })
];

export function migrate(raw: Partial<SessionState>): SessionState {
	let version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;

	if (version > CURRENT_VERSION) {
		// Written by a newer build. Refuse rather than guess, and critically,
		// refuse without overwriting, so downgrading and upgrading again is safe.
		throw new Error(
			`session was written by a newer version (v${version} > v${CURRENT_VERSION})`
		);
	}

	let state = raw as Record<string, unknown>;
	while (version < CURRENT_VERSION) {
		state = MIGRATIONS[version](state);
		version++;
	}

	// Merge over defaults so a field added in a later build is present even in a
	// session that predates it.
	return { ...structuredClone(EMPTY_SESSION), ...(state as Partial<SessionState>), schemaVersion: CURRENT_VERSION };
}

/**
 * The legacy importer for the original app's "session code".
 *
 * That was `btoa(JSON.stringify({menu, notes, pantry, fam, day, hemi}))` behind a
 * `WT1.` prefix (L3501), with menu and notes keyed by ARRAY INDEX into the recipe
 * list. Indices are exactly why this format had to die: adding a single family
 * recipe pushed onto the array and silently repointed every saved reference. So
 * the import resolves indices through the recipe order they were written
 * against, and reports anything it cannot place instead of dropping it.
 */
export interface LegacyImport {
	state: Partial<SessionState>;
	unresolved: string[];
}

export function importLegacyCode(
	code: string,
	orderedSlugs: string[],
	pantryLabels: Set<string>
): LegacyImport {
	const trimmed = code.trim();
	if (!trimmed.startsWith('WT1.')) throw new Error('Not a WT1 session code');

	let payload: {
		menu?: number[];
		notes?: Record<string, string>;
		pantry?: string[];
		fam?: unknown[];
		hemi?: string;
	};
	try {
		payload = JSON.parse(atob(trimmed.slice(4)));
	} catch {
		throw new Error('Session code is not readable: it may have been truncated in transit');
	}

	const unresolved: string[] = [];
	const at = (i: number) => {
		const slug = orderedSlugs[i];
		if (!slug) unresolved.push(`recipe #${i}`);
		return slug;
	};

	const menu = (payload.menu ?? []).map(at).filter((s): s is string => Boolean(s));

	const notes: Record<string, string> = {};
	for (const [k, v] of Object.entries(payload.notes ?? {})) {
		const slug = at(Number(k));
		if (slug) notes[slug] = v;
	}

	const pantry = (payload.pantry ?? []).filter((l) => {
		if (pantryLabels.has(l)) return true;
		unresolved.push(`pantry “${l}”`);
		return false;
	});

	return { state: { menu, notes, pantry }, unresolved };
}
