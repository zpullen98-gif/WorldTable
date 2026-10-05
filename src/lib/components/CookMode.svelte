<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import type { Step, DishStandard, TechniqueStandard } from '$lib/types';
	import type { Grade } from '$lib/repertoire';
	import type { Palate } from '$lib/types';
	import { loadPalate } from '$lib/data';
	import { acquireWakeLock } from '$lib/wakeLock';
	import { timers, formatClock } from '$lib/stores/timers.svelte';

	let {
		name,
		slug,
		steps,
		standard,
		standardLabel,
		onclose,
		onfinish,
		onannotate,
		guides,
		ratings,
		prep,
		prepDone = $bindable([])
	}: {
		name: string;
		slug: string;
		steps: Step[];
		/** When the dish has one, the last screen is a check against it. */
		standard?: DishStandard | TechniqueStandard;
		/**
		 * Set only when `standard` is a TECHNIQUE standard standing in for a dish
		 * that has none: the technique's name, so the question can say what is
		 * actually being judged. A cook asked "how did it come out?" against a
		 * technique's marks would reasonably think the dish had been assessed.
		 */
		standardLabel?: string;
		onclose: () => void;
		onfinish?: (grade?: Grade, off?: string[]) => void;
		/**
		 * The fault, once the cook has named it. Separate from onfinish because
		 * the ORDER is load-bearing: the cook is recorded before the repair panel
		 * opens, and the fault is chosen after that.
		 */
		onannotate?: (fault: string) => void;
		/**
		 * Cook at home's coaching, one per step (lib/kitchen.ts): what it looks,
		 * sounds and smells like when it is right, always shown under the step,
		 * and the common mistake with its fix behind a disclosure, so the step
		 * stays the headline. Absent for a Library recipe, which carries none.
		 */
		guides?: Array<{ look: string; mistake: string; fix: string } | null>;
		/**
		 * A dish with no standard to check against can still be rated in words
		 * (Cook at home's three: each word one grade). Set, the last screen asks
		 * how it came out with these words and the grade moves the re-cook
		 * interval like the pass's; unset, a dish with no standard is marked
		 * cooked ungraded, as it always was.
		 */
		ratings?: ReadonlyArray<{ grade: Grade; word: string; line: string }>;
		/**
		 * Cook at home's mise en place. Real cooking often sits there (a stock
		 * braised for the rice, a dough rested, potatoes parboiled), so a dish
		 * that carries one opens on it, ahead of step 1: the tick list, with a
		 * timer on every line that states a time. Skipping it would send a cook
		 * to a step that calls for a stock nobody made. Absent for a Library
		 * recipe, which opens on its first step as it always did.
		 */
		prep?: Array<{ text: string; durationSec: number | null }>;
		/** The ticks, bound so the dish page's own list and this one agree. */
		prepDone?: boolean[];
	} = $props();

	const hasPrep = $derived(!!prep?.length);
	/* Opens on the mise when there is one. Read once: the dish does not
	   change under an open cook mode. */
	let atPrep = $state(untrack(() => !!prep?.length));
	/* Mise timers are kept apart from step timers by a negative index:
	   line k is -(k + 1), so step 0's timer and line 0's never collide. */
	const prepIndex = (k: number) => -(k + 1);

	let i = $state(0);
	const step = $derived(steps[i]);
	const last = $derived(i === steps.length - 1);
	const guide = $derived(guides?.[i] ?? null);
	/* A written-out step (Cook at home's run to fifty words or more) is set
	   smaller than a Library step's line, still readable across a kitchen. */
	const longStep = $derived((step?.text.length ?? 0) > 160);
	const rated = $derived(!standard && !!ratings?.length);

	/**
	 * A real <dialog>, opened with showModal().
	 *
	 * The overlay used to be a z-index:80 div, which could never win: the layout
	 * gives `main` a stacking context, so the sticky nav at z-index:40 painted
	 * OVER cook mode. On a phone the ✕ sat under a mode tab, and tapping it
	 * navigated you out of the recipe mid-braise, losing the step and the timer.
	 * The top layer is not part of that contest, so showModal() fixes it at the
	 * root, and brings focus containment, focus return, and Escape with it.
	 */
	let dialog = $state<HTMLDialogElement | null>(null);

	/* ---- timers ---------------------------------------------------------
	 * Seeded from the step's precomputed durationSec (parsed at build time from
	 * "simmer 20 min" phrasing; the original re-parsed it on every step render,
	 * L3407). Steps with no stated duration offer no timer, rather than the
	 * original's fabricated 4-minute default.
	 *
	 * The clock itself lives in the shared store, not here, for one reason:
	 * closing cook mode does not take the pot off the heat. A timer started on
	 * step 3 keeps running while you read step 4, while you leave to check the
	 * Lexicon, and across a reload, and rings wherever you are.
	 */
	const stepTimer = $derived(timers.find(slug, i));
	const stepSeconds = $derived(step?.durationSec ?? null);
	const remaining = $derived(stepTimer ? timers.remaining(stepTimer) : stepSeconds);
	const running = $derived(Boolean(stepTimer?.endsAt));
	const elapsed = $derived(Boolean(stepTimer?.rang));

	const clock = $derived(remaining == null ? null : formatClock(remaining));

	/** Other pots on other burners: visible without leaving the step you are on. */
	const others = $derived(timers.active.filter((t) => t.id !== stepTimer?.id));

	function startTimer() {
		if (stepSeconds == null || stepSeconds <= 0) return;
		timers.start({
			label: `${name} · step ${i + 1}`,
			seconds: stepTimer?.paused ?? stepSeconds,
			recipeSlug: slug,
			stepIndex: i
		});
	}
	function pauseTimer() {
		if (stepTimer) timers.pause(stepTimer.id);
	}
	function resumeTimer() {
		if (stepTimer) timers.resume(stepTimer.id);
	}
	function resetTimer() {
		if (stepTimer) timers.dismiss(stepTimer.id);
	}

	function startPrepTimer(k: number) {
		const line = prep?.[k];
		if (!line?.durationSec) return;
		const t = timers.find(slug, prepIndex(k));
		timers.start({
			label: `${name} · mise ${k + 1}`,
			seconds: t?.paused ?? line.durationSec,
			recipeSlug: slug,
			stepIndex: prepIndex(k)
		});
	}
	function togglePrep(k: number) {
		const next = prep?.map((_, j) => Boolean(prepDone?.[j])) ?? [];
		next[k] = !next[k];
		prepDone = next;
	}

	function next() {
		if (atPrep) atPrep = false;
		else if (!last) i += 1;
	}
	function prev() {
		if (atPrep) return;
		if (i > 0) i -= 1;
		else if (hasPrep) atPrep = true;
	}
	/**
	 * The pass.
	 *
	 * Cooking a dish and recording that you cooked it is attendance. The last
	 * screen therefore asks the only question the guide is now able to ask: did
	 * the plate match its standard? It is one tap, with the marks in front of
	 * you, and it is what moves the re-cook interval: a miss brings the dish
	 * back sooner (lib/repertoire.ts).
	 *
	 * Dishes without a standard skip it entirely rather than being asked to
	 * self-grade against nothing.
	 */
	let grading = $state(false);

	function finish() {
		if ((standard || rated) && !grading) {
			grading = true;
			return;
		}
		onfinish?.();
		close();
	}

	/**
	 * Taste and correct, the half of the pass a recipe never covers.
	 *
	 * A cook who has just admitted the plate was off is at the one moment the
	 * repair table is worth anything, so it comes to them rather than living
	 * three taps away on /palate. A plate that MET its standard skips it: there
	 * is nothing to fix, and a screen that appears anyway teaches cooks to tap
	 * through screens.
	 *
	 * The cook is recorded BEFORE the panel opens, not after. Closing the
	 * dialog from here (the ✕, Escape, the phone ringing) must not be able to
	 * lose the grade that was already given.
	 */
	let repairing = $state(false);
	let palate = $state<Palate | null>(null);
	let fault = $state<string | null>(null);

	/**
	 * Which marks were off, by frozen mark id.
	 *
	 * The marks were already on this screen being read, so the annotation costs
	 * the cook nothing extra: they run down the list, tap the ones that were
	 * off, then tap a grade. No second screen: a screen that appears after
	 * every plate teaches cooks to tap through screens, which is the same
	 * reasoning that keeps the repair panel off a plate that MET its standard.
	 *
	 * The three grade buttons are untouched on purpose. Deriving the grade from
	 * how many marks were tapped would silently rewire the one input
	 * repertoire.ts runs on across 970 recipes, and "one mark off" means
	 * different things on a 3-mark technique standard and a 5-mark dish one.
	 */
	let off = $state<string[]>([]);
	function toggleMark(id: string) {
		off = off.includes(id) ? off.filter((x) => x !== id) : [...off, id];
	}

	async function grade(g: Grade) {
		// A plate that met its standard had nothing off, whatever was tapped on
		// the way to saying so.
		if (g === 'met') off = [];
		onfinish?.(g, off);
		if (g === 'met') {
			close();
			return;
		}
		repairing = true;
		// Lazy: a cook who nails every plate never pays for palate.json.
		palate = await loadPalate();
	}

	/**
	 * The single exit. Closes the top-layer dialog AND tells the parent to
	 * unmount us, driven explicitly rather than through the dialog's `close`
	 * event, which did not reach the prop and left a closed dialog mounted with
	 * focus stranded on the ✕.
	 */
	let closed = false;
	function close() {
		if (closed) return;
		closed = true;
		dialog?.close();
		onclose();
	}

	/**
	 * One announcer, mounted for the dialog's whole life.
	 *
	 * The three screens (steps / grading / repairing) are alternates of a
	 * single {#if}, each carrying its OWN aria-live region - so a live region
	 * was always created together with its content, which screen readers do
	 * not reliably announce; the region has to already exist before the
	 * mutation. Both transitions (finish() into grading, grade() into
	 * repairing) also fired from a button inside the branch that was about to
	 * unmount, so the cook's tab position was lost at the same moment.
	 *
	 * This node never unmounts, so a transition is a text change inside an
	 * EXISTING region - the reliable case - rather than a new one appearing
	 * full. It is deliberately separate from the three visible `.live`/
	 * `.pass.live` panels below, which keep their own on-screen text but lose
	 * their aria-live/aria-atomic: within the steps screen, `.live` used to
	 * scope the announcement to just the step text (not the timer, not the
	 * nav buttons), and folding everything into one always-mounted atomic
	 * region would have re-announced the whole screen on every timer tick,
	 * which is the exact bug this file's own header comment already fixed
	 * once.
	 */
	const liveAnnounce = $derived.by(() => {
		if (repairing) return `${name}: what to reach for.`;
		if (grading)
			return standardLabel
				? `${name}: how was the technique, ${standardLabel}?`
				: `${name}: how did it come out?`;
		if (atPrep) return `${name}: mise en place, ${prep?.length ?? 0} jobs before step 1.`;
		return `${name}: step ${i + 1} of ${steps.length}. ${step?.text ?? ''}`;
	});

	/**
	 * Focus follows the screen. `finish()` and `grade('close'|'missed')` both
	 * fire from a button inside the branch that unmounts when grading/
	 * repairing turns true, so without this focus fell to <body> (or, inside
	 * this modal <dialog>, wherever the engine's focus-fixup lands) at the
	 * exact moment the screen changed. `passHeadingEl` is rebound by each
	 * branch's own `bind:this` below; a tabindex="-1" paragraph, the same
	 * idiom RecipeBrowser.svelte uses for its own heading, so this works
	 * identically whether or not the repair table (async) has loaded yet.
	 */
	let passHeadingEl: HTMLElement | undefined = $state();
	$effect(() => {
		if (grading || repairing) passHeadingEl?.focus();
	});

	/* ---- wake lock ------------------------------------------------------ */
	let awake = $state(false);
	let releaseLock: (() => void) | null = null;

	onMount(() => {
		// Where focus came from, so it can go back there. A modal <dialog> does
		// this itself, but we unmount on close, so restore it deliberately;
		// otherwise focus lands on <body> and a keyboard user loses their place.
		const opener = document.activeElement as HTMLElement | null;
		dialog?.showModal();

		// The request is async; an exit inside that window used to leak the lock
		// AND strand wakeLock.ts's visibilitychange listener, which then
		// re-acquired a screen lock on every tab return for the rest of the
		// session. Nothing the user could see or stop.
		let destroyed = false;
		void acquireWakeLock().then((release) => {
			if (!release) return;
			if (destroyed) {
				release();
				return;
			}
			releaseLock = release;
			awake = true;
		});

		// No visibilitychange handling here any more: the timer store owns the
		// clock and resyncs itself, precisely so a running timer does not depend
		// on this component still being mounted.
		return () => {
			destroyed = true;
			releaseLock?.();
			releaseLock = null;
			awake = false;
			if (opener?.isConnected) opener.focus();
		};
	});

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowRight') next();
		else if (e.key === 'ArrowLeft') prev();
		// Escape is handled here as well as via the dialog's `cancel` event.
		// Belt and braces on purpose: `cancel` is the correct native path, but it
		// does not fire in every environment (it does not fire under automation
		// here at all), and "the way out of the modal" is not a thing to leave to
		// one mechanism.
		else if (e.key === 'Escape') close();
		else return;
		e.preventDefault();
	}
</script>

<dialog
	bind:this={dialog}
	class="cook"
	aria-label="Cook mode: {name}"
	data-print="hide"
	onkeydown={onKeydown}
	oncancel={(e) => {
		// Escape. Take it through our own exit so the parent unmounts us, rather
		// than letting the UA close the dialog and leave the component mounted.
		e.preventDefault();
		close();
	}}
>
	<button class="close" onclick={close} aria-label="Exit cook mode">✕</button>

	<!-- See liveAnnounce's own comment above: the one node in here that never
	     unmounts, so a screen change is a mutation a screen reader can
	     reliably catch rather than a region appearing already full. -->
	<div class="sr" aria-live="polite" aria-atomic="true">{liveAnnounce}</div>

	<!--
		The visible text below is now presentation only (no aria-live): the
		hidden node above owns the announcement. Scoped to just the changing
		text, as it always was - the clock used to be the only live region in
		here, which meant the ticking seconds were announced every few hundred
		milliseconds while the step text, the entire content of the dialog,
		changed silently.
	-->
	{#if repairing}
		<div class="pass live">
			<p class="eyebrow" tabindex="-1" bind:this={passHeadingEl}>{name} · what to reach for</p>
			{#if standard}
				<p class="passfault"><b>The usual cause here</b> {standard.fault}</p>
			{/if}
			{#if palate}
				<p class="passq">Name the loudest fault.</p>
				<div class="faultpick">
					{#each palate.faults as f (f.slug)}
						<button
							class="chip"
							class:on={fault === f.slug}
							aria-pressed={fault === f.slug}
							onclick={() => {
								fault = fault === f.slug ? null : f.slug;
								// Kept, not discarded. This was component state that died with
								// the dialog, the one moment the app captures a real diagnosis
								// and it threw it away.
								if (fault) onannotate?.(fault);
							}}
						>
							{f.label}
						</button>
					{/each}
				</div>
				{#each palate.faults.filter((f) => f.slug === fault) as f (f.slug)}
					<p class="symptom">{f.symptom}</p>
					<ol class="levers">
						{#each f.levers as l, i (i)}
							<li><b>{l.move}</b> <span>{l.note}</span></li>
						{/each}
					</ol>
				{/each}
				<p class="passnote">{palate.metaRule}</p>
			{:else}
				<p class="passnote">Fetching the repair table…</p>
			{/if}
			<div class="passbtns">
				<button class="chip go" onclick={close}>Done</button>
			</div>
		</div>
	{:else if grading && rated}
		<div class="pass live">
			<p class="eyebrow" tabindex="-1" bind:this={passHeadingEl}>{name} · how it came out</p>
			<p class="passq">How did it come out?</p>
			<div class="passbtns words">
				{#each ratings ?? [] as r (r.grade)}
					<button class="chip" class:go={r.grade === 'met'} onclick={() => grade(r.grade)}>{r.word}</button>
				{/each}
			</div>
			<ul class="wordlines">
				{#each ratings ?? [] as r (r.grade)}
					<li><b>{r.word}</b> {r.line}</li>
				{/each}
			</ul>
			<p class="passnote">
				An honest word here is the whole point: it sets how soon this dish comes back.
			</p>
		</div>
	{:else if grading}
		<div class="pass live">
			<p class="eyebrow" tabindex="-1" bind:this={passHeadingEl}>{name} · the pass</p>
			{#if standardLabel}
				<!-- Naming the technique on its own line rather than folding it into the
				     question: the labels are noun phrases ("Making a roux", "Knife cuts:
				     dice, julienne, bias") and no single sentence reads well around all
				     26 of them. -->
				<p class="passq">How was the technique?</p>
				<p class="passtech">{standardLabel} · this dish has no standard of its own yet</p>
			{:else}
				<p class="passq">How did it come out?</p>
			{/if}
			<p class="passhint">Tap anything that was off.</p>
			<ul class="passmarks">
				{#each standard?.marks ?? [] as mark (mark.id)}
					<li>
						<button
							type="button"
							class="markrow"
							class:on={off.includes(mark.id)}
							aria-pressed={off.includes(mark.id)}
							onclick={() => toggleMark(mark.id)}
						>
							<span class="markbox" aria-hidden="true">{off.includes(mark.id) ? '✕' : ''}</span>
							<span>{mark.text}</span>
						</button>
					</li>
				{/each}
			</ul>
			<p class="passfault"><b>Where it goes wrong</b> {standard?.fault}</p>
			<div class="passbtns">
				<button class="chip go" onclick={() => grade('met')}>Met the standard</button>
				<button class="chip" onclick={() => grade('close')}>Close</button>
				<button class="chip" onclick={() => grade('missed')}>Missed it</button>
			</div>
			<p class="passnote">
				An honest answer here is the whole point: it sets how soon this dish comes back.
			</p>
		</div>
	{:else if atPrep}
	<div class="live prep">
		<p class="eyebrow">{name} · before step 1</p>
		<p class="step long">Mise en place</p>
		<p class="look">Every job here comes before step 1, and some of them cook. Tick each one off as it is done.</p>
		<ul class="preplist" aria-label="Mise en place">
			{#each prep ?? [] as line, k (k)}
				{@const t = timers.find(slug, prepIndex(k))}
				{@const left = t ? timers.remaining(t) : line.durationSec}
				<li>
					<label class:ticked={prepDone?.[k]}>
						<input type="checkbox" checked={Boolean(prepDone?.[k])} onchange={() => togglePrep(k)} />
						<span>{line.text}</span>
					</label>
					{#if line.durationSec}
						<span class="preptimer">
							<span class="pclock" class:alarm={t?.rang}>{t?.rang ? 'Time' : formatClock(left ?? 0)}</span>
							{#if t?.rang}
								<button class="chip" onclick={() => t && timers.dismiss(t.id)}>Clear</button>
							{:else if t?.endsAt}
								<button class="chip" onclick={() => t && timers.pause(t.id)}>Pause</button>
							{:else if t?.paused != null}
								<button class="chip go" onclick={() => t && timers.resume(t.id)}>Resume</button>
							{:else}
								<button class="chip go" onclick={() => startPrepTimer(k)} aria-label="Start timer for mise {k + 1}">Start timer</button>
							{/if}
						</span>
					{/if}
				</li>
			{/each}
		</ul>
	</div>

	<div class="nav">
		<button class="chip go" onclick={next}>Start step 1 ▶</button>
	</div>
	{:else}
	<div class="live">
		<p class="eyebrow">{name} · step {i + 1} of {steps.length}</p>
		<p class="step" class:alarm={elapsed} class:long={longStep}>{step?.text}</p>
		{#if guide}
			<p class="look"><b>Look for</b> {guide.look}</p>
			<details class="wrong">
				<summary>If it goes wrong</summary>
				<p><b>The usual mistake</b> {guide.mistake}</p>
				<p><b>The fix</b> {guide.fix}</p>
			</details>
		{/if}
	</div>

	<div class="timerrow">
		{#if clock !== null}
			<span class="clock" class:alarm={elapsed}>{clock}</span>
			{#if elapsed}
				<button class="chip" onclick={resetTimer}>Time! Clear</button>
			{:else if running}
				<button class="chip" onclick={pauseTimer}>Pause</button>
			{:else if stepTimer?.paused != null}
				<button class="chip go" onclick={resumeTimer}>Resume</button>
			{:else}
				<button class="chip go" onclick={startTimer}>Start timer</button>
			{/if}
		{:else}
			<span class="notimer">No stated time on this step: trust your senses.</span>
		{/if}
	</div>

	{#if elapsed}
		<p class="alarmnote" role="alert">Time is up.</p>
	{/if}

	{#if others.length}
		<ul class="others" aria-label="Other timers running">
			{#each others as t (t.id)}
				<li class:rang={t.rang}>
					<span class="olabel">{t.label}</span>
					<span class="oclock">{t.rang ? 'Time' : formatClock(timers.remaining(t))}</span>
					<button class="ox" onclick={() => timers.dismiss(t.id)} aria-label="Clear {t.label}">
						✕
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="nav">
		<button class="chip" onclick={prev} disabled={i === 0 && !hasPrep}>{i === 0 && hasPrep ? '◀ Mise' : '◀ Back'}</button>
		{#if last}
			<button class="chip go" onclick={finish}>
				{standard ? 'Done, check the plate ▸' : rated ? 'Done, say how it came out ▸' : 'Done, mark cooked ✓'}
			</button>
		{:else}
			<button class="chip go" onclick={next}>Next step ▶</button>
		{/if}
	</div>

	<div class="dots">
		{#each steps as _, d (d)}
			<button
				class="dot"
				class:on={d === i}
				onclick={() => (i = d)}
				tabindex="-1"
				aria-label="Go to step {d + 1}"
			></button>
		{/each}
	</div>
	{/if}

	{#if awake}
		<p class="awake">☀ Screen staying awake while you cook</p>
	{/if}
</dialog>

<style>
	/* The pass panel. Deliberately the same weight as a step rather than a
	   celebration screen: it is the last piece of work, not a reward. */
	.pass .passq {
		font-size: var(--t-h3, 1.15rem);
		margin: 6px 0 10px;
	}
	/* A real colour token, not stacked opacity. The shared home CSS dims already
	   muted text with opacity: .6 and lands at 2.32:1 against a 4.5:1 target;
	   repeating that here would put the same defect on the pass screen. */
	.passtech {
		margin: -4px 0 10px;
		font-size: var(--t-small, 0.8125rem);
		color: var(--ink-soft);
	}
	.passmarks {
		margin: 0 0 10px;
		padding-left: 1.1em;
		line-height: 1.5;
	}
	.passmarks li {
		margin-bottom: 4px;
	}
	.passhint {
		margin: 0 0 6px;
		font-size: var(--t-small, 0.8125rem);
		color: var(--ink-soft);
	}
	.passmarks li {
		list-style: none;
	}
	/* 44px minimum, because this is tapped with one hand on a hot pan. The box
	   carries the state as a glyph as well as a colour and a weight: a tick
	   that only differs by hue is unreadable in a kitchen under sodium light. */
	.markrow {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		width: 100%;
		min-height: 44px;
		padding: 8px 6px;
		border: 0;
		background: none;
		font: inherit;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}
	.markbox {
		flex: none;
		width: 22px;
		height: 22px;
		margin-top: 1px;
		border: 1.5px solid var(--line-strong);
		border-radius: 4px;
		display: grid;
		place-items: center;
		font-size: 0.8rem;
		line-height: 1;
	}
	.markrow.on {
		font-weight: 600;
	}
	.markrow.on .markbox {
		border-color: var(--chili);
		color: var(--chili);
	}
	.passfault {
		margin: 0 0 14px;
		opacity: 0.85;
		line-height: 1.5;
	}
	.faultpick {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 12px;
	}
	.faultpick .chip.on {
		border-color: var(--turmeric-deep);
		color: var(--turmeric-deep);
	}
	.pass .symptom {
		margin: 0 0 8px;
		color: var(--ink-soft);
		line-height: 1.5;
	}
	.pass .levers {
		margin: 0 0 12px;
		padding-left: 1.4em;
		line-height: 1.5;
	}
	.pass .levers li {
		margin-bottom: 6px;
	}
	.pass .levers span {
		opacity: 0.9;
	}
	.passbtns {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
	.passnote {
		margin-top: 12px;
		font-size: var(--t-small, 0.8125rem);
		opacity: 0.7;
	}

	/*
	 * `display: flex` below would otherwise beat the UA's
	 * `dialog:not([open]) { display: none }`, leaving a CLOSED dialog painted
	 * over the page as a non-modal panel with no way out.
	 */
	.cook:not([open]) {
		display: none;
	}

	.cook {
		/* A modal <dialog> is centred by the UA; we want the whole viewport. */
		position: fixed;
		inset: 0;
		width: 100%;
		max-width: 100%;
		height: 100%;
		max-height: 100%;
		border: 0;
		margin: 0;
		background: var(--paper);
		color: var(--ink);
		display: flex;
		flex-direction: column;
		align-items: center;
		/*
		 * `safe center` and overflow are the landscape fix. A fixed, centred flex
		 * box cannot be scrolled by the document, so on a long step at 568x320 the
		 * Back/Next row was centred straight out of the viewport and unreachable:
		 * no forward, no back, and a ✕ that (before the dialog) navigated away.
		 */
		justify-content: safe center;
		overflow-y: auto;
		gap: 22px;
		padding: 60px 24px 40px;
		text-align: center;
	}
	.cook::backdrop {
		background: var(--paper);
	}

	.close {
		position: absolute;
		top: 16px;
		right: 16px;
		width: 44px;
		height: 44px;
		border: 1px solid var(--line);
		background: var(--card);
		border-radius: var(--radius);
		cursor: pointer;
		font-size: 16px;
		color: var(--muted);
	}
	.close:hover {
		color: var(--chili);
		border-color: var(--chili);
	}

	.live {
		display: flex;
		flex-direction: column;
		gap: 22px;
		align-items: center;
	}

	/* Same shape as the helper in CuisineRail and menu/costing. liveAnnounce's
	   own text, never shown - the visible .eyebrow/.step paragraphs already
	   say the same thing on screen. */
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}

	/* The point of cook mode: one step, set huge, readable from across a
	   kitchen with your hands in a bowl. */
	.step {
		font-family: var(--display);
		font-size: clamp(1.5rem, 3.4vw + 1rem, 2.6rem);
		line-height: 1.35;
		max-width: 26ch;
		text-wrap: balance;
	}
	.step.alarm {
		color: var(--turmeric-deep);
	}
	.step.long {
		font-size: clamp(1.2rem, 1.4vw + 0.95rem, 1.75rem);
		max-width: 38ch;
		text-wrap: pretty;
	}
	/* Cook at home's coaching under the step: plain text, left set, the
	   measure of the pass's own lines. */
	.look,
	.wrong,
	.wordlines {
		width: 100%;
		max-width: 60ch;
		text-align: left;
		line-height: 1.6;
		color: var(--ink-soft);
	}
	.look b,
	.wrong b,
	.wordlines b {
		color: var(--turmeric-deep);
		font-weight: 600;
		margin-right: 4px;
	}
	.wrong summary {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		cursor: pointer;
		color: var(--ink);
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-color: var(--line-strong);
	}
	.wrong summary::after {
		content: '▸';
		color: var(--turmeric-deep);
		text-decoration: none;
	}
	.wrong[open] summary::after {
		content: '▾';
	}
	.wrong p {
		margin: 4px 0 8px;
	}
	.wordlines {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.wordlines li {
		margin-bottom: 6px;
	}

	.preplist {
		list-style: none;
		padding: 0;
		margin: 0;
		width: 100%;
		max-width: 60ch;
		text-align: left;
	}
	.preplist li {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px 12px;
		padding: 6px 0;
		border-bottom: 1px solid var(--line);
	}
	.preplist label {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		flex: 1 1 22ch;
		min-height: 44px;
		line-height: 1.55;
		cursor: pointer;
	}
	.preplist input {
		flex: none;
		width: 22px;
		height: 22px;
		margin-top: 2px;
		accent-color: var(--turmeric-deep);
	}
	.preplist label.ticked span {
		color: var(--ink-soft);
		text-decoration: line-through;
		text-decoration-color: var(--line-strong);
	}
	.preptimer {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-left: auto;
	}
	.pclock {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}
	.pclock.alarm {
		color: var(--turmeric-deep);
	}

	.timerrow {
		display: flex;
		gap: 14px;
		align-items: center;
		min-height: 48px;
	}
	.clock {
		font-family: var(--display);
		font-size: 2rem;
		font-variant-numeric: tabular-nums;
		color: var(--turmeric-deep);
	}
	.clock.alarm {
		animation: pulse 1s ease infinite;
	}
	@keyframes pulse {
		50% {
			opacity: 0.25;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.clock.alarm {
			animation: none;
			text-decoration: underline;
		}
	}
	.notimer {
		font-style: italic;
		color: var(--muted);
		font-size: var(--t-small);
	}
	.alarmnote {
		font-size: var(--t-small);
		color: var(--turmeric-deep);
	}

	/* The other pots. Quiet by design: the step you are on is the headline. */
	.others {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		justify-content: center;
		max-width: 620px;
	}
	.others li {
		display: flex;
		align-items: center;
		gap: 8px;
		border: 1px solid var(--line);
		border-left: 2px solid var(--turmeric);
		border-radius: var(--radius);
		padding: 4px 4px 4px 10px;
		font-size: var(--t-small);
		color: var(--muted);
	}
	.others li.rang {
		border-color: var(--chili);
		border-left-color: var(--chili);
		color: var(--chili);
	}
	.olabel {
		max-width: 20ch;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.oclock {
		font-variant-numeric: tabular-nums;
		color: var(--turmeric-deep);
	}
	.others li.rang .oclock {
		color: var(--chili);
	}
	.ox {
		border: 1px solid var(--line);
		background: none;
		color: inherit;
		border-radius: var(--radius);
		cursor: pointer;
		width: 28px;
		min-height: 28px;
		font: inherit;
	}
	.ox:hover {
		border-color: var(--turmeric);
	}

	.nav {
		display: flex;
		gap: 12px;
	}
	.chip {
		border: 1px solid var(--line);
		background: var(--card);
		color: var(--ink);
		padding: 12px 22px;
		border-radius: var(--radius);
		cursor: pointer;
		font-size: 16px;
	}
	.chip:hover:not(:disabled) {
		border-color: var(--turmeric);
	}
	.chip:disabled {
		opacity: 0.4;
		cursor: default;
	}
	.chip.go {
		background: var(--accent-solid);
		border-color: var(--accent-solid);
		color: var(--on-accent);
	}

	.dots {
		display: flex;
		gap: 2px;
		flex-wrap: wrap;
		justify-content: center;
		max-width: 400px;
	}
	/* 9px of ink, 24px of target: a wet fingertip is not 9px wide. */
	.dot {
		width: 24px;
		height: 24px;
		border: 0;
		background: none;
		cursor: pointer;
		padding: 0;
		display: grid;
		place-items: center;
	}
	.dot::before {
		content: '';
		width: 9px;
		height: 9px;
		border-radius: 50%;
		border: 1px solid var(--line-strong);
	}
	.dot.on::before {
		background: var(--turmeric);
		border-color: var(--turmeric);
	}

	.awake {
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
	}

	/*
	 * Landscape on a phone: 320-390px of height for a step, a clock, two
	 * buttons and the dots. Tighten everything and let the step shrink.
	 */
	@media (max-height: 460px) {
		.cook {
			gap: 10px;
			padding: 44px 16px 12px;
		}
		.live {
			gap: 8px;
		}
		.step {
			font-size: clamp(1.1rem, 2.2vw + 0.7rem, 1.5rem);
			line-height: 1.25;
			max-width: 40ch;
		}
		.timerrow {
			min-height: 0;
		}
		.clock {
			font-size: 1.4rem;
		}
		.chip {
			padding: 9px 16px;
		}
		.close {
			top: 8px;
			right: 8px;
		}
		.dots {
			display: none;
		}
	}

	/* A quiet working bench inside the same house. The step stays large and
	   timers remain compact; the dialog's scrolling and focus contract is unchanged. */
	@media screen {
		.cook {
			gap: 20px;
			padding: calc(70px + env(safe-area-inset-top, 0px)) 22px calc(28px + env(safe-area-inset-bottom, 0px));
			background: var(--paper);
		}
		.live {
			width: min(100%, 780px);
			padding: 26px 28px;
			gap: 19px;
			background: var(--house-panel, var(--card));
			border: 1px solid var(--house-frame, var(--line-strong));
			box-shadow: var(--house-inset, none);
		}
		.eyebrow {
			font-family: var(--house-display, var(--display));
			font-size: 0.72rem;
			letter-spacing: 0.065em;
			line-height: 1.65;
			color: var(--turmeric-deep);
		}
		.close { border-color: var(--house-frame, var(--line-strong)); color: var(--ink); }
		.timerrow { flex-wrap: wrap; justify-content: center; gap: 12px; max-width: 100%; }
		.clock { font-size: 2.2rem; }
		.nav, .passbtns { flex-wrap: wrap; justify-content: center; gap: 10px; max-width: 100%; }
		.chip { min-height: 44px; padding: 10px 18px; font-size: 1rem; line-height: 1.4; border-color: var(--house-frame, var(--line-strong)); }
		.chip.go { border-color: var(--accent-solid); }
		.others li { padding: 4px 5px 4px 13px; background: var(--card); border-color: var(--house-frame, var(--line-strong)); }
		.others li.rang { border-color: var(--chili); }
		.ox { width: 44px; min-height: 44px; border-color: var(--field-line); }
		.passmarks, .passfault, .pass .levers, .pass .symptom { width: 100%; max-width: 60ch; text-align: left; line-height: 1.65; }
		.passmarks { margin-bottom: 0; }
		.markrow { padding: 10px 8px; border-bottom: 1px solid var(--line); line-height: 1.55; }
		.markbox { border-color: var(--field-line); border-radius: 2px; }
		.passfault, .pass .levers span, .passnote { opacity: 1; color: var(--ink-soft); }
		.passnote { max-width: 60ch; font-size: 0.92rem; line-height: 1.6; margin-top: 0; }
		.faultpick { justify-content: center; }
		.faultpick .chip.on { box-shadow: inset 0 -2px 0 var(--turmeric-deep); }
		.dots { gap: 3px; }
		.dot { width: 44px; height: 44px; }
		.dot::before { border-color: var(--field-line); }
		.awake { font-size: 0.72rem; letter-spacing: 0.08em; line-height: 1.6; }
		@media (max-width: 520px) {
			.cook { padding-inline: 14px; }
			.live { padding: 23px 18px; }
			.chip { padding-inline: 14px; }
		}
		@media (max-height: 460px) {
			.cook { gap: 9px; padding: 58px 16px 16px; }
			.live { padding: 14px 18px; gap: 8px; }
			.clock { font-size: 1.5rem; }
			.chip { padding: 9px 14px; }
		}
		@media (forced-colors: active) {
			.live { background: Canvas; border-color: CanvasText; box-shadow: none; }
		}
	}
</style>
