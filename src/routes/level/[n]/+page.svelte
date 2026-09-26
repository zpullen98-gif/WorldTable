<!--
  One level: its seven subsections at this level's difficulty, what each
  holds, how much of it is met, and the doors into training. The same shape
  in all three apps (the owner's decision, 2026-09-26): h1 with the numeral,
  the blurb, the level's word and figure, then an ordered list of
  subsections, each with "N at this level", its own word and figure, its
  items, and its `train` doors; last, the level test.

  Headings are h1 then h2 and nothing deeper: the item lists sit in a
  <details> whose summary is not a heading.

  The counts are baked in (the load); the items and the figures wait for the
  record (the levels store), the same rule the home follows. Names for the
  Lexicon, the deck and the modules come from three small precached files
  read in onMount; the dishes' from the eager index; the techniques' from
  the store, which already holds techniques.json for the join.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { bySlug, loadDeckIndex, loadLexicon, loadPalate, loadServiceTrack, loadStudy } from '$lib/data';
	import { levels } from '$lib/stores/levels.svelte';
	import { NEVER_GRADED, NUMERAL, type SubsectionProgress } from '$lib/levels';
	import type { DeckLevel, SubsectionKey } from '$lib/types';

	let { data } = $props();
	const n = $derived(data.level as DeckLevel);

	/** slug -> display name, for the subsections the eager index cannot name */
	let names = $state<Record<string, string>>({});
	/** dish slug -> the semester that teaches it, for the Read door */
	let semesterOf = $state<Record<string, number>>({});

	onMount(async () => {
		void levels.load();
		try {
			const [lexicon, deck, track, palate, study] = await Promise.all([
				loadLexicon(),
				loadDeckIndex(),
				loadServiceTrack(),
				loadPalate(),
				loadStudy()
			]);
			const map: Record<string, string> = {};
			for (const e of lexicon) map[e.slug] = e.term;
			for (const c of deck.cards) map[c.id] = c.term;
			for (const m of track.modules) map[m.key] = m.title;
			for (const f of palate.faults) map[f.slug] = f.label;
			names = map;
			const sem: Record<string, number> = {};
			for (const s of study) for (const slug of s.recipes) sem[slug] = s.n;
			semesterOf = sem;
		} catch {
			/* the page still lists the doors and the counts; names fall back to slugs */
		}
	});

	const row = $derived(levels.progress.find((r) => r.level === n) ?? null);
	const on = $derived(levels.ready && levels.current === n);

	const SAFETY_ID: Record<string, string> = { clause: 'disciplines', fact: 'entries', numeric: 'numbers', gap: 'gaps' };
	const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

	function nameOf(key: SubsectionKey, slug: string): string {
		switch (key) {
			case 'dishes':
				return bySlug.get(slug)?.name ?? slug;
			case 'techniques':
				return levels.techniqueLabel(slug);
			case 'safety':
				return levels.data?.safety[slug]?.label ?? slug;
			case 'palate': {
				const at = slug.indexOf('@');
				return at < 0 ? (names[slug] ?? cap(slug)) : `${cap(slug.slice(0, at))}, rung ${slug.slice(at + 1)}`;
			}
			default:
				return names[slug] ?? slug;
		}
	}

	function hrefOf(key: SubsectionKey, slug: string): string {
		switch (key) {
			case 'dishes':
				return `${base}/recipe/${slug}`;
			case 'techniques':
				return `${base}/technique/${slug}`;
			case 'lexicon':
				return `${base}/lexicon#${slug}`;
			case 'deck':
				return `${base}/service/deck/study?card=${slug}`;
			case 'palate':
				return slug.includes('@') ? `${base}/practise/calibrate` : `${base}/palate`;
			case 'safety':
				return `${base}/safety#${SAFETY_ID[levels.data?.safety[slug]?.kind ?? 'clause']}`;
			case 'service':
				return `${base}/service/${slug}`;
		}
	}

	/** The rows a subsection lists: its items, or for the palate its faults
	 *  and tastes together (the units), and for service its modules with the
	 *  count of their terms met. */
	function rowsOf(p: SubsectionProgress): Array<{ slug: string; met: boolean; note?: string }> {
		if (p.key === 'palate') return p.units.map((u) => ({ slug: u, met: p.metSet.has(u) }));
		if (p.key === 'service') {
			return p.items.map((m) => {
				const terms = levels.data?.moduleTerms[m] ?? [];
				const met = terms.filter((t) => p.metSet.has(t)).length;
				return { slug: m, met: terms.length > 0 && met === terms.length, note: `${met} of ${terms.length} met` };
			});
		}
		return p.items.map((s) => ({ slug: s, met: p.metSet.has(s) }));
	}

	const firstUnmet = (p: SubsectionProgress | null) => p?.items.find((s) => !p.metSet.has(s)) ?? p?.items[0] ?? null;
	/** The library's difficulty gate as a proxy for the level: Easy, Intermediate, then Advanced. */
	const difficulty = $derived(n === 1 ? 1 : n === 2 ? 2 : 3);
	const semesterDoor = (p: SubsectionProgress | null) => {
		const first = firstUnmet(p);
		const sem = first ? semesterOf[first] : undefined;
		return sem ? `${base}/study#semester-${sem}` : `${base}/study`;
	};
	const safetyDoor = (p: SubsectionProgress | null) => {
		const first = p?.items[0];
		const kind = first ? levels.data?.safety[first]?.kind : undefined;
		return kind ? `${base}/safety#${SAFETY_ID[kind]}` : `${base}/safety`;
	};
</script>

<svelte:head><title>Level {NUMERAL[n]}, {data.info.name} · The World Table</title></svelte:head>

<div class="shell view">
	<nav class="crumbs"><a href="{base}/">Home</a></nav>
	<h1><span class="lv-num">{NUMERAL[n]}</span> {data.info.name}</h1>
	<p class="lede">{data.info.blurb}</p>
	<p class="stat" aria-live="polite">
		{#if row}{row.label}{:else}Reading your record…{/if}{#if on}
			· <span class="lv-here">Your level</span>{/if}
	</p>

	<ol class="subsections">
		{#each data.subsections as s (s.key)}
			{@const p = row?.subsections.find((x) => x.key === s.key) ?? null}
			{@const total = data.counts[s.key]}
			<li class="subsection" id={s.key}>
				<h2>{s.title}</h2>
				<p class="line">
					{total} at this level
					{#if !s.counted}
						· {NEVER_GRADED}
					{:else if p}
						· {p.label}
					{/if}
				</p>

				{#if p && p.items.length}
					<details class="items">
						<summary>{s.key === 'service' ? 'The modules' : s.key === 'palate' ? 'The faults and the tastes' : 'The items'}</summary>
						<ul>
							{#each rowsOf(p) as r (r.slug)}
								<li>
									<a href={hrefOf(s.key, r.slug)}>{nameOf(s.key, r.slug)}</a>
									{#if r.note}<span class="note">{r.note}</span>{/if}
									{#if r.met}<span class="met">met</span>{/if}
								</li>
							{/each}
						</ul>
					</details>
				{/if}

				<div class="doors">
					{#if s.key === 'dishes'}
						<a class="train" href={semesterDoor(p)}>Read the semester</a>
						{#if firstUnmet(p)}<a class="train" href="{base}/recipe/{firstUnmet(p)}">Cook the next dish</a>{/if}
						<a class="train" href="{base}/recipes?diff={difficulty}">The library at this level</a>
					{:else if s.key === 'techniques'}
						<a class="train" href="{base}/technique?level={n}">Read the techniques</a>
						{#if firstUnmet(p)}<a class="train" href="{base}/technique/{firstUnmet(p)}">The next technique</a>{/if}
					{:else if s.key === 'lexicon'}
						<a class="train" href="{base}/lexicon?level={n}">Read the terms</a>
						<a class="train" href="{base}/lexicon?level={n}&start=flash">Flashcards</a>
						<a class="train" href="{base}/lexicon?level={n}&start=quiz">Quiz</a>
					{:else if s.key === 'deck'}
						<a class="train" href="{base}/service/deck/study?level={n}">Flip cards</a>
						<a class="train" href="{base}/service/deck/test?level={n}">The written test</a>
						<a class="train" href="{base}/service/deck/say?level={n}">Say it back</a>
						<a class="train" href="{base}/service/deck">The deck</a>
					{:else if s.key === 'palate'}
						<a class="train" href="{base}/palate">The repair table</a>
						<a class="train" href="{base}/practise/calibrate">Calibrate</a>
					{:else if s.key === 'safety'}
						<a class="train" href={safetyDoor(p)}>Read</a>
						<a class="train" href="{base}/safety">The whole page</a>
					{:else if s.key === 'service'}
						{#if p?.items[0]}<a class="train" href="{base}/service/{p.items[0]}">The first module</a>{/if}
						<a class="train" href="{base}/service">The track</a>
						<a class="train" href="{base}/service/drill?level={n}">Drill</a>
					{/if}
				</div>
			</li>
		{/each}
	</ol>

	<a class="leveltest" href="{base}/level/{n}/test">The Level {NUMERAL[n]} test</a>
</div>

<style>
	h1 {
		font-size: var(--t-h1);
		margin-bottom: 8px;
	}
	h1 .lv-num {
		color: var(--turmeric-deep);
		margin-right: 0.15em;
	}
	.crumbs {
		font-size: var(--t-small);
		margin-bottom: 8px;
	}
	.crumbs a {
		display: inline-block;
		padding-block: 10px;
		color: var(--muted);
	}
	.lede {
		font-size: var(--t-lede);
		color: var(--ink-soft);
		max-width: var(--measure);
	}
	.stat {
		margin-top: 8px;
		font-size: var(--t-small);
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.lv-here {
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		font-size: var(--t-micro);
		color: var(--turmeric-deep);
	}

	.subsections {
		list-style: none;
		margin: 24px 0 0;
		padding: 0;
	}
	.subsection {
		padding: 18px 0;
		border-top: 1px solid var(--line);
	}
	.subsection h2 {
		font-family: var(--display);
		font-size: var(--t-h3);
		margin-bottom: 4px;
	}
	.line {
		font-size: var(--t-small);
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.items {
		margin-top: 8px;
		max-width: var(--measure);
	}
	.items summary {
		cursor: pointer;
		min-height: 44px;
		display: flex;
		align-items: center;
		font-size: var(--t-small);
		color: var(--ink-soft);
	}
	.items ul {
		list-style: none;
		margin: 0;
		padding: 0 0 6px;
		columns: 2;
		column-gap: var(--gap);
	}
	.items li {
		break-inside: avoid;
		font-size: var(--t-small);
		line-height: 1.4;
	}
	.items li a {
		display: inline-block;
		padding-block: 8px;
		color: var(--ink);
		text-decoration-color: var(--line-strong);
		text-underline-offset: 3px;
	}
	.items .note {
		color: var(--muted);
		margin-left: 6px;
	}
	.met {
		margin-left: 6px;
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--leaf);
	}
	.doors {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 10px;
	}
	.train {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 0 14px;
		border: var(--rule) solid var(--line);
		border-radius: var(--radius);
		background: var(--card);
		color: var(--ink);
		text-decoration: none;
		font-size: var(--t-small);
	}
	.train:hover {
		border-color: var(--turmeric-deep);
	}
	.train:focus-visible,
	.leveltest:focus-visible {
		outline: 2px solid var(--turmeric-deep);
		outline-offset: 2px;
	}
	.leveltest {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 48px;
		margin-top: 20px;
		padding: 0 16px;
		border: var(--rule) solid var(--turmeric-deep);
		border-radius: var(--radius);
		background: var(--accent-solid);
		color: var(--on-accent);
		text-decoration: none;
		font-family: var(--display);
		font-size: var(--t-h4);
	}
	@media (max-width: 639px) {
		.items ul {
			columns: 1;
		}
	}
</style>
