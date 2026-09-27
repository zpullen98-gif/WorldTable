#!/usr/bin/env node
/**
 * Split an expansion run (author-all.workflow.js) into one run file per
 * section, the shape take.mjs reads.
 *
 *   node tools/deck/split-run.mjs <workflow-output.json>
 *
 * Writes tools/deck/out/run.<section>.json as { result: <the section's
 * result> } and prints the take.mjs line for each. A section whose child
 * run returned nothing is named and skipped: re-run it alone.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { OUT_DIR } from './lib.mjs';

const file = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!file) {
	console.error('usage: node tools/deck/split-run.mjs <workflow-output.json>');
	process.exit(1);
}
const top = JSON.parse(readFileSync(file, 'utf8'));
const result = top.result ?? top;
if (!Array.isArray(result.sections)) {
	console.error("  ✗ no sections in that file. Read the run's journal.jsonl before assuming anything was written");
	process.exit(1);
}
for (const line of top.logs ?? []) console.log(`  log: ${line}`);
mkdirSync(OUT_DIR, { recursive: true });
for (const s of result.sections) {
	if (!s.result || !Array.isArray(s.result.cards)) {
		console.log(`  ✗ ${s.key}: no cards returned; re-run that section alone`);
		continue;
	}
	const out = join(OUT_DIR, `run.${s.key}.json`);
	writeFileSync(out, JSON.stringify({ result: s.result }, null, 1) + '\n');
	console.log(`  node tools/deck/take.mjs ${s.key} ${out.split('\\').join('/')}`);
}
