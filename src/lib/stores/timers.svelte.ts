/**
 * Kitchen timers: several at once, and none of them lying to you.
 *
 * A real braise runs three clocks: the pot, the rice, the thing resting. Cook
 * mode used to offer exactly one, only while it was open, and it counted
 * setInterval callbacks rather than reading a clock, so a backgrounded phone
 * (iOS suspends JS outright) lost real minutes and never rang.
 *
 * Two rules follow from that, and everything here is built on them:
 *
 *   1. A timer IS a deadline. `endsAt` is the truth; the number on screen is
 *      derived from Date.now() every tick. Throttle the tab, sleep the phone,
 *      block the main thread — the arithmetic does not care.
 *   2. A timer outlives the screen that started it. It survives closing cook
 *      mode, navigating away, and a reload, because none of those things
 *      take the pot off the heat.
 *
 * localStorage, not IndexedDB: this must be readable synchronously on load so a
 * running timer is on screen at first paint rather than a frame later. It is a
 * few hundred bytes. The same reasoning as prefs.svelte.ts.
 */
import { browser } from '$app/environment';

const KEY = 'wt.timers.v1';
const VERSION = 1;

export interface KitchenTimer {
	id: string;
	/** What is on the heat: shown in the bar, and spoken by the alarm text. */
	label: string;
	/** Wall-clock deadline. Null while paused. */
	endsAt: number | null;
	/** Seconds left, authoritative only while paused. */
	paused: number | null;
	/** Has it already rung? Kept so the bar can show a finished timer to dismiss. */
	rang: boolean;
	/** Where it came from, so cook mode can find its own step's timer again. */
	recipeSlug?: string;
	stepIndex?: number;
}

interface Persisted {
	schemaVersion: number;
	timers: KitchenTimer[];
}

function read(): KitchenTimer[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as Persisted;
		if (typeof parsed?.schemaVersion === 'number' && parsed.schemaVersion > VERSION) return [];
		const list = Array.isArray(parsed?.timers) ? parsed.timers : [];
		// A timer whose deadline passed while the tab was closed has rung: we
		// just were not there to hear it. Surface it rather than dropping it, so
		// "is the rice done?" has an answer after a reload.
		const now = Date.now();
		return list
			.filter((t) => t && typeof t.id === 'string')
			.map((t) => (t.endsAt != null && t.endsAt <= now ? { ...t, endsAt: null, rang: true } : t));
	} catch {
		return [];
	}
}

/* ---- the alarm ---------------------------------------------------------
 * Web Audio rather than an <audio> element: no asset to ship, no network, and
 * it works from a service-worker-cached page with nothing else loaded.
 *
 * Browsers refuse to start an AudioContext without a user gesture, so the
 * context is created lazily on the first START, which is itself a tap. That
 * is also why the alarm cannot be "helpfully" pre-armed on page load: it would
 * be created suspended and never ring.
 */
let ctx: AudioContext | null = null;

function ensureAudio() {
	if (!browser || ctx) return;
	try {
		const Ctor = window.AudioContext ?? (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		if (Ctor) ctx = new Ctor();
	} catch {
		ctx = null;
	}
}

function ring() {
	if (!ctx) return;
	try {
		void ctx.resume();
		const now = ctx.currentTime;
		// Three rising blips: carries across a noisy kitchen without being a
		// klaxon, and is distinct from a phone notification.
		for (let n = 0; n < 3; n++) {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.value = 880 + n * 110;
			const t = now + n * 0.28;
			gain.gain.setValueAtTime(0.0001, t);
			gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
			osc.connect(gain).connect(ctx.destination);
			osc.start(t);
			osc.stop(t + 0.26);
		}
	} catch {
		/* audio is a courtesy, never a dependency: the bar still shows the alarm */
	}
}

class TimerStore {
	#timers = $state<KitchenTimer[]>(read());
	/** Ticks so `remaining()` recomputes; the deadline is what is authoritative. */
	#now = $state(Date.now());
	#ticker: ReturnType<typeof setInterval> | undefined;

	constructor() {
		if (!browser) return;
		// Resync the instant the tab is visible again, so a phone that slept shows
		// the truth, including an alarm that fired while it was away.
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible') this.#tick();
		});

		/**
		 * Arm the audio on the first touch of the page, whatever it is.
		 *
		 * Autoplay policy means an AudioContext created without a gesture starts
		 * suspended and never makes a sound. Starting a timer is a gesture and
		 * arms it, but a timer RESTORED from a reload has had no gesture, so a
		 * braise resumed after a refresh would have rung silently. Any tap or key
		 * counts, so in practice the alarm is armed long before it is needed.
		 */
		const arm = () => ensureAudio();
		document.addEventListener('pointerdown', arm, { once: true, passive: true });
		document.addEventListener('keydown', arm, { once: true });

		if (this.#timers.some((t) => t.endsAt != null)) this.#start();
	}

	get all() {
		return this.#timers;
	}
	get active() {
		return this.#timers.filter((t) => t.endsAt != null || t.rang);
	}
	get anyRinging() {
		return this.#timers.some((t) => t.rang);
	}

	/** Seconds left on a timer, derived, never stored, never decremented. */
	remaining(t: KitchenTimer): number {
		if (t.paused != null) return t.paused;
		if (t.endsAt == null) return 0;
		void this.#now; // subscribe to the tick
		return Math.max(0, Math.ceil((t.endsAt - Date.now()) / 1000));
	}

	find(recipeSlug: string, stepIndex: number) {
		return this.#timers.find((t) => t.recipeSlug === recipeSlug && t.stepIndex === stepIndex);
	}

	start(opts: { label: string; seconds: number; recipeSlug?: string; stepIndex?: number }) {
		ensureAudio(); // we are inside a user gesture here, and only here
		const id = `${opts.recipeSlug ?? 'timer'}:${opts.stepIndex ?? 0}:${Date.now()}`;
		const existing =
			opts.recipeSlug !== undefined && opts.stepIndex !== undefined
				? this.find(opts.recipeSlug, opts.stepIndex)
				: undefined;
		const timer: KitchenTimer = {
			id: existing?.id ?? id,
			label: opts.label,
			endsAt: Date.now() + opts.seconds * 1000,
			paused: null,
			rang: false,
			recipeSlug: opts.recipeSlug,
			stepIndex: opts.stepIndex
		};
		this.#timers = existing
			? this.#timers.map((t) => (t.id === existing.id ? timer : t))
			: [...this.#timers, timer];
		this.#start();
		this.#persist();
		return timer.id;
	}

	/**
	 * Rename a running timer.
	 *
	 * Labels were auto-generated "{dish} - step N" and could not be changed, so
	 * three clocks on the bar were unreadable from two metres in steam. The bar
	 * is read at a distance, by somebody holding a pan.
	 *
	 * Trimmed and capped, because the bar is a fixed width and a label that
	 * wraps to three lines pushes the clock off the edge, the one thing on the
	 * row that has to stay readable.
	 */
	rename(id: string, label: string) {
		const clean = label.trim().slice(0, 24);
		if (!clean) return;
		this.#timers = this.#timers.map((t) => (t.id === id ? { ...t, label: clean } : t));
		this.#persist();
	}

	pause(id: string) {
		this.#timers = this.#timers.map((t) =>
			t.id === id && t.endsAt != null
				? { ...t, paused: Math.max(0, Math.ceil((t.endsAt - Date.now()) / 1000)), endsAt: null }
				: t
		);
		this.#persist();
	}

	resume(id: string) {
		ensureAudio();
		this.#timers = this.#timers.map((t) =>
			t.id === id && t.paused != null
				? { ...t, endsAt: Date.now() + t.paused * 1000, paused: null, rang: false }
				: t
		);
		this.#start();
		this.#persist();
	}

	dismiss(id: string) {
		this.#timers = this.#timers.filter((t) => t.id !== id);
		if (!this.#timers.some((t) => t.endsAt != null)) this.#stop();
		this.#persist();
	}

	dismissAll() {
		this.#timers = [];
		this.#stop();
		this.#persist();
	}

	#start() {
		if (this.#ticker || !browser) return;
		// 250ms so the visible second turns over promptly. Correctness comes from
		// the deadline, so this rate is only about smoothness.
		this.#ticker = setInterval(() => this.#tick(), 250);
	}

	#stop() {
		if (this.#ticker) clearInterval(this.#ticker);
		this.#ticker = undefined;
	}

	#tick() {
		this.#now = Date.now();
		let rangNow = false;
		this.#timers = this.#timers.map((t) => {
			if (t.endsAt != null && t.endsAt <= this.#now) {
				rangNow = true;
				return { ...t, endsAt: null, rang: true };
			}
			return t;
		});
		if (rangNow) {
			ring();
			this.#persist();
		}
		if (!this.#timers.some((t) => t.endsAt != null)) this.#stop();
	}

	#persist() {
		if (!browser) return;
		try {
			const payload: Persisted = { schemaVersion: VERSION, timers: this.#timers };
			localStorage.setItem(KEY, JSON.stringify(payload));
		} catch {
			/* private mode / quota: a timer is not worth breaking a render for */
		}
	}
}

export const timers = new TimerStore();

/** m:ss, the only format a cook wants to read at a glance. */
export function formatClock(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
}
