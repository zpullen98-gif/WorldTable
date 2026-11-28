#!/usr/bin/env node
/* The base edits card chunk c4 of the wine list of 28 November 2026 needs that no staged entry can carry.

   A staged chunk adds entries after the base file's and fragments beside the edition's, and a component
   key may be filed once, so the three new bottle cards (Château Gloria 2017, Château La Tour de Mons
   2020 and the Château Charmail 2020 magnum) cannot join the existing components they belong to (the
   grapes, the Médoc, Margaux, red wine oak, the large formats, and the three components every floor
   bottle card reaches) from a staged file. The integrator runs this once, at the merge, before the
   build. It only adds item names; no prose is changed.

   Usage: node nov28-c4.base-edits.mjs            what would change, and whether every anchor is found
          node nov28-c4.base-edits.mjs --apply    make the edits (each once; a second run changes nothing)
   Then:  node tools/house/build-brennans.mjs --staging nov28-c4 (with the other nov28 chunks)
   Exits 1 when an anchor is missing, naming it, and writes nothing in that case. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BRENNANS = path.resolve(HERE, '..');
const ROOT = path.resolve(HERE, '..', '..', '..', '..');
const REL = (f) => path.relative(ROOT, f);
if (process.argv.includes('--help')) { console.log('node nov28-c4.base-edits.mjs [--apply]  the base edits of card chunk c4; see the head of the file'); process.exit(0); }
const APPLY = process.argv.includes('--apply');

const GLO = 'Château Gloria Saint-Julien 2017';
const LTM = 'Château La Tour de Mons Margaux 2020';
const CHM = 'Château Charmail Haut-Médoc 2020 (1.5 L magnum)';
const GAINS = {
	'wine-grape-cabernet-sauvignon': [GLO, LTM, CHM],
	'wine-grape-merlot': [GLO, LTM, CHM],
	'wine-grape-cabernet-franc': [CHM],
	'wine-region-medoc': [GLO, LTM, CHM],
	'wine-region-bordeaux-superieur': [LTM],
	'wine-oak-reds': [GLO, LTM, CHM],
	'wine-large-formats': [CHM],
	'wine-presenting-bottle': [GLO, LTM, CHM],
	'wine-corked': [GLO, LTM, CHM],
	'wine-story-grand-award-cellar': [GLO, LTM, CHM]
};
const PROSE = [];

const missing = [];
const report = [];
const writes = [];
const said = (file, what, state) => report.push(`${state.padEnd(7)} ${REL(file)}: ${what}`);
function readJson(file) {
	const text = fs.readFileSync(file, 'utf8');
	const data = JSON.parse(text);
	const indent = [2, '\t', 1].find((i) => JSON.stringify(data, null, i) + '\n' === text);
	if (indent === undefined) { missing.push(`${REL(file)}: not in a spelling this tool can write back byte for byte`); return null; }
	return { file, text, data, indent };
}
const COMPONENTS = path.join(BRENNANS, 'components');
const gained = new Set();
for (const f of fs.readdirSync(COMPONENTS).filter((x) => x.endsWith('.json')).sort()) {
	const file = path.join(COMPONENTS, f);
	const j = readJson(file);
	if (!j) continue;
	const list = Array.isArray(j.data.components) ? j.data.components : [];
	let adds = 0;
	for (const c of list) {
		const names = GAINS[c.key];
		if (!names || !Array.isArray(c.items)) continue;
		gained.add(c.key);
		for (const name of names) if (!c.items.includes(name)) { c.items.push(name); adds++; }
	}
	if (adds) said(file, `${adds} item(s) added to existing components for the three new bottle cards of chunk c4`, 'pending');
	for (const p of PROSE) {
		const c = list.find((x) => x.key === p.key);
		if (!c) continue;
		p.seen = true;
		const cur = c.explain;
		if (cur.includes(p.to)) { said(file, `${p.key} ${p.at} already carries the edit`, 'done'); continue; }
		if (!cur.includes(p.from)) { missing.push(`${REL(file)}: ${p.key} ${p.at} does not contain: ${p.from}`); continue; }
		c.explain = cur.split(p.from).join(p.to);
		said(file, `${p.key} ${p.at}: one sentence changed`, 'pending');
	}
	const next = JSON.stringify(j.data, null, j.indent) + '\n';
	if (next !== j.text) writes.push([file, next]);
}
for (const key of Object.keys(GAINS)) if (!gained.has(key)) missing.push(`${REL(COMPONENTS)}: no component with the key ${key}`);
for (const p of PROSE) if (!p.seen) missing.push(`${REL(COMPONENTS)}: no component with the key ${p.key}`);
for (const line of report) console.log('nov28-c4.base-edits: ' + line);
if (missing.length) { for (const m of missing) console.error('nov28-c4.base-edits: MISSING ' + m); console.error('nov28-c4.base-edits: nothing written'); process.exit(1); }
if (!writes.length) { console.log('nov28-c4.base-edits: nothing to do, every edit is in'); process.exit(0); }
if (!APPLY) { console.log(`nov28-c4.base-edits: ${writes.length} file(s) would change; run with --apply to write them`); process.exit(0); }
for (const [file, text] of writes) fs.writeFileSync(file, text);
console.log(`nov28-c4.base-edits: ${writes.length} file(s) written: ${writes.map(([f]) => REL(f)).join(', ')}`);
