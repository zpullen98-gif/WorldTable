/**
 * Due today, live: the one count the Practise tab's pill, the level page's
 * `Due today` row and the Flashcards root's Due today block all read
 * (docs/consolidation-design.md 2.6 and 6.2). The rule is lib/today.ts, pure;
 * this only gathers its inputs in the browser and re-derives on every change.
 *
 * The house drill slot is localStorage, so a page that grades a card calls
 * `refresh()` to have it read again. The deck's index (small, precached) is
 * loaded on the first ask, never in the prerender pass, and so is Cuisine's
 * (stores/cuisine.svelte.ts): its cards due at the level and below join the
 * run after the due Lexicon terms. Cuisine's index failing to load is an
 * empty list, never a count held back.
 */
import { browser } from '$app/environment';
import { loadDeckIndex } from '../data';
import { readDrilled, type DrilledEntry } from '../house-drilled';
import { itemCards, latestVerdicts } from '../study';
import { dueToday, type Today } from '../today';
import { cuisine } from './cuisine.svelte';
import { house } from './house.svelte';
import { levels } from './levels.svelte';
import { session } from './session.svelte';
import type { DeckIndex, DeckLevel } from '../types';

class TodayStore {
	#index = $state<DeckIndex | null>(null);
	#indexSettled = $state(false);
	#indexFailed = $state(false);
	#drilled = $state<DrilledEntry[]>([]);
	#loading = false;
	#houseSettled = $state(false);
	#cuisineSettled = $state(false);

	/** Load what the count needs. Idempotent; a no-op on the server. */
	load() {
		if (!browser || this.#loading) return;
		this.#loading = true;
		this.#drilled = readDrilled();
		void levels.load();
		void loadDeckIndex().then(
			(i) => { this.#index = i; this.#indexFailed = false; },
			() => {
				this.#indexFailed = true;
			}
		).finally(() => (this.#indexSettled = true));
		/* Cuisine's index resolves null when it cannot be read: settled either
		   way, so the count waits for it once and never for ever. */
		void cuisine.load().finally(() => (this.#cuisineSettled = true));
		void this.#settleHouse();
	}

	/* The house is read, and the shipped pack's auto-load has had its turn, so
	   the first count on a fresh device already holds Brennan's. */
	async #settleHouse() {
		/* Ten seconds at most: a boot that never settles (no IndexedDB, a
		   blocked record) still lets the count stand on the level alone. */
		const limit = new Promise<void>((r) => setTimeout(r, 10_000));
		try {
			await Promise.race([house.booted.then(() => house.api?.ready()), limit]);
		} catch {
			/* a house that cannot be read counts as none */
		}
		this.#houseSettled = true;
	}

	/** True once the house is read and the pack's auto-load has settled. */
	get houseSettled(): boolean {
		return this.#houseSettled;
	}

	/** Read the house drill slot again, after a grade. */
	refresh() {
		if (browser) this.#drilled = readDrilled();
	}

	get drilled(): DrilledEntry[] {
		return this.#drilled;
	}

	/** True once the inputs are in: the record, the levels, the deck's index and Cuisine's (read or failed). */
	get ready(): boolean {
		return (levels.ready || (levels.failed && session.ready)) && this.#indexSettled && this.#houseSettled && this.#cuisineSettled;
	}

	/** A reduced queue stays usable, and says which material could not be counted. */
	get warning(): string {
		const missing = [this.#indexFailed ? 'the Floor Deck' : '', levels.failed ? 'your level materials' : '', cuisine.failed ? 'Cuisine' : ''].filter(Boolean);
		return missing.length ? `Some study material could not load: ${missing.join(', ')}. Today's cards include only available material. Your saved progress is unchanged.` : '';
	}

	retry() {
		this.#loading = false;
		this.load();
	}

	/** Due today at a level (the chosen one when none is named). Null until ready. */
	at(level?: DeckLevel): Today | null {
		if (!this.ready) return null;
		const n = level ?? levels.chosen;
		const current = house.current;
		const houseIds = current ? itemCards(current, 'dish', { all: true }).map((c) => c.itemId) : [];
		const latest = current ? latestVerdicts(current.id, this.#drilled) : new Map();
		const cuisineAt = (cuisine.index?.cards ?? []).filter((c) => c[2] <= n).map((c) => c[0]);
		return dueToday({
			now: Date.now(),
			level: n,
			levelName: levels.data?.levels.find((l) => l.level === n)?.name ?? 'your chosen level',
			houseIds,
			latest,
			deck: this.#index,
			drillLog: session.drillLog,
			lexiconAt: levels.data?.items.lexicon[String(n)] ?? [],
			cuisineAt
		});
	}
}

export const today = new TodayStore();
