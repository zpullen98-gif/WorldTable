<script lang="ts">
	import { base } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { loadFloorDeck, loadLexicon } from '$lib/data';
	import { foundationsCategories, foundationsEntries, foundationEntryById, foundationLogKey, foundationsPractice, resolveFoundation } from '$lib/foundations';
	import { nav } from '$lib/stores/nav.svelte';
	import { session } from '$lib/stores/session.svelte';
	import Ornament from '$lib/components/Ornament.svelte';
	import FoundationReading from '$lib/components/FoundationReading.svelte';
	import type { FloorDeck, LexiconEntry } from '$lib/types';

	let deck = $state<FloorDeck | null>(null);
	let lexicon = $state<LexiconEntry[] | null>(null);
	let loading = $state(false);
	let mounted = $state(false);
	let loadFailed = $state(false);
	let q = $state('');
	let category = $state('');
	let selected = $state('');
	const fold = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
	async function load() {
		loading = true;
		loadFailed = false;
		try { [deck, lexicon] = await Promise.all([loadFloorDeck(), loadLexicon()]); }
		catch { loadFailed = true; }
		finally { loading = false; }
	}
	onMount(() => { mounted = true; void load(); });
	afterNavigate(() => {
		const params = new URLSearchParams(location.search);
		q = params.get('q') ?? '';
		category = foundationsCategories.some(c => c.id === params.get('category')) ? params.get('category')! : '';
		selected = params.get('term') ?? '';
	});
	const entry = $derived(foundationEntryById.get(selected));
	const reading = $derived(entry ? resolveFoundation(entry, deck ?? undefined, lexicon ?? undefined) : null);
	const ready = $derived(!!deck && !!lexicon);
	const query = $derived(fold(q));
	const filtered = $derived(foundationsEntries.filter(e => (!category || e.category === category) && (!query || fold([e.term, ...(e.aliases ?? [])].join(' ')).includes(query))));
	const groups = $derived(foundationsCategories.map(c => ({ ...c, entries: filtered.filter(e => e.category === c.id) })).filter(c => c.entries.length));
	const practiceCount = $derived(foundationsPractice(session.drillLog, Date.now()).length);
	const lastByKey = $derived.by(() => {
		const map = new Map<string, { at: number; grade?: string }>();
		const now = Date.now();
		for (const event of session.drillLog) {
			if (!Number.isFinite(event.at) || event.at > now) continue;
			if (!map.has(event.slug) || map.get(event.slug)!.at <= event.at) map.set(event.slug, event);
		}
		return map;
	});
	const status = (e: typeof foundationsEntries[number]) => {
		const last = session.ready ? lastByKey.get(foundationLogKey(e)) : undefined;
		return !session.ready ? '' : !last ? 'Not practised yet' : last.grade === 'missed' ? 'Practise again' : 'Practised';
	};
	function href(term = '') {
		const params = new URLSearchParams();
		if (category) params.set('category', category);
		if (q.trim()) params.set('q', q.trim());
		if (term) params.set('term', term);
		return `${base}/foundations${params.size ? '?' + params : ''}`;
	}
	function filter() { selected = ''; nav.replaceShallow(href(), {}); }
	function choose(id: string) { category = id; filter(); }
	const categoryTitle = (id: string) => foundationsCategories.find(c => c.id === id)?.title ?? id;
	const drillHref = (id: string) => `${base}/flashcards?deck=${encodeURIComponent(id)}`;
</script>

<svelte:head><title>{entry ? entry.term : 'The Kitchen Fieldbook'} · The World Table</title></svelte:head>

<div class="shell hub foundations" aria-busy={!!entry && loading}>
	{#if entry && reading}
		<header class="entry-head"><p class="eyebrow">The Kitchen Fieldbook · {categoryTitle(entry.category)}</p><h1 tabindex="-1">{entry.term}</h1>
			{#if entry.aliases?.length}<p class="aliases">Related names &amp; spellings: {entry.aliases.join(' · ')}</p>{/if}
			<p class="record">{status(entry)}</p>
		</header>
		<Ornament seed={entry.id} />
		{#if ready}<FoundationReading {reading} />
		{:else if loadFailed}<p role="status">The reading could not open. Your terms are still here.</p><button class="chip" onclick={load}>Try the reading again</button>
		{:else}<p role="status">Opening the field notes…</p>{/if}
		<div class="actions"><a class="chip go" href={drillHref(`foundations:item:${entry.id}`)}>Practise this term</a><a class="chip" href={drillHref(`foundations:category:${entry.category}`)}>Practise {categoryTitle(entry.category)}</a></div>
	{:else}
		<header class="fieldbook-head"><p class="eyebrow">From the kitchen to the dining room</p><h1 tabindex="-1">The Kitchen Fieldbook</h1><p class="subtitle">Your terms &amp; definitions</p><p class="lede">Read the meaning, understand the kitchen, then explain it warmly at the table. All {foundationsEntries.length} terms from your culinary sheets are gathered here.</p></header>
		{#if selected}<p class="notice" role="status">That term could not be found. Browse or search the fieldbook below.</p>{/if}
		<Ornament seed="kitchen-fieldbook" />
		<section class="practice" aria-labelledby="practice-h"><div><h2 id="practice-h">A little practice, every day</h2><p>Say the meaning and a guest description aloud before you flip. Missed answers, new words, then earlier practice.</p><p class="note">Self-checks build recall; they do not award mastery.</p></div><a class="chip go" href={drillHref('foundations:today')}>Practise {practiceCount} terms today</a></section>
		<section class="browse" aria-labelledby="browse-h"><h2 id="browse-h">Find a term</h2><label for="term-search">Search names and alternate spellings</label><input id="term-search" type="search" value={q} disabled={!mounted} oninput={(event) => { q = event.currentTarget.value; filter(); }} placeholder="Try sweetbreads, cippolini or skate…" />
			<div class="filters" role="group" aria-label="Culinary subjects"><button class="chip" aria-pressed={!category} disabled={!mounted} onclick={() => choose('')}>All subjects</button>{#each foundationsCategories as c}<button class="chip" aria-pressed={category === c.id} disabled={!mounted} onclick={() => choose(c.id)}>{c.title}</button>{/each}</div>
			<div class="browse-line"><p role="status">{filtered.length} of {foundationsEntries.length} terms · every level is open</p><a href={drillHref(category ? `foundations:category:${category}` : 'foundations')}>{category ? 'Practise this subject' : 'Practise all terms'}</a></div>
		</section>
		{#if !filtered.length}<div class="empty"><p>No terms match that search.</p><button class="chip" onclick={() => { q = ''; category = ''; filter(); }}>Show every term</button></div>{/if}
		{#each groups as group}
			<section class="term-group" aria-labelledby={`group-${group.id}`}><header><h2 id={`group-${group.id}`}>{group.title}</h2><p>{group.intro}</p></header><ul class="term-grid">{#each group.entries as term}<li><a class="term-door" href={href(term.id)} data-foundation={term.id}><span class="term-name">{term.term}</span><span class="term-status">{status(term)}</span><span class="open-word" aria-hidden="true">Read &amp; understand</span></a></li>{/each}</ul></section>
		{/each}
		<p class="endnote">The fieldbook explains culinary language. Confirm the actual ingredients, preparation and sourcing of tonight’s dish with the kitchen.</p>
	{/if}
</div>

<style>
	.foundations { max-width: 1100px; padding-bottom: 70px; }
	h1 { font-family: var(--house-display, var(--display)); text-wrap: balance; }
	.fieldbook-head { max-width: 760px; margin-inline: auto; text-align: center; padding-top: 20px; }
	.eyebrow { color: var(--turmeric-deep); font-size: .76rem; letter-spacing: .08em; text-transform: uppercase; }
	.subtitle { font-size: 1.35rem; color: var(--turmeric-deep); margin: 10px 0; }
	.lede { line-height: 1.65; color: var(--ink-soft); }
	.practice { display: flex; align-items: center; justify-content: space-between; gap: 22px; margin: 22px 0 30px; padding: 24px; border: 1px solid var(--house-frame, var(--line)); background: var(--house-panel, var(--card)); box-shadow: var(--house-inset, none); }
	.practice h2, .browse h2, .term-group h2 { font-size: 1.35rem; color: var(--turmeric-deep); margin-bottom: 7px; }
	.practice p { max-width: 63ch; color: var(--ink-soft); }
	.practice .note { margin-top: 8px; font-size: .9rem; }
	.practice .chip { flex-shrink: 0; }
	.browse label { display: block; margin: 12px 0 6px; color: var(--ink-soft); }
	input { width: 100%; min-height: 48px; padding: 10px 14px; border: 1px solid var(--line-strong); background: var(--card); color: var(--ink); font: inherit; }
	.filters { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
	.filters .chip { min-height: 44px; }
	.filters [aria-pressed="true"] { border-color: var(--turmeric-deep); background: color-mix(in srgb, var(--turmeric) 14%, var(--card)); box-shadow: inset 0 0 0 1px var(--turmeric-deep); }
	.browse-line { display: flex; flex-wrap: wrap; gap: 10px 20px; justify-content: space-between; font-size: .95rem; color: var(--ink-soft); }
	.term-group { margin-top: 30px; }
	.term-group header { margin-bottom: 14px; }
	.term-group header p { color: var(--ink-soft); max-width: 72ch; }
	.term-grid { list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(225px, 1fr)); gap: 12px; padding: 0; }
	.term-door { min-height: 120px; display: flex; flex-direction: column; gap: 5px; padding: 18px; text-decoration: none; color: var(--ink); border: 1px solid var(--house-frame, var(--line)); background: var(--house-panel, var(--card)); box-shadow: var(--house-inset, none); }
	.term-door:hover { border-color: var(--turmeric-deep); }
	.term-name { font-family: var(--display); font-size: 1.35rem; line-height: 1.25; }
	.term-status { color: var(--ink-soft); font-size: .88rem; min-height: 1.2em; }
	.open-word { color: var(--turmeric-deep); font-size: .8rem; margin-top: auto; padding-top: 8px; }
	.entry-head { max-width: 760px; }
	.aliases, .record { color: var(--ink-soft); margin-top: 8px; }
	.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
	.actions .chip { min-height: 48px; }
	.endnote { max-width: 75ch; color: var(--ink-soft); border-top: 1px solid var(--line); padding-top: 20px; margin-top: 34px; }
	.empty, .notice { padding: 20px; margin-top: 20px; background: var(--card); }
	@media (max-width: 650px) { .practice { display: block; padding: 18px; } .practice .chip { margin-top: 16px; } .term-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; } .term-door { padding: 14px 12px; min-height: 135px; overflow-wrap: anywhere; } .term-name { font-size: 1.16rem; } .filters .chip { font-size: .88rem; } }
	@media (max-width: 359px) { .term-grid { grid-template-columns: 1fr; } }
</style>
