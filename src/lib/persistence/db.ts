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
import { get, set, del, getMany, createStore } from 'idb-keyval';
import { browser } from '$app/environment';
import { EMPTY_SESSION, type SessionState } from './state';
import { migrate } from './migrations';

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

export async function loadSession(): Promise<SessionState> {
	if (!browser || !store) return structuredClone(EMPTY_SESSION);
	let raw: unknown;
	try {
		raw = await get(KEY(), store);
	} catch {
		return structuredClone(EMPTY_SESSION);
	}
	if (!raw) return structuredClone(EMPTY_SESSION);

	try {
		return migrate(raw as Partial<SessionState>);
	} catch (err) {
		// Never destroy data silently. Snapshot whatever we could not read under
		// a timestamped key so it can be recovered by hand, then start clean.
		try {
			await set(`corrupt.${Date.now()}`, raw, store);
		} catch {
			/* if even that fails there is nothing more we can do */
		}
		console.error('[world-table] session unreadable, snapshotted and reset', err);
		return structuredClone(EMPTY_SESSION);
	}
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
export async function saveSession(state: SessionState, key?: string): Promise<void> {
	if (!browser || !store) return;
	await set(key ?? KEY(), { ...state, lastWrite: Date.now() }, store);
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
): Promise<Array<{ id: string; name: string; session: SessionState }>> {
	if (!browser || !store) return [];
	// Standalone, or a device nobody has named: one unnamed person's record.
	if (!profiles.length) {
		const only = await loadSession();
		return [{ id: 'solo', name: 'This device', session: only }];
	}
	const keys = profiles.map((p) => (p.legacy ? KEY_BASE : `${KEY_BASE}::${p.id}`));
	let raw: unknown[];
	try {
		raw = await getMany(keys, store);
	} catch {
		return [];
	}
	return profiles.map((p, i) => {
		let session: SessionState;
		try {
			session = raw[i] ? migrate(raw[i] as Partial<SessionState>) : structuredClone(EMPTY_SESSION);
		} catch {
			// One unreadable record must not take the whole board down.
			session = structuredClone(EMPTY_SESSION);
		}
		return { id: p.id, name: p.name, session };
	});
}

export async function clearSession(): Promise<void> {
	if (!browser || !store) return;
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
		t = setTimeout(() => fn(...a), ms);
	};
	wrapped.flush = (...a: T) => {
		if (t) clearTimeout(t);
		fn(...a);
	};
	return wrapped;
}
