/**
 * A restaurant's own menu, as text, turned into rows a cook can correct.
 *
 * The venue types The Kitchen's Menu in by hand today, one dish at a time. This
 * reads a photographed or pasted menu instead and produces a DRAFT: every row is
 * meant to be looked at and fixed before it is saved. That is why every row
 * carries `raw`, the source line it came from, and why `confidence` exists.
 * Nothing here writes to the session; the screen does that, after a person has
 * agreed to it.
 *
 * THIS PARSER NEVER PRODUCES ALLERGEN INFORMATION, and that is the one rule it
 * is not allowed to bend. A photograph of a menu cannot tell anybody what is in
 * a dish: "Crispy squid" says nothing about the flour it was dusted in or the
 * oil it was fried in. `MenuDish.allergens` and `MenuDish.allergensCheckedAt`
 * are the pair that separates "this dish carries none" from "nobody has looked
 * yet", so an importer that filled either of them from a menu photo would be
 * manufacturing the second reading out of the first. There is no allergen field
 * on ParsedDish at all, which is the cheapest way to make that mistake
 * impossible rather than merely discouraged.
 *
 * `tags` is not an exception to that. It carries the dietary MARKS THE MENU
 * ITSELF PRINTED, the (v) and the [GF] the kitchen chose to put on the page, and
 * nothing is ever derived for it: not from a dish name, not from a description,
 * not from an ingredient that happens to be mentioned. A menu that prints no
 * marks produces no tags, which is the honest answer.
 *
 * ON CASE, AND WHY SECTION NAMES COME BACK AS PRINTED. A heading typed
 * "STARTERS" is returned as "STARTERS", not tidied to "Starters". Title-casing
 * is a lie waiting to happen the moment a menu says BBQ, PX, DOP or IPA, and the
 * cook is already editing these rows, so retyping one heading costs less than a
 * wrong one shipped silently on every dish under it.
 *
 * ON OCR DAMAGE. The dirty-input rules here are about WHITESPACE and stray
 * characters, never about spelling or digits. An OCR pass that reads 9.5 as
 * "9.S" leaves a row with no price and `confidence: 'low'`, and that is the
 * correct outcome: repairing it to 9.5 would be the parser inventing a price,
 * which is the one thing a menu importer must never do.
 *
 * WHERE THE READING NOW HAPPENS. This file is the thin adapter over the Menu
 * Desk's reader (src/lib/desk/desk-reader.ts), which reads a whole menu into a
 * desk file of dishes, wines and cocktails and is shared as one port with the
 * Codex and the Ledger. `parseMenuText` is `readMenu` with every row folded
 * back into the seven pinned keys of ParsedDish, so nothing downstream learns a
 * new field it did not ask for, and `skipped` is the desk's unsorted lines in
 * source order with the truncation notice last. The doctrine above is the
 * reader's doctrine too; menu-parse.test.ts is the regression floor it must
 * keep, and desk-reader.test.ts is where the stacked menus that broke the old
 * parser are pinned.
 */

import { deskSource, toParsedDish } from './desk/desk-file';
import { readMenu } from './desk/desk-reader';

/** One draft row. Every field reports what the text said; none of them is a claim about the dish. */
export interface ParsedDish {
	/** The heading this dish sat under, as printed. Empty when the menu never said. */
	section: string;
	name: string;
	/** Empty when the line carried none. */
	description: string;
	/**
	 * AS PRINTED, always a string: '12', '12.50', '£14', 'MP', '9/14'. Never a
	 * number, because the printed form carries what a number throws away (which
	 * currency, two sizes, market price) and because rounding somebody else's
	 * menu price is not this parser's business. Empty when the line had no price,
	 * and never guessed.
	 */
	price: string;
	/**
	 * Dietary marks the menu printed, lower case: 'v', 'vg', 'gf', 'df', 'n'.
	 * A record of what is on the page, NOT allergen information and not a dietary
	 * claim this app has checked. Nothing is ever inferred into this list.
	 */
	tags: string[];
	/** 'low' means the row is a guess and the screen should show it differently. */
	confidence: 'high' | 'low';
	/** The source line, or lines, verbatim, so a person can see where the row came from. */
	raw: string;
}

export interface ParseResult {
	dishes: ParsedDish[];
	/** Source lines that were read and deliberately not turned into dishes. */
	skipped: string[];
}

/**
 * Read a menu.
 *
 * Total by construction: any string in, a result out, no throw. The reader does
 * the work; this hands back its rows in the shape every caller of this file has
 * always had, with the desk's unsorted lines as `skipped` and the size-guard
 * notice, when the reader stopped early, as the last entry, because reading half
 * a menu and saying nothing about it would be the parser lying about how much of
 * the page it saw.
 */
export function parseMenuText(text: string): ParseResult {
	if (typeof text !== 'string' || text === '') return { dishes: [], skipped: [] };
	const file = readMenu(text, deskSource('paste', 'table', text));
	const skipped = file.unsorted.map((u) => u.raw);
	if (file.notice) skipped.push(file.notice);
	return { dishes: file.items.map(toParsedDish), skipped };
}
