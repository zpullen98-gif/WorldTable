#!/usr/bin/env node
/**
 * The brief for one section: everything a writer and a refuter need, as JSON,
 * read from the files that enforce it so nothing is retyped and nothing can
 * drift.
 *
 *   node tools/deck/brief.mjs <section> [--only fd_0101,fd_0102]
 *
 * It WRITES the full brief to tools/deck/out/<section>.brief.json, which the
 * agents open for themselves, and PRINTS the small object to pass as the
 * Workflow's `args`: the brief's path and the contract's numbers, because a
 * Workflow script has no filesystem and builds its schemas from them.
 *
 * The length targets are LIMITS and AIMS from the contract, baked INTO the
 * authoring prompt. The atlas's first batch was given floors and no ceiling
 * and came back at twice the house length.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { LIMITS, AIMS, BANNED, CARD_KEYS, genericWords, identifyingWords } from '../derive/floor-deck-contract.mjs';
import { DECK_SECTIONS, DECK_LEVELS, PACKET_ERRORS } from '../derive/floor-deck.mjs';
import { significantWords } from '../derive/drills.mjs';
import { PACKET_SAID } from './packet.mjs';
import { ROOT, OUT_DIR, loadSection, readLedger } from './lib.mjs';

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
		// a written card's level is kept by the merge whatever a draft says
		if (c.level !== undefined) row.level = c.level;
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

const RESPELLING = 'ah ay ee eh oh oo uh ow eye zh; one stressed syllable per word in CAPITALS; hyphens between syllables; ASCII letters and apostrophes only: gwan-CHAH-leh, bree-OHSH, zhoo';

/* Every written card carries `level` (the contract requires it), so a NEW card
   needs one from its writer. The standard is read out of README.md's "Levels"
   section, where it is written once, rather than retyped here. */
const readme = readFileSync(join(ROOT, 'tools', 'deck', 'README.md'), 'utf8');
const levelStandard = (readme.split(/^## Levels\s*$/m)[1] ?? '').split(/^## /m)[0].trim();
if (!levelStandard) throw new Error('tools/deck/README.md has no "## Levels" section: the brief hands the level standard to every writer');
const levels = {
	keys: DECK_LEVELS.map((l) => ({ level: l.level, name: l.name })),
	rule: 'Give every card that has no level yet a `level`: the integer key, never the name. A card that already has one keeps it.',
	standard: levelStandard
};
const head = { key: section.key, title: section.title, blurb: section.blurb, madeWith: section.madeWith };

/* The FULL brief goes to disk, where the agents read it for themselves: the
   roster rows with their candidates, the exemplars and the whole roster come
   to about 40 KB, which is a poor thing to push through a tool call. */
mkdirSync(OUT_DIR, { recursive: true });
const briefPath = join(OUT_DIR, `${section.key}.brief.json`).split('\\').join('/');
writeFileSync(
	briefPath,
	JSON.stringify(
		{ section: head, roster, cardKeys: CARD_KEYS.filter((k) => k !== 'packet'), levels, limits: LIMITS, aims: AIMS, banned: BANNED, genericWords: [...generic].sort(), respellingKey: RESPELLING, exemplars, everyCard },
		null,
		1
	) + String.fromCharCode(10)
);

/* What the workflow script itself needs, and nothing else: it has no
   filesystem, so the contract's numbers reach it here and everything bulky is
   a path the agents open. THIS is what is passed as the Workflow's `args`. */
process.stdout.write(
	JSON.stringify({
		briefPath,
		section: head,
		limits: LIMITS,
		aims: AIMS,
		banned: BANNED,
		respellingKey: RESPELLING,
		hasExemplars: exemplars.length > 0,
		todo: roster.filter((r) => !r.written).map((r) => ({ id: r.id, term: r.term, knownPacketError: Boolean(r.knownPacketError) })),
		roster: roster.map((r) => ({ id: r.id, term: r.term }))
	}) + String.fromCharCode(10)
);
