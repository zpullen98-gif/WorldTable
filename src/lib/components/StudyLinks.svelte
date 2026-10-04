<!--
  "In this app": the pages of the World Table that hold something about a
  house dish, found by src/lib/study-links.ts and drawn only when their
  target exists (docs/study-menus-design.md, 1.5).

  The data comes through the loaders the rest of the app already uses, each
  a lazy chunk the service worker precaches, so the block resolves offline
  and the /menu chunk does not grow by any of it. Until the loaders resolve
  the block holds one line at its own place at the foot of the card, so
  nothing the reader is looking at moves.

  The Library's recipe is labelled as the Library's and never as the
  house's, and the Library's own pairing sits closed at the foot, drawn only
  when it would pour something other than the house's first pick: a server
  who must give one answer to "what do I pour?" is never handed two.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import {
		loadDeckIndex,
		loadDetail,
		loadFloorDeck,
		loadLevels,
		loadLexicon,
		loadPairings,
		loadPrimers,
		loadTechniques,
		recipeHref,
		recipes
	} from '$lib/data';
	import { deckHref } from '$lib/floor-deck-core.mjs';
	import { session } from '$lib/stores/session.svelte';
	import { fold, say } from '$lib/study';
	import { studyLinksFor, type StudyLinks } from '$lib/study-links';
	import { guestDeck } from '$lib/house-say';
	import type { House, HouseDish } from '$lib/house/house-schema';
	import type { Pairing as LibraryPairing } from '$lib/types';

	let {
		current,
		dish,
		recipeSlug = '',
		housePour = ''
	}: { current: House; dish: HouseDish; recipeSlug?: string; housePour?: string } = $props();

	let links = $state<StudyLinks | null>(null);
	let failed = $state(false);
	let libPour = $state<LibraryPairing | null>(null);

	async function find(d: HouseDish) {
		links = null;
		libPour = null;
		failed = false;
		try {
			const [deck, lexicon, techniques, primers, index, levels] = await Promise.all([
				loadFloorDeck(),
				loadLexicon(),
				loadTechniques(),
				loadPrimers(),
				loadDeckIndex(),
				loadLevels()
			]);
			const titles: Record<string, string> = {};
			for (const s of (levels as unknown as { subsections?: Array<{ key: string; title: string }> }).subsections ?? []) titles[s.key] = s.title;
			const pool = [
				...recipes.map((r) => ({ slug: r.slug, name: r.name, source: r.source })),
				...session.familyRecipes.map((r) => ({ slug: r.slug, name: r.name, source: 'family' }))
			];
			const out = studyLinksFor(current, d, {
				deck: deck.cards,
				lexicon,
				techniques,
				recipes: pool,
				primers: primers.primers,
				levelNames: index.levels as unknown as Record<string, string>,
				subsectionTitles: titles,
				recipeSlug
			});
			if (d.id !== dish.id) return;
			/* A scenario links only when Guest at the table will seat it: the kitchen's own questions are not dealt there. */
			const seated = new Set(guestDeck(current).map((c) => c.id));
			links = { ...out, scenarios: out.scenarios.filter((s) => seated.has(s.id)) };
			if (out.recipe && out.recipe.source !== 'family') {
				const detail = await loadDetail(out.recipe.slug);
				const all = await loadPairings();
				const p = detail && typeof detail.pairingId === 'number' ? all[detail.pairingId] : undefined;
				if (d.id === dish.id && p && p.pour && fold(p.pour) !== fold(housePour)) libPour = p;
			}
		} catch {
			failed = true;
		}
	}

	let started = '';
	onMount(() => {
		started = dish.id;
		void find(dish);
	});
	$effect(() => {
		const d = dish;
		if (started && d.id !== started) {
			started = d.id;
			void find(d);
		}
	});

	const empty = $derived(
		!!links &&
			!links.houseWords.length &&
			!links.deck.length &&
			!links.lexicon.length &&
			!links.techniques.length &&
			!links.recipe &&
			!links.primers.length &&
			!links.scenarios.length
	);
</script>

<section class="here" aria-labelledby="here-h">
	<h3 class="blockhead" id="here-h">{say('here')}</h3>
	{#if failed}
		<p class="soft">The links in this app could not be read on this device.</p>
	{:else if !links}
		<p class="soft" role="status">{say('linksWait')}</p>
	{:else if empty}
		<p class="soft">Nothing in this app names this dish yet.</p>
	{:else}
		{#if links.houseWords.length}
			<h4 class="eyebrow">The house's words</h4>
			<dl class="words">
				{#each links.houseWords as w (w.id)}
					<div>
						<dt>{w.term}</dt>
						<dd>
							{#if w.say}<span class="say">{w.say}</span>{/if}
							{#if w.toGuest}<span>{w.toGuest}</span>{/if}
						</dd>
					</div>
				{/each}
			</dl>
		{/if}
		{#if links.deck.length}
			<h4 class="eyebrow">{say('deckHere')}</h4>
			<ul class="links">
				{#each links.deck as c (c.id)}
					<li><a href={deckHref(base, c)}><span class="term">{c.term}</span>{#if c.gist}<span class="gist">{c.gist}</span>{/if}</a></li>
				{/each}
			</ul>
		{/if}
		{#if links.lexicon.length}
			<h4 class="eyebrow">The Lexicon</h4>
			<ul class="links">
				{#each links.lexicon as l (l.slug)}
					<li><a href="{base}/lexicon#{l.slug}"><span class="term">{l.term}</span></a></li>
				{/each}
			</ul>
		{/if}
		{#if links.techniques.length}
			<h4 class="eyebrow">Techniques</h4>
			<ul class="links">
				{#each links.techniques as t (t.slug)}
					<li><a href="{base}/technique/{t.slug}"><span class="term">{t.label}</span></a></li>
				{/each}
			</ul>
		{/if}
		{#if links.recipe}
			<h4 class="eyebrow">Cook it in the Library</h4>
			<ul class="links">
				<li>
					<a href="{base}{recipeHref({ slug: links.recipe.slug, source: links.recipe.source === 'family' ? 'family' : 'guide' } as never)}"
						><span class="term">{say('libRecipe', { name: links.recipe.name })}</span></a
					>
				</li>
			</ul>
		{/if}
		{#if links.primers.length}
			<h4 class="eyebrow">Read in the primers</h4>
			<ul class="links">
				{#each links.primers as p (p.level + p.subsection)}
					<li><a href="{base}/level/{p.level}/read#{p.subsection}"><span class="term">{p.label}</span></a></li>
				{/each}
			</ul>
		{/if}
		{#if links.scenarios.length}
			<h4 class="eyebrow">At the table</h4>
			<ul class="links">
				{#each links.scenarios as s (s.id)}
					<li><a href="{base}/menu/quiz?mode=guest&scenario={encodeURIComponent(s.id)}"><span class="term">{s.title}</span></a></li>
				{/each}
			</ul>
		{/if}
		{#if libPour}
			<details class="libpour">
				<summary>{say('libPour')}</summary>
				<dl class="words">
					<div><dt>Pour</dt><dd>{libPour.pour}</dd></div>
					{#if libPour.alt}<div><dt>Or</dt><dd>{libPour.alt}</dd></div>{/if}
					{#if libPour.zeroProof}<div><dt>Without alcohol</dt><dd>{libPour.zeroProof}</dd></div>{/if}
					{#if libPour.why}<div><dt>Why</dt><dd>{libPour.why}</dd></div>{/if}
				</dl>
			</details>
		{/if}
	{/if}
</section>

<style>
	.here { margin: 22px 0 6px; }
	.blockhead { font-family: var(--display); font-size: var(--t-h4, 1.25rem); margin: 0 0 6px; }
	.eyebrow { margin: 12px 0 4px; color: var(--muted); font-weight: 500; }
	.soft { color: var(--ink-soft); font-size: 1rem; margin: 4px 0; }
	.links { list-style: none; margin: 0; padding: 0; }
	.links li { border-bottom: 1px dotted var(--line); }
	.links a {
		display: flex; flex-direction: column; justify-content: center; min-height: 44px;
		padding: 6px 0; color: var(--ink); text-decoration: none;
	}
	.links a:hover .term { text-decoration: underline; }
	.term { font-size: 1.05rem; text-decoration: underline; text-underline-offset: 3px; text-decoration-color: var(--line-strong); }
	.gist { color: var(--ink-soft); font-size: 1rem; line-height: 1.4; }
	.words { margin: 0; }
	.words div { padding: 4px 0; border-bottom: 1px dotted var(--line); }
	.words dt { font-weight: 600; font-size: 1rem; }
	.words dd { margin: 0; font-size: 1rem; color: var(--ink-soft); line-height: 1.5; }
	.words .say { display: block; color: var(--ink); }
	.libpour { margin: 14px 0 0; }
	.libpour summary { min-height: 44px; display: flex; align-items: center; cursor: pointer; font-size: 1rem; }
</style>
