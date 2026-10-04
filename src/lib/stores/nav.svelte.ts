/**
 * The in-app depth, wired (docs/consolidation-design.md, 2.3 and 3.3).
 *
 * The rules are $lib/nav.ts, pure and tested; this module only feeds them the
 * router's events and keeps the answer. SvelteKit owns history.state, so the
 * depth of a full entry lives here and in sessionStorage (`oot-nav-table-v1`),
 * and the depth of a shallow entry rides in its own page state as `ootd`
 * (with the page's base depth as `ootb`), where SvelteKit restores it on every
 * back navigation into the page.
 *
 *   install()        the layout calls it once, during its own initialisation
 *   navReplace()     call before any goto(..., { replaceState: true })
 *   pushShallow()    a screen change inside one page (a deck, a run, a card)
 *   replaceShallow() a change within a screen (the next card, an answer)
 *   fallTo()         a run with nothing to draw on a reload, to its parent
 *   back()           what the Back control does
 */
import { browser } from '$app/environment';
import { afterNavigate, beforeNavigate, goto, pushState, replaceState } from '$app/navigation';
import { base as basePath } from '$app/paths';
import { navigating, page } from '$app/state';
import { onMount, tick } from 'svelte';
import { cameFrom, depthAfter, fallBackStep, historyGrew, parentOf, readDepth, restoresDepth, writeDepth } from '../nav';
import { bareHtmlPath } from '../htmlPath';

type Level = 1 | 2 | 3 | 4;

/** What a page may put in a shallow entry; ootd and ootb are added here. */
export type ShallowState = App.PageState;

function store(): Storage | null {
	try {
		return browser ? sessionStorage : null;
	} catch {
		return null;
	}
}

/** How this document was opened: 'navigate', 'reload' or 'back_forward' (PerformanceNavigationTiming). */
function arrivalType(): string {
	try {
		const e = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
		return e?.type ?? 'navigate';
	} catch {
		return 'navigate';
	}
}

function chosenLevel(): Level {
	try {
		const n = Number(localStorage.getItem('oot-level-table-v1'));
		return n >= 1 && n <= 4 ? (n as Level) : 1;
	} catch {
		return 1;
	}
}

class NavStore {
	/** The in-app depth of the entry on screen. 0: this app did not push it. */
	depth = $state(0);
	/** The depth of the page's own (non-shallow) entry, for a pop to it. */
	base = $state(0);
	/** The other room this visit arrived from, while nothing has been pushed. */
	from = $state('');
	/** A page's own way back at depth 0 (a card opened by a cold hash). True when it handled the press. */
	override: (() => boolean) | null = null;
	/** A fallback level for the screens whose parent is a level page, set by the levels store. */
	fallbackLevel: Level = 1;

	#replacing = false;
	/** The address on show when a navigation began, to tell a push from a same-address replace. */
	#before = '';
	/** The address of the entry beneath this one, when this app pushed it; '' when not known. */
	#below = '';
	#popFrom: number | null = null;
	#seq = 0;
	#installed = false;

	#save() {
		writeDepth(store(), this.depth, location.href, this.base, this.#below);
	}

	/** The layout calls this once, during its initialisation. */
	install() {
		if (this.#installed) return;
		this.#installed = true;

		beforeNavigate(() => {
			this.#before = location.href;
		});

		afterNavigate((nav) => {
			this.#seq++;
			const st = (page.state ?? {}) as App.PageState;
			const own = typeof st.ootd === 'number' ? st.ootd : null;
			if (nav.type === 'enter') {
				/* Only a reload or a return through the history takes the stored
				   depth back; a fresh arrival at the same address stands on
				   nothing this app pushed (lib/nav.ts restoresDepth). */
				const rec = restoresDepth(arrivalType()) ? readDepth(store(), location.href) : null;
				this.depth = depthAfter(0, { kind: 'enter', stored: rec?.d ?? null });
				this.base = rec ? rec.base : this.depth;
				this.#below = rec ? rec.below : '';
				const prefix = `${basePath || ''}/`;
				this.from = this.depth === 0 && basePath ? cameFrom(document.referrer, location.origin, prefix) : '';
			} else if (nav.type === 'popstate') {
				const from = this.#popFrom ?? this.depth;
				this.depth = own ?? depthAfter(from, { kind: 'pop', delta: nav.delta ?? -1 });
				this.base = own !== null && typeof st.ootb === 'number' ? st.ootb : this.depth;
				this.#below = '';
				if (this.depth > 0) this.from = '';
			} else {
				/* A link to the address already on show is a replace in the router
				   and the browser: no entry was added, so none is counted, or the
				   next Back would leave the app (lib/nav.ts historyGrew). */
				const before = this.#before || nav.from?.url.href || '';
				const pushed = !this.#replacing && historyGrew(nav.type, nav.to?.url.href, before);
				this.depth = depthAfter(this.depth, { kind: pushed ? 'push' : 'replace' });
				this.base = this.depth;
				if (pushed) {
					this.from = '';
					this.#below = before;
				}
				/* Consumed here and only here: a page's own afterNavigate runs before
				   this one (SvelteKit adds them on mount, children first), so a
				   forwarder may ask for its replace during the very 'enter' this
				   callback is about to record. */
				this.#replacing = false;
			}
			this.#popFrom = null;
			this.#before = '';
			this.#save();
		});

		onMount(() => {
			/* A pop between shallow entries of one page runs no afterNavigate:
			   SvelteKit swaps page.state synchronously in its own listener (added
			   before this one), so the entry's ootd is readable a tick later. A
			   pop that is a real navigation is left to afterNavigate. */
			const onPop = () => {
				this.#popFrom = this.depth;
				const seq = this.#seq;
				setTimeout(() => {
					if (seq !== this.#seq || navigating.type) return;
					const st = (page.state ?? {}) as App.PageState;
					this.depth = depthAfter(this.depth, {
						kind: 'shallowPop',
						to: typeof st.ootd === 'number' ? st.ootd : null,
						base: this.base
					});
					this.#popFrom = null;
					this.#below = '';
					this.#save();
					const y = typeof st.ooty === 'number' ? st.ooty : null;
					if (y !== null) void tick().then(() => requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, y))));
				}, 0);
			};
			/* The bfcache keeps the page and none of the router's events: reread. */
			const onShow = (e: PageTransitionEvent) => {
				if (!e.persisted) return;
				const rec = readDepth(store(), location.href);
				if (rec) {
					this.depth = rec.d;
					this.base = rec.base;
					this.#below = rec.below;
				}
			};
			window.addEventListener('popstate', onPop);
			window.addEventListener('pageshow', onShow);
			return () => {
				window.removeEventListener('popstate', onPop);
				window.removeEventListener('pageshow', onShow);
			};
		});
	}

	/** Mark the next navigation as a replace, so the depth stays where it is. */
	navReplace() {
		this.#replacing = true;
	}

	/** A screen change inside one page: the leaving entry keeps its scroll, the new one its depth. */
	pushShallow(url: string, state: ShallowState) {
		const here = (page.state ?? {}) as App.PageState;
		try {
			replaceState(location.href, { ...here, ooty: window.scrollY });
		} catch {
			/* the router is not up yet; the push below still lands */
		}
		const d = this.depth + 1;
		const below = location.href;
		pushState(url, { ...state, ootd: d, ootb: this.base });
		this.depth = d;
		this.#below = below;
		this.from = '';
		this.#save();
	}

	/** A change within a screen: the entry keeps its depth. */
	replaceShallow(url: string, state: ShallowState) {
		replaceState(url, { ...state, ootd: this.depth, ootb: this.base });
		this.#save();
	}

	/**
	 * A screen that cannot be drawn again (a run or a round on a reload) falls
	 * to its parent: one entry back when the entry beneath is that parent, so
	 * the next Back does not show the same screen twice, else a replace.
	 */
	fallTo(url: string, state: ShallowState) {
		const parent = new URL(url, location.href).href;
		if (fallBackStep(this.depth, this.#below, parent) === 'back') {
			history.back();
			return;
		}
		this.replaceShallow(url, state);
	}

	/** The logical parent of the screen on show, base-stripped. */
	parent(chosen?: Level): string {
		const path = bareHtmlPath(location.pathname.slice(basePath.length) || '/');
		const via = ((page.state ?? {}) as App.PageState).via;
		return parentOf({ path, search: location.search, hash: location.hash, chosen: chosen ?? chosenLevel(), via });
	}

	/** What the Back control does: one entry back when this app pushed it, else up to the parent with a replace. */
	back(chosen?: Level) {
		if (this.depth > 0) {
			history.back();
			return;
		}
		if (this.override?.()) return;
		this.navReplace();
		void goto(`${basePath}${this.parent(chosen)}`, { replaceState: true });
	}
}

export const nav = new NavStore();

/**
 * Put the scroll back once a page's own data has drawn it at full height.
 * SvelteKit restores a full navigation's scroll after the render, which is
 * before a page that loads in onMount has its rows; a page's snapshot calls
 * this with the captured y and its own readiness, and the scroll lands two
 * frames after the page is ready (the study view's proven pattern). Gives up
 * after three seconds rather than jump a page somebody has started to use.
 */
export function restoreScroll(y: number, ready: () => boolean) {
	if (!browser || !y) return;
	const until = Date.now() + 3000;
	const go = () => {
		if (!ready() && Date.now() < until) {
			requestAnimationFrame(go);
			return;
		}
		void tick().then(() => requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, y))));
	};
	go();
}
