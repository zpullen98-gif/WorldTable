/**
 * The Floor Deck's shared core: the few rules that the build gate
 * (tools/derive/floor-deck.mjs) and the app (src/lib/floor-deck.ts) must agree
 * on to the character, so they are written once and imported by both.
 *
 * Plain .mjs so Node can import it without a TS loader; the precedent is
 * search-config.mjs, which exists for the same reason. It imports nothing.
 *
 * What lives here and why:
 *
 * - `wrongAnswersFor()` builds the written test's wrong options. The gate
 *   simulates the test through this exact function to measure whether option
 *   LENGTH gives the key away, so a second implementation in the UI would make
 *   that measurement a statement about code nobody runs.
 * - `promptOf()` is the one way to read a say-it-back prompt, because the
 *   emitted card carries `prompt` only when redaction changed `why`.
 * - `deckHref()` is the URL contract between the Lexicon's backlink and the
 *   deck's study page.
 */

/** A minted card id. `slugify` reduces every run outside [a-z0-9] to "-", so
 *  it can never produce an underscore: an id therefore cannot equal a lexicon
 *  slug, a service drill slug, `drill-firing-order` or a `cal-*` slug, and the
 *  id is used verbatim as the card's slug in the one shared drillLog. */
export const DECK_ID_RE = /^fd_\d{4}$/;

export const OPTIONS_PER_QUESTION = 4;

/** Two, not three: a question whose every wrong answer is a known mistake
 *  teaches the mistakes. One slot always goes to a true statement about
 *  something else. */
export const MAX_TRAPS_PER_QUESTION = 2;

/**
 * Fold text for comparison: accents off, lowercase, punctuation to spaces.
 *
 * @param {unknown} s
 * @returns {string}
 */
export function foldText(s) {
	return String(s ?? '')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

/** @param {{ prompt?: string, why: string }} card */
export function promptOf(card) {
	return card.prompt ?? card.why;
}

/**
 * Where a card lives. A look-up on the study page, which records nothing.
 *
 * @param {string} base  SvelteKit's `base`, '' when unbased
 * @param {{ id: string }} card
 */
export function deckHref(base, card) {
	return `${base}/service/deck/study?card=${card.id}`;
}

/**
 * Fisher-Yates over a copy, with an injected source of randomness.
 *
 * `sort(() => Math.random() - 0.5)` is not a shuffle: measured in this repo it
 * put the answer in slot one 36.0% of the time (src/lib/lexicon-quiz.ts).
 *
 * @template T
 * @param {readonly T[]} list
 * @param {() => number} rand
 * @returns {T[]}
 */
export function shuffled(list, rand) {
	const out = [...list];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

/**
 * A small seeded generator, for the gate's simulation and for tests. Never for
 * a reader's round: that takes Math.random.
 *
 * @param {number} seed
 * @returns {() => number}
 */
export function seeded(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** @typedef {{ text: string, from: 'trap'|'kin', id?: string, why?: string }} WrongAnswer */

/**
 * The three wrong answers beside a card's own `gist`.
 *
 * Order of preference, each source shuffled before it is drawn from:
 *   1. the card's OWN traps, at most MAX_TRAPS_PER_QUESTION. Never another
 *      card's trap: a trap written for pancetta may be a true statement about
 *      bacon, and a true statement offered as wrong is a broken question.
 *   2. the gists of the cards it is confused with, because those are the
 *      wrong answers a person actually gives.
 *   3. gists from the same section.
 *   4. gists from the whole deck.
 *
 * One answer per donor card, no text that folds to the key or to another
 * option, and `null` rather than a loop when three cannot be fielded: the
 * caller skips the card, as drill.ts optionsFor does.
 *
 * @param {{ id: string, gist: string, section: string, confusedWith?: string[] }} card
 * @param {ReadonlyArray<{ id: string, gist: string, section: string }>} cards  the whole deck
 * @param {ReadonlyArray<{ says: string, why: string }>|undefined} traps  this card's traps
 * @param {() => number} rand
 * @returns {WrongAnswer[]|null}
 */
export function wrongAnswersFor(card, cards, traps, rand) {
	const need = OPTIONS_PER_QUESTION - 1;
	const taken = new Set([foldText(card.gist)]);
	/** @type {WrongAnswer[]} */
	const out = [];

	/** @param {WrongAnswer} option */
	const take = (option) => {
		const key = foldText(option.text);
		if (!key || taken.has(key)) return;
		taken.add(key);
		out.push(option);
	};

	for (const t of shuffled(traps ?? [], rand).slice(0, MAX_TRAPS_PER_QUESTION)) {
		if (out.length >= need) break;
		take({ text: t.says, from: 'trap', why: t.why });
	}

	const byId = new Map(cards.map((c) => [c.id, c]));
	const confused = [];
	for (const id of card.confusedWith ?? []) {
		const c = byId.get(id);
		if (c) confused.push(c);
	}
	const others = cards.filter((c) => c.id !== card.id);
	const sources = [
		confused,
		others.filter((c) => c.section === card.section),
		others
	];
	const donors = new Set();
	for (const source of sources) {
		for (const c of shuffled(source, rand)) {
			if (out.length >= need) break;
			if (donors.has(c.id)) continue;
			const before = out.length;
			take({ text: c.gist, from: 'kin', id: c.id });
			if (out.length > before) donors.add(c.id);
		}
		if (out.length >= need) break;
	}

	return out.length >= need ? out : null;
}
