#!/usr/bin/env node
/* The base edits chunk r1 of the wine list of 28 November 2026 needs that no staged entry can carry.

   A staged entry changes the cards; the components are fragments, so the prose they hold about bottles
   and bins the Binwise list of 28 November 2026 no longer bears out is changed here. That list no longer
   prints Château Pegau Cuvée Maclura, the Ken Wright Willamette Valley blend, the Banfi Florus or a
   Rubicon by the glass; it prints the Rayas 2014 at the same price as the 2011, and bin 22522 for
   Château Gloria 2017 as well as the Tempier Bandol. The integrator runs this once, at the merge, before
   the build. It changes the Rayas record (the explain, the history, a fact, a note, a question), drops a
   note and an answered question from Pegau's producer profile, rewords one Tempier question, one
   Inglenook note (and drops its answered glass pour question), the late harvest story and the Oregon Pinot Noir story and its card.

   Usage: node nov28-r1.base-edits.mjs            what would change, and whether every anchor is found
          node nov28-r1.base-edits.mjs --apply    make the edits (each once; a second run changes nothing)
   Then:  node tools/house/build-brennans.mjs --staging nov28-r1 (with the other nov28 chunks)
   Exits 1 when an anchor is missing, naming it, and writes nothing in that case. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BRENNANS = path.resolve(HERE, '..');
const ROOT = path.resolve(HERE, '..', '..', '..', '..');
const REL = (f) => path.relative(ROOT, f);
if (process.argv.includes('--help')) { console.log('node nov28-r1.base-edits.mjs [--apply]  the base edits of chunk r1; see the head of the file'); process.exit(0); }
const APPLY = process.argv.includes('--apply');

/* Each edit names the record by its component key, in components (c) or in producers (p), the path inside
   it, and either a from and a to (a passage replaced) or drop (a list entry removed). */
const EDITS = [
	{ list: 'components', key: 'cellar-rayas', at: 'explain', from: 'Ours is the 2011, at $1200 the cult bottle of our Rhône pages.', to: 'Ours is the 2011, at $1200; the list prints the Rayas 2014 at the same price.' },
	{ list: 'components', key: 'cellar-rayas', at: 'producer.history', from: 'Rayas itself appears in three vintages.', to: 'Rayas itself appears in four vintages, the 2014 at the same $1200 as ours.' },
	{ list: 'components', key: 'cellar-rayas', at: 'producer.facts.7', from: 'Our list prints Rayas 2009 at $1060, 2011 at $1200 (bin 22458) and 2012 at $1300.', to: 'Our list prints Rayas 2009 at $1060, 2011 at $1200 (bin 22458), 2012 at $1300 and 2014 at $1200 (bin 23552), and the Pignan 2014 at $850.' },
	{ list: 'components', key: 'cellar-rayas', at: 'producer.notes.3', from: 'Ring it in by bin 22458 and check the label reads Château Rayas 2011, not La Pialade or Pignan.', to: 'Ring it in by bin 22458 and check the label reads Château Rayas 2011, not La Pialade, Pignan or the Rayas 2014, which the list prints at the same $1200 (bin 23552).' },
	{ list: 'components', key: 'cellar-rayas', at: 'producer.askKitchen.1', from: 'Which of the three Rayas vintages, and the Pignan, are in the cellar tonight?', to: 'Which of the four Rayas vintages, and the Pignan 2014, are in the cellar tonight?' },
	{ list: 'producers', key: 'wine-story-pegau', at: 'producer.notes', drop: "Do not confuse the domaine's Châteauneuf with Château Pegau Cuvée Maclura, a Côtes du Rhône on the list at $60." },
	{ list: 'producers', key: 'wine-story-pegau', at: 'producer.askKitchen', drop: 'Is Château Pegau, whose Cuvée Maclura is on the list, a Féraud family estate, as the wine list says?' },
	{ list: 'producers', key: 'wine-story-tempier', at: 'producer.askKitchen.0', from: 'and what is the Bandol Natural 2016 (bin 23344)?', to: 'and what is the Bandol Natural 2016 (bin 23344)? Bin 22522 is also printed for Château Gloria 2017, so ring the Tempier by name and vintage.' },
	{ list: 'components', key: 'cellar-inglenook', at: 'producer.notes.3', from: 'The glass and the bottle share bin 18231: ring the bottle as the bottle, and name the vintage, since the 2005 and 2009 sit beside it.', to: 'Ring the bottle by bin 18231 and name the vintage, since the 2005 and 2009 sit beside it; the list of 28 November 2026 prints no Rubicon by the glass.' },
	{ list: 'components', key: 'cellar-inglenook', at: 'producer.askKitchen', drop: 'How is the open bottle of Rubicon 2010 kept between glass pours, and is the 2010 still the vintage open?' },
	{ list: 'components', key: 'wine-late-harvest', at: 'explain', from: "Ours are Trimbach's Gewurztraminer Vendanges Tardives, Ridge's Essence Zinfandel, the Grgich Hills Violetta and Banfi's Florus Moscadello. Each is made only in years the weather allows.", to: "Ours are Trimbach's Gewurztraminer Vendanges Tardives, Ridge's Essence Zinfandel and the Grgich Hills Violetta, each made only in years the weather allows. Banfi's Florus Moscadello has left the list; its card is kept under Past bottles to be read." },
	{ list: 'components', key: 'wine-story-oregon-pinot', at: 'explain', from: 'Two Willamette Valley wineries make our Oregon Pinot Noir.', to: 'Two Willamette Valley wineries anchor our Oregon Pinot Noir.' },
	{ list: 'components', key: 'wine-story-oregon-pinot', at: 'explain', from: "Ken Wright Cellars is in Carlton, and Ken Wright is known for bottling Pinot Noir vineyard by vineyard to show each site. Our bottle is his valley-wide blend, drawn from across his vineyard sources: young and bright, red cherry, raspberry and spice.", to: "Ken Wright Cellars, in Carlton, is known for bottling Pinot Noir vineyard by vineyard to show each site. Its valley-wide blend has left the list; its single vineyards stand, the McCrone and Carter half-bottles and the Shea Vineyard magnum." },
	{ list: 'components', key: 'wine-story-oregon-pinot', at: 'explain', from: 'lovely with the redfish and the duck.', to: 'lovely with the Blackened Tofu and the duck.' },
	{ list: 'components', key: 'wine-story-oregon-pinot', at: 'card.back', from: "Bergstrom's Reserve half-bottle, from near Newberg, and Ken Wright's Willamette Valley blend, from a producer known for single-vineyard wines. Both are bright and earthy.", to: "Bergstrom's Reserve half-bottle, from near Newberg, and Ken Wright Cellars' single vineyards, the McCrone and Carter half-bottles and the Shea magnum, from a producer known for single-vineyard wines." }
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
for (const line of report) console.log('nov28-r1.base-edits: ' + line);
if (missing.length) { for (const m of missing) console.error('nov28-r1.base-edits: MISSING ' + m); console.error('nov28-r1.base-edits: nothing written'); process.exit(1); }
if (!writes.length) { console.log('nov28-r1.base-edits: nothing to do, every edit is in'); process.exit(0); }
if (!APPLY) { console.log(`nov28-r1.base-edits: ${writes.length} file(s) would change; run with --apply to write them`); process.exit(0); }
for (const [file, text] of writes) fs.writeFileSync(file, text);
console.log(`nov28-r1.base-edits: ${writes.length} file(s) written: ${writes.map(([f]) => REL(f)).join(', ')}`);
