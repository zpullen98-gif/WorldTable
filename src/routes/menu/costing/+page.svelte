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
	import { house } from '$lib/stores/house.svelte';
	import type { CostLine } from '$lib/costing';
	import {
		dishEconomics,
		bandFor,
		engineerMenu,
		trueUnitCost,
		lineCost,
		parsePrice,
		money,
		rollUpMenu,
		resolveLines,
		prepPortionCost,
		netOfTax
	} from '$lib/costing';
	import {
		itemSlugOf,
		currentPrice,
		previousPrice,
		measuredYieldPct,
		itemUsage,
		type ItemUsage
	} from '$lib/items';
	import { costingCsv, csvFilename } from '$lib/costing-csv';
	import { weekStartOf } from '$lib/persistence/house';
	import { onMount } from 'svelte';

	let { data } = $props();

	const dishes = $derived(house.dishes);
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
		return house.costingFor(id).lines;
	}

	/**
	 * The lines with every prep flattened into a plain purchase line.
	 *
	 * Resolved HERE, at the call site, rather than inside costing.ts — so
	 * plateCost and its tests keep seeing only arithmetic they already know, and
	 * the editable list above stays exactly what the venue typed.
	 *
	 * An unfinished prep comes back uncostable, which is deliberate: one blank
	 * line inside the demi understates every dish the sauce goes on, and that is
	 * the error the `complete` flag exists to refuse, multiplied.
	 */
	const resolvedFor = (id: string) => resolveLines(linesFor(id), house.preps, house.pricedItems).lines;

	/**
	 * The current week, and why it is not a constant.
	 *
	 * `clock` is $state and `thisWeek` derives from it, so the week is never
	 * captured. vite.config.ts ships `registerType: 'prompt'` with
	 * `skipWaiting: false` — "never reload the page out from under a cook" — so a
	 * pass tablet is open for days by design, and a week frozen at page load
	 * would quietly file Thursday's covers under a Monday that has passed.
	 *
	 * Resynced when the document becomes visible, the pattern already shipped in
	 * timers.svelte.ts, and bumped after every write.
	 */
	let clock = $state(Date.now());
	const thisWeek = $derived(weekStartOf(new Date(clock)));

	onMount(() => {
		const onVis = () => {
			if (document.visibilityState === 'visible') clock = Date.now();
		};
		document.addEventListener('visibilitychange', onVis);
		return () => document.removeEventListener('visibilitychange', onVis);
	});

	/** Covers filed for the current week, or null when nobody has counted it. */
	const coversThisWeek = (id: string) =>
		house.costingFor(id).sales.find((w) => w.weekStart === thisWeek)?.count ?? null;

	/**
	 * The weeks actually STORED, newest first — not a computed range of the last
	 * four Mondays looked up one by one. A range hides a misfiled week (the
	 * dead-battery tablet, the hour-off key), and hiding is what turns a visible
	 * duplicate into silent loss.
	 */
	const priorWeeks = (id: string) =>
		house.costingFor(id).sales.filter((w) => w.weekStart !== thisWeek).slice(0, 4);

	/** Monday 5 Jan → "5–11 Jan", so the input says which week it is filing. */
	function weekLabel(weekStart: string) {
		const [y, m, d] = weekStart.split('-').map(Number);
		const mon = new Date(y, m - 1, d, 12);
		const sun = new Date(y, m - 1, d + 6, 12);
		const f = (x: Date, withMonth: boolean) =>
			withMonth ? `${x.getDate()} ${x.toLocaleString(undefined, { month: 'short' })}` : `${x.getDate()}`;
		return `${f(mon, mon.getMonth() !== sun.getMonth())}–${f(sun, true)}`;
	}

	const prepOf = (l: CostLine) => (l.prepId ? house.prep(l.prepId) : undefined);
	const perPortionOf = (l: CostLine) => {
		const p = prepOf(l);
		return p ? prepPortionCost(p, house.pricedItems) : null;
	};

	function addPrepLine(id: string, prepId: string) {
		const p = house.prep(prepId);
		if (!p) return;
		writeLines(id, [
			...linesFor(id),
			{
				id: mintLineId(),
				item: p.name,
				unitCost: 0,
				unit: 'portion',
				usedQty: 1,
				// Locked at 100 by the resolver too; set here so the stored line
				// never carries a yield that would look like it was applied.
				yieldPct: 100,
				prepId
			}
		]);
	}

	function writeLines(id: string, lines: CostLine[]) {
		// A patch. It used to pass `sold` back in, which meant an ingredient edit
		// rewrote the covers figure too — the shape that would have dropped a
		// whole history the moment covers became one.
		house.setCosting(id, { lines });
	}

	function addLine(id: string) {
		writeLines(id, [
			...linesFor(id),
			/**
			 * unitCost is minted NaN, not 0. Zero read as "a completed free
			 * ingredient": lineCost(0 × qty) = 0, complete stayed true, and a
			 * sheet full of untyped lines showed a confident cheap plate. NaN is
			 * what the sheet already refuses loudly — the number input renders it
			 * as an empty box, which is exactly what an untyped price is.
			 */
			{ id: mintLineId(), item: '', unitCost: Number.NaN, unit: 'kg', usedQty: 0, yieldPct: 100 }
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

	/**
	 * Rebuild one line wholesale.
	 *
	 * editLine cannot unlink: `{ itemSlug: undefined }` leaves the KEY in place,
	 * structuredClone preserves a key whose value is undefined, and the line
	 * would still read as book-backed to anything checking `'itemSlug' in l`.
	 * state.ts learned the same lesson about `sold`.
	 */
	function rewriteLine(id: string, lineId: string, next: (l: CostLine) => CostLine) {
		writeLines(
			id,
			linesFor(id).map((l) => (l.id === lineId ? next(l) : l))
		);
	}

	/* ---- the item book ----------------------------------------------------
	 *
	 * THE WHOLE INTERACTION, because it is easy to get wrong in the direction
	 * that makes the sheet stop being opened.
	 *
	 * A named line carrying a real price is in the book and follows the book.
	 * Nobody is ever asked to set up master data first: the book is filled by
	 * the costing somebody was doing anyway, and the datalist then offers the
	 * spelling that already exists so one purchase does not become two.
	 *
	 * Following the book is what makes the feature worth having — repricing
	 * butter once moves every dish that buys it, which is the thing that was
	 * impossible before. Two dishes cannot buy the same butter at two prices; if
	 * they genuinely are two butters, they get two names, and the datalist makes
	 * that visible at the moment of typing. `unlink` is the escape hatch for the
	 * one-off truffle, and it leaves the number that was on screen behind rather
	 * than a zero.
	 */

	/** Committing a NAME. */
	function commitItem(dishId: string, l: CostLine, name: string) {
		const slug = itemSlugOf(name);
		const known = slug ? house.item(slug) : undefined;
		const price = currentPrice(known);

		// Renaming a linked line onto something the book has never heard of
		// unlinks it rather than dragging the old item's price along under a new
		// word — the price on screen would then belong to neither name.
		if (l.itemSlug && !known) {
			rewriteLine(dishId, l.id, ({ itemSlug: _drop, ...rest }) => ({ ...rest, item: name }));
			return;
		}

		if (price) {
			// The book already knows this thing. Follow it — and take its price,
			// because a line showing 6.40 beside a book that says 7.90 is the
			// stale number this page exists to stop.
			editLine(dishId, l.id, {
				item: name,
				itemSlug: slug,
				unitCost: price.unitCost,
				unit: price.unit
			});
			return;
		}

		// Unknown, or known but never priced. If this row already carries a real
		// price it becomes the book's first observation and the row follows it.
		editLine(dishId, l.id, { item: name });
		if (l.unitCost > 0) {
			house.recordItemPrice(name, l.unitCost, l.unit);
			if (house.item(slug)) editLine(dishId, l.id, { itemSlug: slug });
		}
	}

	/** Committing a PRICE. On a book-backed line this reprices every dish. */
	function commitPrice(dishId: string, l: CostLine, unitCost: number) {
		const name = l.item.trim();
		if (!name || !Number.isFinite(unitCost) || unitCost <= 0) {
			editLine(dishId, l.id, { unitCost });
			return;
		}
		house.recordItemPrice(name, unitCost, l.unit);
		const slug = itemSlugOf(name);
		// unitCost is kept on the line as well as in the book. It is not read
		// while the line is linked, and it is what the row falls back to the
		// moment somebody unlinks — a row that unlinked to 0.00 would be worse
		// than never having linked.
		editLine(dishId, l.id, house.item(slug) ? { unitCost, itemSlug: slug } : { unitCost });
	}

	/** Committing a UNIT. */
	function commitUnit(dishId: string, l: CostLine, unit: string) {
		editLine(dishId, l.id, { unit });
		if (!l.itemSlug) return;
		const p = currentPrice(house.item(l.itemSlug));
		// A purchase unit is part of what a price MEANS: 7.90 a kilo and 7.90 a
		// case are not the same fact, so the pair is filed together.
		if (p) house.recordItemPrice(l.item, p.unitCost, unit);
	}

	function unlinkLine(dishId: string, l: CostLine) {
		const p = currentPrice(house.item(l.itemSlug ?? ''));
		rewriteLine(dishId, l.id, ({ itemSlug: _drop, ...rest }) => ({
			...rest,
			// Keep the number that was on screen. The book keeps its history.
			unitCost: p ? p.unitCost : rest.unitCost
		}));
	}

	function linkLine(dishId: string, l: CostLine) {
		const slug = itemSlugOf(l.item);
		const p = currentPrice(house.item(slug));
		if (!p) return;
		editLine(dishId, l.id, { itemSlug: slug, unitCost: p.unitCost, unit: p.unit });
	}

	/** The book price a line COULD follow but is not following. */
	const bookPriceFor = (l: CostLine) =>
		l.itemSlug || !l.item.trim() ? null : currentPrice(house.item(itemSlugOf(l.item)));

	/**
	 * The measured yield a line could adopt. Offered on ANY line naming a
	 * tested item, linked or not — the yield is about the knife work, not the
	 * price — but only when it differs from what the line already says, because
	 * a chip repeating the current value is furniture.
	 */
	const bookYieldFor = (l: CostLine): number | null => {
		if (l.prepId || !l.item.trim()) return null;
		const y = measuredYieldPct(house.item(l.itemSlug ?? itemSlugOf(l.item)));
		if (y === null) return null;
		return Math.abs(y - l.yieldPct) < 0.5 ? null : y;
	};

	/** Per-row yield test entry: which item's mini-form is open, and its fields. */
	let yieldForm = $state<{ slug: string; gross: number | null; usable: number | null } | null>(null);

	function logYieldTest(name: string) {
		if (!yieldForm || yieldForm.gross === null || yieldForm.usable === null) return;
		house.recordItemYield(name, yieldForm.gross, yieldForm.usable);
		yieldForm = null;
	}

	/**
	 * The sheet as a CSV. One-way by decision — the .wtjson is the only import
	 * path this app will ever have — and cut for the person who does not run
	 * the app: the accountant, the partner, the bank.
	 */
	function downloadCsv() {
		const csv = costingCsv(
			dishes.map((d) => ({
				id: d.id,
				name: d.name,
				price: d.price,
				lines: linesFor(d.id),
				sold: house.costingFor(d.id).sales.find((w) => w.weekStart === thisWeek)?.count ?? null
			})),
			house.preps,
			house.pricedItems,
			house.tax.inclusive ? house.tax : undefined,
			thisWeek
		);
		const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = csvFilename();
		a.click();
		URL.revokeObjectURL(url);
	}

	/**
	 * The book, with what each price actually reaches.
	 *
	 * The band verdict is computed here rather than in items.ts because it
	 * depends on the price the venue typed and the tax setting, which are this
	 * page's business and not that module's.
	 */
	const usage = $derived(
		itemUsage(
			house.items,
			dishes.map((d) => ({
				id: d.id,
				lines: linesFor(d.id),
				verdict: bandFor(economicsOf(d.id, d.price).foodCostPct, foodCostBand)
			})),
			house.preps
		)
	);

	/** Only the rows worth reading: something the menu actually buys. */
	const usedItems = $derived(usage.filter((u) => u.dishIds.length > 0));

	const dishName = (id: string) => dishes.find((d) => d.id === id)?.name ?? 'a dish';

	/** The venue's own currency mark, for figures that belong to no one dish. */
	const menuSym = $derived(symbolOf(dishes.find((d) => d.price)?.price ?? ''));

	/**
	 * The sentence the book exists to say, built from the venue's own numbers.
	 * Never invented: an item nothing has drifted on says so plainly.
	 */
	function usageLine(u: ItemUsage): string {
		const n = u.dishIds.length;
		const out = u.outOfBandIds.length;
		const used = `Used in ${n} ${n === 1 ? 'dish' : 'dishes'}.`;
		const band = `${foodCostBand.lowPct}–${foodCostBand.highPct}% band`;
		if (!out) return `${used} None above the ${band}.`;
		// "Above", not "moved out of". The book knows the price moved and it
		// knows the dish is over — it does not know the first caused the second,
		// and a sentence a chef reprices a menu from should not imply it.
		return `${used} ${out} ${out === 1 ? 'is' : 'are'} above the ${band}.`;
	}

	/**
	 * File this week's covers.
	 *
	 * An empty box clears THIS WEEK only — never `sales: []`, never by omitting
	 * the key. One blur on an empty field must not be able to destroy five weeks
	 * of counting.
	 */
	function setSold(id: string, sold: number) {
		if (Number.isFinite(sold)) house.setCovers(id, sold, thisWeek);
		else house.clearCovers(id, thisWeek);
		// A write that crossed midnight on a Sunday should correct its own label.
		clock = Date.now();
	}

	const num = (e: Event) => Number.parseFloat((e.currentTarget as HTMLInputElement).value);

	/**
	 * Costed on NET revenue.
	 *
	 * The typed price is what the guest pays. Where that includes tax the venue
	 * never sees the tax, so costing against it overstates contribution and
	 * understates food cost on every dish at once. Off unless a venue says so.
	 */
	const netPriceOf = (price: string) =>
		house.tax.inclusive ? netOfTax(parsePrice(price), house.tax.ratePct) : parsePrice(price);
	/** A worked example from the venue's own first priced dish, not an invented one. */
	const sampleGross = $derived(dishes.find((d) => parsePrice(d.price) !== null)?.price ?? '18.00');
	const sampleNet = $derived(
		money(netOfTax(parsePrice(sampleGross), house.tax.ratePct) ?? 0)
	);

	const economicsOf = (id: string, price: string) =>
		dishEconomics(resolvedFor(id), netPriceOf(price));

	const engineered = $derived(
		engineerMenu(
			dishes.map((d) => {
				const e = economicsOf(d.id, d.price);
				return {
					id: d.id,
					name: d.name,
					contribution: e.contribution,
					// This week if it has been counted, else the newest figure the record
					// carries — which for a venue that predates weekly covers is its
					// original undated number, mirrored by normaliseCosting. So the
					// board does not go blank on update day for anybody.
					sold: coversThisWeek(d.id) ?? house.costingFor(d.id).sold ?? null,
					costed: linesFor(d.id).length > 0 && e.complete
				};
			})
		)
	);

	const quadrantOf = (key: string) => data.economics.quadrants.find((q) => q.key === key)!;

	/**
	 * What the whole menu adds up to.
	 *
	 * The sheet ranked dishes and never summed them, so "our food cost is 31%"
	 * was the arithmetic mean of the dish percentages. The plowhorse at 42% is a
	 * third of covers and the puzzle at 22% sells four a week — the figure the
	 * venue actually runs at is weighted by what sold.
	 */
	const rollup = $derived(
		rollUpMenu(
			dishes.map((d) => {
				const e = economicsOf(d.id, d.price);
				return {
					id: d.id,
					name: d.name,
					plateCost: e.plateCost,
					price: e.price,
					sold: coversThisWeek(d.id) ?? house.costingFor(d.id).sold ?? null,
					costed: linesFor(d.id).length > 0 && e.complete
				};
			})
		)
	);

	/**
	 * How many of the rollup's counts actually came from THIS week, and how
	 * many are the fallback (an earlier week, or the pre-weekly undated
	 * mirror). The fallback is deliberate — no board goes blank on update day —
	 * but the label used to say "for the week of X" over all of it, which made
	 * the fallback a lie instead of a kindness. Now the sentence says both.
	 */
	const coversBasis = $derived.by(() => {
		let thisWeek = 0;
		let carried = 0;
		for (const d of dishes) {
			if (coversThisWeek(d.id) !== undefined && coversThisWeek(d.id) !== null) thisWeek++;
			else if ((house.costingFor(d.id).sold ?? null) !== null) carried++;
		}
		return { thisWeek, carried };
	});

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
		<!--
			Stated, not assumed. A venue that has not turned this on is costing
			against the number on the menu, which is correct in a tax-exclusive
			market and overstates contribution on every dish in a tax-inclusive
			one. Either way it says which it is doing.
		-->
		<div class="taxrow" data-print="hide">
			<label>
				<input
					type="checkbox"
					checked={house.tax.inclusive}
					onchange={(e) => house.setTax(e.currentTarget.checked, house.tax.ratePct || 20)}
				/>
				Menu prices include tax
			</label>
			{#if house.tax.inclusive}
				<label>
					at
					<input
						class="rate"
						type="number"
						min="0"
						max="100"
						step="0.5"
						aria-label="Tax rate, percent"
						value={house.tax.ratePct}
						onchange={(e) => house.setTax(true, Number(e.currentTarget.value))}
					/>
					%
				</label>
			{/if}
			<span class="taxnote">
				{#if house.tax.inclusive}
					Every figure below is computed on net revenue.
				{:else}
					Figures are computed on the price as typed. Turn this on if your menu prices include
					tax — otherwise contribution reads high on every dish.
				{/if}
			</span>
		</div>
		{#if house.tax.inclusive}
			<p class="taxstated">
				Prices are tax-inclusive at {house.tax.ratePct}%. All figures are computed on net revenue —
				an {sampleGross} menu price is {sampleNet} to the venue.
			</p>
		{/if}

		<!--
			Filled from what the venue has already typed. This IS the onboarding —
			there is no master-data screen, and there is never going to be one.
		-->
		<datalist id="item-book">
			{#each house.itemNames as n (n)}<option value={n}></option>{/each}
		</datalist>

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
											<!--
												Money is read from the RESOLVED line, never the stored one.
												A prep-backed line stores unitCost 0 because its price comes
												from the prep, so costing this row raw would print 0.00 in
												the table while the total underneath was right — a wrong
												number sitting next to a correct one, which is worse than
												either.
											-->
											{@const rl = resolveLines([l], house.preps, house.pricedItems).lines[0]}
											{@const per = trueUnitCost(rl.unitCost, rl.yieldPct)}
											{@const total = lineCost(rl)}
											{@const bp = bookPriceFor(l)}
											<tr>
												<td>
													<input
														list={l.prepId ? undefined : 'item-book'}
														value={l.item}
														placeholder="Salmon fillet"
														aria-label="Ingredient"
														onchange={(ev) =>
															l.prepId
																? editLine(d.id, l.id, {
																		item: (ev.currentTarget as HTMLInputElement).value
																	})
																: commitItem(d.id, l, (ev.currentTarget as HTMLInputElement).value)}
													/>
													{#if l.itemSlug}
														<button
															class="book"
															onclick={() => unlinkLine(d.id, l)}
															title="Stop following the item book on this line. The price stays as it is now."
															>follows the book ✕</button
														>
													{:else if bp}
														<button
															class="book use"
															onclick={() => linkLine(d.id, l)}
															title="Take the price the venue is paying, and follow it from here"
															>book: {sym}{money(bp.unitCost)}/{bp.unit}</button
														>
													{/if}
												</td>
												<td>
													{#if l.prepId}
														<!-- Not editable, because it is not this sheet's number:
														     it comes from the prep, and typing over it here would
														     be the retyped guess this object exists to end. -->
														<input
															type="number"
															step="0.01"
															value={rl.unitCost}
															aria-label="Cost per portion, from the prep"
															readonly
															title="From the prep — edit it on the Preps sheet"
														/>
													{:else if l.itemSlug}
														<!-- Editable, and the edit goes to the BOOK. That is the whole
														     feature: repricing butter here moves every dish that buys
														     it, which is the thing that could not be done at all. -->
														<input
															type="number"
															step="0.01"
															min="0"
															value={rl.unitCost}
															aria-label="Cost per unit, from the item book"
															title="From the item book — changing it reprices every dish that buys this"
															onchange={(ev) => commitPrice(d.id, l, num(ev))}
														/>
													{:else}
														<input
															type="number"
															step="0.01"
															min="0"
															value={l.unitCost}
															aria-label="Cost per unit"
															onchange={(ev) => commitPrice(d.id, l, num(ev))}
														/>
													{/if}
												</td>
												<td>
													<input
														class="unit"
														value={l.unit}
														aria-label="Unit"
														onchange={(ev) =>
															commitUnit(d.id, l, (ev.currentTarget as HTMLInputElement).value)}
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
													{#if bookYieldFor(l) !== null}
														<button
															class="book use"
															onclick={() => editLine(d.id, l.id, { yieldPct: Math.round(bookYieldFor(l)!) })}
															title="Apply the yield the venue measured for this item"
															>measured: {bookYieldFor(l)!.toFixed(0)}%</button
														>
													{/if}
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
									{#if house.preps.length}
										<!-- The join that pays for the whole prep object: the sauce is
										     costed once, here it is just chosen. -->
										<select
											class="chip"
											aria-label="Add a prep to {d.name}"
											onchange={(e) => {
												if (e.currentTarget.value) addPrepLine(d.id, e.currentTarget.value);
												e.currentTarget.value = '';
											}}
										>
											<option value="">+ Add a prep…</option>
											{#each house.preps as p (p.id)}<option value={p.id}>{p.name}</option>{/each}
										</select>
									{:else}
										<a class="chip" href="{base}/menu/preps">+ Cost a prep first ▸</a>
									{/if}
									<label class="sold">
										Covers, {weekLabel(thisWeek)}
										<input
											type="number"
											min="0"
											step="1"
											aria-label="Covers for {d.name}, week of {thisWeek}"
											value={coversThisWeek(d.id) ?? ''}
											onchange={(ev) => setSold(d.id, num(ev))}
										/>
									</label>
									{#if priorWeeks(d.id).length}
										<!--
											The weeks actually STORED, not a computed range of the last four
											Mondays looked up one by one. A range hides a misfiled week — the
											dead-battery tablet, the hour-off key — and hiding is what turns
											a visible duplicate into silent loss.
										-->
										<p class="weeks">
											{#each priorWeeks(d.id) as w, i (w.weekStart)}
												{#if i > 0}<span class="weeksep" aria-hidden="true">·</span>{/if}
												<!-- The meaning lived only in title attributes, which touch
												     devices never show and screen readers rarely read. The
												     visible form stays compact; the full sentence rides in
												     visually-hidden text. -->
												<span title={"Week of " + w.weekStart}>
													<span class="sr">week of {w.weekStart}:</span>
													{w.count}{#if w.prev !== undefined}<b
															class="replaced"
															title={"An import replaced " + w.prev}
															><span aria-hidden="true">*</span><span class="sr"
																>— an import replaced {w.prev}</span
															></b
														>{/if}
												</span>
											{/each}
											<span class="weeksnote">earlier weeks</span>
										</p>
									{/if}
								</div>

								<dl class="totals">
									<div>
										<dt>Plate cost</dt>
										<dd>{sym}{money(e.plateCost)}</dd>
									</div>
									<div>
										<!-- The label follows the number. With tax on this row shows NET
										     revenue, and calling that the menu price is the same class of
										     quiet wrongness the setting exists to fix. -->
										<dt>{house.tax.inclusive ? 'Net revenue' : 'Menu price'}</dt>
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

			<h2 class="sec">What the menu adds up to</h2>
			<p data-print="hide">
				<button class="chip" onclick={downloadCsv}
					title="The sheet as a file a spreadsheet opens. One way — nothing imports from CSV, ever."
					>Download the sheet (CSV)</button
				>
			</p>
			{#if rollup.weightedFoodCostPct !== null}
				<dl class="rollup">
					<div>
						<dt>Weighted food cost</dt>
						<dd>{rollup.weightedFoodCostPct.toFixed(1)}%</dd>
					</div>
					<div>
						<dt>Contribution</dt>
						<dd>{symbolOf(dishes.find((d) => d.price)?.price ?? '')}{money(rollup.totalContribution)}</dd>
					</div>
					<div>
						<dt>Covers</dt>
						<dd>{rollup.covers}</dd>
					</div>
				</dl>
				<!--
					The qualification is the point. An undated, unqualified weighted food
					cost is the most quotable wrong number this app could produce — so it
					says which week it is, and over how many dishes.
				-->
				<p class="secnote">
					Weighted by what actually sold, not the average of the dish percentages — which flatters
					whenever the expensive dish is the popular one. Computed over the {rollup.usable} of
					{rollup.of} dishes carrying a price, a covers count and a complete costing —
					{coversBasis.thisWeek} counted in the week of {weekLabel(thisWeek)}{coversBasis.carried
						? `, ${coversBasis.carried} carried forward from their newest earlier count`
						: ''}.
					{#if rollup.uncosted}
						<b
							>{rollup.uncosted}
							{rollup.uncosted === 1 ? 'dish that sold is' : 'dishes that sold are'} not in this
							figure — no complete costing.</b
						>
					{/if}
					{#if rollup.pareto}
						{rollup.pareto.dishes} of your {rollup.pareto.of} dishes are {rollup.pareto.pct.toFixed(
							0
						)}% of covers.
					{/if}
				</p>
			{/if}

			<h2 class="sec">The item book</h2>
			{#if usedItems.length}
				<!--
					The guide's instruction is "reprice quarterly against invoice creep;
					menus that sleep bleed". Following it needs two things the sheet did
					not have: the price before this one, and the list of dishes a change
					reaches. Both are here, and neither is asked for — the book fills
					itself from the costing.
				-->
				<p class="secnote">
					What the venue buys, what it paid before, and which plates a price move reaches. Filled
					from the sheet above as you cost; nothing here has to be set up first.
				</p>
				<ul class="itembook">
					{#each usedItems as u (u.slug)}
						<li>
							<div class="ihead">
								<span class="iname">{u.name}</span>
								{#if u.current}
									<span class="inow mono">{menuSym}{money(u.current.unitCost)}/{u.current.unit}</span>
								{:else}
									<span class="inow mono muted">not priced</span>
								{/if}
								{#if u.movePct !== null && u.previous}
									<!-- The comparison is the feature. A percentage on its own is a
									     claim; the number it moved FROM is the evidence for it. -->
									<span class="imove" data-dir={u.movePct >= 0 ? 'up' : 'down'}>
										{u.movePct >= 0 ? '+' : ''}{u.movePct.toFixed(1)}% from {menuSym}{money(
											u.previous.unitCost
										)}
									</span>
								{/if}
							</div>
							<p class="iuse">{usageLine(u)}</p>
							{#if u.outOfBandIds.length}
								<p class="idishes">
									{u.outOfBandIds.map(dishName).join(', ')}
								</p>
							{/if}
							{#if u.staleDishIds.length}
								<!--
									The list the reprice instruction actually needs: unlinked lines
									still holding a number the book has moved past. A linked line
									cannot appear here — it follows the book by construction.
								-->
								<p class="istale">
									{u.staleDishIds.length}
									{u.staleDishIds.length === 1 ? 'dish holds' : 'dishes hold'} an old number:
									{u.staleDishIds.map(dishName).join(', ')} — open the sheet and take the book price.
								</p>
							{/if}
							<div class="iyield" data-print="hide">
								{#if u.yieldPct !== null}
									<span>Measured yield {u.yieldPct.toFixed(0)}%</span>
								{/if}
								{#if yieldForm?.slug === u.slug}
									<input
										type="number"
										min="0"
										step="0.01"
										placeholder="weighed in"
										aria-label="Gross quantity, as purchased"
										bind:value={yieldForm.gross}
									/>
									<input
										type="number"
										min="0"
										step="0.01"
										placeholder="usable"
										aria-label="Usable quantity after trim"
										bind:value={yieldForm.usable}
									/>
									<button
										class="book use"
										disabled={!yieldForm.gross || yieldForm.usable === null || yieldForm.usable > yieldForm.gross}
										onclick={() => logYieldTest(u.name)}>log it</button
									>
									<button class="book" onclick={() => (yieldForm = null)}>cancel</button>
								{:else}
									<button
										class="book"
										onclick={() => (yieldForm = { slug: u.slug, gross: null, usable: null })}
										title="Weigh it as it arrives, weigh what is usable after trim, and the book keeps the ratio"
										>{u.yieldPct === null ? 'log a yield test' : 'retest'}</button
									>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="secnote">
					Nothing in the book yet. Type an ingredient and a price on any sheet above and it starts
					keeping the history — then the next dish that buys the same thing offers it back to you,
					and repricing it once moves every plate it is on.
				</p>
			{/if}

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
							<span class="qfig">
								{x.sold} sold · {money(x.contribution)} each{#if rollup.mixPct.get(x.id)}{' '}
									· {rollup.mixPct.get(x.id)!.toFixed(0)}% of covers{/if}
							</span>
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

	/* ---- the item book ---------------------------------------------------- */

	/*
	 * The per-line marker. Small, but it must be legible at two metres on a pass
	 * tablet like everything else here, so it is a button with real text rather
	 * than an icon nobody can read — and never colour alone: "follows the book"
	 * and "book:" say which state this is in words.
	 */
	.book {
		display: block;
		margin-top: 3px;
		padding: 1px 5px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--paper-raised);
		color: var(--ink-soft);
		font-size: var(--t-micro);
		line-height: 1.4;
		cursor: pointer;
	}
	.book:hover,
	.book:focus-visible {
		color: var(--ink);
		border-color: var(--ink-soft);
	}
	.book.use {
		color: var(--turmeric-deep);
		border-style: dashed;
	}

	.itembook {
		list-style: none;
		margin: 0 0 18px;
		padding: 0;
		display: grid;
		gap: 8px;
	}
	.itembook li {
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--card);
		padding: 10px 12px;
	}
	.ihead {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 4px 10px;
	}
	.iname {
		font-family: var(--display);
		font-size: var(--t-lede);
		color: var(--text);
	}
	.inow {
		color: var(--text);
	}
	.inow.muted {
		color: var(--ink-soft);
	}
	/*
	 * The direction is carried by the SIGN, which is in the text itself, so the
	 * colour is reinforcement and never the only cue. Same rule the verdicts
	 * follow above.
	 */
	.imove {
		font-size: var(--t-small);
		color: var(--ink-soft);
	}
	.imove[data-dir='up'] {
		color: var(--chili);
		font-weight: 600;
	}
	.iuse {
		margin: 4px 0 0;
		font-size: var(--t-small);
		color: var(--ink-soft);
		max-width: var(--measure);
	}
	.idishes {
		margin: 2px 0 0;
		font-size: var(--t-micro);
		color: var(--ink-soft);
		max-width: var(--measure);
	}
	/* Stale is a call to action, so it carries the accent that is AA for text. */
	.istale {
		margin: 4px 0 0;
		font-size: var(--t-small);
		color: var(--turmeric-deep);
		max-width: var(--measure);
	}
	.iyield {
		margin-top: 5px;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		font-size: var(--t-small);
		color: var(--ink-soft);
	}
	.iyield input {
		width: 6.5rem;
		font: inherit;
		padding: 2px 5px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--paper-raised);
		color: var(--text);
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

	/* The sheet has to reach the walk-in on a clipboard. A 640px minimum
	   inside an overflow scroller is a screen control, and on paper it just
	   truncates: costing done in the office at 11am could not be carried. */
	@media print {
		.sheetbody {
			overflow: visible;
		}
		table {
			min-width: 0;
			font-size: 9pt;
		}
		input {
			border: 0 !important;
			padding: 0 !important;
			background: none !important;
			-webkit-appearance: none;
			appearance: none;
		}
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
	.taxrow {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px 14px;
		margin: 0 0 10px;
	}
	.taxrow label {
		display: flex;
		align-items: center;
		gap: 6px;
		min-height: 40px;
	}
	.rate {
		border: 1px solid var(--line);
		background: none;
		padding: 6px 8px;
		border-radius: var(--radius);
		width: 6ch;
		min-height: 36px;
	}
	.taxnote,
	.taxstated {
		color: var(--ink-soft);
		font-size: var(--t-small, 0.8125rem);
		line-height: 1.5;
	}
	.taxstated {
		margin: 0 0 14px;
	}
	.rollup {
		display: flex;
		flex-wrap: wrap;
		gap: 10px 28px;
		margin: 0 0 8px;
	}
	.rollup dt {
		font-size: var(--t-micro, 0.6875rem);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.rollup dd {
		margin: 2px 0 0;
		font-family: var(--display);
		font-size: 1.4rem;
		font-variant-numeric: tabular-nums;
	}
	.weeks {
		display: flex;
		gap: 10px;
		align-items: baseline;
		margin: 6px 0 0;
		font-variant-numeric: tabular-nums;
		color: var(--ink-soft);
		font-size: var(--t-small, 0.8125rem);
	}
	.weeksep {
		color: var(--muted);
	}
	.weeksnote {
		font-variant-numeric: normal;
		color: var(--muted);
	}
	.replaced {
		color: var(--chili);
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
