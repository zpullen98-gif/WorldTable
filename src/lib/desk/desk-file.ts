/**
 * The desk file: what one read of a venue's menu produces, whichever engine
 * read it and whichever app it lands in.
 *
 * THE DESK FILE IS A DRAFT READ INTO REVIEW TABLES, NEVER A STORE TRANSPORT.
 * It is the same shape whether it sits in the shared inbox (desk-inbox.ts) or
 * is downloaded as menu-desk-YYYY-MM-DD.json and imported on a family member's
 * device, and in both cases the only thing an app may do with it is show its
 * rows in a review table for a person to correct and adopt one by one. The
 * `.wtjson` session file remains the ONLY file that merges into a record
 * (HANDOFF.md:157 stands, and FORMAT_VERSION 3 is untouched by this); a desk
 * file never reaches `house.adopt`, `session.merge` or any other store method,
 * and the World Table's `doImport` sniffs `format === 'oot-menu-desk'` before
 * `parseImport` precisely so that it cannot.
 *
 * NO ALLERGEN FIELD ON ANY SHAPE HERE, EVER. A menu cannot say what is in a
 * dish, an agent reading a menu cannot either, and the cheapest way to make
 * that mistake impossible rather than merely discouraged is for the field not
 * to exist. `marks` carries the dietary marks THE MENU PRINTED, the (v) and the
 * [GF], and nothing is ever derived for it. Every dish adopted from a desk
 * file arrives in the kitchen with `allergens: []` and no `allergensCheckedAt`,
 * and the key-set tests in desk-file.test.ts pin that no shape grows the field.
 *
 * NEVER A PRICE INVENTED. `DeskPrice.printed` is the price exactly as printed
 * ('12', '45.00 / 22.50', 'Glass 8 Bottle 30', 'MP', '') and every
 * `parts[].amount` is a substring of it, never a number: the printed form
 * carries what a number throws away (which currency, two sizes, market price),
 * and rounding somebody else's menu price is not this app's business.
 *
 * EVERY ROW KEEPS `raw`, the verbatim lines it came from, and `lines`, where in
 * the source they were, so a person can always see where a row came from and
 * so a price that does not appear in `raw` can be caught on screen.
 *
 * Pure and outside any component, per the rule the rest of src/lib follows: a
 * validator vitest cannot reach is a validator nobody checks.
 */

import type { ParsedDish } from '../menu-parse';
import { hashText } from './desk-text';

export const DESK_FORMAT = 'oot-menu-desk';
export const DESK_VERSION = 1;

/** The three rooms a row can be for, and the one for a row the desk could not place. */
export type DeskWingKind = 'dish' | 'wine' | 'cocktail';
export type DeskKind = DeskWingKind | 'unsure';

export const WING_KINDS: readonly DeskWingKind[] = ['dish', 'wine', 'cocktail'];
const DESK_KINDS: readonly DeskKind[] = [...WING_KINDS, 'unsure'];

/**
 * One figure out of a printed price, with the word that sat beside it.
 * `amount` is a SUBSTRING of `DeskPrice.printed`, never parsed into a number;
 * `label` is the alpha run before it or the bracket after it, as printed
 * ('Glass', 'Bottle', '5 oz', 'per Person', ''), and empty when there was none.
 */
export interface DeskPricePart {
	amount: string;
	label: string;
}

export interface DeskPrice {
	/** Exactly as printed. Empty when the line had no price, and never guessed. */
	printed: string;
	parts: DeskPricePart[];
}

/** What every row carries, whatever kind it turned out to be. */
export interface DeskItemBase {
	/** 'k-' and eight base36 characters, minted at read time, never recomputed. */
	id: string;
	kind: DeskKind;
	/** The heading this row sat under, as printed. Empty when the menu never said. */
	section: string;
	name: string;
	price: DeskPrice;
	/**
	 * Dietary marks the menu printed, lower case: 'v', 'vg', 'gf', 'df', 'n'.
	 * A record of what is on the page, NOT allergen information, and nothing is
	 * ever inferred into this list.
	 */
	marks: string[];
	/** 'low' means the row is a guess and the screen should show it differently. */
	confidence: 'high' | 'low';
	/** What was read from where, and what was left blank on purpose, one sentence each. */
	why: string[];
	/** The source lines, verbatim. */
	raw: string;
	/** First and last source line of `raw`, zero-based, so the screen can point at them. */
	lines: [number, number];
}

export interface DeskDish extends DeskItemBase {
	kind: 'dish';
	description: string;
	/** Only when the description was a printed LIST; a sentence names nothing. */
	ingredientsNamed: string[];
}

export interface DeskPour {
	price: string;
	size: string;
}

export interface DeskWine extends DeskItemBase {
	kind: 'wine';
	/** Empty when the name line had no vocabulary hit; the Codex fills it from its corpus and SAYS so. */
	producer: string;
	wine: string;
	/** '2010', 'NV', 'MV' or '' when the list did not say. */
	vintage: string;
	region: string;
	country: string;
	grapes: string[];
	style: string;
	/** The list index, when the list printed one. */
	bin: string;
	pours: DeskPour[];
	bottle: string;
	/** The descriptor line verbatim, so nothing the vocabulary missed is lost. */
	descriptors: string;
}

export interface DeskCocktail extends DeskItemBase {
	kind: 'cocktail';
	/** The parts as printed, no measures unless printed: '3/4 oz lime' stays whole. */
	spec: string[];
	description: string;
	/** A printed spirit word, never derived from the name. */
	baseSpirit: string;
}

export interface DeskUnsure extends DeskItemBase {
	kind: 'unsure';
	/** What it could be, best first. Empty for a spirits or beer list no wing keeps. */
	could: DeskKind[];
}

export type DeskItem = DeskDish | DeskWine | DeskCocktail | DeskUnsure;

export interface DeskSource {
	kind: 'paste' | 'photo' | 'link' | 'agent';
	/** ISO 8601, when the read happened. */
	at: string;
	url?: string;
	/** 'desk-reader/1' for the offline reader, 'maitre/<model>' for the agent. */
	reader: string;
	readIn: 'table' | 'codex' | 'ledger';
	/** hashText of the source text, so a second paste of the same menu is recognised. */
	hash: string;
}

/** A source line that was read and deliberately not turned into a row. */
export interface DeskUnsorted {
	raw: string;
	/** Zero-based source line. */
	line: number;
	/** A short code: 'orphan-price', 'heading-note', 'noise', 'no-name'. */
	reason: string;
}

export interface DeskFile {
	format: typeof DESK_FORMAT;
	version: 1;
	/** ISO 8601. The inbox's 30-day expiry counts from here. */
	createdAt: string;
	source: DeskSource;
	venue?: string;
	items: DeskItem[];
	unsorted: DeskUnsorted[];
	/** Something the reader wants said once at the top: the truncation notice, say. */
	notice?: string;
	/** ISO 8601 per kind, stamped when that wing adopted its share. */
	taken?: Partial<Record<DeskWingKind, string>>;
}

/* -------------------------------------------------------------------------
 * The size guards
 * ---------------------------------------------------------------------- */

/**
 * A desk file describes a menu, and a menu is a page or two. Two thousand rows
 * is a hotel's every outlet at once; a file past it is a log, a database dump
 * or a fault, and is refused whole rather than reviewed in part. Six hundred
 * characters holds the longest description on Commander's page with room to
 * spare, and it is the cap on EVERY string so that a single field cannot carry
 * a novel into the 256 KB inbox.
 */
export const DESK_MAX_ITEMS = 2000;
export const DESK_MAX_STRING = 600;
/** The cap on any list inside a row: marks, grapes, spec lines, why. */
const MAX_LIST = 200;
/** Lines the reader set aside, matching menu-parse.ts's MAX_LINES. */
const MAX_UNSORTED = 5000;

/* -------------------------------------------------------------------------
 * Minting, naming, building
 * ---------------------------------------------------------------------- */

/**
 * 'k-' and eight base36 characters: the mint the dish, prep and producer forms
 * use, with its own prefix so a desk id can never be mistaken for a record's.
 * `taken` is checked because one read mints a whole menu in a pass, so two
 * rows colliding is a thing that can happen here and cannot when a person
 * saves one dish at a time.
 */
export function mintDeskId(taken: Iterable<string> = [], rand: () => number = Math.random): string {
	const used = new Set(taken);
	let s: string;
	do {
		s = 'k-';
		while (s.length < 10) s += Math.floor(rand() * 36).toString(36);
	} while (used.has(s));
	return s;
}

export function deskFilename(now = new Date()): string {
	return `menu-desk-${now.toISOString().slice(0, 10)}.json`;
}

/** The source block, built the one way so `hash` and `at` are never derived twice. */
export function deskSource(
	kind: DeskSource['kind'],
	readIn: DeskSource['readIn'],
	text: string,
	opts: { url?: string; reader?: string; now?: Date } = {}
): DeskSource {
	const source: DeskSource = {
		kind,
		at: (opts.now ?? new Date()).toISOString(),
		reader: opts.reader ?? 'desk-reader/1',
		readIn,
		hash: hashText(text)
	};
	if (opts.url) source.url = opts.url;
	return source;
}

/** A desk with nothing on it yet, for a reader to fill. */
export function emptyDesk(source: DeskSource, now = new Date()): DeskFile {
	return {
		format: DESK_FORMAT,
		version: DESK_VERSION,
		createdAt: now.toISOString(),
		source,
		items: [],
		unsorted: []
	};
}

/**
 * The portable.ts download, for a desk file: plain JSON, two-space indented,
 * so it is diffable and hand-editable and opens in any editor. The object URL
 * is revoked on the way out because a menu read three times an evening would
 * otherwise leave three blobs pinned in memory for the life of the tab.
 */
export function downloadDesk(file: DeskFile, now = new Date()): void {
	const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = deskFilename(now);
	a.click();
	URL.revokeObjectURL(url);
}

/* -------------------------------------------------------------------------
 * The validator
 * ---------------------------------------------------------------------- */

/** A string, capped, or the fallback when the value was not one. */
function str(v: unknown, fallback = ''): string {
	if (typeof v !== 'string') return fallback;
	return v.length > DESK_MAX_STRING ? v.slice(0, DESK_MAX_STRING) : v;
}

/** A list of non-empty strings, each capped, the list capped. */
function strList(v: unknown): string[] {
	if (!Array.isArray(v)) return [];
	const out: string[] = [];
	for (const x of v) {
		if (typeof x !== 'string' || !x) continue;
		out.push(str(x));
		if (out.length >= MAX_LIST) break;
	}
	return out;
}

/** An ISO stamp, or `now` when the value was not one a Date can read. */
function stamp(v: unknown, now: number): string {
	if (typeof v === 'string' && Number.isFinite(Date.parse(v))) return v.slice(0, 64);
	return new Date(now).toISOString();
}

function isRecord(v: unknown): v is Record<string, unknown> {
	return !!v && typeof v === 'object' && !Array.isArray(v);
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
	return (allowed as readonly string[]).includes(v as string) ? (v as T) : fallback;
}

/**
 * The price, with the one rule enforced that the shape documents: every part's
 * amount is a substring of the printed price. A part that is not is dropped,
 * because it is a figure the file made up, and a made-up figure is the thing
 * this whole design exists to keep out of a cost sheet.
 */
function readPrice(v: unknown): DeskPrice {
	const printed = isRecord(v) ? str(v.printed) : '';
	const parts: DeskPricePart[] = [];
	if (isRecord(v) && Array.isArray(v.parts)) {
		for (const p of v.parts) {
			if (!isRecord(p) || typeof p.amount !== 'string' || !p.amount) continue;
			const amount = str(p.amount);
			if (!printed.includes(amount)) continue;
			parts.push({ amount, label: str(p.label) });
			if (parts.length >= MAX_LIST) break;
		}
	}
	return { printed, parts };
}

function readPours(v: unknown): DeskPour[] {
	if (!Array.isArray(v)) return [];
	const out: DeskPour[] = [];
	for (const p of v) {
		if (!isRecord(p)) continue;
		const price = str(p.price);
		const size = str(p.size);
		if (!price && !size) continue;
		out.push({ price, size });
		if (out.length >= MAX_LIST) break;
	}
	return out;
}

function readLines(v: unknown): [number, number] {
	if (!Array.isArray(v) || v.length !== 2) return [0, 0];
	const [a, b] = v;
	if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < a) return [0, 0];
	return [a, b];
}

/**
 * One row, cleaned. Returns null for a row with neither a name nor a raw line,
 * which is nothing at all; a row with raw but no name is handed back as
 * `unsorted` by the caller, so it is still SEEN. A row whose kind the desk does
 * not know becomes `unsure` rather than being dropped: an unknown kind is a
 * disagreement between two builds, and a disagreement goes on screen.
 */
function readItem(v: unknown, ids: Set<string>): DeskItem | { noName: DeskUnsorted } | null {
	if (!isRecord(v)) return null;
	const name = str(v.name).trim();
	const raw = str(v.raw);
	const lines = readLines(v.lines);
	if (!name) {
		return raw ? { noName: { raw, line: lines[0], reason: 'no-name' } } : null;
	}

	let id = str(v.id);
	if (!/^k-[0-9a-z]{8}$/.test(id) || ids.has(id)) id = mintDeskId(ids);
	ids.add(id);

	const why = strList(v.why);
	const knownKind = (DESK_KINDS as readonly string[]).includes(v.kind as string);
	if (!knownKind) why.push('The file gave this row a kind the desk does not know, so it is unplaced.');

	const base: DeskItemBase = {
		id,
		kind: knownKind ? (v.kind as DeskKind) : 'unsure',
		section: str(v.section),
		name,
		price: readPrice(v.price),
		marks: strList(v.marks).map((m) => m.toLowerCase()),
		confidence: v.confidence === 'high' ? 'high' : 'low',
		why,
		raw,
		lines
	};

	switch (base.kind) {
		case 'dish':
			return {
				...base,
				kind: 'dish',
				description: str(v.description),
				ingredientsNamed: strList(v.ingredientsNamed)
			};
		case 'wine':
			return {
				...base,
				kind: 'wine',
				producer: str(v.producer),
				wine: str(v.wine),
				vintage: str(v.vintage),
				region: str(v.region),
				country: str(v.country),
				grapes: strList(v.grapes),
				style: str(v.style),
				bin: str(v.bin),
				pours: readPours(v.pours),
				bottle: str(v.bottle),
				descriptors: str(v.descriptors)
			};
		case 'cocktail':
			return {
				...base,
				kind: 'cocktail',
				spec: strList(v.spec),
				description: str(v.description),
				baseSpirit: str(v.baseSpirit)
			};
		default: {
			// An unsure row can be for a wing; it cannot "could be unsure".
			const could = Array.isArray(v.could)
				? (v.could.filter(
						(k, i, all) => (WING_KINDS as readonly unknown[]).includes(k) && all.indexOf(k) === i
					) as DeskKind[])
				: [];
			return { ...base, kind: 'unsure', could };
		}
	}
}

/**
 * Reads a desk file out of whatever JSON.parse returned, or out of the JSON
 * text itself, in the sanitizePrefs style: never throws, refuses what it
 * cannot vouch for, and repairs per field rather than all or nothing.
 *
 * Returns null for anything that is not a desk file: not an object, the wrong
 * format, a version this build does not know (never guess at a newer shape,
 * and never persist over it), or more rows than a menu can have. Everything
 * else comes back cleaned: every string capped, every kind known, every price
 * part a substring of its printed price, every id well formed and unique.
 *
 * @param raw the parsed object, or the JSON text
 * @param now the clock, for a createdAt the file did not carry legibly
 */
export function readDeskFile(raw: unknown, now = Date.now()): DeskFile | null {
	let parsed: unknown = raw;
	if (typeof raw === 'string') {
		try {
			parsed = JSON.parse(raw);
		} catch {
			return null;
		}
	}
	if (!isRecord(parsed)) return null;
	if (parsed.format !== DESK_FORMAT) return null;
	if (typeof parsed.version !== 'number' || parsed.version > DESK_VERSION) return null;
	if (!Array.isArray(parsed.items) || parsed.items.length > DESK_MAX_ITEMS) return null;

	const src = isRecord(parsed.source) ? parsed.source : {};
	const source: DeskSource = {
		kind: oneOf(src.kind, ['paste', 'photo', 'link', 'agent'] as const, 'paste'),
		at: stamp(src.at, now),
		reader: str(src.reader) || 'desk-reader/1',
		readIn: oneOf(src.readIn, ['table', 'codex', 'ledger'] as const, 'table'),
		hash: str(src.hash)
	};
	const url = str(src.url);
	if (url) source.url = url;

	const ids = new Set<string>();
	const items: DeskItem[] = [];
	const unsorted: DeskUnsorted[] = [];
	for (const v of parsed.items) {
		const row = readItem(v, ids);
		if (!row) continue;
		if ('noName' in row) unsorted.push(row.noName);
		else items.push(row);
	}
	if (Array.isArray(parsed.unsorted)) {
		for (const u of parsed.unsorted) {
			if (!isRecord(u)) continue;
			const line = str(u.raw);
			if (!line) continue;
			unsorted.push({
				raw: line,
				line: Number.isInteger(u.line) && (u.line as number) >= 0 ? (u.line as number) : 0,
				reason: str(u.reason)
			});
			if (unsorted.length >= MAX_UNSORTED) break;
		}
	}

	const file: DeskFile = {
		format: DESK_FORMAT,
		version: DESK_VERSION,
		createdAt: stamp(parsed.createdAt, now),
		source,
		items,
		unsorted
	};
	const venue = str(parsed.venue).trim();
	if (venue) file.venue = venue;
	const notice = str(parsed.notice).trim();
	if (notice) file.notice = notice;
	if (isRecord(parsed.taken)) {
		const taken: Partial<Record<DeskWingKind, string>> = {};
		for (const k of WING_KINDS) {
			const at = parsed.taken[k];
			if (typeof at === 'string' && Number.isFinite(Date.parse(at))) taken[k] = at.slice(0, 64);
		}
		if (Object.keys(taken).length) file.taken = taken;
	}
	return file;
}

/* -------------------------------------------------------------------------
 * The adapter to the old shape
 * ---------------------------------------------------------------------- */

/**
 * A desk row in the shape `parseMenuText` has always returned, so the seven
 * pinned keys of ParsedDish (menu-parse.test.ts) do not move and nothing
 * downstream learns a new field it did not ask for.
 *
 * `price` is the printed string, `tags` is `marks`, and `description` is what
 * the row printed under its name: the dish's own; a cocktail's prose or, when
 * the line was a list, its parts joined with a comma; a wine's descriptor line
 * with the vintage in front when the list printed it somewhere other than the
 * name. An unsure row comes back with no description at all, because the desk
 * has not decided what the lines under its name are and `raw` still shows
 * them; the Kind column on the review table is where that gets decided.
 */
export function toParsedDish(item: DeskItem): ParsedDish {
	let description = '';
	switch (item.kind) {
		case 'dish':
			description = item.description;
			break;
		case 'cocktail':
			description = item.description || item.spec.join(', ');
			break;
		case 'wine': {
			const vintage =
				item.vintage && !item.name.includes(item.vintage) && !item.descriptors.includes(item.vintage)
					? item.vintage
					: '';
			description = [vintage, item.descriptors].filter(Boolean).join(' ');
			break;
		}
	}
	return {
		section: item.section,
		name: item.name,
		description,
		price: item.price.printed,
		tags: item.marks,
		confidence: item.confidence,
		raw: item.raw
	};
}
