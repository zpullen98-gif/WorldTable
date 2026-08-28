/**
 * Import / export as a real file.
 *
 * The original's "session code" was a base64 blob you copied out of a textarea
 * by hand (L3501). This writes plain JSON — diffable, hand-editable, and
 * openable in any editor if something ever goes wrong.
 */
import type { SessionState } from './db';

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
}

export function buildExport(state: SessionState, recipeCount: number): PortableFile {
	return {
		format: FORMAT,
		version: FORMAT_VERSION,
		exportedAt: new Date().toISOString(),
		app: { version: '2.0.0', recipeCount },
		data: state
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
export function describeImport(incoming: Partial<SessionState>, current: SessionState) {
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
	// An id match with a newer ts means the merge will REPLACE the live copy —
	// the banner must say so, the way notes get their 'replaced' count.
	const updatedDishes = (incoming.menuDishes ?? []).filter((d) => {
		if (!d || !d.id) return false;
		const mine = (current.menuDishes ?? []).find((e) => e.id === d.id);
		return !!mine && (d.ts ?? 0) > (mine.ts ?? 0);
	}).length;

	const parts: string[] = [];
	if (newPins) parts.push(`${newPins} new pinned ${newPins === 1 ? 'dish' : 'dishes'}`);
	if (newNotes) parts.push(`${newNotes} new ${newNotes === 1 ? 'note' : 'notes'}`);
	if (overwritten) parts.push(`${overwritten} ${overwritten === 1 ? 'note' : 'notes'} replaced`);
	if (newPantry) parts.push(`${newPantry} pantry ${newPantry === 1 ? 'item' : 'items'}`);
	if (newFamily) parts.push(`${newFamily} family ${newFamily === 1 ? 'recipe' : 'recipes'}`);
	if (newDishes) parts.push(`${newDishes} menu ${newDishes === 1 ? 'dish' : 'dishes'}`);
	if (updatedDishes) parts.push(`${updatedDishes} menu ${updatedDishes === 1 ? 'dish' : 'dishes'} updated`);
	return parts.length ? parts.join(', ') : 'nothing new — this file matches what you already have';
}
