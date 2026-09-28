#!/usr/bin/env node
/**
 * The briefs for the primers: one per level and subsection, everything an
 * author, a refuter and a corrector need, as JSON read from the files that
 * enforce it so nothing is retyped and nothing can drift.
 *
 *   node tools/primers/brief.mjs [--only 1-techniques,2-deck] [--with-level]
 *
 * --with-level also briefs every OTHER primer at the levels --only names and
 * hands each one to the run as "existing", with the path of its authored file: it is not
 * rewritten, but that level's critic reads it beside the new ones, so a
 * re-run of two primers still gets the whole level read together.
 *
 * It WRITES one brief per level and subsection that holds items to
 * tools/primers/out/<level>-<subsection>.brief.json (the standard and this
 * level's paragraph, the level, the subsection, the limits and aims, every
 * item placed there with its signals and its own text, the names at the
 * neighbouring levels, the doors, what "met" means here, the house rules
 * and a register sample), which the agents open for themselves; and PRINTS
 * the small object to pass as the Workflow's `args`.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { BANNED } from '../derive/floor-deck-contract.mjs';
import { PRIMERS_DIR } from '../derive/primers.mjs';
import { LEVELS, SUBSECTIONS, DOORS, LEVEL_TEST, MET, OUT_DIR, itemDetail, levelStandard, loadAll, namesAt, palateRungs, primerKey } from './lib.mjs';

const args = process.argv.slice(2);
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
const withLevel = args.includes('--with-level');
if (withLevel && !only) {
	console.error('--with-level needs --only: it adds the rest of the levels --only names');
	process.exit(1);
}
const onlyLevels = new Set([...(only ?? [])].map((k) => Number(k.split('-')[0])));

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
	'Prose only: no bullet lists, no headings, no numbering at the start of a paragraph, no markdown. Name a level by its name (Commis, Chef de Partie, Sous Chef, Chef), never a numeral: never "Level II", "L2" or "level two".',
	'Do not state how many items this level or the next holds ("Fourteen dishes", "122 cards"): the level page prints the count above the door, and a count in prose goes stale the day an item moves. The gate refuses a count of this subsection’s items that is not exact. A subset may be counted where it helps ("the two pastry plates").'
];

const primers = [];
mkdirSync(OUT_DIR, { recursive: true });

for (const level of LEVELS) {
	const info = all.levels.levels.find((/** @type {any} */ l) => l.level === level);
	for (const s of SUBSECTIONS) {
		const key = primerKey(level, s.key);
		const items = all.items.get(key);
		if (!items || items.size === 0) continue;
		const existing = only && !only.has(key) && withLevel && onlyLevels.has(level) && existsSync(join(PRIMERS_DIR, `${key}.json`))
			? join(PRIMERS_DIR, `${key}.json`).split(String.fromCharCode(92)).join('/')
			: null;
		if (only && !only.has(key) && !existing) continue;
		const detail = [...items.keys()].map((slug) => itemDetail(s.key, slug, all));
		const others = SUBSECTIONS.filter((x) => x.key !== s.key).map((x) => ({ key: x.key, title: x.title, count: all.levels.counts[String(level)][x.key], counted: x.counted !== false }));
		const sampleCards = all.deck.cards.filter((/** @type {any} */ c) => c.level === level).slice(0, 2);
		const brief = {
			key,
			level: { n: level, name: info.name, blurb: info.blurb },
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
		primers.push({ key, level, subsection: s.key, title: s.title, count: items.size, briefPath, ...(existing ? { existing: true, existingPath: existing } : {}) });
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
			levels: all.levels.levels.map((/** @type {any} */ l) => ({ n: l.level, name: l.name })),
			primers
		},
		null,
		1
	)
);
