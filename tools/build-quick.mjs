/**
 * build:quick — the full build minus ~1,450 prerendered detail pages.
 *
 * A wrapper script rather than an npm env prefix because `WT_FULL_PRERENDER=0
 * vite build` is a syntax error on Windows cmd, and this project lives on
 * Windows. Use for UI iteration; ship only from `npm run build`.
 */
import { spawnSync } from 'node:child_process';

const r = spawnSync('npx', ['vite', 'build'], {
	stdio: 'inherit',
	env: { ...process.env, WT_FULL_PRERENDER: '0' },
	shell: process.platform === 'win32'
});
process.exit(r.status ?? 1);
