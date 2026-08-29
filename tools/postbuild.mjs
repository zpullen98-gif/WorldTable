/**
 * Post-build: make the offline shell precachable, and GitHub Pages deployable.
 *
 * The service worker must precache the SPA shell BY URL to serve navigations
 * offline — but SvelteKit's preview middleware (and some hosts) treat the
 * configured fallback file as internal routing config and 404 direct requests
 * for it, whatever it is named. First 200.html, then fallback.html: both on
 * disk, both refused by the server, both silently failing the SW install.
 *
 * So the shell ships under a name no middleware owns:
 *   fallback.html  — the adapter's output; the server's business
 *   shell.html     — byte-identical copy; the service worker's business
 *   404.html       — third copy; GitHub Pages serves it for unknown paths,
 *                    which is how client-only routes work there pre-install
 */
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
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
 * .nojekyll — without it GitHub Pages serves nothing that works.
 *
 * Pages pipes the site through Jekyll by default, and Jekyll excludes every
 * path beginning with an underscore. SvelteKit puts EVERY script, stylesheet
 * and font in `_app/`, so the HTML deploys fine, 404s all of its own assets,
 * and renders a blank page. The failure looks like a broken app rather than a
 * missing config file, which is what makes it expensive.
 */
writeFileSync(join(BUILD, '.nojekyll'), '');

console.log('  postbuild: shell.html + 404.html copied from fallback.html, .nojekyll written');
