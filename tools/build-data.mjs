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
		season: ov.season ?? deriveSeason(blobs[i], SEASON),
		region,
		source: 'guide',
		noteChars: effNotes[i].length
	});

	full.push({
		slug,
		ingredients: r.i.map(toIngredient),
		steps: r.m.map((text) => ({ text, durationSec: stepDuration(text) })),
		note: effNotes[i],
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
write('techniques.json', techniques);

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

// Overlay hygiene: a key that matches no slug is a silent no-op — the worst
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
			`  techniques: ${tooThin.length} supplemental entries under 5 recipes — ${tooThin.map((x) => `${x.l} (${counts.get(x.l)})`).join(', ')}`
		);
	}

	// A semester skill pointing at no technique page is a dead link in the
	// curriculum — the one place a broken link is least forgivable.
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

// Note-length backfill tracker.
const thin = index.filter((r) => r.noteChars < 180);
console.log(`  notes under 180 chars: ${thin.length} of ${index.length}  (backfilled: ${Object.keys(NOTES).length})`);

console.log('');
if (problems.length) {
	console.error('  BUILD GATE FAILED\n');
	for (const p of problems) console.error(`    ✗ ${p}\n`);
	process.exit(1);
}
console.log('  all gates passed\n');
