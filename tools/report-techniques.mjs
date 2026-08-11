/**
 * report-techniques.mjs — the technique widening's progress bar.
 *
 * The counterpart to report-notes.mjs. Lists how much of the corpus carries a
 * technique tag, which chapters are darkest, and which table entries never
 * fire. Run with a chapter name to dump that chapter's untagged recipes with
 * their full method text — the working material for writing new keywords.
 *
 *   node tools/report-techniques.mjs
 *   node tools/report-techniques.mjs "Rhode Island"
 *   node tools/report-techniques.mjs --labels
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reviveRegex } from './extract.mjs';
import { qualifiedSlugs } from './slugify.mjs';
import { deriveTechniques } from './derive/films.mjs';
import { fullTechTable, LEXICON_ANCHOR, SUPPLEMENT } from './derive/technique-table.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = join(ROOT, 'src', 'lib', 'data', 'raw');
const raw = (n) => reviveRegex(JSON.parse(readFileSync(join(RAW, `${n}.json`), 'utf8')));

const R = raw('R');
const TECH = raw('TECH');
const TABLE = fullTechTable(TECH);

const slugs = qualifiedSlugs(
	R,
	(r) => r.n,
	(r) => r.c
);

// The method-anchored blob, matching build-data exactly: no note, because a
// recipe demonstrates a technique by what it does, not by what its margin says.
const blobs = R.map((r) => `${r.n} ${r.c} ${r.i.join(' ')} ${r.m.join(' ')}`.toLowerCase());
const tags = blobs.map((b) => deriveTechniques(b, TABLE));

const arg = process.argv.slice(2).join(' ').trim();

if (arg === '--labels') {
	const counts = new Map();
	tags.forEach((ts) => ts.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
	const rows = TABLE.map((x, i) => ({
		label: x.l,
		n: counts.get(x.l) ?? 0,
		origin: i < TECH.length ? 'original' : 'supplement',
		anchored: LEXICON_ANCHOR[x.l] ? '⚓' : '  '
	})).sort((a, b) => b.n - a.n);

	console.log(`\n  ${TABLE.length} entries — ${TECH.length} original, ${SUPPLEMENT.length} supplemental\n`);
	for (const r of rows) {
		console.log(
			`  ${String(r.n).padStart(4)}  ${r.anchored}  ${r.label.padEnd(38)} ${r.origin === 'supplement' ? '+' : ''}`
		);
	}
	const dead = rows.filter((r) => r.n === 0);
	console.log(`\n  ${dead.length} never fire: ${dead.map((d) => d.label).join(', ') || '(none)'}\n`);
	process.exit(0);
}

if (arg) {
	const hits = R.map((r, i) => ({ r, i })).filter(({ r, i }) => r.c === arg && !tags[i].length);
	if (!hits.length) {
		console.log(`\n  "${arg}": every recipe carries a technique. Done, or misspelled.\n`);
		process.exit(0);
	}
	console.log(`\n  ${hits.length} untagged in "${arg}"\n`);
	for (const { r, i } of hits) {
		console.log(`### ${slugs[i]}`);
		console.log(`NAME: ${r.n}`);
		console.log(`ING:  ${r.i.join(' | ')}`);
		console.log(`MTH:  ${r.m.join(' >> ')}\n`);
	}
	process.exit(0);
}

const tagged = tags.filter((t) => t.length).length;
const byChapter = new Map();
R.forEach((r, i) => {
	if (!byChapter.has(r.c)) byChapter.set(r.c, { total: 0, untagged: 0 });
	const e = byChapter.get(r.c);
	e.total++;
	if (!tags[i].length) e.untagged++;
});

console.log(`\n  the technique ledger — ${tagged} of ${R.length} recipes tagged, ${R.length - tagged} dark`);
console.log(`  ${TABLE.length} entries (${SUPPLEMENT.length} supplemental), ${Object.keys(LEXICON_ANCHOR).length} anchored to a lexicon definition\n`);

const rows = [...byChapter.entries()]
	.filter(([, e]) => e.untagged)
	.sort((a, b) => b[1].untagged - a[1].untagged || a[0].localeCompare(b[0]));

for (const [chapter, e] of rows) {
	const bar = e.untagged === e.total ? '  ← nothing at all' : '';
	console.log(`  ${String(e.untagged).padStart(3)}/${String(e.total).padEnd(3)}  ${chapter}${bar}`);
}
console.log(`\n  next: node tools/report-techniques.mjs "<chapter>" for working material`);
console.log(`        node tools/report-techniques.mjs --labels for per-entry counts\n`);
