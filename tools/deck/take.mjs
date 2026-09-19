#!/usr/bin/env node
/**
 * Take a workflow's result and lay it out for the operator.
 *
 *   node tools/deck/take.mjs <section> <workflow-output.json> [--pass condensing]
 *
 * The Workflow tool writes its run to a JSON file whose `result` is what the
 * script returned. This saves that as tools/deck/out/<section>.json (a draft
 * merge.mjs can read), and prints what a person has to look at before merging:
 * the counts, every finding of severity `wrong` or `verdict` with what the
 * corrector did about it, anything undisposed or unplaced, and the critic's
 * notes. It decides nothing. The pilot was read this way by hand; this is that
 * reading, kept.
 *
 * `packet` is stripped from every card: the flag lives in the section module
 * and the overlay keeps it, and a condenser that read the module copies it
 * through, which the contract would then refuse as coming from a draft.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DECK_SECTIONS } from '../derive/floor-deck.mjs';
import { OUT_DIR } from './lib.mjs';

const args = process.argv.slice(2);
const [section, file] = args.filter((a) => !a.startsWith('--'));
const pass = args.includes('--pass') ? args[args.indexOf('--pass') + 1] : undefined;
if (!section || !file || !DECK_SECTIONS.some((s) => s.key === section)) {
	console.error('usage: node tools/deck/take.mjs <section> <workflow-output.json> [--pass <name>]');
	process.exit(1);
}

const top = JSON.parse(readFileSync(file, 'utf8'));
const draft = top.result ?? top;
if (!Array.isArray(draft.cards)) {
	console.error('  ✗ no cards in that file. Read the run\'s journal.jsonl before assuming anything was written');
	process.exit(1);
}
if (draft.section && draft.section !== section) {
	console.error(`  ✗ that run wrote "${draft.section}", not "${section}"`);
	process.exit(1);
}
for (const c of draft.cards) delete c.packet;
if (pass) draft.pass = pass;

mkdirSync(OUT_DIR, { recursive: true });
const out = join(OUT_DIR, `${section}.json`);
writeFileSync(out, JSON.stringify(draft, null, 1) + '\n');

const findings = draft.findings ?? [];
const dispositions = new Map((draft.dispositions ?? []).map((d) => [d.finding, d]));
const term = new Map(draft.cards.map((c) => [c.id, c.term]));
const clip = (s, n) => (String(s ?? '').length > n ? String(s).slice(0, n - 1) + '…' : String(s ?? ''));

for (const line of top.logs ?? []) console.log(`  log: ${line}`);
const bySeverity = {};
for (const f of findings) bySeverity[`${f.lens}:${f.severity}`] = (bySeverity[`${f.lens}:${f.severity}`] ?? 0) + 1;
console.log(`\n  ${draft.cards.length} card(s), ${findings.length} finding(s), ${(draft.dispositions ?? []).length} disposition(s), ${(draft.unresolved ?? []).length} unplaced`);
console.log(`  ${Object.entries(bySeverity).map(([k, n]) => `${k} ${n}`).join('  ')}`);

const serious = findings.filter((f) => f.severity === 'wrong' || f.severity === 'verdict');
if (serious.length) console.log(`\n  SERIOUS (${serious.length}): what the refuters caught, and what became of it`);
for (const f of serious) {
	const d = dispositions.get(f.key);
	console.log(`  - [${f.lens}/${f.severity}] ${term.get(f.id) ?? f.id} .${f.field}: ${clip(f.because, 200)}`);
	console.log(`      -> ${d ? `${d.action.toUpperCase()}: ${clip(d.reason, 160)}` : 'NO DISPOSITION'}`);
}

const undisposed = findings.filter((f) => !dispositions.has(f.key));
if (undisposed.length) {
	console.log(`\n  UNDISPOSED (${undisposed.length}): the corrector returned the cards and no ruling. Read each against the card`);
	for (const f of undisposed) console.log(`  - [${f.severity}] ${term.get(f.id) ?? f.id} .${f.field}: ${clip(f.because, 220)}`);
}
for (const u of draft.unresolved ?? []) console.log(`  UNPLACED: ${JSON.stringify(u).slice(0, 240)}`);

if (draft.critic) {
	console.log(`\n  CRITIC ok=${draft.critic.ok}, ${draft.critic.problems?.length ?? 0} problem(s)`);
	for (const p of draft.critic.problems ?? []) console.log(`  - ${term.get(p.id) ?? p.id}: ${clip(p.issue, 220)}`);
	if (draft.critic.notes) console.log(`\n  CRITIC NOTES\n${String(draft.critic.notes).split('\n').map((l) => '    ' + l).join('\n')}`);
}
console.log(`\n  saved ${out.replace(/\\/g, '/')}`);
console.log(`  now: node tools/deck/validate.mjs --draft tools/deck/out/${section}.json --section ${section}`);
