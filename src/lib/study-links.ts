/**
 * The "In this app" block on a study card: which of the Table's own pages
 * hold something about a house dish (docs/study-menus-design.md, 1.5).
 *
 * MATCHED, NEVER MAPPED. Every link is found by a whole-word match of a
 * page's name in the dish's own text, and drawn only when its target exists:
 * the inputs are the loaded data itself, so a name that is not in the deck,
 * the Lexicon or the Library yields nothing. Nothing here is hand-written per
 * dish.
 *
 * Two rules keep a link from teaching the wrong thing, both mechanical:
 *
 * 1. Overlapping hits resolve to the longest. "oyster mushrooms" is the
 *    Oyster Mushroom card, never the fish card for Oysters; a deck term
 *    "Canadian Bacon" would win over "Bacon" the day the deck gains one.
 * 2. A one-word name is not linked where the word directly before it, in the
 *    text as written, begins with a capital letter and does not open its
 *    sentence or list item: "Canadian bacon", "Creole mustard", "Grand
 *    Marnier". A proper adjective in front of a common noun names a
 *    different thing. Coffee-cured Canadian bacon is loin; the deck's Bacon
 *    card is belly, and a server who followed that link would learn the
 *    signature dish wrong. The dish's NAME is exempt, because a menu sets
 *    names in title case and every word in one is capitalised.
 *
 * PURE: the data comes in as arguments (the page loads it through the
 * existing precached loaders), so the block works offline and this file is
 * tested over the real JSON under Node.
 */
import { fold, kept } from './study';
import type { FormulaParts, House, HouseDish, LexiconTerm, Scenario } from './house/house-schema';

/* -------------------------------------------------------------------------
 * The shapes this reads, narrowed to the fields it uses
 * ---------------------------------------------------------------------- */

export interface DeckCardIn {
	id: string;
	term: string;
	aliases?: string[];
	gist?: string;
	section?: string;
}
export interface LexiconIn {
	slug: string;
	term: string;
	category?: string;
}
export interface TechniqueIn {
	slug: string;
	label: string;
	lexiconSlug?: string | null;
	lexiconTerm?: string | null;
}
export interface RecipeIn {
	slug: string;
	name: string;
	source?: string;
}
export interface PrimerIn {
	level: number;
	subsection: string;
	cites?: Array<{ slug: string }>;
}

export interface LinkSources {
	deck?: readonly DeckCardIn[];
	lexicon?: readonly LexiconIn[];
	techniques?: readonly TechniqueIn[];
	recipes?: readonly RecipeIn[];
	primers?: readonly PrimerIn[];
	/** Level number to its name, as the deck index carries it ("1": "Commis"). */
	levelNames?: Readonly<Record<string, string>>;
	/** Subsection key to its title, as levels.json carries it. */
	subsectionTitles?: Readonly<Record<string, string>>;
	/** The Table's own link from the dish to a recipe, when a person set one. */
	recipeSlug?: string;
}

export interface StudyLinks {
	houseWords: Array<{ id: string; term: string; say: string; toGuest: string }>;
	deck: Array<{ id: string; term: string; gist: string }>;
	lexicon: Array<{ slug: string; term: string }>;
	techniques: Array<{ slug: string; label: string }>;
	recipe: { slug: string; name: string; source?: string } | null;
	primers: Array<{ level: number; subsection: string; label: string }>;
	scenarios: Array<{ id: string; title: string }>;
}

export const LINKS_PER_GROUP = 6;

/* -------------------------------------------------------------------------
 * Tokens: the folded words of the text, with what the unfolded text said
 * about each (capitalised, and whether it opens a sentence or list item)
 * ---------------------------------------------------------------------- */

interface Tok {
	f: string;
	cap: boolean;
	first: boolean;
	seg: number;
	name: boolean;
}

/** The dish's text as segments, in the order that decides a link's place: the name, then the menu's words, then four of the kept parts. */
export function dishSegments(dish: HouseDish): Array<{ text: string; name: boolean }> {
	const segs: Array<{ text: string; name: boolean }> = [{ text: dish.name ?? '', name: true }];
	if (dish.description) segs.push({ text: dish.description, name: false });
	for (const i of dish.ingredients ?? []) segs.push({ text: i, name: false });
	// The kept parts, but not "how it tastes": that part is adjectives, and
	// "bright and tart" there is sour, never the deck's pastry card Tart.
	const parts = kept<FormulaParts>(dish.parts);
	if (parts) for (const k of ['main', 'technique', 'sauce', 'sides'] as const) if (parts[k]) segs.push({ text: parts[k], name: false });
	return segs;
}

function tokenise(segs: ReadonlyArray<{ text: string; name: boolean }>): Tok[] {
	const out: Tok[] = [];
	segs.forEach((seg, s) => {
		const raw = String(seg.text ?? '').split(/\s+/).filter(Boolean);
		let opens = true;
		for (const w of raw) {
			const letters = w.replace(/^[^\p{L}\p{N}]+/u, '');
			const cap = /^\p{Lu}/u.test(letters);
			const words = fold(w).trim().split(' ').filter(Boolean);
			words.forEach((f, i) => out.push({ f, cap: i === 0 && cap, first: i === 0 && opens, seg: s, name: seg.name }));
			opens = /[.!?:;,(]$/.test(w) || /^[-*•]$/.test(w);
		}
	});
	return out;
}

interface Cand<T> {
	words: string[];
	payload: T;
}
interface Hit<T> {
	start: number;
	end: number;
	payload: T;
}

function wordFormsMatch(tok: string, word: string, last: boolean): boolean {
	return tok === word || (last && (tok === word + 's' || tok === word + 'es'));
}

/**
 * Every hit of every candidate in the tokens, overlaps resolved to the
 * longest and proper-adjective hits dropped, in the order they occur.
 */
function findHits<T>(toks: readonly Tok[], cands: ReadonlyArray<Cand<T>>): Array<Hit<T>> {
	const all: Array<Hit<T>> = [];
	const byFirst = new Map<string, Array<Cand<T>>>();
	for (const c of cands) {
		if (!c.words.length) continue;
		const k = c.words[0];
		if (!byFirst.has(k)) byFirst.set(k, []);
		byFirst.get(k)!.push(c);
	}
	for (let i = 0; i < toks.length; i++) {
		const list = [...(byFirst.get(toks[i].f) ?? []), ...c1(toks[i].f, byFirst)];
		for (const c of list) {
			const n = c.words.length;
			if (i + n > toks.length) continue;
			let ok = true;
			for (let j = 0; j < n; j++) {
				const t = toks[i + j];
				if (t.seg !== toks[i].seg || !wordFormsMatch(t.f, c.words[j], j === n - 1)) {
					ok = false;
					break;
				}
			}
			if (ok) all.push({ start: i, end: i + n, payload: c.payload });
		}
	}
	const longestFirst = all.slice().sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start);
	const taken: boolean[] = [];
	const kept: Array<Hit<T>> = [];
	for (const h of longestFirst) {
		let free = true;
		for (let i = h.start; i < h.end; i++) if (taken[i]) free = false;
		if (!free) continue;
		if (h.end - h.start === 1 && h.start > 0) {
			const prev = toks[h.start - 1];
			const t = toks[h.start];
			if (prev.seg === t.seg && !t.name && prev.cap && !prev.first) continue;
		}
		for (let i = h.start; i < h.end; i++) taken[i] = true;
		kept.push(h);
	}
	return kept.sort((a, b) => a.start - b.start);
}

/* A one-word candidate whose single word is the plural stem of the token ("oysters" for a term "oyster"). */
function c1<T>(tok: string, byFirst: Map<string, Array<Cand<T>>>): Array<Cand<T>> {
	const out: Array<Cand<T>> = [];
	for (const stem of [tok.endsWith('es') ? tok.slice(0, -2) : '', tok.endsWith('s') ? tok.slice(0, -1) : '']) {
		if (!stem) continue;
		for (const c of byFirst.get(stem) ?? []) if (c.words.length === 1) out.push(c);
	}
	return out;
}

function words(name: string): string[] {
	const f = fold(name).trim();
	return f && f.length >= 4 ? f.split(' ') : [];
}

/** The first hit per payload key, ordered by where it first occurs, capped. */
function firstPer<T>(hits: ReadonlyArray<Hit<T>>, key: (p: T) => string, cap = LINKS_PER_GROUP): T[] {
	const seen = new Set<string>();
	const out: T[] = [];
	for (const h of hits) {
		const k = key(h.payload);
		if (seen.has(k)) continue;
		seen.add(k);
		out.push(h.payload);
		if (out.length >= cap) break;
	}
	return out;
}

/* -------------------------------------------------------------------------
 * The groups
 * ---------------------------------------------------------------------- */

/** The Floor Deck cards whose term or any alias is in the dish's text. */
export function deckLinks(dish: HouseDish, deck: readonly DeckCardIn[]): Array<{ id: string; term: string; gist: string }> {
	const cands: Array<Cand<DeckCardIn>> = [];
	for (const c of deck) for (const n of [c.term, ...(c.aliases ?? [])]) {
		const w = words(n);
		if (w.length) cands.push({ words: w, payload: c });
	}
	const hits = findHits(tokenise(dishSegments(dish)), cands);
	return firstPer(hits, (c) => c.id).map((c) => ({ id: c.id, term: c.term, gist: c.gist ?? '' }));
}

/** The Lexicon entries whose term is in the dish's text. */
export function lexiconLinks(dish: HouseDish, lexicon: readonly LexiconIn[]): Array<{ slug: string; term: string }> {
	const cands: Array<Cand<LexiconIn>> = [];
	for (const e of lexicon) {
		const w = words(e.term);
		if (w.length) cands.push({ words: w, payload: e });
	}
	const hits = findHits(tokenise(dishSegments(dish)), cands);
	return firstPer(hits, (e) => e.slug).map((e) => ({ slug: e.slug, term: e.term }));
}

/** The techniques whose label or anchored Lexicon term is in the kept technique part or the description. */
export function techniqueLinks(dish: HouseDish, techniques: readonly TechniqueIn[]): Array<{ slug: string; label: string }> {
	const parts = kept<FormulaParts>(dish.parts);
	const segs = [
		{ text: parts?.technique ?? '', name: false },
		{ text: dish.description ?? '', name: false }
	].filter((s) => s.text);
	const cands: Array<Cand<TechniqueIn>> = [];
	for (const t of techniques) for (const n of [t.label, t.lexiconTerm ?? '']) {
		const w = words(n);
		if (w.length) cands.push({ words: w, payload: t });
	}
	const hits = findHits(tokenise(segs), cands);
	return firstPer(hits, (t) => t.slug).map((t) => ({ slug: t.slug, label: t.label }));
}

/**
 * The Library recipe for the dish: the Table's own link when a person set
 * one; else a recipe whose folded name equals the dish's; else the longest
 * recipe name of at least two words and eight characters inside the dish's
 * name ("World Famous Bananas Foster" to Bananas Foster).
 */
export function recipeLink(dish: HouseDish, recipes: readonly RecipeIn[], recipeSlug?: string): RecipeIn | null {
	if (recipeSlug) {
		const r = recipes.find((x) => x.slug === recipeSlug);
		if (r) return r;
	}
	const dn = fold(dish.name);
	const exact = recipes.find((r) => fold(r.name) === dn);
	if (exact) return exact;
	let best: RecipeIn | null = null;
	let bestLen = 0;
	for (const r of recipes) {
		const f = fold(r.name).trim();
		if (f.length < 8 || f.split(' ').length < 2) continue;
		if (dn.includes(' ' + f + ' ') && f.length > bestLen) {
			best = r;
			bestLen = f.length;
		}
	}
	return best;
}

/** The primers that cite the linked recipe, a linked Lexicon entry or a linked technique, named by level and subsection. */
export function primerLinks(
	primers: readonly PrimerIn[],
	slugs: ReadonlySet<string>,
	levelNames: Readonly<Record<string, string>> = {},
	titles: Readonly<Record<string, string>> = {}
): Array<{ level: number; subsection: string; label: string }> {
	const out: Array<{ level: number; subsection: string; label: string }> = [];
	for (const p of primers) {
		if (!(p.cites ?? []).some((c) => slugs.has(c.slug))) continue;
		const levelName = levelNames[String(p.level)];
		if (!levelName) continue;
		const title = titles[p.subsection] ?? p.subsection;
		out.push({ level: p.level, subsection: p.subsection, label: `${levelName}: ${title}` });
		if (out.length >= LINKS_PER_GROUP) break;
	}
	return out;
}

/** Every group for one dish. */
export function studyLinksFor(house: House, dish: HouseDish, src: LinkSources): StudyLinks {
	const houseWords = (house.lexicon ?? [])
		.filter((t: LexiconTerm) => (t.itemIds ?? []).includes(dish.id))
		.map((t) => ({ id: t.id, term: t.term, say: (kept<string>(t.say) ?? '').trim(), toGuest: (kept<string>(t.toGuest) ?? '').trim() }))
		.filter((t) => t.term && (t.say || t.toGuest))
		.slice(0, LINKS_PER_GROUP);
	const deck = src.deck ? deckLinks(dish, src.deck) : [];
	const lexicon = src.lexicon ? lexiconLinks(dish, src.lexicon) : [];
	const techniques = src.techniques ? techniqueLinks(dish, src.techniques) : [];
	const recipe = src.recipes ? recipeLink(dish, src.recipes, src.recipeSlug) : null;
	const slugs = new Set<string>([...lexicon.map((l) => l.slug), ...techniques.map((t) => t.slug), ...(recipe ? [recipe.slug] : [])]);
	const primers = src.primers ? primerLinks(src.primers, slugs, src.levelNames, src.subsectionTitles) : [];
	/* At most six, the scenario that names the fewest items first, so a dish's
	   own ("Foster for one") wins over the generic ones nearly every signature
	   shares ("First breakfast"); ties keep the house's order (the sort is stable). */
	const scenarios = (house.scenarios ?? [])
		.filter((s: Scenario) => (s.itemIds ?? []).includes(dish.id) && s.title)
		.sort((a: Scenario, b: Scenario) => (a.itemIds ?? []).length - (b.itemIds ?? []).length)
		.slice(0, LINKS_PER_GROUP)
		.map((s) => ({ id: s.id, title: s.title }));
	return { houseWords, deck, lexicon, techniques, recipe, primers, scenarios };
}
