<!--
  The Palate — taste, diagnose, correct.

  None of the content here is new. The guide has always carried "The Repair
  Table: Balancing a Dish" and "Tasting Vocabulary & Palate Training", and both
  have always been unreachable: crosslinks.mjs caps a lexicon term at three
  recipes, so the diagnostic chart every cook works from was filed beside 477
  other terms and surfaced next to a Filipino oxtail stew.

  This page is that chart, shaped for a cook holding a spoon. The eight faults
  and their levers are checked against the entry's own prose at build time —
  see tools/derive/palate.mjs — so the page cannot quietly drift from the guide.
-->
<script lang="ts">
	import { base } from '$app/paths';

	let { data } = $props();
	const p = $derived(data.palate);

	/* Open the fault you are actually tasting; the rest stay shut. A chart you
	   read at the pass wants one answer visible, not eight. Nothing is open at
	   first — the meta-rule says find the LOUDEST fault, and pre-opening one
	   would be the page making that call for you. */
	let open = $state<string | null>(null);
	const toggle = (slug: string) => (open = open === slug ? null : slug);
</script>

<svelte:head><title>The Palate — The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<h1>The Palate</h1>
		<p class="lede">
			A recipe tells you what to do; the palate tells you what you did. This is the guide's own
			repair table — taste the dish, name the loudest fault, and pull the gentlest lever that
			answers it.
		</p>
		<p class="rule">{p.metaRule}</p>
	</header>

	<h2 class="sec">The repair table</h2>
	<p class="secnote">
		Symptom first, then levers in order of gentleness. Work down a fault's list, not across —
		the first lever is the one that is usually right.
	</p>

	<ul class="faults">
		{#each p.faults as f (f.slug)}
			<li class="fault" class:open={open === f.slug}>
				<button
					class="faulthead"
					onclick={() => toggle(f.slug)}
					aria-expanded={open === f.slug}
					aria-controls="levers-{f.slug}"
				>
					<span class="faultlabel">{f.label}</span>
					<span class="symptom">{f.symptom}</span>
					<span class="chev" aria-hidden="true">{open === f.slug ? '−' : '+'}</span>
				</button>
				<div class="levers" id="levers-{f.slug}" hidden={open !== f.slug}>
					<ol>
						{#each f.levers as l, i (i)}
							<li>
								<b>{l.move}</b>
								<span>{l.note}</span>
							</li>
						{/each}
					</ol>
				</div>
			</li>
		{/each}
	</ul>

	<section class="training">
		<h2 class="sec">Training the palate</h2>
		<p class="secnote">
			The chart above only works on a palate that can name what it is tasting. This is the guide's
			protocol for building one.
		</p>
		<p class="prose">{p.protocol.definition}</p>
		<p class="source">
			From <a href="{base}/lexicon#{p.protocol.slug}">{p.protocol.term}</a> and
			<a href="{base}/lexicon#{p.repair.slug}">{p.repair.term}</a> in the Chef's Lexicon.
		</p>
	</section>
</div>

<style>
	.head {
		margin-bottom: 26px;
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
	/* The meta-rule is the one line worth reading if you read nothing else, so
	   it is set as a standing instruction rather than another paragraph. */
	.rule {
		margin-top: 14px;
		padding: 10px 14px;
		border-left: 2px solid var(--turmeric-deep);
		background: var(--paper-raised);
		color: var(--ink);
		max-width: var(--measure);
		font-size: var(--t-small);
		line-height: 1.5;
	}
	.sec {
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
		border-bottom: 1px solid var(--line);
		padding-bottom: 5px;
		margin: 30px 0 8px;
		font-weight: 500;
	}
	.secnote {
		color: var(--ink-soft);
		max-width: var(--measure);
		font-size: var(--t-small);
		margin-bottom: 14px;
	}

	.faults {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--line);
	}
	.fault {
		border-bottom: 1px solid var(--line);
	}
	.faulthead {
		display: flex;
		align-items: baseline;
		gap: 12px;
		width: 100%;
		padding: 13px 0;
		background: none;
		border: 0;
		text-align: left;
		cursor: pointer;
		color: var(--ink);
		font: inherit;
	}
	.faultlabel {
		flex: none;
		min-width: 5.5em;
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--turmeric-deep);
	}
	.symptom {
		flex: 1;
		color: var(--ink-soft);
		font-size: var(--t-small);
		line-height: 1.45;
	}
	.chev {
		flex: none;
		color: var(--muted);
		font-size: var(--t-body);
		line-height: 1;
	}
	.fault.open .symptom {
		color: var(--ink);
	}

	.levers ol {
		margin: 0 0 14px;
		padding-left: 1.4em;
	}
	.levers li {
		margin-bottom: 7px;
		line-height: 1.5;
	}
	.levers b {
		color: var(--ink);
	}
	.levers span {
		color: var(--ink-soft);
		font-size: var(--t-small);
	}

	.training {
		margin-top: 34px;
	}
	.prose {
		max-width: var(--measure);
		line-height: 1.65;
		color: var(--ink-soft);
	}
	.source {
		margin-top: 14px;
		font-size: var(--t-small);
		color: var(--muted);
	}
	.source a {
		color: var(--ink-soft);
	}
</style>
