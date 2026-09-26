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
}

export const levels = new LevelsStore();
