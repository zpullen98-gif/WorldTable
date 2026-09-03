<script lang="ts">
	import { base } from '$app/paths';
	import { house, type Prep } from '$lib/stores/house.svelte';
	import { prepSecToFormMin, prepFormMinToSec } from '$lib/persistence/house';
	import { prepPortionCost, money, lineCost, type CostLine } from '$lib/costing';
	import { itemSlugOf, currentPrice } from '$lib/items';
	import Ornament from '$lib/components/Ornament.svelte';

	/**
	 * The preps: what the menu is actually built from.
	 *
	 * A braise's sheet carried "Demi-glace, 6.00/L, 0.15 L, 100% yield". Nobody
	 * had ever costed the demi: bones, mirepoix, wine, nine hours, a yield
	 * nearer 25%, and the same guess was retyped into every other dish that
	 * used it, differently in some. Every sauced dish was understated in the
	 * direction that flatters. This is the entity that was missing.
	 *
	 * Everything below the H1 sits inside ONE <article class="sheet">:
	 * shared/oot-locks.js:446 does a singular querySelector('article.sheet'),
	 * so a second sheet element on this page would simply not be seen.
	 */

	const mintId = (p: string) => {
		let s = p;
		while (s.length < 10) s += Math.floor(Math.random() * 36).toString(36);
		return s;
	};

	let { data } = $props();

	let form = $state<null | {
		id: string | null;
		name: string;
		batch: string;
		portions: number;
		par: number;
		shelfLifeDays: number;
		handsOnMin: number;
		unattendedMin: number;
		station: string;
		lines: CostLine[];
	}>(null);

	const blank = () => ({
		id: null,
		name: '',
		batch: '',
		portions: 10,
		par: 10,
		shelfLifeDays: 3,
		handsOnMin: 30,
		unattendedMin: 0,
		station: '',
		lines: [] as CostLine[]
	});

	function edit(p: Prep) {
		form = {
			id: p.id,
			name: p.name,
			batch: p.batch,
			portions: p.portions,
			par: p.par,
			shelfLifeDays: p.shelfLifeDays ?? 0,
			// Stored in SECONDS and typed in minutes — see prepSecToFormMin.
			handsOnMin: prepSecToFormMin(p.handsOnSec),
			unattendedMin: prepSecToFormMin(p.unattendedSec),
			// Carried through the form. The field was displayed on the prep board
			// and settable NOWHERE, reachable only by hand-editing a .wtjson,
			// and an edit round-trip silently dropped whatever a file had put in.
			station: p.station ?? '',
			lines: [...p.lines]
		};
	}

	function save() {
		if (!form || !form.name.trim()) return;
		const rec: Prep = {
			id: form.id ?? mintId('p-'),
			name: form.name.trim(),
			batch: form.batch.trim(),
			portions: Number(form.portions) || 0,
			par: Number(form.par) || 0,
			...(Number(form.shelfLifeDays) > 0 ? { shelfLifeDays: Number(form.shelfLifeDays) } : {}),
			handsOnSec: prepFormMinToSec(form.handsOnMin),
			unattendedSec: prepFormMinToSec(form.unattendedMin),
			...(form.station.trim() ? { station: form.station.trim() } : {}),
			lines: form.lines,
			ts: Date.now()
		};
		house.savePrep(rec);
		form = null;
	}

	function addLine() {
		if (!form) return;
		form.lines = [
			...form.lines,
			// NaN, not 0. The costing sheet's rule: an untyped line is uncostable,
			// not a completed free ingredient.
			{ id: mintId('l-'), item: '', unitCost: Number.NaN, unit: 'kg', usedQty: 0, yieldPct: 100 }
		];
	}

	/* ---- the item book, on prep lines --------------------------------------
	 *
	 * The engine honoured itemSlug inside a prep from the day the book shipped
	 * (prepPortionCost runs priceFromBook over every non-prep line, and the
	 * book's own header calls butter-in-the-demi the case it most needs to
	 * reach), but this editor was a bare input, so a prep's butter was a
	 * free-text price typed a second time: the retyped-guess failure the Prep
	 * entity exists to end, one layer down. Same handlers as the costing
	 * sheet, against the same book.
	 */

	function commitItem(l: CostLine, name: string) {
		const slug = itemSlugOf(name);
		const known = slug ? house.item(slug) : undefined;
		const price = currentPrice(known);
		if (l.itemSlug && !known) {
			// Renamed onto something the book has never heard of: unlink rather
			// than dragging the old item's price under a new word.
			if (!form) return;
			form.lines = form.lines.map((x) =>
				x.id === l.id ? (({ itemSlug: _drop, ...rest }) => ({ ...rest, item: name }))(x) : x
			);
			return;
		}
		if (price) {
			editLine(l.id, { item: name, itemSlug: slug, unitCost: price.unitCost, unit: price.unit });
			return;
		}
		editLine(l.id, { item: name });
		if (Number.isFinite(l.unitCost) && l.unitCost > 0) {
			house.recordItemPrice(name, l.unitCost, l.unit);
			if (house.item(slug)) editLine(l.id, { itemSlug: slug });
		}
	}

	function commitPrice(l: CostLine, unitCost: number) {
		const name = l.item.trim();
		if (!name || !Number.isFinite(unitCost) || unitCost <= 0) {
			editLine(l.id, { unitCost });
			return;
		}
		house.recordItemPrice(name, unitCost, l.unit);
		const slug = itemSlugOf(name);
		editLine(l.id, house.item(slug) ? { unitCost, itemSlug: slug } : { unitCost });
	}

	/** The book price shown for a linked line: the stored number is a fallback. */
	const bookCost = (l: CostLine) =>
		l.itemSlug ? (currentPrice(house.item(l.itemSlug))?.unitCost ?? l.unitCost) : l.unitCost;
	function editLine(lineId: string, patch: Partial<CostLine>) {
		if (!form) return;
		form.lines = form.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l));
	}
	function dropLine(lineId: string) {
		if (!form) return;
		form.lines = form.lines.filter((l) => l.id !== lineId);
	}

	/** What removing this prep would cost the dishes that use it. */
	function remove(p: Prep) {
		const used = house.dishesUsing(p.id);
		const warn = used.length
			? `${p.name} is on ${used.length} ${used.length === 1 ? 'dish' : 'dishes'} (${used
					.map((d) => d.name)
					.join(', ')}). They will lose their plate cost until the line is replaced. Remove it?`
			: `Remove ${p.name}?`;
		if (confirm(warn)) house.removePrep(p.id);
	}

	const num = (v: string) => (v.trim() === '' ? Number.NaN : Number(v));

	/** The prep being typed, costed live: the same function the list uses. */
	const preview = $derived(
		form
			? prepPortionCost({ id: 'preview', portions: Number(form.portions) || 0, lines: form.lines }, house.pricedItems)
			: { perPortion: null, complete: false }
	);
</script>

<svelte:head><title>Preps | The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<h1>Preps</h1>
		<p class="lede">
			What the menu is built from. Cost the demi once, and every dish that uses it gets the real
			number instead of a guess retyped nine times.
		</p>
		<nav class="tools" data-print="hide">
			<a class="chip" href="{base}/menu">← The worksheet</a>
			<a class="chip" href="{base}/menu/costing">The costing sheet</a>
			<a class="chip" href="{base}/menu/prep-board">The prep board</a>
			<a class="chip" href="{base}/menu/waste">The waste log</a>
		</nav>
	</header>

	<datalist id="prep-item-book">
		{#each house.itemNames as n (n)}<option value={n}></option>{/each}
	</datalist>

	<article class="sheet">
		<Ornament seed="preps" />

		{#if !house.preps.length && !form}
			<p class="empty">
				Nothing yet. A prep is anything a dish is built from rather than bought for: a stock, a
				sauce, a pickle, a mix. Cost it here once and point the dishes at it.
			</p>
		{/if}

		<ul class="preps">
			{#each house.preps as p (p.id)}
				{@const cost = prepPortionCost(p, house.pricedItems)}
				{@const used = house.dishesUsing(p.id)}
				<li>
					<div class="row">
						<span class="nm">{p.name}</span>
						<span class="meta">
							Makes {p.portions}
							{p.portions === 1 ? 'portion' : 'portions'}
							{#if cost.perPortion !== null && cost.complete}
								· <b>{money(cost.perPortion)} a portion</b>
							{:else}
								· <b class="incomplete">not fully costed</b>
							{/if}
							· par {p.par}{#if p.shelfLifeDays}
								{' '}
								· {p.shelfLifeDays}
								{p.shelfLifeDays === 1 ? 'day' : 'days'}{/if}
						</span>
					</div>
					{#if p.batch}<p class="batch">{p.batch}</p>{/if}
					{#if used.length}
						<p class="used">On {used.map((d) => d.name).join(', ')}</p>
					{/if}
					<div class="acts" data-print="hide">
						<button class="chip" onclick={() => edit(p)}>Edit</button>
						<button class="chip" onclick={() => remove(p)}>Remove</button>
					</div>
				</li>
			{/each}
		</ul>

		{#if form}
			<div class="editor">
				<div class="frow">
					<input bind:value={form.name} placeholder="Demi-glace" aria-label="Prep name" />
					<input bind:value={form.batch} placeholder="Batch: 1 × 20L pot" aria-label="Batch" />
					<select bind:value={form.station} aria-label="Station">
						<option value="">No station</option>
						{#each data.stationNames as n (n)}<option value={n}>{n}</option>{/each}
					</select>
				</div>
				<div class="frow nums">
					<label>Portions <input type="number" min="1" bind:value={form.portions} /></label>
					<label>Par <input type="number" min="0" bind:value={form.par} /></label>
					<label>Shelf life (days) <input type="number" min="0" bind:value={form.shelfLifeDays} /></label>
					<label>Hands-on (min) <input type="number" min="0" bind:value={form.handsOnMin} /></label>
					<label>Unattended (min) <input type="number" min="0" bind:value={form.unattendedMin} /></label>
				</div>

				<h2 class="sec">What goes in it</h2>
				<table class="lines">
					<thead>
						<tr><th>Item</th><th>Unit cost</th><th>Unit</th><th>Used</th><th>Yield %</th><th></th></tr>
					</thead>
					<tbody>
						{#each form.lines as l (l.id)}
							<tr>
								<td
									><input
										list="prep-item-book"
										value={l.item}
										aria-label="Ingredient"
										onchange={(e) => commitItem(l, e.currentTarget.value)}
									/>{#if l.itemSlug}<span class="linked" title="Follows the item book"
											>book</span
										>{/if}</td
								>
								<td
									><input
										type="number"
										step="0.01"
										value={bookCost(l)}
										aria-label="Cost per unit"
										onchange={(e) => commitPrice(l, num(e.currentTarget.value))}
									/></td
								>
								<td><input class="short" value={l.unit} onchange={(e) => editLine(l.id, { unit: e.currentTarget.value })} /></td>
								<td><input type="number" step="0.01" value={l.usedQty} onchange={(e) => editLine(l.id, { usedQty: num(e.currentTarget.value) })} /></td>
								<td><input type="number" step="1" value={l.yieldPct} onchange={(e) => editLine(l.id, { yieldPct: num(e.currentTarget.value) })} /></td>
								<td>
									<span class="lc">{lineCost(l) === null ? '-' : money(lineCost(l)!)}</span>
									<button class="chip" onclick={() => dropLine(l.id)}>✕</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<button class="chip" onclick={addLine}>Add a line</button>

				<p class="preview">
					{#if preview.perPortion !== null && preview.complete}
						<b>{money(preview.perPortion)} a portion</b> across {form.portions} portions.
					{:else}
						<b class="incomplete">Not fully costed.</b>
						A prep with a line the sheet cannot price makes every dish that uses it incomplete too:
						which is the point, and better than a total that is quietly wrong.
					{/if}
				</p>

				<div class="frow" data-print="hide">
					<button class="chip go" onclick={save} disabled={!form.name.trim()}>
						{form.id ? 'Save the prep' : 'Add the prep'}
					</button>
					<button class="chip" onclick={() => (form = null)}>Cancel</button>
				</div>
			</div>
		{:else}
			<button class="chip go" data-print="hide" onclick={() => (form = blank())}>Add a prep</button>
		{/if}
	</article>
</div>

<style>
	.linked {
		display: inline-block;
		margin-left: 4px;
		padding: 0 4px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		font-size: var(--t-micro);
		color: var(--turmeric-deep);
	}

	.head {
		padding: 26px 0 10px;
	}
	.lede {
		max-width: var(--measure);
		color: var(--ink-soft);
	}
	.tools {
		display: flex;
		gap: 8px;
		margin-top: 12px;
		flex-wrap: wrap;
	}
	.preps {
		list-style: none;
		margin: 0 0 18px;
		padding: 0;
	}
	.preps > li {
		border-bottom: 1px solid var(--line);
		padding: 12px 0;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 10px;
	}
	.nm {
		font-weight: 600;
	}
	.meta,
	.batch,
	.used {
		color: var(--ink-soft);
		font-size: var(--t-small, 0.8125rem);
	}
	.batch,
	.used {
		margin: 4px 0 0;
	}
	/* A real colour, never stacked opacity; see shared/oot-home.css. */
	.incomplete {
		color: var(--chili);
	}
	.acts {
		display: flex;
		gap: 8px;
		margin-top: 8px;
	}
	.editor {
		border-top: 1px solid var(--line);
		padding-top: 14px;
	}
	.frow {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 10px;
	}
	.frow.nums label {
		display: flex;
		flex-direction: column;
		font-size: var(--t-small, 0.8125rem);
		color: var(--ink-soft);
		gap: 2px;
	}
	.frow input {
		border: 1px solid var(--line);
		background: none;
		padding: 8px 10px;
		border-radius: var(--radius);
		min-height: 40px;
	}
	.lines {
		width: 100%;
		border-collapse: collapse;
		margin: 6px 0 10px;
		display: block;
		overflow-x: auto;
	}
	.lines th {
		text-align: left;
		font-size: var(--t-micro, 0.6875rem);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
		padding: 4px 6px;
	}
	.lines td {
		padding: 3px 6px;
	}
	.lines input {
		border: 1px solid var(--line);
		background: none;
		padding: 6px 8px;
		border-radius: var(--radius);
		min-height: 36px;
		width: 9ch;
	}
	.lines td:first-child input {
		width: 22ch;
	}
	.lines input.short {
		width: 6ch;
	}
	.lc {
		font-variant-numeric: tabular-nums;
		margin-right: 8px;
	}
	.preview {
		margin: 10px 0;
		color: var(--ink-soft);
		font-size: 0.94rem;
		line-height: 1.6;
	}
	.empty {
		color: var(--ink-soft);
		max-width: var(--measure);
	}
</style>
