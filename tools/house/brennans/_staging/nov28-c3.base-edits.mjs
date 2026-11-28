#!/usr/bin/env node
/* The base edits card chunk c3 of the wine list of 28 November 2026 needs that no staged entry can carry.

   A staged chunk adds entries after the base file's and fragments beside the edition's, and a component
   key may be filed once, so the three new bottle cards (Altesino Brunello di Montalcino 2020, Cru
   Monplaisir Bordeaux Supérieur 2022 and M. Chapoutier La Bernardine Châteauneuf-du-Pape 2023) cannot
   join the existing components they belong to (the grapes, Montalcino, Margaux and Bordeaux Supérieur,
   the Southern Rhône, Châteauneuf-du-Pape, red wine oak, decanting, and the three components every floor
   bottle card reaches) from a staged file. Montalcino named only the Castello Banfi Florus, which left
   the list, so it gains the Biondi Santi 2012 as well, or the live house would drop it. The integrator
   runs this once, at the merge, before the build. It adds item names and changes five passages of prose:
   two in the Montalcino explain and its card back, which spoke of the Florus as on our list, and one closing
   sentence each on Bordeaux Supérieur and Châteauneuf-du-Pape.

   Usage: node nov28-c3.base-edits.mjs            what would change, and whether every anchor is found
          node nov28-c3.base-edits.mjs --apply    make the edits (each once; a second run changes nothing)
   Then:  node tools/house/build-brennans.mjs --staging nov28-c3 (with the other nov28 chunks)
   Exits 1 when an anchor is missing, naming it, and writes nothing in that case. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BRENNANS = path.resolve(HERE, '..');
const ROOT = path.resolve(HERE, '..', '..', '..', '..');
const REL = (f) => path.relative(ROOT, f);
if (process.argv.includes('--help')) { console.log('node nov28-c3.base-edits.mjs [--apply]  the base edits of card chunk c3; see the head of the file'); process.exit(0); }
const APPLY = process.argv.includes('--apply');

const ALT = 'Altesino Brunello di Montalcino 2020';
const MON = 'Cru Monplaisir Bordeaux Supérieur 2022';
const BER = 'M. Chapoutier ‘La Bernardine’ Châteauneuf-du-Pape 2023';
const BIO = 'Biondi Santi Tenuta Greppo Brunello di Montalcino 2012';
const GAINS = {
	'wine-grape-merlot': [MON],
	'wine-grape-cabernet-sauvignon': [MON],
	'wine-grape-cabernet-franc': [MON],
	'wine-region-bordeaux-superieur': [MON],
	'wine-grape-grenache': [BER],
	'wine-grape-syrah': [BER],
	'wine-grape-mourvedre': [BER],
	'wine-region-southern-rhone': [BER],
	'wine-region-chateauneuf': [BER],
	'wine-region-montalcino': [ALT, BIO],
	'wine-oak-reds': [ALT],
	'wine-decanting': [ALT, BER],
	'wine-presenting-bottle': [ALT, MON, BER],
	'wine-corked': [ALT, MON, BER],
	'wine-story-grand-award-cellar': [ALT, MON, BER]
};
const PROSE = [
	{ key: 'wine-region-montalcino', at: 'explain', from: 'world famous for Brunello di Montalcino, a long-lived red from Sangiovese.', to: 'known above all for Brunello di Montalcino, a long-lived red made only from Sangiovese.' },
	{ key: 'wine-region-montalcino', at: 'explain', from: "Castello Banfi, the large estate founded by an American importing family, makes a late harvest Moscadello called Florus. Our bottle is from 2011: a sweet Tuscan rarity with honey, apricot and candied orange.", to: "On our list two bottles of Brunello carry a card: Altesino 2020, classic Brunello from vineyards across the zone, and Biondi Santi's Annata 2012 from Tenuta Greppo, where Brunello began. Castello Banfi's late harvest Moscadello, Florus 2011, has left the list; its card is kept under Past bottles to be read." },
	{ key: 'wine-region-montalcino', at: 'card.back', from: "Moscadello, a sweet white from Moscato Bianco. Castello Banfi's late harvest Florus, on our list, keeps that old tradition alive.", to: "Moscadello, a sweet white from Moscato Bianco. Brunello, pure Sangiovese, came later: on our list, Altesino 2020 and Biondi Santi 2012." },
	{ key: 'wine-region-bordeaux-superieur', at: 'explain', from: 'a taste of the Médoc at a glass price.', to: "a taste of the Médoc at a glass price. On the bottle list, Cru Monplaisir 2022 is two parcels just outside Margaux, one below Château d'Issan: Merlot led, plum and cedar, the bottle step from the glass." },
	{ key: 'wine-region-chateauneuf', at: 'explain', from: 'Decant and sell with beef and lamb.', to: "Decant and sell with beef and lamb. Chapoutier's La Bernardine 2023, Grenache led and kept in concrete, is the bottle step from our Durban glass." }
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
	if (adds) said(file, `${adds} item(s) added to existing components for the three new bottle cards of chunk c3 and the Biondi Santi`, 'pending');
	for (const p of PROSE) {
		const c = list.find((x) => x.key === p.key);
		if (!c) continue;
		p.seen = true;
		const cur = getAt(c, p.at);
		if (typeof cur !== 'string') { missing.push(`${REL(file)}: ${p.key} has no ${p.at}`); continue; }
		if (cur.includes(p.to)) { said(file, `${p.key} ${p.at} already carries the edit`, 'done'); continue; }
		if (!cur.includes(p.from)) { missing.push(`${REL(file)}: ${p.key} ${p.at} does not contain: ${p.from}`); continue; }
		setAt(c, p.at, cur.split(p.from).join(p.to));
		said(file, `${p.key} ${p.at}: one sentence changed`, 'pending');
	}
	const next = JSON.stringify(j.data, null, j.indent) + '\n';
	if (next !== j.text) writes.push([file, next]);
}
for (const key of Object.keys(GAINS)) if (!gained.has(key)) missing.push(`${REL(COMPONENTS)}: no component with the key ${key}`);
for (const p of PROSE) if (!p.seen) missing.push(`${REL(COMPONENTS)}: no component with the key ${p.key}`);
for (const line of report) console.log('nov28-c3.base-edits: ' + line);
if (missing.length) { for (const m of missing) console.error('nov28-c3.base-edits: MISSING ' + m); console.error('nov28-c3.base-edits: nothing written'); process.exit(1); }
if (!writes.length) { console.log('nov28-c3.base-edits: nothing to do, every edit is in'); process.exit(0); }
if (!APPLY) { console.log(`nov28-c3.base-edits: ${writes.length} file(s) would change; run with --apply to write them`); process.exit(0); }
for (const [file, text] of writes) fs.writeFileSync(file, text);
console.log(`nov28-c3.base-edits: ${writes.length} file(s) written: ${writes.map(([f]) => REL(f)).join(', ')}`);
