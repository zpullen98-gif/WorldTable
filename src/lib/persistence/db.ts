/**
 * Durable session state.
 *
 * The original persisted nothing at all: `localStorage` appears zero times in
 * its 3957 lines. Pinned menus, family notes, pantry selections and user-added
 * recipes all died on reload, and the only escape was copying a base64 blob out
 * of a textarea by hand.
 *
 * IndexedDB rather than localStorage, for two reasons that only matter later but
 * cost nothing now: family recipes are unbounded (and will eventually carry
 * photos, which localStorage cannot hold at all), and IDB writes off the main
 * thread, which matters when the notes field fires on every keystroke.
 *
 * Preferences are the deliberate exception: see stores/prefs.svelte.ts.
 */
import { get, set, del, getMany, update, createStore } from 'idb-keyval';
import { browser } from '$app/environment';
import { EMPTY_SESSION, type SessionState } from './state';
import { readSession, NewerVersionError, type HeldReason, type SessionRead } from './migrations';

export type { HeldReason, SessionRead } from './migrations';

// Re-exported so existing consumers keep one import site.
export { EMPTY_SESSION, CURRENT_VERSION } from './state';
export type { SessionState } from './state';

const store = browser ? createStore('world-table', 'state') : undefined;

/* One record per person on a shared device.
 *
 * A venue buys one subscription and its staff share a sign-in, so a kitchen
 * tablet would otherwise pool everyone's cooked marks and menus into one pile.
 * shared/oot-profiles.js keeps a roster on the device and hands back a
 * namespaced key; with nobody named it returns 'session' unchanged, so a
 * kitchen that never uses profiles is unaffected and nothing has to migrate.
 *
 * Read at call time rather than captured once, because the answer changes the
 * moment somebody else taps their name.
 *
 * The window.OOT declaration lives in src/lib/oot.d.ts: ONE declaration only.
 * A second, narrower one used to sit here; two declarations of the same
 * property do not merge into a union, they raise TS2717. */
const KEY_BASE = 'session';

export function currentKey(): string {
	return KEY();
}

function KEY(): string {
	try {
		const p = browser && window.OOT && window.OOT.profiles;
		return p ? p.key(KEY_BASE) : KEY_BASE;
	} catch {
		return KEY_BASE;
	}
}

/*
 * Records this build must not write over, by storage key.
 *
 * Module-level rather than store-level on purpose. The house store keeps its
 * `#blocked` flag only in the store, which covers a record found at hydrate
 * and nothing that lands AFTER it - a sibling tab on a newer build, or a
 * deploy between load and the next tap. The session's tab-hide listeners
 * flush unconditionally, so a guard that lives only in the store is one
 * visibilitychange away from being bypassed. saveSession below therefore
 * re-reads what is on disk inside the write transaction as well.
 */
const held = new Map<string, HeldReason>();

/** Why the current record is being refused, or null when it is ours to write. */
export function heldReason(key: string = KEY()): HeldReason | null {
	return held.get(key) ?? null;
}

/**
 * Read the current record, and say whether this build may touch it.
 *
 * What stood here caught migrate()'s refusal, snapshotted the record under
 * `corrupt.<Date.now()>`, and returned an empty session - which the next tap
 * persisted over the real record. The snapshot was written TWICE per page
 * load (session.hydrate and house.hydrate both land here from the layout
 * effect, ~10 ms apart), grew without bound, and nothing anywhere read it.
 *
 * Now a refused record is LEFT IN PLACE: once writes refuse, the untouched
 * record is its own backup, and the newer edition reads it back intact. The
 * snapshot survives only for a record no migration can process, under ONE
 * fixed key per record, written at most once per page lifetime - and named
 * for what it is. A record from a newer build is not corrupt.
 */
export async function loadSessionRecord(): Promise<SessionRead> {
	if (!browser || !store) return { state: structuredClone(EMPTY_SESSION), held: false };
	const key = KEY();
	let raw: unknown;
	try {
		raw = await get(key, store);
	} catch (err) {
		// Could not even read the store: hold, do not start clean over it.
		if (!held.has(key)) console.warn('[world-table] session store unreadable; holding', err);
		held.set(key, 'unreadable');
		return { state: structuredClone(EMPTY_SESSION), held: true, reason: 'unreadable' };
	}
	const read = readSession(raw);
	if (read.held) {
		const first = !held.has(key);
		held.set(key, read.reason);
		if (first) {
			console.warn(`[world-table] session held (${read.reason}); nothing will be written over it`);
			if (read.reason === 'unreadable') {
				try {
					await set(`unreadable::${key}`, raw, store);
				} catch {
					/* nothing more to do */
				}
			}
		}
	} else {
		held.delete(key);
	}
	return read;
}

/** The state alone, for callers that only render it. */
export async function loadSession(): Promise<SessionState> {
	return (await loadSessionRecord()).state;
}

/**
 * @param key where to write. Defaults to whoever is current, but a caller
 * holding an outgoing person's state must pass THEIR key explicitly.
 *
 * That parameter exists because profile switching fires its listeners AFTER
 * `data.current` has already moved (shared/oot-profiles.js switchTo). A store
 * flushing its pending write on that signal, without saying where, would file
 * the previous person's notes under the next person's name.
 */
export async function saveSession(state: SessionState, key?: string): Promise<boolean> {
	if (!browser || !store) return false;
	const k = key ?? KEY();
	if (held.has(k)) return false;
	try {
		/*
		 * Through update(), not set(): the refusal is decided against what is on
		 * disk AT WRITE TIME, inside the transaction. A record this build does not
		 * recognise - one that landed after we loaded - throws from the updater,
		 * idb-keyval rejects, and no put happens. One extra get per save; notes
		 * are already debounced at 400 ms.
		 */
		await update(
			k,
			(cur) => {
				const r = readSession(cur);
				if (r.held) throw new NewerVersionError(Number((cur as { schemaVersion?: unknown })?.schemaVersion) || 0);
				return { ...state, lastWrite: Date.now() };
			},
			store
		);
		return true;
	} catch (e) {
		if (e instanceof NewerVersionError) {
			held.set(k, 'newer');
			return false;
		}
		throw e;
	}
}

/**
 * Every person's session on this device, for the coverage board.
 *
 * This is possible, and I want to be exact about why, because the opposite was
 * assumed for a while: profiles.key() is `base + '::' + id`: a deterministic,
 * reconstructible string) and idb-keyval's store applies no key filter. So a
 * manager device can read the whole roster's records without switching profile.
 * shared/oot-pass.js already does this for two other wings.
 *
 * Which means "we only show coverage, not scores" is a CHOICE, not a technical
 * limit, and the page must never claim otherwise. Writing "the app cannot see
 * your answers" would be false, and the first engineer to read this file would
 * overturn the whole policy on a bad premise.
 *
 * The choice: a shared kitchen tablet's roster is there so a brigade can share
 * one device, not so a manager can read somebody's notes. This returns whole
 * records because that is what the store holds; the caller takes coverage from
 * them and nothing else.
 */
export async function loadAllSessions(
	profiles: ReadonlyArray<{ id: string; name: string; legacy?: boolean }>
): Promise<Array<{ id: string; name: string; session: SessionState; held: boolean }>> {
	if (!browser || !store) return [];
	// Standalone, or a device nobody has named: one unnamed person's record.
	if (!profiles.length) {
		const only = await loadSessionRecord();
		return [{ id: 'solo', name: 'This device', session: only.state, held: only.held }];
	}
	const keys = profiles.map((p) => (p.legacy ? KEY_BASE : `${KEY_BASE}::${p.id}`));
	let raw: unknown[];
	try {
		raw = await getMany(keys, store);
	} catch {
		return [];
	}
	return profiles.map((p, i) => {
		// One held record must not take the whole board down - and must not be
		// reported as a cook with no coverage either; the board says who is held.
		const r = readSession(raw[i]);
		return { id: p.id, name: p.name, session: r.state, held: r.held };
	});
}

export async function clearSession(): Promise<void> {
	if (!browser || !store) return;
	// A held record is not ours to clear either.
	if (held.has(KEY())) return;
	await del(KEY(), store);
}

/**
 * Trailing-edge debounce. The notes textarea fires on every keystroke; writing
 * IndexedDB per character is both wasteful and, on a slow disk, visible.
 */
export function debounce<T extends unknown[]>(fn: (...a: T) => void, ms: number) {
	let t: ReturnType<typeof setTimeout> | undefined;
	const wrapped = (...a: T) => {
		if (t) clearTimeout(t);
		t = setTimeout(() => {
			t = undefined;
			fn(...a);
		}, ms);
	};
	wrapped.flush = (...a: T) => {
		if (t) clearTimeout(t);
		t = undefined;
		fn(...a);
	};
	/**
	 * Flush ONLY if a write is pending. The tab-hide and pagehide listeners
	 * used flush(), which writes unconditionally - so every tab switch
	 * re-wrote a healthy record whether or not anything had changed, and
	 * a record the store was refusing to touch was one hide away from being
	 * written by a path that never consulted the refusal. replace() and
	 * merge() keep plain flush(): they call it precisely to write at once
	 * with no timer armed.
	 */
	wrapped.flushPending = (...a: T) => {
		if (!t) return;
		clearTimeout(t);
		t = undefined;
		fn(...a);
	};
	return wrapped;
}
