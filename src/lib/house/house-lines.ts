/**
 * house-lines.ts: the words in a line, the dash a line may never carry, and
 * the caps on the three timed lines.
 *
 * Every comment in this file ships inside the ported static/shared/oot-house.js
 * (tools/port-house.mjs transpiles with comments kept, and its assertClean
 * refuses any dash spelling, a carriage return and a regex literal outside
 * ASCII), so the comments here are dash-free and every regex is written in
 * ASCII, with an escape for any character beyond it.
 *
 * PURE AND PORTABLE: no import from outside src/lib/house, no DOM, no Node.
 * The port joins every house module inside one IIFE, so each top-level name
 * here is unique across the directory (the engine refuses a collision).
 *
 * Two of the functions are the client's, copied rather than imported, so a
 * pack builder running under Node and a wing with no bundler apply the same
 * rule the Maitre d' client applies to her prose: DASH is the client's
 * DASH_RE built from the same five pieces, and stripDashes is its
 * stripDashes to the character. house-validate.test.ts holds both against
 * the client's source, so a change there fails here.
 */
import { KEYS, LINE_CAPS } from './house-schema';
import type { Lines } from './house-schema';

/**
 * The five spellings the publish gate counts and the client filters her
 * prose for: the em dash, its three entities and the spaced double hyphen.
 * Built from pieces, as the client builds DASH_RE, so this file does not
 * carry what it refuses. DASH_SOURCE is exported on its own so a test can
 * hold it against the client's DASH_RE.source and fail the moment they drift.
 */
export const DASH_SOURCE = ['\\u2014', '&' + 'mdash;', '&#' + '8212;', '&#' + 'x2014;', ' ' + '-- '].join('|');
export const DASH = new RegExp(DASH_SOURCE, 'gi');

/**
 * What a House string may not carry: the client's five, and the en dash
 * too, because the House's own rule is no dash of any spelling anywhere.
 * Not global, so a .test here never carries a lastIndex into the next call.
 */
const ANY_DASH = new RegExp(DASH_SOURCE + '|' + '\\u2013', 'i');

/** True when the string carries a dash in any spelling the House refuses. */
export function hasDash(s: string): boolean {
	return typeof s === 'string' && ANY_DASH.test(s);
}

/**
 * A word is a run of letters, digits and apostrophes; a hyphenated word is
 * one word. The letters are ASCII plus the two Latin blocks that carry the
 * accents a menu prints (a producer, a region, a grape), written as escapes
 * so the literal stays ASCII for the port. A figure with a decimal point is
 * two words, because it is two words when spoken.
 */
const WORD_SOURCE = "[A-Za-z0-9\\u00C0-\\u024F'\\u2019]+(?:-[A-Za-z0-9\\u00C0-\\u024F'\\u2019]+)*";
const WORD_RE = new RegExp(WORD_SOURCE, 'g');

/** How many words a line holds, by the rule above; nothing for a blank or a non-string. */
export function wordCount(s: string): number {
	if (typeof s !== 'string' || !s) return 0;
	const found = s.match(WORD_RE);
	return found ? found.length : 0;
}

/** A timed line over its cap: which line, how many words it holds, and the cap it passed. */
export interface LineProblem {
	field: keyof Lines;
	words: number;
	cap: number;
}

/**
 * The lines over their caps, in the order of the three. The caps are an
 * argument so a drill or a stricter house can tighten them; the default is
 * LINE_CAPS. A missing line is not a problem here (it is empty, not long).
 */
export function lineProblems(
	lines: Partial<Lines> | null | undefined,
	caps: Readonly<Record<keyof Lines, number>> = LINE_CAPS
): LineProblem[] {
	const out: LineProblem[] = [];
	if (!lines || typeof lines !== 'object') return out;
	for (const field of KEYS.Lines) {
		const cap = caps[field];
		const words = wordCount(lines[field] || '');
		if (words > cap) out.push({ field, words, cap });
	}
	return out;
}

/**
 * The client's stripDashes, copied: her prose only. A dash becomes a comma,
 * or a colon when what follows reads as a list (two commas or more before
 * the sentence ends). The verbatim fields never pass through here: a name,
 * a description and a spec are the menu's words, dash and all. A pack
 * builder calls this over every prose string it writes and reads the log
 * for a meaning that moved.
 */
export function stripDashes(s: string): string {
	if (typeof s !== 'string' || !s) return s;
	if (!DASH.test(s)) { DASH.lastIndex = 0; return s; }
	DASH.lastIndex = 0;
	const out = s.replace(DASH, function (m: string, offset: number, whole: string) {
		const rest = whole.slice(offset + m.length).split(/[.!?\n]/)[0];
		const commas = (rest.match(/,/g) || []).length;
		return commas >= 2 ? ': ' : ', ';
	});
	return out
		.replace(/\s+([,:])/g, '$1')
		.replace(/([,:])\s*[,:]/g, '$1')
		.replace(/[ \t]{2,}/g, ' ')
		.replace(/^[,:]\s*/, '')
		.replace(/\s*[,:]\s*$/, '')
		.replace(/([,:])\s*\n/g, '\n');
}
