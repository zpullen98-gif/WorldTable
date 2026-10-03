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
 *      nothing moves); every shared mark settles by pickMark; kept unions.
 *      Written only when something changed.
 *   2. No twin by id: a twin by FOLDED NAME within the same house is re-keyed
 *      to the item's id through the adapter's rename and reported renamed.
 *      Only then a twin-less item becomes a row.
 *   3. A row with no house, or with a house not on the device, is adopted
 *      into the current house and its item added.
 *   4. A row whose house is current and that has no item leaves only when the
 *      house's tombstone for it is newer than the row's last touch; otherwise
 *      the item is added.
 *   5. syncIn REMOVES nothing else, ever. An empty house with a full
 *      projection adopts the rows, never the reverse.
 *
 * NO ALLERGEN FIELD ON ANY SHAPE HERE. A wing's row may carry fields of its
 * own that the House never sees; toRow carries every such field whole from
 * the previous row, by not naming any of them, and fromRow reads only the
 * fields the description names, so nothing of a row's own ever enters the
 * House by this door.
 */
import type { House, HouseItem, ItemKind, Mark, Note } from './house-schema';
import { isMark, isNote } from './house-schema';
import { lastTouch, listOfKind, mergeKept, pickMark, sameJson } from './house-merge';

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
	fromRow: (row: R) => HouseItem;
	rename: (row: R, newId: string) => R;
	foldName: (name: string) => string;
	rowKey: (row: R) => string;
	itemKey: (item: HouseItem) => string;
}

/**
 * What happened to one id. A row the wing must write is one reported
 * row-updated, row-added, renamed or adopted (an adopted row is stamped with
 * the house id, and a twin's stamp is reported row-updated beside it); a row
 * reported row-removed has left the list the sync returns.
 */
export type SyncWhat = 'row-updated' | 'item-updated' | 'row-added' | 'item-added' | 'row-removed' | 'renamed' | 'adopted';
export interface SyncChange {
	id: string;
	what: SyncWhat;
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
 * The Ledger's placeholder for an empty glass or garnish: its save door writes
 * a lone em dash there, and its barText reads a lone hyphen, en dash or em
 * dash back as empty. Detected by code point and written by code point, so
 * no dash is spelled in this file and the publish gate's count stands.
 */
const PLACEHOLDER_CODES = [0x2d, 0x2013, 0x2014];
const PLACEHOLDER = String.fromCharCode(0x2014);
function readPlaceholder(v: unknown): string {
	const s = rowText(v);
	const t = s.trim();
	return t.length === 1 && PLACEHOLDER_CODES.includes(t.charCodeAt(0)) ? '' : s;
}
function writePlaceholder(v: unknown): string {
	const s = rowText(v);
	return s.trim() ? s : PLACEHOLDER;
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
		{ item: 'glass', row: 'glass', out: writePlaceholder, in: readPlaceholder },
		{ item: 'garnish', row: 'garnish', out: writePlaceholder, in: readPlaceholder },
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

	const fromRow = (row: R): HouseItem => {
		const out: Fields = { id: row.id, house: rowText(row.house), kind: spec.kind, name: '', ...spec.blank(row) };
		for (const f of spec.shared) out[f.item] = f.in ? f.in(row[f.row]) : rowText(row[f.row]);
		if (spec.derive) Object.assign(out, spec.derive(row));
		const block = readBlock(row.maitre, spec.marks);
		for (const f of spec.marks) if (isMark(block[f])) out[f] = copyMark(block[f] as Mark<unknown>);
		if (block.kept) out.kept = (block.kept as Note[]).map((n) => ({ ...n }));
		out.ts = rowStamp(row.ts);
		return out as unknown as HouseItem;
	};

	const derived = spec.derive ? Object.keys(spec.derive({ id: '', ts: 0 } as R)) : [];
	return {
		kind: spec.kind,
		shared: [...spec.shared.map((f) => f.item), ...derived],
		marks: spec.marks,
		toRow,
		fromRow,
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

/**
 * A twin settled: the shared plain fields from the newer side, the marks by
 * pickMark on their own stamps, kept unioned, the house id the house's. On
 * equal stamps neither side's plain fields move. The row comes back through
 * toRow over the old row, so its own fields ride along.
 */
function settleTwin<R extends SyncRow>(item: HouseItem, row: R, houseId: string, adapter: SyncAdapter<R>): { item: HouseItem; row: R } {
	const mine = item as unknown as Fields;
	const rowItem = adapter.fromRow(row) as unknown as Fields;
	const settled: Fields = {};
	for (const f of adapter.marks) {
		const m = pickMark(
			isMark(mine[f]) ? (mine[f] as Mark<unknown>) : undefined,
			isMark(rowItem[f]) ? (rowItem[f] as Mark<unknown>) : undefined
		);
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
	rows.forEach((row, i) => {
		if (scopes[i] === 'foreign') return;
		if (!byId.has(row.id)) byId.set(row.id, i);
		const key = adapter.rowKey(row);
		const at = byKey.get(key);
		if (at) at.push(i);
		else byKey.set(key, [i]);
	});
	const itemIds = new Set(items.map((item) => item.id));

	const itemsOut: HouseItem[] = [];
	const newRows: R[] = [];
	let houseChanged = false;
	let rowsChanged = false;
	const removed: Record<string, number> = { ...house.removed };
	const seenItems = new Set<string>();

	for (const item of items) {
		if (seenItems.has(item.id)) continue;
		seenItems.add(item.id);
		let at = byId.get(item.id);
		if (at === undefined || claimed.has(at)) {
			at = undefined;
			const cands = byKey.get(adapter.itemKey(item)) || [];
			/* A row keyed to another item's id is that item's twin, never this one's by name. */
			const free = cands.find((i) => !claimed.has(i) && !itemIds.has(rows[i].id));
			if (free !== undefined) {
				rowsOut[free] = adapter.rename(rows[free], item.id);
				changes.push({ id: item.id, what: 'renamed' });
				rowsChanged = true;
				at = free;
			}
		}
		if (at === undefined) {
			newRows.push(adapter.toRow(item, undefined));
			changes.push({ id: item.id, what: 'row-added' });
			rowsChanged = true;
			itemsOut.push(item);
			continue;
		}
		claimed.add(at);
		const row = rowsOut[at] as R;
		if (scopes[at] === 'adoptable') changes.push({ id: item.id, what: 'adopted' });
		const settled = settleTwin(item, row, house.id, adapter);
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
		const asItem = adapter.fromRow(row);
		if (scopes[i] === 'adoptable') {
			/* A person's row arriving: adopted whole, and a tombstone under its id is
			   stale evidence against a row that is here now, so it goes. */
			rowsOut[i] = { ...row, house: house.id };
			changes.push({ id: row.id, what: 'adopted' });
			rowsChanged = true;
			delete removed[row.id];
		} else {
			const tomb = removed[row.id];
			if (tomb !== undefined && tomb > lastTouch(asItem, adapter.marks)) {
				rowsOut[i] = undefined;
				changes.push({ id: row.id, what: 'row-removed' });
				rowsChanged = true;
				return;
			}
			if (tomb !== undefined) delete removed[row.id];
		}
		itemsOut.push({ ...asItem, house: house.id } as HouseItem);
		changes.push({ id: row.id, what: 'item-added' });
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
	return (house[list] as unknown as HouseItem[]).map((item) => adapter.toRow(item, prev.get(item.id)));
}
