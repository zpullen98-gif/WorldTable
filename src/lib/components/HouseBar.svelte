<!--
  The house bar: one line under the page's h1 that says which house this
  menu belongs to, and the five doors a person has into the list of houses
  on the device: Switch, New house, Import a pack, Export, Rename.

  PRERENDERED AS THE NO-HOUSE LINE. The page is prerendered, and a prerender
  pass has no localStorage and no IndexedDB, so this component renders the
  one sentence a device with no house meets and reads the device only in
  onMount: house.api, ready, then the record. Until the api is ready every
  door is disabled rather than hidden, so the prerendered page and the
  hydrated one are the same page.

  WHAT THE LINE SAYS. "{name} · {n} dishes here · {m} wines in the Codex ·
  {k} drinks in the Ledger · next: {step}", the step being the first of the
  House's BUILD_STEPS the record has not stamped, in words a person would
  use, or "complete · menus read {date}" when all eight are. Never a
  numeral for a level, never a colour that carries a meaning alone.

  THE PACK NEVER OVERWRITES A HOUSE SILENTLY. A pack whose id is already on
  the device stops on two chips, "Add as a new house" and "Merge into
  {name}", and nothing is written until one is pressed. Every success ends
  on one sentence and two chips: "{name} added. Open it now?" Open / Not
  now. The address is fetched by this browser alone, on the press, with
  cache: 'reload', and a relative address is accepted as it is.

  NO ALLERGEN CONTENT COMES THROUGH HERE. A pack carries none (the House
  has no field for one), and the line the page prints after an import says
  so; the allergen line stays on the Table's own row and is marked at
  lineup, by a person.
-->
<script module lang="ts">
	/** The sentence a device with no house meets, prerendered and hydrated alike. */
	export const NO_HOUSE_LINE = 'No house yet. Your dishes, drinks and wines belong to a house: import a pack, or start one.';
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { house } from '$lib/stores/house.svelte';
	import type { HouseApi, ChangeWhat } from '$lib/house/house-api';
	import type { House, HouseStub } from '$lib/house/house-schema';
	import type { ReadPack } from '$lib/house/house-pack';

	/** The eight build steps in the words a person would use for "next". Levels are named, never numbered, and so are steps. */
	const STEP_WORDS: Record<string, string> = {
		card: 'the house card',
		menus: 'the menus',
		filed: 'review and file',
		formula: 'the formula',
		pairings: 'the pairings',
		wines: 'the wines',
		lexicon: 'the words',
		scenarios: 'the table'
	};

	type Panel = '' | 'switch' | 'new' | 'import' | 'rename';

	let api = $state<HouseApi | null>(null);
	let loaded = $state(false);
	let current = $state<House | null>(null);
	let list = $state<HouseStub[]>([]);
	let panel = $state<Panel>('');
	let newName = $state('');
	let renameTo = $state('');
	let address = $state('');
	let busy = $state(false);
	let error = $state('');
	/** The live region's sentence: what just happened, in one line. */
	let live = $state('');
	/** A pack read and waiting on the person's choice, because its id is already on the device. */
	let pending = $state<{ text: string; read: ReadPack & { ok: true }; intoName: string } | null>(null);
	/** The house just added, offering "Open it now?". */
	let added = $state<{ id: string; name: string } | null>(null);
	let fileEl = $state<HTMLInputElement | null>(null);

	const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

	const step = $derived.by(() => {
		if (!current || !api) return '';
		const next = api.BUILD_STEPS.find((s) => !current!.build[s]);
		if (next) return `next: ${STEP_WORDS[next] ?? next}`;
		return `complete · menus read ${current.menusReadOn || 'on no recorded date'}`;
	});

	const line = $derived(
		current
			? `${current.name} · ${count(current.dishes.length, 'dish', 'dishes')} here · ${count(current.wines.length, 'wine', 'wines')} in the Codex · ${count(current.cocktails.length, 'drink', 'drinks')} in the Ledger · ${step}`
			: NO_HOUSE_LINE
	);

	const canAct = $derived(loaded && house.ready && !house.blocked && !busy);

	function refresh() {
		if (!api) return;
		current = api.current();
		list = api.list();
	}

	onMount(() => {
		const a = house.api;
		if (!a) return;
		api = a;
		const off = a.onChange((_h: House | null, _what: ChangeWhat) => refresh());
		void a.ready().then(() => {
			refresh();
			loaded = true;
		});
		return off;
	});

	function open(p: Panel) {
		error = '';
		added = null;
		pending = null;
		panel = panel === p ? '' : p;
		if (panel === 'rename' && current) renameTo = current.name;
	}

	/** Her press: the shipped pack the boot held (her own dishes, no house) is loaded and opened. */
	async function loadHeld() {
		busy = true;
		error = '';
		try {
			const ok = await house.loadHeldPack();
			if (!ok) error = house.houseRefusal || 'The pack could not be loaded on this device.';
			else {
				refresh();
				live = `${current?.name ?? 'The house'} is open.`;
			}
		} finally {
			busy = false;
		}
	}

	async function onSwitch(ev: Event) {
		const id = (ev.currentTarget as HTMLSelectElement).value;
		if (!api || !id || id === api.currentId()) return;
		busy = true;
		error = '';
		try {
			const ok = await house.switchHouse(id);
			if (!ok) error = 'That house could not be opened on this device.';
			else {
				refresh();
				live = `${current?.name ?? 'The house'} is open.`;
				panel = '';
			}
		} finally {
			busy = false;
		}
	}

	async function mint() {
		if (!api) return;
		const name = newName.trim();
		if (!name) return;
		busy = true;
		error = '';
		try {
			const made = await api.mintHouse(name, 'hand');
			if (!made) {
				error = 'The house could not be written on this device. Export a pack to make room.';
				return;
			}
			newName = '';
			refresh();
			if (api.currentId() === made.id) {
				/* The first house on the device: the dishes already here join it. */
				await house.syncHouse();
				refresh();
				live = `${made.name} is your house now.`;
				panel = '';
			} else {
				added = { id: made.id, name: made.name };
				live = `${made.name} added.`;
			}
		} finally {
			busy = false;
		}
	}

	async function rename() {
		if (!api || !current) return;
		const name = renameTo.trim();
		if (!name || name === current.name) {
			panel = '';
			return;
		}
		busy = true;
		error = '';
		try {
			const ok = await api.rename(name);
			if (!ok) error = 'The name could not be written on this device.';
			else {
				refresh();
				live = `Renamed to ${name}.`;
				panel = '';
			}
		} finally {
			busy = false;
		}
	}

	function exportPack() {
		if (!api) return;
		const built = api.buildPack('table');
		if (!built) return;
		const blob = new Blob([built.text], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = built.filename;
		a.click();
		URL.revokeObjectURL(url);
		live = `${built.pack.house.name} exported as ${built.filename}.`;
	}

	/** A pack's text, from a file or an address: read, then imported or held for the choice. */
	async function takePack(text: string) {
		if (!api) return;
		error = '';
		added = null;
		pending = null;
		const read = api.readPack(text);
		if (!read.ok) {
			error = read.said;
			return;
		}
		const twin = api.list().find((s) => s.id === read.house.id);
		if (twin) {
			pending = { text, read, intoName: twin.name };
			live = `${read.house.name} is already on this device. Add it as a new house, or merge it into ${twin.name}.`;
			return;
		}
		await finishImport(text, read, { mode: 'new' });
	}

	/** The pack itself goes through the api's door, which reads it again: the import never takes a house a screen has held. */
	async function finishImport(text: string, read: ReadPack & { ok: true }, choice: { mode: 'new' | 'merge'; into?: string }) {
		if (!api) return;
		busy = true;
		try {
			const result = await api.importPack(text, choice);
			pending = null;
			if (!result.ok) {
				error = result.said;
				return;
			}
			refresh();
			if (read.house.dishes.length) house.notePackImport(read.house.dishes.length);
			if (result.current) {
				/* The pack became the current house: its rows reach the menu now. */
				await house.syncHouse();
				refresh();
				live = `${result.said} It is open.`;
				panel = '';
			} else if (choice.mode === 'merge') {
				live = result.said;
				added = { id: result.added, name: read.house.name };
			} else {
				added = { id: result.added, name: read.house.name };
				live = `${read.house.name} added. Open it now?`;
			}
			address = '';
			if (fileEl) fileEl.value = '';
		} finally {
			busy = false;
		}
	}

	async function openAdded() {
		if (!added) return;
		const id = added.id;
		busy = true;
		try {
			const ok = await house.switchHouse(id);
			if (!ok) error = 'That house could not be opened on this device.';
			else {
				refresh();
				added = null;
				panel = '';
				live = `${current?.name ?? 'The house'} is open.`;
			}
		} finally {
			busy = false;
		}
	}

	async function onFile(ev: Event) {
		const input = ev.currentTarget as HTMLInputElement;
		const f = input.files?.[0];
		if (!f) return;
		let text = '';
		try {
			text = await f.text();
		} catch {
			error = 'That file could not be read.';
			return;
		}
		await takePack(text);
	}

	/** The address fetched by this browser alone, on the press, never cached and never sent anywhere else. */
	async function fetchAddress() {
		const url = address.trim();
		if (!url) return;
		busy = true;
		error = '';
		try {
			let res: Response;
			try {
				res = await fetch(url, { cache: 'reload' });
			} catch {
				error = 'That address could not be fetched from here.';
				return;
			}
			if (!res.ok) {
				error = `That address answered ${res.status}, not a pack.`;
				return;
			}
			await takePack(await res.text());
		} finally {
			busy = false;
		}
	}
</script>

<section class="housebar" aria-labelledby="house-line" data-print="hide">
	<h2 id="house-line" class="houseline">{line}</h2>
	{#if house.packLine}<p class="autoline" role="status">{house.packLine}</p>{/if}
	{#if house.packHeld}<p><button class="chip go" onclick={loadHeld} disabled={busy}>Load the pack</button></p>{/if}
	<p class="live" role="status" aria-live="polite">{live}</p>

	<div class="chips" role="group" aria-label="The house">
		<button class="chip" onclick={() => open('switch')} aria-expanded={panel === 'switch'} disabled={!canAct || list.length < 2}>Switch</button>
		<button class="chip" onclick={() => open('new')} aria-expanded={panel === 'new'} disabled={!canAct}>New house</button>
		<button class="chip" onclick={() => open('import')} aria-expanded={panel === 'import'} disabled={!canAct}>Import a pack</button>
		<button class="chip" onclick={exportPack} disabled={!canAct || !current}>Export</button>
		<button class="chip" onclick={() => open('rename')} aria-expanded={panel === 'rename'} disabled={!canAct || !current}>Rename</button>
	</div>

	{#if panel === 'switch'}
		<div class="panel">
			<label class="fieldlabel" for="house-switch">Open another house on this device</label>
			<select id="house-switch" class="chip" value={api?.currentId() ?? ''} onchange={onSwitch} disabled={busy}>
				{#each list as s (s.id)}
					<option value={s.id}>{s.name}</option>
				{/each}
			</select>
		</div>
	{:else if panel === 'new'}
		<div class="panel">
			<label class="fieldlabel" for="house-new">Name the new house</label>
			<div class="row">
				<input id="house-new" bind:value={newName} placeholder="My house" disabled={busy} />
				<button class="chip go" onclick={mint} disabled={!newName.trim() || busy}>Start it</button>
			</div>
		</div>
	{:else if panel === 'import'}
		<div class="panel">
			<p class="note">A pack is the file another device exported. It carries the house and nothing about allergens: those are marked here, at lineup.</p>
			<div class="row">
				<label class="filebtn chip">
					<input bind:this={fileEl} type="file" accept=".json,application/json" onchange={onFile} disabled={busy} />
					Choose a pack file
				</label>
			</div>
			<label class="fieldlabel" for="house-address">Or fetch a pack from an address</label>
			<div class="row">
				<input id="house-address" bind:value={address} placeholder="packs/house.oothouse.json" inputmode="url" disabled={busy} />
				<button class="chip go" onclick={fetchAddress} disabled={!address.trim() || busy}>Fetch</button>
			</div>
			{#if pending}
				<p class="note">{pending.read.house.name} is already on this device.</p>
				<div class="chips" role="group" aria-label="What to do with the pack">
					<button class="chip go" onclick={() => pending && finishImport(pending.text, pending.read, { mode: 'new' })} disabled={busy}>Add as a new house</button>
					<button class="chip" onclick={() => pending && finishImport(pending.text, pending.read, { mode: 'merge', into: pending.read.house.id })} disabled={busy}>Merge into {pending.intoName}</button>
				</div>
			{/if}
		</div>
	{:else if panel === 'rename'}
		<div class="panel">
			<label class="fieldlabel" for="house-rename">Rename this house</label>
			<div class="row">
				<input id="house-rename" bind:value={renameTo} disabled={busy} />
				<button class="chip go" onclick={rename} disabled={!renameTo.trim() || busy}>Save the name</button>
			</div>
		</div>
	{/if}

	{#if added}
		<div class="panel">
			<p class="said">{added.name} added. Open it now?</p>
			<div class="chips" role="group" aria-label="Open {added.name}">
				<button class="chip go" onclick={openAdded} disabled={busy}>Open</button>
				<button class="chip" onclick={() => (added = null)} disabled={busy}>Not now</button>
			</div>
		</div>
	{/if}

	{#if error}<p class="warn" role="alert">{error}</p>{/if}
</section>

<style>
	.housebar {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin: 0 0 20px;
		padding: 12px 0 16px;
		border-bottom: 1px solid var(--line);
	}
	.autoline { font-size: var(--t-small); color: var(--ink-soft); margin: 2px 0 6px; }
	.houseline {
		font-size: var(--t-body, 16px);
		font-weight: 500;
		margin: 0;
		line-height: 1.5;
	}
	.chips,
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 10px;
		align-items: center;
	}
	.panel {
		display: flex;
		flex-direction: column;
		gap: 8px;
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
		/* 44px: tapped with a thumb beside a hot pass, like every desk control. */
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
	/* A form control wearing the chip's coat: its edge is the field edge (3:1). */
	select.chip {
		appearance: none;
		max-width: 280px;
		border-color: var(--field-line, var(--line));
	}
	input:not([type='file']) {
		min-height: 44px;
		padding: 8px 12px;
		border: 1px solid var(--field-line, var(--line));
		border-radius: var(--radius);
		background: var(--card);
		color: var(--ink);
		font: inherit;
		flex: 1 1 220px;
		max-width: 420px;
	}
	.filebtn {
		display: inline-flex;
		align-items: center;
		width: fit-content;
		position: relative;
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
	.fieldlabel {
		font-size: var(--t-micro);
		color: var(--ink-soft);
	}
	.note,
	.said {
		margin: 0;
		font-size: 14px;
	}
	.note {
		color: var(--ink-soft);
		font-style: italic;
	}
	.warn {
		margin: 0;
		padding: 8px 12px;
		border-left: 2px solid var(--chili);
		font-size: 14px;
	}
	.live {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
</style>
