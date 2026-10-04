#!/usr/bin/env node
/* check-winelist.mjs: the gate that holds the whole bottle list file,
   static/shared/packs/brennans-new-orleans.winelist.v1.json (written by build-winelist.mjs).

   It proves, in order:
     1. the file parses, is format 'oot-winelist' version 1, and is under 1.5 MB;
     2. every entry is the catalogue's: one entry per catalogue entry, in catalogue order, each with
        the catalogue's bin, name, vintage, size, flags and grape, at its printed price, and that price
        printed on its own line of the paste within a few lines of where the catalogue read the entry;
        the name is the catalogue's less the paste's format tail, and every entry under Half-bottles
        is 375ml;
     3. every entry's place starts with its own catalogue section, and every section and every place
        an entry names has a title and a line;
     4. every entry names a producer the file describes, with a name, a line and a tell;
     5. no string anywhere carries a dash of any spelling (the engine's hasDash, the en dash too);
     6. no producer or place prose speaks of allergens or diets (a description is about who makes the
        wine and where, never what is in the glass for a guest's health);
     7. every whole card (cards, n to a wine id) is a pack wine on the bottle list whose bin, vintage
        and size are that catalogue entry's.

   Usage: node tools/house/check-winelist.mjs [--file <list>] [--pack <file>] [--catalogue <file>] [--bins]
   Runs from any directory. Exits 1 with the file and the rule on failure, one line on success. No
   dash of any spelling in this file. */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { CATALOGUE, HALF_SECTION, OUT, PACK, WINELIST_FORMAT, WINELIST_VERSION, flagsOf, foldSize, listName, sectionOfPlace, sharedBins } from './build-winelist.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ENGINE = path.join(HERE, '..', '..', 'static', 'shared', 'oot-house.js');
export const MAX_BYTES = 1.5 * 1024 * 1024;
const REL = (p) => { const r = path.relative(process.cwd(), p); return !r ? p : r.startsWith('..') ? p : r; };

/* The talk no description may hold: an allergen or a diet, named or ruled on, or a fining agent
   (which is a diet claim by the back door). Sulphites are an allergen, so "low sulphur" or "no added
   sulphites" is a claim about what is in the glass and is refused with the rest. A dish a wine goes
   with is not allergen talk: "lovely with shellfish" names food, so the foods themselves are not
   listed here. */
export const ALLERGEN_PROSE = /\b(allerg\w*|intoleran\w*|gluten|dairy|lactose|celiac|coeliac|vegan\w*|vegetarian\w*|sulph\w*|sulfit\w*|sulfur\w*|histamin\w*|egg whites?|isinglass|casein|\w+[- ]free)\b/i;
const EN_DASH = String.fromCharCode(0x2013);

function loadDash() {
	if (!fs.existsSync(ENGINE)) return null;
	const window = {};
	window.window = window;
	window.self = window;
	vm.runInContext(fs.readFileSync(ENGINE, 'utf8'), vm.createContext({ window, console }), { filename: ENGINE });
	const lib = window.OOT && window.OOT.houseLib;
	return lib && typeof lib.hasDash === 'function' ? lib.hasDash : null;
}

function eachString(v, where, visit) {
	if (typeof v === 'string') { visit(where, v); return; }
	if (!v || typeof v !== 'object') return;
	if (Array.isArray(v)) { v.forEach((x, i) => eachString(x, where + '[' + i + ']', visit)); return; }
	for (const k of Object.keys(v)) { visit(where + ' key', k); eachString(v[k], where + '.' + k, visit); }
}

/**
 * Every problem with a list, as sentences. `text` is the file's text, `catalogue` the parsed catalogue,
 * `page` the paste's text (or '' to skip the page check), `pack` the parsed pack or null, `hasDash`
 * the engine's dash rule.
 */
export function winelistProblems(text, catalogue, page, pack, hasDash) {
	const out = [];
	const bytes = Buffer.byteLength(text);
	if (bytes >= MAX_BYTES) out.push(`the file is ${bytes} bytes; the cap is ${MAX_BYTES}`);
	let list;
	try { list = JSON.parse(text); } catch (err) { out.push(`does not parse as JSON (${err.message})`); return out; }
	if (!list || list.format !== WINELIST_FORMAT || list.version !== WINELIST_VERSION) out.push(`format ${list && list.format} version ${list && list.version}; expected ${WINELIST_FORMAT} version ${WINELIST_VERSION}`);
	const cat = Array.isArray(catalogue && catalogue.entries) ? catalogue.entries : [];
	const entries = Array.isArray(list.entries) ? list.entries : [];
	const sections = Array.isArray(list.sections) ? list.sections : [];
	const producers = list.producers && typeof list.producers === 'object' ? list.producers : {};
	const places = list.places && typeof list.places === 'object' ? list.places : {};
	const cards = list.cards && typeof list.cards === 'object' ? list.cards : {};
	const lines = page ? page.split('\n') : [];
	if (list.house !== catalogue.house || list.readOn !== catalogue.readOn || list.source !== catalogue.source) out.push(`house, readOn and source must be the catalogue's (${catalogue.house}, ${catalogue.readOn}, ${catalogue.source})`);

	/* 2. the catalogue, entry by entry */
	const want = [];
	for (const e of cat) if (!want.includes(e.section)) want.push(e.section);
	if (JSON.stringify(sections) !== JSON.stringify(want)) out.push(`sections are not the catalogue's ${want.length} in printed order`);
	if (entries.length !== cat.length) out.push(`${entries.length} entries; the catalogue holds ${cat.length}`);
	const byN = new Map(cat.map((e) => [e.n, e]));
	const seen = new Set();
	let off = 0;
	const say = (msg) => { off++; if (off <= 30) out.push(msg); };
	entries.forEach((r, i) => {
		if (!Array.isArray(r) || r.length < 9 || r.length > 10) { say(`entries[${i}] is not [n, place, bin, name, vintage, price, size, producer, flags, grape?]`); return; }
		const [n, place, bin, name, vintage, price, size, pk, flags, grape] = r;
		const e = byN.get(n);
		if (!e) { say(`entries[${i}]: ${n} is no catalogue entry`); return; }
		if (seen.has(n)) say(`entry ${n} is listed twice`);
		seen.add(n);
		if (cat[i] && cat[i].n !== n) say(`entries[${i}] is ${n}; the catalogue has ${cat[i].n} there`);
		if (bin !== String(e.bin || '') || name !== listName(e) || vintage !== String(e.vintage || '') || size !== String(e.size || '')) say(`entry ${n}: bin, name, vintage or size is not the catalogue's (${e.bin} ${listName(e)} ${e.vintage} ${e.size})`);
		if (typeof name === 'string' && /•/.test(name)) say(`entry ${n}: the name ${name} keeps the paste's bullet tail; the size is its own field`);
		if (e.section === HALF_SECTION && foldSize(size) !== '375ml') say(`entry ${n} (${name}): listed under ${HALF_SECTION} at ${size}; every entry there is a 375ml half bottle`);
		if (price !== e.price) say(`entry ${n} (${e.name}): the price ${price} is not the catalogue's ${e.price}`);
		if (flags !== flagsOf(e)) say(`entry ${n}: flags ${flags}; the catalogue gives ${flagsOf(e)}`);
		if ((grape || '') !== String(e.grape || '')) say(`entry ${n}: grape ${grape}; the catalogue gives ${e.grape || 'none'}`);
		if (lines.length) {
			const at = Number(e.line) || 0;
			const window = lines.slice(Math.max(0, at - 1), at + 6).map((l) => l.trim());
			if (!window.includes(String(e.price))) say(`entry ${n} (${e.name}): the price ${e.price} is not printed on its own line near line ${at} of the paste`);
		}
		/* 3. its place */
		if (typeof place !== 'string' || sectionOfPlace(place, sections) !== e.section) say(`entry ${n}: the place ${place} does not belong to its section ${e.section}`);
		if (!places[place]) say(`entry ${n}: the place ${place} is not described`);
		/* 4. its producer */
		const p = producers[pk];
		if (!pk || !p) say(`entry ${n} (${e.name}): no described producer${pk ? ' (' + pk + ')' : ''}`);
		else if (![p.name, p.line, p.tell].every((s) => typeof s === 'string' && s.trim())) say(`entry ${n}: the producer ${pk} lacks a name, a line or a tell`);
	});
	if (off > 30) out.push(`and ${off - 30} more entry problems (${off} in all)`);
	for (const s of sections) if (!places[s] || !String(places[s].line || '').trim() || !String(places[s].title || '').trim()) out.push(`the section ${s} has no title and line`);
	for (const [k, v] of Object.entries(places)) if (!v || !String(v.title || '').trim() || !String(v.line || '').trim()) out.push(`the place ${k} has no title or no line`);

	/* 5. no dash anywhere; 6. no allergen talk in the prose */
	let dashes = 0;
	eachString(list, 'list', (where, s) => {
		if ((hasDash && hasDash(s)) || s.includes(EN_DASH) || s.includes(String.fromCharCode(0x2014))) { dashes++; if (dashes <= 10) out.push(`${where} carries a dash: ${s.slice(0, 80)}`); }
	});
	if (dashes > 10) out.push(`and ${dashes - 10} more dashes`);
	for (const [k, p] of Object.entries(producers)) for (const f of ['line', 'tell', 'region', 'name']) {
		const s = p && typeof p[f] === 'string' ? p[f] : '';
		const m = s.match(ALLERGEN_PROSE);
		if (m) out.push(`producer ${k} ${f} speaks of "${m[0]}"; a description names who and where, never what is in the glass for a guest`);
	}
	for (const [k, p] of Object.entries(places)) {
		const m = String((p && p.line) || '').match(ALLERGEN_PROSE);
		if (m) out.push(`place ${k} line speaks of "${m[0]}"`);
	}

	/* 7. the whole cards */
	const wines = new Map((pack && pack.house && Array.isArray(pack.house.wines) ? pack.house.wines : []).map((w) => [w.id, w]));
	for (const [n, id] of Object.entries(cards)) {
		const e = byN.get(Number(n));
		const w = wines.get(id);
		if (!e) { out.push(`cards: ${n} is no catalogue entry`); continue; }
		if (!w) { out.push(`cards: entry ${n} names ${id}, which is no wine in the pack`); continue; }
		if (w.list !== 'bottle') out.push(`cards: entry ${n} names ${id} (${w.name}), which is not on the bottle list`);
		if (String(w.bin || '') !== String(e.bin) || String(w.vintage || '') !== String(e.vintage) || foldSize(w.size) !== foldSize(e.size)) out.push(`cards: entry ${n} (bin ${e.bin}, ${e.vintage}, ${e.size}) names ${id} (bin ${w.bin}, ${w.vintage}, ${w.size})`);
	}
	for (const w of wines.values()) if (w.list === 'bottle' && !Object.values(cards).includes(w.id)) out.push(`the pack's bottle ${w.name} (${w.id}) has no entry in cards; rebuild the list`);
	return out;
}

function main() {
	const args = process.argv.slice(2);
	const fail = (msg) => { console.error('check-winelist: ' + msg); process.exit(1); };
	if (args.includes('--help') || args.includes('-h')) {
		console.log(`check-winelist.mjs: hold ${REL(OUT)} to the catalogue, its producers and the pack.

  --file <path>       check another list file
  --pack <file>       the pack the whole cards resolve in (default: ${REL(PACK)})
  --catalogue <file>  the catalogue (default: ${REL(CATALOGUE)})
  --bins              list the bins the list prints for more than one bottle
  --help              this text`);
		process.exit(0);
	}
	const valued = ['--file', '--pack', '--catalogue'];
	const opt = {};
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--bins') continue;
		if (!valued.includes(args[i])) fail(`unknown argument ${args[i]}; see --help`);
		if (i + 1 >= args.length || args[i + 1].startsWith('--')) fail(`${args[i]} needs a value; see --help`);
		opt[args[i]] = args[++i];
	}
	const file = path.resolve(opt['--file'] || OUT);
	const packFile = path.resolve(opt['--pack'] || PACK);
	const catalogueFile = path.resolve(opt['--catalogue'] || CATALOGUE);
	for (const f of [file, packFile, catalogueFile]) if (!fs.existsSync(f)) fail(`${REL(f)}: missing${f === file ? '; run node tools/house/build-winelist.mjs' : ''}`);
	const catalogue = JSON.parse(fs.readFileSync(catalogueFile, 'utf8'));
	const pageFile = path.join(path.dirname(catalogueFile), '..', String(catalogue.source || '').replace(/^brennans\//, ''));
	const page = fs.existsSync(pageFile) ? fs.readFileSync(pageFile, 'utf8') : '';
	if (!page) fail(`${REL(pageFile)}: the paste the catalogue names as its source is missing; the price rule reads it`);
	const hasDash = loadDash();
	if (!hasDash) fail(`${REL(ENGINE)}: the engine is missing or carries no hasDash`);
	const text = fs.readFileSync(file, 'utf8');
	const problems = winelistProblems(text, catalogue, page, JSON.parse(fs.readFileSync(packFile, 'utf8')), hasDash);
	if (problems.length) fail(`${REL(file)}: ${problems.length} problem(s):\n  ` + problems.join('\n  '));
	const list = JSON.parse(text);
	const shared = sharedBins(catalogue.entries);
	const sharedN = Object.keys(shared).length;
	if (args.includes('--bins')) for (const [bin, ns] of Object.entries(shared)) console.log(`  bin ${bin}: ` + ns.map((n) => { const e = catalogue.entries.find((x) => x.n === n); return `${n} ${listName(e)} ${e.vintage} $${e.price}`; }).join('; '));
	console.log(`check-winelist: ${REL(file)}: ${list.entries.length} entries, each the catalogue's at its printed price; ${sharedN} bins printed for more than one bottle (a report; --bins lists them); ${Object.keys(list.producers).length} producers described; ${Object.keys(list.places).length} places with a line; ${Object.keys(list.cards).length} whole cards in the pack; no dash; no allergen talk; ${Buffer.byteLength(text)} bytes`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
