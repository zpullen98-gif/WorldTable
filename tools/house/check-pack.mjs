#!/usr/bin/env node
/* check-pack.mjs: the gate that holds the written Brennan's pack.

   Reads packs/brennans-new-orleans.v1.oothouse.json with the engine's readPack (the same door a
   wing imports through), refuses a fatal problem, asserts the counts (54 dishes and cocktails:
   47 dishes, 5 signature drinks, 2 spirit-free; 20 wines; 2 tastings; 13 sources; 60 or more terms;
   28 or more scenarios; 4 or more mix-ups; the must-knows; a lineup register; the five disputes),
   asserts that no string anywhere in the file carries a dash of any spelling, that every id wears
   its list's prefix (h- d- w- b- t- x- s- m- k- a- u-) and is unique, that every mark is by 'person'
   (the pack is the reviewed one), that the pack's format and version are the engine's, and that the
   house readPack returns round-trips through normaliseHouse unchanged, and that no house string
   carries a British spelling (the house is American English; the research is not).

   The guide must be there: the validator's price rule reads it as the page, and without it the
   rule would be skipped in silence. The proper-noun and allergen-talk rules read marks by
   'maitre' only, and every mark here is by 'person', so those two are validate-pack's job on the
   built house before keep-all; this gate does not repeat them and does not need the research.

   Usage: node house/check-pack.mjs [--file <pack>] [--verbose]
   Runs from any directory. Exits 1 with the file and the rule on failure, one line on success. */

import fs from 'node:fs';
import { loadEngine, GUIDE, PACK, REL, countProblems, describe, eachString, answerNames, britishWords, checkArgs } from './engine.mjs';

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
	console.log(`check-pack.mjs: hold ${REL(PACK)} to the engine's rules and the Brennan's counts.

  --file <path>  check another pack file
  --verbose      print every advisory flag by code
  --help         this text`);
	process.exit(0);
}
const fileAt = args.indexOf('--file');
const FILE = fileAt >= 0 ? args[fileAt + 1] : PACK;
const VERBOSE = args.includes('--verbose');
const failures = [];
const F = (msg) => failures.push(`${REL(FILE)}: ${msg}`);
function fail(msg) { console.error('check-pack: ' + msg); process.exit(1); }
checkArgs(args, ['--file', '--verbose'], ['--file'], fail);
if (!FILE || !fs.existsSync(FILE)) fail(`${REL(FILE)}: missing; run keep-all.mjs first`);
if (!fs.existsSync(GUIDE)) fail(`${REL(GUIDE)}: missing; the price rule reads it as the page`);

const lib = loadEngine(fail);
const C = lib.constants;
const text = fs.readFileSync(FILE, 'utf8');
let raw;
try { raw = JSON.parse(text); } catch (e) { fail(`${REL(FILE)}: not JSON: ${e.message}`); }
if (raw.format !== C.PACK_FORMAT) F(`format reads ${raw.format}, expected ${C.PACK_FORMAT}`);
if (raw.version !== C.PACK_VERSION) F(`version reads ${raw.version}, expected ${C.PACK_VERSION}`);
if (!raw.app || raw.app.from !== 'claude-code') F('app.from is not claude-code');

const read = lib.readPack(text, { fatal: C.FATAL_CODES });
if (!read.ok) fail(`${REL(FILE)}: readPack refused it: ${read.said}`);
const house = read.house;
const changed = read.report.filter((r) => r.code === 'id' || r.code === 'forbidden');
for (const r of changed) F(`readPack changed ${r.path}: ${r.said}`);
if (!lib.sameJson(house, raw.house)) F('the house read differs from the house in the file (a key outside the shape, or a stamp that was not a number)');

/* No dash of any spelling anywhere in the file, keys included. */
let dashes = 0;
eachString(raw, 'pack', (where, s) => { if (lib.hasDash(s)) { dashes++; if (dashes <= 5) F(`${where} carries a dash`); } });
if (dashes > 5) F(`${dashes} strings carry a dash in all`);
if (new RegExp([0x2014, 0x2013].map((c) => String.fromCharCode(c)).join('|') + '| ' + '--' + ' ').test(text)) F('the file text carries a dash');

/* No British spelling in any house string: the house is American English. */
let british = 0;
eachString(raw.house, 'house', (where, s) => {
	const found = britishWords(s);
	if (found.length) { british++; if (british <= 5) F(`${where} carries a British spelling: ${found.join(', ')}`); }
});
if (british > 5) F(`${british} strings carry a British spelling in all`);

/* Every id wears its prefix and is unique; every reference points home. */
const seen = new Set();
const idOk = (id, prefix, where) => {
	if (typeof id !== 'string' || !id.startsWith(prefix)) F(`${where}: the id ${id} does not start with ${prefix}`);
	if (/[|:]/.test(id)) F(`${where}: the id ${id} carries a pipe or a colon`);
	if (C.FORBIDDEN_KEY.test(id)) F(`${where}: the id ${id} would be refused as a key`);
	if (seen.has(id)) F(`${where}: the id ${id} is used twice`);
	seen.add(id);
};
idOk(house.id, C.ID_PREFIXES.house, 'house');
for (const list of C.HOUSE_LISTS) house[list].forEach((row, i) => idOk(row.id, C.ID_PREFIXES[list], `${list}[${i}]`));
for (const list of ['dishes', 'wines', 'cocktails']) for (const row of house[list]) if (row.house !== house.id) F(`${list} ${row.name}: house is ${row.house}, not ${house.id}`);

/* Every mark by person; every item carries the formula where the guide printed it. */
let marks = 0;
let unkept = 0;
for (const field of C.MARK_FIELDS.house) if (lib.isMark(house[field])) { marks++; if (house[field].by !== 'person') unkept++; }
for (const list of C.HOUSE_LISTS) for (const row of house[list]) for (const field of C.MARK_FIELDS[list]) {
	if (!lib.isMark(row[field])) continue;
	marks++;
	if (row[field].by !== 'person') { unkept++; if (unkept <= 5) F(`${list} ${row.name || row.term || row.title || row.id}.${field} is by ${row[field].by}, not person`); }
}
if (unkept > 5) F(`${unkept} marks are not by person in all`);
for (const d of house.dishes) {
	if (!d.parts || !d.lines) F(`dish ${d.name} lacks parts or lines`);
	if (d.section !== 'Sides' && !d.pairing) F(`dish ${d.name} lacks a pairing`);
	if (!d.say || !d.guest) F(`dish ${d.name} lacks say or guest`);
}
for (const w of house.wines) if (!w.profile || !w.goesWith || !w.serve || !w.parts || !w.producer || !w.grapes.length) F(`wine ${w.name} lacks a profile, goesWith, serve, parts, producer or grapes`);
for (const c of house.cocktails) if (!c.spec.length || !c.parts) F(`cocktail ${c.name} lacks a spec or parts`);
for (const t of house.tastings) for (const c of t.courses) if (!c.dishIds.length && !c.pourId) F(`tasting ${t.name} course ${c.n} names no dish and no pour`);

/* The counts, the validator with the guide as the page, and the round trip. */
for (const c of countProblems(house)) F('count: ' + c);
const { problems, fatalCount } = lib.validateHouse(house, { sourceText: fs.readFileSync(GUIDE, 'utf8'), fatal: C.FATAL_CODES });
for (const p of problems) if (p.fatal) F(`FATAL ${p.code} ${describe(house, p.path)}: ${p.said}`);
const flags = {};
for (const p of problems) if (!p.fatal) flags[p.code] = (flags[p.code] || 0) + 1;
if (VERBOSE) for (const p of problems) if (!p.fatal) console.log(`  flag ${p.code} ${describe(house, p.path)}: ${p.said}`);
const names = answerNames(problems).filter((n) => !n.answered);
for (const n of names) F(`the name ${n.name} is in neither the guide nor the research (${n.where[0]})`);
const again = lib.normaliseHouse(house);
if (!lib.sameJson(again.house, house)) F('the house does not round-trip through normaliseHouse unchanged');
if (again.report.some((r) => r.code === 'id' || r.code === 'forbidden')) F('normaliseHouse re-minted an id or dropped a key on the round trip');

if (failures.length) {
	for (const f of failures) console.error('check-pack: ' + f);
	fail(`${failures.length} failure(s)`);
}
const zero = house.cocktails.filter((c) => c.zeroProof).length;
console.log(`check-pack: ${REL(FILE)}: ${Buffer.byteLength(text)} bytes; ${house.dishes.length} dishes, ${house.cocktails.length} cocktails (${zero} spirit-free), ${house.wines.length} wines, ${house.tastings.length} tastings, ${house.sources.length} sources, ${house.lexicon.length} terms, ${house.scenarios.length} scenarios, ${house.mixUps.length} mix-ups, ${house.mustKnows.length} must-knows, ${house.askAtLineup.length} to ask, ${house.disputes.length} disputes; ${marks} marks all by person; 0 dashes; 0 British spellings; ids ${seen.size} unique with their prefixes; 0 fatal; advisory ${JSON.stringify(flags)}; round trip holds`);
