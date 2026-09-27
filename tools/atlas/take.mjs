#!/usr/bin/env node
/**
 * Take an atlas run and write it in: the entries into the supplement, the
 * placements into the Lexicon's level file, the argument into the audit.
 *
 *   node tools/atlas/take.mjs <workflow-output.json> [--only huckleberry,pawpaw] [--batch plates]
 *
 * The entries are APPENDED to LEXICON_SUPPLEMENT in
 * tools/derive/lexicon-supplement.mjs, in the file's own style, before the
 * array's closing bracket; the placements are appended to
 * tools/derive/levels/lexicon.json as {slug, level, reason}; findings,
 * dispositions, the critic and the placement argument go to
 * tools/atlas/audit/<batch>.json. It refuses an entry whose term already
 * exists (a slug is a reader's key) and one whose category is not an atlas.
 * It decides nothing else: `npm run build:data` is the gate, for the entry
 * and for the placement both. Then the term is in the Lexicon, the plates
 * that draw it link to it on the next build, and the level page lists it.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ATLAS_CATEGORIES, LEXICON_SUPPLEMENT } from '../derive/lexicon-supplement.mjs';
import { slugify } from '../slugify.mjs';
import { data } from '../levels/lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const SUPPLEMENT = join(ROOT, 'tools', 'derive', 'lexicon-supplement.mjs');
const LEVELS_FILE = join(ROOT, 'tools', 'derive', 'levels', 'lexicon.json');
const AUDIT_DIR = join(HERE, 'audit');

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
const batch = args.includes('--batch') ? args[args.indexOf('--batch') + 1] : 'plates';
if (!file) {
	console.error('usage: node tools/atlas/take.mjs <workflow-output.json> [--only slug,slug] [--batch name]');
	process.exit(1);
}
const top = JSON.parse(readFileSync(file, 'utf8'));
const result = top.result ?? top;
if (!Array.isArray(result.entries)) {
	console.error("  ✗ no entries in that file. Read the run's journal.jsonl before assuming anything was written");
	process.exit(1);
}
for (const line of top.logs ?? []) console.log(`  log: ${line}`);

const existing = new Set([...data('lexicon.json').map((e) => e.slug), ...LEXICON_SUPPLEMENT.map((e) => slugify(e.t))]);
const placements = new Map((result.placements ?? []).map((p) => [p.slug, p]));
const FIELDS = ['t', 'c', 'd', 'season', 'choose', 'store', 'prep', 'methods'];

/** The file's own style: tabs, double-quoted strings, arrays inline. */
const ser = (e) =>
	`\t{\n${FIELDS.map((k) => `\t\t${k}: ${JSON.stringify(e[k])}`).join(',\n')}\n\t}`;

const taken = [];
const skipped = [];
for (const e of result.entries) {
	const slug = e.slug ?? slugify(e.t);
	if (only && !only.has(slug)) continue;
	if (slug !== slugify(e.t)) { skipped.push(`${slug}: the term "${e.t}" slugifies to ${slugify(e.t)}`); continue; }
	if (existing.has(slug)) { skipped.push(`${slug}: already in the Lexicon; a slug is a reader's key and is never rewritten`); continue; }
	if (!ATLAS_CATEGORIES.includes(e.c)) { skipped.push(`${slug}: category ${JSON.stringify(e.c)} is not an atlas`); continue; }
	for (const k of FIELDS) if (e[k] === undefined) { skipped.push(`${slug}: missing ${k}`); }
	if (skipped.some((s) => s.startsWith(`${slug}:`))) continue;
	if (!placements.has(slug)) { skipped.push(`${slug}: no placement in the run; the build would refuse an unplaced term`); continue; }
	taken.push({ slug, entry: Object.fromEntries(FIELDS.map((k) => [k, e[k]])), placement: placements.get(slug) });
	existing.add(slug);
}

if (taken.length) {
	let src = readFileSync(SUPPLEMENT, 'utf8');
	const start = src.indexOf('export const LEXICON_SUPPLEMENT = [');
	const end = src.lastIndexOf('\n];');
	if (start < 0 || end < start) throw new Error('lexicon-supplement.mjs: cannot find the array to append to');
	src = `${src.slice(0, end)},\n${taken.map((t) => ser(t.entry)).join(',\n')}${src.slice(end)}`;
	writeFileSync(SUPPLEMENT, src);

	const rows = existsSync(LEVELS_FILE) ? JSON.parse(readFileSync(LEVELS_FILE, 'utf8')) : [];
	const have = new Set(rows.map((r) => r.slug));
	for (const t of taken) if (!have.has(t.slug)) rows.push({ slug: t.slug, level: t.placement.level, reason: t.placement.reason });
	writeFileSync(LEVELS_FILE, JSON.stringify(rows, null, 1).replace(/\{\n\s+"slug"/g, '{ "slug"').replace(/,\n\s+"level"/g, ', "level"').replace(/,\n\s+"reason"/g, ', "reason"').replace(/"\n\s+\}/g, '" }') + '\n');

	mkdirSync(AUDIT_DIR, { recursive: true });
	const slugs = new Set(taken.map((t) => t.slug));
	const audit = {
		batch,
		entries: taken.map((t) => t.slug),
		findings: (result.findings ?? []).filter((f) => slugs.has(f.slug)),
		dispositions: result.dispositions ?? [],
		critic: result.critic ?? null,
		placements: taken.map((t) => t.placement),
		challenges: (result.challenges ?? []).filter((c) => slugs.has(c.slug)),
		placeDispositions: (result.placeDispositions ?? []).filter((d) => slugs.has(d.slug))
	};
	writeFileSync(join(AUDIT_DIR, `${batch}.json`), JSON.stringify(audit, null, 1) + '\n');
}

const clip = (s, n) => (String(s ?? '').length > n ? String(s).slice(0, n - 1) + '…' : String(s ?? ''));
const dispositions = new Map((result.dispositions ?? []).map((d) => [d.finding, d]));
console.log(`\n  ${taken.length} entry(ies) written: ${taken.map((t) => `${t.slug} (L${t.placement.level})`).join(', ')}`);
for (const s of skipped) console.log(`  ✗ skipped ${s}`);
const findings = (result.findings ?? []).filter((f) => taken.some((t) => t.slug === f.slug));
const bySeverity = {};
for (const f of findings) bySeverity[`${f.lens}:${f.severity}`] = (bySeverity[`${f.lens}:${f.severity}`] ?? 0) + 1;
console.log(`  ${findings.length} finding(s): ${Object.entries(bySeverity).map(([k, n]) => `${k} ${n}`).join('  ')}`);
const serious = findings.filter((f) => f.severity === 'wrong' || f.severity === 'unsafe');
if (serious.length) {
	console.log('\n  READ THESE (wrong or unsafe), with the corrector\'s disposition:');
	for (const f of serious) {
		const d = dispositions.get(f.key);
		console.log(`  - ${f.slug} ${f.field} [${f.lens}:${f.severity}] "${clip(f.claim, 90)}"`);
		console.log(`      because: ${clip(f.because, 160)}`);
		console.log(`      ${d ? `${d.action.toUpperCase()}: ${clip(d.reason, 160)}` : 'UNDISPOSED'}`);
	}
}
if (result.critic) {
	console.log(`\n  critic: ${result.critic.ok ? 'ok' : `${(result.critic.problems ?? []).length} problem(s)`}`);
	for (const q of result.critic.problems ?? []) console.log(`  - ${q.slug}: ${clip(q.issue, 140)} -> ${clip(q.fix, 120)}`);
	if (result.critic.notes) console.log(`    notes: ${clip(result.critic.notes, 400)}`);
}
for (const c of result.challenges ?? []) {
	const d = (result.placeDispositions ?? []).find((x) => x.slug === c.slug);
	console.log(`  placement challenge ${c.slug} -> L${c.level}: ${clip(c.because, 120)} | ${d ? `${d.action}: ${clip(d.reason, 120)}` : 'no disposition'}`);
}
console.log('\n  now: npm run build:data (the gate for the entries and the placements), then npm test');
