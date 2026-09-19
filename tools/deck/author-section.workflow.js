export const meta = {
	name: 'floor-deck-section',
	description: 'Write one section of the Floor Deck: authors draft the cards in small chunks, three refuters with different lenses attack every chunk, a corrector answers every finding, and a critic reads the whole section',
	phases: [
		{ title: 'Author', detail: 'cards drafted in chunks of eight or fewer, to the contract lengths' },
		{ title: 'Refute', detail: 'culinary fact, floor usability, safety and no-verdict: three lenses per chunk' },
		{ title: 'Correct', detail: 'every finding gets a disposition, applied or rejected with a reason' },
		{ title: 'Critic', detail: 'the whole section read for what is missing, with one bounded repair' }
	]
}

/* Run with the Workflow tool:
     scriptPath: a copy of this file inside the session's working directory
     args:       the JSON printed by  node tools/deck/brief.mjs <section>
   A workflow script has no filesystem, so the brief IS the contract as the
   agents see it: limits, aims, banned tokens, the roster with what the packet
   said and where it was wrong, candidate Lexicon and recipe links, exemplars.
   Write the returned object to tools/deck/out/<section>.json, then
     node tools/deck/validate.mjs --draft tools/deck/out/<section>.json --section <section>
     node tools/deck/merge.mjs <section> tools/deck/out/<section>.json            */

const B = args
const L = B.limits
const A = B.aims
const str = (r) => ({ type: 'string', minLength: r[0], maxLength: r[1] })

const CARD = {
	type: 'object',
	properties: {
		id: { type: 'string', description: 'the roster id, copied exactly' },
		term: { type: 'string', description: 'the roster term, copied exactly' },
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
		seeAlsoTerms: { type: 'array', maxItems: L.seeAlsoMax, items: { type: 'string' } },
		confusedWithTerms: { type: 'array', maxItems: L.confusedWithMax, items: { type: 'string' } },
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
					id: { type: 'string', description: 'the card id the finding is about, copied exactly, e.g. fd_0088. Never a term.' },
					field: { type: 'string', description: 'which field: gist, guest, why, madeWith, note, origin, pairs, notThis, line, say, aliases, traps, lexiconSlug, recipe, confusedWithTerms, or card' },
					severity: { type: 'string', enum: ['wrong', 'verdict', 'unclear', 'style'], description: 'wrong = a false or misleading claim; verdict = an assurance a guest could rely on; unclear = true but a new server would stumble; style = a house rule broken' },
					claim: { type: 'string', description: 'the words on the card you object to, quoted' },
					because: { type: 'string', description: 'why it is wrong, with the correct fact' },
					fix: { type: 'string', description: 'replacement wording, NO LONGER than what it replaces unless a safety fact demands it' }
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
				properties: {
					finding: { type: 'string', description: 'the finding key, copied exactly' },
					action: { type: 'string', enum: ['applied', 'rejected'] },
					reason: { type: 'string', description: 'one sentence: what was changed, or why the finding is mistaken' }
				},
				required: ['finding', 'action', 'reason']
			}
		}
	},
	required: ['cards', 'dispositions']
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
					id: { type: 'string' },
					issue: { type: 'string' },
					fix: { type: 'string' }
				},
				required: ['id', 'issue', 'fix']
			}
		},
		notes: { type: 'string', description: 'anything for the operator: a pair that should be linked across sections, a bench term worth promoting, a term whose card should be split' }
	},
	required: ['ok', 'problems', 'notes']
}

const range = (r) => `${r[0]} to ${r[1]}`
const RULES = `
THE FLOOR DECK is a staff-training flashcard deck for NEW RESTAURANT HIRES: servers, runners, bartenders in their first weeks. A card teaches one menu word. The reader is smart, busy and not a cook. They have to be able to SAY the guest line at a table tonight.

This section: "${B.section.title}". ${B.section.blurb}

A CARD, in the order its back shows the layers:
- gist (${range(L.gist)} chars, aim ${range(A.gist)}): ONE term-free line saying what the thing is. It is shown as an ANSWER OPTION under the term in a multiple-choice test, beside three wrong options, so (a) it must NOT contain the term, an alias, or any word listed for that card under mayNotAppearInGistOrTraps, (b) no closing full stop, (c) it must be distinguishable from its neighbours' gists: say what makes THIS one this one.
- guest (${range(L.guest)} chars, aim ${range(A.guest)}): THE GUEST LINE. What a server says aloud when a guest asks "what is that?". One or two plain sentences. No brackets, colons, semicolons, temperatures, Latin names or kitchen jargon. It may use the term. It should make the guest want it, honestly.
- why (${range(L.why)} chars, aim ${range(A.why)}): THE WHY. Mechanism first: how it is made or where it comes from, why it eats the way it does (texture, richness, flavor), and what to compare it to. This is what lets the server answer the second question.
- madeWith (1 to ${L.madeWithMax} items${B.section.madeWith === 'required' ? ', REQUIRED in this section' : ', optional in this section'}): the CLASSIC ingredients as lowercase ingredient NOUNS only ("egg yolk", "butter", "often garlic", "sometimes anchovy", "traditionally veal"). The app wraps them in a fixed sentence: "Classically made with ... Recipes vary. Confirm with the kitchen." Think of what a guest with an allergy would need flagged: egg, milk, butter, cream, wheat flour, nuts by name, shellfish by name, fish, soy, sesame, pork, alcohol, gelatin.
- note (optional, ${range(L.note)} chars): a REAL doneness, raw-service or handling fact where one exists (served raw; best at medium rare; a dark line in the flesh is normal). Omit it when there is nothing real to say: expect it on fewer than half the cards.
- CONTEXT, at least one of: origin (${range(L.origin)} chars, a label with no closing full stop: place, language, what the word means), pairs (${range(L.pairs)} chars, a label: classic partners on a plate), notThis (${range(L.notThis)} chars, a sentence: what it is NOT and how to tell). notThis is REQUIRED whenever confusedWithTerms is given.
- say (optional, ${range(L.say)} chars): a respelling of how an AMERICAN DINING ROOM says it, not IPA, not the native pronunciation. Key: ${B.respellingKey}. REQUIRED when the term has an accented letter or opens on an apostrophe; otherwise give it whenever a new hire would hesitate (guanciale, agnolotti, gastrique, bavette) and omit it for plain English words.
- aliases (optional, up to ${L.aliasesMax}): other names the SAME thing is sold under (Onglet for Hanger Steak; Calotte for Ribeye Cap). Never another card's term.
- line (optional, ${range(L.line)} chars, no closing full stop): a realistic MENU LINE that carries the term or an alias as written, e.g. "Grilled hanger steak, chimichurri, fries".
- confusedWithTerms (optional, up to ${L.confusedWithMax}): the TERMS of other cards on the roster (any section; see everyCard) that people genuinely mix this up with. seeAlsoTerms (optional, up to ${L.seeAlsoMax}): related cards that are not confusions. A term may not be in both.
- lexiconSlug (optional): ONLY a slug from that card's lexiconCandidates, and only when that entry really is the long-form essay on this same subject. If none fits, omit it. recipe (optional): ONLY a slug from recipeCandidates.
- traps (0 to ${L.trapsMax}): WRONG answers real people give, used ONLY as wrong options in the written test and never shown on a card. says (${range(L.trapSays)} chars, the SAME length band as gist so length is no tell; term-free like gist; no closing full stop) is a plausible, FALSE one-line description written in exactly the register of a gist. why (${range(L.trapWhy)} chars, a sentence) says why it is false. A trap must be false of THIS card and must not be a true description of another card on the roster (when the mistake is "people confuse it with X", use confusedWithTerms instead). Where a roster row carries knownPacketError, one trap MUST be that mistake. Aim for traps on about half the cards: write one where a real, common mistake exists and none where it does not.

HARD RULES (a build gate enforces every one; a card that breaks one is thrown back):
1. NO VERDICTS. Never say or imply what a dish CONTAINS, is FREE FROM, or is SAFE FOR; never the words: contains, containing, free from, free of, gluten-free (or any X-free), allergen, allergy, allergic, safe for, safe to, is safe, vegan, vegetarian, celiac, pregnant. A server repeats what a card says, and recipes vary by kitchen. Say what it "is made with" or "holds". The madeWith list is the only place ingredients-as-warnings live.
2. No em dash and no en dash anywhere. Ranges are "5 to 6". Use a comma, a colon or a full stop.
3. These substrings are banned anywhere in a card (they belong to a food-safety curriculum this app deliberately does not teach): ${B.banned.map((b) => JSON.stringify(b)).join(', ')}. Note "thaw" also catches thawed and thawing.
4. American spelling (flavor, color, savory, caramelize). Temperatures only as Celsius first with Fahrenheit in brackets and no degree sign: "82 C (180 F)", "71 to 82 C (160 to 180 F)"; never in the guest line.
5. guest, why, note, notThis and traps[].why end in a full stop. gist, origin, pairs, line and traps[].says do not.
6. The whole card's prose (gist + guest + why + note + origin + pairs + notThis + line) totals ${range(L.cardTotal)} characters, and the SECTION'S MEAN must stay at or under ${L.sectionMean}. Aim for the AIM ranges, not the ceilings: a card at every ceiling fails the section.
7. No two cards share a gist or a guest line. Copy id and term exactly from the roster.
8. Be right. A confident false statement on a training card gets repeated to guests for years. If you are not sure of a fact, check it (search the web) or leave it out. Prefer the specific and checkable over the impressive.
`

const EXEMPLARS = B.exemplars.length
	? `\nFINISHED CARDS from this deck, as the register and depth to match (do not copy their wording):\n${JSON.stringify(B.exemplars, null, 1)}\n`
	: ''
const EVERY = `\neveryCard (the full roster, for confusedWithTerms and seeAlsoTerms; use the term exactly as written):\n${B.everyCard.map((c) => `${c.term} [${c.section}]`).join('; ')}\n`

const chunk = (list, n) => { const out = []; for (let i = 0; i < list.length; i += n) out.push(list.slice(i, i + n)); return out }
const todo = B.roster.filter((r) => !r.written)
const chunks = chunk(todo, 8)
log(`${B.section.key}: ${todo.length} card(s) to write in ${chunks.length} chunk(s)`)

const LENSES = [
	{ key: 'fact', title: 'CULINARY FACT', brief: 'You are a chef-instructor and food scientist. Try to REFUTE every factual claim on every card: anatomy of cuts, species and families, origins and what foreign words mean, how things are made, what they taste like, what is classically in them. Default to a finding when you are not sure and CHECK doubtful claims by searching the web. For each roster row with knownPacketError, confirm the card states the truth AND that one trap carries exactly that mistake. Confirm every trap is FALSE of this card, that its "why" is TRUE, and that no trap is a true description of some other card on the roster. Check that lexiconSlug, if given, really is the long-form entry for this same subject (read its opening in lexiconCandidates), and that madeWith lists the genuinely classic ingredients and misses none a guest with an allergy would need flagged.' },
	{ key: 'floor', title: 'FLOOR USABILITY', brief: 'You are a veteran captain training a server on their third day. Read every GUEST LINE aloud in your head: would a nervous new hire be able to say it, and would a guest understand it and want the dish? Flag undefined jargon, anything that sounds read-off-a-card, anything that oversells, and any guest line that does not actually answer "what is that?". Check every "say" is how an American dining room really says the word and obeys the respelling key, and that a respelling is present wherever a new hire would hesitate. Check each gist could not be swapped with a neighbour\'s gist: if two gists in this chunk would both be accepted for the same term, that is a finding on both. Check "line" reads like a real menu.' },
	{ key: 'safety', title: 'SAFETY AND NO VERDICT', brief: 'You are the restaurant\'s allergy and food-safety lead. Find ANY sentence, in any field including traps, that a guest or server could take as an assurance: that something contains, lacks, is free from, or is safe or unsafe for anyone; any dietary label; any medical or pregnancy advice. Severity "verdict". Find any banned substring, any dash, any temperature not in the house form or with wrong arithmetic (F = C x 9/5 + 32, within 3 degrees). Find any MISSING real raw-service, undercooked or doneness fact that a server should be able to state plainly (served raw; cooked rare by default; small bones; shell fragments) and any madeWith list that omits a classic ingredient that matters to a guest with an allergy (egg in an emulsion, butter, flour in a roux-thickened sauce, nuts, shellfish, fish sauce, anchovy, soy, sesame, alcohol, gelatin). A missing safety fact may make the card longer; nothing else may.' }
]

const results = await pipeline(
	chunks,
	(rows, _o, i) =>
		agent(
			`${RULES}${EXEMPLARS}${EVERY}
YOU ARE AN AUTHOR. Write one card for EACH of these ${rows.length} roster rows, and only these. "thePacketSaid" is what a working server hand-wrote for the term in a real training packet: it shows the register a guest line should have, and where it is wrong it is your best trap. Do not trust it as fact.

${JSON.stringify(rows, null, 1)}

Return the cards through the schema. Before you return, re-read each card against the HARD RULES, count your lengths against the AIMS, and make sure each gist avoids every word listed for its card.`,
			{ label: `author:${B.section.key}:${i + 1}`, phase: 'Author', schema: CARDS, effort: 'high' }
		),
	async (drafted, rows, i) => {
		const cards = (drafted && drafted.cards) || []
		const ids = new Set(rows.map((r) => r.id))
		const found = await parallel(
			LENSES.map((lens) => () =>
				agent(
					`${RULES}
YOU ARE A REFUTER. Your lens: ${lens.title}. ${lens.brief}

A finding names the card by its ID (never by its term), quotes the words objected to, gives the correct fact, and offers replacement wording NO LONGER than what it replaces unless a safety fact demands it. Do not report what is fine. If a card is sound under your lens, report nothing for it.

The roster rows these cards were written from (with what the packet said, known packet errors, and candidate links):
${JSON.stringify(rows, null, 1)}

THE CARDS:
${JSON.stringify(cards, null, 1)}`,
					{ label: `refute:${lens.key}:${B.section.key}:${i + 1}`, phase: 'Refute', schema: FINDINGS, effort: 'high' }
				).then((r) => ((r && r.findings) || []).map((f) => ({ ...f, lens: lens.key })))
			)
		)
		const all = found.filter(Boolean).flat()
		const findings = []
		const unresolved = []
		all.forEach((f, n) => {
			const keyed = { ...f, key: `${B.section.key}-${i + 1}-${f.lens}-${n + 1}` }
			if (ids.has(f.id)) findings.push(keyed)
			else unresolved.push(keyed)
		})
		return { cards, findings, unresolved, rows }
	},
	async (stage, _rows, i) => {
		if (!stage) return null
		if (!stage.findings.length) return { ...stage, dispositions: [] }
		const fixed = await agent(
			`${RULES}
YOU ARE THE CORRECTOR. Three refuters attacked these cards. Answer EVERY finding with a disposition: "applied" (you changed the card; say what) or "rejected" (the finding is mistaken; say why, with the fact). Reject only when you are sure: a finding of severity "wrong" or "verdict" that you reject is escalated to a person. Apply the smallest change that answers the finding, keep every length inside its limits and near its aim, keep each gist free of the words listed for its card, and return ALL ${stage.cards.length} cards, changed or not, plus one disposition per finding key.

Roster rows:
${JSON.stringify(stage.rows, null, 1)}

FINDINGS:
${JSON.stringify(stage.findings, null, 1)}

THE CARDS:
${JSON.stringify(stage.cards, null, 1)}`,
			{ label: `correct:${B.section.key}:${i + 1}`, phase: 'Correct', schema: CORRECTED, effort: 'high' }
		)
		if (!fixed || !fixed.cards || fixed.cards.length !== stage.cards.length) {
			log(`chunk ${i + 1}: the corrector did not return every card; keeping the draft and marking its findings undisposed`)
			return { ...stage, dispositions: [] }
		}
		return { ...stage, cards: fixed.cards, dispositions: fixed.dispositions || [] }
	}
)

const done = results.filter(Boolean)
let cards = done.flatMap((r) => r.cards)
const findings = done.flatMap((r) => r.findings)
const dispositions = done.flatMap((r) => r.dispositions)
const unresolved = done.flatMap((r) => r.unresolved)
if (done.length !== chunks.length) log(`${chunks.length - done.length} chunk(s) died; their cards are NOT in the result. Re-run with --only for those ids`)
log(`${cards.length} card(s), ${findings.length} finding(s), ${dispositions.filter((d) => d.action === 'rejected').length} rejected, ${unresolved.length} unresolved`)

phase('Critic')
let critic = await agent(
	`${RULES}
YOU ARE THE COMPLETENESS CRITIC. Read the WHOLE section at once, which no author or refuter did. Look for: a roster row with no card; two gists or two guest lines that a reader could not tell apart; a pair of cards people genuinely confuse that is NOT linked with confusedWithTerms (in this section or, using everyCard, across sections); a knownPacketError with no matching trap; a term a new hire would mispronounce with no "say"; a card whose guest line does not answer "what is that?"; a section mean running long (the ceiling on the mean is ${L.sectionMean} characters of prose per card); any verdict language the refuters missed. ok is true only if you found nothing. Each problem names the card id and gives the fix.

Roster:
${JSON.stringify(B.roster.map((r) => ({ id: r.id, term: r.term, knownPacketError: r.knownPacketError })), null, 1)}
${EVERY}
THE SECTION:
${JSON.stringify(cards, null, 1)}`,
	{ label: `critic:${B.section.key}`, phase: 'Critic', schema: CRITIC, effort: 'high' }
)

if (critic && critic.problems && critic.problems.length) {
	const ids = new Set(critic.problems.map((p) => p.id))
	const affected = cards.filter((c) => ids.has(c.id))
	const strays = critic.problems.filter((p) => !cards.some((c) => c.id === p.id))
	if (strays.length) log(`the critic named ${strays.length} id(s) that are not cards in this section; they are in critic.problems for the operator`)
	if (affected.length) {
		const asFindings = critic.problems
			.filter((p) => affected.some((c) => c.id === p.id))
			.map((p, n) => ({ key: `${B.section.key}-critic-${n + 1}`, id: p.id, lens: 'critic', field: 'card', severity: 'unclear', claim: p.issue, because: p.issue, fix: p.fix }))
		const fixed = await agent(
			`${RULES}${EVERY}
YOU ARE THE CORRECTOR, for the critic's read of the whole section. Answer every finding with a disposition and return ALL ${affected.length} of these cards. This is the one repair pass; keep every length inside its limits.

FINDINGS:
${JSON.stringify(asFindings, null, 1)}

THE CARDS:
${JSON.stringify(affected, null, 1)}`,
			{ label: `correct:critic:${B.section.key}`, phase: 'Critic', schema: CORRECTED, effort: 'high' }
		)
		if (fixed && fixed.cards && fixed.cards.length === affected.length) {
			const byId = new Map(fixed.cards.map((c) => [c.id, c]))
			cards = cards.map((c) => byId.get(c.id) || c)
			findings.push(...asFindings)
			dispositions.push(...(fixed.dispositions || []))
		} else log('the critic repair did not return every card; the section is returned as it stood, with the critic\'s problems for the operator')
	}
}

return { section: B.section.key, cards, findings, dispositions, unresolved, critic }
