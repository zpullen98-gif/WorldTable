/**
 * Lexicon <-> recipe cross-links, scored.
 *
 * The original (L2821) did:
 *     for (let ri = 0; ri < R.length && hits.length < 3; ri++) ...
 * — always scanning from index 0 and stopping at three hits. Index 0 is Cacio e
 * Pepe, so the first chapter in the array (Italian) won almost every link by
 * position rather than by relevance. The build gate in build-data.mjs asserts no
 * chapter takes more than 8% of all links, which is what turns this from a fix
 * into a guarantee.
 *
 * Score:
 *   +12  the term appears in the recipe's name
 *   + 8  in a method step (the term is being *performed*)
 *   + 4  in an ingredient line
 *   + 2  per distinct significant token shared
 *   - 3  a chapter already represented in this term's links (diversity penalty)
 */
/**
 * Terms that must reach NO recipe.
 *
 * Cross-links are scored on keyword overlap, which is the right instinct for a
 * technique and the wrong one for safety guidance: the food-safety entry won
 * key lime pie, pretzels and a tomato sauce, and printing those three beside
 * danger-zone and cross-contamination guidance implies a relationship the score
 * never established. An empty list renders nothing (the lexicon page already
 * guards on length), which is the honest output. Enforced by a gate in
 * tools/derive/sanitation.mjs, so this cannot quietly regress.
 */
const NO_CROSSLINK = new Set([
	'food-safety-the-chef-owners-non-negotiables',
	'health-inspections-and-crisis-management'
]);

const STOP = new Set([
	'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'to', 'for', 'with', 'is',
	'it', 'its', 'by', 'at', 'as', 'from', 'that', 'this', 'be', 'are', 'was',
	'vs', 'versus', 'into', 'out', 'up', 'down', 'not', 'but', 'you', 'your'
]);

const fold = (s) =>
	s
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();

function tokens(text) {
	return fold(text)
		.split(/[^a-z0-9]+/)
		.filter((w) => w.length > 3 && !STOP.has(w));
}

export function buildCrosslinks(R, recipeSlugs, D, lexSlugs, blobs) {
	const recipeTokens = R.map((r, i) => new Set(tokens(blobs[i])));
	const nameFolded = R.map((r) => fold(r.n));
	const stepsFolded = R.map((r) => fold(r.m.join(' ')));
	const ingFolded = R.map((r) => fold(r.i.join(' ')));

	const termToRecipes = new Map();
	const recipeToTerms = new Map();

	D.forEach((entry, ti) => {
		const termSlug = lexSlugs[ti];
		const phrase = fold(entry.t);
		// "Brisket (Point vs. Flat)" -> the useful part is before the paren.
		const core = phrase.split('(')[0].trim();
		const tks = tokens(entry.t);

		const scored = [];
		for (let ri = 0; ri < R.length; ri++) {
			let score = 0;
			if (core.length > 2) {
				if (nameFolded[ri].includes(core)) score += 12;
				if (stepsFolded[ri].includes(core)) score += 8;
				if (ingFolded[ri].includes(core)) score += 4;
			}
			for (const t of tks) if (recipeTokens[ri].has(t)) score += 2;
			if (score > 0) scored.push({ ri, score });
		}

		scored.sort((a, b) => b.score - a.score || a.ri - b.ri);

		// Greedy pick with a diversity penalty, so one chapter can't sweep.
		const picked = [];
		const chapters = new Set();
		for (const cand of scored) {
			if (picked.length >= 3) break;
			const penalty = chapters.has(R[cand.ri].c) ? 3 : 0;
			if (cand.score - penalty <= 0) continue;
			picked.push(cand.ri);
			chapters.add(R[cand.ri].c);
		}
		// If the penalty starved us, top up from the raw ranking.
		for (const cand of scored) {
			if (picked.length >= 3) break;
			if (!picked.includes(cand.ri)) picked.push(cand.ri);
		}

		termToRecipes.set(
			termSlug,
			NO_CROSSLINK.has(termSlug) ? [] : picked.map((ri) => recipeSlugs[ri])
		);
	});

	// Invert, capped at 4 terms per recipe, best-scoring first.
	const inverse = new Map();
	for (const [termSlug, slugs] of termToRecipes) {
		slugs.forEach((s, rank) => {
			if (!inverse.has(s)) inverse.set(s, []);
			inverse.get(s).push({ termSlug, rank });
		});
	}
	for (const [slug, list] of inverse) {
		list.sort((a, b) => a.rank - b.rank);
		recipeToTerms.set(
			slug,
			list.slice(0, 4).map((x) => x.termSlug)
		);
	}

	return { termToRecipes, recipeToTerms };
}
