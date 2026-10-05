#!/usr/bin/env node
// Extra gate for src/lib/data/kitchen/level4-dinner-dessert.json, run on top of
// check-training.mjs (which it calls first). check-training proves the ladder,
// the shape, steps, science length, dashes, spelling and the Brennan's names;
// this script adds the stricter rules the Chef dinner and dessert brief
// asks for:
//   every US quantity in prose followed directly by its metric in brackets
//     (check-training allows any bracket within 40 characters);
//   at least 60 percent of a dish's step instructions carry a figure (a
//     temperature, a time or a size), and every instruction runs 15 words or more;
//   every timeline entry begins "T minus", "Day", "Night", a count of days or
//     "Every"/"Daily";
//   pairing.drink names a reason (at least 12 words);
//   video.search is a short query and verified, when present, is a YouTube
//     watch address whose verifiedBy names WebSearch;
//   the file holds exactly the 50 Chef dinner and dessert slugs in order;
//   every ingredient whose us names a US unit has a metric carrying g, kg, ml,
//   litre, cm or mm;
//   a dish that names poultry, pork, minced meat or raw fish in its ingredients
//   carries at least one safety point naming a temperature in both scales or,
//   for raw fish, freezing or a raw-grade source;
//   every "N°F (M°C)" pair, and every "A to B°F (C to D°C)" range, converts
//   within 3 degrees Celsius (6 for oven heats of 250°F and above, which
//   kitchens round to the nearest ten).
// Usage: node tools/kitchen/check-level4-dinner-dessert.mjs

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FILE = path.join(ROOT, 'src', 'lib', 'data', 'kitchen', 'level4-dinner-dessert.json');

if (process.argv.includes('--help')) {
	console.log('node tools/kitchen/check-level4-dinner-dessert.mjs\nRuns check-training on the Chef dinner and dessert file, then the stricter rules; exits 1 naming each failure.');
	process.exit(0);
}

const base = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'kitchen', 'check-training.mjs'), FILE], { encoding: 'utf8' });
process.stdout.write(base.stdout);
process.stderr.write(base.stderr);

/** @type {Record<string, any>[]} */
const dishes = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const curriculum = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'lib', 'data', 'kitchen', 'curriculum.json'), 'utf8'));
const want = curriculum.entries
	.filter((/** @type {any} */ e) => e.level === 4 && (e.meal === 'dinner' || e.meal === 'dessert'))
	.sort((/** @type {any} */ a, /** @type {any} */ b) => (a.meal === b.meal ? a.n - b.n : a.meal === 'dinner' ? -1 : 1))
	.map((/** @type {any} */ e) => e.slug);

/** @type {string[]} */
const problems = [];
const got = dishes.map((d) => d.slug);
if (got.length !== 50 || want.length !== 50 || got.some((s, i) => s !== want[i])) problems.push(`slugs: want the 50 ladder slugs in order, got ${got.length}`);

const US_RE = /(\d+(?:\s\d+\/\d+|\/\d+|\.\d+)?)\s(?:to\s\d+(?:\/\d+)?\s)?(cups?|tbsp|tsp|oz|ounces?|lb|lbs|pounds?|quarts?|pints?|inch|inches)\b/gi;
const FIGURE_RE = /\d/;
const TIMELINE_RE = /^(T minus|Day|Night|\d+ days?|Every|Daily|Morning)/i;

for (const d of dishes) {
	/** @param {string} m */
	const fail = (m) => problems.push(`${d.slug}: ${m}`);
	const ingStrings = new Set((d.ingredients ?? []).flatMap((/** @type {any} */ g) => [g.us, g.metric]));
	/** @type {string[]} */
	const prose = [];
	/** @param {unknown} x */
	const walk = (x) => {
		if (typeof x === 'string') prose.push(x);
		else if (Array.isArray(x)) x.forEach(walk);
		else if (x && typeof x === 'object') for (const [k, y] of Object.entries(x)) if (!['url', 'search', 'verifiedBy', 'us', 'metric'].includes(k)) walk(y);
	};
	walk(d);
	for (const s of prose) {
		if (ingStrings.has(s)) continue;
		for (const q of s.matchAll(US_RE)) {
			const after = s.slice((q.index ?? 0) + q[0].length);
			if (!/^\s?\(/.test(after) && !/^,? (?:and|plus) /.test(after)) fail(`US quantity "${q[0]}" not followed by its metric in "${s.slice(Math.max(0, (q.index ?? 0) - 20), (q.index ?? 0) + 50)}"`);
		}
	}
	for (const g of d.ingredients ?? []) {
		if (/\b(cups?|tbsp|tsp|oz|lb|lbs|quarts?|pints?|inch|inches)\b/i.test(g.us) && !/\d\s?(g|kg|ml|litres?|cm|mm)\b/i.test(g.metric)) fail(`ingredient ${g.item}: US "${g.us}" has no metric unit in "${g.metric}"`);
	}
	const ingText = (d.ingredients ?? []).map((/** @type {any} */ g) => g.item).join(' ').toLowerCase();
	const safetyText = (d.safety ?? []).join(' ');
	if (/\b(chicken|duck|squab|pigeon|turkey|pork|rabbit|minced|mince)\b/.test(ingText) && !/°F[^.]*°C|°C[^.]*°F/.test(safetyText)) fail('meat or poultry dish without a safe internal temperature in both scales in safety');
	if (/sashimi|raw fish/.test(d.title.toLowerCase() + ' ' + ingText) && !/frozen|freez|sushi grade|raw consumption/i.test(safetyText)) fail('raw fish dish without a freezing or raw-grade sourcing point');
	for (const s of prose) {
		for (const m of s.matchAll(/(-?\d+(?:\.\d+)?)(?: to (-?\d+(?:\.\d+)?))?°F \((-?\d+(?:\.\d+)?)(?: to (-?\d+(?:\.\d+)?))?°C\)/g)) {
			const pairs = [[m[1], m[3]]];
			if (m[2] && m[4]) pairs.push([m[2], m[4]]);
			for (const [f, c] of pairs) if (Math.abs(((Number(f) - 32) * 5) / 9 - Number(c)) > (Number(f) >= 250 ? 6 : 3)) fail(`temperature ${f}°F is not ${c}°C in "${s.slice(Math.max(0, (m.index ?? 0) - 20), (m.index ?? 0) + 40)}"`);
		}
	}
	const st = d.steps ?? [];
	const withFigure = st.filter((/** @type {any} */ x) => FIGURE_RE.test(x.do)).length;
	if (st.length && withFigure / st.length < 0.6) fail(`only ${withFigure} of ${st.length} step instructions carry a figure (a temperature, time or size)`);
	for (const x of st) if (x.do.split(/\s+/).length < 15) fail(`step ${x.n} instruction is under 15 words`);
	for (const t of d.timeline ?? []) if (!TIMELINE_RE.test(t.at)) fail(`timeline "${t.at}" is not a T minus or day marker`);
	if ((d.pairing?.drink ?? '').split(/\s+/).length < 12) fail('pairing.drink gives no reason');
	if (!d.video || typeof d.video.search !== 'string' || d.video.search.split(/\s+/).length > 12) fail('video.search must be a short query');
	const v = d.video?.verified;
	if (v && (!/^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(v.url) || !/WebSearch/.test(v.verifiedBy))) fail('verified video must be a YouTube watch address verified by WebSearch');
}

const verified = dishes.filter((d) => d.video?.verified).length;
const steps = dishes.reduce((n, d) => n + (d.steps?.length ?? 0), 0);
const words = dishes.reduce((n, d) => n + JSON.stringify(d).split(/\s+/).length, 0);
console.log(`\nlevel4 dinner and dessert: ${dishes.length} dishes (${dishes.filter((d) => d.meal === 'dinner').length} dinner, ${dishes.filter((d) => d.meal === 'dessert').length} dessert), ${steps} steps, ${verified} verified videos, about ${words} words`);
if (problems.length) {
	console.error(`\n${problems.length} stricter problem(s):`);
	for (const p of problems) console.error('  ' + p);
}
process.exit(base.status || problems.length ? 1 : 0);
