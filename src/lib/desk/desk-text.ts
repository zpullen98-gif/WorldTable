/**
 * Text hygiene for the Menu Desk: the one place a pasted, photographed, linked
 * or agent-read menu is cleaned before anything reads it.
 *
 * ONE FUNCTION, EVERY PATH. The paste box and the link reader used to clean
 * text separately, and a zero-width joiner that the link path stripped rode
 * straight through the paste path into a saved dish name, where it is
 * impossible to see and fails every later match on that name. menu-link.ts's
 * normaliseText now calls stripInvisible, the reader calls it on every line,
 * and the inbox keys on foldName, so the three cannot drift apart again.
 *
 * WHAT THIS NEVER DOES. No spelling repair and no digit repair, ever. Commander's
 * prints "glazeover" and "withlemon" because their layout tool ate the spaces,
 * and an OCR pass reads 9.5 as "9.S". Those stay exactly as they arrived: the
 * first is the venue's text and not this app's to correct, and the second is a
 * price the app does not know, which is a different thing from a price the app
 * can guess. Repairing either would be the importer inventing what the menu
 * says, and that is the one thing it must never do.
 */

/**
 * The characters that carry no ink. Zero-width space, non-joiner and joiner
 * (U+200B to U+200D), the word joiner (U+2060), the byte-order mark that a
 * Windows paste leaves at the front of a file (U+FEFF) and the soft hyphen
 * (U+00AD). Commander's dinner menu carries three U+200D on its own, one at
 * the top and two under the desserts, each sitting alone on a line that would
 * otherwise be blank.
 */
const INVISIBLE = /[\u200B-\u200D\u2060\uFEFF\u00AD]/g;

/**
 * The spaces that are not U+0020: the no-break space a web page uses for
 * layout, the en and em spaces a typeset PDF uses for alignment, the narrow
 * no-break space French typography puts before a colon, the ideographic space.
 * Each becomes an ordinary space so that "Tortilla\u00A07" splits into a name
 * and a price the way "Tortilla 7" does.
 *
 * The tab is NOT in this class, deliberately: menu-link.ts writes a tab between
 * two table cells so that a price stays on the line of its dish, and the
 * reader treats a tab as a gap between a name and its price. Folding it away
 * would undo that.
 */
const ODD_SPACE = /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g;

/**
 * Removes the invisible characters and folds the odd spaces. Newlines, tabs
 * and every printing character are left alone, in the order they came.
 */
export function stripInvisible(text: string): string {
	return text.replace(INVISIBLE, '').replace(ODD_SPACE, ' ');
}

/**
 * A name reduced to what two spellings of it share: accents off, case off,
 * punctuation and runs of space down to one space. "Crème Brûlée", "creme
 * brulee" and "CRÈME  BRÛLÉE" fold to the same key, which is how the inbox
 * knows a second read of the same menu is the same dish and not a new one.
 *
 * The floor deck's foldText, copied line for line rather than imported: the
 * desk modules are ported as one plain JS file into two apps that have no
 * bundler, so nothing in src/lib/desk may reach outside the folder at runtime.
 */
export function foldName(name: string): string {
	return String(name ?? '')
		.normalize('NFD')
		.replace(/[\u0300-\u036F]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

/**
 * A short fingerprint of a menu's text, so that pasting the same menu into a
 * second app can say "this was read on the World Table today" instead of
 * reading it twice. FNV-1a over the stripped, space-folded text, as eight hex
 * characters.
 *
 * Whitespace is folded before hashing because the same menu arrives with
 * different whitespace by every door: the link reader tabs its table cells,
 * the paste box keeps the page's indentation, a photograph has neither. The
 * WORDS are what make it the same menu.
 *
 * This is a fingerprint for "never twice", not a security measure, and it must
 * not become one: SubtleCrypto is async and absent on plain http, and the
 * three apps compare this string synchronously on open.
 */
export function hashText(text: string): string {
	const folded = stripInvisible(text).replace(/\s+/g, ' ').trim();
	let h = 0x811c9dc5;
	for (let i = 0; i < folded.length; i++) {
		h ^= folded.charCodeAt(i);
		// Multiply by the FNV prime, 16777619, in 32-bit arithmetic. Math.imul
		// keeps it in a 32-bit integer where `*` would drift into a double.
		h = Math.imul(h, 0x01000193);
	}
	return (h >>> 0).toString(16).padStart(8, '0');
}
