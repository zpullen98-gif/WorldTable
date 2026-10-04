/**
 * The projections and the sync: each wing's own list (the Table's dishes,
 * the Ledger's progress.bar, the Codex's ST.cellar) is a PROJECTION of the
 * House, and this module keeps the two in step without removing anything a
 * person did not remove. Every comment here ships inside the ported
 * static/shared/oot-house.js (comments kept, assertClean refusing any dash
 * spelling and any regex literal outside ASCII), so the comments are
 * dash-free and the regexes ASCII.
 *
 * PURE AND PORTABLE. No import from outside src/lib/house, no DOM, no
 * Svelte, no Node, no clock: the rows come in as an argument and go out as a
 * result, and the wing writes them through its own door (addDish,
 * saveBarRecord, cellarSanitize). The port joins this module with
 * house-schema.ts and house-merge.ts in one IIFE, so no top-level name here
 * repeats one declared there.
 *
 * THE RULES (the plan's, in substance):
 *   1. Twin by id: the newer ts wins the shared plain fields per side (tie,
 *      nothing moves); every shared mark settles by pickMark; kept unions,
 *      but for a superseded edition's notes on the rows (staleEditionNotes).
 *      Written only when something changed.
 *   2. No twin by id: a twin by FOLDED NAME within the same house is re-keyed
 *      to the item's id through the adapter's rename and reported renamed,
 *      with the former id beside the new one so the wing can run its own
 *      rename door. Only then a twin-less item becomes a row, and not even
 *      then when a row of another house on the device already holds the id
 *      in the projection: the wing's list keys by id, so the item waits and
 *      is reported row-held.
 *   3. A row with no house, or with a house not on the device, is adopted
 *      into the current house and its item added.
 *   4. A row that has no item leaves only when the house's tombstone for it
 *      is newer than the row's last touch; otherwise the item is added. The
 *      row's scope has no bearing on which stamp is newer: a backup from
 *      before the house, or from a device this one does not know, must not
 *      bring back what a person deleted, nor take the tombstone with it. The
 *      touch is read over every mark on the row's block, including the ones
 *      the House has no field for, so a person's keep there counts.
 *   5. syncIn REMOVES nothing else, ever. An empty house with a full
 *      projection adopts the rows, never the reverse.
 *   6. Every row and every item of the house carries the id of the house
 *      being synced, whatever stamp a stored item arrived with.
 *   7. A row whose id the client's key sweep would refuse (FORBIDDEN_KEY;
 *      the wings mint eight random base36 characters, so 'nut', 'free' or
 *      'safe' can land in one) never enters the house under that id,
 *      because a tombstone in `removed` is a KEY: the day the item is
 *      removed, its id would make the record one the client refuses and
 *      the pack one no device imports. The row is re-keyed to a fresh id
 *      through the adapter's rename, as a name twin is, and reported
 *      renamed with the former id beside it.
 *   8. ONE ROW THROUGH THE WING'S OWN DOOR (opts.oneRow, the api's put) is
 *      not the wing's whole list, and two rules bend for it. Rule 2 does
 *      not run: the wake has already paired every name twin, so a row
 *      with no twin by id is a dish the person just added, and pairing it
 *      with an item by name would re-key it onto an id the wing's list
 *      already holds under the item's own row (the put cannot see that
 *      row). It is added as a new item. And the row's block is the whole
 *      block: a shared mark the item holds and the row lacks is a mark
 *      the person DISCARDED on the wing, and it leaves the item, her mark
 *      or a kept one alike (a person's Discard is theirs, as their Keep
 *      is). A wing therefore hands put the row with its block whole, as
 *      the Table's saveDish carries maitre; the whole-list wake keeps the
 *      merge, because a wake's rows may be a backup older than the house.
 *
 * NO ALLERGEN FIELD ON ANY SHAPE HERE. A wing's row may carry fields of its
 * own that the House never sees; toRow carries every such field whole from
 * the previous row, by not naming any of them, and fromRow reads only the
 * fields the description names, so nothing of a row's own ever enters the
 * House by this door.
 */
import type { House, HouseItem, ItemKind, Mark, Note } from './house-schema';
import { ID_PREFIXES, isMark, isNote, mintId } from './house-schema';
import { FORBIDDEN_KEY } from './house-normalise';
import { EDITION_NOTE_SPREAD, listOfKind, mergeKept, pickMark, sameJson } from './house-merge';

/* -------------------------------------------------------------------------
 * The shapes
 * ---------------------------------------------------------------------- */

/** The least a projection row carries: the shared id, a stamp, and a house once it is adopted. */
export type SyncRow = { id: string; ts: number; house?: string } & Record<string, unknown>;

/** A plain record view of an item or a row, for the field loops. */
type Fields = Record<string, unknown>;

/**
 * One shared plain field: its name on the item, its name on the row, and
 * how it is written out to the row and read back in. With no codec the
 * value is copied as it is.
 */
export interface SharedField {
	item: string;
	row: string;
	out?: (v: unknown) => unknown;
	in?: (v: unknown) => unknown;
}

/**
 * A projection, as data: which plain fields and which marks travel both
 * ways, what an adopted row's house-only fields start as, how a row and an
 * item are named for the fold-twin rule, and the touches the wing's own door
 * would make (the Ledger's draft flag). Everything a wing's row carries
 * beyond this is the wing's own and is carried whole from the previous row.
 */
export interface ProjectionSpec<R extends SyncRow> {
	kind: ItemKind;
	/** The plain fields shared both ways. id, house and ts are handled by the sync itself. */
	shared: readonly SharedField[];
	/** The marks shared both ways, under row.maitre with kept; the kind's other marks are House-only. */
	marks: readonly string[];
	/** Whether row.house is written when the house id is empty. The Ledger and the Codex carry it only when set. */
	houseAlways: boolean;
	/** The house-only fields an item adopted from a row starts with, given the row. */
	blank: (row: R) => Fields;
	/** The fields read off the row beyond the shared pairs (the Codex's display name). */
	derive?: (row: R) => Fields;
	/** The name a row and an item are folded by, for the twin-by-name rule. */
	rowName: (row: R) => string;
	itemName: (item: HouseItem) => string;
	foldName: (name: string) => string;
	/** The last touch on a row the wing's own door would make. */
	finish?: (row: R) => R;
}

/** The adapter the sync calls: the four doors, and the description they were built from. */
export interface SyncAdapter<R extends SyncRow> {
	kind: ItemKind;
	/** The item-side names of every plain field the row may hand the item. */
	shared: readonly string[];
	marks: readonly string[];
	toRow: (item: HouseItem, prevRow: R | undefined) => R;
	/**
	 * The row as an item. With a reference item, a shared field whose value on
	 * the row is the reference's own value written out reads back as the
	 * reference's value, not as the codec's reading of the text: the Codex
	 * keeps grapes as one string, and a grape entry with a comma of its own
	 * must not come back as two entries because the cellar row was newer.
	 */
	fromRow: (row: R, ref?: HouseItem) => HouseItem;
	/** When a person last touched the row: its stamp, or any mark a person kept on its block, or any note kept, whichever is latest. */
	rowTouch: (row: R) => number;
	rename: (row: R, newId: string) => R;
	foldName: (name: string) => string;
	rowKey: (row: R) => string;
	itemKey: (item: HouseItem) => string;
}

/**
 * What happened to one id. A row the wing must write is one reported
 * row-updated, row-added, renamed or adopted (an adopted row is stamped with
 * the house id, and a twin's stamp is reported row-updated beside it); a row
 * reported row-removed has left the list the sync returns. A renamed change
 * carries the former id in from, so the wing can read the old name off its
 * own row by that id and run its own rename door (the Ledger's SRS card is
 * keyed by name). A row-held change names an item with no row because a row
 * of another house on the device holds the id in the projection: nothing to
 * write, and the house keeps the item.
 */
export type SyncWhat = 'row-updated' | 'item-updated' | 'row-added' | 'item-added' | 'row-removed' | 'row-held' | 'renamed' | 'adopted';
export interface SyncChange {
	id: string;
	what: SyncWhat;
	/** On renamed: the id the row carried before it was re-keyed to the item's. */
	from?: string;
}

export interface SyncOpts {
	/** The stamp for the house's lastWrite when the sync changed it. */
	now?: number;
	/**
	 * The house ids on the device's index. A row stamped with a house that is
	 * not among them came from another device and is adopted. Left out, no
	 * foreign row is adopted: without the index the sync cannot tell a
	 * neighbour's house from a stranger's, and leaving a row alone is the
	 * safe direction.
	 */
	knownHouses?: readonly string[];
	/** The random source for the fresh id a re-keyed row gets (rule 7); Math.random when absent. */
	rand?: () => number;
	/** Rule 8: the rows are one row the wing just saved through its own door, not its whole list. */
	oneRow?: boolean;
}

export interface SyncResult<R extends SyncRow> {
	/** The same object when nothing on the house changed. */
	house: House;
	/** The same array when no row changed; an unchanged row is the same object. */
	rows: R[];
	changes: SyncChange[];
}

/* -------------------------------------------------------------------------
 * The small codecs the three descriptions share
 * ---------------------------------------------------------------------- */

/* The row readers: a wing's own text as it is, never cut and never parsed,
   because a row is the wing's record and the normaliser's caps belong to
   the House. Named apart from the normaliser's coercions on purpose: the
   port keeps every module in one scope. */
const rowText = (v: unknown): string => (typeof v === 'string' ? v : '');
const rowTextList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []);
const rowStamp = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const copyList = (v: unknown): string[] => rowTextList(v).slice();

/**
 * The Ledger's placeholder for an empty glass or garnish: the standalone
 * writes a lone em dash there, and the wing's barText reads a lone hyphen,
 * en dash or em dash back as empty. The wing itself stores the empty string
 * and draws the dash at display time, and every row the sync writes goes
 * through the wing's own door, so the sync reads the placeholder and never
 * writes it: a row written with the dash would come back through the door
 * empty and be reported updated on every boot. Detected by code point, so
 * no dash is spelled in this file and the publish gate's count stands.
 */
const PLACEHOLDER_CODES = [0x2d, 0x2013, 0x2014];
function readPlaceholder(v: unknown): string {
	const s = rowText(v);
	const t = s.trim();
	return t.length === 1 && PLACEHOLDER_CODES.includes(t.charCodeAt(0)) ? '' : s;
}

/** The Ledger files a drink with no family or spirit under Other, and so does a row written here. */
const writeOther = (v: unknown): string => (rowText(v).trim() ? rowText(v) : 'Other');

/** The Codex keeps grapes as one string; the House keeps a list. Joined on a comma and a space, split on the comma. */
const joinGrapes = (v: unknown): string => rowTextList(v).filter((s) => s.trim()).join(', ');
const splitGrapes = (v: unknown): string[] =>
	rowText(v)
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);

/**
 * The desk's foldName, copied line for line rather than imported, for the
 * Table and the Codex: accents off, lower case, punctuation and runs of
 * space down to one space, so two spellings of one dish are one dish.
 */
export function foldHouseName(name: string): string {
	return String(name == null ? '' : name)
		.normalize('NFD')
		.replace(/[\u0300-\u036F]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

/** The Ledger's own clash rule (ui-menu.js saveBarRecord): the name lower-cased, nothing more. */
export function foldBarName(name: string): string {
	return String(name == null ? '' : name).trim().toLowerCase();
}

const plain = (item: string, row: string = item): SharedField => ({ item, row });

/* -------------------------------------------------------------------------
 * The three projections, as data
 * ---------------------------------------------------------------------- */

/**
 * The Table's MenuDish. Shared: name, section, description, ingredients,
 * price, the six marks of its maitre block and kept. The Table's own fields
 * (the allergen line it alone keeps, the recipe pointer) stay on the row,
 * carried whole and never named here. House-only: parts, lines, pairing,
 * serviceNote, meals, prices, the printed marks, signature.
 */
export const TABLE_DISH: ProjectionSpec<SyncRow> = {
	kind: 'dish',
	shared: [
		plain('name'),
		plain('section'),
		plain('description'),
		{ item: 'ingredients', row: 'ingredients', out: copyList, in: copyList },
		plain('price')
	],
	marks: ['say', 'guest', 'why', 'pairs', 'origin', 'ingredientsNamed'],
	houseAlways: true,
	blank: () => ({ meals: [], prices: [], marks: [], signature: false, serviceNote: '' }),
	rowName: (row) => rowText(row.name),
	itemName: (item) => item.name,
	foldName: foldHouseName
};

/**
 * The Ledger's progress.bar record. Shared: name, spec, method, glass,
 * garnish, note, family, spirit, price, the marks the House has a field for
 * and kept. Her marks on method, glass and garnish have no House field and
 * stay on the row's block, carried whole. A row carries house only when it
 * is set, so the Ledger's eleven-key pin on a record filed without one
 * holds. draft is derived from the spec the way saveBarRecord derives it.
 * House-only: parts, lines, upsells, zeroProof, serviceNote.
 */
export const LEDGER_COCKTAIL: ProjectionSpec<SyncRow> = {
	kind: 'cocktail',
	shared: [
		plain('name'),
		{ item: 'spec', row: 'spec', out: copyList, in: copyList },
		plain('method'),
		{ item: 'glass', row: 'glass', in: readPlaceholder },
		{ item: 'garnish', row: 'garnish', in: readPlaceholder },
		plain('note'),
		{ item: 'family', row: 'family', out: writeOther },
		{ item: 'spirit', row: 'spirit', out: writeOther },
		plain('price')
	],
	marks: ['say', 'guest', 'why', 'pairs', 'origin', 'ingredientsNamed'],
	houseAlways: false,
	blank: () => ({ section: '', meals: [], prices: [], zeroProof: false, serviceNote: '' }),
	rowName: (row) => rowText(row.name),
	itemName: (item) => item.name,
	foldName: foldBarName,
	finish: (row) => {
		const out: SyncRow = { ...row };
		if (rowTextList(out.spec).length) delete out.draft;
		else out.draft = true;
		return out;
	}
};

/**
 * The Codex's ST.cellar bottle. Shared: producer, the wine's name (the
 * row's name is the House's wine), vintage, region, grapes (one string on
 * the row), style, glass, bottle, the five marks and kept. The bottle's note
 * has no House field and stays on the row. The item's display name is
 * producer, wine and vintage in one line, read off the row whenever the row
 * wins, so the house says what the cellar says. House-only: profile,
 * goesWith, firstPickIds, serve, pours, serviceNote, parts, lines; the price
 * starts as the glass price when a bottle is adopted and is the house's
 * after that.
 */
export const CODEX_WINE: ProjectionSpec<SyncRow> = {
	kind: 'wine',
	shared: [
		plain('producer'),
		plain('wine', 'name'),
		plain('vintage'),
		plain('region'),
		{ item: 'grapes', row: 'grapes', out: joinGrapes, in: splitGrapes },
		plain('style'),
		plain('glass'),
		plain('bottle')
	],
	marks: ['say', 'guest', 'why', 'pairs', 'origin'],
	houseAlways: false,
	blank: (row) => ({ section: '', meals: [], price: rowText(row.glass), prices: [], pours: [], serviceNote: '' }),
	derive: (row) => ({ name: wineDisplayName(rowText(row.producer), rowText(row.name), rowText(row.vintage)) }),
	rowName: (row) => [row.producer, row.name, row.vintage].map(rowText).join('|'),
	itemName: (item) => (item.kind === 'wine' ? [item.producer, item.wine, item.vintage].join('|') : item.name),
	foldName: (name) => name.split('|').map(foldHouseName).join('|')
};

/** The one line a wine is called by: producer, wine and vintage, whichever are there. */
export function wineDisplayName(producer: string, wine: string, vintage: string): string {
	return [producer, wine, vintage].filter((s) => s.trim()).join(' ');
}

/* -------------------------------------------------------------------------
 * From a description to the four doors
 * ---------------------------------------------------------------------- */

/** The marks and kept a row's block carries that this projection shares, screened by shape. */
function readBlock(block: unknown, marks: readonly string[]): Fields {
	const out: Fields = {};
	if (!block || typeof block !== 'object' || Array.isArray(block)) return out;
	const b = block as Fields;
	for (const f of marks) if (isMark(b[f])) out[f] = b[f];
	const kept = Array.isArray(b.kept) ? b.kept.filter(isNote) : [];
	if (kept.length) out.kept = kept;
	return out;
}

/** The marks on a block or an item, each the same mark with its value copied, so a row and an item never share one list. */
function copyMark(m: Mark<unknown>): Mark<unknown> {
	const value = Array.isArray(m.value) ? m.value.slice() : m.value && typeof m.value === 'object' ? { ...(m.value as Fields) } : m.value;
	const out: Mark<unknown> = { value, by: m.by, ts: m.ts };
	if (m.model !== undefined) out.model = m.model;
	return out;
}

/**
 * The four doors from one description. toRow starts from the previous row
 * so every field of the wing's own rides through untouched, then writes the
 * shared fields, the stamp and the block; a key the row had keeps its place,
 * so a row written twice is the same bytes. fromRow starts from the blank
 * house-only fields and reads only what the description names.
 */
export function adapterFrom<R extends SyncRow>(spec: ProjectionSpec<R>): SyncAdapter<R> {
	const toRow = (item: HouseItem, prevRow: R | undefined): R => {
		const it = item as unknown as Fields;
		const out: Fields = prevRow ? { ...prevRow } : {};
		out.id = item.id;
		if (spec.houseAlways || item.house) out.house = item.house;
		else delete out.house;
		for (const f of spec.shared) out[f.row] = f.out ? f.out(it[f.item]) : it[f.item];
		out.ts = item.ts;
		const block: Fields = prevRow && prevRow.maitre && typeof prevRow.maitre === 'object' ? { ...(prevRow.maitre as Fields) } : {};
		for (const f of spec.marks) {
			if (isMark(it[f])) block[f] = copyMark(it[f] as Mark<unknown>);
			else delete block[f];
		}
		const kept = Array.isArray(it.kept) ? (it.kept as unknown[]).filter(isNote).map((n) => ({ ...n })) : [];
		if (kept.length) block.kept = kept;
		else delete block.kept;
		if (Object.keys(block).length) out.maitre = block;
		else delete out.maitre;
		const row = out as R;
		return spec.finish ? spec.finish(row) : row;
	};

	const fromRow = (row: R, ref?: HouseItem): HouseItem => {
		const out: Fields = { id: row.id, house: rowText(row.house), kind: spec.kind, name: '', ...spec.blank(row) };
		const refFields = ref as unknown as Fields | undefined;
		for (const f of spec.shared) {
			const raw = row[f.row];
			/* The reference's value, when the row holds that value written out:
			   the text is the same, so the reading must be the same. */
			if (refFields && f.out && f.item in refFields && sameJson(f.out(refFields[f.item]), raw)) {
				const v = refFields[f.item];
				out[f.item] = Array.isArray(v) ? v.slice() : v;
			} else out[f.item] = f.in ? f.in(raw) : rowText(raw);
		}
		if (spec.derive) Object.assign(out, spec.derive(row));
		const block = readBlock(row.maitre, spec.marks);
		for (const f of spec.marks) if (isMark(block[f])) out[f] = copyMark(block[f] as Mark<unknown>);
		if (block.kept) out.kept = (block.kept as Note[]).map((n) => ({ ...n }));
		out.ts = rowStamp(row.ts);
		return out as unknown as HouseItem;
	};

	/* lastTouch's rule over the row's whole block, not the shared marks alone:
	   the Ledger keeps her marks on method, glass and garnish there, and a
	   person's keep on one of them is a touch the tombstone rule must see. */
	const rowTouch = (row: R): number => {
		let t = rowStamp(row.ts);
		const block = row.maitre;
		if (!block || typeof block !== 'object' || Array.isArray(block)) return t;
		const b = block as Fields;
		for (const f of Object.keys(b)) {
			const m = b[f];
			if (isMark(m) && m.by === 'person' && m.ts > t) t = m.ts;
		}
		if (Array.isArray(b.kept)) for (const n of b.kept) if (isNote(n) && n.ts > t) t = n.ts;
		return t;
	};

	const derived = spec.derive ? Object.keys(spec.derive({ id: '', ts: 0 } as R)) : [];
	return {
		kind: spec.kind,
		shared: [...spec.shared.map((f) => f.item), ...derived],
		marks: spec.marks,
		toRow,
		fromRow,
		rowTouch,
		rename: (row, newId) => ({ ...row, id: newId }),
		foldName: spec.foldName,
		rowKey: (row) => spec.foldName(spec.rowName(row)),
		itemKey: (item) => spec.foldName(spec.itemName(item))
	};
}

export const tableDish = adapterFrom(TABLE_DISH);
export const ledgerCocktail = adapterFrom(LEDGER_COCKTAIL);
export const codexWine = adapterFrom(CODEX_WINE);

/* -------------------------------------------------------------------------
 * The sync
 * ---------------------------------------------------------------------- */

/** Where a row stands to the current house. */
type Scope = 'ours' | 'adoptable' | 'foreign';

const NO_STAMPS: ReadonlySet<number> = new Set<number>();

/**
 * The note stamps a wing's rows carry that belong to an edition the house no
 * longer holds: a stamp shared by the notes of at least EDITION_NOTE_SPREAD
 * rows (an edition's, never a person's, who keeps one note at a time) that no
 * note in the house carries. A refresh replaces an old edition's notes in the
 * house; without this the rows, which still hold them, would union them
 * straight back in at the next wake. A person's note on a row, under its own
 * stamp, is never stale.
 */
function staleEditionNotes(rows: readonly SyncRow[], items: readonly HouseItem[]): Set<number> {
	const spread = new Map<number, number>();
	for (const row of rows) {
		const block = row.maitre;
		if (!block || typeof block !== 'object' || Array.isArray(block)) continue;
		const kept = (block as Fields).kept;
		if (!Array.isArray(kept)) continue;
		const seen = new Set<number>();
		for (const n of kept) if (isNote(n)) seen.add(n.ts);
		for (const t of seen) spread.set(t, (spread.get(t) || 0) + 1);
	}
	const out = new Set<number>();
	for (const [t, n] of spread) if (n >= EDITION_NOTE_SPREAD) out.add(t);
	if (!out.size) return out;
	for (const item of items) {
		const kept = (item as unknown as Fields).kept;
		if (Array.isArray(kept)) for (const n of kept) if (isNote(n)) out.delete(n.ts);
	}
	return out;
}

/**
 * A twin settled: the shared plain fields from the newer side, the marks by
 * pickMark on their own stamps, kept unioned, the house id the house's. On
 * equal stamps neither side's plain fields move. The row comes back through
 * toRow over the old row, so its own fields ride along. Through the wing's
 * own door (rule 8) a mark the row lacks is a discard and does not settle.
 */
function settleTwin<R extends SyncRow>(item: HouseItem, row: R, houseId: string, adapter: SyncAdapter<R>, oneRow: boolean, stale: ReadonlySet<number> = NO_STAMPS): { item: HouseItem; row: R } {
	const mine = item as unknown as Fields;
	const rowItem = adapter.fromRow(row, item) as unknown as Fields;
	/* A superseded edition's notes on the row give way to the house's: see staleEditionNotes. */
	if (stale.size && Array.isArray(rowItem.kept)) rowItem.kept = (rowItem.kept as unknown[]).filter((n) => !(isNote(n) && stale.has(n.ts)));
	const settled: Fields = {};
	for (const f of adapter.marks) {
		const theirs = isMark(rowItem[f]) ? (rowItem[f] as Mark<unknown>) : undefined;
		if (oneRow && !theirs) continue;
		const m = pickMark(isMark(mine[f]) ? (mine[f] as Mark<unknown>) : undefined, theirs);
		if (m) settled[f] = m;
	}
	const kept = mergeKept(mine.kept as unknown[] | undefined, rowItem.kept as unknown[] | undefined);
	const rowPlain: Fields = {};
	for (const f of adapter.shared) if (f in rowItem) rowPlain[f] = rowItem[f];
	const withMarks = (base: Fields): Fields => {
		const o: Fields = { ...base, house: houseId };
		for (const f of adapter.marks) {
			if (settled[f]) o[f] = settled[f];
			else delete o[f];
		}
		if (kept.length) o.kept = kept;
		else delete o.kept;
		return o;
	};
	const itemNewer = item.ts > row.ts;
	const rowNewer = row.ts > item.ts;
	const itemBase = rowNewer ? { ...mine, ...rowPlain, ts: row.ts } : mine;
	const rowBase = itemNewer ? mine : { ...mine, ...rowPlain, ts: row.ts };
	return {
		item: withMarks(itemBase) as unknown as HouseItem,
		row: adapter.toRow(withMarks(rowBase) as unknown as HouseItem, row)
	};
}

/**
 * One wing's rows and the house, brought into step by the five rules above.
 * Returns the house (the same object when nothing changed), the rows as the
 * wing should now hold them (the same array when nothing changed, and every
 * unchanged row the same object), and what happened per id. The wing writes
 * the rows through its own door and the house through the store, projection
 * first, House second.
 */
export function syncIn<R extends SyncRow>(
	kind: ItemKind,
	rows: readonly R[],
	house: House,
	adapter: SyncAdapter<R>,
	opts: SyncOpts = {}
): SyncResult<R> {
	const list = listOfKind(kind);
	if (!list) throw new Error('syncIn: no list for the kind ' + kind);
	const items = house[list] as unknown as HouseItem[];
	const now = opts.now === undefined ? Date.now() : opts.now;
	const oneRow = opts.oneRow === true;
	const known = new Set<string>(opts.knownHouses || []);
	const withIndex = opts.knownHouses !== undefined;
	const scopeOf = (row: R): Scope => {
		if (row.house === house.id) return 'ours';
		if (!row.house) return 'adoptable';
		return withIndex && !known.has(row.house) ? 'adoptable' : 'foreign';
	};

	const changes: SyncChange[] = [];
	const rowsOut: Array<R | undefined> = rows.slice();
	const scopes = rows.map(scopeOf);
	const claimed = new Set<number>();
	const byId = new Map<string, number>();
	const byKey = new Map<string, number[]>();
	const heldByOthers = new Set<string>();
	rows.forEach((row, i) => {
		if (scopes[i] === 'foreign') {
			heldByOthers.add(row.id);
			return;
		}
		if (!byId.has(row.id)) byId.set(row.id, i);
		const key = adapter.rowKey(row);
		const at = byKey.get(key);
		if (at) at.push(i);
		else byKey.set(key, [i]);
	});
	const itemIds = new Set(items.map((item) => item.id));
	const stale = oneRow ? NO_STAMPS : staleEditionNotes(rows.filter((_, i) => scopes[i] !== 'foreign'), items);
	/* Every id in play, so a fresh id (rule 7) clashes with no item and no row, this house's or another's. */
	const taken = new Set<string>(itemIds);
	rows.forEach((row) => taken.add(row.id));
	const prefix: string = ID_PREFIXES[list];
	const rand = opts.rand || Math.random;
	const freshId = (): string => {
		let id = mintId(prefix, taken, rand);
		for (let tries = 0; tries < 100 && FORBIDDEN_KEY.test(id); tries++) id = mintId(prefix, taken, rand);
		taken.add(id);
		return id;
	};

	const itemsOut: HouseItem[] = [];
	const newRows: R[] = [];
	let houseChanged = false;
	let rowsChanged = false;
	const removed: Record<string, number> = { ...house.removed };
	const seenItems = new Set<string>();

	for (const stored of items) {
		if (seenItems.has(stored.id)) continue;
		seenItems.add(stored.id);
		/* Rule 6: the item of this house carries this house's id. A stored
		   record comes back raw, and an item stamped with another house on the
		   device would file a row foreign to the next run, so the stamp is set
		   right here and the house reported changed. */
		let item = stored;
		if (stored.house !== house.id) {
			item = { ...stored, house: house.id } as HouseItem;
			changes.push({ id: item.id, what: 'item-updated' });
			houseChanged = true;
		}
		let at = byId.get(item.id);
		if (at === undefined || claimed.has(at)) {
			at = undefined;
			/* Rule 8: through the wing's own door no row is paired by name. */
			const cands = oneRow ? [] : byKey.get(adapter.itemKey(item)) || [];
			/* A row keyed to another item's id is that item's twin, never this one's by name. */
			const free = cands.find((i) => !claimed.has(i) && !itemIds.has(rows[i].id));
			if (free !== undefined) {
				rowsOut[free] = adapter.rename(rows[free], item.id);
				changes.push({ id: item.id, what: 'renamed', from: rows[free].id });
				rowsChanged = true;
				at = free;
			}
		}
		if (at === undefined) {
			if (heldByOthers.has(item.id)) {
				/* Another house's row holds the id: the wing's list keys by id, so
				   a second row would shadow or overwrite it. The item waits. */
				changes.push({ id: item.id, what: 'row-held' });
			} else if (oneRow) {
				/* The one row asked about is not this item's; the wing's other
				   rows are not this call's, and the item keeps whatever row it has. */
			} else {
				newRows.push(adapter.toRow(item, undefined));
				changes.push({ id: item.id, what: 'row-added' });
				rowsChanged = true;
			}
			itemsOut.push(item);
			continue;
		}
		claimed.add(at);
		const row = rowsOut[at] as R;
		if (scopes[at] === 'adoptable') changes.push({ id: item.id, what: 'adopted' });
		const settled = settleTwin(item, row, house.id, adapter, oneRow, stale);
		if (sameJson(settled.item, item)) itemsOut.push(item);
		else {
			itemsOut.push(settled.item);
			changes.push({ id: item.id, what: 'item-updated' });
			houseChanged = true;
		}
		if (!sameJson(settled.row, row)) {
			rowsOut[at] = settled.row;
			changes.push({ id: item.id, what: 'row-updated' });
			rowsChanged = true;
		}
	}

	rows.forEach((row, i) => {
		if (claimed.has(i) || scopes[i] === 'foreign') return;
		if (seenItems.has(row.id)) return;
		seenItems.add(row.id);
		/* Rule 4 first, whatever the row's scope: a tombstone newer than the
		   row's last touch is a delete the row has not seen, and the row goes.
		   An older tombstone is stale evidence against a row a person touched
		   since, so it goes instead and the row stays. */
		const tomb = removed[row.id];
		if (tomb !== undefined && tomb > adapter.rowTouch(row)) {
			rowsOut[i] = undefined;
			changes.push({ id: row.id, what: 'row-removed' });
			rowsChanged = true;
			return;
		}
		if (tomb !== undefined) delete removed[row.id];
		/* Rule 7: an id the key sweep would refuse is re-keyed before it enters. */
		let rowIn: R = row;
		if (FORBIDDEN_KEY.test(row.id)) {
			rowIn = adapter.rename(row, freshId());
			rowsOut[i] = rowIn;
			changes.push({ id: rowIn.id, what: 'renamed', from: row.id });
			rowsChanged = true;
		}
		const asItem = { ...adapter.fromRow(rowIn), house: house.id } as HouseItem;
		/* The row handed back in the adapter's shape, over itself so the wing's
		   own fields ride: a row written before a shared field existed (an old
		   record with no ingredients line) is then in step on the first wake,
		   and the next has nothing to say about it. An adopted row is reported
		   adopted (the house stamp is the change); a row already ours that the
		   shape moved is reported updated. */
		const shaped = adapter.toRow(asItem, rowIn);
		if (scopes[i] === 'adoptable') {
			rowsOut[i] = shaped;
			changes.push({ id: rowIn.id, what: 'adopted' });
			rowsChanged = true;
		} else if (!sameJson(shaped, rowIn)) {
			rowsOut[i] = shaped;
			changes.push({ id: rowIn.id, what: 'row-updated' });
			rowsChanged = true;
		}
		itemsOut.push(asItem);
		changes.push({ id: rowIn.id, what: 'item-added' });
		houseChanged = true;
	});

	const removedChanged = !sameJson(removed, house.removed);
	const houseOut = houseChanged || removedChanged ? ({ ...house, [list]: itemsOut, removed, lastWrite: now } as House) : house;
	const rowsFinal = rowsChanged ? [...rowsOut.filter((r): r is R => r !== undefined), ...newRows] : (rows as R[]);
	return { house: houseOut, rows: rowsFinal, changes };
}

/**
 * The house's items of one kind as rows, for a switch: every item through
 * toRow, over the previous row of the same id when the caller hands the
 * outgoing rows in, so a wing's own fields on a row that stays survive.
 */
export function syncOut<R extends SyncRow>(kind: ItemKind, house: House, adapter: SyncAdapter<R>, prevRows: readonly R[] = []): R[] {
	const list = listOfKind(kind);
	if (!list) throw new Error('syncOut: no list for the kind ' + kind);
	const prev = new Map<string, R>();
	for (const row of prevRows) if (!prev.has(row.id)) prev.set(row.id, row);
	/* Rule 6 here too: the rows of this house carry this house's id. */
	return (house[list] as unknown as HouseItem[]).map((item) =>
		adapter.toRow(item.house === house.id ? item : ({ ...item, house: house.id } as HouseItem), prev.get(item.id))
	);
}
