export const meta = {
	name: 'levels-placement',
	description: 'Place every unlevelled item of the World Table against the written standard: an assigner per chunk, a challenger arguing each placement from the floor and the stove, a reconciler, then one cross-subsection critic with one bounded repair',
	phases: [
		{ title: 'Assign', detail: 'each chunk placed against the standard, with a reason per item' },
		{ title: 'Challenge', detail: 'every placement argued from the floor and the stove' },
		{ title: 'Reconcile', detail: 'each challenge answered: moved or kept, with the fact' },
		{ title: 'Critic', detail: 'the whole placement read across subsections, at most a tenth moved' }
	]
}

/* Run with the Workflow tool:
     scriptPath: a copy of this file inside the session's working directory
     args:       the JSON printed by  node tools/levels/brief.mjs
   A workflow script has no filesystem, so the briefs on disk ARE the
   standard as the agents see it: the standard's text, the four levels, the
   deck's placements as the calibration set, every item with its signals.
   Write the returned object to tools/levels/out/run.json, then
     node tools/levels/set-levels.mjs tools/levels/out/run.json                */

const B = args
const LEVEL_NAMES = B.levels.map((l) => `${l.level} = ${l.name}`).join(', ')

const PLACEMENT = {
	type: 'object',
	properties: {
		slug: { type: 'string', description: 'the roster slug, copied exactly' },
		level: { type: 'integer', minimum: 1, maximum: 4, description: `the level key: ${LEVEL_NAMES}` },
		reason: { type: 'string', minLength: 20, maxLength: 240, description: 'one sentence: which signal or which line of the standard places it here' }
	},
	required: ['slug', 'level', 'reason']
}
const PLACEMENTS = { type: 'object', properties: { placements: { type: 'array', items: PLACEMENT } }, required: ['placements'] }

const CHALLENGES = {
	type: 'object',
	properties: {
		challenges: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					slug: { type: 'string', description: 'the roster slug, copied exactly' },
					proposed: { type: 'integer', minimum: 1, maximum: 4, description: 'the level you argue for instead' },
					because: { type: 'string', minLength: 20, maxLength: 300, description: 'the fact from the floor or the stove that the assigner missed' }
				},
				required: ['slug', 'proposed', 'because']
			}
		}
	},
	required: ['challenges']
}

const RECONCILED = {
	type: 'object',
	properties: {
		placements: { type: 'array', items: PLACEMENT },
		dispositions: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					slug: { type: 'string' },
					action: { type: 'string', enum: ['moved', 'kept'] },
					reason: { type: 'string', description: 'one sentence: why the challenge won, or why it did not' }
				},
				required: ['slug', 'action', 'reason']
			}
		}
	},
	required: ['placements', 'dispositions']
}

const CRITIC = {
	type: 'object',
	properties: {
		ok: { type: 'boolean' },
		moves: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					sub: { type: 'string', description: 'the subsection key: dishes, techniques, lexicon, service, palate or safety' },
					slug: { type: 'string', description: 'the item slug, copied exactly' },
					to: { type: 'integer', minimum: 1, maximum: 4 },
					because: { type: 'string', minLength: 20, maxLength: 300 }
				},
				required: ['sub', 'slug', 'to', 'because']
			}
		},
		notes: { type: 'string', description: 'anything for the operator: a level thin in one subsection, a signal the standard should weigh, a pair placed apart that belongs together' }
	},
	required: ['ok', 'moves', 'notes']
}

const RULES = `
THE FOUR LEVELS are the whole World Table's ladder: I Commis, II Chef de Partie, III Sous Chef, IV Chef. A reader meets each subsection (dishes, techniques, the Lexicon, the Floor Deck, the palate, food safety, service) level by level, and the home says how much of each level is met. NOTHING IS LOCKED: a level guides, it never bars. So an item placed LOW costs nothing, and an item placed HIGH is hidden from the reader who most needs it. TIES BREAK DOWN.

You place items by their LEVEL KEY (${LEVEL_NAMES}), against the written standard in the brief, weighing the signals in the order the standard gives them. The Floor Deck's 281 placements are the calibration set: the brief carries twenty of them per level with the reason each was placed there, and an item whose deck card exists takes the card's level unless its own essay is plainly broader.

A REASON names the signal or the line of the standard that decides it, in one sentence, so a person can disagree with it later. No quotas: do not spread items across levels to make the numbers even. Minimums per level exist (in the brief) and are small; the standard decides, the minimums only catch a level left empty.

HARD RULES: copy every slug exactly from the roster; place every roster slug and no other; one level per slug; British English; no em dash and no en dash (use a comma, a colon or a full stop); never a word about the reader ("beginner", "advanced"): a level describes what is asked at that level, never who is asking.
`

const BRIEF = (chunk) => `
THE BRIEF is a JSON file on disk. READ IT FIRST, in full, with your file-reading tool: ${B.briefDir}/${chunk.sub}.brief.json
It holds: "standard" (the four levels as the owner wrote them, and the signals in the order they weigh), "levels", "minimums", "signals" (what each field on a roster row means and which way it leans), "exemplars" (the deck's own placements per level, with reasons: the calibration set), and "roster" (every item of this subsection with its signals; a row with currentLevel was placed before and may be kept or moved).
`

log(`${B.chunks.length} chunk(s) across ${Object.keys(B.totals).length} subsection(s): ${Object.entries(B.totals).map(([k, n]) => `${k} ${n}`).join(', ')}`)

const results = await pipeline(
	B.chunks,
	(chunk) =>
		agent(
			`${RULES}${BRIEF(chunk)}
YOU ARE THE ASSIGNER for "${chunk.title}", chunk ${chunk.n} of ${chunk.of}. Place EACH of these ${chunk.rows.length} roster slugs, and only these, at one level, with a reason. Find each one's full row (its signals) in the brief's "roster" before you place it. Read the standard's paragraph for each level before you begin, and the exemplars at that level.

${JSON.stringify(chunk.rows, null, 1)}

Return the placements through the schema. Before you return, check that every slug above is placed exactly once and that no reason mentions the reader.`,
			{ label: `assign:${chunk.sub}:${chunk.n}`, phase: 'Assign', schema: PLACEMENTS, effort: 'high' }
		),
	async (drafted, chunk) => {
		const placements = (drafted && drafted.placements) || []
		const slugs = new Set(chunk.rows.map((r) => r.slug))
		const missing = chunk.rows.filter((r) => !placements.some((p) => p.slug === r.slug))
		if (missing.length) log(`${chunk.sub} ${chunk.n}: the assigner left ${missing.length} slug(s) unplaced; the reconciler is asked for them`)
		const challenged = await agent(
			`${RULES}${BRIEF(chunk)}
YOU ARE THE CHALLENGER, from the floor and the stove. You have run a pass and trained a brigade; you know which word a guest asks about on a Tuesday and which technique a first-week cook is actually put on. Read every placement below against the standard and the signals in the brief and CHALLENGE the ones that are wrong: an everyday item placed high (the commonest failure, and the costly one, because it hides the item), a rare or deeply classical item placed low, an item whose deck card sits at another level with no reason given, a dish placed against its semester or its difficulty with no argument, a technique with a written standard and many recipes placed above II. Do not report what is right. For each challenge give the level you argue for and the fact that decides it.

THE PLACEMENTS:
${JSON.stringify(placements, null, 1)}`,
			{ label: `challenge:${chunk.sub}:${chunk.n}`, phase: 'Challenge', schema: CHALLENGES, effort: 'high' }
		)
		const challenges = ((challenged && challenged.challenges) || []).filter((c) => slugs.has(c.slug)).map((c) => ({ ...c, sub: chunk.sub }))
		return { placements, challenges, missing, chunk }
	},
	async (stage) => {
		if (!stage) return null
		const { placements, challenges, missing, chunk } = stage
		if (!challenges.length && !missing.length) return { ...stage, dispositions: [] }
		const fixed = await agent(
			`${RULES}${BRIEF(chunk)}
YOU ARE THE RECONCILER. An assigner placed these items and a challenger argued some of them from the floor and the stove. Answer EVERY challenge with a disposition: "moved" (you changed the level; say why the challenge wins) or "kept" (say why the assigner's level stands, with the fact). Decide by the standard and the signals, with ties breaking DOWN. Return ALL ${chunk.rows.length} placements for this chunk, changed or not, each with a reason that stands on its own${missing.length ? `, INCLUDING these the assigner left out: ${JSON.stringify(missing.map((r) => r.slug))}` : ''}.

THE CHUNK'S ROSTER:
${JSON.stringify(chunk.rows, null, 1)}

CHALLENGES:
${JSON.stringify(challenges, null, 1)}

THE PLACEMENTS:
${JSON.stringify(placements, null, 1)}`,
			{ label: `reconcile:${chunk.sub}:${chunk.n}`, phase: 'Reconcile', schema: RECONCILED, effort: 'medium' }
		)
		if (!fixed || !fixed.placements || !fixed.placements.length) {
			log(`${chunk.sub} ${chunk.n}: the reconciler returned nothing; keeping the assigner's placements with the challenges undisposed`)
			return { ...stage, dispositions: [] }
		}
		return { ...stage, placements: fixed.placements, dispositions: (fixed.dispositions || []).map((d) => ({ ...d, sub: chunk.sub })) }
	}
)

const done = results.filter(Boolean)
if (done.length !== B.chunks.length) log(`${B.chunks.length - done.length} chunk(s) died; their items are NOT in the result. Resume the run to fill them`)

/* one list per subsection, one placement per slug (the last stage's wins) */
const placements = {}
const challenges = []
const dispositions = []
const unresolved = []
for (const r of done) {
	const list = placements[r.chunk.sub] || (placements[r.chunk.sub] = [])
	const own = new Set(r.chunk.rows.map((x) => x.slug))
	for (const p of r.placements) {
		if (!own.has(p.slug)) { unresolved.push({ sub: r.chunk.sub, slug: p.slug, issue: 'placed a slug outside its chunk' }); continue }
		const at = list.findIndex((x) => x.slug === p.slug)
		if (at >= 0) list[at] = p
		else list.push(p)
	}
	for (const row of r.chunk.rows) if (!list.some((p) => p.slug === row.slug)) unresolved.push({ sub: r.chunk.sub, slug: row.slug, issue: 'never placed' })
	challenges.push(...r.challenges)
	dispositions.push(...r.dispositions)
}
const total = Object.values(placements).reduce((n, l) => n + l.length, 0)
log(`${total} placed, ${challenges.length} challenge(s), ${dispositions.filter((d) => d.action === 'moved').length} moved, ${unresolved.length} unresolved`)

phase('Critic')
const summary = Object.entries(placements).map(([sub, list]) => ({
	sub,
	counts: [1, 2, 3, 4].map((l) => `${l}: ${list.filter((p) => p.level === l).length}`).join(', '),
	items: list.map((p) => `${p.level} ${p.slug}`)
}))
const critic = await agent(
	`${RULES}
YOU ARE THE CROSS-SUBSECTION CRITIC. Read the WHOLE placement at once, which no assigner did: every subsection's items with their levels, as a bare list. The briefs with the signals are on disk in ${B.briefDir}/<subsection>.brief.json; open one when a placement looks wrong and check it against the standard there (the standard is the same in every brief).

Look for DRIFT between subsections: a technique at level III whose Lexicon term sits at I (or the reverse), a dish at I whose techniques all sit at III, a service module at IV whose terms a first-week server is asked on the floor, a Lexicon term at II whose deck card sits at IV. Look for SUPPLY: a level thin in a subsection against these minimums, ${JSON.stringify(B.minimums)} (service is counted in the modules' terms), or a level that swallowed nearly everything. Look for the commonest error: everyday items placed high.

Propose MOVES, each with the fact that decides it, most important first: at most a tenth of each subsection will be applied, in your order, and the rest recorded for the operator. ok is true only if you would move nothing.

THE PLACEMENT:
${JSON.stringify(summary, null, 1)}`,
	{ label: 'critic:all', phase: 'Critic', schema: CRITIC, effort: 'high' }
)

const criticChanges = []
const criticDropped = []
if (critic && critic.moves && critic.moves.length) {
	const budget = {}
	for (const [sub, list] of Object.entries(placements)) budget[sub] = Math.max(1, Math.floor(list.length / 10))
	for (const m of critic.moves) {
		const list = placements[m.sub]
		const p = list && list.find((x) => x.slug === m.slug)
		if (!p) { criticDropped.push({ ...m, why: 'not an item of that subsection in this run' }); continue }
		if (p.level === m.to) { criticDropped.push({ ...m, why: 'already at that level' }); continue }
		if (budget[m.sub] <= 0) { criticDropped.push({ ...m, why: 'over the tenth this repair may move' }); continue }
		budget[m.sub]--
		criticChanges.push({ sub: m.sub, slug: m.slug, from: p.level, to: m.to, because: m.because })
		p.level = m.to
		p.reason = `${m.because} (moved by the cross-subsection critic from ${criticChanges[criticChanges.length - 1].from})`
	}
	log(`critic: ${criticChanges.length} move(s) applied, ${criticDropped.length} recorded and not applied`)
}

return { placements, challenges, dispositions, criticChanges, criticDropped, critic, unresolved }
