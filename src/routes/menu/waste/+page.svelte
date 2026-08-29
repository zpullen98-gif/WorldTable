<script lang="ts">
	import { base } from '$app/paths';
	import { house } from '$lib/stores/house.svelte';
	import { money } from '$lib/costing';
	import { rollUpWaste, wasteHeadline, entryValue, type WasteEntry } from '$lib/waste';
	import { weekStartOf, recentWeeks } from '$lib/persistence/house';
	import Ornament from '$lib/components/Ornament.svelte';
	import { onMount } from 'svelte';

	/**
	 * The waste log: what died in the walk-in, and why.
	 *
	 * The guide asks for it by name and supplies the taxonomy; the five reason
	 * codes are gated against its prose in tools/derive/waste.mjs. What this page
	 * adds is the comparison the guide invites: it asserts that over-prepping is
	 * the most common villain, so a venue's own log can agree or disagree.
	 *
	 * VENUE-WIDE AND NEVER PER PERSON. There is no name on an entry and no field
	 * to put one in. See waste.ts. Nothing on this page can be filtered, sorted
	 * or grouped by who, because the record does not know.
	 *
	 * Everything below the H1 sits inside ONE <article class="sheet">:
	 * shared/oot-locks.js does a singular querySelector('article.sheet'), so a
	 * second sheet element here would simply not be seen.
	 */

	let { data } = $props();

	const REASONS = $derived(data.waste.reasons);
	const labelOf = (key: string) => REASONS.find((r) => r.key === key)?.label ?? key;

	/**
	 * The clock is $state and the week derives from it, so a tablet left open
	 * across midnight does not keep filing into yesterday. Same pattern the
	 * costing sheet uses, and for the same reason: vite.config.ts ships
	 * `registerType: 'prompt'`, so a pass tablet open for days is the design.
	 */
	let clock = $state(Date.now());
	onMount(() => {
		const resync = () => { if (!document.hidden) clock = Date.now(); };
		document.addEventListener('visibilitychange', resync);
		return () => document.removeEventListener('visibilitychange', resync);
	});

	const WEEKS = 8;
	const weeks = $derived(recentWeeks(WEEKS, new Date(clock)));
	/**
	 * Null until the cook PICKS a week, and the default follows the clock. The
	 * first version seeded state from weekStartOf(new Date()) at load, so a
	 * tablet open across Sunday midnight stayed pinned to the old week, and a
	 * bin logged after the boundary landed in the new week and vanished from
	 * the page that had just confirmed it. An explicit pick is a choice and
	 * sticks; a default is not and must not.
	 */
	let pickedWeek = $state<string | null>(null);
	const activeWeek = $derived(
		pickedWeek && weeks.includes(pickedWeek) ? pickedWeek : weekStartOf(new Date(clock))
	);

	const weekBounds = (w: string) => {
		const [y, m, d] = w.split('-').map(Number);
		const from = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
		const to = new Date(y, m - 1, d + 7, 0, 0, 0, 0).getTime();
		return { from, to };
	};

	const weekLabel = (w: string) => {
		const [y, m, d] = w.split('-').map(Number);
		return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	};

	/**
	 * What the kitchen actually cooked that week, at cost: the denominator the
	 * guide measures variance against. Only the dishes carrying BOTH a costing
	 * and a covers count for the week can contribute, and the page says so
	 * rather than quoting a share against a number nobody can see.
	 */
	const theoretical = $derived.by(() => {
		let total = 0;
		let dishes = 0;
		for (const d of house.dishes) {
			const c = house.costingFor(d.id);
			const sold = c.sales.find((s) => s.weekStart === activeWeek)?.count;
			if (!sold || sold <= 0) continue;
			const v = house.unitValueOf({ dishId: d.id });
			if (v === null) continue;
			total += v * sold;
			dishes += 1;
		}
		return { total, dishes };
	});

	const bounds = $derived(weekBounds(activeWeek));
	const rollup = $derived(
		rollUpWaste(house.waste, bounds.from, bounds.to, theoretical.total > 0 ? theoretical.total : null)
	);
	const headline = $derived(wasteHeadline(rollup, data.waste.villain, labelOf));

	const inWeek = $derived(
		house.waste.filter((w) => w.at >= bounds.from && w.at < bounds.to)
	);

	/** The venue's own currency mark, taken from a price they typed. */
	const sym = $derived.by(() => {
		const p = house.dishes.find((d) => d.price)?.price ?? '';
		const m = p.trim().match(/^[^\d\s.,-]+|[^\d\s.,-]+$/);
		return m ? m[0] : '';
	});

	/* ---- logging ----------------------------------------------------------- */

	type SourceKind = 'dish' | 'prep' | 'item' | 'other';

	/**
	 * `reason` starts EMPTY and the default comes from a derived, rather than
	 * seeding the state object from `data`. Reading a prop during state
	 * initialisation captures its first value, which is harmless on a prerendered
	 * page and still a warning, and this repo holds at zero. The select takes
	 * its value from the derived and writes back to the state.
	 */
	let form = $state({ kind: 'dish' as SourceKind, ref: '', label: '', qty: 1, reason: '' });

	/**
	 * Defaults to the villain: a log is opened when something has already gone
	 * wrong, and the guide's commonest answer should be the shortest reach.
	 */
	const reason = $derived(form.reason || data.waste.villain);

	const reset = () => {
		form = { kind: form.kind, ref: '', label: '', qty: 1, reason: form.reason };
	};

	const sourceOf = (): { dishId?: string; prepId?: string; itemSlug?: string } | undefined => {
		if (form.kind === 'dish' && form.ref) return { dishId: form.ref };
		if (form.kind === 'prep' && form.ref) return { prepId: form.ref };
		if (form.kind === 'item' && form.ref) return { itemSlug: form.ref };
		return undefined;
	};

	/** What the thing being logged is called, so the entry reads on its own later. */
	const labelFor = (): string => {
		if (form.kind === 'dish') return house.dishes.find((d) => d.id === form.ref)?.name ?? '';
		if (form.kind === 'prep') return house.prep(form.ref)?.name ?? '';
		if (form.kind === 'item') return house.item(form.ref)?.name ?? '';
		return form.label;
	};

	/** Shown before the tap, so nobody is surprised by what a bin was worth. */
	const preview = $derived.by(() => {
		const src = sourceOf();
		if (!src) return null;
		const unit = house.unitValueOf(src);
		return unit === null ? null : unit * (Number.isFinite(form.qty) ? form.qty : 0);
	});

	const canLog = $derived(
		!!labelFor().trim() && Number.isFinite(form.qty) && form.qty > 0 && !!reason
	);

	/** Read back after each log: the only confirmation used to be a new row
	 *  appearing further down the page, which assistive tech never hears and a
	 *  cook mid-rush never scrolls to check. */
	let logged = $state('');

	function submit() {
		if (!canLog) return;
		const label = labelFor();
		const entry = house.logWaste({ label, qty: form.qty, reason, source: sourceOf() });
		logged = entry
			? `Logged: ${label}, ${entry.qty} × ${REASONS.find((r) => r.key === entry.reason)?.label ?? entry.reason}.`
			: '';
		reset();
		clock = Date.now();
	}

	const unitWord = $derived(
		form.kind === 'dish' ? 'plates' : form.kind === 'prep' ? 'portions' : 'units'
	);

	const stamp = (at: number) =>
		new Date(at).toLocaleString(undefined, {
			weekday: 'short',
			hour: 'numeric',
			minute: '2-digit'
		});

	const valueOf = (w: WasteEntry) => entryValue(w);
</script>

<svelte:head><title>The Waste Log | The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<h1>The Waste Log</h1>
		<p class="lede">
			What died in the walk-in, and why. Venue-wide, never by person: the numbers are the
			kitchen's craft pride, not a surveillance state.
		</p>
		<nav class="tools" data-print="hide">
			<a class="chip" href="{base}/menu">← The worksheet</a>
			<a class="chip" href="{base}/menu/costing">The costing sheet</a>
			<a class="chip" href="{base}/menu/preps">Preps</a>
		</nav>
	</header>

	<article class="sheet">
		<Ornament seed="waste" />

		<!--
			The comparison is the point. The guide asserts a most-common cause, so a
			venue's own log can confirm it or contradict it, and a chef will not do
			that arithmetic in their head, which is to say never.
		-->
		{#if headline}
			<p class="headline">{headline}</p>
		{/if}

		<div class="weekbar" data-print="hide">
			<label>
				<span class="sr">Week</span>
				<select
					value={activeWeek}
					onchange={(ev) => (pickedWeek = (ev.currentTarget as HTMLSelectElement).value)}
				>
					{#each weeks as w (w)}
						<option value={w}>Week of {weekLabel(w)}</option>
					{/each}
				</select>
			</label>
			<span class="wktotal mono">{sym}{money(rollup.total)}</span>
			{#if rollup.shareOfCogsPct !== null && rollup.total > 0}
				<!--
					Qualified at the number itself, not in a footnote. An unqualified
					"waste is 6%" is the most quotable wrong figure this page could make.

					It reads "of what you cooked" and NOT "of the N dishes", which is what
					it said first: over an empty log that rendered as "0.0% of the 2
					dishes costed and counted this week", which parses as though none of
					the dishes had been costed. The denominator is money, not a count of
					dishes, and the count is the qualification rather than the subject.
					Hidden entirely at zero: a 0.0% share is not a finding, it is the
					absence of one, and the total beside it already says so.
				-->
				<span class="share"
					>{rollup.shareOfCogsPct.toFixed(1)}% of what you cooked, over the {theoretical.dishes}
					{theoretical.dishes === 1 ? 'dish' : 'dishes'} carrying both a costing and a covers count</span
				>
			{/if}
		</div>

		{#if rollup.unvalued}
			<p class="incomplete">
				{rollup.unvalued}
				{rollup.unvalued === 1 ? 'entry' : 'entries'} could not be priced when logged, so
				{rollup.unvalued === 1 ? 'it is' : 'they are'} counted but not in the total. Cost the dish or
				the prep and later bins will carry a figure.
			</p>
		{/if}

		{#if rollup.byReason.length}
			<h2 class="sec">Where it went</h2>
			<ul class="bars">
				{#each rollup.byReason as r (r.reason)}
					<li>
						<div class="barhead">
							<span class="rlabel">{labelOf(r.reason)}</span>
							<span class="rmoney mono">{sym}{money(r.money)}</span>
							<span class="rcount">{r.count} {r.count === 1 ? 'entry' : 'entries'}</span>
						</div>
						<!--
							The bar is a second reading of a number that is already written
							out, never the only one — same rule the verdicts follow.
						-->
						<div class="bar"><span style="width:{Math.max(r.pct, r.money > 0 ? 2 : 0)}%"></span></div>
					</li>
				{/each}
			</ul>
		{/if}

		<h2 class="sec">Log a bin</h2>
		<form
			class="logger"
			onsubmit={(ev) => {
				ev.preventDefault();
				submit();
			}}
		>
			<label>
				<span>What</span>
				<select
					bind:value={form.kind}
					onchange={() => {
						form.ref = '';
						form.label = '';
					}}
				>
					<option value="dish">A plate</option>
					<option value="prep">A prep</option>
					<option value="item">An ingredient</option>
					<option value="other">Something else</option>
				</select>
			</label>

			{#if form.kind === 'other'}
				<label class="grow">
					<span>Name</span>
					<input bind:value={form.label} placeholder="Two trays of croissants" />
				</label>
			{:else}
				<label class="grow">
					<span>Which</span>
					<select bind:value={form.ref}>
						<option value="">Choose…</option>
						{#if form.kind === 'dish'}
							{#each house.dishes as d (d.id)}<option value={d.id}>{d.name}</option>{/each}
						{:else if form.kind === 'prep'}
							{#each house.preps as p (p.id)}<option value={p.id}>{p.name}</option>{/each}
						{:else}
							{#each Object.values(house.items) as it (it.slug)}
								<option value={it.slug}>{it.name}</option>
							{/each}
						{/if}
					</select>
				</label>
			{/if}

			<label class="qty">
				<span>How many</span>
				<input type="number" min="0" step="0.01" bind:value={form.qty} />
				<em>{unitWord}</em>
			</label>

			<label class="grow">
				<span>Why</span>
				<select
					value={reason}
					onchange={(ev) => (form.reason = (ev.currentTarget as HTMLSelectElement).value)}
				>
					{#each REASONS as r (r.key)}<option value={r.key}>{r.label}</option>{/each}
				</select>
			</label>

			<div class="submit">
				<span class="prev mono" aria-live="polite">
					{#if preview !== null}{sym}{money(preview)}{:else if sourceOf()}not costed{:else}–{/if}
				</span>
				<button type="submit" disabled={!canLog}>Log it</button>
			</div>
		</form>

		<p class="hint" aria-live="polite">{REASONS.find((r) => r.key === reason)?.hint ?? ''}</p>
		{#if logged}
			<p class="logged" aria-live="polite">{logged}</p>
		{/if}

		{#if inWeek.length}
			<!-- Named by the week on show, because "this week" was a lie the moment
			     an earlier week was selected. -->
			<h2 class="sec">Week of {weekLabel(activeWeek)}, entry by entry</h2>
			<ul class="entries">
				{#each inWeek as w (w.id)}
					<li>
						<span class="when">{stamp(w.at)}</span>
						<span class="what">{w.label}</span>
						<span class="how">{w.qty} × {labelOf(w.reason)}</span>
						<span class="val mono"
							>{#if valueOf(w) === null}not costed{:else}{sym}{money(valueOf(w) ?? 0)}{/if}</span
						>
						<button
							class="x"
							data-print="hide"
							onclick={() => house.removeWaste(w.id)}
							aria-label="Remove {w.label}">✕</button
						>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="empty">
				Nothing logged in the week of {weekLabel(activeWeek)}. That is either a very good week or a
				log nobody opened — and the guide is clear which is more common.
			</p>
		{/if}

		<!--
			The refusal, stated on the page rather than only in a comment. A venue
			WILL ask for this, and the answer is better given before the question.
		-->
		<h2 class="sec">What this log will not do</h2>
		<p class="secnote">
			It records no names. Waste by cook is a disciplinary instrument, and a log people are afraid
			of goes dishonest inside a fortnight while still reading as evidence. There is no field for
			it on an entry, so no report can grow one later.
		</p>
		<p class="secnote">
			It has no code for theft, which the guide names as a leak and then answers with
			<em>“systems, not suspicion”</em>. Theft is what is left in the variance once this log has
			named everything it can, reached by counting, never by a button.
		</p>

		<h2 class="sec">The reading</h2>
		<ul class="reading">
			{#each Object.values(data.waste.entries) as e (e.slug)}
				<li><a href="{base}/lexicon#{e.slug}">{e.term}</a></li>
			{/each}
		</ul>
	</article>
</div>

<style>
	.headline {
		font-family: var(--display);
		font-size: var(--t-lede);
		color: var(--text);
		max-width: var(--measure);
		margin: 0 0 14px;
	}
	.weekbar {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 6px 14px;
		margin-bottom: 12px;
	}
	.wktotal {
		font-size: var(--t-lede);
		color: var(--text);
	}
	.share,
	.rcount {
		font-size: var(--t-small);
		color: var(--ink-soft);
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}
	.incomplete {
		font-size: var(--t-small);
		color: var(--chili);
		max-width: var(--measure);
		margin: 0 0 12px;
	}
	.sec {
		font-family: var(--display);
		font-size: var(--t-small);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--ink-soft);
		margin: 18px 0 8px;
	}
	.bars,
	.entries,
	.reading {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.bars li {
		margin-bottom: 8px;
	}
	.barhead {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 4px 10px;
	}
	.rlabel {
		color: var(--text);
	}
	.rmoney {
		color: var(--text);
	}
	.bar {
		margin-top: 3px;
		height: 6px;
		background: var(--paper-raised);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--turmeric-deep);
	}
	.logger {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 8px 12px;
	}
	.logger label {
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: var(--t-micro);
		color: var(--ink-soft);
	}
	.logger .grow {
		flex: 1 1 12rem;
	}
	.logger .qty {
		flex: 0 0 auto;
	}
	.logger .qty em {
		font-style: normal;
		font-size: var(--t-micro);
		color: var(--ink-soft);
	}
	.logger input,
	.logger select {
		font: inherit;
		padding: 4px 6px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--paper-raised);
		color: var(--text);
	}
	.logger .qty input {
		width: 6rem;
	}
	.submit {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.prev {
		color: var(--ink-soft);
		min-width: 5rem;
		text-align: right;
	}
	.hint {
		margin: 6px 0 0;
		font-size: var(--t-small);
		color: var(--ink-soft);
		max-width: var(--measure);
	}
	.logged {
		margin: 6px 0 0;
		font-size: var(--t-small);
		color: var(--turmeric-deep);
		max-width: var(--measure);
	}
	.entries li {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 4px 10px;
		padding: 5px 0;
		border-bottom: 1px solid var(--line);
	}
	.when {
		font-size: var(--t-micro);
		color: var(--ink-soft);
		min-width: 7rem;
	}
	.what {
		color: var(--text);
	}
	.how,
	.val {
		font-size: var(--t-small);
		color: var(--ink-soft);
	}
	.val {
		margin-left: auto;
	}
	.x {
		border: 0;
		background: none;
		color: var(--ink-soft);
		cursor: pointer;
		font-size: var(--t-small);
	}
	.x:hover,
	.x:focus-visible {
		color: var(--chili);
	}
	.empty,
	.secnote {
		font-size: var(--t-small);
		color: var(--ink-soft);
		max-width: var(--measure);
		margin: 0 0 10px;
	}
	.reading li {
		margin-bottom: 3px;
		font-size: var(--t-small);
	}
	.mono {
		font-variant-numeric: tabular-nums;
	}
</style>
