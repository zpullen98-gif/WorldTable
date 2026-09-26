#!/usr/bin/env node
/**
 * The briefs for the placement run: everything an assigner, a challenger and
 * a reconciler need, as JSON, read from the files that enforce it so nothing
 * is retyped and nothing can drift.
 *
 *   node tools/levels/brief.mjs [--only dishes,palate] [--chunk 40]
 *
 * It WRITES one brief per placed subsection to tools/levels/out/<key>.brief.json
 * (the standard, the four levels, the deck's placements as the calibration
 * set, every item with its signals, and the current placements when a file
 * already holds some), which the agents open for themselves; and PRINTS the
 * small object to pass as the Workflow's `args`: the briefs' directory, the
 * levels, the minimums and the chunks (slug and name only), because a
 * Workflow script has no filesystem and 100 KB of signals is a poor thing to
 * push through a tool call and then through every prompt.
 *
 * Chunks are even, at most `--chunk` rows (40 by default), and the Lexicon's
 * are cut by category so an assigner reads a category's terms side by side.
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LEVELS, MINIMUMS, PLACED, SUBSECTIONS, PLACEMENTS_DIR, rowName } from '../derive/levels.mjs';
import { OUT_DIR, loadUniverse, readStandard, deckExemplars } from './lib.mjs';

const args = process.argv.slice(2);
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
const chunkSize = args.includes('--chunk') ? Number(args[args.indexOf('--chunk') + 1]) : 40;
if (!Number.isInteger(chunkSize) || chunkSize < 4) {
	console.error('usage: node tools/levels/brief.mjs [--only dishes,palate] [--chunk 40]');
	process.exit(1);
}
const keys = PLACED.filter((k) => !only || only.has(k));
if (!keys.length) {
	console.error(`--only names none of ${PLACED.join(', ')}`);
	process.exit(1);
}

const uni = loadUniverse();
const standard = readStandard();
const exemplars = deckExemplars(20);

/** What each signal field means, once, so no prompt has to explain it. */
const SIGNALS = {
	dishes: 'semester (1 to 10 on the Path of Study; 1 to 3 lean I, 4 to 6 lean II, 7 to 9 lean III, 10 leans IV), semesterTitle, difficulty (the library gate: 1 leans I, 2 leans II, 3 leans III or IV), minutes of active work, chapter, course, techniques (the standards the dish exercises).',
	techniques: 'recipeCount (how many dishes exercise it: many lean down), chapters (how many cuisines), semesters (which of the Path teach it: the earliest is the signal, none leans up), standard (true when a written technique standard exists: the foundation techniques do), lexiconSlug and deckLevel (the deck card for its Lexicon entry, when one exists: the calibration set), opens (how its definition begins).',
	lexicon: 'category (The Professional Kitchen and Knife & Prep lean I; Heat & Precision I or II; the cuts, fish, baking science, the Flavor Atlas and the Seasonal Larder II; Restaurant Finance & Opening III or IV; the atlases by how often a kitchen handles the item), recipeCount (how many dishes link it), deckLevel (a deck card exists for this term and sits at that level: take it unless the essay is plainly broader), semesters (which of the Path read it), techniqueAnchor (a technique page is built on it), opens (how the essay begins).',
	service: 'n (the module\'s place in the track\'s teaching order, which is authored and leans with the levels), termCount, categories (which atlases its terms come from), terms, outcome (what a person can do after it).',
	palate: 'label and symptom; the standard names the pair at each level.',
	safety: 'kind (clause: a heading of the entry; fact: a claim the guide makes; numeric: a figure it states; gap: what it names and never states), anchor (which entry), text.'
};

/** Even chunks of at most `size`: n rows in ceil(n / size) chunks. */
function chunk(rows, size) {
	const k = Math.max(1, Math.ceil(rows.length / size));
	const per = Math.ceil(rows.length / k);
	const out = [];
	for (let i = 0; i < rows.length; i += per) out.push(rows.slice(i, i + per));
	return out;
}

mkdirSync(OUT_DIR, { recursive: true });
const chunks = [];
const totals = {};
for (const key of keys) {
	const sub = SUBSECTIONS.find((s) => s.key === key);
	let roster = uni[key];
	// the Lexicon is read a category at a time: a stable sort keeps each
	// category's own order and puts like beside like
	if (key === 'lexicon') roster = [...roster].sort((a, b) => a.category.localeCompare(b.category));

	const file = join(PLACEMENTS_DIR, `${key}.json`);
	const current = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
	const currentBySlug = Object.fromEntries(current.map((p) => [p.slug, p.level]));

	const briefPath = join(OUT_DIR, `${key}.brief.json`).split('\\').join('/');
	writeFileSync(
		briefPath,
		JSON.stringify(
			{
				subsection: { key, title: sub.title },
				standard,
				levels: LEVELS.map((l) => ({ level: l.level, name: l.name, blurb: l.blurb })),
				minimums: MINIMUMS,
				signals: SIGNALS[key],
				exemplars,
				roster: roster.map((r) => (currentBySlug[r.slug] !== undefined ? { ...r, currentLevel: currentBySlug[r.slug] } : r))
			},
			null,
			1
		) + String.fromCharCode(10)
	);

	const parts = chunk(roster, chunkSize);
	parts.forEach((rows, i) => {
		chunks.push({ sub: key, title: sub.title, n: i + 1, of: parts.length, rows: rows.map((r) => ({ slug: r.slug, name: rowName(r) })) });
	});
	totals[key] = roster.length;
	console.error(`  ${key}: ${roster.length} item(s) in ${parts.length} chunk(s), brief at ${briefPath}`);
}

/* What the workflow script itself needs, and nothing else. THIS is what is
   passed as the Workflow's `args`. */
process.stdout.write(
	JSON.stringify({
		briefDir: OUT_DIR.split('\\').join('/'),
		standardPath: 'tools/levels/README.md',
		levels: LEVELS.map((l) => ({ level: l.level, name: l.name })),
		minimums: MINIMUMS,
		totals,
		chunks
	}) + String.fromCharCode(10)
);
