/**
 * build:pages — the production build as GitHub Pages serves it.
 *
 * A wrapper rather than an env prefix, for the same reason build-quick.mjs is
 * one, plus a worse one specific to this variable:
 *
 *   `BASE_PATH=/WorldTable npm run build` is a syntax error on Windows cmd, and
 *   in Git Bash MSYS path conversion rewrites the leading slash — the value
 *   arrives as "C:/Program Files/Git/WorldTable" and SvelteKit rejects it with
 *   a message about root-relative paths that never mentions your shell. The
 *   documented deploy command silently could not work on this machine.
 *
 * Setting it in-process sidesteps every shell. Override the path with
 * BASE_PATH if the repo is ever renamed or served from a custom domain (where
 * the correct value is the empty string).
 */
import { spawnSync } from 'node:child_process';

const base = process.env.BASE_PATH ?? '/WorldTable';

if (base !== '' && !/^\/[^/]/.test(base)) {
	console.error(
		`build:pages: BASE_PATH must be empty or start with "/" and not end with one — got ${JSON.stringify(base)}`
	);
	process.exit(1);
}

const env = { ...process.env, BASE_PATH: base };
const opts = { stdio: 'inherit', env, shell: process.platform === 'win32' };

console.log(`\n  build:pages — base ${JSON.stringify(base)}\n`);

const build = spawnSync('npx', ['vite', 'build'], opts);
if (build.status !== 0) process.exit(build.status ?? 1);

const post = spawnSync('node', ['tools/postbuild.mjs'], opts);
process.exit(post.status ?? 1);
