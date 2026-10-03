import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { COCKTAIL_MARKS, DISH_MARKS, WINE_MARKS, emptyHouse } from './house-schema';
import type { House, HouseItem, ItemKind, Mark } from './house-schema';
import { lastTouch } from './house-merge';
import { codexWine, ledgerCocktail, syncIn, syncOut, tableDish } from './house-sync';
import type { SyncAdapter, SyncRow } from './house-sync';

/**
 * The adversarial pass over the sync, written as the engineer who will be
 * blamed for a lost kept line or a resurrected deleted dish. Every case
 * here is a hole found by reading house-sync.ts and house-merge.ts against
 * the plan's rules, and every case FAILS on the modules as they stand: the
 * expectations say what the rule asks for, and the modules are not touched
 * by this file. When a hole is closed its case turns green; a case that
 * stays red is a finding still open.
 *
 * No dash is spelled in this file: the Ledger's placeholder is built from
 * its code point, as the module builds it.
 */

const here = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const fixture = JSON.parse(readFileSync(here('./fixtures/house-min.json'), 'utf8')) as House;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const mark = <T = string>(value: T, by: 'maitre' | 'person', ts: number): Mark<T> => ({ value, by, ts });
const EM = String.fromCharCode(0x2014);

const NOW = 1790800000000;
const HOUSE_ID = fixture.id;

type Row = SyncRow;
type Fields = Record<string, unknown>;

interface Wing {
	kind: ItemKind;
	list: 'dishes' | 'wines' | 'cocktails';
	adapter: SyncAdapter<Row>;
	marks: readonly string[];
	shared: string;
	twinName: (row: Row) => Row;
}

const WINGS: Wing[] = [
	{ kind: 'dish', list: 'dishes', adapter: tableDish, marks: DISH_MARKS, shared: 'say', twinName: (row) => ({ ...row, name: '  LANTERN roast chicken! ' }) },
	{ kind: 'wine', list: 'wines', adapter: codexWine, marks: WINE_MARKS, shared: 'guest', twinName: (row) => ({ ...row, producer: 'QUAY LANE vineyard', name: 'harbour white' }) },
	{ kind: 'cocktail', list: 'cocktails', adapter: ledgerCocktail, marks: COCKTAIL_MARKS, shared: 'why', twinName: (row) => ({ ...row, name: 'the lantern collins' }) }
];

const items = (house: House, w: Wing) => house[w.list] as unknown as Array<HouseItem & Fields>;
const rowsOf = (house: House, w: Wing) => syncOut(w.kind, house, w.adapter);
const strip = (rows: Row[], key: string) => rows.map((r) => { const o = { ...r }; delete o[key]; return o; });
const what = (changes: Array<{ id: string; what: string }>, id: string) => changes.filter((c) => c.id === id).map((c) => c.what).sort();

/* -------------------------------------------------------------------------
 * The tombstone and a row that carries no house
 * ---------------------------------------------------------------------- */

for (const w of WINGS) {
	describe(`a deleted ${w.kind} and a stale backup row`, () => {
		/*
		 * house-sync.ts 521 to 546: the tombstone is read only for a row whose
		 * scope is "ours". A row with no house stamp, or with a house the device
		 * does not know, is adopted whole at 529 and its tombstone deleted at 532
		 * whatever the stamps say. So the same row, last touched BEFORE the
		 * delete, is dropped when it carries the current house id and
		 * resurrected when it carries none: a pre-migration backup (every
		 * Ledger and Codex row before piece 3 and 4 carries no house) or a
		 * backup from another device brings back a dish a person deleted, and
		 * takes the tombstone with it, so the delete can no longer travel by
		 * pack to the other devices either. Rule 4 compares a stamp with a
		 * stamp; the scope of the row has no bearing on which is newer.
		 */
		it('is not resurrected by a backup row with no house that was last touched before the delete', () => {
			const house = clone(fixture);
			const rows = rowsOf(house, w);
			const gone = items(house, w)[0];
			const touch = lastTouch(gone, w.marks);
			house[w.list] = (house[w.list] as unknown as Fields[]).slice(1) as never;
			house.removed[gone.id] = touch + 10;
			const ours = syncIn(w.kind, rows, house, w.adapter, { now: NOW, knownHouses: [HOUSE_ID] });
			expect(what(ours.changes, gone.id)).toEqual(['row-removed']);
			const legacy = rows.map((row, i) => (i ? row : strip([row], 'house')[0]));
			const r = syncIn(w.kind, legacy, house, w.adapter, { now: NOW, knownHouses: [HOUSE_ID] });
			expect(what(r.changes, gone.id)).toEqual(['row-removed']);
			expect(r.house.removed[gone.id]).toBe(touch + 10);
			expect(items(r.house, w).map((i) => i.id)).not.toContain(gone.id);
		});

		it('is not resurrected by a backup row from a house the device does not know, either', () => {
			const house = clone(fixture);
			const rows = rowsOf(house, w);
			const gone = items(house, w)[0];
			const touch = lastTouch(gone, w.marks);
			house[w.list] = (house[w.list] as unknown as Fields[]).slice(1) as never;
			house.removed[gone.id] = touch + 10;
			const foreign = rows.map((row, i) => (i ? row : { ...row, house: 'h-othrdev' }));
			const r = syncIn(w.kind, foreign, house, w.adapter, { now: NOW, knownHouses: [HOUSE_ID] });
			expect(what(r.changes, gone.id)).toEqual(['row-removed']);
			expect(r.house.removed[gone.id]).toBe(touch + 10);
		});
	});
}

/* -------------------------------------------------------------------------
 * The Ledger: a keep on a row-only mark, and the placeholder
 * ---------------------------------------------------------------------- */

describe('the Ledger and a person\'s keep on a mark the House has no field for', () => {
	/*
	 * The Ledger's MAITRE_FIELDS (ui-menu.js:58) carry her marks on method,
	 * glass and garnish, which the House has no field for; the sync keeps
	 * them on the row's block, carried whole. But rule 4 at house-sync.ts
	 * 535 reads lastTouch(asItem, adapter.marks), and asItem comes from
	 * fromRow, which reads only the shared marks (readBlock, 311), so a
	 * person's keep on the glass line is invisible to the touch. A delete on
	 * one device older than that keep drops the row and the kept line with
	 * it: the very case lastTouch's own comment (house-merge.ts 184 to 194)
	 * says must not happen.
	 */
	it('counts a person\'s keep on the glass line as a touch, so a delete older than it does not drop the row', () => {
		const w = WINGS[2];
		const house = clone(fixture);
		const rows = rowsOf(house, w);
		const gone = items(house, w)[0];
		const touch = lastTouch(gone, w.marks);
		house[w.list] = (house[w.list] as unknown as Fields[]).slice(1) as never;
		house.removed[gone.id] = touch + 10;
		const kept = rows.map((row, i) => (i ? row : { ...row, maitre: { ...(row.maitre as Fields), glass: mark('a coupe, chilled', 'person', touch + 20) } }));
		const r = syncIn(w.kind, kept, house, w.adapter, { now: NOW, knownHouses: [HOUSE_ID] });
		expect(what(r.changes, gone.id)).toEqual(['item-added']);
		const row = r.rows.find((x) => x.id === gone.id) as Row;
		expect(row).toBeDefined();
		expect((row.maitre as Fields).glass).toEqual(mark('a coupe, chilled', 'person', touch + 20));
	});
});

describe('the Ledger placeholder against the wing\'s own door', () => {
	/*
	 * The design table says the Ledger's empty glass or garnish is "read as
	 * empty, written back as the dash", and writePlaceholder (house-sync.ts
	 * 164) does that. But the WING's own door does not: normalizeBarRecord
	 * (ui-menu.js:91) stores glass: barText(b.glass), and barText (ui-menu.js
	 * 44 to 50) reads the dash as ''. Its comment at 174 to 177 says so in
	 * words: "The wing keeps '' for an empty glass or garnish and lets
	 * ticketHTML draw the dash at display time; the standalone writes the
	 * dash into the record, and that is the one place the two disagree."
	 * The plan files every sync row through saveBarRecord, so a row the sync
	 * writes with the dash comes back through the door with '', and the next
	 * sync writes the dash again: one spurious row-updated per boot, for
	 * ever, on every drink with an empty glass or garnish. The placeholder
	 * was the standalone's; this wing wanted empty.
	 */
	const barText = (v: unknown): string => {
		const s = String(v == null ? '' : v).trim();
		return s.length === 1 && [0x2d, 0x2013, 0x2014].includes(s.charCodeAt(0)) ? '' : s;
	};
	const door = (row: Row): Row => ({ ...row, glass: barText(row.glass), garnish: barText(row.garnish) });

	it('writes an empty glass the way the wing stores it, so a row back through the door is not rewritten on every sync', () => {
		const w = WINGS[2];
		const house = clone(fixture);
		items(house, w)[0].glass = '';
		const out = rowsOf(house, w);
		/* The sync writes what the wing stores: a row written with the dash
		   could never rest, since toRow over the filed row would write the
		   dash again and the change below could not be empty. */
		expect(out[0].glass).toBe('');
		const filed = out.map(door);
		expect(filed[0].glass).toBe('');
		const r = syncIn(w.kind, filed, house, w.adapter, { now: NOW, knownHouses: [HOUSE_ID] });
		expect(r.changes).toEqual([]);
		expect(r.rows).toBe(filed);
	});
});

/* -------------------------------------------------------------------------
 * The name twin and what the wing is told
 * ---------------------------------------------------------------------- */

for (const w of WINGS) {
	describe(`a re-keyed name twin, ${w.kind}`, () => {
		/*
		 * The plan's rule 2 says a name twin is re-keyed "through the wing's
		 * rename path (saveBarRecord(form, oldId) moves the 'My Bar . name'
		 * card; the Codex through cellarSanitize with the id replaced)". The
		 * sync's own rename (house-sync.ts 373) is a spread with a new id, and
		 * the change it reports (492) is { id: item.id, what: 'renamed' }: the
		 * former id is not in the result. The wing cannot call its own rename
		 * door without it, and must diff the row lists by index to find which
		 * row went, an index that shifts after a row-removed. For the Ledger
		 * the row's NAME can change in the same pass too (the item newer than
		 * the hand-typed twin wins the plain fields), and its SRS card is keyed
		 * by name (app.js:944, 'My Bar . ' + b.name), so the card for the typed
		 * name is orphaned unless the wing learns the old name as well.
		 */
		it('reports the former id beside the new one, so the wing can run its own rename door', () => {
			const house = clone(fixture);
			const rows = rowsOf(house, w);
			const first = items(house, w)[0];
			const typedId = rows[0].id.slice(0, 2) + 'handtyp1';
			const twin = strip([w.twinName({ ...rows[0], id: typedId, ts: first.ts - 50 })], 'house')[0];
			const r = syncIn(w.kind, [twin, ...rows.slice(1)], house, w.adapter, { now: NOW, knownHouses: [HOUSE_ID] });
			const renamed = r.changes.find((c) => c.what === 'renamed') as (Fields & { id: string }) | undefined;
			expect(renamed).toBeDefined();
			expect(renamed!.id).toBe(first.id);
			expect(renamed!.from).toBe(typedId);
		});
	});
}

/* -------------------------------------------------------------------------
 * The Codex: a comma inside a grape name
 * ---------------------------------------------------------------------- */

describe('the Codex grapes line', () => {
	/*
	 * joinGrapes (house-sync.ts 173) joins the House's list on a comma and
	 * splitGrapes (174 to 178) splits the row's string on every comma, so a
	 * grape entry that carries a comma of its own comes back as two entries
	 * the moment the cellar row is newer than the item (settleTwin 423 takes
	 * rowPlain whole). The text is the same; the list is not, and a pack that
	 * named the blend as one entry is rewritten on the first edit of the
	 * bottle's style on the Codex.
	 */
	it('keeps one grape entry one entry when the cellar wins the plain fields', () => {
		const w = WINGS[1];
		const house = clone(fixture);
		const wine = items(house, w)[0];
		wine.grapes = ['Grenache, Syrah and Mourvedre'];
		const rows = rowsOf(house, w);
		expect(rows[0].grapes).toBe('Grenache, Syrah and Mourvedre');
		const edited = rows.map((row, i) => (i ? row : { ...row, style: 'edited on the Codex', ts: wine.ts + 50 }));
		const r = syncIn(w.kind, edited, house, w.adapter, { now: NOW, knownHouses: [HOUSE_ID] });
		expect(items(r.house, w)[0].style).toBe('edited on the Codex');
		expect(items(r.house, w)[0].grapes).toEqual(['Grenache, Syrah and Mourvedre']);
	});
});

/* -------------------------------------------------------------------------
 * An item that carries another house's id
 * ---------------------------------------------------------------------- */

for (const w of WINGS) {
	describe(`an item stamped with another house's id, ${w.kind}`, () => {
		/*
		 * toRow (house-sync.ts 337) writes row.house = item.house, the ITEM's
		 * stamp, not the id of the house the sync was handed. normaliseHouse
		 * forces every item's house to the record's id (house-normalise.ts
		 * 362) and mergeHouse re-stamps theirs (house-merge.ts 328), but
		 * loadHouse (house-store.ts 423) hands a stored record back raw and the
		 * sync takes the item's word for it. When the stamp names ANOTHER house
		 * on the device's index, the row the sync adds is foreign to the next
		 * sync, the item has no twin again, and a fresh row is added on every
		 * run: syncIn is not idempotent, and the projection grows by one row
		 * per boot. The row of this house belongs to this house's id.
		 */
		it('files its row under the id of the house being synced, and a second run changes nothing', () => {
			const house = clone(fixture);
			const stray = items(house, w)[0];
			stray.house = 'h-neighbr1';
			const r1 = syncIn(w.kind, [], house, w.adapter, { now: NOW, knownHouses: [HOUSE_ID, 'h-neighbr1'] });
			const filed = r1.rows.find((row) => row.id === stray.id) as Row;
			expect(filed.house).toBe(HOUSE_ID);
			const r2 = syncIn(w.kind, r1.rows, r1.house, w.adapter, { now: NOW + 1, knownHouses: [HOUSE_ID, 'h-neighbr1'] });
			expect(r2.changes).toEqual([]);
			expect(r2.rows.filter((row) => row.id === stray.id)).toHaveLength(1);
		});
	});
}

/* -------------------------------------------------------------------------
 * Two houses on one device sharing an item id
 * ---------------------------------------------------------------------- */

for (const w of WINGS) {
	describe(`one item id under two houses on one device, ${w.kind}`, () => {
		/*
		 * "Add as a new house" re-mints the house id and keeps every item id
		 * (restampHouse, house-pack.ts 157 to 164), so two houses on one
		 * device can hold the same d-, w- or b- id. The sync leaves a foreign
		 * row alone (rule 3) and files this house's item as a new row (rule 2),
		 * so the projection ends with two rows under one id. Every wing's own
		 * save finds its record by id (progress.bar, ST.cellar, the Table's
		 * dishes), so the first wins and the other house's row is overwritten
		 * or shadowed. The sync neither refuses the collision nor reports it.
		 */
		it('does not file a second row under an id another house already holds in the projection', () => {
			const house = clone(fixture);
			const rows = rowsOf(house, w);
			const foreign = [{ ...rows[0], house: 'h-sibling1' }];
			const r = syncIn(w.kind, foreign, house, w.adapter, { now: NOW, knownHouses: [HOUSE_ID, 'h-sibling1'] });
			const ids = r.rows.map((row) => row.id);
			expect(new Set(ids).size).toBe(ids.length);
		});
	});
}

/* -------------------------------------------------------------------------
 * An empty house and a row with no house, with a tombstone
 * ---------------------------------------------------------------------- */

describe('the implicit house minted over rows that include a deleted dish', () => {
	/*
	 * The same hole as the first block seen from the migration path: a hand
	 * house minted at T with no items and a tombstone written by a delete in
	 * another wing after the row's last touch. The rows then arrive with no
	 * house (the implicit house's rows) and rule 3 adopts the deleted one
	 * whole, deleting the tombstone. Written once more so the case stays
	 * red for the empty-house path even if the first block is closed by a
	 * check that reads the items list.
	 */
	it('does not adopt a row the house has a newer tombstone for', () => {
		const w = WINGS[0];
		const rows = strip(rowsOf(fixture, w), 'house');
		const gone = rows[0];
		const touch = lastTouch(w.adapter.fromRow(gone), w.marks);
		const empty = emptyHouse(HOUSE_ID, 'My house', 'hand', touch + 5);
		empty.removed[gone.id] = touch + 10;
		const r = syncIn(w.kind, rows, empty, w.adapter, { now: NOW, knownHouses: [HOUSE_ID] });
		expect(what(r.changes, gone.id)).toEqual(['row-removed']);
		expect(r.house.removed[gone.id]).toBe(touch + 10);
	});
});
