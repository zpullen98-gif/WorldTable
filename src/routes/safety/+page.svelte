<!--
  Food Safety: the guide's two entries, carried whole, and its silences.

  This page is deliberately the SMALLEST feature on this branch, and it is the
  only one where that was the finding rather than the constraint. Five candidate
  per-recipe hazard rules were written and measured against the corpus, and all
  five were unshippable — the stated-temperature rule scored 0 of 12, the
  raw-protein rule flagged a hot-smoked salmon while missing carbonara, caesar,
  aioli, hollandaise and lox. A missed hazard is worse than ten false ones, and
  those rules miss in that direction. So there is no per-recipe flag here, and
  tools/derive/sanitation.mjs has a gate that refuses one.

  WHAT THIS PAGE MUST NEVER BECOME: a log, a checklist, a HACCP plan, a
  temperature record, or anything that saves. It imports no session store and
  writes nothing. A single-device, freely-editable, merge-importable record
  would be adopted as compliance evidence while being worthless as evidence.

  It also does not import renderLine or convertLine. The guide's own C/F pair
  disagrees with this app's converter — 4°C rounds to 39°F and the guide writes
  40°F — so safety strings are rendered exactly as written and never converted.
  src/lib/sanitation.test.ts asserts both halves of that.

  It does not print (data-print="hide" on the root, plus a print-only line): a
  printed sheet is the artifact most likely to be waved at an inspector.
-->
<script lang="ts">
	import { base } from '$app/paths';

	let { data } = $props();
	const s = $derived(data.sanitation);

	const fact = (key: string) => s.facts.find((f) => f.key === key)?.evidence ?? '';
	const numeric = (key: string) => s.numeric.find((n) => n.key === key);
	const clause = (key: string) => s.clauses.find((c) => c.key === key);
	const termOf = (anchor: string) => s.entries[anchor]?.term ?? '';
</script>

<svelte:head><title>Food Safety — The World Table</title></svelte:head>

<div class="shell view" data-print="hide">
	<header class="head">
		<h1>Food Safety</h1>
		<p class="lede">
			The guide's food-safety and inspections entries, carried whole. This is the guide's text — not
			law, not a code, and not a plan.
		</p>
	</header>

	<!-- Non-dismissible, and gated: if the jurisdiction clause ever leaves the
	     guide, the build fails rather than the page quietly losing its framing. -->
	<section class="framing">
		{#if s.framing}
			<p class="jurisdiction">
				<b>Your jurisdiction governs.</b>
				<i>“{s.framing.jurisdiction}”</i>
				<span class="attrib">— {termOf('inspections')}</span>
			</p>
		{/if}
		<p>
			Nothing here is saved. This is not a HACCP plan, a compliance record or an inspection log, and
			it does not train or certify anyone to any standard; food-handler certification is an
			accredited instrument and this is not one. Your written plan and your logs live elsewhere.
		</p>
	</section>

	<h2 class="sec">The numbers the guide states</h2>
	<p class="secnote">
		These are the figures the guide gives, attributed to the entry that gives them. Your local code
		may set different ones, and where it does, yours governs.
	</p>

	<dl class="numbers">
		{#each s.numeric as n (n.key)}
			<div>
				<dt>{n.label}</dt>
				<dd>
					<span class="fig">{n.evidence}</span>
					<span class="attrib">{termOf(n.anchor)}</span>
				</dd>
			</div>
		{/each}
	</dl>

	<p class="note">
		The temperatures above are printed exactly as the guide writes them and are never converted:
		this app's own converter renders {s.cf.lowC}°C as {s.cf.converted}°F, and the guide's pair says
		{s.cf.lowF}°F. Where a guide and a converter disagree about a safety number, neither is worth
		guessing at.
	</p>

	{#if s.conflict}
		<h2 class="sec">Where the guide disagrees with itself</h2>
		<p class="secnote">
			Two entries state two different danger windows. The guide does not reconcile them, and
			neither do we: picking a winner would be a safety judgement this app has no standing to make.
		</p>
		<ul class="conflict">
			<li>
				<span class="fig">{s.conflict.a.evidence}</span>
				<span class="attrib">— {s.conflict.a.term}</span>
			</li>
			<li>
				<span class="fig">{s.conflict.b.numbers[0]}–{s.conflict.b.numbers[1]}°C</span>
				<span class="attrib">{s.conflict.b.term}</span>
			</li>
		</ul>
	{/if}

	<h2 class="sec">The disciplines</h2>
	<p class="secnote">The guide's own words, unabridged.</p>
	<ul class="clauses">
		{#each s.clauses as c (c.anchor + c.key)}
			<li>
				<span class="ckey">{c.key}</span>
				<span class="ctext">{c.text}</span>
			</li>
		{/each}
	</ul>

	<h2 class="sec">The two entries, whole</h2>
	{#each ['safety', 'inspections'] as key (key)}
		{@const e = s.entries[key]}
		<article class="entry">
			<h3><a href="{base}/lexicon#{e.slug}">{e.term}</a></h3>
			<p>{e.definition}</p>
		</article>
	{/each}

	<!-- The section this whole feature turns on. The guide's silences are carried
	     as DATA and gated: each gap asserts both that the guide still names the
	     practice and that it still states no figure for it, so a later edit
	     cannot quietly fill one with invented regulatory content. -->
	<h2 class="sec">What the guide names and does not state</h2>
	<p class="secnote">
		Read this as a list of places to look elsewhere — your jurisdiction, your inspector, your
		written plan. It is not a list of things that do not matter.
	</p>
	<ul class="gaps">
		{#each s.gaps as g (g.key)}
			<li>
				<span class="gnamed">“{g.named}”</span>
				<span class="ggap">{g.gap}</span>
			</li>
		{/each}
	</ul>

	<p class="closing">
		Where the guide is silent it stays silent. <b
			>The absence of a warning on a dish is not a statement that the dish is safe.</b
		>
	</p>

	<p class="built">
		Built {__BUILD_DATE__}. This app works offline and cannot know when a food code changes, so it
		does not claim to be current.
	</p>
</div>

<p class="printonly">
	The World Table's food-safety page is not printed on purpose. It is the guide's text, not a
	compliance document, and a printed copy is the thing most likely to be mistaken for one.
</p>

<style>
	.head {
		margin-bottom: 22px;
	}
	h1 {
		font-size: var(--t-h1);
		margin-bottom: 8px;
	}
	.lede {
		font-size: var(--t-lede);
		color: var(--ink-soft);
		max-width: var(--measure);
	}
	.sec {
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
		border-bottom: 1px solid var(--line);
		padding-bottom: 5px;
		margin: 32px 0 10px;
		font-weight: 500;
	}
	.secnote,
	.note {
		color: var(--ink-soft);
		max-width: var(--measure);
		font-size: var(--t-small);
		line-height: 1.55;
		margin-bottom: 14px;
	}

	/* The framing is a block of standing text, not a dismissible banner. */
	.framing {
		border: 1px solid var(--line);
		border-left: 3px solid var(--turmeric-deep);
		background: var(--paper-raised);
		padding: 14px 16px;
		max-width: var(--measure);
	}
	.framing p {
		font-size: var(--t-small);
		line-height: 1.6;
		color: var(--ink);
	}
	.jurisdiction {
		margin-bottom: 10px;
	}
	.attrib {
		color: var(--muted);
		font-size: var(--t-small);
		white-space: nowrap;
	}

	.numbers {
		margin: 0;
	}
	.numbers div {
		padding: 9px 0;
		border-bottom: 1px dotted var(--line);
	}
	.numbers dt {
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
	}
	.numbers dd {
		margin: 4px 0 0;
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: baseline;
	}
	.fig {
		font-size: 18px;
		font-variant-numeric: tabular-nums;
		color: var(--ink);
	}

	.conflict,
	.clauses,
	.gaps {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.conflict li {
		display: flex;
		gap: 10px;
		align-items: baseline;
		padding: 7px 0;
		border-bottom: 1px dotted var(--line);
	}
	.clauses li,
	.gaps li {
		padding: 10px 0;
		border-bottom: 1px solid var(--line);
	}
	.ckey,
	.gnamed {
		display: block;
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--turmeric-deep);
		margin-bottom: 4px;
	}
	.gnamed {
		text-transform: none;
		letter-spacing: 0;
		font-style: italic;
		font-size: var(--t-small);
	}
	.ctext,
	.ggap {
		color: var(--ink-soft);
		font-size: var(--t-small);
		line-height: 1.55;
	}

	.entry {
		margin-bottom: 18px;
		max-width: var(--measure);
	}
	.entry h3 {
		font-size: 17px;
		margin-bottom: 5px;
	}
	.entry a {
		color: var(--ink);
	}
	.entry p {
		color: var(--ink-soft);
		line-height: 1.65;
		font-size: var(--t-small);
	}

	.closing {
		margin-top: 26px;
		padding: 12px 16px;
		border-left: 3px solid var(--turmeric-deep);
		background: var(--paper-raised);
		max-width: var(--measure);
		line-height: 1.6;
	}
	.built {
		margin-top: 18px;
		font-size: var(--t-small);
		color: var(--muted);
	}

	/* Screen-invisible, print-only: the page refuses to print its guidance and
	   says why on the sheet that comes out. */
	.printonly {
		display: none;
	}
	@media print {
		.printonly {
			display: block;
			padding: 24px;
			font-size: 12pt;
			line-height: 1.5;
		}
	}
</style>
