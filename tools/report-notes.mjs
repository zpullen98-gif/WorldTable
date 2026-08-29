/**
 * report-notes.mjs — the backfill's progress bar.
 *
 * Lists every recipe whose shipped "from the pass" note (raw, or overlaid from
 * notes.json) is under the 180-char bar, grouped by chapter, thinnest chapters
 * first. Run with a chapter name to dump that chapter's full records: name,
 * ingredients, method, current note — which is the working material for
 * writing the replacement.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { qualifiedSlugs } from './slugify.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const R = JSON.parse(readFileSync(join(ROOT, 'src', 'lib', 'data', 'raw', 'R.json'), 'utf8'));
const notesPath = join(ROOT, 'src', 'lib', 'data', 'notes.json');
const NOTES = existsSync(notesPath) ? JSON.parse(readFileSync(notesPath, 'utf8')) : {};

const slugs = qualifiedSlugs(
	R,
	(r) => r.n,
	(r) => r.c
);

const records = R.map((r, i) => ({
	slug: slugs[i],
	name: r.n,
	chapter: r.c,
	ingredients: r.i,
	method: r.m,
	note: NOTES[slugs[i]] ?? r.p
}));

const chapterArg = process.argv.slice(2).join(' ').trim();

if (chapterArg) {
	// Working-material dump for one chapter's thin notes.
	const thin = records.filter((r) => r.chapter === chapterArg && r.note.length < 180);
	if (!thin.length) {
		console.log(`\n  "${chapterArg}": nothing under 180 chars. Done, or misspelled.\n`);
		process.exit(0);
	}
	for (const r of thin) {
		console.log(`\n### ${r.slug}`);
		console.log(`NAME: ${r.name}`);
		console.log(`ING:  ${r.ingredients.join(' | ')}`);
		console.log(`MTH:  ${r.method.join(' >> ')}`);
		console.log(`NOTE (${r.note.length}): ${r.note}`);
	}
	console.log('');
	process.exit(0);
}

const thin = records.filter((r) => r.note.length < 180);
const byChapter = new Map();
for (const r of thin) {
	if (!byChapter.has(r.chapter)) byChapter.set(r.chapter, []);
	byChapter.get(r.chapter).push(r);
}

console.log(`\n  the backfill ledger — ${thin.length} of ${records.length} notes under 180 chars`);
console.log(`  ${Object.keys(NOTES).length} already rewritten in notes.json\n`);

const rows = [...byChapter.entries()].sort((a, b) => b[1].length - a[1].length);
for (const [chapter, list] of rows) {
	const avg = Math.round(list.reduce((n, r) => n + r.note.length, 0) / list.length);
	console.log(`  ${String(list.length).padStart(3)}  ${chapter.padEnd(26)} avg ${avg} chars`);
}
console.log(`\n  next: node tools/report-notes.mjs "<chapter>" for working material\n`);
