#!/usr/bin/env node
/* check-compare.mjs: every in-app comparison resolves against the app it opens.

   A comparison on a house item (ItemBase.compare, filed by the component fragments) names where it
   points with `app` and what it opens with `ref`. The engine's validator resolves only a Codex ref
   that is a house wine id; every other ref is a key in another app's data, and this gate reads that
   data where it lives:

     table   a recipe slug in src/lib/data/recipes.index.json (opens /recipe/<slug>), else a
             technique slug in src/lib/data/techniques.json (opens /technique/<slug>); a slug that
             is both is opened as the recipe and named here as a note; a built house carries the
             address itself (recipe/<slug> or technique/<slug>, the builder's tableRef);
     ledger  an exact name in COCKTAILS, js/data-core.js of the Bartender's Ledger (opens
             #/library/<slug>);
     codex   an exact grape in GRAPES (js/reference.js) or GRAPES_PLUS (js/data-grapes-plus.js), an
             exact producer in WINE_PRODUCERS (js/data-producers.js), an exact category in PRIMERS
             (js/data-primers.js), or a house wine: its id in a built house, its exact name in a
             fragment;
     classic carries no ref and is never resolved.

   The Ledger and the Codex are found through LEDGER_SRC and CODEX_SRC, else beside this checkout
   (../bartendersledger, ../sommelierscodex). A checkout that is absent is a note and its refs are
   skipped, so the gate runs on a machine that holds the World Table alone; a variable that names no
   checkout is a failure, so a mis-set path cannot pass as a skip.

   What it reads: the built house (brennans/house.json) by default, --file another house or a pack,
   or --fragments [dir] the component fragments themselves (the authors' files, before a build;
   default the directory engine.mjs componentsDir names). Exits 1 naming each miss with the item, the
   entry and the app; one line on success. No dash of any spelling in this file.

   Usage: node tools/house/check-compare.mjs [--file <house.json|pack>] [--fragments [dir]] [--verbose] */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { HOUSE_JSON, PACK, REL, checkArgs, componentsDir, readFragments } from './engine.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
	console.log(`check-compare.mjs: every in-app comparison ref resolves against the app it opens.

  --file <path>       a built house or a pack to read (default ${REL(HOUSE_JSON)}, else ${REL(PACK)})
  --fragments [dir]   check the component fragments instead (default ${REL(componentsDir())})
  --verbose           print every ref and where it resolved
  --help              this text

The Ledger and the Codex: LEDGER_SRC and CODEX_SRC, else ../bartendersledger and ../sommelierscodex.`);
	process.exit(0);
}
function fail(msg) {
	console.error('check-compare: ' + msg);
	process.exit(1);
}
/* --fragments takes an optional directory, so it is read before the strict flag check. */
const fragAt = args.indexOf('--fragments');
let fragDir = null;
const rest = [...args];
if (fragAt >= 0) {
	const next = args[fragAt + 1];
	fragDir = next && !next.startsWith('-') ? path.resolve(next) : componentsDir();
	rest.splice(fragAt, next && !next.startsWith('-') ? 2 : 1);
}
checkArgs(rest, ['--file', '--verbose'], ['--file'], fail);
const VERBOSE = rest.includes('--verbose');
const fileAt = rest.indexOf('--file');

/* ---------- the apps' data ---------- */
function sibling(envName, dirName) {
	const env = process.env[envName];
	if (env) {
		const dir = path.resolve(env);
		if (!fs.existsSync(path.join(dir, 'js'))) fail(`${envName} names ${env}, which holds no js/ directory`);
		return dir;
	}
	const dir = path.resolve(ROOT, '..', dirName);
	return fs.existsSync(path.join(dir, 'js')) ? dir : null;
}
/* Classic scripts run in one context, so a later expression sees every top level name the files declared. */
function loadGlobals(files, expr) {
	const ctx = { window: {}, console: { log() {}, warn() {}, error() {} } };
	ctx.window.window = ctx.window;
	vm.createContext(ctx);
	for (const f of files) {
		if (!fs.existsSync(f)) fail(`${REL(f)}: missing; the gate reads it for the refs it holds`);
		vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
	}
	return vm.runInContext(expr, ctx);
}
const readJson = (f) => {
	if (!fs.existsSync(f)) fail(`${REL(f)}: missing`);
	return JSON.parse(fs.readFileSync(f, 'utf8'));
};
const recipes = new Set(readJson(path.join(ROOT, 'src', 'lib', 'data', 'recipes.index.json')).map((r) => r.slug));
const techniques = new Set(readJson(path.join(ROOT, 'src', 'lib', 'data', 'techniques.json')).map((t) => t.slug));

const LEDGER = sibling('LEDGER_SRC', 'bartendersledger');
const CODEX = sibling('CODEX_SRC', 'sommelierscodex');
const notes = [];
let cocktails = null;
if (LEDGER) cocktails = new Set(loadGlobals([path.join(LEDGER, 'js', 'data-core.js')], 'COCKTAILS.map(function (c) { return c.name; })'));
else notes.push('the Ledger checkout is absent (set LEDGER_SRC); its refs are skipped');
let codex = null;
if (CODEX) {
	const got = loadGlobals(['reference.js', 'data-grapes-plus.js', 'data-producers.js', 'data-primers.js'].map((f) => path.join(CODEX, 'js', f)),
		'({ grapes: GRAPES.map(function (x) { return x.g; }).concat(GRAPES_PLUS.map(function (x) { return x.g; })), producers: WINE_PRODUCERS.map(function (x) { return x.p; }), primers: PRIMERS.map(function (x) { return x.cat; }) })');
	codex = { grapes: new Set(got.grapes), producers: new Set(got.producers), primers: new Set(got.primers) };
} else notes.push('the Codex checkout is absent (set CODEX_SRC); its refs are skipped');

/* ---------- what is compared ---------- */
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[‘’]/g, "'").toLowerCase().trim();
/** Every comparison to check, as { where, app, ref, wines } with `wines` the house wines a codex ref may name. */
const entries = [];
let source = '';
if (fragDir) {
	let f;
	try { f = readFragments(fragDir); } catch (e) { fail(e.message); }
	source = `${f.files.length} fragment file(s) in ${REL(fragDir)}`;
	const house = fs.existsSync(PACK) ? readJson(PACK).house : null;
	const wineNames = new Set((house ? house.wines : []).map((w) => w.name));
	for (const { at, v } of f.compare) {
		const list = v && Array.isArray(v.entries) ? v.entries : [];
		list.forEach((e, i) => entries.push({ where: `${at} ${v.item} entries[${i}]`, app: e && e.app, ref: e && e.ref, wineIds: new Set(), wineNames }));
	}
} else {
	const file = fileAt >= 0 ? path.resolve(rest[fileAt + 1]) : fs.existsSync(HOUSE_JSON) ? HOUSE_JSON : PACK;
	const raw = readJson(file);
	const house = raw && raw.house && typeof raw.house === 'object' ? raw.house : raw;
	if (!house || !Array.isArray(house.dishes)) fail(`${REL(file)}: neither a house nor a pack`);
	source = REL(file);
	const wineIds = new Set((house.wines || []).map((w) => w.id));
	const wineNames = new Set((house.wines || []).map((w) => w.name));
	for (const list of ['dishes', 'cocktails', 'wines']) for (const r of house[list] || []) {
		const m = r.compare;
		if (!m || !Array.isArray(m.value)) continue;
		m.value.forEach((e, i) => entries.push({ where: `${list} ${r.name} compare[${i}]`, app: e && e.app, ref: e && e.ref, wineIds, wineNames }));
	}
}

/* ---------- resolve ---------- */
const misses = [];
const counts = { table: 0, ledger: 0, codex: 0, classic: 0, skipped: 0 };
for (const e of entries) {
	const ref = typeof e.ref === 'string' ? e.ref : '';
	const said = (to) => { if (VERBOSE) console.log(`  ${e.where}: ${e.app} ${JSON.stringify(ref)} ${to}`); };
	if (e.app === 'classic') {
		counts.classic++;
		if (ref) misses.push(`${e.where}: a classic carries no ref, read ${JSON.stringify(ref)}`);
		continue;
	}
	if (!ref) { misses.push(`${e.where}: ${e.app} needs a ref`); continue; }
	if (e.app === 'table') {
		counts.table++;
		/* A built house carries the address (recipe/<slug>, technique/<slug>); a fragment the bare slug. */
		const m = /^(recipe|technique)\/(.+)$/.exec(ref);
		if (m) {
			if ((m[1] === 'recipe' ? recipes : techniques).has(m[2])) { said('is a ' + m[1]); continue; }
			misses.push(`${e.where}: table ${JSON.stringify(ref)} names no such ${m[1]} in src/lib/data`);
			continue;
		}
		if (recipes.has(ref)) { said('is a recipe'); if (techniques.has(ref)) notes.push(`${e.where}: ${ref} is both a recipe and a technique; it opens as the recipe`); continue; }
		if (techniques.has(ref)) { said('is a technique'); continue; }
		misses.push(`${e.where}: table ${JSON.stringify(ref)} is neither a recipe slug in src/lib/data/recipes.index.json nor a technique slug in techniques.json`);
		continue;
	}
	if (e.app === 'ledger') {
		if (!cocktails) { counts.skipped++; continue; }
		counts.ledger++;
		if (cocktails.has(ref)) { said('is a Ledger cocktail'); continue; }
		const near = [...cocktails].find((n) => fold(n) === fold(ref));
		misses.push(`${e.where}: ledger ${JSON.stringify(ref)} is not a COCKTAILS name in js/data-core.js${near ? ` (did you mean ${JSON.stringify(near)}?)` : ''}`);
		continue;
	}
	if (e.app === 'codex') {
		if (e.wineIds.has(ref)) { counts.codex++; said('is a house wine id'); continue; }
		if (e.wineNames.has(ref)) { counts.codex++; said('is a house wine by name'); continue; }
		if (!codex) { counts.skipped++; continue; }
		counts.codex++;
		const where = codex.grapes.has(ref) ? 'a grape' : codex.producers.has(ref) ? 'a producer' : codex.primers.has(ref) ? 'a primer' : '';
		if (where) { said('is ' + where); continue; }
		const pool = [...codex.grapes, ...codex.producers, ...codex.primers, ...e.wineNames];
		const near = pool.find((n) => fold(n) === fold(ref));
		misses.push(`${e.where}: codex ${JSON.stringify(ref)} is not a GRAPES or GRAPES_PLUS grape, a WINE_PRODUCERS producer, a PRIMERS category or a house wine${near ? ` (did you mean ${JSON.stringify(near)}?)` : ''}`);
		continue;
	}
	misses.push(`${e.where}: app ${JSON.stringify(e.app)} is not table, ledger, codex or classic`);
}

for (const n of notes) console.log('check-compare: note: ' + n);
if (misses.length) {
	for (const m of misses) console.error('check-compare: MISS ' + m);
	fail(`${misses.length} comparison ref(s) resolve to nothing (read ${source})`);
}
console.log(`check-compare: ${source}: ${entries.length} comparison(s), every in-app ref resolves (${counts.table} table, ${counts.ledger} ledger, ${counts.codex} codex, ${counts.classic} classic${counts.skipped ? `, ${counts.skipped} skipped for an absent checkout` : ''})`);
