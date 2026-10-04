#!/usr/bin/env node
/* check-pack.mjs: the gate that holds the written Brennan's pack.

   Reads packs/brennans-new-orleans.v1.oothouse.json with the engine's readPack (the same door a
   wing imports through), refuses a fatal problem, asserts the counts engine.mjs countProblems
   names (the dishes with the children's menu and the Bubbles snacks, every drink the house pours
   with the coffees and the juice among the zero-proof ones, 20 wines, the tastings, the sources,
   the terms, the scenarios, the mix-ups, the must-knows, the lineup register, the disputes),
   holds the edition rule (every mark, every kept note and every record carries exactly
   Date.parse(house.pack.builtAt)), holds every drink to its parts, lines and two or three upsells
   that are other house drinks, a spirit-free drink's upsells to spirit-free drinks, every wine to
   its timed lines, and every children's plate to no pairing at all, holds every drill stem to one
   record (engine.mjs stemProblems) and every upsell to a drink poured where the guest sits
   (upsellRoomProblems),
   asserts that no string anywhere in the file carries a dash of any spelling, that every id wears
   its list's prefix (h- d- w- b- t- x- s- m- k- a- u- v-) and is unique, that every mark is by 'person'
   (the pack is the reviewed one), that the pack's format and version are the engine's, and that the
   house readPack returns round-trips through normaliseHouse unchanged, and that no house string
   carries a British spelling (the house is American English; the research is not), and that every
   dish, drink and wine carries its description and its coaching notes under the fixed questions
   and no line is thin (engine.mjs noteProblems and thinLines, the 22:00 edition's content).

   The guide must be there: the validator's price rule reads it as the page, and without it the
   rule would be skipped in silence. The proper-noun and allergen-talk rules read marks by
   'maitre' only, and every mark here is by 'person', so those two are validate-pack's job on the
   built house before keep-all; this gate does not repeat them and does not need the research.

   Usage: node house/check-pack.mjs [--file <pack>] [--verbose]
   Runs from any directory. Exits 1 with the file and the rule on failure, one line on success. */

import fs from 'node:fs';
import { loadEngine, GUIDE, PACK, REL, countProblems, describe, eachString, answerNames, britishWords, checkArgs, editionInFuture, sourceText as pageText, CHILD_SECTIONS, SNACK_SECTION, stemProblems, upsellRoomProblems, noteProblems, noteHay, noteCounts, thinLines, FIXED_QS } from './engine.mjs';

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

/* No British spelling in any house string: the house is American English. A video's title and channel
   are quoted as published (a British channel spells as it spells) and are the one exception. */
let british = 0;
const QUOTED = /^house\.videos\[\d+\]\.(title|channel)$/;
eachString(raw.house, 'house', (where, s) => {
	if (QUOTED.test(where)) return;
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
for (const list of C.HOUSE_LISTS) (house[list] || []).forEach((row, i) => idOk(row.id, C.ID_PREFIXES[list], `${list}[${i}]`));
for (const list of ['dishes', 'wines', 'cocktails']) for (const row of house[list]) if (row.house !== house.id) F(`${list} ${row.name}: house is ${row.house}, not ${house.id}`);

/* Every mark by person; every item carries the formula where the guide printed it. */
let marks = 0;
let unkept = 0;
for (const field of C.MARK_FIELDS.house) if (lib.isMark(house[field])) { marks++; if (house[field].by !== 'person') unkept++; }
for (const list of C.HOUSE_LISTS) for (const row of house[list] || []) for (const field of C.MARK_FIELDS[list]) {
	if (!lib.isMark(row[field])) continue;
	marks++;
	if (row[field].by !== 'person') { unkept++; if (unkept <= 5) F(`${list} ${row.name || row.term || row.title || row.id}.${field} is by ${row[field].by}, not person`); }
}
if (unkept > 5) F(`${unkept} marks are not by person in all`);
for (const d of house.dishes) {
	if (!d.parts || !d.lines) F(`dish ${d.name} lacks parts or lines`);
	const child = CHILD_SECTIONS.includes(d.section);
	if (d.section !== 'Sides' && !child && d.section !== SNACK_SECTION && !d.pairing) F(`dish ${d.name} lacks a pairing`);
	if (child && (d.pairing || d.pairs)) F(`dish ${d.name} is a child's plate and carries a pairing; none is ever invented for one`);
	if (!d.say || !d.guest) F(`dish ${d.name} lacks say or guest`);
	if (d.section !== 'Sides' && !d.why) F(`dish ${d.name} lacks a why line`);
}
/* A wine's grapes may be empty only where no source names them and a lineup ask sends the blend to the
   sommelier (from the 01:30 edition of 4 October 2026: the Birthday Bubbles bottles and the Bubbles rosés). */
const blendAsked = new Set(house.askAtLineup.filter((a) => a.askWhom === 'sommelier' && /\b(grapes?|blend)\b/i.test(a.question)).flatMap((a) => a.itemIds));
for (const w of house.wines) {
	if (!w.profile || !w.goesWith || !w.serve || !w.parts || !w.producer || !(w.grapes.length || blendAsked.has(w.id))) F(`wine ${w.name} lacks a profile, goesWith, serve, parts, producer or grapes (or a sommelier ask for the blend)`);
	if (!w.lines || !w.lines.value.s10 || !w.lines.value.s20 || !w.lines.value.s45) F(`wine ${w.name} lacks the three timed lines`);
}
const drinkIds = new Map(house.cocktails.map((c) => [c.id, c]));
for (const c of house.cocktails) {
	if (!c.spec.length || !c.parts) F(`cocktail ${c.name} lacks a spec or parts`);
	if (!c.lines || !c.say || !c.guest || !c.why) F(`cocktail ${c.name} lacks the timed lines, say, guest or why`);
	const ups = c.upsells ? c.upsells.value : [];
	if (ups.length < 2 || ups.length > 3) F(`cocktail ${c.name} carries ${ups.length} upsells; every drink carries two or three`);
	for (const id of ups) {
		const to = drinkIds.get(id);
		if (!to || id === c.id) F(`cocktail ${c.name}: the upsell ${id} is not another house drink`);
		else if (c.zeroProof && !to.zeroProof) F(`cocktail ${c.name} is spirit-free and upsells ${to.name}, which is not`);
	}
}
/* Every zero-proof pick a pairing names in its words resolves to a drink when the house pours one by that name. */
const coffees = house.dishes.filter((d) => d.pairing && d.pairing.value.zeroProofId && /coffee/i.test((drinkIds.get(d.pairing.value.zeroProofId) || {}).family || '')).length;
if (coffees !== 9) F(`${coffees} pairings take a coffee as their zero-proof pick, expected the guide's 9`);

/* The edition rule: one stamp, Date.parse(house.pack.builtAt), on every mark, kept note and record. */
const EDITION = house.pack ? Date.parse(house.pack.builtAt) : NaN;
if (!Number.isFinite(EDITION)) F('house.pack.builtAt is not a date');
if (editionInFuture(EDITION)) F(editionInFuture(EDITION));
let offStamp = 0;
const stampOk = (ts, where) => { if (ts !== EDITION) { offStamp++; if (offStamp <= 5) F(`${where} carries ${ts}, not the edition stamp ${EDITION}`); } };
for (const field of C.MARK_FIELDS.house) if (lib.isMark(house[field])) stampOk(house[field].ts, 'house.' + field);
for (const list of C.HOUSE_LISTS) (house[list] || []).forEach((row, i) => {
	stampOk(row.ts, `${list}[${i}].ts`);
	for (const field of C.MARK_FIELDS[list]) if (lib.isMark(row[field])) stampOk(row[field].ts, `${list}[${i}].${field}`);
	if (Array.isArray(row.kept)) row.kept.forEach((k, j) => stampOk(k.ts, `${list}[${i}].kept[${j}]`));
});
for (const step of Object.keys(house.build || {})) stampOk(house.build[step], 'house.build.' + step);
stampOk(house.lastWrite, 'house.lastWrite');
if (offStamp > 5) F(`${offStamp} stamps differ from the edition stamp in all`);
for (const t of house.tastings) for (const c of t.courses) if (!c.dishIds.length && !c.pourId) F(`tasting ${t.name} course ${c.n} names no dish and no pour`);

/* No two records share a drill stem, no filler part or unconfirmed glass is drilled, and every
   upsell is poured where the guest who is offered it sits. */
for (const s of stemProblems(house)) F('stem: ' + s);
for (const r of upsellRoomProblems(house)) F('upsell-room: ' + r);

/* The coaching notes (the design's sections 5.2 to 5.6): every dish, drink and wine carries one
   description under "Tell me about it." and its coaching notes under the fixed questions, each once,
   in its word range, with its quoted line, its Asked and Answer pairs or its closing sentence, no
   dash, no banned word, no allergen talk, every price printed and every name and year in a source;
   and no timed line, guest line or wine part is thin (engine.mjs noteProblems and thinLines). The
   notes are kept, so they carry the edition stamp like every other kept note (checked above). */
for (const n of noteProblems(house, noteHay(), lib.onPage)) F('note: ' + n);
const thin = thinLines(house);
for (const t of thin.fatal) F('thin: ' + t);
const nc = noteCounts(house);
const want = { dishes: 4, cocktails: 5, wines: 5 };
for (const list of Object.keys(want)) for (const row of house[list]) {
	const fixed = (row.kept || []).filter((k) => FIXED_QS.includes(k.q)).length;
	if (fixed < want[list] - (list === 'cocktails' ? 1 : 0) || fixed > want[list]) F(`${list} ${row.name} carries ${fixed} notes under the fixed questions`);
}

/* The counts, the validator with the guide as the page, and the round trip. */
for (const c of countProblems(house)) F('count: ' + c);
const { problems, fatalCount } = lib.validateHouse(house, { sourceText: pageText(fail), fatal: C.FATAL_CODES });
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
console.log(`check-pack: ${REL(FILE)}: ${Buffer.byteLength(text)} bytes; edition ${house.pack.builtAt}, every stamp ${EDITION}; ${house.dishes.length} dishes, ${house.cocktails.length} cocktails (${zero} spirit-free, ${coffees} pairings on a coffee), ${house.wines.length} wines (${house.wines.filter((w) => w.lines).length} with timed lines), ${house.tastings.length} tastings, ${house.sources.length} sources, ${house.lexicon.length} terms, ${house.scenarios.length} scenarios, ${house.mixUps.length} mix-ups, ${house.mustKnows.length} must-knows, ${house.askAtLineup.length} to ask, ${house.disputes.length} disputes; ${marks} marks all by person; notes ${FIXED_QS.map((q) => nc[q]).join('/')} under the five fixed questions, ${house.dishes.concat(house.cocktails, house.wines).reduce((t, r) => t + (r.kept || []).length, 0)} kept notes in all; 0 thin lines; 0 dashes; 0 British spellings; ids ${seen.size} unique with their prefixes; 0 fatal; advisory ${JSON.stringify(flags)}; round trip holds`);
