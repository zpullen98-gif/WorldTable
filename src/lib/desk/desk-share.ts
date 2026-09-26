/**
 * The words and the doors around the desk: which room a row is for, where the
 * other two rooms live, when a read happened, and the sentence that counts a
 * read out. Pure, so the Menu Desk's copy can be pinned without a browser.
 *
 * WHERE THE OTHER ROOMS ARE. The three apps share one origin only in the
 * monorepo, where the World Table is served under /table and the Codex and
 * the Ledger under /codex and /ledger beside it; that is the one place the
 * desk inbox (desk-inbox.ts) can be read by the app it is meant for. `base`
 * from $app/paths is '/table' there and '' everywhere else, so it is the
 * whole test: on the shared origin the hand-off writes the inbox and the
 * done paragraph links next door; anywhere else only the download is offered
 * and the links point at the live suite, because a wine list handed to an
 * inbox nobody else can read is a wine list lost.
 *
 * NEVER A PRICE INVENTED, checked one last time on screen. `priceInRaw` is the
 * guard the review table runs on every row whichever engine read it: a price
 * that does not occur, whitespace folded, in the lines the row came from is
 * blanked and the row flagged "No price on this line". The offline reader
 * cannot produce such a row, because it only ever copies a price out of the
 * line; the guard exists for the engine that can.
 */

import type { DeskItem, DeskSource, DeskUnsorted, DeskWingKind } from './desk-file';

/** The two rooms that are not this one, keyed by the kind of row they keep. */
export type SiblingRoom = Exclude<DeskWingKind, 'dish'>;

/** Where the suite lives when this build is not part of it. */
const LIVE_SUITE = 'https://zpullen98-gif.github.io';

const WING_OF: Record<SiblingRoom, string> = { wine: 'codex', cocktail: 'ledger' };

/** True when this build is the /table wing of the suite and shares an origin with the other two. */
export function sharedOrigin(base: string): boolean {
	return base === '/table';
}

/** The door to the room that keeps `room`'s rows: next door on the shared origin, the live suite elsewhere. */
export function siblingHref(room: SiblingRoom, base: string): string {
	const wing = WING_OF[room];
	return sharedOrigin(base) ? `/${wing}/` : `${LIVE_SUITE}/${wing}/`;
}

/** The room's name as the copy says it: "the Codex", "the Ledger". */
export function roomName(room: SiblingRoom): string {
	return room === 'wine' ? 'the Codex' : 'the Ledger';
}

/** Where a read happened, as the copy says it: "on the World Table", "in the Codex". */
export function readInName(readIn: DeskSource['readIn']): string {
	switch (readIn) {
		case 'codex':
			return 'in the Codex';
		case 'ledger':
			return 'in the Ledger';
		default:
			return 'on the World Table';
	}
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * When a read happened, relative to now: "today at 14:02", "yesterday at
 * 09:15", "on 3 September at 20:40". Local time, because the person reading
 * it is the person who was there. Empty for a stamp a Date cannot read.
 */
export function whenRead(iso: string, now = new Date()): string {
	const d = new Date(iso);
	if (!Number.isFinite(d.getTime())) return '';
	const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
	if (d.toDateString() === now.toDateString()) return `today at ${hm}`;
	const yesterday = new Date(now);
	yesterday.setDate(yesterday.getDate() - 1);
	if (d.toDateString() === yesterday.toDateString()) return `yesterday at ${hm}`;
	return `on ${d.getDate()} ${MONTHS[d.getMonth()]} at ${hm}`;
}

export interface DeskCounts {
	/** Everything the read produced: every row of every kind and every line set aside. */
	lines: number;
	dishes: number;
	wines: number;
	cocktails: number;
	/** Rows the desk could not place, and lines it set aside. */
	unplaced: number;
}

export function deskCounts(items: readonly Pick<DeskItem, 'kind'>[], unsorted: readonly DeskUnsorted[] = []): DeskCounts {
	const c: DeskCounts = { lines: items.length + unsorted.length, dishes: 0, wines: 0, cocktails: 0, unplaced: unsorted.length };
	for (const i of items) {
		if (i.kind === 'dish') c.dishes++;
		else if (i.kind === 'wine') c.wines++;
		else if (i.kind === 'cocktail') c.cocktails++;
		else c.unplaced++;
	}
	return c;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * The sentence under the read: "Read 47 lines: 31 dishes for the kitchen, 9
 * wines for the cellar, 4 cocktails for the bar, 3 I could not place." A room
 * with nothing for it is left out rather than counted at nought, so a dinner
 * menu does not read "0 wines for the cellar" on every paste.
 */
export function countsLine(c: DeskCounts): string {
	const parts: string[] = [];
	if (c.dishes) parts.push(`${plural(c.dishes, 'dish', 'dishes')} for the kitchen`);
	if (c.wines) parts.push(`${plural(c.wines, 'wine', 'wines')} for the cellar`);
	if (c.cocktails) parts.push(`${plural(c.cocktails, 'cocktail', 'cocktails')} for the bar`);
	if (c.unplaced) parts.push(`${c.unplaced} I could not place`);
	const head = `Read ${plural(c.lines, 'line', 'lines')}`;
	return parts.length ? `${head}: ${parts.join(', ')}.` : `${head}.`;
}

/** "9 wines and 4 cocktails", "9 wines", "1 cocktail": what is going to the other rooms. */
export function handList(wines: number, cocktails: number): string {
	const parts: string[] = [];
	if (wines) parts.push(plural(wines, 'wine', 'wines'));
	if (cocktails) parts.push(plural(cocktails, 'cocktail', 'cocktails'));
	return parts.join(' and ');
}

const fold = (s: string) => s.replace(/\s+/g, ' ').trim();

const isDigit = (c: string) => c >= '0' && c <= '9';

/**
 * Where `figure` next occurs in `hay` at or after `from` as a figure of its
 * own, or -1: not the 50 inside 9.50, not the 12 inside 12.50, not the 8
 * inside 2018. The same walk the Maître d' client makes over the source
 * text (onPage in oot-maitre.js), kept here so the two guards agree on what
 * "on the page" means. A separator binds only between digits, so the comma
 * in "Bread,12" binds nothing. Neither string is folded here: the caller
 * folds once and keeps the indices.
 */
export function figureIndex(hay: string, figure: string, from = 0): number {
	if (!figure) return -1;
	let at: number;
	while ((at = hay.indexOf(figure, from)) >= 0) {
		const before = at > 0 ? hay.charAt(at - 1) : '';
		const before2 = at > 1 ? hay.charAt(at - 2) : '';
		const after = hay.charAt(at + figure.length);
		const after2 = hay.charAt(at + figure.length + 1);
		const leftOk = !isDigit(before) && !((before === '.' || before === ',') && isDigit(before2));
		const rightOk = !isDigit(after) && !((after === '.' || after === ',') && isDigit(after2));
		if (leftOk && rightOk) return at;
		from = at + 1;
	}
	return -1;
}

/**
 * True when the printed price occurs in the row's own lines, whitespace
 * folded, or when every one of its parts does. An empty price is always
 * fine: it is the honest answer for a line that had none. The whole string
 * is a substring rather than a token match because a printed price is
 * whatever the menu printed, "45.00 / 22.50" included. The parts are the
 * second door, for a wine the Maître d' read: she hands the glass, the pours
 * and the bottle back as separate figures, each already checked against the
 * page, and a price line built from them can differ from the page's own
 * order of words. Each part must then stand on the line as a figure of its
 * own (figureIndex), and a price with no parts has no second door.
 */
export function priceInRaw(printed: string, raw: string, parts: readonly { amount: string }[] = []): boolean {
	const p = fold(printed);
	if (!p) return true;
	const hay = fold(raw);
	if (hay.includes(p)) return true;
	return parts.length > 0 && parts.every((part) => figureIndex(hay, fold(part.amount)) >= 0);
}
