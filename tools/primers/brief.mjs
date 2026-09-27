#!/usr/bin/env node
/**
 * The briefs for the primers: one per level and subsection, everything an
 * author, a refuter and a corrector need, as JSON read from the files that
 * enforce it so nothing is retyped and nothing can drift.
 *
 *   node tools/primers/brief.mjs [--only 1-techniques,2-deck]
 *
 * It WRITES one brief per level and subsection that holds items to
 * tools/primers/out/<level>-<subsection>.brief.json (the standard and this
 * level's paragraph, the level, the subsection, the limits and aims, every
 * item placed there with its signals and its own text, the names at the
 * neighbouring levels, the doors, what "met" means here, the house rules
 * and a register sample), which the agents open for themselves; and PRINTS
 * the small object to pass as the Workflow's `args`.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { BANNED } from '../derive/floor-deck-contract.mjs';
import { LEVELS, SUBSECTIONS, DOORS, LEVEL_TEST, MET, NUMERAL, OUT_DIR, itemDetail, levelStandard, loadAll, namesAt, palateRungs, primerKey } from './lib.mjs';

const args = process.argv.slice(2);
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;

const all = loadAll();
const rungs = palateRungs();
const tastes = all.levels.tastes;

/** The house rules, as the gate enforces them (tools/derive/primers.mjs). */
const RULES = [
	'No em dash and no en dash anywhere. Ranges are "5 to 6". Use a comma, a colon or a full stop.',
	'American spelling: flavor, color, savory, caramelize. Never colour, flavour, savour, centre, litre, fibre, mould, yoghurt, caramelise, tenderise, pasteurise.',
	'Temperatures only as Celsius first with Fahrenheit in brackets and no degree sign: "82 C (180 F)". Prefer none.',
	'No verdict on what a dish contains, is free from or is safe for. None of: contains, free from, gluten-free or any X-free, allergen, allergy, safe for, vegan, vegetarian, celiac, pregnant.',
	`None of these substrings (a food-safety curriculum the guide does not teach; the app never supplies what the guide leaves out): ${BANNED.map((b) => JSON.stringify(b)).join(', ')}. "thaw" also catches thawed and thawing.`,
	'A level guides and never bars, and nothing here is scored: never unlock, locked, score, pass mark, percent, prerequisite, or the % sign. Nothing in a primer is graded.',
	'The lede, every paragraph and the next line end in a full stop, a question mark or an exclamation mark. No double spaces, no leading or trailing space.',
	'Prose only: no bullet lists, no headings, no numbering at the start of a paragraph, no markdown. Say "Level II" with the numeral, never "L2" or "level two".'
];

const primers = [];
mkdirSync(OUT_DIR, { recursive: true });

for (const level of LEVELS) {
	const info = all.levels.levels.find((/** @type {any} */ l) => l.level === level);
	for (const s of SUBSECTIONS) {
		const key = primerKey(level, s.key);
		const items = all.items.get(key);
		if (!items || items.size === 0) continue;
		if (only && !only.has(key)) continue;
		const detail = [...items.keys()].map((slug) => itemDetail(s.key, slug, all));
		const others = SUBSECTIONS.filter((x) => x.key !== s.key).map((x) => ({ key: x.key, title: x.title, count: all.levels.counts[String(level)][x.key], counted: x.counted !== false }));
		const sampleCards = all.deck.cards.filter((/** @type {any} */ c) => c.level === level).slice(0, 2);
		const brief = {
			key,
			level: { n: level, numeral: NUMERAL[/** @type {1|2|3|4} */ (level)], name: info.name, blurb: info.blurb },
			subsection: { key: s.key, title: s.title, counted: s.counted !== false, position: SUBSECTIONS.indexOf(s) + 1, of: SUBSECTIONS.length },
			standard: { thisLevel: levelStandard(all.standard, level), whole: all.standard },
			limits: all.limits,
			aims: all.aims,
			met: MET[/** @type {keyof typeof MET} */ (s.key)],
			doors: DOORS[/** @type {keyof typeof DOORS} */ (s.key)],
			levelTest: LEVEL_TEST,
			items: detail,
			neighbours: { below: namesAt(all, s.key, level - 1), above: namesAt(all, s.key, level + 1) },
			otherSubsections: others,
			palate: s.key === 'palate' ? { rung: rungs[String(level)], tastes, note: `At this level the tasting ladder asks each taste (${tastes.join(', ')}) to rung ${rungs[String(level)]}.` } : undefined,
			sanitation:
				s.key === 'safety'
					? 'The Food Safety page is built on what the guide states and, deliberately, on what it names without stating (the gaps). A primer says which is which and never fills a gap with a figure or a rule of its own: the app does not teach the curriculum the guide leaves out.'
					: undefined,
			register: {
				blurbs: all.levels.levels.map((/** @type {any} */ l) => `${l.name}: ${l.blurb}`),
				samples: sampleCards.map((/** @type {any} */ c) => c.why)
			},
			rules: RULES
		};
		const briefPath = join(OUT_DIR, `${key}.brief.json`);
		writeFileSync(briefPath, JSON.stringify(brief, null, 1) + '\n');
		primers.push({ key, level, subsection: s.key, title: s.title, count: items.size, briefPath });
	}
}

if (!primers.length) {
	console.error('nothing to brief: --only names no level and subsection that holds items');
	process.exit(1);
}
console.log(
	JSON.stringify(
		{
			briefDir: OUT_DIR,
			limits: all.limits,
			aims: all.aims,
			levels: all.levels.levels.map((/** @type {any} */ l) => ({ n: l.level, numeral: NUMERAL[/** @type {1|2|3|4} */ (l.level)], name: l.name })),
			primers
		},
		null,
		1
	)
);
