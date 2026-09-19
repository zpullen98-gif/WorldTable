#!/usr/bin/env node
/**
 * Write each card's brigade level into its section module. All or nothing.
 *
 *   node tools/deck/set-levels.mjs <levels.json>
 *
 * The input is what the level-assignment run returned:
 *   { placements: [{ id, level, reason, section }], criticChanges: [...] }
 *
 * A level is decided against the written standard in tools/deck/README.md
 * ("Levels"), per card, by agents: an assigner, a challenger arguing each
 * placement from the floor, a reconciler, then one cross-deck critic. This
 * tool decides nothing. It checks that the placements describe exactly the
 * deck on disk and writes them in:
 *
 *   - an id that is not a live WRITTEN card stops it (a stub carries no level,
 *     and a retired or unknown id is a placement for a card nobody can study)
 *   - a live written card left without a level stops it (the contract requires
 *     one, so a partial write would only fail the build later, further away)
 *   - an id placed twice, a level outside LEVELS, or a placement that names a
 *     section the card is not in stops it
 *
 * Then every module is rewritten through writeSection, the one serializer, so
 * the diff is one `level:` line under each term and nothing else; and
 * tools/deck/audit/levels.json is written beside the section audits: every
 * card's level and the reason for it, plus what the critic moved. That file is
 * committed, as the section audits are, because it is the only record of why
 * a card sits where it does.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { LEVELS } from '../derive/floor-deck-contract.mjs';
import { DECK_SECTIONS } from '../derive/floor-deck.mjs';
import { AUDIT_DIR, loadSection, readLedger, writeSection } from './lib.mjs';

/** @param {string} m @param {string[]} [list] @returns {never} */
const die = (m, list = []) => {
	console.error(`\n  ✗ ${m}`);
	for (const p of list.slice(0, 40)) console.error(`      ${p}`);
	if (list.length > 40) console.error(`      ... and ${list.length - 40} more`);
	console.error('\n  nothing was written\n');
	process.exit(1);
};

const file = process.argv[2];
if (!file) die('usage: node tools/deck/set-levels.mjs <levels.json>');

/** @type {{ placements?: Array<{ id: string, level: number, reason?: string, section?: string }>, criticChanges?: unknown[] }} */
const input = JSON.parse(readFileSync(file, 'utf8'));
if (!Array.isArray(input.placements) || !input.placements.length) die('the input is { placements: [...] } and this one has none');

const ledger = readLedger();
const retired = new Set(ledger.cards.filter((r) => r.retired).map((r) => r.id));

/** section key -> its cards as they are on disk now */
/** @type {Map<string, Array<Record<string, any>>>} */
const modules = new Map();
/** id -> { section, card } for every live written card */
/** @type {Map<string, { section: string, card: Record<string, any> }>} */
const written = new Map();
for (const s of DECK_SECTIONS) {
	const cards = await loadSection(s.key);
	modules.set(s.key, cards);
	for (const c of cards) if (c.planned !== true) written.set(c.id, { section: s.key, card: c });
}

/** @type {string[]} */
const problems = [];
/** @type {Map<string, { level: number, reason: string }>} */
const placed = new Map();
for (const p of input.placements) {
	const hit = written.get(p.id);
	if (!hit) {
		problems.push(`${p.id}: ${retired.has(p.id) ? 'retired' : 'not a live written card'}; a level is placed on a card someone can study`);
		continue;
	}
	if (placed.has(p.id)) problems.push(`${p.id} ${JSON.stringify(hit.card.term)} is placed twice`);
	if (typeof p.level !== 'number' || !LEVELS.includes(p.level)) problems.push(`${p.id} ${JSON.stringify(hit.card.term)}: level ${JSON.stringify(p.level)} is not one of ${LEVELS.join(', ')}`);
	if (p.section !== undefined && p.section !== hit.section) problems.push(`${p.id} ${JSON.stringify(hit.card.term)}: placed as a card of ${p.section}, but it lives in ${hit.section}`);
	placed.set(p.id, { level: p.level, reason: String(p.reason ?? '') });
}
for (const [id, { card }] of written) {
	if (!placed.has(id)) problems.push(`${id} ${JSON.stringify(card.term)} has no level: every written card carries one`);
}
if (problems.length) die(`${problems.length} problem(s) with the placements`, problems);

/* Written only after every check has passed: a module half-written with levels
   would fail the contract, and the next person to run the build would meet the
   failure without the reason. */
/** @type {Array<{ id: string, term: string, section: string, level: number, reason: string }>} */
const audit = [];
for (const s of DECK_SECTIONS) {
	const cards = /** @type {Array<Record<string, any>>} */ (modules.get(s.key)).map((c) => {
		if (c.planned === true) return c;
		const { level, reason } = /** @type {{ level: number, reason: string }} */ (placed.get(c.id));
		audit.push({ id: c.id, term: c.term, section: s.key, level, reason });
		return { ...c, level };
	});
	writeSection(s.key, cards);
}

mkdirSync(AUDIT_DIR, { recursive: true });
writeFileSync(
	join(AUDIT_DIR, 'levels.json'),
	JSON.stringify(
		{
			assigned: new Date().toISOString().slice(0, 10),
			standard: 'tools/deck/README.md, "Levels"',
			cards: audit,
			criticChanges: input.criticChanges ?? []
		},
		null,
		'\t'
	) + '\n'
);

const counts = LEVELS.map((l) => `${l}: ${audit.filter((a) => a.level === l).length}`).join(', ');
console.log(`  levels written into ${DECK_SECTIONS.length} section module(s): ${audit.length} card(s) (${counts})`);
console.log('  audit: tools/deck/audit/levels.json');
console.log('  now: node tools/deck/validate.mjs --all --final && npm run build:data');
