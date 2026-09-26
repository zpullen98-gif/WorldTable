/**
 * What the levels' authoring tools share: where the emitted data, the briefs,
 * the audits and the standard live, and ONE reading of the universe (the
 * build's own `universe()` over the emitted files), so brief.mjs and
 * set-levels.mjs place against exactly the items the build gates.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { universe } from '../derive/levels.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, '..', '..');
export const DATA = join(ROOT, 'src', 'lib', 'data');
export const OUT_DIR = join(HERE, 'out');
export const AUDIT_DIR = join(HERE, 'audit');
export const README = join(HERE, 'README.md');
export const DECK_AUDIT = join(ROOT, 'tools', 'deck', 'audit', 'levels.json');

/** @param {string} name */
export const data = (name) => {
	const file = join(DATA, name);
	if (!existsSync(file)) throw new Error(`${file} is missing: run npm run build:data first`);
	return JSON.parse(readFileSync(file, 'utf8'));
};

/** The built objects, read back from the emitted files. */
export function loadCtx() {
	return {
		study: data('study.json'),
		techniques: data('techniques.json'),
		lexicon: data('lexicon.json'),
		serviceTrack: data('service-track.json'),
		palate: data('palate.json'),
		sanitation: data('sanitation.json'),
		deckIndex: data('floor-deck.index.json'),
		recipes: data('recipes.index.json'),
		techniqueStandards: data('technique-standards.json')
	};
}

export function loadUniverse() {
	return universe(loadCtx());
}

/**
 * The standard, read out of README.md's "## The standard" section, where it
 * is written once, rather than retyped into a prompt.
 */
export function readStandard() {
	const text = readFileSync(README, 'utf8');
	const section = (text.split(/^## The standard\s*$/m)[1] ?? '').split(/^## /m)[0].trim();
	if (!section) throw new Error('tools/levels/README.md has no "## The standard" section: the brief hands it to every agent');
	return section;
}

/**
 * The deck's placements are the calibration set: the first N cards at each
 * level, with the reason each was placed there, from the deck's own audit.
 *
 * @param {number} perLevel
 * @returns {Record<string, Array<{ term: string, section: string, reason: string }>>}
 */
export function deckExemplars(perLevel = 20) {
	const audit = JSON.parse(readFileSync(DECK_AUDIT, 'utf8'));
	/** @type {Record<string, Array<{ term: string, section: string, reason: string }>>} */
	const out = { 1: [], 2: [], 3: [], 4: [] };
	for (const c of audit.cards) {
		const list = out[String(c.level)];
		if (list && list.length < perLevel) list.push({ term: c.term, section: c.section, reason: c.reason });
	}
	return out;
}
