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

	it('keeps the Home tab as an empty href, not a slash', () => {
		// verify-build maps '' to index.html and everything else to href.slice(1)
		// + '.html'. '/' therefore computes '.html', which never exists.
		expect(body.includes("{ href: '', label: 'Home' }")).toBe(true);
	});

	/**
	 * The one nav the three apps share (docs/consolidation-design.md 2.1): the
	 * four tab words in this order, then More, last and quiet (the bar's
	 * quiet control, never a fifth tab drawn like the others). The Ledger and
	 * the Codex pin theirs the same way, so a tab renamed in one app alone
	 * fails that app's gate.
	 */
	it('reads Home, Flashcards, Quizzes, Library, then More, last and quiet', () => {
		const entries = [...body.matchAll(/\{ href: '([^']*)', label: '([^']+)'([^}]*)\}/g)].map((m) => ({ href: m[1], label: m[2], rest: m[3] }));
		expect(entries.map((e) => e.label)).toEqual(['Home', 'Flashcards', 'Quizzes', 'Library', 'More']);
		expect(entries.map((e) => e.href)).toEqual(['', '/flashcards', '/quizzes', '/library', '/more']);
		const tabs = entries.slice(0, 4);
		expect(tabs.every((e) => !/quiet/.test(e.rest)), 'the four tabs are drawn as tabs').toBe(true);
		expect(entries[4].rest, 'More is the quiet control, never a fifth tab').toMatch(/quiet: true/);
	});

	it('draws More with its own quiet style and lights it like any tab', () => {
		expect(layout).toMatch(/class:quiet=\{m\.quiet\}/);
		expect(layout).toMatch(/\.modetab\.quiet \{/);
		expect(layout).toMatch(/aria-current=\{here \? 'page' : undefined\}/);
	});
});

/**
 * Who owns which path (design 3.2), the first match winning: the level test
 * and the level's reading by pattern, then More, Quizzes, Flashcards, Library,
 * and Home last. A reordering that lets /menu claim /menu/quiz, or /level
 * claim the test, fails here before it ships a wrong lit tab.
 */
describe('the owner of a path', () => {
	const layout = readFileSync('src/routes/+layout.svelte', 'utf8');
	it('tests the level test and the reading by pattern before any prefix', () => {
		const patterns = layout.indexOf('const OWN_PATTERNS');
		const owns = layout.indexOf('const OWNS');
		expect(patterns).toBeGreaterThan(-1);
		expect(owns).toBeGreaterThan(patterns);
		expect(layout).toMatch(/\[\/\^\\\/level\\\/\[1-4\]\\\/test\$\/, '\/quizzes'\]/);
		expect(layout).toMatch(/\[\/\^\\\/level\\\/\[1-4\]\\\/read\$\/, '\/library'\]/);
	});
	it('orders the prefixes More, Quizzes, Flashcards, Library, Home', () => {
		const body = layout.slice(layout.indexOf('const OWNS'), layout.indexOf('];', layout.indexOf('const OWNS')));
		const order = [...body.matchAll(/\['([^']*)', \[/g)].map((m) => m[1]);
		expect(order).toEqual(['/more', '/quizzes', '/flashcards', '/library', '']);
	});
});

/**
 * Every forwarder replaces (design 3.7, 7.2): an old address that pushed
 * would leave itself in the history, and Back would land on it and forward
 * again, a loop. Each calls navReplace() first so the depth does not move.
 */
describe('the old addresses forward with a replace', () => {
	for (const file of [
		'src/routes/level/+page.svelte',
		'src/routes/service/deck/study/+page.svelte',
		'src/routes/menu/quiz/+page.svelte',
		'src/routes/lexicon/+page.svelte'
	]) {
		it(file, () => {
			const src = readFileSync(file, 'utf8');
			expect(src).toMatch(/nav\.navReplace\(\);\s*void goto\([\s\S]*?\{ replaceState: true \}\)/);
		});
	}
});

/**
 * One way back (design 2.2): the layout's Back control, and no crumbs, no
 * "Back to ..." chip, on any route or component.
 */
describe('one way back', () => {
	it('draws the Back control on every path but Home', () => {
		const layout = readFileSync('src/routes/+layout.svelte', 'utf8');
		expect(layout).toMatch(/\{#if path !== '\/'\}<BackButton \/>\{\/if\}/);
	});
	it('leaves no nav.crumbs and no Back to chip anywhere', async () => {
		const { readdirSync, statSync } = await import('node:fs');
		const { join } = await import('node:path');
		const walk = (dir: string): string[] =>
			readdirSync(dir).flatMap((n) => {
				const f = join(dir, n);
				return statSync(f).isDirectory() ? walk(f) : f.endsWith('.svelte') ? [f] : [];
			});
		for (const f of [...walk('src/routes'), ...walk('src/lib/components')]) {
			const src = readFileSync(f, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
			const markup = src.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
			expect(markup, f).not.toMatch(/class="crumbs"/);
			expect(markup, f).not.toMatch(/>\s*(?:←\s*)?Back to\b/);
		}
	});
});
