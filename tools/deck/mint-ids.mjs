#!/usr/bin/env node
/**
 * Mint Floor Deck card ids. The ONLY writer of the id ledger.
 *
 *   node tools/deck/mint-ids.mjs                      mint every `id: 'NEW'` in the section modules
 *   node tools/deck/mint-ids.mjs --accept-rename <id> the card's term changed on purpose
 *   node tools/deck/mint-ids.mjs --retire <id> "<why>" the card is gone for good; its id is never reused
 *
 * A reader's progress is filed under a card's id, in the one drill log every
 * study surface shares. So an id is minted once, from a counter that only
 * rises, and is never typed, changed or handed to another term. The build
 * reads the ledger and refuses anything it does not explain; it never writes
 * it, because build-data.mjs is pinned to exactly two writeFileSync sites and
 * minting is the one moment a person is editing the authored modules anyway.
 *
 * Minting is a TEXT replacement of the token `id: 'NEW'`, in file order, so
 * a hand-edited module keeps its comments. The module is imported first to
 * learn each new card's term, and the two are checked against each other: if
 * the file holds a different number of NEW tokens than the module holds NEW
 * cards, nothing is written.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { DECK_SECTIONS } from '../derive/floor-deck.mjs';
import { DECK_ID_RE } from '../../src/lib/floor-deck-core.mjs';
import { loadSection, sectionPath, readLedger, writeLedger } from './lib.mjs';

const args = process.argv.slice(2);
const die = (m) => {
	console.error(`\n  ✗ ${m}\n`);
	process.exit(1);
};
const today = () => new Date().toISOString().slice(0, 10);
const NEW_TOKEN = /id: 'NEW'/g;

const ledger = readLedger();
const rows = new Map(ledger.cards.map((r) => [r.id, r]));

async function liveCards() {
	const live = new Map();
	for (const s of DECK_SECTIONS) {
		for (const c of await loadSection(s.key)) {
			if (DECK_ID_RE.test(c.id ?? '')) live.set(c.id, { card: c, section: s.key });
		}
	}
	return live;
}

if (args[0] === '--accept-rename') {
	const id = args[1];
	const row = rows.get(id);
	if (!row) die(`${id} has no ledger row`);
	if (row.retired) die(`${id} is retired`);
	const hit = (await liveCards()).get(id);
	if (!hit) die(`${id} is not in any section module`);
	if (hit.card.term === row.term) die(`${id} is ${JSON.stringify(row.term)} on both sides: nothing to accept`);
	row.was = [...(row.was ?? []), row.term];
	console.log(`  ${id}: ${JSON.stringify(row.term)} -> ${JSON.stringify(hit.card.term)}`);
	row.term = hit.card.term;
	writeLedger(ledger);
	process.exit(0);
}

if (args[0] === '--retire') {
	const [, id, why] = args;
	const row = rows.get(id);
	if (!row) die(`${id} has no ledger row`);
	if (row.retired) die(`${id} is already retired`);
	if (!why || why.length < 12) die('say why, in a sentence: a retired id is permanent and someone will ask');
	if ((await liveCards()).has(id)) die(`${id} is still in a section module: delete the card first`);
	row.retired = `${today()} ${why}`;
	writeLedger(ledger);
	console.log(`  ${id} ${JSON.stringify(row.term)} retired. Its id will never be minted again.`);
	process.exit(0);
}

if (args.length) die(`unknown argument ${args[0]}`);

// ── mint ─────────────────────────────────────────────────────────────────────
let minted = 0;
const terms = new Set(ledger.cards.filter((r) => !r.retired).map((r) => r.term));
const plan = [];
for (const s of DECK_SECTIONS) {
	const cards = await loadSection(s.key);
	const fresh = cards.filter((c) => c.id === 'NEW');
	if (!fresh.length) continue;
	const file = sectionPath(s.key);
	const text = readFileSync(file, 'utf8');
	const tokens = (text.match(NEW_TOKEN) ?? []).length;
	if (tokens !== fresh.length) die(`${s.key}: the module holds ${fresh.length} NEW card(s) and the file holds ${tokens} "id: 'NEW'" token(s). Write the token exactly that way`);
	for (const c of fresh) {
		if (typeof c.term !== 'string' || !c.term) die(`${s.key}: a NEW card has no term`);
		if (terms.has(c.term)) die(`${s.key}: ${JSON.stringify(c.term)} is already a live card`);
		terms.add(c.term);
	}
	plan.push({ file, text, fresh });
}

for (const { file, text, fresh } of plan) {
	let i = 0;
	const out = text.replace(NEW_TOKEN, () => {
		const id = `fd_${String(ledger.next).padStart(4, '0')}`;
		if (ledger.next > 9999) die('the id space is four digits and it is full');
		ledger.cards.push({ id, term: fresh[i].term });
		ledger.next++;
		i++;
		minted++;
		return `id: '${id}'`;
	});
	writeFileSync(file, out);
}

if (!minted) {
	console.log("  nothing to mint: no card carries id: 'NEW'");
	process.exit(0);
}
writeLedger(ledger);
console.log(`  minted ${minted} id(s); next is fd_${String(ledger.next).padStart(4, '0')}`);
console.log('  now: npm run build:data');
