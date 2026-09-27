#!/usr/bin/env node
/**
 * The briefs for a batch of Ingredient Atlas entries: everything an author,
 * a refuter and a corrector need, read from the files that enforce it.
 *
 *   node tools/atlas/brief.mjs [roster.json] [--only huckleberry,pawpaw]
 *
 * The roster (tools/atlas/roster.json by default) names each entry to write:
 * its term, its atlas category, the plates that drew it and a hint from the
 * operator. For each, this WRITES tools/atlas/out/<slug>.brief.json: the
 * contract as lexicon-supplement.mjs states it, the six categories, three
 * finished entries of the same category as the register, the entries that
 * share a word with the term (so a huckleberry entry agrees with the
 * blueberry entry), what the plates print for the item, every existing term
 * (collisions and cross-references), the levels standard for the placement,
 * and the rules; and PRINTS the small object to pass as the Workflow's
 * `args`.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ATLAS_CATEGORIES, LEXICON_SUPPLEMENT } from '../derive/lexicon-supplement.mjs';
import { BANNED } from '../derive/floor-deck-contract.mjs';
import { slugify } from '../slugify.mjs';
import { data, readStandard, deckExemplars } from '../levels/lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const OUT_DIR = join(HERE, 'out');
const ROOT = join(HERE, '..', '..');

const args = process.argv.slice(2);
const rosterFile = args.find((a) => !a.startsWith('--') && a.endsWith('.json')) ?? join(HERE, 'roster.json');
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;

/** @type {Array<{ t: string, c: string, plates: string[], plateItems: string[], hint: string }>} */
const roster = JSON.parse(readFileSync(rosterFile, 'utf8'));
const lexicon = data('lexicon.json');
const plates = data('plates.json').plates;
const levelsData = data('levels.json');

/* the contract, as the supplement file states it, between its opening
   comment's "THE CONTRACT" rule and the end of that comment */
const src = readFileSync(join(ROOT, 'tools', 'derive', 'lexicon-supplement.mjs'), 'utf8');
const head = src.slice(0, src.indexOf('*/'));
const contract = head
	.slice(head.indexOf('THE CONTRACT'))
	.split('\n')
	.map((l) => l.replace(/^\s*\*\s?/, ''))
	.join('\n')
	.trim();
if (!contract.includes('MECHANISM FIRST')) throw new Error('lexicon-supplement.mjs: the contract comment has moved; the brief hands it to every author');

const RULES = [
	'The term is Title Case and named once: its slug is derived from it and a reader\'s record is keyed to the slug.',
	'The category is one of the six atlases in "categories" and nothing else.',
	'The definition is 325 to 1200 characters, aim 650 to 950: MECHANISM FIRST (the enzyme, the acid, the sugar, the pectin, the toxin, the cell), then what the cook does tomorrow. No history for its own sake, no praise.',
	'choose, store and prep each 140 to 280 characters (never above 700); season as month integers 1 to 12 in the northern hemisphere, an empty array only for a genuinely year-round item; methods as lowercase verbs or short noun forms a cook would use.',
	'No em dash and no spaced en dash anywhere. A colon, a semicolon, a comma or a full stop. An unspaced en dash inside a numeric range is tolerated but a "to" is preferred.',
	'American spelling (flavor, color, savory, caramelize; never colour, flavour, savour, centre, litre, fibre, mould, yoghurt, caramelise, tenderise, pasteurise). Temperatures in Celsius with Fahrenheit in brackets where a cook needs it, "82 C (180 F)", no degree sign. Weights in grams.',
	`None of these substrings anywhere in the entry (sanitation asserts they appear in no definition): ${BANNED.map((b) => JSON.stringify(b)).join(', ')}. "thaw" also catches thawed and thawing.`,
	'Safety facts are stated as facts about the plant or fungus (a seed that carries amygdalin, a raw bean that holds linamarin, a look-alike that kills), never as a verdict that a dish is safe for anyone.',
	'Be right. Where the hint and your knowledge disagree, check (search the web) and say what is true; where you are not sure, leave it out. Cite no sources in the text.'
];

const fold = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const words = (t) => fold(t).split(/[^a-z]+/).filter((w) => w.length > 3);

mkdirSync(OUT_DIR, { recursive: true });
const out = [];
for (const r of roster) {
	const slug = slugify(r.t);
	if (only && !only.has(slug)) continue;
	const ws = words(r.t);
	const related = lexicon
		.filter((e) => ws.some((w) => fold(e.term).includes(w) || (e.category === r.c && fold(e.definition).includes(w))))
		.slice(0, 6)
		.map((e) => ({ term: e.term, category: e.category, definition: e.definition }));
	const exemplars = LEXICON_SUPPLEMENT.filter((e) => e.c === r.c).slice(0, 3);
	const onPlates = [];
	for (const p of plates) {
		if (!r.plates.includes(p.slug)) continue;
		for (const g of p.groups) for (const it of g.items) if (r.plateItems.includes(it.name)) onPlates.push({ plate: p.title, group: g.title, name: it.name, sub: it.sub, facts: it.facts });
		const corrections = p.corrections.filter((c) => r.plateItems.includes(c.on));
		for (const c of corrections) onPlates.push({ plate: p.title, correction: c });
	}
	const brief = {
		slug,
		term: r.t,
		category: r.c,
		hint: r.hint,
		contract,
		categories: ATLAS_CATEGORIES,
		rules: RULES,
		exemplars,
		related,
		onPlates,
		existingTerms: lexicon.map((e) => `${e.term} [${e.category}]`),
		placement: {
			standard: readStandard(),
			lexiconSignals: 'The Lexicon category leans: the atlases place by how often a kitchen handles the item; the everyday item leans II (the less common produce and the spice rack are Level II by the standard), a specialist or regional product III, the rarest atlas entries IV. Ties break DOWN.',
			currentCounts: Object.fromEntries(Object.entries(levelsData.counts).map(([l, c]) => [l, c.lexicon])),
			exemplars: deckExemplars(8)
		}
	};
	const briefPath = join(OUT_DIR, `${slug}.brief.json`);
	writeFileSync(briefPath, JSON.stringify(brief, null, 1) + '\n');
	out.push({ slug, term: r.t, category: r.c, briefPath });
}
if (!out.length) {
	console.error('nothing to brief: --only names no roster slug');
	process.exit(1);
}
console.log(JSON.stringify({ briefDir: OUT_DIR, categories: ATLAS_CATEGORIES, entries: out }, null, 1));
