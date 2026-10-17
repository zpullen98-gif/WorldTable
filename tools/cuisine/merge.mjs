#!/usr/bin/env node
/**
 * Cuisine's merge: draft parts into the chapter files the build reads.
 *
 *   node tools/cuisine/merge.mjs <chapter> [--dry]
 *   node tools/cuisine/merge.mjs tree | ladder [--dry]
 *
 * A chapter: every tools/cuisine/out/<chapter>/*.json ({ entries, steps?,
 * match? }) is merged into tools/derive/cuisine/<chapter>.json. A part's
 * entry, steps set or match replaces the chapter's item of the same stem; two
 * parts naming one stem are refused; the entries are put in roster order
 * (tools/cuisine/roster.json), the rest after them in the order met; the key,
 * title and intro are always chapters.json's. The merged chapter is then
 * validated inside the whole set (in draft mode while a roster exists and
 * CUISINE_COMPLETE is off) and nothing is written if any rule fails.
 *
 * tree or ladder: tools/cuisine/out/<name>.json is validated the same way and
 * written to tools/derive/cuisine/<name>.json.
 *
 * After a merge: node tools/derive/cuisine.mjs --mint (new stems need ids).
 */
import fs from 'node:fs';
import path from 'node:path';
import { CHAPTER_KEYS, CUISINE_COMPLETE, checkSet, formatProblem, rosterRows } from '../derive/cuisine-contract.mjs';
import { PARTS_DIR, SRC_DIR, chapterText, loadRefs, loadSet, mergeChapter, readParts, readRoster, rel } from '../derive/cuisine.mjs';

/** @typedef {import('../derive/cuisine-contract.mjs').Problem} Problem */

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('--'));
if (args.includes('--help') || !target) {
	console.log(`node tools/cuisine/merge.mjs <chapter | tree | ladder> [--dry]
Merges tools/cuisine/out/<chapter>/*.json into tools/derive/cuisine/<chapter>.json in
roster order (or out/tree.json, out/ladder.json into their shipped files), after the
contract passes. --dry prints what would change and writes nothing.
Chapters: ${CHAPTER_KEYS.join(', ')}.`);
	process.exit(target || args.includes('--help') ? 0 : 1);
}
const dry = args.includes('--dry');
/** @param {string} msg @returns {never} */
const die = (msg) => {
	console.error(`merge: ${msg}`);
	process.exit(1);
};

const set = loadSet();
const roster = readRoster();
const refs = loadRefs();
/* Draft mode accepts planned roster slugs; once CUISINE_COMPLETE the contract
   refuses it, and every reference must resolve to a written entry. */
const draft = roster !== null && !CUISINE_COMPLETE;
/** @type {Problem[]} */
const early = [];
/** @type {string} */
let out;
/** @type {unknown} */
let value;

if (target === 'tree' || target === 'ladder') {
	const src = path.join(PARTS_DIR, `${target}.json`);
	if (!fs.existsSync(src)) die(`${rel(src)} does not exist`);
	try {
		value = JSON.parse(fs.readFileSync(src, 'utf8'));
	} catch (err) {
		die(`${rel(src)} is not JSON (${err instanceof Error ? err.message : String(err)})`);
	}
	set[target] = /** @type {any} */ (value);
	out = path.join(SRC_DIR, `${target}.json`);
} else {
	const meta = set.meta.find((m) => m.key === target);
	if (!meta) die(`"${target}" is not a chapter of chapters.json (${CHAPTER_KEYS.join(', ')}), tree or ladder`);
	const { parts, problems } = readParts(target);
	early.push(...problems);
	if (!parts.length) die(`no parts in ${rel(path.join(PARTS_DIR, target))}`);
	const merged = mergeChapter(/** @type {import('../derive/cuisine-contract.mjs').ChapterMeta} */ (meta), set.files.get(target) ?? null, parts, roster === null ? null : rosterRows(roster));
	early.push(...merged.problems);
	set.files.set(target, merged.file);
	value = merged.file;
	out = path.join(SRC_DIR, `${target}.json`);
	console.log(`merge: ${parts.length} part(s); ${merged.added.length} added, ${merged.replaced.length} replaced${merged.replaced.length ? ` (${merged.replaced.join(', ')})` : ''}`);
}

const { problems } = checkSet(set, refs, { draft });
const scope = /** @type {string} */ (target);
const mine = [...early, ...problems.filter((p) => p.path === scope || p.path.startsWith(`${scope}/`) || p.path === `chapters.json/${scope}` || p.path === 'set')];
if (mine.length) {
	console.error(`merge: ${mine.length} problem(s); nothing written:`);
	for (const p of mine) console.error(`  ${formatProblem(p)}`);
	process.exit(1);
}
const text = chapterText(value);
const o = /** @type {string} */ (out);
const before = fs.existsSync(o) ? fs.readFileSync(o, 'utf8') : null;
if (before === text) console.log(`merge: ${rel(o)} is unchanged`);
else if (dry) console.log(`merge: would write ${rel(o)} (${Buffer.byteLength(text)} bytes); --dry, nothing written`);
else {
	fs.writeFileSync(o, text);
	console.log(`merge: wrote ${rel(o)}${draft ? ' (validated in draft mode: planned roster slugs accepted)' : ''}. Next: node tools/derive/cuisine.mjs --mint`);
}
