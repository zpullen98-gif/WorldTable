/**
 * What the primers' authoring tools share: where the briefs, the audits and
 * the procedure live, one reading of the built data, and the detail an
 * author gets for every item placed at a level (its own text out of the
 * emitted files, so a primer about a technique draws on the technique's
 * definition and standard, not on what an agent remembers of it).
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUBSECTIONS, rowName, universe } from '../derive/levels.mjs';
import { LEVELS as LEVEL_KEYS } from '../derive/floor-deck-contract.mjs';
import { AIMS, LIMITS, itemsByKey, primerKey } from '../derive/primers.mjs';
import { data, loadCtx, readStandard } from '../levels/lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, '..', '..');
export const OUT_DIR = join(HERE, 'out');
export const AUDIT_DIR = join(HERE, 'audit');
export const README = join(HERE, 'README.md');

/**
 * The numerals of the standard's own headings in tools/levels/README.md
 * ("**Level I, Commis.**"), used to cut a level's paragraph out of it and
 * nowhere else: a brief hands an author the level's name, never a numeral,
 * and the gate refuses one in a primer.
 */
export const NUMERAL = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

/** Everything the brief reads, read once. */
export function loadAll() {
	const ctx = loadCtx();
	const levels = data('levels.json');
	const deck = data('floor-deck.json');
	const uni = universe(ctx);
	return {
		ctx,
		levels,
		deck,
		uni,
		items: itemsByKey(levels, uni, deck.cards),
		standard: readStandard(),
		techniques: ctx.techniques,
		techniqueStandards: ctx.techniqueStandards,
		lexicon: ctx.lexicon,
		study: ctx.study,
		palate: ctx.palate,
		plates: ctx.plates,
		serviceTrack: ctx.serviceTrack,
		limits: LIMITS,
		aims: AIMS
	};
}

/**
 * The standard's paragraph for one level, cut out of README.md's section so
 * the brief hands each author the whole standard and the part that is theirs.
 *
 * @param {string} standard
 * @param {number} level
 */
export function levelStandard(standard, level) {
	const start = standard.indexOf(`**Level ${NUMERAL[/** @type {1|2|3|4} */ (level)]},`);
	if (start < 0) return '';
	const rest = standard.slice(start + 2);
	const end = rest.search(/\n\n\*\*/);
	return (end < 0 ? rest : rest.slice(0, end)).replace(/^\*\*|\*\*$/g, '').trim();
}

/**
 * The palate ladder's rung at each level, read out of the engine so the
 * brief cannot drift from it.
 *
 * @returns {Record<string, number>}
 */
export function palateRungs() {
	const src = readFileSync(join(ROOT, 'src', 'lib', 'levels.ts'), 'utf8');
	const m = src.match(/PALATE_RUNG[^=]*=\s*\{([^}]*)\}/);
	if (!m) throw new Error('src/lib/levels.ts has no PALATE_RUNG: the brief reads the rung from it');
	/** @type {Record<string, number>} */
	const out = {};
	for (const pair of m[1].split(',')) {
		const [k, v] = pair.split(':').map((s) => s.trim());
		if (k && v) out[k] = Number(v);
	}
	return out;
}

/**
 * The training doors each subsection opens on the level page, as words, so
 * a primer can tell the reader what to do next without inventing a door.
 */
export const DOORS = {
	dishes: [
		'Read the semester: the Path of Study, opened at the semester that teaches the first dish not yet cooked.',
		'Cook the next dish: the recipe page of the first dish not yet cooked.',
		'The library at this level: the recipe grid filtered to this level\'s difficulty.'
	],
	techniques: ['Read the techniques: the technique index at this level.', 'The next technique: the page of the first technique not yet met.'],
	lexicon: ['Read the terms: the Lexicon at this level.', 'Flashcards and Quiz: both over this level\'s terms.'],
	deck: [
		'Flip cards: the Floor Deck at this level.',
		'The written test: this level, untimed; it ends on what you missed with the right answers and no number.',
		'Say it back: recall before recognition, the one deck mode that counts as a round.',
		'The deck: the landing, with what is owed today.'
	],
	plates: ['Read the first plate.', 'The wall: all twenty plates, each with its transcription and what it gets wrong.'],
	palate: ['The repair table: the faults with their levers, in order.', 'Calibrate: the tasting ladder, each taste to this level\'s rung.'],
	safety: ['Read: the Food Safety page at this level\'s first slice.', 'The whole page.'],
	service: ['The first module.', 'The track: all 27 modules.', 'Drill: the service drill over this level\'s modules, the whole track as the field.']
};

export const LEVEL_TEST = 'The Level test at the foot of the level page: untimed, across the subsections, ending on what you missed with the right answers and no score.';

/**
 * What "met" means for each subsection: the app's one rule, as words the
 * primer may use and may not bend.
 */
export const MET = {
	dishes: 'A dish is met when it has been cooked and logged.',
	techniques: 'A technique that carries a written standard is met when a cook on one of its recipes was graded met against that standard; one without a standard is met by any cook of one of its recipes.',
	lexicon: 'A term is met when it has been recalled met or close on the flashcard ladder, or in the quiz; a miss alone is never met.',
	deck: 'A card is met when it has been graded met or close in the deck\'s modes; a miss alone is never met.',
	plates: 'The plates are read, never graded: nothing about them is recorded.',
	palate: 'A fault is met when it has been named on a plate in the repair table; a taste when its ladder is cleared to this level\'s rung.',
	safety: 'Food safety is read, never graded: nothing about it is recorded.',
	service: 'A module is met through its terms: every term of the module recalled met or close in the drill.'
};

/**
 * One item's detail for the brief: the universe row's signals plus the
 * item's own text out of the emitted files.
 *
 * @param {string} subsection
 * @param {string} slug
 * @param {ReturnType<typeof loadAll>} all
 * @returns {Record<string, unknown>}
 */
export function itemDetail(subsection, slug, all) {
	/** @param {unknown} s @param {number} n */
	const clip = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
	switch (subsection) {
		case 'dishes': {
			const row = all.uni.dishes.find((d) => d.slug === slug);
			const sem = all.study.find((/** @type {any} */ s) => s.n === row?.semester);
			return { ...row, semesterDescription: clip(sem?.description, 400) };
		}
		case 'techniques': {
			const row = all.uni.techniques.find((t) => t.slug === slug);
			const t = all.techniques.find((/** @type {any} */ x) => x.slug === slug);
			const std = all.techniqueStandards.find((/** @type {any} */ s) => s.slug === slug);
			return {
				...row,
				definition: clip(t?.definition, 1200),
				origin: clip(t?.origin, 300) || undefined,
				standardMarks: std ? std.marks.slice(0, 4).map((/** @type {any} */ m) => clip(m.text, 300)) : undefined,
				standardFault: std?.fault ? clip(std.fault, 300) : undefined
			};
		}
		case 'lexicon': {
			const row = all.uni.lexicon.find((e) => e.slug === slug);
			const e = all.lexicon.find((/** @type {any} */ x) => x.slug === slug);
			return { ...row, definition: clip(e?.definition, 900) };
		}
		case 'deck': {
			const c = all.deck.cards.find((/** @type {any} */ x) => x.id === slug);
			if (!c) return { slug };
			return { slug, term: c.term, section: c.section, level: c.level, gist: c.gist, why: c.why, note: c.note, origin: c.origin, pairs: c.pairs, notThis: c.notThis, line: c.line };
		}
		case 'plates': {
			const p = all.plates.find((/** @type {any} */ x) => x.slug === slug);
			if (!p) return { slug };
			return {
				slug,
				title: p.title,
				tagline: p.tagline,
				kind: p.kindTitle,
				regionLine: p.regionLine,
				items: p.count,
				groups: p.groups.map((/** @type {any} */ g) => g.title),
				corrections: p.corrections.length,
				getsWrong: p.corrections.slice(0, 3).map((/** @type {any} */ c) => `${c.on}: ${clip(c.should, 160)}`)
			};
		}
		case 'palate': {
			const f = all.palate.faults.find((/** @type {any} */ x) => x.slug === slug);
			if (!f) return { slug };
			return { slug, label: f.label, symptom: f.symptom, levers: f.levers.map((/** @type {any} */ l) => `${l.move}: ${clip(l.note, 200)}`) };
		}
		case 'safety': {
			const row = all.uni.safety.find((s) => s.slug === slug);
			return { ...row, text: clip(row?.text, 700) };
		}
		case 'service': {
			const row = all.uni.service.find((m) => m.slug === slug);
			const m = all.serviceTrack.modules.find((/** @type {any} */ x) => x.key === slug);
			return { ...row, outcome: clip(m?.outcome, 700), terms: m ? m.terms.map((/** @type {any} */ t) => `${t.term} (${t.category})`) : [] };
		}
		default:
			return { slug };
	}
}

/**
 * The names placed at a neighbouring level in the same subsection, for the
 * primer's orientation and its closing line.
 *
 * @param {ReturnType<typeof loadAll>} all
 * @param {string} subsection
 * @param {number} level
 */
export function namesAt(all, subsection, level) {
	if (!LEVEL_KEYS.includes(level)) return null;
	const m = all.items.get(primerKey(level, subsection));
	if (!m) return null;
	return { level, name: all.levels.levels.find((/** @type {any} */ l) => l.level === level)?.name ?? '', count: m.size, names: [...m.values()].map((r) => r.name).slice(0, 80) };
}

export { LEVEL_KEYS as LEVELS, SUBSECTIONS, rowName, primerKey };
