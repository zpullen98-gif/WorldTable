/**
 * slugify: the URL primary key for recipes and lexicon terms.
 *
 * NFD-normalize then strip combining marks so "Ragù" → "ragu" and "Crème Brûlée"
 * → "creme-brulee". The same folding is used by the search tokenizer, which is
 * what makes an unaccented query find an accented dish.
 *
 * Diacritic folding is what creates the one collision in the corpus: recipe #122
 * "Bun Thit Nuong" (Vietnamese, 45 min) and recipe #419 "Bún Thịt Nướng" (Lunch
 * Atlas, 75 min) are two genuinely different recipes for the same dish, spelled
 * differently. Both fold to `bun-thit-nuong`.
 *
 * See qualifiedSlugs() for how that is resolved: deterministically, and without
 * depending on which one happens to come first in the array.
 */
/** @param {string} input */
export function slugify(input) {
	return String(input)
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '') // combining diacritics
		.replace(/[’'`´]/g, '') // apostrophes vanish: "chef's" → "chefs"
		.replace(/&/g, ' and ')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
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
