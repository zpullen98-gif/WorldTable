#!/usr/bin/env node
// The training kitchen's curriculum gate.
//
// src/lib/data/kitchen/curriculum.json is the ladder of 400 training dishes:
// four levels (named in levels.json, never numbered on screen), four meals,
// twenty five dishes in each of the sixteen cells. This script proves the
// shape and the joins, and prints the spread of cuisines per level and how
// many dishes stand on a Library recipe.
//
// Rules, each a failure:
//   400 entries, exactly 25 per level per meal, n running 1 to 25 in each cell;
//   every field present and typed; slugs and titles unique (titles folded);
//   every libraryRef a recipe slug in recipes.index.json;
//   every techniqueRef a technique slug in techniques.json;
//   buildsOn names only earlier dishes (the file's own `order` rule);
//   no em dash, en dash, their entities or a spaced double hyphen anywhere;
//   no level by number in visible text; `why` one sentence;
//   every temperature given in both °F and °C;
//   British spelling in prose (titles exempt: a dish keeps its own name);
//   every cell spread across at least MIN_FAMILIES cuisine families, none
//   holding more than MAX_PER_FAMILY of the cell.
//
// Usage: node tools/kitchen/check-curriculum.mjs [--quiet]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA = path.join(ROOT, 'src', 'lib', 'data');

/** @typedef {{ slug: string, level: number, meal: string, n: number, title: string, cuisine: string, skills: string[], buildsOn: string[], libraryRef: string | null, techniqueRefs: string[], why: string }} Entry */

const MEALS = ['breakfast', 'lunch', 'dinner', 'dessert'];
const PER_CELL = 25;
const MIN_FAMILIES = 9;
const MAX_PER_FAMILY = 4;

/** Each cuisine label to the family the spread is counted in. A label not here fails. */
/** @type {Record<string, string>} */
const FAMILY = {
	French: 'French', 'Provençal': 'French', Belgian: 'French',
	Italian: 'Italian', 'Italian American': 'Italian', Emilian: 'Italian', Sicilian: 'Italian',
	Piedmontese: 'Italian', Milanese: 'Italian', Ligurian: 'Italian', Neapolitan: 'Italian',
	Spanish: 'Iberian', Basque: 'Iberian', Catalan: 'Iberian', Portuguese: 'Iberian',
	Mexican: 'Mexican and Latin American', Yucatecan: 'Mexican and Latin American',
	Oaxacan: 'Mexican and Latin American', Pueblan: 'Mexican and Latin American',
	'Tex-Mex': 'Mexican and Latin American', Peruvian: 'Mexican and Latin American',
	Argentine: 'Mexican and Latin American', Uruguayan: 'Mexican and Latin American',
	Brazilian: 'Mexican and Latin American', Colombian: 'Mexican and Latin American',
	Venezuelan: 'Mexican and Latin American', Cuban: 'Mexican and Latin American',
	Dominican: 'Mexican and Latin American', 'Puerto Rican': 'Mexican and Latin American',
	Jamaican: 'Mexican and Latin American', Trinidadian: 'Mexican and Latin American',
	'Latin American': 'Mexican and Latin American',
	American: 'American and Southern', Southern: 'American and Southern',
	Creole: 'American and Southern', Cajun: 'American and Southern', Texan: 'American and Southern',
	Levantine: 'Middle Eastern and North African', Lebanese: 'Middle Eastern and North African',
	Palestinian: 'Middle Eastern and North African', Syrian: 'Middle Eastern and North African',
	Turkish: 'Middle Eastern and North African', Persian: 'Middle Eastern and North African',
	Egyptian: 'Middle Eastern and North African', Moroccan: 'Middle Eastern and North African',
	Tunisian: 'Middle Eastern and North African', 'North African': 'Middle Eastern and North African',
	Indian: 'South Asian', Punjabi: 'South Asian', 'South Indian': 'South Asian',
	Keralan: 'South Asian', Bengali: 'South Asian', Awadhi: 'South Asian', 'Sri Lankan': 'South Asian',
	Chinese: 'Chinese', Cantonese: 'Chinese', Sichuan: 'Chinese', Shanghainese: 'Chinese',
	'Northern Chinese': 'Chinese', Beijing: 'Chinese', 'Hong Kong': 'Chinese',
	Japanese: 'Japanese',
	Korean: 'Korean',
	Thai: 'Southeast Asian', 'Northern Thai': 'Southeast Asian', Vietnamese: 'Southeast Asian',
	Malaysian: 'Southeast Asian', Singaporean: 'Southeast Asian', Indonesian: 'Southeast Asian',
	Balinese: 'Southeast Asian', Filipino: 'Southeast Asian', Burmese: 'Southeast Asian',
	Senegalese: 'West African', Nigerian: 'West African', Ghanaian: 'West African',
	Ethiopian: 'East and Southern African', 'South African': 'East and Southern African',
	British: 'British and Irish', Irish: 'British and Irish', 'Anglo-Indian': 'British and Irish',
	Swedish: 'Nordic and Central European', Danish: 'Nordic and Central European',
	Norwegian: 'Nordic and Central European', Finnish: 'Nordic and Central European',
	Icelandic: 'Nordic and Central European', Austrian: 'Nordic and Central European',
	German: 'Nordic and Central European', Hungarian: 'Nordic and Central European',
	Czech: 'Nordic and Central European', Polish: 'Nordic and Central European',
	Swiss: 'Nordic and Central European', Russian: 'Nordic and Central European',
	Ukrainian: 'Nordic and Central European', Georgian: 'Nordic and Central European',
	Greek: 'Greek and Balkan', Bulgarian: 'Greek and Balkan',
	Australian: 'Oceanian',
};

/** The dash rule: the character, its entities and the spaced double hyphen. */
const DASH_RE = /[\u2014\u2013]|&mdash;|&ndash;|&#8212;|&#8211;|&#x2014;|&#x2013;|-{2}/i;
/** A level by its number or numeral; a level is named. */
const NUMERAL_RE = /\blevel\s*(?:[0-9]+|i{1,3}|iv)\b/i;
/** American spellings the prose must not carry (British in prose; titles exempt). */
const AMERICAN_RE = /\b(?:color|colors|colored|flavor|flavors|flavored|favorite|center|centers|caramelize[sd]?|caramelizing|yogurt|fiber|savory|mold|molds|gray|tenderize[sd]?|tenderizing|theater|meter|liter|aluminum|eggplant|cilantro|zucchini|ladyfingers?|cookie sheet|broiled|broiling|broil|broiler)\b/i;
// The technique slugs carry the archive's American spellings; they are ids,
// never prose, so they are not checked against AMERICAN_RE.

/** @param {string} s */
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** @param {string} p */
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const quiet = process.argv.includes('--quiet');
if (process.argv.includes('--help')) {
	console.log('node tools/kitchen/check-curriculum.mjs [--quiet]\nProves src/lib/data/kitchen/curriculum.json; exits 1 naming each failure.');
	process.exit(0);
}

const file = path.join(DATA, 'kitchen', 'curriculum.json');
const doc = readJson(file);
/** @type {Entry[]} */
const entries = Array.isArray(doc) ? doc : doc.entries;
/** @type {{slug: string}[]} */
const recipes = readJson(path.join(DATA, 'recipes.index.json'));
/** @type {{slug: string}[]} */
const techniques = readJson(path.join(DATA, 'techniques.json'));
/** @type {{levels: {level: number, name: string}[]}} */
const levelsDoc = readJson(path.join(DATA, 'levels.json'));
const recipeSlugs = new Set(recipes.map((r) => r.slug));
const techSlugs = new Set(techniques.map((t) => t.slug));
const levelName = new Map(levelsDoc.levels.map((l) => [l.level, l.name]));

/** @type {string[]} */
const problems = [];
/** @param {Entry | null} e @param {string} msg */
const fail = (e, msg) => problems.push(e ? `${e.slug} (${levelName.get(e.level) ?? e.level}, ${e.meal} ${e.n}): ${msg}` : msg);

if (!Array.isArray(entries)) {
	console.error('curriculum.json: no entries array');
	process.exit(1);
}
if (entries.length !== 400) fail(null, `expected 400 entries, found ${entries.length}`);

/** @param {Entry} e */
const rank = (e) => (e.level * 100 + e.n) * 10 + MEALS.indexOf(e.meal);

const bySlug = new Map();
const byTitle = new Map();
/** @type {Map<string, Entry[]>} */
const cells = new Map();

for (const e of entries) {
	const strs = ['slug', 'meal', 'title', 'cuisine', 'why'];
	for (const k of strs) {
		// @ts-ignore indexed by name
		if (typeof e[k] !== 'string' || !e[k].trim()) fail(e, `${k} missing or empty`);
	}
	if (![1, 2, 3, 4].includes(e.level)) fail(e, `level ${e.level} is not 1 to 4`);
	if (!MEALS.includes(e.meal)) fail(e, `meal ${e.meal} unknown`);
	if (!Number.isInteger(e.n) || e.n < 1 || e.n > PER_CELL) fail(e, `n ${e.n} outside 1 to ${PER_CELL}`);
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(e.slug)) fail(e, 'slug is not lower-case words joined by hyphens');
	for (const k of ['skills', 'buildsOn', 'techniqueRefs']) {
		// @ts-ignore indexed by name
		const v = e[k];
		if (!Array.isArray(v) || v.some((x) => typeof x !== 'string' || !x.trim())) fail(e, `${k} is not a list of strings`);
	}
	if (!Array.isArray(e.skills) || e.skills.length < 2) fail(e, 'fewer than two skills');
	if (e.libraryRef !== null && typeof e.libraryRef !== 'string') fail(e, 'libraryRef is neither null nor a slug');

	if (bySlug.has(e.slug)) fail(e, 'duplicate slug');
	bySlug.set(e.slug, e);
	const ft = fold(e.title);
	if (byTitle.has(ft)) fail(e, `duplicate title (also ${byTitle.get(ft).slug})`);
	byTitle.set(ft, e);

	const key = `${e.level}|${e.meal}`;
	if (!cells.has(key)) cells.set(key, []);
	cells.get(key)?.push(e);

	if (e.libraryRef && !recipeSlugs.has(e.libraryRef)) fail(e, `libraryRef ${e.libraryRef} is not a Library recipe`);
	for (const t of e.techniqueRefs ?? []) if (!techSlugs.has(t)) fail(e, `techniqueRef ${t} is not a technique`);
	if (!(e.cuisine in FAMILY)) fail(e, `cuisine ${e.cuisine} has no family in FAMILY`);

	const prose = [e.why, ...(e.skills ?? [])];
	for (const s of [e.title, e.cuisine, ...prose]) {
		if (DASH_RE.test(s)) fail(e, `dash in "${s}"`);
		if (NUMERAL_RE.test(s)) fail(e, `level by number in "${s}"`);
	}
	for (const s of prose) {
		const m = s.match(AMERICAN_RE);
		if (m) fail(e, `American spelling "${m[0]}" in "${s}"`);
	}
	for (const s of prose) {
		const c = (s.match(/°C/g) ?? []).length;
		const f = (s.match(/°F/g) ?? []).length;
		if (c !== f) fail(e, `temperature not given in both °F and °C in "${s}"`);
	}
	if (!/[.]$/.test(e.why)) fail(e, 'why does not end with a full stop');
	if (/[.!?]\s+[A-Z]/.test(e.why.slice(0, -1))) fail(e, 'why is more than one sentence');
}

// buildsOn: real, earlier, no self.
for (const e of entries) {
	for (const b of e.buildsOn ?? []) {
		const t = bySlug.get(b);
		if (!t) fail(e, `buildsOn ${b} is not a dish in the curriculum`);
		else if (b === e.slug) fail(e, 'buildsOn names itself');
		else if (rank(t) >= rank(e)) fail(e, `buildsOn ${b} (${levelName.get(t.level)}, ${t.meal} ${t.n}) is not earlier`);
	}
}

// Cells: 25 each, n 1..25, spread across families.
/** @type {Map<number, Map<string, number>>} */
const cuisinesByLevel = new Map();
/** @type {string[]} */
const spread = [];
for (const level of [1, 2, 3, 4]) {
	for (const meal of MEALS) {
		const list = cells.get(`${level}|${meal}`) ?? [];
		const name = levelName.get(level);
		if (list.length !== PER_CELL) fail(null, `${name} ${meal}: ${list.length} dishes, expected ${PER_CELL}`);
		const ns = list.map((e) => e.n).sort((a, b) => a - b).join(',');
		const want = Array.from({ length: PER_CELL }, (_, i) => i + 1).join(',');
		if (list.length === PER_CELL && ns !== want) fail(null, `${name} ${meal}: n does not run 1 to ${PER_CELL}`);
		/** @type {Map<string, number>} */
		const fam = new Map();
		for (const e of list) {
			const f = FAMILY[e.cuisine] ?? '?';
			fam.set(f, (fam.get(f) ?? 0) + 1);
			if (!cuisinesByLevel.has(level)) cuisinesByLevel.set(level, new Map());
			const cl = cuisinesByLevel.get(level);
			cl?.set(e.cuisine, (cl.get(e.cuisine) ?? 0) + 1);
		}
		if (fam.size < MIN_FAMILIES) fail(null, `${name} ${meal}: only ${fam.size} cuisine families (at least ${MIN_FAMILIES})`);
		for (const [f, c] of fam) if (c > MAX_PER_FAMILY) fail(null, `${name} ${meal}: ${c} dishes from ${f} (at most ${MAX_PER_FAMILY})`);
		const lib = list.filter((e) => e.libraryRef).length;
		spread.push(`${(name + ' ' + meal).padEnd(26)} ${String(fam.size).padStart(2)} families, top ${Math.max(...fam.values())}, ${lib} on the Library`);
	}
}

if (!quiet) {
	const libraryBased = entries.filter((e) => e.libraryRef).length;
	console.log(`Curriculum: ${entries.length} dishes, ${libraryBased} rewritten from a Library recipe, ${entries.length - libraryBased} written new.`);
	console.log(spread.join('\n'));
	for (const [level, m] of cuisinesByLevel) {
		const lib = entries.filter((e) => e.level === level && e.libraryRef).length;
		const fams = new Map();
		for (const [c, k] of m) fams.set(FAMILY[c], (fams.get(FAMILY[c]) ?? 0) + k);
		console.log(`\n${levelName.get(level)}: ${m.size} cuisines, ${lib} of 100 on the Library`);
		console.log('  families: ' + [...fams].sort((a, b) => b[1] - a[1]).map(([f, k]) => `${f} ${k}`).join(', '));
		console.log('  cuisines: ' + [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([c, k]) => `${c} ${k}`).join(', '));
	}
}

if (problems.length) {
	console.error(`\n${problems.length} problem(s) in ${path.relative(ROOT, file)}:`);
	for (const p of problems) console.error('  ' + p);
	process.exit(1);
}
console.log('\ncheck-curriculum: all rules hold.');
