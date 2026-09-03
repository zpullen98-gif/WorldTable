/**
 * Lexicon <-> recipe cross-links, scored, then JUSTIFIED.
 *
 * The original (L2821) did:
 *     for (let ri = 0; ri < R.length && hits.length < 3; ri++) ...
 * Always scanning from index 0 and stopping at three hits. Index 0 is Cacio e
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
 *
 * ## The floor, which shipping "any positive score" turned out to need
 *
 * Measured on the shipped 1,148 links: 140 had a core-phrase hit; 1,008 rode
 * token overlap alone, and a 117-link stratified hand read put the defective
 * population at ~510 (95% CI 430-610) - three times the survey's 172. The
 * failures were not subtle: a restaurant-finance term on capital stacks linked
 * to Crepes via "Stack under a towel"; a cocktail template linked to Pad Thai
 * via "equally sweet, sour, salty"; Absinthe & the Rinse linked to Moroccan
 * mint tea via "Rinse the tea leaves".
 *
 * THE RULE: a link is real only if the recipe contains the term's own SUBJECT -
 * its core phrase with word boundaries, or a shared title-word that could name
 * that subject (not grammar, not a domain abstraction like "family" or
 * "service"), sitting where subjects sit (the name or an ingredient line, plus
 * method steps for technique and equipment terms) and appearing in at most 100
 * of the 1,844 recipes, so a staple word cannot carry a link on its own.
 *
 * Verbs and attributes live in step prose ("Roll the dough into a long strip",
 * "the season's labor"); subjects live in names and ingredient lines ("150g
 * guanciale", "600g waxy potatoes"). Position is the mechanical shadow of word
 * sense, and it scores 88% against the hand-read ledger where the best pure
 * frequency threshold proved a 74% ceiling ('strip' has DF 40, BELOW 'poach'
 * at 47 - rarity alone cannot tell a homograph from a technique).
 *
 * The filter is SUBTRACTIVE and runs AFTER the pick: filtering candidates at
 * push time made the pick loops promote 296 replacement links measured at
 * roughly three-quarters junk (chatty supplement ingredient lines - "150g good
 * tahini" - defeat the position heuristic for bottom-ranked candidates).
 * Subtractive, every change is a deletion, a term whose three picks were all
 * coincidences goes honestly empty, and nothing the diversity pass rejected
 * can be resurrected into shipping unjustified.
 *
 * ## Provenance, stated precisely
 *
 * Inherited in mechanism, amplified by the port. The original's TERM2REC also
 * qualified a recipe on any single shared significant word - 94.4% of the
 * shipped token-only links pass the original's own criterion - but it did so
 * behind a 66-word hand-tuned STOP list. The port fixed the position sweep,
 * halved the STOP to 33 words (31 shipped links rode exactly the words the
 * original stopped; 'spring' alone carried 17), and tokenized parentheticals
 * the original stripped. GENERIC below RESTORES the original's domain list -
 * recovered hand-tuning, not new invention - and the scoring STOP stays
 * untouched so every score and rank is byte-identical to the shipped build.
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

/** The SCORING stop list. Untouched: perturbing scores reshuffles every pick. */
const STOP = new Set([
	'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'to', 'for', 'with', 'is',
	'it', 'its', 'by', 'at', 'as', 'from', 'that', 'this', 'be', 'are', 'was',
	'vs', 'versus', 'into', 'out', 'up', 'down', 'not', 'but', 'you', 'your'
]);

/**
 * Words that cannot CARRY a link, consulted only by the justification floor.
 *
 * The first six lines are the original's own domain stop list, recovered from
 * reference/world-table-v1.html:2816 - the port dropped them while fixing the
 * position sweep, and 31 shipped links rode exactly these words ('spring'
 * alone carried 17, mostly spring onions into a seasonality essay). The last
 * two lines are measured additions, each audited corpus-wide via a sole-carrier
 * table: 'service' alone carried 11 links, all garnish-header coincidences
 * ("The service: capers, thick cream..."); 'family' carried 10 ("the entire
 * bearnaise family await" linked a kielbasa survey to hollandaise).
 */
const GENERIC = new Set([
	'rule', 'rules', 'month', 'months', 'year', 'years', 'season', 'seasons',
	'seasonal', 'calendar', 'winter', 'summer', 'spring', 'autumn', 'world',
	'around', 'truth', 'test', 'clock', 'against', 'storage', 'global', 'flip',
	'hemisphere', 'practice', 'building', 'reading', 'second', 'first', 'high',
	'late', 'great', 'little', 'when', 'where', 'which', 'their', 'every',
	'what', 'over', 'beyond',
	'service', 'family', 'families', 'place', 'structure', 'flavor', 'honestly',
	'whites', 'blanc', 'pantry', 'sparkling', 'spice', 'food', 'good', 'body',
	'speed', 'built', 'matters'
]);

/**
 * Categories whose subjects are ACTIONS, so a method step is subject position.
 * "Deglaze with wine, scraping the fond" is the term being performed; the same
 * allowance on a produce term is how "spring onion tops" reached a seasonality
 * essay.
 */
const TECHY = new Set([
	'Techniques: Heat & Precision',
	'Techniques: Knife & Prep',
	'Knife & Equipment Atlas'
]);

/** A recipe-document-frequency above this makes a word a staple, not a subject. */
const STAPLE_DF = 100;

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

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Word-boundaried, so 'chuck' no longer matches 'Chuckwagon' and 'the round'
 * no longer matches 'the rounds'. The cost is the inflections - 'spatchcocked'
 * refuses 'spatchcock' - and those are PINNED in overrides.json rather than
 * loosened here, because a suffix allowance would readmit 'rounds'.
 * @param {string} core
 */
const boundary = (core) => new RegExp('(?<![a-z0-9])' + escapeRe(core) + '(?![a-z0-9])');

/**
 * @param {Array<{n: string, c: string, i: string[], m: string[]}>} R
 * @param {string[]} recipeSlugs
 * @param {Array<{t: string, c: string, d: string}>} D
 * @param {string[]} lexSlugs
 * @param {string[]} blobs
 * @param {Record<string, {reason?: string, empty?: boolean, keep?: string[], drop?: string[]}>} lexOverrides
 *        Hand rulings for word-sense collisions no scorer can see. `empty`
 *        clears the term, `drop` removes named links, `keep` pins links the
 *        rule would delete. Dead rows are returned as problems: a judgement
 *        that no longer binds must be re-made, not silently carried.
 */
export function buildCrosslinks(R, recipeSlugs, D, lexSlugs, blobs, lexOverrides = {}) {
	const recipeTokens = R.map((r, i) => new Set(tokens(blobs[i])));
	const nameFolded = R.map((r) => fold(r.n));
	const stepsFolded = R.map((r) => fold(r.m.join(' ')));
	const ingFolded = R.map((r) => fold(r.i.join(' ')));
	const nameTok = R.map((r) => new Set(tokens(r.n)));
	const ingTok = R.map((r) => new Set(tokens(r.i.join(' '))));
	const stepTok = R.map((r) => new Set(tokens(r.m.join(' '))));

	// Recipe document frequency over the same token space the score uses.
	/** @type {Map<string, number>} */
	const rdf = new Map();
	for (const set of recipeTokens) for (const t of set) rdf.set(t, (rdf.get(t) ?? 0) + 1);

	/**
	 * The rule. A shared token justifies a link only from subject position.
	 * @param {{c: string}} entry
	 * @param {string} t
	 * @param {number} ri
	 */
	const qualifies = (entry, t, ri) =>
		!GENERIC.has(t) &&
		(nameTok[ri].has(t) || ingTok[ri].has(t) || (TECHY.has(entry.c) && stepTok[ri].has(t))) &&
		(rdf.get(t) ?? 0) <= STAPLE_DF;

	const termToRecipes = new Map();
	const recipeToTerms = new Map();
	/** slug -> the term as written, for the inverse below. */
	const termName = new Map();
	/** Every 'term|recipe' pair the rule (or a pin) justifies, for the build gate. */
	const justified = new Set();
	/** @type {string[]} */
	const overrideProblems = [];
	const usedOverrideKeys = new Set();
	const slugSet = new Set(recipeSlugs);

	D.forEach((entry, ti) => {
		const termSlug = lexSlugs[ti];
		termName.set(termSlug, entry.t);
		const phrase = fold(entry.t);
		// "Brisket (Point vs. Flat)" -> the useful part is before the paren.
		const core = phrase.split('(')[0].trim();
		const coreRe = core.length > 2 ? boundary(core) : null;
		// Deduped: the doc comment above always said "distinct"; now it is true.
		const tks = [...new Set(tokens(entry.t))];

		const scored = [];
		for (let ri = 0; ri < R.length; ri++) {
			let score = 0;
			let coreHit = false;
			if (coreRe) {
				const nHit = coreRe.test(nameFolded[ri]);
				const sHit = coreRe.test(stepsFolded[ri]);
				const iHit = coreRe.test(ingFolded[ri]);
				if (nHit) score += 12;
				if (sHit) score += 8;
				if (iHit) score += 4;
				coreHit = nHit || sHit || iHit;
			}
			const shared = [];
			for (const t of tks)
				if (recipeTokens[ri].has(t)) {
					score += 2;
					shared.push(t);
				}
			if (score > 0) scored.push({ ri, score, shared, coreHit });
		}

		scored.sort((a, b) => b.score - a.score || a.ri - b.ri);

		const ov = lexOverrides[termSlug];
		if (ov) usedOverrideKeys.add(termSlug);
		const keep = new Set(ov?.keep ?? []);
		const drop = new Set(ov?.drop ?? []);

		// Feed the gate: every candidate the rule would accept, plus the pins.
		for (const cand of scored) {
			const rs = recipeSlugs[cand.ri];
			if (keep.has(rs) || cand.coreHit || cand.shared.some((t) => qualifies(entry, t, cand.ri)))
				justified.add(termSlug + '|' + rs);
		}

		// Greedy pick with a diversity penalty, so one chapter can't sweep.
		const picked = [];
		const chapters = new Set();
		for (const cand of scored) {
			if (picked.length >= 3) break;
			const penalty = chapters.has(R[cand.ri].c) ? 3 : 0;
			if (cand.score - penalty <= 0) continue;
			picked.push(cand);
			chapters.add(R[cand.ri].c);
		}
		// If the penalty starved us, top up from the raw ranking.
		for (const cand of scored) {
			if (picked.length >= 3) break;
			if (!picked.includes(cand)) picked.push(cand);
		}

		/*
		 * The justification filter, AFTER both pick loops, so nothing the
		 * diversity pass rejected can be resurrected into shipping unjustified.
		 * Order: keep beats drop beats rule; `empty` clears the term.
		 */
		const pickedSlugs = new Set(picked.map((c) => recipeSlugs[c.ri]));
		const final = ov?.empty
			? []
			: picked.filter((cand) => {
					const rs = recipeSlugs[cand.ri];
					if (keep.has(rs)) return true;
					if (drop.has(rs)) return false;
					return cand.coreHit || cand.shared.some((t) => qualifies(entry, t, cand.ri));
				});

		// Override hygiene: a row that binds nothing is a judgement gone stale.
		if (ov) {
			for (const rs of keep) {
				if (!slugSet.has(rs))
					overrideProblems.push(`lexicon override ${termSlug}: keep names no recipe "${rs}"`);
				else if (!pickedSlugs.has(rs))
					overrideProblems.push(
						`lexicon override ${termSlug}: keep "${rs}" pins a pair the scorer never picked`
					);
			}
			for (const rs of drop) {
				if (!slugSet.has(rs))
					overrideProblems.push(`lexicon override ${termSlug}: drop names no recipe "${rs}"`);
				else if (!pickedSlugs.has(rs))
					overrideProblems.push(
						`lexicon override ${termSlug}: drop "${rs}" suppressed nothing this build`
					);
			}
			if (ov.empty && picked.length === 0)
				overrideProblems.push(`lexicon override ${termSlug}: empty on a term with no picks`);
		}

		termToRecipes.set(
			termSlug,
			NO_CROSSLINK.has(termSlug) ? [] : final.map((cand) => recipeSlugs[cand.ri])
		);
	});

	for (const key of Object.keys(lexOverrides)) {
		if (key.startsWith('_')) continue;
		if (!usedOverrideKeys.has(key))
			overrideProblems.push(`lexicon override "${key}" matches no lexicon term slug`);
	}

	/*
	 * Invert, capped at 4 terms per recipe, best-scoring first.
	 *
	 * Carries the term's NAME beside its slug. The recipe page cannot look one
	 * up: lexicon.json is a deliberate dynamic import ("a few hundred KB", see
	 * data.ts), and pulling it onto every recipe page to print three words
	 * would be a poor trade. 631 references over 279 distinct terms is 19KB
	 * inlined, against a recipes.full.json already past 7MB.
	 */
	const inverse = new Map();
	for (const [termSlug, slugs] of termToRecipes) {
		const name = termName.get(termSlug) ?? termSlug;
		slugs.forEach((s, rank) => {
			if (!inverse.has(s)) inverse.set(s, []);
			inverse.get(s).push({ slug: termSlug, term: name, rank });
		});
	}
	for (const [slug, list] of inverse) {
		list.sort((a, b) => a.rank - b.rank);
		recipeToTerms.set(
			slug,
			list.slice(0, 4).map((x) => ({ slug: x.slug, term: x.term }))
		);
	}

	return { termToRecipes, recipeToTerms, justified, overrideProblems };
}
