import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
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
	 * The mark-id ledger is a SEPARATE write, gated by its own `!problems.length`
	 * check rather than by the staging Map — a ledger append is not something a
	 * later gate failure can be allowed to leave half-done. That guard only
	 * means "every gate passed" if every gate has already spoken into
	 * `problems` by the time it runs, and six of them once did not: a comment
	 * beside the ledger claimed economics, waste, sanitation, service-track,
	 * drills and stations were pushed above it, and they were pushed below it,
	 * so a build failing on any one of those six had already committed newly
	 * minted mark ids before exiting. Proved live: mutating a lexicon word
	 * `buildWaste` depends on trips the waste gate, and before this test
	 * existed the ledger and assessability.json both changed under that
	 * failure; after the fix, neither does (checked by md5sum, not by re-import,
	 * because the point is what lands on disk).
	 */
	it('pushes every content gate before the mark-id ledger commits', () => {
		const ledgerWrite = buildData.indexOf('writeFileSync(LEDGER,');
		expect(ledgerWrite, 'the ledger write must exist').toBeGreaterThan(-1);
		for (const name of [
			'economicsProblems',
			'wasteProblems',
			'sanitationProblems',
			'serviceTrackProblems',
			'drillProblems',
			'floorDeckProblems',
			'stationProblems',
			'plateProblems',
			'primerProblems',
			'levelProblems'
		]) {
			const pushedAt = buildData.indexOf(`problems.push(...${name})`);
			expect(pushedAt, `problems.push(...${name}) must exist`).toBeGreaterThan(-1);
			expect(pushedAt, `${name} must be pushed before the ledger commits`).toBeLessThan(ledgerWrite);
		}
	});

	/**
	 * And no artifact may slip past the staging. search-index.json used to write
	 * itself directly, not because it was exempt but because it serializes
	 * itself; that is exactly the shape that reappears — assessability.json did
	 * it a second time, through `new URL('../src/lib/data/assessability.json', ...)`
	 * rather than `join(OUT, ...)`, which is precisely the spelling this test's
	 * PREVIOUS regex (`writeFileSync\(join\(OUT[^)]*\)`) could not see: it
	 * matched only one literal shape and called that "exactly one place", while
	 * a second write sat 130 lines earlier under a different one. Every
	 * `writeFileSync(` call site is enumerated here now, not just the ones
	 * spelled the way the last bug happened to be spelled.
	 */
	it('has no writeFileSync into src/lib/data other than the staged flush', () => {
		const calls = [...buildData.matchAll(/writeFileSync\(/g)].map((m) => m.index);
		expect(calls.length, 'there should be exactly two writeFileSync call sites in this file').toBe(2);
		const unaccountedFor = calls.filter((at) => {
			const call = buildData.slice(at, at + 60);
			const isTheStagedFlush = call.startsWith("writeFileSync(join(OUT, file), text");
			const isTheMarkIdLedger = call.startsWith('writeFileSync(LEDGER,');
			return !isTheStagedFlush && !isTheMarkIdLedger;
		});
		expect(unaccountedFor, 'every writeFileSync must be either the staged flush or the ledger').toEqual([]);
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

describe("the Maitre d' client is one file in two places", () => {
	/**
	 * static/shared/oot-maitre.js is the canonical source; the hub carries a
	 * copy at OutsideOfTime/shared/oot-maitre.js because the two plain wings
	 * load it from there. Two copies that differ are two clients with two
	 * ideas of the key slot, the price table and her copy, so drift FAILS
	 * here (and in the site's check-mirror) rather than being overwritten:
	 * which side is right is a decision, not a script's guess.
	 *
	 * The same holds for every other shared file written here and copied to
	 * the site: the ported House engine, the wings' house screen, the quote
	 * bank and the packs. Each is mirrored below when it exists here.
	 *
	 * The site is a sibling checkout on the owner's machine and absent in CI
	 * and on a fresh clone, so the cases skip with the reason in the name.
	 * OOT_SITE names the checkout; without it the sibling is looked for under
	 * its old name, OutsideOfTime, then under the Pages name the site
	 * publishes as, the same two the site's own tools and check-house-ui try.
	 */
	const SHARED = join(ROOT, 'static', 'shared');
	const canonical = join(SHARED, 'oot-maitre.js');
	const siteCandidates = process.env.OOT_SITE
		? [process.env.OOT_SITE]
		: [join(ROOT, '..', 'OutsideOfTime'), join(ROOT, '..', 'zpullen98-gif.github.io')];
	const site = siteCandidates.find((dir) => existsSync(join(dir, 'shared')));
	const mirrorDir = site ? join(site, 'shared') : null;

	it('ships from static/shared', () => {
		expect(existsSync(canonical)).toBe(true);
	});

	/** The first byte at which two buffers part, or -1 when they are the same bytes. */
	const diverge = (a: Buffer, b: Buffer): number => {
		let at = 0;
		while (at < a.length && at < b.length && a[at] === b[at]) at++;
		return a.length === b.length && at === a.length ? -1 : at;
	};

	const MIRRORED = ['oot-maitre.js', 'oot-house.js', 'oot-house-ui.js', 'oot-quotes.js'];
	for (const name of MIRRORED) {
		const here = join(SHARED, name);
		const there = mirrorDir ? join(mirrorDir, name) : null;
		const mirrored = !!there && existsSync(here) && existsSync(there);
		it.skipIf(!mirrored)(`${name} is byte-identical to the site's shared/${name} (skipped when that checkout or the copy is absent)`, () => {
			const a = readFileSync(here);
			const b = readFileSync(there as string);
			const at = diverge(a, b);
			expect(
				at,
				`the two copies of ${name} diverge at byte ${at} (canonical ${a.length} bytes, mirror ${b.length}): copy the canonical file over, never edit the mirror`
			).toBe(-1);
		});
	}

	const packsHere = join(SHARED, 'packs');
	const packs = existsSync(packsHere) ? readdirSync(packsHere).filter((f) => f.endsWith('.json')) : [];
	it.skipIf(!mirrorDir || packs.length === 0)('every pack under static/shared/packs is byte-identical on the site (skipped when either side has none)', () => {
		for (const name of packs) {
			const there = join(mirrorDir as string, 'packs', name);
			expect(existsSync(there), `the site has no shared/packs/${name}: copy it over`).toBe(true);
			const at = diverge(readFileSync(join(packsHere, name)), readFileSync(there));
			expect(at, `shared/packs/${name} diverges at byte ${at}: copy the canonical file over, never edit the mirror`).toBe(-1);
		}
	});

	/** The verifier must keep the client out of the precache, or it costs cap bytes on every device. */
	it('is asserted lazy by the build verifier and ignored by the precache glob', () => {
		expect(verifyBuild).toContain("the Maitre d' client ships and is NOT precached");
		const vite = readFileSync(join(ROOT, 'vite.config.ts'), 'utf8');
		expect(vite).toContain("'**/shared/oot-maitre.js'");
	});

	/** And its siblings the same way: each lazy file named by the verifier's list and by the glob. */
	it('keeps the ported House, the house screen, the quote bank and the packs out of the precache too', () => {
		expect(verifyBuild).toMatch(/const SHARED_LAZY = \[([^\]]*)\]/);
		const list = (verifyBuild.match(/const SHARED_LAZY = \[([^\]]*)\]/) as RegExpMatchArray)[1];
		const vite = readFileSync(join(ROOT, 'vite.config.ts'), 'utf8');
		for (const name of ['oot-house.js', 'oot-house-ui.js', 'oot-quotes.js']) {
			expect(list, `verify-build's SHARED_LAZY must name shared/${name}`).toContain(`'shared/${name}'`);
			expect(vite, `vite.config.ts globIgnores must name shared/${name}`).toContain(`'**/shared/${name}'`);
		}
		expect(vite).toContain("'**/shared/packs/**'");
		expect(verifyBuild).toContain('the house packs, when shipped, are NOT precached');
	});
});
