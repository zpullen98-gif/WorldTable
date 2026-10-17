#!/usr/bin/env node
/**
 * Cuisine's authoring brief: everything a content agent needs to write one
 * chapter, as JSON on stdout.
 *
 *   node tools/cuisine/brief.mjs <chapter> [--out file] [--pretty]
 *
 * It carries the chapter's roster rows (tools/cuisine/roster.json), the
 * contract's limits and rules in plain words (read from
 * tools/derive/cuisine-contract.mjs, never retyped), the shapes with short
 * examples, every Brennan's dish with its id and the pack components that
 * link it (the sauce and technique components, and every component of a dish
 * the roster's brennans fields name), the pack's lexicon terms with their
 * respellings, candidate seeAlso references from every data set filtered by
 * the roster's keywords, the entries already written, and one exemplar entry
 * (the seed Hollandaise). It is kept under about 60 KB.
 *
 * Without a roster it still prints, with "roster": null and a note on stderr,
 * so the shapes and the house can be read before the roster lands.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
	CHAPTER_KEYS,
	DISH_ID_RE,
	KINDS,
	LEVEL_NAMES,
	LIMITS,
	RULES,
	SECTION_KEYS,
	SEE_ALSO_KEYS,
	WORDS,
	allEntries,
	fold,
	rosterRows
} from '../derive/cuisine-contract.mjs';
import { ROSTER_FILE, SRC_DIR, loadRefs, loadSet, readRoster, rel } from '../derive/cuisine.mjs';

/** @typedef {import('../derive/cuisine-contract.mjs').Loose} Loose */

const args = process.argv.slice(2);
const chapter = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--out');
if (args.includes('--help') || !chapter) {
	console.log(`node tools/cuisine/brief.mjs <chapter> [--out file] [--pretty]
Prints the authoring brief for one chapter as JSON (compact unless --pretty). Chapters: ${CHAPTER_KEYS.join(', ')}.`);
	process.exit(chapter || args.includes('--help') ? 0 : 1);
}
const outAt = args.indexOf('--out');
const outFile = outAt >= 0 ? args[outAt + 1] : null;

const set = loadSet();
const meta = set.meta.find((m) => m.key === chapter);
if (!meta) {
	console.error(`brief: "${chapter}" is not a chapter of chapters.json (${CHAPTER_KEYS.join(', ')})`);
	process.exit(1);
}
const rawRoster = readRoster();
const refs = loadRefs();
const roster = rawRoster === null ? null : rosterRows(rawRoster);
const mine = roster === null ? null : roster.filter((r) => r.chapter === chapter);
if (roster === null) console.error(`brief: ${rel(ROSTER_FILE)} does not exist yet; the brief has "roster": null and its candidates are chosen from the chapter's title and intro alone.`);
else if (!mine?.length) console.error(`brief: the roster plans no entry for "${chapter}"`);

/* ── keywords ─────────────────────────────────────────────────────────── */
const STOP = new Set('the and for with from into its their that this what how why when where which who are was were has have had not but all any one two three four five six seven eight nine ten each every more most less than then them they you your our out over under about after before also only very much many such some own same other same well good great small large little classic classical french creole cajun louisiana new orleans kitchen cooking cook dish dishes sauce sauces entry chapter level levels learn learned every first last make made making use used uses'.split(' '));
/** @param {unknown} s */
const tokens = (s) =>
	fold(s)
		.split(/[^a-z0-9]+/)
		.filter((w) => w.length >= 3 && !STOP.has(w))
		.map((w) => (w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w));
/** @type {Set<string>} */
const keywords = new Set();
/** @param {unknown} v */
const harvest = (v) => {
	if (typeof v === 'string') for (const t of tokens(v)) keywords.add(t);
	else if (Array.isArray(v)) v.forEach(harvest);
	else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!['level', 'chapter'].includes(k)) harvest(x);
};
if (mine?.length) harvest(mine);
else harvest([meta.title, meta.intro]);

/**
 * The references of one set whose names share the most keywords.
 * @param {Array<[string, string, string?]>} rows [ref, title, extra text]
 * @param {number} cap
 */
function relevant(rows, cap) {
	return rows
		.map(([ref, title, extra]) => {
			const t = new Set(tokens(`${title} ${extra ?? ''} ${ref.replace(/-/g, ' ')}`));
			let score = 0;
			for (const k of keywords) if (t.has(k)) score++;
			return { ref, title, score };
		})
		.filter((x) => x.score > 0)
		.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
		.slice(0, cap)
		.map((x) => [x.ref, x.title]);
}
const DATA = path.join(SRC_DIR, '..', '..', '..', 'src', 'lib', 'data');
/** @param {string} f */
const readData = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
const lexicon = /** @type {Loose[]} */ (readData('lexicon.json'));
const lexCategory = new Map(lexicon.map((x) => [x.slug, x.category]));

const written = allEntries(set).map(({ e, chapter: c }) => ({ slug: e.slug, title: e.title, chapter: c, level: e.level, kind: e.kind }));
const plannedElsewhere = (roster ?? []).filter((r) => r.chapter !== chapter).map((r) => /** @type {[string, string, string]} */ ([r.slug, r.title, r.chapter]));

/* ── the house ────────────────────────────────────────────────────────── */
/** @type {Set<string>} */
const rosterDishes = new Set();
const dishByName = new Map([...refs.dishes].map(([id, n]) => [fold(n), id]));
/** @param {unknown} v */
const dishRefs = (v) => {
	if (typeof v === 'string') {
		if (DISH_ID_RE.test(v)) rosterDishes.add(v);
		else if (dishByName.has(fold(v))) rosterDishes.add(/** @type {string} */ (dishByName.get(fold(v))));
	} else if (Array.isArray(v)) v.forEach(dishRefs);
	else if (v && typeof v === 'object') for (const x of Object.values(v)) dishRefs(x);
};
for (const r of mine ?? []) dishRefs(r.brennans);
const comps = [...refs.components.values()];
const dishes = [...refs.dishes].map(([id, n]) => {
	const linking = comps.filter((c) => c.itemIds.has(id) && (c.kind === 'technique' || rosterDishes.has(id))).map((c) => c.name);
	return rosterDishes.has(id) ? [id, n, linking, 'roster'] : [id, n, linking];
});
/* The pack's terms that touch the kitchen: a term on a dish, or one the
   chapter's keywords name. A wine producer's respelling is no use here. */
const packLexicon = /** @type {Loose[]} */ (JSON.parse(fs.readFileSync(path.join(DATA, '..', '..', '..', 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json'), 'utf8')).house.lexicon ?? []);
const onDish = new Set(packLexicon.filter((t) => (t.itemIds ?? []).some((/** @type {string} */ id) => id.startsWith('d-'))).map((t) => fold(t.term)));
const terms = [...refs.terms.values()].filter((t) => onDish.has(fold(t.term)) || tokens(t.term).some((w) => keywords.has(w))).map((t) => [t.term, t.say]);

/**
 * A roster row without what the brief already says: its chapter, and the
 * empty lists of its seeAlso.
 * @param {import('../derive/cuisine-contract.mjs').RosterRow} row
 */
function slim(row) {
	/** @type {Loose} */
	const out = {};
	for (const [k, v] of Object.entries(row)) {
		if (k === 'chapter') continue;
		if (k === 'seeAlso' && v && typeof v === 'object' && !Array.isArray(v)) {
			const kept = Object.fromEntries(Object.entries(v).filter(([, x]) => !Array.isArray(x) || x.length));
			if (Object.keys(kept).length) out[k] = kept;
			continue;
		}
		out[k] = v;
	}
	return out;
}

/* ── the examples, from the seed ──────────────────────────────────────── */
const seed = set.files.get('mother-sauces');
const exemplar = (seed?.entries ?? []).find((/** @type {Loose} */ e) => e.stem === 'hollandaise') ?? null;
const exampleSteps = (seed?.steps ?? [])[0] ?? null;
const exampleMatch = (seed?.match ?? [])[0] ?? null;

const brief = {
	chapter: { key: meta.key, title: meta.title, intro: meta.intro, position: set.meta.findIndex((m) => m.key === chapter) + 1, of: set.meta.length },
	roster: mine === null ? null : mine.map(slim),
	rosterNote:
		roster === null
			? `${rel(ROSTER_FILE)} does not exist yet: write only what the orchestrator assigns, and validate without --draft.`
			: 'Write every roster row of this chapter, in roster order, with its stem, slug, title, level and kind as planned.',
	write: {
		to: `tools/cuisine/out/${chapter}/<part>.json, each { entries: [...], steps?: [...], match?: [...] }`,
		validate: `node tools/cuisine/validate.mjs${roster === null ? '' : ' --draft'} ${chapter}`,
		merge: `node tools/cuisine/merge.mjs ${chapter}`,
		build: 'node tools/derive/cuisine.mjs --mint'
	},
	shapes: {
		entry: '{ stem, slug, title, say, level (1-4), kind, summary, guest, sections: [{ key, paras: [string] }], ratios?: [{ label, value }], temps?: [{ label, c, f }], faults?: [{ fault, cause, fix }], brennans?: [{ dish, components, how }], seeAlso?: { entries, techniques, lexicon, recipes, kitchen, plates, folios, deck, components, terms }, quote?: { text, source, year }, sources: [{ title, url, asOf?, year?, evidence? }], cards: [{ stem, front, back }], questions: [{ stem, q, answer, distractors: [3], why, teaches }] }',
		steps: '{ stem, entry, title, prompt, steps: [4 to 9 strings in order], distractor?: string, why }',
		match: '{ stem, title, prompt, left, right, pairs: [[left, right] or [left, right, entry slug]] }',
		part: '{ entries: [...], steps?: [...], match?: [...] } in tools/cuisine/out/<chapter>/<name>.json; tree and ladder go to tools/cuisine/out/tree.json and ladder.json whole',
		tree: '{ careme: { four: [four names], note }, mothers: [five of { name?, say?, entry?, liaison, liquid, children: [three or more of { name, say?, adds (up to 15 words), entry?, dishes?: [{ dish, components }], children? }] }] }: a mother without a name links the entry whose title names it; a node whose name the pack carries as a term carries its say',
		ladder: '{ rungs: [four to eight of { key, name, minutes: n or [low, high], cue, smell, thickening (2 to 30 words each), uses: [entry slugs], dishes: [{ dish, components }] }] }, pale to dark',
		exampleQuestion: 'see exemplar.questions',
		exampleSteps,
		exampleMatch
	},
	limits: { words: WORDS, counts: LIMITS, kinds: KINDS, sections: SECTION_KEYS, seeAlso: SEE_ALSO_KEYS, levels: LEVEL_NAMES },
	rules: RULES,
	written,
	house: {
		note: "dishes are [id, name, components, 'roster'?]. A Brennan's link names the dish by id and only components listed beside it, exactly as written: every sauce and technique component that links the dish, and for a dish this chapter's roster names ('roster'), every component that links it. terms are [term, say]: an entry or tree node named by a term uses that say exactly.",
		dishes,
		terms
	},
	seeAlso: {
		note: 'Candidates chosen by keyword from the roster; any real reference resolves, these are the likeliest. [ref, title].',
		entries: [...written.filter((w) => w.chapter !== chapter).map((w) => [w.slug, w.title]), ...relevant(plannedElsewhere, 40)],
		techniques: relevant([...refs.techniques].map(([k, v]) => [k, v]), 15),
		lexicon: relevant([...refs.lexicon].map(([k, v]) => [k, v, lexCategory.get(k)]), 20),
		recipes: relevant([...refs.recipes].map(([k, v]) => [k, v]), 20),
		kitchen: relevant([...refs.kitchen].map(([k, v]) => [k, v]), 15),
		plates: relevant([...refs.plates].map(([k, v]) => [k, v]), 8),
		folios: [...refs.folios].map(([k, v]) => [k, v]),
		deck: relevant([...refs.deck].map(([k, v]) => [k, v]), 20),
		components: relevant(comps.map((c) => [c.name, c.name, c.kind]), 30),
		terms: relevant([...refs.foundations].map(([k, v]) => [k, v]), 15)
	},
	exemplar
};

const text = JSON.stringify(brief, null, args.includes('--pretty') ? '\t' : undefined) + '\n';
if (outFile) {
	fs.writeFileSync(outFile, text);
	console.error(`brief: wrote ${outFile} (${(Buffer.byteLength(text) / 1024).toFixed(1)} KB)`);
} else {
	process.stdout.write(text);
	console.error(`brief: ${(Buffer.byteLength(text) / 1024).toFixed(1)} KB for ${chapter}`);
}
