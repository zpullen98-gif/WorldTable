/**
 * slugify: the URL primary key for recipes and lexicon terms.
 *
 * Transliterate the letters Unicode will not take apart (see TRANSLITERATIONS),
 * then NFD-normalize and strip combining marks, so "Ragù" → "ragu", "Crème
 * Brûlée" → "creme-brulee" and "Smørrebrød" → "smorrebrod".
 *
 * The search tokenizer in src/lib/search-config.mjs shares the SECOND pass only:
 * it NFD-folds so an unaccented query finds an accented dish, but it indexes
 * "mantı" rather than "manti", because a search token is not a URL and does not
 * have to survive `[^a-z0-9]`. Do not assume the two produce the same string.
 *
 * Diacritic folding is what creates the one collision in the corpus: recipe #122
 * "Bun Thit Nuong" (Vietnamese, 45 min) and recipe #419 "Bún Thịt Nướng" (Lunch
 * Atlas, 75 min) are two genuinely different recipes for the same dish, spelled
 * differently. Both fold to `bun-thit-nuong`.
 *
 * See qualifiedSlugs() for how that is resolved: deterministically, and without
 * depending on which one happens to come first in the array.
 */
/**
 * Letters NFD cannot help with, and the ASCII they stand for.
 *
 * NFD only ever separates a base letter from its combining marks. A letter that
 * is its own indivisible codepoint has nothing to separate, so it survives the
 * strip untouched and then meets `[^a-z0-9]` — which turned "Smørrebrød" into
 * `sm-rrebr-d`, "Mantı" into `mant`, and "Æbleskiver" into `bleskiver`. Twenty
 * two recipes wore a slug with holes punched through it.
 *
 * So the fold happens in two passes, and this one runs FIRST: substitute the
 * letters Unicode will not decompose, then let NFD handle everything it can.
 * Both cases are listed because `.toLowerCase()` runs at the end of the chain,
 * after this table has already had its turn.
 *
 * Some entries below (å, ç, ş, ğ, ę, ą, ż, ź, ś, ć, ń, İ) DO decompose, and
 * were never broken. They are here anyway so that this table is the complete
 * statement of the rule rather than a list of the places Unicode happened to
 * let us down — a reader should not have to know which letters decompose to
 * know what a slug will be. They produce exactly what NFD produced before.
 *
 * The choices that are not one-to-one are conventional: ß is "ss" and not "s",
 * æ/œ are "ae"/"oe" and not "a"/"o", þ is "th". Turkish dotless ı and dotted İ
 * both land on "i", which is right for a URL and wrong for Turkish casing; a
 * slug is not a place to relitigate that.
 */
/** @type {Record<string, string>} */
const TRANSLITERATIONS = {
	ø: 'o', Ø: 'o',
	æ: 'ae', Æ: 'ae',
	œ: 'oe', Œ: 'oe',
	å: 'a', Å: 'a',
	ı: 'i', İ: 'i',
	ł: 'l', Ł: 'l',
	ę: 'e', Ę: 'e',
	ą: 'a', Ą: 'a',
	ż: 'z', Ż: 'z',
	ź: 'z', Ź: 'z',
	ś: 's', Ś: 's',
	ć: 'c', Ć: 'c',
	ń: 'n', Ń: 'n',
	ğ: 'g', Ğ: 'g',
	ş: 's', Ş: 's',
	ç: 'c', Ç: 'c',
	đ: 'd', Đ: 'd',
	ð: 'd', Ð: 'd',
	ß: 'ss',
	þ: 'th', Þ: 'th',
	ħ: 'h', Ħ: 'h',
	ŧ: 't', Ŧ: 't',
	ŋ: 'n', Ŋ: 'n'
};

/* Built from the table rather than written out, so the two can never disagree.
   Every key is a plain letter; none of them mean anything inside a class. */
const NON_DECOMPOSING = new RegExp(`[${Object.keys(TRANSLITERATIONS).join('')}]`, 'g');

/**
 * The first pass on its own, for callers that fold but do not slugify.
 *
 * The search tokenizer needs exactly this and nothing after it. It has no
 * `[^a-z0-9]` to survive, so it keeps its apostrophes and spaces, but it has
 * the same trouble with the letters NFD will not take apart, and it was losing
 * seven dishes to them: a cook typing "Cilbir" got an empty grid because the
 * index held "cılbır" and two dotless i's is two edits against a fuzzy budget
 * of one. Sharing the table rather than the whole function is what fixes that
 * without flattening a search token into a URL.
 *
 * @param {string} input
 */
export function transliterate(input) {
	return String(input).replace(NON_DECOMPOSING, (c) => TRANSLITERATIONS[c]);
}

/** @param {string} input */
export function slugify(input) {
	return String(input)
		.replace(NON_DECOMPOSING, (c) => TRANSLITERATIONS[c])
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '') // combining diacritics
		.replace(/[’'`´]/g, '') // apostrophes vanish: "chef's" → "chefs"
		.replace(/&/g, ' and ')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}


/**
 * A slug for a name that slugify empties out.
 *
 * `slugify` ends on `[^a-z0-9]+` and then trims the dashes, so a name written
 * wholly in a script it has no transliteration for survives as the EMPTY
 * STRING. Measured: 中国菜, Питание, Ελληνικά, 한식 and עברית all slugify to "".
 * The guide's own corpus never hits this - every one of its 1,844 names is
 * Latin - but the family shelf is a form a person types their own dish into,
 * and a family that cooks in Chinese reaches it by typing, not by hand-editing
 * a file. Both the dish slug and the chapter slug went through it.
 *
 * What "" costs: the dish's page is `/family/`, and because a chapter slug has
 * no uniqueness pass at all, EVERY non-Latin chapter collapses onto the same
 * empty slug and merges into one rail row. Two different dishes also collide on
 * import, where family recipes are deduplicated by slug.
 *
 * The fallback must be DETERMINISTIC in the name, not a counter or a timestamp:
 * a .wtjson travels between a phone and a laptop, and the slug is the identity
 * the merge dedupes on. Two devices given the same name have to produce the
 * same slug or the same dish arrives twice. So it is a hash, normalized NFC
 * first because the same name typed on two keyboards can be composed
 * differently and must still hash alike.
 *
 * FNV-1a, 32-bit, base36. Not a security hash and not trying to be: it is a
 * short stable label. `>>> 0` on every step keeps it unsigned in JS's 32-bit
 * bitwise domain.
 *
 * @param {string} input
 */
export function stableSuffix(input) {
	const s = String(input).normalize('NFC');
	let h = 0x811c9dc5;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 0x01000193) >>> 0;
	}
	return h.toString(36);
}

/**
 * slugify, but never empty.
 *
 * `kind` is the readable half - 'dish' or 'chapter' - so a URL that cannot
 * carry the name at least says what it is. Callers on the guide's own data
 * must keep using `slugify`: this is for names a person typed.
 *
 * @param {string} input
 * @param {string} kind
 */
export function slugOrFallback(input, kind) {
	return slugify(input) || `${kind}-${stableSuffix(input)}`;
}

/**
 * Assign a stable slug to every item, qualifying collisions by a second field.
 *
 * The naive fix (append -2 to whichever came second) makes the slug a function
 * of array position, so reordering the data silently breaks saved bookmarks and
 * every persisted reference. Instead, when a base slug is claimed by more than
 * one item, *all* claimants get qualified with their discriminator. Nobody keeps
 * the bare slug, so the result depends only on the set of items, never on their
 * order.
 *
 * @template T
 * @param {T[]} items  the records to slug
 * @param {(item: T) => string} key  item → the name to slug (e.g. r => r.n)
 * @param {(item: T) => string} qualifier  item → the discriminator (e.g. r => r.c)
 * @returns {string[]} slugs, parallel to items
 */
export function qualifiedSlugs(items, key, qualifier) {
	const bases = items.map((it) => slugify(key(it)));

	const counts = new Map();
	for (const b of bases) counts.set(b, (counts.get(b) ?? 0) + 1);

	const slugs = bases.map((base, i) =>
		counts.get(base) === 1 ? base : `${base}-${slugify(qualifier(items[i]))}`
	);

	// A qualifier that doesn't actually disambiguate is a bug we want loudly, not
	// a duplicate URL we discover in production.
	const seen = new Set();
	/** @type {string[]} */
	const stillColliding = [];
	slugs.forEach((s, i) => {
		if (seen.has(s)) stillColliding.push(`${s} (${key(items[i])})`);
		seen.add(s);
	});
	if (stillColliding.length) {
		throw new Error(
			`qualifiedSlugs: qualifier failed to disambiguate: ${stillColliding.join(', ')}`
		);
	}

	return slugs;
}
