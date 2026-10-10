#!/usr/bin/env node
/* Checks components/drinks.json, the master bartender's fragment: valid JSON in the fragment shape, every item and
   term name in the pack, every in-app compare ref in the real data, the word caps, no dash, the note gates
   (banned words, allergen verdicts, years and names in a source), and every drink with components and a compare.
   Then the producers behind a drink, wherever they are filed (producers.json, or inline on a component, in this
   fragment or another beside it): every profile whose component, new or attached by key, names a drink is held
   to the Ledger's living rule, the dash rule and the allergen rule in its who, where, founded, history, facts,
   notes, sayIt and askKitchen (engine.mjs drinkProducerProblems). A food producer is not read here.
   The living names are engine.mjs LIVING_FLOOR and living.json beside the fragments (an array of surnames).
   The fragments beside this one are read from engine.mjs componentsDir (this folder, or BRENNANS_COMPONENTS).
   Usage: node check-drinks.mjs [path/to/fragment.json]. Exits 1 with each problem named. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { noteHay, words, BANNED_WORDS, REL, componentsDir, readFragments, livingNames, livingRegex, livingIn, drinkProducers, drinkProducerProblems, LIVING_SAID } from '../../engine.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
if (process.argv.includes('--help')) { console.log('node check-drinks.mjs [fragment.json]  checks the drink components fragment, then every producer behind a drink in the fragments beside it (the living, dash and allergen rules; living.json adds surnames)'); process.exit(0); }
const FILE = process.argv[2] || path.join(HERE, 'drinks.json');
const FRAGS = componentsDir();
const WT = path.resolve(HERE, '../../../..');
const PACK = path.join(WT, 'static/shared/packs/brennans-new-orleans.v1.oothouse.json');
const LEDGER = process.env.LEDGER_SRC || path.resolve(WT, '../bartendersledger');
const CODEX = process.env.CODEX_SRC || path.resolve(WT, '../sommelierscodex');

const out = [];
const bad = (m) => out.push(m);
const house = JSON.parse(fs.readFileSync(PACK, 'utf8')).house;
const dishNames = new Set(house.cocktails.map((d) => d.name));
const allItems = new Set([...house.dishes, ...house.cocktails, ...house.wines].map((d) => d.name));
const termNames = new Set(house.lexicon.map((t) => t.term));

const recipes = new Set(JSON.parse(fs.readFileSync(path.join(WT, 'src/lib/data/recipes.index.json'), 'utf8')).map((r) => r.slug));
const techniques = new Set(JSON.parse(fs.readFileSync(path.join(WT, 'src/lib/data/techniques.json'), 'utf8')).map((t) => t.slug));
function load(files, expr) {
	const ctx = { window: {}, console: { log() {}, warn() {} } };
	vm.createContext(ctx);
	for (const f of files) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
	return vm.runInContext(expr, ctx);
}
const cocktails = new Set(load([path.join(LEDGER, 'js/data-core.js')], 'COCKTAILS').map((c) => c.name));
const codex = load(['reference.js', 'data-grapes-plus.js', 'data-producers.js', 'data-primers.js'].map((f) => path.join(CODEX, 'js', f)),
	'({ g: GRAPES.map(x => x.g).concat(GRAPES_PLUS.map(x => x.g)), p: WINE_PRODUCERS.map(x => x.p), c: PRIMERS.map(x => x.cat) })');
const codexRefs = new Set([...codex.g, ...codex.p, ...codex.c, ...house.wines.map((w) => w.name)]);

const raw = fs.readFileSync(FILE, 'utf8');
if (/[\u2013\u2014]|&[mn]dash;|&#821[12];|&#x201[34];|\s--\s/i.test(raw)) bad('the file carries a dash (U+2013, U+2014, an entity or a spaced double hyphen)');
let frag;
try { frag = JSON.parse(raw); } catch (e) { console.error(`${FILE}: not valid JSON: ${e.message}`); process.exit(1); }

const hay = (noteHay() + '\n' + JSON.stringify(house)).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[‘’]/g, "'").toLowerCase();
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[‘’]/g, "'").toLowerCase();
const ALLERGEN_CLASS = /\b(allerg\w*|intoleran\w*|gluten|dairy|celiac|coeliac|lactose|tree nuts?|shellfish|vegan|vegetarian|sesame|soy)\b/i;
const ALLERGEN_POINTER = /service note|kitchen|lineup|chef/i;
const VERDICT = /\b(gluten|dairy|nut|egg|allergen|shellfish|soy|sesame|lactose|meat)[- ]free\b|\bcontains no\b|\bsuitable for\b|\bsafe\b|\bhealthy\b|\bhealthier\b|\bgood for you\b/i;
const sentencesOf = (s) => s.split(/(?<=[.!?][”"]?)\s+|\n+/).filter((x) => x.trim());
const AMERICAN = /\b(flavor|flavors|flavored|color|colors|colored|savory|favorite|honor|honored|center|centered|caramelize[sd]?|caramelizing|caramelized|fiber|gray|organize[sd]?|neighbor|labor|odor|humor|theater)\b(?![\u00C0-\u024F])/i;

/* The Ledger names nobody living: the living people met in the research (engine.mjs LIVING_FLOOR and living.json
   beside the fragments), refused anywhere in the drink prose and in a drink producer's. */
let LIVING_NAMES;
try { LIVING_NAMES = livingNames(FRAGS); } catch (e) { console.error(e.message); process.exit(1); }
const LIVING = livingRegex(LIVING_NAMES);
const printed = [...allItems];
function textGates(at, s) {
	for (const name of livingIn(s, LIVING, printed)) bad(`${at}: ${LIVING_SAID(name)}`);
	if (BANNED_WORDS.test(s)) bad(`${at}: the banned word "${s.match(BANNED_WORDS)[0]}"`);
	if (VERDICT.test(s)) bad(`${at}: a verdict or health claim ("${s.match(VERDICT)[0]}")`);
	for (const t of sentencesOf(s)) if (ALLERGEN_CLASS.test(t) && !ALLERGEN_POINTER.test(t)) bad(`${at}: names an allergen or diet without sending the server to the kitchen: "${t.trim()}"`);
	for (const y of s.match(/\b(1[0-9]\d\d|20\d\d)\b/g) || []) if (hay.indexOf(y) < 0) bad(`${at}: the year ${y} is in no source`);
	for (const p of s.match(/\$\d+(?:\.\d+)?/g) || []) if (hay.indexOf(p) < 0) bad(`${at}: the price ${p} is printed nowhere`);
	const am = s.match(AMERICAN); if (am) bad(`${at}: American spelling "${am[0]}"`);
	const re = /(^|[\s(])([A-ZÀ-Þ][\wÀ-ɏ'’.]*(?:[- ][A-ZÀ-Þ][\wÀ-ɏ'’.]*)*)/g;
	for (const m of s.matchAll(re)) {
		const before = s.slice(0, m.index + m[1].length).replace(/\s+$/, '');
		if (!before || /[.!?:“"(]$/.test(before) || /\n$/.test(s.slice(0, m.index + m[1].length))) continue;
		const name = m[2].replace(/[.'’]+$/, '').replace(/[’']s$/, '');
		if (name.length < 2 || /^(I|A|OK)$/.test(name)) continue;
		for (const piece of name.split(/[- ]/)) {
			const f = fold(piece.replace(/[.,;:]+$/, '').replace(/[’']s$/, '').replace(/[.'’]+$/, ''));
			if (f.length >= 2 && hay.indexOf(f) < 0) bad(`${at}: the name ${piece} is in no source and not in the house`);
		}
	}
}

/* Keys across every fragment present, so a key stays unique across the four files. */
const otherKeys = new Map();
for (const f of ['dishes.json', 'wines.json', 'videos.json']) {
	const p = path.join(FRAGS, f);
	if (path.resolve(p) === path.resolve(FILE) || !fs.existsSync(p)) continue;
	try { for (const c of JSON.parse(fs.readFileSync(p, 'utf8')).components || []) otherKeys.set(c.key, f); } catch { /* another author's file mid-write */ }
}

const comps = frag.components || [];
if (!Array.isArray(comps) || !comps.length) bad('no components');
const keys = new Set();
const perItem = new Map();
const kinds = { ingredient: 0, technique: 0, story: 0 };
for (const c of comps) {
	const at = `component ${c.key || '(no key)'}`;
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.key || '')) bad(`${at}: key is not a lowercase ascii slug`);
	if (keys.has(c.key)) bad(`${at}: key used twice`);
	if (otherKeys.has(c.key)) bad(`${at}: key also used in ${otherKeys.get(c.key)}`);
	keys.add(c.key);
	if (!(c.kind in kinds)) bad(`${at}: kind ${c.kind}`); else kinds[c.kind]++;
	if (!c.name || typeof c.name !== 'string') bad(`${at}: no name`);
	if (typeof c.say !== 'string') bad(`${at}: say is not a string`);
	const ex = c.explain || '';
	const w = words(ex);
	if (w < 80 || w > 160) bad(`${at}: explain is ${w} words, the range is 80 to 160`);
	if (ex.split(/\n\n/).filter((p) => p.trim()).length < 2) bad(`${at}: explain is one paragraph`);
	if (/\n(?!\n)/.test(ex.replace(/\n\n/g, ''))) bad(`${at}: explain has a single line break`);
	const fw = words(c.card?.front), bw = words(c.card?.back);
	if (!fw || fw > 14) bad(`${at}: card front is ${fw} words, at most 14`);
	if (bw < 20 || bw > 45) bad(`${at}: card back is ${bw} words, the range is 20 to 45`);
	if (!Array.isArray(c.items) || !c.items.length) bad(`${at}: no items`);
	for (const i of c.items || []) {
		if (!allItems.has(i)) bad(`${at}: item "${i}" is not in the pack`);
		else if (!dishNames.has(i)) bad(`${at}: item "${i}" is not a drink`);
		perItem.set(i, (perItem.get(i) || 0) + 1);
	}
	for (const t of c.terms || []) if (!termNames.has(t)) bad(`${at}: term "${t}" is not a pack lexicon term`);
	if (!Array.isArray(c.terms)) bad(`${at}: terms is not an array`);
	if (!Array.isArray(c.sources) || !c.sources.length) bad(`${at}: no sources`);
	textGates(`${at} explain`, ex);
	textGates(`${at} card front`, c.card?.front || '');
	textGates(`${at} card back`, c.card?.back || '');
}

const compared = new Set();
for (const row of frag.compare || []) {
	const at = `compare ${row.item}`;
	if (!dishNames.has(row.item)) bad(`${at}: not a pack drink`);
	if (compared.has(row.item)) bad(`${at}: compared twice`);
	compared.add(row.item);
	const es = row.entries || [];
	if (es.length < 1 || es.length > 2) bad(`${at}: ${es.length} entries, one or two`);
	if (es.length === 2 && es[0].app === 'classic' && es[1].app !== 'classic') bad(`${at}: classic before an in-app match`);
	for (const e of es) {
		const ok = e.app === 'table' ? recipes.has(e.ref) || techniques.has(e.ref)
			: e.app === 'ledger' ? cocktails.has(e.ref)
			: e.app === 'codex' ? codexRefs.has(e.ref)
			: e.app === 'classic' ? e.ref === '' : false;
		if (!ok) bad(`${at}: ref "${e.ref}" does not resolve in ${e.app}`);
		if (!e.label || words(e.label) > 8) bad(`${at}: label is ${words(e.label)} words, at most 8`);
		for (const k of ['same', 'different']) {
			if (!e[k] || words(e[k]) > 30) bad(`${at}: ${k} is ${words(e[k])} words, at most 30`);
			textGates(`${at} ${k}`, e[k] || '');
		}
		textGates(`${at} label`, e.label || '');
	}
}
for (const d of dishNames) {
	if (!perItem.get(d)) bad(`drink ${d}: no components`);
	if (!compared.has(d)) bad(`drink ${d}: no compare`);
}

/* The producers behind a drink: every fragment in the folder, this file standing in for its drinks.json. */
let all = { components: [], producers: [] };
try { all = readFragments(FRAGS); } catch (e) { bad(`the producers cannot be read: ${e.message}`); }
const mine = new Set([path.resolve(FILE), path.resolve(FRAGS, 'drinks.json')]);
const own = (k) => (Array.isArray(frag[k]) ? frag[k] : []).map((v, i) => ({ file: FILE, at: `${REL(FILE)} ${k}[${i}]`, v }));
const frags = {
	components: [...all.components.filter((x) => !mine.has(path.resolve(x.file))), ...own('components')],
	producers: [...all.producers.filter((x) => !mine.has(path.resolve(x.file))), ...own('producers')]
};
const behind = drinkProducers(frags, dishNames);
for (const m of drinkProducerProblems(frags, dishNames, LIVING, printed)) bad(m);

const fewest = [...dishNames].map((d) => [d, perItem.get(d) || 0]).sort((a, b) => a[1] - b[1]).slice(0, 10);
console.log(`components ${comps.length}: ingredient ${kinds.ingredient}, technique ${kinds.technique}, story ${kinds.story}; compares ${compared.size}`);
console.log(`drink producers ${behind.length}${behind.length ? ': ' + behind.map((b) => b.key).join(', ') : ''}; living names refused ${LIVING_NAMES.length}`);
console.log('fewest: ' + fewest.map(([d, n]) => `${d} ${n}`).join('; '));
if (out.length) { for (const m of out) console.error(m); console.error(`${out.length} problems`); process.exit(1); }
console.log('drinks.json: every check passes');
