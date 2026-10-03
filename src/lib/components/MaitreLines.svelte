<!--
  What the Maître d' wrote on a dish, and the three things a person can do
  with each line: Keep, Edit, Discard.

  ONE block, rendered in two places: on the dish card under the description,
  and in the list that follows a bulk run. Both read the same marks off the
  same record through the house store, so a line kept in the list is kept on
  the card and nothing is reviewed twice. The block is the five rows of the
  Floor Deck's card, with its labels (Say it, The guest line, The why, On the
  plate with, Where it comes from), because a kept line goes on to the deck
  and a server should meet it there in the shape they met it here.

  TWO RECORDS, ONE SCREEN. The five Floor Deck rows live on the Table's own
  row (MenuDish.maitre) and go through the store's three doors, as they
  always did. Below them sit the House's own marks on the same dish, read
  off house.houseDish(id): the five parts with their DISH_PARTS labels, the
  three timed lines with a live word count against LINE_CAPS, and the
  pairing block with every wine id resolved to the house wine's name and
  the principles as words. Those go through house.api.setMark('dish', ...),
  the House's door: Keep writes her value back with by 'person' and a fresh
  stamp, Save writes the typed value the same way, Discard writes null.
  After them, the service note, which is a PERSON's words under the fixed
  eyebrow and carries no chips: it is typed on the dish form, never written
  by her, and only read here.

  HERS UNTIL SOMEBODY SAYS OTHERWISE. A mark she wrote carries by 'maitre'
  and the eyebrow reads "Hers, not yet kept" while any such mark stands.
  Only a kept mark reaches the guest menu, the drill or the deck. That line
  is drawn on the record, not here: this block only shows the word and
  offers the three chips. Each row says "Hers" or "Kept" in a word beside
  its label, and an unkept row carries the left rule as well, so the state
  is never a colour alone. A line over its cap says so in words beside the
  count ("over its cap"), and a draft carrying a dash says "carries a dash".

  Edit opens one editor at a time: a box for a line, five labelled boxes for
  the parts, three with counts for the timed lines, thirteen for a pairing
  with the wine pickers over the house's own wines. A card with every box
  open is a form, and a person on the floor between tables is not filling in
  a form. Save returns focus to the row's Edit chip; Cancel does the same
  without writing. Keep all keeps everything unkept on the dish, both
  records.

  A question kept for lineup that holds up one of these fields
  (askAtLineup, blocksField, no answer yet) puts the words "confirm on shift"
  beside that field's label, so the row is read with the doubt on it.

  Full-size chips only, 44px: there is no .chip.small anywhere on the desk.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { house } from '$lib/stores/house.svelte';
	import type { MenuDish, MaitrePatch } from '$lib/persistence/state';
	import { LINE_FIELDS, type LineField } from '$lib/maitre-adopt';
	import { DISH_PARTS, LINE_CAPS, PRINCIPLES, type FormulaParts, type Lines, type Pairing, type Mark } from '$lib/house/house-schema';
	import { hasDash, wordCount } from '$lib/house/house-lines';

	interface Props {
		dish: MenuDish;
		/** In the review list, the block names the dish; on the card the name is already above it. */
		named?: boolean;
	}
	let { dish, named = false }: Props = $props();

	/** FloorCard's labels, in FloorCard's order. */
	const LABELS: Record<LineField, string> = {
		say: 'Say it',
		guest: 'The guest line',
		why: 'The why',
		pairs: 'On the plate with',
		origin: 'Where it comes from'
	};

	type HouseField = 'parts' | 'lines' | 'pairing';
	const HOUSE_LABELS: Record<HouseField, string> = {
		parts: 'The five parts',
		lines: 'The timed lines',
		pairing: 'The pairing'
	};
	const PART_KEYS = ['main', 'technique', 'sauce', 'sides', 'taste'] as const;
	const LINE_KEYS = ['s10', 's20', 's45'] as const;
	const LINE_LABELS: Record<keyof Lines, string> = { s10: 'Ten seconds', s20: 'Twenty seconds', s45: 'Forty five seconds' };
	const PAIRING_KEYS = [
		'wineId', 'why', 'sayIt', 'whyThisWine', 'palate', 'principles', 'secondId', 'secondWhy', 'stepUp', 'serve', 'avoid', 'zeroProofId', 'zeroProofWhy'
	] as const;
	const PAIRING_LABELS: Record<keyof Pairing, string> = {
		wineId: 'The wine',
		why: 'Why',
		sayIt: 'Say it',
		whyThisWine: 'Why this wine',
		palate: 'On the palate',
		principles: 'The principles',
		secondId: 'The second pick',
		secondWhy: 'Why the second',
		stepUp: 'The step up',
		serve: 'Serve it',
		avoid: 'Avoid',
		zeroProofId: 'Without alcohol',
		zeroProofWhy: 'Why that one'
	};
	/** The fixed eyebrow over a person's own words; the one place this screen says the word, and it says only to confirm. */
	const EYEBROW = 'Your words. Allergens: confirm at lineup.';

	const rows = $derived(
		LINE_FIELDS.flatMap((field) => {
			const mark = dish.maitre?.[field];
			return mark ? [{ field, label: LABELS[field], mark }] : [];
		})
	);
	const unkept = $derived(rows.filter((r) => r.mark.by === 'maitre'));

	/* The House's side of the same dish: the item, the house's wines and
	   drinks for the pickers and the names, and the lineup questions that
	   hold a field up. house.current moves with the store's tick. */
	const current = $derived(house.current);
	const item = $derived(house.houseDish(dish.id));
	const wines = $derived(current?.wines ?? []);
	const drinks = $derived(current?.cocktails ?? []);
	const blocked = $derived.by(() => {
		const out = new Set<string>();
		if (!current || !item) return out;
		for (const a of current.askAtLineup) {
			if (!a.blocksField || (a.answer && a.answer.trim())) continue;
			if (a.itemIds.includes(item.id) || a.itemIds.includes(dish.id)) out.add(a.blocksField);
		}
		return out;
	});
	const houseRows = $derived.by(() => {
		const out: Array<{ field: HouseField; label: string; mark: Mark<unknown> }> = [];
		if (!item) return out;
		if (item.parts) out.push({ field: 'parts', label: HOUSE_LABELS.parts, mark: item.parts });
		if (item.lines) out.push({ field: 'lines', label: HOUSE_LABELS.lines, mark: item.lines });
		if (item.pairing) out.push({ field: 'pairing', label: HOUSE_LABELS.pairing, mark: item.pairing });
		return out;
	});
	const houseUnkept = $derived(houseRows.filter((r) => r.mark.by === 'maitre'));
	const unkeptCount = $derived(unkept.length + houseUnkept.length);
	const note = $derived(item?.serviceNote?.trim() ?? '');

	const nameOf = (id: string) => {
		if (!id) return 'none';
		const w = wines.find((x) => x.id === id);
		if (w) return w.name;
		const d = drinks.find((x) => x.id === id);
		if (d) return d.name;
		return 'an item no longer on the list';
	};
	const linesOf = (m: Mark<unknown>) => m.value as Lines;
	const partsOf = (m: Mark<unknown>) => m.value as FormulaParts;
	const pairingOf = (m: Mark<unknown>) => m.value as Pairing;
	const isPick = (k: keyof Pairing) => k === 'wineId' || k === 'secondId' || k === 'zeroProofId';
	const countLine = (s: string, k: keyof Lines) => {
		const n = wordCount(s);
		return `${n} of ${LINE_CAPS[k]} words${n > LINE_CAPS[k] ? ', over its cap' : ''}`;
	};
	const blockedWord = (field: string) => (blocked.has(field) ? 'confirm on shift' : '');
	const dashWord = (s: string) => (hasDash(s) ? 'carries a dash' : '');

	let editing = $state<LineField | null>(null);
	let draft = $state('');
	/* The House editor: one at a time, and never beside a Floor Deck one. */
	let editingHouse = $state<HouseField | null>(null);
	let partsDraft = $state<FormulaParts>({ main: '', technique: '', sauce: '', sides: '', taste: '' });
	let linesDraft = $state<Lines>({ s10: '', s20: '', s45: '' });
	let pairingDraft = $state<Pairing>(emptyPairing());
	let root: HTMLElement | undefined = $state();

	function emptyPairing(): Pairing {
		return {
			wineId: '', why: '', sayIt: '', whyThisWine: '', palate: '', principles: [],
			secondId: '', secondWhy: '', stepUp: '', serve: '', avoid: '', zeroProofId: '', zeroProofWhy: ''
		};
	}

	async function focusEdit(field: string) {
		await tick();
		root?.querySelector<HTMLButtonElement>(`[data-edit="${field}"]`)?.focus();
	}

	function keep(field: LineField) {
		house.confirmMaitre(dish.id, field);
	}
	function discard(field: LineField) {
		if (editing === field) editing = null;
		house.discardMaitre(dish.id, field);
	}
	function edit(field: LineField) {
		editingHouse = null;
		editing = field;
		draft = dish.maitre?.[field]?.value ?? '';
	}
	async function save() {
		const field = editing;
		if (!field) return;
		const value = draft.trim();
		if (value) {
			// The model rides along on an edited mark: she started it, a person
			// finished it, and the record says both.
			const model = dish.maitre?.[field]?.model;
			const patch: MaitrePatch = {};
			patch[field] = { value, by: 'person', ts: Date.now(), ...(model ? { model } : {}) };
			house.setMaitre(dish.id, patch);
		}
		editing = null;
		await focusEdit(field);
	}
	async function cancel() {
		const field = editing;
		editing = null;
		if (field) await focusEdit(field);
	}

	/* ---- the House's marks, through the api's door ---------------------- */

	/** Her value written back as the house's, with a fresh stamp; the model rides along. */
	function keepHouse(field: HouseField): Promise<boolean> {
		const api = house.api;
		const m = item?.[field];
		if (!api || !item || !m) return Promise.resolve(false);
		return api.setMark('dish', item.id, field, { value: m.value, by: 'person', ts: Date.now(), ...(m.model ? { model: m.model } : {}) });
	}
	function discardHouse(field: HouseField): Promise<boolean> {
		const api = house.api;
		if (!api || !item) return Promise.resolve(false);
		if (editingHouse === field) editingHouse = null;
		return api.setMark('dish', item.id, field, null);
	}
	function editHouse(field: HouseField) {
		if (!item) return;
		editing = null;
		editingHouse = field;
		if (field === 'parts') partsDraft = { ...(item.parts ? partsOf(item.parts) : { main: '', technique: '', sauce: '', sides: '', taste: '' }) };
		if (field === 'lines') linesDraft = { ...(item.lines ? linesOf(item.lines) : { s10: '', s20: '', s45: '' }) };
		if (field === 'pairing') {
			const p = item.pairing ? pairingOf(item.pairing) : emptyPairing();
			pairingDraft = { ...p, principles: [...p.principles] };
		}
	}
	async function saveHouse() {
		const field = editingHouse;
		const api = house.api;
		if (!field || !api || !item) return;
		const model = item[field]?.model;
		let value: unknown;
		if (field === 'parts') value = trimAll(partsDraft);
		else if (field === 'lines') value = trimAll(linesDraft);
		else value = { ...trimAll(pairingDraft), principles: pairingDraft.principles.slice() };
		if (hasAny(value)) {
			await api.setMark('dish', item.id, field, { value, by: 'person', ts: Date.now(), ...(model ? { model } : {}) });
		}
		editingHouse = null;
		await focusEdit(field);
	}
	async function cancelHouse() {
		const field = editingHouse;
		editingHouse = null;
		if (field) await focusEdit(field);
	}
	function trimAll<T extends object>(o: T): T {
		const out = { ...o } as Record<string, unknown>;
		for (const k of Object.keys(out)) if (typeof out[k] === 'string') out[k] = (out[k] as string).trim();
		return out as T;
	}
	function hasAny(v: unknown): boolean {
		if (!v || typeof v !== 'object') return false;
		return Object.values(v as Record<string, unknown>).some((x) => (Array.isArray(x) ? x.length > 0 : typeof x === 'string' && x.trim() !== ''));
	}
	function togglePrinciple(p: Pairing['principles'][number]) {
		const i = pairingDraft.principles.indexOf(p);
		if (i < 0) pairingDraft.principles.push(p);
		else pairingDraft.principles.splice(i, 1);
	}

	/* The api's commit door serialises every write it is handed, so the
	   store's queued put (the Floor Deck marks ride on the row) and these
	   setMarks land in order over each other's work whatever tick they start
	   in. The House marks are still awaited one at a time so a refusal stops
	   the run where it happened. The fields are taken from the list as it
	   stood when the chip was pressed. */
	async function keepAll() {
		editing = null;
		editingHouse = null;
		for (const r of unkept) house.confirmMaitre(dish.id, r.field);
		for (const r of houseUnkept.map((x) => x.field)) await keepHouse(r);
	}
	async function discardAll() {
		editing = null;
		editingHouse = null;
		for (const r of unkept) house.discardMaitre(dish.id, r.field);
		for (const r of houseUnkept.map((x) => x.field)) await discardHouse(r);
	}
</script>

{#if rows.length || houseRows.length || note || blocked.size}
	<section class="lines" bind:this={root} aria-label="What to say: {dish.name}">
		<p class="eyebrow">{unkeptCount ? 'Hers, not yet kept' : 'What to say'}</p>
		{#if named}<h4 class="dishname">{dish.name}</h4>{/if}
		<dl>
			{#each rows as r (r.field)}
				<div class="row" class:hers={r.mark.by === 'maitre'}>
					<dt>
						{r.label}
						<span class="who">{r.mark.by === 'person' ? 'Kept' : 'Hers'}</span>
						{#if blockedWord(r.field)}<span class="shift">{blockedWord(r.field)}</span>{/if}
					</dt>
					<dd>
						{#if editing === r.field}
							<textarea bind:value={draft} rows="3" aria-label="{r.label}, {dish.name}"></textarea>
							{#if dashWord(draft)}<p class="count">{dashWord(draft)}</p>{/if}
							<div class="chips">
								<button class="chip go" onclick={save}>Save</button>
								<button class="chip" onclick={cancel}>Cancel</button>
							</div>
						{:else}
							<p class="val" class:guest={r.field === 'guest'}>{r.mark.value}</p>
							<div class="chips" role="group" aria-label="{r.label}, {dish.name}">
								{#if r.mark.by === 'maitre'}
									<button class="chip go" onclick={() => keep(r.field)}>Keep</button>
								{/if}
								<button class="chip" data-edit={r.field} onclick={() => edit(r.field)}>Edit</button>
								<button class="chip" onclick={() => discard(r.field)}>Discard</button>
							</div>
						{/if}
					</dd>
				</div>
			{/each}

			{#each houseRows as r (r.field)}
				<div class="row house" class:hers={r.mark.by === 'maitre'} data-field={r.field}>
					<dt>
						{r.label}
						<span class="who">{r.mark.by === 'person' ? 'Kept' : 'Hers'}</span>
						{#if blockedWord(r.field)}<span class="shift">{blockedWord(r.field)}</span>{/if}
					</dt>
					<dd>
						{#if editingHouse === r.field}
							{#if r.field === 'parts'}
								<div class="boxes">
									{#each PART_KEYS as k (k)}
										<label class="box">
											<span class="sub">{DISH_PARTS[k]}</span>
											<textarea bind:value={partsDraft[k]} rows="2" aria-label="{DISH_PARTS[k]}, {dish.name}"></textarea>
											{#if dashWord(partsDraft[k])}<span class="count">{dashWord(partsDraft[k])}</span>{/if}
										</label>
									{/each}
								</div>
							{:else if r.field === 'lines'}
								<div class="boxes">
									{#each LINE_KEYS as k (k)}
										<label class="box">
											<span class="sub">{LINE_LABELS[k]}</span>
											<textarea bind:value={linesDraft[k]} rows={k === 's45' ? 5 : 3} aria-label="{LINE_LABELS[k]}, {dish.name}"></textarea>
											<span class="count" data-count={k}>{countLine(linesDraft[k], k)}{dashWord(linesDraft[k]) ? `, ${dashWord(linesDraft[k])}` : ''}</span>
										</label>
									{/each}
								</div>
							{:else}
								<div class="boxes">
									{#each PAIRING_KEYS as k (k)}
										{#if k === 'principles'}
											<fieldset class="box principles">
												<legend class="sub">{PAIRING_LABELS[k]}</legend>
												<div class="ticks">
													{#each PRINCIPLES as p (p)}
														<label class="tick">
															<input type="checkbox" checked={pairingDraft.principles.includes(p)} onchange={() => togglePrinciple(p)} />
															{p}
														</label>
													{/each}
												</div>
											</fieldset>
										{:else if k === 'wineId' || k === 'secondId'}
											<label class="box">
												<span class="sub">{PAIRING_LABELS[k]}</span>
												<select class="pick" bind:value={pairingDraft[k]} aria-label="{PAIRING_LABELS[k]}, {dish.name}">
													<option value="">none</option>
													{#each wines as w (w.id)}
														<option value={w.id}>{w.name}</option>
													{/each}
												</select>
											</label>
										{:else if k === 'zeroProofId'}
											<label class="box">
												<span class="sub">{PAIRING_LABELS[k]}</span>
												<select class="pick" bind:value={pairingDraft[k]} aria-label="{PAIRING_LABELS[k]}, {dish.name}">
													<option value="">none</option>
													{#each drinks as d (d.id)}
														<option value={d.id}>{d.name}{d.zeroProof ? ', without alcohol' : ''}</option>
													{/each}
												</select>
											</label>
										{:else}
											<label class="box">
												<span class="sub">{PAIRING_LABELS[k]}</span>
												<textarea bind:value={pairingDraft[k]} rows="2" aria-label="{PAIRING_LABELS[k]}, {dish.name}"></textarea>
												{#if dashWord(pairingDraft[k])}<span class="count">{dashWord(pairingDraft[k])}</span>{/if}
											</label>
										{/if}
									{/each}
								</div>
							{/if}
							<div class="chips">
								<button class="chip go" onclick={saveHouse}>Save</button>
								<button class="chip" onclick={cancelHouse}>Cancel</button>
							</div>
						{:else}
							{#if r.field === 'parts'}
								{@const p = partsOf(r.mark)}
								<dl class="inner">
									{#each PART_KEYS as k (k)}
										{#if p[k]}
											<div class="pair"><dt class="sub">{DISH_PARTS[k]}</dt><dd class="val">{p[k]}</dd></div>
										{/if}
									{/each}
								</dl>
							{:else if r.field === 'lines'}
								{@const l = linesOf(r.mark)}
								<dl class="inner">
									{#each LINE_KEYS as k (k)}
										{#if l[k]}
											<div class="pair">
												<dt class="sub">{LINE_LABELS[k]} <span class="count">{countLine(l[k], k)}</span></dt>
												<dd class="val">{l[k]}</dd>
											</div>
										{/if}
									{/each}
								</dl>
							{:else}
								{@const p = pairingOf(r.mark)}
								<dl class="inner">
									{#each PAIRING_KEYS as k (k)}
										{#if k === 'principles'}
											{#if p.principles.length}
												<div class="pair"><dt class="sub">{PAIRING_LABELS[k]}</dt><dd class="val">{p.principles.join(', ')}</dd></div>
											{/if}
										{:else if isPick(k)}
											{#if p[k]}
												<div class="pair"><dt class="sub">{PAIRING_LABELS[k]}</dt><dd class="val">{nameOf(p[k])}</dd></div>
											{/if}
										{:else if p[k]}
											<div class="pair"><dt class="sub">{PAIRING_LABELS[k]}</dt><dd class="val">{p[k]}</dd></div>
										{/if}
									{/each}
								</dl>
							{/if}
							<div class="chips" role="group" aria-label="{r.label}, {dish.name}">
								{#if r.mark.by === 'maitre'}
									<button class="chip go" onclick={() => keepHouse(r.field)}>Keep</button>
								{/if}
								<button class="chip" data-edit={r.field} onclick={() => editHouse(r.field)}>Edit</button>
								<button class="chip" onclick={() => discardHouse(r.field)}>Discard</button>
							</div>
						{/if}
					</dd>
				</div>
			{/each}

			{#if note || blocked.has('serviceNote')}
				<div class="row yours" data-field="serviceNote">
					<dt>
						{EYEBROW}
						{#if blockedWord('serviceNote')}<span class="shift">{blockedWord('serviceNote')}</span>{/if}
					</dt>
					<dd>
						{#if note}<p class="val servicenote">{note}</p>{:else}<p class="val muted">Nothing written yet. Edit the dish to write it.</p>{/if}
					</dd>
				</div>
			{/if}
		</dl>
		{#if unkeptCount > 1}
			<div class="chips all" role="group" aria-label="All of her lines on {dish.name}">
				<button class="chip go" onclick={keepAll}>{unkeptCount === 5 ? 'Keep all five' : `Keep all ${unkeptCount}`}</button>
				<button class="chip" onclick={discardAll}>Discard all</button>
			</div>
		{/if}
	</section>
{/if}

<style>
	.lines {
		margin: 8px 0 6px;
		max-width: var(--measure);
	}
	.eyebrow {
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
		margin: 0 0 4px;
	}
	.dishname {
		font-family: var(--display);
		font-size: 18px;
		margin: 0 0 4px;
	}
	dl {
		margin: 0;
	}
	.row {
		padding: 6px 0 6px 10px;
		border-left: 3px solid transparent;
		border-bottom: 1px dotted var(--line);
	}
	/* A rule and a word: an unkept row is told apart by both, never by hue alone. */
	.row.hers {
		border-left-color: var(--turmeric-deep);
	}
	dt {
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
		display: flex;
		flex-wrap: wrap;
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
	.shift {
		letter-spacing: 0.04em;
		font-weight: 700;
		color: var(--ink);
		text-transform: none;
	}
	dd {
		margin: 2px 0 0;
	}
	.val {
		margin: 0 0 6px;
		font-size: 14.5px;
		line-height: 1.5;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.val.guest {
		font-family: var(--display);
		font-size: 17px;
		line-height: 1.4;
	}
	.val.muted {
		color: var(--ink-soft);
		font-style: italic;
	}
	.inner {
		margin: 0 0 4px;
	}
	.pair {
		margin: 0 0 6px;
	}
	.pair dt,
	.sub {
		display: block;
		font-size: var(--t-micro);
		letter-spacing: 0.04em;
		text-transform: none;
		color: var(--ink-soft);
		margin: 0 0 2px;
	}
	.pair dd {
		margin: 0;
	}
	.count {
		font-size: var(--t-micro);
		letter-spacing: 0.02em;
		text-transform: none;
		color: var(--ink-soft);
		margin: 0 0 6px;
	}
	.boxes {
		display: grid;
		gap: 8px;
		margin: 0 0 8px;
	}
	.box {
		display: block;
		border: 0;
		margin: 0;
		padding: 0;
		min-width: 0;
	}
	.box .sub {
		margin-bottom: 4px;
	}
	.ticks {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 14px;
	}
	.tick {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 44px;
		font-size: 14.5px;
	}
	.tick input {
		width: 20px;
		height: 20px;
	}
	textarea,
	.pick {
		display: block;
		width: 100%;
		margin: 0 0 4px;
		border: 1px solid var(--field-line);
		background: var(--card);
		border-radius: var(--radius);
		padding: 8px 12px;
		font-size: 14.5px;
		font-family: inherit;
		color: var(--ink);
		min-height: 44px;
	}
	textarea {
		resize: vertical;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
	}
	.chips.all {
		margin-top: 8px;
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
