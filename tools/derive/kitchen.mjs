#!/usr/bin/env node
/**
 * Cook at home: the training kitchen's dishes, emitted for the app.
 *
 * The source of truth is src/lib/data/kitchen/: curriculum.json (the ladder,
 * 400 rungs in order) and level<L>-<meal>-<meal>.json (the full dishes,
 * proved by tools/kitchen/check-training.mjs). This script derives two kinds
 * of file from them and decides nothing:
 *
 *   static/kitchen-data/level-<L>.json   one level's 100 dishes whole, in the
 *       ladder's order (meal, then n). About a megabyte each before gzip, so
 *       they are NEVER precached: the page fetches a level on demand and the
 *       worker keeps it (NetworkFirst, oot-table-kitchen-v1, vite.config.ts),
 *       so a level opened once cooks offline after.
 *
 *   src/lib/data/kitchen.index.json      the slim index: every dish's slug,
 *       level, meal, n, title, cuisine, times and difficulty. Small enough to
 *       ride in the precache as a lazy chunk, so the level page's list, the
 *       progress and the Repertoire's names work offline from the first
 *       launch, before any level has been opened.
 *
 * The directory is kitchen-data and not kitchen on purpose: /kitchen is the
 * dish page's route, prerendered as kitchen.html, and a static directory of
 * the same name beside it invites a static host to redirect /kitchen to
 * /kitchen/ and serve a listing instead of the page.
 *
 * Usage: node tools/derive/kitchen.mjs [--check] [--help]
 *   --check  writes nothing; exits 1 naming each emitted file that differs
 *            from a fresh derivation (src/lib/kitchen.test.ts runs the same
 *            comparison, so a source edit without a re-emit fails npm test).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const KITCHEN_SRC = path.join(ROOT, 'src', 'lib', 'data', 'kitchen');
export const KITCHEN_OUT = path.join(ROOT, 'static', 'kitchen-data');
export const KITCHEN_INDEX = path.join(ROOT, 'src', 'lib', 'data', 'kitchen.index.json');

export const MEALS = ['breakfast', 'lunch', 'dinner', 'dessert'];
export const LEVELS = [1, 2, 3, 4];

/** @typedef {Record<string, any>} Dish */
/** @typedef {{ slug: string, level: number, meal: string, n: number, title: string, cuisine: string, active: number, total: number, difficulty: string, serves: string }} IndexRow */

/** @param {string} p */
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

/**
 * Every dish of the source files, in the ladder's order: level, meal, n.
 * Throws naming the fault when a rung is missing, doubled or out of place,
 * because an emitted level with a hole in it would draw a list of 24.
 * @param {string} [dir]
 * @returns {Dish[]}
 */
export function readDishes(dir = KITCHEN_SRC) {
	const files = fs.readdirSync(dir).filter((f) => /^level\d-[a-z-]+\.json$/.test(f)).sort();
	/** @type {Dish[]} */
	const all = [];
	for (const f of files) {
		const list = readJson(path.join(dir, f));
		if (!Array.isArray(list)) throw new Error(`kitchen: ${f} is not an array of dishes`);
		all.push(...list);
	}
	const seen = new Set();
	for (const d of all) {
		if (seen.has(d.slug)) throw new Error(`kitchen: ${d.slug} appears twice`);
		seen.add(d.slug);
	}
	all.sort((a, b) => a.level - b.level || MEALS.indexOf(a.meal) - MEALS.indexOf(b.meal) || a.n - b.n);
	const ladder = readJson(path.join(dir, 'curriculum.json')).entries;
	if (ladder.length !== all.length) throw new Error(`kitchen: the ladder holds ${ladder.length} rungs and the files ${all.length} dishes`);
	for (const level of LEVELS) {
		for (const meal of MEALS) {
			const ns = all.filter((d) => d.level === level && d.meal === meal).map((d) => d.n);
			const want = Array.from({ length: 25 }, (_, i) => i + 1);
			if (ns.join(',') !== want.join(',')) throw new Error(`kitchen: level key ${level} ${meal} is not 1 to 25 (${ns.join(',')})`);
		}
	}
	return all;
}

/**
 * The emitted files as path -> text, so --check and the unit test compare
 * exactly what a run would write.
 * @param {Dish[]} all
 * @returns {Map<string, string>}
 */
export function derive(all) {
	/** @type {Map<string, string>} */
	const out = new Map();
	for (const level of LEVELS) {
		const dishes = all.filter((d) => d.level === level);
		out.set(path.join(KITCHEN_OUT, `level-${level}.json`), JSON.stringify({ version: 1, level, dishes }) + '\n');
	}
	/** @type {IndexRow[]} */
	const rows = all.map((d) => ({
		slug: d.slug,
		level: d.level,
		meal: d.meal,
		n: d.n,
		title: d.title,
		cuisine: d.cuisine,
		active: d.time.active,
		total: d.time.total,
		difficulty: d.difficulty,
		serves: d.serves
	}));
	out.set(KITCHEN_INDEX, JSON.stringify({ version: 1, meals: MEALS, perMeal: 25, dishes: rows }) + '\n');
	return out;
}

/** @param {Map<string, string>} files @returns {string[]} the paths that differ from disk */
export function stale(files) {
	const bad = [];
	for (const [p, text] of files) {
		const now = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
		if (now !== text) bad.push(path.relative(ROOT, p));
	}
	return bad;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
	const args = process.argv.slice(2);
	if (args.includes('--help')) {
		console.log('node tools/derive/kitchen.mjs [--check]\nEmits static/kitchen-data/level-<L>.json and src/lib/data/kitchen.index.json from src/lib/data/kitchen. --check writes nothing and exits 1 naming each stale file.');
		process.exit(0);
	}
	let files;
	try {
		files = derive(readDishes());
	} catch (e) {
		console.error(e instanceof Error ? e.message : String(e));
		process.exit(1);
	}
	if (args.includes('--check')) {
		const bad = stale(files);
		if (bad.length) {
			console.error(`kitchen: stale, run node tools/derive/kitchen.mjs:\n  ${bad.join('\n  ')}`);
			process.exit(1);
		}
		console.log('kitchen: every emitted file matches its source.');
		process.exit(0);
	}
	fs.mkdirSync(KITCHEN_OUT, { recursive: true });
	for (const [p, text] of files) {
		fs.writeFileSync(p, text);
		console.log(`kitchen: wrote ${path.relative(ROOT, p)} (${(Buffer.byteLength(text) / 1024).toFixed(1)} KB)`);
	}
}
