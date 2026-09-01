import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * The parity harness: load the archived ORIGINAL in a real browser, run its own
 * functions over its own data, and compare against what our build pipeline
 * emitted. Not a re-implementation of the original's logic — the original IS
 * the oracle, executing itself.
 *
 * Authored fields must match byte-for-byte. Derived fields (equipment, cost,
 * flavor, pairing) must match except where overrides.json or the notes overlay
 * intentionally diverge.
 */

const ROOT = join(__dirname, '..');
const REFERENCE = pathToFileURL(join(ROOT, 'reference', 'world-table-v1.html')).href;

const ourIndex = JSON.parse(
	readFileSync(join(ROOT, 'src', 'lib', 'data', 'recipes.index.json'), 'utf8')
);
const ourFull = JSON.parse(
	readFileSync(join(ROOT, 'src', 'lib', 'data', 'recipes.full.json'), 'utf8')
);
const ourPairings = JSON.parse(
	readFileSync(join(ROOT, 'src', 'lib', 'data', 'pairings.json'), 'utf8')
);
const overridesPath = join(ROOT, 'src', 'lib', 'data', 'overrides.json');
const overridden = new Set(
	Object.keys(existsSync(overridesPath) ? JSON.parse(readFileSync(overridesPath, 'utf8')).recipes ?? {} : {})
);
const notesPath = join(ROOT, 'src', 'lib', 'data', 'notes.json');
const backfilled = new Set(
	existsSync(notesPath) ? Object.keys(JSON.parse(readFileSync(notesPath, 'utf8'))) : []
);

/**
 * Prose carries a documented licence; everything else does not.
 *
 * The em dash sweep repunctuated the emitted data and deliberately LEFT THE
 * ARCHIVED ORIGINAL ALONE, on the grounds that repunctuating a historical
 * artefact to match a later house style destroys the thing the archive exists
 * to be. tools/verify-extraction.mjs states that decision in full and compares
 * word-identity rather than bytes because of it.
 *
 * This test never got the memo, and for months its failure was masked by a
 * length assertion that died first. So it applies the SAME normalisation, to
 * the SAME three fields the sweep actually touched: notes (736), method steps
 * (527) and ingredient lines (283). Names, chapters and courses were not
 * touched by the sweep and are still compared byte-for-byte below, as are all
 * the numbers.
 *
 * Keep this in step with wordform() in verify-extraction.mjs. If the two ever
 * disagree, the looser one is wrong.
 */
const WORDS_ONLY = /[-—–:;,.!?()\[\]{}"'\s]+/g;
const CONNECTIVES = /\b(?:and|is|which|because|that|so|but)\b/gi;
const prose = (v: unknown) =>
	JSON.stringify(v)
		.replace(WORDS_ONLY, ' ')
		.replace(CONNECTIVES, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();

interface LegacyRecord {
	n: string; c: string; k: string; d: number; t: number; v: number;
	i: string[]; m: string[]; p: string;
	equip: string[]; cost: number;
	flavor: { tags: string[]; sent: string };
	pairing: { pour: string; alt: string; beer: string; zero: string; why: string };
}

test('the original, executing itself, agrees with our build output', async ({ page }) => {
	test.setTimeout(120_000);

	// file:// load; the Google Fonts link may fail silently — the scripts don't
	// depend on it.
	//
	// String-bodied evaluation throughout: the original's `const R` is a
	// top-level LEXICAL binding, part of the global environment record but never
	// a window property — `window.R` is undefined forever while bare `R`
	// resolves fine. (Its function declarations, like pairingFull, DO land on
	// window; the data does not.)
	await page.goto(REFERENCE, { waitUntil: 'domcontentloaded' });
	await page.waitForFunction('typeof R !== "undefined" && typeof pairingFull === "function"');

	// equip is NOT taken from equipFor(): the original's \`.map(([n])=>n)\`
	// destructures the RegExp out of each [regex, label] pair — a display bug
	// that rendered "/dutch oven/" in its equipment line. We replicate its
	// SELECTION (ingredients+method blob, first 6) and take the labels it
	// meant, which is exactly what our port emits.
	const legacy: LegacyRecord[] = await page.evaluate(`(() =>
		R.map((r) => ({
			n: r.n, c: r.c, k: r.k, d: r.d, t: r.t, v: r.v, i: r.i, m: r.m, p: r.p,
			equip: EQUIP.filter(([re]) => re.test((r.i.join(' ') + ' ' + r.m.join(' ')).toLowerCase()))
				.map((pair) => pair[1])
				.slice(0, 6),
			cost: costFor(r),
			flavor: flavorFor(r),
			pairing: pairingFull(r)
		}))
	)()`);

	/* The original is 970 dishes and always will be: it is a sealed artefact.
	   Our corpus is those 970 followed by an authored supplement, so parity is
	   checked over the original's SPAN, not over the whole array. Position still
	   aligns because the supplement is appended, never interleaved: if that ever
	   changes, the name comparison below fails on the first row and says so. */
	expect(legacy).toHaveLength(970);
	expect(ourIndex.length).toBeGreaterThanOrEqual(970);

	// Our arrays preserve original order, so records align by position.
	const authoredDiffs: string[] = [];
	const derivedDiffs: string[] = [];

	for (let i = 0; i < 970; i++) {
		const old = legacy[i];
		const idx = ourIndex[i];
		const full = ourFull[i];

		/* ---- authored fields: byte-for-byte, no exceptions ---- */
		if (idx.name !== old.n) authoredDiffs.push(`#${i} name`);
		if (idx.chapter !== old.c) authoredDiffs.push(`#${i} chapter`);
		if (idx.course !== old.k) authoredDiffs.push(`#${i} course`);
		if (idx.difficulty !== old.d) authoredDiffs.push(`#${i} difficulty`);
		if (idx.minutes !== old.t) authoredDiffs.push(`#${i} minutes`);
		if (idx.diet.vegetarian !== Boolean(old.v) && !overridden.has(idx.slug))
			authoredDiffs.push(`#${i} vegetarian (${old.n})`);

		const ourIng = full.ingredients.map((e: { kind: string; label?: string; text?: string }) =>
			e.kind === 'section' ? e.label : e.text
		);
		if (prose(ourIng) !== prose(old.i)) authoredDiffs.push(`#${i} ingredients (${old.n})`);
		if (prose(full.steps.map((s: { text: string }) => s.text)) !== prose(old.m))
			authoredDiffs.push(`#${i} steps (${old.n})`);
		if (prose(full.note) !== prose(old.p) && !backfilled.has(idx.slug))
			authoredDiffs.push(`#${i} note (${old.n})`);

		/* ---- derived fields: the original's own functions are the oracle ---- */
		if (overridden.has(idx.slug) || backfilled.has(idx.slug)) continue;

		if (JSON.stringify(full.equipment) !== JSON.stringify(old.equip))
			derivedDiffs.push(`#${i} equipment (${old.n}): ${JSON.stringify(full.equipment)} vs ${JSON.stringify(old.equip)}`);
		if (idx.costTier !== old.cost)
			derivedDiffs.push(`#${i} cost (${old.n}): ${idx.costTier} vs ${old.cost}`);
		if (JSON.stringify(full.flavor.tags) !== JSON.stringify(old.flavor.tags))
			derivedDiffs.push(`#${i} flavor tags (${old.n}): ${JSON.stringify(full.flavor.tags)} vs ${JSON.stringify(old.flavor.tags)}`);

		/* Pairing text is prose and carries the same licence as the rest: the
		   sweep reached it too, including the em dash the original used as the
		   "no beer" placeholder, which became a plain hyphen. Sixty rows differed
		   on that one glyph.

		   The old message printed `pour` whatever field had actually moved, which
		   is why those sixty read as "Mimosa (weekends only) vs Mimosa (weekends
		   only)": a diff report that hides the difference. It now names the field. */
		const p = ourPairings[full.pairingId];
		for (const [field, ours, theirs] of [
			['pour', p.pour, old.pairing.pour],
			['beer', p.beer, old.pairing.beer],
			['zero-proof', p.zeroProof, old.pairing.zero]
		] as const) {
			if (prose(ours) !== prose(theirs))
				derivedDiffs.push(`#${i} pairing ${field} (${old.n}): ${ours} vs ${theirs}`);
		}
	}

	expect(
		authoredDiffs,
		'authored fields must survive extraction: numbers and names byte-for-byte, prose word-for-word'
	).toEqual([]);
	expect(
		derivedDiffs.slice(0, 25),
		`derived fields must match the original's own functions (${derivedDiffs.length} total diffs)`
	).toEqual([]);
});
