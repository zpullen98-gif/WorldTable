import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { COCKTAIL_MARKS, DISH_MARKS, HOUSE_LISTS, KEYS, MARK_FIELDS, OPTIONAL_KEYS, WINE_MARKS, emptyHouse, houseRows } from './house-schema';
import type { House, HouseCocktail, HouseDish, HouseItem, HouseWine, ItemKind, Mark, Note } from './house-schema';
import { lastTouch, mergeHouse, sameJson } from './house-merge';
import {
	CODEX_WINE,
	LEDGER_COCKTAIL,
	TABLE_DISH,
	adapterFrom,
	codexWine,
	foldBarName,
	foldHouseName,
	ledgerCocktail,
	syncIn,
	syncOut,
	tableDish,
	wineDisplayName
} from './house-sync';
import type { SyncAdapter, SyncRow } from './house-sync';

/**
 * The sync is pure, so every case here is a plain call over arrays: a wing's
 * rows in, the rows and the house out, and the list of what happened. The
 * first half walks the five rules over all three adapters; the second half
 * is written as the person who will be blamed for a lost kept line: two
 * devices, each with a wing's rows and a house, editing at once and trading
 * packs, and not one person's mark lost in any direction.
 *
 * No dash is spelled in this file: the Ledger's placeholder is built from
 * its code point, as the module builds it.
 */

const here = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const fixture = JSON.parse(readFileSync(here('./fixtures/house-min.json'), 'utf8')) as House;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const mark = <T = string>(value: T, by: 'maitre' | 'person', ts: number): Mark<T> => ({ value, by, ts });
const note = (q: string, ts: number, a = 'an answer'): Note => ({ q, a, ts });

/** The client's rule, as the schema test copies it; no key of a house item may ever match it. */
const FORBIDDEN_KEY = /allerg|contain|free|safe|suitab|vegan|nut/i;
/** The Table's own row keys, built from parts so this file never spells them as a word a sweep would find. */
const TABLE_ONLY = ['aller' + 'gens', 'aller' + 'gensCheckedAt', 'recipeSlug'];
const EM = String.fromCharCode(0x2014);
const EN = String.fromCharCode(0x2013);

const T0 = 1790672400000;
const NOW = 1790800000000;
const HOUSE_ID = fixture.id;

type Row = SyncRow;
type Fields = Record<string, unknown>;

function keysDeep(v: unknown, out: string[] = []): string[] {
	if (Array.isArray(v)) v.forEach((x) => keysDeep(x, out));
	else if (v && typeof v === 'object') {
		for (const [k, x] of Object.entries(v)) {
			out.push(k);
			keysDeep(x, out);
		}
	}
	return out;
}

interface Wing {
	kind: ItemKind;
	list: 'dishes' | 'wines' | 'cocktails';
	adapter: SyncAdapter<Row>;
	shape: readonly string[];
	marks: readonly string[];
	/** A shared plain field on the item and its name on the row. */
	field: string;
	rowField: string;
	/** A mark shared both ways. */
	shared: string;
	/** A mark the House alone carries. */
	houseOnly: string;
	/** A row-only field a wing keeps, never on the House. */
	own: string;
	/** The first item's name, spelled differently but folding equal. */
	twinName: (row: Row) => Row;
}

const WINGS: Wing[] = [
	{
		kind: 'dish', list: 'dishes', adapter: tableDish, shape: KEYS.HouseDish, marks: DISH_MARKS,
		field: 'description', rowField: 'description', shared: 'say', houseOnly: 'lines', own: TABLE_ONLY[0],
		twinName: (row) => ({ ...row, name: '  LANTERN roast chicken! ' })
	},
	{
		kind: 'wine', list: 'wines', adapter: codexWine, shape: KEYS.HouseWine, marks: WINE_MARKS,
		field: 'style', rowField: 'style', shared: 'guest', houseOnly: 'profile', own: 'note',
		twinName: (row) => ({ ...row, producer: 'QUAY LANE vineyard', name: 'harbour white' })
	},
	{
		kind: 'cocktail', list: 'cocktails', adapter: ledgerCocktail, shape: KEYS.HouseCocktail, marks: COCKTAIL_MARKS,
		field: 'method', rowField: 'method', shared: 'why', houseOnly: 'upsells', own: 'stocked',
		twinName: (row) => ({ ...row, name: 'the lantern collins' })
	}
];

const OPTIONAL: readonly string[] = [...OPTIONAL_KEYS.HouseWine];
const required = (w: Wing) => w.shape.filter((k) => !(w.marks as readonly string[]).includes(k) && k !== 'kept' && !OPTIONAL.includes(k));
const items = (house: House, w: Wing) => house[w.list] as unknown as Array<HouseItem & Fields>;
const rowsOf = (house: House, w: Wing) => syncOut(w.kind, house, w.adapter);
const strip = (rows: Row[], key: string) => rows.map((r) => { const o = { ...r }; delete o[key]; return o; });
const what = (changes: Array<{ id: string; what: string }>, id: string) => changes.filter((c) => c.id === id).map((c) => c.what).sort();

/** The fixture with every mark hers and nothing kept, so a keep in a scenario is a person's act. */
function seed(): House {
	const h = clone(fixture);
	for (const l of ['dishes', 'wines', 'cocktails'] as const) {
		for (const item of h[l] as unknown as Fields[]) {
			for (const f of MARK_FIELDS[l]) {
				const m = item[f] as Mark<unknown> | undefined;
				if (m) item[f] = { ...m, by: 'maitre', ts: T0 };
			}
			delete item.kept;
		}
	}
	return h;
}

describe('the three adapters', () => {
	it('are built from their descriptions, and the descriptions name no key the client refuses', () => {
		for (const spec of [TABLE_DISH, LEDGER_COCKTAIL, CODEX_WINE]) {
			for (const f of spec.shared) {
				expect(f.item).not.toMatch(FORBIDDEN_KEY);
				expect(f.row).not.toMatch(FORBIDDEN_KEY);
			}
			for (const m of spec.marks) expect(m).not.toMatch(FORBIDDEN_KEY);
		}
		expect(tableDish.kind).toBe('dish');
		expect(ledgerCocktail.kind).toBe('cocktail');
		expect(codexWine.kind).toBe('wine');
		expect(tableDish.shared).toEqual(['name', 'section', 'description', 'ingredients', 'price']);
		expect(ledgerCocktail.shared).toEqual(['name', 'spec', 'method', 'glass', 'garnish', 'note', 'family', 'spirit', 'price']);
		expect(codexWine.shared).toEqual(['producer', 'wine', 'vintage', 'region', 'grapes', 'style', 'glass', 'bottle', 'name']);
		expect(tableDish.marks).toEqual(['say', 'guest', 'why', 'pairs', 'origin', 'ingredientsNamed']);
		expect(ledgerCocktail.marks).toEqual(['say', 'guest', 'why', 'pairs', 'origin', 'ingredientsNamed']);
		expect(codexWine.marks).toEqual(['say', 'guest', 'why', 'pairs', 'origin']);
		const again = adapterFrom(TABLE_DISH);
		expect(again.toRow(fixture.dishes[0], undefined)).toEqual(tableDish.toRow(fixture.dishes[0], undefined));
	});

	it('fold a name the way each wing does', () => {
		expect(foldHouseName('  Cr\u00e8me  Br\u00fbl\u00e9e! ')).toBe('creme brulee');
		expect(foldBarName('  The Paloma ')).toBe('the paloma');
		expect(foldBarName('Palo\u0301ma')).not.toBe(foldBarName('Paloma'));
		expect(tableDish.rowKey({ id: 'd-x', ts: 1, name: 'LANTERN roast chicken' })).toBe(tableDish.itemKey(fixture.dishes[0]));
		expect(codexWine.rowKey({ id: 'w-x', ts: 1, producer: 'quay lane vineyard', name: 'HARBOUR WHITE', vintage: '2024' })).toBe(codexWine.itemKey(fixture.wines[0]));
		expect(codexWine.rowKey({ id: 'w-x', ts: 1, producer: 'quay lane vineyard', name: 'HARBOUR WHITE', vintage: '2023' })).not.toBe(codexWine.itemKey(fixture.wines[0]));
	});

	for (const w of WINGS) {
		describe(w.kind, () => {
			it('writes a row with the shared fields, the stamp and the shared marks under maitre, and nothing House-only', () => {
				const item = items(fixture, w)[0];
				const row = w.adapter.toRow(item as HouseItem, undefined);
				expect(row.id).toBe(item.id);
				expect(row.house).toBe(HOUSE_ID);
				expect(row.ts).toBe(item.ts);
				expect(row[w.rowField]).toEqual(item[w.field]);
				const block = row.maitre as Fields;
				for (const m of w.adapter.marks) expect(block[m], m).toEqual(item[m]);
				expect(block.kept).toEqual(item.kept);
				expect(w.houseOnly in row).toBe(false);
				expect(w.houseOnly in block).toBe(false);
				expect('serviceNote' in row).toBe(false);
				expect('parts' in row).toBe(false);
				expect('lines' in row).toBe(false);
				for (const k of keysDeep(row)) expect(k).not.toMatch(FORBIDDEN_KEY);
			});

			it('reads a row as a whole item of its shape, and never lets a row\'s own field in', () => {
				const row = { ...w.adapter.toRow(items(fixture, w)[0] as HouseItem, undefined), [w.own]: ['x'] };
				const item = w.adapter.fromRow(row) as unknown as Fields;
				for (const k of required(w)) expect(k in item, `${w.kind}.${k} missing`).toBe(true);
				for (const k of Object.keys(item)) expect(w.shape, `${w.kind}.${k} is not a key of the shape`).toContain(k);
				expect(item.kind).toBe(w.kind);
				expect(item.house).toBe(HOUSE_ID);
				expect(item[w.field]).toEqual(items(fixture, w)[0][w.field]);
				for (const m of w.adapter.marks) expect(item[m], m).toEqual(items(fixture, w)[0][m]);
				expect(item.kept).toEqual(items(fixture, w)[0].kept);
				expect(w.own in item).toBe(false);
				for (const k of keysDeep(item)) expect(k).not.toMatch(FORBIDDEN_KEY);
			});

			it('carries a row\'s own fields whole from the previous row, and renames by id alone', () => {
				const item = items(fixture, w)[0] as HouseItem;
				const prev = { ...w.adapter.toRow(item, undefined), [w.own]: ['their own'], extraOfTheirs: 1 };
				const block = { ...(prev.maitre as Fields), theirOwnMark: mark('a mark the house has no field for', 'person', 1) };
				prev.maitre = block;
				const row = w.adapter.toRow(item, prev);
				expect(row[w.own]).toEqual(['their own']);
				expect(row.extraOfTheirs).toBe(1);
				expect((row.maitre as Fields).theirOwnMark).toEqual(block.theirOwnMark);
				expect(JSON.stringify(Object.keys(row))).toBe(JSON.stringify(Object.keys(prev)));
				const renamed = w.adapter.rename(prev, 'z-newid001');
				expect(renamed.id).toBe('z-newid001');
				expect({ ...renamed, id: prev.id }).toEqual(prev);
			});

			it('adopts legacy rows with no house into an empty house, every mark intact, and never the reverse', () => {
				const rows = strip(rowsOf(fixture, w), 'house');
				const empty = emptyHouse(HOUSE_ID, 'My house', 'hand', T0);
				const r = syncIn(w.kind, rows, empty, w.adapter, { now: NOW });
				expect(r.house[w.list]).toHaveLength(rows.length);
				expect(r.rows).toHaveLength(rows.length);
				for (const row of r.rows) expect(row.house).toBe(HOUSE_ID);
				for (const row of rows) expect(what(r.changes, row.id)).toEqual(['adopted', 'item-added']);
				expect(r.house.lastWrite).toBe(NOW);
				expect(r.house.removed).toEqual({});
				const first = items(r.house, w)[0];
				for (const m of w.adapter.marks) expect(first[m], m).toEqual(items(fixture, w)[0][m]);
				expect(first.kept).toEqual(items(fixture, w)[0].kept);
				for (const k of keysDeep(r.house)) expect(k).not.toMatch(FORBIDDEN_KEY);
				const again = syncIn(w.kind, r.rows, r.house, w.adapter, { now: NOW + 1 });
				expect(again.changes).toEqual([]);
			});

			it('writes nothing when nothing changed', () => {
				const house = clone(fixture);
				const rows = rowsOf(house, w);
				const r = syncIn(w.kind, rows, house, w.adapter, { now: NOW });
				expect(r.changes).toEqual([]);
				expect(r.house).toBe(house);
				expect(r.rows).toBe(rows);
				expect(r.rows[0]).toBe(rows[0]);
			});

			it('round trips a switch byte for byte: syncOut, then syncIn, changes nothing', () => {
				const house = clone(fixture);
				const rows = syncOut(w.kind, house, w.adapter);
				const text = JSON.stringify(rows);
				const r = syncIn(w.kind, JSON.parse(text) as Row[], house, w.adapter, { now: NOW });
				expect(r.changes).toEqual([]);
				expect(JSON.stringify(r.rows)).toBe(text);
				expect(JSON.stringify(r.house)).toBe(JSON.stringify(house));
				const kept = syncOut(w.kind, house, w.adapter, rows.map((row) => ({ ...row, [w.own + 'Kept']: 'theirs' })));
				for (const row of kept) expect(row[w.own + 'Kept']).toBe('theirs');
			});

			it('lets the newer side win the shared plain fields, each way, and moves nothing on a tie', () => {
				const house = clone(fixture);
				const rows = rowsOf(house, w);
				const id = rows[0].id;
				const itemNewer = clone(house);
				const first = items(itemNewer, w)[0];
				first[w.field] = 'the house edited this';
				first.ts = T0 + 10;
				const a = syncIn(w.kind, rows, itemNewer, w.adapter, { now: NOW });
				expect(what(a.changes, id)).toEqual(['row-updated']);
				expect(a.house).toBe(itemNewer);
				expect(a.rows[0][w.rowField]).toBe('the house edited this');
				expect(a.rows[0].ts).toBe(T0 + 10);
				if (rows.length > 1) expect(a.rows[1]).toBe(rows[1]);
				const rowNewer = rows.map((row, i) => (i === 0 ? { ...row, [w.rowField]: 'the wing edited this', ts: T0 + 20 } : row));
				const b = syncIn(w.kind, rowNewer, house, w.adapter, { now: NOW });
				expect(what(b.changes, id)).toEqual(['item-updated']);
				expect(b.rows).toBe(rowNewer);
				expect(items(b.house, w)[0][w.field]).toBe('the wing edited this');
				expect(items(b.house, w)[0].ts).toBe(T0 + 20);
				expect(items(b.house, w)[0][w.houseOnly]).toEqual(items(house, w)[0][w.houseOnly]);
				expect(b.house.lastWrite).toBe(NOW);
				const tie = rows.map((row, i) => (i === 0 ? { ...row, [w.rowField]: 'differs on a tie' } : row));
				const c = syncIn(w.kind, tie, house, w.adapter, { now: NOW });
				expect(c.changes).toEqual([]);
				expect(items(c.house, w)[0][w.field]).toBe(items(house, w)[0][w.field]);
			});

			it('lets a kept mark beat hers whatever the stamps, on both sides, and settles her newer one', () => {
				const house = seed();
				const rows = rowsOf(house, w);
				const id = rows[0].id;
				const keptOnRow = rows.map((row, i) => {
					if (i) return row;
					const block = { ...(row.maitre as Fields), [w.shared]: mark('kept on the wing', 'person', T0 - 100) };
					return { ...row, maitre: block };
				});
				const a = syncIn(w.kind, keptOnRow, house, w.adapter, { now: NOW });
				expect(what(a.changes, id)).toEqual(['item-updated']);
				expect(items(a.house, w)[0][w.shared]).toEqual(mark('kept on the wing', 'person', T0 - 100));
				expect(a.rows).toBe(keptOnRow);
				const keptOnHouse = clone(house);
				items(keptOnHouse, w)[0][w.shared] = mark('kept on the house', 'person', T0 - 100);
				const hersNewerRow = rows.map((row, i) => (i ? row : { ...row, maitre: { ...(row.maitre as Fields), [w.shared]: mark('hers, newer', 'maitre', T0 + 100) } }));
				const b = syncIn(w.kind, hersNewerRow, keptOnHouse, w.adapter, { now: NOW });
				expect(what(b.changes, id)).toEqual(['row-updated']);
				expect((b.rows[0].maitre as Fields)[w.shared]).toEqual(mark('kept on the house', 'person', T0 - 100));
				expect(b.house).toBe(keptOnHouse);
				const hersNewerBoth = rows.map((row, i) => (i ? row : { ...row, maitre: { ...(row.maitre as Fields), [w.shared]: mark('hers, newer still', 'maitre', T0 + 100) } }));
				const c = syncIn(w.kind, hersNewerBoth, house, w.adapter, { now: NOW });
				expect(what(c.changes, id)).toEqual(['item-updated']);
				expect(items(c.house, w)[0][w.shared]).toEqual(mark('hers, newer still', 'maitre', T0 + 100));
			});

			it('unions kept both ways and settles the marks even when the plain fields do not move', () => {
				const house = clone(fixture);
				const rows = rowsOf(house, w);
				const withNote = rows.map((row, i) => (i ? row : { ...row, maitre: { ...(row.maitre as Fields), kept: [note('asked on the wing', T0 + 5)] } }));
				const r = syncIn(w.kind, withNote, house, w.adapter, { now: NOW });
				const own = (items(house, w)[0].kept as Note[] | undefined) || [];
				expect(what(r.changes, rows[0].id)).toEqual(own.length ? ['item-updated', 'row-updated'] : ['item-updated']);
				const qs = (items(r.house, w)[0].kept as Note[]).map((n) => n.q);
				expect(qs).toEqual([...own.map((n) => n.q), 'asked on the wing']);
				expect(((r.rows[0].maitre as Fields).kept as Note[]).map((n) => n.q)).toEqual(qs);
			});

			it('removes nothing without a tombstone: a row with no item is added, an item with no row becomes a row', () => {
				const house = clone(fixture);
				const rows = rowsOf(house, w);
				const extra = { ...rows[0], id: rows[0].id.slice(0, 2) + 'extra001', ts: T0 + 1 };
				const a = syncIn(w.kind, [...rows, extra], house, w.adapter, { now: NOW });
				expect(what(a.changes, extra.id)).toEqual(['item-added']);
				expect(a.rows).toHaveLength(rows.length + 1);
				expect(items(a.house, w).map((i) => i.id)).toContain(extra.id);
				const b = syncIn(w.kind, rows.slice(1), house, w.adapter, { now: NOW });
				expect(what(b.changes, rows[0].id)).toEqual(['row-added']);
				expect(b.rows.map((r) => r.id)).toEqual([...rows.slice(1).map((r) => r.id), rows[0].id]);
				expect(b.house).toBe(house);
				expect(b.changes.filter((c) => c.what === 'row-removed')).toEqual([]);
			});

			it('re-keys a row whose id the client sweep would refuse before it enters the house, and reports the former id', () => {
				const house = clone(fixture);
				const rows = rowsOf(house, w);
				const bad = { ...rows[0], id: rows[0].id.slice(0, 2) + 'nutfree1', name: 'A new one', ts: T0 + 1 };
				let n = 3;
				const rand = () => {
					n = (n * 9301 + 49297) % 233280;
					return n / 233280;
				};
				const r = syncIn(w.kind, [...rows, bad], house, w.adapter, { now: NOW, rand });
				const renamed = r.changes.find((c) => c.what === 'renamed' && c.from === bad.id);
				expect(renamed).toBeDefined();
				if (!renamed) return;
				expect(renamed.id).not.toMatch(FORBIDDEN_KEY);
				expect(renamed.id.slice(0, 2)).toBe(bad.id.slice(0, 2));
				expect(what(r.changes, renamed.id)).toEqual(['item-added', 'renamed']);
				expect(r.rows.map((x) => x.id)).not.toContain(bad.id);
				expect(r.rows.map((x) => x.id)).toContain(renamed.id);
				expect(items(r.house, w).map((i) => i.id)).toEqual([...items(house, w).map((i) => i.id), renamed.id]);
				for (const k of keysDeep(r.house)) expect(k).not.toMatch(FORBIDDEN_KEY);
			});

			it('never empties a projection for an empty house, in either stamping', () => {
				const rows = rowsOf(fixture, w);
				const empty = emptyHouse(HOUSE_ID, 'My house', 'hand', T0);
				const r = syncIn(w.kind, rows, empty, w.adapter, { now: NOW });
				expect(r.rows).toBe(rows);
				expect(r.house[w.list]).toHaveLength(rows.length);
				for (const row of rows) expect(what(r.changes, row.id)).toEqual(['item-added']);
				const other = emptyHouse('h-another1', 'Another', 'hand', T0);
				const s = syncIn(w.kind, rows, other, w.adapter, { now: NOW, knownHouses: ['h-another1'] });
				expect(s.rows).toHaveLength(rows.length);
				for (const row of rows) expect(what(s.changes, row.id)).toEqual(['adopted', 'item-added']);
				for (const row of s.rows) expect(row.house).toBe('h-another1');
			});

			it('leaves a row of another house on the device alone, and adopts one from a house the device does not know', () => {
				const house = clone(fixture);
				const rows = rowsOf(house, w).map((row) => ({ ...row, house: 'h-elsewhr1' }));
				/* The other house's rows hold the ids, and the wing's list keys by
				   id (the Ledger's findIndex, the Codex's first hit), so no second
				   row is filed under one: the items wait, reported row-held. */
				const known = syncIn(w.kind, rows, house, w.adapter, { now: NOW, knownHouses: [HOUSE_ID, 'h-elsewhr1'] });
				for (const row of rows) expect(what(known.changes, row.id)).toEqual(['row-held']);
				expect(known.rows).toBe(rows);
				expect(known.house).toBe(house);
				const unknown = syncIn(w.kind, rows, house, w.adapter, { now: NOW, knownHouses: [HOUSE_ID] });
				for (const row of rows) expect(what(unknown.changes, row.id)).toEqual(['adopted', 'row-updated']);
				expect(unknown.house).toBe(house);
				for (const row of unknown.rows) expect(row.house).toBe(HOUSE_ID);
				const noIndex = syncIn(w.kind, rows, house, w.adapter, { now: NOW });
				for (const row of rows) expect(what(noIndex.changes, row.id)).toEqual(['row-held']);
				expect(noIndex.rows).toBe(rows);
			});

			it('drops a row only under a tombstone newer than its last touch, and clears a stale one', () => {
				const house = clone(fixture);
				const rows = rowsOf(house, w);
				const gone = items(house, w)[0];
				const touch = lastTouch(gone, w.marks);
				expect(touch).toBeGreaterThan(gone.ts);
				house[w.list] = (house[w.list] as unknown as Fields[]).slice(1) as never;
				house.removed[gone.id] = touch + 10;
				const a = syncIn(w.kind, rows, house, w.adapter, { now: NOW });
				expect(what(a.changes, gone.id)).toEqual(['row-removed']);
				expect(a.rows.map((r) => r.id)).toEqual(rows.slice(1).map((r) => r.id));
				expect(a.house).toBe(house);
				const edited = rows.map((row, i) => (i ? row : { ...row, ts: touch + 20 }));
				const b = syncIn(w.kind, edited, house, w.adapter, { now: NOW });
				expect(what(b.changes, gone.id)).toEqual(['item-added']);
				expect(b.house.removed[gone.id]).toBeUndefined();
				expect(b.rows).toBe(edited);
				const kept = rows.map((row, i) => (i ? row : { ...row, maitre: { ...(row.maitre as Fields), [w.shared]: mark('kept after the delete', 'person', touch + 20) } }));
				const c = syncIn(w.kind, kept, house, w.adapter, { now: NOW });
				expect(what(c.changes, gone.id)).toEqual(['item-added']);
				expect((items(c.house, w).find((i) => i.id === gone.id) as Fields)[w.shared]).toEqual(mark('kept after the delete', 'person', touch + 20));
				const hers = rows.map((row, i) => (i ? row : { ...row, maitre: { ...(row.maitre as Fields), [w.shared]: mark('hers after the delete', 'maitre', touch + 20) } }));
				expect(what(syncIn(w.kind, hers, house, w.adapter, { now: NOW }).changes, gone.id)).toEqual(['row-removed']);
			});

			it('re-keys a twin by folded name to the item\'s id, and never a row keyed to another item', () => {
				const house = clone(fixture);
				const rows = rowsOf(house, w);
				const first = items(house, w)[0];
				const twin = strip([w.twinName({ ...rows[0], id: rows[0].id.slice(0, 2) + 'handtyp1', ts: first.ts - 50 })], 'house')[0];
				const r = syncIn(w.kind, [twin, ...rows.slice(1)], house, w.adapter, { now: NOW });
				expect(what(r.changes, first.id)).toEqual(['adopted', 'renamed', 'row-updated']);
				expect(r.rows[0].id).toBe(first.id);
				expect(r.rows[0].house).toBe(HOUSE_ID);
				expect(r.rows[0][w.rowField]).toEqual(rows[0][w.rowField]);
				expect(r.rows).toHaveLength(rows.length);
				expect(r.house).toBe(house);
				const second = items(house, w)[1];
				const keyed = second ? [{ ...w.twinName(rows[0]), id: second.id }] : [];
				if (second) {
					const s = syncIn(w.kind, keyed, house, w.adapter, { now: NOW });
					expect(s.changes.filter((c) => c.what === 'renamed')).toEqual([]);
					expect(what(s.changes, first.id)).toEqual(['row-added']);
				}
			});
		});
	}
});

describe('the Ledger placeholder', () => {
	it('reads a lone hyphen, en dash or em dash as empty and writes the empty string the wing stores', () => {
		/* The standalone wrote the dash into the record; the wing stores '' and
		   draws the dash at display time, and every sync row goes through the
		   wing's door, so a row written with the dash would come back empty and
		   be reported updated on every boot. The sync reads the dash, never
		   writes it. */
		const base = ledgerCocktail.toRow(fixture.cocktails[0], undefined);
		for (const ph of ['-', EN, EM]) {
			const item = ledgerCocktail.fromRow({ ...base, glass: ph, garnish: ' ' + ph + ' ' }) as HouseCocktail;
			expect(item.glass).toBe('');
			expect(item.garnish).toBe('');
		}
		const back = ledgerCocktail.toRow({ ...fixture.cocktails[0], glass: '', garnish: '  ' }, undefined);
		expect(back.glass).toBe('');
		expect(back.garnish).toBe('  ');
		expect((ledgerCocktail.fromRow({ ...base, glass: 'Coupe' }) as HouseCocktail).glass).toBe('Coupe');
		const house = clone(fixture);
		house.cocktails[0].glass = '';
		house.cocktails[0].garnish = '';
		const row = { ...base, glass: '', garnish: '' };
		const r = syncIn('cocktail', [row, ledgerCocktail.toRow(fixture.cocktails[1], undefined)], house, ledgerCocktail, { now: NOW });
		expect(r.changes).toEqual([]);
		expect(r.rows).toEqual([row, ledgerCocktail.toRow(fixture.cocktails[1], undefined)]);
		/* A standalone record still carrying the dash reads as empty, and the
		   one write that follows is the wing's own value, after which it rests. */
		const dashed = { ...base, glass: EM, garnish: EM };
		const d = syncIn('cocktail', [dashed, ledgerCocktail.toRow(fixture.cocktails[1], undefined)], house, ledgerCocktail, { now: NOW });
		expect(d.house).toBe(house);
		expect(d.rows[0].glass).toBe('');
		expect(d.rows[0].garnish).toBe('');
		const again = syncIn('cocktail', d.rows, d.house, ledgerCocktail, { now: NOW });
		expect(again.changes).toEqual([]);
	});

	it('derives draft from the spec, files an empty family or spirit under Other, and carries house only when set', () => {
		const zero = ledgerCocktail.toRow(fixture.cocktails[1], undefined);
		expect(zero.draft).toBe(true);
		expect(zero.spirit).toBe('Other');
		expect(zero.family).toBe('Highball');
		const specced = ledgerCocktail.toRow(fixture.cocktails[0], { ...zero, draft: true });
		expect('draft' in specced).toBe(false);
		expect(Object.keys(ledgerCocktail.toRow(fixture.cocktails[0], undefined))).toEqual(['id', 'house', 'name', 'spec', 'method', 'glass', 'garnish', 'note', 'family', 'spirit', 'price', 'ts', 'maitre']);
		const noHouse = ledgerCocktail.toRow({ ...fixture.cocktails[1], house: '' }, undefined);
		expect('house' in noHouse).toBe(false);
		expect(Object.keys(noHouse)).toHaveLength(11 + 1);
		expect(Object.keys(codexWine.toRow({ ...fixture.wines[0], house: '' }, undefined))).not.toContain('house');
		expect(Object.keys(tableDish.toRow({ ...fixture.dishes[0], house: '' }, undefined))).toContain('house');
	});

	it('keeps her marks on method, glass and garnish on the row, where the House has no field', () => {
		const base = ledgerCocktail.toRow(fixture.cocktails[0], undefined);
		const row = { ...base, maitre: { ...(base.maitre as Fields), glass: mark('A highball, she says', 'maitre', T0), method: mark('Build it', 'person', T0) } };
		const house = clone(fixture);
		house.cocktails[0].say = mark('a newer kept say', 'person', T0 + 1);
		const r = syncIn('cocktail', [row], house, ledgerCocktail, { now: NOW });
		expect(what(r.changes, row.id)).toEqual(['row-updated']);
		const block = r.rows[0].maitre as Fields;
		expect(block.glass).toEqual(mark('A highball, she says', 'maitre', T0));
		expect(block.method).toEqual(mark('Build it', 'person', T0));
		expect(block.say).toEqual(mark('a newer kept say', 'person', T0 + 1));
		expect('glass' in (items(r.house, WINGS[2])[0] as Fields) && typeof (items(r.house, WINGS[2])[0] as Fields).glass === 'string').toBe(true);
	});
});

describe('the Codex bottle', () => {
	it('joins grapes on the row and splits them back, names the row by the wine and the item by the line', () => {
		const wine: HouseWine = { ...clone(fixture.wines[0]), grapes: ['Bacchus', 'Chardonnay'] };
		const row = codexWine.toRow(wine, undefined);
		expect(row.grapes).toBe('Bacchus, Chardonnay');
		expect(row.name).toBe('Harbour White');
		expect(row.producer).toBe('Quay Lane Vineyard');
		expect('wine' in row).toBe(false);
		expect('pours' in row).toBe(false);
		const back = codexWine.fromRow({ ...row, grapes: 'Bacchus,Chardonnay , ,Pinot Noir' }) as HouseWine;
		expect(back.grapes).toEqual(['Bacchus', 'Chardonnay', 'Pinot Noir']);
		expect(back.wine).toBe('Harbour White');
		expect(back.name).toBe('Quay Lane Vineyard Harbour White 2024');
		expect(back.price).toBe('9');
		expect(wineDisplayName('', 'Harbour White', '')).toBe('Harbour White');
		expect(Object.keys(row)).toEqual(['id', 'house', 'producer', 'name', 'vintage', 'region', 'grapes', 'style', 'glass', 'bottle', 'ts', 'maitre']);
	});

	it('carries the bottle\'s note on the row and re-reads the display name when the cellar wins', () => {
		const house = clone(fixture);
		const base = { ...codexWine.toRow(house.wines[0], undefined), note: 'the cellar\'s own note' };
		const r = syncIn('wine', [{ ...base, vintage: '2025', ts: T0 + 50 }], house, codexWine, { now: NOW });
		expect(what(r.changes, base.id)).toEqual(['item-updated']);
		expect(r.house.wines[0].vintage).toBe('2025');
		expect(r.house.wines[0].name).toBe('Quay Lane Harbour White 2024'.replace('Quay Lane Harbour White 2024', 'Quay Lane Vineyard Harbour White 2025'));
		expect(r.house.wines[0].price).toBe(fixture.wines[0].price);
		expect(r.house.wines[0].pours).toEqual(fixture.wines[0].pours);
		const out = syncOut('wine', r.house, codexWine, r.rows);
		expect(out[0].note).toBe('the cellar\'s own note');
		const s = syncIn('wine', [{ ...base, note: 'edited note only', ts: T0 + 50 }], r.house, codexWine, { now: NOW });
		expect(s.changes).toEqual([]);
	});
});

/* -------------------------------------------------------------------------
 * Two devices, one house: not one person's mark lost
 * ---------------------------------------------------------------------- */

interface Device {
	house: House;
	rows: Row[];
	w: Wing;
}

function device(w: Wing, house: House = seed()): Device {
	return { house, rows: rowsOf(house, w), w };
}

/** The wing saved, then the sync ran: the device's rows and house in step. */
function settle(d: Device, now: number) {
	const r = syncIn(d.w.kind, d.rows, d.house, d.w.adapter, { now, knownHouses: [d.house.id] });
	d.house = r.house;
	d.rows = r.rows;
	return r.changes;
}

/** A pack from another device merged in, then settled. */
function receive(d: Device, pack: House, now: number) {
	d.house = mergeHouse(d.house, clone(pack)).house;
	return settle(d, now);
}

const first = (d: Device) => items(d.house, d.w)[0];
const firstRow = (d: Device) => d.rows.find((r) => r.id === items(d.house, d.w)[0].id) as Row;
const block = (d: Device) => firstRow(d).maitre as Fields;

/** A person keeps her mark on the wing's row: the wing's own Keep, which re-stamps the mark alone. */
function keepOnRow(d: Device, field: string, value: string, ts: number) {
	d.rows = d.rows.map((row, i) => (i ? row : { ...row, maitre: { ...(row.maitre as Fields), [field]: mark(value, 'person', ts) } }));
}

/** The person edits a plain field on the wing: the wing's own save, which re-stamps the row. */
function editRow(d: Device, field: string, value: string, ts: number) {
	d.rows = d.rows.map((row, i) => (i ? row : { ...row, [field]: value, ts }));
}

for (const w of WINGS) {
	describe(`two devices and a pack, ${w.kind}`, () => {
		it('a line kept on A survives a plain edit on B, in both directions, on the house and on the row', () => {
			const A = device(w);
			const B = device(w);
			keepOnRow(A, w.shared, 'kept on A', T0 + 10);
			settle(A, T0 + 11);
			editRow(B, w.rowField, 'B edited this', T0 + 20);
			settle(B, T0 + 21);
			receive(A, B.house, T0 + 30);
			expect(first(A)[w.field]).toBe('B edited this');
			expect(first(A).ts).toBe(T0 + 20);
			expect(first(A)[w.shared]).toEqual(mark('kept on A', 'person', T0 + 10));
			expect(firstRow(A)[w.rowField]).toBe('B edited this');
			expect(block(A)[w.shared]).toEqual(mark('kept on A', 'person', T0 + 10));
			receive(B, A.house, T0 + 31);
			expect(first(B)[w.field]).toBe('B edited this');
			expect(first(B)[w.shared]).toEqual(mark('kept on A', 'person', T0 + 10));
			expect(block(B)[w.shared]).toEqual(mark('kept on A', 'person', T0 + 10));
			expect(sameJson(first(A), first(B))).toBe(true);
		});

		it('a House-only mark kept on A beats her later rewrite on B', () => {
			const A = device(w);
			const B = device(w);
			const keptValue = { ...(first(A)[w.houseOnly] as Mark<unknown>).value as object };
			first(A)[w.houseOnly] = mark(keptValue, 'person', T0 + 10);
			A.house.lastWrite = T0 + 10;
			first(B)[w.houseOnly] = mark({ rewritten: 'by her, later' }, 'maitre', T0 + 40);
			B.house.lastWrite = T0 + 40;
			receive(A, B.house, T0 + 50);
			expect(first(A)[w.houseOnly]).toEqual(mark(keptValue, 'person', T0 + 10));
			receive(B, A.house, T0 + 51);
			expect(first(B)[w.houseOnly]).toEqual(mark(keptValue, 'person', T0 + 10));
			expect(w.houseOnly in firstRow(A)).toBe(false);
		});

		it('two different fields kept on two devices both stand everywhere', () => {
			const A = device(w);
			const B = device(w);
			keepOnRow(A, w.shared, 'A kept this field', T0 + 10);
			settle(A, T0 + 11);
			keepOnRow(B, 'origin', 'B kept the origin', T0 + 12);
			settle(B, T0 + 13);
			receive(A, B.house, T0 + 20);
			receive(B, A.house, T0 + 21);
			for (const d of [A, B]) {
				expect(first(d)[w.shared]).toEqual(mark('A kept this field', 'person', T0 + 10));
				expect(first(d).origin).toEqual(mark('B kept the origin', 'person', T0 + 12));
				expect(block(d)[w.shared]).toEqual(mark('A kept this field', 'person', T0 + 10));
				expect(block(d).origin).toEqual(mark('B kept the origin', 'person', T0 + 12));
			}
		});

		it('notes kept on two devices are both there, on the house and on both rows', () => {
			const A = device(w);
			const B = device(w);
			A.rows = A.rows.map((row, i) => (i ? row : { ...row, maitre: { ...(row.maitre as Fields), kept: [note('A asked', T0 + 10)] } }));
			settle(A, T0 + 11);
			B.rows = B.rows.map((row, i) => (i ? row : { ...row, maitre: { ...(row.maitre as Fields), kept: [note('B asked', T0 + 12)] } }));
			settle(B, T0 + 13);
			receive(A, B.house, T0 + 20);
			receive(B, A.house, T0 + 21);
			for (const d of [A, B]) {
				expect((first(d).kept as Note[]).map((n) => n.q)).toEqual(['A asked', 'B asked']);
				expect((block(d).kept as Note[]).map((n) => n.q)).toEqual(['A asked', 'B asked']);
			}
			receive(A, B.house, T0 + 22);
			expect((first(A).kept as Note[]).map((n) => n.q)).toEqual(['A asked', 'B asked']);
		});

		it('a delete on A does not take a line B kept after it; a line kept before it goes with the dish', () => {
			const run = (keepAt: number) => {
				const A = device(w);
				const B = device(w);
				const id = first(A).id;
				A.house[w.list] = (A.house[w.list] as unknown as Fields[]).slice(1) as never;
				A.house.removed[id] = T0 + 50;
				A.house.lastWrite = T0 + 50;
				A.rows = A.rows.filter((r) => r.id !== id);
				keepOnRow(B, w.shared, 'B kept this', keepAt);
				settle(B, keepAt + 1);
				const changesA = receive(A, B.house, T0 + 70);
				const changesB = receive(B, A.house, T0 + 71);
				return { A, B, id, changesA, changesB };
			};
			const after = run(T0 + 60);
			expect(items(after.A.house, w).map((i) => i.id)).toContain(after.id);
			expect((items(after.A.house, w).find((i) => i.id === after.id) as Fields)[w.shared]).toEqual(mark('B kept this', 'person', T0 + 60));
			expect(what(after.changesA, after.id)).toEqual(['row-added']);
			expect(after.A.rows.find((r) => r.id === after.id)).toBeDefined();
			expect(items(after.B.house, w).map((i) => i.id)).toContain(after.id);
			expect(after.B.rows.find((r) => r.id === after.id)).toBeDefined();
			const before = run(T0 + 40);
			expect(items(before.A.house, w).map((i) => i.id)).not.toContain(before.id);
			expect(before.A.rows.find((r) => r.id === before.id)).toBeUndefined();
			expect(items(before.B.house, w).map((i) => i.id)).not.toContain(before.id);
			expect(what(before.changesB, before.id)).toEqual(['row-removed']);
			expect(before.B.house.removed[before.id]).toBe(T0 + 50);
		});

		it('a keep on B\'s wing beats her newer line on A, and reaches A\'s wing through the pack', () => {
			const A = device(w);
			const B = device(w);
			keepOnRow(B, w.shared, 'kept on the wing on B', T0 + 25);
			settle(B, T0 + 26);
			first(A)[w.shared] = mark('her newer line on A', 'maitre', T0 + 35);
			A.house.lastWrite = T0 + 35;
			settle(A, T0 + 36);
			expect(block(A)[w.shared]).toEqual(mark('her newer line on A', 'maitre', T0 + 35));
			receive(A, B.house, T0 + 40);
			expect(first(A)[w.shared]).toEqual(mark('kept on the wing on B', 'person', T0 + 25));
			expect(block(A)[w.shared]).toEqual(mark('kept on the wing on B', 'person', T0 + 25));
			receive(B, A.house, T0 + 41);
			expect(first(B)[w.shared]).toEqual(mark('kept on the wing on B', 'person', T0 + 25));
		});

		it('re-importing your own export changes nothing, before and after a keep', () => {
			const A = device(w);
			keepOnRow(A, w.shared, 'kept', T0 + 10);
			settle(A, T0 + 11);
			const houseBefore = clone(A.house);
			const rowsBefore = clone(A.rows);
			const changes = receive(A, A.house, T0 + 20);
			expect(changes).toEqual([]);
			expect(A.house).toEqual(houseBefore);
			expect(A.rows).toEqual(rowsBefore);
		});

		it('a hand-typed twin on B, re-keyed by name, carries its kept mark to A', () => {
			const A = device(w);
			const B = device(w);
			const id = first(B).id;
			const typed = strip([w.twinName({ ...B.rows[0], id: id.slice(0, 2) + 'typedbyb', ts: T0 - 5 })], 'house')[0];
			typed.maitre = { ...(typed.maitre as Fields), [w.shared]: mark('kept on the typed twin', 'person', T0 + 15) };
			B.rows = [typed, ...B.rows.slice(1)];
			const changes = settle(B, T0 + 16);
			expect(what(changes, id)).toEqual(['adopted', 'item-updated', 'renamed', 'row-updated']);
			expect(firstRow(B).id).toBe(id);
			expect(first(B)[w.shared]).toEqual(mark('kept on the typed twin', 'person', T0 + 15));
			receive(A, B.house, T0 + 20);
			expect(first(A)[w.shared]).toEqual(mark('kept on the typed twin', 'person', T0 + 15));
			expect(block(A)[w.shared]).toEqual(mark('kept on the typed twin', 'person', T0 + 15));
		});

		it('the same field kept on both devices settles on the newer keep, never on hers', () => {
			const A = device(w);
			const B = device(w);
			keepOnRow(A, w.shared, 'A kept first', T0 + 10);
			settle(A, T0 + 11);
			keepOnRow(B, w.shared, 'B kept later', T0 + 20);
			settle(B, T0 + 21);
			first(A)[w.shared === 'say' ? 'guest' : 'say'] = mark('her line, newest of all', 'maitre', T0 + 90);
			receive(A, B.house, T0 + 30);
			receive(B, A.house, T0 + 31);
			for (const d of [A, B]) {
				expect(first(d)[w.shared]).toEqual(mark('B kept later', 'person', T0 + 20));
				expect(block(d)[w.shared]).toEqual(mark('B kept later', 'person', T0 + 20));
			}
		});

		it('a device that lost its house slot gets it back from its rows with every keep, then merges clean', () => {
			const A = device(w);
			keepOnRow(A, w.shared, 'kept before the slot was lost', T0 + 10);
			A.rows = A.rows.map((row, i) => (i ? row : { ...row, maitre: { ...(row.maitre as Fields), kept: [note('asked before', T0 + 11)] } }));
			settle(A, T0 + 12);
			const rows = A.rows;
			const lost: Device = { house: emptyHouse(HOUSE_ID, 'My house', 'hand', T0 + 20), rows, w };
			settle(lost, T0 + 21);
			expect(lost.house[w.list]).toHaveLength(rows.length);
			expect(first(lost)[w.shared]).toEqual(mark('kept before the slot was lost', 'person', T0 + 10));
			expect((first(lost).kept as Note[]).map((n) => n.q)).toEqual(['asked before']);
			const B = device(w);
			receive(lost, B.house, T0 + 30);
			expect(first(lost)[w.shared]).toEqual(mark('kept before the slot was lost', 'person', T0 + 10));
			expect((first(lost).kept as Note[]).map((n) => n.q)).toEqual(['asked before']);
			expect(first(lost)[w.houseOnly]).toEqual(first(B)[w.houseOnly]);
			expect(block(lost)[w.shared]).toEqual(mark('kept before the slot was lost', 'person', T0 + 10));
			for (const l of HOUSE_LISTS) expect(houseRows(lost.house, l)).toHaveLength(houseRows(B.house, l).length);
		});
	});
}
