/**
 * Post-build: make the offline shell precachable, and GitHub Pages deployable.
 *
 * The service worker must precache the SPA shell BY URL to serve navigations
 * offline, but SvelteKit's preview middleware (and some hosts) treat the
 * configured fallback file as internal routing config and 404 direct requests
 * for it, whatever it is named. First 200.html, then fallback.html: both on
 * disk, both refused by the server, both silently failing the SW install.
 *
 * So the shell ships under a name no middleware owns:
 *   fallback.html  : the adapter's output; the server's business
 *   shell.html     : byte-identical copy; the service worker's business
 *   404.html       : third copy; GitHub Pages serves it for unknown paths,
 *                    which is how client-only routes work there pre-install
 */
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BUILD = join(dirname(fileURLToPath(import.meta.url)), '..', 'build');
const src = join(BUILD, 'fallback.html');

if (!existsSync(src)) {
	console.error('postbuild: build/fallback.html missing. Did the adapter run?');
	process.exit(1);
}

copyFileSync(src, join(BUILD, 'shell.html'));
copyFileSync(src, join(BUILD, '404.html'));

/**
 * .nojekyll: without it GitHub Pages serves nothing that works.
 *
 * Pages pipes the site through Jekyll by default, and Jekyll excludes every
 * path beginning with an underscore. SvelteKit puts EVERY script, stylesheet
 * and font in `_app/`, so the HTML deploys fine, 404s all of its own assets,
 * and renders a blank page. The failure looks like a broken app rather than a
 * missing config file, which is what makes it expensive.
 */
writeFileSync(join(BUILD, '.nojekyll'), '');

/**
 * BUILD-SOURCE.txt: which commit of this repo the output was made from.
 *
 * The monorepo's `table/` wing is a COPY of this build directory, committed
 * into a different repository. Nothing recorded where a copy came from, so
 * drift between the committed wing and its source was undetectable: the wing
 * could be six commits stale and look identical to a fresh one.
 *
 * Written by the build rather than by the copier, so provenance travels WITH
 * the output and cannot be forgotten at copy time. `git` may be absent (a
 * tarball, a CI image without it), so a failure here records "unknown" and does
 * not stop the build - an unstamped build is a diagnosable state, and a build
 * that will not run because git is missing is not.
 */
function gitLine(args) {
	try {
		return execFileSync('git', args, { cwd: join(BUILD, '..'), encoding: 'utf8' }).trim();
	} catch {
		return '';
	}
}

const sha = gitLine(['rev-parse', 'HEAD']) || 'unknown';
const branch = gitLine(['rev-parse', '--abbrev-ref', 'HEAD']) || 'unknown';
const dirty = gitLine(['status', '--porcelain']) ? ' (uncommitted changes present)' : '';
writeFileSync(
	join(BUILD, 'BUILD-SOURCE.txt'),
	[
		'The World Table',
		`commit ${sha}${dirty}`,
		`branch ${branch}`,
		`built  ${new Date().toISOString()}`,
		'',
		'Written by tools/postbuild.mjs. The monorepo wing is a copy of this',
		'directory; this file is how a copy says where it came from.',
		''
	].join('\n')
);

console.log(`  postbuild: shell.html + 404.html copied from fallback.html, .nojekyll written`);
console.log(`  postbuild: BUILD-SOURCE.txt records ${branch} ${sha.slice(0, 7)}${dirty}`);
