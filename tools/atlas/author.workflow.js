export const meta = {
	name: 'atlas-entries',
	description: 'Write a batch of Ingredient Atlas entries: an author per entry from its brief, three refuters (food science, safety, the contract), a corrector, a critic across the batch, then a placer, a challenger and a reconciler for the levels',
	phases: [
		{ title: 'Author', detail: 'one entry per agent, from the brief with the contract and the plates\' own text' },
		{ title: 'Refute', detail: 'botany and food science, safety and look-alikes, the contract: three lenses per entry' },
		{ title: 'Correct', detail: 'every finding gets a disposition' },
		{ title: 'Critic', detail: 'the batch read together against the entries it sits beside' },
		{ title: 'Place', detail: 'a level per entry against the standard, challenged and reconciled' }
	]
}

/* Run with the Workflow tool:
     scriptPath: a copy of this file inside the session's working directory
     args:       the JSON printed by  node tools/atlas/brief.mjs
   Save what the run returned with  node tools/atlas/take.mjs <output.json>
   then npm run build:data gates every entry and every placement.            */

const B = args
const str = (a, b) => ({ type: 'string', minLength: a, maxLength: b })

const ENTRY = {
	type: 'object',
	properties: {
		t: { type: 'string', description: 'the term, copied exactly from the brief' },
		c: { type: 'string', enum: B.categories },
		d: str(325, 1200),
		season: { type: 'array', items: { type: 'integer', minimum: 1, maximum: 12 } },
		choose: str(140, 700),
		store: str(140, 700),
		prep: str(140, 700),
		methods: { type: 'array', minItems: 1, maxItems: 8, items: { type: 'string' } }
	},
	required: ['t', 'c', 'd', 'season', 'choose', 'store', 'prep', 'methods']
}
const FINDINGS = {
	type: 'object',
	properties: {
		findings: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					field: { type: 'string', description: 't, c, d, season, choose, store, prep or methods' },
					severity: { type: 'string', enum: ['wrong', 'unsafe', 'unclear', 'style'], description: 'wrong = a false claim; unsafe = a safety fact missing, wrong or stated as a verdict; unclear = true but a cook would stumble; style = the contract or a house rule broken' },
					claim: { type: 'string' },
					because: { type: 'string' },
					fix: { type: 'string' }
				},
				required: ['field', 'severity', 'claim', 'because', 'fix']
			}
		}
	},
	required: ['findings']
}
const CORRECTED = {
	type: 'object',
	properties: {
		entry: ENTRY,
		dispositions: { type: 'array', items: { type: 'object', properties: { finding: { type: 'string' }, action: { type: 'string', enum: ['applied', 'rejected'] }, reason: { type: 'string' } }, required: ['finding', 'action', 'reason'] } }
	},
	required: ['entry', 'dispositions']
}
const CRITIC = {
	type: 'object',
	properties: {
		ok: { type: 'boolean' },
		problems: { type: 'array', items: { type: 'object', properties: { slug: { type: 'string' }, issue: { type: 'string' }, fix: { type: 'string' } }, required: ['slug', 'issue', 'fix'] } },
		notes: { type: 'string' }
	},
	required: ['ok', 'problems', 'notes']
}
const PLACEMENTS = {
	type: 'object',
	properties: {
		placements: { type: 'array', items: { type: 'object', properties: { slug: { type: 'string' }, level: { type: 'integer', minimum: 1, maximum: 4 }, reason: { type: 'string' } }, required: ['slug', 'level', 'reason'] } }
	},
	required: ['placements']
}
const CHALLENGES = {
	type: 'object',
	properties: {
		challenges: { type: 'array', items: { type: 'object', properties: { slug: { type: 'string' }, level: { type: 'integer', minimum: 1, maximum: 4 }, because: { type: 'string' } }, required: ['slug', 'level', 'because'] } }
	},
	required: ['challenges']
}
const RECONCILED = {
	type: 'object',
	properties: {
		placements: PLACEMENTS.properties.placements,
		dispositions: { type: 'array', items: { type: 'object', properties: { slug: { type: 'string' }, action: { type: 'string', enum: ['moved', 'kept'] }, reason: { type: 'string' } }, required: ['slug', 'action', 'reason'] } }
	},
	required: ['placements', 'dispositions']
}

const RULES = `
THE INGREDIENT ATLAS is the World Table's Lexicon of produce, fungi, pulses and pantry: one entry per ingredient a cook looks up with the thing in their hand. Each entry is a definition (mechanism first, then what the cook does tomorrow) and five structured fields: season, choose, store, prep, methods. The reader is a cook. The contract is in the brief, verbatim from the file that enforces it, and a build gate refuses an entry that breaks it.
`
const BRIEF = (e) => `
THE BRIEF is a JSON file on disk. READ IT FIRST, in full, with your file-reading tool: ${e.briefPath}
It holds: "term", "category" and "hint" (the operator's note on what the entry is about and what it must get right); "contract" (the file's own rules for every field); "categories"; "rules" (the house rules the gate enforces); "exemplars" (three finished entries of the same category: the register and depth to match without copying); "related" (existing entries that share a word: agree with them, cross-reference them by name where it helps, and never repeat their content); "onPlates" (what the illustrated plates print for this item, including any correction the plate carries; the entry may correct the plate but must not contradict a correction); "existingTerms" (every term in the Lexicon: the new term must not duplicate one); and "placement" (for the levels stage).
`

const LENSES = [
	{ key: 'fact', title: 'BOTANY AND FOOD SCIENCE', brief: 'You are a food scientist and a produce buyer. Try to REFUTE every factual claim: species and family, what the plant or fungus is, the mechanism named (enzyme, acid, sugar, pectin, starch, toxin), seasons in the northern hemisphere, storage temperatures and times, what a good one looks like, what happens under heat. Check the entry against the brief\'s "related" entries for contradiction. Default to a finding when unsure and CHECK doubtful claims by searching the web.' },
	{ key: 'safety', title: 'SAFETY AND LOOK-ALIKES', brief: 'You are the person who gets the call when a cook is poisoned. Find any MISSING safety fact a cook needs (a seed with amygdalin, a raw pulse with linamarin or lectins, a fungus with a deadly look-alike and the check that tells them apart, a fruit that reacts with latex allergy, a fumigant residue), any safety claim that is WRONG or overstated ("cooking makes it safe" where it does not), and any sentence phrased as a verdict that a dish is safe or free of something for someone. For a fungus, confirm the identification check in the entry is the one that actually works and that it is stated before any cooking advice.' },
	{ key: 'contract', title: 'THE CONTRACT AND THE HOUSE RULES', brief: 'You are the build gate with eyes. Check every field against the brief\'s "contract" and "rules": the term Title Case and not a duplicate of an existing term (search "existingTerms"), the category one of the six, the definition 325 to 1200 characters and mechanism first, choose/store/prep 140 to 280 characters (never over 700) and each saying what the contract asks of it, season as month integers and honest (empty only for genuinely year-round), methods as lowercase verbs, no dash, American spelling, temperatures in the house form, no banned substring, no praise paragraph, closing on something the cook does tomorrow. Compare the register with the exemplars.' }
]

const author = (e) =>
	agent(
		`${RULES}${BRIEF(e)}
YOU ARE THE AUTHOR of one entry: "${e.term}" in ${e.category}. Read the brief in full, then write the entry through the schema with t and c copied exactly. Before you return, count every field against the contract, confirm no dash and no banned substring, and confirm every fact you state is one you would defend to a food scientist.`,
		{ label: `author:${e.slug}`, phase: 'Author', schema: ENTRY, effort: 'high' }
	)

const refute = async (drafted, e) => {
	if (!drafted) return null
	const found = await parallel(
		LENSES.map((lens) => () =>
			agent(
				`${RULES}${BRIEF(e)}
YOU ARE A REFUTER. Your lens: ${lens.title}. ${lens.brief}

A finding names the field, quotes the words objected to, gives the correct fact, and offers replacement wording no longer than what it replaces unless a safety fact demands it. Do not report what is fine.

THE ENTRY:
${JSON.stringify(drafted, null, 1)}`,
				{ label: `refute:${lens.key}:${e.slug}`, phase: 'Refute', schema: FINDINGS, effort: 'high' }
			).then((r) => ((r && r.findings) || []).map((f) => ({ ...f, lens: lens.key })))
		)
	)
	const findings = found.filter(Boolean).flat().map((f, n) => ({ ...f, key: `${e.slug}-${f.lens}-${n + 1}`, slug: e.slug }))
	return { entry: drafted, findings }
}

const correct = async (stage, e) => {
	if (!stage) return null
	if (!stage.findings.length) return { ...stage, dispositions: [] }
	const fixed = await agent(
		`${RULES}${BRIEF(e)}
YOU ARE THE CORRECTOR. Three refuters attacked this entry. Answer EVERY finding with a disposition: "applied" (say what changed) or "rejected" (say why, with the fact). Reject only when you are sure: a "wrong" or "unsafe" finding you reject is escalated to a person. Apply the smallest change that answers the finding, keep every field inside the contract, and return the WHOLE entry plus one disposition per finding key.

FINDINGS:
${JSON.stringify(stage.findings, null, 1)}

THE ENTRY:
${JSON.stringify(stage.entry, null, 1)}`,
		{ label: `correct:${e.slug}`, phase: 'Correct', schema: CORRECTED, effort: 'high' }
	)
	if (!fixed || !fixed.entry) {
		log(`${e.slug}: the corrector returned nothing; keeping the draft with its findings undisposed`)
		return { ...stage, dispositions: [] }
	}
	return { entry: fixed.entry, findings: stage.findings, dispositions: fixed.dispositions || [] }
}

log(`${B.entries.length} entries to write`)
const results = await pipeline(B.entries, author, refute, correct)
let done = results.map((r, i) => (r ? { ...r, spec: B.entries[i], slug: B.entries[i].slug } : null)).filter(Boolean)
if (done.length !== B.entries.length) log(`${B.entries.length - done.length} entry(ies) died; re-run with --only for them`)

phase('Critic')
const critic = await agent(
	`${RULES}
YOU ARE THE CRITIC. Read the whole batch together, which no author or refuter did; each entry's brief is at the briefPath in its spec, open any you need. Look for: two entries that repeat the same paragraph (the same amygdalin sentence in three berries); an entry that contradicts an existing related entry named in its brief; a category that does not fit; a term that duplicates or nearly duplicates an existing term; a definition that opens on history or praise instead of mechanism; a safety fact stated in one entry and missing from a sibling that needs it too. ok is true only if you found nothing. Each problem names the slug and gives the fix.

THE BATCH:
${JSON.stringify(done.map((d) => ({ slug: d.slug, briefPath: d.spec.briefPath, ...d.entry })), null, 1)}`,
	{ label: 'critic:batch', phase: 'Critic', schema: CRITIC, effort: 'high' }
)
if (critic && critic.problems && critic.problems.length) {
	const bySlug = new Map()
	for (const q of critic.problems) (bySlug.get(q.slug) || bySlug.set(q.slug, []).get(q.slug)).push(q)
	const repaired = await parallel(
		done
			.filter((d) => bySlug.has(d.slug))
			.map((d) => () => {
				const asFindings = bySlug.get(d.slug).map((q, n) => ({ key: `${d.slug}-critic-${n + 1}`, slug: d.slug, lens: 'critic', field: 'entry', severity: 'unclear', claim: q.issue, because: q.issue, fix: q.fix }))
				return agent(
					`${RULES}${BRIEF(d.spec)}
YOU ARE THE CORRECTOR, for the critic's read of the whole batch. Answer every finding with a disposition and return the WHOLE entry, inside the contract.

FINDINGS:
${JSON.stringify(asFindings, null, 1)}

THE ENTRY:
${JSON.stringify(d.entry, null, 1)}`,
					{ label: `correct:critic:${d.slug}`, phase: 'Critic', schema: CORRECTED, effort: 'high' }
				).then((fixed) => (fixed && fixed.entry ? { slug: d.slug, entry: fixed.entry, findings: asFindings, dispositions: fixed.dispositions || [] } : null))
			})
	)
	const byKey = new Map(repaired.filter(Boolean).map((r) => [r.slug, r]))
	done = done.map((d) => {
		const r = byKey.get(d.slug)
		return r ? { ...d, entry: r.entry, findings: [...d.findings, ...r.findings], dispositions: [...d.dispositions, ...r.dispositions] } : d
	})
}

phase('Place')
const PLACE_RULES = `
THE FOUR LEVELS are the World Table's ladder: I Commis, II Chef de Partie, III Sous Chef, IV Chef. Nothing is locked: a level guides, it never bars, so an item placed low costs nothing and an item placed high is hidden from the reader who most needs it. TIES BREAK DOWN. The standard, the Lexicon's signals and the deck's placements as a calibration set are in each entry's brief under "placement" (the same for every entry in this batch: read one). Place each new entry by its level key with a reason that stands on its own and never mentions the reader.
`
const batch = done.map((d) => ({ slug: d.slug, term: d.entry.t, category: d.entry.c, opens: d.entry.d.slice(0, 220), briefPath: d.spec.briefPath }))
const placed = await agent(
	`${PLACE_RULES}
YOU ARE THE ASSIGNER. Place every entry below exactly once.

${JSON.stringify(batch, null, 1)}`,
	{ label: 'place:assign', phase: 'Place', schema: PLACEMENTS, effort: 'high' }
)
let placements = (placed && placed.placements) || []
const challenged = await agent(
	`${PLACE_RULES}
YOU ARE THE CHALLENGER, from the floor and the stove. Read every placement below against the standard and challenge the ones that are wrong: an everyday item placed high (the costly failure), a rare or regional item placed low, a category placed against the standard's lean. Do not report what is right. For each challenge give the level you argue for and the fact that decides it.

THE ENTRIES:
${JSON.stringify(batch, null, 1)}

THE PLACEMENTS:
${JSON.stringify(placements, null, 1)}`,
	{ label: 'place:challenge', phase: 'Place', schema: CHALLENGES, effort: 'high' }
)
const challenges = (challenged && challenged.challenges) || []
let placeDispositions = []
if (challenges.length) {
	const rec = await agent(
		`${PLACE_RULES}
YOU ARE THE RECONCILER. Answer EVERY challenge with a disposition: "moved" (say why the challenge wins) or "kept" (say why the assigner's level stands). Ties break DOWN. Return ALL ${batch.length} placements, changed or not, each with a reason that stands on its own.

THE ENTRIES:
${JSON.stringify(batch, null, 1)}

THE PLACEMENTS:
${JSON.stringify(placements, null, 1)}

THE CHALLENGES:
${JSON.stringify(challenges, null, 1)}`,
		{ label: 'place:reconcile', phase: 'Place', schema: RECONCILED, effort: 'high' }
	)
	if (rec && rec.placements && rec.placements.length === batch.length) {
		placements = rec.placements
		placeDispositions = rec.dispositions || []
	} else log('the reconciler did not return every placement; the assigner\'s stand')
}

const entries = done.map((d) => ({ slug: d.slug, ...d.entry }))
const findings = done.flatMap((d) => d.findings)
const dispositions = done.flatMap((d) => d.dispositions)
log(`${entries.length} entry(ies), ${findings.length} finding(s), ${dispositions.filter((x) => x.action === 'rejected').length} rejected, ${placements.length} placed, ${challenges.length} challenged`)
return { entries, findings, dispositions, critic, placements, challenges, placeDispositions }
