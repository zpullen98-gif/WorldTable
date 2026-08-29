/**
 * The palate: tasting, diagnosing, and correcting a dish.
 *
 * UNLIKE standards.mjs, almost nothing here is ours. The original already
 * carries the whole of it, in two Flavor Atlas entries that between them reach
 * FIVE recipes:
 *
 *   "The Repair Table: Balancing a Dish"      -> kare-kare, vitel-tone,
 *                                                new-orleans-bbq-shrimp
 *   "Tasting Vocabulary & Palate Training"    -> ploughmans-lunch, boiled-peanuts
 *
 * Those link lists are not a claim about anything. `crosslinks.mjs` caps a term
 * at three recipes, so the diagnostic chart every cook works from is filed
 * beside 477 other terms and surfaces next to a Filipino oxtail stew. This is
 * the technique-spine problem restated: a system that exists, is good, and is
 * reachable by nobody.
 *
 * So this module does not write a repair table. It reads the one the guide
 * already has and gives it a shape a cook can use with a spoon in their hand.
 *
 * ## What is authored, and what is gated
 *
 * The PROSE is the original's. What is ours is the STRUCTURE: splitting one
 * paragraph into eight faults, naming the levers, and ordering them the way the
 * entry says to apply them, gentlest first.
 *
 * That structure is a claim about the prose, so the build checks it:
 *
 *   - Every fault we carry must appear as a labelled clause in the entry.
 *   - Every lever's `token` must appear inside its own fault's clause. This is
 *     what stops a lever drifting: "TOO SOUR" is one word from "TOO SWEET" and
 *     their fixes are near-opposites, so a lever filed under the wrong fault is
 *     the exact mistake worth failing a build over.
 *   - And the reverse, which matters most: any labelled clause in the entry
 *     that we did NOT carry fails the build. If the corpus states a ninth
 *     fault, nobody has to notice by eye.
 *
 * The consequence is that this file cannot silently disagree with the guide.
 * Rewrite the entry and the build tells you which levers you just invalidated.
 */

/** The two Flavor Atlas entries this is all read out of. */
export const REPAIR_ANCHOR = 'the-repair-table-balancing-a-dish';
export const PROTOCOL_ANCHOR = 'tasting-vocabulary-and-palate-training';

/**
 * Split the Repair Table's prose into its labelled clauses.
 *
 * The entry writes each fault as `LABEL: what to do.`, shouted label, colon,
 * clause, full stop. Parsed rather than hand-copied so the authored table below
 * holds no duplicated prose that could rot out of sync with the source.
 *
 * @param {string} definition
 * @returns {Map<string, string>} label -> clause
 */
export function parseRepairTable(definition) {
	/** @type {Map<string, string>} */
	const clauses = new Map();
	// A shouted label: two or more capitals, allowing the slash in
	// "MUDDY/OVER-DEEP", followed by a colon.
	const re = /\b([A-Z][A-Z/ -]{2,}):/g;
	/** @type {Array<{ label: string, from: number, after: number }>} */
	const marks = [];
	let m;
	while ((m = re.exec(definition)) !== null) {
		marks.push({ label: m[1].trim(), from: m.index, after: m.index + m[0].length });
	}
	for (let i = 0; i < marks.length; i++) {
		const end = i + 1 < marks.length ? marks[i + 1].from : definition.length;
		clauses.set(marks[i].label, definition.slice(marks[i].after, end).trim());
	}
	return clauses;
}

/**
 * The eight faults, gentlest lever first.
 *
 * `symptom` is ours: the entry names the fault but never says what it tastes
 * like, and "too flat" means nothing to a cook who has not yet learned to hear
 * it. Everything in `levers` is the entry's, restated as an instruction.
 *
 * `token` is the word the build looks for in that fault's own clause. It is the
 * lever's evidence, not its label, which is why it is lowercase and why several
 * levers share one.
 */
export const FAULTS = [
	{
		slug: 'flat',
		key: 'TOO FLAT',
		label: 'Flat',
		symptom: 'The flavours are all present and none of them arrives. Tastes like a photograph of the dish.',
		levers: [
			{ move: 'Salt', token: 'salt', note: 'Always first. Most flat dishes are unsalted dishes.' },
			{ move: 'Acid', token: 'acid', note: 'If it is already salted, this is the next lever, not more salt.' },
			{ move: 'Umami', token: 'umami', note: 'If it is salted and bright and still flat. The three-axis check ends here.' }
		]
	},
	{
		slug: 'salty',
		key: 'TOO SALTY',
		label: 'Salty',
		symptom: 'It reaches for the water glass before the second bite.',
		levers: [
			{ move: 'Dilute', token: 'dilute', note: 'Unsalted liquid, or more of the base.' },
			{ move: 'Bulk it out', token: 'bulk', note: 'Starch or cream: volume the salt has to spread through.' },
			{ move: 'Counter it', token: 'counter', note: 'Acid and a touch of sugar bend the perception. The potato trick mostly just dilutes.' }
		]
	},
	{
		slug: 'sour',
		key: 'TOO SOUR',
		label: 'Sour',
		symptom: 'The acid arrives before anything else and stays after everything else has gone.',
		levers: [
			{ move: 'Fat', token: 'fat', note: 'Buffers rather than removes.' },
			{ move: 'Sweetness', token: 'sweetness', note: 'The other buffer. Below the threshold of tasting sweet.' },
			{ move: 'Baking soda', token: 'baking soda', note: 'Neutralises chemically. Pinches only: it eats brightness along with the fault.' },
			{ move: 'Time', token: 'time', note: 'Mellows on its own, if you have any.' }
		]
	},
	{
		slug: 'sweet',
		key: 'TOO SWEET',
		label: 'Sweet',
		symptom: 'Cloying by the third mouthful, and nothing cuts through it.',
		levers: [
			{ move: 'Acid', token: 'acid', note: 'Cuts.' },
			{ move: 'Salt', token: 'salt', note: 'Reframes: the same sugar reads as seasoning rather than dessert.' },
			{ move: 'Bitterness', token: 'bitterness', note: 'Opposes it directly. Coffee, cocoa, char.' },
			{ move: 'Heat', token: 'heat', note: 'Distracts from it.' }
		]
	},
	{
		slug: 'bitter',
		key: 'TOO BITTER',
		label: 'Bitter',
		symptom: 'A hard edge at the back of the palate that stays after swallowing.',
		levers: [
			{ move: 'Salt', token: 'salt', note: 'Suppresses bitterness outright. Real chemistry, not folklore.' },
			{ move: 'Sweetness', token: 'sweet', note: 'Buffers.' },
			{ move: 'Fat', token: 'fat', note: 'Rounds it off.' },
			{ move: 'Acid', token: 'acid', note: 'Brightens past it rather than removing it.' }
		]
	},
	{
		slug: 'spicy',
		key: 'TOO SPICY',
		label: 'Spicy',
		symptom: 'The heat has stopped being a flavour and become the only one.',
		levers: [
			{ move: 'Dairy or fat', token: 'dairy', note: 'Dissolves capsaicin. This is the one that physically removes heat.' },
			{ move: 'Sugar', token: 'sugar', note: 'Soothes.' },
			{ move: 'Acid', token: 'acid', note: 'Refocuses the palate elsewhere.' },
			{ move: 'Starch', token: 'starch', note: 'Dilutes.' },
			{ move: 'More bland base', token: 'volume', note: 'The honest fix, and usually the only one that works at service.' }
		]
	},
	{
		slug: 'rich',
		key: 'TOO RICH',
		label: 'Rich',
		symptom: 'Delicious for two bites and fatiguing by the sixth.',
		levers: [
			{ move: 'Acid', token: 'acid', note: 'Always acid. There is no second answer to this one.' },
			{ move: 'Something crunchy-fresh', token: 'crunchy', note: 'After the acid, not instead of it.' }
		]
	},
	{
		slug: 'muddy',
		key: 'MUDDY/OVER-DEEP',
		label: 'Muddy',
		symptom: 'Deep, brown, and indistinct: every layer present and none of them legible.',
		levers: [
			{ move: 'Brightness at the top', token: 'brightness', note: 'Fresh herb, zest, raw allium. The finishing register, applied as medicine.' }
		]
	}
];

/**
 * The rule the entry ends on, and the one most worth reading at the pass.
 * Carried as data rather than page copy because both the palate page and cook
 * mode's repair panel show it, and they must not drift.
 */
export const META_RULE =
	'Adjust in small moves and taste after each one. Fix the loudest fault first: most complicated problems are one lever pulled twice.';

/**
 * Build the shipped record, checking the authored structure against the prose.
 *
 * Returns `{ palate, problems }` rather than throwing, so build-data can report
 * every disagreement at once instead of one per run.
 *
 * @param {Array<{ slug: string, term: string, definition: string }>} lexicon
 */
export function buildPalate(lexicon) {
	/** @type {string[]} */
	const problems = [];
	const bySlug = new Map(lexicon.map((e) => [e.slug, e]));

	const repair = bySlug.get(REPAIR_ANCHOR);
	const protocol = bySlug.get(PROTOCOL_ANCHOR);
	if (!repair) problems.push(`palate: no lexicon entry "${REPAIR_ANCHOR}"`);
	if (!protocol) problems.push(`palate: no lexicon entry "${PROTOCOL_ANCHOR}"`);
	if (!repair || !protocol) return { palate: null, problems };

	const clauses = parseRepairTable(repair.definition);

	for (const f of FAULTS) {
		const clause = clauses.get(f.key);
		if (!clause) {
			problems.push(`palate: the repair table no longer states "${f.key}"`);
			continue;
		}
		const hay = clause.toLowerCase();
		for (const lever of f.levers) {
			if (!hay.includes(lever.token)) {
				problems.push(
					`palate: "${f.key}" no longer mentions "${lever.token}" ` +
						`(lever "${lever.move}") — the entry was rewritten under it`
				);
			}
		}
	}

	// The reverse check, and the one that catches what nobody would look for:
	// a fault the guide states and we do not carry.
	const carried = new Set(FAULTS.map((f) => f.key));
	for (const key of clauses.keys()) {
		if (!carried.has(key)) {
			problems.push(`palate: the repair table states "${key}" and nothing carries it`);
		}
	}

	const palate = {
		repair: {
			slug: repair.slug,
			term: repair.term,
			definition: repair.definition
		},
		protocol: {
			slug: protocol.slug,
			term: protocol.term,
			definition: protocol.definition
		},
		metaRule: META_RULE,
		faults: FAULTS.map((f) => ({
			slug: f.slug,
			label: f.label,
			symptom: f.symptom,
			levers: f.levers.map((l) => ({ move: l.move, note: l.note }))
		}))
	};

	return { palate, problems };
}
