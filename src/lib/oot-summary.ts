/**
 * What The Pass reads about this wing, and the one flag the shared home row
 * reads about this device.
 *
 * The session record lives in IndexedDB, which The Pass (pass/, in the
 * monorepo) cannot read synchronously and does not try to. So on EVERY save
 * the wing writes a three-number summary to localStorage beside the roster,
 * under the same per-person namespacing the session key uses:
 *
 *   world-table-summary-v1          the legacy or unnamed person
 *   world-table-summary-v1::<id>    a named profile
 *
 *   { dishesCooked: N, roundsAnswered: N, lastDay: 'YYYY-MM-DD' }
 *
 * The Pass renders it as "Dishes cooked: N · rounds: N". Contract B of the
 * Outside Of Time cross-package contracts; the reader is in pass/.
 *
 * dishesCooked is DISTINCT dishes, never log entries: cookedLog holds one
 * entry per cook, and the home band already made that mistake once (45 cooks
 * of anything at all reported the course complete). roundsAnswered is the
 * count the session keeps, drillLog.length: one entry per graded answer in
 * the lexicon quiz, the service drill and the firing drill. The menu quiz
 * grades dishes that carry no slug and keeps no log, so it dispatches the
 * round-complete event and marks the day studied but does not move this
 * number. lastDay is the LOCAL day of the latest cook or answer, because a
 * manager reading the strip at 8pm Eastern must not be told the last round
 * was tomorrow.
 *
 * The second key, `world-table-has-history-v1` = '1', is bare and
 * device-wide. shared/oot-home.js's hasHistory() reads it (contract C) so
 * that the first name typed on a device that has only ever used the Table is
 * asked "is this yours?" rather than starting an empty kitchen beside the one
 * that exists. It is set on the first save and never cleared.
 */
import type { SessionState } from './persistence/state';

export const SUMMARY_BASE = 'world-table-summary-v1';
export const HISTORY_FLAG = 'world-table-has-history-v1';

/** The bare session key, mirrored from persistence/db.ts so the suffix can be lifted off a namespaced one. */
const SESSION_BASE = 'session';

export interface TableSummary {
	dishesCooked: number;
	roundsAnswered: number;
	/** LOCAL YYYY-MM-DD of the last cook or answer; '' when there is none. */
	lastDay: string;
}

/** A Storage-shaped thing, so tests can hand in a Map and node needs no flag. */
export interface StorageLike {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

/**
 * The local calendar day. NOT toISOString().slice(0, 10): that is UTC, and
 * from 8pm Eastern it names tomorrow. shared/oot-pass.js carries the same
 * note at its own dayKey for the same reason.
 */
export function localDay(ms: number): string {
	const d = new Date(ms);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

/** Pure: the summary for a session record. */
export function summarize(state: Pick<SessionState, 'cookedLog' | 'drillLog'>): TableSummary {
	const cooked = state.cookedLog ?? [];
	const drilled = state.drillLog ?? [];
	const dishes = new Set<string>();
	let last = 0;
	for (const e of cooked) {
		dishes.add(e.slug);
		if (e.at > last) last = e.at;
	}
	for (const e of drilled) if (e.at > last) last = e.at;
	return {
		dishesCooked: dishes.size,
		roundsAnswered: drilled.length,
		lastDay: last ? localDay(last) : ''
	};
}

/**
 * The summary key for a given SESSION key.
 *
 * Derived from the session key rather than asked of OOT.profiles.key() at
 * call time, because saveSession can be writing an OUTGOING person's record
 * after the roster has already moved on (see the `key` parameter on
 * saveSession in persistence/db.ts). The two spellings agree whenever the
 * current person is the one being saved: 'session' -> bare, 'session::p-x'
 * -> 'world-table-summary-v1::p-x', which is exactly what key() returns.
 */
export function summaryKeyFor(sessionKey: string): string {
	if (sessionKey === SESSION_BASE) return SUMMARY_BASE;
	if (sessionKey.startsWith(SESSION_BASE + '::')) return SUMMARY_BASE + sessionKey.slice(SESSION_BASE.length);
	return SUMMARY_BASE;
}

function storage(): StorageLike | null {
	try {
		if (typeof localStorage === 'undefined') return null;
		return localStorage;
	} catch {
		return null;
	}
}

/**
 * Write the summary and set the history flag. Called by saveSession after a
 * successful put; never throws, because a failed localStorage write (private
 * mode on an iPad) must not turn a saved session into a reported failure.
 *
 * Returns what was written, or null when there was nowhere to write it.
 */
export function writeSummary(
	state: Pick<SessionState, 'cookedLog' | 'drillLog'>,
	sessionKey: string,
	store: StorageLike | null = storage()
): TableSummary | null {
	if (!store) return null;
	const summary = summarize(state);
	try {
		store.setItem(summaryKeyFor(sessionKey), JSON.stringify(summary));
	} catch {
		return null;
	}
	markHistory(store);
	return summary;
}

/** The device-wide flag, set once and left alone. */
export function markHistory(store: StorageLike | null = storage()): void {
	if (!store) return;
	try {
		if (store.getItem(HISTORY_FLAG) !== '1') store.setItem(HISTORY_FLAG, '1');
	} catch {
		/* private mode: the flag is a convenience, not a record */
	}
}
