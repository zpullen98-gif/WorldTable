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
   holds every later edition to the same rule. */
export const EDITION_BUILT_AT = '2026-10-04T01:30:00.000Z';
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
   the 7 Bubbles snacks (62); from the 01:30 edition of 4 October 2026, read against the owner's paste,
   32 drinks: the 4 signature drinks still printed, the 3 Luxury Roost Bar cocktails, the 2 premium
   Sazeracs, the Bloody Mary, the Champagne Cocktail, the 3 coffees and the juice, the 6 drinks of
   Billboard Songs from 1946 and the 2 of Temperance, 1946, the 3 dessert and 2 coffee cocktails and the
   4 Bubbles cocktails (6 of them zero-proof; the summer list's 8 are retired); 94 items with a formula
   in all; 34 wines (the guide's 20, the Barbera and the Argyle Brut by the glass, the 7 Birthday Bubbles
   bottles and the 5 Bubbles rosés); 2 tastings; 14 sources; at least 115 terms; at least 33 scenarios; 4 or more mix-ups; the
   must-knows; a lineup register of at least 60 questions; the 35 pairings; and the five disputes the
   plan names. */
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
	eq('cocktails', n('cocktails'), 32);
	eq('spirit-free cocktails', zero, 6);
	eq('dishes and cocktails in all', n('dishes') + n('cocktails'), 94);
	eq('wines', n('wines'), 34);
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
			for (const y of a.match(/\b(1[6-9]\d\d|20\d\d)\b/g) || []) if (folded.indexOf(y) < 0) out.push(`${at} "${n.q}": the year ${y} is in no source`);
			/* Every capitalised word that does not open a sentence, a quote or an Asked/Answer turn is a
			   name, and a name must stand in a source or the house. */
			const re = /(^|[\s(])([A-Z\u00C0-\u00DE][\w\u00C0-\u024F'\u2019.]*(?:[- ][A-Z\u00C0-\u00DE][\w\u00C0-\u024F'\u2019.]*)*)/g;
			for (const m of a.matchAll(re)) {
				const before = a.slice(0, m.index + m[1].length).replace(/\s+$/, '');
				if (!before || /[.!?:\u201C"(]$/.test(before) || /\n$/.test(a.slice(0, m.index + m[1].length))) continue;
				const name = m[2].replace(/[.'\u2019]+$/, '').replace(/[\u2019']s$/, '');
				if (name.length < 2 || /^(I|A|OK)$/.test(name)) continue;
				for (const piece of name.split(/[- ]/)) {
					const f = foldName(piece.replace(/[.,;:]+$/, '').replace(/[\u2019']s$/, '').replace(/[.'\u2019]+$/, ''));
					if (f.length < 2) continue;
					if (folded.indexOf(f) < 0) out.push(`${at} "${n.q}": the name ${piece} is in no source and not in the house`);
				}
			}
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
