/**
 * The house drill log: what a person answered in the House's offline drills
 * on this device, and nothing more.
 *
 * ONE SLOT, NEVER EXPORTED. The log lives in localStorage under
 * HOUSE_DRILLED_KEY as a flat list of { k, v, at }, where k is
 * `house:<houseId>:<itemId>:<kind>`, v is the verdict and at is the clock.
 * It rides in no session export (portable.ts never reads localStorage), in
 * no pack (house-pack.ts reads the House alone) and in no desk file, and it
 * is not in oot-profiles.js's BASES, so a profile import never writes it. A
 * drill over a house is practice on this device, not a record of a person;
 * the e2e proves the .wtjson carries none of it.
 *
 * NOTHING HERE TOUCHES A LEVEL. The four levels read repertoire.ts over the
 * session's cookedLog and drillLog; this slot is read by nobody but the
 * drill page, which prints a count. A house drill never counts toward a
 * level, a rank, a readiness figure or an exam, which is why this is its
 * own slot and not a new kind of drillLog entry.
 *
 * THE CAP. Two thousand entries, newest kept: a busy server answering
 * fifty a night fills it in six weeks and the oldest answers fall off the
 * end. The cap is applied on every write, after the append, so the slot can
 * never hold more than HOUSE_DRILLED_CAP whatever it held before.
 *
 * WHY THE STORAGE IS AN ARGUMENT. Every function takes the Storage to use
 * and defaults to localStorage when the page has one, the way desk-inbox.ts
 * takes its Storage: the cap, the order and the shape are then testable
 * under plain Node with a Map, and nothing here throws. A private window, a
 * full quota or an unreadable slot comes back as ok: false with a reason,
 * and the round goes on; the slot is a convenience, never the truth.
 */

export const HOUSE_DRILLED_KEY = 'oot-house-drilled-v1';
export const HOUSE_DRILLED_CAP = 2000;

/**
 * What an answer came to: right or not for a pick or a card, and for Say it
 * back and Guest at the table the grader's middle word as well, close.
 */
export type DrillVerdict = 'met' | 'close' | 'missed';

export interface DrilledEntry {
	/** `house:<houseId>:<itemId>:<kind>` */
	k: string;
	v: DrillVerdict;
	at: number;
}

/** The slice of Storage the slot needs, so a Map-backed stand-in serves a test. */
export interface SlotStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
}

export interface DrilledWrite {
	ok: boolean;
	reason?: string;
	/** How many entries the slot holds after the write. */
	count: number;
}

/** The key a drill records under: the house, the item and the kind, colon separated, each part trimmed. */
export function drilledKey(houseId: string, itemId: string, kind: string): string {
	return 'house:' + String(houseId).trim() + ':' + String(itemId).trim() + ':' + String(kind).trim();
}

/** The page's localStorage when it has one, else undefined: a hardened browser can throw on the access itself. */
function pageStorage(): SlotStorage | undefined {
	try {
		if (typeof localStorage === 'undefined') return undefined;
		return localStorage;
	} catch {
		return undefined;
	}
}

function isEntry(v: unknown): v is DrilledEntry {
	if (!v || typeof v !== 'object') return false;
	const e = v as Record<string, unknown>;
	return (
		typeof e.k === 'string' &&
		e.k.startsWith('house:') &&
		(e.v === 'met' || e.v === 'close' || e.v === 'missed') &&
		typeof e.at === 'number' &&
		Number.isFinite(e.at)
	);
}

/** Every entry the slot holds, oldest first; an unreadable or malformed slot reads as empty, and a bad row is dropped rather than the lot. */
export function readDrilled(storage: SlotStorage | undefined = pageStorage()): DrilledEntry[] {
	if (!storage) return [];
	try {
		const raw = storage.getItem(HOUSE_DRILLED_KEY);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter(isEntry);
	} catch {
		return [];
	}
}

/**
 * One answer appended under its key, the slot trimmed to the cap with the
 * newest kept. The key must be a drilledKey (four colon-separated parts
 * with the `house:` head) or the write is refused in words.
 */
export function markDrilled(
	key: string,
	verdict: DrillVerdict,
	storage: SlotStorage | undefined = pageStorage(),
	now: number = Date.now()
): DrilledWrite {
	if (!storage) return { ok: false, reason: 'no storage on this page', count: 0 };
	if (typeof key !== 'string' || !/^house:[^:]+:[^:]+:[^:]+$/.test(key)) {
		return { ok: false, reason: 'not a house drill key', count: readDrilled(storage).length };
	}
	if (verdict !== 'met' && verdict !== 'close' && verdict !== 'missed') {
		return { ok: false, reason: 'not a verdict', count: readDrilled(storage).length };
	}
	const list = readDrilled(storage);
	list.push({ k: key, v: verdict, at: now });
	const kept = list.length > HOUSE_DRILLED_CAP ? list.slice(list.length - HOUSE_DRILLED_CAP) : list;
	try {
		storage.setItem(HOUSE_DRILLED_KEY, JSON.stringify(kept));
		return { ok: true, count: kept.length };
	} catch {
		return { ok: false, reason: 'the slot refused the write', count: list.length - 1 };
	}
}

/** How many entries the slot holds for one house: the count the drill page prints. */
export function drilledCount(houseId: string, storage: SlotStorage | undefined = pageStorage()): number {
	const head = 'house:' + String(houseId).trim() + ':';
	let n = 0;
	for (const e of readDrilled(storage)) if (e.k.startsWith(head)) n++;
	return n;
}

/** The slot emptied; for a person clearing their own practice, never called by a round. */
export function clearDrilled(storage: SlotStorage | undefined = pageStorage()): boolean {
	if (!storage) return false;
	try {
		storage.removeItem(HOUSE_DRILLED_KEY);
		return true;
	} catch {
		return false;
	}
}
