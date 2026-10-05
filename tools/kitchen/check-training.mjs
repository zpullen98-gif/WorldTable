#!/usr/bin/env node
// The training kitchen's dish gate.
//
// src/lib/data/kitchen/level<L>-<meal>-<meal>.json holds the full training
// dishes for one level and the meals its name gives, written from the ladder in
// curriculum.json. This script proves each file against the ladder and the
// binding entry shape, and prints counts and the verified videos.
//
// Rules, each a failure:
//   the file's slugs are exactly the ladder's for that level and those meals,
//   in the ladder's order, with level, meal, n and title equal to the ladder's;
//   every field present and typed; difficulty one of Steady, Stretching,
//   Demanding; serves 2 to 4; buildsOn only earlier dishes of the ladder;
//   libraryRef "" or a Library recipe; every techniqueRef a technique;
//   6 to 16 steps numbered 1..N, each with do, look, mistake and fix;
//   science 80 to 160 words; summary 2 or 3 sentences;
//   every ingredient with us and metric, a figure in us matched by one in metric;
//   in prose, every US quantity (cup, tbsp, tsp, oz, lb, quart, pint, inch)
//   followed by its metric figure in brackets, every °F beside a °C;
//   no em dash, en dash, their entities or a double hyphen anywhere;
//   no level by number in visible text; British spelling in prose;
//   a dish that uses the grill in the British sense (the overhead element, the
//   American broiler) glosses its first such mention, in the page's reading
//   order, as "grill (broiler)", so a cook in New Orleans does not light the
//   barbecue; "broiler" is otherwise American spelling and refused;
//   pairing.brennans "" or "<exact pack name>: why", the name a dish, cocktail
//   or wine in the Brennan's pack;
//   video.search a query; video.verified null or {url, title, channel, verifiedBy}
//   with a YouTube watch address.
//
// Usage: node tools/kitchen/check-training.mjs [file ...] [--quiet]
// With no file, every level*-*.json in src/lib/data/kitchen is checked.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA = path.join(ROOT, 'src', 'lib', 'data');
const KITCHEN = path.join(DATA, 'kitchen');
const PACK = path.join(ROOT, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json');

const MEALS = ['breakfast', 'lunch', 'dinner', 'dessert'];
const DIFFICULTY = ['Steady', 'Stretching', 'Demanding'];

/** @typedef {{ slug: string, level: number, meal: string, n: number, title: string, buildsOn: string[], libraryRef: string | null }} Rung */
/** @typedef {{ n: number, do: string, look: string, mistake: string, fix: string }} Step */
/** @typedef {{ item: string, us: string, metric: string, note: string }} Ingredient */
/** @typedef {{ url: string, title: string, channel: string, verifiedBy: string }} Verified */
/** @typedef {Record<string, any>} Dish */

const DASH_RE = /[\u2014\u2013]|&mdash;|&ndash;|&#8212;|&#8211;|&#x2014;|&#x2013;|-{2}/i;
const NUMERAL_RE = /\blevel\s*(?:[0-9]+|i{1,3}|iv|one|two|three|four)\b/i;
const AMERICAN_RE = /\b(?:color|colors|colored|flavor|flavors|flavored|flavorful|favorite|center|centers|centered|caramelize[sd]?|caramelizing|yogurt|fiber|savory|mold|molds|gray|tenderize[sd]?|tenderizing|theater|meter|liter|liters|aluminum|eggplant|cilantro|zucchini|ladyfingers?|cookie sheet|broiled|broiling|broil|broiler|omelet|omelets|odor|honor|neighbor|harbor|cozy|plow|mustache|pajamas|program|catalog|traveled|traveling|labeled|labeling|fueled|jewelry|skillful|fulfill)\b/i;
/**
 * The grill in the British sense: the oven's overhead element. Every pattern
 * ends on the word grill, so the gloss " (broiler)" must follow the match.
 * "grill pan", a charcoal or gas grill and "grilled" as a dish's name are the
 * outdoor or pan sense and match none of these.
 */
const BROILER_RE = /\boverhead grill\b|\bunder (?:the |a )?(?:(?:hot|very hot|fierce|hot overhead|very hot overhead)\s)?grill\b(?! pan)|\boven(?:'s)? (?:overhead |top )?grill\b|\btop grill\b|\bgrill(?= element)|\b(?:heat|preheat|switch|set)(?: on)? the (?:overhead |oven's )?grill\b(?! pan)|\bgrill(?= on high| to high| on to high| to its highest| to medium)/i;
const GLOSS = ' (broiler)';
/** The page's reading order (src/routes/kitchen/+page.svelte), for "first mention". */
const PAGE_ORDER = ['summary', 'skills', 'ingredients', 'equipment', 'mise', 'timeline', 'steps', 'science', 'plating', 'safety', 'pairing', 'variations'];
/** -ize words other than these are American. */
const IZE_OK = new Set(['size', 'sizes', 'sized', 'seize', 'seized', 'seizes', 'prize', 'prizes', 'prized', 'maize', 'capsize', 'capsized', 'downsize', 'bite-size', 'baize']);
const IZE_RE = /\b[a-z]+iz(?:e|es|ed|ing|ation|ations|er|ers)\b/gi;
/** A US quantity in prose; its metric must follow in brackets within a short span. */
const US_QTY_RE = /(\d+(?:\s\d+\/\d+|\/\d+|\.\d+)?)\s(?:to\s\d+(?:\/\d+)?\s)?(cups?|tbsp|tsp|oz|ounces?|lb|lbs|pounds?|quarts?|pints?|inch|inches)\b/gi;
const METRIC_AFTER_RE = /^[^()]{0,40}\([^)]*\d[^)]*(?:g|kg|ml|litres?|cm|mm)\b[^)]*\)/i;

/** @param {string} p */
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
/** @param {string} s */
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;
/** @param {string} s */
const sentences = (s) => (s.trim().match(/[.!?](?=\s+[A-Z(]|\s*$)/g) ?? []).length;

const args = process.argv.slice(2);
if (args.includes('--help')) {
	console.log('node tools/kitchen/check-training.mjs [file ...] [--quiet]\nProves the training dish files against curriculum.json and the entry shape; exits 1 naming each failure.');
	process.exit(0);
}
const quiet = args.includes('--quiet');
let files = args.filter((a) => !a.startsWith('--')).map((f) => path.resolve(f));
if (!files.length) files = fs.readdirSync(KITCHEN).filter((f) => /^level\d-[a-z-]+\.json$/.test(f)).map((f) => path.join(KITCHEN, f));
if (!files.length) {
	console.error('check-training: no training dish files found');
	process.exit(1);
}

const curriculum = readJson(path.join(KITCHEN, 'curriculum.json'));
/** @type {Rung[]} */
const ladder = curriculum.entries;
/** @param {Rung} e */
const rank = (e) => (e.level * 100 + e.n) * 10 + MEALS.indexOf(e.meal);
const ladderBySlug = new Map(ladder.map((e) => [e.slug, e]));
const recipeSlugs = new Set(readJson(path.join(DATA, 'recipes.index.json')).map((/** @type {{slug: string}} */ r) => r.slug));
const techSlugs = new Set(readJson(path.join(DATA, 'techniques.json')).map((/** @type {{slug: string}} */ t) => t.slug));
const house = readJson(PACK).house;
/** @type {string[]} */
const packNames = [...house.dishes, ...house.cocktails, ...house.wines].map((/** @type {{name: string}} */ x) => x.name);
const packNameSet = new Set(packNames);

/** @type {string[]} */
const problems = [];
/** @type {string[]} */
const report = [];

for (const file of files) {
	const rel = path.relative(ROOT, file);
	const m = path.basename(file).match(/^level(\d)-([a-z-]+)\.json$/);
	if (!m) {
		problems.push(`${rel}: name is not level<L>-<meal>-<meal>.json`);
		continue;
	}
	const level = Number(m[1]);
	const meals = m[2].split('-');
	if (meals.some((x) => !MEALS.includes(x))) {
		problems.push(`${rel}: unknown meal in the file name`);
		continue;
	}
	const want = ladder.filter((e) => e.level === level && meals.includes(e.meal));
	/** @type {Dish[]} */
	let dishes;
	try {
		dishes = readJson(file);
	} catch (err) {
		problems.push(`${rel}: not JSON (${/** @type {Error} */ (err).message})`);
		continue;
	}
	if (!Array.isArray(dishes)) {
		problems.push(`${rel}: not an array`);
		continue;
	}
	/** @param {Dish | null} d @param {string} msg */
	const fail = (d, msg) => problems.push(`${rel} ${d ? d.slug : ''}: ${msg}`);

	if (dishes.length !== want.length) fail(null, `${dishes.length} dishes, the ladder has ${want.length}`);
	want.forEach((w, i) => {
		const d = dishes[i];
		if (!d) return;
		if (d.slug !== w.slug) fail(d, `position ${i + 1} should be ${w.slug}`);
		for (const k of ['level', 'meal', 'n', 'title']) {
			// @ts-ignore indexed by name
			if (d[k] !== w[k]) fail(d, `${k} ${JSON.stringify(d[k])} differs from the ladder's ${JSON.stringify(w[k])}`);
		}
	});

	let steps = 0;
	let verified = 0;
	const seen = new Set();
	for (const d of dishes) {
		if (seen.has(d.slug)) fail(d, 'duplicate slug');
		seen.add(d.slug);
		const rung = ladderBySlug.get(d.slug);
		for (const k of ['slug', 'meal', 'title', 'cuisine', 'summary', 'libraryRef', 'serves', 'difficulty', 'science', 'plating']) {
			if (typeof d[k] !== 'string') fail(d, `${k} is not a string`);
			else if (k !== 'libraryRef' && !d[k].trim()) fail(d, `${k} is empty`);
		}
		for (const k of ['skills', 'buildsOn', 'techniqueRefs', 'equipment', 'mise', 'variations', 'safety']) {
			if (!Array.isArray(d[k]) || d[k].some((/** @type {unknown} */ x) => typeof x !== 'string' || !x.trim())) fail(d, `${k} is not a list of strings`);
		}
		for (const k of ['skills', 'equipment', 'mise']) if (Array.isArray(d[k]) && !d[k].length) fail(d, `${k} is empty`);
		if (Array.isArray(d.variations) && (d.variations.length < 2 || d.variations.length > 3)) fail(d, 'variations must number 2 or 3');
		if (!DIFFICULTY.includes(d.difficulty)) fail(d, `difficulty ${d.difficulty} not one of ${DIFFICULTY.join(', ')}`);
		const serves = String(d.serves).match(/\d+/g)?.map(Number) ?? [];
		if (!serves.length || serves.some((x) => x < 2 || x > 4)) fail(d, `serves "${d.serves}" is not 2 to 4`);
		if (!d.time || !Number.isInteger(d.time.active) || !Number.isInteger(d.time.total) || d.time.active <= 0 || d.time.total < d.time.active) fail(d, 'time needs active and total minutes, total at least active');
		const sc = typeof d.summary === 'string' ? sentences(d.summary) : 0;
		if (sc < 2 || sc > 3) fail(d, `summary has ${sc} sentences, 2 or 3 wanted`);
		const sw = typeof d.science === 'string' ? words(d.science) : 0;
		if (sw < 80 || sw > 160) fail(d, `science has ${sw} words, 80 to 160 wanted`);

		if (d.libraryRef && !recipeSlugs.has(d.libraryRef)) fail(d, `libraryRef ${d.libraryRef} is not a Library recipe`);
		if (rung && (d.libraryRef || null) !== (rung.libraryRef || null)) fail(d, `libraryRef differs from the ladder's ${rung.libraryRef}`);
		for (const t of d.techniqueRefs ?? []) if (!techSlugs.has(t)) fail(d, `techniqueRef ${t} is not a technique`);
		for (const b of d.buildsOn ?? []) {
			const t = ladderBySlug.get(b);
			if (!t) fail(d, `buildsOn ${b} is not a ladder dish`);
			else if (rung && rank(t) >= rank(rung)) fail(d, `buildsOn ${b} is not earlier`);
		}

		if (!Array.isArray(d.ingredients) || !d.ingredients.length) fail(d, 'ingredients missing');
		else
			for (const g of d.ingredients) {
				for (const k of ['item', 'us', 'metric', 'note']) if (typeof g[k] !== 'string') fail(d, `ingredient ${g.item}: ${k} is not a string`);
				if (!g.item?.trim() || !g.us?.trim() || !g.metric?.trim()) fail(d, `ingredient ${g.item}: item, us and metric must be filled`);
				if (/\d/.test(g.us ?? '') && !/\d/.test(g.metric ?? '')) fail(d, `ingredient ${g.item}: US figure "${g.us}" has no metric figure`);
			}
		if (!Array.isArray(d.timeline) || !d.timeline.length || d.timeline.some((/** @type {any} */ t) => typeof t.at !== 'string' || typeof t.do !== 'string' || !t.at.trim() || !t.do.trim())) fail(d, 'timeline must be a list of {at, do}');

		if (!Array.isArray(d.steps)) fail(d, 'steps missing');
		else {
			steps += d.steps.length;
			if (d.steps.length < 6 || d.steps.length > 16) fail(d, `${d.steps.length} steps, 6 to 16 wanted`);
			d.steps.forEach((/** @type {Step} */ s, i) => {
				if (s.n !== i + 1) fail(d, `step ${i + 1} is numbered ${s.n}`);
				for (const k of ['do', 'look', 'mistake', 'fix']) {
					// @ts-ignore indexed by name
					if (typeof s[k] !== 'string' || !s[k].trim()) fail(d, `step ${i + 1}: ${k} missing`);
				}
			});
		}

		const p = d.pairing;
		if (!p || typeof p.drink !== 'string' || !p.drink.trim() || typeof p.brennans !== 'string') fail(d, 'pairing needs drink and brennans');
		else if (p.brennans) {
			const name = p.brennans.split(': ')[0];
			if (!packNameSet.has(name)) fail(d, `brennans "${name}" is not a name in the Brennan's pack`);
			if (!p.brennans.includes(': ') || !p.brennans.split(': ').slice(1).join(': ').trim()) fail(d, 'brennans must read "<pack name>: why"');
		}

		const v = d.video;
		if (!v || typeof v.search !== 'string' || !v.search.trim()) fail(d, 'video.search missing');
		else if (v.verified !== null) {
			/** @type {Verified} */
			const vv = v.verified;
			if (!vv || ['url', 'title', 'channel', 'verifiedBy'].some((k) => typeof vv[/** @type {keyof Verified} */ (k)] !== 'string' || !vv[/** @type {keyof Verified} */ (k)].trim())) fail(d, 'video.verified must be null or {url, title, channel, verifiedBy}');
			else if (!/^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(vv.url)) fail(d, `video url ${vv.url} is not a YouTube watch address`);
			else verified++;
		}

		// Text rules over every visible string. Titles and pack names keep their own spelling.
		/** @type {string[]} */
		const all = [];
		/** @type {string[]} */
		const prose = [];
		/** @param {unknown} x @param {boolean} isProse */
		const collect = (x, isProse) => {
			if (typeof x === 'string') {
				all.push(x);
				if (isProse) prose.push(x);
			} else if (Array.isArray(x)) x.forEach((y) => collect(y, isProse));
			else if (x && typeof x === 'object') for (const [k, y] of Object.entries(x)) collect(y, isProse && !['url', 'title', 'channel', 'search', 'brennans'].includes(k));
		};
		for (const [k, x] of Object.entries(d)) {
			if (['slug', 'libraryRef', 'techniqueRefs', 'buildsOn', 'meal'].includes(k)) continue;
			collect(x, !['title', 'cuisine'].includes(k));
		}
		if (p && typeof p.brennans === 'string' && p.brennans) prose.push(p.brennans.split(': ').slice(1).join(': '));
		for (const s of all) {
			if (DASH_RE.test(s)) fail(d, `dash in "${s.slice(0, 80)}"`);
			if (NUMERAL_RE.test(s)) fail(d, `level by number in "${s.slice(0, 80)}"`);
		}
		// The first overhead-grill mention, in reading order, carries the gloss.
		/** @type {string[]} */
		const ordered = [];
		/** @param {unknown} x */
		const inOrder = (x) => {
			if (typeof x === 'string') ordered.push(x);
			else if (Array.isArray(x)) x.forEach(inOrder);
			else if (x && typeof x === 'object') for (const [k, y] of Object.entries(x)) if (!['url', 'title', 'channel', 'search', 'brennans', 'verifiedBy', 'at'].includes(k)) inOrder(y);
		};
		for (const k of PAGE_ORDER) inOrder(d[k]);
		const firstGrill = ordered.map((s) => ({ s, m: BROILER_RE.exec(s) })).find((x) => x.m);
		if (firstGrill?.m && !firstGrill.s.slice(firstGrill.m.index + firstGrill.m[0].length).startsWith(GLOSS)) fail(d, `first overhead grill mention needs "grill (broiler)" for a US cook: "${firstGrill.s.slice(Math.max(0, firstGrill.m.index - 30), firstGrill.m.index + 40)}"`);
		for (const s of prose) {
			const am = s.replace(/\bgrill \(broiler\)/gi, 'grill').match(AMERICAN_RE);
			if (am) fail(d, `American spelling "${am[0]}" in "${s.slice(0, 80)}"`);
			for (const z of s.match(IZE_RE) ?? []) if (!IZE_OK.has(z.toLowerCase())) fail(d, `American -ize spelling "${z}"`);
			const fs_ = (s.match(/°F/g) ?? []).length;
			const cs = (s.match(/°C/g) ?? []).length;
			if (fs_ !== cs) fail(d, `°F and °C not paired in "${s.slice(0, 80)}"`);
		}
		// US quantities in prose need their metric beside them (ingredient rows carry both fields).
		const ingStrings = new Set((d.ingredients ?? []).flatMap((/** @type {Ingredient} */ g) => [g.us, g.metric]));
		for (const s of prose) {
			if (ingStrings.has(s)) continue;
			for (const q of s.matchAll(US_QTY_RE)) {
				const after = s.slice((q.index ?? 0) + q[0].length);
				if (!METRIC_AFTER_RE.test(after)) fail(d, `US quantity "${q[0]}" without metric in "${s.slice(Math.max(0, (q.index ?? 0) - 20), (q.index ?? 0) + 60)}"`);
			}
		}
	}
	report.push(`${rel}: ${dishes.length} dishes, ${steps} steps, ${verified} verified videos`);
	if (!quiet) {
		for (const d of dishes) if (d.video?.verified) report.push(`  ${d.slug}: ${d.video.verified.title} (${d.video.verified.channel}) ${d.video.verified.url}`);
	}
}

console.log(report.join('\n'));
if (problems.length) {
	console.error(`\n${problems.length} problem(s):`);
	for (const p of problems) console.error('  ' + p);
	process.exit(1);
}
console.log('\ncheck-training: all rules hold.');
