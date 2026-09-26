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

  HERS UNTIL SOMEBODY SAYS OTHERWISE. A mark she wrote carries by 'maitre'
  and the eyebrow reads "Hers, not yet kept" while any such mark stands. Keep
  and Save both set by 'person' (persistence/house.ts confirmMaitre and
  setMaitre), and only a kept mark reaches the guest menu, the drill or the
  deck. That line is drawn on the record, not here: this block only shows
  the word and offers the three chips. Each row says "Hers" or "Kept" in a
  word beside its label, and an unkept row carries the left rule as well,
  so the state is never a colour alone.

  Edit opens one textarea at a time. A card with five boxes open is a form,
  and a person on the floor between tables is not filling in a form. Save
  writes the person's words as a kept mark and returns focus to the row's
  Edit chip, Cancel does the same without writing.

  Full-size chips only, 44px: there is no .chip.small anywhere on the desk.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { house } from '$lib/stores/house.svelte';
	import type { MenuDish, MaitrePatch } from '$lib/persistence/state';
	import { LINE_FIELDS, type LineField } from '$lib/maitre-adopt';

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

	const rows = $derived(
		LINE_FIELDS.flatMap((field) => {
			const mark = dish.maitre?.[field];
			return mark ? [{ field, label: LABELS[field], mark }] : [];
		})
	);
	const unkept = $derived(rows.filter((r) => r.mark.by === 'maitre'));

	let editing = $state<LineField | null>(null);
	let draft = $state('');
	let root: HTMLElement | undefined = $state();

	async function focusEdit(field: LineField) {
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
	function keepAll() {
		for (const r of unkept) house.confirmMaitre(dish.id, r.field);
	}
	function discardAll() {
		editing = null;
		for (const r of unkept) house.discardMaitre(dish.id, r.field);
	}
</script>

{#if rows.length}
	<section class="lines" bind:this={root} aria-label="What to say: {dish.name}">
		<p class="eyebrow">{unkept.length ? 'Hers, not yet kept' : 'What to say'}</p>
		{#if named}<h4 class="dishname">{dish.name}</h4>{/if}
		<dl>
			{#each rows as r (r.field)}
				<div class="row" class:hers={r.mark.by === 'maitre'}>
					<dt>
						{r.label}
						<span class="who">{r.mark.by === 'person' ? 'Kept' : 'Hers'}</span>
					</dt>
					<dd>
						{#if editing === r.field}
							<textarea bind:value={draft} rows="3" aria-label="{r.label}, {dish.name}"></textarea>
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
		</dl>
		{#if unkept.length > 1}
			<div class="chips all" role="group" aria-label="All of her lines on {dish.name}">
				<button class="chip go" onclick={keepAll}>{unkept.length === 5 ? 'Keep all five' : `Keep all ${unkept.length}`}</button>
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
	textarea {
		display: block;
		width: 100%;
		margin: 0 0 6px;
		resize: vertical;
		border: 1px solid var(--field-line);
		background: var(--card);
		border-radius: var(--radius);
		padding: 8px 12px;
		font-size: 14.5px;
		font-family: inherit;
		color: var(--ink);
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
