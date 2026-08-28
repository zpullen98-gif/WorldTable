/**
 * The persisted session — menu, notes, pantry, cooked log, family recipes.
 *
 * One store rather than five, because they share a single IndexedDB record and
 * a single debounce; splitting them would mean five concurrent writes racing to
 * the same key on every mutation.
 *
 * Everything is keyed by SLUG. The original stored array indices (MENU at
 * L2931, NOTES at L2916), so adding one family recipe — which pushes onto the
 * recipe array — silently repointed every saved reference to a different dish.
 */
import { browser } from '$app/environment';
import type { Recipe, RecipeSummary } from '../types';
import {
	EMPTY_SESSION,
	loadSession,
	saveSession,
	currentKey,
	debounce,
	type SessionState
} from '../persistence/db';
import {
	mergeSessions,
	RUN_MAX_AGE_MS,
	type MenuDish,
	type DishCosting,
	type PlanRun
} from '../persistence/state';
import { cookedSlugs, type CookEntry, type Grade } from '../repertoire';

class SessionStore {
	#s = $state<SessionState>(structuredClone(EMPTY_SESSION));
	#ready = $state(false);

	/**
	 * The storage key this state was loaded from.
	 *
	 * Held because a profile switch notifies AFTER the roster has already moved
	 * on, so at that moment KEY() is the INCOMING person. Flushing without
	 * naming a destination would write the outgoing person's edits into the
	 * incoming person's record.
	 */
	#key = '';

	#persist = debounce(() => {
		void saveSession($state.snapshot(this.#s) as SessionState, this.#key || undefined);
	}, 400);

	/**
	 * Immediate write, for single discrete actions — a pin, a tick, a saved
	 * recipe. The debounce exists for the notes textarea's keystroke stream;
	 * borrowing it for one-shot actions opened a 400ms window where pinning a
	 * dish and immediately clicking a link lost the pin (pagehide flushing an
	 * async IndexedDB write is not guaranteed to commit before teardown).
	 */
	#persistNow() {
		void saveSession($state.snapshot(this.#s) as SessionState, this.#key || undefined);
	}

	get ready() {
		return this.#ready;
	}

	async hydrate() {
		if (!browser || this.#ready) return;
		this.#s = await loadSession();
		this.#key = currentKey();
		this.#ready = true;

		// A tab closing or navigating mid-debounce would otherwise lose the last
		// edit. BOTH events, deliberately: visibilitychange covers tab switches
		// and minimising, but Chromium does not reliably fire it on
		// cross-document navigation — pin a dish and immediately click a link,
		// and the pin evaporated. pagehide is the one that always fires on the
		// way out.
		window.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'hidden') this.flush();
		});
		window.addEventListener('pagehide', () => this.flush());
	}

	flush() {
		this.#persist.flush();
	}

	/**
	 * Somebody else tapped their name.
	 *
	 * hydrate() cannot do this: it early-returns on #ready, so the obvious
	 * `onChange(() => session.hydrate())` is a silent no-op and the previous
	 * person's cooked log simply stays in memory under the new person's name.
	 *
	 * Order matters. The pending write is flushed to the OUTGOING key first —
	 * #key, not KEY(), because the roster has already moved — and only then is
	 * the new record loaded. Idempotent, because onChange fires immediately on
	 * registration: if the key has not actually changed there is nothing to do.
	 */
	async rehydrate() {
		if (!browser) return;
		const next = currentKey();
		if (this.#ready && next === this.#key) return;
		if (this.#ready) this.#persist.flush();
		this.#ready = false;
		this.#s = await loadSession();
		this.#key = next;
		this.#ready = true;
	}

	/* ---- role -----------------------------------------------------------
	 *
	 * What this person does, and therefore what the app suggests first. A
	 * default, never a wall: no surface is hidden from anyone.
	 *
	 * It lives here rather than in prefs (raw localStorage, device-wide, read
	 * synchronously by app.html — it would collapse all three roles to whoever
	 * tapped last) and rather than in the profile's path map (write-once with
	 * no unmark — a person who changed role would carry both stamps forever).
	 */

	get role() {
		return this.#s.role;
	}

	setRole(role: SessionState['role']) {
		this.#s.role = role;
		this.#persistNow();
	}

	/* ---- the calibration bench -------------------------------------------
	 *
	 * A third log beside drillLog, never folded into cookedLog: the mode bar
	 * amber count reads cookedLog, and folding these in would report "dishes past
	 * their re-cook" in the chrome of every page while counting salt.
	 */

	get calibrationLog() {
		return this.#s.calibrationLog;
	}

	/** One entry per RUN, not per trial — a trial on its own means nothing. */
	markCalibrated(slug: string, grade: 'met' | 'close' | 'missed') {
		this.#s.calibrationLog = [...this.#s.calibrationLog, { slug, at: Date.now(), grade }];
		this.#persistNow();
	}

	/* ---- menu ---------------------------------------------------------- */

	get menu(): string[] {
		return this.#s.menu;
	}

	get menuCount() {
		return this.#s.menu.length;
	}

	isPinned(slug: string) {
		return this.#s.menu.includes(slug);
	}

	togglePin(slug: string) {
		this.#s.menu = this.isPinned(slug)
			? this.#s.menu.filter((s) => s !== slug)
			: [...this.#s.menu, slug];
		this.#persistNow();
	}

	clearMenu() {
		this.#s.menu = [];
		this.#persistNow();
	}

	/* ---- notes --------------------------------------------------------- */

	note(slug: string): string {
		return this.#s.notes[slug] ?? '';
	}

	setNote(slug: string, text: string) {
		if (text) this.#s.notes[slug] = text;
		else delete this.#s.notes[slug];
		this.#persist();
	}

	/* ---- pantry -------------------------------------------------------- */

	get pantry(): string[] {
		return this.#s.pantry;
	}

	hasPantry(label: string) {
		return this.#s.pantry.includes(label);
	}

	togglePantry(label: string) {
		this.#s.pantry = this.hasPantry(label)
			? this.#s.pantry.filter((l) => l !== label)
			: [...this.#s.pantry, label];
		this.#persistNow();
	}

	clearPantry() {
		this.#s.pantry = [];
		this.#persistNow();
	}

	/* ---- shopping list ------------------------------------------------- */

	checked(menuHash: string): string[] {
		return this.#s.shoppingChecks[menuHash] ?? [];
	}

	toggleChecked(menuHash: string, line: string) {
		const cur = new Set(this.checked(menuHash));
		if (cur.has(line)) cur.delete(line);
		else cur.add(line);
		this.#s.shoppingChecks[menuHash] = [...cur];
		this.#persistNow();
	}

	/* ---- the service being cooked --------------------------------------
	 *
	 * `live` and `serviceTime` used to be component state, so walking to the
	 * walk-in and coming back lost the clock — on the one screen a cook stands
	 * in front of while something is on the heat.
	 */

	/**
	 * The run, but ONLY if it belongs to this menu and has not gone stale.
	 *
	 * Both guards matter. A run inherited by a different menu would tick rows
	 * that are not in it; a run resumed the following afternoon would open on
	 * "40 minutes behind" for a service that finished last night.
	 */
	runFor(menuHash: string): PlanRun | null {
		const r = this.#s.planRun;
		if (!r || r.menuHash !== menuHash) return null;
		if (Date.now() - r.startedAt > RUN_MAX_AGE_MS) return null;
		return r;
	}

	startRun(menuHash: string, serviceTime: string) {
		this.#s.planRun = { menuHash, serviceTime, startedAt: Date.now(), ticks: {} };
		this.#persistNow();
	}

	endRun() {
		this.#s.planRun = undefined;
		this.#persistNow();
	}

	setRunServiceTime(serviceTime: string) {
		if (!this.#s.planRun) return;
		this.#s.planRun = { ...this.#s.planRun, serviceTime };
		this.#persistNow();
	}

	/**
	 * Tick a row, and return the ms since the previously ticked row.
	 *
	 * The caller decides whether that interval is worth recording — only it
	 * knows whether the earlier step carried a wait, and a step with a wait
	 * measures the wait rather than the work.
	 */
	tickRow(rowKey: string): number | null {
		const r = this.#s.planRun;
		if (!r) return null;
		const now = Date.now();
		const previous = Object.values(r.ticks).reduce((n, t) => Math.max(n, t), 0);
		this.#s.planRun = { ...r, ticks: { ...r.ticks, [rowKey]: now } };
		this.#persistNow();
		return previous ? now - previous : null;
	}

	untickRow(rowKey: string) {
		const r = this.#s.planRun;
		if (!r || !(rowKey in r.ticks)) return;
		const ticks = { ...r.ticks };
		delete ticks[rowKey];
		this.#s.planRun = { ...r, ticks };
		this.#persistNow();
	}

	/* ---- what a step actually takes ------------------------------------- */

	actualsFor(key: string): number[] {
		return this.#s.stepActuals[key] ?? [];
	}

	/**
	 * Keep the last 12 observations for a step and no more. A step cooked for
	 * years should answer for how it goes NOW, not be anchored by a hundred
	 * intervals from when the cook was learning it.
	 */
	recordStepActual(key: string, minutes: number) {
		// Round FIRST, then refuse: an interval under thirty seconds rounds to
		// zero, and a stored zero is a sample that can never mean anything but
		// still takes a slot in the last-12 window.
		const whole = Math.round(minutes);
		if (!Number.isFinite(whole) || whole <= 0) return;
		const next = [...this.actualsFor(key), whole].slice(-12);
		this.#s.stepActuals = { ...this.#s.stepActuals, [key]: next };
		this.#persistNow();
	}

	clearChecked(menuHash: string) {
		delete this.#s.shoppingChecks[menuHash];
		this.#persistNow();
	}

	/* ---- cooked log ---------------------------------------------------- */

	/**
	 * Every cook, in the order they were recorded. Read it through
	 * lib/repertoire.ts rather than counting it: entries are COOKS, and one dish
	 * cooked three times is three of them.
	 */
	get cookedLog() {
		return this.#s.cookedLog;
	}

	/** The distinct dishes cooked — what "progress" means everywhere. */
	get cookedDishes(): Set<string> {
		return cookedSlugs(this.#s.cookedLog);
	}

	get cookedCount() {
		return this.cookedDishes.size;
	}

	hasCooked(slug: string) {
		return this.#s.cookedLog.some((e) => e.slug === slug);
	}

	/** How many times this dish has been made. */
	timesCooked(slug: string) {
		return this.#s.cookedLog.filter((e) => e.slug === slug).length;
	}

	/**
	 * Record a cook. The grade is what the plate was against the dish's
	 * standard, and it is what moves the re-cook interval — see
	 * lib/repertoire.ts. Dishes without a standard record no grade and simply
	 * advance, because having nothing to check against is the guide's gap.
	 */
	markCooked(slug: string, grade?: Grade, off?: string[]) {
		const entry: CookEntry = grade ? { slug, at: Date.now(), grade } : { slug, at: Date.now() };
		// Absent rather than empty: a graded plate with no annotation has not
		// been told nothing was off, it has been told nothing.
		if (off?.length) entry.off = [...off];
		this.#s.cookedLog = [...this.#s.cookedLog, entry];
		this.#persistNow();
	}

	/**
	 * Attach the named fault to the cook that was just recorded.
	 *
	 * A second call rather than a wider markCooked, because the order is
	 * load-bearing: cook mode records the grade BEFORE opening the repair panel
	 * so that closing the dialog — the ✕, Escape, the phone ringing — cannot
	 * lose it. The fault is chosen after that, and this is how it catches up.
	 *
	 * Patches the most recent entry for the slug and no other. If there is none
	 * it does nothing rather than inventing a cook that never happened.
	 */
	annotateLastCook(slug: string, patch: { fault?: string }) {
		let idx = -1;
		for (let i = this.#s.cookedLog.length - 1; i >= 0; i--) {
			if (this.#s.cookedLog[i].slug === slug) {
				idx = i;
				break;
			}
		}
		if (idx < 0) return;
		const next = [...this.#s.cookedLog];
		next[idx] = { ...next[idx], ...(patch.fault ? { fault: patch.fault } : {}) };
		this.#s.cookedLog = next;
		this.#persistNow();
	}

	/**
	 * A mis-tap at the stove should be one more tap to undo — and undo the
	 * MIS-TAP, not the history behind it.
	 *
	 * This used to drop every entry for the slug. That was invisible while a
	 * dish was a boolean; now that repeats carry the schedule, un-ticking a dish
	 * you had cooked four times silently deleted four years of evidence. It
	 * removes the most recent cook only, so tapping it undoes exactly what the
	 * last tap did.
	 */
	toggleCooked(slug: string) {
		const last = this.#s.cookedLog.reduce(
			(best, e, i) => (e.slug === slug && (best < 0 || e.at >= this.#s.cookedLog[best].at) ? i : best),
			-1
		);
		if (last >= 0) {
			this.#s.cookedLog = this.#s.cookedLog.filter((_, i) => i !== last);
			this.#persistNow();
		} else {
			this.markCooked(slug);
		}
	}

	/* ---- drills ----------------------------------------------------------
	 *
	 * No toggleDrilled. A cook can mis-tap at the stove and undo it; a drill
	 * answer is evidence and there is nothing to take back.
	 */

	get drillLog() {
		return this.#s.drillLog;
	}

	/** Recorded BEFORE any explanation is shown — closing the round must not
	 *  lose the answer, the same rule cook mode's pass panel follows. */
	markDrilled(slug: string, grade: Grade) {
		this.#s.drillLog = [...this.#s.drillLog, { slug, at: Date.now(), grade }];
		this.#persistNow();
	}

	/* ---- family recipes ------------------------------------------------ */

	get familyRecipes(): Recipe[] {
		return this.#s.familyRecipes;
	}

	addFamilyRecipe(r: Recipe) {
		this.#s.familyRecipes = [...this.#s.familyRecipes, r];
		this.#persistNow();
	}

	removeFamilyRecipe(slug: string) {
		this.#s.familyRecipes = this.#s.familyRecipes.filter((r) => r.slug !== slug);
		this.#persistNow();
	}

	/* ---- the kitchen's menu -------------------------------------------- */

	get menuDishes(): MenuDish[] {
		return this.#s.menuDishes;
	}

	addMenuDish(d: MenuDish) {
		this.#s.menuDishes = [...this.#s.menuDishes, d];
		this.#persistNow();
	}

	updateMenuDish(d: MenuDish) {
		this.#s.menuDishes = this.#s.menuDishes.map((e) => (e.id === d.id ? d : e));
		this.#persistNow();
	}

	removeMenuDish(id: string) {
		this.#s.menuDishes = this.#s.menuDishes.filter((d) => d.id !== id);
		if (id in this.#s.dishCosts) {
			const next = { ...this.#s.dishCosts };
			delete next[id];
			this.#s.dishCosts = next;
		}
		this.#persistNow();
	}

	/* ---- costing --------------------------------------------------------
	 *
	 * The venue's own numbers: what each line costs, what it yields, and how
	 * many went out. Keyed by dish id and stored beside the dishes rather than
	 * inside them — see the note on SessionState.dishCosts.
	 */

	costingFor(id: string): DishCosting {
		return this.#s.dishCosts[id] ?? { lines: [], ts: 0 };
	}

	setCosting(id: string, costing: Omit<DishCosting, 'ts'>) {
		this.#s.dishCosts = { ...this.#s.dishCosts, [id]: { ...costing, ts: Date.now() } };
		this.#persistNow();
	}

	/** Removing a dish must not leave its costing behind to be re-adopted by a
	 *  later dish that happens to mint the same id. Ids are random, but orphan
	 *  data that nothing displays is how a session file grows forever. */
	clearCosting(id: string) {
		if (!(id in this.#s.dishCosts)) return;
		const next = { ...this.#s.dishCosts };
		delete next[id];
		this.#s.dishCosts = next;
		this.#persistNow();
	}

	/* ---- import / export ----------------------------------------------- */

	snapshot(): SessionState {
		return $state.snapshot(this.#s) as SessionState;
	}

	replace(next: SessionState) {
		this.#s = next;
		this.#persist.flush();
	}

	/**
	 * Merge an imported .wtjson over the live session. The reconciliation itself
	 * is mergeSessions() in persistence/state.ts — a pure function so that a
	 * unit test can reach it, which is what this code most needed.
	 */
	merge(incoming: Partial<SessionState>) {
		this.#s = mergeSessions(this.#s, incoming);
		this.#persist.flush();
	}
}

export const session = new SessionStore();

/** Family recipes carry the same shape as guide recipes, marked at the source. */
export function isFamily(r: RecipeSummary) {
	return r.source === 'family';
}
