#!/usr/bin/env node
/* check-foundations.mjs: the gate that holds the Kitchen Fieldbook, src/lib/data/culinary-foundations.json.

   Every entry carries id, term, category, definition, guest, kitchen, compare and reviewedOn, a list of
   aliases and at least one source with an https url, and no field the entry type does not know. Ids are
   unique and read <category>-<squashed term>; a published id (tools/foundations/published.json) keeps
   the spelling it was published with, and its term and ref never change. Every category is one of the
   file's own, and the entries are kept in the categories' order. No text carries a dash of any spelling
   or a price figure, or names anyone on tools/foundations/people.json. say, when present, is a plain
   respelling; background, when present, runs 60 to 200 words; metAt, when present, is not empty.

   With --staging <file>, the gate reads a staging file instead and holds it to the same rules against
   the main file, which it reads and never writes: { "chunk", "new": [full entries], "deepen": [patches] }.
   A new entry there must also carry say, background and metAt, and wear the id its category and term
   give; a patch names an entry of the file and carries say, background, metAt and perhaps guest, and
   perhaps sources, each { title, url } with an https url, which the merger appends to the entry's own.

   Runs from any directory. Exits 1 naming the entry and the rule on failure, one line on success.
   No dash of any spelling in this file. */

import { MAIN, PUBLISHED, PEOPLE, REL, parseArgs, readJson, publishedMap, peopleIn, fileProblems, stagingProblems } from './rules.mjs';

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
	console.log(`check-foundations.mjs: hold the Kitchen Fieldbook to its rules.

Usage: node tools/foundations/check-foundations.mjs [--staging <file>] [--file <json>] [--published <json>] [--people <json>]

  (no flags)          check ${REL(MAIN)}
  --staging <file>    check one staging file against the main file; the main file is read, never written
  --file <json>       the Fieldbook file to read (default ${REL(MAIN)})
  --published <json>  the published ids, terms and refs (default ${REL(PUBLISHED)})
  --people <json>     the living people no entry names (default ${REL(PEOPLE)})
  --help              this text

Exits 1 on the first run with any problem, printing each as "<entry>: <rule>: <what is wrong>".`);
	process.exit(0);
}
function fail(msg) { console.error('check-foundations: ' + msg); process.exit(1); }
const opt = parseArgs(args, [], ['--staging', '--file', '--published', '--people'], fail);
const FILE = opt['--file'] || MAIN;
const data = readJson(FILE, fail);
const published = publishedMap(readJson(opt['--published'] || PUBLISHED, fail));
const people = peopleIn(readJson(opt['--people'] || PEOPLE, fail));

const problems = [];
const push = (entry, rule, said) => problems.push(`${entry}: ${rule}: ${said}`);
const target = opt['--staging'] || FILE;
if (opt['--staging']) stagingProblems(readJson(opt['--staging'], fail), data, published, people, push);
else fileProblems(data, published, people, push);

if (problems.length) {
	console.error(`check-foundations: ${REL(target)}: ${problems.length} problem${problems.length === 1 ? '' : 's'}`);
	for (const p of problems) console.error('  ' + p);
	process.exit(1);
}
if (opt['--staging']) {
	const s = readJson(opt['--staging'], fail);
	console.log(`check-foundations: ${REL(target)} sound: chunk ${s.chunk}, ${(s.new || []).length} new, ${(s.deepen || []).length} deepened, against ${data.entries.length} entries`);
} else {
	const deep = (f) => data.entries.filter((e) => e[f]).length;
	console.log(`check-foundations: ${REL(target)} sound: ${data.entries.length} entries in ${data.categories.length} categories, ${published.size} published; say ${deep('say')}, background ${deep('background')}, metAt ${deep('metAt')}`);
}
