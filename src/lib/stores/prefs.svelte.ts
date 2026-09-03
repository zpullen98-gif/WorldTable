/**
 * Preferences: the only thing kept in localStorage.
 *
 * Everything else (menu, notes, pantry, family recipes) lives in IndexedDB via
 * the stores alongside this one. These four live here for one reason: they must
 * be readable *synchronously*, before first paint, or the page flashes the wrong
 * service on every cold load. See the inline script in src/app.html, which reads
 * this exact key.
 */
import { browser } from '$app/environment';
import { DEFAULTS, sanitizePrefs } from '../prefs-schema';
import type { Prefs, Service, Units, Hemisphere } from '../prefs-schema';

export type { Service, Units, Hemisphere };

const KEY = 'wt.prefs.v1';

/*
 * The shape and the checks live in prefs-schema.ts, a pure module, so vitest can
 * reach them. This read used to end on `{ ...DEFAULTS, ...parsed }` - a spread,
 * not a check - and localStorage is the one store a person can edit from a
 * console. See that module for how the two readers of this key disagreed.
 */
function read(): Prefs {
	if (!browser) return { ...DEFAULTS };
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return { ...DEFAULTS };
		return sanitizePrefs(JSON.parse(raw));
	} catch {
		return { ...DEFAULTS };
	}
}

class PrefsStore {
	#state = $state<Prefs>(read());

	get service() {
		return this.#state.service;
	}
	get units() {
		return this.#state.units;
	}
	get hemisphere() {
		return this.#state.hemisphere;
	}

	/** The service actually in effect, resolving `null` against the OS setting. */
	get resolvedService(): Service {
		if (this.#state.service) return this.#state.service;
		if (!browser) return 'night';
		return window.matchMedia('(prefers-color-scheme: light)').matches ? 'day' : 'night';
	}

	setService(s: Service) {
		this.#state.service = s;
		if (browser) document.documentElement.dataset.service = s;
		this.#persist();
	}

	toggleService() {
		this.setService(this.resolvedService === 'night' ? 'day' : 'night');
	}

	setUnits(u: Units) {
		this.#state.units = u;
		this.#persist();
	}

	setHemisphere(h: Hemisphere) {
		this.#state.hemisphere = h;
		this.#persist();
	}

	#persist() {
		if (!browser) return;
		try {
			localStorage.setItem(KEY, JSON.stringify(this.#state));
		} catch {
			/* private mode / quota: preferences are not worth breaking a render for */
		}
	}
}

export const prefs = new PrefsStore();
