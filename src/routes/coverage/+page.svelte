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

  ON OTHER PEOPLE'S DATA. This edition keeps ONE record per device and the page
  reads only that: profiles.list() is empty, loadAllSessions returns the
  device's own record under the name "This device", and every station shows
  one row. The copy is written in the singular for that reason, and the
  roster code path (people, thin, the tournant by name) stays behind
  `people.length > 1` for a venue edition that reads a brigade. When that
  returns, so does the plural, and so does the point that a manager device
  CAN read every profile's record (the key is `session::<id>`, deterministic)
  and shows coverage rather than answers as a choice, not a limit.
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
	let heldNames = $state<string[]>([]);
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
		// A HELD record - saved by a newer edition than this device runs - reads
		// as empty, and an empty cooked log would report that person as a gap on
		// every station. Excluded from the roster and named below instead.
		heldNames = sessions.filter((s) => s.held).map((s) => s.name);
		people = sessions
			.filter((s) => !s.held)
			.map((s) => ({
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
	// One person on the device makes every touched station "thin", which is
	// not a risk, it is the shape of a personal record. Only a roster has one.
	const thin = $derived(
		people.length < 2 ? [] : stations
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

<svelte:head><title>Coverage · The World Table</title></svelte:head>

<div class="shell view" data-print="hide">
	<header class="head">
		<h1>Coverage</h1>
		<p class="lede">
			Which stations you have done the work of, on this device. Not which you are qualified for:
			that is judged by watching somebody cook, and no list can do it.
		</p>
	</header>

	{#if !ready}
		<p class="note">Reading your stations…</p>
	{:else}
		<!-- The line that used to stand here told every reader their device was
		     not a manager's. There are no manager devices any more: this app
		     keeps one record per device, so the board below is simply yours. It
		     comes back with the venue edition, along with `manager` above. -->

		{#if showRisk}
			<p class="thin">
				{#if uncovered.length}
					<b>{listOf(uncovered.map((s) => s.name))}</b>
					{uncovered.length === 1 ? 'has' : 'have'} nothing cooked yet.
				{/if}
				{#if thin.length}
					<b>{listOf(thin.map((t) => t.name))}</b>
					{thin.length === 1 ? 'has' : 'have'} one person each: {listOf([...new Set(thin.map((t) => t.covers[0].name))])}.
				{/if}
			</p>
		{/if}

		{#if heldNames.length}
			<p class="note">
				{#if people.length + heldNames.length > 1}
					{heldNames.join(', ')} cooked on a newer edition of the app than this device runs; their
					coverage cannot be read here until it updates.
				{:else}
					The record on this device was saved by a newer edition of the app than this device runs;
					coverage cannot be read until it updates.
				{/if}
			</p>
		{/if}
		<h2 class="sec">What you can cover tonight</h2>
		<p class="secnote">
			Each station, with how much of it you have actually cooked. A station at zero is not a
			mistake: <b>nothing yet</b> is the most useful thing this board can tell you.
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
							<!-- A name only where there is more than one to tell apart: on a
							     device with one record the name is "This device", which is
							     the page's lede said in fewer words. -->
							{#if people.length > 1}<span class="who">{c.name}</span>{/if}
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
						<li class="empty">Nothing cooked here yet, on this device.</li>
					{/each}
				</ul>
			</section>
		{/each}

		{#if tournants.length}
			<h2 class="sec">The tournant</h2>
			<!-- data.stations.tournant is now the WHOLE sentence, closing paren
			     included (stations.mjs's TOURNANT_QUOTE) - this used to append a
			     literal ")" to a gate-probe PREFIX, which silently dropped the
			     guide's actual second clause, "often the best pure cook in the
			     building". -->
			<p class="secnote">“{data.stations.tournant}”, the guide's own words.</p>
			<p class="tournant">
				{people.length > 1 ? tournants.map((p) => p.name).join(', ') : 'Every station on the line, cooked on this device.'}
			</p>
		{/if}

		<h2 class="sec">What this board does not say</h2>
		<div class="limits">
			<p>
				<b>It is coverage, not competence.</b> It counts the techniques you have cooked a dish for.
				It cannot see whether the plate was any good: {ASSESS.assessable} of the guide’s
				{ASSESS.corpus} are now assessable, {ASSESS.dishStandards} against a standard of their own
				and {ASSESS.byTechnique} against the techniques they exercise, so “to a standard” is always
				a floor and never a measure - the board grades against no dish's plate, not even those
				{ASSESS.assessable}.
			</p>
			<p>
				<b>It is not a training record and must not be used as one.</b> Nothing here is dated, exported
				or signed off, and it certifies nobody. If you need a record for an inspector or an auditor,
				this is not it.
			</p>
			<p>
				<b>It shows coverage and nothing more, by choice.</b> This device keeps one record and this
				board reads only that: the cooked log, counted by station. Answers, notes and family recipes
				stay where they were written, and nothing on this board is sent anywhere.
			</p>
			{#if data.stations.foundation.length}
				<p>
					<b>Three techniques belong to everyone, so they count for nobody:</b>
					{data.stations.foundation.join(', ')}. They appear across every station, so having sweated an
					onion says nothing about whether you can cover the sauce.
				</p>
			{/if}
			<!--
				The "excluded techniques" paragraph lived here and is deleted rather than
				updated. UNDRILLED is empty now: its one entry was 'The soufflé', excluded
				because its only recipe carried the label on a negative simile, and the
				corpus turned out to have a real soufflé all along that the keyword never
				matched. The copy was already false before that - it read "Two are
				excluded... a negative simile and a parchment lid" while stations.json had
				shipped one entry since the pleating half was lifted, and no gate covers
				prose, which is why it drifted unnoticed.

				If an exclusion is ever justified again, write the sentence with it: the
				reason is per-entry prose and cannot be derived from the data.
			-->
			<p>
				<b>The line is not evenly weighted, and that is the guide's shape.</b> Pâtissier owns
				{stations.find((s) => s.key === 'patissier')?.techniques.length} techniques and poissonnier
				{stations.find((s) => s.key === 'poissonnier')?.techniques.length}. Losing the fish cook is
				survivable; losing the pastry cook is not.
			</p>
		</div>
	{/if}

	<!-- Service, not Practise. The layout's OWNS map files /coverage under
	     Service and the Service tab is what lights here, so an exit to Practise
	     sent a cook to a page whose tab was not the lit one and which shows no
	     way back unless this device is a manager's. The Service hub now carries
	     the entrance, so the way in, the way out and the lit tab all agree. -->
	<p class="back"><a href="{base}/service">Back to Service</a></p>
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
