#!/usr/bin/env node
/* check-parse.mjs: proves house/brennans/parsed.json against the guide's own figures.

   Asserts the counts (52 items, 47 dishes and 5 signature drinks; 20 wines),
   that every item carries three lines whose word counts, by the engine's
   wordCount, match the counts the guide prints within one word, that every
   pairing's wine and second choice name a wine on the by-the-glass list or
   among the tastings' pours and its step up names one loosely, that every
   FIRST PICK FOR name resolves to an item, and that no field is empty where
   the guide printed one. Principles outside the engine's nine are reported
   as notes for the builder, never as failures here: the parser keeps what the
   guide says.

   The engine (oot-house.js, a classic browser script) is loaded with node:vm
   into a context whose window has no indexedDB, and window.OOT.houseLib
   supplies wordCount and PRINCIPLES.

   Usage: node house/check-parse.mjs [--verbose]
   Runs from any directory. Exits 1 with the file and the rule on failure,
   prints one summary line on success. */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PARSED = path.join(HERE, 'brennans', 'parsed.json');
const ENGINE = path.join(HERE, '..', '..', 'static', 'shared', 'oot-house.js');
const REL = (p) => path.relative(process.cwd(), p) || p;

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
	console.log(`check-parse.mjs: prove ${REL(PARSED)} against the guide's figures, with ${REL(ENGINE)} for wordCount.

  --verbose   print every note as well as every failure
  --help      this text`);
	process.exit(0);
}
for (const a of args) if (!['--verbose'].includes(a)) fail(`${a.startsWith('-') ? 'unknown' : 'unexpected'} argument ${a}; see --help`);
const VERBOSE = args.includes('--verbose');

function fail(msg) {
	console.error('check-parse: ' + msg);
	process.exit(1);
}
if (!fs.existsSync(PARSED)) fail(`${REL(PARSED)}: missing; run parse-guide.mjs first`);
if (!fs.existsSync(ENGINE)) fail(`${REL(ENGINE)}: the engine is missing`);

/* The engine in a window with no indexedDB. */
function loadEngine() {
	const window = {};
	window.window = window;
	window.self = window;
	const ctx = vm.createContext({ window, console });
	vm.runInContext(fs.readFileSync(ENGINE, 'utf8'), ctx, { filename: ENGINE });
	const lib = window.OOT && window.OOT.houseLib;
	if (!lib || typeof lib.wordCount !== 'function') fail(`${REL(ENGINE)}: window.OOT.houseLib.wordCount is not there after the script ran`);
	return lib;
}
const lib = loadEngine();
const PRINCIPLES = (lib.constants && lib.constants.PRINCIPLES) || [];

const p = JSON.parse(fs.readFileSync(PARSED, 'utf8'));
const failures = [];
const notes = [];
const F = (where, rule) => failures.push(`${REL(PARSED)} ${where}: ${rule}`);
const N = (msg) => notes.push(msg);
const nonEmpty = (v) => (Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim() !== '');

/* ---------- counts ---------- */
const items = p.items || [];
const wines = p.wines || [];
const dishes = items.filter((x) => x.kind === 'dish');
const cocktails = items.filter((x) => x.kind === 'cocktail');
if (items.length !== 52) F('items', `${items.length} items, the guide carries 52`);
if (dishes.length !== 47) F('items', `${dishes.length} dishes, the guide carries 47`);
if (cocktails.length !== 5) F('items', `${cocktails.length} signature drinks, the guide carries 5`);
if (wines.length !== 20) F('wines', `${wines.length} wines, the guide carries 20`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(p.readOn || '')) F('readOn', `not a date: ${p.readOn}`);

/* ---------- names, once each ---------- */
const byName = new Map();
for (const it of items) {
	if (byName.has(it.name)) F(`item ${it.name}`, 'the name appears twice');
	byName.set(it.name, it);
}
const fold = (s) => s.replace(/[‘’]/g, '').replace(/\s+/g, ' ').trim();
const wineNames = new Set();
for (const w of wines) {
	wineNames.add(fold(w.name));
	if (w.price) wineNames.add(fold(`${w.name} ${w.price}`));
}
const wineWords = wines.map((w) => ({ name: w.name, words: new Set(fold(w.name).toLowerCase().replace(/[()]/g, '').split(' ')) }));
function looseWine(text) {
	const head = fold(text).split(/ by the glass| on Coravin| by Coravin|:/)[0].toLowerCase().replace(/[()]/g, '');
	const words = head.split(' ').filter(Boolean);
	if (!words.length) return null;
	return wineWords.find((w) => words.every((x) => w.words.has(x)));
}

/* ---------- every item ---------- */
const PAIRING_REQUIRED = ['wine', 'why', 'sayIt', 'whyThisWine', 'palate', 'principles', 'serve', 'avoid', 'zeroProof'];
const wordMismatches = [];
const outsidePrinciples = new Map();
for (const it of items) {
	const where = `item ${it.name} (line ${it.line})`;
	for (const key of ['name', 'section', 'menuLine', 'serviceNote']) if (!nonEmpty(it[key])) F(where, `${key} is empty`);
	if (!nonEmpty(it.meals)) F(where, 'no meal on the title line');
	if (!it.parts || !nonEmpty(it.parts.main) || !nonEmpty(it.parts.technique)) F(where, 'the parts table lacks a main ingredient or a technique');
	for (const key of ['s10', 's20', 's45']) {
		const line = it.lines && it.lines[key];
		const printed = it.lineWords && it.lineWords[key];
		if (!nonEmpty(line)) { F(where, `${key} is empty`); continue; }
		if (typeof printed !== 'number') { F(where, `${key} carries no printed word count`); continue; }
		const counted = lib.wordCount(line);
		const tokens = line.split(/\s+/).filter(Boolean).length;
		const dashes = (line.match(/(^|\s)[\u2014\u2013-](?=\s|$)/g) || []).length;
		if (Math.abs(counted - printed) > 1) wordMismatches.push({ name: it.name, key, printed, counted, tokens, dashes, line: it.line, explained: Math.abs(tokens - printed) <= 1 });
	}
	const pairingExpected = it.kind === 'dish' && it.section !== 'Sides';
	if (pairingExpected && !it.pairing) F(where, 'a dish outside the sides with no pairing block');
	if (!pairingExpected && it.pairing) N(`${where}: a pairing block where the guide prints none for ${it.kind === 'cocktail' ? 'a drink' : 'a side'}`);
	if (it.pairing) {
		const pr = it.pairing;
		for (const key of PAIRING_REQUIRED) if (!nonEmpty(pr[key])) F(where, `pairing.${key} is empty or absent`);
		for (const [key, val] of Object.entries(pr)) if (!nonEmpty(val)) F(where, `pairing.${key} is empty where the guide printed a label`);
		if (nonEmpty(pr.wine) && !wineNames.has(fold(pr.wine))) F(where, `pairing.wine names no wine on the list: ${pr.wine}`);
		if (nonEmpty(pr.second) && !wineNames.has(fold(pr.second))) F(where, `pairing.second names no wine on the list: ${pr.second}`);
		if (nonEmpty(pr.stepUp) && !looseWine(pr.stepUp)) F(where, `pairing.stepUp names no wine on the list: ${pr.stepUp}`);
		for (const pc of pr.principles || []) {
			if (!PRINCIPLES.includes(pc)) outsidePrinciples.set(pc, (outsidePrinciples.get(pc) || []).concat(it.name));
		}
	}
}
/* The guide counted whitespace tokens, so a spaced dash was a word to it; the engine's wordCount
   counts words only. A line whose token count matches the printed count within one word is
   explained, and the engine's own count is reported beside it for the builder, who strips the
   dashes anyway. A line that matches neither way fails. */
for (const m of wordMismatches) {
	if (m.explained) N(`item ${m.name}: ${m.key} prints ${m.printed}W, ${m.tokens} tokens, the engine counts ${m.counted} (${m.dashes} spaced dash${m.dashes === 1 ? '' : 'es'} the guide counted as words)`);
	else F(`item ${m.name} (line ${m.line})`, `${m.key} prints ${m.printed}W, the engine counts ${m.counted} and the line holds ${m.tokens} tokens`);
}
if (wordMismatches.length) N(`${wordMismatches.filter((m) => m.explained).length} lines differ from the printed count only by their spaced dashes; ${156 - wordMismatches.length} match the engine's count within one word`);

/* ---------- every wine ---------- */
const firstPickUnresolved = [];
for (const w of wines) {
	const where = `wine ${w.name} (line ${w.line})`;
	for (const key of ['group', 'name', 'grapesRegion', 'profile', 'sayIt', 'goesWith', 'serve']) if (!nonEmpty(w[key])) F(where, `${key} is empty`);
	for (const name of w.firstPickFor || []) if (!byName.has(name)) firstPickUnresolved.push({ wine: w.name, name, line: w.line });
}
for (const u of firstPickUnresolved) F(`wine ${u.wine} (line ${u.line})`, `FIRST PICK FOR names no item: ${u.name}`);
const priced = wines.filter((w) => w.price).length;
N(`${priced} wines carry a printed price, ${wines.length - priced} are tasting pours without one`);

/* ---------- section 5 ---------- */
for (const s of p.scenarios || []) for (const key of ['title', 'guest', 'you', 'principle']) if (!nonEmpty(s[key])) F(`scenario ${s.title} (line ${s.line})`, `${key} is empty`);
for (const m of p.mixUps || []) {
	for (const key of ['a', 'b', 'difference', 'ask']) if (!nonEmpty(m[key])) F(`mix-up ${m.a} vs. ${m.b} (line ${m.line})`, `${key} is empty`);
	for (const key of ['a', 'b']) if (nonEmpty(m[key]) && !byName.has(m[key])) F(`mix-up ${m.a} vs. ${m.b} (line ${m.line})`, `${key} names no item: ${m[key]}`);
}
for (const k of p.mustKnows || []) for (const key of ['title', 'body']) if (!nonEmpty(k[key])) F(`must-know ${k.title} (line ${k.line})`, `${key} is empty`);
for (const t of p.terms || []) for (const key of ['term', 'say', 'toGuest']) if (!nonEmpty(t[key])) F(`term ${t.term} (line ${t.line})`, `${key} is empty`);
for (const s of p.sources || []) {
	if (!(s.n > 0) || !nonEmpty(s.title) || !/^https?:\/\//.test(s.url || '')) F(`source ${s.n} (line ${s.line})`, 'number, title or URL is missing');
}
if ((p.unplaced || []).length) F('unplaced', `${p.unplaced.length} lines were unplaced`);

/* ---------- notes for the builder ---------- */
for (const [pc, names] of outsidePrinciples) N(`principle "${pc}" is outside the engine's nine (${PRINCIPLES.join(', ')}); printed on ${names.length}: ${names.join('; ')}`);
const zeroProofs = new Map();
for (const it of items) if (it.pairing && it.pairing.zeroProof) zeroProofs.set(it.pairing.zeroProof, (zeroProofs.get(it.pairing.zeroProof) || 0) + 1);
N(`zero-proof names: ${[...zeroProofs].map(([k, v]) => `${k} (${v})`).join(', ')}`);
const stepUps = items.filter((x) => x.pairing && x.pairing.stepUp).length;
const seconds = items.filter((x) => x.pairing && x.pairing.second).length;
N(`${items.filter((x) => x.pairing).length} pairings, ${seconds} with a second choice, ${stepUps} with a step up`);

/* ---------- the verdict ---------- */
const counts = `${items.length} items (${dishes.length} dishes, ${cocktails.length} drinks), ${wines.length} wines, ${(p.scenarios || []).length} scenarios, ${(p.mixUps || []).length} mix-ups, ${(p.mustKnows || []).length} must-knows, ${(p.terms || []).length} terms, ${(p.sources || []).length} sources`;
if (VERBOSE || failures.length) for (const n of notes) console.log('check-parse: note: ' + n);
if (failures.length) {
	for (const f of failures) console.error('check-parse: ' + f);
	console.error(`check-parse: ${failures.length} failure${failures.length === 1 ? '' : 's'}; ${counts}`);
	process.exit(1);
}
console.log(`check-parse: ${REL(PARSED)} holds: ${counts}; every line within one word of its printed count by the guide's own counting; every pairing and first pick resolves`);
