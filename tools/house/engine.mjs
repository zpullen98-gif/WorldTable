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
   another for a fresh edition. */
export const EDITION_BUILT_AT = '2026-10-03T21:00:00.000Z';
export const EDITION_TS = Date.parse(EDITION_BUILT_AT);

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
		parts.push(text);
	}
	return parts.join('\n');
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
   the 7 Bubbles snacks (62); the guide's 5 signature drinks and 2 spirit-free drinks plus the 5 drinks
   of the 1946 list, the 3 Luxury Roost Bar cocktails, the 2 premium Sazeracs, the Bloody Mary, the
   Champagne Cocktail, the 3 coffees and the juice (23, of which 6 are zero-proof); 85 items with a
   formula in all; 20 wines; 2 tastings; 13 sources; at least 115 terms; at least 33 scenarios; 4 or
   more mix-ups; the must-knows; a lineup register of at least 60 questions; the 35 pairings; and the
   five disputes the plan names. */
export function countProblems(house) {
	const out = [];
	const n = (list) => (Array.isArray(house[list]) ? house[list].length : 0);
	const zero = (house.cocktails || []).filter((c) => c.zeroProof === true).length;
	const eq = (what, got, want) => { if (got !== want) out.push(`${what}: ${got}, expected ${want}`); };
	const ge = (what, got, want) => { if (got < want) out.push(`${what}: ${got}, expected at least ${want}`); };
	const inSection = (names) => (house.dishes || []).filter((d) => names.includes(d.section)).length;
	eq('dishes', n('dishes'), 62);
	eq("children's plates", inSection(CHILD_SECTIONS), 8);
	eq('Bubbles snacks', inSection([SNACK_SECTION]), 7);
	eq('cocktails', n('cocktails'), 23);
	eq('spirit-free cocktails', zero, 6);
	eq('dishes and cocktails in all', n('dishes') + n('cocktails'), 85);
	eq('wines', n('wines'), 20);
	eq('tastings', n('tastings'), 2);
	eq('sources', (house.sources || []).length, 13);
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
	['whilst', 'while'], ['amongst', 'among'], ['storey', 'story'], ['tyre', 'tire'], ['kerb', 'curb'], ['cheque', 'check']
];
const BRITISH_RE = new RegExp('\\b(' + BRITISH.map((b) => b[0]).join('|') + ')(s?)\\b', 'gi');
const AMERICAN = new Map(BRITISH);
/* The string with every British form above in its American spelling, and the forms it found. */
export function americanise(s) {
	if (typeof s !== 'string' || !s) return { out: s, found: [] };
	const found = [];
	const out = s.replace(BRITISH_RE, (m, word, plural) => {
		const to = AMERICAN.get(word.toLowerCase());
		if (!to) return m;
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
	if (fs.existsSync(RESEARCH)) for (const f of fs.readdirSync(RESEARCH)) sources.push(fs.readFileSync(path.join(RESEARCH, f), 'utf8'));
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
