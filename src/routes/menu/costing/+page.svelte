<!--
  The Costing Sheet — what a plate costs, and what the menu earns.

  The guide has always carried this. "Menu Economics: Food Cost, Yield & Par"
  states food cost percent, contribution margin, par levels and the four
  menu-engineering quadrants, and it reaches three arbitrary recipes; fourteen
  of the forty-three Restaurant Finance entries reach none at all, because
  crosslinks.mjs scores a term against dish text and "COGS Control" has no dish.
  The least reachable content in the guide is what the paying venue needs most.

  So this is that entry made to compute, against the dishes a venue has already
  entered on The Kitchen's Menu — the one place in the app that knows a price.

  Everything below the H1 sits inside <article class="sheet"> deliberately:
  inside Outside Of Time this is a PAID surface, and the monorepo's lock masks
  `article.sheet` children on locked routes. An overlay alone is not a gate.
  Standalone, the class is inert. Same contract as /menu/quiz.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { session } from '$lib/stores/session.svelte';
	import type { CostLine } from '$lib/costing';
	import {
		dishEconomics,
		bandFor,
		engineerMenu,
		trueUnitCost,
		lineCost,
		parsePrice,
		money
	} from '$lib/costing';

	let { data } = $props();

	const dishes = $derived(session.menuDishes);
	const foodCostBand = $derived(data.economics.bands.find((b) => b.key === 'foodCost')!);

	/** Which dish's sheet is open. One at a time — this is a long form. */
	let openId = $state<string | null>(null);

	function mintLineId() {
		let s = 'c-';
		while (s.length < 10) s += Math.floor(Math.random() * 36).toString(36);
		return s;
	}

	/**
	 * The venue's price is free text, so the currency is whatever they typed.
	 * Reusing their symbol beats picking one and being wrong in every country
	 * but ours.
	 */
	function symbolOf(price: string): string {
		const m = price.trim().match(/^[^\d\s.,-]+|[^\d\s.,-]+$/);
		return m ? m[0] : '';
	}

	function linesFor(id: string): CostLine[] {
		return session.costingFor(id).lines;
	}

	function writeLines(id: string, lines: CostLine[]) {
		session.setCosting(id, { lines, sold: session.costingFor(id).sold });
	}

	function addLine(id: string) {
		writeLines(id, [
			...linesFor(id),
			{ id: mintLineId(), item: '', unitCost: 0, unit: 'kg', usedQty: 0, yieldPct: 100 }
		]);
	}

	function removeLine(id: string, lineId: string) {
		writeLines(
			id,
			linesFor(id).filter((l) => l.id !== lineId)
		);
	}

	/** Committed on change, never on input: setCosting writes to IndexedDB
	 *  immediately, and a keystroke-per-write on a numeric field is a lot of
	 *  writes for a number nobody has finished typing. */
	function editLine(id: string, lineId: string, patch: Partial<CostLine>) {
		writeLines(
			id,
			linesFor(id).map((l) => (l.id === lineId ? { ...l, ...patch } : l))
		);
	}

	function setSold(id: string, sold: number) {
		session.setCosting(id, { lines: linesFor(id), sold: Number.isFinite(sold) ? sold : undefined });
	}

	const num = (e: Event) => Number.parseFloat((e.currentTarget as HTMLInputElement).value);

	const economicsOf = (id: string, price: string) => dishEconomics(linesFor(id), price);

	const engineered = $derived(
		engineerMenu(
			dishes.map((d) => ({
				id: d.id,
				name: d.name,
				contribution: economicsOf(d.id, d.price).contribution,
				sold: session.costingFor(d.id).sold ?? null
			}))
		)
	);

	const quadrantOf = (key: string) => data.economics.quadrants.find((q) => q.key === key)!;

	/** Dishes with at least one costed line — the only ones with a real number. */
	const costed = $derived(dishes.filter((d) => linesFor(d.id).length > 0));
</script>

<svelte:head><title>The Costing Sheet — The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<p class="eyebrow"><a href="{base}/menu">The Kitchen's Menu</a></p>
		<h1>The Costing Sheet</h1>
		<p class="lede">
			What each plate costs once the bin is paid for, what it earns, and which dishes are carrying
			the menu. Your numbers stay on this device.
		</p>
	</header>

	<article class="sheet">
		{#if !dishes.length}
			<section class="empty">
				<p>
					Nothing to cost yet. The sheet works from the dishes on The Kitchen's Menu — the ones
					your house actually serves, with their prices.
				</p>
				<p><a class="chip" href="{base}/menu">Enter the menu</a></p>
			</section>
		{:else}
			<!-- The guide's warning, verbatim, because it is the reason this page
			     divides by yield instead of multiplying invoice prices. -->
			<p class="warn">
				<b>Yield first.</b>
				{data.economics.entries.menu.definition.includes('45% yield')
					? 'A $12/kg fish at 45% yield is really $26/kg on the plate —'
					: ''}
				{data.economics.yieldWarning}.
			</p>

			<h2 class="sec">The dishes</h2>
			<ul class="dishes">
				{#each dishes as d (d.id)}
					{@const e = economicsOf(d.id, d.price)}
					{@const verdict = bandFor(e.foodCostPct, foodCostBand)}
					{@const sym = symbolOf(d.price)}
					<li class:open={openId === d.id}>
						<button
							class="dishhead"
							onclick={() => (openId = openId === d.id ? null : d.id)}
							aria-expanded={openId === d.id}
						>
							<span class="nm">{d.name}</span>
							<span class="figures">
								{#if e.foodCostPct !== null}
									<span class="pct" data-verdict={verdict}>{e.foodCostPct.toFixed(1)}%</span>
								{:else}
									<span class="pct" data-verdict="unknown">no price</span>
								{/if}
								<span class="cost">{sym}{money(e.plateCost)} cost</span>
								{#if e.contribution !== null}
									<span class="cost">{sym}{money(e.contribution)} left</span>
								{/if}
							</span>
							<span class="chev" aria-hidden="true">{openId === d.id ? '−' : '+'}</span>
						</button>

						{#if openId === d.id}
							<div class="sheetbody">
								{#if !e.complete}
									<p class="incomplete" role="alert">
										One or more lines cannot be costed — a yield of zero, or a missing number. The
										total below leaves them out, so it is lower than the real plate cost.
									</p>
								{/if}

								<table>
									<thead>
										<tr>
											<th scope="col">Ingredient</th>
											<th scope="col">Cost per unit</th>
											<th scope="col">Unit</th>
											<th scope="col">Used</th>
											<th scope="col">Yield %</th>
											<th scope="col" class="r">True cost</th>
											<th scope="col" class="r">Line</th>
											<th><span class="sr">Remove</span></th>
										</tr>
									</thead>
									<tbody>
										{#each linesFor(d.id) as l (l.id)}
											{@const per = trueUnitCost(l.unitCost, l.yieldPct)}
											{@const total = lineCost(l)}
											<tr>
												<td>
													<input
														value={l.item}
														placeholder="Salmon fillet"
														aria-label="Ingredient"
														onchange={(ev) =>
															editLine(d.id, l.id, {
																item: (ev.currentTarget as HTMLInputElement).value
															})}
													/>
												</td>
												<td>
													<input
														type="number"
														step="0.01"
														min="0"
														value={l.unitCost}
														aria-label="Cost per unit"
														onchange={(ev) => editLine(d.id, l.id, { unitCost: num(ev) })}
													/>
												</td>
												<td>
													<input
														class="unit"
														value={l.unit}
														aria-label="Unit"
														onchange={(ev) =>
															editLine(d.id, l.id, {
																unit: (ev.currentTarget as HTMLInputElement).value
															})}
													/>
												</td>
												<td>
													<input
														type="number"
														step="0.001"
														min="0"
														value={l.usedQty}
														aria-label="Quantity used"
														onchange={(ev) => editLine(d.id, l.id, { usedQty: num(ev) })}
													/>
												</td>
												<td>
													<input
														type="number"
														step="1"
														min="1"
														max="100"
														value={l.yieldPct}
														aria-label="Yield percent"
														onchange={(ev) => editLine(d.id, l.id, { yieldPct: num(ev) })}
													/>
												</td>
												<td class="r mono">{per === null ? '—' : sym + money(per)}</td>
												<td class="r mono">{total === null ? '—' : sym + money(total)}</td>
												<td>
													<button
														class="x"
														onclick={() => removeLine(d.id, l.id)}
														aria-label="Remove {l.item || 'line'}">✕</button
													>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>

								<div class="sheetfoot">
									<button class="chip" onclick={() => addLine(d.id)}>+ Add an ingredient</button>
									<label class="sold">
										Sold this period
										<input
											type="number"
											min="0"
											step="1"
											value={session.costingFor(d.id).sold ?? ''}
											onchange={(ev) => setSold(d.id, num(ev))}
										/>
									</label>
								</div>

								<dl class="totals">
									<div>
										<dt>Plate cost</dt>
										<dd>{sym}{money(e.plateCost)}</dd>
									</div>
									<div>
										<dt>Menu price</dt>
										<dd>{e.price === null ? 'not set' : sym + money(e.price)}</dd>
									</div>
									<div>
										<dt>Food cost</dt>
										<dd data-verdict={verdict}>
											{e.foodCostPct === null ? '—' : e.foodCostPct.toFixed(1) + '%'}
										</dd>
									</div>
									<div>
										<dt>Contribution</dt>
										<dd>{e.contribution === null ? '—' : sym + money(e.contribution)}</dd>
									</div>
								</dl>

								{#if verdict === 'over'}
									<p class="verdictnote">
										Above the guide's {foodCostBand.lowPct}–{foodCostBand.highPct}% band. Cut cost or
										raise price — the guide's order is to reprice against invoice creep before
										touching the recipe.
									</p>
								{:else if verdict === 'under'}
									<p class="verdictnote">
										Below {foodCostBand.lowPct}%. Usually an incomplete sheet rather than a triumph —
										check nothing is missing before congratulating yourself.
									</p>
								{/if}
							</div>
						{/if}
					</li>
				{/each}
			</ul>

			<h2 class="sec">Menu engineering</h2>
			{#if engineered.length}
				<p class="secnote">
					Popularity against profit, ranked by what each dish actually contributes — because
					dollars pay rent and percentages do not. Needs a price and a sold count; {costed.length}
					of {dishes.length} dishes are costed.
				</p>
				<ul class="quadrants">
					{#each engineered as x (x.id)}
						{@const q = quadrantOf(x.quadrant)}
						<li>
							<span class="qlabel" data-q={x.quadrant}>{q.label}</span>
							<span class="qname">{x.name}</span>
							<span class="qfig">{x.sold} sold · {money(x.contribution)} each</span>
							<span class="qadvice">{q.advice}</span>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="secnote">
					Add a sold count to a costed, priced dish and the quadrants appear. Menu engineering
					needs both axes; a dish sitting at the origin because nobody typed a number is not a dog.
				</p>
			{/if}

			<section class="reading">
				<h2 class="sec">The reading</h2>
				<p class="secnote">Where every number on this page comes from.</p>
				<ul class="terms">
					{#each Object.values(data.economics.entries) as t (t.slug)}
						<li><a href="{base}/lexicon#{t.slug}">{t.term}</a></li>
					{/each}
				</ul>
			</section>
		{/if}
	</article>
</div>

<style>
	.head {
		margin-bottom: 22px;
	}
	.eyebrow a {
		color: var(--muted);
		font-size: var(--t-small);
	}
	h1 {
		font-size: var(--t-h1);
		margin: 4px 0 8px;
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
	.secnote {
		color: var(--ink-soft);
		max-width: var(--measure);
		font-size: var(--t-small);
		margin-bottom: 14px;
	}
	.warn,
	.incomplete,
	.verdictnote {
		padding: 9px 13px;
		border-left: 2px solid var(--turmeric-deep);
		background: var(--paper-raised);
		font-size: var(--t-small);
		line-height: 1.55;
		color: var(--ink);
		max-width: var(--measure);
	}
	.warn {
		margin: 0 0 6px;
	}
	.incomplete,
	.verdictnote {
		margin: 12px 0 0;
	}

	.dishes,
	.quadrants,
	.terms {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.dishes > li {
		border-bottom: 1px solid var(--line);
	}
	.dishhead {
		display: flex;
		align-items: baseline;
		gap: 12px;
		width: 100%;
		padding: 12px 0;
		background: none;
		border: 0;
		text-align: left;
		cursor: pointer;
		color: var(--ink);
		font: inherit;
	}
	.nm {
		flex: 1;
		min-width: 0;
		font-family: var(--display);
		font-size: 17px;
	}
	.figures {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
		justify-content: flex-end;
		font-size: var(--t-small);
		font-variant-numeric: tabular-nums;
	}
	.cost {
		color: var(--muted);
	}
	/* The verdict is carried by a word AND a weight, never by colour alone. */
	.pct[data-verdict='over'],
	dd[data-verdict='over'] {
		color: var(--turmeric-deep);
		font-weight: 600;
	}
	.pct[data-verdict='on'],
	dd[data-verdict='on'] {
		color: var(--ink);
	}
	.pct[data-verdict='under'],
	.pct[data-verdict='unknown'],
	dd[data-verdict='under'] {
		color: var(--muted);
	}
	.chev {
		flex: none;
		color: var(--muted);
	}

	.sheetbody {
		padding: 4px 0 18px;
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--t-small);
		min-width: 640px;
	}
	th {
		text-align: left;
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
		font-weight: 500;
		padding: 4px 6px;
		border-bottom: 1px solid var(--line);
	}
	td {
		padding: 4px 6px;
		border-bottom: 1px dotted var(--line);
	}
	.r {
		text-align: right;
	}
	.mono {
		font-variant-numeric: tabular-nums;
		color: var(--ink-soft);
	}
	input {
		font: inherit;
		width: 100%;
		min-width: 5.5em;
		padding: 5px 7px;
		border: 1px solid var(--line);
		background: var(--card, transparent);
		color: var(--ink);
		border-radius: var(--radius);
	}
	input.unit {
		min-width: 4em;
	}
	.x {
		background: none;
		border: 0;
		color: var(--muted);
		cursor: pointer;
		font: inherit;
		padding: 4px 6px;
	}
	.x:hover {
		color: var(--ink);
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}

	.sheetfoot {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: center;
		margin-top: 12px;
	}
	.sold {
		font-size: var(--t-small);
		color: var(--ink-soft);
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.sold input {
		width: 7em;
		min-width: 0;
	}

	.totals {
		display: flex;
		flex-wrap: wrap;
		gap: 22px;
		margin: 16px 0 0;
	}
	.totals dt {
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
	}
	.totals dd {
		margin: 3px 0 0;
		font-size: 19px;
		font-variant-numeric: tabular-nums;
	}

	.quadrants li {
		display: grid;
		grid-template-columns: 7.5em 1fr auto;
		gap: 4px 12px;
		padding: 10px 0;
		border-bottom: 1px solid var(--line);
		align-items: baseline;
	}
	.qlabel {
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
	}
	.qlabel[data-q='star'] {
		color: var(--turmeric-deep);
		font-weight: 600;
	}
	.qlabel[data-q='dog'] {
		color: var(--muted);
	}
	.qname {
		font-family: var(--display);
		font-size: 17px;
	}
	.qfig {
		font-size: var(--t-small);
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.qadvice {
		grid-column: 2 / -1;
		font-size: var(--t-small);
		color: var(--ink-soft);
		line-height: 1.5;
	}

	.terms li {
		padding: 5px 0;
	}
	.terms a {
		color: var(--ink-soft);
		font-size: var(--t-small);
	}
	.empty {
		max-width: var(--measure);
		color: var(--ink-soft);
	}
	.empty p {
		margin-bottom: 14px;
	}
</style>
