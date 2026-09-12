import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
// vitest/config, not vite: same defineConfig plus typing for the `test` block.
import { defineConfig } from 'vitest/config';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

// Empty for local dev and `npm run preview`. GitHub Pages serves from a
// subpath, so deploying there is just: BASE_PATH=/WorldTable npm run build
const base = (process.env.BASE_PATH ?? '') as '' | `/${string}`;

// Built into Outside Of Time, this app is one wing of a single installable
// product and must point at that product's manifest at the origin root, or the
// browser offers a second, competing install from every recipe page. Built on
// its own it keeps its own. MANIFEST_HREF is what says which.
const manifestHref = process.env.MANIFEST_HREF ?? `${base}/manifest.webmanifest`;
// The home-screen label follows the same fact. iOS reads this meta rather than
// the manifest on older versions, so a wing labelled "World Table" would put a
// second, differently named icon on the phone of somebody who installed the
// whole product.
const appName = process.env.APP_NAME ?? 'World Table';
// The wing build, as opposed to a standalone one. The wing is the only build
// whose pages load the product's shared scripts, so it is the only one whose
// worker should go looking for them (see static/sw-shared.js).
const isWing = base === '/table';

export default defineConfig({
	// The safety page says when it was BUILT and deliberately never says
	// "current as of": an offline-first app cannot know when a food code
	// changed, and that label would manufacture confidence it has not earned.
	define: {
		__BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
		__MANIFEST_HREF__: JSON.stringify(manifestHref),
		__APP_NAME__: JSON.stringify(appName)
	},
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
				 * config and 404 direct requests for it, which silently killed
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
			 * `new Workbox('./sw.js', { scope: './' })`, so a first visit that
			 * lands on /recipe/x requests /recipe/sw.js (404) and the user never
			 * gets offline capability unless they happen to visit the root.
			 * Absolute paths register /sw.js with scope / from every page.
			 */
			paths: { base, relative: false },

			prerender: {
				// A dead internal link is a bug; a dead YouTube link is the
				// internet's problem. Fail the build on ours only.
				//
				// The single exception is the manifest. Built as a wing of
				// Outside Of Time this app deliberately links the product's
				// manifest at the origin root, which is outside `base`, so the
				// crawler reports it as an internal link that does not begin
				// with base. It is not this build's file and it is not this
				// build's job to serve it. Everything else still fails.
				handleHttpError: ({ path, message }) => {
					if (path === manifestHref) return;
					throw new Error(message);
				},
				handleMissingId: 'fail'
			}
		}),

		SvelteKitPWA({
			strategies: 'generateSW',
			registerType: 'prompt', // never reload the page out from under a cook
			manifest: false, // static/manifest.webmanifest is the source
			workbox: {
				/**
				 * Precache the shell, the data and the fonts, NOT the ~1,500
				 * prerendered HTML pages, which would be ~20MB for content the
				 * navigateFallback already reconstructs from cached JSON.
				 * Prerendering and precaching are separate decisions.
				 */
				globPatterns: ['**/*.{js,css,woff2,png,svg,webmanifest}'],
				// sw-shared.js is the worker's own import, not a page asset.
				globIgnores: ['**/node_modules/**', '**/*.woff', '**/sw-shared.js'],
				maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
				/**
				 * Supplying manifestTransforms REPLACES the SvelteKit plugin's own
				 * transform, so this one must do that job too, and not doing it
				 * was a total outage: the raw glob runs over .svelte-kit/output/,
				 * so every entry arrived prefixed "client/", every precache fetch
				 * 404'd, the install failed, and the browser discarded the
				 * registration. The service worker never survived a single build
				 * until this strip existed.
				 *
				 * The transform also drops the ~1,070 prerendered HTML pages
				 * (13.5MB for content the navigateFallback reconstructs from
				 * cached JSON): prerendering and precaching are separate
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
				 * glob has already run, so it cannot arrive via the manifest:
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
				 * above is cached as /WorldTable/shell.html, while a root-absolute
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
				 * hydrates from cached JSON: that is the documented design, and the
				 * reason the 1,178 prerendered pages are deliberately NOT precached.
				 * Prerendered HTML serves the first visit, before the worker installs.
				 */
				navigateFallbackDenylist: [/^\/api\//],
				/**
				 * /shared/ belongs to Outside Of Time, the site this build is a wing
				 * of, and sits outside this project entirely, so the glob cannot see
				 * it and the precache manifest can never list it. Without a rule here
				 * the nine shared scripts (config, profiles, home, auth, gate, locks,
				 * pass, log, return chip) are the only same-origin requests this app
				 * makes that fail offline, on exactly the trip-and-tunnel journeys the
				 * offline shell exists for: the chip is the wing's only way back to
				 * the hub, and the streak is recorded through OOT.profiles.
				 *
				 * Runtime rather than additionalManifestEntries deliberately: precache
				 * install is atomic, so listing a file this repo does not own would
				 * mean a missing sibling directory costs the entire offline shell.
				 * StaleWhileRevalidate degrades to nothing worse than today if the
				 * files are absent.
				 *
				 * "On first use" was the gap. The hub's "store every wing offline"
				 * button registers this worker and stops, so the cache stayed empty
				 * until the wing had been opened once online, and an offline first
				 * open had no chip and no streak. static/sw-shared.js, imported below
				 * in the wing build only, warms this cache at install, best-effort,
				 * one URL at a time. It caches the BARE URLs because the ?v=N stamp
				 * on shell.html's tags is written by the monorepo after the build.
				 *
				 * ONE KEY PER FILE. The cacheKeyWillBeUsed plugin below strips the
				 * search from every read AND every write on this route, so the
				 * install-time entry, the entry a ?v=26 request is served from and
				 * the entry the background revalidation writes are the same entry.
				 * This was matchOptions ignoreSearch, and that only widened the READ:
				 * the revalidation still wrote a stamped key that nothing ever read,
				 * the bare entry answered every stamp for good, and a new worker
				 * re-adding the bare key pushed it to the end of the cache, behind the
				 * stale stamped entries ignoreSearch matched first. The wing could go
				 * on serving an older shared script than the page asked for while the
				 * hub and the other four wings ran the new one. With the key stripped
				 * a bumped stamp is answered from the entry on hand and that entry is
				 * refreshed by the revalidation, the next open runs the new copy, and
				 * every install (every rebuild) refetches all nine.
				 *
				 * No maxAgeSeconds. These files are versioned by ?v=N, so a stale copy
				 * is replaced rather than going bad with age, and the 90 days that
				 * used to be here meant an installed wing unopened for a season lost
				 * its return chip the next time it was opened without signal. The
				 * other four wings precache the same nine files with no expiry.
				 * maxEntries bounds the cache instead: nine files, one key each.
				 *
				 * The cache name is prefixed oot- so the sibling wings' activate
				 * handlers, which reap only their own prefix, leave it alone. It is
				 * repeated in static/sw-shared.js and the two must agree.
				 */
				runtimeCaching: [
					{
						urlPattern: ({ url, sameOrigin }) =>
							sameOrigin && url.pathname.startsWith('/shared/'),
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'oot-shared-v1',
							plugins: [
								{
									cacheKeyWillBeUsed: async ({ request }) => {
										const u = new URL(request.url);
										u.search = '';
										return u.href;
									}
								}
							],
							expiration: { maxEntries: 16 }
						}
					}
				],
				...(isWing ? { importScripts: ['sw-shared.js'] } : {}),
				cleanupOutdatedCaches: true,
				clientsClaim: true,
				skipWaiting: false
			},
			devOptions: { enabled: false }
		})
	]
});
