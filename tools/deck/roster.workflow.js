export const meta = {
	name: 'floor-deck-roster',
	description: 'Decide which words the Floor Deck gains at Levels III and IV: a proposer per section, a challenger from the floor, a reconciler, and one critic across the deck',
	phases: [
		{ title: 'Propose', detail: 'two to four Level III or IV words per section, with the reason and the menu line' },
		{ title: 'Challenge', detail: 'from the floor: is it on menus, is it already taught, is it really III or IV' },
		{ title: 'Reconcile', detail: 'every challenge answered, the section\'s list settled' },
		{ title: 'Critic', detail: 'the whole roster read for duplicates across sections and for balance' }
	]
}

/* Run with the Workflow tool:
     scriptPath: a copy of this file inside the session's working directory
     args:       the JSON printed by  node tools/deck/roster-brief.mjs
   Then node tools/deck/add-stubs.mjs <the run's output file> writes the
   stubs, and the ordinary section procedure (mint, brief, write, take,
   validate, merge) takes over.                                            */

const B = args
const A = B.aims

const PROPOSALS = {
	type: 'object',
	properties: {
		proposals: {
			type: 'array',
			maxItems: 6,
			items: {
				type: 'object',
				properties: {
					term: { type: 'string', description: 'Title Case, as a menu prints it' },
					level: { type: 'integer', minimum: 3, maximum: 4 },
					reason: { type: 'string', description: 'why this word, at this level, by the standard' },
					guestsAsk: { type: 'string', description: 'the question a guest actually asks about it' },
					menuLine: { type: 'string', description: 'a realistic menu line carrying the word' },
					lexiconSlug: { type: 'string', description: 'a candidate slug from the brief when the Lexicon already has the entry, else omitted' }
				},
				required: ['term', 'level', 'reason', 'guestsAsk', 'menuLine']
			}
		},
		note: { type: 'string', description: 'why fewer than two, if fewer; or anything for the operator' }
	},
	required: ['proposals', 'note']
}
const CHALLENGES = {
	type: 'object',
	properties: {
		challenges: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					term: { type: 'string' },
					verdict: { type: 'string', enum: ['drop', 'move', 'rename'], description: 'drop = not a deck word or already taught; move = right word, wrong level; rename = right word, the menu spells it otherwise' },
					level: { type: 'integer', minimum: 1, maximum: 4 },
					to: { type: 'string', description: 'for rename: the spelling' },
					because: { type: 'string' }
				},
				required: ['term', 'verdict', 'because']
			}
		},
		missing: { type: 'array', items: { type: 'string' }, description: 'words the proposer should have proposed and did not, with the level in brackets' }
	},
	required: ['challenges', 'missing']
}
const RECONCILED = {
	type: 'object',
	properties: {
		proposals: PROPOSALS.properties.proposals,
		dispositions: { type: 'array', items: { type: 'object', properties: { term: { type: 'string' }, action: { type: 'string', enum: ['accepted', 'rejected'] }, reason: { type: 'string' } }, required: ['term', 'action', 'reason'] } }
	},
	required: ['proposals', 'dispositions']
}
const CRITIC = {
	type: 'object',
	properties: {
		ok: { type: 'boolean' },
		drop: { type: 'array', items: { type: 'object', properties: { section: { type: 'string' }, term: { type: 'string' }, because: { type: 'string' } }, required: ['section', 'term', 'because'] } },
		move: { type: 'array', items: { type: 'object', properties: { section: { type: 'string' }, term: { type: 'string' }, level: { type: 'integer', minimum: 3, maximum: 4 }, because: { type: 'string' } }, required: ['section', 'term', 'level', 'because'] } },
		notes: { type: 'string' }
	},
	required: ['ok', 'drop', 'move', 'notes']
}

const RULES = `
THE FLOOR DECK is a staff-training flashcard deck of menu words for new restaurant hires: servers, runners, bartenders. It holds 281 cards in fourteen sections at four brigade levels (1 Commis, 2 Chef de Partie, 3 Sous Chef, 4 Chef), guided and never locked. At the first placement Level IV held exactly the fourteen cards the floor asks for, and five sections held no Level IV card at all. This roster decides which words the deck GAINS at Levels III and IV.

${A.rule}

A proposal names the word as a menu prints it, the level (3 or 4) by the standard in the brief, the reason, the question a guest actually asks about it, a realistic menu line, and the Lexicon slug when the brief's candidates already hold the entry. It must not be a word the deck already teaches under any term or alias (search "everyCard"), and not a spelling variant of one. It must belong to THIS section (its blurb says what the section holds).
`
const BRIEF = (s) => `
THE BRIEF is a JSON file on disk. READ IT FIRST, in full, with your file-reading tool: ${s.briefPath}
It holds: "section" (key, title, blurb); "cards" (every card this section holds, with its level, aliases and gist); "levelCounts"; "levels"; "standard" (the level standard, the owner's words); "aims"; "candidates" (the Lexicon's Level III and IV terms with no card, any section: a candidate is a hint, never a requirement, and many belong to no section); "everyCard" (the whole deck: id, term, section, level, aliases).
`

const results = await pipeline(
	B.sections,
	(s) =>
		agent(
			`${RULES}${BRIEF(s)}
YOU ARE THE PROPOSER for the section "${s.title}" (${s.key}), which holds ${s.cards} cards, ${s.atIII} at Level III and ${s.atIV} at Level IV. Propose ${A.perSection[0]} to ${A.perSection[1]} words at Level 3 or 4, or fewer with a note saying why the section honestly has no more. Think of the menus of good and fine-dining American restaurants today and the words on them a new server is asked about.`,
			{ label: `propose:${s.key}`, phase: 'Propose', schema: PROPOSALS, effort: 'high' }
		),
	async (proposed, s) => {
		if (!proposed) return null
		const ch = await agent(
			`${RULES}${BRIEF(s)}
YOU ARE THE CHALLENGER, a captain who has trained servers for twenty years. For each proposal below ask: is this word actually on menus and asked about, or is it a cook's word or a book's word (drop)? Does the deck already teach it under another term or an alias, in this section or any other (drop, and name the card)? Is it really Level III or IV by the standard, or would a Level II server meet it every week (move, with the level)? Is the spelling the one menus print (rename)? Then name the words the proposer MISSED that this section should teach at III or IV. Do not report what is right.

THE PROPOSALS:
${JSON.stringify(proposed.proposals, null, 1)}`,
			{ label: `challenge:${s.key}`, phase: 'Challenge', schema: CHALLENGES, effort: 'high' }
		)
		return { proposed, challenges: (ch && ch.challenges) || [], missing: (ch && ch.missing) || [] }
	},
	async (stage, s) => {
		if (!stage) return null
		if (!stage.challenges.length && !stage.missing.length) return { key: s.key, proposals: stage.proposed.proposals, dispositions: [], challenges: [], missing: [], note: stage.proposed.note }
		const rec = await agent(
			`${RULES}${BRIEF(s)}
YOU ARE THE RECONCILER. A proposer named words for "${s.title}" and a challenger argued some and named some missing. Answer EVERY challenge and every missing word with a disposition ("accepted": you dropped, moved, renamed or added; "rejected": say why the proposal stands or the missing word does not belong). Return the section's final list, ${A.perSection[0]} to ${A.perSection[1]} words at Level 3 or 4 unless the section honestly has fewer, each complete (term, level, reason, guestsAsk, menuLine, lexiconSlug where the brief has it).

THE PROPOSALS:
${JSON.stringify(stage.proposed.proposals, null, 1)}

THE CHALLENGES:
${JSON.stringify(stage.challenges, null, 1)}

MISSING, per the challenger:
${JSON.stringify(stage.missing, null, 1)}`,
			{ label: `reconcile:${s.key}`, phase: 'Reconcile', schema: RECONCILED, effort: 'high' }
		)
		if (!rec || !rec.proposals) return { key: s.key, proposals: stage.proposed.proposals, dispositions: [], challenges: stage.challenges, missing: stage.missing, note: 'the reconciler returned nothing; the proposer\'s list stands' }
		return { key: s.key, proposals: rec.proposals, dispositions: rec.dispositions || [], challenges: stage.challenges, missing: stage.missing, note: stage.proposed.note }
	}
)

let sections = results.filter(Boolean)
const total = sections.reduce((n, s) => n + s.proposals.length, 0)
log(`${total} word(s) proposed across ${sections.length} section(s)`)

phase('Critic')
const critic = await agent(
	`${RULES}
YOU ARE THE CRITIC. Read the whole roster below, which no proposer saw. Drop a word proposed in two sections (keep the one whose section blurb fits), a word that duplicates a card in "everyCard" of any section's brief (open ${B.sections[0].briefPath} for the whole deck), or a word no menu prints. Move a word whose level is wrong by the standard. Then judge the balance: the deck's Level IV should gain enough that it stands above its floor of fourteen with margin, and every section should gain at least one word where it honestly can. ok is true only if you found nothing.

THE ROSTER:
${JSON.stringify(sections.map((s) => ({ section: s.key, proposals: s.proposals.map((p) => ({ term: p.term, level: p.level, reason: p.reason })) })), null, 1)}`,
	{ label: 'critic:roster', phase: 'Critic', schema: CRITIC, effort: 'high' }
)
if (critic) {
	const dropKey = new Set((critic.drop || []).map((d) => `${d.section}|${d.term.toLowerCase()}`))
	const moveKey = new Map((critic.move || []).map((m) => [`${m.section}|${m.term.toLowerCase()}`, m.level]))
	sections = sections.map((s) => ({
		...s,
		proposals: s.proposals
			.filter((p) => !dropKey.has(`${s.key}|${p.term.toLowerCase()}`))
			.map((p) => (moveKey.has(`${s.key}|${p.term.toLowerCase()}`) ? { ...p, level: moveKey.get(`${s.key}|${p.term.toLowerCase()}`), movedByCritic: true } : p))
	}))
	log(`critic: ${(critic.drop || []).length} dropped, ${(critic.move || []).length} moved`)
}

const final = sections.reduce((n, s) => n + s.proposals.length, 0)
const atIV = sections.reduce((n, s) => n + s.proposals.filter((p) => p.level === 4).length, 0)
log(`${final} word(s) in the roster, ${atIV} at Level IV`)
return { sections, critic }
