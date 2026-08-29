<!--
  The coverage board: who can hold which section of the line.

  This page answers one question and refuses several others.

  IT ANSWERS: my saucier just called in sick, who can cover? That is what a
  kitchen manager needs at four in the afternoon, and nothing else in this app
  could tell them.

  IT REFUSES: scores, percentages, pass marks, sign-offs, dates, exports and
  anything that reads as a training record. The bands are four descriptive words
  and the counts are raw. A chef judges competence by watching somebody work;
  this board tells them where to look.

  ON READING OTHER PEOPLE'S DATA, and this is the part to be exact about,
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
	// Emitted by build-data from the same measurement the technique-standards
	// gate checks: this copy hardcoded 683/45/638 and the corpus moved twice.
	import ASSESS from '$lib/data/assessability.json';
	import { loadAllSessions } from '$lib/persistence/db';
	import {
		coverageFor,
		whoCanCover,
		coldTechniques,
		isTournant,
		BAND_LABEL,
		type Station,
		type StationCoverage
	} from '$lib/stations';

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

		/**
		 * THE GATE, WHICH USED TO BE COPY.
		 *
		 * `people` was built unconditionally from the whole roster and `manager`
		 * only decided whether a warning rendered, a warning that told a commis
		 * on the pass tablet they were "seeing only your own coverage" while the
		 * page showed them everybody's. The page did not merely fail to gate; it
		 * said the opposite of what it was doing.
		 *
		 * The roster is now narrowed BEFORE any session is read, so a non-manager
		 * device never loads anybody else's record at all. Reading less is the
		 * gate; not rendering what you already read is a curtain.
		 */
		const mine = profiles.current();
		const visible = manager ? list : list.filter((p) => p.id === mine?.id);

		const sessions = await loadAllSessions(
			visible.map((p) => ({ id: p.id, name: p.name, legacy: p.legacy }))
		);
		people = sessions.map((s) => ({
			id: s.id,
			name: s.name,
			// Cooks only. A drill answer is knowledge; a station is work.
			coverage: coverageFor(s.session.cookedLog, stations, recipesByTechnique)
		}));

		const now = Date.now();
		const cold = new Map<string, Map<string, string[]>>();
		for (const s of sessions) {
			const perStation = new Map<string, string[]>();
			for (const st of stations) {
				perStation.set(
					st.key,
					coldTechniques(s.session.cookedLog, st.techniques, recipesByTechnique, now)
				);
			}
			cold.set(s.id, perStation);
		}
		coldBy = cold;
		ready = true;
	});

	const tournants = $derived(people.filter((p) => isTournant(p.coverage)));

	/**
	 * How many of each person's touched techniques have gone cold, per station.
	 *
	 * Read from the same cooked logs the coverage came from. Computed here
	 * rather than inside coverageFor because it is time-dependent and coverage
	 * is not: a band does not change while the page is open, and a cold count
	 * would.
	 */
	let coldBy = $state(new Map<string, Map<string, string[]>>());

	/**
	 * Stations exactly one person has touched.
	 *
	 * A COUNT OF NAMES, not a score. This is the risk a head chef carries in
	 * their head and loses on precisely the morning it matters, the scenario
	 * the page was built for and the one thing it never said.
	 */
	const thin = $derived(
		stations
			.map((st) => ({
				name: st.name,
				covers: whoCanCover(st.key, people).filter((c) => c.touched > 0)
			}))
			.filter((x) => x.covers.length === 1)
	);
	const uncovered = $derived(
		stations.filter((st) => whoCanCover(st.key, people).every((c) => c.touched === 0))
	);
	/**
	 * On a device where nobody has cooked anything, EVERY station is uncovered
	 * and the line is noise rather than a risk. It is only a warning once some
	 * of the pass is covered and some of it is not.
	 */
	const showRisk = $derived(uncovered.length < stations.length && (thin.length > 0 || uncovered.length > 0));

	/** "a, b and c": six things joined with "and" is not a sentence. */
	const listOf = (xs: string[]) =>
		xs.length <= 1 ? (xs[0] ?? '') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1];
</script>

<svelte:head><title>Coverage: The World Table</title></svelte:head>

<div class="shell view" data-print="hide">
	<header class="head">
		<h1>Coverage</h1>
		<p class="lede">
			Who has done the work of each station, on this device. Not who is qualified; that is yours to
			judge, from watching them cook.
		</p>
	</header>

	{#if !ready}
		<p class="note">Reading the roster…</p>
	{:else}
		{#if !manager}
			<p class="warn">
				This is not marked as a manager's device, so you are seeing only your own coverage. The
				tablet on the pass is not the manager's; that distinction is the shared layer's, and it is
				deliberate.
			</p>
		{/if}

		{#if showRisk}
			<p class="thin">
				{#if uncovered.length}
					<b>{listOf(uncovered.map((s) => s.name))}</b>
					{uncovered.length === 1 ? 'has' : 'have'} nobody at all.
				{/if}
				{#if thin.length}
					<b>{listOf(thin.map((t) => t.name))}</b>
					{thin.length === 1 ? 'has' : 'have'} one person each: {listOf([...new Set(thin.map((t) => t.covers[0].name))])}.
				{/if}
			</p>
		{/if}

		<h2 class="sec">Who can cover tonight</h2>
		<p class="secnote">
			Ordered by how much of each station a person has actually cooked. A name at zero is not a
			mistake. <b>Nobody can cover this</b> is the most useful thing this board can tell you.
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
						{@const cold = coldBy.get(c.id)?.get(s.key) ?? []}
						{@const gaps = people.find((p) => p.id === c.id)?.coverage.find((x) => x.key === s.key)?.gaps ?? []}
						<li>
							<span class="who">{c.name}</span>
							<span class="band" data-band={c.band}>{BAND_LABEL[c.band]}</span>
							<span class="count">{c.touched} of {c.of}</span>
							{#if c.met}<span class="met">{c.met} to a standard</span>{/if}
							{#if cold.length}
								<!-- "Can they still do it" is what a chef means, and the board had
								     no answer: a technique cooked once three years ago read
								     identically to one cooked last night. Same decay model as the
								     Repertoire, no second clock. -->
								<span class="cold">{cold.length} gone cold</span>
							{/if}
							{#if gaps.length}
								<!--
									The worklist. `gaps` has been computed since the board shipped and
									rendered nowhere, so a chef learned Priya was at "some of it" and
									not which two things to put her on next.

									Ordered by how many corpus recipes drill each, most first, so the
									top suggestion is the easiest to arrange on a Tuesday. Never a
									count of what is left, and that is a percentage with the division
									done in the reader's head.
								-->
								<span class="next">
									next: {[...gaps]
										.sort(
											(a, b) =>
												(recipesByTechnique.get(b)?.length ?? 0) -
												(recipesByTechnique.get(a)?.length ?? 0)
										)
										.slice(0, 2)
										.join(', ')}
								</span>
							{/if}
						</li>
					{:else}
						<li class="empty">Nobody on this device has cooked here.</li>
					{/each}
				</ul>
			</section>
		{/each}

		{#if tournants.length}
			<h2 class="sec">The tournant</h2>
			<p class="secnote">“{data.stations.tournant})”, the guide's own words.</p>
			<p class="tournant">{tournants.map((p) => p.name).join(', ')}</p>
		{/if}

		<h2 class="sec">What this board does not say</h2>
		<div class="limits">
			<p>
				<b>It is coverage, not competence.</b> It counts the techniques a person has cooked a dish for.
				It cannot see whether the plate was any good on most dishes: {ASSESS.assessable} of the guide’s {ASSESS.corpus} are now assessable, {ASSESS.dishStandards} against a standard of their own and {ASSESS.byTechnique} against the techniques they exercise, so “to a standard” is always a floor and never a measure.assessable} of the
				guide's {ASSESS.corpus} are now assessable, {ASSESS.dishStandards} against a standard of
				their own and {ASSESS.byTechnique} against the techniques they exercise, so “to a standard”
				is always a floor and never a measure.
			</p>
			<p>
				<b>It is not a training record and must not be used as one.</b> Nothing here is dated, exported
				or signed off, and it certifies nobody. If you need a record for an inspector or an auditor,
				this is not it.
			</p>
			<p>
				<b>It shows coverage because we chose to, not because we must.</b> This device can read every
				profile's whole session: the key is reconstructible and the shared layer already does it
				elsewhere. Answers, notes and family recipes are not shown here because a shared tablet exists
				so a brigade can share a device, not so a manager can read somebody's notebook.
			</p>
			{#if data.stations.foundation.length}
				<p>
					<b>Three techniques belong to everyone, so they count for nobody:</b>
					{data.stations.foundation.join(', ')}. They appear across every station, so knowing who has
					sweated an onion tells you nothing about who can cover the sauce.
				</p>
			{/if}
			{#if data.stations.undrilled.length}
				<p>
					<b>Two are excluded because the guide does not actually drill them:</b>
					{data.stations.undrilled.join(' and ')}. Their only recipes mention them in passing: a
					negative simile and a parchment lid, and crediting a cook for either would be a lie.
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
	.thin {
		border: 1px solid var(--line-strong);
		border-left: 3px solid var(--chili);
		border-radius: var(--radius);
		padding: 10px 12px;
		margin: 0 0 18px;
		line-height: 1.55;
	}
	/* Real colours, never stacked opacity: see shared/oot-home.css. */
	.cold {
		color: var(--chili);
	}
	.next {
		flex-basis: 100%;
		color: var(--ink-soft);
		font-size: var(--t-small, 0.8125rem);
	}
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
