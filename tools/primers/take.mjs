#!/usr/bin/env node
/**
 * Take a primers run and lay it out for the operator.
 *
 *   node tools/primers/take.mjs <workflow-output.json> [--only 1-techniques,2-deck]
 *
 * The Workflow tool writes its run to a JSON file whose `result` is what the
 * script returned. This writes each primer it holds to
 * tools/derive/primers/<level>-<subsection>.json (the authored file the build
 * gates) and each level's findings, dispositions and critic to
 * tools/primers/audit/<level>.json (merged by primer key with what an
 * earlier run wrote, so a re-run of two primers keeps the other six), and
 * prints what a person has to read before committing: the counts, every
 * finding of severity `wrong` or `misplaced` with what the corrector did
 * about it, anything undisposed, and each critic's problems and notes. It
 * decides nothing; `npm run build:data` is the gate.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PRIMERS_DIR, primerKey } from '../derive/primers.mjs';
import { AUDIT_DIR, LEVELS, SUBSECTIONS } from './lib.mjs';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
if (!file) {
	console.error('usage: node tools/primers/take.mjs <workflow-output.json> [--only 1-techniques,2-deck]');
	process.exit(1);
}

const top = JSON.parse(readFileSync(file, 'utf8'));
const result = top.result ?? top;
if (!Array.isArray(result.primers)) {
	console.error("  ✗ no primers in that file. Read the run's journal.jsonl before assuming anything was written");
	process.exit(1);
}
for (const line of top.logs ?? []) console.log(`  log: ${line}`);

const valid = new Set(LEVELS.flatMap((l) => SUBSECTIONS.map((s) => primerKey(l, s.key))));
mkdirSync(PRIMERS_DIR, { recursive: true });
mkdirSync(AUDIT_DIR, { recursive: true });

/** @type {string[]} */
const written = [];
/** @type {string[]} existing primers the critic read and left alone */
const keptAsIs = [];
/** existing primers the critic's repair rewrote: their audit gains the critic's findings */
const repairedExisting = new Set();
for (const p of result.primers) {
	const key = p.key ?? primerKey(p.level, p.subsection);
	if (!valid.has(key)) {
		console.log(`  ✗ ${key}: not a level and subsection; skipped`);
		continue;
	}
	if (key !== primerKey(p.level, p.subsection)) {
		console.log(`  ✗ ${key}: the primer says level ${p.level}, subsection ${p.subsection}; skipped`);
		continue;
	}
	if (only && !only.has(key)) continue;
	if (p.existing && !p.repaired) {
		keptAsIs.push(key);
		continue;
	}
	if (p.existing) repairedExisting.add(key);
	const out = { level: p.level, subsection: p.subsection, lede: p.lede, paragraphs: p.paragraphs, cites: p.cites, next: p.next };
	writeFileSync(join(PRIMERS_DIR, `${key}.json`), JSON.stringify(out, null, 1) + '\n');
	written.push(key);
}

const findings = (result.findings ?? []).filter((f) => !only || only.has(f.primer));
const dispositions = new Map((result.dispositions ?? []).map((d) => [d.finding, d]));

for (const level of LEVELS) {
	const mine = written.filter((k) => k.startsWith(`${level}-`));
	if (!mine.length) continue;
	const auditFile = join(AUDIT_DIR, `${level}.json`);
	const prior = existsSync(auditFile) ? JSON.parse(readFileSync(auditFile, 'utf8')) : { level, primers: {} };
	for (const key of mine) {
		const fs = findings.filter((f) => f.primer === key);
		const ds = fs.map((f) => dispositions.get(f.key) ?? null).filter(Boolean);
		const was = prior.primers[key];
		prior.primers[key] = repairedExisting.has(key) && was
			? { findings: [...(was.findings ?? []), ...fs], dispositions: [...(was.dispositions ?? []), ...ds] }
			: { findings: fs, dispositions: ds };
	}
	const critic = result.critics?.[String(level)];
	if (critic) prior.critic = critic;
	writeFileSync(auditFile, JSON.stringify(prior, null, 1) + '\n');
}

const clip = (s, n) => (String(s ?? '').length > n ? String(s).slice(0, n - 1) + '…' : String(s ?? ''));
const bySeverity = {};
for (const f of findings) bySeverity[`${f.lens}:${f.severity}`] = (bySeverity[`${f.lens}:${f.severity}`] ?? 0) + 1;
console.log(`\n  ${written.length} primer(s) written: ${written.join(', ')}`);
console.log(`  ${findings.length} finding(s), ${(result.dispositions ?? []).length} disposition(s)`);
console.log(`  ${Object.entries(bySeverity).map(([k, n]) => `${k} ${n}`).join('  ')}`);

if (keptAsIs.length) console.log(`  ${keptAsIs.length} existing primer(s) read by their critic and left as they were: ${keptAsIs.join(', ')}`);

const serious = findings.filter((f) => f.severity === 'wrong' || f.severity === 'misplaced');
if (serious.length) {
	console.log(`\n  READ THESE (wrong or misplaced), with the corrector's disposition:`);
	for (const f of serious) {
		const d = dispositions.get(f.key);
		console.log(`  - ${f.primer} ${f.where} [${f.lens}:${f.severity}] "${clip(f.claim, 90)}"`);
		console.log(`      because: ${clip(f.because, 160)}`);
		console.log(`      ${d ? `${d.action.toUpperCase()}: ${clip(d.reason, 160)}` : 'UNDISPOSED'}`);
	}
}
const undisposed = findings.filter((f) => !dispositions.has(f.key) && !serious.includes(f));
if (undisposed.length) console.log(`\n  ${undisposed.length} other finding(s) without a disposition (the corrector returned nothing for that primer)`);

for (const level of LEVELS) {
	const c = result.critics?.[String(level)];
	if (!c) continue;
	console.log(`\n  critic, Level ${level}: ${c.ok ? 'ok' : `${(c.problems ?? []).length} problem(s)`}`);
	for (const q of c.problems ?? []) console.log(`  - ${q.key}: ${clip(q.issue, 140)} -> ${clip(q.fix, 120)}`);
	if (c.notes) console.log(`    notes: ${clip(c.notes, 400)}`);
}
console.log('\n  now: npm run build:data (the gate), then npm test');
