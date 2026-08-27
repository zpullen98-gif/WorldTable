/**
 * Sanitation — the guide's food-safety entries, and its silences.
 *
 * Fifth and last time this pattern appears in the guide, and the only time it
 * comes with a reason to build LESS rather than more.
 *
 * The substrate is two entries. "Food Safety: The Chef-Owner's Non-Negotiables"
 * is 701 characters and reaches three recipes that crosslinks.mjs picked on
 * keyword score — key lime pie, pretzels and a tomato sauce, none of them
 * hazard-relevant. "Health Inspections & Crisis Management" is 1,535 characters
 * and reaches nothing at all. That is everything the guide has to say.
 *
 * ## What this module deliberately does NOT do
 *
 * It ships no per-recipe hazard flag of any kind. Five candidate rules were
 * written and measured — undercooked-protein by stated temperature and by
 * doneness word, raw-protein, live-shellfish, cook-chill, preserve-uncooked —
 * and all five failed. Not marginally: the stated-temperature rule scored 0 of
 * 12 (every hit was correctly-cooked rare beef or rested pork); the raw-protein
 * rule flagged a salmon hot-smoked to a probe-verified 60°C while MISSING
 * carbonara, caesar, aioli, hollandaise and lox; the live-shellfish rule
 * flagged shucked oysters going into a fryer and missed live quahogs. A missed
 * hazard is worse than ten false ones, and these rules miss in that direction.
 *
 * `assertNoRecipes()` below exists to keep that refusal in force after everyone
 * who read the measurements has moved on. Do not revive these rules by tuning a
 * regex: a corrected undercooked-protein rule returns ZERO hits on this corpus,
 * because there is no hazard of that shape here to find.
 *
 * ## What it does do
 *
 * Three things, all structural rather than authored:
 *
 * 1. Makes two entries reachable, one of which currently reaches nothing.
 * 2. Carries the guide's numbers with two-way gates so they cannot drift.
 * 3. Makes the guide's SILENCES load-bearing. GAPS asserts both that the guide
 *    still NAMES a practice and that it still states NO figure for it. That
 *    second half is what stops anybody — including a later me — from quietly
 *    filling a gap with invented regulatory content.
 */

import { parseRepairTable } from './palate.mjs';

export const ANCHORS = {
	safety: 'food-safety-the-chef-owners-non-negotiables',
	inspections: 'health-inspections-and-crisis-management',
	svHardware: 'sous-vide-hardware-circulators-sealers-and-safety-kit'
};

/**
 * Every number in a string, decimals intact.
 *
 * NOT economics.mjs's `split(/[^0-9]+/)`. That helper is correct for the
 * integer percentages it gates, and reading `4.5–54.5°C` with it gives
 * [4, 5, 54, 5] — measured, not supposed. Here the decimals are the difference
 * between two danger-zone ceilings 5.5°C apart, so they have to survive.
 * economics.mjs is deliberately left alone; re-cutting a working gate to share
 * a helper churns a passing gate for nothing.
 *
 * @param {string} s
 * @returns {number[]}
 */
export function readNumbers(s) {
	return (String(s).match(/[0-9]+(?:\.[0-9]+)?/g) ?? []).map(Number);
}

/**
 * The shouted clauses, per entry.
 *
 * parseRepairTable is reused rather than reimplemented, but only because it was
 * measured on these two entries specifically: exactly three labels on the
 * safety entry, exactly two on inspections, no false labels on either. It is
 * known to produce junk on other prose, so this reuse is licensed by that
 * measurement and by nothing else.
 */
export const CLAUSES = [
	{ key: 'THE DANGER ZONE', anchor: 'safety' },
	{ key: 'CROSS-CONTAMINATION', anchor: 'safety' },
	{ key: 'FIFO', anchor: 'safety' },
	{ key: 'INSPECTIONS', anchor: 'inspections' },
	{ key: 'THE PRINCIPLE', anchor: 'inspections' }
];

/**
 * Claims that sit outside the shouted-label grammar, so the clause parser
 * cannot see them. Each `evidence` is the LITERAL substring, never a
 * reconstructed one — an em dash and a hyphen look identical in a diff.
 */
export const FACTS = [
	{ key: 'twoHourRule', anchor: 'safety', evidence: 'the two-hour rule governs everything left in it' },
	{ key: 'coolingMethod', anchor: 'safety', evidence: 'shallow pans, ice baths — never a stockpot straight into the walk-in' },
	{ key: 'haccp', anchor: 'safety', evidence: 'HACCP is the systematized version: identify hazards, control critical points, document' },
	{ key: 'allergenProtocol', anchor: 'safety', evidence: 'Allergen protocol is service-critical and legal-critical' },
	{ key: 'notGlamour', anchor: 'safety', evidence: 'None of this is glamour; all of it is the license to do the glamorous parts' },
	{ key: 'jurisdiction', anchor: 'inspections', evidence: "know your jurisdiction's system (letter grades posted in the window, point scores, risk-based frequency)" },
	{ key: 'inspectionReady', anchor: 'inspections', evidence: 'run the kitchen so ANY moment is inspection-ready' },
	{ key: 'dailyStandard', anchor: 'inspections', evidence: 'temps logged, FIFO labeled, hand sinks stocked and USED, sanitizer buckets titrated' },
	{ key: 'duringVisit', anchor: 'inspections', evidence: 'accompany professionally, correct on the spot what can be, never argue, get every finding in writing' },
	{ key: 'afterVisit', anchor: 'inspections', evidence: 'fix, document, retrain at pre-shift, and treat repeat findings as management failures, not staff ones' },
	{ key: 'illnessComplaint', anchor: 'inspections', evidence: 'take it seriously and kindly, gather specifics, preserve records and product' },
	{ key: 'selfReport', anchor: 'inspections', evidence: 'call the insurer and — if credible — the health department yourself' },
	{ key: 'coverUp', anchor: 'inspections', evidence: 'the cover-up is always worse than the event' }
];

/**
 * Numbers, gated in BOTH directions: the evidence must still be present, AND
 * the figures we ship must read back out of it in order.
 *
 * economics.mjs shipped with only the first half working, and the hole was
 * live — `lowPct` could drift from 25 to 30 while the prose still said 25–35%.
 * Here the same hole ships a wrong danger-zone bound.
 */
export const NUMERIC = [
	{
		key: 'dangerZone',
		anchor: 'safety',
		evidence: '4–60°C (40–140°F)',
		numbers: [4, 60, 40, 140],
		label: 'The danger zone'
	},
	{
		key: 'coolingLaw',
		anchor: 'safety',
		// Reads back [21, 2, 4, 4]. The six-hour total is arithmetic the guide
		// never states, so it is never quoted as though it did.
		evidence: 'Cooling law: hot food to 21°C within 2 hours, to 4°C within 4 more',
		numbers: [21, 2, 4, 4],
		label: 'The cooling law'
	}
];

/**
 * The guide contradicts itself, and both entries are authoritative in tone.
 *
 * Disclosed rather than resolved. Shipping one window silently argues with the
 * other entry; picking a winner is a safety judgement this module has no
 * standing to make. Gated both ways — the second statement must still exist,
 * and the two windows must still DIFFER, so the disclosure cannot go stale.
 */
export const CONFLICT = {
	a: { anchor: 'safety', evidence: '4–60°C (40–140°F)', numbers: [4, 60] },
	b: {
		anchor: 'svHardware',
		// A NUMBER-FREE anchor, deliberately. The first version pinned the figures
		// inside the evidence string, which made the "these two must still differ"
		// check unreachable: change 4.5 to 4 and the evidence simply goes absent,
		// so the gate reported the statement as DELETED and the differ branch could
		// never fire. A check that cannot fail is worth nothing. The numbers are
		// read out of the window immediately before the phrase instead.
		evidence: 'danger window still applies to lazy cooling',
		numbers: [4.5, 54.5],
		lookBehind: 26
	}
};

/**
 * The guide's own C/F pair does not agree with the app's converter: 4°C rounds
 * to 39°F and the parenthetical says 40°F. The pair therefore ships as one
 * opaque string and is never recomputed — and the DISAGREEMENT is gated, so
 * that if the guide is ever corrected the page copy is forced to change rather
 * than leaving a stale claim on screen.
 */
export const CF_PAIR = { lowC: 4, lowF: 40 };

/**
 * What the guide names and does not state.
 *
 * `named` must still be present — the gap is about a real practice the guide
 * raises. `absent` tokens must appear in ZERO lexicon definitions, which is the
 * half that matters: it makes filling a gap with invented content fail the
 * build rather than pass review.
 */
export const GAPS = [
	{
		key: 'sanitizer',
		named: 'sanitizer buckets titrated',
		namedAnchor: 'inspections',
		absent: ['ppm', 'parts per million'],
		gap: 'Buckets are to be titrated. To what concentration, the guide never says.'
	},
	{
		key: 'haccpDetail',
		named: 'identify hazards, control critical points, document',
		namedAnchor: 'safety',
		absent: ['critical limit', 'corrective action', 'record retention'],
		gap: 'HACCP compressed to three verbs. No critical limits, no monitoring frequency, no corrective action, no verification, no record retention.'
	},
	{
		key: 'reheating',
		named: 'the two-hour rule governs everything left in it',
		namedAnchor: 'safety',
		absent: ['reheat to', 'hot-hold', 'hot hold'],
		gap: 'Cooling is given a law. Reheating and hot-holding are never given one.'
	},
	{
		key: 'thawing',
		named: 'raw below ready-to-eat in storage',
		namedAnchor: 'safety',
		absent: ['defrost'],
		// One entry says "thaw" of frozen prawns. It is a shopping note, not a
		// method, and the allowance is gated so it cannot quietly become one.
		except: { token: 'thaw', slug: 'shrimp-sizing-and-prawn-confusion' },
		gap: 'Storage order is given. Safe thawing is not covered anywhere in the guide.'
	},
	{
		key: 'allergenMethod',
		named: 'Allergen protocol is service-critical and legal-critical',
		namedAnchor: 'safety',
		absent: ['allergen matrix'],
		gap: 'Asserted twice as critical, and never specified once.'
	},
	{
		key: 'powerOutage',
		named: "the power outage's food-disposition rules",
		namedAnchor: 'inspections',
		absent: ['reheat to'],
		gap: 'A pointer to rules the guide does not contain.'
	}
];

/** The framing the page is required to carry, tied to prose that must persist. */
export const FRAMING = { jurisdictionFact: 'jurisdiction' };

/**
 * Refuse any per-recipe surface, structurally.
 *
 * Walks the shipped object and fails on a field named for recipes or hazards,
 * or on any string that is a known recipe slug. This is the gate that keeps the
 * refused work refused.
 */
/**
 * @param {unknown} obj
 * @param {Set<string>} recipeSlugs
 * @param {string[]} problems
 */
function assertNoRecipes(obj, recipeSlugs, problems) {
	const BANNED = new Set(['recipes', 'slugs', 'flags', 'hazards']);
	/** @type {(node: unknown, path: string) => void} */
	const walk = (node, path) => {
		if (node === null || node === undefined) return;
		if (typeof node === 'string') {
			if (recipeSlugs.has(node)) {
				problems.push(
					`sanitation: ${path} names the recipe "${node}" — this feature must not name recipes; ` +
						'every per-recipe hazard rule was measured unshippable'
				);
			}
			return;
		}
		if (Array.isArray(node)) {
			node.forEach((v, i) => walk(v, `${path}[${i}]`));
			return;
		}
		if (typeof node === 'object') {
			for (const [k, v] of Object.entries(node)) {
				if (BANNED.has(k)) {
					problems.push(`sanitation: shipped object carries a "${k}" field at ${path} — refused by design`);
				}
				walk(v, path ? `${path}.${k}` : k);
			}
		}
	};
	walk(obj, '');
}

/**
 * @param {Array<{ slug: string, term: string, definition: string, recipes?: string[] }>} lexicon
 * @param {string[]} [recipeSlugList] every recipe slug, for the no-recipes gate
 */
export function buildSanitation(lexicon, recipeSlugList = []) {
	/** @type {string[]} */
	const problems = [];
	const bySlug = new Map(lexicon.map((e) => [e.slug, e]));

	/** @type {Record<string, { slug: string, term: string, definition: string }>} */
	const entries = {};
	for (const [key, slug] of Object.entries(ANCHORS)) {
		const entry = bySlug.get(slug);
		if (!entry) {
			problems.push(`sanitation: no lexicon entry "${slug}" (${key})`);
			continue;
		}
		entries[key] = { slug: entry.slug, term: entry.term, definition: entry.definition };
	}
	if (problems.length) return { sanitation: null, problems };

	/* ---- clauses, forward and reverse ---------------------------------- */
	/** @type {Record<string, Map<string, string>>} */
	const parsed = {
		safety: parseRepairTable(entries.safety.definition),
		inspections: parseRepairTable(entries.inspections.definition)
	};

	const clauses = [];
	for (const c of CLAUSES) {
		const text = parsed[c.anchor]?.get(c.key);
		if (!text) {
			problems.push(`sanitation: the ${c.anchor} entry no longer states "${c.key}"`);
			continue;
		}
		clauses.push({ key: c.key, anchor: c.anchor, text });
	}

	// The reverse check — a clause the guide states that nothing carries. If the
	// guide ever gains a sixth discipline, nobody has to notice by eye.
	const carried = new Set(CLAUSES.map((c) => `${c.anchor}:${c.key}`));
	for (const anchor of ['safety', 'inspections']) {
		for (const key of parsed[anchor].keys()) {
			if (!carried.has(`${anchor}:${key}`)) {
				problems.push(`sanitation: the ${anchor} entry states "${key}" and nothing carries it`);
			}
		}
	}

	/* ---- literal evidence ---------------------------------------------- */
	const facts = [];
	for (const f of FACTS) {
		if (!entries[f.anchor].definition.includes(f.evidence)) {
			problems.push(
				`sanitation: "${entries[f.anchor].term}" no longer states ${JSON.stringify(f.evidence)} — ` +
					`the ${f.key} claim is now unsupported`
			);
			continue;
		}
		facts.push({ key: f.key, anchor: f.anchor, evidence: f.evidence });
	}

	/* ---- numbers, read back out of their own evidence ------------------- */
	const numeric = [];
	for (const n of NUMERIC) {
		if (!entries[n.anchor].definition.includes(n.evidence)) {
			problems.push(`sanitation: the guide no longer states ${JSON.stringify(n.evidence)} (${n.key})`);
			continue;
		}
		const found = readNumbers(n.evidence);
		const same = found.length === n.numbers.length && found.every((v, i) => v === n.numbers[i]);
		if (!same) {
			problems.push(
				`sanitation: ${n.key} is set to ${n.numbers.join('–')} but the guide says ${found.join('–')}`
			);
			continue;
		}
		numeric.push({ key: n.key, label: n.label, anchor: n.anchor, evidence: n.evidence, numbers: n.numbers });
	}

	/* ---- the C/F disagreement, gated so it cannot go stale --------------- */
	const converted = Math.round((CF_PAIR.lowC * 9) / 5 + 32);
	if (converted === CF_PAIR.lowF) {
		problems.push(
			`sanitation: the danger-zone C/F pair now agrees with the converter (${CF_PAIR.lowC}°C -> ${converted}°F); ` +
				'the recorded disagreement is stale and the page copy must be rewritten'
		);
	}

	/* ---- the disclosed conflict, gated both ways ------------------------ */
	let conflict = null;
	{
		const { a, b } = CONFLICT;
		const aOk = entries[a.anchor].definition.includes(a.evidence);
		const bOk = entries[b.anchor].definition.includes(b.evidence);
		if (!aOk) problems.push(`sanitation: the first danger-zone statement has gone from the guide`);
		if (!bOk) problems.push(`sanitation: the second danger-zone statement has gone from the guide`);
		if (aOk && bOk) {
			const an = readNumbers(a.evidence).slice(0, 2);
			const at = entries[b.anchor].definition.indexOf(b.evidence);
			const window = entries[b.anchor].definition.slice(Math.max(0, at - b.lookBehind), at);
			const bn = readNumbers(window).slice(-2);
			const declared =
				bn.length === b.numbers.length && bn.every((v, i) => v === b.numbers[i]);
			if (!declared) {
				problems.push(
					`sanitation: the second danger window reads ${bn.join('–')} in the guide but ` +
						`${b.numbers.join('–')} is shipped`
				);
			}
			if (an[0] === bn[0] && an[1] === bn[1]) {
				problems.push(
					'sanitation: the two danger-zone statements no longer differ — the disclosed conflict is stale'
				);
			} else {
				conflict = {
					a: { anchor: a.anchor, term: entries[a.anchor].term, evidence: a.evidence, numbers: an },
					b: { anchor: b.anchor, term: entries[b.anchor].term, evidence: b.evidence, numbers: bn }
				};
			}
		}
	}

	/* ---- the silences --------------------------------------------------- */
	const gaps = [];
	for (const g of GAPS) {
		if (!entries[g.namedAnchor].definition.includes(g.named)) {
			problems.push(
				`sanitation: the ${g.key} gap says the guide names ${JSON.stringify(g.named)}, and it no longer does`
			);
			continue;
		}
		let ok = true;
		for (const token of g.absent) {
			const hits = lexicon.filter((e) => e.definition.toLowerCase().includes(token.toLowerCase()));
			const allowed = g.except && g.except.token === token ? g.except.slug : null;
			const unexpected = hits.filter((e) => e.slug !== allowed);
			if (unexpected.length) {
				ok = false;
				problems.push(
					`sanitation: the ${g.key} gap says ${JSON.stringify(token)} appears nowhere, ` +
						`and it now appears in ${unexpected.slice(0, 3).map((e) => e.term).join(', ')}`
				);
			}
		}
		if (g.except) {
			const holder = bySlug.get(g.except.slug);
			if (!holder || !holder.definition.toLowerCase().includes(g.except.token.toLowerCase())) {
				ok = false;
				problems.push(
					`sanitation: the ${g.key} gap allows ${JSON.stringify(g.except.token)} in ` +
						`"${g.except.slug}", and it is no longer there`
				);
			}
		}
		if (ok) gaps.push({ key: g.key, named: g.named, gap: g.gap });
	}

	/* ---- the framing clause must exist ---------------------------------- */
	const framingFact = facts.find((f) => f.key === FRAMING.jurisdictionFact);
	if (!framingFact) {
		problems.push(
			'sanitation: the jurisdiction clause has gone from the guide — the page cannot carry its required framing'
		);
	}

	/* ---- crosslinks must stay suppressed on the safety entries ---------- */
	for (const key of /** @type {const} */ (['safety', 'inspections'])) {
		const entry = bySlug.get(ANCHORS[key]);
		if (entry && Array.isArray(entry.recipes) && entry.recipes.length) {
			problems.push(
				`sanitation: ${entry.slug} is carrying inferred recipe crosslinks (${entry.recipes.join(', ')}); ` +
					'safety entries must not — they were picked on keyword score, not relevance'
			);
		}
	}

	const sanitation = {
		entries,
		clauses,
		facts,
		numeric,
		cf: { ...CF_PAIR, converted, disagrees: true },
		conflict,
		gaps,
		framing: framingFact ? { jurisdiction: framingFact.evidence } : null
	};

	assertNoRecipes(sanitation, new Set(recipeSlugList), problems);

	return { sanitation, problems };
}
