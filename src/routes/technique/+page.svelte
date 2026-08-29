<script lang="ts">
	import { base } from '$app/paths';

	let { data } = $props();

	// Anchored techniques carry a Lexicon definition; the rest are the guide's
	// particulars: a shaping, a vessel, one dish's one move. Both are worth a
	// page, but they are not the same kind of thing and shouldn't be one list.
	const foundations = $derived(
		data.techniques.filter((t) => t.anchored).sort((a, b) => b.count - a.count)
	);
	const particulars = $derived(
		data.techniques.filter((t) => !t.anchored).sort((a, b) => b.count - a.count)
	);
</script>

<svelte:head><title>The Techniques · The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<h1>The Techniques</h1>
		<p class="lede">
			The guide read sideways. Every dish here is filed by cuisine and by course, but a cook does
			not level up a cuisine at a time; they level up a skill at a time. These are the skills,
			each with every recipe in the guide that demonstrates it.
		</p>
		<p class="progress">
			{data.techniques.length} skills · {data.tagged} of 970 dishes carry at least one
		</p>
	</header>

	<h2 class="sec">The foundations</h2>
	<p class="secnote">
		The moves the whole guide is built on. Each one carries its Lexicon definition, the
		<i>why</i> underneath the what.
	</p>
	<ul class="grid">
		{#each foundations as t (t.slug)}
			<li>
				<a class="tile" href="{base}/technique/{t.slug}">
					<h3>{t.label}</h3>
					<p class="meta">{t.count} dishes · {t.chapters} chapters</p>
					{#if t.lexiconTerm}<p class="anchor">{t.lexiconTerm}</p>{/if}
				</a>
			</li>
		{/each}
	</ul>

	<h2 class="sec">The particulars</h2>
	<p class="secnote">
		One shaping, one vessel, one kitchen's answer to one problem. Narrower, and often the reason a
		dish is worth cooking at all.
	</p>
	<ul class="grid">
		{#each particulars as t (t.slug)}
			<li>
				<a class="tile" href="{base}/technique/{t.slug}">
					<h3>{t.label}</h3>
					<p class="meta">{t.count} dishes · {t.chapters} chapters</p>
				</a>
			</li>
		{/each}
	</ul>
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
	.progress {
		margin-top: 10px;
		font-size: var(--t-small);
		color: var(--muted);
		font-variant-numeric: oldstyle-nums;
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

	.grid {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: var(--gap);
	}
	.tile {
		display: block;
		height: 100%;
		text-decoration: none;
		color: inherit;
		background: var(--card);
		border: 1px solid var(--line);
		border-left: 3px solid var(--turmeric);
		border-radius: var(--radius);
		padding: 12px 14px;
	}
	.tile:hover {
		border-color: var(--line-strong);
		border-left-color: var(--turmeric-deep);
		box-shadow: var(--shadow-lift);
	}
	.tile h3 {
		font-size: var(--t-h4);
		margin: 0 0 4px;
		line-height: 1.15;
	}
	.meta {
		font-size: var(--t-micro);
		color: var(--muted);
		font-variant-numeric: oldstyle-nums;
	}
	.anchor {
		margin-top: 6px;
		font-size: var(--t-micro);
		/* --turmeric-deep, not --turmeric: the day token is darkened to clear
		   AA on tinted paper, which plain --turmeric does not (3.6:1). */
		color: var(--turmeric-deep);
		font-style: italic;
	}
</style>
