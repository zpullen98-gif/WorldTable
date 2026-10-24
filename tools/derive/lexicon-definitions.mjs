/**
 * Narrow editorial corrections to sealed definitions. The archive, extracted
 * text, identity and existing cross-links stay intact. Apply before technique
 * anchors, drills and search are built, so every reading surface agrees.
 */

/**
 * @template {{ slug: string, definition: string }} T
 * @param {T[]} entries
 * @param {Record<string, { reason: string, definition: string, sources: string[] }>} rulings
 * @returns {T[]}
 */
export function applyLexiconDefinitions(entries, rulings) {
	const known = new Set(entries.map((e) => e.slug));
	for (const [slug, ruling] of Object.entries(rulings)) {
		if (!known.has(slug)) throw new Error(`lexiconDefinitions: unknown slug ${slug}`);
		if (!ruling?.reason?.trim() || !ruling?.definition?.trim()) {
			throw new Error(`lexiconDefinitions: ${slug} needs a reason and definition`);
		}
		if (!Array.isArray(ruling.sources) || !ruling.sources.length ||
			ruling.sources.some((url) => typeof url !== 'string' || !url.startsWith('https://'))) {
			throw new Error(`lexiconDefinitions: ${slug} needs source URLs`);
		}
	}
	return entries.map((entry) => rulings[entry.slug]
		? { ...entry, definition: rulings[entry.slug].definition }
		: entry);
}
