/**
 * The desk inbox: how a menu read in one app reaches the other two.
 *
 * The World Table, the Sommelier's Codex and the Bartender's Ledger are served
 * from ONE origin (zpullen98-gif.github.io/table, /codex, /ledger), so they
 * share localStorage, and that is the whole transport: the World Table reads a
 * menu, writes the desk file here, and the Codex finds "9 wines from the Menu
 * Desk are waiting" the next time it opens. No server, no message, nothing
 * sent anywhere.
 *
 * AN INBOX, NOT A RECORD. This key is not in oot-profiles.js's BASES and is
 * never exported: what sits here is a draft waiting for a person, and a draft
 * that nobody has looked at in thirty days is thrown away. Nothing a person
 * has adopted lives here; the moment a wing takes its share the rows are
 * marked taken and, once every kind with rows is taken, the key is deleted.
 * A record is what the wing wrote on adopt, in its own store, and it is not
 * this module's business.
 *
 * WHY THE STORAGE IS AN ARGUMENT. Every function takes the Storage to use and
 * defaults to localStorage when the page has one, the way linkToText takes its
 * fetch: the merge, the cap, the expiry and the taken rules are then testable
 * under plain Node with a Map, and the module never imports $app/environment,
 * which the port into the two plain-JS wings could not carry. The World Table
 * calls readDeskInbox in onMount only, never during prerender, like ocrPlan().
 *
 * WHAT A REFUSAL MEANS. A browser in private mode, a full quota, or a menu too
 * big for the slot all come back as `ok: false` with a reason, and the caller
 * offers the download instead. Nothing here throws, and nothing half-writes:
 * a merge that would not fit writes nothing at all, so the wines already
 * waiting are not lost to a cocktail list that arrived after them.
 */

import {
	readDeskFile,
	WING_KINDS,
	type DeskFile,
	type DeskItem,
	type DeskUnsorted,
	type DeskWingKind
} from './desk-file';
import { foldName } from './desk-text';

export const DESK_INBOX_KEY = 'oot-menu-desk-v1';

/**
 * Thirty days, for the DRAFT only. A menu the family read on a Friday and
 * nobody sorted by the end of the month is stale by then anyway, and a stale
 * draft re-offered in perpetuity is the "9 wines waiting" chip nobody can get
 * rid of. Nothing adopted is touched: that lives in the wing's own store.
 */
export const DESK_INBOX_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * The cap, in characters of the JSON text, which is the unit setItem is
 * measured in. A read of Commander's whole page is under 40 KB; a 300-row
 * hotel list is about 90 KB; 256 KB leaves room for three apps' reads to merge
 * and is a twentieth of the origin's usual 5 MB, which the three apps share.
 * Over it, the write is refused whole and the caller offers the download.
 */
export const DESK_INBOX_CAP = 256 * 1024;

/** The three methods this module uses, so a test can pass a Map-backed one. */
export interface DeskStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
}

export type DeskWriteResult =
	| { ok: true; file: DeskFile }
	| { ok: false; reason: 'no-storage' | 'too-big' | 'refused'; said: string };

/**
 * localStorage when there is one. The typeof guard covers Node and prerender;
 * the try covers a sandboxed frame, where merely touching the property throws.
 */
function defaultStorage(): DeskStorage | null {
	try {
		if (typeof localStorage === 'undefined') return null;
		return localStorage;
	} catch {
		return null;
	}
}

/** True when a row is for the wing: its own kind, or unsure and could be. */
function isFor(item: DeskItem, kind: DeskWingKind): boolean {
	return item.kind === kind || (item.kind === 'unsure' && item.could.includes(kind));
}

/**
 * The kinds a desk file has rows for. An unsure row counts for every kind it
 * could be, so a desk of nothing but "could be wine or cocktail" is done once
 * both those rooms have looked at it.
 */
export function kindsWithItems(file: DeskFile): DeskWingKind[] {
	return WING_KINDS.filter((k) => file.items.some((i) => isFor(i, k)));
}

/**
 * The rows one wing should show: its kind, plus the unsure rows that could be
 * its kind. Empty once the wing has taken its share, because an adopted row
 * re-offered is a duplicate waiting to be made.
 */
export function deskShare(file: DeskFile, kind: DeskWingKind): DeskItem[] {
	if (file.taken?.[kind]) return [];
	return file.items.filter((i) => isFor(i, kind));
}

/** A stamp as a number, with an unreadable one counting as the oldest possible. */
function when(iso: string): number {
	const t = Date.parse(iso);
	return Number.isFinite(t) ? t : 0;
}

/**
 * Two desk files as one. Pure, so the rules can be pinned without a Storage.
 *
 * By kind and folded name: a second read of the same menu is the same dishes,
 * and "Crème Brûlée" read from a paste and "Creme Brulee" read from a
 * photograph are one row, the one from the newer read (by `source.at`). Rows
 * only one side has are kept from both.
 *
 * A kind the existing file had already handed on is REPLACED: its old rows go,
 * the incoming ones come in, and the taken mark is cleared so the wing sees
 * them again. That is what "Read it again anyway" means, and keeping the old
 * rows beside the new ones would re-offer what was already adopted.
 *
 * The newer read's source, clock, venue and notice win, with the older's venue
 * or notice kept when the newer has none.
 */
export function mergeDesk(existing: DeskFile | null, incoming: DeskFile): DeskFile {
	if (!existing) return incoming;

	const taken: Partial<Record<DeskWingKind, string>> = { ...(existing.taken ?? {}) };
	let kept = existing.items;
	for (const k of WING_KINDS) {
		if (taken[k] && incoming.items.some((i) => isFor(i, k))) {
			kept = kept.filter((i) => !isFor(i, k));
			delete taken[k];
		}
	}

	const incomingIsNewer = when(incoming.source.at) >= when(existing.source.at);
	const older = incomingIsNewer ? kept : incoming.items;
	const newer = incomingIsNewer ? incoming.items : kept;

	// Map.set on a key already present keeps its position, so the merged
	// order is the older read's order with the newer's additions after it.
	const byKey = new Map<string, DeskItem>();
	for (const item of older) byKey.set(`${item.kind}|${foldName(item.name)}`, item);
	for (const item of newer) byKey.set(`${item.kind}|${foldName(item.name)}`, item);

	const unsorted: DeskUnsorted[] = [];
	const seen = new Set<string>();
	for (const u of [...(incomingIsNewer ? existing : incoming).unsorted, ...(incomingIsNewer ? incoming : existing).unsorted]) {
		if (seen.has(u.raw)) continue;
		seen.add(u.raw);
		unsorted.push(u);
	}

	const winner = incomingIsNewer ? incoming : existing;
	const loser = incomingIsNewer ? existing : incoming;
	const merged: DeskFile = {
		format: winner.format,
		version: winner.version,
		createdAt: winner.createdAt,
		source: winner.source,
		items: [...byKey.values()],
		unsorted
	};
	const venue = winner.venue ?? loser.venue;
	if (venue) merged.venue = venue;
	const notice = winner.notice ?? loser.notice;
	if (notice) merged.notice = notice;
	if (Object.keys(taken).length) merged.taken = taken;
	return merged;
}

/**
 * What is waiting, or null. A file older than the TTL is deleted on the way
 * out: what expires is a draft, never a record.
 *
 * A stored value the validator refuses is LEFT WHERE IT IS and reported as
 * nothing: it may be what a newer build wrote (readDeskFile refuses a version
 * it does not know), and deleting it would be this build destroying that one's
 * work, the exact trap sanitizePrefs names. A refusal to read is not a licence
 * to erase.
 */
export function readDeskInbox(storage = defaultStorage(), now = Date.now()): DeskFile | null {
	if (!storage) return null;
	let raw: string | null;
	try {
		raw = storage.getItem(DESK_INBOX_KEY);
	} catch {
		return null;
	}
	if (!raw) return null;
	const file = readDeskFile(raw, now);
	if (!file) return null;
	if (now - when(file.createdAt) > DESK_INBOX_TTL_MS) {
		try {
			storage.removeItem(DESK_INBOX_KEY);
		} catch {
			/* a slot that will not clear is the same to the caller as one already empty */
		}
		return null;
	}
	return file;
}

/**
 * Puts a desk file in the inbox, merged with whatever is waiting. Refuses,
 * writing nothing, when there is no storage, when the merged file is over the
 * cap, or when the browser will not take it; `said` is the sentence for the
 * screen, and the caller's next move is the download.
 */
export function writeDeskInbox(
	file: DeskFile,
	storage = defaultStorage(),
	now = Date.now()
): DeskWriteResult {
	if (!storage) {
		return {
			ok: false,
			reason: 'no-storage',
			said: 'This browser has nowhere to keep the desk between apps. Download the desk file instead.'
		};
	}
	const merged = mergeDesk(readDeskInbox(storage, now), file);
	const json = JSON.stringify(merged);
	if (json.length > DESK_INBOX_CAP) {
		return {
			ok: false,
			reason: 'too-big',
			said: 'That is more than the desk between apps can hold. Download the desk file instead.'
		};
	}
	try {
		storage.setItem(DESK_INBOX_KEY, json);
	} catch {
		return {
			ok: false,
			reason: 'refused',
			said: 'This browser refused to keep the desk, which private browsing does. Download the desk file instead.'
		};
	}
	return { ok: true, file: merged };
}

/**
 * Stamps a wing's share as taken. Once every kind with rows is taken the key
 * is deleted: the draft has been fully sorted and there is nothing left to
 * offer anyone. Returns what remains, or null when the slot is now empty.
 */
export function markDeskTaken(
	kind: DeskWingKind,
	storage = defaultStorage(),
	now = Date.now()
): DeskFile | null {
	if (!storage) return null;
	const file = readDeskInbox(storage, now);
	if (!file) return null;
	const taken: Partial<Record<DeskWingKind, string>> = {
		...(file.taken ?? {}),
		[kind]: new Date(now).toISOString()
	};
	const done = kindsWithItems(file).every((k) => taken[k]);
	if (done) {
		clearDeskInbox(storage);
		return null;
	}
	const next: DeskFile = { ...file, taken };
	try {
		storage.setItem(DESK_INBOX_KEY, JSON.stringify(next));
	} catch {
		// The mark did not land. The share will be offered again next open,
		// which is a duplicate a person can see, where a lost mark that
		// silently succeeded would not be.
		return file;
	}
	return next;
}

export function clearDeskInbox(storage = defaultStorage()): void {
	if (!storage) return;
	try {
		storage.removeItem(DESK_INBOX_KEY);
	} catch {
		/* nothing to do: a slot that will not clear reads as empty on expiry anyway */
	}
}
