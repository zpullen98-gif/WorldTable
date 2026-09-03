/**
 * Import / export as a real file.
 *
 * The original's "session code" was a base64 blob you copied out of a textarea
 * by hand (L3501). This writes plain JSON: diffable, hand-editable, and
 * openable in any editor if something ever goes wrong.
 */
import type { SessionState } from './db';
import { screenFamilyRecipes } from '../familyRecipe';
import type { HousePortable } from './house';
import { asArray, asRecord } from '../importShape';
import { mergeCostings, normaliseCosting, validStepActuals } from './state';

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
 * What an import changed. Computed before the write in code order
 * (menu/+page.svelte's doImport calls this, then session.merge and
 * house.adopt, unconditionally) but there is no confirm step between them -
 * this is a summary of a write that has already happened by the time the
 * cook reads it, not a preview they could still decline.
 *
 * Every field is guarded: `incoming` is whatever a user's file claimed to be,
 * and a hand-edited .wtjson missing `menu` must produce a summary, not a crash
 * before the summary.
 *
 * The guard used to be `?? []` / `?? {}`, which only covers null/undefined.
 * Measured: a hand-typed `menu`, `pantry`, `menuDishes` or `waste` that was a
 * SCALAR (not missing, just the wrong shape) threw a raw TypeError into the
 * banner - `(incoming.menu ?? []).filter is not a function`. Worse and
 * silent: a scalar `notes` did not throw at all, because `Object.keys('ab')`
 * treats a string as indexable and mints two junk notes out of it, counted
 * and announced as real ("2 new notes") before mergeSessions writes exactly
 * that junk to disk. asArray/asRecord (importShape.ts) close both, and are
 * shared with mergeSessions so the banner and the write can never disagree
 * about what counts as "an array" or "a record".
 */
export function describeImport(
	incoming: Partial<SessionState> & HousePortable,
	current: SessionState & HousePortable
) {
	const inMenu = asArray<string>(incoming.menu);
	const inNotes = asRecord<string>(incoming.notes);
	const newPins = inMenu.filter((s) => !current.menu.includes(s)).length;
	const newNotes = Object.keys(inNotes).filter((k) => !(k in current.notes)).length;
	const overwritten = Object.keys(inNotes).filter(
		(k) => k in current.notes && current.notes[k] !== inNotes[k]
	).length;
	const newPantry = asArray<string>(incoming.pantry).filter((l) => !current.pantry.includes(l)).length;
	/*
	 * Family recipes, screened before they are counted.
	 *
	 * The count has to come from the SAME screen the merge uses or the banner
	 * promises recipes the merge then throws away. `rejected` is surfaced rather
	 * than swallowed: a file with a half-written recipe in it is a file the cook
	 * can go and fix, and silently dropping it is how the old blank-Library
	 * defect would simply become a blank space instead.
	 */
	const screened = screenFamilyRecipes(incoming.familyRecipes);
	const newFamily = screened.kept.filter(
		(r) => !current.familyRecipes.some((e) => e.slug === r.slug)
	).length;
	const skippedFamily = screened.rejected;
	const newDishes = asArray<{ id: string; ts?: number }>(incoming.menuDishes).filter(
		(d) => d && d.id && !(current.menuDishes ?? []).some((e) => e.id === d.id)
	).length;
	// An id match with a newer ts means the merge will REPLACE the live copy:
	// the banner must say so, the way notes get their 'replaced' count.
	const updatedDishes = asArray<{ id: string; ts?: number }>(incoming.menuDishes).filter((d) => {
		if (!d || !d.id) return false;
		const mine = (current.menuDishes ?? []).find((e) => e.id === d.id);
		return !!mine && (d.ts ?? 0) > (mine.ts ?? 0);
	}).length;

	/**
	 * The costings, which this banner never mentioned.
	 *
	 * It counted pins, notes, pantry, family recipes and dishes and stopped,
	 * so a file whose dishes are byte-identical and whose COVERS differ printed
	 * "nothing new, this file matches what you already have" immediately before
	 * an evening of counting was rewritten. Same blind banner that once erased a
	 * Path of Study.
	 *
	 * Counted per week rather than per dish, because that is the unit the merge
	 * actually works in: a week absent locally is ADDED, and a week present with
	 * a different count is REPLACED.
	 */
	/*
	 * Derived from the ACTUAL merge, not re-derived by eye beside it.
	 *
	 * This used to reimplement the decision - "an incoming week with a later
	 * `at` replaces" - and mergeCostings' real rule is stricter: an incoming
	 * stamp more than CLOCK_SKEW_MS (24h) ahead of now is a dead RTC, not the
	 * future, and loses. Strictly past that line the count banner said
	 * "replaced" while the merge kept the local figure (it still stamps
	 * `prev` on the record, which is a real change - just not the one named).
	 * Separately, this never ran normaliseCosting's validWeek check, so a
	 * hand-edited week with a non-finite `at` was counted as "1 week of
	 * covers" and then discarded entirely by the merge.
	 *
	 * Calling mergeCostings directly means the banner can only ever describe
	 * a change the merge will actually make.
	 */
	let weeksAdded = 0;
	let weeksReplaced = 0;
	let costedDishes = 0;
	for (const [id, incomingRaw] of Object.entries(asRecord<unknown>(incoming.dishCosts))) {
		const mineNorm = normaliseCosting(current.dishCosts?.[id]);
		const merged = mergeCostings(current.dishCosts?.[id], incomingRaw);
		if (!merged) continue;
		if (!mineNorm) {
			if (merged.sales.length || merged.lines.length) costedDishes++;
			weeksAdded += merged.sales.length;
			continue;
		}
		const mineByWeek = new Map(mineNorm.sales.map((w) => [w.weekStart, w]));
		for (const w of merged.sales) {
			const ours = mineByWeek.get(w.weekStart);
			if (!ours) weeksAdded++;
			// The winner's count differs from what we had before the merge: a
			// real replacement, whichever side won it.
			else if (w.count !== ours.count) weeksReplaced++;
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
	const newWaste = asArray<{ id?: string }>(incoming.waste).filter(
		(w) => w?.id && !mineWaste.has(w.id)
	).length;

	/**
	 * Step timings, which this banner never mentioned at all: mergeSessions
	 * (state.ts) used to fall through a bare `...incoming` spread here, and a
	 * genuine .wtjson always carries the key, so importing a colleague's file
	 * silently replaced the cook's own observed step timings while this
	 * function reported "nothing new". Counted in SAMPLES, the unit
	 * validStepActuals screens to (rounded, finite, positive - what
	 * recordStepActual itself could have written), not in keys: a file
	 * carrying six fresh readings of one step is six chances to see the
	 * estimate drift, and "1 step" would undersell it.
	 */
	let newStepTimings = 0;
	for (const arr of Object.values(asRecord<unknown>(incoming.stepActuals))) {
		newStepTimings += validStepActuals(arr).length;
	}

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
	if (newStepTimings)
		parts.push(`${newStepTimings} step ${newStepTimings === 1 ? 'timing' : 'timings'}`);

	/*
	 * What will NOT be imported, said out loud.
	 *
	 * Appended after the "nothing new" line rather than before the list, because
	 * on a file whose only fault is a half-written recipe that sentence is a lie
	 * on its own: nothing new lands AND something was thrown away. The first
	 * reason is quoted in full - a cook told "1 recipe skipped" learns nothing,
	 * and one told "Nan's Stew: no flavour tags" can go and fix the file.
	 */
	const said = parts.length
		? parts.join(', ')
		: 'nothing new, this file matches what you already have';
	if (!skippedFamily.length) return said;
	const n = skippedFamily.length;
	const tail =
		n === 1
			? `1 family recipe skipped (${skippedFamily[0]})`
			: `${n} family recipes skipped (${skippedFamily[0]}, and ${n - 1} more)`;
	return `${said}; ${tail}`;
}
