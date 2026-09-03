import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The CI contract, asserted from inside the suite CI runs.
 *
 * Two decisions in .github/workflows/pages.yml are load-bearing and neither is
 * obvious from reading the file, so both are pinned here. A workflow is the one
 * file nobody runs locally before pushing, which makes it the easiest place for
 * a careful change to quietly undo a careful decision.
 */
const ROOT = process.cwd();
const yml = readFileSync(join(ROOT, '.github', 'workflows', 'pages.yml'), 'utf8');
const steps = [...yml.matchAll(/^\s+- (?:run: |name: )(.*)$/gm)].map((m) => m[1].trim());
const at = (needle: string) => steps.findIndex((s) => s.includes(needle));

describe('the deploy workflow', () => {
	/**
	 * The item-16 gate. The 22 artifacts under src/lib/data are COMMITTED and
	 * nothing rebuilt them, so a rule edited in tools/derive shipped only if a
	 * human remembered to re-run it. Measured: adding one word to the CELERY list
	 * in tools/derive/diet.mjs flips containsCelery on drob-de-miel, and both
	 * verify:data (38/38) and npm test (703/703) stay green while the ruling
	 * never reaches a cook.
	 */
	it('re-derives the committed data and fails if that changes anything', () => {
		expect(at('npm run build:data'), 'CI must re-run build:data').toBeGreaterThan(-1);
		expect(yml, 'CI must fail when re-deriving dirties the tree').toContain(
			'git status --porcelain --untracked-files=all -- src/lib/data tools/derive'
		);
	});

	/**
	 * The writer that regenerates src/lib/data/raw/ from the archived original,
	 * which still carries the em dashes that three commits (d0ba35c, 2f98cd5,
	 * f741ca2) deliberately swept out of the committed copy: 3,919 of them across
	 * 7 of the 15 files, 2,028 in R alone. It is not a build step, it is a
	 * one-way import, and verify:data checks raw/ AGAINST the archive rather than
	 * rebuilding it from it - WORD-identical, not byte-identical, which is
	 * exactly why a revert would sail through every gate green.
	 *
	 * This test is the outer of three defences now. It was the only one.
	 */
	it('never runs extract, which would revert the dash sweep', () => {
		const runs = yml.split('\n').filter((l) => /^\s+- run:/.test(l));
		expect(runs.filter((l) => /\bextract\b/.test(l))).toEqual([]);
	});

	/**
	 * The other two defences, which is where item 31 landed.
	 *
	 * The reader and the writer used to be ONE file, `tools/extract.mjs`, and
	 * three tools imported the reader out of it - so the writer sat one stray
	 * call away from every build. They are now `extract-lib.mjs` (reads, writes
	 * nothing) and `extract-writer.mjs` (refuses without an explicit flag).
	 *
	 * A future session cannot reach the gun by tab-completing `npm run`, and no
	 * import pulls it in. Both halves are asserted here, because both are one
	 * careless edit from being undone.
	 */
	it('keeps the reader and the writer apart, and off npm run', () => {
		const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
			scripts: Record<string, string>;
		};
		expect(
			Object.entries(pkg.scripts).filter(([, v]) => /extract-writer|\bextract\.mjs/.test(v)),
			'no npm script may reach the writer'
		).toEqual([]);

		// The one-file version is gone, so nothing imports it back out of habit.
		expect(existsSync(join(ROOT, 'tools', 'extract.mjs'))).toBe(false);

		const tools = readdirSync(join(ROOT, 'tools')).filter((f) => f.endsWith('.mjs'));
		const importers = tools.filter(
			(f) =>
				f !== 'extract-writer.mjs' &&
				readFileSync(join(ROOT, 'tools', f), 'utf8').includes("from './extract-writer.mjs'")
		);
		expect(importers, 'nothing may import the writer').toEqual([]);
	});

	/** The safety itself: it refuses, and it says what it would cost. */
	it('the writer refuses to run without the confirmation flag', () => {
		const w = readFileSync(join(ROOT, 'tools', 'extract-writer.mjs'), 'utf8');
		expect(w).toMatch(/process\.argv\.includes\(CONFIRM\)/);
		expect(w).toMatch(/process\.exit\(1\)/);
		// A refusal that does not name the damage is a speed bump.
		expect(w).toMatch(/3,919 em-dashes/);
	});

	/**
	 * Order matters and looks arbitrary. Four unit tests are staleness gates in
	 * their own right — src/lib/technique-standards.test.ts fails with
	 * "technique-standards.mjs was edited without re-running build:data", and
	 * palate, sanitation and standards do the same. Re-deriving before they run
	 * regenerates the drift away first, leaving all four permanently green and
	 * permanently useless.
	 */
	it('runs the suite BEFORE re-deriving, or four staleness gates go toothless', () => {
		expect(at('npm test')).toBeGreaterThan(-1);
		expect(at('npm test')).toBeLessThan(at('npm run build:data'));
	});

	/** A gate after the artifact is uploaded is not a gate. */
	it('gates before it builds pages', () => {
		expect(at('derived data must match')).toBeLessThan(at('npm run build:pages'));
	});
});
