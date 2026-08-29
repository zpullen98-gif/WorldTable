/**
 * Drill prompts: the guide's own definitions, with the answer taken out.
 *
 * A term's definition very often opens with the term: "À LA CARTE: dishes
 * priced and fired individually…". Asking "which term does this define?" over
 * raw prose is therefore not a question, it is a reading test. So every prompt
 * ships REDACTED, and the redaction is gated in both directions.
 *
 * ## Why the prompt is built here and not in the component
 *
 * Two reasons, both measured.
 *
 * The lexicon's own quiz truncates its prompt with `.slice(0, 180)`. Across the
 * 176 front-of-house definitions, ZERO are 180 characters or shorter; the
 * shortest is 443, the median 678, the longest 1,335, so that slice would cut
 * every single front-of-house prompt mid-sentence, and often mid-word. A drill
 * that asks half a question is not a drill.
 *
 * And redaction is a rule with edge cases (possessives, plurals, the term
 * appearing in its own first two words), which is exactly the kind of thing
 * CLAUDE.md says must run once at build time and land as a reviewable diff.
 */

/** Words too common to be worth hiding, and too common to hide safely. */
const STOP = new Set([
	'the', 'and', 'for', 'with', 'from', 'that', 'this', 'its', 'a', 'an', 'of',
	'in', 'on', 'to', 'or', 'is', 'are', 'was', 'be', 'by', 'at', 'as', 'it'
]);

/** What a prompt is cut to. Long enough to be a question, short enough to read. */
export const PROMPT_MAX = 420;

/** A redaction that eats more than this much of the prompt is not a question. */
export const MAX_REDACTED_SHARE = 0.3;

/* The blank a drill leaves where the term should go.
   It was two em dashes. The product is being scrubbed of em dashes, and a
   redaction glyph is the one place where a global sweep would do real damage:
   it is not punctuation, it is the answer slot, and rewriting it per sentence
   would leave 366 drills with inconsistent blanks. Changed here, once, and
   regenerated. Two characters wide on purpose, because PROMPT_MAX clips the
   built prompt by length and a wider glyph would silently truncate the longer
   ones somewhere new. */
export const REDACTION = '__';

/**
 * The significant words of a term: what must not survive in its own prompt.
 *
 * Accents are folded because the corpus writes both "Gewürztraminer" and
 * "Gewurztraminer", and a redaction that misses the accented spelling leaves
 * the answer in plain sight.
 */
/**
 * @param {string} term
 * @returns {string[]}
 */
export function significantWords(term) {
	return [
		...new Set(
			String(term)
				.normalize('NFD')
				.replace(/[̀-ͯ]/g, '')
				.toLowerCase()
				.split(/[^a-z0-9]+/)
				.filter((w) => w.length > 3 && !STOP.has(w))
		)
	];
}

/** Fold a haystack the same way, so comparisons line up character-for-character. */
/** @param {string} s */
const fold = (s) =>
	String(s)
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();

/**
 * Hide every significant word of `term` inside `definition`, then cut to length.
 *
 * Cuts AFTER redacting, never before: redacting a cut string leaves the answer
 * visible in whatever was cut away, which matters because these prompts are
 * three times the length they are shown at.
 *
 * Matches on a folded copy but splices the ORIGINAL, so accents and casing
 * survive everywhere the redaction does not reach.
 */
/**
 * Is one word a near-spelling of another? One edit apart, five characters up.
 *
 * This exists because of a leak found by reading a real prompt on screen: the
 * Munster card redacted "Munster" and left "the mild American muenster that
 * borrowed the name" — with Munster sitting in the option list underneath.
 * Exact matching cannot see that, and across the deck 25 of 186 cards leaked
 * the same way: roqueforti beside Roquefort, manchega beside Manchego, sucuk
 * beside Sujuk, campania beside Campana.
 *
 * Five characters, because below that the false-positive rate is noise. A false
 * positive costs one extra hidden word and the over-redaction gate catches any
 * excess; a false negative hands over the answer.
 */
/**
 * @param {string} word
 * @param {string} target
 */
function nearSpelling(word, target) {
	if (word.length < 5 || target.length < 5) return false;
	if (Math.abs(word.length - target.length) > 1) return false;
	let i = 0;
	let j = 0;
	let edits = 0;
	while (i < word.length && j < target.length) {
		if (word[i] === target[j]) {
			i++;
			j++;
			continue;
		}
		if (++edits > 1) return false;
		if (word.length > target.length) i++;
		else if (target.length > word.length) j++;
		else {
			i++;
			j++;
		}
	}
	return edits + (word.length - i) + (target.length - j) <= 1;
}

/**
 * @param {string} definition
 * @param {string} term
 */
export function redact(definition, term) {
	const words = significantWords(term);
	const original = String(definition);
	const folded = fold(original);

	/* Tokenised rather than regex-replaced.
	 *
	 * The first version built a regex per significant word with a plural and
	 * possessive suffix group. That handled the possessive and missed the
	 * near-spelling — and there is no suffix pattern that catches one. Walking
	 * the tokens once lets exact matches and near-spellings share a decision. */
	/** @type {Array<[number, number]>} */
	const spans = [];
	const token = /[a-z0-9]+/g;
	let m;
	while ((m = token.exec(folded)) !== null) {
		const w = m[0];
		const hit = words.some(
			(sig) =>
				w === sig ||
				w === sig + 's' ||
				w === sig + 'es' ||
				(sig.endsWith('s') && w === sig.slice(0, -1)) ||
				nearSpelling(w, sig)
		);
		if (hit) spans.push([m.index, m.index + w.length]);
	}

	let out = '';
	let cursor = 0;
	let hidden = 0;
	for (const [a, b] of spans) {
		if (a < cursor) continue;
		out += original.slice(cursor, a) + REDACTION;
		hidden += b - a;
		cursor = b;
	}
	out += original.slice(cursor);

	const clipped =
		// \s and \S, with their backslashes. This shipped as /s+S*$/ — literal
		// letters — so the trim-back-to-a-word-boundary guard never fired once,
		// and every clipped prompt could end mid-word. A gate that could not
		// fail, in miniature.
		out.length > PROMPT_MAX ? out.slice(0, PROMPT_MAX).replace(/\s+\S*$/, '') + '…' : out;
	return {
		prompt: clipped,
		hiddenShare: original.length ? hidden / original.length : 0,
		hits: spans.length
	};
}

/**
 * @param {Array<{ slug: string, term: string, category: string, definition: string }>} lexicon
 * @param {Array<{ key: string, terms: Array<{ slug: string }> }>} modules
 */
export function buildDrills(lexicon, modules) {
	/** @type {string[]} */
	const problems = [];
	const bySlug = new Map(lexicon.map((e) => [e.slug, e]));

	/** slug -> the module that teaches it, so a round can be scoped. */
	/** @type {Map<string, string>} */
	const moduleOf = new Map();
	for (const m of modules) for (const t of m.terms) moduleOf.set(t.slug, m.key);

	/** @type {Array<{ slug: string, term: string, category: string, moduleId: string, prompt: string, field?: 'category'|'module'|'all' }>} */
	const cards = [];
	for (const [slug, moduleId] of moduleOf) {
		const entry = bySlug.get(slug);
		if (!entry) {
			problems.push(`drills: "${slug}" is in a module but not in the lexicon`);
			continue;
		}
		const { prompt, hiddenShare } = redact(entry.definition, entry.term);

		// FORWARD: no significant word of the term may survive in its own prompt.
		const leaked = significantWords(entry.term).filter((w) =>
			new RegExp(`(^|[^a-z0-9])${w}(?![a-z0-9])`).test(fold(prompt))
		);
		if (leaked.length) {
			problems.push(
				`drills: "${entry.term}" leaks ${JSON.stringify(leaked)} into its own prompt — ` +
					'the answer is visible in the question'
			);
		}

		// REVERSE: a sentence of dashes is not a question.
		if (hiddenShare > MAX_REDACTED_SHARE) {
			problems.push(
				`drills: redacting "${entry.term}" eats ${(hiddenShare * 100).toFixed(0)}% of its prompt ` +
					`(limit ${MAX_REDACTED_SHARE * 100}%) — the term is too much of its own definition to ask about`
			);
		}

		cards.push({ slug, term: entry.term, category: entry.category, moduleId, prompt });
	}

	/* Where each card's three wrong answers come from.
	 *
	 * Same CATEGORY by preference, so a round cannot be answered by topic alone.
	 * But the track pulls in ten supporting terms from outside the five atlases,
	 * and one of those categories contributes a single drillable term — it can
	 * field nothing. Rather than fail the build over a card that is perfectly
	 * askable, or silently let the drill hang looking for a fourth option, the
	 * FIELD is decided here and shipped: category, else module, else the whole
	 * deck. Decided once, visible in the diff, and the component never guesses.
	 */
	/** @type {Map<string, number>} */
	const perCategory = new Map();
	/** @type {Map<string, number>} */
	const perModule = new Map();
	for (const c of cards) {
		perCategory.set(c.category, (perCategory.get(c.category) ?? 0) + 1);
		perModule.set(c.moduleId, (perModule.get(c.moduleId) ?? 0) + 1);
	}
	let widened = 0;
	for (const c of cards) {
		if ((perCategory.get(c.category) ?? 0) >= 4) c.field = 'category';
		else if ((perModule.get(c.moduleId) ?? 0) >= 4) c.field = 'module';
		else {
			c.field = 'all';
			widened++;
		}
	}

	// The only genuinely fatal case: a deck too small to field one question.
	if (cards.length < 4) {
		problems.push(`drills: only ${cards.length} cards — a round cannot field four options`);
	}

	console.log(
		`  drills: ${cards.length} cards, ${widened} drawing distractors from the whole deck ` +
			`because their own category cannot field four`
	);

	return {
		drills: { cards, categories: Object.fromEntries(perCategory) },
		problems
	};
}
