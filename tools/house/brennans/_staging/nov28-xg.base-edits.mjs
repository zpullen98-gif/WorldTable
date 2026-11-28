#!/usr/bin/env node
/* The base edits chunk g1 of the wine list of 28 November 2026 needs that no staged entry can carry.

   A staged entry changes the cards; the components are fragments, so the prose they hold about the glass
   pours whose printed facts moved is changed here. The Binwise list of 28 November 2026 prints the Durban
   at $18 a glass and no longer prints Durban's Beaumes-de-Venise 2023 bottle (bin 10411), and it prints the
   rosé by the glass at 2025. The integrator runs this once, at the merge, before the build. It changes
   four passages of the Durban's producer profile (one fact, one note, one question dropped as answered)
   and five of Minuty's (the story's explain, the profile's history, two facts, one note, one question
   dropped as answered).

   Usage: node nov28-xg.base-edits.mjs            what would change, and whether every anchor is found
          node nov28-xg.base-edits.mjs --apply    make the edits (each once; a second run changes nothing)
   Then:  node tools/house/build-brennans.mjs --staging nov28-xg (with the other nov28 chunks)
   Exits 1 when an anchor is missing, naming it, and writes nothing in that case. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BRENNANS = path.resolve(HERE, '..');
const ROOT = path.resolve(HERE, '..', '..', '..', '..');
const REL = (f) => path.relative(ROOT, f);
if (process.argv.includes('--help')) { console.log('node nov28-xg.base-edits.mjs [--apply]  the base edits of chunk g1; see the head of the file'); process.exit(0); }
const APPLY = process.argv.includes('--apply');

/* Each edit names the record by its component key, in components (c) or in producers (p), the path inside
   it, and either a from and a to (a passage replaced) or drop (a list entry removed). */
const EDITS = [
	{ list: 'components', key: 'cellar-durban', at: 'producer.facts.6', from: "On the Binwise list of 3 October 2026 the bottle list also carries Durban's Beaumes-de-Venise 2023, bin 10411.", to: "The Binwise list of 28 November 2026 prints the Durban by the glass only: the Beaumes-de-Venise 2023 at bin 10411, on the bottle list of 3 October 2026, is no longer printed." },
	{ list: 'components', key: 'cellar-durban', at: 'producer.notes.4', from: 'The glass is $19 on the current menu; Binwise still prints $18.', to: 'The glass is $18 on the Binwise list of 28 November 2026; the menu page of 3 October 2026 printed $19.00.' },
	{ list: 'components', key: 'cellar-durban', at: 'producer.askKitchen', drop: 'Is the glass $19, as the current menu prints, or $18, as Binwise prints?' },
	{ list: 'components', key: 'wine-story-minuty', at: 'explain', from: 'Our glass is the Minuty Prestige 2024:', to: 'Our glass is the Minuty Prestige 2025:' },
	{ list: 'producers', key: 'wine-story-minuty', at: 'producer.history', from: 'Ours is the Prestige 2024, our rosé by the glass at $17', to: 'Ours is the Prestige 2025, our rosé by the glass at $17' },
	{ list: 'producers', key: 'wine-story-minuty', at: 'producer.facts.4', from: 'Exact 2024 proportions remain unconfirmed.', to: 'Exact 2025 proportions remain unconfirmed.' },
	{ list: 'producers', key: 'wine-story-minuty', at: 'producer.facts.6', from: 'Our Prestige 2024 is the rosé by the glass at $17', to: 'Our Prestige 2025 is the rosé by the glass at $17' },
	{ list: 'producers', key: 'wine-story-minuty', at: 'producer.notes.3', from: 'Read the vintage at lineup: young rosé rolls over, and the open bottle may already be the 2025.', to: 'Read the label at lineup: the Binwise list of 28 November 2026 prints the 2025 as “Prestige” Côtes de Provence with no producer name, and young rosé rolls over.' },
	{ list: 'producers', key: 'wine-story-minuty', at: 'producer.askKitchen', drop: 'Is the open Minuty Prestige still the 2024, or has the 2025 arrived?' }
];
const getAt = (c, at) => at.split('.').reduce((o, k) => (o == null ? o : o[k]), c);
const setAt = (c, at, v) => { const ks = at.split('.'); const last = ks.pop(); ks.reduce((o, k) => o[k], c)[last] = v; };

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
for (const f of fs.readdirSync(COMPONENTS).filter((x) => x.endsWith('.json')).sort()) {
	const file = path.join(COMPONENTS, f);
	const j = readJson(file);
	if (!j) continue;
	for (const e of EDITS) {
		const list = Array.isArray(j.data[e.list]) ? j.data[e.list] : [];
		const rec = list.find((x) => (e.list === 'producers' ? x.component : x.key) === e.key);
		if (!rec) continue;
		e.seen = true;
		const cur = getAt(rec, e.at);
		if (e.drop !== undefined) {
			if (!Array.isArray(cur)) { missing.push(`${REL(file)}: ${e.key} has no list ${e.at}`); continue; }
			if (!cur.includes(e.drop)) { said(file, `${e.key} ${e.at}: the answered question is already gone`, 'done'); continue; }
			setAt(rec, e.at, cur.filter((x) => x !== e.drop));
			said(file, `${e.key} ${e.at}: one answered question dropped`, 'pending');
			continue;
		}
		if (typeof cur !== 'string') { missing.push(`${REL(file)}: ${e.key} has no ${e.at}`); continue; }
		if (cur.includes(e.to)) { said(file, `${e.key} ${e.at} already carries the edit`, 'done'); continue; }
		if (!cur.includes(e.from)) { missing.push(`${REL(file)}: ${e.key} ${e.at} does not contain: ${e.from}`); continue; }
		setAt(rec, e.at, cur.split(e.from).join(e.to));
		said(file, `${e.key} ${e.at}: one passage changed`, 'pending');
	}
	const next = JSON.stringify(j.data, null, j.indent) + '\n';
	if (next !== j.text) writes.push([file, next]);
}
for (const e of EDITS) if (!e.seen) missing.push(`${REL(COMPONENTS)}: no ${e.list} record with the key ${e.key}`);
for (const line of report) console.log('nov28-xg.base-edits: ' + line);
if (missing.length) { for (const m of missing) console.error('nov28-xg.base-edits: MISSING ' + m); console.error('nov28-xg.base-edits: nothing written'); process.exit(1); }
if (!writes.length) { console.log('nov28-xg.base-edits: nothing to do, every edit is in'); process.exit(0); }
if (!APPLY) { console.log(`nov28-xg.base-edits: ${writes.length} file(s) would change; run with --apply to write them`); process.exit(0); }
for (const [file, text] of writes) fs.writeFileSync(file, text);
console.log(`nov28-xg.base-edits: ${writes.length} file(s) written: ${writes.map(([f]) => REL(f)).join(', ')}`);
