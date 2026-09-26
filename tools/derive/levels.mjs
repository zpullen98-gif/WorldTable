/**
 * The four levels: the whole app's ladder, and the ONE place its names and
 * blurbs are written.
 *
 * ## What it is
 *
 * The home is four level cards, each level the same seven subsections at that
 * level's difficulty (Dishes, Techniques, The Lexicon, The Floor Deck, The
 * Palate, Food Safety, Service), and training from there. The Floor Deck's
 * brigade ladder (DECK_LEVELS in floor-deck.mjs: Commis, Chef de Partie, Sous
 * Chef, Chef) is now the whole app's, and the names here are gated equal to
 * it. Nothing is locked; a reader is GUIDED, and any level can be opened at
 * any time.
 *
 * ## What is placed, and by whom
 *
 * Every item of six subsections carries a level, decided by agents against the
 * written standard in tools/levels/README.md (an assigner, a challenger from
 * the floor and the stove, a reconciler per chunk, then one cross-subsection
 * critic with one bounded repair), and written into the authored files beside
 * this module (tools/derive/levels/<subsection>.json) by
 * tools/levels/set-levels.mjs, the one serializer, which decides nothing. The
 * files are hand-editable afterwards; the reasons are in them.
 *
 *   dishes      the 45 course dishes (the Path of Study's semesters)
 *   techniques  the 112 techniques of the table
 *   lexicon     the Lexicon's terms OUTSIDE the service track (593)
 *   service     the 27 modules of the service track; a module's 186 term
 *               cards inherit its level through moduleTerms
 *   palate      the 8 faults of the repair table
 *   safety      the 26 read slices of the sanitation entry: never counted,
 *               only read, so the level page can say what to read
 *
 * NOT placed here: the 281 deck cards, which carry their own level in their
 * section modules and are COPIED from the deck index at build (gated equal);
 * the 1,844 library recipes (the level page's library door uses the gated
 * `difficulty` as a proxy); and the six calibration tastes, which follow a
 * fixed rule (met at the rung the level names, PALATE_RUNG in the engine).
 *
 * ## The gate
 *
 * Every placed item is placed exactly once and is a real item; a placement
 * for a slug the build no longer has fails it, and once LEVELS_COMPLETE is on,
 * so does new content with no placement, and so does a level under its
 * minimums. The universe is computed HERE, from the built objects, and the
 * authoring tools read the same function over the emitted files, so the two
 * cannot drift. The build reads the authored files and never writes them
 * (build-integrity.test.ts pins the build to two writeFileSync sites).
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DECK_LEVELS } from './floor-deck.mjs';
import { LEVELS as LEVEL_KEYS } from './floor-deck-contract.mjs';
import { LADDERS } from './calibration.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PLACEMENTS_DIR = join(HERE, 'levels');

/**
 * The four levels, named as the deck names them (gated below) and described
 * for the WHOLE app: what a cook is asked to know at that level, never who
 * the reader is. Sixty to one hundred and sixty characters, no digit, no
 * dash: a test pins it, because the home prints these under the names.
 */
export const LEVELS = [
	{ level: 1, name: 'Commis',
		blurb: 'The first weeks in a kitchen: the everyday words, the staples handled on day one and the techniques that carry the most dishes.' },
	{ level: 2, name: 'Chef de Partie',
		blurb: 'Running a station: the mother sauces and the braise, the cuts and the fish case, and the words a menu expects a sentence for.' },
	{ level: 3, name: 'Sous Chef',
		blurb: 'Running the pass: the classical vocabulary, the techniques whose standard governs a whole service and the numbers a sous reads.' },
	{ level: 4, name: 'Chef',
		blurb: 'Owning the menu: the rare and the deeply classical, the techniques nobody drills by accident and the finance behind the room.' }
];

/**
 * The seven subsections, in the order a level page lists them. `placed`
 * subsections have an authored file; the deck is copied. `counted` ones make
 * the level's figure; Food Safety is read and never graded, and the page says
 * so in place of a figure.
 */
export const SUBSECTIONS = [
	{ key: 'dishes', title: 'Dishes', counted: true, placed: true },
	{ key: 'techniques', title: 'Techniques', counted: true, placed: true },
	{ key: 'lexicon', title: 'The Lexicon', counted: true, placed: true },
	{ key: 'deck', title: 'The Floor Deck', counted: true, placed: false },
	{ key: 'palate', title: 'The Palate', counted: true, placed: true },
	{ key: 'safety', title: 'Food Safety', counted: false, placed: true },
	{ key: 'service', title: 'Service', counted: true, placed: true }
];

export const PLACED = SUBSECTIONS.filter((s) => s.placed).map((s) => s.key);

/**
 * The fewest items a level may hold in each subsection, once complete. No
 * quotas, minimums only: the level test asks eight Lexicon questions and six
 * service questions, a deck test is fourteen cards (the contract's levelMin),
 * and a level page with one dish or one technique on it teaches nothing.
 * `service` counts TERMS (through the modules placed there), not modules.
 */
export const MINIMUMS = { dishes: 6, techniques: 8, lexicon: 8, deck: 14, palate: 2, safety: 1, service: 6 };

/** Preferred, printed and never failed: a Lexicon level with twenty terms
 *  gives the quiz somewhere to go after the first round. */
export const LEXICON_PREFERRED = 20;

/** Flip to true when every placed subsection has been placed. From then on an
 *  item with no level and a level under its minimums fail the build. */
export const LEVELS_COMPLETE = true;

/** The safety slices' own headings are in the guide's capitals; these two
 *  stay as they are when the rest is put into sentence case. */
const ACRONYMS = new Set(['FIFO', 'HACCP']);

/** "THE DANGER ZONE" -> "The danger zone"; "FIFO" stays.
 *  @param {string} s */
export function sentenceCase(s) {
	return String(s)
		.split(' ')
		.map((w, i) => (ACRONYMS.has(w) ? w : i === 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
		.join(' ');
}

/**
 * The authored placements for one subsection, as they are on disk. Missing is
 * fatal, never defaulted: an absent file would call every item unplaced at
 * best, and at worst let a subsection ship with no level at all.
 *
 * @param {string} key
 * @returns {Array<{ slug: string, level: number, reason: string }>}
 */
export function readPlacements(key) {
	const file = join(PLACEMENTS_DIR, `${key}.json`);
	if (!existsSync(file)) throw new Error(`BUILD INPUT MISSING: ${file}`);
	const rows = JSON.parse(readFileSync(file, 'utf8'));
	if (!Array.isArray(rows)) throw new Error(`${file}: not an array of placements`);
	return rows;
}

/**
 * Every item a level can hold, per placed subsection, with the signals the
 * standard weighs. Pure over the BUILT objects: build-data passes what it has
 * just built, the tools pass the emitted files, and both see one universe.
 *
 * @param {{
 *   study: Array<{ n: number, title: string, recipes: string[], terms: string[] }>,
 *   techniques: Array<{ slug: string, label: string, definition: string | null, chapters: number, semesters: Array<{ n: number }>, recipes: string[], lexiconSlug: string | null, lexiconTerm: string | null }>,
 *   lexicon: Array<{ slug: string, term: string, category: string, definition: string, recipes: string[] }>,
 *   serviceTrack: { modules: Array<{ key: string, n: number, title: string, outcome: string, terms: Array<{ slug: string, term: string, category: string }> }> },
 *   palate: { faults: Array<{ slug: string, label: string, symptom: string }> },
 *   sanitation: { clauses: Array<{ key: string, anchor: string, text: string }>, facts: Array<{ key: string, anchor: string, evidence: string }>, numeric: Array<{ key: string, label: string, anchor: string, evidence: string }>, gaps: Array<{ key: string, named: string, gap: string }> },
 *   deckIndex: { byLexicon: Record<string, string[]>, cards: Array<{ id: string, level: number }> },
 *   recipes: Array<{ slug: string, name: string, chapter: string, course: string, difficulty: number, minutes: number }>,
 *   techniqueStandards: Array<{ slug: string }>
 * }} ctx
 */
export function universe(ctx) {
	const { study, techniques, lexicon, serviceTrack, palate, sanitation, deckIndex, recipes, techniqueStandards } = ctx;
	const recipe = new Map(recipes.map((r) => [r.slug, r]));
	const cardLevel = new Map(deckIndex.cards.map((c) => [c.id, c.level]));
	/** lexicon slug -> the LOWEST level of a deck card naming it
	 *  @param {string} slug */
	const deckLevelOf = (slug) => {
		const ids = deckIndex.byLexicon[slug];
		if (!ids?.length) return null;
		return Math.min(...ids.map((id) => cardLevel.get(id) ?? 4));
	};
	const standard = new Set(techniqueStandards.map((s) => s.slug));
	const techniquesOf = new Map();
	for (const t of techniques) for (const r of t.recipes) (techniquesOf.get(r) ?? techniquesOf.set(r, []).get(r)).push(t.label);
	const semestersOfTerm = new Map();
	for (const s of study) for (const term of s.terms) (semestersOfTerm.get(term) ?? semestersOfTerm.set(term, []).get(term)).push(s.n);
	const anchorOf = new Map(techniques.filter((t) => t.lexiconSlug).map((t) => [t.lexiconSlug, t.label]));
	/** @param {unknown} s */
	const opens = (s) => String(s ?? '').replace(/\s+/g, ' ').slice(0, 160);

	const dishes = [];
	for (const s of study) {
		for (const slug of s.recipes) {
			const r = recipe.get(slug);
			dishes.push({
				slug,
				name: r?.name ?? slug,
				semester: s.n,
				semesterTitle: s.title,
				difficulty: r?.difficulty ?? null,
				minutes: r?.minutes ?? null,
				chapter: r?.chapter ?? null,
				course: r?.course ?? null,
				techniques: (techniquesOf.get(slug) ?? []).slice(0, 4)
			});
		}
	}

	const techniqueRows = techniques.map((t) => ({
		slug: t.slug,
		label: t.label,
		recipeCount: t.recipes.length,
		chapters: t.chapters,
		semesters: t.semesters.map((s) => s.n),
		standard: standard.has(t.slug),
		lexiconSlug: t.lexiconSlug,
		deckLevel: t.lexiconSlug ? deckLevelOf(t.lexiconSlug) : null,
		opens: opens(t.definition)
	}));

	const track = new Set(serviceTrack.modules.flatMap((m) => m.terms.map((t) => t.slug)));
	const lexiconRows = lexicon
		.filter((e) => !track.has(e.slug))
		.map((e) => ({
			slug: e.slug,
			term: e.term,
			category: e.category,
			recipeCount: e.recipes.length,
			deckLevel: deckLevelOf(e.slug),
			semesters: semestersOfTerm.get(e.slug) ?? [],
			techniqueAnchor: anchorOf.get(e.slug) ?? null,
			opens: opens(e.definition)
		}));

	const service = serviceTrack.modules.map((m) => {
		/** @type {Record<string, number>} */
		const categories = {};
		for (const t of m.terms) categories[t.category] = (categories[t.category] ?? 0) + 1;
		return { slug: m.key, n: m.n, title: m.title, outcome: m.outcome, termCount: m.terms.length, categories, terms: m.terms.map((t) => t.term) };
	});

	const palateRows = palate.faults.map((f) => ({ slug: f.slug, label: f.label, symptom: f.symptom }));

	const safety = [
		...sanitation.clauses.map((c) => ({ slug: `clause:${c.key}`, kind: 'clause', label: sentenceCase(c.key), anchor: c.anchor, text: c.text })),
		...sanitation.facts.map((f) => ({ slug: `fact:${f.key}`, kind: 'fact', label: f.evidence[0].toUpperCase() + f.evidence.slice(1), anchor: f.anchor, text: f.evidence })),
		...sanitation.numeric.map((n) => ({ slug: `numeric:${n.key}`, kind: 'numeric', label: n.label, anchor: n.anchor, text: n.evidence })),
		...sanitation.gaps.map((g) => ({ slug: `gap:${g.key}`, kind: 'gap', label: g.named[0].toUpperCase() + g.named.slice(1), anchor: 'safety', text: g.gap }))
	];

	return { dishes, techniques: techniqueRows, lexicon: lexiconRows, service, palate: palateRows, safety };
}

/** The display name of a universe row, whatever the subsection calls it.
 *  @param {Record<string, any>} row */
export const rowName = (row) => row.name ?? row.label ?? row.term ?? row.title ?? row.slug;

/** @typedef {{ slug: string, level: number, reason: string }} Placement */
/** @typedef {ReturnType<typeof universe>} Universe */

/**
 * Check one subsection's placements against its universe. Returns problems
 * and, when there are none, the slugs per level in universe order.
 *
 * @param {string} key
 * @param {Array<{ slug: string, level: number, reason: string }>} rows
 * @param {Array<{ slug: string }>} items
 * @param {{ complete?: boolean }} [opts]
 */
export function checkPlacements(key, rows, items, opts = {}) {
	const complete = opts.complete ?? LEVELS_COMPLETE;
	const problems = [];
	const known = new Map(items.map((it) => [it.slug, it]));
	const placed = new Map();
	for (const p of rows) {
		const where = `levels/${key}.json ${JSON.stringify(p?.slug)}`;
		if (!p || typeof p !== 'object' || typeof p.slug !== 'string') {
			problems.push(`levels/${key}.json: a placement is not { slug, level, reason }`);
			continue;
		}
		if (!known.has(p.slug)) problems.push(`${where}: not an item of ${key} in this build; a placement is for something a reader can meet`);
		if (placed.has(p.slug)) problems.push(`${where}: placed twice`);
		if (!LEVEL_KEYS.includes(p.level)) problems.push(`${where}: level ${JSON.stringify(p.level)} is not one of ${LEVEL_KEYS.join(', ')}`);
		if (typeof p.reason !== 'string' || p.reason.trim().length < 12) problems.push(`${where}: carries no reason; the file is the only record of why an item sits where it does`);
		placed.set(p.slug, p.level);
	}
	if (complete) {
		for (const it of items) {
			if (!placed.has(it.slug)) problems.push(`levels/${key}.json: ${JSON.stringify(it.slug)} (${rowName(it)}) has no level. Every item of ${key} carries one: place it with tools/levels/set-levels.mjs`);
		}
	}
	/** @type {Record<string, string[]>} */
	const byLevel = Object.fromEntries(LEVEL_KEYS.map((l) => [String(l), []]));
	for (const it of items) {
		const level = placed.get(it.slug);
		if (level !== undefined && LEVEL_KEYS.includes(level)) byLevel[String(level)].push(it.slug);
	}
	return { problems, byLevel, placedCount: placed.size };
}

/** The names equal the deck's, the blurbs read as a level's own line. */
export function checkLevelNames() {
	const problems = [];
	LEVELS.forEach((l, i) => {
		const deck = DECK_LEVELS[i];
		if (!deck || deck.level !== l.level || deck.name !== l.name) {
			problems.push(`levels: level ${l.level} is named ${JSON.stringify(l.name)} here and ${JSON.stringify(deck?.name)} in DECK_LEVELS; the ladder has one set of names`);
		}
		if (typeof l.blurb !== 'string' || l.blurb.length < 60 || l.blurb.length > 160) problems.push(`levels: the blurb for ${l.name} is ${l.blurb?.length ?? 0} chars; 60 to 160`);
		if (/\d/.test(l.blurb)) problems.push(`levels: the blurb for ${l.name} carries a digit`);
		if (/[–—]| -- /.test(l.blurb)) problems.push(`levels: the blurb for ${l.name} carries a dash`);
		if (/\d/.test(l.name)) problems.push(`levels: the name ${JSON.stringify(l.name)} carries a digit`);
	});
	if (LEVELS.length !== LEVEL_KEYS.length) problems.push(`levels: ${LEVELS.length} levels against ${LEVEL_KEYS.length} keys`);
	return problems;
}

/**
 * Late stage: the placements against the universe, the deck copied from its
 * index, and the emitted shape.
 *
 * @param {Parameters<typeof universe>[0]} ctx
 */
export function buildLevels(ctx) {
	const problems = checkLevelNames();
	const uni = universe(ctx);

	/** @type {Record<string, Record<string, string[]>>} */
	const items = {};
	for (const key of PLACED) {
		/** @type {Placement[]} */
		let rows = [];
		try {
			rows = readPlacements(key);
		} catch (e) {
			problems.push(String(/** @type {any} */ (e)?.message ?? e));
		}
		const checked = checkPlacements(key, rows, uni[/** @type {keyof Universe} */ (key)]);
		problems.push(...checked.problems);
		items[key] = checked.byLevel;
	}

	/* The deck is copied, never re-placed: a card's level lives in its section
	   module and the deck's own contract holds it. Every level of the deck
	   index appears here exactly as it is there, and a test pins the parity. */
	items.deck = Object.fromEntries(LEVEL_KEYS.map((l) => [String(l), ctx.deckIndex.cards.filter((c) => c.level === l).map((c) => c.id)]));

	/** module key -> its term slugs, so Service counts terms and the level
	 *  test draws them without loading the track for a list it already has */
	const moduleTerms = Object.fromEntries(ctx.serviceTrack.modules.map((m) => [m.key, m.terms.map((t) => t.slug)]));

	/** what the safety page needs to name each read slice */
	const safety = Object.fromEntries(uni.safety.map((s) => [s.slug, { label: s.label, anchor: s.anchor, kind: s.kind }]));

	/* prerendered counts: what "N at this level" prints, and what the gate
	   holds to the minimums. Service is counted in terms. */
	/** @type {Record<string, Record<string, number>>} */
	const counts = {};
	for (const l of LEVEL_KEYS) {
		/** @type {Record<string, number>} */
		const row = {};
		for (const s of SUBSECTIONS) {
			const slugs = items[s.key]?.[String(l)] ?? [];
			row[s.key] = s.key === 'service' ? slugs.reduce((n, k) => n + (moduleTerms[k]?.length ?? 0), 0) : slugs.length;
		}
		counts[String(l)] = row;
	}
	if (LEVELS_COMPLETE) {
		for (const l of LEVEL_KEYS) {
			for (const [key, min] of Object.entries(MINIMUMS)) {
				const n = counts[String(l)][key];
				if (n < min) problems.push(`levels: level ${l} holds ${n} of ${key}; every level holds at least ${min}`);
			}
		}
	}

	const levels = {
		version: 1,
		levels: LEVELS.map((l) => ({ level: l.level, name: l.name, blurb: l.blurb })),
		subsections: SUBSECTIONS.map((s) => ({ key: s.key, title: s.title, counted: s.counted })),
		items,
		moduleTerms,
		techniqueStandards: ctx.techniqueStandards.map((s) => s.slug),
		tastes: LADDERS.map((l) => l.taste),
		safety,
		counts
	};

	if (!problems.length) {
		const per = LEVEL_KEYS.map((l) => `${LEVELS[l - 1].name} ${SUBSECTIONS.map((s) => `${s.key} ${counts[String(l)][s.key]}`).join(', ')}`);
		console.log(`  levels: ${PLACED.length} subsections placed${LEVELS_COMPLETE ? ', COMPLETE' : ' (incomplete: unplaced items are allowed)'}, the deck copied (${ctx.deckIndex.cards.length} cards)`);
		for (const line of per) console.log(`    ${line}`);
		for (const l of LEVEL_KEYS) {
			if (counts[String(l)].lexicon < LEXICON_PREFERRED) console.log(`    note: level ${l} holds ${counts[String(l)].lexicon} Lexicon terms; ${LEXICON_PREFERRED} preferred`);
		}
	}
	return { levels, problems };
}
