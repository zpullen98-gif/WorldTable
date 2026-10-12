#!/usr/bin/env node
/**
 * Cuisine's validator: the contract over a draft before it is merged.
 *
 *   node tools/cuisine/validate.mjs [--draft] [--today YYYY-MM-DD] <target>
 *
 * The target is one of:
 *   a chapter key        tools/cuisine/out/<chapter>/*.json merged in memory on
 *                        top of tools/derive/cuisine/<chapter>.json, or that
 *                        chapter file alone when there is no draft folder
 *   tree | ladder        tools/cuisine/out/<name>.json, else the shipped file
 *   a .json path         a chapter file, a part ({ entries, steps?, match? },
 *                        its chapter read from its folder or its name), or a
 *                        tree or ladder file
 *
 * The draft is checked inside the whole set as it stands on disk, so a slug
 * another chapter already uses, or a reference to an entry nobody wrote, is
 * found here and not at the build. Every problem under the target is printed
 * with its path; the exit is 1 on any.
 *
 * --draft accepts a reference to a slug planned in tools/cuisine/roster.json
 * and not yet written. The build does not.
 */
import fs from 'node:fs';
import path from 'node:path';
import { CHAPTER_KEYS, CUISINE_COMPLETE, checkSet, formatProblem, rosterRows } from '../derive/cuisine-contract.mjs';
import { PARTS_DIR, ROSTER_FILE, SRC_DIR, loadRefs, loadSet, mergeChapter, readParts, readRoster, rel } from '../derive/cuisine.mjs';

/** @typedef {import('../derive/cuisine-contract.mjs').Loose} Loose */
/** @typedef {import('../derive/cuisine-contract.mjs').Problem} Problem */

const args = process.argv.slice(2);
if (args.includes('--help') || !args.filter((a) => !a.startsWith('--')).length) {
	console.log(`node tools/cuisine/validate.mjs [--draft] [--today YYYY-MM-DD] <chapter | tree | ladder | file.json>
Runs tools/derive/cuisine-contract.mjs over a draft inside the whole set and prints
every problem under it with its path. Exit 1 on any. Chapters: ${CHAPTER_KEYS.join(', ')}.`);
	process.exit(args.includes('--help') ? 0 : 1);
}
const draft = args.includes('--draft');
const todayAt = args.indexOf('--today');
const today = todayAt >= 0 ? args[todayAt + 1] : undefined;
const target = /** @type {string} */ (args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--today')[0]);

/** @param {string} p */
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
/** @param {unknown} v @returns {v is Loose} */
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
/** @param {string} msg @returns {never} */
const die = (msg) => {
	console.error(`validate: ${msg}`);
	process.exit(1);
};

const set = loadSet();
const roster = readRoster();
const refs = loadRefs();
if (draft && roster === null) {
	die(`--draft needs ${rel(ROSTER_FILE)}, which does not exist yet. Validate without --draft (every reference must then be a written entry), or wait for the roster.`);
}

/** @type {Problem[]} */
const early = [];
/** @type {string} */
let scope;
/** @type {string} */
let what;

/**
 * @param {string} chapter
 * @param {Array<{ file: string, data: Loose }>} parts
 * @param {Loose | null} [whole]
 */
function useChapter(chapter, parts, whole = null) {
	const meta = set.meta.find((m) => m.key === chapter);
	if (!meta) die(`"${chapter}" is not a chapter of chapters.json (${CHAPTER_KEYS.join(', ')})`);
	const m = /** @type {import('../derive/cuisine-contract.mjs').ChapterMeta} */ (meta);
	if (whole) {
		set.files.set(chapter, whole);
		return;
	}
	const merged = mergeChapter(m, set.files.get(chapter) ?? null, parts, roster === null ? null : rosterRows(roster));
	early.push(...merged.problems);
	set.files.set(chapter, merged.file);
}

if (target === 'tree' || target === 'ladder') {
	const draftFile = path.join(PARTS_DIR, `${target}.json`);
	const file = fs.existsSync(draftFile) ? draftFile : path.join(SRC_DIR, `${target}.json`);
	if (!fs.existsSync(file)) die(`no ${target}.json in ${rel(PARTS_DIR)} or ${rel(SRC_DIR)}`);
	set[target] = readJson(file);
	scope = target;
	what = rel(file);
} else if (target.endsWith('.json')) {
	const file = path.resolve(target);
	if (!fs.existsSync(file)) die(`${target} does not exist`);
	/** @type {Loose} */
	let data = {};
	try {
		data = readJson(file);
	} catch (err) {
		die(`${target} is not JSON (${err instanceof Error ? err.message : String(err)})`);
	}
	what = rel(file);
	if (isObj(data) && Array.isArray(data.mothers)) {
		set.tree = data;
		scope = 'tree';
	} else if (isObj(data) && Array.isArray(data.rungs)) {
		set.ladder = data;
		scope = 'ladder';
	} else {
		const folder = path.basename(path.dirname(file));
		const base = path.basename(file, '.json');
		const chapter = isObj(data) && typeof data.key === 'string' ? data.key : CHAPTER_KEYS.includes(folder) ? folder : base;
		const whole = isObj(data) && typeof data.key === 'string' && typeof data.title === 'string' ? data : null;
		useChapter(chapter, whole ? [] : [{ file: rel(file), data: isObj(data) ? data : {} }], whole);
		scope = chapter;
	}
} else {
	if (!CHAPTER_KEYS.includes(target)) die(`"${target}" is not a chapter key, tree, ladder or a .json file`);
	const { parts, problems } = readParts(target);
	early.push(...problems);
	if (!parts.length && !set.files.has(target)) die(`nothing to validate: no ${rel(path.join(PARTS_DIR, target))}/*.json and no ${rel(path.join(SRC_DIR, `${target}.json`))}`);
	useChapter(target, parts);
	scope = target;
	what = parts.length ? `${parts.length} part(s) in ${rel(path.join(PARTS_DIR, target))} merged on ${set.files.has(target) ? 'the chapter file' : 'nothing'}` : rel(path.join(SRC_DIR, `${target}.json`));
}

const { problems } = checkSet(set, refs, { draft, today });
const s = /** @type {string} */ (scope);
const mine = [
	...early,
	...problems.filter((p) => p.path === s || p.path.startsWith(`${s}/`) || p.path === `chapters.json/${s}` || p.path === 'set')
];
const elsewhere = problems.length - problems.filter((p) => mine.includes(p)).length;
console.log(`validate: ${what}${draft ? ' (draft: planned roster slugs accepted)' : ''}${CUISINE_COMPLETE ? ' (CUISINE_COMPLETE)' : ''}`);
if (elsewhere) console.log(`validate: ${elsewhere} problem(s) elsewhere in the set are not shown (run the build to see them)`);
if (mine.length) {
	console.error(`validate: ${mine.length} problem(s) under ${s}:`);
	for (const p of mine) console.error(`  ${formatProblem(p)}`);
	process.exit(1);
}
const file = set.files.get(s);
/* Notes, never failures: how the chapter stands against its roster. */
if (isObj(file) && roster !== null) {
	const planned = rosterRows(roster).filter((r) => r.chapter === s);
	const entries = Array.isArray(file.entries) ? file.entries : [];
	const byStem = new Map(entries.map((e) => [e?.stem, e]));
	const missing = planned.filter((r) => !byStem.has(r.stem));
	if (missing.length) console.log(`validate: note: ${missing.length} of ${planned.length} roster entries not yet written: ${missing.map((r) => r.stem).join(', ')}`);
	for (const r of planned) {
		const e = byStem.get(r.stem);
		if (!e) continue;
		const differs = ['slug', 'title', 'level', 'kind'].filter((k) => r[k] !== undefined && e[k] !== r[k]);
		if (differs.length) console.log(`validate: note: ${r.stem} differs from the roster in ${differs.map((k) => `${k} (${JSON.stringify(e[k])}, planned ${JSON.stringify(r[k])})`).join(', ')}`);
	}
	const unplanned = entries.filter((e) => !planned.some((r) => r.stem === e?.stem)).map((e) => e?.stem);
	if (unplanned.length) console.log(`validate: note: not in the roster for ${s}: ${unplanned.join(', ')}`);
}
if (isObj(file)) {
	const entries = Array.isArray(file.entries) ? file.entries : [];
	const n = (/** @type {string} */ k) => entries.reduce((t, e) => t + (Array.isArray(e?.[k]) ? e[k].length : 0), 0);
	console.log(`validate: ${s} holds ${entries.length} entries, ${n('cards')} cards, ${n('questions')} questions, ${Array.isArray(file.steps) ? file.steps.length : 0} steps set(s), ${Array.isArray(file.match) ? file.match.length : 0} match(es). Every rule holds.`);
} else console.log(`validate: ${s}: every rule holds.`);
