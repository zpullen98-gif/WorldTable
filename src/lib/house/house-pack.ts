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
 * device had no index at all, or when the only house on it is a hand house
 * with nothing in it. A pack whose id IS on the device is added under a
 * fresh id ("Add as a new house", the items keeping theirs) or merged into
 * the house it names ("Merge into"), which ends on a count. The index write
 * an import makes is a person's act, the second of the two that may create
 * an index (mintHouse in house-store.ts is the first).
 */
import { ID_PREFIXES, mintId } from './house-schema';
import type { House, HouseIndex, HouseStub } from './house-schema';
import { normaliseHouse } from './house-normalise';
import type { NormaliseReport } from './house-normalise';
import { validateHouse } from './house-validate';
import type { Problem } from './house-validate';
import { mergeHouse } from './house-merge';
import type { MergeCounts } from './house-merge';
import { loadHouse, putHouse, readIndex, saveHouse, storeSaid, writeIndex } from './house-store';
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

/** How many records the ten lists hold between them. */
export function countItems(house: House): number {
	return (
		house.tastings.length +
		house.dishes.length +
		house.wines.length +
		house.cocktails.length +
		house.lexicon.length +
		house.scenarios.length +
		house.mixUps.length +
		house.mustKnows.length +
		house.askAtLineup.length +
		house.disputes.length
	);
}

/**
 * The rule for the current pointer on an import: a new house becomes
 * current when the device had no index at all, or when its only house is a
 * hand house with nothing in it (the implicit "My house" a person minted a
 * moment ago and never filled). Otherwise it is listed behind the current
 * house and the screen offers "Open it now?".
 */
export async function packBecomesCurrent(storage: HouseStorage, index: HouseIndex | null): Promise<boolean> {
	if (!index) return true;
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
	const index = readIndex(storage);
	const onDevice = new Set<string>(index ? index.list.map((s) => s.id) : []);
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
