/**
 * The waste log's vocabulary — read out of the guide, not invented.
 *
 * The guide asks for this feature by name: *"waste logs (what died in the
 * walk-in, and why — over-prepping is the most common villain)"*. It also
 * supplies the taxonomy, in three entries rather than one:
 *
 *  - COGS Control names the leak meter itself — *"the VARIANCE between them is
 *    your leak meter: waste, portioning drift, unrecorded comps, or theft"* —
 *    and the villain.
 *  - Prime Cost decomposes the COGS side as *"pricing, portioning, waste,
 *    theft, vendor creep"*.
 *  - Pour Cost runs the same audit at the bar and adds *"spillage"*.
 *
 * So the five reason codes are not a product decision dressed as one. Each is
 * a leak the guide names, and each carries the phrase that names it. If an
 * edit to the guide removes one, the build fails rather than shipping a button
 * the textbook no longer supports.
 *
 * ## THE TWO IT REFUSES TO OFFER
 *
 * **Theft** is in the leak meter and is deliberately not a reason code. The
 * guide is unusually direct about why: *"the answers are systems, not
 * suspicion"*, and *"the goal is a kitchen where numbers are everyone's craft
 * pride, not a surveillance state"*. A bin with a THEFT button on it is
 * suspicion, it is the accusation made before the evidence, and nobody has
 * ever logged their own. Theft is what remains in the variance once the log
 * has accounted for everything it can name — which is exactly how the guide
 * frames it, and the only honest way to reach it.
 *
 * **Vendor creep** is named by Prime Cost and belongs to the item book: it is a
 * price that moved, not a thing that went in the bin. Logging it here would
 * double-count it against a price history that already has it.
 *
 * Both are declared rather than omitted, because the reverse gate below walks
 * the guide's own list and fails on anything neither carried nor excluded.
 * Silence is how a taxonomy drifts out from under its source.
 */

/** Every phrase below is read out of these. */
export const ANCHORS = {
	cogs: 'cogs-control-inventory-variance-and-theft',
	prime: 'prime-cost-the-number-that-runs-the-building',
	bar: 'pour-cost-and-bar-economics'
};

/**
 * What a venue can say went wrong.
 *
 * `covers` names the leak-meter term this code accounts for, and the reverse
 * gate uses it. `evidence` is the literal substring its anchor must still
 * contain — literal, not reconstructed, because an en dash and a hyphen look
 * identical in a diff.
 *
 * Order is deliberate and is the guide's claim, not alphabetical: the villain
 * goes first, because a log is only opened when something has already gone
 * wrong and the commonest answer should be the shortest reach.
 */
export const REASONS = [
	{
		key: 'overprep',
		label: 'Over-prepped',
		anchor: 'cogs',
		covers: 'waste',
		evidence: 'over-prepping is the most common villain',
		hint: 'Made more than the service needed.'
	},
	{
		key: 'spoiled',
		label: 'Spoiled',
		anchor: 'cogs',
		covers: 'waste',
		evidence: 'what died in the walk-in',
		hint: 'Out of date, broken cold chain, or rotated past use. FIFO, monetised.'
	},
	{
		key: 'overportion',
		label: 'Over-portioned',
		anchor: 'cogs',
		covers: 'portioning drift',
		evidence: 'portioning drift',
		hint: 'Plated heavy. The guide calls eyeballing a rounding error you pay for hourly.'
	},
	{
		key: 'comped',
		label: 'Comped or remade',
		anchor: 'cogs',
		covers: 'unrecorded comps',
		evidence: 'unrecorded comps',
		hint: 'Went out and was not paid for — sent back, remade, or given away.'
	},
	{
		key: 'spilled',
		label: 'Spilled or dropped',
		anchor: 'bar',
		covers: 'waste',
		evidence: 'spillage',
		hint: 'The floor got it. Honest, unavoidable, and worth its own line.'
	}
];

/**
 * Leaks the guide names that this log deliberately does NOT offer. See the
 * header. Declared so the reverse gate can tell "considered and refused" from
 * "quietly missing".
 */
export const EXCLUDED = [
	{
		key: 'theft',
		covers: 'theft',
		why:
			'The guide answers it with "systems, not suspicion" and warns against a surveillance state. ' +
			'Nobody logs their own theft; it is the part of the variance left over once this log has ' +
			'named everything it can.'
	},
	{
		key: 'vendor-creep',
		covers: 'vendor creep',
		why: 'A price that moved, not a thing in the bin. The item book already carries it, and logging it here would double-count.'
	}
];

/**
 * The sentence that makes the log worth keeping rather than merely worth
 * filling in: the guide asserts a most-common cause, so a venue's own log can
 * agree with it or contradict it.
 */
export const VILLAIN = 'overprep';

/**
 * The reason there is no person on a waste entry.
 *
 * Gated because it is the justification for a STRUCTURAL refusal — `WasteEntry`
 * has no field for who logged it, so no report can grow one later. If the guide
 * stops saying this, the refusal has lost its anchor and somebody should be
 * made to argue for it again rather than inheriting it.
 */
export const CULTURE_EVIDENCE = 'not a surveillance state';

/**
 * The guide's own list, which the reverse gate walks.
 *
 * Parsed rather than retyped. Retyping it is how the list and the codes drift
 * apart silently, which is the single thing this module exists to prevent.
 */
export const LEAK_METER_PREFIX = 'your leak meter:';

/**
 * @param {Array<{ slug: string, term: string, definition: string }>} lexicon
 */
export function buildWaste(lexicon) {
	/** @type {string[]} */
	const problems = [];
	const bySlug = new Map(lexicon.map((e) => [e.slug, e]));

	/** @type {Record<string, { slug: string, term: string, definition: string }>} */
	const entries = {};
	for (const [key, slug] of Object.entries(ANCHORS)) {
		const entry = bySlug.get(slug);
		if (!entry) {
			problems.push(`waste: no lexicon entry "${slug}" (${key})`);
			continue;
		}
		entries[key] = { slug: entry.slug, term: entry.term, definition: entry.definition };
	}
	if (problems.length) return { waste: null, problems };

	// ---- forward: every code's evidence is still in the guide -----------------
	for (const r of REASONS) {
		const text = entries[r.anchor].definition;
		if (!text.includes(r.evidence)) {
			problems.push(
				`waste: "${entries[r.anchor].term}" no longer states ${JSON.stringify(r.evidence)} — ` +
					`the "${r.label}" reason code is now unsupported`
			);
		}
	}

	if (!entries.cogs.definition.includes(CULTURE_EVIDENCE)) {
		problems.push(
			`waste: the guide no longer says ${JSON.stringify(CULTURE_EVIDENCE)} — that phrase is the ` +
				'justification for a waste entry carrying no person, so the refusal now needs re-arguing'
		);
	}

	const villain = REASONS.find((r) => r.key === VILLAIN);
	if (!villain) {
		problems.push(`waste: VILLAIN "${VILLAIN}" is not one of the reason codes`);
	} else if (!entries[villain.anchor].definition.includes('most common villain')) {
		problems.push('waste: the guide no longer names a most-common villain');
	}

	// ---- reverse: every leak the guide names is carried or refused ------------
	//
	// The half that actually earns its keep. A forward gate only proves the
	// codes that exist are supported; it says nothing about a leak the guide
	// names that nothing offers, which is the direction a taxonomy silently
	// rots in. economics.mjs shipped with only the forward half working.
	const def = entries.cogs.definition;
	const at = def.indexOf(LEAK_METER_PREFIX);
	if (at < 0) {
		problems.push(
			`waste: the COGS entry no longer contains ${JSON.stringify(LEAK_METER_PREFIX)}, so the ` +
				'reverse gate cannot read the guide\'s list of leaks and is not checking anything'
		);
	} else {
		const tail = def.slice(at + LEAK_METER_PREFIX.length);
		const sentence = tail.split('.')[0];
		const named = sentence
			.split(/,| or /)
			.map((t) => t.trim().toLowerCase())
			.filter(Boolean);
		if (named.length < 2) {
			problems.push(`waste: read only ${named.length} leak(s) out of the guide's list — parse is wrong`);
		}
		const covered = new Set([
			...REASONS.map((r) => r.covers.toLowerCase()),
			...EXCLUDED.map((e) => e.covers.toLowerCase())
		]);
		for (const leak of named) {
			if (!covered.has(leak)) {
				problems.push(
					`waste: the guide names "${leak}" as a leak and nothing carries it — add a reason code ` +
						'or declare it in EXCLUDED with a reason'
				);
			}
		}
		// And the other way: a `covers` nothing in the guide names is a code
		// justifying itself against prose that has moved on.
		const namedSet = new Set(named);
		for (const r of REASONS) {
			if (!namedSet.has(r.covers.toLowerCase())) {
				problems.push(
					`waste: reason "${r.key}" claims to cover "${r.covers}", which the guide's leak list no longer names`
				);
			}
		}
	}

	// Prime Cost names the same decomposition; if it stops, EXCLUDED's
	// vendor-creep entry is arguing with a sentence that is not there.
	if (!entries.prime.definition.includes('vendor creep')) {
		problems.push('waste: Prime Cost no longer names vendor creep, which EXCLUDED cites');
	}

	return {
		waste: {
			entries,
			reasons: REASONS.map(({ key, label, covers, hint, evidence }) => ({
				key,
				label,
				covers,
				hint,
				evidence
			})),
			excluded: EXCLUDED,
			villain: VILLAIN,
			cultureNote: CULTURE_EVIDENCE
		},
		problems
	};
}
