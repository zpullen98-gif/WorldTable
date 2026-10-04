#!/usr/bin/env node
/* thin-lines.mjs: the thin-line worklist of the design's section 5.4 over a built house or a pack,
   by code (short-10, short-20, short-45, menu-line, dup-part, long-part, price-in-profile), then the
   items with an empty part, and the coaching notes each item carries under the fixed questions.
   A report, not a gate: it exits 0 whatever it finds (validate-pack and check-pack hold the gate,
   through engine.mjs thinLines and noteProblems).

   Usage: node house/thin-lines.mjs [--file <house.json or pack>]
   Runs from any directory. */

import fs from 'node:fs';
import { HOUSE_JSON, REL, checkArgs, thinLines, noteCounts } from './engine.mjs';

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
	console.log(`thin-lines.mjs: the thin-line worklist over ${REL(HOUSE_JSON)} (or --file), a report that exits 0.

  --file <path>  another built house, or a pack file read through its house key
  --help         this text`);
	process.exit(0);
}
function fail(msg) { console.error('thin-lines: ' + msg); process.exit(1); }
checkArgs(args, ['--file'], ['--file'], fail);
const at = args.indexOf('--file');
const FILE = at >= 0 ? args[at + 1] : HOUSE_JSON;
if (!FILE || !fs.existsSync(FILE)) fail(`${REL(FILE || '(none)')}: missing; run build-brennans.mjs first`);
const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const house = raw && raw.format === 'oot-house-pack' ? raw.house : raw;
const { fatal, report } = thinLines(house);
const byCode = {};
for (const line of fatal) { const code = (line.match(/: ([a-z0-9-]+): /) || [])[1] || 'other'; (byCode[code] = byCode[code] || []).push(line); }
for (const [code, lines] of Object.entries(byCode)) { console.log(`${code}: ${lines.length}`); for (const l of lines) console.log('    ' + l); }
console.log(`empty-part: ${report.length} item(s)`);
for (const l of report) console.log('    ' + l);
console.log('notes under the fixed questions: ' + Object.entries(noteCounts(house)).map(([q, c]) => `${c} "${q}"`).join(', '));
console.log(`thin-lines: ${REL(FILE)}: ${fatal.length} thin line(s), ${report.length} item(s) with an empty part (a report; exit 0)`);
