<!--
  The coverage board — who can hold which section of the line.

  This page answers one question and refuses several others.

  IT ANSWERS: my saucier just called in sick, who can cover? That is what a
  kitchen manager needs at four in the afternoon, and nothing else in this app
  could tell them.

  IT REFUSES: scores, percentages, pass marks, sign-offs, dates, exports and
  anything that reads as a training record. The bands are four descriptive words
  and the counts are raw. A chef judges competence by watching somebody work;
  this board tells them where to look.

  ON READING OTHER PEOPLE'S DATA — and this is the part to be exact about,
  because the opposite was assumed for a while. A manager device CAN read every
  profile's whole record: the storage key is `session::<id>`, deterministic and
  reconstructible, and the shared layer already does this for two other wings.
  So showing coverage rather than answers is a CHOICE, and the copy below says
  so. Claiming the app "cannot" see more would be false, and the first engineer
  to read persistence/db.ts would overturn the policy on a bad premise.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import * as profiles from '$lib/profiles';
	import { loadAllSessions } from '$lib/persistence/db';
	import { coverageFor, whoCanCover, isTournant, BAND_LABEL, type Station, type StationCoverage } from '$lib/stations';

	let { data } = $props();

	const stations = $derived(data.stations.stations as Station[]);
	const recipesByTechnique = $derived(
		new Map(Object.entries(data.recipesByTechnique as Record<string, string[]>))
	);

	let people = $state<Array<{ id: string; name: string; coverage: StationCoverage[] }>>([]);
	let ready = $state(false);
	let manager = $state(false);
	let roster = $state(0);

	onMount(async () => {
		manager = profiles.isManagerDevice();
		const list = profiles.list();
		roster = list.length;
		const sessions = await loadAllSessions(list.map((p) => ({ id: p.id, name: p.name, legacy: p.legacy })));
		people = sessions.map((s) => ({
			id: s.id,
			name: s.name,
			// Cooks only. A drill answer is knowledge; a station is work.
			coverage: coverageFor(s.session.cookedLog, stations, recipesByTechnique)
		}));
		ready = true;
	});

	const tournants = $derived(people.filter((p) => isTournant(p.coverage)));
</script>

<svelte:head><title>Coverage — The World Table</title></svelte:head>

<div class="shell view" data-print="hide">
	<header class="head">
		<h1>Coverage</h1>
		<p class="lede">
			Who has done the work of each station, on this device. Not who is qualified — that is yours to
			judge, from watching them cook.
		</p>
	</header>

	{#if !ready}
		<p class="note">Reading the roster…</p>
	{:else}
		{#if !manager}
			<p class="warn">
				This is not marked as a manager's device, so you are seeing only your own coverage. The
				tablet on the pass is not the manager's — that distinction is the shared layer's, and it is
				deliberate.
			</p>
		{/if}

		<h2 class="sec">Who can cover tonight</h2>
		<p class="secnote">
			Ordered by how much of each station a person has actually cooked. A name at zero is not a
			mistake — <b>nobody can cover this</b> is the most useful thing this board can tell you.
		</p>

		{#each stations as s (s.key)}
			{@const covers = whoCanCover(s.key, people)}
			<section class="station">
				<h3>
					{s.name}
					<span class="size">{s.techniques.length} techniques · {data.stations.dishes[s.key]} dishes</span>
				</h3>
				<ul class="people">
					{#each covers as c (c.id)}
						<li>
							<span class="who">{c.name}</span>
							<span class="band" data-band={c.band}>{BAND_LABEL[c.band]}</span>
							<span class="count">{c.touched} of {c.of}</span>
							{#if c.met}<span class="met">{c.met} to a standard</span>{/if}
						</li>
					{:else}
						<li class="empty">Nobody on this device has cooked here.</li>
					{/each}
				</ul>
			</section>
		{/each}

		{#if tournants.length}
			<h2 class="sec">The tournant</h2>
			<p class="secnote">“{data.stations.tournant})” — the guide's own words.</p>
			<p class="tournant">{tournants.map((p) => p.name).join(', ')}</p>
		{/if}

		<h2 class="sec">What this board does not say</h2>
		<div class="limits">
			<p>
				<b>It is coverage, not competence.</b> It counts the techniques a person has cooked a dish for.
				It cannot see whether the plate was any good — only 45 of the guide's 970 dishes state a standard,
				so “to a standard” is always a floor and never a measure.
			</p>
			<p>
				<b>It is not a training record and must not be used as one.</b> Nothing here is dated, exported
				or signed off, and it certifies nobody. If you need a record for an inspector or an auditor,
				this is not it.
			</p>
			<p>
				<b>It shows coverage because we chose to, not because we must.</b> This device can read every
				profile's whole session — the key is reconstructible and the shared layer already does it
				elsewhere. Answers, notes and family recipes are not shown here because a shared tablet exists
				so a brigade can share a device, not so a manager can read somebody's notebook.
			</p>
			{#if data.stations.foundation.length}
				<p>
					<b>Three techniques belong to everyone, so they count for nobody:</b>
					{data.stations.foundation.join(', ')}. They appear across every station — knowing who has
					sweated an onion tells you nothing about who can cover the sauce.
				</p>
			{/if}
			{#if data.stations.undrilled.length}
				<p>
					<b>Two are excluded because the guide does not actually drill them:</b>
					{data.stations.undrilled.join(' and ')}. Their only recipes mention them in passing — a
					negative simile and a parchment lid — and crediting a cook for either would be a lie.
				</p>
			{/if}
			<p>
				<b>The line is not evenly weighted, and that is the guide's shape.</b> Pâtissier owns
				{stations.find((s) => s.key === 'patissier')?.techniques.length} techniques and poissonnier
				{stations.find((s) => s.key === 'poissonnier')?.techniques.length}. Losing the fish cook is
				survivable; losing the pastry cook is not.
			</p>
		</div>
	{/if}

	<p class="back"><a href="{base}/practise">Back to Practise</a></p>
</div>

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
		margin: 30px 0 10px;
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
	.warn {
		padding: 11px 14px;
		border-left: 2px solid var(--turmeric-deep);
		background: var(--paper-raised);
		max-width: var(--measure);
		font-size: var(--t-small);
		line-height: 1.55;
	}
	.station {
		margin-bottom: 18px;
	}
	.station h3 {
		font-family: var(--display);
		font-size: 19px;
		margin-bottom: 6px;
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: baseline;
	}
	.size {
		font-family: var(--text);
		font-size: var(--t-small);
		color: var(--muted);
		font-variant-numeric: oldstyle-nums;
	}
	.people {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.people li {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: baseline;
		padding: 7px 0;
		border-bottom: 1px dotted var(--line);
	}
	.who {
		min-width: 8em;
	}
	/* A word, never a colour alone, and never a percentage. */
	.band {
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		min-width: 8em;
	}
	.band[data-band='all'] {
		color: var(--turmeric-deep);
		font-weight: 600;
	}
	.band[data-band='none'] {
		color: var(--muted);
	}
	.count,
	.met {
		font-size: var(--t-small);
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.empty {
		color: var(--muted);
		font-size: var(--t-small);
	}
	.tournant {
		font-family: var(--display);
		font-size: 20px;
		color: var(--turmeric-deep);
	}
	.limits {
		max-width: var(--measure);
	}
	.limits p {
		padding: 11px 14px;
		margin-bottom: 9px;
		border-left: 2px solid var(--line);
		background: var(--paper-raised);
		font-size: var(--t-small);
		line-height: 1.6;
		color: var(--ink);
	}
	.back {
		margin-top: 24px;
		font-size: var(--t-small);
	}
</style>
