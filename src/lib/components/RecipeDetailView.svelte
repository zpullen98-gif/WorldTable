<script lang="ts">
	import { base } from '$app/paths';
	import { formatTime } from '$lib/data';
	import { renderLine } from '$lib/scaling';
	import { prefs } from '$lib/stores/prefs.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { DIFFICULTY_LABEL } from '$lib/types';
	import Ornament from '$lib/components/Ornament.svelte';
	import CookMode from '$lib/components/CookMode.svelte';

	import type { Pairing, RecipeDetail, RecipeSummary, Substitution } from '$lib/types';

	let {
		summary,
		detail,
		pairing,
		substitutions
	}: {
		summary: RecipeSummary;
		detail: RecipeDetail;
		pairing: Pairing;
		substitutions: Substitution[];
	} = $props();

	const r = $derived(summary);
	const d = $derived(detail);

	let scale = $state(1);

	/**
	 * Substitutions, matched against the rendered ingredient text.
	 *
	 * The original attached these by walking the DOM after render (`attachSubs`,
	 * L3249) and re-attaching on every re-render. Here it is a derivation: no
	 * listeners to rebind, so it cannot go stale.
	 */
	const subFor = $derived.by(() => {
		const map = new Map<number, string>();
		d.ingredients.forEach((entry, i) => {
			if (entry.kind !== 'item') return;
			const lower = entry.text.toLowerCase();
			const hit = substitutions.find((s) => lower.includes(s.term.toLowerCase()));
			if (hit) map.set(i, hit.advice);
		});
		return map;
	});

	let openSub = $state<number | null>(null);

	const allergens = $derived.by(() => {
		const f = r.diet;
		const list: string[] = [];
		if (f.containsGluten) list.push('gluten');
		if (f.containsDairy) list.push('dairy');
		if (f.containsEgg) list.push('egg');
		if (f.containsNuts) list.push('nuts');
		if (f.containsFish) list.push('fish');
		if (f.containsShellfish) list.push('shellfish');
		if (f.containsAlcohol) list.push('alcohol');
		return list;
	});

	let cooking = $state(false);

	// Cook mode gets the steps as the reader has them set: scaled to the chosen
	// multiple and in the chosen units, not the raw corpus text.
	const cookSteps = $derived(
		d.steps.map((st) => ({ ...st, text: renderLine(st.text, scale, prefs.units) }))
	);

	const SCALES = [
		{ x: 0.5, label: '×½' },
		{ x: 1, label: '×1' },
		{ x: 2, label: '×2' },
		{ x: 3, label: '×3' }
	];
</script>

<svelte:head>
	<title>{r.name} — The World Table</title>
	<meta name="description" content={d.flavor.sentence} />
</svelte:head>

<article class="shell sheet">
	<nav class="crumbs" data-print="hide">
		<a href={base || '/'}>All chapters</a>
		<span aria-hidden="true">›</span>
		<a href="{base}/chapter/{r.chapterSlug}">{r.chapter}</a>
	</nav>

	<header class="head">
		<p class="eyebrow">{r.chapter} · {r.course}</p>
		<h1>{r.name}</h1>

		<ul class="stats">
			<li>{DIFFICULTY_LABEL[r.difficulty]}</li>
			<li>{formatTime(r.minutes)}</li>
			<li>Serves {r.serves * scale}</li>
			<li>{'$'.repeat(r.costTier)}</li>
			{#if r.diet.vegetarian}<li class="veg">Vegetarian</li>{/if}
			{#if r.diet.vegan}<li class="veg">Vegan</li>{/if}
		</ul>

		<p class="palate">
			<span class="tags">{d.flavor.tags.join(' · ')}</span>
			<span class="sentence">{d.flavor.sentence}</span>
		</p>
	</header>

	<div class="tools" data-print="hide">
		<div class="group" role="group" aria-label="Scale the recipe">
			{#each SCALES as s (s.x)}
				<button class:on={scale === s.x} onclick={() => (scale = s.x)}>{s.label}</button>
			{/each}
		</div>
		<div class="group" role="group" aria-label="Units">
			<button class:on={prefs.units === 'metric'} onclick={() => prefs.setUnits('metric')}
				>Metric</button
			>
			<button class:on={prefs.units === 'us'} onclick={() => prefs.setUnits('us')}>US</button>
		</div>
		<button class="chip" onclick={() => (cooking = true)}>Cook mode ▸</button>
		<button
			class="chip pin"
			class:on={session.isPinned(r.slug)}
			aria-pressed={session.isPinned(r.slug)}
			onclick={() => session.togglePin(r.slug)}
		>
			{session.isPinned(r.slug) ? '📌 On the menu' : '📌 Add to menu'}
		</button>
		<button class="chip" onclick={() => window.print()}>Print</button>
	</div>

	<div class="cols">
		<section>
			<h2 class="sec">Ingredients</h2>
			<ul class="ingredients">
				{#each d.ingredients as entry, i (i)}
					{#if entry.kind === 'section'}
						<li class="ingsec">{entry.label}</li>
					{:else}
						<li class="item">
							<span>{renderLine(entry.text, scale, prefs.units)}</span>
							{#if subFor.has(i)}
								<button
									class="subbtn"
									data-print="hide"
									aria-expanded={openSub === i}
									onclick={() => (openSub = openSub === i ? null : i)}
									title="Substitution">⇄</button
								>
								{#if openSub === i}
									<p class="sub">{subFor.get(i)}</p>
								{/if}
							{/if}
						</li>
					{/if}
				{/each}
			</ul>

			{#if d.equipment.length}
				<h2 class="sec">Equipment</h2>
				<p class="equip">{d.equipment.join(' · ')}</p>
			{/if}

			{#if allergens.length}
				<h2 class="sec">Contains</h2>
				<p class="equip">{allergens.join(' · ')}</p>
				{#if r.diet.confidence !== 'derived'}
					<p class="reviewed">Reviewed by hand</p>
				{/if}
			{/if}
		</section>

		<section>
			<h2 class="sec">Method</h2>
			<ol class="steps">
				{#each d.steps as step, i (i)}
					<li class="step">
						{renderLine(step.text, scale, prefs.units)}
						{#if step.durationSec}
							<span class="dur">{Math.round(step.durationSec / 60)} min</span>
						{/if}
					</li>
				{/each}
			</ol>
		</section>
	</div>

	<aside class="note recipe-note">
		<p class="eyebrow">From the pass</p>
		<p class="notebody">{d.note}</p>
	</aside>

	<section class="pairing">
		<Ornament seed={r.slug} />
		<h2 class="sec centered">At the Table</h2>
		<dl>
			<div><dt>The Pour</dt><dd>{pairing.pour}</dd></div>
			<div><dt>Also Right</dt><dd>{pairing.alt}</dd></div>
			{#if pairing.beer !== '—'}
				<div><dt>From the Taps</dt><dd>{pairing.beer}</dd></div>
			{/if}
			<div><dt>Zero-Proof</dt><dd>{pairing.zeroProof}</dd></div>
		</dl>
		<p class="why">{pairing.why}</p>
	</section>

	<section class="notes" data-print="hide">
		<label for="famnotes" class="sec">Family notes</label>
		<p class="hint">Saved on this device and kept across visits — export from My Menu to move them.</p>
		<textarea
			id="famnotes"
			rows="4"
			placeholder="Your adjustments, stains, and marginalia…"
			value={session.note(r.slug)}
			oninput={(e) => session.setNote(r.slug, e.currentTarget.value)}
		></textarea>
	</section>

	{#if cooking}
		<CookMode
			name={r.name}
			steps={cookSteps}
			onclose={() => (cooking = false)}
			onfinish={() => session.markCooked(r.slug)}
		/>
	{/if}

	<section class="films" data-print="hide">
		<h2 class="sec">Film school</h2>
		{#if d.films.dish}
			<a class="vrow" href={d.films.dish.url} target="_blank" rel="noopener">
				<span class="vlbl">{d.films.dish.label}</span>
				<span class="vsub">{d.films.dish.sub}</span>
			</a>
		{/if}
		<a class="vrow" href={d.films.search.url} target="_blank" rel="noopener">
			<span class="vlbl">{d.films.search.label}</span>
			<span class="vsub">{d.films.search.sub}</span>
		</a>
		{#each d.films.techniques as t (t.url)}
			<a class="vrow" href={t.url} target="_blank" rel="noopener">
				<span class="vlbl">{t.label}</span><span class="vsub">{t.sub}</span>
			</a>
		{/each}
		<a class="vrow" href={d.films.teacher.url} target="_blank" rel="noopener">
			<span class="vlbl">{d.films.teacher.label}</span>
			<span class="vsub">{d.films.teacher.sub}</span>
		</a>
	</section>
</article>

<style>
	.sheet {
		max-width: 860px;
		padding-top: 26px;
		padding-bottom: 80px;
	}

	.crumbs {
		display: flex;
		gap: 8px;
		font-size: var(--t-small);
		color: var(--muted);
		margin-bottom: 18px;
	}
	.crumbs a {
		color: var(--muted);
		text-decoration: none;
	}
	.crumbs a:hover {
		color: var(--turmeric-deep);
	}

	.head h1 {
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 700;
		margin: 6px 0 12px;
	}

	.stats {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		list-style: none;
		margin-bottom: 14px;
	}
	.stats li {
		border: 1px solid var(--line);
		padding: 3px 9px;
		border-radius: var(--radius);
		font-size: var(--t-small);
		color: var(--muted);
		font-variant-numeric: oldstyle-nums;
	}
	.stats li.veg {
		color: var(--leaf);
		border-color: var(--leaf);
	}

	.palate {
		border-top: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
		padding: 12px 0;
		margin-bottom: 20px;
	}
	.palate .tags {
		display: block;
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--turmeric-deep);
	}
	.palate .sentence {
		display: block;
		font-style: italic;
		color: var(--ink-soft);
		margin-top: 5px;
	}

	.tools {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-bottom: 26px;
	}
	.group {
		display: flex;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		overflow: hidden;
	}
	.group button {
		background: var(--card);
		border: 0;
		border-right: 1px solid var(--line);
		padding: 7px 12px;
		cursor: pointer;
		font-size: var(--t-small);
	}
	.group button:last-child {
		border-right: 0;
	}
	.group button.on {
		background: var(--ink);
		color: var(--card);
	}
	.chip {
		border: 1px solid var(--line);
		background: var(--card);
		padding: 7px 14px;
		border-radius: var(--radius);
		cursor: pointer;
		font-size: var(--t-small);
	}
	.chip:hover {
		border-color: var(--turmeric);
	}
	.chip.on {
		background: var(--turmeric);
		border-color: var(--turmeric);
		color: var(--paper);
	}

	.notes {
		margin-top: 30px;
	}
	.notes .hint {
		font-size: var(--t-micro);
		color: var(--muted);
		margin: -6px 0 8px;
		font-style: italic;
	}
	.notes textarea {
		width: 100%;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 10px 12px;
		resize: vertical;
		font-size: 15px;
		line-height: 1.55;
	}

	.cols {
		display: grid;
		grid-template-columns: 1fr 1.4fr;
		gap: 34px;
	}
	@media (max-width: 700px) {
		.cols {
			grid-template-columns: 1fr;
			gap: 22px;
		}
	}

	.sec {
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
		border-bottom: 1px solid var(--line);
		padding-bottom: 6px;
		margin: 0 0 12px;
		font-weight: 500;
	}
	.sec.centered {
		text-align: center;
		border: 0;
	}
	section + section .sec,
	.ingredients + .sec {
		margin-top: 26px;
	}

	.ingredients {
		list-style: none;
	}
	.ingredients .item {
		padding: 5px 0 5px 14px;
		position: relative;
		font-size: 15px;
	}
	.ingredients .item::before {
		content: '·';
		position: absolute;
		left: 2px;
		color: var(--turmeric-deep);
		font-weight: 700;
	}
	.ingsec {
		padding: 12px 0 3px;
		font-size: 9.5px;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		color: var(--turmeric-deep);
	}
	.ingsec:first-child {
		padding-top: 0;
	}

	.subbtn {
		background: none;
		border: 0;
		color: var(--turmeric-deep);
		cursor: pointer;
		font-size: 12px;
		padding: 0 4px;
	}
	.sub {
		font-style: italic;
		color: var(--muted);
		font-size: var(--t-small);
		border-left: 2px solid var(--line);
		padding: 4px 0 4px 10px;
		margin-top: 4px;
	}

	.equip {
		font-size: var(--t-small);
		color: var(--muted);
	}
	.reviewed {
		font-size: var(--t-micro);
		color: var(--turmeric-deep);
		font-style: italic;
		margin-top: 4px;
	}

	.steps {
		list-style: none;
		counter-reset: step;
	}
	.steps .step {
		counter-increment: step;
		padding: 8px 0 8px 36px;
		position: relative;
		font-size: 16px;
		line-height: 1.6;
	}
	.steps .step::before {
		content: counter(step, decimal-leading-zero);
		position: absolute;
		left: 0;
		top: 11px;
		font-size: var(--t-micro);
		color: var(--turmeric-deep);
		font-variant-numeric: lining-nums;
	}
	.dur {
		display: inline-block;
		margin-left: 6px;
		font-size: var(--t-micro);
		color: var(--muted);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 1px 6px;
		vertical-align: 2px;
	}

	.note {
		margin-top: 30px;
		border: 1px dashed var(--turmeric);
		background: color-mix(in srgb, var(--turmeric) 7%, transparent);
		padding: 16px 18px;
	}
	/* The drop cap is why the Phase 11 note backfill matters visually: an 80-char
	   one-liner cannot carry one, a 250-char paragraph can. */
	.notebody {
		margin-top: 6px;
		line-height: 1.65;
	}
	.notebody::first-letter {
		float: left;
		font-family: var(--display);
		font-size: 3.1em;
		line-height: 0.82;
		padding: 0.04em 0.09em 0 0;
		color: var(--turmeric-deep);
	}

	.pairing {
		margin-top: 34px;
		text-align: center;
	}
	.pairing dl {
		display: grid;
		gap: 3px;
		max-width: 460px;
		margin: 0 auto;
	}
	.pairing dl > div {
		display: flex;
		gap: 12px;
		align-items: baseline;
		justify-content: center;
	}
	.pairing dt {
		font-size: 9.5px;
		letter-spacing: 0.26em;
		text-transform: uppercase;
		color: var(--turmeric-deep);
		min-width: 96px;
		text-align: right;
	}
	.pairing dd {
		font-family: var(--display);
		font-size: 17px;
		text-align: left;
		flex: 1;
	}
	.why {
		font-style: italic;
		color: var(--muted);
		font-size: var(--t-small);
		border-top: 1px dotted var(--line);
		padding-top: 10px;
		margin: 12px auto 0;
		max-width: 60ch;
	}

	.films {
		margin-top: 34px;
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 14px 16px;
	}
	.films .sec {
		border: 0;
		margin-bottom: 6px;
	}
	.vrow {
		display: block;
		padding: 8px 2px;
		border-bottom: 1px solid var(--line);
		text-decoration: none;
	}
	.vrow:last-child {
		border-bottom: 0;
	}
	.vlbl {
		display: block;
		font-size: 14.5px;
	}
	.vlbl::after {
		content: ' ↗';
		font-size: 11px;
		color: var(--turmeric-deep);
	}
	.vrow:hover .vlbl {
		color: var(--turmeric);
	}
	.vsub {
		display: block;
		font-size: 12px;
		color: var(--muted);
		margin-top: 1px;
	}
</style>
