#!/usr/bin/env node
/* keep-all.mjs: the built house with every mark flipped to by 'person', written as the pack.

   THE EDITION RULE. The pack carries house.pack = { id, builtBy, builtAt, version: 1 }, and this
   tool stamps every mark (kept or not before the run), every kept note, every record's ts on every
   list, the build steps and lastWrite with exactly Date.parse(house.pack.builtAt). A mark or a
   record on a device that still carries that one stamp is the edition's own; any other stamp was
   a person's edit there. The default builtAt is engine.mjs EDITION_BUILT_AT, fixed, so a rebuild
   is byte for byte the same; --stamp or --now set another for a fresh edition.

   The owner has asked for the Brennan's pack as reviewed, so with --owner-reviewed every mark the
   build wrote by 'maitre' (the card's history, every mark on every dish, wine, cocktail, term,
   scenario, mix-up and must-know) becomes by 'person' with a fresh stamp, which is what kept means
   to every wing and every drill. Without the flag the tool refuses: the flip is the owner's act.

   Before the flip the house is held to the same bar validate-pack holds it to: the normaliser
   must not have changed it (a key outside the shape, a blank mark, a mark by nobody coerced to
   'maitre') and validateHouse with FATAL_CODES must find nothing fatal while the marks are still
   by 'maitre', because the engine's allergen-talk, proper-noun and quote rules read only marks of
   hers and would be vacuous after the flip. The pack is then written through the engine's
   buildPack (format oot-house-pack, version 1, app.from 'claude-code') to
   packs/brennans-new-orleans.v1.oothouse.json, read back with readPack and validated again
   against the guide as a second check; a fatal problem on the re-read fails the run after the
   write so the file can be inspected.

   Usage: node house/keep-all.mjs --owner-reviewed [--stamp <ms>] [--file <house.json>]
   Runs from any directory. Exits 1 with the file and the rule on failure. */

import fs from 'node:fs';
import path from 'node:path';
import { loadEngine, GUIDE, HOUSE_JSON, PACK, REL, countProblems, describe, checkArgs, sourceText as pageText, EDITION_TS, editionInFuture, noteProblems, noteHay, thinLines } from './engine.mjs';

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
	console.log(`keep-all.mjs: flip every mark in ${REL(HOUSE_JSON)} to by 'person' and write ${REL(PACK)}.

  --owner-reviewed  required: the owner has reviewed the pack and asks for every mark kept
  --stamp <ms>      the stamp on the flipped marks and the pack (default: the shipped edition's fixed stamp; --now takes the clock)
  --file <path>     another built house to keep
  --help            this text`);
	process.exit(0);
}
function fail(msg) { console.error('keep-all: ' + msg); process.exit(1); }
checkArgs(args, ['--owner-reviewed', '--stamp', '--file', '--now'], ['--stamp', '--file'], fail);
if (!args.includes('--owner-reviewed')) fail('refused: every mark is flipped to a person\'s only with --owner-reviewed, the owner\'s own say so');
const fileAt = args.indexOf('--file');
const FILE = fileAt >= 0 ? args[fileAt + 1] : HOUSE_JSON;
const stampAt = args.indexOf('--stamp');
/* Fixed by default so a rebuild is byte for byte the pack that shipped (the mirror gate holds the
   site's copy to this one): --stamp sets another, --now takes the clock for a fresh edition. */
const KEEP_TS = stampAt >= 0 ? Number(args[stampAt + 1]) : args.includes('--now') ? Date.now() : EDITION_TS;
if (!Number.isFinite(KEEP_TS)) fail('--stamp must be a number of milliseconds');
if (editionInFuture(KEEP_TS)) fail(editionInFuture(KEEP_TS));
if (!FILE || !fs.existsSync(FILE)) fail(`${REL(FILE)}: missing; run build-brennans.mjs first`);
if (!fs.existsSync(GUIDE)) fail(`${REL(GUIDE)}: missing`);

const lib = loadEngine(fail);
const C = lib.constants;
const input = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const { house, report } = lib.normaliseHouse(input);
const changed = report.filter((r) => r.code === 'id' || r.code === 'forbidden');
if (changed.length) fail(`${REL(FILE)}: the normaliser changed it: ` + changed.map((r) => r.path + ' ' + r.said).join('; '));
if (!lib.sameJson(house, input)) fail(`${REL(FILE)}: the normaliser changed the record (a key outside the shape, a blank mark, a mark by nobody, or a stamp that was not a number); run validate-pack for the detail`);

/* The validator over the unflipped house, while her marks are still hers. */
const sourceText = pageText(fail);
const before = lib.validateHouse(house, { sourceText, fatal: C.FATAL_CODES });
for (const p of before.problems) if (p.fatal) console.error(`keep-all: FATAL ${p.code} ${describe(house, p.path)}: ${p.said}`);
if (before.fatalCount) fail(`${REL(FILE)}: ${before.fatalCount} fatal problem(s) before the flip; nothing written`);
/* The coaching notes and the thin lines, held before anything is written (validate-pack and
   check-pack hold them too): a pack that would fail the gate is never written. */
const noteBad = noteProblems(house, noteHay(), lib.onPage).concat(thinLines(house).fatal);
for (const n of noteBad) console.error('keep-all: FATAL ' + n);
if (noteBad.length) fail(`${REL(FILE)}: ${noteBad.length} note or thin-line problem(s) before the flip; nothing written`);

/* Every mark field on every list, and the card's history, by the engine's own MARK_FIELDS. */
let flipped = 0;
let already = 0;
function flip(owner, field) {
	const m = owner[field];
	if (!lib.isMark(m)) return;
	if (m.by === 'person') already++;
	else flipped++;
	owner[field] = { value: m.value, by: 'person', ts: KEEP_TS };
}
for (const field of C.MARK_FIELDS.house) flip(house, field);
for (const list of C.HOUSE_LISTS) {
	const fields = C.MARK_FIELDS[list];
	if (!fields.length) continue;
	for (const row of house[list]) for (const field of fields) flip(row, field);
}
/* Every record's ts and every kept note's ts carry the edition stamp too, and so do the build
   steps and lastWrite: one stamp across the whole edition. */
let records = 0;
for (const list of C.HOUSE_LISTS) for (const row of house[list]) {
	row.ts = KEEP_TS;
	records++;
	if (Array.isArray(row.kept)) {
		for (const note of row.kept) note.ts = KEEP_TS;
		/* In mergeKept's order (stamp, then question): with one stamp across the edition, any other
		   order is rewritten by the first sync on a device, and a second boot then writes. */
		row.kept.sort((x, y) => x.ts - y.ts || (x.q < y.q ? -1 : x.q > y.q ? 1 : 0));
	}
}
for (const step of Object.keys(house.build)) house.build[step] = KEEP_TS;
const builtAt = new Date(KEEP_TS).toISOString();
house.pack = { id: house.pack && house.pack.id ? house.pack.id : 'brennans-new-orleans', builtBy: house.pack && house.pack.builtBy ? house.pack.builtBy : 'claude-code', builtAt, version: 1 };
if (Date.parse(house.pack.builtAt) !== KEEP_TS) fail(`the pack's builtAt ${house.pack.builtAt} does not parse back to the stamp ${KEEP_TS}`);
let left = 0;
lib.forbiddenKeys(house, 'house', []);
const walk = (v) => {
	if (!v || typeof v !== 'object') return;
	if (Array.isArray(v)) { v.forEach(walk); return; }
	if (lib.isMark(v) && v.by === 'maitre') left++;
	for (const k of Object.keys(v)) walk(v[k]);
};
walk(house);
if (left) fail(`${left} mark(s) are still by 'maitre' after the flip; a mark sits on a field MARK_FIELDS does not list`);
house.lastWrite = KEEP_TS;

const pack = lib.buildPack(house, 'claude-code', KEEP_TS);
fs.mkdirSync(path.dirname(PACK), { recursive: true });
fs.writeFileSync(PACK, JSON.stringify(pack, null, '\t') + '\n');

/* Read it back the way a wing would, and validate it again. */
const read = lib.readPack(fs.readFileSync(PACK, 'utf8'), { fatal: C.FATAL_CODES });
if (!read.ok) fail(`${REL(PACK)}: readPack refused it: ${read.said}`);
if (!lib.sameJson(read.house, house)) fail(`${REL(PACK)}: the house read back differs from the house written`);
const { problems, fatalCount } = lib.validateHouse(read.house, { sourceText, fatal: C.FATAL_CODES });
for (const p of problems) if (p.fatal) console.error(`keep-all: FATAL ${p.code} ${describe(read.house, p.path)}: ${p.said}`);
const counts = countProblems(read.house);
for (const c of counts) console.error('keep-all: count: ' + c);
if (fatalCount || counts.length) fail(`${REL(PACK)}: ${fatalCount} fatal problem(s) and ${counts.length} count(s) off on the re-read`);
const flags = {};
for (const p of problems) flags[p.code] = (flags[p.code] || 0) + 1;
console.log(`keep-all: ${REL(PACK)}: ${flipped} marks flipped to person (${already} already), every mark and ${records} records stamped ${KEEP_TS} (builtAt ${builtAt}), ${fs.statSync(PACK).size} bytes on disk, read back and valid; advisory flags ${JSON.stringify(flags)}`);
