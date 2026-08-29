/**
 * Import / export as a real file.
 *
 * The original's "session code" was a base64 blob you copied out of a textarea
 * by hand (L3501). This writes plain JSON: diffable, hand-editable, and
 * openable in any editor if something ever goes wrong.
 */
import type { SessionState } from './db';
import type { HousePortable } from './house';

export const FORMAT = 'world-table-session';
/**
 * 3, because covers became a history.
 *
 * This is the ONLY version gate parseImport actually checks. Left at 2, an old
 * cached build accepts a sales-carrying file without complaint, adoptImport
 * stores it, and the old whole-record writeLines then rewrites the costing as
 * { lines, sold } and DROPS the array with a fresh newest ts -- which then wins
 * on the way back and destroys the other device copy too. At 3 the old build
 * refuses with the message it already has. The new build still reads every v2
 * file ever written, because the gate only rejects NEWER.
 */
export const FORMAT_VERSION = 3;

export interface PortableFile {
	format: typeof FORMAT;
	version: number;
	exportedAt: string;
	app: { version: string; recipeCount: number };
	data: SessionState;
	/**
	 * House-owned collections that never had a session-side legacy.
	 *
	 * A SIBLING OF `data`, not a member of it, and that placement is the whole
	 * point. mergeSessions() spreads `...incoming` ahead of its named fields, so
	 * anything added to `data` is copied into the per-profile
	 * `session::<profileId>` record and persisted there. The menu and its
	 * costings tolerate that because they are being absorbed OUT of the session
	 * and every file ever written already carries them inside it. A prep has no
	 * such history, and it is a fact about the venue.
	 *
	 * AND THIS IS WHY FORMAT_VERSION DOES NOT MOVE. The gate above rejects only
	 * NEWER files, and the criterion it documents for a bump is a build that
	 * would DESTROY something: v3 exists because an old build rewrote a costing
	 * as { lines, sold } and dropped the sales array with a fresh newest ts. An
	 * old build reading this file ignores an unknown top-level key completely:
	 * parseImport checks format, version and data and nothing else, and neither
	 * session.merge nor house.adopt is handed it. It loses the preps, which is
	 * exactly what it does today; it destroys nothing, and re-exporting from it
	 * cannot take a prep off the device that has one, because adoptImport merges
	 * an absent list as no change. A bump would instead make the older tablet
	 * refuse the venue's whole menu, which is strictly worse than the gap it
	 * would be announcing.
	 */
	house?: HousePortable;
}

/**
 * `house` is REQUIRED, for the reason adoptImport's `incoming` is. An optional
 * third argument is what let the export ship without preps for their whole
 * existence. The field on PortableFile stays optional because every file
 * written before this one genuinely has none.
 */
export function buildExport(
	state: SessionState,
	recipeCount: number,
	house: HousePortable
): PortableFile {
	return {
		format: FORMAT,
		version: FORMAT_VERSION,
		exportedAt: new Date().toISOString(),
		app: { version: '2.0.0', recipeCount },
		data: state,
		house
	};
}

export function filename(now = new Date()): string {
	const d = now.toISOString().slice(0, 10);
	return `world-table-${d}.wtjson`;
}

export function download(file: PortableFile) {
	const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename();
	a.click();
	URL.revokeObjectURL(url);
}

export function parseImport(text: string): PortableFile {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new Error('That file isn’t readable JSON.');
	}
	const f = parsed as Partial<PortableFile>;
	if (f?.format !== FORMAT) throw new Error('That isn’t a World Table session file.');
	if (typeof f.version !== 'number' || f.version > FORMAT_VERSION) {
		throw new Error(`That file was written by a newer version (v${f.version}).`);
	}
	if (!f.data) throw new Error('That session file has no data in it.');
	return f as PortableFile;
}

/**
 * What an import would change, shown before anything is written.
 *
 * Every field is guarded: `incoming` is whatever a user's file claimed to be,
 * and a hand-edited .wtjson missing `menu` must produce a summary, not a crash
 * before the summary.
 */
export function describeImport(
	incoming: Partial<SessionState> & HousePortable,
	current: SessionState & HousePortable
) {
	const inMenu = incoming.menu ?? [];
	const inNotes = incoming.notes ?? {};
	const newPins = inMenu.filter((s) => !current.menu.includes(s)).length;
	const newNotes = Object.keys(inNotes).filter((k) => !(k in current.notes)).length;
	const overwritten = Object.keys(inNotes).filter(
		(k) => k in current.notes && current.notes[k] !== inNotes[k]
	).length;
	const newPantry = (incoming.pantry ?? []).filter((l) => !current.pantry.includes(l)).length;
	const newFamily = (incoming.familyRecipes ?? []).filter(
		(r) => !current.familyRecipes.some((e) => e.slug === r.slug)
	).length;
	const newDishes = (incoming.menuDishes ?? []).filter(
		(d) => d && d.id && !(current.menuDishes ?? []).some((e) => e.id === d.id)
	).length;
	// An id match with a newer ts means the merge will REPLACE the live copy:
	// the banner must say so, the way notes get their 'replaced' count.
	const updatedDishes = (incoming.menuDishes ?? []).filter((d) => {
		if (!d || !d.id) return false;
		const mine = (current.menuDishes ?? []).find((e) => e.id === d.id);
		return !!mine && (d.ts ?? 0) > (mine.ts ?? 0);
	}).length;

	/**
	 * The costings, which this banner never mentioned.
	 *
	 * It counted pins, notes, pantry, family recipes and dishes and stopped —
	 * so a file whose dishes are byte-identical and whose COVERS differ printed
	 * "nothing new, this file matches what you already have" immediately before
	 * an evening of counting was rewritten. Same blind banner that once erased a
	 * Path of Study.
	 *
	 * Counted per week rather than per dish, because that is the unit the merge
	 * actually works in: a week absent locally is ADDED, and a week present with
	 * a different count is REPLACED.
	 */
	let weeksAdded = 0;
	let weeksReplaced = 0;
	let costedDishes = 0;
	for (const [id, incomingCosting] of Object.entries(incoming.dishCosts ?? {})) {
		const mine = current.dishCosts?.[id];
		const theirWeeks = Array.isArray(incomingCosting?.sales) ? incomingCosting.sales : [];
		if (!mine) {
			if (theirWeeks.length || incomingCosting?.lines?.length) costedDishes++;
			weeksAdded += theirWeeks.length;
			continue;
		}
		for (const w of theirWeeks) {
			const ours = (mine.sales ?? []).find((x) => x.weekStart === w.weekStart);
			if (!ours) weeksAdded++;
			else if (ours.count !== w.count && (w.at ?? 0) > (ours.at ?? 0)) weeksReplaced++;
		}
	}

	/**
	 * The preps, which could not be counted before because they could not
	 * travel. Same rule as the dishes above: an id match with a newer `ts`
	 * REPLACES the live copy, and the banner has to say so before the write:
	 * this is the banner that once read "nothing new" over an evening of covers.
	 *
	 * A replaced prep is louder than a replaced dish and the count is worth its
	 * own clause: re-costing one demi moves the plate cost of every dish that
	 * pours it.
	 */
	/**
	 * The item book. Counted in PRICES, not in items, because that is the unit
	 * the merge works in and the unit the venue cares about: a file carrying six
	 * new observations of butter is six chances to see the creep, and saying
	 * "1 item" over it would undersell what is about to land.
	 */
	const mineByItem = current.items ?? {};
	let newItems = 0;
	let newPrices = 0;
	for (const [slug, it] of Object.entries(incoming.items ?? {})) {
		if (!it || !Array.isArray(it.history)) continue;
		const mine = mineByItem[slug];
		if (!mine) {
			newItems++;
			newPrices += it.history.length;
			continue;
		}
		const seen = new Set(
			(mine.history ?? []).map((p) => `${p?.at}|${p?.unitCost}|${p?.unit}`)
		);
		for (const p of it.history) {
			if (p && !seen.has(`${p.at}|${p.unitCost}|${p.unit}`)) newPrices++;
		}
	}

	// The waste log. Counted in ENTRIES, because that is the unit it merges in
	// and an entry is one thing that went in one bin.
	const mineWaste = new Set((current.waste ?? []).map((w) => w?.id));
	const newWaste = (incoming.waste ?? []).filter((w) => w?.id && !mineWaste.has(w.id)).length;

	const mineByPrep = new Map((current.preps ?? []).map((pr) => [pr.id, pr]));
	let newPreps = 0;
	let updatedPreps = 0;
	for (const pr of incoming.preps ?? []) {
		if (!pr || !pr.id) continue;
		const mine = mineByPrep.get(pr.id);
		if (!mine) newPreps++;
		else if ((pr.ts ?? 0) > (mine.ts ?? 0)) updatedPreps++;
	}

	const parts: string[] = [];
	if (newPins) parts.push(`${newPins} new pinned ${newPins === 1 ? 'dish' : 'dishes'}`);
	if (newNotes) parts.push(`${newNotes} new ${newNotes === 1 ? 'note' : 'notes'}`);
	if (overwritten) parts.push(`${overwritten} ${overwritten === 1 ? 'note' : 'notes'} replaced`);
	if (newPantry) parts.push(`${newPantry} pantry ${newPantry === 1 ? 'item' : 'items'}`);
	if (newFamily) parts.push(`${newFamily} family ${newFamily === 1 ? 'recipe' : 'recipes'}`);
	if (newDishes) parts.push(`${newDishes} menu ${newDishes === 1 ? 'dish' : 'dishes'}`);
	if (updatedDishes) parts.push(`${updatedDishes} menu ${updatedDishes === 1 ? 'dish' : 'dishes'} updated`);
	if (costedDishes) parts.push(`${costedDishes} costed ${costedDishes === 1 ? 'dish' : 'dishes'}`);
	if (weeksAdded) parts.push(`${weeksAdded} ${weeksAdded === 1 ? 'week' : 'weeks'} of covers`);
	if (weeksReplaced)
		parts.push(`${weeksReplaced} ${weeksReplaced === 1 ? 'week' : 'weeks'} of covers replaced`);
	if (newPreps) parts.push(`${newPreps} ${newPreps === 1 ? 'prep' : 'preps'}`);
	if (updatedPreps)
		parts.push(`${updatedPreps} ${updatedPreps === 1 ? 'prep' : 'preps'} re-costed`);
	if (newItems) parts.push(`${newItems} ${newItems === 1 ? 'item' : 'items'}`);
	if (newPrices)
		parts.push(`${newPrices} ${newPrices === 1 ? 'price' : 'prices'} for the item book`);
	if (newWaste)
		parts.push(`${newWaste} waste ${newWaste === 1 ? 'entry' : 'entries'}`);
	return parts.length ? parts.join(', ') : 'nothing new, this file matches what you already have';
}
