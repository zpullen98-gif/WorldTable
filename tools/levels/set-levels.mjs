#!/usr/bin/env node
/**
 * Write a placement run into the authored files. All or nothing, per
 * subsection.
 *
 *   node tools/levels/set-levels.mjs <run.json> [--only dishes,palate]
 *
 * The input is what tools/levels/place.workflow.js returned (or the Workflow
 * tool's run file, whose `result` is that object):
 *   { placements: { <subsection>: [{ slug, level, reason }] }, challenges,
 *     dispositions, criticChanges, critic, unresolved }
 *
 * A level is decided against the written standard in README.md, per item, by
 * agents. This tool decides nothing. For every subsection the run covers it
 * checks that the placements describe exactly that subsection's items in this
 * build (the same `universe()` the build gates), and refuses:
 *
 *   - a slug that is not an item of the subsection (retired, renamed, or a
 *     typo: a placement is for something a reader can meet)
 *   - an item left without a level (the build requires every one once
 *     LEVELS_COMPLETE is on, so a partial file would only fail later, further
 *     from the reason)
 *   - a slug placed twice, a level outside 1 to 4, a placement with no reason
 *
 * Then it writes tools/derive/levels/<subsection>.json in universe order, one
 * item per line so a move is a one-line diff, and tools/levels/audit/
 * <subsection>.json beside it: the run's challenges and dispositions for that
 * subsection, what the critic moved, and its notes. Both are committed: the
 * authored file is the data, the audit is the only record of the argument.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { LEVELS, PLACED, PLACEMENTS_DIR, checkPlacements, rowName } from '../derive/levels.mjs';
import { AUDIT_DIR, loadUniverse } from './lib.mjs';

/** @param {string} m @param {string[]} [list] @returns {never} */
const die = (m, list = []) => {
	console.error(`\n  ✗ ${m}`);
	for (const p of list.slice(0, 40)) console.error(`      ${p}`);
	if (list.length > 40) console.error(`      ... and ${list.length - 40} more`);
	console.error('\n  nothing was written\n');
	process.exit(1);
};

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
if (!file) die('usage: node tools/levels/set-levels.mjs <run.json> [--only dishes,palate]');

const raw = JSON.parse(readFileSync(file, 'utf8'));
const run = raw && raw.result && raw.result.placements ? raw.result : raw;
if (!run || typeof run.placements !== 'object' || !run.placements) die('the input is { placements: { <subsection>: [...] } } and this one has none');

const uni = loadUniverse();
const keys = Object.keys(run.placements).filter((k) => !only || only.has(k));
const unknownSubs = keys.filter((k) => !PLACED.includes(k));
if (unknownSubs.length) die(`not a placed subsection: ${unknownSubs.join(', ')} (one of ${PLACED.join(', ')})`);
if (!keys.length) die('the run places nothing this tool was asked to write');

/* Every subsection is checked before any is written: a run half-written would
   leave the build failing on the other half with the reason in a file nobody
   opened. */
const checked = new Map();
for (const key of keys) {
	const rows = run.placements[key];
	if (!Array.isArray(rows) || !rows.length) die(`${key}: the run holds no placements for it`);
	const result = checkPlacements(key, rows, uni[key], { complete: true });
	if (result.problems.length) die(`${key}: ${result.problems.length} problem(s) with the placements`, result.problems);
	checked.set(key, rows);
}

const forSub = (list, key) => (Array.isArray(list) ? list.filter((x) => x && x.sub === key) : []);
const today = new Date().toISOString().slice(0, 10);
mkdirSync(AUDIT_DIR, { recursive: true });

for (const key of keys) {
	const rows = checked.get(key);
	const byId = new Map(rows.map((p) => [p.slug, p]));
	// universe order, so the file reads as the app lists the items and a
	// re-run diffs as moves, never as a reorder
	const ordered = uni[key].map((it) => {
		const p = byId.get(it.slug);
		return { slug: it.slug, level: p.level, reason: String(p.reason).trim() };
	});
	const text = `[\n${ordered.map((p) => `\t${JSON.stringify(p)}`).join(',\n')}\n]\n`;
	JSON.parse(text);
	writeFileSync(join(PLACEMENTS_DIR, `${key}.json`), text);

	const counts = Object.fromEntries(LEVELS.map((l) => [l.name, ordered.filter((p) => p.level === l.level).length]));
	writeFileSync(
		join(AUDIT_DIR, `${key}.json`),
		JSON.stringify(
			{
				assigned: today,
				standard: 'tools/levels/README.md, "The standard"',
				counts,
				challenges: forSub(run.challenges, key),
				dispositions: forSub(run.dispositions, key),
				criticChanges: forSub(run.criticChanges, key),
				unresolved: forSub(run.unresolved, key),
				notes: run.critic && run.critic.notes ? run.critic.notes : ''
			},
			null,
			'\t'
		) + '\n'
	);
	const names = uni[key].filter((it) => byId.get(it.slug).level === 4).slice(0, 3).map(rowName);
	console.log(`  ${key}: ${ordered.length} placed (${Object.entries(counts).map(([n, c]) => `${n} ${c}`).join(', ')})${names.length ? `; at Chef: ${names.join(', ')}...` : ''}`);
}
console.log(`  written: tools/derive/levels/{${keys.join(',')}}.json and tools/levels/audit/`);
console.log('  now: set LEVELS_COMPLETE when every subsection is placed, then npm run build:data && npm test');
