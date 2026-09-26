/**
 * The reader: a venue's whole menu, as text, read into a desk file of dishes,
 * wines and cocktails a person can correct and adopt. Offline, free, every
 * user; the same shape the online agent fills, so the review tables never
 * learn a second format.
 *
 * WHAT WENT WRONG BEFORE, AND WHAT THIS DOES ABOUT IT. The old parser assumed
 * a pub menu: one item per line, the price at the end, capitals for headings.
 * Commander's Palace prints the price on its own line under the name, so
 * every price was thrown away as junk (a line with no letters) and cleared
 * the dish above it; every dish came back priceless and low, and a menu whose
 * dish names are capitals produced no dishes at all. So this reader tests for
 * a price line and a pour line BEFORE the junk rule, votes per block on
 * whether the layout is stacked (prices on their own lines) or inline (prices
 * at the end), attaches a price line to the priceless name above it, and
 * decides what a line of capitals is by what follows it rather than by its
 * case alone.
 *
 * THE RULES THAT DO NOT BEND. No allergen field exists on any row, and nothing
 * here reads contents: `marks` carries the (v) and the [GF] the menu PRINTED
 * and nothing is ever inferred into it. No price, quantity or spelling is
 * ever invented: a price is stored exactly as printed and every figure in
 * `parts` is a substring of it; '3/4 oz lime' stays one spec part and is
 * never '4 oz'; 'glazeover' and '9.S' stay as they arrived. Section names
 * come back as printed, capitals and all. Every row keeps `raw`, the lines it
 * came from, and `lines`, where they were, so a person can always see where
 * a row came from and a price that is not in `raw` can be caught on screen.
 * A line the reader cannot place goes to `unsorted` with a reason, never
 * silently away.
 *
 * Total by construction: any string in, a desk file out, no throw, bounded
 * work on a pasted wall of text.
 */

import {
	ANY_CURRENCY,
	BARE_MARK,
	CLOCK,
	CONNECTOR,
	DAY_WORD,
	DECORATION_LEAD,
	DECORATION_TAIL,
	ESTATE_WORDS,
	FRAMED,
	ITEM_NUMBER,
	LIST_INDEX,
	LONE_CURRENCY,
	MARKET_PRICE,
	MARKS,
	NAME_MAX_CHARS,
	NAME_MAX_WORDS,
	NAMED_NUMBERS,
	NOISE,
	NOTE_LEAD,
	OFFERING_WORDS,
	POUR_LINE,
	POUR_SIZE,
	PRICE_LINE_MAX_TOKENS,
	PRICE_WORDS,
	PRICED_BARE,
	PRICED_WITH_CURRENCY,
	SIZE_WORD,
	SMALL_WORDS,
	TERMINAL_STOP,
	VINTAGE,
	VINTAGE_LINE,
	VINTAGE_SHORT,
	drinkHits,
	foldKey,
	isDescriptorLine,
	isIngredientList,
	isSectionOnly,
	isSpecList,
	readDescriptors,
	sectionKindOf,
	splitSpec,
	wineHits
} from './desk-vocab';
import { stripInvisible } from './desk-text';
import {
	emptyDesk,
	mintDeskId,
	type DeskCocktail,
	type DeskDish,
	type DeskFile,
	type DeskItem,
	type DeskItemBase,
	type DeskKind,
	type DeskPrice,
	type DeskPricePart,
	type DeskSource,
	type DeskUnsorted,
	type DeskUnsure,
	type DeskWine,
	type DeskWingKind
} from './desk-file';
import { classify } from './desk-sort';

/**
 * The size guard. A menu is a page or two: a long one runs to about 6kB of text,
 * and a photographed one is shorter still. The cap sits two orders of magnitude
 * above that because this runs synchronously on the main thread of a tab and the
 * input is a paste box, which means one day it will contain a novel, a whole PDF
 * dump or a log file. Everything past the cap is dropped rather than read, and
 * the desk file's `notice` says so in words, because reading half a menu and
 * saying nothing about it would be the reader lying about how much of the page
 * it saw.
 */
export const MAX_CHARS = 200_000;
export const MAX_LINES = 5_000;
export const TRUNCATION_NOTICE =
	'Only the first 200,000 characters were read. Split the menu up and bring the rest in separately.';

/**
 * How far back from the end of a line a price is allowed to start, in tokens.
 * Real price tails are short: 'Glass 8 Bottle 30' is already the long end at
 * four. The limit stops the tail walk eating a whole sentence that happens to
 * end in a number, and it bounds the work done per line on a pasted wall of text.
 */
const PRICE_TAIL_TOKENS = 8;

/**
 * The `why` sentence on a row whose description opens on a framed note the
 * page printed over its name ('~le Coup du Milieu~' over 'Kiss the Crab').
 * One string, because the first reading and a re-read must say the same thing.
 */
const LEAD_IN_WHY = 'The framed note above the name was read as a lead-in to its description.';

/**
 * The gap marker. A tab, a run of two or more spaces, a dot leader or a rule
 * of dashes between a name and its price is a GAP, and in a stacked block a
 * bare trailing integer is a price only after one: 'French 75' has no gap and
 * stays whole, 'Olives .......... 4' has a leader and is priced 4. The gap is
 * read on the raw line before its whitespace is folded, and stood in for by
 * this token so the fold cannot lose it. U+0002 never appears in a menu.
 */
const GAP = '\u0002';
const GAP_TOKEN = /\u0002/g;

/* -------------------------------------------------------------------------
 * The line scan
 * ---------------------------------------------------------------------- */

/** What one source line turned out to be, worked out once before any of it is placed. */
type LineKind = 'blank' | 'noise' | 'price' | 'pour' | 'vintage' | 'note' | 'text';

interface Scan {
	/** Zero-based source line. */
	index: number;
	raw: string;
	/** The line folded: leaders and runs of space gone, index numbering gone. */
	text: string;
	/** `text` with the gap markers still in, for the price walk. */
	gapped: string;
	kind: LineKind;
	indented: boolean;
	/** A list index the line printed in front of the name ('101  Ployez'). */
	bin: string;
	/** Printed dietary marks taken off the line, lower case. */
	marks: string[];
	/** The name and price under the inline rule (a bare trailing integer is a price). */
	inline: { name: string; price: string };
	/** The name and price under the stacked rule (a bare trailing integer needs a gap). */
	stacked: { name: string; price: string };
	/** The name and price under the price-first rule (the line opens on its price). */
	lead: { name: string; price: string };
	/** For a note: the text with the tilde decoration off and any printed star kept. */
	note: string;
	/**
	 * For a note: true when the decoration closed on both ends ('~le Coup du
	 * Milieu~'), the shape of a heading whose core failed the case test, as
	 * opposed to a star-led footnote ('* Must be ordered 20 minutes in advance').
	 */
	framedNote: boolean;
	/** For a heading that was framed or colon-terminated: the heading as printed, decoration off. */
	framedHeading: string;
	/** For a pour line: the sizes as printed. */
	sizes: string[];
	/** For a vintage line: the vintage as printed. */
	vintage: string;
}

/** @returns true when the token is a price on its own, including a two-size '6/9'. */
function isPrice(token: string): boolean {
	if (PRICED_WITH_CURRENCY.test(token) || PRICED_BARE.test(token)) return true;
	if (!token.includes('/')) return false;
	const parts = token.split('/');
	return (
		parts.length > 1 && parts.every((p) => PRICED_WITH_CURRENCY.test(p) || PRICED_BARE.test(p))
	);
}

/** How many prices a token stands for, so '6/9' counts as the two sizes it is. */
function priceValues(token: string): number {
	if (MARKET_PRICE.test(token)) return 1;
	if (!isPrice(token)) return 0;
	return token.includes('/') ? token.split('/').length : 1;
}

type TokenKind = 'price' | 'market' | 'size' | 'connector' | 'currency' | 'gap' | 'other';

function kindOf(token: string): TokenKind {
	if (token === GAP) return 'gap';
	if (isPrice(token)) return 'price';
	if (MARKET_PRICE.test(token)) return 'market';
	if (SIZE_WORD.test(token)) return 'size';
	if (LONE_CURRENCY.test(token)) return 'currency';
	if (CONNECTOR.test(token)) return 'connector';
	return 'other';
}

/** A whole number with no currency and no decimals: the one price shape a name can also end in. */
function isBareInteger(token: string): boolean {
	return /^\d{1,5}$/.test(token);
}

/**
 * True when the number at `at` belongs to the name in front of it: 'Bin 389',
 * 'No. 23', 'French 75', 'Bacardi 151'. Tested on the phrase ending at that
 * token, so the word before decides.
 */
function namedNumber(tokens: string[], at: number): boolean {
	const words = tokens.filter((t) => t !== GAP);
	const idx = words.indexOf(tokens[at], Math.max(0, tokens.slice(0, at).filter((t) => t !== GAP).length));
	if (idx < 0) return false;
	const phrase = words.slice(Math.max(0, idx - 2), idx + 1).join(' ');
	return NAMED_NUMBERS.test(phrase);
}

/** Removes the gap markers and folds what is left to single spaces. */
function ungap(text: string): string {
	return text.replace(GAP_TOKEN, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Split a line into what it is selling and what it costs, by walking in from
 * the end and taking tokens for as long as they could be part of a price.
 *
 * Walking in from the end rather than matching a pattern against the whole line
 * is what makes the awkward ones fall out for free: dot leaders have already
 * become gaps by the time this runs, a two-size 'Glass 8 Bottle 30' is just a
 * longer tail, and a name that merely contains a number ('Pizza 12 inch', 'Half
 * and half 12') stops the walk at the first word that is not price-shaped.
 *
 * The tail is then trimmed at the front, and a size word may only lead when the
 * tail holds two prices or more. That is the whole difference between 'Glass 8
 * Bottle 30' (one wine sold two ways, kept verbatim) and 'Half chicken 14' (a
 * dish called Half chicken, priced 14).
 *
 * Under the STACKED rule a bare trailing integer is a price only after a gap,
 * because in a block whose prices sit on their own lines a number on the name
 * line is part of the name: 'French 75', 'Rum Runner 151', 'Penfolds Bin 389'.
 * NAMED_NUMBERS protects the known cases in either layout.
 */
function splitPrice(gapped: string, stacked: boolean): { name: string; price: string } {
	const tokens = gapped.split(' ').filter(Boolean);
	const plain = ungap(gapped);
	if (tokens.filter((t) => t !== GAP).length < 2) return { name: plain, price: '' };

	// 'Market price' written out in full is two tokens. Joined here so the walk
	// below can see the one price it is, the same way it already sees 'MP'.
	const words = tokens.filter((t) => t !== GAP);
	if (
		words.length > 2 &&
		/^market$/i.test(words[words.length - 2]) &&
		/^price\.?$/i.test(words[words.length - 1])
	) {
		return { name: words.slice(0, -2).join(' '), price: words.slice(-2).join(' ') };
	}

	let start = tokens.length;
	const floor = Math.max(1, tokens.length - PRICE_TAIL_TOKENS);
	while (start > floor) {
		const token = tokens[start - 1];
		const kind = kindOf(token);
		if (kind === 'other') break;
		if (kind === 'price' && isBareInteger(token) && namedNumber(tokens, start - 1)) break;
		start--;
	}
	if (start === tokens.length) return { name: plain, price: '' };

	let end = tokens.length;
	while (end > start && (kindOf(tokens[end - 1]) === 'connector' || tokens[end - 1] === GAP)) end--;
	while (start < end && tokens[start] === GAP) start++;

	let values = 0;
	for (let i = start; i < end; i++) values += priceValues(tokens[i]);
	if (values === 0) return { name: plain, price: '' };

	// One price keeps only the price itself; two or more is a list of sizes and
	// is kept whole, size words and all.
	if (values < 2) {
		while (start < end) {
			const kind = kindOf(tokens[start]);
			if (kind === 'price' || kind === 'market' || kind === 'currency') break;
			start++;
		}
	}

	// The gap rule: one bare integer with nothing but the name in front of it
	// and no gap before it belongs to the name in a stacked block.
	if (stacked && values === 1 && end - start === 1 && isBareInteger(tokens[start]) && tokens[start - 1] !== GAP) {
		return { name: plain, price: '' };
	}

	return {
		name: ungap(tokens.slice(0, start).join(' ')),
		price: ungap(tokens.slice(start, end).join(' '))
	};
}

/**
 * The price-first split: the line opens on its price and the rest is the name,
 * '12.50 Soup of the day'. A currency standing apart is taken with the figure
 * ('£ 12 Soup', '12 GBP Soup'). Used only under a block that votes priceFirst,
 * so '12 Oysters 18' on a pub menu is still twelve oysters and a cellar's
 * '101 Ployez-Jacquemart' keeps its bin number in the name.
 */
function splitLeadingPrice(gapped: string): { name: string; price: string } {
	const tokens = gapped.split(' ').filter((t) => t && t !== GAP);
	const plain = ungap(gapped);
	if (tokens.length < 2) return { name: plain, price: '' };
	let n = 0;
	if (isPrice(tokens[0]) || MARKET_PRICE.test(tokens[0])) n = 1;
	else if (LONE_CURRENCY.test(tokens[0]) && isPrice(tokens[1])) n = 2;
	if (n === 0) return { name: plain, price: '' };
	if (n === 1 && LONE_CURRENCY.test(tokens[1] ?? '')) n = 2;
	if (n >= tokens.length) return { name: plain, price: '' };
	return { name: tokens.slice(n).join(' '), price: tokens.slice(0, n).join(' ') };
}

/** @returns the mark a bracketed word stands for, or null when it is an ordinary word. */
function markOf(word: string): string | null {
	const key = word.toLowerCase().replace(/[^a-z]/g, '');
	return key in MARKS ? MARKS[key] : null;
}

/** Decoration a menu hangs off the end of a dish name, whose legend lives elsewhere on the page. */
function stripTrailingSymbols(text: string): string {
	return text.replace(/[\s*†‡♦◆●▪✿❋✹\u0002]+$/, '');
}

/**
 * Take the dietary marks off a line and hand back the line without them.
 *
 * A bracketed group is only removed when EVERY word inside it is a mark, so '(v)'
 * and '[GF, DF]' come off and '(served cold)' stays exactly where the kitchen put
 * it. Bare marks are taken from the end of the line too, since 'Falafel v 8.50'
 * is a common printing, but only the one and two letter marks: 'Mixed veg 4' must
 * not come back as a dish called Mixed.
 *
 * Decorative symbols are removed from the name and produce NO mark. A star or a
 * diamond means whatever the legend printed elsewhere on the menu says it means,
 * this reader cannot see that legend, and deciding a diamond meant gluten free
 * would be inventing a dietary claim on the kitchen's behalf.
 */
function takeMarks(text: string): { text: string; marks: string[] } {
	const marks: string[] = [];
	const add = (mark: string) => {
		if (!marks.includes(mark)) marks.push(mark);
	};

	let out = text.replace(/[([]([^)\]]{1,40})[)\]]/g, (whole, inside: string) => {
		const inner = inside.split(/[\s,/&+.]+/).filter(Boolean);
		if (inner.length === 0) return whole;
		const found = inner.map(markOf);
		if (found.some((m) => m === null)) return whole;
		for (const m of found) add(m as string);
		return ' ';
	});

	out = stripTrailingSymbols(out);
	for (;;) {
		const bare = out.match(/^(.*\S)\s+([A-Za-z]{1,2})$/);
		if (!bare || !BARE_MARK.test(bare[2])) break;
		add(markOf(bare[2]) as string);
		out = stripTrailingSymbols(bare[1]);
	}

	return { text: out.replace(/\s{2,}/g, ' ').trim(), marks };
}

/** A line the menu prints about itself: a website, a notice, an address, a page number. */
function isNoise(text: string): boolean {
	return NOISE.some((pattern) => pattern.test(text));
}

/**
 * Opening hours, and telephone numbers however they have been punctuated. Both
 * are asked only about a line that produced no price, because a dish line is a
 * dish line: 'Sunday roast 18.50' carries a day name and a number that reads as
 * a clock time, and it is still dinner.
 */
function isScheduleOrNumber(text: string): boolean {
	if (DAY_WORD.test(text) && CLOCK.test(text)) return true;
	return isPhoneNumber(text);
}

/** Nine to fifteen digits and almost no letters: a telephone number however it is spaced. */
function isPhoneNumber(text: string): boolean {
	const digits = text.replace(/\D/g, '');
	const letters = text.replace(/[^A-Za-z]/g, '');
	return digits.length >= 9 && digits.length <= 15 && letters.length <= 12;
}

/**
 * Lines with nothing on them to sell: a rule of dashes and the single stray
 * characters an OCR pass leaves behind when it finds a speck on the paper. A
 * lone price is NOT junk any more; it is tested for first. The letter test is
 * Unicode-wide on purpose, so a menu written in a script with no Latin letters
 * is not thrown away as specks.
 */
function isJunk(text: string): boolean {
	if (!/\p{L}/u.test(text)) return true;
	return /^[A-Za-z]{1,2}$/.test(text);
}

function stripDecoration(text: string): string {
	return text.replace(DECORATION_LEAD, '').replace(DECORATION_TAIL, '').trim();
}

function words(text: string): string[] {
	return text.split(/\s+/).filter(Boolean);
}

/** The words allowed to OPEN a price line without being a price: 'from 12', 'per person 45'. Never a dish. */
const PRICE_LEAD_WORDS = new Set(['from', 'per']);

/**
 * A line of nothing but prices and the words that go with them: '12', '15.50',
 * '45.00 / 22.50', '6/9', 'Glass 8 Bottle 30', '$90 per Person + Optional Wine
 * Pairing ($40)'. Up to twelve tokens, at least one price or MP, and every
 * other token a connector, a currency, a bracket or a PRICE_WORD.
 *
 * The FIRST token has to be a price, a currency, a size word or one of the two
 * lead words. That rule is what keeps 'Tasting Menu 65', 'Wine Pairing 40' and
 * 'Cheese Course 12' rows with a tail price: every word of them is a
 * PRICE_WORD, and read as price lines they were glued into one invented
 * composite price under the heading above them, which then came back as a
 * sure dish and the three real rows were gone.
 *
 * A telephone number is refused first, because '020 7946 0958' is three
 * price-shaped numbers in a row and it is nobody's dinner.
 */
function isPriceLine(text: string): boolean {
	if (!/\d|\bm\.?p\.?\b|\bpoa\b|\bmarket price\b/i.test(text)) return false;
	if (!/[.,]/.test(text) && !ANY_CURRENCY.test(text) && isPhoneNumber(text)) return false;
	const tokens = words(text.replace(/market\s+price/i, 'MP'));
	if (tokens.length === 0 || tokens.length > PRICE_LINE_MAX_TOKENS) return false;
	let prices = 0;
	let first = true;
	for (const raw of tokens) {
		const token = raw.replace(/^[(\[]+|[)\]]+$/g, '');
		if (!token) continue;
		const word = token.toLowerCase().replace(/[.:]$/, '');
		if (isPrice(token) || MARKET_PRICE.test(token)) {
			prices++;
			first = false;
			continue;
		}
		if (first) {
			if (!LONE_CURRENCY.test(token) && !SIZE_WORD.test(token) && !PRICE_LEAD_WORDS.has(word)) return false;
			first = false;
			continue;
		}
		if (LONE_CURRENCY.test(token) || CONNECTOR.test(token)) continue;
		if (PRICE_WORDS.has(word)) continue;
		return false;
	}
	return prices > 0;
}

/** Has capitals and no lower case: a line the menu shouted. */
function isCaps(text: string): boolean {
	return /[A-Z]/.test(text) && !/[a-z]/.test(text);
}

/**
 * Title case: every word capitalised or a small word, and the FIRST word
 * capitalised. 'To Begin', 'From the Grill', 'Kiss the Crab' are; 'le Coup du
 * Milieu' is not, and that first-word rule is what makes it a note rather
 * than a heading when it arrives framed in tildes.
 */
function isTitleCase(text: string): boolean {
	const parts = words(text);
	if (parts.length === 0 || parts.length > 6) return false;
	if (/[\d,]/.test(text)) return false;
	if (!/[a-z]/.test(text)) return false;
	if (!/^\p{Lu}/u.test(parts[0])) return false;
	return parts.every((w) => SMALL_WORDS.has(w.toLowerCase()) || /^\p{Lu}/u.test(w));
}

/**
 * The shape of a name: short, few words, no terminal stop, a first word that
 * does not open on a lower-case letter, a last word that is not a small word,
 * and at least half of its full words capitalised (a number or a symbol
 * counts as capitalised; a small word counts for nothing either way). 'Shrimp
 * & Tasso Henican' and 'Soup of the day' are name-shaped; 'Wild Louisiana
 * white shrimp stuffed with housemade tasso ham' is not, and neither is
 * 'trinity infused gin | benedictine | lime'.
 *
 * The first-word and last-word rules are for a description that a page or an
 * OCR pass has wrapped. 'with a red wine jus and' opens on a small word and
 * 'Served with a side of' closes on one; each is the middle of a sentence and
 * neither is a dish. Counting small words as capitalised made both of them
 * names, and in a stacked block a name over a description starts a row, so
 * every wrapped description on a photographed menu was cut into priceless
 * rows named by their first fragment.
 */
function isNameShaped(text: string): boolean {
	const parts = words(text);
	if (parts.length === 0 || wordCount(text) > NAME_MAX_WORDS || text.length > NAME_MAX_CHARS) return false;
	if (TERMINAL_STOP.test(text) && !/\b(?:no|st|ch|dom|mt)\.$/i.test(text)) return false;
	if (/^\p{Ll}/u.test(parts[0])) return false;
	if (SMALL_WORDS.has(parts[parts.length - 1].toLowerCase())) return false;
	const full = parts.filter((w) => !SMALL_WORDS.has(w.toLowerCase()));
	const capitalised = full.filter((w) => !/^\p{Ll}/u.test(w)).length;
	return capitalised * 2 >= full.length;
}

/** Words with a letter or a digit in them: an ampersand is punctuation, not a word, when a name is measured. */
function wordCount(text: string): number {
	return words(text).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** A line with more words than a name has: a sentence, whatever its case. */
function isSentenceShaped(text: string): boolean {
	return wordCount(text) > NAME_MAX_WORDS || TERMINAL_STOP.test(text);
}

/**
 * Everything a single line is, worked out once so the placing pass can look
 * ahead cheaply. The text arrives with the invisible characters already gone
 * (readMenu strips the whole paste first) so the block structure the joiners
 * broke is already whole.
 */
function scan(raw: string, index: number): Scan {
	const base: Scan = {
		index,
		raw,
		text: '',
		gapped: '',
		kind: 'text',
		indented: /^[ \t]{2,}|^\t/.test(raw),
		bin: '',
		marks: [],
		inline: { name: '', price: '' },
		stacked: { name: '', price: '' },
		lead: { name: '', price: '' },
		note: '',
		framedNote: false,
		framedHeading: '',
		sizes: [],
		vintage: ''
	};

	let rest = raw;
	const indexed = LIST_INDEX.exec(rest);
	if (indexed) {
		base.bin = indexed[1];
		rest = rest.slice(indexed[0].length);
	}

	// Dot and underscore leaders, a rule of dashes, a tab, a run of spaces: each
	// is a printer drawing the eye across to the price, and each becomes a GAP
	// token before the whitespace is folded so the price walk can still see it.
	let gapped = rest
		.replace(/(?:[.·_]{2,}|…+)/g, ` ${GAP} `)
		.replace(/(\S)\s*[-–\u2014]{3,}\s*(\S)/g, `$1 ${GAP} $2`)
		.replace(/[ ]{2,}|\t+/g, ` ${GAP} `)
		.replace(/\s+/g, ' ')
		.trim()
		// Last, so the whitespace above has already been made ordinary and the
		// number is where the pattern expects to find it. `raw` still carries the
		// line as printed, so a row worth checking still shows the numbering
		// that was taken off it.
		.replace(ITEM_NUMBER, '');
	gapped = gapped.replace(new RegExp(`^(?:${GAP} ?)+`), '').replace(new RegExp(`(?: ?${GAP})+$`), '').trim();
	const text = ungap(gapped);
	base.text = text;
	base.gapped = gapped;

	if (text === '') return { ...base, kind: 'blank' };
	if (isNoise(text)) return { ...base, kind: 'noise' };
	const vintage = VINTAGE_LINE.exec(text);
	if (vintage) return { ...base, kind: 'vintage', vintage: text.trim() };
	// The pour line first: '5 oz / 2.5 oz' is also a price line to the looser
	// test, and read as one it would glue itself onto the prices above it.
	if (POUR_LINE.test(text)) return { ...base, kind: 'pour', sizes: text.match(POUR_SIZE) ?? [] };
	if (isPriceLine(text)) return { ...base, kind: 'price' };
	if (isJunk(text)) return { ...base, kind: 'noise' };

	const marked = takeMarks(gapped);
	const inline = splitPrice(marked.text, false);
	const stacked = splitPrice(marked.text, true);
	if (inline.price === '' && isScheduleOrNumber(text)) return { ...base, kind: 'noise' };

	// A mark sits after the price as readily as before it, so the name is swept a
	// second time now that the price is out of the way: 'Falafel v 8.50'.
	const finish = (split: { name: string; price: string }) => {
		const trailing = takeMarks(split.name);
		for (const m of trailing.marks) if (!marked.marks.includes(m)) marked.marks.push(m);
		return { name: stripDecoration(ungap(trailing.text)), price: split.price };
	};
	base.inline = finish(inline);
	base.stacked = finish(stacked);
	base.lead = finish(splitLeadingPrice(marked.text));
	base.marks = marked.marks;

	// Decorated lines. Framed, with a title-case or capitals core, is a heading
	// ('~ Mains ~'); a colon at the end is a heading ('Sides:'); a tilde or a
	// star at the front of anything else is a NOTE ('~le Coup du Milieu~',
	// '* Must be ordered 20 minutes in advance'). Which item a note belongs to
	// is the block pass's decision, and it needs to know whether the note was
	// framed, because only the framed shape can be a label for the item under
	// it. Only the TILDE frame counts as one there: FRAMED accepts a star at
	// either end, so a star-led footnote closed with a second star ('* Must be
	// ordered in advance *') would read as framed and be held for the name
	// under it, when the star points back at the item above it whatever
	// closes the line.
	const core = stripDecoration(text);
	const framed = FRAMED.test(text) && words(core).length <= 6;
	if (base.inline.price === '' && core) {
		if (framed && (isCaps(core) || isTitleCase(core))) return { ...base, framedHeading: core };
		if (text.endsWith(':') && words(core).length <= 6) return { ...base, framedHeading: core };
		if (NOTE_LEAD.test(text) && !(isTitleCase(core) && words(core).length <= 6) && !isCaps(core)) {
			return { ...base, kind: 'note', note: text.replace(/^[\s~]+|[\s~]+$/g, '').trim(), framedNote: framed && /^\s*~/.test(text) };
		}
		if (framed) return { ...base, kind: 'note', note: core, framedNote: true };
	}
	return base;
}

/* -------------------------------------------------------------------------
 * Prices as printed, in parts
 * ---------------------------------------------------------------------- */

/**
 * The figures in a printed price, each with the word beside it. The label is
 * the alpha run BEFORE the figure ('Glass 8', 'Bottle 30', 'Optional Wine
 * Pairing ($40)') or, when there is none, the run AFTER it up to the next
 * connector ('$90 per Person'). A currency standing apart from its figure is
 * joined back on ('£ 12', '14 GBP'), and a two-size '6/9' is two parts.
 * Every amount is a substring of `printed`; nothing is parsed into a number.
 */
export function priceParts(printed: string): DeskPricePart[] {
	const parts: DeskPricePart[] = [];
	if (!printed) return parts;
	const tokens = words(printed.replace(/market\s+price/i, 'market price'));
	let before: string[] = [];
	let currency = '';
	let open: DeskPricePart | null = null;
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i].replace(/^[(\[]+|[)\]]+$/g, '');
		if (!token) continue;
		if (/^market$/i.test(token) && /^price\.?$/i.test(tokens[i + 1] ?? '')) {
			parts.push({ amount: `${tokens[i]} ${tokens[i + 1]}`, label: before.join(' ') });
			before = [];
			open = null;
			i++;
			continue;
		}
		if (MARKET_PRICE.test(token) || isPrice(token)) {
			const label = before.join(' ');
			before = [];
			const amounts = token.includes('/') && !PRICED_WITH_CURRENCY.test(token) ? token.split('/') : [token];
			for (const a of amounts) {
				const part: DeskPricePart = { amount: currency ? `${currency} ${a}` : a, label };
				parts.push(part);
				// A price with no label in front may take the words after it.
				open = label ? null : part;
			}
			currency = '';
			continue;
		}
		if (LONE_CURRENCY.test(token)) {
			const last = parts[parts.length - 1];
			if (last && tokens[i - 1] !== undefined && last.amount === tokens[i - 1].replace(/^[(\[]+|[)\]]+$/g, '')) {
				last.amount = `${last.amount} ${token}`;
			} else {
				currency = token;
			}
			continue;
		}
		if (CONNECTOR.test(token)) {
			before = [];
			open = null;
			continue;
		}
		if (open) {
			open.label = open.label ? `${open.label} ${token}` : token;
		} else {
			before.push(token);
		}
	}
	// Only amounts that are substrings of the printed price survive, which is
	// the desk file's own rule and the reason the currency join above is done
	// with a single space: the printed text was folded to single spaces too.
	return parts.filter((p) => printed.includes(p.amount));
}

function priceOf(printed: string): DeskPrice {
	return { printed, parts: priceParts(printed) };
}

/* -------------------------------------------------------------------------
 * Drafts: a row before its kind is known
 * ---------------------------------------------------------------------- */

/** A row as the block pass gathers it, before the sorter says what it is. */
interface Draft {
	/** Which block the name line sat in, so a continuation from another block cannot join. */
	block: number;
	section: string;
	headings: string[];
	name: string;
	/** What the name line carried after a dash, colon, pipe or comma. */
	description: string;
	/** True when the name and description were split on a comma, which could be wrong. */
	ambiguous: boolean;
	printed: string;
	/** How the price was found, for `why`. */
	priceWhy: string;
	/** Sizes from a pour line under the price, as printed. */
	sizes: string[];
	/** A vintage on its own line, as printed. */
	vintageLine: string;
	/** The lines under the name, as printed. */
	body: string[];
	marks: string[];
	bin: string;
	raw: string;
	first: number;
	last: number;
	why: string[];
	/** True for the low row a priced heading also becomes. */
	fromHeading: boolean;
}

/**
 * A draft from its name line. In a STACKED block the name line is the whole
 * name, because the description sits on its own line under the price, so the
 * comma split is not tried there: 'Sauté of Sweet Corn, Grilled Kale,
 * Asparagus & Leeks' over '10' is one side, not a side and a description.
 * A dash, colon or pipe is still the kitchen's own punctuation in either
 * layout.
 */
function newDraft(block: number, section: string, headings: string[], s: Scan, name: string, price: string, stacked: boolean): Draft {
	const split = splitDescription(name, stacked);
	return {
		block,
		section,
		headings,
		name: split.name,
		description: split.description,
		ambiguous: split.ambiguous,
		printed: price,
		priceWhy: price ? 'Price read from the end of the line.' : '',
		sizes: [],
		vintageLine: '',
		body: [],
		marks: [...s.marks],
		bin: s.bin,
		raw: s.raw,
		first: s.index,
		last: s.index,
		why: [],
		fromHeading: false
	};
}

/** Adds a source line to a draft's raw, keeping the lines verbatim. */
function extend(d: Draft, s: Scan): void {
	d.raw += '\n' + s.raw;
	d.last = s.index;
	for (const m of s.marks) if (!d.marks.includes(m)) d.marks.push(m);
}

/**
 * Where the name stops and the description starts.
 *
 * A dash, a colon or a pipe is punctuation the kitchen chose in order to separate
 * the two, so a row split on one of those is trusted. A comma is not: 'Crispy
 * squid, lemon aioli' splits correctly and 'Ham, egg and chips' does not, and
 * nothing in the line says which one it is looking at. Rows split on a comma come
 * back marked ambiguous so the screen can flag them, and the cook can run an eye
 * down the column and fix the two that are wrong.
 *
 * Neither split may happen INSIDE a bracket. A menu that keys its allergens on
 * the dish prints 'Sticky toffee pudding (N, G, D)', and splitting on the first
 * comma there gave a dish called 'Sticky toffee pudding (N' with 'G, D)' for a
 * description: two halves of a bracket, in two fields, and neither of them a
 * dish. The letters themselves are still never read as allergens, here or
 * anywhere else in this module. They are the menu's own legend and the cook is
 * the one who checks a dish.
 */
function splitAt(text: string, re: RegExp): [string, string] | null {
	/* Walk the candidates and take the first that sits at bracket depth zero. */
	const rx = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
	let depth = 0;
	const opens: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
	const closes = new Set([')', ']', '}']);
	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (opens[ch]) depth++;
		else if (closes.has(ch)) depth = Math.max(0, depth - 1);
		else if (depth === 0) {
			rx.lastIndex = i;
			const m = rx.exec(text);
			if (m && m.index === i) {
				const head = text.slice(0, i).trim();
				const tail = text.slice(i + m[0].length).trim();
				if (head && tail) return [head, tail];
			}
		}
	}
	return null;
}

function splitDescription(name: string, stacked = false): { name: string; description: string; ambiguous: boolean } {
	const clear = splitAt(name, /(?:\s[-–\u2014]\s|:\s|\s?\|\s?)/);
	if (clear) return { name: clear[0], description: clear[1], ambiguous: false };

	const comma = stacked ? null : splitAt(name, /,\s*/);
	if (comma) return { name: comma[0], description: comma[1], ambiguous: true };

	return { name: name.trim(), description: '', ambiguous: false };
}

/* -------------------------------------------------------------------------
 * From draft to row
 * ---------------------------------------------------------------------- */

/** The name minus its vintage token, for the producer and wine fields. */
function withoutVintage(name: string): string {
	return name
		.replace(new RegExp(VINTAGE.source, 'gi'), (m, v: string) => m.slice(0, m.length - v.length))
		.replace(VINTAGE_SHORT, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * 'N.V.' and 'nv' as 'NV', a year as itself, and the two-digit form pivoted on
 * the clock: "'19" is 2019 and "'85" is 1985, each said in `why`, because a
 * list read this year cannot hold a vintage from a year that has not come. A
 * fixed century read 'Ch. Latour '85' as a bottle from 2085, a year invented
 * for a wine that was real.
 */
function readVintage(d: Draft, descriptors: string, why: string[], now: Date): string {
	const line = d.vintageLine.trim();
	if (line) {
		why.push('Vintage read from its own line.');
		return /^n\.?v\.?$/i.test(line) ? 'NV' : /^mv$/i.test(line) ? 'MV' : line;
	}
	const onName = VINTAGE.exec(d.name);
	if (onName) return normaliseVintage(onName[1]);
	const onLines = VINTAGE.exec(descriptors);
	if (onLines) {
		why.push('Vintage read from the descriptor line.');
		return normaliseVintage(onLines[1]);
	}
	const short = VINTAGE_SHORT.exec(d.name) ?? VINTAGE_SHORT.exec(descriptors);
	if (short) {
		const past = Number(short[1]) > now.getFullYear() % 100;
		const year = `${past ? '19' : '20'}${short[1]}`;
		why.push(
			past
				? `The vintage was printed as '${short[1]} and is read as ${year}, because this century has not reached '${short[1]} yet.`
				: `The vintage was printed as '${short[1]} and is read as ${year}.`
		);
		return year;
	}
	return '';
}

function normaliseVintage(v: string): string {
	if (/^n\.?v\.?$/i.test(v)) return 'NV';
	if (/^mv$/i.test(v)) return 'MV';
	return v;
}

/**
 * Producer and wine, split at the first vocabulary hit on the name line.
 * Estate words stay with the producer ('Domaine Leflaive' before
 * 'Puligny-Montrachet'); a hit that IS the estate's own name ('Ch. Margaux')
 * makes the whole name the producer; no hit and no estate word makes the
 * whole name the wine with an empty producer, which the Codex fills from its
 * corpus on adopt and SAYS so. Never guessed here.
 */
function splitProducer(name: string): { producer: string; wine: string } {
	const tokens = words(withoutVintage(name));
	const isEstate = (t: string) => ESTATE_WORDS.has(t.toLowerCase());
	const hits = wineHits(tokens);
	const first = hits.length ? hits[0].at : -1;
	if (first <= 0) {
		if (first === 0 && tokens.length > 1 && !isEstate(tokens[0])) return { producer: '', wine: tokens.join(' ') };
		return tokens.length && isEstate(tokens[0])
			? { producer: tokens.join(' '), wine: '' }
			: { producer: '', wine: tokens.join(' ') };
	}
	const before = tokens.slice(0, first);
	if (before.every(isEstate)) return { producer: tokens.join(' '), wine: '' };
	return { producer: before.join(' '), wine: tokens.slice(first).join(' ') };
}

/** The label of a price part says it is a pour: a size, or a glass-sized word. */
function isPourLabel(label: string): boolean {
	return /^\d/.test(label) || /^(?:glass|gls|carafe|half|pitcher|jug|small|sm|large|lg|taste|flight|\d)/i.test(label);
}

function isBottleLabel(label: string): boolean {
	return /^(?:bottle|btl|bt)\b/i.test(label);
}

function amountValue(amount: string): number {
	const m = /\d+(?:[.,]\d+)?/.exec(amount);
	return m ? Number.parseFloat(m[0].replace(',', '.')) : Number.NaN;
}

function buildWine(base: DeskItemBase, d: Draft, why: string[], now: Date): DeskWine {
	const descriptors = [d.description, ...d.body].filter(Boolean).join(' ');
	const read = readDescriptors(descriptors);
	const { producer, wine } = splitProducer(d.name);
	const vintage = readVintage(d, descriptors, why, now);

	// The name line's own vocabulary counts too: 'Rioja Reserva 2019' printed
	// its region and its style, and a person should not have to retype them.
	const onName = readDescriptors(wine || withoutVintage(d.name));
	const region = [...read.region, ...onName.region.filter((r) => !read.region.includes(r))];
	const country = [...read.country, ...onName.country.filter((c) => !read.country.includes(c))];
	const grapes = [...read.grapes, ...onName.grapes.filter((g) => !read.grapes.includes(g))];
	const style = [...read.style, ...onName.style.filter((s) => !read.style.includes(s))];
	if (onName.region.length || onName.grapes.length || onName.style.length) why.push('Region, grape or style read from the name line.');
	if (read.unread.length) why.push(`Not read, kept as printed: ${read.unread.map((u) => `"${u}"`).join(', ')}.`);

	// Pours and the bottle, from the printed parts and the pour line.
	const pours: DeskWine['pours'] = [];
	let bottle = '';
	const parts = base.price.parts;
	const unlabelled = parts.filter((p) => !p.label);
	for (const p of parts) {
		if (isPourLabel(p.label)) pours.push({ price: p.amount, size: p.label });
		else if (isBottleLabel(p.label)) bottle = p.amount;
	}
	if (d.sizes.length && unlabelled.length) {
		const n = Math.min(d.sizes.length, unlabelled.length);
		for (let i = 0; i < n; i++) pours.push({ price: unlabelled[i].amount, size: d.sizes[i] });
		why.push(`${n === 1 ? 'One pour' : `${n} pours`} read from the sizes printed under the price, paired in order.`);
		if (unlabelled.length > n) bottle = unlabelled[unlabelled.length - 1].amount;
	} else if (unlabelled.length === 2 && !pours.length && !bottle) {
		const [a, b] = unlabelled;
		const smaller = amountValue(a.amount) <= amountValue(b.amount) ? a : b;
		const larger = smaller === a ? b : a;
		pours.push({ price: smaller.amount, size: '' });
		bottle = larger.amount;
		why.push('Two prices with no labels: the smaller is read as the glass and the larger as the bottle.');
	} else if (unlabelled.length === 1 && !pours.length && !bottle) {
		if (/glass|pour|taste|flight/i.test(d.headings.join(' '))) {
			pours.push({ price: unlabelled[0].amount, size: '' });
			why.push('One price under a by-the-glass heading, read as the pour.');
		} else {
			bottle = unlabelled[0].amount;
		}
	} else if (unlabelled.length > 2 && !pours.length) {
		why.push('More than two prices with no labels; none is read as a pour or a bottle.');
	}
	if (!producer) why.push('No producer read from the name line; the Codex may fill it from its corpus.');

	return {
		...base,
		kind: 'wine',
		producer,
		wine,
		vintage,
		region: region.join(', '),
		country: country.join(', '),
		grapes,
		style: style.join(', '),
		bin: d.bin,
		pours,
		bottle,
		descriptors
	};
}

function buildCocktail(base: DeskItemBase, d: Draft, why: string[]): DeskCocktail {
	const lines = [d.description, ...d.body].filter(Boolean);
	const spec: string[] = [];
	const prose: string[] = [];
	for (const line of lines) {
		if (isSpecList(line)) spec.push(...splitSpec(line));
		else prose.push(line);
	}
	const spirits = new Set<string>();
	for (const part of spec) for (const h of drinkHits(part)) if (h.term === 'spirit') spirits.add(h.key);
	const baseSpirit = spirits.size === 1 ? [...spirits][0] : '';
	if (spec.length) why.push(`${spec.length} spec parts read as printed, no measures added.`);
	if (spirits.size > 1) why.push('Two spirit words on the spec, so no base spirit is named.');
	if (!spec.length && lines.length) why.push('The line under the name reads as prose, not a spec.');
	return { ...base, kind: 'cocktail', spec, description: prose.join(' '), baseSpirit };
}

function buildDish(base: DeskItemBase, d: Draft): DeskDish {
	const description = [d.description, ...d.body].filter(Boolean).join(' ');
	const ingredientsNamed = description && isIngredientList(description) ? splitSpec(description) : [];
	return { ...base, kind: 'dish', description, ingredientsNamed };
}

/** A pour label on any price part, or a pour line under the price: the wine list's own signature. */
function pourLabelled(d: Draft, parts: DeskPricePart[]): boolean {
	return d.sizes.length > 0 || parts.some((p) => isPourLabel(p.label) || isBottleLabel(p.label));
}

/**
 * Finishes a draft into a row: the sorter names the kind (or the caller
 * forces one), the kind's fields are read from the lines, and the confidence
 * is settled with its reasons in `why`.
 *
 * `high` only when a price was found, the name is short and not a sentence,
 * no comma split was guessed, the kind is not unsure, and every wine
 * descriptor was read or at least one cocktail part was recognised.
 * Everything else is `low`, with the reason written down, because a row that
 * says it is sure and is wrong is the one shape this desk must not produce.
 *
 * `now` is the clock the two-digit vintage form pivots on; the reader passes
 * its own so a test can fix it.
 */
function finish(d: Draft, ids: Set<string>, force?: DeskKind, rand?: () => number, now: Date = new Date()): DeskItem {
	const why = [...d.why];
	if (d.priceWhy) why.push(d.priceWhy);
	const price = priceOf(d.printed);
	const bodyForSort = [d.description, ...d.body].filter(Boolean);
	const sorted = classify({
		name: d.name,
		headings: d.headings,
		body: bodyForSort,
		pourLabelled: pourLabelled(d, price.parts),
		vintage: d.vintageLine,
		bin: d.bin
	});
	const kind: DeskKind = force ?? sorted.kind;
	if (!force) why.push(...sorted.why);

	const id = mintDeskId(ids, rand);
	ids.add(id);
	const base: DeskItemBase = {
		id,
		kind,
		section: d.section,
		name: d.name,
		price,
		marks: d.marks,
		confidence: 'low',
		why,
		raw: d.raw,
		lines: [d.first, d.last]
	};

	let item: DeskItem;
	let sure = true;
	if (kind === 'wine') {
		item = buildWine(base, d, why, now);
		if (!readDescriptors([d.description, ...d.body].filter(Boolean).join(' ')).covered) sure = false;
	} else if (kind === 'cocktail') {
		item = buildCocktail(base, d, why);
		if (!item.spec.some((p) => drinkHits(p).some((h) => h.term !== 'method'))) {
			sure = false;
			if (item.spec.length) why.push('No spec part is a bottle or a mixer the desk knows.');
		}
	} else if (kind === 'dish') {
		item = buildDish(base, d);
	} else {
		// Unplaced by the sorter, or by a person taking a row back out of a room:
		// `could` is the sorter's list, or the one kind it had settled on.
		const could: DeskWingKind[] = sorted.kind === 'unsure' ? sorted.could : [sorted.kind];
		const unsure: DeskUnsure = { ...base, kind: 'unsure', could };
		item = unsure;
		sure = false;
	}

	if (!d.printed) {
		sure = false;
		why.push('No price on these lines.');
	}
	if (d.name.length > NAME_MAX_CHARS) {
		sure = false;
		why.push('The name is long enough to be a whole sentence read as one.');
	} else if (!d.fromHeading && isSentenceShaped(d.name)) {
		// A sentence that became a row (a described line under a fresh heading
		// with a price beneath it) is shown for what it may be: a description
		// whose dish name the page never printed, or one the reader missed.
		sure = false;
		why.push('The name reads as a sentence, so it may be a description whose dish name was not read.');
	}
	if (d.ambiguous) {
		sure = false;
		why.push('The name and description were split on a comma, which could be wrong.');
	}
	if (d.fromHeading) sure = false;
	item.confidence = sure ? 'high' : 'low';
	return item;
}

/* -------------------------------------------------------------------------
 * The block pass
 * ---------------------------------------------------------------------- */

/** Where a block prints its prices: on their own lines, at the end of a line, or at the start of one. */
type Layout = 'stacked' | 'inline' | 'priceFirst';

/** The lines of a menu, cut into blocks with a layout vote each. */
interface Pass {
	scans: Scan[];
	/** Block number per line; -1 for a blank or a noise line, which end a block. */
	blockOf: number[];
	/** Per block: how its prices are read. */
	layout: Layout[];
	consumed: Set<number>;
	/** The lines that became section headings, which the price-above test looks past. */
	headingLines: Set<number>;
}

/**
 * Blocks and the layout vote. A block is a run of lines with no blank and no
 * noise line in it.
 *
 * Its layout is `priceFirst` when no price sits on its own line or at the end
 * of one, two or more of its lines open on a price and those are most of its
 * text lines, and at least one of them is a figure that could be nothing but
 * a price (a decimal or a currency): '12.50 Soup of the day' over '14 Prawn
 * cocktail'. Without that one sure figure a block of bare leading numbers is
 * left alone, because '101 Ployez-Jacquemart' over '102 Krug' is a cellar
 * list numbering its bins and a price read from it would be invented.
 *
 * Otherwise `stacked` when price-only lines are at least as many as inline
 * tail prices (a block with no prices at all votes stacked, which is the safe
 * reading: nothing on a name line is then taken for a price without a gap),
 * else `inline`, the pub-menu reading.
 */
function cut(scans: Scan[]): Pass {
	const blockOf = new Array<number>(scans.length).fill(-1);
	const layout: Layout[] = [];
	let block = -1;
	let open = false;
	let priceOnly = 0;
	let tail = 0;
	let texts = 0;
	let leading = 0;
	let sureLead = false;
	const close = () => {
		if (!open) return;
		if (priceOnly === 0 && tail === 0 && leading >= 2 && leading * 2 > texts && sureLead) layout.push('priceFirst');
		else layout.push(priceOnly >= tail ? 'stacked' : 'inline');
		open = false;
	};
	for (let i = 0; i < scans.length; i++) {
		const s = scans[i];
		if (s.kind === 'blank' || s.kind === 'noise') {
			close();
			continue;
		}
		if (!open) {
			block++;
			open = true;
			priceOnly = 0;
			tail = 0;
			texts = 0;
			leading = 0;
			sureLead = false;
		}
		blockOf[i] = block;
		if (s.kind === 'price') priceOnly++;
		else if (s.kind === 'text') {
			texts++;
			if (s.inline.price !== '') tail++;
			else if (s.lead.price !== '') {
				leading++;
				if (/[.,]/.test(s.lead.price) || ANY_CURRENCY.test(s.lead.price)) sureLead = true;
			}
		}
	}
	close();
	return { scans, blockOf, layout, consumed: new Set(), headingLines: new Set() };
}

/** The layout of the block a line sits in; a line outside every block reads inline. */
function layoutOf(p: Pass, index: number): Layout {
	const b = p.blockOf[index];
	return b >= 0 ? p.layout[b] : 'inline';
}

/** The name and price of a text line under its block's layout. */
function nameOf(p: Pass, s: Scan): { name: string; price: string } {
	const layout = layoutOf(p, s.index);
	return layout === 'stacked' ? s.stacked : layout === 'priceFirst' ? s.lead : s.inline;
}

/** The next line in the same block after `i`, skipping consumed ones; null at the block's end. */
function nextInBlock(p: Pass, i: number): Scan | null {
	const b = p.blockOf[i];
	for (let j = i + 1; j < p.scans.length && p.blockOf[j] === b; j++) {
		if (!p.consumed.has(j)) return p.scans[j];
	}
	return null;
}

/** The next line worth reading after `i`, across blanks and noise; null at the end. */
function nextSignificant(p: Pass, i: number): Scan | null {
	for (let j = i + 1; j < p.scans.length; j++) {
		const s = p.scans[j];
		if (s.kind === 'blank' || s.kind === 'noise' || p.consumed.has(j)) continue;
		return s;
	}
	return null;
}

/** True when nothing unconsumed sits before `i` in its block: the line has a break above it. */
function firstInBlock(p: Pass, i: number): boolean {
	const b = p.blockOf[i];
	for (let j = i - 1; j >= 0 && p.blockOf[j] === b; j--) {
		if (!p.consumed.has(j)) return false;
	}
	return true;
}

/**
 * True when every unconsumed line before `i` in its block is a price line or
 * a heading: the block began with prices. 'STARTERS' over '12' over 'Soup of
 * the day' begins with a price as much as the same block without its heading.
 */
function beginsWithPrices(p: Pass, i: number): boolean {
	const b = p.blockOf[i];
	for (let j = i - 1; j >= 0 && p.blockOf[j] === b; j--) {
		if (p.consumed.has(j) || p.headingLines.has(j)) continue;
		if (p.scans[j].kind !== 'price') return false;
	}
	return true;
}

/**
 * Reads the scanned lines into drafts and unsorted lines. This is the whole
 * algorithm; the comments on each branch are the rules, and desk-reader.test.ts
 * pins every one of them on the Commander's Palace menus that broke the old
 * parser.
 */
function place(p: Pass): { drafts: Draft[]; unsorted: DeskUnsorted[] } {
	const { scans } = p;
	const drafts: Draft[] = [];
	const unsorted: DeskUnsorted[] = [];
	let section = '';
	let headings: string[] = [];
	// Declared through a cast rather than an annotation, because the closures
	// below assign these and TypeScript narrows an annotated `let x: T | null =
	// null` to null for the rest of the function, reading every later access
	// as `never`.
	/** The draft a continuation may join: the last one started, whatever block it was in. */
	let current = null as Draft | null;
	/** The last draft under the current heading, which a note joins across a blank line. */
	let lastInSection = null as Draft | null;
	/** A price line at the start of a block, waiting for the name under it. */
	let held = null as Scan | null;
	/** The line of the last price attached, so a second price line directly under it can extend it. */
	let lastPriceAt = -1;
	/** The block whose first name took a held price: one that prints each price ABOVE its name. */
	let priceAboveBlock = -1;
	/**
	 * The framed notes held back while the line under them is placed, because
	 * that line decides where they go: see the note rule in the loop below. A
	 * list in page order, because two framed notes can stack over one name.
	 */
	let leads: Scan[] = [];

	const orphan = (s: Scan, reason: string) => unsorted.push({ raw: s.raw, line: s.index, reason });
	const dropHeld = () => {
		if (held) orphan(held, 'orphan-price');
		held = null;
	};
	/** The note rule's plain case: the note is a footnote on the item above it, or on nothing. */
	const joinNote = (d: Draft | null, s: Scan) => {
		if (!d) {
			orphan(s, 'heading-note');
			return;
		}
		d.body.push(s.note);
		d.why.push('A note under the item joined it.');
		extend(d, s);
	};
	/**
	 * The held notes go to the item above after all, because the line under
	 * them did not start a row. Called BEFORE anything else is added to a draft
	 * or a section is closed, so `raw` keeps the page's order: the notes sit
	 * above the line that is about to join, and they must be appended first,
	 * in the order the page printed them.
	 */
	const settleLead = (to: Draft | null) => {
		for (const l of leads) joinNote(to, l);
		leads = [];
	};
	/** A line that runs on under a row joins it; a note held over that line joins the row first. */
	const join = (d: Draft, s: Scan, name: string) => {
		settleLead(d);
		d.body.push(name);
		extend(d, s);
	};
	const start = (s: Scan, name: string, price: string): Draft => {
		const b = p.blockOf[s.index];
		const layout = layoutOf(p, s.index);
		const d = newDraft(b, section, headings, s, name, price, layout === 'stacked');
		if (price && layout === 'priceFirst') d.priceWhy = 'Price read from the start of the line.';
		if (leads.length) {
			// The framed notes held over this name label it: they lead the
			// description, as printed with the frame off and in page order,
			// ahead of anything the name line itself carried after a dash or a
			// colon. Joined with a single space, which is the join reReadAs makes
			// when it reads the same lines back, so a re-read row keeps the
			// description its first reading gave it. Taken before the held price
			// below, so a price line above them all still comes first in `raw`.
			const notes = leads.map((l) => l.note).join(' ');
			d.description = d.description ? `${notes} ${d.description}` : notes;
			d.raw = leads.map((l) => l.raw).join('\n') + '\n' + d.raw;
			d.first = leads[0].index;
			for (const l of leads) for (const m of l.marks) if (!d.marks.includes(m)) d.marks.push(m);
			d.why.push(LEAD_IN_WHY);
			leads = [];
		}
		if (!price && held) {
			// The block began with a price: it belongs to the first name under it,
			// and every later price line in the block belongs to the name below it.
			d.printed = held.text;
			d.priceWhy = 'Price read from the line above the name.';
			d.raw = held.raw + '\n' + d.raw;
			d.first = held.index;
			lastPriceAt = held.index;
			priceAboveBlock = b;
			held = null;
		}
		drafts.push(d);
		current = d;
		lastInSection = d;
		return d;
	};
	const setSection = (name: string, at: number) => {
		// A note held over a line that turned out to be a heading goes back to
		// the last item of the section that is closing, while it is still here.
		settleLead(lastInSection);
		// Two headings with nothing between them are one run: 'OUR WINE PROGRAM'
		// then 'WINE BY GLASS', and the sorter reads both.
		headings = lastInSection === null && section ? [name, section] : [name];
		section = name;
		current = null;
		lastInSection = null;
		p.headingLines.add(at);
		dropHeld();
	};
	/**
	 * The priced-heading exception. A heading with offering words followed by a
	 * price line is BOTH the section and a low row named as printed, so the
	 * price the page put there is reviewed rather than lost. Its printed marks
	 * stay in the name and make no mark on the row: a heading's marks belong
	 * to no dish.
	 */
	const headingWithPrice = (s: Scan, name: string, priceLine: Scan) => {
		setSection(name, s.index);
		const d = newDraft(p.blockOf[priceLine.index], section, headings, s, name, priceLine.text, true);
		d.marks = [];
		d.fromHeading = true;
		d.priceWhy = 'Price read from the line under the heading.';
		d.why.push('The heading carries a price, so it is also listed as a row to review.');
		extend(d, priceLine);
		p.consumed.add(priceLine.index);
		lastPriceAt = priceLine.index;
		drafts.push(d);
		current = d;
		lastInSection = d;
	};
	/**
	 * A heading as the page printed it: decoration and trailing symbols off, the
	 * dietary marks kept. 'PUDDINGS (V)' is the section, brackets and all; the
	 * mark-stripped `name` only decides what shape the line has.
	 */
	const asPrinted = (s: Scan): string => stripDecoration(stripTrailingSymbols(s.text));
	/**
	 * The shape of a block that prints each price above its name, looked for
	 * under a heading: a price, a text line, then a price or the block's end.
	 * 'STARTERS' over '12' over 'Soup of the day' is a heading over a priced
	 * item, not a dish called STARTERS.
	 */
	const pricesLeadNames = (i: number): boolean => {
		const a = nextInBlock(p, i);
		if (!a || a.kind !== 'price') return false;
		const b = nextInBlock(p, a.index);
		if (!b || b.kind !== 'text') return false;
		const c = nextInBlock(p, b.index);
		return c === null || c.kind === 'price';
	};
	/**
	 * True when what follows a priced heading's price line is an item or a
	 * break: the next raw line is missing, blank, another price, a name, more
	 * capitals or a framed heading. A DESCRIPTION there says the title-case
	 * line above the price was a dish, not a heading: 'Feast Platter' over '45'
	 * over 'Chicken, lamb, rice, salads' is a platter, and reading it as the
	 * section swallowed every row after it.
	 */
	const itemsFollow = (priceLine: Scan): boolean => {
		const after = scans[priceLine.index + 1];
		if (!after || after.kind !== 'text' || after.framedHeading) return true;
		const n = nameOf(p, after).name;
		return isCaps(n) || isNameShaped(n);
	};

	for (let i = 0; i < scans.length; i++) {
		if (p.consumed.has(i)) continue;
		const s = scans[i];
		const b = p.blockOf[i];

		if (s.kind === 'blank') {
			dropHeld();
			continue;
		}
		if (s.kind === 'noise') {
			dropHeld();
			orphan(s, 'noise');
			current = null;
			continue;
		}
		if (s.kind === 'vintage') {
			if (current && current.block === b) {
				current.vintageLine = s.vintage;
				extend(current, s);
			} else orphan(s, 'no-name');
			continue;
		}
		if (s.kind === 'pour') {
			if (current && current.block === b) {
				current.sizes.push(...s.sizes);
				current.why.push('Pour sizes read from the line under the price.');
				extend(current, s);
			} else orphan(s, 'orphan-price');
			continue;
		}
		if (s.kind === 'price') {
			if (current && current.block === b && !current.printed) {
				current.printed = s.text;
				current.priceWhy = 'Price read from the line under the name.';
				extend(current, s);
				lastPriceAt = i;
			} else if (current && current.block === b && current.printed && lastPriceAt === i - 1) {
				// 'Glass 8' over 'Bottle 30': two price lines under one name, read as
				// one printed price with a space between, which invents nothing.
				current.printed = `${current.printed} ${s.text}`;
				current.why.push('Two price lines under the name, read together.');
				extend(current, s);
				lastPriceAt = i;
			} else if (beginsWithPrices(p, i) || priceAboveBlock === b) {
				// The block's first price sat above its name, so this one belongs to
				// the name below it too; only the last price in such a block, with
				// nothing under it, is an orphan.
				dropHeld();
				held = s;
			} else orphan(s, 'orphan-price');
			continue;
		}
		if (s.kind === 'note') {
			// The note rule. A note is a footnote on the item above it, across a
			// blank line if need be, EXCEPT a framed one printed directly over a
			// text line in its own block: '~le Coup du Milieu~' over 'Kiss the
			// Crab' is the page labelling the mid-meal drink under it, and joined
			// to the crudo above it the label named the wrong course. Only the
			// line under it can say whether it starts a row (the note leads that
			// row's description) or joins the row above (the note joins it too),
			// so the note is held until that line is placed. A framed note over
			// ANOTHER framed note is held as well, so two labels stacked over one
			// name both lead it, and the line under the lower one decides for
			// both. Only the FRAMED shape is held: a star-led footnote sits on
			// the line before the next dish name just as often ('* Must be
			// ordered 20 minutes in advance' directly over 'Housemade Ice
			// Cream'), and the star points back at the soufflé above it, not
			// forward at the ice cream. A blank, a heading, a price line or the
			// block's end under the note leaves it with the item above, and so
			// does an unframed note, which is why the plain case settles any
			// held notes before it joins: they sit above it on the page.
			//
			// A held note is marked consumed, so the backward lookers read past
			// it the way they read past a consumed price line. 'Mains' under a
			// held note still has its break above, and firstInBlock() has to say
			// so, or the heading is demoted to a dish that the note then leads
			// and every row under it loses its section. The loop is already past
			// this index, so nothing else reads the mark.
			const under = scans[i + 1];
			const underCanLead =
				!!under &&
				p.blockOf[under.index] === b &&
				!p.consumed.has(under.index) &&
				((under.kind === 'text' && !under.framedHeading) || (under.kind === 'note' && under.framedNote));
			if (s.framedNote && underCanLead) {
				leads.push(s);
				p.consumed.add(i);
				continue;
			}
			settleLead(lastInSection);
			joinNote(lastInSection, s);
			continue;
		}

		/* A text line. */
		const { name, price } = nameOf(p, s);
		if (name === '') {
			// Nothing but marks, or nothing at all once the decoration came off.
			settleLead(lastInSection);
			orphan(s, 'no-name');
			continue;
		}
		if (s.framedHeading) {
			setSection(s.framedHeading, i);
			continue;
		}
		if (price !== '') {
			start(s, name, price);
			continue;
		}
		if (priceAboveBlock === b && held) {
			// A block that prints each price ABOVE its name: the line after a price
			// line is the next name, whatever its shape or case, and it takes the
			// price waiting for it. Decided before the caps decision, because
			// 'PRAWN COCKTAIL' under '14' is the prawns and not a cocktail heading.
			start(s, name, '');
			continue;
		}

		const next = nextInBlock(p, i);
		const across = nextSignificant(p, i);
		const nextIsPriceLine = !!next && (next.kind === 'price' || next.kind === 'pour' || next.kind === 'vintage');
		const nextName = next && next.kind === 'text' ? nameOf(p, next) : null;
		const offering = OFFERING_WORDS.test(name);
		/** The next line is a description: text that is neither name-shaped, nor capitals, nor a framed heading. */
		const described = next !== null && nextName !== null && !next.framedHeading && !isNameShaped(nextName.name) && !isCaps(nextName.name);

		if (isCaps(name)) {
			// The caps decision, by what follows. A price line under it makes it a
			// name, unless it is a priced offering (which is both), or nothing but
			// section words over a block that prints each price above its name. A
			// description under it, priced on the line beneath or at its own end,
			// makes it a name whatever words it carries ('TOMATO SOUP' over
			// 'Roasted vine tomatoes with basil oil' over '7' is a soup, and the
			// vocabulary rule read it as a section and named the row by its
			// description), unless it is nothing but section words. Section
			// vocabulary makes it a heading. A priceless description under it
			// makes it a name. Anything else (a blank, more capitals, a name, a
			// note, the end) makes it a heading.
			const sectionOnly = isSectionOnly(name);
			if (offering && across && across.kind === 'price') {
				headingWithPrice(s, asPrinted(s), across);
				continue;
			}
			if (nextIsPriceLine) {
				if (sectionOnly && pricesLeadNames(i)) setSection(asPrinted(s), i);
				else start(s, name, '');
				continue;
			}
			if (described && next && nextName && !sectionOnly) {
				const after = nextInBlock(p, next.index);
				const pricedBelow = after !== null && after.kind === 'price';
				const pricedInline = nextName.price !== '';
				// Where the price ends, the next line tells the two apart: another
				// line of capitals or the block's end is a run of named dishes
				// ('TOMATO SOUP' then 'CRAB SALAD'); anything else under a line that
				// carries a section word ("TODAY'S SPECIALS" over one described
				// special and then 'Roast chicken 16') is a list under its heading.
				const beyond = pricedBelow ? nextInBlock(p, after.index) : after;
				const runOfNames = beyond === null || (beyond.kind === 'text' && isCaps(nameOf(p, beyond).name));
				if ((pricedBelow || pricedInline) && (runOfNames || sectionKindOf([name]) === null)) {
					const d = start(s, name, '');
					if (pricedInline) {
						// The description carries the price at its end: both are the row's.
						d.body.push(nextName.name);
						d.printed = nextName.price;
						d.priceWhy = 'Price read from the end of the description line under the name.';
						extend(d, next);
						p.consumed.add(next.index);
					}
					continue;
				}
			}
			if (sectionKindOf([name]) !== null) {
				setSection(asPrinted(s), i);
				continue;
			}
			if (described && nextName && !nextName.price) {
				start(s, name, '');
				continue;
			}
			setSection(asPrinted(s), i);
			continue;
		}

		if (isTitleCase(name) && firstInBlock(p, i)) {
			// A title-case line with a break above it is a heading when a priced
			// item follows (the pub menu's shape), or when it is a priced offering
			// with items under its price (the section AND a row), or when it names
			// a section and no price line sits under it. 'Soup of the day' over
			// '9.50' is none of those, and neither is 'Feast Platter' over '45'
			// over its own description.
			if (offering && across && across.kind === 'price' && itemsFollow(across)) {
				headingWithPrice(s, asPrinted(s), across);
				continue;
			}
			if (across && across.kind === 'text' && !across.framedHeading && nameOf(p, across).price !== '') {
				setSection(asPrinted(s), i);
				continue;
			}
			if (sectionKindOf([name]) !== null && !nextIsPriceLine) {
				setSection(asPrinted(s), i);
				continue;
			}
		}

		if (!current || current.block !== b) {
			// Nothing in this block to join. A sentence sitting directly under a
			// heading, before any item, is the heading's note ('Price of Entrée
			// includes Soup or Salad and Dessert') and goes to the unplaced list
			// where a person can still make a row of it; anything else starts one.
			if (!held && !s.bin && !nextIsPriceLine && isSentenceShaped(name) && !lastInSection && section) {
				settleLead(lastInSection);
				orphan(s, 'heading-note');
				continue;
			}
			start(s, name, '');
			continue;
		}

		if (priceAboveBlock === b) {
			// The rest of a price-above block: with no price waiting, a line is the
			// current row's description. The stacked signature (a price line under
			// a name) means nothing here, because the price under a line is the
			// next row's.
			join(current, s, name);
			continue;
		}

		if (layoutOf(p, i) !== 'stacked') {
			// The inline layout, and the price-first one, whose priceless lines are
			// descriptions. A description running on below its dish joins it, until
			// the next item. A heading-shaped line is not allowed to be one,
			// because gluing 'Bread' onto the chips above it would lose a side the
			// kitchen sells; an indented line is allowed to be one whatever its
			// shape, because headings do not sit in from the margin.
			if (!isTitleCase(name) || s.indented) join(current, s, name);
			else start(s, name, '');
			continue;
		}

		// The stacked layout. A line that is not name-shaped is a description and
		// joins. A name-shaped line starts a row when a price line follows it
		// (the stacked signature), or when it is followed by a description, or
		// when it stands among priceless peers, or always under a priced
		// heading's own row (the courses of a set menu are its items, never its
		// description); it joins the row above when it is a descriptor line
		// under a bottle waiting for its price, when it is nothing but wine
		// vocabulary under a priced bottle ('Chardonnay'), or when it is the
		// last line under a priced row (a capitalised fragment).
		const priced = current.printed !== '';
		if (!isNameShaped(name)) {
			// A line of any shape with a price line under it, when the row above
			// already has its price, is the next name: the stacked signature
			// outranks the shape ('Sauté of Sweet Corn, Grilled Kale, Asparagus &
			// Leeks' over '10' is a side, not the boudin's description).
			if (nextIsPriceLine && priced) start(s, name, '');
			else join(current, s, name);
			continue;
		}
		const hasBody = current.body.length > 0;
		const descriptor = isDescriptorLine(name);
		let begins: boolean;
		if (current.fromHeading) begins = true;
		else if (nextIsPriceLine) begins = !(descriptor && !priced);
		else if (descriptor) begins = !priced && !hasBody;
		else if (nextName && !next?.framedHeading && !isNameShaped(nextName.name)) begins = true;
		else if (nextName && !next?.framedHeading) begins = !priced || hasBody;
		else begins = !priced && !hasBody;
		if (begins) start(s, name, '');
		else join(current, s, name);
	}
	// A held note is always settled by the line under it, which is why it was
	// held; this is the guarantee, so a note can never be dropped in silence.
	settleLead(lastInSection);
	dropHeld();
	return { drafts, unsorted };
}

/* -------------------------------------------------------------------------
 * The two exports
 * ---------------------------------------------------------------------- */

export interface ReadOptions {
	/** The venue's name, when the caller knows it (the page title on the link path). */
	venue?: string;
	/** The clock, for tests. */
	now?: Date;
	/** The random source for ids, for tests. */
	rand?: () => number;
}

/**
 * Read a menu into a desk file.
 *
 * Total by construction: any string in, a desk file out, no throw. Hygiene
 * first (stripInvisible, the same call the link path makes, so the two doors
 * cannot drift), then the size guard, the line scan, the block pass and the
 * sorter. A line the reader cannot place becomes an unsorted line with a
 * reason rather than disappearing, because an unplaced line on screen is one
 * tap to make a row of and a dropped dish is invisible.
 */
export function readMenu(text: string, source: DeskSource, opts: ReadOptions = {}): DeskFile {
	const file = emptyDesk(source, opts.now);
	if (opts.venue) file.venue = opts.venue;
	if (typeof text !== 'string' || text === '') return file;

	let truncated = false;
	let body = stripInvisible(text);
	if (body.length > MAX_CHARS) {
		body = body.slice(0, MAX_CHARS);
		truncated = true;
	}
	const lines = body.replace(/\r\n?/g, '\n').split('\n');
	if (lines.length > MAX_LINES) {
		lines.length = MAX_LINES;
		truncated = true;
	}

	const pass = cut(lines.map((line, i) => scan(line, i)));
	const { drafts, unsorted } = place(pass);
	const ids = new Set<string>();
	file.items = drafts.map((d) => finish(d, ids, undefined, opts.rand, opts.now));
	file.unsorted = unsorted.sort((a, b) => a.line - b.line);
	if (truncated) file.notice = TRUNCATION_NOTICE;
	return file;
}

/**
 * Reads one row again as a kind a person chose: the Kind column's
 * Dish / Wine / Cocktail, or the "Make it a dish" chip on an unplaced row.
 * The row's own `raw` is read back through the same scan, so a re-read
 * wine gets its pours and vintage from the lines it always had, and nothing
 * is carried over from the old kind's fields. The id and the source lines
 * stay; `why` says the kind was a person's choice.
 */
export function reReadAs(item: DeskItem, kind: DeskKind): DeskItem {
	const scans = item.raw.split('\n').map((line, i) => scan(stripInvisible(line), i));
	const priceOnly = scans.filter((s) => s.kind === 'price').length;
	const tail = scans.filter((s) => s.kind === 'text' && s.inline.price !== '').length;
	const first = scans.find((s) => s.kind === 'text');
	// The price-first reading is taken back only when it is what was read: the
	// row's printed price is the first line's opening figure. Anything looser
	// would hand a re-read row a price its first reading never gave it.
	const priceFirst = priceOnly === 0 && tail === 0 && first !== undefined && first.lead.price !== '' && first.lead.price === item.price.printed;
	const layout: Layout = priceFirst ? 'priceFirst' : priceOnly >= tail ? 'stacked' : 'inline';
	const splitOf = (s: Scan) => (layout === 'stacked' ? s.stacked : layout === 'priceFirst' ? s.lead : s.inline);

	let draft: Draft | null = null;
	let held = '';
	/** A framed note printed over the name line: the lead-in its first reading gave the description. */
	let lead = '';
	for (const s of scans) {
		if (s.kind === 'blank' || s.kind === 'noise') continue;
		if (!draft) {
			if (s.kind === 'price') held = held ? `${held} ${s.text}` : s.text;
			else if (s.kind === 'note' && s.framedNote && first !== undefined && first.index > s.index) {
				// The row's lines open on a framed note, or on two stacked, with
				// the name under them, which is how the note rule wrote the lead-in
				// case; they are joined with the single space start() used. Read as
				// the name it would rename the crab 'le Coup du Milieu'; a lone
				// note made into a row from the unplaced list still becomes the name.
				lead = lead ? `${lead} ${s.note}` : s.note;
			} else if (s.kind === 'text' || s.kind === 'note') {
				const split = s.kind === 'note' ? { name: s.note, price: '' } : splitOf(s);
				draft = newDraft(0, item.section, [item.section], s, split.name || item.name, split.price || held, layout === 'stacked');
				if (!split.price && held) draft.priceWhy = 'Price read from the line above the name.';
				else if (split.price && layout === 'priceFirst') draft.priceWhy = 'Price read from the start of the line.';
				if (lead) {
					draft.description = draft.description ? `${lead} ${draft.description}` : lead;
					draft.why.push(LEAD_IN_WHY);
				}
			}
			continue;
		}
		if (s.kind === 'price') {
			draft.printed = draft.printed ? `${draft.printed} ${s.text}` : s.text;
			if (!draft.priceWhy) draft.priceWhy = 'Price read from the line under the name.';
		} else if (s.kind === 'pour') draft.sizes.push(...s.sizes);
		else if (s.kind === 'vintage') draft.vintageLine = s.vintage;
		else if (s.kind === 'note') draft.body.push(s.note);
		else {
			const split = splitOf(s);
			draft.body.push(split.name);
			if (split.price && !draft.printed) {
				// A capitals name over a description that ends in the price: the
				// price is the row's, as it was on the first reading.
				draft.printed = split.price;
				draft.priceWhy = 'Price read from the end of the description line under the name.';
			}
			for (const m of s.marks) if (!draft.marks.includes(m)) draft.marks.push(m);
		}
	}
	if (!draft) {
		const s = scan(item.name, 0);
		draft = newDraft(0, item.section, [item.section], s, item.name, item.price.printed, true);
	}
	draft.raw = item.raw;
	draft.first = item.lines[0];
	draft.last = item.lines[1];
	draft.marks = [...item.marks];
	if (!draft.bin && item.kind === 'wine') draft.bin = item.bin;
	draft.why.push(`Read again as a ${kind === 'unsure' ? 'row the desk could not place' : kind} at a person's request.`);

	const out = finish(draft, new Set(), kind);
	out.id = item.id;
	return out;
}
