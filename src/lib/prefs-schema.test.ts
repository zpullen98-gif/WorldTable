import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sanitizePrefs, DEFAULTS, isService, PREFS_VERSION } from './prefs-schema';
import { hasFilterQuery, FILTER_KEYS, filtersFromURL } from './urlState';

describe('wt.prefs.v1 is checked, not spread', () => {
	/**
	 * The store read it back with `{ ...DEFAULTS, ...parsed }`. localStorage is
	 * the one store here a person can edit from a console, and the one that
	 * survives every other kind of reset.
	 */
	it('refuses a value that is not one of the enum', () => {
		const p = sanitizePrefs({ service: 'dusk', units: 'imperial', hemisphere: 'Q' });
		expect(p.service).toBeNull();
		expect(p.units).toBe('metric');
		expect(p.hemisphere).toBe('N');
	});

	/** Per-field, so corrupt units do not also cost somebody their hemisphere. */
	it('keeps the fields that are fine', () => {
		const p = sanitizePrefs({ service: 'day', units: 'nonsense', hemisphere: 'S' });
		expect(p.service).toBe('day');
		expect(p.units).toBe('metric');
		expect(p.hemisphere).toBe('S');
	});

	/** null is a VALUE here: it means follow prefers-color-scheme. */
	it('treats null service as the real setting it is', () => {
		expect(sanitizePrefs({ service: null }).service).toBeNull();
		expect(sanitizePrefs({ service: 'night' }).service).toBe('night');
	});

	it('survives anything JSON.parse can return', () => {
		for (const junk of [null, 0, 'a string', [], [1, 2], true, { schemaVersion: 'x' }]) {
			expect(sanitizePrefs(junk)).toEqual(DEFAULTS);
		}
	});

	/** Unchanged behaviour: do not guess at a newer build's shape. */
	it('falls back whole for an unknown future version', () => {
		const p = sanitizePrefs({ schemaVersion: PREFS_VERSION + 1, service: 'day', units: 'us' });
		expect(p).toEqual(DEFAULTS);
	});

	/**
	 * The defect was a DISAGREEMENT, not just laxity: app.html's boot script
	 * guards `p.service === 'day' || p.service === 'night'` and leaves
	 * data-service unset otherwise, while the store returned "dusk" and the
	 * toggle then wrote it onto the element the boot script had left alone.
	 * This asserts the two tests are still the same test.
	 */
	it('agrees with the boot script in app.html, which reads the same key', () => {
		const html = readFileSync(join(process.cwd(), 'src', 'app.html'), 'utf8');
		expect(html).toContain("'wt.prefs.v1'");
		const guard = html.match(/p\.service === '(\w+)' \|\| p\.service === '(\w+)'/);
		expect(guard, 'app.html must still guard service by value').not.toBeNull();
		const [, a, b] = guard!;
		// Every value app.html will paint, the store must also accept, and
		// nothing else.
		expect(isService(a)).toBe(true);
		expect(isService(b)).toBe(true);
		expect(sanitizePrefs({ service: a }).service).toBe(a);
		expect(sanitizePrefs({ service: b }).service).toBe(b);
		expect(sanitizePrefs({ service: 'dusk' }).service).toBeNull();
	});
});

describe('the front door forwards a filter link, and nothing else', () => {
	const at = (search: string) => new URL(`https://example.test/${search}`);

	/**
	 * It tested only that a query string EXISTED, so a share link carrying a
	 * tracking parameter landed a first-time visitor in the Library. Those
	 * parameters are appended by the sharer, not by whoever posted the link.
	 */
	it('ignores the parameters sharers append', () => {
		for (const s of [
			'?fbclid=IwAR0abcdef',
			'?utm_source=newsletter&utm_medium=email',
			'?gclid=xyz',
			'?ref=twitter',
			'?igshid=1'
		]) {
			expect(hasFilterQuery(at(s)), s).toBe(false);
		}
	});

	it('still forwards every link the Library can read', () => {
		for (const k of FILTER_KEYS) expect(hasFilterQuery(at(`?${k}=1`)), k).toBe(true);
		expect(hasFilterQuery(at('?q=ragu'))).toBe(true);
		// Mixed: a real filter alongside tracking still forwards.
		expect(hasFilterQuery(at('?utm_source=x&q=ragu'))).toBe(true);
	});

	it('ignores an empty query and a bare root', () => {
		expect(hasFilterQuery(at(''))).toBe(false);
		expect(hasFilterQuery(at('?'))).toBe(false);
	});

	/**
	 * The keys are listed beside the parser that reads them so the two cannot
	 * drift. This is what makes that true: add a filter to filtersFromURL and
	 * forget FILTER_KEYS, and the forward silently stops honouring it.
	 */
	it('lists exactly the keys the parser reads', () => {
		const src = readFileSync(join(process.cwd(), 'src', 'lib', 'urlState.ts'), 'utf8');
		const body = src.slice(src.indexOf('export function filtersFromURL'));
		const read = new Set([...body.matchAll(/p\.get\('([a-z]+)'\)/g)].map((m) => m[1]));
		expect([...read].sort()).toEqual([...FILTER_KEYS].sort());
	});

	/** And a forwarded link still means what it meant. */
	it('round-trips a real filter link', () => {
		const f = filtersFromURL(at('?q=ragu&veg=1&quick=1'));
		expect(f.q).toBe('ragu');
		expect(f.vegetarian).toBe(true);
		expect(f.quick).toBe(true);
	});
});
