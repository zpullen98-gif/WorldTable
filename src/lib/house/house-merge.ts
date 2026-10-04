/**
 * The House merge: two copies of one house as one, with nothing a person
 * kept lost on either side. Every comment here ships inside the ported
 * static/shared/oot-house.js (comments kept, assertClean refusing any dash
 * spelling and any regex literal outside ASCII), so the comments are
 * dash-free and the regexes ASCII, the discipline house-schema.ts sets.
 *
 * PURE AND PORTABLE. No import from outside src/lib/house, no DOM, no
 * Svelte, no Node, no clock: every stamp is an argument. The port joins this
 * module with the other house modules into one IIFE, so no top-level name
 * here may repeat one declared in any of them.
 *
 * THE RULE, copied word for word from the Table's state.ts pickMark and never
 * imported (the Table may import this engine; this engine imports nothing of
 * the Table): per field a person's mark beats hers whatever the stamps, then
 * the newer ts, tie mine; kept unions on ts|q. The marks never ride the item
 * winner: an item's plain fields travel whole with the newer ts, and its
 * marks settle one by one on their own stamps, so a colleague's later edit
 * to a description cannot erase a line somebody kept. The same rule in the
 * same words settles a pack merge, a projection sync (house-sync.ts) and
 * the Table's own file merge, so one export lands the same way in all three
 * wings.
 */
import type {
	BuildStep,
	House,
	HouseList,
	HouseSource,
	Mark,
	Note
} from './house-schema';
import { BUILD_STEPS, HOUSE_LISTS, ITEM_KINDS, MARK_FIELDS, isMark, isNote } from './house-schema';
import { KEPT_CAP } from './house-normalise';

/** Any record a House list holds: an id, a stamp, and whatever else its shape names. */
export type Listed = { id: string; ts: number };

/** A record as plain fields, for the loops that read a mark or a kept list by name. */
type Fields = Record<string, unknown>;

/** What a merge did, for the sentence the import screen ends on. */
export interface MergeCounts {
	/** Items theirs had and mine did not, now on the house. */
	added: number;
	/** Twins where the merged item differs from mine. */
	updated: number;
	/** Twins where theirs differed and mine stood whole, because newer or kept. */
	keptMine: number;
	/** Items a tombstone dropped, counted once per id. */
	removed: number;
}

/* -------------------------------------------------------------------------
 * Equality, so a write happens only when something changed
 * ---------------------------------------------------------------------- */

/**
 * Deep equality over JSON values: the same keys with the same values in any
 * order, the same list in the same order. A key whose value is undefined
 * counts as absent, the way JSON.stringify drops it, so a record built with
 * `field: undefined` equals one built without the key. The sync and the
 * merge both ask this before writing, which is what makes a second import of
 * the same pack a no-op and lets a wing skip a save.
 */
export function sameJson(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (Array.isArray(a) || Array.isArray(b)) {
		if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
		for (let i = 0; i < a.length; i++) if (!sameJson(a[i], b[i])) return false;
		return true;
	}
	if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
	const ra = a as Record<string, unknown>;
	const rb = b as Record<string, unknown>;
	const ka = Object.keys(ra).filter((k) => ra[k] !== undefined);
	const kb = Object.keys(rb).filter((k) => rb[k] !== undefined);
	if (ka.length !== kb.length) return false;
	for (const k of ka) {
		if (!(k in rb) || !sameJson(ra[k], rb[k])) return false;
	}
	return true;
}

/* -------------------------------------------------------------------------
 * One mark, the kept notes, one item
 * ---------------------------------------------------------------------- */

/**
 * Which of two marks on one field stands.
 *
 * A kept mark (by a person) beats her unkept one whatever the stamps say, and
 * only then does the newer stamp win. The first rule is what keeps the merge
 * honest with setMaitre, which refuses to let her mark displace a kept one on
 * a single tablet: without it, the same re-run that is refused when the kept
 * mark is already here would win the moment it arrived by file instead. On a
 * tie mine stands, so re-importing your own export changes nothing.
 */
export function pickMark<T>(mine: Mark<T> | undefined, theirs: Mark<T> | undefined): Mark<T> | undefined {
	if (!mine) return theirs;
	if (!theirs) return mine;
	const mineKept = mine.by === 'person';
	const theirsKept = theirs.by === 'person';
	if (mineKept !== theirsKept) return mineKept ? mine : theirs;
	return theirs.ts > mine.ts ? theirs : mine;
}

/**
 * Two lists of kept notes as one: the union on ts|q, because two devices'
 * kept answers are different answers, not competing versions of one. On the
 * same key mine stands. Sorted by stamp then question so the two orders of
 * the same merge give one list, and the oldest beyond the normaliser's
 * KEPT_CAP (five hundred, the newest kept) fall off, so a looping import
 * cannot grow a record without end. A note that is not a note (a hand-edited
 * file) is left out rather than carried.
 */
export function mergeKept(a: readonly unknown[] | undefined, b: readonly unknown[] | undefined): Note[] {
	const seen = new Map<string, Note>();
	for (const list of [a, b]) {
		if (!list) continue;
		for (const n of list) {
			if (!isNote(n)) continue;
			const key = n.ts + '|' + n.q;
			if (!seen.has(key)) seen.set(key, n);
		}
	}
	const out = [...seen.values()].sort((x, y) => x.ts - y.ts || (x.q < y.q ? -1 : x.q > y.q ? 1 : 0));
	return out.length > KEPT_CAP ? out.slice(out.length - KEPT_CAP) : out;
}

/**
 * How many records' notes must share one stamp before that stamp is read as
 * an edition's and not a person's. A person keeps one note at a time, each
 * with its own clock reading; an edition stamps every note it ships with one
 * number, and a copy refreshed before the notes rule (the 22:00 edition of
 * 3 October 2026) may still carry an older edition's notes under that
 * edition's stamp, on far more records than this, in the house and in a
 * wing's rows. house-pack.ts refreshEdition and house-sync.ts syncIn read it.
 */
export const EDITION_NOTE_SPREAD = 12;

/**
 * The mark fields of one item when the caller named none: the kind's list
 * for a dish, a wine or a cocktail, else every field that carries a mark on
 * either side. The second branch is right for the lists without a kind
 * (lexicon, scenarios, mix-ups, must-knows), whose plain fields are strings
 * and lists, never objects with a `by` and a stamp; mergeHouse passes
 * MARK_FIELDS per list and never reaches it.
 */
function markFieldsOf(mine: Fields, theirs: Fields): readonly string[] {
	const kind = mine.kind !== undefined ? mine.kind : theirs.kind;
	if (kind === 'dish') return MARK_FIELDS.dishes;
	if (kind === 'wine') return MARK_FIELDS.wines;
	if (kind === 'cocktail') return MARK_FIELDS.cocktails;
	const out: string[] = [];
	for (const rec of [mine, theirs]) {
		for (const k of Object.keys(rec)) {
			if (k !== 'kept' && isMark(rec[k]) && !out.includes(k)) out.push(k);
		}
	}
	return out;
}

/**
 * Two copies of one item as one. The plain fields travel whole with the
 * newer ts (tie mine); every mark field settles by pickMark; kept unions.
 * A mark field with nothing on either side is absent from the result, not
 * set to undefined, so the record stays clean for JSON and for sameJson. The
 * item kinds know their marks; any other record names them in `marks` or
 * has them found by shape.
 */
export function mergeItem<T extends Listed>(mine: T, theirs: T, marks?: readonly string[]): T {
	const a = mine as unknown as Fields;
	const b = theirs as unknown as Fields;
	const fields = marks || markFieldsOf(a, b);
	const winner = theirs.ts > mine.ts ? b : a;
	const out: Fields = { ...winner };
	for (const f of fields) {
		const m = pickMark(
			isMark(a[f]) ? (a[f] as Mark<unknown>) : undefined,
			isMark(b[f]) ? (b[f] as Mark<unknown>) : undefined
		);
		if (m) out[f] = m;
		else delete out[f];
	}
	const kept = mergeKept(a.kept as unknown[] | undefined, b.kept as unknown[] | undefined);
	if (kept.length) out.kept = kept;
	else delete out.kept;
	/* The service note is a person's words on one device, and a copy made
	   before they wrote it carries an empty string under a stamp that may be
	   newer (a pack re-stamped on export, a row edit on another wing). The
	   note travels by presence: an empty side never blanks a written one, and
	   two written notes settle with the plain fields, by the newer stamp. */
	const loser = winner === a ? b : a;
	if (!noteText(out.serviceNote) && noteText(loser.serviceNote)) out.serviceNote = loser.serviceNote;
	return out as T;
}

function noteText(v: unknown): string {
	return typeof v === 'string' ? v.trim() : '';
}

/* -------------------------------------------------------------------------
 * The whole house
 * ---------------------------------------------------------------------- */

/**
 * When a person last touched an item: its own stamp, or the stamp of any
 * mark a person kept on it, or of any note kept, whichever is latest. The
 * tombstone rule reads this and not the bare ts, because every wing's Keep
 * re-stamps the MARK and leaves the item's ts alone (the Table's
 * confirmMaitre, the Ledger's and the Codex's keep); a delete on one device
 * must not drop a line a person kept on another device that same afternoon.
 * The item comes back with its line, and the person who deleted it can
 * delete it again, which is the harmless direction. Her unkept marks do not
 * count: she is not a person, and a re-run of hers must not resurrect a
 * deleted dish.
 */
export function lastTouch(item: Listed, marks: readonly string[]): number {
	const rec = item as unknown as Fields;
	let t = item.ts;
	for (const f of marks) {
		const m = rec[f];
		if (isMark(m) && m.by === 'person' && m.ts > t) t = m.ts;
	}
	const kept = rec.kept;
	if (Array.isArray(kept)) {
		for (const n of kept) if (isNote(n) && n.ts > t) t = n.ts;
	}
	return t;
}

/** The later of two ISO dates as strings; an empty one loses, and mine stands on a tie. */
function laterDate(mine: string, theirs: string): string {
	if (!theirs) return mine;
	if (!mine) return theirs;
	return theirs > mine ? theirs : mine;
}

/**
 * Sources as one list: union by url, and by title when a source has no url
 * (a printed card has none, and two printed cards are two sources). On a
 * collision the later readOn stands, tie mine.
 */
export function mergeSources(mine: readonly HouseSource[], theirs: readonly HouseSource[]): HouseSource[] {
	const keyOf = (s: HouseSource) => (s.url ? 'u|' + s.url : 't|' + s.title);
	const out = new Map<string, HouseSource>();
	for (const s of mine) if (!out.has(keyOf(s))) out.set(keyOf(s), s);
	for (const s of theirs) {
		const k = keyOf(s);
		const have = out.get(k);
		if (!have) out.set(k, s);
		else if (laterDate(have.readOn, s.readOn) !== have.readOn) out.set(k, s);
	}
	return [...out.values()];
}

/** The card's plain fields: everything on a House that is not a list, a mark, a stamp, a tombstone or an identity. */
const CARD_FIELDS = ['name', 'address', 'phone', 'site', 'meals', 'dressCode', 'began', 'createdAt', 'pack'] as const;

/**
 * Two copies of one house as one: mine, with theirs merged in.
 *
 * Per list by id: a twin settles by mergeItem with the list's own mark
 * fields; an item on one side only is carried. A tombstone in either
 * `removed` newer than the item's last touch drops the item from both sides,
 * and the tombstones themselves union on the newer stamp, so a delete
 * travels. The card's plain fields take the newer lastWrite's (tie mine);
 * the house's history mark settles by pickMark; sources union; menusReadOn
 * is the later date; each build step keeps its latest stamp. Their items
 * are re-stamped with my id, so a pack merged into a house of another id
 * joins it whole. The id, format and version are mine.
 *
 * Symmetric up to list order and idempotent, both pinned by the tests:
 * merge(a, b) and merge(b, a) hold the same records, and merging the result
 * with either side again changes nothing.
 */
export function mergeHouse(mine: House, theirs: House): { house: House; counts: MergeCounts } {
	const counts: MergeCounts = { added: 0, updated: 0, keptMine: 0, removed: 0 };
	const theirsNewer = theirs.lastWrite > mine.lastWrite;
	const card = theirsNewer ? theirs : mine;

	const removed: Record<string, number> = { ...mine.removed };
	for (const id of Object.keys(theirs.removed)) {
		const t = theirs.removed[id];
		if (!(id in removed) || t > removed[id]) removed[id] = t;
	}

	const out: Fields = { ...mine };
	for (const f of CARD_FIELDS) {
		if (card[f] !== undefined) out[f] = card[f];
		else delete out[f];
	}
	const history = pickMark(mine.history, theirs.history);
	if (history) out.history = history;
	else delete out.history;
	out.menusReadOn = laterDate(mine.menusReadOn, theirs.menusReadOn);
	out.sources = mergeSources(mine.sources, theirs.sources);

	const build: Partial<Record<BuildStep, number>> = {};
	for (const step of BUILD_STEPS) {
		const a = mine.build[step];
		const b = theirs.build[step];
		const best = a === undefined ? b : b === undefined ? a : Math.max(a, b);
		if (best !== undefined) build[step] = best;
	}
	out.build = build;

	const dropped = new Set<string>();
	for (const list of HOUSE_LISTS) {
		const marks: readonly string[] = MARK_FIELDS[list];
		const mineList = mine[list] as unknown as Listed[];
		const theirsList = (theirs[list] as unknown as Listed[]).map((item) => adopt(item, mine.id));
		const theirsById = new Map<string, Listed>();
		for (const item of theirsList) if (!theirsById.has(item.id)) theirsById.set(item.id, item);
		const merged: Listed[] = [];
		const seen = new Set<string>();
		const alive = (item: Listed) => !(item.id in removed) || removed[item.id] <= lastTouch(item, marks);
		for (const m of mineList) {
			if (seen.has(m.id)) continue;
			seen.add(m.id);
			const t = theirsById.get(m.id);
			const item = t ? mergeItem(m, t, marks) : m;
			if (!alive(item)) {
				dropped.add(m.id);
				continue;
			}
			merged.push(item);
			if (t && !sameJson(item, m)) counts.updated++;
			else if (t && !sameJson(t, m)) counts.keptMine++;
		}
		for (const t of theirsList) {
			if (seen.has(t.id)) continue;
			seen.add(t.id);
			if (!alive(t)) {
				dropped.add(t.id);
				continue;
			}
			merged.push(t);
			counts.added++;
		}
		out[list] = merged;
	}
	counts.removed = dropped.size;
	out.removed = removed;
	out.lastWrite = Math.max(mine.lastWrite, theirs.lastWrite);
	return { house: out as unknown as House, counts };
}

/** Their item under my house id, when it carries one; a tasting or a term carries none and passes through. */
function adopt(item: Listed, houseId: string): Listed {
	const rec = item as unknown as Fields;
	if (!('house' in rec) || rec.house === houseId) return item;
	return { ...rec, house: houseId } as unknown as Listed;
}

/** The list a kind of item lives on, so a caller with a kind in hand finds its list without a table of its own. */
export function listOfKind(kind: string): HouseList | undefined {
	const i = (ITEM_KINDS as readonly string[]).indexOf(kind);
	return i < 0 ? undefined : (['dishes', 'wines', 'cocktails'] as const)[i];
}
