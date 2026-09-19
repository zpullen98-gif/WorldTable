/**
 * The Floor Deck's contract: ONE statement of what a card may be.
 *
 * Imported by the build gate (tools/build-data.mjs through floor-deck.mjs) and
 * by the authoring pipeline's validator (tools/deck/validate.mjs), so a draft
 * that passes the validator cannot fail the build on a rule the validator did
 * not know, and the length targets in the authoring brief are these numbers,
 * read from here, never retyped.
 *
 * ## Why every limit has a ceiling as well as a floor
 *
 * The Ingredient Atlas shipped its first batch with floors only. It came in at
 * a 1,516 character median against a house median of 757 and needed a whole
 * condensing pass. Writers land near the ceiling they are given, so here every
 * field has one, the card has one, and the SECTION has one on its mean, because
 * per-field ceilings alone let every field sit at its maximum at once.
 *
 * And then it happened again anyway. The pilot section (Meat Cuts, 22 cards)
 * was given a mean ceiling of 800 and came back at 771, with `why` averaging
 * 300 against an aim of 220 to 290 and a note on 18 cards of 22. At that rate
 * 300 cards pass the byte ceiling the precache cap was raised for. So the
 * numbers below were tightened the same day, while it cost one section to
 * condense and not fifteen: why 340 -> 300, the mean 800 -> 720. The gist and
 * the trap came down together to 80, because the pilot's keys averaged 78
 * characters against 72 for its traps and a reader who always picked the
 * longest option scored 33 per cent.
 *
 * ## Why a verdict cannot be expressed
 *
 * This app refuses allergen verdicts structurally (service-track.mjs
 * assertNoVerdict), and the 5 September 2026 review's blocker was an allergen
 * screen that cleared soy over "shoyu". A training deck is where a verdict
 * would do the most harm, because a server repeats it at a table. So:
 *
 *   - `madeWith` is a list of ingredient NOUNS and nothing else, each matched
 *     against a pattern and a denylist. The sentence around it is never
 *     authored: it is emitted once, as `frame`, and the card component
 *     composes "Classically made with ... Recipes vary. Confirm with the
 *     kitchen." So no card can say "contains", "free from" or "safe for".
 *   - unknown keys are rejected, and a second list refuses the verdict-shaped
 *     keys by name, so admitting one takes two deliberate edits.
 *   - VERDICT_RE runs over every prose string, traps included: a wrong option
 *     about celiac safety is still a sentence somebody half remembers.
 */

import { GAPS } from './sanitation.mjs';
import { significantWords, redact } from './drills.mjs';
import { DECK_ID_RE, foldText, nameInText } from '../../src/lib/floor-deck-core.mjs';

/**
 * An authored card is untrusted input until this file has read it, so it is
 * typed loosely on purpose: the checks below are what give it a shape.
 *
 * @typedef {{ id: string, term: string, [key: string]: any }} AuthoredCard
 * @typedef {{ key: string, title: string, blurb: string, madeWith: 'required'|'optional', cards: AuthoredCard[] }} AuthoredSection
 * @typedef {{ next: number, cards: Array<{ id: string, term: string, was?: string[], retired?: string }> }} Ledger
 * @typedef {{ level: number, name: string, blurb: string }} AuthoredLevel
 */

/**
 * The four brigade levels, by their frozen numeric keys: 1 Commis, 2 Chef de
 * Partie, 3 Sous Chef, 4 Chef. A card carries the NUMBER, and so do URLs
 * (`?level=2`); the names live in one constant in floor-deck.mjs and reach the
 * app through the emitted data. A name can be reworded in one place without
 * touching a card, a link someone saved, or a reader's progress (which is
 * keyed on the card id and never on its level at all).
 */
export const LEVELS = [1, 2, 3, 4];

/** [min, max] in characters unless the name says otherwise. */
export const LIMITS = {
	term: [2, 34],
	say: [2, 40],
	alias: [2, 30],
	aliasesMax: 4,
	gist: [35, 80],
	guest: [60, 190],
	why: [160, 300],
	note: [40, 170],
	origin: [25, 110],
	pairs: [25, 110],
	notThis: [40, 150],
	line: [20, 80],
	madeWithItem: [2, 32],
	madeWithMax: 7,
	madeWithJoined: 140,
	trapSays: [35, 80],
	trapWhy: [40, 120],
	trapsMax: 3,
	seeAlsoMax: 3,
	confusedWithMax: 3,
	/** gist + guest + why + note + origin + pairs + notThis + line */
	cardTotal: [400, 900],
	/** the mean of cardTotal across a section's authored cards */
	sectionMean: 720,
	/** a section that emits any card emits at least this many, so multiple
	 *  choice can always field three kin */
	sectionMin: 6,
	blurb: [60, 160],
	/** a level's display name: "Chef" is the shortest the brigade offers */
	levelName: [4, 24],
	/** a complete deck holds at least this many written cards at every level,
	 *  so a written test of a whole level is always full: TEST_MC + MATCH_SIZE
	 *  in src/lib/floor-deck.ts, pinned equal by a test */
	levelMin: 14
};

/** What the writers aim at, inside the limits. The authoring brief prints these. */
export const AIMS = {
	gist: [50, 68],
	guest: [100, 150],
	why: [200, 260],
	origin: [40, 80],
	pairs: [40, 80],
	notThis: [60, 100]
};

/* `level` sits right after `term`, so serializeCard (tools/deck/lib.mjs) writes
   it under the term, where a reviewer reads the two together. */
export const CARD_KEYS = [
	'id', 'term', 'level', 'say', 'aliases', 'packet',
	'gist', 'guest', 'why',
	'madeWith', 'note',
	'origin', 'pairs', 'notThis',
	'lexiconSlug', 'recipe', 'seeAlso', 'confusedWith',
	'line', 'traps'
];

/** A planned card: minted, named, not yet written. Never emitted. */
export const STUB_KEYS = ['id', 'term', 'packet', 'planned'];

/** Every token sanitation asserts is absent from the Lexicon, imported rather
 *  than restated so the two lists cannot drift. Substring tests: "thawed" fails. */
export const BANNED = [...new Set(GAPS.flatMap((g) => g.absent ?? []))];

export const VERDICT_RE =
	/\b(contains?|containing|free (?:from|of)|(?:gluten|dairy|nut|egg|soy|shellfish|lactose|wheat)[- ]free|allergen|allerg(?:y|ic|ies)|safe (?:for|to)|is safe|are safe|vegan|vegetarian|celiac|coeliac|pregnan)/i;

/** Keys that would carry a verdict. Refused by name in anything emitted. */
export const VERDICT_KEYS = new Set([
	'allergens', 'allergen', 'contains', 'clear', 'safe', 'screened', 'free',
	'freeFrom', 'dietary', 'diet', 'vegan', 'vegetarian', 'glutenFree',
	'suitable', 'recipes'
]);

const MADE_WITH_ITEM = /^(often |sometimes |traditionally )?[a-z][a-z' -]{1,30}$/;
const MADE_WITH_DENY = [
	'contain', 'free', 'safe', 'without', 'vegan', 'vegetarian', 'allerg',
	'suitable', 'friendly'
];

const SPELLING = [
	'colour', 'flavour', 'savour', 'centre', 'litre', 'fibre', 'mould',
	'yoghurt', 'caramelis', 'tenderis', 'pasteuris'
];

/** Fields that read as sentences and end in a stop. */
const SENTENCES = ['guest', 'why', 'note', 'notThis'];
/** Fields that read as labels or options and do not. */
const FRAGMENTS = ['gist', 'origin', 'pairs', 'line'];
const PROSE = [...SENTENCES, ...FRAGMENTS];

/** @param {unknown} s */
const len = (s) => [...String(s)].length;
/** @param {number} n @param {number[]} range */
const within = (n, range) => n >= range[0] && n <= range[1];

/**
 * The house form, which the authored corpus already uses and which carries no
 * degree sign: "82 C (180 F)" or "71 to 82 C (160 to 180 F)". The arithmetic
 * is checked, because a transposed digit in a temperature is the one typo in
 * this deck that can hurt somebody.
 */
const TEMP_OK = /(\d+)(?: to (\d+))? C \((\d+)(?: to (\d+))? F\)/g;

/** @param {string} text @returns {string[]} */
export function temperatureProblems(text) {
	/** @type {string[]} */
	const problems = [];
	const rest = String(text).replace(TEMP_OK, (m, c1, c2, f1, f2) => {
		if ((c2 === undefined) !== (f2 === undefined)) {
			problems.push(`"${m}": a range on one side and not the other`);
			return ' ';
		}
		for (const [c, f] of [[c1, f1], [c2, f2]]) {
			if (c === undefined) continue;
			const want = (Number(c) * 9) / 5 + 32;
			if (Math.abs(want - Number(f)) > 3) {
				problems.push(`"${m}": ${c} C is ${Math.round(want)} F, not ${f} F`);
			}
		}
		return ' ';
	});
	if (/°/.test(rest)) problems.push('a degree sign: write "82 C (180 F)"');
	if (/\b\d+\s?[CF]\b/.test(rest)) {
		problems.push('a bare temperature: write Celsius first with Fahrenheit in brackets, "82 C (180 F)"');
	}
	return problems;
}

/**
 * The rules every prose string obeys, whichever field it sits in.
 *
 * @param {unknown} text
 * @returns {string[]}
 */
export function proseProblems(text) {
	const s = String(text);
	/** @type {string[]} */
	const problems = [];
	if (/[–—]/.test(s)) problems.push('a dash (U+2013 or U+2014): ranges are "5 to 6", clauses take a comma or a colon');
	if (/\s{2,}|^\s|\s$/.test(s)) problems.push('stray whitespace');
	const low = s.toLowerCase();
	for (const b of BANNED) if (low.includes(b)) problems.push(`the banned token "${b}" (sanitation GAPS; a substring test)`);
	const verdict = s.match(VERDICT_RE);
	if (verdict) {
		problems.push(
			`verdict language "${verdict[0]}": a card may say what a thing is classically made with and may never say what it contains, is free from or is safe for. Try "is made with" or "holds"`
		);
	}
	for (const w of SPELLING) if (low.includes(w)) problems.push(`British spelling "${w}"`);
	problems.push(...temperatureProblems(s));
	return problems;
}

/**
 * The respelling: how an American dining room says it, in ASCII. Not IPA and
 * not the native pronunciation. One stressed syllable per word, in capitals:
 * gwan-CHAH-leh, bree-OHSH, zhoo.
 *
 * @param {unknown} say
 * @returns {string[]}
 */
export function sayProblems(say) {
	/** @type {string[]} */
	const problems = [];
	const words = String(say).split(' ');
	let syllables = 0;
	let stressed = 0;
	for (const w of words) {
		if (!/^[A-Za-z']+(-[A-Za-z']+)*$/.test(w)) {
			problems.push(`"${w}": letters, apostrophes and hyphens only`);
			continue;
		}
		let caps = 0;
		for (const syl of w.split('-')) {
			syllables++;
			const letters = syl.replace(/'/g, '');
			if (letters === letters.toUpperCase()) caps++;
			else if (letters !== letters.toLowerCase()) problems.push(`"${syl}": a syllable is all lowercase or ALL CAPITALS`);
		}
		if (caps > 1) problems.push(`"${w}": more than one stressed syllable in one word`);
		stressed += caps;
	}
	if (syllables > 1 && stressed === 0) problems.push('no stressed syllable: capitalise the one that carries the word');
	return problems;
}

/**
 * Does this term need a respelling whether or not a critic asks for one?
 *
 * @param {string} term
 */
export const needsSay = (term) => /[^\x00-\x7f]/.test(term) || /^['’]/.test(term);

/**
 * The deck's generic head nouns: a word that appears in the TERMS of three or
 * more cards ("butter", "cheese", "mushroom"). Such a word identifies nothing,
 * so a term-free `gist` may use it; a word carried by one or two terms ("rib",
 * "hanger") would hand over the answer and may not appear.
 *
 * Computed from the ledger's terms, never from aliases, so it is stable from
 * the day the roster is minted and does not shift as cards are written.
 *
 * @param {string[]} terms
 * @returns {Set<string>}
 */
export function genericWords(terms) {
	const counts = new Map();
	for (const t of terms) for (const w of significantWords(t, 3)) counts.set(w, (counts.get(w) ?? 0) + 1);
	return new Set([...counts].filter(([, n]) => n >= 3).map(([w]) => w));
}

/**
 * The names that would give a card away: its term, and its SINGLE-WORD aliases.
 *
 * A one-word alias is a name (Onglet, Calotte, Flanken). A multi-word alias is
 * mostly ordinary vocabulary: the pilot section came back with "Beef Short
 * Ribs" as an alias of Short Rib and "Flap Meat" as one of Bavette, and
 * counting their words banned "beef" and "meat" from those cards' own
 * descriptions. The brief could not have warned the writers, either: it is
 * printed before any alias exists. Where a multi-word alias does share a
 * telling word with the term, the term's own words already cover it.
 *
 * @param {{ term: string, aliases?: string[] }} card
 * @returns {string}
 */
export function leakNames(card) {
	const single = (card.aliases ?? []).filter((a) => !/[\s-]/.test(String(a).trim()));
	return [card.term, ...single].join(' ');
}

/**
 * A card's one recipe link, against the recipe index: it must exist, and its
 * name must share a word with the term or an alias, the rule the crosslinks
 * obey (a link carries its subject).
 *
 * Here, in the contract, and not only in the build, because the build was the
 * one place it ran: a draft passed validate.mjs, merged, and then failed
 * build:data on "Tarte au Citron" under Tart and "Escabecheng Isda" under
 * Escabeche. The validator now loads the recipe index and calls this too.
 *
 * @param {{ id: string, term: string, aliases?: string[], recipe?: string }} card
 * @param {Map<string, string>} recipeName slug -> recipe name
 * @returns {string[]}
 */
export function recipeProblems(card, recipeName) {
	if (card.recipe === undefined) return [];
	const name = recipeName.get(card.recipe);
	if (!name) return [`${card.id}: recipe "${card.recipe}" is not in the recipe index`];
	const allNames = [card.term, ...(card.aliases ?? [])].join(' ');
	const inName = new Set(significantWords(name, 3));
	if (significantWords(allNames, 3).some((w) => inName.has(w))) return [];
	return [`${card.id}: recipe "${name}" shares no word with ${JSON.stringify(card.term)} or its aliases. A link carries its subject, the rule the crosslinks obey`];
}

/**
 * The words of a card's own name that an option under that name may not use.
 *
 * @param {{ term: string, aliases?: string[] }} card
 * @param {Set<string>} generic
 * @returns {string[]}
 */
export function identifyingWords(card, generic) {
	const all = significantWords(leakNames(card), 3);
	const own = all.filter((w) => !generic.has(w));
	/* When EVERY word of a name is generic, the exemption is off: "Truffle"
	   sits in three terms (the fungus, Truffle Oil, Chocolate Truffle), and
	   on the Truffle card that word is the whole answer. */
	return own.length ? own : all;
}

/**
 * How many of `words` survive in `text`, by the redactor's own matching.
 *
 * @param {string} text
 * @param {string[]} words
 * @returns {number}
 */
export function leakCount(text, words) {
	return words.length ? redact(text, '', { words }).hits : 0;
}

/** @param {string} a @param {string} b */
const jaccard = (a, b) => {
	const A = new Set(significantWords(a, 3));
	const B = new Set(significantWords(b, 3));
	if (!A.size || !B.size) return 0;
	let both = 0;
	for (const w of A) if (B.has(w)) both++;
	return both / (A.size + B.size - both);
};

/**
 * The card-facing prose, summed: what the section mean is a mean of.
 *
 * @param {Record<string, any>} card
 * @returns {number}
 */
export function cardTotal(card) {
	return PROSE.reduce((n, k) => n + (card[k] ? len(card[k]) : 0), 0);
}

/** @param {any} card */
export const isStub = (card) => card?.planned === true;

/**
 * One card, alone.
 *
 * @param {any} card  untrusted: this function is what reads it
 * @param {{ madeWith: 'required'|'optional', generic: Set<string> }} ctx
 * @returns {string[]}
 */
export function checkCard(card, ctx) {
	/** @type {string[]} */
	const problems = [];
	if (!card || typeof card !== 'object' || Array.isArray(card)) return ['not an object'];

	if (isStub(card)) {
		const extra = Object.keys(card).filter((k) => !STUB_KEYS.includes(k));
		if (extra.length) problems.push(`a planned card carries only ${STUB_KEYS.join(', ')}; found ${extra.join(', ')}`);
		if (typeof card.term !== 'string' || !within(len(card.term), LIMITS.term)) problems.push('term missing or out of bounds');
		return problems;
	}

	const extra = Object.keys(card).filter((k) => !CARD_KEYS.includes(k));
	if (extra.length) problems.push(`unknown key(s) ${extra.join(', ')}`);
	for (const k of Object.keys(card)) if (VERDICT_KEYS.has(k)) problems.push(`the key "${k}" would carry a verdict and is refused by name`);

	/** @param {string} k @param {number[]} limits @param {boolean} required */
	const str = (k, limits, required) => {
		const v = card[k];
		if (v === undefined) {
			if (required) problems.push(`${k} is required`);
			return false;
		}
		if (typeof v !== 'string') {
			problems.push(`${k} must be a string`);
			return false;
		}
		if (!within(len(v), limits)) problems.push(`${k} is ${len(v)} characters; the limits are ${limits[0]} to ${limits[1]}`);
		return true;
	};

	str('term', LIMITS.term, true);
	/* The key, never the name and never a string: `'1'` would pass a loose
	   compare in one place and fail a strict one in another, and a name here
	   would mean renaming a level edits 281 cards. */
	if (card.level === undefined) problems.push(`level is required: one of ${LEVELS.join(', ')}`);
	else if (typeof card.level !== 'number' || !Number.isInteger(card.level) || !LEVELS.includes(card.level)) {
		problems.push(`level is ${JSON.stringify(card.level)}; it is the integer key ${LEVELS.join(', ')}, never a string or a level's name`);
	}
	if (str('say', LIMITS.say, false)) problems.push(...sayProblems(card.say).map((p) => `say: ${p}`));
	else if (typeof card.term === 'string' && needsSay(card.term)) {
		problems.push('say is required: the term has a letter a plain keyboard cannot type, or opens on an apostrophe');
	}

	if (card.aliases !== undefined) {
		if (!Array.isArray(card.aliases) || card.aliases.length > LIMITS.aliasesMax) problems.push(`aliases: an array of at most ${LIMITS.aliasesMax}`);
		else {
			for (const a of card.aliases) {
				if (typeof a !== 'string' || !within(len(a), LIMITS.alias)) problems.push(`alias ${JSON.stringify(a)}: ${LIMITS.alias[0]} to ${LIMITS.alias[1]} characters`);
			}
			if (new Set(card.aliases.map(foldText)).size !== card.aliases.length) problems.push('aliases repeat');
			if (card.aliases.some((/** @type {unknown} */ a) => foldText(a) === foldText(card.term))) problems.push('an alias repeats the term');
		}
	}
	if (card.packet !== undefined && card.packet !== true) problems.push('packet is `true` or absent');

	str('gist', LIMITS.gist, true);
	str('guest', LIMITS.guest, true);
	str('why', LIMITS.why, true);
	str('note', LIMITS.note, false);
	const context = [
		str('origin', LIMITS.origin, false),
		str('pairs', LIMITS.pairs, false),
		str('notThis', LIMITS.notThis, false)
	].filter(Boolean);
	if (!context.length) problems.push('CONTEXT is empty: at least one of origin, pairs, notThis');
	str('line', LIMITS.line, false);

	for (const k of PROSE) {
		if (typeof card[k] !== 'string') continue;
		for (const p of proseProblems(card[k])) problems.push(`${k}: ${p}`);
		const stopped = /[.!?]["')’”]?$/.test(card[k]);
		if (SENTENCES.includes(k) && !stopped) problems.push(`${k} is a sentence and must end in a stop`);
		if (FRAGMENTS.includes(k) && /\.$/.test(card[k])) problems.push(`${k} is a label, not a sentence: no closing full stop`);
	}

	if (typeof card.guest === 'string') {
		if (/[();:]/.test(card.guest)) problems.push('guest: no brackets, semicolons or colons; it is a thing said aloud at a table');
		if ((card.guest.match(/[.!?](?=\s|$)/g) ?? []).length > 2) problems.push('guest: two sentences at most');
		if (/\d+\s?(?:C|F)\b|\d+ to \d+ C/.test(card.guest)) problems.push('guest: no temperatures at the table; put them in why or note');
	}

	if (typeof card.line === 'string') {
		const names = [card.term, ...(Array.isArray(card.aliases) ? card.aliases : [])].map(foldText);
		const folded = ` ${foldText(card.line)} `;
		if (!names.some((n) => nameInText(folded, n))) problems.push('line: a dish line has to carry the term, or one of its aliases, as written (a plain plural counts)');
	}

	// SERVICE FACTS
	if (card.madeWith === undefined) {
		if (ctx.madeWith === 'required') problems.push('madeWith is required in this section');
	} else if (!Array.isArray(card.madeWith) || !card.madeWith.length || card.madeWith.length > LIMITS.madeWithMax) {
		problems.push(`madeWith: an array of 1 to ${LIMITS.madeWithMax} ingredient nouns`);
	} else {
		for (const item of card.madeWith) {
			if (typeof item !== 'string') {
				problems.push('madeWith: every item is a string');
				continue;
			}
			/* accents folded for the pattern, case kept: the pattern is what says
			   "lowercase", and lowercasing first let 'Beef' through */
			const plain = item.normalize('NFD').replace(/[̀-ͯ]/g, '');
			const f = plain.toLowerCase();
			if (!within(len(item), LIMITS.madeWithItem) || !MADE_WITH_ITEM.test(plain)) {
				problems.push(`madeWith ${JSON.stringify(item)}: an ingredient noun in lowercase, optionally led by often, sometimes or traditionally`);
			}
			const denied = MADE_WITH_DENY.find((d) => f.includes(d)) ?? (/^(no |non)/.test(f) ? 'no/non' : null);
			if (denied) problems.push(`madeWith ${JSON.stringify(item)}: "${denied}" turns an ingredient into a verdict`);
		}
		if (new Set(card.madeWith.map(foldText)).size !== card.madeWith.length) problems.push('madeWith repeats an item');
		if (len(card.madeWith.join(', ')) > LIMITS.madeWithJoined) problems.push(`madeWith runs past ${LIMITS.madeWithJoined} characters joined`);
	}

	// references, shape only; checkDeck resolves them
	if (card.lexiconSlug !== undefined && (typeof card.lexiconSlug !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(card.lexiconSlug))) problems.push('lexiconSlug is a slug');
	if (card.recipe !== undefined && (typeof card.recipe !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(card.recipe))) problems.push('recipe is a recipe slug');
	/** @type {Array<[string, number]>} */
	const lists = [['seeAlso', LIMITS.seeAlsoMax], ['confusedWith', LIMITS.confusedWithMax]];
	for (const [k, max] of lists) {
		const v = card[k];
		if (v === undefined) continue;
		if (!Array.isArray(v) || !v.length || v.length > max) problems.push(`${k}: an array of 1 to ${max} card ids`);
		else {
			for (const id of v) if (typeof id !== 'string' || !DECK_ID_RE.test(id)) problems.push(`${k} ${JSON.stringify(id)} is not a card id`);
			if (v.includes(card.id)) problems.push(`${k} names the card itself`);
			if (new Set(v).size !== v.length) problems.push(`${k} repeats an id`);
		}
	}
	if (Array.isArray(card.seeAlso) && Array.isArray(card.confusedWith)) {
		const both = card.seeAlso.filter((/** @type {string} */ id) => card.confusedWith.includes(id));
		if (both.length) problems.push(`${both.join(', ')} sits in seeAlso and confusedWith at once`);
	}
	if (card.confusedWith !== undefined && card.notThis === undefined) {
		problems.push('confusedWith without notThis: say in words what it is not');
	}

	// the term may not appear in anything offered as an option beneath it
	const idWords = identifyingWords(card, ctx.generic);
	if (typeof card.gist === 'string' && leakCount(card.gist, idWords)) {
		problems.push(`gist names its own term (${idWords.join(', ')}): it sits as an option under that term`);
	}

	// TRAPS: authored wrong answers, used by the written test and nowhere else
	if (card.traps !== undefined) {
		if (!Array.isArray(card.traps) || card.traps.length > LIMITS.trapsMax) problems.push(`traps: an array of at most ${LIMITS.trapsMax}`);
		else {
			const seen = new Set();
			card.traps.forEach((/** @type {any} */ t, /** @type {number} */ i) => {
				const at = `traps[${i}]`;
				if (!t || typeof t !== 'object' || Object.keys(t).some((k) => k !== 'says' && k !== 'why')) {
					problems.push(`${at}: exactly { says, why }`);
					return;
				}
				if (typeof t.says !== 'string' || !within(len(t.says), LIMITS.trapSays)) problems.push(`${at}.says: ${LIMITS.trapSays[0]} to ${LIMITS.trapSays[1]} characters, the same band as gist so length is no tell`);
				if (typeof t.why !== 'string' || !within(len(t.why), LIMITS.trapWhy)) problems.push(`${at}.why: ${LIMITS.trapWhy[0]} to ${LIMITS.trapWhy[1]} characters`);
				if (typeof t.says !== 'string' || typeof t.why !== 'string') return;
				for (const p of proseProblems(t.says)) problems.push(`${at}.says: ${p}`);
				for (const p of proseProblems(t.why)) problems.push(`${at}.why: ${p}`);
				if (/\.$/.test(t.says)) problems.push(`${at}.says is an option, like gist: no closing full stop`);
				if (!/[.!?]$/.test(t.why)) problems.push(`${at}.why is a sentence and must end in a stop`);
				if (leakCount(t.says, idWords)) problems.push(`${at}.says names the term (${idWords.join(', ')})`);
				const key = foldText(t.says);
				if (seen.has(key)) problems.push(`${at}.says repeats another trap on this card`);
				seen.add(key);
				if (typeof card.gist === 'string') {
					if (key === foldText(card.gist)) problems.push(`${at}.says IS the gist: a trap has to be false`);
					else if (jaccard(t.says, card.gist) >= 0.8) problems.push(`${at}.says differs from the gist by almost nothing; a trap is a different claim, not a different character`);
				}
			});
		}
	}

	const total = cardTotal(card);
	if (!within(total, LIMITS.cardTotal)) problems.push(`the card's prose is ${total} characters; the limits are ${LIMITS.cardTotal[0]} to ${LIMITS.cardTotal[1]}`);

	// a trap on a card: the separate traps file makes this structural in the
	// emitted shape, and this keeps it true in the authored one
	if (Array.isArray(card.traps)) {
		for (const t of card.traps) {
			if (typeof t?.says !== 'string') continue;
			const key = foldText(t.says);
			for (const k of PROSE) {
				if (typeof card[k] === 'string' && key && foldText(card[k]).includes(key)) problems.push(`${k} repeats a trap's words: traps never appear on a card`);
			}
		}
	}

	return problems;
}

/**
 * The deck as a whole: identity against the ledger, references, the rules that
 * need every card at once.
 *
 * @param {AuthoredSection[]} sections
 * @param {Ledger} ledger
 * @param {{ lexiconSlugs?: Set<string>, complete?: boolean, packetTerms?: string[], packetErrors?: Record<string, RegExp> }} [opts]
 * @returns {string[]}
 */
export function checkDeck(sections, ledger, opts = {}) {
	/** @type {string[]} */
	const problems = [];

	// ── the ledger itself ────────────────────────────────────────────────────
	if (!ledger || !Number.isInteger(ledger.next) || !Array.isArray(ledger.cards)) {
		return ['the ledger is not { next, cards[] }: BUILD INPUT MISSING, never defaulted to empty'];
	}
	const rows = new Map();
	for (const r of ledger.cards) {
		if (!r || !DECK_ID_RE.test(r.id ?? '')) problems.push(`ledger row ${JSON.stringify(r?.id)}: not a card id`);
		else if (rows.has(r.id)) problems.push(`ledger: ${r.id} appears twice`);
		else if (Number(r.id.slice(3)) >= ledger.next) problems.push(`ledger: ${r.id} is at or past next (${ledger.next})`);
		else rows.set(r.id, r);
	}
	const liveRows = [...rows.values()].filter((r) => !r.retired);
	const generic = genericWords(liveRows.map((r) => r.term));

	// ── sections ─────────────────────────────────────────────────────────────
	const sectionKeys = new Set();
	for (const s of sections) {
		if (!/^[a-z]+$/.test(s.key ?? '')) problems.push(`section ${JSON.stringify(s.key)}: a key is lowercase letters`);
		if (sectionKeys.has(s.key)) problems.push(`section ${s.key} is declared twice`);
		sectionKeys.add(s.key);
		if (typeof s.blurb !== 'string' || !within(len(s.blurb), LIMITS.blurb)) problems.push(`section ${s.key}: blurb is ${LIMITS.blurb[0]} to ${LIMITS.blurb[1]} characters`);
		else for (const p of proseProblems(s.blurb)) problems.push(`section ${s.key} blurb: ${p}`);
		if (s.madeWith !== 'required' && s.madeWith !== 'optional') problems.push(`section ${s.key}: madeWith is 'required' or 'optional'`);
	}

	// ── every card, alone, then against the ledger ───────────────────────────
	const live = new Map();
	for (const s of sections) {
		s.cards.forEach((card, i) => {
			const where = `${s.key}[${i}] ${card?.term ? JSON.stringify(card.term) : '(unnamed)'}`;
			for (const p of checkCard(card, { madeWith: s.madeWith, generic })) problems.push(`${where}: ${p}`);
			if (!card || typeof card !== 'object') return;
			const id = card.id;
			if (typeof id !== 'string' || !DECK_ID_RE.test(id)) {
				problems.push(`${where}: id ${JSON.stringify(id)} is not a minted id. Ids are never typed by hand: write id: 'NEW' and run node tools/deck/mint-ids.mjs`);
				return;
			}
			if (live.has(id)) {
				problems.push(`${where}: id ${id} is already ${JSON.stringify(live.get(id).card.term)} in ${live.get(id).section}`);
				return;
			}
			live.set(id, { card, section: s.key });
			const row = rows.get(id);
			if (!row) problems.push(`${where}: ${id} has no ledger row. Ids are minted by tools/deck/mint-ids.mjs, never typed`);
			else if (row.retired) problems.push(`${where}: ${id} was retired (${row.retired}) and may never be reused`);
			else if (row.term !== card.term) {
				problems.push(`${where}: the ledger knows ${id} as ${JSON.stringify(row.term)}. If this is a rename, run node tools/deck/mint-ids.mjs --accept-rename ${id}; if two ids were swapped, swap them back`);
			}
		});
	}
	for (const r of liveRows) {
		if (!live.has(r.id)) problems.push(`ledger: ${r.id} ${JSON.stringify(r.term)} is not in any section. A reader may hold progress under that id: restore the card, or run node tools/deck/mint-ids.mjs --retire ${r.id}`);
	}

	// ── across cards ─────────────────────────────────────────────────────────
	const authored = [...live.values()].filter(({ card }) => !isStub(card));
	const byTerm = new Map();
	for (const { card } of live.values()) {
		const k = foldText(card.term);
		if (byTerm.has(k)) problems.push(`${card.id}: the term ${JSON.stringify(card.term)} is also ${byTerm.get(k)}`);
		else byTerm.set(k, card.id);
	}
	const gists = new Map();
	const guests = new Map();
	for (const { card } of authored) {
		for (const a of card.aliases ?? []) {
			const owner = byTerm.get(foldText(a));
			if (owner && owner !== card.id) problems.push(`${card.id}: the alias ${JSON.stringify(a)} is the term of ${owner}; link them with confusedWith or seeAlso instead`);
		}
		/** @type {Array<[Map<string, string>, string]>} */
		const once = [[gists, 'gist'], [guests, 'guest']];
		for (const [map, k] of once) {
			if (typeof card[k] !== 'string') continue;
			const f = foldText(card[k]);
			if (map.has(f)) problems.push(`${card.id}: ${k} is word for word the ${k} of ${map.get(f)}`);
			else map.set(f, card.id);
		}
	}
	for (const { card } of authored) {
		for (const k of ['seeAlso', 'confusedWith']) {
			for (const id of card[k] ?? []) {
				const row = rows.get(id);
				if (!row || row.retired) problems.push(`${card.id}: ${k} names ${id}, which is not a live card`);
			}
		}
		if (card.lexiconSlug !== undefined && opts.lexiconSlugs && !opts.lexiconSlugs.has(card.lexiconSlug)) {
			problems.push(`${card.id}: lexiconSlug "${card.lexiconSlug}" is not a Lexicon entry`);
		}
		for (const t of card.traps ?? []) {
			const owner = typeof t?.says === 'string' ? gists.get(foldText(t.says)) : undefined;
			if (owner) problems.push(`${card.id}: a trap is word for word the gist of ${owner}, so it is TRUE of something on the deck. When the mistake is confusing two cards, the tool is confusedWith`);
		}
	}

	// ── sections, sized ──────────────────────────────────────────────────────
	for (const s of sections) {
		const written = s.cards.filter((c) => c && !isStub(c));
		if (!written.length) continue;
		if (written.length < LIMITS.sectionMin) problems.push(`section ${s.key} emits ${written.length} card(s); a section that emits any emits at least ${LIMITS.sectionMin}, or multiple choice cannot field three kin`);
		const mean = written.reduce((n, c) => n + cardTotal(c), 0) / written.length;
		if (mean > LIMITS.sectionMean) problems.push(`section ${s.key}: the mean card is ${Math.round(mean)} characters; the ceiling on the mean is ${LIMITS.sectionMean}. Writers land near the ceiling they are given, which is why the section has one too`);
	}

	// ── the packet, once the deck says it is finished ────────────────────────
	if (opts.complete) {
		const stubs = [...live.values()].filter(({ card }) => isStub(card));
		if (stubs.length) problems.push(`DECK_COMPLETE is true and ${stubs.length} card(s) are still planned: ${stubs.slice(0, 6).map(({ card }) => card.term).join(', ')}${stubs.length > 6 ? ', ...' : ''}`);
		/* A level is offered as a whole written test, so it has to be able to
		   field one. Checked only once the deck is complete: a deck written a
		   section at a time passes through every shape on the way. */
		for (const level of LEVELS) {
			const n = authored.filter(({ card }) => card.level === level).length;
			if (n < LIMITS.levelMin) problems.push(`level ${level} holds ${n} written card(s); every level holds at least ${LIMITS.levelMin}, one full written test`);
		}
	}
	if (opts.packetTerms) {
		const terms = new Set([...live.values()].map(({ card }) => foldText(card.term)));
		for (const t of opts.packetTerms) if (!terms.has(foldText(t))) problems.push(`the packet term ${JSON.stringify(t)} has no card`);
	}
	if (opts.packetErrors) {
		for (const [id, re] of Object.entries(opts.packetErrors)) {
			const hit = live.get(id);
			if (!hit) problems.push(`PACKET_ERRORS names ${id}, which is not a live card`);
			else if (!isStub(hit.card) && !(hit.card.traps ?? []).some((/** @type {any} */ t) => re.test(String(t?.says)))) {
				problems.push(`${id} ${JSON.stringify(hit.card.term)}: the packet's handwritten answer was wrong in a known way (${re}) and no trap carries it. The mistake real people make is the wrong answer worth offering`);
			}
		}
	}

	return problems;
}

/**
 * The levels' display names and blurbs (DECK_LEVELS in floor-deck.mjs).
 *
 * A name holds NO digit, because the written test's result screen shows each
 * missed card's level by name and that screen is held to having no figure in
 * it at all (the owner's rule, tests/floor-deck.spec.ts). Names are unique
 * after folding, so "Sous Chef" and "sous-chef" cannot both be offered.
 *
 * @param {unknown} levels
 * @returns {string[]}
 */
export function checkLevels(levels) {
	/** @type {string[]} */
	const problems = [];
	if (!Array.isArray(levels)) return ['the levels are an array of { level, name, blurb }'];
	const keys = levels.map((l) => l?.level);
	if (JSON.stringify(keys) !== JSON.stringify(LEVELS)) {
		problems.push(`the levels are keyed ${JSON.stringify(keys)}; they are exactly ${JSON.stringify(LEVELS)}, in that order`);
	}
	const names = new Set();
	for (const l of levels) {
		const at = `level ${JSON.stringify(l?.level)}`;
		if (!l || typeof l !== 'object') {
			problems.push(`${at}: not an object`);
			continue;
		}
		const extra = Object.keys(l).filter((k) => !['level', 'name', 'blurb'].includes(k));
		if (extra.length) problems.push(`${at}: unknown key(s) ${extra.join(', ')}`);
		if (typeof l.name !== 'string' || !within(len(l.name), LIMITS.levelName)) {
			problems.push(`${at}: the name is ${LIMITS.levelName[0]} to ${LIMITS.levelName[1]} characters`);
		} else {
			if (/\d/.test(l.name)) problems.push(`${at}: the name "${l.name}" holds a digit, and the test's result screen shows no figure`);
			for (const p of proseProblems(l.name)) problems.push(`${at} name: ${p}`);
			const f = foldText(l.name);
			if (names.has(f)) problems.push(`${at}: the name "${l.name}" is another level's name`);
			names.add(f);
		}
		if (typeof l.blurb !== 'string' || !within(len(l.blurb), LIMITS.blurb)) {
			problems.push(`${at}: the blurb is ${LIMITS.blurb[0]} to ${LIMITS.blurb[1]} characters`);
		} else for (const p of proseProblems(l.blurb)) problems.push(`${at} blurb: ${p}`);
	}
	return problems;
}

/**
 * Walk anything about to be emitted and refuse a verdict-shaped key, wherever
 * it sits. The mirror of service-track.mjs assertNoVerdict.
 *
 * @param {unknown} value
 * @param {string} [path]
 * @returns {string[]}
 */
export function assertNoDeckVerdict(value, path = 'deck') {
	/** @type {string[]} */
	const problems = [];
	/** @param {unknown} v @param {string} at */
	const walk = (v, at) => {
		if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${at}[${i}]`));
		else if (v && typeof v === 'object') {
			for (const [k, x] of Object.entries(v)) {
				// the ONE allowed link to a recipe is the singular key on a card root
				if (VERDICT_KEYS.has(k)) problems.push(`${at}.${k}: a key that would carry a verdict`);
				walk(x, `${at}.${k}`);
			}
		}
	};
	walk(value, path);
	return problems;
}
