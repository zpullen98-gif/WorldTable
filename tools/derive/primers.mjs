/**
 * The primers: one written reader per level per subsection.
 *
 * A level page says "42 at this level" and lists the items; it does not say
 * what those forty-two techniques have in common, which to take first, or
 * what the level above will ask of the same subject. A primer does. It is
 * three to seven paragraphs written for the cook standing at that level,
 * naming the items placed there (the `cites`, each a slug of an item at
 * that level in that subsection, so the gate can prove the reader is about
 * this level and not a general essay) and ending on one line about what
 * comes next. It is read, never graded, like the plates and the safety
 * slices.
 *
 * The files are authored: `tools/derive/primers/<level>-<subsection>.json`,
 * written by the procedure in tools/primers/README.md (a brief per primer
 * with every item's own text, an author, three refuters, a corrector and a
 * critic per level) and hand-editable afterwards. This module is the gate
 * (`checkPrimer`) and the build (`buildPrimers`): shape, length, the house
 * prose rules the deck already enforces (no dash, no verdict, no British
 * spelling, no sanitation token the guide never states, temperatures in the
 * house form), no scoring or locking language (a level guides, it never
 * bars), no level by a numeral (a level is named), and every cite a real
 * item of this level and subsection that the text actually names. When
 * `PRIMERS_COMPLETE` is on, every level and subsection that holds items must
 * have its primer, and none may exist for a pair that holds nothing (Chef
 * has no plates).
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUBSECTIONS, rowName } from './levels.mjs';
import { LEVELS as LEVEL_KEYS, proseProblems } from './floor-deck-contract.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRIMERS_DIR = join(HERE, 'primers');

/** Flip on when every level and subsection with items has its primer. */
export const PRIMERS_COMPLETE = true;

/** The lengths a primer is written to. Words are counted across the paragraphs. */
export const LIMITS = {
	words: [220, 650],
	paragraphs: [3, 7],
	paragraph: [40, 900],
	lede: [30, 200],
	next: [40, 420],
	citesMin: 4
};
/** The aims, inside the limits: what an author writes to. */
export const AIMS = { words: [340, 520], paragraphs: [4, 6] };

/**
 * A level guides and never bars, and the home shows no score. A primer that
 * spoke of unlocking, passing or a percentage would teach the reader a rule
 * the app does not have.
 */
const LOCK_RE = /\b(unlock(?:s|ed|ing)?|locked|lock(?:s|ed|ing)? (?:out|off|behind)|(?:your|a|the|high|low|final|test|quiz|level) scores?|scor(?:e|ed|ing) \d|pass(?:ing)? (?:mark|grade|score)|per ?cent(?:age)?|prerequisite)\b|%/i;

/**
 * The deck's verdict rule bans the word allergen outright, because a server
 * repeats a card to a guest. A primer for cooks must be able to name the
 * guide's own allergen protocol; what stays banned is a verdict about a
 * dish: what it contains, is free from, or is safe for.
 */
const PRIMER_VERDICT_RE =
	/\b(contains?|containing|free (?:from|of)|(?:gluten|dairy|nut|egg|soy|shellfish|lactose|wheat)[- ]free|safe (?:for|to)|is safe|are safe|vegan|vegetarian|celiac|coeliac|pregnan)/i;

/**
 * A level is named, never numbered (the owner, 27 Sep 2026): the reader
 * meets Commis, Chef de Partie, Sous Chef and Chef, the brigade's own words,
 * and never "Level II". A calibration rung is a number and stays one.
 */
const NUMERAL_RE = /\bLevels? (?:I|II|III|IV)\b/;

const SAFETY_ID = { clause: 'disciplines', fact: 'entries', numeric: 'numbers', gap: 'gaps' };

/** @param {number} level @param {string} subsection */
export const primerKey = (level, subsection) => `${level}-${subsection}`;

/* A count in prose goes stale the day an item moves, and on 28 Sep 2026 eight
   primers were found saying the wrong number (the Sous Chef deck "thirty-five
   cards" when it held 78). The level page prints the count above the door, so
   a primer need not say it; when it does, the number must be true. A number
   written straight before the subsection's own noun ("Fourteen dishes", "122
   cards") is read as a count and must equal this level's, a neighbouring
   level's (the next line looks up a rung) or the whole app's. A qualified
   count is a subset and is left alone: a word between the number and the
   noun ("five Easy plates"), a definite lead ("the three entries that...",
   "Those four faults") or a qualifier after it ("30 entries on restaurant
   finance"). The Lexicon is counted only as "terms": its "entries" are
   nearly always one atlas or category. */
export const COUNT_NOUNS = {
	dishes: ['dishes'],
	techniques: ['techniques'],
	lexicon: ['terms'],
	deck: ['cards'],
	palate: ['faults'],
	safety: ['items', 'entries'],
	service: ['modules'],
	plates: ['folios']
};
const UNITS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const NUMBER = `[0-9]+|(?:${TENS.join('|')})(?:[- ](?:${UNITS.join('|')}))?|${TEENS.join('|')}|${UNITS.join('|')}`;
const SUBSET_BEFORE = new Set(['the', 'those', 'these', 'its', 'their', 'your']);
const SUBSET_AFTER = new Set(['of', 'on', 'in', 'from', 'that', 'which', 'for', 'you', 'we', 'about']);
const COUNT_RE = new RegExp(`(^|[^a-z0-9-])(${NUMBER})[ ]+([a-z]+)(?=[^a-z]|$)`, 'gi');

/** "thirty-five" -> 35, "122" -> 122
 *  @param {string} w */
export function countValue(w) {
	const t = w.toLowerCase();
	if (/^[0-9]+$/.test(t)) return Number(t);
	const [a, b] = t.split(/[- ]/);
	if (TENS.includes(a)) return 20 + TENS.indexOf(a) * 10 + (b ? UNITS.indexOf(b) + 1 : 0);
	if (TEENS.includes(a)) return 10 + TEENS.indexOf(a);
	return UNITS.indexOf(a) + 1;
}

/**
 * Every count the prose states of this subsection's own items that matches
 * none of the true counts.
 * @param {string} text
 * @param {string} subsection
 * @param {Set<number>} allowed
 */
export function staleCounts(text, subsection, allowed) {
	const nouns = COUNT_NOUNS[/** @type {keyof typeof COUNT_NOUNS} */ (subsection)] ?? [];
	const out = [];
	const all = String(text ?? '');
	for (const m of all.matchAll(COUNT_RE)) {
		if (!nouns.includes(m[3].toLowerCase())) continue;
		const lead = all.slice(0, (m.index ?? 0) + m[1].length).toLowerCase().split(/[^a-z]+/).filter(Boolean).pop();
		const tail = all.slice((m.index ?? 0) + m[0].length).toLowerCase().split(/[^a-z]+/).filter(Boolean)[0];
		if ((lead && SUBSET_BEFORE.has(lead)) || (tail && SUBSET_AFTER.has(tail))) continue;
		const n = countValue(m[2]);
		if (!allowed.has(n)) out.push(`${m[2]} ${m[3]}`);
	}
	return out;
}

/**
 * Where a cite's link goes, without the base: the same doors the level page
 * opens, decided at build so the read page needs no data joins of its own.
 *
 * @param {string} subsection
 * @param {{ slug: string, kind?: string }} row
 */
export function citeHref(subsection, row) {
	switch (subsection) {
		case 'dishes':
			return `/recipe/${row.slug}`;
		case 'techniques':
			return `/technique/${row.slug}`;
		case 'lexicon':
			return `/lexicon#${row.slug}`;
		case 'deck':
			return `/service/deck/study?card=${row.slug}`;
		case 'plates':
			return `/plates/${row.slug}`;
		case 'palate':
			return row.slug.includes('@') ? '/practise/calibrate' : '/palate';
		case 'safety':
			return `/safety#${SAFETY_ID[/** @type {keyof typeof SAFETY_ID} */ (row.kind ?? 'clause')]}`;
		case 'service':
			return `/service/${row.slug}`;
		default:
			return '/';
	}
}

/** @param {string} s */
const fold = (s) =>
	String(s)
		.toLowerCase()
		.replace(/[‘’]/g, "'")
		.replace(/[“”]/g, '"')
		.replace(/\s+/g, ' ')
		.trim();

/**
 * Does the text name the item? The whole name, or its head before a colon,
 * a comma, a bracket or an ampersand (a technique standard's label is a
 * sentence, and "Blanching & shocking" is two moves; a cook writes
 * "sweating aromatics" or "blanching"), allowing a plain plural.
 *
 * @param {string} text folded
 * @param {string} name
 */
export function namesItem(text, name) {
	const whole = fold(name);
	const head = whole.split(/[:,(&]/)[0].trim();
	/* a safety fact's label is the guide's own sentence ("Allergen protocol is
	   service-critical and legal-critical"); a cook names it by its first two
	   words, an article stripped */
	const two = whole.replace(/^(?:the|a|an) /, '').split(' ').slice(0, 2).join(' ');
	const prefix = whole.split(' ').length >= 4 && two.length >= 9 ? two : '';
	for (const n of new Set([whole, head, prefix])) {
		if (n.length < 3) continue;
		if (text.includes(n) || text.includes(`${n}s`) || text.includes(`${n}es`)) return true;
	}
	return false;
}

/** @param {string} s */
const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

/**
 * @param {string} where
 * @param {unknown} value
 * @param {[number, number]} range
 * @param {string[]} problems
 */
function checkProse(where, value, range, problems) {
	if (typeof value !== 'string') {
		problems.push(`${where}: not a string`);
		return;
	}
	if (value.length < range[0] || value.length > range[1]) {
		problems.push(`${where}: ${value.length} characters, wanted ${range[0]} to ${range[1]}`);
	}
	for (const p of proseProblems(value)) {
		if (/^verdict language "allerg/i.test(p)) continue;
		problems.push(`${where}: ${p}`);
	}
	const verdict = value.match(PRIMER_VERDICT_RE);
	if (verdict) problems.push(`${where}: verdict language "${verdict[0]}": a primer may name the allergen protocol and may never say what a dish contains, is free from or is safe for`);
	const lock = value.match(LOCK_RE);
	if (lock) problems.push(`${where}: "${lock[0]}": a level guides and never bars, and nothing here is scored`);
	const numeral = value.match(NUMERAL_RE);
	if (numeral) problems.push(`${where}: "${numeral[0]}": levels are named, never numbered (Commis, Chef de Partie, Sous Chef, Chef)`);
	if (!/[.!?]["')]?$/.test(value.trim())) problems.push(`${where}: does not end in a sentence stop`);
}

/**
 * The gate for one authored primer.
 *
 * @param {unknown} text the file's JSON, parsed
 * @param {{ key: string, items: Map<string, { slug: string, name: string, kind?: string }>, counts?: { here: number, allowed: Set<number> } }} ctx
 *   the items placed at this level in this subsection, by slug, with the name the text must use,
 *   and the counts a number in the prose may state
 * @returns {{ problems: string[], primer: any }}
 */
export function checkPrimer(text, ctx) {
	/** @type {string[]} */
	const problems = [];
	const where = `primers/${ctx.key}.json`;
	if (!text || typeof text !== 'object' || Array.isArray(text)) return { problems: [`${where}: not an object`], primer: null };
	const p = /** @type {Record<string, any>} */ (text);

	const allowed = new Set(['level', 'subsection', 'lede', 'paragraphs', 'cites', 'next']);
	for (const k of Object.keys(p)) if (!allowed.has(k)) problems.push(`${where}: unknown key "${k}"`);
	for (const k of ['level', 'subsection', 'lede', 'paragraphs', 'cites', 'next']) if (!(k in p)) problems.push(`${where}: missing "${k}"`);
	if (!LEVEL_KEYS.includes(p.level)) problems.push(`${where}: level ${JSON.stringify(p.level)} is not one of ${LEVEL_KEYS.join(', ')}`);
	if (!SUBSECTIONS.some((s) => s.key === p.subsection)) problems.push(`${where}: subsection ${JSON.stringify(p.subsection)} is not a subsection`);
	if (primerKey(p.level, p.subsection) !== ctx.key) problems.push(`${where}: the file says ${p.level}-${p.subsection}`);

	checkProse(`${where} lede`, p.lede, /** @type {[number, number]} */ (LIMITS.lede), problems);
	checkProse(`${where} next`, p.next, /** @type {[number, number]} */ (LIMITS.next), problems);

	if (!Array.isArray(p.paragraphs)) problems.push(`${where}: paragraphs is not an array`);
	else {
		if (p.paragraphs.length < LIMITS.paragraphs[0] || p.paragraphs.length > LIMITS.paragraphs[1]) {
			problems.push(`${where}: ${p.paragraphs.length} paragraphs, wanted ${LIMITS.paragraphs[0]} to ${LIMITS.paragraphs[1]}`);
		}
		p.paragraphs.forEach((para, i) => checkProse(`${where} paragraph ${i + 1}`, para, /** @type {[number, number]} */ (LIMITS.paragraph), problems));
		const n = p.paragraphs.reduce((a, s) => a + words(s), 0);
		if (n < LIMITS.words[0] || n > LIMITS.words[1]) problems.push(`${where}: ${n} words across the paragraphs, wanted ${LIMITS.words[0]} to ${LIMITS.words[1]}`);
	}

	if (ctx.counts && typeof p.subsection === 'string') {
		const prose = [p.lede, ...(Array.isArray(p.paragraphs) ? p.paragraphs : []), p.next].join(' ');
		for (const said of staleCounts(prose, p.subsection, ctx.counts.allowed)) {
			problems.push(`${where}: says "${said}", but ${p.subsection} holds ${ctx.counts.here} at this level; a count in prose must be exact, or left out (the level page prints it)`);
		}
	}

	if (!Array.isArray(p.cites) || p.cites.some((c) => typeof c !== 'string')) problems.push(`${where}: cites is not an array of slugs`);
	else {
		const body = fold([p.lede, ...(Array.isArray(p.paragraphs) ? p.paragraphs : []), p.next].join(' '));
		const want = Math.min(LIMITS.citesMin, ctx.items.size);
		if (p.cites.length < want) problems.push(`${where}: ${p.cites.length} cites, at least ${want} wanted (${ctx.items.size} items at this level)`);
		const seen = new Set();
		for (const slug of p.cites) {
			if (seen.has(slug)) problems.push(`${where}: cites "${slug}" twice`);
			seen.add(slug);
			const row = ctx.items.get(slug);
			if (!row) {
				problems.push(`${where}: cites "${slug}", which is not an item of ${p.subsection} at Level ${p.level} in this build`);
				continue;
			}
			if (!namesItem(body, row.name)) problems.push(`${where}: cites "${slug}" but never names "${row.name}" in the text`);
		}
	}

	if (problems.length) return { problems, primer: null };
	const cites = p.cites.map((/** @type {string} */ slug) => {
		const row = /** @type {{ slug: string, name: string, kind?: string }} */ (ctx.items.get(slug));
		return { slug, name: row.name, href: citeHref(p.subsection, row) };
	});
	return {
		problems,
		primer: { level: p.level, subsection: p.subsection, lede: p.lede, paragraphs: p.paragraphs, cites, next: p.next }
	};
}

/** Every authored file, parsed, with the key its name claims. */
export function readPrimers() {
	if (!existsSync(PRIMERS_DIR)) return [];
	return readdirSync(PRIMERS_DIR)
		.filter((f) => f.endsWith('.json'))
		.sort()
		.map((f) => {
			const key = f.replace(/\.json$/, '');
			try {
				return { key, text: JSON.parse(readFileSync(join(PRIMERS_DIR, f), 'utf8')), error: null };
			} catch (e) {
				return { key, text: null, error: String(/** @type {any} */ (e)?.message ?? e) };
			}
		});
}

/**
 * The items placed at each level in each subsection, with the name a primer
 * must use: the universe rows for the placed subsections, the deck index's
 * cards for the deck.
 *
 * @param {{ items: Record<string, Record<string, string[]>> }} levels the built levels
 * @param {Record<string, Array<Record<string, any>>>} universe the universe rows by subsection
 * @param {Array<{ id: string, term: string }>} deckCards
 * @returns {Map<string, Map<string, { slug: string, name: string, kind?: string }>>} key -> slug -> row
 */
export function itemsByKey(levels, universe, deckCards) {
	/** @type {Map<string, Map<string, { slug: string, name: string, kind?: string }>>} */
	const out = new Map();
	const deck = new Map(deckCards.map((c) => [c.id, { slug: c.id, name: c.term }]));
	for (const s of SUBSECTIONS) {
		const rows = s.key === 'deck' ? deck : new Map((universe[s.key] ?? []).map((r) => [r.slug, { slug: r.slug, name: rowName(r), kind: r.kind }]));
		for (const level of LEVEL_KEYS) {
			const slugs = levels.items?.[s.key]?.[String(level)] ?? [];
			/** @type {Map<string, { slug: string, name: string, kind?: string }>} */
			const m = new Map();
			for (const slug of slugs) {
				const row = rows.get(slug);
				if (row) m.set(slug, row);
			}
			out.set(primerKey(level, s.key), m);
		}
	}
	return out;
}

/**
 * Gate every authored primer and emit the file the app reads.
 *
 * @param {{
 *   levels: { items: Record<string, Record<string, string[]>> },
 *   universe: Record<string, Array<Record<string, any>>>,
 *   deckCards: Array<{ id: string, term: string }>
 * }} ctx
 */
export function buildPrimers(ctx) {
	/** @type {string[]} */
	const problems = [];
	const items = itemsByKey(ctx.levels, ctx.universe, ctx.deckCards);
	/** @type {Map<string, any>} */
	const byKey = new Map();

	for (const file of readPrimers()) {
		if (file.error) {
			problems.push(`primers/${file.key}.json: ${file.error}`);
			continue;
		}
		const its = items.get(file.key);
		if (!its) {
			problems.push(`primers/${file.key}.json: not a level and subsection of this build (files are named <level>-<subsection>.json)`);
			continue;
		}
		if (its.size === 0) {
			problems.push(`primers/${file.key}.json: nothing is placed there, so there is nothing to prime (Chef holds no plates)`);
			continue;
		}
		const [lv, sub] = [Number(file.key.split('-')[0]), file.key.slice(file.key.indexOf('-') + 1)];
		const sizeAt = (/** @type {number} */ l) => items.get(primerKey(l, sub))?.size ?? 0;
		const total = LEVEL_KEYS.reduce((n, l) => n + sizeAt(l), 0);
		const allowed = new Set([sizeAt(lv), total, ...(lv > 1 ? [sizeAt(lv - 1)] : []), ...(lv < LEVEL_KEYS.length ? [sizeAt(lv + 1)] : [])]);
		const r = checkPrimer(file.text, { key: file.key, items: its, counts: { here: its.size, allowed } });
		problems.push(...r.problems);
		if (r.primer) byKey.set(file.key, r.primer);
	}

	if (PRIMERS_COMPLETE) {
		for (const [key, its] of items) {
			if (its.size && !byKey.has(key)) problems.push(`primers/${key}.json: missing, and PRIMERS_COMPLETE is on; every level and subsection with items has a primer`);
		}
	}

	/** @type {any[]} */
	const primers = [];
	for (const level of LEVEL_KEYS) for (const s of SUBSECTIONS) {
		const p = byKey.get(primerKey(level, s.key));
		if (p) primers.push(p);
	}
	return { primers: { version: 1, primers }, problems };
}
