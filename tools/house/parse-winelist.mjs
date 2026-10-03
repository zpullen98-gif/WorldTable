#!/usr/bin/env node
// Catalogues the owner's paste of the Binwise wine list into structured JSON.
// Reads brennans/pages/binwise-wine-list-<date>.txt and writes
// brennans/research/winelist-<date>.json. Deterministic, no network, no clock.
//
// The paste is a run of entries, each four lines: a bin number (or a line
// holding only a space and a tab when the list prints no bin), the wine, the
// vintage (NV or a year) and the price. A line holding one space closes an
// entry; an empty line closes a top section. Any other line is a heading.
//
// Usage: node tools/house/parse-winelist.mjs [--date 2026-10-03] [--check]
//   --check  parse and report, write nothing; exit 1 on any unparsed line.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
if (args.includes('--help')) {
	console.log('node tools/house/parse-winelist.mjs [--date YYYY-MM-DD] [--check]');
	process.exit(0);
}
const di = args.indexOf('--date');
const DATE = di >= 0 ? args[di + 1] : '2026-10-03';
const CHECK = args.includes('--check');
const SRC = join(HERE, 'brennans', 'pages', `binwise-wine-list-${DATE}.txt`);
const OUT = join(HERE, 'brennans', 'research', `winelist-${DATE}.json`);

// Headings that sit one level under the top section even when they follow a
// group heading (the paste does not mark where a group ends).
const LEVEL_TWO = [/• Large Format$/, /^Oregon & Washington State$/];
const LEVEL_TWO_IN = { 'United States ~ Sauvignon Blanc': ['Oregon'], 'Germany ~ White': ['Other'] };
const COLOURS = ['Sparkling', 'White', 'Red', 'Rose', 'Rosé', 'Champagne & Sparkling'];

const FORMATS = [
	[/\b15\s?L\b/i, '15L', 'Nebuchadnezzar'],
	[/\b12\s?L\b/i, '12L', 'Balthazar'],
	[/\b9\s?L\b/i, '9L', 'Salmanazar'],
	[/\b6\s?L\b/i, '6L', 'Methuselah'],
	[/\b4\.5\s?L\b/i, '4.5L', 'Rehoboam'],
	[/\b3\s?L\b/i, '3L', 'Double Magnum'],
	[/\b(1\.5\s?L|1500\s?ml)\b/i, '1.5L', 'Magnum'],
	[/\b500\s?ml\b/i, '500ml', ''],
	[/\b375\s?ml\b/i, '375ml', 'Half-bottle']
];
const FARMING = ['Biodynamic', 'Organic', 'Natural', 'Sustainable'];
const COUNTRY = { FR: 'France', US: 'United States', CA: 'California', DE: 'Germany', ES: 'Spain', IT: 'Italy', AT: 'Austria', AU: 'Australia', OR: 'Oregon', PT: 'Portugal', NZ: 'New Zealand' };

function parseName(raw) {
	let name = raw.trim();
	let size = '750ml';
	let sizeName = '';
	for (const [re, s, n] of FORMATS) {
		if (re.test(name)) { size = s; sizeName = n; break; }
	}
	const coravin = /\(Coravin\)/i.test(name);
	const farming = FARMING.filter((f) => new RegExp(`[~\\-]\\s*${f}\\b`, 'i').test(name));
	const disgorged = (name.match(/\((\d{1,2}(?:\.\d{1,2}){1,2})\)/) || [])[1] || '';
	// The display name drops the bullet format tail, the farming tail and the Coravin note.
	let display = name
		.replace(/\s*•\s*[^•]*$/, (m) => (/(ml|L\b|Magnum|Half|Methuselah|bottle)/i.test(m) ? '' : m))
		.replace(/\s*\(Coravin\)/i, '');
	for (const f of farming) display = display.replace(new RegExp(`\\s*[~\\-]\\s*${f}\\b`, 'i'), '');
	display = display.trim();
	// By-the-glass lines read "GRAPE - Producer Wine Region CC".
	let grape = '';
	const g = display.match(/^([A-ZÀ-Þ][A-ZÀ-Þ .'/&]+?) - (.+)$/);
	if (g) { grape = g[1].trim(); display = g[2].trim(); }
	let country = '';
	const cc = display.match(/\s([A-Z]{2})$/);
	if (cc && COUNTRY[cc[1]]) { country = COUNTRY[cc[1]]; }
	return { display, grape, country, size, sizeName, coravin, farming, disgorged };
}

const text = readFileSync(SRC, 'utf8');
const lines = text.split('\n');
// Skip the provenance paragraph: the list starts after the first empty line.
let i = lines.indexOf('') + 1;
const isBin = (s) => /^\d+$/.test(s) || s === ' \t';
const entries = [];
const unparsed = [];
let section = '';
let group = '';
let sub = '';
let afterBlank = true;
let lastWasHeading = false;
let groupIsParent = false;

for (; i < lines.length; i++) {
	const s = lines[i];
	if (isBin(s)) {
		const [name, vintage, price] = [lines[i + 1], lines[i + 2], lines[i + 3]];
		if (name === undefined || !/^(NV|\d{4})$/.test(vintage) || !/^\d[\d,.]*$/.test(price)) {
			unparsed.push({ line: i + 1, text: s });
			continue;
		}
		const p = parseName(name);
		entries.push({
			n: entries.length + 1,
			line: i + 1,
			section,
			group,
			sub,
			bin: s.trim(),
			name: name.trim(),
			wine: p.display,
			grape: p.grape,
			country: p.country,
			vintage,
			price: Number(price.replace(/,/g, '')),
			priceIs: section === 'By the Glass' ? 'glass' : 'bottle',
			size: p.size,
			sizeName: p.sizeName,
			coravin: p.coravin,
			farming: p.farming,
			disgorged: p.disgorged
		});
		i += 3;
		afterBlank = false;
		lastWasHeading = false;
		continue;
	}
	if (s === '') { afterBlank = true; lastWasHeading = false; continue; }
	if (s.trim() === '') continue;
	// A heading.
	const h = s.trim();
	if (afterBlank) {
		section = h; group = ''; sub = '';
		afterBlank = false; lastWasHeading = true; groupIsParent = false;
		continue;
	}
	const forcedTwo = LEVEL_TWO.some((re) => re.test(h)) || (LEVEL_TWO_IN[section] || []).includes(h) || COLOURS.includes(h);
	if (lastWasHeading && group) {
		// A heading straight under a heading: the first is a group of subs.
		groupIsParent = true;
		sub = h;
	} else if (lastWasHeading || forcedTwo || !groupIsParent) {
		group = h; sub = ''; groupIsParent = false;
	} else {
		sub = h;
	}
	lastWasHeading = true;
}

const bySection = {};
for (const e of entries) bySection[e.section] = (bySection[e.section] || 0) + 1;
const binCount = {};
for (const e of entries) if (e.bin) binCount[e.bin] = (binCount[e.bin] || 0) + 1;
const duplicateBins = Object.entries(binCount)
	.filter(([, c]) => c > 1)
	.map(([bin]) => ({ bin, entries: entries.filter((e) => e.bin === bin).map((e) => ({ section: e.section, name: e.name, vintage: e.vintage, price: e.price })) }));
// A bin printed twice for the same vintage at the same price is one bottle
// cross listed (a magnum under Large Formats and again under its region);
// anything else under one bin is worth a question to the cellar.
const sameBottle = (list) => list.every((e) => e.vintage === list[0].vintage && e.price === list[0].price);
const crossListed = duplicateBins.filter((d) => sameBottle(d.entries));
const binConflicts = duplicateBins.filter((d) => !sameBottle(d.entries));
const uniqueBottles = new Set(entries.map((e) => (e.bin ? `bin ${e.bin}|${e.vintage}|${e.price}` : `${e.name.toLowerCase()}|${e.vintage}|${e.price}`))).size;
const blankBins = entries.filter((e) => !e.bin).map((e) => ({ section: e.section, group: e.group, name: e.name, vintage: e.vintage, price: e.price }));
const key = (e) => `${e.name.toLowerCase()}|${e.vintage}`;
const seen = {};
for (const e of entries) (seen[key(e)] ||= []).push(e);
const repeated = Object.values(seen)
	.filter((list) => list.length > 1)
	.map((list) => ({ name: list[0].name, vintage: list[0].vintage, places: list.map((e) => `${e.section}${e.group ? ' / ' + e.group : ''}${e.sub ? ' / ' + e.sub : ''} (${e.bin || 'no bin'}, $${e.price})`) }));
const bySize = {};
for (const e of entries) bySize[e.size] = (bySize[e.size] || 0) + 1;
const prices = entries.filter((e) => e.priceIs === 'bottle').map((e) => e.price).sort((a, b) => a - b);
const vintages = entries.filter((e) => e.vintage !== 'NV').map((e) => Number(e.vintage)).sort((a, b) => a - b);

const report = {
	entries: entries.length,
	sections: Object.keys(bySection).length,
	bySection,
	bySize,
	glassPours: entries.filter((e) => e.priceIs === 'glass').length,
	coravin: entries.filter((e) => e.coravin).length,
	farming: entries.filter((e) => e.farming.length).length,
	nv: entries.filter((e) => e.vintage === 'NV').length,
	oldestVintage: vintages[0],
	newestVintage: vintages[vintages.length - 1],
	bottlePrice: { min: prices[0], median: prices[Math.floor(prices.length / 2)], max: prices[prices.length - 1] },
	blankBins: blankBins.length,
	uniqueBottles,
	duplicateBins: duplicateBins.length,
	crossListedBins: crossListed.length,
	binConflicts: binConflicts.length,
	listedMoreThanOnce: repeated.length,
	unparsed: unparsed.length
};

console.log(JSON.stringify(report, null, 2));
if (unparsed.length) {
	console.error('unparsed lines:', unparsed.slice(0, 20));
	process.exit(1);
}
if (!CHECK) {
	const out = {
		format: 'oot-winelist',
		version: 1,
		house: 'brennans-new-orleans',
		source: `brennans/pages/binwise-wine-list-${DATE}.txt`,
		sourceNote: 'The owner pasted the complete Binwise list on 3 October 2026; prices as printed, by the glass prices are per glass, every other price per bottle.',
		readOn: DATE,
		report,
		anomalies: { binConflicts, crossListed, blankBins, listedMoreThanOnce: repeated },
		entries
	};
	writeFileSync(OUT, JSON.stringify(out, null, '\t') + '\n');
	console.log('wrote', OUT);
}
