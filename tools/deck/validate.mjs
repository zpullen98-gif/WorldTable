#!/usr/bin/env node
/**
 * Validate Floor Deck cards against the SAME contract the build enforces.
 *
 *   node tools/deck/validate.mjs --all [--final]
 *   node tools/deck/validate.mjs --draft tools/deck/out/cuts.json --section cuts
 *
 * It imports checkDeck from tools/derive/floor-deck-contract.mjs and adds no
 * rule of its own, so a draft that passes here cannot fail the build on a rule
 * this did not know. (src/lib/floor-deck-contract.test.ts holds both files to
 * that import.) What the build adds later is only what needs the emitted
 * shape: the prompts, the option-length tell and the bytes, which
 * tools/deck/measure.mjs runs.
 *
 * A draft is { cards: [...] }. Its cards carry real ids from the roster and
 * may name other cards by term (confusedWithTerms, seeAlsoTerms).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkDeck, recipeProblems } from '../derive/floor-deck-contract.mjs';
import { DECK_SECTIONS, PACKET_TERMS, PACKET_ERRORS } from '../derive/floor-deck.mjs';
import { ROOT, loadSection, readLedger, resolveDraft, overlay } from './lib.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const die = (m) => {
	console.error(`\n  ✗ ${m}\n`);
	process.exit(1);
};

const draftFile = value('--draft');
const sectionKey = value('--section');
if (!flag('--all') && !draftFile) die('usage: --all [--final]  |  --draft <file> --section <key>');
if (draftFile && !sectionKey) die('--draft needs --section');
if (sectionKey && !DECK_SECTIONS.some((s) => s.key === sectionKey)) die(`no section "${sectionKey}"`);

const ledger = readLedger();
const lexicon = JSON.parse(readFileSync(join(ROOT, 'src', 'lib', 'data', 'lexicon.json'), 'utf8'));
const lexiconSlugs = new Set(lexicon.map((e) => e.slug));
/* The recipe links too, through the contract's own rule: the build was the
   only place it ran, and two merged sections failed build:data on it. */
const recipeName = new Map(
	JSON.parse(readFileSync(join(ROOT, 'src', 'lib', 'data', 'recipes.index.json'), 'utf8')).map((r) => [r.slug, r.name])
);

/** the sections as they are on disk now, not as this process first imported them */
const sections = [];
for (const s of DECK_SECTIONS) sections.push({ ...s, cards: await loadSection(s.key) });

const problems = [];
if (draftFile) {
	const draft = JSON.parse(readFileSync(draftFile, 'utf8'));
	if (!Array.isArray(draft.cards)) die('a draft is { cards: [...] }');
	const resolved = resolveDraft(draft.cards, ledger);
	problems.push(...resolved.unresolved);
	const target = sections.find((s) => s.key === sectionKey);
	const laid = overlay(target.cards, resolved.cards);
	problems.push(...laid.problems);
	target.cards = laid.cards;
}

problems.push(
	...checkDeck(sections, ledger, {
		lexiconSlugs,
		complete: flag('--final'),
		packetTerms: PACKET_TERMS,
		packetErrors: PACKET_ERRORS
	})
);

for (const s of sections) for (const c of s.cards) if (c.planned !== true) problems.push(...recipeProblems(c, recipeName));

if (problems.length) {
	console.error(`\n  ${problems.length} problem(s)`);
	for (const p of problems) console.error(`    ✗ ${p}`);
	console.error('');
	process.exit(1);
}
const written = sections.flatMap((s) => s.cards).filter((c) => c.planned !== true).length;
console.log(`  the contract holds: ${written} written of ${ledger.cards.filter((r) => !r.retired).length}${draftFile ? ` (with ${draftFile} laid over ${sectionKey})` : ''}`);
