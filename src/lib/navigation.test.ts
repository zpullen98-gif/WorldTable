import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Two contracts the app cannot see itself breaking.
 *
 * 1. The MODES literal is parsed by tools/verify-build.mjs with STRING
 *    SCANNING, not a parser. It needs an exact declaration and single-quoted
 *    hrefs. Break either and the scanner silently finds zero tabs — and the
 *    only thing standing between that and a shipped 404 is a floor assertion.
 *
 * 2. Five class names in this app are a PUBLISHED PAYWALL CONTRACT. The
 *    monorepo's oot-locks.js masks `ol.semesters > li.semester:nth-child(n+2)`
 *    and `.lexcard .def, .flash .def` for free visitors, keyed to the TIER
 *    attribute with NO route scope — it applies wherever those selectors match.
 *
 *    Renaming one fails OPEN: every semester and every definition is delivered
 *    in clear to free visitors, with no symptom on this side. Reusing one on a
 *    new page fails CLOSED: content blurred on a route nobody meant to gate.
 *    Neither shows up in a screenshot of the standalone build.
 */

function svelteFiles(dir: string): string[] {
	const out: string[] = [];
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		const f = join(dir, e.name);
		if (e.isDirectory()) out.push(...svelteFiles(f));
		else if (f.endsWith('.svelte')) out.push(f);
	}
	return out;
}

const ROUTES = svelteFiles('src/routes');
const norm = (p: string) => p.split(/[\\/]/).join('/');
const usesClass = (src: string, token: string) =>
	new RegExp(`class="[^"]*\\b${token}\\b`).test(src);

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

describe('the paywall selector contract', () => {
	/** token -> the routes allowed to use it as a class. */
	const CONTRACT: Record<string, string[]> = {
		semesters: ['src/routes/study/+page.svelte'],
		semester: ['src/routes/study/+page.svelte'],
		lexcard: ['src/routes/lexicon/+page.svelte'],
		// Both are paid surfaces, so the free-tier blur is correct on each.
		def: ['src/routes/lexicon/+page.svelte', 'src/routes/menu/quiz/+page.svelte'],
		flash: ['src/routes/lexicon/+page.svelte', 'src/routes/menu/quiz/+page.svelte']
	};

	for (const [token, allowed] of Object.entries(CONTRACT)) {
		it(`"${token}" is used only where oot-locks.js expects it`, () => {
			const used = ROUTES.filter((f) => usesClass(readFileSync(f, 'utf8'), token)).map(norm);
			expect(used.sort(), `class "${token}" is a paywall selector`).toEqual(allowed.sort());
		});
	}
});
