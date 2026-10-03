/**
 * house-wake.ts: the Table's side of the House sync, as pure functions.
 *
 * The store (house.svelte.ts) is a runes module a unit test cannot reach, so
 * everything the House asks of the Table's record lives here and the store
 * calls it: the wake (the dishes brought into step with the current house
 * in hydrate), the put after a save, the tombstone after a delete, and the
 * re-key a renamed change calls for. house-sync.test.ts runs all of it over
 * a Map storage, the way the House engine's own tests do.
 *
 * THE RECORD'S DISHES ARE A PROJECTION OF THE HOUSE (house-sync.ts). The
 * House carries name, section, description, ingredients, price, the six
 * marks and kept; the Table's own fields (allergens, allergensCheckedAt,
 * recipeSlug) ride the row untouched, because the adapter carries every
 * field it does not name whole from the previous row and reads only the
 * ones it names. No allergen content reaches the House by this door.
 *
 * NO WRITE WITHOUT A HOUSE. With no current house on the device the rows are
 * an implicit house: wakeHouse syncs nothing, putDish writes nothing and
 * says nothing, and the first act of a person (New house, an import) is what
 * mints one. NO_HOUSE_SAID is the api's sentence for a write a screen asked
 * for; here it is not a refusal, so it is never surfaced.
 *
 * SAVE ORDER: projection first, House second. The store persists its own
 * record and only then calls putDish; a refused House write (the cap, no
 * database, a quota) leaves the Table's record as saved and comes back as a
 * sentence the page prints. It never throws into the caller.
 */
import type { HouseApi } from '../house/house-api';
import type { SyncChange, SyncRow } from '../house/house-sync';
import type { HouseRecord } from '../persistence/house';
import type { MenuDish } from '../persistence/state';

/** One id moved to another: what a renamed change asks of every id-keyed map on the record. */
export interface Rekey {
	from: string;
	to: string;
}

export interface WakeResult {
	/** The record as the Table should now hold it: the same object when nothing changed. */
	record: HouseRecord;
	/** The House's refusal in words, when it could not keep its side; the record is right either way. */
	refusal?: string;
	/** What the sync reported, for a screen or a test. */
	changes: SyncChange[];
}

export interface PutResult {
	refusal?: string;
	/** The dish's id was changed by the House (a name twin, or an id the key sweep refuses). */
	rekey?: Rekey;
	/** The house id the row now carries, when the dish did not carry it yet (adopted on its first save). */
	house?: string;
}

const asRows = (dishes: readonly MenuDish[]): SyncRow[] => dishes as unknown as SyncRow[];

/**
 * The rows as dishes, each one complete: a row the House made with no
 * previous row carries only the shared fields, and MenuDish requires its
 * own (the allergen line, empty and unchecked, because the House has no
 * word on it and a person marks it at lineup). A row that already has them
 * is the same object back, so an unchanged row stays unchanged.
 */
const asDishes = (rows: readonly SyncRow[]): MenuDish[] =>
	rows.map((r) => (Array.isArray(r.allergens) ? r : { ...r, allergens: [] })) as unknown as MenuDish[];

/**
 * Every id-keyed map on the record moved from one dish id to another:
 * dishCosts, eightySix, the producers' dishIds, and the waste entries'
 * source. prepCounts is keyed by PREP id and lineupLog by deck slug, so
 * neither names a dish and neither moves. The dish itself is left alone:
 * the sync has already re-keyed the row it hands back.
 *
 * absorbed is the one map that GAINS the new id and keeps the old: it is
 * the memory of which per-profile session dishes were taken up, keyed by
 * the id the SESSION still holds. Were the old id replaced, the next
 * boot's absorbSession would take the dish up again under it and the wake
 * would re-key it again: a fresh item on every boot for an id the key
 * sweep refuses, a duplicate row under one id for a name twin.
 */
export function rekeyDish(record: HouseRecord, from: string, to: string): HouseRecord {
	if (!from || !to || from === to) return record;
	let out = record;
	if (from in record.dishCosts) {
		const { [from]: moved, ...rest } = record.dishCosts;
		out = { ...out, dishCosts: { ...rest, [to]: moved } };
	}
	if (from in record.eightySix) {
		const { [from]: moved, ...rest } = record.eightySix;
		out = { ...out, eightySix: { ...rest, [to]: moved } };
	}
	if (record.absorbed.includes(from) && !record.absorbed.includes(to)) {
		out = { ...out, absorbed: [...record.absorbed, to] };
	}
	if (record.producers.some((p) => p.dishIds.includes(from))) {
		out = {
			...out,
			producers: record.producers.map((p) =>
				p.dishIds.includes(from) ? { ...p, dishIds: p.dishIds.map((id) => (id === from ? to : id)) } : p
			)
		};
	}
	if (record.waste.some((w) => w.source?.dishId === from)) {
		out = {
			...out,
			waste: record.waste.map((w) => (w.source?.dishId === from ? { ...w, source: { ...w.source, dishId: to } } : w))
		};
	}
	return out;
}

/** The renamed changes of a sync as re-keys, in the order they were reported. */
export function rekeysOf(changes: readonly SyncChange[]): Rekey[] {
	const out: Rekey[] = [];
	for (const c of changes) if (c.what === 'renamed' && c.from && c.from !== c.id) out.push({ from: c.from, to: c.id });
	return out;
}

/**
 * The record's dishes brought into step with the current house. Nothing is
 * written here: the record comes back for the store to persist (once, when
 * it changed) and the House has been saved by the api when its side moved.
 * The dishes are replaced only when the sync says a row changed, so a wake
 * on a record already in step is the same object back.
 */
export async function wakeHouse(api: HouseApi, record: HouseRecord): Promise<WakeResult> {
	try {
		await api.ready();
		if (!api.current()) return { record, changes: [] };
		const res = await api.sync('dish', asRows(record.dishes));
		let out = record;
		if (res.rows !== (record.dishes as unknown as SyncRow[])) out = { ...out, dishes: asDishes(res.rows) };
		for (const { from, to } of rekeysOf(res.changes)) out = rekeyDish(out, from, to);
		return res.ok ? { record: out, changes: res.changes } : { record: out, changes: res.changes, refusal: res.said };
	} catch (err) {
		return { record, changes: [], refusal: wording(err) };
	}
}

/**
 * One dish, after the Table's own save, into the House. With no house there
 * is nothing to say. The row the House hands back is not written over the
 * Table's (the Table's save is the newer side and the sync keeps it); only
 * a changed id and the house stamp are reported, for the store to re-key its
 * maps and its dish, and to stamp the dish so the next wake finds it ours.
 */
export async function putDish(api: HouseApi, dish: MenuDish): Promise<PutResult> {
	try {
		await api.ready();
		if (!api.current()) return {};
		const res = await api.put('dish', dish as unknown as SyncRow);
		const out: PutResult = {};
		if (res.row && res.row.id !== dish.id) out.rekey = { from: dish.id, to: res.row.id };
		if (res.ok && res.row && typeof res.row.house === 'string' && res.row.house && res.row.house !== dish.house) out.house = res.row.house;
		if (!res.ok && res.said) out.refusal = res.said;
		return out;
	} catch (err) {
		return { refusal: wording(err) };
	}
}

/**
 * A tombstone for a dish the Table has deleted, so no device brings it back.
 * removeItem writes the stamp newer than the item's last touch and drops the
 * item; with no house there is nothing to write.
 */
export async function removeDishFromHouse(api: HouseApi, id: string): Promise<PutResult> {
	try {
		await api.ready();
		if (!api.current()) return {};
		const ok = await api.removeItem('dish', id);
		return ok ? {} : { refusal: 'The House could not record that ' + id + ' was removed. Export it as a pack so nothing is lost.' };
	} catch (err) {
		return { refusal: wording(err) };
	}
}

export interface SwitchResult {
	ok: boolean;
	/** The record with the projection replaced; the same object when the switch did not land. */
	record: HouseRecord;
	/** The re-keys the outgoing sync asked for, so the store applies them to its live record rather than taking the snapshot's maps whole. */
	rekeys: Rekey[];
	refusal?: string;
}

/**
 * The pointer moved to another house on the device and the projection
 * replaced: the current rows are synced OUT first, into the house they
 * belong to (so an edit made since the last wake is kept, and a row with
 * no house is adopted before it would be dropped), then the pointer moves,
 * then the new house's dishes come in through the adapter over the previous
 * rows of the same id, so the Table's own fields on a row that stays (the
 * allergen line, the recipe pointer) survive. Rows of the outgoing house
 * leave the record and nothing else: a switch is not a delete, and their
 * costings and the 86 board stay keyed for the day the house comes back.
 * Saved once, by the store, when ok.
 */
export async function switchHouse(api: HouseApi, record: HouseRecord, id: string): Promise<SwitchResult> {
	try {
		await api.ready();
		let out = record;
		let rekeys: Rekey[] = [];
		if (api.current()) {
			const synced = await wakeHouse(api, record);
			out = synced.record;
			rekeys = rekeysOf(synced.changes);
			if (synced.refusal) return { ok: false, record, rekeys: [], refusal: synced.refusal };
		}
		const next = await api.switchTo(id);
		if (!next) return { ok: false, record, rekeys: [] };
		const rows = api.rows('dish', asRows(out.dishes));
		return { ok: true, record: { ...out, dishes: asDishes(rows) }, rekeys };
	} catch (err) {
		return { ok: false, record, rekeys: [], refusal: wording(err) };
	}
}

/** An error as one sentence, never a throw into the store's caller. */
function wording(err: unknown): string {
	const msg = err instanceof Error && err.message ? err.message : String(err);
	return 'The House could not be written: ' + msg + '. Export it as a pack so nothing is lost.';
}
