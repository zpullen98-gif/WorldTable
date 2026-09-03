import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const buildData = readFileSync(join(ROOT, 'tools', 'build-data.mjs'), 'utf8');
const verifyBuild = readFileSync(join(ROOT, 'tools', 'verify-build.mjs'), 'utf8');

/**
 * Three properties of the build that no test could see, asserted from the
 * source. Each was measured before it was fixed; each is pinned here because
 * each is one careless edit from coming back.
 */

describe('nothing is written until every gate has spoken', () => {
	/**
	 * The emit ran around line 770 and the gate block that can still fail is a
	 * thousand lines below it, so a run that failed its late gates had already
	 * put poisoned artifacts on disk and then exited 1 - leaving a tree that
	 * looks built.
	 *
	 * Asserted by ORDER, which is the actual property. A staging Map that gets
	 * flushed halfway up the file would pass a "does it stage" check and fail
	 * this one.
	 */
	it('flushes the staged artifacts after the LAST gate, not the first', () => {
		// lastIndexOf, not indexOf: two gates carry this message now - the early
		// supplement/geography one and the final block - and measuring against
		// the early one would make this assertion trivially true. That is the
		// exact shape of a gate that looks like coverage and is not.
		const gates = [...buildData.matchAll(/BUILD GATE FAILED: nothing was written/g)];
		expect(gates.length, 'both gates should say what they did not do').toBe(2);
		const lastGate = buildData.lastIndexOf('BUILD GATE FAILED: nothing was written');
		const flush = buildData.indexOf('for (const [file, text] of staged) writeFileSync');
		expect(flush, 'the flush must exist').toBeGreaterThan(-1);
		expect(flush).toBeGreaterThan(lastGate);

		// And every staging call has to happen before it, or an artifact is
		// prepared after the promotion and never lands.
		const lastStage = buildData.lastIndexOf('stage(');
		expect(lastStage).toBeLessThan(flush);
	});

	/**
	 * And no artifact may slip past the staging. search-index.json used to write
	 * itself directly, not because it was exempt but because it serializes
	 * itself; that is exactly the shape that reappears.
	 */
	it('writes to the output directory in exactly one place', () => {
		const direct = [...buildData.matchAll(/writeFileSync\(join\(OUT[^)]*\)/g)];
		expect(direct).toHaveLength(1);
		// And that one place is the flush.
		const at = buildData.indexOf(direct[0][0]);
		expect(buildData.slice(at - 120, at)).toContain('staged');
	});
});

describe('an authored input cannot be defaulted away', () => {
	/**
	 * notes.json and overrides.json are hand-written and live in the build's own
	 * OUTPUT directory, read with `existsSync(p) ? JSON.parse(...) : {}`.
	 *
	 * Measured: move notes.json aside and build:data exits 0, prints "all gates
	 * passed", and changes 320 of the 1,844 index entries - every downstream
	 * derivation re-running on the poorer text, silently.
	 */
	it('reads both through the required() guard', () => {
		expect(buildData).toMatch(/const OVERRIDES = required\(/);
		expect(buildData).toMatch(/const NOTES = required\(/);
		expect(buildData).toContain('BUILD INPUT MISSING');
	});

	it('leaves no fail-open read of either file', () => {
		for (const f of ['overridesPath', 'notesPath']) {
			// The shape that was there: a ternary on existsSync with a default.
			expect(buildData).not.toMatch(new RegExp(`existsSync\\(${f}\\)\\s*\\?`));
		}
	});

	/** The guard has to say the file is authored, or the next reader hunts for
	 *  the generator that does not exist. */
	it('says the file is authored and cannot be rebuilt', () => {
		expect(buildData).toContain('It is AUTHORED, not generated');
	});
});

describe('the build verifier counts from the file the pages come from', () => {
	/**
	 * `expectedRecipes` was read from recipes.full.json while `entries()` maps
	 * over `recipes`, which data.ts loads from recipes.index.json. Both are 1,844
	 * today, so it was latent - but a check whose number comes from a different
	 * file than the thing it checks is agreeing by coincidence, not checking.
	 */
	it('reads the index, which is what data.ts loads', () => {
		expect(verifyBuild).toMatch(
			/const indexRecipes = JSON\.parse\(\s*readFileSync\(join\(ROOT, 'src\/lib\/data\/recipes\.index\.json'\)/
		);
		const app = readFileSync(join(ROOT, 'src', 'lib', 'data.ts'), 'utf8');
		expect(app).toContain("import indexJson from './data/recipes.index.json'");
		expect(app).toContain('export const recipes = indexJson');
	});

	/** And the coincidence is now a contract. */
	it('gates the two recipe files as one corpus in one order', () => {
		expect(verifyBuild).toContain('the two recipe files are the same corpus, in the same order');
		expect(verifyBuild).toContain('slug order diverges at');
	});
});
