/**
 * "I have read this": which Cuisine entries a reader has marked read.
 *
 * One slot per device, `oot-cuisine-read-table-v1`, a JSON list of entry ids
 * (the build's cz- ids, which survive a slug or chapter change). Like the
 * chosen level's slot it is a reader's convenience: not in oot-profiles.js
 * BASES, never exported, never in a backup, and read nowhere before the
 * browser has mounted (there is no localStorage in the prerender pass).
 *
 * Every function takes its Storage as an argument, so the rules are tested
 * under Node with a Map (the desk-inbox.ts rule); a storage that throws (a
 * private window, a blocked site) reads as nothing marked and drops a write.
 */

export const READ_KEY = 'oot-cuisine-read-table-v1';

/** The smallest part of Storage used here. */
export interface ReadStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

const ID_RE = /^cz-[0-9a-z]{8}$/;

/** The ids marked read, or an empty set when the slot is missing, unreadable or malformed. */
export function readRead(storage: ReadStorage | null | undefined): Set<string> {
	if (!storage) return new Set();
	try {
		const raw = storage.getItem(READ_KEY);
		if (!raw) return new Set();
		const list = JSON.parse(raw);
		return new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string' && ID_RE.test(x)) : []);
	} catch {
		return new Set();
	}
}

/** Write the set back, sorted so the slot is stable. False when the write could not happen. */
export function writeRead(storage: ReadStorage | null | undefined, ids: ReadonlySet<string>): boolean {
	if (!storage) return false;
	try {
		storage.setItem(READ_KEY, JSON.stringify([...ids].sort()));
		return true;
	} catch {
		return false;
	}
}

/**
 * Mark or unmark one entry on the set the page holds, write it, and return the
 * new set: the page keeps it for this visit even when the write fails.
 */
export function setRead(storage: ReadStorage | null | undefined, current: ReadonlySet<string>, id: string, read: boolean): Set<string> {
	const ids = new Set(current);
	if (read) ids.add(id);
	else ids.delete(id);
	writeRead(storage, ids);
	return ids;
}

/** The browser's localStorage, or null on the server and where touching it throws. */
export function deviceStorage(): ReadStorage | null {
	try {
		return typeof window === 'undefined' ? null : window.localStorage;
	} catch {
		return null;
	}
}
