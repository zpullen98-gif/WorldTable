/**
 * Due today, live: the one count the Flashcards tab's pill, the level page's
 * `Due today` row and the Flashcards root's Due today block all read
 * (docs/consolidation-design.md 2.6 and 6.2). The rule is lib/today.ts, pure;
 * this only gathers its inputs in the browser and re-derives on every change.
 *
 * The house drill slot is localStorage, so a page that grades a card calls
 * `refresh()` to have it read again. The deck's index (small, precached) is
 * loaded on the first ask, never in the prerender pass.
 */
import { browser } from '$app/environment';
import { loadDeckIndex } from '../data';
import { readDrilled, type DrilledEntry } from '../house-drilled';
import { itemCards, latestVerdicts } from '../study';
import { dueToday, type Today } from '../today';
import { house } from './house.svelte';
import { levels } from './levels.svelte';
import { session } from './session.svelte';
import type { DeckIndex, DeckLevel } from '../types';

class TodayStore {
	#index = $state<DeckIndex | null>(null);
	#drilled = $state<DrilledEntry[]>([]);
	#loading = false;
	#houseSettled = $state(false);

	/** Load what the count needs. Idempotent; a no-op on the server. */
	load() {
		if (!browser || this.#loading) return;
		this.#loading = true;
		this.#drilled = readDrilled();
		void levels.load();
		void loadDeckIndex().then(
			(i) => (this.#index = i),
			() => {
				/* the count stands on the house and the Lexicon alone */
			}
		);
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

	/** True once the inputs are in: the record, the levels and the index. */
	get ready(): boolean {
		return levels.ready && this.#index !== null && this.#houseSettled;
	}

	/** Due today at a level (the chosen one when none is named). Null until ready. */
	at(level?: DeckLevel): Today | null {
		if (!this.ready || !levels.data) return null;
		const n = level ?? levels.chosen;
		const current = house.current;
		const houseIds = current ? itemCards(current, 'dish', { all: true }).map((c) => c.itemId) : [];
		const latest = current ? latestVerdicts(current.id, this.#drilled) : new Map();
		return dueToday({
			now: Date.now(),
			level: n,
			levelName: levels.data.levels.find((l) => l.level === n)?.name ?? '',
			houseIds,
			latest,
			deck: this.#index,
			drillLog: session.drillLog,
			lexiconAt: levels.data.items.lexicon[String(n)] ?? []
		});
	}
}

export const today = new TodayStore();
