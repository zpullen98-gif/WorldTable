#!/usr/bin/env node
/* merge-staging.mjs: apply the staged Fieldbook chunks to src/lib/data/culinary-foundations.json.

   Reads every tools/foundations/staging/*.json in name order, each { "chunk", "new": [full entries],
   "deepen": [{ "id", "say", "background", "metAt", "guest"?, "sources"? }] }, and holds each to check-foundations'
   staging rules first. A new entry is appended at the end of its category's entries, so the file keeps
   the categories' order, and joins published.json with its id, term and ref; a new entry already there
   with the same content is skipped. A deepen patch is merged field by field into the entry it names and
   never touches id, term or ref; its sources are appended to the entry's own, one per url, and never take
   one away. Two chunks that give one field two values, or stage one id twice, refuse the run; two chunks
   that give one entry sources do not, as the union of both is taken. The merged file is held to the whole file's rules before anything is written, so the
   run is all or none. It prints what it did, entry by entry.

   Runs from any directory. Exits 1 naming the chunk, the entry and the rule on failure.
   No dash of any spelling in this file. */

import fs from 'node:fs';
import path from 'node:path';
import { MAIN, PUBLISHED, PEOPLE, STAGING, REL, parseArgs, readJson, writeJson, publishedMap, peopleIn, fileProblems, stagingProblems, sourceKey } from './rules.mjs';

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
	console.log(`merge-staging.mjs: merge the staged chunks into the Kitchen Fieldbook.

Usage: node tools/foundations/merge-staging.mjs [--dry] [--staging-dir <dir>] [--file <json>] [--published <json>] [--people <json>]

  --dry                  print what the merge would do and write nothing
  --staging-dir <dir>    the staging folder (default ${REL(STAGING)})
  --file <json>          the Fieldbook file (default ${REL(MAIN)})
  --published <json>     the published ids, terms and refs (default ${REL(PUBLISHED)}); new entries join it
  --people <json>        the living people no entry names (default ${REL(PEOPLE)})
  --help                 this text

Run node tools/foundations/check-foundations.mjs after a merge.`);
	process.exit(0);
}
function fail(msg) { console.error('merge-staging: ' + msg); process.exit(1); }
const opt = parseArgs(args, ['--dry'], ['--staging-dir', '--file', '--published', '--people'], fail);
const DRY = !!opt['--dry'];
const FILE = opt['--file'] || MAIN;
const PUB = opt['--published'] || PUBLISHED;
const DIR = opt['--staging-dir'] || STAGING;

const data = readJson(FILE, fail);
const publishedJson = readJson(PUB, fail);
const published = publishedMap(publishedJson);
const people = peopleIn(readJson(opt['--people'] || PEOPLE, fail));

const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort() : [];
if (!files.length) { console.log(`merge-staging: no staging files in ${REL(DIR)}; nothing to do`); process.exit(0); }

/* Every chunk is checked against the file as it stands before any is applied. */
const problems = [];
const chunks = files.map((f) => {
	const file = path.join(DIR, f);
	const staging = readJson(file, fail);
	stagingProblems(staging, data, published, people, (entry, rule, said) => problems.push(`${f}: ${entry}: ${rule}: ${said}`));
	return { file: f, staging };
});

/* Across chunks: one id staged new twice, or one field given two values, refuses the run. */
const newBy = new Map();
const fieldBy = new Map();
for (const { file, staging } of chunks) {
	for (const e of staging.new || []) {
		if (newBy.has(e.id)) problems.push(`${file}: ${e.id}: unique ids: is also staged new in ${newBy.get(e.id)}`);
		else newBy.set(e.id, file);
	}
	for (const d of staging.deepen || []) for (const [k, v] of Object.entries(d)) {
		if (k === 'id' || k === 'sources') continue;
		const key = `${d.id}.${k}`;
		const was = fieldBy.get(key);
		if (was && was.value !== v) problems.push(`${file}: ${d.id}: deepen: ${k} differs from the value ${was.file} gives it`);
		else if (!was) fieldBy.set(key, { file, value: v });
	}
}
if (problems.length) {
	console.error(`merge-staging: ${problems.length} problem${problems.length === 1 ? '' : 's'}; nothing written`);
	for (const p of problems) console.error('  ' + p);
	process.exit(1);
}

/* Apply in memory. */
const order = data.categories.map((c) => c.id);
const said = [];
let added = 0, deepened = 0, skipped = 0;
for (const { file, staging } of chunks) {
	said.push(`${file} (chunk ${staging.chunk})`);
	for (const e of staging.new || []) {
		if (data.entries.some((x) => x.id === e.id)) { skipped++; said.push(`  ${e.id}: already in the file, skipped`); continue; }
		const at = order.indexOf(e.category);
		let index = -1;
		data.entries.forEach((x, i) => { if (order.indexOf(x.category) <= at) index = i; });
		data.entries.splice(index + 1, 0, e);
		if (!published.has(e.id)) {
			publishedJson.entries.push(e.ref ? { id: e.id, term: e.term, ref: e.ref } : { id: e.id, term: e.term });
			published.set(e.id, { term: e.term, ref: e.ref ?? null });
		}
		added++;
		said.push(`  ${e.id}: new "${e.term}" in ${e.category}, after ${index >= 0 ? data.entries[index].id : 'nothing, first in the file'}`);
	}
	for (const d of staging.deepen || []) {
		const entry = data.entries.find((x) => x.id === d.id);
		const changed = [];
		for (const [k, v] of Object.entries(d)) {
			if (k === 'sources') {
				const have = new Set(entry.sources.map((s) => sourceKey(s.url)));
				const fresh = v.filter((s) => !have.has(sourceKey(s.url)));
				if (!fresh.length) continue;
				entry.sources.push(...fresh.map((s) => ({ title: s.title, url: s.url })));
				changed.push(`${fresh.length} source${fresh.length === 1 ? '' : 's'} appended (${fresh.map((s) => s.url).join(', ')})`);
				continue;
			}
			if (k === 'id' || entry[k] === v) continue;
			changed.push(entry[k] === undefined ? `${k} added` : `${k} replaced`);
			entry[k] = v;
		}
		if (changed.length) deepened++;
		said.push(`  ${d.id}: ${changed.length ? changed.join(', ') : 'unchanged'}`);
	}
}

/* The merged file is held to the whole file's rules before it is written. */
fileProblems(data, published, people, (entry, rule, why) => problems.push(`${entry}: ${rule}: ${why}`));
if (problems.length) {
	console.error(`merge-staging: the merged file would break ${problems.length} rule${problems.length === 1 ? '' : 's'}; nothing written`);
	for (const p of problems) console.error('  ' + p);
	process.exit(1);
}
for (const line of said) console.log(line);
const sum = `${added} new, ${deepened} deepened, ${skipped} skipped; ${data.entries.length} entries`;
if (DRY) { console.log(`merge-staging: dry run, nothing written: ${sum}`); process.exit(0); }
if (!added && !deepened) { console.log(`merge-staging: every chunk is merged already, nothing to write: ${sum}`); process.exit(0); }
writeJson(FILE, data);
if (added) writeJson(PUB, publishedJson);
console.log(`merge-staging: wrote ${REL(FILE)}${added ? ` and ${REL(PUB)}` : ''}: ${sum}`);
