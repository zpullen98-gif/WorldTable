import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
// vitest/config, not vite: same defineConfig plus typing for the `test` block.
import { defineConfig } from 'vitest/config';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

// Empty for local dev and `npm run preview`. GitHub Pages serves from a
// subpath, so deploying there is just: BASE_PATH=/WorldTable npm run build
const base = (process.env.BASE_PATH ?? '') as '' | `/${string}`;

export default defineConfig({
	test: {
		include: ['src/**/*.test.ts']
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Static output: no server, no runtime. `fallback` gives us a SPA
			// entry point for routes we deliberately don't prerender, and is what
			// the service worker's navigation fallback serves offline.
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				/**
				 * NOT 200.html: vite preview (and other servers following the
				 * surge.sh convention) treat that exact filename as internal SPA
				 * config and 404 direct requests for it — which silently killed
				 * the service worker install, since the precache fetches it by
				 * URL. A name no server has opinions about.
				 */
				fallback: 'fallback.html',
				precompress: false,
				strict: false
			}),

			/**
			 * relative: false is load-bearing for the PWA. With SvelteKit's
			 * default relative paths, the vite-pwa virtual module registers
			 * `new Workbox('./sw.js', { scope: './' })` — so a first visit that
			 * lands on /recipe/x requests /recipe/sw.js (404) and the user never
			 * gets offline capability unless they happen to visit the root.
			 * Absolute paths register /sw.js with scope / from every page.
			 */
			paths: { base, relative: false },

			prerender: {
				// A dead internal link is a bug; a dead YouTube link is the
				// internet's problem. Fail the build on ours only.
				handleHttpError: 'fail',
				handleMissingId: 'fail'
			}
		}),

		SvelteKitPWA({
			strategies: 'generateSW',
			registerType: 'prompt', // never reload the page out from under a cook
			manifest: false, // static/manifest.webmanifest is the source
			workbox: {
				/**
				 * Precache the shell, the data and the fonts — NOT the ~1,500
				 * prerendered HTML pages, which would be ~20MB for content the
				 * navigateFallback already reconstructs from cached JSON.
				 * Prerendering and precaching are separate decisions.
				 */
				globPatterns: ['**/*.{js,css,woff2,png,svg,webmanifest}'],
				globIgnores: ['**/node_modules/**', '**/*.woff'],
				maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
				/**
				 * Supplying manifestTransforms REPLACES the SvelteKit plugin's own
				 * transform, so this one must do that job too — and not doing it
				 * was a total outage: the raw glob runs over .svelte-kit/output/,
				 * so every entry arrived prefixed "client/", every precache fetch
				 * 404'd, the install failed, and the browser discarded the
				 * registration. The service worker never survived a single build
				 * until this strip existed.
				 *
				 * The transform also drops the ~1,070 prerendered HTML pages
				 * (13.5MB for content the navigateFallback reconstructs from
				 * cached JSON) — prerendering and precaching are separate
				 * decisions.
				 */
				manifestTransforms: [
					async (entries) => {
						const manifest = entries
							.filter((e) => !e.url.includes('server/'))
							.map((e) => ({ ...e, url: e.url.replace(/^\/?client\//, '') }))
							.filter((e) => !e.url.endsWith('.html'));
						return { manifest, warnings: [] };
					}
				],
				/**
				 * The offline shell. adapter-static writes it to build/ after the
				 * glob has already run, so it cannot arrive via the manifest —
				 * it is added explicitly, revisioned per build.
				 */
				additionalManifestEntries: [
					// shell.html: postbuild copy of the adapter fallback, under a
					// name no server middleware claims (see tools/postbuild.mjs).
					{ url: 'shell.html', revision: String(Date.now()) }
				],
				/**
				 * RELATIVE, and load-bearing. Workbox resolves precache keys against
				 * the service worker's own location, so on GitHub Pages the entry
				 * above is cached as /WorldTable/shell.html — while a root-absolute
				 * '/shell.html' resolves to the domain root, which was never
				 * precached. createHandlerBoundToURL then throws non-precached-url
				 * and the NavigationRoute is NEVER REGISTERED: the app shipped with
				 * no offline navigation at all on the deployed origin, while every
				 * e2e test stayed green because localhost:4173 serves from the root
				 * where the two spellings happen to agree.
				 */
				navigateFallback: 'shell.html',
				/**
				 * Every navigation is answered from the precached shell, which then
				 * hydrates from cached JSON — that is the documented design, and the
				 * reason the 1,178 prerendered pages are deliberately NOT precached.
				 * Prerendered HTML serves the first visit, before the worker installs.
				 */
				navigateFallbackDenylist: [/^\/api\//],
				cleanupOutdatedCaches: true,
				clientsClaim: true,
				skipWaiting: false
			},
			devOptions: { enabled: false }
		})
	]
});
