/**
 * Film school links: ported from `videoFor` (L3931) and the technique table.
 *
 * The original duplicated the twelve canon YouTube URLs in two places (the
 * Screening Room markup at L622-633 and the `F` map at L3786) so they could
 * drift apart. Here `F` is the single source and the Screening Room reads from
 * the same JSON.
 */
const YT = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

const KENJI = {
	n: 'J. Kenji López-Alt',
	w: 'the science-first American kitchen, one take, no cuts'
};

/** Technique labels a recipe demonstrates, from the TECH keyword table. */
export function deriveTechniques(blob, TECH) {
	return TECH.filter((x) => x.k.some((k) => blob.includes(k.toLowerCase()))).map((x) => x.l);
}

export function deriveFilms(r, blob, { TEACHERS, DISH_FILMS, TECH }, isAmerican = () => false) {
	const nl = r.n.toLowerCase();
	const out = { techniques: [] };

	const dish = DISH_FILMS.find((d) => d.m.some((m) => nl.includes(m)));
	if (dish) out.dish = { label: dish.t, url: dish.u, sub: '★ A canon film: verified' };

	out.search = {
		label: 'This dish, cooked on camera',
		url: YT(`${r.n} recipe`),
		sub: `Search films of ${r.n}`
	};

	const hits = TECH.filter((x) => x.k.some((k) => blob.includes(k.toLowerCase()))).slice(
		0,
		dish ? 1 : 2
	);
	for (const x of hits) {
		out.techniques.push({
			label: `Technique: ${x.l}`,
			url: x.u || YT(x.q),
			sub: x.u ? '★ A canon film, verified' : 'The skill inside this recipe'
		});
	}

	const T = TEACHERS[r.c] || (isAmerican(r.c) ? KENJI : null);
	out.teacher = T
		? { label: `Study with ${T.n}`, url: YT(`${T.n} ${r.n}`), sub: T.w }
		: {
				label: 'The cuisine, deeper',
				url: YT(`${r.c} cooking techniques`),
				sub: `Technique films from the ${r.c} kitchen`
			};

	return out;
}
