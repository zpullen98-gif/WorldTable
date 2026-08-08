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
import { buildCrosslinks } from './derive/crosslinks.mjs';
import { derivePantryMap } from './derive/pantry.mjs';
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

/** Lowercased searchable blob per recipe, built once and reused by every rule. */
const blobs = R.map((r) => `${r.n} ${r.c} ${r.i.join(' ')} ${r.m.join(' ')} ${r.p}`.toLowerCase());

const pantryMap = derivePantryMap(R, blobs, PANTRY);
const crosslinks = buildCrosslinks(R, recipeSlugs, D, lexSlugs, blobs);

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

R.forEach((r, i) => {
	const slug = recipeSlugs[i];
	const region = classifyChapter(r.c);
	const ov = OVERRIDES.recipes?.[slug] ?? {};

	const diet = { ...deriveDiet(r, blobs[i]), ...(ov.diet ?? {}) };
	const flavor = deriveFlavor(blobs[i], NOTE_DEFS);
	const techniques = deriveTechniques(blobs[i], TECH);

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
		season: ov.season ?? deriveSeason(blobs[i], SEASON),
		region,
		source: 'guide',
		noteChars: r.p.length
	});

	full.push({
		slug,
		ingredients: r.i.map(toIngredient),
		steps: r.m.map((text) => ({ text, durationSec: stepDuration(text) })),
		note: r.p,
		equipment: ov.equipment ?? deriveEquipment(r, EQUIP),
		techniques,
		flavor,
		pairingId: internPairing(ov.pairing ?? derivePairing(r, blobs[i], CELLAR, BOTTLE_NOTES, flavor.tags)),
		films: deriveFilms(r, blobs[i], { F, TEACHERS, DISH_FILMS, TECH }, isAmerican),
		lexiconTerms: crosslinks.recipeToTerms.get(slug) ?? [],
		pantryItems: pantryMap.get(i) ?? []
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

const study = STUDY.map((s, i) => ({
	n: i + 1,
	title: s.t,
	description: s.d,
	recipes: s.r.map((n) => nameToSlug.get(n)).filter(Boolean),
	terms: s.x.map((t) => termToSlug.get(t)).filter(Boolean)
}));

const substitutions = SUBS.map(([term, advice]) => ({ term, advice }));

const cellar = CELLAR.map((name) => ({
	name,
	slug: slugify(name),
	note: BOTTLE_NOTES[name] ?? ''
}));

// ── emit ─────────────────────────────────────────────────────────────────────
mkdirSync(OUT, { recursive: true });
const write = (file, value) => {
	writeFileSync(join(OUT, file), JSON.stringify(value, null, 2) + '\n', 'utf8');
	const kb = (JSON.stringify(value).length / 1024).toFixed(0);
	console.log(`  ${file.padEnd(24)} ${String(Array.isArray(value) ? value.length : '').padStart(5)}  ${kb.padStart(6)} KB`);
};

console.log('\n  build:data\n');
write('recipes.index.json', index);
write('recipes.full.json', full);
write('pairings.json', pairingTable);
write('chapters.json', chapters);
write('lexicon.json', lexicon);
write('pantry.json', pantry);
write('study.json', study);
write('substitutions.json', substitutions);
write('cellar.json', cellar);

/**
 * The search index, prebuilt so the browser never pays tokenization cost.
 *
 * Fields mirror the ORIGINAL's search surface — name + ingredients (RTEXT,
 * L2746) — plus chapter and flavor tags. The grid's substring fallback covers
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
		flavor: index[i].flavorTags.join(' ')
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
 * "pork (or shiitake for veg)" counts — is reported, not failed. See the note in
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

// Note-length backfill tracker.
const thin = index.filter((r) => r.noteChars < 180);
console.log(`  notes under 180 chars: ${thin.length} of ${index.length}`);

console.log('');
if (problems.length) {
	console.error('  BUILD GATE FAILED\n');
	for (const p of problems) console.error(`    ✗ ${p}\n`);
	process.exit(1);
}
console.log('  all gates passed\n');
