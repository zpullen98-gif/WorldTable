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
import { get, set, del, update, keys, createStore } from 'idb-keyval';
import { browser } from '$app/environment';
import { EMPTY_SESSION, type SessionState } from './state';
import { readSession, NewerVersionError, type HeldReason, type SessionRead } from './migrations';
import { writeSummary } from '../oot-summary';

export type { HeldReason, SessionRead } from './migrations';

// Re-exported so existing consumers keep one import site.
export { EMPTY_SESSION, CURRENT_VERSION } from './state';
export type { SessionState } from './state';

const store = browser ? createStore('world-table', 'state') : undefined;

/* ONE RECORD PER DEVICE.
 *
 * This kitchen belongs to whoever is holding the device. It asked for a name
 * once, so that a venue sharing one sign-in could tell two cooks apart, and
 * that has been taken out: the app is personal now.
 *
 * The way back, when a venue edition returns, is to ask the shared layer for
 * the key again, which is what this used to be:
 *
 *     const p = browser && window.OOT && window.OOT.profiles;
 *     return p ? p.key(KEY_BASE) : KEY_BASE;
 *
 * It has to go back in step with shared/oot-profiles.js PERSONAL, not on its
 * own: a wing that namespaces while the others do not is how one person ends
 * up reading another person's kitchen.
 *
 * The window.OOT declaration lives in src/lib/oot.d.ts: ONE declaration only.
 * A second, narrower one used to sit here; two declarations of the same
 * property do not merge into a union, they raise TS2717. */
const KEY_BASE = 'session';

export function currentKey(): string {
	return KEY();
}

function KEY(): string {
	return KEY_BASE;
}

/**
 * The first name typed on a Table-only device keeps the kitchen.
 *
 * shared/oot-home.js decides whether the first profile on a device ADOPTS the
 * bare keys by asking hasHistory(), which reads a fixed list of localStorage
 * keys. This wing keeps its record in IndexedDB, so until the
 * `world-table-has-history-v1` flag existed (written on save, see
 * lib/oot-summary.ts) a device that had only ever cooked from the Table looked
 * empty to that check. The first name typed got a plain, namespaced profile
 * and an empty `session::<id>` beside months of work under bare `session`,
 * with nothing left that could ever read it.
 *
 * So: a named, non-legacy profile whose own record does not exist, on a device
 * whose bare record does and has never been claimed, is handed a COPY of the
 * bare record once, and the device remembers that it was claimed. Copy, not
 * move: the bare record stays where an unnamed or legacy reader expects it.
 *
 * Refused when the roster already holds a legacy profile. That person IS the
 * bare record's owner, and handing their kitchen to the next name typed would
 * be the exact confusion profiles exist to prevent.
 */
export const CLAIMED_FLAG = 'world-table-session-claimed-v1';

function claimAllowed(key: string): boolean {
	if (key === KEY_BASE) return false;
	try {
		if (localStorage.getItem(CLAIMED_FLAG) === '1') return false;
		const p = window.OOT && window.OOT.profiles;
		if (p && p.list().some((x) => x.legacy)) return false;
		return true;
	} catch {
		return false;
	}
}

async function claimBare(key: string): Promise<unknown> {
	if (!store || !claimAllowed(key)) return undefined;
	let bare: unknown;
	try {
		bare = await get(KEY_BASE, store);
	} catch {
		return undefined;
	}
	if (bare === undefined) return undefined;
	// Only a record this build can read is worth copying; a held one is left
	// exactly where it is, for the edition that can.
	if (readSession(bare).held) return undefined;
	try {
		await set(key, bare, store);
		localStorage.setItem(CLAIMED_FLAG, '1');
	} catch {
		return undefined;
	}
	return bare;
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
/**
 * The kitchen comes back to the device, once.
 *
 * A record written while this wing namespaced by profile sits at
 * `session::<id>` and nothing reads it any more. Three cases, and the first
 * is the one that matters:
 *
 *   1. CLAIMED_FLAG is set and there is exactly one named record. The flag is
 *      claimBare saying it copied the bare record onto that name, so the bare
 *      record is an ANCESTOR of the named one and everything since has gone to
 *      the name. Copying the named record over the bare one is a fast forward,
 *      not a merge, and it is the only branch that saves a real kitchen from
 *      being silently rolled back months.
 *   2. There is no bare record and exactly one named record: it is plainly
 *      this device's, so it comes across.
 *   3. There is a bare record and no flag: leave it. It belongs to a legacy
 *      profile, or to the device before names existed, and handing it away is
 *      what profiles existed to prevent.
 *
 * Two or more named records: nothing is copied and nothing is spent, because
 * merging two kitchens invents a service neither cook worked.
 * strandedSessions() lists them and adoptStranded() takes one on request.
 *
 * Never deletes, never merges, and never copies a record this build cannot
 * read: a held record is left exactly where the edition that can read it will
 * find it.
 */
export const DENAMED_FLAG = 'world-table-denamed-v1';

function namedKeys(all: IDBValidKey[]): string[] {
	return all
		.filter((k): k is string => typeof k === 'string')
		.filter((k) => k.startsWith(KEY_BASE + '::'));
}

async function denameSession(): Promise<void> {
	try {
		if (!store) return;
		if (localStorage.getItem(DENAMED_FLAG) === '1') return;
		const named = namedKeys(await keys(store));
		if (named.length > 1) {
			// Said out loud once, because the alternative is a device that looks
			// empty with two kitchens sitting on it and nothing anywhere saying so.
			// Nothing is deleted; adoptStranded(key) takes one when somebody asks.
			console.warn(
				'[world-table] more than one kitchen is stored under a name on this device, so ' +
					'none has been taken automatically: ' + named.join(', ')
			);
			return;
		}
		if (named.length !== 1) return;          // nobody named anything here
		const claimed = localStorage.getItem(CLAIMED_FLAG) === '1';
		const bare = await get(KEY_BASE, store);
		if (bare !== undefined && !claimed) return;   // case 3
		const rec = await get(named[0], store);
		if (rec === undefined) return;
		if (readSession(rec).held) return;            // not ours to move
		await set(KEY_BASE, rec, store);              // copy, never move
		localStorage.setItem(DENAMED_FLAG, '1');
	} catch {
		/* A migration that cannot run must never take the boot down with it. */
	}
}

/*
 * The memo dedupes CONCURRENT callers and nothing more: it is cleared when the
 * run settles, so a later load tries again. Idempotence is the flag's job, not
 * the memo's, and the flag is only spent when something was actually moved.
 * A device that is being held, because two kitchens are stored under names on
 * it, therefore gets another chance every load rather than one chance ever.
 */
let denaming: Promise<void> | null = null;
function ensureDenamed(): Promise<void> {
	try {
		if (localStorage.getItem(DENAMED_FLAG) === '1') return Promise.resolve();
	} catch {
		/* no localStorage: fall through and let denameSession decide */
	}
	if (!denaming) {
		denaming = denameSession().finally(() => {
			denaming = null;
		});
	}
	return denaming;
}

/** What is still stored under a name, for a device that had more than one. */
export async function strandedSessions(): Promise<string[]> {
	if (!browser || !store) return [];
	try {
		return namedKeys(await keys(store));
	} catch {
		return [];
	}
}

/** Take one of them onto this device, keeping what it displaces. */
export async function adoptStranded(key: string): Promise<boolean> {
	if (!browser || !store) return false;
	try {
		if (!key.startsWith(KEY_BASE + '::')) return false;
		const rec = await get(key, store);
		if (rec === undefined || readSession(rec).held) return false;
		const bare = await get(KEY_BASE, store);
		if (bare !== undefined) await set(`displaced::${KEY_BASE}`, bare, store);
		await set(KEY_BASE, rec, store);
		localStorage.setItem(DENAMED_FLAG, '1');
		return true;
	} catch {
		return false;
	}
}
export async function loadSessionRecord(): Promise<SessionRead> {
	if (!browser || !store) return { state: structuredClone(EMPTY_SESSION), held: false };
	// Before the first read, and before any entry point, including the
	// prerendered shell. Gating this on a missing bare record would skip the
	// one device that needs it most: see denameSession.
	await ensureDenamed();
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
	// claimBare stays for the venue edition; it cannot fire while KEY() is
	// plain, because claimAllowed refuses the bare key outright.
	if (raw === undefined) raw = await claimBare(key);
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
		/*
		 * The Pass's summary and the device's history flag, on every successful
		 * save and under the key that was actually written to, never the one the
		 * roster currently names (they differ mid-switch; see `key` above).
		 * writeSummary never throws: a localStorage failure is not a failed
		 * session write and must not be reported as one.
		 */
		writeSummary(state, k);
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
	/*
	 * Read PER KEY, not via getMany. getMany's Promise.all rejects the WHOLE
	 * batch on a single bad key (idb-keyval@6.3.0: getMany is
	 * `Promise.all(keys.map(k => promisifyRequest(store.get(k))))`, one
	 * readonly transaction), so one sibling roster record that fails to
	 * deserialize - or a transaction abort between two reads - used to make
	 * this function return `[]` outright: the whole board, not just the one
	 * bad record, reported "nobody has cooked here" - the exact violation of
	 * the comment two lines below, which this used to contradict rather than
	 * implement. Reading one key at a time means a single failure is exactly
	 * as contained as it already was for a MALFORMED record (readSession's
	 * own held/'unreadable' path); it costs nothing extra on the happy path,
	 * since idb-keyval's individual gets share the same underlying store.
	 */
	return Promise.all(
		profiles.map(async (p) => {
			const key = p.legacy ? KEY_BASE : `${KEY_BASE}::${p.id}`;
			let raw: unknown;
			try {
				raw = await get(key, store);
			} catch {
				// One held record must not take the whole board down - and must
				// not be reported as a cook with no coverage either; the board
				// says who is held.
				return { id: p.id, name: p.name, session: structuredClone(EMPTY_SESSION), held: true };
			}
			const r = readSession(raw);
			return { id: p.id, name: p.name, session: r.state, held: r.held };
		})
	);
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
