import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * Role is per PERSON. Prefs are per DEVICE.
 *
 * src/lib/stores/prefs.svelte.ts writes a raw localStorage key ('wt.prefs.v1')
 * that never passes through profiles.key(), and src/app.html reads it
 * synchronously before first paint — that is deliberate, and it is why day/night
 * service lives there.
 *
 * It is also why role must NOT. On a shared kitchen tablet every per-person
 * dashboard would show whatever the last person tapped, while looking entirely
 * plausible. Crude assertion, but this is a failure with no runtime symptom.
 */
describe('what belongs to the device and what belongs to the person', () => {
	it('prefs does not carry role', () => {
		const src = readFileSync('src/lib/stores/prefs.svelte.ts', 'utf8');
		// A plain boolean, not `not.toMatch`. The first version of this line was
		// `expect(src).not.toMatch(/role/)` and it PASSED against a file that
		// demonstrably contained the word — confirmed by reading the same path in
		// the same vitest process and asserting on the contents. An assertion
		// whose failure mode cannot be explained is worse than no assertion.
		expect(src.includes('role'), 'role must not live in device-wide prefs').toBe(false);
	});

	it('the session does carry it', () => {
		const src = readFileSync('src/lib/persistence/state.ts', 'utf8');
		expect(src.includes('role?:'), 'role must live on the session').toBe(true);
	});
});
