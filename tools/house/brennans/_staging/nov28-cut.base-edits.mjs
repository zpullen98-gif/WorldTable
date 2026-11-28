#!/usr/bin/env node
/* The base edits of the cut of 28 November 2026: the small faults that live in the component fragments.

   A staged entry changes the cards; the components are fragments, so their prose is changed here. Four
   records named people who are or may be living (the Rayas history, a fact and a note; the Pegau story
   and its record; the Inglenook history), and the pack names nobody living: each now tells the same fact
   as the family's. The Jadot story and record still poured the Beaune Premier Cru on the dinner tasting,
   a pour the sheet of 22 November 2026 took off; they now name the three Jadot wines the house serves.
   The Willamette Valley story named the valley's pours as they stood before the Lemelson wines joined
   and the Ken Wright blend left the list. The Diebolt-Vallois story, new with this list, gave Extra
   Brut as under six grams of sugar; the house's Champagne terms say 0 to 6 grams per liter in the
   finished wine (research/champagne-terminology-2026-10-10.json). The integrator runs this once, at
   the cut, before the build.

   Usage: node nov28-cut.base-edits.mjs            what would change, and whether every anchor is found
          node nov28-cut.base-edits.mjs --apply    make the edits (each once; a second run changes nothing)
   Then:  node tools/house/build-brennans.mjs --staging nov28-cut
   Exits 1 when an anchor is missing, naming it, and writes nothing in that case. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BRENNANS = path.resolve(HERE, '..');
const ROOT = path.resolve(HERE, '..', '..', '..', '..');
const REL = (f) => path.relative(ROOT, f);
if (process.argv.includes('--help')) { console.log('node nov28-cut.base-edits.mjs [--apply]  the base edits of the cut of 28 November 2026; see the head of the file'); process.exit(0); }
const APPLY = process.argv.includes('--apply');

/* Each edit names the record by its component key, in components (c) or in producers (p), the path inside
   it, and a from and a to (a passage replaced). */
const EDITS = [
	{ list: 'components', key: 'cellar-rayas', at: 'producer.history', from: 'Jacques Reynaud ran the estate until his death in 1997, and his nephew Emmanuel Reynaud followed him; our wine list of October 2026 names Emmanuel as the hand behind Rayas and Château des Tours.', to: "Jacques Reynaud ran the estate until his death in 1997, when it passed to a nephew from the family's Château des Tours in Vacqueyras." },
	{ list: 'components', key: 'cellar-rayas', at: 'producer.facts.6', from: 'Our wine list of October 2026 names Emmanuel Reynaud as the hand behind Rayas and Château des Tours.', to: "Jacques Reynaud ran the estate until his death in 1997, when it passed to a nephew from the family's Château des Tours." },
	{ list: 'components', key: 'cellar-rayas', at: 'producer.notes.4', from: 'Who runs Rayas now comes from our wine list of October 2026 and can change; offer it only when asked.', to: 'Name no current owner or winemaker: that can change. Say the Reynaud family.' },
	{ list: 'components', key: 'wine-story-pegau', at: 'explain', from: 'and Paul Féraud and his daughter Laurence named the domaine Domaine du Pegau in 1987.', to: 'and the family named the domaine Domaine du Pegau in 1987.' },
	{ list: 'producers', key: 'wine-story-pegau', at: 'producer.history', from: 'Paul Féraud and his daughter Laurence gave the domaine its name in 1987,', to: 'The family gave the domaine its name in 1987,' },
	{ list: 'producers', key: 'wine-story-pegau', at: 'producer.facts.1', from: 'Paul Féraud and his daughter Laurence named the domaine Domaine du Pegau in 1987.', to: 'The family named the domaine Domaine du Pegau in 1987.' },
	{ list: 'producers', key: 'wine-story-pegau', at: 'producer.notes.3', from: 'Paul and Laurence Féraud are named as the people who named the domaine in 1987; who runs it now is not stated, as that can change.', to: 'Who runs the domaine now is not stated, as that can change: say the Féraud family.' },
	{ list: 'components', key: 'cellar-inglenook', at: 'producer.history', from: 'Francis Ford Coppola reassembled the Niebaum property over the years', to: 'The family reassembled the Niebaum property over the years' },
	{ list: 'components', key: 'wine-story-jadot', at: 'explain', from: 'Three of our wines carry the Bacchus head: the Beaune Premier Cru on the dinner tasting with the Redfish Véronique, and half-bottles of village Meursault and Beaujolais-Villages.', to: 'Three of our wines carry the Bacchus head: Les Pucelles 2008, a premier cru Puligny-Montrachet poured by Coravin, and half-bottles of village Meursault and Beaujolais-Villages.' },
	{ list: 'components', key: 'wine-story-jadot', at: 'card.back', from: 'its Beaune Premier Cru pours on our dinner tasting.', to: 'its Les Pucelles 2008 is our white Burgundy by Coravin.' },
	{ list: 'producers', key: 'wine-story-jadot', at: 'producer.history', from: 'We pour three: the Beaune Premier Cru on the dinner tasting, with the Redfish Véronique, and half-bottles of Beaujolais-Villages and village Meursault.', to: 'We pour three: Les Pucelles 2008, a premier cru Puligny-Montrachet, by Coravin, and half-bottles of Beaujolais-Villages and village Meursault. The Beaune Premier Cru left the dinner tasting in November 2026.' },
	{ list: 'producers', key: 'wine-story-jadot', at: 'producer.notes.0', from: 'Say loo-EE zhah-DOH, and Beaune as bohn. The Beaune Premier Cru is the dinner tasting red, with the redfish; it has no glass price.', to: 'Say loo-EE zhah-DOH, and Beaune as bohn. Les Pucelles is poo-SELL.' },
	{ list: 'components', key: 'wine-region-willamette', at: 'explain', from: "We pour Argyle's sparkling wine by the glass, and Bergstrom and Ken Wright Pinot Noir.", to: "We pour Argyle's sparkling wine and Lemelson's Pinot Gris by the glass, and the bottle list carries Pinot Noir from Lemelson, Bergstrom and Ken Wright." },
	{ list: 'components', key: 'wine-region-willamette', at: 'card.back', from: 'Our Argyle sparkling, Bergstrom and Ken Wright Pinot Noir come from there.', to: 'Our Argyle sparkling, our Lemelson Pinot Gris and Pinot Noir from Lemelson, Bergstrom and Ken Wright come from there.' },
	{ list: 'components', key: 'wine-story-diebolt-vallois', at: 'explain', from: 'is Extra Brut: under six grams of sugar a liter, so it is taut and very dry,', to: 'is Extra Brut, 0 to 6 grams of sugar per liter in the finished wine: it is taut and very dry,' },
	{ list: 'components', key: 'wine-story-diebolt-vallois', at: 'card.back', from: 'It is Extra Brut, under six grams of sugar a liter.', to: 'It is Extra Brut: 0 to 6 grams of sugar per liter in the finished wine.' }
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
		/* The passage is looked for first: a new passage shorter than the old one may open it, and must not read as done. */
		if (!cur.includes(e.from)) {
			if (cur.includes(e.to)) { said(file, `${e.key} ${e.at} already carries the edit`, 'done'); continue; }
			missing.push(`${REL(file)}: ${e.key} ${e.at} does not contain: ${e.from}`);
			continue;
		}
		setAt(rec, e.at, cur.split(e.from).join(e.to));
		said(file, `${e.key} ${e.at}: one passage changed`, 'pending');
	}
	const next = JSON.stringify(j.data, null, j.indent) + '\n';
	if (next !== j.text) writes.push([file, next]);
}
for (const e of EDITS) if (!e.seen) missing.push(`${REL(COMPONENTS)}: no ${e.list} record with the key ${e.key}`);
for (const line of report) console.log('nov28-cut.base-edits: ' + line);
if (missing.length) { for (const m of missing) console.error('nov28-cut.base-edits: MISSING ' + m); console.error('nov28-cut.base-edits: nothing written'); process.exit(1); }
if (!writes.length) { console.log('nov28-cut.base-edits: nothing to do, every edit is in'); process.exit(0); }
if (!APPLY) { console.log(`nov28-cut.base-edits: ${writes.length} file(s) would change; run with --apply to write them`); process.exit(0); }
for (const [file, text] of writes) fs.writeFileSync(file, text);
console.log(`nov28-cut.base-edits: ${writes.length} file(s) written: ${writes.map(([f]) => REL(f)).join(', ')}`);
