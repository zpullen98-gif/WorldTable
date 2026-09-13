/**
 * check-displacement.mjs: did new lexicon terms EVICT old ones?
 *
 * Not a gate, because it needs git and a rebuild. Run it after every content
 * pass that adds terms, the way check-films is run before a release.
 *
 *   node tools/build-data.mjs && node tools/check-displacement.mjs
 *
 * WHAT IT WATCHES, AND WHY NOTHING ELSE DOES. A lexicon term collects up to
 * three recipes (crosslinks.mjs caps it), and that map is then INVERTED to
 * decide which terms a recipe page lists back under "the words inside". The
 * inverse is capped at four per recipe and sorted by rank, so a newly added
 * term can push a hand-audited one out of a recipe it was chosen for.
 *
 * crosslinks.test.ts asserts FLOORS: at least 550 links, at least 250 terms
 * carrying them. Floors cannot see displacement, because a link lost and a
 * link gained leaves the total unmoved. This is the ceiling half.
 *
 * Measured when the atlas work began: the twelve commonest ingredient words in
 * the language (onion, garlic, tomato, butter, lemon, olive oil, egg, potato,
 * carrot, rice, milk, flour) displaced NOTHING, because qualifies() refuses a
 * link whose shared token appears in more than STAPLE_DF = 100 recipes, and
 * those words all do. The risk is real but it is concentrated in the middle of
 * the frequency range, not at the top, and it grows with the number of terms.
 * So this is worth running, and worth not panicking about.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = 'src/lib/data/recipes.full.json';
const ref = process.argv[2] ?? 'HEAD';

const termMap = (json) => {
	const arr = Array.isArray(json) ? json : Object.values(json)[0];
	return new Map(arr.map((r) => [r.slug, (r.lexiconTerms || []).map((t) => t.slug)]));
};

let before;
try {
	before = termMap(JSON.parse(
		execFileSync('git', ['show', `${ref}:${FILE}`], { cwd: ROOT, maxBuffer: 1e9, encoding: 'utf8' })
	));
} catch {
	console.error(`  could not read ${FILE} at ${ref}: is this a git tree, and does that ref exist?`);
	process.exit(2);
}
const after = termMap(JSON.parse(readFileSync(join(ROOT, FILE), 'utf8')));

let lost = 0, gained = 0, touched = 0;
const lostBy = new Map();
const examples = [];
for (const [slug, a] of after) {
	const b = before.get(slug) ?? [];
	const as = new Set(a), bs = new Set(b);
	const dropped = b.filter((t) => !as.has(t));
	const added = a.filter((t) => !bs.has(t));
	if (dropped.length || added.length) touched++;
	lost += dropped.length;
	gained += added.length;
	for (const t of dropped) {
		lostBy.set(t, (lostBy.get(t) ?? 0) + 1);
		if (examples.length < 12) examples.push(`${slug} lost ${t}`);
	}
}

console.log(`\n  crosslink displacement against ${ref}`);
console.log(`    recipes whose terms changed  ${touched}`);
console.log(`    terms gained                 ${gained}`);
console.log(`    terms lost                   ${lost}`);

if (!lost) {
	console.log('\n  ✓ nothing was evicted: every change is additive\n');
	process.exit(0);
}

console.log('\n  evicted terms, most displaced first:');
[...lostBy.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
	.forEach(([t, n]) => console.log(`    ${String(n).padStart(4)}  ${t}`));
console.log('\n  examples:');
examples.forEach((e) => console.log(`    ${e}`));
console.log(`
  A loss is not automatically wrong: a better term winning a slot is the engine
  working. It IS wrong when a term a person pinned in overrides.json quietly
  stops appearing. Check the evicted terms against overrides.json "keep" rules
  before accepting this, and pin anything that should not have moved.
`);
process.exit(1);
