#!/usr/bin/env node
/* validate-pack.mjs: the built Brennan's house through the engine's normaliseHouse, then
   validateHouse(house, { sourceText: guide.txt, fatal: FATAL_CODES }); every problem printed by
   code with the item and the field; the counts asserted; exit 1 on any fatal, any count that is
   off, or a proper-noun flag that neither the guide nor the research answers.

   The advisory codes are printed and counted: service-note flags are expected on every item whose
   service note names an allergen without the word confirm (the note is a person's words and
   stands); proper-noun flags are each looked up in the guide and the research directory, and one
   found in neither is a name that was invented, which fails the run; quote flags are listed.

   Usage: node house/validate-pack.mjs [--file <house.json>] [--verbose]
   Runs from any directory. Reads house/brennans/house.json by default (the builder's output). */

import fs from 'node:fs';
import { loadEngine, GUIDE, HOUSE_JSON, REL, countProblems, describe, answerNames, checkArgs } from './engine.mjs';

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
	console.log(`validate-pack.mjs: normalise and validate ${REL(HOUSE_JSON)} against ${REL(GUIDE)}.

  --file <path>  validate another house file (a pack file is read through its house key)
  --verbose      print every advisory flag, not only the counts
  --help         this text`);
	process.exit(0);
}
function fail(msg) { console.error('validate-pack: ' + msg); process.exit(1); }
checkArgs(args, ['--file', '--verbose'], ['--file'], fail);
const fileAt = args.indexOf('--file');
const FILE = fileAt >= 0 ? args[fileAt + 1] : HOUSE_JSON;
const VERBOSE = args.includes('--verbose');
if (!FILE || !fs.existsSync(FILE)) fail(`${REL(FILE || '(none)')}: missing; run build-brennans.mjs first`);
if (!fs.existsSync(GUIDE)) fail(`${REL(GUIDE)}: missing`);

const lib = loadEngine(fail);
const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const input = raw && raw.format === 'oot-house-pack' ? raw.house : raw;
const { house, report } = lib.normaliseHouse(input);
const changed = report.filter((r) => r.code === 'id' || r.code === 'forbidden');
for (const r of changed) console.error(`validate-pack: normaliser ${r.code} at ${r.path}: ${r.said}`);
if (!lib.sameJson(house, input)) console.error('validate-pack: the normaliser changed the record (a key outside the shape, a blank mark or a stamp that was not a number)');

const sourceText = fs.readFileSync(GUIDE, 'utf8');
const { problems, fatalCount } = lib.validateHouse(house, { sourceText, fatal: lib.constants.FATAL_CODES });

const byCode = new Map();
for (const p of problems) { if (!byCode.has(p.code)) byCode.set(p.code, []); byCode.get(p.code).push(p); }
for (const [code, list] of byCode) {
	const fatal = list[0].fatal;
	console.log(`${fatal ? 'FATAL' : 'flag '} ${code}: ${list.length}`);
	if (fatal || VERBOSE) for (const p of list) console.log(`    ${describe(house, p.path)}: ${p.said}`);
}
const names = answerNames(problems);
const unanswered = names.filter((n) => !n.answered);
if (names.length) {
	console.log(`proper nouns flagged: ${names.length} distinct names, ${names.length - unanswered.length} found in the guide or the research, ${unanswered.length} found in neither`);
	if (VERBOSE) for (const n of names) console.log(`    ${n.answered ? 'answered  ' : 'UNANSWERED'} ${n.name} (${n.count}) ${n.where[0]}`);
	for (const n of unanswered) console.log(`    UNANSWERED ${n.name} (${n.count}) at ${n.where.join(', ')}`);
}
const counts = countProblems(house);
for (const c of counts) console.error('validate-pack: count: ' + c);

const bad = fatalCount + counts.length + changed.length + unanswered.length + (lib.sameJson(house, input) ? 0 : 1);
if (bad) fail(`${REL(FILE)}: ${fatalCount} fatal problem(s), ${counts.length} count(s) off, ${changed.length} normaliser change(s), ${unanswered.length} unanswered name(s)`);
console.log(`validate-pack: ${REL(FILE)}: 0 fatal, ${problems.length} advisory flag(s) in ${byCode.size} code(s), counts hold (${house.dishes.length} dishes, ${house.cocktails.length} cocktails, ${house.wines.length} wines, ${house.tastings.length} tastings, ${house.lexicon.length} terms, ${house.scenarios.length} scenarios, ${house.mixUps.length} mix-ups, ${house.mustKnows.length} must-knows, ${house.askAtLineup.length} to ask, ${house.disputes.length} disputes)`);
