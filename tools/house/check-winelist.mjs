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
     7. every whole card (cards, n to a wine id) is a served pack wine on the bottle list whose bin,
        vintage and size are that catalogue entry's, and a bottle with no bin is carded only on an
        entry whose printed name carries its producer (an empty bin matches every binless entry of
        that vintage and size);
     8. the ledger (research/winelist/ledger.json, carry-winelist.mjs ledgerProblems): every row of
        every catalogue has one key, no key names two rows, a carried key is the same wine (vintage
        and size, and the bin or the folded name) unless a ruling names it, and left is exactly the
        keys the current catalogue no longer prints; the file's own catalogue is one of the ledger's;
     9. the past (from the second paste on): every past row is its own catalogue's entry, at its
        printed price on its own page, at the home printing of its bottle (the first printing not
        under a cross list page), and no printing of that bottle is live; every bottle that left has
        exactly one past row, in the group of the catalogue that printed it last, newest group first;
        every past row has a described producer and place;
    10. every past card is a past wine of the pack (the engine's isPast) on that row (a bottle by bin,
        vintage and size; a glass wine on a glass row of its vintage that carries its producer), every
        past bottle of the pack has one, no served wine is carded on a past row and no past wine on a
        live one;
    11. pending (a writer's build, build-winelist --pending): each pending n is a live row written with
        producer '' and every such row is pending; reported on the last line, and refused with
        --release, which also refuses a file not built from the ledger's current catalogue.

   Usage: node tools/house/check-winelist.mjs [--file <list>] [--pack <file>] [--catalogue <file>]
            [--ledger <file>] [--release] [--bins]
   Runs from any directory. Exits 1 with the file and the rule on failure, one line on success. No
   dash of any spelling in this file. */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { CATALOGUE, CROSS_SECTIONS, HALF_SECTION, LEDGER, OUT, PACK, WINELIST_FORMAT, WINELIST_VERSION, bottleOf, cardHits, flagsOf, foldName, foldSize, letterOf, listName, pastBottles, sectionOfPlace, sharedBins } from './build-winelist.mjs';
import { catalogueFile, ledgerProblems, readCatalogues } from './carry-winelist.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ENGINE = path.join(HERE, '..', '..', 'static', 'shared', 'oot-house.js');
export const MAX_BYTES = 1.5 * 1024 * 1024;
const catalogueFile0 = (date) => catalogueFile(date);
const REL = (p) => { const r = path.relative(process.cwd(), p); return !r ? p : r.startsWith('..') ? p : r; };

/* The talk no description may hold: an allergen or a diet, named or ruled on, or a fining agent
   (which is a diet claim by the back door). Sulphites are an allergen, so "low sulphur" or "no added
   sulphites" is a claim about what is in the glass and is refused with the rest. A dish a wine goes
   with is not allergen talk: "lovely with shellfish" names food, so the foods themselves are not
   listed here. */
export const ALLERGEN_PROSE = /\b(allerg\w*|intoleran\w*|gluten|dairy|lactose|celiac|coeliac|vegan\w*|vegetarian\w*|sulph\w*|sulfit\w*|sulfur\w*|histamin\w*|egg whites?|isinglass|casein|\w+[- ]free)\b/i;
const EN_DASH = String.fromCharCode(0x2013);

function loadLib() {
	if (!fs.existsSync(ENGINE)) return null;
	const window = {};
	window.window = window;
	window.self = window;
	vm.runInContext(fs.readFileSync(ENGINE, 'utf8'), vm.createContext({ window, console }), { filename: ENGINE });
	const lib = window.OOT && window.OOT.houseLib;
	return lib && typeof lib.hasDash === 'function' && typeof lib.isPast === 'function' ? lib : null;
}

/** The page a catalogue names as its source, beside the catalogue file. */
export function pageOf(catalogue, catalogueAt) {
	const f = path.join(path.dirname(catalogueAt), '..', String((catalogue && catalogue.source) || '').replace(/^brennans\//, ''));
	return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
}

/** A row checked against its catalogue entry, as sentences (rule 2 for one row): the catalogue's
    bin, name, vintage, size, flags and grape at its printed price, that price on its own line of its
    page near the entry. */
function rowProblems(r, e, lines, what) {
	const out = [];
	const [n, , bin, name, vintage, price, size, , flags, grape] = r;
	if (bin !== String(e.bin || '') || name !== listName(e) || vintage !== String(e.vintage || '') || size !== String(e.size || '')) out.push(`${what} ${n}: bin, name, vintage or size is not the catalogue's (${e.bin} ${listName(e)} ${e.vintage} ${e.size})`);
	if (typeof name === 'string' && /•/.test(name)) out.push(`${what} ${n}: the name ${name} keeps the paste's bullet tail; the size is its own field`);
	if (e.section === HALF_SECTION && foldSize(size) !== '375ml') out.push(`${what} ${n} (${name}): listed under ${HALF_SECTION} at ${size}; every entry there is a 375ml half bottle`);
	if (price !== e.price) out.push(`${what} ${n} (${e.name}): the price ${price} is not the catalogue's ${e.price}`);
	if (flags !== flagsOf(e)) out.push(`${what} ${n}: flags ${flags}; the catalogue gives ${flagsOf(e)}`);
	if ((grape || '') !== String(e.grape || '')) out.push(`${what} ${n}: grape ${grape}; the catalogue gives ${e.grape || 'none'}`);
	if (lines.length) {
		const at = Number(e.line) || 0;
		const window = lines.slice(Math.max(0, at - 1), at + 6).map((l) => l.trim());
		if (!window.includes(String(e.price))) out.push(`${what} ${n} (${e.name}): the price ${e.price} is not printed on its own line near line ${at} of the paste`);
	}
	return out;
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
 * the engine's dash rule. `opts`: { ledger, catalogues: { letter: catalogue }, pages: { letter: text },
 * isPast, release }. Without a ledger (a test's stub files) rules 8 to 10 are not read and a file
 * carrying past is refused, since nothing could hold it.
 */
export function winelistProblems(text, catalogue, page, pack, hasDash, opts = {}) {
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
	const pendingList = Array.isArray(list.pending) ? list.pending : [];
	const pendingSet = new Set(pendingList);
	if (list.pending !== undefined && (!Array.isArray(list.pending) || !list.pending.length)) out.push('pending is written only as a list of the live entries waiting for a producer');
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
		for (const s of rowProblems(r, e, lines, 'entry')) say(s);
		/* 3. its place */
		if (typeof place !== 'string' || sectionOfPlace(place, sections) !== e.section) say(`entry ${n}: the place ${place} does not belong to its section ${e.section}`);
		if (!places[place]) say(`entry ${n}: the place ${place} is not described`);
		/* 4. its producer, or 11. pending one */
		const p = producers[pk];
		if (pendingSet.has(n)) { if (pk !== '') say(`entry ${n}: pending a producer, but written with ${pk}`); }
		else if (!pk || !p) say(`entry ${n} (${e.name}): no described producer${pk ? ' (' + pk + ')' : ''}`);
		else if (![p.name, p.line, p.tell].every((s) => typeof s === 'string' && s.trim())) say(`entry ${n}: the producer ${pk} lacks a name, a line or a tell`);
	});
	for (const n of pendingList) if (!byN.has(n)) out.push(`pending: ${n} is no live entry`);
	if (opts.release && pendingList.length) out.push(`${pendingList.length} live entr${pendingList.length > 1 ? 'ies are' : 'y is'} pending a producer (${pendingList.slice(0, 12).join(', ')}${pendingList.length > 12 ? ', ...' : ''}); a released list describes every bottle`);
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

	/* 8. the ledger; 9. the past */
	const isPast = typeof opts.isPast === 'function' ? opts.isPast : () => false;
	const ledger = opts.ledger || null;
	const past = list.past === undefined ? [] : list.past;
	if (!Array.isArray(past)) out.push('past is a list of groups { lastPrinted, source, entries, cards }');
	const pastCards = [];
	if (!ledger) {
		if (Array.isArray(past) && past.length) out.push('the file carries past, which only the ledger can hold; check it with the ledger');
	} else {
		const cats = { ...(opts.catalogues || {}) };
		const letter = letterOf(ledger, list);
		for (const s of ledgerProblems(ledger, cats)) out.push('ledger: ' + s);
		if (!letter) out.push(`the file reads ${list.readOn}, which is no catalogue of the ledger`);
		else {
			if (cats[letter] !== catalogue && cats[letter] && cats[letter].readOn === catalogue.readOn) cats[letter] = catalogue;
			if (opts.release && letter !== ledger.current) out.push(`the file is built from catalogue ${letter} (${list.readOn}); a released list is the ledger's current one, ${ledger.current} (${ledger.catalogues[ledger.current]})`);
			const want = Object.keys(ledger.catalogues).every((l) => cats[l]) ? pastBottles(ledger, cats, letter).groups : null;
			if (!want) out.push('the past cannot be read: a catalogue the ledger names is not given');
			const liveBottles = new Set(cat.map(bottleOf));
			const letters = Object.keys(ledger.catalogues).sort();
			const groups = Array.isArray(past) ? past : [];
			let prev = '9999';
			const seenGroup = new Set();
			groups.forEach((g, gi) => {
				const gl = letters.find((l) => ledger.catalogues[l] === (g && g.lastPrinted));
				const where = `past[${gi}]`;
				if (!g || !gl || letters.indexOf(gl) >= letters.indexOf(letter)) { out.push(`${where}: lastPrinted ${g && g.lastPrinted} is no catalogue of the ledger older than the file's`); return; }
				if (seenGroup.has(gl)) out.push(`${where}: a second group for ${g.lastPrinted}`);
				seenGroup.add(gl);
				if (!(g.lastPrinted < prev)) out.push(`${where}: the groups run newest first`);
				prev = g.lastPrinted;
				const gc = cats[gl];
				if (!gc) return;
				if (g.source !== gc.source) out.push(`${where}: source ${g.source}; its catalogue's is ${gc.source}`);
				const gLines = ((opts.pages && opts.pages[gl]) || '').split('\n').filter((x, i, a) => a.length > 1);
				if (!gLines.length) out.push(`${where}: the page of ${g.lastPrinted} is not given, so its prices cannot be held to it`);
				const gByN = new Map(gc.entries.map((e) => [e.n, e]));
				const gKeys = ledger.keys[gl] || {};
				const liveKeys = new Set(Object.values(ledger.keys[letter] || {}));
				const rows = Array.isArray(g.entries) ? g.entries : [];
				const seenN = new Set();
				let poff = 0;
				const psay = (m) => { poff++; if (poff <= 20) out.push(m); };
				for (const r of rows) {
					if (!Array.isArray(r) || r.length < 9 || r.length > 10) { psay(`${where}: a row is not [n, place, bin, name, vintage, price, size, producer, flags, grape?]`); continue; }
					const [n, place, , , , , , pk] = r;
					const e = gByN.get(n);
					if (!e) { psay(`${where}: ${n} is no entry of the catalogue of ${g.lastPrinted}`); continue; }
					if (seenN.has(n)) psay(`${where}: entry ${n} is listed twice`);
					seenN.add(n);
					for (const s of rowProblems(r, e, gLines, `${where} entry`)) psay(s);
					const b = bottleOf(e);
					const printings = gc.entries.filter((x) => bottleOf(x) === b);
					const home = printings.find((x) => !CROSS_SECTIONS.includes(x.section)) || printings[0];
					if (home.n !== n) psay(`${where} entry ${n} (${e.name}): the home printing of its bottle is entry ${home.n}`);
					if (liveBottles.has(b)) psay(`${where} entry ${n} (${e.name} ${e.vintage}): that bottle is still printed on the list of ${list.readOn}`);
					for (const x of printings) if (liveKeys.has(gKeys[x.n])) psay(`${where} entry ${n}: its printing ${x.n} (${gKeys[x.n]}) is still printed on the list of ${list.readOn}`);
					if (typeof place !== 'string' || sectionOfPlace(place, [...new Set(gc.entries.map((x) => x.section))]) !== e.section) psay(`${where} entry ${n}: the place ${place} does not belong to its section ${e.section}`);
					if (!places[place]) psay(`${where} entry ${n}: the place ${place} is not described`);
					const p = producers[pk];
					if (!pk || !p) psay(`${where} entry ${n} (${e.name}): no described producer${pk ? ' (' + pk + ')' : ''}`);
					else if (![p.name, p.line, p.tell].every((s) => typeof s === 'string' && s.trim())) psay(`${where} entry ${n}: the producer ${pk} lacks a name, a line or a tell`);
				}
				if (poff > 20) out.push(`and ${poff - 20} more past problems (${poff} in all)`);
				const wg = want && want.find((x) => x.letter === gl);
				const wantN = new Set(wg ? wg.rows.map((e) => e.n) : []);
				for (const n of wantN) if (!seenN.has(n)) { const e = gByN.get(n); out.push(`${where}: the bottle ${e.name} ${e.vintage} (entry ${n}, bin ${e.bin || 'none'}) left the list after ${g.lastPrinted} and has no past row`); }
				for (const n of seenN) if (!wantN.has(n)) out.push(`${where}: entry ${n} is no bottle that left the list after ${g.lastPrinted}`);
				/* 10. its cards */
				const gcards = g.cards && typeof g.cards === 'object' ? g.cards : {};
				for (const [n, id] of Object.entries(gcards)) pastCards.push({ where, n: Number(n), id, row: seenN.has(Number(n)) ? gByN.get(Number(n)) : null, date: g.lastPrinted });
			});
			if (want) for (const wg of want) if (!seenGroup.has(wg.letter)) out.push(`past: ${wg.rows.length} bottle(s) left the list after ${ledger.catalogues[wg.letter]} and the file has no group for them`);
		}
	}

	/* 7. the whole cards; 10. the past cards */
	const wines = new Map((pack && pack.house && Array.isArray(pack.house.wines) ? pack.house.wines : []).map((w) => [w.id, w]));
	for (const c of pastCards) {
		const w = wines.get(c.id);
		if (!c.row) { out.push(`${c.where} cards: ${c.n} is no past row of the group`); continue; }
		if (!w) { out.push(`${c.where} cards: entry ${c.n} names ${c.id}, which is no wine in the pack`); continue; }
		if (!isPast(w)) { out.push(`${c.where} cards: entry ${c.n} names ${c.id} (${w.name}), a wine the house still serves, on a bottle that left the list`); continue; }
		if (!cardHits(w, [c.row]).length) out.push(`${c.where} cards: entry ${c.n} (${c.row.name}, bin ${c.row.bin || 'none'}, ${c.row.vintage}, ${c.row.size}) names ${c.id} (${w.name}, bin ${w.bin || 'none'}, ${w.vintage}, ${w.size}), another wine`);
	}
	for (const w of wines.values()) if (ledger && isPast(w) && w.list === 'bottle' && !pastCards.some((c) => c.id === w.id)) out.push(`the pack's past bottle ${w.name} (${w.id}) has no entry in a past group's cards; rebuild the list`);
	for (const [n, id] of Object.entries(cards)) {
		const e = byN.get(Number(n));
		const w = wines.get(id);
		if (!e) { out.push(`cards: ${n} is no catalogue entry`); continue; }
		if (!w) { out.push(`cards: entry ${n} names ${id}, which is no wine in the pack`); continue; }
		if (isPast(w)) out.push(`cards: entry ${n} names ${id} (${w.name}), a past wine, on a live row; it belongs in its past group`);
		if (w.list !== 'bottle') out.push(`cards: entry ${n} names ${id} (${w.name}), which is not on the bottle list`);
		if (String(w.bin || '') !== String(e.bin) || String(w.vintage || '') !== String(e.vintage) || foldSize(w.size) !== foldSize(e.size)) out.push(`cards: entry ${n} (bin ${e.bin}, ${e.vintage}, ${e.size}) names ${id} (bin ${w.bin}, ${w.vintage}, ${w.size})`);
		if (!String(w.bin || '').trim() && !(' ' + foldName(e.name) + ' ').includes(' ' + foldName(w.producer) + ' ')) out.push(`cards: entry ${n} (${e.name}) names ${id} (${w.name}), a bottle with no bin, but its printed name does not carry ${w.producer}`);
	}
	for (const w of wines.values()) if (w.list === 'bottle' && !isPast(w) && !Object.values(cards).includes(w.id)) out.push(`the pack's bottle ${w.name} (${w.id}) has no entry in cards; rebuild the list`);
	return out;
}

function main() {
	const args = process.argv.slice(2);
	const fail = (msg) => { console.error('check-winelist: ' + msg); process.exit(1); };
	if (args.includes('--help') || args.includes('-h')) {
		console.log(`check-winelist.mjs: hold ${REL(OUT)} to the catalogue, its producers and the pack.

  --file <path>       check another list file
  --pack <file>       the pack the whole cards resolve in (default: ${REL(PACK)})
  --catalogue <file>  the catalogue (default: the one the file was read on, research/winelist-<readOn>.json;
                      the current one is ${REL(CATALOGUE)})
  --ledger <file>     the stable keys (default: ${REL(LEDGER)})
  --release           also refuse a pending producer and a file not built from the ledger's current catalogue
  --bins              list the bins the list prints for more than one bottle
  --help              this text`);
		process.exit(0);
	}
	const valued = ['--file', '--pack', '--catalogue', '--ledger'];
	const opt = {};
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--bins' || args[i] === '--release') continue;
		if (!valued.includes(args[i])) fail(`unknown argument ${args[i]}; see --help`);
		if (i + 1 >= args.length || args[i + 1].startsWith('--')) fail(`${args[i]} needs a value; see --help`);
		opt[args[i]] = args[++i];
	}
	const file = path.resolve(opt['--file'] || OUT);
	const packFile = path.resolve(opt['--pack'] || PACK);
	const ledgerFile = path.resolve(opt['--ledger'] || LEDGER);
	for (const f of [file, packFile, ledgerFile]) if (!fs.existsSync(f)) fail(`${REL(f)}: missing${f === file ? '; run node tools/house/build-winelist.mjs' : f === ledgerFile ? '; run node tools/house/carry-winelist.mjs' : ''}`);
	const text = fs.readFileSync(file, 'utf8');
	let head;
	try { head = JSON.parse(text); } catch (err) { fail(`${REL(file)}: does not parse as JSON (${err.message})`); }
	const catalogueFile = path.resolve(opt['--catalogue'] || catalogueFile0(head.readOn));
	if (!fs.existsSync(catalogueFile)) fail(`${REL(catalogueFile)}: missing; the file was read on ${head.readOn}`);
	const catalogue = JSON.parse(fs.readFileSync(catalogueFile, 'utf8'));
	const page = pageOf(catalogue, catalogueFile);
	if (!page) fail(`${String(catalogue.source)}: the paste the catalogue names as its source is missing; the price rule reads it`);
	const lib = loadLib();
	if (!lib) fail(`${REL(ENGINE)}: the engine is missing or carries no hasDash and isPast`);
	const hasDash = lib.hasDash;
	const ledger = JSON.parse(fs.readFileSync(ledgerFile, 'utf8'));
	const catalogues = readCatalogues(ledger);
	const pages = {};
	for (const [l, c] of Object.entries(catalogues)) pages[l] = pageOf(c, catalogueFile0(c.readOn));
	const release = args.includes('--release');
	const problems = winelistProblems(text, catalogue, page, JSON.parse(fs.readFileSync(packFile, 'utf8')), hasDash, { ledger, catalogues, pages, isPast: lib.isPast, release });
	if (problems.length) fail(`${REL(file)}: ${problems.length} problem(s):\n  ` + problems.join('\n  '));
	const list = JSON.parse(text);
	const shared = sharedBins(catalogue.entries);
	const sharedN = Object.keys(shared).length;
	if (args.includes('--bins')) for (const [bin, ns] of Object.entries(shared)) console.log(`  bin ${bin}: ` + ns.map((n) => { const e = catalogue.entries.find((x) => x.n === n); return `${n} ${listName(e)} ${e.vintage} $${e.price}`; }).join('; '));
	const pastRows = (list.past || []).reduce((n, g) => n + g.entries.length, 0);
	const pastCardN = (list.past || []).reduce((n, g) => n + Object.keys(g.cards || {}).length, 0);
	const pendingN = (list.pending || []).length;
	console.log(`check-winelist: ${release ? '(release) ' : ''}${REL(file)}: ${list.entries.length} entries, each the catalogue's at its printed price; ${sharedN} bins printed for more than one bottle (a report; --bins lists them); ${Object.keys(list.producers).length} producers described; ${Object.keys(list.places).length} places with a line; ${Object.keys(list.cards).length} whole cards in the pack; ${pastRows} past rows in ${(list.past || []).length} group(s) with ${pastCardN} past card(s); ${pendingN ? pendingN + ' entries pending a producer (refused with --release)' : 'none pending'}; ledger of ${Object.keys(ledger.catalogues).length} catalogue(s) held; no dash; no allergen talk; ${Buffer.byteLength(text)} bytes`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
