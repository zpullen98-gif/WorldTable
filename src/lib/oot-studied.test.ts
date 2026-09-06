import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { markStudied } from './oot-studied';

/**
 * Contract A: "studied" has one definition across the product, and this
 * wing reaches it through ONE helper from every site that completes a round
 * or a dish. The helper is exercised against a stub window.OOT; the sites are
 * held to calling it by reading their source, because runes modules and
 * pages are not reachable from vitest.
 */
type G = { window?: unknown };

afterEach(() => {
	delete (globalThis as G).window;
});

describe('markStudied', () => {
	it('is a no-op standalone: no window, no OOT, no profiles', () => {
		expect(markStudied()).toBe(false);
		(globalThis as G).window = {};
		expect(markStudied()).toBe(false);
		(globalThis as G).window = { OOT: {} };
		expect(markStudied()).toBe(false);
	});

	it('calls markStudied() and touch() on the roster, in that order', () => {
		const calls: string[] = [];
		(globalThis as G).window = {
			OOT: {
				profiles: {
					markStudied: () => void calls.push('markStudied'),
					touch: () => void calls.push('touch')
				}
			}
		};
		expect(markStudied()).toBe(true);
		expect(calls).toEqual(['markStudied', 'touch']);
	});

	it('swallows a throwing roster: the round still counted in the session', () => {
		(globalThis as G).window = {
			OOT: {
				profiles: {
					markStudied: () => {
						throw new Error('private mode');
					},
					touch: () => {}
				}
			}
		};
		expect(markStudied()).toBe(false);
	});
});

describe('every round-complete site goes through the helper', () => {
	const SITES = [
		'src/routes/lexicon/+page.svelte',
		'src/routes/menu/quiz/+page.svelte',
		'src/routes/practise/firing/+page.svelte',
		'src/routes/service/drill/+page.svelte',
		'src/lib/stores/session.svelte.ts'
	];

	it.each(SITES)('%s imports and calls markStudied()', (file) => {
		const src = readFileSync(file, 'utf8');
		expect(src).toMatch(/import \{ markStudied \} from '(\$lib|\.\.)\/oot-studied'/);
		expect(src).toMatch(/\bmarkStudied\(\);/);
		// No site reaches the roster directly any more: one definition, one door.
		expect(src).not.toMatch(/profiles\??\.markStudied\(/);
	});

	it('markCooked is the one store site, and it marks after the write', () => {
		const src = readFileSync('src/lib/stores/session.svelte.ts', 'utf8');
		const at = src.indexOf('markCooked(slug: string');
		const body = src.slice(at, src.indexOf('\n\t}\n', at));
		expect(body).toContain('this.#persistNow();');
		expect(body.indexOf('this.#persistNow();')).toBeLessThan(body.indexOf('markStudied();'));
		// Opening an app is not studying: hydrate() must not mark.
		const hydrate = src.slice(src.indexOf('async hydrate()'), src.indexOf('flush() {'));
		expect(hydrate).not.toContain('markStudied');
	});
});
