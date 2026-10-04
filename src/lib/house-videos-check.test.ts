/**
 * tools/check-house-videos.mjs, the network check that is not a gate, run
 * with a stub in place of fetch so no test reaches the network: offline (the
 * proxy's refusal) is a skip with exit 0 said plainly, the same title and
 * channel pass, another title or channel fails, a gone video fails, and a
 * pack with no videos says so.
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const TOOL = join(ROOT, 'tools', 'check-house-videos.mjs');
const dir = mkdtempSync(join(tmpdir(), 'house-videos-'));

/* The stub: globalThis.fetch answers by STUB_MODE, never the network. */
const STUB = join(dir, 'stub.mjs');
writeFileSync(
	STUB,
	`const mode = process.env.STUB_MODE;
globalThis.fetch = async (url) => {
	const u = String(url);
	const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
	if (mode === 'offline') return new Response('Host not in allowlist: www.youtube.com.', { status: 403, headers: { 'x-deny-reason': 'host_not_allowed' } });
	if (mode === 'refused') throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } });
	if (mode === 'gone') return json(404, {});
	const drift = mode === 'drift' && u.includes('vimeo');
	if (u.includes('vimeo')) return json(200, { title: drift ? 'Something else entirely' : 'Champagne Service \\u2014 the Cork', author_name: 'Le Cordon Bleu' });
	return json(200, { title: "Brennan's Bananas Foster", author_name: "Brennan's New Orleans" });
};
`
);

function pack(videos: unknown[]): string {
	const file = join(dir, 'pack-' + videos.length + '.json');
	writeFileSync(file, JSON.stringify({ format: 'oot-house-pack', version: 1, house: { name: 'x', videos } }));
	return file;
}

const TWO = pack([
	{ id: 'v-aaaaaaa1', url: 'https://www.youtube.com/watch?v=aaaaaaaaaaa', title: 'Brennan’s Bananas Foster', channel: 'Brennan’s New Orleans' },
	{ id: 'v-aaaaaaa2', url: 'https://vimeo.com/1', title: 'Champagne Service, the Cork', channel: 'LeCordon Bleu' }
]);

function run(mode: string, file: string, extra: string[] = []) {
	const r = spawnSync(process.execPath, ['--import', pathToFileURL(STUB).href, TOOL, '--file', file, ...extra], { encoding: 'utf8', env: { ...process.env, STUB_MODE: mode } });
	return { code: r.status, out: r.stdout + r.stderr, stdout: r.stdout };
}

describe('check-house-videos', () => {
	it('offline is a skip, said plainly, with exit 0', () => {
		for (const mode of ['offline', 'refused']) {
			const r = run(mode, TWO);
			expect(r.code, r.out).toBe(0);
			expect(r.out).toContain('the network is not reachable from here');
			expect(r.out).toContain('skipped, offline (2 unchecked)');
			expect(r.out).not.toContain('check-house-videos: OK');
		}
	});

	it('passes the same title and channel, folded past the dash pass, curly quotes and spacing', () => {
		const r = run('match', TWO);
		expect(r.code, r.out).toBe(0);
		expect(r.out).toContain('check-house-videos: OK (2 checked)');
	});

	it('fails a video that carries another title, and one that is gone', () => {
		const drift = run('drift', TWO);
		expect(drift.code, drift.out).toBe(1);
		expect(drift.out).toContain('DRIFTED  v-aaaaaaa2');
		expect(drift.out).toContain('found:    Something else entirely');
		const gone = run('gone', TWO);
		expect(gone.code, gone.out).toBe(1);
		expect(gone.out).toContain('2 gone');
	});

	it('names the channel oEmbed gives for a research record that has none, and keeps stdout one JSON document under --json', () => {
		const file = join(dir, 'research.json');
		writeFileSync(file, JSON.stringify({ videos: [{ id: 'brennans-bananas-foster', url: 'https://www.youtube.com/watch?v=aaaaaaaaaaa', title: "Brennan's Bananas Foster", channel: null }] }));
		const r = run('match', file, ['--json']);
		expect(r.code, r.out).toBe(0);
		const j = JSON.parse(r.stdout);
		expect(j.unrecorded).toEqual([{ id: 'brennans-bananas-foster', url: 'https://www.youtube.com/watch?v=aaaaaaaaaaa', title: "Brennan's Bananas Foster", channel: "Brennan's New Orleans" }]);
	});

	it('says a pack with no videos has nothing to check', () => {
		const r = run('match', pack([]));
		expect(r.code).toBe(0);
		expect(r.out).toContain('holds no videos yet');
	});
});
