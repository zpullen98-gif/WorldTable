#!/usr/bin/env node
/**
 * The briefs for an expansion roster: which words the Floor Deck should
 * gain at Levels III and IV, section by section, decided by agents against
 * the levels standard and read by a person before a stub is written.
 *
 *   node tools/deck/roster-brief.mjs [--only cuts,fish]
 *
 * It WRITES tools/deck/out/roster.<section>.brief.json per section (the
 * section's head, its cards with their levels, the deck's level standard,
 * the whole roster for duplicates, the Lexicon's Level III and IV terms that
 * have no card as candidates, the packet's flag, the aims) and PRINTS the
 * small object to pass as the Workflow's `args` for roster.workflow.js.
 *
 * Why: at the first placement Level IV held exactly the 14 cards the
 * contract's floor asks for and five sections held no Level IV card at all
 * (methods, custards, language, cuts, bread). A server at a fine-dining
 * house meets words the deck never taught.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DECK_LEVELS, DECK_SECTIONS } from '../derive/floor-deck.mjs';
import { LIMITS } from '../derive/floor-deck-contract.mjs';
import { OUT_DIR, ROOT, loadSection } from './lib.mjs';

const args = process.argv.slice(2);
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;

const data = (name) => JSON.parse(readFileSync(join(ROOT, 'src', 'lib', 'data', name), 'utf8'));
const lexicon = data('lexicon.json');
const levels = data('levels.json');
const deckIndex = data('floor-deck.index.json');

const readme = readFileSync(join(ROOT, 'tools', 'deck', 'README.md'), 'utf8');
const standard = (readme.split(/^## Levels\s*$/m)[1] ?? '').split(/^## /m)[0].trim();
if (!standard) throw new Error('tools/deck/README.md has no "## Levels" section');

/* the Lexicon's own Level III and IV terms with no card: candidates, never a
   requirement, and never the finance track (that is a manager's reading) */
const lexLevel = new Map();
for (const [n, slugs] of Object.entries(levels.items.lexicon)) for (const s of slugs) lexLevel.set(s, Number(n));
const carded = new Set(Object.keys(deckIndex.byLexicon ?? {}));
const candidates = lexicon
	.filter((e) => (lexLevel.get(e.slug) ?? 0) >= 3 && !carded.has(e.slug) && e.category !== 'Restaurant Finance & Opening')
	.map((e) => ({ slug: e.slug, term: e.term, category: e.category, level: lexLevel.get(e.slug), opens: e.definition.slice(0, 160) }));

const everyCard = [];
const perSection = new Map();
for (const s of DECK_SECTIONS) {
	const cards = await loadSection(s.key);
	perSection.set(s.key, cards);
	for (const c of cards) everyCard.push({ id: c.id, term: c.term, section: s.key, level: c.level, aliases: c.aliases ?? [] });
}

const AIMS = {
	perSection: [2, 4],
	levels: [3, 4],
	rule: 'Propose only words a server at a good or fine-dining American restaurant will meet on a menu or be asked about, that the deck does not already teach under any term or alias, placed at Level III or IV by the standard. Two to four per section; a section that honestly has no more such words proposes fewer and says so. Prefer words that appear on menus over words that appear in books.'
};

mkdirSync(OUT_DIR, { recursive: true });
const out = [];
for (const s of DECK_SECTIONS) {
	if (only && !only.has(s.key)) continue;
	const cards = perSection.get(s.key);
	const brief = {
		section: { key: s.key, title: s.title, blurb: s.blurb, madeWith: s.madeWith },
		cards: cards.map((c) => ({ id: c.id, term: c.term, level: c.level, aliases: c.aliases ?? [], gist: c.gist })),
		levelCounts: Object.fromEntries(DECK_LEVELS.map((l) => [l.level, cards.filter((c) => c.level === l.level).length])),
		levels: DECK_LEVELS.map((l) => ({ level: l.level, name: l.name })),
		standard,
		aims: AIMS,
		limits: { levelMin: LIMITS.levelMin },
		candidates,
		everyCard
	};
	const briefPath = join(OUT_DIR, `roster.${s.key}.brief.json`);
	writeFileSync(briefPath, JSON.stringify(brief, null, 1) + '\n');
	out.push({ key: s.key, title: s.title, briefPath, cards: cards.length, atIII: brief.levelCounts[3], atIV: brief.levelCounts[4] });
}
console.log(JSON.stringify({ briefDir: OUT_DIR, aims: AIMS, sections: out }, null, 1));
