export const meta = {
	name: 'level-primers',
	description: 'Write the primers: one reader per level per subsection, each drafted by an author, attacked by three refuters with different lenses, answered by a corrector, and read together per level by a critic',
	phases: [
		{ title: 'Author', detail: 'one primer per agent, from the brief with every item\'s own text' },
		{ title: 'Refute', detail: 'culinary fact, the app\'s own data, house rules and register: three lenses per primer' },
		{ title: 'Correct', detail: 'every finding gets a disposition, applied or rejected with a reason' },
		{ title: 'Critic', detail: 'each level\'s primers read together for repetition and contradiction, with one bounded repair' }
	]
}

/* Run with the Workflow tool:
     scriptPath: a copy of this file inside the session's working directory
     args:       the JSON printed by  node tools/primers/brief.mjs
   A workflow script has no filesystem, so each agent opens its brief for
   itself. Save what the run returned with
     node tools/primers/take.mjs <workflow-output.json>
   then npm run build:data gates every primer it wrote.                        */

const B = args
const L = B.limits
const A = B.aims
const str = (r) => ({ type: 'string', minLength: r[0], maxLength: r[1] })

const PRIMER = {
	type: 'object',
	properties: {
		level: { type: 'integer', minimum: 1, maximum: 4 },
		subsection: { type: 'string' },
		lede: str(L.lede),
		paragraphs: { type: 'array', minItems: L.paragraphs[0], maxItems: L.paragraphs[1], items: str(L.paragraph) },
		cites: { type: 'array', items: { type: 'string' }, description: 'slugs of items placed at THIS level in THIS subsection that the text names' },
		next: str(L.next)
	},
	required: ['level', 'subsection', 'lede', 'paragraphs', 'cites', 'next']
}

const FINDINGS = {
	type: 'object',
	properties: {
		findings: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					where: { type: 'string', description: '"lede", "paragraph N" (1-based), "cites" or "next"' },
					severity: { type: 'string', enum: ['wrong', 'misplaced', 'unclear', 'style'], description: 'wrong = a false or misleading claim; misplaced = an item, a door or a rule that is not this level\'s, this subsection\'s or the app\'s; unclear = true but a cook at this level would stumble; style = a house rule broken' },
					claim: { type: 'string', description: 'the words objected to, quoted' },
					because: { type: 'string', description: 'why, with the correct fact or the brief\'s own line' },
					fix: { type: 'string', description: 'replacement wording, no longer than what it replaces unless a fact demands it' }
				},
				required: ['where', 'severity', 'claim', 'because', 'fix']
			}
		}
	},
	required: ['findings']
}

const CORRECTED = {
	type: 'object',
	properties: {
		primer: PRIMER,
		dispositions: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					finding: { type: 'string', description: 'the finding key, copied exactly' },
					action: { type: 'string', enum: ['applied', 'rejected'] },
					reason: { type: 'string', description: 'one sentence: what was changed, or why the finding is mistaken' }
				},
				required: ['finding', 'action', 'reason']
			}
		}
	},
	required: ['primer', 'dispositions']
}

const CRITIC = {
	type: 'object',
	properties: {
		ok: { type: 'boolean' },
		problems: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					key: { type: 'string', description: 'the primer key, e.g. 2-techniques' },
					issue: { type: 'string' },
					fix: { type: 'string' }
				},
				required: ['key', 'issue', 'fix']
			}
		},
		notes: { type: 'string', description: 'anything for the operator: an item that seems placed at the wrong level, a door the level page should add, a subsection whose primer could not be written honestly' }
	},
	required: ['ok', 'problems', 'notes']
}

const range = (r) => `${r[0]} to ${r[1]}`
const RULES = `
THE PRIMERS are readers for THE WORLD TABLE's four levels (I Commis, II Chef de Partie, III Sous Chef, IV Chef: a kitchen brigade's ladder, and nothing is locked on it). A level page lists what is placed at that level in eight subsections (Dishes, Techniques, The Lexicon, The Floor Deck, The Plates, The Palate, Food Safety, Service) and opens the training doors; a primer is the page's missing voice: what this subsection asks at this level, what the items placed here have in common, in what order to take them and why, what to do with the doors, what "met" looks like, and one closing line on what the level above asks of the same subject. The reader is a cook or a server STANDING AT THIS LEVEL: smart, busy, reading on a phone between services.

A PRIMER:
- lede (${range(L.lede)} chars, one sentence): this subsection at this level in one line, the way a chef says it at pre-shift.
- paragraphs (aim ${range(A.paragraphs)}, at most ${L.paragraphs[1]}; ${range(A.words)} words altogether, never under ${L.words[0]} or over ${L.words[1]}; each ${range(L.paragraph)} chars): the reader. Name the items placed here BY THE NAMES THE BRIEF GIVES; group them by what they share; say what to take first and why; say plainly what "met" means for this subsection, in the brief's own words or a faithful paraphrase; point to the doors by their names. Where the brief gives an item's own text (a definition, a card's why, a standard's marks, a module's outcome), draw on it and never contradict it.
- cites (at least ${L.citesMin}, or every item when there are fewer): the slugs of items placed HERE that the text names. Every cite must be an item at THIS level in THIS subsection (the brief's "items", nothing else), and the text must carry its name (a plain plural is fine; for a long label with a colon, its head before the colon). Cite only what you name.
- next (${range(L.next)} chars, one to three sentences): what the level above asks of this subject, drawn from the brief's "neighbours.above" and nothing invented; for Chef, the top level, what keeps this subject sharp once it is met.

HARD RULES (a build gate refuses a primer that breaks one):
${B.rulesText || ''}1. No em dash and no en dash. Ranges are "5 to 6". Use a comma, a colon or a full stop.
2. American spelling (flavor, color, savory, caramelize; never colour, flavour, savour, centre, litre, fibre, mould, yoghurt, caramelise, tenderise, pasteurise).
3. Temperatures only as Celsius first with Fahrenheit in brackets and no degree sign: "82 C (180 F)". Prefer none.
4. No verdict on what a dish contains, is free from or is safe for: none of contains, free from, X-free, allergen, allergy, safe for, vegan, vegetarian, celiac, pregnant.
5. None of the banned substrings listed in the brief's "rules" (a food-safety curriculum the guide does not teach); the safety primers say what the guide states and what it names without stating, and never fill a gap with a figure or a rule of their own.
6. A level guides and never bars, and nothing here is scored: never unlock, locked, score, pass mark, percent, prerequisite, or "%".
7. The lede, every paragraph and the next line end in a full stop, a question mark or an exclamation mark. No double spaces.
8. Prose only: no bullet lists, no headings, no numbering at the start of a paragraph, no markdown, no quotation of whole definitions. Name a level by its name (Commis, Chef de Partie, Sous Chef, Chef), never a numeral: never "Level II", "L2" or "level two".
9. Be right. A wrong claim about a technique or a cut in a reader for cooks gets repeated at the pass. Where the brief's item text says one thing, say that thing; where you are not sure, check (search the web) or leave it out. Never present an item as placed at this level unless it is in the brief's "items".
10. Voice: plain and direct, second person where it helps ("take the omelette first"), no marketing, no filler, no restating the level's blurb, nothing the reader cannot act on.
`

const BRIEF = (p) => `
THE BRIEF is a JSON file on disk. READ IT FIRST, in full, with your file-reading tool: ${p.briefPath}
It holds: "level" and "subsection"; "standard" (the whole placement standard and "thisLevel", the paragraph that is this level's); "limits" and "aims"; "met" (what met means here, the app's one rule); "doors" (the training doors this subsection opens on the level page, by name) and "levelTest"; "items" (EVERY item placed at this level in this subsection, each with its slug, its name and its own text out of the app's data); "neighbours" (the names placed at the level below and above in this subsection); "otherSubsections" (the level's other subsections with their counts); for the palate, "palate" (the rung and the tastes); for safety, "sanitation" (the rule); "register" (the four level blurbs and two deck cards' why lines: the depth and plainness to match without copying); and "rules".
`

const LENSES = [
	{
		key: 'fact',
		title: 'CULINARY FACT',
		brief: 'You are a chef-instructor. Try to REFUTE every factual claim: about a technique, a cut, a sauce, a product, a fault and its levers, a service word, a plate. Check the order the primer recommends is sound for a cook at this level (a mother sauce before its child, a knife cut before the dish that needs it). Check nothing contradicts the brief\'s own text for an item (a definition, a card\'s why, a standard\'s marks, a module\'s outcome). Default to a finding when you are not sure and CHECK doubtful claims by searching the web.'
	},
	{
		key: 'app',
		title: 'THE APP\'S OWN DATA',
		brief: 'You are the build gate with eyes. Check every slug in "cites" is in the brief\'s "items" and that the text names it (its name, a plain plural, or the head of a long label before its colon). Check every item the text NAMES with a claim about it (a dish\'s semester or chapter, a technique\'s recipe count or standard, a card\'s gist, a module\'s outcome, a plate\'s count) matches the brief\'s detail for it. Check nothing is presented as placed at this level that is not in "items" (an item from the level above described as here is severity "misplaced"). Check the "next" line describes what "neighbours.above" actually holds and invents nothing. Check every door named exists in the brief\'s "doors" or "levelTest", and that "met" is described as the brief\'s "met" says and not otherwise. Check the count of items the text implies agrees with the brief.'
	},
	{
		key: 'voice',
		title: 'HOUSE RULES AND REGISTER',
		brief: 'You are the editor. Find every breach of the hard rules (a dash, a British spelling, a bare temperature or a degree sign, verdict language, a banned sanitation substring, unlock or score or percent language, a lede or paragraph or next line without a sentence stop, a double space, a bullet or a heading or a number opening a paragraph, "L2"). Count the words against the aims and the limits. Judge the register against the brief\'s samples: plain, direct, for a cook at this level; flag marketing, filler, exclamation for its own sake, a paragraph that restates the level blurb, a sentence the reader cannot act on, and any repetition inside the primer. Flag any claim about "the app" that is not one of the doors or the met rule.'
	}
]

const author = (p) =>
	agent(
		`${RULES}${BRIEF(p)}
YOU ARE THE AUTHOR of one primer: Level ${p.level} (${(B.levels.find((l) => l.n === p.level) || {}).name}), the subsection "${p.title}" (${p.subsection}), which holds ${p.count} item(s) at this level. Read the brief in full. Then write the primer through the schema, with level ${p.level} and subsection "${p.subsection}" copied exactly. Before you return, re-read it against the HARD RULES, count your words against the AIMS, and confirm every cite is a slug from the brief's "items" whose name appears in your text.`,
		{ label: `author:${p.key}`, phase: 'Author', schema: PRIMER, effort: 'high' }
	)

const refute = async (drafted, p) => {
	if (!drafted) return null
	const found = await parallel(
		LENSES.map((lens) => () =>
			agent(
				`${RULES}${BRIEF(p)}
YOU ARE A REFUTER. Your lens: ${lens.title}. ${lens.brief}

A finding says where ("lede", "paragraph N", "cites" or "next"), quotes the words objected to, gives the correct fact or the brief's own line, and offers replacement wording no longer than what it replaces unless a fact demands it. Do not report what is fine.

THE PRIMER (Level ${p.level}, ${p.title}):
${JSON.stringify(drafted, null, 1)}`,
				{ label: `refute:${lens.key}:${p.key}`, phase: 'Refute', schema: FINDINGS, effort: 'high' }
			).then((r) => ((r && r.findings) || []).map((f) => ({ ...f, lens: lens.key })))
		)
	)
	const findings = found
		.filter(Boolean)
		.flat()
		.map((f, n) => ({ ...f, key: `${p.key}-${f.lens}-${n + 1}`, primer: p.key }))
	return { primer: drafted, findings }
}

const correct = async (stage, p) => {
	if (!stage) return null
	if (!stage.findings.length) return { ...stage, dispositions: [] }
	const fixed = await agent(
		`${RULES}${BRIEF(p)}
YOU ARE THE CORRECTOR. Three refuters attacked this primer. Answer EVERY finding with a disposition: "applied" (you changed the text; say what) or "rejected" (the finding is mistaken; say why, with the fact or the brief's line). Reject only when you are sure: a finding of severity "wrong" or "misplaced" that you reject is escalated to a person. Apply the smallest change that answers the finding, keep every length inside its limits and near its aim, keep every cite a slug from the brief's "items" that the text names, and return the WHOLE primer, changed or not, plus one disposition per finding key.

FINDINGS:
${JSON.stringify(stage.findings, null, 1)}

THE PRIMER:
${JSON.stringify(stage.primer, null, 1)}`,
		{ label: `correct:${p.key}`, phase: 'Correct', schema: CORRECTED, effort: 'high' }
	)
	if (!fixed || !fixed.primer) {
		log(`${p.key}: the corrector returned nothing; keeping the draft and marking its findings undisposed`)
		return { ...stage, dispositions: [] }
	}
	return { primer: fixed.primer, findings: stage.findings, dispositions: fixed.dispositions || [] }
}

const groups = B.levels.map((l) => B.primers.filter((p) => p.level === l.n)).filter((g) => g.length)
log(`${B.primers.length} primer(s) to write across ${groups.length} level(s)`)

const perLevel = await pipeline(
	groups,
	async (group) => {
		const results = await pipeline(group, author, refute, correct)
		const done = results.map((r, i) => (r ? { ...r, key: group[i].key, spec: group[i] } : null)).filter(Boolean)
		if (done.length !== group.length) log(`Level ${group[0].level}: ${group.length - done.length} primer(s) died; re-run with --only for them`)
		return { level: group[0].level, done }
	},
	async (stage) => {
		if (!stage || !stage.done.length) return stage
		const lv = B.levels.find((l) => l.n === stage.level) || {}
		const primers = stage.done.map((d) => ({ key: d.key, briefPath: d.spec.briefPath, ...d.primer }))
		const critic = await agent(
			`${RULES}
YOU ARE THE CRITIC for Level ${stage.level} (${lv.name}). Read this level's primers TOGETHER, which no author or refuter did; each primer's brief is at the briefPath given with it, open any you need. Look for: the same point made in two or three primers (the danger zone explained in the dishes primer, the techniques primer and the safety primer); a contradiction between them (one says take the dishes first, another the techniques); a "next" line that describes the level above differently from another primer's; a reader that, put beside the others, would leave a cook at this level unsure where to start; an item named as this level's in one primer and as another level's in a second; any house rule the refuters missed. ok is true only if you found nothing. Each problem names the primer key and gives the fix. Keep repairs bounded: this is one pass, and a primer is rewritten only where you name a problem.

THE PRIMERS:
${JSON.stringify(primers, null, 1)}`,
			{ label: `critic:level-${stage.level}`, phase: 'Critic', schema: CRITIC, effort: 'high' }
		)
		let done = stage.done
		if (critic && critic.problems && critic.problems.length) {
			const keys = new Set(critic.problems.map((q) => q.key))
			const strays = critic.problems.filter((q) => !done.some((d) => d.key === q.key))
			if (strays.length) log(`Level ${stage.level}: the critic named ${strays.length} key(s) that are not this level's primers; left in critic.problems for the operator`)
			const repaired = await parallel(
				done
					.filter((d) => keys.has(d.key))
					.map((d) => () => {
						const asFindings = critic.problems
							.filter((q) => q.key === d.key)
							.map((q, n) => ({ key: `${d.key}-critic-${n + 1}`, primer: d.key, lens: 'critic', where: 'primer', severity: 'unclear', claim: q.issue, because: q.issue, fix: q.fix }))
						return agent(
							`${RULES}${BRIEF(d.spec)}
YOU ARE THE CORRECTOR, for the critic's read of the whole level. Answer every finding with a disposition and return the WHOLE primer. This is the one repair pass; keep every length inside its limits and every cite a slug from the brief's "items" that the text names.

FINDINGS:
${JSON.stringify(asFindings, null, 1)}

THE PRIMER:
${JSON.stringify(d.primer, null, 1)}`,
							{ label: `correct:critic:${d.key}`, phase: 'Critic', schema: CORRECTED, effort: 'high' }
						).then((fixed) => (fixed && fixed.primer ? { key: d.key, primer: fixed.primer, findings: asFindings, dispositions: fixed.dispositions || [] } : null))
					})
			)
			const byKey = new Map(repaired.filter(Boolean).map((r) => [r.key, r]))
			done = done.map((d) => {
				const r = byKey.get(d.key)
				return r ? { ...d, primer: r.primer, findings: [...d.findings, ...r.findings], dispositions: [...d.dispositions, ...r.dispositions] } : d
			})
		}
		return { level: stage.level, done, critic }
	}
)

const levels = perLevel.filter(Boolean)
const primers = levels.flatMap((l) => l.done.map((d) => ({ key: d.key, ...d.primer })))
const findings = levels.flatMap((l) => l.done.flatMap((d) => d.findings))
const dispositions = levels.flatMap((l) => l.done.flatMap((d) => d.dispositions))
const critics = Object.fromEntries(levels.map((l) => [String(l.level), l.critic]))
log(`${primers.length} primer(s), ${findings.length} finding(s), ${dispositions.filter((d) => d.action === 'rejected').length} rejected`)

return { primers, findings, dispositions, critics }
