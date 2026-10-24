<!--
  One Cuisine entry, read whole: the title, how to say it, its level by name
  and its kind, the summary, the guest line (At the table), the sections under
  their own headings with the ratios as a list of terms, the temperatures as
  written (°C first, °F beside), the faults (fault, cause, fix) and At
  Brennan's (each dish linked to its study card when the house on this device
  is Brennan's and holds it, else named in words, with the menu component's
  own explanation behind a disclosure when a person kept it), From your
  sheets (the owner's own sheet terms the entry meets, each a link to its page
  in Your culinary terms, drawn only when there are any), See also, the
  sources and the quote, then the drills, I have read this, and Next entry.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { studiesForIds } from '$lib/visual-study-links';
	import TeachingFolio from '$lib/components/TeachingFolio.svelte';
	import { KIND_WORDS, SECTION_TITLES, dateWords, sheetLinks, type CzEntry, type CzLabels } from '$lib/cuisine';

	let {
		entry,
		labels,
		levelName,
		entryLink,
		dishLink,
		componentExplain,
		read,
		onRead,
		flashHref,
		quizHref,
		next
	}: {
		entry: CzEntry;
		labels: CzLabels;
		levelName: string;
		entryLink: (slug: string) => { href: string | null; title: string };
		dishLink: (id: string) => { href: string | null; name: string };
		/** The menu component's own explanation, when the house holds it and a person kept it; else null. */
		componentExplain: (name: string) => string | null;
		read: boolean;
		onRead: (read: boolean) => void;
		flashHref: string;
		quizHref: string;
		next: { href: string; title: string } | null;
	} = $props();

	const words = (slug: string) => slug.replace(/-/g, ' ');
	/* Built here, not in the markup: Svelte trims the space that opens an
	   {#if} block, which drew "Commis· Emulsion". */
	const eyebrow = $derived([levelName, KIND_WORDS[entry.kind]].filter(Boolean).join(' · '));
	/* A source's date on its own line under the title, never a comma left
	   alone at the start of a line when a long title wraps: "1907", "As of 26
	   September 2026", or both with the dot the app's counts use. */
	function sourceDate(s: CzEntry['sources'][number]): string {
		const line = [s.year ? String(s.year) : '', s.asOf ? `as of ${dateWords(s.asOf)}` : ''].filter(Boolean).join(' · ');
		return line.charAt(0).toUpperCase() + line.slice(1);
	}
	const has = (key: string) => entry.sections.some((s) => s.key === key);
	/* A temperature's label is written to read either side of its figure:
	   "The yolks begin to thicken" after it, "Hold hot for service at or
	   above" before it. A label that ends on the word leading into the
	   figure is read first, so no line ends "at or above" with nothing after. */
	const leadsIn = (label: string) => /\b(?:about|around|above|below|by|from|least|most|near|over|reaches|reads|roughly|than|to|typically|under|until)$/i.test(label.trim());

	/* The blocks that belong under a section's heading: drawn there when the
	   entry has that section, else on their own after the sections. */
	const ratiosAlone = $derived((entry.ratios.length > 0 || entry.temps.length > 0) && !has('ratio'));
	const faultsAlone = $derived(entry.faults.length > 0 && !has('faults'));
	const brennansAlone = $derived(entry.brennans.length > 0 && !has('brennans'));

	/* Every menu component the entry names, once: the dishes' own and See also's. */
	const components = $derived([...new Set([...entry.brennans.flatMap((b) => b.components), ...(entry.seeAlso.components ?? [])])]);
	/* Each fold says what a tap does, in the house's words for a details
	   (Show what Commis holds, Hide what Commis holds). */
	let opened = $state<Record<string, boolean>>({});
	const explained = $derived(components.map((name) => ({ name, text: componentExplain(name) })).filter((c): c is { name: string; text: string } => !!c.text));

	type Row = { key: string; href: string | null; label: string };
	const see = $derived.by(() => {
		const s = entry.seeAlso;
		const groups: Array<{ title: string; rows: Row[] }> = [];
		const add = (title: string, rows: Row[]) => {
			if (rows.length) groups.push({ title, rows });
		};
		add(
			'Other Cuisine entries',
			(s.entries ?? []).map((slug) => {
				const l = entryLink(slug);
				return { key: slug, href: l.href, label: l.href ? l.title : `${l.title} (coming)` };
			})
		);
		add('Techniques', (s.techniques ?? []).map((slug) => ({ key: slug, href: `${base}/technique/${slug}`, label: labels.techniques?.[slug] ?? words(slug) })));
		add('In the Lexicon', (s.lexicon ?? []).map((slug) => ({ key: slug, href: `${base}/lexicon#${slug}`, label: labels.lexicon?.[slug] ?? words(slug) })));
		add('Recipes', (s.recipes ?? []).map((slug) => ({ key: slug, href: `${base}/recipe/${slug}`, label: labels.recipes?.[slug] ?? words(slug) })));
		add(
			'Cook at home',
			(s.kitchen ?? []).map((slug) => {
				const k = labels.kitchen?.[slug];
				return { key: slug, href: `${base}/kitchen?d=${encodeURIComponent(slug)}${k ? `&level=${k[1]}` : ''}`, label: k?.[0] ?? words(slug) };
			})
		);
		add('Plates', (s.plates ?? []).map((slug) => ({ key: slug, href: `${base}/plates/${slug}`, label: labels.plates?.[slug] ?? words(slug) })));
		add(
			'The Floor Deck',
			(s.deck ?? []).map((id) => {
				const d = labels.deck?.[id];
				return { key: id, href: d ? `${base}/flashcards?deck=${encodeURIComponent('deck:' + d[1])}&card=${id}&run=1` : null, label: d?.[0] ?? id };
			})
		);
		return groups;
	});
	const folios = $derived(studiesForIds(entry.seeAlso.folios));
	const sheets = $derived(sheetLinks(entry.seeAlso.terms, labels, base));
</script>

{#snippet ratios()}
	{#if entry.ratios.length}
		<dl class="ratios">
			{#each entry.ratios as r (r.label)}<dt>{r.label}</dt><dd>{r.value}</dd>{/each}
		</dl>
	{/if}
	{#if entry.temps.length}
		<ul class="temps" aria-label="Temperatures">
			{#each entry.temps as t (t.label)}
				<li>{#if leadsIn(t.label)}<span class="tlabel">{t.label}</span> <span class="tval after">{t.c}°C ({t.f}°F)</span>{:else}<span class="tval">{t.c}°C ({t.f}°F)</span> <span class="tlabel">{t.label}</span>{/if}</li>
			{/each}
		</ul>
	{/if}
{/snippet}

{#snippet faults()}
	<ul class="faults">
		{#each entry.faults as f (f.fault)}
			<li>
				<p class="fname">{f.fault}</p>
				<p class="fline"><span class="xlabel">Cause</span> {f.cause}</p>
				<p class="fline"><span class="xlabel">Fix</span> {f.fix}</p>
			</li>
		{/each}
	</ul>
{/snippet}

{#snippet brennans()}
	<ul class="dishes">
		<!-- keyed by place: an entry may link one dish more than once, each link its own facet -->
		{#each entry.brennans as b, i (i)}
			{@const d = dishLink(b.dish)}
			<li>
				<p class="dname">{#if d.href}<a href={d.href}>{d.name}</a>{:else}{d.name}{/if}</p>
				<p class="dhow">{b.how}</p>
			</li>
		{/each}
	</ul>
	{#each explained as c (c.name)}
		<details class="fold explain" ontoggle={(e) => (opened[c.name] = (e.currentTarget as HTMLDetailsElement).open)}>
			<summary>{opened[c.name] ? 'Hide' : 'Show'} how the menu explains {c.name}</summary>
			{#each c.text.split(/\n\n+/) as para, i (i)}<p>{para}</p>{/each}
		</details>
	{/each}
{/snippet}

<article class="czentry" aria-labelledby="entry-h">
	<p class="eyebrow">{eyebrow}</p>
	<h1 id="entry-h" tabindex="-1">{entry.title}</h1>
	<p class="say"><span class="xlabel">Say it</span> {entry.say}</p>
	<p class="lede">{entry.summary}</p>
	<aside class="guest" aria-labelledby="guest-h">
		<h2 id="guest-h" class="mini">At the table</h2>
		<p>{entry.guest}</p>
	</aside>

	{#each entry.sections as s (s.key)}
		<section class="part" aria-labelledby="sec-{s.key}">
			<h2 id="sec-{s.key}">{SECTION_TITLES[s.key] ?? s.key}</h2>
			{#each s.paras as para, i (i)}<p class="para">{para}</p>{/each}
			{#if s.key === 'ratio'}{@render ratios()}{/if}
			{#if s.key === 'faults' && entry.faults.length}{@render faults()}{/if}
			{#if s.key === 'brennans' && entry.brennans.length}{@render brennans()}{/if}
		</section>
	{/each}
	{#if ratiosAlone}
		<section class="part" aria-labelledby="sec-ratios"><h2 id="sec-ratios">Ratios and temperatures</h2>{@render ratios()}</section>
	{/if}
	{#if faultsAlone}
		<section class="part" aria-labelledby="sec-faults"><h2 id="sec-faults">Faults and fixes</h2>{@render faults()}</section>
	{/if}
	{#if brennansAlone}
		<section class="part" aria-labelledby="sec-brennans"><h2 id="sec-brennans">At Brennan's</h2>{@render brennans()}</section>
	{/if}

	{#if sheets.length}
		<section class="part sheets" aria-labelledby="sec-sheets">
			<h2 id="sec-sheets">From your sheets</h2>
			<ul class="links">
				{#each sheets as t (t.id)}<li><a href={t.href}>{t.label}</a></li>{/each}
			</ul>
		</section>
	{/if}

	{#if folios.length}
		<section class="part" aria-labelledby="sec-illustrated">
			<h2 id="sec-illustrated">Illustrated studies</h2>
			<p class="para">Compare the techniques and ingredients in this lesson. Each study names the subjects it depicts.</p>
			{#key entry.id}
				{#each folios as folio (folio.id)}<TeachingFolio {folio} />{/each}
			{/key}
		</section>
	{/if}

	{#if see.length}
		<section class="part see" aria-labelledby="sec-see">
			<h2 id="sec-see">See also</h2>
			{#each see as g (g.title)}
				<h3 class="mini">{g.title}</h3>
				<ul class="links">
					{#each g.rows as r (r.key)}<li>{#if r.href}<a href={r.href}>{r.label}</a>{:else}<span>{r.label}</span>{/if}</li>{/each}
				</ul>
			{/each}
		</section>
	{/if}

	{#if entry.quote}
		<figure class="quote">
			<blockquote><p>{entry.quote.text}</p></blockquote>
			<figcaption>{entry.quote.source}{#if entry.quote.year}, {entry.quote.year}{/if}</figcaption>
		</figure>
	{/if}

	{#if entry.sources.length}
		<section class="part sources" aria-labelledby="sec-sources">
			<h2 id="sec-sources">Sources</h2>
			<ul>
				{#each entry.sources as s (s.url + s.title)}
					<li><a href={s.url} rel="noopener noreferrer">{s.title}</a>{#if s.year || s.asOf}<span class="sdate">{sourceDate(s)}</span>{/if}</li>
				{/each}
			</ul>
		</section>
	{/if}

	<div class="chips drills" role="group" aria-label="This entry">
		{#if entry.cards.length}<a class="chip go" href={flashHref}>Flash this entry</a>{/if}
		{#if entry.questions.length}<a class="chip" href={quizHref}>Quiz this entry</a>{/if}
		<button type="button" class="chip readmark" aria-pressed={read} onclick={() => onRead(!read)}>I have read this</button>
	</div>
	{#if next}
		<p class="next"><span class="xlabel">Next entry</span> <a href={next.href}>{next.title}</a></p>
	{/if}
</article>

<style>
	.czentry {
		max-width: var(--measure);
	}
	.eyebrow {
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--turmeric-deep);
		margin: 0;
	}
	h1 {
		font-size: var(--t-h1);
		margin: 4px 0 4px;
	}
	h1:focus {
		outline: none;
	}
	.say {
		font-size: 1rem;
		color: var(--ink-soft);
		margin: 0 0 10px;
	}
	.lede {
		font-size: var(--t-lede);
		line-height: 1.6;
		color: var(--ink-soft);
		margin: 0 0 14px;
	}
	.guest {
		border-left: 2px solid var(--turmeric-deep);
		padding: 2px 0 2px 14px;
		margin: 0 0 8px;
	}
	.guest p {
		font-family: var(--display);
		font-size: 1.2rem;
		line-height: 1.5;
		margin: 2px 0 0;
	}
	.mini {
		font-family: var(--house-display, var(--display));
		font-size: 0.9375rem;
		font-weight: 500;
		letter-spacing: 0.06em;
		color: var(--turmeric-deep);
		margin: 12px 0 4px;
	}
	.part {
		border-top: 1px solid var(--house-frame, var(--line));
		padding-top: 14px;
		margin-top: 20px;
	}
	.part > h2 {
		font-family: var(--house-reading, var(--display));
		font-size: var(--t-h3);
		font-weight: 500;
		color: var(--turmeric-deep);
		line-height: 1.25;
		margin: 0 0 8px;
	}
	.para {
		font-size: var(--t-body);
		line-height: 1.7;
		margin: 0 0 10px;
	}
	.xlabel {
		font-size: 0.9375rem;
		letter-spacing: 0.06em;
		color: var(--turmeric-deep);
		margin-right: 6px;
	}
	.ratios {
		display: grid;
		grid-template-columns: minmax(8em, max-content) 1fr;
		gap: 6px 14px;
		margin: 8px 0 10px;
		font-size: var(--t-body);
		line-height: 1.5;
	}
	.ratios dt {
		color: var(--ink-soft);
	}
	.ratios dd {
		margin: 0;
	}
	.temps,
	.faults,
	.dishes,
	.links,
	.sources ul {
		list-style: none;
		margin: 6px 0 10px;
		padding: 0;
	}
	.temps li {
		font-size: var(--t-body);
		line-height: 1.5;
		padding: 4px 0;
	}
	.tval {
		font-variant-numeric: lining-nums;
		font-weight: 600;
		margin-right: 6px;
	}
	.tval.after {
		margin-right: 0;
		white-space: nowrap;
	}
	.faults li,
	.dishes li {
		padding: 10px 0;
		border-top: 1px solid var(--line);
	}
	.faults li:first-child,
	.dishes li:first-child {
		border-top: 0;
	}
	.fname,
	.dname {
		font-family: var(--display);
		font-size: 1.2rem;
		margin: 0 0 4px;
	}
	.dname a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		min-width: 44px;
		color: var(--ink);
	}
	.fline,
	.dhow {
		font-size: var(--t-body);
		line-height: 1.55;
		margin: 0 0 4px;
	}
	.explain p {
		font-size: var(--t-body);
		line-height: 1.6;
		margin: 0 0 8px;
	}
	.explain > summary {
		display: flex;
		align-items: center;
		min-height: 44px;
		cursor: pointer;
		font-size: 1rem;
	}
	.links li {
		font-size: var(--t-body);
	}
	/* min-width too: a one-word reference (Jus, Filé, Roux) is still a 44 by 44 target */
	.links a,
	.links span,
	.sources a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		min-width: 44px;
		color: var(--ink);
		line-height: 1.4;
	}
	.links span {
		color: var(--ink-soft);
	}
	.quote {
		margin: 22px 0 0;
		padding: 4px 0 4px 16px;
		border-left: 2px solid var(--line-strong, var(--line));
	}
	.quote blockquote {
		margin: 0;
	}
	.quote blockquote p {
		font-family: var(--display);
		font-size: 1.2rem;
		line-height: 1.55;
		margin: 0 0 6px;
	}
	.quote figcaption {
		font-size: 1rem;
		color: var(--ink-soft);
	}
	.sources li {
		font-size: 1rem;
		line-height: 1.5;
		padding: 2px 0 6px;
	}
	.sdate {
		display: block;
		color: var(--ink-soft);
	}
	.drills {
		margin-top: 24px;
	}
	.readmark[aria-pressed='true'] {
		border-color: var(--turmeric-deep);
		color: var(--turmeric-deep);
	}
	.next {
		margin: 14px 0 0;
		font-size: var(--t-body);
	}
	.next a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		min-width: 44px;
		color: var(--ink);
		font-family: var(--display);
		font-size: 1.2rem;
	}
	@media (max-width: 599px) {
		.ratios {
			grid-template-columns: 1fr;
			gap: 0 0;
		}
		.ratios dd {
			margin-bottom: 6px;
		}
	}
</style>
