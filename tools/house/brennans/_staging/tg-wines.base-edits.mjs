#!/usr/bin/env node
/* The base edits the Dinner Pairing Wines sheet of 22 November 2026 needs that no staged entry can carry.

   A staged chunk adds entries after the base file's and adds fragments beside the edition's. Two things
   the sheet asks for live inside the base fragments themselves, so the integrator runs this once, at the
   merge, before the build:

   1. The two new pours join the existing components they belong to (the place, the tasting's wines),
      which a staged fragment cannot do: a key may be filed once.
   2. The component sentences that named the Fichet Mâcon-Igé or the Louis Jadot Beaune 1er Cru as poured
      with the tasting, or The Snickers as its fifth course, are brought up to the sheet: the old pours
      said in the past, the new pours named. Each edit names the component by key and replaces one exact
      phrase wherever it stands in that component (its explanation, its card, its producer profile, in
      whichever fragment file carries it). The sentences that only name the old wines as wines of the
      list stand.

   Usage: node tg-wines.base-edits.mjs            what would change, and whether every anchor is found
          node tg-wines.base-edits.mjs --apply    make the edits (each once; a second run changes nothing)
   Then:  node tools/house/build-brennans.mjs --staging tg-dishes-a,tg-dishes-b,tg-menu,tg-wines (or merge the chunks)
   Exits 1 when an anchor is missing, naming it, and writes nothing in that case. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BRENNANS = path.resolve(HERE, '..');
const ROOT = path.resolve(HERE, '..', '..', '..', '..');
const REL = (f) => path.relative(ROOT, f);
if (process.argv.includes('--help')) { console.log('node tg-wines.base-edits.mjs [--apply]  the base edits of the Dinner Pairing Wines sheet of 22 November 2026; see the head of the file'); process.exit(0); }
const APPLY = process.argv.includes('--apply');

const WEIN = 'Domaine Weinbach Sylvaner';
const LAZ = 'Domaine du Vieux Lazaret Châteauneuf-du-Pape Blanc';
const GAINS = {
	'wine-region-alsace': [WEIN],
	'wine-region-chateauneuf': [LAZ],
	'wine-region-southern-rhone': [LAZ],
	'wine-story-tasting-pours': [WEIN, LAZ]
};
const T = 'until November 2026';
const PROSE = [
	{ key: 'wine-grape-chardonnay', from: 'the Jadot Les Pucelles by Coravin and the Fichet Mâcon on the tasting,', to: 'the Jadot Les Pucelles by Coravin,' },
	{ key: 'wine-grape-pinot-noir', from: 'the Damien Martin Bourgogne and the Jadot Beaune by the glass to', to: 'the Damien Martin Bourgogne by the glass to' },
	{ key: 'wine-region-maconnais', from: 'Our dinner tasting white, the Fichet Château London, comes from Igé.', to: `The Fichet Château London, our dinner tasting white ${T}, comes from Igé.` },
	{ key: 'wine-region-cote-de-beaune', from: 'the Jadot Beaune Premier Cru on the dinner tasting, the Bouchard Clos de la Mousse,', to: 'the Bouchard Clos de la Mousse,' },
	{ key: 'wine-region-beaune', from: 'Our dinner tasting pours the Jadot Beaune Premier Cru with the Redfish Véronique, and', to: `Our dinner tasting poured the Jadot Beaune Premier Cru ${T}, and` },
	{ key: 'wine-region-beaune', from: 'Our Jadot Beaune Premier Cru pours with the Redfish Véronique on the dinner tasting.', to: `The Jadot Beaune Premier Cru was a dinner tasting pour ${T}; the Bouchard Clos de la Mousse is on the half-bottle list.` },
	{ key: 'wine-story-tasting-pours', from: 'On the dinner pairing, the Charles Lafitte opens with the Grand Isle Jewel oysters, the Fichet Château London Mâcon-Igé meets the Louisiana BBQ lobster, the Louis Jadot Beaune Premier Cru the Redfish Véronique, the Paul Hobbs Coombsville Cabernet the Rohan duck, and the La Tour Vieille Banyuls the dessert.', to: 'On the dinner pairing, as the sheet of 22 November 2026 prints it, the Charles Lafitte opens with the Grand Isle Jewel oysters, the Domaine Weinbach Sylvaner meets the Tuna Crudo, the Domaine du Vieux Lazaret white Châteauneuf-du-Pape the Fish Bouillabaisse, the Paul Hobbs Coombsville Cabernet the Rohan duck, and the La Tour Vieille Banyuls the Chocolate Crémeux.' },
	{ key: 'wine-story-tasting-pours', from: 'Charles Lafitte with the oysters, Fichet Mâcon-Igé with the BBQ lobster, Jadot Beaune with the redfish, Paul Hobbs with the duck, La Tour Vieille Banyuls with dessert.', to: 'Charles Lafitte with the oysters, Weinbach Sylvaner with the tuna, Vieux Lazaret Blanc with the bouillabaisse, Paul Hobbs with the duck, La Tour Vieille Banyuls with the crémeux.' },
	{ key: 'wine-story-jadot', from: 'Confirm at lineup that it is tonight\'s redfish pour: the house website has shown a Jadot Beaune Bressandes Premier Cru 2022 for that course.', to: 'The Beaune Premier Cru left the dinner tasting with the pairing sheet of 22 November 2026; whether it is still in the cellar is a sommelier question.' },
	{ key: 'wine-story-jadot', from: 'Louis Jadot\'s Beaune Premier Cru, from the great house of Beaune with Bacchus on every label: bright red fruit, silky, lovely with the redfish.', to: 'Louis Jadot, the great house of Beaune with Bacchus on every label: our Les Pucelles by Coravin is its Puligny-Montrachet premier cru.' },
	{ key: 'wine-story-two-fichets', from: 'The dinner tasting\'s white, Fichet Château London Mâcon-Igé, comes from', to: `The Fichet Château London Mâcon-Igé, the dinner tasting's white ${T}, comes from` },
	{ key: 'wine-story-two-fichets', from: 'So say Fichet of Igé for the tasting,', to: 'So say Fichet of Igé for the Château London,' },
	{ key: 'wine-story-paul-hobbs', from: 'the Jadot Beaune before it is the other red.', to: 'the Vieux Lazaret white Châteauneuf-du-Pape comes before it.' },
	{ key: 'cellar-domaine-fichet', from: 'Domaine Fichet of Igé, the family behind our dinner tasting white', to: `Domaine Fichet of Igé, the family behind our dinner tasting white ${T}` },
	{ key: 'cellar-domaine-fichet', from: 'Confirm at lineup that it is tonight\'s lobster pour: the house website has shown Domaine Matrot Meursault 2023 for that course.', to: 'It left the dinner tasting with the pairing sheet of 22 November 2026, which pours a Domaine Weinbach Sylvaner at that course; whether it is still in the cellar is a sommelier question.' },
	{ key: 'cellar-domaine-fichet', from: 'With the lobster, Château London from the Fichet family of Igé: a vineyard, not a castle, round enough for the butter.', to: 'Château London from the Fichet family of Igé: a vineyard, not a castle, Chardonnay round enough for butter.' },
	{ key: 'cellar-domaine-fichet', from: 'Is the Fichet Château London still the lobster pour on the dinner tasting, or has it changed to the Matrot Meursault?', to: 'Is the Fichet Château London still in the cellar now that it has left the dinner tasting?' },
	{ key: 'cellar-domaine-fichet', from: 'Can the Fichet Château London be sold by the glass à la carte, or is it a tasting pour only?', to: 'Can the Fichet Château London be sold by the bottle or the glass now that it has left the tasting?' },
	{ key: 'cellar-jean-philippe-fichet', from: 'whose Château London is the dinner tasting white.', to: `whose Château London was the dinner tasting white ${T}.` },
	{ key: 'cellar-jean-philippe-fichet', from: 'The tasting’s Château London comes from', to: 'The Château London, once the tasting’s white, comes from' },
	{ key: 'cellar-jean-philippe-fichet', from: 'maker of the Château London Mâcon-Igé on our dinner tasting.', to: `maker of the Château London Mâcon-Igé, our dinner tasting white ${T}.`, all: true },
	{ key: 'cellar-matrot', from: 'The house website has shown a Matrot Meursault 2023 with the lobster on the dinner tasting; read the printed card for tonight’s pour.', to: 'The house website once showed a Matrot Meursault 2023 with the lobster on the dinner tasting; the pairing sheet of 22 November 2026 pours a Domaine Weinbach Sylvaner at that course.' },
	{ key: 'cellar-matrot', from: 'Is the dinner tasting’s lobster pour tonight the Fichet Mâcon-Igé 2024 or the Matrot Meursault 2023?', to: 'Does the cellar hold any Matrot Meursault besides the Bourgogne Blanc half-bottle?' },
	{ key: 'story-cremeux-word', from: 'Our dinner tasting closes with The Snickers and a glass of Banyuls, chocolate\'s classic partner; the Fall tasting\'s crémeux is chocolate in the French pastry idiom instead, and the Banyuls fits it as well.', to: 'Our dinner tasting closes with the Chocolate Crémeux and a glass of Banyuls, chocolate\'s classic partner.' },
	{ key: 'cellar-la-tour-vieille', from: 'with The Snickers', to: 'with the Chocolate Crémeux', all: true }
];

const missing = [];
const report = [];
const writes = [];
const said = (file, what, state) => report.push(`${state.padEnd(7)} ${REL(file)}: ${what}`);

/* A JSON file is rewritten only in the spelling it already has, so the diff is the edit and no more. */
function readJson(file) {
	const text = fs.readFileSync(file, 'utf8');
	const data = JSON.parse(text);
	const indent = [2, '\t', 1].find((i) => JSON.stringify(data, null, i) + '\n' === text);
	if (indent === undefined) { missing.push(`${REL(file)}: not in a spelling this tool can write back byte for byte`); return null; }
	return { file, text, data, indent };
}
function keep(j) {
	const next = JSON.stringify(j.data, null, j.indent) + '\n';
	if (next !== j.text) writes.push([j.file, next]);
}
/* Every string under a value that holds `from` has it replaced; returns how many strings changed, and
   how many already read as the new words. */
function replaceIn(value, p, count) {
	const step = (s) => {
		if (s.includes(p.to)) { count.done++; return s; }
		if (s.includes(p.from)) { count.n++; return s.split(p.from).join(p.to); }
		return s;
	};
	if (Array.isArray(value)) { value.forEach((v, i) => { if (typeof v === 'string') value[i] = step(v); else replaceIn(v, p, count); }); return; }
	if (value && typeof value === 'object') for (const k of Object.keys(value)) { const v = value[k]; if (typeof v === 'string') value[k] = step(v); else replaceIn(v, p, count); }
}

/* BRENNANS_COMPONENTS names another directory, as for the builder: a scratch copy to try the edits on. */
const COMPONENTS = process.env.BRENNANS_COMPONENTS ? path.resolve(process.env.BRENNANS_COMPONENTS) : path.join(BRENNANS, 'components');
const gained = new Set();
for (const p of PROSE) p.count = { n: 0, done: 0 };
for (const f of fs.readdirSync(COMPONENTS).filter((x) => x.endsWith('.json')).sort()) {
	const file = path.join(COMPONENTS, f);
	const j = readJson(file);
	if (!j || !j.data || Array.isArray(j.data)) continue;
	const comps = Array.isArray(j.data.components) ? j.data.components : [];
	const prods = Array.isArray(j.data.producers) ? j.data.producers : [];
	let adds = 0;
	for (const c of comps) {
		const names = GAINS[c.key];
		if (!names || !Array.isArray(c.items)) continue;
		gained.add(c.key);
		for (const name of names) if (!c.items.includes(name)) { c.items.push(name); adds++; }
	}
	if (adds) said(file, `${adds} item(s) added to existing components for the two new pours`, 'pending');
	for (const p of PROSE) {
		const before = p.count.n;
		for (const c of comps) if (c.key === p.key) { p.seen = true; replaceIn(c, p, p.count); }
		for (const x of prods) if (x.component === p.key) { p.seen = true; replaceIn(x, p, p.count); }
		if (p.count.n > before) said(file, `${p.key}: ${p.count.n - before} string(s) brought up to the sheet`, 'pending');
	}
	keep(j);
}
for (const key of Object.keys(GAINS)) if (!gained.has(key)) missing.push(`${REL(COMPONENTS)}: no component with the key ${key}`);
for (const p of PROSE) {
	if (!p.seen) { missing.push(`${REL(COMPONENTS)}: no component with the key ${p.key}`); continue; }
	if (!p.count.n && !p.count.done) missing.push(`${REL(COMPONENTS)}: ${p.key} does not contain: ${p.from}`);
	else if (!p.count.n) said(COMPONENTS, `${p.key} already reads: ${p.to.slice(0, 60)}`, 'done');
	else if (p.count.n > 1 && !p.all) missing.push(`${REL(COMPONENTS)}: ${p.key} holds ${p.count.n} strings with: ${p.from} (expected one)`);
}

for (const line of report) console.log('tg-wines.base-edits: ' + line);
if (missing.length) { for (const m of missing) console.error('tg-wines.base-edits: MISSING ' + m); console.error('tg-wines.base-edits: nothing written'); process.exit(1); }
if (!writes.length) { console.log('tg-wines.base-edits: nothing to do, every edit is in'); process.exit(0); }
if (!APPLY) { console.log(`tg-wines.base-edits: ${writes.length} file(s) would change; run with --apply to write them`); process.exit(0); }
for (const [file, text] of writes) fs.writeFileSync(file, text);
console.log(`tg-wines.base-edits: ${writes.length} file(s) written: ${writes.map(([f]) => REL(f)).join(', ')}`);
console.log('tg-wines.base-edits: now build the edition with its staged chunks, or merge them');
