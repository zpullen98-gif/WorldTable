<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { house } from '$lib/stores/house.svelte';
	import { batchesNeeded, localDay } from '$lib/persistence/house';
	import { buildPass, clashesOver, clockFor, formatClockTime, daysEarlier } from '$lib/pass';
	import Ornament from '$lib/components/Ornament.svelte';

	/**
	 * The prep board: back-timing the DAY, not the service.
	 *
	 * The Pass back-times a service; nothing back-timed the morning that has to
	 * happen before it. On the floor the missing entity shows up as 8:20pm on a
	 * Saturday: the commis made "some" stock, because the prep list said "veal
	 * stock" with no number, and it is gone.
	 *
	 * Two things make this cheap to build. The scheduler is the SAME buildPass
	 * the service plan uses: back-timing is back-timing, and a prep deadline is
	 * just a different anchor. And the times are the chef's own from the prep
	 * record, not the guide's 86%-estimated step durations, so the plan is made
	 * of numbers somebody in this kitchen actually typed.
	 *
	 * One <article class="sheet">: shared/oot-locks.js:446 uses a singular
	 * querySelector('article.sheet').
	 */

	/* A fixed default rather than "now": this page is prerendered, and seeding
	   from the clock makes the served HTML disagree with the hydrated page. */
	let readyBy = $state('16:00');
	let hands = $state(1);
	let now = $state(0);
	onMount(() => {
		now = Date.now();
		// Resynced when the tab comes back: a pass tablet is open for days by
		// design (registerType: 'prompt'), and a board that froze "today" at
		// mount treats yesterday's walk-in count as this morning's after
		// midnight. Same pattern the costing sheet and the waste log use.
		const resync = () => {
			if (!document.hidden) now = Date.now();
		};
		document.addEventListener('visibilitychange', resync);
		return () => document.removeEventListener('visibilitychange', resync);
	});

	const today = $derived(localDay(new Date(now || Date.now())));

	const readyAt = $derived.by(() => {
		const [h, m] = readyBy.split(':').map(Number);
		const d = new Date(now || Date.now());
		d.setHours(h ?? 16, m ?? 0, 0, 0);
		// A deadline already past means today's prep is done; plan tomorrow's.
		if (d.getTime() < (now || Date.now())) d.setDate(d.getDate() + 1);
		return d;
	});

	/** Every prep, with what was counted and what that means. */
	const rows = $derived(
		house.preps.map((p) => {
			const count = house.countFor(p.id);
			const stale = !count || count.countedOn !== today;
			const onHand = count?.onHand ?? 0;
			/**
			 * BATCHES ARE COMPUTED ON ZERO WHEN THE COUNT IS STALE. The warning
			 * copy has said "an uncounted prep is treated as none on hand" since
			 * this board shipped, and the code believed yesterday's number anyway:
			 * which is exactly the failure countFor's own record documents: a
			 * count is only true for the day it was made, and a board that treats
			 * Tuesday's twelve portions as current sends a commis to make nothing.
			 * The input still shows the old figure (the easiest starting point for
			 * a recount), the meta names the day it came from, and the batch math
			 * trusts only today.
			 */
			return {
				prep: p,
				onHand,
				stale,
				countedOn: count?.countedOn,
				batches: batchesNeeded(p, stale ? 0 : onHand)
			};
		})
	);

	const toMake = $derived(rows.filter((r) => r.batches > 0));
	const uncounted = $derived(rows.filter((r) => r.stale));

	/**
	 * The plan.
	 *
	 * One step per prep: the make is the step, and its hands-on and unattended
	 * seconds are the chef's own. No course, so every prep lands on the same
	 * anchor: a prep deadline is a deadline, not a stagger.
	 *
	 * TIME IS NOT MULTIPLIED BY BATCH COUNT, and that is a decision rather than
	 * an oversight: two batches of stock is usually one bigger pot, not two
	 * sittings. The batch count is shown beside the row so a kitchen that really
	 * does run it twice can see what it is being told and judge for itself.
	 */
	const plan = $derived(
		buildPass(
			toMake.map((r) => ({
				slug: r.prep.id,
				name: r.prep.name,
				steps: [
					{
						text: r.batches > 1 ? `Make ${r.batches} batches` : 'Make it',
						handsOnSec: r.prep.handsOnSec,
						unattendedSec: r.prep.unattendedSec
					}
				]
			}))
		)
	);

	const clashes = $derived(clashesOver(plan.steps, hands));

	function whenLabel(min: number) {
		const at = clockFor(readyAt, min);
		const back = daysEarlier(readyAt, at);
		return back > 0 ? `${formatClockTime(at)} (${back === 1 ? 'the day before' : `${back} days before`})` : formatClockTime(at);
	}

	const startLabel = $derived(plan.lengthMin ? whenLabel(plan.lengthMin) : null);
	const hours = (sec: number) => (sec >= 3600 ? `${Math.round(sec / 360) / 10} h` : `${Math.round(sec / 60)} min`);
</script>

<svelte:head><title>The Prep Board: The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<h1>The Prep Board</h1>
		<p class="lede">
			Count the walk-in, and the day back-times itself. What to make, how many, and when to start
			so it is all done before service.
		</p>
		<nav class="tools" data-print="hide">
			<a class="chip" href="{base}/menu/preps">The preps</a>
			<a class="chip" href="{base}/menu">The worksheet</a>
		</nav>
	</header>

	<article class="sheet">
		<Ornament seed="prep-board" />

		{#if !house.preps.length}
			<p class="empty">
				No preps yet. <a href="{base}/menu/preps">Cost one</a> and it appears here with a par to count
				against.
			</p>
		{:else}
			<div class="controls" data-print="hide">
				<label>
					Ready by
					<input type="time" bind:value={readyBy} aria-label="Prep ready by" />
				</label>
				<span class="handslabel">Hands on prep</span>
				{#each [1, 2, 3, 4] as n (n)}
					<button class="chip" class:on={hands === n} aria-pressed={hands === n} onclick={() => (hands = n)}>
						{n}
					</button>
				{/each}
			</div>

			<h2 class="sec">The count</h2>
			{#if uncounted.length}
				<p class="warn">
					{uncounted.length} of {rows.length} not counted today. An uncounted prep is treated as
					<b>none on hand</b>, which will over-order rather than send a section out short, but count
					it and the board stops guessing.
				</p>
			{/if}
			<ul class="counts">
				{#each rows as r (r.prep.id)}
					<li>
						<span class="nm">{r.prep.name}</span>
						<label class="cnt">
							On hand
							<input
								type="number"
								min="0"
								value={r.onHand}
								aria-label="Portions of {r.prep.name} on hand"
								onchange={(e) => {
								// An emptied field is not a count of zero: Number('') === 0,
								// so one blur on a cleared box used to file "counted today,
								// none on hand", a real count nobody made. Empty removes
								// the count instead, which the board honestly shows as
								// "never counted".
								const v = e.currentTarget.value.trim();
								if (v === '') house.clearCount(r.prep.id);
								else house.setCount(r.prep.id, Number(v));
							}}
							/>
						</label>
						<span class="meta">
							par {r.prep.par}
							{#if r.stale}
								· <b class="warnish"
									>{r.countedOn
										? `counted ${r.countedOn}: treated as none until counted today`
										: 'never counted'}</b
								>
							{/if}
							{#if r.batches > 0}
								· <b>make {r.batches} {r.batches === 1 ? 'batch' : 'batches'}</b>
							{:else}
								· enough
							{/if}
						</span>
					</li>
				{/each}
			</ul>

			<h2 class="sec">The day</h2>
			{#if !toMake.length}
				<p class="empty">Nothing to make: everything is at or above par.</p>
			{:else}
				<p class="startline">
					{toMake.length}
					{toMake.length === 1 ? 'prep' : 'preps'} · {plan.handsOnMin} min of hands
					{#if startLabel}· start at <b>{startLabel}</b> to be ready by {formatClockTime(readyAt)}{/if}
				</p>

				{#each clashes as c, i (i)}
					<p class="clash">
						<b>{whenLabel(c.fromMin)}</b>: {c.dishes.join(' and ')} want {c.demand} pairs of hands for
						{c.fromMin - c.toMin} min, and there {hands === 1 ? 'is one' : `are ${hands}`}.
					</p>
				{/each}

				{#each plan.dishes.filter((d) => d.advance) as d (d.slug)}
					<p class="clash">
						<b>{d.name}</b> carries a wait too long to fit inside a prep day. Start it the day before.
					</p>
				{/each}

				<ol class="plan">
					{#each plan.steps as s (s.slug)}
						{@const row = toMake.find((r) => r.prep.id === s.slug)}
						<li>
							<span class="at">{whenLabel(s.startsAtMin)}</span>
							<span class="what">
								<b>{s.dish}</b>
								<span class="txt">{s.text}</span>
							</span>
							<span class="cost">
								{s.handsOnMin} min hands{#if s.unattendedMin}{' '}
									· then {hours(s.unattendedMin * 60)} unattended{/if}
								{#if row?.prep.station}· {row.prep.station}{/if}
							</span>
						</li>
					{/each}
					<li class="ready">
						<span class="at">{formatClockTime(readyAt)}</span>
						<span class="what"><b>All prep down</b></span>
						<span class="cost"></span>
					</li>
				</ol>
			{/if}
		{/if}
	</article>
</div>

<style>
	.head {
		padding: 26px 0 10px;
	}
	.lede {
		max-width: var(--measure);
		color: var(--ink-soft);
	}
	.tools,
	.controls {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		align-items: center;
		margin-top: 12px;
	}
	.controls label {
		display: flex;
		gap: 6px;
		align-items: center;
		font-size: var(--t-small, 0.8125rem);
	}
	.controls input[type='time'] {
		border: 1px solid var(--line);
		background: none;
		padding: 7px 9px;
		border-radius: var(--radius);
		min-height: 40px;
	}
	.handslabel {
		font-weight: 600;
		margin-left: 10px;
	}
	.counts {
		list-style: none;
		margin: 6px 0 18px;
		padding: 0;
	}
	.counts > li {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
		border-bottom: 1px solid var(--line);
		padding: 10px 0;
	}
	.nm {
		font-weight: 600;
		min-width: 14ch;
	}
	.cnt {
		display: flex;
		gap: 6px;
		align-items: center;
		font-size: var(--t-small, 0.8125rem);
		color: var(--ink-soft);
	}
	.cnt input {
		border: 1px solid var(--line);
		background: none;
		padding: 6px 8px;
		border-radius: var(--radius);
		min-height: 40px;
		width: 7ch;
	}
	.meta,
	.startline {
		color: var(--ink-soft);
		font-size: var(--t-small, 0.8125rem);
	}
	/* Real colours, never stacked opacity; see shared/oot-home.css. */
	.warn,
	.warnish,
	.clash {
		color: var(--chili);
	}
	.warn,
	.clash {
		font-size: var(--t-small, 0.8125rem);
		margin: 8px 0;
		line-height: 1.5;
	}
	.plan {
		list-style: none;
		margin: 10px 0 0;
		padding: 0;
	}
	.plan > li {
		display: grid;
		grid-template-columns: 9ch 1fr auto;
		gap: 12px;
		align-items: baseline;
		border-top: 1px solid var(--line);
		padding: 10px 0;
	}
	.at {
		font-variant-numeric: tabular-nums;
		color: var(--turmeric-deep);
	}
	.txt {
		display: block;
		color: var(--ink-soft);
	}
	.cost {
		color: var(--ink-soft);
		font-size: var(--t-small, 0.8125rem);
		white-space: nowrap;
	}
	.ready .at,
	.ready b {
		font-weight: 700;
	}
	.empty {
		color: var(--ink-soft);
		max-width: var(--measure);
	}
</style>
