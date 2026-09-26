/**
 * What the Maître d' hands back, turned into what the rest of the app reads.
 *
 * Two shapes come out of the client (static/shared/oot-maitre.js) and neither
 * is one the screens know. Her read is the model's FLAT desk (DESK_SCHEMA:
 * dishes, wines, cocktails, unsure, every field a string or a list of
 * strings), because a flat schema is the one a model fills reliably; the
 * review table reads Layer 1's DeskFile (desk-file.ts), because that is the
 * one the offline reader, the inbox and the download all share. adoptRead()
 * is the bridge, so both engines land in ONE shape and the table cannot tell
 * which read a row, except by `source.reader`. Her five lines and her filled
 * fields are lists by id; the record wants MaitreBlock marks with `by`, a
 * stamp and a model. adoptLines() and adoptEnrich() are that bridge.
 *
 * WHAT THIS MODULE MAY NOT DO, and it is the same list as the reader's:
 * - Invent a price. The client's price check has already blanked any price
 *   string that was not on the page and flagged the row; that flag becomes a
 *   `why` sentence and a low confidence here, the price stays blank, and the
 *   table's own guard (priceInRaw) runs over the row again besides. A wine's
 *   price line is assembled from the figures she gave and each one is kept as
 *   a part, so nothing here rounds, formats or converts a figure.
 * - Produce allergen information. There is no allergen field on any shape in
 *   or out, the client refused the whole answer if one appeared, and the
 *   key-set tests pin that nothing here grows one.
 * - Repair a spelling. Names, sections, descriptions and raw lines are copied
 *   as she copied them, which the DESK RULES told her is as printed.
 * - Mark anything kept. Every mark leaves here `by: 'maitre'`. Kept is a
 *   person's act (Keep, Edit, the chat's Keep this), and it happens on the
 *   record through the house store, never on the way in.
 *
 * Pure and outside any component, like the reader: a bridge vitest cannot
 * reach is a bridge nobody checks.
 */

import {
	deskSource,
	emptyDesk,
	mintDeskId,
	type DeskCocktail,
	type DeskDish,
	type DeskFile,
	type DeskItem,
	type DeskItemBase,
	type DeskPour,
	type DeskPricePart,
	type DeskSource,
	type DeskUnsorted,
	type DeskWine
} from './desk/desk-file';
import { priceParts } from './desk/desk-reader';
import { figureIndex } from './desk/desk-share';
import { foldName, stripInvisible } from './desk/desk-text';
import { drinkHits } from './desk/desk-vocab';
import { MAITRE_FIELDS, type MaitreField, type MaitrePatch } from './persistence/state';
import type { EnrichItem, FlatCocktail, FlatDish, FlatWine, FloorLines, MaitreReadResult } from './maitre';

/**
 * The `why` sentence on a row whose price the client blanked. The review
 * table shows "No price on this line" for it, the same flag it shows when
 * its own guard blanks one, so a person sees one flag whichever check fired.
 */
export const NO_PRICE_WHY = 'No price on this line: the price she read was not on the page, so it was blanked.';

/**
 * Said once at the top of a read the client could not check: a photograph or
 * a PDF has no text to hold her prices against, so every figure is hers.
 */
export const UNVERIFIED_NOTICE =
	"The Maître d' read this from a picture or a PDF, so the app had no text to check her prices against. Check every price against the page before it goes on.";

/** The five lines a floor uses, as MaitreBlock fields: every mark field but the ingredient list. */
export const LINE_FIELDS = MAITRE_FIELDS.filter((f): f is Exclude<MaitreField, 'ingredientsNamed'> => f !== 'ingredientsNamed');
export type LineField = (typeof LINE_FIELDS)[number];

export interface AdoptReadOptions {
	/** The room that asked. */
	readIn?: DeskSource['readIn'];
	/** The address she was given, when it was one. */
	url?: string;
	venue?: string;
	now?: Date;
	/** The random source for ids, for tests. */
	rand?: () => number;
}

/* -------------------------------------------------------------------------
 * Where a row sits in the source
 * ---------------------------------------------------------------------- */

const fold = (s: string) => stripInvisible(s).replace(/\s+/g, ' ').trim();

/**
 * The source text as lines, folded once, so every row's first raw line can
 * be found by a plain comparison. The line numbers exist for the screen to
 * point at and for the rows to come back in page order; they are not a claim
 * and a row whose line is not found says [0, 0], as the file validator does.
 */
function sourceLines(text: string): string[] {
	if (!text) return [];
	return text.replace(/\r\n?/g, '\n').split('\n').map(fold);
}

/** Null when the row's first line is not in the source: not found is not line nought. */
function linesOf(source: string[], raw: string): [number, number] | null {
	const own = raw.replace(/\r\n?/g, '\n').split('\n').map(fold).filter(Boolean);
	if (!source.length || !own.length) return null;
	const at = source.indexOf(own[0]);
	if (at < 0) return null;
	return [at, Math.min(source.length - 1, at + own.length - 1)];
}

/* -------------------------------------------------------------------------
 * The rows
 * ---------------------------------------------------------------------- */

function base(
	ids: Set<string>,
	rand: (() => number) | undefined,
	kind: DeskItemBase['kind'],
	section: string,
	name: string,
	printed: string,
	parts: DeskPricePart[],
	marks: string[],
	confidence: 'high' | 'low',
	why: string[],
	raw: string,
	lines: [number, number]
): DeskItemBase {
	const id = mintDeskId(ids, rand);
	ids.add(id);
	return {
		id,
		kind,
		section,
		name,
		price: { printed, parts },
		marks: marks.map((m) => m.toLowerCase()),
		confidence,
		why,
		raw,
		lines
	};
}

/** The rows the client flagged, as 'kind:index', so a row can be told it was. */
function flaggedRows(result: MaitreReadResult): Set<string> {
	const out = new Set<string>();
	for (const f of result.flags ?? []) out.add(`${f.kind}:${f.index}`);
	return out;
}

/** One reason a row is low, in her words or the app's. Low stays low; nothing here promotes a row. */
function settle(printed: string, name: string, flagged: boolean, why: string[]): 'high' | 'low' {
	if (flagged) {
		why.push(NO_PRICE_WHY);
		return 'low';
	}
	if (!printed) {
		why.push('No price printed on this line.');
		return 'low';
	}
	if (name.length > 60) {
		why.push('A long name: check it is one item.');
		return 'low';
	}
	return 'high';
}

/**
 * A pour as she wrote it, '5 oz 45.00' or '45.00 5 oz', into the desk's
 * {price, size}. The size is the figure with a measure word on it; the price
 * is the figure without one. Neither is parsed into a number, and a pour
 * with no measure keeps its whole text as the price so nothing she wrote is
 * dropped on the way through.
 */
const POUR_SIZE = /\b\d+(?:[.,]\d+)?\s?(?:oz|ml|cl|l)\b/i;
export function readPour(text: string): DeskPour {
	const t = fold(text);
	const size = POUR_SIZE.exec(t);
	if (!size) return { price: t, size: '' };
	const price = fold(t.replace(size[0], ''));
	return { price, size: fold(size[0]) };
}

function dishRow(d: FlatDish, ids: Set<string>, rand: (() => number) | undefined, lines: [number, number], flagged: boolean, readBy: string): DeskDish {
	const why = [readBy];
	const printed = flagged ? '' : d.price;
	let confidence = settle(printed, d.name, flagged, why);
	if (d.confidence === 'low') {
		why.push("Marked low by the Maître d'.");
		confidence = 'low';
	}
	return {
		...base(ids, rand, 'dish', d.section, d.name, printed, priceParts(printed), d.marks, confidence, why, d.raw, lines),
		kind: 'dish',
		description: d.description,
		ingredientsNamed: d.ingredientsNamed.filter((s) => s.trim())
	};
}

/**
 * The shortest run of `hay` that holds every figure as a figure of its own
 * (figureIndex: not the 8 inside 2018), or null when one is missing. The
 * figures are few (a glass, a pour or two, a bottle) and so are their
 * occurrences, so every occurrence of every figure is tried as the left end
 * and the tightest window wins. `hay` is folded already, so the slice is a
 * substring of the folded raw, which is what the table's guard folds too.
 */
export function printedSpan(hay: string, figures: string[]): string | null {
	const wanted = [...new Set(figures.filter(Boolean))];
	if (!wanted.length) return null;
	let best: [number, number] | null = null;
	for (const left of wanted) {
		for (let from = figureIndex(hay, left); from >= 0; from = figureIndex(hay, left, from + 1)) {
			let end = from + left.length;
			let whole = true;
			for (const other of wanted) {
				if (other === left) continue;
				// The nearest occurrence at or after the left end; one before it
				// belongs to a window with another left end, tried in its turn.
				const at = figureIndex(hay, other, from);
				if (at < 0) {
					whole = false;
					break;
				}
				end = Math.max(end, at + other.length);
			}
			if (whole && (!best || end - from < best[1] - best[0])) best = [from, end];
		}
	}
	return best ? hay.slice(best[0], best[1]) : null;
}

function wineRow(w: FlatWine, ids: Set<string>, rand: (() => number) | undefined, lines: [number, number], flagged: boolean, readBy: string): DeskWine {
	const why = [readBy];
	const pours = w.pours.map(readPour).filter((p) => p.price || p.size);
	// The price line is the figures she gave, glass then pours then bottle,
	// each kept as its own part with the word it came with. A repeated figure
	// (a glass price that is also the first pour) is one part, not two.
	const parts: DeskPricePart[] = [];
	const seen = new Set<string>();
	const add = (amount: string, label: string) => {
		const a = fold(amount);
		if (!a || seen.has(`${a}|${label}`)) return;
		seen.add(`${a}|${label}`);
		parts.push({ amount: a, label });
	};
	if (w.glass) add(w.glass, 'Glass');
	for (const p of pours) if (p.price) add(p.price, p.size);
	if (w.bottle) add(w.bottle, 'Bottle');
	// The price line is what the page printed between her figures: the
	// shortest run of the row's own lines that holds every one of them as a
	// figure of its own ("8 Bottle 30" for a glass of 8 and a bottle of 30),
	// never a join the page did not print ("8 / 30"). The table's guard asks
	// whether the printed price is on the line, and a join would fail it on
	// screen while the file handed to the Codex still carried it: the flag
	// lying one way and the file the other. The join is the fallback when
	// the lines she copied do not carry every figure, and a row on it is
	// low with a why, because the table will blank that line, as it should.
	const onLine = printedSpan(fold(w.raw), parts.map((p) => p.amount));
	const printed = onLine ?? [...new Set(parts.map((p) => p.amount))].join(' / ');
	if (!w.producer) why.push('No producer read from the name line; the Codex may fill it from its corpus.');
	let confidence = settle(printed, w.name, flagged, why);
	if (printed && onLine === null) {
		why.push('Price line assembled from the figures she read (glass, pours, bottle): not all of them are on the lines she copied.');
		confidence = 'low';
	}
	return {
		...base(ids, rand, 'wine', w.section, w.name, printed, parts, [], confidence, why, w.raw, lines),
		kind: 'wine',
		producer: w.producer,
		wine: w.name,
		vintage: w.vintage,
		region: w.region,
		country: '',
		grapes: w.grapes.filter((g) => g.trim()),
		style: w.style,
		bin: '',
		pours,
		bottle: w.bottle,
		descriptors: ''
	};
}

function cocktailRow(c: FlatCocktail, ids: Set<string>, rand: (() => number) | undefined, lines: [number, number], flagged: boolean, readBy: string): DeskCocktail {
	const why = [readBy];
	const spec = c.spec.filter((s) => s.trim());
	// The reader's own rule for the base spirit: the one spirit word on the
	// spec, or nothing when there are two, and never a word derived from the
	// name. drinkHits is the reader's lexicon, so the two engines agree.
	const spirits = new Set<string>();
	for (const part of spec) for (const h of drinkHits(part)) if (h.term === 'spirit') spirits.add(h.key);
	const baseSpirit = spirits.size === 1 ? [...spirits][0] : '';
	if (spirits.size > 1) why.push('Two spirit words on the spec, so no base spirit is named.');
	// The desk's cocktail carries a description and no fields for method,
	// glass or garnish, so the three the page printed travel as labelled
	// prose the Ledger shows under the name. Labelled, so they never read as
	// a description the menu wrote.
	const printedBits: string[] = [];
	if (c.method) printedBits.push(`Method: ${c.method}.`);
	if (c.glass) printedBits.push(`Glass: ${c.glass}.`);
	if (c.garnish) printedBits.push(`Garnish: ${c.garnish}.`);
	const printed = flagged ? '' : c.price;
	const confidence = settle(printed, c.name, flagged, why);
	return {
		...base(ids, rand, 'cocktail', c.section, c.name, printed, priceParts(printed), [], confidence, why, c.raw, lines),
		kind: 'cocktail',
		spec,
		description: printedBits.join(' '),
		baseSpirit
	};
}

/**
 * Her read, as a desk file.
 *
 * The source block is built the one way (deskSource) so the hash is the same
 * hashText the paste path uses: the same menu pasted again in any room is
 * recognised whichever engine read it first. A photograph has no text to
 * hash, so the client's own fingerprint of the pictures stands in. Rows come
 * back in page order when their lines were found, and in her order (dishes,
 * wines, cocktails) when they were not, which is every photograph.
 */
export function adoptRead(result: MaitreReadResult, opts: AdoptReadOptions = {}): DeskFile {
	const now = opts.now ?? new Date();
	const model = result.provenance?.model || 'unknown';
	const text = typeof result.sourceText === 'string' ? result.sourceText : '';
	const url = opts.url ?? result.provenance?.sourceUrl;
	const source = deskSource('agent', opts.readIn ?? 'table', text, { url, reader: `maitre/${model}`, now });
	if (!text && result.provenance?.sourceHash) source.hash = result.provenance.sourceHash;
	const file = emptyDesk(source, now);
	if (opts.venue) file.venue = opts.venue;

	const lines = sourceLines(text);
	const ids = new Set<string>();
	const flagged = flaggedRows(result);
	const readBy = `Read by the Maître d' on ${model}.`;
	const desk = result.desk;

	// Page order where it is known. A row whose line was not found sorts after
	// every row whose line was, and the sort is stable, so her order (dishes,
	// wines, cocktails) holds within them.
	const placed: Array<{ it: DeskItem; at: number; i: number }> = [];
	const place = (raw: string, build: (l: [number, number]) => DeskItem) => {
		const found = linesOf(lines, raw);
		placed.push({ it: build(found ?? [0, 0]), at: found ? found[0] : Number.POSITIVE_INFINITY, i: placed.length });
	};
	desk.dishes.forEach((d, i) => place(d.raw, (l) => dishRow(d, ids, opts.rand, l, flagged.has(`dish:${i}`), readBy)));
	desk.wines.forEach((w, i) => place(w.raw, (l) => wineRow(w, ids, opts.rand, l, flagged.has(`wine:${i}`), readBy)));
	desk.cocktails.forEach((c, i) => place(c.raw, (l) => cocktailRow(c, ids, opts.rand, l, flagged.has(`cocktail:${i}`), readBy)));
	file.items = placed.sort((a, b) => a.at - b.at || a.i - b.i).map((x) => x.it);

	const unsorted: DeskUnsorted[] = [];
	for (const u of desk.unsure) {
		const raw = u.raw;
		if (!raw.trim()) continue;
		unsorted.push({ raw, line: linesOf(lines, raw)?.[0] ?? 0, reason: u.reason || 'unsure' });
	}
	file.unsorted = unsorted;
	if (result.provenance?.priceCheck === 'unverified') file.notice = UNVERIFIED_NOTICE;
	return file;
}

/* -------------------------------------------------------------------------
 * The two engines side by side
 * ---------------------------------------------------------------------- */

/** What the offline read made of the same line, where it differs from hers. */
export interface OfflineDiffers {
	name: string;
	price: string;
}

const firstLine = (raw: string) => fold(raw.split('\n').find((l) => l.trim()) ?? '');

/**
 * Her rows against the offline reader's read of the same text, by id: the
 * "Differs from the offline read: {name} · {price}" flag. A row is matched
 * by folded name first, then by the first line of its raw, and flagged when
 * the two engines read a different name or a different price off it. The
 * offline read is never applied; a person sees both and decides.
 */
export function diffAgainstOffline(hers: DeskFile, offline: DeskFile): Map<string, OfflineDiffers> {
	const byName = new Map<string, DeskItem>();
	const byRaw = new Map<string, DeskItem>();
	for (const it of offline.items) {
		const n = foldName(it.name);
		if (n && !byName.has(n)) byName.set(n, it);
		const r = firstLine(it.raw);
		if (r && !byRaw.has(r)) byRaw.set(r, it);
	}
	const out = new Map<string, OfflineDiffers>();
	for (const it of hers.items) {
		const match = byName.get(foldName(it.name)) ?? byRaw.get(firstLine(it.raw));
		if (!match) continue;
		const sameName = foldName(match.name) === foldName(it.name);
		const samePrice = fold(match.price.printed) === fold(it.price.printed);
		if (sameName && samePrice) continue;
		out.set(it.id, { name: match.name, price: match.price.printed || 'no price' });
	}
	return out;
}

/* -------------------------------------------------------------------------
 * Her marks
 * ---------------------------------------------------------------------- */

/**
 * Her five lines, as marks by id. A field she left empty ("nothing honest
 * to write") is no mark at all, and an item with nothing in any field is
 * left out, so a run never writes a blank a person could Keep.
 */
export function adoptLines(items: FloorLines[], model: string, now = Date.now()): Map<string, MaitrePatch> {
	const out = new Map<string, MaitrePatch>();
	for (const it of items ?? []) {
		if (!it || typeof it.id !== 'string' || !it.id) continue;
		const patch: MaitrePatch = {};
		for (const f of LINE_FIELDS) {
			const v = it[f];
			if (typeof v === 'string' && v.trim()) patch[f] = { value: v, by: 'maitre', ts: now, model };
		}
		if (Object.keys(patch).length) out.set(it.id, patch);
	}
	return out;
}

/**
 * Her filled fields, as marks by id. Only `ingredientsNamed` is a mark the
 * dish carries, and only from the menu's own words: 'canon' is for a classic
 * cocktail's method and never a dish's ingredients (ENRICH RULES), and 'none'
 * is the empty answer, which is no mark.
 */
export function adoptEnrich(items: EnrichItem[], model: string, now = Date.now()): Map<string, MaitrePatch> {
	const out = new Map<string, MaitrePatch>();
	for (const it of items ?? []) {
		if (!it || typeof it.id !== 'string' || !it.id) continue;
		const patch: MaitrePatch = {};
		for (const f of it.fields ?? []) {
			if (f.name !== 'ingredientsNamed' || f.from !== 'menu') continue;
			const value = (f.value ?? []).filter((s) => typeof s === 'string' && s.trim());
			if (value.length) patch.ingredientsNamed = { value, by: 'maitre', ts: now, model };
		}
		if (Object.keys(patch).length) out.set(it.id, patch);
	}
	return out;
}
