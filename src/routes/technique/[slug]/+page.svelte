<script lang="ts">
	import { base } from '$app/paths';
	import { bySlug } from '$lib/data';
	import { session } from '$lib/stores/session.svelte';
	import RecipeCard from '$lib/components/RecipeCard.svelte';

	let { data } = $props();

	const t = $derived(data.technique);

	// Slugs resolve against the eager index rather than travelling in the
	// payload. filter(Boolean) because a technique is data and bySlug is data —
	// if they ever disagree the page should thin out, not throw.
	const list = $derived(t.recipes.map((s) => bySlug.get(s)).filter((r) => r !== undefined));

	// Grouped by chapter so the breadth is visible: seeing "Braising" run from
	// Korean to Cajun to Provençal is the argument for the page existing.
	const byChapter = $derived.by(() => {
		const m = new Map<string, typeof list>();
		for (const r of list) {
			if (!m.has(r.chapter)) m.set(r.chapter, []);
			m.get(r.chapter)!.push(r);
		}
		return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
	});

	const cooked = $derived(new Set(session.cookedLog.map((e) => e.slug)));
	const done = $derived(list.filter((r) => cooked.has(r.slug)).length);
</script>

<svelte:head><title>{t.label}: The World Table</title></svelte:head>

<div class="shell view">
	<nav class="crumbs" data-print="hide">
		<a href="{base}/technique">The Techniques</a> · <span>{t.label}</span>
	</nav>

	<header class="head">
		<p class="eyebrow">Technique</p>
		<h1>{t.label}</h1>
		<p class="progress" aria-live="polite">
			{list.length}
			{list.length === 1 ? 'dish' : 'dishes'} across {t.chapters}
			{t.chapters === 1 ? 'chapter' : 'chapters'} · {done} marked cooked
		</p>
	</header>

	<!--
		Everything below the header sits inside <article class="sheet">, matching
		/menu/quiz and /menu/costing. This is not styling: oot-locks.js masks
		`article.sheet > *:not(h1):not(.crumbs):not(header)` on a locked route,
		and a page with no sheet gives it nothing to make inert — the content is
		delivered in clear behind an overlay a reader can dismiss. This route is
		not in TABLE_FREE_ROUTES, so it is a locked route.
	-->
	<article class="sheet">

	{#if t.semesters.length}
		<p class="taught">
			On the Path of Study:
			<!-- Separator as an expression: a literal ", " inside an {#if} loses its
			     trailing space to Svelte's whitespace trimming. -->
			{#each t.semesters as s, i (s.n)}<a href="{base}/study">Semester {s.n} — {s.title}</a
				>{i < t.semesters.length - 1 ? ', ' : ''}{/each}
		</p>
	{/if}

	{#if t.definition}
		<section class="definition">
			<p class="eyebrow">From the Lexicon, {t.lexiconTerm}</p>
			<p class="body">{t.definition}</p>
			<a class="more" href="{base}/lexicon#{t.lexiconSlug}">Read it in the Lexicon →</a>
		</section>
	{/if}

	<section class="film" data-print="hide">
		{#if t.film}
			<a href={t.film} target="_blank" rel="noopener">
				<span class="lbl">★ A canon film, verified</span>
				<span class="sub">Watch this technique done properly</span>
			</a>
		{:else if t.query}
			<a
				href="https://www.youtube.com/results?search_query={encodeURIComponent(t.query)}"
				target="_blank"
				rel="noopener"
			>
				<span class="lbl">This technique, on camera</span>
				<span class="sub">Search films of {t.label.toLowerCase()}</span>
			</a>
		{/if}
	</section>

	{#each byChapter as [chapter, group] (chapter)}
		<h2 class="sec">{chapter}</h2>
		<ul class="grid">
			{#each group as r (r.slug)}
				<li class="slot">
					<RecipeCard recipe={r} />
					<button
						class="mark"
						data-print="hide"
						aria-pressed={cooked.has(r.slug)}
						aria-label="{cooked.has(r.slug) ? 'Cooked' : 'Mark as cooked'} — {r.name}"
						onclick={() => session.toggleCooked(r.slug)}
					>
						{cooked.has(r.slug) ? '✓' : '○'}
					</button>
				</li>
			{/each}
		</ul>
	{/each}
	</article>
</div>

<style>
	.crumbs {
		font-size: var(--t-micro);
		color: var(--muted);
		margin-bottom: 12px;
	}
	.head {
		margin-bottom: 20px;
	}
	.eyebrow {
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
	}
	h1 {
		font-size: var(--t-h1);
		margin: 4px 0 8px;
	}
	.progress {
		font-size: var(--t-small);
		color: var(--muted);
		font-variant-numeric: oldstyle-nums;
	}

	.definition {
		background: var(--paper-raised);
		border: 1px solid var(--line);
		border-left: 3px solid var(--turmeric);
		border-radius: var(--radius);
		padding: 16px 18px;
		margin-bottom: 18px;
	}
	.definition .body {
		margin-top: 8px;
		color: var(--ink-soft);
		max-width: var(--measure);
		line-height: 1.62;
	}
	.more {
		display: inline-block;
		margin-top: 10px;
		font-size: var(--t-small);
	}

	.film {
		margin-bottom: 22px;
	}
	.film a {
		display: block;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 10px 14px;
		text-decoration: none;
		color: inherit;
	}
	.film a:hover {
		border-color: var(--line-strong);
	}
	.film .lbl {
		display: block;
		font-size: var(--t-small);
	}
	.film .sub {
		display: block;
		font-size: var(--t-micro);
		color: var(--muted);
	}

	.sec {
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
		border-bottom: 1px solid var(--line);
		padding-bottom: 5px;
		margin: 24px 0 10px;
		font-weight: 500;
	}
	.grid {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
		gap: var(--gap);
		content-visibility: auto;
		contain-intrinsic-size: auto 200px;
	}

	.taught {
		font-size: var(--t-small);
		color: var(--muted);
		margin-bottom: 18px;
	}

	/* The card is one big link, so the cooked toggle sits above it rather than
	   inside it: a button nested in an anchor is invalid and unclickable. */
	.slot {
		position: relative;
	}
	.mark {
		position: absolute;
		top: 6px;
		right: 6px;
		z-index: 2;
		width: 30px;
		height: 30px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--paper-raised);
		color: var(--muted);
		font: inherit;
		font-size: var(--t-small);
		line-height: 1;
		cursor: pointer;
	}
	.mark:hover {
		border-color: var(--turmeric);
		color: var(--ink);
	}
	.mark[aria-pressed='true'] {
		color: var(--turmeric-deep);
		border-color: var(--turmeric);
	}
</style>
