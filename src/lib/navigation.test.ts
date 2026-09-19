import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * A contract the app cannot see itself breaking.
 *
 * 1. The MODES literal is parsed by tools/verify-build.mjs with STRING
 *    SCANNING, not a parser. It needs an exact declaration and single-quoted
 *    hrefs. Break either and the scanner silently finds zero tabs — and the
 *    only thing standing between that and a shipped 404 is a floor assertion.
 *
 * There was a second: five class names (.semesters, .semester, .lexcard, .def,
 * .flash) were the monorepo paywall's selectors, pinned here file by file. The
 * owner made the World Table free in full on 2026-09-19 and the monorepo's
 * Table lock was deleted, so the classes are only styling and the pin retired.
 */

describe('the MODES literal stays machine-readable', () => {
	const layout = readFileSync('src/routes/+layout.svelte', 'utf8');
	const open = layout.indexOf('const MODES = [');
	// From AFTER the array's own opening bracket — verify-build slices from the
	// declaration itself, which is harmless for it (the declaration holds no
	// href) but would make the nested-array check below trivially true here.
	const DECL = 'const MODES = [';
	const body = layout.slice(open + DECL.length, layout.indexOf('];', open));

	it('uses the exact declaration the scanner looks for', () => {
		expect(open, 'verify-build scans for this literal, not for a parsed array').toBeGreaterThan(-1);
	});

	it('quotes every href the way the scanner expects', () => {
		const singles = body.split("href: '").length - 1;
		const entries = body.split('{ href').length - 1;
		expect(singles, 'an href using double quotes is invisible to the scanner').toBe(entries);
	});

	/**
	 * A nested array inside MODES is picked up by the scanner too, and resolved
	 * to a page file. `children: [{ href: '/learn#tracks' }]` would assert on
	 * `learn#tracks.html`, which can never exist. Per-tab metadata belongs in a
	 * separate const below the literal — which is where OWNS lives.
	 */
	it('holds no nested array', () => {
		expect(body.includes('['), 'nested hrefs would be scanned as pages').toBe(false);
	});

	it('keeps the Today tab as an empty href, not a slash', () => {
		// verify-build maps '' to index.html and everything else to href.slice(1)
		// + '.html'. '/' therefore computes '.html', which never exists.
		expect(body.includes("{ href: '', label: 'Today' }")).toBe(true);
	});
});
