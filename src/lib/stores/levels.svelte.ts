/**
 * The four levels, as the home and the level pages read them.
 *
 * The data (levels.json, small and precached) and the one join the engine
 * cannot read out of it (which recipes each technique is exercised by, from
 * techniques.json, precached too) are loaded once, on the first ask, and
 * held. Everything else is DERIVED from the session's logs every time it is
 * read, never stored: which level a reader is on is a fact about the logs,
 * and a stored copy would be one more thing to fall out of step with them.
 *
 * `ready` is false until both files are in AND the session has hydrated;
 * a home that painted `Untouched` on every card before the record arrived
 * would tell a ten-year cook they had never touched a thing, for a second,
 * on every open.
 */
import { loadLevels, loadTechniques } from '../data';
import { session } from './session.svelte';
import { allLevels, firstUnmetLevel, type Joins, type LevelProgress, type Logs } from '../levels';
import type { DeckLevel, LevelsData } from '../types';

class LevelsStore {
	#data = $state<LevelsData | null>(null);
	#joins = $state<Joins | null>(null);
	#labels = new Map<string, string>();
	#loading: Promise<void> | null = null;

	/** Idempotent: the first caller loads, every later one awaits the same promise. */
	load(): Promise<void> {
		if (this.#data && this.#joins) return Promise.resolve();
		if (!this.#loading) {
			this.#loading = Promise.all([loadLevels(), loadTechniques()]).then(([data, techniques]) => {
				this.#labels = new Map(techniques.map((t) => [t.slug, t.label]));
				this.#joins = { techniqueRecipes: new Map(techniques.map((t) => [t.slug, t.recipes])) };
				this.#data = data;
			});
		}
		return this.#loading;
	}

	get data(): LevelsData | null {
		return this.#data;
	}

	/** A technique's label, from the same file the join came from. */
	techniqueLabel(slug: string): string {
		return this.#labels.get(slug) ?? slug;
	}

	get ready(): boolean {
		return this.#data !== null && this.#joins !== null && session.ready;
	}

	get logs(): Logs {
		return { cooked: session.cookedLog, drill: session.drillLog, calibration: session.calibrationLog };
	}

	/** All four levels' progress, derived from the logs on every read. Empty
	 *  until ready, so a caller paints nothing rather than the wrong thing. */
	get progress(): LevelProgress[] {
		if (!this.#data || !this.#joins || !session.ready) return [];
		return allLevels(this.#data, this.logs, this.#joins);
	}

	/** The lowest level not yet met. 1 until ready. */
	get current(): DeckLevel {
		const rows = this.progress;
		return rows.length ? firstUnmetLevel(rows) : 1;
	}

	/* ---- the chosen level (docs/consolidation-design.md, 2.4 and 3.4) ------
	 * What the reader is studying: the last level they opened or chose, else
	 * the lowest not yet met. One slot per device, `oot-level-table-v1`, the
	 * integer key 1 to 4; not in oot-profiles.js BASES, never exported, and
	 * read nowhere before the browser has mounted (no localStorage in the
	 * prerender pass), so it is read lazily on the first ask in the browser. */
	/* The stored value is a PLAIN field, read lazily: `chosen` is read inside
	   $derived values (the Flashcards pill, the home's cards), and writing
	   $state there is an unsafe mutation Svelte refuses, which once left the
	   slot unread and the parent of My restaurant on the wrong level. A $state
	   tick, moved only by choose(), is what makes a choice re-derive. */
	#chosen: DeckLevel | null = null;
	#chosenRead = false;
	#chosenTick = $state(0);

	#readChosen() {
		if (this.#chosenRead || typeof window === 'undefined') return;
		this.#chosenRead = true;
		try {
			const n = Number(localStorage.getItem(CHOSEN_KEY));
			if (n >= 1 && n <= 4) this.#chosen = n as DeckLevel;
		} catch {
			/* a convenience: the lowest unmet level stands in */
		}
	}

	/** True once a level has been chosen on this device. */
	get hasChosen(): boolean {
		void this.#chosenTick;
		this.#readChosen();
		return this.#chosen !== null;
	}

	/** The chosen level, else the lowest not yet met. */
	get chosen(): DeckLevel {
		void this.#chosenTick;
		this.#readChosen();
		return this.#chosen ?? this.current;
	}

	/** Choose a level: opening any level page does, and so does the scope chip. */
	choose(n: DeckLevel) {
		this.#chosenRead = true;
		this.#chosen = n;
		this.#chosenTick += 1;
		try {
			localStorage.setItem(CHOSEN_KEY, String(n));
		} catch {
			/* kept for this visit only */
		}
	}
}

/** The chosen level's per-device slot. */
export const CHOSEN_KEY = 'oot-level-table-v1';

export const levels = new LevelsStore();
