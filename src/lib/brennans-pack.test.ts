/**
 * The Brennan's pack, proved the way the site proves it: tools/house/check-pack.mjs
 * reads static/shared/packs/brennans-new-orleans.v1.oothouse.json through the
 * SHIPPED engine, validates it with no fatal code, holds every mark to a person,
 * every id to its prefix, every reference to an item, and no dash and no British
 * spelling in the house's own American English. The pack is rebuilt by the chain
 * (parse-guide, check-parse, build-brennans, validate-pack, keep-all
 * --owner-reviewed) and never patched; this test only spawns the gate.
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const PACK = join(ROOT, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json');

describe("the Brennan's pack", () => {
	it('is shipped and passes tools/house/check-pack.mjs through the shipped engine', () => {
		expect(existsSync(PACK)).toBe(true);
		const r = spawnSync(process.execPath, [join(ROOT, 'tools', 'house', 'check-pack.mjs')], { cwd: ROOT, encoding: 'utf8' });
		expect(r.status, r.stdout + r.stderr).toBe(0);
		expect(r.stdout).toContain('874 marks all by person');
		expect(r.stdout).toContain('0 fatal');
	});
});
