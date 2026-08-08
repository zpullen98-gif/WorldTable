/**
 * Peak months for a recipe, northern-hemisphere canonical.
 *
 * The original computed this lazily at runtime by scanning all 970 recipe texts
 * for every seasonal produce name the moment you ticked "Peak this month"
 * (`computeSeasonIdx`, L3304) — and never invalidated the cache when a family
 * recipe was added (L3469), so new dishes could never appear under the filter.
 * Storing the months per recipe makes the filter an array intersection and the
 * staleness bug structurally impossible.
 *
 * A recipe's season is the union of the peak months of the seasonal produce it
 * names. A dish naming no seasonal produce returns [] and is treated as
 * always-available rather than never-available.
 */
export function deriveSeason(blob, SEASON) {
	const months = new Set();
	for (const [produce, peak] of Object.entries(SEASON)) {
		// Compound keys like "Squash/Pumpkin" match on either half.
		const names = produce.split('/').map((s) => s.trim().toLowerCase());
		if (names.some((n) => blob.includes(n))) {
			for (const m of peak) months.add(m);
		}
	}
	return [...months].sort((a, b) => a - b);
}
