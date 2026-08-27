import { describe, it, expect, afterEach, vi } from 'vitest';

/**
 * These run in vitest's node environment, where the browser flag is false and api()
 * would short-circuit before it ever looked at window.OOT — every assertion
 * below would pass for the wrong reason. Mocked to true so the tests exercise
 * the ABSENCE HANDLING rather than the SSR guard.
 */
vi.mock('$app/environment', () => ({ browser: true }));
import * as profiles from './profiles';

/**
 * The roster helper, and the three ways it can be absent.
 *
 * `window.OOT` is installed by the Outside Of Time shared layer and is simply
 * not there in the standalone build — static/shared/ here carries only
 * oot-home.css. Every function must return a WORKING ANSWER rather than
 * throwing, because the alternative is a wing that boots inside the monorepo
 * and dies on its own domain.
 *
 * The third case is the one that would actually happen: a hardened browser, or
 * a page-script sandbox, where touching `window.OOT` throws rather than
 * returning undefined.
 */
/**
 * There is no DOM here either, so window itself must exist before window.OOT
 * can be anything. Without this the try/catch in api() swallows a
 * ReferenceError and every assertion passes for the wrong reason.
 */
const w = globalThis as unknown as { OOT?: unknown; window?: unknown };
w.window = globalThis;

afterEach(() => {
	delete w.OOT;
});

describe('when the shared layer is absent', () => {
	it('reports no profiles rather than throwing', () => {
		expect(profiles.hasProfiles()).toBe(false);
		expect(profiles.list()).toEqual([]);
		expect(profiles.current()).toBeNull();
		expect(profiles.currentName()).toBeNull();
		expect(profiles.isManagerDevice()).toBe(false);
	});

	it('onChange is a no-op that still returns an unsubscribe', () => {
		const off = profiles.onChange(() => {
			throw new Error('must not be called');
		});
		expect(typeof off).toBe('function');
		expect(() => off()).not.toThrow();
	});

	it('path reads are false and path writes are harmless', () => {
		expect(profiles.pathDone('table', 'step-1')).toBe(false);
		expect(profiles.markPathStep('table', 'step-1')).toBe(false);
	});
});

describe('when window.OOT exists but carries no roster', () => {
	it('behaves exactly as if absent', () => {
		w.OOT = { log: {}, gate: {} };
		expect(profiles.hasProfiles()).toBe(false);
		expect(profiles.list()).toEqual([]);
		expect(profiles.current()).toBeNull();
	});
});

describe('when the roster itself throws', () => {
	/**
	 * A shared script that half-initialised is worse than one that is missing,
	 * because the object is present and every call fails. The helper must
	 * swallow those, not propagate them into a render.
	 */
	it('swallows a throwing implementation', () => {
		w.OOT = {
			profiles: {
				list: () => {
					throw new Error('boom');
				},
				current: () => {
					throw new Error('boom');
				},
				isManagerDevice: () => {
					throw new Error('boom');
				},
				pathDone: () => {
					throw new Error('boom');
				},
				markPathStep: () => {
					throw new Error('boom');
				},
				onChange: () => {
					throw new Error('boom');
				}
			}
		};
		expect(() => profiles.isManagerDevice()).not.toThrow();
		expect(profiles.isManagerDevice()).toBe(false);
		expect(() => profiles.pathDone('table', 'x')).not.toThrow();
		expect(() => profiles.markPathStep('table', 'x')).not.toThrow();
		expect(() => profiles.onChange(() => {})).not.toThrow();
	});
});

describe('when a roster is present', () => {
	const fake = (current: { id: string; name: string } | null, all: unknown[] = []) => ({
		profiles: {
			list: () => all,
			current: () => current,
			get: (id: string) => all.find((p) => (p as { id: string }).id === id),
			isManagerDevice: () => true,
			onChange: (fn: (p: unknown) => void) => {
				fn(current);
				return () => {};
			}
		}
	});

	it('reads through to it', () => {
		w.OOT = fake({ id: 'p-1', name: 'Devon' }, [{ id: 'p-1', name: 'Devon' }]);
		expect(profiles.hasProfiles()).toBe(true);
		expect(profiles.currentName()).toBe('Devon');
		expect(profiles.list()).toHaveLength(1);
		expect(profiles.isManagerDevice()).toBe(true);
	});

	/** onChange fires immediately on registration — handlers must be idempotent. */
	it('onChange calls back at once with the current profile', () => {
		w.OOT = fake({ id: 'p-2', name: 'Maria' });
		const seen: unknown[] = [];
		profiles.onChange((p) => seen.push(p));
		expect(seen).toHaveLength(1);
		expect((seen[0] as { name: string }).name).toBe('Maria');
	});
});
