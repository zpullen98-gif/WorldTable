#!/usr/bin/env node
/**
 * The brief for one section: everything a writer and a refuter need, as JSON,
 * read from the files that enforce it so nothing is retyped and nothing can
 * drift. A Workflow script has no filesystem, so this is how the contract
 * reaches it: pass the output as the workflow's `args`.
 *
 *   node tools/deck/brief.mjs <section> [--only fd_0101,fd_0102] > tools/deck/out/<section>.brief.json
 *
 * The length targets are LIMITS and AIMS from the contract, baked INTO the
 * authoring prompt. The atlas's first batch was given floors and no ceiling
 * and came back at twice the house length.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LIMITS, AIMS, BANNED, CARD_KEYS, genericWords, identifyingWords } from '../derive/floor-deck-contract.mjs';
import { DECK_SECTIONS, PACKET_ERRORS } from '../derive/floor-deck.mjs';
import { significantWords } from '../derive/drills.mjs';
import { PACKET_SAID } from './packet.mjs';
import { ROOT, loadSection, readLedger } from './lib.mjs';

const args = process.argv.slice(2);
const key = args.find((a) => !a.startsWith('--'));
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
const section = DECK_SECTIONS.find((s) => s.key === key);
if (!section) {
	console.error(`usage: node tools/deck/brief.mjs <section>   (one of ${DECK_SECTIONS.map((s) => s.key).join(', ')})`);
	process.exit(1);
}

const data = (name) => JSON.parse(readFileSync(join(ROOT, 'src', 'lib', 'data', name), 'utf8'));
const lexicon = data('lexicon.json');
const recipes = data('recipes.index.json');
const ledger = readLedger();
const generic = genericWords(ledger.cards.filter((r) => !r.retired).map((r) => r.term));

/* Candidate Lexicon entries for a card: an entry whose TERM shares a word with
   the card's, best first, then entries that only mention it. The writer picks
   at most one, and only when that entry really is the long form of the card. */
function lexiconCandidates(term) {
	const words = significantWords(term, 3);
	if (!words.length) return [];
	const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
	const scored = [];
	for (const e of lexicon) {
		const inTerm = words.filter((w) => new RegExp(`\\b${w}`).test(fold(e.term))).length;
		const inDef = words.filter((w) => new RegExp(`\\b${w}`).test(fold(e.definition))).length;
		const score = inTerm * 10 + (inDef === words.length ? 2 : 0);
		if (score >= 10 || (score > 0 && words.length === 1 && inDef)) scored.push({ score, e });
	}
	return scored
		.sort((a, b) => b.score - a.score)
		.slice(0, 3)
		.map(({ e }) => ({ slug: e.slug, term: e.term, category: e.category, opens: e.definition.slice(0, 200) }));
}

function recipeCandidates(term) {
	const words = significantWords(term, 3);
	if (!words.length) return [];
	const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
	return recipes
		.filter((r) => words.every((w) => new RegExp(`\\b${w}`).test(fold(r.name))))
		.slice(0, 4)
		.map((r) => ({ slug: r.slug, name: r.name }));
}

const cards = await loadSection(section.key);
const roster = cards
	.filter((c) => !only || only.has(c.id))
	.map((c) => {
		const row = { id: c.id, term: c.term, written: c.planned !== true };
		if (c.packet) row.fromThePacket = true;
		if (PACKET_SAID[c.term]) row.thePacketSaid = PACKET_SAID[c.term];
		if (PACKET_ERRORS[c.id]) row.knownPacketError = `a trap on this card MUST match ${PACKET_ERRORS[c.id]}: it is the wrong answer the packet's own hire gave`;
		row.mayNotAppearInGistOrTraps = identifyingWords({ term: c.term }, generic);
		row.lexiconCandidates = lexiconCandidates(c.term);
		row.recipeCandidates = recipeCandidates(c.term);
		return row;
	});

/* up to three finished cards as the register to match; the pilot section
   first, since it was the one read most closely */
const exemplars = [];
for (const s of [DECK_SECTIONS.find((x) => x.key === 'cuts'), ...DECK_SECTIONS.filter((x) => x.key !== 'cuts')]) {
	if (exemplars.length >= 3 || s.key === section.key) continue;
	for (const c of await loadSection(s.key)) {
		if (c.planned === true || exemplars.length >= 3) continue;
		exemplars.push(c);
	}
}

const everyCard = [];
for (const s of DECK_SECTIONS) for (const c of await loadSection(s.key)) everyCard.push({ id: c.id, term: c.term, section: s.key });

process.stdout.write(
	JSON.stringify(
		{
			section: { key: section.key, title: section.title, blurb: section.blurb, madeWith: section.madeWith },
			roster,
			cardKeys: CARD_KEYS.filter((k) => k !== 'packet'),
			limits: LIMITS,
			aims: AIMS,
			banned: BANNED,
			genericWords: [...generic].sort(),
			respellingKey: 'ah ay ee eh oh oo uh ow eye zh; one stressed syllable per word in CAPITALS; hyphens between syllables; ASCII letters and apostrophes only: gwan-CHAH-leh, bree-OHSH, zhoo',
			exemplars,
			everyCard
		},
		null,
		1
	) + '\n'
);
