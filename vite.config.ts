import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

// Empty for local dev and `npm run preview`. GitHub Pages serves from a
// subpath, so deploying there is just: BASE_PATH=/WorldTable npm run build
const base = (process.env.BASE_PATH ?? '') as '' | `/${string}`;

export default defineConfig({
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
				fallback: '200.html',
				precompress: false,
				strict: false
			}),

			paths: { base },

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
				 * The SvelteKit integration adds every prerendered route to the
				 * manifest on its own, which globPatterns cannot veto — that is
				 * 1,070 HTML files and 13.5MB. Drop them here, at the last stage
				 * the manifest passes through, keeping only 200.html: the shell
				 * that navigateFallback serves offline and hydrates from the
				 * cached JSON.
				 */
				manifestTransforms: [
					async (entries) => {
						const manifest = entries.filter(
							(e) => !e.url.endsWith('.html') || e.url.endsWith('200.html')
						);
						return { manifest, warnings: [] };
					}
				],
				navigateFallback: '/200.html',
				// Prerendered HTML is still served from the network when online;
				// offline, the shell picks it up and hydrates from cached JSON.
				navigateFallbackDenylist: [/^\/api\//],
				cleanupOutdatedCaches: true,
				clientsClaim: true,
				skipWaiting: false
			},
			devOptions: { enabled: false }
		})
	]
});
