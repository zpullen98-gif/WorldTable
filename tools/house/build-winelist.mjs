#!/usr/bin/env node
/* build-winelist.mjs: the whole Brennan's bottle list as its own file, the second tier of the wine
   deep dive (4 October 2026): every bottle the owner's Binwise paste prints, described at producer
   and region level, for the Codex's "The full list" view. The first tier (the floor's bottles with a
   whole card) lives in the house pack; this file names each of those by its pack wine id.

   Reads:
     the catalogue of the paste               research/winelist-<date>.json, by default the ledger's
                                              current one (28 November 2026, 3,560 entries; the
                                              3 October 2026 one held 3,577), the one truth for every
                                              bin, name, vintage, price and size;
     research/winelist/ledger.json            every entry's stable key (carry-winelist.mjs writes
                                              it): the letter of the catalogue that first printed
                                              the entry and its n there, a15 for ever;
     the producer files (see --producers)     each { producers, entries, places }: producers by key,
                                              { name, region, country, line, tell }; entries, an
                                              entry's ledger key to a producer key; places, a place
                                              key (a catalogue section, "section ~ group" or
                                              "section ~ group ~ sub") to { title, line };
     the built pack (see --pack)              its wines with list 'bottle', matched to catalogue
                                              entries by bin, vintage and size; a wine the engine
                                              calls past (isPast, a section beginning "Past ") is
                                              matched among the past rows instead.

   Writes static/shared/packs/brennans-new-orleans.winelist.v1.json, format 'oot-winelist' v1:
     { format, version, house, readOn, source,
       sections: [sectionKey, ...]                the catalogue's sections in printed order,
       entries: [[n, placeKey, bin, name, vintage, price, size, producerKey, flags, grape?], ...]
                                                  in catalogue order; name is the catalogue's less
                                                  the paste's format tail (listName), the size being
                                                  its own field; placeKey is the most precise
                                                  place the files describe (sub, then group, then
                                                  the section) and always starts with its section;
                                                  price is a number as printed (per glass when
                                                  flags holds g, per bottle otherwise); flags is a
                                                  string of letters: g priced by the glass, c poured
                                                  by Coravin, o organic, b biodynamic, n natural;
                                                  grape is there only when the list prints one,
       producers: { key: { name, region, country, line, tell } }   sorted by key,
       places: { placeKey: { title, line } }      every section and every place an entry names,
       cards: { n: wineId },                      the catalogue entries with a whole card in the pack,
                                                  served wines on live rows only;
       past: [{ lastPrinted, source, entries, cards }]   only when a bottle has left the list: one
                                                  group a catalogue, newest first, holding the bottles
                                                  that catalogue printed last, one row a bottle (its
                                                  home printing: the first not under a cross list
                                                  page, else its first) in the row shape above with
                                                  its n in that catalogue, and the glass pours that
                                                  left; cards names the pack's past wines on them;
       pending: [n, ...] }                        only with --pending: the live rows whose producer no
                                                  file describes yet, each written with producer '';
                                                  check-winelist reports them and refuses them with
                                                  --release, so a file with a pending row never ships.

   The producer files merge by key: when two describe one producer or one place, the fuller stands
   (more fields filled, then more words) and the clash is reported; two files giving one catalogue
   entry two producers is a failure. Deterministic: no clock, no chance, sorted where the catalogue
   gives no order, so a rebuild is byte for byte the same. tools/house/check-winelist.mjs is the gate.

   Usage: node tools/house/build-winelist.mjs [--producers a.json,b.json,...] [--pack <file>]
            [--catalogue <file>] [--ledger <file>] [--out <file>] [--dry] [--pending]
   Runs from any directory. Exits 1 with the file and the rule on failure. No dash of any spelling
   in this file. */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(HERE, 'brennans');
export const CATALOGUE = path.join(DIR, 'research', 'winelist-2026-11-28.json');
/* The stable keys of the entries across the pastes (carry-winelist.mjs). */
export const LEDGER = path.join(DIR, 'research', 'winelist', 'ledger.json');
export const ENGINE = path.join(HERE, '..', '..', 'static', 'shared', 'oot-house.js');
/* The producer descriptions live one folder down, in research/winelist/, so engine.mjs noteHay (which
   reads only the files at the top of research/) never takes a writer's description as a source. */
export const PRODUCERS_DIR = path.join(DIR, 'research', 'winelist');
/** Every producers-<letter>.json in the folder, in name order: a writer's new file is read with the rest. */
export const PRODUCER_FILES = (fs.existsSync(PRODUCERS_DIR) ? fs.readdirSync(PRODUCERS_DIR) : []).filter((f) => /^producers-[a-z]+\.json$/.test(f)).sort().map((f) => path.join(PRODUCERS_DIR, f));
export const PACK = path.join(HERE, '..', '..', 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json');
export const OUT = path.join(HERE, '..', '..', 'static', 'shared', 'packs', 'brennans-new-orleans.winelist.v1.json');
export const WINELIST_FORMAT = 'oot-winelist';
export const WINELIST_VERSION = 1;
const REL = (p) => { const r = path.relative(process.cwd(), p); return !r ? p : r.startsWith('..') ? p : r; };

/* ---------- the pieces check-winelist shares ---------- */

/** A size folded for comparison, the engine's foldSize: lower case, no spaces. */
export const foldSize = (s) => String(s == null ? '' : s).toLowerCase().replace(/\s+/g, '');

/** A name folded for comparison: lower case, no accents, '&' as and, every other mark a space. */
export const foldName = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
	.replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();

/** The flags of one catalogue entry, as the letters the file carries. */
export function flagsOf(e) {
	let f = '';
	if (e.priceIs === 'glass') f += 'g';
	if (e.coravin) f += 'c';
	const farming = Array.isArray(e.farming) ? e.farming.map((x) => String(x).toLowerCase()) : [];
	if (farming.includes('organic')) f += 'o';
	if (farming.includes('biodynamic')) f += 'b';
	if (farming.includes('natural')) f += 'n';
	return f;
}

/** The name a row shows: the catalogue's name as printed, less the paste's format tail (" • 375ml
    Half-bottle", " • 1.5L Magnum", sometimes with no space before the bullet), since the row's size
    line carries the size; farming and Coravin notes stay, as the list prints them. */
export function listName(e) {
	return String((e && e.name) || '').replace(/\s*•\s*[^•]*$/, (m) => (/(\d\s?ml|\d\s?L\b|Magnum|Half|Methuselah|Rehoboam|Salmanazar|Balthazar|Nebuchadnezzar|bottle)/i.test(m) ? '' : m)).trim();
}

/** The section the paste prints its half bottles under; every entry there is 375ml. */
export const HALF_SECTION = 'Half-bottles';

/**
 * The bins the list prints for more than one bottle: { bin: [n, ...] } for every bin under which two
 * entries differ in vintage or price (a bin printed twice for one vintage at one price is the same
 * bottle cross listed, a magnum under Large Formats and again under its region). A report: the list
 * is as Binwise prints it, and a server rings such a bottle by name and vintage, never by bin alone.
 */
export function sharedBins(entries) {
	const by = new Map();
	for (const e of entries || []) if (e && e.bin) { const k = String(e.bin); if (!by.has(k)) by.set(k, []); by.get(k).push(e); }
	const out = {};
	for (const [bin, list] of by) {
		if (list.length < 2) continue;
		if (list.every((e) => String(e.vintage) === String(list[0].vintage) && e.price === list[0].price)) continue;
		out[bin] = list.map((e) => e.n);
	}
	return out;
}

/** The place keys of one catalogue entry, most precise first. */
export function placeKeysOf(e) {
	const out = [];
	if (e.group && e.sub) out.push(e.section + ' ~ ' + e.group + ' ~ ' + e.sub);
	if (e.group) out.push(e.section + ' ~ ' + e.group);
	out.push(e.section);
	return out;
}

/** The section a place key belongs to: the longest section key it equals or opens with. */
export function sectionOfPlace(key, sections) {
	let best = '';
	for (const s of sections) if ((key === s || key.startsWith(s + ' ~ ')) && s.length > best.length) best = s;
	return best;
}

/* ---------- the merge ---------- */

const filled = (o, keys) => keys.filter((k) => typeof o[k] === 'string' && o[k].trim()).length;
const wordsIn = (o, keys) => keys.reduce((n, k) => n + (typeof o[k] === 'string' ? o[k].split(/\s+/).filter(Boolean).length : 0), 0);
/** The fuller of two descriptions: more fields filled, then more words; on a tie the first stands. */
function fuller(a, b, keys) {
	const fa = filled(a, keys);
	const fb = filled(b, keys);
	if (fa !== fb) return fb > fa ? b : a;
	return wordsIn(b, keys) > wordsIn(a, keys) ? b : a;
}
const PRODUCER_KEYS = ['name', 'region', 'country', 'line', 'tell'];
const PLACE_KEYS = ['title', 'line'];

/**
 * The producer files as one: { producers, entries, places, clashes, failures }. Each file is read in
 * the order given; a producer or place two files describe keeps the fuller description and is named
 * in clashes; an entry two files give to two producers is a failure.
 */
export function mergeProducerFiles(files) {
	const producers = {};
	const places = {};
	const entries = {};
	const entryFrom = {};
	const clashes = [];
	const failures = [];
	for (const { file, data } of files) {
		const name = path.basename(file);
		if (!data || typeof data !== 'object') { failures.push(`${name}: not a JSON object`); continue; }
		for (const part of ['producers', 'entries', 'places']) {
			if (!data[part] || typeof data[part] !== 'object' || Array.isArray(data[part])) failures.push(`${name}: ${part} is missing or not an object`);
		}
		for (const [k, v] of Object.entries(data.producers || {})) {
			if (!v || typeof v !== 'object') { failures.push(`${name}: producer ${k} is not an object`); continue; }
			const rec = Object.fromEntries(PRODUCER_KEYS.map((f) => [f, typeof v[f] === 'string' ? v[f] : '']));
			if (!producers[k]) { producers[k] = { rec, from: name }; continue; }
			const keep = fuller(producers[k].rec, rec, PRODUCER_KEYS);
			if (JSON.stringify(producers[k].rec) !== JSON.stringify(rec)) clashes.push(`producer ${k}: described in ${producers[k].from} and ${name}; kept ${keep === rec ? name : producers[k].from}'s, the fuller`);
			if (keep === rec) producers[k] = { rec, from: name };
		}
		for (const [k, v] of Object.entries(data.places || {})) {
			if (!v || typeof v !== 'object') { failures.push(`${name}: place ${k} is not an object`); continue; }
			const rec = Object.fromEntries(PLACE_KEYS.map((f) => [f, typeof v[f] === 'string' ? v[f] : '']));
			if (!places[k]) { places[k] = { rec, from: name }; continue; }
			const keep = fuller(places[k].rec, rec, PLACE_KEYS);
			if (JSON.stringify(places[k].rec) !== JSON.stringify(rec)) clashes.push(`place ${k}: described in ${places[k].from} and ${name}; kept ${keep === rec ? name : places[k].from}'s, the fuller`);
			if (keep === rec) places[k] = { rec, from: name };
		}
		for (const [n, k] of Object.entries(data.entries || {})) {
			if (typeof k !== 'string' || !k) { failures.push(`${name}: entry ${n} names no producer key`); continue; }
			if (entries[n] && entries[n] !== k) failures.push(`entry ${n}: ${entryFrom[n]} gives it to ${entries[n]} and ${name} to ${k}`);
			else { entries[n] = k; entryFrom[n] = name; }
		}
	}
	const flat = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v.rec]));
	return { producers: flat(producers), places: flat(places), entries, clashes, failures };
}

/* ---------- the build ---------- */

/** The pages a bottle is cross listed on: a row there is never a bottle's home printing while it has another. */
export const CROSS_SECTIONS = ['Selections Under $100', 'Half-bottles', 'Large Formats', 'Sustainable Selections'];
export const GLASS_SECTION = 'By the Glass';

/** One bottle of a catalogue: its bin, vintage, size and price, or for an entry with no bin its folded name in their place. */
export const bottleOf = (e) => [e.bin ? 'bin ' + e.bin : 'name ' + foldName(e.name), String(e.vintage), foldSize(e.size), e.price, e.section === GLASS_SECTION ? 'g' : ''].join('|');

/** The engine's isPast, loaded as the gate loads hasDash, so the rule is written once. */
export function loadIsPast() {
	if (!fs.existsSync(ENGINE)) return null;
	const window = {};
	window.window = window;
	window.self = window;
	vm.runInContext(fs.readFileSync(ENGINE, 'utf8'), vm.createContext({ window, console }), { filename: ENGINE });
	const lib = window.OOT && window.OOT.houseLib;
	return lib && typeof lib.isPast === 'function' ? lib.isPast : null;
}

/** The letter of a catalogue in a ledger, by its readOn. */
export const letterOf = (ledger, catalogue) => Object.keys((ledger && ledger.catalogues) || {}).find((l) => ledger.catalogues[l] === String((catalogue && catalogue.readOn) || ''));

/**
 * The past groups of a file built at catalogue `letter`: for each earlier catalogue, newest first,
 * the bottles it printed last. A key is past when no catalogue after it printed it (carry-winelist
 * leftAt); a bottle is past when every printing of it in its last catalogue is past and the file's
 * own catalogue prints it nowhere (a vintage roll is carried by a ruling, so it never lands here).
 * { groups: [{ letter, catalogue, rows: [entry] }] }, each group's rows the home printings in
 * catalogue order. Pure.
 */
export function pastBottles(ledger, cats, letter) {
	const letters = Object.keys(ledger.catalogues).sort();
	const upto = letters.indexOf(letter);
	const last = new Map();
	for (const l of letters.slice(0, upto + 1)) for (const k of Object.values(ledger.keys[l] || {})) last.set(k, l);
	const liveBottles = new Set(cats[letter].entries.map(bottleOf));
	const groups = [];
	for (const l of letters.slice(0, upto).reverse()) {
		const keys = ledger.keys[l] || {};
		const cat = cats[l];
		if (!cat) continue;
		const byBottle = new Map();
		for (const e of cat.entries) { const b = bottleOf(e); if (!byBottle.has(b)) byBottle.set(b, []); byBottle.get(b).push(e); }
		const rows = [];
		for (const [b, printings] of byBottle) {
			if (liveBottles.has(b)) continue;
			if (!printings.every((e) => last.get(keys[e.n]) === l)) continue;
			rows.push(printings.find((e) => !CROSS_SECTIONS.includes(e.section)) || printings[0]);
		}
		rows.sort((x, y) => x.n - y.n);
		if (rows.length) groups.push({ letter: l, catalogue: cat, rows });
	}
	return { groups };
}

/** The pack wines a set of catalogue entries cards: by bin, vintage and folded size, a bottle with no
    bin only where the printed name carries its producer; a past glass wine (not on the bottle list)
    only on a glass row of its vintage whose printed name carries its producer. */
export function cardHits(w, entries) {
	const binless = !String(w.bin || '').trim();
	const maker = foldName(w.producer);
	const carries = (e) => maker !== '' && (' ' + foldName(e.name) + ' ').includes(' ' + maker + ' ');
	if (w.list !== 'bottle') return entries.filter((e) => e.section === GLASS_SECTION && String(e.vintage) === String(w.vintage || '') && carries(e));
	return entries.filter((e) => String(e.bin) === String(w.bin || '') && String(e.vintage) === String(w.vintage || '') && foldSize(e.size) === foldSize(w.size)
		&& (!binless || carries(e)));
}

/**
 * The file from its inputs, with what went wrong: { list, failures, clashes, notes }. `catalogue` is
 * the parsed catalogue, `files` the parsed producer files as { file, data }, `pack` the parsed pack
 * or null. `opts`: { ledger, catalogues: { letter: catalogue }, isPast, pending }. With a ledger an
 * entry's producer is read by its stable key and the past groups are written; without one (a test's
 * stub files) by its n, as before the ledger, and no past is written. With pending, a live row whose
 * producer no file describes is written with producer '' and named in pending rather than failed.
 * Pure: nothing read or written here.
 */
export function buildWinelist(catalogue, files, pack, opts = {}) {
	const failures = [];
	const notes = [];
	const merged = mergeProducerFiles(files);
	failures.push(...merged.failures);
	const cat = Array.isArray(catalogue && catalogue.entries) ? catalogue.entries : [];
	if (!cat.length) failures.push('the catalogue holds no entries');
	const sections = [];
	for (const e of cat) if (!sections.includes(e.section)) sections.push(e.section);
	for (const s of sections) for (const t of sections) if (s !== t && t.startsWith(s + ' ~ ')) failures.push(`the section ${t} opens with the section ${s}, so a place key could belong to either`);
	const ledger = opts.ledger || null;
	const letter = ledger ? letterOf(ledger, catalogue) : '';
	if (ledger && !letter) failures.push(`the ledger names no catalogue read on ${catalogue && catalogue.readOn}; run carry-winelist.mjs --to ${catalogue && catalogue.readOn}`);
	const keyOf = (l, n) => (ledger ? ((ledger.keys && ledger.keys[l]) || {})[n] || '' : String(n));
	const isPast = typeof opts.isPast === 'function' ? opts.isPast : () => false;

	const usedPlaces = new Set(sections);
	const usedProducers = new Set();
	const pending = [];
	const rowOf = (e, key, live) => {
		const place = placeKeysOf(e).find((k) => merged.places[k]) || e.section;
		usedPlaces.add(place);
		let pk = key ? merged.entries[key] : '';
		if (!key) failures.push(`entry ${e.n} (${e.name} ${e.vintage}) has no key in the ledger; run carry-winelist.mjs --to ${catalogue.readOn}`);
		else if (!pk) {
			if (live && opts.pending) pending.push(e.n);
			else failures.push(`entry ${e.n} (${e.name} ${e.vintage})${ledger ? ', key ' + key + ',' : ''} has no producer in any producer file`);
		} else if (!merged.producers[pk]) {
			if (live && opts.pending) { pending.push(e.n); pk = ''; }
			else failures.push(`entry ${e.n} (${e.name})${ledger ? ', key ' + key + ',' : ''} names the producer ${pk}, which no producer file describes`);
		} else usedProducers.add(pk);
		const row = [e.n, place, String(e.bin || ''), listName(e), String(e.vintage || ''), e.price, String(e.size || ''), pk || '', flagsOf(e)];
		if (e.grape) row.push(String(e.grape));
		return row;
	};
	const entries = cat.map((e) => rowOf(e, keyOf(letter, e.n), true));
	/* Only the first twenty producer failures are named; the count says the rest. */
	const noProducer = failures.filter((f) => / has no producer in any producer file$/.test(f));
	if (noProducer.length > 20) {
		const keep = new Set(noProducer.slice(0, 20));
		const rest = failures.filter((f) => !/ has no producer in any producer file$/.test(f) || keep.has(f));
		failures.length = 0;
		failures.push(...rest, `and ${noProducer.length - 20} more entries with no producer (${noProducer.length} in all)`);
	}
	const halfWrong = cat.filter((e) => e.section === HALF_SECTION && foldSize(e.size) !== '375ml');
	if (halfWrong.length) failures.push(`${halfWrong.length} entr${halfWrong.length > 1 ? 'ies' : 'y'} under ${HALF_SECTION} not 375ml in the catalogue (${halfWrong.slice(0, 5).map((e) => e.n).join(', ')}); rerun parse-winelist.mjs`);

	/* The past: every bottle that has left, at its home printing, in the group of the catalogue that printed it last. */
	const past = [];
	if (ledger && letter) {
		const cats = { ...(opts.catalogues || {}), [letter]: catalogue };
		const missing = Object.keys(ledger.catalogues).filter((l) => !cats[l]);
		for (const l of missing) failures.push(`catalogue ${l} (${ledger.catalogues[l]}) is not given; the past is read from it`);
		if (!missing.length) {
			for (const g of pastBottles(ledger, cats, letter).groups) {
				past.push({ lastPrinted: String(g.catalogue.readOn || ''), source: String(g.catalogue.source || ''), rows: g.rows, entries: g.rows.map((e) => rowOf(e, keyOf(g.letter, e.n), false)), cards: {} });
			}
		}
	}

	const places = {};
	for (const k of [...usedPlaces]) {
		const p = merged.places[k];
		if (!p) { failures.push(`the place ${k} has no title and line in any producer file`); continue; }
		places[k] = p;
	}
	const producers = {};
	for (const k of [...usedProducers].sort()) producers[k] = merged.producers[k];
	const unusedProducers = Object.keys(merged.producers).filter((k) => !usedProducers.has(k));
	if (unusedProducers.length) notes.push(`${unusedProducers.length} producer(s) described but named by no entry, left out: ${unusedProducers.slice(0, 8).join(', ')}${unusedProducers.length > 8 ? ', ...' : ''}`);
	const unusedPlaces = Object.keys(merged.places).filter((k) => !usedPlaces.has(k));
	if (unusedPlaces.length) notes.push(`${unusedPlaces.length} place(s) described but reached by no entry, left out: ${unusedPlaces.slice(0, 8).join('; ')}${unusedPlaces.length > 8 ? '; ...' : ''}`);
	if (pending.length) notes.push(`${pending.length} live entr${pending.length > 1 ? 'ies' : 'y'} pending a producer (written with producer '' and named in pending; check-winelist --release refuses the file)`);

	/* The first tier: every served pack wine on the bottle list, matched to the live rows by bin,
	   vintage and folded size. A bin the list prints in two sections gives one card two entries. A
	   bottle with no bin (the house Champagne) is matched by vintage and size only among the entries
	   whose printed name carries its producer: an empty bin is no evidence, and every binless NV 750ml
	   entry matched it before (a Taittinger and a Pierre Sparr carried the Piper-Heidsieck card). A
	   past wine is matched among the past rows of its group instead: a past bottle must be there, a
	   past glass wine is carded where the glass list printed it. */
	const cards = {};
	const wines = pack && pack.house && Array.isArray(pack.house.wines) ? pack.house.wines : [];
	for (const w of wines) {
		if (isPast(w)) {
			if (!ledger) continue;
			let found = false;
			for (const g of past) for (const e of cardHits(w, g.rows)) {
				found = true;
				if (g.cards[e.n] && g.cards[e.n] !== w.id) failures.push(`past entry ${e.n} of ${g.lastPrinted} matches two pack wines, ${g.cards[e.n]} and ${w.id}`);
				g.cards[e.n] = w.id;
			}
			if (!found && w.list === 'bottle') failures.push(`the pack's past bottle ${w.name} (${w.id}, bin ${w.bin}, ${w.vintage}, ${w.size}) matches no past row by bin, vintage and size`);
			continue;
		}
		if (w.list !== 'bottle') continue;
		const hits = cardHits(w, cat);
		if (!hits.length) { failures.push(`the pack's bottle ${w.name} (${w.id}, bin ${w.bin}, ${w.vintage}, ${w.size}) matches no catalogue entry by bin, vintage and size`); continue; }
		for (const e of hits) {
			if (cards[e.n] && cards[e.n] !== w.id) failures.push(`catalogue entry ${e.n} matches two pack bottles, ${cards[e.n]} and ${w.id}`);
			cards[e.n] = w.id;
		}
	}
	const sortN = (m) => { const o = {}; for (const n of Object.keys(m).map(Number).sort((a, b) => a - b)) o[n] = m[n]; return o; };

	const list = {
		format: WINELIST_FORMAT,
		version: WINELIST_VERSION,
		house: String(catalogue.house || ''),
		readOn: String(catalogue.readOn || ''),
		source: String(catalogue.source || ''),
		sections,
		entries,
		producers,
		places,
		cards: sortN(cards)
	};
	if (past.length) list.past = past.map((g) => ({ lastPrinted: g.lastPrinted, source: g.source, entries: g.entries, cards: sortN(g.cards) }));
	if (pending.length) list.pending = pending;
	return { list, failures, clashes: merged.clashes, notes };
}

/** The file's text: compact, one entry to a line so a diff reads, and a closing newline. The past
    groups come before the live entries, a row to a line, with each group's cards after its rows. */
export function winelistText(list) {
	const head = { ...list };
	delete head.entries;
	delete head.past;
	const lines = list.entries.map((r) => JSON.stringify(r));
	const rest = JSON.stringify(head);
	const past = Array.isArray(list.past) && list.past.length
		? ',"past":[\n' + list.past.map((g) => {
			const gh = { lastPrinted: g.lastPrinted, source: g.source };
			return JSON.stringify(gh).slice(0, -1) + ',"entries":[\n' + g.entries.map((r) => JSON.stringify(r)).join(',\n') + '\n],"cards":' + JSON.stringify(g.cards || {}) + '}';
		}).join(',\n') + '\n]'
		: '';
	return rest.slice(0, -1) + past + ',"entries":[\n' + lines.join(',\n') + '\n]}\n';
}

/* ---------- the command ---------- */

function main() {
	const args = process.argv.slice(2);
	const fail = (msg) => { console.error('build-winelist: ' + msg); process.exit(1); };
	if (args.includes('--help') || args.includes('-h')) {
		console.log(`build-winelist.mjs: the whole bottle list as ${REL(OUT)}, format ${WINELIST_FORMAT} v${WINELIST_VERSION}.

  --producers <a,b,c>  the producer files, comma separated (default: ${PRODUCER_FILES.map(REL).join(', ')})
  --catalogue <file>   the catalogue (default: the ledger's current one, ${REL(CATALOGUE)})
  --ledger <file>      the stable keys (default: ${REL(LEDGER)}); the older catalogues it names are read for the past
  --pending            write a live row whose producer no file describes yet with producer '' and name it
                       in pending, rather than fail (a writer's dry build; check-winelist --release refuses it)
  --pack <file>        the built pack the first tier is read from (default: ${REL(PACK)})
  --out <file>         where to write (default: ${REL(OUT)})
  --dry                build and report, write nothing
  --help               this text

Then run node tools/house/check-winelist.mjs.`);
		process.exit(0);
	}
	const valued = ['--producers', '--catalogue', '--pack', '--out', '--ledger'];
	const known = [...valued, '--dry', '--pending'];
	const opt = {};
	for (let i = 0; i < args.length; i++) {
		const a = args[i];
		if (!known.includes(a)) fail(`unknown argument ${a}; see --help`);
		if (valued.includes(a)) {
			if (i + 1 >= args.length || args[i + 1].startsWith('--')) fail(`${a} needs a value; see --help`);
			opt[a] = args[++i];
		} else opt[a] = true;
	}
	const ledgerFile = path.resolve(opt['--ledger'] || LEDGER);
	if (!fs.existsSync(ledgerFile)) fail(`${REL(ledgerFile)}: the ledger is missing; run node tools/house/carry-winelist.mjs`);
	let ledger;
	try { ledger = JSON.parse(fs.readFileSync(ledgerFile, 'utf8')); } catch (err) { fail(`${REL(ledgerFile)}: does not parse as JSON (${err.message})`); }
	const catPath = (date) => path.join(DIR, 'research', `winelist-${date}.json`);
	const catalogueFile = path.resolve(opt['--catalogue'] || catPath(ledger.catalogues[ledger.current]));
	const packFile = path.resolve(opt['--pack'] || PACK);
	const outFile = path.resolve(opt['--out'] || OUT);
	const producerFiles = opt['--producers'] ? opt['--producers'].split(',').map((f) => path.resolve(f.trim())).filter(Boolean) : PRODUCER_FILES;
	const missing = producerFiles.filter((f) => !fs.existsSync(f));
	if (missing.length) fail(`the producer file${missing.length > 1 ? 's' : ''} ${missing.map(REL).join(', ')} ${missing.length > 1 ? 'are' : 'is'} missing; every bottle needs its producer described (pass --producers to name others)`);
	if (!fs.existsSync(catalogueFile)) fail(`${REL(catalogueFile)}: the catalogue is missing`);
	if (!fs.existsSync(packFile)) fail(`${REL(packFile)}: the pack is missing; the first tier is read from it`);
	const read = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (err) { return fail(`${REL(f)}: does not parse as JSON (${err.message})`); } };
	const catalogue = read(catalogueFile);
	const files = producerFiles.map((file) => ({ file, data: read(file) }));
	const pack = read(packFile);
	const catalogues = {};
	for (const [l, date] of Object.entries(ledger.catalogues || {})) if (fs.existsSync(catPath(date))) catalogues[l] = read(catPath(date));
	const isPast = loadIsPast();
	if (!isPast) fail(`${REL(ENGINE)}: the engine is missing or carries no isPast`);
	const { list, failures, clashes, notes } = buildWinelist(catalogue, files, pack, { ledger, catalogues, isPast, pending: !!opt['--pending'] });
	for (const c of clashes) console.log('  clash: ' + c);
	for (const n of notes) console.log('  note: ' + n);
	if (failures.length) fail(`${failures.length} problem(s), nothing written:\n  ` + failures.join('\n  '));
	const text = winelistText(list);
	const bytes = Buffer.byteLength(text);
	if (!opt['--dry']) fs.writeFileSync(outFile, text);
	console.log(`build-winelist: ${opt['--dry'] ? '(dry, not written) ' : ''}${REL(outFile)}: ${list.entries.length} entries in ${list.sections.length} sections, ${Object.keys(list.producers).length} producers, ${Object.keys(list.places).length} places, ${Object.keys(list.cards).length} with a whole card; ${(list.past || []).reduce((n, g) => n + g.entries.length, 0)} past rows with ${(list.past || []).reduce((n, g) => n + Object.keys(g.cards).length, 0)} past card(s)${list.pending ? `; ${list.pending.length} pending a producer` : ''}; ${clashes.length} clash(es); ${bytes} bytes`);
	const at = letterOf(ledger, catalogue);
	if (list.pending) for (const n of list.pending) { const e = catalogue.entries.find((x) => x.n === n); console.log(`  pending: entry ${n}, key ${ledger.keys[at][n]}: ${e.name} ${e.vintage} ${e.size} bin ${e.bin || 'none'} $${e.price}`); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
