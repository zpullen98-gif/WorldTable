/**
 * house-normalise.ts: any record that claims to be a House, brought to the
 * shape, with a report of what had to change.
 *
 * Every comment in this file ships inside the ported static/shared/oot-house.js
 * (tools/port-house.mjs transpiles with comments kept, and its assertClean
 * refuses any dash spelling, a carriage return and a regex literal outside
 * ASCII), so the comments here are dash-free and every regex is ASCII.
 *
 * PURE AND PORTABLE: no import from outside src/lib/house, no DOM, no Node;
 * the one source of chance (the id mint) is an argument. The port joins
 * every house module inside one IIFE, so each top-level name here is unique
 * across the directory.
 *
 * WHAT NORMALISING MEANS HERE. The record comes back with every list present,
 * every required string present ('' when it was missing), every prose field
 * cut at PROSE_MAX, every list cut at LIST_MAX, and NO KEY THE SCHEMA DOES
 * NOT NAME: each shape is rebuilt field by field from KEYS, so a key outside
 * the shape, allergens above all, is dropped at every depth, inside a mark's
 * value included. The three wings' normalisers (state.ts normaliseMaitre,
 * the Ledger's normalizeMaitre, the Codex's v24SanitiseMark) do the same for
 * their own rows; this is the House's door, and a pack, a desk read or a
 * hand edit passes it before anything is written.
 *
 * WHAT IS NOT NORMALISED. Nothing is trimmed, tidied or respelled: a value
 * that is not blank is stored as written, the rule state.ts validMark keeps,
 * because a tidy is a spelling fix and the menu's words are the menu's. A
 * pairing principle outside PRINCIPLES is carried as it came, so the
 * validator can name it rather than lose it in silence. A price that arrived
 * as a number becomes its digits as a string, because a hand-edited file
 * writing 24 meant the printed 24, and a blank would be a price lost.
 *
 * IDS. Each list has its prefix (ID_PREFIXES); an id missing, carrying a
 * pipe or a colon, with the wrong prefix or already taken in this house is
 * minted afresh and the report says so, and every reference to the old id
 * inside the house (a pairing and its bottle tiers, a course, a mix-up, a first pick, an upsell,
 * a term's items, a video's items, terms and components, a component's items
 * and terms, a comparison pointing at a house wine) follows it, so a pack whose dishes came in under the
 * desk's 'k-' mint keeps its pairings. An id that would match the client's
 * FORBIDDEN_KEY is minted afresh as well, and a fresh id is drawn again
 * while it would, because a tombstone in `removed` is a KEY and the client
 * sweeps keys: the day such an item is removed, its id would make the
 * record one the client refuses and the pack one no device imports. For
 * the same reason a tombstone already under such a key is dropped and
 * named in the report; no item in the shape can carry that id.
 *
 * VIDEOS. A video whose link is not a video link by videoUrlOk (the one
 * scheme, the three hosts) is dropped whole and named in the report under
 * 'video', before it claims an id: a card must never carry a link out to
 * anywhere else. The list is written only when a video survives, so a house
 * from before the list comes back with the keys it went in with.
 *
 * TASTINGS. A tasting's subtitle and supplement, and a course's choice,
 * printed lines and pour label, are written only when they say something,
 * so a tasting from before them comes back with the keys it went in with.
 *
 * COMPONENTS. The ingredients, techniques and stories ride in their own
 * optional list, written only when one survives, each with its three marks
 * (say, explain, card). An item's comparisons are one mark of records, and a
 * video's componentIds are written only when it names a component, so a
 * record from before either field comes back with the keys it went in with.
 */
import { BOTTLE_TIERS, BUILD_STEPS, HOUSE_FORMAT, HOUSE_SCHEMA_VERSION, ID_PREFIXES, KEYS, LIST_MAX, MARK_FIELDS, PROSE_MAX, mintId, videoUrlOk } from './house-schema';
import type {
	AskAtLineup,
	BottlePick,
	CompareEntry,
	ComponentCard,
	ComponentKind,
	AskWhom,
	Began,
	BuildStep,
	Dispute,
	DisputeSide,
	FormulaParts,
	House,
	HouseCocktail,
	HouseComponent,
	HouseDish,
	HouseMeal,
	HouseSource,
	HouseVideo,
	HouseWine,
	ItemBase,
	LexiconTerm,
	Lines,
	Mark,
	MealPrice,
	MixUp,
	MustKnow,
	Note,
	PackStamp,
	Pairing,
	PairingBottles,
	Principle,
	Scenario,
	Tasting,
	TastingCourse
} from './house-schema';

/* -------------------------------------------------------------------------
 * The client's rule, copied
 * ---------------------------------------------------------------------- */

/**
 * Any key name, anywhere in an answer, that looks like a claim about what a
 * dish contains or who may eat it. Keys only: a description quoting the
 * menu's own "gluten free" is the menu's words, and values are never swept.
 * Copied from the client (static/shared/oot-maitre.js FORBIDDEN_KEY and
 * forbiddenKeys), and the test holds both against the client's source.
 */
export const FORBIDDEN_KEY = /allerg|contain|free|safe|suitab|vegan|nut/i;

/** Every path whose last key matches FORBIDDEN_KEY, at any depth, pushed onto `out`. */
export function forbiddenKeys(value: unknown, path: string, out: string[]): string[] {
	if (!value || typeof value !== 'object') return out;
	if (Array.isArray(value)) {
		for (let i = 0; i < value.length; i++) forbiddenKeys(value[i], path + '[' + i + ']', out);
		return out;
	}
	const keys = Object.keys(value);
	for (let k = 0; k < keys.length; k++) {
		if (FORBIDDEN_KEY.test(keys[k])) out.push(path + '.' + keys[k]);
		forbiddenKeys((value as Record<string, unknown>)[keys[k]], path + '.' + keys[k], out);
	}
	return out;
}

/* -------------------------------------------------------------------------
 * The report
 * ---------------------------------------------------------------------- */

/** What the normaliser had to change or could not: an id minted afresh, a key the client would refuse, or a video dropped for its link. */
export type NormaliseCode = 'id' | 'forbidden' | 'video';

export interface NormaliseReport {
	path: string;
	code: NormaliseCode;
	said: string;
}

/** The most kept notes one item carries; the newest stay. */
export const KEPT_CAP = 500;

/* -------------------------------------------------------------------------
 * The small coercions
 * ---------------------------------------------------------------------- */

type Raw = Record<string, unknown>;

function isRaw(v: unknown): v is Raw {
	return !!v && typeof v === 'object' && !Array.isArray(v);
}

function asRecord(v: unknown): Raw {
	return isRaw(v) ? v : {};
}

/** A string, cut at PROSE_MAX, or '' when the value was not one. */
function asText(v: unknown): string {
	if (typeof v !== 'string') return '';
	return v.length > PROSE_MAX ? v.slice(0, PROSE_MAX) : v;
}

/** A price as printed: a string, or the digits of a finite number a hand edit wrote, else ''. */
function asPrinted(v: unknown): string {
	if (typeof v === 'number' && Number.isFinite(v)) return String(v);
	return asText(v);
}

/** A list, cut at LIST_MAX, or [] when the value was not one. */
function asList(v: unknown): unknown[] {
	if (!Array.isArray(v)) return [];
	return v.length > LIST_MAX ? v.slice(0, LIST_MAX) : v;
}

/** A list of strings with something in them, each cut, the list cut. */
function asTextList(v: unknown): string[] {
	const out: string[] = [];
	for (const x of asList(v)) {
		if (typeof x !== 'string' || !x.trim()) continue;
		out.push(asText(x));
	}
	return out;
}

/** The grapes: a list of strings, or one string split on its commas, the way the Codex's row joins them. */
function asGrapes(v: unknown): string[] {
	if (typeof v === 'string') return asTextList(v.split(','));
	return asTextList(v);
}

/** A stamp: a finite number, a string that reads as one, else 0. */
function asStamp(v: unknown): number {
	if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
	if (typeof v === 'string' && v.trim()) {
		const n = Number(v);
		return Number.isFinite(n) ? n : 0;
	}
	return 0;
}

function asFlag(v: unknown): boolean {
	return v === true;
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
	return (allowed as readonly string[]).indexOf(v as string) >= 0 ? (v as T) : fallback;
}

function blank(s: string): boolean {
	return !s.trim();
}

/* -------------------------------------------------------------------------
 * Marks and notes
 * ---------------------------------------------------------------------- */

/**
 * What kind of value a mark field carries, so a string can never land on a
 * list field or a list on a prose field: the three list marks, the parts,
 * the lines, the pairing, a component's card and an item's comparisons;
 * everything else is prose.
 */
export type MarkKind = 'text' | 'list' | 'parts' | 'lines' | 'pairing' | 'card' | 'compare';

export const MARK_KINDS: Readonly<Record<string, MarkKind>> = {
	ingredientsNamed: 'list',
	firstPickIds: 'list',
	upsells: 'list',
	parts: 'parts',
	lines: 'lines',
	pairing: 'pairing',
	card: 'card',
	compare: 'compare'
};

export function markKind(field: string): MarkKind {
	return MARK_KINDS[field] || 'text';
}

/**
 * The value of a mark brought to its kind, or undefined when nothing honest
 * is in it. Her answer for "the menu does not say" is the empty string or
 * the empty list, and that answer is NOT a mark: filed, it would be a blank
 * line Keep could flip to the house's. An object value keeps only the keys
 * its shape names, so a key outside the parts, the lines or the pairing is
 * dropped here as everywhere else.
 */
function markValue(v: unknown, kind: MarkKind): unknown {
	if (kind === 'text') {
		const s = asText(v);
		return blank(s) ? undefined : s;
	}
	if (kind === 'list') {
		const l = asTextList(v);
		return l.length ? l : undefined;
	}
	if (kind === 'compare') return normaliseCompare(v);
	if (!isRaw(v)) return undefined;
	let any = false;
	if (kind === 'parts') {
		const p = {} as FormulaParts;
		for (const k of KEYS.FormulaParts) {
			p[k] = asText(v[k]);
			if (!blank(p[k])) any = true;
		}
		return any ? p : undefined;
	}
	if (kind === 'card') {
		const c = {} as ComponentCard;
		for (const k of KEYS.ComponentCard) {
			c[k] = asText(v[k]);
			if (!blank(c[k])) any = true;
		}
		return any ? c : undefined;
	}
	if (kind === 'lines') {
		const l = {} as Lines;
		for (const k of KEYS.Lines) {
			l[k] = asText(v[k]);
			if (!blank(l[k])) any = true;
		}
		return any ? l : undefined;
	}
	const p = { principles: [] } as unknown as Pairing;
	for (const k of KEYS.Pairing) {
		if (k === 'bottles') {
			/* Optional: set only when some tier holds something, so a pairing without tiers keeps its old shape. */
			const bottles = normaliseBottles(v.bottles);
			if (bottles) {
				p.bottles = bottles;
				any = true;
			}
		} else if (k === 'principles') {
			/* Carried as they came, even one outside PRINCIPLES, so the validator can name it. */
			p.principles = asTextList(v.principles) as Principle[];
			if (p.principles.length) any = true;
		} else {
			p[k] = asText(v[k]);
			if (!blank(p[k])) any = true;
		}
	}
	return any ? p : undefined;
}

/**
 * An item's comparisons: each entry rebuilt from KEYS.CompareEntry, every
 * field a string (the app carried as it came, so the validator can name one
 * outside COMPARE_APPS), kept only when something is in it; undefined when
 * none survives. No entry is cut for the count: COMPARE_MAX is the
 * validator's to name.
 */
function normaliseCompare(v: unknown): CompareEntry[] | undefined {
	const out: CompareEntry[] = [];
	for (const raw of asList(v)) {
		if (!isRaw(raw)) continue;
		const e = {} as CompareEntry;
		let some = false;
		for (const k of KEYS.CompareEntry) {
			(e as unknown as Record<string, string>)[k] = asText(raw[k]);
			if (k !== 'app' && !blank(asText(raw[k]))) some = true;
		}
		if (some) out.push(e);
	}
	return out.length ? out : undefined;
}

/**
 * A pairing's bottle tiers: each tier rebuilt from KEYS.BottlePick and kept
 * only when something is in it; undefined when no tier survives. A key
 * outside the four tiers or the three fields is dropped here as everywhere.
 */
function normaliseBottles(v: unknown): PairingBottles | undefined {
	if (!isRaw(v)) return undefined;
	const out: PairingBottles = {};
	let any = false;
	for (const tier of BOTTLE_TIERS) {
		const raw = v[tier];
		if (!isRaw(raw)) continue;
		const pick = {} as BottlePick;
		let some = false;
		for (const k of KEYS.BottlePick) {
			pick[k] = asText(raw[k]);
			if (!blank(pick[k])) some = true;
		}
		if (!some) continue;
		out[tier] = pick;
		any = true;
	}
	return any ? out : undefined;
}

/**
 * A mark brought to the wings' shape, or nothing: a value of the field's
 * kind with something in it, `by` forced to 'person' or 'maitre' (anything
 * else reads as hers, the unkept direction, so a stray value can never keep
 * a mark on its own), `ts` forced to a number, `model` kept only as a string.
 */
export function normaliseMark(raw: unknown, kind: MarkKind = 'text'): Mark<unknown> | undefined {
	if (!isRaw(raw)) return undefined;
	const value = markValue(raw.value, kind);
	if (value === undefined) return undefined;
	const mark: Mark<unknown> = { value, by: raw.by === 'person' ? 'person' : 'maitre', ts: asStamp(raw.ts) };
	if (typeof raw.model === 'string') mark.model = asText(raw.model);
	return mark;
}

/** Every mark field of one shape, read off the raw record and set on the item when it survives. */
function marksOnto(item: object, r: Raw, fields: readonly string[]): void {
	const target = item as Record<string, unknown>;
	for (const f of fields) {
		const m = normaliseMark(r[f], markKind(f));
		if (m) target[f] = m;
	}
}

/** The kept notes: a question and an answer as strings, a stamp, sorted by stamp, the newest KEPT_CAP kept. */
function normaliseNotes(v: unknown): Note[] | undefined {
	let out: Note[] = [];
	for (const n of asList(v)) {
		if (!isRaw(n) || typeof n.q !== 'string' || typeof n.a !== 'string') continue;
		const note: Note = { q: asText(n.q), a: asText(n.a), ts: asStamp(n.ts) };
		if (typeof n.model === 'string') note.model = asText(n.model);
		out.push(note);
	}
	if (!out.length) return undefined;
	out.sort((a, b) => a.ts - b.ts);
	if (out.length > KEPT_CAP) out = out.slice(out.length - KEPT_CAP);
	return out;
}

/* -------------------------------------------------------------------------
 * Ids
 * ---------------------------------------------------------------------- */

/** What one normalising run carries between the shapes. */
interface Ctx {
	taken: Set<string>;
	report: NormaliseReport[];
	renamed: Array<{ old: string; fresh: string }>;
	rand: () => number;
	houseId: string;
}

/** A fresh id that no key sweep would refuse: drawn again while it matches FORBIDDEN_KEY, within reason. */
function freshId(prefix: string, ctx: Ctx): string {
	let id = mintId(prefix, ctx.taken, ctx.rand);
	for (let tries = 0; tries < 100 && FORBIDDEN_KEY.test(id); tries++) id = mintId(prefix, ctx.taken, ctx.rand);
	return id;
}

/**
 * The id an item keeps, or the one it is given. Kept when it is a string
 * with the list's prefix, no pipe, no colon, and not already taken in this
 * house; minted afresh otherwise, with the reason in the report and the old
 * id remembered so references can follow.
 */
function claimId(raw: unknown, prefix: string, path: string, ctx: Ctx): string {
	const old = typeof raw === 'string' ? raw : '';
	let why = '';
	if (!old) why = 'no id';
	else if (old.indexOf('|') >= 0 || old.indexOf(':') >= 0) why = 'the id ' + old + ' carries a pipe or a colon';
	else if (old.slice(0, prefix.length) !== prefix) why = 'the id ' + old + ' does not start with ' + prefix;
	else if (FORBIDDEN_KEY.test(old)) why = 'the id ' + old + ' would be refused as a key by the client sweep';
	else if (ctx.taken.has(old)) why = 'the id ' + old + ' is already taken in this house';
	if (!why) {
		ctx.taken.add(old);
		return old;
	}
	const fresh = freshId(prefix, ctx);
	ctx.taken.add(fresh);
	ctx.report.push({ path: path + '.id', code: 'id', said: why + '; minted ' + fresh });
	if (old) ctx.renamed.push({ old, fresh });
	return fresh;
}

/* -------------------------------------------------------------------------
 * The shapes, one function each
 * ---------------------------------------------------------------------- */

function normalisePrices(v: unknown): MealPrice[] {
	const out: MealPrice[] = [];
	for (const p of asList(v)) {
		if (!isRaw(p)) continue;
		out.push({ meal: asText(p.meal), printed: asPrinted(p.printed) });
	}
	return out;
}

type ItemList = 'dishes' | 'wines' | 'cocktails';

/** What every kind carries: the id, the house, the card fields, the kept notes. The marks come after the kind's own fields. */
function itemBase(r: Raw, list: ItemList, path: string, ctx: Ctx): ItemBase {
	const item: ItemBase = {
		id: claimId(r.id, ID_PREFIXES[list], path, ctx),
		house: ctx.houseId,
		name: asText(r.name),
		section: asText(r.section),
		meals: asTextList(r.meals),
		price: asPrinted(r.price),
		prices: normalisePrices(r.prices),
		serviceNote: asText(r.serviceNote),
		ts: asStamp(r.ts)
	};
	const kept = normaliseNotes(r.kept);
	if (kept) item.kept = kept;
	return item;
}

function normaliseDish(raw: unknown, i: number, ctx: Ctx): HouseDish {
	const r = asRecord(raw);
	const d = itemBase(r, 'dishes', 'house.dishes[' + i + ']', ctx) as HouseDish;
	d.kind = 'dish';
	d.description = asText(r.description);
	d.ingredients = asTextList(r.ingredients);
	d.marks = asTextList(r.marks);
	d.signature = asFlag(r.signature);
	marksOnto(d, r, MARK_FIELDS.dishes);
	return d;
}

function normaliseWine(raw: unknown, i: number, ctx: Ctx): HouseWine {
	const r = asRecord(raw);
	const w = itemBase(r, 'wines', 'house.wines[' + i + ']', ctx) as HouseWine;
	w.kind = 'wine';
	w.producer = asText(r.producer);
	w.wine = asText(r.wine);
	w.vintage = asText(r.vintage);
	w.region = asText(r.region);
	w.grapes = asGrapes(r.grapes);
	w.style = asText(r.style);
	w.glass = asPrinted(r.glass);
	w.bottle = asPrinted(r.bottle);
	w.pours = asTextList(r.pours);
	marksOnto(w, r, MARK_FIELDS.wines);
	/* The bottle list's three fields, each written only when it says something: list only as
	   'bottle' (absent is 'glass'), the bin and the size only when not blank, so a wine from an
	   edition that never had them comes back with the same keys it went in with. */
	if (r.list === 'bottle') w.list = 'bottle';
	const bin = asPrinted(r.bin);
	if (!blank(bin)) w.bin = bin;
	const size = asText(r.size);
	if (!blank(size)) w.size = size;
	return w;
}

function normaliseCocktail(raw: unknown, i: number, ctx: Ctx): HouseCocktail {
	const r = asRecord(raw);
	const c = itemBase(r, 'cocktails', 'house.cocktails[' + i + ']', ctx) as HouseCocktail;
	c.kind = 'cocktail';
	c.spec = asTextList(r.spec);
	c.method = asText(r.method);
	c.glass = asText(r.glass);
	c.garnish = asText(r.garnish);
	c.note = asText(r.note);
	c.family = asText(r.family);
	c.spirit = asText(r.spirit);
	c.zeroProof = asFlag(r.zeroProof);
	marksOnto(c, r, MARK_FIELDS.cocktails);
	return c;
}

/**
 * One course. The three optional keys are written only when they say
 * something, in the schema's key order: choice only when true, the printed
 * lines only when one is not blank, the pour's label only when not blank.
 * A course from an edition that never had them comes back with the keys it
 * went in with.
 */
function normaliseCourse(raw: unknown, i: number): TastingCourse {
	const r = asRecord(raw);
	const n = typeof r.n === 'number' && Number.isFinite(r.n) ? r.n : i + 1;
	const c: TastingCourse = { n, label: asText(r.label), dishIds: asTextList(r.dishIds), pourId: asText(r.pourId), pourText: asText(r.pourText) };
	if (asFlag(r.choice)) c.choice = true;
	const printed = asTextList(r.printed);
	if (printed.length) c.printed = printed;
	const pourLabel = asText(r.pourLabel);
	if (!blank(pourLabel)) c.pourLabel = pourLabel;
	return c;
}

/**
 * One tasting. The subtitle and the supplement are written only when not
 * blank, between the note and the stamp as the schema lists them, so a
 * tasting from before either field keeps its keys and their order.
 */
function normaliseTasting(raw: unknown, i: number, ctx: Ctx): Tasting {
	const r = asRecord(raw);
	const t = {
		id: claimId(r.id, ID_PREFIXES.tastings, 'house.tastings[' + i + ']', ctx),
		name: asText(r.name),
		price: asPrinted(r.price),
		meal: asText(r.meal),
		includesDrinks: asFlag(r.includesDrinks),
		courses: asList(r.courses).map(normaliseCourse),
		note: asText(r.note)
	} as Tasting;
	const line = asText(r.line);
	if (!blank(line)) t.line = line;
	const supplement = asPrinted(r.supplement);
	if (!blank(supplement)) t.supplement = supplement;
	/* The stamp last, after the optional pair, the schema's order. */
	t.ts = asStamp(r.ts);
	return t;
}

function normaliseTerm(raw: unknown, i: number, ctx: Ctx): LexiconTerm {
	const r = asRecord(raw);
	const t: LexiconTerm = {
		id: claimId(r.id, ID_PREFIXES.lexicon, 'house.lexicon[' + i + ']', ctx),
		term: asText(r.term),
		itemIds: asTextList(r.itemIds),
		ts: asStamp(r.ts)
	};
	marksOnto(t, r, MARK_FIELDS.lexicon);
	return t;
}

function normaliseScenario(raw: unknown, i: number, ctx: Ctx): Scenario {
	const r = asRecord(raw);
	const s: Scenario = {
		id: claimId(r.id, ID_PREFIXES.scenarios, 'house.scenarios[' + i + ']', ctx),
		title: asText(r.title),
		guest: asText(r.guest),
		itemIds: asTextList(r.itemIds),
		ts: asStamp(r.ts)
	};
	marksOnto(s, r, MARK_FIELDS.scenarios);
	return s;
}

function normaliseMixUp(raw: unknown, i: number, ctx: Ctx): MixUp {
	const r = asRecord(raw);
	const m: MixUp = {
		id: claimId(r.id, ID_PREFIXES.mixUps, 'house.mixUps[' + i + ']', ctx),
		aId: asText(r.aId),
		bId: asText(r.bId),
		ts: asStamp(r.ts)
	};
	marksOnto(m, r, MARK_FIELDS.mixUps);
	return m;
}

function normaliseMustKnow(raw: unknown, i: number, ctx: Ctx): MustKnow {
	const r = asRecord(raw);
	const k: MustKnow = {
		id: claimId(r.id, ID_PREFIXES.mustKnows, 'house.mustKnows[' + i + ']', ctx),
		title: asText(r.title),
		ts: asStamp(r.ts)
	};
	marksOnto(k, r, MARK_FIELDS.mustKnows);
	return k;
}

const ASK_WHOM: readonly AskWhom[] = ['chef', 'sommelier', 'bar', 'manager'];

function normaliseAsk(raw: unknown, i: number, ctx: Ctx): AskAtLineup {
	const r = asRecord(raw);
	const a: AskAtLineup = {
		id: claimId(r.id, ID_PREFIXES.askAtLineup, 'house.askAtLineup[' + i + ']', ctx),
		question: asText(r.question),
		askWhom: oneOf(r.askWhom, ASK_WHOM, 'manager'),
		itemIds: asTextList(r.itemIds),
		ts: asStamp(r.ts)
	};
	const blocksField = asText(r.blocksField);
	if (blocksField) a.blocksField = blocksField;
	const answer = asText(r.answer);
	if (answer) a.answer = answer;
	const answeredOn = asText(r.answeredOn);
	if (answeredOn) a.answeredOn = answeredOn;
	return a;
}

function normaliseSide(v: unknown): DisputeSide {
	const r = asRecord(v);
	return { text: asText(r.text), source: asText(r.source), date: asText(r.date) };
}

function normaliseDispute(raw: unknown, i: number, ctx: Ctx): Dispute {
	const r = asRecord(raw);
	const u: Dispute = {
		id: claimId(r.id, ID_PREFIXES.disputes, 'house.disputes[' + i + ']', ctx),
		field: asText(r.field),
		a: normaliseSide(r.a),
		b: normaliseSide(r.b),
		ts: asStamp(r.ts)
	};
	const itemId = asText(r.itemId);
	if (itemId) u.itemId = itemId;
	const resolution = asText(r.resolution);
	if (resolution) u.resolution = resolution;
	return u;
}

/** A video's length in minutes: a finite number at or above zero, else 0 (not measured). */
function asMinutes(v: unknown): number {
	return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
}

/**
 * One video, or null when its link is not a video link: dropped whole, named
 * in the report, and never given an id, so a later video keeps the id it
 * came with.
 */
function normaliseVideo(raw: unknown, i: number, ctx: Ctx): HouseVideo | null {
	const r = asRecord(raw);
	const path = 'house.videos[' + i + ']';
	if (!videoUrlOk(r.url)) {
		const shown = typeof r.url === 'string' ? r.url.slice(0, 80) : 'nothing';
		ctx.report.push({ path: path + '.url', code: 'video', said: 'the link ' + shown + ' is not a secure link on YouTube or Vimeo; the video was dropped' });
		return null;
	}
	const v: HouseVideo = {
		id: claimId(r.id, ID_PREFIXES.videos, path, ctx),
		url: r.url as string,
		title: asText(r.title),
		channel: asText(r.channel),
		mins: asMinutes(r.mins),
		topic: asText(r.topic),
		why: asText(r.why),
		itemIds: asTextList(r.itemIds),
		termIds: asTextList(r.termIds),
		house: asFlag(r.house),
		checkedOn: asText(r.checkedOn),
		ts: asStamp(r.ts)
	};
	/* Written only when it names a component, so a video from before the field keeps its keys. */
	const componentIds = asTextList(r.componentIds);
	if (componentIds.length) {
		const out: Record<string, unknown> = {};
		for (const k of KEYS.HouseVideo) {
			if (k === 'componentIds') out[k] = componentIds;
			else if (k in v) out[k] = (v as unknown as Record<string, unknown>)[k];
		}
		return out as unknown as HouseVideo;
	}
	return v;
}

/**
 * One component: its id under the 'c-' prefix, its kind and name as text
 * (a kind outside COMPONENT_KINDS is carried so the validator names it),
 * the items and terms it belongs to, and its three marks.
 */
function normaliseComponent(raw: unknown, i: number, ctx: Ctx): HouseComponent {
	const r = asRecord(raw);
	/* Built in the order KEYS.HouseComponent names, the marks in their place, so a component reads the same however it came. */
	const c = {
		id: claimId(r.id, ID_PREFIXES.components, 'house.components[' + i + ']', ctx),
		kind: asText(r.kind) as ComponentKind,
		name: asText(r.name)
	} as HouseComponent;
	marksOnto(c, r, MARK_FIELDS.components);
	c.itemIds = asTextList(r.itemIds);
	c.termIds = asTextList(r.termIds);
	c.ts = asStamp(r.ts);
	return c;
}

function normaliseMeal(v: unknown): HouseMeal {
	const r = asRecord(v);
	return { name: asText(r.name), days: asText(r.days), hours: asText(r.hours) };
}

function normaliseSource(v: unknown): HouseSource {
	const r = asRecord(v);
	return { title: asText(r.title), url: asText(r.url), readOn: asText(r.readOn) };
}

/** The tombstones: id to stamp, a key kept only with a finite number under it, at most LIST_MAX of them. */
/** The tombstones, id to stamp; a tombstone under a key the client sweep refuses is dropped and named, since no item in the shape carries that id. */
function normaliseRemoved(v: unknown, report: NormaliseReport[]): Record<string, number> {
	const out: Record<string, number> = {};
	if (!isRaw(v)) return out;
	let n = 0;
	for (const k of Object.keys(v)) {
		const stamp = v[k];
		if (!k || typeof stamp !== 'number' || !Number.isFinite(stamp)) continue;
		if (FORBIDDEN_KEY.test(k)) {
			report.push({ path: 'house.removed.' + k, code: 'forbidden', said: 'a tombstone under a key the client refuses was dropped' });
			continue;
		}
		out[k] = stamp;
		if (++n >= LIST_MAX) break;
	}
	return out;
}

/** The build stamps: the eight steps and nothing else, each a finite number. */
function normaliseBuild(v: unknown): Partial<Record<BuildStep, number>> {
	const out: Partial<Record<BuildStep, number>> = {};
	if (!isRaw(v)) return out;
	for (const step of BUILD_STEPS) {
		const stamp = v[step];
		if (typeof stamp === 'number' && Number.isFinite(stamp)) out[step] = stamp;
	}
	return out;
}

function normalisePack(v: unknown): PackStamp | undefined {
	if (!isRaw(v)) return undefined;
	const version = typeof v.version === 'number' && Number.isFinite(v.version) ? v.version : 0;
	return { id: asText(v.id), builtBy: asText(v.builtBy), builtAt: asText(v.builtAt), version };
}

/* -------------------------------------------------------------------------
 * References follow a re-minted id
 * ---------------------------------------------------------------------- */

/**
 * Every reference in the house pointed through the rename map. An old id
 * still held by another item (the first of two duplicates keeps it) is not
 * mapped, so its references stay with the item that kept the id.
 */
function applyRenames(house: House, ctx: Ctx): void {
	if (!ctx.renamed.length) return;
	const map = new Map<string, string>();
	for (const r of ctx.renamed) if (!ctx.taken.has(r.old) && !map.has(r.old)) map.set(r.old, r.fresh);
	if (!map.size) return;
	const one = (id: string): string => (map.has(id) ? (map.get(id) as string) : id);
	const many = (ids: string[]): string[] => ids.map(one);
	for (const d of house.dishes) {
		if (!d.pairing) continue;
		const p = d.pairing.value;
		p.wineId = one(p.wineId);
		p.secondId = one(p.secondId);
		p.zeroProofId = one(p.zeroProofId);
		if (p.bottles) for (const tier of BOTTLE_TIERS) {
			const pick = p.bottles[tier];
			if (pick) pick.wineId = one(pick.wineId);
		}
	}
	for (const w of house.wines) if (w.firstPickIds) w.firstPickIds.value = many(w.firstPickIds.value);
	for (const c of house.cocktails) if (c.upsells) c.upsells.value = many(c.upsells.value);
	for (const t of house.tastings) {
		for (const c of t.courses) {
			c.dishIds = many(c.dishIds);
			c.pourId = one(c.pourId);
		}
	}
	for (const x of house.lexicon) x.itemIds = many(x.itemIds);
	for (const s of house.scenarios) s.itemIds = many(s.itemIds);
	for (const m of house.mixUps) {
		m.aId = one(m.aId);
		m.bId = one(m.bId);
	}
	for (const a of house.askAtLineup) a.itemIds = many(a.itemIds);
	for (const u of house.disputes) if (u.itemId) u.itemId = one(u.itemId);
	if (house.videos) {
		for (const v of house.videos) {
			v.itemIds = many(v.itemIds);
			v.termIds = many(v.termIds);
			if (v.componentIds) v.componentIds = many(v.componentIds);
		}
	}
	if (house.components) {
		for (const c of house.components) {
			c.itemIds = many(c.itemIds);
			c.termIds = many(c.termIds);
		}
	}
	/* A comparison's ref is a house wine's id when it points at one; any other ref is a key in another app and maps to nothing here. */
	for (const list of [house.dishes, house.wines, house.cocktails] as Array<Array<{ compare?: Mark<CompareEntry[]> }>>) {
		for (const item of list) if (item.compare) for (const e of item.compare.value) e.ref = one(e.ref);
	}
}

/* -------------------------------------------------------------------------
 * The door
 * ---------------------------------------------------------------------- */

const BEGAN: readonly Began[] = ['pack', 'desk', 'hand'];

/**
 * Any value, as a House in the shape, with the report of what changed. The
 * random source is an argument so a test mints the same ids every run. The
 * client's key sweep runs twice: over what came in, so a key that was
 * dropped is still named, and over what goes out, which finds nothing a
 * House in the shape can hold and stands as the proof of that.
 */
export function normaliseHouse(raw: unknown, opts: { rand?: () => number } = {}): { house: House; report: NormaliseReport[] } {
	const r = asRecord(raw);
	const report: NormaliseReport[] = [];
	for (const p of forbiddenKeys(raw, 'house', [])) {
		report.push({ path: p, code: 'forbidden', said: 'a key the client refuses came in on the record' });
	}
	const ctx: Ctx = { taken: new Set<string>(), report, renamed: [], rand: opts.rand || Math.random, houseId: '' };
	const id = claimId(r.id, ID_PREFIXES.house, 'house', ctx);
	ctx.houseId = id;
	const house: House = {
		format: HOUSE_FORMAT,
		version: HOUSE_SCHEMA_VERSION,
		id,
		name: asText(r.name),
		address: asText(r.address),
		phone: asText(r.phone),
		site: asText(r.site),
		meals: asList(r.meals).map(normaliseMeal),
		dressCode: asText(r.dressCode),
		menusReadOn: asText(r.menusReadOn),
		sources: asList(r.sources).map(normaliseSource),
		tastings: asList(r.tastings).map((t, i) => normaliseTasting(t, i, ctx)),
		dishes: asList(r.dishes).map((d, i) => normaliseDish(d, i, ctx)),
		wines: asList(r.wines).map((w, i) => normaliseWine(w, i, ctx)),
		cocktails: asList(r.cocktails).map((c, i) => normaliseCocktail(c, i, ctx)),
		lexicon: asList(r.lexicon).map((x, i) => normaliseTerm(x, i, ctx)),
		scenarios: asList(r.scenarios).map((s, i) => normaliseScenario(s, i, ctx)),
		mixUps: asList(r.mixUps).map((m, i) => normaliseMixUp(m, i, ctx)),
		mustKnows: asList(r.mustKnows).map((k, i) => normaliseMustKnow(k, i, ctx)),
		askAtLineup: asList(r.askAtLineup).map((a, i) => normaliseAsk(a, i, ctx)),
		disputes: asList(r.disputes).map((u, i) => normaliseDispute(u, i, ctx)),
		removed: normaliseRemoved(r.removed, report),
		build: normaliseBuild(r.build),
		began: oneOf(r.began, BEGAN, 'hand'),
		createdAt: asText(r.createdAt),
		lastWrite: asStamp(r.lastWrite)
	};
	const history = normaliseMark(r.history, 'text');
	if (history) house.history = history as Mark;
	const pack = normalisePack(r.pack);
	if (pack) house.pack = pack;
	const videos: HouseVideo[] = [];
	const rawVideos = asList(r.videos);
	for (let i = 0; i < rawVideos.length; i++) {
		const v = normaliseVideo(rawVideos[i], i, ctx);
		if (v) videos.push(v);
	}
	if (videos.length) house.videos = videos;
	const components = asList(r.components).map((c, i) => normaliseComponent(c, i, ctx));
	if (components.length) house.components = components;
	applyRenames(house, ctx);
	for (const p of forbiddenKeys(house, 'house', [])) {
		report.push({ path: p, code: 'forbidden', said: 'a key the client refuses is still on the record after normalising' });
	}
	return { house, report };
}
