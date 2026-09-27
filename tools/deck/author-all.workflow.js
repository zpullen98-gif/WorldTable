export const meta = {
	name: 'floor-deck-expansion',
	description: 'Write the expansion cards of every section at once: one floor-deck-section run per section, in parallel, each with its own authors, refuters, corrector and critic',
	phases: [{ title: 'Sections', detail: 'author-section.workflow.js per section, as a child workflow' }]
}

/* Run with the Workflow tool:
     scriptPath: a copy of this file inside the session's working directory
     args:       { childPath: <a copy of author-section.workflow.js inside the
                   session's working directory>,
                   shared: { limits, aims, banned, respellingKey } (once, merged
                   into every section's args so the call stays small),
                   sections: [{ key, args: <node tools/deck/brief.mjs key, minus
                   the shared keys> }] }
   Then node tools/deck/split-run.mjs <the run's output file> writes one
   tools/deck/out/run.<section>.json per section for take.mjs.            */

const B = args
log(`${B.sections.length} section(s), ${B.sections.reduce((n, s) => n + s.args.todo.length, 0)} card(s) to write`)
const results = await parallel(
	B.sections.map((s) => () =>
		workflow({ scriptPath: B.childPath }, { ...(B.shared || {}), ...s.args })
			.then((r) => ({ key: s.key, result: r }))
			.catch((e) => {
				log(`${s.key}: the section run failed: ${e && e.message ? e.message : e}`)
				return { key: s.key, result: null }
			})
	)
)
const done = results.filter(Boolean)
log(`${done.filter((r) => r.result && r.result.cards).length} of ${B.sections.length} section(s) returned cards`)
return { sections: done }
