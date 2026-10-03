<!--
  The house's lists on /menu: the lexicon (term, how to say it, to the
  guest), the guest conversations (title, what the guest says, what you say,
  the principle), the mix-ups (two items resolved to names, the difference,
  the question that settles it), the must-knows (title, body), the tastings
  (a table, every course resolved to its dish names and its pour) and the
  lineup register (askAtLineup: question, who to ask, answer, answered on).

  Every mark on an entry is Hers or Kept, with Keep, Edit and Discard
  through api.setMark(list, id, field, mark): Keep writes her value back
  with by 'person' and a fresh stamp, Save writes the typed value the same
  way, Discard writes null. An entry is added by hand through
  api.putListItem (the api mints the list's own id prefix) with what was
  typed filed as a person's marks, and removed through api.removeItem,
  which writes a tombstone so no device brings it back. A question for
  lineup that holds up a field (blocksField) and has no answer carries the
  words "confirm on shift"; the same words sit beside that field on the
  item's own rows (MaitreLines).

  Reads house.current, which moves with the store's tick; prerendered as
  nothing, like the card. One editor open at a time across the six lists.
  Every control 44px, every state a word, no colour alone.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { house } from '$lib/stores/house.svelte';
	import type { Mark, AskWhom, TastingCourse } from '$lib/house/house-schema';
	import { hasDash } from '$lib/house/house-lines';

	type MarkList = 'lexicon' | 'scenarios' | 'mixUps' | 'mustKnows';
	const WHOM: AskWhom[] = ['chef', 'sommelier', 'bar', 'manager'];

	const current = $derived(house.current);
	const items = $derived.by(() => {
		if (!current) return [] as Array<{ id: string; name: string; kind: string }>;
		return [
			...current.dishes.map((d) => ({ id: d.id, name: d.name, kind: 'dish' })),
			...current.wines.map((w) => ({ id: w.id, name: w.name, kind: 'wine' })),
			...current.cocktails.map((c) => ({ id: c.id, name: c.name, kind: 'drink' }))
		];
	});
	const nameOf = (id: string) => (id ? (items.find((i) => i.id === id)?.name ?? 'an item no longer on the list') : 'none');
	const namesOf = (ids: string[]) => ids.map(nameOf).join(', ');
	const pourOf = (c: TastingCourse) => (c.pourId ? nameOf(c.pourId) : c.pourText || 'No pour printed');
	const dashWord = (s: string) => (hasDash(s) ? 'carries a dash' : '');
	const personMark = (value: string, model?: string): Mark => ({ value, by: 'person', ts: Date.now(), ...(model ? { model } : {}) });

	/* ---- the marks, one editor at a time ---- */
	let editing = $state('');
	let draft = $state('');
	let root: HTMLElement | undefined = $state();
	const key = (list: string, id: string, field: string) => `${list}:${id}:${field}`;

	async function focus(sel: string) {
		await tick();
		root?.querySelector<HTMLElement>(sel)?.focus();
	}
	function keep(list: MarkList, id: string, field: string, m: Mark) {
		const api = house.api;
		if (!api) return;
		void api.setMark(list, id, field, personMark(m.value, m.model));
	}
	function discard(list: MarkList, id: string, field: string) {
		const api = house.api;
		if (!api) return;
		if (editing === key(list, id, field)) editing = '';
		void api.setMark(list, id, field, null);
	}
	function edit(list: MarkList, id: string, field: string, m: Mark | undefined) {
		adding = '';
		answering = '';
		editing = key(list, id, field);
		draft = m?.value ?? '';
	}
	async function save(list: MarkList, id: string, field: string, m: Mark | undefined) {
		const api = house.api;
		const value = draft.trim();
		if (api && value) await api.setMark(list, id, field, personMark(value, m?.model));
		editing = '';
		await focus(`[data-edit="${key(list, id, field)}"]`);
	}
	async function cancel(list: MarkList, id: string, field: string) {
		editing = '';
		await focus(`[data-edit="${key(list, id, field)}"]`);
	}
	async function remove(list: 'tastings' | 'askAtLineup' | MarkList, id: string) {
		const api = house.api;
		if (!api) return;
		await api.removeItem(list, id);
		said = 'Removed.';
	}

	/* ---- adding by hand ---- */
	type AddPanel = '' | 'lexicon' | 'scenarios' | 'mixUps' | 'mustKnows' | 'tastings' | 'askAtLineup';
	let adding = $state<AddPanel>('');
	let said = $state('');
	let term = $state({ term: '', say: '', toGuest: '', itemIds: [] as string[] });
	let scenario = $state({ title: '', guest: '', you: '', principle: '', itemIds: [] as string[] });
	let mixUp = $state({ aId: '', bId: '', difference: '', ask: '' });
	let mustKnow = $state({ title: '', body: '' });
	let tasting = $state({ name: '', price: '', meal: '', includesDrinks: false, note: '', courses: [] as Array<{ label: string; dishIds: string[]; pourId: string; pourText: string }> });
	let ask = $state({ question: '', askWhom: 'chef' as AskWhom, itemIds: [] as string[], blocksField: '', answer: '', answeredOn: '' });
	/** The lineup question whose answer is being written, by id. */
	let answering = $state('');
	let answerDraft = $state({ answer: '', answeredOn: '' });

	function openAdd(p: AddPanel) {
		editing = '';
		answering = '';
		said = '';
		adding = adding === p ? '' : p;
	}
	function toggleId(list: string[], id: string) {
		const i = list.indexOf(id);
		if (i < 0) list.push(id);
		else list.splice(i, 1);
	}
	async function addTerm() {
		const api = house.api;
		if (!api || !term.term.trim()) return;
		const out = await api.putListItem('lexicon', {
			term: term.term.trim(),
			itemIds: term.itemIds.slice(),
			...(term.say.trim() ? { say: personMark(term.say.trim()) } : {}),
			...(term.toGuest.trim() ? { toGuest: personMark(term.toGuest.trim()) } : {})
		});
		said = out ? `${out.term} added.` : 'The term could not be written on this device.';
		if (out) {
			term = { term: '', say: '', toGuest: '', itemIds: [] };
			adding = '';
		}
	}
	async function addScenario() {
		const api = house.api;
		if (!api || !scenario.title.trim()) return;
		const out = await api.putListItem('scenarios', {
			title: scenario.title.trim(),
			guest: scenario.guest.trim(),
			itemIds: scenario.itemIds.slice(),
			...(scenario.you.trim() ? { you: personMark(scenario.you.trim()) } : {}),
			...(scenario.principle.trim() ? { principle: personMark(scenario.principle.trim()) } : {})
		});
		said = out ? `${out.title} added.` : 'The conversation could not be written on this device.';
		if (out) {
			scenario = { title: '', guest: '', you: '', principle: '', itemIds: [] };
			adding = '';
		}
	}
	async function addMixUp() {
		const api = house.api;
		if (!api || !mixUp.aId || !mixUp.bId || mixUp.aId === mixUp.bId) return;
		const out = await api.putListItem('mixUps', {
			aId: mixUp.aId,
			bId: mixUp.bId,
			...(mixUp.difference.trim() ? { difference: personMark(mixUp.difference.trim()) } : {}),
			...(mixUp.ask.trim() ? { ask: personMark(mixUp.ask.trim()) } : {})
		});
		said = out ? 'Mix-up added.' : 'The mix-up could not be written on this device.';
		if (out) {
			mixUp = { aId: '', bId: '', difference: '', ask: '' };
			adding = '';
		}
	}
	async function addMustKnow() {
		const api = house.api;
		if (!api || !mustKnow.title.trim()) return;
		const out = await api.putListItem('mustKnows', {
			title: mustKnow.title.trim(),
			...(mustKnow.body.trim() ? { body: personMark(mustKnow.body.trim()) } : {})
		});
		said = out ? `${out.title} added.` : 'The must-know could not be written on this device.';
		if (out) {
			mustKnow = { title: '', body: '' };
			adding = '';
		}
	}
	function addCourse() {
		tasting.courses.push({ label: '', dishIds: [], pourId: '', pourText: '' });
	}
	async function addTasting() {
		const api = house.api;
		if (!api || !tasting.name.trim()) return;
		const out = await api.putListItem('tastings', {
			name: tasting.name.trim(),
			price: tasting.price.trim(),
			meal: tasting.meal.trim(),
			includesDrinks: tasting.includesDrinks,
			note: tasting.note.trim(),
			courses: tasting.courses.map((c, i) => ({ n: i + 1, label: c.label.trim(), dishIds: c.dishIds.slice(), pourId: c.pourId, pourText: c.pourText.trim() }))
		});
		said = out ? `${out.name} added.` : 'The tasting could not be written on this device.';
		if (out) {
			tasting = { name: '', price: '', meal: '', includesDrinks: false, note: '', courses: [] };
			adding = '';
		}
	}
	async function addAsk() {
		const api = house.api;
		if (!api || !ask.question.trim()) return;
		const out = await api.putListItem('askAtLineup', {
			question: ask.question.trim(),
			askWhom: ask.askWhom,
			itemIds: ask.itemIds.slice(),
			...(ask.blocksField.trim() ? { blocksField: ask.blocksField.trim() } : {}),
			...(ask.answer.trim() ? { answer: ask.answer.trim() } : {}),
			...(ask.answeredOn.trim() ? { answeredOn: ask.answeredOn.trim() } : {})
		});
		said = out ? 'Question added to the lineup register.' : 'The question could not be written on this device.';
		if (out) {
			ask = { question: '', askWhom: 'chef', itemIds: [], blocksField: '', answer: '', answeredOn: '' };
			adding = '';
		}
	}
	function openAnswer(id: string, answer: string, answeredOn: string) {
		editing = '';
		adding = '';
		answering = id;
		answerDraft = { answer, answeredOn };
	}
	async function saveAnswer(id: string) {
		const api = house.api;
		if (!api) return;
		const out = await api.putListItem('askAtLineup', { id, answer: answerDraft.answer.trim(), answeredOn: answerDraft.answeredOn.trim() });
		said = out ? 'Answer filed.' : 'The answer could not be written on this device.';
		answering = '';
	}
</script>

{#snippet markRow(list: MarkList, id: string, field: string, label: string, m: Mark | undefined, who: string)}
	<div class="mrow" class:hers={m?.by === 'maitre'} data-field={field}>
		<p class="rowhead">
			{label}
			{#if m}<span class="who">{m.by === 'person' ? 'Kept' : 'Hers'}</span>{/if}
		</p>
		{#if editing === key(list, id, field)}
			<textarea bind:value={draft} rows="3" aria-label="{label}, {who}"></textarea>
			{#if dashWord(draft)}<p class="count">{dashWord(draft)}</p>{/if}
			<div class="chips">
				<button class="chip go" onclick={() => save(list, id, field, m)}>Save</button>
				<button class="chip" onclick={() => cancel(list, id, field)}>Cancel</button>
			</div>
		{:else}
			{#if m}<p class="val">{m.value}</p>{:else}<p class="val muted">Nothing written yet.</p>{/if}
			<div class="chips" role="group" aria-label="{label}, {who}">
				{#if m && m.by === 'maitre'}
					<button class="chip go" onclick={() => keep(list, id, field, m)}>Keep</button>
				{/if}
				<button class="chip" data-edit={key(list, id, field)} onclick={() => edit(list, id, field, m)}>Edit</button>
				{#if m}<button class="chip" onclick={() => discard(list, id, field)}>Discard</button>{/if}
			</div>
		{/if}
	</div>
{/snippet}

{#snippet itemTicks(chosen: string[], label: string)}
	<fieldset class="ticks">
		<legend class="sub">{label}</legend>
		{#each items as it (it.id)}
			<label class="tick"><input type="checkbox" checked={chosen.includes(it.id)} onchange={() => toggleId(chosen, it.id)} />{it.name}</label>
		{/each}
	</fieldset>
{/snippet}

{#if current}
	<section class="houselists" bind:this={root} aria-labelledby="houselists-h" data-print="hide">
		<h3 class="eyebrow" id="houselists-h">The house's lists</h3>
		<p class="said" role="status" aria-live="polite">{said}</p>

		<!-- The lexicon -->
		<section class="list" aria-labelledby="hl-lexicon">
			<h4 id="hl-lexicon">The lexicon</h4>
			{#if !current.lexicon.length}<p class="muted">Nothing here yet.</p>{/if}
			<ul class="entries">
				{#each current.lexicon as t (t.id)}
					<li class="entry" data-id={t.id}>
						<p class="title">{t.term}</p>
						{#if t.itemIds.length}<p class="about">About {namesOf(t.itemIds)}</p>{/if}
						{@render markRow('lexicon', t.id, 'say', 'How to say it', t.say, t.term)}
						{@render markRow('lexicon', t.id, 'toGuest', 'To a guest', t.toGuest, t.term)}
						<div class="chips"><button class="chip" onclick={() => remove('lexicon', t.id)}>Remove {t.term}</button></div>
					</li>
				{/each}
			</ul>
			{#if adding === 'lexicon'}
				<div class="form">
					<label class="field"><span class="sub">The term</span><input bind:value={term.term} aria-label="The term" /></label>
					<label class="field"><span class="sub">How to say it</span><input bind:value={term.say} aria-label="How to say it" /></label>
					<label class="field"><span class="sub">To a guest</span><textarea rows="2" bind:value={term.toGuest} aria-label="To a guest"></textarea></label>
					{@render itemTicks(term.itemIds, 'On which items')}
					<div class="chips">
						<button class="chip go" onclick={addTerm} disabled={!term.term.trim()}>Add the term</button>
						<button class="chip" onclick={() => (adding = '')}>Cancel</button>
					</div>
				</div>
			{:else}
				<div class="chips"><button class="chip" onclick={() => openAdd('lexicon')}>Add a term</button></div>
			{/if}
		</section>

		<!-- The guest conversations -->
		<section class="list" aria-labelledby="hl-scenarios">
			<h4 id="hl-scenarios">Guest conversations</h4>
			{#if !current.scenarios.length}<p class="muted">Nothing here yet.</p>{/if}
			<ul class="entries">
				{#each current.scenarios as s (s.id)}
					<li class="entry" data-id={s.id}>
						<p class="title">{s.title}</p>
						<p class="rowhead">The guest</p>
						<p class="val">{s.guest || 'nothing recorded'}</p>
						{#if s.itemIds.length}<p class="about">About {namesOf(s.itemIds)}</p>{/if}
						{@render markRow('scenarios', s.id, 'you', 'What you say', s.you, s.title)}
						{@render markRow('scenarios', s.id, 'principle', 'The principle', s.principle, s.title)}
						<div class="chips"><button class="chip" onclick={() => remove('scenarios', s.id)}>Remove {s.title}</button></div>
					</li>
				{/each}
			</ul>
			{#if adding === 'scenarios'}
				<div class="form">
					<label class="field"><span class="sub">Title</span><input bind:value={scenario.title} aria-label="Conversation title" /></label>
					<label class="field"><span class="sub">What the guest says</span><textarea rows="2" bind:value={scenario.guest} aria-label="What the guest says"></textarea></label>
					<label class="field"><span class="sub">What you say</span><textarea rows="3" bind:value={scenario.you} aria-label="What you say"></textarea></label>
					<label class="field"><span class="sub">The principle</span><input bind:value={scenario.principle} aria-label="The principle" /></label>
					{@render itemTicks(scenario.itemIds, 'About which items')}
					<div class="chips">
						<button class="chip go" onclick={addScenario} disabled={!scenario.title.trim()}>Add the conversation</button>
						<button class="chip" onclick={() => (adding = '')}>Cancel</button>
					</div>
				</div>
			{:else}
				<div class="chips"><button class="chip" onclick={() => openAdd('scenarios')}>Add a conversation</button></div>
			{/if}
		</section>

		<!-- The mix-ups -->
		<section class="list" aria-labelledby="hl-mixups">
			<h4 id="hl-mixups">Mix-ups</h4>
			{#if !current.mixUps.length}<p class="muted">Nothing here yet.</p>{/if}
			<ul class="entries">
				{#each current.mixUps as m (m.id)}
					<li class="entry" data-id={m.id}>
						<p class="title">{nameOf(m.aId)} or {nameOf(m.bId)}</p>
						{@render markRow('mixUps', m.id, 'difference', 'What tells them apart', m.difference, `${nameOf(m.aId)} or ${nameOf(m.bId)}`)}
						{@render markRow('mixUps', m.id, 'ask', 'The question that settles it', m.ask, `${nameOf(m.aId)} or ${nameOf(m.bId)}`)}
						<div class="chips"><button class="chip" onclick={() => remove('mixUps', m.id)}>Remove this mix-up</button></div>
					</li>
				{/each}
			</ul>
			{#if adding === 'mixUps'}
				<div class="form">
					<label class="field"><span class="sub">The first item</span>
						<select bind:value={mixUp.aId} aria-label="The first item"><option value="">pick one</option>{#each items as it (it.id)}<option value={it.id}>{it.name}</option>{/each}</select>
					</label>
					<label class="field"><span class="sub">The second item</span>
						<select bind:value={mixUp.bId} aria-label="The second item"><option value="">pick one</option>{#each items as it (it.id)}<option value={it.id}>{it.name}</option>{/each}</select>
					</label>
					<label class="field"><span class="sub">What tells them apart</span><textarea rows="2" bind:value={mixUp.difference} aria-label="What tells them apart"></textarea></label>
					<label class="field"><span class="sub">The question that settles it</span><input bind:value={mixUp.ask} aria-label="The question that settles it" /></label>
					<div class="chips">
						<button class="chip go" onclick={addMixUp} disabled={!mixUp.aId || !mixUp.bId || mixUp.aId === mixUp.bId}>Add the mix-up</button>
						<button class="chip" onclick={() => (adding = '')}>Cancel</button>
					</div>
				</div>
			{:else}
				<div class="chips"><button class="chip" onclick={() => openAdd('mixUps')}>Add a mix-up</button></div>
			{/if}
		</section>

		<!-- The must-knows -->
		<section class="list" aria-labelledby="hl-mustknows">
			<h4 id="hl-mustknows">Must-knows</h4>
			{#if !current.mustKnows.length}<p class="muted">Nothing here yet.</p>{/if}
			<ul class="entries">
				{#each current.mustKnows as k (k.id)}
					<li class="entry" data-id={k.id}>
						<p class="title">{k.title}</p>
						{@render markRow('mustKnows', k.id, 'body', 'What to know', k.body, k.title)}
						<div class="chips"><button class="chip" onclick={() => remove('mustKnows', k.id)}>Remove {k.title}</button></div>
					</li>
				{/each}
			</ul>
			{#if adding === 'mustKnows'}
				<div class="form">
					<label class="field"><span class="sub">Title</span><input bind:value={mustKnow.title} aria-label="Must-know title" /></label>
					<label class="field"><span class="sub">What to know</span><textarea rows="3" bind:value={mustKnow.body} aria-label="What to know"></textarea></label>
					<div class="chips">
						<button class="chip go" onclick={addMustKnow} disabled={!mustKnow.title.trim()}>Add the must-know</button>
						<button class="chip" onclick={() => (adding = '')}>Cancel</button>
					</div>
				</div>
			{:else}
				<div class="chips"><button class="chip" onclick={() => openAdd('mustKnows')}>Add a must-know</button></div>
			{/if}
		</section>

		<!-- The tastings -->
		<section class="list" aria-labelledby="hl-tastings">
			<h4 id="hl-tastings">Tastings</h4>
			{#if !current.tastings.length}<p class="muted">Nothing here yet.</p>{/if}
			{#each current.tastings as t (t.id)}
				<div class="entry" data-id={t.id}>
					<p class="title">{t.name}{#if t.price}, {t.price}{/if}{#if t.meal}, {t.meal}{/if}</p>
					<p class="about">{t.includesDrinks ? 'Drinks included' : 'Drinks not included'}{#if t.note}. {t.note}{/if}</p>
					{#if t.courses.length}
						<table class="courses">
							<thead><tr><th scope="col">Course</th><th scope="col">Dishes</th><th scope="col">Pour</th></tr></thead>
							<tbody>
								{#each t.courses as c (c.n)}
									<tr><td>{c.n}. {c.label}</td><td>{c.dishIds.length ? namesOf(c.dishIds) : 'none'}</td><td>{pourOf(c)}</td></tr>
								{/each}
							</tbody>
						</table>
					{/if}
					<div class="chips"><button class="chip" onclick={() => remove('tastings', t.id)}>Remove {t.name}</button></div>
				</div>
			{/each}
			{#if adding === 'tastings'}
				<div class="form">
					<label class="field"><span class="sub">Name</span><input bind:value={tasting.name} aria-label="Tasting name" /></label>
					<label class="field"><span class="sub">Price</span><input bind:value={tasting.price} aria-label="Tasting price" /></label>
					<label class="field"><span class="sub">Meal</span><input bind:value={tasting.meal} aria-label="Tasting meal" /></label>
					<label class="tick"><input type="checkbox" bind:checked={tasting.includesDrinks} />Drinks included</label>
					<label class="field"><span class="sub">Note</span><input bind:value={tasting.note} aria-label="Tasting note" /></label>
					{#each tasting.courses as c, i (i)}
						<fieldset class="field course">
							<legend class="sub">Course {i + 1}</legend>
							<input bind:value={c.label} placeholder="Label" aria-label="Course {i + 1}, label" />
							{@render itemTicks(c.dishIds, 'Dishes')}
							<label class="field"><span class="sub">Pour</span>
								<select bind:value={c.pourId} aria-label="Course {i + 1}, pour"><option value="">none</option>{#each items.filter((it) => it.kind !== 'dish') as it (it.id)}<option value={it.id}>{it.name}</option>{/each}</select>
							</label>
							<input bind:value={c.pourText} placeholder="The pour as printed, or blank" aria-label="Course {i + 1}, pour as printed" />
						</fieldset>
					{/each}
					<div class="chips">
						<button class="chip" onclick={addCourse}>Add a course</button>
						<button class="chip go" onclick={addTasting} disabled={!tasting.name.trim()}>Add the tasting</button>
						<button class="chip" onclick={() => (adding = '')}>Cancel</button>
					</div>
				</div>
			{:else}
				<div class="chips"><button class="chip" onclick={() => openAdd('tastings')}>Add a tasting</button></div>
			{/if}
		</section>

		<!-- The lineup register -->
		<section class="list" aria-labelledby="hl-lineup">
			<h4 id="hl-lineup">Ask at lineup</h4>
			{#if !current.askAtLineup.length}<p class="muted">Nothing here yet.</p>{/if}
			<ul class="entries">
				{#each current.askAtLineup as a (a.id)}
					<li class="entry" data-id={a.id}>
						<p class="title">
							{a.question}
							{#if a.blocksField && !(a.answer && a.answer.trim())}<span class="shift">confirm on shift</span>{/if}
						</p>
						<p class="about">Ask the {a.askWhom}{#if a.itemIds.length}, about {namesOf(a.itemIds)}{/if}{#if a.blocksField}, holds up {a.blocksField}{/if}</p>
						{#if answering === a.id}
							<div class="form">
								<label class="field"><span class="sub">The answer</span><textarea rows="2" bind:value={answerDraft.answer} aria-label="The answer"></textarea></label>
								<label class="field"><span class="sub">Answered on</span><input bind:value={answerDraft.answeredOn} placeholder="2026-10-03" aria-label="Answered on" /></label>
								<div class="chips">
									<button class="chip go" onclick={() => saveAnswer(a.id)}>Save the answer</button>
									<button class="chip" onclick={() => (answering = '')}>Cancel</button>
								</div>
							</div>
						{:else}
							{#if a.answer}<p class="val">Answered{#if a.answeredOn} on {a.answeredOn}{/if}: {a.answer}</p>{:else}<p class="val muted">No answer yet.</p>{/if}
							<div class="chips">
								<button class="chip" onclick={() => openAnswer(a.id, a.answer ?? '', a.answeredOn ?? '')}>{a.answer ? 'Edit the answer' : 'Answer it'}</button>
								<button class="chip" onclick={() => remove('askAtLineup', a.id)}>Remove this question</button>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
			{#if adding === 'askAtLineup'}
				<div class="form">
					<label class="field"><span class="sub">The question</span><textarea rows="2" bind:value={ask.question} aria-label="The question"></textarea></label>
					<label class="field"><span class="sub">Who to ask</span>
						<select bind:value={ask.askWhom} aria-label="Who to ask">{#each WHOM as w (w)}<option value={w}>the {w}</option>{/each}</select>
					</label>
					{@render itemTicks(ask.itemIds, 'About which items')}
					<label class="field"><span class="sub">The field it holds up, or blank</span><input bind:value={ask.blocksField} placeholder="serviceNote, lines, parts, pairing" aria-label="The field it holds up" /></label>
					<label class="field"><span class="sub">The answer, if you have it</span><input bind:value={ask.answer} aria-label="The answer" /></label>
					<label class="field"><span class="sub">Answered on</span><input bind:value={ask.answeredOn} aria-label="Answered on" /></label>
					<div class="chips">
						<button class="chip go" onclick={addAsk} disabled={!ask.question.trim()}>Add the question</button>
						<button class="chip" onclick={() => (adding = '')}>Cancel</button>
					</div>
				</div>
			{:else}
				<div class="chips"><button class="chip" onclick={() => openAdd('askAtLineup')}>Add a question for lineup</button></div>
			{/if}
		</section>
	</section>
{/if}

<style>
	.houselists {
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
	.list {
		margin: 0 0 14px;
		padding: 0 0 6px;
		border-bottom: 1px solid var(--line);
	}
	.list h4 {
		font-family: var(--display);
		font-size: 18px;
		margin: 8px 0 4px;
	}
	.entries {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.entry {
		padding: 6px 0 8px;
		border-bottom: 1px dotted var(--line);
	}
	.title {
		margin: 0 0 2px;
		font-weight: 600;
		font-size: 15px;
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: baseline;
	}
	.about {
		margin: 0 0 4px;
		font-size: 14px;
		color: var(--ink-soft);
	}
	.mrow {
		padding: 4px 0 4px 10px;
		border-left: 3px solid transparent;
	}
	.mrow.hers {
		border-left-color: var(--turmeric-deep);
	}
	.rowhead {
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
		margin: 0 0 2px;
		display: flex;
		gap: 10px;
		align-items: baseline;
	}
	.who {
		letter-spacing: 0.04em;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.mrow.hers .who {
		color: var(--turmeric-deep);
	}
	.shift {
		font-size: var(--t-micro);
		letter-spacing: 0.04em;
		font-weight: 700;
		color: var(--ink);
	}
	.val {
		margin: 0 0 6px;
		font-size: 14.5px;
		line-height: 1.5;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.muted {
		color: var(--ink-soft);
		font-style: italic;
		margin: 0 0 6px;
		font-size: 14px;
	}
	.courses {
		border-collapse: collapse;
		width: 100%;
		font-size: 14px;
		margin: 0 0 6px;
	}
	.courses th,
	.courses td {
		text-align: left;
		padding: 4px 8px 4px 0;
		border-bottom: 1px dotted var(--line);
		vertical-align: top;
	}
	.courses th {
		font-size: var(--t-micro);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--muted);
		font-weight: 600;
	}
	.form {
		display: grid;
		gap: 10px;
		margin: 6px 0 8px;
	}
	.field,
	.course {
		display: block;
		border: 0;
		padding: 0;
		margin: 0;
		min-width: 0;
	}
	.course {
		display: grid;
		gap: 8px;
		padding: 6px 0 6px 10px;
		border-left: 3px solid var(--line);
	}
	.sub {
		display: block;
		font-size: var(--t-micro);
		letter-spacing: 0.04em;
		color: var(--ink-soft);
		margin: 0 0 4px;
	}
	.ticks {
		border: 0;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 4px 14px;
	}
	.ticks legend {
		padding: 0;
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
	input,
	textarea,
	select {
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
		margin: 0 0 4px;
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
		margin: 2px 0 4px;
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
	.chip:hover:not(:disabled) {
		border-color: var(--turmeric);
	}
	.chip:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.chip.go {
		border-color: var(--turmeric-deep);
		font-weight: 600;
	}
</style>
