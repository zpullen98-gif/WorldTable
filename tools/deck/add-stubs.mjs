#!/usr/bin/env node
/**
 * Write an expansion roster into the section modules as stubs.
 *
 *   node tools/deck/add-stubs.mjs <roster-run.json> [--only cuts,fish]
 *
 * The input is what roster.workflow.js returned (or the Workflow tool's run
 * file, whose `result` is that object): { sections: [{ key, proposals:
 * [{ term, level, reason, ... }] }], critic }. For every proposal this adds
 * `{ id: 'NEW', term, planned: true }` to the section module through the one
 * serializer, refuses a term the deck already carries under any term or
 * alias (folded), and records the intended level and the reason in
 * tools/deck/out/expansion.levels.json, which brief.mjs reads so the writer
 * gives the card that level. The argument (proposals, challenges,
 * dispositions, the critic) goes to tools/deck/audit/expansion.json.
 *
 * Then: node tools/deck/mint-ids.mjs, and the ordinary section procedure.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DECK_SECTIONS } from '../derive/floor-deck.mjs';
import { AUDIT_DIR, OUT_DIR, loadSection, writeSection } from './lib.mjs';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
if (!file) {
	console.error('usage: node tools/deck/add-stubs.mjs <roster-run.json> [--only cuts,fish]');
	process.exit(1);
}
const top = JSON.parse(readFileSync(file, 'utf8'));
const result = top.result ?? top;
if (!Array.isArray(result.sections)) {
	console.error("  ✗ no sections in that file. Read the run's journal.jsonl before assuming anything was decided");
	process.exit(1);
}

const fold = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const known = new Map();
const all = new Map();
for (const s of DECK_SECTIONS) {
	const cards = await loadSection(s.key);
	all.set(s.key, cards);
	for (const c of cards) for (const n of [c.term, ...(c.aliases ?? [])]) if (!known.has(fold(n))) known.set(fold(n), `${c.id} ${c.term} (${s.key})`);
}

const levelsFile = join(OUT_DIR, 'expansion.levels.json');
const levels = existsSync(levelsFile) ? JSON.parse(readFileSync(levelsFile, 'utf8')) : {};
const added = [];
const skipped = [];
for (const sec of result.sections) {
	if (only && !only.has(sec.key)) continue;
	const cards = all.get(sec.key);
	if (!cards) { skipped.push(`${sec.key}: not a section`); continue; }
	let changed = false;
	for (const p of sec.proposals ?? []) {
		const k = fold(p.term);
		if (known.has(k)) { skipped.push(`${sec.key} "${p.term}": already ${known.get(k)}`); continue; }
		if (![3, 4].includes(p.level)) { skipped.push(`${sec.key} "${p.term}": level ${p.level} is not 3 or 4`); continue; }
		cards.push({ id: 'NEW', term: p.term, planned: true });
		known.set(k, `NEW ${p.term} (${sec.key})`);
		levels[`${sec.key}|${p.term}`] = { level: p.level, reason: p.reason, lexiconSlug: p.lexiconSlug };
		added.push(`${sec.key} ${p.term} (L${p.level})`);
		changed = true;
	}
	if (changed) writeSection(sec.key, cards);
}
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(levelsFile, JSON.stringify(levels, null, 1) + '\n');
mkdirSync(AUDIT_DIR, { recursive: true });
writeFileSync(join(AUDIT_DIR, 'expansion.json'), JSON.stringify({ sections: result.sections, critic: result.critic ?? null }, null, 1) + '\n');

console.log(`\n  ${added.length} stub(s) added:`);
for (const a of added) console.log(`  + ${a}`);
for (const s of skipped) console.log(`  ✗ skipped ${s}`);
console.log('\n  now: node tools/deck/mint-ids.mjs, then per section: brief, write, take, validate, merge');
