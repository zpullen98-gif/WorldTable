<!--
  The Repertoire: the cooked log, finally read.

  Everything on this page has been sitting in IndexedDB since the first build.
  `cookedLog` stored a timestamp on every cook and no screen ever looked at one:
  the study page drew a tick, the home band counted entries, and a dish cooked
  once last winter was indistinguishable from one cooked four times this month.

  So this is not a new record of anything. It is the same record, read properly.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { bySlug, recipeHref } from '$lib/data';
	import { session } from '$lib/stores/session.svelte';
	import { repertoire, dueList, sinceLabel, LADDER_DAYS, type RepertoireEntry } from '$lib/repertoire';

	let { data } = $props();

	const curriculum = $derived(new Set(data.curriculum));

	/* Date.now() inside the derivation rather than a ticking clock. It
	   recomputes whenever the log changes, which is the only event that can
	   actually move a dish between states while the page is open — the
	   alternative is an interval firing all day to redraw a schedule measured
	   in weeks. */
	const all = $derived.by(() => repertoire(session.cookedLog, Date.now()));
	const due = $derived.by(() => dueList(all, Date.now()));
	const holding = $derived(
		all.filter((e) => e.state === 'holding').sort((a, b) => a.dueAt - b.dueAt)
	);
	const fresh = $derived(all.filter((e) => e.state === 'fresh').sort((a, b) => a.dueAt - b.dueAt));

	const courseDone = $derived(all.filter((e) => curriculum.has(e.slug)).length);
	const totalCooks = $derived(session.cookedLog.length);

	/**
	 * Name and link for a cooked slug.
	 *
	 * Family recipes are not in the static index: they live in the session and
	 * their pages are /family/[slug]. recipeHref() is the only thing that knows
	 * about that split, so the link goes through it rather than being built by
	 * hand here.
	 */
	function dish(slug: string) {
		const guide = bySlug.get(slug);
		if (guide) return { name: guide.name, href: recipeHref(guide) };
		const fam = session.familyRecipes.find((r) => r.slug === slug);
		if (fam) return { name: fam.name, href: recipeHref(fam) };
		// Cooked, then the recipe was deleted. Keep the history; say so.
		return { name: slug, href: null };
	}

	const GRADE_LABEL = { met: 'met the standard', close: 'close', missed: 'missed it' } as const;

	function line(e: RepertoireEntry) {
		const times =
			e.times === 1 ? 'cooked once' : e.times === 2 ? 'cooked twice' : `cooked ${e.times} times`;
		const grade = e.lastGrade ? ` · ${GRADE_LABEL[e.lastGrade]}` : '';
		return `${times} · ${sinceLabel(e.daysSince)}${grade}`;
	}
</script>

<svelte:head><title>The Repertoire — The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<h1>The Repertoire</h1>
		<p class="lede">
			Not what you have read — what you can cook. Every dish you have made, how long ago, and which
			ones are slipping. A dish comes back on a schedule that widens each time the plate is right
			and narrows when it is not.
		</p>
		{#if all.length}
			<p class="progress">
				{all.length} dish{all.length === 1 ? '' : 'es'} · {totalCooks} cook{totalCooks === 1
					? ''
					: 's'} · {courseDone} of {data.curriculum.length} on the course · {due.length} due
			</p>
		{/if}
	</header>

	{#if !all.length}
		<section class="empty">
			<p>
				Nothing cooked yet. The repertoire fills itself — mark a dish cooked when you have actually
				made it, and it starts keeping the schedule for you.
			</p>
			<p>
				<a class="chip" href="{base}/study">Open the Path of Study</a>
			</p>
		</section>
	{:else}
		{#if due.length}
			<h2 class="sec">Due a re-cook</h2>
			<p class="secnote">
				Most slipped first. These are ordered by how far past due they are relative to their own
				interval, so a fortnightly dish three weeks late outranks an annual one three weeks late.
			</p>
			<ul class="rows">
				{#each due as e (e.slug)}
					{@const d = dish(e.slug)}
					<li class:cold={e.state === 'cold'}>
						<div class="rowmain">
							{#if d.href}
								<a class="name" href={d.href}>{d.name}</a>
							{:else}
								<span class="name gone">{d.name}</span>
							{/if}
							<span class="meta">{line(e)}</span>
						</div>
						<span class="badge" class:coldbadge={e.state === 'cold'}>
							{e.state === 'cold' ? 'Cold' : 'Due'}
						</span>
					</li>
				{/each}
			</ul>
		{:else}
			<h2 class="sec">Nothing is due</h2>
			<p class="secnote">
				Every dish you have cooked is still inside its interval. Add one: the course is the
				shortest way to a repertoire that holds.
			</p>
		{/if}

		{#if holding.length}
			<h2 class="sec">Going off the boil</h2>
			<p class="secnote">Inside the interval, but not for much longer.</p>
			<ul class="rows">
				{#each holding as e (e.slug)}
					{@const d = dish(e.slug)}
					<li>
						<div class="rowmain">
							{#if d.href}<a class="name" href={d.href}>{d.name}</a>{:else}<span
									class="name gone">{d.name}</span
								>{/if}
							<span class="meta">{line(e)}</span>
						</div>
						<span class="badge holdbadge">Holding</span>
					</li>
				{/each}
			</ul>
		{/if}

		{#if fresh.length}
			<h2 class="sec">In hand</h2>
			<p class="secnote">Cooked recently enough that you still have them.</p>
			<ul class="rows">
				{#each fresh as e (e.slug)}
					{@const d = dish(e.slug)}
					<li>
						<div class="rowmain">
							{#if d.href}<a class="name" href={d.href}>{d.name}</a>{:else}<span
									class="name gone">{d.name}</span
								>{/if}
							<span class="meta">{line(e)}</span>
						</div>
						<span class="badge freshbadge">{e.intervalDays}d</span>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}

	<section class="ladder">
		<h2 class="sec">How the schedule works</h2>
		<p class="secnote">
			Five rungs. A plate that meets its standard climbs one, a close plate holds, a missed one
			drops back — so the interval is earned rather than counted. Dishes with no standard yet
			simply climb: having nothing to check against is the guide's gap, not yours.
		</p>
		<ol class="rungs">
			{#each LADDER_DAYS as days, r (r)}
				<li><b>{r + 1}</b> <span>{days} days</span></li>
			{/each}
		</ol>
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

	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.rows li {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 11px 0;
		border-bottom: 1px solid var(--line);
	}
	.rowmain {
		flex: 1;
		min-width: 0;
	}
	.name {
		display: block;
		color: var(--ink);
		text-decoration: none;
		font-size: var(--t-body);
	}
	.name:hover {
		text-decoration: underline;
		text-decoration-color: var(--turmeric);
		text-underline-offset: 3px;
	}
	.gone {
		color: var(--muted);
		font-style: italic;
	}
	.meta {
		display: block;
		margin-top: 3px;
		font-size: var(--t-small);
		color: var(--muted);
		font-variant-numeric: oldstyle-nums;
	}

	/* One badge, three weights. Colour is not the only signal: each carries its
	   own word — because a service pass is exactly where a red/amber-only cue
	   fails, and so does anyone reading this in monochrome print. */
	.badge {
		flex: none;
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		padding: 3px 8px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		color: var(--ink-soft);
		white-space: nowrap;
	}
	/* --turmeric-deep, not --turmeric. The plain accent measures 3.53:1 on day
	   service's paper, which fails AA at this size — the same defect the
	   recipe page's "where it goes wrong" label shipped with. The deep token
	   exists precisely for accent text and is AA in both services. */
	.coldbadge {
		border-color: var(--turmeric-deep);
		color: var(--turmeric-deep);
	}
	/* The three states differ by BORDER weight, never by fading the text.
	   These shipped as opacity: 0.85 and 0.55 over --muted, which measured
	   3.41:1 and 2.07:1 against day-service paper, the second one barely
	   visible. Dimming is a tempting way to build hierarchy and it is the one
	   that costs legibility first; a hairline border says "quieter" without
	   taking the words away. */
	.holdbadge {
		border-style: dashed;
	}
	.freshbadge {
		border-color: transparent;
	}
	.rows li.cold .name {
		font-weight: 600;
	}

	.empty {
		max-width: var(--measure);
		color: var(--ink-soft);
	}
	.empty p {
		margin-bottom: 14px;
	}

	.ladder {
		margin-top: 34px;
	}
	.rungs {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin: 0;
		padding: 0;
	}
	.rungs li {
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 6px 12px;
		font-size: var(--t-small);
		font-variant-numeric: oldstyle-nums;
	}
	.rungs b {
		color: var(--turmeric-deep);
		margin-right: 6px;
	}
</style>
