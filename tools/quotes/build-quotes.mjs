#!/usr/bin/env node
/**
 * build-quotes.mjs: the verified quote bank as ONE classic script for Lizzy,
 * the Maitre d', in all three wings.
 *
 *   node tools/quotes/build-quotes.mjs            writes static/shared/oot-quotes.js
 *   node tools/quotes/build-quotes.mjs --dry-run  generates and asserts, writes nothing
 *
 * Then `node tools/quotes/check-quotes.mjs` proves the written file is the
 * bank the candidates say it is. Run both after any change to candidates.json.
 *
 * WHAT SHIPS AND WHAT DOES NOT. tools/quotes/candidates.json holds every
 * quotation that was considered, with its source, its evidence, its doubts and
 * the name of whoever checked it. Only an entry with confidence 'high' and a
 * non-empty checkedBy reaches the shipped file, and the shipped entry carries
 * the words, the author, the work, the year, the tags and the adapted flag:
 * no source, no evidence, no note and never a URL. The suite's build gate
 * scans every shipped script for third-party hosts, and the publish gate on
 * the site counts dashes across the tree, so the file is pure ASCII (every
 * letter outside ASCII as a \uXXXX escape) and carries no dash in any
 * spelling. An entry whose text would need an em dash is adapted in the
 * candidates file, with a note saying what changed, before it gets here.
 *
 * WHY THE FILE IS BYTE-STABLE. builtOn is the newest checkedOn among the
 * shipped entries, not the clock, so two runs over the same bank write the
 * same bytes and the site's mirror check (which compares this file with its
 * copy under shared/) cannot drift on a rebuild that changed nothing.
 *
 * The shipped script installs window.OOT.quotes = { v, builtOn, quotes },
 * returns at once when it is already installed, touches no DOM and makes no
 * request: the client reads OOT.quotes at call time and never fetches it.
 */
import vm from 'node:vm';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CANDIDATES = path.join(ROOT, 'tools', 'quotes', 'candidates.json');
export const SHIPPED = path.join(ROOT, 'static', 'shared', 'oot-quotes.js');

/** Words a shipped quotation may run to, counted on whitespace. */
export const WORD_CAP = 40;
/** 'q-' and four base36 characters. */
export const ID_RE = /^q-[0-9a-z]{4}$/;
export const CONFIDENCES = ['high', 'medium', 'low'];
export const KINDS = ['book', 'speech', 'letter', 'essay', 'film', 'interview', 'citation'];
export const TRANSLATIONS = ['original', 'translation', 'adapted'];
/** The six keys a shipped entry carries, in the order they are written. */
export const SHIPPED_KEYS = ['id', 'text', 'who', 'work', 'year', 'tags', 'adapted'];

/**
 * Every dash spelling the two gates count (the em dash, its three entities
 * and the spaced double hyphen), plus the en dash, the figure dash and the
 * horizontal bar, which this repo's rule also refuses. Built from escapes so
 * this file passes the rule it enforces.
 */
export const DASH = new RegExp(['\\u2014', '\\u2013', '\\u2012', '\\u2015', '&' + 'mdash;', '&' + 'ndash;', '&#' + '8212;', '&#' + '8211;', '&#' + 'x2014;', '&#' + 'x2013;', ' ' + '-- '].join('|'), 'g');
/** The same spellings as they would hide inside an ASCII-escaped string. */
export const ESCAPED_DASH = /\\u201[2345]/i;

/**
 * Any key, anywhere, that looks like a claim about what a dish contains or
 * who may eat it: the client's FORBIDDEN_KEY, copied so the bank is swept by
 * the same rule as every answer. Keys only; values are never swept.
 */
export const FORBIDDEN_KEY = /allerg|contain|free|safe|suitab|vegan|nut/i;

/**
 * @typedef {object} Source
 * @property {string} kind
 * @property {string} ref
 * @property {string} language
 * @property {string} translation
 */
/**
 * @typedef {object} Candidate
 * @property {string} id
 * @property {string} text
 * @property {string} who
 * @property {string} work
 * @property {string} year
 * @property {Source} source
 * @property {string[]} tags
 * @property {string} confidence
 * @property {boolean} adapted
 * @property {string} [adaptedNote]
 * @property {string} note
 * @property {string} checkedBy
 * @property {string} checkedOn
 * @property {string} evidence
 */
/**
 * @typedef {object} Shipped
 * @property {string} id
 * @property {string} text
 * @property {string} who
 * @property {string} work
 * @property {string} year
 * @property {string[]} tags
 * @property {boolean} adapted
 */

/** @param {string} text */
export function wordCount(text) {
	return String(text).trim().split(/\s+/).filter(Boolean).length;
}

/** @param {unknown} v */
function isStr(v) {
	return typeof v === 'string';
}

/**
 * Every string inside a value, with the path it sits at.
 * @param {unknown} value
 * @param {string} at
 * @param {Array<{ at: string, s: string }>} out
 */
export function strings(value, at, out) {
	if (typeof value === 'string') out.push({ at, s: value });
	else if (Array.isArray(value)) value.forEach((v, i) => strings(v, `${at}[${i}]`, out));
	else if (value && typeof value === 'object') for (const k of Object.keys(value)) strings(/** @type {Record<string, unknown>} */ (value)[k], `${at}.${k}`, out);
	return out;
}

/**
 * Every key in a value that the client's rule would refuse.
 * @param {unknown} value
 * @param {string} at
 * @param {string[]} out
 */
export function forbiddenKeys(value, at, out) {
	if (!value || typeof value !== 'object') return out;
	if (Array.isArray(value)) {
		value.forEach((v, i) => forbiddenKeys(v, `${at}[${i}]`, out));
		return out;
	}
	for (const k of Object.keys(value)) {
		if (FORBIDDEN_KEY.test(k)) out.push(`${at}.${k}`);
		forbiddenKeys(/** @type {Record<string, unknown>} */ (value)[k], `${at}.${k}`, out);
	}
	return out;
}

/**
 * What must hold of every candidate before any of them ships: the shape,
 * the id form, unique ids, the word cap, a note on every adaptation, a date,
 * no dash in any string and no forbidden key anywhere.
 * @param {Candidate[]} list
 * @returns {string[]}
 */
export function validateCandidates(list) {
	/** @type {string[]} */
	const problems = [];
	const seen = new Set();
	if (!Array.isArray(list)) return ['candidates.json is not a list'];
	list.forEach((c, i) => {
		const who = c && isStr(c.id) ? c.id : `#${i}`;
		if (!c || typeof c !== 'object') { problems.push(`${who}: not an object`); return; }
		for (const k of ['id', 'text', 'who', 'work', 'year', 'confidence', 'note', 'checkedBy', 'checkedOn', 'evidence']) {
			if (!isStr(/** @type {Record<string, unknown>} */ (c)[k])) problems.push(`${who}: ${k} is not a string`);
		}
		if (!ID_RE.test(c.id)) problems.push(`${who}: id is not q- and four base36 characters`);
		if (seen.has(c.id)) problems.push(`${who}: duplicate id`);
		seen.add(c.id);
		if (!isStr(c.text) || !c.text.trim()) problems.push(`${who}: empty text`);
		else if (wordCount(c.text) > WORD_CAP) problems.push(`${who}: ${wordCount(c.text)} words, the cap is ${WORD_CAP}`);
		if (!isStr(c.who) || !c.who.trim()) problems.push(`${who}: empty who`);
		if (!CONFIDENCES.includes(c.confidence)) problems.push(`${who}: confidence "${c.confidence}" is not one of ${CONFIDENCES.join(', ')}`);
		if (!c.source || typeof c.source !== 'object') problems.push(`${who}: no source`);
		else {
			if (!KINDS.includes(c.source.kind)) problems.push(`${who}: source.kind "${c.source.kind}" is not one of ${KINDS.join(', ')}`);
			if (!isStr(c.source.ref)) problems.push(`${who}: source.ref is not a string`);
			if (!isStr(c.source.language)) problems.push(`${who}: source.language is not a string`);
			if (!TRANSLATIONS.includes(c.source.translation)) problems.push(`${who}: source.translation "${c.source.translation}" is not one of ${TRANSLATIONS.join(', ')}`);
		}
		if (!Array.isArray(c.tags) || !c.tags.length || !c.tags.every((t) => isStr(t) && t.trim())) problems.push(`${who}: tags must be a non-empty list of words`);
		if (typeof c.adapted !== 'boolean') problems.push(`${who}: adapted is not a boolean`);
		if (c.adapted && (!isStr(c.adaptedNote) || !c.adaptedNote.trim())) problems.push(`${who}: adapted without an adaptedNote saying what changed`);
		if (!c.adapted && 'adaptedNote' in c) problems.push(`${who}: adaptedNote on an entry that is not adapted`);
		if (isStr(c.checkedOn) && c.checkedOn && !/^\d{4}-\d{2}-\d{2}$/.test(c.checkedOn)) problems.push(`${who}: checkedOn is not YYYY-MM-DD`);
		if (c.confidence === 'high') {
			if (!isStr(c.evidence) || !c.evidence.trim()) problems.push(`${who}: high confidence with no evidence`);
			if (!isStr(c.checkedBy) || !c.checkedBy.trim()) problems.push(`${who}: high confidence with no checkedBy`);
			if (!c.work.trim()) problems.push(`${who}: high confidence with no work named`);
		}
		for (const { at, s } of strings(c, who, [])) {
			if (DASH.test(s)) problems.push(`${at}: carries a dash; replace it with a comma or a colon and say so in adaptedNote`);
			DASH.lastIndex = 0;
			if (s.includes('\r')) problems.push(`${at}: carries a carriage return`);
		}
		for (const at of forbiddenKeys(c, who, [])) problems.push(`${at}: a key the client would refuse`);
	});
	return problems;
}

/**
 * The candidates file, parsed and validated; throws with every problem
 * listed, so a broken bank never ships part of itself.
 * @param {string} file
 * @returns {Candidate[]}
 */
export function readCandidates(file = CANDIDATES) {
	const list = JSON.parse(readFileSync(file, 'utf8'));
	const problems = validateCandidates(list);
	if (problems.length) throw new Error(`${path.relative(ROOT, file)}:\n  ${problems.join('\n  ')}`);
	return list;
}

/**
 * The entries that ship: confidence 'high' with a non-empty checkedBy, sorted
 * by id so the bytes are stable whatever order the file is edited in.
 * @param {Candidate[]} list
 */
export function shippable(list) {
	return list
		.filter((c) => c.confidence === 'high' && isStr(c.checkedBy) && c.checkedBy.trim() !== '')
		.slice()
		.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/**
 * @param {Candidate} c
 * @returns {Shipped}
 */
export function toShipped(c) {
	return { id: c.id, text: c.text, who: c.who, work: c.work, year: c.year, tags: c.tags.slice(), adapted: c.adapted };
}

/**
 * A JavaScript string literal for the value, pure ASCII: JSON quoting, then
 * every character outside ASCII as its \uXXXX escape (a surrogate half on its
 * own, which the engine reads back as the pair).
 * @param {string} s
 */
export function literal(s) {
	return JSON.stringify(s).replace(/[^\x00-\x7f]/g, (ch) => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'));
}

/**
 * The newest checkedOn among the shipped entries: the bank's own date.
 * @param {Candidate[]} shipped
 */
export function builtOnOf(shipped) {
	return shipped.reduce((d, c) => (c.checkedOn > d ? c.checkedOn : d), '');
}

/**
 * The comment every copy carries at the top. Dash-free, no address in it.
 * @param {string} builtOn
 * @param {number} count
 */
function header(builtOn, count) {
	return [
		'/* Outside Of Time: the quote bank for Lizzy, the Maitre d\'.',
		`   GENERATED by WorldTable/tools/quotes/build-quotes.mjs from tools/quotes/candidates.json; ${count} entries, bank dated ${builtOn}; do not edit; regenerate with node tools/quotes/build-quotes.mjs.`,
		'',
		'   WHAT THIS IS. The only quotations the Maitre d\' may put in anyone\'s mouth,',
		'   each one placed in a named work by a named author and checked by a',
		'   person before it was ticked to ship. The client hands her this list by',
		'   id and refuses any quoted span of hers that is not in it, so a line she',
		'   cannot source is a line she does not say. Every entry carries the words,',
		'   the author, the work, the year, its tags and whether the wording was',
		'   adapted (a dash made a comma, a sentence cut) to fit; the source, the',
		'   evidence and the doubts stay in candidates.json, which never ships, and',
		'   no address of any kind is written here.',
		'',
		'   Classic script, no build step, no dependency: one IIFE that installs',
		'   window.OOT.quotes = { v, builtOn, quotes } and returns at once when it is',
		'   already there. It touches no DOM and makes no request, so it can be',
		'   loaded by any wing at any time; the client reads OOT.quotes when it is',
		'   called and never fetches it. Loaded lazily and not precached, like the',
		'   client. Pure ASCII: every letter outside ASCII is a \\uXXXX escape, so the',
		'   site\'s publish gate, which counts dashes across the tree, reads none.',
		'',
		'   Canonical source: WorldTable/static/shared/oot-quotes.js, mirrored byte',
		'   for byte to the site\'s shared/oot-quotes.js; the site\'s check-mirror',
		'   fails on drift rather than overwrite. tools/quotes/check-quotes.mjs',
		'   proves this file against candidates.json and the closed list of names.',
		'*/'
	].join('\n');
}

/**
 * The whole shipped file for a candidate list. Pure, so a check can generate
 * in memory and compare bytes.
 * @param {Candidate[]} list
 */
export function generate(list) {
	const shipped = shippable(list);
	const builtOn = builtOnOf(shipped);
	const entries = shipped.map(toShipped).map((q) => [
		'      {',
		`        id: ${literal(q.id)},`,
		`        text: ${literal(q.text)},`,
		`        who: ${literal(q.who)},`,
		`        work: ${literal(q.work)},`,
		`        year: ${literal(q.year)},`,
		`        tags: [${q.tags.map(literal).join(', ')}],`,
		`        adapted: ${q.adapted ? 'true' : 'false'}`,
		'      }'
	].join('\n'));
	return [
		header(builtOn, shipped.length),
		'(function (w) {',
		"  'use strict';",
		'  var OOT = w.OOT = w.OOT || {};',
		'  if (OOT.quotes) return; // loaded twice by two doors: the first install stands',
		'  OOT.quotes = {',
		'    v: 1,',
		`    builtOn: ${literal(builtOn)},`,
		'    quotes: [',
		entries.join(',\n'),
		'    ]',
		'  };',
		"})(typeof window !== 'undefined' ? window : this);",
		''
	].join('\n');
}

/**
 * What must hold before a byte is written: the script parses, it is pure
 * ASCII with no carriage return, no dash in any spelling (escaped or not),
 * no address and no word that reaches for the DOM or the network.
 * @param {string} text
 * @param {string} label
 */
export function assertClean(text, label) {
	/** @type {string[]} */
	const problems = [];
	try {
		new vm.Script(text, { filename: label });
	} catch (e) {
		problems.push(`does not parse as a script: ${e instanceof Error ? e.message : String(e)}`);
	}
	if (/[^\x00-\x7f]/.test(text)) problems.push('is not pure ASCII');
	if (text.includes('\r')) problems.push('carries a carriage return');
	const dashes = text.match(DASH);
	if (dashes) problems.push(`carries ${dashes.length} dash(es); the publish gate would count them`);
	if (ESCAPED_DASH.test(text)) problems.push('carries a dash as an escape');
	if (/http/i.test(text)) problems.push('carries an address (http); nothing shipped names one');
	for (const word of ['document', 'fetch', 'localStorage', 'XMLHttpRequest', 'navigator', 'location']) {
		if (new RegExp('\\b' + word + '\\b').test(text)) problems.push(`mentions ${word}; the bank touches no DOM and makes no request`);
	}
	if (problems.length) throw new Error(`${label}:\n  ${problems.join('\n  ')}`);
}

function main() {
	const dry = process.argv.includes('--dry-run');
	const list = readCandidates();
	const text = generate(list);
	assertClean(text, 'oot-quotes.js');
	const shipped = shippable(list).length;
	const tally = CONFIDENCES.map((c) => `${c} ${list.filter((x) => x.confidence === c).length}`).join(', ');
	if (dry) {
		console.log(`  ok  ${list.length} candidates (${tally}); ${shipped} shipped; ${text.length} chars, not written (--dry-run)`);
		return;
	}
	mkdirSync(path.dirname(SHIPPED), { recursive: true });
	writeFileSync(SHIPPED, text, 'utf8');
	console.log(`  ok  ${list.length} candidates (${tally}); ${shipped} shipped; ${text.length} chars -> ${path.relative(ROOT, SHIPPED)}`);
	console.log('  now: node tools/quotes/check-quotes.mjs');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	try {
		main();
	} catch (e) {
		console.error('  build-quotes: ' + (e instanceof Error ? e.message : String(e)));
		process.exit(1);
	}
}
