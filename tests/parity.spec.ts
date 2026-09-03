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

/**
 * The nineteen dishes whose cost we deliberately disagree with the original on.
 *
 * `costFor` is the oracle for costTier and it stays the oracle. But the original
 * scored bare substrings, so a keyword matched inside a longer word that never
 * meant the ingredient, and this test would otherwise pin those readings
 * forever. THE PRECEDENT IS ALREADY IN THIS FILE: `equip` is not taken from
 * `equipFor()` either, because that destructured the RegExp out of each pair -
 * we replicate the SELECTION and take "the labels it meant". Same move here, for
 * the same reason.
 *
 * Two causes, both the same complaint - letters that do not mean the ingredient:
 *
 *   'boundary'  the keyword sat inside a longer word in the recipe itself.
 *               `cream` in SCREAMING ("a screaming grill pan", "screaming-hot
 *               steel") on sisig, pita and manoushe; `veal` in REVEAL on
 *               matambre and tarta de Santiago; `uni` in UNIFIED on bun thit
 *               nuong, which put it a tier up for a word in a sentence about
 *               the dish being unified; `duck` in GEODUCK, which is a clam.
 *
 *   'note'      the keyword sat inside a word in the EDITORIAL NOTE, which is
 *               prose about the dish rather than a statement of what goes in it.
 *               `uni` in "unifier", `cream` in "creamery", `brisket` inside a
 *               sentence in banana pudding. A dish is not made expensive by a
 *               paragraph.
 *
 * EXHAUSTIVE AND EXACT, checked both ways below: a twentieth divergence fails,
 * and a ruling that stops being needed fails too. This is a list of reviewed
 * decisions, not a mute button - every row was read against its recipe.
 */
const COST_RULINGS: Array<[slug: string, original: number, ours: number, why: 'boundary' | 'note']> = [
	['sizzling-sisig', 2, 1, 'boundary'],
	['wiener-saftgulasch', 3, 2, 'note'],
	['polvo-a-lagareiro', 2, 1, 'note'],
	['soto-ayam', 2, 1, 'note'],
	['pita', 2, 1, 'boundary'],
	['matambre-arrollado', 3, 1, 'boundary'],
	['manoushe-zaatar', 2, 1, 'boundary'],
	['bun-thit-nuong-lunch-atlas', 2, 1, 'boundary'],
	['cullen-skink', 3, 2, 'note'],
	['tacos-al-pastor-home-trompo', 2, 1, 'note'],
	['banana-pudding', 3, 2, 'note'],
	['tarta-de-santiago', 3, 2, 'boundary'],
	['nebraska-chicken-fried-steak', 3, 2, 'note'],
	['arizona-prickly-pear-margarita', 2, 1, 'note'],
	['colorado-bison-burger', 2, 1, 'note'],
	['colorado-elk-chili', 3, 2, 'note'],
	['montana-bison-ribeye-with-wild-mushrooms', 3, 2, 'note'],
	['hood-river-pear-and-blue-cheese-salad', 2, 1, 'note'],
	['geoduck-crudo', 2, 1, 'boundary']
];
const costRuling = new Map(COST_RULINGS.map(([slug, original, ours]) => [slug, { original, ours }]));

/**
 * The same complaint as COST_RULINGS, for pairing.mjs's `has()`: 'ham' inside
 * "béchamel" and "champ", 'sole' inside "posole", 'elk' inside "whelk" and
 * "semmelknödel", 'lamb' inside "flambé", 'ragu' inside "asparagus", 'smoked'
 * inside "unsmoked" (a negation), 'lime' inside "slime", 'mac and' inside
 * "sumac and" - all fixed by the same LEFT boundary cost.mjs already settled
 * on, with the same one exception: 'milk' stays bare, because "buttermilk" is
 * a SUFFIX collision a left boundary cannot keep (see pairing.mjs's own
 * comment).
 *
 * A second, independent cause: derivePairing was reading the note along with
 * the ingredients and method, the same class costBlob already excludes for
 * cost tiers. 'no lobster necessary' (a NEGATION) put Bouillabaisse on the
 * shellfish pour; 'leaner than chicken' put a pheasant on the chicken pour;
 * 'jerky-deep' (a left-boundary-satisfying PREFIX, not a collision the
 * boundary fix alone catches) read as Caribbean jerk seasoning. Both causes
 * are real and several rows need both landed together to reach their
 * corrected answer.
 *
 * EXHAUSTIVE AND EXACT, checked both ways below, same as COST_RULINGS: a
 * pairing field a ruling does not name failing, or a ruling whose predicted
 * move stops happening, both fail the test.
 */
const PAIRING_RULINGS: Array<
	[
		slug: string,
		original: { pour: string; beer: string; zeroProof: string },
		ours: { pour: string; beer: string; zeroProof: string },
		why: 'boundary' | 'note'
	]
> = [
	[
		'champ',
		{ pour: 'Chenin Blanc (Vouvray sec)', beer: 'Farmhouse saison', zeroProof: 'Cloudy apple juice, chilled' },
		{ pour: 'Sauvignon Blanc (Sancerre)', beer: 'Berliner weisse', zeroProof: 'Cucumber-lime water' },
		'boundary'
	],
	[
		'semmelknodel',
		{ pour: 'Cabernet Sauvignon or Malbec', beer: 'Amber ale', zeroProof: 'Sparkling water, make room' },
		{ pour: 'Sauvignon Blanc (Sancerre)', beer: 'Berliner weisse', zeroProof: 'Cucumber-lime water' },
		'boundary'
	],
	[
		'kanelbullar',
		{ pour: 'Chenin Blanc (Vouvray sec)', beer: 'Farmhouse saison', zeroProof: 'Cloudy apple juice, chilled' },
		{ pour: 'Grüner Veltliner', beer: 'Saison', zeroProof: 'Sparkling water with citrus & herbs' },
		'boundary'
	],
	[
		'gomen-wat',
		{
			pour: 'Off-dry Riesling (Mosel Kabinett)',
			beer: 'Crisp lager or pilsner',
			zeroProof: 'Agua fresca or iced jasmine tea'
		},
		{ pour: 'Grüner Veltliner', beer: 'Saison', zeroProof: 'Sparkling water with citrus & herbs' },
		'note'
	],
	[
		'english-muffins',
		{ pour: 'Chenin Blanc (Vouvray sec)', beer: 'Farmhouse saison', zeroProof: 'Cloudy apple juice, chilled' },
		{ pour: 'Grüner Veltliner', beer: 'Saison', zeroProof: 'Sparkling water with citrus & herbs' },
		'boundary'
	],
	[
		'sauce-bechamel',
		{ pour: 'Chenin Blanc (Vouvray sec)', beer: 'Farmhouse saison', zeroProof: 'Cloudy apple juice, chilled' },
		{ pour: 'Grüner Veltliner', beer: 'Saison', zeroProof: 'Sparkling water with citrus & herbs' },
		'boundary'
	],
	[
		'sauce-hollandaise',
		{
			pour: 'Syrah (northern Rhône) or Nebbiolo',
			beer: 'Belgian dubbel',
			zeroProof: 'Beet & blackcurrant shrub'
		},
		{ pour: 'Sauvignon Blanc (Sancerre)', beer: 'Berliner weisse', zeroProof: 'Cucumber-lime water' },
		'note'
	],
	[
		'basque-burnt-cheesecake',
		{ pour: 'Tawny Port', beer: 'Barleywine', zeroProof: 'Cold-brew coffee' },
		{ pour: 'Sauternes', beer: 'Belgian tripel', zeroProof: 'Jasmine tea' },
		'note'
	],
	[
		'malva-pudding',
		{ pour: 'Tawny Port', beer: 'Barleywine', zeroProof: 'Cold-brew coffee' },
		{ pour: 'Sauternes', beer: 'Belgian tripel', zeroProof: 'Jasmine tea' },
		'note'
	],
	[
		'creole-pralines',
		{ pour: 'Tawny Port', beer: 'Barleywine', zeroProof: 'Cold-brew coffee' },
		{ pour: 'Sauternes', beer: 'Belgian tripel', zeroProof: 'Jasmine tea' },
		'note'
	],
	[
		'chess-pie',
		{ pour: 'Moscato d’Asti', beer: 'Witbier', zeroProof: 'Sparkling elderflower' },
		{ pour: 'Sauternes', beer: 'Belgian tripel', zeroProof: 'Jasmine tea' },
		'note'
	],
	[
		'pani-puri',
		{ pour: 'Riesling or Grenache', beer: 'Farmhouse saison', zeroProof: 'Cloudy apple juice, chilled' },
		{ pour: 'Sauvignon Blanc (Sancerre)', beer: 'Berliner weisse', zeroProof: 'Cucumber-lime water' },
		'boundary'
	],
	[
		'bouillabaisse',
		{ pour: 'Albariño', beer: 'Pilsner or witbier', zeroProof: 'White grape & tonic' },
		{ pour: 'Vermentino or Sauvignon Blanc', beer: 'Witbier', zeroProof: 'Sparkling water with citrus' },
		'note'
	],
	[
		'tacos-al-pastor-home-trompo',
		{ pour: 'Syrah or Grenache/GSM', beer: 'Porter', zeroProof: 'Pomegranate spritz' },
		{ pour: 'Riesling or Grenache', beer: 'Farmhouse saison', zeroProof: 'Cloudy apple juice, chilled' },
		'note'
	],
	[
		'carolina-coleslaw',
		{ pour: 'Riesling or Grenache', beer: 'Farmhouse saison', zeroProof: 'Cloudy apple juice, chilled' },
		{ pour: 'Grüner Veltliner', beer: 'Saison', zeroProof: 'Sparkling water with citrus & herbs' },
		'note'
	],
	[
		'conch-fritters',
		{ pour: 'Chenin Blanc (Vouvray sec)', beer: 'Farmhouse saison', zeroProof: 'Cloudy apple juice, chilled' },
		{ pour: 'Champagne: when lost, bubbles', beer: 'Pilsner', zeroProof: 'Sparkling water with citrus' },
		'boundary'
	],
	[
		'florida-orange-cake',
		{ pour: 'Moscato d’Asti', beer: 'Witbier', zeroProof: 'Sparkling elderflower' },
		{ pour: 'Sauternes', beer: 'Belgian tripel', zeroProof: 'Jasmine tea' },
		'note'
	],
	[
		'michigan-booyah',
		{
			pour: 'Syrah (northern Rhône) or Nebbiolo',
			beer: 'Belgian dubbel',
			zeroProof: 'Beet & blackcurrant shrub'
		},
		{ pour: 'Cabernet Sauvignon or Malbec', beer: 'Amber ale', zeroProof: 'Sparkling water, make room' },
		'note'
	],
	[
		'south-dakota-pheasant-with-cream-gravy',
		{ pour: 'Chardonnay (village Burgundy)', beer: 'Bière de garde', zeroProof: 'Verbena iced tea' },
		{ pour: 'Champagne: when lost, bubbles', beer: 'Pilsner', zeroProof: 'Sparkling water with citrus' },
		'note'
	],
	[
		'new-mexico-posole',
		{ pour: 'Vermentino or Sauvignon Blanc', beer: 'Witbier', zeroProof: 'Sparkling water with citrus' },
		{ pour: 'Riesling or Grenache', beer: 'Farmhouse saison', zeroProof: 'Cloudy apple juice, chilled' },
		'boundary'
	],
	[
		'arizona-carne-seca',
		{
			pour: 'Off-dry Riesling (Mosel Kabinett)',
			beer: 'Crisp lager or pilsner',
			zeroProof: 'Agua fresca or iced jasmine tea'
		},
		{ pour: 'Cabernet Sauvignon or Malbec', beer: 'Amber ale', zeroProof: 'Sparkling water, make room' },
		'note'
	],
	[
		'snake-river-trout-with-bacon',
		{ pour: 'Vermentino or Sauvignon Blanc', beer: 'Witbier', zeroProof: 'Sparkling water with citrus' },
		{ pour: 'Riesling or Grenache', beer: 'Farmhouse saison', zeroProof: 'Cloudy apple juice, chilled' },
		'note'
	],
	[
		'santa-maria-tri-tip',
		{ pour: 'Zinfandel (old-vine)', beer: 'Smoked porter', zeroProof: 'Cherry cola, honestly' },
		{ pour: 'Cabernet Sauvignon or Malbec', beer: 'Amber ale', zeroProof: 'Sparkling water, make room' },
		'note'
	],
	[
		'geoduck-crudo',
		{ pour: 'Albariño or Muscadet', beer: 'Witbier', zeroProof: 'Sparkling water with lemon' },
		{ pour: 'Champagne: when lost, bubbles', beer: 'Pilsner', zeroProof: 'Sparkling water with citrus' },
		'note'
	]
];
const pairingRuling = new Map(PAIRING_RULINGS.map(([slug, original, ours]) => [slug, { original, ours }]));

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
	const usedRulings = new Set<string>();
	const usedPairingRulings = new Set<string>();

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
		if (idx.costTier !== old.cost) {
			/* A ruling covers this only if it says EXACTLY this move. A dish that
			   diverges differently than the ruling predicted is a new fact, not a
			   covered one, and must fail. */
			const ruled = costRuling.get(idx.slug);
			if (ruled && ruled.original === old.cost && ruled.ours === idx.costTier) {
				usedRulings.add(idx.slug);
			} else {
				derivedDiffs.push(`#${i} cost (${old.n}): ${idx.costTier} vs ${old.cost}`);
			}
		} else if (costRuling.has(idx.slug)) {
			/* The ruling is no longer needed. Say so rather than carrying it. */
			derivedDiffs.push(`#${i} cost (${old.n}): agrees with the original now, so its COST_RULINGS row is stale`);
		}
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
		const pairingFields = [
			['pour', p.pour, old.pairing.pour, 'pour'],
			['beer', p.beer, old.pairing.beer, 'beer'],
			['zero-proof', p.zeroProof, old.pairing.zero, 'zeroProof']
		] as const;
		const pairingMismatch = pairingFields.some(([, ours, theirs]) => prose(ours) !== prose(theirs));
		if (pairingMismatch) {
			/* Same ruling-or-fail shape as cost above: covered only if the ruling
			   predicts every field that actually moved, exactly. */
			const ruled = pairingRuling.get(idx.slug);
			const covered =
				ruled &&
				pairingFields.every(
					([, ours, theirs, key]) =>
						prose(ruled.original[key]) === prose(theirs) && prose(ruled.ours[key]) === prose(ours)
				);
			if (covered) {
				usedPairingRulings.add(idx.slug);
			} else {
				for (const [field, ours, theirs] of pairingFields) {
					if (prose(ours) !== prose(theirs))
						derivedDiffs.push(`#${i} pairing ${field} (${old.n}): ${ours} vs ${theirs}`);
				}
			}
		} else if (pairingRuling.has(idx.slug)) {
			derivedDiffs.push(
				`#${i} pairing (${old.n}): agrees with the original now, so its PAIRING_RULINGS row is stale`
			);
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

	/* Every ruling has to earn its place. A row for a recipe the loop never
	   reached - renamed, overridden, backfilled since - is a row nobody is
	   checking, and the list would rot into a blanket exclusion. */
	expect(
		COST_RULINGS.map(([slug]) => slug).filter((slug) => !usedRulings.has(slug)),
		'a COST_RULINGS row that never fired is stale: delete it or find out why it stopped applying'
	).toEqual([]);
	expect(
		PAIRING_RULINGS.map(([slug]) => slug).filter((slug) => !usedPairingRulings.has(slug)),
		'a PAIRING_RULINGS row that never fired is stale: delete it or find out why it stopped applying'
	).toEqual([]);
});
