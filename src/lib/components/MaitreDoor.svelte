<!--
  A door to the Maître d': one control that says what it sends, the estimate
  beside it, and every state a person can meet at it, in her words.

  Every door in this wing is this component, because the states are the same
  at all of them and a state a door forgot is a dead door. With no key on the
  device the door is ONE chip, "bring her in", that opens her key screen; a
  family member who imported the owner's export gets that and never a
  disabled button. With a key and no network it is a sentence, because the
  client is online only and is not precached: pressing anything would only
  fail slower. With a key and a network it is the button, the estimate line
  ("About $0.03 at Haiku 4.5. Sends the menu text to Anthropic. $0.38 of
  $5.00 used this month."), a persistent status line for her progress, and
  the outcomes: the second tap she asks for over a dollar, the cap refusal
  with a door to her settings, and every other failure as her own sentence
  from the client, never a status code.

  The client is fetched by the first door on the page that needs it (a key
  and a network, on mount: the estimate line cannot be printed without her
  price table) and shared by every other through src/lib/maitre.ts. A device
  with no key never fetches it.

  The work itself is the parent's: `run` receives the client and does the
  request, adopts the result and returns the sentence for the status line.
  This component knows nothing about menus, dishes or lines, which is how
  the same door serves the paste box, the photo picker, the address row, the
  bulk guest-lines run and the chip on each dish.

  Reduced motion: the waiting dots move by CSS only, under a
  prefers-reduced-motion: no-preference gate, and never by opacity.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import {
		hasKey,
		online,
		loadMaitre,
		openSettings,
		whenClosed,
		isMaitreError,
		maitreMessage,
		MAITRE_CHANGED,
		SETTINGS_DIALOG_ID,
		OFFLINE_HERE,
		OFFLINE_LINE,
		NOT_HERE_LINE,
		type MaitreApi,
		type MaitreEstimate,
		type MaitreEstimateInput,
		type MaitreProgress,
		type MaitreTask
	} from '$lib/maitre';

	interface DoorRun {
		onProgress: (p: MaitreProgress) => void;
		confirmed: boolean;
	}

	interface Props {
		/** The button's text. It says what the press does. */
		label: string;
		/** What the press sends, in one sentence: "Sends the menu text to Anthropic." */
		sends?: string;
		/** Words before the estimate: "31 dishes, about $0.12 at Opus 5." */
		lead?: string;
		task: MaitreTask;
		/** What the estimate is over. Null when there is nothing to send yet, and the button waits. */
		input: MaitreEstimateInput | null;
		/**
		 * The work, once she is here. Files come from the picker when `accept`
		 * is set. Returns the sentence for the status line, or nothing.
		 */
		run: (api: MaitreApi, opts: DoorRun, files?: File[]) => Promise<string | void>;
		/** A chip and a status line only: the label carries the price. */
		compact?: boolean;
		/** Nothing at all without a key or a network: another door on the panel already says so. */
		quiet?: boolean;
		/** A file picker in place of the button, for the photographs. */
		accept?: string;
		multiple?: boolean;
		/** With a key and no network. The engine row reads "Read it here for now"; other doors have no offline engine to point at. */
		offlineLine?: string;
		disabled?: boolean;
		id?: string;
	}
	let {
		label,
		sends = '',
		lead = '',
		task,
		input,
		run,
		compact = false,
		quiet = false,
		accept,
		multiple = false,
		offlineLine = OFFLINE_HERE,
		disabled = false,
		id
	}: Props = $props();

	/* Both false and true until mount: the prerender has no localStorage and no
	   navigator, so the served HTML shows the no-key chip and hydration puts
	   the truth in. A page that guessed a key at build time would print a
	   button on every device. */
	let key = $state(false);
	let net = $state(true);
	let api = $state<MaitreApi | null>(null);
	let estimate = $state<MaitreEstimate | null>(null);
	let used = $state('');
	let cap = $state('');
	let busy = $state(false);
	let progress = $state('');
	let status = $state('');
	let error = $state('');
	/** Her "tap once more" line, while a request over a dollar waits for it. */
	let secondTap = $state('');
	/** The cap refused: the settings door sits beside the line. */
	let capHit = $state(false);

	function refresh() {
		key = hasKey();
		net = online();
		if (!api) return;
		const s = api.settings.get();
		used = api.money(s.ledger.usd);
		cap = api.money(s.capUsd);
	}

	/** Bring the client in for the estimate line. Quietly: a failure here is shown at the press, not before it. */
	async function bringForEstimate() {
		if (!key || !net || api) return;
		try {
			api = await loadMaitre();
			refresh();
		} catch {
			/* the press will say why */
		}
	}

	onMount(() => {
		refresh();
		void bringForEstimate();
		const on = () => {
			net = true;
			void bringForEstimate();
		};
		const off = () => (net = false);
		const changed = () => {
			refresh();
			void bringForEstimate();
		};
		window.addEventListener('online', on);
		window.addEventListener('offline', off);
		window.addEventListener(MAITRE_CHANGED, changed);
		return () => {
			window.removeEventListener('online', on);
			window.removeEventListener('offline', off);
			window.removeEventListener(MAITRE_CHANGED, changed);
		};
	});

	// The estimate follows the input: a longer paste is a bigger number.
	$effect(() => {
		const a = api;
		const i = input;
		estimate = a && i ? a.estimate(task, i) : null;
	});

	const money = (usd: number) => (api ? api.money(usd) : '');
	const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

	/** "About $0.03 at Haiku 4.5." or, with a lead, "31 dishes, about $0.12 at Opus 5." */
	const estimateLine = $derived(
		estimate ? (lead ? `${lead}, ${lowerFirst(estimate.text)}.` : `${estimate.text}.`) : lead ? `${lead}.` : ''
	);

	/**
	 * The no-key chip: her key screen, then a fresh look at the slot.
	 *
	 * The chip is NOT disabled while her screen is up. The client captures
	 * the focused element at showModal and hands focus back to it on close;
	 * a chip disabled in the meantime drops focus to the body before that
	 * capture, so nothing comes back and the person is left at the top of
	 * the page. showModal makes the rest of the page inert anyway; this plain
	 * flag only holds the gap between the press and the script arriving, and
	 * it is plain on purpose, so it never reaches the DOM.
	 */
	let opening = false;
	async function bringHer() {
		if (opening) return;
		error = '';
		if (!online()) {
			net = false;
			error = OFFLINE_LINE;
			return;
		}
		opening = true;
		try {
			await openSettings();
			refresh();
			await bringForEstimate();
		} catch (e) {
			error = maitreMessage(e);
		} finally {
			opening = false;
		}
	}

	async function press(confirmed: boolean, files?: File[]) {
		if (busy) return;
		error = '';
		status = '';
		secondTap = '';
		capHit = false;
		if (!online()) {
			net = false;
			error = OFFLINE_LINE;
			return;
		}
		busy = true;
		progress = "Asking the Maître d'";
		try {
			const a = api ?? (await loadMaitre());
			api = a;
			refresh();
			if (!a.settings.hasKey()) {
				// The slot emptied under us (Forget on another door): her screen, no request.
				a.openSettings();
				await whenClosed(SETTINGS_DIALOG_ID);
				refresh();
				return;
			}
			const said = await run(a, { onProgress: (p) => (progress = p.text), confirmed }, files);
			status = said || '';
		} catch (e) {
			if (isMaitreError(e) && e.code === 'confirm') {
				secondTap = e.message;
			} else if (isMaitreError(e) && e.code === 'cap') {
				// The funnel opened her settings itself; when they close, the cap
				// may have moved, and the line and the estimate follow it.
				error = e.message;
				capHit = true;
				await whenClosed(SETTINGS_DIALOG_ID);
			} else if (isMaitreError(e) && e.code === 'no-key') {
				await whenClosed(SETTINGS_DIALOG_ID);
			} else {
				error = maitreMessage(e);
			}
		} finally {
			busy = false;
			progress = '';
			refresh();
		}
	}

	async function onFiles(e: Event) {
		const el = e.target as HTMLInputElement;
		const files = Array.from(el.files ?? []);
		// Cleared so the SAME picture picked again still fires a change event,
		// which is what somebody does after a refusal.
		el.value = '';
		if (files.length) await press(false, files);
	}

	async function herSettings() {
		try {
			await openSettings();
		} catch (e) {
			error = maitreMessage(e);
		}
		refresh();
	}
</script>

{#if !key}
	{#if !quiet}
		<!-- One chip, never a disabled button: the family line lives on the screen it opens. -->
		<div class="door">
			<button class="chip nokey" onclick={bringHer}>{NOT_HERE_LINE}</button>
			{#if error}<p class="warn" role="alert">{error}</p>{/if}
		</div>
	{/if}
{:else if !net}
	{#if !quiet}
		<span class="enginenote">{offlineLine}</span>
	{/if}
{:else}
	<div class="door" class:compact>
		{#if accept}
			<label class="filebtn chip go">
				<input type="file" {accept} {multiple} onchange={onFiles} disabled={busy || disabled} />
				{busy ? 'Reading…' : label}
			</label>
		{:else}
			<button class="chip go" {id} onclick={() => press(false)} disabled={busy || disabled || !input}>{label}</button>
		{/if}
		{#if !compact}
			<span class="enginenote">
				{#if estimateLine}{estimateLine}{/if}
				{#if sends}{sends}{/if}
				{#if used}{used} of {cap} used this month.{/if}
			</span>
		{/if}
		<!-- Rendered whatever the door is doing: a live region that appears with
		     its first sentence is one many screen readers never announce. -->
		<p class="note" role="status" aria-live="polite">
			{#if busy}{progress}<span class="dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>{:else}{status}{/if}
		</p>
		{#if secondTap}
			<div class="warn">
				<p>{secondTap}</p>
				<button class="chip go" onclick={() => press(true)} disabled={busy}>Once more: send it</button>
			</div>
		{/if}
		{#if error}
			<div class="warn" role="alert">
				<p>{error}</p>
				{#if capHit}
					<button class="chip" onclick={herSettings}>Her settings</button>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.door {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 12px;
		align-items: center;
	}
	.door.compact {
		display: inline-flex;
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
	/* The no-key chip reads as the line it replaces: a word, not a dead door. */
	.chip.nokey {
		font-style: italic;
		font-weight: 400;
	}
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
	.enginenote,
	.note {
		font-size: var(--t-micro);
		color: var(--ink-soft);
		font-style: italic;
		margin: 0;
	}
	.note {
		flex-basis: 100%;
	}
	/* Idle, the region is empty and taken out of the flex flow (an empty line
	   in flow would still open the row gap), but never display:none: that
	   takes a live region out of the accessibility tree, and one that comes
	   back with its first sentence is one many screen readers never announce. */
	.note:empty {
		position: absolute;
	}
	.compact .note {
		flex-basis: auto;
	}
	.warn {
		flex-basis: 100%;
		margin: 0;
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
	/* The dots move for a person who has not asked for stillness, and by
	   transform, never opacity: a fading dot is text passing through every
	   contrast ratio on its way. */
	.dots span {
		display: inline-block;
	}
	@media (prefers-reduced-motion: no-preference) {
		.dots span {
			animation: doorDot 1.2s ease-in-out infinite;
		}
		.dots span:nth-child(2) {
			animation-delay: 0.2s;
		}
		.dots span:nth-child(3) {
			animation-delay: 0.4s;
		}
	}
	@keyframes doorDot {
		0%,
		100% {
			transform: none;
		}
		50% {
			transform: translateY(-3px);
		}
	}
</style>
