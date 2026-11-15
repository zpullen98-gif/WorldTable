#!/usr/bin/env node
/* The base edits the November glass list needs that no staged entry can carry (15 November 2026).

   A staged chunk adds entries after the base file's and adds fragments beside the edition's. Four
   things the glass sheet of 15 November 2026 asks for live inside the base files themselves, so the
   integrator runs this once, at the merge, before the build:

   1. Two asks gain the sheet's own words, held back from the wine records for the tests that pin them
      (a-sjcs33ot, the Minuty: the sheet prints 2023; a-kqp6jzgr, the house Champagne: the sheet's
      assemblage). An ask has no name an override can target, and its id is minted from the first sixty
      characters of its question, so the words are appended and the ids hold.
   2. Two card names change (nov-wines-names.overrides.json): the Famille Durand to 2025 and La Miraja's
      Le Masche to Superiore. Two asks, the fragments and Cook at home name those wines by their exact old
      names, and the builder resolves a name only by the card's name or the name its id was minted under.
      Every exact reference is moved to the new name.
   3. The four new glass wines join the existing components they belong to (the grape, the place, the
      Coravin, the house of Jadot, the glass list), which a staged fragment cannot do: a key may be filed
      once. Four components named the Leflaive as a glass pour; that sentence in each is brought up to the
      sheet.
   4. Cook at home's links (src/lib/data/kitchen) follow the two names. Run npm run build:kitchen after
      the edition is kept, since its check reads the kept pack.

   Usage: node nov-wines.base-edits.mjs            what would change, and whether every anchor is found
          node nov-wines.base-edits.mjs --apply    make the edits (each once; a second run changes nothing)
   Then:  node tools/house/build-brennans.mjs --staging nov-dishes,nov-wines,nov-wines-names
   Exits 1 when an anchor is missing, naming it, and writes nothing in that case. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BRENNANS = path.resolve(HERE, '..');
const ROOT = path.resolve(HERE, '..', '..', '..', '..');
const REL = (f) => path.relative(ROOT, f);
if (process.argv.includes('--help')) { console.log('node nov-wines.base-edits.mjs [--apply]  the base edits of the November glass list; see the head of the file'); process.exit(0); }
const APPLY = process.argv.includes('--apply');

const RENAMES = [
	['Famille Durand Val de Loire Sauvignon Blanc 2024', 'Famille Durand Val de Loire Sauvignon Blanc 2025'],
	['La Miraja ‘Le Masche’ Barbera d’Asti 2023', 'La Miraja ‘Le Masche’ Barbera d’Asti Superiore 2023']
];
const LEM = 'Lemelson Vineyards ‘Tikka’s Run’ Pinot Gris 2022';
const KOK = 'Kokomo Sonoma County Cabernet Sauvignon 2022';
const JAD = 'Louis Jadot ‘Les Pucelles’ Puligny-Montrachet Premier Cru 2008 (Coravin)';
const COU = 'Domaine de Courcel ‘Grand Clos des Épenots’ Pommard Premier Cru 2007 (Coravin)';
const GAINS = {
	'wine-grape-pinot-gris': [LEM],
	'wine-region-willamette': [LEM],
	'wine-grape-cabernet-sauvignon': [KOK],
	'wine-region-sonoma': [KOK],
	'wine-grape-chardonnay': [JAD],
	'wine-region-puligny': [JAD],
	'wine-story-jadot': [JAD],
	'wine-grape-pinot-noir': [COU],
	'wine-region-cote-de-beaune': [JAD, COU],
	'wine-burgundy-tiers': [JAD, COU],
	'wine-coravin': [JAD, COU],
	'wine-story-by-the-glass': [LEM, KOK, JAD, COU]
};
/* The four components that named the Leflaive as a glass pour: the sentence that said so, and no more. */
const PROSE = [
	{ key: 'wine-story-by-the-glass', at: 'explain', from: 'Two are poured by Coravin, the Leflaive Mâcon-Verzé through the cork and the Rare under a sparkling stopper,', to: 'Three are poured by Coravin, the Louis Jadot Les Pucelles and the Domaine de Courcel Pommard through the cork and the Rare under a sparkling stopper,' },
	{ key: 'wine-story-by-the-glass', at: 'back', from: 'The Leflaive Mâcon-Verzé and the Rare.', to: 'The Jadot Les Pucelles, the de Courcel Pommard and the Rare.' },
	{ key: 'wine-coravin', at: 'explain', from: 'So a bottle such as the Domaine Leflaive Mâcon-Verzé can be poured', to: 'So a bottle such as the Louis Jadot Les Pucelles can be poured' },
	{ key: 'wine-story-leflaive', at: 'explain', from: 'On our list: the Mâcon-Verzé by Coravin by the glass and by the bottle,', to: 'On our list: the Mâcon-Verzé by the bottle, our Coravin glass until November 2026,' },
	{ key: 'wine-story-leflaive', at: 'front', from: 'and what do we pour by the glass?', to: 'and what did we pour by the glass?' },
	{ key: 'wine-grape-chardonnay', at: 'explain', from: 'the Leflaive and Fichet Mâcons by the glass,', to: 'the Jadot Les Pucelles by Coravin and the Fichet Mâcon on the tasting,' },
	{ key: 'wine-story-leflaive', at: 'back', from: 'We pour its Mâcon-Verzé by Coravin, by the glass.', to: 'Its Mâcon-Verzé was our Coravin glass until November 2026.' }
];
const ASKS = [
	{ id: 'a-sjcs33ot', opens: /^Is the open Minuty Prestige still the 2024/, add: ' The 15 November glass sheet prints 2023.' },
	{ id: 'a-kqp6jzgr', opens: /^Which grapes are in Brennan.s Essential\?/, add: ' The Wines by the Glass sheet of 15 November 2026 prints: “The assemblage is 44% Pinot Noir, 34% Meunier, & 22% Chardonnay.”' }
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
/* Every string exactly equal to an old name becomes the new one, at any depth. */
function renameIn(value, count) {
	if (Array.isArray(value)) { value.forEach((v, i) => { if (typeof v === 'string') { const r = RENAMES.find((x) => x[0] === v); if (r) { value[i] = r[1]; count.n++; } } else renameIn(v, count); }); return; }
	if (value && typeof value === 'object') for (const k of Object.keys(value)) { const v = value[k]; if (typeof v === 'string') { const r = RENAMES.find((x) => x[0] === v); if (r) { value[k] = r[1]; count.n++; } } else renameIn(v, count); }
}

/* 1 and 2: overrides.json, the two asks' words and the asks that name a renamed wine among their items. */
const OVERRIDES = path.join(BRENNANS, 'overrides.json');
const o = readJson(OVERRIDES);
if (o) {
	const asks = o.data.entries.filter((e) => e.target === 'ask:+' && e.value && typeof e.value.question === 'string');
	for (const a of ASKS) {
		const hits = asks.filter((e) => a.opens.test(e.value.question));
		if (hits.length !== 1) { missing.push(`${REL(OVERRIDES)}: ${hits.length} asks open as ${a.opens} (${a.id}), expected one`); continue; }
		const q = hits[0].value.question;
		if (q.endsWith(a.add)) said(OVERRIDES, `ask ${a.id} already carries the sheet's words`, 'done');
		else { hits[0].value.question = q + a.add; said(OVERRIDES, `ask ${a.id} gains:${a.add}`, 'pending'); }
	}
	let n = 0;
	for (const e of asks) if (Array.isArray(e.value.items)) e.value.items.forEach((name, i) => { const r = RENAMES.find((x) => x[0] === name); if (r) { e.value.items[i] = r[1]; n++; } });
	said(OVERRIDES, `${n} ask item name(s) moved to the new card names`, n ? 'pending' : 'done');
	keep(o);
}

/* 2 and 3: the fragments. */
const COMPONENTS = path.join(BRENNANS, 'components');
const gained = new Set();
for (const f of fs.readdirSync(COMPONENTS).filter((x) => x.endsWith('.json')).sort()) {
	const file = path.join(COMPONENTS, f);
	const j = readJson(file);
	if (!j) continue;
	const count = { n: 0 };
	renameIn(j.data, count);
	if (count.n) said(file, `${count.n} exact name(s) moved to the new card names`, 'pending');
	let adds = 0;
	for (const c of Array.isArray(j.data.components) ? j.data.components : []) {
		const names = GAINS[c.key];
		if (!names || !Array.isArray(c.items)) continue;
		gained.add(c.key);
		for (const name of names) if (!c.items.includes(name)) { c.items.push(name); adds++; }
	}
	if (adds) said(file, `${adds} item(s) added to existing components for the four new glass wines`, 'pending');
	for (const p of PROSE) {
		const c = (Array.isArray(j.data.components) ? j.data.components : []).find((x) => x.key === p.key);
		if (!c) continue;
		p.seen = true;
		const cur = p.at === 'back' ? c.card.back : p.at === 'front' ? c.card.front : c.explain;
		if (cur.includes(p.to)) { said(file, `${p.key} ${p.at} already reads as the new glass list`, 'done'); continue; }
		if (!cur.includes(p.from)) { missing.push(`${REL(file)}: ${p.key} ${p.at} does not contain: ${p.from}`); continue; }
		const next = cur.split(p.from).join(p.to);
		if (p.at === 'back') c.card.back = next; else if (p.at === 'front') c.card.front = next; else c.explain = next;
		said(file, `${p.key} ${p.at}: the sentence naming the Leflaive as the Coravin glass is brought up to the sheet`, 'pending');
	}
	keep(j);
}
for (const key of Object.keys(GAINS)) if (!gained.has(key)) missing.push(`${REL(COMPONENTS)}: no component with the key ${key}`);
for (const p of PROSE) if (!p.seen) missing.push(`${REL(COMPONENTS)}: no component with the key ${p.key}`);

/* 4: Cook at home. The link reads "<pack name>: why", so only the name before the colon moves. */
const KITCHEN = path.join(ROOT, 'src', 'lib', 'data', 'kitchen');
let links = 0;
for (const f of fs.readdirSync(KITCHEN).filter((x) => x.endsWith('.json')).sort()) {
	const file = path.join(KITCHEN, f);
	let text = fs.readFileSync(file, 'utf8');
	let n = 0;
	for (const [from, to] of RENAMES) {
		const a = `"brennans": ${JSON.stringify(from + ': ').slice(0, -1)}`;
		const b = `"brennans": ${JSON.stringify(to + ': ').slice(0, -1)}`;
		const parts = text.split(a);
		n += parts.length - 1;
		text = parts.join(b);
	}
	if (n) { links += n; writes.push([file, text]); said(file, `${n} Cook at home link(s) moved to the new card names`, 'pending'); }
}
if (!links) said(KITCHEN, 'Cook at home already names the new cards', 'done');

for (const line of report) console.log('nov-wines.base-edits: ' + line);
if (missing.length) { for (const m of missing) console.error('nov-wines.base-edits: MISSING ' + m); console.error('nov-wines.base-edits: nothing written'); process.exit(1); }
if (!writes.length) { console.log('nov-wines.base-edits: nothing to do, every edit is in'); process.exit(0); }
if (!APPLY) { console.log(`nov-wines.base-edits: ${writes.length} file(s) would change; run with --apply to write them`); process.exit(0); }
for (const [file, text] of writes) fs.writeFileSync(file, text);
console.log(`nov-wines.base-edits: ${writes.length} file(s) written: ${writes.map(([f]) => REL(f)).join(', ')}`);
console.log('nov-wines.base-edits: now build with --staging nov-dishes,nov-wines,nov-wines-names (or merge the three chunks), and run npm run build:kitchen once the edition is kept');
