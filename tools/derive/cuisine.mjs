#!/usr/bin/env node
/**
 * Cuisine: the French and Creole learning area, built.
 *
 * The source is tools/derive/cuisine/: chapters.json (the twelve chapters in
 * order, with their titles and intros), one <key>.json per written chapter,
 * tree.json (Carême's four and the five mothers) and ladder.json (the roux
 * colour ladder). The rules are tools/derive/cuisine-contract.mjs, the same
 * module the authoring validator runs.
 *
 * ## Ids
 *
 * Every entry, card, question, steps set and match carries an id minted once
 * into tools/derive/cuisine.ledger.json and never typed: 'cz-' and the first
 * eight base36 characters of the sha1 of '<chapter>/<stem>' (an entry or a
 * match) or '<chapter>/<entry>/<stem>' (a card, a question or a steps set).
 * After minting, the ledger is the authority and is looked up by stem key
 * (an entry by its stem, a card or question by '<entry>/<stem>', a steps set
 * or match by its stem), so an entry that moves chapter keeps its id and a
 * reader's progress with it. The build refuses a key the ledger lacks unless
 * --mint is given, two keys on one id, an id that was retired, and a ledger
 * key whose content has gone (retire it with --retire kind:key).
 *
 * ## Emitted
 *
 *   src/lib/data/cuisine/index.json       the chapters, entry heads, card and
 *       question tuples [id, entryId, level], steps and match heads, the
 *       tree, the ladder, and the reverse maps technique slug to entry ids
 *       and dish id to entry ids. Small enough to install with the app.
 *   src/lib/data/cuisine/ch-<key>.json    one chapter's bodies, cards,
 *       questions, steps sets and matches, the generated matches included.
 *
 * The output is deterministic: a rebuild with nothing changed writes the
 * same bytes.
 *
 * Usage: node tools/derive/cuisine.mjs [--mint] [--draft] [--check] [--today YYYY-MM-DD]
 *        node tools/derive/cuisine.mjs --retire <kind>:<key> --reason <text>
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
	CHAPTER_KEYS,
	CUISINE_COMPLETE,
	GENERATED,
	LEVEL_NAMES,
	LIMITS,
	PART_KEYS,
	SEE_ALSO_KEYS,
	allEntries,
	checkSet,
	entryTitles,
	formatProblem,
	makeRefs,
	treeNodes
} from './cuisine-contract.mjs';

/**
 * @typedef {import('./cuisine-contract.mjs').Loose} Loose
 * @typedef {import('./cuisine-contract.mjs').Refs} Refs
 * @typedef {import('./cuisine-contract.mjs').CuisineSet} CuisineSet
 * @typedef {import('./cuisine-contract.mjs').ChapterMeta} ChapterMeta
 * @typedef {import('./cuisine-contract.mjs').Problem} Problem
 * @typedef {import('./cuisine-contract.mjs').GeneratedMatch} GeneratedMatch
 * @typedef {'entries' | 'cards' | 'questions' | 'steps' | 'matches'} IdKind
 * @typedef {{ version: number, entries: Record<string, string>, cards: Record<string, string>, questions: Record<string, string>, steps: Record<string, string>, matches: Record<string, string>, retired: Record<string, { id: string, reason: string }> }} Ledger
 * @typedef {{ kitchen: Map<string, number>, deck: Map<string, string> }} Links
 */

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SRC_DIR = path.join(ROOT, 'tools', 'derive', 'cuisine');
export const LEDGER_FILE = path.join(ROOT, 'tools', 'derive', 'cuisine.ledger.json');
export const OUT_DIR = path.join(ROOT, 'src', 'lib', 'data', 'cuisine');
export const ROSTER_FILE = path.join(ROOT, 'tools', 'cuisine', 'roster.json');
export const PARTS_DIR = path.join(ROOT, 'tools', 'cuisine', 'out');
const DATA = path.join(ROOT, 'src', 'lib', 'data');
const PACK = path.join(ROOT, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json');
const FOLIO_FILES = [
	path.join(ROOT, 'src', 'lib', 'teaching-folios.ts'),
	path.join(ROOT, 'src', 'lib', 'teaching-folios-first-collection.ts'),
	path.join(ROOT, 'src', 'lib', 'teaching-folios-cooks-eye.ts'),
	path.join(ROOT, 'src', 'lib', 'teaching-folios-prep-to-pass.ts'),
	path.join(ROOT, 'src', 'lib', 'teaching-folios-professional-pass.ts')
];
export const ID_KINDS = /** @type {IdKind[]} */ (['entries', 'cards', 'questions', 'steps', 'matches']);
export const ID_RE = /^cz-[0-9a-z]{8}$/;

/** @param {string} p */
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
/** @param {unknown} v @returns {v is Loose} */
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
/** @param {string} p */
export const rel = (p) => path.relative(ROOT, p) || p;

/** The chapters' declaration. @returns {ChapterMeta[]} */
export function readMeta() {
	const raw = readJson(path.join(SRC_DIR, 'chapters.json'));
	if (!isObj(raw) || !Array.isArray(raw.chapters)) throw new Error(`${rel(path.join(SRC_DIR, 'chapters.json'))}: not { chapters: [...] }`);
	return raw.chapters;
}

/**
 * Every source file as it stands on disk.
 * @returns {CuisineSet}
 */
export function loadSet() {
	const meta = readMeta();
	/** @type {Map<string, Loose>} */
	const files = new Map();
	for (const m of meta) {
		const p = path.join(SRC_DIR, `${m.key}.json`);
		if (fs.existsSync(p)) files.set(m.key, readJson(p));
	}
	/** @param {string} f */
	const opt = (f) => (fs.existsSync(path.join(SRC_DIR, f)) ? readJson(path.join(SRC_DIR, f)) : null);
	return { meta, files, tree: opt('tree.json'), ladder: opt('ladder.json') };
}

/** The roster another tool writes, or null while it does not exist. */
export function readRoster() {
	return fs.existsSync(ROSTER_FILE) ? readJson(ROSTER_FILE) : null;
}

/**
 * The teaching folios' ids and titles, read from the TypeScript source by
 * pattern, because a tool cannot import it. The vitest compares this list
 * with TEACHING_FOLIOS itself.
 * @returns {Array<{ id: string, title: string }>}
 */
export function readFolios() {
	/** @type {Array<{ id: string, title: string }>} */
	const out = [];
	for (const f of FOLIO_FILES) {
		const text = fs.readFileSync(f, 'utf8');
		for (const m of text.matchAll(/\bid: '([a-z0-9-]+)', group: '[a-z-]+', title: '((?:[^'\\]|\\.)*)'/g)) out.push({ id: m[1], title: m[2].replace(/\\'/g, "'") });
	}
	return out;
}

/**
 * The reference sets, read from the data files the app ships. The labels
 * the screens print beside each cross reference come from these maps too
 * (derive's `labels`), with loadLinks for the two addresses they lack.
 * @param {{ roster?: boolean }} [opts] roster: false to leave the roster out
 * @returns {Refs}
 */
export function loadRefs(opts = {}) {
	return makeRefs({
		techniques: readJson(path.join(DATA, 'techniques.json')),
		lexicon: readJson(path.join(DATA, 'lexicon.json')),
		recipes: readJson(path.join(DATA, 'recipes.index.json')),
		kitchen: readJson(path.join(DATA, 'kitchen.index.json')),
		plates: readJson(path.join(DATA, 'plates.json')),
		deck: readJson(path.join(DATA, 'floor-deck.index.json')),
		folios: readFolios(),
		pack: readJson(PACK),
		foundations: readJson(path.join(DATA, 'culinary-foundations.json')),
		roster: opts.roster === false ? null : readRoster()
	});
}

/**
 * What a screen needs to draw a cross reference as a link and the refs do not
 * carry: a Cook at home dish's level (its address names it) and a Floor Deck
 * card's section (its deck's id names it). Read from the files the app ships.
 * @returns {Links}
 */
export function loadLinks() {
	const kitchen = readJson(path.join(DATA, 'kitchen.index.json'));
	const deck = readJson(path.join(DATA, 'floor-deck.index.json'));
	return {
		kitchen: new Map(arr(kitchen?.dishes).map((/** @type {Loose} */ d) => [String(d.slug), Number(d.level)])),
		deck: new Map(arr(deck?.cards).map((/** @type {Loose} */ c) => [String(c.id), String(c.section)]))
	};
}

/** @returns {Ledger} */
export function emptyLedger() {
	return { version: 1, entries: {}, cards: {}, questions: {}, steps: {}, matches: {}, retired: {} };
}

/** @returns {Ledger} */
export function readLedger() {
	if (!fs.existsSync(LEDGER_FILE)) return emptyLedger();
	const raw = readJson(LEDGER_FILE);
	const l = emptyLedger();
	for (const k of ID_KINDS) if (isObj(raw[k])) l[k] = /** @type {Record<string, string>} */ (raw[k]);
	if (isObj(raw.retired)) l.retired = /** @type {Ledger['retired']} */ (raw.retired);
	return l;
}

/** @param {Record<string, any>} o */
const sortKeys = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));

/** @param {Ledger} l */
export function ledgerText(l) {
	/** @type {Record<string, any>} */
	const out = { version: 1 };
	for (const k of ID_KINDS) out[k] = sortKeys(l[k]);
	out.retired = sortKeys(l.retired);
	return JSON.stringify(out, null, '\t') + '\n';
}

/**
 * The id a key would be minted with: 'cz-' and the first eight base36
 * characters of its sha1, the 160 bits written as 31 base36 digits.
 * @param {string} input
 */
export function mintId(input) {
	const hex = createHash('sha1').update(input).digest('hex');
	return 'cz-' + BigInt('0x' + hex).toString(36).padStart(31, '0').slice(0, 8);
}

/**
 * Everything that carries an id, with its ledger key and the input its id
 * would be minted from.
 * @param {CuisineSet} set
 * @param {GeneratedMatch[]} generated
 * @returns {Array<{ kind: IdKind, key: string, input: string }>}
 */
export function idKeys(set, generated) {
	/** @type {Array<{ kind: IdKind, key: string, input: string }>} */
	const out = [];
	for (const { e, chapter } of allEntries(set)) {
		out.push({ kind: 'entries', key: e.stem, input: `${chapter}/${e.stem}` });
		for (const c of Array.isArray(e.cards) ? e.cards : []) out.push({ kind: 'cards', key: `${e.stem}/${c?.stem}`, input: `${chapter}/${e.stem}/${c?.stem}` });
		for (const q of Array.isArray(e.questions) ? e.questions : []) out.push({ kind: 'questions', key: `${e.stem}/${q?.stem}`, input: `${chapter}/${e.stem}/${q?.stem}` });
	}
	for (const m of set.meta) {
		const file = set.files.get(m.key);
		if (!isObj(file)) continue;
		for (const s of Array.isArray(file.steps) ? file.steps : []) out.push({ kind: 'steps', key: String(s?.stem), input: `${m.key}/${s?.entry}/${s?.stem}` });
		for (const x of Array.isArray(file.match) ? file.match : []) out.push({ kind: 'matches', key: String(x?.stem), input: `${m.key}/${x?.stem}` });
	}
	/* The generated sets are minted whether or not the data can field them
	   yet, so the day one appears needs no --mint. */
	for (const g of GENERATED) out.push({ kind: 'matches', key: g.stem, input: `${g.chapter}/${g.stem}` });
	void generated;
	return out;
}

/**
 * Ids from the ledger, minting the missing ones only when asked.
 * @param {CuisineSet} set
 * @param {GeneratedMatch[]} generated
 * @param {Ledger} ledger
 * @param {{ mint?: boolean }} [opts]
 * @returns {{ ids: Record<IdKind, Map<string, string>>, ledger: Ledger, minted: string[], problems: Problem[] }}
 */
export function assignIds(set, generated, ledger, opts = {}) {
	/** @type {Problem[]} */
	const problems = [];
	/** @type {Ledger} */
	const next = JSON.parse(JSON.stringify(ledger));
	/** @type {Record<IdKind, Map<string, string>>} */
	const ids = { entries: new Map(), cards: new Map(), questions: new Map(), steps: new Map(), matches: new Map() };
	const retiredIds = new Map(Object.entries(next.retired).map(([k, v]) => [v.id, k]));
	/** @type {Map<string, string>} id -> kind:key, over the whole ledger */
	const owner = new Map();
	for (const kind of ID_KINDS) {
		for (const [key, id] of Object.entries(next[kind])) {
			const at = `ledger/${kind}:${key}`;
			if (!ID_RE.test(id)) problems.push({ path: at, message: `${JSON.stringify(id)} is not a Cuisine id (cz- and eight base36 characters)` });
			if (owner.has(id)) problems.push({ path: at, message: `the id ${id} is also ${owner.get(id)}: one id, one key` });
			owner.set(id, `${kind}:${key}`);
			if (retiredIds.has(id)) problems.push({ path: at, message: `the id ${id} was retired (${retiredIds.get(id)}) and may never be reused` });
		}
	}
	/** @type {string[]} */
	const minted = [];
	/** @type {Set<string>} */
	const live = new Set();
	for (const { kind, key, input } of idKeys(set, generated)) {
		const k = `${kind}:${key}`;
		if (live.has(k)) continue; // a duplicate stem: the contract has reported it
		live.add(k);
		let id = next[kind][key];
		if (!id) {
			if (`${kind}:${key}` in next.retired) {
				problems.push({ path: `ledger/${k}`, message: `the key was retired (${next.retired[k].reason}); a retired key never comes back: choose a new stem` });
				continue;
			}
			if (!opts.mint) {
				problems.push({ path: `ledger/${k}`, message: 'no id: ids are minted, never typed. Run node tools/derive/cuisine.mjs --mint' });
				continue;
			}
			id = mintId(input);
			if (owner.has(id)) {
				problems.push({ path: `ledger/${k}`, message: `minting from "${input}" gives ${id}, which is already ${owner.get(id)}: a collision; rename the stem` });
				continue;
			}
			if (retiredIds.has(id)) {
				problems.push({ path: `ledger/${k}`, message: `minting from "${input}" gives ${id}, which was retired (${retiredIds.get(id)}) and may never be reused; rename the stem` });
				continue;
			}
			next[kind][key] = id;
			owner.set(id, k);
			minted.push(k);
		}
		ids[kind].set(key, id);
	}
	const generatedStems = new Set(GENERATED.map((g) => /** @type {string} */ (g.stem)));
	for (const kind of ID_KINDS) {
		for (const key of Object.keys(next[kind])) {
			if (live.has(`${kind}:${key}`) || (kind === 'matches' && generatedStems.has(key))) continue;
			problems.push({ path: `ledger/${kind}:${key}`, message: `${next[kind][key]} names nothing in the chapters. A reader may hold progress under it: restore the content, or run node tools/derive/cuisine.mjs --retire ${kind}:${key} --reason "<why>"` });
		}
	}
	return { ids, ledger: next, minted, problems };
}

/** @param {unknown} v */
const arr = (v) => (Array.isArray(v) ? v : []);

/**
 * The emitted files as path -> text, written by nothing: the build writes
 * them and the vitest compares them.
 * @param {CuisineSet} set
 * @param {GeneratedMatch[]} generated
 * @param {Record<IdKind, Map<string, string>>} ids
 * @param {{ draft?: boolean, refs?: Refs, links?: Links }} [opts]
 * @returns {Map<string, string>}
 */
export function derive(set, generated, ids, opts = {}) {
	/** @type {Map<string, string>} */
	const out = new Map();
	const refs = opts.refs ?? null;
	const links = opts.links ?? null;
	/* The dishes the screens name: every dish id an entry, a tree node or a
	   ladder rung links, with its name from the pack, so a reader whose house
	   is not Brennan's still reads the dish in words. */
	/** @type {Map<string, string>} */
	const dishNames = new Map();
	/** @param {unknown} id */
	const nameDish = (id) => {
		const name = typeof id === 'string' ? refs?.dishes.get(id) : undefined;
		if (typeof id === 'string' && name) dishNames.set(id, name);
	};
	const entries = allEntries(set);
	const entryId = new Map(entries.map(({ e }) => [e.slug, /** @type {string} */ (ids.entries.get(e.stem))]));
	/** @param {unknown} slug */
	const idOf = (slug) => (typeof slug === 'string' ? entryId.get(slug) ?? null : null);

	/** @type {Loose[]} */
	const chapters = [];
	/** @type {Loose[]} */
	const heads = [];
	/** @type {Array<[string, string, number]>} */
	const cardRows = [];
	/** @type {Array<[string, string, number]>} */
	const questionRows = [];
	/** @type {Loose[]} */
	const stepHeads = [];
	/** @type {Loose[]} */
	const matchHeads = [];
	/** @type {Map<string, string[]>} */
	const byTechnique = new Map();
	/** @type {Map<string, string[]>} */
	const byDish = new Map();
	/** @param {Map<string, string[]>} m @param {string} k @param {string} id */
	const addTo = (m, k, id) => {
		const list = m.get(k) ?? [];
		if (!list.includes(id)) list.push(id);
		m.set(k, list);
	};

	for (const meta of set.meta) {
		const file = set.files.get(meta.key);
		const mine = entries.filter((x) => x.chapter === meta.key);
		const gen = generated.filter((g) => g.chapter === meta.key);
		const bodies = mine.map(({ e }) => {
			const id = /** @type {string} */ (ids.entries.get(e.stem));
			const cardId = new Map(arr(e.cards).map((c) => [c.stem, /** @type {string} */ (ids.cards.get(`${e.stem}/${c.stem}`))]));
			heads.push({ id, slug: e.slug, chapter: meta.key, title: e.title, say: e.say, level: e.level, kind: e.kind, summary: e.summary });
			for (const c of arr(e.cards)) cardRows.push([/** @type {string} */ (cardId.get(c.stem)), id, e.level]);
			for (const q of arr(e.questions)) questionRows.push([/** @type {string} */ (ids.questions.get(`${e.stem}/${q.stem}`)), id, e.level]);
			for (const t of arr(e.seeAlso?.techniques)) addTo(byTechnique, t, id);
			for (const b of arr(e.brennans)) addTo(byDish, b.dish, id);
			/** @type {Loose} */
			const seeAlso = {};
			for (const k of SEE_ALSO_KEYS) if (arr(e.seeAlso?.[k]).length) seeAlso[k] = e.seeAlso[k];
			/** @type {Loose} */
			const body = {
				id,
				slug: e.slug,
				title: e.title,
				say: e.say,
				level: e.level,
				kind: e.kind,
				summary: e.summary,
				guest: e.guest,
				sections: arr(e.sections).map((s) => ({ key: s.key, paras: s.paras })),
				ratios: arr(e.ratios).map((r) => ({ label: r.label, value: r.value })),
				temps: arr(e.temps).map((t) => ({ label: t.label, c: t.c, f: t.f })),
				faults: arr(e.faults).map((f) => ({ fault: f.fault, cause: f.cause, fix: f.fix })),
				brennans: arr(e.brennans).map((b) => ({ dish: b.dish, components: b.components, how: b.how })),
				seeAlso
			};
			if (isObj(e.quote)) body.quote = { text: e.quote.text, source: e.quote.source, year: e.quote.year };
			body.sources = arr(e.sources).map((s) => {
				/** @type {Loose} */
				const o = { title: s.title, url: s.url };
				for (const k of ['asOf', 'year', 'evidence']) if (s[k] !== undefined) o[k] = s[k];
				return o;
			});
			body.cards = arr(e.cards).map((c) => ({ id: cardId.get(c.stem), front: c.front, back: c.back }));
			body.questions = arr(e.questions).map((q) => ({
				id: ids.questions.get(`${e.stem}/${q.stem}`),
				q: q.q,
				answer: q.answer,
				distractors: q.distractors,
				why: q.why,
				teaches: cardId.get(q.teaches)
			}));
			return body;
		});
		/* What each cross reference is called, and the two addresses the refs
		   lack (a Cook at home dish's level, a Floor Deck card's section), so
		   an entry draws every See also row, and every From your sheets row, as
		   a named link without loading the files they come from. One table a
		   chapter. */
		/** @type {Record<string, Record<string, unknown>>} */
		const labels = {};
		/** @param {string} kind @param {string} slug @param {unknown} v */
		const label = (kind, slug, v) => {
			if (v === undefined || v === null) return;
			(labels[kind] ??= {})[slug] = v;
		};
		for (const b of bodies) {
			const see = /** @type {Record<string, string[]>} */ (b.seeAlso);
			for (const s of arr(see.techniques)) label('techniques', s, refs?.techniques.get(s));
			for (const s of arr(see.lexicon)) label('lexicon', s, refs?.lexicon.get(s));
			for (const s of arr(see.recipes)) label('recipes', s, refs?.recipes.get(s));
			for (const s of arr(see.plates)) label('plates', s, refs?.plates.get(s));
			/* From your sheets: each sheet term by its own name, as Your culinary terms prints it */
			for (const s of arr(see.terms)) label('terms', s, refs?.foundations.get(s));
			for (const s of arr(see.kitchen)) {
				const t = refs?.kitchen.get(s);
				const lv = links?.kitchen.get(s);
				if (t && lv) label('kitchen', s, [t, lv]);
			}
			for (const s of arr(see.deck)) {
				const t = refs?.deck.get(s);
				const sec = links?.deck.get(s);
				if (t && sec) label('deck', s, [t, sec]);
			}
			for (const x of arr(b.brennans)) nameDish(x.dish);
		}
		/** @type {Loose} */
		const sortedLabels = {};
		for (const k of Object.keys(labels).sort()) sortedLabels[k] = Object.fromEntries(Object.keys(labels[k]).sort().map((s) => [s, labels[k][s]]));
		const steps = arr(file?.steps).map((s) => {
			const id = /** @type {string} */ (ids.steps.get(s.stem));
			stepHeads.push({ id, chapter: meta.key, entry: idOf(s.entry), title: s.title });
			/** @type {Loose} */
			const o = { id, entry: idOf(s.entry), title: s.title, prompt: s.prompt, steps: s.steps };
			if (s.distractor !== undefined) o.distractor = s.distractor;
			o.why = s.why;
			return o;
		});
		/** @param {Loose} m @param {string | null} from */
		const matchBody = (m, from) => {
			const id = /** @type {string} */ (ids.matches.get(m.stem));
			matchHeads.push(from ? { id, chapter: meta.key, title: m.title, pairs: m.pairs.length, generated: from } : { id, chapter: meta.key, title: m.title, pairs: m.pairs.length });
			/** @type {Loose} */
			const o = {
				id,
				title: m.title,
				prompt: m.prompt,
				left: m.left,
				right: m.right,
				pairs: arr(m.pairs).map((p) => (p.length > 2 && idOf(p[2]) ? [p[0], p[1], idOf(p[2])] : [p[0], p[1]]))
			};
			if (from) o.generated = from;
			return o;
		};
		const matches = [...arr(file?.match).map((m) => matchBody(m, null)), ...gen.map((g) => matchBody(g, g.from))];
		const has = bodies.length || steps.length || matches.length;
		const fileName = has ? `ch-${meta.key}.json` : null;
		chapters.push({
			key: meta.key,
			title: meta.title,
			intro: meta.intro,
			file: fileName,
			entries: bodies.length,
			cards: bodies.reduce((n, b) => n + b.cards.length, 0),
			questions: bodies.reduce((n, b) => n + b.questions.length, 0),
			steps: steps.length,
			matches: matches.length
		});
		if (fileName) {
			out.set(path.join(OUT_DIR, fileName), JSON.stringify({ version: 1, key: meta.key, title: meta.title, intro: meta.intro, entries: bodies, steps, matches, labels: sortedLabels }) + '\n');
		}
	}

	for (const n of treeNodes(set.tree)) for (const d of arr(n.node.dishes)) nameDish(d?.dish);
	for (const r of arr(set.ladder?.rungs)) for (const d of arr(r?.dishes)) nameDish(d?.dish);

	/** @param {Map<string, string[]>} m */
	const sorted = (m) => Object.fromEntries([...m.keys()].sort().map((k) => [k, /** @type {string[]} */ (m.get(k))]));
	/** @type {Loose} */
	const index = {
		version: 1,
		complete: CUISINE_COMPLETE,
		draft: !!opts.draft,
		levels: LEVEL_NAMES,
		chapters,
		entries: heads,
		cards: cardRows,
		questions: questionRows,
		steps: stepHeads,
		matches: matchHeads,
		tree: emittedTree(set),
		ladder: set.ladder,
		byTechnique: sorted(byTechnique),
		byDish: sorted(byDish),
		dishes: Object.fromEntries([...dishNames.keys()].sort().map((k) => [k, dishNames.get(k)]))
	};
	if (opts.draft) {
		const written = new Set(entries.map(({ e }) => e.slug));
		/** @type {Set<string>} */
		const pending = new Set();
		for (const { e } of entries) for (const s of arr(e.seeAlso?.entries)) if (!written.has(s)) pending.add(s);
		for (const f of set.files.values()) {
			for (const s of arr(f.steps)) if (!written.has(s.entry)) pending.add(s.entry);
			for (const m of arr(f.match)) for (const p of arr(m.pairs)) if (p[2] && !written.has(p[2])) pending.add(p[2]);
		}
		index.pending = [...pending].sort();
	}
	out.set(path.join(OUT_DIR, 'index.json'), JSON.stringify(index) + '\n');
	return out;
}

/**
 * The tree as authored, with each mother that leaves out its name named by
 * its entry's title, so the screens never join for it.
 * @param {CuisineSet} set
 */
function emittedTree(set) {
	if (!isObj(set.tree) || !Array.isArray(set.tree.mothers)) return set.tree;
	const titles = entryTitles(set);
	return {
		...set.tree,
		mothers: set.tree.mothers.map((/** @type {unknown} */ m) => (isObj(m) && m.name === undefined && typeof m.entry === 'string' && titles.has(m.entry) ? { name: titles.get(m.entry), ...m } : m))
	};
}

/**
 * One whole run, in memory: the contract, the ids, the files.
 * @param {{ mint?: boolean, draft?: boolean, today?: string, set?: CuisineSet, refs?: Refs, ledger?: Ledger, links?: Links }} [opts]
 */
export function build(opts = {}) {
	const set = opts.set ?? loadSet();
	const refs = opts.refs ?? loadRefs();
	const { problems, generated } = checkSet(set, refs, { draft: opts.draft, today: opts.today });
	const assigned = assignIds(set, generated.made, opts.ledger ?? readLedger(), { mint: opts.mint });
	problems.push(...assigned.problems);
	const files = problems.length ? new Map() : derive(set, generated.made, assigned.ids, { draft: opts.draft, refs, links: opts.links ?? loadLinks() });
	return { set, refs, problems, generated, files, ledger: assigned.ledger, minted: assigned.minted, ids: assigned.ids };
}

/** @param {Map<string, string>} files @returns {string[]} the paths that differ from disk */
export function stale(files) {
	/** @type {string[]} */
	const bad = [];
	for (const [p, text] of files) {
		const now = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
		if (now !== text) bad.push(rel(p));
	}
	if (fs.existsSync(OUT_DIR)) {
		for (const f of fs.readdirSync(OUT_DIR)) if (!files.has(path.join(OUT_DIR, f))) bad.push(`${rel(path.join(OUT_DIR, f))} (no longer emitted)`);
	}
	return bad;
}

/* ── the authoring helpers validate.mjs and merge.mjs share ──────────────── */

/**
 * A chapter's draft parts, tools/cuisine/out/<chapter>/*.json in name order.
 * @param {string} chapter
 * @returns {{ parts: Array<{ file: string, data: Loose }>, problems: Problem[] }}
 */
export function readParts(chapter) {
	const dir = path.join(PARTS_DIR, chapter);
	/** @type {Array<{ file: string, data: Loose }>} */
	const parts = [];
	/** @type {Problem[]} */
	const problems = [];
	if (!fs.existsSync(dir)) return { parts, problems };
	for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
		const p = path.join(dir, f);
		try {
			const data = readJson(p);
			if (!isObj(data)) problems.push({ path: rel(p), message: 'a part is { entries, steps?, match? }' });
			else {
				const extra = Object.keys(data).filter((k) => !PART_KEYS.includes(k) && !['key', 'title', 'intro'].includes(k));
				if (extra.length) problems.push({ path: rel(p), message: `unknown key(s) ${extra.join(', ')}; a part is { entries, steps?, match? }` });
				parts.push({ file: rel(p), data });
			}
		} catch (err) {
			problems.push({ path: rel(p), message: `not JSON (${err instanceof Error ? err.message : String(err)})` });
		}
	}
	return { parts, problems };
}

/**
 * A chapter file from the existing one and its parts: a part's entry, steps
 * set or match replaces the existing one of the same stem, two parts naming
 * one stem are refused, and the entries are put in roster order (the rest
 * after, in the order met). Key, title and intro come from chapters.json.
 *
 * @param {ChapterMeta} meta
 * @param {Loose | null} existing
 * @param {Array<{ file: string, data: Loose }>} parts
 * @param {import('./cuisine-contract.mjs').RosterRow[] | null} roster
 * @returns {{ file: Loose, problems: Problem[], added: string[], replaced: string[] }}
 */
export function mergeChapter(meta, existing, parts, roster) {
	/** @type {Problem[]} */
	const problems = [];
	/** @type {string[]} */
	const added = [];
	/** @type {string[]} */
	const replaced = [];
	/** @type {Record<'entries' | 'steps' | 'match', Map<string, Loose>>} */
	const lists = { entries: new Map(), steps: new Map(), match: new Map() };
	for (const k of /** @type {const} */ (['entries', 'steps', 'match'])) for (const x of arr(existing?.[k])) if (isObj(x) && typeof x.stem === 'string') lists[k].set(x.stem, x);
	/** @type {Record<string, string>} */
	const from = {};
	for (const { file, data } of parts) {
		for (const k of /** @type {const} */ (['entries', 'steps', 'match'])) {
			for (const x of arr(data[k])) {
				if (!isObj(x) || typeof x.stem !== 'string') {
					problems.push({ path: file, message: `an item of ${k} has no stem` });
					continue;
				}
				const key = `${k}:${x.stem}`;
				if (from[key]) {
					problems.push({ path: file, message: `the ${k === 'entries' ? 'entry' : k} stem "${x.stem}" is also in ${from[key]}: duplicate stems are refused` });
					continue;
				}
				from[key] = file;
				if (lists[k].has(x.stem)) replaced.push(key);
				else added.push(key);
				lists[k].set(x.stem, x);
			}
		}
	}
	const order = (roster ?? []).filter((r) => r.chapter === meta.key);
	/** @param {Loose} e */
	const rank = (e) => {
		const i = order.findIndex((r) => r.stem === e.stem || r.slug === e.slug);
		return i < 0 ? Number.MAX_SAFE_INTEGER : i;
	};
	const entries = [...lists.entries.values()].map((e, i) => ({ e, i })).sort((a, b) => rank(a.e) - rank(b.e) || a.i - b.i).map((x) => x.e);
	return {
		file: { key: meta.key, title: meta.title, intro: meta.intro, entries, steps: [...lists.steps.values()], match: [...lists.match.values()] },
		problems,
		added,
		replaced
	};
}

/** @param {unknown} v */
export const chapterText = (v) => JSON.stringify(v, null, '\t') + '\n';

/** @param {number} n */
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
	const args = process.argv.slice(2);
	if (args.includes('--help')) {
		console.log(`node tools/derive/cuisine.mjs [--mint] [--draft] [--check] [--today YYYY-MM-DD]
node tools/derive/cuisine.mjs --retire <kind>:<key> --reason <text>

Proves tools/derive/cuisine/ by tools/derive/cuisine-contract.mjs, takes ids from
tools/derive/cuisine.ledger.json and writes src/lib/data/cuisine/index.json and
ch-<key>.json. Exits 1 naming every problem and writes nothing.
  --mint    mint an id for every key the ledger lacks (and write the ledger)
  --draft   accept references to slugs planned in tools/cuisine/roster.json
  --check   write nothing; exit 1 naming each emitted file that differs
  --retire  move a ledger key to retired (kinds: ${ID_KINDS.join(', ')})`);
		process.exit(0);
	}
	/** @param {string} flag */
	const value = (flag) => {
		const i = args.indexOf(flag);
		return i >= 0 ? args[i + 1] : undefined;
	};
	const retire = value('--retire');
	if (retire) {
		const [kind, ...rest] = retire.split(':');
		const key = rest.join(':');
		const reason = value('--reason');
		const ledger = readLedger();
		if (!ID_KINDS.includes(/** @type {IdKind} */ (kind)) || !key) {
			console.error(`cuisine: --retire takes <kind>:<key>, kind one of ${ID_KINDS.join(', ')}`);
			process.exit(1);
		}
		const id = ledger[/** @type {IdKind} */ (kind)][key];
		if (!id) {
			console.error(`cuisine: the ledger has no ${kind}:${key}`);
			process.exit(1);
		}
		if (!reason) {
			console.error('cuisine: --retire needs --reason "<why>"');
			process.exit(1);
		}
		delete ledger[/** @type {IdKind} */ (kind)][key];
		ledger.retired[`${kind}:${key}`] = { id, reason };
		fs.writeFileSync(LEDGER_FILE, ledgerText(ledger));
		console.log(`cuisine: retired ${kind}:${key} (${id})`);
		process.exit(0);
	}
	const mint = args.includes('--mint');
	const draft = args.includes('--draft');
	let result;
	try {
		result = build({ mint, draft, today: value('--today') });
	} catch (err) {
		console.error(`cuisine: ${err instanceof Error ? err.message : String(err)}`);
		process.exit(1);
	}
	if (result.problems.length) {
		console.error(`cuisine: ${result.problems.length} problem(s); nothing written:`);
		for (const p of result.problems) console.error(`  ${formatProblem(p)}`);
		process.exit(1);
	}
	if (args.includes('--check')) {
		const bad = stale(result.files);
		if (bad.length) {
			console.error(`cuisine: stale, run node tools/derive/cuisine.mjs:\n  ${bad.join('\n  ')}`);
			process.exit(1);
		}
		console.log('cuisine: every emitted file matches its source.');
		process.exit(0);
	}
	if (mint && result.minted.length) {
		fs.writeFileSync(LEDGER_FILE, ledgerText(result.ledger));
		console.log(`cuisine: minted ${result.minted.length} id(s) into ${rel(LEDGER_FILE)}`);
	}
	fs.mkdirSync(OUT_DIR, { recursive: true });
	for (const f of fs.readdirSync(OUT_DIR)) {
		const p = path.join(OUT_DIR, f);
		if (f.endsWith('.json') && !result.files.has(p)) {
			fs.unlinkSync(p);
			console.log(`cuisine: removed ${rel(p)} (no longer emitted)`);
		}
	}
	let raw = 0;
	let gz = 0;
	for (const [p, text] of result.files) {
		const before = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
		if (before !== text) fs.writeFileSync(p, text);
		const bytes = Buffer.byteLength(text);
		const zipped = zlib.gzipSync(text, { level: 9 }).length;
		raw += bytes;
		gz += zipped;
		console.log(`cuisine: ${before === text ? 'same' : 'wrote'} ${rel(p)}  ${kb(bytes)}, ${kb(zipped)} gzipped`);
	}
	const entries = allEntries(result.set);
	const count = (/** @type {string} */ k) => entries.reduce((n, { e }) => n + (Array.isArray(e[k]) ? e[k].length : 0), 0);
	const steps = [...result.set.files.values()].reduce((n, f) => n + (Array.isArray(f.steps) ? f.steps.length : 0), 0);
	const authored = [...result.set.files.values()].reduce((n, f) => n + (Array.isArray(f.match) ? f.match.length : 0), 0);
	const byLevel = [1, 2, 3, 4].map((l) => `${LEVEL_NAMES[/** @type {1|2|3|4} */ (l)]} ${entries.filter(({ e }) => e.level === l).length}`).join(', ');
	console.log(`cuisine: ${result.set.files.size} of ${CHAPTER_KEYS.length} chapters written; ${entries.length} entries (${byLevel}), ${count('cards')} cards, ${count('questions')} questions, ${steps} steps set(s), ${authored} authored and ${result.generated.made.length} generated match(es)`);
	for (const s of result.generated.skipped) console.log(`cuisine: the generated set ${s.stem} is skipped until it can field ${LIMITS.pairs[0]} pairs (it has ${s.pairs})`);
	console.log(`cuisine: total ${kb(raw)}, ${kb(gz)} gzipped`);
}
