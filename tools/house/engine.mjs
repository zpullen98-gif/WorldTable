/* engine.mjs: the House engine (oot-house.js, a classic browser script) loaded with node:vm into a
   context whose window has no indexedDB, so OOT.house installs over a Map and OOT.houseLib carries
   every pure function the tools call. Shared by validate-pack, keep-all and check-pack; the builder
   and the parser's check load it the same way on their own.

   Also the counts every gate asserts over the Brennan's house, in one place, the walk that
   collects every string with its path, and the American spelling map: the guide is American
   English and so is every house field, while the research's forThePack sentences are British, so
   the builder maps each British form it knows to the American one as the string enters the pack
   and check-pack refuses any that remains. No dash of any spelling in this file. */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(HERE, '..');
export const ENGINE = path.join(HERE, '..', '..', 'static', 'shared', 'oot-house.js');
export const DIR = path.join(HERE, 'brennans');
export const GUIDE = path.join(DIR, 'guide.txt');
export const RESEARCH = path.join(DIR, 'research');
/* The committed snapshots of the pages a price outside the guide stands on, one .txt per page,
   its provenance in the first line. The guide plus these is the page the price rule reads. */
export const PAGES = path.join(DIR, 'pages');
export const HOUSE_JSON = path.join(DIR, 'house.json');
export const PACK = path.join(HERE, '..', '..', 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json');
/* The edition rule. A shipped pack carries house.pack.builtAt, and every mark and every record's
   ts carries exactly Date.parse of it, so a stamp that differs on a device is a person's edit.
   Fixed, so a rebuild is byte for byte the same; --stamp or --now on the builder and keep-all set
   another for a fresh edition. The 21:00 edition of 3 October 2026 was the fuller pack; the 22:00
   edition adds the coaching notes and the rewritten thin lines (noteProblems and thinLines below)
   and moves every stamp with it. The 01:30 edition of 4 October 2026 reads the menus the owner
   pasted on 3 October: the fall list and the dessert, coffee and Bubbles drinks in, the summer
   list out (tombstoned, so a device drops each one nobody touched), the glass list as printed. It was
   first stamped 06:00, hours ahead of the clock: keep-all makes every mark a person's at the stamp, so
   any edit a person made between the publish and 06:00 would have lost to the pack. The stamp is
   01:30 instead, after the 22:00:00.001 tombstones and before any publish, and editionInFuture below
   holds every later edition to the same rule. The 04:00 edition of 4 October 2026 adds the floor's
   bottles from the Binwise list the owner pasted on 3 October, each a full study card, and the
   bottles offered with each dish in three price tiers and a half; it is stamped at the half hour
   before its build, never ahead of the clock. The 06:30 edition of 4 October 2026 carries the
   master review of My Menu (the chef's, the bartender's and the sommelier's overrides, recorded in
   research/master-review-2026-10-04.md) and the first videos, each filed by a video:+ override. The
   18:30 edition of 5 October 2026 reads the two tasting menus the owner pasted that day
   (pages/brennans-tasting-menus-pasted-2026-10-05.txt): each course labelled and ordered as printed,
   the choice of, the lines printed under each course and the words over its pour, the breakfast's
   printed line and the dinner's supplement, the breakfast coffee course linked to the house's chicory
   coffee, and the dinner tasting named Dinner Tasting Menu under its old id; stamped at the half hour
   before its build, never ahead of the clock. The 18:30 edition of 6 October 2026 carries the
   producers deep dive for the kitchen (components/producers.json, from the five
   research/producers-food-*-2026-10-06.md files): a producer profile on forty components, one new
   component for the Parmesan on the Eggs Sardou, the corrections the research made to existing
   explanations, and the sourcing questions no source answers, each an ask:+ override for lineup;
   stamped at the half hour before its build, never ahead of the clock. The 08:30 edition of 10 October
   2026 carries the producers deep dive for the bar (components/producers.json, from the five
   research/producers-bar-*-2026-10-10.md files): a producer profile on thirty-five drink components,
   each held to the Ledger's living rule with the surnames that research met in living.json, the
   corrections the research made to existing drink explanations and cards, and the questions about a
   drink's producer no source answers, each an ask:+ override for lineup; stamped at the half hour
   before its build, never ahead of the clock. The 09:30 edition of the same day carries the producer
   walk-through's repairs: the British forms the spelling map had missed in the drink producers and
   elsewhere (reorganised, learnt, neighbourhood, dealcoholised and their kin) in American spelling, and
   the producer cards' who card saying a founded phrase as its own sentence (house-drills.ts
   foundedSentence); stamped at the half hour before its build, never ahead of the clock. */
export const EDITION_BUILT_AT = '2026-10-10T09:30:00.000Z';
export const EDITION_TS = Date.parse(EDITION_BUILT_AT);

/* An edition stamped later than the clock that writes or checks it. Every mark in the pack is a
   person's at that stamp, and pickMark lets the newer of two person marks win, so an edit made on a
   device after the publish but before the stamp would lose to the pack: the builder, keep-all and
   check-pack refuse such a stamp. Returns the sentence to fail with, or empty. */
export function editionInFuture(ts, now = Date.now()) {
	return Number.isFinite(ts) && ts > now ? `the edition stamp ${new Date(ts).toISOString()} is later than now (${new Date(now).toISOString()}): a person's edit made before it would lose to the pack; stamp the edition no later than its publish` : '';
}

/* The page text the verbatim price rule reads: the guide, then every snapshot under pages/ in
   name order, each on its own line. A snapshot whose first line does not name where it came from
   is refused, so no price can stand on text of unknown provenance. */
export function pageFiles() {
	if (!fs.existsSync(PAGES)) return [];
	return fs.readdirSync(PAGES).filter((f) => f.endsWith('.txt')).sort().map((f) => path.join(PAGES, f));
}
export function sourceText(fail) {
	if (!fs.existsSync(GUIDE)) fail(`${REL(GUIDE)}: missing; the price rule reads it as the page`);
	const parts = [fs.readFileSync(GUIDE, 'utf8')];
	for (const f of pageFiles()) {
		const text = fs.readFileSync(f, 'utf8');
		const first = text.split('\n')[0];
		if (!/^Source: \S/.test(first)) fail(`${REL(f)}: the first line must name the source ("Source: ..."), read ${JSON.stringify(first.slice(0, 60))}`);
		parts.push(DOLLAR_PAGE.test(first) ? dollarReading(text) : text);
	}
	return parts.join('\n');
}
/* A page whose source line says its prices are "the bottle price in dollars" (the Binwise paste) prints
   each entry as a bin line, the wine, the vintage and the price, a bare figure on the line before the
   blank line that closes the entry (3,577 such lines, one per catalogue entry). Each price line is read
   also in dollars, on the same line ("190 $190"), so a bottle printed "$190" stands on the very figure
   the list prints: a bin or a vintage, which never closes an entry, is never read as a price. */
export const DOLLAR_PAGE = /the bottle price in dollars/;
export function dollarReading(text) {
	const lines = text.split('\n');
	const figure = /^(?:\d{1,3}(?:,\d{3})+|\d+)$/;
	return lines.map((l, i) => (i > 0 && figure.test(l.trim()) && (i + 1 >= lines.length || lines[i + 1].trim() === '') ? l + ' $' + l.trim() : l)).join('\n');
}

export const REL = (p) => (typeof p === 'string' && p ? path.relative(process.cwd(), p) || p : '(none)');

/* The flags a tool knows, against what it was given: any other --flag, and any bare word that is
   not the value of a flag that takes one, is refused with the rule named, so a misspelt flag never
   passes or fails for the wrong reason. `valued` lists the flags whose next argument is a value. */
export function checkArgs(args, known, valued, fail) {
	const take = new Set(valued || []);
	for (let i = 0; i < args.length; i++) {
		const a = args[i];
		if (a.startsWith('-')) {
			if (!known.includes(a)) fail(`unknown argument ${a}; see --help`);
			if (take.has(a)) {
				if (i + 1 >= args.length || args[i + 1].startsWith('-')) fail(`${a} needs a value; see --help`);
				i++;
			}
		} else fail(`unexpected argument ${a}; see --help`);
	}
}

export function loadEngine(fail) {
	if (!fs.existsSync(ENGINE)) fail(`${REL(ENGINE)}: the engine is missing`);
	const window = {};
	window.window = window;
	window.self = window;
	const ctx = vm.createContext({ window, console });
	vm.runInContext(fs.readFileSync(ENGINE, 'utf8'), ctx, { filename: ENGINE });
	const lib = window.OOT && window.OOT.houseLib;
	if (!lib || typeof lib.validateHouse !== 'function') fail(`${REL(ENGINE)}: window.OOT.houseLib is not there after the script ran`);
	return lib;
}

/* The sections the overrides file beyond the guide's menus: the children's menu (two cards, one
   price, three courses, never a pairing) and the Roost Bar and Bubbles snacks (a pairing line to a
   house drink or wine allowed, never a pairing block invented for them). */
export const CHILD_SECTIONS = ["Children's breakfast", "Children's dinner"];
export const SNACK_SECTION = 'Roost Bar & Bubbles snacks';

/* The counts the Brennan's pack must carry: the guide's 47 dishes plus the 8 children's plates and
   the 7 Bubbles snacks (62); from the 01:30 edition of 4 October 2026, read against the owner's paste,
   32 drinks: the 4 signature drinks still printed, the 3 Luxury Roost Bar cocktails, the 2 premium
   Sazeracs, the Bloody Mary, the Champagne Cocktail, the 3 coffees and the juice, the 6 drinks of
   Billboard Songs from 1946 and the 2 of Temperance, 1946, the 3 dessert and 2 coffee cocktails and the
   4 Bubbles cocktails (6 of them zero-proof; the summer list's 8 are retired); 94 items with a formula
   in all; 34 wines (the guide's 20, the Barbera and the Argyle Brut by the glass, the 7 Birthday Bubbles
   bottles and the 5 Bubbles rosés), the menus' wines, with the floor's bottles and the dishes they
   tier counted from the overrides (overrideCounts); 2 tastings; 14 sources; at least 115 terms; at least 33 scenarios; 4 or more mix-ups; the
   must-knows; a lineup register of at least 60 questions; the 35 pairings; and the five disputes the
   plan names. */
/* THE FLOOR'S BOTTLES. The menus' wines stay fixed at 34 (list 'glass', the default), and the bottle
   list's wines and the dishes with bottle tiers are counted from what the overrides file asks for,
   so a new bottle or a new tier moves the expected figure with it rather than a number here: every
   wine:+ add whose value says list "bottle", and every dish a 'bottles' entry names. A count passed
   in `expect` stands instead (a test, or an integrator holding the edition to a figure it states). */
export const OVERRIDES = path.join(DIR, 'overrides.json');
export const MENU_WINES = 34;
export function overrideCounts(file = OVERRIDES) {
	const out = { bottles: 0, tiered: 0 };
	if (!fs.existsSync(file)) return out;
	const entries = (JSON.parse(fs.readFileSync(file, 'utf8')).entries || []);
	const dishes = new Set();
	for (const e of entries) {
		if (e.target === 'wine:+' && (e.op || 'set') === 'add' && e.value && e.value.list === 'bottle') out.bottles++;
		if (e.op === 'bottles' && typeof e.target === 'string') dishes.add(e.target.toLowerCase());
	}
	out.tiered = dishes.size;
	return out;
}

/* THE COMPONENTS. The ingredients, techniques and stories behind every item arrive as fragments, one
   JSON file per author under brennans/components/ (dishes.json, drinks.json, wines.json, videos.json),
   in one shape: { components: [{ key, kind, name, say, explain, card: { front, back }, items, terms,
   sources }], compare: [{ item, entries: [{ app, ref, label, same, different }] }] }, and videos.json
   { videos: [a research video record with componentKeys, or { id, componentKeys } attaching
   components to a video an override already files] }. A fragment may also carry producers: [{ component,
   producer, sources }], each attaching a producer profile ({ type, who, where, founded, history, facts,
   notes, sayIt, askKitchen }) to the component an existing key names (producers.json, the producer
   research), and a component of its own may carry "producer" inline. BRENNANS_COMPONENTS names another directory
   (a fixture), and the builder's --components flag does the same; an absent directory is no
   fragments. The builder reads them through readFragments, and the counts the gates hold the pack to
   come from the same read (fragmentCounts), so a new fragment moves the expected figures with it. */
export function componentsDir() {
	return process.env.BRENNANS_COMPONENTS ? path.resolve(process.env.BRENNANS_COMPONENTS) : path.join(DIR, 'components');
}
export const FRAGMENT_FILES = ['dishes.json', 'drinks.json', 'wines.json', 'videos.json'];
/* Every fragment file in the directory: the four named files first in that order, then any other .json
   in name order. Throws with the file named when one does not parse or is not a fragment. */
export const FRAGMENT_KEYS = ['components', 'compare', 'videos', 'producers'];
/* The one .json beside the fragments that is not one: living.json, the surnames the Ledger's living rule
   refuses (livingNames below). */
export const LIVING_FILE = 'living.json';
export function readFragments(dir = componentsDir()) {
	const out = { dir, files: [], components: [], compare: [], videos: [], producers: [] };
	if (!dir || !fs.existsSync(dir)) return out;
	const names = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== LIVING_FILE);
	const rank = (f) => (FRAGMENT_FILES.indexOf(f) < 0 ? 99 : FRAGMENT_FILES.indexOf(f));
	names.sort((a, b) => rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0));
	for (const f of names) {
		const file = path.join(dir, f);
		let data;
		try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { throw new Error(`${REL(file)}: does not parse as JSON (${e.message})`); }
		if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(`${REL(file)}: a fragment is an object`);
		for (const k of Object.keys(data)) if (!FRAGMENT_KEYS.includes(k)) throw new Error(`${REL(file)}: unknown key ${k}; a fragment carries components, compare, videos or producers`);
		out.files.push(file);
		for (const k of FRAGMENT_KEYS) {
			const list = data[k];
			if (list === undefined) continue;
			if (!Array.isArray(list)) throw new Error(`${REL(file)}: ${k} is a list`);
			list.forEach((v, i) => out[k].push({ file, at: `${REL(file)} ${k}[${i}]`, v }));
		}
	}
	return out;
}
/* The figures the pack must show for the fragments read: components, distinct items named, items
   compared, videos naming a component and components carrying a producer (inline or by a producers
   entry, each component once). Zero everywhere when there are none. */
export function fragmentCounts(dir = componentsDir()) {
	const out = { components: 0, componentItems: 0, compared: 0, componentVideos: 0, producers: 0 };
	let f;
	try { f = readFragments(dir); } catch { return out; }
	out.components = f.components.length;
	const items = new Set();
	for (const c of f.components) for (const n of (c.v && Array.isArray(c.v.items) ? c.v.items : [])) items.add(foldName(String(n)));
	out.componentItems = items.size;
	out.compared = new Set(f.compare.map((c) => foldName(String((c.v && c.v.item) || ''))).filter(Boolean)).size;
	out.componentVideos = new Set(f.videos.filter((x) => x.v && Array.isArray(x.v.componentKeys) && x.v.componentKeys.length).map((x) => x.v.id)).size;
	const produced = new Set();
	for (const c of f.components) if (c.v && c.v.producer && typeof c.v.key === 'string') produced.add(c.v.key);
	for (const p of f.producers) if (p.v && typeof p.v.component === 'string') produced.add(p.v.component);
	out.producers = produced.size;
	return out;
}

export function countProblems(house, expect = overrideCounts(), frag = fragmentCounts()) {
	const out = [];
	const n = (list) => (Array.isArray(house[list]) ? house[list].length : 0);
	const zero = (house.cocktails || []).filter((c) => c.zeroProof === true).length;
	const eq = (what, got, want) => { if (got !== want) out.push(`${what}: ${got}, expected ${want}`); };
	const ge = (what, got, want) => { if (got < want) out.push(`${what}: ${got}, expected at least ${want}`); };
	const inSection = (names) => (house.dishes || []).filter((d) => names.includes(d.section)).length;
	eq('dishes', n('dishes'), 62);
	eq("children's plates", inSection(CHILD_SECTIONS), 8);
	eq('Bubbles snacks', inSection([SNACK_SECTION]), 7);
	eq('cocktails', n('cocktails'), 32);
	eq('spirit-free cocktails', zero, 6);
	eq('dishes and cocktails in all', n('dishes') + n('cocktails'), 94);
	const bottles = (house.wines || []).filter((w) => w.list === 'bottle');
	eq('wines on the menus (list glass)', n('wines') - bottles.length, MENU_WINES);
	eq("the floor's bottles (list bottle, from the overrides' wine:+ adds)", bottles.length, expect.bottles);
	/* The bin is not held here: the builder requires it named, blank only where the list prints none. */
	for (const w of bottles) if (!w.size || !w.bottle) out.push(`bottle ${w.name}: a bottle on the list carries its size and bottle price`);
	const tiered = (house.dishes || []).filter((d) => d.pairing && d.pairing.value && d.pairing.value.bottles).length;
	eq("dishes with bottle tiers (from the overrides' bottles entries)", tiered, expect.tiered);
	eq('tastings', n('tastings'), 2);
	eq('sources', (house.sources || []).length, 14);
	ge('terms', n('lexicon'), 115);
	ge('scenarios', n('scenarios'), 33);
	ge('mix-ups', n('mixUps'), 4);
	ge('must-knows', n('mustKnows'), 12);
	ge('askAtLineup', n('askAtLineup'), 60);
	const pairings = (house.dishes || []).filter((d) => d.pairing && d.pairing.value && d.pairing.value.wineId).length;
	eq('pairings', pairings, 35);
	const disputeText = JSON.stringify(house.disputes || []).toLowerCase();
	for (const [name, re] of [
		['the Hussarde Champagne', /lafitte/],
		['the lobster pour', /meursault|fichet/],
		['the duck course', /rohan/],
		['the Rare vintage', /2013/],
		['the house Champagne price', /\$30/]
	]) if (!re.test(disputeText)) out.push(`disputes: ${name} is not among them`);
	/* The components, read from the fragments the builder read (fragmentCounts): every component they
	   file, every item they name carrying at least one, every item they compare carrying its
	   comparisons, and every video they attach naming its components. No fragments, no components. */
	const comps = Array.isArray(house.components) ? house.components : [];
	eq('components (from the fragments)', comps.length, frag.components);
	const withComp = new Set();
	for (const c of comps) for (const id of c.itemIds || []) withComp.add(id);
	eq('items carrying a component (from the fragments)', withComp.size, frag.componentItems);
	const compared = ['dishes', 'wines', 'cocktails'].reduce((n, l) => n + (house[l] || []).filter((r) => r.compare && Array.isArray(r.compare.value) && r.compare.value.length).length, 0);
	eq('items with comparisons (from the fragments)', compared, frag.compared);
	const vidComp = (house.videos || []).filter((v) => Array.isArray(v.componentIds) && v.componentIds.length).length;
	eq('videos naming a component (from the fragments)', vidComp, frag.componentVideos);
	eq('components carrying a producer (from the fragments)', comps.filter((c) => c.producer && c.producer.value).length, frag.producers || 0);
	if (!house.menusReadOn) out.push('menusReadOn is empty');
	if (house.began !== 'pack') out.push(`began is ${house.began}, expected pack`);
	if (!house.pack || house.pack.version !== 1) out.push('pack stamp missing or not version 1');
	for (const step of ['card', 'menus', 'filed', 'formula', 'pairings', 'wines', 'lexicon', 'scenarios']) {
		if (!house.build || typeof house.build[step] !== 'number') out.push(`build.${step} is not stamped`);
	}
	return out;
}

/* The drill stems, held as the engine's dealer reads them (house-drills.ts SPECS): a stem is a kept
   string a question shows, its answer the name the question asks for. dealQuestion draws its
   distractors from every name in the field and never asks whether another record shares the stem,
   so two records with one stem make a question whose right answer can be marked wrong. A stem that
   holds its own answer is skipped by the dealer and so here. A filler part ('not printed', 'ask
   the kitchen') makes a question nobody can answer, so a dish's sauce and sides are held to say
   something or be left empty, which the dealer skips. A cocktail's glass is a drill answer, so it
   carries no parenthesis and no 'confirm': a glass the bar has not confirmed is left empty. */
const stemText = (v) => (typeof v === 'string' ? v.trim() : '');
const stemFold = (s) => stemText(s).toLowerCase().replace(/\s+/g, ' ');
const keptStem = (m) => (m && typeof m === 'object' && m.by === 'person' ? m.value : m && typeof m === 'object' && 'value' in m ? m.value : undefined);
export const FILLER_PART = /\b(not printed|nothing printed)\b|^ask the (kitchen|bar)\b/i;
export function stemProblems(house) {
	const out = [];
	const kinds = new Map();
	const add = (kind, where, answer, stem) => {
		const a = stemText(answer);
		const t = stemText(stem);
		if (!a || !t || stemFold(t).indexOf(stemFold(a)) !== -1) return;
		if (!kinds.has(kind)) kinds.set(kind, new Map());
		const byStem = kinds.get(kind);
		const f = stemFold(t);
		if (!byStem.has(f)) byStem.set(f, []);
		byStem.get(f).push({ where, answer: a, stem: t });
	};
	const dishes = house.dishes || [];
	for (const d of dishes) {
		const lines = keptStem(d.lines) || {};
		add('lineToDish', `dish ${d.name} lines`, d.name, lines.s10);
		add('lineToDish', `dish ${d.name} lines`, d.name, lines.s20);
		const parts = keptStem(d.parts) || {};
		for (const k of ['sauce', 'sides']) {
			add(k === 'sauce' ? 'sauceOf' : 'sidesOf', `dish ${d.name} parts.${k}`, d.name, parts[k]);
			if (FILLER_PART.test(stemText(parts[k]))) out.push(`dish ${d.name} parts.${k} is filler a drill cannot ask: "${parts[k]}"; say what it is or leave it empty`);
		}
	}
	for (const t of house.lexicon || []) {
		add('termToGuest', `term ${t.term} toGuest`, t.term, keptStem(t.toGuest));
		add('sayIt', `term ${t.term} say`, t.term, keptStem(t.say));
	}
	for (const list of ['dishes', 'wines', 'cocktails']) for (const r of house[list] || []) add('sayIt', `${list} ${r.name} say`, r.name, keptStem(r.say));
	for (const w of house.wines || []) add('wineGoesWith', `wine ${w.name} goesWith`, w.name, keptStem(w.goesWith));
	for (const c of house.cocktails || []) {
		add('cocktailSpec', `cocktail ${c.name} spec`, c.name, (c.spec || []).map(stemText).filter(Boolean).join(', '));
		if (/[()]|\bconfirm\b/i.test(stemText(c.glass))) out.push(`cocktail ${c.name} glass is a drill answer and carries a parenthesis or a confirm: "${c.glass}"; leave it empty until the bar confirms it`);
	}
	for (const [kind, byStem] of kinds) for (const [, hits] of byStem) {
		const answers = new Set(hits.map((h) => stemFold(h.answer)));
		if (answers.size > 1) out.push(`${kind}: one stem on ${hits.map((h) => h.where).join(' and ')}: "${hits[0].stem}"`);
	}
	return out;
}

/* Where a guest sits decides what can be poured: the dining room at breakfast and lunch (the
   breakfast tasting with it), the dining room at dinner (the dinner tasting with it), and the bar
   (the Roost Bar and Lounge, where the luxury list is poured exclusively, and Bubbles at Brennan's,
   held in the Roost and the courtyard). A drink's upsells are the next round for the guest in the
   same seat, so every sitting the drink is poured at must pour each upsell too. */
const SITTING = { 'Breakfast & lunch': 'breakfast', 'Breakfast tasting': 'breakfast', Dinner: 'dinner', 'Dinner tasting': 'dinner', 'Roost Bar & Lounge': 'bar', "Bubbles at Brennan's": 'bar' };
export function sittingsOf(meals) {
	const out = new Set();
	for (const m of meals || []) out.add(SITTING[m] || m);
	return out;
}
export function upsellRoomProblems(house) {
	const out = [];
	const byId = new Map((house.cocktails || []).map((c) => [c.id, c]));
	for (const c of house.cocktails || []) {
		const ups = keptStem(c.upsells) || [];
		const from = sittingsOf(c.meals);
		for (const id of ups) {
			const to = byId.get(id);
			if (!to) continue;
			const there = sittingsOf(to.meals);
			const missing = [...from].filter((s) => !there.has(s));
			if (missing.length) out.push(`cocktail ${c.name} upsells ${to.name}, which is not poured at ${missing.join(' or ')} where ${c.name} is`);
		}
	}
	return out;
}

/* The British spellings the research writes and the American forms the house's English wants, as
   whole words, each with its common endings. The list is explicit rather than a rule over every
   -ise or -our, because wise, noise, promise, hour and flour are not British. A capital first
   letter is kept. */
const BRITISH = [
	['litre', 'liter'], ['labelled', 'labeled'], ['labelling', 'labeling'], ['per cent', 'percent'],
	['centre', 'center'], ['centred', 'centered'], ['kilometre', 'kilometer'], ['metre', 'meter'],
	['apologise', 'apologize'], ['apologised', 'apologized'], ['apologises', 'apologizes'], ['apologising', 'apologizing'],
	['moralise', 'moralize'], ['moralising', 'moralizing'], ['favourite', 'favorite'], ['theatre', 'theater'],
	['programme', 'program'], ['organise', 'organize'], ['organised', 'organized'], ['organises', 'organizes'], ['organising', 'organizing'], ['organisation', 'organization'],
	['ageing', 'aging'], ['flavour', 'flavor'], ['flavourful', 'flavorful'], ['flavoured', 'flavored'], ['colour', 'color'], ['coloured', 'colored'],
	['savoury', 'savory'], ['honour', 'honor'], ['humour', 'humor'], ['labour', 'labor'], ['neighbour', 'neighbor'], ['behaviour', 'behavior'],
	['vigour', 'vigor'], ['rigour', 'rigor'], ['odour', 'odor'], ['harbour', 'harbor'], ['candour', 'candor'],
	['realise', 'realize'], ['realised', 'realized'], ['recognise', 'recognize'], ['recognised', 'recognized'],
	['caramelise', 'caramelize'], ['caramelised', 'caramelized'], ['specialise', 'specialize'], ['specialised', 'specialized'],
	['emphasise', 'emphasize'], ['emphasised', 'emphasized'], ['criticise', 'criticize'], ['prioritise', 'prioritize'], ['summarise', 'summarize'],
	['travelled', 'traveled'], ['travelling', 'traveling'], ['cancelled', 'canceled'], ['modelled', 'modeled'],
	['defence', 'defense'], ['licence', 'license'], ['practise', 'practice'], ['practised', 'practiced'],
	['mould', 'mold'], ['draught', 'draft'], ['grey', 'gray'], ['jewellery', 'jewelry'], ['sulphite', 'sulfite'], ['sulphur', 'sulfur'],
	['yoghurt', 'yogurt'], ['sceptical', 'skeptical'], ['catalogue', 'catalog'], ['aluminium', 'aluminum'], ['enquire', 'inquire'], ['enquiry', 'inquiry'],
	['whilst', 'while'], ['amongst', 'among'], ['storey', 'story'], ['tyre', 'tire'], ['kerb', 'curb'], ['cheque', 'check'],
	/* the forms the producer walk-through of 10 October 2026 found the map had missed, and their kin met in the
	   same pack; never 'gramme', which would cut the wine called Télégramme (a letter with an accent is no word
	   character to the boundary) */
	['reorganise', 'reorganize'], ['reorganised', 'reorganized'], ['reorganising', 'reorganizing'], ['reorganisation', 'reorganization'],
	['learnt', 'learned'], ['neighbourhood', 'neighborhood'], ['neighbouring', 'neighboring'],
	['dealcoholise', 'dealcoholize'], ['dealcoholised', 'dealcoholized'], ['amphitheatre', 'amphitheater'], ['botrytised', 'botrytized'],
	['caramelising', 'caramelizing'], ['recognising', 'recognizing'], ['chiselled', 'chiseled'], ['jewelled', 'jeweled'], ['shrivelled', 'shriveled'],
	['colouring', 'coloring'], ['favour', 'favor'], ['favoured', 'favored'], ['honoured', 'honored'], ['honouring', 'honoring'],
	['savour', 'savor'], ['vapour', 'vapor'], ['crystallise', 'crystallize'], ['crystallised', 'crystallized'],
	['fertilise', 'fertilize'], ['fertilised', 'fertilized'], ['fossilised', 'fossilized'], ['mechanised', 'mechanized'],
	['oxidise', 'oxidize'], ['oxidised', 'oxidized'], ['pasteurise', 'pasteurize'], ['pasteurised', 'pasteurized'],
	['popularise', 'popularize'], ['popularised', 'popularized'], ['pressurise', 'pressurize'], ['pressurised', 'pressurized']
];
const BRITISH_RE = new RegExp('\\b(' + BRITISH.map((b) => b[0]).join('|') + ')(s?)\\b', 'gi');
const AMERICAN = new Map(BRITISH);
/* The string with every British form above in its American spelling, and the forms it found. */
export function americanise(s) {
	if (typeof s !== 'string' || !s) return { out: s, found: [] };
	const found = [];
	const out = s.replace(BRITISH_RE, (m, word, plural, at, whole) => {
		const to = AMERICAN.get(word.toLowerCase());
		if (!to) return m;
		/* Earl Grey is a name, the tea's, and keeps its spelling wherever it is printed. */
		if (word.toLowerCase() === 'grey' && /\bEarl\s+$/i.test(whole.slice(0, at))) return m;
		found.push(word + plural);
		const cased = /^[A-Z]/.test(word) ? to.charAt(0).toUpperCase() + to.slice(1) : to;
		return cased + plural;
	});
	return { out, found };
}
/* The British forms a string still carries, for the gate. */
export function britishWords(s) {
	return americanise(s).found;
}

/* Every string in a value, with its path in the client's spelling. */
export function eachString(value, where, visit) {
	if (typeof value === 'string') { visit(where, value); return; }
	if (!value || typeof value !== 'object') return;
	if (Array.isArray(value)) { value.forEach((v, i) => eachString(v, where + '[' + i + ']', visit)); return; }
	for (const k of Object.keys(value)) eachString(value[k], where + '.' + k, visit);
}

/* The record a problem path points at, named for a reader: "dishes[3] Eggs Hussarde .lines.value.s45". */
export function describe(house, problemPath) {
	const m = problemPath.match(/^house\.(\w+)\[(\d+)\](.*)$/);
	if (!m) return problemPath.replace(/^house\./, '');
	const row = (house[m[1]] || [])[Number(m[2])];
	const name = row ? row.name || row.term || row.title || row.question || row.field || row.id : '?';
	return `${m[1]}[${m[2]}] ${name}${m[3]}`;
}

/* The proper-noun flags, each name looked for in the guide, the research and the page snapshots so
   a reader sees which were answered by a source and which were not. A say line's respelling writes
   its stressed syllable in capitals (KORS, SHOH-pan, TAT-in-jer); a word with a run of two or more
   capitals, flagged only in say lines, is that syllable and not a name, so it is answered as one. */
const RESPELLING = /[A-Z]{2,}/;
export function answerNames(problems) {
	const sources = [];
	if (fs.existsSync(GUIDE)) sources.push(fs.readFileSync(GUIDE, 'utf8'));
	/* Files only: research/deep-2026-10-03/ holds sweeps whose unverifiable and refuted records are
	   never a source, so a subdirectory is not read here. */
	if (fs.existsSync(RESEARCH)) for (const f of fs.readdirSync(RESEARCH)) { const p = path.join(RESEARCH, f); if (fs.statSync(p).isFile()) sources.push(fs.readFileSync(p, 'utf8')); }
	for (const f of pageFiles()) sources.push(fs.readFileSync(f, 'utf8'));
	const hay = sources.join('\n').replace(/\u2013/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2018\u2019]/g, "'").toLowerCase();
	const fold = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2018\u2019]/g, "'").toLowerCase();
	const names = new Map();
	for (const p of problems) {
		if (p.code !== 'proper-noun') continue;
		const m = p.said.match(/^the name (.+?) is nowhere in the house/);
		if (!m) continue;
		const name = m[1];
		const sayOnly = /\.say\.value$/.test(p.path) && RESPELLING.test(name);
		if (!names.has(name)) names.set(name, { name, count: 0, answered: false, respelling: true, where: [] });
		const r = names.get(name);
		if (!sayOnly) r.respelling = false;
		r.answered = hay.indexOf(fold(name)) >= 0 || hay.indexOf(fold(name.replace(/[\u2019']s?$/, ''))) >= 0 || r.respelling;
		r.count++;
		if (r.where.length < 3) r.where.push(p.path);
	}
	return [...names.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/* THE COACHING NOTES (docs/study-menus-design.md, sections 5.2 to 5.6). Every dish, drink and wine
   carries one kept note under ABOUT_Q, the description a master gives a new server, and the
   coaching notes under the fixed questions: every kind answers SELL_Q, ASK_Q and WATCH_Q, a wine
   answers POUR_Q too, a drink may, and a dish never does. The questions are matched character for
   character, so a wing's notesFor finds them; the word ranges are the design's. These rules run
   fatal in validate-pack and check-pack over the shipped edition only: a person's own note on a
   device is never refused. */
export const ABOUT_Q = 'Tell me about it.';
export const SELL_Q = 'How do I sell it?';
export const ASK_Q = 'What do guests ask?';
export const WATCH_Q = 'What should I watch for?';
export const POUR_Q = 'How do I pour it?';
export const COACH_ORDER = [SELL_Q, ASK_Q, WATCH_Q, POUR_Q];
export const FIXED_QS = [ABOUT_Q, ...COACH_ORDER];
export const NOTE_WORDS = { [ABOUT_Q]: [120, 200], [SELL_Q]: [50, 110], [ASK_Q]: [60, 140], [WATCH_Q]: [40, 110], [POUR_Q]: [40, 110] };
export const WATCH_CLOSE = 'Allergens: read the service note and confirm at lineup.';
/* The floors under the timed lines (a line under them is thin, section 5.4); the caps are the
   engine's LINE_CAPS. */
export const LINE_FLOORS = { s10: 12, s20: 25, s45: 60 };
const NOTE_WORD_RE = /[A-Za-z0-9\u00C0-\u024F'\u2019]+(?:-[A-Za-z0-9\u00C0-\u024F'\u2019]+)*/g;
export function words(s) {
	const m = typeof s === 'string' ? s.match(NOTE_WORD_RE) : null;
	return m ? m.length : 0;
}
/* The words no note may use (5.2), and the talk no note may hold: a note names what is on the plate
   and never rules on an allergen or a diet, so a sentence naming an allergen class or a diet must
   send the server to the service note, the kitchen or lineup, and a verdict is refused outright. */
export const BANNED_WORDS = /\b(delicious|amazing|perfect(ly)?|decadent|to die for|mouth-?watering|elevated|unique|world-class)\b/i;
const ALLERGEN_CLASS = /\b(allerg\w*|intoleran\w*|gluten|dairy|celiac|coeliac|lactose|tree nuts?|shellfish|vegan|vegetarian|sesame|soy)\b/i;
const ALLERGEN_POINTER = /service note|kitchen|lineup/i;
const VERDICT = /\b(gluten|dairy|nut|egg|allergen|shellfish|soy|sesame|lactose|meat)[- ]free\b|\bcontains no\b|\bsuitable for\b|\bsafe\b/i;
const sentencesOf = (s) => s.split(/(?<=[.!?][\u201D"]?)\s+|\n+/).filter((x) => x.trim());
const quotedSpans = (s) => [...s.matchAll(/[\u201C"]([^\u201D"]+)[\u201D"]/g)].map((m) => m[1]);
const foldName = (s) => s.normalize('NFD').replace(/[\u0300-\u036F]/g, '').replace(/[\u2018\u2019]/g, "'").toLowerCase();
const noteOf = (row, q) => (Array.isArray(row.kept) ? row.kept.filter((n) => n && n.q === q) : []);

/* The text the content gates read a note against: the guide, the page snapshots and every file at
   the top of research/ (the deep sweeps under research/deep-2026-10-03/ are left out, since their
   unverifiable and refuted records are never a source); noteProblems adds the house itself. */
export function noteHay() {
	const parts = [];
	if (fs.existsSync(GUIDE)) parts.push(fs.readFileSync(GUIDE, 'utf8'));
	for (const f of pageFiles()) parts.push(fs.readFileSync(f, 'utf8'));
	if (fs.existsSync(RESEARCH)) for (const f of fs.readdirSync(RESEARCH)) { const p = path.join(RESEARCH, f); if (fs.statSync(p).isFile()) parts.push(fs.readFileSync(p, 'utf8')); }
	return parts.join('\n');
}

/* The years and the names in one text that stand in no source: `folded` is the source text folded by
   foldName. Every year from 1600 to 2099 must be there, and every capitalised word that does not open
   a sentence, a quote or an Asked/Answer turn is a name that must be there too. Shared by the coaching
   notes and the components, so both are held to one rule. */
export function sourceProblems(a, folded) {
	const out = [];
	for (const y of a.match(/\b(1[6-9]\d\d|20\d\d)\b/g) || []) if (folded.indexOf(y) < 0) out.push(`the year ${y} is in no source`);
	const re = /(^|[\s(])([A-Z\u00C0-\u00DE][\w\u00C0-\u024F'\u2019.]*(?:[- ][A-Z\u00C0-\u00DE][\w\u00C0-\u024F'\u2019.]*)*)/g;
	for (const m of a.matchAll(re)) {
		const before = a.slice(0, m.index + m[1].length).replace(/\s+$/, '');
		if (!before || /[.!?:\u201C"(]$/.test(before) || /\n$/.test(a.slice(0, m.index + m[1].length))) continue;
		const name = m[2].replace(/[.'\u2019]+$/, '').replace(/[\u2019']s$/, '');
		if (name.length < 2 || /^(I|A|OK)$/.test(name)) continue;
		for (const piece of name.split(/[- ]/)) {
			const f = foldName(piece.replace(/[.,;:]+$/, '').replace(/[\u2019']s$/, '').replace(/[.'\u2019]+$/, ''));
			if (f.length < 2) continue;
			if (folded.indexOf(f) < 0) out.push(`the name ${piece} is in no source and not in the house`);
		}
	}
	return out;
}

/* The coaching-note problems of one shipped house, each a sentence naming the item and the rule.
   `hay` is noteHay() plus the house JSON; `onPage` is the engine's price rule. */
export function noteProblems(house, hay, onPage) {
	const out = [];
	/* The house's own words, its kept notes left out: a note must not vouch for itself. */
	const folded = foldName(hay + '\n' + JSON.stringify(house, (k, v) => (k === 'kept' ? undefined : v)));
	const required = { dishes: [SELL_Q, ASK_Q, WATCH_Q], cocktails: [SELL_Q, ASK_Q, WATCH_Q], wines: [SELL_Q, ASK_Q, WATCH_Q, POUR_Q] };
	for (const list of ['dishes', 'cocktails', 'wines']) for (const row of house[list] || []) {
		const at = `${list} ${row.name}`;
		const about = noteOf(row, ABOUT_Q);
		if (about.length !== 1) out.push(`${at}: ${about.length} notes under "${ABOUT_Q}", expected one`);
		for (const q of required[list]) if (noteOf(row, q).length !== 1) out.push(`${at}: ${noteOf(row, q).length} notes under "${q}", expected one`);
		if (list === 'dishes' && noteOf(row, POUR_Q).length) out.push(`${at}: a dish carries "${POUR_Q}"`);
		if (list === 'cocktails' && noteOf(row, POUR_Q).length > 1) out.push(`${at}: "${POUR_Q}" twice`);
		for (const n of row.kept || []) {
			if (!FIXED_QS.includes(n.q)) continue;
			const a = n.a;
			const w = words(a);
			const [lo, hi] = NOTE_WORDS[n.q];
			if (w < lo || w > hi) out.push(`${at} "${n.q}": ${w} words, the range is ${lo} to ${hi}`);
			if (BANNED_WORDS.test(a)) out.push(`${at} "${n.q}": the banned word "${a.match(BANNED_WORDS)[0]}"`);
			if (/[\u2013\u2014]|\s--\s|&[mn]dash;|&#821[12];/.test(a)) out.push(`${at} "${n.q}": a dash`);
			if (VERDICT.test(a)) out.push(`${at} "${n.q}": an allergen or diet verdict ("${a.match(VERDICT)[0]}")`);
			for (const s of sentencesOf(a)) if (ALLERGEN_CLASS.test(s) && !ALLERGEN_POINTER.test(s)) out.push(`${at} "${n.q}": names an allergen or a diet without sending the server to the service note or the kitchen: "${s.trim()}"`);
			for (const p of a.match(/\$\d+(?:\.\d+)?/g) || []) if (!onPage(hay, p)) out.push(`${at} "${n.q}": the price ${p} is printed nowhere in the guide or the page snapshots`);
			for (const p of sourceProblems(a, folded)) out.push(`${at} "${n.q}": ${p}`);
			if (n.q === SELL_Q) { const qs = quotedSpans(a); if (!qs.length || !qs.some((s) => words(s) <= 25)) out.push(`${at} "${n.q}": no quoted sentence to say of 25 words or fewer`); }
			if (n.q === POUR_Q) { const qs = quotedSpans(a); if (!qs.length || !qs.some((s) => words(s) <= 20)) out.push(`${at} "${n.q}": no quoted line to say while pouring of 20 words or fewer`); }
			if (n.q === WATCH_Q && !a.trim().endsWith(WATCH_CLOSE)) out.push(`${at} "${n.q}": does not close on "${WATCH_CLOSE}"`);
			if (n.q === ASK_Q) {
				const paras = a.split(/\n\n/).map((p) => p.trim()).filter(Boolean);
				const pairs = paras.length / 2;
				const shaped = paras.length % 2 === 0 && paras.every((p, i) => p.startsWith(i % 2 === 0 ? 'Asked: ' : 'Answer: '));
				if (!shaped || pairs < 2 || pairs > 3) out.push(`${at} "${n.q}": not two or three Asked and Answer pairs, each its own paragraph`);
			}
			if (n.q === ABOUT_Q && a.split(/\n\n/).filter((p) => p.trim()).length < 2) out.push(`${at} "${n.q}": one paragraph; the description is written in paragraphs`);
		}
	}
	/* The critic's two rules over the whole edition (5.5): no two descriptions open alike (the first
	   six words), and no sentence of six words or more in one "How do I sell it?" repeats in another. */
	const openings = new Map();
	const sells = new Map();
	for (const list of ['dishes', 'cocktails', 'wines']) for (const row of house[list] || []) {
		for (const n of noteOf(row, ABOUT_Q)) {
			const open = foldName(n.a).replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean).slice(0, 6).join(' ');
			if (openings.has(open)) out.push(`${list} ${row.name} "${ABOUT_Q}": opens as ${openings.get(open)} does ("${open}")`);
			else openings.set(open, row.name);
		}
		for (const n of noteOf(row, SELL_Q)) for (const s of sentencesOf(n.a)) {
			if (words(s) < 6) continue;
			const key = foldName(s).trim();
			if (sells.has(key) && sells.get(key) !== row.name) out.push(`${list} ${row.name} "${SELL_Q}": repeats a sentence of ${sells.get(key)}'s: "${s.trim()}"`);
			else sells.set(key, row.name);
		}
	}
	return out;
}

/* Every kept note under a fixed question, counted by question, for the gates' summary lines. */
export function noteCounts(house) {
	const out = Object.fromEntries(FIXED_QS.map((q) => [q, 0]));
	for (const list of ['dishes', 'cocktails', 'wines']) for (const row of house[list] || []) for (const n of row.kept || []) if (n.q in out) out[n.q]++;
	return out;
}

/* THE COMPONENT GATES, over the shipped edition only (a person's own edit on a device is never
   refused): every component reaches at least one item; its explanation runs 80 to 160 words in two or
   more paragraphs separated by a blank line; its card's front is 14 words or fewer and its back 20 to
   45; nothing in it carries a dash, a banned word or an allergen or diet verdict, and a sentence naming
   an allergen class or a diet sends the server to the service note, the kitchen or lineup (the fixed
   sentence COMPONENT_DIET_LINE does); every year and every name in the explanation and the card stands
   in a source (sourceProblems: the guide, the page snapshots, the top of research/ and the house, its
   kept notes, its components and its comparisons left out so none vouches for itself). Each item's
   comparisons: one or two, an in-app one before a classic, the label 8 words or fewer and same and
   different 30 or fewer, no dash, no banned word and no verdict. A component's producer profile is held
   by producerProblems below, with the explanation's own prose rule, and one behind a drink by the Ledger's
   living rule too (livingIn below, the names printed on the menu read past). */
export const COMPONENT_DIET_LINE = 'Dietary questions go to the service note and the kitchen.';
export function componentProblems(house, hay) {
	const out = [];
	const folded = foldName(hay + '\n' + JSON.stringify(house, (k, v) => (k === 'kept' || k === 'components' || k === 'compare' ? undefined : v)));
	const DASHED = /[\u2013\u2014]|\s--\s|&[mn]dash;|&#821[12];/;
	const prose = (at, text) => {
		if (DASHED.test(text)) out.push(`${at}: a dash`);
		if (BANNED_WORDS.test(text)) out.push(`${at}: the banned word "${text.match(BANNED_WORDS)[0]}"`);
		if (VERDICT.test(text)) out.push(`${at}: an allergen or diet verdict ("${text.match(VERDICT)[0]}")`);
		for (const s of sentencesOf(text)) if (ALLERGEN_CLASS.test(s) && !ALLERGEN_POINTER.test(s)) out.push(`${at}: names an allergen or a diet without sending the server to the service note or the kitchen: "${s.trim()}"`);
	};
	const kv = (m) => (m && typeof m === 'object' && 'value' in m ? m.value : undefined);
	for (const c of house.components || []) {
		const at = `component ${c.name}`;
		if (!Array.isArray(c.itemIds) || !c.itemIds.length) out.push(`${at}: reaches no item`);
		const explain = typeof kv(c.explain) === 'string' ? kv(c.explain) : '';
		const w = words(explain);
		if (w < 80 || w > 160) out.push(`${at}: the explanation is ${w} words, the range is 80 to 160`);
		if (explain.split(/\n\s*\n/).filter((p) => p.trim()).length < 2) out.push(`${at}: the explanation is one paragraph; it is written in paragraphs separated by a blank line`);
		const card = kv(c.card) || {};
		const fw = words(card.front);
		const bw = words(card.back);
		if (!fw || fw > 14) out.push(`${at}: the card's front is ${fw} words, at most 14`);
		if (bw < 20 || bw > 45) out.push(`${at}: the card's back is ${bw} words, the range is 20 to 45`);
		for (const [part, text] of [['explanation', explain], ['card front', card.front || ''], ['card back', card.back || ''], ['say', kv(c.say) || ''], ['name', c.name || '']]) {
			prose(`${at} ${part}`, String(text));
			if (part === 'explanation' || part.startsWith('card')) for (const p of sourceProblems(String(text), folded)) out.push(`${at} ${part}: ${p}`);
		}
	}
	/* The Ledger names nobody living: a profile whose component reaches a drink is held to the living rule too. */
	let living;
	try { living = livingRegex(livingNames()); } catch (e) { out.push(e.message); living = livingRegex(LIVING_FLOOR); }
	const drinkIds = new Set((house.cocktails || []).map((d) => d.id));
	const printed = ['dishes', 'cocktails', 'wines'].flatMap((l) => (house[l] || []).map((r) => r.name));
	for (const c of house.components || []) {
		const p = kv(c.producer);
		if (p === undefined) continue;
		const at = `component ${c.name} producer`;
		for (const problem of producerProblems(p, folded, (part, text) => prose(`${at} ${part}`, text))) out.push(`${at} ${problem}`);
		if ((c.itemIds || []).some((id) => drinkIds.has(id))) for (const [part, text] of producerStrings(p)) for (const name of livingIn(text, living, printed)) out.push(`${at} ${part}: ${LIVING_SAID(name)}`);
	}
	for (const list of ['dishes', 'cocktails', 'wines']) for (const r of house[list] || []) {
		const entries = kv(r.compare);
		if (entries === undefined) continue;
		const at = `${list} ${r.name} compare`;
		if (!Array.isArray(entries) || entries.length < 1 || entries.length > 2) { out.push(`${at}: one or two comparisons, read ${Array.isArray(entries) ? entries.length : 'none'}`); continue; }
		if (entries.length === 2 && entries[0].app === 'classic' && entries[1].app !== 'classic') out.push(`${at}: the in-app comparison comes first, the classic second`);
		entries.forEach((e, i) => {
			const lw = words(e.label);
			if (!lw || lw > 8) out.push(`${at}[${i}]: the label is ${lw} words, at most 8`);
			for (const k of ['same', 'different']) { const n = words(e[k]); if (!n || n > 30) out.push(`${at}[${i}]: ${k} is ${n} words, at most 30`); }
			for (const k of ['label', 'same', 'different']) prose(`${at}[${i}] ${k}`, String(e[k] || ''));
		});
	}
	return out;
}

/* THE PRODUCER GATE, over the shipped edition only, with component explain's treatment: the type one of
   the five and a who; the caps (PRODUCER_CAPS, the engine's PRODUCER_WORDS and PRODUCER_MAX); no dash,
   no banned word, no allergen or diet verdict, and a sentence naming an allergen class or a diet sends the
   server to the service note, the kitchen or lineup, in every string of the profile (through `prose`,
   componentProblems' own, which files its sentence itself); and every name and every year in it stands in
   a source (sourceProblems: the guide, the page snapshots and the files at the top of research/, the
   producer research among them, the house's components left out so none vouches for itself). The who and
   the where are names from their first word, so their first word is held too. Returns the rest of the
   problems, each a sentence naming the field. */
export const PRODUCER_TYPES = ['maker', 'farm', 'fishery', 'origin', 'house'];
export const PRODUCER_CAPS = { history: 300, fact: 35, note: 60, sayIt: 30, facts: 12, notes: 8, askKitchen: 6 };
export function producerProblems(p, folded, prose) {
	const out = [];
	if (!p || typeof p !== 'object' || Array.isArray(p)) return ['is not a record'];
	const str = (k) => (typeof p[k] === 'string' ? p[k] : '');
	const list = (k) => (Array.isArray(p[k]) ? p[k].filter((x) => typeof x === 'string') : []);
	if (!PRODUCER_TYPES.includes(p.type)) out.push(`type ${JSON.stringify(p.type)} is not one of ${PRODUCER_TYPES.join(', ')}`);
	if (!str('who').trim()) out.push('has no who');
	const cap = (at, text, n) => { const w = words(text); if (w > n) out.push(`${at}: ${w} words, at most ${n}`); };
	cap('history', str('history'), PRODUCER_CAPS.history);
	cap('sayIt', str('sayIt'), PRODUCER_CAPS.sayIt);
	list('facts').forEach((f, i) => cap(`facts[${i}]`, f, PRODUCER_CAPS.fact));
	list('notes').forEach((f, i) => cap(`notes[${i}]`, f, PRODUCER_CAPS.note));
	for (const k of ['facts', 'notes', 'askKitchen']) if (list(k).length > PRODUCER_CAPS[k]) out.push(`${k}: ${list(k).length}, at most ${PRODUCER_CAPS[k]}`);
	const strings = [['who', str('who')], ['where', str('where')], ['founded', str('founded')], ['history', str('history')], ['sayIt', str('sayIt')]];
	for (const k of ['facts', 'notes', 'askKitchen']) list(k).forEach((x, i) => strings.push([`${k}[${i}]`, x]));
	for (const [at, text] of strings) {
		if (!text) continue;
		/* A question in askKitchen is printed under Ask the kitchen on every screen, so it is read as sent
		   there: it may name what only the kitchen can answer, and a verdict in it is still refused. */
		prose(at, at.startsWith('askKitchen') ? 'Ask the kitchen: ' + text : text);
		for (const s of sourceProblems(at === 'who' || at === 'where' ? 'of ' + text : text, folded)) out.push(`${at}: ${s}`);
	}
	return out;
}

/* THE LEDGER NAMES NOBODY LIVING, over the producers behind a drink. A drink's producer is read in the
   Ledger, which names no living person: not a founder still alive, a current master distiller, an owner
   or a bartender; they are said by role (the founder, the current master distiller). The dead may be
   named. LIVING_FLOOR is the list the drink research met first and no file can shorten; living.json
   beside the fragments (an array of surnames, each a capitalised word or two) adds the names later
   research meets. livingRegex matches a name as a whole word, case as written. */
export const LIVING_FLOOR = ['Ralph', 'Patrick', 'Breaux', 'Zamanian', 'Gracie', 'Winters', 'Rupf', 'Murray', 'Guthrie', 'Barrileaux', 'Underhill', 'Kulsveen', 'Hauck', 'Berg', 'Livings', 'Hartmann', 'Branson', 'Kregar'];
const LIVING_NAME = /^[A-Z\u00C0-\u00DE][A-Za-z\u00C0-\u024F'\u2019]+(?:[ -][A-Z\u00C0-\u00DE][A-Za-z\u00C0-\u024F'\u2019]+)?$/;
export function livingNames(dir = componentsDir()) {
	const out = [...LIVING_FLOOR];
	const file = path.join(dir, LIVING_FILE);
	if (!fs.existsSync(file)) return out;
	let list;
	try { list = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { throw new Error(`${REL(file)}: does not parse as JSON (${e.message})`); }
	if (!Array.isArray(list)) throw new Error(`${REL(file)}: is a list of surnames, read ${typeof list}`);
	list.forEach((n, i) => {
		if (typeof n !== 'string' || !LIVING_NAME.test(n)) throw new Error(`${REL(file)}: [${i}] ${JSON.stringify(n)} is not a surname (a capitalised word, or two)`);
		if (!out.includes(n)) out.push(n);
	});
	return out;
}
export function livingRegex(names = livingNames()) {
	const esc = (n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp('(?<![\\p{L}\\p{N}])(' + names.map(esc).join('|') + ')(?![\\p{L}\\p{N}])', 'gu');
}
/* Every living name a text carries, each once, in the order met. `exempt` are the names printed on the
   menu (the pack's items: Ralph's Coffee is the drink's printed name), blanked before the text is read,
   with either apostrophe. */
export function livingIn(text, living = livingRegex(), exempt = []) {
	let t = String(text || '');
	for (const n of exempt) {
		const name = String(n || '');
		if (!name) continue;
		for (const form of new Set([name, name.replace(/\u2019/g, "'"), name.replace(/'/g, '\u2019')])) t = t.split(form).join(' '.repeat(form.length));
	}
	const out = [];
	for (const m of t.matchAll(new RegExp(living.source, 'gu'))) if (!out.includes(m[1])) out.push(m[1]);
	return out;
}
export const LIVING_SAID = (name) => `names a living person ("${name}"); the Ledger names nobody living, so say it by role (the founder, the current master distiller)`;

/* The prose of a producer profile, field by field, as [field, text]: who, where, founded, history, each
   fact, each note, sayIt and each question for the kitchen. */
export const PRODUCER_PROSE = ['who', 'where', 'founded', 'history', 'facts', 'notes', 'sayIt', 'askKitchen'];
export function producerStrings(p) {
	const out = [];
	if (!p || typeof p !== 'object' || Array.isArray(p)) return out;
	for (const k of PRODUCER_PROSE) {
		if (typeof p[k] === 'string') { if (p[k]) out.push([k, p[k]]); }
		else if (Array.isArray(p[k])) p[k].forEach((x, i) => { if (typeof x === 'string' && x) out.push([`${k}[${i}]`, x]); });
	}
	return out;
}

/* The producers in the fragments (readFragments' shape) whose component touches a drink: one a component
   naming a drink carries inline, and one a producers entry attaches by key to a component (in any fragment)
   that names a drink. `drinkNames` are the pack's cocktails, matched folded for case, accents and curly
   quotes. Each as { at, key, producer, drinks }. */
export function drinkProducers(frags, drinkNames) {
	const drinks = new Map([...drinkNames].map((n) => [foldName(String(n)), String(n)]));
	const drinksOf = (c) => (c && Array.isArray(c.items) ? c.items.filter((i) => drinks.has(foldName(String(i)))) : []);
	const byKey = new Map();
	for (const { v } of frags.components || []) if (v && typeof v.key === 'string' && !byKey.has(v.key)) byKey.set(v.key, v);
	const out = [];
	for (const { at, v } of frags.components || []) {
		if (!v || v.producer === undefined || !drinksOf(v).length) continue;
		out.push({ at: `${at} (${v.key}) producer`, key: v.key, producer: v.producer, drinks: drinksOf(v) });
	}
	for (const { at, v } of frags.producers || []) {
		const c = v && byKey.get(v.component);
		if (!c || !drinksOf(c).length) continue;
		out.push({ at: `${at} (${v.component}) producer`, key: v.component, producer: v.producer, drinks: drinksOf(c) });
	}
	return out;
}

/* The drink producers' prose held to the Ledger's rules: no living person named, no dash, no allergen or
   diet verdict, and a sentence naming an allergen class or a diet sends the server to the service note,
   the kitchen or lineup (a question under Ask the kitchen is read as sent there). `exempt` are the names
   printed on the menu, read past by the living rule. Each problem a sentence naming the fragment, the key
   and the field. A food producer is not read here. */
export function drinkProducerProblems(frags, drinkNames, living = livingRegex(), exempt = []) {
	const out = [];
	const DASHED = /[\u2013\u2014]|\s--\s|&[mn]dash;|&#821[12];|&#x201[34];/i;
	for (const { at, producer } of drinkProducers(frags, drinkNames)) {
		for (const [part, text] of producerStrings(producer)) {
			const here = `${at} ${part}`;
			for (const name of livingIn(text, living, exempt)) out.push(`${here}: ${LIVING_SAID(name)}`);
			if (DASHED.test(text)) out.push(`${here}: a dash; write it with a comma, a colon or a full stop`);
			const read = part.startsWith('askKitchen') ? 'Ask the kitchen: ' + text : text;
			if (VERDICT.test(read)) out.push(`${here}: an allergen or diet verdict ("${read.match(VERDICT)[0]}")`);
			for (const s of sentencesOf(read)) if (ALLERGEN_CLASS.test(s) && !ALLERGEN_POINTER.test(s)) out.push(`${here}: names an allergen or a diet without sending the server to the service note or the kitchen: "${s.trim()}"`);
		}
	}
	return out;
}

/* The thin lines of section 5.4, by code, each a sentence. Fatal in the gates once the edition
   answers them: a timed line under its floor, a dish guest line that restates the menu line, a
   wine part that copies the field the card prints in its own block, and a price in a profile. An
   empty part is reported and not refused (a part no source holds stays empty; a drill skips it). */
export function thinLines(house) {
	const fatal = [];
	const report = [];
	const kv = (m) => (m && typeof m === 'object' && 'value' in m ? m.value : undefined);
	const fold = (s) => foldName(String(s || '')).replace(/[^a-z0-9]+/g, ' ').trim();
	for (const list of ['dishes', 'cocktails', 'wines']) for (const r of house[list] || []) {
		const at = `${list} ${r.name}`;
		const L = kv(r.lines);
		if (L) for (const k of ['s10', 's20', 's45']) { const w = words(L[k]); if (w && w < LINE_FLOORS[k]) fatal.push(`${at}: short-${k.slice(1)}: lines.${k} is ${w} words, the floor is ${LINE_FLOORS[k]}`); }
		const P = kv(r.parts);
		if (P) { const empty = ['main', 'technique', 'sauce', 'sides', 'taste'].filter((k) => !String(P[k] || '').trim()); if (empty.length) report.push(`${at}: empty-part: ${empty.join(', ')}`); }
		if (list === 'dishes' && r.description && kv(r.guest)) {
			const g = fold(kv(r.guest)).split(' ');
			const d = new Set(fold(r.description).split(' '));
			const shared = g.filter((x) => d.has(x)).length / g.length;
			if (shared >= 0.8 && g.length - d.size <= 8) fatal.push(`${at}: menu-line: the guest line restates the menu line`);
		}
		if (list === 'wines' && P) {
			if (P.sauce && fold(kv(r.profile)).indexOf(fold(P.sauce)) >= 0) fatal.push(`${at}: dup-part: parts.sauce copies the profile`);
			if (P.sides && fold(kv(r.goesWith)).indexOf(fold(P.sides)) >= 0) fatal.push(`${at}: dup-part: parts.sides copies goesWith`);
			for (const k of Object.keys(P)) if (words(P[k]) > 14) fatal.push(`${at}: long-part: parts.${k} is ${words(P[k])} words; a wine's part is the short form, 14 or fewer`);
			if (/\$\d/.test(kv(r.profile) || '')) fatal.push(`${at}: price-in-profile: the profile carries a price`);
		}
	}
	return { fatal, report };
}
