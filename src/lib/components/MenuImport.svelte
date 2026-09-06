<!--
  Bringing a menu in instead of typing it out.

  A venue that opens this app already has a menu: it is printed, it is on a
  website, and it is a photograph on somebody's phone. Before this panel the
  only way to get it into the app was the hand form below, one dish at a time,
  which is why so many kitchens got four dishes in and stopped. Three ways in,
  then, and one review screen they all land on.

  Paste comes first on purpose. It is the only one of the three that works on
  every device, with no connection and no download, so it is written as the
  normal route rather than as the fallback the other two fall back to.

  THE ALLERGEN RULE, and it is the reason this panel is shaped the way it is.
  Nothing in an import knows what is in a pan. A photograph reports what the
  menu printed; a web page reports what the venue typed; neither has ever seen
  the kitchen. MenuDish carries `allergens` AND `allergensCheckedAt` precisely
  so that "this dish holds none" and "nobody has looked" cannot be confused,
  and an importer that filled either field would be answering a question it was
  never asked. So every dish this panel adds arrives with `allergens: []` and
  `allergensCheckedAt` undefined, which the menu list below reads as "Allergens
  not marked: ask the kitchen", and the panel says so in words before anybody
  picks a file. There is deliberately no allergen control here: a row of
  checkboxes on an import screen is one distracted tap away from becoming an
  affirmation nobody made.

  The parser's `tags` are not allergen information either. They are a record of
  the marks the menu printed, they are shown read-only so a cook can retype
  what matters, and they are never mapped into `allergens`.
-->
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { house } from '$lib/stores/house.svelte';
	import type { MenuDish } from '$lib/persistence/state';
	import { parseMenuText } from '$lib/menu-parse';
	import type { ParsedDish } from '$lib/menu-parse';
	import { imageToText, ocrPlan } from '$lib/menu-ocr';
	import { linkToText } from '$lib/menu-link';

	/** One draft row on the review table. Everything here is editable in place. */
	interface Row {
		/** Stable across edits and removals, so a keyed each never re-uses an input. */
		key: string;
		section: string;
		name: string;
		description: string;
		price: string;
		confidence: 'high' | 'low';
		/** The source line the row came from, shown beside a row worth checking. */
		raw: string;
		/** Dietary marks the menu printed. Shown, never saved, never an allergen. */
		marks: string[];
		/** Ticked for the bulk section control above the table. */
		chosen: boolean;
		/** What to do when this name is already on the menu. Skipping is the default. */
		dup: 'skip' | 'add';
	}

	/**
	 * Open when there is nothing on the menu, out of the way once there is.
	 *
	 * `null` means nobody has said either way, so the panel follows the menu.
	 * The moment the cook uses the toggle their choice sticks, because a panel
	 * that reopens itself after being closed is a panel that fights the person
	 * trying to edit the dish underneath it.
	 */
	let opened = $state<boolean | null>(null);
	const open = $derived(opened ?? house.dishes.length === 0);

	let text = $state('');
	let rows = $state<Row[]>([]);
	let skipped = $state<string[]>([]);
	let truncated = $state(false);
	/** Distinguishes "not parsed yet" from "parsed, and it found nothing". */
	let reviewed = $state(false);
	let showSkipped = $state(false);

	/* ---- the photo ------------------------------------------------------- */

	/**
	 * Whether this device can read a photograph, asked once after mount and
	 * NEVER during prerender: there is no `window` in the SSR pass, so ocrPlan()
	 * answers "no reader here" and this page is prerendered. Baked into the
	 * HTML, that answer would be shown to every phone that can in fact read one.
	 * Null means not asked yet, and the picker waits rather than guessing.
	 */
	let plan = $state<{ native: boolean } | null>(null);
	let reading = $state(false);
	let pct = $state(0);
	let progressNote = $state('');
	let photoError = $state('');

	/* ---- the link -------------------------------------------------------- */

	let url = $state('');
	let fetching = $state(false);
	/** The refusal and the address to open by hand, which belong on screen together. */
	let linkFail = $state<{ reason: string; openUrl: string } | null>(null);

	/* ---- saving ---------------------------------------------------------- */

	let bulkSection = $state('');
	let saveError = $state('');
	let savedCount = $state(0);

	let reviewHead: HTMLHeadingElement | undefined = $state();
	let doneEl: HTMLParagraphElement | undefined = $state();
	let pasteEl: HTMLTextAreaElement | undefined = $state();

	onMount(() => {
		plan = ocrPlan();
	});

	/**
	 * menu-parse appends its truncation warning to `skipped` as a finished
	 * sentence rather than as a line off the menu, so listing it among "lines
	 * not read as dishes" would show the panel its own message and invite
	 * somebody to go looking for it on the page. Matched on its opening words;
	 * if that wording ever moves, the sentence lands back in the list, which is
	 * untidy rather than wrong.
	 */
	const TRUNCATION_PREFIX = 'Only the first 200,000 characters';

	let keySeed = 0;
	const toRow = (d: ParsedDish): Row => ({
		key: `r${keySeed++}`,
		section: d.section,
		name: d.name,
		description: d.description,
		price: d.price,
		confidence: d.confidence,
		raw: d.raw,
		marks: d.tags,
		chosen: false,
		dup: 'skip'
	});

	async function parse() {
		const result = parseMenuText(text);
		rows = result.dishes.map(toRow);
		const notice = result.skipped.at(-1)?.startsWith(TRUNCATION_PREFIX) ?? false;
		truncated = notice;
		skipped = notice ? result.skipped.slice(0, -1) : result.skipped;
		showSkipped = false;
		reviewed = true;
		savedCount = 0;
		saveError = '';
		// The table is what the cook has to work through next, so the heading
		// above it is where the keyboard should land, not the button they just
		// pressed halfway up the panel.
		await tick();
		reviewHead?.focus();
	}

	/* ---- reading a photograph -------------------------------------------- */

	async function onPhoto(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		photoError = '';
		reading = true;
		pct = 0;
		progressNote = 'Opening the photo';
		try {
			const result = await imageToText(file, (p, note) => {
				pct = p;
				progressNote = note;
			});
			// Into the same box as a paste, always. The cook can see exactly what
			// was read off the picture and mend a misread line before it becomes
			// a row, which is the whole reason the reader hands back text rather
			// than dishes.
			text = result.text;
			await parse();
		} catch (err) {
			// Verbatim. Every throw out of menu-ocr is already a sentence in this
			// app's voice that says what to do next, and wrapping it in an
			// apology would bury the instruction.
			photoError = err instanceof Error ? err.message : 'That photo could not be read.';
		} finally {
			reading = false;
			// Cleared so picking the SAME file again still fires a change event,
			// which is what somebody does after retaking a blurry shot.
			input.value = '';
		}
	}

	/* ---- reading a link --------------------------------------------------- */

	async function fetchLink() {
		if (!url.trim()) return;
		fetching = true;
		linkFail = null;
		try {
			const result = await linkToText(url);
			if (result.ok) {
				text = result.text;
				await parse();
				return;
			}
			// Never dressed up as anything else: most restaurant sites refuse a
			// cross-origin read, and telling the cook it half-worked would cost
			// them the minute it takes to copy the page by hand instead.
			linkFail = { reason: result.reason, openUrl: result.openUrl };
		} finally {
			fetching = false;
		}
	}

	/* ---- the review table -------------------------------------------------- */

	/**
	 * Names already on the menu, folded for comparison only. Never used to
	 * rewrite a row: the cook's spelling is the one that goes on the plate.
	 */
	const onMenu = $derived(
		new Set(house.dishes.map((d) => d.name.trim().toLowerCase()).filter(Boolean))
	);
	const isDuplicate = (r: Row) => {
		const n = r.name.trim().toLowerCase();
		return n !== '' && onMenu.has(n);
	};

	const named = $derived(rows.filter((r) => r.name.trim() !== ''));
	const duplicates = $derived(named.filter(isDuplicate));
	/** Rows that will actually be added: named, and not a duplicate being skipped. */
	const accepted = $derived(named.filter((r) => !(isDuplicate(r) && r.dup === 'skip')));
	const chosenCount = $derived(rows.filter((r) => r.chosen).length);
	const allChosen = $derived(rows.length > 0 && chosenCount === rows.length);

	/** Sections to offer: what the menu already uses, plus what this import read. */
	const sectionChoices = $derived([
		...new Set(
			[...house.dishes.map((d) => d.section), ...rows.map((r) => r.section)]
				.map((s) => s.trim())
				.filter(Boolean)
		)
	]);

	function chooseAll(on: boolean) {
		for (const r of rows) r.chosen = on;
	}

	/**
	 * A photograph loses the headings far more often than it loses the dishes:
	 * the section is set in a lighter face across the page and the reader drops
	 * it or folds it into the dish below. Retyping "Starters" onto nine rows one
	 * at a time is the point somebody gives up, so it is one control here.
	 */
	function applySection() {
		const s = bulkSection.trim();
		for (const r of rows) if (r.chosen) r.section = s;
	}

	function removeRow(key: string) {
		rows = rows.filter((r) => r.key !== key);
	}

	/**
	 * The same mint the hand form uses: 'd-' and eight base36 characters.
	 *
	 * Copied rather than shared because a component cannot reach into the page's
	 * scope, and given the `taken` guard the hand form does not need: this mints
	 * a whole menu in one pass, so two rows colliding is a thing that can happen
	 * here and cannot happen when a person saves one dish at a time. A collision
	 * would put two dishes under one id, and the costing sheet keys on that id.
	 */
	function mintDishId(taken: Set<string>) {
		let s = '';
		do {
			s = 'd-';
			while (s.length < 10) s += Math.floor(Math.random() * 36).toString(36);
		} while (taken.has(s));
		taken.add(s);
		return s;
	}

	async function save() {
		// The house-side guard the session import already carries. While the
		// record is blocked, addDish mutates memory and never reaches disk, so
		// without this the panel would count the dishes as landed and they would
		// be gone on the next reload.
		if (house.blocked) {
			saveError =
				'This tablet is running an older version than the one that saved your menu. Adding dishes is paused until it updates.';
			return;
		}
		const going = accepted;
		if (!going.length) return;
		const taken = new Set(house.dishes.map((d) => d.id));
		const stamp = Date.now();
		for (const r of going) {
			const dish: MenuDish = {
				id: mintDishId(taken),
				name: r.name.trim(),
				// Left blank when the menu never said, rather than filled with an
				// invented category: the list below already groups a blank section
				// under "The Menu", so nothing is lost and nothing is claimed.
				section: r.section.trim(),
				description: r.description.trim(),
				ingredients: [],
				// THE TWO FIELDS THIS FEATURE MUST NOT WRITE. An empty list with no
				// `allergensCheckedAt` is what makes the menu read "Allergens not
				// marked: ask the kitchen". Stamping the date here, on a dish read
				// off a photograph, would turn that into "checked, and it holds
				// none" for a dish nobody has looked at.
				allergens: [],
				price: r.price.trim(),
				ts: stamp
			};
			house.addDish(dish);
		}
		savedCount = going.length;
		// Everything from the run just saved, the failures included: a photo error
		// or a refused address left standing would be waiting on screen the next
		// time somebody opens the panel, describing a menu that is already on.
		rows = [];
		skipped = [];
		text = '';
		url = '';
		photoError = '';
		linkFail = null;
		reviewed = false;
		truncated = false;
		opened = false;
		await tick();
		doneEl?.focus();
	}

	function startOver() {
		rows = [];
		skipped = [];
		reviewed = false;
		truncated = false;
		saveError = '';
		photoError = '';
		linkFail = null;
		pasteEl?.focus();
	}
</script>

<section class="import" data-print="hide">
	{#if !open}
		<div class="collapsed">
			<button
				class="chip big"
				onclick={() => {
					opened = true;
					savedCount = 0;
				}}>Bring a menu in ▸</button
			>
			<span class="collapsedhint">Paste it, photograph it, or give the app the address.</span>
		</div>
		{#if savedCount}
			<!-- tabindex -1 so the focus that moved here after Save has something to
			     land on: the panel it came from has just closed. -->
			<p class="done" bind:this={doneEl} tabindex="-1" role="status">
				<b
					>{savedCount}
					{savedCount === 1 ? 'dish is' : 'dishes are'} on the menu.</b
				>
				Allergens are not filled in on any of them. Open each dish, check it against its build, and
				tick the allergen box before it goes to a table.
			</p>
		{/if}
	{:else}
		<div class="head">
			<h3 class="sec">Bring your menu in</h3>
			<!-- Closable even on an empty menu. It opens itself there because that is
			     the visit it exists for, but somebody who would rather type the first
			     dish in by hand should not have to scroll past a panel they have
			     already decided against. -->
			<button class="chip" onclick={() => (opened = false)}>Close</button>
		</div>
		<p class="hint">
			Paste your menu, photograph it, or give the app the address. Every dish is shown for you to
			correct before anything is saved.
		</p>
		<!--
			Said once, at the top, before a file is picked. This is the sentence
			that keeps the feature honest: see the allergen rule in the file header.
		-->
		<p class="allergenote">
			<b>Importing fills in no allergen information.</b> Every dish arrives unchecked and has to be checked
			against its build, dish by dish, before it goes to a table.
		</p>

		{#if house.blocked}
			<p class="warn" role="alert">
				This tablet is running an older version than the one that saved your menu. Dishes cannot be
				added until it updates.
			</p>
		{/if}

		<div class="ways">
			<div class="way paste">
				<label class="fieldlabel" for="import-paste">Paste your menu</label>
				<p class="waynote">
					Works on any device, with no connection. Copy the menu from wherever it is and drop it in.
				</p>
				<textarea
					id="import-paste"
					rows="6"
					bind:this={pasteEl}
					bind:value={text}
					placeholder={'STARTERS\nCrispy squid, lemon aioli 9.50\nSoup of the day 6'}
				></textarea>
				<button class="chip go" onclick={parse} disabled={!text.trim()}>Read the menu</button>
			</div>

			<div class="way">
				<span class="fieldlabel">Or photograph it</span>
				<!-- Said BEFORE the picker, out of ocrPlan(). A browser with no reader
				     is told so here rather than after somebody has taken the picture,
				     and the picker is withheld: a control that can only fail is worse
				     than no control. Nothing is fetched on this path any more, so there
				     is no longer anyone to disclose. -->
				{#if plan === null}
					<p class="waynote">Point the camera at the printed menu, or pick a photo you already took.</p>
				{:else if plan.native}
					<p class="waynote">
						This device reads photos itself. The picture never leaves it, and nothing is
						downloaded to read it.
					</p>
				{:else}
					<p class="waynote">
						This browser cannot read photographs, and this app will not fetch a reader to do
						it. On a phone, hold your finger on the text in the picture, copy it, and paste it
						into the box above. Or give the address of the menu below.
					</p>
				{/if}
				<!--
					No `capture` attribute, deliberately. It forces the camera open and
					hides the camera roll, and the photo of the menu is very often one
					somebody took last week. `accept` alone still offers the camera as a
					choice on both phone platforms.
				-->
				{#if plan === null || plan.native}
					<label class="filebtn chip">
						<input
							type="file"
							accept="image/*"
							onchange={onPhoto}
							disabled={reading}
						/>
						{reading ? 'Reading…' : 'Choose a photo'}
					</label>
				{/if}
				{#if reading}
					<div class="progline">
						<!-- The bar is the picture; the sentence beside it is what gets
						     announced. Marking the bar up as well would read the same
						     progress out twice, once per percent. -->
						<progress max="100" value={pct} aria-hidden="true"></progress>
						<span class="note" role="status">{progressNote} · {pct}%</span>
					</div>
				{/if}
				{#if photoError}
					<p class="warn" role="alert">{photoError}</p>
				{/if}
			</div>

			<div class="way">
				<label class="fieldlabel" for="import-url">Or read it off a web page</label>
				<p class="waynote">
					Most restaurant sites will not let another app read them. If this one will not, the address
					opens in a new tab so you can copy the menu across.
				</p>
				<div class="urlrow">
					<input
						id="import-url"
						type="url"
						inputmode="url"
						bind:value={url}
						placeholder="joesdiner.com/menu"
					/>
					<button class="chip go" onclick={fetchLink} disabled={!url.trim() || fetching}>
						{fetching ? 'Reading…' : 'Read the page'}
					</button>
				</div>
				{#if linkFail}
					<div class="warn" role="alert">
						<p>{linkFail.reason}</p>
						{#if linkFail.openUrl}
							<!-- Hidden when there is nothing safe to open: menu-link returns an
							     empty address for one it refused to fetch at all, and turning
							     that into a link is exactly what the refusal was for. -->
							<p>
								<a class="chip" href={linkFail.openUrl} target="_blank" rel="noopener noreferrer"
									>Open the page ▸</a
								>
							</p>
							<p class="waynote">Copy the menu from that page and paste it into the box above.</p>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		{#if reviewed}
			<h3 class="sec" bind:this={reviewHead} tabindex="-1">Check it before it goes on</h3>
			<p class="counts">
				<b>{rows.length} {rows.length === 1 ? 'dish' : 'dishes'} read</b>
				{#if skipped.length}
					· {skipped.length}
					{skipped.length === 1 ? 'line' : 'lines'} not read as a dish
				{/if}
				{#if duplicates.length}
					· {duplicates.length} already on the menu
				{/if}
			</p>
			{#if truncated}
				<p class="warn" role="alert">
					Only the first 200,000 characters were read. Split the menu up and bring the rest in
					separately.
				</p>
			{/if}

			{#if skipped.length}
				<div class="skipbox">
					<button class="chip" onclick={() => (showSkipped = !showSkipped)} aria-expanded={showSkipped}>
						{showSkipped ? 'Hide' : 'Show'} the {skipped.length} skipped
						{skipped.length === 1 ? 'line' : 'lines'}
					</button>
					{#if showSkipped}
						<!-- Worth one click to see: a dish the reader dropped is in here,
						     and it is the only place it can be found. -->
						<ul class="skiplist">
							{#each skipped as line, i (i)}
								<li>{line}</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}

			{#if rows.length}
				<div class="bulk">
					<label class="fieldlabel" for="import-bulk">Set the section on the ticked rows</label>
					<div class="urlrow">
						<input
							id="import-bulk"
							list="import-sections"
							bind:value={bulkSection}
							placeholder="Starters, Mains…"
						/>
						<button class="chip" onclick={applySection} disabled={chosenCount === 0}>
							Apply to {chosenCount}
							{chosenCount === 1 ? 'row' : 'rows'}
						</button>
					</div>
					<datalist id="import-sections">
						{#each sectionChoices as s (s)}<option value={s}></option>{/each}
					</datalist>
				</div>

				<!-- Its own scroller: on a phone in a kitchen this table is wider than
				     the glass, and a page that slides sideways loses the buttons. -->
				<div class="tablewrap">
					<table class="review">
						<caption class="sr">Dishes read from your menu, ready to correct</caption>
						<thead>
							<tr>
								<th scope="col" class="tick">
									<input
										type="checkbox"
										checked={allChosen}
										onchange={(e) => chooseAll(e.currentTarget.checked)}
										aria-label="Tick every row"
									/>
								</th>
								<th scope="col">Section</th>
								<th scope="col">Dish</th>
								<th scope="col">Description</th>
								<th scope="col">Price</th>
								<th scope="col">Row</th>
							</tr>
						</thead>
						<tbody>
							{#each rows as row, i (row.key)}
								{@const dupe = isDuplicate(row)}
								<tr class:low={row.confidence === 'low'} class:dropped={dupe && row.dup === 'skip'}>
									<td class="tick">
										<input type="checkbox" bind:checked={row.chosen} aria-label="Tick row {i + 1}" />
									</td>
									<td>
										<input
											bind:value={row.section}
											list="import-sections"
											aria-label="Section, row {i + 1}"
										/>
									</td>
									<td>
										<input bind:value={row.name} aria-label="Dish name, row {i + 1}" />
									</td>
									<td>
										<input bind:value={row.description} aria-label="Description, row {i + 1}" />
									</td>
									<td class="price">
										<input bind:value={row.price} aria-label="Price, row {i + 1}" />
									</td>
									<td class="notes">
										{#if row.confidence === 'low'}
											<!-- A word and a rule, never a colour on its own: this gets
											     read at an angle on a bench under a hot lamp. -->
											<span class="flag">Check this row</span>
											<span class="raw">Read as: {row.raw}</span>
										{/if}
										{#if dupe}
											<span class="flag">Already on the menu</span>
											<div class="dupchoice" role="group" aria-label="Duplicate, row {i + 1}">
												<button
													class="chip small"
													class:on={row.dup === 'skip'}
													aria-pressed={row.dup === 'skip'}
													onclick={() => (row.dup = 'skip')}>Skip it</button
												>
												<button
													class="chip small"
													class:on={row.dup === 'add'}
													aria-pressed={row.dup === 'add'}
													onclick={() => (row.dup = 'add')}>Add it anyway</button
												>
											</div>
										{/if}
										{#if row.marks.length}
											<span class="raw">Marks printed: {row.marks.join(' · ')}</span>
										{/if}
										<button class="chip small" onclick={() => removeRow(row.key)}
											>Remove row</button
										>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				{#if rows.some((r) => r.marks.length)}
					<p class="hint">
						Marks printed on the menu are shown so you can retype them where they belong. They are
						not saved and they are not an allergen check.
					</p>
				{/if}

				{#if saveError}<p class="warn" role="alert">{saveError}</p>{/if}
				<div class="saverow">
					<button class="chip go" onclick={save} disabled={!accepted.length || house.blocked}>
						Add {accepted.length}
						{accepted.length === 1 ? 'dish' : 'dishes'} to the menu
					</button>
					<button class="chip" onclick={startOver}>Start again</button>
					{#if named.length !== accepted.length}
						<span class="hint">
							{named.length - accepted.length} skipped as already on the menu.
						</span>
					{/if}
				</div>
			{:else}
				<p class="warn" role="alert">
					No dishes were read out of that text. Check the box above has the menu in it, or type the
					dishes in below.
				</p>
			{/if}
		{/if}
	{/if}
</section>

<style>
	.import {
		border: 1px solid var(--line);
		border-left: 3px solid var(--turmeric-deep);
		border-radius: var(--radius);
		padding: 14px 16px;
		margin: 12px 0 20px;
		background: var(--paper-raised);
	}
	.collapsed {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: center;
	}
	.collapsedhint,
	.waynote,
	.hint {
		font-size: var(--t-micro);
		color: var(--ink-soft);
		font-style: italic;
		margin: 0;
	}
	.hint {
		margin: 6px 0 0;
		max-width: var(--measure);
	}
	.head {
		display: flex;
		gap: 10px;
		align-items: baseline;
		justify-content: space-between;
	}
	.sec {
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
		border-bottom: 1px solid var(--line);
		padding-bottom: 5px;
		margin: 0 0 8px;
		font-weight: 500;
		flex: 1;
	}
	.sec:focus-visible {
		outline: 2px solid var(--turmeric-deep);
		outline-offset: 3px;
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
		/* 44px, because this is tapped with a thumb beside a hot pass. */
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
	.chip.big {
		font-size: 15px;
		padding: 10px 18px;
	}
	.chip.small {
		padding: 4px 10px;
		font-size: var(--t-micro);
		min-height: 32px;
	}
	.chip.on {
		border-color: var(--turmeric-deep);
		color: var(--turmeric-deep);
		font-weight: 700;
	}
	a.chip {
		text-decoration: none;
		display: inline-flex;
		align-items: center;
	}
	/*
	 * The file input is hidden inside its own label, so the label IS the button
	 * and clicking it opens the picker. Kept in the tab order and reachable by
	 * keyboard: display:none on the input would take the control out entirely.
	 */
	.filebtn {
		display: inline-flex;
		align-items: center;
		width: fit-content;
	}
	.filebtn input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		pointer-events: none;
	}
	.filebtn:focus-within {
		border-color: var(--turmeric-deep);
		outline: 2px solid var(--turmeric-deep);
		outline-offset: 2px;
	}
	.allergenote {
		margin: 8px 0 12px;
		padding: 10px 12px;
		border: 1px solid var(--chili);
		border-left-width: 3px;
		border-radius: var(--radius);
		font-size: var(--t-small);
		line-height: 1.55;
		max-width: var(--measure);
	}
	.warn {
		margin: 8px 0 0;
		padding: 8px 12px;
		border-left: 2px solid var(--chili);
		background: var(--card);
		font-size: var(--t-small);
		line-height: 1.5;
		max-width: var(--measure);
	}
	.warn p {
		margin: 0 0 6px;
	}
	.done {
		margin: 10px 0 0;
		padding: 10px 12px;
		border-left: 3px solid var(--turmeric-deep);
		background: var(--card);
		font-size: var(--t-small);
		line-height: 1.55;
		max-width: var(--measure);
	}
	.done:focus-visible {
		outline: 2px solid var(--turmeric-deep);
		outline-offset: 2px;
	}
	.ways {
		display: grid;
		gap: 16px;
	}
	.fieldlabel {
		display: block;
		font-weight: 600;
		font-size: 14.5px;
		margin-bottom: 2px;
	}
	textarea,
	input[type='url'],
	.bulk input,
	.review input {
		border: 1px solid var(--line);
		background: var(--card);
		border-radius: var(--radius);
		padding: 8px 12px;
		font-size: 14.5px;
		font-family: inherit;
		color: var(--ink);
	}
	textarea {
		display: block;
		width: 100%;
		margin: 6px 0 8px;
		resize: vertical;
	}
	.urlrow {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 6px;
	}
	.urlrow input {
		flex: 1;
		min-width: 180px;
		min-height: 44px;
	}
	.progline {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: center;
		margin-top: 8px;
	}
	.progline progress {
		width: 160px;
	}
	.progline .note {
		font-size: var(--t-small);
		color: var(--ink-soft);
		font-variant-numeric: tabular-nums;
	}
	.counts {
		margin: 0 0 8px;
		font-size: var(--t-small);
	}
	.skipbox {
		margin-bottom: 10px;
	}
	.skiplist {
		list-style: none;
		margin: 8px 0 0;
		padding: 8px 12px;
		border-left: 2px solid var(--line);
		max-height: 220px;
		overflow-y: auto;
		font-size: var(--t-small);
		color: var(--ink-soft);
	}
	.skiplist li {
		padding: 2px 0;
	}
	.bulk {
		margin: 10px 0 12px;
	}
	.tablewrap {
		overflow-x: auto;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--card);
	}
	.review {
		border-collapse: collapse;
		width: 100%;
		min-width: 720px;
	}
	.review th {
		text-align: left;
		font-size: var(--t-micro);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
		font-weight: 500;
		padding: 8px 6px;
		border-bottom: 1px solid var(--line);
	}
	.review td {
		padding: 6px;
		border-bottom: 1px dotted var(--line);
		vertical-align: top;
	}
	.review td input {
		width: 100%;
		min-height: 44px;
	}
	.review .tick {
		width: 34px;
	}
	.review .tick input {
		width: 22px;
		height: 22px;
		min-height: 22px;
		accent-color: var(--leaf);
	}
	.review .price input {
		min-width: 74px;
	}
	.review .notes {
		min-width: 190px;
	}
	/* A rule and a word, so a row worth checking is not told apart by hue alone. */
	.review tr.low td:first-child {
		border-left: 3px solid var(--turmeric-deep);
	}
	.review tr.dropped td {
		opacity: 0.55;
	}
	.flag {
		display: block;
		font-size: var(--t-micro);
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--turmeric-deep);
		margin-bottom: 3px;
	}
	.review tr.dropped .flag {
		color: var(--chili);
	}
	.raw {
		display: block;
		font-size: var(--t-micro);
		color: var(--muted);
		margin-bottom: 4px;
		white-space: pre-wrap;
	}
	.dupchoice {
		display: flex;
		gap: 6px;
		margin-bottom: 4px;
	}
	.saverow {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: center;
		margin-top: 12px;
	}
	/* Off screen, still read aloud: the table's caption names it for a screen
	   reader without putting a second heading above a heading. */
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
