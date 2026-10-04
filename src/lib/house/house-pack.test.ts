import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { HOUSE_INDEX_KEY } from './house-schema';
import type { House, HouseDish, Mark } from './house-schema';
import { normaliseHouse } from './house-normalise';
import { currentId, listHouses, loadHouse, mapStorage, mintHouse, readIndex, saveHouse } from './house-store';
import type { HouseStorage } from './house-store';
import {
	PACK_FORMAT,
	PACK_VERSION,
	buildPack,
	countItems,
	importPack,
	mergeSaid,
	packBecomesCurrent,
	packFilename,
	packSlug,
	readPack,
	restampHouse
} from './house-pack';
import type { PackFile } from './house-pack';

/**
 * The pack is the one transport a House has, so what is under test is the
 * door: a round trip that changes nothing, every refusal with nothing
 * written, the three cases of the current rule, the two choices when the
 * id is already here, and the counts a merge ends on.
 *
 * No dash is spelled in this file.
 */

const here = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const fixture = JSON.parse(readFileSync(here('./fixtures/house-min.json'), 'utf8')) as House;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const T0 = 1790800000000;
const NOW = 1790900000000;
const mark = <T = string>(value: T, by: 'maitre' | 'person', ts: number): Mark<T> => ({ value, by, ts });

function seeded(start = 7): () => number {
	let n = start;
	return () => {
		n = (n * 9301 + 49297) % 233280;
		return n / 233280;
	};
}

const packText = (house: House = fixture) => JSON.stringify(buildPack(house, 'tools', T0));

/* -------------------------------------------------------------------------
 * The file
 * ---------------------------------------------------------------------- */

describe('the pack file', () => {
	it('buildPack carries the five keys, the stamp and the app', () => {
		const pack = buildPack(fixture, 'ledger', T0);
		expect(Object.keys(pack)).toEqual(['format', 'version', 'exportedAt', 'app', 'house']);
		expect(pack.format).toBe(PACK_FORMAT);
		expect(pack.version).toBe(PACK_VERSION);
		expect(pack.exportedAt).toBe(new Date(T0).toISOString());
		expect(pack.app).toEqual({ from: 'ledger' });
		expect(pack.house).toBe(fixture);
		expect(PACK_FORMAT).toBe('oot-house-pack');
		expect(PACK_VERSION).toBe(1);
	});

	it('packSlug folds a name to lower case ASCII words on hyphens', () => {
		expect(packSlug('The Lantern Room')).toBe('the-lantern-room');
		expect(packSlug("  Caf\u00e9 d'\u00c9t\u00e9!  ")).toBe('cafe-d-ete');
		expect(packSlug('')).toBe('house');
		expect(packSlug('***')).toBe('house');
		expect(packSlug('a'.repeat(100)).length).toBe(60);
	});

	it('packFilename is house, the slug, the date and the .oothouse.json ending', () => {
		expect(packFilename(fixture, T0)).toBe('house-the-lantern-room-' + new Date(T0).toISOString().slice(0, 10) + '.oothouse.json');
		expect(packFilename({ ...fixture, name: '' }, T0)).toMatch(/^house-house-\d{4}-\d{2}-\d{2}\.oothouse\.json$/);
	});
});

/* -------------------------------------------------------------------------
 * Reading
 * ---------------------------------------------------------------------- */

describe('readPack', () => {
	it('round trips the fixture: the same house, no report, nothing fatal', () => {
		const read = readPack(packText());
		expect(read.ok).toBe(true);
		if (!read.ok) return;
		expect(read.house).toEqual(normaliseHouse(fixture).house);
		expect(read.house).toEqual(fixture);
		expect(read.report).toEqual([]);
		expect(read.fatalCount).toBe(0);
		expect(read.exportedAt).toBe(new Date(T0).toISOString());
		expect(read.from).toBe('tools');
	});

	it('takes an object already parsed, and the same object twice reads the same', () => {
		const pack = buildPack(clone(fixture), 'table', T0);
		const a = readPack(pack);
		const b = readPack(pack);
		expect(a.ok && b.ok).toBe(true);
		if (a.ok && b.ok) expect(a.house).toEqual(b.house);
	});

	it('refuses what is not JSON, not an object, or not a pack', () => {
		for (const bad of ['{not json', '[]', 'null', '"text"', '{"format":"oot-menu-desk","version":1}', '{"version":1,"house":{}}']) {
			const read = readPack(bad);
			expect(read.ok).toBe(false);
			if (!read.ok) expect(read.said.length).toBeGreaterThan(10);
		}
		const desk = readPack({ format: 'oot-menu-desk', version: 1, house: fixture });
		expect(desk.ok).toBe(false);
		if (!desk.ok) expect(desk.said).toContain('oot-menu-desk');
	});

	it('refuses version 2, a missing version and a version that is not a number', () => {
		const v2 = readPack({ ...buildPack(fixture, 'tools', T0), version: 2 });
		expect(v2.ok).toBe(false);
		if (!v2.ok) expect(v2.said).toContain('newer');
		for (const version of [undefined, '1', 0, -1, NaN]) {
			const read = readPack({ ...buildPack(fixture, 'tools', T0), version });
			expect(read.ok).toBe(false);
		}
	});

	it('refuses a pack with no house, or a house with no name', () => {
		expect(readPack({ format: PACK_FORMAT, version: 1 }).ok).toBe(false);
		expect(readPack({ format: PACK_FORMAT, version: 1, house: [] }).ok).toBe(false);
		expect(readPack({ format: PACK_FORMAT, version: 1, house: { ...fixture, name: '  ' } }).ok).toBe(false);
	});

	it('normalises on the way in: a stray key is dropped and reported, never carried', () => {
		const raw = clone(fixture) as unknown as Record<string, unknown>;
		(raw.dishes as Array<Record<string, unknown>>)[0]['aller' + 'gens'] = ['x'];
		const read = readPack({ format: PACK_FORMAT, version: 1, exportedAt: '', app: { from: 'tools' }, house: raw });
		expect(read.ok).toBe(true);
		if (!read.ok) return;
		expect(Object.keys(read.house.dishes[0])).not.toContain('aller' + 'gens');
		expect(read.report.some((r) => r.code === 'forbidden')).toBe(true);
		expect(JSON.stringify(read.house)).not.toContain('aller' + 'gens');
	});

	it('passes the validator\'s flags through rather than refusing a person\'s own over-cap line', () => {
		const house = clone(fixture);
		const lines = house.dishes[0].lines as Mark<{ s10: string; s20: string; s45: string }>;
		lines.value.s10 = Array.from({ length: 30 }, (_v, i) => 'word' + i).join(' ');
		const read = readPack(packText(house));
		expect(read.ok).toBe(true);
		if (!read.ok) return;
		expect(read.problems.some((p) => p.code === 'word-cap')).toBe(true);
	});
});

/* -------------------------------------------------------------------------
 * Importing
 * ---------------------------------------------------------------------- */

describe('importPack: refusals write nothing', () => {
	it('a refused read leaves the device untouched', async () => {
		const backing = new Map<string, string>();
		const storage = mapStorage(backing);
		for (const bad of ['{not json', '{"format":"oot-menu-desk","version":1}', JSON.stringify({ ...buildPack(fixture, 'tools', T0), version: 2 })]) {
			const result = await importPack(storage, bad, { mode: 'new' }, NOW);
			expect(result.ok).toBe(false);
		}
		expect(backing.size).toBe(0);
	});

	it('a refused put leaves the index untouched and says why', async () => {
		const backing = new Map<string, string>();
		const inner = mapStorage(backing);
		const refusing: HouseStorage = { ...inner, put: async () => ({ ok: false, reason: 'too-big', bytes: 9, said: 'too big; export a pack' }) };
		const result = await importPack(refusing, packText(), { mode: 'new' }, NOW);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.said).toBe('too big; export a pack');
		expect(backing.size).toBe(0);
	});

	it('a refused index write takes the record back out', async () => {
		const backing = new Map<string, string>();
		const inner = mapStorage(backing);
		const refusing: HouseStorage = { ...inner, setIndex: () => false };
		const result = await importPack(refusing, packText(), { mode: 'new' }, NOW);
		expect(result.ok).toBe(false);
		expect(backing.size).toBe(0);
	});
});

describe('importPack: the current rule', () => {
	it('a device with no index: the pack becomes current', async () => {
		const backing = new Map<string, string>();
		const storage = mapStorage(backing);
		const result = await importPack(storage, packText(), { mode: 'new' }, NOW);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.added).toBe(fixture.id);
		expect(result.current).toBe(true);
		expect(result.said).toBe('The Lantern Room added.');
		expect(result.counts).toBeUndefined();
		expect(result.problems).toEqual([]);
		const index = readIndex(storage);
		expect(index && index.current).toBe(fixture.id);
		expect(index && index.list).toEqual([{ id: fixture.id, name: 'The Lantern Room', ts: NOW, bytes: (backing.get('oot-house.' + fixture.id) || '').length, began: 'pack' }]);
		const stored = await loadHouse(storage, fixture.id);
		expect(stored).toEqual({ ...fixture, lastWrite: NOW });
	});

	it('a device whose only house is an empty hand house: the pack becomes current, the hand house stays listed', async () => {
		const storage = mapStorage();
		const minted = await mintHouse(storage, 'My house', 'hand', T0);
		if (!minted.ok) throw new Error('mint failed');
		const result = await importPack(storage, packText(), { mode: 'new' }, NOW);
		expect(result.ok && result.current).toBe(true);
		expect(currentId(storage)).toBe(fixture.id);
		expect(listHouses(storage).map((s) => s.id)).toEqual([minted.house.id, fixture.id]);
	});

	it('a device whose one hand house holds anything: the pack is listed behind', async () => {
		const storage = mapStorage();
		const minted = await mintHouse(storage, 'My house', 'hand', T0);
		if (!minted.ok) throw new Error('mint failed');
		await saveHouse(storage, { ...minted.house, mustKnows: clone(fixture.mustKnows) }, T0 + 1);
		const result = await importPack(storage, packText(), { mode: 'new' }, NOW);
		expect(result.ok && !result.current).toBe(true);
		expect(currentId(storage)).toBe(minted.house.id);
		expect(listHouses(storage).map((s) => s.id)).toEqual([minted.house.id, fixture.id]);
	});

	it('an empty house that began as a pack or a desk read, or two houses: the pack is listed behind', async () => {
		for (const began of ['pack', 'desk'] as const) {
			const storage = mapStorage();
			const minted = await mintHouse(storage, 'A', began, T0);
			if (!minted.ok) throw new Error('mint failed');
			expect(await packBecomesCurrent(storage, readIndex(storage))).toBe(false);
			const result = await importPack(storage, packText(), { mode: 'new' }, NOW);
			expect(result.ok && !result.current).toBe(true);
			expect(currentId(storage)).toBe(minted.house.id);
		}
		const storage = mapStorage();
		await mintHouse(storage, 'A', 'hand', T0, seeded(1));
		await mintHouse(storage, 'B', 'hand', T0, seeded(2));
		expect(await packBecomesCurrent(storage, readIndex(storage))).toBe(false);
	});

	it('packBecomesCurrent reads a stub whose record is missing as empty', async () => {
		const storage = mapStorage();
		const minted = await mintHouse(storage, 'A', 'hand', T0);
		if (!minted.ok) throw new Error('mint failed');
		await storage.remove(minted.house.id);
		expect(await packBecomesCurrent(storage, readIndex(storage))).toBe(true);
	});

	it('countItems counts all twelve lists, an absent optional one as none', () => {
		expect(countItems(fixture)).toBe(1 + 2 + 1 + 2 + 2 + 1 + 1 + 1 + 1 + 1 + 1 + 2);
		const bare = { ...fixture } as Record<string, unknown>;
		delete bare.videos;
		delete bare.components;
		expect(countItems(bare as unknown as typeof fixture)).toBe(13);
	});
});

describe('importPack: an id already on the device', () => {
	it("'new' re-mints the house id and keeps every item id, every item stamped with the new house", async () => {
		const storage = mapStorage();
		await importPack(storage, packText(), { mode: 'new' }, NOW);
		const again = await importPack(storage, packText(), { mode: 'new' }, NOW + 1, seeded(5));
		expect(again.ok).toBe(true);
		if (!again.ok) return;
		expect(again.added).not.toBe(fixture.id);
		expect(again.added).toMatch(/^h-[0-9a-z]{8}$/);
		expect(again.current).toBe(false);
		expect(currentId(storage)).toBe(fixture.id);
		expect(listHouses(storage).map((s) => s.id)).toEqual([fixture.id, again.added]);
		const copy = await loadHouse(storage, again.added);
		expect(copy).not.toBeNull();
		if (!copy) return;
		expect(copy.id).toBe(again.added);
		for (const list of ['dishes', 'wines', 'cocktails'] as const) {
			expect(copy[list].map((i) => i.id)).toEqual(fixture[list].map((i) => i.id));
			for (const item of copy[list]) expect(item.house).toBe(again.added);
		}
		expect(copy.lexicon).toEqual(fixture.lexicon);
		const original = await loadHouse(storage, fixture.id);
		expect(original).toEqual({ ...fixture, lastWrite: NOW });
	});

	it('restampHouse touches the id and the three item lists only', () => {
		const out = restampHouse(fixture, 'h-fresh000');
		expect(out.id).toBe('h-fresh000');
		expect(out.dishes.every((d) => d.house === 'h-fresh000')).toBe(true);
		expect(out.tastings).toBe(fixture.tastings);
		expect(out.dishes.map((d) => d.id)).toEqual(fixture.dishes.map((d) => d.id));
	});

	it("'merge' uses mergeHouse and ends on the counts", async () => {
		const storage = mapStorage();
		await importPack(storage, packText(), { mode: 'new' }, NOW);
		const theirs = clone(fixture);
		const extra: HouseDish = { ...clone(fixture.dishes[1]), id: 'd-newdish1', name: 'Harbour Soup', ts: T0 };
		theirs.dishes.push(extra);
		theirs.dishes[0].say = mark('Say it the new way.', 'person', NOW + 5);
		const result = await importPack(storage, packText(theirs), { mode: 'merge' }, NOW + 10);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.added).toBe(fixture.id);
		expect(result.current).toBe(true);
		expect(result.counts).toEqual({ added: 1, updated: 1, keptMine: 0, removed: 0 });
		expect(result.said).toBe('The Lantern Room merged: 1 item added, 1 updated, 0 of yours kept because newer.');
		const merged = await loadHouse(storage, fixture.id);
		expect(merged && merged.dishes.map((d) => d.id)).toEqual(['d-chicken1', 'd-beetrt01', 'd-newdish1']);
		expect(merged && merged.dishes[0].say).toEqual(theirs.dishes[0].say);
		expect(listHouses(storage).length).toBe(1);
	});

	it("'merge' keeps mine when mine is newer, and counts it", async () => {
		const storage = mapStorage();
		const mine = clone(fixture);
		mine.dishes[0].say = mark('Mine, newer.', 'person', NOW + 50);
		await importPack(storage, packText(mine), { mode: 'new' }, NOW);
		const theirs = clone(fixture);
		theirs.dishes[0].say = mark('Theirs, older.', 'person', NOW + 5);
		const result = await importPack(storage, packText(theirs), { mode: 'merge' }, NOW + 10);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.counts).toEqual({ added: 0, updated: 0, keptMine: 1, removed: 0 });
		const merged = await loadHouse(storage, fixture.id);
		expect(merged && merged.dishes[0].say).toEqual(mine.dishes[0].say);
	});

	it("'merge' into a named house of another id, and a refusal when there is nothing to merge into", async () => {
		const storage = mapStorage();
		const minted = await mintHouse(storage, 'Mine', 'hand', T0);
		if (!minted.ok) throw new Error('mint failed');
		const result = await importPack(storage, packText(), { mode: 'merge', into: minted.house.id }, NOW);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.added).toBe(minted.house.id);
		expect(result.counts && result.counts.added).toBe(countItems(fixture));
		const merged = await loadHouse(storage, minted.house.id);
		expect(merged && merged.name).toBe('Mine');
		expect(merged && merged.dishes.every((d) => d.house === minted.house.id)).toBe(true);
		expect(listHouses(storage).map((s) => s.id)).toEqual([minted.house.id]);

		const nowhere = await importPack(mapStorage(), packText(), { mode: 'merge' }, NOW);
		expect(nowhere.ok).toBe(false);
		const elsewhere = await importPack(storage, packText(), { mode: 'merge', into: 'h-nowhere0' }, NOW);
		expect(elsewhere.ok).toBe(false);
	});

	it('mergeSaid names a removal only when there was one', () => {
		expect(mergeSaid('A', { added: 14, updated: 9, keptMine: 3, removed: 0 })).toBe('A merged: 14 items added, 9 updated, 3 of yours kept because newer.');
		expect(mergeSaid('A', { added: 1, updated: 0, keptMine: 0, removed: 2 })).toBe('A merged: 1 item added, 0 updated, 0 of yours kept because newer, 2 removed.');
	});
});

describe('importPack: what it leaves on the device', () => {
	it('a second import of the same pack as new is a second house, never an overwrite', async () => {
		const backing = new Map<string, string>();
		const storage = mapStorage(backing);
		await importPack(storage, packText(), { mode: 'new' }, NOW);
		const first = backing.get('oot-house.' + fixture.id);
		await importPack(storage, packText({ ...clone(fixture), dressCode: 'changed' }), { mode: 'new' }, NOW + 1);
		expect(backing.get('oot-house.' + fixture.id)).toBe(first);
		expect(listHouses(storage).length).toBe(2);
		expect(backing.has(HOUSE_INDEX_KEY)).toBe(true);
	});

	it('the pack a device exports imports on another with nothing changed', async () => {
		const a = mapStorage();
		await importPack(a, packText(), { mode: 'new' }, NOW);
		const exported = await loadHouse(a, fixture.id);
		if (!exported) throw new Error('nothing to export');
		const pack: PackFile = buildPack(exported, 'codex', NOW + 1);
		const b = mapStorage();
		const result = await importPack(b, JSON.stringify(pack), { mode: 'new' }, NOW + 2);
		expect(result.ok && result.current).toBe(true);
		const arrived = await loadHouse(b, fixture.id);
		expect(arrived).toEqual({ ...exported, lastWrite: NOW + 2 });
	});
});
