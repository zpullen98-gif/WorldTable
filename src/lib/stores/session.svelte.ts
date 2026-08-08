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
import { EMPTY_SESSION, loadSession, saveSession, debounce, type SessionState } from '../persistence/db';

class SessionStore {
	#s = $state<SessionState>(structuredClone(EMPTY_SESSION));
	#ready = $state(false);

	#persist = debounce(() => {
		void saveSession($state.snapshot(this.#s) as SessionState);
	}, 400);

	/**
	 * Immediate write, for single discrete actions — a pin, a tick, a saved
	 * recipe. The debounce exists for the notes textarea's keystroke stream;
	 * borrowing it for one-shot actions opened a 400ms window where pinning a
	 * dish and immediately clicking a link lost the pin (pagehide flushing an
	 * async IndexedDB write is not guaranteed to commit before teardown).
	 */
	#persistNow() {
		void saveSession($state.snapshot(this.#s) as SessionState);
	}

	get ready() {
		return this.#ready;
	}

	async hydrate() {
		if (!browser || this.#ready) return;
		this.#s = await loadSession();
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

	clearChecked(menuHash: string) {
		delete this.#s.shoppingChecks[menuHash];
		this.#persistNow();
	}

	/* ---- cooked log ---------------------------------------------------- */

	get cookedLog() {
		return this.#s.cookedLog;
	}

	hasCooked(slug: string) {
		return this.#s.cookedLog.some((e) => e.slug === slug);
	}

	markCooked(slug: string) {
		this.#s.cookedLog = [...this.#s.cookedLog, { slug, at: Date.now() }];
		this.#persistNow();
	}

	/** A mis-tap at the stove should be one more tap to undo. */
	toggleCooked(slug: string) {
		if (this.hasCooked(slug)) {
			this.#s.cookedLog = this.#s.cookedLog.filter((e) => e.slug !== slug);
			this.#persistNow();
		} else {
			this.markCooked(slug);
		}
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

	/* ---- import / export ----------------------------------------------- */

	snapshot(): SessionState {
		return $state.snapshot(this.#s) as SessionState;
	}

	replace(next: SessionState) {
		this.#s = next;
		this.#persist.flush();
	}

	merge(incoming: Partial<SessionState>) {
		this.#s = {
			...this.#s,
			...incoming,
			menu: [...new Set([...this.#s.menu, ...(incoming.menu ?? [])])],
			notes: { ...this.#s.notes, ...(incoming.notes ?? {}) },
			pantry: [...new Set([...this.#s.pantry, ...(incoming.pantry ?? [])])],
			familyRecipes: [
				...this.#s.familyRecipes,
				...(incoming.familyRecipes ?? []).filter(
					(r) => !this.#s.familyRecipes.some((e) => e.slug === r.slug)
				)
			]
		};
		this.#persist.flush();
	}
}

export const session = new SessionStore();

/** Family recipes carry the same shape as guide recipes, marked at the source. */
export function isFamily(r: RecipeSummary) {
	return r.source === 'family';
}
