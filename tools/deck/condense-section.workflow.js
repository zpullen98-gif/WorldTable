export const meta = {
	name: 'floor-deck-condense',
	description: 'Condense a written Floor Deck section to the contract lengths without changing a fact: a condenser trims each chunk, a checker compares before and after, a corrector answers every finding',
	phases: [
		{ title: 'Condense', detail: 'cards trimmed in chunks of eight, facts untouched' },
		{ title: 'Check', detail: 'before against after: a lost fact, a changed meaning, a new error' },
		{ title: 'Correct', detail: 'every finding gets a disposition' }
	]
}

/* For a section that came back long. The pilot did: it was written to a mean
   ceiling of 800 characters, landed at 771, and the ceiling then came down to
   720 because at the pilot's rate 300 cards pass the deck's byte ceiling.

   Run with the Workflow tool:
     scriptPath: a copy of this file inside the session's working directory
     args: { sectionFile, section, limits, aims, banned, ids: [[...], ...], targetMean }
   The agents read the section module from disk themselves. Write what this
   returns to tools/deck/out/<section>.json and validate and merge it as usual. */

const B = args
const L = B.limits
const A = B.aims
const str = (r) => ({ type: 'string', minLength: r[0], maxLength: r[1] })
const range = (r) => `${r[0]} to ${r[1]}`

const CARD = {
	type: 'object',
	properties: {
		id: { type: 'string' },
		term: { type: 'string' },
		say: str(L.say),
		aliases: { type: 'array', maxItems: L.aliasesMax, items: str(L.alias) },
		gist: str(L.gist),
		guest: str(L.guest),
		why: str(L.why),
		madeWith: { type: 'array', maxItems: L.madeWithMax, items: str(L.madeWithItem) },
		note: str(L.note),
		origin: str(L.origin),
		pairs: str(L.pairs),
		notThis: str(L.notThis),
		lexiconSlug: { type: 'string' },
		recipe: { type: 'string' },
		seeAlso: { type: 'array', maxItems: L.seeAlsoMax, items: { type: 'string' } },
		confusedWith: { type: 'array', maxItems: L.confusedWithMax, items: { type: 'string' } },
		line: str(L.line),
		traps: {
			type: 'array',
			maxItems: L.trapsMax,
			items: { type: 'object', properties: { says: str(L.trapSays), why: str(L.trapWhy) }, required: ['says', 'why'] }
		}
	},
	required: ['id', 'term', 'gist', 'guest', 'why']
}
const CARDS = { type: 'object', properties: { cards: { type: 'array', items: CARD } }, required: ['cards'] }
const FINDINGS = {
	type: 'object',
	properties: {
		findings: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'string', description: 'the card id, copied exactly' },
					field: { type: 'string' },
					severity: { type: 'string', enum: ['wrong', 'verdict', 'unclear', 'style'] },
					claim: { type: 'string', description: 'what the condensed card now says, or no longer says' },
					because: { type: 'string', description: 'what was lost, changed or broken, against the original' },
					fix: { type: 'string', description: 'wording that restores it inside the limits' }
				},
				required: ['id', 'field', 'severity', 'claim', 'because', 'fix']
			}
		}
	},
	required: ['findings']
}
const CORRECTED = {
	type: 'object',
	properties: {
		cards: { type: 'array', items: CARD },
		dispositions: {
			type: 'array',
			items: {
				type: 'object',
				properties: { finding: { type: 'string' }, action: { type: 'string', enum: ['applied', 'rejected'] }, reason: { type: 'string' } },
				required: ['finding', 'action', 'reason']
			}
		}
	},
	required: ['cards', 'dispositions']
}

const RULES = `
THE FLOOR DECK is a staff-training flashcard deck for new restaurant hires. This section, "${B.section}", is already WRITTEN and FACT-CHECKED: three refuters and a critic have been over every card. It came back LONG. Your job concerns LENGTH ONLY.

READ THE SECTION FIRST, with your file-reading tool: ${B.sectionFile}
It is a JavaScript module whose default export is the array of cards.

THE LIMITS NOW (a build gate enforces them):
- gist ${range(L.gist)} characters, aim ${range(A.gist)}. traps[].says ${range(L.trapSays)}: the SAME band, and on each card keep every trap within about 10 characters of that card's gist, because gist and traps sit side by side as answer options and the longest option must not be the right one. If a gist is longer than its traps, shorten the gist; never pad a trap.
- guest ${range(L.guest)}, aim ${range(A.guest)}.
- why ${range(L.why)}, aim ${range(A.why)}.
- note ${range(L.note)}: keep a note ONLY when it is a real doneness, raw-service or handling fact that the why does not already say. Delete a note that restates the why or merely advises. Expect a note on fewer than half the cards.
- origin and pairs ${range(L.origin)}, aim ${range(A.origin)}. notThis ${range(L.notThis)}, aim ${range(A.notThis)}; it is required whenever confusedWith is present.
- the whole card (gist + guest + why + note + origin + pairs + notThis + line) ${range(L.cardTotal)} characters, and the SECTION MEAN must come to ${B.targetMean} or under. Aim each card at about ${B.targetMean - 40}.

HOW TO CONDENSE: cut restatement, throat-clearing, the second example where one does the work, and any sentence the guest line already said. Keep the mechanism, the comparison that makes it click, and every safety or doneness fact. Prefer deleting a whole weak sentence to shaving words off every sentence.

WHAT YOU MAY NOT DO: change, add or soften a FACT; change id, term, say, aliases, madeWith, lexiconSlug, recipe, seeAlso, confusedWith or line; add a claim that was not there; remove the only statement of a safety or doneness fact. A gist and every trap must still avoid the card's own term words. No em dash or en dash. Never the words contains, containing, free from, free of, any X-free, allergen, allergy, allergic, safe for, safe to, is safe, vegan, vegetarian, celiac, pregnant. Banned substrings anywhere: ${B.banned.map((b) => JSON.stringify(b)).join(', ')}. American spelling. Temperatures only as "63 C (145 F)" and never in the guest line. guest, why, note, notThis and traps[].why end in a full stop; gist, origin, pairs, line and traps[].says do not. No two cards may share a gist or a guest line.
`

const chunks = B.ids
log(`${B.section}: condensing ${chunks.flat().length} card(s) in ${chunks.length} chunk(s) toward a mean of ${B.targetMean}`)

const results = await pipeline(
	chunks,
	(ids, _o, i) =>
		agent(
			`${RULES}
YOU ARE THE CONDENSER. Condense exactly these ${ids.length} cards and return each one WHOLE through the schema, with every field it had that you are keeping (ids and links copied exactly):
${JSON.stringify(ids)}
Before you return, count each card's total and each gist against its traps.`,
			{ label: `condense:${B.section}:${i + 1}`, phase: 'Condense', schema: CARDS, effort: 'high' }
		),
	async (out, ids, i) => {
		const cards = (out && out.cards) || []
		const mine = new Set(ids)
		const checked = await agent(
			`${RULES}
YOU ARE THE CHECKER. A condenser has shortened these cards. Compare each CONDENSED card below with its ORIGINAL in the section file, field by field, and report ONLY real damage: a fact lost that a server needs, a meaning changed, a new error introduced, a safety or doneness fact dropped, a gist that no longer tells this card from its neighbours, a gist longer than its traps by more than about 10 characters, a link or list that changed, verdict language, or a broken rule. Shorter is the point: do not report a cut that lost nothing. Name the card by its ID.

THE CONDENSED CARDS:
${JSON.stringify(cards, null, 1)}`,
			{ label: `check:${B.section}:${i + 1}`, phase: 'Check', schema: FINDINGS, effort: 'high' }
		)
		const findings = []
		const unresolved = []
		;((checked && checked.findings) || []).forEach((f, n) => {
			const keyed = { ...f, lens: 'condense-check', key: `${B.section}-condense-${i + 1}-${n + 1}` }
			if (mine.has(f.id)) findings.push(keyed)
			else unresolved.push(keyed)
		})
		return { cards, findings, unresolved, ids }
	},
	async (stage, _ids, i) => {
		if (!stage) return null
		if (!stage.findings.length) return { ...stage, dispositions: [] }
		const fixed = await agent(
			`${RULES}
YOU ARE THE CORRECTOR. A checker compared these condensed cards with their originals and filed the findings below. Answer EVERY finding with a disposition, "applied" or "rejected" with a reason, restore what was lost while staying inside every limit, and return ALL ${stage.cards.length} cards.

FINDINGS:
${JSON.stringify(stage.findings, null, 1)}

THE CONDENSED CARDS:
${JSON.stringify(stage.cards, null, 1)}`,
			{ label: `correct:${B.section}:${i + 1}`, phase: 'Correct', schema: CORRECTED, effort: 'high' }
		)
		if (!fixed || !fixed.cards || fixed.cards.length !== stage.cards.length) {
			log(`chunk ${i + 1}: the corrector did not return every card; keeping the condensed draft with its findings undisposed`)
			return { ...stage, dispositions: [] }
		}
		return { ...stage, cards: fixed.cards, dispositions: fixed.dispositions || [] }
	}
)

const done = results.filter(Boolean)
if (done.length !== chunks.length) log(`${chunks.length - done.length} chunk(s) died; their cards are NOT in the result`)
const cards = done.flatMap((r) => r.cards)
const total = (c) => ['gist', 'guest', 'why', 'note', 'origin', 'pairs', 'notThis', 'line'].reduce((n, k) => n + (c[k] ? c[k].length : 0), 0)
const mean = cards.length ? Math.round(cards.reduce((n, c) => n + total(c), 0) / cards.length) : 0
log(`${cards.length} card(s) back, mean prose ${mean} characters (target ${B.targetMean})`)

return {
	section: B.section,
	cards,
	findings: done.flatMap((r) => r.findings),
	dispositions: done.flatMap((r) => r.dispositions),
	unresolved: done.flatMap((r) => r.unresolved),
	critic: { ok: mean <= B.targetMean, problems: [], notes: `condensed to a mean of ${mean} characters against a target of ${B.targetMean}` }
}
