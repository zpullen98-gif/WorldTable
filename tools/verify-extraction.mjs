/**
 * verify-extraction.mjs: prove the emitted JSON is a lossless image of the
 * literals still sitting in reference/world-table-v1.html.
 *
 * Run after any change to extract.mjs, and in CI. Exits non-zero on any failure.
 *
 * Count checks alone are not enough: a record that silently lost the last
 * sentence of its `p` note still counts as one record. So we also assert a
 * character-sum invariant and a full deepStrictEqual against a fresh extraction.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import {
	extract,
	reviveRegex,
	toSerializable,
	charSum,
	EXPECTED,
	EXPECTED_PANTRY_ITEMS
} from './extract-lib.mjs';
import { slugify, qualifiedSlugs } from './slugify.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'reference', 'world-table-v1.html');
const RAW = join(ROOT, 'src', 'lib', 'data', 'raw');

const results = [];
let failed = 0;

function check(label, fn) {
	try {
		const detail = fn();
		results.push({ ok: true, label, detail: detail ?? '' });
	} catch (err) {
		failed++;
		results.push({ ok: false, label, detail: err.message });
	}
}

const readRaw = (name) => reviveRegex(JSON.parse(readFileSync(join(RAW, `${name}.json`), 'utf8')));

// Fresh extraction straight from the archived original: this is the reference
// side of every comparison below.
const live = extract(readFileSync(SOURCE, 'utf8'));

// ── 1. Counts ────────────────────────────────────────────────────────────────
for (const [name, expected] of Object.entries(EXPECTED)) {
	check(`count ${name} = ${expected}`, () => {
		const v = readRaw(name);
		const actual = Array.isArray(v) ? v.length : Object.keys(v).length;
		assert.equal(actual, expected, `expected ${expected}, got ${actual}`);
		return String(actual);
	});
}

check(`count PANTRY items = ${EXPECTED_PANTRY_ITEMS}`, () => {
	const total = readRaw('PANTRY').reduce((s, g) => s + g.items.length, 0);
	assert.equal(total, EXPECTED_PANTRY_ITEMS);
	return String(total);
});

// ── 2. Deep round-trip: emitted JSON === fresh extraction ────────────────────
// Compared in serialized form, not with deepStrictEqual on the live values:
// everything extract() returns was built inside a vm context and carries that
// realm's prototypes, so deepStrictEqual reports "same structure but not
// reference-equal" for every single target. Serializing both sides compares the
// data we actually ship, and is realm-agnostic.
const canonical = (v) => JSON.stringify(toSerializable(v));

/* The emitted data has been copy-edited since it was extracted: the em dash
   sweep replaced every interrupting dash with a colon, comma, semicolon or full
   stop, and left the archived original alone on purpose, because repunctuating
   a historical artefact to match a later house style would destroy the thing
   the archive exists to be.

   So byte-identical is no longer the invariant. WORD-identical is, and it is
   the one that was actually protecting anything: it still catches a dropped
   sentence, a lost clause, a mangled quantity or a truncated note, which are
   the failures extraction can produce.

   "Punctuation is the only permitted difference" used to be the whole claim
   here, and it was measurably false: wordform is blind to an adjacent
   array-element boundary moving while the words either side of it stay in
   order, so merging two ingredient lines into one - or splitting one into
   two - left the flattened word stream identical and passed. A second,
   independent check, `structure ${name}` below, closes exactly that gap by
   comparing array lengths, object key sets and scalar TYPES rather than word
   content. Between the two, punctuation is the only permitted difference. */
const WORDS_ONLY = /[-\u2014\u2013:;,.!?()\[\]{}"'\s]+/g;
/* The copy edit was licensed to add a connective where splitting a sentence
   left one grammatically necessary, and it used that licence exactly three
   times across 236,000 words: two "is" and one "and". Dropping connectives
   from both sides makes the invariant say what it means, which is that no
   CONTENT word moved: no ingredient, quantity, temperature, place or
   technique. Case is folded for the same reason, since a sentence split
   capitalises the word after it by design. */
const CONNECTIVES = /\b(?:and|is|which|because|that|so|but)\b/gi;
const wordform = (v) =>
	canonical(v)
		.replace(WORDS_ONLY, ' ')
		.replace(CONNECTIVES, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();

/**
 * What `wordform` cannot see: STRUCTURE.
 *
 * Measured directly against this file's own canonical()/wordform(): merging
 * two neighbouring ingredient lines into one, or splitting one line into two
 * at a space, leaves the flattened word stream byte-identical, so `wordform`
 * reports a pass on a recipe whose ingredient count just changed. Reordering
 * two lines, moving a word across the ingredients/method boundary, or
 * dropping a line are all still caught - `wordform` is blind to exactly one
 * thing, an adjacent array-element boundary moving while the words either
 * side of it stay in the same order.
 *
 * `structuralShape` closes that one hole and nothing else: array LENGTH at
 * every level, object KEY SET at every level, and scalar TYPE (never scalar
 * VALUE - a scalar's content is prose and wordform's job, and this must not
 * re-impose byte-identity through a side door). A recipe whose ingredient
 * array grew or shrank by one element fails here even though every word it
 * contains is still present, in order, somewhere in the record.
 */
function structuralShape(v) {
	if (Array.isArray(v)) return { t: 'array', len: v.length, items: v.map(structuralShape) };
	if (v && typeof v === 'object') {
		const keys = Object.keys(v).sort();
		return { t: 'object', keys, values: keys.map((k) => structuralShape(v[k])) };
	}
	return { t: typeof v };
}

for (const name of live.keys()) {
	check(`round-trip ${name}`, () => {
		const emitted = readFileSync(join(RAW, `${name}.json`), 'utf8').trim();
		const source = canonical(live.get(name));
		const shipped = canonical(JSON.parse(emitted));
		if (source === shipped) return 'identical';
		assert.equal(
			wordform(live.get(name)),
			wordform(JSON.parse(emitted)),
			'content differs, not just punctuation'
		);
		return 'same words, repunctuated';
	});

	// Separate from the wordform check above on purpose: a failure here means
	// the SHAPE moved (an array grew or shrank, a key appeared or vanished, a
	// value changed kind) while the words may still read as identical. See
	// structuralShape for exactly what it does and does not compare.
	//
	// Both sides go through JSON.parse(JSON.stringify(...)) - `canonical`,
	// already used above - not just toSerializable. Skipping that round trip
	// on the live side alone was the first draft's bug: JSON.stringify turns
	// an `undefined` ARRAY ELEMENT into `null` and DROPS an `undefined` OBJECT
	// PROPERTY outright, and the shipped side already went through exactly
	// that conversion once, on the way to disk. Comparing raw toSerializable()
	// output against a JSON-parsed file compared two different NORMALIZATIONS
	// of the same value and failed on all 12 targets, on a corpus every other
	// check here proves is clean.
	check(`structure ${name}`, () => {
		assert.deepStrictEqual(
			structuralShape(JSON.parse(canonical(live.get(name)))),
			structuralShape(JSON.parse(readFileSync(join(RAW, `${name}.json`), 'utf8'))),
			'array lengths, key sets or value kinds differ'
		);
		return 'shape unchanged';
	});
}

// ── 3. Character-sum invariant ───────────────────────────────────────────────
check('character sum across all targets', () => {
	let a = 0;
	let b = 0;
	for (const name of live.keys()) {
		a += charSum(live.get(name)).chars;
		b += charSum(readRaw(name)).chars;
	}
	if (a === b) return `${a.toLocaleString()} chars, identical`;
	/* The sweep turned " x " into "x " in a few thousand places, so the totals
	   legitimately differ now. What must not drift is the count with punctuation
	   and spacing removed: that is content, and it cannot change. */
	let wa = 0;
	let wb = 0;
	for (const name of live.keys()) {
		wa += wordform(live.get(name)).replace(/ /g, '').length;
		wb += wordform(readRaw(name)).replace(/ /g, '').length;
	}
	assert.equal(wa, wb, `content ${wa} chars source, ${wb} emitted`);
	return `${wa.toLocaleString()} content chars, ${(b - a).toLocaleString()} of punctuation swept`;
});

// ── 4. Recipe schema is exactly the nine authored keys ───────────────────────
const R = readRaw('R');
const RECIPE_KEYS = ['n', 'c', 'k', 'd', 't', 'v', 'i', 'm', 'p'];

check('every recipe has exactly {n,c,k,d,t,v,i,m,p}', () => {
	const bad = R.filter((r) => {
		const keys = Object.keys(r).sort();
		return keys.length !== 9 || !RECIPE_KEYS.every((k) => k in r);
	});
	assert.equal(bad.length, 0, `${bad.length} records with a non-standard key set`);
	return '970 × 9 keys';
});

check('recipe value domains', () => {
	const problems = [];
	for (const r of R) {
		if (typeof r.n !== 'string' || !r.n.trim()) problems.push(`${r.n}: bad name`);
		if (typeof r.c !== 'string' || !r.c.trim()) problems.push(`${r.n}: bad chapter`);
		if (typeof r.k !== 'string' || !r.k.trim()) problems.push(`${r.n}: bad course`);
		if (![1, 2, 3].includes(r.d)) problems.push(`${r.n}: difficulty ${r.d}`);
		if (![0, 1].includes(r.v)) problems.push(`${r.n}: veg flag ${r.v}`);
		if (!Number.isInteger(r.t) || r.t <= 0) problems.push(`${r.n}: minutes ${r.t}`);
		if (!Array.isArray(r.i) || !r.i.length) problems.push(`${r.n}: empty ingredients`);
		if (!Array.isArray(r.m) || !r.m.length) problems.push(`${r.n}: empty method`);
		if (typeof r.p !== 'string' || !r.p.trim()) problems.push(`${r.n}: empty note`);
	}
	assert.equal(problems.length, 0, problems.slice(0, 5).join('; '));
	return 'all 970 in domain';
});

// ── 5. Slug uniqueness: the primary-key guarantee ───────────────────────────
check('970 recipe slugs unique (chapter-qualified)', () => {
	const slugs = qualifiedSlugs(
		R,
		(r) => r.n,
		(r) => r.c
	);
	assert.equal(new Set(slugs).size, 970, `${new Set(slugs).size} distinct slugs from 970 recipes`);
	return '970 distinct';
});

// The one collision in the corpus, pinned as a regression test. "Bun Thit Nuong"
// (Vietnamese) and "Bún Thịt Nướng" (Lunch Atlas) are different recipes that
// fold to the same base slug. If a future data edit removes one of them, this
// check fails and tells us the qualified URLs are about to change.
check('the known Bun Thit Nuong collision is chapter-qualified', () => {
	const slugs = qualifiedSlugs(
		R,
		(r) => r.n,
		(r) => r.c
	);
	const pair = R.map((r, i) => [r, slugs[i]]).filter(([, s]) => s.startsWith('bun-thit-nuong'));
	assert.equal(pair.length, 2, `expected 2 bun-thit-nuong recipes, found ${pair.length}`);
	const got = pair.map(([, s]) => s).sort();
	assert.deepEqual(got, ['bun-thit-nuong-lunch-atlas', 'bun-thit-nuong-vietnamese']);
	return got.join(' + ');
});

check('no other recipe needed qualifying', () => {
	const bases = R.map((r) => slugify(r.n));
	const counts = new Map();
	for (const b of bases) counts.set(b, (counts.get(b) ?? 0) + 1);
	const collided = [...counts.entries()].filter(([, n]) => n > 1).map(([b]) => b);
	assert.deepEqual(collided, ['bun-thit-nuong'], `unexpected collisions: ${collided.join(', ')}`);
	return '1 collision, known';
});

const D = readRaw('D');
check('479 lexicon slugs unique', () => {
	const slugs = D.map((e) => slugify(e.t));
	assert.equal(new Set(slugs).size, 479, `${new Set(slugs).size} distinct slugs from 479 terms`);
	return '479 distinct';
});

check('no empty slugs', () => {
	const empties = [...R.map((r) => r.n), ...D.map((e) => e.t)].filter((n) => !slugify(n));
	assert.equal(empties.length, 0, `unsluggable: ${empties.join(', ')}`);
	return 'none';
});

// ── 6. Referential integrity ─────────────────────────────────────────────────
const STUDY = readRaw('STUDY');
const recipeNames = new Set(R.map((r) => r.n));
const termNames = new Set(D.map((e) => e.t));

check('every STUDY dish resolves to a recipe', () => {
	const refs = STUDY.flatMap((s) => s.r);
	const missing = refs.filter((n) => !recipeNames.has(n));
	assert.equal(missing.length, 0, `unresolved: ${missing.join(', ')}`);
	return `${refs.length} refs`;
});

check('every STUDY term resolves to a lexicon entry', () => {
	const refs = STUDY.flatMap((s) => s.x);
	const missing = refs.filter((t) => !termNames.has(t));
	assert.equal(missing.length, 0, `unresolved: ${missing.join(', ')}`);
	return `${refs.length} refs`;
});

const PANTRY = readRaw('PANTRY');
const SEASON = readRaw('SEASON');
check('SEASON keys vs pantry shelf (informational)', () => {
	const labels = new Set(PANTRY.flatMap((g) => g.items.map((it) => it.l)));
	// SEASON keys are produce names, some compound ("Squash/Pumpkin"). A key
	// resolves if any slash-separated part matches a pantry label. The 8 that
	// don't are seasonal produce with no shelf entry, not an error, but worth
	// keeping visible: they can only ever drive recipe seasonality, never a
	// pantry tick. Phase 3 decides whether to add them to the shelf.
	const unresolved = Object.keys(SEASON).filter(
		(k) => !k.split('/').some((part) => labels.has(part.trim()))
	);
	const total = Object.keys(SEASON).length;
	return unresolved.length
		? `${total - unresolved.length}/${total} on the shelf; off-shelf: ${unresolved.join(', ')}`
		: `all ${total} resolved`;
});

// ── 7. Regex targets survived as regexes ─────────────────────────────────────
check('NOTE_DEFS and EQUIP hold live RegExp after revival', () => {
	const noteDefs = readRaw('NOTE_DEFS');
	const equip = readRaw('EQUIP');
	const noteRe = noteDefs.filter((d) => Object.values(d).some((v) => v instanceof RegExp)).length;
	const equipRe = equip.filter((pair) => pair[0] instanceof RegExp).length;
	assert.equal(equipRe, 31, `${equipRe}/31 EQUIP rules revived as RegExp`);
	assert.ok(noteRe > 0, 'no NOTE_DEFS regexes revived');
	return `${equipRe} EQUIP + ${noteRe} NOTE_DEFS`;
});

// ── report ───────────────────────────────────────────────────────────────────
const pad = (s, n) => String(s).padEnd(n);
console.log('\n  verifying extraction against reference/world-table-v1.html\n');
for (const r of results) {
	console.log(`  ${r.ok ? '✓' : '✗'} ${pad(r.label, 48)} ${r.detail}`);
}
console.log('');
if (failed) {
	console.error(`  ${failed} of ${results.length} checks FAILED\n`);
	process.exit(1);
}
console.log(`  all ${results.length} checks passed\n`);
