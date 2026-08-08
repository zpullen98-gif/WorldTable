/**
 * recipe slug -> pantry item labels it calls for.
 *
 * The original built this lazily into `window.REC_PANT` the first time you used
 * Pantry Match (L2778), scanning 970 recipes × 177 items on the main thread.
 *
 * Matching deliberately uses the NARROW text — name + ingredients only — because
 * that is what the original's `RTEXT` (L2746) contained. Using the full blob
 * would match "butter" from a method step like "butter the dish", which is not
 * the same claim as "this recipe needs butter".
 */
export function derivePantryMap(R, _fullBlobs, PANTRY) {
	const map = new Map();
	const items = PANTRY.flatMap((g) => g.items);

	R.forEach((r, i) => {
		const narrow = `${r.n} ${r.i.join(' ')}`.toLowerCase();
		const labels = [];
		for (const it of items) {
			if (it.k.some((k) => narrow.includes(k))) labels.push(it.l);
		}
		map.set(i, labels);
	});
	return map;
}

/** Same narrow blob the pantry matcher uses, exposed for the search index. */
export function narrowBlob(r) {
	return `${r.n} ${r.i.join(' ')}`.toLowerCase();
}
