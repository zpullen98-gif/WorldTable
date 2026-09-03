/**
 * extract-lib.mjs: READ the inline data literals out of the archived original.
 *
 * This file writes NOTHING. It was the top half of extract.mjs, and it is split
 * out because the bottom half - the writer - is a loaded gun. `src/lib/data/raw/`
 * looks generated and is not: three deliberate commits swept 3,919 em-dashes out
 * of it, and re-running the writer would silently put every one of them back.
 *
 * Three tools import from here and every one of them only ever read:
 * build-data.mjs and report-techniques.mjs for `reviveRegex`, and
 * verify-extraction.mjs for the parser it checks `raw/` with. Importing them
 * from a module that also writes meant the writer was one stray call away at
 * all times.
 *
 * HOW IT READS - unchanged, and the reason this half is worth keeping. Why not
 * regex-to-JSON: the literals are valid JS but NOT valid JSON. `R` uses
 * unquoted keys, `NOTE_DEFS` and `EQUIP` hold live RegExp objects, `PANTRY` mixes
 * quoted and unquoted keys, and there are escape sequences (twelve \" in D, two \u
 * in R) that a hand-rolled scanner will silently mangle. Character classes inside
 * the regex literals contain `[`, `,` and `"`, which defeats brace-matching too.
 *
 * So: let acorn do the lexing. We parse each <script>, walk the FULL ast (four of
 * the targets live inside an IIFE, not at top level), slice the exact source span
 * of each target's initializer, and evaluate ONLY that expression in a locked-down
 * vm context. Every target initializer is a pure literal: no identifier
 * references, no calls, so nothing DOM-adjacent is ever executed. acorn only
 * parses the surrounding script; it never runs it.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as vm from 'node:vm';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SOURCE = join(ROOT, 'reference', 'world-table-v1.html');


/** Declarations we lift. Order here is the order they're reported. */
export const TARGETS = [
	'R',
	'D',
	'PANTRY',
	'STUDY',
	'SUBS',
	'CELLAR',
	'NOTE_DEFS',
	'EQUIP',
	'SEASON',
	'RAIL_REGIONS',
	'BOTTLE_NOTES',
	'F',
	'TEACHERS',
	'DISH_FILMS',
	'TECH'
];

/**
 * Expected counts, measured from the source and re-verified against the raw
 * text. The extractor asserts these.
 *
 * SUBS=50, EQUIP=31 and SEASON=45 were each reported one off during planning.
 * Checked directly: SUBS has 50 well-formed [term, advice] pairs with no
 * duplicate terms; EQUIP has 31 `[/re/, label]` pairs on L3330; SEASON has 45
 * keys, 45 of them unique, so nothing collapsed on the way through. These are
 * the real numbers.
 */
export const EXPECTED = {
	R: 970,
	D: 479,
	PANTRY: 7, // groups; 177 items across them, asserted separately
	STUDY: 10,
	SUBS: 50,
	CELLAR: 22,
	NOTE_DEFS: 17,
	EQUIP: 31,
	SEASON: 45,
	RAIL_REGIONS: 9
};

/** Items nested inside PANTRY's 7 groups. */
export const EXPECTED_PANTRY_ITEMS = 177;

/** RegExp survives the JSON round-trip as a tagged object. */
const REGEX_TAG = '__regexp__';

/**
 * Realm-safe RegExp test. `instanceof RegExp` compares against the *calling*
 * realm's RegExp, and everything we extract was constructed inside a vm context
 * with its own intrinsics, so instanceof is false for every one of the 31 EQUIP
 * rules and every NOTE_DEFS pattern, and they serialize to `{}`. Silent, total
 * loss of the regexes. Object.prototype.toString reads the internal slot and is
 * immune to which realm built the value.
 */
const isRegExp = (v) => Object.prototype.toString.call(v) === '[object RegExp]';

export function toSerializable(value) {
	if (isRegExp(value)) {
		return { [REGEX_TAG]: { source: value.source, flags: value.flags } };
	}
	if (Array.isArray(value)) return value.map(toSerializable);
	if (value && typeof value === 'object') {
		const out = {};
		for (const [k, v] of Object.entries(value)) out[k] = toSerializable(v);
		return out;
	}
	return value;
}

/** Inverse of toSerializable: used by the verifier and the derive pipeline. */
export function reviveRegex(value) {
	if (Array.isArray(value)) return value.map(reviveRegex);
	if (value && typeof value === 'object') {
		if (REGEX_TAG in value) {
			const { source, flags } = value[REGEX_TAG];
			return new RegExp(source, flags);
		}
		const out = {};
		for (const [k, v] of Object.entries(value)) out[k] = reviveRegex(v);
		return out;
	}
	return value;
}

/** Every <script>…</script> body in the document, with its offset. */
export function scriptBlocks(html) {
	const blocks = [];
	const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
	let m;
	while ((m = re.exec(html)) !== null) {
		blocks.push({ code: m[1], start: m.index + m[0].indexOf(m[1]) });
	}
	return blocks;
}

/**
 * Sum of the length of every string in a value tree, plus a count of non-string
 * leaves. This is the invariant that catches silent truncation: count checks
 * alone will happily pass on a record whose `p` note lost its last sentence.
 */
export function charSum(value) {
	let chars = 0;
	let leaves = 0;
	const visit = (v) => {
		if (typeof v === 'string') {
			chars += v.length;
			leaves++;
		} else if (isRegExp(v)) {
			chars += v.source.length + v.flags.length;
			leaves++;
		} else if (Array.isArray(v)) {
			v.forEach(visit);
		} else if (v && typeof v === 'object') {
			for (const [k, val] of Object.entries(v)) {
				chars += k.length;
				visit(val);
			}
		} else {
			leaves++;
		}
	};
	visit(value);
	return { chars, leaves };
}

export function extract(html) {
	// Pass 1: locate every target's initializer and record its source span.
	// We keep them in document order because four of the fifteen are NOT pure
	// literals: DISH_FILMS and TECH reference F and TEACHERS by identifier
	// (L3842, L3854). Evaluating in source order means a reference is always
	// already bound by the time it is read.
	const sites = [];

	scriptBlocks(html).forEach(({ code, start: blockStart }) => {
		let ast;
		try {
			ast = acorn.parse(code, { ecmaVersion: 2022, sourceType: 'script' });
		} catch (err) {
			// A block we can't parse is a block we can't trust. Surface it rather
			// than silently skipping: a missed target is a data-loss bug.
			throw new Error(`acorn failed to parse a <script> block: ${err.message}`);
		}

		// Full walk, not just ast.body: F / TEACHERS / DISH_FILMS / TECH are
		// declared inside an IIFE at L3785+.
		walk.simple(ast, {
			VariableDeclarator(node) {
				if (node.id.type !== 'Identifier') return;
				if (!TARGETS.includes(node.id.name)) return;
				if (!node.init) return;
				sites.push({
					name: node.id.name,
					slice: code.slice(node.init.start, node.init.end),
					pos: blockStart + node.init.start
				});
			}
		});
	});

	sites.sort((a, b) => a.pos - b.pos);

	// Pass 2: evaluate in source order into ONE shared sandbox. The sandbox
	// starts with a null prototype and never receives anything but the values we
	// just extracted, so a reference can only ever resolve to prior pure data.
	const sandbox = vm.createContext(Object.create(null));
	const found = new Map();

	for (const { name, slice } of sites) {
		if (found.has(name)) continue; // first declaration wins
		const value = vm.runInContext(`globalThis[${JSON.stringify(name)}] = (${slice});`, sandbox, {
			timeout: 5000
		});
		found.set(name, value);
	}

	const missing = TARGETS.filter((t) => !found.has(t));
	if (missing.length) {
		throw new Error(`Targets not found in source: ${missing.join(', ')}`);
	}
	return found;
}
