import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The three parity gates for the shared files, run from npm test so a port
 * a day older than its source, a quote nobody ticked or a house screen that
 * says a word the wings refuse cannot pass a green suite:
 *
 *   check-port-house.mjs  static/shared/oot-house.js says what src/lib/house says
 *   check-quotes.mjs      static/shared/oot-quotes.js is the bank candidates.json ticks
 *   check-house-ui.mjs    static/shared/oot-house-ui.js draws the house in the wings' voice
 *
 * Each is a child process, the way check-all runs the site's gates: its own
 * exit code is the verdict and its output is the reason, printed here on a
 * failure so the suite says which rule and which file. Nothing is mocked and
 * nothing is imported: what is proved is the gate as a person would run it.
 */
const ROOT = process.cwd();

const GATES = [
	{ name: 'check-port-house', file: join('tools', 'check-port-house.mjs') },
	{ name: 'check-quotes', file: join('tools', 'quotes', 'check-quotes.mjs') },
	{ name: 'check-house-ui', file: join('tools', 'check-house-ui.mjs') }
];

describe('the shared files pass their own gates', () => {
	for (const gate of GATES) {
		it(`${gate.name} exits 0`, () => {
			const script = join(ROOT, gate.file);
			expect(existsSync(script), `${gate.file} is missing`).toBe(true);
			let output = '';
			let code = 0;
			try {
				output = execFileSync(process.execPath, [script], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120_000 });
			} catch (e) {
				const err = e as { status?: number | null; stdout?: string; stderr?: string };
				code = err.status ?? 1;
				output = `${err.stdout ?? ''}${err.stderr ?? ''}`;
			}
			expect(code, `${gate.name} failed:\n${output}`).toBe(0);
			expect(output, `${gate.name} printed nothing, which is not a verdict`).not.toBe('');
		}, 180_000);
	}
});
