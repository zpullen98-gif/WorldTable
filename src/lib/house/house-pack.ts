/**
 * house-pack.ts: the pack file, the one way a House travels between devices.
 *
 * Every comment in this file ships inside the ported static/shared/oot-house.js
 * (tools/port-house.mjs transpiles with comments kept, and its assertClean
 * refuses any dash spelling, a carriage return and a regex literal outside
 * ASCII), so the comments here are dash-free and every regex is ASCII.
 *
 * PURE AND PORTABLE. No import from outside src/lib/house, no DOM, no
 * Svelte, no Node; the storage, the clock and the random source are
 * arguments. The port joins this module with the other house modules in
 * one IIFE, so no top-level name here repeats one declared in any of them.
 *
 * THE PACK IS THE TRANSPORT. A house never rides in oot-profiles.js BASES,
 * a desk file or a .wtjson; it leaves a device as a pack and arrives as one.
 * A pack imports with no key, so the Brennan's pack and a person's own
 * export go through one door, and that door is readPack: parse, refuse a
 * wrong format or a version this app does not know, normalise (every key
 * the schema does not name dropped, allergens above all), validate, and
 * never write. What readPack returns is a house in the shape and the list
 * of what the validator saw; whether a flagged line stops the import is the
 * screen's decision, not this file's, because a person's own kept line over
 * its word cap is still theirs.
 *
 * A PACK NEVER OVERWRITES A HOUSE SILENTLY. A pack whose house id is not on
 * the device is added as a new house; it becomes current only when the
 * device has no current house (no index, or an index whose current is
 * null, as after the last house was removed), or when the only house on it
 * is a hand house with nothing in it. A pack whose id IS on the device is
 * added under a fresh id ("Add as a new house", the items keeping theirs)
 * or merged into the house it names ("Merge into"), which ends on a count.
 * "On the device" means deviceIds (house-store.ts): the index's houses and
 * any record the index does not list, so a record a save left unlisted is
 * never written over either. The index write an import makes is a person's
 * act, the second of the two that may create an index (mintHouse in
 * house-store.ts is the first).
 */
import { BUILD_STEPS, HOUSE_LISTS, ID_PREFIXES, MARK_FIELDS, houseRows, isMark, isNote, mintId, optionalList } from './house-schema';
import type { BuildStep, House, HouseIndex, HouseStub, Mark } from './house-schema';
import { normaliseHouse } from './house-normalise';
import type { NormaliseReport } from './house-normalise';
import { validateHouse } from './house-validate';
import type { Problem } from './house-validate';
import { EDITION_NOTE_SPREAD, lastTouch, mergeHouse, mergeKept, mergeSources, pickMark, sameJson } from './house-merge';
import type { MergeCounts } from './house-merge';
import { deviceIds, loadHouse, putHouse, readIndex, saveHouse, storeSaid, writeIndex } from './house-store';
import type { HouseStorage } from './house-store';

/* -------------------------------------------------------------------------
 * The file
 * ---------------------------------------------------------------------- */

export const PACK_FORMAT = 'oot-house-pack';
export const PACK_VERSION = 1;

/** The app that wrote the pack. */
export type PackFrom = 'table' | 'ledger' | 'codex' | 'tools';

export interface PackFile {
	format: typeof PACK_FORMAT;
	version: typeof PACK_VERSION;
	exportedAt: string;
	app: { from: PackFrom };
	house: House;
}

/** The pack for a house, stamped with the clock and the app it left. */
export function buildPack(house: House, from: PackFrom, now: number = Date.now()): PackFile {
	return { format: PACK_FORMAT, version: PACK_VERSION, exportedAt: new Date(now).toISOString(), app: { from }, house };
}

/** A name as a file slug: accents off, lower case, runs of anything else as one hyphen, 'house' when nothing is left. */
export function packSlug(name: string): string {
	const slug = String(name == null ? '' : name)
		.normalize('NFD')
		.replace(/[\u0300-\u036F]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);
	return slug || 'house';
}

/** The file name a pack is saved under: house, the slug, the date, and the .oothouse.json ending every importer sniffs. */
export function packFilename(house: House, now: number = Date.now()): string {
	return 'house-' + packSlug(house.name) + '-' + new Date(now).toISOString().slice(0, 10) + '.oothouse.json';
}

/* -------------------------------------------------------------------------
 * Reading
 * ---------------------------------------------------------------------- */

/**
 * What a read comes back with: the house in the shape, the normaliser's
 * report, the validator's problems with the fatal count, and the pack's
 * own stamp; or the one sentence that says why the file is not a pack.
 */
export type ReadPack =
	| { ok: true; house: House; report: NormaliseReport[]; problems: Problem[]; fatalCount: number; exportedAt: string; from: string }
	| { ok: false; said: string };

/** A string off a raw record, or ''. Named apart from the normaliser's coercions: the port keeps every module in one scope. */
function packString(v: unknown): string {
	return typeof v === 'string' ? v : '';
}

/**
 * A pack read: the text parsed (an object already parsed is taken as it
 * is), the format and version checked, the house normalised and validated.
 * Writes nothing, whatever it finds. A version above PACK_VERSION is a pack
 * from a newer app and is refused rather than read half; the fatal list
 * and the random source are passed through for the build pipeline.
 */
export function readPack(text: unknown, opts: { rand?: () => number; fatal?: readonly string[] } = {}): ReadPack {
	let raw: unknown = text;
	if (typeof text === 'string') {
		try {
			raw = JSON.parse(text);
		} catch {
			return { ok: false, said: 'That file is not a house pack: it does not read as JSON.' };
		}
	}
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, said: 'That file is not a house pack.' };
	const r = raw as Record<string, unknown>;
	if (r.format !== PACK_FORMAT) {
		return { ok: false, said: 'That file is not a house pack: its format reads "' + packString(r.format) + '".' };
	}
	const version = typeof r.version === 'number' && Number.isFinite(r.version) ? r.version : 0;
	if (version < 1) return { ok: false, said: 'That pack carries no version this app knows.' };
	if (version > PACK_VERSION) {
		return { ok: false, said: 'That pack was written by a newer app (version ' + version + '). Update this app and import it again.' };
	}
	if (!r.house || typeof r.house !== 'object' || Array.isArray(r.house)) return { ok: false, said: 'That pack carries no house.' };
	const { house, report } = normaliseHouse(r.house, { rand: opts.rand });
	if (!house.name.trim()) return { ok: false, said: 'That pack names no house.' };
	const { problems, fatalCount } = validateHouse(house, { fatal: opts.fatal });
	const app = r.app && typeof r.app === 'object' && !Array.isArray(r.app) ? (r.app as Record<string, unknown>) : {};
	return { ok: true, house, report, problems, fatalCount, exportedAt: packString(r.exportedAt), from: packString(app.from) };
}

/* -------------------------------------------------------------------------
 * Importing
 * ---------------------------------------------------------------------- */

/** Add as a new house (the default), or merge into a house already on the device (`into`, or the pack's own id). */
export interface ImportChoice {
	mode: 'new' | 'merge';
	into?: string;
}

/**
 * What an import comes back with: the id now on the device, whether it is
 * the current house, the merge counts when it was a merge, the validator's
 * problems for the screen, and the sentence the screen ends on.
 */
export type ImportResult =
	| { ok: true; added: string; current: boolean; counts?: MergeCounts; problems: Problem[]; said: string }
	| { ok: false; said: string };

/** The house under a fresh id, every item re-stamped with it; the items keep their own ids, so a drill record follows them. */
export function restampHouse(house: House, id: string): House {
	return {
		...house,
		id,
		dishes: house.dishes.map((d) => ({ ...d, house: id })),
		wines: house.wines.map((w) => ({ ...w, house: id })),
		cocktails: house.cocktails.map((c) => ({ ...c, house: id }))
	};
}

/** How many records the eleven lists hold between them; an absent list counts none. */
export function countItems(house: House): number {
	let n = 0;
	for (const list of HOUSE_LISTS) n += houseRows(house, list).length;
	return n;
}

/**
 * The rule for the current pointer on an import: a new house becomes
 * current when the device has no current house (no index at all, or an
 * index pointing at none, which is what the last removal leaves and what
 * mintHouse takes the same way), or when its only house is a hand house
 * with nothing in it (the implicit "My house" a person minted a moment ago
 * and never filled). Otherwise it is listed behind the current house and
 * the screen offers "Open it now?".
 */
export async function packBecomesCurrent(storage: HouseStorage, index: HouseIndex | null): Promise<boolean> {
	if (!index || index.current === null) return true;
	if (index.list.length !== 1) return false;
	const only = index.list[0];
	if (only.began !== 'hand') return false;
	const house = await loadHouse(storage, only.id);
	return !house || countItems(house) === 0;
}

/** The sentence a merge ends on, from its counts. */
export function mergeSaid(name: string, counts: MergeCounts): string {
	const parts = [
		counts.added + (counts.added === 1 ? ' item added' : ' items added'),
		counts.updated + ' updated',
		counts.keptMine + ' of yours kept because newer'
	];
	if (counts.removed) parts.push(counts.removed + ' removed');
	return name + ' merged: ' + parts.join(', ') + '.';
}

/**
 * A pack onto the device, by the person's choice. The pack goes through
 * readPack first, so an unreadable pack is refused before anything is
 * touched. Then one of three paths: merge into a house on the device
 * (mergeHouse, saved, the counts in the sentence); add under a fresh id
 * when the pack's id is already here and the choice is 'new'; or add as it
 * is. An add writes the record, then the index (made when the device had
 * none, this being a person's act); a refused index write takes the record
 * back out. The merge target is `into` when given, else the pack's id.
 */
export async function importPack(
	storage: HouseStorage,
	pack: unknown,
	choice: ImportChoice,
	now: number,
	rand: () => number = Math.random
): Promise<ImportResult> {
	const read = readPack(pack, { rand });
	if (!read.ok) return read;
	let house = read.house;
	const onDevice = new Set<string>(await deviceIds(storage));
	const index = readIndex(storage);
	const into = choice.mode === 'merge' ? choice.into || house.id : '';

	if (into && onDevice.has(into)) {
		const mine = await loadHouse(storage, into);
		if (!mine) return { ok: false, said: 'The house to merge into could not be read from this device.' };
		const merged = mergeHouse(mine, house);
		const saved = await saveHouse(storage, merged.house, now);
		if (!saved.ok) return { ok: false, said: saved.said };
		return {
			ok: true,
			added: into,
			current: !!index && index.current === into,
			counts: merged.counts,
			problems: read.problems,
			said: mergeSaid(mine.name, merged.counts)
		};
	}
	if (into) return { ok: false, said: 'There is no house on this device to merge into.' };

	if (onDevice.has(house.id)) house = restampHouse(house, mintId(ID_PREFIXES.house, onDevice, rand));
	const becomesCurrent = await packBecomesCurrent(storage, index);
	const saved = await putHouse(storage, house, now);
	if (!saved.ok) return { ok: false, said: saved.said };
	const stub: HouseStub = { id: house.id, name: house.name, ts: now, bytes: saved.bytes, began: house.began };
	const list = index ? [...index.list, stub] : [stub];
	const current = becomesCurrent ? house.id : index ? index.current : null;
	if (!writeIndex(storage, { v: 1, current, list })) {
		await storage.remove(house.id);
		return { ok: false, said: storeSaid('refused', house.name) };
	}
	return { ok: true, added: house.id, current: becomesCurrent, problems: read.problems, said: house.name + ' added.' };
}

/* -------------------------------------------------------------------------
 * A newer edition of a shipped pack
 * ---------------------------------------------------------------------- */

/**
 * THE EDITION RULE. A shipped pack is built with every mark and every
 * item's ts stamped with one number, Date.parse(house.pack.builtAt), so on
 * a device a mark or an item still carrying that one stamp is the
 * edition's own, and one carrying any other stamp was touched there (a
 * Keep, an Edit, a row saved by a wing). A copy already on a device may be
 * an older edition built before the rule, so the stamp is never read off
 * the pack field: it is found as the single most frequent stamp, because
 * the edition's stamp is shared by hundreds of records and each touch
 * carries its own. Marks and items are counted apart, since an older
 * edition stamped its items a day before its marks.
 */

type Rec = Record<string, unknown> & { id: string; ts: number };

/** The most frequent of a list of stamps, the earlier on a tie; null for none. */
function modeStamp(stamps: readonly number[]): number | null {
	const seen = new Map<number, number>();
	for (const t of stamps) if (Number.isFinite(t)) seen.set(t, (seen.get(t) || 0) + 1);
	let best: number | null = null;
	let count = 0;
	for (const [t, n] of seen) {
		if (n > count || (n === count && best !== null && t < best)) {
			best = t;
			count = n;
		}
	}
	return best;
}

/** Every record of the eleven lists, flat. */
function editionRecords(house: House): Rec[] {
	const out: Rec[] = [];
	for (const list of HOUSE_LISTS) for (const r of houseRows(house, list) as Rec[]) out.push(r);
	return out;
}

/** The edition's mark stamp on a house: the most frequent ts over every mark on every record and the card's history. */
export function editionStamp(house: House): number | null {
	const stamps: number[] = [];
	if (isMark(house.history)) stamps.push(house.history.ts);
	for (const list of HOUSE_LISTS) {
		const fields = MARK_FIELDS[list] as readonly string[];
		for (const r of houseRows(house, list) as Rec[]) {
			for (const f of fields) {
				const m = r[f];
				if (isMark(m)) stamps.push(m.ts);
			}
		}
	}
	return modeStamp(stamps);
}

/** The edition's item stamp on a house: the most frequent ts over every record of the eleven lists. */
export function editionItemStamp(house: House): number | null {
	return modeStamp(editionRecords(house).map((r) => r.ts));
}

/** When an edition was built, from its pack stamp; zero when it carries none or an unreadable one. */
export function editionBuiltAt(house: House): number {
	const t = house.pack ? Date.parse(house.pack.builtAt) : NaN;
	return Number.isFinite(t) ? t : 0;
}

/**
 * The stamps a device's kept notes carry that are an edition's own: the
 * mark and item stamps, and any stamp shared by the notes of at least
 * EDITION_NOTE_SPREAD records (an older edition's, left by an earlier
 * refresh). A note under any other stamp is a person's.
 */
export function editionNoteStamps(house: House, markStamp: number | null, itemStamp: number | null): Set<number> {
	const out = new Set<number>();
	if (markStamp !== null) out.add(markStamp);
	if (itemStamp !== null) out.add(itemStamp);
	const spread = new Map<number, number>();
	for (const r of editionRecords(house)) {
		const kept = r.kept;
		if (!Array.isArray(kept)) continue;
		const seen = new Set<number>();
		for (const n of kept) if (isNote(n)) seen.add(n.ts);
		for (const t of seen) spread.set(t, (spread.get(t) || 0) + 1);
	}
	for (const [t, n] of spread) if (n >= EDITION_NOTE_SPREAD) out.add(t);
	return out;
}

/** A device record nobody touched since its edition: its own stamp the edition's, every person's mark and every note the edition's. */
function untouchedSinceEdition(m: Rec, marks: readonly string[], markStamp: number | null, itemStamp: number | null, noteStamps: Set<number>): boolean {
	if (itemStamp === null || m.ts !== itemStamp) return false;
	for (const f of marks) {
		const mk = m[f];
		if (isMark(mk) && mk.by === 'person' && (markStamp === null || mk.ts !== markStamp)) return false;
	}
	const kept = m.kept;
	if (Array.isArray(kept)) for (const n of kept) if (isNote(n) && !noteStamps.has(n.ts)) return false;
	return true;
}

/** What a refresh did: items the edition added, items it brought up to date, items where a person's touch stood, items it retired. */
export interface RefreshCounts {
	added: number;
	updated: number;
	kept: number;
	removed: number;
}

/**
 * One record of the device copy refreshed by the shipped edition's twin.
 * The plain fields come whole from the shipped record when the device
 * record still carries the edition's item stamp, else the device's stand.
 * Each mark: a device mark carrying any other stamp than the edition's was
 * touched and stands (a mark of hers made on the device yields to a kept
 * shipped one, by pickMark); otherwise the shipped mark takes the field, or
 * the field goes when the new edition carries none. Kept notes: the
 * device's notes under an edition's stamp (editionNoteStamps) give way to
 * the shipped notes, and a person's notes union with them.
 * Returns the record and whether a person's touch stood against a
 * shipped value that differed.
 */
function refreshRecord(mine: Rec, theirs: Rec, marks: readonly string[], markStamp: number | null, itemStamp: number | null, noteStamps: Set<number>): { rec: Rec; kept: boolean } {
	const plainTouched = itemStamp === null || mine.ts !== itemStamp;
	const out: Record<string, unknown> = plainTouched ? { ...mine } : { ...theirs, id: mine.id };
	let kept = false;
	if (plainTouched) {
		for (const k of Object.keys(theirs)) {
			if (k === 'kept' || k === 'ts' || k === 'house' || marks.indexOf(k) >= 0) continue;
			if (!sameJson(mine[k], theirs[k])) kept = true;
		}
	}
	for (const f of marks) {
		const m = isMark(mine[f]) ? (mine[f] as Mark<unknown>) : undefined;
		const t = isMark(theirs[f]) ? (theirs[f] as Mark<unknown>) : undefined;
		let pick: Mark<unknown> | undefined;
		if (m && (markStamp === null || m.ts !== markStamp)) {
			pick = m.by === 'person' ? m : pickMark(m, t);
			if (pick === m && t && !sameJson(m, t)) kept = true;
		} else pick = t;
		if (pick) out[f] = pick;
		else delete out[f];
	}
	/* The device's notes under an edition's stamp are that edition's words, superseded by the shipped
	   ones; only a note a person kept survives beside them. With none, the shipped notes stand as
	   shipped, so an untouched record is the fresh import's twin. */
	const own = Array.isArray(mine.kept) ? (mine.kept as unknown[]).filter((n) => isNote(n) && !noteStamps.has(n.ts)) : [];
	const shippedNotes = Array.isArray(theirs.kept) ? (theirs.kept as unknown[]).filter(isNote) : [];
	const notes = own.length ? mergeKept(own, shippedNotes) : shippedNotes;
	if (notes.length) out.kept = notes;
	else delete out.kept;
	return { rec: out as Rec, kept };
}

/**
 * The device copy of a shipped house refreshed by a newer edition, by the
 * edition rule, with nothing a person wrote, kept, edited or removed lost:
 *
 *   a record the shipped edition has and the device lacks is added, unless
 *   a tombstone on the device is newer than the device copy's edition (a
 *   person removed it; an older tombstone is lifted with the add);
 *   a twin is refreshed by refreshRecord;
 *   a record only the device holds stays (a person's own, or one the new
 *   edition dropped, which a person may still be learning), unless the
 *   shipped edition carries a tombstone for its id newer than its last
 *   touch and nobody touched it since the device's own edition (its ts,
 *   every person's mark and every note still the edition's): the edition
 *   retired it, so it goes. One a person touched stays, whenever the touch
 *   was, even before the tombstone's stamp: an edition can reach a device
 *   before the stamp its retirements carry (the 21:00 edition of 3 October
 *   2026 was on the site from 20:47);
 *   the card's history settles as a mark; the card's plain fields follow
 *   the shipped edition, except the name, which a rename made the
 *   person's and which the device keeps; sources union; each build step
 *   keeps its latest stamp; tombstones union on the newer stamp;
 *   the pack stamp becomes the shipped one; id, began and createdAt stay.
 *
 * Shipped records come first in the shipped order, then the device's own.
 * Pure: the clock is the caller's, through the save.
 */
export function refreshEdition(device: House, shipped: House): { house: House; counts: RefreshCounts } {
	const counts: RefreshCounts = { added: 0, updated: 0, kept: 0, removed: 0 };
	const markStamp = editionStamp(device);
	const itemStamp = editionItemStamp(device);
	const edition = Math.max(markStamp === null ? 0 : markStamp, itemStamp === null ? 0 : itemStamp, editionBuiltAt(device));
	const noteStamps = editionNoteStamps(device, markStamp, itemStamp);
	const removed: Record<string, number> = { ...device.removed };
	for (const id of Object.keys(shipped.removed)) {
		const t = shipped.removed[id];
		if (!(id in removed) || t > removed[id]) removed[id] = t;
	}
	const out: Record<string, unknown> = { ...device };
	for (const list of HOUSE_LISTS) {
		const marks = MARK_FIELDS[list] as readonly string[];
		const mine = houseRows(device, list) as Rec[];
		const mineById = new Map<string, Rec>();
		for (const r of mine) if (!mineById.has(r.id)) mineById.set(r.id, r);
		const next: Rec[] = [];
		const seen = new Set<string>();
		for (const raw of houseRows(shipped, list) as Rec[]) {
			if (seen.has(raw.id)) continue;
			seen.add(raw.id);
			/* Only an item's house id is re-stamped; a video's `house` is a flag. */
			const t: Rec = typeof raw.house === 'string' ? ({ ...raw, house: device.id } as Rec) : raw;
			const m = mineById.get(t.id);
			if (!m) {
				const tomb = device.removed[t.id];
				if (typeof tomb === 'number' && tomb > edition) continue;
				if (typeof tomb === 'number') delete removed[t.id];
				next.push(t);
				counts.added++;
				continue;
			}
			const { rec, kept } = refreshRecord(m, t, marks, markStamp, itemStamp, noteStamps);
			next.push(rec);
			if (kept) counts.kept++;
			if (!sameJson(rec, m)) counts.updated++;
		}
		for (const m of mine) {
			if (seen.has(m.id)) continue;
			seen.add(m.id);
			const tomb = shipped.removed[m.id];
			if (typeof tomb === 'number' && tomb > lastTouch(m, marks) && untouchedSinceEdition(m, marks, markStamp, itemStamp, noteStamps)) {
				counts.removed++;
				continue;
			}
			next.push(m);
		}
		/* An optional list (the videos) is written only when it holds something. */
		if (next.length || !optionalList(list)) out[list] = next;
		else delete out[list];
	}
	for (const f of ['address', 'phone', 'site', 'meals', 'dressCode'] as const) out[f] = shipped[f];
	out.menusReadOn = shipped.menusReadOn > device.menusReadOn ? shipped.menusReadOn : device.menusReadOn;
	out.sources = mergeSources(shipped.sources, device.sources);
	const hm = isMark(device.history) ? device.history : undefined;
	const ht = isMark(shipped.history) ? shipped.history : undefined;
	const history = hm && (markStamp === null || hm.ts !== markStamp) ? (hm.by === 'person' ? hm : pickMark(hm, ht)) : ht;
	if (history) out.history = history;
	else delete out.history;
	const build: Partial<Record<BuildStep, number>> = {};
	for (const step of BUILD_STEPS) {
		const a = device.build[step];
		const b = shipped.build[step];
		const best = a === undefined ? b : b === undefined ? a : Math.max(a, b);
		if (best !== undefined) build[step] = best;
	}
	out.build = build;
	out.removed = removed;
	if (shipped.pack) out.pack = { ...shipped.pack };
	return { house: out as unknown as House, counts };
}

