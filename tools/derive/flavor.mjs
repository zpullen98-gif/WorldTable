/**
 * Palate profile: ported from `flavorFor` (L3547) with the O(n) `R.indexOf(r)`
 * lookup removed; the caller passes the text blob it already has.
 *
 * NOTE_DEFS entries arrive as [tag, RegExp, midPhrase, finishPhrase].
 */
export function deriveFlavor(blob, NOTE_DEFS) {
	const hits = [];
	for (const [tag, re, mid, fin] of NOTE_DEFS) {
		const m = blob.match(new RegExp(re.source, 'g'));
		if (m) hits.push({ tag, mid, fin, n: m.length });
	}

	// fiery outranks gently hot; drop the weaker twin
	if (hits.some((h) => h.tag === 'fiery')) {
		const i = hits.findIndex((h) => h.tag === 'gently hot');
		if (i >= 0) hits.splice(i, 1);
	}
	if (hits.some((h) => h.tag === 'tangy-ferment')) {
		const i = hits.findIndex((h) => h.tag === 'bright');
		if (i >= 0 && hits.length > 3) hits.splice(i, 1);
	}

	hits.sort((a, b) => b.n - a.n);
	const top = hits.slice(0, 4);

	if (!top.length) {
		return {
			tags: ['clean', 'simple'],
			sentence:
				'A quiet dish that lets its main ingredient speak: season well and stand aside.'
		};
	}

	const lead = top[0];
	const second = top[1];
	const finisher = top[top.length - 1];

	let sent = 'Leads with ' + lead.mid;
	if (second && second !== lead) sent += ', ' + second.mid;
	sent += top.length > 2 ? ', ' + finisher.fin + '.' : '.';

	return {
		tags: top.map((h) => h.tag),
		sentence: sent.charAt(0).toUpperCase() + sent.slice(1)
	};
}
