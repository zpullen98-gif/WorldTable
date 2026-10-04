import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { NAV_KEY, cameFrom, depthAfter, fallBackStep, historyGrew, parentOf, readDepth, restoresDepth, writeDepth, type NavStorage } from './nav';

/**
 * The back rules (docs/consolidation-design.md, 2.3, 3.3 and 3.11). The
 * wiring is in stores/nav.svelte.ts; these are the decisions it makes.
 */

/** Every +page.svelte under src/routes, as a path with the first slug of each dynamic segment filled in. */
function routes(dir = 'src/routes', at = ''): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) {
			const seg = name.startsWith('[') ? (name === '[n]' ? '2' : 'x') : name;
			out.push(...routes(full, `${at}/${seg}`));
		} else if (name === '+page.svelte') out.push(at || '/');
	}
	return out;
}

class MapStorage implements NavStorage {
	m = new Map<string, string>();
	getItem(k: string) {
		return this.m.get(k) ?? null;
	}
	setItem(k: string, v: string) {
		this.m.set(k, v);
	}
}

describe('parentOf', () => {
	const all = routes();

	it('finds every route under src/routes', () => {
		expect(all.length).toBeGreaterThan(30);
		for (const want of ['/flashcards', '/quizzes', '/library', '/more', '/level/2', '/menu']) expect(all).toContain(want);
	});

	it('is total: every route has a parent other than itself, Home excepted', () => {
		for (const path of all) {
			const parent = parentOf({ path, chosen: 2 });
			if (path === '/') {
				expect(parent).toBe('/');
				continue;
			}
			expect(parent, path).not.toBe(path);
			expect(parent.startsWith('/'), path).toBe(true);
		}
	});

	it('walks every cold deep link up to Home in a few presses, never in a loop', () => {
		for (const path of all) {
			let at = path;
			let steps = 0;
			while (at !== '/' && steps < 6) {
				const [p, s] = at.split('?');
				at = parentOf({ path: p, search: s ? '?' + s : '', chosen: 3 });
				steps++;
			}
			expect(at, path).toBe('/');
		}
	});

	it('follows the screen map', () => {
		expect(parentOf({ path: '/level/3' })).toBe('/');
		expect(parentOf({ path: '/level/3/read' })).toBe('/library');
		expect(parentOf({ path: '/level/3/test' })).toBe('/quizzes');
		expect(parentOf({ path: '/menu', chosen: 2 })).toBe('/level/2');
		expect(parentOf({ path: '/menu', search: '?section=Starters', chosen: 4 })).toBe('/level/4');
		expect(parentOf({ path: '/menu', hash: '#d-abc' })).toBe('/menu');
		expect(parentOf({ path: '/menu', hash: '#edit' })).toBe('/menu');
		expect(parentOf({ path: '/menu/quiz', search: '?mode=cards' })).toBe('/flashcards');
		expect(parentOf({ path: '/menu/quiz', search: '?mode=drill' })).toBe('/quizzes');
		expect(parentOf({ path: '/menu/costing' })).toBe('/more');
		expect(parentOf({ path: '/repertoire' })).toBe('/more');
		expect(parentOf({ path: '/practise/firing' })).toBe('/quizzes');
		expect(parentOf({ path: '/service/deck' })).toBe('/flashcards');
		expect(parentOf({ path: '/service/deck/study' })).toBe('/flashcards');
		expect(parentOf({ path: '/service/deck/test' })).toBe('/quizzes');
		expect(parentOf({ path: '/service' })).toBe('/library');
		expect(parentOf({ path: '/service/knife-work' })).toBe('/service');
		expect(parentOf({ path: '/recipe/cacio-e-pepe' })).toBe('/recipes');
		expect(parentOf({ path: '/chapter/italian' })).toBe('/recipes');
		expect(parentOf({ path: '/recipes' })).toBe('/library');
		expect(parentOf({ path: '/family/x' })).toBe('/family');
		expect(parentOf({ path: '/technique/braising' })).toBe('/technique');
		expect(parentOf({ path: '/plates/beef-cuts' })).toBe('/plates');
		expect(parentOf({ path: '/flashcards' })).toBe('/');
		expect(parentOf({ path: '/flashcards', search: '?deck=menu' })).toBe('/flashcards');
		expect(parentOf({ path: '/flashcards', search: '?deck=menu&run=1' })).toBe('/flashcards?deck=menu');
		expect(parentOf({ path: '/flashcards', search: '?deck=due&run=1' })).toBe('/flashcards');
		expect(parentOf({ path: '/flashcards', search: '?deck=misses&run=1&h=d-1' })).toBe('/flashcards');
		expect(parentOf({ path: '/quizzes' })).toBe('/');
		expect(parentOf({ path: '/quizzes', search: '?quick=1' })).toBe('/quizzes');
		expect(parentOf({ path: '/library' })).toBe('/');
		expect(parentOf({ path: '/more' })).toBe('/');
		expect(parentOf({ path: '/nowhere/at/all' })).toBe('/');
	});

	it('sends a Quizzes row and a More drawer back to the tab that opened them', () => {
		expect(parentOf({ path: '/lexicon', search: '?start=quiz' })).toBe('/quizzes');
		expect(parentOf({ path: '/lexicon', search: '?level=2&start=quiz' })).toBe('/quizzes');
		expect(parentOf({ path: '/lexicon', search: '?level=2' })).toBe('/library');
		for (const h of ['#plan', '#tools', '#maitre']) expect(parentOf({ path: '/menu', hash: h, chosen: 2 }), h).toBe('/more');
		expect(parentOf({ path: '/menu', via: 'more', chosen: 2 })).toBe('/more');
		expect(parentOf({ path: '/menu', hash: '#house', chosen: 2 })).toBe('/level/2');
		expect(parentOf({ path: '/menu', hash: '#d-abc', via: 'more' })).toBe('/menu');
	});
});

describe('depthAfter', () => {
	it('starts a cold load at 0 and a reload at the stored depth', () => {
		expect(depthAfter(5, { kind: 'enter', stored: null })).toBe(0);
		expect(depthAfter(0, { kind: 'enter', stored: 3 })).toBe(3);
	});
	it('adds one per push, none per replace', () => {
		expect(depthAfter(2, { kind: 'push' })).toBe(3);
		expect(depthAfter(2, { kind: 'shallowPush' })).toBe(3);
		expect(depthAfter(2, { kind: 'replace' })).toBe(2);
	});
	it('moves by the delta on a pop and never goes below 0', () => {
		expect(depthAfter(4, { kind: 'pop', delta: -1 })).toBe(3);
		expect(depthAfter(4, { kind: 'pop', delta: -2 })).toBe(2);
		expect(depthAfter(1, { kind: 'pop', delta: -3 })).toBe(0);
		expect(depthAfter(1, { kind: 'pop', delta: 1 })).toBe(2);
	});
	it('reads a shallow entry its own depth, else the page base', () => {
		expect(depthAfter(4, { kind: 'shallowPop', to: 2, base: 1 })).toBe(2);
		expect(depthAfter(4, { kind: 'shallowPop', to: null, base: 1 })).toBe(1);
	});
});

describe('the stored depth', () => {
	it('keeps a reload of the same address and nothing else', () => {
		const s = new MapStorage();
		writeDepth(s, 3, 'http://x/flashcards?deck=menu', 1);
		expect(readDepth(s, 'http://x/flashcards?deck=menu')).toEqual({ d: 3, href: 'http://x/flashcards?deck=menu', base: 1, below: '' });
		expect(readDepth(s, 'http://x/flashcards')).toBeNull();
		expect(s.m.has(NAV_KEY)).toBe(true);
	});
	it('keeps the address of the entry beneath', () => {
		const s = new MapStorage();
		writeDepth(s, 2, 'http://x/flashcards?deck=menu&run=1', 0, 'http://x/flashcards?deck=menu');
		expect(readDepth(s, 'http://x/flashcards?deck=menu&run=1')?.below).toBe('http://x/flashcards?deck=menu');
		s.setItem(NAV_KEY, JSON.stringify({ d: 1, href: 'a', base: 1 }));
		expect(readDepth(s, 'a')?.below).toBe('');
	});
	it('is taken back only on a reload or a return through the history', () => {
		expect(restoresDepth('reload')).toBe(true);
		expect(restoresDepth('back_forward')).toBe(true);
		expect(restoresDepth('navigate')).toBe(false);
		expect(restoresDepth('prerender')).toBe(false);
		expect(restoresDepth(undefined)).toBe(false);
		expect(restoresDepth(null)).toBe(false);
	});
	it('reads nothing from a broken or absent slot', () => {
		const s = new MapStorage();
		expect(readDepth(s, 'a')).toBeNull();
		s.setItem(NAV_KEY, '{nope');
		expect(readDepth(s, 'a')).toBeNull();
		expect(readDepth(null, 'a')).toBeNull();
		expect(() => writeDepth(null, 1, 'a')).not.toThrow();
	});
});

describe('historyGrew', () => {
	it('counts no entry for a link to the address on show', () => {
		expect(historyGrew('link', 'http://x/flashcards', 'http://x/flashcards')).toBe(false);
		expect(historyGrew('link', 'http://x/', 'http://x/')).toBe(false);
	});
	it('counts a link elsewhere and every goto', () => {
		expect(historyGrew('link', 'http://x/flashcards', 'http://x/flashcards?deck=menu')).toBe(true);
		expect(historyGrew('goto', 'http://x/flashcards', 'http://x/flashcards')).toBe(true);
		expect(historyGrew('link', 'http://x/flashcards', '')).toBe(true);
	});
});

describe('fallBackStep', () => {
	const deck = 'http://x/flashcards?deck=menu';
	it('steps back when the entry beneath is the parent', () => {
		expect(fallBackStep(2, deck, deck)).toBe('back');
	});
	it('replaces at depth 0, with nothing known beneath, or another screen beneath', () => {
		expect(fallBackStep(0, deck, deck)).toBe('replace');
		expect(fallBackStep(2, '', deck)).toBe('replace');
		expect(fallBackStep(2, 'http://x/level/2', deck)).toBe('replace');
	});
});

describe('cameFrom', () => {
	const o = 'https://zpullen98-gif.github.io';
	it('names another room on the same origin', () => {
		expect(cameFrom(`${o}/codex/#wine=w-1`, o, '/table/')).toBe("The Sommelier's Codex");
		expect(cameFrom(`${o}/ledger/#/menu`, o, '/table/')).toBe("The Bartender's Ledger");
	});
	it('says nothing for this room, the hub, another origin or no referrer', () => {
		expect(cameFrom(`${o}/table/menu`, o, '/table/')).toBe('');
		expect(cameFrom(`${o}/`, o, '/table/')).toBe('');
		expect(cameFrom('https://example.com/codex/', o, '/table/')).toBe('');
		expect(cameFrom('', o, '/table/')).toBe('');
		expect(cameFrom(`${o}/codex/`, o, '')).toBe('');
	});
});
