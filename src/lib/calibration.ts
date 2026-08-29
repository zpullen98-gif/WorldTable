/**
 * The calibration bench — a triangle test a cook can run alone.
 *
 * Three cups, two the same, one different. The app holds the answer, which is
 * the one thing a cook standing alone cannot do for themselves — and the whole
 * reason this is a feature rather than advice.
 *
 * The concentrations are AUTHORED APPARATUS and live in
 * tools/derive/calibration.mjs with a gate on their shape. They are not the
 * guide's numbers, not a statement of correct seasoning, and not a house spec.
 *
 * Pure, and outside any component, for the reason drill.ts and repertoire.ts
 * are: a runes module cannot be reached from a unit test, and an instrument
 * that is wrong is worse than no instrument.
 */

export interface CalibrationLevel {
	level: number;
	/** Grams (or ml) of the substance into the ladder's stated volume. */
	base: number;
	odd: number;
}

export interface CalibrationLadder {
	taste: string;
	label: string;
	substance: string;
	/** g or ml. A quantity with no unit is not a build sheet. */
	unit: string;
	per: string;
	note: string;
	levels: CalibrationLevel[];
}

export interface CalibrationData {
	cups: number;
	trials: number;
	passAt: number;
	ladders: CalibrationLadder[];
}

/** One trial: which cup position (0-based) holds the odd one out. */
export interface Trial {
	odd: number;
}

/**
 * Lay out a trial.
 *
 * `rand` is injected so a test can pin the layout — an instrument whose
 * randomness cannot be held still cannot be tested at all.
 */
export function layOutTrial(cups: number, rand: () => number = Math.random): Trial {
	const n = Math.max(2, Math.floor(cups));
	return { odd: Math.min(n - 1, Math.floor(rand() * n)) };
}

/**
 * A whole run, laid out at once.
 *
 * Laid out UP FRONT rather than trial by trial so the sequence cannot be
 * influenced by how the cook is doing — an instrument that adapts to the
 * subject mid-run is a staircase procedure, which needs its own estimator and
 * is not what this is.
 */
export function layOutRun(
	trials: number,
	cups: number,
	rand: () => number = Math.random
): Trial[] {
	return Array.from({ length: Math.max(1, Math.floor(trials)) }, () => layOutTrial(cups, rand));
}

/** `cal-<taste>-<level>` — one slug per level, the way a drill card is one slug. */
export const slugFor = (taste: string, level: number) => `cal-${taste}-${level}`;

/** Read a slug back. Returns null for anything that is not one of ours. */
export function parseSlug(slug: string): { taste: string; level: number } | null {
	const m = /^cal-(.+)-(\d+)$/.exec(slug);
	if (!m) return null;
	const level = Number(m[2]);
	return Number.isFinite(level) ? { taste: m[1], level } : null;
}

/**
 * Did this run clear the level?
 *
 * An ABSOLUTE threshold, the way verdictFor is, and never a percentage: a
 * percentage invites a threshold in the reader's head, and this whole product
 * refuses that move everywhere else.
 *
 * Chance on three cups is one in three, so five of six is the bar. A clean
 * sweep by luck is 1 in 729.
 */
export function cleared(right: number, passAt: number): boolean {
	return Number.isFinite(right) && right >= passAt;
}

/**
 * What a run says, in words. No number attached to a person: it is a rung.
 */
export function verdictFor(right: number, of: number, passAt: number): string {
	if (right >= of) return 'Every one. That level is yours';
	if (cleared(right, passAt)) return 'Cleared — the next level is closer together';
	if (right <= Math.ceil(of / 3)) return 'That is guessing. Try the level below';
	return 'Not yet. Same level again, rested';
}

export interface CalibrationEntry {
	slug: string;
	at: number;
	grade?: 'met' | 'close' | 'missed';
}

/**
 * The highest level a person has cleared on a ladder, and the next to attempt.
 *
 * Read off which slugs have been cleared rather than stored as a number: the
 * level a person has reached IS the set of levels they have cleared, and a
 * separate counter is a second source of truth that can disagree with the log.
 */
export function levelReached(log: CalibrationEntry[], taste: string): number {
	let top = 0;
	for (const e of log) {
		if (e.grade !== 'met') continue;
		const parsed = parseSlug(e.slug);
		if (parsed?.taste === taste && parsed.level > top) top = parsed.level;
	}
	return top;
}

/** The level to offer next: one past the highest cleared, capped at the ladder. */
export function nextLevel(log: CalibrationEntry[], ladder: CalibrationLadder): CalibrationLevel {
	const reached = levelReached(log, ladder.taste);
	const next = ladder.levels.find((l) => l.level === reached + 1);
	// Everything cleared: the top level stays available, because a palate that
	// is not exercised drifts back and the ladder has to be re-walkable.
	return next ?? ladder.levels[ladder.levels.length - 1];
}
