<!--
  The house card on /menu, under the house bar: the name, the address, the
  telephone, the site, the meals as rows, the dress code, the date the menus
  were read and the sources, read off house.current and edited through
  api.setCard, which is the card's one door (the normaliser caps every
  string and drops a stray key). The history is a MARK, hers or kept, with
  Keep, Edit and Discard through api.setMark('house', 'history', ...): Keep
  writes her value back with by 'person' and a fresh stamp, Save writes the
  typed value the same way, Discard writes null.

  PRERENDERED EMPTY. The page is prerendered with no house, so this renders
  nothing until the api is ready and a house is current; house.current moves
  with the store's tick, so a switch, a pack import or another tab's write
  redraws the card. Nothing here reads the Table's own row, and nothing
  here names a field the House does not carry.

  One editor at a time, 44px controls, every state a word: "Hers" or "Kept"
  beside the history, never a colour alone.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { house } from '$lib/stores/house.svelte';
	import type { HouseMeal, HouseSource } from '$lib/house/house-schema';
	import { hasDash } from '$lib/house/house-lines';

	const current = $derived(house.current);
	const history = $derived(current?.history);

	let editing = $state(false);
	let historyEditing = $state(false);
	let historyDraft = $state('');
	let form = $state({ name: '', address: '', phone: '', site: '', dressCode: '', menusReadOn: '' });
	let meals = $state<HouseMeal[]>([]);
	let sources = $state<HouseSource[]>([]);
	let said = $state('');
	let root: HTMLElement | undefined = $state();

	async function focus(sel: string) {
		await tick();
		root?.querySelector<HTMLElement>(sel)?.focus();
	}

	function edit() {
		if (!current) return;
		historyEditing = false;
		form = {
			name: current.name,
			address: current.address,
			phone: current.phone,
			site: current.site,
			dressCode: current.dressCode,
			menusReadOn: current.menusReadOn
		};
		meals = current.meals.map((m) => ({ ...m }));
		sources = current.sources.map((s) => ({ ...s }));
		editing = true;
		said = '';
	}
	async function save() {
		const api = house.api;
		if (!api || !current) return;
		const name = form.name.trim();
		if (!name) {
			said = 'A house needs a name.';
			return;
		}
		const ok = await api.setCard({
			name,
			address: form.address.trim(),
			phone: form.phone.trim(),
			site: form.site.trim(),
			dressCode: form.dressCode.trim(),
			menusReadOn: form.menusReadOn.trim(),
			meals: meals.map((m) => ({ name: m.name.trim(), days: m.days.trim(), hours: m.hours.trim() })).filter((m) => m.name || m.days || m.hours),
			sources: sources.map((s) => ({ title: s.title.trim(), url: s.url.trim(), readOn: s.readOn.trim() })).filter((s) => s.title || s.url)
		});
		said = ok ? 'The card is saved.' : 'The card could not be written on this device.';
		editing = false;
		await focus('[data-edit="card"]');
	}
	async function cancel() {
		editing = false;
		await focus('[data-edit="card"]');
	}
	function addMeal() {
		meals.push({ name: '', days: '', hours: '' });
	}
	function dropMeal(i: number) {
		meals.splice(i, 1);
	}
	function addSource() {
		sources.push({ title: '', url: '', readOn: '' });
	}
	function dropSource(i: number) {
		sources.splice(i, 1);
	}

	/* ---- the history mark ---- */
	function keepHistory() {
		const api = house.api;
		if (!api || !history) return;
		void api.setMark('house', '', 'history', { value: history.value, by: 'person', ts: Date.now(), ...(history.model ? { model: history.model } : {}) });
	}
	function discardHistory() {
		const api = house.api;
		if (!api) return;
		historyEditing = false;
		void api.setMark('house', '', 'history', null);
	}
	function editHistory() {
		editing = false;
		historyDraft = history?.value ?? '';
		historyEditing = true;
	}
	async function saveHistory() {
		const api = house.api;
		const value = historyDraft.trim();
		if (api && value) {
			await api.setMark('house', '', 'history', { value, by: 'person', ts: Date.now(), ...(history?.model ? { model: history.model } : {}) });
		}
		historyEditing = false;
		await focus('[data-edit="history"]');
	}
	async function cancelHistory() {
		historyEditing = false;
		await focus('[data-edit="history"]');
	}
	const dashWord = (s: string) => (hasDash(s) ? 'carries a dash' : '');
</script>

{#if current}
	<section class="housecard" bind:this={root} aria-labelledby="housecard-h" data-print="hide">
		<h3 class="eyebrow" id="housecard-h">The card</h3>
		<p class="said" role="status" aria-live="polite">{said}</p>
		{#if editing}
			<div class="form">
				<label class="field"><span class="sub">Name</span><input bind:value={form.name} aria-label="House name" /></label>
				<label class="field"><span class="sub">Address</span><input bind:value={form.address} aria-label="Address" /></label>
				<label class="field"><span class="sub">Telephone</span><input bind:value={form.phone} aria-label="Telephone" /></label>
				<label class="field"><span class="sub">Site</span><input bind:value={form.site} aria-label="Site" /></label>
				<fieldset class="field group">
					<legend class="sub">Meals</legend>
					{#each meals as m, i (i)}
						<div class="mealrow">
							<input bind:value={m.name} placeholder="Meal" aria-label="Meal {i + 1}, name" />
							<input bind:value={m.days} placeholder="Days" aria-label="Meal {i + 1}, days" />
							<input bind:value={m.hours} placeholder="Hours" aria-label="Meal {i + 1}, hours" />
							<button type="button" class="chip" onclick={() => dropMeal(i)}>Remove</button>
						</div>
					{/each}
					<button type="button" class="chip" onclick={addMeal}>Add a meal</button>
				</fieldset>
				<label class="field"><span class="sub">Dress code</span><input bind:value={form.dressCode} aria-label="Dress code" /></label>
				<label class="field"><span class="sub">Menus read on</span><input bind:value={form.menusReadOn} placeholder="2026-09-28" aria-label="Menus read on" /></label>
				<fieldset class="field group">
					<legend class="sub">Sources</legend>
					{#each sources as s, i (i)}
						<div class="mealrow">
							<input bind:value={s.title} placeholder="Title" aria-label="Source {i + 1}, title" />
							<input bind:value={s.url} placeholder="Address, or blank" aria-label="Source {i + 1}, address" />
							<input bind:value={s.readOn} placeholder="Read on" aria-label="Source {i + 1}, read on" />
							<button type="button" class="chip" onclick={() => dropSource(i)}>Remove</button>
						</div>
					{/each}
					<button type="button" class="chip" onclick={addSource}>Add a source</button>
				</fieldset>
				<div class="chips">
					<button class="chip go" onclick={save}>Save the card</button>
					<button class="chip" onclick={cancel}>Cancel</button>
				</div>
			</div>
		{:else}
			<dl class="card">
				<div class="pair"><dt>Name</dt><dd class="name">{current.name}</dd></div>
				<div class="pair"><dt>Address</dt><dd>{current.address || 'none'}</dd></div>
				<div class="pair"><dt>Telephone</dt><dd>{current.phone || 'none'}</dd></div>
				<div class="pair"><dt>Site</dt><dd>{current.site || 'none'}</dd></div>
				<div class="pair">
					<dt>Meals</dt>
					<dd>
						{#if current.meals.length}
							<table class="meals">
								<thead><tr><th scope="col">Meal</th><th scope="col">Days</th><th scope="col">Hours</th></tr></thead>
								<tbody>
									{#each current.meals as m, i (i)}
										<tr><td>{m.name}</td><td>{m.days}</td><td>{m.hours}</td></tr>
									{/each}
								</tbody>
							</table>
						{:else}none{/if}
					</dd>
				</div>
				<div class="pair"><dt>Dress code</dt><dd>{current.dressCode || 'none'}</dd></div>
				<div class="pair"><dt>Menus read on</dt><dd>{current.menusReadOn || 'no recorded date'}</dd></div>
				<div class="pair">
					<dt>Sources</dt>
					<dd>
						{#if current.sources.length}
							<ul class="sources">
								{#each current.sources as s, i (i)}
									<li>{s.title}{#if s.url}, {s.url}{/if}{#if s.readOn}, read on {s.readOn}{/if}</li>
								{/each}
							</ul>
						{:else}none{/if}
					</dd>
				</div>
			</dl>
			<div class="chips">
				<button class="chip" data-edit="card" onclick={edit}>Edit the card</button>
			</div>
		{/if}

		{#if history || historyEditing}
			<div class="row" class:hers={history?.by === 'maitre'}>
				<p class="rowhead">
					The history
					{#if history}<span class="who">{history.by === 'person' ? 'Kept' : 'Hers'}</span>{/if}
				</p>
				{#if historyEditing}
					<textarea bind:value={historyDraft} rows="4" aria-label="The history of {current.name}"></textarea>
					{#if dashWord(historyDraft)}<p class="count">{dashWord(historyDraft)}</p>{/if}
					<div class="chips">
						<button class="chip go" onclick={saveHistory}>Save</button>
						<button class="chip" onclick={cancelHistory}>Cancel</button>
					</div>
				{:else if history}
					<p class="val">{history.value}</p>
					<div class="chips" role="group" aria-label="The history of {current.name}">
						{#if history.by === 'maitre'}
							<button class="chip go" onclick={keepHistory}>Keep</button>
						{/if}
						<button class="chip" data-edit="history" onclick={editHistory}>Edit</button>
						<button class="chip" onclick={discardHistory}>Discard</button>
					</div>
				{/if}
			</div>
		{:else}
			<div class="chips">
				<button class="chip" data-edit="history" onclick={editHistory}>Write the history</button>
			</div>
		{/if}
	</section>
{/if}

<style>
	.housecard {
		margin: 12px 0 16px;
		max-width: var(--measure);
	}
	.eyebrow {
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
		margin: 0 0 6px;
		font-weight: 400;
	}
	.card {
		margin: 0 0 8px;
	}
	.pair {
		display: grid;
		grid-template-columns: minmax(90px, 140px) 1fr;
		gap: 4px 12px;
		padding: 6px 0;
		border-bottom: 1px dotted var(--line);
	}
	.pair dt {
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
	}
	.pair dd {
		margin: 0;
		font-size: 14.5px;
		line-height: 1.5;
		overflow-wrap: anywhere;
	}
	.pair dd.name {
		font-family: var(--display);
		font-size: 18px;
	}
	.meals {
		border-collapse: collapse;
		width: 100%;
		font-size: 14px;
	}
	.meals th,
	.meals td {
		text-align: left;
		padding: 4px 8px 4px 0;
		border-bottom: 1px dotted var(--line);
		vertical-align: top;
	}
	.meals th {
		font-size: var(--t-micro);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--muted);
		font-weight: 600;
	}
	.sources {
		margin: 0;
		padding-left: 18px;
	}
	.form {
		display: grid;
		gap: 10px;
		margin: 0 0 8px;
	}
	.field {
		display: block;
		border: 0;
		padding: 0;
		margin: 0;
		min-width: 0;
	}
	.sub {
		display: block;
		font-size: var(--t-micro);
		letter-spacing: 0.04em;
		color: var(--ink-soft);
		margin: 0 0 4px;
	}
	.group {
		display: grid;
		gap: 8px;
	}
	.mealrow {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.mealrow input {
		flex: 1 1 140px;
	}
	input,
	textarea {
		display: block;
		width: 100%;
		min-height: 44px;
		border: 1px solid var(--field-line, var(--line));
		background: var(--card);
		border-radius: var(--radius);
		padding: 8px 12px;
		font: inherit;
		font-size: 14.5px;
		color: var(--ink);
	}
	textarea {
		resize: vertical;
		margin: 0 0 6px;
	}
	.row {
		padding: 6px 0 6px 10px;
		border-left: 3px solid transparent;
		margin-top: 8px;
	}
	.row.hers {
		border-left-color: var(--turmeric-deep);
	}
	.rowhead {
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
		margin: 0 0 4px;
		display: flex;
		gap: 10px;
		align-items: baseline;
	}
	.who {
		letter-spacing: 0.04em;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.row.hers .who {
		color: var(--turmeric-deep);
	}
	.val {
		margin: 0 0 6px;
		font-size: 14.5px;
		line-height: 1.5;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.count,
	.said {
		margin: 0 0 6px;
		font-size: 14px;
		color: var(--ink-soft);
	}
	.said:empty {
		display: none;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
	}
	.chip {
		border: 1px solid var(--line);
		background: var(--card);
		padding: 8px 14px;
		border-radius: var(--radius);
		cursor: pointer;
		font-size: 14px;
		font-family: inherit;
		color: var(--ink);
		min-height: 44px;
	}
	.chip:hover {
		border-color: var(--turmeric);
	}
	.chip.go {
		border-color: var(--turmeric-deep);
		font-weight: 600;
	}
</style>
