/**
 * build-data.mjs — turn the raw extracted literals into the typed JSON the app
 * actually ships.
 *
 * This is where every regex that used to run at render time runs instead: once,
 * here, with its output committed. The payoff is that tuning a keyword table
 * shows up as a reviewable `git diff` over recipes.index.json rather than as a
 * behaviour change nobody can see, and the app never does 970 linear scans of a
 * 970-element array to paint a grid.
 *
 * Output (src/lib/data/):
 *   recipes.index.json  — RecipeSummary[], shipped eagerly for the grid
 *   recipes.full.json   — RecipeDetail[], lazy + precached for offline
 *   chapters.json       — ChapterRef[], the cuisine rail
 *   lexicon.json, pantry.json, study.json, substitutions.json, cellar.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reviveRegex } from './extract.mjs';
import { slugify, qualifiedSlugs } from './slugify.mjs';
import { deriveDiet } from './derive/diet.mjs';
import { deriveSeason } from './derive/season.mjs';
import { deriveEquipment } from './derive/equipment.mjs';
import { deriveFlavor } from './derive/flavor.mjs';
import { deriveCost } from './derive/cost.mjs';
import { derivePairing } from './derive/pairing.mjs';
import { deriveTechniques, deriveFilms } from './derive/films.mjs';
import { fullTechTable, LEXICON_ANCHOR, SUPPLEMENT } from './derive/technique-table.mjs';
import { buildCrosslinks } from './derive/crosslinks.mjs';
import { STANDARDS, MIN_MARKS, MAX_MARKS } from './derive/standards.mjs';
import {
	TECHNIQUE_STANDARDS,
	TECHNIQUE_GATE_MIN_RECIPES,
	JUDGED_BY_MAX
} from './derive/technique-standards.mjs';
import { buildPalate } from './derive/palate.mjs';
import { buildEconomics } from './derive/economics.mjs';
import { buildSanitation } from './derive/sanitation.mjs';
import { buildWaste } from './derive/waste.mjs';
import { buildServiceTrack } from './derive/service-track.mjs';
import { buildDrills } from './derive/drills.mjs';
import { buildStations } from './derive/stations.mjs';
import { LADDERS, CUPS, TRIALS, PASS_AT } from './derive/calibration.mjs';
import { stepService, recipeService, ADVANCE_MIN } from './derive/service.mjs';
import { derivePantryMap, narrowBlob } from './derive/pantry.mjs';
import MiniSearch from 'minisearch';
import { miniOptions } from '../src/lib/search-config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = join(ROOT, 'src', 'lib', 'data', 'raw');
const OUT = join(ROOT, 'src', 'lib', 'data');

const raw = (name) => reviveRegex(JSON.parse(readFileSync(join(RAW, `${name}.json`), 'utf8')));

const R = raw('R');
const D = raw('D');
const PANTRY = raw('PANTRY');
const STUDY = raw('STUDY');
const SUBS = raw('SUBS');
const CELLAR = raw('CELLAR');
const SEASON = raw('SEASON');
const RAIL_REGIONS = raw('RAIL_REGIONS');
const BOTTLE_NOTES = raw('BOTTLE_NOTES');
const EQUIP = raw('EQUIP');
const NOTE_DEFS = raw('NOTE_DEFS');
const F = raw('F');
const TEACHERS = raw('TEACHERS');
const DISH_FILMS = raw('DISH_FILMS');
const TECH = raw('TECH');

const overridesPath = join(OUT, 'overrides.json');
const OVERRIDES = existsSync(overridesPath)
	? JSON.parse(readFileSync(overridesPath, 'utf8'))
	: { recipes: {} };

/**
 * The backfill overlay: slug -> a rewritten "from the pass" note.
 *
 * The raw extraction stays byte-identical to the archived original (that is
 * what verify:data proves); improved notes live here and are applied before
 * the blobs are built, so flavor tags, seasons, cross-links and the search
 * index all re-derive from the richer text — exactly the ripple the backfill
 * is meant to cause, visible in the recipes.json diff.
 */
const notesPath = join(OUT, 'notes.json');
const NOTES = existsSync(notesPath) ? JSON.parse(readFileSync(notesPath, 'utf8')) : {};

// ── chapter classification ───────────────────────────────────────────────────
// 52 US-rail chapters, 11 thematic Atlas chapters, 31 world cuisines = 94.
const US_GROUP = new Map();
for (const [group, members] of RAIL_REGIONS) {
	for (const m of members) US_GROUP.set(m, group);
}

const ATLAS = new Set([
	'Dessert Atlas',
	'Seafood Atlas',
	'Breakfast Atlas',
	'Lunch Atlas',
	'Noodle Atlas',
	'Soup & Stew Atlas',
	'Street Food Atlas',
	'Holiday Feast Atlas',
	'Grill & BBQ Atlas',
	'The Bakery',
	'The Saucier'
]);

function classifyChapter(name) {
	if (US_GROUP.has(name)) return { kind: 'us', group: US_GROUP.get(name) };
	if (ATLAS.has(name)) return { kind: 'atlas', group: 'The Atlases' };
	return { kind: 'world', group: 'World Cuisines' };
}

// ── ingredient sections ──────────────────────────────────────────────────────
/**
 * Ported verbatim from the original's `isIngSection` (L1944) so the tagging
 * matches what the old app rendered. Difference: it runs once, here, instead of
 * on every render in three separate code paths.
 */
function isSectionHeader(s) {
	const t = String(s ?? '').trim();
	if (t.length < 4 || t.length > 40) return false;
	if (/[0-9]/.test(t)) return false;
	return t === t.toUpperCase() && /[A-Z]/.test(t);
}

const toIngredient = (line) =>
	isSectionHeader(line)
		? { kind: 'section', label: String(line).trim() }
		: { kind: 'item', text: line };

// ── step durations ───────────────────────────────────────────────────────────
/**
 * Ported from `stepDur` (L3407), with one deliberate change: the original
 * returned a default of 4 (minutes) when no duration was found, which the
 * service timeline then treated as a real measurement. Here "no duration stated"
 * is null, and the timeline supplies its own default — so the UI can tell the
 * difference between "4 minutes" and "we guessed".
 */
function stepDuration(text) {
	const m = String(text).match(/(\d+)\s*(?:[–-]\s*(\d+))?\s*(min|minute|h\b|hour)/i);
	if (!m) return null;
	let v = parseInt(m[2] || m[1], 10);
	if (m[3].toLowerCase().startsWith('h')) v *= 60;
	return Math.min(v, 600) * 60; // seconds
}

// ── build ────────────────────────────────────────────────────────────────────
const recipeSlugs = qualifiedSlugs(
	R,
	(r) => r.n,
	(r) => r.c
);
const lexSlugs = D.map((e) => slugify(e.t));

/** Notes with the backfill overlay applied — the text the app actually ships. */
const effNotes = R.map((r, i) => NOTES[recipeSlugs[i]] ?? r.p);

/** Lowercased searchable blob per recipe, built once and reused by every rule. */
const blobs = R.map(
	(r, i) => `${r.n} ${r.c} ${r.i.join(' ')} ${r.m.join(' ')} ${effNotes[i]}`.toLowerCase()
);

const pantryMap = derivePantryMap(R, blobs, PANTRY);

/**
 * Cross-links score WITHOUT the note. A term should link to recipes that use
 * it — in the name, the ingredients, the method — not to recipes whose margin
 * commentary mentions it. Scoring prose made links follow note richness, which
 * during the rolling backfill meant links followed backfill ORDER: the first
 * chapters rewritten swept the links (Italian hit 9.1% the moment its ten
 * notes landed). Method text is where technique terms actually live.
 */
const linkBlobs = R.map((r) => `${r.n} ${r.c} ${r.i.join(' ')} ${r.m.join(' ')}`.toLowerCase());

/** Name + ingredients only — the original's RTEXT. What the dish CONTAINS. */
const narrowBlobs = R.map((r) => narrowBlob(r));
const crosslinks = buildCrosslinks(R, recipeSlugs, D, lexSlugs, linkBlobs);

/**
 * Techniques score off linkBlobs — the same note-free text as cross-links, for
 * the same reason, which measurement caught before this shipped: with the note
 * in the blob, 111 tags existed ONLY because of note prose, 62 recipes were
 * tagged solely by their margin commentary, and the 320-note backfill had
 * silently minted 50 new tags. A recipe demonstrates braising because its
 * method braises, not because someone wrote the word in the margin. Scoring
 * prose would make the technique pages follow backfill order the way the
 * cross-links once followed it into Italian.
 *
 * deriveFilms deliberately keeps the full blob and the ORIGINAL table below:
 * film links are a curated set of twelve canon URLs plus searches, they are not
 * a claim about what the recipe demonstrates, and re-cutting them here would
 * churn 970 recipes' link lists for no gain.
 */
const TECH_ALL = fullTechTable(TECH);

/** The original's `isAmerican` (L3837): membership in any US rail region. */
const AMERICAN = new Set(RAIL_REGIONS.flatMap(([, members]) => members));
const isAmerican = (c) => AMERICAN.has(c);

const chapterCounts = new Map();
for (const r of R) chapterCounts.set(r.c, (chapterCounts.get(r.c) ?? 0) + 1);

const index = [];
const full = [];

/**
 * The sommelier's decision tree only has 41 distinct outcomes, but each one is
 * five strings of prose. Storing them inline 970 times costs ~280KB gzip for
 * nothing, so they go in a lookup table and each recipe keeps an index.
 */
const pairingTable = [];
const pairingIds = new Map();
function internPairing(p) {
	const key = JSON.stringify(p);
	if (!pairingIds.has(key)) {
		pairingIds.set(key, pairingTable.length);
		pairingTable.push(p);
	}
	return pairingIds.get(key);
}

/** Authored, not derived — see tools/derive/standards.mjs. */
const standardBySlug = new Map(STANDARDS.map((x) => [x.slug, x]));

R.forEach((r, i) => {
	const slug = recipeSlugs[i];
	const region = classifyChapter(r.c);
	const ov = OVERRIDES.recipes?.[slug] ?? {};

	const diet = { ...deriveDiet(r, blobs[i]), ...(ov.diet ?? {}) };
	const flavor = deriveFlavor(blobs[i], NOTE_DEFS);
	const techniques = ov.techniques ?? deriveTechniques(linkBlobs[i], TECH_ALL);

	index.push({
		slug,
		name: r.n,
		chapter: r.c,
		chapterSlug: slugify(r.c),
		course: r.k,
		difficulty: r.d,
		minutes: r.t,
		serves: ov.serves ?? 4,
		diet,
		costTier: ov.costTier ?? deriveCost(r, blobs[i]),
		flavorTags: flavor.tags,
		// Narrow text, like the original's RTEXT and like the pantry matcher:
		// seasonality is about what is IN the dish. A note remarking that a stew
		// "eats well against a peach salad" must not make it a summer recipe.
		season: ov.season ?? deriveSeason(narrowBlobs[i], SEASON, PANTRY),
		region,
		source: 'guide',
		noteChars: effNotes[i].length
	});

	full.push({
		slug,
		ingredients: r.i.map(toIngredient),
		// durationSec is the timer's number and is left exactly as it was; the
		// service split is additive. See tools/derive/service.mjs.
		steps: r.m.map((text) => ({ text, durationSec: stepDuration(text), ...stepService(text) })),
		note: effNotes[i],
		equipment: ov.equipment ?? deriveEquipment(r, EQUIP),
		techniques,
		flavor,
		pairingId: internPairing(ov.pairing ?? derivePairing(r, blobs[i], CELLAR, BOTTLE_NOTES, flavor.tags)),
		films: deriveFilms(r, blobs[i], { F, TEACHERS, DISH_FILMS, TECH }, isAmerican),
		lexiconTerms: crosslinks.recipeToTerms.get(slug) ?? [],
		pantryItems: pantryMap.get(i) ?? [],
		// Absent rather than empty for the 925 dishes with no standard yet:
		// the recipe page tests for the key, and an empty array would render
		// an empty block.
		...(standardBySlug.has(slug) ? { standard: standardBySlug.get(slug) } : {})
	});
});

const chapters = [...chapterCounts.entries()]
	.map(([name, count]) => {
		const { kind, group } = classifyChapter(name);
		return { name, slug: slugify(name), kind, group, count };
	})
	.sort((a, b) => a.name.localeCompare(b.name));

const lexicon = D.map((e, i) => ({
	slug: lexSlugs[i],
	term: e.t,
	category: e.c,
	definition: e.d,
	recipes: crosslinks.termToRecipes.get(lexSlugs[i]) ?? []
}));

const pantry = PANTRY.map((g) => ({
	group: g.g,
	items: g.items.map((it) => ({
		label: it.l,
		slug: slugify(it.l),
		keywords: it.k,
		blurb: it.d,
		season: SEASON[it.l] ?? []
	}))
}));

const nameToSlug = new Map(R.map((r, i) => [r.n, recipeSlugs[i]]));
const termToSlug = new Map(D.map((e, i) => [e.t, lexSlugs[i]]));

/**
 * The Path of Study, with the skills each semester actually teaches.
 *
 * The curriculum shipped with a reading list (Lexicon terms, authored) but no
 * account of its own technique content — so the semester titled "The Braise"
 * could not say that it drills searing harder than braising, which it does:
 * four of its five dishes sear, and a braise IS sear-then-simmer.
 *
 * Derived, not authored, so it can never drift from the dishes. `dishes` is how
 * many of that semester's recipes demonstrate the skill — the weight that makes
 * a semester's real emphasis visible.
 */
const recipeTechniques = new Map(full.map((d) => [d.slug, d.techniques]));

const study = STUDY.map((s, i) => {
	const recipes = s.r.map((n) => nameToSlug.get(n)).filter(Boolean);
	const counts = new Map();
	for (const slug of recipes) {
		for (const label of recipeTechniques.get(slug) ?? []) {
			counts.set(label, (counts.get(label) ?? 0) + 1);
		}
	}
	return {
		n: i + 1,
		title: s.t,
		description: s.d,
		recipes,
		terms: s.x.map((t) => termToSlug.get(t)).filter(Boolean),
		skills: [...counts.entries()]
			.map(([label, dishes]) => ({ slug: slugify(label), label, dishes }))
			.sort((a, b) => b.dishes - a.dishes || a.label.localeCompare(b.label))
	};
});

const substitutions = SUBS.map(([term, advice]) => ({ term, advice }));

const cellar = CELLAR.map((name) => ({
	name,
	slug: slugify(name),
	note: BOTTLE_NOTES[name] ?? ''
}));

/**
 * The technique index — every label the table produces, with the COMPLETE set
 * of recipes that demonstrate it.
 *
 * This is the mapping the guide never had. The Lexicon's technique entries are
 * capped at three recipes each by crosslinks.mjs (right for a definition card's
 * "see also", wrong as the only answer to "show me every braise"), so all 33
 * technique terms together reached 72 of 970 recipes. Here "Braising" carries
 * every recipe that braises, and borrows the Lexicon's prose to explain itself.
 *
 * Labels that tag nothing are dropped rather than shipped as empty pages. Five
 * of the original's entries never fire against this corpus — Gnocchi and
 * Boiling bagels because it contains no gnocchi and no bagel, which is not a
 * bug, just a table written for a wider guide than the one that shipped.
 */
const chapterOfSlug = new Map(index.map((r) => [r.slug, r.chapter]));
const techRecipes = new Map();
for (const d of full) {
	for (const label of d.techniques) {
		if (!techRecipes.has(label)) techRecipes.set(label, []);
		techRecipes.get(label).push(d.slug);
	}
}

/**
 * The anchored definition is COPIED here rather than looked up at render time.
 * lexicon.json is 453KB; making a leaf page parse all of it to show one
 * paragraph is the wrong trade on a phone, and the duplication is build-time
 * derived data that no human edits. 45 definitions, ~35KB, gzipped to nothing.
 */
const lexByAnchor = new Map(lexicon.map((e) => [e.slug, e]));

/** The Path, inverted: which semesters teach this skill. Closes the loop both ways. */
const semestersByLabel = new Map();
for (const s of study) {
	for (const skill of s.skills) {
		if (!semestersByLabel.has(skill.label)) semestersByLabel.set(skill.label, []);
		semestersByLabel.get(skill.label).push({ n: s.n, title: s.title });
	}
}

const techniques = TECH_ALL.map((x, i) => {
	const list = techRecipes.get(x.l) ?? [];
	const anchor = LEXICON_ANCHOR[x.l] ?? null;
	const term = anchor ? lexByAnchor.get(anchor) : null;
	return {
		slug: slugify(x.l),
		label: x.l,
		query: x.q ?? '',
		/** A verified canon film, where the original curated one. */
		film: x.u ?? null,
		/** The Lexicon term that defines this skill, when one does. */
		lexiconSlug: anchor,
		lexiconTerm: term ? term.term : null,
		definition: term ? term.definition : null,
		origin: i < TECH.length ? 'original' : 'supplement',
		chapters: new Set(list.map((s) => chapterOfSlug.get(s))).size,
		/** Semesters of the Path that teach this skill — empty for most of them. */
		semesters: semestersByLabel.get(x.l) ?? [],
		recipes: list
	};
})
	.filter((t) => t.recipes.length)
	.sort((a, b) => a.label.localeCompare(b.label));

/**
 * `judgedBy` — the technique standards a recipe is assessed against.
 *
 * 45 recipes carry a dish standard. The other 925 could be recorded as cooked
 * and nothing more, and 782 of those exercise at least one technique that now
 * has a written standard. This is the join that reaches them.
 *
 * A dish standard always wins. It is specific to the plate and it is read at
 * the pass; a technique standard is the fallback for everything else, read at
 * the pan. A recipe never carries both; see tools/derive/technique-standards.mjs.
 *
 * Ordered most-specific-first (ascending recipe count) and capped at
 * JUDGED_BY_MAX. Slugs only: the prose lives once in technique-standards.json
 * rather than being copied into 782 recipes, for the same reason the pairing
 * table is interned.
 */
const techStandardSlugs = new Set(TECHNIQUE_STANDARDS.map((x) => x.slug));
const techniqueRecipeCount = new Map(techniques.map((t) => [t.slug, t.recipes.length]));

for (const r of full) {
	if (r.standard) continue;
	const judged = (r.techniques ?? [])
		.map((label) => slugify(label))
		.filter((s) => techStandardSlugs.has(s))
		.sort((a, b) => techniqueRecipeCount.get(a) - techniqueRecipeCount.get(b))
		.slice(0, JUDGED_BY_MAX);
	// Absent rather than empty, matching `standard` above: the recipe page
	// tests for the key and an empty array would render an empty block.
	if (judged.length) r.judgedBy = judged;
}

/**
 * Shipped with the label and the count alongside the prose so the recipe page
 * can name the technique without importing techniques.json, which is 145KB and
 * carries every definition in the table.
 */
const techniqueStandards = TECHNIQUE_STANDARDS.map((x) => ({
	slug: x.slug,
	label: techniques.find((t) => t.slug === x.slug)?.label ?? x.slug,
	recipeCount: techniqueRecipeCount.get(x.slug) ?? 0,
	marks: x.marks,
	fault: x.fault
})).sort((a, b) => b.recipeCount - a.recipeCount);

// ── emit ─────────────────────────────────────────────────────────────────────
mkdirSync(OUT, { recursive: true });
const write = (file, value) => {
	writeFileSync(join(OUT, file), JSON.stringify(value, null, 2) + '\n', 'utf8');
	const kb = (JSON.stringify(value).length / 1024).toFixed(0);
	console.log(`  ${file.padEnd(24)} ${String(Array.isArray(value) ? value.length : '').padStart(5)}  ${kb.padStart(6)} KB`);
};

console.log('\n  build:data\n');
/**
 * The palate. Structure over the guide's own Repair Table rather than new
 * content — see tools/derive/palate.mjs for what is checked against what.
 */
const { palate, problems: palateProblems } = buildPalate(lexicon);

/**
 * Menu economics. Same treatment as the palate: the targets are the guide's and
 * the build fails if the prose stops supporting them.
 */
const { economics, problems: economicsProblems } = buildEconomics(lexicon);

/**
 * The waste log's vocabulary. Five reason codes, each carrying the phrase in the
 * guide that names it, and gated in REVERSE against the guide's own list of
 * leaks — so a leak it names that nothing carries fails the build rather than
 * quietly not existing. Theft and vendor creep are declared as refused rather
 * than omitted; see the module header for why a bin with a THEFT button on it
 * is the wrong instrument.
 */
const { waste, problems: wasteProblems } = buildWaste(lexicon);
if (waste) {
	console.log(
		`  waste: ${waste.reasons.length} reason codes, ${waste.excluded.length} leaks refused (${waste.excluded
			.map((e) => e.key)
			.join(', ')}), villain "${waste.villain}"`
	);
}

/**
 * Sanitation. Structure over the guide's two food-safety entries, and, the
 * unusual part — over its SILENCES: each gap asserts both that the guide still
 * names a practice and that it still states no figure for it, so nobody can
 * quietly fill a gap with invented regulatory content. Ships no per-recipe
 * hazard flag; see the module header for the five rules that were measured and
 * refused.
 */
const { sanitation, problems: sanitationProblems } = buildSanitation(
	lexicon,
	index.map((r) => r.slug)
);

/**
 * The service track. An authored teaching ORDER over the five front-of-house
 * atlases, referencing terms by slug; no definition is copied. Gated forward
 * (every reference resolves, exactly once) and in reverse (no front-of-house
 * term is left out of the track).
 */
const { serviceTrack, problems: serviceTrackProblems } = buildServiceTrack(
	lexicon,
	cellar,
	index.map((r) => r.slug)
);

/**
 * Drill prompts — the guide's definitions with the term redacted out of its own
 * question, gated in both directions. Built from the service track's modules,
 * so a term that leaves the track leaves the drill with it.
 */
const { drills, problems: drillProblems } = buildDrills(lexicon, serviceTrack.modules);

/**
 * The brigade's stations, and which technique belongs to which. The station
 * list is gated against the guide's own Brigade entry; the map is gated in
 * reverse, so a technique nobody accounts for fails the build rather than
 * becoming a hole in the coverage board.
 */
const { stations, problems: stationProblems } = buildStations(lexicon, techniques);

write('recipes.index.json', index);
write('recipes.full.json', full);
write('pairings.json', pairingTable);
write('chapters.json', chapters);
write('lexicon.json', lexicon);
write('pantry.json', pantry);
write('study.json', study);
write('substitutions.json', substitutions);
write('cellar.json', cellar);
write('techniques.json', techniques);
write('technique-standards.json', techniqueStandards);
write('palate.json', palate);
write('economics.json', economics);
write('waste.json', waste);
write('sanitation.json', sanitation);
write('service-track.json', serviceTrack);
write('drills.json', drills);
write('stations.json', stations);
write('calibration.json', {
	cups: CUPS,
	trials: TRIALS,
	passAt: PASS_AT,
	ladders: LADDERS
});



/**
 * The search index, prebuilt so the browser never pays tokenization cost.
 *
 * Fields mirror the ORIGINAL's search surface — name + ingredients (RTEXT,
 * L2746), plus chapter and flavor tags. The grid's substring fallback covers
 * only name/chapter/tags, which is how "lemongrass" went from 13 hits to 1
 * until this index existed. Document ids are positions in the recipes array.
 *
 * Written compact, not pretty-printed: it is a machine artifact ~10x the size
 * of any other data file, and nobody reviews a posting list by eye.
 */
const mini = new MiniSearch(miniOptions);
mini.addAll(
	R.map((r, i) => ({
		id: i,
		name: r.n,
		chapter: r.c,
		ingredients: r.i.join(' '),
		flavor: index[i].flavorTags.join(' '),
		technique: full[i].techniques.join(' ')
	}))
);
{
	const json = JSON.stringify(mini);
	writeFileSync(join(OUT, 'search-index.json'), json + '\n', 'utf8');
	console.log(`  ${'search-index.json'.padEnd(24)} ${'970'.padStart(5)}  ${(json.length / 1024).toFixed(0).padStart(6)} KB`);
}

// ── gates ────────────────────────────────────────────────────────────────────
const problems = [];

/**
 * The 970-row test. Those hand-authored `v` booleans are ground truth nobody had
 * to create, so we run the keyword tables against them — but we only fail on the
 * two classes of disagreement that are unambiguously *errors*, not judgement:
 *
 *   A. Marked vegetarian, yet an animal product appears with no stated
 *      alternative anywhere in the ingredients. Someone filtering for vegetarian
 *      would be served meat.
 *   B. Marked non-vegetarian, yet no animal keyword appears at all. Almost
 *      always a hole in the tables — this is what surfaced walleye, whitefish,
 *      geoduck, whelk, carnitas and hot dogs as missing words.
 *
 * The large middle class — the corpus disagreeing with itself about whether
 * "pork (or shiitake for veg)" counts, is reported, not failed. See the note in
 * derive/diet.mjs.
 */
const gateA = [];
const gateB = [];
const judgement = [];

R.forEach((r, i) => {
	const slug = recipeSlugs[i];
	if (OVERRIDES.recipes?.[slug]?.diet) return; // a human already ruled
	const d = deriveDiet(r, blobs[i]);
	const authored = Boolean(r.v);
	if (d.vegetarianStrict === authored) return;

	if (authored && !d.vegetarianStrict && !d.vegetarianOption) {
		gateA.push({ slug, name: r.n, chapter: r.c });
	} else if (!authored && d.vegetarianStrict && !d.vegetarianOption) {
		gateB.push({ slug, name: r.n, chapter: r.c, ingredients: r.i.join(' | ') });
	} else {
		judgement.push({ slug, name: r.n, chapter: r.c, authored });
	}
});

const fmt = (list) =>
	list.map((d) => `      ${d.name} (${d.chapter})  [${d.slug}]`).join('\n');

if (gateA.length) {
	problems.push(
		`${gateA.length} marked vegetarian but carry an animal product with no stated alternative:\n` +
			fmt(gateA)
	);
}
if (gateB.length) {
	problems.push(
		`${gateB.length} marked non-vegetarian but no animal keyword matched — likely a gap in the keyword tables:\n` +
			gateB.map((d) => `      ${d.name} (${d.chapter})\n        ${d.ingredients.slice(0, 160)}`).join('\n')
	);
}
if (judgement.length) {
	console.log(
		`  diet: ${judgement.length} substitution judgement calls (reported, not gated) — ` +
			`the corpus is inconsistent about "X (or Y for veg)"`
	);
}

/**
 * The vegan claim, gated — because it is an ASSERTION, not an omission.
 *
 * A missing allergen flag says "we did not find one". A Vegan badge says "there
 * is none", to a guest who is not going to read the ingredient list underneath
 * it. Those fail in opposite directions and only one of them is survivable.
 *
 * 16 recipes shipped `vegan: true` and `vegetarianOption: true` together, which
 * is a contradiction in the data's own terms — `vegetarianOption` means an
 * animal product IS named somewhere and only escaped. Escabecheng Isda, whose
 * first ingredient is a whole tilapia fried in oil, painted a Vegan badge.
 *
 * So: nothing flagged vegan may carry an animal word anywhere in its text,
 * escaped or not. Break this by dropping the `!vegetarianOption` clause in
 * derive/diet.mjs and it names all 16.
 */
{
	const veganLies = [];
	R.forEach((r, i) => {
		const slug = recipeSlugs[i];
		const d = OVERRIDES.recipes?.[slug]?.diet ?? deriveDiet(r, blobs[i]);
		if (!d.vegan) return;
		const carries = [];
		if (d.containsMeat) carries.push('meat');
		if (d.containsFish) carries.push('fish');
		if (d.containsShellfish) carries.push('shellfish');
		if (d.containsDairy) carries.push('dairy');
		if (d.containsEgg) carries.push('egg');
		if (d.vegetarianOption) carries.push('vegetarianOption');
		if (carries.length) veganLies.push(`${r.n} [${slug}] — ${carries.join(', ')}`);
	});
	if (veganLies.length) {
		problems.push(
			`${veganLies.length} recipes claim vegan while their own text names an animal product:\n` +
				veganLies.map((x) => `      ${x}`).join('\n')
		);
	}

	/**
	 * The authored `vegetarian` flag is a human judgement the build trusts by
	 * design (see derive/diet.mjs), so this is REPORTED, not gated — but it only
	 * became visible once fish and shellfish started reading every line, and a
	 * server reading a Vegetarian badge over a dish containing dashi or
	 * Worcestershire is the exact conversation this product exists to prevent.
	 */
	const vegWithAnimal = [];
	R.forEach((r, i) => {
		const slug = recipeSlugs[i];
		const d = OVERRIDES.recipes?.[slug]?.diet ?? deriveDiet(r, blobs[i]);
		const authored = OVERRIDES.recipes?.[slug]?.diet ? d.vegetarian : Boolean(r.v);
		if (authored && (d.containsFish || d.containsShellfish || d.containsMeat)) {
			vegWithAnimal.push(r.n);
		}
	});
	if (vegWithAnimal.length) {
		console.log(
			`  diet: ${vegWithAnimal.length} authored-vegetarian recipes carry a fish/shellfish/meat ` +
				`allergen flag (reported, not gated) — ${vegWithAnimal.slice(0, 4).join(', ')}…`
		);
	}
}

// Cross-link concentration: the original always scanned from index 0, so links
// piled onto whatever chapter came first (Italian). Assert nobody dominates.
const linkChapter = new Map();
let linkTotal = 0;
for (const [, slugs] of crosslinks.termToRecipes) {
	for (const s of slugs) {
		const rec = index.find((x) => x.slug === s);
		if (!rec) continue;
		linkChapter.set(rec.chapter, (linkChapter.get(rec.chapter) ?? 0) + 1);
		linkTotal++;
	}
}
const worst = [...linkChapter.entries()].sort((a, b) => b[1] - a[1])[0];
if (worst && linkTotal > 0) {
	const share = worst[1] / linkTotal;
	if (share > 0.08) {
		problems.push(
			`cross-links concentrated: ${worst[0]} holds ${(share * 100).toFixed(1)}% ` +
				`of ${linkTotal} links (cap 8%)`
		);
	}
	console.log(
		`\n  cross-links: ${linkTotal} total, top chapter ${worst[0]} at ${((worst[1] / linkTotal) * 100).toFixed(1)}%`
	);
}

// Overlay hygiene: a key that matches no slug is a silent no-op, the worst
// kind of typo. And a backfilled note SHORTER than the bar defeats the point.
{
	const slugSet = new Set(recipeSlugs);
	const unknown = Object.keys(NOTES).filter((k) => !slugSet.has(k));
	if (unknown.length) {
		problems.push(`notes.json keys matching no recipe slug: ${unknown.join(', ')}`);
	}
	const short = Object.entries(NOTES).filter(([, v]) => String(v).length < 180);
	if (short.length) {
		problems.push(
			`backfilled notes under the 180-char bar: ${short.map(([k, v]) => `${k} (${String(v).length})`).join(', ')}`
		);
	}
}

/**
 * Technique-table hygiene.
 *
 * The original's dead entries are reported, not failed — five of them describe
 * dishes this corpus does not contain, and that is the archived table's
 * business, not ours. A SUPPLEMENT entry that tags nothing is our own mistake
 * and fails the build: it means a keyword was written that the corpus never
 * says, which is exactly the near-miss that left "Caramelizing onions" dead
 * against a corpus that says "Caramelize onion".
 */
{
	const bySlugTech = new Map();
	for (const t of techniques) {
		if (bySlugTech.has(t.slug)) {
			problems.push(
				`technique slug collision: "${t.label}" and "${bySlugTech.get(t.slug)}" both slugify to ${t.slug}`
			);
		}
		bySlugTech.set(t.slug, t.label);
	}

	const labelSet = new Set(TECH_ALL.map((x) => x.l));
	const lexSet = new Set(lexicon.map((e) => e.slug));
	const badKeys = Object.keys(LEXICON_ANCHOR).filter((k) => !labelSet.has(k));
	const badVals = Object.entries(LEXICON_ANCHOR).filter(([, v]) => !lexSet.has(v));
	if (badKeys.length) {
		problems.push(`LEXICON_ANCHOR keys matching no technique label: ${badKeys.join(', ')}`);
	}
	if (badVals.length) {
		problems.push(
			`LEXICON_ANCHOR values matching no lexicon slug: ${badVals.map(([k, v]) => `${k} -> ${v}`).join(', ')}`
		);
	}

	const counts = new Map(techniques.map((t) => [t.label, t.recipes.length]));
	const deadSupp = SUPPLEMENT.filter((x) => !counts.has(x.l));
	if (deadSupp.length) {
		problems.push(
			`supplemental technique entries tagging nothing (keywords the corpus never says): ${deadSupp.map((x) => x.l).join(', ')}`
		);
	}
	const tooWide = SUPPLEMENT.filter((x) => (counts.get(x.l) ?? 0) > 150);
	if (tooWide.length) {
		problems.push(
			`supplemental entries too broad to be a distinguishing skill (>150 recipes): ${tooWide.map((x) => `${x.l} (${counts.get(x.l)})`).join(', ')}`
		);
	}
	const tooThin = SUPPLEMENT.filter((x) => (counts.get(x.l) ?? 0) > 0 && counts.get(x.l) < 5);
	if (tooThin.length) {
		console.log(
			`  techniques: ${tooThin.length} supplemental entries under 5 recipes: ${tooThin.map((x) => `${x.l} (${counts.get(x.l)})`).join(', ')}`
		);
	}

	// A semester skill pointing at no technique page is a dead link in the
	// curriculum, the one place a broken link is least forgivable.
	const liveSlugs = new Set(techniques.map((t) => t.slug));
	const dangling = study.flatMap((s) =>
		s.skills.filter((k) => !liveSlugs.has(k.slug)).map((k) => `S${s.n} -> ${k.label}`)
	);
	if (dangling.length) {
		problems.push(`Path skills pointing at no technique page: ${dangling.join(', ')}`);
	}

	const taught = new Set(study.flatMap((s) => s.skills.map((k) => k.slug)));
	console.log(
		`  path: ${taught.size} of ${techniques.length} skills are taught somewhere in the ten semesters ` +
			`(${techniques.length - taught.size} reachable only by browsing)`
	);

	const deadOriginal = TECH.filter((x) => !counts.has(x.l)).map((x) => x.l);
	const tagged = full.filter((d) => d.techniques.length).length;
	const anchored = techniques.filter((t) => t.lexiconSlug).length;
	console.log(
		`\n  techniques: ${tagged} of ${index.length} recipes tagged (${index.length - tagged} untagged), ` +
			`${techniques.length} live labels, ${anchored} anchored to a lexicon definition`
	);
	if (deadOriginal.length) {
		console.log(`  techniques: ${deadOriginal.length} original entries never fire — ${deadOriginal.join(', ')}`);
	}
	const untaggedChapters = [...new Set(index.map((r) => r.chapter))].filter((c) =>
		index.every((r, i) => r.chapter !== c || !full[i].techniques.length)
	);
	if (untaggedChapters.length) {
		console.log(`  techniques: chapters with no tagged recipe at all — ${untaggedChapters.join(', ')}`);
	}
}

/**
 * Seasonal produce that resolves to nothing.
 *
 * Reported, not failed: "Stone fruit" resolving to zero WAS a bug (the label is
 * a category no recipe would ever write, and 29 dishes naming peaches, apricots
 * and cherries had no season at all), but Brussels sprouts, Chard and Figs
 * resolve to zero because this corpus genuinely contains none of them. The
 * number moving is the signal worth watching.
 */
{
	const deadProduce = Object.keys(SEASON).filter(
		(label) => !narrowBlobs.some((b) => deriveSeason(b, { [label]: SEASON[label] }, PANTRY).length)
	);
	const seasoned = index.filter((r) => r.season.length).length;
	console.log(
		`\n  season: ${seasoned} of ${index.length} recipes carry peak months` +
			(deadProduce.length ? `; ${deadProduce.length} produce keys match nothing: ${deadProduce.join(', ')}` : '')
	);
}

// Note-length backfill tracker.
const thin = index.filter((r) => r.noteChars < 180);
console.log(`  notes under 180 chars: ${thin.length} of ${index.length}  (backfilled: ${Object.keys(NOTES).length})`);

console.log('');
/**
 * Standards hygiene.
 *
 * A standard whose slug matches no recipe is our own mistake, exactly like a
 * SUPPLEMENT entry that tags nothing: it means a slug was written that the
 * corpus never had, and the block would silently never render. Fails the build.
 *
 * The mark count is gated too. Two marks is not a standard and six is a recipe,
 * and the number is the one thing about this data that drifts without anybody
 * noticing, a chef adding "one more thing to check" a dish at a time.
 *
 * A dish with NO standard is not an error. 45 of 970 are written; the rest are
 * a rolling job and render without the block. What IS reported is a Path of
 * Study dish missing one, because that is the teaching spine and the whole
 * reason the field exists.
 */
{
	const slugSet = new Set(recipeSlugs);
	const orphans = STANDARDS.filter((x) => !slugSet.has(x.slug));
	if (orphans.length) {
		problems.push(
			`standards for slugs no recipe has: ${orphans.map((x) => x.slug).join(', ')}`
		);
	}

	const dupes = STANDARDS.map((x) => x.slug).filter((v, i, a) => a.indexOf(v) !== i);
	if (dupes.length) problems.push(`duplicate standards: ${[...new Set(dupes)].join(', ')}`);

	const badCount = STANDARDS.filter(
		(x) => !Array.isArray(x.marks) || x.marks.length < MIN_MARKS || x.marks.length > MAX_MARKS
	);
	if (badCount.length) {
		problems.push(
			`standards outside ${MIN_MARKS}-${MAX_MARKS} marks: ` +
				badCount.map((x) => `${x.slug} (${x.marks?.length ?? 0})`).join(', ')
		);
	}

	const noFault = STANDARDS.filter((x) => !x.fault || !String(x.fault).trim());
	if (noFault.length) {
		problems.push(`standards with no stated fault: ${noFault.map((x) => x.slug).join(', ')}`);
	}

	// STUDY carries recipe NAMES; `study` above has already resolved them to
	// slugs through nameToSlug, so read the derived value rather than mapping a
	// second time and risking the two disagreeing.
	const spine = [...new Set(study.flatMap((s) => s.recipes))];
	const covered = new Set(STANDARDS.map((x) => x.slug));
	const uncovered = spine.filter((x) => !covered.has(x));
	if (uncovered.length) {
		console.log(
			`  note: ${uncovered.length} of ${spine.length} Path of Study dishes have no standard yet`
		);
	}
}

{
	/**
	 * The service split. A recipe that costs a cook NO time is not a slow
	 * recipe, it is a parse failure — every stated number in it was read as a
	 * wait and its real work carries no duration at all. That is exactly how
	 * Kansas City barbecue ribs scored 475 minutes elapsed and zero of work
	 * before stepService earned the default for unnamed work, so it is gated
	 * rather than reported.
	 */
	const svc = full.map((r) => ({ slug: r.slug, ...recipeService(r.steps) }));

	const idle = svc.filter((r) => r.handsOnMin <= 0);
	if (idle.length) {
		problems.push(
			`recipes costing the cook no time at all (${idle.length}): ` +
				idle.slice(0, 5).map((r) => r.slug).join(', ')
		);
	}

	const impossible = svc.filter((r) => r.handsOnMin > r.elapsedMin);
	if (impossible.length) {
		problems.push(
			`recipes whose hands-on time exceeds their elapsed time: ` +
				impossible.slice(0, 5).map((r) => r.slug).join(', ')
		);
	}

	const share = svc.map((r) => r.handsOnMin / r.elapsedMin).sort((a, b) => a - b);
	const at = (q) => share[Math.floor(share.length * q)].toFixed(2);
	const advance = svc.filter((r) => r.advance).length;
	const elapsed = svc.map((r) => r.elapsedMin).sort((a, b) => a - b);
	console.log(
		`  service: median ${elapsed[Math.floor(elapsed.length / 2)]} min elapsed, ` +
			`hands-on share p10 ${at(0.1)} / median ${at(0.5)} / p90 ${at(0.9)}`
	);
	console.log(
		`  service: ${advance} recipes carry a wait of ${ADVANCE_MIN}+ min and cannot start inside a service`
	);
}

/**
 * The calibration ladders — authored apparatus, gated on shape.
 *
 * Same treatment standards.mjs gets, for the same reason: nothing here derives
 * from the guide, so nothing but a gate stops it drifting into a number that
 * cannot be built with a kitchen scale or a gap nobody could ever hear.
 *
 * IT LIVES DOWN HERE BECAUSE IT HAS TO. The first version sat beside the emit,
 * above `const problems = []` — so every `problems.push` was a ReferenceError,
 * which only threw when a problem was actually FOUND. With none, the array was
 * never touched and the build passed. A gate that could not report, sitting
 * quietly green. It was found by breaking it, which is the only way it could
 * have been found.
 */
{
	const seen = new Set();
	for (const ladder of LADDERS) {
		// unit is in this list because it was MISSED on one ladder of six and the
		// build sheet read "Jug one 3 of fine salt" -- a quantity with no unit is
		// not a build sheet.
		if (!ladder.taste || !ladder.label || !ladder.substance || !ladder.per || !ladder.unit) {
			problems.push(`calibration ladder ${ladder.taste ?? '?'} is missing a field`);
			continue;
		}
		if (seen.has(ladder.taste)) problems.push(`duplicate calibration ladder: ${ladder.taste}`);
		seen.add(ladder.taste);

		const levels = ladder.levels ?? [];
		if (levels.length < 3) {
			problems.push(`calibration ladder ${ladder.taste} has fewer than 3 levels`);
		}

		let previousGap = Infinity;
		for (const [i, lv] of levels.entries()) {
			if (lv.level !== i + 1) {
				problems.push(`calibration ${ladder.taste} levels are not 1..n in order`);
			}
			const gap = Math.abs(lv.odd - lv.base);
			if (!(gap > 0)) {
				problems.push(`calibration ${ladder.taste} level ${lv.level} has two identical cups`);
			}
			// A LADDER MUST NARROW. If a later level were easier than an earlier
			// one, clearing it would say less than the level below it and the whole
			// ordering would be a lie.
			if (gap >= previousGap) {
				problems.push(
					`calibration ${ladder.taste} level ${lv.level} is no harder than the one before it ` +
						`(gap ${gap} vs ${previousGap})`
				);
			}
			previousGap = gap;

			// Buildable with a kitchen scale. 0.25 g is already generous.
			for (const v of [lv.base, lv.odd]) {
				if (Math.round(v * 4) !== v * 4) {
					problems.push(
						`calibration ${ladder.taste} level ${lv.level} asks for ${v}, which no kitchen scale reads`
					);
				}
			}
		}
	}

	// A run must be long enough that a clean sweep is not luck. Three cups is a
	// 1-in-3 guess, so the odds of a perfect run by chance are 1/3^TRIALS.
	if (TRIALS < 5) problems.push(`calibration runs are ${TRIALS} trials — too short to mean anything`);
	if (PASS_AT > TRIALS) problems.push('calibration cannot be passed: PASS_AT exceeds TRIALS');
	if (PASS_AT <= TRIALS / 2) {
		problems.push(`calibration passes at ${PASS_AT} of ${TRIALS}, which is near the guess rate`);
	}

	console.log(
		`  calibration: ${LADDERS.length} ladders, ${LADDERS.reduce((n, l) => n + l.levels.length, 0)} levels, ` +
			`${PASS_AT} of ${TRIALS} to clear`
	);
}

problems.push(...palateProblems);

/**
 * The technique standards — gated in both directions, with the numbers in the
 * module's own headline read back out of it.
 *
 * See tools/derive/technique-standards.mjs. Same shape rules as the dish
 * standards, plus a reverse gate the dish standards cannot have: a DISH with no
 * standard is a rolling job and not an error, but a TECHNIQUE the corpus leans
 * on heavily with nothing written is a hole in the assessment of hundreds of
 * recipes at once, and it should not be possible to add one quietly.
 */
{
	const techBySlug = new Map(techniques.map((t) => [t.slug, t]));
	const authored = new Set(TECHNIQUE_STANDARDS.map((x) => x.slug));

	// FORWARD — a standard for a technique the table does not have means a slug
	// was written that the corpus never had.
	const orphans = TECHNIQUE_STANDARDS.filter((x) => !techBySlug.has(x.slug));
	if (orphans.length) {
		problems.push(
			`technique standards for slugs no technique has: ${orphans.map((x) => x.slug).join(', ')}`
		);
	}

	const dupes = TECHNIQUE_STANDARDS.map((x) => x.slug).filter((v, i, a) => a.indexOf(v) !== i);
	if (dupes.length) {
		problems.push(`duplicate technique standards: ${[...new Set(dupes)].join(', ')}`);
	}

	const badCount = TECHNIQUE_STANDARDS.filter(
		(x) => !Array.isArray(x.marks) || x.marks.length < MIN_MARKS || x.marks.length > MAX_MARKS
	);
	if (badCount.length) {
		problems.push(
			`technique standards outside ${MIN_MARKS}-${MAX_MARKS} marks: ` +
				badCount.map((x) => `${x.slug} (${x.marks?.length ?? 0})`).join(', ')
		);
	}

	const noFault = TECHNIQUE_STANDARDS.filter((x) => !x.fault || !String(x.fault).trim());
	if (noFault.length) {
		problems.push(
			`technique standards with no stated fault: ${noFault.map((x) => x.slug).join(', ')}`
		);
	}

	// REVERSE — the half that stops rot. A SUPPLEMENT entry added later that
	// tags 30 recipes must not be able to ship unassessable and unnoticed.
	const unassessable = techniques
		.filter((t) => t.recipes.length >= TECHNIQUE_GATE_MIN_RECIPES && !authored.has(t.slug))
		.sort((a, b) => b.recipes.length - a.recipes.length);
	if (unassessable.length) {
		problems.push(
			`techniques on ${TECHNIQUE_GATE_MIN_RECIPES}+ recipes with no standard written: ` +
				unassessable.map((t) => `${t.slug} (${t.recipes.length})`).join(', ')
		);
	}

	// The join must resolve, and it must never double up with a dish standard.
	const unresolved = new Set();
	for (const r of full) for (const s of r.judgedBy ?? []) if (!authored.has(s)) unresolved.add(s);
	if (unresolved.size) {
		problems.push(`judgedBy pointing at no technique standard: ${[...unresolved].join(', ')}`);
	}

	const both = full.filter((r) => r.standard && r.judgedBy);
	if (both.length) {
		problems.push(
			`recipes carrying a dish standard AND technique standards: ${both
				.map((r) => r.slug)
				.join(', ')}`
		);
	}

	/**
	 * Read the numbers back out of the prose that justifies them.
	 *
	 * economics.mjs shipped with only the forward half of its gate working, so
	 * `lowPct` could drift 25 -> 30 while the entry still read "25-35%". The
	 * module's headline claim is therefore checked against what actually
	 * happened, not merely asserted in a comment nobody re-runs.
	 */
	const src = readFileSync(new URL('./derive/technique-standards.mjs', import.meta.url), 'utf8')
		.replace(/^[ \t]*\*[ \t]?/gm, ' ')
		.replace(/\s+/g, ' ');
	const claim = src.match(
		/The (\d+) techniques written here are every technique the corpus uses on (\d+) or more recipes\. They put a standard on (\d+) recipes that had none, taking the assessable corpus from (\d+) to (\d+) of (\d+)/
	);
	if (!claim) {
		problems.push(
			'technique-standards.mjs: the headline paragraph no longer parses, so its numbers cannot be checked — restore the sentence or update this gate'
		);
	} else {
		const [, nTech, nThreshold, nGained, nDish, nAssessable, nCorpus] = claim.map(Number);
		const gained = full.filter((r) => r.judgedBy).length;
		const dish = full.filter((r) => r.standard).length;
		const stated = { nTech, nThreshold, nGained, nDish, nAssessable, nCorpus };
		const actual = {
			nTech: TECHNIQUE_STANDARDS.length,
			nThreshold: TECHNIQUE_GATE_MIN_RECIPES,
			nGained: gained,
			nDish: dish,
			nAssessable: dish + gained,
			nCorpus: full.length
		};
		/**
		 * The ceiling sentence, gated the same way and for the same reason. It was
		 * written first as "146 ... and the rest", both reasoned from other figures
		 * rather than measured, and both wrong — 143 and 38. A number nobody can
		 * re-run is a number that is already drifting.
		 */
		const ceiling = src.match(
			/(\d+) of the (\d+) remain unassessable and always will on this approach: (\d+) carry no technique tag at all, and the other (\d+)/
		);
		if (!ceiling) {
			problems.push(
				'technique-standards.mjs: the ceiling sentence no longer parses, so its numbers cannot be checked'
			);
		} else {
			const [, cUn, cCorpus, cUntagged, cTagged] = ceiling.map(Number);
			const un = full.filter((r) => !r.standard && !r.judgedBy);
			const cActual = {
				cUn: un.length,
				cCorpus: full.length,
				cUntagged: un.filter((r) => !r.techniques?.length).length,
				cTagged: un.filter((r) => r.techniques?.length).length
			};
			const cStated = { cUn, cCorpus, cUntagged, cTagged };
			const cDrift = Object.keys(cActual).filter((k) => cActual[k] !== cStated[k]);
			if (cDrift.length) {
				problems.push(
					'technique-standards.mjs ceiling sentence disagrees with the build: ' +
						cDrift.map((k) => `${k} states ${cStated[k]}, measured ${cActual[k]}`).join('; ')
				);
			}
		}

		/**
		 * The same measured numbers, EMITTED, so no page ever hardcodes them
		 * again. The coverage board shipped "683 ... 45 ... 638" in its limits
		 * copy and the corpus moved twice underneath it: a page number that is
		 * not computed or emitted-and-gated is a page number already drifting.
		 */
		writeFileSync(
			new URL('../src/lib/data/assessability.json', import.meta.url),
			JSON.stringify(
				{ corpus: actual.nCorpus, dishStandards: actual.nDish, byTechnique: actual.nGained, assessable: actual.nAssessable },
				null,
				'\t'
			) + '\n'
		);

		const drift = Object.keys(actual).filter((k) => actual[k] !== stated[k]);
		if (drift.length) {
			problems.push(
				'technique-standards.mjs claims something the build disagrees with: ' +
					drift.map((k) => `${k} states ${stated[k]}, measured ${actual[k]}`).join('; ')
			);
		}
	}

	console.log(
		`  technique standards: ${TECHNIQUE_STANDARDS.length} written, judging ${
			full.filter((r) => r.judgedBy).length
		} recipes that carry no dish standard`
	);
}

/**
 * The mark-id ledger — what makes a mark id a PROMISE rather than a label.
 *
 * A cook's annotation records "the crust mark was off" as an id. The whole
 * value of that record is that it still means the same sentence in March, so
 * the id has to be something the build refuses to let move:
 *
 *   - dropped or renamed  -> FAIL. Every annotation pointing at it is orphaned,
 *     and unlike a broken link there is no symptom: the record just quietly
 *     stops matching anything and the histogram loses a row.
 *   - added               -> appended, silently. Minting is additive; a new
 *     mark is ordinary authoring and must not need a ceremony.
 *
 * This is the rule the Codex already holds for question ids, and the reason it
 * holds it: a changed id orphans progress.
 *
 * The ledger is COMMITTED and the build writes to it. That is deliberate —
 * `git diff` on this file is the review surface. An append is a new line; a
 * rename is a delete plus an add, and the delete fails the build before it can
 * ever reach the diff.
 */
{
	const LEDGER = join(ROOT, 'tools', 'derive', 'mark-ids.ledger.json');

	const allMarks = [
		...STANDARDS.map((s) => ({ slug: s.slug, marks: s.marks, kind: 'dish' })),
		...TECHNIQUE_STANDARDS.map((s) => ({ slug: s.slug, marks: s.marks, kind: 'technique' }))
	];

	const live = [];
	for (const s of allMarks) {
		const seen = new Set();
		for (const m of s.marks) {
			if (!m || typeof m !== 'object' || typeof m.id !== 'string' || !m.id) {
				problems.push(
					`${s.slug} has a mark with no id — run \`node tools/mint-mark-ids.mjs\``
				);
				continue;
			}
			if (typeof m.text !== 'string' || !m.text.trim()) {
				problems.push(`${s.slug} has a mark id (${m.id}) with no text`);
			}
			// An id that does not carry its own standard's slug is a copy-paste
			// that now points a cook's annotation at somebody else's dish.
			if (!m.id.startsWith(`${s.slug}#`)) {
				problems.push(`mark id ${m.id} does not belong to ${s.slug}`);
			}
			if (seen.has(m.id)) problems.push(`${s.slug} uses the mark id ${m.id} twice`);
			seen.add(m.id);
			live.push(m.id);
		}
	}

	const dupes = live.filter((v, i, a) => a.indexOf(v) !== i);
	if (dupes.length) {
		problems.push(`mark ids used by more than one standard: ${[...new Set(dupes)].join(', ')}`);
	}

	const liveSet = new Set(live);
	let ledgered = [];
	if (existsSync(LEDGER)) {
		try {
			ledgered = JSON.parse(readFileSync(LEDGER, 'utf8')).ids ?? [];
		} catch {
			problems.push('mark-ids.ledger.json is unreadable — restore it from git rather than deleting it');
		}
	}

	const orphaned = ledgered.filter((id) => !liveSet.has(id));
	if (orphaned.length) {
		problems.push(
			`${orphaned.length} mark ids in the ledger no longer exist — a rename or a drop orphans ` +
				`every annotation pointing at them. Restore the id (the TEXT is free to change), ` +
				`or remove it from the ledger deliberately:\n` +
				orphaned.map((id) => `      ${id}`).join('\n')
		);
	}

	const minted = live.filter((id) => !ledgered.includes(id));
	if (!problems.length) {
		const next = [...ledgered, ...minted].sort();
		writeFileSync(LEDGER, JSON.stringify({ ids: next }, null, 1) + '\n', 'utf8');
		console.log(
			`  mark ids: ${live.length} live, ${next.length} ledgered` +
				(minted.length ? `, ${minted.length} newly minted` : '')
		);
	}
}


/*
 * Pushed ABOVE the mark-id ledger block, deliberately. These six lived after
 * it, so a build failing on any of them had already appended newly minted ids
 * to the committed ledger — and an abandoned edit then left phantom ids whose
 * honest retraction would itself fail the build. The ledger's guard is
 * `!problems.length`; it only means "every gate passed" if every gate has
 * already spoken.
 */
problems.push(...economicsProblems);
problems.push(...wasteProblems);
problems.push(...sanitationProblems);
problems.push(...serviceTrackProblems);
problems.push(...drillProblems);
problems.push(...stationProblems);

if (problems.length) {
	console.error('  BUILD GATE FAILED\n');
	for (const p of problems) console.error(`    ✗ ${p}\n`);
	process.exit(1);
}
console.log('  all gates passed\n');
