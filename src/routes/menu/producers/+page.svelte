<script lang="ts">
	import { base } from '$app/paths';
	import { house } from '$lib/stores/house.svelte';
	import {
		PRODUCER_KINDS,
		kindLabel,
		mintProducerId,
		type Producer,
		type ProducerKind
	} from '$lib/producers';
	import Ornament from '$lib/components/Ornament.svelte';

	/**
	 * The producers: who grows it, makes it, lands it or mills it.
	 *
	 * A staff packet listed four creameries and a farm as "cheeses". They are
	 * this venue's suppliers, not shared vocabulary, so they left the Floor Deck
	 * and came here, where a venue writes down its own: where they are, what
	 * they supply, the story a server can tell at the table, and the dishes they
	 * are on. Nothing is seeded. See lib/producers.ts, including why the dish
	 * link is kept on the producer and not on the dish.
	 *
	 * Everything below the H1 sits inside ONE <article class="sheet">, for the
	 * reason /menu/preps gives: shared/oot-locks.js does a singular
	 * querySelector('article.sheet').
	 *
	 * The paywall's selector classes are deliberately absent here: see the
	 * CONTRACT in src/lib/navigation.test.ts.
	 */

	let form = $state<null | {
		id: string | null;
		name: string;
		place: string;
		kind: ProducerKind;
		supplies: string;
		story: string;
		dishIds: string[];
	}>(null);

	const blank = () => ({
		id: null,
		name: '',
		place: '',
		kind: 'creamery' as ProducerKind,
		supplies: '',
		story: '',
		dishIds: [] as string[]
	});

	function edit(p: Producer) {
		form = {
			id: p.id,
			name: p.name,
			place: p.place,
			kind: p.kind,
			supplies: p.supplies,
			story: p.story,
			// Carried whole, including an id whose dish has since gone: the form
			// only offers the dishes that exist, and dropping the rest here would
			// make an edit of the story a silent edit of the links too.
			dishIds: [...p.dishIds]
		};
	}

	function toggleDish(id: string) {
		if (!form) return;
		form.dishIds = form.dishIds.includes(id)
			? form.dishIds.filter((d) => d !== id)
			: [...form.dishIds, id];
	}

	function save() {
		if (!form || !form.name.trim()) return;
		house.saveProducer({
			id: form.id ?? mintProducerId(house.producers.map((p) => p.id)),
			name: form.name,
			place: form.place,
			kind: form.kind,
			supplies: form.supplies,
			story: form.story,
			dishIds: form.dishIds,
			// Stamped by the store; see saveProducer.
			ts: 0
		});
		form = null;
	}

	/** The dishes this producer is on that still exist, in menu order. */
	const dishesOf = (p: Producer) => house.dishes.filter((d) => p.dishIds.includes(d.id));

	/** Same confirm pattern as a prep: say what goes with it before it goes. */
	function remove(p: Producer) {
		const on = dishesOf(p);
		const warn = on.length
			? `${p.name} is on ${on.length} ${on.length === 1 ? 'dish' : 'dishes'} (${on
					.map((d) => d.name)
					.join(', ')}). Those dishes will stop naming it. Remove it?`
			: `Remove ${p.name}?`;
		if (confirm(warn)) house.removeProducer(p.id);
	}
</script>

<svelte:head><title>Producers · The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<p class="crumbs"><a href="{base}/menu">◂ My Menu</a></p>
		<h1>Producers</h1>
		<p class="lede">
			Who the house buys from: the creamery, the farm, the boat, the mill. Write down where they are,
			what they supply and the story worth telling at a table, then tie them to the dishes they are
			on.
		</p>
		<nav class="tools" data-print="hide" aria-label="Menu sheets">
			<a class="chip" href="{base}/menu">← The worksheet</a>
			<a class="chip" href="{base}/menu/preps">Preps</a>
			<a class="chip" href="{base}/menu/costing">The costing sheet</a>
		</nav>
	</header>

	<article class="sheet">
		<Ornament seed="producers" />

		<!-- Only once the record is read: before hydration an empty list is
		     "not loaded yet", and saying "nothing yet" over a venue's real
		     producers is the flash this avoids. -->
		{#if house.blocked}
			<!-- A record this build cannot read (a newer build wrote it, or it
			     would not open) is held unread and empty: "nothing yet" here would
			     be the same lie, and the Add button below is disabled for this
			     reason. The words are /menu's, so the two pages agree. -->
			<p class="blocked" role="alert">
				<b>This device is running an older version of the app than the one that saved your menu.</b>
				Nothing has been lost and nothing will be overwritten, but the producers stay hidden until
				this tablet updates. Reload, or close and reopen the app, to pick it up.
			</p>
		{:else if house.ready && !house.producers.length && !form}
			<p class="empty">
				Nothing yet. Add the producers a guest might ask about: the creamery behind the cheese
				board, the farm behind the greens. Each one can be tied to the dishes it is on, and once
				there are four producers and four dishes, the menu drill will ask about them.
			</p>
		{/if}

		<ul class="producers">
			{#each house.producers as p (p.id)}
				{@const on = dishesOf(p)}
				<li>
					<h2 class="nm">{p.name}</h2>
					<p class="meta">
						{kindLabel(p.kind)}{#if p.place}{' '}· {p.place}{/if}
					</p>
					{#if p.supplies}<p class="supplies">Supplies {p.supplies}</p>{/if}
					{#if p.story}<p class="story">{p.story}</p>{/if}
					{#if on.length}
						<p class="used">
							On
							{#each on as d, i (d.id)}{#if i > 0}{i === on.length - 1 ? ' and ' : ', '}{/if}<a
									href="{base}/menu#dish-{d.id}">{d.name}</a
								>{/each}
						</p>
					{/if}
					<div class="acts" data-print="hide">
						<button class="chip" onclick={() => edit(p)} aria-label="Edit {p.name}">Edit</button>
						<button class="chip" onclick={() => remove(p)} aria-label="Remove {p.name}">Remove</button>
					</div>
				</li>
			{/each}
		</ul>

		{#if form}
			<form
				class="editor"
				aria-labelledby="producer-form-title"
				onsubmit={(e) => {
					e.preventDefault();
					save();
				}}
			>
				<h2 id="producer-form-title" class="sec">
					{form.id ? 'Edit the producer' : 'A new producer'}
				</h2>
				<div class="frow">
					<label>
						Name
						<input bind:value={form.name} placeholder="Sweet Grass Dairy" required />
					</label>
					<label>
						Where
						<input bind:value={form.place} placeholder="Thomasville, Georgia" />
					</label>
					<label>
						Kind
						<select bind:value={form.kind}>
							{#each PRODUCER_KINDS as k (k.kind)}<option value={k.kind}>{k.label}</option>{/each}
						</select>
					</label>
				</div>
				<label class="wide">
					What they supply
					<input bind:value={form.supplies} placeholder="the Green Hill and the Thomasville Tomme" />
				</label>
				<label class="wide">
					The story
					<textarea
						rows="4"
						bind:value={form.story}
						placeholder="A few sentences a server can tell at the table."
					></textarea>
				</label>

				<fieldset class="dishpick">
					<legend>On these dishes</legend>
					{#if house.dishes.length}
						{#each house.dishes as d (d.id)}
							<label class="tick">
								<input
									type="checkbox"
									checked={form.dishIds.includes(d.id)}
									onchange={() => toggleDish(d.id)}
								/>
								{d.name}
							</label>
						{/each}
					{:else}
						<p class="hint">
							No dishes on <a href="{base}/menu">the menu</a> yet. A producer saves without them, and
							can be tied to dishes later from here or from the dish form.
						</p>
					{/if}
				</fieldset>

				<div class="frow" data-print="hide">
					<button type="submit" class="chip go" disabled={!form.name.trim()}>
						{form.id ? 'Save the producer' : 'Add the producer'}
					</button>
					<button type="button" class="chip" onclick={() => (form = null)}>Cancel</button>
				</div>
			</form>
		{:else}
			<!-- Disabled until the record is read. A save before hydration is the one
			     tap #persist() drops on purpose (see the store), so the button says
			     so rather than appearing to work. -->
			<button
				class="chip go"
				data-print="hide"
				disabled={!house.ready || house.blocked}
				onclick={() => (form = blank())}>Add a producer</button
			>
		{/if}
	</article>
</div>

<style>
	/*
	 * padding-BLOCK, deliberately. The shorthand `padding: 26px 0 80px` zeroed
	 * padding-inline, and this scoped rule out-specifies the global
	 * `.shell { padding-inline: 20px }`, so a page written that way ships with
	 * its text touching the glass on phones. Six routes once did; see
	 * tests/layout.spec.ts.
	 */
	.view {
		padding-block: 26px 80px;
		max-width: 760px;
	}
	.crumbs {
		font-size: var(--t-micro);
		margin-bottom: 14px;
	}
	.crumbs a {
		color: var(--muted);
		text-decoration: none;
	}
	.crumbs a:hover {
		color: inherit;
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
	/* 44px, the house floor for anything tapped. The global .chip sets none. */
	.chip {
		min-height: 44px;
	}
	.producers {
		list-style: none;
		margin: 0 0 18px;
		padding: 0;
	}
	.producers > li {
		border-bottom: 1px solid var(--line);
		padding: 14px 0;
	}
	.nm {
		font-family: var(--display);
		font-size: 20px;
		font-weight: 600;
		margin: 0;
	}
	.meta,
	.supplies,
	.used {
		color: var(--ink-soft);
		font-size: var(--t-small, 0.8125rem);
		margin: 4px 0 0;
	}
	.used a {
		color: inherit;
	}
	.story {
		max-width: var(--measure);
		margin: 8px 0 0;
		line-height: 1.6;
	}
	.acts {
		display: flex;
		gap: 8px;
		margin-top: 10px;
	}
	.editor {
		border-top: 1px solid var(--line);
		padding-top: 14px;
		display: grid;
		gap: 10px;
	}
	.sec {
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
		font-weight: 500;
		margin: 0 0 4px;
	}
	.frow {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.editor label:not(.tick) {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: var(--t-small, 0.8125rem);
		color: var(--ink-soft);
	}
	.frow label {
		flex: 1 1 180px;
		min-width: 0;
	}
	.editor input:not([type='checkbox']),
	.editor select,
	.editor textarea {
		border: 1px solid var(--field-line);
		background: var(--card);
		color: var(--ink);
		padding: 8px 10px;
		border-radius: var(--radius);
		min-height: 44px;
		font: inherit;
		width: 100%;
		box-sizing: border-box;
	}
	.dishpick {
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 8px 12px 10px;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0 18px;
		min-width: 0;
	}
	.dishpick legend {
		font-size: var(--t-small, 0.8125rem);
		color: var(--ink-soft);
		padding: 0 4px;
	}
	/* The whole label is the target, and it is 44px tall. */
	.tick {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		cursor: pointer;
	}
	.tick input {
		width: 20px;
		height: 20px;
		accent-color: var(--leaf);
	}
	.hint {
		color: var(--ink-soft);
		font-size: var(--t-small, 0.8125rem);
		margin: 4px 0;
	}
	.hint a {
		color: inherit;
	}
	.empty {
		color: var(--ink-soft);
		max-width: var(--measure);
	}
	/* /menu's .blocked, so the warning looks the same on both pages. */
	.blocked {
		border: 1px solid var(--chili);
		border-left-width: 3px;
		border-radius: var(--radius);
		padding: 12px 14px;
		margin: 0 0 16px;
		line-height: 1.55;
	}
</style>
