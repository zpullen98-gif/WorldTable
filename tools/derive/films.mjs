/**
 * Film school links: ported from `videoFor` (L3931) and the technique table.
 *
 * The original duplicated the twelve canon YouTube URLs in two places (the
 * Screening Room markup at L622-633 and the `F` map at L3786) so they could
 * drift apart. Here `F` is the single source and the Screening Room reads from
 * the same JSON.
 */
/**
 * @typedef {{ k: string[], l: string, q: string, u?: string }} TechEntry
 * @typedef {{ n: string, c: string }} RecipeLike
 * @typedef {{ label: string, url: string, sub: string }} FilmLink
 * @typedef {{ techniques: FilmLink[], dish?: FilmLink, search: FilmLink, teacher: FilmLink }} Films
 */

/** @param {string} q */
const YT = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

const KENJI = {
	n: 'J. Kenji López-Alt',
	w: 'the science-first American kitchen, one take, no cuts'
};

/**
 * Technique labels a recipe demonstrates, from the TECH keyword table.
 * @param {string} blob
 * @param {TechEntry[]} TECH
 */
export function deriveTechniques(blob, TECH) {
	/* Deduped by label. The table is TECH plus SUPPLEMENT, and a label may now
	   appear in both: widening a keyword list for an extracted technique has to
	   happen on the authored side, because raw/TECH.json is proved against the
	   sealed original and editing it is a content change. Two entries matching
	   the same recipe are one technique, not two. */
	return [
		...new Set(
			TECH.filter((x) => x.k.some((k) => blob.includes(k.toLowerCase()))).map((x) => x.l)
		)
	];
}

/*
 * ── Reading the note as evidence ─────────────────────────────────────────────
 *
 * Technique TAGS score off the note-free text, for reasons measured in
 * build-data.mjs: prose mentions made tags follow note backfill order. Film
 * links deliberately keep the note, and that is still right — the note is where
 * a dish explains its own mechanism, so it is the only place many recipes say
 * the word at all. Cacio e Pepe never types "emulsion" in its method; its note
 * explains nothing else. Scoring films off the tags would delete 242 links, and
 * most of them are apt.
 *
 * But a note is prose, and prose does three things a keyword match reads as
 * agreement when it is not:
 *
 *   denial     "there is no emulsion, the oil sits on top"      (Chimichurri)
 *   inflection "onigiri logic" matching the keyword "nigiri"    (Spam Musubi)
 *   collision  "out of the molecule" matching "the mole"        (Palak Paneer)
 *
 * The three guards below are the measured answer, and every link they touch was
 * read before it was removed. 1043 technique links become 1008: 37 dropped and
 * 2 replaced, the replacements because filtering happens BEFORE the slice, so a
 * recipe whose first hit was a coincidence gets the real technique underneath
 * it. Gravlax stops offering a Franklin brisket film and starts offering
 * Brining & curing, which is what gravlax is.
 *
 * Of the 37: 20 are denials, 14 are collisions, 3 are the hand-listed sense
 * errors below. Rules that were tried and REFUSED, with their failures, so the
 * next person does not re-derive them:
 *
 *   - "drop any film whose technique is not in the recipe's tags" deletes all
 *     242 by construction, including Carbonara's emulsion and Paratha's
 *     lamination. This is the obvious fix and it is the wrong one.
 *   - "require the keyword to sit on a word boundary at both ends" deletes 122,
 *     including every "emulsif" → emulsifies and "ferment" → fermented. The
 *     keywords are deliberately stems; a trailing letter is the normal case.
 *   - "any negation cue within 40 characters" flags 30 and is wrong on 12 of
 *     them, because the cue is usually governing a different noun: "Almonds
 *     carry no starch, so this emulsion rests on almond protein" asserts the
 *     emulsion. The cue has to govern the keyword's own phrase.
 */

/* "without" is NOT a cue. In these notes "without that emulsion the lemon and
   oil separate" argues that the technique is essential, which is the opposite
   of a denial, and including it flagged three dishes that plainly use it. */
const CUES = 'no|not|never|nothing|rather than|instead of|unlike|neither';

/* A modal between the cue and the keyword marks a hypothetical failure rather
   than a denial: Bacalao al Pil Pil's "nothing WILL emulsify" is a warning
   about what breaks the emulsion the dish is built on. */
const MODAL = /\b(will|would|can|could|may|might|should|must)\b/;

/**
 * Is the keyword at `i` governed by a negation cue rather than merely near one?
 * @param {string} text
 * @param {number} i
 */
function negatedAt(text, i) {
	const win = text.slice(Math.max(0, i - 34), i);
	const re = new RegExp(`(^|[^a-z])(${CUES})(?=[^a-z])`, 'gi');
	let m;
	let end = -1;
	while ((m = re.exec(win))) end = re.lastIndex;
	if (end < 0) return false;
	const between = win.slice(end);
	/* A comma, colon or full stop between the two means the cue closed over
	   something else and this keyword starts a new clause. */
	if (/[,;:.]/.test(between)) return false;
	if (MODAL.test(between)) return false;
	/* At most a short determiner run: "not A meringue", "not THE roux". */
	return between.trim().split(/\s+/).filter(Boolean).length <= 2;
}

/**
 * Every mention of this keyword in the note is a denial.
 * @param {string} note
 * @param {string} kw
 */
function alwaysDenied(note, kw) {
	const t = note.toLowerCase();
	const k = kw.toLowerCase().trim();
	let from = 0;
	let seen = 0;
	for (;;) {
		const i = t.indexOf(k, from);
		if (i < 0) break;
		seen++;
		if (!negatedAt(t, i)) return false;
		from = i + k.length;
	}
	return seen > 0;
}

/**
 * The keyword only ever appears buried inside a longer word: nigiri in onigiri.
 * @param {string} note
 * @param {string} kw
 */
function alwaysMidWord(note, kw) {
	const t = note.toLowerCase();
	const k = kw.toLowerCase().trim();
	let from = 0;
	let seen = 0;
	for (;;) {
		const i = t.indexOf(k, from);
		if (i < 0) break;
		seen++;
		if (i === 0 || !/[a-z]/.test(t[i - 1])) return false;
		from = i + k.length;
	}
	return seen > 0;
}

/* A multi-word keyword is a phrase, not a stem, so unlike "ferment" it has no
   business running into the next word: "the mole" inside "the molecule".
   A trailing plural is not that. The chapter "Emulsions & pan sauces" contains
   the keyword "pan sauce" followed by an s, and reading that as a collision
   deleted the whole chapter's links: hollandaise, béarnaise, beurre blanc. */
const TRAILING_STOPWORD = /\b(the|a|an|of|in|at|to|with|and|into|on)$/;

/**
 * @param {string} text
 * @param {string} kw
 */
function alwaysCutShort(text, kw) {
	const k = kw.toLowerCase().trim();
	if (!k.includes(' ')) return false;
	/* Nine keywords in the table are verb-and-article fragments waiting for
	   their object: "temper the", "cure the", "score the". They are SUPPOSED to
	   run into the next word, and "temper the" landing inside "temper them with
	   hot broth" is the technique, not a collision. */
	if (TRAILING_STOPWORD.test(k)) return false;
	const t = text.toLowerCase();
	let from = 0;
	let seen = 0;
	for (;;) {
		const i = t.indexOf(k, from);
		if (i < 0) break;
		seen++;
		let end = i + k.length;
		if (t[end] === 's') end++; // a plural still names the same thing
		if (!t[end] || !/[a-z]/.test(t[end])) return false;
		from = i + k.length;
	}
	return seen > 0;
}

/*
 * A collision is wrong wherever it happens, so the two lexical guards run over
 * whichever text supplied the keyword. Cachapa lists "masarepa" in its
 * INGREDIENTS, and the keyword for the Arepas film is "arepa"; treating method
 * text as automatically strong would wave that through.
 *
 * Denial is prose-only on purpose. Method text negates constantly and locally
 * ("do not stir", "not a speck of yolk") without ever meaning the dish does not
 * use the technique, and Pavlova is why the split matters: its note says
 * "a pavlova and not a meringue", distinguishing the dessert, while its method
 * says "whip whites to soft peaks". The method is right and the note is not
 * talking about the technique at all.
 */
/**
 * @param {string} text
 * @param {TechEntry} entry
 * @param {{ allowDenied?: boolean }} [opts]
 */
function saidIn(text, entry, { allowDenied = true } = {}) {
	return entry.k
		.filter((k) => text.toLowerCase().includes(k.toLowerCase()))
		.some(
			(k) =>
				!alwaysMidWord(text, k) &&
				!alwaysCutShort(text, k) &&
				(allowDenied || !alwaysDenied(text, k))
		);
}

/*
 * Sense collisions no lexical rule reaches, judged by hand and listed rather
 * than hidden behind a cleverer regex. Each is a real English word used in the
 * ordinary sense while the keyword means a technique, and each was shipping a
 * CANON video: the Cubano sent people to a croissant lamination film and
 * Gravlax to a Franklin brisket film.
 *
 * A general rule for these would have to know that a sandwich is not laminated
 * dough. Five were tried; all five deleted apt links to reach these. Keyed by
 * name because that is what deriveFilms holds, and the supplement gate already
 * proves names unique.
 */
/** @type {Record<string, string[]>} */
const WRONG_SENSE = {
	/* "the milanesa crust should be a jacket, not a souffl\u00e9": a denial in the
	   METHOD. The tag is removed by an override, but deriveFilms is handed the
	   SEALED TECH rather than TECH_ALL, so an override cannot reach the film - a
	   breaded veal cutlet was carrying "Technique: The souffl\u00e9". */
	'Milanesa a la Napolitana': ['The souffl\u00e9'],
	/* "compression fuses meat, cheese, pickle and mustard into a single
	   laminated material": a pressed sandwich, not a butter block. */
	'The Cubano': ['Lamination'],
	/* "the sugar is not there to sweeten; it OFFSETS the salt": the verb, while
	   the keyword "offset" means an offset smoker. Nothing here is smoked. */
	'Gravlax, the Cure by Weight': ['Low & slow smoking'],
	/* "at 75% fat it CHURNS toward butter if overbeaten": a warning about
	   overwhipped mascarpone, not an ice cream churn. */
	Tiramisu: ['Churning ice cream']
};

/**
 * @param {RecipeLike} r
 * @param {{ blob: string, linkBlob: string, note: string }} text
 * @param {{ TEACHERS: Record<string, { n: string, w: string }>, DISH_FILMS: { m: string[], t: string, u: string }[], TECH: TechEntry[] }} deps
 * @param {(chapter: string) => boolean} [isAmerican]
 * @returns {Films}
 */
export function deriveFilms(r, text, { TEACHERS, DISH_FILMS, TECH }, isAmerican = () => false) {
	const { blob, linkBlob, note } = text;
	const nl = r.n.toLowerCase();

	const dish = DISH_FILMS.find((d) => d.m.some((m) => nl.includes(m)));

	const barred = WRONG_SENSE[r.n] ?? [];
	/* Filtered BEFORE the slice, so a recipe whose first hit was a coincidence
	   now gets the real technique underneath it instead of losing the slot. */
	const hits = TECH.filter((x) => {
		if (!x.k.some((k) => blob.includes(k.toLowerCase()))) return false;
		if (barred.includes(x.l)) return false;
		/* Said in the name, the ingredients or the method: no prose to read. */
		if (saidIn(linkBlob, x)) return true;
		return saidIn(String(note), x, { allowDenied: false });
	}).slice(0, dish ? 1 : 2);

	const techniques = hits.map((x) => ({
		label: `Technique: ${x.l}`,
		url: x.u || YT(x.q),
		sub: x.u ? '★ A canon film, verified' : 'The skill inside this recipe'
	}));

	const T = TEACHERS[r.c] || (isAmerican(r.c) ? KENJI : null);
	const teacher = T
		? { label: `Study with ${T.n}`, url: YT(`${T.n} ${r.n}`), sub: T.w }
		: {
				label: 'The cuisine, deeper',
				url: YT(`${r.c} cooking techniques`),
				sub: `Technique films from the ${r.c} kitchen`
			};

	/* Assembled in one literal rather than mutated into existence, and in the
	   emitted key order the wing already ships: techniques, dish, search,
	   teacher. The incremental version inferred `{ techniques: never[] }` and
	   put 33 errors into svelte-check the moment a test imported this file. */
	const out = {
		techniques,
		...(dish ? { dish: { label: dish.t, url: dish.u, sub: '★ A canon film: verified' } } : {}),
		search: {
			label: 'This dish, cooked on camera',
			url: YT(`${r.n} recipe`),
			sub: `Search films of ${r.n}`
		},
		teacher
	};

	return out;
}
