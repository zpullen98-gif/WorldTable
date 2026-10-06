/**
 * Back and history, the rules (docs/consolidation-design.md, 2.3 and 3.3).
 *
 * PURE: every function here takes what it reads as an argument, its Storage
 * included, so the rules are unit-tested under Node with a Map (the
 * desk-inbox.ts rule). The wiring that calls them lives in
 * stores/nav.svelte.ts and components/BackButton.svelte.
 *
 * The rule in one line: every screen change pushes one history entry, every
 * change within a screen replaces the current one, and Back calls
 * history.back() when this app pushed the current entry, otherwise it goes to
 * the screen's logical parent with a replace, so a cold deep link walks up the
 * tree one screen per press and the browser history never gains a loop.
 *
 * The depth of an entry is how many in-app pushes stand under it. An entry the
 * app did not push (a cold load, a link from the hub, a bookmark) is depth 0.
 * It is mirrored to sessionStorage under NAV_KEY with the address it belongs
 * to, so a reload of the same address keeps it and a reload of any other
 * address does not.
 */

/** The per-tab slot. sessionStorage only: never exported, never in a backup. */
export const NAV_KEY = 'oot-nav-table-v1';

/** The four levels' keys, as the URLs carry them. */
type Level = 1 | 2 | 3 | 4;

/** What a parent may be computed from. */
export interface ParentAsk {
	/** The base-stripped, bare path: '/menu', '/flashcards', '/recipe/x'. */
	path: string;
	/** location.search, with or without its '?'. */
	search?: string;
	/** location.hash, with or without its '#'. */
	hash?: string;
	/** The chosen level, for the screens whose parent is a level page. */
	chosen?: Level;
	/** The tab that opened the screen, when the address no longer says (/menu opened from More). */
	via?: string;
}

/** The /menu drawers More opens (#plan, #tools, #maitre): their screen is More's (design 2.1). */
export const MORE_DRAWERS = ['plan', 'tools', 'maitre'];

const LIBRARY_SHELVES = ['/recipes', '/family', '/lexicon', '/pantry', '/technique', '/plates', '/service', '/safety', '/palate', '/study'];
const MORE_ITEMS = ['/repertoire', '/coverage', '/menu/costing', '/menu/preps', '/menu/prep-board', '/menu/waste', '/menu/producers', '/menu/guest'];
const QUIZ_ITEMS = ['/menu/quiz', '/service/deck/test', '/service/deck/say', '/service/deck/lineup', '/service/drill', '/practise/firing', '/practise/calibrate'];

function params(search: string | undefined): URLSearchParams {
	return new URLSearchParams((search ?? '').replace(/^\?/, ''));
}

/**
 * The logical parent's href (base-stripped) for every screen in the screen
 * map (design 3.11), '/' for anything unknown. Never the screen itself:
 * nav.test.ts walks every +page.svelte and asserts it.
 */
export function parentOf(ask: ParentAsk): string {
	const path = ask.path.replace(/\/+$/, '') || '/';
	const q = params(ask.search);
	const hash = (ask.hash ?? '').replace(/^#/, '');
	const chosen = ask.chosen ?? 1;

	if (path === '/') return '/';

	// The four roots: their parent is Home.
	if (path === '/flashcards') {
		const deck = q.get('deck');
		if (!deck) return '/';
		// A run's parent is its deck screen; Due today and the misses have none.
		if (q.get('run') === '1' && deck !== 'due' && deck !== 'misses') return `/flashcards?deck=${encodeURIComponent(deck)}`;
		return '/flashcards';
	}
	if (path === '/quizzes') return q.get('quick') === '1' ? '/quizzes' : '/';
	if (path === '/library' || path === '/more') return '/';

	// Home's own screens.
	if (path === '/level') return '/';
	if (/^\/level\/[1-4]$/.test(path)) return '/';
	if (/^\/level\/[1-4]\/read$/.test(path)) return '/library';
	if (/^\/level\/[1-4]\/test$/.test(path)) return '/quizzes';
	// Cook at home: a dish's way back is its own level page, named in the
	// address (the dish page cannot know a slug's level before its data
	// loads); the course overview, and an address with no level, go to the
	// chosen one.
	if (path === '/kitchen') {
		const lv = q.get('level') ?? '';
		return `/level/${/^[1-4]$/.test(lv) ? lv : chosen}`;
	}
	if (path === '/menu') {
		// A card opened from the Producers view goes back to the view; one open on the study view, or the editing page pushed over it, to the study view.
		if (/^(dish-)?d-/.test(hash) && q.get('view') === 'producers') return '/menu?view=producers';
		if (/^(dish-)?d-/.test(hash) || hash === 'edit') return '/menu';
		// A drawer More opened: back to More, while the hash says so and after it is cleared.
		if (MORE_DRAWERS.includes(hash) || ask.via === 'more') return '/more';
		return `/level/${chosen}`;
	}
	// The Lexicon quiz is a Quizzes row: its way back is Quizzes, not the shelf.
	if (path === '/lexicon' && q.get('start') === 'quiz') return '/quizzes';

	// The More screens, then the quizzes (the /menu/quiz cards go to Flashcards).
	if (MORE_ITEMS.includes(path)) return '/more';
	if (path === '/menu/quiz') return q.get('mode') === 'cards' ? '/flashcards' : '/quizzes';
	if (QUIZ_ITEMS.includes(path)) return '/quizzes';
	if (path === '/service/deck' || path === '/service/deck/study') return '/flashcards';

	// The Library's shelves and what they hold.
	if (path.startsWith('/recipe/') || path.startsWith('/chapter/')) return '/recipes';
	if (path.startsWith('/family/')) return '/family';
	if (path.startsWith('/technique/')) return '/technique';
	if (path.startsWith('/plates/')) return '/plates';
	if (path.startsWith('/service/')) return '/service';
	if (LIBRARY_SHELVES.includes(path)) return '/library';

	return '/';
}

/**
 * Where an old flash-card address lands on the one card screen (design 3.7):
 * /menu/quiz?mode=cards with its scope (item=, section=, deck=weak or
 * deck=parts, and the study view's meal=), as a Flashcards run of the
 * matching deck.
 */
export function cardsTarget(search: string): string {
	const q = params(search);
	const item = (q.get('item') ?? '').trim();
	const section = (q.get('section') ?? '').trim();
	const deck = q.get('deck');
	const meal = (q.get('meal') ?? '').trim();
	let id = 'menu';
	if (deck === 'parts') id = 'menu-parts';
	else if (item) id = `item:${item}`;
	else if (deck === 'weak') id = 'menu-weak';
	else if (section) id = `menu:${section}`;
	/* The study view's meal rides along (CLAUDE.md, "Study menus"): Dinner
	   never deals a breakfast dish. */
	return `/flashcards?deck=${encodeURIComponent(id)}&run=1${meal ? `&meal=${encodeURIComponent(meal)}` : ''}`;
}

/**
 * Where the Lexicon's old flash cards land (/lexicon?start=flash): the level's
 * terms when ?level= names one, else the whole Lexicon, as a Flashcards run.
 */
export function lexiconCardsTarget(level: number | null): string {
	return `/flashcards?deck=${level ? 'lexicon' : 'lexicon-all'}&run=1`;
}

/* ---- the depth ---------------------------------------------------------- */

export type NavEvent =
	/** A cold load or a reload: the stored depth when it was this address's, else 0. */
	| { kind: 'enter'; stored: number | null }
	/** A link or a goto that pushed. */
	| { kind: 'push' }
	/** A goto that replaced, or a replaceState. */
	| { kind: 'replace' }
	/** The browser moved through the history by `delta` entries (negative is back). */
	| { kind: 'pop'; delta: number }
	/** A shallow pushState over the current page. */
	| { kind: 'shallowPush' }
	/** A pop between shallow entries of one page: the entry's own depth, or the page's base. */
	| { kind: 'shallowPop'; to: number | null; base: number };

const clamp = (n: number) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

/** The depth after an event, from the depth before it. Never below 0. */
export function depthAfter(prev: number, event: NavEvent): number {
	switch (event.kind) {
		case 'enter':
			return clamp(event.stored ?? 0);
		case 'push':
		case 'shallowPush':
			return clamp(prev) + 1;
		case 'replace':
			return clamp(prev);
		case 'pop':
			return clamp(clamp(prev) + event.delta);
		case 'shallowPop':
			return clamp(event.to ?? event.base);
	}
}

/** The stored record: the depth, the address it belongs to, the page's own depth under any shallow entry, and the address of the entry beneath when known. */
export interface NavRecord {
	d: number;
	href: string;
	base: number;
	below: string;
}

/**
 * Whether a cold start may take the stored depth back: only a reload or a
 * return through the history (the entries under it are still there). A fresh
 * arrival at an address the app recorded last (a link from the hub, a typed
 * address, a bookmark) stands on nothing this app pushed, so it is depth 0.
 * The type is PerformanceNavigationTiming.type.
 */
export function restoresDepth(type: string | null | undefined): boolean {
	return type === 'reload' || type === 'back_forward';
}

/**
 * Whether a navigation the router calls a push added a history entry. A link
 * to the address already showing is a replace in the router (and in every
 * browser), so it must not count: the next Back would leave the app.
 */
export function historyGrew(type: string, to: string | null | undefined, before: string | null | undefined): boolean {
	if (type === 'link' && !!to && to === before) return false;
	return true;
}

/**
 * Where a run that cannot be drawn again (a reload) falls: back one entry
 * when the entry beneath is already its parent, so the next Back does not
 * show the same screen twice, else a replace with the parent. Absolute hrefs.
 */
export function fallBackStep(depth: number, below: string, parent: string): 'back' | 'replace' {
	return depth > 0 && !!below && below === parent ? 'back' : 'replace';
}

/** The smallest part of Storage these functions use. */
export interface NavStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

/** The stored record when it belongs to this address, else null. A reload of another address starts at 0. */
export function readDepth(storage: NavStorage | null | undefined, href: string): NavRecord | null {
	if (!storage) return null;
	try {
		const raw = storage.getItem(NAV_KEY);
		if (!raw) return null;
		const rec = JSON.parse(raw) as Partial<NavRecord>;
		if (!rec || rec.href !== href) return null;
		return { d: clamp(Number(rec.d)), href, base: clamp(Number(rec.base ?? rec.d)), below: typeof rec.below === 'string' ? rec.below : '' };
	} catch {
		return null;
	}
}

/** Mirror the depth after a push, a replace or a pop. A write that cannot happen is dropped. */
export function writeDepth(storage: NavStorage | null | undefined, d: number, href: string, base: number = d, below = ''): void {
	if (!storage) return;
	try {
		storage.setItem(NAV_KEY, JSON.stringify({ d: clamp(d), href, base: clamp(base), below }));
	} catch {
		/* a convenience: without it a reload starts at depth 0 */
	}
}

/* ---- another room ------------------------------------------------------- */

/** The three rooms on the shared origin, by the path they are served under. */
export const ROOMS: ReadonlyArray<{ prefix: string; name: string }> = [
	{ prefix: '/table/', name: 'The World Table' },
	{ prefix: '/ledger/', name: "The Bartender's Ledger" },
	{ prefix: '/codex/', name: "The Sommelier's Codex" }
];

/**
 * The other room a visitor arrived from, by the referrer, or ''. Only on the
 * same origin, only another room (never this one), and only at depth 0: the
 * back row then says what the phone's gesture will do (design 2.2).
 */
export function cameFrom(referrer: string, origin: string, ownPrefix: string): string {
	if (!referrer || !ownPrefix) return '';
	let url: URL;
	try {
		url = new URL(referrer);
	} catch {
		return '';
	}
	if (url.origin !== origin) return '';
	const room = ROOMS.find((r) => url.pathname.startsWith(r.prefix) || url.pathname === r.prefix.slice(0, -1));
	if (!room || room.prefix === ownPrefix) return '';
	return room.name;
}
