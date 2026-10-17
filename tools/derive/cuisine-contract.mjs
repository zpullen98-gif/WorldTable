/**
 * Cuisine's contract: ONE statement of what a chapter of the French and
 * Creole learning area may hold.
 *
 * Imported by the build (tools/derive/cuisine.mjs), by the authoring tools
 * (tools/cuisine/validate.mjs, merge.mjs and brief.mjs) and by
 * src/lib/cuisine-contract.test.ts, so a draft that passes the validator
 * cannot fail the build on a rule the validator did not know, and the
 * numbers printed in an author's brief are these numbers, never retyped.
 *
 * Pure: nothing here touches the file system. The callers read the data
 * files and hand them to `makeRefs`, then call `checkSet`.
 *
 * ## The shapes
 *
 * A chapter file (tools/derive/cuisine/<key>.json) is
 * `{ key, title, intro, entries, steps, match }`. An entry carries its own
 * `stem` (the id ledger's key, unique across Cuisine) and `slug` (the
 * address), a respelling in `say`, a level as the integer key 1 to 4 (the
 * names Commis, Chef de Partie, Sous Chef and Chef live in LEVEL_NAMES and
 * nowhere else), a `kind`, a summary, a guest line, sections of paragraphs,
 * ratios, temperatures, faults, Brennan's links, cross references, an
 * optional public domain quote, sources, cards and questions. A steps set
 * orders four to nine stages with at most one stage that does not belong;
 * a match pairs four to eight items one to one.
 *
 * tree.json is Carême's four and the five mothers with their families;
 * ladder.json is the roux colour ladder. Both may link entries before every
 * entry is written: a node without `entry` is drawn as a name. Three match
 * sets are GENERATED from them and from the Brennan's links (GENERATED
 * below), so a match can never disagree with the tree or the ladder; an
 * authored pair that names tree nodes or ladder rungs is held to them too.
 *
 * ## Borrowed rules, and where from
 *
 * The American spelling detector, the dash pattern, the US measure rule and
 * the level numeral pattern are copied from tools/kitchen/check-training.mjs
 * (a script that runs on import, so it cannot be imported); the superlatives,
 * the verdict and the allergen pointer are copied from tools/house/engine.mjs
 * (where three of the four are not exported, and which another tool owns).
 * The meaning is unchanged, and src/lib/cuisine-contract.test.ts reads both
 * source files and fails if a copy drifts. The respelling rule is imported
 * from the Floor Deck's contract.
 */

import { sayProblems } from './floor-deck-contract.mjs';

/**
 * Loose on purpose: an authored chapter is untrusted input until this file
 * has read it, and the checks below are what give it a shape.
 *
 * @typedef {{ path: string, message: string }} Problem
 * @typedef {Record<string, any>} Loose
 * @typedef {{ key: string, title: string, intro: string }} ChapterMeta
 * @typedef {{ id: string, name: string, kind: string, itemIds: Set<string> }} PackComponent
 * @typedef {{ chapter: string, stem: string, slug: string, title: string, level?: number, kind?: string, brennans?: unknown, [k: string]: unknown }} RosterRow
 * @typedef {{
 *   techniques: Map<string, string>,
 *   lexicon: Map<string, string>,
 *   recipes: Map<string, string>,
 *   kitchen: Map<string, string>,
 *   plates: Map<string, string>,
 *   folios: Map<string, string>,
 *   deck: Map<string, string>,
 *   dishes: Map<string, string>,
 *   components: Map<string, PackComponent>,
 *   terms: Map<string, { term: string, say: string }>,
 *   foundations: Map<string, string>,
 *   names: string[],
 *   roster: RosterRow[] | null
 * }} Refs
 * @typedef {{ draft?: boolean, complete?: boolean, today?: string }} CheckOptions
 * @typedef {{ meta: ChapterMeta[], files: Map<string, Loose>, tree: Loose | null, ladder: Loose | null }} CuisineSet
 * @typedef {{ stem: string, chapter: string, from: 'tree' | 'ladder' | 'brennans', title: string, prompt: string, left: string, right: string, pairs: Array<[string, string] | [string, string, string]> }} GeneratedMatch
 */

/** Flip on when all twelve chapters are written: then every level holds
 *  LIMITS.levelMin entries, every chapter has a file, every mother links its
 *  entry, and draft mode is refused. */
export const CUISINE_COMPLETE = true;

/** The four brigade levels by their frozen integer keys. */
export const LEVELS = [1, 2, 3, 4];
/** The only place the names live; a level is named, never numbered, in
 *  anything shown. */
export const LEVEL_NAMES = { 1: 'Commis', 2: 'Chef de Partie', 3: 'Sous Chef', 4: 'Chef' };

export const KINDS = ['sauce', 'stock', 'emulsion', 'method', 'dish', 'ingredient', 'person', 'place', 'history', 'term', 'pastry', 'safety'];
export const SECTION_KEYS = ['what', 'how', 'ratio', 'family', 'faults', 'brennans', 'history', 'service', 'buying', 'safety'];
/** `terms` is the owner's own sheet terms (Your culinary terms, /foundations),
 *  by the entry id of src/lib/data/culinary-foundations.json, drawn on the
 *  entry as From your sheets. Not the Brennan's pack's lexicon terms, which
 *  live in Refs.terms and give a respelling. */
export const SEE_ALSO_KEYS = ['entries', 'techniques', 'lexicon', 'recipes', 'kitchen', 'plates', 'folios', 'deck', 'components', 'terms'];

/** The twelve chapters. chapters.json holds their order, titles and intros. */
export const CHAPTER_KEYS = [
	'foundations', 'mother-sauces', 'butter-emulsions', 'methods', 'creole-cajun', 'larder',
	'old-houses', 'brennans', 'pastry', 'kitchen-french', 'history', 'safety'
];
/** The chapter whose every temperature and time stands in a source's evidence. */
export const SAFETY_CHAPTER = 'safety';

/** Word limits, [min, max]. Words are counted as the house engine counts them. */
export const WORDS = {
	summary: [20, 45],
	guest: [12, 35],
	body: [300, 750],
	paragraph: [1, 120],
	cardFront: [4, 25],
	cardBack: [8, 60],
	question: [6, 40],
	why: [10, 50],
	stepsWhy: [10, 60],
	brennansHow: [12, 60],
	quote: [1, 60],
	adds: [1, 15],
	intro: [15, 70],
	careNote: [10, 80],
	rungLine: [2, 30],
	prompt: [3, 30]
};

/** Counts, [min, max] or a single figure. */
export const LIMITS = {
	sections: [3, SECTION_KEYS.length],
	cards: [8, 12],
	questions: [6, 10],
	distractors: 3,
	steps: [4, 9],
	pairs: [4, 8],
	sources: 1,
	/** kind history, and every entry of the safety chapter */
	sourcesStrict: 2,
	/** per level across the whole set, once CUISINE_COMPLETE */
	levelMin: 15,
	mothers: 5,
	motherChildren: 3,
	rungs: [4, 8],
	introSentences: 2,
	/** the answer may not be longer than this times its longest distractor */
	answerRatio: 1.8,
	/** a quote is from a public domain text, printed in or before this year */
	quoteYear: 1930,
	/** temperatures: Fahrenheit within this many degrees of the conversion */
	tempSlack: 3,
	/** seeAlso.terms: the sheet terms an entry teaches or rests on, never a passing mention */
	sheetTerms: 5
};

/** The public domain texts a quote may come from. */
export const QUOTE_SOURCES = [/Escoffier/, /Hearn/, /Picayune/];

/**
 * Proper names that keep an American spelling wherever they are printed:
 * labels, institutions and restaurants. Matched as written, case and all,
 * and removed before the spelling check. Pack dish, component and term names
 * are added at run time from the Brennan's pack.
 */
export const SPELLING_OK = [
	"Steen's 100% Pure Cane Syrup", "Steen's", 'National Center for Home Food Preservation',
	'Center for Food Safety and Applied Nutrition', 'Centers for Disease Control and Prevention',
	'Culinary Institute of America', 'The Flavor Bible', 'Louisiana Kitchen', 'Southern Food and Beverage Museum'
];

/** The three match sets the build writes from the tree, the ladder and the Brennan's links. */
export const GENERATED = /** @type {const} */ ([
	{ stem: 'small-sauce-to-mother', chapter: 'mother-sauces', from: 'tree', title: 'Small sauce to mother', prompt: 'Match each small sauce to the mother it is built on.', left: 'Small sauce', right: 'Mother' },
	{ stem: 'roux-colour-to-dish', chapter: 'creole-cajun', from: 'ladder', title: 'Roux colour to dish', prompt: 'Match each roux colour to the dish that takes it.', left: 'Roux', right: 'Dish' },
	{ stem: 'brennans-dish-to-sauce', chapter: 'brennans', from: 'brennans', title: "Brennan's dish to sauce", prompt: "Match each Brennan's dish to the sauce it carries.", left: 'Dish', right: 'Sauce' }
]);

export const ENTRY_KEYS = ['stem', 'slug', 'title', 'say', 'level', 'kind', 'summary', 'guest', 'sections', 'ratios', 'temps', 'faults', 'brennans', 'seeAlso', 'quote', 'sources', 'cards', 'questions'];
export const CHAPTER_FILE_KEYS = ['key', 'title', 'intro', 'entries', 'steps', 'match'];
export const PART_KEYS = ['entries', 'steps', 'match'];
const CARD_KEYS = ['stem', 'front', 'back'];
const QUESTION_KEYS = ['stem', 'q', 'answer', 'distractors', 'why', 'teaches'];
const STEPS_KEYS = ['stem', 'entry', 'title', 'prompt', 'steps', 'distractor', 'why'];
const MATCH_KEYS = ['stem', 'title', 'prompt', 'left', 'right', 'pairs'];
const SOURCE_KEYS = ['title', 'url', 'asOf', 'year', 'evidence'];
const BRENNANS_KEYS = ['dish', 'components', 'how'];
const DISH_LINK_KEYS = ['dish', 'components'];
const MOTHER_KEYS = ['name', 'say', 'entry', 'liaison', 'liquid', 'children'];
const CHILD_KEYS = ['name', 'say', 'adds', 'entry', 'dishes', 'children'];
const RUNG_KEYS = ['key', 'name', 'minutes', 'cue', 'smell', 'thickening', 'uses', 'dishes'];

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DISH_ID_RE = /^d-[0-9a-z]{8}$/;
export const DECK_ID_RE = /^fd_\d{4}$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/* ── copied from tools/kitchen/check-training.mjs, meaning unchanged ─────── */
/** Em dash, en dash, their entities, or a double hyphen. */
export const DASH_RE = /[\u2014\u2013]|&mdash;|&ndash;|&#8212;|&#8211;|&#x2014;|&#x2013;|-{2}/i;
/** A level by its number, in any form. */
export const NUMERAL_RE = /\blevel\s*(?:[0-9]+|i{1,3}|iv|one|two|three|four)\b/i;
export const AMERICAN_RE = /\b(?:color|colors|colored|flavor|flavors|flavored|flavorful|favorite|center|centers|centered|caramelize[sd]?|caramelizing|yogurt|fiber|savory|mold|molds|gray|tenderize[sd]?|tenderizing|theater|meter|liter|liters|aluminum|eggplant|cilantro|zucchini|ladyfingers?|cookie sheet|broiled|broiling|broil|broiler|omelet|omelets|odor|honor|neighbor|harbor|cozy|plow|mustache|pajamas|program|catalog|traveled|traveling|labeled|labeling|fueled|jewelry|skillful|fulfill)\b/i;
/** -ize words other than these are American. */
export const IZE_OK = new Set(['size', 'sizes', 'sized', 'seize', 'seized', 'seizes', 'prize', 'prizes', 'prized', 'maize', 'capsize', 'capsized', 'downsize', 'bite-size', 'baize']);
export const IZE_RE = /\b[a-z]+iz(?:e|es|ed|ing|ation|ations|er|ers)\b/gi;
/** A US quantity in prose; its metric must follow in brackets within a short span. */
export const US_QTY_RE = /(\d+(?:\s\d+\/\d+|\/\d+|\.\d+)?)\s(?:to\s\d+(?:\/\d+)?\s)?(cups?|tbsp|tsp|oz|ounces?|lb|lbs|pounds?|quarts?|pints?|inch|inches)\b/gi;
export const METRIC_AFTER_RE = /^[^()]{0,40}\([^)]*\d[^)]*(?:g|kg|ml|litres?|cm|mm)\b[^)]*\)/i;

/* ── copied from tools/house/engine.mjs, meaning unchanged ────────────────── */
export const BANNED_WORDS = /\b(delicious|amazing|perfect(ly)?|decadent|to die for|mouth-?watering|elevated|unique|world-class)\b/i;
export const ALLERGEN_CLASS = /\b(allerg\w*|intoleran\w*|gluten|dairy|celiac|coeliac|lactose|tree nuts?|shellfish|vegan|vegetarian|sesame|soy)\b/i;
export const ALLERGEN_POINTER = /service note|kitchen|lineup/i;
export const VERDICT = /\b(gluten|dairy|nut|egg|allergen|shellfish|soy|sesame|lactose|meat)[- ]free\b|\bcontains no\b|\bsuitable for\b|\bsafe\b/i;
const NOTE_WORD_RE = /[A-Za-z0-9\u00C0-\u024F'\u2019]+(?:-[A-Za-z0-9\u00C0-\u024F'\u2019]+)*/g;
const sentencesOf = (/** @type {string} */ s) => s.split(/(?<=[.!?][\u201D"]?)\s+|\n+/).filter((x) => x.trim());

/* ── cuisine's own ───────────────────────────────────────────────────────── */
/** The other way round from the kitchen's rule, also accepted: "225 g (8 oz)". */
const METRIC_BEFORE_RE = /\d[\d.,]*\s?(?:g|kg|ml|l|litres?|cm|mm)\s*\(\s*(?:about\s|roughly\s)?$/i;
/** "63°C (145°F)" or "145°F (63°C)", either with a range: "60 to 65°C (140 to 149°F)". */
const TEMP_PAIR_RE = /(\d+(?:\.\d+)?)(?: to (\d+(?:\.\d+)?))?°([CF]) \((\d+(?:\.\d+)?)(?: to (\d+(?:\.\d+)?))?°([CF])\)/g;
const TIME_RE = /(\d+(?:\.\d+)?)(?: to (\d+(?:\.\d+)?))?\s?(?:seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|weeks?)\b/gi;
const ABOVE_RE = /\b(?:all|none) of the above\b/i;

/** @param {unknown} s */
export function words(s) {
	const m = typeof s === 'string' ? s.match(NOTE_WORD_RE) : null;
	return m ? m.length : 0;
}

/** Case, accents, curly quotes and spacing folded away. @param {unknown} s */
export const fold = (s) =>
	String(s ?? '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[\u2018\u2019]/g, "'")
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.trim();

/** An option, folded for comparison: closing punctuation does not make it different. @param {unknown} s */
export const foldOption = (s) => fold(s).replace(/[.!?,;:]+$/, '');

/** A name folded for the pack's term list: "The holy trinity" meets "Holy trinity". @param {unknown} s */
export const foldTerm = (s) => fold(s).replace(/^the /, '');

/** A sauce name folded so "Sauce Choron" and "Choron" are one sauce. @param {unknown} s */
export const foldSauce = (s) => fold(s).replace(/^(?:sauce|the) /, '');

/** @param {number} n @param {readonly number[]} range */
const within = (n, range) => n >= range[0] && n <= range[1];
/** @param {unknown} v @returns {v is Loose} */
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
/** @param {unknown} v @returns {v is string} */
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;

/**
 * The two scales, side by side, with the arithmetic checked: a transposed
 * digit in a temperature is the typo here that can hurt somebody.
 *
 * @param {string} s
 * @returns {string[]}
 */
export function temperatureProblems(s) {
	/** @type {string[]} */
	const out = [];
	const rest = String(s).replace(TEMP_PAIR_RE, (m, a1, a2, u1, b1, b2, u2) => {
		if (u1 === u2) {
			out.push(`"${m}": the bracket repeats the scale; write 63°C (145°F)`);
			return ' ';
		}
		if ((a2 === undefined) !== (b2 === undefined)) {
			out.push(`"${m}": a range on one side and not the other`);
			return ' ';
		}
		for (const [a, b] of [[a1, b1], [a2, b2]]) {
			if (a === undefined) continue;
			const c = Number(u1 === 'C' ? a : b);
			const f = Number(u1 === 'C' ? b : a);
			const want = (c * 9) / 5 + 32;
			if (Math.abs(want - f) > LIMITS.tempSlack) out.push(`"${m}": ${c}°C is ${Math.round(want)}°F, not ${f}°F`);
		}
		return ' ';
	});
	if (/°/.test(rest)) out.push('a temperature on one scale only: every Celsius figure carries its Fahrenheit, as 63°C (145°F)');
	if (/\b\d+(?:\.\d+)? ?(?:degrees|deg)\b/i.test(rest)) out.push('a temperature in words: write 63°C (145°F)');
	if (/\b\d+(?:\.\d+)? ?[CF]\b/.test(rest)) out.push('a bare temperature: write 63°C (145°F), with the degree sign');
	return out;
}

/**
 * Every US measure carries its metric in brackets ("8 oz (225 g)"), or sits in
 * brackets after the metric figure it translates ("225 g (8 oz)").
 *
 * @param {string} s
 * @returns {string[]}
 */
export function measureProblems(s) {
	/** @type {string[]} */
	const out = [];
	for (const q of String(s).matchAll(US_QTY_RE)) {
		const at = q.index ?? 0;
		if (METRIC_AFTER_RE.test(s.slice(at + q[0].length))) continue;
		if (METRIC_BEFORE_RE.test(s.slice(0, at))) continue;
		out.push(`the US measure "${q[0]}" without its metric in brackets: write "8 oz (225 g)" or "225 g (8 oz)"`);
	}
	return out;
}

/**
 * British spelling, by the training kitchen's detector. `ok` lists proper
 * names that keep their own spelling; they are lifted out first.
 *
 * @param {string} s
 * @param {readonly string[]} [ok]
 * @returns {string[]}
 */
export function spellingProblems(s, ok = SPELLING_OK) {
	let t = String(s).replace(/\bgrill \(broiler\)/gi, 'grill');
	for (const name of ok) if (name && t.includes(name)) t = t.split(name).join(' ');
	/** @type {string[]} */
	const out = [];
	const am = t.match(AMERICAN_RE);
	if (am) out.push(`American spelling "${am[0]}": the prose is British (colour, flavour, centre, savoury, litre, grey, aubergine)`);
	for (const z of t.match(IZE_RE) ?? []) if (!IZE_OK.has(z.toLowerCase())) out.push(`American -ize spelling "${z}": write -ise (caramelise, emulsify, stabilise)`);
	return out;
}

/** @param {string} s @returns {string[]} */
export function dashProblems(s) {
	return DASH_RE.test(String(s)) ? ['a dash (em dash, en dash, their entities or a double hyphen): use a comma, a colon or a full stop'] : [];
}

/**
 * The rules every prose string obeys, in whatever field it sits.
 *
 * @param {string} s
 * @param {readonly string[]} [ok] names exempt from the spelling check
 * @returns {string[]}
 */
export function proseProblems(s, ok = SPELLING_OK) {
	const text = String(s);
	/** @type {string[]} */
	const out = [...dashProblems(text)];
	if (/\s{2,}|^\s|\s$/.test(text)) out.push('stray whitespace');
	const n = text.match(NUMERAL_RE);
	if (n) out.push(`a level by its number ("${n[0]}"): a level is named, Commis, Chef de Partie, Sous Chef or Chef`);
	const b = text.match(BANNED_WORDS);
	if (b) out.push(`the banned word "${b[0]}": say what it is, not how good it is`);
	const v = text.match(VERDICT);
	if (v) out.push(`an allergen or diet verdict ("${v[0]}"): say what a thing is made with, never what it is free of or safe for`);
	for (const sentence of sentencesOf(text)) {
		if (ALLERGEN_CLASS.test(sentence) && !ALLERGEN_POINTER.test(sentence)) {
			out.push(`names an allergen or a diet without sending the reader to the service note or the kitchen: "${sentence.trim().slice(0, 80)}"`);
		}
	}
	out.push(...spellingProblems(text, ok));
	out.push(...temperatureProblems(text));
	out.push(...measureProblems(text));
	return out;
}

/** A name (a title, a node, a match item): the dash, numeral and spelling rules. @param {string} s @param {readonly string[]} ok */
function nameProblems(s, ok) {
	const text = String(s);
	/** @type {string[]} */
	const out = [...dashProblems(text)];
	if (/\s{2,}|^\s|\s$/.test(text)) out.push('stray whitespace');
	if (NUMERAL_RE.test(text)) out.push('a level by its number: a level is named');
	out.push(...spellingProblems(text, ok));
	out.push(...temperatureProblems(text));
	out.push(...measureProblems(text));
	return out;
}

/**
 * A respelling. Either the Floor Deck's form (ASCII syllables, hyphens, one
 * stressed syllable in capitals: HOL-un-dayz) or the pack's "As it reads"
 * form for a plain English name.
 *
 * @param {unknown} say
 * @returns {string[]}
 */
export function respellingProblems(say) {
	if (!isStr(say)) return ['say is a respelling, such as bair-NAYZ, or "As it reads: brown stock."'];
	if (/^As it reads\b.*\.$/.test(say)) return [];
	return sayProblems(say);
}

/**
 * The pack's respelling for a name, when the pack carries the name as a
 * lexicon term.
 *
 * @param {Refs} refs
 * @param {...unknown} names
 */
export function packSay(refs, ...names) {
	for (const n of names) {
		if (!isStr(n)) continue;
		const hit = refs.terms.get(foldTerm(n));
		if (hit) return hit;
	}
	return null;
}

/** @param {string} say */
const isRespelling = (say) => !/^(As it reads|ask)\b/i.test(say);

/**
 * The roster another tool writes, in any of the shapes it might take, as
 * rows. Accepted: an array of rows each naming its chapter; `{ entries: [...] }`;
 * `{ chapters: [{ key, entries }] }`; `{ chapters: { key: [...] } }`; or
 * `{ <chapter key>: [...] }`.
 *
 * @param {unknown} raw
 * @returns {RosterRow[]}
 */
export function rosterRows(raw) {
	/** @type {RosterRow[]} */
	const rows = [];
	/** @param {unknown} row @param {string | undefined} chapter */
	const take = (row, chapter) => {
		if (!isObj(row)) return;
		const ch = isStr(row.chapter) ? row.chapter : chapter;
		const title = isStr(row.title) ? row.title : isStr(row.name) ? row.name : '';
		const stem = isStr(row.stem) ? row.stem : isStr(row.slug) ? row.slug : '';
		if (!ch || !stem) return;
		rows.push({ ...row, chapter: ch, stem, slug: isStr(row.slug) ? row.slug : stem, title });
	};
	/** @param {unknown} list @param {string} [chapter] */
	const takeAll = (list, chapter) => {
		if (Array.isArray(list)) for (const r of list) take(r, chapter);
	};
	if (Array.isArray(raw)) takeAll(raw);
	else if (isObj(raw)) {
		if (Array.isArray(raw.entries)) takeAll(raw.entries);
		if (Array.isArray(raw.chapters)) for (const c of raw.chapters) if (isObj(c)) takeAll(c.entries ?? c.roster ?? c.items, c.key);
		if (isObj(raw.chapters)) for (const [k, v] of Object.entries(raw.chapters)) takeAll(isObj(v) ? v.entries : v, k);
		for (const k of CHAPTER_KEYS) if (Array.isArray(raw[k])) takeAll(raw[k], k);
		for (const k of CHAPTER_KEYS) if (isObj(raw[k]) && Array.isArray(raw[k].entries)) takeAll(raw[k].entries, k);
	}
	return rows;
}

/**
 * The reference sets every cross reference resolves against, from data the
 * caller has already read.
 *
 * `foundations` is src/lib/data/culinary-foundations.json, the owner's own
 * sheet terms, mapped entry id to term; left out, no sheet term resolves.
 *
 * @param {{ techniques: Loose[], lexicon: Loose[], recipes: Loose[], kitchen: Loose, plates: Loose, folios: Array<{ id: string, title: string }>, deck: Loose, pack: Loose, foundations?: Loose, roster?: unknown }} data
 * @returns {Refs}
 */
export function makeRefs(data) {
	/** @param {Loose[]} list @param {string} key @param {string} label */
	const map = (list, key, label) => new Map(list.map((x) => [String(x[key]), String(x[label] ?? x[key])]));
	const house = data.pack?.house ?? data.pack ?? {};
	/** @type {Map<string, PackComponent>} */
	const components = new Map();
	for (const c of house.components ?? []) {
		components.set(String(c.name), { id: String(c.id), name: String(c.name), kind: String(c.kind), itemIds: new Set(c.itemIds ?? []) });
	}
	/** @type {Map<string, { term: string, say: string }>} */
	const terms = new Map();
	for (const t of house.lexicon ?? []) {
		const say = t.say && typeof t.say === 'object' ? t.say.value : t.say;
		if (isStr(t.term) && isStr(say)) terms.set(foldTerm(t.term), { term: t.term, say });
	}
	const dishes = new Map((house.dishes ?? []).map((/** @type {Loose} */ d) => [String(d.id), String(d.name)]));
	const names = [...new Set([...dishes.values(), ...components.keys(), ...[...terms.values()].map((t) => t.term)])].sort((a, b) => b.length - a.length);
	return {
		techniques: map(data.techniques, 'slug', 'label'),
		lexicon: map(data.lexicon, 'slug', 'term'),
		recipes: map(data.recipes, 'slug', 'name'),
		kitchen: map(data.kitchen?.dishes ?? [], 'slug', 'title'),
		plates: map(data.plates?.plates ?? [], 'slug', 'title'),
		folios: new Map(data.folios.map((f) => [f.id, f.title])),
		deck: map(data.deck?.cards ?? [], 'id', 'term'),
		dishes,
		components,
		terms,
		foundations: map(Array.isArray(data.foundations?.entries) ? data.foundations.entries : [], 'id', 'term'),
		names,
		roster: data.roster === undefined || data.roster === null ? null : rosterRows(data.roster)
	};
}

/* ════════════════════════════════════════════════════════════════════════
   The checks
   ════════════════════════════════════════════════════════════════════════ */

/**
 * @typedef {{
 *   refs: Refs,
 *   opts: Required<CheckOptions>,
 *   ok: string[],
 *   slugs: Set<string>,
 *   planned: Set<string>,
 *   push: (path: string, message: string) => void,
 *   dashed: () => string[],
 *   titles: Map<string, string>
 * }} Ctx
 */

/** @param {Ctx} ctx @param {string} at @param {unknown} v @param {string} field */
function prose(ctx, at, v, field) {
	if (!isStr(v)) {
		ctx.push(at, `${field} is a non-empty string`);
		return false;
	}
	for (const p of proseProblems(v, ctx.ok)) ctx.push(at, `${field}: ${p}`);
	return true;
}

/** @param {Ctx} ctx @param {string} at @param {unknown} v @param {string} field @param {readonly number[]} range */
function proseWords(ctx, at, v, field, range) {
	if (!prose(ctx, at, v, field)) return;
	const n = words(v);
	if (!within(n, range)) ctx.push(at, `${field} is ${n} words; the limits are ${range[0]} to ${range[1]}`);
}

/** @param {Ctx} ctx @param {string} at @param {unknown} v @param {string} field */
function name(ctx, at, v, field) {
	if (!isStr(v)) {
		ctx.push(at, `${field} is a non-empty string`);
		return false;
	}
	for (const p of nameProblems(v, ctx.ok)) ctx.push(at, `${field}: ${p}`);
	return true;
}

/** @param {Ctx} ctx @param {string} at @param {Loose} obj @param {readonly string[]} keys @param {string} what */
function keysOnly(ctx, at, obj, keys, what) {
	const extra = Object.keys(obj).filter((k) => !keys.includes(k));
	if (extra.length) ctx.push(at, `unknown key(s) on ${what}: ${extra.join(', ')}; the keys are ${keys.join(', ')}`);
}

/** A Cuisine slug a reference may name. @param {Ctx} ctx @param {unknown} slug */
const cuisineResolves = (ctx, slug) => typeof slug === 'string' && (ctx.slugs.has(slug) || (ctx.opts.draft && ctx.planned.has(slug)));

/** @param {Ctx} ctx @param {string} slug */
const unresolved = (ctx, slug) =>
	ctx.opts.draft
		? `"${slug}" is neither a written Cuisine entry nor planned in tools/cuisine/roster.json`
		: `"${slug}" is not a written Cuisine entry${ctx.planned.has(slug) ? ' (it is planned in the roster: validate with --draft, or link it once it is written)' : ''}`;

/**
 * A pack dish and the pack components on it: the dish must be on the menu and
 * every component must name it in its itemIds.
 *
 * @param {Ctx} ctx @param {string} at @param {unknown} link @param {readonly string[]} keys
 */
function dishLink(ctx, at, link, keys) {
	if (!isObj(link)) {
		ctx.push(at, 'a dish link is { dish, components }');
		return;
	}
	keysOnly(ctx, at, link, keys, 'a dish link');
	const dish = link.dish;
	if (typeof dish !== 'string' || !DISH_ID_RE.test(dish)) ctx.push(at, `dish ${JSON.stringify(dish)} is not a dish id (d- and eight characters)`);
	else if (!ctx.refs.dishes.has(dish)) ctx.push(at, `dish ${dish} is not a dish in the Brennan's pack`);
	if (!Array.isArray(link.components) || !link.components.length) {
		ctx.push(at, 'components: one or more pack component names that link this dish');
		return;
	}
	if (new Set(link.components).size !== link.components.length) ctx.push(at, 'components repeat a name');
	for (const c of link.components) {
		const comp = typeof c === 'string' ? ctx.refs.components.get(c) : undefined;
		if (!comp) ctx.push(at, `component ${JSON.stringify(c)} is not a component of the Brennan's pack (exact name)`);
		else if (typeof dish === 'string' && !comp.itemIds.has(dish)) {
			ctx.push(at, `component "${c}" does not name ${dish} (${ctx.refs.dishes.get(dish) ?? 'unknown dish'}) in its itemIds`);
		}
	}
}

/**
 * The figures a safety entry states, which its sources must carry.
 *
 * @param {Loose} e
 * @returns {string[]}
 */
export function safetyFigures(e) {
	/** @type {Set<string>} */
	const figures = new Set();
	const body = (Array.isArray(e.sections) ? e.sections : []).flatMap((/** @type {Loose} */ s) => (Array.isArray(s?.paras) ? s.paras : [])).filter((/** @type {unknown} */ p) => typeof p === 'string');
	for (const p of body) {
		for (const m of p.matchAll(TEMP_PAIR_RE)) for (const n of [m[1], m[2], m[4], m[5]]) if (n !== undefined) figures.add(n);
		for (const m of p.matchAll(TIME_RE)) for (const n of [m[1], m[2]]) if (n !== undefined) figures.add(n);
	}
	for (const t of Array.isArray(e.temps) ? e.temps : []) {
		if (typeof t?.c === 'number') figures.add(String(t.c));
		if (typeof t?.f === 'number') figures.add(String(t.f));
	}
	return [...figures];
}

/**
 * One entry, alone, against the reference sets.
 *
 * @param {unknown} e
 * @param {string} at  the entry's path, "chapter/stem"
 * @param {string} chapter
 * @param {Ctx} ctx
 */
export function checkEntry(e, at, chapter, ctx) {
	if (!isObj(e)) {
		ctx.push(at, 'an entry is an object');
		return;
	}
	keysOnly(ctx, at, e, ENTRY_KEYS, 'an entry');
	for (const k of ['stem', 'slug']) {
		if (typeof e[k] !== 'string' || !SLUG_RE.test(e[k])) ctx.push(at, `${k} ${JSON.stringify(e[k])} is lowercase letters and figures joined by single hyphens`);
	}
	name(ctx, `${at}.title`, e.title, 'title');

	// say: the pack's respelling, exactly, for a name the pack carries
	const pack = packSay(ctx.refs, e.title, typeof e.slug === 'string' ? e.slug.replace(/-/g, ' ') : null);
	if (pack) {
		if (e.say !== pack.say) ctx.push(`${at}.say`, `the Brennan's pack carries "${pack.term}" with the respelling ${JSON.stringify(pack.say)}; say must be exactly that, not ${JSON.stringify(e.say)}`);
	} else {
		for (const p of respellingProblems(e.say)) ctx.push(`${at}.say`, p);
	}
	if (typeof e.say === 'string') for (const p of dashProblems(e.say)) ctx.push(`${at}.say`, p);

	if (typeof e.level !== 'number' || !Number.isInteger(e.level) || !LEVELS.includes(e.level)) {
		ctx.push(`${at}.level`, `level is ${JSON.stringify(e.level)}; it is the integer key 1 to 4 (Commis, Chef de Partie, Sous Chef, Chef), never a string or a name`);
	}
	if (!KINDS.includes(e.kind)) ctx.push(`${at}.kind`, `kind ${JSON.stringify(e.kind)} is one of ${KINDS.join(', ')}`);
	proseWords(ctx, `${at}.summary`, e.summary, 'summary', WORDS.summary);
	proseWords(ctx, `${at}.guest`, e.guest, 'guest', WORDS.guest);
	if (typeof e.guest === 'string' && /°|\b\d+ ?[CF]\b/.test(e.guest)) ctx.push(`${at}.guest`, 'guest: no temperatures at the table; put them in the body');

	// sections
	if (!Array.isArray(e.sections) || e.sections.length < LIMITS.sections[0] || e.sections.length > LIMITS.sections[1]) {
		ctx.push(`${at}.sections`, `sections: ${LIMITS.sections[0]} to ${LIMITS.sections[1]} of { key, paras }`);
	}
	let body = 0;
	if (Array.isArray(e.sections)) {
		/** @type {Set<string>} */
		const seen = new Set();
		e.sections.forEach((/** @type {unknown} */ s, /** @type {number} */ i) => {
			const sat = `${at}.sections[${i}]`;
			if (!isObj(s)) {
				ctx.push(sat, 'a section is { key, paras }');
				return;
			}
			keysOnly(ctx, sat, s, ['key', 'paras'], 'a section');
			if (!SECTION_KEYS.includes(s.key)) ctx.push(sat, `key ${JSON.stringify(s.key)} is one of ${SECTION_KEYS.join(', ')}`);
			else if (seen.has(s.key)) ctx.push(sat, `the section "${s.key}" appears twice`);
			seen.add(s.key);
			if (i === 0 && s.key !== 'what') ctx.push(sat, 'the first section is "what"');
			if (!Array.isArray(s.paras) || !s.paras.length) {
				ctx.push(sat, 'paras: one or more paragraphs');
				return;
			}
			s.paras.forEach((/** @type {unknown} */ p, /** @type {number} */ j) => {
				if (!prose(ctx, `${sat}.paras[${j}]`, p, 'paragraph')) return;
				const n = words(p);
				body += n;
				if (n > WORDS.paragraph[1]) ctx.push(`${sat}.paras[${j}]`, `a paragraph of ${n} words; none runs past ${WORDS.paragraph[1]}`);
			});
		});
		if (!within(body, WORDS.body)) ctx.push(`${at}.sections`, `the body is ${body} words; the limits are ${WORDS.body[0]} to ${WORDS.body[1]}`);
	}

	// ratios, temperatures, faults
	/** @param {string} key @param {readonly string[]} fields @returns {Array<[Loose, string]>} */
	const list = (key, fields) => {
		const v = e[key];
		if (v === undefined) return [];
		if (!Array.isArray(v)) {
			ctx.push(`${at}.${key}`, `${key} is an array`);
			return [];
		}
		return v.map((/** @type {unknown} */ x, /** @type {number} */ i) => {
			const xat = `${at}.${key}[${i}]`;
			if (!isObj(x)) {
				ctx.push(xat, `each of ${key} is { ${fields.join(', ')} }`);
				return null;
			}
			keysOnly(ctx, xat, x, fields, `one of ${key}`);
			return /** @type {[Loose, string]} */ ([x, xat]);
		}).filter((/** @type {[Loose, string] | null} */ x) => x !== null);
	};
	for (const [r, rat] of list('ratios', ['label', 'value'])) {
		name(ctx, rat, r.label, 'label');
		prose(ctx, rat, r.value, 'value');
	}
	for (const [t, tat] of list('temps', ['label', 'c', 'f'])) {
		prose(ctx, tat, t.label, 'label');
		if (typeof t.c !== 'number' || !Number.isFinite(t.c) || typeof t.f !== 'number' || !Number.isFinite(t.f)) {
			ctx.push(tat, 'every Celsius figure carries its Fahrenheit: c and f are both numbers');
		} else {
			const want = (t.c * 9) / 5 + 32;
			if (Math.abs(want - t.f) > LIMITS.tempSlack) ctx.push(tat, `${t.c}°C is ${Math.round(want)}°F, not ${t.f}°F`);
		}
	}
	for (const [f, fat] of list('faults', ['fault', 'cause', 'fix'])) {
		for (const k of ['fault', 'cause', 'fix']) prose(ctx, fat, f[k], k);
	}

	// Brennan's links
	for (const [b, bat] of list('brennans', BRENNANS_KEYS)) {
		dishLink(ctx, bat, b, BRENNANS_KEYS);
		proseWords(ctx, bat, b.how, 'how', WORDS.brennansHow);
	}

	// cross references
	if (e.seeAlso !== undefined) {
		const sat = `${at}.seeAlso`;
		if (!isObj(e.seeAlso)) ctx.push(sat, `seeAlso is { ${SEE_ALSO_KEYS.join(', ')} }, every key an optional array`);
		else {
			keysOnly(ctx, sat, e.seeAlso, SEE_ALSO_KEYS, 'seeAlso');
			for (const k of SEE_ALSO_KEYS) {
				const v = e.seeAlso[k];
				if (v === undefined) continue;
				if (!Array.isArray(v)) {
					ctx.push(`${sat}.${k}`, `${k} is an array`);
					continue;
				}
				if (new Set(v).size !== v.length) ctx.push(`${sat}.${k}`, `${k} repeats a reference`);
				if (k === 'terms' && v.length > LIMITS.sheetTerms) ctx.push(`${sat}.${k}`, `${v.length} sheet terms; at most ${LIMITS.sheetTerms}, the ones the entry teaches or rests on`);
				for (const ref of v) {
					const where = `${sat}.${k}`;
					if (typeof ref !== 'string') {
						ctx.push(where, `${JSON.stringify(ref)} is not a string`);
						continue;
					}
					if (k === 'entries') {
						if (ref === e.slug) ctx.push(where, 'an entry does not see itself');
						else if (!cuisineResolves(ctx, ref)) ctx.push(where, unresolved(ctx, ref));
					} else if (k === 'components') {
						if (!ctx.refs.components.has(ref)) ctx.push(where, `"${ref}" is not a component of the Brennan's pack (exact name)`);
					} else if (k === 'terms') {
						if (!ctx.refs.foundations.has(ref)) ctx.push(where, `"${ref}" is not a term of your culinary sheets (an entry id in ${REF_SOURCES.terms})`);
					} else {
						const set = /** @type {Map<string, string>} */ (ctx.refs[/** @type {'techniques'} */ (k)]);
						if (!set.has(ref)) ctx.push(where, `"${ref}" is not in ${k} (${REF_SOURCES[k]})`);
					}
				}
			}
		}
	}

	// the quote, public domain only; it keeps its own spelling but not a dash
	if (e.quote !== undefined) {
		const qat = `${at}.quote`;
		if (!isObj(e.quote)) ctx.push(qat, 'quote is { text, source, year }');
		else {
			keysOnly(ctx, qat, e.quote, ['text', 'source', 'year'], 'a quote');
			if (!isStr(e.quote.text)) ctx.push(qat, 'text is a non-empty string');
			else {
				const n = words(e.quote.text);
				if (n > WORDS.quote[1]) ctx.push(qat, `the quote is ${n} words; at most ${WORDS.quote[1]}`);
				for (const p of dashProblems(e.quote.text)) ctx.push(qat, `text: ${p}`);
				if (NUMERAL_RE.test(e.quote.text)) ctx.push(qat, 'text: a level by its number');
			}
			if (!isStr(e.quote.source) || !QUOTE_SOURCES.some((re) => re.test(e.quote.source))) {
				ctx.push(qat, `source ${JSON.stringify(e.quote.source)}: a quote comes only from a public domain text (Escoffier, Hearn, the Picayune)`);
			} else for (const p of dashProblems(e.quote.source)) ctx.push(qat, `source: ${p}`);
			if (typeof e.quote.year !== 'number' || !Number.isInteger(e.quote.year) || e.quote.year > LIMITS.quoteYear) {
				ctx.push(qat, `year ${JSON.stringify(e.quote.year)}: an integer, ${LIMITS.quoteYear} or earlier`);
			}
		}
	}

	// sources
	const strict = e.kind === 'history' || chapter === SAFETY_CHAPTER;
	const need = strict ? LIMITS.sourcesStrict : LIMITS.sources;
	if (!Array.isArray(e.sources) || e.sources.length < need) {
		ctx.push(`${at}.sources`, `at least ${need} source(s)${strict ? (chapter === SAFETY_CHAPTER ? ' in the safety chapter' : ' for a history entry') : ''}`);
	}
	/** @type {string[]} */
	const evidence = [];
	for (const [s, sat] of list('sources', SOURCE_KEYS)) {
		if (!isStr(s.title)) ctx.push(sat, 'title is a non-empty string');
		else for (const p of dashProblems(s.title)) ctx.push(sat, `title: ${p}`);
		let url = null;
		try {
			url = typeof s.url === 'string' ? new URL(s.url) : null;
		} catch {
			url = null;
		}
		if (!url || url.protocol !== 'https:') ctx.push(sat, `url ${JSON.stringify(s.url)} is a full https address`);
		else for (const p of dashProblems(s.url)) ctx.push(sat, `url: ${p}`);
		if (s.asOf !== undefined) {
			const d = typeof s.asOf === 'string' && DATE_RE.test(s.asOf) ? new Date(`${s.asOf}T00:00:00Z`) : null;
			if (!d || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s.asOf) ctx.push(sat, `asOf ${JSON.stringify(s.asOf)} is a real date, YYYY-MM-DD`);
			else if (s.asOf > ctx.opts.today) ctx.push(sat, `asOf ${s.asOf} is after the build date ${ctx.opts.today}`);
		}
		if (s.year !== undefined && (typeof s.year !== 'number' || !Number.isInteger(s.year) || s.year < 1500 || s.year > Number(ctx.opts.today.slice(0, 4)))) {
			ctx.push(sat, `year ${JSON.stringify(s.year)} is an integer, not in the future`);
		}
		if (s.evidence !== undefined) {
			if (!isStr(s.evidence)) ctx.push(sat, 'evidence is a non-empty string, the source\'s own words');
			else {
				for (const p of dashProblems(s.evidence)) ctx.push(sat, `evidence: ${p}`);
				evidence.push(s.evidence);
			}
		}
	}
	if (chapter === SAFETY_CHAPTER) {
		const tokens = new Set(evidence.join(' ').match(/\d+(?:\.\d+)?/g) ?? []);
		for (const f of safetyFigures(e)) {
			if (!tokens.has(f)) ctx.push(`${at}.sources`, `the figure ${f} stands in no source's evidence: every temperature and time in a safety entry is quoted in a source`);
		}
	}

	// cards
	/** @type {Set<string>} */
	const cardStems = new Set();
	if (!Array.isArray(e.cards) || !within(e.cards.length, LIMITS.cards)) ctx.push(`${at}.cards`, `${LIMITS.cards[0]} to ${LIMITS.cards[1]} cards`);
	for (const [c, cat] of list('cards', CARD_KEYS)) {
		if (typeof c.stem !== 'string' || !SLUG_RE.test(c.stem)) ctx.push(cat, `stem ${JSON.stringify(c.stem)} is a slug`);
		else if (cardStems.has(c.stem)) ctx.push(cat, `the card stem "${c.stem}" is used twice in this entry`);
		else cardStems.add(c.stem);
		proseWords(ctx, cat, c.front, 'front', WORDS.cardFront);
		proseWords(ctx, cat, c.back, 'back', WORDS.cardBack);
	}

	// questions
	/** @type {Set<string>} */
	const qStems = new Set();
	if (!Array.isArray(e.questions) || !within(e.questions.length, LIMITS.questions)) ctx.push(`${at}.questions`, `${LIMITS.questions[0]} to ${LIMITS.questions[1]} questions`);
	for (const [q, qat] of list('questions', QUESTION_KEYS)) {
		if (typeof q.stem !== 'string' || !SLUG_RE.test(q.stem)) ctx.push(qat, `stem ${JSON.stringify(q.stem)} is a slug`);
		else if (qStems.has(q.stem)) ctx.push(qat, `the question stem "${q.stem}" is used twice in this entry`);
		else qStems.add(q.stem);
		proseWords(ctx, qat, q.q, 'q', WORDS.question);
		prose(ctx, qat, q.answer, 'answer');
		proseWords(ctx, qat, q.why, 'why', WORDS.why);
		if (!Array.isArray(q.distractors) || q.distractors.length !== LIMITS.distractors) {
			ctx.push(qat, `distractors: exactly ${LIMITS.distractors}`);
		} else {
			q.distractors.forEach((/** @type {unknown} */ d, /** @type {number} */ i) => prose(ctx, qat, d, `distractors[${i}]`));
			const folded = q.distractors.map(foldOption);
			if (new Set(folded).size !== folded.length) ctx.push(qat, 'two distractors are the same once case and accents are folded');
			if (typeof q.answer === 'string' && folded.includes(foldOption(q.answer))) ctx.push(qat, 'a distractor is the answer');
			const options = [q.answer, ...q.distractors].filter((x) => typeof x === 'string');
			if (options.some((o) => ABOVE_RE.test(o))) ctx.push(qat, 'no "all of the above" or "none of the above"');
			if (typeof q.answer === 'string' && q.distractors.every((/** @type {unknown} */ d) => typeof d === 'string')) {
				const longest = Math.max(...q.distractors.map((/** @type {string} */ d) => [...d].length));
				const len = [...q.answer].length;
				if (len > LIMITS.answerRatio * longest) {
					ctx.push(qat, `the answer is ${len} characters against a longest distractor of ${longest}: the longest option is a tell past ${LIMITS.answerRatio} times`);
				}
			}
		}
		if (typeof q.teaches !== 'string' || !cardStems.has(q.teaches)) ctx.push(qat, `teaches ${JSON.stringify(q.teaches)} is the stem of a card in this entry`);
	}

	// no dash anywhere, whatever the field
	dashWalk(e, at, ctx);
}

/**
 * The dash rule over every string of a value, whatever its field, skipping a
 * string whose dash a field check has already reported.
 *
 * @param {unknown} v @param {string} at @param {Ctx} ctx
 */
function dashWalk(v, at, ctx) {
	const seen = ctx.dashed();
	walkStrings(v, at, (p, s) => {
		if (!DASH_RE.test(s)) return;
		if (seen.some((d) => p === d || p.startsWith(`${d}.`) || p.startsWith(`${d}[`))) return;
		ctx.push(p, 'a dash (em dash, en dash, their entities or a double hyphen): use a comma, a colon or a full stop');
	});
}

/** Where each reference set comes from, for the messages. */
/** @type {Record<string, string>} */
const REF_SOURCES = {
	entries: 'Cuisine entries',
	techniques: 'src/lib/data/techniques.json',
	lexicon: 'src/lib/data/lexicon.json',
	recipes: 'src/lib/data/recipes.index.json',
	kitchen: 'src/lib/data/kitchen.index.json',
	plates: 'src/lib/data/plates.json',
	folios: 'TEACHING_FOLIOS in src/lib/teaching-folios.ts',
	deck: 'src/lib/data/floor-deck.index.json',
	components: "the Brennan's pack",
	terms: 'src/lib/data/culinary-foundations.json'
};

/** @param {unknown} v @param {string} at @param {(path: string, s: string) => void} visit */
function walkStrings(v, at, visit) {
	if (typeof v === 'string') visit(at, v);
	else if (Array.isArray(v)) v.forEach((x, i) => walkStrings(x, `${at}[${i}]`, visit));
	else if (isObj(v)) for (const [k, x] of Object.entries(v)) walkStrings(x, `${at}.${k}`, visit);
}

/**
 * The tree's nodes, flattened: name and adds folded to the node, with its
 * ancestors, for the agreement rule.
 *
 * @typedef {{ name: string, adds?: string, entry?: string, path: string, ancestors: string[], node: Loose }} TreeNode
 * A mother may leave out its name when it links an entry: the entry's title
 * names it (`titles`, slug to title).
 *
 * @param {Loose | null} tree
 * @param {Map<string, string>} [titles]
 * @returns {TreeNode[]}
 */
export function treeNodes(tree, titles = new Map()) {
	/** @type {TreeNode[]} */
	const out = [];
	if (!isObj(tree) || !Array.isArray(tree.mothers)) return out;
	/** @param {Loose} node @param {string} path @param {string[]} ancestors @param {string | undefined} label */
	const visit = (node, path, ancestors, label) => {
		if (!isObj(node) || !isStr(label)) return;
		out.push({ name: label, adds: isStr(node.adds) ? node.adds : undefined, entry: isStr(node.entry) ? node.entry : undefined, path, ancestors, node });
		if (Array.isArray(node.children)) node.children.forEach((c, i) => visit(c, `${path}/children[${i}] ${c?.name ?? ''}`.trim(), [...ancestors, label], c?.name));
	};
	tree.mothers.forEach((m, i) => {
		const label = motherName(m, titles);
		visit(m, `tree/mothers[${i}] ${label ?? ''}`.trim(), [], label);
	});
	return out;
}

/** A mother's name: its own, or its entry's title. @param {unknown} m @param {Map<string, string>} titles */
export function motherName(m, titles) {
	if (!isObj(m)) return undefined;
	if (isStr(m.name)) return m.name;
	return isStr(m.entry) ? titles.get(m.entry) : undefined;
}

/** @param {Ctx} ctx @param {string} at @param {Loose} node @param {string | undefined} label */
function nodeSay(ctx, at, node, label) {
	const pack = packSay(ctx.refs, label);
	if (node.say !== undefined) {
		if (pack) {
			if (node.say !== pack.say) ctx.push(at, `the Brennan's pack carries "${pack.term}" with the respelling ${JSON.stringify(pack.say)}; say must be exactly that`);
		} else for (const p of respellingProblems(node.say)) ctx.push(at, `say: ${p}`);
	} else if (pack && isRespelling(pack.say)) {
		ctx.push(at, `the Brennan's pack carries "${pack.term}" as ${JSON.stringify(pack.say)}; the node carries that say`);
	}
}

/** @param {unknown} tree @param {Ctx} ctx */
export function checkTree(tree, ctx) {
	const at = 'tree';
	if (!isObj(tree)) {
		ctx.push(at, 'tree.json is { careme: { four, note }, mothers: [...] }');
		return;
	}
	keysOnly(ctx, at, tree, ['careme', 'mothers'], 'the tree');
	if (!isObj(tree.careme)) ctx.push(`${at}/careme`, 'careme is { four, note }');
	else {
		keysOnly(ctx, `${at}/careme`, tree.careme, ['four', 'note'], 'careme');
		if (!Array.isArray(tree.careme.four) || tree.careme.four.length !== 4) ctx.push(`${at}/careme`, "four: Carême's four sauces, exactly four names");
		else tree.careme.four.forEach((/** @type {unknown} */ n, /** @type {number} */ i) => name(ctx, `${at}/careme`, n, `four[${i}]`));
		proseWords(ctx, `${at}/careme`, tree.careme.note, 'note', WORDS.careNote);
	}
	if (!Array.isArray(tree.mothers) || tree.mothers.length !== LIMITS.mothers) {
		ctx.push(`${at}/mothers`, `mothers: the ${LIMITS.mothers} mother sauces`);
		if (!Array.isArray(tree.mothers)) return;
	}
	/** @type {Map<string, string>} */
	const names = new Map();
	/** @param {unknown} node @param {string} nat @param {boolean} mother */
	const visit = (node, nat, mother) => {
		if (!isObj(node)) {
			ctx.push(nat, 'a node is an object');
			return;
		}
		keysOnly(ctx, nat, node, mother ? MOTHER_KEYS : CHILD_KEYS, mother ? 'a mother' : 'a node');
		const label = mother ? motherName(node, ctx.titles) : node.name;
		if (mother && node.name === undefined) {
			if (node.entry === undefined) ctx.push(nat, 'a mother carries its name, or links the entry whose title names it');
		} else name(ctx, nat, node.name, 'name');
		if (isStr(label)) {
			const f = fold(label);
			if (names.has(f)) ctx.push(nat, `the name "${label}" is also ${names.get(f)}: a node appears once in the tree`);
			else names.set(f, nat);
		}
		nodeSay(ctx, nat, node, label);
		if (node.entry !== undefined && !cuisineResolves(ctx, node.entry)) ctx.push(nat, `entry: ${unresolved(ctx, String(node.entry))}`);
		if (mother) {
			prose(ctx, nat, node.liaison, 'liaison');
			prose(ctx, nat, node.liquid, 'liquid');
			if (ctx.opts.complete && node.entry === undefined) ctx.push(nat, 'CUISINE_COMPLETE: every mother links its entry');
			if (!Array.isArray(node.children) || node.children.length < LIMITS.motherChildren) ctx.push(nat, `a mother has at least ${LIMITS.motherChildren} children`);
		} else {
			proseWords(ctx, nat, node.adds, 'adds', WORDS.adds);
			if (node.dishes !== undefined) {
				if (!Array.isArray(node.dishes) || !node.dishes.length) ctx.push(nat, 'dishes: a non-empty array of { dish, components }, or absent');
				else node.dishes.forEach((/** @type {unknown} */ d, /** @type {number} */ i) => dishLink(ctx, `${nat}.dishes[${i}]`, d, DISH_LINK_KEYS));
			}
			if (node.children !== undefined && (!Array.isArray(node.children) || !node.children.length)) ctx.push(nat, 'children: a non-empty array, or absent');
		}
		if (Array.isArray(node.children)) node.children.forEach((c, i) => visit(c, `${nat}/children[${i}] ${isObj(c) && typeof c.name === 'string' ? c.name : ''}`.trim(), false));
	};
	tree.mothers.forEach((m, i) => visit(m, `${at}/mothers[${i}] ${motherName(m, ctx.titles) ?? ''}`.trim(), true));
}

/** @param {unknown} ladder @param {Ctx} ctx */
export function checkLadder(ladder, ctx) {
	const at = 'ladder';
	if (!isObj(ladder) || !Array.isArray(ladder.rungs)) {
		ctx.push(at, 'ladder.json is { rungs: [...] }');
		return;
	}
	keysOnly(ctx, at, ladder, ['rungs'], 'the ladder');
	if (!within(ladder.rungs.length, LIMITS.rungs)) ctx.push(at, `${LIMITS.rungs[0]} to ${LIMITS.rungs[1]} rungs`);
	/** @type {Set<string>} */
	const keys = new Set();
	/** @type {Set<string>} */
	const rungNames = new Set();
	let last = -1;
	ladder.rungs.forEach((/** @type {unknown} */ r, /** @type {number} */ i) => {
		const rat = `${at}/rungs[${i}] ${isObj(r) && typeof r.key === 'string' ? r.key : ''}`.trim();
		if (!isObj(r)) {
			ctx.push(rat, 'a rung is an object');
			return;
		}
		keysOnly(ctx, rat, r, RUNG_KEYS, 'a rung');
		if (typeof r.key !== 'string' || !SLUG_RE.test(r.key)) ctx.push(rat, 'key is a slug');
		else if (keys.has(r.key)) ctx.push(rat, `the key "${r.key}" is used twice`);
		else keys.add(r.key);
		if (name(ctx, rat, r.name, 'name')) {
			if (rungNames.has(fold(r.name))) ctx.push(rat, `the name "${r.name}" is used twice`);
			rungNames.add(fold(r.name));
		}
		const m = r.minutes;
		const lo = Number.isInteger(m) ? m : Array.isArray(m) ? m[0] : NaN;
		const hi = Number.isInteger(m) ? m : Array.isArray(m) ? m[1] : NaN;
		if (!Number.isInteger(lo) || !Number.isInteger(hi) || lo < 0 || hi < lo || hi > 240 || (Array.isArray(m) && m.length !== 2)) {
			ctx.push(rat, 'minutes is a whole number, or [low, high] whole numbers, over moderate heat');
		} else {
			if (lo < last) ctx.push(rat, 'the rungs run from pale to dark, so their minutes never fall');
			last = lo;
		}
		for (const k of ['cue', 'smell', 'thickening']) proseWords(ctx, rat, r[k], k, WORDS.rungLine);
		if (!Array.isArray(r.uses)) ctx.push(rat, 'uses: an array of Cuisine entry slugs (empty until they are written)');
		else for (const u of r.uses) if (!cuisineResolves(ctx, u)) ctx.push(`${rat}.uses`, unresolved(ctx, String(u)));
		if (!Array.isArray(r.dishes)) ctx.push(rat, 'dishes: an array of { dish, components } (it may be empty)');
		else r.dishes.forEach((/** @type {unknown} */ d, /** @type {number} */ j) => dishLink(ctx, `${rat}.dishes[${j}]`, d, DISH_LINK_KEYS));
	});
}

/**
 * Does an authored pair agree with the tree and the ladder? Both sides are
 * resolved to tree nodes (by name or by what the node adds) and to ladder
 * rungs (by name) and dishes; a pair joining two nodes must join a node to
 * itself (its name to its adds) or to an ancestor, and a pair joining a rung
 * to a dish must name a dish the rung lists.
 *
 * @param {string} l @param {string} r
 * @param {{ tree: Loose | null, ladder: Loose | null, refs: Refs, titles?: Map<string, string> }} data
 * @returns {string | null}
 */
export function pairDisagrees(l, r, data) {
	const nodes = treeNodes(data.tree, data.titles);
	/** @param {string} s */
	const node = (s) => nodes.find((n) => fold(n.name) === fold(s) || (n.adds !== undefined && fold(n.adds) === fold(s)));
	const a = node(l);
	const b = node(r);
	if (a && b && a !== b) {
		const related = a.ancestors.some((x) => fold(x) === fold(b.name)) || b.ancestors.some((x) => fold(x) === fold(a.name));
		if (!related) return `"${l}" and "${r}" are not of one family in tree.json`;
	}
	const rungs = isObj(data.ladder) && Array.isArray(data.ladder.rungs) ? data.ladder.rungs.filter(isObj) : [];
	/** @param {string} s */
	const rung = (s) => rungs.find((x) => isStr(x.name) && fold(x.name) === fold(s));
	/** @param {string} s */
	const dishId = (s) => [...data.refs.dishes].find(([, n]) => fold(n) === fold(s))?.[0];
	for (const [x, y] of [[l, r], [r, l]]) {
		const g = rung(x);
		const d = dishId(y);
		if (g && d && !(Array.isArray(g.dishes) ? g.dishes : []).some((/** @type {Loose} */ k) => k?.dish === d)) {
			return `ladder.json does not put "${y}" on the "${g.name}" rung`;
		}
	}
	return null;
}

/** @param {unknown} m @param {string} at @param {Ctx} ctx @param {{ tree: Loose | null, ladder: Loose | null }} data @param {boolean} [generated] */
export function checkMatch(m, at, ctx, data, generated = false) {
	if (!isObj(m)) {
		ctx.push(at, 'a match is { stem, title, prompt, left, right, pairs }');
		return;
	}
	keysOnly(ctx, at, m, generated ? [...MATCH_KEYS, 'chapter', 'from'] : MATCH_KEYS, 'a match');
	if (typeof m.stem !== 'string' || !SLUG_RE.test(m.stem)) ctx.push(at, 'stem is a slug');
	name(ctx, at, m.title, 'title');
	proseWords(ctx, at, m.prompt, 'prompt', WORDS.prompt);
	name(ctx, at, m.left, 'left');
	name(ctx, at, m.right, 'right');
	if (!Array.isArray(m.pairs) || !within(m.pairs.length, LIMITS.pairs)) {
		ctx.push(at, `pairs: ${LIMITS.pairs[0]} to ${LIMITS.pairs[1]} of [left, right] or [left, right, entry]`);
		if (!Array.isArray(m.pairs)) return;
	}
	/** @type {Set<string>} */
	const ls = new Set();
	/** @type {Set<string>} */
	const rs = new Set();
	m.pairs.forEach((/** @type {unknown} */ p, /** @type {number} */ i) => {
		const pat = `${at}.pairs[${i}]`;
		if (!Array.isArray(p) || p.length < 2 || p.length > 3) {
			ctx.push(pat, 'a pair is [left, right] or [left, right, entry slug]');
			return;
		}
		const [l, r, entry] = p;
		if (name(ctx, pat, l, 'left')) {
			if (ls.has(foldOption(l))) ctx.push(pat, `"${l}" is on the left twice: pairs are one to one`);
			ls.add(foldOption(l));
		}
		if (name(ctx, pat, r, 'right')) {
			if (rs.has(foldOption(r))) ctx.push(pat, `"${r}" is on the right twice: pairs are one to one`);
			rs.add(foldOption(r));
		}
		if (entry !== undefined && !cuisineResolves(ctx, entry)) ctx.push(pat, `entry: ${unresolved(ctx, String(entry))}`);
		if (typeof l === 'string' && typeof r === 'string') {
			const bad = pairDisagrees(l, r, { ...data, refs: ctx.refs, titles: ctx.titles });
			if (bad) ctx.push(pat, bad);
		}
	});
}

/** @param {unknown} s @param {string} at @param {Ctx} ctx */
export function checkSteps(s, at, ctx) {
	if (!isObj(s)) {
		ctx.push(at, 'a steps set is { stem, entry, title, prompt, steps, distractor?, why }');
		return;
	}
	keysOnly(ctx, at, s, STEPS_KEYS, 'a steps set');
	if (typeof s.stem !== 'string' || !SLUG_RE.test(s.stem)) ctx.push(at, 'stem is a slug');
	if (!cuisineResolves(ctx, s.entry)) ctx.push(at, `entry: ${unresolved(ctx, String(s.entry))}`);
	name(ctx, at, s.title, 'title');
	proseWords(ctx, at, s.prompt, 'prompt', WORDS.prompt);
	proseWords(ctx, at, s.why, 'why', WORDS.stepsWhy);
	if (!Array.isArray(s.steps) || !within(s.steps.length, LIMITS.steps)) {
		ctx.push(at, `steps: ${LIMITS.steps[0]} to ${LIMITS.steps[1]} stages, in the right order`);
	}
	const list = Array.isArray(s.steps) ? s.steps : [];
	list.forEach((/** @type {unknown} */ x, /** @type {number} */ i) => prose(ctx, `${at}.steps[${i}]`, x, 'step'));
	const folded = list.map(foldOption);
	if (new Set(folded).size !== folded.length) ctx.push(at, 'two stages are the same once case and accents are folded');
	if (s.distractor !== undefined) {
		if (Array.isArray(s.distractor)) ctx.push(at, 'distractor is ONE string: at most one stage that does not belong');
		else if (prose(ctx, at, s.distractor, 'distractor') && folded.includes(foldOption(s.distractor))) ctx.push(at, 'the distractor is one of the stages');
	}
}

/**
 * The three generated match sets. Each is a one to one set that a reader can
 * only get right one way, or it is skipped until the data can field four
 * pairs.
 *
 * @param {CuisineSet} set
 * @param {Refs} refs
 * @returns {{ made: GeneratedMatch[], skipped: Array<{ stem: string, pairs: number }> }}
 */
export function generateMatches(set, refs) {
	/** @type {GeneratedMatch[]} */
	const made = [];
	/** @type {Array<{ stem: string, pairs: number }>} */
	const skipped = [];
	const entries = allEntries(set);
	const bySlug = new Map(entries.map(({ e }) => [e.slug, e]));
	const titles = entryTitles(set);
	const max = LIMITS.pairs[1];

	for (const g of GENERATED) {
		/** @type {Array<[string, string] | [string, string, string]>} */
		let pairs = [];
		if (g.from === 'tree') {
			for (const m of isObj(set.tree) && Array.isArray(set.tree.mothers) ? set.tree.mothers : []) {
				const mName = motherName(m, titles);
				if (!isObj(m) || !isStr(mName) || !Array.isArray(m.children)) continue;
				const kids = m.children.filter((/** @type {unknown} */ c) => isObj(c) && isStr(c.name));
				const pick = kids.find((/** @type {Loose} */ c) => isStr(c.entry) && bySlug.has(c.entry)) ?? kids[0];
				if (!pick) continue;
				const entry = isStr(pick.entry) && bySlug.has(pick.entry) ? pick.entry : isStr(m.entry) && bySlug.has(m.entry) ? m.entry : undefined;
				pairs.push(entry ? [pick.name, mName, entry] : [pick.name, mName]);
			}
		} else if (g.from === 'ladder') {
			const rungs = isObj(set.ladder) && Array.isArray(set.ladder.rungs) ? set.ladder.rungs.filter(isObj) : [];
			/** @type {Array<Array<{ label: string, entry?: string }>>} */
			const cands = rungs.map((r) => [
				...(Array.isArray(r.dishes) ? r.dishes : []).map((/** @type {Loose} */ d) => ({ label: refs.dishes.get(d?.dish) ?? '' })),
				...(Array.isArray(r.uses) ? r.uses : []).filter((/** @type {string} */ u) => bySlug.has(u)).map((/** @type {string} */ u) => ({ label: String(bySlug.get(u)?.title), entry: u }))
			].filter((c) => c.label));
			/** @type {Map<string, number>} */
			const seen = new Map();
			for (const list of cands) for (const f of new Set(list.map((c) => fold(c.label)))) seen.set(f, (seen.get(f) ?? 0) + 1);
			rungs.forEach((r, i) => {
				const pick = cands[i].find((c) => seen.get(fold(c.label)) === 1);
				if (pick && isStr(r.name)) pairs.push(pick.entry ? [r.name, pick.label, pick.entry] : [r.name, pick.label]);
			});
		} else {
			pairs = brennansPairs(set, refs, entries, titles);
		}
		pairs = pairs.slice(0, max);
		if (pairs.length >= LIMITS.pairs[0]) made.push({ stem: g.stem, chapter: g.chapter, from: g.from, title: g.title, prompt: g.prompt, left: g.left, right: g.right, pairs });
		else skipped.push({ stem: g.stem, pairs: pairs.length });
	}
	return { made, skipped };
}

/**
 * Brennan's dish to sauce: the largest set of pairs in which every chosen dish
 * carries exactly one of the chosen sauces, by every link the data and the
 * pack know (an entry's brennans field, a tree node's dishes, and each pack
 * component of a sauce's name), so no pair can be swapped and still be true.
 *
 * @param {CuisineSet} set @param {Refs} refs @param {Array<{ e: Loose, chapter: string }>} entries @param {Map<string, string>} titles
 * @returns {Array<[string, string] | [string, string, string]>}
 */
function brennansPairs(set, refs, entries, titles) {
	/** @type {Map<string, { name: string, entry?: string, dishes: string[] }>} */
	const sauces = new Map();
	/** @param {string} n @param {string | undefined} entry @param {unknown} links */
	const add = (n, entry, links) => {
		const k = foldSauce(n);
		const row = sauces.get(k) ?? { name: n, entry, dishes: [] };
		if (!row.entry && entry) row.entry = entry;
		for (const l of Array.isArray(links) ? links : []) if (isObj(l) && refs.dishes.has(l.dish) && !row.dishes.includes(l.dish)) row.dishes.push(l.dish);
		sauces.set(k, row);
	};
	for (const { e } of entries) if ((e.kind === 'sauce' || e.kind === 'emulsion') && Array.isArray(e.brennans) && e.brennans.length) add(e.title, e.slug, e.brennans);
	for (const n of treeNodes(set.tree, titles)) if (Array.isArray(n.node.dishes) && n.node.dishes.length) add(n.name, n.entry, n.node.dishes);
	/** @type {Map<string, Set<string>>} dish -> the sauce keys it carries */
	const carries = new Map();
	/** @param {string} dish @param {string} k */
	const link = (dish, k) => {
		const s = carries.get(dish) ?? new Set();
		s.add(k);
		carries.set(dish, s);
	};
	for (const [k, row] of sauces) for (const d of row.dishes) link(d, k);
	for (const c of refs.components.values()) {
		const k = foldSauce(c.name);
		if (sauces.has(k)) for (const id of c.itemIds) if (refs.dishes.has(id)) link(id, k);
	}
	/* A dish that carries a daughter of a sauce is the daughter's: the Sardou's
	   béarnaise is Choron, so the Sardou is never offered as béarnaise. */
	/** @type {Map<string, Set<string>>} sauce key -> the keys of its descendants in the tree */
	const descendants = new Map();
	for (const n of treeNodes(set.tree, titles)) {
		for (const a of n.ancestors) {
			const s = descendants.get(foldSauce(a)) ?? new Set();
			s.add(foldSauce(n.name));
			descendants.set(foldSauce(a), s);
		}
	}
	const keys = [...sauces.keys()];
	const order = [...refs.dishes.keys()];
	/** @type {Array<[string, string]>} */
	let best = [];
	let budget = 200000;
	/** @param {number} i @param {Array<[string, string]>} chosen */
	const dfs = (i, chosen) => {
		if (budget-- <= 0) return;
		if (chosen.length > best.length) best = chosen.slice();
		if (best.length >= LIMITS.pairs[1] || i >= keys.length || chosen.length + (keys.length - i) <= best.length) return;
		const k = keys[i];
		const row = /** @type {{ dishes: string[] }} */ (sauces.get(k));
		const chosenKeys = new Set([...chosen.map(([, s]) => s), k]);
		const dishes = row.dishes.slice().sort((a, b) => order.indexOf(a) - order.indexOf(b));
		for (const d of dishes) {
			if (chosen.some(([x]) => x === d)) continue;
			const mine = carries.get(d) ?? new Set();
			if ([...mine].some((s) => descendants.get(k)?.has(s))) continue;
			if ([...mine].some((s) => s !== k && chosenKeys.has(s))) continue;
			if (chosen.some(([x]) => (carries.get(x) ?? new Set()).has(k))) continue;
			chosen.push([d, k]);
			dfs(i + 1, chosen);
			chosen.pop();
			if (best.length >= LIMITS.pairs[1]) return;
		}
		dfs(i + 1, chosen);
	};
	dfs(0, []);
	return best.map(([d, k]) => {
		const row = /** @type {{ name: string, entry?: string }} */ (sauces.get(k));
		const dish = /** @type {string} */ (refs.dishes.get(d));
		return row.entry ? [dish, row.name, row.entry] : [dish, row.name];
	});
}

/**
 * Every entry of the set in chapter order, with its chapter.
 *
 * @param {CuisineSet} set
 * @returns {Array<{ e: Loose, chapter: string, i: number }>}
 */
export function allEntries(set) {
	/** @type {Array<{ e: Loose, chapter: string, i: number }>} */
	const out = [];
	for (const m of set.meta) {
		const file = set.files.get(m.key);
		if (!file || !Array.isArray(file.entries)) continue;
		file.entries.forEach((e, i) => {
			if (isObj(e)) out.push({ e, chapter: m.key, i });
		});
	}
	return out;
}

/**
 * Every written entry's title by slug.
 *
 * @param {CuisineSet} set
 * @returns {Map<string, string>}
 */
export function entryTitles(set) {
	return new Map(allEntries(set).filter(({ e }) => isStr(e.slug) && isStr(e.title)).map(({ e }) => [e.slug, e.title]));
}

/**
 * The chapters' declaration: the twelve keys, each once, titled, with a
 * two-sentence intro.
 *
 * @param {unknown} meta
 * @param {Ctx} ctx
 */
export function checkChapters(meta, ctx) {
	const at = 'chapters.json';
	if (!Array.isArray(meta)) {
		ctx.push(at, 'chapters.json is { chapters: [{ key, title, intro }] }');
		return;
	}
	const keys = meta.map((m) => (isObj(m) ? m.key : undefined));
	const missing = CHAPTER_KEYS.filter((k) => !keys.includes(k));
	const extra = keys.filter((k) => !CHAPTER_KEYS.includes(k));
	if (missing.length) ctx.push(at, `missing chapter(s): ${missing.join(', ')}`);
	if (extra.length) ctx.push(at, `unknown chapter(s): ${extra.map((k) => JSON.stringify(k)).join(', ')}`);
	if (new Set(keys).size !== keys.length) ctx.push(at, 'a chapter key appears twice');
	meta.forEach((m, i) => {
		const mat = `${at}/${isObj(m) ? m.key : i}`;
		if (!isObj(m)) {
			ctx.push(mat, 'a chapter is { key, title, intro }');
			return;
		}
		keysOnly(ctx, mat, m, ['key', 'title', 'intro'], 'a chapter');
		name(ctx, mat, m.title, 'title');
		proseWords(ctx, mat, m.intro, 'intro', WORDS.intro);
		if (typeof m.intro === 'string') {
			const n = sentencesOf(m.intro).length;
			if (n !== LIMITS.introSentences) ctx.push(mat, `intro is ${n} sentence(s); it is exactly ${LIMITS.introSentences}`);
		}
	});
}

/**
 * The whole set: chapters, entries, steps, matches, the tree and the ladder,
 * and the rules that need everything at once.
 *
 * @param {CuisineSet} set
 * @param {Refs} refs
 * @param {CheckOptions} [options]
 * @returns {{ problems: Problem[], generated: ReturnType<typeof generateMatches> }}
 */
export function checkSet(set, refs, options = {}) {
	/** @type {Problem[]} */
	const problems = [];
	const opts = {
		draft: !!options.draft,
		complete: options.complete ?? CUISINE_COMPLETE,
		today: options.today ?? new Date().toISOString().slice(0, 10)
	};
	const entries = allEntries(set);
	const slugs = new Set(entries.map(({ e }) => e.slug).filter((s) => typeof s === 'string'));
	const planned = new Set((refs.roster ?? []).flatMap((r) => [r.slug, r.stem]).filter((s) => typeof s === 'string'));
	/** @type {Ctx} */
	const ctx = {
		refs,
		opts,
		ok: [...SPELLING_OK, ...refs.names].sort((a, b) => b.length - a.length),
		slugs,
		planned,
		push: (path, message) => problems.push({ path, message }),
		dashed: () => problems.filter((p) => p.message.includes('a dash')).map((p) => p.path),
		titles: new Map([...(opts.draft ? (refs.roster ?? []).map((r) => /** @type {[string, string]} */ ([r.slug, r.title])) : []), ...entryTitles(set)])
	};

	if (opts.draft && opts.complete) ctx.push('set', 'CUISINE_COMPLETE is true: draft mode is refused, every reference resolves to a written entry');
	if (opts.draft && refs.roster === null) ctx.push('set', 'draft mode needs tools/cuisine/roster.json, which does not exist yet: without it no planned slug can be accepted');

	checkChapters(set.meta, ctx);
	const metaKeys = new Set(set.meta.map((m) => m.key));

	// files
	for (const [key, file] of set.files) {
		const at = key;
		if (!metaKeys.has(key)) ctx.push(at, `the chapter "${key}" is not declared in chapters.json`);
		if (!isObj(file)) {
			ctx.push(at, 'a chapter file is { key, title, intro, entries, steps, match }');
			continue;
		}
		keysOnly(ctx, at, file, CHAPTER_FILE_KEYS, 'a chapter file');
		const meta = set.meta.find((m) => m.key === key);
		if (file.key !== key) ctx.push(at, `key ${JSON.stringify(file.key)} differs from the file's chapter "${key}"`);
		if (meta && (file.title !== meta.title || file.intro !== meta.intro)) ctx.push(at, 'title and intro are copied from chapters.json; run tools/cuisine/merge.mjs to refresh them');
		if (!Array.isArray(file.entries)) ctx.push(at, 'entries is an array');
		for (const k of ['steps', 'match']) if (file[k] !== undefined && !Array.isArray(file[k])) ctx.push(at, `${k} is an array`);
	}

	// identity across the set
	/** @type {Map<string, string>} */
	const stems = new Map();
	/** @type {Map<string, string>} */
	const slugAt = new Map();
	for (const { e, chapter, i } of entries) {
		const at = `${chapter}/${typeof e.stem === 'string' ? e.stem : `entries[${i}]`}`;
		if (typeof e.stem === 'string') {
			if (stems.has(e.stem)) ctx.push(at, `the stem "${e.stem}" is also ${stems.get(e.stem)}: stems are unique across Cuisine`);
			else stems.set(e.stem, at);
		}
		if (typeof e.slug === 'string') {
			if (slugAt.has(e.slug)) ctx.push(at, `the slug "${e.slug}" is also ${slugAt.get(e.slug)}`);
			else slugAt.set(e.slug, at);
		}
		checkEntry(e, at, chapter, ctx);
	}

	// steps and matches
	const generated = generateMatches(set, refs);
	/** @type {Map<string, string>} */
	const stepStems = new Map();
	/** @type {Map<string, string>} */
	const matchStems = new Map(GENERATED.map((g) => [g.stem, `the generated set "${g.stem}"`]));
	const data = { tree: set.tree, ladder: set.ladder };
	for (const m of set.meta) {
		const file = set.files.get(m.key);
		if (!isObj(file)) continue;
		(Array.isArray(file.steps) ? file.steps : []).forEach((s, i) => {
			const at = `${m.key}/steps[${i}] ${isObj(s) && typeof s.stem === 'string' ? s.stem : ''}`.trim();
			if (isObj(s) && typeof s.stem === 'string') {
				if (stepStems.has(s.stem)) ctx.push(at, `the steps stem "${s.stem}" is also ${stepStems.get(s.stem)}`);
				else stepStems.set(s.stem, at);
			}
			checkSteps(s, at, ctx);
			dashWalk(s, at, ctx);
		});
		(Array.isArray(file.match) ? file.match : []).forEach((x, i) => {
			const at = `${m.key}/match[${i}] ${isObj(x) && typeof x.stem === 'string' ? x.stem : ''}`.trim();
			if (isObj(x) && typeof x.stem === 'string') {
				if (matchStems.has(x.stem)) ctx.push(at, `the match stem "${x.stem}" is also ${matchStems.get(x.stem)}`);
				else matchStems.set(x.stem, at);
			}
			checkMatch(x, at, ctx, data);
		});
	}
	for (const g of generated.made) checkMatch(g, `${g.chapter}/generated ${g.stem}`, ctx, data, true);

	// the tree and the ladder
	if (set.tree !== null) checkTree(set.tree, ctx);
	else ctx.push('tree', 'tools/derive/cuisine/tree.json is missing');
	if (set.ladder !== null) checkLadder(set.ladder, ctx);
	else ctx.push('ladder', 'tools/derive/cuisine/ladder.json is missing');

	// levels
	for (const m of set.meta) {
		const mine = entries.filter((x) => x.chapter === m.key);
		if (mine.length && !mine.some(({ e }) => e.level === 1)) ctx.push(m.key, `the chapter holds no ${LEVEL_NAMES[1]} entry: every chapter opens a door at the first level`);
		if (opts.complete && !mine.length) ctx.push(m.key, 'CUISINE_COMPLETE: every chapter is written');
	}
	if (opts.complete) {
		for (const level of LEVELS) {
			const n = entries.filter(({ e }) => e.level === level).length;
			if (n < LIMITS.levelMin) ctx.push('set', `${LEVEL_NAMES[/** @type {1|2|3|4} */ (level)]} holds ${n} entries; every level holds at least ${LIMITS.levelMin} across the set`);
		}
	}
	return { problems, generated };
}

/** @param {Problem} p */
export const formatProblem = (p) => `${p.path}: ${p.message}`;

/**
 * The rules in plain words, for the authoring brief. Every figure is read
 * from the constants above.
 */
export const RULES = [
	`Write British English (colour, flavour, savoury, caramelise, centre, litre, grey, aubergine). Proper names keep their spelling (${SPELLING_OK.slice(0, 3).join(', ')}, and every Brennan's dish, component and term name).`,
	'No em dash, en dash, their HTML entities or a double hyphen anywhere, in any field, quotes and sources included. Use a comma, a colon or a full stop.',
	`A level is the integer 1 to 4 in data and is named in prose (${Object.values(LEVEL_NAMES).join(', ')}); never write a level by its number or numeral.`,
	'No superlatives the house bans (delicious, amazing, perfect, decadent, to die for, mouth-watering, elevated, unique, world-class).',
	'No allergen or diet verdict: never "safe", "free of", "contains no", "suitable for". A sentence that names an allergen class or a diet (gluten, dairy, shellfish, soy, sesame, vegan, vegetarian, allergy) also sends the reader to the service note or the kitchen.',
	'Every temperature carries both scales with the degree sign: 63°C (145°F), or a range 60 to 65°C (140 to 149°F). The arithmetic is checked. No temperature in the guest line.',
	'Every US measure carries its metric in brackets: 8 oz (225 g), 2 tbsp (30 ml), 1 cup (240 ml); or the metric leads with the US in brackets: 225 g (8 oz).',
	`An entry: stem and slug (lowercase, hyphenated, unique across Cuisine), title, say, level, kind (${KINDS.join(', ')}), summary of ${WORDS.summary[0]} to ${WORDS.summary[1]} words, guest of ${WORDS.guest[0]} to ${WORDS.guest[1]} words (what a server says at the table).`,
	`say is the respelling: ASCII syllables joined by hyphens, one stressed syllable per word in capitals (bair-NAYZ), or "As it reads: brown stock." for a plain English name. Where the Brennan's pack carries the name as a term, say is the pack's respelling exactly.`,
	`sections: ${LIMITS.sections[0]} or more, "what" first, keys from ${SECTION_KEYS.join(', ')}, each key once; the body is ${WORDS.body[0]} to ${WORDS.body[1]} words, no paragraph over ${WORDS.paragraph[1]}.`,
	'ratios [{label, value}], temps [{label, c, f}] (c and f both numbers), faults [{fault, cause, fix}]: optional, but a sauce without its ratio and faults is not finished.',
	`brennans [{dish, components, how}]: dish is a d- id of the Brennan's pack, every component an exact pack component name whose itemIds include that dish, how ${WORDS.brennansHow[0]} to ${WORDS.brennansHow[1]} words.`,
	`seeAlso {${SEE_ALSO_KEYS.join(', ')}}: every key optional, every value an array that resolves (techniques, lexicon, recipes and kitchen by slug, plates by slug, folios by TEACHING_FOLIOS id, deck by fd_ id, components by exact pack name, entries by Cuisine slug, terms by the entry id of the owner's sheet terms in src/lib/data/culinary-foundations.json). terms holds at most ${LIMITS.sheetTerms}: only the sheet terms the entry teaches or rests on, never a passing mention.`,
	`quote {text, source, year}: optional, at most ${WORDS.quote[1]} words, only from a public domain text (Escoffier, Hearn, the Picayune) printed in ${LIMITS.quoteYear} or before. A quote keeps its own spelling.`,
	`sources [{title, url, asOf?, year?, evidence?}]: at least ${LIMITS.sources}, at least ${LIMITS.sourcesStrict} for kind history and for every safety entry; https addresses only; asOf YYYY-MM-DD, never after the build date. In the safety chapter every temperature and time in the body and temps appears as a figure in some source's evidence (the source's own words).`,
	`cards: ${LIMITS.cards[0]} to ${LIMITS.cards[1]} of {stem, front, back}, front ${WORDS.cardFront[0]} to ${WORDS.cardFront[1]} words, back ${WORDS.cardBack[0]} to ${WORDS.cardBack[1]}.`,
	`questions: ${LIMITS.questions[0]} to ${LIMITS.questions[1]} of {stem, q, answer, distractors, why, teaches}: q ${WORDS.question[0]} to ${WORDS.question[1]} words; exactly ${LIMITS.distractors} distractors, distinct once case is folded, none the answer, no "all/none of the above"; the answer at most ${LIMITS.answerRatio} times as long as the longest distractor; why ${WORDS.why[0]} to ${WORDS.why[1]} words; teaches is a card stem of the same entry.`,
	`steps [{stem, entry, title, prompt, steps, distractor?, why}]: ${LIMITS.steps[0]} to ${LIMITS.steps[1]} distinct stages in the right order, at most one distractor (one string that does not belong), why ${WORDS.stepsWhy[0]} to ${WORDS.stepsWhy[1]} words.`,
	`match [{stem, title, prompt, left, right, pairs}]: ${LIMITS.pairs[0]} to ${LIMITS.pairs[1]} pairs [left, right] or [left, right, entry slug], one to one. A pair that names tree nodes or ladder rungs must agree with tree.json and ladder.json.`,
	`Every chapter with entries holds at least one ${LEVEL_NAMES[1]} entry; once CUISINE_COMPLETE, every level holds at least ${LIMITS.levelMin} entries across the set.`,
	'In draft mode (validate.mjs --draft) a reference may name a slug planned in tools/cuisine/roster.json but not yet written; the build accepts only written entries.'
];
